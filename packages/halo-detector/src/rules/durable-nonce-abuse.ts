/**
 * Rule: durable-nonce-abuse
 *
 * Solana durable nonces let a transaction be signed now and submitted later
 * (without a recent blockhash freshness window). Drainers use this to delay
 * execution past the user's next wallet check — sign now, drain in a week.
 *
 * The rule fires when:
 *  - the transaction includes `system_program::AdvanceNonceAccount`;
 *  - AND the transaction has not been opted into "durable mode" by the dApp
 *    (signalled by the dApp passing `allowsDurableNonce` in the policy
 *    metadata, which we proxy via `enabledRules` semantics — see decision in
 *    HALO.md §5).
 *
 * Severity is `warning` rather than `critical` because legitimate apps
 * (treasury automation, scheduled DCA) genuinely use durable nonces.
 */

import { SYSTEM_INSTRUCTION, SYSTEM_PROGRAM } from "../constants.js";
import { systemInstructionDiscriminator } from "../decoder.js";
import type { AnalyzerConfig, DecodedTransaction, Finding, Rule } from "../types.js";

export const durableNonceAbuseRule: Rule = {
  id: "durable-nonce-abuse",
  severity: "warning",
  description:
    "Transaction uses a durable nonce — could allow delayed execution past the user's review window",

  evaluate(tx: DecodedTransaction, _config: AnalyzerConfig): Finding[] {
    const findings: Finding[] = [];

    // A tx is durable-noncey if either the parsed `hasDurableNonce` flag is
    // set OR there's an AdvanceNonceAccount instruction in the bundle.
    let advanceIndex: number | null = null;
    for (const ix of tx.instructions) {
      if (ix.programId !== SYSTEM_PROGRAM) continue;
      const disc = systemInstructionDiscriminator(ix.data);
      if (disc === SYSTEM_INSTRUCTION.AdvanceNonceAccount) {
        advanceIndex = ix.index;
        break;
      }
    }

    if (!tx.hasDurableNonce && advanceIndex === null) return findings;

    findings.push({
      ruleId: "durable-nonce-abuse",
      severity: "warning",
      reason:
        "This transaction uses a durable nonce, which means it can be submitted to the chain at any future time after you sign — not just within the usual ~2-minute window. Confirm the dApp legitimately needs delayed execution.",
      evidence: {
        instructionIndex: advanceIndex,
        hasDurableNonceFlag: tx.hasDurableNonce,
      },
    });

    return findings;
  },
};
