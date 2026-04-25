//! # Halo Verifier Program
//!
//! On-chain verifier for hardware-attested signing on Solana, anchored to the
//! Solana Attestation Service (SAS) and the Seeker's Seed Vault.
//!
//! ## What this program does
//! 1. Maintains a registry of risk **policies** that dApps can reference.
//! 2. Maintains the **issuer authority** that signs hardware-attested credentials
//!    (a single dev keypair at MVP; migrates to Squads multisig pre-mainnet).
//! 3. Provides a CPI-callable `verify_attestation` instruction that any other
//!    Solana program can invoke as a precondition for sensitive instructions.
//! 4. Maintains a per-policy **revocation list** for emergency response.
//!
//! ## What this program intentionally does NOT do
//! - It does not run transaction simulation (that runs on-device in the Halo SDK
//!   inside the Seeker's secure execution environment).
//! - It does not store user transaction details (only attestation hashes).
//! - It does not control the wallet's signing process (the wallet still signs
//!   via Mobile Wallet Adapter; Halo issues a separate attestation account).
//!
//! See `HALO.md` §7 for full design rationale.

use anchor_lang::prelude::*;

mod error;
mod instructions;
mod state;

use instructions::*;

// Placeholder program ID — a valid 32-byte pubkey that compiles cleanly.
// Run `anchor keys sync` after first build to replace with the real program
// ID from `target/deploy/halo-keypair.json`.
declare_id!("HUd9rbV6jTCD6HUufKRdFNx4jc7qhxAusejXDkZZ1KF7");

#[program]
pub mod halo {
    use super::*;

    /// Initialize the singleton IssuerAuthority account that signs attestations.
    /// At MVP this is a single dev keypair; migrates to a Squads multisig before
    /// any production integration. See HALO.md §17 (open decisions, item 4).
    pub fn initialize_issuer(
        ctx: Context<InitializeIssuer>,
        params: InitializeIssuerParams,
    ) -> Result<()> {
        instructions::initialize_issuer::handler(ctx, params)
    }

    /// Rotate the issuer authority pubkey. Gated by the `upgrade_authority`
    /// (Squads multisig in production). Used for key rotation or compromise
    /// response.
    pub fn rotate_issuer(ctx: Context<RotateIssuer>, new_authority: Pubkey) -> Result<()> {
        instructions::rotate_issuer::handler(ctx, new_authority)
    }

    /// Register a risk policy under a stable policy ID. dApps reference this
    /// policy when they request hardware-attested signing.
    pub fn register_policy(ctx: Context<RegisterPolicy>, params: RegisterPolicyParams) -> Result<()> {
        instructions::register_policy::handler(ctx, params)
    }

    /// Revoke a previously registered policy. After revocation, attestations
    /// that reference this policy fail `verify_attestation`.
    pub fn revoke_policy(ctx: Context<RevokePolicy>) -> Result<()> {
        instructions::revoke_policy::handler(ctx)
    }

    /// Issue a hardware-attested credential. Called by the Halo SDK after the
    /// user approves a transaction inside the Seeker's secure execution
    /// environment. The credential is stored as a PDA under
    /// `[ATTESTATION_SEED, user, tx_hash]`.
    pub fn issue_attestation(
        ctx: Context<IssueAttestation>,
        params: IssueAttestationParams,
    ) -> Result<()> {
        instructions::issue_attestation::handler(ctx, params)
    }

    /// Verify an attestation. Designed for CPI from any other Solana program.
    /// Returns `Ok(())` if the attestation is valid for the given policy and
    /// user; returns a typed `HaloError` otherwise.
    ///
    /// dApp integration example (5 lines of Anchor CPI):
    /// ```ignore
    /// halo::cpi::verify_attestation(
    ///     ctx.accounts.into_halo_ctx(),
    ///     VerifyAttestationParams {
    ///         expected_user: ctx.accounts.user.key(),
    ///         expected_policy: KAMINO_DEPOSIT_POLICY,
    ///         max_age_secs: 60,
    ///     },
    /// )?;
    /// ```
    pub fn verify_attestation(
        ctx: Context<VerifyAttestation>,
        params: VerifyAttestationParams,
    ) -> Result<()> {
        instructions::verify_attestation::handler(ctx, params)
    }
}
