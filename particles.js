/**
 * Piano Kids - Particle & Visual Effects Engine (Ultra Otimizado)
 * Renderização leve por caminhos vetoriais, sem shadowBlur, com desligamento automático no descanso.
 */

class ParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d', { alpha: true });
    this.particles = [];
    this.maxParticles = 30; // Limite rigoroso para nunca travar
    this.enabled = true;
    this.isRunning = false;
    this.colors = ['#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#e056fd', '#ffe600', '#00f2fe'];

    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setEnabled(val) {
    this.enabled = val;
    if (!val) {
      this.particles = [];
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      this.isRunning = false;
    }
  }

  // Dispara apenas 4 a 5 partículas leves e rápidas por toque
  spawn(x, y, primaryColor = null) {
    if (!this.enabled || !this.ctx) return;

    // Se já tiver muitas partículas ativas, descarta as mais antigas para liberar CPU
    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }

    const count = 4; // Reduzido de 12 para 4 para ficar super leve e fluido
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
      const speed = Math.random() * 3 + 2;
      const type = Math.random() > 0.4 ? 'star' : 'circle';
      const color = primaryColor || this.colors[Math.floor(Math.random() * this.colors.length)];

      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.0, // Sobe suavemente
        alpha: 1.0,
        decay: 0.035, // Some rápido em menos de 1 segundo
        size: Math.random() * 8 + 8,
        color: color,
        type: type,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.08
      });
    }

    // Inicia o loop de animação apenas se estiver parado
    if (!this.isRunning) {
      this.isRunning = true;
      requestAnimationFrame(() => this.animate());
    }
  }

  // Desenha uma estrela vetorial super rápida (sem texto ou blur)
  drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }

  animate() {
    if (!this.enabled || !this.isRunning) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06; // Gravidade suave
      p.alpha -= p.decay;
      p.rotation += p.rotSpeed;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;

      if (p.type === 'star') {
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.drawStar(0, 0, 5, p.size, p.size * 0.45);
      } else {
        // Círculo / bolha leve
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    // Se acabaram as partículas, dorme o loop e economiza 100% da CPU!
    if (this.particles.length === 0) {
      this.isRunning = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    requestAnimationFrame(() => this.animate());
  }
}
