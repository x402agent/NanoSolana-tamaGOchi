#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
// NanoSolana npm Installer Wrapper
//
// Usage:
//   npx @nanosolana/cli                 # basic install
//   npx @nanosolana/cli --with-web      # with web console
//   npx -y ./npm/mawdbot-installer      # local dev
//
// This downloads and runs install.sh, which handles:
//   1. Clone or update the repo
//   2. Build the nanosolana binary
//   3. Create ~/.nanosolana/ workspace
//   4. Generate agentic wallet
//   5. Optionally build the web console
// ═══════════════════════════════════════════════════════════════════

import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { argv } from 'node:process';

const INSTALL_URL = 'https://raw.githubusercontent.com/x402agent/mawdbot-go/main/install.sh';
const GREEN = '\x1b[38;2;20;241;149m';
const DIM = '\x1b[38;2;85;102;128m';
const RESET = '\x1b[0m';

console.log(`\n${GREEN}  🦞 NanoSolana Installer${RESET}`);
console.log(`${DIM}  On-Chain Trading Intelligence · Pure Go · One Binary${RESET}\n`);

// Forward args
const extraArgs = argv.slice(2).join(' ');

// Check for curl
try {
  execSync('which curl', { stdio: 'ignore' });
} catch {
  console.error('  ✖ curl is required but not found. Install it first.');
  process.exit(1);
}

// Check for Go
try {
  const goVersion = execSync('go version', { encoding: 'utf-8' }).trim();
  console.log(`  ${DIM}${goVersion}${RESET}`);
} catch {
  console.error('  ✖ Go is required but not found. Install from https://go.dev/dl/');
  process.exit(1);
}

// Download and run install.sh
console.log(`${DIM}  Downloading install script...${RESET}\n`);

try {
  const scriptPath = join(mkdtempSync(join(tmpdir(), 'nanosolana-')), 'install.sh');

  execSync(`curl -fsSL "${INSTALL_URL}" -o "${scriptPath}"`, { stdio: 'inherit' });
  execSync(`chmod +x "${scriptPath}"`, { stdio: 'ignore' });

  const child = spawn('bash', [scriptPath, ...argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env },
  });

  child.on('exit', (code) => {
    try { unlinkSync(scriptPath); } catch {}
    process.exit(code ?? 0);
  });

  child.on('error', (err) => {
    console.error(`  ✖ Failed to run installer: ${err.message}`);
    process.exit(1);
  });

} catch (e) {
  console.error(`  ✖ Install failed: ${e.message}`);
  process.exit(1);
}
