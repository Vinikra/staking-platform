use anchor_lang::prelude::*;

declare_id!("8J8E6yZpthcsUYRJAY1wj9fYJi6F4WFxu39HafQcjfwb");

#[program]
pub mod staking_platform {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
