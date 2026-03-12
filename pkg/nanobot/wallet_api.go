// Package nanobot — wallet API endpoints for the NanoBot UI.
//
// Provides REST endpoints for the agentic Solana wallet:
//   - GET  /api/wallet         → wallet address, balance, network
//   - POST /api/wallet/send    → send SOL to an address
//   - GET  /api/wallet/tokens  → SPL token balances
//   - GET  /api/wallet/history → recent transaction history
//
// Uses Helius RPC (mainnet or devnet) via the onchain.Engine.
package nanobot

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/8bitlabs/mawdbot/pkg/onchain"
	sol "github.com/8bitlabs/mawdbot/pkg/solana"
)

// WalletAPI handles wallet-related HTTP endpoints.
type WalletAPI struct {
	engine *onchain.Engine
	wallet *sol.Wallet
	logf   func(string, ...any)
}

// NewWalletAPI creates the wallet API with an on-chain engine.
func NewWalletAPI() (*WalletAPI, error) {
	cfg := onchain.DefaultConfig()

	// Ensure agent wallet exists
	home, _ := os.UserHomeDir()
	walletPath := filepath.Join(home, ".nanosolana", "wallet", "agent-wallet.json")
	wallet, err := sol.EnsureAgentWallet(walletPath)
	if err != nil {
		return nil, fmt.Errorf("wallet init: %w", err)
	}

	api := &WalletAPI{
		wallet: wallet,
		logf:   func(f string, a ...any) { fmt.Fprintf(os.Stderr, "[wallet-api] "+f+"\n", a...) },
	}

	// Try to init engine (may fail if no Helius key — that's OK)
	if cfg.HeliusRPCURL != "" {
		engine, err := onchain.NewEngine(cfg)
		if err != nil {
			api.logf("⚠️ On-chain engine unavailable: %v", err)
		} else {
			api.engine = engine
		}
	}

	return api, nil
}

// Register adds wallet API routes to the mux.
func (wa *WalletAPI) Register(mux *http.ServeMux) {
	mux.HandleFunc("/api/wallet", wa.handleWallet)
	mux.HandleFunc("/api/wallet/send", wa.handleSend)
	mux.HandleFunc("/api/wallet/tokens", wa.handleTokens)
	mux.HandleFunc("/api/wallet/history", wa.handleHistory)
	mux.HandleFunc("/api/wallet/airdrop", wa.handleAirdrop)
}

// corsJSON sets common response headers.
func corsJSON(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

// handleWallet returns wallet info: address, balance, network.
func (wa *WalletAPI) handleWallet(w http.ResponseWriter, r *http.Request) {
	corsJSON(w)
	if r.Method == "OPTIONS" {
		return
	}

	result := map[string]any{
		"address": "",
		"short":   "",
		"balance": "0",
		"network": os.Getenv("HELIUS_NETWORK"),
		"engine":  wa.engine != nil,
	}

	if wa.wallet != nil {
		result["address"] = wa.wallet.PublicKeyStr()
		result["short"] = wa.wallet.ShortKey(4)

		// Get SOL balance if engine is available
		if wa.engine != nil {
			ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
			defer cancel()
			bal, err := wa.engine.GetSOLBalance(ctx, wa.wallet.PublicKey)
			if err == nil {
				result["balance"] = fmt.Sprintf("%.6f", bal.SOL)
				result["balanceLamports"] = bal.Lamports
			} else {
				result["balanceError"] = err.Error()
			}
		}
	} else {
		result["error"] = "No wallet configured"
	}

	json.NewEncoder(w).Encode(result)
}

// handleSend processes a SOL transfer.
func (wa *WalletAPI) handleSend(w http.ResponseWriter, r *http.Request) {
	corsJSON(w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, `{"error":"POST required"}`, 405)
		return
	}

	var req struct {
		To     string `json:"to"`
		Amount string `json:"amount"` // SOL as string
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": "bad request"})
		return
	}

	if wa.wallet == nil || wa.wallet.IsReadOnly() {
		json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": "wallet is read-only"})
		return
	}
	if wa.engine == nil {
		json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": "on-chain engine not configured (set HELIUS_RPC_URL)"})
		return
	}

	// Parse destination
	toPubkey, err := sol.PublicKeyFromBase58(req.To)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": "invalid destination address"})
		return
	}

	// Parse amount (SOL → lamports)
	solAmount, err := strconv.ParseFloat(req.Amount, 64)
	if err != nil || solAmount <= 0 {
		json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": "invalid amount"})
		return
	}
	lamports := uint64(solAmount * 1e9)

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	sig, err := wa.engine.SendSOL(ctx, wa.wallet.GetPrivateKey(), toPubkey, lamports)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": err.Error()})
		return
	}

	wa.logf("✅ Sent %.6f SOL to %s → sig: %s", solAmount, req.To, sig)
	json.NewEncoder(w).Encode(map[string]any{
		"ok":        true,
		"signature": sig.String(),
		"amount":    solAmount,
		"to":        req.To,
		"explorer":  fmt.Sprintf("https://solscan.io/tx/%s", sig),
	})
}

// handleTokens returns SPL token balances.
func (wa *WalletAPI) handleTokens(w http.ResponseWriter, r *http.Request) {
	corsJSON(w)
	if r.Method == "OPTIONS" {
		return
	}

	if wa.wallet == nil {
		json.NewEncoder(w).Encode(map[string]any{"tokens": []any{}, "error": "no wallet"})
		return
	}
	if wa.engine == nil {
		json.NewEncoder(w).Encode(map[string]any{"tokens": []any{}, "error": "engine not configured"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	tokens, err := wa.engine.GetTokenBalances(ctx, wa.wallet.PublicKey)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]any{"tokens": []any{}, "error": err.Error()})
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"tokens": tokens})
}

// handleHistory returns recent transaction history via Helius enhanced API.
func (wa *WalletAPI) handleHistory(w http.ResponseWriter, r *http.Request) {
	corsJSON(w)
	if r.Method == "OPTIONS" {
		return
	}

	if wa.wallet == nil {
		json.NewEncoder(w).Encode(map[string]any{"history": []any{}, "error": "no wallet"})
		return
	}
	if wa.engine == nil {
		json.NewEncoder(w).Encode(map[string]any{"history": []any{}, "error": "engine not configured"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	history, err := wa.engine.GetEnhancedTransactions(ctx, wa.wallet.PublicKeyStr(), 10)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]any{"history": []any{}, "error": err.Error()})
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"history": history})
}

// handleAirdrop requests a devnet airdrop.
func (wa *WalletAPI) handleAirdrop(w http.ResponseWriter, r *http.Request) {
	corsJSON(w)
	if r.Method == "OPTIONS" {
		return
	}

	network := os.Getenv("HELIUS_NETWORK")
	if network != "devnet" && network != "" {
		json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": "airdrop only available on devnet"})
		return
	}

	if wa.wallet == nil {
		json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": "no wallet"})
		return
	}

	// Use standard devnet RPC for airdrop
	json.NewEncoder(w).Encode(map[string]any{
		"ok":      false,
		"error":   "Use CLI: nanosolana solana airdrop",
		"address": wa.wallet.PublicKeyStr(),
	})
}
