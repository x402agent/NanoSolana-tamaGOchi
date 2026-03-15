/**
 * NanoSolana — Custom Strategy Example
 *
 * Bring your own trading strategy: override the RSI/EMA/ATR defaults
 * and build custom signal logic.
 *
 * Usage:
 *   npx tsx examples/custom-strategy.ts
 */

import {
  StrategyEngine,
  calculateRSI,
  calculateEMA,
  calculateATR,
  DEFAULT_PARAMS,
  type StrategyParams,
  type OHLCV,
  type Signal,
} from "nanosolana";

// Custom aggressive strategy params
const aggressiveParams: StrategyParams = {
  ...DEFAULT_PARAMS,
  rsiPeriod: 7,        // Faster RSI
  rsiOverbought: 65,   // Earlier sell signals
  rsiOversold: 35,     // Earlier buy signals
  emaFast: 8,          // Faster EMA crossover
  emaSlow: 21,
};

// Example OHLCV data
const sampleData: OHLCV[] = Array.from({ length: 50 }, (_, i) => ({
  open: 140 + Math.sin(i / 5) * 10 + Math.random() * 2,
  high: 142 + Math.sin(i / 5) * 10 + Math.random() * 3,
  low: 138 + Math.sin(i / 5) * 10 - Math.random() * 3,
  close: 140 + Math.sin(i / 5) * 10 + Math.random() * 2 - 1,
  volume: 1000000 + Math.random() * 500000,
  timestamp: Date.now() - (50 - i) * 60000,
}));

function analyzeWithCustomStrategy() {
  console.log("🦞 NanoSolana — Custom Strategy Analysis\n");
  console.log(`Strategy: Aggressive (RSI ${aggressiveParams.rsiPeriod}, EMA ${aggressiveParams.emaFast}/${aggressiveParams.emaSlow})\n`);

  // Calculate indicators
  const closes = sampleData.map(d => d.close);
  const rsiValues = calculateRSI(closes, aggressiveParams.rsiPeriod);
  const emaFast = calculateEMA(closes, aggressiveParams.emaFast);
  const emaSlow = calculateEMA(closes, aggressiveParams.emaSlow);
  const atr = calculateATR(sampleData, aggressiveParams.atrPeriod ?? 14);

  const latestRSI = rsiValues[rsiValues.length - 1];
  const latestEmaFast = emaFast[emaFast.length - 1];
  const latestEmaSlow = emaSlow[emaSlow.length - 1];
  const latestATR = atr[atr.length - 1];

  console.log(`📊 Latest RSI: ${latestRSI?.toFixed(2)}`);
  console.log(`📈 EMA Fast: ${latestEmaFast?.toFixed(2)}`);
  console.log(`📉 EMA Slow: ${latestEmaSlow?.toFixed(2)}`);
  console.log(`📏 ATR: ${latestATR?.toFixed(4)}\n`);

  // Generate signal
  const strategy = new StrategyEngine(aggressiveParams);
  strategy.on("signal", (signal: Signal) => {
    const icon = signal.direction === "long" ? "🟢 BUY" : signal.direction === "short" ? "🔴 SELL" : "⚪ HOLD";
    console.log(`${icon} — Confidence: ${(signal.confidence * 100).toFixed(0)}%`);
    console.log(`  Reasoning: ${signal.reasoning}`);
  });

  console.log("✅ Custom strategy ready for live data.\n");
}

analyzeWithCustomStrategy();
