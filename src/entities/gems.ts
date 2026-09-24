import * as THREE from 'three';
import type { Game } from '../game/game';
import { rng } from '../core/rng';

export type GemKind = 'blue' | 'red' | 'green' | 'purple';

export const GEM_COLORS: Record<GemKind, number> = {
  blue: 0x4aa8ff,
  red: 0xff4a5a,
  green: 0x4ae07a,
  purple: 0xc070ff,
};

const geom = new THREE.OctahedronGeometry(0.22, 0);
geom.scale(1, 1.4, 1);
const mats: Partial<Record<GemKind, THREE.MeshStandardMaterial>> = {};
function gemMat(k: GemKind): THREE.MeshStandardMaterial {
  let m = mats[k];
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: GEM_COLORS[k], emissive: GEM_COLORS[k], emissiveIntensity: 0.9, roughness: 0.15, metalness: 0.3, flatShading: true });
    mats[k] = m;
  }
  return m;
}

/**
 * A gem on the ground. Pops out of whatever dropped it, bounces, then flies
 * to the dragon once it is in range. Enemy drops come to you on their own
 * after a moment, because chasing gems across a battlefield is not fun.
 */
export class Gem {
  readonly kind: GemKind;
  readonly value: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age = 0;
  alive = true;
  readonly mesh: THREE.Mesh;
  private homing = false;
  private autoCollect: boolean;
  private game: Game;
  private settled = false;

  constructor(game: Game, kind: GemKind, value: number, x: number, y: number, z: number, burst: number, autoCollect: boolean) {
    this.game = game;
    this.kind = kind;
    this.value = value;
    this.x = x;
    this.y = y;
    this.z = z;
    const a = rng.next() * Math.PI * 2;
    const s = burst * (0.4 + rng.next() * 0.6);
    this.vx = Math.sin(a) * s;
    this.vz = Math.cos(a) * s;
    this.vy = 4 + rng.next() * 4;
    this.autoCollect = autoCollect;
    this.mesh = new THREE.Mesh(geom, gemMat(kind));
    const sc = value >= 10 ? 1.7 : value >= 5 ? 1.35 : 1;
    this.mesh.scale.setScalar(sc);
    this.mesh.position.set(x, y, z);
    game.scene.add(this.mesh);
  }

  update(dt: number): void {
    const g = this.game;
    this.age += dt;
    const p = g.player;
    const pb = p.body;
    const tx = pb.x;
    const ty = pb.y + 0.7;
    const tz = pb.z;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dz = tz - this.z;
    const d = Math.hypot(dx, dy, dz);
    if (!this.homing && this.age > 0.45 && p.alive) {
      if (d < p.magnetRadius || (this.autoCollect && this.age > 1.1)) this.homing = true;
    }
    if (this.homing) {
      const sp = 10 + this.age * 12;
      const k = Math.min(1, dt * 12);
      this.vx += ((dx / d) * sp - this.vx) * k;
      this.vy += ((dy / d) * sp - this.vy) * k;
      this.vz += ((dz / d) * sp - this.vz) * k;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.z += this.vz * dt;
      if (d < 0.7) {
        this.collect();
        return;
      }
    } else if (!this.settled) {
      this.vy -= 22 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.z += this.vz * dt;
      const gy = g.col.groundAt(this.x, this.z, this.y + 0.5, 0.05).y + 0.35;
      if (this.y < gy) {
        this.y = gy;
        if (Math.abs(this.vy) < 2) {
          this.settled = true;
          this.vx = this.vy = this.vz = 0;
        } else {
          this.vy = -this.vy * 0.4;
          this.vx *= 0.6;
          this.vz *= 0.6;
        }
      }
      if (this.y < g.killY) this.kill();
    }
    this.mesh.position.set(this.x, this.y + (this.settled ? Math.sin(this.age * 3 + this.x) * 0.08 : 0), this.z);
    this.mesh.rotation.y += dt * 3;
    if (this.age > 60 && !this.homing) this.kill();
  }

  private collect(): void {
    this.game.collectGem(this.kind, this.value, this.x, this.y, this.z);
    this.kill();
  }

  kill(): void {
    if (!this.alive) return;
    this.alive = false;
    this.game.scene.remove(this.mesh);
  }
}

/** Splits a total into a few gem sizes so a big payout is not 80 meshes. */
export function splitValue(total: number): number[] {
  const out: number[] = [];
  let left = Math.round(total);
  while (left >= 10 && out.length < 6) {
    out.push(10);
    left -= 10;
  }
  while (left >= 5) {
    out.push(5);
    left -= 5;
  }
  while (left > 0) {
    out.push(1);
    left -= 1;
  }
  return out;
}
