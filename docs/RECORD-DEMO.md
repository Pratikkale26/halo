# Halo — Demo Recording Runbook

> **You'll do the recording. This is your director.** Estimated time: 1 hour total (15 min setup + 10 min tools + 30 min recording + 5 min post).

The companion to `docs/DEMO-SCRIPT.md` — that file is the *script*; this file is the *production runbook*.

---

## Phase 1 — Setup (15 min, do this once)

```bash
cd /home/pk/projects/vaultguard
pnpm install                           # already done; re-run to be safe
pnpm --filter @halo/demo start         # opens Expo dev tools
```

Then in the Expo CLI prompt:

- Press **`a`** → launches on Android emulator (requires Android Studio AVD set up)
- OR press **`s`** then scan the QR code with the Expo Go app on your phone (no emulator needed — fastest path)

**Tap each scenario once to verify it works:**

| Scenario | Expected flow |
|---|---|
| 1 — Honest deposit | Card → Submit → Seed Vault prompt → Approve → green success state |
| 2 — Drainer airdrop | Card → Submit → instantly hits red "Halo blocked this transaction" banner |

If both flow cleanly, you're ready to record. If anything's off, fix it before you hit record — re-doing takes is more painful than fixing the underlying issue.

---

## Phase 2 — Recording tools (10 min)

**Free options:**

| Tool | Platform | Pros | Cons |
|---|---|---|---|
| **Loom** ⭐ recommended | Cross-platform | Built-in upload, instant shareable URL, no editing required | Free plan caps at 5 min (we only need 90s) |
| QuickTime | macOS | Pre-installed | Manual upload required |
| OBS Studio | Cross-platform | Powerful, multi-source | Setup overhead |

**Use Loom.** Click record, screen-share the emulator window, talk, stop, copy URL. Done in one shot.

### Settings before you hit record

- Phone / emulator brightness 100%, dark theme on (the demo uses dark UI)
- Close all notifications · turn on Do Not Disturb
- Voice-test the mic at conversational volume — don't shout, don't whisper
- Have `docs/DEMO-SCRIPT.md` open in a second monitor or printed (don't read off-screen — eyes on the recording)
- Skip the webcam overlay — voice-only is more professional for a security pitch

---

## Phase 3 — Record (~30 min, expect 2–3 takes)

**Total runtime: 90 seconds.** Read the VO conversationally; don't perform.

### Beat-by-beat

| Time | What you do on screen | What you say (VO) |
|---|---|---|
| **0:00 – 0:08** | Open `docs/pitch-deck.html` in browser, full-screen on slide 1 (the title card) | "Hi, I'm Pratik. This is Halo — hardware-attested transaction defense for the Solana Seeker." |
| **0:08 – 0:25** | Switch to emulator/phone. Show the Halo Demo home screen. | "Solana users lost over $90 million to wallet drainers in the first half of 2025. April first this year, Drift Protocol was drained of $285 million in twelve minutes — attackers used Solana's durable-nonce feature to trick admin signers into pre-signing transactions they didn't understand. Existing defenses don't reach mobile users." |
| **0:25 – 0:55** | Tap the **second** card ("Claim free SOL airdrop"). Pause on the Transaction Preview — let the viewer see the description vs. the actual instructions. Then scroll down to show the red "BLOCKED" Halo report card. | "This is what a typical drainer Blink looks like. The dApp tells the user it's a free airdrop. But the actual transaction contains a system-program Assign instruction that hands the user's USDC token account over to an attacker. Halo decodes what the bytes actually do. The on-device detector catches it. Risk score 90. Halo blocks the transaction *before* Seed Vault is even asked to sign. **The drainer never gets the user's biometric.**" |
| **0:55 – 1:20** | Tap "Back to scenarios," then tap the **first** card ("Deposit 5,000 USDC into Kamino"). Tap Submit → Seed Vault prompt appears → tap Approve. | "Same wallet, honest dApp. Risk score zero. Seed Vault prompts for biometric inside the secure execution environment. Approved. Halo issues a SAS attestation that any Solana program can verify with five lines of CPI." |
| **1:20 – 1:30** | Switch back to browser. Open `docs/INTEGRATION.md` and scroll to the Anchor CPI snippet (or show your `github.com/Pratikkale26/halo` page). | "Apache 2.0. Twenty-three out of twenty-three tests passing. Built solo for the Solana Mobile Builder Grant. Repo and docs in the description below." |

### Pep talk for recording day

- **3 takes max.** First take is a warm-up. Second take is usually the keeper. If take 2 isn't right, try once more then ship the best of three.
- **Don't aim for perfect.** Slight verbal stumbles are fine — they sound human. Reviewers see polished AI-narrated videos and tune out faster than slightly imperfect human ones.
- **Land "the drainer never gets the user's biometric."** That's the single sentence that wins the deck. Pause briefly before saying it for emphasis.
- **End with the repo link spoken aloud.** "Github dot com slash Pratikkale26 slash halo" — reviewers may have already opened YouTube in another tab; spoken navigation cues let them switch without hunting in the description.

---

## Phase 4 — Post-record (5 min)

1. **Save the URL** Loom gives you (it auto-uploads).
2. Make it **public** (Loom default is "anyone with the link" — keep that). For YouTube, set to **Unlisted**.
3. Patch the pitch deck:

   ```bash
   # Open docs/pitch-deck.html → find {{DEMO_VIDEO_URL}} on slide 8 → replace with your URL
   # Open docs/pitch-deck.md → replace [demo video link — to be filled] on slide 8 with the same URL
   ```

4. Commit + push:

   ```bash
   git add docs/pitch-deck.html docs/pitch-deck.md
   git commit -m "docs: embed live demo video URL in pitch deck"
   git push
   ```

5. (Optional) Post a teaser tweet from `docs/GTM.md` "Twitter / X launch post" section.

---

## Then submit the grant

1. Upload the deck:
   - **Easiest:** host `docs/pitch-deck.html` on Vercel (free, 2 minutes via `vercel deploy`) — share the URL.
   - **Alternative:** paste `docs/pitch-deck.md` into Google Slides / Pitch / Figma, share the public link.

2. Open https://solanamobile.com/grants → "Apply Now".

3. Paste from `HALO.md §14` (the field-by-field table). Use the deck URL + demo URL where indicated.

4. Submit.

5. **Immediately after**, post warm-intro asks in:
   - Turbin3 alumni Discord/Slack
   - Superteam India Telegram

   Template:
   > "Just submitted Halo to the Solana Mobile Builder Grant — open-source hardware-attested anti-drainer SDK for the Seeker. Anyone here connected to the Solana Mobile team and willing to make a 1-line warm intro?
   >
   > Repo: github.com/Pratikkale26/halo
   > Demo: [your video URL]
   >
   > Will share whatever comes back."

---

## Common stumbles + fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| `expo start` fails with "Metro bundler can't find the workspace deps" | First-time monorepo resolution | Run `pnpm install` at repo root, then `pnpm --filter @halo/demo start` |
| Android emulator won't boot | AVD not set up | Use Expo Go on your physical phone instead — press `s` in the Expo CLI |
| Demo loads but the screens crash | Missing `@halo/sdk` build | Run `pnpm --filter @halo/sdk build` before starting the demo |
| Loom recording is stuck on "uploading" | Slow connection | Use YouTube Unlisted instead — drag-drop upload is faster on slow links |
| Voice-over sounds tinny | Built-in laptop mic | If you have AirPods / earbuds with a mic, use those instead — meaningful quality jump |

---

## Resume cues

When you're back at the keyboard:

- "**Halo: demo recorded, URL is X**" → I patch the deck and push
- "**Halo: emulator won't start**" → I triage with you
- "**Halo: ready to submit, walk me through the form**" → I sit with you for the field fill
