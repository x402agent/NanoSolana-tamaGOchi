/**
 * Nano Solana — Solana Wallet Manager
 *
 * Creates an Ed25519 keypair at "agent birth" — the wallet is the
 * agent's on-chain identity, tied to its heartbeat.
 *
 * Wallet is generated deterministically from agent name + timestamp
 * or restored from an encrypted vault.
 */

import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import { randomBytes, createHash } from "node:crypto";
import { EventEmitter } from "eventemitter3";
import { loadConfig, saveSecrets, loadSecrets, ensureNanoHome } from "../config/vault.js";
import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// ── Types ────────────────────────────────────────────────────

export interface WalletInfo {
  publicKey: string;
  balance: number;
  birthTimestamp: number;
  agentName: string;
}

export interface WalletEvents {
  birth: (info: WalletInfo) => void;
  heartbeat: (info: WalletInfo) => void;
  balanceChange: (info: { publicKey: string; oldBalance: number; newBalance: number }) => void;
  error: (err: Error) => void;
}

// ── Wallet Manager ────────────────────────────────────────────

export class NanoWallet extends EventEmitter<WalletEvents> {
  private keypair: Keypair | null = null;
  private connection: Connection | null = null;
  private balance = 0;
  private birthTimestamp = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private balanceWatchTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private agentName: string) {
    super();
  }

  /**
   * Birth the wallet — generates a new keypair or restores from vault.
   * This is the agent's genesis moment.
   */
  async birth(): Promise<WalletInfo> {
    const config = loadConfig();

    // Try to restore from config/vault
    if (config.wallet.privateKey) {
      try {
        const secretKey = bs58.decode(config.wallet.privateKey);
        this.keypair = Keypair.fromSecretKey(secretKey);
      } catch (err) {
        console.error("⚠️  Invalid wallet key in config, generating new one");
        this.keypair = null;
      }
    }

    // Generate new keypair if none exists
    if (!this.keypair) {
      this.keypair = Keypair.generate();
      // Persist to vault immediately
      const secrets = loadSecrets();
      secrets.NANO_WALLET_PRIVATE_KEY = bs58.encode(this.keypair.secretKey);
      secrets.NANO_WALLET_PUBLIC_KEY = this.keypair.publicKey.toBase58();
      saveSecrets(secrets);

      // Also save public key as plaintext identity file
      const nanoHome = ensureNanoHome();
      writeFileSync(
        join(nanoHome, "wallet.pub"),
        this.keypair.publicKey.toBase58(),
        { mode: 0o644 }
      );
    }

    this.birthTimestamp = Date.now();

    // Connect to Helius RPC
    if (config.helius.rpcUrl) {
      this.connection = new Connection(config.helius.rpcUrl, {
        commitment: "confirmed",
        wsEndpoint: config.helius.wssUrl || undefined,
      });

      // Fetch initial balance
      try {
        const lamports = await this.connection.getBalance(this.keypair.publicKey);
        this.balance = lamports / LAMPORTS_PER_SOL;
      } catch {
        this.balance = 0;
      }
    }

    const info = this.getInfo();
    this.emit("birth", info);
    return info;
  }

  /**
   * Start the heartbeat — periodic proof-of-life signal.
   */
  startHeartbeat(intervalMs = 5000): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(async () => {
      if (!this.keypair) return;
      const info = await this.refreshBalance();
      this.emit("heartbeat", info);
    }, intervalMs);

    // Also start balance watching (less frequent)
    if (this.balanceWatchTimer) clearInterval(this.balanceWatchTimer);
    this.balanceWatchTimer = setInterval(() => {
      this.refreshBalance().catch((err) => this.emit("error", err as Error));
    }, 15000);
  }

  /**
   * Stop the heartbeat.
   */
  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.balanceWatchTimer) {
      clearInterval(this.balanceWatchTimer);
      this.balanceWatchTimer = null;
    }
  }

  /**
   * Refresh balance from chain.
   */
  async refreshBalance(): Promise<WalletInfo> {
    if (!this.keypair || !this.connection) return this.getInfo();

    try {
      const lamports = await this.connection.getBalance(this.keypair.publicKey);
      const newBalance = lamports / LAMPORTS_PER_SOL;

      if (newBalance !== this.balance) {
        this.emit("balanceChange", {
          publicKey: this.keypair.publicKey.toBase58(),
          oldBalance: this.balance,
          newBalance,
        });
        this.balance = newBalance;
      }
    } catch (err) {
      this.emit("error", err as Error);
    }

    return this.getInfo();
  }

  /**
   * Sign a message with the agent's keypair (for identity verification).
   */
  sign(message: Uint8Array): Uint8Array {
    if (!this.keypair) throw new Error("Wallet not birthed yet");
    // Use tweetnacl signing via the keypair's secretKey
    const { sign } = require("tweetnacl") as typeof import("tweetnacl");
    return sign.detached(message, this.keypair.secretKey);
  }

  /**
   * Get the wallet's public key.
   */
  getPublicKey(): string {
    if (!this.keypair) throw new Error("Wallet not birthed yet");
    return this.keypair.publicKey.toBase58();
  }

  /**
   * Get the Solana Connection instance.
   */
  getConnection(): Connection | null {
    return this.connection;
  }

  /**
   * Get the raw Keypair (use carefully — contains private key).
   */
  getKeypair(): Keypair {
    if (!this.keypair) throw new Error("Wallet not birthed yet");
    return this.keypair;
  }

  /**
   * Get wallet info snapshot.
   */
  getInfo(): WalletInfo {
    return {
      publicKey: this.keypair?.publicKey.toBase58() ?? "",
      balance: this.balance,
      birthTimestamp: this.birthTimestamp,
      agentName: this.agentName,
    };
  }

  /**
   * Generate a unique agent ID based on wallet + timestamp.
   */
  getAgentId(): string {
    if (!this.keypair) throw new Error("Wallet not birthed yet");
    const raw = `${this.keypair.publicKey.toBase58()}:${this.birthTimestamp}`;
    return createHash("sha256").update(raw).digest("hex").slice(0, 16);
  }
}
