/**
 * KINGDOM 500 - LEADER ADMIN PORTAL & CMS MODULE
 * Shared passcode: newarea500
 */

import { leaders, defaultStats, SHARED_ACCESS_CODE } from './data.js';

export class AdminEngine {
  constructor(audioEngine, rosterRef) {
    this.audio = audioEngine;
    this.roster = rosterRef;
    this.modal = document.getElementById('admin-modal');
    this.authBox = document.getElementById('admin-auth-box');
    this.panelBox = document.getElementById('admin-panel');
    this.passIn = document.getElementById('admin-passcode');
    this.errTxt = document.getElementById('admin-auth-err');
    this.PASS = SHARED_ACCESS_CODE;
    this.authed = false;
    this._bindStatic();
  }

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
    document.getElementById('export-csv-btn')?.addEventListener('click', () => this._exportCSV());
    document.getElementById('clear-feed-btn')?.addEventListener('click', () => this._clearActivityFeed());
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
    if (this.authBox) this.authBox.style.display = 'flex';
    if (this.panelBox) this.panelBox.style.display = 'none';
    if (this.errTxt) this.errTxt.style.display = 'none';
    if (this.passIn) this.passIn.value = '';
  }

  _showPanel() {
    if (this.authBox) this.authBox.style.display = 'none';
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
      this.audio?.playClick();
    }
  }

  _loadStats() {
    const s = window.firebaseData?.read?.('stats') || JSON.parse(localStorage.getItem('k500_custom_stats') || JSON.stringify(defaultStats));
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('edit-stat-power', s.power ?? defaultStats.power);
    set('edit-stat-kills', s.kills ?? 0);
    set('edit-stat-alliances', s.alliances ?? defaultStats.alliances);
    set('edit-stat-days', s.days ?? defaultStats.days);
  }

  _saveStats() {
    const get = id => parseInt(document.getElementById(id)?.value) || 0;
    const stats = {
      power: get('edit-stat-power') || defaultStats.power,
      kills: get('edit-stat-kills') || 0,
      alliances: get('edit-stat-alliances') || defaultStats.alliances,
      days: get('edit-stat-days') || defaultStats.days
    };
    localStorage.setItem('k500_custom_stats', JSON.stringify(stats));
    if (window.firebaseData?.writeSection) {
      window.firebaseData.writeSection('stats', stats).catch(() => {});
    }
    if (window._currentPage === 'stats') window.navigateSPA('stats');
    this._toast('✅ Kingdom Stats saved!');
    this.audio?.playClick();
  }

  _renderOfficers() {
    const container = document.getElementById('officers-editor-list');
    if (!container) return;
    const saved = Array.isArray(window.firebaseData?.read?.('councilOfficers')) ? window.firebaseData.read('councilOfficers') : (JSON.parse(localStorage.getItem('k500_officers') || JSON.stringify(leaders)) || []);
    const slots = Array.from({ length: 8 }, (_, i) => saved[i] || { name: '', role: '', alliance: 'xHTx', photo: '', desc: '' });
    container.innerHTML = slots.map((o, i) => `
      <div class="officer-edit-item glass-card" style="margin-bottom:12px;padding:14px">
        <h4 style="color:var(--gold);margin-bottom:8px">Officer Slot #${i + 1}</h4>
        <div class="form-row">
          <input type="text" id="off-name-${i}" value="${o.name || ''}" placeholder="Officer Name">
          <input type="text" id="off-role-${i}" value="${o.role || ''}" placeholder="Title/Role">
          <input type="text" id="off-ally-${i}" value="${o.alliance || 'xHTx'}" placeholder="Alliance Tag">
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
    const slots = Array.from({ length: 8 }, (_, i) => ({
      name: document.getElementById(`off-name-${i}`)?.value.trim() || '',
      role: document.getElementById(`off-role-${i}`)?.value.trim() || '',
      alliance: document.getElementById(`off-ally-${i}`)?.value.trim() || 'xHTx',
      photo: document.getElementById(`off-photo-${i}`)?.value.trim() || '',
      desc: document.getElementById(`off-desc-${i}`)?.value.trim() || ''
    }));
    localStorage.setItem('k500_officers', JSON.stringify(slots));
    if (window.firebaseData?.writeSection) {
      window.firebaseData.writeSection('councilOfficers', slots).catch(error => {
        this._toast('❌ Council save failed: ' + (error?.message || 'Firebase unavailable'));
      });
    }
    if (window._currentPage === 'leadership') window.navigateSPA('leadership');
    this._toast('✅ Council Officers updated!');
    this.audio?.playClick();
  }

  _addPlayer() {
    const name = document.getElementById('new-player-name')?.value.trim();
    const kingdom = document.getElementById('new-player-kingdom')?.value.trim() || 'Unknown';
    const power = parseInt(document.getElementById('new-player-power')?.value) || 35_000_000;
    if (!name) {
      this._toast('❌ Enter warrior name!');
      return;
    }
    this.roster.players.unshift({
      rank: this.roster.players.length + 1,
      name,
      currentKingdom: kingdom,
      power,
      kills: Math.floor(power * 0.07),
      status: 'Active'
    });
    this.roster.savePlayers();
    const cnt = document.getElementById('cms-player-count');
    if (cnt) cnt.textContent = this.roster.players.length;
    this._toast(`✅ Warrior ${name} added!`);
    this.audio?.playClick();
    if (window._currentPage === 'roster') window.navigateSPA('roster');
    ['new-player-name', 'new-player-kingdom', 'new-player-power'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  }

  _loadActivityFeed() {
    const items = Array.isArray(window.firebaseData?.read?.('activityFeed')) ? window.firebaseData.read('activityFeed') : JSON.parse(localStorage.getItem('k500_activity_feed') || '[]');
    const preview = document.getElementById('activity-feed-preview');
    if (!preview) return;
    if (!items.length) {
      preview.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px">No activity feed entries yet.</p>';
      return;
    }
    preview.innerHTML = items.map((item, idx) => `
      <div class="feed-preview-item" style="background:rgba(0,0,0,0.3);padding:12px;border-radius:6px;margin-bottom:8px;border-left:3px solid var(--gold)">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:8px">
          <div style="flex:1">
            <div style="font-size:1.4rem;margin-bottom:4px">${item.icon || '⚔️'}</div>
            <h4 style="color:var(--gold-light);margin-bottom:4px">${item.title || 'War Activity'}</h4>
            <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:4px">${item.text || ''}</p>
            <span style="font-size:0.75rem;color:var(--text-muted)">${item.time || 'Just now'}</span>
          </div>
          <button class="btn-gold-sm" style="padding:4px 8px;font-size:0.7rem" onclick="window.adminEngine._deleteActivityItem(${idx})">Remove</button>
        </div>
      </div>`).join('');
  }

  _saveActivityFeed() {
    const editor = document.getElementById('activity-feed-editor');
    const raw = editor?.value || '';
    const items = (raw || '').split(/\n+/).map(line => line.trim()).filter(Boolean).map(line => {
      const [icon = '⚔️', title = 'War Activity', text = '', time = 'Just now'] = line.split('|');
      return { icon: icon.trim(), title: title.trim(), text: text.trim(), time: time.trim() || 'Just now' };
    });
    if (!items.length) {
      this._toast('❌ Add at least one feed entry.');
      return;
    }
    const merged = [...items, ...((Array.isArray(window.firebaseData?.read?.('activityFeed')) ? window.firebaseData.read('activityFeed') : JSON.parse(localStorage.getItem('k500_activity_feed') || '[]')) || [])].slice(0, 20);
    localStorage.setItem('k500_activity_feed', JSON.stringify(merged));
    if (window.firebaseData?.writeSection) {
      window.firebaseData.writeSection('activityFeed', merged).catch(error => {
        this._toast('❌ Activity save failed: ' + (error?.message || 'Firebase unavailable'));
      });
    }
    if (editor) editor.value = '';
    this._loadActivityFeed();
    this._toast('✅ Activity entry added!');
    this.audio?.playClick();
    if (window._currentPage === 'home') window.navigateSPA('home');
  }

  _deleteActivityItem(idx) {
    const items = Array.isArray(window.firebaseData?.read?.('activityFeed')) ? [...window.firebaseData.read('activityFeed')] : JSON.parse(localStorage.getItem('k500_activity_feed') || '[]');
    items.splice(idx, 1);
    localStorage.setItem('k500_activity_feed', JSON.stringify(items));
    if (window.firebaseData?.writeSection) {
      window.firebaseData.writeSection('activityFeed', items).catch(() => {});
    }
    this._loadActivityFeed();
    this._toast('✅ Entry removed!');
    this.audio?.playClick();
  }

  _clearActivityFeed() {
    if (confirm('🔥 Clear ALL activity feed entries?')) {
      const empty = [];
      localStorage.setItem('k500_activity_feed', JSON.stringify(empty));
      if (window.firebaseData?.writeSection) {
        window.firebaseData.writeSection('activityFeed', empty).catch(() => {});
      }
      this._loadActivityFeed();
      this._toast('✅ Feed cleared!');
      this.audio?.playClick();
    }
  }

  _renderDuty() {
    const log = JSON.parse(localStorage.getItem('k500_duty_log') || '[]');
    const cnt = document.getElementById('duty-count');
    if (cnt) cnt.textContent = log.length;
    const tbody = document.getElementById('admin-duty-tbody');
    if (!tbody) return;
    if (!log.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No roll call submissions yet.</td></tr>';
      return;
    }
    tbody.innerHTML = log.map(r => `
      <tr>
        <td><strong style="color:var(--gold-light)">${r.name}</strong></td>
        <td style="color:var(--text-muted)">${r.id || '-'}</td>
        <td>${r.currentKingdom || r.kingdom || '-'}</td>
        <td style="color:var(--gold)">${this.roster.formatNumber(r.power)}</td>
        <td>${r.notes || '-'}</td>
        <td style="font-size:0.8rem;color:var(--text-muted)">${r.registeredAt || 'Just now'}</td>
      </tr>`).join('');
  }

  _exportCSV() {
    const log = JSON.parse(localStorage.getItem('k500_duty_log') || '[]');
    if (!log.length) {
      this._toast('❌ No duty entries to export!');
      return;
    }
    const hdr = ['In-Game Name', 'Player ID', 'Current Kingdom', 'Might', 'Notes', 'Registration Time'];
    const rows = log.map(r => [r.name, r.id || '', r.currentKingdom || r.kingdom || '', r.power, r.notes || '', r.registeredAt || ''].map(v => `"${v}"`));
    const csv = 'data:text/csv;charset=utf-8,' + encodeURIComponent([hdr.join(','), ...rows.map(r => r.join(','))].join('\n'));
    const a = Object.assign(document.createElement('a'), { href: csv, download: `K500_Duty_${new Date().toISOString().slice(0, 10)}.csv` });
    document.body.appendChild(a); a.click(); a.remove();
    this._toast('✅ CSV downloaded!');
    this.audio?.playClick();
  }

  _toast(msg) {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:80px;right:24px;background:rgba(34,197,94,0.15);border:1px solid #22c55e;color:#4ade80;padding:12px 20px;border-radius:8px;font-size:0.9rem;z-index:99';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 3000);
  }
}
