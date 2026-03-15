/**
 * NanoSolana — Swarm Orchestrator
 *
 * Coordinates multiple specialized agents in a unified swarm:
 *   - Event bus for inter-agent communication
 *   - Agent lifecycle management (start/stop/restart)
 *   - Shared state and memory across agents
 *   - Priority-based task routing
 *   - Health monitoring and auto-recovery
 *
 * The swarm follows a "lobster colony" model:
 *   - Each agent has a specialized role
 *   - Agents communicate through the event bus
 *   - The orchestrator ensures no agent conflicts
 *   - Shared ClawVault memory prevents duplicate work
 */

import { EventEmitter } from "eventemitter3";
import type { ClawVault } from "../memory/clawvault.js";
import type { PumpClient } from "../pump/client.js";
import type { NanoWallet } from "../wallet/manager.js";

// ── Types ────────────────────────────────────────────────────

export type AgentRole =
  | "sniper"
  | "whale-watcher"
  | "graduation-hunter"
  | "fee-harvester"
  | "liquidity-scout"
  | "momentum-rider"
  | "custom";

export type AgentStatus = "idle" | "running" | "paused" | "error" | "stopped";

export interface AgentConfig {
  id: string;
  role: AgentRole;
  name: string;
  description: string;
  enabled: boolean;
  intervalMs: number;
  maxConcurrentTasks: number;
  params: Record<string, unknown>;
}

export interface AgentState {
  config: AgentConfig;
  status: AgentStatus;
  lastRunAt: number;
  lastError: string | null;
  tasksCompleted: number;
  tasksActive: number;
  eventsEmitted: number;
  eventsConsumed: number;
  uptime: number;
  startedAt: number;
}

export type SwarmEventType =
  | "agent:started"
  | "agent:stopped"
  | "agent:error"
  | "agent:heartbeat"
  | "token:new-launch"
  | "token:graduation"
  | "token:whale-buy"
  | "token:whale-sell"
  | "token:momentum-shift"
  | "trade:signal"
  | "trade:executed"
  | "trade:outcome"
  | "fee:claimable"
  | "fee:claimed"
  | "liquidity:added"
  | "liquidity:removed"
  | "alert:risk"
  | "alert:opportunity"
  | "system:metric";

export interface SwarmEvent<T = unknown> {
  id: string;
  type: SwarmEventType;
  source: string;       // Agent ID
  timestamp: number;
  data: T;
  priority: number;     // 0-10, higher = more urgent
}

export interface SwarmOrchestratorEvents {
  event: (event: SwarmEvent) => void;
  agentStarted: (agentId: string) => void;
  agentStopped: (agentId: string) => void;
  agentError: (agentId: string, error: string) => void;
  swarmHealthUpdate: (health: SwarmHealth) => void;
}

export interface SwarmHealth {
  totalAgents: number;
  runningAgents: number;
  errorAgents: number;
  totalEventsProcessed: number;
  eventsPerMinute: number;
  uptime: number;
  memoryUsage: number;
  agents: Record<string, AgentState>;
}

// ── Agent Interface ─────────────────────────────────────────

/**
 * Base interface all swarm agents must implement.
 */
export interface SwarmAgent {
  readonly id: string;
  readonly role: AgentRole;
  readonly name: string;
  readonly description: string;

  /** Initialize the agent with shared resources */
  init(ctx: SwarmContext): Promise<void>;

  /** Execute one cycle of the agent's work */
  tick(): Promise<void>;

  /** Handle an event from the event bus */
  handleEvent(event: SwarmEvent): Promise<void>;

  /** Clean shutdown */
  destroy(): Promise<void>;

  /** Get current agent state */
  getState(): AgentState;
}

/**
 * Shared context passed to all agents at init.
 */
export interface SwarmContext {
  pump: PumpClient;
  wallet: NanoWallet;
  memory: ClawVault;
  emit: (type: SwarmEventType, data: unknown, priority?: number) => void;
  getAgentStates: () => Record<string, AgentState>;
  log: (agentId: string, level: "debug" | "info" | "warn" | "error", message: string) => void;
}

// ── Event Bus ────────────────────────────────────────────────

class SwarmEventBus {
  private handlers = new Map<string, Set<(event: SwarmEvent) => void>>();
  private wildcardHandlers = new Set<(event: SwarmEvent) => void>();
  private buffer: SwarmEvent[] = [];
  private maxBuffer: number;
  private totalEvents = 0;
  private minuteWindow: number[] = [];

  constructor(maxBuffer = 5000) {
    this.maxBuffer = maxBuffer;
  }

  on(type: SwarmEventType, handler: (event: SwarmEvent) => void): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  onAny(handler: (event: SwarmEvent) => void): () => void {
    this.wildcardHandlers.add(handler);
    return () => this.wildcardHandlers.delete(handler);
  }

  emit(type: SwarmEventType, source: string, data: unknown, priority = 5): SwarmEvent {
    const event: SwarmEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      source,
      timestamp: Date.now(),
      data,
      priority,
    };

    this.totalEvents++;
    this.minuteWindow.push(Date.now());

    this.buffer.push(event);
    if (this.buffer.length > this.maxBuffer) {
      this.buffer.splice(0, this.buffer.length - this.maxBuffer);
    }

    // Dispatch to type handlers
    const handlers = this.handlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try { handler(event); } catch { /* silent */ }
      }
    }

    // Dispatch to wildcard
    for (const handler of this.wildcardHandlers) {
      try { handler(event); } catch { /* silent */ }
    }

    return event;
  }

  getRecentEvents(limit = 100): SwarmEvent[] {
    return this.buffer.slice(-limit);
  }

  getEventsPerMinute(): number {
    const cutoff = Date.now() - 60_000;
    this.minuteWindow = this.minuteWindow.filter((ts) => ts > cutoff);
    return this.minuteWindow.length;
  }

  getTotalEvents(): number {
    return this.totalEvents;
  }

  destroy(): void {
    this.handlers.clear();
    this.wildcardHandlers.clear();
    this.buffer = [];
  }
}

// ── Swarm Orchestrator ──────────────────────────────────────

export class SwarmOrchestrator extends EventEmitter<SwarmOrchestratorEvents> {
  private agents = new Map<string, SwarmAgent>();
  private agentTimers = new Map<string, ReturnType<typeof setInterval>>();
  private eventBus: SwarmEventBus;
  private startedAt = 0;
  private healthTimer: ReturnType<typeof setInterval> | null = null;
  private context: SwarmContext | null = null;

  constructor(
    private pump: PumpClient,
    private wallet: NanoWallet,
    private memory: ClawVault,
  ) {
    super();
    this.eventBus = new SwarmEventBus();
  }

  /**
   * Register an agent with the swarm.
   */
  register(agent: SwarmAgent): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent already registered: ${agent.id}`);
    }
    this.agents.set(agent.id, agent);
  }

  /**
   * Unregister an agent.
   */
  async unregister(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    await this.stopAgent(agentId);
    this.agents.delete(agentId);
  }

  /**
   * Start the swarm — initializes all registered agents and begins ticking.
   */
  async start(healthCheckMs = 15_000): Promise<void> {
    this.startedAt = Date.now();

    // Build shared context
    this.context = {
      pump: this.pump,
      wallet: this.wallet,
      memory: this.memory,
      emit: (type, data, priority) => {
        const event = this.eventBus.emit(type, "orchestrator", data, priority);
        this.emit("event", event);
      },
      getAgentStates: () => this.getAgentStates(),
      log: (agentId, level, message) => {
        this.logAgent(agentId, level, message);
      },
    };

    // Wire event bus to route events to all agents
    this.eventBus.onAny((event) => {
      this.emit("event", event);
      for (const agent of this.agents.values()) {
        const state = agent.getState();
        if (state.status === "running") {
          agent.handleEvent(event).catch((err) => {
            this.logAgent(agent.id, "error", `Event handler error: ${(err as Error).message}`);
          });
        }
      }
    });

    // Initialize all agents
    for (const agent of this.agents.values()) {
      try {
        await agent.init(this.context);
        this.logAgent(agent.id, "info", `Initialized (role: ${agent.role})`);
      } catch (err) {
        this.logAgent(agent.id, "error", `Init failed: ${(err as Error).message}`);
        this.emit("agentError", agent.id, (err as Error).message);
      }
    }

    // Start agent tick loops
    for (const agent of this.agents.values()) {
      this.startAgent(agent.id);
    }

    // Start health monitoring
    this.healthTimer = setInterval(() => {
      this.emit("swarmHealthUpdate", this.getHealth());
    }, healthCheckMs);
  }

  /**
   * Stop the entire swarm gracefully.
   */
  async stop(): Promise<void> {
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }

    // Stop all agents
    for (const agentId of this.agents.keys()) {
      await this.stopAgent(agentId);
    }

    this.eventBus.destroy();
  }

  /**
   * Start a specific agent's tick loop.
   */
  startAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const state = agent.getState();
    if (state.status === "running") return;

    const intervalMs = state.config.intervalMs || 10_000;

    const timer = setInterval(async () => {
      try {
        await agent.tick();
      } catch (err) {
        this.logAgent(agentId, "error", `Tick error: ${(err as Error).message}`);
        this.emit("agentError", agentId, (err as Error).message);
      }
    }, intervalMs);

    this.agentTimers.set(agentId, timer);
    this.emit("agentStarted", agentId);
    this.logAgent(agentId, "info", `Started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop a specific agent.
   */
  async stopAgent(agentId: string): Promise<void> {
    const timer = this.agentTimers.get(agentId);
    if (timer) {
      clearInterval(timer);
      this.agentTimers.delete(agentId);
    }

    const agent = this.agents.get(agentId);
    if (agent) {
      try {
        await agent.destroy();
      } catch {
        // Silent cleanup
      }
    }

    this.emit("agentStopped", agentId);
    this.logAgent(agentId, "info", "Stopped");
  }

  /**
   * Restart a specific agent.
   */
  async restartAgent(agentId: string): Promise<void> {
    await this.stopAgent(agentId);
    const agent = this.agents.get(agentId);
    if (agent && this.context) {
      await agent.init(this.context);
      this.startAgent(agentId);
    }
  }

  /**
   * Emit an event to the swarm event bus.
   */
  emitEvent(type: SwarmEventType, source: string, data: unknown, priority = 5): void {
    this.eventBus.emit(type, source, data, priority);
  }

  /**
   * Subscribe to events on the bus.
   */
  onEvent(type: SwarmEventType, handler: (event: SwarmEvent) => void): () => void {
    return this.eventBus.on(type, handler);
  }

  /**
   * Get all agent states.
   */
  getAgentStates(): Record<string, AgentState> {
    const states: Record<string, AgentState> = {};
    for (const [id, agent] of this.agents) {
      states[id] = agent.getState();
    }
    return states;
  }

  /**
   * Get swarm health summary.
   */
  getHealth(): SwarmHealth {
    const states = this.getAgentStates();
    const statuses = Object.values(states);

    return {
      totalAgents: statuses.length,
      runningAgents: statuses.filter((s) => s.status === "running").length,
      errorAgents: statuses.filter((s) => s.status === "error").length,
      totalEventsProcessed: this.eventBus.getTotalEvents(),
      eventsPerMinute: this.eventBus.getEventsPerMinute(),
      uptime: this.startedAt > 0 ? Date.now() - this.startedAt : 0,
      memoryUsage: process.memoryUsage().heapUsed,
      agents: states,
    };
  }

  /**
   * Get recent events from the bus.
   */
  getRecentEvents(limit = 100): SwarmEvent[] {
    return this.eventBus.getRecentEvents(limit);
  }

  /**
   * Get registered agent count.
   */
  getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * List registered agents.
   */
  listAgents(): Array<{ id: string; role: AgentRole; name: string; status: AgentStatus }> {
    return [...this.agents.values()].map((agent) => {
      const state = agent.getState();
      return {
        id: agent.id,
        role: agent.role,
        name: agent.name,
        status: state.status,
      };
    });
  }

  // ── Private ────────────────────────────────────────────────

  private logAgent(agentId: string, level: string, message: string): void {
    const prefix = `[swarm:${agentId}]`;
    switch (level) {
      case "error":
        console.error(`${prefix} ${message}`);
        break;
      case "warn":
        console.warn(`${prefix} ${message}`);
        break;
      case "debug":
        // Only log debug if DEBUG env is set
        if (process.env.DEBUG) console.log(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
}
