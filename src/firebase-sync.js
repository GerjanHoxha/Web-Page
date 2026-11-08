import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getDatabase, ref, onValue, set, push } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const state = {
  stats: null,
  councilOfficers: null,
  warriors: null,
  dutyLog: null,
  activityFeed: null,
  chatMessages: []
};

const defaultSections = {
  councilOfficers: [
    { name: '', role: '', alliance: 'xHTx', photo: '', desc: '' },
    { name: '', role: '', alliance: 'xHTx', photo: '', desc: '' },
    { name: '', role: '', alliance: 'xVGx', photo: '', desc: '' },
    { name: '', role: '', alliance: 'xNKx', photo: '', desc: '' },
    { name: '', role: '', alliance: 'xVGx', photo: '', desc: '' },
    { name: '', role: '', alliance: 'xHTx', photo: '', desc: '' },
    { name: '', role: '', alliance: 'xNKx', photo: '', desc: '' },
    { name: '', role: '', alliance: 'xRAx', photo: '', desc: '' }
  ],
  warriors: [],
  dutyLog: [],
  activityFeed: []
};

const sectionKeys = {
  councilOfficers: 'k500_officers',
  warriors: 'k500_players',
  dutyLog: 'k500_duty_log',
  activityFeed: 'k500_activity_feed',
  stats: 'k500_custom_stats'
};

function safeJson(value) {
  try { return JSON.parse(value); } catch { return null; }
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  return Object.values(value);
}

function logError(message, error) {
  console.error('[Kingdom 500 Firebase]', message, error);
}

function announce(section) {
  window.dispatchEvent(new CustomEvent('firebase-data-updated', { detail: { section } }));
}

function seedIfMissing(section, currentValue) {
  if (currentValue !== null && currentValue !== undefined) return false;
  const fallback = defaultSections[section];
  if (typeof fallback === 'undefined') return false;
  if (db) {
    set(ref(db, `siteData/${section}`), fallback)
      .then(() => {
        state[section] = fallback;
        const localKey = sectionKeys[section];
        if (localKey) localStorage.setItem(localKey, JSON.stringify(fallback));
        announce(section);
      })
      .catch(error => logError(`Unable to seed ${section}`, error));
  }
  return true;
}

function cacheFromLocal(section, value) {
  const localKey = sectionKeys[section];
  if (!localKey || value === null || value === undefined) return;
  try { localStorage.setItem(localKey, JSON.stringify(value)); } catch (error) { logError('Cache write failed', error); }
}

function listen(section) {
  if (!db) return;
  const dbRef = ref(db, `siteData/${section}`);
  onValue(dbRef, snapshot => {
    const raw = snapshot.exists() ? snapshot.val() : null;
    const next = raw === null || raw === undefined ? null : raw;
    state[section] = next;
    if (next !== null && next !== undefined) {
      cacheFromLocal(section, next);
    }
    if (next === null || next === undefined) {
      seedIfMissing(section, next);
    }
    announce(section);
  }, error => logError(`Firebase listener failed for ${section}`, error));
}

listen('councilOfficers');
listen('warriors');
listen('dutyLog');
listen('activityFeed');
listen('stats');

window.firebaseData = {
  state,
  write: async (path, value) => {
    if (!db) throw new Error('Firebase is unavailable.');
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
      throw new Error('Empty values are not allowed. Use a real value or delete via admin control.');
    }
    await set(ref(db, path), value);
    return value;
  },
  writeSection: async (section, value) => {
    if (!db) {
      const localKey = sectionKeys[section];
      if (localKey) localStorage.setItem(localKey, JSON.stringify(value));
      return value;
    }
    await set(ref(db, `siteData/${section}`), value);
    state[section] = value;
    cacheFromLocal(section, value);
    announce(section);
    return value;
  },
  read: (section) => {
    if (state[section] !== null && state[section] !== undefined) return state[section];
    const localKey = sectionKeys[section];
    if (!localKey) return defaultSections[section] || null;
    const cached = safeJson(localStorage.getItem(localKey));
    if (cached !== null) return cached;
    return defaultSections[section] || null;
  }
};

window.addEventListener('DOMContentLoaded', () => {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;
  const renderActivityFeed = () => {
    const items = toArray(window.firebaseData?.read('activityFeed') || []);
    if (!items.length) {
      feed.innerHTML = '<p style="margin:auto;color:var(--text-muted);text-align:center;">No activity yet</p>';
      return;
    }
    feed.innerHTML = items.map(item => `
      <div class="feed-item">
        <div class="feed-icon">${String(item.icon || '⚔️')}</div>
        <div class="feed-content">
          <h4>${String(item.title || 'War Activity')}</h4>
          <p>${String(item.text || '')}</p>
          <span class="feed-time">${String(item.time || 'Just now')}</span>
        </div>
      </div>
    `).join('');
  };
  const hydrate = () => renderActivityFeed();
  renderActivityFeed();
  window.addEventListener('firebase-data-updated', event => {
    if (event?.detail?.section === 'activityFeed') hydrate();
  });
});

window.addEventListener('contact', () => {
  // no-op: localStorage reads must not clear Firebase state
});
