import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DefiLearning } from "../target/types/defi_learning";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { Account, getAccount, getMint, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { assert } from "chai";

const createAtaForAccount = async (
  mint: anchor.web3.PublicKey,
  account: anchor.web3.PublicKey,
  provider: anchor.AnchorProvider
) => {
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    provider.wallet.payer,
    mint,
    account
  );

  console.log("Token account found", tokenAccount.address.toBase58());

  return tokenAccount;
};

describe("defi-learning", () => {
  const provider = anchor.AnchorProvider.env();
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  const program = anchor.workspace.defiLearning as Program<DefiLearning>;
  const tokenMintKeypair = anchor.web3.Keypair.generate();
  const tokenMintPublicKey = tokenMintKeypair.publicKey;

  before(async () => {
    const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")], // Must match the seeds in your Rust program
      program.programId // Your program's ID
    );

    const configAccount = await program.account.config.fetchNullable(configPda);
    if (!configAccount) {
      const txSignature = await program.methods
        .initializeConfig()
        .accounts({
          payer: provider.wallet.publicKey,
          admin: provider.wallet.publicKey,
        })
        .signers([]) // Both the new mint account's keypair and the mint authority keypair must sign
        .rpc();

      console.log("Configuration Init Transaction:", txSignature);
      console.log("Administrator Key:", provider.wallet.publicKey.toBase58());
    } else {
      console.log("Configuration Account already created");
    }
  });

  it("Can initialize mint account", async () => {
    const tokenMintKeypair = anchor.web3.Keypair.generate();
    const tokenMintPublicKey = tokenMintKeypair.publicKey;

    const mintAuthorityKeypair = anchor.web3.Keypair.generate();
    const mintAuthorityPublicKey = mintAuthorityKeypair.publicKey;

    // await provider.connection.requestAirdrop(
    //   provider.wallet.publicKey,
    //   10 * anchor.web3.LAMPORTS_PER_SOL
    // );
    await provider.connection.requestAirdrop(
      mintAuthorityPublicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    ); // If mint authority also needs SOL for signing

    const desiredDecimals = 6;

    const txSignature = await program.methods
      .initializeTokenMint()
      .accounts({
        tokenMint: tokenMintPublicKey,
        payer: provider.wallet.publicKey,
        mintAuthority: mintAuthorityPublicKey,
      })
      .signers([tokenMintKeypair, mintAuthorityKeypair]) // Both the new mint account's keypair and the mint authority keypair must sign
      .rpc();

    console.log(
      "Transaction signature for initialize_token_mint:",
      txSignature
    );

    const fetchedMintAccount = await getMint(
      provider.connection,
      tokenMintPublicKey
    );

    assert.isNotNull(fetchedMintAccount, "Mint account should exist on-chain");
    assert.equal(
      fetchedMintAccount.decimals,
      desiredDecimals,
      "Mint decimals should match desired value"
    );
    assert.equal(
      fetchedMintAccount.mintAuthority?.toBase58(),
      mintAuthorityPublicKey.toBase58(),
      "Mint authority should be set correctly"
    );
    assert.isTrue(
      fetchedMintAccount.isInitialized,
      "Mint account should be initialized"
    );
    assert.equal(
      fetchedMintAccount.supply.toString(),
      "0",
      "Initial supply should be 0"
    ); // A new mint has 0 supply
  });

  it("Can initialize program controlled mint account", async () => {
    const [mintAuthorityPda, _mintAuthorityBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("program_mint_authority")], // Must match the seeds in your Rust program
        program.programId // Your program's ID
      );

    // await provider.connection.requestAirdrop(
    //   provider.wallet.publicKey,
    //   10 * anchor.web3.LAMPORTS_PER_SOL
    // );

    const desiredDecimals = 6;

    const txSignature = await program.methods
      .initializeProgramControlledTokenMint()
      .accounts({
        tokenMint: tokenMintPublicKey,
        payer: provider.wallet.publicKey,

        //mintAuthorityPda: mintAuthorityPda
      })
      .signers([tokenMintKeypair]) // Both the new mint account's keypair and the mint authority keypair must sign
      .rpc();

    console.log(
      "Program-controlled token mint created! Transaction:",
      txSignature
    );
    console.log("New Token Mint Address:", tokenMintPublicKey.toBase58());
    console.log("Program's Mint Authority PDA:", mintAuthorityPda.toBase58());

    const fetchedMintAccount = await getMint(
      provider.connection,
      tokenMintPublicKey
    );

    assert.isNotNull(fetchedMintAccount, "Mint account should exist on-chain");
    assert.equal(
      fetchedMintAccount.decimals,
      desiredDecimals,
      "Mint decimals should match desired value"
    );
    assert.isTrue(
      fetchedMintAccount.isInitialized,
      "Mint account should be initialized"
    );
    assert.equal(
      fetchedMintAccount.supply.toString(),
      "0",
      "Initial supply should be 0"
    ); // A new mint has 0 supply
  });

  it("must find initialized config", async () => {
    const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")], // Must match the seeds in your Rust program
      program.programId // Your program's ID
    );

    const configAccount = await program.account.config.fetch(configPda);

    assert.isNotNull(configAccount, "Config account should exist");

    assert.equal(
      configAccount.admin.toBase58(), // The admin Pubkey stored in the Config account
      provider.wallet.publicKey.toBase58(), // The admin Pubkey we passed
      "Admin Public Key in Config does not match expected admin"
    );
  });

  it("Can mint tokens", async () => {
    const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")], // Must match the seeds in your Rust program
      program.programId // Your program's ID
    );

    const destination = await createAtaForAccount(
      tokenMintPublicKey,
      provider.wallet.publicKey,
      provider
    );

    const txSignature = await program.methods
      .adminMint(new anchor.BN(100_000_000_000))
      .accounts({
        tokenMint: tokenMintPublicKey,
        config: configPda,
        destinationTokenAccount: destination.address,
      })
      .signers([]) // Both the new mint account's keypair and the mint authority keypair must sign
      .rpc();

    console.log("Token mint transaction:", txSignature);
  });
});

describe("token management", () => {
  const provider = anchor.AnchorProvider.env();
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  const program = anchor.workspace.defiLearning as Program<DefiLearning>;
  const tokenMintKeypair = anchor.web3.Keypair.generate();
  const tokenMintPublicKey = tokenMintKeypair.publicKey;

  before(async () => {
    const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")], // Must match the seeds in your Rust program
      program.programId // Your program's ID
    );

    const configAccount = await program.account.config.fetchNullable(configPda);
    if (!configAccount) {
      const txSignature = await program.methods
        .initializeConfig()
        .accounts({
          payer: provider.wallet.publicKey,
          admin: provider.wallet.publicKey,
        })
        .signers([]) // Both the new mint account's keypair and the mint authority keypair must sign
        .rpc();

      console.log("Configuration Init Transaction:", txSignature);
      console.log("Administrator Key:", provider.wallet.publicKey.toBase58());
    } else {
      console.log("Configuration Account already created");
    }
  });

  it("must mint and transfer tokens", async () => {
    // --- get config
    const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")], // Must match the seeds in your Rust program
      program.programId // Your program's ID
    );

    // --- create new mint

    const mintTx = await program.methods
      .initializeProgramControlledTokenMint()
      .accounts({
        tokenMint: tokenMintPublicKey,
        payer: provider.wallet.publicKey,
      })
      .signers([tokenMintKeypair]) // Both the new mint account's keypair and the mint authority keypair must sign
      .rpc();

    console.log("Mint create.", mintTx);

    // --- create users and token accounts
    const secont_user_keypair = anchor.web3.Keypair.generate();

    console.log("Secont user", secont_user_keypair.publicKey.toBase58());

    const ownerAta = await createAtaForAccount(
      tokenMintPublicKey,
      provider.wallet.publicKey,
      provider
    );
    const userAta = await createAtaForAccount(
      tokenMintPublicKey,
      secont_user_keypair.publicKey,
      provider
    );

    // --- mint new tokent
    const mintTokensTx = await program.methods
      .adminMint(new anchor.BN(100_000_000_000))
      .accounts({
        tokenMint: tokenMintPublicKey,
        config: configPda,
        destinationTokenAccount: ownerAta.address,
      })
      .signers([]) // Both the new mint account's keypair and the mint authority keypair must sign
      .rpc();

    console.log("Token minted to owner", mintTokensTx);

    // --- transfer tokens to user
    const transferTx = await program.methods
      .transferToken(new anchor.BN(20_000_000_000))
      .accounts({
        sourceTokenAccount: ownerAta.address,
        destinationTokenAccount: userAta.address,
        mint: tokenMintPublicKey,
        owner: provider.wallet.publicKey,
      })
      .signers([provider.wallet.payer])
      .rpc();

    console.log("Token transfered", transferTx);

    const backTransferTx = await program.methods
      .transferToken(new anchor.BN(5_000_000_000))
      .accounts({
        sourceTokenAccount: userAta.address,
        destinationTokenAccount: ownerAta.address,
        mint: tokenMintPublicKey,
        owner: secont_user_keypair.publicKey,
      })
      .signers([secont_user_keypair])
      .rpc();

    console.log("Token transfered back", backTransferTx);

    const tokenAccountInfo: Account = await getAccount(
      provider.connection,
      userAta.address
    );

    console.log("User balance", tokenAccountInfo.amount);
    assert.equal(
      tokenAccountInfo.amount,
      BigInt(15_000_000_000),
      "Mint decimals should match desired value"
    );
  });
});
