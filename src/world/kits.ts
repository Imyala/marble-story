import * as THREE from 'three';
import type { Builder } from './level';
import type { Shaper } from './shaper';
import { segDist } from './shaper';
import { makeBox, makeCyl, type Solid } from './collision';
import { GEO } from '../render/decor';
import { mat, glowShared } from '../render/materials';
import { taperedTube, mergeStatic } from '../render/shapes';
import { fbm } from '../core/math';
import { rng } from '../core/rng';
import type { Game } from '../game/game';
import type { Element, Hit, HitResult, Hittable } from '../game/types';
import type { Arena, Prop, SpawnSpec } from '../entities/props';
import { Talker } from '../entities/props';
import type { GemKind } from '../entities/gems';
import { DragonRig, defaultPose, type DragonLook } from '../player/dragonRig';

/**
 * Realm kits: reusable set pieces for building realms quickly, plus a small
 * realm template that lays out a whole route from a compact description.
 * Everything is one call; scenery goes through the level's instanced decor
 * batch or is merged, and anything the dragon should bump into gets a solid.
 *
 * Room kits
 *   cavernWall     irregular rock wall along a polyline (with collision)
 *   rockSlab       a slab of cave rock: a tunnel roof, a pillar, a ledge
 *   stalagmites    rock spikes from the floor, optionally stalactites from a ceiling
 *   caveCeiling    a vaulted rock ceiling over a whole cavern, glow-worms and all
 *   fungalGrove    giant glowing mushrooms you can stand on, small ones, drifting spores
 *   crystalCluster glowing crystals on a rock base
 *   ruinHall       floor, broken walls with doorways, pillars and arches of an old hall
 *   hollowRoot     one great black root of the Hollow King, arching through the scene
 *   rootWall       the Hollow King's thorny roots across a gap: permanent, or burned away by an element
 *   sealedGate     an imposing realm gate, shut by roots, with a name and a line from Flick
 *   dock           a plank pier on posts, out over water (Aster can climb onto it from a swim)
 *   lanternPost    a hooked post with a hanging lamp
 *   dragonStatue   a posed dragon in stone on a plinth, baked to a few static meshes
 *
 * Template (see RealmPlan)
 *   carveRealm(s, plan)   inside TerrainDef.shape: cuts the route, its arenas and pockets
 *   layoutRealm(b, plan)  inside build(): dresses the route, places the fights and each pocket's secret
 *
 * A realm built from the template reads like this:
 *
 *   const ROUTE: RealmPlan = { path: [[0, 80, 14], [-8, 64, 8], [0, 46, 1]], width: 7, cut: 'canyon',
 *     dressing: 'roots', lights: 14, pockets: [{ at: 0.5, side: 1, reward: { egg: 'nook' }, seal: 'roots' }] };
 *   terrain.shape = (s) => { s.base(40); ...; carveRealm(s, ROUTE); }
 *   build(b) { const r = layoutRealm(b, ROUTE); ...hand-placed hero moments... }
 */

// --- palette ------------------------------------------------------------------------------------

/** Cave rock tones, dark to light. */
export const ROCK = { dark: 0x3a3448, mid: 0x544c66, light: 0x6e6882, moss: 0x2e6a60 };
/** The Hollow King's roots: black bark, a violet glow in the cracks. */
export const ROOT = { bark: 0x15101c, vein: 0xa24cff };

const shade = (hex: number, k: number): number => new THREE.Color(hex).multiplyScalar(k).getHex();

/**
 * Moves a built group's meshes into the level as static meshes, so the
 * builder merges them by material and chunk with the rest of the scenery
 * (a root is then no extra draw calls at all).
 */
function bake(b: Builder, g: THREE.Object3D): void {
  g.updateMatrixWorld(true);
  const list: THREE.Mesh[] = [];
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && !Array.isArray(m.material)) list.push(m);
  });
  for (const m of list) {
    let geo = m.geometry.clone();
    for (const n of Object.keys(geo.attributes)) if (n !== 'position' && n !== 'normal') geo.deleteAttribute(n);
    if (!geo.getAttribute('normal')) geo.computeVertexNormals();
    if (geo.index) geo = geo.toNonIndexed();
    geo.applyMatrix4(m.matrixWorld);
    geo.computeBoundingSphere();
    // Chunked by where it stands: put the mesh's origin there.
    const c = geo.boundingSphere!.center.clone();
    geo.translate(-c.x, 0, -c.z);
    const out = new THREE.Mesh(geo, m.material);
    out.position.set(c.x, 0, c.z);
    out.castShadow = m.castShadow;
    out.receiveShadow = true;
    b.addStatic(out);
  }
}

// --- walls, slabs and spikes --------------------------------------------------------------------

export interface WallOpts {
  /** Thickness of the wall (and of each rock in it). Default 3. */
  thick?: number;
  color?: number;
  /** Base height; defaults to just under the lower of each segment's ends. */
  y0?: number;
  /** Joins the last point back to the first. */
  closed?: boolean;
  /** Set false for a wall that is only scenery. */
  collide?: boolean;
}

/**
 * An irregular rock wall along a polyline: tumbled boulders stacked to
 * `height`, crags on top, and one box solid per segment. Good for room
 * edges, cave partitions and anything the terrain alone makes too smooth.
 */
export function cavernWall(b: Builder, pts: [number, number][], height: number, o: WallOpts = {}): void {
  const thick = o.thick ?? 3;
  const color = o.color ?? ROCK.mid;
  const m = mat(color, { rough: 0.95, flat: true });
  const m2 = mat(shade(color, 0.72), { rough: 0.95, flat: true });
  const r = b.decor.rng;
  const segs = o.closed ? pts.length : pts.length - 1;
  for (let i = 0; i < segs; i++) {
    const [ax, az] = pts[i]!;
    const [cx, cz] = pts[(i + 1) % pts.length]!;
    const len = Math.hypot(cx - ax, cz - az);
    if (len < 0.1) continue;
    const yaw = Math.atan2(cx - ax, cz - az);
    const y0 = o.y0 ?? Math.min(b.y(ax, az), b.y(cx, cz)) - 1;
    if (o.collide !== false) {
      b.col.add(makeBox((ax + cx) / 2, (az + cz) / 2, thick / 2, len / 2 + thick * 0.25, y0, y0 + height, yaw));
    }
    const nx = Math.cos(yaw);
    const nz = -Math.sin(yaw);
    const steps = Math.max(1, Math.ceil(len / (thick * 1.1)));
    const tiers = Math.max(1, Math.ceil(height / (thick * 1.3)));
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const x = ax + (cx - ax) * t;
      const z = az + (cz - az) * t;
      for (let j = 0; j < tiers; j++) {
        // Slabs lying along the wall, tilted a little: strata more than rubble.
        const s = thick * (0.5 + r.next() * 0.2);
        const off = r.signed() * thick * 0.12;
        const y = y0 + (j + 0.5) * (height / tiers);
        b.decor.add(GEO.rock(), j % 2 ? m2 : m, x + nx * off, y, z + nz * off, s, height / tiers * 0.62, len / steps * 0.75, r.signed() * 0.15, yaw + r.signed() * 0.2, r.signed() * 0.12);
      }
      if (r.chance(0.6)) {
        const h = thick * (0.5 + r.next() * 0.9);
        b.decor.add(GEO.cone(), m2, x + r.signed() * thick * 0.3, y0 + height - 0.2, z + r.signed() * thick * 0.3, thick * 0.35, h, thick * 0.35, r.signed() * 0.15, r.next() * 6, r.signed() * 0.15);
      }
    }
  }
}

/**
 * A slab of cave rock from y0 to y1 along yaw: a tunnel roof over an
 * underwater passage, a buttress, a shelf. Drawn as a rough box of boulders.
 * Returns the solid.
 */
export function rockSlab(b: Builder, x: number, z: number, w: number, len: number, y0: number, y1: number, yaw = 0, color = ROCK.mid): Solid {
  const s = makeBox(x, z, w / 2, len / 2, y0, y1, yaw);
  b.col.add(s);
  const m = mat(color, { rough: 0.95, flat: true });
  const m2 = mat(shade(color, 0.75), { rough: 0.95, flat: true });
  const r = b.decor.rng;
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const nx = Math.cos(yaw);
  const nz = -Math.sin(yaw);
  const h = y1 - y0;
  const n = Math.max(2, Math.ceil(len / Math.max(1.5, w * 0.8)));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n - 0.5;
    for (const side of [-1, 1]) {
      const px = x + fx * t * len + nx * side * w * 0.2;
      const pz = z + fz * t * len + nz * side * w * 0.2;
      b.decor.add(GEO.rock(), side > 0 ? m : m2, px, y0 + h * 0.5, pz, w * (0.42 + r.next() * 0.1), h * 0.52, len / n * 0.75, r.next() * 0.4, yaw + r.signed() * 0.3, r.next() * 0.4);
    }
    // Rough, dripping underside: what a swimmer sees going beneath it.
    b.decor.add(GEO.cone(), m2, x + fx * t * len + nx * r.signed() * w * 0.3, y0 + 0.3, z + fz * t * len + nz * r.signed() * w * 0.3,
      0.35 + r.next() * 0.3, 0.8 + r.next() * 1.2, 0.35 + r.next() * 0.3, Math.PI, r.next() * 6, 0, false);
  }
  return s;
}

export interface SpikeOpts {
  color?: number;
  /** Tallest spike, metres. Default 6. */
  max?: number;
  /** Also hang stalactites from this height (no collision up there). */
  ceiling?: number;
  /** Glowing tips in this color. */
  glow?: number;
}

/**
 * Stalagmites: `n` rock spikes within radius `r` of (x, z), tall ones solid.
 * With `ceiling`, as many stalactites hang above them.
 */
export function stalagmites(b: Builder, x: number, z: number, r: number, n: number, o: SpikeOpts = {}): void {
  const rr = b.decor.rng;
  const color = o.color ?? ROCK.light;
  const m = mat(color, { rough: 0.9, flat: true });
  const m2 = mat(shade(color, 0.8), { rough: 0.9, flat: true });
  const max = o.max ?? 6;
  const tip = o.glow !== undefined ? glowShared(o.glow) : null;
  for (let i = 0; i < n; i++) {
    const a = rr.next() * Math.PI * 2;
    const d = Math.sqrt(rr.next()) * r;
    const px = x + Math.sin(a) * d;
    const pz = z + Math.cos(a) * d;
    const y = b.y(px, pz);
    const h = max * (0.25 + rr.next() * 0.75);
    const w = h * (0.16 + rr.next() * 0.08);
    b.decor.add(GEO.cone(), i % 2 ? m : m2, px, y - 0.3, pz, w, h + 0.3, w, rr.signed() * 0.08, rr.next() * 6, rr.signed() * 0.08);
    // A smaller spike leaning on the big one.
    if (h > max * 0.5) b.decor.add(GEO.cone(), m2, px + w * 0.9, y - 0.2, pz + w * 0.5, w * 0.5, h * 0.45, w * 0.5, 0.2, rr.next() * 6, -0.25);
    if (tip && rr.chance(0.5)) b.decor.add(GEO.octa(), tip, px, y + h * 0.55, pz, w * 0.35, h * 0.12, w * 0.35, 0, rr.next() * 6, 0, false);
    if (h > 2.4) b.col.add(makeCyl(px, pz, w * 0.55, y - 1, y + h * 0.7));
    if (o.ceiling !== undefined) {
      const ch = max * (0.4 + rr.next() * 0.9);
      b.decor.add(GEO.cone(), m2, px + rr.signed() * 2, o.ceiling + 0.5, pz + rr.signed() * 2, ch * 0.18, ch, ch * 0.18, Math.PI, rr.next() * 6, 0, false);
    }
  }
}

export interface CeilingOpts {
  color?: number;
  /** How much higher the middle of the vault is than its rim. */
  rise?: number;
  /** Openings (a fissure letting light in): [x, z, radius]. */
  holes?: [number, number, number][];
  /** Glow-worm speckles and their color. */
  glowworms?: number;
  wormColor?: number;
  /** Stalactites hanging from the vault. */
  stalactites?: number;
}

/**
 * A vaulted rock ceiling over a whole cavern: a displaced sheet (one draw
 * call) that curves down toward its rim so it meets the walls, glow-worm
 * speckles, and stalactites. It casts no shadow and has no collision.
 * `y` is the height at the rim, `sizeX`/`sizeZ` its extent around (x, z).
 */
export function caveCeiling(b: Builder, x: number, z: number, sizeX: number, sizeZ: number, y: number, o: CeilingOpts = {}): (px: number, pz: number) => number {
  const rise = o.rise ?? 20;
  const holes = o.holes ?? [];
  const height = (px: number, pz: number): number => {
    const d = Math.hypot((px - x) / (sizeX * 0.5), (pz - z) / (sizeZ * 0.5));
    return y + rise * Math.max(0, 1 - d * d) + fbm(px * 0.035, pz * 0.035, 3, 21) * 5 + fbm(px * 0.12, pz * 0.12, 2, 5) * 1.2;
  };
  const cell = 6;
  const nx = Math.ceil(sizeX / cell);
  const nz = Math.ceil(sizeZ / cell);
  const pos: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      const px = x - sizeX / 2 + i * cell;
      const pz = z - sizeZ / 2 + j * cell;
      pos.push(px, height(px, pz), pz);
    }
  }
  // Holes have ragged edges: the radius wanders with the angle.
  const inHole = (px: number, pz: number) => holes.some(([hx, hz, hr]) => {
    const a = Math.atan2(px - hx, pz - hz);
    return Math.hypot(px - hx, pz - hz) < hr * (0.8 + 0.3 * Math.sin(a * 3 + hx) + 0.15 * Math.sin(a * 7 + hz));
  });
  const P = (k: number): [number, number] => [pos[k * 3]!, pos[k * 3 + 2]!];
  const tri = (a: number, b2: number, c: number) => {
    const [ax, az] = P(a);
    const [bx, bz] = P(b2);
    const [cx, cz] = P(c);
    if (!inHole((ax + bx + cx) / 3, (az + bz + cz) / 3)) idx.push(a, b2, c);
  };
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      // Wound to face down, toward the cavern.
      tri(a, a + 1, a + nx + 1);
      tri(a + 1, a + nx + 2, a + nx + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat(o.color ?? ROCK.dark, { rough: 1, flat: true, side: THREE.DoubleSide }));
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData.cull = false;
  b.level.root.add(mesh);
  const r = b.decor.rng;
  const worms = o.glowworms ?? 0;
  const wm = glowShared(o.wormColor ?? 0x8ff0e0);
  for (let i = 0; i < worms; i++) {
    const px = x + r.signed() * sizeX * 0.45;
    const pz = z + r.signed() * sizeZ * 0.45;
    if (inHole(px, pz)) continue;
    const s = 0.12 + r.next() * 0.22;
    b.decor.add(GEO.blobLow(), wm, px, height(px, pz) - 0.4, pz, s, s, s, 0, 0, 0, false);
    // A dangling thread under some of them.
    if (r.chance(0.3)) b.decor.add(GEO.strand(), wm, px, height(px, pz) - 0.4, pz, 0.4, 1 + r.next() * 2.5, 0.4, 0, 0, 0, false);
  }
  const sm = mat(o.color ?? ROCK.dark, { rough: 1, flat: true });
  // A ragged fringe of rock round each opening hides its edge.
  for (const [hx, hz, hr] of holes) {
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + r.next() * 0.2;
      const rr = hr * (0.95 + r.next() * 0.35);
      const px = hx + Math.sin(a) * rr;
      const pz = hz + Math.cos(a) * rr;
      const h = 2.5 + r.next() * 5;
      b.decor.add(GEO.cone(), sm, px, height(px, pz) + 1.5, pz, 1.4 + r.next(), h + 1.5, 1.4 + r.next(), Math.PI + r.signed() * 0.2, r.next() * 6, r.signed() * 0.2, false);
    }
  }
  for (let i = 0; i < (o.stalactites ?? 0); i++) {
    const px = x + r.signed() * sizeX * 0.42;
    const pz = z + r.signed() * sizeZ * 0.42;
    if (inHole(px, pz)) continue;
    const h = 3 + r.next() * 9;
    b.decor.add(GEO.cone(), sm, px, height(px, pz) + 1, pz, h * 0.16, h + 1, h * 0.16, Math.PI, r.next() * 6, 0, false);
  }
  return height;
}

// --- growing things -----------------------------------------------------------------------------

export interface GroveOpts {
  /** Giant caps as [dx, dz, scale] from the grove center; random ones if not given. */
  giants?: [number, number, number][];
  /** How many random giants (when `giants` is not given). Default 3. */
  count?: number;
  /** Small glowing mushrooms around them. Default 14. */
  small?: number;
  colors?: number[];
  /** Drifting spores near the dragon. Default true. */
  spores?: boolean;
}

/** A giant cap's standable top. */
export interface CapTop {
  x: number;
  z: number;
  top: number;
  r: number;
}

const CAP_COLORS = [0x3ae0d0, 0x9a6aff, 0xff6ab8, 0x6ab8ff, 0xb8ff6a];

/**
 * A grove of giant glowing mushrooms: thick stalks you bump into, caps you
 * can stand on (returned, for eggs and bounce shrooms), small glowing
 * mushrooms around them, and spores drifting up when the dragon is near.
 */
export function fungalGrove(b: Builder, x: number, z: number, r: number, o: GroveOpts = {}): CapTop[] {
  const rr = b.decor.rng;
  const colors = o.colors ?? CAP_COLORS;
  const giants = o.giants ?? Array.from({ length: o.count ?? 3 }, () => {
    const a = rr.next() * Math.PI * 2;
    const d = (0.3 + rr.next() * 0.7) * r * 0.8;
    return [Math.sin(a) * d, Math.cos(a) * d, 0.8 + rr.next() * 0.9] as [number, number, number];
  });
  const stalk = mat(0xd8d0c0, { rough: 0.8, emissive: 0x3a4a50, emissiveIntensity: 0.4 });
  const gill = mat(0x2a2438, { rough: 1 });
  const out: CapTop[] = [];
  giants.forEach(([dx, dz, s], i) => {
    const px = x + dx;
    const pz = z + dz;
    const y = b.y(px, pz);
    const c = colors[i % colors.length]!;
    const cap = mat(c, { rough: 0.55, emissive: c, emissiveIntensity: 0.7 });
    const h = 3.2 + s * 3.2;
    const sr = 0.35 + s * 0.3;
    const cr = 2 + s * 1.8;
    const lean = rr.signed() * 0.08;
    b.decor.add(GEO.cyl(), stalk, px, y - 0.2, pz, sr, h + 0.2, sr, lean, 0, lean);
    b.decor.add(GEO.cyl(), stalk, px, y - 0.2, pz, sr * 1.6, 0.7, sr * 1.6, 0, 0, 0);
    const tx = px + Math.sin(lean) * h;
    const tz = pz + Math.sin(lean) * h;
    b.decor.add(GEO.cap(), cap, tx, y + h, tz, cr, cr * 0.45, cr, 0, rr.next() * 6, 0);
    b.decor.add(GEO.cyl(), gill, tx, y + h - 0.05, tz, cr * 0.94, 0.1, cr * 0.94, 0, 0, 0, false);
    const spot = glowShared(0xfff6d8);
    for (let k = 0; k < 6; k++) {
      const a = rr.next() * Math.PI * 2;
      const d = cr * (0.25 + rr.next() * 0.5);
      b.decor.add(GEO.blobLow(), spot, tx + Math.sin(a) * d, y + h + cr * 0.45 * Math.sqrt(1 - (d / cr) ** 2) - 0.05, tz + Math.cos(a) * d, 0.18 * s + 0.08, 0.06, 0.18 * s + 0.08, 0, 0, 0, false);
    }
    // Solid stalk, and a cap to stand on (its dome, near enough).
    b.col.add(makeCyl(px, pz, sr + 0.05, y - 1, y + h));
    const top = y + h + cr * 0.32;
    const capSolid = makeCyl(tx, tz, cr * 0.8, y + h - 0.25, top);
    capSolid.surface = 'mud';
    b.col.add(capSolid);
    out.push({ x: tx, z: tz, top, r: cr * 0.8 });
  });
  for (let i = 0; i < (o.small ?? 14); i++) {
    const a = rr.next() * Math.PI * 2;
    const d = Math.sqrt(rr.next()) * r;
    const px = x + Math.sin(a) * d;
    const pz = z + Math.cos(a) * d;
    if (out.some((c) => Math.hypot(c.x - px, c.z - pz) < 1.2)) continue;
    const y = b.col.groundAt(px, pz, 1e4, 0.2).y;
    if (y < b.level.waterLevel + 0.1) continue;
    b.decor.mushroom(px, y, pz, 0.4 + rr.next() * 0.7, colors[Math.floor(rr.next() * colors.length)]!, true);
  }
  if (o.spores !== false) b.level.props.push(new Spores(b.game, x, z, r, colors));
  return out;
}

/** Glowing spores drifting up around a grove while the dragon is close by. */
class Spores implements Prop {
  private t = 0;
  constructor(private game: Game, private x: number, private z: number, private r: number, private colors: number[]) {}
  update(dt: number): void {
    const g = this.game;
    const p = g.player;
    const d = Math.hypot(p.x - this.x, p.z - this.z);
    if (d > this.r + 30) return;
    this.t += dt * 6;
    while (this.t >= 1) {
      this.t -= 1;
      const a = rng.next() * Math.PI * 2;
      const rr = Math.sqrt(rng.next()) * this.r;
      const px = this.x + Math.sin(a) * rr;
      const pz = this.z + Math.cos(a) * rr;
      const y = g.col.terrainAt(px, pz);
      if (y < -1e3) continue;
      g.fx.emit(px, y + 0.3 + rng.next() * 2.5, pz, {
        count: 1, speed: 0.3, dir: [0, 1, 0], spread: 0.8, life: [2.5, 4.5], size: [0.07, 0.14], sizeEnd: 0.4,
        color: this.colors[Math.floor(rng.next() * this.colors.length)]!, bright: 2, drag: 0.4, gravity: -0.12,
      });
    }
  }
}

/** Glowing crystals on a rock base; big clusters are solid. `y` overrides the ground height. */
export function crystalCluster(b: Builder, x: number, z: number, scale: number, color: number, y?: number): void {
  const rr = b.decor.rng;
  const gy = y ?? b.y(x, z);
  const m = glowShared(color);
  const core = mat(color, { rough: 0.15, metal: 0.1, emissive: color, emissiveIntensity: 0.5, flat: true });
  b.decor.add(GEO.rock(), mat(ROCK.mid, { rough: 0.95, flat: true }), x, gy - 0.1 * scale, z, 0.9 * scale, 0.4 * scale, 0.9 * scale, rr.next(), rr.next() * 6, rr.next());
  const n = 3 + Math.floor(rr.next() * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rr.next();
    const tilt = i === 0 ? 0 : 0.35 + rr.next() * 0.35;
    const h = (i === 0 ? 2.4 : 1 + rr.next() * 1.2) * scale;
    const ox = i === 0 ? 0 : Math.sin(a) * 0.4 * scale;
    const oz = i === 0 ? 0 : Math.cos(a) * 0.4 * scale;
    b.decor.add(GEO.octa(), i === 0 ? core : m, x + ox, gy + h * 0.45, z + oz, 0.3 * scale, h * 0.5, 0.3 * scale, Math.cos(a) * tilt, rr.next() * 6, -Math.sin(a) * tilt, i === 0);
  }
  if (scale > 1.2) b.col.add(makeCyl(x, z, 0.5 * scale, gy - 1, gy + 2 * scale));
}

// --- the Hollow King's roots --------------------------------------------------------------------

export interface RootOpts {
  /** Thorns along the root. Default true. */
  thorns?: boolean;
  /** Solid where the root runs near the ground (within `collideBelow` of it). */
  collide?: boolean;
}

/**
 * One great black root of the Hollow King through points [x, y, z], tapering
 * from `r` to a third of it, with glowing cracks and thorns. One merged mesh.
 * With `collide`, the stretches near the ground are solid.
 */
export function hollowRoot(b: Builder, pts: [number, number, number][], r: number, o: RootOpts = {}): void {
  const g = new THREE.Group();
  const bark = mat(ROOT.bark, { rough: 0.85, flat: true });
  const vein = glowShared(ROOT.vein);
  const v = pts.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const tube = new THREE.Mesh(taperedTube(v, r, r * 0.3, Math.max(8, pts.length * 6), 8, true), bark);
  tube.castShadow = true;
  g.add(tube);
  // A thin glowing vein wound along the top.
  const curve = new THREE.CatmullRomCurve3(v);
  const vp: THREE.Vector3[] = [];
  const n = Math.max(6, pts.length * 5);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = curve.getPointAt(t);
    const rr = r * (1 - 0.7 * t);
    const a = t * 9;
    vp.push(p.add(new THREE.Vector3(Math.sin(a) * rr * 0.9, Math.cos(a) * rr * 0.9, 0)));
  }
  g.add(new THREE.Mesh(taperedTube(vp, r * 0.12, r * 0.05, n * 2, 5, true), vein));
  if (o.thorns !== false) {
    const tm = mat(0x0c0810, { rough: 0.7 });
    const cone = GEO.cone();
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const rr = r * (1 - 0.7 * t);
      const a = i * 2.3;
      const side = new THREE.Vector3(Math.sin(a), Math.cos(a), 0).cross(tan).normalize();
      const th = new THREE.Mesh(cone, tm);
      th.scale.set(rr * 0.25, rr * 1.1, rr * 0.25);
      th.position.copy(p).addScaledVector(side, rr * 0.8);
      th.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), side);
      g.add(th);
    }
  }
  mergeStatic(g);
  bake(b, g);
  if (o.collide) {
    for (let i = 0; i <= n; i++) {
      const p = curve.getPointAt(i / n);
      const gy = b.col.terrainAt(p.x, p.z);
      const rr = r * (1 - 0.7 * (i / n));
      if (p.y - rr < gy + 2.2) b.col.add(makeCyl(p.x, p.z, rr * 0.9, p.y - rr - 1, p.y + rr));
    }
  }
}

export interface RootWallOpts {
  /** The element that clears it (fire burns the roots). Omit for roots that never give way. */
  element?: Element;
  /** Fired when it gives way. */
  signal?: string;
  thick?: number;
}

/**
 * The Hollow King's thorny roots grown across a gap from (x1, z1) to
 * (x2, z2), `h` high. Without `element` they are a permanent barrier;
 * with it, a gate that the element burns (or shatters) away. Returns the
 * gate, or null for a permanent wall.
 */
export function rootWall(b: Builder, x1: number, z1: number, x2: number, z2: number, h: number, o: RootWallOpts = {}): RootGate | null {
  const len = Math.hypot(x2 - x1, z2 - z1);
  const yaw = Math.atan2(x2 - x1, z2 - z1);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const y = Math.min(b.y(x1, z1), b.y(x2, z2), b.y(cx, cz));
  const thick = o.thick ?? 1.2;
  const solid = makeBox(cx, cz, thick / 2, len / 2, y - 1, y + h, yaw);
  b.col.add(solid);
  const g = new THREE.Group();
  const bark = mat(ROOT.bark, { rough: 0.85, flat: true });
  const vein = glowShared(ROOT.vein);
  const tm = mat(0x0c0810, { rough: 0.7 });
  const r = b.decor.rng;
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const V = (t: number, yy: number, off: number) => new THREE.Vector3(fx * (t - 0.5) * len + Math.cos(yaw) * off, yy, fz * (t - 0.5) * len - Math.sin(yaw) * off);
  const strands = Math.max(5, Math.round(len * 1.4));
  for (let i = 0; i < strands; i++) {
    const t0 = r.next();
    const t1 = Math.min(1, Math.max(0, t0 + r.signed() * 0.7));
    const off = r.signed() * thick * 0.3;
    const pts = [V(t0, -0.3, off), V((t0 + t1) / 2 + r.signed() * 0.1, h * (0.35 + r.next() * 0.3), -off), V(t1, h + r.next() * 0.6, off * 0.5)];
    const rr = 0.14 + r.next() * 0.2;
    g.add(new THREE.Mesh(taperedTube(pts, rr, rr * 0.35, 10, 6, true), bark));
    // A thin glowing crack along some of them.
    if (i % 3 === 0) g.add(new THREE.Mesh(taperedTube(pts.map((p) => p.clone().add(new THREE.Vector3(Math.cos(yaw) * rr * 0.75, 0, -Math.sin(yaw) * rr * 0.75))), rr * 0.3, rr * 0.1, 10, 4, true), vein));
    for (let k = 0; k < 3; k++) {
      const th = new THREE.Mesh(GEO.cone(), tm);
      const p = pts[1]!.clone().lerp(pts[k % 2 ? 2 : 0]!, r.next() * 0.8);
      th.position.copy(p);
      th.scale.set(0.06, 0.35 + r.next() * 0.3, 0.06);
      th.rotation.set(r.signed() * 1.6, r.next() * 6, r.signed() * 1.6);
      g.add(th);
    }
  }
  // Knotted bases where the roots came up through the floor.
  for (const t of [0, 1]) {
    const p = V(t, 0, 0);
    const knot = new THREE.Mesh(GEO.rock(), bark);
    knot.position.set(p.x, 0.2, p.z);
    knot.scale.set(0.9, 0.6, 0.9);
    g.add(knot);
  }
  g.position.set(cx, y, cz);
  mergeStatic(g);
  if (!o.element) {
    bake(b, g);
    return null;
  }
  b.level.root.add(g);
  const gate = new RootGate(b.game, cx, y, cz, len, h, o.element, o.signal ?? '', solid, g);
  b.level.props.push(gate);
  b.level.hittables.push(gate);
  return gate;
}

const ELEMENT_HINT: Record<Element, string> = {
  fire: 'The Hollow King\'s roots. They\'re dry as old bones... fire would take them.',
  lightning: 'The roots hum. A good jolt of lightning might split them.',
  ice: 'Ice could freeze these roots brittle.',
  earth: 'Only a real earthen blow would break roots this thick.',
};

/** Roots across a gap that one element clears. */
export class RootGate implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius: number;
  private hp = 30;
  private hintT = 0;
  private burnT = -1;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, private len: number, readonly height: number,
    readonly element: Element, readonly signal: string, private solid: Solid, private mesh: THREE.Object3D) {
    this.radius = len * 0.5;
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive || this.burnT >= 0) return 'none';
    const g = this.game;
    if (hit.type !== this.element) {
      this.hintT -= 1;
      if (this.hintT <= 0) {
        this.hintT = 6;
        g.toast(ELEMENT_HINT[this.element], 'hint');
      }
      return 'immune';
    }
    this.hp -= Math.max(hit.damage, hit.source === 'burst' ? 30 : 4);
    g.fx.emit(this.x, this.y + this.height * 0.5, this.z, { count: 4, speed: 2, dir: [0, 1, 0], life: [0.4, 0.8], size: [0.3, 0.5], color: 0xff9040, colorEnd: 0x6a10a0, bright: 1.6, jitter: this.len * 0.3 });
    if (this.hp <= 0) {
      this.burnT = 0;
      g.sfx('fireBurst', this.x, this.y, this.z);
      g.fx.shadowPoof(this.x, this.y + this.height * 0.5, this.z, 1.5);
    }
    return 'hit';
  }

  update(dt: number): void {
    if (this.burnT < 0 || !this.alive) return;
    const g = this.game;
    this.burnT += dt;
    // The roots shrivel into the floor, trailing embers and shadow.
    const k = Math.min(1, this.burnT / 1.1);
    this.mesh.scale.set(1, 1 - k * 0.95, 1);
    if (Math.random() < 0.6) g.fx.emit(this.x + (Math.random() - 0.5) * this.len, this.y + Math.random() * this.height * (1 - k), this.z, {
      count: 1, speed: 1.5, dir: [0, 1.4, 0], life: [0.4, 0.8], size: [0.3, 0.55], sizeEnd: 0.1, color: 0xffb050, colorEnd: 0x8030ff, bright: 1.8, gravity: -2,
    });
    if (k >= 1) {
      this.alive = false;
      this.solid.enabled = false;
      this.mesh.visible = false;
      g.sfx('rumble', this.x, this.y, this.z, 1.4, 0.6);
      if (this.signal) g.level?.emit(this.signal);
    }
  }
}

export interface GateOpts {
  /** Height of the arch (default 13) and width of the doorway (default 7). */
  h?: number;
  w?: number;
  /** Glow of the seal and sigil. */
  color?: number;
  stone?: number;
}

/**
 * A sealed realm gate: two great pillars and a lintel with a glowing sigil,
 * a door slab behind, and the Hollow King's roots grown across it. Walking
 * up shows its name (the use prompt) and Flick says `line` once; pressing
 * Use says it again. Solid all the way across. Faces `yaw` (toward where the
 * dragon approaches from).
 */
export function sealedGate(b: Builder, id: string, x: number, z: number, yaw: number, name: string, line: string, o: GateOpts = {}): void {
  const g = b.game;
  const h = o.h ?? 13;
  const w = o.w ?? 7;
  const color = o.color ?? 0x8ae0ff;
  const stone = mat(o.stone ?? 0x6a6478, { rough: 0.9, flat: true });
  const stoneDark = mat(shade(o.stone ?? 0x6a6478, 0.65), { rough: 0.95, flat: true });
  const y = b.y(x, z);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  // Pillars, a stepped lintel and a keystone sigil.
  for (const s of [-1, 1]) {
    const px = x + rx * s * (w / 2 + 1.2);
    const pz = z + rz * s * (w / 2 + 1.2);
    b.decor.add(GEO.box(), stoneDark, px, y + 0.8, pz, 3.4, 1.6, 3.4, 0, yaw, 0);
    b.decor.add(GEO.cyl6(), stone, px, y + 1.6, pz, 1.2, h - 1.6, 1.2, 0, yaw, 0);
    b.decor.add(GEO.box(), stoneDark, px, y + h, pz, 3, 1, 3, 0, yaw, 0);
    b.col.add(makeCyl(px, pz, 1.5, y - 1, y + h + 1));
  }
  b.decor.add(GEO.box(), stone, x, y + h + 1.2, z, w + 6, 1.6, 2.6, 0, yaw, 0);
  b.decor.add(GEO.box(), stoneDark, x, y + h + 2.4, z, w + 2, 1, 2.2, 0, yaw, 0);
  const sig = glowShared(color);
  b.decor.add(GEO.octa(), sig, x + fx * 1.35, y + h + 1.2, z + fz * 1.35, 0.7, 1.1, 0.25, 0, yaw, 0, false);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.1, 6, 28), sig);
  ring.position.set(x + fx * 1.34, y + h + 1.2, z + fz * 1.34);
  ring.rotation.y = yaw;
  b.addStatic(ring);
  // The door itself, a dark slab with a dim seam of light.
  b.box(x - fx * 0.6, y - 0.5, z - fz * 0.6, w + 0.6, h + 0.5, 1, 0x2a2634, { yaw });
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.14, h - 1, 0.1), glowShared(shade(color, 0.6)));
  seam.position.set(x - fx * 0.05, y + (h - 1) / 2, z - fz * 0.05);
  seam.rotation.y = yaw;
  b.addStatic(seam);
  // Roots over all of it.
  rootWall(b, x - rx * (w / 2 + 0.4) + fx * 0.3, z - rz * (w / 2 + 0.4) + fz * 0.3, x + rx * (w / 2 + 0.4) + fx * 0.3, z + rz * (w / 2 + 0.4) + fz * 0.3, h * 0.8, { thick: 1 });
  hollowRoot(b, [[x - rx * (w / 2 + 2.5), y - 0.5, z - rz * (w / 2 + 2.5)], [x - rx * 1.5 + fx * 0.8, y + h * 0.6, z - rz * 1.5 + fz * 0.8],
    [x + rx * 2 + fx * 0.6, y + h + 1.5, z + rz * 2 + fz * 0.6], [x + rx * (w / 2 + 3), y + h * 0.4, z + rz * (w / 2 + 3)]], 0.7);
  // Its name when close; Flick's word on it.
  const say = () => g.hud.flick(line, 6);
  const talk = new Talker(g, x + fx * 3, y, z + fz * 3, `${name} (sealed)`, say);
  b.level.props.push(talk);
  b.level.interactables.push(talk);
  b.story(`gate-${id}`, x + fx * 6, z + fz * 6, 6, say);
}

// --- water ---------------------------------------------------------------------------------------

/**
 * A plank pier from the shore at (x, z) out along `yaw`, `len` long and `w`
 * wide, its deck at `top`, on posts down to the lake bed. Swimmers can climb
 * onto it (the deck is a low ledge from the water).
 */
export function dock(b: Builder, x: number, z: number, yaw: number, len: number, w: number, top: number): void {
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  const cx = x + fx * len / 2;
  const cz = z + fz * len / 2;
  const deck = makeBox(cx, cz, w / 2, len / 2, top - 0.35, top, yaw);
  deck.surface = 'wood';
  b.col.add(deck);
  const wood = mat(0x7a5a3c, { rough: 0.95 });
  const dark = mat(0x4a3424, { rough: 0.95 });
  const r = b.decor.rng;
  const n = Math.round(len / 0.55);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    b.decor.add(GEO.box(), i % 4 === 0 ? dark : wood, x + fx * len * t, top - 0.1, z + fz * len * t, w, 0.16, 0.48, r.signed() * 0.02, yaw, 0);
  }
  for (let i = 0; i <= Math.ceil(len / 3); i++) {
    const t = i / Math.ceil(len / 3);
    for (const s of [-1, 1]) {
      const px = x + fx * len * t + rx * s * (w / 2 - 0.15);
      const pz = z + fz * len * t + rz * s * (w / 2 - 0.15);
      const floor = b.col.terrainAt(px, pz);
      const y0 = floor > -1e3 ? floor - 0.3 : top - 6;
      b.decor.add(GEO.cyl6(), dark, px, y0, pz, 0.14, top + 0.6 - y0, 0.14);
    }
  }
}

// --- light ----------------------------------------------------------------------------------------

/** A hooked post with a hanging lamp of `color`, the hook along `ry`. */
export function lanternPost(b: Builder, x: number, z: number, color = 0xffd890, ry = 0, y?: number): void {
  const gy = y ?? b.y(x, z);
  const post = mat(0x3a2e24, { rough: 0.9 });
  const ax = Math.cos(ry);
  const az = -Math.sin(ry);
  b.decor.add(GEO.cyl6(), post, x, gy, z, 0.08, 2.4, 0.08);
  b.decor.add(GEO.box(), post, x + ax * 0.28, gy + 2.35, z + az * 0.28, 0.6, 0.06, 0.06, 0, ry, 0);
  b.decor.add(GEO.blobLow(), glowShared(color), x + ax * 0.5, gy + 2.05, z + az * 0.5, 0.16, 0.22, 0.16, 0, 0, 0, false);
}

/**
 * A dragon carved in stone on a plinth at (x, z), facing `yaw`: the rig is
 * posed once (roaring, or at rest) and baked into static meshes, so it costs
 * a handful of draw calls instead of a live rig's sixty. Solid.
 */
export function dragonStatue(b: Builder, x: number, z: number, yaw: number, look: Partial<DragonLook>, o: { roar?: boolean; scale?: number; stone?: number; eyes?: number } = {}): void {
  const y = b.y(x, z);
  const stone = o.stone ?? 0x8a8298;
  const sc = o.scale ?? 1.6;
  b.box(x, y - 0.3, z, 2.2 * sc, 1.3, 2.6 * sc, shade(stone, 0.75), { trim: stone, yaw });
  const full: DragonLook = {
    body: stone, belly: shade(stone, 1.1), horn: shade(stone, 0.85), membrane: shade(stone, 0.95), eye: o.eyes ?? shade(stone, 0.7), spikes: shade(stone, 0.85),
    scale: sc, hornStyle: 'crown', tailStyle: 'fan', slender: 0.6, ...look,
  };
  const rig = new DragonRig(full, false);
  const p = defaultPose();
  if (o.roar) {
    p.attack = 'roar';
    p.attackT = 0.5;
  }
  for (let i = 0; i < 30; i++) rig.update(0.05, p);
  rig.root.position.set(x, y + 1.0, z);
  rig.root.rotation.y = yaw;
  bake(b, rig.root);
  b.col.add(makeCyl(x, z, 0.9 * sc, y + 1, y + 1 + 2.2 * sc));
}

// --- ruins ---------------------------------------------------------------------------------------

export interface HallOpts {
  yaw?: number;
  /** Floor top; defaults to the ground at the center (plus a step). */
  top?: number;
  /** Wall height before ruin. Default 5. */
  wallH?: number;
  /** 0 (whole) to 1 (hardly a wall left standing). Default 0.5. */
  broken?: number;
  /** Doorways, by side of the hall in its own frame: 'n' is +d (along yaw), 's' -d, 'e' +w, 'w' -w. */
  doors?: ('n' | 's' | 'e' | 'w')[];
  /** Pillars down each long side. Default 3. */
  pillars?: number;
  color?: number;
  /** Stone floor slab. Default true. */
  floor?: boolean;
}

/** Where a hall's floor is, and how to place things in its own frame. */
export interface Hall {
  top: number;
  /** Hall-local (u across, v along) to world [x, z]. */
  at(u: number, v: number): [number, number];
}

/**
 * The ruin of an old hall, `w` across and `d` deep: a floor, walls broken
 * into jagged runs (whole doorways left in them, with arches over), pillars
 * down both sides (some fallen), and rubble. Everything solid that looks it.
 */
export function ruinHall(b: Builder, x: number, z: number, w: number, d: number, o: HallOpts = {}): Hall {
  const yaw = o.yaw ?? 0;
  const color = o.color ?? 0x8a8298;
  const trim = shade(color, 0.75);
  const broken = o.broken ?? 0.5;
  const wallH = o.wallH ?? 5;
  const r = b.decor.rng;
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  const at = (u: number, v: number): [number, number] => [x + rx * u + fx * v, z + rz * u + fz * v];
  const top = o.top ?? b.y(x, z) + 0.35;
  if (o.floor !== false) b.platform(x, top, z, w, d, color, Math.max(0.8, top - b.y(x, z) + 0.8), { yaw, trim });
  const doors = new Set(o.doors ?? ['s']);
  const m = mat(color, { rough: 0.9, flat: true });
  // A side from local (u0, v0) to (u1, v1), in runs of ~2.5 m of ruined height.
  const side = (u0: number, v0: number, u1: number, v1: number, door: boolean) => {
    const len = Math.hypot(u1 - u0, v1 - v0);
    const n = Math.max(2, Math.round(len / 2.5));
    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const t1 = (i + 1) / n;
      const mid = (t0 + t1) / 2;
      if (door && Math.abs(mid - 0.5) < 1.6 / len + 0.5 / n) continue;
      const h = wallH * (1 - broken * r.next() * 1.1);
      if (h < 0.6) {
        const [px, pz] = at(u0 + (u1 - u0) * mid, v0 + (v1 - v0) * mid);
        b.decor.rock(px, top, pz, 0.7 + r.next() * 0.5, color);
        continue;
      }
      const [ax, az] = at(u0 + (u1 - u0) * t0, v0 + (v1 - v0) * t0);
      const [cx, cz] = at(u0 + (u1 - u0) * t1, v0 + (v1 - v0) * t1);
      b.wall(ax, az, cx, cz, top - 0.2, h, 0.9, color);
      // Jagged top: a tilted block on some of the taller runs.
      if (h > 2 && r.chance(0.5)) b.decor.add(GEO.box(), m, (ax + cx) / 2, top + h + 0.1, (az + cz) / 2, 0.8, 0.5, len / n * 0.6, r.signed() * 0.3, Math.atan2(cx - ax, cz - az), r.signed() * 0.3);
    }
    if (door) {
      const [dx, dz] = at((u0 + u1) / 2, (v0 + v1) / 2);
      archway(b, dx, dz, Math.atan2(u1 - u0, v1 - v0) + yaw + Math.PI / 2, 3.2, wallH + 0.8, color, top);
    }
  };
  const hw = w / 2;
  const hd = d / 2;
  side(-hw, hd, hw, hd, doors.has('n'));
  side(-hw, -hd, hw, -hd, doors.has('s'));
  side(hw, -hd, hw, hd, doors.has('e'));
  side(-hw, -hd, -hw, hd, doors.has('w'));
  const np = o.pillars ?? 3;
  for (let i = 0; i < np; i++) {
    const v = -hd + (d * (i + 1)) / (np + 1);
    for (const s of [-1, 1]) {
      const [px, pz] = at(s * (hw - 2), v);
      if (r.chance(broken * 0.6)) {
        // Fallen: a stub and the drum lying beside it.
        b.decor.pillar(px, top, pz, 0.55, 1.2 + r.next(), color, true);
        const ly = r.next() * 6;
        b.decor.add(GEO.cyl6(), m, px + Math.cos(ly) * 1.4, top + 0.5, pz - Math.sin(ly) * 1.4, 0.5, 2.6, 0.5, Math.PI / 2, ly, 0);
      } else b.pillar(px, pz, 0.55, top - 0.2, top + wallH * (0.7 + r.next() * 0.4), color);
    }
  }
  for (let i = 0; i < Math.round(w * d * 0.04 * broken); i++) {
    const [px, pz] = at(r.signed() * (hw - 1), r.signed() * (hd - 1));
    b.decor.rock(px, top, pz, 0.25 + r.next() * 0.4, color);
  }
  return { top, at };
}

/** An arch over a doorway at (x, z), its opening facing along `yaw`: two posts and a lintel. */
export function archway(b: Builder, x: number, z: number, yaw: number, w: number, h: number, color = 0x8a8298, y?: number): void {
  const gy = y ?? b.y(x, z);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  for (const s of [-1, 1]) b.pillar(x + rx * s * (w / 2 + 0.5), z + rz * s * (w / 2 + 0.5), 0.55, gy - 0.5, gy + h, color);
  const m = mat(color, { rough: 0.9, flat: true });
  b.decor.add(GEO.box(), m, x, gy + h + 0.45, z, w + 2.4, 0.9, 1.3, 0, yaw, 0);
  b.decor.add(GEO.box(), mat(shade(color, 0.75), { rough: 0.9, flat: true }), x, gy + h + 1.05, z, w + 1, 0.4, 1.1, 0, yaw, 0);
}

// ================================================================================================
// The realm template
// ================================================================================================

export type Dressing = 'cavern' | 'fungal' | 'ruins' | 'roots';

/** What a side pocket holds. */
export type PocketReward =
  | { egg: string }
  | { letter: string }
  | { relic: string; relicId: string }
  | { heart: string }
  | { mana: string }
  | { chest: string; loot: Partial<Record<GemKind, number>>; iron?: boolean }
  | { gems: number };

export interface PocketDef {
  /** Where along the route it branches off, 0 (start) to 1 (end). */
  at: number;
  /** Which side: 1 is to the right walking the route, -1 to the left. */
  side: 1 | -1;
  /** How far the nook lies from the route's edge. Default 7. */
  len?: number;
  /** Radius of the nook. Default 3.5. */
  r?: number;
  /** How much higher (or lower) the nook sits than the route there. */
  rise?: number;
  reward: PocketReward;
  /**
   * What closes it off at the mouth: roots (fire burns them), vines (fire),
   * rock (an earthen blow) or wood (a charge). Open if not given.
   */
  seal?: 'roots' | 'vines' | 'rock' | 'wood';
}

export interface ArenaDef {
  id: string;
  /** Where along the route, 0..1. */
  at: number;
  r: number;
  waves: SpawnSpec[][];
  reward?: number;
}

/**
 * A realm route from a compact description: the path, its width and look,
 * fights along it, and side pockets with a secret each. Use the same plan
 * for carveRealm (terrain) and layoutRealm (build).
 */
export interface RealmPlan {
  /** Route points [x, z, y], y being the floor height there. */
  path: [number, number, number][];
  /** Walkable width. */
  width: number;
  /**
   * 'canyon' cuts the route down through higher ground (rock walls either
   * side); 'trail' only raises low spots to it and paints it. Default 'trail'.
   */
  cut?: 'canyon' | 'trail';
  dressing: Dressing;
  arenas?: ArenaDef[];
  pockets?: PocketDef[];
  /** A lamp every this many metres along the route, alternating sides (0: none). Default 16. */
  lights?: number;
  lightColor?: number;
  /** A gem trail down the middle, one gem every this many metres (0: none). */
  gems?: number;
  /** How thickly to dress the edges (1 = default). */
  density?: number;
}

/** A point along a plan's route: position, floor height, heading and the right-hand normal. */
export interface RoutePoint {
  x: number;
  z: number;
  y: number;
  yaw: number;
  /** Unit vector to the right of the heading. */
  nx: number;
  nz: number;
}

/** The route point at fraction `t` (0..1) of its length. */
export function routeAt(plan: RealmPlan, t: number): RoutePoint {
  const p = plan.path;
  const lens: number[] = [];
  let total = 0;
  for (let i = 0; i < p.length - 1; i++) {
    const l = Math.hypot(p[i + 1]![0] - p[i]![0], p[i + 1]![1] - p[i]![1]);
    lens.push(l);
    total += l;
  }
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]! || i === lens.length - 1) {
      const k = lens[i]! > 0 ? Math.min(1, d / lens[i]!) : 0;
      const [ax, az, ay] = p[i]!;
      const [bx, bz, by] = p[i + 1]!;
      const yaw = Math.atan2(bx - ax, bz - az);
      return { x: ax + (bx - ax) * k, z: az + (bz - az) * k, y: ay + (by - ay) * k, yaw, nx: -Math.cos(yaw), nz: Math.sin(yaw) };
    }
    d -= lens[i]!;
  }
  const [x, z, y] = p[0]!;
  return { x, z, y, yaw: 0, nx: -1, nz: 0 };
}

/** Length of a plan's route, in metres. */
export function routeLength(plan: RealmPlan): number {
  let total = 0;
  for (let i = 0; i < plan.path.length - 1; i++) total += Math.hypot(plan.path[i + 1]![0] - plan.path[i]![0], plan.path[i + 1]![1] - plan.path[i]![1]);
  return total;
}

/** Where a pocket's nook is, and where its branch leaves the route. */
export function pocketAt(plan: RealmPlan, pk: PocketDef): { mouth: RoutePoint; x: number; z: number; y: number } {
  const m = routeAt(plan, pk.at);
  const out = plan.width / 2 + (pk.len ?? 7);
  return { mouth: m, x: m.x + m.nx * pk.side * out, z: m.z + m.nz * pk.side * out, y: m.y + (pk.rise ?? 0) };
}

/**
 * Terrain half of the template, for TerrainDef.shape: cuts (or lays) the
 * route, levels a floor for each fight, and branches a short path to a
 * level nook for each pocket.
 */
export function carveRealm(s: Shaper, plan: RealmPlan): void {
  const canyon = plan.cut === 'canyon';
  s.path(plan.path, plan.width, canyon ? 2.5 : 3, true, !canyon);
  for (const a of plan.arenas ?? []) {
    const p = routeAt(plan, a.at);
    s.flatten(p.x, p.z, a.r + 1.5, p.y, canyon ? 2.5 : 4);
  }
  for (const pk of plan.pockets ?? []) {
    const { mouth, x, z, y } = pocketAt(plan, pk);
    s.path([[mouth.x, mouth.z, mouth.y], [x, z, y]], 3.6, 1.8, true, !canyon);
    s.flatten(x, z, pk.r ?? 3.5, y, 1.8);
  }
}

/** What layoutRealm built, for the level to hang its own moments on. */
export interface RealmLayout {
  arenas: Arena[];
  pockets: { x: number; z: number; y: number; def: PocketDef }[];
}

/**
 * Build half of the template: dresses both edges of the route in the plan's
 * style, lights it, lays the gem trail, starts each fight, and fills each
 * pocket with its secret (sealed at the mouth if the plan says so).
 */
export function layoutRealm(b: Builder, plan: RealmPlan): RealmLayout {
  const out: RealmLayout = { arenas: [], pockets: [] };
  const total = routeLength(plan);
  const r = b.decor.rng;
  const keepClear: [number, number, number][] = [];
  for (const a of plan.arenas ?? []) {
    const p = routeAt(plan, a.at);
    keepClear.push([p.x, p.z, a.r + 1]);
    const arena = b.arena(a.id, p.x, p.z, a.r, a.waves, a.reward);
    out.arenas.push(arena);
    // Ring the fight with its dressing so it reads as a place.
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + r.next() * 0.3;
      dressSpot(b, plan.dressing, p.x + Math.sin(ang) * (a.r + 2.5), p.z + Math.cos(ang) * (a.r + 2.5), 1.1);
    }
  }
  for (const pk of plan.pockets ?? []) {
    const { mouth, x, z, y } = pocketAt(plan, pk);
    keepClear.push([mouth.x + mouth.nx * pk.side * plan.width * 0.5, mouth.z + mouth.nz * pk.side * plan.width * 0.5, 3]);
    keepClear.push([x, z, (pk.r ?? 3.5) + 0.5]);
    out.pockets.push({ x, z, y, def: pk });
    placeReward(b, pk.reward, x, z, b.y(x, z));
    // A little light in every nook, so it catches the eye from the route.
    crystalCluster(b, x + mouth.nx * pk.side * ((pk.r ?? 3.5) - 0.8), z + mouth.nz * pk.side * ((pk.r ?? 3.5) - 0.8), 0.6, plan.lightColor ?? 0x8ff0e0);
    if (pk.seal) sealPocket(b, plan, pk, x, z);
  }
  const clear = (x: number, z: number) => keepClear.every(([cx, cz, cr]) => Math.hypot(x - cx, z - cz) > cr);
  // Edge dressing, both sides, every few metres.
  const step = 5.5 / (plan.density ?? 1);
  for (let d = step * 0.5; d < total; d += step) {
    const p = routeAt(plan, d / total);
    for (const s of [-1, 1]) {
      const off = plan.width / 2 + 1 + r.next() * 2.5;
      const x = p.x + p.nx * s * off;
      const z = p.z + p.nz * s * off;
      if (!clear(x, z)) continue;
      dressSpot(b, plan.dressing, x, z, 0.7 + r.next() * 0.6);
    }
  }
  // Features that span or line the route at intervals.
  const every = plan.dressing === 'ruins' ? 22 : plan.dressing === 'roots' ? 17 : 0;
  if (every) {
    for (let d = every * 0.6; d < total - 4; d += every) {
      const p = routeAt(plan, d / total);
      if (!clear(p.x, p.z)) continue;
      if (plan.dressing === 'ruins') archway(b, p.x, p.z, p.yaw, plan.width - 1.2, 4.6, 0x8a8298, b.y(p.x, p.z));
      else {
        const w = plan.width / 2 + 2.5;
        const y = b.y(p.x, p.z);
        hollowRoot(b, [[p.x - p.nx * w, y - 1, p.z - p.nz * w], [p.x - p.nx * w * 0.4, y + 5.5, p.z - p.nz * w * 0.4],
          [p.x + p.nx * w * 0.5, y + 6, p.z + p.nz * w * 0.5], [p.x + p.nx * (w + 1.5), y - 0.5, p.z + p.nz * (w + 1.5)]], 0.55 + r.next() * 0.25);
      }
    }
  }
  const lights = plan.lights ?? 16;
  if (lights > 0) {
    let k = 0;
    for (let d = lights * 0.5; d < total; d += lights) {
      const p = routeAt(plan, d / total);
      const s = k++ % 2 ? 1 : -1;
      const x = p.x + p.nx * s * (plan.width / 2 + 0.6);
      const z = p.z + p.nz * s * (plan.width / 2 + 0.6);
      if (plan.dressing === 'cavern' || plan.dressing === 'fungal') crystalCluster(b, x, z, 0.7, plan.lightColor ?? 0x8ff0e0);
      else lanternPost(b, x, z, plan.lightColor ?? 0xffd890, Math.atan2(-p.nx * s, -p.nz * s) - Math.PI / 2);
    }
  }
  if (plan.gems) {
    const pts: [number, number][] = [];
    for (let d = 2; d < total - 2; d += plan.gems) {
      const p = routeAt(plan, d / total);
      if (clear(p.x, p.z)) pts.push([p.x, p.z]);
    }
    for (const [x, z] of pts) b.gems(x, z, 'blue', 1);
  }
  return out;
}

/**
 * Closes a pocket at its nook's mouth. A canyon's nook is already a room cut
 * in the rock; on open ground a horseshoe of rock walls it in first.
 */
function sealPocket(b: Builder, plan: RealmPlan, pk: PocketDef, x: number, z: number): void {
  const { mouth } = pocketAt(plan, pk);
  const r = pk.r ?? 3.5;
  // From the nook toward the route.
  const bx = -mouth.nx * pk.side;
  const bz = -mouth.nz * pk.side;
  const back = Math.atan2(bx, bz);
  let gx = x + bx * (r + 0.3);
  let gz = z + bz * (r + 0.3);
  let half = 2.3;
  if (plan.cut !== 'canyon') {
    const R = r + 1.2;
    const open = 0.62;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 10; i++) {
      const a = back + open + (i / 10) * (Math.PI * 2 - open * 2);
      pts.push([x + Math.sin(a) * R, z + Math.cos(a) * R]);
    }
    if (plan.dressing === 'ruins') {
      // Old walls, broken to different heights.
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i]!;
        const [cx, cz] = pts[i + 1]!;
        b.wall(ax, az, cx, cz, b.y(ax, az) - 0.3, 3.4 + b.decor.rng.next() * 1.6, 0.9, 0x8a8298);
      }
    } else cavernWall(b, pts, 4.5, { thick: 1.6, color: ROCK.mid });
    gx = x + bx * R * Math.cos(open);
    gz = z + bz * R * Math.cos(open);
    half = R * Math.sin(open) + 0.6;
  }
  // Across the mouth: along the route's heading.
  const tx = Math.sin(mouth.yaw);
  const tz = Math.cos(mouth.yaw);
  if (pk.seal === 'roots') rootWall(b, gx - tx * half, gz - tz * half, gx + tx * half, gz + tz * half, 3.6, { element: 'fire' });
  else b.gate(gx, gz, half * 2, 3.6, mouth.yaw - Math.PI / 2, pk.seal!);
}

/** One piece of edge dressing in a style, at (x, z), roughly `s` in scale. */
function dressSpot(b: Builder, kind: Dressing, x: number, z: number, s: number): void {
  const r = b.decor.rng;
  const y = b.col.groundAt(x, z, 1e4, 0.3).y;
  if (y < -1e3 || y < b.level.waterLevel + 0.1) return;
  switch (kind) {
    case 'cavern':
      if (r.chance(0.55)) stalagmites(b, x, z, 1.2 * s, 2, { max: 3.8 * s });
      else b.decor.rock(x, y, z, 0.8 * s + r.next() * 0.5, ROCK.light);
      if (r.chance(0.25)) b.decor.glowCrystal(x + r.signed(), y, z + r.signed(), 1.2 * s, 0x8ff0e0);
      break;
    case 'fungal':
      b.decor.mushroom(x, y, z, 0.6 * s + r.next() * 0.6, CAP_COLORS[Math.floor(r.next() * CAP_COLORS.length)]!, true);
      if (r.chance(0.5)) b.decor.mushroom(x + r.signed() * 0.9, y, z + r.signed() * 0.9, 0.35 + r.next() * 0.3, CAP_COLORS[Math.floor(r.next() * CAP_COLORS.length)]!, true);
      if (r.chance(0.3)) b.decor.rock(x + r.signed(), y, z + r.signed(), 0.5 * s, ROCK.moss);
      break;
    case 'ruins':
      if (r.chance(0.45)) b.decor.pillar(x, y, z, 0.5 * s, 1 + r.next() * 3.5 * s, 0x8a8298, true);
      else b.decor.rock(x, y, z, 0.5 * s + r.next() * 0.4, 0x8a8298);
      if (r.chance(0.3)) b.decor.add(GEO.box(), mat(0x6e6878, { rough: 0.9, flat: true }), x + r.signed(), y + 0.25, z + r.signed(), 1.2 * s, 0.5, 0.8 * s, r.signed() * 0.2, r.next() * 6, r.signed() * 0.2);
      break;
    case 'roots': {
      b.decor.rock(x, y, z, 0.7 * s + r.next() * 0.5, ROCK.mid);
      if (r.chance(0.4)) {
        const a = r.next() * Math.PI * 2;
        hollowRoot(b, [[x, y - 0.6, z], [x + Math.sin(a) * 1.5, y + 1.2 * s, z + Math.cos(a) * 1.5], [x + Math.sin(a) * 3.2, y - 0.4, z + Math.cos(a) * 3.2]], 0.28 * s, { thorns: true });
      }
      break;
    }
  }
}

/** Places a pocket's secret at (x, y, z). */
function placeReward(b: Builder, rw: PocketReward, x: number, z: number, y: number): void {
  if ('egg' in rw) b.egg(rw.egg, x, z, y);
  else if ('letter' in rw) b.letter(rw.letter, x, z, y);
  else if ('relic' in rw) b.collectible(rw.relic, 'relic', x, z, y, rw.relicId);
  else if ('heart' in rw) b.collectible(rw.heart, 'heart', x, z, y);
  else if ('mana' in rw) b.collectible(rw.mana, 'mana', x, z, y);
  else if ('chest' in rw) {
    if (rw.iron) b.ironChest(rw.chest, x, z, 0, rw.loot, y);
    else b.chest(rw.chest, x, z, 0, rw.loot, y);
  } else b.crystal(x, z, 'mixed', rw.gems, true, y);
}

/** Is (x, z) within `margin` of a plan's route? Handy for keeping scatter off it. */
export function nearRoute(plan: RealmPlan, x: number, z: number, margin = 0): boolean {
  return segDist(plan.path, x, z).d < plan.width / 2 + margin;
}
