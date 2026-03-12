/**
 * NanoSolana Terminal Animations
 *
 * Uses `unicode-animations` for braille spinners + custom lobster frames,
 * DVD bouncing logo, and a full startup animation pipeline.
 */

import chalk from "chalk";
import spinners from "unicode-animations";

// ── Spinner Helper (using unicode-animations) ────────────────

export function createSpinner(msg: string, name: keyof typeof spinners = "braille") {
  const { frames, interval } = spinners[name];
  let i = 0;
  let text = msg;
  const timer = setInterval(() => {
    process.stdout.write(
      `\r\x1B[2K  ${chalk.cyan(frames[i++ % frames.length])} ${chalk.white(text)}`,
    );
  }, interval);

  return {
    update(newMsg: string) {
      text = newMsg;
    },
    stop(doneMsg: string) {
      clearInterval(timer);
      process.stdout.write(`\r\x1B[2K  ${chalk.green("✓")} ${chalk.white(doneMsg)}\n`);
    },
    fail(errMsg: string) {
      clearInterval(timer);
      process.stdout.write(`\r\x1B[2K  ${chalk.red("✗")} ${chalk.red(errMsg)}\n`);
    },
  };
}

export async function runWithSpinner<T>(
  label: string,
  fn: () => Promise<T>,
  name: keyof typeof spinners = "braille",
): Promise<T> {
  const s = createSpinner(label, name);
  try {
    const result = await fn();
    s.stop(label);
    return result;
  } catch (err) {
    s.fail(`${label} — ${(err as Error).message}`);
    throw err;
  }
}

// ── Unicode Lobster Frames ──────────────────────────────────

const LOBSTER_FRAMES = [
  [
    "      ╱╲    ╱╲      ",
    "     ╱  ╲──╱  ╲     ",
    "    │  ◉    ◉  │    ",
    "    │    ╲╱    │    ",
    "     ╲  │││  ╱     ",
    "      ╲═╧╧═╱      ",
    "     ╱╱╱ ╲╲╲     ",
    "    ╱╱╱   ╲╲╲    ",
  ],
  [
    "     ╱╲      ╱╲     ",
    "    ╱  ╲────╱  ╲    ",
    "    │  ●    ●  │    ",
    "    │    ──    │    ",
    "     ╲  │││  ╱     ",
    "      ╲═╧╧═╱      ",
    "    ╱╱╱╱ ╲╲╲╲    ",
    "   ╱╱╱╱   ╲╲╲╲   ",
  ],
  [
    "      ╱╲    ╱╲      ",
    "     ╱  ╲──╱  ╲     ",
    "    │  ◉    ◉  │    ",
    "    │    ╱╲    │    ",
    "     ╲  │││  ╱     ",
    "      ╲═╧╧═╱      ",
    "      ╱╱╲╲       ",
    "     ╱╱  ╲╲      ",
  ],
  [
    "       ╱╲  ╱╲       ",
    "      ╱  ╲╱  ╲      ",
    "     │  ◉  ◉  │     ",
    "     │   ╲╱   │     ",
    "      ╲ │││ ╱      ",
    "       ╲╧╧╧╱       ",
    "     ╱╱╱ ╲╲╲     ",
    "    ╱╱╱   ╲╲╲    ",
  ],
];

const LOBSTER_BIG = `
         ╱▔╲       ╱▔╲
        ╱╱  ╲─────╱  ╲╲
       ││ ◉ │     │ ◉ ││
       ││   ╰─┬─┬─╯   ││
        ╲╲   ╱│█│╲   ╱╱
         ╲╲ ╱█│█│█╲ ╱╱
          ╰╱██│█│██╲╯
          ╱╱╱ │█│ ╲╲╲
         ╱╱╱  │█│  ╲╲╲
        ╱╱   ╱███╲   ╲╲
`;

// ── Animated Lobster (frame-based) ──────────────────────────

export function animateLobster(durationMs = 2400): Promise<void> {
  return new Promise((resolve) => {
    const frameCount = LOBSTER_FRAMES.length;
    const frameH = LOBSTER_FRAMES[0].length + 1;
    let frame = 0;

    // Reserve space
    process.stdout.write("\n".repeat(frameH));

    const interval = setInterval(() => {
      // Move cursor up
      process.stdout.write(`\x1B[${frameH}A`);
      // Draw frame
      const f = LOBSTER_FRAMES[frame % frameCount];
      const color = frame % 2 === 0 ? chalk.green : chalk.hex("#14F195");
      for (const line of f) {
        process.stdout.write(`\x1B[2K  ${color(line)}\n`);
      }
      process.stdout.write(`\x1B[2K  ${chalk.cyan("  🦞 NanoSolana")}\n`);
      frame++;
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, durationMs);
  });
}

// ── DVD Bouncing Logo ──────────────────────────────────────

const DVD_LOGO = [
  "╔═════════════════════════╗",
  "║    🦞 NanoSolana 🦞     ║",
  "║   ══════════════════    ║",
  "║  Solana Trading Agent   ║",
  "║   nanosolana.com        ║",
  "╚═════════════════════════╝",
];

const DVD_COLORS = [
  chalk.hex("#14F195"),
  chalk.hex("#9945FF"),
  chalk.cyan,
  chalk.magenta,
  chalk.yellow,
  chalk.green,
  chalk.blue,
  chalk.red,
];

export function startDvdScreensaver(): { stop: () => void } {
  const logoWidth = 27;
  const logoHeight = DVD_LOGO.length;
  let cols = process.stdout.columns || 80;
  let rows = process.stdout.rows || 24;

  let x = Math.floor(Math.random() * Math.max(1, cols - logoWidth));
  let y = Math.floor(Math.random() * Math.max(1, rows - logoHeight - 2));
  let dx = 1;
  let dy = 1;
  let colorIdx = 0;
  let hits = 0;

  // Hide cursor + clear
  process.stdout.write("\x1B[?25l\x1B[2J");

  const interval = setInterval(() => {
    cols = process.stdout.columns || 80;
    rows = process.stdout.rows || 24;

    // Clear previous
    for (let i = 0; i < logoHeight; i++) {
      process.stdout.write(`\x1B[${y + i + 1};1H\x1B[2K`);
    }

    // Move
    x += dx;
    y += dy;

    // Bounce
    if (x <= 0 || x + logoWidth >= cols) {
      dx *= -1;
      colorIdx = (colorIdx + 1) % DVD_COLORS.length;
      hits++;
    }
    if (y <= 0 || y + logoHeight >= rows - 1) {
      dy *= -1;
      colorIdx = (colorIdx + 1) % DVD_COLORS.length;
      hits++;
    }

    x = Math.max(0, Math.min(x, cols - logoWidth));
    y = Math.max(0, Math.min(y, rows - logoHeight - 1));

    // Draw
    const color = DVD_COLORS[colorIdx];
    for (let i = 0; i < logoHeight; i++) {
      process.stdout.write(`\x1B[${y + i + 1};${x + 1}H`);
      process.stdout.write(color(DVD_LOGO[i]));
    }

    // Status bar
    process.stdout.write(`\x1B[${rows};1H`);
    process.stdout.write(
      chalk.bgHex("#0a0a1a").hex("#14F195")(
        ` 🦞 NanoSolana DVD | Bounces: ${hits} | ${new Date().toLocaleTimeString()} | Ctrl+C to exit `.padEnd(
          cols,
        ),
      ),
    );
  }, 60);

  const stop = () => {
    clearInterval(interval);
    process.stdout.write("\x1B[?25h\x1B[2J\x1B[H");
  };

  return { stop };
}

// ── Full Startup Animation Pipeline ─────────────────────────

interface StartupStep {
  label: string;
  spinner: keyof typeof spinners;
  durationMs: number;
}

const STARTUP_STEPS: StartupStep[] = [
  { label: "Generating Ed25519 keypair...", spinner: "helix", durationMs: 400 },
  { label: "Deriving Solana wallet address...", spinner: "dna", durationMs: 300 },
  { label: "Encrypting private key (AES-256-GCM)...", spinner: "cascade", durationMs: 500 },
  { label: "Requesting devnet airdrop...", spinner: "orbit", durationMs: 700 },
  { label: "Minting Birth Certificate NFT (Metaplex)...", spinner: "scan", durationMs: 600 },
  { label: "Initializing ClawVault memory engine...", spinner: "rain", durationMs: 400 },
  { label: "Hatching TamaGOchi pet 🥚...", spinner: "breathe", durationMs: 500 },
  { label: "Calibrating RSI + EMA + ATR strategy...", spinner: "columns", durationMs: 400 },
  { label: "Starting OODA trading loop...", spinner: "snake", durationMs: 300 },
  { label: "Connecting gateway (HMAC-SHA256)...", spinner: "braille", durationMs: 400 },
];

export async function playStartupAnimation(): Promise<void> {
  for (const step of STARTUP_STEPS) {
    await runWithSpinner(step.label, () => sleep(step.durationMs), step.spinner);
  }
}

// ── Lobster Walk ────────────────────────────────────────────

export async function lobsterWalk(message: string): Promise<void> {
  const cols = process.stdout.columns || 80;
  const walkLen = Math.min(cols - 20, 35);
  const { frames, interval } = spinners.braille;
  let fi = 0;

  for (let i = 0; i < walkLen; i++) {
    const pad = " ".repeat(i);
    const dots = chalk.hex("#14F195")("·".repeat(Math.min(i, 6)));
    const spin = chalk.cyan(frames[fi++ % frames.length]);
    process.stdout.write(`\r\x1B[2K  ${pad}${dots} ${spin} 🦞`);
    await sleep(interval);
  }
  process.stdout.write(`\r\x1B[2K`);
  console.log(chalk.hex("#14F195")(`  🦞 ${message}`));
}

// ── Print Static Lobster ────────────────────────────────────

export function printLobster(): void {
  const lines = LOBSTER_BIG.split("\n");
  for (const line of lines) {
    console.log(chalk.green(`  ${line}`));
  }
}

// ── Status Bar ──────────────────────────────────────────────

export function updateStatusBar(info: {
  balance: number;
  mood: string;
  stage: string;
  petName: string;
  signals: number;
  uptime: number;
}): void {
  const cols = process.stdout.columns || 80;
  const uptimeStr = formatUptime(info.uptime);
  const bar =
    ` 🦞 ${info.petName} ${info.stage}${info.mood} │ ` +
    `${info.balance.toFixed(4)} SOL │ ` +
    `${info.signals} signals │ ` +
    `⏱ ${uptimeStr}`;

  process.stdout.write("\x1B7");
  const rows = process.stdout.rows || 24;
  process.stdout.write(`\x1B[${rows};1H`);
  process.stdout.write(chalk.bgHex("#0a0a1a").hex("#14F195")(bar.padEnd(cols)));
  process.stdout.write("\x1B8");
}

// ── Utility ─────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h${m % 60}m`;
  if (m > 0) return `${m}m${s % 60}s`;
  return `${s}s`;
}
