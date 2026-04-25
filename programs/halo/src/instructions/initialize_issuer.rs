use anchor_lang::prelude::*;

use crate::state::{IssuerAuthority, ISSUER_AUTHORITY_SEED};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializeIssuerParams {
    /// Pubkey that will sign attestations. Typically a dev keypair at MVP,
    /// migrating to a Squads multisig threshold key in production.
    pub authority: Pubkey,
}

#[derive(Accounts)]
pub struct InitializeIssuer<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + IssuerAuthority::INIT_SPACE,
        seeds = [ISSUER_AUTHORITY_SEED],
        bump,
    )]
    pub issuer_authority: Account<'info, IssuerAuthority>,

    /// Initial upgrade authority (can rotate the signing authority later).
    /// In production this is the Squads multisig.
    pub upgrade_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeIssuer>, params: InitializeIssuerParams) -> Result<()> {
    let issuer = &mut ctx.accounts.issuer_authority;
    issuer.authority = params.authority;
    issuer.upgrade_authority = ctx.accounts.upgrade_authority.key();
    issuer.last_rotated_at = Clock::get()?.unix_timestamp;
    issuer.bump = ctx.bumps.issuer_authority;

    msg!(
        "Halo issuer initialized: authority={}, upgrade_authority={}",
        issuer.authority,
        issuer.upgrade_authority
    );

    Ok(())
}
