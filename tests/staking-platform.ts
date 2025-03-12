import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakingPlatform } from "../target/types/staking_platform";
import { Keypair } from "@solana/web3.js";

describe("staking-platform", () => {
  // Configure o cliente para usar o cluster (devnet neste caso)
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.StakingPlatform as Program<StakingPlatform>;

  it("Is initialized!", async () => {
    // Gere um novo Keypair para a conta pool
    const pool = Keypair.generate();

    // Execute a transação de inicialização
    const tx = await program.methods
      .initialize()
      .accounts({
        pool: pool.publicKey,
        owner: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([pool]) // Inclua o Keypair como signer
      .rpc();

    console.log("Your transaction signature", tx);
    console.log("Pool initialized at:", pool.publicKey.toString());
  });
});