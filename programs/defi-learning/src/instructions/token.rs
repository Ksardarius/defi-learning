use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

use crate::{constants, services::{self, mint_token, MintToken}, state};

#[derive(Accounts)]
pub struct InitializeTokenMint<'info> {
    #[account(
        init,
        payer = payer,
        mint::decimals = 6,
        mint::authority = mint_authority.key()
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub mint_authority: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>
}

#[derive(Accounts)]
pub struct InitializeProgramControlledTokenMint<'info> {
    #[account(
        init,
        payer = payer,
        mint::decimals = 6,
        mint::authority = mint_authority_pda.key()
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: This PDA is only used as a mint authority and its derivation is verified by `seeds` and `bump`.
    /// No further deserialization or direct data access is needed here.
    #[account(
        seeds = [constants::MINT_AUTHORITY_SEED],
        bump
    )]
    pub mint_authority_pda: AccountInfo<'info>,

    pub rent: Sysvar<'info, Rent>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(
        has_one = admin,
        mut
    )]
    pub config: Account<'info, state::Config>,

    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub destination_token_account: Account<'info, TokenAccount>, // The recipient's token account (must be mutable)

    /// CHECK: This PDA must be the mint authority for the `token_mint`
    #[account(
        seeds = [constants::MINT_AUTHORITY_SEED],
        bump,
    )]
    pub mint_authority_pda: AccountInfo<'info>,

    pub token_program: Program<'info, Token>, // The SPL Token Program ID
}

#[derive(Accounts)]
pub struct TransferToken<'info> {
    #[account(
        mut,
        has_one = mint
    )]
    pub source_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        has_one = mint
    )]
    pub destination_token_account: Account<'info, TokenAccount>,

    #[account(signer)]
    /// CHECK: This account is implicitly validated as the authority for the CPI by the SPL Token Program itself.
    pub owner: AccountInfo<'info>,

    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>, 
}

pub fn initialize_token_mint(ctx: Context<InitializeTokenMint>) -> Result<()> {
    Ok(())
}

pub fn initialize_program_controlled_token_mint(ctx: Context<InitializeProgramControlledTokenMint>) -> Result<()> {
    Ok(())
}
pub fn admin_mint(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
    mint_token(services::MintToken {
        mint: ctx.accounts.token_mint.to_account_info(),
        destination: ctx.accounts.destination_token_account.to_account_info(),
        authority: ctx.accounts.mint_authority_pda.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        bump: ctx.bumps.mint_authority_pda,
        amount
    })
}

pub fn transfer_token(ctx: Context<TransferToken>, amount: u64) -> Result<()> {
    let cpi_accounts = token::Transfer {
        from: ctx.accounts.source_token_account.to_account_info(),
        to: ctx.accounts.destination_token_account.to_account_info(),
        authority: ctx.accounts.owner.to_account_info()
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_context, amount)?;

    msg!("Transferred {} tokens from {} to {}", amount,
        ctx.accounts.source_token_account.key(),
        ctx.accounts.destination_token_account.key()
    );

    Ok(())
}