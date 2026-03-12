/**
 * NanoSolana Helius Client — Full Blockchain Data Reader
 *
 * Wraps every Helius API for instant blockchain intelligence at birth:
 *   - DAS API (getAsset, getAssetsByOwner, searchAssets)
 *   - Enhanced Transactions (parsed tx history)
 *   - getTransactionsForAddress (Helius-exclusive, filtered history)
 *   - Priority Fees
 *   - Health / Version
 *   - Token balances + SOL balance
 *   - Trending token discovery
 *
 * Designed to be initialized with just an RPC URL + API key and
 * immediately display a rich "blockchain scan" on agent birth.
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// ── Types ────────────────────────────────────────────────────────────

export interface HeliusConfig {
  rpcUrl: string;
  apiKey: string;
  wssUrl?: string;
}

export interface DASAsset {
  id: string;
  content?: {
    metadata?: { name?: string; symbol?: string; description?: string };
    json_uri?: string;
  };
  ownership?: { owner?: string };
  compression?: { compressed?: boolean };
  token_info?: {
    symbol?: string;
    balance?: number;
    decimals?: number;
    supply?: number;
    price_info?: { price_per_token?: number; total_price?: number; currency?: string };
  };
  grouping?: Array<{ group_key?: string; group_value?: string }>;
  interface?: string;
}

export interface DASSearchResult {
  total: number;
  limit: number;
  page: number;
  items: DASAsset[];
  nativeBalance?: { lamports: number; sol: number; total_price?: number };
}

export interface EnhancedTx {
  signature: string;
  type: string;
  description: string;
  source: string;
  fee: number;
  timestamp: number;
  nativeTransfers: Array<{ fromUserAccount: string; toUserAccount: string; amount: number }>;
  tokenTransfers: Array<{ fromUserAccount: string; toUserAccount: string; mint: string; tokenAmount: number }>;
}

export interface HealthStatus {
  healthy: boolean;
  slot: number;
  blockHeight: number;
  version: string;
  latencyMs: number;
}

export interface PriorityFees {
  min: number;
  low: number;
  medium: number;
  high: number;
  max: number;
}

export interface WalletSnapshot {
  address: string;
  solBalance: number;
  solLamports: number;
  solPrice?: number;
  totalValueUsd?: number;
  tokens: Array<{
    symbol: string;
    name: string;
    mint: string;
    balance: number;
    decimals: number;
    pricePerToken?: number;
    totalPrice?: number;
  }>;
  nfts: Array<{
    name: string;
    mint: string;
    collection?: string;
    compressed: boolean;
  }>;
  recentTransactions: EnhancedTx[];
  health: HealthStatus;
  scanTimestamp: string;
}

// ── Helius Client ────────────────────────────────────────────────────

export class HeliusClient {
  private connection: Connection;
  private rpcUrl: string;
  private apiKey: string;

  constructor(config: HeliusConfig) {
    if (!config.rpcUrl) throw new Error("Helius RPC URL required — get one at https://helius.dev");
    if (!config.apiKey) throw new Error("Helius API key required — get one at https://helius.dev");

    this.rpcUrl = config.rpcUrl;
    this.apiKey = config.apiKey;
    this.connection = new Connection(config.rpcUrl, {
      commitment: "confirmed",
      wsEndpoint: config.wssUrl || undefined,
    });
  }

  // ── DAS API ──────────────────────────────────────────────────

  /** Get a single asset by its mint/ID */
  async getAsset(id: string): Promise<DASAsset | null> {
    try {
      const result = await this.rpc("getAsset", { id });
      return result as DASAsset;
    } catch {
      return null;
    }
  }

  /** Get all assets owned by a wallet (NFTs + tokens) */
  async getAssetsByOwner(
    owner: string,
    opts?: { page?: number; limit?: number; showFungible?: boolean; showNativeBalance?: boolean },
  ): Promise<DASSearchResult> {
    const result = await this.rpc("getAssetsByOwner", {
      ownerAddress: owner,
      page: opts?.page ?? 1,
      limit: opts?.limit ?? 100,
      displayOptions: {
        showFungible: opts?.showFungible ?? true,
        showNativeBalance: opts?.showNativeBalance ?? true,
        showInscription: false,
      },
    });
    return result as DASSearchResult;
  }

  /** Search assets with flexible criteria */
  async searchAssets(params: {
    ownerAddress?: string;
    tokenType?: "fungible" | "nonFungible" | "regularNft" | "compressedNft" | "all";
    grouping?: [string, string];
    compressed?: boolean;
    page?: number;
    limit?: number;
  }): Promise<DASSearchResult> {
    const result = await this.rpc("searchAssets", {
      ...params,
      page: params.page ?? 1,
      limit: params.limit ?? 50,
    });
    return result as DASSearchResult;
  }

  /** Get assets in a collection */
  async getAssetsByCollection(collectionAddress: string, opts?: { page?: number; limit?: number }): Promise<DASSearchResult> {
    const result = await this.rpc("getAssetsByGroup", {
      groupKey: "collection",
      groupValue: collectionAddress,
      page: opts?.page ?? 1,
      limit: opts?.limit ?? 100,
    });
    return result as DASSearchResult;
  }

  /** Get assets by creator */
  async getAssetsByCreator(creatorAddress: string, opts?: { page?: number; limit?: number; onlyVerified?: boolean }): Promise<DASSearchResult> {
    const result = await this.rpc("getAssetsByCreator", {
      creatorAddress,
      onlyVerified: opts?.onlyVerified ?? true,
      page: opts?.page ?? 1,
      limit: opts?.limit ?? 100,
    });
    return result as DASSearchResult;
  }

  // ── Enhanced Transactions ────────────────────────────────────

  /** Get parsed transaction history via Helius Enhanced API */
  async getEnhancedTransactions(address: string, limit = 10): Promise<EnhancedTx[]> {
    const url = `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${this.apiKey}&limit=${limit}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Helius Enhanced API ${resp.status}: ${body.slice(0, 200)}`);
    }
    return (await resp.json()) as EnhancedTx[];
  }

  // ── getTransactionsForAddress (Helius Exclusive) ─────────────

  /** Helius-exclusive: get full transaction history with filters */
  async getTransactionsForAddress(
    address: string,
    opts?: {
      transactionDetails?: "signatures" | "full";
      sortOrder?: "asc" | "desc";
      limit?: number;
      paginationToken?: string;
      filters?: {
        blockTime?: { gte?: number; lte?: number; gt?: number; lt?: number };
        status?: "succeeded" | "failed" | "any";
        tokenAccounts?: "none" | "balanceChanged" | "all";
        slot?: { gte?: number; lte?: number };
      };
    },
  ): Promise<{ data: any[]; paginationToken?: string }> {
    const params: any[] = [
      address,
      {
        transactionDetails: opts?.transactionDetails ?? "signatures",
        sortOrder: opts?.sortOrder ?? "desc",
        limit: opts?.limit ?? 100,
        ...(opts?.paginationToken && { paginationToken: opts.paginationToken }),
        ...(opts?.filters && { filters: opts.filters }),
      },
    ];

    const result = await this.rpcRaw("getTransactionsForAddress", params);
    return result as { data: any[]; paginationToken?: string };
  }

  // ── Balances ─────────────────────────────────────────────────

  /** Get SOL balance */
  async getSOLBalance(pubkey: string): Promise<{ lamports: number; sol: number }> {
    const lamports = await this.connection.getBalance(new PublicKey(pubkey));
    return { lamports, sol: lamports / LAMPORTS_PER_SOL };
  }

  // ── Priority Fees ────────────────────────────────────────────

  async getPriorityFees(): Promise<PriorityFees> {
    const result = await this.rpcRaw("getPriorityFeeEstimate", [
      { options: { includeAllPriorityFeeLevels: true } },
    ]);
    return (result as any)?.priorityFeeLevels ?? { min: 0, low: 0, medium: 0, high: 0, max: 0 };
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
        slot,
        blockHeight: height,
        version: version["solana-core"] ?? "unknown",
        latencyMs: Date.now() - start,
      };
    } catch {
      return { healthy: false, slot: 0, blockHeight: 0, version: "unreachable", latencyMs: Date.now() - start };
    }
  }

  // ── Full Wallet Snapshot (used at birth) ─────────────────────

  /**
   * Performs a complete "blockchain scan" of a wallet.
   * Returns SOL balance, all tokens with prices, NFTs, recent tx, and health.
   * This is the "cool" instant read the agent gets at birth.
   */
  async snapshotWallet(address: string): Promise<WalletSnapshot> {
    const [health, solBal, dasResult, recentTx] = await Promise.allSettled([
      this.checkHealth(),
      this.getSOLBalance(address),
      this.getAssetsByOwner(address, { showFungible: true, showNativeBalance: true, limit: 100 }),
      this.getEnhancedTransactions(address, 5).catch(() => [] as EnhancedTx[]),
    ]);

    const healthVal = health.status === "fulfilled" ? health.value : { healthy: false, slot: 0, blockHeight: 0, version: "unknown", latencyMs: 0 };
    const solVal = solBal.status === "fulfilled" ? solBal.value : { lamports: 0, sol: 0 };
    const dasVal = dasResult.status === "fulfilled" ? dasResult.value : { total: 0, limit: 0, page: 1, items: [] };
    const txVal = recentTx.status === "fulfilled" ? recentTx.value : [];

    // Parse DAS items into tokens and NFTs
    const tokens: WalletSnapshot["tokens"] = [];
    const nfts: WalletSnapshot["nfts"] = [];

    for (const item of dasVal.items ?? []) {
      const tokenInfo = item.token_info;
      const meta = item.content?.metadata;

      if (tokenInfo && tokenInfo.decimals !== undefined && tokenInfo.decimals > 0) {
        // Fungible token
        tokens.push({
          symbol: tokenInfo.symbol ?? meta?.symbol ?? "???",
          name: meta?.name ?? tokenInfo.symbol ?? "Unknown",
          mint: item.id,
          balance: tokenInfo.balance
            ? tokenInfo.balance / Math.pow(10, tokenInfo.decimals)
            : 0,
          decimals: tokenInfo.decimals,
          pricePerToken: tokenInfo.price_info?.price_per_token,
          totalPrice: tokenInfo.price_info?.total_price,
        });
      } else if (item.interface === "V1_NFT" || item.interface === "ProgrammableNFT" || item.compression?.compressed) {
        // NFT
        nfts.push({
          name: meta?.name ?? "Unnamed NFT",
          mint: item.id,
          collection: item.grouping?.find((g) => g.group_key === "collection")?.group_value,
          compressed: item.compression?.compressed ?? false,
        });
      }
    }

    // Sort tokens by total price descending
    tokens.sort((a, b) => (b.totalPrice ?? 0) - (a.totalPrice ?? 0));

    const totalValueUsd = tokens.reduce((sum, t) => sum + (t.totalPrice ?? 0), 0);

    return {
      address,
      solBalance: solVal.sol,
      solLamports: solVal.lamports,
      solPrice: (dasVal as any).nativeBalance?.total_price,
      totalValueUsd,
      tokens,
      nfts,
      recentTransactions: txVal as EnhancedTx[],
      health: healthVal,
      scanTimestamp: new Date().toISOString(),
    };
  }

  // ── Internals ────────────────────────────────────────────────

  /** DAS RPC call (params as object) */
  private async rpc(method: string, params: Record<string, any>): Promise<unknown> {
    const resp = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: `nano-${method}`, method, params }),
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) throw new Error(`Helius RPC ${resp.status}`);
    const json = (await resp.json()) as any;
    if (json.error) throw new Error(json.error.message ?? JSON.stringify(json.error));
    return json.result;
  }

  /** Raw RPC call (params as array) */
  private async rpcRaw(method: string, params: any[]): Promise<unknown> {
    const resp = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: `nano-${method}`, method, params }),
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) throw new Error(`Helius RPC ${resp.status}`);
    const json = (await resp.json()) as any;
    if (json.error) throw new Error(json.error.message ?? JSON.stringify(json.error));
    return json.result;
  }
}

// ── Pretty Printer ───────────────────────────────────────────────────

/**
 * Print a wallet snapshot in a visually stunning CLI format.
 * Called immediately after birth when Helius keys are available.
 */
export function printWalletSnapshot(snap: WalletSnapshot, chalk: any): void {
  const g = chalk.hex("#14F195");
  const p = chalk.hex("#9945FF");
  const a = chalk.hex("#FFAA00");
  const d = chalk.gray;
  const w = chalk.white;

  console.log();
  console.log(g.bold("  ⛓️  ── Blockchain Scan ────────────────────────────────────"));
  console.log();

  // Health
  const hIcon = snap.health.healthy ? g("●") : chalk.red("●");
  console.log(`  ${hIcon} ${w("Solana")} ${d(`v${snap.health.version}`)} ${d(`| slot ${snap.health.slot.toLocaleString()}`)} ${d(`| ${snap.health.latencyMs}ms`)}`);
  console.log();

  // SOL Balance
  const solUsd = snap.solPrice ? ` ($${snap.solPrice.toFixed(2)})` : "";
  console.log(`  ${a("◎")} ${w("SOL Balance:")} ${a(`${snap.solBalance.toFixed(9)} SOL`)}${d(solUsd)}`);

  // Tokens
  if (snap.tokens.length > 0) {
    console.log();
    console.log(p("  ── Tokens ──────────────────────────────────────────────"));
    for (const t of snap.tokens.slice(0, 10)) {
      const price = t.totalPrice ? ` ($${t.totalPrice.toFixed(2)})` : "";
      const perToken = t.pricePerToken ? d(` @ $${t.pricePerToken.toFixed(4)}`) : "";
      console.log(`  ${g("•")} ${w(t.symbol.padEnd(10))} ${a(t.balance.toFixed(4).padStart(16))}${perToken}${d(price)}`);
    }
    if (snap.tokens.length > 10) {
      console.log(d(`  ... and ${snap.tokens.length - 10} more tokens`));
    }
    if ((snap.totalValueUsd ?? 0) > 0) {
      console.log(d(`  Total token value: $${(snap.totalValueUsd ?? 0).toFixed(2)}`));
    }
  } else {
    console.log(d("  No SPL tokens found"));
  }

  // NFTs
  if (snap.nfts.length > 0) {
    console.log();
    console.log(p("  ── NFTs ────────────────────────────────────────────────"));
    for (const n of snap.nfts.slice(0, 5)) {
      const tag = n.compressed ? d(" [cNFT]") : "";
      const col = n.collection ? d(` | ${n.collection.slice(0, 8)}...`) : "";
      console.log(`  ${g("◆")} ${w(n.name.slice(0, 40))}${tag}${col}`);
    }
    if (snap.nfts.length > 5) {
      console.log(d(`  ... and ${snap.nfts.length - 5} more NFTs`));
    }
  }

  // Recent Transactions
  if (snap.recentTransactions.length > 0) {
    console.log();
    console.log(p("  ── Recent Transactions ─────────────────────────────────"));
    for (const tx of snap.recentTransactions.slice(0, 5)) {
      const time = tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleString() : "unknown";
      const desc = tx.description ? tx.description.slice(0, 60) : tx.type;
      const sig = tx.signature.slice(0, 12) + "...";
      console.log(`  ${g("→")} ${d(sig)} ${w(desc)}`);
      console.log(`    ${d(time)} | ${d(tx.source)} | fee: ${d(tx.fee + " lamports")}`);
    }
  }

  console.log();
  console.log(d(`  Scanned at ${snap.scanTimestamp}`));
  console.log(g.bold("  ────────────────────────────────────────────────────────"));
  console.log();
}
