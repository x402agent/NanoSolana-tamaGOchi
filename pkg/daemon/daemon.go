// Package daemon provides the nano Solana daemon — the always-on gateway
// that orchestrates the OODA agent, Telegram bot, TamaGOchi pet, and
// hardware I2C cluster into a single long-running process.
//
// Adapted from PicoClaw's gateway architecture for the MawdBot runtime.
// Designed for deployment on edge hardware (NVIDIA Orin Nano, RPi).
//
// Lifecycle:
//  1. Load config + env vars, ensure agent wallet
//  2. Initialize message bus + channel manager
//  3. Start Telegram channel (if configured)
//  4. Boot TamaGOchi pet from saved state
//  5. Launch OODA trading loop
//  6. Listen for shutdown signals (SIGINT/SIGTERM)
package daemon

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/8bitlabs/mawdbot/pkg/agent"
	"github.com/8bitlabs/mawdbot/pkg/bus"
	"github.com/8bitlabs/mawdbot/pkg/channels"
	"github.com/8bitlabs/mawdbot/pkg/channels/telegram"
	"github.com/8bitlabs/mawdbot/pkg/config"
	"github.com/8bitlabs/mawdbot/pkg/solana"
	"github.com/8bitlabs/mawdbot/pkg/tamagochi"
	mawdx402 "github.com/8bitlabs/mawdbot/pkg/x402"
)

// Options controls daemon runtime behavior.
type Options struct {
	PetName         string
	SeekerMode      bool
	DisableTelegram bool
	AutoStartOODA   bool
}

// DefaultOptions returns sane runtime defaults for daemon mode.
func DefaultOptions() Options {
	return Options{
		PetName:         "MawdBot",
		SeekerMode:      false,
		DisableTelegram: false,
		AutoStartOODA:   true,
	}
}

// Daemon is the core long-running process.
type Daemon struct {
	cfg     *config.Config
	opts    Options
	bus     *bus.MessageBus
	chanMgr *channels.Manager
	pet     *tamagochi.TamaGOchi
	wallet  *solana.Wallet
	rpc     *solana.SolanaRPC
	ooda    *agent.OODAAgent
	x402    *mawdx402.Service
	ctx     context.Context
	cancel  context.CancelFunc
}

// New creates a daemon from configuration using default options.
func New(cfg *config.Config) (*Daemon, error) {
	return NewWithOptions(cfg, DefaultOptions())
}

// NewWithOptions creates a daemon from configuration and runtime options.
func NewWithOptions(cfg *config.Config, opts Options) (*Daemon, error) {
	ctx, cancel := context.WithCancel(context.Background())
	msgBus := bus.NewMessageBus()
	chanMgr := channels.NewManager(msgBus)

	if strings.TrimSpace(opts.PetName) == "" {
		opts.PetName = "MawdBot"
	}

	d := &Daemon{
		cfg:     cfg,
		opts:    opts,
		bus:     msgBus,
		chanMgr: chanMgr,
		ctx:     ctx,
		cancel:  cancel,
	}

	return d, nil
}

// Run starts all subsystems and blocks until shutdown.
func (d *Daemon) Run() error {
	d.logBanner()

	// ── 1. Agentic Wallet ────────────────────────────────────────
	walletPath := d.cfg.Solana.WalletKeyPath
	wallet, err := solana.EnsureAgentWallet(walletPath)
	if err != nil {
		return fmt.Errorf("wallet: %w", err)
	}
	d.wallet = wallet
	log.Printf("[DAEMON] 🔑 Agent wallet: %s", wallet.PublicKeyStr())

	// ── 2. Native Solana RPC ─────────────────────────────────────
	rpcURL := d.cfg.Solana.HeliusRPCURL
	if rpcURL == "" {
		rpcURL = "https://api.mainnet-beta.solana.com"
	}
	network := d.cfg.Solana.HeliusNetwork
	if network == "" {
		network = "mainnet"
	}
	d.rpc = solana.NewSolanaRPC(rpcURL, wallet, network)
	log.Printf("[DAEMON] 🌐 Solana RPC: %s (%s)", truncateURL(rpcURL), network)

	// ── 3. TamaGOchi Pet ─────────────────────────────────────────
	d.pet = tamagochi.New(d.opts.PetName)

	// Feed the pet its wallet info.
	var balanceSOL float64
	if d.rpc != nil {
		if bal, err := d.rpc.GetBalance(wallet.PublicKey); err == nil {
			balanceSOL = bal
		}
	}
	d.pet.OnWalletCreated(wallet.PublicKeyStr(), balanceSOL)

	// ── 4. Telegram Channel ──────────────────────────────────────
	if d.opts.DisableTelegram {
		log.Printf("[DAEMON] 📱 Telegram disabled via CLI flag")
	} else if d.cfg.Channels.Telegram.Enabled || os.Getenv("TELEGRAM_BOT_TOKEN") != "" {
		tg, err := telegram.NewTelegramChannel(d.cfg, d.bus)
		if err != nil {
			log.Printf("[DAEMON] ⚠️ Telegram init failed (non-fatal): %v", err)
		} else {
			d.chanMgr.Register(tg)
			log.Printf("[DAEMON] 📱 Telegram channel registered")
		}
	}

	// ── 5. x402 Payment Protocol ─────────────────────────────────
	if d.cfg.X402.Enabled {
		x402Cfg := mawdx402.Config{
			FacilitatorURL:           d.cfg.X402.FacilitatorURL,
			FacilitatorAuthorization: d.cfg.X402.FacilitatorAuthorization,
			ProxyEnabled:             d.cfg.X402.ProxyEnabled,
			ProxyPort:                d.cfg.X402.ProxyPort,
			RecipientAddress:         d.cfg.X402.RecipientAddress,
			PaymentAmount:            d.cfg.X402.PaymentAmount,
			Network:                  d.cfg.X402.Network,
			PaywallEnabled:           d.cfg.X402.PaywallEnabled,
			PaywallPort:              d.cfg.X402.PaywallPort,
			Chains:                   mawdx402.ParseChains(d.cfg.X402.Chains),
		}

		x402Svc, err := mawdx402.NewService(wallet, x402Cfg)
		if err != nil {
			log.Printf("[DAEMON] ⚠️ x402 init failed (non-fatal): %v", err)
		} else {
			d.x402 = x402Svc
			log.Printf("[DAEMON] 💰 x402 payment gateway active")
			log.Printf("[DAEMON]    Facilitator: %s", x402Svc.FacilitatorURL())
			log.Printf("[DAEMON]    Signer: %s", x402Svc.SignerAddress())
			log.Printf("[DAEMON]    Chains: %d configured", len(x402Svc.Requirements()))
		}
	} else {
		log.Printf("[DAEMON] 💰 x402 disabled")
	}

	// ── 6. OODA Runtime ──────────────────────────────────────────
	if d.opts.AutoStartOODA {
		oodaHooks := &daemonHooks{pet: d.pet}
		d.ooda = agent.NewOODAAgent(d.cfg, oodaHooks)
		if err := d.ooda.Start(); err != nil {
			log.Printf("[DAEMON] ⚠️ OODA init failed (non-fatal): %v", err)
			d.ooda = nil
		} else {
			log.Printf("[DAEMON] 🔄 OODA runtime active (mode=%s, watchlist=%d)",
				d.cfg.OODA.Mode, len(d.cfg.OODA.Watchlist))
		}
	} else {
		log.Printf("[DAEMON] 🔄 OODA autostart disabled via CLI flag")
	}

	// ── 7. Start Channels ────────────────────────────────────────
	if err := d.chanMgr.StartAll(d.ctx); err != nil {
		log.Printf("[DAEMON] ⚠️ Channel start error: %v", err)
	}

	// ── 8. Outbound Message Dispatcher ───────────────────────────
	go d.dispatchOutbound()

	// ── 9. Inbound Message Handler ───────────────────────────────
	go d.handleInbound()

	// ── 10. Heartbeat (TamaGOchi + Health) ───────────────────────
	go d.heartbeat()

	// ── 11. Wait for Shutdown ────────────────────────────────────
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	log.Printf("[DAEMON] ✅ All systems online — waiting for signals...")

	channelNames := d.chanMgr.List()
	if len(channelNames) > 0 {
		log.Printf("[DAEMON] 📡 Active channels: %v", channelNames)
	}

	petState := d.pet.State()
	log.Printf("[DAEMON] 🦞 TamaGOchi '%s' — Stage: %s, Mood: %s, Level: %d",
		petState.Name, petState.Stage, petState.Mood, petState.Level)

	<-sigCh
	log.Println("\n[DAEMON] 🛑 Shutdown signal received...")

	return d.shutdown()
}

func (d *Daemon) shutdown() error {
	d.cancel()

	if d.ooda != nil {
		d.ooda.Stop()
	}

	// Stop channels
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	d.chanMgr.StopAll(shutdownCtx)

	// Stop x402 paywall
	if d.x402 != nil {
		d.x402.Stop(shutdownCtx)
	}

	// Close message bus
	d.bus.Close()

	log.Println("[DAEMON] 👋 MawdBot daemon stopped. 🦞 Droids Lead The Way.")
	return nil
}

func (d *Daemon) logBanner() {
	if d.opts.SeekerMode {
		log.Println("┌──────────────────────────────────────────────┐")
		log.Println("│  🦅 Seeker Nano Solana Daemon                │")
		log.Println("│  Seeker Mode · OODA Loop · TamaGOchi         │")
		log.Println("└──────────────────────────────────────────────┘")
		return
	}

	log.Println("┌──────────────────────────────────────────────┐")
	log.Println("│  🦞 MawdBot Nano Solana Daemon               │")
	log.Println("│  Autonomous Agent · OODA Loop · TamaGOchi    │")
	log.Println("└──────────────────────────────────────────────┘")
}

// ── Message Routing ──────────────────────────────────────────────────

func (d *Daemon) dispatchOutbound() {
	for {
		msg, ok := d.bus.SubscribeOutbound(d.ctx)
		if !ok {
			return
		}
		if err := d.chanMgr.DispatchOutbound(d.ctx, msg); err != nil {
			log.Printf("[DAEMON] ⚠️ Outbound dispatch error: %v", err)
		}
	}
}

func (d *Daemon) handleInbound() {
	for {
		msg, ok := d.bus.ConsumeInbound(d.ctx)
		if !ok {
			return
		}

		log.Printf("[DAEMON] 📩 Inbound from %s#%s: %s",
			msg.Channel, msg.SenderID, truncate(msg.Content, 60))

		// Process commands
		response := d.processCommand(msg)
		if response != "" {
			outMsg := bus.OutboundMessage{
				Channel: msg.Channel,
				ChatID:  msg.ChatID,
				Content: response,
			}
			if err := d.bus.PublishOutbound(d.ctx, outMsg); err != nil {
				log.Printf("[DAEMON] ⚠️ Outbound publish error: %v", err)
			}
		}
	}
}

func (d *Daemon) processCommand(msg bus.InboundMessage) string {
	content := strings.TrimSpace(msg.Content)
	cmd, args := parseCommand(content)

	switch cmd {
	case "/start":
		return fmt.Sprintf("🦅 **%s**\n\n"+
			"I'm your autonomous Go daemon — wallet, OODA engine, and TamaGOchi online.\n\n"+
			"Commands:\n"+
			"/status — Agent & TamaGOchi status\n"+
			"/wallet — Wallet address & balance\n"+
			"/pet — TamaGOchi pet status\n"+
			"/trending — Trending tokens\n"+
			"/trades — Recent trades\n"+
			"/research <mint> — Research token\n"+
			"/ooda — Trigger OODA cycle\n"+
			"/sim — Switch to simulated mode\n"+
			"/live — Switch to live mode\n"+
			"/x402 — Payment info\n"+
			"/help — All commands", d.daemonLabel())

	case "/status":
		return d.statusResponse()

	case "/wallet":
		return d.walletResponse()

	case "/pet":
		return d.pet.StatusString()

	case "/x402":
		return d.x402Response()

	case "/trending":
		return d.trendingResponse()

	case "/research":
		return d.researchResponse(args)

	case "/trades":
		return d.tradesResponse()

	case "/ooda":
		return d.oodaResponse()

	case "/sim":
		return d.setModeResponse("simulated")

	case "/live":
		return d.setModeResponse("live")

	case "/help":
		return fmt.Sprintf("🦅 **%s Commands**\n\n"+
			"/start — Welcome\n"+
			"/status — Agent status\n"+
			"/wallet — Wallet info\n"+
			"/pet — TamaGOchi pet status\n"+
			"/x402 — Payment gateway status\n"+
			"/trending — Trending tokens\n"+
			"/trades — Recent trades\n"+
			"/research <mint> — Research token\n"+
			"/ooda — Trigger OODA cycle\n"+
			"/sim — Switch to simulated\n"+
			"/live — Switch to live", d.daemonLabel())

	default:
		if content == "" {
			return ""
		}
		// Pass to LLM agent for natural language processing.
		return fmt.Sprintf("🦅 Received: _%s_\n\n"+
			"(Use /help for available daemon commands)", content)
	}
}

func (d *Daemon) statusResponse() string {
	status := fmt.Sprintf("🦅 **%s Status**\n\n", d.daemonLabel())

	if d.wallet != nil {
		status += fmt.Sprintf("🔑 Wallet: `%s`\n", d.wallet.PublicKeyStr())
	}

	if d.rpc != nil && d.wallet != nil {
		if bal, err := d.rpc.GetBalance(d.wallet.PublicKey); err == nil {
			status += fmt.Sprintf("💰 Balance: %.4f SOL\n", bal)
		}
		if slot, err := d.rpc.GetSlot(); err == nil {
			status += fmt.Sprintf("🔗 Slot: %d\n", slot)
		}
	}

	petState := d.pet.State()
	status += fmt.Sprintf("\n🐹 TamaGOchi: %s (Lvl %d)\n", petState.Name, petState.Level)
	status += fmt.Sprintf("😊 Mood: %s · Energy: %.0f%%\n", petState.Mood, petState.Energy*100)

	channelNames := d.chanMgr.List()
	status += fmt.Sprintf("\n📡 Channels: %v\n", channelNames)
	status += fmt.Sprintf("⏱️ Uptime: %dh\n", petState.Uptime)

	if d.ooda != nil {
		s := d.ooda.GetStats()
		status += fmt.Sprintf("\n🔄 OODA: mode=%v · cycles=%v · open=%v · closed=%v\n",
			s["mode"], s["cycles"], s["open"], s["closed_trades"])
	}

	if d.x402 != nil {
		status += fmt.Sprintf("\n💰 x402: %s (%d chains)\n",
			d.x402.FacilitatorURL(), len(d.x402.Requirements()))
	}

	return status
}

func (d *Daemon) x402Response() string {
	if d.x402 == nil {
		return "💰 x402 payment gateway not initialized"
	}
	return fmt.Sprintf("💰 **x402 Payment Gateway**\n\n%s", d.x402.Status())
}

func (d *Daemon) walletResponse() string {
	if d.wallet == nil {
		return "❌ No wallet configured"
	}

	pubkey := d.wallet.PublicKeyStr()
	response := fmt.Sprintf("🔑 **Agent Wallet**\n\n"+
		"Address: `%s`\n"+
		"Explorer: [Solscan](https://solscan.io/account/%s)\n",
		pubkey, pubkey)

	if d.rpc != nil {
		if bal, err := d.rpc.GetBalance(d.wallet.PublicKey); err == nil {
			response += fmt.Sprintf("💰 Balance: **%.6f SOL**\n", bal)
		}
	}

	return response
}

func (d *Daemon) trendingResponse() string {
	if strings.TrimSpace(d.cfg.Solana.BirdeyeAPIKey) == "" {
		return "🌐 Birdeye API key not configured. Set `BIRDEYE_API_KEY` to enable /trending."
	}

	client := solana.NewBirdeyeClient(d.cfg.Solana.BirdeyeAPIKey)
	tokens, err := client.GetTrendingV3(10)
	if err != nil {
		return fmt.Sprintf("❌ Trending lookup failed: %v", err)
	}
	if len(tokens) == 0 {
		return "🌐 No trending token data available right now."
	}

	var b strings.Builder
	b.WriteString("🌐 **Trending Solana Tokens**\n\n")
	for i, t := range tokens {
		sym := t.Symbol
		if sym == "" {
			sym = "?"
		}
		b.WriteString(fmt.Sprintf("%2d. `%s` $%.6f (%+.2f%%) · Vol: $%.0f · MCap: $%.0f\n",
			i+1, sym, t.Price, t.PriceChange24hPct, t.Volume24hUSD, t.MarketCap))
	}

	return strings.TrimSpace(b.String())
}

func (d *Daemon) researchResponse(args []string) string {
	if strings.TrimSpace(d.cfg.Solana.BirdeyeAPIKey) == "" {
		return "🔬 Birdeye API key not configured. Set `BIRDEYE_API_KEY` to enable /research."
	}
	if len(args) < 1 {
		return "Usage: `/research <mint>`"
	}

	mint := strings.TrimSpace(args[0])
	if mint == "" {
		return "Usage: `/research <mint>`"
	}

	client := solana.NewBirdeyeClient(d.cfg.Solana.BirdeyeAPIKey)

	var b strings.Builder
	b.WriteString(fmt.Sprintf("🔬 **Research** `%s`\n\n", mint))

	sections := 0

	if meta, err := client.GetTokenMetadata(mint); err == nil {
		sections++
		b.WriteString("📛 **Metadata**\n")
		b.WriteString(fmt.Sprintf("• %s (%s) · Decimals: %d\n", meta.Name, meta.Symbol, meta.Decimals))
		if meta.Extensions.Website != "" {
			b.WriteString(fmt.Sprintf("• Website: %s\n", meta.Extensions.Website))
		}
		if meta.Extensions.Twitter != "" {
			b.WriteString(fmt.Sprintf("• Twitter: %s\n", meta.Extensions.Twitter))
		}
		b.WriteString("\n")
	}

	if market, err := client.GetTokenMarketData(mint); err == nil {
		sections++
		b.WriteString("📊 **Market**\n")
		b.WriteString(fmt.Sprintf("• Price: $%.8f\n", market.Price))
		b.WriteString(fmt.Sprintf("• Market Cap: $%.0f · FDV: $%.0f\n", market.MarketCap, market.FDV))
		b.WriteString(fmt.Sprintf("• Liquidity: $%.0f · Holders: %d\n\n", market.Liquidity, market.Holder))
	}

	if trade, err := client.GetTokenTradeData(mint); err == nil {
		sections++
		b.WriteString("📈 **Trade (24h)**\n")
		b.WriteString(fmt.Sprintf("• Volume: $%.0f\n", trade.Volume24hUSD))
		b.WriteString(fmt.Sprintf("• Trades: %d (buy %d / sell %d)\n", trade.Trade24h, trade.Buy24h, trade.Sell24h))
		b.WriteString(fmt.Sprintf("• Price Change: %+.2f%% · Wallets: %d\n\n", trade.PriceChange24hPct, trade.UniqueWallet24h))
	}

	if sec, err := client.GetTokenSecurity(mint); err == nil {
		sections++
		b.WriteString("🛡️ **Security**\n")
		b.WriteString(fmt.Sprintf("• Mutable: %v\n", sec.IsMutable))
		b.WriteString(fmt.Sprintf("• Top10 Holder%%: %.2f%%\n", sec.Top10Percentage))
		b.WriteString(fmt.Sprintf("• Mint Auth: %s · Freeze Auth: %s\n", sec.HasMintAuth, sec.HasFreezeAuth))
	}

	if sections == 0 {
		return fmt.Sprintf("❌ No research data found for `%s`. Check mint and API availability.", mint)
	}

	return strings.TrimSpace(b.String())
}

func (d *Daemon) tradesResponse() string {
	if d.ooda == nil {
		return "📊 OODA runtime is not active. Start daemon without `--no-ooda` to enable /trades."
	}

	history := d.ooda.GetTradeHistory()
	if len(history) == 0 {
		return "📊 No trades recorded yet."
	}

	var closed, wins int
	for _, t := range history {
		if t.Outcome == "win" || t.Outcome == "loss" {
			closed++
			if t.Outcome == "win" {
				wins++
			}
		}
	}

	winRate := 0.0
	if closed > 0 {
		winRate = float64(wins) / float64(closed) * 100
	}

	var b strings.Builder
	b.WriteString("📊 **Recent Trades**\n\n")
	b.WriteString(fmt.Sprintf("Total: %d · Closed: %d · Win Rate: %.1f%%\n\n", len(history), closed, winRate))

	shown := 0
	for i := len(history) - 1; i >= 0 && shown < 5; i-- {
		t := history[i]
		shown++
		if t.Outcome == "open" {
			b.WriteString(fmt.Sprintf("• `%s` %s · OPEN · %s\n",
				t.Symbol, strings.ToUpper(t.Direction), t.Mode))
			continue
		}
		b.WriteString(fmt.Sprintf("• `%s` %s · %+.2f%% · %s (%s)\n",
			t.Symbol, strings.ToUpper(t.Direction), t.PnLPct,
			strings.ToUpper(t.Outcome), t.Reason))
	}

	return strings.TrimSpace(b.String())
}

func (d *Daemon) oodaResponse() string {
	if d.ooda == nil {
		return "🔄 OODA runtime is not active. Start daemon without `--no-ooda` to enable /ooda."
	}

	d.ooda.TriggerCycle()
	s := d.ooda.GetStats()

	return fmt.Sprintf("🔄 OODA cycle triggered.\n\nMode: `%v`\nCycles: `%v`\nOpen Positions: `%v`\nClosed Trades: `%v`\nWin Rate: `%.1f%%`\nAvg PnL: `%.2f%%`",
		s["mode"], s["cycles"], s["open"], s["closed_trades"],
		toFloat(s["win_rate"]), toFloat(s["avg_pnl_pct"]))
}

func (d *Daemon) setModeResponse(mode string) string {
	if d.ooda == nil {
		return "🔄 OODA runtime is not active. Start daemon without `--no-ooda` to switch /sim or /live."
	}

	d.ooda.SetMode(mode)
	return fmt.Sprintf("✅ OODA mode switched to `%s`", mode)
}

func (d *Daemon) daemonLabel() string {
	if d.opts.SeekerMode {
		return "Seeker Nano Solana Daemon"
	}
	return "NanoSolana TamaGObot"
}

// ── Heartbeat ────────────────────────────────────────────────────────

func (d *Daemon) heartbeat() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-d.ctx.Done():
			return
		case <-ticker.C:
			d.pet.OnHeartbeat()

			// Update balance for TamaGOchi.
			if d.rpc != nil && d.wallet != nil {
				if bal, err := d.rpc.GetBalance(d.wallet.PublicKey); err == nil {
					d.pet.OnOODACycle(0, bal)
				}
			}
		}
	}
}

type daemonHooks struct {
	agent.NoopHooks
	pet *tamagochi.TamaGOchi
}

func (h *daemonHooks) OnTradeClose(_ string, _ string, pnl float64, outcome, _ string) {
	if h.pet == nil {
		return
	}
	h.pet.OnTrade(outcome == "win", pnl/100.0)
}

// ── Helpers ──────────────────────────────────────────────────────────

func parseCommand(content string) (string, []string) {
	fields := strings.Fields(strings.TrimSpace(content))
	if len(fields) == 0 {
		return "", nil
	}
	return strings.ToLower(fields[0]), fields[1:]
}

func toFloat(v interface{}) float64 {
	switch t := v.(type) {
	case float64:
		return t
	case float32:
		return float64(t)
	case int:
		return float64(t)
	case int64:
		return float64(t)
	default:
		return 0
	}
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

func truncateURL(url string) string {
	if len(url) > 50 {
		return url[:47] + "..."
	}
	return url
}
