use anchor_lang::prelude::*;

use crate::error::HaloError;
use crate::state::{PolicyRegistry, POLICY_SEED};

#[derive(Accounts)]
pub struct RevokePolicy<'info> {
    #[account(
        mut,
        seeds = [POLICY_SEED, policy.policy_hash.as_ref()],
        bump = policy.bump,
        has_one = authority @ HaloError::Unauthorized,
    )]
    pub policy: Account<'info, PolicyRegistry>,

    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<RevokePolicy>) -> Result<()> {
    let policy = &mut ctx.accounts.policy;
    require!(!policy.revoked, HaloError::PolicyRevoked);

    policy.revoked = true;
    policy.revoked_at = Clock::get()?.unix_timestamp;

    msg!("Halo policy revoked: hash={:?}", policy.policy_hash);

    Ok(())
}
