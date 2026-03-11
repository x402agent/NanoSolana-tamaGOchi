// Package x402 integrates the x402 payment protocol into MawdBot.
//
// x402 is a standard for paywalled HTTP endpoints using crypto payments.
// This package wraps github.com/mark3labs/x402-go to provide:
//
//   - Solana USDC payment support via the agent's agentic wallet
//   - Multi-chain payment requirements (Solana + Base + Polygon)
//   - x402 middleware for MawdBot's HTTP endpoints
//   - Payment client for consuming x402-gated APIs
//   - Facilitator proxy that runs alongside the daemon
//
// On daemon startup, MawdBot initializes the x402 subsystem:
//  1. Creates an SVM signer from the agent's Solana wallet
//  2. Configures USDC payment requirements (Solana mainnet)
//  3. Starts the facilitator proxy (connects to facilitator.x402.rs)
//  4. Creates a payment-aware HTTP client for agent API calls
package x402

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/mark3labs/x402-go"
	x402http "github.com/mark3labs/x402-go/http"
	"github.com/mark3labs/x402-go/signers/svm"

	mawdsolana "github.com/8bitlabs/mawdbot/pkg/solana"
)

// ── Constants ────────────────────────────────────────────────────────

const (
	// DefaultFacilitatorURL is the public x402 facilitator endpoint.
	DefaultFacilitatorURL = "https://facilitator.x402.rs"

	// DefaultPaywallPort is the port for the local x402 paywall server.
	DefaultPaywallPort = 18402

	// DefaultPaymentAmount is the default USDC amount per API call.
	DefaultPaymentAmount = "0.001" // $0.001 per call
)

// ── X402 Service ─────────────────────────────────────────────────────

// Service manages the x402 payment subsystem for MawdBot.
type Service struct {
	mu               sync.RWMutex
	wallet           *mawdsolana.Wallet
	svmSigner        *svm.Signer
	paymentClient    *x402http.Client
	facilitatorURL   string
	recipientAddress string
	network          string
	paywallServer    *http.Server
	requirements     []x402.PaymentRequirement
	running          bool
}

// Config holds x402 configuration.
type Config struct {
	// FacilitatorURL is the facilitator endpoint (default: facilitator.x402.rs)
	FacilitatorURL string

	// RecipientAddress is the wallet that receives payments (default: agent wallet)
	RecipientAddress string

	// PaymentAmount is the USDC amount per API call (default: "0.001")
	PaymentAmount string

	// Network is the blockchain network ("solana" or "solana-devnet")
	Network string

	// PaywallPort is the port for the local x402 paywall server (default: 18402)
	PaywallPort int

	// PaywallEnabled enables the local paywall HTTP server
	PaywallEnabled bool

	// Chains configures which chains to accept payments on
	Chains []x402.ChainConfig
}

// DefaultConfig returns a config with sensible defaults.
func DefaultConfig() Config {
	return Config{
		FacilitatorURL: DefaultFacilitatorURL,
		PaymentAmount:  DefaultPaymentAmount,
		Network:        "solana",
		PaywallPort:    DefaultPaywallPort,
		PaywallEnabled: false,
		Chains:         []x402.ChainConfig{x402.SolanaMainnet},
	}
}

// ConfigFromEnv loads x402 config from environment variables.
func ConfigFromEnv() Config {
	cfg := DefaultConfig()

	if url := os.Getenv("X402_FACILITATOR_URL"); url != "" {
		cfg.FacilitatorURL = url
	}
	if addr := os.Getenv("X402_RECIPIENT_ADDRESS"); addr != "" {
		cfg.RecipientAddress = addr
	}
	if amt := os.Getenv("X402_PAYMENT_AMOUNT"); amt != "" {
		cfg.PaymentAmount = amt
	}
	if net := os.Getenv("X402_NETWORK"); net != "" {
		cfg.Network = net
	}
	if os.Getenv("X402_PAYWALL_ENABLED") == "true" || os.Getenv("X402_PAYWALL_ENABLED") == "1" {
		cfg.PaywallEnabled = true
	}

	// Multi-chain support from env
	chains := os.Getenv("X402_CHAINS")
	if chains != "" {
		cfg.Chains = parseChains(chains)
	}

	return cfg
}

// ── New ──────────────────────────────────────────────────────────────

// NewService creates a new x402 payment service using the agent's wallet.
func NewService(wallet *mawdsolana.Wallet, cfg Config) (*Service, error) {
	if wallet == nil || wallet.IsReadOnly() {
		return nil, fmt.Errorf("x402: wallet required (cannot be read-only)")
	}

	recipientAddr := cfg.RecipientAddress
	if recipientAddr == "" {
		recipientAddr = wallet.PublicKeyStr()
	}

	// Determine chain config based on network
	var chain x402.ChainConfig
	switch cfg.Network {
	case "solana", "mainnet":
		chain = x402.SolanaMainnet
	case "solana-devnet", "devnet":
		chain = x402.SolanaDevnet
	default:
		chain = x402.SolanaMainnet
	}

	// Create USDC token config for the SVM signer
	token := x402.NewUSDCTokenConfig(chain, 1) // Priority 1 (highest)

	// Create SVM signer from agent wallet's keygen file
	walletKeyPath := wallet.KeyPath()
	var signerOpts []svm.SignerOption

	if walletKeyPath != "" {
		signerOpts = append(signerOpts, svm.WithKeygenFile(walletKeyPath))
	} else {
		// Fallback: export private key as base58
		privKeyB58 := wallet.PrivateKeyBase58()
		if privKeyB58 == "" {
			return nil, fmt.Errorf("x402: cannot extract private key from wallet")
		}
		signerOpts = append(signerOpts, svm.WithPrivateKey(privKeyB58))
	}

	signerOpts = append(signerOpts,
		svm.WithNetwork(chain.NetworkID),
		svm.WithToken(token.Address, token.Symbol, token.Decimals),
	)

	svmSigner, err := svm.NewSigner(signerOpts...)
	if err != nil {
		return nil, fmt.Errorf("x402: svm signer: %w", err)
	}

	// Build payment requirements for all configured chains
	var requirements []x402.PaymentRequirement
	for _, c := range cfg.Chains {
		req, err := x402.NewUSDCPaymentRequirement(x402.USDCRequirementConfig{
			Chain:            c,
			Amount:           cfg.PaymentAmount,
			RecipientAddress: recipientAddr,
			Description:      "MawdBot API access",
		})
		if err != nil {
			log.Printf("[X402] ⚠️ Failed to create requirement for %s: %v", c.NetworkID, err)
			continue
		}
		requirements = append(requirements, req)
	}

	// Create payment-aware HTTP client
	paymentClient, err := x402http.NewClient(x402http.WithSigner(svmSigner))
	if err != nil {
		return nil, fmt.Errorf("x402: http client: %w", err)
	}

	svc := &Service{
		wallet:           wallet,
		svmSigner:        svmSigner,
		paymentClient:    paymentClient,
		facilitatorURL:   cfg.FacilitatorURL,
		recipientAddress: recipientAddr,
		network:          cfg.Network,
		requirements:     requirements,
	}

	// Optionally start the local paywall server
	if cfg.PaywallEnabled {
		svc.startPaywallServer(cfg.PaywallPort)
	}

	return svc, nil
}

// ── Public API ───────────────────────────────────────────────────────

// Client returns the payment-aware HTTP client.
// Use this to make requests to x402-gated APIs — payments happen automatically.
func (s *Service) Client() *x402http.Client {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.paymentClient
}

// Requirements returns the configured payment requirements.
func (s *Service) Requirements() []x402.PaymentRequirement {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.requirements
}

// Middleware returns x402 middleware for protecting HTTP endpoints.
func (s *Service) Middleware() func(http.Handler) http.Handler {
	config := &x402http.Config{
		FacilitatorURL:      s.facilitatorURL,
		PaymentRequirements: s.requirements,
	}
	return x402http.NewX402Middleware(config)
}

// FacilitatorURL returns the configured facilitator URL.
func (s *Service) FacilitatorURL() string {
	return s.facilitatorURL
}

// SignerAddress returns the SVM signer's public key.
func (s *Service) SignerAddress() string {
	if s.svmSigner != nil {
		return s.svmSigner.Address()
	}
	return ""
}

// NetworkID returns the configured network identifier.
func (s *Service) NetworkID() string {
	return s.network
}

// Status returns a human-readable status string.
func (s *Service) Status() string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	chains := make([]string, 0, len(s.requirements))
	for _, r := range s.requirements {
		chains = append(chains, r.Network)
	}

	return fmt.Sprintf("x402 Payment Gateway\n"+
		"  Facilitator: %s\n"+
		"  Recipient: %s\n"+
		"  Signer: %s\n"+
		"  Chains: %s\n"+
		"  Requirements: %d\n"+
		"  Paywall: %v",
		s.facilitatorURL,
		s.recipientAddress,
		s.SignerAddress(),
		strings.Join(chains, ", "),
		len(s.requirements),
		s.running,
	)
}

// ── Paywall Server ───────────────────────────────────────────────────
// A local HTTP server that gates MawdBot's API endpoints with x402.

func (s *Service) startPaywallServer(port int) {
	mux := http.NewServeMux()

	// Paywall-protected endpoints
	middleware := s.Middleware()

	// Health — free
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"mawdbot-x402"}`))
	})

	// x402 info — free
	mux.HandleFunc("/x402/info", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"facilitator":"%s","recipient":"%s","network":"%s","chains":%d}`,
			s.facilitatorURL, s.recipientAddress, s.network, len(s.requirements))
	})

	// Trading signals — paywalled
	mux.Handle("/api/signals", middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"signals":[],"status":"premium","note":"MawdBot trading signals - x402 payment verified"}`))
	})))

	// Research reports — paywalled
	mux.Handle("/api/research", middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"reports":[],"status":"premium","note":"MawdBot research data - x402 payment verified"}`))
	})))

	// Agent status — paywalled
	mux.Handle("/api/agent", middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"wallet":"%s","network":"%s","status":"active"}`,
			s.recipientAddress, s.network)
	})))

	s.paywallServer = &http.Server{
		Addr:         fmt.Sprintf(":%d", port),
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		s.mu.Lock()
		s.running = true
		s.mu.Unlock()

		log.Printf("[X402] 💰 Paywall server starting on :%d", port)
		log.Printf("[X402]    Facilitator: %s", s.facilitatorURL)
		log.Printf("[X402]    Recipient: %s", s.recipientAddress)
		log.Printf("[X402]    Chains: %d configured", len(s.requirements))

		if err := s.paywallServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("[X402] ⚠️ Paywall server error: %v", err)
		}

		s.mu.Lock()
		s.running = false
		s.mu.Unlock()
	}()
}

// Stop gracefully stops the paywall server.
func (s *Service) Stop(ctx context.Context) error {
	if s.paywallServer != nil {
		log.Println("[X402] Stopping paywall server...")
		return s.paywallServer.Shutdown(ctx)
	}
	return nil
}

// ── Helpers ──────────────────────────────────────────────────────────

func parseChains(csv string) []x402.ChainConfig {
	parts := strings.Split(csv, ",")
	var chains []x402.ChainConfig

	chainMap := map[string]x402.ChainConfig{
		"solana":         x402.SolanaMainnet,
		"solana-devnet":  x402.SolanaDevnet,
		"base":           x402.BaseMainnet,
		"base-sepolia":   x402.BaseSepolia,
		"polygon":        x402.PolygonMainnet,
		"polygon-amoy":   x402.PolygonAmoy,
		"avalanche":      x402.AvalancheMainnet,
		"avalanche-fuji": x402.AvalancheFuji,
	}

	for _, part := range parts {
		name := strings.TrimSpace(strings.ToLower(part))
		if cfg, ok := chainMap[name]; ok {
			chains = append(chains, cfg)
		}
	}

	if len(chains) == 0 {
		return []x402.ChainConfig{x402.SolanaMainnet}
	}
	return chains
}
