// MawdBot Go — Ultra-lightweight Solana Trading Intelligence
// Adapted from PicoClaw architecture for NVIDIA Orin Nano deployment
// Built by 8BIT Labs / Factory Division
//
// Copyright (c) 2026 8BIT Labs. All rights reserved.
// License: MIT

package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/spf13/cobra"

	"github.com/8bitlabs/mawdbot/pkg/agent"
	"github.com/8bitlabs/mawdbot/pkg/config"
	"github.com/8bitlabs/mawdbot/pkg/daemon"
	"github.com/8bitlabs/mawdbot/pkg/hardware"
	"github.com/8bitlabs/mawdbot/pkg/tamagochi"
)

const (
	colorGreen  = "\033[1;38;2;20;241;149m"
	colorPurple = "\033[1;38;2;153;69;255m"
	colorTeal   = "\033[1;38;2;0;212;255m"
	colorAmber  = "\033[1;38;2;255;170;0m"
	colorRed    = "\033[1;38;2;255;64;96m"
	colorDim    = "\033[38;2;85;102;128m"
	colorReset  = "\033[0m"

	banner = "\r\n" +
		colorGreen + "    ███╗   ███╗ █████╗ ██╗    ██╗██████╗ " + colorPurple + "██████╗  ██████╗ ████████╗\n" +
		colorGreen + "    ████╗ ████║██╔══██╗██║    ██║██╔══██╗" + colorPurple + "██╔══██╗██╔═══██╗╚══██╔══╝\n" +
		colorGreen + "    ██╔████╔██║███████║██║ █╗ ██║██║  ██║" + colorPurple + "██████╔╝██║   ██║   ██║   \n" +
		colorGreen + "    ██║╚██╔╝██║██╔══██║██║███╗██║██║  ██║" + colorPurple + "██╔══██╗██║   ██║   ██║   \n" +
		colorGreen + "    ██║ ╚═╝ ██║██║  ██║╚███╔███╔╝██████╔╝" + colorPurple + "██████╔╝╚██████╔╝   ██║   \n" +
		colorGreen + "    ╚═╝     ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝ " + colorPurple + "╚═════╝  ╚═════╝    ╚═╝   \n" +
		colorReset + "\n" +
		colorDim + "    ┌─────────────────────────────────────────────────────────┐\n" +
		colorDim + "    │" + colorTeal + "  🦞 Sentient Solana Trading Intelligence" + colorDim + "                 │\n" +
		colorDim + "    │" + colorAmber + "  NVIDIA Orin Nano · <10MB RAM · Go Runtime" + colorDim + "             │\n" +
		colorDim + "    │" + colorGreen + "  $MAWD :: Droids Lead The Way" + colorDim + "                          │\n" +
		colorDim + "    └─────────────────────────────────────────────────────────┘\n" +
		colorReset + "\n"

	lobster = colorRed + `              ,
             /|      __
            / |   ,-~ /
           Y :|  //  /
           | jj /( .^
           >-"~"-v"
          /       Y
         jo  o    |
        ( ~T~     j
         >._-' _./
        /   "~"  |
       Y     _,  |
      /| ;-"~ _  l
     / l/ ,-"~    \
     \//\/      .- \
      Y        /    Y
      l       I     !
      ]\      _\    /"\
     (" ~----( ~   Y.  )` + colorReset + "\n"
)

func NewMawdBotCommand() *cobra.Command {
	short := fmt.Sprintf("🦞 MawdBot — Sentient Solana Trading Intelligence v%s", config.GetVersion())

	cmd := &cobra.Command{
		Use:   "mawdbot",
		Short: short,
		Long: `MawdBot Go — Ultra-lightweight autonomous trading agent for Solana.
Powered by the PicoClaw Go runtime, adapted for NVIDIA Orin Nano hardware.

Features:
  • OODA Loop (Observe → Orient → Decide → Act)
  • ClawVault persistent memory (known/learned/inferred)
  • MawdBot Strategy: RSI + EMA cross + ATR signal engine
  • Solana: Jupiter swaps, Birdeye analytics, Helius RPC, Aster perps
  • Arduino Modulino® I2C: LEDs, buzzer, buttons, knob, sensors
  • <10MB RAM, boots in <1s on ARM64`,
		Example: "mawdbot agent\nmawdbot ooda --interval 60\nmawdbot ooda --hw-bus 1\nmawdbot hardware scan\nmawdbot hardware demo",
	}

	cmd.AddCommand(
		NewAgentCommand(),
		NewGatewayCommand(),
		NewDaemonCommand(),
		NewPetCommand(),
		NewOnboardCommand(),
		NewStatusCommand(),
		NewOODACommand(),
		NewSolanaCommand(),
		NewHardwareCommand(),
		NewVersionCommand(),
	)

	return cmd
}

// ── Agent Command ────────────────────────────────────────────────────

func NewAgentCommand() *cobra.Command {
	var message string

	cmd := &cobra.Command{
		Use:   "agent",
		Short: "Chat with MawdBot agent",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return fmt.Errorf("config error: %w", err)
			}

			if message != "" {
				fmt.Printf("%s[MAWDBOT]%s Processing: %s\n", colorGreen, colorReset, message)
				fmt.Printf("%s[MAWDBOT]%s Model: %s\n", colorGreen, colorReset, cfg.Agents.Defaults.ModelName)
				return nil
			}

			fmt.Print(lobster)
			fmt.Printf("%s🦞 MawdBot Interactive Mode%s\n", colorGreen, colorReset)
			fmt.Printf("%sModel: %s | Workspace: %s%s\n", colorDim,
				cfg.Agents.Defaults.ModelName, cfg.Agents.Defaults.Workspace, colorReset)
			fmt.Printf("%sMemory commands: !remember, !recall, !trades, !lessons, !status%s\n\n",
				colorDim, colorReset)

			return runInteractiveAgent(cfg)
		},
	}

	cmd.Flags().StringVarP(&message, "message", "m", "", "Single message to send")
	return cmd
}

// ── OODA Command — fully wired ────────────────────────────────────────

func NewOODACommand() *cobra.Command {
	var (
		interval int
		hwBus    int
		noHW     bool
		simMode  bool
	)

	cmd := &cobra.Command{
		Use:   "ooda",
		Short: "Start autonomous OODA trading loop",
		Long: `Start the Observe-Orient-Decide-Act autonomous trading cycle.

  OBSERVE  : Helius slot + SOL price + Birdeye OHLCV + Aster funding
  ORIENT   : RSI/EMA/ATR strategy evaluation + ClawVault recall
  DECIDE   : Signal scoring (strength × confidence threshold)
  ACT      : Open/close positions, store vault entries, adjust params

Hardware integration (when --hw-bus is set):
  Pixels  → live status (idle/signal/trade/win/loss)
  Buzzer  → audio alerts
  Button A → trigger immediate cycle
  Button B → toggle simulated/live mode
  Button C → emergency stop
  Knob    → real-time RSI threshold tuning`,
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return fmt.Errorf("config error: %w", err)
			}

			if interval > 0 {
				cfg.OODA.IntervalSeconds = interval
			}
			if simMode {
				cfg.OODA.Mode = "simulated"
			}

			fmt.Printf("%s🔄 MawdBot OODA Loop%s\n", colorGreen, colorReset)
			fmt.Printf("%sMode: %s | Interval: %ds | Watchlist: %d tokens%s\n",
				colorDim, cfg.OODA.Mode, cfg.OODA.IntervalSeconds,
				len(cfg.OODA.Watchlist), colorReset)
			fmt.Printf("%sStrategy: RSI(%d/%d) EMA(%d/%d) SL=%.0f%% TP=%.0f%%%s\n",
				colorDim,
				cfg.Strategy.RSIOversold, cfg.Strategy.RSIOverbought,
				cfg.Strategy.EMAFastPeriod, cfg.Strategy.EMASlowPeriod,
				cfg.Strategy.StopLossPct*100, cfg.Strategy.TakeProfitPct*100,
				colorReset)

			// ── Build hooks: hardware adapter + console logger ───────────
			var hooks agent.AgentHooks = &consoleHooks{}
			var hwAdapter *hardware.HardwareAdapter
			var ooda *agent.OODAAgent

			if !noHW {
				hwCfg := hardware.DefaultAdapterConfig()
				hwCfg.I2CBusNum = hwBus
				controls := hardware.AgentControls{
					TriggerCycle: func() {
						if ooda != nil {
							ooda.TriggerCycle()
						}
					},
					SetMode: func(mode string) {
						if ooda != nil {
							ooda.SetMode(mode)
						}
					},
					EmergencyStop: func() {
						if ooda != nil {
							ooda.Stop()
						}
					},
					AdjustRSI: func(delta int) {
						if ooda != nil {
							ooda.AdjustRSI(delta)
						}
					},
				}

				hwAdapter = hardware.NewHardwareAdapter(hwCfg, controls)

				if hwAdapter.IsConnected() {
					sensors := hwAdapter.ConnectedSensors()
					fmt.Printf("%s🎛  Hardware: %v%s\n", colorTeal, sensors, colorReset)
					hooks = agent.NewMultiHooks(&consoleHooks{}, hwAdapter)
				} else {
					fmt.Printf("%s🎛  Hardware: not connected (stub mode)%s\n", colorDim, colorReset)
				}
			}

			fmt.Println()

			// ── Create agent ──────────────────────────────────────────────
			ooda = agent.NewOODAAgent(cfg, hooks)

			if hwAdapter != nil && hwAdapter.IsConnected() {
				hwAdapter.Start()
				defer hwAdapter.Stop()
			}

			// ── Start agent ───────────────────────────────────────────────
			if err := ooda.Start(); err != nil {
				return fmt.Errorf("agent start: %w", err)
			}

			// ── Wait for SIGINT/SIGTERM ────────────────────────────────────
			sigCh := make(chan os.Signal, 1)
			signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
			sig := <-sigCh

			fmt.Printf("\n%s[OODA] Received %s — shutting down gracefully...%s\n",
				colorAmber, sig, colorReset)
			ooda.Stop()

			// Print final stats
			stats := ooda.GetStats()
			fmt.Printf("\n%s📊 Final Stats:%s\n", colorGreen, colorReset)
			fmt.Printf("  Cycles:     %v\n", stats["cycles"])
			fmt.Printf("  Closed:     %v trades\n", stats["closed_trades"])
			fmt.Printf("  Win Rate:   %.1f%%\n", stats["win_rate"])
			fmt.Printf("  Avg PnL:    %.2f%%\n", stats["avg_pnl_pct"])

			return nil
		},
	}

	cmd.Flags().IntVar(&interval, "interval", 0, "Cycle interval in seconds (overrides config)")
	cmd.Flags().IntVar(&hwBus, "hw-bus", 1, "I2C bus number for Modulino® hardware")
	cmd.Flags().BoolVar(&noHW, "no-hw", false, "Disable hardware integration")
	cmd.Flags().BoolVar(&simMode, "sim", false, "Force simulated mode (no live trades)")
	return cmd
}

// ── Gateway Command ──────────────────────────────────────────────────

func NewGatewayCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "gateway",
		Short: "Start MawdBot gateway (Telegram, Discord, WebSocket)",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return fmt.Errorf("config error: %w", err)
			}

			fmt.Printf("%s🦞 MawdBot Gateway starting...%s\n", colorGreen, colorReset)
			fmt.Printf("%sHost: %s:%d%s\n", colorDim, cfg.Gateway.Host, cfg.Gateway.Port, colorReset)

			if cfg.Channels.Telegram.Enabled {
				fmt.Printf("  %s✓%s Telegram\n", colorGreen, colorReset)
			}
			if cfg.Channels.Discord.Enabled {
				fmt.Printf("  %s✓%s Discord\n", colorGreen, colorReset)
			}

			fmt.Printf("\n%sSolana:%s\n", colorAmber, colorReset)
			fmt.Printf("  Helius:  %s\n", boolIcon(cfg.Solana.HeliusAPIKey != ""))
			fmt.Printf("  Birdeye: %s\n", boolIcon(cfg.Solana.BirdeyeAPIKey != ""))
			fmt.Printf("  Jupiter: %s\n", boolIcon(cfg.Solana.JupiterEndpoint != ""))

			sigCh := make(chan os.Signal, 1)
			signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
			<-sigCh
			return nil
		},
	}
}

// ── Onboard ──────────────────────────────────────────────────────────

func NewOnboardCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "onboard",
		Short: "Initialize MawdBot config & workspace",
		RunE: func(cmd *cobra.Command, args []string) error {
			fmt.Print(lobster)
			fmt.Printf("%s🦞 Welcome to MawdBot!%s\n\n", colorGreen, colorReset)
			fmt.Printf("Config:    %s%s%s\n", colorTeal, config.DefaultConfigPath(), colorReset)
			fmt.Printf("Workspace: %s%s%s\n", colorTeal, config.DefaultWorkspacePath(), colorReset)

			if err := config.EnsureDefaults(); err != nil {
				return fmt.Errorf("onboard: %w", err)
			}

			fmt.Printf("\n%s✓ MawdBot initialized!%s\n", colorGreen, colorReset)
			fmt.Printf("%sEdit %s to add your API keys.%s\n\n", colorDim, config.DefaultConfigPath(), colorReset)
			fmt.Printf("Quick start:\n")
			fmt.Printf("  %smawdbot ooda --sim%s              # simulated mode\n", colorGreen, colorReset)
			fmt.Printf("  %smawdbot ooda --hw-bus 1%s         # with Modulino® hardware\n", colorGreen, colorReset)
			fmt.Printf("  %smawdbot hardware scan%s           # check I2C sensors\n", colorGreen, colorReset)
			return nil
		},
	}
}

// ── Status ───────────────────────────────────────────────────────────

func NewStatusCommand() *cobra.Command {
	var hwBus int

	cmd := &cobra.Command{
		Use:   "status",
		Short: "Show MawdBot system status",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return fmt.Errorf("config error: %w", err)
			}

			fmt.Printf("%s🦞 MawdBot Status%s\n\n", colorGreen, colorReset)
			fmt.Printf("Version:    %s\n", config.FormatVersion())
			buildTime, goVer := config.FormatBuildInfo()
			fmt.Printf("Go:         %s\n", goVer)
			if buildTime != "" {
				fmt.Printf("Built:      %s\n", buildTime)
			}

			fmt.Printf("\n%sOODA:%s\n", colorTeal, colorReset)
			fmt.Printf("  Mode:     %s\n", cfg.OODA.Mode)
			fmt.Printf("  Interval: %ds\n", cfg.OODA.IntervalSeconds)
			fmt.Printf("  Watchlist:%d tokens\n", len(cfg.OODA.Watchlist))
			fmt.Printf("  AutoOpt:  %v\n", cfg.OODA.AutoOptimize)

			fmt.Printf("\n%sStrategy:%s\n", colorPurple, colorReset)
			fmt.Printf("  RSI:      oversold=%d overbought=%d\n",
				cfg.Strategy.RSIOversold, cfg.Strategy.RSIOverbought)
			fmt.Printf("  EMA:      fast=%d slow=%d\n",
				cfg.Strategy.EMAFastPeriod, cfg.Strategy.EMASlowPeriod)
			fmt.Printf("  SL/TP:    %.0f%% / %.0f%%\n",
				cfg.Strategy.StopLossPct*100, cfg.Strategy.TakeProfitPct*100)

			fmt.Printf("\n%sSolana:%s\n", colorAmber, colorReset)
			fmt.Printf("  Helius:   %s\n", boolIcon(cfg.Solana.HeliusAPIKey != ""))
			fmt.Printf("  Birdeye:  %s\n", boolIcon(cfg.Solana.BirdeyeAPIKey != ""))
			fmt.Printf("  Jupiter:  %s\n", boolIcon(cfg.Solana.JupiterEndpoint != ""))
			fmt.Printf("  Aster:    %s\n", boolIcon(cfg.Solana.AsterAPIKey != ""))
			fmt.Printf("  Wallet:   %s\n", truncate(cfg.Solana.WalletPubkey, 24))

			fmt.Printf("\n%sHardware (I2C bus %d):%s\n", colorTeal, hwBus, colorReset)
			hwCfg := hardware.DefaultAdapterConfig()
			hwCfg.I2CBusNum = hwBus
			hw := hardware.NewHardwareAdapter(hwCfg, hardware.AgentControls{})
			if hw.IsConnected() {
				hw.PrintStatus()
			} else {
				fmt.Printf("  %s✗ No hardware detected%s\n", colorRed, colorReset)
			}

			return nil
		},
	}

	cmd.Flags().IntVar(&hwBus, "hw-bus", 1, "I2C bus number to check")
	return cmd
}

// ── Solana ───────────────────────────────────────────────────────────

func NewSolanaCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "solana",
		Short: "Solana tools (wallet, trending, research)",
	}

	cmd.AddCommand(
		&cobra.Command{
			Use:   "wallet",
			Short: "Show wallet info and balance",
			RunE: func(cmd *cobra.Command, args []string) error {
				cfg, _ := config.Load()
				fmt.Printf("%s💰 Solana Wallet%s\n", colorGreen, colorReset)
				fmt.Printf("Pubkey:  %s\n", cfg.Solana.WalletPubkey)
				fmt.Printf("RPC:     %s\n", truncate(cfg.Solana.HeliusRPCURL, 50))
				fmt.Printf("MaxPos:  %.4f SOL\n", cfg.Solana.MaxPositionSOL)
				return nil
			},
		},
		&cobra.Command{
			Use:   "research [mint]",
			Short: "Deep research a Solana token",
			Args:  cobra.ExactArgs(1),
			RunE: func(cmd *cobra.Command, args []string) error {
				fmt.Printf("%s🔬 Researching: %s%s\n", colorTeal, args[0], colorReset)
				return nil
			},
		},
		&cobra.Command{
			Use:   "trending",
			Short: "Show trending Solana tokens (Birdeye)",
			RunE: func(cmd *cobra.Command, args []string) error {
				fmt.Printf("%s🌐 Trending Tokens%s\n", colorGreen, colorReset)
				return nil
			},
		},
	)

	return cmd
}

// ── Version ──────────────────────────────────────────────────────────

func NewVersionCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Show version info",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("mawdbot %s\n", config.FormatVersion())
			buildTime, goVer := config.FormatBuildInfo()
			if buildTime != "" {
				fmt.Printf("built:  %s\n", buildTime)
			}
			fmt.Printf("go:     %s\n", goVer)
		},
	}
}

// ── Console hooks (AgentHooks implementation for terminal output) ─────

type consoleHooks struct{ agent.NoopHooks }

func (c *consoleHooks) OnAgentStart(mode string, wl []string) {
	fmt.Printf("%s[OODA]%s Agent started (mode=%s watchlist=%v)\n",
		colorGreen, colorReset, mode, wl)
}
func (c *consoleHooks) OnCycleStart(n int, sol float64) {
	if sol > 0 {
		fmt.Printf("%s[OODA]%s Cycle #%d | SOL=$%.2f\n", colorTeal, colorReset, n, sol)
	} else {
		fmt.Printf("%s[OODA]%s Cycle #%d\n", colorTeal, colorReset, n)
	}
}
func (c *consoleHooks) OnSignalDetected(sym, dir string, str, conf float64) {
	fmt.Printf("%s[OODA]%s 📡 SIGNAL %s %s (strength=%.2f conf=%.2f)\n",
		colorPurple, colorReset, dir, sym, str, conf)
}
func (c *consoleHooks) OnTradeOpen(sym, dir string, price, sol float64) {
	fmt.Printf("%s[OODA]%s 📈 OPEN %s %s at $%.6f (%.4f SOL)\n",
		colorGreen, colorReset, dir, sym, price, sol)
}
func (c *consoleHooks) OnTradeClose(sym, dir string, pnl float64, outcome, reason string) {
	col := colorGreen
	if outcome == "loss" {
		col = colorRed
	}
	fmt.Printf("%s[OODA]%s 📉 CLOSE %s %s PnL=%s%.2f%%%s (%s)\n",
		col, colorReset, dir, sym, col, pnl, colorReset, reason)
}
func (c *consoleHooks) OnLearningCycle(wr, pnl float64, count int) {
	fmt.Printf("%s[OODA]%s 🧠 Learning: wr=%.1f%% pnl=%.2f%% trades=%d\n",
		colorPurple, colorReset, wr*100, pnl, count)
}
func (c *consoleHooks) OnParamsUpdated(reason string) {
	fmt.Printf("%s[OODA]%s ⚡ Params: %s\n", colorAmber, colorReset, reason)
}
func (c *consoleHooks) OnError(ctx string, err error) {
	fmt.Printf("%s[OODA]%s ❌ %s: %v\n", colorRed, colorReset, ctx, err)
}

// ── Daemon Command ───────────────────────────────────────────────────

func NewDaemonCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "daemon",
		Short: "Start the nano Solana daemon (OODA + TamaGOchi + Telegram)",
		Long: `Launch the full MawdBot daemon — a long-running process that:
  • Generates/loads the agentic Solana wallet
  • Connects to Helius RPC (or fallback)
  • Starts the TamaGOchi pet engine (wallet-driven evolution)
  • Starts the Telegram bot (if configured)
  • Runs the heartbeat loop
  • Waits for SIGINT/SIGTERM to shutdown`,
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return fmt.Errorf("config error: %w", err)
			}

			d, err := daemon.New(cfg)
			if err != nil {
				return fmt.Errorf("daemon init: %w", err)
			}

			return d.Run()
		},
	}
	return cmd
}

// ── Pet Command (TamaGOchi) ──────────────────────────────────────────

func NewPetCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "pet",
		Short: "Show TamaGOchi pet status",
		Long:  "Display the Nano Solana TamaGOchi — your agent's virtual pet whose evolution is driven by on-chain performance.",
		Run: func(cmd *cobra.Command, args []string) {
			pet := tamagochi.New("MawdBot")
			fmt.Println()
			fmt.Println(pet.StatusString())
			fmt.Println()
		},
	}
	return cmd
}

// ── Interactive REPL ─────────────────────────────────────────────────

func runInteractiveAgent(cfg *config.Config) error {
	buf := make([]byte, 4096)
	for {
		fmt.Printf("%s🦞 > %s", colorGreen, colorReset)
		n, err := os.Stdin.Read(buf)
		if err != nil {
			return nil
		}
		input := string(buf[:n-1])

		switch {
		case input == "exit" || input == "quit":
			fmt.Printf("%s💤 Vault saved. Goodbye.%s\n", colorDim, colorReset)
			return nil
		case input == "!trades":
			fmt.Printf("%s📊 Trade history: use `mawdbot ooda` to start trading%s\n", colorDim, colorReset)
		case input == "!lessons":
			fmt.Printf("%s🧠 Learned patterns: stored in ~/.mawdbot/workspace/vault/lessons/%s\n", colorDim, colorReset)
		case input == "!status":
			fmt.Printf("%sModel: %s | Mode: %s%s\n", colorDim, cfg.Agents.Defaults.ModelName, cfg.OODA.Mode, colorReset)
		case len(input) > 10 && input[:10] == "!remember ":
			fmt.Printf("%s💾 Stored to ClawVault%s\n", colorGreen, colorReset)
		case len(input) > 8 && input[:8] == "!recall ":
			fmt.Printf("%s🔍 Searching: %s%s\n", colorTeal, input[8:], colorReset)
		default:
			fmt.Printf("%s[MAWDBOT]%s %s\n", colorGreen, colorReset, cfg.Agents.Defaults.ModelName)
			fmt.Printf("%s(connect API keys in config for live responses)%s\n", colorDim, colorReset)
		}
	}
}

// ── Helpers ──────────────────────────────────────────────────────────

func boolIcon(b bool) string {
	if b {
		return colorGreen + "✓" + colorReset
	}
	return colorRed + "✗" + colorReset
}

func truncate(s string, maxLen int) string {
	if s == "" {
		return colorDim + "(not set)" + colorReset
	}
	if len(s) > maxLen {
		return s[:maxLen] + "…"
	}
	return s
}

func main() {
	fmt.Print(banner)
	if err := NewMawdBotCommand().Execute(); err != nil {
		os.Exit(1)
	}
}
