use anchor_lang::prelude::*;

use crate::error::HaloError;
use crate::state::{
    Attestation, IssuerAuthority, PolicyRegistry, ATTESTATION_SEED, ISSUER_AUTHORITY_SEED,
    POLICY_SEED,
};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct IssueAttestationParams {
    /// Hash of the transaction message the user approved (SHA-256 of compiled tx).
    pub tx_hash: [u8; 32],
    /// Risk score from the on-device drainer detector (0-100).
    pub risk_score: u8,
    /// Optional: a Seeker Genesis Token pubkey if device-bind is being enforced.
    /// Pass Pubkey::default() if not.
    pub seeker_genesis_token: Pubkey,
}

#[derive(Accounts)]
#[instruction(params: IssueAttestationParams)]
pub struct IssueAttestation<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Attestation::INIT_SPACE,
        seeds = [ATTESTATION_SEED, user.key().as_ref(), params.tx_hash.as_ref()],
        bump,
    )]
    pub attestation: Account<'info, Attestation>,

    #[account(
        seeds = [POLICY_SEED, policy.policy_hash.as_ref()],
        bump = policy.bump,
    )]
    pub policy: Account<'info, PolicyRegistry>,

    #[account(
        seeds = [ISSUER_AUTHORITY_SEED],
        bump = issuer_authority.bump,
    )]
    pub issuer_authority: Account<'info, IssuerAuthority>,

    /// The user the attestation is bound to. Doesn't sign — issuance is
    /// gated by the issuer authority signature, which only the Halo SDK
    /// running on a Seeker can produce.
    /// CHECK: Read-only address; no account data dereferenced.
    pub user: AccountInfo<'info>,

    /// The Halo issuer authority — must match the registered authority.
    #[account(
        constraint = issuer.key() == issuer_authority.authority @ HaloError::IssuerAuthorityMismatch
    )]
    pub issuer: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<IssueAttestation>, params: IssueAttestationParams) -> Result<()> {
    let policy = &ctx.accounts.policy;
    require!(!policy.revoked, HaloError::PolicyRevoked);
    require!(
        params.risk_score <= policy.max_risk_score,
        HaloError::RiskScoreTooHigh
    );

    let attestation = &mut ctx.accounts.attestation;
    attestation.user = ctx.accounts.user.key();
    attestation.tx_hash = params.tx_hash;
    attestation.policy_hash = policy.policy_hash;
    attestation.policy = policy.key();
    attestation.risk_score = params.risk_score;
    attestation.issuer = ctx.accounts.issuer.key();
    attestation.seeker_genesis_token = params.seeker_genesis_token;
    attestation.issued_at = Clock::get()?.unix_timestamp;
    attestation.bump = ctx.bumps.attestation;

    msg!(
        "Halo attestation issued: user={}, risk={}, policy_hash={:?}",
        attestation.user,
        attestation.risk_score,
        attestation.policy_hash
    );

    Ok(())
}
