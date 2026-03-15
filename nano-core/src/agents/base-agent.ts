/**
 * NanoSolana — Base Agent
 *
 * Abstract base class for all swarm agents.
 * Provides lifecycle management, state tracking, and event helpers.
 */

import type {
  SwarmAgent,
  SwarmContext,
  AgentConfig,
  AgentState,
  AgentRole,
  AgentStatus,
  SwarmEvent,
  SwarmEventType,
} from "../swarm/orchestrator.js";

export abstract class BaseAgent implements SwarmAgent {
  abstract readonly role: AgentRole;
  abstract readonly name: string;
  abstract readonly description: string;

  protected ctx: SwarmContext | null = null;
  protected status: AgentStatus = "idle";
  protected lastRunAt = 0;
  protected lastError: string | null = null;
  protected tasksCompleted = 0;
  protected tasksActive = 0;
  protected eventsEmitted = 0;
  protected eventsConsumed = 0;
  protected startedAt = 0;
  protected config: AgentConfig;

  constructor(
    readonly id: string,
    params: Partial<AgentConfig> = {},
  ) {
    this.config = {
      id,
      role: "custom",
      name: "",
      description: "",
      enabled: true,
      intervalMs: 10_000,
      maxConcurrentTasks: 1,
      params: {},
      ...params,
    };
  }

  async init(ctx: SwarmContext): Promise<void> {
    this.ctx = ctx;
    this.startedAt = Date.now();
    this.status = "running";
    await this.onInit();
  }

  async tick(): Promise<void> {
    if (this.status !== "running" || !this.ctx) return;

    this.tasksActive++;
    this.lastRunAt = Date.now();

    try {
      await this.onTick();
      this.tasksCompleted++;
    } catch (err) {
      this.lastError = (err as Error).message;
      this.status = "error";
      this.log("error", `Tick failed: ${this.lastError}`);
    } finally {
      this.tasksActive--;
    }
  }

  async handleEvent(event: SwarmEvent): Promise<void> {
    this.eventsConsumed++;
    await this.onEvent(event);
  }

  async destroy(): Promise<void> {
    this.status = "stopped";
    await this.onDestroy();
  }

  getState(): AgentState {
    return {
      config: { ...this.config, role: this.role, name: this.name, description: this.description },
      status: this.status,
      lastRunAt: this.lastRunAt,
      lastError: this.lastError,
      tasksCompleted: this.tasksCompleted,
      tasksActive: this.tasksActive,
      eventsEmitted: this.eventsEmitted,
      eventsConsumed: this.eventsConsumed,
      uptime: this.startedAt > 0 ? Date.now() - this.startedAt : 0,
      startedAt: this.startedAt,
    };
  }

  // ── Protected Helpers ──────────────────────────────────────

  protected emit(type: SwarmEventType, data: unknown, priority = 5): void {
    this.eventsEmitted++;
    this.ctx?.emit(type, data, priority);
  }

  protected log(level: "debug" | "info" | "warn" | "error", message: string): void {
    this.ctx?.log(this.id, level, message);
  }

  // ── Abstract Methods (implement in subclasses) ─────────────

  protected abstract onInit(): Promise<void>;
  protected abstract onTick(): Promise<void>;
  protected abstract onEvent(event: SwarmEvent): Promise<void>;
  protected abstract onDestroy(): Promise<void>;
}
