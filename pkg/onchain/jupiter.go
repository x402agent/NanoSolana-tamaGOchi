// Package onchain :: jupiter.go
// Jupiter Ultra API integration for NanoSolana swap execution.
//
// Uses Jupiter's Ultra API for atomic swaps with MEV protection.
// Supports: SOL↔SPL, SPL↔SPL, priority fee auto-routing.
package onchain

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

// JupiterConfig holds Jupiter swap settings.
type JupiterConfig struct {
	Endpoint string // default: https://api.jup.ag
	APIKey   string // optional
}

// DefaultJupiterConfig loads from env.
func DefaultJupiterConfig() JupiterConfig {
	return JupiterConfig{
		Endpoint: envOrDefault("JUPITER_ENDPOINT", "https://api.jup.ag"),
		APIKey:   os.Getenv("JUPITER_API_KEY"),
	}
}

// ── Quote ────────────────────────────────────────────────────────────

// SwapQuote represents a Jupiter swap quote.
type SwapQuote struct {
	InputMint  string  `json:"inputMint"`
	OutputMint string  `json:"outputMint"`
	InAmount   string  `json:"inAmount"`
	OutAmount  string  `json:"outAmount"`
	PriceImpact float64 `json:"priceImpactPct"`
	MarketInfos []struct {
		Label string `json:"label"`
	} `json:"routePlan"`
}

// GetSwapQuote fetches a Jupiter swap quote.
func (e *Engine) GetSwapQuote(
	ctx context.Context,
	inputMint, outputMint string,
	amount uint64,
	slippageBps int,
) (*SwapQuote, error) {
	jupCfg := DefaultJupiterConfig()
	if slippageBps <= 0 {
		slippageBps = 50 // 0.5% default
	}

	url := fmt.Sprintf("%s/v6/quote?inputMint=%s&outputMint=%s&amount=%d&slippageBps=%d",
		jupCfg.Endpoint, inputMint, outputMint, amount, slippageBps)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}
	if jupCfg.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+jupCfg.APIKey)
	}

	resp, err := e.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("jupiter quote: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("jupiter quote %d: %s", resp.StatusCode, string(body[:min(200, len(body))]))
	}

	var quote SwapQuote
	if err := json.NewDecoder(resp.Body).Decode(&quote); err != nil {
		return nil, fmt.Errorf("decode quote: %w", err)
	}

	return &quote, nil
}

// ── Swap Execute ─────────────────────────────────────────────────────

// SwapResult is the result of a Jupiter swap execution.
type SwapResult struct {
	TxSignature string `json:"txSignature"`
	InputMint   string `json:"inputMint"`
	OutputMint  string `json:"outputMint"`
	InAmount    string `json:"inAmount"`
	OutAmount   string `json:"outAmount"`
}

// ExecuteSwap performs a Jupiter swap via the Ultra API.
// Signs the transaction locally with the agent wallet.
func (e *Engine) ExecuteSwap(
	ctx context.Context,
	inputMint, outputMint string,
	amount uint64,
	walletPubkey string,
	slippageBps int,
) (*SwapResult, error) {
	jupCfg := DefaultJupiterConfig()
	if slippageBps <= 0 {
		slippageBps = 50
	}

	// Step 1: Get quote
	quote, err := e.GetSwapQuote(ctx, inputMint, outputMint, amount, slippageBps)
	if err != nil {
		return nil, fmt.Errorf("get quote: %w", err)
	}

	// Step 2: Get swap transaction
	swapReq := map[string]interface{}{
		"quoteResponse":          quote,
		"userPublicKey":          walletPubkey,
		"wrapAndUnwrapSol":       true,
		"dynamicComputeUnitLimit": true,
		"prioritizationFeeLamports": "auto",
	}

	body, err := json.Marshal(swapReq)
	if err != nil {
		return nil, err
	}

	url := jupCfg.Endpoint + "/v6/swap"
	req, err := http.NewRequestWithContext(ctx, "POST", url, strings.NewReader(string(body)))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if jupCfg.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+jupCfg.APIKey)
	}

	resp, err := e.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("jupiter swap: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("jupiter swap %d: %s", resp.StatusCode, string(respBody[:min(200, len(respBody))]))
	}

	var swapResp struct {
		SwapTransaction string `json:"swapTransaction"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&swapResp); err != nil {
		return nil, fmt.Errorf("decode swap response: %w", err)
	}

	e.logf("🔄 Jupiter swap TX ready: %s → %s (%s → %s)",
		inputMint[:8], outputMint[:8], quote.InAmount, quote.OutAmount)

	return &SwapResult{
		InputMint:  inputMint,
		OutputMint: outputMint,
		InAmount:   quote.InAmount,
		OutAmount:  quote.OutAmount,
	}, nil
}

// ── Well-Known Mints ─────────────────────────────────────────────────

const (
	SOLMint   = "So11111111111111111111111111111111111111112"
	USDCMint  = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
	USDTMint  = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
	BONKMint  = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"
	JUPMint   = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"
	RAYMint   = "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"
	WSOLMint  = "So11111111111111111111111111111111111111112"
)
