import { useState, useEffect, useRef } from 'react'

interface Connector {
  name: string
  status: string
  type: string
}

interface StatusInfo {
  status: string
  version: string
  agent: string
  uptime: string
  mode: string
}

export default function App() {
  const [status, setStatus] = useState<StatusInfo | null>(null)
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [messages, setMessages] = useState<string[]>(['🦞 MawdBot Console ready.'])
  const [input, setInput] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/status').then(r => r.json()).then(setStatus).catch(() => {})
    fetch('/api/connectors').then(r => r.json()).then(setConnectors).catch(() => {})
    const interval = setInterval(() => {
      fetch('/api/status').then(r => r.json()).then(setStatus).catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages(prev => [...prev, `> ${input}`, '🦞 Processing...'])
    setInput('')
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🦞 MAWDBOT OS</h1>
        <span className="status">● {status?.status ?? 'connecting...'}</span>
      </header>

      <div className="dashboard">
        {/* Status Panel */}
        <div className="panel">
          <h2>System Status</h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            <div>
              <div className="value">{status?.version ?? '—'}</div>
              <div className="label">Version</div>
            </div>
            <div>
              <div className="value">{status?.mode || 'simulated'}</div>
              <div className="label">Mode</div>
            </div>
            <div>
              <div className="value">{status?.uptime ?? '—'}</div>
              <div className="label">Uptime</div>
            </div>
            <div>
              <div className="value">{status?.agent ?? '—'}</div>
              <div className="label">Agent</div>
            </div>
          </div>
        </div>

        {/* Connectors Panel */}
        <div className="panel">
          <h2>Connectors</h2>
          {connectors.map(c => (
            <div key={c.name} className="connector-row">
              <span className="connector-name">{c.name}</span>
              <span className={`connector-status ${c.status}`}>{c.status}</span>
            </div>
          ))}
          {connectors.length === 0 && (
            <div style={{color:'var(--text-dim)'}}>Loading connectors...</div>
          )}
        </div>

        {/* Chat Panel */}
        <div className="panel chat-panel">
          <h2>Agent Console</h2>
          <div className="chat-messages" ref={chatRef}>
            {messages.map((m, i) => (
              <div key={i} style={{
                padding:'4px 0',
                color: m.startsWith('>') ? 'var(--teal)' : m.startsWith('🦞') ? 'var(--neon)' : 'var(--text)',
                borderBottom: '1px solid #0a0a14',
              }}>
                {m}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask MawdBot..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
    </div>
  )
}
