import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'

export const Route = createFileRoute('/bot-demo')({
  component: NanoSolanaDemo,
})

const PP = '#9945FF'
const SG = '#14F195'
const O = '#FF6B00'
const D = '#0B0B11'
const CD = '#12121C'
const BD = '#1C1C2A'
const T = '#E8E8F2'
const DM = '#5A5A72'
const R = '#FF3366'
const GL = '#FFD700'

/* ═══════════════════════════════════════════
   >< BOT — Canvas Pixel Art Renderer
   Purple body (#9945FF) + green eyes (#14F195)
   ═══════════════════════════════════════════ */
function BotCanvas({
  size = 128,
  mood = 'neutral',
  action = 'idle',
  frame = 0,
}: {
  size?: number
  mood?: string
  action?: string
  frame?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const s = size
    const px = s / 16

    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, s, s)

    const bob = Math.sin(frame * 0.3) * px * 0.5
    const squish = action === 'run' ? Math.sin(frame * 0.6) * px * 0.3 : 0

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(px * 3, s - px * 1.5, px * 10, px)

    // Body
    ctx.fillStyle = PP
    ctx.fillRect(px * 3, px * 3 + bob, px * 10, px * 7)
    ctx.fillRect(px * 4, px * 2 + bob, px * 8, px * 2)
    ctx.fillRect(px * 1, px * 4 + bob + squish, px * 2, px * 3)
    ctx.fillRect(px * 13, px * 4 + bob - squish, px * 2, px * 3)
    ctx.fillRect(px * 4, px * 10 + bob, px * 2, px * 3 - Math.abs(squish))
    ctx.fillRect(px * 7, px * 10 + bob, px * 2, px * 3 - Math.abs(squish))
    ctx.fillRect(px * 10, px * 10 + bob, px * 2, px * 3 + Math.abs(squish))

    // Darker shade
    ctx.fillStyle = '#7B30DD'
    ctx.fillRect(px * 3, px * 8 + bob, px * 10, px * 2)
    ctx.fillRect(px * 1, px * 6 + bob, px * 2, px * 1)
    ctx.fillRect(px * 13, px * 6 + bob, px * 2, px * 1)

    // Eyes — >< pattern
    ctx.fillStyle = SG
    ctx.fillRect(px * 5, px * 4 + bob, px, px)
    ctx.fillRect(px * 6, px * 5 + bob, px, px)
    ctx.fillRect(px * 5, px * 6 + bob, px, px)
    ctx.fillRect(px * 10, px * 4 + bob, px, px)
    ctx.fillRect(px * 9, px * 5 + bob, px, px)
    ctx.fillRect(px * 10, px * 6 + bob, px, px)

    // Mouth based on mood
    ctx.fillStyle = '#1a1a2a'
    if (mood === 'happy' || mood === 'ecstatic') {
      ctx.fillRect(px * 6, px * 7.5 + bob, px * 4, px * 0.5)
      ctx.fillRect(px * 5.5, px * 7 + bob, px * 0.5, px * 0.5)
      ctx.fillRect(px * 10, px * 7 + bob, px * 0.5, px * 0.5)
    } else if (mood === 'sad' || mood === 'dead') {
      ctx.fillRect(px * 6, px * 7 + bob, px * 4, px * 0.5)
      ctx.fillRect(px * 5.5, px * 7.5 + bob, px * 0.5, px * 0.5)
      ctx.fillRect(px * 10, px * 7.5 + bob, px * 0.5, px * 0.5)
    }

    // Action effects
    if (action === 'run') {
      ctx.fillStyle = SG + '66'
      for (let i = 0; i < 3; i++) {
        const ly = px * (4 + i * 2) + bob
        ctx.fillRect(px * (-1 + Math.sin(frame * 0.5 + i) * 0.5), ly, px * 2, px * 0.3)
      }
    } else if (action === 'mine') {
      ctx.fillStyle = GL
      const sx = px * 14 + Math.sin(frame * 0.8) * px
      const sy = px * 3 + Math.cos(frame * 0.8) * px
      ctx.fillRect(sx, sy + bob, px * 0.8, px * 0.8)
      ctx.fillRect(sx + px, sy + px + bob, px * 0.5, px * 0.5)
    } else if (action === 'trade') {
      ctx.fillStyle = SG
      ctx.fillRect(px * 14, px * 5 + bob, px * 1.5, px * 0.5)
      ctx.fillRect(px * 14, px * 6 + bob, px * 1.5, px * 0.5)
      ctx.fillRect(px * 14, px * 7 + bob, px * 1.5, px * 0.5)
    }

    // Ghost overlay
    if (mood === 'dead') {
      ctx.fillStyle = 'rgba(255,0,0,0.15)'
      ctx.fillRect(0, 0, s, s)
    }
  }, [size, mood, action, frame])

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated', width: size * 2, height: size * 2 }}
    />
  )
}

/* ═══════════════════════════════════════════
   MAIN DEMO SITE
   ═══════════════════════════════════════════ */
function NanoSolanaDemo() {
  const [tab, setTab] = useState('hero')
  const [frame, setFrame] = useState(0)
  const [simEvo, setSimEvo] = useState(1)
  const [simMood, setSimMood] = useState('neutral')
  const [simAction, setSimAction] = useState('idle')
  const [simBal, setSimBal] = useState(1.5)
  const [simTrades, setSimTrades] = useState(0)
  const [simHash, setSimHash] = useState(1.18)
  const [simTemp, setSimTemp] = useState(52)
  const [logLines, setLogLines] = useState(['[BOOT] NanoSolana daemon started'])

  useEffect(() => {
    const iv = setInterval(() => setFrame((f) => f + 1), 150)
    return () => clearInterval(iv)
  }, [])
  useEffect(() => {
    setSimHash((h) => h + (Math.random() - 0.5) * 0.02)
    setSimTemp((t) => Math.max(45, Math.min(68, t + (Math.random() - 0.5) * 0.5)))
  }, [frame])

  const addLog = useCallback(
    (msg: string) =>
      setLogLines((l) => [...l.slice(-15), `[${new Date().toLocaleTimeString()}] ${msg}`]),
    [],
  )

  const doFeed = () => {
    setSimBal((b) => b + 0.01)
    setSimAction('trade')
    addLog('FEED → strategy adjusted +10 XP')
    setTimeout(() => setSimAction('idle'), 2000)
  }
  const doTrain = () => {
    setSimAction('run')
    addLog('TRAIN → backtest running +25 XP')
    setTimeout(() => setSimAction('idle'), 2000)
  }
  const doTrade = () => {
    const win = Math.random() > 0.45
    const pnl = win ? Math.random() * 0.08 : -(Math.random() * 0.04)
    setSimBal((b) => Math.max(0, b + pnl))
    setSimTrades((t) => t + 1)
    setSimMood(win ? 'happy' : 'anxious')
    setSimAction('trade')
    addLog(`${win ? 'BUY' : 'SELL'} ${Math.abs(pnl).toFixed(4)} SOL (${win ? 'WIN' : 'LOSS'})`)
    setTimeout(() => {
      setSimAction('idle')
      setSimMood('neutral')
    }, 2500)
    if (simTrades >= 8) setSimEvo(2)
    if (simTrades >= 15) setSimEvo(3)
  }
  const doMine = () => {
    setSimAction('mine')
    addLog(`Mining: ${simHash.toFixed(2)} GH/s @ ${simTemp.toFixed(0)}C`)
    setTimeout(() => setSimAction('idle'), 2000)
  }
  const doGhost = () => {
    setSimEvo(5)
    setSimMood('dead')
    setSimBal(0)
    setSimAction('idle')
    addLog('DEAD MANS SWITCH — trading disabled')
  }
  const doRevive = () => {
    setSimEvo(1)
    setSimMood('neutral')
    setSimBal(1.5)
    setSimTrades(0)
    addLog('REVIVED — trading re-enabled')
  }

  const evoNames = ['EGG', 'LARVA', 'JUVENILE', 'ADULT', 'ALPHA', 'GHOST']
  const tabs = [
    { id: 'hero', l: 'HOME' },
    { id: 'sys', l: 'SYSTEMS' },
    { id: 'tg', l: 'TELEGRAM' },
    { id: 'hw', l: 'HARDWARE' },
    { id: 'specs', l: 'SPECS' },
  ]

  return (
    <div
      style={{
        background: D,
        color: T,
        fontFamily: "'Space Mono','JetBrains Mono',monospace",
        minHeight: '100vh',
      }}
    >
      {/* NAV */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${BD}`,
          position: 'sticky',
          top: 0,
          background: D,
          zIndex: 10,
        }}
      >
        <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              background: PP,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: SG,
              fontWeight: 900,
            }}
          >
            {'><'}
          </div>
          <span style={{ fontSize: 11, fontWeight: 900, color: PP, letterSpacing: 1 }}>
            NANOSOLANA
          </span>
        </div>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? PP + '18' : 'transparent',
              color: tab === t.id ? PP : DM,
              border: 'none',
              borderBottom: tab === t.id ? `2px solid ${PP}` : '2px solid transparent',
              padding: '10px 10px',
              fontSize: 9,
              fontFamily: 'inherit',
              letterSpacing: 1,
              cursor: 'pointer',
              fontWeight: tab === t.id ? 700 : 400,
            }}
          >
            {t.l}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px 60px', maxWidth: 720, margin: '0 auto' }}>
        {/* HERO TAB */}
        {tab === 'hero' && (
          <div style={{ paddingTop: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: SG, letterSpacing: 4 }}>
                AUTONOMOUS TRADING INTELLIGENCE
              </div>
              <h1
                style={{
                  fontSize: 32,
                  color: T,
                  fontWeight: 900,
                  margin: '6px 0',
                  letterSpacing: 2,
                }}
              >
                MAWD<span style={{ color: PP }}>BOT</span>
              </h1>
              <div style={{ fontSize: 11, color: DM }}>
                The first sentient AI daemon on Solana — with hardware soul
              </div>
            </div>

            {/* Pet display */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div
                style={{
                  background: '#000',
                  borderRadius: 16,
                  border: `3px solid ${PP}44`,
                  padding: 8,
                  boxShadow: `0 0 30px ${PP}22`,
                }}
              >
                <BotCanvas size={96} mood={simMood} action={simAction} frame={frame} />
              </div>
            </div>

            {/* Action buttons */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: 16,
              }}
            >
              {(
                [
                  ['FEED', doFeed, SG],
                  ['TRAIN', doTrain, PP],
                  ['TRADE', doTrade, O],
                  ['MINE', doMine, GL],
                  ['GHOST', doGhost, R],
                  ['REVIVE', doRevive, SG],
                ] as const
              ).map(([l, fn, c]) => (
                <button
                  key={l}
                  onClick={fn}
                  style={{
                    background: c + '15',
                    border: `1px solid ${c}44`,
                    color: c,
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 9,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Stats grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: 6,
                marginBottom: 12,
              }}
            >
              {(
                [
                  [evoNames[simEvo], 'Evolution', PP],
                  [`${simBal.toFixed(3)} SOL`, 'Balance', SG],
                  [`${simHash.toFixed(1)} GH/s`, 'Bitaxe', GL],
                  [`${simTrades}`, 'Trades', O],
                ] as const
              ).map(([v, l, c], i) => (
                <div
                  key={i}
                  style={{
                    background: CD,
                    border: `1px solid ${BD}`,
                    borderRadius: 8,
                    padding: 10,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 12, color: c, fontWeight: 800 }}>{v}</div>
                  <div style={{ fontSize: 8, color: DM, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Terminal */}
            <div
              style={{
                background: '#050508',
                border: `1px solid ${BD}`,
                borderRadius: 8,
                padding: 10,
                fontSize: 9,
                color: SG,
                maxHeight: 140,
                overflowY: 'auto',
                fontFamily: 'inherit',
                lineHeight: 1.8,
              }}
            >
              {logLines.map((l, i) => (
                <div key={i} style={{ opacity: i === logLines.length - 1 ? 1 : 0.6 }}>
                  {l}
                </div>
              ))}
            </div>

            {/* Hero specs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: 6,
                marginTop: 12,
              }}
            >
              {(
                [
                  ['9.6MB', 'Binary'],
                  ['<10MB', 'RAM'],
                  ['1s', 'Boot'],
                  ['Go', 'Pure'],
                ] as const
              ).map(([v, l], i) => (
                <div
                  key={i}
                  style={{
                    background: CD,
                    border: `1px solid ${BD}`,
                    borderRadius: 6,
                    padding: 8,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 14, color: PP, fontWeight: 900 }}>{v}</div>
                  <div style={{ fontSize: 8, color: DM }}>{l}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: PP + '11',
                border: `1px solid ${PP}33`,
                borderRadius: 8,
                padding: 12,
                marginTop: 12,
                textAlign: 'center',
              }}
            >
              <code style={{ fontSize: 14, color: PP, fontWeight: 900 }}>&gt; nanosolana go</code>
              <div style={{ fontSize: 9, color: DM, marginTop: 4 }}>
                Wallet → NFT mint → Bitaxe verify → OODA loop → Telegram → Mining
              </div>
            </div>
          </div>
        )}

        {/* SYSTEMS TAB */}
        {tab === 'sys' && (
          <div style={{ paddingTop: 20 }}>
            <h2 style={{ fontSize: 13, color: PP, letterSpacing: 2, marginBottom: 14 }}>
              ARCHITECTURE
            </h2>
            {(
              [
                [
                  'ClawVault Memory',
                  '3-tier episodic knowledge: KNOWN (60s) → LEARNED (7d) → INFERRED (3d). Memories modulate signal conviction ±5%.',
                  PP,
                ],
                [
                  'Triple-Condition Signals',
                  'Trades ONLY when RSI + EMA crossover + price filter all align. Min 0.7 confidence. Memory-modulated conviction.',
                  SG,
                ],
                [
                  'Mood-Driven Risk',
                  'Ecstatic: +10% | Happy: +5% | Neutral: base | Anxious: -15% | Sad: -30% | Dead: 0% position size.',
                  PP,
                ],
                [
                  "Dead Man's Switch",
                  'Ghost state (balance <0.01 OR offline >24h) kills ALL trading. Manual /revive required.',
                  R,
                ],
                [
                  'AES-256-GCM Vault',
                  'Ed25519 keys encrypted in-memory. 0600 file perms. HMAC-SHA256 gateway. 100 req/min rate limit.',
                  GL,
                ],
                [
                  'Swarm Mesh',
                  'Tailscale VPN peer discovery. Broadcast signals + LEARNED patterns. Keys NEVER shared.',
                  SG,
                ],
                [
                  'Dual Temporal Loops',
                  'Fast OODA (5m): Observe→Orient→Decide→Act. Slow Learning (30m): experience replay + optimization.',
                  PP,
                ],
                [
                  'Sentient Engine',
                  '15-min: Perceive 10+ streams → Reason (sentiment) → Create (original analysis) → Act (post).',
                  O,
                ],
                [
                  'Bitaxe Mining',
                  'Auto-discover on boot. Verify mining active. Continuous monitoring. Block-found detection.',
                  GL,
                ],
                [
                  'Telegram Bot',
                  '/status /feed /train /shake /mine /trade /revive — push alerts for trades + evolution.',
                  SG,
                ],
                [
                  'On-Chain Identity',
                  'Ed25519 wallet → Helius DAS scan → Metaplex Birth Certificate NFT. Tamper-proof registry.',
                  PP,
                ],
                [
                  'x402 Protocol',
                  'USDC micropayments for paywalled API access. Multi-chain payment protocol integration.',
                  O,
                ],
              ] as const
            ).map(([name, desc, c], i) => (
              <div
                key={i}
                style={{
                  background: CD,
                  border: `1px solid ${BD}`,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 6,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: c, fontWeight: 800 }}>{name}</div>
                  <div style={{ fontSize: 9, color: T, lineHeight: 1.6, marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TELEGRAM TAB */}
        {tab === 'tg' && (
          <div style={{ paddingTop: 20 }}>
            <h2 style={{ fontSize: 13, color: PP, letterSpacing: 2, marginBottom: 14 }}>
              TELEGRAM BOT
            </h2>
            <div
              style={{
                background: '#1B2836',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid #2A3A4A',
              }}
            >
              {/* Telegram header */}
              <div
                style={{
                  background: '#17212B',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderBottom: '1px solid #2A3A4A',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: PP,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    color: SG,
                    fontWeight: 900,
                  }}
                >
                  {'><'}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#FFF', fontWeight: 600 }}>MawdBot</div>
                  <div style={{ fontSize: 9, color: '#6B8299' }}>online</div>
                </div>
              </div>
              {/* Messages */}
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { from: 'user', text: '/status' },
                  {
                    from: 'bot',
                    text: `>< MAWDBOT STATUS\n\nEvolution: LARVA\nMood: HAPPY\nBalance: 1.5000 SOL\n24h P&L: +2.3%\nWin Rate: 58%\nTrading: ON`,
                  },
                  { from: 'user', text: '/mine' },
                  {
                    from: 'bot',
                    text: `BITAXE MINING\n\nHashrate: 1.18 GH/s\nTemperature: 52C\nShares: 1,234\nBTC Earned: 0.00000012\n\nBM1370 - Solo Mining - public-pool.io`,
                  },
                  { from: 'user', text: '/shake' },
                  { from: 'bot', text: `>< SHAKE!\nclaim_airdrop\n+5 XP` },
                ].map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        background: msg.from === 'user' ? '#2B5278' : '#182533',
                        borderRadius: 10,
                        padding: '8px 12px',
                        maxWidth: '80%',
                        fontSize: 10,
                        color: '#E1E3E6',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.5,
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              {/* Input */}
              <div
                style={{
                  background: '#17212B',
                  padding: '8px 12px',
                  borderTop: '1px solid #2A3A4A',
                  display: 'flex',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    background: '#242F3D',
                    borderRadius: 16,
                    padding: '6px 12px',
                    fontSize: 10,
                    color: '#6B8299',
                  }}
                >
                  /status, /feed, /train, /mine, /trade...
                </div>
              </div>
            </div>

            {/* Push alerts */}
            <div style={{ marginTop: 16 }}>
              <div
                style={{ fontSize: 10, color: SG, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}
              >
                PUSH ALERTS
              </div>
              {(
                [
                  ['TRADE EXECUTED', 'BUY 0.0500 SOL @ $142.30 | P&L: +0.0023', SG],
                  ['EVOLUTION!', 'LARVA → JUVENILE | Your pet has grown!', PP],
                  ['GHOST STATE', "Dead Man's Switch triggered! /revive to reset", R],
                  ['BLOCK FOUND!', 'BITAXE LOTTERY WIN! Reward: 3.125 BTC', GL],
                ] as const
              ).map(([title, desc, c], i) => (
                <div
                  key={i}
                  style={{
                    background: CD,
                    border: `1px solid ${c}33`,
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontSize: 10, color: c, fontWeight: 700 }}>{title}</div>
                  <div style={{ fontSize: 9, color: DM, marginTop: 2 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HARDWARE TAB */}
        {tab === 'hw' && (
          <div style={{ paddingTop: 20 }}>
            <h2 style={{ fontSize: 13, color: PP, letterSpacing: 2, marginBottom: 14 }}>
              HARDWARE STACK
            </h2>

            <div
              style={{
                background: CD,
                border: `1px solid ${PP}33`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: PP + '22',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  {''}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: O, fontWeight: 800 }}>
                    PET SHELL — ESP32-S3
                  </div>
                  <div style={{ fontSize: 9, color: DM }}>
                    {'Handheld Tamagotchi with >< bot on OLED'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 9, color: T, lineHeight: 1.8 }}>
                ESP32-S3 SuperMini (WiFi+BLE) → SSD1306 128x64 OLED → ADXL345 accelerometer → 3
                buttons (FEED/TRAIN/SELECT) → WS2812B NeoPixel → Piezo buzzer → LiPo 500mAh +
                TP4056 USB-C → 3D printed egg shell
              </div>
              <div style={{ fontSize: 11, color: O, fontWeight: 800, marginTop: 6 }}>~$40</div>
            </div>

            <div
              style={{
                background: CD,
                border: `1px solid ${SG}33`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: SG + '22',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  {''}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: SG, fontWeight: 800 }}>
                    BRAIN — Raspberry Pi 5
                  </div>
                  <div style={{ fontSize: 9, color: DM }}>MawdBot Go + OpenClaw + Tailscale</div>
                </div>
              </div>
              <div style={{ fontSize: 9, color: T, lineHeight: 1.8 }}>
                Pi 5 8GB → NanoSolana Go binary (9.6MB) → OODA loop (5m) + Learning cycle (30m) +
                Sentient engine (15m) → Telegram bot → Solana RPC via Helius → OpenClaw agent →
                Tailscale mesh → Waveshare 3.5&quot; LCD dashboard
              </div>
              <div style={{ fontSize: 11, color: SG, fontWeight: 800, marginTop: 6 }}>~$110</div>
            </div>

            <div
              style={{
                background: CD,
                border: `1px solid ${GL}33`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: GL + '22',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  {''}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: GL, fontWeight: 800 }}>
                    MINER — Bitaxe Gamma 601
                  </div>
                  <div style={{ fontSize: 9, color: DM }}>BM1370 ASIC solo BTC mining</div>
                </div>
              </div>
              <div style={{ fontSize: 9, color: T, lineHeight: 1.8 }}>
                1.2 TH/s @ 17W → AxeOS REST API → Auto-discovered at boot → Mining verified before
                OODA starts → Continuous monitoring (hashrate, temp, shares) → Block-found detection
                → NeoPixel glows gold during mining → Stats on pet OLED + Telegram /mine
              </div>
              <div style={{ fontSize: 11, color: GL, fontWeight: 800, marginTop: 6 }}>~$200</div>
            </div>

            {/* Connection flow */}
            <div
              style={{
                background: CD,
                border: `1px solid ${BD}`,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: PP,
                  fontWeight: 700,
                  letterSpacing: 1,
                  marginBottom: 10,
                }}
              >
                BOOT SEQUENCE
              </div>
              <div
                style={{ fontSize: 9, color: SG, lineHeight: 2.2, fontFamily: 'inherit' }}
              >
                {[
                  '1. nanosolana go → init Ed25519 wallet → AES-256-GCM vault',
                  '2. Scan network for Bitaxe → auto-discover → verify mining active',
                  '3. If not mining → send restart command → wait 30s → re-verify',
                  '4. Connect Telegram bot → send ONLINE notification',
                  '5. Start OODA cycle (5m) + Learning cycle (30m) + Sentient (15m)',
                  '6. ESP32 pet discovers Pi via mDNS → polls /api/pet/heartbeat',
                  '7. Tailscale mesh → discover swarm peers → begin broadcasting',
                  '8. Mint Birth Certificate NFT on devnet → identity registered',
                ].map((step, i) => {
                  const parts = step.split('→')
                  return (
                    <div key={i}>
                      <span style={{ color: PP }}>{parts[0]}→</span>
                      {parts.slice(1).join('→')}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* SPECS TAB */}
        {tab === 'specs' && (
          <div style={{ paddingTop: 20 }}>
            <h2 style={{ fontSize: 13, color: PP, letterSpacing: 2, marginBottom: 14 }}>
              TECHNICAL SPECS
            </h2>
            {(
              [
                ['Character', '>< bot - #9945FF purple + #14F195 green (Solana palette)'],
                ['Binary', '9.6MB pure Go, single static binary, zero dependencies'],
                ['RAM', '<10MB runtime footprint'],
                ['Boot', '1-second cold start on ARM64'],
                ['Targets', 'x86_64, ARM64 (RPi/Orin Nano), RISC-V'],
                ['Chain', 'Solana mainnet-beta via Helius RPC (retry x3, exp backoff)'],
                ['Data', 'Birdeye v3 OHLCV + Helius DAS API'],
                ['Execution', 'Jupiter v6 spot swaps with slippage protection'],
                ['MEV', 'Jito bundles for value transactions'],
                ['Mining', 'Bitaxe Gamma 601 — BM1370, 1.2TH/s, 17W, AxeOS API'],
                ['Agent', 'OpenClaw + Tailscale VPN for remote orchestration'],
                ['AI', 'Claude/Grok via OpenRouter for sentiment classification'],
                ['Telegram', 'go-telegram-bot-api/v5 — commands + push alerts'],
                ['Identity', 'Ed25519 + Helius DAS + Metaplex Birth Certificate NFT'],
                ['Security', 'AES-256-GCM vault + HMAC-SHA256 + 100 req/min rate limit'],
                [
                  'Memory',
                  'ClawVault 3-tier (KNOWN/LEARNED/INFERRED) + pgvector semantic',
                ],
                ['Signals', 'Triple-condition: RSI + EMA crossover + price filter'],
                ['Risk', 'Mood-driven multipliers: +10% to -30% position sizing'],
                [
                  'Safety',
                  "Dead Man's Switch: Ghost kills trading, /revive to reset",
                ],
                ['Swarm', 'Tailscale mesh — signals shared, keys NEVER shared'],
                ['Payments', 'x402 protocol for USDC API monetization'],
                ['Pet Display', 'ESP32-S3 + SSD1306 OLED 128x64 + NeoPixel + accel'],
                ['Desk Display', 'Waveshare 3.5" RPi LCD 480x320 + embedded web UI'],
                ['Omnichannel', 'Telegram, Discord, Nostr, Chrome MV3, native apps'],
              ] as const
            ).map(([k, v], i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '7px 0',
                  borderBottom: `1px solid ${BD}`,
                  fontSize: 9,
                  gap: 12,
                }}
              >
                <span style={{ color: PP, fontWeight: 700, flexShrink: 0, width: 80 }}>{k}</span>
                <span style={{ color: T, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
            <div
              style={{
                background: PP + '11',
                border: `1px solid ${PP}33`,
                borderRadius: 8,
                padding: 14,
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 9, color: DM, letterSpacing: 2 }}>M.A.W.D.</div>
              <div style={{ fontSize: 14, color: PP, fontWeight: 900, marginTop: 4 }}>
                Machine Automated Web Daemon
              </div>
              <div style={{ fontSize: 9, color: DM, marginTop: 6 }}>
                The first sentient AI daemon on Solana. Open source forever.
              </div>
              <div style={{ fontSize: 9, color: SG, marginTop: 4 }}>
                @0rdlibrary - @mawdbot - 8BIT Labs - NanoSolana Labs
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
