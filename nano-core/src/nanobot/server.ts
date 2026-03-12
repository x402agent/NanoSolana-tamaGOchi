/**
 * NanoBot — Interactive Local UI Server
 *
 * Serves a local web UI on localhost that provides:
 *   - Animated NanoBot lobster character
 *   - Real-time system status (wallet, OODA, pet)
 *   - Chat interface for interacting with the agent
 *   - One-click commands for wallet, health, registry
 *
 * TypeScript port of pkg/nanobot/server.go
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir, platform, arch } from "node:os";
import { exec } from "node:child_process";

// ── Types ────────────────────────────────────────────────────────────

interface NanoBotConfig {
  port: number;
  binaryPath?: string;
}

interface StatusResponse {
  agent: string;
  version: string;
  platform: string;
  time: string;
  uptime: string;
  daemon: string;
  wallet: string;
  registry: string;
}

// ── NanoBot Server ───────────────────────────────────────────────────

export class NanoBotServer {
  private port: number;
  private binaryPath: string;

  constructor(config: NanoBotConfig) {
    this.port = config.port || 7777;
    this.binaryPath = config.binaryPath || "nanosolana";
  }

  async start(): Promise<void> {
    const server = createServer((req, res) => {
      this.handleRequest(req, res);
    });

    return new Promise((resolve, reject) => {
      server.listen(this.port, "127.0.0.1", () => {
        const url = `http://127.0.0.1:${this.port}`;
        console.log(`  🤖 NanoBot UI: ${url}`);

        // Open in browser
        setTimeout(() => openBrowser(url), 300);
        resolve();
      });

      server.on("error", reject);
    });
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = req.url || "/";
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (url === "/api/status") {
      this.handleStatus(res);
    } else if (url === "/api/chat" && req.method === "POST") {
      this.handleChat(req, res);
    } else if (url === "/api/run" && req.method === "POST") {
      this.handleRun(req, res);
    } else {
      this.serveUI(res);
    }
  }

  // ── /api/status ────────────────────────────────────────────

  private handleStatus(res: ServerResponse): void {
    const home = homedir();
    const nanoHome = join(home, ".nanosolana");

    const status: StatusResponse = {
      agent: "NanoSolana",
      version: "0.1.0",
      platform: `${platform()}/${arch()}`,
      time: new Date().toISOString(),
      uptime: "running",
      daemon: existsSync(join(nanoHome, "workspace", "HEARTBEAT.md")) ? "alive" : "stopped",
      wallet: existsSync(join(nanoHome, "wallet.pub")) ? "configured" : "not configured",
      registry: existsSync(join(nanoHome, "registry", "registration.json"))
        ? "registered"
        : "not registered",
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(status));
  }

  // ── /api/chat ──────────────────────────────────────────────

  private handleChat(req: IncomingMessage, res: ServerResponse): void {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { message } = JSON.parse(body);
        const reply = nanobotReply(String(message || "").trim().toLowerCase());
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ reply, mood: "happy" }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "bad request" }));
      }
    });
  }

  // ── /api/run ───────────────────────────────────────────────

  private handleRun(req: IncomingMessage, res: ServerResponse): void {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { command } = JSON.parse(body);
        const allowed = new Set([
          "status",
          "pet",
          "version",
        ]);

        const cmd = String(command || "").trim();
        if (!allowed.has(cmd)) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              output: `⚠️ Command '${cmd}' not available in UI mode. Use terminal.`,
              ok: false,
            }),
          );
          return;
        }

        exec(`${this.binaryPath} ${cmd}`, { timeout: 10000 }, (err, stdout, stderr) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              output: stdout || stderr || "",
              ok: !err,
            }),
          );
        });
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "bad request" }));
      }
    });
  }

  // ── Serve UI HTML ──────────────────────────────────────────

  private serveUI(res: ServerResponse): void {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(NANOBOT_HTML);
  }
}

// ── NanoBot Reply Engine ─────────────────────────────────────────────

function nanobotReply(msg: string): string {
  if (/hello|hi|hey/.test(msg)) {
    return "Hey there! 🦞 I'm NanoBot, your Solana trading companion. What can I help you with?";
  }
  if (/trade|swap/.test(msg)) {
    return "Ready to trade! 📈 Use `nanosolana go` for one-shot launch, or `nanosolana dvd` for fun. I use Jupiter DEX for swaps with real-time Helius data.";
  }
  if (/wallet|balance/.test(msg)) {
    return "💰 Your agent wallet was generated at birth. Run `nanosolana status` to check balance. Private key is encrypted in AES-256-GCM vault.";
  }
  if (/health|status/.test(msg)) {
    return "🟢 Run `nanosolana status` to check everything — wallet, pet, OODA loop, gateway, and registry.";
  }
  if (/pet|tamagochi|mood/.test(msg)) {
    return "🦞 I'm your TamaGOchi! My mood and evolution are driven by trading performance. Good trades = happy NanoBot. Check with `nanosolana pet`.";
  }
  if (/register|nft|identity/.test(msg)) {
    return "🆔 Your Birth Certificate NFT was minted on devnet at birth. Run `nanosolana status` to see your on-chain identity.";
  }
  if (/help|what can/.test(msg)) {
    return "I can help with:\n• 📊 Wallet balance & health\n• 📈 Trading with OODA loop\n• 🦞 TamaGOchi pet status\n• 🆔 On-chain identity\n• 📀 DVD screensaver (`nanosolana dvd`)\n\nJust ask!";
  }
  if (/ooda|loop/.test(msg)) {
    return "🔄 The OODA loop: Observe (Helius+Birdeye) → Orient (AI reasoning) → Decide (RSI+EMA+ATR) → Act (Jupiter swaps). Run with `nanosolana go`.";
  }
  if (/install|setup/.test(msg)) {
    return "🚀 One-shot:\n```\ncurl -fsSL https://nanosolana.com/install.sh | bash\nnanosolana go\n```\nTwo commands. That's it.";
  }
  return "🦞 I'm focused on Solana trading and on-chain ops. Try asking about trading, wallet, health, or my TamaGOchi status!";
}

// ── Open Browser ─────────────────────────────────────────────────────

function openBrowser(url: string): void {
  const cmd =
    platform() === "darwin"
      ? `open "${url}"`
      : platform() === "win32"
        ? `start "${url}"`
        : `xdg-open "${url}"`;

  exec(cmd, () => {});
}

// ── Embedded NanoBot UI HTML ─────────────────────────────────────────

const NANOBOT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NanoBot — Solana Trading Companion</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #060810; --surface: #0a0e1a; --card: rgba(15, 20, 40, 0.85);
      --green: #14F195; --purple: #9945FF; --orange: #FF6B35;
      --text: #e8ecf4; --muted: #8892b0; --border: rgba(20, 241, 149, 0.15);
      --mono: 'JetBrains Mono', monospace; --body: 'Space Grotesk', sans-serif;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--body); background: var(--bg); color: var(--text); min-height: 100vh; }
    .container { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; }
    h1 { font-size: 2rem; background: linear-gradient(135deg, var(--green), var(--purple));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      margin-bottom: 0.5rem; text-align: center; }
    .subtitle { text-align: center; color: var(--muted); margin-bottom: 2rem; font-size: 0.9rem; }

    .lobster { text-align: center; font-size: 4rem; margin-bottom: 1rem; animation: bounce 2s ease-in-out infinite; }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

    .actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 2rem; }
    .btn {
      background: var(--card); border: 1px solid var(--border); border-radius: 10px;
      padding: 0.75rem; text-align: center; cursor: pointer; transition: all 0.2s;
      color: var(--text); font-size: 0.85rem; font-family: var(--mono);
    }
    .btn:hover { border-color: var(--green); transform: translateY(-2px); }

    .output {
      background: #0d1117; border: 1px solid rgba(20, 241, 149, 0.2); border-radius: 12px;
      padding: 1rem; font-family: var(--mono); font-size: 0.8rem; color: var(--green);
      min-height: 120px; max-height: 300px; overflow-y: auto; white-space: pre-wrap;
      margin-bottom: 2rem;
    }

    .chat-box { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
    .chat-input {
      flex: 1; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid var(--border);
      background: var(--card); color: var(--text); font-family: var(--body); font-size: 0.9rem;
      outline: none;
    }
    .chat-input:focus { border-color: var(--green); }
    .chat-send {
      background: linear-gradient(135deg, var(--green), var(--purple));
      color: var(--bg); border: none; padding: 0.75rem 1.5rem; border-radius: 10px;
      font-weight: 600; cursor: pointer; transition: transform 0.15s;
    }
    .chat-send:hover { transform: translateY(-1px); }

    .status-bar {
      text-align: center; padding: 1rem; font-family: var(--mono);
      font-size: 0.75rem; color: var(--muted); border-top: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="lobster" id="lobster">🦞</div>
    <h1>NanoBot</h1>
    <p class="subtitle">Your Solana Trading Companion</p>

    <div class="actions">
      <div class="btn" onclick="runCmd('status')">📊 Status</div>
      <div class="btn" onclick="runCmd('pet')">🦞 Pet</div>
      <div class="btn" onclick="runCmd('version')">📋 Version</div>
      <div class="btn" onclick="fetchStatus()">🟢 Health</div>
    </div>

    <div class="output" id="output">🦞 Welcome to NanoBot! Click a button or chat below.</div>

    <div class="chat-box">
      <input class="chat-input" id="chat-input" placeholder="Ask NanoBot anything..." />
      <button class="chat-send" onclick="sendChat()">Send</button>
    </div>

    <div class="status-bar">
      NanoSolana Labs · 🦞 TamaGObot · <span id="clock"></span>
    </div>
  </div>

  <script>
    const output = document.getElementById('output');
    const chatInput = document.getElementById('chat-input');

    chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });

    // Clock
    setInterval(() => {
      document.getElementById('clock').textContent = new Date().toLocaleTimeString();
    }, 1000);

    async function runCmd(cmd) {
      output.textContent = '⏳ Running ' + cmd + '...';
      try {
        const res = await fetch('/api/run', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd })
        });
        const data = await res.json();
        output.textContent = data.output || (data.ok ? '✓ Done' : '✗ Failed');
      } catch (e) { output.textContent = '✗ ' + e.message; }
    }

    async function fetchStatus() {
      output.textContent = '⏳ Checking...';
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        output.textContent = JSON.stringify(data, null, 2);
      } catch (e) { output.textContent = '✗ ' + e.message; }
    }

    async function sendChat() {
      const msg = chatInput.value.trim();
      if (!msg) return;
      chatInput.value = '';
      output.textContent = '🦞 Thinking...';
      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg })
        });
        const data = await res.json();
        output.textContent = '🦞 ' + data.reply;
      } catch (e) { output.textContent = '✗ ' + e.message; }
    }

    fetchStatus();
  </script>
</body>
</html>`;
