use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint, MintTo};

declare_id!("AWALi11111111111111111111111111111111111111");

#[program]
pub mod awali {
    use super::*;

    // ═══════════════════════════════════════════
    // LIQUIDITY POOL
    // ═══════════════════════════════════════════

    pub fn initialize_pool(ctx: Context<InitializePool>, pool_name: String) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.token_mint = ctx.accounts.token_mint.key();
        pool.vault = ctx.accounts.vault.key();
        pool.pool_name = pool_name;
        pool.total_deposited = 0;
        pool.bump = ctx.bumps.pool;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64, deposit_ref: [u8; 32]) -> Result<()> {
        require!(amount > 0, AwaliError::ZeroAmount);

        // Transfer tokens from provider to pool vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.provider_token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.provider.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        let pool = &mut ctx.accounts.pool;
        pool.total_deposited = pool.total_deposited.checked_add(amount).unwrap();

        emit!(LiquidityAdded {
            provider: ctx.accounts.provider.key(),
            amount,
            deposit_ref,
            pool: pool.key(),
        });
        Ok(())
    }

    pub fn withdraw_to(
        ctx: Context<WithdrawTo>,
        amount: u64,
        withdraw_ref: [u8; 32],
    ) -> Result<()> {
        require!(amount > 0, AwaliError::ZeroAmount);

        let pool = &mut ctx.accounts.pool;
        let seeds = &[
            b"pool".as_ref(),
            pool.token_mint.as_ref(),
            &[pool.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Transfer from vault to destination
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: pool.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::transfer(cpi_ctx, amount)?;

        pool.total_deposited = pool.total_deposited.checked_sub(amount).unwrap();

        emit!(LiquidityRemoved {
            provider: ctx.accounts.destination.to_account_info().key(),
            amount,
            withdraw_ref,
            pool: pool.key(),
        });
        Ok(())
    }

    // ═══════════════════════════════════════════
    // SWAP RECEIVER
    // ═══════════════════════════════════════════

    pub fn initialize_swap_receiver(ctx: Context<InitializeSwapReceiver>) -> Result<()> {
        let receiver = &mut ctx.accounts.swap_receiver;
        receiver.authority = ctx.accounts.authority.key();
        receiver.bump = ctx.bumps.swap_receiver;
        Ok(())
    }

    pub fn deposit_for_swap(
        ctx: Context<DepositForSwap>,
        swap_uid: [u8; 32],
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, AwaliError::ZeroAmount);

        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.swap_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        emit!(SwapDeposit {
            swap_uid,
            user: ctx.accounts.user.key(),
            token_mint: ctx.accounts.token_mint.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    // ═══════════════════════════════════════════
    // USDC FAUCET (Testnet only)
    // ═══════════════════════════════════════════

    pub fn initialize_faucet(ctx: Context<InitializeFaucet>) -> Result<()> {
        let faucet = &mut ctx.accounts.faucet;
        faucet.authority = ctx.accounts.authority.key();
        faucet.mint = ctx.accounts.mint.key();
        faucet.bump = ctx.bumps.faucet;
        Ok(())
    }

    pub fn mint_faucet(ctx: Context<MintFaucet>, amount: u64) -> Result<()> {
        let faucet = &ctx.accounts.faucet;
        let seeds = &[
            b"faucet".as_ref(),
            faucet.mint.as_ref(),
            &[faucet.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: faucet.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::mint_to(cpi_ctx, amount)?;

        emit!(FaucetMint {
            recipient: ctx.accounts.recipient.key(),
            amount,
            mint: ctx.accounts.mint.key(),
        });
        Ok(())
    }
}

// ═══════════════════════════════════════════
// ACCOUNTS
// ═══════════════════════════════════════════

#[derive(Accounts)]
#[instruction(pool_name: String)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + LiquidityPool::INIT_SPACE,
        seeds = [b"pool", token_mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, LiquidityPool>,
    pub token_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = authority,
        token::mint = token_mint,
        token::authority = pool,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut, seeds = [b"pool", pool.token_mint.as_ref()], bump = pool.bump)]
    pub pool: Account<'info, LiquidityPool>,
    #[account(mut, constraint = vault.key() == pool.vault)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub provider_token_account: Account<'info, TokenAccount>,
    pub provider: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawTo<'info> {
    #[account(mut, seeds = [b"pool", pool.token_mint.as_ref()], bump = pool.bump, has_one = authority)]
    pub pool: Account<'info, LiquidityPool>,
    #[account(mut, constraint = vault.key() == pool.vault)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct InitializeSwapReceiver<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + SwapReceiverState::INIT_SPACE,
        seeds = [b"swap_receiver"],
        bump
    )]
    pub swap_receiver: Account<'info, SwapReceiverState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositForSwap<'info> {
    #[account(seeds = [b"swap_receiver"], bump = swap_receiver.bump)]
    pub swap_receiver: Account<'info, SwapReceiverState>,
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub swap_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct InitializeFaucet<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + FaucetState::INIT_SPACE,
        seeds = [b"faucet", mint.key().as_ref()],
        bump
    )]
    pub faucet: Account<'info, FaucetState>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintFaucet<'info> {
    #[account(seeds = [b"faucet", faucet.mint.as_ref()], bump = faucet.bump, has_one = authority)]
    pub faucet: Account<'info, FaucetState>,
    #[account(mut, constraint = mint.key() == faucet.mint)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,
    /// CHECK: recipient wallet for event logging
    pub recipient: UncheckedAccount<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════

#[account]
#[derive(InitSpace)]
pub struct LiquidityPool {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub vault: Pubkey,
    #[max_len(64)]
    pub pool_name: String,
    pub total_deposited: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct SwapReceiverState {
    pub authority: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct FaucetState {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub bump: u8,
}

// ═══════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════

#[event]
pub struct LiquidityAdded {
    pub provider: Pubkey,
    pub amount: u64,
    pub deposit_ref: [u8; 32],
    pub pool: Pubkey,
}

#[event]
pub struct LiquidityRemoved {
    pub provider: Pubkey,
    pub amount: u64,
    pub withdraw_ref: [u8; 32],
    pub pool: Pubkey,
}

#[event]
pub struct SwapDeposit {
    pub swap_uid: [u8; 32],
    pub user: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct FaucetMint {
    pub recipient: Pubkey,
    pub amount: u64,
    pub mint: Pubkey,
}

// ═══════════════════════════════════════════
// ERRORS
// ═══════════════════════════════════════════

#[error_code]
pub enum AwaliError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Unauthorized")]
    Unauthorized,
}
