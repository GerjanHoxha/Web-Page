/**
 * KINGDOM 500 - LEADER ADMIN PORTAL & CMS MODULE
 * Passcode: Varsity24!
 * NO window.location.reload() — saves trigger SPA view refresh instead.
 */

import { leaders, defaultStats } from './data.js';

export class AdminEngine {
  constructor(audioEngine, rosterRef) {
    this.audio   = audioEngine;
    this.roster  = rosterRef;   // { players, savePlayers, formatNumber }
    this.modal   = document.getElementById('admin-modal');
    this.authBox = document.getElementById('admin-auth-box');
    this.panelBox= document.getElementById('admin-panel');
    this.passIn  = document.getElementById('admin-passcode');
    this.errTxt  = document.getElementById('admin-auth-err');
    this.PASS    = 'Varsity24!';
    this.authed  = false;
    this._bindStatic();
  }

  // ── Static bindings (modal chrome, never re-created) ─────────────────────
  _bindStatic() {
    document.getElementById('admin-trigger')?.addEventListener('click', () => this.openModal());
    document.getElementById('footer-admin-btn')?.addEventListener('click', () => this.openModal());

    document.getElementById('admin-close')?.addEventListener('click', () => this.close());
    document.getElementById('admin-login-btn')?.addEventListener('click', () => this._auth());
    this.passIn?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._auth();
    });
    this.modal?.addEventListener('click', e => {
      if (e.target === this.modal) this.close();
    });
    document.getElementById('export-csv-btn')?.addEventListener('click', () => this._exportCSV());
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.cms-tab-content').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        document.getElementById(e.currentTarget.dataset.tab)?.classList.add('active');
      });
    });
    document.getElementById('save-stats-btn')?.addEventListener('click', () => this._saveStats());
    document.getElementById('save-officers-btn')?.addEventListener('click', () => this._saveOfficers());
    document.getElementById('add-player-btn')?.addEventListener('click', () => this._addPlayer());
    document.getElementById('save-activity-btn')?.addEventListener('click', () => this._saveActivityFeed());
  }

  openModal() {
    this.audio?.playClick();
    this.modal?.classList.add('active');
    if (this.authed) this._showPanel();
    else this._showAuth();
  }

  close() {
    this.modal?.classList.remove('active');
  }

  _showAuth() {
    if (this.authBox)  this.authBox.style.display  = 'flex';
    if (this.panelBox) this.panelBox.style.display = 'none';
    if (this.errTxt)   this.errTxt.style.display   = 'none';
  }

  _showPanel() {
    if (this.authBox)  this.authBox.style.display  = 'none';
    if (this.panelBox) this.panelBox.style.display = 'block';
    this._loadStats();
    this._renderOfficers();
    this._renderDuty();
    this._loadActivityFeed();
    const cnt = document.getElementById('cms-player-count');
    if (cnt) cnt.textContent = this.roster.players.length;
  }

  _auth() {
    if (this.passIn?.value.trim() === this.PASS) {
      this.authed = true;
      this.audio?.playClick();
      this._showPanel();
    } else {
      if (this.errTxt) {
        this.errTxt.style.display = 'block';
        this.errTxt.textContent = '❌ Invalid Passcode. Access Denied.';
      }
    }
  }

  // ── Stats ───────────────────────────────────────────────────────────
  _loadStats() {
    const s = JSON.parse(localStorage.getItem('k500_custom_stats') || JSON.stringify(defaultStats));
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('edit-stat-power',     s.power);
    set('edit-stat-kills',     s.kills);
    set('edit-stat-alliances', s.alliances);
    set('edit-stat-days',      s.days);
  }

  _saveStats() {
    const get = id => parseInt(document.getElementById(id)?.value) || 0;
    const stats = {
      power:     get('edit-stat-power')     || defaultStats.power,
      kills:     get('edit-stat-kills')     || defaultStats.kills,
      alliances: get('edit-stat-alliances') || defaultStats.alliances,
      days:      get('edit-stat-days')      || defaultStats.days
    };
    localStorage.setItem('k500_custom_stats', JSON.stringify(stats));
    if (window._currentPage === 'stats') window.navigateSPA('stats');
    this._toast('✅ Kingdom Stats saved!');
  }

  // ── Officers ──────────────────────────────────────────────────────────
  _renderOfficers() {
    const container = document.getElementById('officers-editor-list');
    if (!container) return;
    const saved = JSON.parse(localStorage.getItem('k500_officers') || JSON.stringify(leaders));
    container.innerHTML = saved.map((o, i) => `
      <div class="officer-edit-item glass-card" style="margin-bottom:12px;padding:14px">
        <h4 style="color:var(--gold);margin-bottom:8px">Officer Slot #${i + 1}</h4>
        <div class="form-row">
          <input type="text" id="off-name-${i}" value="${o.name}" placeholder="Officer Name">
          <input type="text" id="off-role-${i}" value="${o.role}" placeholder="Title/Role">
          <input type="text" id="off-ally-${i}" value="${o.alliance}" placeholder="Alliance Tag">
        </div>
        <div class="form-group" style="margin-top:8px">
          <label style="font-size:0.8rem;color:var(--text-muted)">Photo URL</label>
          <input type="text" id="off-photo-${i}" value="${o.photo || ''}" placeholder="https://...">
        </div>
        <div class="form-group">
          <label style="font-size:0.8rem;color:var(--text-muted)">Short Bio</label>
          <input type="text" id="off-desc-${i}" value="${o.desc || ''}" placeholder="Short description">
        </div>
      </div>`).join('');
  }

  _saveOfficers() {
    const saved = JSON.parse(localStorage.getItem('k500_officers') || JSON.stringify(leaders));
    for (let i = 0; i < 8; i++) {
      if (!saved[i]) continue;
      const g = id => document.getElementById(id)?.value.trim();
      saved[i].name    = g(`off-name-${i}`)  || saved[i].name;
      saved[i].role    = g(`off-role-${i}`)  || saved[i].role;
      saved[i].alliance= g(`off-ally-${i}`)  || saved[i].alliance;
      saved[i].photo   = g(`off-photo-${i}`) || saved[i].photo;
      saved[i].desc    = g(`off-desc-${i}`)  || saved[i].desc;
    }
    localStorage.setItem('k500_officers', JSON.stringify(saved));
    if (window._currentPage === 'leadership') window.navigateSPA('leadership');
    this._toast('✅ Council Officers updated!');
  }

  // ── Roster ──────────────────────────────────────────────────────────
  _addPlayer() {
    const name  = document.getElementById('new-player-name')?.value.trim();
    const ally  = document.getElementById('new-player-ally')?.value.trim() || 'xHTx';
    const power = parseInt(document.getElementById('new-player-power')?.value) || 35_000_000;
    if (!name) return;
    this.roster.players.unshift({
      rank: this.roster.players.length + 1,
      name, alliance: ally, power,
      kills: Math.floor(power * 0.07),
      share: '2.5%', status: 'Active'
    });
    this.roster.savePlayers();
    const cnt = document.getElementById('cms-player-count');
    if (cnt) cnt.textContent = this.roster.players.length;
    this._toast(`✅ Warrior ${name} added!`);
    ['new-player-name','new-player-ally','new-player-power'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
  }

  // ── Activity feed editor ───────────────────────────────────────────────
  _loadActivityFeed() {
    const area = document.getElementById('activity-feed-editor');
    if (!area) return;
    const items = JSON.parse(localStorage.getItem('k500_activity_feed') || '[]');
    if (!items.length) {
      area.value = `🏆|KvK Stage 2 Victorious!|Kingdom 500 secured #1 rank in Kingdom vs Kingdom honor points.|12 mins ago\n⚔️|Dragon Shrine Captured|Alliance [xHTx] successfully garrisoned the Central Dragon Shrine.|45 mins ago\n📜|New Treaty Signed|Council published updated KvK loot distribution rules.|2 hours ago`;
      return;
    }
    area.value = items.map(item => `${item.icon || '⚔️'}|${item.title || ''}|${item.text || ''}|${item.time || 'Just now'}`).join('\n');
  }

  _saveActivityFeed() {
    const area = document.getElementById('activity-feed-editor');
    if (!area) return;
    const lines = area.value.split('\n').map(line => line.trim()).filter(Boolean);
    const items = lines.map(line => {
      const parts = line.split('|');
      return {
        icon: (parts[0] || '⚔️').trim(),
        title: (parts[1] || 'War Activity').trim(),
        text: (parts[2] || '').trim(),
        time: (parts[3] || 'Just now').trim()
      };
    }).filter(item => item.title || item.text);

    localStorage.setItem('k500_activity_feed', JSON.stringify(items));
    if (window._currentPage === 'home') window.navigateSPA('home');
    this._toast('✅ War activity feed updated!');
  }

  // ── Duty log ──────────────────────────────────────────────────────────
  _renderDuty() {
    const log = JSON.parse(localStorage.getItem('k500_duty_log') || '[]');
    const cnt = document.getElementById('duty-count');
    if (cnt) cnt.textContent = log.length;
    const tbody = document.getElementById('admin-duty-tbody');
    if (!tbody) return;
    if (!log.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No roll call submissions yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = log.map(r => `
      <tr>
        <td><strong style="color:var(--gold-light)">${r.name}</strong></td>
        <td style="color:var(--text-muted)">${r.id || '-'}</td>
        <td><span class="badge-tag badge-${r.alliance}">${r.alliance}</span></td>
        <td style="color:var(--gold)">${this.roster.formatNumber(r.power)}</td>
        <td>${r.notes || '-'}</td>
        <td style="font-size:0.8rem;color:var(--text-muted)">${r.registeredAt || 'Just now'}</td>
      </tr>`).join('');
  }

  // ── CSV Export ─────────────────────────────────────────────────────────
  _exportCSV() {
    const log = JSON.parse(localStorage.getItem('k500_duty_log') || '[]');
    if (!log.length) { alert('No duty entries to export!'); return; }
    const hdr = ['In-Game Name','Player ID','Alliance Tag','Might','Notes','Registration Time'];
    const rows = log.map(r => [r.name, r.id||'', r.alliance, r.power, r.notes||'', r.registeredAt||''].map(v => `"${v}"`));
    const csv  = 'data:text/csv;charset=utf-8,' + encodeURIComponent([hdr.join(','), ...rows.map(r => r.join(','))].join('\n'));
    const a = Object.assign(document.createElement('a'), { href: csv, download: `K500_Duty_${new Date().toISOString().slice(0,10)}.csv` });
    document.body.appendChild(a); a.click(); a.remove();
  }

  _toast(msg) {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:80px;right:24px;background:rgba(34,197,94,0.15);border:1px solid #22c55e;color:#4ade80;padding:12px 20px;border-radius:8px;font-size:0.9rem;z-index:99;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 3000);
  }
}
