/**
 * KINGDOM 500 - AUDIO ENGINE
 * Uses the single persistent hidden YouTube iframe already in the DOM.
 * The iframe is NEVER recreated on navigation — music plays non-stop across all views.
 * Video: Peyton Parrish - Valhalla Calling (kKAY7YaBVWM)
 */

export class AudioEngine {
  constructor() {
    this.ytPlayer = null;
    this.isPlaying = false;
    this.videoId = 'kKAY7YaBVWM';
    this._initYT();
  }

  _initYT() {
    // If YT API already loaded just create the player
    if (window.YT && window.YT.Player) {
      this._createPlayer();
      return;
    }

    // Inject YT IFrame API script once
    if (!document.getElementById('yt-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    // Chain onto any existing onYouTubeIframeAPIReady
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev();
      this._createPlayer();
    };
  }

  _createPlayer() {
    const el = document.getElementById('yt-player-iframe');
    if (!el) return;

    // Already initialised — don't create a second player
    if (this.ytPlayer && typeof this.ytPlayer.getPlayerState === 'function') return;

    this.ytPlayer = new window.YT.Player('yt-player-iframe', {
      videoId: this.videoId,
      playerVars: {
        autoplay: 1,
        loop: 1,
        playlist: this.videoId,
        controls: 0,
        modestbranding: 1,
        rel: 0
      },
      events: {
        onReady: (e) => {
          e.target.setVolume(75);
          e.target.playVideo();
          this.isPlaying = true;
          // Autoplay is often blocked; re-trigger on first user gesture
          this._setupAutoplayFallback();
        },
        onStateChange: (e) => {
          // Loop if ended
          if (e.data === window.YT.PlayerState.ENDED) {
            e.target.playVideo();
          }
        }
      }
    });
  }

  _setupAutoplayFallback() {
    const tryPlay = () => {
      if (this.ytPlayer && typeof this.ytPlayer.playVideo === 'function' && !this.isPlaying) {
        this.ytPlayer.playVideo();
        this.isPlaying = true;
      }
      document.removeEventListener('click', tryPlay);
      document.removeEventListener('keydown', tryPlay);
    };
    document.addEventListener('click', tryPlay);
    document.addEventListener('keydown', tryPlay);
  }

  toggleSoundtrack(callback) {
    if (!this.ytPlayer || typeof this.ytPlayer.getPlayerState !== 'function') return;
    const state = this.ytPlayer.getPlayerState();
    if (state === window.YT.PlayerState.PLAYING) {
      this.ytPlayer.pauseVideo();
      this.isPlaying = false;
    } else {
      this.ytPlayer.playVideo();
      this.isPlaying = true;
    }
    if (typeof callback === 'function') callback(this.isPlaying);
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
