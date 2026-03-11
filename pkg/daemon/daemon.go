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
	"syscall"
	"time"

	"github.com/8bitlabs/mawdbot/pkg/bus"
	"github.com/8bitlabs/mawdbot/pkg/channels"
	"github.com/8bitlabs/mawdbot/pkg/channels/telegram"
	"github.com/8bitlabs/mawdbot/pkg/config"
	"github.com/8bitlabs/mawdbot/pkg/solana"
	"github.com/8bitlabs/mawdbot/pkg/tamagochi"
	mawdx402 "github.com/8bitlabs/mawdbot/pkg/x402"
)

// Daemon is the core long-running process.
type Daemon struct {
	cfg     *config.Config
	bus     *bus.MessageBus
	chanMgr *channels.Manager
	pet     *tamagochi.TamaGOchi
	wallet  *solana.Wallet
	rpc     *solana.SolanaRPC
	x402    *mawdx402.Service
	ctx     context.Context
	cancel  context.CancelFunc
}

// New creates a daemon from configuration.
func New(cfg *config.Config) (*Daemon, error) {
	ctx, cancel := context.WithCancel(context.Background())
	msgBus := bus.NewMessageBus()
	chanMgr := channels.NewManager(msgBus)

	d := &Daemon{
		cfg:     cfg,
		bus:     msgBus,
		chanMgr: chanMgr,
		ctx:     ctx,
		cancel:  cancel,
	}

	return d, nil
}

// Run starts all subsystems and blocks until shutdown.
func (d *Daemon) Run() error {
	log.Println("┌──────────────────────────────────────────────┐")
	log.Println("│  🦞 MawdBot Nano Solana Daemon               │")
	log.Println("│  Autonomous Agent · OODA Loop · TamaGOchi    │")
	log.Println("└──────────────────────────────────────────────┘")

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
	d.pet = tamagochi.New("MawdBot")

	// Feed the pet its wallet info
	var balanceSOL float64
	if d.rpc != nil {
		if bal, err := d.rpc.GetBalance(wallet.PublicKey); err == nil {
			balanceSOL = bal
		}
	}
	d.pet.OnWalletCreated(wallet.PublicKeyStr(), balanceSOL)

	// ── 4. Telegram Channel ──────────────────────────────────────
	if d.cfg.Channels.Telegram.Enabled || os.Getenv("TELEGRAM_BOT_TOKEN") != "" {
		tg, err := telegram.NewTelegramChannel(d.cfg, d.bus)
		if err != nil {
			log.Printf("[DAEMON] ⚠️ Telegram init failed (non-fatal): %v", err)
		} else {
			d.chanMgr.Register(tg)
			log.Printf("[DAEMON] 📱 Telegram channel registered")
		}
	}

	// ── 5. x402 Payment Protocol ─────────────────────────────────
	x402Cfg := mawdx402.ConfigFromEnv()
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

	// ── 6. Start Channels ────────────────────────────────────────
	if err := d.chanMgr.StartAll(d.ctx); err != nil {
		log.Printf("[DAEMON] ⚠️ Channel start error: %v", err)
	}

	// ── 7. Outbound Message Dispatcher ───────────────────────────
	go d.dispatchOutbound()

	// ── 8. Inbound Message Handler ───────────────────────────────
	go d.handleInbound()

	// ── 9. Heartbeat (TamaGOchi + Health) ────────────────────────
	go d.heartbeat()

	// ── 10. Wait for Shutdown ────────────────────────────────────
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
	content := msg.Content

	switch {
	case content == "/start":
		return fmt.Sprintf("🦞 **MawdBot Nano Solana Agent**\n\n"+
			"I'm your autonomous trading lobster!\n\n"+
			"Commands:\n"+
			"/status — Agent & TamaGOchi status\n"+
			"/wallet — Wallet address & balance\n"+
			"/pet — TamaGOchi status\n"+
			"/trending — Trending tokens\n"+
			"/help — All commands")

	case content == "/status":
		return d.statusResponse()

	case content == "/wallet":
		return d.walletResponse()

	case content == "/pet":
		return d.pet.StatusString()

	case content == "/x402":
		return d.x402Response()

	case content == "/help":
		return "🦞 **MawdBot Commands**\n\n" +
			"/start — Welcome\n" +
			"/status — Agent status\n" +
			"/wallet — Wallet info\n" +
			"/pet — TamaGOchi status\n" +
			"/x402 — Payment gateway status\n" +
			"/trending — Trending tokens\n" +
			"/trades — Recent trades\n" +
			"/research <mint> — Research token\n" +
			"/ooda — Trigger OODA cycle"

	default:
		// Pass to LLM agent for natural language processing
		return fmt.Sprintf("🦞 Received: _%s_\n\n"+
			"(LLM agent processing not yet wired — use /help for commands)", content)
	}
}

func (d *Daemon) statusResponse() string {
	status := "🦞 **MawdBot Agent Status**\n\n"

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
	status += fmt.Sprintf("\n🦞 TamaGOchi: %s (Lvl %d)\n", petState.Name, petState.Level)
	status += fmt.Sprintf("😊 Mood: %s · Energy: %.0f%%\n", petState.Mood, petState.Energy*100)

	channelNames := d.chanMgr.List()
	status += fmt.Sprintf("\n📡 Channels: %v\n", channelNames)
	status += fmt.Sprintf("⏱️ Uptime: %dh\n", petState.Uptime)

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

			// Update balance for TamaGOchi
			if d.rpc != nil && d.wallet != nil {
				if bal, err := d.rpc.GetBalance(d.wallet.PublicKey); err == nil {
					d.pet.OnOODACycle(0, bal)
				}
			}
		}
	}
}

// ── Helpers ──────────────────────────────────────────────────────────

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
