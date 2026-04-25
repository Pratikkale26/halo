# Halo — session progress (2026-04-25)

> **Last session ended at the "ready to scaffold" gate. Pratik paused to switch to other work; will resume later. This doc tells the next session what was decided and what's next.**

## Project identity

- **Name (final):** Halo *(was VaultGuard during scoping; renamed 2026-04-25)*
- **Spec doc:** `HALO.md` (673 lines, all sections current as of pause)
- **Local workspace:** `/home/pk/projects/vaultguard` *(dir name retained from the initial commit; rename to `halo` is a future cosmetic action)*
- **GitHub remote:** `https://github.com/Pratikkale26/vaultguard.git` *(empty repo, no commits yet — Pratik can rename slug to `halo` on github.com when convenient)*
- **One-liner:** Hardware-attested transaction defense SDK for Solana — built on the Seeker's Seed Vault, anchored to the Solana Attestation Service (SAS).

## Locked decisions (do not re-litigate without Pratik)

| Topic | Decision | Decided when |
|---|---|---|
| Project name | **Halo** | 2026-04-25 |
| Grant program | **Solana Mobile Builder Grant** ($10k–$20k tier, rolling submissions, no deadline) | confirmed open 2026-04-25 |
| Grant ask amount | **$20k** (top of tier, line-itemed in §15 of HALO.md) | 2026-04-25 |
| License | **Open source** — Apache-2.0 leaning vs MIT, decide before first commit | 2026-04-25 |
| Squads multisig | **Defer to Squads-DAO model later (option C)**. At MVP: solo dev keypair under Pratik. Migrate to multisig pre-mainnet, full DAO post-grant | 2026-04-25 |
| DevRel | **No paid contractor.** Leverage Turbin3 alumni + Superteam India for warm intros; demo-led cold outreach as fallback | 2026-04-25 |
| Bridge Radar (Pratik's other project) | **Paused** for ~2 weeks while Halo magic-moment demo ships | 2026-04-25 |
| Telegram + X handle | **@pratikkale26** (same on both) | 2026-04-25 |

## Open decisions (need Pratik's input next session)

1. **Apache-2.0 vs MIT** — pick before first commit
2. **Domain name** — `halo.dev` / `halo.so` / `halo.xyz` / other? Run availability check
3. **Squads cosigners** — needed at M2 (~6 weeks out); list 2 trusted advisors
4. **Audit firm** — solicit quotes from Halborn, OtterSec, Sec3, Neodyme; pick based on Anchor + SAS familiarity
5. **GitHub repo rename** — `vaultguard` → `halo` (cosmetic; do whenever convenient)
6. **Local dir rename** — `/home/pk/projects/vaultguard` → `/home/pk/projects/halo` (cosmetic; will require git remote check)
7. **IIT Madras conflict-of-interest disclosure** — for grant application

## Next-session immediate actions (in order)

1. **Skill: `/scaffold-project`** in `/home/pk/projects/vaultguard` — set up Anchor + Kotlin Android module + React Native (Expo) bridge + docs site (Docusaurus) + Cargo + package.json
2. **First commit** — only after Pratik explicitly authorizes
3. **Skill: `/build-with-claude`** — guided week-1 magic-moment demo:
   - Anchor program scaffold (PolicyRegistry, IssuerAuthority, verify_attestation)
   - SAS schema authority registration on devnet
   - Seed Vault simulator on Android emulator (API 31+)
   - Kotlin SDK skeleton + Seed Vault binding
   - End-to-end demo: drainer attempts → Halo blocks → user sees real tx → declines

4. **Skill: `/create-pitch-deck`** — at end of week 1, after demo is real
5. **Skill: `/apply-grant`** — once deck + demo video are ready (also reusable for Bridge Radar India grant)

## Key research artifacts (already gathered)

- **Colosseum Copilot search:** 6 queries across 5,400+ Solana hackathon projects ran on 2026-04-25. **Confirmed: zero overlap with Halo's Seeker-native, on-device, hardware-attested SDK wedge.** Closest competitors are all browser-extension (GuardSOL, BlockLock, SolGuard) or server-side AI scanners (Rug Raider, Iteration 0001) — none with the hardware-attestation moat. Past Solana Mobile track winners surveyed: Unruggable ($30k hardware wallet), Cloak ($15k privacy), Rekt ($15k DeFi), PlaiPin ($15k), Humanship ID ($5k). Funded categories validate Halo's shape.
- **GitHub:** `solana-mobile/seed-vault-sdk` issue #36 ("validate incoming transactions") still open — confirms the gap Halo fills.
- **SAS:** Live on mainnet. Current issuers (Civic, Trusta, Solid, Wecan) are all KYC/identity. Zero transaction-level or device-bound attestation issuers exist — Halo would be first.
- **Threat data:** $90M+ lost to Solana drainers H1 2025; $285M Drift exploit on April 1, 2026 (admin-key compromise, DPRK-linked) — punchy hooks for grant pitch.

## Key files in this workspace

| File | Purpose |
|---|---|
| `HALO.md` | Master spec — 18 sections, grant-application-ready |
| `PROGRESS.md` | This file — session handoff |

## Files NOT to touch (other projects)

- `/home/pk/projects/mobile-project/` — Bridge Radar (separate Solana Foundation India $5k grant project, paused)
- `/home/pk/projects/anvil-layoutd/` — layoutd (Rudra Prajapati's $5k India grant — public artifacts must credit Rudra only)

## Pause note

Pratik paused at 2026-04-25 ~13:20 IST. He said: *"final halo and save the progress till now we will do other stuff in a while."* Resume by reading this file + HALO.md, then asking Pratik whether he wants to scaffold or work on something else.
