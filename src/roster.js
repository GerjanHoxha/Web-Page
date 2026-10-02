/**
 * KINGDOM 500 - ROSTER & ROLL CALL MODULE
 * Leaderboard rendering (80+ players), 8 Officer Photo Cards rendering, search/filtering, roll-call handler.
 */

import { leaders, initialPlayers } from './data.js';

export class RosterEngine {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.players = this.loadPlayers();

    this.tbody = document.getElementById('roster-tbody');
    this.leadGrid = document.getElementById('lead-grid');
    this.searchInput = document.getElementById('roster-search');
    this.allianceFilter = document.getElementById('alliance-filter');
    this.sortFilter = document.getElementById('sort-filter');
    this.rollForm = document.getElementById('roll-form');
    this.statusMsg = document.getElementById('roll-status-msg');

    this.init();
  }

  loadPlayers() {
    const saved = localStorage.getItem('k500_players');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [...initialPlayers];
      }
    }
    return [...initialPlayers];
  }

  savePlayers() {
    localStorage.setItem('k500_players', JSON.stringify(this.players));
  }

  init() {
    this.renderLeadership();
    this.renderTable();

    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => this.renderTable());
    }
    if (this.allianceFilter) {
      this.allianceFilter.addEventListener('change', () => this.renderTable());
    }
    if (this.sortFilter) {
      this.sortFilter.addEventListener('change', () => this.renderTable());
    }

    if (this.rollForm) {
      this.rollForm.addEventListener('submit', (e) => this.handleRollSubmit(e));
    }
  }

  renderLeadership() {
    if (!this.leadGrid) return;
    const savedOfficers = JSON.parse(localStorage.getItem('k500_officers') || JSON.stringify(leaders));

    this.leadGrid.innerHTML = savedOfficers.map(l => `
      <div class="leader-card glass-card">
        ${l.photo ? `<img src="${l.photo}" alt="${l.name}" class="officer-photo-img" onerror="this.src='https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80'">` : `<div class="leader-avatar">${l.avatar || '👑'}</div>`}
        <div class="leader-role">${l.role}</div>
        <h3 class="leader-name">${l.name}</h3>
        <span class="badge-tag badge-${l.alliance}">${l.alliance}</span>
        <p class="card-text" style="margin-top:10px">${l.desc || 'Kingdom 500 Council Leader'}</p>
      </div>
    `).join('');
  }

  renderTable() {
    if (!this.tbody) return;

    let search = (this.searchInput?.value || '').toLowerCase();
    let alliance = this.allianceFilter?.value || 'ALL';
    let sort = this.sortFilter?.value || 'power';

    let list = [...this.players];

    if (search) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.alliance.toLowerCase().includes(search) ||
        (p.id && String(p.id).includes(search))
      );
    }

    if (alliance !== 'ALL') {
      list = list.filter(p => p.alliance === alliance);
    }

    list.sort((a, b) => {
      if (sort === 'power') {
        const valA = typeof a.power === 'number' ? a.power : parseInt(a.power) || 0;
        const valB = typeof b.power === 'number' ? b.power : parseInt(b.power) || 0;
        return valB - valA;
      } else if (sort === 'kills') {
        const killA = typeof a.kills === 'number' ? a.kills : parseInt(a.kills) || 0;
        const killB = typeof b.kills === 'number' ? b.kills : parseInt(b.kills) || 0;
        return killB - killA;
      } else if (sort === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    this.tbody.innerHTML = list.map((p, index) => `
      <tr>
        <td style="font-weight:700; color:var(--gold)">#${index + 1}</td>
        <td><strong style="color:var(--text-main)">${p.name}</strong></td>
        <td><span class="badge-tag badge-${p.alliance}">${p.alliance}</span></td>
        <td style="color:var(--gold-light); font-weight:600">${this.formatNumber(p.power)}</td>
        <td style="color:var(--crimson-light)">${this.formatNumber(p.kills)}</td>
        <td>${p.share || '2.0%'}</td>
        <td>
          <span class="status-indicator">
            <span class="status-dot"></span> Ready
          </span>
        </td>
      </tr>
    `).join('');
  }

  handleRollSubmit(e) {
    e.preventDefault();

    const nameStr = document.getElementById('reg-name')?.value.trim();
    const idStr = document.getElementById('reg-id')?.value.trim();
    const allyStr = document.getElementById('reg-ally')?.value;
    const mightStr = document.getElementById('reg-might')?.value.trim();
    const notesStr = document.getElementById('reg-notes')?.value.trim();

    if (!nameStr) return;

    let numericPower = 45000000;
    if (mightStr) {
      const match = mightStr.match(/(\d+(\.\d+)?)\s*([mMbBkK])?/i);
      if (match) {
        let val = parseFloat(match[1]);
        let unit = (match[3] || '').toUpperCase();
        if (unit === 'M') val *= 1000000;
        else if (unit === 'B') val *= 1000000000;
        else if (unit === 'K') val *= 1000;
        numericPower = val;
      }
    }

    const newPlayer = {
      rank: this.players.length + 1,
      name: nameStr,
      id: idStr || `ID-${Math.floor(100000 + Math.random() * 900000)}`,
      alliance: allyStr || 'xHTx',
      power: numericPower,
      kills: Math.floor(numericPower * 0.08),
      share: '2.5%',
      status: 'Active',
      notes: notesStr || 'Ready for war',
      registeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.players.unshift(newPlayer);
    this.savePlayers();
    this.renderTable();

    const dutyLog = JSON.parse(localStorage.getItem('k500_duty_log') || '[]');
    dutyLog.unshift(newPlayer);
    localStorage.setItem('k500_duty_log', JSON.stringify(dutyLog));

    if (this.audioEngine) {
      this.audioEngine.playClick();
    }

    if (this.statusMsg) {
      this.statusMsg.style.display = 'block';
      this.statusMsg.textContent = `🛡️ Hail Warrior ${nameStr}! Your duty report has been registered for Kingdom 500.`;
      setTimeout(() => {
        this.statusMsg.style.display = 'none';
      }, 5000);
    }

    this.rollForm.reset();
  }

  formatNumber(val) {
    if (typeof val === 'number') {
      if (val >= 1000000000) return (val / 1000000000).toFixed(2) + 'B';
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
      return val.toLocaleString();
    }
    return val;
  }
}
