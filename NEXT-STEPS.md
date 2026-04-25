# NEXT STEPS — Halo

> **Read this first when you come back.** Quick map of where the project is, what you do next, and what's parked.

## Where the project stands (2026-04-25)

| Area | Status |
|---|---|
| Spec (`HALO.md`) | ✅ 18 sections, all decisions current |
| Anchor program (`programs/halo/`) | ✅ Code complete, compiles target unverified |
| Anchor program tests (`tests/halo.ts`) | ✅ 9 test cases, run via `anchor test` |
| `@halo/detector` package | ✅ 5 drainer rules + Analyzer, fully tested |
| `@halo/sdk` package | ✅ HaloClient + MWA/mock backends + PDA helpers |
| Expo demo (`apps/demo/`) | ✅ 2 scenarios, runs on emulator |
| Docs (`docs/`) | ✅ ARCHITECTURE, INTEGRATION, DEMO-SCRIPT, GTM |
| Devnet deploy | ⏸️ scripts written, not yet run |
| Demo video | ⏸️ script written, not yet recorded |
| Grant submission | ⏸️ form fields drafted in HALO.md §14 |
| GitHub push | ⏸️ remote configured (`Pratikkale26/vaultguard`), not pushed |

## Your immediate to-do list (in order)

### 1. Push to GitHub (5 min)

```bash
cd /home/pk/projects/vaultguard
git push -u origin main
```

The remote is already configured. The 9 atomic commits will show on GitHub immediately.

### 2. Install dependencies + verify the toolchain (15 min)

```bash
pnpm install                                # JS workspaces
cargo build --release --manifest-path programs/halo/Cargo.toml   # sanity check Rust compiles standalone
anchor build                                # builds the on-chain program
```

If `anchor build` succeeds, run:
```bash
anchor keys sync                            # syncs the real program ID into Anchor.toml + lib.rs
git diff                                    # review the auto-changes
git add Anchor.toml programs/halo/src/lib.rs && git commit -m "chore: sync program ID after first build"
```

### 3. Run the test suites (10 min)

```bash
pnpm --filter @halo/detector test           # vitest — should pass clean
anchor test                                 # spins up local validator + runs tests/halo.ts
```

Triage any failures here — most likely candidates are: peer-dep version drift, Anchor 0.30 vs 0.31 syntax, or a test fixture I miscalibrated.

### 4. Devnet deploy (30 min)

```bash
bash scripts/gen-keypair.sh                 # generates .keys/* (deployer, program, policy authority, issuer)
                                            # COPY the program-id pubkey it prints
# Edit Anchor.toml [programs.devnet] and programs/halo/src/lib.rs declare_id! with the new pubkey
solana config set --url devnet
solana airdrop 5 $(solana-keygen pubkey .keys/deployer.json) --url devnet
bash scripts/deploy-devnet.sh
pnpm exec ts-node scripts/seed-policy.ts    # registers the kamino-deposit-v1 policy
```

### 5. Run the demo on a real Android emulator (45 min)

```bash
pnpm --filter @halo/demo start              # opens Expo dev tools
# Press 'a' to launch on a connected Android emulator (Pixel 6, API 31+)
```

Walk through both scenarios end-to-end. Take screenshots — you'll need them for the pitch deck.

### 6. Record the demo video (1 hour)

Open `docs/DEMO-SCRIPT.md` and follow the recording checklist. Aim for 90 seconds; reviewers tune out past 2 minutes.

Upload to Loom or YouTube. Note the URL — you need it for the grant form.

### 7. Build the pitch deck (2 hours)

Run the `/create-pitch-deck` skill in the project root. It'll pull from `HALO.md` automatically. Slide order I'd recommend:
1. Cover — "Halo: Hardware-attested transaction defense for Solana"
2. The problem ($90M+ + Drift hack data)
3. Why existing defenses fail (Blockaid is server-side, browser extensions don't reach mobile, etc.)
4. Solution architecture (use the diagram from `docs/ARCHITECTURE.md`)
5. Demo (embed the video / link)
6. Why Seeker (the only mobile platform with the right trust boundary)
7. Competitive landscape (the table from HALO.md §8.1)
8. Team — Pratik + your background
9. Roadmap (use HALO.md §12)
10. The ask: $12k from Solana Mobile Builder Grant

### 8. Submit the grant (30 min)

Fill out the form at https://solanamobile.com/grants. The field-by-field draft answers are in `HALO.md` §14. Use the Apply Now button.

### 9. Pre-submission warm-intro (parallel with steps 6-8)

In the Turbin3 alumni Discord and Superteam India Telegram:
> "Hey, finishing a Solana Mobile Builder Grant submission this week — Halo, hardware-attested anti-drainer SDK for Seeker. Anyone here connected to the Solana Mobile team and willing to make a 1-line intro? Demo video + repo: <links>. Will share what comes back."

Cost: 5 minutes. Conversion uplift: large.

## What's parked (post-grant)

- **AdminGuard module** — Squads-style multisig where signers must hardware-attest. The Drift exploit angle. Implement in M4 per HALO.md §12.
- **SignerPass** — web→Seeker 2FA bridge. M3.
- **Drainer rule library v2** — full coverage of known drainer patterns (~50 rules). M1.
- **On-chain `issue_attestation` CPI from the SDK** — the SDK currently returns the attestation PDA address but doesn't issue it. TODO marker in `packages/halo-sdk/src/client.ts`. Wire this up before the first real production integration.
- **Native Kotlin Seed Vault module** — currently the SDK uses MWA. For deeper integrations (custom secure-display rendering, on-device sBPF interpreter) we'll need a true Kotlin module. Defer until a wallet partner asks for it.
- **GitHub repo rename** `vaultguard` → `halo` (cosmetic). Run on github.com when convenient; local dir name and git remote will keep working either way.

## Decisions still open

See `HALO.md` §17. Unblocking ones:
- **License**: HALO commits already say Apache-2.0 (in package.json + LICENSE file). If you want MIT instead, change the LICENSE file and `license` field in each package.json before pushing.
- **Domain**: pick `halo.dev` / `halo.so` / `halo.xyz`. Buy when ready.
- **Squads cosigners**: 2 names by M2 (~6 weeks out). No rush.
- **Audit firm**: solicit quotes from Halborn / OtterSec / Sec3 / Neodyme around week 5 (post-grant).

## What I did that you should sanity-check

- Anchor 0.30.1 syntax assumed; if your installed version differs, `Cargo.toml` + `Anchor.toml` may need a tweak.
- The `seed-vault-sdk` integration is intentionally unfinished — the SDK has an `MwaWalletBackend` stub with the real wiring documented in comments. Implement when a real Seeker is in hand (HALO.md §15 budget item).
- Demo `tx.data` field uses simplified hex-encoded discriminators rather than full bs58. The detector handles both encodings, but if you want pixel-perfect realism in the demo, swap the fixtures for ones generated via @solana/web3.js's actual instruction builders.
- `tests/halo.ts` references `target/types/halo` which only exists after `anchor build`. Don't run the tests before building.

## Resume the conversation

When you come back, the easiest entry is: read `HALO.md` + `PROGRESS.md` + this file (`NEXT-STEPS.md`), then say "resume halo, status?" and I'll catch up + push on the next blocking item.
