# Halo · Pitch Deck (Markdown source)

> Slide-by-slide source for paste-into-Pitch / Google Slides / Figma.
> Visual version: `docs/pitch-deck.html` (open in browser, arrow-key navigation).
> Audience: **Solana Mobile Builder Grant reviewers**. Target ask: **$12,000**.
> Author: Pratik Kale ([@pratikkale26](https://x.com/pratikkale26)).

Each `---` is a slide break.

---

## Slide 1 — Title

**HALO**

*Hardware-attested transaction defense for Solana — built on the Seeker's Seed Vault.*

`Solana Mobile Builder Grant · $12,000`

`Pratik Kale · github.com/Pratikkale26/halo · April 2026`

**Speaker note:** Open with one sentence — "Halo lets any Solana dApp require a hardware-attested confirmation from the Seeker's Seed Vault before signing risky transactions." Don't over-explain. Move to the problem in 8 seconds.

---

## Slide 2 — The Problem

**Solana users lost over $90M to wallet drainers in H1 2025 alone.**

Three forces compound it:

| | |
|---|---|
| **Scale** | $90M+ stolen from Solana wallets in just the first half of 2025 — bigger than most ecosystem revenues. |
| **Evolution** | 2026 drainer kits weaponise TOCTOU attacks — the wallet shows one tx, the chain executes another. |
| **Surface** | Existing defenses are browser extensions or cloud scanners. **Mobile users are flying blind.** |

**Speaker note:** Pause after the headline. Let the number land. Reviewers see security pitches every day — what makes ours different is the specific mechanism (TOCTOU bypass) that makes 2024-era defenses obsolete.

---

## Slide 3 — Recent Incident · April 1, 2026

**Drift Protocol: $285M drained in 12 minutes.**

Second-largest exploit in Solana history. A 6-month social-engineering campaign attributed to DPRK-linked UNC4736 — the same actor behind the 2024 Radiant Capital hack.

**How it happened — durable nonces, weaponised.** Drift's Security Council members were socially engineered into pre-signing transactions via Solana's durable-nonce feature. They thought they were signing routine ops. They were actually handing over admin control. Once admins, attackers whitelisted a worthless CVT token as collateral, deposited 500M CVT, and withdrew $285M in USDC, SOL, and ETH.

**What Halo detects — durable-nonce abuse rule, already shipped.** Halo's on-device detector flags this exact pattern: a transaction using a durable nonce that also grants administrative authority. The Seeker's secure display shows the real instruction effects — not the description supplied by the calling app. The signer sees what they're actually signing, before Seed Vault is asked to confirm.

**Speaker note:** This is the freshest data point reviewers have, and it maps directly to a Halo detector rule that already ships. Don't say "would have stopped it" hypothetically — say "Halo's `durable-nonce-abuse` rule flags exactly this pattern." Land the WYSIWYG signing property: *the signer sees what they're actually signing.*

---

## Slide 4 — Why Now

**Three converging shifts opened a window in Q1 2026.**

| Market shift | Tech unlock | Platform |
|---|---|---|
| Drainer kits evolved past server-side simulation. Blockaid-class defenses were enough in 2024 — they aren't anymore. | Solana Attestation Service (SAS) launched on mainnet (May 2025). The composable on-chain credential rail Halo needs. | Solana Seeker is shipping with 160+ dApps live on the dApp Store. |

**Speaker note:** "Why now" is Sequoia's most overlooked slide. Three concrete catalysts, all dated within 6 months — not a generic "crypto is growing" wave.

---

## Slide 5 — The Solution

**A drop-in SDK + on-chain verifier any Solana dApp wires up in five lines.**

### Client (TypeScript / React Native)

```typescript
const halo = new HaloClient({ connection, policyHash });

const result = await halo.signWithAttestation({
  transaction, account,
  context: { description: "Deposit 5,000 USDC" }
});

// result.status: "approved" | "blocked" | "rejected"
```

### Program (Anchor CPI)

```rust
halo::cpi::verify_attestation(
  ctx.accounts.into_halo_ctx(),
  VerifyAttestationParams {
    expected_user: ctx.accounts.user.key(),
    expected_policy_hash: KAMINO_DEPOSIT_POLICY,
    max_age_secs: 60,
  },
)?;
```

On-device transaction simulation + drainer-pattern detection runs inside the Seeker's secure execution environment. The user only sees a Seed Vault prompt for transactions that survive the local audit. Approval emits a SAS attestation any Solana program can verify on-chain.

**Speaker note:** Show the *count* — 5 lines of client, 5 lines of CPI. Adoption friction is the bar Halo must clear.

---

## Slide 6 — Architecture

**Three layers, one trust loop.**

| L3 · On-chain | L2 · Device | L1 · dApp |
|---|---|---|
| **Halo verifier program.** Anchor program with `verify_attestation`, PolicyRegistry PDAs, IssuerAuthority. Any Solana program CPIs in. | **SDK + drainer detector.** 5 attack-pattern rules running inside the secure execution environment. SAS issuer. MWA bridge to Seed Vault. | **Any Solana app.** Wallets, DEXs, NFT marketplaces, lending protocols. 5-line client + 5-line program-side verify. |
| `10/10 integration tests passing` | `13/13 unit tests passing` | Reference Expo demo in repo |

**Trust property:** the rendering the user reads in Seed Vault is the same rendering applied to the bytes that get signed. A malicious app cannot show one transaction and sign another — the secure display is driven by the Seed Vault, not by the host app.

**Speaker note:** Architecture is the "show your work" slide. The test counts are real — `pnpm test` and `anchor test` both pass on commit `b6ad2ad`.

---

## Slide 7 — Why the Seeker

**The only mobile platform globally where signing key, biometric, and secure display share one trust boundary.**

| Platform | Signing key | Biometric | Secure display | Native Solana attestation |
|---|---|---|---|---|
| iPhone Secure Enclave | ✓ enclave | ✓ Face ID | partial | ✗ no native Solana |
| Generic Android Keystore | ✓ TEE | ✓ fingerprint | ✗ | ✗ |
| Hardware wallets (Ledger / Trezor) | ✓ secure chip | ✗ no biometric | ✓ on-device screen | ✗ cold-storage flow only |
| **Solana Seeker · Seed Vault** | **✓ Seed Vault** | **✓ in same TEE** | **✓ tamper-resistant** | **✓ via SAS** |

Halo is intentionally Seeker-native. Saga had Seed Vault but no SAS rail. Generic phones have either / or — not both. **The Seeker is what makes this entire product physically possible.**

**Speaker note:** This is the slide that ties the grant ask to the Solana Mobile team's own incentives. Halo making the Seeker uniquely valuable is the same outcome they're shipping the Seeker for.

---

## Slide 8 — See It in 90 Seconds

**Live demo:** [demo video link — to be filled]

A drainer dApp tries to convince Pratik's wallet to "claim a free airdrop." Halo decodes what the bytes actually do — and blocks before Seed Vault is ever asked to sign.

| $285M | $90M+ | 0 |
|---|---|---|
| Drift hack · April 2026 | Drainer losses · H1 2025 | Seeker-native competitors |

**Speaker note:** Replace `[demo video link]` with the recorded Loom / YouTube URL before submission.

---

## Slide 9 — Competitive Landscape

**Verified against 5,400+ Colosseum hackathon projects. Zero overlap on the Seeker-native, on-device, hardware-attested SDK wedge.**

| Category | Examples | Form factor | Why they don't defend the Seeker user |
|---|---|---|---|
| Server-side simulation | Blockaid (powers Phantom) | Cloud API | MITM-able · TOCTOU drainers bypass it |
| Browser extensions | GuardSOL, BlockLock, SolGuard, SAFEGUARD | Desktop only | Don't reach mobile users at all |
| AI scanners | Rug Raider, Iteration 0001, Agent Cypher | Server-side ML | Pattern-matching defeated by novel kits |
| Hardware wallets | Ledger, SPL Cards, Unruggable ($30k Radar) | Standalone wallet | Cold-storage flow, not the daily driver |
| **Halo** | **This grant** | **SDK + on-chain verifier** | **On-device · hardware-attested · composable** |

Sources: Colosseum Copilot search across 6 query angles · GitHub `solana-mobile/seed-vault-sdk` issue #36 (open) · SAS issuer index (5 KYC-only issuers, none transaction-level).

**Speaker note:** The Colosseum number is the credibility lever. Reviewers rarely have time to verify competitive claims — citing the search universe (5,400+ projects) shows we did the work.

---

## Slide 10 — What We've Already Built

**Pre-grant: the codebase ships today.**

| 18 | 23/23 | 3,400+ | 5 |
|---|---|---|---|
| Atomic commits | Tests passing | Lines of source | Drainer rules shipped |

### Delivered
- ✓ Anchor program · 6 instructions · 3 PDA account types
- ✓ `@halo/detector` · 5 drainer rules + Analyzer
- ✓ `@halo/sdk` · MWA + mock backends
- ✓ Expo / React Native demo · 2 scenarios
- ✓ Apache-2.0 · public repo · 4 doc files

### Next (post-grant)
- → Independent program audit
- → Production MWA wiring on real Seeker
- → First wallet pilot integration
- → Drainer rule library v2 (full coverage)
- → AdminGuard module · Drift-class defense

**Speaker note:** Reviewers see a lot of "we'll build it if you fund it." Halo is the opposite: code is shipped, tested, on GitHub. The grant funds finishing what makes it real-world deployable, not building from scratch.

---

## Slide 11 — Roadmap

**From shipped MVP to ecosystem standard.**

| M1 (W1-4) | M2 (W5-8) | M3 (Mo3) | M4 (Mo4) | M5 (Mo5+) |
|---|---|---|---|---|
| **Audit + production wiring.** Halborn / OtterSec audit. Real MWA backend. Mainnet deploy. | **First wallet pilot.** Phantom, Backpack, or Solflare integration. Real-user data. | **SignerPass.** Web → Seeker 2FA bridge. Universal MFA for web Solana. | **AdminGuard.** Squads-style multisig with hardware-attested signers. Drift-hack-class defense. | **Insurance pool.** Premiums priced by Halo adoption. Self-sustaining model. |

Each milestone has acceptance criteria in `HALO.md §12`. Every module reuses the same on-chain verifier program — surface area grows without expanding maintenance burden.

**Speaker note:** The roadmap is sequential, not parallel — emphasises focused execution rather than overcommit.

---

## Slide 12 — Team

**Pratik Kale · solo founder.**

### Background
- 3 years full-stack blockchain development
- Turbin3 graduate (Solana developer cohort)
- CTO at IIT Madras-affiliated startup
- 3× grant recipient · 1× hackathon winner
- Ships React Native / Expo apps · writes Anchor in Rust daily

### Founder-problem fit
DePIN / infrastructure / tooling is Pratik's strongest lane. Halo is exactly that shape: low-level Solana program work, mobile SDK engineering, and the mechanism design to make hardware attestations composable on-chain. **Not a stretch into consumer / design / community work.** Halo wins on technical execution and Seeker-native depth, both of which Pratik is purpose-built for.

`@pratikkale26` on X and Telegram · `pratikkale7661@gmail.com`

**Speaker note:** Lean into the solo-founder framing. The Solana Mobile grant program funds individuals doing focused, well-scoped work — not pre-seed startups looking for follow-on rounds.

---

## Slide 13 — The Ask

# **$12,000**

Solana Mobile Builder Grant · public-good infrastructure · open-source, no token, no equity.

| Line item | Amount | Why |
|---|---|---|
| Solana program audit (Halborn / OtterSec / Sec3) | **$5,000** | Non-negotiable · no wallet integrates an unaudited verifier |
| Pratik · 6 weeks adoption support | **$5,000** | Wallet-team partnership outreach + first integration support |
| Seeker device | **$500** | End-to-end testing on real hardware |
| RPC + infra (12 months) | **$1,000** | Helius free tier extended; upgrade only when production traffic needs |
| Domain + minimal branding + demo polish | **$500** | halo.dev · Vercel · logomark · launch-video motion |
| **Total** | **$12,000** | **Sized to the work that remains, not the work that's done** |

**Speaker note:** Reviewers respond to budget honesty. The "sized to what remains" line preempts the "is this padded?" question.

---

## Slide 14 — The Invitation

**Make hardware-attested signing a primitive every Solana app can call in five lines.**

`github.com/Pratikkale26/halo`

Apache-2.0 · 23/23 tests passing · ready to deploy

`Solana Mobile Builder Grant · $12k · rolling`

**Speaker note:** Close on the invitation framing — reviewers are part of the launch, not just gatekeepers. The repo link is the call to action.

---

## Q&A prep — three questions Pratik should expect

**1. "Why won't Phantom or Backpack just build this themselves?"**
> They might — and that would be a good outcome for users. But Phantom's defense lives inside Phantom. A wallet-agnostic, on-chain-composable SDK serves the *whole ecosystem*, including dApps that don't ship their own wallet. The two layers are complementary, not competitive — and the on-chain verifier program is naturally a public good no single wallet wants to own.

**2. "How do you keep up with new drainer techniques after the grant runs out?"**
> The rule library is versioned and revocation-aware on-chain. Post-grant, the maintenance model is the same as Anchor or Solana Wallet Adapter — open-source, contributor-driven, with the issuer authority migrating to a Squads-DAO governed multisig (HALO.md §17 item 4). The grant funds the audit + first 2 months of paid maintenance; the network effect funds the rest.

**3. "What if the Seeker doesn't gain market share?"**
> The Seeker is the *first* deployment, not the *only* deployment. The architecture transfers cleanly to any device with a Seed Vault-equivalent secure execution environment — Solana Mobile Stack OEM partners are an explicit M3+ target (HALO.md §12). Even in the conservative "Seeker plateaus at 200k devices" scenario, an on-chain verifier program serving every Solana app is still load-bearing infrastructure.

---

## Production checklist before submitting

- [ ] Replace `[demo video link]` on Slide 8 with the recorded Loom / YouTube URL
- [ ] Confirm Twitter / Telegram handle on Slide 12 is current (`@pratikkale26`)
- [ ] If presenting live: rehearse the 90-second demo runbook in `docs/DEMO-SCRIPT.md`
- [ ] Upload deck to Google Slides / Pitch / Figma — paste public link into the grant form
- [ ] Submit at https://solanamobile.com/grants
