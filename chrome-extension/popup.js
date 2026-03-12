// ═══════════════════════════════════════════════════
// NanoBot Chrome Extension — Popup Logic
// ═══════════════════════════════════════════════════

const DEFAULT_API = 'http://127.0.0.1:7777';
let API = DEFAULT_API;
let walletAddress = '';

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const settings = await getStorage(['nanobotUrl', 'network']);
  if (settings.nanobotUrl) API = settings.nanobotUrl;

  // Setup event listeners
  setupTabs();
  setupButtons();
  setupChat();

  // Connect
  await checkConnection();
});

// ── Storage Helpers ──
function getStorage(keys) {
  return new Promise(resolve => {
    chrome.storage.local.get(keys, data => resolve(data));
  });
}

function setStorage(data) {
  return new Promise(resolve => {
    chrome.storage.local.set(data, () => resolve());
  });
}

// ── Tabs ──
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + name));
}

// ── Connection ──
async function checkConnection() {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  const overlay = document.getElementById('offlineOverlay');

  try {
    const r = await fetch(API + '/api/status', { signal: AbortSignal.timeout(3000) });
    const d = await r.json();
    dot.classList.add('online');
    text.textContent = d.status || 'ready';
    overlay.classList.remove('visible');
    
    // Load wallet data
    refreshWallet();
  } catch {
    dot.classList.remove('online');
    text.textContent = 'offline';
    overlay.classList.add('visible');
  }
}

// ── Buttons ──
function setupButtons() {
  // Settings
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsPanel').classList.add('visible');
    document.getElementById('settingUrl').value = API;
  });
  document.getElementById('settingsClose').addEventListener('click', () => {
    document.getElementById('settingsPanel').classList.remove('visible');
  });
  document.getElementById('saveSettings').addEventListener('click', async () => {
    const url = document.getElementById('settingUrl').value.trim() || DEFAULT_API;
    const network = document.getElementById('settingNetwork').value;
    API = url;
    await setStorage({ nanobotUrl: url, network });
    document.getElementById('settingsPanel').classList.remove('visible');
    checkConnection();
  });

  // Popout
  document.getElementById('popoutBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: API });
  });

  // Retry
  document.getElementById('retryBtn').addEventListener('click', () => {
    checkConnection();
  });

  // Wallet actions
  document.getElementById('sendToggle').addEventListener('click', () => {
    document.getElementById('sendForm').classList.toggle('visible');
  });
  document.getElementById('refreshBtn').addEventListener('click', () => refreshWallet());
  document.getElementById('explorerBtn').addEventListener('click', () => {
    if (walletAddress) chrome.tabs.create({ url: 'https://solscan.io/account/' + walletAddress });
  });
  document.getElementById('sendBtn').addEventListener('click', () => sendSOL());
  document.getElementById('walletAddr').addEventListener('click', () => copyAddress());

  // Token & history refresh
  document.getElementById('tokenRefresh').addEventListener('click', () => loadTokens());
  document.getElementById('historyRefresh').addEventListener('click', () => loadHistory());

  // Tool buttons
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => runCmd(btn.dataset.cmd));
  });
}

// ── Wallet ──
async function refreshWallet() {
  try {
    const r = await fetch(API + '/api/wallet', { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    walletAddress = d.address || '';
    const bal = d.balance ? parseFloat(d.balance) : 0;

    const balEl = document.getElementById('walletBalance');
    balEl.textContent = bal > 0 ? bal.toFixed(4) + ' SOL' : '0 SOL';
    balEl.style.fontSize = '';

    document.getElementById('walletAddrText').textContent = walletAddress || 'No wallet';

    const netEl = document.getElementById('walletNetwork');
    const net = d.network || (d.engine ? 'mainnet' : 'devnet');
    netEl.textContent = net;
    netEl.className = 'wallet-network ' + net;

    // USD & price stats
    const usdEl = document.getElementById('walletUSD');
    const statsEl = document.getElementById('walletStats');

    if (d.solPrice && d.solPrice > 0) {
      const usdVal = bal * d.solPrice;
      usdEl.innerHTML = `≈ $${usdVal.toFixed(2)} <span class="sol-price">SOL $${d.solPrice.toFixed(2)}</span>`;
      document.getElementById('statSolPrice').textContent = '$' + d.solPrice.toFixed(2);
      document.getElementById('statTotalValue').textContent = d.totalValueUSD ? '$' + d.totalValueUSD.toFixed(2) : '$' + usdVal.toFixed(2);
      document.getElementById('statAssets').textContent = d.totalAssets || '—';
      statsEl.style.display = '';
    } else {
      usdEl.innerHTML = '';
      statsEl.style.display = 'none';
    }

    if (!d.engine) {
      balEl.textContent = 'Offline';
      balEl.style.fontSize = '18px';
      usdEl.innerHTML = '<span style="font-size:9px;color:var(--text-muted)">Set HELIUS_RPC_URL to connect</span>';
    }
  } catch (e) {
    document.getElementById('walletBalance').textContent = 'Error';
    document.getElementById('walletAddrText').textContent = 'Connect NanoBot server';
  }

  loadTokens();
  loadHistory();
}

function copyAddress() {
  if (!walletAddress) return;
  navigator.clipboard.writeText(walletAddress).then(() => {
    const el = document.getElementById('walletAddrText');
    const orig = el.textContent;
    el.textContent = '✅ Copied!';
    setTimeout(() => el.textContent = orig, 1500);
  });
}

async function sendSOL() {
  const to = document.getElementById('sendTo').value.trim();
  const amount = document.getElementById('sendAmount').value.trim();
  const btn = document.getElementById('sendBtn');
  if (!to || !amount) return;

  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    const r = await fetch(API + '/api/wallet/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, amount })
    });
    const d = await r.json();
    if (d.ok) {
      btn.textContent = '✅ Sent!';
      addMessage('NanoBot', `✅ Sent ${d.amount} SOL!\nSignature: ${d.signature}`, 'bot');
      switchTab('chat');
      refreshWallet();
    } else {
      btn.textContent = '❌ ' + (d.error || 'Failed');
    }
  } catch {
    btn.textContent = '❌ Error';
  }
  setTimeout(() => { btn.textContent = 'Send SOL'; btn.disabled = false; }, 3000);
}

// ── Tokens ──
async function loadTokens() {
  const el = document.getElementById('tokenList');
  const btn = document.getElementById('tokenRefresh');
  btn.classList.add('spinning');

  try {
    // Try DAS portfolio first
    const r = await fetch(API + '/api/wallet/portfolio', { signal: AbortSignal.timeout(12000) });
    const d = await r.json();
    btn.classList.remove('spinning');

    if (d.error) {
      // Fall back to basic tokens
      const r2 = await fetch(API + '/api/wallet/tokens');
      const d2 = await r2.json();
      if (!d2.tokens || d2.tokens.length === 0) {
        el.innerHTML = '<div class="empty-state">No tokens found</div>';
        return;
      }
      el.innerHTML = d2.tokens.map(t => `
        <div class="token-item">
          <div class="token-icon">🪙</div>
          <div class="token-info">
            <div class="token-name">${esc(t.symbol || 'Unknown')}</div>
            <div class="token-mint">${esc(t.mint)}</div>
          </div>
          <div><div class="token-amount">${t.ui_amount?.toFixed(4) || t.amount}</div></div>
        </div>
      `).join('');
      return;
    }

    if (!d.tokens || d.tokens.length === 0) {
      el.innerHTML = '<div class="empty-state">No tokens found</div>';
      return;
    }

    d.tokens.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0));
    el.innerHTML = d.tokens.map(t => `
      <div class="token-item">
        <div class="token-icon">🪙</div>
        <div class="token-info">
          <div class="token-name">${esc(t.symbol || t.name || 'Unknown')}</div>
          <div class="token-mint">${esc(t.mint)}</div>
        </div>
        <div>
          <div class="token-amount">${t.uiAmount ? t.uiAmount.toFixed(4) : t.balance}</div>
          ${t.totalValue ? '<div class="token-value">$' + t.totalValue.toFixed(2) + '</div>' : ''}
        </div>
      </div>
    `).join('');
  } catch {
    btn.classList.remove('spinning');
    el.innerHTML = '<div class="empty-state">Server offline — set HELIUS_RPC_URL</div>';
  }
}

// ── History ──
async function loadHistory() {
  const el = document.getElementById('txHistory');
  const btn = document.getElementById('historyRefresh');
  btn.classList.add('spinning');

  try {
    const r = await fetch(API + '/api/wallet/history', { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    btn.classList.remove('spinning');

    if (!d.history || d.history.length === 0) {
      el.innerHTML = '<div class="empty-state">No transactions yet</div>';
      return;
    }

    el.innerHTML = d.history.map(tx => {
      const sig = tx.signature || tx.Signature || '';
      const short = sig.substring(0, 12) + '...' + sig.substring(sig.length - 8);
      const type = tx.type || tx.Type || 'UNKNOWN';
      const time = tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleString() : '';
      return `
        <div class="tx-item">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:600;color:var(--sol-purple)">${esc(type)}</span>
            <span style="color:var(--text-muted);font-size:9px">${esc(time)}</span>
          </div>
          <a class="tx-sig" href="https://solscan.io/tx/${sig}" target="_blank">${short}</a>
        </div>
      `;
    }).join('');
  } catch {
    btn.classList.remove('spinning');
    el.innerHTML = '<div class="empty-state">Server offline</div>';
  }
}

// ── Chat ──
function setupChat() {
  const input = document.getElementById('chatInput');
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  });
  document.getElementById('chatSendBtn').addEventListener('click', () => sendChat());
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;

  addMessage('You', msg, 'user');
  input.value = '';

  const typing = document.getElementById('typingIndicator');
  typing.classList.add('active');

  try {
    const r = await fetch(API + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    const d = await r.json();
    typing.classList.remove('active');
    addMessage('NanoBot', d.response || d.reply || 'Hmm, I got nothing back.', 'bot');
  } catch {
    typing.classList.remove('active');
    addMessage('NanoBot', '⚠️ Server offline. Start with: nanosolana nanobot', 'bot');
  }
}

function addMessage(sender, text, type) {
  const el = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'msg ' + type;
  div.innerHTML = `<div class="sender">${esc(sender)}</div>${esc(text).replace(/\n/g, '<br>')}`;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

// ── Tools ──
async function runCmd(cmd) {
  const output = document.getElementById('toolOutput');
  output.classList.add('visible');
  output.textContent = `> ${cmd}\nRunning...`;

  try {
    const r = await fetch(API + '/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd })
    });
    const d = await r.json();
    // Strip ANSI codes
    const clean = (d.output || d.result || 'No output').replace(/\x1b\[[0-9;]*m/g, '');
    output.textContent = `> ${cmd}\n${clean}`;
  } catch {
    output.textContent = `> ${cmd}\n⚠️ Server offline`;
  }
}

// ── Util ──
function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}
