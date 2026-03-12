/**
 * NanoSolana On-Chain Financial Engine
 *
 * Powered by @solana/web3.js + Helius RPC/WSS for real-time data.
 * This is the agent's direct connection to the Solana blockchain.
 *
 * Capabilities:
 *   - Real-time balance & token portfolio queries (Helius RPC)
 *   - Transaction history with enhanced parsing (Helius API)
 *   - WebSocket account monitoring for live position tracking
 *   - SOL transfer & SPL token transfer execution
 *   - Priority fee estimation
 *   - Token metadata resolution
 *
 * TypeScript port of pkg/onchain/engine.go
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// ── Config ───────────────────────────────────────────────────────────

export interface OnChainConfig {
  heliusRpcUrl: string;
  heliusApiKey: string;
  heliusWssUrl?: string;
  network: "mainnet" | "devnet";
}

export function defaultOnChainConfig(): OnChainConfig {
  return {
    heliusRpcUrl: process.env.HELIUS_RPC_URL ?? "",
    heliusApiKey: process.env.HELIUS_API_KEY ?? "",
    heliusWssUrl: process.env.HELIUS_WSS_URL,
    network: (process.env.HELIUS_NETWORK as "mainnet" | "devnet") ?? "mainnet",
  };
}

// ── Types ────────────────────────────────────────────────────────────

export interface BalanceResult {
  lamports: number;
  sol: number;
}

export interface TokenBalance {
  mint: string;
  amount: bigint;
  decimals: number;
  uiAmount: number;
  symbol?: string;
}

export interface EnhancedTransaction {
  signature: string;
  type: string;
  description: string;
  source: string;
  fee: number;
  timestamp: number;
  nativeTransfers: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
  tokenTransfers: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    mint: string;
    tokenAmount: number;
  }>;
}

export interface PriorityFeeEstimate {
  min: number;
  low: number;
  medium: number;
  high: number;
  max: number;
}

export interface HealthStatus {
  healthy: boolean;
  blockHeight: number;
  slot: number;
  version: string;
  latencyMs: number;
}

// ── On-Chain Engine ──────────────────────────────────────────────────

export class OnChainEngine {
  private connection: Connection;
  private config: OnChainConfig;
  private logFn: (msg: string) => void;

  constructor(config: OnChainConfig, logFn?: (msg: string) => void) {
    if (!config.heliusRpcUrl) {
      throw new Error("HELIUS_RPC_URL is required — get one at https://helius.dev");
    }

    this.config = config;
    this.logFn = logFn ?? ((msg) => console.log(`[ONCHAIN] ${msg}`));

    this.connection = new Connection(config.heliusRpcUrl, {
      commitment: "confirmed",
      wsEndpoint: config.heliusWssUrl || undefined,
    });
  }

  /** Get the raw Connection for advanced usage. */
  getConnection(): Connection {
    return this.connection;
  }

  // ── Balance & Portfolio ──────────────────────────────────────

  async getSOLBalance(pubkey: PublicKey): Promise<BalanceResult> {
    const lamports = await this.connection.getBalance(pubkey);
    return {
      lamports,
      sol: lamports / LAMPORTS_PER_SOL,
    };
  }

  async getTokenBalances(wallet: PublicKey): Promise<TokenBalance[]> {
    const accounts = await this.connection.getParsedTokenAccountsByOwner(wallet, {
      programId: TOKEN_PROGRAM_ID,
    });

    const balances: TokenBalance[] = [];

    for (const { account } of accounts.value) {
      const parsed = account.data as any;
      const info = parsed?.parsed?.info;
      if (!info) continue;

      const uiAmount = info.tokenAmount?.uiAmount ?? 0;
      if (uiAmount > 0) {
        balances.push({
          mint: info.mint,
          amount: BigInt(info.tokenAmount?.amount ?? "0"),
          decimals: info.tokenAmount?.decimals ?? 0,
          uiAmount,
        });
      }
    }

    return balances;
  }

  // ── Transaction History (Helius Enhanced) ────────────────────

  async getEnhancedTransactions(
    address: string,
    limit = 20,
  ): Promise<EnhancedTransaction[]> {
    if (!this.config.heliusApiKey) {
      throw new Error("HELIUS_API_KEY required for enhanced transactions");
    }

    const url = `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${this.config.heliusApiKey}&limit=${limit}`;

    const resp = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Helius API ${resp.status}: ${body.slice(0, 200)}`);
    }

    return (await resp.json()) as EnhancedTransaction[];
  }

  // ── Send SOL ─────────────────────────────────────────────────

  async sendSOL(
    from: Keypair,
    to: PublicKey,
    lamports: number,
  ): Promise<string> {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports,
      }),
    );

    const sig = await sendAndConfirmTransaction(this.connection, tx, [from]);
    return sig;
  }

  // ── Send SPL Token ───────────────────────────────────────────

  async sendToken(
    from: Keypair,
    to: PublicKey,
    mint: PublicKey,
    amount: bigint,
    decimals: number,
  ): Promise<string> {
    const fromATA = await getAssociatedTokenAddress(mint, from.publicKey);
    const toATA = await getAssociatedTokenAddress(mint, to);

    const tx = new Transaction().add(
      createTransferCheckedInstruction(
        fromATA,
        mint,
        toATA,
        from.publicKey,
        amount,
        decimals,
      ),
    );

    return await sendAndConfirmTransaction(this.connection, tx, [from]);
  }

  // ── Priority Fees ────────────────────────────────────────────

  async getPriorityFees(): Promise<PriorityFeeEstimate> {
    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "getPriorityFeeEstimate",
      params: [{ options: { includeAllPriorityFeeLevels: true } }],
    };

    const resp = await fetch(this.config.heliusRpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    const data = await resp.json() as any;
    return data?.result?.priorityFeeLevels ?? {
      min: 0,
      low: 0,
      medium: 0,
      high: 0,
      max: 0,
    };
  }

  // ── WebSocket Subscriptions ──────────────────────────────────

  watchAccount(
    pubkey: PublicKey,
    callback: (lamports: number) => void,
  ): number {
    return this.connection.onAccountChange(pubkey, (info) => {
      callback(info.lamports);
    });
  }

  unwatchAccount(subscriptionId: number): void {
    this.connection.removeAccountChangeListener(subscriptionId).catch(() => {});
  }

  // ── Health Check ─────────────────────────────────────────────

  async checkHealth(): Promise<HealthStatus> {
    const start = Date.now();

    try {
      const [version, slot, height] = await Promise.all([
        this.connection.getVersion(),
        this.connection.getSlot(),
        this.connection.getBlockHeight(),
      ]);

      return {
        healthy: true,
        blockHeight: height,
        slot,
        version: version["solana-core"] ?? "unknown",
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        healthy: false,
        blockHeight: 0,
        slot: 0,
        version: "unreachable",
        latencyMs: Date.now() - start,
      };
    }
  }

  // ── Trending Tokens (Birdeye) ────────────────────────────────

  async getTrendingTokens(birdeyeApiKey: string, limit = 10): Promise<any[]> {
    const url = `https://public-api.birdeye.so/defi/tokenlist?sort_by=v24hChangePercent&sort_type=desc&limit=${limit}`;

    const resp = await fetch(url, {
      headers: {
        "X-API-KEY": birdeyeApiKey,
        "x-chain": "solana",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      throw new Error(`Birdeye API ${resp.status}`);
    }

    const data = await resp.json() as any;
    return data?.data?.tokens ?? [];
  }

  // ── Close ────────────────────────────────────────────────────

  close(): void {
    // Connection doesn't need explicit close in web3.js v1
  }
}
