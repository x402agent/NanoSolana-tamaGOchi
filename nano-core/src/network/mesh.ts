/**
 * Nano Solana — Nano Network (Tailscale + tmux mesh)
 *
 * Provides the `nano` one-shot command for communicating with
 * nano bots everywhere using:
 *   - Tailscale mesh networking for bot discovery
 *   - tmux session management for persistent bots
 *   - Gateway relay for cross-network messaging
 *
 * Architecture:
 *   Each nano bot runs in a tmux session on a Tailscale node.
 *   The `nano` command discovers and communicates with bots
 *   across the mesh.
 */

import { execSync, spawn, type ChildProcess } from "node:child_process";
import { EventEmitter } from "eventemitter3";
import { WebSocket } from "ws";
import { createHmac } from "node:crypto";

// ── Types ────────────────────────────────────────────────────

export interface NanoNode {
  hostname: string;
  ip: string;
  online: boolean;
  os: string;
  tailscaleId: string;
  lastSeen: number;
  gatewayPort?: number;
  agentId?: string;
  publicKey?: string;
}

export interface TmuxSession {
  name: string;
  windows: number;
  created: string;
  attached: boolean;
  pid: number;
}

export interface NanoNetworkEvents {
  nodeDiscovered: (node: NanoNode) => void;
  nodeOffline: (hostname: string) => void;
  messageRelayed: (from: string, to: string) => void;
  error: (err: Error) => void;
}

// ── Tailscale Discovery ────────────────────────────────────────

export class TailscaleDiscovery {
  /**
   * Check if Tailscale is available on the system.
   */
  static isAvailable(): boolean {
    try {
      execSync("tailscale status --json 2>/dev/null", { encoding: "utf8" });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Discover all Tailscale peers.
   */
  static discoverNodes(): NanoNode[] {
    try {
      const output = execSync("tailscale status --json", { encoding: "utf8" });
      const status = JSON.parse(output);
      const peers = status.Peer ?? {};
      const nodes: NanoNode[] = [];

      for (const [id, peer] of Object.entries(peers) as [string, any][]) {
        nodes.push({
          hostname: peer.HostName ?? "unknown",
          ip: peer.TailscaleIPs?.[0] ?? "",
          online: peer.Online ?? false,
          os: peer.OS ?? "unknown",
          tailscaleId: id,
          lastSeen: peer.LastSeen ? new Date(peer.LastSeen).getTime() : 0,
          gatewayPort: 18790, // Default nano gateway port
        });
      }

      // Include self
      if (status.Self) {
        nodes.unshift({
          hostname: status.Self.HostName ?? "self",
          ip: status.Self.TailscaleIPs?.[0] ?? "127.0.0.1",
          online: true,
          os: status.Self.OS ?? process.platform,
          tailscaleId: "self",
          lastSeen: Date.now(),
          gatewayPort: 18790,
        });
      }

      return nodes;
    } catch {
      return [];
    }
  }

  /**
   * Get the Tailnet domain.
   */
  static getDomain(): string {
    try {
      const output = execSync("tailscale status --json", { encoding: "utf8" });
      const status = JSON.parse(output);
      return status.MagicDNSSuffix ?? "";
    } catch {
      return "";
    }
  }
}

// ── tmux Session Manager ────────────────────────────────────

export class TmuxManager {
  /**
   * Check if tmux is available.
   */
  static isAvailable(): boolean {
    try {
      execSync("which tmux", { encoding: "utf8" });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List all tmux sessions.
   */
  static listSessions(): TmuxSession[] {
    try {
      const output = execSync(
        'tmux list-sessions -F "#{session_name}|#{session_windows}|#{session_created}|#{session_attached}|#{pid}" 2>/dev/null',
        { encoding: "utf8" },
      );

      return output
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [name, windows, created, attached, pid] = line.split("|");
          return {
            name: name ?? "",
            windows: Number(windows ?? 1),
            created: created ?? "",
            attached: attached === "1",
            pid: Number(pid ?? 0),
          };
        });
    } catch {
      return [];
    }
  }

  /**
   * List only nano bot sessions.
   */
  static listNanoSessions(): TmuxSession[] {
    return TmuxManager.listSessions().filter((s) => s.name.startsWith("nano-"));
  }

  /**
   * Create a new nano bot tmux session.
   */
  static createSession(name: string, command?: string): boolean {
    const sessionName = name.startsWith("nano-") ? name : `nano-${name}`;
    const cmd = command ?? "nano gateway";

    try {
      execSync(`tmux new-session -d -s "${sessionName}" "${cmd}"`, {
        encoding: "utf8",
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Send a command to a tmux session.
   */
  static sendToSession(sessionName: string, command: string): boolean {
    try {
      execSync(`tmux send-keys -t "${sessionName}" "${command}" Enter`, {
        encoding: "utf8",
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Capture output from a tmux session.
   */
  static captureOutput(sessionName: string, lines = 50): string {
    try {
      return execSync(
        `tmux capture-pane -t "${sessionName}" -p -S -${lines}`,
        { encoding: "utf8" },
      );
    } catch {
      return "";
    }
  }

  /**
   * Kill a tmux session.
   */
  static killSession(sessionName: string): boolean {
    try {
      execSync(`tmux kill-session -t "${sessionName}"`, { encoding: "utf8" });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Attach to a tmux session.
   */
  static attachSession(sessionName: string): void {
    const child = spawn("tmux", ["attach-session", "-t", sessionName], {
      stdio: "inherit",
    });
    child.on("exit", () => process.exit(0));
  }
}

// ── Nano Network Client ────────────────────────────────────

export class NanoNetworkClient extends EventEmitter<NanoNetworkEvents> {
  private connections: Map<string, WebSocket> = new Map();

  constructor(private gatewaySecret: string) {
    super();
  }

  /**
   * Connect to a nano bot's gateway.
   */
  async connectToNode(node: NanoNode, agentId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const url = `ws://${node.ip}:${node.gatewayPort ?? 18790}`;

      try {
        const ws = new WebSocket(url);

        ws.on("open", () => {
          // Send auth message
          const authMsg = {
            type: "auth",
            payload: { publicKey: "", metadata: { hostname: process.env.HOSTNAME } },
            from: agentId,
            timestamp: Date.now(),
            signature: "",
          };

          // Sign it
          const sigPayload = JSON.stringify({
            type: authMsg.type,
            from: authMsg.from,
            timestamp: authMsg.timestamp,
          });
          authMsg.signature = createHmac("sha256", this.gatewaySecret)
            .update(sigPayload)
            .digest("hex");

          ws.send(JSON.stringify(authMsg));
        });

        ws.on("message", (data) => {
          try {
            const msg = JSON.parse(data.toString());
            if (msg.type === "auth:ok") {
              this.connections.set(node.hostname, ws);
              this.emit("nodeDiscovered", {
                ...node,
                agentId: msg.payload?.agentId,
              });
              resolve(true);
            }
          } catch {
            // ignore
          }
        });

        ws.on("error", () => resolve(false));
        ws.on("close", () => {
          this.connections.delete(node.hostname);
          this.emit("nodeOffline", node.hostname);
        });

        // Timeout after 5s
        setTimeout(() => {
          if (!this.connections.has(node.hostname)) {
            ws.close();
            resolve(false);
          }
        }, 5000);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Send a message to a connected node.
   */
  sendToNode(hostname: string, message: string, agentId: string): boolean {
    const ws = this.connections.get(hostname);
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;

    ws.send(JSON.stringify({
      type: "nano:message",
      payload: { content: message },
      from: agentId,
      timestamp: Date.now(),
    }));

    this.emit("messageRelayed", agentId, hostname);
    return true;
  }

  /**
   * Broadcast to all connected nodes.
   */
  broadcastToAll(message: string, agentId: string): number {
    let sent = 0;
    for (const [hostname] of this.connections) {
      if (this.sendToNode(hostname, message, agentId)) sent++;
    }
    return sent;
  }

  /**
   * Disconnect from all nodes.
   */
  disconnectAll(): void {
    for (const ws of this.connections.values()) {
      ws.close(1000, "Client disconnecting");
    }
    this.connections.clear();
  }

  /**
   * Get connected node count.
   */
  getConnectionCount(): number {
    return this.connections.size;
  }
}
