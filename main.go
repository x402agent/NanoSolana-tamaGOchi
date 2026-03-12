// NanoSolana — Ultra-lightweight Solana Trading Intelligence
// Built by 8BIT Labs / NanoSolana Labs
//
// Copyright (c) 2026 8BIT Labs. All rights reserved.
// License: MIT

package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/spf13/cobra"

	solanago "github.com/gagliardetto/solana-go"

	"github.com/8bitlabs/mawdbot/pkg/agent"
	"github.com/8bitlabs/mawdbot/pkg/config"
	"github.com/8bitlabs/mawdbot/pkg/daemon"
	gw "github.com/8bitlabs/mawdbot/pkg/gateway"
	"github.com/8bitlabs/mawdbot/pkg/hardware"
	"github.com/8bitlabs/mawdbot/pkg/node"
	"github.com/8bitlabs/mawdbot/pkg/onchain"
	"github.com/8bitlabs/mawdbot/pkg/seeker"
	"github.com/8bitlabs/mawdbot/pkg/solana"
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
		colorGreen + "    ███╗   ██╗ █████╗ ███╗   ██╗ ██████╗ " + colorPurple + "███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗ \n" +
		colorGreen + "    ████╗  ██║██╔══██╗████╗  ██║██╔═══██╗" + colorPurple + "██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗\n" +
		colorGreen + "    ██╔██╗ ██║███████║██╔██╗ ██║██║   ██║" + colorPurple + "███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║\n" +
		colorGreen + "    ██║╚██╗██║██╔══██║██║╚██╗██║██║   ██║" + colorPurple + "╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║\n" +
		colorGreen + "    ██║ ╚████║██║  ██║██║ ╚████║╚██████╔╝" + colorPurple + "███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║\n" +
		colorGreen + "    ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ " + colorPurple + "╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝\n" +
		colorReset + "\n" +
		colorDim + "    ┌──────────────────────────────────────────────────────────────────┐\n" +
		colorDim + "    │" + colorTeal + "  🐹 TamaGOchi — A GoBot on Solana" + colorDim + "                                │\n" +
		colorDim + "    │" + colorAmber + "  Powered by NanoSolana OS · Go Runtime · x402 Protocol" + colorDim + "           │\n" +
		colorDim + "    │" + colorGreen + "  Autonomous Trading Intelligence · <10MB · Boots in <1s" + colorDim + "          │\n" +
		colorDim + "    └──────────────────────────────────────────────────────────────────┘\n" +
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
	short := fmt.Sprintf("🦞 NanoSolana — Sentient Solana Trading Intelligence v%s", config.GetVersion())

	cmd := &cobra.Command{
		Use:   "nanosolana",
		Short: short,
		Long: `NanoSolana — Ultra-lightweight autonomous trading agent for Solana.
Powered by the NanoSolana Go runtime with native gateway and headless nodes.

Features:
  • OODA Loop (Observe → Orient → Decide → Act)
  • Sentient Memory Vault (known/learned/inferred)
  • NanoSolana Strategy: RSI + EMA cross + ATR signal engine
  • Solana: Jupiter swaps, Birdeye analytics, Helius RPC, Aster perps
  • Native Gateway: TCP bridge with Tailscale mesh + tmux sessions
  • Headless Nodes: Connect hardware (Orin Nano, RPi) over mesh
  • <10MB RAM, boots in <1s on ARM64`,
		Example: "nanosolana daemon\nnanosolana gateway start\nnanosolana node run\nnanosolana ooda --interval 60",
	}

	cmd.AddCommand(
		NewAgentCommand(),
		NewGatewayCommand(),
		NewNativeGatewayCommand(),
		NewDaemonCommand(),
		NewNodeCommand(),
		NewPetCommand(),
		NewOnboardCommand(),
		NewStatusCommand(),
		NewOODACommand(),
		NewSolanaCommand(),
		NewHardwareCommand(),
		NewSeekerCommand(),
		NewVersionCommand(),
	)

	return cmd
}

// ── Agent Command ────────────────────────────────────────────────────

func NewAgentCommand() *cobra.Command {
	var message string

	cmd := &cobra.Command{
		Use:   "agent",
		Short: "Chat with NanoSolana agent",
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
			fmt.Printf("%s🦞 NanoSolana Interactive Mode%s\n", colorGreen, colorReset)
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

			fmt.Printf("%s🔄 NanoSolana OODA Loop%s\n", colorGreen, colorReset)
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

// ── Gateway Command (legacy — channels) ──────────────────────────────

func NewGatewayCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "channels",
		Short: "Start NanoSolana channel gateway (Telegram, Discord)",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return fmt.Errorf("config error: %w", err)
			}

			fmt.Printf("%s🦞 NanoSolana Channel Gateway starting...%s\n", colorGreen, colorReset)
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

// ── Native Gateway Command (TCP bridge) ──────────────────────────────

func NewNativeGatewayCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "gateway",
		Short: "NanoSolana native TCP bridge gateway",
		Long: `The NanoSolana native gateway — a Go TCP bridge server that connects
headless hardware nodes to the daemon over Tailscale mesh networking.
No external dependencies required.`,
	}

	var (
		port     int
		bindAddr string
		noTS     bool
	)

	startCmd := &cobra.Command{
		Use:   "start",
		Short: "Start the native gateway bridge server",
		Example: `  nanosolana gateway start
  nanosolana gateway start --port 19001
  nanosolana gateway start --bind 100.88.46.29`,
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, _ := config.Load()

			bridgeCfg := gw.BridgeConfig{
				Port:         port,
				BindAddr:     bindAddr,
				UseTailscale: !noTS,
			}
			if bridgeCfg.Port == 0 {
				bridgeCfg.Port = cfg.GatewaySpawn.Port
			}

			fmt.Printf("%s🦞 NanoSolana Gateway%s\n\n", colorGreen, colorReset)

			bridge := gw.NewBridge(bridgeCfg, nil)
			ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
			defer cancel()

			if err := bridge.Start(ctx); err != nil {
				return err
			}

			fmt.Printf("\n%sBridge: %s%s\n", colorTeal, bridge.BridgeAddr(), colorReset)
			fmt.Printf("%sPair:   nanosolana node pair --bridge %s%s\n", colorDim, bridge.BridgeAddr(), colorReset)
			fmt.Printf("%sRun:    nanosolana node run  --bridge %s%s\n\n", colorDim, bridge.BridgeAddr(), colorReset)

			<-ctx.Done()
			bridge.Stop()
			return nil
		},
	}

	startCmd.Flags().IntVar(&port, "port", 18790, "Bridge port")
	startCmd.Flags().StringVar(&bindAddr, "bind", "", "Bind address (default: Tailscale IP or 0.0.0.0)")
	startCmd.Flags().BoolVar(&noTS, "no-tailscale", false, "Don't use Tailscale IP")

	stopCmd := &cobra.Command{
		Use:   "stop",
		Short: "Stop the gateway tmux session",
		RunE: func(cmd *cobra.Command, args []string) error {
			session := "nanosolana-gw"
			if err := gw.KillGateway(session); err != nil {
				return err
			}
			fmt.Printf("  %s✔%s Gateway session '%s' killed\n", colorGreen, colorReset, session)
			return nil
		},
	}

	cmd.AddCommand(startCmd, stopCmd)
	return cmd
}

// ── Onboard ──────────────────────────────────────────────────────────

func NewOnboardCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "onboard",
		Short: "Initialize NanoSolana config & workspace",
		RunE: func(cmd *cobra.Command, args []string) error {
			fmt.Print(lobster)
			fmt.Printf("%s🦞 Welcome to NanoSolana!%s\n\n", colorGreen, colorReset)
			fmt.Printf("Config:    %s%s%s\n", colorTeal, config.DefaultConfigPath(), colorReset)
			fmt.Printf("Workspace: %s%s%s\n", colorTeal, config.DefaultWorkspacePath(), colorReset)

			if err := config.EnsureDefaults(); err != nil {
				return fmt.Errorf("onboard: %w", err)
			}

			fmt.Printf("\n%s✓ NanoSolana initialized!%s\n", colorGreen, colorReset)
			fmt.Printf("%sEdit %s to add your API keys.%s\n\n", colorDim, config.DefaultConfigPath(), colorReset)
			fmt.Printf("Quick start:\n")
			fmt.Printf("  %snanosolana ooda --sim%s              # simulated mode\n", colorGreen, colorReset)
			fmt.Printf("  %snanosolana ooda --hw-bus 1%s         # with Modulino® hardware\n", colorGreen, colorReset)
			fmt.Printf("  %snanosolana hardware scan%s           # check I2C sensors\n", colorGreen, colorReset)
			return nil
		},
	}
}

// ── Status ───────────────────────────────────────────────────────────

func NewStatusCommand() *cobra.Command {
	var hwBus int

	cmd := &cobra.Command{
		Use:   "status",
		Short: "Show NanoSolana system status",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return fmt.Errorf("config error: %w", err)
			}

			fmt.Printf("%s🦞 NanoSolana Status%s\n\n", colorGreen, colorReset)
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
		Short: "Solana on-chain tools (wallet, balance, health, trending)",
	}

	cmd.AddCommand(
		&cobra.Command{
			Use:   "wallet",
			Short: "Show wallet info and balance",
			RunE: func(cmd *cobra.Command, args []string) error {
				cfg, _ := config.Load()
				fmt.Printf("%s💰 NanoSolana Wallet%s\n", colorGreen, colorReset)
				fmt.Printf("Pubkey:  %s\n", cfg.Solana.WalletPubkey)
				fmt.Printf("RPC:     %s\n", truncate(cfg.Solana.HeliusRPCURL, 50))
				fmt.Printf("MaxPos:  %.4f SOL\n", cfg.Solana.MaxPositionSOL)
				return nil
			},
		},
		&cobra.Command{
			Use:   "health",
			Short: "Check Helius RPC health and Solana network status",
			RunE: func(cmd *cobra.Command, args []string) error {
				cfg, _ := config.Load()
				oCfg := onchain.Config{
					HeliusRPCURL: cfg.Solana.HeliusRPCURL,
					HeliusAPIKey: cfg.Solana.HeliusAPIKey,
					HeliusWSSURL: cfg.Solana.HeliusWSSURL,
				}
				engine, err := onchain.NewEngine(oCfg)
				if err != nil {
					return fmt.Errorf("on-chain engine: %w", err)
				}
				defer engine.Close()

				ctx := cmd.Context()
				health, err := engine.CheckHealth(ctx)
				if err != nil {
					fmt.Printf("  %s✗%s Helius RPC: %v\n", colorRed, colorReset, err)
					return nil
				}

				fmt.Printf("%s⛓️  Solana Network Status%s\n\n", colorGreen, colorReset)
				fmt.Printf("  %sHealthy:%s  %s\n", colorDim, colorReset, boolIcon(health.Healthy))
				fmt.Printf("  %sVersion:%s  %s\n", colorDim, colorReset, health.Version)
				fmt.Printf("  %sSlot:%s     %d\n", colorDim, colorReset, health.Slot)
				fmt.Printf("  %sHeight:%s   %d\n", colorDim, colorReset, health.BlockHeight)
				fmt.Printf("  %sLatency:%s  %s\n", colorDim, colorReset, health.Latency.Round(time.Millisecond))

				// Priority fees
				fees, err := engine.GetPriorityFees(ctx)
				if err == nil {
					fmt.Printf("\n%s⚡ Priority Fees (µL)%s\n", colorAmber, colorReset)
					fmt.Printf("  Min:    %d\n", fees.Min)
					fmt.Printf("  Low:    %d\n", fees.Low)
					fmt.Printf("  Medium: %d\n", fees.Medium)
					fmt.Printf("  High:   %d\n", fees.High)
				}
				return nil
			},
		},
		&cobra.Command{
			Use:   "balance [pubkey]",
			Short: "Check SOL + token balances for a wallet",
			Args:  cobra.MaximumNArgs(1),
			RunE: func(cmd *cobra.Command, args []string) error {
				cfg, _ := config.Load()
				oCfg := onchain.Config{
					HeliusRPCURL: cfg.Solana.HeliusRPCURL,
					HeliusAPIKey: cfg.Solana.HeliusAPIKey,
					HeliusWSSURL: cfg.Solana.HeliusWSSURL,
				}
				engine, err := onchain.NewEngine(oCfg)
				if err != nil {
					return fmt.Errorf("on-chain engine: %w", err)
				}
				defer engine.Close()

				pubkeyStr := cfg.Solana.WalletPubkey
				if len(args) > 0 {
					pubkeyStr = args[0]
				}
				if pubkeyStr == "" {
					return fmt.Errorf("no pubkey — set SOLANA_WALLET_PUBKEY or pass as argument")
				}

				pubkey := solanago.MustPublicKeyFromBase58(pubkeyStr)
				ctx := cmd.Context()

				// SOL balance
				bal, err := engine.GetSOLBalance(ctx, pubkey)
				if err != nil {
					return fmt.Errorf("get balance: %w", err)
				}

				fmt.Printf("%s💰 Wallet: %s%s\n\n", colorGreen, pubkey.Short(6), colorReset)
				fmt.Printf("  %sSOL:%s    %.9f SOL (%d lamports)\n", colorAmber, colorReset, bal.SOL, bal.Lamports)

				// SPL tokens
				tokens, err := engine.GetTokenBalances(ctx, pubkey)
				if err != nil {
					fmt.Printf("  %s⚠️  Token fetch failed: %v%s\n", colorDim, err, colorReset)
					return nil
				}

				if len(tokens) > 0 {
					fmt.Printf("\n  %sSPL Tokens:%s\n", colorTeal, colorReset)
					for _, t := range tokens {
						mintShort := t.Mint
						if len(mintShort) > 12 {
							mintShort = t.Mint[:6] + "..." + t.Mint[len(t.Mint)-4:]
						}
						fmt.Printf("    %s  %.6f\n", mintShort, t.UIAmount)
					}
				} else {
					fmt.Printf("\n  %sNo SPL tokens%s\n", colorDim, colorReset)
				}

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
		&cobra.Command{
			Use:   "register",
			Short: "Register this agent on-chain (devnet Metaplex NFT)",
			Long: `Mint a gasless NFT on Solana devnet to register this agent on-chain.
The NFT contains your agent's pubkey, version, skills, and a unique fingerprint.
This serves as the agent's verifiable on-chain identity.

Devnet SOL is auto-airdropped if needed (zero cost).`,
			RunE: func(cmd *cobra.Command, args []string) error {
				cfg, _ := config.Load()
				fmt.Printf("\n%s⛓️  NanoSolana Agent Registration%s\n\n", colorGreen, colorReset)

				// Load agent wallet
				wallet, err := solana.EnsureAgentWallet(cfg.Solana.WalletKeyPath)
				if err != nil {
					return fmt.Errorf("wallet required: %w", err)
				}
				fmt.Printf("  %sAgent:%s   %s\n", colorDim, colorReset, wallet.PublicKeyStr())

				// Check for existing registration
				if reg, err := onchain.LoadRegistration(); err == nil {
					fmt.Printf("  %sStatus:%s  Already registered!\n", colorDim, colorReset)
					fmt.Printf("  %sMint:%s    %s\n", colorDim, colorReset, reg.Result.MintAddress)
					fmt.Printf("  %sTx:%s      %s\n", colorDim, colorReset, reg.Result.TxSignature[:16]+"...")
					fmt.Printf("  %sNetwork:%s %s\n", colorDim, colorReset, reg.Result.Network)
					fmt.Printf("\n  %sExplorer: https://explorer.solana.com/address/%s?cluster=devnet%s\n\n",
						colorDim, reg.Result.MintAddress, colorReset)
					return nil
				}

				// Skills from config
				skills := []string{"ooda-trading", "solana-rpc", "jupiter-swaps"}
				if cfg.Solana.BirdeyeAPIKey != "" {
					skills = append(skills, "birdeye-analytics")
				}
				if cfg.Solana.AsterAPIKey != "" {
					skills = append(skills, "aster-perps")
				}

				fmt.Printf("  %sSkills:%s  %v\n", colorDim, colorReset, skills)
				fmt.Printf("  %sNetwork:%s devnet (gasless)\n\n", colorDim, colorReset)

				ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
				defer cancel()

				result, err := onchain.RegisterAgent(ctx, wallet.GetPrivateKey(), config.FormatVersion(), skills)
				if err != nil {
					return fmt.Errorf("registration failed: %w", err)
				}

				fmt.Printf("\n  %s✅ Agent registered on-chain!%s\n\n", colorGreen, colorReset)
				fmt.Printf("  %sMint:%s    %s\n", colorDim, colorReset, result.MintAddress)
				fmt.Printf("  %sTx:%s      %s\n", colorDim, colorReset, result.TxSignature[:16]+"...")
				fmt.Printf("  %sNetwork:%s %s\n", colorDim, colorReset, result.Network)
				fmt.Printf("  %sSaved:%s   ~/.nanosolana/registry/registration.json\n\n", colorDim, colorReset)
				fmt.Printf("  %sExplorer: https://explorer.solana.com/tx/%s?cluster=devnet%s\n\n",
					colorAmber, result.TxSignature, colorReset)
				return nil
			},
		},
		&cobra.Command{
			Use:   "registry",
			Short: "Show on-chain agent registration status",
			RunE: func(cmd *cobra.Command, args []string) error {
				reg, err := onchain.LoadRegistration()
				if err != nil {
					fmt.Printf("%s⚠️  No registration found. Run: nanosolana solana register%s\n", colorAmber, colorReset)
					return nil
				}
				fmt.Printf("\n%s⛓️  Agent Registration%s\n\n", colorGreen, colorReset)
				fmt.Printf("  %sAgent:%s   %s\n", colorDim, colorReset, reg.Result.AgentPubkey)
				fmt.Printf("  %sMint:%s    %s\n", colorDim, colorReset, reg.Result.MintAddress)
				fmt.Printf("  %sTx:%s      %s\n", colorDim, colorReset, reg.Result.TxSignature[:16]+"...")
				fmt.Printf("  %sNetwork:%s %s\n", colorDim, colorReset, reg.Result.Network)
				fmt.Printf("  %sSaved:%s   %s\n\n", colorDim, colorReset, reg.SavedAt)
				fmt.Printf("  %sExplorer:%s https://explorer.solana.com/address/%s?cluster=devnet%s\n\n",
					colorDim, colorReset, reg.Result.MintAddress, colorReset)
				return nil
			},
		},
	)

	return cmd
}

// ── Seeker ───────────────────────────────────────────────────────────

func NewSeekerCommand() *cobra.Command {
	var bridgePort int

	cmd := &cobra.Command{
		Use:   "seeker",
		Short: "NanoSolana agent for the Solana Seeker phone",
		Long: `Start the NanoSolana agent on the Solana Seeker phone.

Replaces the Node.js + OpenClaw stack with a native Go binary (~10MB).
Connects to the Android Bridge for device capabilities (battery, GPS,
clipboard, TTS) and runs the full OODA trading loop with Helius RPC,
Jupiter swaps, and TamaGOchi pet.

Architecture:
  Android App (Kotlin/Compose)
   └─ Foreground Service
       └─ NanoSolana binary (ARM64, ~10MB)
           ├─ OODA trading loop
           ├─ Solana on-chain engine (Helius)
           ├─ Jupiter swap execution
           ├─ TamaGOchi pet
           ├─ Telegram bot
           └─ Android Bridge client (localhost:8765)`,
		Example: `  nanosolana seeker
  nanosolana seeker --bridge-port 8765`,
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg := seeker.DefaultSeekerConfig()
			if bridgePort > 0 {
				cfg.BridgePort = bridgePort
			}

			agent := seeker.NewAgent(cfg)
			return agent.Run(cmd.Context())
		},
	}

	cmd.Flags().IntVar(&bridgePort, "bridge-port", 8765, "Android Bridge HTTP port")

	return cmd
}

// ── Version ──────────────────────────────────────────────────────────

func NewVersionCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Show version info",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("nanosolana %s\n", config.FormatVersion())
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
		Short: "Start the NanoSolana daemon (OODA + TamaGOchi + Telegram)",
		Long: `Launch the full NanoSolana daemon — a long-running process that:
  • Generates/loads the agentic Solana wallet
  • Connects to Helius RPC (or fallback)
  • Starts the TamaGOchi pet engine (wallet-driven evolution)
  • Starts the Telegram bot (if configured)
  • Optionally spawns a NanoSolana Gateway (tmux + Tailscale)
  • Runs the heartbeat loop
  • Waits for SIGINT/SIGTERM to shutdown`,
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return fmt.Errorf("config error: %w", err)
			}

			// Optionally auto-spawn gateway
			if cfg.GatewaySpawn.AutoSpawn {
				spawnCfg := gw.SpawnConfig{
					Port:         cfg.GatewaySpawn.Port,
					TMUXSession:  cfg.GatewaySpawn.TMUXSession,
					UseTailscale: cfg.GatewaySpawn.UseTailscale,
					ForceBind:    cfg.GatewaySpawn.Force,
				}
				result, err := gw.SpawnGateway(spawnCfg)
				if err != nil {
					log.Printf("[DAEMON] ⚠️ Gateway spawn failed (non-fatal): %v", err)
				} else if result.AlreadyExists {
					log.Printf("[DAEMON] 🌐 Gateway already running: %s", result.BridgeAddr)
				} else {
					log.Printf("[DAEMON] 🌐 Gateway spawned: %s (tmux: %s)", result.BridgeAddr, result.TMUXSession)
				}
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

// ── Node Command (Headless Bridge Client) ────────────────────────────

func NewNodeCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "node",
		Short: "Headless node client for hardware ↔ gateway communication",
		Long: `Connect NanoSolana hardware (Orin Nano, RPi, workstation) to the
native gateway over TCP. Supports pairing, voice transcript forwarding, chat
subscription with TTS, and mDNS advertising.

The gateway can be started via 'nanosolana gateway start'.`,
	}

	cmd.AddCommand(
		newNodePairCommand(),
		newNodeRunCommand(),
		newNodeGatewaySpawnCommand(),
		newNodeGatewayKillCommand(),
	)

	return cmd
}

func newNodePairCommand() *cobra.Command {
	var (
		bridge      string
		displayName string
		deviceFamily string
		statePath   string
	)

	cmd := &cobra.Command{
		Use:   "pair",
		Short: "Pair this node with a gateway",
		Example: `  nanosolana node pair --bridge 100.88.46.29:18790 --display-name "Orin Nano"
  nanosolana node pair --bridge 127.0.0.1:18790`,
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, _ := config.Load()

			ncfg := node.DefaultNodeConfig()
			if bridge != "" {
				ncfg.BridgeAddr = bridge
			} else if cfg.Node.BridgeAddr != "" {
				ncfg.BridgeAddr = cfg.Node.BridgeAddr
			}
			if statePath != "" {
				ncfg.StatePath = statePath
			}
			if displayName != "" {
				ncfg.DisplayName = displayName
			} else if cfg.Node.DisplayName != "" {
				ncfg.DisplayName = cfg.Node.DisplayName
			}
			if deviceFamily != "" {
				ncfg.DeviceFamily = deviceFamily
			} else if cfg.Node.DeviceFamily != "" {
				ncfg.DeviceFamily = cfg.Node.DeviceFamily
			}

			fmt.Printf("%s🦞 NanoSolana Node Pairing%s\n", colorGreen, colorReset)
			fmt.Printf("%sBridge: %s%s\n\n", colorDim, ncfg.BridgeAddr, colorReset)

			state, err := node.LoadOrInitState(ncfg.StatePath)
			if err != nil {
				return err
			}
			if ncfg.DisplayName != "" {
				state.DisplayName = ncfg.DisplayName
			}

			client, err := node.ConnectBridge(ncfg.BridgeAddr)
			if err != nil {
				return fmt.Errorf("bridge connect: %w", err)
			}
			defer client.Close()

			fmt.Printf("  %s✔%s Connected to bridge\n", colorGreen, colorReset)

			if err := node.SendPairRequest(client, ncfg, state); err != nil {
				return err
			}
			fmt.Printf("  %s⏳%s Waiting for approval...\n", colorTeal, colorReset)
			fmt.Printf("  %sApprove via: nanosolana nodes approve <requestId>%s\n\n", colorDim, colorReset)

			token, err := node.WaitForPair(client)
			if err != nil {
				return err
			}
			state.Token = token
			if err := node.SaveState(ncfg.StatePath, state); err != nil {
				return err
			}

			fmt.Printf("  %s✔%s Paired! Token saved to %s\n", colorGreen, colorReset, ncfg.StatePath)
			fmt.Printf("     %sNode ID: %s%s\n", colorDim, state.NodeID, colorReset)
			return nil
		},
	}

	cmd.Flags().StringVar(&bridge, "bridge", "", "Bridge host:port (default from config)")
	cmd.Flags().StringVar(&displayName, "display-name", "", "Friendly display name")
	cmd.Flags().StringVar(&deviceFamily, "device-family", "", "Device family (raspi, orin, workstation)")
	cmd.Flags().StringVar(&statePath, "state", "", "Path to node state JSON")
	return cmd
}

func newNodeRunCommand() *cobra.Command {
	var (
		bridge      string
		displayName string
		sessionKey  string
		ttsEngine   string
		noMDNS      bool
	)

	cmd := &cobra.Command{
		Use:   "run",
		Short: "Run the headless node (connects to gateway bridge)",
		Long: `Start the headless node client. Connects to the gateway bridge,
authenticates, and maintains a persistent connection with automatic
reconnection. Events from hardware can be forwarded as voice.transcript
or agent.request messages.`,
		Example: `  nanosolana node run --bridge 100.88.46.29:18790
  nanosolana node run --bridge 100.88.46.29:18790 --tts-engine system`,
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, _ := config.Load()

			ncfg := node.DefaultNodeConfig()
			if bridge != "" {
				ncfg.BridgeAddr = bridge
			} else if cfg.Node.BridgeAddr != "" {
				ncfg.BridgeAddr = cfg.Node.BridgeAddr
			}
			if displayName != "" {
				ncfg.DisplayName = displayName
			} else if cfg.Node.DisplayName != "" {
				ncfg.DisplayName = cfg.Node.DisplayName
			}
			if sessionKey != "" {
				ncfg.SessionKey = sessionKey
			} else if cfg.Node.SessionKey != "" {
				ncfg.SessionKey = cfg.Node.SessionKey
			}
			if ttsEngine != "" {
				ncfg.TTSEngine = ttsEngine
			} else if cfg.Node.TTSEngine != "" {
				ncfg.TTSEngine = cfg.Node.TTSEngine
			}
			ncfg.MDNSEnabled = !noMDNS
			if cfg.Node.MDNSService != "" {
				ncfg.MDNSService = cfg.Node.MDNSService
			}

			fmt.Printf("%s🦞 NanoSolana Headless Node%s\n", colorGreen, colorReset)
			fmt.Printf("%sBridge: %s | Session: %s%s\n\n", colorDim, ncfg.BridgeAddr, ncfg.SessionKey, colorReset)

			return node.RunNode(context.Background(), ncfg)
		},
	}

	cmd.Flags().StringVar(&bridge, "bridge", "", "Bridge host:port")
	cmd.Flags().StringVar(&displayName, "display-name", "", "Friendly display name")
	cmd.Flags().StringVar(&sessionKey, "session-key", "", "Session key for events")
	cmd.Flags().StringVar(&ttsEngine, "tts-engine", "", "TTS engine (system, none)")
	cmd.Flags().BoolVar(&noMDNS, "no-mdns", false, "Disable mDNS advertising")
	return cmd
}

func newNodeGatewaySpawnCommand() *cobra.Command {
	var (
		port     int
		session  string
		noTS     bool
		force    bool
	)

	cmd := &cobra.Command{
		Use:   "gateway-spawn",
		Short: "Spawn a NanoSolana Gateway in tmux (Tailscale-aware)",
		Long: `Launch the NanoSolana native gateway in a detached tmux session, bound to
your Tailscale IP for secure mesh networking. The gateway serves as the
bridge between headless hardware nodes and the NanoSolana daemon.

Perfect for SSH sessions via Termius — gateway runs in the background.`,
		Example: `  nanosolana node gateway-spawn
  nanosolana node gateway-spawn --port 19001
  nanosolana node gateway-spawn --no-tailscale`,
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, _ := config.Load()

			spawnCfg := gw.SpawnConfig{
				Port:         port,
				TMUXSession:  session,
				UseTailscale: !noTS,
				ForceBind:    force,
			}
			if spawnCfg.Port == 0 {
				spawnCfg.Port = cfg.GatewaySpawn.Port
			}
			if spawnCfg.TMUXSession == "" {
				spawnCfg.TMUXSession = cfg.GatewaySpawn.TMUXSession
			}

			fmt.Printf("%s🦞 NanoSolana Gateway Spawn%s\n\n", colorGreen, colorReset)

			result, err := gw.SpawnGateway(spawnCfg)
			if err != nil {
				return err
			}

			if result.AlreadyExists {
				fmt.Printf("  %s⚠%s Gateway already running in tmux '%s'\n", colorAmber, colorReset, result.TMUXSession)
			} else {
				fmt.Printf("  %s✔%s Gateway spawned\n", colorGreen, colorReset)
			}

			fmt.Printf("\n%s  Bridge:%s  %s\n", colorTeal, colorReset, result.BridgeAddr)
			if result.TailscaleIP != "" {
				fmt.Printf("%s  Tailscale:%s %s\n", colorTeal, colorReset, result.TailscaleIP)
			}
			fmt.Printf("%s  tmux:%s    %s\n", colorDim, colorReset, result.TMUXSession)
			fmt.Printf("\n%s  Connect from node:%s\n", colorDim, colorReset)
			fmt.Printf("  %snanosolana node run --bridge %s%s\n", colorAmber, result.BridgeAddr, colorReset)
			fmt.Printf("\n%s  Pair new node:%s\n", colorDim, colorReset)
			fmt.Printf("  %snanosolana node pair --bridge %s%s\n", colorAmber, result.BridgeAddr, colorReset)
			fmt.Printf("\n%s  Attach to tmux:%s\n", colorDim, colorReset)
			fmt.Printf("  %stmux attach -t %s%s\n\n", colorAmber, result.TMUXSession, colorReset)

			return nil
		},
	}

	cmd.Flags().IntVar(&port, "port", 18790, "Gateway bridge port")
	cmd.Flags().StringVar(&session, "session", "nanosolana-gw", "tmux session name")
	cmd.Flags().BoolVar(&noTS, "no-tailscale", false, "Don't bind to Tailscale IP")
	cmd.Flags().BoolVar(&force, "force", false, "Kill existing port listeners")
	return cmd
}

func newNodeGatewayKillCommand() *cobra.Command {
	var session string

	cmd := &cobra.Command{
		Use:   "gateway-kill",
		Short: "Stop the NanoSolana Gateway tmux session",
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := gw.KillGateway(session); err != nil {
				return err
			}
			fmt.Printf("  %s✔%s Gateway session '%s' killed\n", colorGreen, colorReset, session)
			return nil
		},
	}

	cmd.Flags().StringVar(&session, "session", "nanosolana-gw", "tmux session name")
	return cmd
}

// ── Pet Command (TamaGOchi) ──────────────────────────────────────────

func NewPetCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "pet",
		Short: "Show TamaGOchi pet status",
		Long:  "Display the Nano Solana TamaGOchi — your agent's virtual pet whose evolution is driven by on-chain performance.",
		Run: func(cmd *cobra.Command, args []string) {
			pet := tamagochi.New("NanoSolana")
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
			fmt.Printf("%s📊 Trade history: use `nanosolana ooda` to start trading%s\n", colorDim, colorReset)
		case input == "!lessons":
			fmt.Printf("%s🧠 Learned patterns: stored in ~/.nanosolana/workspace/vault/lessons/%s\n", colorDim, colorReset)
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
