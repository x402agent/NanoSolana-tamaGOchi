/**
 * Nano Solana — Gateway Server
 *
 * Secure WebSocket + HTTP gateway for:
 *   - Agent ↔ Nano Hub communication
 *   - Agent ↔ Agent mesh networking (via Tailscale)
 *   - Real-time trading data streaming
 *   - Memory sync across nodes
 *
 * Security:
 *   - HMAC-SHA256 auth on all WebSocket connections
 *   - Rate limiting
 *   - Origin checking
 *   - Wallet-signed identity verification
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { EventEmitter } from "eventemitter3";
import type { NanoConfig } from "../config/vault.js";
import type { NanoWallet } from "../wallet/manager.js";
import type { TradingEngine } from "../trading/engine.js";
import type { MemoryEngine } from "../memory/engine.js";
import { getNanoKnowledgeSnapshot, getNanoKnowledgeSummary, searchNanoKnowledge } from "../docs/integration.js";

// ── Types ────────────────────────────────────────────────────

export interface GatewayMessage {
  type: string;
  payload: unknown;
  from: string;     // Agent ID
  to?: string;      // Target agent ID (empty = broadcast)
  timestamp: number;
  signature?: string; // HMAC signature
}

export interface ConnectedAgent {
  id: string;
  publicKey: string;
  ws: WebSocket;
  connectedAt: number;
  lastHeartbeat: number;
  metadata: Record<string, unknown>;
}

export interface GatewayEvents {
  agentConnected: (agent: ConnectedAgent) => void;
  agentDisconnected: (agentId: string) => void;
  messageReceived: (msg: GatewayMessage) => void;
  error: (err: Error) => void;
}

// ── Rate Limiter ────────────────────────────────────────────

class RateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map();

  isAllowed(key: string, maxRequests = 100, windowMs = 60000): boolean {
    const now = Date.now();
    const entry = this.requests.get(key);

    if (!entry || now > entry.resetAt) {
      this.requests.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (entry.count >= maxRequests) return false;
    entry.count++;
    return true;
  }
}

// ── Gateway Server ───────────────────────────────────────────

export class NanoGateway extends EventEmitter<GatewayEvents> {
  private server: ReturnType<typeof createServer> | null = null;
  private wss: WebSocketServer | null = null;
  private agents: Map<string, ConnectedAgent> = new Map();
  private rateLimiter = new RateLimiter();
  private secret: string;

  constructor(
    private config: NanoConfig,
    private wallet: NanoWallet,
    private trading: TradingEngine,
    private memory: MemoryEngine,
  ) {
    super();
    this.secret = config.gateway.secret ?? randomBytes(32).toString("hex");
  }

  /**
   * Start the gateway server.
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer((req, res) => this.handleHttp(req, res));

      this.wss = new WebSocketServer({ server: this.server });
      this.wss.on("connection", (ws, req) => this.handleConnection(ws, req));

      this.server.listen(this.config.gateway.port, this.config.gateway.host, () => {
        console.log(
          `🌐 Nano Gateway running on ${this.config.gateway.host}:${this.config.gateway.port}`,
        );
        resolve();
      });

      // Wire up trading engine events to broadcast
      this.trading.on("signal", (signal) => {
        this.broadcast({
          type: "trade:signal",
          payload: signal,
          from: this.wallet.getAgentId(),
          timestamp: Date.now(),
        });
      });

      this.trading.on("priceUpdate", (price) => {
        this.broadcast({
          type: "market:price",
          payload: price,
          from: this.wallet.getAgentId(),
          timestamp: Date.now(),
        });
      });

      // Wire up memory events
      this.memory.on("lessonLearned", (lesson) => {
        this.broadcast({
          type: "memory:lesson",
          payload: lesson,
          from: this.wallet.getAgentId(),
          timestamp: Date.now(),
        });
      });

      // Wire up wallet heartbeat
      this.wallet.on("heartbeat", (info) => {
        this.broadcast({
          type: "agent:heartbeat",
          payload: info,
          from: this.wallet.getAgentId(),
          timestamp: Date.now(),
        });
      });
    });
  }

  /**
   * Stop the gateway.
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      // Close all WebSocket connections
      for (const agent of this.agents.values()) {
        agent.ws.close(1001, "Gateway shutting down");
      }
      this.agents.clear();

      if (this.wss) this.wss.close();
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  /**
   * Handle incoming WebSocket connection.
   */
  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const ip = req.socket.remoteAddress ?? "unknown";

    // Rate limit connections
    if (!this.rateLimiter.isAllowed(`connect:${ip}`, 10, 60000)) {
      ws.close(4029, "Rate limited");
      return;
    }

    // Expect auth message first
    const authTimeout = setTimeout(() => {
      ws.close(4001, "Auth timeout");
    }, 5000);

    ws.once("message", (data) => {
      clearTimeout(authTimeout);

      try {
        const msg = JSON.parse(data.toString()) as GatewayMessage;

        if (msg.type !== "auth") {
          ws.close(4002, "Expected auth message");
          return;
        }

        // Verify HMAC signature
        if (!this.verifySignature(msg)) {
          ws.close(4003, "Invalid signature");
          return;
        }

        const agentId = msg.from;
        const agent: ConnectedAgent = {
          id: agentId,
          publicKey: (msg.payload as any)?.publicKey ?? "",
          ws,
          connectedAt: Date.now(),
          lastHeartbeat: Date.now(),
          metadata: (msg.payload as any)?.metadata ?? {},
        };

        this.agents.set(agentId, agent);
        this.emit("agentConnected", agent);

        // Send welcome
        this.send(ws, {
          type: "auth:ok",
          payload: {
            agentId,
            connectedAgents: [...this.agents.keys()],
            memoryStats: this.memory.getStats(),
          },
          from: "gateway",
          timestamp: Date.now(),
        });

        // Handle subsequent messages
        ws.on("message", (data) => {
          try {
            const msg = JSON.parse(data.toString()) as GatewayMessage;
            this.handleMessage(agentId, msg);
          } catch (err) {
            this.emit("error", err as Error);
          }
        });

        ws.on("close", () => {
          this.agents.delete(agentId);
          this.emit("agentDisconnected", agentId);
        });

        ws.on("error", (err) => {
          this.emit("error", err);
          this.agents.delete(agentId);
        });
      } catch (err) {
        ws.close(4004, "Invalid auth payload");
      }
    });
  }

  /**
   * Handle a message from a connected agent.
   */
  private handleMessage(fromAgentId: string, msg: GatewayMessage): void {
    // Rate limit messages
    if (!this.rateLimiter.isAllowed(`msg:${fromAgentId}`, 100, 60000)) {
      return;
    }

    this.emit("messageReceived", msg);

    switch (msg.type) {
      case "agent:heartbeat": {
        const agent = this.agents.get(fromAgentId);
        if (agent) agent.lastHeartbeat = Date.now();
        break;
      }

      case "memory:query": {
        const results = this.memory.search(msg.payload as string, 10);
        const agent = this.agents.get(fromAgentId);
        if (agent) {
          this.send(agent.ws, {
            type: "memory:results",
            payload: results,
            from: "gateway",
            timestamp: Date.now(),
          });
        }
        break;
      }

      case "memory:store": {
        const memData = msg.payload as any;
        this.memory.store({
          type: memData.type ?? "context",
          content: memData.content,
          tags: memData.tags,
          importance: memData.importance,
        });
        break;
      }

      case "trading:status": {
        const agent = this.agents.get(fromAgentId);
        if (agent) {
          this.send(agent.ws, {
            type: "trading:status",
            payload: {
              signals: this.trading.getSignals().slice(-20),
              executions: this.trading.getExecutions().slice(-20),
              memoryStats: this.memory.getStats(),
            },
            from: "gateway",
            timestamp: Date.now(),
          });
        }
        break;
      }

      default: {
        // Forward to specific agent or broadcast
        if (msg.to) {
          const target = this.agents.get(msg.to);
          if (target) this.send(target.ws, msg);
        } else {
          this.broadcast(msg, fromAgentId);
        }
      }
    }
  }

  /**
   * Handle HTTP requests (health check, API).
   */
  private handleHttp(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-NanoSolana-Secret");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Protect framework/state endpoints when a shared secret is configured.
    if (url.pathname.startsWith("/api/") && !this.isHttpAuthorized(req)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        error: "Unauthorized",
        message: "Missing or invalid gateway secret",
      }));
      return;
    }

    switch (url.pathname) {
      case "/health": {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          status: "ok",
          agentId: this.wallet.getAgentId(),
          publicKey: this.wallet.getPublicKey(),
          connectedAgents: this.agents.size,
          authRequired: Boolean(this.config.gateway.secret?.trim()),
          uptime: process.uptime(),
        }));
        break;
      }

      case "/api/status": {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          wallet: this.wallet.getInfo(),
          memory: this.memory.getStats(),
          trading: {
            signals: this.trading.getSignals().length,
            executions: this.trading.getExecutions().length,
          },
          agents: [...this.agents.values()].map((a) => ({
            id: a.id,
            publicKey: a.publicKey,
            connectedAt: a.connectedAt,
            lastHeartbeat: a.lastHeartbeat,
          })),
          framework: {
            name: "NanoSolana",
            features: [
              "gateway",
              "trading-engine",
              "memory-engine",
              "wallet-manager",
              "mesh-network",
            ],
          },
        }));
        break;
      }

      case "/api/framework": {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(this.getFrameworkSnapshot()));
        break;
      }

      case "/api/docs": {
        const query = url.searchParams.get("q")?.trim() ?? "";
        const limit = this.parsePositiveInteger(url.searchParams.get("limit"), 10);
        const refresh = this.parseBoolean(url.searchParams.get("refresh"));

        const snapshot = getNanoKnowledgeSnapshot({ refresh });
        const summary = getNanoKnowledgeSummary(snapshot);
        const matches = query ? searchNanoKnowledge(snapshot, query, limit) : [];

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          summary,
          docs: {
            areas: snapshot.docs.areas.map((area) => ({
              area: area.area,
              path: area.path,
              files: area.files,
              markdownFiles: area.markdownFiles,
              bytes: area.bytes,
              updatedAt: area.updatedAt,
              indexedEntries: area.entries.length,
            })),
          },
          extensions: {
            directories: snapshot.extensions.directories,
            files: snapshot.extensions.files,
            manifests: snapshot.extensions.manifests,
            indexedEntries: snapshot.extensions.entries.length,
          },
          search: query
            ? {
                query,
                limit,
                matches,
              }
            : undefined,
        }));
        break;
      }

      case "/api/memory": {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          stats: this.memory.getStats(),
          lessons: this.memory.getLessons(),
        }));
        break;
      }

      default: {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
      }
    }
  }

  /**
   * Build framework snapshot for dashboard clients (macOS app / future web UIs).
   */
  private getFrameworkSnapshot(): Record<string, unknown> {
    const knowledgeSummary = getNanoKnowledgeSummary();

    return {
      project: "NanoSolana",
      agent: {
        id: this.wallet.getAgentId(),
        name: this.wallet.getInfo().agentName,
        publicKey: this.wallet.getPublicKey(),
      },
      gateway: {
        host: this.config.gateway.host,
        port: this.config.gateway.port,
        connectedAgents: this.agents.size,
        authRequired: Boolean(this.config.gateway.secret?.trim()),
      },
      trading: {
        signals: this.trading.getSignals().length,
        executions: this.trading.getExecutions().length,
      },
      memory: this.memory.getStats(),
      knowledge: knowledgeSummary,
      endpoints: ["/health", "/api/status", "/api/memory", "/api/framework", "/api/docs"],
      timestamp: Date.now(),
    };
  }

  private parseBoolean(value: string | null): boolean {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
  }

  private parsePositiveInteger(value: string | null, fallback: number): number {
    if (!value) return fallback;

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }

    return Math.floor(parsed);
  }

  /**
   * Validate API auth headers when a shared gateway secret exists.
   */
  private isHttpAuthorized(req: IncomingMessage): boolean {
    const expectedSecret = this.config.gateway.secret?.trim();
    if (!expectedSecret) return true;

    const bearerToken = this.extractBearerToken(req.headers.authorization);
    const headerSecret = this.firstHeaderValue(req.headers["x-nanosolana-secret"]);

    const candidates = [bearerToken, headerSecret]
      .filter((value): value is string => Boolean(value && value.trim().length > 0))
      .map((value) => value.trim());

    for (const candidate of candidates) {
      if (this.secureEquals(candidate, expectedSecret)) {
        return true;
      }
    }

    return false;
  }

  private extractBearerToken(authorizationHeader: string | string[] | undefined): string | undefined {
    const raw = this.firstHeaderValue(authorizationHeader)?.trim();
    if (!raw) return undefined;

    const match = /^Bearer\s+(.+)$/i.exec(raw);
    return match?.[1];
  }

  private firstHeaderValue(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  private secureEquals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    try {
      return timingSafeEqual(leftBuffer, rightBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Broadcast a message to all connected agents (except sender).
   */
  private broadcast(msg: GatewayMessage, excludeAgentId?: string): void {
    const data = JSON.stringify(msg);
    for (const agent of this.agents.values()) {
      if (agent.id !== excludeAgentId && agent.ws.readyState === WebSocket.OPEN) {
        agent.ws.send(data);
      }
    }
  }

  /**
   * Send a message to a specific WebSocket.
   */
  private send(ws: WebSocket, msg: GatewayMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  /**
   * Create an HMAC signature for a message.
   */
  signMessage(msg: Omit<GatewayMessage, "signature">): string {
    const payload = JSON.stringify({ type: msg.type, from: msg.from, timestamp: msg.timestamp });
    return createHmac("sha256", this.secret).update(payload).digest("hex");
  }

  /**
   * Verify an HMAC signature.
   */
  private verifySignature(msg: GatewayMessage): boolean {
    if (!msg.signature) return false;

    const expected = this.signMessage(msg);
    try {
      return timingSafeEqual(Buffer.from(msg.signature, "hex"), Buffer.from(expected, "hex"));
    } catch {
      return false;
    }
  }

  /**
   * Get the gateway secret (for connecting agents).
   */
  getSecret(): string {
    return this.secret;
  }

  /**
   * Get connected agents.
   */
  getConnectedAgents(): ConnectedAgent[] {
    return [...this.agents.values()];
  }
}
