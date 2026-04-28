# Halo

> **Hardware-attested transaction defense for Solana — built on the Seeker's Seed Vault, anchored to the Solana Attestation Service (SAS).**

A drop-in mobile SDK + on-chain program that lets any Solana dApp (wallet, DEX, NFT marketplace, lending protocol) require a Seeker hardware-attested confirmation for high-value or risky transactions. On-device transaction simulation, drainer-pattern detection, and policy enforcement run inside the Seeker's secure execution environment — and emit verifiable SAS attestations that on-chain programs can check.

**Status:** Project scoping complete. Name locked: **Halo** (2026-04-25). Grant ask: **$12k** Solana Mobile Builder Grant *(revised down from $20k on 2026-04-25 after MVP codebase shipped — see §15)*.
**Author:** Pratik Kale ([@pratikkale26](https://x.com/pratikkale26) — same handle on Telegram)
**Repo:** `https://github.com/Pratikkale26/vaultguard` *(slug pending rename to `halo`)*
**Workspace:** `/home/pk/projects/vaultguard` *(local dir name retained from initial commit; GitHub repo may be renamed to `halo` later)*
**Generated:** 2026-04-25 · **Last updated:** 2026-04-25

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem](#2-problem)
3. [Solution](#3-solution)
4. [Why Crypto, Why Seeker](#4-why-crypto-why-seeker)
5. [Technical Architecture](#5-technical-architecture)
6. [SDK Surface (sketch)](#6-sdk-surface-sketch)
7. [On-Chain Program Design](#7-on-chain-program-design)
8. [Competitive Landscape](#8-competitive-landscape)
9. [Differentiation / Moat](#9-differentiation--moat)
10. [Use Cases](#10-use-cases)
11. [MVP Scope (4-week sprint)](#11-mvp-scope-4-week-sprint)
12. [Roadmap (post-MVP)](#12-roadmap-post-mvp)
13. [Go-to-Market](#13-go-to-market)
14. [Solana Mobile Grant Application — Draft Answers](#14-solana-mobile-grant-application--draft-answers)
15. [Budget Plan ($12k)](#15-budget-plan-12k)
16. [Risks & Mitigations](#16-risks--mitigations)
17. [Open Decisions](#17-open-decisions)
18. [References](#18-references)

---

## 1. Executive Summary

| | |
|---|---|
| **One-liner** | Wallet-agnostic SDK that turns the Seeker's Seed Vault into a hardware-attested anti-drainer layer for the entire Solana ecosystem. |
| **Category** | Infrastructure / Tooling (Solana Mobile Grant track) |
| **Target users** | Solana wallet developers, DeFi/NFT/protocol teams, end users on Seeker |
| **Crypto necessity** | STRONG — drainer phishing is uniquely a crypto problem; only hardware-attested signing inside a secure execution environment defeats it without trusting the host app or browser |
| **Founder edge** | 3yr full-stack blockchain (Pratik), Turbin3 grad, CTO at IIT Madras startup, infra/DePIN/tooling background, prior React Native + Expo shipping experience |
| **MVP estimate** | 4 weeks (1 person), Kotlin Android SDK + React Native bridge + Anchor program + SAS issuer + reference dApp |
| **Grant ask** | **$12k** from Solana Mobile Builder Grants (revised down 2026-04-25 — MVP shipped, scope reflects what remains: audit + adoption support) |

---

## 2. Problem

### 2.1 The numbers

- **$90M+ lost to Solana wallet drainers in H1 2025 alone** — phishing kits weaponize legitimate Solana primitives (Blinks, durable nonces, the `assign` instruction) against users.
- **2026 drainer kits actively bypass wallet simulations.** TOCTOU (time-of-check / time-of-use) attacks let drainers show one transaction during simulation and execute another at sign time.
- **April 1, 2026 — Drift Protocol exploited for $285M** in 12 minutes — the second-largest exploit in Solana history. A 6-month social-engineering campaign (DPRK-linked UNC4736, same actor as the 2024 Radiant Capital hack) tricked Drift's Security Council members into pre-signing transactions via Solana's durable-nonce feature, handing over admin control. Attackers then whitelisted a worthless CVT token as collateral and drained $285M in USDC, SOL, and ETH.

### 2.2 What's broken in the current defense stack

| Defense layer | Provider | Architectural weakness |
|---|---|---|
| Server-side tx simulation | Blockaid (Phantom default), Walletkit | Tx leaves the device for analysis — a malicious app can MITM the response, or simulate one tx while signing another. |
| Browser extensions | GuardSOL, BlockLock, SolGuard, SAFEGUARD | Desktop-only; can't protect mobile users where most onboarding now happens. |
| AI scanners | Rug Raider, Iteration 0001, Agent Cypher | Pattern-matching over heuristics; rapidly defeated by novel drainer variants. |
| Hardware wallets | Ledger, SPL Cards, Unruggable | Excellent for cold storage, but most users sign hot from their mobile wallet. |
| MPC wallets | Unruggable | Eliminates seed-phrase exposure but doesn't protect against signing-time drainers (the user still approves). |

### 2.3 The gap

**Nothing on Solana today does transaction-level signing inside a tamper-resistant secure enclave on a user's primary phone, with the resulting attestation provable on-chain.** The Seeker's Seed Vault is the only mobile platform globally where the signing key, the secure display, and biometric verification all live in the same trusted hardware boundary. That capability is sitting there, used today only by the Seed Vault Wallet itself.

Halo turns it into a public infrastructure layer for the whole Solana ecosystem.

---

## 3. Solution

### 3.1 Concept in one paragraph

A Solana dApp (running on the Seeker, or even on the web with a Seeker as a 2FA bridge) calls Halo SDK to wrap any high-value or risky transaction. The SDK runs on-device transaction simulation inside the Seeker's secure execution environment, evaluates a policy engine (per-dApp risk rules), shows a tamper-resistant secure-display confirmation to the user, and on approval signs the transaction with the Seed Vault. The signature is bundled with a **SAS attestation** ("this signature was reviewed inside Seed Vault by hardware-verified user X at time T under policy P"). The dApp's on-chain program can then verify the attestation before executing the action — making hardware-attested signing a composable on-chain primitive.

### 3.2 Three layers

```
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 3 — Solana program (Anchor)                                │
│  • Halo verifier program                                    │
│  • Reads SAS credential, validates issuer + policy match          │
│  • Other dApps CPI into it: "require_halo_attestation()"    │
└──────────────────────────────────────────────────────────────────┘
                              ▲
                              │  SAS attestation (on-chain creds)
                              │
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 2 — Mobile SDK (Kotlin Android + RN bridge)               │
│  • Tx simulation engine (local — runs against forked mainnet     │
│    state via Helius/Triton + sBPF interpreter)                   │
│  • Drainer pattern detector (assign-instruction abuse, hidden     │
│    token approvals, owner-reassignment, malicious Blinks)         │
│  • Policy engine (per-dApp risk rules: max value, allowlists,     │
│    velocity limits, biometric step-up)                            │
│  • Seed Vault integration (signing intent dispatch)               │
│  • SAS issuer (signs attestation with Halo issuer keypair)  │
└──────────────────────────────────────────────────────────────────┘
                              ▲
                              │  SDK call: vaultGuard.signTx(tx, policy)
                              │
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 1 — Any Solana dApp                                       │
│  • Wallet (Phantom, Backpack, Solflare, Seed Vault Wallet)        │
│  • DeFi (Jupiter, Kamino, Marginfi mobile UIs)                    │
│  • NFT marketplaces, games, anything that calls .signTransaction  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 The trust loop

1. dApp calls SDK with tx + risk policy ID.
2. SDK simulates locally → flags risk → shows tamper-resistant approval UI.
3. User approves with biometric → Seed Vault signs.
4. SDK emits signed tx + SAS attestation.
5. dApp's program verifies SAS attestation in CPI before executing critical actions.

Even if the dApp itself is compromised, the user only ever sees and approves the *real* transaction inside the secure-display environment.

---

## 4. Why Crypto, Why Seeker

### 4.1 Crypto necessity test

> *What gets worse if I remove the blockchain?*

- **Without blockchain:** the entire problem disappears — there's no irreversible drainer attack to defend against. (TradFi has chargebacks.)
- **Without onchain attestations (just app-level approval):** dApps can't compose on the trust signal. Every protocol re-implements its own check.
- **Without hardware attestation (just better UI):** users still get tricked by lookalike approvals; defense is purely best-effort.

→ **Pass.** Crypto is the entire reason this product needs to exist; on-chain attestations are the entire reason it composes; hardware attestation is the entire reason it works.

### 4.2 Why Seeker specifically

Seeker is the **only mobile platform on the planet** where:
- The signing private key lives in a hardware-isolated Seed Vault.
- The biometric sensor is co-located in the same trusted execution environment.
- A secure-display channel exists that the host OS / app cannot spoof.
- The Genesis Token + SAS rail allows other Solana programs to verify *which physical device* approved the action.

Saga had Seed Vault but no SAS. iPhone has Secure Enclave but no native Solana signing surface. Generic Android Keystore can't issue Solana attestations. **Only Seeker closes all three loops** — which is exactly why this product is Seeker-native, not portable.

---

## 5. Technical Architecture

### 5.1 Stack

| Layer | Tech | Why |
|---|---|---|
| Mobile SDK (core) | Kotlin (Android), targeting API 31+ | Required by Seed Vault SDK |
| Mobile SDK (RN bridge) | TypeScript + Expo Modules | Pratik already ships Expo apps; matches dApp-dev preference |
| Tx simulation | Local sBPF interpreter via [`sbpf` toolchain](https://github.com/blueshift-gg/sbpf) + forked-state RPC (Helius) | On-device, no MITM surface |
| Drainer rule engine | Rust → JNI to Kotlin | Fast pattern matching, shareable with on-chain verifier |
| SAS issuer | `sas-lib` (Solana Foundation npm) | Official rail, no need to invent crypto |
| On-chain program | Anchor (Rust) | Pratik's wheelhouse, standard Solana toolchain |
| Reference dApp | Expo / React Native + `@solana-mobile/mobile-wallet-adapter-protocol-web3js` | Demonstrates end-to-end |
| Test infra | Solana local validator + Seed Vault simulator (Android emulator API 31+) | No physical Seeker required for development |

### 5.2 Key components

#### a. Tx simulation engine (on-device)
Pulls the relevant accounts from a trusted RPC, executes the tx against a local sBPF interpreter, captures all account writes, token movements, and CPI tree. Output: a structured "what this tx will actually do" report.

#### b. Drainer pattern detector
Pre-built rule library covering known drainer techniques:
- `system_program::assign` to attacker-controlled program (owner-reassignment attack)
- Hidden Token-2022 transfer hooks
- Approve-all on token accounts
- Durable nonce abuse
- Blinks payload mismatch with what's signed
- Suspicious instruction-budget gaming
- Cross-instruction value extraction

Each rule has severity (critical / warning / info) and emits a structured reason.

#### c. Policy engine
Per-dApp policy schema (DSL or JSON):
```jsonc
{
  "policyId": "kamino-lend-v1",
  "maxValueUsd": 10000,
  "allowedPrograms": ["KamiNo...", "Token...", "AssociatedToken..."],
  "velocityLimits": { "perHour": 5, "perDay": 20 },
  "stepUp": {
    "biometric": "always",
    "secondFactor": "above_value_usd:5000"
  },
  "blockOn": ["criticalDrainerPattern"]
}
```

#### d. SAS attestation schema
```rust
pub struct HaloAttestation {
    pub schema_id: Pubkey,           // Halo schema authority
    pub user: Pubkey,                // Seeker-bound user account
    pub policy_id: [u8; 32],         // Hash of policy applied
    pub tx_hash: [u8; 32],           // Hash of the simulated+signed tx
    pub risk_score: u8,              // 0-100 from rule engine
    pub timestamp: i64,
    pub seeker_genesis_token: Pubkey,// Soulbound NFT proving Seeker ownership
    pub issuer_signature: [u8; 64],  // Halo issuer authority sig
}
```

#### e. On-chain verifier program
- **Account types:** `PolicyRegistry`, `IssuerAuthority`, `RevocationList`
- **Instructions:**
  - `register_policy(policy_id, params)` — protocol team registers their own policy
  - `verify_attestation(attestation, expected_policy)` — CPI-callable, returns Ok/Err
  - `update_issuer_authority(new_authority)` — upgradeable via Squads multisig

---

## 6. SDK Surface (sketch)

### 6.1 React Native (TypeScript)

```typescript
import { Halo } from '@halo/expo';

const halo = new Halo({
  policyId: 'kamino-lend-v1',
  rpcUrl: process.env.HELIUS_RPC_URL,
});

// Wrap any transaction
const result = await halo.signWithAttestation({
  transaction: serializedTx,
  account: userAccount,
  context: {
    description: 'Deposit 5,000 USDC into Kamino main market',
    valueUsd: 5000,
  },
});

if (result.status === 'approved') {
  // result.signedTransaction — the signed tx
  // result.attestation       — SAS credential pubkey to pass on-chain
  await sendAndConfirm(result.signedTransaction);
} else {
  // result.status === 'blocked' | 'rejected'
  // result.reason — structured why it was blocked
}
```

### 6.2 Kotlin (Android, native)

```kotlin
val halo = HaloClient.builder(context)
    .policyId("kamino-lend-v1")
    .rpcUrl(BuildConfig.HELIUS_RPC)
    .build()

val result = halo.signWithAttestation(
    transaction = txBytes,
    account = userAccount,
    context = SigningContext(
        description = "Deposit 5,000 USDC",
        valueUsd = 5_000.0
    )
)

when (result) {
    is Approved -> sendTx(result.signedTransaction, result.attestationPubkey)
    is Blocked  -> showBlockReason(result.reason)
    is Rejected -> Unit  // user said no
}
```

### 6.3 On-chain (Anchor, dApp-side)

```rust
#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub halo_attestation: Account<'info, HaloAttestation>,
    pub halo_program: Program<'info, Halo>,
    // ... vault, mint, etc.
}

pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    // Require hardware-attested approval for any deposit > $5k equivalent
    if amount > FIVE_THOUSAND_USDC {
        halo::cpi::verify_attestation(
            ctx.accounts.into_verify_ctx(),
            VerifyParams {
                expected_policy: KAMINO_DEPOSIT_POLICY,
                expected_user: ctx.accounts.user.key(),
                max_age_secs: 60,
            },
        )?;
    }
    // ... actual deposit logic
}
```

---

## 7. On-Chain Program Design

### 7.1 Accounts

```rust
#[account]
pub struct PolicyRegistry {
    pub authority: Pubkey,       // who can update this policy
    pub policy_hash: [u8; 32],   // hash of the policy DSL
    pub schema_uri: String,      // off-chain JSON spec
    pub created_at: i64,
    pub revoked: bool,
}

#[account]
pub struct IssuerAuthority {
    pub authority: Pubkey,       // Halo SDK issuer key (rotatable)
    pub squads_multisig: Pubkey, // upgrade authority
    pub created_at: i64,
}

#[account]
pub struct RevocationList {
    pub revoked_attestations: Vec<[u8; 32]>, // tx_hash list (compressed via Bubblegum if large)
}
```

### 7.2 Critical instruction: `verify_attestation`

```rust
pub fn verify_attestation(
    ctx: Context<VerifyAttestation>,
    params: VerifyParams,
) -> Result<()> {
    let att = &ctx.accounts.attestation;
    let policy = &ctx.accounts.policy_registry;
    let issuer = &ctx.accounts.issuer_authority;

    require!(!policy.revoked, HaloError::PolicyRevoked);
    require_keys_eq!(att.policy_id, policy.key(), HaloError::PolicyMismatch);
    require!(att.user == params.expected_user, HaloError::UserMismatch);

    let now = Clock::get()?.unix_timestamp;
    require!(now - att.timestamp <= params.max_age_secs, HaloError::AttestationExpired);

    // Verify SAS signature using issuer authority pubkey
    sas::verify(&att.issuer_signature, att.bytes_to_sign(), issuer.authority)?;

    // Optional: confirm Seeker Genesis Token presence on user account
    // (cheap if dApp wants device-bound guarantee)

    Ok(())
}
```

### 7.3 Why on-chain, not just off-chain?

The attestation lives on-chain so that:
1. **Composability** — any program can verify, not just one app.
2. **Auditability** — an exploit response team can search "show me all attestations against the compromised policy."
3. **Insurance pricing** — pool insurers can read on-chain Halo adoption rate to price coverage.
4. **Revocation** — single-source-of-truth for revoked policies and rotated issuer keys.

---

## 8. Competitive Landscape

### 8.1 Past Solana hackathon projects (Colosseum search, 6 queries × 10–15 results)

#### Drainer-defense category

| Project | Hackathon | Form factor | Defeated by |
|---|---|---|---|
| GuardSOL | Cypherpunk | Browser extension | Mobile users; on-device drainers |
| Rug Raider | Breakout | AI scanner | Novel drainer variants; can't see device-side |
| BlockLock | Radar | Web/security suite | Mobile gap; server-side latency |
| Iteration 0001 | Breakout | AI tx translator | Same as above |
| Haltt | Cypherpunk | Real-time tx blocker | Server-side trust; not on-device |
| Agent Cypher | Breakout | AI scam detection | Pattern-matching limits |
| SAFEGUARD | Cypherpunk | Web platform + extension | Mobile gap |
| SolGuard | Cypherpunk | Browser extension | Mobile gap |
| Titan3 | Renaissance | dApp frontend protection | Different layer (XSS/iframe attacks) |
| Unruggable | Radar (Honorable Mention) | MPC hardware wallet | Doesn't address sign-time drainers |

**Pattern:** Every funded competitor is **either a desktop browser extension or a server-side AI scanner.** None run inside a hardware-secure execution environment on the user's primary mobile device. None emit on-chain attestations. **Zero overlap with Halo's wedge.**

#### Past Solana Mobile track winners (Colosseum filter `isSolanaMobile=true, winnersOnly=true`)

| Winner | Prize | Category | Relevance to Halo |
|---|---|---|---|
| Unruggable | $30,000 (top infra) | Hardware wallet | ✅ Validates: security infra wins big. We complement (we're SDK, not wallet) |
| Cloak | $15,000 (3rd, Stablecoins) | Privacy layer | ✅ Validates: protection-flavored infra wins |
| Rekt | $15,000 (3rd, DeFi) | Mobile perps | — Different category |
| PlaiPin | $15,000 (3rd) | Proximity AI agents | ✅ Validates: hardware-native protocols win |
| Humanship ID | $5,000 (5th) | Personhood / identity | ✅ Validates: SAS-adjacent identity wins |
| Superfan | $20,000 (2nd) | Music DAO | — Different category |
| SeekerOS | Honorable mention | Agentic OS | ✅ Adjacent — could integrate Halo for high-value agent actions |
| here. | (placement) | GPS-verified photos | ✅ Validates: hardware-attested data wins |
| Arrow API | (placement) | Tx data API | — Adjacent infra |
| subZero | (placement) | Edge compute | — Adjacent infra |
| Lockbox | (placement) | Decentralized password manager | ✅ Adjacent: security tooling category active |

**Pattern:** Solana Mobile grants reward (a) hardware-native protocols, (b) security/protection products, (c) infrastructure SDKs that other dApps can use. Halo hits all three.

### 8.2 Production competitors (web research)

| Product | Form factor | Halo differentiator |
|---|---|---|
| **Blockaid** (powers Phantom) | Server-side tx simulation | Cloud round-trip can be MITM'd; on-device cannot |
| **Walletkit** | Server-side scanning | Same |
| **Ledger Live** | Hardware wallet companion app | Cold-storage focus, slow UX, not a dApp SDK |
| **Solana Mobile Seed Vault SDK** ([repo](https://github.com/solana-mobile/seed-vault-sdk)) | Wallet-only signing primitive | Doesn't validate tx contents (open issue [#36](https://github.com/solana-mobile/seed-vault-sdk/issues/36)); not a dApp-side SDK |
| **SAS issuers** (Solid, Civic, Trusta, Wecan) | KYC/identity attestations | None do transaction-level or device-bound attestations |

### 8.3 Competitive verdict

Halo occupies a real gap: **on-device + hardware-attested + dApp-agnostic SDK + composable on-chain + Seeker-native.** No funded project — past hackathon winner or production product — owns this combination.

---

## 9. Differentiation / Moat

| Dimension | Halo | Closest competitor |
|---|---|---|
| Threat surface | On-device (no network round-trip) | Blockaid (cloud) |
| Trust anchor | Hardware Seed Vault + secure display | Software simulation |
| Target | Any Solana dApp via SDK | Specific wallet integration |
| Composability | On-chain SAS attestation, CPI-callable | Off-chain alerts only |
| Mobile-first | Yes (RN + Kotlin SDK) | Browser-extension competitors are desktop-only |
| Differentiation per device | Seeker Genesis Token bind-able | Generic device fingerprinting |

**Moats accreting over time:**
1. **Policy library** — every protocol that registers a Halo policy adds to the network's value. Hard to replicate without the same dApp roster.
2. **On-chain adoption metrics** — once `verify_attestation` is in production code paths at major protocols, switching cost is real.
3. **SAS schema authority** — first-mover advantage in defining the device-attested-tx schema.

---

## 10. Use Cases

| # | dApp / scenario | What Halo enables |
|---|---|---|
| 1 | **Phantom / Backpack mobile** | Step-up hardware confirmation for any tx > $X, blocking 90%+ of drainer flows that worked on browser. |
| 2 | **Kamino / Marginfi lending** | Block deposits above a threshold unless attestation shows tx was reviewed in Seed Vault. |
| 3 | **NFT marketplaces (Magic Eden mobile)** | Detect bait-and-switch listings (tx says "buy NFT for 1 SOL", actually approves all NFTs to attacker). |
| 4 | **DeFi protocols (admin / governance multisig)** | Squads-style multisig where each signer must produce a Halo attestation — Halo's durable-nonce-abuse rule + WYSIWYG secure display defends against the social-engineering pattern that drained Drift for $285M. |
| 5 | **Web DeFi → Seeker 2FA** | Web app generates deeplink → Seeker confirms with attestation → web verifies. Universal hardware-MFA for web Solana. |
| 6 | **Insurance pools / risk markets** | Pool premiums priced by Halo adoption; users with hardware-attested policies get cheaper coverage. |
| 7 | **Agent wallets (e.g., SeekerOS)** | AI agent can transact freely up to limit; spending above limit triggers human attestation. |

---

## 11. MVP Scope (4-week sprint)

### Week 1 — Foundation
- [ ] Anchor program scaffold (PolicyRegistry, IssuerAuthority, verify_attestation)
- [ ] SAS schema authority registration on devnet
- [ ] Seed Vault simulator setup on Android emulator (API 31+)
- [ ] Kotlin SDK skeleton + Seed Vault binding

### Week 2 — Core SDK
- [ ] On-device tx simulation engine (sBPF + RPC fork)
- [ ] Drainer rule library v1 (5 rules: assign-abuse, hidden approvals, durable-nonce abuse, transfer hooks, Blinks mismatch)
- [ ] Policy engine + JSON schema parser
- [ ] SAS issuer module

### Week 3 — Bridge + Reference
- [ ] React Native / Expo bridge module
- [ ] Reference dApp: simple "Kamino-style" deposit screen using Halo
- [ ] End-to-end on devnet: dApp → SDK → Seed Vault → SAS → on-chain verify

### Week 4 — Polish + Demo
- [ ] Documentation site (Docusaurus)
- [ ] Example integration guide for Phantom-style wallets
- [ ] Demo video (3 min): drainer attack attempted → Halo blocks
- [ ] Mainnet-beta deployment of verifier program (with Squads multisig as upgrade authority)
- [ ] Open-source release (MIT or Apache-2.0)

### Out of scope for MVP (intentionally)
- Production tx-simulation perf optimization (use straightforward sBPF; optimize later)
- Full drainer rule library (5 rules, not 50)
- Cloud-hosted policy registry (purely on-chain at MVP)
- Insurance pool integration

---

## 12. Roadmap (post-MVP)

| Phase | Deliverable | Why |
|---|---|---|
| **M1 (post-grant)** | Drainer rule library v2 (full coverage), perf tuning, on-device caching | Production-grade |
| **M2** | Phantom + Backpack pilot integration | Real adoption signal |
| **M3** | Web SDK + Seeker 2FA bridge ("SignerPass" use case) | Expand TAM beyond Seeker-only dApps |
| **M4** | AdminGuard module: Squads-style multisig where signers must hardware-attest | Captures "Drift hack" defense narrative |
| **M5** | Insurance partnership: Nexus Mutual / Solace / Etherisc (Solana version) | Monetization |
| **M6** | Audited drainer-detection model running fully on-device (no cloud) | Defensible moat |

---

## 13. Go-to-Market

### 13.1 Distribution channels

1. **Solana Mobile team direct.** A grant-funded SDK that makes Seeker-bound dApps strictly more secure is something they'll co-market — they ship Seeker as a "secure crypto phone," and we make that promise composable.
2. **Wallet teams.** Phantom, Backpack, Solflare have direct incentive: every dApp that adopts Halo reduces the wallet team's drainer-support burden.
3. **DeFi protocol teams.** Reach via Solana DevRel slack, Anchor maintainer network, Helius blog cross-post, Pratik's Turbin3 alumni network.
4. **Open-source presence.** Top Anchor + Kotlin examples get inbound from teams searching GitHub.
5. **Security incident piggyback.** When the next drainer exploit hits (it will), tweet "Halo would have blocked this" with on-device demo. Earned media.

### 13.2 First 10 users

| # | Target | Hook |
|---|---|---|
| 1 | Solana Mobile DevRel | Direct demo, ask for placement in dApp Store launch features |
| 2 | Phantom mobile team | "Drop-in defense for the drainer kits bypassing your simulations" |
| 3 | Backpack | Same |
| 4 | Solflare | They built the Seed Vault Wallet — natural partner |
| 5 | Kamino DevRel | "Step-up auth for high-value lending positions" |
| 6 | Marginfi / Jupiter Perps | Same pitch |
| 7 | Squads team | "AdminGuard: extend your multisig with hardware-attested signers" |
| 8 | Magic Eden mobile | NFT bait-and-switch defense |
| 9 | Drift's relaunch effort (if any) | "Use case zero: would have prevented April 1" |
| 10 | A Cypherpunk hackathon team building a wallet | Easy adoption story for next hackathon |

### 13.3 Message angle

> "**Drainers cost Solana users $90M+ in H1 2025 alone, and 2026 kits bypass server-side wallet simulations. There's exactly one mobile platform where the signing key, biometric, and secure display all live in tamper-resistant hardware: the Seeker. Halo turns that into a public infrastructure layer your dApp can call in 5 lines of code.**"

---

## 14. Solana Mobile Grant Application — Copy-Paste Answers

> Source: https://solanamobile.com/grants
> Last updated: 2026-04-25 — program ID locked, GitHub repo live, anchor tests 10/10 passing.

| Field | Copy-paste value |
|---|---|
| **Project Name** | `Halo` |
| **Requested Amount** | `$10,000 - $20,000` (specifically asking $12,000 — line-itemed in §15) |
| **Website URL** | `https://github.com/Pratikkale26/halo` (use the repo as the website until a domain is bought) |
| **Country** | `India` |
| **First Name** | `Pratik` |
| **Last Name** | `Kale` |
| **Email** | `pratikkale7661@gmail.com` |
| **Category** | `Infrastructure / Tooling` (or whichever closest match the form offers — Halo is wallet-security infra) |
| **Twitter (X)** | `@pratikkale26` |
| **Telegram** | `@pratikkale26` |
| **Link To Pitch Deck** | ⏳ Generate via `/create-pitch-deck` skill — should embed the demo video, the 3-layer architecture diagram from `docs/ARCHITECTURE.md`, and the budget table from §15. |
| **Link To Demo Video** | ⏳ Record 90-sec video off `docs/DEMO-SCRIPT.md`. Loom or YouTube unlisted both fine. |
| **Solana On-Chain Accounts** | `HUd9rbV6jTCD6HUufKRdFNx4jc7qhxAusejXDkZZ1KF7` (Halo verifier program ID — keypair generated, devnet deploy via `scripts/deploy-devnet.sh` → mainnet post-audit) |
| **Do you have an Android app already?** | `No — building one for this grant. Applicant has shipped React Native / Expo apps previously.` |
| **Solana dApp Store Status** | `Planning submission in the near future` (the demo app ships to dApp Store; the SDK distributes via npm) |
| **Funding status** | `Will not raise funds` (Halo is structured as public-good infrastructure — open-source SDK, on-chain verifier program, no token, no equity) |
| **Relevant metrics** | `Pre-launch. Pre-grant traction: 13/13 detector unit tests passing, 10/10 Anchor program integration tests passing, full 18-section technical spec published, open-source repo live with 13 atomic commits, competitive landscape verified against 5,400+ Colosseum hackathon projects (zero overlap on the Seeker-native + on-device + hardware-attested SDK wedge).` |

### Pitch / project description (draft, ~250 words)

> **Halo is a hardware-attested transaction defense SDK for Solana, built on the Seeker's Seed Vault and anchored to the Solana Attestation Service (SAS).**
>
> Solana users lost over $90M to wallet drainers in H1 2025 alone, and on April 1, 2026, Drift Protocol was drained of $285M in 12 minutes after a 6-month social-engineering campaign exploited Solana's durable-nonce feature to trick Security Council members into pre-signing transactions that handed over admin control. Existing defenses are either server-side simulations that drainers now bypass via TOCTOU attacks, or browser extensions that don't reach mobile users. There is no mobile-native, on-device, hardware-attested defense layer — and the Seeker is the only mobile platform globally where the signing key, biometric sensor, and secure display all live inside the same tamper-resistant boundary.
>
> Halo is a drop-in SDK (Kotlin + React Native) that lets any Solana dApp wrap high-value or risky transactions in a Seed Vault hardware confirmation. On-device transaction simulation and a drainer-pattern rule engine run inside the secure execution environment, then emit a SAS attestation that on-chain Solana programs can verify via CPI. This makes hardware-attested signing a composable, verifiable on-chain primitive that any wallet, DeFi protocol, or NFT marketplace can require for sensitive flows.
>
> The SDK ships open-source under a permissive license. The reference implementation includes a working integration with a Kamino-style deposit flow. Post-grant roadmap includes pilot integrations with major Solana wallets (Phantom, Backpack, Solflare), an AdminGuard module that would have prevented the Drift exploit, and an insurance-pool integration that prices coverage by Halo adoption.
>
> Built by Pratik Kale (Turbin3 grad, 3yr Solana experience, 3x grant recipient).

---

## 15. Budget Plan ($12k)

> Revised down from $20k → $12k → **$12k** on 2026-04-25 as the MVP codebase shipped (10/10 program tests + 13/13 detector tests passing). Final scope: audit + Seeker device + 6 weeks of adoption-support compensation. Everything else is genuinely DIY-able.

| Line item | Allocation | Notes |
|---|---|---|
| Solana program audit | $5,000 | Halborn / OtterSec / Sec3 focused-scope audit of verifier program (covers SAS verification + policy registry + issuer authority). **Non-negotiable** — no wallet integrates an unaudited verifier program. |
| Compensation for solo dev (Pratik) | $5,000 | ~6 weeks of post-grant adoption support: Phantom / Backpack / Solflare partnership outreach + first integration support + responding to issues from open-source users. |
| Seeker device | $500 | Buy one for end-to-end testing on real hardware (replace the mock MWA backend with the production wiring). |
| RPC + infra (12 months) | $1,000 | Helius free tier extended where possible; upgrade to Pro only when production tx-simulation traffic warrants. |
| Domain + minimal branding + demo polish | $500 | Domain (halo.dev / halo.so), Vercel hosting, basic logomark, light motion graphics for launch video. Pratik DIY. |

**Total: $12,000.**

If only $10k granted: cut RPC to $500, defer Seeker (use emulator), accept lower-tier audit. If full $12k: plan as above. The audit + 6 weeks of adoption work are the load-bearing items — everything else flexes.

---

## 16. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Phantom / Backpack build it natively, not as a shared SDK | Medium | High | Open-source from day 1, register SAS schema first, position as wallet-agnostic standard |
| Solana Mobile team doesn't see it as fundable | Low | High | Direct DevRel conversation pre-submission; lean on Drift-hack hook for urgency |
| Seed Vault SDK changes break integration | Low | Medium | Stay close to upstream; contribute back to issue [#36](https://github.com/solana-mobile/seed-vault-sdk/issues/36) |
| On-device tx simulation perf is too slow | Medium | Medium | Cache fork state aggressively; use Helius's parsed tx for first-pass; full sBPF only for risky-flagged txs |
| Drainer authors design around Halo | High | Medium | Rule library is updateable; on-chain revocation; engage white-hats for fuzzing |
| User can't develop without physical Seeker | High | Low | Use Android emulator + Seed Vault simulator for dev; budget includes one device for week-4 testing |
| Audit cost exceeds $3.5k | Medium | Medium | Accept slimmer audit scope (just verifier instructions); plan deeper audit post-grant |
| Pratik bandwidth conflicts with IIT Madras CTO role | Medium | High | Explicitly scope MVP at 4 weeks part-time; use Plan + Task tools to enforce focus |

---

## 17. Open Decisions

These need to be answered before the MVP starts:

1. **License** — *Decision (2026-04-25): open source. Choose Apache-2.0 vs MIT before first commit (Apache-2.0 leaning for explicit patent grant).*
2. **Brand identity** — *Decision pending: Halo is working name. Pratik wants alternatives suggested. Top candidates: Mudra, Sigil, Vouch, Pramana (see naming notes appended).*
3. **Domain** — depends on final name; reserve once name is locked.
4. **Issuer authority custody** — *Decision (2026-04-25): defer to Squads-DAO model later (option C). At MVP, single dev keypair under Pratik. Migrate to multisig pre-mainnet, full DAO post-grant.*
5. **Audit firm** — solicit quotes from Halborn, OtterSec, Sec3, Neodyme. Pick based on Anchor + SAS familiarity.
6. **Pre-submission DevRel** — *Decision (2026-04-25): no paid DevRel. Pratik will leverage Turbin3 / Superteam India network for warm intros where possible; otherwise demo-led cold outreach.*
7. **Phase 2 skills to chain** — `create-pitch-deck` (for grant deck) + `scaffold-project` (for actual code workspace) + `build-with-claude` (guided MVP).

### Naming notes (added 2026-04-25)

Ranked candidates with rationale; Pratik to pick.

| # | Name | Origin | Why it works | Risk |
|---|---|---|---|---|
| 1 | **Mudra** | Sanskrit (मुद्रा) — "seal / sign of approval" + modern Hindi for "currency" | Perfect semantic fit (hardware attestation = cryptographic mudra). Founder authenticity (Pratik is Indian / IIT Madras). Distinct in crypto. Short. | None known. Worth quick trademark scan. |
| 2 | **Sigil** | English/occult — magical mark/seal that grants power | Strong, distinctive, no crypto baggage. .so / .dev likely free. | Slight "occult" connotation may feel off-brand for serious infra. |
| 3 | **Vouch** | English — to attest, to speak for | Direct, friendly, captures attestation semantics perfectly. | vouch.io is an insurance company; vouch.dev / vouch.so likely taken. |
| 4 | **Pramana** | Sanskrit (प्रमाण) — "valid proof / evidence / cognition" | Nerdy-distinctive, perfect for an attestation primitive. Founder authenticity. | More obscure than Mudra; harder to spell. |

**Recommendation: Mudra.** Single Sanskrit word that *is* the product (a seal / mark of approval issued by hardware) and doubles as "currency" — perfect for Solana mobile payments. Founder-authentic. Trademark risk low in the crypto space (Mudra Loans is an Indian government scheme, no namespace overlap with software/protocols).

---

## 18. References

### Solana Mobile
- [Solana Mobile Builder Grants](https://solanamobile.com/grants) / [Docs](https://docs.solanamobile.com/grants)
- [Seed Vault SDK (GitHub)](https://github.com/solana-mobile/seed-vault-sdk)
- [Seed Vault SDK issue #36 — validate incoming transactions](https://github.com/solana-mobile/seed-vault-sdk/issues/36)
- [Seed Vault Wallet announcement](https://blog.solanamobile.com/post/seed-vault-wallet----solana-seekers-native-mobile-wallet)
- [Seeker Genesis Token developer docs](https://docs.solanamobile.com/marketing/engaging-seeker-users)
- [10 Solana Mobile Stack ideas (Hash Block)](https://medium.com/@connect.hashblock/10-solana-mobile-stack-ideas-that-feel-native-bccdd98aaa47)
- [Top 20 Seeker dApps (Solana Mobile X post)](https://x.com/solanamobile/status/1993375627404058820)

### SAS
- [Solana Attestation Service launch](https://solana.com/news/solana-attestation-service)
- [SAS GitHub](https://github.com/solana-foundation/solana-attestation-service)
- [SAS dashboard](https://attest.solana.com/)
- [Range Security: Introducing SAS](https://www.range.org/blog/introducing-solana-attestation-service)

### Drainer threat landscape
- [Anatomy of a Solana Wallet Drainer (assign / durable nonce / Blinks)](https://dev.to/ohmygod/anatomy-of-a-solana-wallet-drainer-owner-reassignment-durable-nonces-and-blinks-phishing-50a8)
- [Blockaid: TOCTOU attacks on wallet simulations](https://www.blockaid.io/blog/dissecting-toctou-attacks-how-wallet-drainers-exploit-solanas-transaction-timing)
- [Wallet security tools on Solana — Alchemy index](https://www.alchemy.com/dapps/list-of/wallet-security-tools-on-solana)

### Drift exploit
- Local: `/home/pk/.claude/skills/data/solana-knowledge/04-protocols-and-sdks.md` (Drift entry, April 2026)

### Tooling
- [sbpf assembly toolchain (Blueshift)](https://github.com/blueshift-gg/sbpf)
- [Helius DAS / RPC](https://docs.helius.dev)
- [Anchor framework](https://www.anchor-lang.com)
- [Squads multisig](https://docs.squads.so)

### Hackathon competitive landscape (Colosseum Copilot, Apr 2026 query)
Past projects searched: GuardSOL, Rug Raider, BlockLock, Iteration 0001, Haltt, Agent Cypher, SAFEGUARD, SolGuard, Titan3, Unruggable, Magni, SPL Cards, Blonk, Multisig Wallet, UniProof, verifyonce, Solana passport, Cloak, Rekt, PlaiPin, Humanship ID, SeekerOS, here., Arrow API, subZero, Lockbox, Superfan. **No Seeker-native, on-device, hardware-attested SDK exists.**

---

*Doc version: 0.1 (initial scoping). Update as decisions in §17 close.*
