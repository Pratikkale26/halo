/**
 * Rule: hidden-token-approval
 *
 * Detects `spl_token::Approve` (or Token-2022 equivalent) instructions for
 * delegate authorities the user wasn't shown. The standard drainer flow is:
 * "let me look at your wallet" → silently insert an `Approve` for an attacker
 * delegate → drainer-bot empties the account later.
 *
 * The rule treats *any* Approve in a transaction whose user-facing description
 * doesn't mention "approve" / "allowance" / "delegate" as suspicious.
 */

import { SPL_TOKEN_PROGRAM, TOKEN_2022_PROGRAM, TOKEN_INSTRUCTION } from "../constants.js";
import { tokenInstructionDiscriminator } from "../decoder.js";
import type { AnalyzerConfig, DecodedTransaction, Finding, Rule } from "../types.js";

const TOKEN_PROGRAMS = new Set([SPL_TOKEN_PROGRAM, TOKEN_2022_PROGRAM]);
const APPROVE_DISCRIMINATORS = new Set<number>([
  TOKEN_INSTRUCTION.Approve,
  TOKEN_INSTRUCTION.ApproveChecked,
]);

const APPROVE_KEYWORDS = ["approve", "allowance", "delegate", "authorize"];

export const hiddenTokenApprovalRule: Rule = {
  id: "hidden-token-approval",
  severity: "critical",
  description:
    "Hidden spl_token::Approve grants a delegate the user wasn't told about",

  evaluate(tx: DecodedTransaction, config: AnalyzerConfig): Finding[] {
    const findings: Finding[] = [];

    const description = config.blinksContext?.description?.toLowerCase() ?? "";
    const userExpectsApproval = APPROVE_KEYWORDS.some((kw) =>
      description.includes(kw),
    );

    for (const ix of tx.instructions) {
      if (!TOKEN_PROGRAMS.has(ix.programId)) continue;

      const disc = tokenInstructionDiscriminator(ix.data);
      if (disc === null || !APPROVE_DISCRIMINATORS.has(disc)) continue;

      if (userExpectsApproval) continue;

      // Approve account layout:
      //   [0] source account (the user's token account)
      //   [1] delegate (who gets the approval)
      //   [2] owner (the user)
      const sourceAccount = ix.accounts[0];
      const delegate = ix.accounts[1];

      findings.push({
        ruleId: "hidden-token-approval",
        severity: "critical",
        reason: `Instruction #${ix.index} grants a token-account delegate ("${delegate}"), but the user-facing description doesn't mention an approval. This is a hallmark drainer pattern.`,
        evidence: {
          instructionIndex: ix.index,
          program: ix.programId,
          sourceAccount,
          delegate,
          discriminator: disc,
        },
      });
    }

    return findings;
  },
};
