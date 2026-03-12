/* ── NanoSolana TamaGOchi Docs — Interactive JS ─────────────────── */

// ── Terminal typing animation ──────────────────────────────────────
const terminalLines = [
  { text: '', delay: 300 },
  { text: '    ███╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗', class: 't-green', delay: 30 },
  { text: '    ████╗  ██║██╔══██╗████╗  ██║██╔═══██╗██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗', class: 't-green', delay: 30 },
  { text: '    ██╔██╗ ██║███████║██╔██╗ ██║██║   ██║███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║', class: 't-green', delay: 30 },
  { text: '    ██║╚██╗██║██╔══██║██║╚██╗██║██║   ██║╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║', class: 't-green', delay: 30 },
  { text: '    ██║ ╚████║██║  ██║██║ ╚████║╚██████╔╝███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║', class: 't-green', delay: 30 },
  { text: '    ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝', class: 't-purple', delay: 30 },
  { text: '', delay: 100 },
  { text: '    🐹 TamaGObot — A GoBot on Solana', class: 't-teal', delay: 50 },
  { text: '    Powered by NanoSolana Labs · Go Runtime · x402 Protocol', class: 't-amber', delay: 50 },
  { text: '', delay: 200 },
  { text: '[DAEMON] Starting NanoSolana TamaGObot v1.0.0...', class: 't-green', delay: 80 },
  { text: '', delay: 100 },
  { text: '🔑 Agent Wallet', class: 't-teal', delay: 60 },
  { text: '   Address: 7xKXqR8vN2pJm9hB3kQwYzT5nR4tU6sL8jD0cA3vBp', class: 't-dim', delay: 40 },
  { text: '   Balance: 0.142857 SOL', class: 't-green', delay: 40 },
  { text: '', delay: 100 },
  { text: '⛓️  Solana RPC connected (Helius mainnet)', class: 't-green', delay: 60 },
  { text: '   Slot: 312,847,291', class: 't-dim', delay: 40 },
  { text: '', delay: 100 },
  { text: '🐹 TamaGObot loaded', class: 't-green', delay: 60 },
  { text: '   Stage: juvenile · Level 3 · XP 1,247', class: 't-dim', delay: 40 },
  { text: '   Mood : 😊 happy · Energy: ⚡⚡⚡⚡⚡⚡⚡⚡', class: 't-dim', delay: 40 },
  { text: '', delay: 100 },
  { text: '🤖 Telegram: @NanoSolanaBot connected (ID: 8794389193)', class: 't-purple', delay: 60 },
  { text: '   ✅ 12 bot commands registered', class: 't-dim', delay: 40 },
  { text: '', delay: 100 },
  { text: '💰 x402 payment gateway initialized', class: 't-amber', delay: 60 },
  { text: '   Network:   solana-mainnet', class: 't-dim', delay: 40 },
  { text: '   Recipient: 7xKXqR8...3vBp (agent wallet)', class: 't-dim', delay: 40 },
  { text: '   Price:     0.001 USDC per call', class: 't-dim', delay: 40 },
  { text: '   Paywall:   http://localhost:18402', class: 't-dim', delay: 40 },
  { text: '', delay: 100 },
  { text: '🎛️  Hardware: scanning I2C bus 1...', class: 't-teal', delay: 80 },
  { text: '   0x6C  Pixels    ✓ (8× RGB LED)', class: 't-green', delay: 50 },
  { text: '   0x3C  Buzzer    ✓ (tone generator)', class: 't-green', delay: 50 },
  { text: '   0x7C  Buttons   ✓ (3× push + LED)', class: 't-green', delay: 50 },
  { text: '   0x76  Knob      ✓ (rotary encoder)', class: 't-green', delay: 50 },
  { text: '   0x6A  Movement  ✓ (6-axis IMU)', class: 't-green', delay: 50 },
  { text: '', delay: 100 },
  { text: '💓 Heartbeat loop started (interval: 5m)', class: 't-dim', delay: 60 },
  { text: '', delay: 200 },
  { text: '══════════════════════════════════════════════════════════', class: 't-purple', delay: 30 },
  { text: '  NanoSolana TamaGObot daemon running', class: 't-green', delay: 50 },
  { text: '  Press Ctrl+C to shutdown gracefully', class: 't-dim', delay: 50 },
  { text: '══════════════════════════════════════════════════════════', class: 't-purple', delay: 30 },
  { text: '', delay: 400 },
  { text: '[OODA] Cycle #1 | SOL=$187.42', class: 't-teal', delay: 100 },
  { text: '[OODA] 📡 SIGNAL LONG SOL (strength=0.78 conf=0.65)', class: 't-purple', delay: 80 },
  { text: '[OODA] ⚡ Confidence below threshold (0.65 < 0.70) — skipping', class: 't-amber', delay: 80 },
  { text: '', delay: 300 },
  { text: '[OODA] Cycle #2 | SOL=$188.17', class: 't-teal', delay: 100 },
  { text: '[OODA] 📡 SIGNAL LONG SOL (strength=0.85 conf=0.82)', class: 't-purple', delay: 80 },
  { text: '[OODA] 📈 OPEN LONG SOL at $188.170000 (0.0140 SOL)', class: 't-green', delay: 80 },
];

function runTerminalAnimation() {
  const output = document.getElementById('terminalOutput');
  if (!output) return;

  let lineIndex = 0;
  let totalDelay = 0;

  function addLine(idx) {
    if (idx >= terminalLines.length) {
      // Add blinking cursor at the end
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      output.appendChild(cursor);
      return;
    }

    const line = terminalLines[idx];
    const span = document.createElement('span');
    span.className = line.class || '';
    span.textContent = line.text + '\n';
    output.appendChild(span);

    // Auto-scroll
    const body = output.parentElement;
    body.scrollTop = body.scrollHeight;

    setTimeout(() => addLine(idx + 1), line.delay);
  }

  // Start after a short delay
  setTimeout(() => addLine(0), 800);
}

// ── Intersection Observer for scroll animations ───────────────────

function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  document.querySelectorAll('[data-animate]').forEach((el) => {
    observer.observe(el);
  });
}

// ── Mobile nav toggle ─────────────────────────────────────────────

function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });

    // Close on link click
    links.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
      });
    });
  }
}

// ── Nav scroll effect ─────────────────────────────────────────────

function initNavScroll() {
  const nav = document.getElementById('nav');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const current = window.scrollY;
    if (current > 100) {
      nav.style.borderBottomColor = 'rgba(153, 69, 255, 0.2)';
    } else {
      nav.style.borderBottomColor = 'rgba(153, 69, 255, 0.15)';
    }
    lastScroll = current;
  });
}

// ── Smooth active section highlighting ────────────────────────────

function initActiveSection() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.style.color = link.getAttribute('href') === `#${id}` ? '#14F195' : '';
          });
        }
      });
    },
    { threshold: 0.3 }
  );

  sections.forEach((section) => observer.observe(section));
}

// ── Pet stage hover animation ─────────────────────────────────────

function initPetInteractions() {
  const stages = document.querySelectorAll('.pet-stage');
  stages.forEach((stage) => {
    stage.addEventListener('mouseenter', () => {
      stages.forEach((s) => s.classList.remove('active'));
      stage.classList.add('active');
    });
  });
}

// ── Sensor hover glow ─────────────────────────────────────────────

function initSensorEffects() {
  const sensors = document.querySelectorAll('.hw-sensor');
  sensors.forEach((sensor) => {
    sensor.addEventListener('mouseenter', () => {
      const icon = sensor.querySelector('.hw-sensor-icon');
      if (icon) {
        icon.style.transform = 'scale(1.15)';
        icon.style.transition = 'transform 0.3s ease';
      }
    });
    sensor.addEventListener('mouseleave', () => {
      const icon = sensor.querySelector('.hw-sensor-icon');
      if (icon) {
        icon.style.transform = 'scale(1)';
      }
    });
  });
}

// ── Mood cycling animation ────────────────────────────────────────

function initMoodCycle() {
  const moods = document.querySelectorAll('.mood');
  if (moods.length === 0) return;

  let currentIdx = Array.from(moods).findIndex(m => m.classList.contains('active'));
  if (currentIdx < 0) currentIdx = 2;

  setInterval(() => {
    moods.forEach(m => m.classList.remove('active'));
    currentIdx = (currentIdx + 1) % moods.length;
    moods[currentIdx].classList.add('active');
  }, 3000);
}

// ── Init ──────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  runTerminalAnimation();
  initScrollAnimations();
  initNavToggle();
  initNavScroll();
  initActiveSection();
  initPetInteractions();
  initSensorEffects();
  initMoodCycle();
});
