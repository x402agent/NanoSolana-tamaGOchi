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
