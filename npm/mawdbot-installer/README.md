# @nanosolana/cli

One-shot installer for the NanoSolana autonomous Solana trading agent.

## Install

```bash
# One command
npx @nanosolana/cli

# With web console
npx @nanosolana/cli --with-web
```

## What it does

1. ✅ Clones the NanoSolana repo
2. ✅ Builds the `nanosolana` 10MB binary (Go)
3. ✅ Creates `~/.nanosolana/` workspace + wallet
4. ✅ Optionally builds the web console

## After install

```bash
cd ~/nanosolana

# Check mainnet health
./build/nanosolana solana health

# Register agent on-chain (devnet NFT)
./build/nanosolana solana register

# Start paper trading
./build/nanosolana ooda --sim

# Full autonomous daemon
./build/nanosolana daemon
```

## Links

- **Console**: [go.nanosolana.com](https://go.nanosolana.com)
- **GitHub**: [x402agent/nano-solana-go](https://github.com/x402agent/nano-solana-go)
- **Helius**: [helius.dev](https://helius.dev)

## Publish your own skill to NanoHub (npm)

NanoHub supports publishing user-created skills via npm CLI.

```bash
# Login to NanoHub
npx @nanosolana/nanohub login

# Publish a local skill folder (must contain SKILL.md)
npx @nanosolana/nanohub publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --tags latest,solana
```

Open your published skills at **https://hub.nanosolana.com**.
