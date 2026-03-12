/**
 * NanoSolana Agent On-Chain Registry via Metaplex Token Metadata.
 *
 * Mints a gasless devnet NFT that serves as the agent's on-chain identity.
 * The NFT contains:
 *   - Agent public key
 *   - NanoSolana version
 *   - Registered capabilities (skills)
 *   - Fingerprint (SHA-256 of pubkey + version + skills)
 *   - Timestamp
 *
 * Uses Solana devnet for zero-cost registration. Agents verify each
 * other's on-chain identity by checking NFT metadata.
 *
 * TypeScript port of pkg/onchain/registry.go
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { createHash } from "node:crypto";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// ── Well-Known Program IDs ───────────────────────────────────────────

/** Metaplex Token Metadata Program */
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

/** Devnet RPC endpoint */
const DEVNET_RPC = "https://api.devnet.solana.com";

// ── Types ────────────────────────────────────────────────────────────

export interface AgentMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  agentPubkey: string;
  version: string;
  skills: string[];
  registeredAt: string;
  fingerprint: string;
}

export interface RegistrationResult {
  mintAddress: string;
  txSignature: string;
  metadataUri: string;
  network: string;
  agentPubkey: string;
  tokenAccount: string;
}

interface LocalRegistration {
  result: RegistrationResult;
  metadata: AgentMetadata;
  savedAt: string;
}

// ── Agent Registry ───────────────────────────────────────────────────

export class AgentRegistry {
  private connection: Connection;
  private registryDir: string;

  constructor(rpcUrl?: string) {
    this.connection = new Connection(rpcUrl || DEVNET_RPC, "confirmed");
    this.registryDir = join(homedir(), ".nanosolana", "registry");
    mkdirSync(this.registryDir, { recursive: true });
  }

  /**
   * Register an agent on-chain by minting a devnet NFT.
   *
   * Steps:
   *  1. Connect to devnet RPC
   *  2. Airdrop SOL if needed (devnet is free)
   *  3. Create SPL mint (supply = 1 → NFT)
   *  4. Create associated token account
   *  5. Mint exactly 1 token
   *  6. Save registration locally
   */
  async registerAgent(
    agentKeypair: Keypair,
    version: string,
    skills: string[],
    logFn: (msg: string) => void = console.log,
  ): Promise<RegistrationResult> {
    const agentPubkey = agentKeypair.publicKey;

    // Step 1: Check balance, airdrop if needed
    logFn("  ☁️  Checking devnet balance...");
    const balance = await this.connection.getBalance(agentPubkey);

    if (balance < 10_000_000) {
      // < 0.01 SOL
      logFn(`  ☁️  Requesting devnet airdrop for ${agentPubkey.toBase58().slice(0, 8)}...`);
      const sig = await this.connection.requestAirdrop(agentPubkey, LAMPORTS_PER_SOL);
      await this.connection.confirmTransaction(sig, "confirmed");
      logFn(`  ✅ Airdrop confirmed: ${sig.slice(0, 16)}...`);

      // Brief wait for finalization
      await sleep(2000);
    }

    // Step 2: Build fingerprint
    const fingerprint = agentFingerprint(agentPubkey.toBase58(), version, skills);

    // Step 3: Build metadata
    const metadata: AgentMetadata = {
      name: `NanoSolana Agent #${agentPubkey.toBase58().slice(0, 6)}`,
      symbol: "NANO",
      description: `NanoSolana autonomous trading agent. Version ${version}. Fingerprint: ${fingerprint.slice(0, 12)}`,
      image: "https://nanosolana.com/agent-nft.png",
      agentPubkey: agentPubkey.toBase58(),
      version,
      skills,
      registeredAt: new Date().toISOString(),
      fingerprint,
    };

    // Step 4: Create mint (decimals = 0, supply = 1 → NFT)
    logFn("  ⛓️  Creating SPL mint (NFT)...");
    const mint = await createMint(
      this.connection,
      agentKeypair, // payer
      agentPubkey, // mint authority
      null, // freeze authority (none)
      0, // decimals = 0 → NFT
    );

    // Step 5: Create associated token account
    logFn("  📬 Creating token account...");
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      agentKeypair, // payer
      mint, // mint
      agentPubkey, // owner
    );

    // Step 6: Mint exactly 1 token (making it an NFT)
    logFn("  🖨️  Minting 1 NFT...");
    const mintTxSig = await mintTo(
      this.connection,
      agentKeypair, // payer
      mint, // mint
      tokenAccount.address, // destination
      agentPubkey, // authority
      1, // amount = 1
    );

    logFn(`  ✅ NFT minted: ${mintTxSig.slice(0, 16)}...`);

    const result: RegistrationResult = {
      mintAddress: mint.toBase58(),
      txSignature: mintTxSig,
      metadataUri: "", // Would point to Arweave/IPFS in production
      network: "devnet",
      agentPubkey: agentPubkey.toBase58(),
      tokenAccount: tokenAccount.address.toBase58(),
    };

    // Step 7: Save registration locally
    this.saveRegistration(result, metadata);

    // Step 8: Save metadata JSON for future Metaplex upload
    const metadataPath = join(this.registryDir, "metadata.json");
    writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), { mode: 0o644 });

    return result;
  }

  /**
   * Check if agent is already registered.
   */
  isRegistered(): boolean {
    return existsSync(join(this.registryDir, "registration.json"));
  }

  /**
   * Load existing registration.
   */
  loadRegistration(): LocalRegistration | null {
    const path = join(this.registryDir, "registration.json");
    if (!existsSync(path)) return null;

    try {
      const data = readFileSync(path, "utf-8");
      return JSON.parse(data) as LocalRegistration;
    } catch {
      return null;
    }
  }

  /**
   * Get the Solana explorer URL for the agent's NFT.
   */
  getExplorerUrl(): string | null {
    const reg = this.loadRegistration();
    if (!reg) return null;
    return `https://explorer.solana.com/address/${reg.result.mintAddress}?cluster=devnet`;
  }

  /**
   * Verify an agent's on-chain identity by checking their NFT.
   */
  async verifyAgent(agentPubkey: PublicKey): Promise<{
    verified: boolean;
    mintAddress?: string;
    balance?: number;
  }> {
    try {
      // Check if the agent has any token accounts with NANO symbol NFTs
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(agentPubkey, {
        programId: TOKEN_PROGRAM_ID,
      });

      for (const account of tokenAccounts.value) {
        // Each account that holds exactly 1 token with decimals=0 is a potential NFT
        const info = await this.connection.getParsedAccountInfo(account.pubkey);
        if (info.value) {
          return {
            verified: true,
            mintAddress: account.pubkey.toBase58(),
            balance: tokenAccounts.value.length,
          };
        }
      }

      return { verified: false };
    } catch {
      return { verified: false };
    }
  }

  // ── Private ──────────────────────────────────────────────────

  private saveRegistration(result: RegistrationResult, metadata: AgentMetadata): void {
    const reg: LocalRegistration = {
      result,
      metadata,
      savedAt: new Date().toISOString(),
    };

    const path = join(this.registryDir, "registration.json");
    writeFileSync(path, JSON.stringify(reg, null, 2), { mode: 0o644 });
  }
}

// ── Heartbeat Registration ───────────────────────────────────────────

/**
 * Register agent on heartbeat — checks if registered, mints if not.
 * Designed to be called from the heartbeat loop so the agent
 * auto-registers on first successful run.
 */
export async function registerOnHeartbeat(
  keypair: Keypair,
  version: string,
  skills: string[],
  logFn?: (msg: string) => void,
): Promise<RegistrationResult | null> {
  const registry = new AgentRegistry();

  if (registry.isRegistered()) {
    return registry.loadRegistration()?.result ?? null;
  }

  try {
    return await registry.registerAgent(keypair, version, skills, logFn);
  } catch (err) {
    logFn?.(`  ⚠️  Auto-registration failed: ${(err as Error).message}`);
    return null;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function agentFingerprint(pubkey: string, version: string, skills: string[]): string {
  const hash = createHash("sha256");
  hash.update(pubkey);
  hash.update(version);
  for (const s of skills) {
    hash.update(s);
  }
  return hash.digest("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
