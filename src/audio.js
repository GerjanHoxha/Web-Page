/**
 * KINGDOM 500 - AUDIO ENGINE
 * The soundtrack plays through the footer player in index.html (site-audio).
 * This class only provides the small button click sound.
 */

export class AudioEngine {
  constructor() {
    this._ctx = null;
  }

  playClick() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!this._ctx) this._ctx = new Ctx();
      const ctx = this._ctx;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (_) {}
  }

  // Kept so existing calls in main.js don't break. The song is controlled
  // by the footer player, so this intentionally does nothing.
  toggleSoundtrack() {}
}