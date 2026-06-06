/* ═══════════════════════════════════════════
   LI-FI SYSTEM — MASTER SCRIPT
   Features: Simulation, Charts, Session Storage,
   Form Validation, Animations, Dark/Light Mode
   ═══════════════════════════════════════════ */

'use strict';

/* ── STATE ── */
const state = {
  isTransmitting: false,
  transmissionInterval: null,
  monitorInterval: null,
  photonInterval: null,
  pktCounter: 0,
  totalSent: 0,
  totalReceived: 0,
  totalSuccess: 0,
  totalFailed: 0,
  currentDataRate: 0,
  currentSignal: 0,
  speedHistory: [],
  signalHistory: [],
  packetHistory: [],
  theme: 'dark',
};

/* ── CHART INSTANCES ── */
let speedChart, signalChart, packetChart;

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbar();
  initPhotonStream();
  initHeroAnimation();
  initCharts();
  initScrollReveal();
  loadSessionHistory();
  startLiveMonitor();
  log('info', 'System initialized — Li-Fi controller ready');
  log('info', 'Awaiting transmission command...');
});

/* ══════════════════════════════════════════
   THEME
══════════════════════════════════════════ */
function initTheme() {
  const saved = sessionStorage.getItem('lifi-theme') || 'dark';
  applyTheme(saved);
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeToggle').querySelector('.theme-icon').textContent =
    theme === 'dark' ? '☀' : '☾';
  sessionStorage.setItem('lifi-theme', theme);
  if (speedChart) updateChartTheme();
}

document.getElementById('themeToggle').addEventListener('click', () => {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
});

function updateChartTheme() {
  const textColor = state.theme === 'dark' ? '#7a9ab5' : '#305870';
  const gridColor = state.theme === 'dark' ? '#1a3548' : '#c0d8ee';
  [speedChart, signalChart, packetChart].forEach(chart => {
    if (!chart) return;
    chart.options.scales.x.ticks.color = textColor;
    chart.options.scales.y.ticks.color = textColor;
    chart.options.scales.x.grid.color = gridColor;
    chart.options.scales.y.grid.color = gridColor;
    chart.update('none');
  });
}

/* ══════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════ */
function initNavbar() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));

  // Active link on scroll
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-link');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navItems.forEach(a => a.classList.remove('active'));
        const link = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => observer.observe(s));

  // Navbar style on scroll
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    navbar.style.boxShadow = window.scrollY > 20 ? '0 4px 30px rgba(0,0,0,0.4)' : 'none';
  });
}

/* ══════════════════════════════════════════
   HERO PHOTON STREAM
══════════════════════════════════════════ */
function initPhotonStream() {
  const container = document.getElementById('photonStream');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'photon';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      animation-duration: ${3 + Math.random() * 6}s;
      animation-delay: ${Math.random() * 5}s;
      --drift: ${(Math.random() - 0.5) * 80}px;
      width: ${2 + Math.random() * 4}px;
      height: ${2 + Math.random() * 4}px;
    `;
    container.appendChild(p);
  }
}

/* ══════════════════════════════════════════
   HERO DATA BITS ANIMATION
══════════════════════════════════════════ */
function initHeroAnimation() {
  const dataBits = document.getElementById('dataBits');
  const receiverDisplay = document.getElementById('receiverDisplay');
  const messages = ['HELLO', 'LI-FI', 'DATA', 'LIGHT'];
  let msgIdx = 0;

  function animateMessage() {
    const msg = messages[msgIdx % messages.length];
    msgIdx++;
    const bytes = msg.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
    const bits = bytes.replace(/ /g, '').split('');

    dataBits.innerHTML = '';
    let i = 0;
    const interval = setInterval(() => {
      if (i >= bits.length) {
        clearInterval(interval);
        setTimeout(() => {
          receiverDisplay.textContent = msg;
          receiverDisplay.style.color = 'var(--success)';
          setTimeout(() => {
            receiverDisplay.style.color = '';
            setTimeout(animateMessage, 2000);
          }, 1500);
        }, 500);
        return;
      }
      const bit = document.createElement('div');
      bit.className = `bit bit-${bits[i]}`;
      bit.textContent = bits[i];
      dataBits.appendChild(bit);
      if (dataBits.children.length > 24) dataBits.removeChild(dataBits.firstChild);
      i++;
    }, 80);
  }
  setTimeout(animateMessage, 1000);
}

/* ══════════════════════════════════════════
   COMPONENT ACCORDION
══════════════════════════════════════════ */
function toggleDetail(el) {
  const isOpen = el.classList.contains('open');
  document.querySelectorAll('.comp-detail').forEach(d => d.classList.remove('open'));
  if (!isOpen) el.classList.add('open');
}

/* ══════════════════════════════════════════
   FORM VALIDATION
══════════════════════════════════════════ */
function validateInput(el) {
  const val = el.value.trim();
  const charCount = document.getElementById('charCount');
  const validationMsg = document.getElementById('validationMsg');
  const binaryOutput = document.getElementById('binaryOutput');

  charCount.textContent = `${el.value.length}/200`;

  if (el.value.length > 180) {
    charCount.style.color = 'var(--danger)';
  } else if (el.value.length > 140) {
    charCount.style.color = 'var(--warn)';
  } else {
    charCount.style.color = '';
  }

  if (val.length === 0) {
    el.classList.remove('error');
    validationMsg.textContent = '';
    binaryOutput.textContent = '— awaiting input —';
    return;
  }

  if (val.length < 1) {
    el.classList.add('error');
    validationMsg.textContent = 'Message cannot be empty';
  } else {
    el.classList.remove('error');
    validationMsg.textContent = '';
  }

  // Show binary preview
  const binary = val.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
  binaryOutput.textContent = binary.length > 200 ? binary.slice(0, 197) + '...' : binary;
}

/* ══════════════════════════════════════════
   TRANSMISSION ENGINE
══════════════════════════════════════════ */
function sendMessage() {
  const input = document.getElementById('msgInput');
  const msg = input.value.trim();

  // Validate
  if (msg.length === 0) {
    input.classList.add('error');
    document.getElementById('validationMsg').textContent = '⚠ Message cannot be empty';
    input.focus();
    shakeElement(input);
    return;
  }
  if (msg.length > 200) {
    document.getElementById('validationMsg').textContent = '⚠ Message exceeds 200 character limit';
    shakeElement(input);
    return;
  }

  simulateTransmission(msg);
}

function shakeElement(el) {
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shake 0.4s ease';
  setTimeout(() => el.style.animation = '', 400);
}

// Add shake keyframe dynamically
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }`;
document.head.appendChild(shakeStyle);

function simulateTransmission(msg) {
  const visual = document.querySelector('.transmission-visual');
  const txStatusText = document.getElementById('txStatusText');
  const txRateText = document.getElementById('txRateText');
  const txPktText = document.getElementById('txPktText');
  const txLed = document.getElementById('txLed');
  const rxLed = document.getElementById('rxLed');
  const receivedDisplay = document.getElementById('receivedDisplay');
  const rxMeta = document.getElementById('rxMeta');

  // Simulate failure randomly (5% chance)
  const isSuccess = Math.random() > 0.05;
  const pktId = ++state.pktCounter;
  const dataRate = (2 + Math.random() * 8).toFixed(1);
  const transferTime = (5 + Math.random() * 45).toFixed(2);

  // Update UI — transmitting
  visual.classList.add('transmitting');
  txStatusText.textContent = 'TRANSMITTING';
  txRateText.textContent = `${dataRate} Mbps`;
  txPktText.textContent = `#${pktId}`;
  txLed.classList.add('active');

  log('info', `Packet #${pktId} queued — ${msg.length} chars — ${msg.length * 8} bits`);

  // Spawn photons in beam
  const photonWrap = document.getElementById('txPhotons');
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'beam-photon';
      photonWrap.appendChild(p);
      setTimeout(() => p.remove(), 450);
    }, i * 80);
  }

  // After 1.2s — start receiving
  setTimeout(() => {
    visual.classList.remove('transmitting');
    visual.classList.add('receiving');
    rxLed.classList.add('active');
    txStatusText.textContent = 'RECEIVING';

    if (isSuccess) {
      // Typewriter effect
      receivedDisplay.innerHTML = '';
      let idx = 0;
      const cursor = document.createElement('span');
      cursor.style.cssText = 'border-right:2px solid var(--accent);margin-left:2px;animation:cursorBlink 0.7s step-end infinite;';
      receivedDisplay.appendChild(cursor);
      const typeInterval = setInterval(() => {
        receivedDisplay.insertBefore(document.createTextNode(msg[idx]), cursor);
        idx++;
        if (idx >= msg.length) {
          clearInterval(typeInterval);
          setTimeout(() => cursor.remove(), 1000);
        }
      }, Math.min(50, 800 / msg.length));

      // Meta info
      rxMeta.style.display = 'grid';
      document.getElementById('rxTime').textContent = new Date().toLocaleTimeString();
      document.getElementById('rxPktId').textContent = `#${pktId}`;
      document.getElementById('rxChecksum').textContent = `0x${Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4,'0')}`;
      document.getElementById('rxStatus').textContent = '✓ VALID';
      document.getElementById('rxStatus').className = 'meta-val success-text';

      state.totalSuccess++;
      log('ok', `Packet #${pktId} received successfully — ${transferTime}ms`);
    } else {
      receivedDisplay.innerHTML = `<span style="color:var(--danger)">⚠ Transmission error — packet #${pktId} corrupted or lost</span>`;
      state.totalFailed++;
      log('err', `Packet #${pktId} FAILED — signal interference detected`);
    }

    state.totalSent++;
    state.totalReceived += isSuccess ? 1 : 0;
    updateStats();
    updatePerformanceMetrics(dataRate, transferTime, isSuccess);
    saveToSession(msg, pktId, dataRate, isSuccess);
    updateHistoryTable();

    // Store sparkline data
    state.speedHistory.push(parseFloat(dataRate));
    state.signalHistory.push(isSuccess ? -40 - Math.random() * 20 : -70 - Math.random() * 20);
    state.packetHistory.push(isSuccess ? 100 : 0);
    updateCharts(dataRate, isSuccess);

  }, 1200);

  // Done
  setTimeout(() => {
    visual.classList.remove('receiving');
    rxLed.classList.remove('active');
    txLed.classList.remove('active');
    txStatusText.textContent = 'IDLE';
    txRateText.textContent = '0 Mbps';
    log('info', 'Transmission complete — system idle');
  }, 3000 + msg.length * 10);
}

function startTransmission() {
  const btn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  btn.disabled = true;
  stopBtn.disabled = false;
  state.isTransmitting = true;
  log('info', 'Auto-transmission started');

  const autoMessages = ['SYSTEM OK', 'DATA LINK ACTIVE', 'LIFI TEST', 'SIGNAL GOOD', 'PING 1', 'HELLO'];
  let i = 0;
  state.transmissionInterval = setInterval(() => {
    if (!state.isTransmitting) return;
    const msg = autoMessages[i % autoMessages.length];
    document.getElementById('msgInput').value = msg;
    validateInput(document.getElementById('msgInput'));
    simulateTransmission(msg);
    i++;
  }, 4000);
}

function stopTransmission() {
  clearInterval(state.transmissionInterval);
  state.isTransmitting = false;
  document.getElementById('startBtn').disabled = false;
  document.getElementById('stopBtn').disabled = true;
  log('info', 'Transmission stopped by user');
  document.getElementById('txStatusText').textContent = 'IDLE';
}

function clearData() {
  document.getElementById('msgInput').value = '';
  document.getElementById('binaryOutput').textContent = '— awaiting input —';
  document.getElementById('charCount').textContent = '0/200';
  document.getElementById('validationMsg').textContent = '';
  document.getElementById('receivedDisplay').innerHTML = `
    <div class="rx-placeholder">
      <span class="rx-placeholder-icon">◉</span>
      <span>Awaiting transmission...</span>
    </div>`;
  document.getElementById('rxMeta').style.display = 'none';
  document.getElementById('logBox').innerHTML = '';
  log('info', 'Data cleared');
}

/* ══════════════════════════════════════════
   PERFORMANCE METRICS
══════════════════════════════════════════ */
function updatePerformanceMetrics(dataRate, transferTime, isSuccess) {
  const dr = parseFloat(dataRate);

  // Data rate gauge
  const maxRate = 15;
  const fillPct = Math.min(dr / maxRate, 1);
  const dashOffset = 157 - (157 * fillPct);
  document.getElementById('gaugeDataRateFill').style.strokeDashoffset = dashOffset;
  document.getElementById('dataRateVal').textContent = dr.toFixed(1);
  animateValue('dataRateVal');

  // Signal strength
  const sig = isSuccess ? Math.round(-40 - Math.random() * 15) : Math.round(-65 - Math.random() * 20);
  const sigNorm = Math.min(Math.max((sig + 80) / 40, 0), 1);
  document.getElementById('gaugeSigFill').style.strokeDashoffset = 157 - (157 * sigNorm);
  document.getElementById('signalVal').textContent = sig;

  // BER
  const ber = isSuccess ? (Math.random() * 0.005).toFixed(4) : (0.05 + Math.random() * 0.1).toFixed(4);
  document.getElementById('berVal').textContent = ber;
  document.getElementById('berBar').style.width = `${Math.min(parseFloat(ber) * 500, 100)}%`;

  // Transfer time
  document.getElementById('xferTimeVal').textContent = transferTime;
  document.getElementById('timeBar').style.width = `${Math.min(parseFloat(transferTime) / 60 * 100, 100)}%`;

  // Packet success rate
  const total = state.totalSent;
  const successRate = total > 0 ? ((state.totalSuccess / total) * 100).toFixed(1) : '100';
  document.getElementById('pktSuccessVal').textContent = successRate;
  document.getElementById('successBar').style.width = `${successRate}%`;
}

function startLiveMonitor() {
  state.monitorInterval = setInterval(() => {
    if (!state.isTransmitting) return;
    const dr = (Math.random() * 10).toFixed(1);
    document.getElementById('dataRateVal').textContent = dr;
    document.getElementById('signalVal').textContent = Math.round(-45 - Math.random() * 20);
  }, 2000);
}

function updateStats() {
  ['totalSent', 'totalReceived', 'totalSuccess', 'totalFailed'].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = state[id];
    el.classList.remove('count-anim');
    void el.offsetWidth;
    el.classList.add('count-anim');
  });
}

function animateValue(id) {
  const el = document.getElementById(id);
  el.classList.remove('count-anim');
  void el.offsetWidth;
  el.classList.add('count-anim');
}

/* ══════════════════════════════════════════
   CHARTS
══════════════════════════════════════════ */
function getChartDefaults() {
  return {
    responsive: true,
    animation: { duration: 400 },
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: '#7a9ab5', font: { family: 'Share Tech Mono', size: 10 } },
        grid: { color: '#1a3548' },
      },
      y: {
        ticks: { color: '#7a9ab5', font: { family: 'Share Tech Mono', size: 10 } },
        grid: { color: '#1a3548' },
      }
    }
  };
}

function initCharts() {
  Chart.defaults.font.family = 'Share Tech Mono';

  // Speed Chart
  const speedCtx = document.getElementById('speedChart').getContext('2d');
  const speedGrad = speedCtx.createLinearGradient(0, 0, 0, 200);
  speedGrad.addColorStop(0, 'rgba(0,229,255,0.4)');
  speedGrad.addColorStop(1, 'rgba(0,229,255,0)');
  speedChart = new Chart(speedCtx, {
    type: 'line',
    data: {
      labels: Array(20).fill(''),
      datasets: [{
        data: Array(20).fill(0),
        borderColor: '#00e5ff', backgroundColor: speedGrad,
        borderWidth: 2, pointRadius: 0, fill: true, tension: 0.4
      }]
    },
    options: { ...getChartDefaults(), scales: { ...getChartDefaults().scales, y: { ...getChartDefaults().scales.y, min: 0, max: 15, ticks: { ...getChartDefaults().scales.y.ticks, callback: v => v + ' Mbps' } } } }
  });

  // Signal Chart
  const sigCtx = document.getElementById('signalChart').getContext('2d');
  const sigGrad = sigCtx.createLinearGradient(0, 0, 0, 200);
  sigGrad.addColorStop(0, 'rgba(0,255,136,0.4)');
  sigGrad.addColorStop(1, 'rgba(0,255,136,0)');
  signalChart = new Chart(sigCtx, {
    type: 'line',
    data: {
      labels: Array(10).fill(''),
      datasets: [{
        data: Array(10).fill(-60),
        borderColor: '#00ff88', backgroundColor: sigGrad,
        borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#00ff88', fill: true, tension: 0.4
      }]
    },
    options: { ...getChartDefaults(), scales: { ...getChartDefaults().scales, y: { ...getChartDefaults().scales.y, min: -90, max: -20, ticks: { ...getChartDefaults().scales.y.ticks, callback: v => v + ' dBm' } } } }
  });

  // Packet Delivery Chart
  const pktCtx = document.getElementById('packetChart').getContext('2d');
  packetChart = new Chart(pktCtx, {
    type: 'bar',
    data: {
      labels: Array(10).fill('').map((_, i) => `T-${10-i}`),
      datasets: [{
        data: Array(10).fill(100),
        backgroundColor: ctx => ctx.raw === 100 ? 'rgba(0,255,136,0.7)' : 'rgba(255,60,110,0.7)',
        borderColor: ctx => ctx.raw === 100 ? '#00ff88' : '#ff3c6e',
        borderWidth: 1, borderRadius: 4
      }]
    },
    options: { ...getChartDefaults(), scales: { ...getChartDefaults().scales, y: { ...getChartDefaults().scales.y, min: 0, max: 100, ticks: { ...getChartDefaults().scales.y.ticks, callback: v => v + '%' } } } }
  });
}

function updateCharts(dataRate, isSuccess) {
  // Speed
  const sdData = speedChart.data.datasets[0].data;
  sdData.push(parseFloat(dataRate));
  if (sdData.length > 20) sdData.shift();
  speedChart.data.labels = sdData.map((_, i) => i === sdData.length - 1 ? 'Now' : '');
  speedChart.update();

  // Signal
  const sigData = signalChart.data.datasets[0].data;
  sigData.push(isSuccess ? -40 - Math.random() * 20 : -70 - Math.random() * 15);
  if (sigData.length > 10) sigData.shift();
  signalChart.update();

  // Packet
  const pktData = packetChart.data.datasets[0].data;
  pktData.push(isSuccess ? 100 : 0);
  if (pktData.length > 10) pktData.shift();
  packetChart.data.labels = pktData.map((_, i) => `T-${pktData.length - i}`);
  packetChart.update();
}

/* ══════════════════════════════════════════
   SESSION STORAGE
══════════════════════════════════════════ */
function saveToSession(msg, pktId, dataRate, isSuccess) {
  const history = JSON.parse(sessionStorage.getItem('lifi-transmissions') || '[]');
  history.unshift({
    id: pktId,
    timestamp: new Date().toLocaleTimeString(),
    message: msg,
    packets: Math.ceil(msg.length / 10),
    rate: `${dataRate} Mbps`,
    success: isSuccess,
  });
  if (history.length > 50) history.pop();
  sessionStorage.setItem('lifi-transmissions', JSON.stringify(history));
}

function loadSessionHistory() {
  updateHistoryTable();
}

function updateHistoryTable() {
  const history = JSON.parse(sessionStorage.getItem('lifi-transmissions') || '[]');
  const tbody = document.getElementById('historyBody');

  if (history.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No transmissions yet. Send a message to get started.</td></tr>';
    return;
  }

  tbody.innerHTML = history.map((h, i) => `
    <tr>
      <td>${h.id}</td>
      <td>${h.timestamp}</td>
      <td>${escapeHtml(h.message.length > 40 ? h.message.slice(0,37) + '...' : h.message)}</td>
      <td>${h.packets}</td>
      <td>${h.rate}</td>
      <td><span class="${h.success ? 'status-ok' : 'status-fail'}">${h.success ? '✓ SUCCESS' : '✗ FAILED'}</span></td>
    </tr>
  `).join('');
}

function clearHistory() {
  sessionStorage.removeItem('lifi-transmissions');
  updateHistoryTable();
  log('info', 'Transmission history cleared from session storage');
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ══════════════════════════════════════════
   EXPORT REPORT
══════════════════════════════════════════ */
function exportReport() {
  const history = JSON.parse(sessionStorage.getItem('lifi-transmissions') || '[]');
  const successRate = state.totalSent > 0 ? ((state.totalSuccess / state.totalSent) * 100).toFixed(1) : '100';

  const report = `LI-FI SYSTEM PERFORMANCE REPORT
Generated: ${new Date().toLocaleString()}
${'═'.repeat(50)}

SUMMARY
───────────────────────────────────────────────
Total Packets Sent:      ${state.totalSent}
Total Packets Received:  ${state.totalReceived}
Successful Transfers:    ${state.totalSuccess}
Failed Transfers:        ${state.totalFailed}
Packet Success Rate:     ${successRate}%

TRANSMISSION HISTORY
───────────────────────────────────────────────
${history.length === 0 ? 'No transmissions recorded.' : history.map(h =>
  `[${h.timestamp}] PKT#${h.id} | ${h.success ? 'SUCCESS' : 'FAILED'} | ${h.rate} | "${h.message}"`
).join('\n')}

${'═'.repeat(50)}
Li-Fi Embedded System Project — Report End
`;

  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lifi-report-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  log('info', 'Performance report exported successfully');
}

/* ══════════════════════════════════════════
   LOGGING
══════════════════════════════════════════ */
function log(type, message) {
  const logBox = document.getElementById('logBox');
  if (!logBox) return;
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  const time = new Date().toLocaleTimeString('en', { hour12: false });
  let typeSpan = '';
  if (type === 'ok') typeSpan = `<span class="log-ok">[OK]</span>`;
  else if (type === 'err') typeSpan = `<span class="log-err">[ERR]</span>`;
  else typeSpan = `<span class="log-info">[INFO]</span>`;
  entry.innerHTML = `<span class="log-time">${time}</span>${typeSpan} ${escapeHtml(message)}`;
  logBox.appendChild(entry);
  logBox.scrollTop = logBox.scrollHeight;
  if (logBox.children.length > 100) logBox.removeChild(logBox.firstChild);
}

/* ══════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════ */
function initScrollReveal() {
  const els = document.querySelectorAll(
    '.overview-card, .adv-item, .app-card, .arch-block, .perf-card, .stat-card, .chart-card, .comp-detail'
  );
  els.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 60);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => io.observe(el));
}

/* ══════════════════════════════════════════
   CURSOR BLINK KEYFRAME
══════════════════════════════════════════ */
const cursorStyle = document.createElement('style');
cursorStyle.textContent = `@keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }`;
document.head.appendChild(cursorStyle);
