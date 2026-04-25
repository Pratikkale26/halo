/**
 * HaloClient — primary developer-facing entry point.
 *
 * Workflow (single call: `signWithAttestation`):
 *   1. Decode the transaction.
 *   2. Run @halo/detector inside the local trust boundary.
 *   3. If a critical finding is present, return `{ status: "blocked" }`.
 *   4. Otherwise, dispatch a signing intent to the wallet backend
 *      (MWA on production, mock approver in the demo).
 *   5. If signed, compute the SHA-256 of the message and derive the
 *      attestation PDA address. (The actual on-chain issue_attestation
 *      instruction is left to the caller for MVP; see TODO below.)
 *
 * The single result object covers all three terminal states (approved,
 * blocked, rejected), so dApp callers don't have to wrangle exceptions.
 */

import {
  Analyzer,
  type AnalyzerConfig,
  type Finding,
  type Report,
} from "@halo/detector";
import { Keypair } from "@solana/web3.js";

import { deriveAttestationPda } from "./attestation.js";
import { pickBackend, type WalletBackend } from "./mwa.js";
import { decodeTransaction, getTxMessageBytes, sha256Bytes } from "./tx.js";
import type {
  HaloClientConfig,
  SignWithAttestationInput,
  SignWithAttestationResult,
} from "./types.js";

export class HaloClient {
  private readonly analyzer: Analyzer;
  private readonly backend: WalletBackend;
  private readonly config: HaloClientConfig;

  constructor(
    config: HaloClientConfig,
    /** Optional mock signer when walletMode = "mock". The production MWA
     *  backend doesn't need one. */
    mockSigner?: Keypair,
  ) {
    if (config.policyHash.length !== 32) {
      throw new Error("HaloClientConfig.policyHash must be 32 bytes (SHA-256).");
    }

    const analyzerConfig: AnalyzerConfig = {
      allowedPrograms: config.allowedPrograms.map((p) =>
        typeof p === "string" ? p : p.toBase58(),
      ),
      blinksContext: config.blinksContext,
      enabledRules: config.enabledRules,
    };
    this.analyzer = new Analyzer(analyzerConfig);
    this.config = config;
    this.backend = pickBackend(config.walletMode ?? "mwa", config.mockApprover, mockSigner);
  }

  async signWithAttestation(
    input: SignWithAttestationInput,
  ): Promise<SignWithAttestationResult> {
    // 1. Decode the tx.
    const decoded = decodeTransaction(input.transaction);

    // 2. Run the on-device detector.
    const report = this.analyzer.analyze(decoded);

    // 3. Block on critical findings before any signing intent is dispatched.
    if (report.shouldBlock) {
      return {
        status: "blocked",
        report,
        blockingFindings: report.findings.filter(
          (f: Finding) => f.severity === "critical",
        ),
      };
    }

    // 4. Dispatch signing intent to wallet backend.
    const signing = await this.backend.signTransaction({
      transaction: input.transaction,
      description: input.context.description,
      valueUsd: input.context.valueUsd,
      detectorReport: report,
    });

    if (!signing.approved || !signing.signed) {
      return { status: "rejected", report };
    }

    // 5. Compute the canonical tx hash and derive the attestation PDA.
    const messageBytes = getTxMessageBytes(signing.signed);
    const txHash = await sha256Bytes(messageBytes);
    const [attestation] = deriveAttestationPda(
      this.config.haloProgramId,
      input.account,
      txHash,
    );

    // TODO(PROD): dispatch the on-chain issue_attestation instruction here
    // (Anchor CPI from the SDK to the Halo program). For MVP demo purposes,
    // the attestation PDA is returned address-only; the dApp's program can
    // reference it once it's been issued in the next ledger slot.
    //
    // See HALO.md §11 (week 3) for the integration milestone.

    return {
      status: "approved",
      signedTransaction: signing.signed,
      attestation,
      txHash,
      report,
    };
  }

  /** Expose the analyzer for callers that want to dry-run a tx before signing. */
  analyze(tx: Parameters<typeof decodeTransaction>[0]): Report {
    return this.analyzer.analyze(decodeTransaction(tx));
  }
}
