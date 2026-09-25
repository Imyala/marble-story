import * as THREE from 'three';
import type { SkyDef } from './sky';

/**
 * Distant scenery: rings of mountain, cliff and mesa silhouettes on the
 * horizon, so every realm sits in a wider world instead of an empty sea.
 * One merged, unlit, vertex-colored mesh (a single draw call). Each ring
 * fades into the horizon haze with distance and follows the camera a little
 * less than fully, so walking gives a hint of parallax.
 */

export interface BackdropLayer {
  /** Distance from the camera. */
  r: number;
  /** Silhouette height range above the base. */
  min: number;
  max: number;
  /** Peak color before haze. */
  color: number;
  /** 0 = rolling hills, 1 = sharp crags. */
  jag: number;
  /** Clip the tops flat (mesas), as a fraction of max height. */
  plateau?: number;
  /** Snow caps above this fraction of max height. */
  snow?: number;
  /** How much of the horizon haze covers it, 0..1. */
  haze: number;
  /** Tall needles scattered along the ring (spires, towers). */
  spires?: number;
  /** A tree line of rounded canopy bumps, as a fraction of the height range. */
  trees?: number;
  seed: number;
}

export type BackdropDef = BackdropLayer[];

export const BACKDROPS: Record<string, BackdropDef> = {
  fen: [
    { r: 640, min: 22, max: 70, color: 0x4a3a5a, jag: 0.35, haze: 0.62, seed: 1 },
    { r: 470, min: 8, max: 34, color: 0x1e2a26, jag: 0.1, haze: 0.3, trees: 0.35, seed: 2 },
  ],
  sanctum: [
    { r: 680, min: 40, max: 130, color: 0x8a7c96, jag: 0.6, snow: 0.8, haze: 0.62, seed: 3 },
    { r: 500, min: 14, max: 55, color: 0x9a7a62, jag: 0.3, plateau: 0.75, haze: 0.42, seed: 4 },
  ],
  falls: [
    { r: 700, min: 60, max: 180, color: 0x5a7a90, jag: 0.75, snow: 0.82, haze: 0.6, seed: 5 },
    { r: 520, min: 30, max: 110, color: 0x3a5a5e, jag: 0.55, haze: 0.42, spires: 9, seed: 6 },
  ],
  frostworks: [
    { r: 700, min: 70, max: 200, color: 0x8090b0, jag: 0.8, snow: 0.45, haze: 0.5, seed: 7 },
    { r: 500, min: 25, max: 95, color: 0x6a7890, jag: 0.6, snow: 0.55, haze: 0.35, seed: 8 },
  ],
  plains: [
    { r: 700, min: 30, max: 95, color: 0xa87a78, jag: 0.4, haze: 0.62, seed: 9 },
    { r: 520, min: 10, max: 46, color: 0x9a6a50, jag: 0.25, plateau: 0.62, haze: 0.55, seed: 10 },
  ],
  keep: [
    { r: 700, min: 50, max: 170, color: 0x1a1030, jag: 0.9, haze: 0.45, spires: 12, seed: 11 },
    { r: 500, min: 20, max: 90, color: 0x120a22, jag: 0.8, haze: 0.25, spires: 6, seed: 12 },
  ],
};

const SEG = 512;
const DEPTH = 140;

function rand(seed: number): () => number {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s & 0xffffff) / 0x1000000;
  };
}

/** A periodic ridge profile in [0, 1] around the ring. */
function profile(L: BackdropLayer): (a: number) => number {
  const r = rand(L.seed);
  const octs = [3, 7, 13, 23, 41].map((n, i) => ({ n: n + Math.floor(r() * 3), ph: r() * Math.PI * 2, amp: Math.pow(0.55, i) }));
  const total = octs.reduce((s, o) => s + o.amp, 0);
  const sharp = 1 + L.jag * 2.2;
  const spikes = Array.from({ length: L.spires ?? 0 }, () => ({ a: r() * Math.PI * 2, w: 0.012 + r() * 0.02, h: 0.6 + r() * 0.5 }));
  return (a: number) => {
    let v = 0;
    for (const o of octs) {
      // Ridged for crags, smooth for hills; integer frequencies keep it seamless.
      const s = Math.abs(Math.sin((o.n * a) / 2 + o.ph));
      const ridged = Math.pow(1 - s, sharp);
      const smooth = 0.5 + 0.5 * Math.sin(o.n * a + o.ph);
      v += o.amp * (ridged * L.jag + smooth * (1 - L.jag));
    }
    v /= total;
    v = Math.min(1, Math.max(0, (v - 0.2) / 0.7));
    if (L.plateau) v = Math.min(v * 1.25, L.plateau) / L.plateau * 0.9;
    if (L.trees) {
      const t = Math.pow(Math.abs(Math.sin(a * 85)), 0.6) * 0.6 + Math.pow(Math.abs(Math.sin(a * 131 + 1.3)), 0.6) * 0.4;
      v = v * (1 - L.trees) + t * L.trees;
    }
    for (const s of spikes) {
      const d = Math.abs(Math.atan2(Math.sin(a - s.a), Math.cos(a - s.a)));
      if (d < s.w) v = Math.max(v, s.h * (1 - d / s.w) + v * (d / s.w));
    }
    return v;
  };
}

export class Backdrop {
  readonly mesh: THREE.Mesh;
  private baseY = 0;
  private geo = new THREE.BufferGeometry();

  constructor() {
    const m = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(this.geo, m);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -900;
    this.mesh.visible = false;
  }

  /** Rebuilds the silhouettes for a realm (or hides them when it has none). */
  apply(def: BackdropDef | undefined, sky: SkyDef, baseY: number): void {
    this.mesh.visible = !!def && def.length > 0;
    if (!def || def.length === 0) return;
    this.baseY = baseY;
    const hazeCol = new THREE.Color(sky.horizon).lerp(new THREE.Color(sky.fog ?? sky.horizon), 0.35);
    const sun = new THREE.Vector3(...sky.sunDir).setY(0).normalize();
    const pos: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    const snowCol = new THREE.Color(0xf4f8ff);
    const c = new THREE.Color();
    const rows = [0, 0.4, 0.75, 0.9, 1];
    // Draw far rings first so nearer ones cover them.
    const sorted = [...def].sort((a, b) => b.r - a.r);
    for (const L of sorted) {
      const h = profile(L);
      const peak = new THREE.Color(L.color);
      const start = pos.length / 3;
      for (let i = 0; i <= SEG; i++) {
        const a = (i / SEG) * Math.PI * 2;
        const x = Math.sin(a) * L.r;
        const z = Math.cos(a) * L.r;
        const k = h(a);
        const top = L.min + (L.max - L.min) * k;
        // Faces toward the sun catch a little light.
        const lit = Math.max(0, Math.sin(a) * sun.x + Math.cos(a) * sun.z) * 0.18;
        for (const f of rows) {
          const y = f === 0 ? -DEPTH : top * f;
          pos.push(x, y, z);
          c.copy(peak).multiplyScalar(0.85 + lit + f * 0.15);
          if (L.snow !== undefined && f >= 0.75 && k > L.snow) c.lerp(snowCol, Math.min(1, (k - L.snow) * 4) * (f >= 0.9 ? 0.85 : 0.45));
          // Thicker haze toward the base, like real distance.
          c.lerp(hazeCol, Math.min(1, L.haze + (1 - f) * (1 - L.haze) * 0.8));
          col.push(c.r, c.g, c.b);
        }
      }
      const R = rows.length;
      for (let i = 0; i < SEG; i++) {
        for (let j = 0; j < R - 1; j++) {
          const a = start + i * R + j;
          const b = a + R;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    this.geo.dispose();
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    this.geo.setIndex(idx);
    this.mesh.geometry = this.geo;
  }

  update(cam: THREE.Vector3): void {
    if (!this.mesh.visible) return;
    // Not quite locked to the camera, so walking gives a hint of parallax.
    this.mesh.position.set(cam.x * 0.94, this.baseY, cam.z * 0.94);
  }
}
