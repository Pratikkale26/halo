/**
 * Shared types for the Halo drainer-detector.
 *
 * The detector is intentionally network-free and synchronous: it consumes a
 * pre-decoded transaction and emits a structured report. All RPC / fork-state
 * lookups happen one layer up in the Halo SDK and are passed in as `context`.
 */

import type { PublicKey } from "@solana/web3.js";

/** Canonical decoded representation of a Solana transaction instruction. */
export interface DecodedInstruction {
  /** Program the instruction targets. */
  programId: string;
  /** Account keys, in the order the instruction expects them. */
  accounts: string[];
  /** Raw instruction data (base64 or hex; rules decode as needed). */
  data: string;
  /** Index of this instruction within the transaction's instruction list. */
  index: number;
  /**
   * Optional human-readable name (e.g., `system_program::Transfer`,
   * `spl_token::Approve`). Provided when the analyzer can identify the
   * instruction; rules degrade gracefully when missing.
   */
  name?: string;
  /**
   * Optional decoded args as a plain object. Provided alongside `name` when
   * known.
   */
  args?: Record<string, unknown>;
}

export interface DecodedTransaction {
  /** Fee payer / first signer. */
  feePayer: string;
  /** All signer pubkeys (including fee payer). */
  signers: string[];
  /** All writable accounts. */
  writableAccounts: string[];
  /** Top-level instructions, in order. */
  instructions: DecodedInstruction[];
  /** Recent blockhash referenced by the tx. */
  recentBlockhash: string;
  /** True if the tx is a versioned transaction with a durable nonce. */
  hasDurableNonce: boolean;
}

/** Severity tier for a finding. */
export type Severity = "info" | "warning" | "critical";

/** A single rule-level finding. */
export interface Finding {
  /** Stable rule identifier (e.g., `assign-attack`). */
  ruleId: string;
  /** Severity. Critical findings cause `shouldBlock=true`. */
  severity: Severity;
  /** Human-readable explanation, safe to render in the user-facing UI. */
  reason: string;
  /** Structured evidence — instruction index, account, decoded values, etc. */
  evidence: Record<string, unknown>;
}

/** Aggregate report for one transaction. */
export interface Report {
  /** 0-100, computed from finding severities. */
  riskScore: number;
  /** True if any `critical` finding was emitted. */
  shouldBlock: boolean;
  /** All findings, in the order rules ran. */
  findings: Finding[];
}

/** Optional Blinks context for the `blinks-mismatch` rule. */
export interface BlinksContext {
  /** User-facing action description (e.g., "Deposit 5,000 USDC into Kamino"). */
  description: string;
  /** Programs the user-facing description implies should appear. */
  expectedRecipientPrograms: string[];
}

/** Per-policy / per-dApp configuration the analyzer uses. */
export interface AnalyzerConfig {
  /** Programs explicitly trusted by the calling dApp's policy. */
  allowedPrograms: string[];
  /** Optional Blinks context (for blinks-mismatch). */
  blinksContext?: BlinksContext;
  /** Subset of rule IDs to enable. Defaults to all. */
  enabledRules?: string[];
}

/** A rule is a pure function that emits zero or more findings. */
export interface Rule {
  readonly id: string;
  readonly severity: Severity;
  readonly description: string;
  evaluate(tx: DecodedTransaction, config: AnalyzerConfig): Finding[];
}

/** Helper to convert a PublicKey or base58 string to base58. */
export type PubkeyLike = PublicKey | string;
