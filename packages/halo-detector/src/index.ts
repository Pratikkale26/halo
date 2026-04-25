/**
 * @halo/detector — public entry point.
 */

export { Analyzer } from "./analyzer.js";
export { ALL_RULES } from "./rules/index.js";
export {
  assignAttackRule,
  blinksMismatchRule,
  durableNonceAbuseRule,
  hiddenTokenApprovalRule,
  transferHookAbuseRule,
} from "./rules/index.js";
export {
  SEVERITY_WEIGHTS,
  SPL_TOKEN_PROGRAM,
  SYSTEM_PROGRAM,
  TOKEN_2022_PROGRAM,
  ASSOCIATED_TOKEN_PROGRAM,
  COMPUTE_BUDGET_PROGRAM,
} from "./constants.js";

export type {
  AnalyzerConfig,
  BlinksContext,
  DecodedInstruction,
  DecodedTransaction,
  Finding,
  PubkeyLike,
  Report,
  Rule,
  Severity,
} from "./types.js";
