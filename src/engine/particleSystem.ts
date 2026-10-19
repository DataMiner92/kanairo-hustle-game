export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
}

export interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

export class ParticleSystem {
  public floatingTexts: FloatingText[] = [];
  public smokeParticles: SmokeParticle[] = [];

  public addFloatingText(text: string, x: number, y: number, color: string = '#00e676') {
    this.floatingTexts.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      life: 1.5,
      maxLife: 1.5,
      vy: -35,
    });
  }

  public addSmoke(x: number, y: number, vx: number = 0, vy: number = 0, color: string = 'rgba(160, 160, 160, 0.6)') {
    if (this.smokeParticles.length > 100) return;
    this.smokeParticles.push({
      x,
      y,
      vx: vx + (Math.random() - 0.5) * 15,
      vy: vy + (Math.random() - 0.5) * 15,
      radius: 4 + Math.random() * 4,
      alpha: 0.7,
      life: 0.8 + Math.random() * 0.4,
      maxLife: 1.2,
      color,
    });
  }

  public update(dt: number) {
    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update smoke particles
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const sp = this.smokeParticles[i];
      sp.life -= dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.radius += dt * 6;
      sp.alpha = Math.max(0, (sp.life / sp.maxLife) * 0.7);
      if (sp.life <= 0) {
        this.smokeParticles.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Render smoke particles
    for (const sp of this.smokeParticles) {
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(140, 140, 140, ${sp.alpha})`;
      ctx.fill();
    }

    // Render floating texts
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px monospace, sans-serif';
    for (const ft of this.floatingTexts) {
      const alpha = Math.min(1.0, ft.life / 0.4);
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
      ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = alpha;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.globalAlpha = 1.0;
    }
  }
}

export const particleSystem = new ParticleSystem();
