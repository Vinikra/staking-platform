import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakingPlatform } from "../target/types/staking_platform";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";

describe("staking-platform", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.StakingPlatform as Program<StakingPlatform>;
  const wallet = provider.wallet;

  let pool: Keypair;
  let mint: PublicKey;
  let userTokenAccount: Keypair;
  let poolTokenAccount: Keypair;

  before(async () => {
    pool = Keypair.generate();
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
        pool: pool.publicKey,
        owner: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([pool])
      .rpc();
  });

  it("Is initialized!", async () => {
    console.log("Pool already initialized at:", pool.publicKey.toString());
  });

  it("Stakes tokens", async () => {
    const [userStake, bump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("user-stake"), wallet.publicKey.toBuffer()],
      program.programId
    );

    const amount = new anchor.BN(100 * LAMPORTS_PER_SOL);
    const tx = await program.methods
      .stake(amount)
      .accounts({
        pool: pool.publicKey,
        userStake: userStake,
        userTokenAccount: userTokenAccount.publicKey,
        poolTokenAccount: poolTokenAccount.publicKey,
        user: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([]) // Não precisa de signers adicionais, pois o PDA é gerenciado pelo programa
      .rpc();
    console.log("Stake transaction signature", tx);
  });
});