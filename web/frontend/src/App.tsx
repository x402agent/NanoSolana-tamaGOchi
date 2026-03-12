import { useState, useEffect, useRef, useCallback } from 'react'

// ── Demo Data ────────────────────────────────────────────────────────

const DEMO_COMMANDS: Record<string, string[]> = {
  'help': [
    '  \x1b[green]nanosolana daemon\x1b[/]                      Start full GoBot',
    '  \x1b[green]nanosolana solana health\x1b[/]               Check Helius RPC health',
    '  \x1b[green]nanosolana solana balance [pubkey]\x1b[/]      Check SOL + SPL balances',
    '  \x1b[green]nanosolana solana wallet\x1b[/]               Show wallet config',
    '  \x1b[green]nanosolana solana register\x1b[/]             Register agent on-chain (devnet NFT)',
    '  \x1b[green]nanosolana solana registry\x1b[/]             Show registration status',
    '  \x1b[green]nanosolana ooda --interval 60\x1b[/]          Start OODA trading loop',
    '  \x1b[green]nanosolana gateway start\x1b[/]               Start native TCP bridge',
    '  \x1b[green]nanosolana pet\x1b[/]                         Show TamaGOchi status',
    '  \x1b[green]nanosolana node pair\x1b[/]                   Pair hardware node',
    '  \x1b[green]nanosolana version\x1b[/]                     Version + build info',
  ],
  'nanosolana version': [
    '  nanosolana v2.0.0-nanosolana',
    '  built:  2026-03-12T15:28:00Z',
    '  go:     go1.25.0 darwin/arm64',
  ],
  'nanosolana solana health': [
    '',
    '  \x1b[green]⛓️  Solana Network Status\x1b[/]',
    '',
    '  \x1b[dim]Healthy:\x1b[/]  ✓',
    '  \x1b[dim]Version:\x1b[/]  3.1.10',
    '  \x1b[dim]Slot:\x1b[/]     405,979,506',
    '  \x1b[dim]Height:\x1b[/]   384,084,300',
    '  \x1b[dim]Latency:\x1b[/]  87ms',
    '',
    '  \x1b[amber]⚡ Priority Fees (µL)\x1b[/]',
    '  Min:    0',
    '  Low:    100',
    '  Medium: 5,000',
    '  High:   50,000',
  ],
  'nanosolana solana balance': [
    '',
    '  \x1b[green]💰 Wallet: 7xKX...3vBp\x1b[/]',
    '',
    '  \x1b[amber]SOL:\x1b[/]    2.451892000 SOL (2451892000 lamports)',
    '',
    '  \x1b[blue]SPL Tokens:\x1b[/]',
    '    EPjFWd...Dt1v  125.50  (USDC)',
    '    JUPyiw...vCN   1,200.00  (JUP)',
    '    DezXAZ...B263  5,000,000.00  (BONK)',
    '    4k3Dyj...X6R   42.78  (RAY)',
  ],
  'nanosolana pet': [
    '',
    '  🐹 NanoSolana  😊',
    '',
    '  📊 Stage: juvenile · Level 3 · XP 420',
    '  😊 Mood: happy',
    '  ⚡ Energy: ⚡⚡⚡⚡⚡⚡⚡⚡░░',
    '  🍽️ Hunger: 🟢🟢🟢🟢🟢🟢🟢░░░',
    '',
    '  📈 Trades: 47 · Win Rate: 63.8%',
    '  💰 Balance: 2.4519 SOL',
    '  📊 Total PnL: +0.8247 SOL',
    '  🔥 Streak: +3',
    '  ⏱️ Age: 72h · Uptime: 168h',
  ],
  'nanosolana ooda --sim': [
    '  \x1b[green][OODA]\x1b[/] 🦞 NanoSolana starting (mode=simulated interval=60s)',
    '  \x1b[green][OODA]\x1b[/] ⛓️  On-chain engine connected (Helius RPC + Jupiter)',
    '  \x1b[green][OODA]\x1b[/] 🔑 Agent wallet: 7xKXqR8...3vBp',
    '  \x1b[green][OODA]\x1b[/] 🌐 Native Solana RPC connected (network=mainnet)',
    '  \x1b[green][OODA]\x1b[/] Watchlist: [SOL, JUP, BONK, RAY]',
    '  \x1b[green][OODA]\x1b[/] Strategy: RSI(30/70) EMA(20/50) SL=8% TP=20%',
    '  \x1b[green][OODA]\x1b[/] ─── Cycle #1 ───',
    '  \x1b[blue][OODA]\x1b[/] Cycle #1 | SOL=$142.38',
    '  \x1b[purple][OODA]\x1b[/] 📡 SIGNAL LONG JUP (strength=0.72 conf=0.68)',
    '  \x1b[green][OODA]\x1b[/] 📈 LONG JUP at $0.8421 (0.2400 SOL) [simulated]',
    '  \x1b[green][OODA]\x1b[/] ─── Cycle #1 complete (positions=1) ───',
  ],
  'nanosolana gateway start --no-tailscale': [
    '  \x1b[green]🦞 NanoSolana Gateway\x1b[/]',
    '  \x1b[dim]Bridge:\x1b[/]  0.0.0.0:18790',
    '  \x1b[dim]Auth:\x1b[/]    token-based',
    '  \x1b[dim]Nodes:\x1b[/]   0 connected',
    '',
    '  \x1b[dim]Pair:\x1b[/]   nanosolana node pair --bridge localhost:18790',
    '  \x1b[dim]Run:\x1b[/]    nanosolana node run  --bridge localhost:18790',
  ],
  'nanosolana solana register': [
    '',
    '  \x1b[green]⛓️  NanoSolana Agent Registration\x1b[/]',
    '',
    '  \x1b[dim]Agent:\x1b[/]   7xKXqR8...3vBp',
    '  \x1b[dim]Skills:\x1b[/]  [ooda-trading, solana-rpc, jupiter-swaps, birdeye-analytics]',
    '  \x1b[dim]Network:\x1b[/] devnet (gasless)',
    '',
    '  ☁️  Requesting devnet airdrop for 7xKXqR8...',
    '  ✅ Airdrop: 5kYj3Rv8nN2...',
    '',
    '  \x1b[green]✅ Agent registered on-chain!\x1b[/]',
    '',
    '  \x1b[dim]Mint:\x1b[/]    BRjp4qK9nRfV3vZm7xKXqR8pDn9E4rUsFj2y',
    '  \x1b[dim]Tx:\x1b[/]      4Qj8nKxm2Y7p...',
    '  \x1b[dim]Network:\x1b[/] devnet',
    '  \x1b[dim]Saved:\x1b[/]   ~/.nanosolana/registry/registration.json',
    '',
    '  \x1b[amber]Explorer: https://explorer.solana.com/tx/4Qj8nKxm2Y7p...?cluster=devnet\x1b[/]',
  ],
  'clear': [],
}

// ── Color parser ─────────────────────────────────────────────────────

function parseTermColor(text: string) {
  const parts: { text: string; color?: string }[] = []
  let remaining = text
  while (remaining.length > 0) {
    const match = remaining.match(/\x1b\[(green|purple|blue|amber|dim|red)\](.*?)\x1b\[\/\]/)
    if (match && match.index !== undefined) {
      if (match.index > 0) parts.push({ text: remaining.slice(0, match.index) })
      const colorMap: Record<string, string> = {
        green: 'var(--sol-green)', purple: 'var(--sol-purple)',
        blue: 'var(--sol-blue)', amber: 'var(--sol-amber)',
        dim: 'var(--text-dim)', red: 'var(--sol-red)',
      }
      parts.push({ text: match[2], color: colorMap[match[1]] })
      remaining = remaining.slice(match.index + match[0].length)
    } else {
      parts.push({ text: remaining })
      break
    }
  }
  return parts
}

// ── Terminal Component ───────────────────────────────────────────────

function Terminal() {
  const [lines, setLines] = useState<{ type: 'prompt' | 'output'; cmd?: string; text?: string }[]>([
    { type: 'output', text: '\x1b[green]🦞 NanoSolana Console v2.0\x1b[/] — Try: help, nanosolana solana health, nanosolana pet' },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollBottom = useCallback(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [])

  useEffect(scrollBottom, [lines, scrollBottom])

  const runCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase()
    const newLines = [...lines, { type: 'prompt' as const, cmd }]

    if (trimmed === 'clear') {
      setLines([])
      return
    }

    const response = DEMO_COMMANDS[trimmed]
    if (response) {
      response.forEach(line => newLines.push({ type: 'output', text: line }))
    } else if (trimmed) {
      newLines.push({ type: 'output', text: `  \x1b[red]Unknown command:\x1b[/] ${cmd}. Type \x1b[green]help\x1b[/] for available commands.` })
    }

    setLines(newLines)
    setHistory(prev => [cmd, ...prev.slice(0, 50)])
    setHistIdx(-1)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      runCommand(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(next)
      if (history[next]) setInput(history[next])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = histIdx - 1
      setHistIdx(next)
      setInput(next >= 0 ? history[next] : '')
    }
  }

  return (
    <div className="terminal">
      <div className="terminal-header">
        <div className="terminal-dots">
          <span /><span /><span />
        </div>
        <div className="terminal-title">nano — NanoSolana Interactive Demo</div>
        <div style={{ width: 50 }} />
      </div>
      <div className="terminal-body" ref={bodyRef} onClick={() => inputRef.current?.focus()}>
        {lines.map((line, i) => (
          <div key={i}>
            {line.type === 'prompt' ? (
              <div className="terminal-line">
                <span className="terminal-prompt">nanosolana $</span>
                <span className="terminal-cmd">{line.cmd}</span>
              </div>
            ) : (
              <div className="terminal-output">
                {parseTermColor(line.text || '').map((p, j) => (
                  <span key={j} style={p.color ? { color: p.color } : undefined}>{p.text}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="terminal-input-line">
          <span className="terminal-prompt">nanosolana $</span>
          <input
            ref={inputRef}
            className="terminal-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            spellCheck={false}
            autoComplete="off"
          />
          <span className="terminal-cursor" />
        </div>
      </div>
    </div>
  )
}

// ── Feature Data ─────────────────────────────────────────────────────

const FEATURES = [
  { icon: '⛓️', title: 'On-Chain Engine', desc: 'Native Solana SDK via gagliardetto/solana-go — SOL/SPL balances, transfers, priority fees, and real-time WSS account monitoring through Helius.' },
  { icon: '🔄', title: 'Jupiter Swaps', desc: 'Atomic DEX swaps via Jupiter Ultra API with slippage control, auto priority fees, and MEV protection. SOL↔SPL and SPL↔SPL.' },
  { icon: '🧠', title: 'OODA Trading Loop', desc: 'Autonomous Observe → Orient → Decide → Act cycle with RSI/EMA/ATR strategy, auto-optimizer, and on-chain execution wired to Helius RPC.' },
  { icon: '🐹', title: 'TamaGOchi Pet', desc: 'Virtual pet whose mood, XP, and evolution stage are driven by live on-chain trading performance. Egg → Larva → Juvenile → Adult → Alpha.' },
  { icon: '🌐', title: 'Native Gateway', desc: 'Pure Go TCP bridge server with token auth and Tailscale mesh networking. Connects hardware nodes without OpenClaw or Node.js.' },
  { icon: '🎛️', title: 'Arduino Hardware', desc: 'Modulino® I2C sensor cluster — 8× RGB LEDs, buzzer, buttons, rotary knob, IMU, thermo, ToF — physically integrated with the OODA loop.' },
  { icon: '💰', title: 'x402 Protocol', desc: 'Multi-chain USDC payment gateway for monetizing agent APIs. Solana, Base, Polygon, Avalanche with auto-configured SVM signer.' },
  { icon: '🔑', title: 'Agentic Wallet', desc: 'Auto-generates a Solana keypair on first boot at ~/.nanosolana/wallet/. Standard keygen JSON format with 0600 permissions.' },
  { icon: '📱', title: 'Telegram Bot', desc: 'Zero-dependency HTTP bot with commands for status, wallet, pet, trending tokens, OODA control, and trade history.' },
]

const CLI_COMMANDS = [
  { cmd: 'nanosolana solana health', desc: 'Helius RPC + priority fees' },
  { cmd: 'nanosolana solana balance', desc: 'SOL + SPL balances' },
  { cmd: 'nanosolana daemon', desc: 'Full trading daemon' },
  { cmd: 'nanosolana ooda --sim', desc: 'Simulated OODA loop' },
  { cmd: 'nanosolana gateway start', desc: 'TCP bridge server' },
  { cmd: 'nanosolana pet', desc: 'TamaGOchi status' },
  { cmd: 'nanosolana node pair', desc: 'Pair hardware node' },
  { cmd: 'nanosolana version', desc: 'Build info' },
]

// ── Main App ─────────────────────────────────────────────────────────

export default function App() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]))
          }
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('section[id]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const vis = (id: string) => visibleSections.has(id) ? 'animate-in' : ''

  return (
    <div className="app">
      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            <div className="nav-logo-icon">🦞</div>
            NANOSOLANA
          </a>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#terminal">Terminal</a></li>
            <li><a href="#architecture">Architecture</a></li>
            <li><a href="#cli">CLI</a></li>
            <li><a href="#quickstart">Quick Start</a></li>
          </ul>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Live on Solana Mainnet
            </div>
            <h1>
              <span className="gradient-text">On-Chain Trading</span>
              <br />Intelligence
            </h1>
            <p className="hero-sub">
              10MB autonomous Solana agent. Helius RPC. Jupiter swaps. OODA trading loop.
              Arduino hardware. Pure Go. One binary.
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-value">10MB</div>
                <div className="hero-stat-label">Binary Size</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">&lt;1s</div>
                <div className="hero-stat-label">Boot Time</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">87ms</div>
                <div className="hero-stat-label">RPC Latency</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">∞</div>
                <div className="hero-stat-label">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Capabilities</div>
            <h2 className="section-title">Built for On-Chain Power</h2>
          </div>
          <div className={`features-grid ${vis('features')}`}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Terminal */}
      <section id="terminal" className="terminal-section">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Interactive Demo</div>
            <h2 className="section-title">Try the Terminal</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.9rem' }}>
              Type commands below — try <code style={{ color: 'var(--sol-green)', fontFamily: 'var(--font-mono)' }}>nanosolana solana health</code> or <code style={{ color: 'var(--sol-green)', fontFamily: 'var(--font-mono)' }}>nanosolana pet</code>
            </p>
          </div>
          <Terminal />
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture">
        <div className="container">
          <div className="section-header">
            <div className="section-label">System Design</div>
            <h2 className="section-title">Architecture</h2>
          </div>
          <div className="arch-diagram">
            <div className="arch-row">
              <div className="arch-node">
                <div className="arch-node-label">Observe</div>
                <div className="arch-node-value">Helius RPC</div>
                <div className="arch-node-sub">Birdeye · Aster</div>
              </div>
              <div className="arch-node">
                <div className="arch-node-label">Orient</div>
                <div className="arch-node-value">RSI/EMA/ATR</div>
                <div className="arch-node-sub">ClawVault Memory</div>
              </div>
              <div className="arch-node">
                <div className="arch-node-label">Decide</div>
                <div className="arch-node-value">Signal Gate</div>
                <div className="arch-node-sub">Confidence · Risk</div>
              </div>
              <div className="arch-node">
                <div className="arch-node-label">Act</div>
                <div className="arch-node-value">Jupiter Swap</div>
                <div className="arch-node-sub">SOL Transfer</div>
              </div>
            </div>
            <div className="arch-arrow">↓ ↓ ↓ ↓</div>
            <div className="arch-row">
              <div className="arch-node">
                <div className="arch-node-label">On-Chain</div>
                <div className="arch-node-value">engine.go</div>
                <div className="arch-node-sub">Helius RPC/WSS</div>
              </div>
              <div className="arch-node">
                <div className="arch-node-label">Swaps</div>
                <div className="arch-node-value">jupiter.go</div>
                <div className="arch-node-sub">Ultra API</div>
              </div>
              <div className="arch-node">
                <div className="arch-node-label">Gateway</div>
                <div className="arch-node-value">bridge.go</div>
                <div className="arch-node-sub">TCP + Tailscale</div>
              </div>
              <div className="arch-node">
                <div className="arch-node-label">Pet</div>
                <div className="arch-node-value">tamagochi.go</div>
                <div className="arch-node-sub">Mood · XP · Evo</div>
              </div>
            </div>
            <div className="arch-arrow">↓ ↓ ↓ ↓</div>
            <div className="arch-row">
              <div className="arch-node" style={{ gridColumn: '1 / 3' }}>
                <div className="arch-node-label">Solana SDK</div>
                <div className="arch-node-value">gagliardetto/solana-go v1.14</div>
                <div className="arch-node-sub">Keys · Signing · PDAs · System · Token Programs</div>
              </div>
              <div className="arch-node" style={{ gridColumn: '3 / 5' }}>
                <div className="arch-node-label">Hardware</div>
                <div className="arch-node-value">Arduino Modulino® I2C</div>
                <div className="arch-node-sub">Pixels · Buzzer · Buttons · Knob · IMU · Thermo · ToF</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLI Reference */}
      <section id="cli">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Commands</div>
            <h2 className="section-title">CLI Reference</h2>
          </div>
          <div className={`cli-grid ${vis('cli')}`}>
            {CLI_COMMANDS.map((c, i) => (
              <div key={i} className="cli-item" style={{ animationDelay: `${i * 0.05}s` }}>
                <code>{c.cmd}</code>
                <span>{c.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section id="quickstart">
        <div className="container">
          <div className="section-header">
            <div className="section-label">Get Started</div>
            <h2 className="section-title">Quick Start</h2>
          </div>
          <div className="code-block">
            <div className="code-header">
              <span>terminal</span>
              <button className="code-copy" onClick={() => navigator.clipboard.writeText(
                'git clone https://github.com/x402agent/NanoSolana-tamaGOchi.git\ncd NanoSolana-tamaGOchi\ncp .env.example .env\nmake build\n./build/nanosolana daemon'
              )}>Copy</button>
            </div>
            <div className="code-body">
              <div><span className="comment"># Clone & build</span></div>
              <div><span className="cmd">git clone</span> https://github.com/x402agent/NanoSolana-tamaGOchi.git</div>
              <div><span className="cmd">cd</span> NanoSolana-tamaGOchi</div>
              <div><span className="cmd">cp</span> .env.example .env   <span className="comment"># Add your Helius key</span></div>
              <div><span className="cmd">make build</span></div>
              <div></div>
              <div><span className="comment"># Run</span></div>
              <div><span className="cmd">./build/nanosolana daemon</span>          <span className="comment"># Full autonomous GoBot</span></div>
              <div><span className="cmd">./build/nanosolana solana health</span>   <span className="comment"># Check live mainnet</span></div>
              <div><span className="cmd">./build/nanosolana ooda</span> <span className="flag">--sim</span>        <span className="comment"># Simulated trading</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-brand">NanoSolana Labs · Built with Go on Solana</div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
            🐹 A GoBot with a soul · 10MB Binary · Pure Go · x402 Protocol
          </p>
          <div className="footer-links">
            <a href="https://github.com/x402agent">GitHub</a>
            <a href="https://helius.dev">Helius</a>
            <a href="https://jup.ag">Jupiter</a>
            <a href="https://x402.org">x402</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
