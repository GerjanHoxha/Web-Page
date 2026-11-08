/**
 * KINGDOM 500 - AUDIO ENGINE
 * Uses the single persistent hidden audio element already in the DOM.
 * The uploaded soundtrack plays on a loop and starts after the first user interaction.
 */

const SOUNDTRACK_SRC = new URL('../WhatsApp Audio 2026-11-08 at 8.37.39 PM.mpeg', import.meta.url).href;

export class AudioEngine {
  constructor() {
    this.audio = document.getElementById('background-audio') || this._createAudioElement();
    this.audio.src = SOUNDTRACK_SRC;
    this.audio.loop = true;
    this.audio.volume = 0.3;
    this.audio.preload = 'auto';
    this.audio.muted = false;
    this.isPlaying = false;
    this.hasStarted = false;

    this._setupFirstInteraction();
  }

  _createAudioElement() {
    const audio = document.createElement('audio');
    audio.id = 'background-audio';
    audio.preload = 'auto';
    audio.loop = true;
    audio.playsInline = true;
    audio.style.display = 'none';
    document.body.appendChild(audio);
    return audio;
  }

  _setupFirstInteraction() {
    const startPlayback = () => {
      if (this.hasStarted) return;
      this.hasStarted = true;
      document.removeEventListener('pointerdown', startPlayback);
      document.removeEventListener('keydown', startPlayback);
      this._play();
    };

    document.addEventListener('pointerdown', startPlayback, { once: true });
    document.addEventListener('keydown', startPlayback, { once: true });
  }

  _play() {
    this.audio.play()
      .then(() => {
        this.isPlaying = true;
      })
      .catch(() => {
        this.isPlaying = false;
      });
  }

  toggleSoundtrack(callback) {
    if (this.audio.paused) {
      this.hasStarted = true;
      this._play();
    } else {
      this.audio.pause();
      this.isPlaying = false;
    }

    if (typeof callback === 'function') callback(!this.audio.paused);
  }

  playClick() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
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
}
