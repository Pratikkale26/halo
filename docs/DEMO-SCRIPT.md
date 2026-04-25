# Halo — 90-second demo video script

> **For the Solana Mobile Builder Grant submission.** The grant form has a "Link To Demo Video" field. Recording recommendation: Loom on macOS, screen-record an Android emulator running the Expo app, your voice as VO. Total runtime ~90 seconds. Three scenes.

---

## Pre-recording checklist

- [ ] `pnpm install` complete; emulator booted (Pixel 6, API 31+, dark theme)
- [ ] `pnpm --filter @halo/demo start` running; demo loaded
- [ ] Loom set to 1080p, 24fps; mic level checked
- [ ] Close all notifications, do-not-disturb on
- [ ] Browser tab with the 3 reference articles open in a separate window for the lower-third citations

---

## SCENE 1 — Hook (0:00 – 0:20)

**Visual:** Title card "Halo" over a black background, then quick cut to a screen-recording of a mobile wallet showing a phishing transaction approval screen.

**VO (read in a steady, factual tone):**

> "Solana users lost over ninety million dollars to wallet drainers in the first half of 2025 alone. On April first, twenty twenty-six, Drift Protocol was exploited for two hundred and eighty-five million dollars when an admin key was compromised. The drainers are evolving — the latest kits bypass server-side wallet simulations. Existing defenses aren't enough."

---

## SCENE 2 — The drainer (0:20 – 0:55)

**Visual:** Open the Expo app on the emulator. Tap the second card ("Claim free SOL airdrop"). Show the screen with the user-facing description, then scroll to the decoded instructions, then to the Halo report card.

**VO:**

> "This is what a typical drainer Blink looks like. The dApp tells the user it's a free airdrop. But the actual transaction —" *(pause; scroll to the decoded instructions)* "— contains a system-program Assign instruction that hands the user's USDC token account over to an attacker. Most wallets render the friendly description. Halo decodes what the bytes actually do."

*(Scroll to the Halo report card — show the BLOCKED badge and the critical finding.)*

> "The on-device detector sees it. Risk score: ninety. Halo blocks the transaction *before* Seed Vault is even asked to sign. The drainer never gets the user's biometric."

---

## SCENE 3 — The honest path + integration (0:55 – 1:30)

**Visual:** Tap "Back to scenarios," then tap the first card ("Deposit 5,000 USDC into Kamino"). Walk through preview → Seed Vault prompt → Approved.

**VO:**

> "Same wallet, same flow, honest dApp. Risk score zero. Seed Vault prompts for biometric inside the Seeker's secure execution environment. Approved. Halo issues a SAS attestation that any Solana program can verify with five lines of CPI."

*(Cut to a 5-second still showing the Anchor CPI snippet from `docs/INTEGRATION.md`.)*

> "Halo is open-source under Apache 2.0 — drop-in mobile SDK plus on-chain verifier. Built for the Solana Mobile Builder Grant. Repo and docs in the description."

---

## Lower-third citations (overlay text)

- 0:08 — "$90M+ lost · H1 2025 · Solana phishing report"
- 0:13 — "Drift Protocol · April 1 2026 · admin-key compromise"
- 0:30 — "Drainer technique: dev.to/ohmygod/anatomy-of-a-solana-wallet-drainer"
- 1:15 — "github.com/Pratikkale26/vaultguard · Apache 2.0"

---

## Practice run notes

- Hit the 30s, 55s, 90s marks within ±2 seconds. Reviewers tune out past 2 minutes.
- Keep the emulator visible at all times — VO complements, doesn't substitute for the visual.
- The "drainer never gets the user's biometric" line is the single most important sentence. Land it.
- If Loom inserts a clap-cursor at the end, edit it out — keep the final frame clean.
