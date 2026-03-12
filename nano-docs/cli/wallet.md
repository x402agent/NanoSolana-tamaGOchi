---
summary: "nanosolana wallet — Solana wallet management"
title: "wallet"
---

# `nanosolana wallet`

Manage the agent's Solana wallet.

## Subcommands

### `nanosolana wallet balance`

Show SOL and SPL token balances.

```bash
nanosolana wallet balance
nanosolana wallet balance --json
```

### `nanosolana wallet send`

Send SOL or tokens (requires vault password).

```bash
nanosolana wallet send <recipient_address> <amount>
nanosolana wallet send 7xKX...abc 0.5 --token SOL
```

Options:

- `--token <mint>`: Token to send (default: `SOL`).
- `--memo <text>`: Transaction memo.
- `--yes`: Skip confirmation prompt.

### `nanosolana wallet receive`

Show the deposit address and QR code.

```bash
nanosolana wallet receive
nanosolana wallet receive --qr
```

### `nanosolana wallet history`

Show recent transactions.

```bash
nanosolana wallet history
nanosolana wallet history --limit 20
nanosolana wallet history --json
```

### `nanosolana wallet export`

Export the wallet (requires vault password confirmation).

```bash
nanosolana wallet export --format json
nanosolana wallet export --format base58
```

> **Warning**: This exports the private key. Handle with extreme care.

## Security

- Private key stored in AES-256-GCM encrypted vault.
- All send operations require explicit confirmation.
- Export requires vault password re-entry.
- Transaction history is stored locally (not on any external server).
