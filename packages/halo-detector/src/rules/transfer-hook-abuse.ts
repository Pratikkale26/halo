/**
 * Rule: transfer-hook-abuse
 *
 * Token-2022 lets a mint declare a "transfer hook" — a program CPI'd into on
 * every transfer. Drainers exploit this by:
 *  - using a token whose mint references an attacker-controlled hook program;
 *  - tricking the user into transferring even 1 lamport of the token;
 *  - the hook then performs follow-on actions (drain neighbouring accounts,
 *    grant approvals, etc.).
 *
 * The rule fires when a Token-2022 transfer/transferChecked references a
 * transfer-hook program that's not on the dApp's allowed list. Attached
 * transfer-hook program is conventionally encoded as the *last* writable
 * account in the instruction's account list (see TokenkegQ docs).
 */

import { TOKEN_2022_PROGRAM, TOKEN_INSTRUCTION } from "../constants.js";
import { tokenInstructionDiscriminator } from "../decoder.js";
import type { AnalyzerConfig, DecodedTransaction, Finding, Rule } from "../types.js";

const TRANSFER_DISCRIMINATORS = new Set<number>([
  TOKEN_INSTRUCTION.Transfer,
  TOKEN_INSTRUCTION.TransferChecked,
]);

export const transferHookAbuseRule: Rule = {
  id: "transfer-hook-abuse",
  severity: "critical",
  description:
    "Token-2022 transfer references a transfer-hook program the policy did not allow-list",

  evaluate(tx: DecodedTransaction, config: AnalyzerConfig): Finding[] {
    const findings: Finding[] = [];
    const allowed = new Set(config.allowedPrograms);

    for (const ix of tx.instructions) {
      if (ix.programId !== TOKEN_2022_PROGRAM) continue;

      const disc = tokenInstructionDiscriminator(ix.data);
      if (disc === null || !TRANSFER_DISCRIMINATORS.has(disc)) continue;

      // The transfer hook program is conventionally appended as an extra
      // account beyond the standard Transfer/TransferChecked layout. The
      // standard layouts have 3 (Transfer) or 4 (TransferChecked) accounts.
      const baseAccounts = disc === TOKEN_INSTRUCTION.Transfer ? 3 : 4;
      if (ix.accounts.length <= baseAccounts) continue;

      // Anything past the standard layout is a hook program account or
      // additional account the hook will read. We treat the first extra
      // account as the hook program ID.
      const hookProgram = ix.accounts[baseAccounts];
      if (allowed.has(hookProgram)) continue;

      findings.push({
        ruleId: "transfer-hook-abuse",
        severity: "critical",
        reason: `Instruction #${ix.index} is a Token-2022 transfer that invokes a transfer-hook program ("${hookProgram}") not allow-listed by the dApp policy. Transfer hooks can perform arbitrary CPI on every transfer, including draining other token accounts.`,
        evidence: {
          instructionIndex: ix.index,
          discriminator: disc,
          hookProgram,
        },
      });
    }

    return findings;
  },
};
