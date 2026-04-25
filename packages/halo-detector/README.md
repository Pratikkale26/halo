# @halo/detector

> **On-device drainer-pattern detector for Solana transactions.**

Pure TypeScript rule engine that the Halo SDK runs **inside the Seeker's secure execution environment** to flag dangerous transaction patterns *before* the user is asked to sign.

## Why on-device

Server-side detectors (Blockaid, etc.) require sending the transaction off the device, where a malicious app or middleware can MITM the response — show "looks safe" and sign something different (the TOCTOU class of attacks). The detector in this package runs in the same trust boundary as the Seed Vault signing key, so the report the user sees is the same report applied to the bytes that actually get signed.

## Rule library v1 (5 rules)

| Rule ID | Severity | Detects |
|---|---|---|
| `assign-attack` | critical | `system_program::Assign` to a non-allowlisted program — the canonical owner-reassignment attack |
| `hidden-token-approval` | critical | A `spl_token::Approve` (or Token-2022 equivalent) that the user wasn't shown — drainer prep |
| `transfer-hook-abuse` | critical | Token-2022 transfer-hook program pointing to a suspicious / non-allowlisted account |
| `durable-nonce-abuse` | warning | Use of a `system_program::AdvanceNonceAccount` instruction in a context where the wallet didn't ask for one (delayed-execution attack) |
| `blinks-mismatch` | critical | The user-facing Blinks action description doesn't match the instructions actually present |

## Usage

```typescript
import { Analyzer } from "@halo/detector";

const analyzer = new Analyzer({
  allowedPrograms: [
    "11111111111111111111111111111111",                 // System Program
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",      // SPL Token
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",     // Associated Token Account Program
    "KaminoLending111111111111111111111111111111",      // Kamino (your dApp)
  ],
  blinksContext: {
    description: "Deposit 5,000 USDC into Kamino main market",
    expectedRecipientPrograms: ["KaminoLending111111111111111111111111111111"],
  },
});

const report = analyzer.analyze(transaction);

if (report.shouldBlock) {
  // Halt before signing — show the user what we found.
  console.log(report.findings);
} else {
  // Pass to Seed Vault for biometric approval.
}
```

## Output shape

```typescript
type Report = {
  riskScore: number;           // 0-100, higher = more risky
  shouldBlock: boolean;        // true if any critical rule triggered
  findings: Finding[];
};

type Finding = {
  ruleId: string;
  severity: "info" | "warning" | "critical";
  reason: string;              // Human-readable explanation
  evidence: unknown;           // Structured detail (instruction index, accounts, etc.)
};
```

## Design principles

1. **Pure / synchronous.** No network calls, no I/O. Runnable inside any TEE or restricted JS runtime.
2. **Composable.** Rules are independent; you can add your own.
3. **Conservative defaults.** Allow-list rather than deny-list where possible — drainers innovate too fast for blocklists.
4. **Explainable.** Every finding includes both a human reason and structured evidence the host UI can render.

## License

Apache-2.0
