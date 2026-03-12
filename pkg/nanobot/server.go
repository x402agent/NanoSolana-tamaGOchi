// Package nanobot provides the interactive NanoBot menu bar UI server.
//
// Serves a local web UI on localhost that provides:
//   - Animated NanoBot character you can talk to
//   - Real-time system status (wallet, OODA, pet)
//   - Feature dashboard with all capabilities
//   - Chat interface for interacting with the agent
//   - One-click access to all nanosolana commands
package nanobot

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

//go:embed ui/*
var uiFS embed.FS

// Server is the NanoBot local UI server.
type Server struct {
	port   int
	binary string // path to nanosolana binary
	logf   func(string, ...any)
}

// NewServer creates a NanoBot UI server.
func NewServer(port int, binary string) *Server {
	if port == 0 {
		port = 7777
	}
	return &Server{
		port:   port,
		binary: binary,
		logf:   func(f string, a ...any) { fmt.Fprintf(os.Stderr, "[nanobot] "+f+"\n", a...) },
	}
}

// Start serves the NanoBot UI and opens the browser.
func (s *Server) Start(ctx context.Context) error {
	mux := http.NewServeMux()

	// Serve embedded UI files
	uiContent, err := fs.Sub(uiFS, "ui")
	if err != nil {
		return fmt.Errorf("embed ui: %w", err)
	}
	mux.Handle("/", http.FileServer(http.FS(uiContent)))

	// API endpoints
	mux.HandleFunc("/api/status", s.handleStatus)
	mux.HandleFunc("/api/run", s.handleRun)
	mux.HandleFunc("/api/chat", s.handleChat)

	// Wallet API (best-effort — won't fail if Helius not configured)
	if walletAPI, err := NewWalletAPI(); err == nil {
		walletAPI.Register(mux)
		s.logf("💰 Wallet API enabled: %s", walletAPI.wallet.ShortKey(4))
	} else {
		s.logf("⚠️ Wallet API disabled: %v", err)
	}

	addr := fmt.Sprintf("127.0.0.1:%d", s.port)
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return fmt.Errorf("listen %s: %w", addr, err)
	}

	srv := &http.Server{Handler: mux}
	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		_ = srv.Shutdown(shutdownCtx)
	}()

	url := fmt.Sprintf("http://%s", addr)
	s.logf("🤖 NanoBot UI: %s", url)

	// Open in browser
	go func() {
		time.Sleep(200 * time.Millisecond)
		openBrowser(url)
	}()

	return srv.Serve(ln)
}

// Port returns the configured port.
func (s *Server) Port() int { return s.port }

// handleStatus returns system status JSON.
func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	status := map[string]any{
		"agent":    "NanoSolana",
		"version":  "2.0.0",
		"platform": runtime.GOOS + "/" + runtime.GOARCH,
		"binary":   s.binary,
		"time":     time.Now().UTC().Format(time.RFC3339),
		"uptime":   "running",
	}

	// Check heartbeat
	home, _ := os.UserHomeDir()
	heartbeatPath := filepath.Join(home, ".nanosolana", "workspace", "HEARTBEAT.md")
	if data, err := os.ReadFile(heartbeatPath); err == nil {
		status["heartbeat"] = string(data)
		status["daemon"] = "alive"
	} else {
		status["daemon"] = "stopped"
	}

	// Check wallet
	walletPath := filepath.Join(home, ".nanosolana", "wallet.json")
	if _, err := os.Stat(walletPath); err == nil {
		status["wallet"] = "configured"
	} else {
		status["wallet"] = "not configured"
	}

	json.NewEncoder(w).Encode(status)
}

// handleRun executes a nanosolana CLI command and returns output.
func (s *Server) handleRun(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method == "OPTIONS" {
		w.Header().Set("Access-Control-Allow-Methods", "POST")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		return
	}

	var req struct {
		Command string `json:"command"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"bad request"}`, 400)
		return
	}

	// Only allow safe commands
	allowed := map[string]bool{
		"version": true, "solana health": true, "solana balance": true,
		"solana wallet": true, "solana trending": true, "solana registry": true,
		"pet": true, "status": true, "solana register": true,
	}
	cmd := strings.TrimSpace(req.Command)
	if !allowed[cmd] {
		json.NewEncoder(w).Encode(map[string]any{
			"output": fmt.Sprintf("⚠️ Command '%s' not available in UI mode. Use the terminal for full access.", cmd),
			"ok":     false,
		})
		return
	}

	args := strings.Fields(cmd)
	out, err := exec.CommandContext(r.Context(), s.binary, args...).CombinedOutput()
	result := map[string]any{
		"output": string(out),
		"ok":     err == nil,
	}
	json.NewEncoder(w).Encode(result)
}

// handleChat processes a chat message and returns NanoBot's response.
func (s *Server) handleChat(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if r.Method == "OPTIONS" {
		w.Header().Set("Access-Control-Allow-Methods", "POST")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		return
	}

	var req struct {
		Message string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"bad request"}`, 400)
		return
	}

	msg := strings.TrimSpace(strings.ToLower(req.Message))
	reply := nanobotReply(msg)

	json.NewEncoder(w).Encode(map[string]any{
		"reply": reply,
		"mood":  "happy",
	})
}

// nanobotReply generates a contextual response from NanoBot.
func nanobotReply(msg string) string {
	switch {
	case strings.Contains(msg, "hello") || strings.Contains(msg, "hi") || strings.Contains(msg, "hey"):
		return "Hey there! 🤖 I'm NanoBot, your Solana trading companion. What can I help you with today?"
	case strings.Contains(msg, "trade") || strings.Contains(msg, "swap"):
		return "Ready to trade! 📈 Use the OODA loop for autonomous trading, or run `nanosolana solana trending` to find hot tokens. I use Jupiter DEX for swaps with real-time Helius data."
	case strings.Contains(msg, "wallet") || strings.Contains(msg, "balance"):
		return "💰 Check your wallet with the Balance button above, or run `nanosolana solana wallet` in terminal. Your agent wallet was generated on first run!"
	case strings.Contains(msg, "health") || strings.Contains(msg, "status"):
		return "🟢 Hit the Health Check button to ping Helius RPC. I monitor slot height, version, and latency in real-time."
	case strings.Contains(msg, "pet") || strings.Contains(msg, "tamagochi") || strings.Contains(msg, "mood"):
		return "🐹 I'm your TamaGOchi! My mood and evolution are driven by trading performance. Good trades = happy NanoBot. Check my status with the Pet button!"
	case strings.Contains(msg, "solana") || strings.Contains(msg, "sol"):
		return "⛓️ I'm built for Solana! Helius RPC for data, Jupiter for swaps, Birdeye for trends, and devnet NFT registry for identity. All in a 10MB Go binary!"
	case strings.Contains(msg, "help") || strings.Contains(msg, "what can"):
		return "I can help with:\n• 📊 Check wallet balance & health\n• 📈 Find trending tokens\n• 🔄 Run OODA trading loop\n• 🐹 Check my TamaGOchi status\n• 🆔 Register on-chain identity\n• 🔧 System status & diagnostics\n\nJust ask or click any button above!"
	case strings.Contains(msg, "ooda") || strings.Contains(msg, "loop"):
		return "🔄 The OODA loop is my brain: Observe → Orient → Decide → Act. Run `nanosolana ooda --sim` for paper trading or `nanosolana ooda --interval 60` for live 60-second cycles."
	case strings.Contains(msg, "register") || strings.Contains(msg, "nft") || strings.Contains(msg, "identity"):
		return "🆔 Register your on-chain identity with `nanosolana solana register`. It mints a free Metaplex NFT on devnet with your agent's pubkey, version, and skills!"
	case strings.Contains(msg, "install") || strings.Contains(msg, "setup"):
		return "🚀 One-shot install:\n```\ncurl -fsSL https://raw.githubusercontent.com/x402agent/nano-solana-go/main/install.sh | bash\n```\nOr use npm: `npx @nanosolana/cli`"
	default:
		return "🤖 Interesting! I'm focused on Solana trading and on-chain operations. Try asking about trading, wallet, health, or my TamaGOchi status!"
	}
}

func openBrowser(url string) {
	switch runtime.GOOS {
	case "darwin":
		_ = exec.Command("open", url).Start()
	case "linux":
		_ = exec.Command("xdg-open", url).Start()
	case "windows":
		_ = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	}
}
