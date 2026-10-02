/**
 * KINGDOM 500 - SPA ROUTER & MAIN ENTRY POINT
 * Single Page Application — content swaps in #page-content WITHOUT page reload.
 * The YouTube iframe lives in index.html and is NEVER recreated, so Valhalla Calling
 * plays continuously no matter which view (home / stats / leadership / roster / apply) is open.
 */

import { CanvasEngine } from './canvas.js';
import { AudioEngine } from './audio.js';
import { I18nEngine } from './i18n.js';
import { AdminEngine } from './admin.js';
import { leaders, initialPlayers, defaultStats, channels, initialChatMessages, initialActivityFeed, generate80Players } from './data.js';

// ─── State ───────────────────────────────────────────────────────────
let audioEngine, canvasEngine, i18nEngine, adminEngine;
let players = loadPlayers();
let currentPage = 'home';
let savedChatNick = localStorage.getItem('k500_chat_nick') || '';

// ─── Boot ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  canvasEngine = new CanvasEngine();
  audioEngine  = new AudioEngine();
  i18nEngine   = new I18nEngine();
  adminEngine  = new AdminEngine(audioEngine, { get players() { return players; }, formatNumber, savePlayers });

  // Soundtrack toggle button
  const sndBtn = document.getElementById('snd-btn');
  if (sndBtn) {
    sndBtn.addEventListener('click', () => {
      audioEngine.toggleSoundtrack(playing => sndBtn.classList.toggle('active', playing));
    });
  }

  // Language buttons
  document.getElementById('lang-en')?.addEventListener('click', () => {
    audioEngine.playClick(); i18nEngine.setLang('en');
  });
  document.getElementById('lang-ru')?.addEventListener('click', () => {
    audioEngine.playClick(); i18nEngine.setLang('ru');
  });

  // Logo → home
  document.getElementById('logo-home')?.addEventListener('click', () => navigate('home'));

  // Nav links (SPA — no page reload)
  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); navigate(a.dataset.page); });
  });

  // Hash-based routing on first load
  const hashPage = location.hash.replace('#', '') || 'home';
  navigate(hashPage);
});

// ─── Router ──────────────────────────────────────────────────────────
function navigate(page) {
  currentPage = page;
  window._currentPage = page;  // used by admin.js to refresh current view
  location.hash = page;

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page || (page === 'home' && a.dataset.page === 'home'));
  });

  const content = document.getElementById('page-content');
  if (!content) return;

  switch (page) {
    case 'home':   content.innerHTML = renderHome();       afterHome();       break;
    case 'why':    content.innerHTML = renderWhy();        break;
    case 'stats':  content.innerHTML = renderStats();      afterStats();      break;
    case 'leadership': content.innerHTML = renderLeadership(); afterLeadership(); break;
    case 'roster': content.innerHTML = renderRoster();     afterRoster();     break;
    case 'apply':  content.innerHTML = renderApply();      afterApply();      break;
    default:       content.innerHTML = renderHome();       afterHome();
  }
}

// ─── Back button helper ──────────────────────────────────────────────────────
function backBtn() {
  return `<button class="back-link" onclick="window.navigateSPA('home')">← Back to Kingdom Hub</button>`;
}
window.navigateSPA = navigate;

// ─── Helper: format numbers ────────────────────────────────────────────────────
function formatNumber(val) {
  if (typeof val === 'number') {
    if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(2) + 'B';
    if (val >= 1_000_000)     return (val / 1_000_000).toFixed(1) + 'M';
    if (val >= 1_000)         return (val / 1_000).toFixed(0) + 'K';
    return val.toLocaleString();
  }
  return val;
}

// ─── Player persistence ──────────────────────────────────────────────────────
function loadPlayers() {
  try { return JSON.parse(localStorage.getItem('k500_players')) || generate80Players(); }
  catch { return generate80Players(); }
}
function savePlayers() {
  localStorage.setItem('k500_players', JSON.stringify(players));
}

// ────────────────────────────────────────────────────────────────
//  PAGE TEMPLATES
// ────────────────────────────────────────────────────────────────

// ── HOME ────────────────────────────────────────────────────────────
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
          <g><rect x="196" y="20" width="8" height="190" rx="4" fill="#5c3818"/><path d="M200 24 C150 4 112 40 128 88 C160 72 186 72 200 84Z" fill="url(#gold-grad)" stroke="#3a2205" stroke-width="2"/><path d="M200 24 C250 4 288 40 272 88 C240 72 214 72 200 84Z" fill="url(#gold-grad)" stroke="#3a2205" stroke-width="2"/><path d="M166 62 C140 56 128 30 140 8 C146 34 160 44 172 50Z" fill="url(#gold-grad)"/><path d="M234 62 C260 56 272 30 260 8 C254 34 240 44 228 50Z" fill="url(#gold-grad)"/><path d="M160 150 C158 80 242 80 240 150Z" fill="url(#gold-grad)" stroke="#3a2205" stroke-width="2"/><rect x="195" y="110" width="10" height="50" fill="url(#gold-grad)"/><rect x="172" y="118" width="56" height="8" fill="#120a02"/></g>
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
        <button class="portal-card glass-card" onclick="navigateSPA('stats')">
          <div class="portal-icon">📊</div><h3>Kingdom Stats & Might</h3>
          <p>Total power, eliminated enemies, active alliances and kingdom age.</p>
          <span class="portal-btn">Open Stats Hall →</span>
        </button>
        <button class="portal-card glass-card" onclick="navigateSPA('leadership')">
          <div class="portal-icon">👑</div><h3>Council & Officers</h3>
          <p>Meet the 8 strategic council members and war captains leading Kingdom 500.</p>
          <span class="portal-btn">Open Council Chamber →</span>
        </button>
        <button class="portal-card glass-card" onclick="navigateSPA('roster')">
          <div class="portal-icon">⚔️</div><h3>Warrior Roster (80+ Champions)</h3>
          <p>Full leaderboard of active warriors, might rankings and KvK shares.</p>
          <span class="portal-btn">Open Leaderboard →</span>
        </button>
        <button class="portal-card glass-card" onclick="navigateSPA('apply')">
          <div class="portal-icon">🛡️</div><h3>Roll Call - Report for Duty</h3>
          <p>Register your troop strength and war readiness for the upcoming KvK.</p>
          <span class="portal-btn">Report for Duty →</span>
        </button>
      </div>
    </section>

    <!-- Live Chat & Activity -->
    <section class="section two-col-section" id="chat">
      <div class="chat-col">
        <div class="section-header align-left"><h2>LIVE KINGDOM CHAT</h2><div class="header-divider"></div></div>
        <div class="chat-box glass-card">
          <div class="chat-messages" id="chat-messages"></div>
          <div class="chat-rules-note" style="padding:12px; background:rgba(0,0,0,0.3); border-radius:6px; margin-bottom:10px; font-size:0.85rem; color:var(--text-muted); text-align:center;">
            ⚔️ <strong>KEEP THE ALLIANCE OATH</strong> — Respect all warriors. No drama, only strategy and honor.
          </div>
          <form class="chat-input-form" id="chat-form">
            <input type="text" id="chat-nick" placeholder="Enter your warrior name" maxlength="16" value="">
            <input type="text" id="chat-text" placeholder="Say something, warrior..." maxlength="200" required>
            <button class="btn-gold-sm" type="submit">Send</button>
          </form>
        </div>
      </div>
      <div class="feed-col">
        <div class="section-header align-left"><h2>KINGDOM WAR ACTIVITY</h2><div class="header-divider"></div></div>
        <div class="activity-feed glass-card" id="activity-feed"></div>
      </div>
    </section>
  </main>`;
}

function afterHome() {
  initChat();
  initFeed();
}

// ── WHY 500 ───────────────────────────────────────────────────────────
function renderWhy() {
  return `
  <main class="main-content subpage-content">
    <div class="subpage-header">
      ${backBtn()}
      <h1>WHY 500? FAMILY MATTERS MOST</h1>
      <p class="section-subtitle">Built on trust, active coordination, and commitment to every warrior in our realm.</p>
    </div>
    <section class="section">
      <div class="cards-grid">
        <div class="card glass-card"><div class="card-icon">🛡️</div><h3 style="color:var(--ice)">One Family First</h3><p class="card-text">Nobody fights alone. Every player is supported by dedicated leaders and trusted allies.</p></div>
        <div class="card glass-card"><div class="card-icon">⚡</div><h3 style="color:var(--gold)">24/7 Global Presence</h3><p class="card-text">Chat, voice, rallies and defense runs around the clock.</p></div>
        <div class="card glass-card"><div class="card-icon">👑</div><h3 style="color:var(--crimson-light)">One Unified Goal</h3><p class="card-text">We plan war campaigns together, share reward intel and hold a single strategic direction.</p></div>
        <div class="card glass-card"><div class="card-icon">📜</div><h3 style="color:var(--ice-glow)">Zero Drama & Fair Loot</h3><p class="card-text">Transparent council decisions, automated KvK rules and consistent support for every member.</p></div>
      </div>
    </section>
  </main>`;
}

// ── STATS ───────────────────────────────────────────────────────────
function renderStats() {
  const s = JSON.parse(localStorage.getItem('k500_custom_stats') || JSON.stringify(defaultStats));
  return `
  <main class="main-content subpage-content">
    <div class="subpage-header">
      ${backBtn()}
      <h1>KINGDOM STATS & POWER</h1>
      <p class="section-subtitle">Real-time tracking of our realm's might, kills, alliances and age.</p>
    </div>
    <section class="section">
      <div class="stats-grid">
        <div class="stat-card glass-card"><div class="stat-val" id="stat-power" data-target="${s.power}">0</div><div class="stat-label">Total Kingdom Might</div></div>
        <div class="stat-card glass-card"><div class="stat-val" id="stat-kills" data-target="${s.kills}">0</div><div class="stat-label">Enemy Units Eliminated</div></div>
        <div class="stat-card glass-card"><div class="stat-val" id="stat-alliances" data-target="${s.alliances}">0</div><div class="stat-label">Core War Alliances</div></div>
        <div class="stat-card glass-card"><div class="stat-val" id="stat-days" data-target="${s.days}">0</div><div class="stat-label">Kingdom Days Active</div></div>
      </div>
    </section>
  </main>`;
}

function afterStats() {
  document.querySelectorAll('.stat-val').forEach(el => {
    animateCounter(el, parseInt(el.dataset.target) || 0);
  });
}

// ── LEADERSHIP ──────────────────────────────────────────────────────────
function renderLeadership() {
  const officers = JSON.parse(localStorage.getItem('k500_officers') || JSON.stringify(leaders));
  const cards = officers.map(o => `
    <div class="leader-card glass-card">
      ${o.photo
        ? `<img src="${o.photo}" alt="${o.name}" class="officer-photo-img" onerror="this.src='https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80'">`
        : `<div class="leader-avatar">${o.avatar || '👑'}</div>`}
      <div class="leader-role">${o.role}</div>
      <h3 class="leader-name">${o.name}</h3>
      <span class="badge-tag badge-${o.alliance}">${o.alliance}</span>
      <p class="card-text" style="margin-top:10px">${o.desc || ''}</p>
    </div>`).join('');

  return `
  <main class="main-content subpage-content">
    <div class="subpage-header">
      ${backBtn()}
      <h1>KINGDOM COUNCIL & OFFICERS</h1>
      <p class="section-subtitle">Meet the 8 strategic council members leading Kingdom 500 to victory.</p>
    </div>
    <section class="section">
      <div class="leadership-grid-8">${cards}</div>
    </section>
  </main>`;
}

function afterLeadership() {}

// ── ROSTER ───────────────────────────────────────────────────────────
function renderRoster() {
  return `
  <main class="main-content subpage-content">
    <div class="subpage-header">
      ${backBtn()}
      <h1>WARRIOR ROSTER & LEADERBOARD</h1>
      <p class="section-subtitle">Full roster of active warriors participating in Kingdom 500 campaigns.</p>
    </div>
    <section class="section">
      <div class="roster-controls glass-card">
        <div class="search-box"><input type="text" id="roster-search" placeholder="Search warrior name, ID or alliance..."></div>
        <div class="filter-group">
          <select id="alliance-filter">
            <option value="ALL">All Alliances</option>
            <option value="xHTx">xHTx - House of Thor</option>
            <option value="xVGx">xVGx - Valhalla Guard</option>
            <option value="xNKx">xNKx - Norse Kings</option>
            <option value="xRAx">xRAx - Rune Academy</option>
          </select>
          <select id="sort-filter">
            <option value="power">Sort by Might</option>
            <option value="kills">Sort by Kills</option>
            <option value="name">Sort by Name (A-Z)</option>
          </select>
        </div>
      </div>
      <div class="table-container glass-card">
        <table class="roster-table">
          <thead><tr><th>#</th><th>Player</th><th>Alliance</th><th>Might</th><th>Kills</th><th>KvK Share</th><th>Status</th></tr></thead>
          <tbody id="roster-tbody"></tbody>
        </table>
      </div>
    </section>
  </main>`;
}

function afterRoster() {
  renderTable();
  document.getElementById('roster-search')?.addEventListener('input', renderTable);
  document.getElementById('alliance-filter')?.addEventListener('change', renderTable);
  document.getElementById('sort-filter')?.addEventListener('change', renderTable);
}

function renderTable() {
  const tbody = document.getElementById('roster-tbody');
  if (!tbody) return;

  const search   = (document.getElementById('roster-search')?.value || '').toLowerCase();
  const alliance = document.getElementById('alliance-filter')?.value || 'ALL';
  const sort     = document.getElementById('sort-filter')?.value || 'power';

  let list = [...players];
  if (search)        list = list.filter(p => p.name.toLowerCase().includes(search) || p.alliance.toLowerCase().includes(search) || String(p.id || '').includes(search));
  if (alliance !== 'ALL') list = list.filter(p => p.alliance === alliance);
  list.sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : (sort === 'kills' ? (b.kills - a.kills) : (b.power - a.power)));

  tbody.innerHTML = list.map((p, i) => `
    <tr>
      <td style="font-weight:700;color:var(--gold)">#${i + 1}</td>
      <td><strong>${p.name}</strong></td>
      <td><span class="badge-tag badge-${p.alliance}">${p.alliance}</span></td>
      <td style="color:var(--gold-light);font-weight:600">${formatNumber(p.power)}</td>
      <td style="color:var(--crimson-light)">${formatNumber(p.kills)}</td>
      <td>${p.share || '2.0%'}</td>
      <td><span class="status-indicator"><span class="status-dot"></span> Ready</span></td>
    </tr>`).join('');
}

// ── APPLY ───────────────────────────────────────────────────────────
function renderApply() {
  return `
  <main class="main-content subpage-content">
    <div class="subpage-header">
      ${backBtn()}
      <h1>ROLL CALL — REPORT FOR DUTY</h1>
      <p class="section-subtitle">Sign in so leaders know you are active and ready for the next KvK campaign.</p>
    </div>
    <section class="section">
      <div class="form-container glass-card">
        <form id="roll-form">
          <div class="form-row">
            <div class="form-group"><label>In-Game Name *</label><input type="text" id="reg-name" required maxlength="24" placeholder="e.g. Thor_Ragnarok"></div>
            <div class="form-group"><label>Player ID</label><input type="text" id="reg-id" maxlength="16" placeholder="e.g. 50098231"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Alliance Tag</label>
              <select id="reg-ally">
                <option value="xHTx">xHTx - House of Thor</option>
                <option value="xVGx">xVGx - Valhalla Guard</option>
                <option value="xNKx">xNKx - Norse Kings</option>
                <option value="xRAx">xRAx - Rune Academy</option>
                <option value="Independent">Independent</option>
              </select>
            </div>
            <div class="form-group"><label>Estimated Might</label><input type="text" id="reg-might" maxlength="12" placeholder="e.g. 52M"></div>
          </div>
          <div class="form-group"><label>War Readiness / Notes</label><input type="text" id="reg-notes" maxlength="100" placeholder="e.g. T5 unlocked, active EU timezone"></div>
          <button class="btn-primary-block" type="submit">🛡️ Report for Duty</button>
        </form>
        <div id="roll-status-msg" class="status-msg" style="display:none;"></div>
      </div>
    </section>
  </main>`;
}

function afterApply() {
  document.getElementById('roll-form')?.addEventListener('submit', handleRollSubmit);
}

function handleRollSubmit(e) {
  e.preventDefault();
  const name  = document.getElementById('reg-name')?.value.trim();
  const id    = document.getElementById('reg-id')?.value.trim();
  const ally  = document.getElementById('reg-ally')?.value;
  const might = document.getElementById('reg-might')?.value.trim();
  const notes = document.getElementById('reg-notes')?.value.trim();
  if (!name) return;

  let power = 45_000_000;
  const m = might.match(/(\d+(\.\d+)?)\s*([mMbBkK])?/i);
  if (m) {
    let v = parseFloat(m[1]);
    const u = (m[3] || '').toUpperCase();
    if (u === 'M') v *= 1_000_000;
    else if (u === 'B') v *= 1_000_000_000;
    else if (u === 'K') v *= 1_000;
    power = v;
  }

  const entry = { rank: players.length + 1, name, id: id || `ID-${Math.floor(Math.random()*900000+100000)}`, alliance: ally, power, kills: Math.floor(power*0.08), share: '2.5%', status: 'Active', notes: notes || 'Ready for first call' };
  players.unshift(entry);
  savePlayers();

  const log = JSON.parse(localStorage.getItem('k500_duty_log') || '[]');
  log.unshift(entry);
  localStorage.setItem('k500_duty_log', JSON.stringify(log));

  audioEngine.playClick();
  const msg = document.getElementById('roll-status-msg');
  if (msg) { msg.style.display = 'block'; msg.textContent = `🛡️ Hail Warrior ${name}! Your duty report has been registered!`; setTimeout(() => msg.style.display = 'none', 5000); }
  document.getElementById('roll-form').reset();
}

// ─── Animated Counter ───────────────────────────────────────────────────────
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

// ─── Chat ───────────────────────────────────────────────────────────
let chatMessages = [];
try { chatMessages = JSON.parse(localStorage.getItem('k500_chat')) || []; } catch { chatMessages = []; }

const BOT_NICKS  = ["Ragnar_Ironclad","Shieldmaiden_Helga","Viking_Beast","Skald_Gunnar","Asgard_Warlord"];
const BOT_QUOTES = ["Gathering speedups for KvK Gate 3!","Who needs dragon shrine title buff?","Kingdom 500 is unstoppable!","Rally on pass in 10 minutes! Join up!","Just upgraded to T5 Infantry!"];

function initChat() {
  const nickInput = document.getElementById('chat-nick');
  if (nickInput && savedChatNick) {
    nickInput.value = savedChatNick;
  }

  renderChatMessages();
  document.getElementById('chat-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const nick = document.getElementById('chat-nick')?.value.trim();
    const text = document.getElementById('chat-text')?.value.trim();
    if (!nick || !text) return;

    // Save nickname for next time
    savedChatNick = nick;
    localStorage.setItem('k500_chat_nick', nick);

    chatMessages.push({ nick, text, time: now() });
    if (chatMessages.length > 30) chatMessages.shift();
    localStorage.setItem('k500_chat', JSON.stringify(chatMessages));
    renderChatMessages();
    document.getElementById('chat-text').value = '';
    audioEngine.playClick();
  });

  setInterval(() => {
    chatMessages.push({ nick: BOT_NICKS[Math.floor(Math.random()*BOT_NICKS.length)], text: BOT_QUOTES[Math.floor(Math.random()*BOT_QUOTES.length)], time: now() });
    if (chatMessages.length > 30) chatMessages.shift();
    localStorage.setItem('k500_chat', JSON.stringify(chatMessages));
    renderChatMessages();
  }, 14000);
}

function renderChatMessages() {
  const el = document.getElementById('chat-messages');
  if (!el) return;
  el.innerHTML = chatMessages.map(m => `
    <div class="chat-msg">
      <div class="chat-msg-header"><span class="chat-msg-user">${m.nick}</span><span>${m.time}</span></div>
      <div class="chat-msg-text">${m.text}</div>
    </div>`).join('');
  el.scrollTop = el.scrollHeight;
}

function initFeed() {
  const el = document.getElementById('activity-feed');
  if (!el) return;
  el.innerHTML = initialActivityFeed.map(f => `
    <div class="feed-item">
      <div class="feed-icon">${f.icon}</div>
      <div class="feed-content"><p><strong>${f.title}</strong></p><p style="color:var(--text-muted)">${f.text}</p><span class="feed-time">${f.time}</span></div>
    </div>`).join('');
}

function now() { return new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }
