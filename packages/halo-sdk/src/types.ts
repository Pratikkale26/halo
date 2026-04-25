/**
 * Public types for @halo/sdk.
 */

import type { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import type { BlinksContext, Finding, Report } from "@halo/detector";

/** Backend that performs the actual cryptographic signing. */
export type WalletMode = "mwa" | "mock";

export interface HaloClientConfig {
  /** Solana RPC connection. */
  connection: Connection;
  /** Stable identifier for the dApp policy (free text, used in logs). */
  policyId: string;
  /** SHA-256 of the canonical off-chain policy JSON. 32 bytes. */
  policyHash: Uint8Array;
  /** Halo program ID on the cluster the connection points to. */
  haloProgramId: PublicKey;
  /** Programs the dApp policy explicitly allow-lists for the detector. */
  allowedPrograms: (PublicKey | string)[];
  /** Optional Blinks context for the blinks-mismatch rule. */
  blinksContext?: BlinksContext;
  /** Subset of detector rule IDs to run. Defaults to all. */
  enabledRules?: string[];
  /** Wallet backend. Defaults to "mwa" if available, "mock" otherwise. */
  walletMode?: WalletMode;
  /** When walletMode = "mock", a hook invoked to decide approve/decline. */
  mockApprover?: (input: MockApprovalInput) => Promise<boolean>;
}

export interface SignContext {
  /** Human-readable description of what the tx does. Shown to the user. */
  description: string;
  /** Optional fiat-equivalent value, used by some policies. */
  valueUsd?: number;
}

export interface SignWithAttestationInput {
  /** The transaction the dApp wants signed. */
  transaction: Transaction | VersionedTransaction;
  /** The user's wallet account (pubkey). */
  account: PublicKey;
  /** Human-readable context shown alongside the tx detail. */
  context: SignContext;
}

export type SignWithAttestationResult =
  | {
      status: "approved";
      signedTransaction: Transaction | VersionedTransaction;
      /** PDA address of the issued Halo Attestation account. */
      attestation: PublicKey;
      /** SHA-256 of the signed transaction message. */
      txHash: Uint8Array;
      report: Report;
    }
  | {
      status: "blocked";
      /** Detector emitted a critical finding. The user was warned and the
       *  transaction was not sent for signing. */
      report: Report;
      blockingFindings: Finding[];
    }
  | {
      status: "rejected";
      /** The user declined inside the Seed Vault prompt. */
      report: Report;
    };

/** Argument shape passed to the optional mock approver. */
export interface MockApprovalInput {
  description: string;
  report: Report;
  valueUsd?: number;
}
