/**
 * Helpers for deriving the Halo Attestation PDA address. The actual on-chain
 * issue_attestation instruction is built and dispatched by HaloClient via the
 * Anchor program client, but the address derivation is pure and useful to
 * dApps that want to anticipate the attestation address before a tx is signed.
 */

import { PublicKey } from "@solana/web3.js";

const ATTESTATION_SEED = Buffer.from("attestation");
const POLICY_SEED = Buffer.from("policy");
const ISSUER_SEED = Buffer.from("issuer");

export function deriveAttestationPda(
  programId: PublicKey,
  user: PublicKey,
  txHash: Uint8Array,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [ATTESTATION_SEED, user.toBuffer(), Buffer.from(txHash)],
    programId,
  );
}

export function derivePolicyPda(
  programId: PublicKey,
  policyHash: Uint8Array,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [POLICY_SEED, Buffer.from(policyHash)],
    programId,
  );
}

export function deriveIssuerAuthorityPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([ISSUER_SEED], programId);
}
