/**
 * NanoSolana TamaGObot — RSI + EMA + ATR Strategy Engine
 *
 * Three conditions must all fire simultaneously:
 *
 * LONG:
 *   - RSI crosses above oversold threshold
 *   - Fresh bullish EMA crossover (fast > slow)
 *   - Price above fast EMA
 *
 * SHORT:
 *   - RSI crosses below overbought threshold
 *   - Fresh bearish EMA crossover (fast < slow)
 *   - Price below fast EMA
 *
 * Auto-optimizer adjusts parameters based on rolling trade performance.
 */

import { EventEmitter } from "eventemitter3";

// ── Types ────────────────────────────────────────────────────

export interface StrategyParams {
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  emaFast: number;
  emaSlow: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  positionSizePercent: number;
}

export interface OHLCV {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export interface Signal {
  type: "long" | "short" | "hold";
  confidence: number;
  rsi: number;
  emaFast: number;
  emaSlow: number;
  atr: number;
  price: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  reasoning: string;
  timestamp: number;
}

export interface StrategyEvents {
  signal: (signal: Signal) => void;
  paramsUpdated: (params: StrategyParams) => void;
}

// ── Default Parameters ────────────────────────────────────────

export const DEFAULT_PARAMS: StrategyParams = {
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  emaFast: 20,
  emaSlow: 50,
  stopLossPercent: 8,
  takeProfitPercent: 20,
  positionSizePercent: 10,
};

// ── Technical Indicators ────────────────────────────────────

/**
 * Wilder's RSI (Relative Strength Index).
 */
export function calculateRSI(closes: number[], period: number): number {
  if (closes.length < period + 1) return 50; // Neutral if insufficient data

  let gains = 0;
  let losses = 0;

  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const diff = closes[i]! - closes[i - 1]!;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Wilder's smoothing for remaining periods
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i]! - closes[i - 1]!;
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Exponential Moving Average.
 */
export function calculateEMA(values: number[], period: number): number {
  if (values.length === 0) return 0;
  if (values.length < period) {
    // SMA fallback
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  const multiplier = 2 / (period + 1);

  // Start with SMA of first `period` values
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Apply EMA formula
  for (let i = period; i < values.length; i++) {
    ema = (values[i]! - ema) * multiplier + ema;
  }

  return ema;
}

/**
 * Average True Range (volatility measure).
 */
export function calculateATR(candles: OHLCV[], period = 14): number {
  if (candles.length < 2) return 0;

  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i]!;
    const prev = candles[i - 1]!;

    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close),
    );
    trueRanges.push(tr);
  }

  if (trueRanges.length < period) {
    return trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length;
  }

  // Wilder's smoothing
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]!) / period;
  }

  return atr;
}

// ── Strategy Engine ────────────────────────────────────────

export class StrategyEngine extends EventEmitter<StrategyEvents> {
  private params: StrategyParams;
  private prevRSI: number | null = null;
  private prevEMAFastAboveSlow: boolean | null = null;

  constructor(params?: Partial<StrategyParams>) {
    super();
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  /**
   * Evaluate candle data and generate a signal.
   */
  evaluate(candles: OHLCV[], availableBalance: number): Signal {
    const closes = candles.map((c) => c.close);
    const currentPrice = closes[closes.length - 1] ?? 0;

    // Calculate indicators
    const rsi = calculateRSI(closes, this.params.rsiPeriod);
    const emaFast = calculateEMA(closes, this.params.emaFast);
    const emaSlow = calculateEMA(closes, this.params.emaSlow);
    const atr = calculateATR(candles);

    // Check conditions
    const emaFastAboveSlow = emaFast > emaSlow;
    const priceAboveFastEMA = currentPrice > emaFast;
    const priceBelowFastEMA = currentPrice < emaFast;

    // RSI cross detection
    const rsiCrossedAboveOversold = this.prevRSI !== null &&
      this.prevRSI <= this.params.rsiOversold &&
      rsi > this.params.rsiOversold;

    const rsiCrossedBelowOverbought = this.prevRSI !== null &&
      this.prevRSI >= this.params.rsiOverbought &&
      rsi < this.params.rsiOverbought;

    // EMA crossover detection (fresh)
    const freshBullishCross = this.prevEMAFastAboveSlow !== null &&
      !this.prevEMAFastAboveSlow &&
      emaFastAboveSlow;

    const freshBearishCross = this.prevEMAFastAboveSlow !== null &&
      this.prevEMAFastAboveSlow &&
      !emaFastAboveSlow;

    // Update state for next call
    this.prevRSI = rsi;
    this.prevEMAFastAboveSlow = emaFastAboveSlow;

    // ATR-blended stop/take
    const atrMultiplierSL = 2;
    const atrMultiplierTP = 4;
    const stopLossPrice = currentPrice - atr * atrMultiplierSL;
    const takeProfitPrice = currentPrice + atr * atrMultiplierTP;

    // Position size
    const positionSize = (availableBalance * this.params.positionSizePercent) / 100;

    // ── Signal Generation ──

    let signalType: Signal["type"] = "hold";
    let confidence = 0;
    const reasons: string[] = [];

    // LONG conditions — all three must fire
    const longRSI = rsiCrossedAboveOversold || rsi < this.params.rsiOversold + 5;
    const longEMA = freshBullishCross || emaFastAboveSlow;
    const longPrice = priceAboveFastEMA;

    if (longRSI && longEMA && longPrice) {
      signalType = "long";
      confidence = 0.5;

      if (rsiCrossedAboveOversold) { confidence += 0.15; reasons.push("RSI crossed above oversold"); }
      if (freshBullishCross) { confidence += 0.15; reasons.push("Fresh bullish EMA crossover"); }
      if (rsi < 25) { confidence += 0.1; reasons.push("RSI deeply oversold"); }
      if (priceAboveFastEMA) { reasons.push("Price above fast EMA"); }
    }

    // SHORT conditions — all three must fire
    const shortRSI = rsiCrossedBelowOverbought || rsi > this.params.rsiOverbought - 5;
    const shortEMA = freshBearishCross || !emaFastAboveSlow;
    const shortPrice = priceBelowFastEMA;

    if (shortRSI && shortEMA && shortPrice && signalType === "hold") {
      signalType = "short";
      confidence = 0.5;

      if (rsiCrossedBelowOverbought) { confidence += 0.15; reasons.push("RSI crossed below overbought"); }
      if (freshBearishCross) { confidence += 0.15; reasons.push("Fresh bearish EMA crossover"); }
      if (rsi > 75) { confidence += 0.1; reasons.push("RSI deeply overbought"); }
      if (priceBelowFastEMA) { reasons.push("Price below fast EMA"); }
    }

    if (signalType === "hold") {
      reasons.push(`RSI: ${rsi.toFixed(1)}, EMA fast: ${emaFast.toFixed(4)}, EMA slow: ${emaSlow.toFixed(4)}`);
    }

    const signal: Signal = {
      type: signalType,
      confidence: Math.min(1, confidence),
      rsi,
      emaFast,
      emaSlow,
      atr,
      price: currentPrice,
      stopLoss: signalType === "long" ? stopLossPrice : currentPrice + atr * atrMultiplierSL,
      takeProfit: signalType === "long" ? takeProfitPrice : currentPrice - atr * atrMultiplierTP,
      positionSize,
      reasoning: reasons.join("; "),
      timestamp: Date.now(),
    };

    if (signalType !== "hold") {
      this.emit("signal", signal);
    }

    return signal;
  }

  /**
   * Auto-optimize parameters based on recent trade outcomes.
   */
  optimize(recentWinRate: number, recentTrades: number): void {
    if (recentTrades < 10) return; // Not enough data

    const oldParams = { ...this.params };

    if (recentWinRate < 0.35) {
      // Too many losses — widen RSI bands, reduce position size
      this.params.rsiOversold = Math.max(20, this.params.rsiOversold - 2);
      this.params.rsiOverbought = Math.min(80, this.params.rsiOverbought + 2);
      this.params.positionSizePercent = Math.max(2, this.params.positionSizePercent - 1);
    } else if (recentWinRate > 0.65) {
      // Winning streak — slightly tighten, can afford more
      this.params.rsiOversold = Math.min(35, this.params.rsiOversold + 1);
      this.params.rsiOverbought = Math.max(65, this.params.rsiOverbought - 1);
      this.params.positionSizePercent = Math.min(20, this.params.positionSizePercent + 0.5);
    }

    const changed = JSON.stringify(oldParams) !== JSON.stringify(this.params);
    if (changed) {
      this.emit("paramsUpdated", this.params);
    }
  }

  /**
   * Manually set RSI thresholds (e.g., from hardware knob).
   */
  setRSIThresholds(oversold: number, overbought: number): void {
    this.params.rsiOversold = Math.max(10, Math.min(45, oversold));
    this.params.rsiOverbought = Math.max(55, Math.min(90, overbought));
    this.emit("paramsUpdated", this.params);
  }

  /**
   * Reset parameters to defaults.
   */
  resetParams(): void {
    this.params = { ...DEFAULT_PARAMS };
    this.prevRSI = null;
    this.prevEMAFastAboveSlow = null;
    this.emit("paramsUpdated", this.params);
  }

  /**
   * Get current parameters.
   */
  getParams(): StrategyParams {
    return { ...this.params };
  }
}
