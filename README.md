# Halo

> **Hardware-attested transaction defense for Solana — built on the Seeker's Seed Vault, anchored to the Solana Attestation Service (SAS).**

A drop-in mobile SDK + on-chain Anchor program that lets any Solana dApp require a Seeker hardware-attested confirmation for high-value or risky transactions. On-device transaction simulation, drainer-pattern detection, and policy enforcement run inside the Seeker's secure execution environment — and emit verifiable SAS attestations that on-chain programs can check via CPI.

---

## Why this exists

- **$90M+** lost to Solana wallet drainers in H1 2025 alone.
- **April 1, 2026** — Drift Protocol exploited for **$285M** via compromised admin keys.
- 2026 drainer kits **bypass server-side wallet simulations** via TOCTOU attacks.
- Existing defenses are server-side (MITM-able), browser-only (desktop), or vertical wallet apps. **None are on-device, hardware-attested, and composable.**

The Seeker is the only mobile platform globally where the signing key, biometric sensor, and secure display all live in the same tamper-resistant trust boundary. Halo turns that into a public infrastructure layer for the entire Solana ecosystem.

## Repository layout

```
halo/
├── HALO.md                     Master spec (18 sections, grant-application-ready)
├── PROGRESS.md                 Session handoff doc
├── README.md                   This file
├── LICENSE                     Apache-2.0
├── Anchor.toml                 Anchor workspace config
├── Cargo.toml                  Rust workspace (Anchor program)
├── package.json                pnpm workspace root
├── pnpm-workspace.yaml         Workspace package globs
├── tsconfig.base.json          Shared TypeScript config
│
├── programs/
│   └── halo/                   Solana program (Anchor / Rust)
│       └── src/
│           ├── lib.rs                Entry, instruction declarations
│           ├── state.rs              PolicyRegistry, IssuerAuthority, RevocationList accounts
│           ├── error.rs              HaloError enum
│           └── instructions/         Per-instruction handlers
│
├── packages/
│   ├── halo-detector/          Drainer-pattern detector (TypeScript)
│   │   └── src/rules/                5 rules: assign-attack, hidden-approval, transfer-hook-abuse,
│   │                                 durable-nonce-abuse, blinks-mismatch
│   └── halo-sdk/               Halo client SDK (TypeScript)
│       └── src/                      Client, attestation, policy, MWA wrapper
│
├── apps/
│   └── demo/                   Expo / React Native demo app
│       └── src/screens/              Drainer vs Halo comparison
│
├── tests/
│   └── halo.ts                 Anchor program integration tests (TypeScript)
│
├── scripts/
│   ├── deploy-devnet.sh        Deploy program + register SAS schema on devnet
│   ├── seed-policy.ts          Register sample policies for the demo
│   └── gen-keypair.sh          Generate dev keypairs
│
└── docs/
    ├── ARCHITECTURE.md         Layered architecture deep-dive
    ├── INTEGRATION.md          How a dApp integrates Halo (5 lines of CPI)
    ├── DEMO-SCRIPT.md          90-second video script for grant demo
    └── GTM.md                  Distribution and partner-outreach playbook
```

## Quick start

> **Prerequisites:** Node 20+, pnpm 8+, Rust 1.79+, Solana CLI 2.0+, Anchor 0.30+, Expo CLI.

```bash
# Install JS dependencies
pnpm install

# Build the Anchor program (devnet)
anchor build

# Run the program tests against a local validator
anchor test

# Run the Expo demo on Android (requires Android emulator with API 31+)
pnpm --filter @halo/demo start
```

## Status

- [x] Project scoping complete (`HALO.md`, 18 sections)
- [x] Anchor program scaffold with verify_attestation, PolicyRegistry, IssuerAuthority
- [x] TypeScript drainer-detector library (5 rules)
- [x] TypeScript SDK (MWA + SAS wrapper)
- [x] Expo demo app with magic-moment scenarios
- [ ] Devnet deploy + SAS schema registration *(needs Pratik to provide deployer keypair)*
- [ ] Demo video recording *(Pratik to record off `docs/DEMO-SCRIPT.md`)*
- [ ] Grant submission *(see `HALO.md` §14 for filled-out form fields)*

## Documentation

- [`HALO.md`](./HALO.md) — full project spec
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — system architecture
- [`docs/INTEGRATION.md`](./docs/INTEGRATION.md) — dApp developer integration guide
- [`docs/DEMO-SCRIPT.md`](./docs/DEMO-SCRIPT.md) — 90-second demo script
- [`docs/GTM.md`](./docs/GTM.md) — go-to-market playbook
- [`PROGRESS.md`](./PROGRESS.md) — session handoff state

## License

Apache License 2.0 — see [LICENSE](./LICENSE).

## Author

**Pratik Kale** ([@pratikkale26](https://x.com/pratikkale26) on X / Telegram)

Built for the Solana Mobile Builder Grant program ($20k tier, rolling submissions) — see [solanamobile.com/grants](https://solanamobile.com/grants).
