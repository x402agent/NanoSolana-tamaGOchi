/**
 * NanoSolana Agent Birth Certificate — Devnet Gasless NFT via Metaplex
 *
 * Every TamaGObot agent mints a Birth Certificate NFT at creation time.
 * - Uses Metaplex Token Metadata program on Solana devnet.
 * - Gasless: the program pays for the mint via devnet airdrop.
 * - On-chain proof that this agent exists with a specific wallet.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from "@solana/web3.js";
import {
  createCreateMetadataAccountV3Instruction,
  createCreateMasterEditionV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// ── Types ──────────────────────────────────────────────────────────────────

export interface BirthCertificateMetadata {
  agentId: string;
  walletPublicKey: string;
  bornAt: number;
  petName: string;
  petStage: string;
  parentWallet?: string;
}

export interface MintResult {
  mintAddress: string;
  metadataAddress: string;
  masterEditionAddress: string;
  txSignature: string;
  explorerUrl: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const DEVNET_RPC = "https://api.devnet.solana.com";
const NFT_SYMBOL = "NSBIRTH";
const NFT_COLLECTION_NAME = "NanoSolana TamaGObot Birth Certificates";

// ── PDA derivations ────────────────────────────────────────────────────────

function getMetadataPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID,
  );
  return pda;
}

function getMasterEditionPDA(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    TOKEN_METADATA_PROGRAM_ID,
  );
  return pda;
}

// ── Gasless airdrop helper ─────────────────────────────────────────────────

async function ensureDevnetBalance(
  connection: Connection,
  wallet: PublicKey,
  minLamports: number = 0.05 * LAMPORTS_PER_SOL,
): Promise<void> {
  const balance = await connection.getBalance(wallet);
  if (balance < minLamports) {
    const sig = await connection.requestAirdrop(wallet, LAMPORTS_PER_SOL);
    const latestHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature: sig,
      blockhash: latestHash.blockhash,
      lastValidBlockHeight: latestHash.lastValidBlockHeight,
    });
  }
}

// ── Build off-chain metadata JSON ──────────────────────────────────────────

function buildOffchainMetadata(meta: BirthCertificateMetadata): object {
  return {
    name: `TamaGObot #${meta.agentId.slice(0, 8)}`,
    symbol: NFT_SYMBOL,
    description: `Birth certificate for NanoSolana TamaGObot agent ${meta.agentId}. Born ${new Date(meta.bornAt).toISOString()}.`,
    image: "https://nanosolana.ai/birth-cert.png",
    external_url: "https://nanosolana.ai",
    attributes: [
      { trait_type: "Agent ID", value: meta.agentId },
      { trait_type: "Wallet", value: meta.walletPublicKey },
      { trait_type: "Born", value: new Date(meta.bornAt).toISOString() },
      { trait_type: "Pet Name", value: meta.petName },
      { trait_type: "Pet Stage", value: meta.petStage },
      { trait_type: "Network", value: "Solana Devnet" },
      ...(meta.parentWallet
        ? [{ trait_type: "Parent Wallet", value: meta.parentWallet }]
        : []),
    ],
    properties: {
      files: [],
      category: "identity",
      creators: [
        {
          address: meta.walletPublicKey,
          share: 100,
        },
      ],
    },
  };
}

// ── Mint birth certificate NFT ─────────────────────────────────────────────

export async function mintBirthCertificate(
  agentKeypair: Keypair,
  metadata: BirthCertificateMetadata,
  rpcUrl: string = DEVNET_RPC,
): Promise<MintResult> {
  const connection = new Connection(rpcUrl, "confirmed");

  // 1) Ensure devnet SOL for gas (gasless — we airdrop)
  await ensureDevnetBalance(connection, agentKeypair.publicKey);

  // 2) Create the mint (supply = 1, decimals = 0 → NFT)
  const mintKeypair = Keypair.generate();
  const mint = await createMint(
    connection,
    agentKeypair,          // payer
    agentKeypair.publicKey, // mint authority
    null,                   // freeze authority (none)
    0,                      // decimals (0 = NFT)
    mintKeypair,            // mint keypair
  );

  // 3) Create ATA and mint exactly 1 token
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    agentKeypair,
    mint,
    agentKeypair.publicKey,
  );
  await mintTo(
    connection,
    agentKeypair,
    mint,
    ata.address,
    agentKeypair.publicKey,
    1,
  );

  // 4) Create metadata account (on-chain)
  const metadataPDA = getMetadataPDA(mint);
  const offchainMeta = buildOffchainMetadata(metadata);

  // In production, upload offchainMeta to Arweave/IPFS and use that URI.
  // For devnet, we use a placeholder URI with the agent ID.
  const metadataUri = `https://nanosolana.ai/api/birth-cert/${metadata.agentId}`;

  const createMetadataIx = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPDA,
      mint,
      mintAuthority: agentKeypair.publicKey,
      payer: agentKeypair.publicKey,
      updateAuthority: agentKeypair.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: `TamaGObot #${metadata.agentId.slice(0, 8)}`,
          symbol: NFT_SYMBOL,
          uri: metadataUri,
          sellerFeeBasisPoints: 0,
          creators: [
            {
              address: agentKeypair.publicKey,
              verified: true,
              share: 100,
            },
          ],
          collection: null,
          uses: null,
        },
        isMutable: true,
        collectionDetails: null,
      },
    },
  );

  // 5) Create master edition (makes it a true NFT, supply = 0 after)
  const masterEditionPDA = getMasterEditionPDA(mint);
  const createMasterEditionIx = createCreateMasterEditionV3Instruction(
    {
      edition: masterEditionPDA,
      mint,
      updateAuthority: agentKeypair.publicKey,
      mintAuthority: agentKeypair.publicKey,
      payer: agentKeypair.publicKey,
      metadata: metadataPDA,
    },
    {
      createMasterEditionArgs: {
        maxSupply: 0, // non-fungible, no prints
      },
    },
  );

  // 6) Build + send transaction
  const tx = new Transaction().add(createMetadataIx, createMasterEditionIx);
  const txSig = await sendAndConfirmTransaction(connection, tx, [agentKeypair]);

  return {
    mintAddress: mint.toBase58(),
    metadataAddress: metadataPDA.toBase58(),
    masterEditionAddress: masterEditionPDA.toBase58(),
    txSignature: txSig,
    explorerUrl: `https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
  };
}

// ── One-shot birth (wallet generation + NFT mint) ──────────────────────────

export async function agentBirth(
  petName: string = "NanoLobster",
  rpcUrl: string = DEVNET_RPC,
): Promise<{
  keypair: Keypair;
  publicKey: string;
  nft: MintResult;
}> {
  // Generate fresh wallet
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toBase58();
  const bornAt = Date.now();

  // Mint birth certificate NFT
  const nft = await mintBirthCertificate(keypair, {
    agentId: publicKey.slice(0, 16),
    walletPublicKey: publicKey,
    bornAt,
    petName,
    petStage: "egg",
  }, rpcUrl);

  return { keypair, publicKey, nft };
}
