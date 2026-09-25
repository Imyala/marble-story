import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Prop } from './props';
import { makeCyl, type Solid } from '../world/collision';
import { matUnique } from '../render/materials';

/**
 * Ice breath freezes any open water it touches into floes you can stand on,
 * so a dragon who knows Ice can walk across lakes, one breath at a time.
 * Floes last a while, blink, and melt; the oldest melts first if too many.
 */

interface Floe {
  x: number;
  z: number;
  t: number;
  solid: Solid;
  mesh: THREE.Mesh;
}

const LIFE = 9;
const MAX = 28;
const R = 1.45;

export class WaterIce implements Prop {
  private floes: Floe[] = [];
  private geo = new THREE.CylinderGeometry(R, R * 0.92, 0.42, 7, 1);
  private mat = matUnique(0xd8f4ff, { rough: 0.12, metal: 0.1, flat: true, transparent: true, opacity: 0.9, emissive: 0x3aa0d0, emissiveIntensity: 0.22 });

  constructor(private game: Game) {}

  /** True where (x, z) is open water deep enough to freeze over. */
  canFreeze(x: number, z: number): boolean {
    const g = this.game;
    if (g.waterLevel < -1e3) return false;
    return g.col.terrainAt(x, z) < g.waterLevel - 0.25 && g.col.groundAt(x, z, g.waterLevel + 0.2, 0.05).y < g.waterLevel - 0.25;
  }

  /** Freezes a floe at (x, z), or keeps a nearby one from melting. Returns true if a new floe formed. */
  freeze(x: number, z: number): boolean {
    const g = this.game;
    if (!this.canFreeze(x, z)) return false;
    for (const f of this.floes) {
      if (Math.hypot(f.x - x, f.z - z) < R * 1.1) {
        f.t = LIFE;
        f.mesh.visible = true;
        return false;
      }
    }
    if (this.floes.length >= MAX) this.melt(this.floes.reduce((a, b) => (a.t < b.t ? a : b)));
    const wl = g.waterLevel;
    const solid = makeCyl(x, z, R, wl - 0.7, wl + 0.14);
    solid.surface = 'ice';
    solid.unsafe = true;
    g.col.add(solid);
    const mesh = new THREE.Mesh(this.geo, this.mat);
    mesh.position.set(x, wl - 0.06, z);
    mesh.rotation.y = Math.random() * Math.PI;
    mesh.receiveShadow = true;
    g.level!.root.add(mesh);
    this.floes.push({ x, z, t: LIFE, solid, mesh });
    g.fx.sparkle(x, wl + 0.3, z, 0xdff8ff, 6);
    g.sfx('iceCrack', x, wl, z, 1.3 + Math.random() * 0.3, 0.45);
    return true;
  }

  /** Freezes the nearest open water along a line: the edge of the path grows as the dragon walks it. */
  freezeAlong(ox: number, oz: number, dx: number, dz: number, maxD: number): void {
    const n = Math.hypot(dx, dz) || 1;
    for (let d = 1.6; d <= maxD; d += R * 1.3) {
      const x = ox + (dx / n) * d;
      const z = oz + (dz / n) * d;
      if (!this.canFreeze(x, z)) continue;
      if (this.freeze(x, z)) return;
    }
  }

  private melt(f: Floe): void {
    const g = this.game;
    g.col.remove(f.solid);
    g.level?.root.remove(f.mesh);
    g.fx.splash(f.x, g.waterLevel, f.z);
    this.floes = this.floes.filter((q) => q !== f);
  }

  update(dt: number): void {
    for (const f of [...this.floes]) {
      f.t -= dt;
      // Blink before melting so nobody is caught out.
      f.mesh.visible = f.t > 2 || Math.sin(f.t * 16) > -0.3;
      f.mesh.scale.setScalar(f.t < 1 ? 0.6 + f.t * 0.4 : 1);
      if (f.t <= 0) this.melt(f);
    }
  }
}
