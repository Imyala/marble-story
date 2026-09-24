import type { Game } from '../game/game';
import type { Builder } from '../world/level';
import type { Prop } from '../entities/props';
import { rng } from '../core/rng';
import { lerp } from '../core/math';
import * as THREE from 'three';

/** Floating motes around the player: fireflies, snow, embers, pollen. */
export class Ambient implements Prop {
  private t = 0;
  constructor(private game: Game, private kind: 'firefly' | 'snow' | 'ember' | 'pollen' | 'shadow', private rate = 20) {}
  update(dt: number): void {
    this.t += dt * this.rate;
    const g = this.game;
    const p = g.player;
    while (this.t >= 1) {
      this.t -= 1;
      const a = rng.next() * Math.PI * 2;
      const r = 4 + rng.next() * 22;
      const x = p.x + Math.sin(a) * r;
      const z = p.z + Math.cos(a) * r;
      const gy = g.col.terrainAt(x, z);
      const base = Math.max(gy > -1e3 ? gy : p.y, g.waterLevel > -1e3 ? g.waterLevel : -1e9);
      switch (this.kind) {
        case 'firefly':
          g.fx.emit(x, base + 0.5 + rng.next() * 3, z, { count: 1, speed: 0.4, life: [2, 4], size: [0.1, 0.16], sizeEnd: 0.5, color: rng.chance(0.5) ? 0xf0ff80 : 0xa0ff90, bright: 2.2, drag: 0.3, gravity: -0.05 });
          break;
        case 'snow':
          g.fx.emit(x, p.y + 8 + rng.next() * 4, z, { count: 1, speed: 0.6, dir: [0.3, -1, 0.1], spread: 0.4, life: [4, 6], size: [0.08, 0.14], sizeEnd: 1, color: 0xffffff, alpha: 0.9, additive: false, drag: 0.2 });
          break;
        case 'ember':
          g.fx.emit(x, base + rng.next() * 2, z, { count: 1, speed: 0.8, dir: [0, 1, 0], spread: 0.5, life: [2, 3.5], size: [0.06, 0.12], sizeEnd: 0.2, color: 0xff9040, bright: 2, gravity: -0.3 });
          break;
        case 'pollen':
          g.fx.emit(x, base + 0.5 + rng.next() * 4, z, { count: 1, speed: 0.4, dir: [1, 0.1, 0.3], spread: 0.5, life: [3, 5], size: [0.06, 0.1], sizeEnd: 1, color: 0xfff0b0, bright: 1.2, drag: 0.2 });
          break;
        case 'shadow':
          g.fx.emit(x, base + rng.next() * 2, z, { count: 1, speed: 0.5, dir: [0, 1, 0], spread: 0.4, life: [2, 4], size: [0.15, 0.3], sizeEnd: 0.1, color: 0xb04cff, bright: 1.4, gravity: -0.2 });
          break;
      }
    }
  }
}

export function ambient(b: Builder, kind: 'firefly' | 'snow' | 'ember' | 'pollen' | 'shadow', rate = 20): void {
  b.level.props.push(new Ambient(b.game, kind, rate));
}

/** Blends two hex colors. */
export function mix(a: number, b: number, t: number): number {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return ca.lerp(cb, Math.max(0, Math.min(1, t))).getHex();
}

/** Standard grass/rock/dirt terrain colorer with a per-level palette. */
export function paint(p: {
  under: number; shore: number; grass: number; grass2: number; rock: number; path: number; high?: number; highAt?: number; water?: number;
}) {
  return (x: number, z: number, h: number, slope: number, path: number): number => {
    const wl = p.water ?? 0;
    let c: number;
    if (h < wl - 0.3) c = p.under;
    else if (h < wl + 0.5) c = mix(p.under, p.shore, (h - (wl - 0.3)) / 0.8);
    else {
      const n = Math.sin(x * 0.31 + z * 0.17) * 0.5 + Math.sin(x * 0.07 - z * 0.13) * 0.5;
      c = mix(p.grass, p.grass2, n * 0.5 + 0.5);
      if (p.high !== undefined && p.highAt !== undefined) c = mix(c, p.high, (h - p.highAt) / 4);
    }
    if (slope > 0.6) c = mix(c, p.rock, (slope - 0.6) * 2.5);
    if (path > 0) c = mix(c, p.path, path * 0.85);
    void lerp;
    return c;
  };
}

/** Deterministic pseudo-random helper for level scattering. */
export function jitter(i: number, s = 1): number {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return (v - Math.floor(v)) * 2 - 1;
}
