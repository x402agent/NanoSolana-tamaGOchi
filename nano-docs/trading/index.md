---
summary: "NanoSolana trading engine — strategy, execution, and risk management"
title: "Trading Engine"
---

# Trading engine

The NanoSolana trading engine implements an RSI + EMA + ATR strategy with auto-optimization,
Jupiter swap execution, and real-time P&L tracking.

## Strategy: RSI + EMA + ATR

### Indicators

| Indicator | Default | Description |
|-----------|---------|-------------|
| RSI (14) | Period: 14 | Relative Strength Index — momentum |
| EMA Fast | Period: 12 | Exponential Moving Average — short-term trend |
| EMA Slow | Period: 26 | Exponential Moving Average — long-term trend |
| ATR (14) | Period: 14 | Average True Range — volatility |

### Signal generation

```
BUY signal when:
  - RSI < 30 (oversold)
  - EMA Fast crosses above EMA Slow (bullish crossover)
  - ATR confirms sufficient volatility

SELL signal when:
  - RSI > 70 (overbought)
  - EMA Fast crosses below EMA Slow (bearish crossover)
  - OR stop-loss/take-profit hit
```

### Confidence scoring

Every signal includes a confidence score (0.0 → 1.0):

```
confidence = (
  rsi_signal_strength * 0.3 +
  ema_crossover_strength * 0.3 +
  volume_confirmation * 0.2 +
  memory_pattern_match * 0.2
)
```

- Minimum threshold for execution: `0.7` (configurable).
- Below threshold: signal logged but not executed.

## Execution via Jupiter

High-confidence signals are executed through the **Jupiter Ultra Swap API**:

```
1. Generate quote (Jupiter /quote)
2. Check slippage tolerance (default: 1%)
3. Build transaction (Jupiter /swap)
4. Sign with agent wallet (Ed25519)
5. Submit to Solana via Helius RPC
6. Confirm transaction
7. Record outcome in ClawVault LEARNED tier
```

### Slippage protection

- Default slippage: 1% (100 bps).
- Dynamic slippage: adjusts based on ATR.
- Max slippage cap: 3% (hard limit).

### Position sizing

Based on a **Kelly Criterion** adaptation:

```
position_size = min(
  kelly_fraction * wallet_balance,
  max_position_size,
  available_balance * 0.5  // never risk more than 50%
)
```

## Auto-optimizer

The strategy engine includes an **auto-optimizer** that adjusts parameters based
on recent trade performance:

```
Every 20 trades:
  1. Calculate win rate, avg profit, avg loss
  2. Sharpe ratio over rolling window
  3. If Sharpe < 0.5: tighten parameters (less aggressive)
  4. If Sharpe > 1.5: slightly loosen (more opportunities)
  5. Store optimized params in ClawVault LEARNED tier
```

### Tunable parameters

```json5
{
  trading: {
    strategy: {
      rsiPeriod: 14,
      rsiBuyThreshold: 30,
      rsiSellThreshold: 70,
      emaFastPeriod: 12,
      emaSlowPeriod: 26,
      atrPeriod: 14,
      confidenceThreshold: 0.7,
      slippageBps: 100,
      maxSlippageBps: 300,
      maxPositionPct: 50,     // % of wallet balance
      stopLossPct: 2,
      takeProfitPct: 5,
      optimizeEvery: 20,      // trades before re-optimization
    },
    execution: {
      enabled: false,         // manual approval by default
      autoExecute: false,     // set true for autonomous trading
      jupiterApiKey: "env:JUPITER_API_KEY",
      heliusRpcUrl: "env:HELIUS_RPC_URL",
    }
  }
}
```

## Risk management

### Hard limits

- **Max position**: 50% of wallet balance (configurable).
- **Daily loss limit**: -10% of wallet value → trading paused for 24h.
- **Max slippage**: 3% hard cap.
- **Minimum balance**: 0.01 SOL always reserved for gas.

### TamaGOchi integration

The pet's mood affects risk tolerance:

| Pet Mood | Risk Modifier |
|----------|---------------|
| Happy | +10% position size |
| Content | No change |
| Hungry | -10% position size |
| Sick | -30% position size |
| Ghost | Trading disabled |

## P&L tracking

Real-time P&L tracked per trade and per day:

```bash
nanosolana trade status          # Current P&L
nanosolana trade history         # Historical trades
nanosolana trade backtest        # Run backtest on historical data
```

### Metrics

- Win rate (rolling 50 trades)
- Average profit per winning trade
- Average loss per losing trade
- Sharpe ratio (rolling)
- Maximum drawdown
- Total P&L (SOL + USD equivalent)

## Events

| Event | Payload |
|-------|---------|
| `trade:signal` | `{ action, token, confidence, reasoning }` |
| `trade:execute` | `{ txHash, amount, price, slippage }` |
| `trade:complete` | `{ txHash, status, pnl }` |
| `trade:error` | `{ error, signal }` |

## CLI

```bash
nanosolana trade status           # Strategy state + P&L
nanosolana trade signals          # Recent signals (with confidence)
nanosolana trade execute <id>     # Manually execute a signal
nanosolana trade history          # Past executions
nanosolana trade backtest         # Run strategy backtest
nanosolana trade optimize         # Force re-optimization
```

## Safety

- Trading is **disabled by default** (`execution.enabled: false`).
- Auto-execution requires explicit opt-in (`execution.autoExecute: true`).
- Every trade is logged in ClawVault for audit.
- Ghost pet state (from failed trades) completely disables trading.
- Wallet private key never leaves the encrypted vault.
