use anchor_lang::prelude::*;

use crate::error::HaloError;
use crate::state::{PolicyRegistry, MAX_SCHEMA_URI_LEN, POLICY_SEED};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RegisterPolicyParams {
    /// SHA-256 of the canonical off-chain policy JSON.
    pub policy_hash: [u8; 32],
    /// Off-chain URI where the schema is hosted. <= 256 bytes.
    pub schema_uri: String,
    /// Maximum acceptable risk score (0-100).
    pub max_risk_score: u8,
    /// Maximum age of an attestation, in seconds.
    pub max_age_secs: i64,
}

#[derive(Accounts)]
#[instruction(params: RegisterPolicyParams)]
pub struct RegisterPolicy<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PolicyRegistry::INIT_SPACE,
        seeds = [POLICY_SEED, params.policy_hash.as_ref()],
        bump,
    )]
    pub policy: Account<'info, PolicyRegistry>,

    /// Authority that registers the policy (and can revoke it).
    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RegisterPolicy>, params: RegisterPolicyParams) -> Result<()> {
    require!(
        params.schema_uri.len() <= MAX_SCHEMA_URI_LEN,
        HaloError::InvalidPolicyParams
    );
    require!(params.max_risk_score <= 100, HaloError::InvalidPolicyParams);
    require!(params.max_age_secs > 0, HaloError::InvalidPolicyParams);

    let policy = &mut ctx.accounts.policy;
    policy.authority = ctx.accounts.authority.key();
    policy.policy_hash = params.policy_hash;
    policy.schema_uri = params.schema_uri;
    policy.max_risk_score = params.max_risk_score;
    policy.max_age_secs = params.max_age_secs;
    policy.revoked = false;
    policy.created_at = Clock::get()?.unix_timestamp;
    policy.revoked_at = 0;
    policy.bump = ctx.bumps.policy;

    msg!(
        "Halo policy registered: hash={:?}, max_risk={}, max_age={}s",
        policy.policy_hash,
        policy.max_risk_score,
        policy.max_age_secs
    );

    Ok(())
}
