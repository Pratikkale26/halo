# Halo — Go-to-Market Cheatsheet

A compact ops doc for the post-grant adoption sprint. Lifted from `HALO.md` §13 and updated with concrete sequencing.

## Week 1 (post-launch) — own the ecosystem channels

| Day | Action | Owner |
|---|---|---|
| Mon | Open-source push: GitHub repo public, README polish, npm publish `@halo/sdk` + `@halo/detector` | Pratik |
| Mon | Demo video live on YouTube + cross-post on X with thread | Pratik |
| Tue | Post in Solana Mobile Discord #builders and #showcase | Pratik |
| Tue | Post in Superteam India Telegram + Turbin3 alumni Discord | Pratik |
| Wed | Tip-off Helius blog (devrel@helius.dev) + offer guest post | Pratik |
| Wed | Cold DM @solanamobile on X with demo link | Pratik |
| Thu | Submit to Solana dApp Store (demo app, not the SDK) | Pratik |
| Fri | Post on Solana DAO governance forum: "RFC: Halo as Solana ecosystem standard" | Pratik |

## First 10 named users to chase

| # | Target | Hook | Channel |
|---|---|---|---|
| 1 | Solana Mobile DevRel | Direct demo, ask for placement in Seeker dApp Store launch features | Discord, then email |
| 2 | Phantom mobile | "Drop-in defense for the drainer kits bypassing your Blockaid simulations" | Their `@phantom` X DM, or contact via help.phantom.app |
| 3 | Backpack | Same pitch, tailored to xNFT positioning | Founder X (@armaniferrante) or Discord |
| 4 | Solflare | They built the Seed Vault Wallet — natural co-marketing partner | hello@solflare.com |
| 5 | Kamino DevRel | Step-up auth for high-value lending positions | Discord, then warm intro via Turbin3 |
| 6 | Marginfi / Jupiter Perps | Same step-up pitch | Discord |
| 7 | Squads team | "AdminGuard: extend your multisig with hardware-attested signers" — direct partnership | hello@squads.so |
| 8 | Magic Eden mobile | NFT bait-and-switch defense | Direct partner email |
| 9 | Drift relaunch effort (if any) | Use-case zero: would have prevented April 1 | LinkedIn / X to remaining team |
| 10 | A Cypherpunk hackathon team building a wallet | Easy adoption for next hackathon | Colosseum Discord |

## Earned-media opportunities

- **Next drainer exploit hits.** Tweet within 2 hours: "VaultGuard would have blocked this — here's the demo of exactly that pattern" + link. Capitalize on the Twitter algorithm spike.
- **Solana Foundation incident response posts.** Reply with a thread linking to Halo's relevant rule.
- **Helius end-of-quarter Solana ecosystem report.** Pitch them on a "wallet security state of the union" guest post co-authored.

## Pricing (post-MVP, post-traction)

| Tier | Price | What you get |
|---|---|---|
| **Open-core SDK** | Free, Apache-2.0 | Self-host, run your own issuer, use the public `Halo` program |
| **Hosted issuer** | $0.001 per attestation issued | We run the Halo issuer authority + monitoring; you skip ops |
| **Enterprise** | Annual contract | SLA, custom rule packs, audit support, white-glove integration |
| **Insurance partnership take-rate** | TBD | Premium discount for Halo-protected flows; we share rev with insurer |

Post-MVP. Don't price-list during the grant phase.

## Conference / event roadmap (rough)

- **Breakpoint India** — present a 5-min lightning talk; demo on stage
- **Cypherpunk hackathon** — submit Halo + AdminGuard module as a separate track entry
- **Solana Mobile dev community office hours** (if recurring) — show up
- **DAS NYC 2027** — by then, AdminGuard should be live; pitch Multicoin / Hack VC for a follow-on

## Metrics that matter

| Metric | Definition | Target by month 3 post-grant |
|---|---|---|
| dApps integrated | Live programs CPI'ing `verify_attestation` | 3 |
| Daily attestations issued | Mainnet `issue_attestation` count | 1,000+ |
| Drainers blocked | Critical findings in production telemetry | 50+ |
| GitHub stars | Vanity but signals reach | 500+ |
| Real-world incidents prevented | Externally attributed | At least 1 |

If we hit "incidents prevented = 1" in the first 90 days, the round-2 grant ask writes itself.
