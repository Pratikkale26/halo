use anchor_lang::prelude::*;

use crate::error::HaloError;
use crate::state::{IssuerAuthority, ISSUER_AUTHORITY_SEED};

#[derive(Accounts)]
pub struct RotateIssuer<'info> {
    #[account(
        mut,
        seeds = [ISSUER_AUTHORITY_SEED],
        bump = issuer_authority.bump,
        has_one = upgrade_authority @ HaloError::Unauthorized,
    )]
    pub issuer_authority: Account<'info, IssuerAuthority>,

    pub upgrade_authority: Signer<'info>,
}

pub fn handler(ctx: Context<RotateIssuer>, new_authority: Pubkey) -> Result<()> {
    let issuer = &mut ctx.accounts.issuer_authority;
    let old_authority = issuer.authority;
    issuer.authority = new_authority;
    issuer.last_rotated_at = Clock::get()?.unix_timestamp;

    msg!(
        "Halo issuer rotated: {} -> {}",
        old_authority,
        new_authority
    );

    Ok(())
}
