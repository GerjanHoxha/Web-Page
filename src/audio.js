/**
 * KINGDOM 500 - AUDIO ENGINE
 * Disabled to keep the page silent and English-only.
 */

export class AudioEngine {
  constructor() {
    this.ytPlayer = null;
    this.isPlaying = false;
  }

  toggleSoundtrack() {
    this.isPlaying = false;
  }

  playClick() {
    // Sound disabled intentionally.
  }
}
