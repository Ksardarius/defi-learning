use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token};

use crate::constants;

pub struct MintToken<'info> {
    pub mint: AccountInfo<'info>,
    pub destination: AccountInfo<'info>,
    pub authority: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
    pub bump: u8,
    pub amount: u64
}

pub fn mint_token(data: MintToken) -> Result<()> {
    let MintToken {
        mint,
        authority,
        destination,
        token_program,
        bump,
        amount
    } = data;

    let cpi_accounts = token::MintTo {
        mint,
        to: destination,
        authority
    };

    let seeds = &[
        constants::MINT_AUTHORITY_SEED,
        &[bump]
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_context = CpiContext::new_with_signer(token_program, cpi_accounts, signer_seeds);

    token::mint_to(cpi_context, amount)?;

    Ok(())
}