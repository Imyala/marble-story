import { HOLE } from './collision';
import { fbm, smoothstep, lerp } from '../core/math';

/**
 * Terrain is authored as a stack of features evaluated per vertex:
 * islands and paths raise ground, pits lower it, holes cut it away.
 * Paths also paint a mask the colorer uses for dirt trails.
 */

type Feature =
  | { k: 'island'; x: number; z: number; r: number; h: number; edge: number; noise: number; sx: number; sz: number }
  | { k: 'path'; pts: [number, number, number][]; w: number; edge: number; paint: boolean; raise: boolean }
  | { k: 'mound'; x: number; z: number; r: number; h: number }
  | { k: 'pit'; x: number; z: number; r: number; h: number; edge: number }
  | { k: 'hole'; x: number; z: number; r: number; sx: number; sz: number }
  | { k: 'flatten'; x: number; z: number; r: number; h: number; edge: number }
  | { k: 'ridge'; pts: [number, number][]; w: number; h: number };

export class Shaper {
  private baseH = 0;
  private noiseAmp = 0;
  private noiseScale = 0.05;
  private seed = 1;
  private features: Feature[] = [];
  private paths: { pts: [number, number, number][]; w: number }[] = [];
  voidBase = false;

  base(h: number): this {
    this.baseH = h;
    return this;
  }

  /** Makes everything outside islands and paths a void. */
  void(): this {
    this.voidBase = true;
    return this;
  }

  noise(amp: number, scale = 0.05, seed = 1): this {
    this.noiseAmp = amp;
    this.noiseScale = scale;
    this.seed = seed;
    return this;
  }

  /** A raised plateau of height h, radius r, soft edge `edge`. Optional ellipse scale. */
  island(x: number, z: number, r: number, h: number, edge = 3, noise = 0.3, sx = 1, sz = 1): this {
    this.features.push({ k: 'island', x, z, r, h, edge, noise, sx, sz });
    return this;
  }

  /** A walkable strip along points [x, z, y]. Raises ground to the path's height. */
  path(pts: [number, number, number][], w: number, edge = 2, paint = true, raise = true): this {
    this.features.push({ k: 'path', pts, w, edge, paint, raise });
    if (paint) this.paths.push({ pts, w });
    return this;
  }

  /** Paint-only trail on existing ground. */
  trail(pts: [number, number][], w: number): this {
    this.paths.push({ pts: pts.map(([x, z]) => [x, z, 0]), w });
    return this;
  }

  mound(x: number, z: number, r: number, h: number): this {
    this.features.push({ k: 'mound', x, z, r, h });
    return this;
  }

  pit(x: number, z: number, r: number, h: number, edge = 2): this {
    this.features.push({ k: 'pit', x, z, r, h, edge });
    return this;
  }

  hole(x: number, z: number, r: number, sx = 1, sz = 1): this {
    this.features.push({ k: 'hole', x, z, r, sx, sz });
    return this;
  }

  flatten(x: number, z: number, r: number, h: number, edge = 2): this {
    this.features.push({ k: 'flatten', x, z, r, h, edge });
    return this;
  }

  ridge(pts: [number, number][], w: number, h: number): this {
    this.features.push({ k: 'ridge', pts, w, h });
    return this;
  }

  height(x: number, z: number): number {
    let h = this.voidBase ? HOLE : this.baseH + (this.noiseAmp ? fbm(x * this.noiseScale, z * this.noiseScale, 4, this.seed) * this.noiseAmp : 0);
    for (const f of this.features) {
      switch (f.k) {
        case 'island': {
          const dx = (x - f.x) / f.sx;
          const dz = (z - f.z) / f.sz;
          let d = Math.hypot(dx, dz);
          if (f.noise) d += fbm(x * 0.15, z * 0.15, 2, 7) * f.noise * f.r * 0.25;
          if (d > f.r + f.edge) break;
          const top = f.h + (f.noise ? fbm(x * 0.08, z * 0.08, 3, 3) * f.noise : 0);
          if (this.voidBase && h <= HOLE) {
            if (d <= f.r + f.edge * 0.25) h = top - smoothstep(f.r, f.r + f.edge * 0.25, d) * 0.6;
          } else {
            const v = lerp(top, h, smoothstep(f.r, f.r + f.edge, d));
            if (v > h) h = v;
          }
          break;
        }
        case 'path': {
          const { d, y } = segDist(f.pts, x, z);
          const half = f.w * 0.5;
          if (d > half + f.edge) break;
          if (this.voidBase && h <= HOLE) {
            if (d <= half) h = y;
            break;
          }
          const v = d <= half ? y : lerp(y, h, smoothstep(half, half + f.edge, d));
          // Raised paths only fill; flat paths cut and fill.
          h = f.raise ? Math.max(h, v) : v;
          break;
        }
        case 'mound': {
          if (h <= HOLE) break;
          const d = Math.hypot(x - f.x, z - f.z);
          if (d < f.r) h += f.h * (0.5 + 0.5 * Math.cos((d / f.r) * Math.PI));
          break;
        }
        case 'pit': {
          if (h <= HOLE) break;
          const d = Math.hypot(x - f.x, z - f.z);
          if (d < f.r + f.edge) h = lerp(Math.min(h, f.h), h, smoothstep(f.r, f.r + f.edge, d));
          break;
        }
        case 'hole': {
          const d = Math.hypot((x - f.x) / f.sx, (z - f.z) / f.sz);
          if (d < f.r) h = HOLE;
          break;
        }
        case 'flatten': {
          if (h <= HOLE) break;
          const d = Math.hypot(x - f.x, z - f.z);
          if (d < f.r + f.edge) h = lerp(f.h, h, smoothstep(f.r, f.r + f.edge, d));
          break;
        }
        case 'ridge': {
          if (h <= HOLE) break;
          const { d } = segDist(f.pts.map(([a, b]) => [a, b, 0] as [number, number, number]), x, z);
          if (d < f.w) h += f.h * (0.5 + 0.5 * Math.cos((d / f.w) * Math.PI)) * (0.8 + 0.2 * fbm(x * 0.2, z * 0.2, 2, 11));
          break;
        }
      }
    }
    return h;
  }

  /** 0..1, how much of a painted trail covers this point. */
  pathMask(x: number, z: number): number {
    let m = 0;
    for (const p of this.paths) {
      const { d } = segDist(p.pts, x, z);
      const half = p.w * 0.5;
      const v = 1 - smoothstep(half * 0.6, half + 0.6, d + fbm(x * 0.4, z * 0.4, 2, 5) * 0.6);
      if (v > m) m = v;
    }
    return m;
  }
}

/** Distance from (x, z) to a polyline, plus the interpolated y there. */
export function segDist(pts: [number, number, number][], x: number, z: number): { d: number; y: number } {
  let best = Infinity;
  let by = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az, ay] = pts[i]!;
    const [bx, bz, bY] = pts[i + 1]!;
    const dx = bx - ax;
    const dz = bz - az;
    const l2 = dx * dx + dz * dz;
    let t = l2 > 0 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = ax + dx * t;
    const pz = az + dz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d < best) {
      best = d;
      by = ay + (bY - ay) * t;
    }
  }
  if (pts.length === 1) {
    best = Math.hypot(x - pts[0]![0], z - pts[0]![1]);
    by = pts[0]![2];
  }
  return { d: best, y: by };
}
