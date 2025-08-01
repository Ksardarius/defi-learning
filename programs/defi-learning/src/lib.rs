use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod services;
pub mod errors;
pub mod constants;

use instructions::*;


declare_id!("8sVddzXhjuYCt9Jhw13Xpe2yp6xjtCTsS2o4J8fAynor");

#[program]
pub mod defi_learning {
    use super::*;

    pub fn initialize_token_mint(ctx: Context<InitializeTokenMint>) -> Result<()> {
        instructions::initialize_token_mint(ctx)
    }

    pub fn initialize_program_controlled_token_mint(ctx: Context<InitializeProgramControlledTokenMint>) -> Result<()> {
        instructions::initialize_program_controlled_token_mint(ctx)
    }

    pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
        instructions::initialize_config(ctx)
    }

    pub fn admin_mint(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        instructions::admin_mint(ctx, amount)
    }

    pub fn transfer_token(ctx: Context<TransferToken>, amount: u64) -> Result<()> {
        instructions::transfer_token(ctx, amount)
    }
}
