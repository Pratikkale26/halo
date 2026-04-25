# @halo/sdk

> **Wrap any Solana transaction with hardware-attested signing on the Seeker.**

The Halo SDK is the dApp-developer-facing TypeScript library. You give it a transaction; it (1) decodes and scores the transaction with `@halo/detector` inside the secure execution environment, (2) prompts the user inside Seed Vault, (3) signs only if the user approves, and (4) issues an on-chain SAS attestation the dApp's program can verify.

## Install

```bash
pnpm add @halo/sdk @solana/web3.js \
        @coral-xyz/anchor \
        @solana-mobile/mobile-wallet-adapter-protocol-web3js
```

## Five-line integration

```typescript
import { HaloClient } from "@halo/sdk";

const halo = new HaloClient({
  connection,
  policyId: "kamino-deposit-v1",
  policyHash, // 32-byte SHA-256 of your off-chain policy JSON
  rpcUrl: process.env.HELIUS_RPC_URL,
  allowedPrograms: [SystemProgram, TOKEN_PROGRAM_ID, KAMINO_PROGRAM_ID],
});

const result = await halo.signWithAttestation({
  transaction,
  account: userAccount,
  context: { description: "Deposit 5,000 USDC into Kamino", valueUsd: 5000 },
});

if (result.status === "approved") {
  // result.signedTransaction — pass to sendAndConfirm
  // result.attestation       — pass to your Anchor program for CPI verify
}
```

## Modes

The SDK has two backends, selected by `walletMode`:

| Mode | Purpose | Backend |
|---|---|---|
| `"mwa"` | Production — talks to the Seed Vault Wallet via Mobile Wallet Adapter | `@solana-mobile/mobile-wallet-adapter-protocol-web3js` |
| `"mock"` | Demo / dev — simulates the user's approve/decline flow in code | In-memory mock |

Use `"mock"` while iterating on the demo. The Expo app in this monorepo defaults to `"mock"` so it runs in any Android emulator without the real Seed Vault simulator installed.

## What the SDK does NOT do

- Talk to a server-side simulator (everything runs on-device).
- Modify the host wallet (it dispatches a signing intent; the wallet still signs).
- Hold any user funds at any point.

## License

Apache-2.0
