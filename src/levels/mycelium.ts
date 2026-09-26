import * as THREE from 'three';
import type { LevelDef, Builder } from '../world/level';
import { ambient, bossFight, jitter, mix } from './common';
import type { Game } from '../game/game';
import type { Line } from '../ui/dialogue';
import type { Hit, HitResult, Hittable } from '../game/types';
import { Hazard, Portal, Talker, type Prop } from '../entities/props';
import { makeCyl, type Solid } from '../world/collision';
import { GEO } from '../render/decor';
import { mat, glowShared } from '../render/materials';
import { ellipsoid, limb, mergeStatic, taperedTube } from '../render/shapes';
import { clamp01, smoothstep } from '../core/math';
import { rng } from '../core/rng';
import { skillKey } from '../game/skills';
import {
  ROCK, archway, carveRealm, caveCeiling, crystalCluster, dragonStatue, hollowRoot, lanternPost, layoutRealm, nearRoute,
  rootWall, stalagmites, type RealmPlan, type RootGate,
} from '../world/kits';
import {
  BlightCloud, CAP_TAG, SPORE, blightCloud, capMat, rotMat, stalkMat, bounceCap, capDoor, glowthread, lightBridge, liftCap, shelfCap, sporeVent, TwinLock, type BounceCap,
} from '../entities/fungi';
import { Mycora, buildMycoraArena } from '../enemies/bosses/mycora';

/**
 * The Mycelium Deep: Act II's first realm, behind the Hollow Gate's eastern
 * gate. A fungal underworld the size of a country, once the old dragons'
 * gardens, now the Hollow King's larder: Mycora, the Spore Mother, has wed
 * her threads to his roots, and the Deep feeds the roots that seal the
 * Hollow's gates.
 *
 * The way runs north (+z), area by area:
 *   the Sporefall      (0, 16)    entry cavern, spores falling like snow; the Glimmer Pools off to the east
 *   the Capstair       (0, 60)    a chasm climbed on bounce caps and bracket fungi, up to the gardens
 *   the Threadworks    (0, 118)   the old dragon garden: glowthreads, a spore vent, a blight passage, a bridge of light
 *   the Rotting Market (58, 174)  the Burrowfolk's foraging outpost: cocooned foragers, the Thornpit, Blight Row
 *   the Rootchoke      (22, 190)  where the King's roots come through: Rootspawn country
 *   Mycora's Grove     (0, 230)   the boss (floor radius 24, entered from the south, trigger at (0, 204))
 *
 * The connecting routes use the realm template (src/world/kits.ts); the
 * puzzles are the Deep's own props (src/entities/fungi.ts).
 */

const WL = -1;
/** The Threadworks' plateau, the terrace above it, the Market, the Rootchoke and the grove floor. */
const TOP = 25;
const TERRACE = { x: 0, z: 140, y: 32 };
const SPAWN = { x: 0, z: -3 };
const GATE = { x: 0, z: -13 };
const FALL = { x: 0, z: 15 };
const MOTHER = { x: -17, z: 27 };
const POOL = { x: 9, z: 29 };
const GLIM = { x: 48, z: 24 };
const DEEP = { x: 45, z: 27 };
const SHALLOW = { x: 55, z: 35 };
const CELLAR = { x: -32, z: 9 };
const GARDEN = { x: 0, z: 117 };
const WEST = { x: -32, z: 116 };
const EAST = { x: 31, z: 113 };
const GORGE = { x: 32, z: 140 };
const MARKET = { x: 58, z: 174, y: 16 };
const NOOK = { x: 80, z: 144 };
const PIT = { x: 93, z: 172, y: 14 };
const PERCH = { x: 106, z: 172, y: 29 };
const CHOKE = { x: 24, z: 188, y: 10 };
const HOLLOW = { x: 24, z: 162 };
const GROVE = { x: 0, z: 230, y: 8, r: 24 };

/** The Capstair's chasm, and the glowing stream down its floor into the Sporefall's pool. */
const CHASM: [number, number, number][] = [[0, 34, 0], [0, 87, 0]];
const STREAM: [number, number, number][] = [[0, 93, -1.8], [1.5, 70, -1.8], [4, 50, -1.8], [8, 32, -1.8]];

/** From the Sporefall east through a low tunnel to the Glimmer Pools. */
const GLIMWAY: RealmPlan = {
  path: [[19, 17, 0], [28, 19, 0], [36, 21, 0]], width: 7, cut: 'canyon', dressing: 'cavern', lights: 7, lightColor: SPORE.teal, gems: 2.2, density: 1.1,
};

/** Down from the Threadworks' east ledge to the Rotting Market. */
const DESCENT: RealmPlan = {
  path: [[45, 140, 32], [50, 146, 29.5], [55, 152, 25], [58.5, 158, 20.5], [60, 164, 16.5]], width: 6, cut: 'canyon', dressing: 'cavern',
  lights: 9, lightColor: SPORE.gold, gems: 2.6, density: 1.2,
  pockets: [{ at: 0.45, side: 1, len: 5, r: 3, reward: { gems: 28 }, seal: 'rock' }],
};

/** West out of the Market into the Rootchoke. */
const ROOTWAY: RealmPlan = {
  path: [[45, 181, 16], [39, 184.5, 13], [33, 187, 10]], width: 6.5, cut: 'canyon', dressing: 'roots', lights: 8, lightColor: SPORE.violet, gems: 2.5,
};

/** From the Rootchoke to the mouth of Mycora's Grove. */
const MOUTH: RealmPlan = {
  path: [[15, 192, 10], [6, 199, 9], [0, 206, 8], [0, 212, 8]], width: 7, cut: 'canyon', dressing: 'roots', lights: 7, lightColor: SPORE.pink,
};

/** Glow colors shared across the Deep's scenery (each color is an instanced batch, so few of them). */
const SPOT = 0xfff4d8;
const SILK = 0xd8c8ff;
const GILL = 0x4a2a6a;
const ROT = 0x7a7a58;

const C = {
  bed: 0x0a2e3c, bedShallow: 0x1a6e6a, shore: 0x2a5058, loam: 0x3e2c46, loam2: 0x543a5e, mat: 0x6a5a8a, moss: 0x245e5c,
  stone: 0x575262, stone2: 0x696276, grout: 0x3a3446, rot: 0x3e3e34, rot2: 0x4e4a3c, dark: 0x2c1e36, dark2: 0x3c2848, rock: 0x5a4e74, rockHi: 0x70628c, strata: 0x9484b8, path: 0x6a5a80,
};

export const mycelium: LevelDef = {
  id: 'mycelium',
  name: 'The Mycelium Deep',
  subtitle: 'Where the spores fall like snow',
  music: 'mycelium',
  killY: -30,
  spawn: [SPAWN.x, SPAWN.z, 0],
  sky: {
    top: 0x080510, horizon: 0x2a1840, bottom: 0x06040a, sunDir: [0.3, 0.78, -0.55], sunColor: 0xe8d0ff, sunIntensity: 1.35,
    hemiSky: 0x9a70e0, hemiGround: 0x2a8a80, hemiIntensity: 2.15, fogNear: 26, fogFar: 150, stars: 0, fog: 0x1e1230, clouds: 0,
  },
  water: { level: WL, deep: 0x0a3a52, shallow: 0x30d8c0, glint: 0xc0fff0, opacity: 0.78, swim: true },
  terrain: {
    x0: -62, z0: -32, sizeX: 180, sizeZ: 300, cell: 1.5,
    color: (x, z, h, slope, path) => {
      let c: number;
      const n = Math.sin(x * 0.23 + z * 0.11) * 0.5 + Math.sin(x * 0.06 - z * 0.13) * 0.5;
      if (h < WL + 0.4) c = mix(C.bed, C.bedShallow, clamp01((h + 6) / 5.5));
      else if (h < WL + 1.3) c = mix(C.bedShallow, C.shore, (h - WL - 0.4) / 0.9);
      else {
        // Loam, mottled: dark hollows and paler drifts where the spores settle.
        const m2 = Math.sin(x * 0.53 - z * 0.41) * Math.sin(x * 0.19 + z * 0.37);
        c = mix(C.loam, C.loam2, clamp01(n * 0.5 + 0.5 + m2 * 0.35));
        c = mix(c, 0x5a4a64, smoothstep(0.55, 0.95, m2) * 0.5);
        // The old gardens' stone up top; rot in the Market; dark root-soil toward the grove.
        c = mix(c, mix(C.stone, C.stone2, n * 0.5 + 0.5), smoothstep(20, 24, h) * (1 - smoothstep(38, 46, x)));
        const market = (1 - smoothstep(22, 30, Math.hypot(x - MARKET.x, z - MARKET.z))) + (1 - smoothstep(10, 16, Math.hypot(x - PIT.x, z - PIT.z)));
        c = mix(c, mix(C.rot, C.rot2, n * 0.5 + 0.5), clamp01(market) * 0.85);
        c = mix(c, mix(C.dark, C.dark2, n * 0.5 + 0.5), smoothstep(176, 196, z) * (1 - smoothstep(40, 48, x)));
        // Mycora's floor: a rosette of her threads, rays and rings, all leading in to the middle.
        const gd = Math.hypot(x - GROVE.x, z - GROVE.z);
        if (gd < 30) {
          const ga = Math.atan2(x - GROVE.x, z - GROVE.z);
          const rays = smoothstep(0.82, 1, Math.abs(Math.sin(ga * 9 + gd * 0.08)));
          const rings = smoothstep(0.88, 1, Math.abs(Math.sin(gd * 0.55)));
          c = mix(c, 0x7a4a9a, Math.max(rays, rings * 0.8) * 0.55 * (1 - smoothstep(22, 29, gd)));
          c = mix(c, 0x6a3a8a, (1 - smoothstep(0, 6, gd)) * 0.5);
        }
        c = mix(c, C.moss, (1 - smoothstep(0.6, 2.2, h - WL)) * 0.7);
      }
      if (slope > 0.7) {
        // Cave walls: banded strata, with pale threads of mycelium running through the bands.
        const band = Math.sin(h * 0.42 + Math.sin(x * 0.07 + z * 0.05) * 2.4) * 0.5 + 0.5;
        let w = mix(C.rock, C.rockHi, band * 0.8 + n * 0.2);
        w = mix(w, C.strata, smoothstep(0.86, 0.98, band) * 0.7);
        c = mix(c, w, clamp01((slope - 0.7) * 1.6));
      }
      if (path > 0) c = mix(c, C.path, path * 0.5);
      return c;
    },
    shape: (s) => {
      // Solid rock, with the Deep's caverns hollowed out of it.
      s.base(75).noise(6, 0.035, 5);
      // --- the Sporefall, its vestibule and the gate cellar.
      s.flatten(FALL.x, FALL.z, 24, 0, 13);
      s.flatten(GATE.x, GATE.z + 5, 8, 0, 5);
      s.path([[-19, 9, 0], [CELLAR.x, CELLAR.z, 0]], 4, 1.6, false, false);
      s.flatten(CELLAR.x, CELLAR.z, 3.4, 0, 2);
      for (const [x, z, r, h] of [[-12, 4, 5, 0.8], [14, 4, 6, 0.7], [-19, 16, 5, 1.1], [18, 32, 5, 0.9], [-8, 36, 4, 0.6], [22, 12, 4, 0.9]] as [number, number, number, number][]) s.mound(x, z, r, h);
      // --- the Glimmer Pools.
      s.flatten(GLIM.x, GLIM.z, 13, 0, 9);
      s.flatten(52, 11, 9, 0, 5);
      carveRealm(s, GLIMWAY);
      s.pit(DEEP.x, DEEP.z, 6.5, -6.2, 3);
      s.pit(SHALLOW.x, SHALLOW.z, 4, -3.2, 2);
      // A grotto in the pools' east wall, choked with blight.
      s.path([[58, 27, 0], [66, 27, 0]], 3.6, 1.2, false, false);
      s.flatten(66.5, 27, 2.4, 0, 1.5);
      s.path([[DEEP.x + 4, DEEP.z + 3, -2.6], [SHALLOW.x - 2, SHALLOW.z - 2, -2.6]], 3.2, 1.5, false, false);
      // --- the Threadworks: the old garden's plateau, its wings, and the terrace cut into the north wall.
      s.flatten(0, 118, 20, TOP, 7);
      s.path([[-11, 116, TOP], [-24, 116, TOP]], 6, 2.2, false, false);
      s.flatten(WEST.x, WEST.z, 8, TOP, 5);
      s.path([[11, 112, TOP], [23, 112, TOP]], 6, 2.2, false, false);
      s.flatten(EAST.x, EAST.z, 8, TOP, 4);
      s.flatten(TERRACE.x, TERRACE.z, 9, TERRACE.y, 2);
      // The blight passage, the gorge the light bridge spans, and the ledge beyond.
      s.path([[7, TERRACE.z, TERRACE.y], [23, TERRACE.z, TERRACE.y]], 4.4, 1.2, false, false);
      s.flatten(GORGE.x, GORGE.z, 7.5, 4, 1.5);
      s.path([[43.5, TERRACE.z, TERRACE.y], [46, TERRACE.z, TERRACE.y]], 6, 1.5, false, false);
      // --- the Rotting Market, Blight Row and the Thornpit.
      s.flatten(MARKET.x, MARKET.z, 17, MARKET.y, 9);
      s.path([[64, 162, 16], [70, 155.5, 16], [75, 150, 16], [NOOK.x, NOOK.z, 16]], 3.8, 1.4, false, false);
      s.flatten(NOOK.x, NOOK.z, 3.6, 16, 2);
      s.flatten(PIT.x, PIT.z, 9, PIT.y, 4);
      s.path([[73, 172, 16], [84, 172, 16]], 6, 2, false, false);
      s.flatten(PERCH.x, PERCH.z, 3.2, PERCH.y, 1.2);
      // --- the Rootchoke and the Strangled Hollow off its south side.
      s.flatten(CHOKE.x, CHOKE.z, 12, CHOKE.y, 5);
      s.flatten(HOLLOW.x, HOLLOW.z, 8.5, CHOKE.y, 5);
      s.path([[CHOKE.x, 177, CHOKE.y], [HOLLOW.x, 168, CHOKE.y]], 4, 1.5, false, false);
      // --- Mycora's Grove: a round floor, flat and clear well past radius 24.
      s.flatten(GROVE.x, GROVE.z, 27, GROVE.y, 8);
      // The routes, from the template.
      carveRealm(s, DESCENT);
      carveRealm(s, ROOTWAY);
      carveRealm(s, MOUTH);
      // The Capstair's chasm last, cut down through the garden's edge; the stream and pool on its floor.
      s.path(CHASM, 18, 3, false, false);
      s.path(STREAM, 2.6, 1.1, false, false);
      s.pit(POOL.x, POOL.z, 4.5, -2.8, 2);
    },
  },

  build(b: Builder) {
    const g = b.game;
    ambient(b, 'pollen', 7);
    b.bound(-58, -28, 114, -28);
    b.bound(114, -28, 114, 264);
    b.bound(114, 264, -58, 264);
    b.bound(-58, 264, -58, -28);
    const wm = b.level.water?.mesh.material as THREE.Material | undefined;
    if (wm) wm.side = THREE.DoubleSide;

    const pulses = new Pulses(g);
    b.level.props.push(pulses);
    ceiling(b);
    vestibule(b);
    sporefall(b, pulses);
    motherstalk(b);
    glimmerPools(b);
    const floorCap = capstair(b, pulses);
    threadworks(b, pulses);
    descent(b);
    market(b);
    blightRow(b);
    thornpit(b);
    rootchoke(b, pulses);
    grove(b);
    trackers(b, floorCap);
    // Nothing worth standing on is this high: a dragon who scrambled up the cavern walls is set back down.
    b.level.props.push({
      update: () => {
        const p = g.player;
        const top = p.z > 96 ? 46 : p.z > 60 ? 30 : 24;
        if (p.body.grounded && p.y > top && p.state === 'move' && p.body.ground === null) {
          g.hud.flick('Too steep up here, Aster! Back down we go.', 3);
          g.playerFell();
        }
      },
    });
  },

  onEnter(g, fresh) {
    if (!g.save.found['story:mycelium:arrive']) {
      g.save.found['story:mycelium:arrive'] = true;
      arrive(g);
      return;
    }
    if (fresh) g.hud.flick(g.save.levelsDone.mycelium ? 'The Deep\'s quiet now. Mostly. Tap H if you want me to sniff out what\'s left.' : 'Back in the Deep. Tap H and I\'ll sniff out anything shiny.', 5);
  },
};

// --- small helpers ----------------------------------------------------------------------------------

/** Foes that only turn up once Aster comes within `r` of (x, z). */
function lazyEnemies(b: Builder, x: number, z: number, r: number, list: [string, number, number, number][]): void {
  const g = b.game;
  b.trigger(x, z, r, () => {
    for (const [type, ex, ez, yaw] of list) g.pendingSpawns.push({ type, x: ex, y: g.col.groundAt(ex, ez, 1e4, 0.3).y + 0.05, z: ez, yaw });
  });
}

/** Flick's word the first time Aster comes near any of `pts` (once per save). */
function firstNear(b: Builder, key: string, pts: [number, number][], r: number, text: string, secs = 7): void {
  const g = b.game;
  const k = `story:mycelium:${key}`;
  if (g.save.found[k]) return;
  b.level.props.push({
    update: () => {
      if (g.save.found[k] || g.state !== 'play') return;
      const p = g.player;
      if (!pts.some(([x, z]) => Math.hypot(p.x - x, p.z - z) < r && Math.abs(p.y - g.col.groundAt(x, z, 1e4, 0.3).y) < 8)) return;
      g.save.found[k] = true;
      g.hud.flick(text, secs);
    },
  });
}

/**
 * A thread of mycelium light laid over rock or ground through `pts`: a thin
 * glowing tube, merged with the level's statics, and (if `pulses`) a bead of
 * light that now and then runs along it.
 */
function vein(b: Builder, pts: [number, number, number][], r: number, color: number, pulses?: Pulses): void {
  const v = pts.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const geo = taperedTube(v, r, r * 0.6, Math.max(6, pts.length * 5), 4, true);
  geo.computeBoundingSphere();
  const c = geo.boundingSphere!.center.clone();
  geo.translate(-c.x, 0, -c.z);
  const m = new THREE.Mesh(geo, glowShared(color));
  m.position.set(c.x, 0, c.z);
  b.addStatic(m);
  pulses?.add(new THREE.CatmullRomCurve3(v), color);
}

/**
 * Beads of light running along the Deep's threads: one instanced mesh for
 * all of them, and only the threads near the dragon get beads.
 */
class Pulses implements Prop {
  private curves: { c: THREE.CatmullRomCurve3; len: number; mid: THREE.Vector3; t: number; speed: number; color: THREE.Color }[] = [];
  private mesh: THREE.InstancedMesh;
  private m4 = new THREE.Matrix4();
  private p = new THREE.Vector3();
  private static readonly MAX = 48;

  constructor(private game: Game) {
    this.mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.2, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), Pulses.MAX);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    game.level!.root.add(this.mesh);
  }

  add(c: THREE.CatmullRomCurve3, color: number): void {
    const len = c.getLength();
    this.curves.push({ c, len, mid: c.getPointAt(0.5), t: rng.next(), speed: 3 + rng.next() * 3, color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.5) });
  }

  update(dt: number): void {
    const pl = this.game.player;
    let n = 0;
    for (const k of this.curves) {
      if (n >= Pulses.MAX) break;
      if (Math.hypot(k.mid.x - pl.x, k.mid.z - pl.z) > 50 + k.len * 0.5) continue;
      // A bead runs along, then the thread rests a little before the next.
      k.t += (dt * k.speed) / Math.max(4, k.len);
      if (k.t > 1.6) k.t = 0;
      if (k.t > 1) continue;
      k.c.getPointAt(k.t, this.p);
      this.m4.makeScale(1, 1, 1).setPosition(this.p);
      this.mesh.setMatrixAt(n, this.m4);
      this.mesh.setColorAt(n, k.color);
      n++;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

/**
 * Points climbing a wall: from (x, z), marching along (dx, dz) at each
 * height from y0 to y1 until the rock is reached, so a thread laid through
 * them hugs the wall instead of hanging in front of it. `wiggle` sways it
 * side to side.
 */
function wallPath(b: Builder, x: number, z: number, dx: number, dz: number, y0: number, y1: number, n: number, wiggle = 0): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let k = 0; k <= n; k++) {
    const y = y0 + ((y1 - y0) * k) / n;
    const o = Math.sin(k * 1.7 + x * 0.3 + z * 0.2) * wiggle;
    const sx = x - dz * o;
    const sz = z + dx * o;
    let t = 0;
    while (t < 24 && b.col.terrainAt(sx + dx * t, sz + dz * t) < y) t += 0.15;
    t = Math.max(0, t - 0.2);
    out.push([sx + dx * t, y, sz + dz * t]);
  }
  return out;
}

/**
 * Patches of glowing lichen on the walls either side of a north-south
 * passage centred on x = cx, between z0 and z1: `n` spots from the floor up
 * to height `top`, found by marching out to the rock. They give dark walls
 * a shape.
 */
function lichen(b: Builder, cx: number, hw: number, z0: number, z1: number, y0: number, top: number, n: number): void {
  const r = b.decor.rng;
  const cols = [glowShared(SPORE.teal), glowShared(SPORE.violet), glowShared(SPOT)];
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1;
    const z = z0 + r.next() * (z1 - z0);
    const y = y0 + r.next() * top;
    let t = 0;
    const x0 = cx + side * (hw - 2);
    while (t < 24 && b.col.terrainAt(x0 + side * t, z) < y) t += 0.15;
    const x = x0 + side * t - side * 0.05;
    const s = 0.12 + r.next() * 0.28;
    b.decor.add(GEO.blobLow(), cols[i % 3]!, x, y, z, s * 0.4, s, s, 0, 0, 0, false);
    if (i % 3 === 0) b.decor.add(GEO.blobLow(), cols[(i + 1) % 3]!, x, y + s * 1.6, z + s * 1.2, s * 0.3, s * 0.6, s * 0.6, 0, 0, 0, false);
  }
}

/** A flat mat of pale mycelium on the ground (decor only). */
function sporeMat(b: Builder, x: number, z: number, s: number): void {
  const y = b.col.groundAt(x, z, 1e4, 0.2).y;
  if (y < WL + 0.2) return;
  b.decor.add(GEO.cyl(), mat(0x4e3e6e, { rough: 1, emissive: 0x3a2a70, emissiveIntensity: 0.4 }), x, y - 0.02, z, s, 0.06, s * (0.6 + b.decor.rng.next() * 0.5), 0, b.decor.rng.next() * 6, 0, false);
}

/** A little knot of glowing mushrooms at (x, z), on a mat of mycelium. */
function caps(b: Builder, x: number, z: number, n: number, colors: number[], spread = 1): void {
  sporeMat(b, x, z, spread * 1.1);
  for (let i = 0; i < n; i++) {
    const px = x + jitter(i + x, 1) * spread;
    const pz = z + jitter(i + z, 2) * spread;
    const y = b.col.groundAt(px, pz, 1e4, 0.2).y;
    if (y < WL + 0.1) continue;
    b.decor.mushroom(px, y, pz, 0.35 + Math.abs(jitter(i + x * z, 3)) * 0.6, colors[i % colors.length]!, true);
  }
}

/** A giant glowing mushroom (scenery): thick stalk, standable cap. Returns the cap's top. */
function giantCap(b: Builder, x: number, z: number, h: number, r: number, color: number, y?: number): number {
  const gy = y ?? b.y(x, z);
  const stalk = stalkMat();
  const sr = 0.35 + r * 0.13;
  b.decor.add(GEO.cyl(), stalk, x, gy - 0.3, z, sr, h + 0.3, sr);
  b.decor.add(GEO.cyl(), stalk, x, gy - 0.3, z, sr * 1.7, 0.9, sr * 1.7);
  b.decor.add(GEO.cap(), capMat(color), x, gy + h, z, r, r * 0.46, r, 0, x, 0);
  b.decor.add(GEO.cyl(), mat(0x2a1a38, { rough: 1 }), x, gy + h - 0.06, z, r * 0.95, 0.1, r * 0.95, 0, 0, 0, false);
  for (let k = 0; k < 6; k++) {
    const a = k * 1.1 + x;
    const d = r * (0.3 + (k % 3) * 0.18);
    b.decor.add(GEO.blobLow(), glowShared(SPOT), x + Math.sin(a) * d, gy + h + r * 0.46 * Math.sqrt(1 - (d / r) ** 2) - 0.05, z + Math.cos(a) * d, 0.18 + r * 0.03, 0.06, 0.18 + r * 0.03, 0, 0, 0, false);
  }
  b.col.add(makeCyl(x, z, sr + 0.05, gy - 1, gy + h));
  const top = gy + h + r * 0.32;
  const s = makeCyl(x, z, r * 0.8, gy + h - 0.25, top);
  s.surface = 'mud';
  b.col.add(s);
  return top;
}

/**
 * A great bracket fungus jutting out of a wall at (x, y, z) toward `yaw`:
 * a flattened glowing cap with gills beneath. Scenery only (out of reach).
 */
function bracket(b: Builder, x: number, y: number, z: number, r: number, yaw: number, color: number): void {
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  b.decor.add(GEO.cap(), capMat(color), x + fx * r * 0.3, y, z + fz * r * 0.3, r, r * 0.3, r * 1.15, 0, yaw, 0, false);
  b.decor.add(GEO.cyl(), glowShared(GILL), x + fx * r * 0.3, y - 0.12, z + fz * r * 0.3, r * 0.94, 0.1, r * 1.08, 0, yaw, 0, false);
  b.decor.add(GEO.cyl(), glowShared(SPOT), x + fx * r * 0.3, y - 0.05, z + fz * r * 0.3, r * 1.01, 0.05, r * 1.16, 0, yaw, 0, false);
}

// --- the cavern ---------------------------------------------------------------------------------------

/** One vaulted ceiling over the whole Deep: gold and teal glow-worms, stalactites, hanging spore sacs. */
function ceiling(b: Builder): void {
  const height = caveCeiling(b, 25, 118, 190, 310, 44, { rise: 20, glowworms: 520, wormColor: SPORE.gold, stalactites: 110 });
  const teal = glowShared(SPORE.teal);
  const sac = glowShared(0xff9ae0);
  const r = b.decor.rng;
  for (let i = 0; i < 160; i++) {
    const x = -50 + r.next() * 160;
    const z = -25 + r.next() * 285;
    const y = height(x, z);
    b.decor.add(GEO.blobLow(), i % 3 ? teal : sac, x, y - 0.6, z, 0.2, 0.2, 0.2, 0, 0, 0, false);
    if (i % 3 === 0) b.decor.add(GEO.strand(), teal, x, y - 0.4, z, 0.5, 1 + r.next() * 3, 0.5, 0, 0, 0, false);
    // Spore sacs on long threads, glowing pink.
    if (i % 7 === 0) {
      const len = 4 + r.next() * 7;
      b.decor.add(GEO.strand(), teal, x, y - 0.4, z, 0.35, len, 0.35, 0, 0, 0, false);
      b.decor.add(GEO.blob(), sac, x, y - 0.4 - len, z, 0.45, 0.6, 0.45, 0, 0, 0, false);
    }
  }
}

/** Where Aster comes in: the far side of the Hollow's eastern gate, and the way back through it. */
function vestibule(b: Builder): void {
  const g = b.game;
  const { x, z } = GATE;
  const y = b.y(x, z);
  // The gate's inner face: great pillars and a lintel, roots over the top, the portal home in the arch.
  archway(b, x, z - 0.8, 0, 5.2, 7.5, 0x7a6a98, y);
  b.decor.add(GEO.box(), mat(0x2a2434, { rough: 0.95, flat: true }), x, y + 4, z - 2.2, 12, 10, 1.4);
  hollowRoot(b, [[x - 7, y - 0.5, z - 1], [x - 3, y + 7, z - 0.5], [x + 2, y + 9.5, z - 0.8], [x + 7, y + 3, z - 1.5]], 0.8);
  hollowRoot(b, [[x + 6, y - 0.5, z + 1], [x + 4.5, y + 4, z - 0.3], [x + 5.5, y + 10, z - 1.2]], 0.5);
  b.portal(x, z, 0, 'hollow', 'Back through the gate to the Hollow Gate', 0xc890ff);
  crystalCluster(b, x - 5, z + 2, 1.1, SPORE.violet);
  crystalCluster(b, x + 5.5, z + 1.5, 0.9, SPORE.teal);
  // Burrowfolk trail-markers: little lamps the foragers left to find their way home.
  lanternPost(b, x - 3, z + 5, SPORE.gold, 0.3);
  lanternPost(b, x + 3.2, z + 7, SPORE.gold, Math.PI - 0.3);
  b.gems(x, z + 8, 'blue', 5, 1.3);
  stalagmites(b, x - 7, z + 3, 2.5, 3, { max: 5, glow: SPORE.teal });
  stalagmites(b, x + 8, z + 4, 2.5, 3, { max: 4, glow: SPORE.violet });
  void g;
}

// --- the Sporefall -----------------------------------------------------------------------------------

function sporefall(b: Builder, pulses: Pulses): void {
  const g = b.game;
  b.checkpoint('sporefall', 7, 5, Math.PI * 0.1);
  // The spore-fall itself: a shaft of golden light from a crack in the vault, spores pouring down it into the pool.
  sporeShaft(b, POOL.x, POOL.z);
  crystalCluster(b, POOL.x + 4.5, POOL.z - 3, 1.0, SPORE.teal);
  crystalCluster(b, POOL.x - 4, POOL.z + 3.5, 0.8, SPORE.violet);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const px = POOL.x + Math.sin(a) * 3.2;
    const pz = POOL.z + Math.cos(a) * 3.2;
    b.decor.add(GEO.disc(), mat(0x2a8a78, { rough: 0.7, emissive: 0x1a6a5a, emissiveIntensity: 0.6, side: THREE.DoubleSide }), px, WL + 0.03, pz, 0.5 + (i % 3) * 0.2, 1, 0.5 + (i % 3) * 0.2, 0, i, 0, false);
  }
  // A foragers' camp by the way in: a cold fire, a bedroll, baskets, and a note.
  const cx = -10;
  const cz = 5;
  const cy = b.y(cx, cz);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.decor.rock(cx + Math.sin(a) * 1, cy - 0.1, cz + Math.cos(a) * 1, 0.28, 0x4a4454);
  }
  b.decor.add(GEO.box(), mat(0x6a4a5a, { rough: 1 }), cx + 2.2, cy + 0.08, cz - 0.8, 0.9, 0.16, 2, 0, 0.4, 0);
  b.letter('forager', cx + 1.4, cz + 1.2, cy);
  b.breakables('basket', [[cx - 1.8, cz + 1.8], [cx - 2.5, cz + 0.6], [cx - 1.6, cz - 1.9]]);
  lanternPost(b, cx + 1.8, cz - 2.6, SPORE.gold, 1.2);
  b.story('camp', cx, cz, 5, () => g.hud.flick('A forager\'s camp. The fire\'s been cold for days, Aster. They left their baskets.', 6));

  // First foes: sporelings, sniffing round the spore-fall.
  lazyEnemies(b, 6, 26, 17, [['sporeling', 4, 30, Math.PI], ['sporeling', 10, 34, Math.PI], ['sporeling', -2, 33, Math.PI * 0.9], ['sporeling', 14, 27, -Math.PI * 0.6]]);
  firstNear(b, 'sporelings', [[6, 26]], 15, 'Little spore-things! They look like mushrooms that learned to run. Horns and tail, Aster!', 6);

  // The Nursery: a fight at the foot of the Capstair.
  const ar = b.arena('nursery', 0, 38, 11, [
    [{ type: 'sporeling', x: -5, z: 44 }, { type: 'sporeling', x: 5, z: 44, delay: 0.2 }, { type: 'sporeling', x: 0, z: 47, delay: 0.4 }, { type: 'puffcap', x: 7, z: 33, delay: 0.6 }],
    [{ type: 'puffcap', x: -7, z: 42 }, { type: 'grunt', x: 4, z: 30, delay: 0.3 }, { type: 'sporeling', x: -3, z: 30, delay: 0.5 }, { type: 'sporeling', x: 7, z: 41, delay: 0.7 }],
  ], 45);
  ar.onStart = () => {
    if (g.save.found['story:mycelium:nursery']) return;
    g.save.found['story:mycelium:nursery'] = true;
    g.hud.flick('A whole nursery of them! The puffy ones spit spores: go for those first!', 6);
  };
  ar.onClear = () => g.partner.say('The chasm ahead climbs toward the gardens. Those caps on the walls... we\'re meant to go up.', 5.5, true);

  // An egg thief, off with an egg across the open floor.
  b.eggThief('thief', 14, 12, 20);
  // A cellar the foragers dug into the west wall, barred with planks.
  const [dx, dz] = [CELLAR.x + 3.9, CELLAR.z];
  b.gate(dx, dz, 3.6, 3.2, Math.PI / 2, 'wood');
  b.chest('cellar', CELLAR.x - 0.6, CELLAR.z, Math.PI / 2, { blue: 32, red: 2, green: 1 });
  b.pile(CELLAR.x + 0.4, CELLAR.z + 2.2, 0.8, 3, ['crate', 'basket', 'crate']);
  lanternPost(b, CELLAR.x + 1.6, CELLAR.z - 2.2, SPORE.gold, Math.PI);
  b.story('cellar', dx + 4, dz, 4, () => g.hud.flick('A store-cellar, boarded up. Charge it down (Hold Shift)!', 5));

  // Scenery: mats of mycelium, caps, crystals, stalagmites round the walls, threads of light up them.
  const r = b.decor.rng;
  for (let i = 0; i < 24; i++) {
    const a = r.next() * Math.PI * 2;
    const d = 5 + r.next() * 20;
    sporeMat(b, FALL.x + Math.sin(a) * d, FALL.z + Math.cos(a) * d, 0.5 + r.next() * 0.8);
  }
  for (const [x, z, n] of [[-20, 4, 6], [19, 6, 5], [-6, 30, 4], [16, 36, 5], [-22, 20, 6], [23, 24, 4], [-12, -4, 4], [11, -6, 3]] as [number, number, number][]) {
    caps(b, x, z, n, [SPORE.violet, SPORE.teal, SPORE.pink], 1.6);
  }
  giantCap(b, 19, 34, 6.2, 3.4, SPORE.teal);
  giantCap(b, 15.5, 31, 4.2, 2.2, SPORE.violet);
  caps(b, 20, 30, 6, [SPORE.teal, SPORE.pink], 2.2);
  for (const [x, z, sc, c] of [[-22, 10, 1.2, SPORE.violet], [21, 20, 1.0, SPORE.teal], [-5, 42, 0.8, SPORE.teal], [14, -2, 0.9, SPORE.violet], [-16, -2, 0.8, SPORE.teal]] as [number, number, number, number][]) {
    crystalCluster(b, x, z, sc, c);
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + jitter(i, 4) * 0.15;
    const x = FALL.x + Math.sin(a) * 27;
    const z = FALL.z + Math.cos(a) * 25;
    if (Math.abs(x) < 11 && z > 30) continue;
    if (Math.hypot(x - GATE.x, z - GATE.z) < 9 || (x > 16 && Math.abs(z - 19) < 6)) continue;
    stalagmites(b, x, z, 3.5, 3, { max: 7, glow: i % 2 ? SPORE.violet : SPORE.teal });
  }
  // Threads of light running up the walls.
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    const x0 = FALL.x + Math.sin(a) * 26;
    const z0 = FALL.z + Math.cos(a) * 24;
    if ((Math.abs(x0) < 12 && z0 > 30) || z0 < -6) continue;
    const pts: [number, number, number][] = [];
    for (let k = 0; k <= 5; k++) {
      const rr = 26 + k * 2.2;
      const px = FALL.x + Math.sin(a + Math.sin(k * 1.3 + i) * 0.05) * rr;
      const pz = FALL.z + Math.cos(a + Math.sin(k * 1.3 + i) * 0.05) * (rr - 2);
      pts.push([px, b.col.terrainAt(px, pz) + 0.15, pz]);
    }
    vein(b, pts, 0.09, i % 2 ? SPORE.teal : SPORE.gold, pulses);
  }
  // Gems along the way north, and round the pool.
  b.gemLine([[0, 2], [0, 12], [-3, 22], [0, 30]], 'blue', 2.2);
  b.gems(POOL.x, POOL.z, 'blue', 6, 3.8);
  b.breakables('pod', [[16, 10], [17.2, 11.4], [-18, 26], [-4, 40], [5, 42]]);
  b.pile(20, -2, 1.1, 3, ['crate', 'barrel', 'basket']);
  b.story('sporefall', 2, 16, 8, () => g.hud.flick('Look up, Aster! The spores come down in a river of light. Right into that pool.', 6));
}

const SHAFT_VERT = /* glsl */ `
varying vec2 vUv;
varying float vY;
varying float vFace;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vY = w.y;
  // How squarely this bit of the shaft faces the eye: its edges fade out, so it reads as light, not a column.
  vec3 n = normalize(mat3(modelMatrix) * normal);
  vec3 v = normalize(cameraPosition - w.xyz);
  vFace = abs(dot(n, v));
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const SHAFT_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
varying float vY;
varying float vFace;
void main() {
  // Soft motes of light sinking slowly down the shaft.
  float motes = smoothstep(0.75, 1.0, sin(vUv.x * 41.0 + sin(vY * 0.7) * 2.0) * sin(vY * 1.9 + uTime * 1.1 + vUv.x * 13.0));
  float a = (0.05 + 0.4 * motes) * smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.75, 1.0, vUv.y)) * pow(vFace, 2.0);
  gl_FragColor = vec4(uColor * (0.8 + motes), a * 0.45);
}`;

/** A shaft of golden light from a crack in the vault down to (x, z), with spores drifting down it. */
function sporeShaft(b: Builder, x: number, z: number): void {
  const g = b.game;
  const top = 54;
  const u = { uTime: { value: 0 }, uColor: { value: new THREE.Color(SPORE.gold) } };
  const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  for (const [r0, r1] of [[3.4, 5.5], [1.6, 2.8]] as [number, number][]) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, top - WL, 20, 1, true), m);
    shaft.position.set(x, (top + WL) / 2, z);
    b.level.root.add(shaft);
  }
  // The crack it pours from.
  b.decor.add(GEO.cone(), glowShared(SPOT), x, top - 1.5, z, 3.2, 1.6, 2.2, Math.PI, 0.4, 0, false);
  b.level.props.push({
    update: (dt: number) => {
      u.uTime.value = g.realTime;
      const p = g.player;
      if (Math.hypot(p.x - x, p.z - z) > 60) return;
      if (rng.chance(dt * 14)) {
        const a = rng.next() * Math.PI * 2;
        const rr = Math.sqrt(rng.next()) * 4;
        g.fx.emit(x + Math.sin(a) * rr, 6 + rng.next() * 18, z + Math.cos(a) * rr, {
          count: 1, speed: 0.4, dir: [0, -1, 0], spread: 0.3, life: [3, 5], size: [0.1, 0.18], sizeEnd: 0.25, color: rng.chance(0.7) ? SPORE.gold : 0xfff0c0,
          bright: 2.2, drag: 0.2, gravity: 0.25,
        });
      }
      if (rng.chance(dt * 1.2)) g.fx.ring(x, WL + 0.04, z, 1, 4, 0xffe8a0, 1.8);
    },
  });
}

/**
 * The Motherstalk: a mushroom as big as a house in the middle of the
 * Sporefall, raining spores from its gills. An egg waits on top, for a
 * dragon who pounds the springy cap beside it.
 */
function motherstalk(b: Builder): void {
  const g = b.game;
  const { x, z } = MOTHER;
  const y = b.y(x, z);
  const h = 15;
  const r = 9;
  const stalk = stalkMat();
  // A tapering, slightly twisted stalk with a skirt (the ring) partway up.
  const pts = [new THREE.Vector3(x, y - 1, z), new THREE.Vector3(x + 0.6, y + h * 0.35, z - 0.3), new THREE.Vector3(x - 0.3, y + h * 0.7, z + 0.4), new THREE.Vector3(x, y + h, z)];
  const tube = new THREE.Mesh(taperedTube(pts, 2.4, 1.3, 16, 12, false), stalk);
  tube.castShadow = true;
  b.addStatic(tube);
  b.decor.add(GEO.cap(), stalk, x - 0.1, y + h * 0.62, z + 0.2, 2.6, -0.9, 2.6, 0, 0, 0);
  b.decor.add(GEO.cyl(), stalk, x, y - 0.5, z, 3.4, 1.4, 3.4);
  const capM = capMat(SPORE.violet);
  b.decor.add(GEO.cap(), capM, x, y + h, z, r, r * 0.42, r, 0, 0.3, 0);
  // Glowing gills underneath, a rim of gold, spots on top.
  b.decor.add(GEO.cyl(), glowShared(GILL), x, y + h - 0.12, z, r * 0.96, 0.14, r * 0.96, 0, 0, 0, false);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    b.decor.add(GEO.box(), glowShared(SILK), x + Math.sin(a) * r * 0.55, y + h - 0.2, z + Math.cos(a) * r * 0.55, 0.06, 0.12, r * 0.8, 0, a, 0, false);
  }
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4;
    const d = r * (0.2 + (i % 4) * 0.19);
    b.decor.add(GEO.blobLow(), glowShared(SPOT), x + Math.sin(a) * d, y + h + r * 0.42 * Math.sqrt(Math.max(0, 1 - (d / r) ** 2)) - 0.1, z + Math.cos(a) * d, 0.55, 0.16, 0.55, 0, 0, 0, false);
  }
  b.col.add(makeCyl(x, z, 2.2, y - 1, y + h));
  const top = y + h + r * 0.3;
  const cs = makeCyl(x, z, r * 0.78, y + h - 0.3, top);
  cs.surface = 'mud';
  cs.tag = CAP_TAG;
  b.col.add(cs);
  b.egg('motherstalk', x + 1, z - 1, top);
  b.gems(x, z, 'blue', 6, 3.5, top);
  // The springy cap that gets you up there (with a pound), and roots of smaller caps round the foot.
  const sp = bounceCap(b, x + 10.5, z - 3.5, { power: 22, big: 1.55, r: 1.5, color: SPORE.pink, signal: 'myc-bigbounce' });
  caps(b, x + 3.5, z - 3, 6, [SPORE.violet, SPORE.pink], 1.8);
  caps(b, x - 4, z + 3, 5, [SPORE.teal, SPORE.violet], 1.8);
  // Spores raining from the gills, while the dragon is near.
  b.level.props.push({
    update: (dt: number) => {
      const p = g.player;
      if (Math.hypot(p.x - x, p.z - z) > 45) return;
      if (rng.chance(dt * 16)) {
        const a = rng.next() * Math.PI * 2;
        const d = 2.5 + Math.sqrt(rng.next()) * (r - 3);
        g.fx.emit(x + Math.sin(a) * d, y + h - 0.4, z + Math.cos(a) * d, {
          count: 1, speed: 0.3, dir: [0, -1, 0], spread: 0.4, life: [4, 6], size: [0.08, 0.15], sizeEnd: 0.2, color: rng.chance(0.6) ? 0xd8a8ff : SPORE.gold,
          bright: 2, drag: 0.3, gravity: 0.35,
        });
      }
    },
  });
  firstNear(b, 'caps', [[sp.x, sp.z]], 7, 'A springy cap! Land on it and you bounce. Pound down onto it from a jump (Tail in the air) and you\'ll bounce MUCH higher.', 8);
  b.story('motherstalk', x + 8, z - 8, 7, () => g.hud.flick('That\'s not a mushroom, that\'s a HOUSE. With a roof. Is something glowing up there?', 6));
}

// --- the Glimmer Pools -------------------------------------------------------------------------------

function glimmerPools(b: Builder): void {
  const g = b.game;
  layoutRealm(b, GLIMWAY);
  for (const [x, z] of [[22, 22.5], [27, 14.5], [31, 25.5], [35, 16.5]] as [number, number][]) caps(b, x, z, 4, [SPORE.teal, SPORE.violet], 1.2);
  b.story('glimmer', 34, 21, 6, () => g.hud.flick('Glowing water! The whole pool\'s lit from underneath. Hold Shift to dive, Aster, there\'s something down there.', 7));
  // Weed of light on the pool beds, and pads of light on top.
  const weed = glowShared(SPORE.teal);
  const weed2 = glowShared(SPORE.violet);
  for (let i = 0; i < 90; i++) {
    const a = rng.next() * Math.PI * 2;
    const rr = Math.sqrt(rng.next()) * 12;
    const px = GLIM.x + Math.sin(a) * rr;
    const pz = GLIM.z + 4 + Math.cos(a) * rr;
    const fy = b.col.terrainAt(px, pz);
    if (fy > -1.6 || fy < -1e3) continue;
    const hh = 0.6 + rng.next() * 1.8;
    b.decor.add(GEO.blade(), i % 4 === 0 ? weed2 : weed, px, fy - 0.1, pz, 6, hh, 6, rng.signed() * 0.3, rng.next() * 6, rng.signed() * 0.3, false);
  }
  const pad = mat(0x2a8a78, { rough: 0.7, emissive: 0x1a6a5a, emissiveIntensity: 0.6, side: THREE.DoubleSide });
  for (let i = 0; i < 26; i++) {
    const a = jitter(i, 5) * Math.PI;
    const rr = 2 + Math.abs(jitter(i, 6)) * 6;
    const px = DEEP.x + Math.sin(a) * rr;
    const pz = DEEP.z + Math.cos(a) * rr;
    if (b.col.terrainAt(px, pz) > WL - 0.5) continue;
    b.decor.add(GEO.disc(), pad, px, WL + 0.03, pz, 0.5 + Math.abs(jitter(i, 7)) * 0.6, 1, 0.5 + Math.abs(jitter(i, 8)) * 0.6, 0, i, 0, false);
  }
  // The egg, deep in the pool, under an arch of the King's roots.
  const ey = b.col.terrainAt(DEEP.x - 2, DEEP.z + 1);
  b.egg('pool', DEEP.x - 2, DEEP.z + 1, ey);
  hollowRoot(b, [[DEEP.x - 6, ey - 1, DEEP.z + 3], [DEEP.x - 3, ey + 3.5, DEEP.z + 1.5], [DEEP.x + 0.5, ey + 2.5, DEEP.z - 1], [DEEP.x + 2.5, ey - 1, DEEP.z - 3]], 0.7);
  crystalCluster(b, DEEP.x - 4, DEEP.z - 1.5, 0.8, SPORE.teal, ey + 0.2);
  b.gemLine([[DEEP.x + 5, DEEP.z - 4], [DEEP.x - 1, DEEP.z]], 'blue', 1.5);
  // A rock in the middle of the pool with a chest on it (swim over and climb out).
  const rx = DEEP.x + 2.5;
  const rz = DEEP.z + 3.5;
  b.box(rx, -6, rz, 3.2, 6.6, 3.2, ROCK.mid, { yaw: 0.4, trim: ROCK.moss });
  b.chest('pools', rx, rz, -0.8, { blue: 36, red: 2, green: 2 }, 0.6);
  // Around the pools: caps, crystals, stalagmites.
  giantCap(b, 57, 22, 6.8, 3.8, SPORE.teal);
  giantCap(b, 60, 18, 4.5, 2.4, SPORE.violet);
  caps(b, 55, 19, 7, [SPORE.teal, SPORE.violet], 2.4);
  for (const [x, z, sc, c] of [[38, 30, 1.1, SPORE.teal], [59, 30, 0.9, SPORE.violet], [42, 14, 1.0, SPORE.teal], [60, 38, 1.2, SPORE.teal], [50, 38, 0.8, SPORE.violet]] as [number, number, number, number][]) {
    crystalCluster(b, x, z, sc, c);
  }
  caps(b, 40, 17, 6, [SPORE.teal, SPORE.violet], 2);
  caps(b, 58, 16, 5, [SPORE.gold, SPORE.teal], 2);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = GLIM.x + Math.sin(a) * 16;
    const z = GLIM.z + 3 + Math.cos(a) * 15;
    if (x < 38 && Math.abs(z - 20) < 6) continue;
    stalagmites(b, x, z, 3, 3, { max: 6, glow: SPORE.teal });
  }
  // A small fight on the pools' south shore (optional).
  const ar = b.arena('pools', 52, 11, 8.5, [
    [{ type: 'puffcap', x: 56, z: 6 }, { type: 'sporeling', x: 48, z: 8, delay: 0.2 }, { type: 'sporeling', x: 55, z: 15, delay: 0.4 }],
    [{ type: 'wisp', x: 50, z: 5 }, { type: 'puffcap', x: 47, z: 14, delay: 0.3 }, { type: 'sporeling', x: 57, z: 11, delay: 0.5 }, { type: 'sporeling', x: 52, z: 16, delay: 0.7 }],
  ], 40);
  ar.onClear = () => g.hud.flick('That\'s the pools quiet. Now: that glow at the bottom of the deep one...', 5);
  // A choked grotto in the east wall: burn the blight for the crystal inside.
  blightCloud(b, 60.5, 27, 3.8, 3, Math.PI / 2, 5, { regrow: 12 });
  b.crystal(66.5, 27, 'mixed', 30, true);
  crystalCluster(b, 67.5, 29, 0.7, SPORE.teal);
}

// --- the Capstair ---------------------------------------------------------------------------------------

/** The Capstair; returns its floor cap (where a Cap Hopper run starts). */
function capstair(b: Builder, pulses: Pulses): BounceCap {
  const g = b.game;
  b.story('capstair', 0, 50, 7, () => g.hud.flick('The Capstair! Mushrooms all the way up the walls, like steps. Somebody planted these. Bounce up!', 7));
  // The climb: a floor cap, a shelf with a cap, a shelf with a feeble cap (pound it), and the top.
  const c1 = bounceCap(b, -3, 82, { power: 20, r: 1.6, color: SPORE.pink });
  shelfCap(b, -7, 87.5, 6.5, 2.7, Math.PI / 2, SPORE.gold);
  const c2 = bounceCap(b, -7.4, 88.9, { power: 20, r: 1.2, color: SPORE.pink }, 6.5);
  shelfCap(b, -2.8, 93.4, 12.5, 2.6, Math.PI, SPORE.gold);
  const c3 = bounceCap(b, -2.3, 94.3, { power: 18, big: 1.55, r: 1.25, color: SPORE.pink, signal: 'myc-bigbounce' }, 12.5);
  b.gems(-7, 86.8, 'blue', 4, 1.4, 6.5);
  b.gems(-2.8, 92.6, 'blue', 4, 1.3, 12.5);
  b.puzzleHint(-2.8, 93.4, 3.5, [
    'This cap\'s too feeble to reach the top on its own. Bounce, then pound down onto it (Tail in the air) for a huge bounce!',
    'Or breathe Earth on the cap first (select Earth with 4): it swells up, and the next bounce throws you sky-high.',
  ], 'myc-top', 12, 25);
  b.level.on('myc-bigbounce', () => {
    if (g.save.found['story:mycelium:bigbounce']) return;
    g.save.found['story:mycelium:bigbounce'] = true;
    g.hud.flick('WHEEEE! Did you see how high that was?!', 4);
  });
  b.trigger(0, 101, 5, () => b.level.emit('myc-top'), true, TOP);
  // A hidden ledge high on the west wall, for a dragon who pounds the floor cap.
  shelfCap(b, -7.6, 77.5, 16.5, 2.3, Math.PI / 2, SPORE.gold);
  b.gems(-7.4, 77.5, 'blue', 3, 0.9, 16.5);
  // The east wall: a tall table-cap. Burn it down, hop on, and ride it back up to the shelf beside it.
  const lift = liftCap(b, 5.4, 70, { high: 13, r: 2.2, color: SPORE.violet, signal: 'myc-lift' });
  shelfCap(b, 8, 75, 14.3, 2.5, -Math.PI / 2, SPORE.gold);
  b.egg('capstair', 8.1, 75.3, 14.3);
  b.gems(7.2, 74, 'blue', 3, 1.2, 14.3);
  firstNear(b, 'lift', [[lift.x, lift.z]], 6, 'That big flat one\'s too tall to climb. Mushrooms shrivel in fire... and they always grow back.', 7);
  b.level.on('myc-lift', () => {
    if (g.save.found['story:mycelium:lift']) return;
    g.save.found['story:mycelium:lift'] = true;
    g.hud.flick('It\'s shrunk! Quick, hop on before it grows back!', 4);
  });
  void c2;
  void c3;
  // Glide rings from the top of the Capstair back down the chasm, out over the Sporefall.
  const pts: [number, number, number, number][] = [];
  const start = TOP + 3.4;
  for (const d of [7, 17, 27, 37, 47, 58]) {
    const zz = 98 - d;
    pts.push([Math.sin(d * 0.12) * 3, start - ((d + 3) / 11.5) * 2.1, zz, Math.PI]);
  }
  b.glideRings('capstair', pts, 9, 45);
  b.story('rings', 3, 100, 4, () => g.hud.flick('Rings, all the way back down the chasm! Jump off the edge, flap, and glide through every one.', 6));
  // A lazy pack on the chasm floor; pods to smash; gems up the middle.
  lazyEnemies(b, 0, 58, 13, [['sporeling', -3, 62, Math.PI], ['sporeling', 3, 64, Math.PI], ['puffcap', 5, 72, Math.PI]]);
  b.breakables('pod', [[-6, 56], [-6.8, 57.2], [6, 66], [-5, 76]]);
  b.gemLine([[-2, 46], [-2, 58], [-3, 70], [-3, 78]], 'blue', 2.2);
  // Dressing: bracket fungi (scenery) all the way up both walls, threads of light, crystals by the stream.
  const r = b.decor.rng;
  const shelfM = [capMat(SPORE.gold), capMat(SPORE.pink), capMat(SPORE.teal)];
  for (let i = 0; i < 46; i++) {
    const side = i % 2 ? 1 : -1;
    const zz = 44 + r.next() * 44;
    const yy = 3 + r.next() * 30;
    const xx = side * (9.6 + yy * 0.02);
    const s = 0.7 + r.next() * 1.4;
    b.decor.add(GEO.cap(), shelfM[i % 3]!, xx - side * s * 0.4, yy, zz, s, s * 0.3, s * 1.1, 0, 0, side * 0.15, false);
  }
  for (let i = 0; i < 8; i++) {
    const side = i % 2 ? 1 : -1;
    vein(b, wallPath(b, side * 7, 48 + i * 5, side, 0, 0.3, 26 + (i % 3) * 6, 9, 1.2), 0.08, i % 3 ? SPORE.teal : SPORE.gold, pulses);
  }
  lichen(b, 0, 9, 44, 94, 1, 34, 90);
  for (const [x, z, sc] of [[3, 48, 0.8], [-4, 64, 0.7], [4, 80, 0.9], [-1.5, 90, 1.0]] as [number, number, number][]) crystalCluster(b, x, z, sc, SPORE.teal);
  caps(b, -6, 50, 5, [SPORE.teal, SPORE.pink], 1.4);
  caps(b, 6, 60, 5, [SPORE.violet, SPORE.gold], 1.4);
  caps(b, -6, 72, 4, [SPORE.teal, SPORE.gold], 1.2);
  // Where the stream rises: a spring of glowing water at the foot of the headwall.
  crystalCluster(b, 1.5, 92.5, 1.3, SPORE.teal);
  b.story('spring', 0, 86, 4, () => g.partner.say('The stream comes out of the rock glowing. Everything down here glows. Even the water is showing off.', 5.5, true));
  return c1;
}

// --- the Threadworks ---------------------------------------------------------------------------------

function threadworks(b: Builder, pulses: Pulses): void {
  const g = b.game;
  b.checkpoint('threadworks', 6, 101, Math.PI * 0.9);
  b.story('threadworks', 0, 103, 6, () => g.say([
    { who: 'flick', text: 'Whoa. Walls. Arches. Somebody BUILT this, Aster.' },
    { who: 'nyxa', text: 'The old dragons. They grew gardens under the world, before the Sanctum. Look at the threads... they carried light down here, like water.' },
    { who: 'aster', text: 'And now the threads are carrying it somewhere else.' },
    { who: 'nyxa', text: 'Toward him. Everything down here leans toward him.' },
  ]));
  const Y = TOP;
  // --- The Garden Gate: a ruined wall across the plateau, a door of gills in its arch, and a node to wake it.
  const V = 0x6e6886;
  for (const [x0, x1] of [[-20, -2.6], [2.6, 20]] as [number, number][]) b.wall(x0, 106, x1, 106, Y - 1, 6.5, 1.2, V);
  archway(b, 0, 106, 0, 4.4, 5.4, V, Y);
  for (const x of [-10, -6, 7, 13]) b.decor.add(GEO.box(), mat(0x8a82a0, { rough: 0.9, flat: true }), x, Y + 6.2, 106, 2 + (x % 3), 0.6, 1.5, 0, 0, 0.1);
  const door = capDoor(b, 0, 106, 4.4, 5.3, 0, 7, '', Y);
  const n1 = glowthread(b, 7, 103.2, [[5.2, Y + 0.2, 104.8], [3, Y + 0.25, 105.2], [3.1, Y + 3, 105.3], [2.3, Y + 5.6, 105.4], [0, Y + 5.9, 105.3]], door, { speed: 7 }, Y);
  firstNear(b, 'thread', [[n1.x, n1.z]], 6, 'A glowing bulb, and a thread running to that door! Give the bulb a jolt of Lightning (select it with 2).', 7);
  let gateSaid = false;
  b.level.props.push({
    update: () => {
      if (gateSaid || !door.isOpen) return;
      gateSaid = true;
      if (!g.save.found['story:mycelium:gate']) {
        g.save.found['story:mycelium:gate'] = true;
        g.hud.flick('The light ran down the thread and opened it! It won\'t stay open long. Go, go!', 5);
      }
    },
  });

  // --- The garden itself: planters of dead caps, statues, pillars laced with threads, and a fight.
  const ar = b.arena('garden', GARDEN.x, GARDEN.z, 10, [
    [{ type: 'sporeling', x: -4, z: 123 }, { type: 'sporeling', x: 4, z: 123, delay: 0.2 }, { type: 'puffcap', x: 7, z: 113, delay: 0.4 }, { type: 'slinger', x: -7, z: 112, delay: 0.6 }],
    [{ type: 'puffcap', x: -6, z: 124 }, { type: 'puffcap', x: 6, z: 124, delay: 0.3 }, { type: 'sporeling', x: 0, z: 110, delay: 0.5 }, { type: 'grunt', x: 3, z: 120, delay: 0.7 },
      { type: 'sporeling', x: -3, z: 111, delay: 0.9 }],
  ], 50);
  ar.onStart = () => {
    if (g.save.found['story:mycelium:garden-fight']) return;
    g.save.found['story:mycelium:garden-fight'] = true;
    g.hud.flick('They\'ve taken over the garden! Clear them out!', 4);
  };
  ar.onClear = () => g.hud.flick('That terrace at the back... and that vent in front of it, breathing. I bet it breathes US up there.', 6);
  for (const [x, z] of [[-13, 111], [13, 111], [-14, 123], [14, 123]] as [number, number][]) {
    b.box(x, Y - 0.2, z, 3.6, 0.8, 3.6, 0x5a5270, { trim: 0x7a7294 });
    for (let k = 0; k < 4; k++) b.decor.mushroom(x + jitter(k + x, 1) * 1.1, Y + 0.6, z + jitter(k + z, 2) * 1.1, 0.5 + Math.abs(jitter(k, 3)) * 0.3, 0x5a5a60, false);
  }
  dragonStatue(b, -15.5, 117, Math.PI / 2, { hornStyle: 'swept', tailStyle: 'fan', slender: 0.7, beard: true }, { scale: 1.4, eyes: SPORE.teal, stone: 0x8a82a0 });
  for (const [x, z] of [[-9, 108.5], [9, 108.5], [-12, 129], [12, 129]] as [number, number][]) {
    b.pillar(x, z, 0.6, Y - 0.3, Y + 5.5, 0x7a7294);
    vein(b, [[x, Y + 0.2, z + 0.7], [x + 0.5, Y + 2.5, z + 0.6], [x - 0.4, Y + 4.5, z + 0.6], [x, Y + 5.6, z]], 0.07, SPORE.teal, pulses);
  }
  // Garlands of glowing thread slung between the pillars.
  for (const [a, c] of [[[-9, 108.5], [-12, 129]], [[9, 108.5], [12, 129]], [[-12, 129], [12, 129]]] as [[number, number], [number, number]][]) {
    const pts: [number, number, number][] = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      pts.push([a[0] + (c[0] - a[0]) * t, Y + 5.3 - Math.sin(t * Math.PI) * 1.6, a[1] + (c[1] - a[1]) * t]);
    }
    vein(b, pts, 0.06, SPORE.teal, pulses);
  }
  for (const [x, z] of [[-17, 110], [17, 112], [-17, 128], [16, 127]] as [number, number][]) crystalCluster(b, x, z, 0.8, SPORE.teal);
  // What is left of the paving: slabs, some tipped, some cracked, grown over at the seams.
  const slab = mat(0x7a7288, { rough: 0.9, flat: true });
  const r = b.decor.rng;
  for (let i = 0; i < 70; i++) {
    const px = -15 + r.next() * 30;
    const pz = 101 + r.next() * 28;
    if (Math.hypot(px, pz - 118) > 18 || (Math.abs(px) < 3 && pz < 108)) continue;
    const s = 1.3 + r.next() * 0.9;
    b.decor.add(GEO.box(), slab, px, Y + 0.02, pz, s, 0.12, s * (0.8 + r.next() * 0.4), r.signed() * 0.04, Math.floor(r.next() * 4) * (Math.PI / 2) + r.signed() * 0.08, r.signed() * 0.04, false);
  }
  // Giant caps the old gardeners planted, still standing in the corners.
  giantCap(b, -16.5, 125.5, 7.5, 3.2, SPORE.violet, Y);
  giantCap(b, 16.5, 124.5, 6, 2.7, SPORE.teal, Y);
  giantCap(b, -15.5, 109.5, 4.8, 2.3, SPORE.pink, Y);
  giantCap(b, 15.5, 109.5, 5.4, 2.4, SPORE.gold, Y);
  for (const [x, z, c] of [[-10, 114, SPORE.teal], [10, 121, SPORE.violet], [-9, 124, SPORE.gold], [8, 111, SPORE.pink]] as [number, number, number][]) caps(b, x, z, 3, [c], 0.9);
  b.breakables('urn', [[-15, 108], [-16.2, 109.2], [15.5, 116], [16, 117.5], [-6, 131], [6, 131]]);
  b.gemLine([[0, 108], [0, 126]], 'blue', 2);

  // --- The terrace, and the vent that breathes you up onto it.
  const vent = sporeVent(b, -3, 127.6, { r: 1.35, h: 9.5, period: 3.4, signal: 'myc-vent1' }, Y);
  firstNear(b, 'vent', [[vent.x, vent.z]], 7, 'That vent breathes out every few seconds. See the gold glow before it puffs? Step in right then!', 7);
  for (let i = -4; i <= 4; i++) {
    b.decor.add(GEO.box(), mat(0x6e6886, { rough: 0.9, flat: true }), i * 2.2, Y + 3.4, 130.4, 2.1, 7, 1.2, 0, 0, 0);
  }
  for (const x of [-9, -1.5, 5, 9]) b.decor.pillar(x, Y, 129.8, 0.5, 7.5, 0x7a7294, x === 5);
  // The terrace: broken paving, planters, a statue looking out over the garden.
  const T = TERRACE;
  dragonStatue(b, -5.5, T.z + 4, Math.PI, { hornStyle: 'curled', tailStyle: 'club', slender: 0.5 }, { scale: 1.2, eyes: SPORE.gold, stone: 0x8a82a0 });
  b.gems(1, T.z - 3, 'blue', 5, 1.6, T.y);
  caps(b, 5, T.z + 5, 5, [SPORE.teal, SPORE.violet], 1.2);
  lanternPost(b, 6.5, T.z - 2, SPORE.teal, Math.PI);

  // --- The blight passage east off the terrace, and the bridge of light over the gorge beyond.
  const cloud = blightCloud(b, 15.5, T.z, 4.4, 4, Math.PI / 2, 7, { regrow: 10 }, T.y);
  firstNear(b, 'blight', [[cloud.x - 4, cloud.z]], 6, 'Ugh, what IS that? Blight, choking the whole passage. Don\'t walk into it, Aster. Burn it!', 7);
  const bridge = lightBridge(b, [23.5, T.y, T.z], [40.5, T.y, T.z], 3.2, 3.6, 6.5);
  const n2 = glowthread(b, 7.5, T.z + 3.2, [[9.5, T.y + 0.4, T.z + 2.1], [12, T.y + 1.2, T.z + 2.3], [19, T.y + 1.1, T.z + 2.3], [22.8, T.y + 0.3, T.z + 1.2], [23.2, T.y + 0.2, T.z]],
    bridge, { speed: 6.5 }, T.y);
  b.puzzleHint(12, T.z, 9, [
    'The thread from that bulb runs through the passage to the gorge. Burn the blight, then strike the bulb and chase the light!',
    'Burn the blight first (it stays gone a few seconds), wake the bulb with Lightning, then run: the bridge only lasts behind the light.',
  ], 'myc-bridge', 35, 30);
  // Reaching the far side counts as crossing.
  b.trigger(44, T.z, 3, () => b.level.emit('myc-bridge'), true, T.y);
  b.level.on('myc-bridge', () => {
    if (g.save.found['story:mycelium:bridge']) return;
    g.save.found['story:mycelium:bridge'] = true;
    g.partner.say('A bridge made of light. The old dragons had a sense of drama. I approve.', 5, true);
  });
  // Falling into the gorge: back to the ledge.
  b.level.props.push({
    update: () => {
      const p = g.player;
      if (p.y < T.y - 7 && Math.hypot(p.x - GORGE.x, p.z - GORGE.z) < 11 && p.state !== 'fall') g.playerFell();
    },
  });
  // The gorge: spore mist far below, roots across its walls.
  gorgeMist(b);
  hollowRoot(b, [[24, 10, 146], [28, 22, 147], [34, 28, 146.5], [40, 20, 147]], 0.9);
  hollowRoot(b, [[25, 36, 134], [31, 26, 133.5], [38, 18, 134.5]], 0.7);
  crystalCluster(b, 44, T.z - 2.6, 0.9, SPORE.teal);
  void n2;

  westWing(b, pulses);
  eastWing(b, pulses);
}

/** Glowing mist at the bottom of the gorge, so it reads as a long way down. */
function gorgeMist(b: Builder): void {
  const g = b.game;
  const m = new THREE.Mesh(new THREE.CircleGeometry(8.5, 24), new THREE.MeshBasicMaterial({ color: 0x5a2a9a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(GORGE.x, 8, GORGE.z);
  b.level.root.add(m);
  b.level.props.push({
    update: (dt: number) => {
      const p = g.player;
      if (Math.hypot(p.x - GORGE.x, p.z - GORGE.z) > 40 || !rng.chance(dt * 10)) return;
      g.fx.emit(GORGE.x + rng.signed() * 7, 7 + rng.next() * 4, GORGE.z + rng.signed() * 6, {
        count: 1, speed: 0.8, dir: [0, 1, 0], spread: 0.4, life: [3, 5], size: [0.8, 1.4], sizeEnd: 3, color: 0x8a4aff, alpha: 0.18, additive: true, bright: 1, gravity: -0.5,
      });
    },
  });
}

/** The west wing: an old tower, and a vent that Ice holds open long enough to ride up beside it. */
function westWing(b: Builder, pulses: Pulses): void {
  const g = b.game;
  const Y = TOP;
  const tx = WEST.x - 4.5;
  const tz = WEST.z - 3.5;
  const top = Y + 16.5;
  // The tower: a stack of stone drums, broken at the top into a platform.
  b.box(tx, Y - 0.5, tz, 4.4, top - Y + 0.5, 4.4, 0x6e6886, { trim: 0x8a82a0 });
  b.box(tx, top, tz, 5.4, 0.5, 5.4, 0x8a82a0);
  for (const [dx, dz] of [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4]] as [number, number][]) b.decor.pillar(tx + dx, top + 0.5, tz + dz, 0.35, 1.2 + Math.abs(dx) * 0.2, 0x8a82a0, true);
  vein(b, [[tx + 2.3, Y + 0.2, tz + 1], [tx + 2.3, Y + 6, tz + 0.2], [tx + 2.3, Y + 12, tz + 1.2], [tx + 2.3, top, tz]], 0.08, SPORE.gold, pulses);
  b.egg('vent', tx, tz, top + 0.5);
  b.gems(tx + 1.2, tz + 1.2, 'blue', 3, 0.6, top + 0.5);
  const vent = sporeVent(b, WEST.x + 1.5, WEST.z + 1.5, { r: 1.3, h: 6, frozenH: 18.5, period: 3.0, phase: 1, freeze: 13, signal: 'myc-vent-frozen' }, Y);
  b.puzzleHint(WEST.x, WEST.z, 9, [
    'The puff only throws you partway up the tower. If only the vent would stay open... Ice holds things still!',
    'Breathe Ice on the vent (select it with 3) to freeze it open, then step in and ride the column up.',
  ], 'myc-vent-frozen', 25, 30);
  b.level.on('myc-vent-frozen', () => {
    if (g.save.found['story:mycelium:vent-frozen']) return;
    g.save.found['story:mycelium:vent-frozen'] = true;
    g.hud.flick('It\'s frozen open! A column of spores that just keeps going. Step in!', 5);
  });
  void vent;
  // A dragon gardener's plaque, and her tools.
  const px = WEST.x + 4;
  const pz = WEST.z + 5;
  b.box(px, Y - 0.2, pz, 1.6, 1.1, 1, 0x6e6886, { trim: 0x8a82a0 });
  b.letter('garden', px, pz, Y + 0.9);
  caps(b, WEST.x - 5, WEST.z + 5, 6, [SPORE.gold, SPORE.teal], 1.6);
  crystalCluster(b, WEST.x + 5, WEST.z - 4, 1.0, SPORE.teal);
  b.breakables('urn', [[WEST.x + 6, WEST.z], [WEST.x + 6.6, WEST.z + 1.3]]);
  archway(b, -24, 116, Math.PI / 2, 4, 4.5, 0x7a7294, Y);
}

/** The east wing: the Twinned Vault, two sockets fed by a slow thread and a quick one. */
function eastWing(b: Builder, pulses: Pulses): void {
  const g = b.game;
  const Y = TOP;
  // The vault: a roofed stone strongroom, its doorway on the west side.
  const vx = EAST.x + 3.5;
  const vz = EAST.z - 0.5;
  const V = 0x6e6886;
  const h = 5.4;
  b.wall(vx - 3, vz - 3, vx + 3, vz - 3, Y - 0.5, h + 0.5, 0.9, V);
  b.wall(vx - 3, vz + 3, vx + 3, vz + 3, Y - 0.5, h + 0.5, 0.9, V);
  b.wall(vx + 3, vz - 3, vx + 3, vz + 3, Y - 0.5, h + 0.5, 0.9, V);
  b.wall(vx - 3, vz - 3, vx - 3, vz - 1.55, Y - 0.5, h + 0.5, 0.9, V);
  b.wall(vx - 3, vz + 1.55, vx - 3, vz + 3, Y - 0.5, h + 0.5, 0.9, V);
  b.box(vx, Y + h, vz, 7.2, 0.7, 7.2, 0x5a5270, { trim: 0x8a82a0 });
  archway(b, vx - 3, vz, Math.PI / 2, 3.1, h - 0.9, 0x8a82a0, Y);
  const door = capDoor(b, vx - 3, vz, 3.1, h - 1, Math.PI / 2, 999, 'myc-vault', Y);
  const sock: [number, number, number][] = [[vx - 3.7, Y + 4.8, vz - 2.3], [vx - 3.7, Y + 4.8, vz + 2.3]];
  const lock = new TwinLock(g, door, sock, 2.4);
  b.level.props.push(lock);
  b.box(vx + 1, Y, vz, 1.8, 0.8, 1.2, 0x5a5270, { trim: 0x8a82a0 });
  b.collectible('relic1', 'relic', vx + 1, vz, Y + 0.8, 'myc1');
  b.gems(vx + 0.6, vz, 'blue', 6, 1.6, Y);
  // The slow thread: from a bulb by the wing's mouth, round and round a pillar, then across to the north socket.
  const px = EAST.x - 4;
  const pz = EAST.z + 5.5;
  b.pillar(px, pz, 0.6, Y - 0.3, Y + 7.2, 0x7a7294);
  const helix: [number, number, number][] = [[px - 1.2, Y + 0.2, pz - 1.6]];
  for (let k = 0; k <= 36; k++) {
    const a = (k / 36) * Math.PI * 2 * 4 + Math.PI;
    helix.push([px + Math.sin(a) * 0.72, Y + 0.3 + (k / 36) * 6.6, pz + Math.cos(a) * 0.72]);
  }
  helix.push([px + 1.5, Y + 7.3, pz - 0.5], [(px + sock[1]![0]) / 2, Y + 6.2, (pz + sock[1]![2]) / 2], [sock[1]![0] - 0.1, sock[1]![1] - 0.3, sock[1]![2]]);
  const slow = glowthread(b, EAST.x - 6.5, EAST.z + 2, helix, lock, { speed: 5.5, input: 1 }, Y);
  // The quick one: right beside the door, to the south socket.
  const qx = EAST.x - 4.5;
  const qz = EAST.z - 4.5;
  const quick = glowthread(b, qx, qz, [[qx + 1.2, Y + 0.2, qz + 0.6], [sock[0]![0] - 0.4, Y + 1.2, sock[0]![2] - 0.2], [sock[0]![0] - 0.1, sock[0]![1] - 0.3, sock[0]![2]]], lock, { speed: 5.5, input: 0 }, Y);
  b.puzzleHint(vx - 6, vz, 8, [
    'Two sockets, two threads. The door wants both lit at once, and one of those threads winds round and round that pillar.',
    'Strike the bulb whose thread climbs the pillar first. While its light crawls up, run to the near bulb and strike it just in time.',
  ], 'myc-vault', 30, 35);
  firstNear(b, 'vault', [[vx - 6, vz]], 7, 'A vault with two sockets. Two bulbs... two threads... one door. Hmm.', 5);
  b.level.on('myc-vault', () => g.hud.flick('Both at once! The vault\'s open. You\'re getting good at this.', 5));
  void slow;
  void quick;
  void pulses;
  crystalCluster(b, EAST.x - 1, EAST.z - 6, 0.9, SPORE.teal);
  caps(b, EAST.x + 2, EAST.z + 6.5, 5, [SPORE.violet, SPORE.teal], 1.3);
}

// --- down to the Market ---------------------------------------------------------------------------

function descent(b: Builder): void {
  const g = b.game;
  layoutRealm(b, DESCENT);
  for (const [x, z, c] of [[47.5, 137.5, SPORE.gold], [53.5, 145.5, SPORE.teal], [55, 152.5, SPORE.gold], [62, 157, SPORE.violet], [56, 160.5, SPORE.teal]] as [number, number, number][]) {
    caps(b, x, z, 4, [c, SPORE.pink], 1.1);
  }
  b.story('descent', 47, 142, 5, () => g.hud.flick('Down there... lamps! Little round huts! It\'s a Burrowfolk camp!', 5));
  lazyEnemies(b, 56, 152, 12, [['puffcap', 58, 156, Math.PI], ['sporeling', 54, 150, Math.PI]]);
}

// --- the Rotting Market ------------------------------------------------------------------------------

interface FolkLook {
  fur: number;
  belly: number;
  cloth: number;
  lamp: number;
  scale: number;
  old?: boolean;
}

/**
 * A Burrowfolk forager, wrapped in the Spore Mother's threads: a cocoon of
 * pale silk with her lamp still glowing inside. Burn it (Fire) or claw it
 * open (three hits) and out she tumbles, blinking, to say thank you.
 */
class Forager implements Prop, Hittable {
  readonly isEnemy = false;
  alive: boolean;
  readonly radius = 0.9;
  readonly height = 1.9;
  freed: boolean;
  readonly root = new THREE.Group();
  private head = new THREE.Group();
  private cocoon = new THREE.Group();
  private cocoonMat: THREE.MeshStandardMaterial;
  private yaw: number;
  private t = rng.next() * 10;
  private hp = 3;
  private wob = 0;
  talker: Talker | null = null;

  constructor(private game: Game, readonly id: string, readonly x: number, readonly y: number, readonly z: number, yaw: number, look: FolkLook,
    freed: boolean, private onFree: (f: Forager) => void) {
    this.yaw = yaw;
    this.freed = freed;
    this.alive = !freed;
    const fur = mat(look.fur, { rough: 1 });
    const belly = mat(look.belly, { rough: 1 });
    const cloth = mat(look.cloth, { rough: 0.9 });
    const body = ellipsoid(0.42, 0.5, 0.38, fur, 12);
    body.position.y = 0.55;
    const tummy = ellipsoid(0.3, 0.36, 0.2, belly, 10);
    tummy.position.set(0, 0.5, 0.2);
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 6, 14), cloth);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 0.92;
    this.root.add(body, tummy, scarf);
    for (const s of [-1, 1]) {
      const foot = ellipsoid(0.13, 0.07, 0.18, belly, 8);
      foot.position.set(s * 0.18, 0.06, 0.1);
      this.root.add(foot, limb(new THREE.Vector3(s * 0.34, 0.75, 0.05), new THREE.Vector3(s * 0.46, 0.5, 0.22), 0.08, 0.06, fur, 6));
    }
    this.head.position.y = 1.08;
    const skull = ellipsoid(0.3, 0.27, 0.3, fur, 12);
    const snout = ellipsoid(0.12, 0.1, 0.2, belly, 8);
    snout.position.set(0, -0.06, 0.26);
    const nose = ellipsoid(0.06, 0.05, 0.05, mat(0xe89aa0, { rough: 0.6 }), 8);
    nose.position.set(0, -0.03, 0.45);
    this.head.add(skull, snout, nose);
    for (const s of [-1, 1]) {
      const eye = ellipsoid(0.045, 0.05, 0.03, mat(0x140e12, { rough: 0.3 }), 8);
      eye.position.set(s * 0.12, 0.05, 0.25);
      const ear = ellipsoid(0.17, 0.2, 0.05, fur, 8);
      ear.position.set(s * 0.26, 0.2, -0.04);
      ear.rotation.set(0.2, s * 0.5, s * -0.5);
      const inner = ellipsoid(0.11, 0.13, 0.03, mat(0xe89aa0, { rough: 0.6 }), 8);
      inner.position.set(s * 0.26, 0.2, -0.01);
      inner.rotation.copy(ear.rotation);
      this.head.add(eye, ear, inner);
    }
    if (look.old) {
      const hood = ellipsoid(0.33, 0.2, 0.33, cloth, 10);
      hood.position.set(0, 0.14, -0.04);
      this.head.add(hood);
    }
    this.root.add(this.head);
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.9, 5), mat(0x5a4030, { rough: 0.9 }));
    staff.position.set(-0.5, 0.95, 0.26);
    const glass = ellipsoid(0.1, 0.13, 0.1, glowShared(look.lamp), 8);
    glass.position.set(-0.5, 1.72, 0.26);
    this.root.add(staff, glass);
    this.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    mergeStatic(this.root);
    this.root.scale.setScalar(look.scale);
    this.root.position.set(x, y, z);
    this.root.rotation.y = yaw;
    this.root.visible = freed;
    game.level!.root.add(this.root);
    // The cocoon: silk wrapped round and round, a lamp glowing through, threads to the ground.
    this.cocoonMat = mat(0xe8e0f0, { rough: 0.9, emissive: 0x6a5a9a, emissiveIntensity: 0.45 }) as THREE.MeshStandardMaterial;
    const shell = ellipsoid(0.62, 1.0, 0.6, this.cocoonMat, 12);
    shell.position.y = 0.95;
    this.cocoon.add(shell);
    for (let i = 0; i < 5; i++) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.58 - Math.abs(i - 2) * 0.09, 0.04, 4, 16), this.cocoonMat);
      band.position.y = 0.45 + i * 0.25;
      band.rotation.set(Math.PI / 2 + (i % 2 ? 0.25 : -0.2), 0, i * 0.4);
      this.cocoon.add(band);
    }
    const lamp = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), glowShared(look.lamp));
    lamp.position.set(0.1, 1.1, 0.5);
    this.cocoon.add(lamp);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      this.cocoon.add(limb(new THREE.Vector3(Math.sin(a) * 0.45, 0.6, Math.cos(a) * 0.45), new THREE.Vector3(Math.sin(a) * 1.3, 0, Math.cos(a) * 1.3), 0.04, 0.02, glowShared(0xd8c8ff), 4));
    }
    mergeStatic(this.cocoon);
    this.cocoon.position.set(x, y, z);
    this.cocoon.visible = !freed;
    game.level!.root.add(this.cocoon);
    game.col.add(makeCyl(x, z, 0.5 * look.scale, y, y + 1.3 * look.scale));
  }

  takeHit(hit: Hit): HitResult {
    if (this.freed) return 'none';
    if (hit.type === 'fire') this.hp = 0;
    else if (hit.type !== 'physical' || hit.source === 'breath') return 'none';
    else this.hp -= hit.heavy ? 2 : 1;
    this.wob = 0.5;
    this.game.fx.emit(this.x, this.y + 1, this.z, { count: 5, speed: 2, spread: 1, life: [0.4, 0.8], size: [0.12, 0.2], color: 0xf0e8ff, alpha: 0.8, additive: false, gravity: 3 });
    if (this.hp <= 0) this.free();
    return 'hit';
  }

  /** Out she comes. */
  free(): void {
    if (this.freed) return;
    const g = this.game;
    this.freed = true;
    this.alive = false;
    this.cocoon.visible = false;
    this.root.visible = true;
    g.fx.emit(this.x, this.y + 1, this.z, { count: 30, speed: 4, spread: 1, life: [0.6, 1.2], size: [0.15, 0.3], sizeEnd: 0.4, color: 0xf0e8ff, alpha: 0.9, additive: false, gravity: 4, jitter: 0.5 });
    g.fx.motes(this.x, this.y + 1, this.z, SPORE.gold, 20);
    g.sfx('woodBreak', this.x, this.y, this.z, 1.5, 0.6);
    g.sfx('relic', this.x, this.y, this.z, 1.3, 0.7);
    this.onFree(this);
  }

  update(dt: number): void {
    const g = this.game;
    this.t += dt;
    if (!this.freed) {
      this.wob = Math.max(0, this.wob - dt * 2);
      this.cocoon.rotation.z = Math.sin(this.t * 1.3) * 0.03 + Math.sin(this.wob * 30) * this.wob * 0.15;
      this.cocoonMat.emissiveIntensity = 0.35 + Math.sin(this.t * 2.2) * 0.12;
      return;
    }
    const p = g.player;
    const d = Math.hypot(p.x - this.x, p.z - this.z);
    if (d < 10) {
      const want = Math.atan2(p.x - this.x, p.z - this.z);
      let diff = want - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.yaw += diff * Math.min(1, dt * 2.5);
    }
    this.root.rotation.y = this.yaw;
    const talking = g.dialogueSpeaker === this.id;
    this.root.position.y = this.y + Math.abs(Math.sin(this.t * (talking ? 9 : 2.2))) * (talking ? 0.05 : 0.015);
    this.head.rotation.x = Math.sin(this.t * (talking ? 7 : 0.8)) * (talking ? 0.12 : 0.05) - (d < 6 ? 0.18 : 0);
  }
}

const LOOKS: Record<string, FolkLook> = {
  bramble: { fur: 0x9a6a4a, belly: 0xe8d0a8, cloth: 0x5a8a3a, lamp: 0xc8ff8a, scale: 1 },
  pickle: { fur: 0x7a7a8a, belly: 0xd8d8e0, cloth: 0xc84a6a, lamp: 0xffb0c8, scale: 0.95 },
  burdock: { fur: 0x6a5a4a, belly: 0xc8b8a0, cloth: 0x4a4a7a, lamp: 0xffd070, scale: 1.1, old: true },
  tansy: { fur: 0xb88a5a, belly: 0xf4e0c0, cloth: 0x2a8a9a, lamp: 0x8ff0e0, scale: 0.82 },
};

/** Where the Market's foragers are wrapped up, and where Bramble stands (the side quest's giver). */
const FORAGERS: { id: string; x: number; z: number; yaw: number; label: string }[] = [
  { id: 'bramble', x: 70.5, z: 180.5, yaw: -Math.PI * 0.6, label: 'Talk to Bramble' },
  { id: 'pickle', x: 46.2, z: 182.9, yaw: Math.PI * 0.6, label: 'Talk to Pickle' },
  { id: 'burdock', x: 68.5, z: 165.5, yaw: -Math.PI * 0.3, label: 'Talk to Old Burdock' },
  { id: 'tansy', x: 45.5, z: 170, yaw: Math.PI * 0.45, label: 'Talk to Tansy' },
];

const freedKey = (id: string) => `story:mycelium:freed-${id}`;

function market(b: Builder): void {
  const g = b.game;
  const { x, z, y } = MARKET;
  b.checkpoint('market', 53.5, 162.5, Math.PI * 0.15);
  b.story('market', 57, 160, 7, () => g.say([
    { who: 'flick', text: 'Oh no. Oh no no no. Aster... those white bundles. There are PEOPLE in them.' },
    { who: 'nyxa', text: 'Cocooned. She wraps them up and keeps them glowing, to feed the threads. They\'re alive.' },
    { who: 'aster', text: 'Then we cut them out. All of them.' },
    { who: 'flick', text: 'Fire or claws! Gently! ...Well. Not TOO gently.' },
  ]));
  // The fight for the square.
  const ar = b.arena('market', x, z + 2, 11, [
    [{ type: 'sporeling', x: x - 5, z: z + 8 }, { type: 'sporeling', x: x + 5, z: z + 8, delay: 0.2 }, { type: 'rootstalker', x: x, z: z + 11, delay: 0.5 },
      { type: 'puffcap', x: x + 8, z: z - 2, delay: 0.7 }],
    [{ type: 'rootstalker', x: x - 7, z: z + 4 }, { type: 'slinger', x: x + 7, z: z + 9, delay: 0.3 }, { type: 'sporeling', x: x, z: z - 6, delay: 0.5 },
      { type: 'sporeling', x: x - 3, z: z - 6, delay: 0.6 }, { type: 'puffcap', x: x - 8, z: z + 10, delay: 0.8 }],
    [{ type: 'rootstalker', x: x + 6, z: z + 1 }, { type: 'rootstalker', x: x - 6, z: z + 1, delay: 0.3 }, { type: 'grunt', x: x, z: z + 9, delay: 0.6 }],
  ], 55);
  ar.onStart = () => {
    if (g.save.found['story:mycelium:market-fight']) return;
    g.save.found['story:mycelium:market-fight'] = true;
    g.hud.flick('Something\'s coming up out of the ground! Watch your feet!', 4);
  };
  ar.onClear = () => g.hud.flick('The square\'s ours. Now get those poor things out of their cocoons!', 5);

  // The foragers.
  let freedNow = 0;
  const onFree = (f: Forager) => {
    g.save.found[freedKey(f.id)] = true;
    if (f.talker) f.talker.enabled = true;
    freedNow++;
    thankYou(g, f);
    const all = FORAGERS.every((q) => g.save.found[freedKey(q.id)]);
    if (all && !g.save.found['story:mycelium:all-freed']) {
      g.save.found['story:mycelium:all-freed'] = true;
      g.spawnGems(f.x, f.y + 1.5, f.z, { blue: 40, green: 2 }, true);
      g.toast('Every forager in the Market is free!', 'good');
    }
    g.saveNow();
  };
  for (const q of FORAGERS) {
    const fy = b.y(q.x, q.z);
    const f = new Forager(g, q.id, q.x, fy, q.z, q.yaw, LOOKS[q.id]!, !!g.save.found[freedKey(q.id)], onFree);
    b.level.props.push(f);
    b.level.hittables.push(f);
    const t = new Talker(g, q.x, fy, q.z, q.label, () => {
      g.player.yaw = Math.atan2(q.x - g.player.x, q.z - g.player.z);
      talkForager(g, q.id);
    });
    t.enabled = f.freed;
    f.talker = t;
    b.level.interactables.push(t);
  }
  void freedNow;
  firstNear(b, 'cocoon', FORAGERS.map((q) => [q.x, q.z] as [number, number]), 5, 'There\'s someone in there! I can see their lamp. Burn the silk, or claw it open!', 6);

  // The square: huts round the edge, stalls, awnings, baskets and rot.
  for (const [hx, hz, r, c] of [[72.5, 175, 2.4, 0x5a4a44], [44, 176, 2.2, 0x6a5a4a], [51, 187, 2.6, 0x5a4a44], [64.5, 188.5, 2.1, 0x6a5040], [71, 167.5, 2.0, 0x5a4a44]] as [number, number, number, number][]) {
    hut(b, hx, hz, r, Math.atan2(x - hx, z - hz), c);
  }
  stall(b, 47.8, 182.2, Math.PI * 0.6, 0xc84a6a);
  stall(b, 64, 170, -Math.PI * 0.35, 0x5a8a3a);
  b.letter('ledger', 47.8, 182.2, y + 0.9);
  // The square's lamps: half of them gone grey.
  for (const [lx, lz, on] of [[52, 168, 1], [64, 180, 0], [52, 180, 1], [62, 166, 0], [58, 186, 1], [70, 172, 0]] as [number, number, number][]) {
    lanternPost(b, lx, lz, on ? SPORE.gold : 0x5a5a58, Math.atan2(lx - x, lz - z));
  }
  b.pile(74.5, 181.5, 1.2, 4, ['crate', 'basket', 'barrel', 'crate']);
  b.pile(45, 166, 1.1, 4, ['basket', 'crate', 'basket', 'urn']);
  b.breakables('basket', [[60, 184], [61.2, 184.6], [74.5, 170.5], [50, 172]]);
  b.breakables('pod', [[54, 176], [63, 177], [57, 170]]);
  // Rot creeping over it all: grey caps, blight-patches on the ground.
  const rot = rotMat();
  for (let i = 0; i < 16; i++) {
    const a = rng.next() * Math.PI * 2;
    const d = 11 + rng.next() * 6;
    const px = x + Math.sin(a) * d;
    const pz = z + Math.cos(a) * d;
    const py = b.col.groundAt(px, pz, 1e4, 0.2).y;
    b.decor.add(GEO.cap(), rot, px, py - 0.05, pz, 0.3 + rng.next() * 0.5, 0.25 + rng.next() * 0.3, 0.3 + rng.next() * 0.5, 0, 0, 0, false);
  }
  caps(b, 76, 180, 6, [ROT, SPORE.violet], 1.8);
  caps(b, 42, 182, 5, [ROT, SPORE.pink], 1.6);
  for (const [cx, cz] of [[40, 172], [76, 184], [60, 192], [42, 160]] as [number, number][]) crystalCluster(b, cx, cz, 0.9, SPORE.violet);
  b.gemLine([[58, 162], [58, 172]], 'blue', 2);
  b.gems(x, z + 2, 'blue', 8, 5);

  // The Superflame shrine behind the square, guarded, and an iron-bound chest it opens.
  b.powerShrine('market', 'superflame', 58.5, 188.3, Math.PI, 5);
  b.enemy('slinger', 55, 187.8, Math.PI);
  b.enemy('grunt', 62.2, 188.2, Math.PI);
  b.enemy('puffcap', 58.6, 190.8, Math.PI);
  b.box(67, y - 0.3, 186.8, 3, 0.6, 3, 0x5a5270, { trim: 0x8a82a0, yaw: 0.6 });
  b.ironChest('market', 67, 186.8, Math.PI * 1.2, { blue: 45, red: 3, purple: 1 }, y + 0.3);
  b.story('shrine', 58.5, 183, 4, () => g.hud.flick('A Superflame shrine! It\'ll wake once those guards are down. White-hot breath would make short work of that iron chest.', 7));
}

/** A round earthen hut with a lit doorway, facing `yaw`. */
function hut(b: Builder, x: number, z: number, r: number, yaw: number, color: number): void {
  const y = b.y(x, z);
  const earth = mat(color, { rough: 1, flat: true });
  b.decor.add(GEO.cap(), earth, x, y - 0.2, z, r, r * 0.95, r);
  b.decor.add(GEO.cyl(), mat(mix(color, 0x000000, 0.35), { rough: 1, flat: true }), x, y - 0.25, z, r * 1.04, 0.45, r * 1.04);
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  b.decor.add(GEO.cap(), mat(0x1a1014, { rough: 1 }), x + fx * (r - 0.05), y - 0.1, z + fz * (r - 0.05), 0.6, 1.3, 0.25, 0, yaw, 0, false);
  b.decor.add(GEO.cap(), glowShared(0xffc070), x + fx * (r - 0.02), y - 0.1, z + fz * (r - 0.02), 0.42, 1.0, 0.18, 0, yaw, 0, false);
  // A cap of grey rot on the roof, and white threads creeping over it.
  b.decor.add(GEO.cap(), rotMat(), x + 0.3, y + r * 0.6, z - 0.2, r * 0.55, r * 0.3, r * 0.5);
  for (let i = 0; i < 3; i++) {
    const a = yaw + 1.2 + i * 1.4;
    b.decor.add(GEO.strand(), glowShared(SILK), x + Math.sin(a) * r * 0.7, y + r * 0.72, z + Math.cos(a) * r * 0.7, 0.9, r * 0.9, 0.9, Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8, false);
  }
  b.col.add(makeCyl(x, z, r * 0.92, y - 1, y + r * 0.9));
}

/** A market stall: a bench under a cloth awning on poles. */
function stall(b: Builder, x: number, z: number, yaw: number, cloth: number): void {
  const y = b.y(x, z);
  b.box(x, y, z, 2.6, 0.9, 1.0, 0x6a4a30, { yaw, surface: 'wood' });
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  b.decor.add(GEO.box(), mat(cloth, { rough: 0.9 }), x - fx * 0.3, y + 2.3, z - fz * 0.3, 3, 0.08, 1.6, 0.3, yaw, 0);
  for (const s of [-1, 1]) b.decor.add(GEO.cyl6(), mat(0x4a3424, { rough: 0.9 }), x + Math.cos(yaw) * s * 1.35 - fx * 0.9, y, z - Math.sin(yaw) * s * 1.35 - fz * 0.9, 0.05, 2.4, 0.05);
  for (let i = 0; i < 5; i++) {
    const u = -1 + i * 0.5;
    b.decor.mushroom(x + Math.cos(yaw) * u, y + 0.9, z - Math.sin(yaw) * u, 0.18 + (i % 2) * 0.06, [SPORE.gold, SPORE.teal, SPORE.pink][i % 3]!, true);
  }
}

// --- the foragers' words -----------------------------------------------------------------------------

/** The first thing each forager says, out of the cocoon. */
function thankYou(g: Game, f: Forager): void {
  const lines: Record<string, Line[]> = {
    bramble: [
      { who: 'bramble', text: 'Pah! Pthoo! Mushroom in my mouth. Mushroom in my EARS. Who... a dragon? A DRAGON cut me out?' },
      { who: 'aster', text: 'Are you all right?' },
      { who: 'bramble', text: 'I\'m Bramble. I led this foraging party, which makes this whole mess my fault. Talk to me when the others are out. I need a favour.' },
    ],
    pickle: [
      { who: 'pickle', text: 'Oh! Oh, sunlight! No, wait, it\'s a dragon. Close enough. Thank you, thank you!' },
      { who: 'pickle', text: 'Pickle\'s Pantry is open again! Come by the stall any time. You look like someone who could use a snack.' },
    ],
    burdock: [
      { who: 'burdock', text: 'Hm. Hmph. I was having a lovely nap in there, you know. Warm. Glowing. Terrible dreams.' },
      { who: 'burdock', text: '...Thank you, young dragon. Truly. Mind the Rootchoke, west of here. Nothing comes out of there that went in.' },
    ],
    tansy: [
      { who: 'tansy', text: 'I KNEW someone would come! I told Burdock! He said "nobody comes for foragers." Ha!' },
      { who: 'tansy', text: 'There\'s something shiny up past the thorns, east of the square. On the high roots. I saw it before the silk got me!' },
    ],
  };
  const l = lines[f.id];
  if (!l) return;
  g.player.yaw = Math.atan2(f.x - g.player.x, f.z - g.player.z);
  g.say(l, () => {
    if (f.id === 'pickle') snack(g, f);
  });
}

/** Pickle hands over a snack: red and green gems, once per visit. */
function snack(g: Game, f: { x: number; y: number; z: number }): void {
  if (g.sessionFlags.has('myc-snack')) return;
  g.sessionFlags.add('myc-snack');
  g.spawnGems(f.x, f.y + 1.4, f.z, { red: 4, green: 3 }, true);
}

const QUEST = 'mycelium-lamps';

function talkForager(g: Game, id: string): void {
  const say = (who: string, text: string) => g.say([{ who, text }]);
  if (id === 'bramble') {
    if (!g.quests.isStarted(QUEST)) {
      g.say([
        { who: 'bramble', text: 'You\'ve got us out, and I\'ve got no right to ask more. I\'m asking anyway.' },
        { who: 'bramble', text: 'A forager\'s lamp leads her home. When the silk took us, three of our lamps went rolling off into the Deep. Without them, the others won\'t find the way back.' },
        { who: 'bramble', text: 'One went into the Glimmer Pools. One went UP, somehow, on the Capstair\'s west wall. And one rolled into the Strangled Hollow, off the Rootchoke.' },
        { who: 'flick', text: 'Glowing things that are lost? That\'s basically my whole job. Leave it to us.' },
      ], () => g.quests.start(QUEST));
      return;
    }
    const s = g.quests.isDone(QUEST) ? 99 : g.quests.step(QUEST);
    if (s === 1) {
      g.say([
        { who: 'bramble', text: 'All three! Still lit! Oh, you marvel. Look, Tansy, they\'re still LIT.' },
        { who: 'bramble', text: 'Take this, and the foragers\' rule. Every one of us learns it before our first trip down.' },
      ], () => g.quests.notify('talk', { id: 'bramble' }));
    } else if (s === 0) say('bramble', 'One lamp in the Glimmer Pools (it\'ll be at the bottom, sorry). One high on the Capstair\'s west wall. One in the Strangled Hollow, off the Rootchoke.');
    else say('bramble', 'Three lamps lit, and every forager accounted for. Now go and give that Spore Mother a piece of my mind. A big piece.');
    return;
  }
  if (id === 'pickle') {
    const had = g.sessionFlags.has('myc-snack');
    g.say([{ who: 'pickle', text: had ? 'Come back later, I\'m fresh out! The spores keep eating my stock. Rude.' : 'A snack for the road! Glowcap tart. Don\'t ask what\'s in it. Mostly glowcap.' }],
      () => snack(g, { x: 46.2, y: MARKET.y, z: 182.9 }));
    return;
  }
  if (id === 'burdock') {
    say('burdock', g.save.levelsDone.mycelium ? 'The hum\'s gone. First quiet night in the Deep for a month. I may never wake up.'
      : 'She\'s called Mycora. The Spore Mother. The oldest cap in the Deep. She used to be kind, my grandmother said. Then something started whispering to her roots.');
    return;
  }
  if (id === 'tansy') {
    say('tansy', g.save.found['mycelium:relic2'] ? 'You got the shiny thing! Was it treasure? It was treasure, wasn\'t it.'
      : 'The Thornpit, east of the square! Two vents in the thorns, and the shiny thing way up on the roots. You\'d have to catch the second puff in mid-air. Easy for a dragon!');
  }
}

// --- Blight Row: three clouds in a row, and a heart shard at the end -------------------------------

function blightRow(b: Builder): void {
  const g = b.game;
  const pts: [number, number][] = [[64, 162], [70, 155.5], [75, 150], [NOOK.x, NOOK.z]];
  const clouds: [number, number, number][] = [];
  for (let i = 0; i < 3; i++) {
    const [ax, az] = pts[i]!;
    const [cx, cz] = pts[i + 1]!;
    const yaw = Math.atan2(cx - ax, cz - az);
    clouds.push([(ax + cx) / 2, (az + cz) / 2, yaw]);
  }
  for (const [cx, cz, yaw] of clouds) blightCloud(b, cx, cz, 4.2, 3.2, yaw, 6.5, { regrow: 7 }, 16);
  b.story('blightrow', 62, 164, 4, () => g.hud.flick('Blight Row. Three clouds of it, one after the other. Burn, run, burn, run!', 5));
  b.collectible('heart1', 'heart', NOOK.x + 0.5, NOOK.z - 0.5, 16);
  b.gems(NOOK.x, NOOK.z, 'blue', 6, 2, 16);
  crystalCluster(b, NOOK.x + 2.4, NOOK.z - 2.2, 0.8, SPORE.teal);
  lanternPost(b, 63, 164.5, 0x5a5a58, 0.8);
}

/**
 * A bed of the King's thorns over (x, z), `hx` by `hz` either side: stings
 * and throws anyone who steps in (a Hazard, drawn with the level's instanced
 * decor rather than a mesh per thorn).
 */
class ThornBed extends Hazard {
  constructor(game: Game, x: number, y: number, z: number, private ex: number, private ez: number, damage: number) {
    super(game, x, y, z, 0.01, 0.01, 1, damage, 'thorns');
  }

  override contains(px: number, py: number, pz: number): boolean {
    return Math.abs(px - this.x) < this.ex && Math.abs(pz - this.z) < this.ez && py < this.y + this.h && py > this.y - 0.5;
  }
}

function thornBed(b: Builder, x: number, z: number, hx: number, hz: number, damage: number, y: number): void {
  const bed = new ThornBed(b.game, x, y, z, hx, hz, damage);
  b.level.props.push(bed);
  b.level.hazards.push(bed);
  const thorn = mat(0x1a1020, { rough: 0.7 });
  const bramble = mat(0x2a1a2a, { rough: 1 });
  const vein = glowShared(0xa24cff);
  const r = b.decor.rng;
  for (let i = 0; i < 150; i++) {
    const px = x + (r.next() * 2 - 1) * hx;
    const pz = z + (r.next() * 2 - 1) * hz;
    const h = 0.5 + r.next() * 0.9;
    b.decor.add(GEO.cone(), thorn, px, y - 0.1, pz, 0.07 + r.next() * 0.05, h, 0.07 + r.next() * 0.05, r.signed() * 0.5, 0, r.signed() * 0.5, false);
    if (i % 3 === 0) b.decor.add(GEO.rock(), bramble, px, y, pz, 0.6 + r.next() * 0.5, 0.25, 0.6 + r.next() * 0.5, 0, r.next() * 6, 0, false);
    if (i % 9 === 0) b.decor.add(GEO.blobLow(), vein, px, y + 0.15, pz, 0.08, 0.08, 0.08, 0, 0, 0, false);
  }
  for (let i = 0; i < 6; i++) {
    const px = x + (r.next() * 2 - 1) * hx * 0.8;
    const pz = z + (r.next() * 2 - 1) * hz * 0.8;
    const a = r.next() * Math.PI * 2;
    hollowRoot(b, [[px, y - 0.4, pz], [px + Math.sin(a) * 1.4, y + 0.9, pz + Math.cos(a) * 1.4], [px + Math.sin(a) * 3.2, y - 0.3, pz + Math.cos(a) * 3.2]], 0.3);
  }
}

// --- the Thornpit: two vents, catch the second puff in mid-air ------------------------------------

function thornpit(b: Builder): void {
  const g = b.game;
  const { x, z, y } = PIT;
  // The thorns: the whole floor of the pit.
  thornBed(b, x + 2, z, 6.8, 7.8, 9, y);
  b.story('thornpit', 80, 172, 4, () => g.hud.flick('Thorns all the way across, and something shining on the high roots. Those two vents... one throws you up, the other throws you HIGHER, if you catch it right.', 8));
  // The entry ledge's vent, and the one out on a rock in the thorns.
  const va = sporeVent(b, 85, 172, { r: 1.35, h: 9, period: 3.0, phase: 0 }, 16);
  b.box(98, y - 0.5, 170.5, 3.4, 1.9, 3.4, ROCK.mid, { yaw: 0.3, trim: ROCK.moss });
  const vb = sporeVent(b, 98, 170.5, { r: 1.9, h: 9, reach: 12.5, period: 3.0, phase: 1.7 }, y + 1.4);
  void va;
  void vb;
  // The perch: high on the King's roots in the east wall.
  hollowRoot(b, [[PERCH.x + 3, y - 1, z - 6], [PERCH.x - 1, PERCH.y - 2, z - 2], [PERCH.x - 2, PERCH.y + 3, z + 3], [PERCH.x + 3, PERCH.y + 12, z + 6]], 1.4);
  hollowRoot(b, [[PERCH.x + 4, y, z + 7], [PERCH.x, PERCH.y - 4, z + 4], [PERCH.x + 2, PERCH.y + 8, z + 1]], 1.0);
  b.collectible('relic2', 'relic', PERCH.x, PERCH.z, PERCH.y, 'myc2');
  b.gems(PERCH.x, PERCH.z, 'blue', 4, 1.3, PERCH.y);
  crystalCluster(b, PERCH.x + 1.8, PERCH.z + 1.6, 0.7, SPORE.teal);
  b.puzzleHint(84, 172, 7, [
    'Ride the first vent up, then glide to the second just as its throat glows. It\'ll throw you higher, right out of the air.',
    'Watch the second vent\'s rhythm: it puffs a moment after the first. Launch off the first, glide straight at the second.',
  ], 'myc-perch', 25, 30);
  b.trigger(PERCH.x, PERCH.z, 3, () => b.level.emit('myc-perch'), true, PERCH.y);
  caps(b, 82, 166, 5, [SPORE.gold, ROT], 1.4);
  caps(b, 82, 178, 5, [SPORE.violet, ROT], 1.4);
  for (const [cx, cz] of [[88, 162], [96, 181], [102, 164]] as [number, number][]) stalagmites(b, cx, cz, 2.5, 3, { max: 6, glow: SPORE.violet });
}

// --- the Rootchoke ---------------------------------------------------------------------------------------

function rootchoke(b: Builder, pulses: Pulses): void {
  const g = b.game;
  const { x, z, y } = CHOKE;
  layoutRealm(b, ROOTWAY);
  // The way in: roots grown across the passage. They burn.
  rootWall(b, 38.3, 181.4, 41.7, 187.6, 4.2, { element: 'fire', signal: 'myc-choke-in' });
  b.story('rootchoke', 44, 181, 5, () => g.say([
    { who: 'flick', text: 'Those roots... they\'re not hers. They\'re HIS. Look, the white threads are wrapped all round them.' },
    { who: 'nyxa', text: 'Her threads gather the light. His roots drink it. A marriage. I can hear him through them, Aster. He\'s... pleased.' },
    { who: 'aster', text: 'He won\'t be for long. Burn them, Flick?' },
    { who: 'flick', text: 'Burn them!' },
  ]));
  // The fight: Rootspawn in their own country.
  const ar = b.arena('rootchoke', x, z, 12, [
    [{ type: 'rootstalker', x: x - 5, z: z + 6 }, { type: 'rootstalker', x: x + 6, z: z - 4, delay: 0.4 }, { type: 'sporeling', x: x, z: z + 8, delay: 0.6 },
      { type: 'sporeling', x: x - 7, z: z - 3, delay: 0.8 }],
    [{ type: 'thornspitter', x: x - 9, z: z + 5 }, { type: 'thornspitter', x: x + 9, z: z + 5, delay: 0.3 }, { type: 'rootstalker', x: x, z: z - 7, delay: 0.6 },
      { type: 'puffcap', x: x + 4, z: z + 9, delay: 0.8 }],
    [{ type: 'brute', x: x, z: z + 5 }, { type: 'rootstalker', x: x - 6, z: z - 5, delay: 0.5 }, { type: 'sporeling', x: x + 6, z: z - 5, delay: 0.7 },
      { type: 'sporeling', x: x + 3, z: z - 8, delay: 0.9 }],
  ], 60);
  ar.onStart = () => {
    if (g.save.found['story:mycelium:choke-fight']) return;
    g.save.found['story:mycelium:choke-fight'] = true;
    g.hud.flick('Rootspawn! The stalkers burrow, watch the ground move! And stay out of those spitters\' sight!', 6);
  };
  // The way on to the grove: roots across it that only wither once the Rootchoke is won.
  const seal = rootWall(b, 7.6, 192.9, 12.3, 199, 4.6, { element: 'fire', signal: 'myc-choke-out' });
  if (seal) {
    // Not Aster's to burn: take it out of reach of her breath, and burn it when the fight is won.
    const i = b.level.hittables.indexOf(seal);
    if (i >= 0) b.level.hittables.splice(i, 1);
    const wither = () => witherSeal(seal);
    if (ar.state === 'cleared') wither();
    else ar.onClear = () => {
      wither();
      g.hud.flick('The roots across the far passage... they\'re shrivelling! The way to the grove is open.', 6);
    };
  }
  b.checkpoint('rootchoke', 15, 197.2, Math.PI * 1.7);
  // The great roots, through floor and vault, wrapped in her white threads.
  const R = [
    [[x - 15, y - 2, z - 5], [x - 9, y + 14, z - 4], [x - 6, y + 30, z - 2], [x - 5, y + 52, z]],
    [[x + 13, y - 2, z + 7], [x + 9, y + 16, z + 5], [x + 11, y + 34, z + 2], [x + 14, y + 52, z - 1]],
    [[x - 3, y + 52, z + 14], [x - 1, y + 30, z + 13], [x + 3, y + 12, z + 14], [x + 2, y - 2, z + 15]],
    [[x + 6, y + 50, z - 14], [x + 4, y + 26, z - 13], [x + 7, y + 8, z - 14], [x + 9, y - 2, z - 15]],
  ] as [number, number, number][][];
  R.forEach((pts, i) => {
    hollowRoot(b, pts, 2.2 - i * 0.2, { collide: true });
    // Mycelium spiralling round it.
    const spiral: [number, number, number][] = [];
    const curve = new THREE.CatmullRomCurve3(pts.map(([px, py, pz]) => new THREE.Vector3(px, py, pz)));
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      const p = curve.getPointAt(t);
      const rr = (2.2 - i * 0.2) * (1 - 0.7 * t) + 0.1;
      const a = t * 18;
      spiral.push([p.x + Math.sin(a) * rr, p.y, p.z + Math.cos(a) * rr]);
    }
    vein(b, spiral, 0.07, SILK, pulses);
  });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.2;
    const px = x + Math.sin(a) * 15;
    const pz = z + Math.cos(a) * 15;
    if (nearRoute(ROOTWAY, px, pz, 3) || nearRoute(MOUTH, px, pz, 3) || Math.abs(px - HOLLOW.x) < 4 && pz < z) continue;
    const ay = b.col.terrainAt(px, pz);
    hollowRoot(b, [[px, ay - 1, pz], [px + Math.sin(a) * 1.5, ay + 3, pz + Math.cos(a) * 1.5], [px + Math.sin(a) * 3.5, ay + 1, pz + Math.cos(a) * 3.5]], 0.5, { thorns: true });
  }
  b.gemLine([[x + 8, z - 2], [x - 8, z + 2]], 'blue', 2);
  b.breakables('pod', [[x - 10, z - 6], [x - 9, z - 7.2], [x + 10, z + 8], [x + 11, z + 6.8]]);
  for (const [cx, cz] of [[x - 12, z + 3], [x + 12, z - 3], [x + 2, z + 12.5]] as [number, number][]) crystalCluster(b, cx, cz, 0.9, SPORE.violet);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.5;
    const px = x + Math.sin(a) * 13.2;
    const pz = z + Math.cos(a) * 13.2;
    if (nearRoute(ROOTWAY, px, pz, 2) || nearRoute(MOUTH, px, pz, 2) || (Math.abs(px - HOLLOW.x) < 4 && pz < z)) continue;
    caps(b, px, pz, 4, [SPORE.violet, SPORE.pink, SPORE.teal], 1.2);
  }
  lichen(b, x, 13, z - 12, z + 12, 1, 18, 50);
  strangledHollow(b);
}

/** Withers a root seal the realm (not the dragon) opens. */
function witherSeal(gate: RootGate): void {
  gate.takeHit({
    damage: 999, type: 'fire', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 0, heavy: false, spike: false,
    source: 'env', move: 'wither', fromPlayer: false, ox: gate.x, oz: gate.z,
  });
}

/** Off the Rootchoke's south side, behind more roots: a hollow the thorns have strangled, and a fight. */
function strangledHollow(b: Builder): void {
  const g = b.game;
  const { x, z } = HOLLOW;
  const y = CHOKE.y;
  rootWall(b, x - 2.6, 174.8, x + 2.6, 174.8, 3.8, { element: 'fire' });
  const ar = b.arena('strangled', x, z, 8, [
    [{ type: 'thornspitter', x: x - 5, z: z - 4 }, { type: 'rootstalker', x: x + 4, z: z + 3, delay: 0.3 }, { type: 'sporeling', x: x, z: z - 5, delay: 0.5 }],
    [{ type: 'thornspitter', x: x + 5, z: z - 4 }, { type: 'rootstalker', x: x - 4, z: z + 4, delay: 0.3 }, { type: 'rootstalker', x: x + 2, z: z - 2, delay: 0.6 }],
  ], 45);
  ar.onClear = () => g.hud.flick('That\'s the Hollow cleared. Something was scribbled on the wall back there...', 5);
  b.letter('root', x - 5, z - 5.5, y);
  hollowRoot(b, [[x - 8, y - 1, z - 3], [x - 5, y + 5, z - 6], [x, y + 9, z - 9], [x + 5, y + 3, z - 8]], 1.1);
  hollowRoot(b, [[x + 9, y - 1, z + 2], [x + 6, y + 6, z - 2], [x + 7, y + 14, z - 5]], 0.9);
  b.breakables('urn', [[x + 6, z - 5], [x + 6.8, z - 3.8]]);
  crystalCluster(b, x + 6, z + 5, 0.8, SPORE.violet);
  b.gems(x, z, 'blue', 6, 3);
}

// --- Mycora's Grove ---------------------------------------------------------------------------------------

/** Cocoons stuck round the grove's walls: the rest of the lost foragers, freed when Mycora falls. */
const GROVE_COCOONS: [number, number, number][] = ([[-0.35, 27.8, 2.4], [0.4, 27.8, 3.2], [-0.95, 27.6, 2], [1.0, 27.6, 2.8], [-1.55, 27.4, 1.8], [1.6, 27.4, 2.4]] as [number, number, number][])
  .map(([a, r, h]) => [Math.sin(a) * r, 230 + Math.cos(a) * r, h]);

function grove(b: Builder): void {
  const g = b.game;
  const { x, z, y, r } = GROVE;
  const done = !!g.save.levelsDone.mycelium;
  layoutRealm(b, MOUTH);
  buildMycoraArena(b, x, z, r);
  b.story('grove', 0, 199, 5, () => g.hud.flick('Hear that hum? It\'s coming from in there. It\'s... singing?', 5));
  // Around the floor (never on it): tall caps at its rim, great brackets up the walls, the King's roots down out of the vault.
  const rim: [number, number, number, number][] = [[2.2, 7, 2.9, 0xff6ab8], [-2.2, 8, 3.1, SPORE.violet], [1.35, 10, 3.1, SPORE.violet], [-1.3, 9, 2.9, 0xff6ab8],
    [0.5, 12, 3.2, SPORE.violet], [-0.55, 11, 3.2, SPORE.pink], [2.65, 6, 2.6, SPORE.teal], [-2.7, 6.5, 2.6, SPORE.teal]];
  for (const [a, h, cr, c] of rim) giantCap(b, x + Math.sin(a) * 27.6, z + Math.cos(a) * 27.6, h, cr, c, y);
  for (let i = 0; i < 14; i++) {
    const a = -2.5 + (i / 13) * 5;
    const rr = 30.5 + (i % 3) * 0.8;
    const px = x + Math.sin(a) * rr;
    const pz = z + Math.cos(a) * rr;
    const py = y + 14 + (i % 4) * 5 + Math.abs(jitter(i, 3)) * 4;
    bracket(b, px, py, pz, 3.2 + (i % 3) * 1.1, a + Math.PI, [SPORE.violet, 0xff6ab8, SPORE.gold, SPORE.teal][i % 4]!);
  }
  // Her own great cap, out of the north wall above the grove: the Spore Mother's canopy.
  bracket(b, x, y + 30, z + 33, 11, Math.PI, SPORE.violet);
  bracket(b, x - 7, y + 22, z + 32, 5, Math.PI * 0.9, 0xff6ab8);
  bracket(b, x + 8, y + 24, z + 32, 5.5, Math.PI * 1.1, SPORE.violet);
  for (const [a0, len] of [[-2.3, 1.9], [2.2, 2.1], [0.2, 2.4], [-1.1, 1.6], [1.1, 1.7]] as [number, number][]) {
    const px = x + Math.sin(a0) * 34;
    const pz = z + Math.cos(a0) * 34;
    hollowRoot(b, [[px, y + 48, pz], [x + Math.sin(a0) * 31, y + 26, z + Math.cos(a0) * 31], [x + Math.sin(a0) * 28.5, y + 6, z + Math.cos(a0) * 28.5],
      [x + Math.sin(a0) * 27.5, y - 1, z + Math.cos(a0) * 27.5]], len);
  }
  // Threads of light running down the walls to the grove's rim.
  for (let i = 0; i < 18; i++) {
    const a = -2.6 + (i / 17) * 5.2;
    const pts: [number, number, number][] = [];
    for (let k = 0; k <= 6; k++) {
      const rr = 33 - k * 0.95;
      const px = x + Math.sin(a + Math.sin(k + i) * 0.02) * rr;
      const pz = z + Math.cos(a + Math.sin(k + i) * 0.02) * rr;
      pts.push([px, Math.max(y, b.col.terrainAt(px, pz)) + 0.12, pz]);
    }
    vein(b, pts, 0.09, i % 2 ? SPORE.teal : SPORE.gold);
  }
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const px = x + Math.sin(a) * 26.2;
    const pz = z + Math.cos(a) * 26.2;
    if (pz < z - 22) continue;
    caps(b, px, pz, 3, [0xff6ab8, SPORE.violet, SPORE.gold], 0.8);
  }
  // The lost foragers, cocooned round the walls.
  const cocoons = new THREE.Group();
  const silk = mat(0xe8e0f0, { rough: 0.9, emissive: 0x6a5a9a, emissiveIntensity: 0.5 });
  for (const [cx, cz, cy] of GROVE_COCOONS) {
    const c = ellipsoid(0.6, 1.0, 0.6, silk, 10);
    c.position.set(cx, y + cy, cz);
    c.rotation.z = jitter(cx, 2) * 0.3;
    const lamp = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), glowShared(SPORE.gold));
    lamp.position.set(cx, y + cy + 0.1, cz + (cz > z ? -0.5 : 0.5));
    cocoons.add(c, lamp, limb(new THREE.Vector3(cx, y + cy + 0.9, cz), new THREE.Vector3(cx * 1.05, y + cy + 4, cz + (cz > z ? 1 : -1)), 0.05, 0.03, glowShared(0xd8c8ff), 4));
  }
  mergeStatic(cocoons);
  cocoons.visible = !done;
  b.level.root.add(cocoons);
  groveCocoons = cocoons;

  bossFight(b, {
    id: 'mycora', name: 'Mycora', x, z, r, triggerX: 0, triggerZ: 204, triggerR: 5,
    spawn: (gg) => new Mycora(gg, 0, y, 240, Math.PI),
    intro: [
      { who: 'flick', text: 'Aster. The floor\'s... humming.', action: () => {
        g.shake(0.4, 1.2);
        g.sfx('rumble', 0, y, 240, 0.7);
        g.fx.motes(0, y + 3, 240, SPORE.gold, 40);
      } },
      { who: 'mycora', text: 'Hush now. Hush. More little lamps, come down to feed my garden?' },
      { who: 'flick', text: 'It TALKS. The giant mushroom lady TALKS.' },
      { who: 'mycora', text: 'I am Mycora, Mother of the Deep. My threads run under every stone, and the King\'s roots drink what my threads gather. A fine marriage.' },
      { who: 'nyxa', text: 'You\'ve wrapped the Burrowfolk up like winter jam.' },
      { who: 'mycora', text: 'They sleep, and they glow, and his roots grow fat. Everyone is useful to me, little shadow. Even you.' },
      { who: 'aster', text: 'Let them go.' },
      { who: 'mycora', text: 'Come closer, violet one. You would make SUCH a lovely lamp.' },
    ],
    onDefeated: (gg) => myceliumOutro(gg),
  });
  if (done) homePortal(b);
  b.gemLine([[0, 198], [0, 205]], 'blue', 1.8);
}

/** The grove's cocoons, for the outro to burst. */
let groveCocoons: THREE.Group | null = null;

/** The way home once Mycora has fallen: just inside the grove's mouth. */
function homePortal(b: Builder): void {
  b.portal(-3.2, 200.5, Math.PI, 'hollow', 'Return to the Hollow Gate', 0xc890ff);
}

function myceliumOutro(g: Game): void {
  const level = g.level;
  if (!level || level.def.id !== 'mycelium') return;
  const { y } = GROVE;
  // The cocoons split, the lost foragers tumble out.
  if (groveCocoons) groveCocoons.visible = false;
  for (const [cx, cz, cy] of GROVE_COCOONS) {
    g.fx.emit(cx, y + cy, cz, { count: 24, speed: 4, spread: 1, life: [0.6, 1.2], size: [0.15, 0.3], sizeEnd: 0.4, color: 0xf0e8ff, alpha: 0.9, additive: false, gravity: 4, jitter: 0.5 });
    g.fx.motes(cx, y + cy, cz, SPORE.gold, 14);
  }
  g.sfx('relic', 0, y, 230, 1.2);
  const home: Forager[] = [];
  GROVE_COCOONS.forEach(([cx, cz], i) => {
    const fx = cx * 0.8;
    const fz = 230 + (cz - 230) * 0.8;
    const fy = g.col.groundAt(fx, fz, y + 5, 0.3).y;
    const f = new Forager(g, `lost${i}`, fx, fy, fz, Math.atan2(-fx, 230 - fz), Object.values(LOOKS)[i % 4]!, true, () => {});
    level.props.push(f);
    home.push(f);
  });
  g.say([
    { who: 'flick', text: 'She\'s... she\'s going to dust. Spores everywhere. Nobody breathe.' },
    { who: 'nyxa', text: 'Listen. The hum\'s gone. And under it... Aster, the roots. I felt them flinch. All the way up.' },
    { who: 'aster', text: 'The roots over the Hollow\'s gates?' },
    { who: 'nyxa', text: 'Her threads fed them. They\'ll starve a little now. Only a little. He has other gardens.' },
    { who: 'flick', text: 'Then we find those too. Look, look, the cocoons! Everyone\'s coming out!' },
    { who: 'bramble', text: 'That\'s the last of us! Every forager of Lanternhollow, out and blinking. Home, all of you, and nobody stop for mushrooms.' },
    { who: 'aster', text: 'Mossa said four gates. That\'s one.' },
    { who: 'flick', text: 'One down! The Drowned City next, right? I\'m going to need a very small bucket.' },
  ], () => {
    g.save.levelsDone.mycelium = true;
    g.save.found['story:mycelium:done'] = true;
    g.saveNow();
    // The way home, and the foragers already on it.
    const px = -3.2;
    const pz = 200.5;
    const portal = new Portal(g, px, g.col.groundAt(px, pz, 1e4, 0.2).y, pz, Math.PI, 'hollow', 'Return to the Hollow Gate', 0xc890ff);
    level.props.push(portal);
    level.interactables.push(portal);
    g.fx.ring(px, y + 0.3, pz, 0.5, 5, 0xc890ff, 0.7);
    g.audio.play('unlock');
    g.toast('A way home has opened by the grove\'s mouth.', 'good');
    g.audio.setMusic(null);
    for (const f of home) level.props.push(new Homeward(g, f, px, pz));
  });
}

/** A freed forager trotting off to the portal, and through it. */
class Homeward implements Prop {
  private t = 0;
  private gone = false;
  constructor(private game: Game, private f: Forager, private tx: number, private tz: number) {}
  update(dt: number): void {
    if (this.gone) return;
    this.t += dt;
    const root = this.f.root;
    if (this.t < 1 + (this.f.x % 3)) return;
    const dx = this.tx - root.position.x;
    const dz = this.tz - root.position.z;
    const d = Math.hypot(dx, dz);
    if (d < 1.2) {
      this.gone = true;
      root.visible = false;
      this.game.fx.motes(root.position.x, root.position.y + 0.8, root.position.z, 0xc890ff, 10);
      return;
    }
    const sp = Math.min(d, dt * 4.5);
    root.position.x += (dx / d) * sp;
    root.position.z += (dz / d) * sp;
    root.position.y = this.game.col.groundAt(root.position.x, root.position.z, root.position.y + 1.5, 0.2).y + Math.abs(Math.sin(this.t * 14)) * 0.08;
    root.rotation.y = Math.atan2(dx, dz);
  }
}

// --- skill trackers -----------------------------------------------------------------------------------

/**
 * Skill Points: "Cap Hopper" (from the Capstair's floor cap to the top
 * without touching anything but mushrooms) and "Blightburner" (every blight
 * cloud in the Deep burnt in one visit).
 */
function trackers(b: Builder, floor: BounceCap): void {
  const g = b.game;
  let run = false;
  let last = floor.bounces;
  b.level.props.push({
    update: () => {
      if (g.save.found[skillKey('mycelium:capstair')]) return;
      const body = g.player.body;
      if (floor.bounces !== last) {
        last = floor.bounces;
        run = true;
        return;
      }
      if (!run || !body.grounded) return;
      const s: Solid | null = body.ground;
      if (s?.tag === CAP_TAG) return;
      if (body.y > TOP - 0.6 && body.z > 97) g.skill('mycelium:capstair');
      run = false;
    },
  });
  const clouds = b.level.props.filter((p): p is BlightCloud => p instanceof BlightCloud);
  let told = false;
  b.level.props.push({
    update: () => {
      if (told || clouds.length === 0 || g.save.found[skillKey('mycelium:blight')]) return;
      if (clouds.every((c) => c.burns > 0)) {
        told = true;
        g.skill('mycelium:blight');
      }
    },
  });
}

// --- story ------------------------------------------------------------------------------------------------

function arrive(g: Game): void {
  g.hud.prompt(null);
  const lines: Line[] = [
    { who: 'flick', text: 'Whoa. WHOA. Aster, it\'s snowing. Underground. Is it supposed to do that?', shot: 'wide' },
    { who: 'nyxa', text: 'Spores. Don\'t breathe too deep. This is the Mycelium Deep: the Burrowfolk\'s foragers came this way.' },
    { who: 'aster', text: 'And didn\'t come back. Mossa said the Deep feeds the roots on the gates.' },
    { who: 'nyxa', text: 'I can feel it. Something down here is humming, like a second heart. His roots are listening to it.' },
    { who: 'flick', text: 'A giant glowing mushroom forest with a humming heart. Great. Love it. Can we go home?' },
    { who: 'aster', text: 'Not without the foragers.' },
    { who: 'flick', text: 'Fine. But if I get spores in my glow, I\'m blaming you.' },
  ];
  g.say(lines, () => {
    g.saveNow();
    g.hud.flick('North through the Sporefall, Aster. And keep an eye out for foragers\' lamps: they\'ll show us the way they went.', 7);
  });
}

