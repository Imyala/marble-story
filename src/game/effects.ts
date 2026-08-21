/**
 * Transient visual effects: damage numbers, hit sparks, projectiles, and
 * floating text.
 *
 * These carry no gameplay state — damage is already applied by the time an
 * effect exists. They live in their own pool so the world update stays
 * readable and so they can be culled aggressively.
 */
export type FloatKind = 'damage' | 'crit' | 'taken' | 'miss' | 'heal' | 'exp' | 'notice';

export interface FloatText {
  x: number;
  y: number;
  vy: number;
  vx: number;
  life: number;
  maxLife: number;
  text: string;
  kind: FloatKind;
  /** Stagger multi-hit numbers so they do not overlap. */
  delay: number;
}

export interface HitSpark {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  /** Bolts are drawn as a streak, orbs as a glowing dot. */
  style: 'bolt' | 'orb' | 'arrow' | 'star';
  angle: number;
}

export class EffectPool {
  floats: FloatText[] = [];
  sparks: HitSpark[] = [];
  projectiles: Projectile[] = [];

  damage(x: number, y: number, amount: number, kind: FloatKind, index = 0): void {
    this.floats.push({
      x: x + (index % 2 === 0 ? -1 : 1) * (6 + index * 3),
      y: y - index * 6,
      vx: (index % 2 === 0 ? -1 : 1) * 14,
      vy: -78,
      life: 0.85,
      maxLife: 0.85,
      text: kind === 'miss' ? 'MISS' : String(amount),
      kind,
      delay: index * 0.07,
    });
  }

  notice(x: number, y: number, text: string, kind: FloatKind = 'notice'): void {
    this.floats.push({
      x, y, vx: 0, vy: -42, life: 1.5, maxLife: 1.5, text, kind, delay: 0,
    });
  }

  spark(x: number, y: number, color = '#ffe9a8', size = 16): void {
    this.sparks.push({ x, y, life: 0.22, maxLife: 0.22, size, color });
  }

  shoot(
    x: number, y: number, targetX: number, targetY: number,
    style: Projectile['style'], color: string,
  ): void {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const speed = 1400;
    this.projectiles.push({
      x, y,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      life: Math.min(0.6, dist / speed),
      color,
      style,
      angle: Math.atan2(dy, dx),
    });
  }

  update(dt: number): void {
    for (const f of this.floats) {
      if (f.delay > 0) {
        f.delay -= dt;
        continue;
      }
      f.life -= dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      // Ease the rise so numbers pop up and settle rather than drifting away.
      f.vy += 150 * dt;
    }
    this.floats = this.floats.filter((f) => f.life > 0);

    for (const s of this.sparks) s.life -= dt;
    this.sparks = this.sparks.filter((s) => s.life > 0);

    for (const p of this.projectiles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.projectiles = this.projectiles.filter((p) => p.life > 0);
  }

  clear(): void {
    this.floats.length = 0;
    this.sparks.length = 0;
    this.projectiles.length = 0;
  }
}
