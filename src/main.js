/**
 * KINGDOM 500 - SPA ROUTER & MAIN ENTRY POINT
 * Single Page Application — content swaps in #page-content WITHOUT page reload.
 */

import { CanvasEngine } from './canvas.js';
import { AudioEngine } from './audio.js';
import { I18nEngine } from './i18n.js';
import { AdminEngine } from './admin.js';
import { leaders, initialPlayers, defaultStats, channels, initialChatMessages, initialActivityFeed, generate80Players, SHARED_ACCESS_CODE } from './data.js';

const PLAYER_STORAGE_KEY = 'k500_players';
const CHAT_STORAGE_KEY = 'k500_chat';
const CHAT_CHANNEL_NAME = 'k500_live_chat_channel';

let audioEngine, canvasEngine, i18nEngine, adminEngine;
let players = loadPlayers();
let currentPage = 'home';
let savedChatNick = localStorage.getItem('k500_chat_nick') || '';
let liveChatChannel = null;

function resetStarterRoster() {
  return false;
}

// Boot

document.addEventListener('DOMContentLoaded', () => {
  canvasEngine = new CanvasEngine();
  audioEngine = new AudioEngine();
  i18nEngine = new I18nEngine();
  adminEngine = new AdminEngine(audioEngine, { get players() { return players; }, formatNumber, savePlayers });

  document.getElementById('logo-home')?.addEventListener('click', () => navigate('home'));

  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); navigate(a.dataset.page); });
  });

  const hashPage = location.hash.replace('#', '') || 'home';
  navigate(hashPage);
});

function navigate(page) {
  currentPage = page;
  window._currentPage = page;
  location.hash = page;

  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page || (page === 'home' && a.dataset.page === 'home'));
  });

  const content = document.getElementById('page-content');
  if (!content) return;

  switch (page) {
    case 'home':
      content.innerHTML = renderHome();
      afterHome();
      break;
    case 'why':
      content.innerHTML = renderWhy();
      break;
    case 'stats':
      content.innerHTML = renderStats();
      afterStats();
      break;
    case 'leadership':
      content.innerHTML = renderLeadership();
      afterLeadership();
      break;
    case 'roster':
      content.innerHTML = renderRoster();
      afterRoster();
      break;
    case 'apply':
      content.innerHTML = renderApply();
      afterApply();
      break;
    default:
      content.innerHTML = renderHome();
      afterHome();
  }
}

function backBtn() {
  return `<button class="back-link" onclick="window.navigateSPA('home')">← Back to Kingdom Hub</button>`;
}
window.navigateSPA = navigate;

function formatNumber(val) {
  if (typeof val === 'number') {
    if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(2) + 'B';
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
    if (val >= 1_000) return (val / 1_000).toFixed(0) + 'K';
    return val.toLocaleString();
  }
  return val;
}

function loadPlayers() {
  try {
    const saved = JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function savePlayers() {
  localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(players));
}

function renderHome() {
  return `
  <header class="hero" id="hero-section">
    <div class="aurora-glow"></div>
    <div class="hero-center">
      <p class="hero-subtitle">LOOKING FOR A NEW HOME?</p>
      <div class="crest-wrapper">
        <svg class="viking-crest-svg" viewBox="0 0 400 210" aria-hidden="true">
          <defs>
            <linearGradient id="gold-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#fff5c0"/><stop offset="50%" stop-color="#e6b84c"/><stop offset="100%" stop-color="#8a5a12"/>
            </linearGradient>
          </defs>
          <g><rect x="196" y="20" width="8" height="190" rx="4" fill="#5c3818"/><path d="M200 24 C150 4 112 40 128 88 C160 72 186 72 200 84Z" fill="url(#gold-grad)" stroke="#3a2205" stroke-width="4"/><path d="M200 84 L235 142 L200 178 L165 142 Z" fill="url(#gold-grad)" stroke="#3a2205" stroke-width="4"/><path d="M200 24 C250 4 288 40 272 88 C240 72 214 72 200 84Z" fill="url(#gold-grad)" stroke="#3a2205" stroke-width="4"/></g>
        </svg>
        <div class="hero-plaque"><h1>KINGDOM 500</h1></div>
      </div>
      <p class="hero-motto">ONE FAMILY • ONE KINGDOM • ONE GOAL</p>
      <p class="hero-desc">YOUR NEXT CHAPTER BEGINS IN KINGDOM 500</p>
      <div class="hero-btn-group">
        <button class="btn-primary-lg" onclick="navigateSPA('apply')">⚔️ JOIN KINGDOM 500</button>
        <button class="btn-secondary-lg" onclick="navigateSPA('why')">DISCOVER WHY 500</button>
      </div>
    </div>
    <div class="brazier brazier-left"><i></i></div>
    <div class="brazier brazier-right"><i></i></div>
  </header>

  <main class="main-content">
    <section class="section portal-section">
      <div class="section-header">
        <h2>KINGDOM PORTALS & HALLS</h2>
        <div class="header-divider"></div>
      </div>
      <div class="portal-grid">
        <button class="portal-card glass-card" onclick="navigateSPA('stats')"><div class="portal-icon">📊</div><h3>Kingdom Stats & Might</h3><p>Total power, eliminated enemies, active alliances and kingdom age.</p><span class="portal-btn">Open Stats Hall →</span></button>
        <button class="portal-card glass-card" onclick="navigateSPA('leadership')"><div class="portal-icon">👑</div><h3>Council & Officers</h3><p>Meet the 8 strategic council members and war captains leading Kingdom 500.</p><span class="portal-btn">Open Council Chamber →</span></button>
        <button class="portal-card glass-card" onclick="navigateSPA('roster')"><div class="portal-icon">⚔️</div><h3>Warrior Roster</h3><p>Full leaderboard of active warriors, their power, kingdom, and readiness.</p><span class="portal-btn">Open Leaderboard →</span></button>
        <button class="portal-card glass-card" onclick="navigateSPA('apply')"><div class="portal-icon">🛡️</div><h3>Apply for Migration</h3><p>Register your details and request to join the next campaign.</p><span class="portal-btn">Apply Now →</span></button>
      </div>
    </section>

    <section class="section two-col-section" id="chat">
      <div class="chat-col">
        <div class="section-header align-left"><h2>LIVE KINGDOM CHAT</h2><div class="header-divider"></div></div>
        <div class="chat-box glass-card">
          <div class="chat-messages" id="chat-messages"></div>
          <div class="chat-rules-note" style="padding:12px; background:rgba(0,0,0,0.3); border-radius:6px; margin-bottom:10px; font-size:0.85rem; color:var(--text-muted); text-align:center;">⚔️ <strong>KEEP THE ALLIANCE OATH</strong> — Respect all warriors. No drama, only strategy and honor.</div>
          <form class="chat-input-form" id="chat-form">
            <input type="text" id="chat-nick" placeholder="Enter your warrior name" maxlength="16" value="">
            <input type="text" id="chat-text" placeholder="Say something, warrior..." maxlength="200" required>
            <button class="btn-gold-sm" type="submit">Send</button>
          </form>
        </div>
      </div>
      <div class="activity-feed-col">
        <div class="section-header align-left"><h2>WAR ACTIVITY</h2><div class="header-divider"></div></div>
        <div class="activity-feed glass-card" id="activity-feed" aria-live="polite"></div>
      </div>
    </section>
  </main>`;
}

function afterHome() { initChat(); }

function renderWhy() {
  return `
  <main class="main-content subpage-content">
    <div class="subpage-header">${backBtn()}<h1>WHY 500? FAMILY MATTERS MOST</h1><p class="section-subtitle">Built on trust, active coordination, and commitment to every warrior in our realm.</p></div>
    <section class="section"><div class="cards-grid">
      <div class="card glass-card"><div class="card-icon">🛡️</div><h3 style="color:var(--ice)">One Family First</h3><p class="card-text">Nobody fights alone. Every player is supported by dedicated allies, commanders, and kingdom leadership.</p></div>
      <div class="card glass-card"><div class="card-icon">⚡</div><h3 style="color:var(--gold)">24/7 Global Presence</h3><p class="card-text">Chat, strategy, rallies, and defense runs happen around the clock across time zones.</p></div>
      <div class="card glass-card"><div class="card-icon">👑</div><h3 style="color:var(--crimson-light)">One Unified Goal</h3><p class="card-text">We plan war campaigns together, share battlefield intelligence, and push for real victories.</p></div>
      <div class="card glass-card"><div class="card-icon">📜</div><h3 style="color:var(--ice-glow)">Zero Drama & Fair Loot</h3><p class="card-text">Transparent leadership decisions and disciplined war culture keep the kingdom strong.</p></div>
    </div></section>
  </main>`;
}

function renderStats() {
  const s = JSON.parse(localStorage.getItem('k500_custom_stats') || JSON.stringify(defaultStats));
  return `
  <main class="main-content subpage-content">
    <div class="subpage-header">${backBtn()}<h1>KINGDOM STATS & POWER</h1><p class="section-subtitle">Real-time tracking of our realm's might, kills, alliances and age.</p></div>
    <section class="section"><div class="stats-grid">
      <div class="stat-card glass-card"><div class="stat-val" id="stat-power" data-target="${s.power}">0</div><div class="stat-label">Total Kingdom Might</div></div>
      <div class="stat-card glass-card"><div class="stat-val" id="stat-kills" data-target="${s.kills}">0</div><div class="stat-label">Enemy Units Eliminated</div></div>
      <div class="stat-card glass-card"><div class="stat-val" id="stat-alliances" data-target="${s.alliances}">0</div><div class="stat-label">Core War Alliances</div></div>
      <div class="stat-card glass-card"><div class="stat-val" id="stat-days" data-target="${s.days}">0</div><div class="stat-label">Kingdom Days Active</div></div>
    </div></section>
  </main>`;
}

function afterStats() {
  document.querySelectorAll('.stat-val').forEach(el => animateCounter(el, parseInt(el.dataset.target) || 0));
}

function renderLeadership() {
  const raw = Array.isArray(window.firebaseData?.state?.councilOfficers) ? window.firebaseData.state.councilOfficers : JSON.parse(localStorage.getItem('k500_officers') || '[]');
  const officers = Array.isArray(raw) && raw.length ? raw : leaders;
  const slots = Array.from({ length: 8 }, (_, i) => officers[i] || { name: 'Open Slot', role: 'Awaiting assignment', alliance: 'xHTx', desc: 'This council position is empty until the admin fills it in.' });
  const cards = slots.map(o => `
    <div class="leader-card glass-card">
      ${o.photo ? `<img src="${o.photo}" alt="${o.name}" class="officer-photo-img" onerror="this.src='https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80'">` : `<div class="leader-avatar" style="width:110px;height:110px;border-radius:50%;display:grid;place-items:center;background:rgba(230,184,76,0.15);font-size:2.5rem;margin-bottom:14px;border:3px solid var(--gold)">${o.avatar || '👑'}</div>`}
      <div class="leader-role">${o.role || 'Council Member'}</div>
      <h3 class="leader-name">${o.name || 'Open Slot'}</h3>
      <span class="badge-tag badge-${o.alliance || 'xHTx'}">${o.alliance || 'xHTx'}</span>
      <p class="card-text" style="margin-top:10px">${o.desc || 'Council position pending update.'}</p>
    </div>`).join('');

  return `
  <main class="main-content subpage-content">
    <div class="subpage-header">${backBtn()}<h1>KINGDOM COUNCIL & OFFICERS</h1><p class="section-subtitle">Meet the 8 strategic council members leading Kingdom 500 to victory.</p></div>
    <section class="section"><div class="leadership-grid-8">${cards}</div></section>
  </main>`;
}

function afterLeadership() {}

function renderRoster() {
  return `
  <main class="main-content subpage-content">
    <div class="subpage-header">${backBtn()}<h1>WARRIOR ROSTER & LEADERBOARD</h1><p class="section-subtitle">Full roster of active warriors participating in Kingdom 500 campaigns.</p></div>
    <section class="section">
      <div class="roster-controls glass-card"><div class="search-box"><input type="text" id="roster-search" placeholder="Search warrior name or kingdom..."></div><div class="filter-group"><select id="sort-filter"><option value="power">Sort by Might</option><option value="kills">Sort by Kills</option><option value="name">Sort by Name (A-Z)</option></select></div></div>
      <div class="table-container glass-card"><table class="roster-table"><thead><tr><th>#</th><th>Player</th><th>Current Kingdom</th><th>Might</th><th>Status</th></tr></thead><tbody id="roster-tbody"></tbody></table></div>
    </section>
  </main>`;
}

function afterRoster() { renderTable(); document.getElementById('roster-search')?.addEventListener('input', renderTable); document.getElementById('sort-filter')?.addEventListener('change', renderTable); }

function renderTable() {
  const tbody = document.getElementById('roster-tbody');
  if (!tbody) return;

  const search = (document.getElementById('roster-search')?.value || '').toLowerCase();
  const sort = document.getElementById('sort-filter')?.value || 'power';
  let list = [...players];
  if (search) list = list.filter(p => ((p.name || '').toLowerCase().includes(search) || (p.currentKingdom || p.kingdom || '').toLowerCase().includes(search) || String(p.id || '').includes(search)));
  list.sort((a, b) => sort === 'name' ? (a.name || '').localeCompare(b.name || '') : (sort === 'kills' ? (b.kills || 0) - (a.kills || 0) : (b.power || 0) - (a.power || 0)));
  tbody.innerHTML = list.map((p, i) => `<tr><td style="font-weight:700;color:var(--gold)">#${i + 1}</td><td><strong>${p.name || 'Unknown'}</strong></td><td>${p.currentKingdom || p.kingdom || 'Unassigned'}</td><td style="color:var(--gold-light);font-weight:600">${formatNumber(p.power || 0)}</td><td><span class="status-indicator"><span class="status-dot"></span> ${p.status || 'Ready'}</span></td></tr>`).join('');
}

function renderApply() {
  return `
  <main class="main-content subpage-content">
    <div class="subpage-header">${backBtn()}<h1>APPLY FOR MIGRATION</h1><p class="section-subtitle">Submit your details for review. Access is protected by the shared kingdom code.</p></div>
    <section class="section"><div class="form-container glass-card"><form id="roll-form"><div class="form-row"><div class="form-group"><label>In-Game Name *</label><input type="text" id="reg-name" required maxlength="24" placeholder="e.g. Thor_Ragnarok"></div><div class="form-group"><label>Player ID</label><input type="text" id="reg-id" maxlength="16" placeholder="e.g. 50098231"></div></div><div class="form-row"><div class="form-group"><label>Current Kingdom *</label><input type="text" id="reg-kingdom" maxlength="40" placeholder="e.g. Midgard, Asgard, Jotunheim"></div><div class="form-group"><label>Estimated Might</label><input type="text" id="reg-might" maxlength="12" placeholder="e.g. 52M"></div></div><div class="form-group"><label>Verification Code *</label><input type="password" id="reg-code" maxlength="30" placeholder="Enter shared kingdom code" required></div><div class="form-group"><label>War Readiness / Notes</label><input type="text" id="reg-notes" maxlength="100" placeholder="e.g. T5 unlocked, active EU timezone"></div><button class="btn-primary-block" type="submit">🛡️ Apply for Migration</button></form><div id="roll-status-msg" class="status-msg" style="display:none;"></div></div></section>
  </main>`;
}

function afterApply() { document.getElementById('roll-form')?.addEventListener('submit', handleRollSubmit); }

function handleRollSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name')?.value.trim();
  const id = document.getElementById('reg-id')?.value.trim();
  const kingdom = document.getElementById('reg-kingdom')?.value.trim();
  const might = document.getElementById('reg-might')?.value.trim();
  const notes = document.getElementById('reg-notes')?.value.trim();
  const code = document.getElementById('reg-code')?.value.trim();
  const msg = document.getElementById('roll-status-msg');

  if (!name || !kingdom || !code) {
    if (msg) { msg.style.display = 'block'; msg.style.background = 'rgba(153, 27, 27, 0.2)'; msg.style.borderColor = '#f87171'; msg.style.color = '#fca5a5'; msg.textContent = '❌ Please fill in your name, current kingdom, and verification code.'; }
    return;
  }

  if (code !== SHARED_ACCESS_CODE) {
    if (msg) { msg.style.display = 'block'; msg.style.background = 'rgba(153, 27, 27, 0.2)'; msg.style.borderColor = '#f87171'; msg.style.color = '#fca5a5'; msg.textContent = '❌ Invalid verification code. Use the shared kingdom code.'; }
    return;
  }

  let power = 45_000_000;
  const m = might ? might.match(/(\d+(\.\d+)?)\s*([mMbBkK])?/i) : null;
  if (m) {
    let v = parseFloat(m[1]);
    const u = (m[3] || '').toUpperCase();
    if (u === 'M') v *= 1_000_000;
    else if (u === 'B') v *= 1_000_000_000;
    else if (u === 'K') v *= 1_000;
    power = v;
  }

  const entry = { rank: players.length + 1, name, id: id || `ID-${Math.floor(Math.random() * 900000 + 100000)}`, currentKingdom: kingdom, power, kills: Math.floor(power * 0.08), status: 'Ready', notes, registeredAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) };

  players.unshift(entry);
  savePlayers();

  const log = JSON.parse(localStorage.getItem('k500_duty_log') || '[]');
  log.unshift(entry);
  localStorage.setItem('k500_duty_log', JSON.stringify(log));

  if (msg) { msg.style.display = 'block'; msg.style.background = 'rgba(34, 197, 94, 0.15)'; msg.style.borderColor = '#22c55e'; msg.style.color = '#4ade80'; msg.textContent = `✅ Hail Warrior ${name}! Your migration request has been registered.`; setTimeout(() => msg.style.display = 'none', 5000); }

  document.getElementById('roll-form').reset();
}

function animateCounter(el, target) {
  let current = 0;
  const steps = 60;
  const inc = target / steps;
  const t = setInterval(() => {
    current += inc;
    if (current >= target) { current = target; clearInterval(t); }
    el.textContent = formatNumber(Math.floor(current));
  }, 30);
}

let chatMessages = [];
try { chatMessages = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || '[]'); } catch {}

function setupLiveChat() {
  if ('BroadcastChannel' in window) {
    liveChatChannel = new BroadcastChannel(CHAT_CHANNEL_NAME);
    liveChatChannel.onmessage = (event) => {
      const incoming = event.data && event.data.type === 'chat' ? event.data.message : null;
      if (!incoming) return;
      const exists = chatMessages.some(m => m.time === incoming.time && m.nick === incoming.nick && m.text === incoming.text);
      if (!exists) {
        chatMessages.push(incoming);
        if (chatMessages.length > 50) chatMessages.shift();
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatMessages));
        renderChatMessages();
      }
    };
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== CHAT_STORAGE_KEY || !event.newValue) return;
    try {
      const next = JSON.parse(event.newValue || '[]');
      if (Array.isArray(next)) { chatMessages = next; renderChatMessages(); }
    } catch {}
  });
}

function initChat() {
  setupLiveChat();
  const nickInput = document.getElementById('chat-nick');
  if (nickInput && savedChatNick) nickInput.value = savedChatNick;
  renderChatMessages();
  document.getElementById('chat-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const nick = document.getElementById('chat-nick')?.value.trim();
    const text = document.getElementById('chat-text')?.value.trim();
    if (!nick || !text) return;
    savedChatNick = nick;
    localStorage.setItem('k500_chat_nick', nick);
    const message = { nick, text, time: now() };
    chatMessages.push(message);
    if (chatMessages.length > 50) chatMessages.shift();
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatMessages));
    if (liveChatChannel) liveChatChannel.postMessage({ type: 'chat', message });
    renderChatMessages();
    document.getElementById('chat-text').value = '';
  });
}

function renderChatMessages() {
  const el = document.getElementById('chat-messages');
  if (!el) return;
  el.innerHTML = chatMessages.map(m => `<div class="chat-msg"><div class="chat-msg-header"><span class="chat-msg-user">${m.nick}</span><span>${m.time}</span></div><div class="chat-msg-text">${m.text}</div></div>`).join('');
  el.scrollTop = el.scrollHeight;
}

function now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
