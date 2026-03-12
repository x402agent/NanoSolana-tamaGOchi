# `@nanosolana/nanohub`

NanoHub CLI — install, update, search, and publish NanoSolana skills as folders.

## Install

```bash
# One-off via npx
npx @nanosolana/nanohub --help

# Optional global install
npm i -g @nanosolana/nanohub
```

Command aliases provided by the package:

- `nanohub` (primary)
- `nanosolana-skill`
- `clawhub` (legacy)
- `clawdhub` (legacy)

## Auth (publish)

```bash
nanohub login
# or
nanohub auth login

# Headless / token paste
nanohub login --token <token>
```

Notes:

- Browser login opens `${NANOHUB_SITE:-https://hub.nanosolana.com}/cli/auth` and completes via a loopback callback.
- Token stored in `~/Library/Application Support/clawhub/config.json` on macOS.
- Config path override envs: `NANOHUB_CONFIG_PATH` (preferred), `CLAWHUB_CONFIG_PATH`, `CLAWDHUB_CONFIG_PATH`.

## Publish a skill

Skill folder requirements:

- `SKILL.md` (or `skills.md`)
- text files only
- semver version (for example `1.0.0`)

```bash
npx @nanosolana/nanohub publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --tags latest,solana \
  --changelog "Initial release"
```

## Sync (upload local skills)

```bash
# Scan + upload from discovered skill roots
nanohub sync

# Non-interactive upload of all candidates
nanohub sync --all --bump patch --tags latest
```

## Defaults

- Site: `https://hub.nanosolana.com` (override via `--site`, `NANOHUB_SITE`, `CLAWHUB_SITE`, `CLAWDHUB_SITE`)
- Registry: discovered from site `/.well-known/*.json`, fallback `https://hub.nanosolana.com` (override via `--registry`, `NANOHUB_REGISTRY`, `CLAWHUB_REGISTRY`, `CLAWDHUB_REGISTRY`)
- Workdir: current directory (falls back to Clawdbot workspace when configured; override via `--workdir`, `NANOHUB_WORKDIR`, `CLAWHUB_WORKDIR`, `CLAWDHUB_WORKDIR`)
- Install dir: `./skills` under workdir (override via `--dir`)
