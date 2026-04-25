/**
 * Rule registry — single import surface for the analyzer.
 */

import type { Rule } from "../types.js";

import { assignAttackRule } from "./assign-attack.js";
import { blinksMismatchRule } from "./blinks-mismatch.js";
import { durableNonceAbuseRule } from "./durable-nonce-abuse.js";
import { hiddenTokenApprovalRule } from "./hidden-token-approval.js";
import { transferHookAbuseRule } from "./transfer-hook-abuse.js";

export const ALL_RULES: Rule[] = [
  assignAttackRule,
  hiddenTokenApprovalRule,
  transferHookAbuseRule,
  durableNonceAbuseRule,
  blinksMismatchRule,
];

export {
  assignAttackRule,
  blinksMismatchRule,
  durableNonceAbuseRule,
  hiddenTokenApprovalRule,
  transferHookAbuseRule,
};
