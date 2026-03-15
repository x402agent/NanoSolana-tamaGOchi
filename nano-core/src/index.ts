/**
 * NanoSolana TamaGObot — Main Entry
 *
 * A GoBot on Solana · Physical Companion: TamaGOchi · By NanoSolana Labs
 *
 * Exports all core modules for programmatic usage.
 */

// Config & Security
export { loadConfig, saveSecrets, loadSecrets, redactConfig, ensureNanoHome, encrypt, decrypt } from "./config/vault.js";
export type { NanoConfig } from "./config/vault.js";

// Solana Wallet
export { NanoWallet } from "./wallet/manager.js";
export type { WalletInfo, WalletEvents } from "./wallet/manager.js";

// Trading Engine (OODA)
export { TradingEngine, BirdeyeClient, HeliusClient, JupiterClient } from "./trading/engine.js";
export type { TokenPrice, TradeSignal, TradeExecution, TradeOutcome, TradingEngineEvents } from "./trading/engine.js";

// Strategy (RSI + EMA + ATR)
export { StrategyEngine, calculateRSI, calculateEMA, calculateATR, DEFAULT_PARAMS } from "./strategy/engine.js";
export type { StrategyParams, OHLCV, Signal, StrategyEvents } from "./strategy/engine.js";

// ClawVault Memory (3-tier epistemological)
export { ClawVault } from "./memory/clawvault.js";
export type { VaultEntry, TradeRecord, Lesson, ResearchAgenda, KnowledgeTier, ClawVaultEvents } from "./memory/clawvault.js";

// Legacy generic memory (kept for compatibility)
export { MemoryEngine } from "./memory/engine.js";

// AI Provider (OpenRouter)
export { AIProvider } from "./ai/provider.js";
export type { AIMessage, AIResponse, OODAContext, TradeDecision, AIProviderEvents } from "./ai/provider.js";

// TamaGOchi Pet Engine
export { TamaGOchi, STAGE_EMOJI, MOOD_EMOJI } from "./pet/tamagochi.js";
export type { TamaGOchiState, EvolutionStage, Mood, TamaGOchiEvents } from "./pet/tamagochi.js";

// Gateway Server
export { NanoGateway } from "./gateway/server.js";
export type { GatewayMessage, ConnectedAgent, GatewayEvents } from "./gateway/server.js";

// Hub Bridge
export { NanoHubBridge } from "./hub/bridge.js";
export type { HubUpdate, HubBridgeEvents } from "./hub/bridge.js";

// Network (Tailscale + tmux)
export { TailscaleDiscovery, TmuxManager, NanoNetworkClient } from "./network/mesh.js";
export type { NanoNode, TmuxSession, NanoNetworkEvents } from "./network/mesh.js";

// Docs + Extensions Knowledge Integration
export {
  getNanoKnowledgeSnapshot,
  clearNanoKnowledgeCache,
  getNanoKnowledgeSummary,
  searchNanoKnowledge,
} from "./docs/integration.js";
export type {
  NanoDocArea,
  NanoDocIndexEntry,
  NanoDocAreaSnapshot,
  NanoExtensionIndexEntry,
  NanoKnowledgeSnapshot,
  NanoKnowledgeSnapshotOptions,
  NanoKnowledgeSummary,
  NanoKnowledgeSearchMatch,
} from "./docs/integration.js";

// Telegram Persistence
export { TelegramConversationStore } from "./telegram/persistence.js";
export type { ConversationMessage, ConversationContext, ConversationSearchResult } from "./telegram/persistence.js";

// Pump.fun Integration (bonding curves, PDAs, token ops)
export { PumpClient, calculateBuyTokens, calculateSellSol, calculateTokenPrice, calculateMarketCap, calculateGraduationProgress, calculateBuyPriceImpact, bondingCurvePda, creatorVaultPda, globalPda, PUMP_PROGRAM_ID, PUMP_AMM_PROGRAM_ID, PUMP_FEES_PROGRAM_ID } from "./pump/client.js";
export type { BondingCurveState, TokenInfo, BuyQuote, SellQuote } from "./pump/client.js";

// Swarm Orchestrator
export { SwarmOrchestrator } from "./swarm/orchestrator.js";
export type { AgentRole, AgentStatus, AgentConfig, AgentState, SwarmEventType, SwarmEvent, SwarmHealth, SwarmAgent, SwarmContext } from "./swarm/orchestrator.js";

// Swarm Agents
export { BaseAgent } from "./agents/base-agent.js";
export { SniperAgent } from "./agents/sniper-agent.js";
export { WhaleWatcherAgent } from "./agents/whale-watcher-agent.js";
export { GraduationHunterAgent } from "./agents/graduation-hunter-agent.js";
export { FeeHarvesterAgent } from "./agents/fee-harvester-agent.js";
export { LiquidityScoutAgent } from "./agents/liquidity-scout-agent.js";
export { MomentumRiderAgent } from "./agents/momentum-rider-agent.js";

// Lobster Library (agent definitions & builder)
export { LobsterAgentBuilder } from "./lobster/builder.js";
export { lobsterAgentSchema, getLobsterAgentJsonSchema, LOBSTER_CATEGORIES } from "./lobster/schema.js";
export type { LobsterAgent, LobsterCategory } from "./lobster/schema.js";
export { generateLobsterAgents, searchLobsterAgents, getLobsterAgentsByCategory } from "./lobster/generator.js";
