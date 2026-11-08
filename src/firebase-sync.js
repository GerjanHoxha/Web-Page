/**
 * Firebase Realtime Database integration for the Kingdom 500 static site.
 * Mirrors legacy k500_* storage keys to Firebase so all existing admin editors
 * persist and sync without tying persistence to a particular page/component.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  getDatabase, ref, onValue, set, push, query, limitToLast, runTransaction
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const siteDataRef = ref(db, 'siteData');
const chatRef = query(ref(db, 'chat/messages'), limitToLast(100));
const originalSetItem = Storage.prototype.setItem;
const originalRemoveItem = Storage.prototype.removeItem;
let applyingRemote = false;
let seeded = false;
let chatMessages = [];
let currentChatForm = null;

function parseStored(value) {
  try { return JSON.parse(value); } catch { return value; }
}

function cleanValue(key, value) {
  // Eliminations are intentionally no longer part of the kingdom stats UI/data.
  if (key === 'k500_custom_stats' && value && typeof value === 'object') {
    const { kills, ...stats } = value;
    return stats;
  }
  if (key === 'k500_players' && Array.isArray(value)) {
    return value.map(player => ({
      name: String(player.name || player.playerName || '').slice(0, 40),
      power: Number(player.power ?? player.might) || 0,
      rank: ['R5', 'R4', 'R3', 'R2', 'R1'].includes(player.rank || player.status) ? (player.rank || player.status) : 'R1',
      activeForKvK: (player.activeForKvK ?? player.active ?? 'No') === 'Yes' ? 'Yes' : 'No',
      ...(player.currentKingdom || player.kingdom ? { currentKingdom: String(player.currentKingdom || player.kingdom).slice(0, 50) } : {}),
      ...(player.id ? { id: String(player.id).slice(0, 32) } : {}),
      ...(player.registeredAt ? { registeredAt: player.registeredAt } : {})
    })).filter(player => player.name);
  }
  return value;
}

function saveLocal(key, value) {
  applyingRemote = true;
  try { originalSetItem.call(localStorage, key, JSON.stringify(value)); }
  finally { applyingRemote = false; }
}

function showError(message) {
  console.error('[Kingdom 500 Firebase]', message);
  const status = document.getElementById('roll-status-msg');
  if (status) {
    status.style.display = 'block';
    status.textContent = `Firebase could not save this change: ${message}`;
  }
}

function writeSiteValue(key, rawValue) {
  const value = cleanValue(key, parseStored(rawValue));
  set(ref(db, `siteData/${key}`), value).catch(error => showError(error.message));
}

Storage.prototype.setItem = function (key, value) {
  originalSetItem.call(this, key, value);
  if (this === localStorage && !applyingRemote && String(key).startsWith('k500_')) {
    writeSiteValue(String(key), String(value));
  }
};

Storage.prototype.removeItem = function (key) {
  originalRemoveItem.call(this, key);
  if (this === localStorage && !applyingRemote && String(key).startsWith('k500_')) {
    set(ref(db, `siteData/${key}`), null).catch(error => showError(error.message));
  }
};

onValue(siteDataRef, snapshot => {
  if (!snapshot.exists()) {
    if (!seeded) {
      seeded = true;
      const existing = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('k500_')) existing[key] = cleanValue(key, parseStored(localStorage.getItem(key)));
      }
      if (Object.keys(existing).length) {
        runTransaction(siteDataRef, current => current || existing).catch(error => showError(error.message));
      }
    }
    return;
  }

  const remote = snapshot.val() || {};
  applyingRemote = true;
  try {
    for (const [key, value] of Object.entries(remote)) {
      if (!key.startsWith('k500_')) continue;
      originalSetItem.call(localStorage, key, JSON.stringify(cleanValue(key, value)));
    }
    // Remove locally cached CMS values deleted remotely.
    const remoteKeys = new Set(Object.keys(remote));
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('k500_') && !remoteKeys.has(key)) originalRemoveItem.call(localStorage, key);
    }
  } finally { applyingRemote = false; }
  window.dispatchEvent(new CustomEvent('firebase-data-updated', { detail: { keys: Object.keys(remote) } }));
  refreshPageData();
}, error => showError(error.message));

function formatMight(value) {
  const number = Number(value) || 0;
  if (number >= 1e9) return `${(number / 1e9).toFixed(2)}B`;
  if (number >= 1e6) return `${(number / 1e6).toFixed(1)}M`;
  if (number >= 1e3) return `${Math.round(number / 1e3)}K`;
  return number.toLocaleString();
}

function refreshRosterTable() {
  const body = document.getElementById('roster-tbody');
  if (!body) return;
  let players = [];
  try { players = JSON.parse(localStorage.getItem('k500_players') || '[]'); } catch {}
  const search = (document.getElementById('roster-search')?.value || '').trim().toLowerCase();
  const shown = players.filter(player => !search || player.name.toLowerCase().includes(search));
  body.innerHTML = shown.map((player, index) => `<tr>
    <td>${index + 1}</td><td>${escapeHtml(player.name)}</td>
    <td>${formatMight(player.power)}</td><td>${escapeHtml(player.rank || 'R1')}</td>
    <td>${player.activeForKvK === 'Yes' ? 'Yes' : 'No'}</td>
  </tr>`).join('') || '<tr><td colspan="5">No warriors have registered yet.</td></tr>';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function refreshStats() {
  let stats = {};
  try { stats = JSON.parse(localStorage.getItem('k500_custom_stats') || '{}'); } catch {}
  for (const [id, value] of [['stat-power', stats.power], ['stat-alliances', stats.alliances], ['stat-days', stats.days]]) {
    const element = document.getElementById(id);
    if (element) { element.dataset.target = Number(value) || 0; element.textContent = formatMight(value); }
  }
  document.getElementById('stat-kills')?.closest('.stat-card')?.remove();
}

function refreshPageData() {
  refreshStats();
  refreshRosterTable();
}

function addSelect(parent, id, label, options) {
  if (document.getElementById(id)) return;
  const group = document.createElement('div');
  group.className = 'form-group';
  const title = document.createElement('label');
  title.htmlFor = id;
  title.textContent = label;
  const select = document.createElement('select');
  select.id = id;
  for (const value of options) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
  group.append(title, select);
  parent.append(group);
}

function installRosterApplicationForm() {
  const body = document.getElementById('roster-tbody');
  if (!body || document.getElementById('public-roster-form')) return;
  const section = body.closest('section');
  if (!section) return;
  const card = document.createElement('div');
  card.className = 'form-container glass-card';
  card.style.margin = '0 auto 24px';
  card.innerHTML = `<h2 style="margin-bottom:14px;color:var(--gold-light)">Join the Warrior Roster</h2>
    <form id="public-roster-form">
      <div class="form-group"><label for="public-player-name">Player Name *</label><input id="public-player-name" required maxlength="40"></div>
      <div class="form-group"><label for="public-player-might">Might *</label><input id="public-player-might" type="number" min="0" required></div>
      <div class="form-row"><div class="form-group"><label for="public-player-rank">Rank *</label><select id="public-player-rank" required><option>R5</option><option>R4</option><option>R3</option><option>R2</option><option>R1</option></select></div>
      <div class="form-group"><label for="public-player-kvk">Active for KvK *</label><select id="public-player-kvk" required><option>Yes</option><option>No</option></select></div></div>
      <div class="form-group"><label for="public-roster-password">Submission password *</label><input id="public-roster-password" type="password" required autocomplete="current-password"></div>
      <button class="btn-primary-block" type="submit">Submit Roster Entry</button>
      <p id="public-roster-status" class="status-msg" style="display:none"></p>
    </form>`;
  section.prepend(card);
  document.getElementById('public-roster-form').addEventListener('submit', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const form = event.currentTarget;
    const status = document.getElementById('public-roster-status');
    if (document.getElementById('public-roster-password').value !== 'newarea500') {
      status.style.display = 'block'; status.textContent = 'Incorrect submission password.'; return;
    }
    const player = {
      name: document.getElementById('public-player-name').value.trim(),
      power: Number(document.getElementById('public-player-might').value),
      rank: document.getElementById('public-player-rank').value,
      activeForKvK: document.getElementById('public-player-kvk').value,
      registeredAt: new Date().toISOString()
    };
    if (!player.name || !Number.isFinite(player.power) || player.power < 0) return;
    let roster = [];
    try { roster = JSON.parse(localStorage.getItem('k500_players') || '[]'); } catch {}
    roster.unshift(player);
    localStorage.setItem('k500_players', JSON.stringify(roster));
    status.style.display = 'block'; status.textContent = 'Roster entry saved.';
    form.reset(); refreshRosterTable();
  }, true);
}

function installAdminEnhancements() {
  const kills = document.getElementById('edit-stat-kills')?.closest('.form-group');
  kills?.remove();
  const adminRoster = document.getElementById('cms-roster');
  if (adminRoster) {
    document.getElementById('new-player-kingdom')?.closest('input')?.remove();
    const row = adminRoster.querySelector('.form-row');
    if (row && !document.getElementById('new-player-rank')) {
      addSelect(row, 'new-player-rank', 'Rank', ['R5', 'R4', 'R3', 'R2', 'R1']);
      addSelect(row, 'new-player-kvk', 'Active for KvK', ['Yes', 'No']);
    }
    const addButton = document.getElementById('add-player-btn');
    if (addButton && !addButton.dataset.firebaseBound) {
      addButton.dataset.firebaseBound = 'true';
      addButton.addEventListener('click', event => {
        event.preventDefault(); event.stopImmediatePropagation();
        const name = document.getElementById('new-player-name')?.value.trim();
        const power = Number(document.getElementById('new-player-power')?.value);
        if (!name || !Number.isFinite(power) || power < 0) return;
        let players = [];
        try { players = JSON.parse(localStorage.getItem('k500_players') || '[]'); } catch {}
        players.unshift({ name, power, rank: document.getElementById('new-player-rank')?.value || 'R1', activeForKvK: document.getElementById('new-player-kvk')?.value || 'No', registeredAt: new Date().toISOString() });
        localStorage.setItem('k500_players', JSON.stringify(players));
        document.getElementById('new-player-name').value = '';
        document.getElementById('new-player-power').value = '';
        const count = document.getElementById('cms-player-count');
        if (count) count.textContent = players.length;
        refreshRosterTable();
      }, true);
    }
  }
  document.querySelectorAll('.portal-card').forEach(card => {
    if (card.getAttribute('onclick')?.includes("'leadership'")) card.remove();
  });
  document.querySelectorAll('[data-page="leadership"]').forEach(link => link.remove());
}

function installMigrationHandler() {
  const form = document.getElementById('roll-form');
  if (!form || form.dataset.firebaseMigrationBound) return;
  form.dataset.firebaseMigrationBound = 'true';
  document.getElementById('reg-code')?.closest('.form-group')?.remove();
  const code = document.getElementById('reg-code');
  if (code) code.removeAttribute('required');
  form.addEventListener('submit', event => {
    event.preventDefault(); event.stopImmediatePropagation();
    const name = document.getElementById('reg-name')?.value.trim();
    const kingdom = document.getElementById('reg-kingdom')?.value.trim();
    const msg = document.getElementById('roll-status-msg');
    if (!name || !kingdom) {
      if (msg) { msg.style.display = 'block'; msg.textContent = 'Please enter your player name and current kingdom.'; }
      return;
    }
    const application = {
      name, playerId: document.getElementById('reg-id')?.value.trim() || '',
      currentKingdom: kingdom, might: document.getElementById('reg-might')?.value.trim() || '',
      notes: document.getElementById('reg-notes')?.value.trim() || '', submittedAt: new Date().toISOString()
    };
    const appRef = push(ref(db, 'migrationApplications'));
    set(appRef, application).then(() => {
      const duty = { name, id: application.playerId, currentKingdom: kingdom, power: application.might, notes: application.notes, registeredAt: new Date().toLocaleString() };
      let log = [];
      try { log = JSON.parse(localStorage.getItem('k500_duty_log') || '[]'); } catch {}
      log.unshift(duty); localStorage.setItem('k500_duty_log', JSON.stringify(log));
      if (msg) { msg.style.display = 'block'; msg.textContent = 'Migration application submitted successfully.'; }
      form.reset();
    }).catch(error => { if (msg) { msg.style.display = 'block'; msg.textContent = `Could not submit application: ${error.message}`; } });
  }, true);
}

function renderChat() {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  container.replaceChildren();
  for (const message of chatMessages) {
    const item = document.createElement('div'); item.className = 'chat-msg';
    const header = document.createElement('div'); header.className = 'chat-msg-header';
    const nick = document.createElement('span'); nick.className = 'chat-msg-user'; nick.textContent = message.nick || 'Warrior';
    const time = document.createElement('span'); time.textContent = message.time || '';
    const text = document.createElement('div'); text.className = 'chat-msg-text'; text.textContent = message.text || '';
    header.append(nick, time); item.append(header, text); container.append(item);
  }
  container.scrollTop = container.scrollHeight;
}

function installChat() {
  const form = document.getElementById('chat-form');
  if (form && form !== currentChatForm) {
    currentChatForm = form;
    form.addEventListener('submit', event => {
      event.preventDefault(); event.stopImmediatePropagation();
      const nick = document.getElementById('chat-nick')?.value.trim() || 'Warrior_500';
      const text = document.getElementById('chat-text')?.value.trim();
      if (!text) return;
      const message = { nick: nick.slice(0, 32), text: text.slice(0, 500), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), sentAt: Date.now() };
      push(ref(db, 'chat/messages'), message).catch(error => showError(error.message));
      const input = document.getElementById('chat-text'); if (input) input.value = '';
    }, true);
  }
  renderChat();
}

onValue(chatRef, snapshot => {
  const value = snapshot.val() || {};
  chatMessages = Object.values(value).sort((a, b) => (a.sentAt || 0) - (b.sentAt || 0));
  renderChat();
}, error => showError(error.message));

function enhancePage() {
  installAdminEnhancements();
  installRosterApplicationForm();
  installMigrationHandler();
  installChat();
  refreshPageData();
}

const observer = new MutationObserver(enhancePage);
observer.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', enhancePage);
window.addEventListener('firebase-data-updated', refreshPageData);

// Keep the legacy navigation entry point but make the removed Leaders view inaccessible.
const navPatchTimer = setInterval(() => {
  if (typeof window.navigateSPA !== 'function') return;
  const originalNavigate = window.navigateSPA;
  window.navigateSPA = page => originalNavigate(page === 'leadership' ? 'home' : page);
  clearInterval(navPatchTimer);
}, 50);
setTimeout(() => clearInterval(navPatchTimer), 10000);
