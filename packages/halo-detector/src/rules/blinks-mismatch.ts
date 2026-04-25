/**
 * Rule: blinks-mismatch
 *
 * Solana Blinks let a dApp ship a "click-to-execute" link with a user-facing
 * description. The drainer twist: show the user a friendly description ("Mint
 * free NFT") but return a transaction that does something completely different
 * (assign owner to attacker, approve all token accounts, etc.).
 *
 * This rule cross-references the user-facing Blinks description with the
 * actual top-level program(s) the transaction touches. If the description
 * implies one set of recipient programs and the transaction targets others,
 * we flag it.
 */

import {
  ASSOCIATED_TOKEN_PROGRAM,
  COMPUTE_BUDGET_PROGRAM,
  SPL_TOKEN_PROGRAM,
  SYSTEM_PROGRAM,
  TOKEN_2022_PROGRAM,
} from "../constants.js";
import type { AnalyzerConfig, DecodedTransaction, Finding, Rule } from "../types.js";

/**
 * Programs that count as "infrastructure" rather than user-facing — they show
 * up in almost every tx (account creation, fee setting). The mismatch check
 * skips them so we don't false-positive on housekeeping instructions.
 */
const INFRA_PROGRAMS = new Set<string>([
  SYSTEM_PROGRAM,
  SPL_TOKEN_PROGRAM,
  TOKEN_2022_PROGRAM,
  ASSOCIATED_TOKEN_PROGRAM,
  COMPUTE_BUDGET_PROGRAM,
]);

export const blinksMismatchRule: Rule = {
  id: "blinks-mismatch",
  severity: "critical",
  description:
    "Transaction touches programs the Blinks description didn't imply — possible bait-and-switch",

  evaluate(tx: DecodedTransaction, config: AnalyzerConfig): Finding[] {
    const ctx = config.blinksContext;
    if (!ctx) return [];

    const expected = new Set(ctx.expectedRecipientPrograms);
    const userFacingPrograms = new Set<string>();
    for (const ix of tx.instructions) {
      if (INFRA_PROGRAMS.has(ix.programId)) continue;
      userFacingPrograms.add(ix.programId);
    }

    const unexpected = [...userFacingPrograms].filter((p) => !expected.has(p));
    if (unexpected.length === 0) return [];

    return [
      {
        ruleId: "blinks-mismatch",
        severity: "critical",
        reason: `The Blinks description ("${ctx.description}") implied programs ${[...expected].join(", ") || "(none)"} but the transaction touches ${unexpected.join(", ")}. This is a classic bait-and-switch drainer pattern.`,
        evidence: {
          description: ctx.description,
          expectedPrograms: [...expected],
          unexpectedPrograms: unexpected,
        },
      },
    ];
  },
};
