// Lantern Row: the little bursts of light on a find — sparkles that rise and
// fade over both panels, plus a soft ring that blooms out from the found spot.
export class Particles {
  constructor() {
    this.list = [];
  }

  burst(x, y, color, n) {
    for (let i = 0; i < n; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 90;
      this.list.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 30,
        life: 0.7 + Math.random() * 0.4,
        age: 0,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  ring(x, y, color) {
    this.list.push({ ring: true, x, y, age: 0, life: 0.6, size: 10, color });
  }

  step(dt) {
    for (const p of this.list) {
      p.age += dt;
      if (!p.ring) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 60 * dt;
      }
    }
    this.list = this.list.filter((p) => p.age < p.life);
  }

  draw(ctx) {
    for (const p of this.list) {
      const k = 1 - p.age / p.life;
      if (p.ring) {
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = k * 0.9;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + (p.age / p.life) * 34, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        continue;
      }
      ctx.fillStyle = p.color;
      ctx.globalAlpha = k;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * k + 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
