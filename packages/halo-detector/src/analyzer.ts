/**
 * Analyzer — runs the rule library over a decoded transaction and returns a
 * single Report with an aggregate risk score.
 */

import { SEVERITY_WEIGHTS } from "./constants.js";
import { ALL_RULES } from "./rules/index.js";
import type {
  AnalyzerConfig,
  DecodedTransaction,
  Finding,
  Report,
  Rule,
} from "./types.js";

export class Analyzer {
  private readonly rules: Rule[];

  constructor(
    private readonly config: AnalyzerConfig,
    rules?: Rule[],
  ) {
    const enabled = config.enabledRules ? new Set(config.enabledRules) : null;
    this.rules = (rules ?? ALL_RULES).filter(
      (r) => !enabled || enabled.has(r.id),
    );
  }

  analyze(tx: DecodedTransaction): Report {
    const findings: Finding[] = [];
    for (const rule of this.rules) {
      try {
        for (const f of rule.evaluate(tx, this.config)) {
          findings.push(f);
        }
      } catch (err) {
        // A buggy rule must never crash the analyzer — log it as info and
        // move on. The host SDK can route this to telemetry.
        findings.push({
          ruleId: rule.id,
          severity: "info",
          reason: `Rule "${rule.id}" threw during evaluation; skipping. ${(err as Error).message}`,
          evidence: { error: String(err) },
        });
      }
    }

    const riskScore = this.computeRiskScore(findings);
    const shouldBlock = findings.some((f) => f.severity === "critical");

    return { riskScore, shouldBlock, findings };
  }

  /**
   * Aggregate risk: take the max single-finding weight, add a small bump per
   * additional finding. Capped at 100.
   */
  private computeRiskScore(findings: Finding[]): number {
    if (findings.length === 0) return 0;
    const peak = Math.max(...findings.map((f) => SEVERITY_WEIGHTS[f.severity]));
    const bonus = Math.min(20, (findings.length - 1) * 5);
    return Math.min(100, peak + bonus);
  }
}
