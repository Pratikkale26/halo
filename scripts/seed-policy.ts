/**
 * Register the demo Kamino-style policy on devnet.
 *
 * Pre-conditions:
 *   - .keys/policy-authority.json exists (run scripts/gen-keypair.sh)
 *   - .keys/halo-program.json exists and the program is deployed
 *   - target/idl/halo.json + target/types/halo.ts have been built
 *
 * Usage:
 *   pnpm exec ts-node scripts/seed-policy.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram, Connection } from "@solana/web3.js";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

import { Halo } from "../target/types/halo";

const ROOT = join(__dirname, "..");
const KEYS = join(ROOT, ".keys");

function loadKeypair(name: string): Keypair {
  return Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(readFileSync(join(KEYS, `${name}.json`), "utf8"))),
  );
}

function canonicaliseJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== "object") return value;
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj).sort()) out[k] = sortKeys(obj[k]);
  return out;
}

const POLICY = {
  name: "kamino-deposit-v1",
  description: "Halo-attested confirmation for Kamino deposits >= $1k",
  maxValueUsd: 100000,
  minStepUpUsd: 1000,
  allowedPrograms: [
    "11111111111111111111111111111111",
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
    "KaminoLending111111111111111111111111111111",
  ],
  blockOn: ["criticalDrainerPattern"],
};

async function main() {
  const policyAuthority = loadKeypair("policy-authority");
  const programKeypair = loadKeypair("halo-program");
  const programId = programKeypair.publicKey;

  const connection = new Connection(
    process.env.RPC_URL ?? "https://api.devnet.solana.com",
    "confirmed",
  );
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(policyAuthority),
    { commitment: "confirmed" },
  );
  anchor.setProvider(provider);

  const idl = JSON.parse(
    readFileSync(join(ROOT, "target/idl/halo.json"), "utf8"),
  );
  const program = new Program<Halo>(idl, provider);

  const policyJson = canonicaliseJson(POLICY);
  const policyHash = Array.from(createHash("sha256").update(policyJson).digest());

  const [policyPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("policy"), Buffer.from(policyHash)],
    programId,
  );

  console.log(`policy authority: ${policyAuthority.publicKey.toBase58()}`);
  console.log(`policy PDA:       ${policyPda.toBase58()}`);
  console.log(`policy hash hex:  ${Buffer.from(policyHash).toString("hex")}`);

  const sig = await program.methods
    .registerPolicy({
      policyHash,
      schemaUri: "https://github.com/Pratikkale26/vaultguard/blob/main/policies/kamino-deposit-v1.json",
      maxRiskScore: 30,
      maxAgeSecs: new anchor.BN(60),
    })
    .accounts({
      policy: policyPda,
      authority: policyAuthority.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log(`registered. tx: ${sig}`);
  console.log(
    `explorer: https://explorer.solana.com/tx/${sig}?cluster=devnet`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
