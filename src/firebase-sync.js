/**
 * Firebase Realtime Database integration.
 * Firebase is authoritative; localStorage is not mirrored to or from the database.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  getDatabase, ref, onValue, set, push, query, limitToLast
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';
import { getAuth, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const state = {
  councilOfficers: null,
  warriors: null,
  dutyLog: null,
  activityFeed: null,
  stats: null,
  chatMessages: [],
  migrationApplications: null
};
const listeners = new Map();
const chatRef = query(ref(db, 'chat/messages'), limitToLast(100));

function dispatchDataUpdate(key) {
  window.dispatchEvent(new CustomEvent('firebase-data-updated', { detail: { keys: [key] } }));
}

function reportError(error, statusId) {
  console.error('[Kingdom 500 Firebase]', error);
  const status = document.getElementById(statusId) || document.getElementById('admin-auth-err') || document.getElementById('roll-status-msg');
  if (status) {
    status.style.display = 'block';
    status.textContent = `Firebase error: ${error?.message || error}`;
  }
}

function subscribe(path, key, normalize = value => value) {
  return onValue(ref(db, path), snapshot => {
    state[key] = snapshot.exists() ? normalize(snapshot.val()) : null;
    if (key === 'chatMessages') {
      state.chatMessages = Object.values(snapshot.val() || {}).sort((a, b) => (a.sentAt || 0) - (b.sentAt || 0));
    }
    dispatchDataUpdate(key);
  }, error => reportError(error));
}

// Keep these listeners scoped to the individual public sections; never subscribe
// to the parent siteData node, which would require broad read permissions.
listeners.set('councilOfficers', subscribe('siteData/councilOfficers', 'councilOfficers'));
listeners.set('warriors', subscribe('siteData/warriors', 'warriors', value => Array.isArray(value) ? value : Object.values(value || {})));
listeners.set('dutyLog', subscribe('siteData/dutyLog', 'dutyLog', value => Array.isArray(value) ? value : Object.values(value || {})));
listeners.set('activityFeed', subscribe('siteData/activityFeed', 'activityFeed', value => Array.isArray(value) ? value : Object.values(value || {})));
listeners.set('stats', subscribe('siteData/k500_custom_stats', 'stats'));
listeners.set('migrationApplications', subscribe('migrationApplications', 'migrationApplications', value => value || {}));
listeners.set('chatMessages', onValue(chatRef, snapshot => {
  state.chatMessages = Object.values(snapshot.val() || {}).sort((a, b) => (a.sentAt || 0) - (b.sentAt || 0));
  dispatchDataUpdate('chatMessages');
}, error => reportError(error)));

async function write(path, value, statusId) {
  if (value === null || value === undefined || value === '') {
    throw new Error('Empty values are not saved. Use the explicit delete operation to remove an item.');
  }
  await set(ref(db, path), value);
}

async function remove(path) {
  await set(ref(db, path), null);
}

async function append(path, value) {
  const itemRef = push(ref(db, path));
  await set(itemRef, value);
  return itemRef.key;
}

window.firebaseData = {
  state,
  auth,
  write,
  remove,
  append,
  signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
  signOut: () => signOut(auth),
  reportError,
  onError: (error, statusId) => reportError(error, statusId)
};

let currentChatForm = null;
function installChat() {
  const form = document.getElementById('chat-form');
  if (!form || form === currentChatForm) return;
  currentChatForm = form;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const nick = document.getElementById('chat-nick')?.value.trim() || 'Warrior_500';
    const text = document.getElementById('chat-text')?.value.trim();
    if (!text) return;
    try {
      await append('chat/messages', {
        nick: nick.slice(0, 32), text: text.slice(0, 500),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), sentAt: Date.now()
      });
      document.getElementById('chat-text').value = '';
    } catch (error) {
      reportError(error, 'chat-status-msg');
    }
  }, true);
}

function refreshRosterTable() {
  const body = document.getElementById('roster-tbody');
  if (!body) return;
  const warriors = Array.isArray(state.warriors) ? state.warriors : [];
  const search = (document.getElementById('roster-search')?.value || '').trim().toLowerCase();
  const shown = warriors.filter(player => !search || String(player.name || '').toLowerCase().includes(search));
  body.innerHTML = shown.map((player, index) => `<tr>
    <td>${index + 1}</td><td>${escapeHtml(player.name)}</td>
    <td>${escapeHtml(String(player.might ?? player.power ?? ''))}</td><td>${escapeHtml(player.rank || 'R1')}</td>
    <td>${player.activeForKvK === 'Yes' ? 'Yes' : 'No'}</td>
  </tr>`).join('') || '<tr><td colspan="5">No warriors have registered yet.</td></tr>';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
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
      <div class="form-group"><label for="public-player-might">Might *</label><input id="public-player-might" type="text" required maxlength="40"></div>
      <div class="form-row"><div class="form-group"><label for="public-player-rank">Rank *</label><select id="public-player-rank" required><option>R5</option><option>R4</option><option>R3</option><option>R2</option><option>R1</option></select></div>
      <div class="form-group"><label for="public-player-kvk">Active for KvK *</label><select id="public-player-kvk" required><option>Yes</option><option>No</option></select></div></div>
      <div class="form-group"><label for="public-roster-password">Submission password *</label><input id="public-roster-password" type="password" required autocomplete="current-password"></div>
      <button class="btn-primary-block" type="submit">Submit Roster Entry</button><p id="public-roster-status" class="status-msg" style="display:none"></p>
    </form>`;
  section.prepend(card);
  card.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault();
    const status = document.getElementById('public-roster-status');
    const show = message => { status.style.display = 'block'; status.textContent = message; };
    if (document.getElementById('public-roster-password').value !== 'newarea500') {
      show('Incorrect submission password.'); return;
    }
    const player = {
      name: document.getElementById('public-player-name').value.trim(),
      might: document.getElementById('public-player-might').value.trim(),
      rank: document.getElementById('public-player-rank').value,
      activeForKvK: document.getElementById('public-player-kvk').value,
      registeredAt: new Date().toISOString()
    };
    if (!player.name || !player.might) { show('Enter a player name and might.'); return; }
    try {
      const players = Array.isArray(state.warriors) ? [...state.warriors] : [];
      players.unshift(player);
      await write('siteData/warriors', players);
      show('Roster entry saved.'); event.currentTarget.reset();
    } catch (error) { show(`Could not save roster entry: ${error.message}`); }
  });
}

function installMigrationHandler() {
  const form = document.getElementById('roll-form');
  if (!form || form.dataset.firebaseMigrationBound) return;
  form.dataset.firebaseMigrationBound = 'true';
  form.addEventListener('submit', async event => {
    event.preventDefault(); event.stopImmediatePropagation();
    const name = document.getElementById('reg-name')?.value.trim();
    const kingdom = document.getElementById('reg-kingdom')?.value.trim();
    const status = document.getElementById('roll-status-msg');
    const show = message => { if (status) { status.style.display = 'block'; status.textContent = message; } };
    if (!name || !kingdom) { show('Please enter your player name and current kingdom.'); return; }
    const application = {
      name, playerId: document.getElementById('reg-id')?.value.trim() || '', currentKingdom: kingdom,
      might: document.getElementById('reg-might')?.value.trim() || '',
      notes: document.getElementById('reg-notes')?.value.trim() || '', submittedAt: new Date().toISOString()
    };
    try {
      await append('migrationApplications', application);
      const duty = { name, id: application.playerId, currentKingdom: kingdom, power: application.might, notes: application.notes, registeredAt: new Date().toLocaleString() };
      const log = Array.isArray(state.dutyLog) ? [...state.dutyLog] : [];
      log.unshift(duty);
      await write('siteData/dutyLog', log);
      show('Migration application submitted successfully.'); form.reset();
    } catch (error) { show(`Could not submit application: ${error.message}`); }
  }, true);
}

function enhancePage() {
  installChat();
  installRosterApplicationForm();
  installMigrationHandler();
  refreshRosterTable();
}

const pageContent = document.getElementById('page-content');
if (pageContent) new MutationObserver(enhancePage).observe(pageContent, { childList: true });
document.addEventListener('DOMContentLoaded', enhancePage);
window.addEventListener('firebase-data-updated', event => {
  if (event.detail?.keys?.some(key => ['warriors', 'dutyLog', 'activityFeed', 'councilOfficers'].includes(key))) enhancePage();
});
