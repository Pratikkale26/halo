/**
 * @halo/sdk — public entry point.
 */

export { HaloClient } from "./client.js";
export {
  deriveAttestationPda,
  deriveIssuerAuthorityPda,
  derivePolicyPda,
} from "./attestation.js";
export { canonicaliseJson, hashPolicyJson } from "./policy.js";
export { decodeTransaction, getTxMessageBytes, sha256Bytes } from "./tx.js";
export {
  MockWalletBackend,
  MwaWalletBackend,
  pickBackend,
  type WalletBackend,
} from "./mwa.js";

export type {
  HaloClientConfig,
  MockApprovalInput,
  SignContext,
  SignWithAttestationInput,
  SignWithAttestationResult,
  WalletMode,
} from "./types.js";

// Re-export detector types so dApps don't have to depend on @halo/detector
// directly to consume HaloClient results.
export type {
  AnalyzerConfig,
  BlinksContext,
  DecodedInstruction,
  DecodedTransaction,
  Finding,
  Report,
  Severity,
} from "@halo/detector";
