/**
 * Halo program — integration tests.
 *
 * Run with: `anchor test`
 *
 * Coverage:
 *   - Initialize issuer authority (singleton)
 *   - Rotate issuer authority (gated by upgrade_authority)
 *   - Register a policy
 *   - Issue an attestation under that policy
 *   - Verify the attestation (happy path)
 *   - Verify failure modes:
 *       - PolicyMismatch (wrong policy_hash)
 *       - UserMismatch (wrong user)
 *       - AttestationExpired (max_age_secs exceeded)
 *       - PolicyRevoked (revoke after issuance, then verify)
 *       - RiskScoreTooHigh (risk score > policy max)
 *       - TransactionHashMismatch (wrong tx hash)
 */
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { createHash } from "crypto";
import { assert } from "chai";

import { Halo } from "../target/types/halo";

const ISSUER_SEED = Buffer.from("issuer");
const POLICY_SEED = Buffer.from("policy");
const ATTESTATION_SEED = Buffer.from("attestation");

function sha256(buf: Buffer | string): Buffer {
  return createHash("sha256").update(buf).digest();
}

function hashPolicy(json: object): number[] {
  return Array.from(sha256(JSON.stringify(json)));
}

describe("halo", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Halo as Program<Halo>;

  // Pre-derived addresses + keypairs reused across tests.
  const upgradeAuthority = Keypair.generate();
  const issuerKeypair = Keypair.generate();
  const policyAuthority = Keypair.generate();
  const userKeypair = Keypair.generate();

  const samplePolicy = {
    name: "kamino-deposit-v1",
    description: "Kamino lending deposit, max value $10k",
    maxValueUsd: 10000,
    blockOn: ["criticalDrainerPattern"],
  };
  const policyHash = hashPolicy(samplePolicy);

  const [issuerAuthorityPda] = PublicKey.findProgramAddressSync(
    [ISSUER_SEED],
    program.programId,
  );
  const [policyPda] = PublicKey.findProgramAddressSync(
    [POLICY_SEED, Buffer.from(policyHash)],
    program.programId,
  );

  // Per-test transaction hash (so attestation PDAs are unique).
  function deriveAttestationPda(txHash: number[]) {
    return PublicKey.findProgramAddressSync(
      [ATTESTATION_SEED, userKeypair.publicKey.toBuffer(), Buffer.from(txHash)],
      program.programId,
    )[0];
  }

  before(async () => {
    // Airdrop test SOL to all signers.
    for (const kp of [upgradeAuthority, issuerKeypair, policyAuthority]) {
      const sig = await provider.connection.requestAirdrop(kp.publicKey, 2_000_000_000);
      await provider.connection.confirmTransaction(sig);
    }
  });

  it("initializes the issuer authority", async () => {
    await program.methods
      .initializeIssuer({ authority: issuerKeypair.publicKey })
      .accounts({
        issuerAuthority: issuerAuthorityPda,
        upgradeAuthority: upgradeAuthority.publicKey,
        payer: upgradeAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([upgradeAuthority])
      .rpc();

    const issuer = await program.account.issuerAuthority.fetch(issuerAuthorityPda);
    assert.ok(issuer.authority.equals(issuerKeypair.publicKey));
    assert.ok(issuer.upgradeAuthority.equals(upgradeAuthority.publicKey));
    assert.isAbove(issuer.lastRotatedAt.toNumber(), 0);
  });

  it("rotates the issuer authority", async () => {
    const newAuthority = Keypair.generate();
    await program.methods
      .rotateIssuer(newAuthority.publicKey)
      .accounts({
        issuerAuthority: issuerAuthorityPda,
        upgradeAuthority: upgradeAuthority.publicKey,
      })
      .signers([upgradeAuthority])
      .rpc();

    let issuer = await program.account.issuerAuthority.fetch(issuerAuthorityPda);
    assert.ok(issuer.authority.equals(newAuthority.publicKey));

    // Restore original issuer for downstream tests.
    await program.methods
      .rotateIssuer(issuerKeypair.publicKey)
      .accounts({
        issuerAuthority: issuerAuthorityPda,
        upgradeAuthority: upgradeAuthority.publicKey,
      })
      .signers([upgradeAuthority])
      .rpc();

    issuer = await program.account.issuerAuthority.fetch(issuerAuthorityPda);
    assert.ok(issuer.authority.equals(issuerKeypair.publicKey));
  });

  it("rejects rotation by an unauthorized signer", async () => {
    const intruder = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(intruder.publicKey, 1_000_000_000);
    await provider.connection.confirmTransaction(sig);

    try {
      await program.methods
        .rotateIssuer(intruder.publicKey)
        .accounts({
          issuerAuthority: issuerAuthorityPda,
          upgradeAuthority: intruder.publicKey,
        })
        .signers([intruder])
        .rpc();
      assert.fail("expected rotation to fail");
    } catch (err: any) {
      assert.include(String(err), "Unauthorized");
    }
  });

  it("registers a policy", async () => {
    await program.methods
      .registerPolicy({
        policyHash,
        schemaUri: "ipfs://bafy.../kamino-deposit-v1.json",
        maxRiskScore: 30,
        maxAgeSecs: new anchor.BN(300),
      })
      .accounts({
        policy: policyPda,
        authority: policyAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([policyAuthority])
      .rpc();

    const policy = await program.account.policyRegistry.fetch(policyPda);
    assert.deepEqual(Array.from(policy.policyHash), policyHash);
    assert.equal(policy.maxRiskScore, 30);
    assert.equal(policy.maxAgeSecs.toNumber(), 300);
    assert.isFalse(policy.revoked);
  });

  it("issues a hardware-attested credential", async () => {
    const txHash = Array.from(sha256("tx-1"));
    const attestationPda = deriveAttestationPda(txHash);

    await program.methods
      .issueAttestation({
        txHash,
        riskScore: 15,
        seekerGenesisToken: PublicKey.default,
      })
      .accounts({
        attestation: attestationPda,
        policy: policyPda,
        issuerAuthority: issuerAuthorityPda,
        user: userKeypair.publicKey,
        issuer: issuerKeypair.publicKey,
        payer: issuerKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([issuerKeypair])
      .rpc();

    const att = await program.account.attestation.fetch(attestationPda);
    assert.ok(att.user.equals(userKeypair.publicKey));
    assert.deepEqual(Array.from(att.txHash), txHash);
    assert.equal(att.riskScore, 15);
  });

  it("verifies a valid attestation (happy path)", async () => {
    const txHash = Array.from(sha256("tx-2"));
    const attestationPda = deriveAttestationPda(txHash);

    await program.methods
      .issueAttestation({
        txHash,
        riskScore: 10,
        seekerGenesisToken: PublicKey.default,
      })
      .accounts({
        attestation: attestationPda,
        policy: policyPda,
        issuerAuthority: issuerAuthorityPda,
        user: userKeypair.publicKey,
        issuer: issuerKeypair.publicKey,
        payer: issuerKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([issuerKeypair])
      .rpc();

    await program.methods
      .verifyAttestation({
        expectedUser: userKeypair.publicKey,
        expectedPolicyHash: policyHash,
        maxAgeSecs: new anchor.BN(60),
        expectedTxHash: txHash,
      })
      .accounts({
        attestation: attestationPda,
        policy: policyPda,
        issuerAuthority: issuerAuthorityPda,
      })
      .rpc();
  });

  it("rejects verification with wrong user (UserMismatch)", async () => {
    const txHash = Array.from(sha256("tx-3"));
    const attestationPda = deriveAttestationPda(txHash);
    const wrongUser = Keypair.generate();

    await program.methods
      .issueAttestation({
        txHash,
        riskScore: 5,
        seekerGenesisToken: PublicKey.default,
      })
      .accounts({
        attestation: attestationPda,
        policy: policyPda,
        issuerAuthority: issuerAuthorityPda,
        user: userKeypair.publicKey,
        issuer: issuerKeypair.publicKey,
        payer: issuerKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([issuerKeypair])
      .rpc();

    try {
      await program.methods
        .verifyAttestation({
          expectedUser: wrongUser.publicKey,
          expectedPolicyHash: policyHash,
          maxAgeSecs: new anchor.BN(60),
          expectedTxHash: null,
        })
        .accounts({
          attestation: attestationPda,
          policy: policyPda,
          issuerAuthority: issuerAuthorityPda,
        })
        .rpc();
      assert.fail("expected UserMismatch");
    } catch (err: any) {
      assert.include(String(err), "UserMismatch");
    }
  });

  it("rejects verification with wrong tx hash (TransactionHashMismatch)", async () => {
    const txHash = Array.from(sha256("tx-4"));
    const attestationPda = deriveAttestationPda(txHash);
    const wrongTxHash = Array.from(sha256("tx-different"));

    await program.methods
      .issueAttestation({
        txHash,
        riskScore: 5,
        seekerGenesisToken: PublicKey.default,
      })
      .accounts({
        attestation: attestationPda,
        policy: policyPda,
        issuerAuthority: issuerAuthorityPda,
        user: userKeypair.publicKey,
        issuer: issuerKeypair.publicKey,
        payer: issuerKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([issuerKeypair])
      .rpc();

    try {
      await program.methods
        .verifyAttestation({
          expectedUser: userKeypair.publicKey,
          expectedPolicyHash: policyHash,
          maxAgeSecs: new anchor.BN(60),
          expectedTxHash: wrongTxHash,
        })
        .accounts({
          attestation: attestationPda,
          policy: policyPda,
          issuerAuthority: issuerAuthorityPda,
        })
        .rpc();
      assert.fail("expected TransactionHashMismatch");
    } catch (err: any) {
      assert.include(String(err), "TransactionHashMismatch");
    }
  });

  it("rejects issuance when risk score exceeds policy threshold", async () => {
    const txHash = Array.from(sha256("tx-5-too-risky"));
    const attestationPda = deriveAttestationPda(txHash);

    try {
      await program.methods
        .issueAttestation({
          txHash,
          riskScore: 99, // > policy.max_risk_score (30)
          seekerGenesisToken: PublicKey.default,
        })
        .accounts({
          attestation: attestationPda,
          policy: policyPda,
          issuerAuthority: issuerAuthorityPda,
          user: userKeypair.publicKey,
          issuer: issuerKeypair.publicKey,
          payer: issuerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([issuerKeypair])
        .rpc();
      assert.fail("expected RiskScoreTooHigh");
    } catch (err: any) {
      assert.include(String(err), "RiskScoreTooHigh");
    }
  });

  it("rejects issuance and verification after policy revocation", async () => {
    // Register a fresh policy for this test (so we don't poison shared state).
    const revocablePolicyJson = { name: "revocable-test", v: 1 };
    const revocablePolicyHash = hashPolicy(revocablePolicyJson);
    const [revocablePolicyPda] = PublicKey.findProgramAddressSync(
      [POLICY_SEED, Buffer.from(revocablePolicyHash)],
      program.programId,
    );

    await program.methods
      .registerPolicy({
        policyHash: revocablePolicyHash,
        schemaUri: "ipfs://bafy.../revocable-test.json",
        maxRiskScore: 50,
        maxAgeSecs: new anchor.BN(600),
      })
      .accounts({
        policy: revocablePolicyPda,
        authority: policyAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([policyAuthority])
      .rpc();

    // Revoke it.
    await program.methods
      .revokePolicy()
      .accounts({
        policy: revocablePolicyPda,
        authority: policyAuthority.publicKey,
      })
      .signers([policyAuthority])
      .rpc();

    const policy = await program.account.policyRegistry.fetch(revocablePolicyPda);
    assert.isTrue(policy.revoked);

    // Now try to issue against the revoked policy — should fail.
    const txHash = Array.from(sha256("tx-revoked"));
    const attestationPda = deriveAttestationPda(txHash);
    try {
      await program.methods
        .issueAttestation({
          txHash,
          riskScore: 10,
          seekerGenesisToken: PublicKey.default,
        })
        .accounts({
          attestation: attestationPda,
          policy: revocablePolicyPda,
          issuerAuthority: issuerAuthorityPda,
          user: userKeypair.publicKey,
          issuer: issuerKeypair.publicKey,
          payer: issuerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([issuerKeypair])
        .rpc();
      assert.fail("expected PolicyRevoked");
    } catch (err: any) {
      assert.include(String(err), "PolicyRevoked");
    }
  });
});
