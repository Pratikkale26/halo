use anchor_lang::prelude::*;

use crate::error::HaloError;
use crate::state::{Attestation, IssuerAuthority, PolicyRegistry, ISSUER_AUTHORITY_SEED, POLICY_SEED};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VerifyAttestationParams {
    /// User the calling dApp expects to have approved.
    pub expected_user: Pubkey,
    /// Policy hash the calling dApp expects.
    pub expected_policy_hash: [u8; 32],
    /// Maximum acceptable age of the attestation, in seconds. Caller-controlled
    /// so the dApp can apply stricter freshness than the policy's default.
    pub max_age_secs: i64,
    /// Optional: if non-zero, also verify the attestation references this
    /// transaction hash. Use when the calling dApp has the canonical message.
    pub expected_tx_hash: Option<[u8; 32]>,
}

#[derive(Accounts)]
pub struct VerifyAttestation<'info> {
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
}

pub fn handler(ctx: Context<VerifyAttestation>, params: VerifyAttestationParams) -> Result<()> {
    let att = &ctx.accounts.attestation;
    let policy = &ctx.accounts.policy;
    let issuer = &ctx.accounts.issuer_authority;

    require!(!policy.revoked, HaloError::PolicyRevoked);
    require!(
        att.policy_hash == params.expected_policy_hash,
        HaloError::PolicyMismatch
    );
    require!(
        att.policy_hash == policy.policy_hash,
        HaloError::PolicyMismatch
    );
    require!(att.user == params.expected_user, HaloError::UserMismatch);
    require!(att.issuer == issuer.authority, HaloError::IssuerMismatch);
    require!(
        att.risk_score <= policy.max_risk_score,
        HaloError::RiskScoreTooHigh
    );

    let now = Clock::get()?.unix_timestamp;
    let effective_max_age = params.max_age_secs.min(policy.max_age_secs);
    require!(
        !att.is_expired(now, effective_max_age),
        HaloError::AttestationExpired
    );

    if let Some(expected_tx_hash) = params.expected_tx_hash {
        require!(
            att.tx_hash == expected_tx_hash,
            HaloError::TransactionHashMismatch
        );
    }

    msg!(
        "Halo attestation verified: user={}, policy_hash={:?}, age={}s",
        att.user,
        att.policy_hash,
        now.saturating_sub(att.issued_at)
    );

    Ok(())
}
