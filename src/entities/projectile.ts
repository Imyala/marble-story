import * as THREE from 'three';
import type { Game } from '../game/game';
import type { DamageType, Hittable } from '../game/types';
import { makeHit } from '../game/types';
import { glow, mat } from '../render/materials';
import { unitSphere } from '../render/shapes';
import { rng } from '../core/rng';

export type ProjectileKind = 'orb' | 'fireball' | 'shard' | 'boulder' | 'stormOrb' | 'bolt';

export interface ProjectileSpec {
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  dz: number;
  speed: number;
  radius: number;
  damage: number;
  type: DamageType;
  color: number;
  life: number;
  gravity: number;
  fromPlayer: boolean;
  kind?: ProjectileKind;
  homing?: number;
  /** Explodes on impact with this radius. */
  explode?: number;
  buildup?: number;
  knockback?: number;
  launch?: number;
  stagger?: number;
  heavy?: boolean;
  pierce?: boolean;
  move?: string;
  /** Periodic zaps around the projectile (Storm Orb). */
  zap?: { radius: number; interval: number; damage: number; buildup: number; chains: number };
  /** Leaves a burning patch where it explodes. */
  burnGround?: boolean;
  /** Splits into this many smaller copies on impact. */
  split?: number;
}

const geoCache: Partial<Record<ProjectileKind, THREE.BufferGeometry>> = {};
function geo(kind: ProjectileKind): THREE.BufferGeometry {
  let g = geoCache[kind];
  if (!g) {
    switch (kind) {
      case 'shard':
        g = new THREE.OctahedronGeometry(1, 0);
        g.scale(0.35, 0.35, 1.4);
        break;
      case 'boulder':
        g = new THREE.DodecahedronGeometry(1, 0);
        break;
      default:
        g = unitSphere(12);
    }
    geoCache[kind] = g;
  }
  return g;
}

const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();

export class Projectile {
  readonly spec: ProjectileSpec;
  readonly mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age = 0;
  alive = true;
  private hitSet = new Set<Hittable>();
  private zapT = 0;
  private game: Game;
  private halo: THREE.Mesh | null = null;
  reflected = false;

  constructor(game: Game, s: ProjectileSpec) {
    this.game = game;
    this.spec = s;
    this.x = s.x;
    this.y = s.y;
    this.z = s.z;
    const n = Math.hypot(s.dx, s.dy, s.dz) || 1;
    this.vx = (s.dx / n) * s.speed;
    this.vy = (s.dy / n) * s.speed;
    this.vz = (s.dz / n) * s.speed;
    const kind = s.kind ?? 'orb';
    const m = kind === 'boulder'
      ? mat(0x7a6a50, { rough: 0.9, flat: true })
      : kind === 'shard'
        ? mat(0xcff6ff, { rough: 0.1, emissive: 0x4ab8e8, emissiveIntensity: 0.6 })
        : glow(s.color, 1, true);
    this.mesh = new THREE.Mesh(geo(kind), m);
    this.mesh.scale.setScalar(kind === 'shard' ? s.radius * 0.7 : s.radius);
    if (kind === 'boulder') this.mesh.castShadow = true;
    if (kind !== 'boulder' && kind !== 'shard') {
      this.halo = new THREE.Mesh(unitSphere(10), glow(s.color, 0.35, true));
      this.halo.scale.setScalar(2);
      this.mesh.add(this.halo);
    }
    this.mesh.position.set(this.x, this.y, this.z);
    game.scene.add(this.mesh);
  }

  update(dt: number): void {
    const s = this.spec;
    const g = this.game;
    this.age += dt;
    if (this.age > s.life) {
      this.expire();
      return;
    }
    // Homing toward the player or the nearest enemy.
    if (s.homing) {
      let tx: number | null = null;
      let ty = 0;
      let tz = 0;
      if (!s.fromPlayer) {
        const p = g.player.body;
        tx = p.x;
        ty = p.y + 0.8;
        tz = p.z;
      } else if (this.homeOn) {
        tx = this.homeOn.x;
        ty = this.homeOn.y;
        tz = this.homeOn.z;
      } else {
        const e = g.nearestEnemy(this.x, this.y, this.z, 12);
        if (e) {
          tx = e.x;
          ty = e.y + e.height * 0.5;
          tz = e.z;
        }
      }
      if (tx !== null && this.age > 0.15) {
        v1.set(tx - this.x, ty - this.y, tz - this.z).normalize();
        v2.set(this.vx, this.vy, this.vz);
        const sp = v2.length();
        v2.normalize().lerp(v1, Math.min(1, s.homing * dt)).normalize().multiplyScalar(sp);
        this.vx = v2.x;
        this.vy = v2.y;
        this.vz = v2.z;
      }
    }
    this.vy -= s.gravity * dt;
    const px = this.x;
    const py = this.y;
    const pz = this.z;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.z += this.vz * dt;

    // World collision along the step.
    const dx = this.x - px;
    const dy = this.y - py;
    const dz = this.z - pz;
    const len = Math.hypot(dx, dy, dz);
    if (len > 1e-6) {
      const hit = g.col.raycast(px, py, pz, dx / len, dy / len, dz / len, len, false);
      if (hit.t < len) {
        this.x = px + (dx / len) * hit.t;
        this.y = py + (dy / len) * hit.t;
        this.z = pz + (dz / len) * hit.t;
        // A target right against the wall still takes the hit.
        if (s.fromPlayer || this.reflected) {
          for (const h of g.hittables()) {
            if (h.alive && !this.hitSet.has(h) && this.overlaps(h)) {
              this.impact(h);
              return;
            }
          }
        }
        this.impact(null);
        return;
      }
    }
    if (g.waterLevel > -1e3 && this.y < g.waterLevel) {
      g.fx.splash(this.x, g.waterLevel, this.z);
      this.impact(null);
      return;
    }

    // Targets.
    if (s.fromPlayer || this.reflected) {
      for (const h of g.hittables()) {
        if (!h.alive || this.hitSet.has(h)) continue;
        if (this.overlaps(h)) {
          if (s.pierce) {
            this.hitSet.add(h);
            this.applyHit(h);
          } else {
            this.impact(h);
            return;
          }
        }
      }
    } else {
      const p = g.player;
      const b = p.body;
      if (p.alive) {
        const cy = b.y + b.height * 0.5;
        const d = Math.hypot(this.x - b.x, (this.y - cy) * 0.8, this.z - b.z);
        if (d < s.radius + b.radius + 0.1) {
          const n = Math.hypot(this.vx, this.vz) || 1;
          const r = p.takeHit(makeHit({
            damage: s.damage * g.difficultyInfo.enemyDamage, type: s.type, dirX: this.vx / n, dirZ: this.vz / n,
            knockback: s.knockback ?? 4, launch: s.launch ?? 0, source: 'enemy', move: 'projectile', fromPlayer: false, ox: this.x, oz: this.z,
          }), null);
          if (r !== 'dodged') {
            this.impact(null);
            return;
          }
        }
      }
    }

    if (s.zap) {
      this.zapT -= dt;
      if (this.zapT <= 0) {
        this.zapT = s.zap.interval;
        this.doZap();
      }
    }

    this.mesh.position.set(this.x, this.y, this.z);
    const kind = s.kind ?? 'orb';
    if (kind === 'shard' || kind === 'bolt') this.mesh.lookAt(this.x + this.vx, this.y + this.vy, this.z + this.vz);
    if (kind === 'boulder') {
      this.mesh.rotation.x += dt * 8;
      this.mesh.rotation.z += dt * 5;
    }
    if (this.halo) this.halo.scale.setScalar(2 + Math.sin(this.age * 30) * 0.25);
    this.trail();
  }

  private overlaps(h: Hittable): boolean {
    const cy = h.y + h.height * 0.5;
    const dy = Math.max(0, Math.abs(this.y - cy) - h.height * 0.5);
    const d = Math.hypot(this.x - h.x, dy, this.z - h.z);
    return d < this.spec.radius + h.radius;
  }

  private trail(): void {
    const s = this.spec;
    const fx = this.game.fx;
    const kind = s.kind ?? 'orb';
    if (kind === 'fireball') {
      fx.emit(this.x, this.y, this.z, { count: 3, speed: 1, life: [0.2, 0.4], size: [s.radius * 1.4, s.radius * 2], sizeEnd: 0.2, color: 0xffb040, colorEnd: 0xff2000, bright: 1.8, jitter: s.radius * 0.4 });
      if (rng.chance(0.3)) fx.smoke(this.x, this.y, this.z, 1);
    } else if (kind === 'shard') {
      if (rng.chance(0.5)) fx.emit(this.x, this.y, this.z, { count: 1, speed: 0.3, life: [0.2, 0.3], size: [0.15, 0.25], color: 0xcff6ff, bright: 1.2 });
    } else if (kind === 'boulder') {
      if (rng.chance(0.4)) fx.emit(this.x, this.y, this.z, { count: 1, speed: 0.5, life: [0.3, 0.5], size: [0.3, 0.5], sizeEnd: 1.5, color: 0xa89878, alpha: 0.4, additive: false });
    } else {
      fx.emit(this.x, this.y, this.z, { count: 1, speed: 0.4, life: [0.2, 0.35], size: [s.radius * 1.2, s.radius * 1.6], sizeEnd: 0.1, color: s.color, bright: 1.6 });
    }
  }

  private doZap(): void {
    const s = this.spec;
    const z = s.zap!;
    const g = this.game;
    let chains = z.chains;
    const from = new THREE.Vector3(this.x, this.y, this.z);
    for (const h of g.hittables()) {
      if (!h.alive || !h.isEnemy || chains <= 0) continue;
      const d = Math.hypot(h.x - this.x, h.y + h.height * 0.5 - this.y, h.z - this.z);
      if (d > z.radius) continue;
      chains--;
      const to = new THREE.Vector3(h.x, h.y + h.height * 0.5, h.z);
      g.fx.arc(from, to, 0xbfe8ff, 0.1, 0.12, 0.35);
      const dx = h.x - this.x;
      const dz = h.z - this.z;
      const n = Math.hypot(dx, dz) || 1;
      h.takeHit(makeHit({
        damage: z.damage, type: 'lightning', buildup: z.buildup, dirX: dx / n, dirZ: dz / n, knockback: 0.5,
        stagger: 6, source: 'burst', move: 'stormOrb', ox: this.x, oz: this.z,
      }));
      g.sfx('zap', this.x, this.y, this.z, 1.2, 0.5);
    }
  }

  private applyHit(h: Hittable): void {
    const s = this.spec;
    const n = Math.hypot(this.vx, this.vz) || 1;
    h.takeHit(makeHit({
      damage: s.damage, type: s.type, dirX: this.vx / n, dirZ: this.vz / n, knockback: s.knockback ?? 3,
      launch: s.launch ?? 0, stagger: s.stagger ?? 10, buildup: s.buildup ?? 0, heavy: s.heavy ?? false,
      source: 'burst', move: s.move ?? 'projectile', ox: this.x - this.vx * 0.1, oz: this.z - this.vz * 0.1, hitstop: 0.02,
    }));
  }

  private impact(target: Hittable | null): void {
    const s = this.spec;
    const g = this.game;
    if (target && !s.explode) this.applyHit(target);
    if (s.explode) {
      g.explode(this.x, this.y, this.z, s.explode, s.damage, s.type, s.fromPlayer || this.reflected, {
        buildup: s.buildup ?? 0, knockback: s.knockback ?? 8, launch: s.launch ?? 4, stagger: s.stagger ?? 30, heavy: s.heavy ?? false,
        move: s.move ?? 'explosion', color: s.color, burnGround: s.burnGround ?? false,
      });
      if (s.split && s.split > 0) {
        for (let i = 0; i < s.split; i++) {
          const a = (i / s.split) * Math.PI * 2 + rng.next();
          g.spawnProjectile({
            ...s, x: this.x, y: this.y + 0.5, z: this.z, dx: Math.sin(a), dy: 1.2, dz: Math.cos(a), speed: 8,
            radius: s.radius * 0.6, damage: s.damage * 0.5, explode: s.explode * 0.7, split: 0, life: 1.5,
          });
        }
      }
    } else {
      const kind = s.kind ?? 'orb';
      if (kind === 'shard') g.fx.sparkle(this.x, this.y, this.z, 0xcff6ff, 5);
      else g.fx.hit(this.x, this.y, this.z, s.color, 0.6);
    }
    this.kill();
  }

  private expire(): void {
    if (this.spec.explode && this.spec.fromPlayer) {
      this.impact(null);
      return;
    }
    this.game.fx.sparkle(this.x, this.y, this.z, this.spec.color, 4);
    this.kill();
  }

  /**
   * Reverses an enemy projectile back at its sender (hit it with the horn).
   * With a `target`, it homes on that point instead of the nearest enemy.
   */
  reflect(dirX: number, dirZ: number, target: { x: number; y: number; z: number } | null = null): void {
    const sp = Math.hypot(this.vx, this.vy, this.vz) * 1.4;
    this.vx = dirX * sp;
    this.vz = dirZ * sp;
    this.vy = 0;
    if (target) {
      const d = Math.hypot(target.x - this.x, target.y - this.y, target.z - this.z) || 1;
      this.vx = ((target.x - this.x) / d) * sp;
      this.vy = ((target.y - this.y) / d) * sp;
      this.vz = ((target.z - this.z) / d) * sp;
    }
    this.homeOn = target;
    this.reflected = true;
    this.age = 0;
    this.spec.damage *= 2;
    this.spec.homing = 3;
    this.spec.fromPlayer = true;
    this.spec.move = 'reflected';
  }

  private homeOn: { x: number; y: number; z: number } | null = null;

  kill(): void {
    if (!this.alive) return;
    this.alive = false;
    this.game.scene.remove(this.mesh);
  }
}

/** An expanding ring on the ground. Jump over it. */
export class Shockwave {
  x: number;
  y: number;
  z: number;
  r = 0.5;
  readonly maxR: number;
  readonly speed: number;
  readonly damage: number;
  readonly knockback: number;
  alive = true;
  private hitPlayer = false;
  private game: Game;
  private mesh: THREE.Mesh;
  private matR: THREE.MeshBasicMaterial;

  constructor(game: Game, x: number, y: number, z: number, maxR: number, speed: number, damage: number, knockback: number) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.z = z;
    this.maxR = maxR;
    this.speed = speed;
    this.damage = damage;
    this.knockback = knockback;
    this.matR = new THREE.MeshBasicMaterial({ color: 0xff6040, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const g = new THREE.CylinderGeometry(1, 1, 0.6, 40, 1, true);
    this.mesh = new THREE.Mesh(g, this.matR);
    this.mesh.position.set(x, y + 0.3, z);
    game.scene.add(this.mesh);
  }

  update(dt: number): void {
    this.r += this.speed * dt;
    const k = this.r / this.maxR;
    this.mesh.scale.set(this.r, 1 - k * 0.5, this.r);
    this.matR.opacity = 0.9 * (1 - k);
    if (!this.hitPlayer) {
      const p = this.game.player;
      const b = p.body;
      const d = Math.hypot(b.x - this.x, b.z - this.z);
      if (Math.abs(d - this.r) < 0.7 && b.y < this.y + 0.55 && b.y > this.y - 1.5 && p.alive) {
        this.hitPlayer = true;
        const n = d || 1;
        p.takeHit(makeHit({
          damage: this.damage, dirX: (b.x - this.x) / n, dirZ: (b.z - this.z) / n, knockback: this.knockback, launch: 5,
          source: 'enemy', move: 'shockwave', fromPlayer: false, ox: this.x, oz: this.z,
        }), null);
      }
    }
    if (k >= 1) this.kill();
  }

  kill(): void {
    if (!this.alive) return;
    this.alive = false;
    this.game.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.matR.dispose();
  }
}
