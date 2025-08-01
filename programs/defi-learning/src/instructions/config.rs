use anchor_lang::prelude::*;

use crate::{constants, state::Config};

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = payer,
        space = Config::LEN,
        seeds = [constants::CONFIG_SEED],
        bump,
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>
}

pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
    ctx.accounts.config.admin = ctx.accounts.admin.key();
    msg!("Config initialized with admin: {}", ctx.accounts.admin.key());
    Ok(())
}