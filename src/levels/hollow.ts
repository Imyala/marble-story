import * as THREE from 'three';
import type { LevelDef, Builder } from '../world/level';
import { Npc } from '../world/level';
import { ambient, jitter, mix } from './common';
import { NYXA_FREED } from '../game/story';
import { eggsFound } from '../game/progress';
import { MYCELIUM_EGGS } from '../game/quests';
import type { Game } from '../game/game';
import type { Line } from '../ui/dialogue';
import { Talker, type Prop } from '../entities/props';
import { twinPlates } from '../entities/twinplate';
import { makeCyl } from '../world/collision';
import { GEO } from '../render/decor';
import { mat, glowShared } from '../render/materials';
import { ellipsoid, limb, mergeStatic } from '../render/shapes';
import { clamp01, smoothstep } from '../core/math';
import { rng } from '../core/rng';
import {
  ROCK, archway, carveRealm, caveCeiling, crystalCluster, cavernWall, dock, dragonStatue, fungalGrove, hollowRoot, lanternPost,
  layoutRealm, nearRoute, rockSlab, routeAt, routeLength, ruinHall, sealedGate, stalagmites, type RealmPlan,
} from '../world/kits';

/**
 * The Hollow Gate: Act II's hub, a vast glowing cavern under the Warden
 * Sanctum, reached through the fissure that opens there once Eclipse Keep is
 * won. A luminous lake fills the middle (swimmable: dive for its sunken
 * shrine, the drowned canal and the hidden grotto); the Rootway winds down
 * from the arrival ledge; the Glowcap Wood lies east, the ruins of the Old
 * Aerie west, and the Burrowfolk's camp, Lanternhollow, on the south shore.
 * Four sealed gates lead to the realms of Act II (not open yet).
 *
 * The three routes (Rootway, Aerie Walk, Glowcap Trail) are laid out with
 * the realm template in src/world/kits.ts; the lake, camp, ruins and gates
 * are hand-placed on top.
 */

const WL = 0;

/** From the arrival ledge down a root-choked ravine to the north shore. */
const ROOTWAY: RealmPlan = {
  path: [[0, 86, 13.5], [-7, 79, 12.6], [-12, 70, 10.2], [-8, 61, 6.6], [0, 55, 3.4], [4, 47, 1.3]],
  width: 7, cut: 'canyon', dressing: 'roots', lights: 12, lightColor: 0x8ff0e0, gems: 3.2,
  pockets: [
    { at: 0.3, side: 1, len: 6, r: 3.6, rise: 0.4, reward: { relic: 'relic2', relicId: 'hollow2' }, seal: 'roots' },
    { at: 0.64, side: -1, len: 5.5, r: 3.2, reward: { letter: 'scout' } },
  ],
};

/** West from the lake along the old dragons' avenue to the Old Aerie and the Crystal Mine gate. */
const AERIE: RealmPlan = {
  path: [[-40, 8, 1.2], [-53, 12, 2.0], [-66, 13, 3.0], [-80, 15, 3.0], [-97, 12, 3.2]],
  width: 8, cut: 'trail', dressing: 'ruins', lights: 15, lightColor: 0xffc070,
  arenas: [{ id: 'aerie', at: 0.64, r: 9, waves: [], reward: 45 }],
  pockets: [{ at: 0.86, side: -1, len: 6, r: 3.4, reward: { gems: 26 }, seal: 'rock' }],
};

/** East from the lake through the Glowcap Wood to the Mycelium Deep gate. */
const GLOWCAP: RealmPlan = {
  path: [[38, 22, 1.2], [52, 24, 2.0], [66, 16, 2.2], [82, 10, 2.2], [99, 16, 2.4]],
  width: 7, cut: 'trail', dressing: 'fungal', lights: 13, lightColor: 0xc890ff, gems: 3.5, density: 1.2,
  pockets: [{ at: 0.52, side: 1, len: 6, r: 3.4, reward: { gems: 30 }, seal: 'wood' }],
};

// The Aerie fight, around its arena's spot on the route.
{
  const p = routeAt(AERIE, 0.64);
  AERIE.arenas![0]!.waves = [
    [{ type: 'grunt', x: p.x + 4, z: p.z - 5 }, { type: 'grunt', x: p.x - 5, z: p.z + 4, delay: 0.3 }, { type: 'slinger', x: p.x + 1, z: p.z + 7, delay: 0.6 }],
    [{ type: 'crawler', x: p.x + 6, z: p.z + 1 }, { type: 'shieldbearer', x: p.x - 6, z: p.z - 3, delay: 0.3 }, { type: 'grunt', x: p.x, z: p.z - 7, delay: 0.5 }],
  ];
}

// Where things are.
const LAKE = { x: 0, z: -4 };
const ISLET = { x: 0, z: -4, top: 2.0 };
const SHRINE = { x: 18, z: -11 };
const GROTTO = { x: -58, z: -52 };
const CANAL: [number, number, number][] = [[24, -28, -3], [38, -40, -3], [48.5, -47.5, -3]];
const INLET: [number, number, number][] = [[-26, -30, -6.5], [-40, -40, -6.5], [-55, -49.5, -6.5]];
const CAMP = { x: 0, z: -56 };
const LANDING = { x: 0, z: 92, top: 13.5 };
const GROVE = { x: 72, z: 32 };
/** Where glowing water pours down from a crack in the ceiling into the lake. */
const SKYFALL = { x: -15, z: -17 };
const HALL = { x: -79, z: 32 };

const C = {
  bed: 0x0e3a40, bedShallow: 0x1f7068, shore: 0x2e5e58, floor: 0x4a4458, floor2: 0x5a5068, moss: 0x2e6a60,
  fungal: 0x4a3a68, fungal2: 0x5c4478, stone: 0x6a6678, stone2: 0x787486, rock: 0x3a3446, rockHi: 0x4a4258, path: 0x7a7088,
};

export const hollow: LevelDef = {
  id: 'hollow',
  name: 'The Hollow Gate',
  subtitle: 'Where the roots come up from the deep',
  music: 'hollow',
  killY: -30,
  spawn: [LANDING.x, LANDING.z, Math.PI],
  sky: {
    top: 0x070812, horizon: 0x12303a, bottom: 0x060a0e, sunDir: [0.08, 0.9, 0.45], sunColor: 0xb8c8ff, sunIntensity: 1.35,
    hemiSky: 0x8070c0, hemiGround: 0x2a9a90, hemiIntensity: 2.1, fogNear: 30, fogFar: 165, stars: 0, fog: 0x12303a, clouds: 0,
  },
  water: { level: WL, deep: 0x083a48, shallow: 0x27aaa2, glint: 0xa8fff0, opacity: 0.8, swim: true },
  terrain: {
    x0: -130, z0: -110, sizeX: 260, sizeZ: 240, cell: 1.5,
    color: (x, z, h, slope, path) => {
      let c: number;
      if (h < -0.3) c = mix(C.bed, C.bedShallow, clamp01((h + 8) / 7.5));
      else if (h < 0.9) c = mix(C.bedShallow, C.shore, (h + 0.3) / 1.2);
      else {
        const n = Math.sin(x * 0.21 + z * 0.13) * 0.5 + Math.sin(x * 0.05 - z * 0.09) * 0.5;
        c = mix(C.floor, C.floor2, n * 0.5 + 0.5);
        c = mix(c, mix(C.fungal, C.fungal2, n * 0.5 + 0.5), smoothstep(38, 56, x));
        c = mix(c, mix(C.stone, C.stone2, n * 0.5 + 0.5), smoothstep(-38, -56, x));
        // Glowing moss creeps up from the lake.
        const dl = Math.hypot(x - LAKE.x, z - LAKE.z);
        c = mix(c, C.moss, (1 - smoothstep(40, 52, dl)) * (1 - smoothstep(1.2, 3, h)) * 0.8);
      }
      if (slope > 0.7) c = mix(c, h > 14 ? C.rockHi : C.rock, clamp01((slope - 0.7) * 1.6));
      if (path > 0) c = mix(c, C.path, path * 0.6);
      return c;
    },
    shape: (s) => {
      // Solid rock, with the cavern hollowed out of it.
      s.base(56).noise(3, 0.04, 9);
      s.flatten(0, 0, 58, 1.2, 14);
      s.flatten(LANDING.x, LANDING.z, 10, LANDING.top, 5);
      s.flatten(74, 14, 24, 2.2, 10);
      s.flatten(-76, 16, 24, 3.0, 9);
      s.flatten(CAMP.x, CAMP.z - 4, 15, 1.4, 6);
      // Alcoves for the sealed gates.
      s.flatten(106, 16, 7, 2.4, 3);
      s.flatten(-106, 12, 7, 3.2, 3);
      s.flatten(-45, -70, 7, 1.4, 3);
      s.path([[-8, -60, 1.4], [-24, -65, 1.4], [-41, -69, 1.4]], 5, 3, true, false);
      // A lumpy floor.
      for (const [x, z, r, h] of [[-26, 30, 9, 1.4], [26, 36, 7, 1.1], [-44, -14, 8, 1.6], [46, -18, 7, 1.2], [60, 40, 8, 1.6], [86, 26, 7, 1.8],
        [-64, 34, 6, 1.2], [-92, 0, 7, 2.2], [18, -60, 7, 1.4], [-20, -48, 6, 1.0], [34, 50, 6, 1.5]] as [number, number, number, number][]) s.mound(x, z, r, h);
      // The routes, from the template.
      carveRealm(s, ROOTWAY);
      carveRealm(s, AERIE);
      carveRealm(s, GLOWCAP);
      // The drowned canal, out to the Drowned City's gate in the south-east wall.
      s.path(CANAL, 9, 3, false, false);
      s.flatten(49.5, -48.5, 5.5, -3, 2);
      // The lake: a shelf round the edge, a deep bowl in the middle, an islet at its heart.
      s.pit(LAKE.x, LAKE.z, 40, -2.4, 4);
      s.pit(LAKE.x, LAKE.z, 28, -9, 7);
      s.island(ISLET.x, ISLET.z, 5.5, ISLET.top, 3, 0.15);
      // The hidden grotto: a pool inside the south-west rock, reached by a channel that runs under the cliff.
      s.path(INLET, 4.5, 1.2, false, false);
      s.pit(GROTTO.x, GROTTO.z, 6.5, -6.5, 1.5);
    },
  },

  build(b: Builder) {
    const g = b.game;
    ambient(b, 'firefly', 8);
    b.bound(-126, -106, 126, -106);
    b.bound(126, -106, 126, 126);
    b.bound(126, 126, -126, 126);
    b.bound(-126, 126, -126, -106);
    // Seen from below, the lake's surface should still be there.
    const wm = b.level.water?.mesh.material as THREE.Material | undefined;
    if (wm) wm.side = THREE.DoubleSide;

    const ceil = ceiling(b);
    skyfall(b, SKYFALL.x, SKYFALL.z, ceil(SKYFALL.x, SKYFALL.z));
    landing(b);
    layoutRealm(b, ROOTWAY);
    rootwayRings(b);
    lake(b);
    grotto(b);
    canal(b);
    camp(b);
    aerie(b);
    glowcap(b);
    gates(b);
    greatRoots(b);
    dressFloor(b);
    b.level.props.push(new Glints(g));
    // (The cavern walls need no guard of their own: landings on terrain too steep to walk slide off it, see Body.slideSteep.)
  },

  onEnter(g, fresh) {
    if (!g.save.found['story:hollow:arrive']) {
      g.save.found['story:hollow:arrive'] = true;
      arrive(g);
      return;
    }
    if (fresh) g.hud.flick('The Hollow Gate. Tap H and I\'ll sniff out anything shiny. Hold it and I\'ll point the way.', 5);
  },
};

// --- the cavern -----------------------------------------------------------------------------------

/** The vaulted ceiling over everything, a fissure of daylight above the landing, glow-worms. Returns its height. */
function ceiling(b: Builder): (x: number, z: number) => number {
  const height = caveCeiling(b, 0, 10, 250, 230, 44, { rise: 24, holes: [[LANDING.x, LANDING.z + 3, 7]], glowworms: 420, wormColor: 0x8ff0e0, stalactites: 90 });
  // The light shaft down from the Sanctum, through the crack the roots made.
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 9, 44, 24, 1, true), new THREE.MeshBasicMaterial({
    color: 0xcfe8ff, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false,
  }));
  shaft.position.set(LANDING.x, LANDING.top + 21, LANDING.z + 3);
  // Daylight through the crack the roots tore in the Sanctum's lawn, far above.
  const day = glowShared(0xe8f4ff);
  const top = height(LANDING.x, LANDING.z + 3) + 3;
  for (const [dx, dz, len, yaw] of [[-3.5, 1.5, 4.5, 1.1], [-0.5, 0.2, 4, 2.0], [2.8, -1.2, 4.6, 1.2], [5.2, -2.6, 3, 1.9]] as [number, number, number, number][]) {
    b.decor.add(GEO.box(), day, LANDING.x + dx, top, LANDING.z + 3 + dz, 1.6, 0.2, len, 0, yaw, 0, false);
  }
  b.level.root.add(shaft);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 4.5, 44, 16, 1, true), shaft.material);
  inner.position.copy(shaft.position);
  b.level.root.add(inner);
  b.level.props.push(new ShaftMotes(b.game, LANDING.x, LANDING.top, LANDING.z + 3));
  return height;
}

const FALL_VERT = /* glsl */ `
varying vec2 vUv;
varying float vY;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vY = w.y;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FALL_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
varying float vY;
void main() {
  // Streaks racing down, brighter at the core of the fall, fading out near the top.
  float streak = smoothstep(0.55, 1.0, sin(vUv.x * 60.0 + sin(vUv.x * 13.0) * 3.0) * 0.5 + 0.5);
  float flow = fract(vY * 0.08 + uTime * 1.3 + sin(vUv.x * 31.0) * 0.4);
  float a = (0.25 + 0.75 * streak) * (0.35 + 0.65 * smoothstep(0.0, 0.25, flow) * (1.0 - smoothstep(0.6, 1.0, flow)));
  a *= smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.85, 1.0, vUv.y));
  gl_FragColor = vec4(uColor * (0.8 + streak * 0.6), a * 0.55);
}`;

/**
 * The Skyfall: glowing water pouring from a crack in the ceiling into the
 * lake, the one landmark visible from everywhere in the Hollow Gate. An
 * animated curtain, mist and ripples where it lands.
 */
function skyfall(b: Builder, x: number, z: number, top: number): void {
  const g = b.game;
  const u = { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x7af0e0) } };
  const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: FALL_VERT, fragmentShader: FALL_FRAG, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const h = top - WL + 2;
  for (const [r0, r1] of [[1.1, 1.6], [0.6, 0.9]] as [number, number][]) {
    const fall = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, 16, 1, true), m);
    fall.position.set(x, WL + h / 2 - 0.5, z);
    b.level.root.add(fall);
  }
  // The crack it pours from.
  b.decor.add(GEO.cone(), glowShared(0x7af0e0), x, top - 0.5, z, 2.2, 1.2, 1.2, Math.PI, 0.6, 0, false);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05;
    b.decor.add(GEO.cone(), mat(ROCK.dark, { rough: 1, flat: true }), x + Math.sin(a) * 3, top + 0.5, z + Math.cos(a) * 3, 1.2, 4 + (i % 3) * 2, 1.2, Math.PI, a, 0, false);
  }
  b.level.props.push({
    update: (dt: number) => {
      u.uTime.value = g.realTime;
      const p = g.player;
      if (Math.hypot(p.x - x, p.z - z) > 60) return;
      if (rng.chance(dt * 30)) {
        const a = rng.next() * Math.PI * 2;
        g.fx.emit(x + Math.sin(a) * 1.4, WL + 0.2, z + Math.cos(a) * 1.4, {
          count: 2, speed: 2.5, dir: [Math.sin(a), 1.6, Math.cos(a)], spread: 0.5, life: [0.8, 1.6], size: [0.5, 0.9], sizeEnd: 3.5,
          color: 0xd8fff8, alpha: 0.3, additive: false, drag: 1.5, gravity: 1,
        });
      }
      if (rng.chance(dt * 1.6)) g.fx.ring(x, WL + 0.04, z, 1.4, 5, 0xbff8f0, 1.6);
    },
  });
  b.story('skyfall', x + 7, z + 5, 9, () => g.hud.flick('A waterfall from the ceiling! So that\'s where the lake gets its glow.', 6));
}

/** Dust turning slowly in the shaft of light, only while the dragon is near. */
class ShaftMotes implements Prop {
  private t = 0;
  constructor(private game: Game, private x: number, private y: number, private z: number) {}
  update(dt: number): void {
    const p = this.game.player;
    if (Math.hypot(p.x - this.x, p.z - this.z) > 40) return;
    this.t += dt * 5;
    while (this.t >= 1) {
      this.t -= 1;
      const a = rng.next() * Math.PI * 2;
      const r = Math.sqrt(rng.next()) * 6;
      this.game.fx.emit(this.x + Math.sin(a) * r, this.y + 1 + rng.next() * 16, this.z + Math.cos(a) * r, {
        count: 1, speed: 0.15, life: [3, 5], size: [0.06, 0.12], sizeEnd: 1, color: 0xfff4d8, bright: 1.5, drag: 0.2, gravity: 0.05,
      });
    }
  }
}

/** Glints drifting over the lake (it is the light of the whole cavern). */
class Glints implements Prop {
  private t = 0;
  constructor(private game: Game) {}
  update(dt: number): void {
    const g = this.game;
    const p = g.player;
    if (Math.hypot(p.x - LAKE.x, p.z - LAKE.z) > 70) return;
    this.t += dt * 7;
    while (this.t >= 1) {
      this.t -= 1;
      const a = rng.next() * Math.PI * 2;
      const r = Math.sqrt(rng.next()) * 36;
      const x = LAKE.x + Math.sin(a) * r;
      const z = LAKE.z + Math.cos(a) * r;
      if (g.col.terrainAt(x, z) > WL - 0.3) continue;
      g.fx.emit(x, WL + 0.1 + rng.next() * 1.5, z, {
        count: 1, speed: 0.25, dir: [0, 1, 0], spread: 0.5, life: [2, 4], size: [0.08, 0.16], sizeEnd: 0.3, color: rng.chance(0.7) ? 0x8ff0e0 : 0xc0a0ff,
        bright: 2.2, drag: 0.4, gravity: -0.08,
      });
    }
  }
}

// --- the arrival ledge -----------------------------------------------------------------------------

function landing(b: Builder): void {
  const g = b.game;
  const { x, z, top } = LANDING;
  b.portal(x, z + 7, 0, 'sanctum', 'Climb back up to the Sanctum', 0xfff0c8);
  b.checkpoint('landing', x + 6, z - 1, Math.PI * 0.85);
  // Rubble that fell with Aster, and a Burrowfolk lamp someone left to guide whoever came down.
  for (let i = 0; i < 9; i++) b.decor.rock(x + jitter(i, 1) * 7, top, z + 3 + jitter(i, 2) * 4, 0.4 + Math.abs(jitter(i, 3)) * 0.8, ROCK.light);
  lanternPost(b, x - 4.5, z - 5, 0x8ff0e0, -Math.PI / 2);
  crystalCluster(b, x - 7, z + 2, 1.3, 0x8ff0e0);
  crystalCluster(b, x + 8.5, z + 5, 0.9, 0xc890ff);
  stalagmites(b, x - 6, z + 8, 3, 4, { max: 5, glow: 0x8ff0e0 });
  stalagmites(b, x + 7, z - 7, 2.5, 3, { max: 4 });
  b.gems(x, z - 4, 'blue', 5, 1.4);
  b.story('rootway', x - 3, z - 9, 4, () => g.hud.flick('The Rootway, down to the lake. Mind the thorns: those roots are the Hollow King\'s.', 6));
}

/**
 * Glide rings down the Rootway: off the landing with a jump and a flap, then
 * a long glide down the winding ravine and out over the lake. Heights follow
 * a glider's fall, so a clean line makes every ring.
 */
function rootwayRings(b: Builder): void {
  const g = b.game;
  const total = routeLength(ROOTWAY);
  const pts: [number, number, number, number][] = [];
  const glide = 11.5;
  const sink = 2.1;
  const start = LANDING.top + 3.4;
  for (const d of [6, 15.5, 25, 34.5, 43]) {
    const p = routeAt(ROOTWAY, d / total);
    pts.push([p.x, start - ((d + 3) / glide) * sink, p.z, p.yaw]);
  }
  const end = routeAt(ROOTWAY, 1);
  pts.push([end.x + Math.sin(end.yaw) * 9, start - ((total + 12) / glide) * sink, end.z + Math.cos(end.yaw) * 9, end.yaw]);
  b.glideRings('rootway', pts, 9, 45);
  b.story('rings', LANDING.x, LANDING.z - 5, 3, () => g.hud.flick('Rings, all the way down the Rootway! Jump off the edge, flap, and glide through every one.', 7));
}

// --- the lake ---------------------------------------------------------------------------------------

function lake(b: Builder): void {
  const g = b.game;
  // The Heartstone on its islet, the Hollow King's roots coiled round it.
  const ty = b.y(ISLET.x, ISLET.z);
  crystalCluster(b, ISLET.x, ISLET.z, 3.6, 0x8ff0e0);
  crystalCluster(b, ISLET.x + 3, ISLET.z + 1.5, 1.1, 0xc890ff);
  crystalCluster(b, ISLET.x - 2.6, ISLET.z - 2.4, 0.9, 0x8ff0e0);
  for (const [a0, a1, r0] of [[0.4, 2.8, 1.1], [2.6, 5.2, 0.9], [4.4, 1.2, 0.8]] as [number, number, number][]) {
    const pts: [number, number, number][] = [];
    for (let k = 0; k <= 5; k++) {
      const t = k / 5;
      const a = a0 + (a1 - a0 + (a1 < a0 ? Math.PI * 2 : 0)) * t;
      const rr = 9 - t * 6.5;
      pts.push([ISLET.x + Math.sin(a) * rr, -7 + t * 14, ISLET.z + Math.cos(a) * rr]);
    }
    hollowRoot(b, pts, r0);
  }
  b.gems(ISLET.x, ISLET.z, 'blue', 8, 4, ty);
  b.story('heartstone', ISLET.x, ISLET.z, 6, () => g.hud.flick('It\'s humming, Aster. Those roots are wrapped round it like they\'re drinking the light out.', 7));
  // Lily pads of light, and glowing weed on the lake bed so the deep reads from above.
  const pad = mat(0x2a8a78, { rough: 0.7, emissive: 0x1a6a5a, emissiveIntensity: 0.6, side: THREE.DoubleSide });
  const bloom = glowShared(0xc8fff0);
  for (let i = 0; i < 70; i++) {
    const a = jitter(i, 7) * Math.PI;
    const r = 24 + Math.abs(jitter(i, 8)) * 16;
    const px = LAKE.x + Math.sin(a) * r;
    const pz = LAKE.z + Math.cos(a) * r;
    if (b.col.terrainAt(px, pz) > WL - 0.5) continue;
    const s = 0.5 + Math.abs(jitter(i, 9)) * 0.7;
    b.decor.add(GEO.disc(), pad, px, WL + 0.03, pz, s, 1, s, 0, i, 0, false);
    if (i % 4 === 0) b.decor.add(GEO.blobLow(), bloom, px + 0.2, WL + 0.12, pz, 0.12, 0.08, 0.12, 0, 0, 0, false);
  }
  const weed = glowShared(0x3ad8b8);
  const weed2 = glowShared(0x7a5aff);
  for (let i = 0; i < 160; i++) {
    const a = rng.next() * Math.PI * 2;
    const r = Math.sqrt(rng.next()) * 38;
    const px = LAKE.x + Math.sin(a) * r;
    const pz = LAKE.z + Math.cos(a) * r;
    const fy = b.col.terrainAt(px, pz);
    if (fy > -1.2 || fy < -1e3) continue;
    const h = 0.6 + rng.next() * 1.6;
    b.decor.add(GEO.blade(), i % 5 === 0 ? weed2 : weed, px, fy - 0.1, pz, 6, h, 6, rng.signed() * 0.3, rng.next() * 6, rng.signed() * 0.3, false);
  }
  for (const [px, pz, sc, c] of [[-14, 10, 1.2, 0x8ff0e0], [12, 14, 0.9, 0xc890ff], [-18, -16, 1.4, 0x8ff0e0], [6, -24, 1.0, 0x8ff0e0], [24, 2, 1.1, 0xc890ff], [-8, -28, 0.8, 0xc890ff]] as [number, number, number, number][]) {
    crystalCluster(b, px, pz, sc, c);
  }

  // The sunken shrine on the lake bed east of the islet: dive for its relic.
  const hall = ruinHall(b, SHRINE.x, SHRINE.z, 8, 8, { top: b.y(SHRINE.x, SHRINE.z) + 0.4, wallH: 3.2, broken: 0.35, doors: ['w'], pillars: 1, color: 0x5a7288 });
  const [ax, az] = hall.at(0, 1.5);
  b.box(ax, hall.top, az, 1.8, 0.8, 1.2, 0x4a6274, { trim: 0x7aa0b0 });
  b.collectible('relic1', 'relic', ax, az, hall.top + 0.8, 'hollow1');
  for (const [u, v] of [[-2.6, 2.6], [2.6, 2.6], [2.6, -2.4]] as [number, number][]) {
    const [px, pz] = hall.at(u, v);
    b.breakable(px, pz, 'urn', { y: hall.top });
  }
  crystalCluster(b, SHRINE.x - 6, SHRINE.z + 3, 0.9, 0x8ff0e0);
  crystalCluster(b, SHRINE.x + 5.5, SHRINE.z - 5, 0.8, 0x8ff0e0);
  // A trail of gems down to it from the islet (they settle on the lake bed).
  b.gemLine([[ISLET.x + 6, ISLET.z - 2], [SHRINE.x - 5, SHRINE.z + 0.5]], 'blue', 1.8);
  b.story('shrine', SHRINE.x - 7, SHRINE.z, 8, () => g.hud.flick('There\'s a shrine down on the lake bed! Hold Shift to dive, and tilt the view to steer down.', 7));
}

/** The hidden grotto: swim along the inlet, dive under the cliff, and surface in a pool inside the rock. */
function grotto(b: Builder): void {
  const g = b.game;
  // Roof the channel where it runs under the cliff (the terrain alone would leave a slot open to the sky).
  const [sx, sz] = [-43.5, -42];
  const [mx, mz] = [-48.5, -45.2];
  const [ex, ez] = [-53.8, -48.6];
  const yaw1 = Math.atan2(mx - sx, mz - sz);
  const yaw2 = Math.atan2(ex - mx, ez - mz);
  rockSlab(b, (sx + mx) / 2, (sz + mz) / 2, 8, Math.hypot(mx - sx, mz - sz) + 1, -2.3, 16, yaw1);
  rockSlab(b, (mx + ex) / 2, (mz + ez) / 2, 8, Math.hypot(ex - mx, ez - mz) + 1, -2.3, 40, yaw2);
  // A lid over the pool, so it is a grotto and not a chimney.
  rockSlab(b, GROTTO.x, GROTTO.z, 18, 18, 11, 50, 0.3);
  // A shelf of rock at the back of the pool, low enough to climb onto from the water.
  const lx = GROTTO.x - 3.4;
  const lz = GROTTO.z - 3.4;
  b.box(lx, -6.6, lz, 4.6, 7.6, 4.6, ROCK.mid, { yaw: 0.7, trim: ROCK.moss });
  for (let i = 0; i < 6; i++) b.decor.rock(lx + Math.sin(i * 1.3 + 0.7) * 2.6, -1.2 - (i % 3) * 1.5, lz + Math.cos(i * 1.3 + 0.7) * 2.6, 0.9 + (i % 2) * 0.5, ROCK.mid);
  crystalCluster(b, lx - 1.2, lz - 0.8, 1.2, 0x8ff0e0, 1.0);
  crystalCluster(b, GROTTO.x + 4, GROTTO.z - 2, 0.8, 0xc890ff, b.col.terrainAt(GROTTO.x + 4, GROTTO.z - 2));
  crystalCluster(b, GROTTO.x + 1, GROTTO.z + 4.6, 0.9, 0x8ff0e0, b.col.terrainAt(GROTTO.x + 1, GROTTO.z + 4.6));
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    b.decor.add(GEO.blobLow(), glowShared(0x8ff0e0), GROTTO.x + Math.sin(a) * 6.8, 10.4 - Math.abs(jitter(i, 4)) * 1.5, GROTTO.z + Math.cos(a) * 6.8, 0.12, 0.12, 0.12, 0, 0, 0, false);
  }
  b.egg('grotto', lx + 0.4, lz + 0.4, 1.0);
  b.gemLine([[INLET[0]![0] - 2, INLET[0]![1] - 2], [sx + 1, sz + 1]], 'blue', 2.2);
  b.story('inlet', sx + 3, sz + 2.5, 4, () => g.hud.flick('The water runs under the rock here. Take a breath, hold Shift to dive, and swim through!', 7));
  b.story('grotto', GROTTO.x, GROTTO.z, 5, () => g.hud.flick('A secret pool! Pip wasn\'t making it up. There\'s the egg!', 6));
}

/** The drowned canal out to the Drowned City's gate, and a chest lost in it. */
function canal(b: Builder): void {
  const g = b.game;
  b.chest('sunken', 43.5, -43.8, -0.95, { blue: 34, red: 2, green: 1 });
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const x = CANAL[0]![0] + (CANAL[2]![0] - CANAL[0]![0]) * t;
    const z = CANAL[0]![1] + (CANAL[2]![1] - CANAL[0]![1]) * t;
    for (const s of [-1, 1]) {
      const px = x + 5.2 * s * 0.8;
      const pz = z - 5.2 * s * 0.6;
      if (b.col.terrainAt(px, pz) > WL + 0.2) b.decor.pillar(px, b.y(px, pz), pz, 0.55, 2 + (i % 3) * 1.3, 0x5a7288, i % 2 === 0);
    }
  }
  b.story('canal', 30, -32, 6, () => g.hud.flick('A whole gate, standing in the water! That must be the way to the Drowned City.', 6));
}

// --- Lanternhollow, the Burrowfolk's camp ------------------------------------------------------------

interface FolkLook {
  fur: number;
  belly: number;
  cloth: number;
  lamp: number;
  scale: number;
  /** An elder's white whiskers and a stoop. */
  old?: boolean;
}

/**
 * One of the Burrowfolk: small, round and soft-furred, big-eared and
 * short-sighted, never without a lamp on a staff. Turns to watch the
 * dragon, bobs while talking, and has a Talker for conversations.
 */
class Burrowfolk implements Prop {
  private root = new THREE.Group();
  private head = new THREE.Group();
  private lamp = new THREE.Group();
  private yaw: number;
  private t = rng.next() * 10;
  /** Height of the face above the feet: where the talk camera looks (see Dialogue's speakerPos). */
  readonly talkY: number;

  constructor(private game: Game, readonly id: string, readonly x: number, readonly y: number, readonly z: number, yaw: number, look: FolkLook) {
    this.yaw = yaw;
    this.talkY = 1.1 * look.scale;
    const fur = mat(look.fur, { rough: 1 });
    const belly = mat(look.belly, { rough: 1 });
    const cloth = mat(look.cloth, { rough: 0.9 });
    const dark = mat(0x140e12, { rough: 0.3 });
    const pink = mat(0xe89aa0, { rough: 0.6 });
    const body = ellipsoid(0.42, 0.5, 0.38, fur, 14);
    body.position.y = 0.55;
    const tummy = ellipsoid(0.3, 0.36, 0.2, belly, 12);
    tummy.position.set(0, 0.5, 0.2);
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 6, 14), cloth);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 0.92;
    this.root.add(body, tummy, scarf);
    for (const s of [-1, 1]) {
      const foot = ellipsoid(0.13, 0.07, 0.18, belly, 8);
      foot.position.set(s * 0.18, 0.06, 0.1);
      this.root.add(foot);
      const arm = limb(new THREE.Vector3(s * 0.34, 0.75, 0.05), new THREE.Vector3(s * 0.46, 0.5, 0.22), 0.08, 0.06, fur, 6);
      this.root.add(arm);
    }
    // The head: round, with a long snout, a pink nose, button eyes and big soft ears.
    this.head.position.y = 1.08;
    const skull = ellipsoid(0.3, 0.27, 0.3, fur, 14);
    const snout = ellipsoid(0.12, 0.1, 0.2, belly, 10);
    snout.position.set(0, -0.06, 0.26);
    const nose = ellipsoid(0.06, 0.05, 0.05, pink, 8);
    nose.position.set(0, -0.03, 0.45);
    this.head.add(skull, snout, nose);
    for (const s of [-1, 1]) {
      const eye = ellipsoid(0.045, 0.05, 0.03, dark, 8);
      eye.position.set(s * 0.12, 0.05, 0.25);
      const hl = ellipsoid(0.014, 0.014, 0.01, glowShared(0xffffff), 5);
      hl.position.set(s * 0.12 + 0.012, 0.07, 0.28);
      const ear = ellipsoid(0.17, 0.2, 0.05, fur, 10);
      ear.position.set(s * 0.26, 0.2, -0.04);
      ear.rotation.set(0.2, s * 0.5, s * -0.5);
      const inner = ellipsoid(0.11, 0.13, 0.03, pink, 8);
      inner.position.set(s * 0.26, 0.2, -0.01);
      inner.rotation.copy(ear.rotation);
      this.head.add(eye, hl, ear, inner);
      if (look.old) {
        for (let k = 0; k < 3; k++) {
          const w = limb(new THREE.Vector3(s * 0.08, -0.05 - k * 0.03, 0.4), new THREE.Vector3(s * 0.34, -0.1 - k * 0.07, 0.38), 0.008, 0.004, mat(0xf4f0e8), 3);
          this.head.add(w);
        }
      }
    }
    if (look.old) {
      const hood = ellipsoid(0.33, 0.2, 0.33, cloth, 12);
      hood.position.set(0, 0.14, -0.04);
      this.head.add(hood);
    }
    this.root.add(this.head);
    // The staff and its lamp, held in the right paw.
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.9, 5), mat(0x5a4030, { rough: 0.9 }));
    staff.position.set(-0.5, 0.95, 0.26);
    this.root.add(staff);
    this.lamp.position.set(-0.5, 1.9, 0.26);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 4, 10, Math.PI), mat(0x3a2e24));
    hook.position.y = -0.02;
    const glass = ellipsoid(0.1, 0.13, 0.1, glowShared(look.lamp), 10);
    glass.position.y = -0.2;
    const capTop = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.08, 6), mat(0x3a2e24));
    capTop.position.y = -0.05;
    this.lamp.add(hook, glass, capTop);
    this.root.add(this.lamp);
    this.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    mergeStatic(this.root);
    this.root.scale.setScalar(look.scale);
    this.root.position.set(x, y, z);
    this.root.rotation.y = yaw;
    game.level!.root.add(this.root);
  }

  update(dt: number): void {
    this.t += dt;
    const g = this.game;
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
    const k = talking ? 9 : 2.2;
    this.root.position.y = this.y + Math.abs(Math.sin(this.t * k)) * (talking ? 0.05 : 0.015);
    this.head.rotation.x = Math.sin(this.t * (talking ? 7 : 0.8)) * (talking ? 0.12 : 0.05) - (d < 6 ? 0.18 : 0);
    this.head.rotation.z = Math.sin(this.t * 0.6) * 0.06;
    this.lamp.rotation.z = Math.sin(this.t * 1.7) * 0.12;
  }
}

/** A Burrowfolk to talk to at (x, z); `talk` runs the conversation. */
function folk(b: Builder, id: string, x: number, z: number, yaw: number, look: FolkLook, label: string, talk: () => void, y?: number): void {
  const g = b.game;
  const gy = y ?? b.y(x, z);
  const f = new Burrowfolk(g, id, x, gy, z, yaw, look);
  b.level.props.push(f);
  b.col.add(makeCyl(x, z, 0.5 * look.scale, gy, gy + 1.3 * look.scale));
  const t = new Talker(g, x, gy, z, label, () => {
    // Face them, so the conversation's framing (it looks ahead of Aster) finds them.
    g.player.yaw = Math.atan2(x - g.player.x, z - g.player.z);
    talk();
  });
  b.level.interactables.push(t);
}

/** A round earthen hut with a lit doorway, facing `yaw`. */
function hut(b: Builder, x: number, z: number, r: number, yaw: number, color: number): void {
  const y = b.y(x, z);
  const earth = mat(color, { rough: 1, flat: true });
  const trim = mat(mix(color, 0x000000, 0.35), { rough: 1, flat: true });
  b.decor.add(GEO.cap(), earth, x, y - 0.2, z, r, r * 0.95, r);
  b.decor.add(GEO.cyl(), trim, x, y - 0.25, z, r * 1.04, 0.45, r * 1.04);
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  b.decor.add(GEO.cap(), mat(0x1a1014, { rough: 1 }), x + fx * (r - 0.05), y - 0.1, z + fz * (r - 0.05), 0.6, 1.3, 0.25, 0, yaw, 0, false);
  b.decor.add(GEO.cap(), glowShared(0xffc070), x + fx * (r - 0.02), y - 0.1, z + fz * (r - 0.02), 0.42, 1.0, 0.18, 0, yaw, 0, false);
  // A moss cap and a little lamp on a hook by the door.
  b.decor.add(GEO.cap(), mat(ROCK.moss, { rough: 1, flat: true }), x, y + r * 0.62, z, r * 0.6, r * 0.34, r * 0.6);
  lanternPost(b, x + fx * (r + 0.5) + fz * 1.1, z + fz * (r + 0.5) - fx * 1.1, 0xffd070, yaw + Math.PI / 2);
  b.col.add(makeCyl(x, z, r * 0.92, y - 1, y + r * 0.9));
}

const MOSSA: FolkLook = { fur: 0x8a7a6a, belly: 0xd8c8b0, cloth: 0x6a3a5a, lamp: 0xffd070, scale: 1.1, old: true };
const TALLOW: FolkLook = { fur: 0xa8784a, belly: 0xf0d8b0, cloth: 0xc8702a, lamp: 0xfff0a0, scale: 1 };
const PIP: FolkLook = { fur: 0x6a6a7a, belly: 0xc8c8d0, cloth: 0x2a8a8a, lamp: 0x8ff0e0, scale: 0.85 };

function camp(b: Builder): void {
  const g = b.game;
  const { x, z } = CAMP;
  // The fire, and the huts in a ring round it.
  const fy = b.y(x, z + 2);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    b.decor.rock(x + Math.sin(a) * 1.3, fy - 0.1, z + 2 + Math.cos(a) * 1.3, 0.35, 0x5a5460);
  }
  b.torch(x, z + 2, 'campfire', true, 0, fy);
  const huts: [number, number, number, number][] = [[-9, 3, 2.6, 0x6a5a4a], [-10, -6, 2.3, 0x5a4a44], [-2, -11, 2.8, 0x6a5040], [8, -8, 2.2, 0x5a4a44], [10.5, 2.5, 2.4, 0x6a5a4a]];
  for (const [dx, dz, r, c] of huts) hut(b, x + dx, z + dz, r, Math.atan2(-dx, 2 - dz), c);
  // Tallow's lamp stall.
  const sx = x + 6.5;
  const sz = z + 7;
  const sy = b.y(sx, sz);
  b.box(sx, sy, sz, 2.6, 0.9, 1.0, 0x6a4a30, { surface: 'wood' });
  b.decor.add(GEO.box(), mat(0xc8702a, { rough: 0.9 }), sx, sy + 2.3, sz - 0.3, 3, 0.08, 1.6, 0.3, 0, 0);
  for (const s of [-1, 1]) b.decor.add(GEO.cyl6(), mat(0x4a3424, { rough: 0.9 }), sx + s * 1.35, sy, sz - 0.9, 0.05, 2.4, 0.05);
  for (let i = 0; i < 5; i++) {
    b.decor.add(GEO.blobLow(), glowShared([0xffd070, 0x8ff0e0, 0xfff0a0, 0xc890ff, 0xffd070][i]!), sx - 1 + i * 0.5, sy + 1.05, sz + jitter(i, 5) * 0.2, 0.1, 0.13, 0.1, 0, 0, 0, false);
  }
  b.letter('lamps', sx + 0.8, sz + 0.1, sy);
  // Stores, fishing gear and clutter.
  b.pile(x - 13, z + 7, 1.6, 5, ['crate', 'basket', 'crate', 'barrel', 'urn']);
  b.breakables('basket', [[x + 13, z - 3], [x + 13.8, z - 1.8]]);
  b.breakables('urn', [[x - 5, z - 12.5], [x + 3.5, z - 13]]);
  b.breakable(x + 12, z + 8, 'barrel');
  b.breakable(x + 12, z + 8, 'crate');
  b.chest('camp', x - 12.5, z - 10.5, Math.PI * 0.2, { blue: 26, red: 2, green: 2 });
  b.checkpoint('camp', x - 9, z + 11, Math.PI * 0.1);
  for (const [dx, dz] of [[-4, 9], [4, 9], [-14, -1], [14, -6]] as [number, number][]) lanternPost(b, x + dx, z + dz, 0xffd070, Math.atan2(-dx, -dz) - Math.PI / 2);
  // The dock, out into the lake.
  dock(b, x + 3, z + 8.5, 0, 11, 2.6, WL + 0.7);
  b.gemLine([[x + 3, z + 10], [x + 3, z + 18.5]], 'blue', 1.6);
  b.decor.add(GEO.cyl6(), mat(0x6a5040, { rough: 0.9 }), x + 4.1, WL + 0.6, z + 17, 0.03, 2.4, 0.03, -0.7, 0, 0.2);

  folk(b, 'mossa', x - 3.2, z - 1, Math.PI * 0.15, MOSSA, 'Talk to Elder Mossa', () => talkMossa(g));
  folk(b, 'tallow', sx - 0.3, sz - 1.5, 0, TALLOW, 'Talk to Tallow', () => talkTallow(g));
  folk(b, 'pip', x + 3.6, z + 16.8, Math.PI, PIP, 'Talk to Pip', () => talkPip(g), WL + 0.7);
  b.story('camp', x, z + 12, 7, () => g.hud.flick('Look, a whole village! Tiny, fuzzy and holding lamps. I like them already.', 6));
}

// --- the Old Aerie ----------------------------------------------------------------------------------

function aerie(b: Builder): void {
  const g = b.game;
  const route = layoutRealm(b, AERIE);
  const arena = route.arenas[0];
  if (arena) {
    arena.onStart = () => {
      if (g.save.found['story:hollow:aerie-fight']) return;
      g.save.found['story:hollow:aerie-fight'] = true;
      g.hud.flick('Gloom, down here too! They\'re guarding the ruins!', 5);
    };
    arena.onClear = () => g.hud.flick('That\'s the last of them. The old hall to the north looks like it\'s hiding something.', 6);
  }
  b.story('aerie', -46, 9, 6, () => g.hud.flick('Dragon ruins! Dragons lived down here before there was a Sanctum. Look at the size of those arches!', 7));
  // The Aerie-Keeper's statue, where the avenue opens onto the plaza.
  dragonStatue(b, -61, 20.5, Math.PI * 0.8, { hornStyle: 'curled', tailStyle: 'club', slender: 0.3, beard: true }, { scale: 1.7, roar: true, eyes: 0xffc070 });

  // The great hall: four braziers to light, and the Keeper's vault at the back.
  const hall = ruinHall(b, HALL.x, HALL.z, 16, 12, { doors: ['s'], broken: 0.55, pillars: 3, wallH: 5.5 });
  const top = hall.top;
  const [vx, vz] = hall.at(0, 3.2);
  const V = 0x6e6878;
  b.box(vx - 2.6, top, vz, 0.8, 3.6, 4.2, V);
  b.box(vx + 2.6, top, vz, 0.8, 3.6, 4.2, V);
  b.box(vx, top, vz + 1.7, 4.4, 3.6, 0.8, V);
  b.box(vx, top + 3.6, vz, 6.2, 0.6, 5, V, { trim: 0x8a8298 });
  b.gate(vx, vz - 2.1, 4.4, 3.6, 0, 'stone', 'aerie-vault', top);
  b.letter('aerie', vx - 0.8, vz + 0.4, top);
  b.crystal(vx + 1, vz + 0.4, 'mixed', 40, true, top);
  // Braziers in a square before the vault, clear of the pillars.
  for (const [u, v] of [[-3.8, -3.6], [3.8, -3.6], [-3.9, 0.1], [3.9, 0.1]] as [number, number][]) {
    const [tx, tz] = hall.at(u, v);
    b.torch(tx, tz, 'aerie', false, 0, top);
  }
  b.torchGroup('aerie', 'aerie-vault');
  b.level.on('aerie-vault', () => g.hud.flick('All four lit! The vault\'s open. The old dragons sealed it with fire, just like the Wardens do.', 6));
  const [hx, hz] = hall.at(0, -4);
  b.puzzleHint(hx, hz, 7, [
    'Four old braziers round a sealed door. Light them with fire!',
    'Hold Right Mouse to breathe fire on each of the four braziers. All of them at once opens the vault.',
  ], 'aerie-vault', 25, 30);

  // The vine-grown tower: an egg on its roof.
  const tx = -95;
  const tz = 27;
  const ty = b.y(tx, tz);
  const ttop = ty + 11;
  b.box(tx, ty - 0.5, tz, 4.6, ttop - ty + 0.5, 4.6, 0x7a7488, { trim: 0x5a5468 });
  b.box(tx, ttop, tz, 5.2, 0.5, 5.2, 0x8a8298);
  merged(b, () => b.climbWall(tx + 2.3, tz, Math.PI / 2, 3, ty, ttop, false));
  b.egg('tower', tx - 0.6, tz + 0.5, ttop + 0.5);
  b.gems(tx + 0.8, tz - 1, 'blue', 3, 0.7, ttop + 0.5);
  b.story('tower', tx + 6, tz, 3, () => g.hud.flick('Vines up the old tower, and something glowing on top. Climb!', 5));

  // Speed runes down the middle of the avenue, and an iron-bound chest on a dais at the end of the run.
  const r0 = routeAt(AERIE, 0.11);
  const r1 = routeAt(AERIE, 0.28);
  b.speedRunes(r0.x, r0.z, r1.x, r1.z, 6);
  const ch = routeAt(AERIE, 0.45);
  b.box(ch.x, b.y(ch.x, ch.z) - 0.25, ch.z, 3, 0.6, 3, 0x6e6878, { trim: 0x8a8298, yaw: ch.yaw });
  b.ironChest('aerie', ch.x, ch.z, ch.yaw + Math.PI, { blue: 40, red: 3, purple: 1 }, b.y(ch.x, ch.z));
  b.story('runes', r0.x, r0.z, 3.5, () => g.hud.flick('Speed runes! Charge along them (Hold Shift) and keep going: that iron chest won\'t stand a chance.', 6));
  // Urns and rubble round the plaza.
  b.breakables('urn', [[-58, 20], [-59.2, 21.5], [-85, 6], [-86, 7.5], [-101, 18], [-73, 25]]);
  // Amber crystals the old dragons grew for light, still glowing in the ruins.
  for (const [x, z, sc] of [[-88, 22, 1.0], [-66, 26, 0.8], [-70, 3, 0.9], [-90, 5, 1.1], [-58, 16, 0.7], [-84, 40, 0.9], [-72, 38, 0.8], [-100, 22, 1.0]] as [number, number, number][]) {
    crystalCluster(b, x, z, sc, 0xffb860);
  }
  for (const [x, z] of [[-83.5, 24.5], [-74.5, 24.5]] as [number, number][]) lanternPost(b, x, z, 0xffc070, Math.PI / 2);
  pairsDoor(b);
}

/**
 * The Pair's Door: the old dragons nested two by two, and sealed their small
 * treasures behind doors only a pair could open. Two plates, one for Aster and
 * one for Nyxa (Hold the partner key to ask her to stay on one).
 */
function pairsDoor(b: Builder): void {
  const g = b.game;
  const vx = -67;
  const vz = 3.6;
  const top = b.y(vx, vz);
  const V = 0x6e6878;
  b.box(vx - 2.4, top, vz, 0.8, 3.2, 3.8, V, { trim: 0x8a8298 });
  b.box(vx + 2.4, top, vz, 0.8, 3.2, 3.8, V, { trim: 0x8a8298 });
  b.box(vx, top, vz - 1.6, 4, 3.2, 0.8, V);
  b.box(vx, top + 3.2, vz, 5.6, 0.5, 4.6, V, { trim: 0x8a8298 });
  // Two dragons carved over the lintel, nose to nose.
  for (const s of [-1, 1]) b.decor.add(GEO.cone(), mat(0x8a8298, { rough: 0.8, flat: true }), vx + s * 0.9, top + 3.9, vz + 1.9, 0.35, 0.9, 0.35, 0, 0, s * 1.2);
  b.gate(vx, vz + 1.9, 4, 3.2, 0, 'stone', 'pairs-door', top);
  b.collectible('heart1', 'heart', vx, vz - 0.2, top);
  b.gems(vx, vz - 0.2, 'blue', 6, 1.1, top);
  twinPlates(b, [vx - 3.2, vz + 5.2], [vx + 3.2, vz + 5.2], 'pairs-door');
  b.story('pairs', vx, vz + 7, 4, () => g.hud.flick('Two plates, one door. Two dragons, Aster! Stand on one and Hold G so Nyxa stays on the other.', 7));
  b.level.on('pairs-door', () => g.partner.say('A door for two. They built this place for pairs, you know. I think I would have liked them.', 5.5, true));
}

/** Runs `make`, then merges the meshes of any groups it added to the level (a vine wall is a mesh per leaf). */
function merged<T>(b: Builder, make: () => T): T {
  const before = new Set(b.level.root.children);
  const out = make();
  for (const c of b.level.root.children) if (!before.has(c) && !(c as THREE.Mesh).isMesh) mergeStatic(c);
  return out;
}

// --- the Glowcap Wood -------------------------------------------------------------------------------

function glowcap(b: Builder): void {
  const g = b.game;
  layoutRealm(b, GLOWCAP);
  b.story('glowcap', 44, 22, 6, () => g.hud.flick('The Glowcap Wood! Those big caps look sturdy enough to stand on. Bounce off the little pink ones!', 7));
  // The giant caps: bounce up from one to the next; an egg waits on the tallest.
  const caps = fungalGrove(b, GROVE.x, GROVE.z, 12, { giants: [[-7, -6, 0.75], [-1, 0, 1.05], [6, 2, 1.55], [-6, 6, 0.9]], small: 22 });
  const [c0, c1, c2] = caps;
  if (c0 && c1 && c2) {
    b.shroom(c0.x - 3.2, c0.z - 2.2, 20, 0xff5a9a);
    b.shroom(c1.x + 0.6, c1.z - 0.4, 20, 0xff5a9a, c1.top);
    b.egg('cap', c2.x, c2.z, c2.top);
    b.gems(c0.x, c0.z, 'blue', 3, 1, c0.top);
    b.gems(c1.x - 0.6, c1.z + 0.8, 'blue', 2, 0.8, c1.top);
  }
  fungalGrove(b, 58, 4, 8, { count: 2, small: 10 });
  fungalGrove(b, 92, 28, 9, { count: 3, small: 12 });
  fungalGrove(b, 88, -6, 8, { count: 2, small: 10 });

  // The Gloom camp in the south of the wood: pods, kegs, a lookout's banner and Grubb's orders.
  const gx = 80;
  const gz = -2;
  lazyEnemies(b, gx, gz, 26, [['grunt', gx - 3, gz + 2, 0], ['grunt', gx + 3, gz - 2, Math.PI], ['sapper', gx, gz - 6, 0], ['slinger', gx + 7, gz + 3, -Math.PI / 2]]);
  for (const [px, pz] of [[gx - 6, gz - 3], [gx + 6, gz + 6], [gx - 2, gz + 7], [gx + 8, gz - 5], [gx - 7, gz + 4]] as [number, number][]) b.breakable(px, pz, 'pod');
  b.breakables('keg', [[gx + 1.5, gz - 8], [gx + 2.6, gz - 8.6]]);
  b.pile(gx - 4, gz - 7, 1.2, 3, ['crate', 'barrel', 'crate']);
  const by = b.y(gx + 4, gz + 1);
  b.decor.add(GEO.cyl6(), mat(0x2a2030, { rough: 0.9 }), gx + 4, by, gz + 1, 0.08, 4, 0.08);
  b.decor.add(GEO.box(), mat(0x6a2a8a, { rough: 0.9 }), gx + 4.6, by + 3.1, gz + 1, 1.1, 1.4, 0.05);
  b.letter('gloom', gx - 1.5, gz + 0.5);
  b.story('gloomcamp', gx - 12, gz + 4, 6, () => g.hud.flick('A Gloom camp. So THAT\'s why Tallow can\'t get her mushroom oil.', 5));
}

/** Foes that only turn up once Aster comes within `r` of (x, z). */
function lazyEnemies(b: Builder, x: number, z: number, r: number, list: [string, number, number, number][]): void {
  const g = b.game;
  b.trigger(x, z, r, () => {
    for (const [type, ex, ez, yaw] of list) g.pendingSpawns.push({ type, x: ex, y: g.col.groundAt(ex, ez, 1e4, 0.3).y + 0.05, z: ez, yaw });
  });
}

// --- the sealed gates -------------------------------------------------------------------------------

function gates(b: Builder): void {
  // The Mycelium gate remembers eggs: once Mossa has told Aster the rite, twelve returned eggs open it (Act II's main thread).
  sealedGate(b, 'mycelium', 107.5, 16, -Math.PI / 2, 'The Mycelium Deep', 'The Mycelium Deep... sealed tight by the roots. Not yet, Aster.', {
    color: 0xc890ff, stone: 0x7a6a98,
    opens: {
      target: 'mycelium', eggs: MYCELIUM_EGGS, flag: 'story:hollow:mossa',
      hint: (missing) => `The roots won't budge yet. Mossa said the old gates remember eggs: ${missing} and they'll wither.`,
      opened: 'Whoa! The roots are shrivelling! The gate remembers the eggs, Aster, just like Mossa said!',
    },
  });
  // The other three open in later rounds: each only waits for its flag to be set.
  sealedGate(b, 'drowned', 50.5, -49.5, Math.atan2(-10, 7), 'The Drowned City', 'The Drowned City. The roots are holding the door shut, right under the water. Not yet.', {
    color: 0x6ae0ff, stone: 0x5a88a0, opens: { target: 'drowned', flag: 'story:hollow:gate-drowned-ready' },
  });
  sealedGate(b, 'mine', -107.5, 12, Math.PI / 2, 'The Crystal Mine', 'The Crystal Mine. I can hear crystals singing on the other side... but the roots won\'t budge. Not yet.', {
    color: 0xa8f0ff, stone: 0x8a8aa4, opens: { target: 'mine', flag: 'story:hollow:gate-mine-ready' },
  });
  sealedGate(b, 'hatchery', -46.5, -71.5, Math.atan2(1, 0.3), 'The First Hatchery', 'The First Hatchery, where the old dragons kept their eggs. Sealed by the roots... not yet.', {
    color: 0xffd08a, stone: 0x9a8878, opens: { target: 'hatchery', flag: 'story:hollow:gate-hatchery-ready' },
  });
  // Rock heaped either side, so each gate sits in the wall rather than in front of it, and a glow of crystal at its feet.
  for (const [x, z, yaw, c] of [[107.5, 16, -Math.PI / 2, 0xc890ff], [-107.5, 12, Math.PI / 2, 0xa8f0ff], [-46.5, -71.5, Math.atan2(1, 0.3), 0xffd08a],
    [50.5, -49.5, Math.atan2(-10, 7), 0x6ae0ff]] as [number, number, number, number][]) {
    const rx = Math.cos(yaw);
    const rz = -Math.sin(yaw);
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    for (const s of [-1, 1]) {
      if (c !== 0x6ae0ff) cavernWall(b, [[x + rx * s * 6.5 - fx * 1, z + rz * s * 6.5 - fz * 1], [x + rx * s * 10 - fx * 3, z + rz * s * 10 - fz * 3]], 10, { thick: 3.2 });
      crystalCluster(b, x + rx * s * 5.8 + fx * 2.2, z + rz * s * 5.8 + fz * 2.2, 1.1, c);
    }
  }
}

// --- the Hollow King's roots ----------------------------------------------------------------------

/** Great roots rising out of the lake and the walls toward the crack above the landing. */
function greatRoots(b: Builder): void {
  hollowRoot(b, [[14, -8, 22], [12, 6, 36], [8, 20, 52], [5, 34, 70], [2, 48, 88], [1, 60, 95]], 2.4);
  hollowRoot(b, [[-16, -8, 16], [-18, 8, 34], [-14, 22, 56], [-8, 38, 78], [-3, 54, 92]], 1.9);
  hollowRoot(b, [[30, -2.4, -12], [36, 10, -2], [40, 24, 12], [46, 40, 20], [52, 58, 22]], 1.6);
  hollowRoot(b, [[-30, 1.2, 42], [-42, 12, 48], [-54, 28, 46], [-66, 48, 40]], 1.4);
  hollowRoot(b, [[22, -2.4, -34], [30, 8, -48], [34, 24, -58], [30, 46, -66]], 1.5);
  hollowRoot(b, [[-40, 1.2, -18], [-52, 14, -22], [-62, 30, -16], [-70, 50, -8]], 1.3);
}

/** Stalagmites round the rim, glowing mushrooms by the shore, rocks everywhere else. */
function dressFloor(b: Builder): void {
  const offRoutes = (x: number, z: number) => !nearRoute(ROOTWAY, x, z, 3) && !nearRoute(AERIE, x, z, 3) && !nearRoute(GLOWCAP, x, z, 3)
    && Math.hypot(x - CAMP.x, z - CAMP.z) > 18 && Math.hypot(x - HALL.x, z - HALL.z) > 13 && Math.hypot(x - GROVE.x, z - GROVE.z) > 14;
  b.scatter(34, 0, 0, 62, (x, z) => stalagmites(b, x, z, 3, 3, { max: 7, glow: rng.chance(0.3) ? 0x8ff0e0 : undefined }),
    (x, z) => Math.hypot(x, z) > 44 && offRoutes(x, z));
  b.scatter(60, LAKE.x, LAKE.z, 50, (x, z, y) => b.decor.mushroom(x, y, z, 0.4 + rng.next() * 0.7, [0x3ae0d0, 0x9a6aff, 0x6ab8ff][Math.floor(rng.next() * 3)]!, true),
    (x, z, y) => y < 2.4 && Math.hypot(x - LAKE.x, z - LAKE.z) > 38 && offRoutes(x, z));
  b.scatter(40, 0, 0, 60, (x, z, y) => b.decor.rock(x, y, z, 0.5 + rng.next() * 1.1, ROCK.light), (x, z) => offRoutes(x, z));
  b.scatter(24, 0, 0, 58, (x, z) => crystalCluster(b, x, z, 0.5 + rng.next() * 0.5, rng.chance(0.6) ? 0x8ff0e0 : 0xc890ff), (x, z) => offRoutes(x, z) && Math.hypot(x, z) > 40);
  // Crystal-studded buttresses where the walls meet the floor.
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + jitter(i, 11) * 0.1;
    const x = Math.sin(a) * 62;
    const z = Math.cos(a) * 62;
    if (!offRoutes(x, z) || Math.abs(x) > 90) continue;
    stalagmites(b, x, z, 4, 4, { max: 9, glow: 0x8ff0e0 });
  }
  // A few lone arches of the old dragons on the west shore, half sunk.
  archway(b, -38, -8, 0.5, 4, 4.5, 0x8a8298, b.y(-38, -8) - 0.8);
  archway(b, -33, 24, -0.4, 4, 3.8, 0x8a8298, b.y(-33, 24) - 1);
}

// --- story --------------------------------------------------------------------------------------------

function arrive(g: Game): void {
  const level = g.level;
  if (!level) return;
  const p = g.player;
  // The fissure's use prompt would otherwise hang on through the scene.
  g.hud.prompt(null);
  // Nyxa came down with them; she stands for the scene, then goes her own way.
  const nx = p.x + 2.4;
  const nz = p.z + 0.8;
  const ny = g.col.groundAt(nx, nz, 1e4, 0.3).y;
  const nyxa = new Npc(g, 'nyxa', NYXA_FREED, nx, ny, nz, Math.PI * 1.15);
  level.npcs.push(nyxa);
  const leave = () => {
    g.fx.shadowPoof(nx, ny + 1, nz, 1.6);
    g.fx.motes(nx, ny + 1.2, nz, 0x8ad8ff, 30);
    g.sfx('flap', nx, ny, nz, 0.8, 0.8);
    level.root.remove(nyxa.rig.root);
    const i = level.npcs.indexOf(nyxa);
    if (i >= 0) level.npcs.splice(i, 1);
  };
  const lines: Line[] = [
    { who: 'flick', text: 'Okay. Okay okay okay. So THIS is what\'s under the Sanctum.', shot: 'wide' },
    { who: 'nyxa', text: 'The Hollow Below. He used to talk about it, in the old voice. He never said it was beautiful.' },
    { who: 'aster', text: 'Those roots came straight up through the Sanctum floor. They\'re his, aren\'t they?' },
    { who: 'nyxa', text: 'His roots run under all of Veyra. Where they drink, the light goes quiet. And he listens.' },
    { who: 'flick', text: 'Lights! Down by the water, see? Little ones, bobbing about. Someone LIVES down here!' },
    { who: 'nyxa', text: 'Go and meet them. I\'ll look at the deep ways first. The dark is... easier for me than it is for you.' },
    { who: 'aster', text: 'Don\'t go far. We only just got you back.' },
    { who: 'nyxa', text: 'I won\'t. I\'ll find you, Aster. I always could.' },
  ];
  g.say(lines, () => {
    leave();
    // She scouts the deep ways, and catches up once Aster has met the Burrowfolk (or after a while).
    scouting(g, 150);
    g.saveNow();
    g.hud.flick('Follow the Rootway down to that glowing lake. And look at the water: I bet you can swim in it!', 7);
  });
}

/** Nyxa away scouting for up to `secs` of play in this realm; `nyxaReturns` ends it early. */
function scouting(g: Game, secs: number): void {
  const level = g.level;
  if (!level) return;
  g.sessionFlags.add('nyxa-away');
  let t = secs;
  level.props.push({
    update: (dt: number) => {
      if (!g.sessionFlags.has('nyxa-away')) return;
      if (g.state === 'play') t -= dt;
      if (t <= 0) nyxaReturns(g);
    },
    // Leaving the realm ends it: she is waiting wherever Aster goes next.
    dispose: () => g.sessionFlags.delete('nyxa-away'),
  });
}

function nyxaReturns(g: Game): void {
  if (!g.sessionFlags.delete('nyxa-away')) return;
  // She rejoins on the partner's next update; speak once she is standing there.
  let wait = 1.2;
  g.level?.props.push({
    update: (dt: number) => {
      if (wait < 0) return;
      wait -= dt;
      if (wait < 0) g.partner.say('Told you I\'d find you. The deep ways are full of his roots... and something under them, breathing. Later.', 6, true);
    },
  });
}

function talkMossa(g: Game): void {
  if (!g.save.found['story:hollow:mossa']) {
    g.save.found['story:hollow:mossa'] = true;
    g.say([
      { who: 'mossa', text: 'A dragon! A real one, with the wings and everything! Sit, sit. Mind the lamps.' },
      { who: 'aster', text: 'I\'m Aster. We came down through a crack in the Sanctum. Who are you?' },
      { who: 'mossa', text: 'Burrowfolk, dear. Lanternhollow is ours, and has been since your kind went up to live on the clouds. We keep the lamps lit. Somebody must.' },
      { who: 'mossa', text: 'Three nights ago the roots came. Black ones, thorned, humming. They grew over the four old gates, and the Hollow went dim.' },
      { who: 'flick', text: 'Four gates? Where do they go?' },
      { who: 'mossa', text: 'The Mycelium Deep. The Drowned City. The Crystal Mine. And the First Hatchery, where the old dragons kept their eggs.' },
      // Act II's main thread goes on from here (src/game/quests.ts, main()): what feeds the roots over the four gates.
      { who: 'mossa', text: 'Something down there is feeding those roots. Find it, and the gates may open again. Until then, our fire is yours.' },
      ...mossaRite(g),
    ], () => {
      g.saveNow();
      nyxaReturns(g);
    });
    return;
  }
  // Saves that met her before the rite was part of her tale hear it now.
  if (!g.save.found['story:hollow:mossa-rite']) {
    g.say(mossaRite(g), () => g.saveNow());
    return;
  }
  const eggs = eggsFound(g.save);
  if (g.save.levelsDone.mycelium) {
    if (!g.save.found['story:hollow:mossa-mycelium']) {
      g.save.found['story:hollow:mossa-mycelium'] = true;
      g.say([
        { who: 'mossa', text: 'The lamps! Did you see? Every one in the Hollow came up bright at once, the moment the Spore Mother fell.' },
        { who: 'mossa', text: 'Whatever she fed into those roots, it has stopped. The Deep breathes again. Thank you, dear. All of Lanternhollow thanks you.' },
        { who: 'aster', text: 'The other gates are still shut.' },
        { who: 'mossa', text: 'The Drowned City\'s is next, out under the canal. The roots there drink from something else. Something that swims.' },
        { who: 'mossa', text: 'Not yet, dear. Rest a while, help our folk, and listen to the water. It will tell us when.' },
      ], () => g.saveNow());
      return;
    }
    g.say([{ who: 'mossa', text: 'The Drowned City\'s gate still holds, dear. Listen to the water, and help our folk while it makes up its mind.' }]);
    return;
  }
  if (g.save.found['gate:mycelium']) {
    g.say([{ who: 'mossa', text: 'The Mycelium gate stands open! Go through, dear, and mind the spores. Whatever feeds those roots is down there.' }]);
    return;
  }
  g.say([{
    who: 'mossa',
    text: eggs >= MYCELIUM_EGGS
      ? `${eggs} eggs' warmth on you! Go now, dear, to the Mycelium gate, east past the Glowcap Wood, before the roots think better of it.`
      : `${eggs} eggs, dear. ${MYCELIUM_EGGS - eggs} more and the Mycelium gate will know you. The realms you came through still hide a few, and so does the Hollow.`,
  }]);
}

/**
 * Mossa's rite: the old dragons' gates remember eggs, and twelve rescued
 * eggs carried to the Mycelium gate will wither its roots (see gates()).
 */
function mossaRite(g: Game): Line[] {
  g.save.found['story:hollow:mossa-rite'] = true;
  const eggs = eggsFound(g.save);
  return [
    { who: 'mossa', text: 'But you, dear... you might open one sooner. The old dragons built those gates, and a dragon\'s gate remembers eggs.' },
    { who: 'mossa', text: `Carry the warmth of ${MYCELIUM_EGGS} rescued eggs to the Mycelium gate, east past the Glowcap Wood, and its roots will wither. That's the old rite.` },
    { who: 'flick', text: 'Eggs! We\'ve been finding lost eggs everywhere! How many have we got, Aster?' },
    eggs >= MYCELIUM_EGGS
      ? { who: 'mossa', text: `${eggs}? Then don't sit here listening to an old woman. Go now, dear, before the roots think better of it.` }
      : { who: 'mossa', text: `${eggs ? `${eggs}. Then ${MYCELIUM_EGGS - eggs} more` : 'None yet? Then look for them'}, dear. The realms you came through still hide a few, I'd wager, and so does the Hollow.` },
  ];
}

function talkTallow(g: Game): void {
  const Q = 'hollow-oil';
  if (!g.quests.isStarted(Q)) {
    g.save.found['story:hollow:tallow'] = true;
    g.say([
      { who: 'tallow', text: 'Mind the stock! Every lamp in the Hollow comes off this bench, and every one of them is running on old oil.' },
      { who: 'tallow', text: 'Glowcap oil, see. From the big mushrooms in the Glowcap Wood, east of the lake. Only the Gloom are camped in there now, and they poke anyone who comes near.' },
      { who: 'tallow', text: 'You look like you could poke back. Clear them out, bring me a sack of fresh spores, and I\'ll fill every lamp from here to the gates.' },
    ], () => g.quests.start(Q));
    return;
  }
  const s = g.quests.isDone(Q) ? 99 : g.quests.step(Q);
  if (s === 2) {
    g.say([
      { who: 'tallow', text: 'Spores! Fresh ones, still glowing! And the Wood quiet? Oh, you lovely great lump.' },
      { who: 'tallow', text: 'Here. Gems for you, and a page from my ledger. Don\'t read the bit about the lamp you knocked over.' },
    ], () => g.quests.notify('talk', { id: 'tallow' }));
  } else if (s < 2) {
    g.say([{ who: 'tallow', text: s === 0 ? 'The Gloom are camped in the south of the Glowcap Wood, east of the lake. Poke them for me.' : 'The spores drift down round the giant caps. Some land right on top. Bounce if you must.' }]);
  } else {
    g.say([{ who: 'tallow', text: 'Every lamp full, and not one flicker. The roots can groan all they like.' }]);
  }
}

function talkPip(g: Game): void {
  const Q = 'hollow-lantern';
  if (g.quests.isStarted(Q) && !g.quests.isDone(Q) && g.quests.step(Q) === 1) {
    g.say([
      { who: 'pip', text: 'My LANTERN! You dived all the way down there? With the roots looking at you?' },
      { who: 'pip', text: 'Here, take these. And my swimming rules. You\'ve earned them. Mostly rule four.' },
    ], () => g.quests.notify('talk', { id: 'pip' }));
    return;
  }
  if (!g.save.found['story:hollow:pip']) {
    g.save.found['story:hollow:pip'] = true;
    g.say([
      { who: 'pip', text: 'You\'re a DRAGON. Are you going to eat me? You can say. I\'d rather know.' },
      { who: 'aster', text: 'I\'m not going to eat you.' },
      { who: 'pip', text: 'Good. I\'m Pip. I\'m the best swimmer in Lanternhollow, which isn\'t saying much, because nobody else will get wet.' },
      { who: 'pip', text: 'There\'s a cave under the south-west cliff. You swim in where the water goes under the rock. There\'s an egg in there, glowing. Mossa says I made it up.' },
      { who: 'pip', text: 'And I dropped my good lantern in the canal by the Drowned City gate. If you ever see it down there... no pressure. Some pressure.' },
    ], () => g.quests.start(Q));
    return;
  }
  const found = !!g.save.found['hollow:egg-grotto'];
  g.say([{ who: 'pip', text: found ? 'You found the egg? I KNEW it was real! Wait till I tell Mossa.' : 'Found the glowing egg yet? Where the water goes under the south-west cliff. Take a big breath first!' }]);
}
