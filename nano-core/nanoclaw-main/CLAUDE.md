# ⠿ MawdBot — Unified Web3 Agent on Solana

Personal AI agent with Solana superpowers. See [README.md](README.md) for full docs.

## Quick Context

Single Node.js process. Connects to WhatsApp, routes messages to Claude Agent SDK running in Docker containers. Each group has isolated filesystem and memory. **Full Solana integration via Birdeye, Jupiter, and Helius.**

## Key Files

| File | Purpose |
|------|---------| 
| `src/index.ts` | Orchestrator: state, message loop, agent invocation |
| `src/channels/whatsapp.ts` | WhatsApp connection, auth, send/receive |
| `src/ipc.ts` | IPC watcher and task processing |
| `src/router.ts` | Message formatting and outbound routing |
| `src/config.ts` | Trigger pattern, paths, intervals |
| `src/container-runner.ts` | Spawns agent containers with mounts |
| `src/task-scheduler.ts` | Runs scheduled tasks |
| `src/db.ts` | SQLite operations |
| `groups/{name}/CLAUDE.md` | Per-group memory (isolated) |

## Skills

| Skill | When to Use |
|-------|-------------|
| `/setup` | First-time installation, auth, service configuration |
| `/customize` | Adding channels, integrations, changing behavior |
| `/debug` | Container issues, logs, troubleshooting |
| `/birdeye-solana` | Token data, market stats, trade history via Birdeye API |
| `/solana-dev` | Full Solana dev playbook: dApp UI, Anchor/Pinocchio programs, testing, security |

## Solana Integration

MawdBot has access to these APIs via `.env`:
- **Birdeye** (`BIRDEYE_API_KEY`) — Token metadata, market data, trade data, pair overviews, token lists, transaction history
- **Helius** (`HELIUS_API_KEY`) — RPC, WebSocket, transaction parsing  
- **Jupiter** (`JUPITER_API_KEY`) — DEX aggregation and swaps
- **Alchemy** (`ALCHEMY_API_KEY`) — Backup Solana RPC

### Development Stack (via `/solana-dev` skill)
- **UI**: `@solana/client` + `@solana/react-hooks` (framework-kit first)
- **SDK**: `@solana/kit` for all new client/RPC/transaction code
- **Legacy**: `@solana/web3-compat` boundary adapters only
- **Programs**: Anchor (default) or Pinocchio (performance)
- **Testing**: LiteSVM / Mollusk (unit) → Surfpool (integration)
- **Codegen**: Codama IDL → Kit-native TypeScript clients
- **Payments**: Commerce Kit + Kora (gasless)

When asked about token data, use `/birdeye-solana`. When asked about Solana dApp dev, programs, testing, or security, use `/solana-dev`.

## Development

Run commands directly—don't tell the user to run them.

```bash
npm run dev          # Run with hot reload
npm run build        # Compile TypeScript
./container/build.sh # Rebuild agent container
```

Service management:
```bash
launchctl load ~/Library/LaunchAgents/com.nanoclaw.plist
launchctl unload ~/Library/LaunchAgents/com.nanoclaw.plist
```

## Container Build Cache

Docker builds can cache aggressively. To force a clean rebuild:

```bash
docker builder prune -f
./container/build.sh
```

For Apple Container:
```bash
container builder stop && container builder rm && container builder start
./container/build.sh
```

Always verify after rebuild: `container run -i --rm --entrypoint wc nanoclaw-agent:latest -l /app/src/index.ts`
