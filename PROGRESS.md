# Halo — session progress (2026-04-25)

> **Autonomous build session complete.** Pratik authorized full autonomous mode at ~13:25 IST and stepped away. This file records what shipped, the commit history, and what's left for him to do hands-on.

## Project identity

- **Name (final):** Halo *(was VaultGuard during scoping; renamed 2026-04-25)*
- **Master spec:** `HALO.md` (673 lines, 18 sections, grant-application-ready)
- **Hands-on to-do:** `NEXT-STEPS.md` (read this when you come back)
- **Local workspace:** `/home/pk/projects/vaultguard` *(dir name retained; rename to `halo` is cosmetic)*
- **GitHub remote:** `https://github.com/Pratikkale26/vaultguard.git` (9 commits made, **not pushed**)
- **One-liner:** Hardware-attested transaction defense SDK for Solana — Seeker's Seed Vault + SAS.

## Locked decisions

| Topic | Decision |
|---|---|
| Project name | **Halo** |
| Grant program | Solana Mobile Builder Grant (rolling, no deadline, confirmed open) |
| Grant ask | **$20k** (top of $10–$20k tier; line-itemed in HALO.md §15) |
| License | **Apache-2.0** (locked in autonomous build; LICENSE file + all package.json) |
| Squads multisig | Defer to Squads-DAO model (option C). Solo dev keypair through MVP. |
| DevRel | No paid contractor. Turbin3 alumni + Superteam India warm intros. |
| Bridge Radar | Paused 2 weeks. |
| X / Telegram handle | @pratikkale26 (both). |

## Commit history (autonomous build session)

```
c91b6e3 chore: add deployment scripts, demo policy, and NEXT-STEPS handoff
3119e84 docs: add architecture, integration, demo-script, and GTM playbook
ac4f35e feat(demo): add Expo / React Native demo app
36f5d16 feat(sdk): add @halo/sdk client wrapping detector + MWA + SAS
5b26afc test(detector): add vitest unit tests for all 5 drainer rules
4b99724 feat(detector): add @halo/detector with 5 drainer rules
4c0f8bc test(program): add Anchor integration tests
15ba89d feat(program): add halo Anchor program
b0355f9 chore: initial monorepo scaffold
```

9 atomic commits. None of them include `Co-Authored-By: Claude` (per the repeated user preference).

## What shipped

| Layer | Path | Status |
|---|---|---|
| Spec | `HALO.md`, `README.md`, `LICENSE` | ✅ |
| On-chain program | `programs/halo/` (Rust / Anchor 0.30) | ✅ code complete, **build unverified** |
| Program tests | `tests/halo.ts` (9 cases) | ✅ |
| Drainer detector | `packages/halo-detector/` (5 rules + Analyzer) | ✅ |
| Detector tests | `packages/halo-detector/tests/` (vitest, 11 cases) | ✅ |
| Halo SDK | `packages/halo-sdk/` (HaloClient + MWA/mock backends) | ✅ |
| Expo demo | `apps/demo/` (Drainer vs Halo, 2 scenarios) | ✅ |
| Architecture doc | `docs/ARCHITECTURE.md` | ✅ |
| Integration guide | `docs/INTEGRATION.md` (5+5 line integration) | ✅ |
| Demo video script | `docs/DEMO-SCRIPT.md` (90-sec, 3 scenes) | ✅ |
| GTM playbook | `docs/GTM.md` | ✅ |
| Deployment scripts | `scripts/gen-keypair.sh`, `deploy-devnet.sh`, `seed-policy.ts` | ✅ |
| Demo policy doc | `policies/kamino-deposit-v1.json` | ✅ |
| Hands-on to-do | `NEXT-STEPS.md` (9 ordered steps) | ✅ |

## What needs Pratik's hands

Read `NEXT-STEPS.md` for the ordered list. Highlights:

1. **Push to GitHub** (`git push -u origin main`)
2. **Verify build** (`pnpm install`, `cargo check`, `anchor build`, `anchor keys sync`)
3. **Run tests** (`pnpm --filter @halo/detector test`, `anchor test`)
4. **Devnet deploy** (`scripts/gen-keypair.sh` + `scripts/deploy-devnet.sh` + `seed-policy.ts`)
5. **Run the Expo demo on a real Android emulator**
6. **Record the demo video** off `docs/DEMO-SCRIPT.md`
7. **Build pitch deck** via `/create-pitch-deck` skill
8. **Submit grant** at solanamobile.com/grants (form fields drafted in HALO.md §14)
9. **Pre-submission warm intro** in Turbin3 / Superteam India channels (5-min ask, big lift)

## Open decisions still to lock

See HALO.md §17 + NEXT-STEPS.md "Decisions still open":

- Domain name (halo.dev / halo.so / halo.xyz)
- Squads cosigners (M2, ~6 weeks out)
- Audit firm (week 5 post-grant)
- IIT Madras conflict-of-interest disclosure for grant form
- GitHub repo rename `vaultguard` → `halo` (cosmetic)

## Files NOT to touch (other projects)

- `/home/pk/projects/mobile-project/` — Bridge Radar (Solana Foundation India $5k, paused)
- `/home/pk/projects/anvil-layoutd/` — layoutd (Rudra Prajapati's $5k grant — public artifacts must credit Rudra only)

## Resume instructions

When Pratik comes back:

1. He reads `NEXT-STEPS.md` to see what's hands-on for him.
2. If he says "resume halo" → re-read `HALO.md` + `PROGRESS.md` + `NEXT-STEPS.md` and ask which of the 9 hands-on steps he wants help with first. Don't re-litigate locked decisions.
3. If he wants to push or deploy together, walk through the exact commands. Don't push or deploy without his explicit authorization.
4. If a build / test fails: triage, don't panic-rewrite. Most likely: peer-dep version drift, Anchor version mismatch, or a fixture I miscalibrated.

## Author

Pratik Kale — built solo for the Solana Mobile Builder Grant.
