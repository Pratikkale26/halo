# Halo — Architecture

Three layers, one trust loop. This document is the technical companion to `HALO.md`. Read `HALO.md` first for product framing.

## Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  L3 — Solana program (Anchor)                                         │
│        programs/halo/                                                 │
│        verify_attestation, PolicyRegistry, IssuerAuthority,           │
│        Attestation PDAs, RevocationList                               │
└──────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ SAS-style on-chain credential
                              │
┌──────────────────────────────────────────────────────────────────────┐
│  L2 — Mobile SDK (TypeScript, React Native first)                     │
│        packages/halo-sdk/                                             │
│        - Tx decoding (legacy + versioned)                             │
│        - On-device detector via @halo/detector                        │
│        - Wallet backend abstraction (MWA / mock)                      │
│        - Attestation PDA derivation                                   │
└──────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ HaloClient.signWithAttestation(...)
                              │
┌──────────────────────────────────────────────────────────────────────┐
│  L1 — Any Solana dApp (5-line integration)                            │
│        Wallets, DeFi, NFT marketplaces, games, anything that calls    │
│        .signTransaction() today                                       │
└──────────────────────────────────────────────────────────────────────┘
```

## Trust loop

1. dApp calls `HaloClient.signWithAttestation({ transaction, account, context })`.
2. SDK decodes the tx and runs `Analyzer` (pure, on-device).
3. If a critical finding fires → return `{ status: "blocked" }`. Seed Vault is never invoked.
4. Otherwise → dispatch a signing intent to the wallet backend (MWA → Seed Vault Wallet on Seeker).
5. Seed Vault prompts the user with a tamper-resistant secure-display rendering of the same tx + same Halo report.
6. On biometric approve, Seed Vault returns the signed tx; SDK computes `tx_hash = SHA256(message)` and derives the attestation PDA address.
7. Halo issues an on-chain `Attestation` account via the program's `issue_attestation` instruction.
8. dApp's program CPIs `verify_attestation` before executing the sensitive part of its handler.

The point: every link in the chain — including the rendering the user reads — lives in the same hardware boundary as the signing key. A malicious app can't show one tx and sign another, because the secure display is driven by Seed Vault, not by the host app.

## On-chain account layout

| Account | PDA seeds | Lifetime | Owner |
|---|---|---|---|
| `IssuerAuthority` | `["issuer"]` | Singleton, perma | Halo program |
| `PolicyRegistry` | `["policy", policy_hash]` | Per-policy, perma until revoked | Halo program |
| `Attestation` | `["attestation", user, tx_hash]` | Per-tx, expires by `max_age_secs` | Halo program |

`policy_hash` = SHA-256 of canonicalised JSON. The actual policy DSL lives off-chain (IPFS / Arweave / GitHub). Changing the off-chain doc would change the hash → all existing attestations against that policy become stale immediately. Trust-minimised policy management without putting the full DSL on-chain.

## Module boundaries

| Module | Pure? | Network? | Trust boundary |
|---|---|---|---|
| `@halo/detector` | yes | no | runs inside SEE |
| `@halo/sdk` decoding | yes | no | runs inside SEE |
| `@halo/sdk` MWA backend | no | yes | bridges to Seed Vault |
| `@halo/sdk` attestation issuance | no | yes (Solana RPC) | host app |
| `programs/halo` | n/a (deterministic) | n/a (on-chain) | Solana validators |

The pure modules are the *security-relevant* ones. They have no I/O, no time-of-check/time-of-use surface, and can be deterministically replayed by an auditor.

## Threat model

### What Halo defends against
- Owner-reassignment drainers (`system_program::Assign`)
- Hidden token approvals
- Token-2022 transfer-hook abuse
- Bait-and-switch Blinks
- Durable-nonce delayed execution

### What Halo does NOT defend against
- A user voluntarily signing a known-bad tx after seeing the warning. Halo is advisory once the user enters the Seed Vault prompt; the user can override. (This is intentional — the user owns their keys.)
- Compromise of the Seed Vault hardware itself. Halo trusts the same hardware Solana Mobile trusts.
- Compromise of the Halo issuer authority key. Mitigation: Squads multisig (HALO.md §17 item 4) + key rotation via `rotate_issuer`.
- Compromise of the dApp's own program. If the dApp's verifier code is wrong, no attestation can save it.

## Performance budget

| Component | Target | Rationale |
|---|---|---|
| Detector analyze | < 50 ms p99 | Must feel instant in the signing UI |
| Tx decode | < 10 ms p99 | Lightweight |
| MWA round-trip to Seed Vault | < 800 ms p99 | Constrained by Seed Vault Wallet UX |
| `verify_attestation` CPI | < 10k CU | Anchor overhead + 2 PDA loads + sig check |

Production builds will swap the JS sBPF interpreter (planned post-MVP) for a Rust→WASM detector to hold the 50ms budget on more complex txs.
