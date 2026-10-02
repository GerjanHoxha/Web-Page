/**
 * KINGDOM 500 - CANVAS ENGINE
 * High-performance 60fps canvas animations:
 * - Aurora Borealis wave simulation
 * - Floating Ember & Ash Particle System
 * - Lightning Flash Generator
 */

export class CanvasEngine {
  constructor() {
    this.bgCanvas = document.getElementById('bg-canvas');
    this.emberCanvas = document.getElementById('ember-canvas');
    this.lightningCanvas = document.getElementById('lightning-canvas');

    if (!this.bgCanvas || !this.emberCanvas || !this.lightningCanvas) return;

    this.bgCtx = this.bgCanvas.getContext('2d');
    this.emberCtx = this.emberCanvas.getContext('2d');
    this.lightningCtx = this.lightningCanvas.getContext('2d');

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.embers = [];
    this.stars = [];
    this.auroraPhase = 0;
    this.lightningAlpha = 0;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Generate Stars
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.7),
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: (Math.random() - 0.5) * 0.02
      });
    }

    // Generate Initial Embers
    for (let i = 0; i < 60; i++) {
      this.embers.push(this.createEmber());
    }

    this.animate();
  }

  createEmber() {
    return {
      x: Math.random() * this.width,
      y: this.height + Math.random() * 50,
      size: Math.random() * 3 + 1,
      speedY: Math.random() * 1.2 + 0.4,
      speedX: (Math.random() - 0.5) * 0.6,
      opacity: Math.random() * 0.8 + 0.2,
      color: Math.random() > 0.3 ? '#e6b84c' : '#ff6b00'
    };
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    [this.bgCanvas, this.emberCanvas, this.lightningCanvas].forEach(c => {
      c.width = this.width;
      c.height = this.height;
    });
  }

  triggerLightning() {
    this.lightningAlpha = 0.85;
  }

  drawAurora() {
    this.bgCtx.clearRect(0, 0, this.width, this.height);

    // Stars
    this.stars.forEach(star => {
      star.alpha += star.twinkleSpeed;
      if (star.alpha > 0.9 || star.alpha < 0.2) star.twinkleSpeed *= -1;
      this.bgCtx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      this.bgCtx.beginPath();
      this.bgCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.bgCtx.fill();
    });

    // Aurora Waves
    this.auroraPhase += 0.008;
    const waveCount = 3;

    for (let w = 0; w < waveCount; w++) {
      const grad = this.bgCtx.createLinearGradient(0, 0, this.width, this.height * 0.6);
      if (w === 0) {
        grad.addColorStop(0, 'rgba(87, 197, 247, 0.12)');
        grad.addColorStop(0.5, 'rgba(34, 197, 94, 0.08)');
        grad.addColorStop(1, 'transparent');
      } else {
        grad.addColorStop(0, 'rgba(230, 184, 76, 0.06)');
        grad.addColorStop(0.5, 'rgba(87, 197, 247, 0.09)');
        grad.addColorStop(1, 'transparent');
      }

      this.bgCtx.fillStyle = grad;
      this.bgCtx.beginPath();
      this.bgCtx.moveTo(0, 0);

      for (let x = 0; x <= this.width; x += 30) {
        const y = Math.sin(x * 0.003 + this.auroraPhase + w) * 45 + Math.cos(x * 0.002 - this.auroraPhase) * 25 + 180 + (w * 40);
        this.bgCtx.lineTo(x, y);
      }

      this.bgCtx.lineTo(this.width, 0);
      this.bgCtx.closePath();
      this.bgCtx.fill();
    }
  }

  drawEmbers() {
    this.emberCtx.clearRect(0, 0, this.width, this.height);

    this.embers.forEach((e, idx) => {
      e.y -= e.speedY;
      e.x += Math.sin(e.y * 0.01) * e.speedX;

      if (e.y < -10) {
        this.embers[idx] = this.createEmber();
      }

      this.emberCtx.fillStyle = e.color;
      this.emberCtx.globalAlpha = e.opacity;
      this.emberCtx.beginPath();
      this.emberCtx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      this.emberCtx.fill();
    });
    this.emberCtx.globalAlpha = 1;
  }

  drawLightning() {
    this.lightningCtx.clearRect(0, 0, this.width, this.height);

    if (this.lightningAlpha > 0.01) {
      this.lightningCtx.fillStyle = `rgba(220, 240, 255, ${this.lightningAlpha})`;
      this.lightningCtx.fillRect(0, 0, this.width, this.height);

      // Draw lightning bolt
      this.lightningCtx.strokeStyle = `rgba(255, 255, 255, ${this.lightningAlpha})`;
      this.lightningCtx.lineWidth = 3;
      this.lightningCtx.beginPath();
      let currX = this.width * 0.5 + (Math.random() - 0.5) * 200;
      let currY = 0;
      this.lightningCtx.moveTo(currX, currY);

      while (currY < this.height * 0.7) {
        currX += (Math.random() - 0.5) * 60;
        currY += Math.random() * 40 + 10;
        this.lightningCtx.lineTo(currX, currY);
      }
      this.lightningCtx.stroke();

      this.lightningAlpha *= 0.88;
    }
  }

  animate() {
    this.drawAurora();
    this.drawEmbers();
    this.drawLightning();
    requestAnimationFrame(() => this.animate());
  }
}
