/**
 * Wallet backend abstraction — production path uses Mobile Wallet Adapter
 * (MWA) which on a Seeker proxies to the Seed Vault Wallet. The mock path is
 * used by the Expo demo and unit tests.
 */

import type { Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";

import type { MockApprovalInput, WalletMode } from "./types.js";

export interface WalletBackend {
  signTransaction(input: {
    transaction: Transaction | VersionedTransaction;
    description: string;
    valueUsd?: number;
    detectorReport: import("@halo/detector").Report;
  }): Promise<{ approved: boolean; signed?: Transaction | VersionedTransaction }>;
}

/**
 * Mock backend — used by the Expo demo and tests. Delegates the approve/
 * decline decision to the configured `mockApprover` callback.
 */
export class MockWalletBackend implements WalletBackend {
  constructor(
    private readonly approver: (input: MockApprovalInput) => Promise<boolean>,
    private readonly signer: Keypair,
  ) {}

  async signTransaction(input: {
    transaction: Transaction | VersionedTransaction;
    description: string;
    valueUsd?: number;
    detectorReport: import("@halo/detector").Report;
  }): Promise<{ approved: boolean; signed?: Transaction | VersionedTransaction }> {
    const approved = await this.approver({
      description: input.description,
      report: input.detectorReport,
      valueUsd: input.valueUsd,
    });
    if (!approved) return { approved: false };

    const tx = input.transaction;
    if ("partialSign" in tx) {
      tx.partialSign(this.signer);
      return { approved: true, signed: tx };
    }
    tx.sign([this.signer]);
    return { approved: true, signed: tx };
  }
}

/**
 * Production MWA backend — defers the import of the optional peer dep so the
 * SDK is usable in environments where MWA isn't installed (e.g., the demo
 * running on an Android emulator without the Seed Vault simulator).
 */
export class MwaWalletBackend implements WalletBackend {
  async signTransaction(_input: {
    transaction: Transaction | VersionedTransaction;
    description: string;
    valueUsd?: number;
    detectorReport: import("@halo/detector").Report;
  }): Promise<{ approved: boolean; signed?: Transaction | VersionedTransaction }> {
    // Real MWA flow:
    //   const { transact } = await import(
    //     "@solana-mobile/mobile-wallet-adapter-protocol-web3js"
    //   );
    //   return transact(async (wallet) => {
    //     const auth = await wallet.authorize({...});
    //     const signed = await wallet.signTransactions({transactions: [tx]});
    //     return { approved: true, signed: signed[0] };
    //   });
    //
    // The Seeker's Seed Vault Wallet handles the secure-display + biometric
    // confirmation. The detectorReport is rendered alongside the tx in our
    // companion overlay (see HALO.md §5.b).
    throw new Error(
      "MwaWalletBackend is not implemented in this MVP build. Use walletMode='mock' for the demo, or wire up @solana-mobile/mobile-wallet-adapter-protocol-web3js for production.",
    );
  }
}

export function pickBackend(
  mode: WalletMode | undefined,
  mockApprover: ((input: MockApprovalInput) => Promise<boolean>) | undefined,
  mockSigner: Keypair | undefined,
): WalletBackend {
  if (mode === "mwa") return new MwaWalletBackend();
  if (!mockApprover || !mockSigner) {
    throw new Error(
      "walletMode='mock' requires both `mockApprover` and a mock signer keypair.",
    );
  }
  return new MockWalletBackend(mockApprover, mockSigner);
}
