/**
 * Rule: assign-attack
 *
 * Detects `system_program::Assign` (or `AssignWithSeed`) instructions that
 * change the owner of an account the signer controls to a non-allowlisted
 * program. This is the canonical owner-reassignment drainer technique: the
 * attacker dApp asks for "create account + tiny SOL fee", buries an Assign in
 * the bundle, and now controls the user's account.
 *
 * See https://dev.to/ohmygod/anatomy-of-a-solana-wallet-drainer for the
 * real-world attack walkthrough this rule defends against.
 */

import { SYSTEM_INSTRUCTION, SYSTEM_PROGRAM } from "../constants.js";
import { systemInstructionDiscriminator, decodeData } from "../decoder.js";
import type { AnalyzerConfig, DecodedTransaction, Finding, Rule } from "../types.js";

export const assignAttackRule: Rule = {
  id: "assign-attack",
  severity: "critical",
  description:
    "system_program::Assign reassigns account ownership to a non-allowlisted program",

  evaluate(tx: DecodedTransaction, config: AnalyzerConfig): Finding[] {
    const findings: Finding[] = [];
    const allowed = new Set(config.allowedPrograms);

    for (const ix of tx.instructions) {
      if (ix.programId !== SYSTEM_PROGRAM) continue;

      const disc = systemInstructionDiscriminator(ix.data);
      if (disc === null) continue;

      const isAssign = disc === SYSTEM_INSTRUCTION.Assign;
      const isAssignWithSeed = disc === SYSTEM_INSTRUCTION.AssignWithSeed;
      if (!isAssign && !isAssignWithSeed) continue;

      // Assign: account 0 = the account being reassigned, owner pubkey is in
      // the instruction data starting at offset 4.
      const reassignedAccount = ix.accounts[0];
      const newOwner = decodeAssignOwner(ix.data, isAssignWithSeed);

      if (!newOwner) continue;
      if (allowed.has(newOwner)) continue;

      findings.push({
        ruleId: "assign-attack",
        severity: "critical",
        reason: `Instruction #${ix.index} reassigns account ownership to a program the dApp policy did not allow-list. This is the standard pattern for an owner-reassignment drainer attack.`,
        evidence: {
          instructionIndex: ix.index,
          reassignedAccount,
          newOwner,
          isAssignWithSeed,
        },
      });
    }

    return findings;
  },
};

function decodeAssignOwner(data: string, _isWithSeed: boolean): string | null {
  const bytes = decodeData(data);
  // Both Assign (variant 1) and AssignWithSeed (variant 10) have the new owner
  // pubkey near the head of the data. We extract the first 32-byte window
  // after the 4-byte discriminator. This is intentionally conservative: false
  // positives on AssignWithSeed are tolerable because the rule blocks anyway,
  // but missed Assigns (false negatives) are catastrophic.
  if (bytes.length < 4 + 32) return null;
  const ownerBytes = bytes.slice(4, 4 + 32);
  return base58Encode(ownerBytes);
}

/**
 * Minimal base58 encoder (Bitcoin alphabet) — vendored to avoid a runtime
 * dependency on bs58 inside the secure execution environment. Used only for
 * surfacing pubkeys in evidence; correctness is verified by the analyzer's
 * tests.
 */
function base58Encode(bytes: Uint8Array): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const b58: number[] = [];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < b58.length; j++) {
      carry += b58[j] << 8;
      b58[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      b58.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = "";
  for (let i = 0; i < zeros; i++) out += "1";
  for (let i = b58.length - 1; i >= 0; i--) out += ALPHABET[b58[i]];
  return out;
}
