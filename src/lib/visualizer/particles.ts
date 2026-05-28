type Particle = { x: number; y: number; vx: number; vy: number; size: number; hue: number; life: number };

export class ParticleField {
  private particles: Particle[] = [];

  constructor(
    private count: number,
    private seed: number,
  ) {}

  private rand(i: number): number {
    const x = Math.sin(this.seed * 12.9898 + i * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  reset(width: number, height: number): void {
    this.particles = [];
    for (let i = 0; i < this.count; i++) {
      this.particles.push({
        x: this.rand(i) * width,
        y: this.rand(i + 17) * height,
        vx: (this.rand(i + 31) - 0.5) * 0.6,
        vy: (this.rand(i + 53) - 0.5) * 0.6 - 0.25,
        size: 1.5 + this.rand(i + 71) * 4,
        hue: 260 + this.rand(i + 89) * 80,
        life: 0.4 + this.rand(i + 97) * 0.6,
      });
    }
  }

  update(dt: number, width: number, height: number, bass: number): void {
    if (!this.particles.length) this.reset(width, height);
    const boost = 0.6 + bass * 2.2;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx * boost * dt * 60;
      p.y += p.vy * boost * dt * 60;
      p.life += dt * (0.15 + bass * 0.4);
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;
    }
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number, bass: number): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.particles) {
      const alpha = 0.25 + bass * 0.45 + Math.sin(p.life * 4) * 0.08;
      const r = p.size * (1 + bass * 1.2);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.2);
      g.addColorStop(0, `hsla(${p.hue}, 90%, 72%, ${alpha})`);
      g.addColorStop(1, `hsla(${p.hue}, 90%, 52%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
