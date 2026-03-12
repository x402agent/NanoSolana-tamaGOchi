#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localInstaller = resolve(__dirname, '..', '..', '..', 'install.sh');
const defaultRef = 'main';
const defaultRepo = 'x402agent/nano-solana-go';

const args = process.argv.slice(2);
const ref = process.env.MAWDBOT_REF || extractRef(args) || defaultRef;

function extractRef(argv) {
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--ref' && i + 1 < argv.length) {
            return argv[i + 1];
        }
        if (a.startsWith('--ref=')) {
            return a.slice('--ref='.length);
        }
    }
    return '';
}

function runInstaller(installerPath) {
    const run = spawnSync('bash', [installerPath, ...args], {
        stdio: 'inherit',
        env: process.env,
    });

    if (run.error) {
        console.error(run.error.message);
        process.exit(1);
    }

    process.exit(typeof run.status === 'number' ? run.status : 1);
}

function downloadInstaller(url, outFile) {
    return new Promise((resolvePromise, reject) => {
        https
            .get(url, (res) => {
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    downloadInstaller(res.headers.location, outFile).then(resolvePromise).catch(reject);
                    return;
                }
                if (res.statusCode !== 200) {
                    reject(new Error(`failed to download installer: HTTP ${res.statusCode}`));
                    return;
                }

                let body = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    writeFileSync(outFile, body, { mode: 0o755 });
                    resolvePromise();
                });
            })
            .on('error', reject);
    });
}

if (existsSync(localInstaller)) {
    runInstaller(localInstaller);
}

const rawUrl = `https://raw.githubusercontent.com/${defaultRepo}/${encodeURIComponent(ref)}/install.sh`;
const tempDir = mkdtempSync(join(tmpdir(), 'mawdbot-install-'));
const tempInstaller = join(tempDir, 'install.sh');

downloadInstaller(rawUrl, tempInstaller)
    .then(() => {
        runInstaller(tempInstaller);
    })
    .catch((err) => {
        rmSync(tempDir, { recursive: true, force: true });
        console.error(err.message);
        process.exit(1);
    });
