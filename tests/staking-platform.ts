import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakingPlatform } from "../target/types/staking_platform";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAccount } from "@solana/spl-token";

describe("staking-platform", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.StakingPlatform as Program<StakingPlatform>;
  const wallet = provider.wallet;

  let pool: PublicKey;
  let mint: PublicKey;
  let userTokenAccount: Keypair;
  let poolTokenAccount: Keypair;

  beforeEach(async () => {
    [pool] = await PublicKey.findProgramAddressSync(
      [Buffer.from("pool")],
      program.programId
    );

    userTokenAccount = Keypair.generate();
    poolTokenAccount = Keypair.generate();

    mint = await createMint(
      provider.connection,
      wallet.payer,
      wallet.publicKey,
      null,
      6
    );

    await createAccount(
      provider.connection,
      wallet.payer,
      mint,
      wallet.publicKey,
      userTokenAccount
    );
    await createAccount(
      provider.connection,
      wallet.payer,
      mint,
      wallet.publicKey,
      poolTokenAccount
    );

    await mintTo(
      provider.connection,
      wallet.payer,
      mint,
      userTokenAccount.publicKey,
      wallet.payer,
      1000 * LAMPORTS_PER_SOL
    );

    await program.methods
      .initialize()
      .accounts({
        pool: pool,
        owner: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
  });

  it("Is initialized!", async () => {
    console.log("Pool already initialized at:", pool.toString());
  });

  it("Stakes tokens", async () => {
    const [userStake] = await PublicKey.findProgramAddressSync(
      [Buffer.from("user-stake"), wallet.publicKey.toBuffer()],
      program.programId
    );

    const userTokenBalanceBefore = await getAccount(provider.connection, userTokenAccount.publicKey);
    console.log("User token account balance before stake:", userTokenBalanceBefore.amount.toString());
    const poolTokenBalanceBefore = await getAccount(provider.connection, poolTokenAccount.publicKey);
    console.log("Pool token account balance before stake:", poolTokenBalanceBefore.amount.toString());

    const amount = new anchor.BN(100 * LAMPORTS_PER_SOL);
    const tx = await program.methods
      .stake(amount)
      .accounts({
        pool: pool,
        userStake: userStake,
        userTokenAccount: userTokenAccount.publicKey,
        poolTokenAccount: poolTokenAccount.publicKey,
        user: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const userTokenBalanceAfter = await getAccount(provider.connection, userTokenAccount.publicKey);
    console.log("User token account balance after stake:", userTokenBalanceAfter.amount.toString());
    const poolTokenBalanceAfter = await getAccount(provider.connection, poolTokenAccount.publicKey);
    console.log("Pool token account balance after stake:", poolTokenBalanceAfter.amount.toString());

    console.log("Stake transaction signature", tx);
  });

  it("Distributes rewards", async () => {
    const [userStake] = await PublicKey.findProgramAddressSync(
      [Buffer.from("user-stake"), wallet.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .stake(new anchor.BN(100 * LAMPORTS_PER_SOL))
      .accounts({
        pool: pool,
        userStake: userStake,
        userTokenAccount: userTokenAccount.publicKey,
        poolTokenAccount: poolTokenAccount.publicKey,
        user: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const userTokenBalanceBefore = await getAccount(provider.connection, userTokenAccount.publicKey);
    console.log("User token account balance before distribute:", userTokenBalanceBefore.amount.toString());
    const poolTokenBalanceBefore = await getAccount(provider.connection, poolTokenAccount.publicKey);
    console.log("Pool token account balance before distribute:", poolTokenBalanceBefore.amount.toString());

    const amount = new anchor.BN(50 * LAMPORTS_PER_SOL);
    const tx = await program.methods
      .distributeRewards(amount)
      .accounts({
        pool: pool,
        ownerTokenAccount: userTokenAccount.publicKey,
        poolTokenAccount: poolTokenAccount.publicKey,
        owner: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const userTokenBalanceAfter = await getAccount(provider.connection, userTokenAccount.publicKey);
    console.log("User token account balance after distribute:", userTokenBalanceAfter.amount.toString());
    const poolTokenBalanceAfter = await getAccount(provider.connection, poolTokenAccount.publicKey);
    console.log("Pool token account balance after distribute:", poolTokenBalanceAfter.amount.toString());

    console.log("Distribute rewards transaction signature", tx);
  });

  it("Withdraws tokens", async () => {
    const [userStake] = await PublicKey.findProgramAddressSync(
      [Buffer.from("user-stake"), wallet.publicKey.toBuffer()],
      program.programId
    );

    // Execute stake para garantir que user_stake tenha saldo
    await program.methods
      .stake(new anchor.BN(100 * LAMPORTS_PER_SOL))
      .accounts({
        pool: pool,
        userStake: userStake,
        userTokenAccount: userTokenAccount.publicKey,
        poolTokenAccount: poolTokenAccount.publicKey,
        user: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .distributeRewards(new anchor.BN(50 * LAMPORTS_PER_SOL))
      .accounts({
        pool: pool,
        ownerTokenAccount: userTokenAccount.publicKey,
        poolTokenAccount: poolTokenAccount.publicKey,
        owner: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const poolTokenBalanceBefore = await getAccount(provider.connection, poolTokenAccount.publicKey);
    console.log("Pool token account balance before withdraw:", poolTokenBalanceBefore.amount.toString());

    const amount = new anchor.BN(50 * LAMPORTS_PER_SOL);
    const tx = await program.methods
      .withdraw(amount)
      .accounts({
        pool: pool,
        userStake: userStake,
        userTokenAccount: userTokenAccount.publicKey,
        poolTokenAccount: poolTokenAccount.publicKey,
        user: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const poolTokenBalanceAfter = await getAccount(provider.connection, poolTokenAccount.publicKey);
    console.log("Pool token account balance after withdraw:", poolTokenBalanceAfter.amount.toString());
    console.log("Withdraw transaction signature", tx);
  });
});