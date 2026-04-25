# Integrating Halo into your dApp

Five lines of TypeScript on the client + five lines of Anchor on the server. This guide walks through both.

## 1. Pick a policy

Decide which actions in your dApp warrant a hardware-attested confirmation. Common picks:

- Deposits / withdrawals over a USD threshold
- Granting a token approval (always)
- Closing a position
- Anything involving admin keys (Squads-style)

Write it down as a JSON document. Example for a Kamino-style lending UI:

```jsonc
{
  "name": "kamino-deposit-v1",
  "description": "Halo-attested confirmation for Kamino deposits >= $1k",
  "maxValueUsd": 100000,
  "minStepUpUsd": 1000,
  "allowedPrograms": [
    "11111111111111111111111111111111",
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
    "KaminoLending111111111111111111111111111111"
  ],
  "blockOn": ["criticalDrainerPattern"]
}
```

Pin it on IPFS / Arweave / GitHub / your own CDN. Get the URI.

## 2. Compute the policy hash

```typescript
import { hashPolicyJson } from "@halo/sdk";

const policyHash = await hashPolicyJson(policyJson);  // 32 bytes
```

## 3. Register the policy on-chain (one-time)

```typescript
import { Program } from "@coral-xyz/anchor";
import { Halo } from "@halo/sdk/idl"; // generated from anchor build

const halo = anchor.workspace.Halo as Program<Halo>;
const [policyPda] = derivePolicyPda(halo.programId, policyHash);

await halo.methods
  .registerPolicy({
    policyHash: Array.from(policyHash),
    schemaUri: "ipfs://bafy.../kamino-deposit-v1.json",
    maxRiskScore: 30,
    maxAgeSecs: new BN(60),
  })
  .accounts({
    policy: policyPda,
    authority: yourDappAuthorityKeypair.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([yourDappAuthorityKeypair])
  .rpc();
```

## 4. Wrap your transaction (client side, 5 lines)

```typescript
import { HaloClient } from "@halo/sdk";

const halo = new HaloClient({
  connection,
  policyId: "kamino-deposit-v1",
  policyHash,
  haloProgramId: HALO_PROGRAM_ID,
  allowedPrograms: KAMINO_ALLOWED_PROGRAMS,
  blinksContext: { description: "Deposit 5,000 USDC into Kamino", expectedRecipientPrograms: [KAMINO_PROGRAM] },
});

const result = await halo.signWithAttestation({ transaction, account, context: { description, valueUsd } });

if (result.status === "approved") {
  await connection.sendRawTransaction(result.signedTransaction.serialize());
  // Pass result.attestation to the on-chain handler below.
}
```

## 5. Verify in your program (5 lines of Anchor CPI)

```rust
use halo::cpi::accounts::VerifyAttestation;
use halo::cpi;
use halo::program::Halo;

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub vault: Account<'info, KaminoVault>,
    /// CHECK: passed through to halo verifier
    pub halo_attestation: AccountInfo<'info>,
    /// CHECK: passed through to halo verifier
    pub halo_policy: AccountInfo<'info>,
    /// CHECK: passed through to halo verifier
    pub halo_issuer_authority: AccountInfo<'info>,
    pub halo_program: Program<'info, Halo>,
    // ...
}

pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    if amount > FIVE_HUNDRED_USDC {
        cpi::verify_attestation(
            CpiContext::new(
                ctx.accounts.halo_program.to_account_info(),
                VerifyAttestation {
                    attestation: ctx.accounts.halo_attestation.to_account_info(),
                    policy: ctx.accounts.halo_policy.to_account_info(),
                    issuer_authority: ctx.accounts.halo_issuer_authority.to_account_info(),
                },
            ),
            halo::instructions::VerifyAttestationParams {
                expected_user: ctx.accounts.user.key(),
                expected_policy_hash: KAMINO_DEPOSIT_POLICY_HASH,
                max_age_secs: 60,
                expected_tx_hash: None,
            },
        )?;
    }
    // ... your normal deposit logic
}
```

That's the entire integration.

## Checklist before going live

- [ ] Policy JSON pinned on permanent storage (IPFS / Arweave; not your own server)
- [ ] PolicyRegistry registered on the cluster you deploy to
- [ ] Halo program deployed (or use the canonical Halo deployment if it exists on your cluster)
- [ ] Your verifier handler tests cover both Halo-attested and Halo-skipped paths
- [ ] Your client renders Halo's `report.findings` to the user when status is `blocked` so they understand what was prevented
