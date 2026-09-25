import * as THREE from 'three';
import type { LevelDef, Builder } from '../world/level';
import { Npc } from '../world/level';
import { ambient, paint, jitter, bossFight, Cage, rescueWarden } from './common';
import { Grolm } from '../enemies/bosses/grolm';
import { FROSTFANG } from '../game/story';
import type { Game } from '../game/game';
import type { Prop, GateKind } from '../entities/props';
import { makeBox, makeCyl, type Solid, type Surface } from '../world/collision';
import { GEO } from '../render/decor';
import { mat, matUnique, glow as glowNew } from '../render/materials';
import { mergeStatic } from '../render/shapes';
import { rng } from '../core/rng';

/**
 * The Frostworks: the old ice forges, built to keep the Sanctum's harvest
 * through the long winters and now hammering out rime chains for the Hollow
 * King. Second two-element realm: teaches lightning switches (doors and a
 * lift), melting ice walls, torch locks, Ground Pound plates, riding gears,
 * crumbling ice and the Overload reaction. Ends with Forgemaster Grolm and
 * Frostfang's rescue. Two secrets need Earth or Ice.
 */

const COLORS = paint({
  under: 0x26364a, shore: 0x75828f, grass: 0xe4ecf4, grass2: 0xcfdae6, rock: 0x5e6776, path: 0x98a2ae, high: 0xf6faff, highAt: 9,
});

const STONE = 0x767b86;
const STONE_DARK = 0x555a64;
const SLAB = 0x878c97;
const IRON = 0x3a3d45;
const BRASS = 0xa88450;
const SNOW = 0xf2f6fb;
const LAVA = 0xff6a18;

// Arena and boss geometry, shared with the outro.
const BOSS_X = 0;
const BOSS_Z = 253;
const BOSS_R = 20;
const CAGE_Z = 275.5;
const TOP = 12;

// Side areas off the main route.
/** The ice-cutters' shelf on the west shore of the lake. */
const CAMP = { x: -33, z: 58, y: 2.4 };
/** The old harvest cellar cut into the west slope beside the Lower Works. */
const CELLAR = { x0: -41, x1: -30.5, z: 98, y: 3.2 };
/** A berg in the lake, one jump east of the floes' stepping rock. */
const BERG = { x: 7.8, z: 72.5, top: 1.4 };
/** The iron post in the gear pit below the Upper Works. */
const SUPPORT = { x: -16, z: 186, top: 8.9 };

const LINK = new THREE.TorusGeometry(0.2, 0.055, 5, 10);

const GLOWS = new Map<string, THREE.MeshBasicMaterial>();
/**
 * Glow materials shared per color: decor batches by material, so a fresh
 * material per call cost a draw call per glowing strip, ingot and lamp.
 */
function glow(color: number, opacity = 1): THREE.MeshBasicMaterial {
  const key = `${color}|${opacity}`;
  let m = GLOWS.get(key);
  if (!m) {
    m = glowNew(color, opacity);
    GLOWS.set(key, m);
  }
  return m;
}
const Y_AXIS = new THREE.Vector3(0, 1, 0);

let cage: Cage | null = null;

export const frostworks: LevelDef = {
  id: 'frostworks',
  name: 'The Frostworks',
  subtitle: 'Where the winter is forged',
  music: 'frost',
  killY: -25,
  spawn: [0, -3, 0],
  sky: {
    top: 0x6d8bb2, horizon: 0xdde6ee, bottom: 0xa9b8c8, sunDir: [0.45, 0.32, 0.5], sunColor: 0xffe0bc, sunIntensity: 1.55,
    hemiSky: 0xdae6ff, hemiGround: 0x6a6878, hemiIntensity: 1.2, fogNear: 45, fogFar: 200, fog: 0xd0dae4,
  },
  water: { level: 0, deep: 0x16304a, shallow: 0x5b8db4, glint: 0xe6f6ff, opacity: 0.9 },
  terrain: {
    x0: -90, z0: -18, sizeX: 180, sizeZ: 304, cell: 1.5,
    color: COLORS,
    shape: (s) => {
      s.base(-3.5).noise(0.7, 0.045, 5);
      // The mountains that hold the forge.
      s.ridge([[-50, -30], [-47, 60], [-52, 150], [-47, 300]], 26, 26);
      s.ridge([[50, -30], [47, 60], [52, 150], [47, 300]], 26, 26);
      s.ridge([[-60, -21], [60, -21]], 9, 22);
      s.ridge([[-60, 293], [60, 293]], 13, 30);
      s.mound(-42, 100, 16, 16);
      s.mound(44, 30, 14, 12);
      s.mound(42, 232, 18, 16);
      s.mound(-40, 190, 14, 14);
      // Wardgate landing and the frozen pass.
      s.island(0, 2, 17, 1.6, 3, 0.3, 1, 1.1);
      s.ridge([[-48, 21], [-6.5, 20]], 4.5, 12);
      s.ridge([[6.5, 20], [48, 21]], 4.5, 12);
      s.path([[0, 12, 1.6], [0, 27, 2.4]], 6, 2);
      // Frost Hollow and the jetty.
      s.island(0, 38, 14, 2.4, 3, 0.35);
      s.island(-12, 47, 4.5, 3.6, 2, 0.2);
      s.path([[0, 50, 2.4], [0, 57, 2.1]], 4, 1.5);
      // Rocks in the freezing lake.
      s.island(1.5, 74.8, 2.4, 1.3, 1.2, 0.1);
      s.island(-24, 71, 3.6, 1.2, 1.5, 0.1);
      // Lower Works courtyard.
      s.island(0, 98, 14, 3.2, 2.5, 0.2, 1.4, 1);
      // Molten Hall floor, level under the lava.
      for (let z = 114; z <= 150; z += 3) s.path([[-15, z, 1.4], [15, z, 1.4]], 3.4, 0.6, false);
      // Upper Works and the Crucible, high above the gear pit.
      s.island(8, 211, 12, TOP, 2, 0.1, 1.6, 1);
      s.island(BOSS_X, BOSS_Z, 24, TOP, 2, 0.1, 1, 1.1);
      // Side areas: the ice-cutters' shelf on the west shore, and a level cut
      // into the west slope for the old harvest cellar.
      s.flatten(CAMP.x, CAMP.z, 6.5, CAMP.y, 3.5);
      s.path([[-21, CELLAR.z, CELLAR.y], [CELLAR.x0 - 1.5, CELLAR.z, CELLAR.y]], 7, 2.5, false, false);
    },
  },

  build(b: Builder) {
    ambient(b, 'snow', 26);
    b.bound(-88, -16, 88, -16);
    b.bound(88, -16, 88, 284);
    b.bound(88, 284, -88, 284);
    b.bound(-88, 284, -88, -16);
    buildLanding(b);
    hollowConduits(b);
    buildHollow(b);
    buildLake(b);
    buildLowerWorks(b);
    buildMoltenHall(b);
    buildGearworks(b);
    buildUpperWorks(b);
    buildCrucible(b);
    // Everything below came later: it is built after the original areas so
    // their scattered scenery (seeded in build order) stays where it was.
    cuttersCamp(b);
    harvestCellar(b);
    frozenBerg(b);
    supportEgg(b);
    draftingRoof(b);
    dressFrost(b);
    b.level.props.push(new FogCull(b.game));
  },

  onEnter(g, fresh) {
    if (fresh && !g.save.found['story:frostworks:intro']) {
      g.save.found['story:frostworks:intro'] = true;
      g.say([
        { who: 'flick', text: 'Brrr! Aster, I can\'t feel my glow. Is my glow still on? Tell me my glow is still on.' },
        { who: 'aster', text: 'Your glow is fine, Flick.' },
        { who: 'flick', text: 'Fireflies don\'t DO mountains. Mountains are just weather with corners.' },
        { who: 'aster', text: 'Frostfang is somewhere in that forge. Walking will warm you up.' },
        { who: 'flick', text: 'Or you could breathe on me a little. Just the toes. Toasty toes.' },
      ]);
    } else if (fresh && g.save.levelsDone.frostworks && !g.save.found['frostworks:mana2']) {
      g.hud.flick(g.save.elements.includes('ice')
        ? 'Back in the cold. Now that you breathe Ice, that coolant geyser in the Upper Works might open something.'
        : 'Back in the cold. Something up in the Upper Works still needs Ice.', 6);
    }
  },
};

// ---------------------------------------------------------------------------
// Areas
// ---------------------------------------------------------------------------

function buildLanding(b: Builder): void {
  const g = b.game;
  if (g.save.levelsDone.frostworks) b.portal(0, -9, 0, 'sanctum', 'Return to the Sanctum', 0x9fe8ff);
  else {
    b.arch(0, -9, 0, 5, 5.5, STONE);
    icicles(b, -3.3, -9, 3.3, -9, b.y(0, -9) + 5.5, 9);
  }
  b.decor.glowCrystal(-2.6, b.y(-2.6, -8), -8, 1.3, 0x9fe8ff);
  b.decor.glowCrystal(2.6, b.y(2.6, -8), -8, 1.3, 0x9fe8ff);

  // Frozen grotto behind a waterfall: the first relic, and a taste of melting.
  const gy = hut(b, -12, 13.8, 6.8, 6.4, 4.4, Math.PI, 'ice');
  b.collectible('relic1', 'relic', -12, 14.5, gy, 'frost1');
  frozenFall(b, -12, 16.4, gy + 11, gy + 4.8, 5.5, 0);
  icicles(b, -15.6, 10.4, -8.4, 10.4, gy + 4.7, 10);
  frozenFall(b, 13.5, 16.6, gy + 12, b.y(13.5, 15.2) - 0.4, 4.5, 0);
  b.story('grotto', -12, 7, 4, () => g.hud.flick('There\'s something glinting behind that frozen waterfall. More ice to melt!', 5));

  // The pass north, sealed with ice.
  b.gate(0, 19.5, 7, 4.6, 0, 'ice');
  icicles(b, -3.5, 19, 3.5, 19, b.y(0, 19.5) + 4.8, 8);
  b.story('ice-wall', 0, 12.5, 5, () => g.hud.flick('A wall of ice! Fire melts it: hold Right Mouse to breathe flame, or Q for a fireball.', 7));
  b.story('snow', 0, 3, 5, () => g.hud.flick('Smash the crystals for gems. And if you get cold, I\'m not sharing my glow.', 5));

  b.scatter(16, 0, 0, 14.5, (x, z) => b.tree(x, z, 0.9 + Math.abs(jitter(x * 2 + z)) * 0.6, 'snowPine', { leaf: 0x2c5446 }),
    (x, z) => Math.abs(x) > 5 && Math.hypot(x + 12, z - 12) > 6 && z > -11);
  b.scatter(10, 0, 2, 14, (x, z) => snowRock(b, x, z, 0.7 + Math.abs(jitter(x - z)) * 0.8), (x) => Math.abs(x) > 4);
  b.crystal(-6, -3, 'blue', 8);
  b.crystal(7, 2, 'blue', 8);
  b.crystal(9, -6, 'green', 3);
  b.crystal(-8, 5, 'red', 3);
  b.gemLine([[0, 2], [0, 12]]);
}

/**
 * Three old forge conduits around a Gloom cage in the Hollow: charge all three
 * with Lightning before the first fades.
 */
function hollowConduits(b: Builder): void {
  const g = b.game;
  const cx = -8;
  const cz = 38.5;
  const cy = b.y(cx, cz);
  const cage = new Cage(b, cx, cz, 1.7, 3.2);
  const cageSolid = b.col.add(makeCyl(cx, cz, 2.0, cy, cy + 3.2));
  b.crystal(cx, cz, 'mixed', 32, true, cy);
  for (const [x, z] of [[-13, 35], [-3.5, 34], [-6, 43.5]] as const) b.conduit(x, z, 'hollow', 5);
  b.conduitGroup('hollow', 'hollow-conduits');
  b.level.on('hollow-conduits', () => {
    cage.shatter(g);
    cageSolid.enabled = false;
    g.hud.flick('All three at once! The forge\'s old wiring still works.', 5);
  });
  b.story('conduits', cx + 3, cz - 5, 5, () => g.hud.flick('Iron posts with glass tops, around a Gloom cage. Spark them with Lightning (2), all three before the first fades!', 7));
  b.puzzleHint(cx, cz, 9, [
    'Each conduit only stays charged for a few seconds. Stand by the cage so all three are close, then sweep from one to the next.',
  ], 'hollow-conduits', 25);
}

function buildHollow(b: Builder): void {
  const g = b.game;
  b.scatter(20, 0, 38, 13.5, (x, z) => b.tree(x, z, 1 + Math.abs(jitter(x + z * 3)) * 0.6, 'snowPine', { leaf: 0x2c5446 }),
    (x, z) => Math.abs(x) > 6 || z > 48 || z < 28);
  b.scatter(12, 0, 38, 13, (x, z) => snowRock(b, x, z, 0.6 + Math.abs(jitter(x * 1.3)) * 0.9), (x) => Math.abs(x) > 5);
  b.scatter(26, 0, 38, 13, (x, z, y) => b.decor.grass(x, y, z, 0.8, 0x9aa89a), () => true);
  // A frozen pond with an iron marker.
  b.decor.add(GEO.cyl(), mat(0xcfeefa, { rough: 0.1, metal: 0.1, emissive: 0x4a90c0, emissiveIntensity: 0.15 }), 7, b.y(7, 34) + 0.02, 34, 3.2, 0.06, 2.4, 0, 0, 0, false);
  // An egg thief waits at the landing, the first thing through the gate.
  b.eggThief('thief', 0, 9, 9);
  b.enemy('grunt', -6, 35, Math.PI);
  b.enemy('grunt', 6, 40, Math.PI);
  b.enemy('frostGolem', 1, 45, Math.PI);
  b.story('golem', 0, 29, 7, () => g.hud.flick('That golem is made of rime. Ice would bounce off it, but fire melts golems. Burn it down!', 7));
  b.crystal(-12, 47, 'red', 4);
  b.crystal(-10, 30, 'blue', 10, true);
  b.crystal(10, 44, 'blue', 8);
  b.gemLine([[0, 27], [0, 34]]);
  b.gemLine([[0, 48], [0, 57]], 'blue', 1.4);
}

function buildLake(b: Builder): void {
  const g = b.game;
  // Jetty posts.
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
    const z = 51 + i * 3;
    b.decor.add(GEO.cyl6(), mat(0x5a4a3a, { rough: 1 }), sx * 2.3, b.y(sx * 2.3, z) - 1, z, 0.16, 2.2, 0.16);
  }
  b.story('floes', 0, 56, 3, () => g.hud.flick('Those ice floes crack under your weight. Keep moving, and don\'t stop to admire the view!', 6));
  const floes: [number, number][] = [[0, 62.8], [0.5, 68.8], [0, 80.5], [-4.5, 74], [-10.5, 73.2], [-16.5, 72.4]];
  for (const [x, z] of floes) {
    b.level.props.push(new IceFloe(b, x, 1.0, z, 3.6));
    b.gems(x, z, 'blue', 1, 0, 1.0);
  }
  b.gems(1.5, 74.8, 'blue', 3, 1.0);
  b.collectible('mana1', 'mana', -24, 71);
  b.crystal(-25.5, 73, 'green', 4);
  b.decor.glowCrystal(-22, b.y(-22, 69), 69, 1.4, 0x9fe8ff);
  b.enemy('wisp', -6, 67, Math.PI);
  b.enemy('wisp', 7, 78, Math.PI);
  // Drift ice and icebergs, well off the path.
  const ice = mat(0xd8f0fb, { rough: 0.2, metal: 0.05, flat: true });
  for (let i = 0; i < 16; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (12 + Math.abs(jitter(i, 4)) * 9);
    const z = 58 + Math.abs(jitter(i, 5)) * 26;
    if (Math.hypot(x + 24, z - 71) < 7) continue;
    b.decor.add(GEO.rock(), ice, x, -0.35, z, 0.9 + Math.abs(jitter(i, 6)) * 1.4, 0.35 + Math.abs(jitter(i, 7)) * 0.5, 0.9 + Math.abs(jitter(i, 8)) * 1.3, jitter(i, 9) * 0.2, i, 0);
  }
  frozenFall(b, 21.5, 66, 13, -0.3, 6, -Math.PI / 2);
  frozenFall(b, -22.5, 84, 14, -0.3, 5, Math.PI / 2);
}

function buildLowerWorks(b: Builder): void {
  const g = b.game;
  b.checkpoint('works', 3.2, 88.5, 0);
  // The forge wall and its gatehouse.
  const wy = -3.5;
  b.box(0, 1.0, 112.25, 8, 2.2, 2.6, STONE_DARK);
  forgeWall(b, -24, 112.25, -3.6, 112.25, wy, 14);
  forgeWall(b, 3.6, 112.25, 24, 112.25, wy, 14);
  for (const sx of [-1, 1]) {
    block(b, sx * 5.6, wy, 111.8, 3.4, 17.5, 3.4, STONE_DARK, IRON);
    b.decor.add(GEO.box(), glow(0xff9a40), sx * 5.6, 9.5, 110.05, 0.9, 1.6, 0.1);
    b.decor.add(GEO.cyl(), mat(IRON, { rough: 0.6, metal: 0.3 }), sx * 5.6, 14, 111.8, 0.5, 3, 0.5);
    b.level.props.push(new Smoker(g, sx * 5.6, 17.2, 111.8, 0.14));
  }
  block(b, 0, 9.3, 112.25, 7.8, 4.7, 2.6, STONE, IRON);
  b.gate(0, 112.25, 7.2, 6, 0, 'stone', 'forge-gate', 3.2);
  icicles(b, -4, 110.8, 4, 110.8, 9.25, 12);
  b.switchCrystal(-8, 107.5, 'lightning', 'forge-gate');
  b.level.props.push(new Wheel(b, -13, 8.5, 110.7, 3.2, 0, 0.35, 0x565a64));
  b.level.props.push(new Wheel(b, 13, 7, 110.7, 2.4, 0, -0.5, 0x565a64));

  const kiln = b.arena('kilnyard', -2, 100, 10.5, [
    [{ type: 'grunt', x: -6, z: 104 }, { type: 'grunt', x: 3, z: 105, delay: 0.3 }, { type: 'grunt', x: -2, z: 95, delay: 0.6 }],
    [{ type: 'slinger', x: -9, z: 103 }, { type: 'slinger', x: 5, z: 104 }, { type: 'shieldbearer', x: -2, z: 106, delay: 0.3 }, { type: 'grunt', x: -2, z: 94, delay: 0.6 }],
  ], 40);
  kiln.onStart = () => {
    if (!g.save.found['story:frostworks:overload']) {
      g.save.found['story:frostworks:overload'] = true;
      g.say([
        { who: 'gloom', text: 'The violet one! Chain it! The Forgemaster wants it for the anvil!' },
        { who: 'flick', text: 'Nobody is chaining anybody. Aster, you\'ve got TWO breaths now. Use them together!' },
      ], () => g.hud.flick('Shock a foe with Lightning (2), then hit it with Fire (1) for an OVERLOAD blast!', 8));
    }
  };
  kiln.onClear = () => {
    if (!b.level.fired.has('forge-gate')) g.hud.flick('The gate\'s sealed, but that crystal by the wall is hungry for a spark. Switch to Lightning (2) and zap it!', 7);
  };
  b.story('gatehint', -2, 107, 4, () => {
    if (!b.level.fired.has('forge-gate')) g.hud.flick('A lightning crystal! Zap it with Lightning (2) to power the gate.', 5);
  });

  // Kilns, a molten trough and the frozen harvest the forge was built to keep.
  kilnDecor(b, -11, 90, 0.5);
  kilnDecor(b, 12, 91, -0.6);
  b.hazard(-11, 94.2, 2.2, 0.6, 10, 'lava', 0.6);
  trough(b, -11, 94.2, 4.4, 1.2);
  for (let i = 0; i < 6; i++) harvestCrate(b, -16 + (i % 3) * 1.7, 100 + Math.floor(i / 3) * 1.7, i);
  chainPile(b, 8, 96);
  chainPile(b, -14, 106);
  anvil(b, 5, 91, 0.3, 1);
  // Collapsed storehouse: cracked rock hides a heart shard (needs Earth).
  const sy = hut(b, 14, 99, 6.8, 5.2, 4.2, -Math.PI / 2, 'rock');
  b.collectible('heart2', 'heart', 14.6, 99, sy);
  rubble(b, 10.2, 96.5);
  rubble(b, 10.5, 102);
  b.story('rockgate', 8.5, 99, 3, () => {
    if (!g.save.elements.includes('earth')) g.hud.flick('Cracked stone. Nothing we\'ve got can crack that. Yet. Remember this spot.', 5);
  });
  b.crystal(-16, 94, 'blue', 10, true);
  b.crystal(15, 90, 'green', 3);
  b.gemLine([[0, 85], [0, 94]]);
  b.scatter(10, 0, 98, 18, (x, z) => snowRock(b, x, z, 0.6 + Math.abs(jitter(x * 0.7 + z)) * 0.7),
    (x, z) => Math.hypot(x + 2, z - 100) > 12 && z < 108 && Math.abs(x - 13.8) > 4);
}

function buildMoltenHall(b: Builder): void {
  const g = b.game;
  // Stone slabs above a floor of molten metal.
  const slab = (x: number, z: number, w: number, d: number) => block(b, x, 1.0, z, w, 2.2, d, SLAB, IRON);
  slab(0, 117.25, 12, 7.5);
  slab(-8, 127.5, 9, 8);
  slab(8.5, 127, 8, 7);
  slab(0, 138.5, 16, 10);
  slab(0, 147.25, 12, 4.5);
  block(b, 13.5, 1.0, 139, 5, 7.2, 10, SLAB, BRASS);
  b.box(0, 1.0, 150, 6, 2.2, 1.6, STONE_DARK);
  b.hazard(0, 131.5, 16, 18.5, 12, 'lava', 1, 1.4);
  // Walls and the torch-locked door.
  forgeWall(b, -16.5, 112.5, -16.5, 150.5, -3.5, 18.5);
  forgeWall(b, 16.5, 112.5, 16.5, 150.5, -3.5, 18.5);
  forgeWall(b, -16.5, 150, -3, 150, -3.5, 18.5);
  forgeWall(b, 3, 150, 16.5, 150, -3.5, 18.5);
  block(b, 0, 8.7, 150, 6.4, 6.3, 1.4, STONE, IRON);
  b.gate(0, 150, 6, 5.5, 0, 'stone', 'smelt-door', 3.2);
  b.torch(-11, 125.5, 'smelt');
  b.torch(11, 124.5, 'smelt');
  b.torch(13.5, 142.5, 'smelt');
  b.torchGroup('smelt', 'smelt-door');
  b.level.on('smelt-door', () => g.hud.flick('All three braziers lit! The door\'s open. I can hear gears grinding out there.', 5));
  // The Ground Pound plate raises a piston out of the melt.
  b.plate(3.5, 141.5, 'smelt-piston');
  b.level.props.push(new Piston(b, 9.5, 136.5, 3, 3, 1.2, 5.3, 'smelt-piston'));
  b.level.on('smelt-piston', () => {
    g.toast('Something rises out of the melt...', 'info');
    g.sfx('rumble', 9.5, 3, 136.5);
    g.shake(0.3, 0.8);
  });
  // A hanging crucible over the melt: glide down from the hearth ledge.
  block(b, 1, 7.3, 128.5, 4, 0.5, 4, IRON, BRASS);
  for (const [cx, cz] of [[-0.8, 126.7], [2.8, 126.7], [-0.8, 130.3], [2.8, 130.3]] as const) chain(b, [cx, 7.8, cz], [1 + (cx - 1) * 0.4, 14.5, 128.5 + (cz - 128.5) * 0.4], 0);
  b.collectible('heart1', 'heart', 1, 128.5, 7.8);

  const smelt = b.arena('smeltery', 0, 138.5, 7.5, [
    [{ type: 'frostGolem', x: 0, z: 142 }, { type: 'grunt', x: -5, z: 135, delay: 0.3 }, { type: 'grunt', x: 5, z: 135, delay: 0.5 }],
    [{ type: 'frostGolem', x: -4, z: 141 }, { type: 'slinger', x: 6, z: 142.5 }, { type: 'slinger', x: -6.5, z: 142.5, delay: 0.4 }],
  ], 45);
  smelt.onStart = () => g.hud.flick('Golems again! Fire melts them. Lightning then Fire makes them go BOOM!', 6);
  smelt.onClear = () => {
    if (!b.level.fired.has('smelt-piston')) g.hud.flick('See that plate? Jump, then press Tail (E) in the air to Ground Pound it!', 7);
  };
  b.enemy('grunt', -8, 128, Math.PI);
  b.enemy('grunt', 8.5, 127.5, Math.PI);
  b.story('molten', 0, 116, 4, () => g.hud.flick('Molten channels! Don\'t touch the glowing stuff. Jump the gaps between the slabs.', 6));
  b.story('braziers', 0, 147, 4, () => {
    if (!b.level.fired.has('smelt-door')) g.hud.flick('The door is locked by three braziers. Light them all with fire. One is up on that high ledge!', 7);
  });

  // Dressing: beams, chains, molds and glowing ingots.
  const iron = mat(IRON, { rough: 0.6, metal: 0.3 });
  for (const z of [118, 127, 136, 145]) {
    b.decor.add(GEO.box(), iron, 0, 14.6, z, 33, 0.7, 0.8);
    chain(b, [-9, 14.3, z], [-9, 10.2 - (z % 2), z], 0);
    chain(b, [9, 14.3, z + 1], [9, 10.6, z + 1], 0);
  }
  b.decor.add(GEO.box(), iron, 0, 14.6, 131.5, 0.8, 0.7, 37);
  for (const [x, z] of [[-4, 116], [4.5, 118.5], [-9.5, 129.5], [10, 129], [-5, 146.5]] as const) ingots(b, x, z);
  anvil(b, -3.5, 136, 0.4, 1);
  b.level.props.push(new Wheel(b, -15.8, 7.5, 131, 3.5, Math.PI / 2, 0.3, 0x565a64));
  b.level.props.push(new Wheel(b, 15.8, 10.5, 125, 2.2, -Math.PI / 2, -0.6, 0x565a64));
  for (let i = 0; i < 6; i++) b.level.props.push(new Smoker(g, -12 + i * 5, 1.5, 120 + (i % 3) * 11, 0.5, true));
  b.crystal(-11, 130, 'green', 4);
  b.crystal(12, 140, 'blue', 12);
  b.crystal(5, 146.5, 'red', 3);
}

function buildGearworks(b: Builder): void {
  const g = b.game;
  block(b, 0, -3.5, 153.5, 10, 6.7, 6, STONE_DARK, IRON);
  b.checkpoint('gears', -2.6, 153.2, 0);
  b.story('gears', 0, 154.5, 3, () => g.hud.flick('Giant gears! Hop on and let them carry you around. Mind the gaps!', 6));
  const gears: [number, number, number, number, number][] = [
    [0, 3.2, 161.5, 3.8, 0.5],
    [-10.5, 3.9, 167.5, 4.4, -0.6],
    [-6, 4.6, 177.5, 4, 0.7],
  ];
  for (const [x, y, z, r, spin] of gears) {
    b.level.props.push(new Gear(b, x, y, z, r, spin));
    b.gems(x, z, 'blue', 1, 0, y);
  }
  // Dock A, the great lever, dock B and the lift.
  block(b, -7, -3.5, 185.5, 5, 7.1, 4, STONE_DARK, IRON);
  b.story('lever', -7, 185.5, 3, () => g.hud.flick('That big lever sweeps right past us. Hop on when it comes around, ride it, and jump off at the far dock!', 7));
  b.level.props.push(new Gear(b, 6, 3.6, 186, 3, 0.45, 10.2, 2.6));
  b.pillar(6, 186, 0.75, 3.6, 6.7, 0x5a5e68);
  b.collectible('relic2', 'relic', 6, 186, 6.7, 'frost2');
  block(b, 19, -3.5, 186, 5, 7.1, 4, STONE_DARK, IRON);
  b.switchCrystal(20.4, 184.9, 'lightning', 'lift-power');
  b.mover([[19, 3.6, 190.2], [19, TOP, 190.2]], 4, 4, 2.4, 0x5a5e68, 0, 'lift-power', 2.2);
  b.level.on('lift-power', () => g.hud.flick('The lift hums to life! Ride it up.', 4));
  b.story('lift', 18.5, 186, 3, () => {
    if (!b.level.fired.has('lift-power')) g.hud.flick('A lift, but it\'s got no power. That crystal wants a spark: Lightning, Aster!', 6);
  });
  block(b, 19, -3.5, 195, 5, 15.5, 5, STONE_DARK, IRON);
  block(b, 19, TOP - 1, 199.5, 5, 1, 4, STONE, IRON);
  b.level.props.push(new Wheel(b, 21.6, 8, 195, 2, Math.PI / 2, 0.8, 0x565a64));
  chain(b, [17, 12.2, 192.4], [17, 3.8, 192.4], 0);
  chain(b, [21, 12.2, 192.4], [21, 3.8, 192.4], 0);
  b.enemy('wisp', -5, 171, Math.PI);
  b.enemy('wisp', 13, 190, -Math.PI / 2);
  b.gemLine([[-9.5, 185.5], [-4.5, 185.5]]);
  b.gems(19, 186, 'blue', 4, 1.3, 3.6);
  // Frozen falls on the pit walls.
  frozenFall(b, -21.5, 172, 12, -0.3, 6, Math.PI / 2);
  frozenFall(b, 22.5, 160, 13, -0.3, 5, -Math.PI / 2);
  // Iron supports in the water.
  const iron = mat(IRON, { rough: 0.6, metal: 0.3 });
  for (const [x, z] of [[-15, 158], [14, 164], [-16, 186], [-2, 194]] as const) {
    b.decor.add(GEO.cyl6(), iron, x, -2, z, 0.9, 11, 0.9);
    b.decor.add(GEO.box(), iron, x, 8.6, z, 3, 0.6, 3);
  }
}

function buildUpperWorks(b: Builder): void {
  const g = b.game;
  const anv = b.arena('anvil', 8, 210, 8, [
    [{ type: 'totem', x: 8, z: 214 }, { type: 'grunt', x: 4, z: 207 }, { type: 'grunt', x: 12, z: 207, delay: 0.3 }, { type: 'wisp', x: 8, z: 204, delay: 0.5 }],
    [{ type: 'brute', x: 8, z: 213 }, { type: 'frostGolem', x: 3, z: 210, delay: 0.4 }, { type: 'wisp', x: 13, z: 212, delay: 0.7 }],
  ], 60);
  anv.onStart = () => g.hud.flick('A totem is shielding them! Smash it first!', 5);
  anv.onClear = () => g.hud.flick('The Crucible is past that bridge. And Frostfang, I hope.', 5);
  anvil(b, 8, 210, 0.2, 1.8);
  // Drafting room: timed braziers guard the golem plans.
  const ry = hut(b, -6, 210, 8.8, 6.4, 4.5, Math.PI / 2, 'stone', 'drafting');
  b.collectible('relic3', 'relic', -6.5, 210, ry, 'frost3');
  b.torch(-1, 203.5, 'drafting', false, 6);
  b.torch(-1, 217, 'drafting', false, 6);
  b.torch(-6.5, 217.6, 'drafting', false, 6);
  b.torchGroup('drafting', 'drafting');
  b.story('drafting', -1.5, 210, 4, () => g.hud.flick('Three braziers, and they burn out fast. Light them all before the first one dies! Fireballs (Q) reach far.', 7));
  // Coolant vault: freeze the geyser and the pressure pops the door (needs Ice).
  const vy = hut(b, 22.3, 210, 6.8, 5, 4.5, -Math.PI / 2, 'stone', 'vault');
  b.collectible('mana2', 'mana', 22.5, 210, vy);
  b.geyser(17.5, 215, 1.1, 4.5, true, 'vault');
  const iron = mat(IRON, { rough: 0.6, metal: 0.3 });
  b.decor.add(GEO.cyl(), iron, 18.8, vy + 0.4, 215, 0.3, 0.3, 0.3);
  for (let i = 0; i < 4; i++) b.decor.add(GEO.box(), iron, 19.1, vy + 0.35, 214.2 - i * 0.9, 0.35, 0.35, 0.9);
  b.decor.add(GEO.box(), iron, 19.4, vy + 2.4, 211.4, 0.35, 4.4, 0.35);
  b.story('vault', 17, 212, 4, () => {
    if (!g.save.elements.includes('ice')) g.hud.flick('That geyser is piped straight into the vault door. If only we could freeze it solid...', 6);
    else g.hud.flick('Freeze the geyser with Ice! The pressure should pop that vault open.', 5);
  });
  b.level.on('vault', () => g.toast('The vault door grinds open.', 'good'));

  b.checkpoint('crucible', -2.8, 218.6, 0);
  // Stacks of finished rime chains, waiting for the Hollow King.
  chainPile(b, 15, 204);
  chainPile(b, 1, 202.5);
  chainPile(b, 16.5, 218.5);
  kilnDecor(b, 14.5, 219.5, Math.PI);
  // Forge stacks, a crane over the gear pit and drifts of snow.
  for (const [x, z, h] of [[20.5, 219.2, 9]] as const) {
    const y = b.y(x, z);
    block(b, x, y - 0.5, z, 2.2, h, 2.2, STONE_DARK, IRON);
    b.decor.add(GEO.cyl(), mat(IRON, { rough: 0.6, metal: 0.3 }), x, y + h - 0.5, z, 0.7, 1.4, 0.7);
    b.decor.add(GEO.box(), glow(0xff9a40), x, y + h * 0.6, z + 1.12, 0.6, 0.9, 0.05, 0, 0, 0, false);
    b.level.props.push(new Smoker(g, x, y + h + 1, z, 0.18));
  }
  crane(b, -4.5, 203.5, Math.PI * 0.85);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const x = 8 + Math.sin(a) * 17.5;
    const z = 211 + Math.cos(a) * 10.5;
    if (Math.hypot(x, z - 221) < 5 || Math.hypot(x - 19, z - 201) < 5) continue;
    b.decor.add(GEO.blob(), mat(SNOW, { rough: 0.95, flat: true }), x, b.y(x, z) - 0.2, z, 1.6 + Math.abs(jitter(i, 3)), 0.55, 1.2, 0, a, 0);
  }
  frozenFall(b, 30.5, 212, TOP + 12, TOP - 0.2, 6, -Math.PI / 2);
  b.crystal(-9.5, 202.5, 'blue', 12, true);
  b.crystal(24, 217, 'green', 4);
  b.crystal(14, 221, 'blue', 8);
  b.crystal(3, 204, 'red', 3);
  b.gemLine([[19, 201], [13, 205]]);
  b.gemLine([[1, 214], [0, 220]]);
  b.scatter(10, 8, 211, 16, (x, z) => snowRock(b, x, z, 0.5 + Math.abs(jitter(x + z)) * 0.6),
    (x, z) => Math.hypot(x - 8, z - 210) > 10 && Math.abs(x + 6) > 4.5 && Math.abs(x - 22) > 4);
}

function buildCrucible(b: Builder): void {
  const g = b.game;
  b.bridge(0, 220.2, TOP, 0, 228.6, TOP, 4);
  for (const sx of [-1, 1]) {
    b.decor.add(GEO.cyl6(), mat(IRON, { rough: 0.6, metal: 0.3 }), sx * 2.4, TOP - 0.2, 220.6, 0.25, 4.2, 0.25);
    b.decor.add(GEO.cyl6(), mat(IRON, { rough: 0.6, metal: 0.3 }), sx * 2.4, TOP - 0.2, 228.4, 0.25, 4.2, 0.25);
    chain(b, [sx * 2.4, TOP + 3.9, 220.6], [sx * 2.4, TOP + 3.9, 228.4], 1.6);
  }
  icicles(b, -2, 224.4, 2, 224.4, TOP - 0.45, 6);
  b.gemLine([[0, 221.5], [0, 228]], 'blue', 1.3);
  b.crystal(-5, 231.5, 'red', 4);
  b.crystal(5, 231.5, 'green', 4);
  b.story('bridge', 0, 221, 3, () => g.hud.flick('I can see Frostfang! He\'s caged past that bridge. And that anvil... is it breathing?', 6));

  // The Crucible: a paved ring of braziers, pools of melt, and the Forgemaster's anvil.
  const iron = mat(IRON, { rough: 0.6, metal: 0.3 });
  const floor = makeCyl(BOSS_X, BOSS_Z, 20.8, TOP - 0.8, TOP + 0.25);
  b.col.add(floor);
  const paving = new THREE.Mesh(new THREE.CylinderGeometry(20.8, 21.3, 1.05, 48), mat(0x8a909a, { rough: 0.95, flat: true }));
  paving.position.set(BOSS_X, TOP + 0.25 - 0.525, BOSS_Z);
  paving.receiveShadow = true;
  b.addStatic(paving);
  for (const [r, w] of [[6.5, 0.12], [13.5, 0.14], [20.2, 0.2]] as const) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, w, 4, 64), glow(r > 20 ? 0xff9a40 : 0xff7a2a));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(BOSS_X, TOP + 0.27, BOSS_Z);
    b.addStatic(ring);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    b.decor.add(GEO.box(), glow(0xff7a2a), BOSS_X + Math.sin(a) * 10, TOP + 0.27, BOSS_Z + Math.cos(a) * 10, 0.16, 0.04, 7, 0, a, 0, false);
  }
  b.decor.add(GEO.cyl(), mat(0x5a5e68, { rough: 0.6, metal: 0.3, flat: true }), BOSS_X, TOP + 0.26, BOSS_Z, 3, 0.05, 3, 0, 0, 0, false);
  anvil(b, BOSS_X - 10.5, BOSS_Z + 11.5, 0.7, 2.3);
  // A great half-forged chain hung above the ring.
  const hub = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.35, 6, 20), mat(0x8ab8d0, { rough: 0.3, metal: 0.3, emissive: 0x3a90c8, emissiveIntensity: 0.4 }));
  hub.rotation.x = Math.PI / 2;
  hub.position.set(BOSS_X, TOP + 21, BOSS_Z);
  b.addStatic(hub);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    if (Math.abs(Math.cos(a) + 1) < 0.1 || Math.abs(Math.cos(a) - 1) < 0.1) continue;
    const x = BOSS_X + Math.sin(a) * 22.2;
    const z = BOSS_Z + Math.cos(a) * 22.2 * 1.05;
    const y = b.y(x, z);
    b.pillar(x, z, 0.9, y - 1, y + 5.5, 0x5a5e68);
    if (i % 2 === 0) chain(b, [x, y + 5.3, z], [BOSS_X + Math.sin(a) * 2.6, TOP + 21, BOSS_Z + Math.cos(a) * 2.6], 1.5);
    icicles(b, x - 0.9, z, x + 0.9, z, y + 5.35, 3);
    b.decor.add(GEO.cyl(), mat(0x3a3028, { rough: 0.8, metal: 0.3 }), x, y + 5.5, z, 1.1, 0.5, 1.1);
    b.decor.add(GEO.blobLow(), glow(0xff8a30), x, y + 6.1, z, 0.6, 0.45, 0.6, 0, 0, 0, false);
    b.level.props.push(new Smoker(g, x, y + 6.4, z, 0.25, true));
  }
  for (const sx of [-1, 1]) {
    const x = sx * 17;
    const z = BOSS_Z + 18.5;
    b.hazard(x, z, 3, 2, 12, 'lava', 1);
    trough(b, x, z, 6, 4);
  }
  crucibleCage(b);
  // Green crystals round the rim to refill breath for the rime shell.
  for (const a of [0.8, 2.3, 3.9, 5.5]) b.crystal(BOSS_X + Math.sin(a) * 16.5, BOSS_Z + Math.cos(a) * 16.5, 'green', 4);
  b.decor.add(GEO.box(), iron, BOSS_X, b.y(BOSS_X, BOSS_Z + 6) - 0.2, BOSS_Z + 6, 5.5, 0.25, 3.5);
  b.scatter(14, BOSS_X, BOSS_Z, 25, (x, z) => snowRock(b, x, z, 0.7 + Math.abs(jitter(x * 3)) * 0.6),
    (x, z) => Math.hypot(x - BOSS_X, (z - BOSS_Z) / 1.05) > 23.5 && Math.abs(x) > 3);

  bossFight(b, {
    id: 'grolm', name: 'Grolm', x: BOSS_X, z: BOSS_Z, r: BOSS_R, triggerX: 0, triggerZ: 235, triggerR: 5,
    spawn: (gg) => new Grolm(gg, BOSS_X, gg.col.groundAt(BOSS_X, BOSS_Z + 5, 30, 0.3).y, BOSS_Z + 5, Math.PI, { x: BOSS_X, z: BOSS_Z, r: BOSS_R }),
    intro: [
      { who: 'flick', text: 'Aster... that pile of ice just stood up.', action: () => {
        g.fx.shatter(BOSS_X, TOP + 3, BOSS_Z + 5);
        g.fx.dust(BOSS_X, TOP, BOSS_Z + 5, 30, 0xdfe8f0);
        g.shake(0.6, 1);
        g.sfx('bossRoar', BOSS_X, TOP, BOSS_Z + 5, 0.7);
      } },
      { who: 'grolm', text: 'HALT. The furnace does not stop for visitors. The furnace does not stop for anything.' },
      { who: 'frostfang', text: 'Young one! You came! Though you are rather... smaller than the prophecies implied.' },
      { who: 'aster', text: 'I get that a lot.' },
      { who: 'grolm', text: 'The Hollow King ordered chains. I forge chains. And you, little violet thing, will make a fine ANVIL.' },
      { who: 'flick', text: 'Jump his shockwaves! When his hammer gets stuck, hit that glowing furnace!' },
    ],
    onDefeated: (gg) => frostOutro(gg),
  });
  if (g.save.levelsDone.frostworks) b.portal(0, 262, Math.PI, 'sanctum', 'Return to the Sanctum', 0x9fe8ff);
}

function crucibleCage(b: Builder): void {
  const g = b.game;
  const y = b.y(0, CAGE_Z);
  block(b, 0, y - 1, CAGE_Z, 8, 1.4, 8, STONE_DARK, BRASS);
  cage = null;
  if (g.save.levelsDone.frostworks) return;
  cage = new Cage(b, 0, CAGE_Z, 2.8, 5.5);
  const npc = new Npc(g, 'frostfang', FROSTFANG, 0, y + 0.4, CAGE_Z, Math.PI);
  b.level.npcs.push(npc);
  for (const sx of [-1, 1]) {
    b.decor.add(GEO.cyl6(), mat(IRON, { rough: 0.6, metal: 0.3 }), sx * 5, y, CAGE_Z + 1, 0.3, 9, 0.3);
    chain(b, [sx * 5, y + 8.8, CAGE_Z + 1], [sx * 1.6, y + 5.2, CAGE_Z], 0.6);
  }
}

function frostOutro(g: Game): void {
  const level = g.level;
  if (!level || level.def.id !== 'frostworks') return;
  // Frostfang breaks out of the cage and lands before Aster.
  if (g.boss && !g.boss.alive) g.boss.model.root.visible = false;
  cage?.shatter(g);
  cage = null;
  const old = level.npcs.findIndex((n) => n.id === 'frostfang');
  if (old >= 0) {
    level.root.remove(level.npcs[old]!.rig.root);
    level.npcs.splice(old, 1);
  }
  const p = g.player;
  const dx = BOSS_X - p.x;
  const dz = BOSS_Z + 4 - p.z;
  const n = Math.hypot(dx, dz) || 1;
  const x = p.x + (dx / n) * 6;
  const z = p.z + (dz / n) * 6;
  const y = g.col.groundAt(x, z, 1e4, 0.2).y;
  g.fx.shatter(x, y + 2, z, 0xdff6ff);
  g.fx.ring(x, y + 0.2, z, 0.5, 6, 0xbff4ff, 0.6);
  g.sfx('iceCrack', x, y, z);
  rescueWarden(g, {
    warden: 'frostfang', look: FROSTFANG, x, z, yaw: Math.atan2(p.x - x, p.z - z), element: 'ice', unlocks: 'plains',
    lines: [
      { who: 'frostfang', text: 'Hark! The Forgemaster falls, and with him the long, dull winter of my captivity.' },
      { who: 'flick', text: 'Does he always talk like this?' },
      { who: 'frostfang', text: 'I am Frostfang, Warden of Ice, keeper of the patient breath. I composed eleven verses about my rescue. None of them featured a firefly.' },
      { who: 'flick', text: 'Rude.' },
      { who: 'aster', text: 'Emberhold is waiting at the Sanctum. We came to bring you home.' },
      { who: 'frostfang', text: 'Then first, a gift. Ice is not anger, and it is not speed. Ice is stillness, made sharp.' },
      { who: 'frostfang', text: 'Breathe slowly, young one. Let the cold remember for you. Freeze your foes, then shatter them with a heavy blow.' },
    ],
  });
}

// ---------------------------------------------------------------------------
// Side areas, finds and dressing
// ---------------------------------------------------------------------------

/**
 * The ice-cutters' camp on the west shore, reached by a rope bridge from the
 * Frost Hollow's islet. Cutters sawed the lake into blocks for the forge's
 * cold stores; a Gloom patrol has moved in around their fire. The egg they
 * found is shut in the ice-house.
 */
function cuttersCamp(b: Builder): void {
  const g = b.game;
  const { x: cx, z: cz, y } = CAMP;
  b.bridge(-16.2, 48.3, b.y(-16.2, 48.3), -27.6, 54.4, y, 3);
  lamp(b, -15.4, b.col.terrainAt(-15.4, 49.6), 49.6, -1.2);
  lamp(b, -28.2, b.col.terrainAt(-28.2, 52.8), 52.8, 1.9);
  b.story('camp', -18, 49, 3, () => g.hud.flick('A camp over on the shore! Ice-cutters... and those are NOT ice-cutters around the fire.', 6));

  // The ice-house against the slope, sealed with a wall of ice.
  const hx = -37.4;
  const hz = 58.6;
  iceHouse(b, hx, hz, y, 3.4, 3.2, 2.8, Math.PI / 2);
  b.egg('camp', hx - 0.5, hz, y);
  b.story('icehouse', hx + 4, hz, 3, () => g.hud.flick('Something\'s glowing inside that ice-house. The door is solid ice... you know what melts ice!', 6));

  // Hide tents, the fire, and what the Gloom have been sitting on.
  hideTent(b, -35.4, 53.2, y, 0.4);
  hideTent(b, -34.6, 63.2, y, -0.5);
  campfire(b, -32.2, 58.2, y);
  for (const [x, z, yaw] of [[-30.4, 56.6, 0.3], [-30.8, 60, -0.4], [-33.8, 56.1, 1.3]] as const) log(b, x, z, y, yaw);
  b.enemy('grunt', -31.2, 57.4, -Math.PI / 2);
  b.enemy('grunt', -33.6, 60.6, -Math.PI / 2);
  b.enemy('sapper', -36.8, 55.4, Math.PI / 2);
  // A Rime Drake keeps the cutters' camp.
  b.enemy('frostDrake', -31, 51.5, -Math.PI / 2);
  // The camp's Superflame shrine, and an iron-bound chest the cutters could never open.
  b.powerShrine('camp', 'superflame', -33, 60, Math.PI / 2, 14);
  b.ironChest('camp', -24, 52, -Math.PI / 2, { blue: 30, red: 4, purple: 1 });
  b.breakables('keg', [[-30.2, 58.4], [-34.4, 57.2]]);
  b.pile(-36.6, 61.8, 0.9, 3, ['barrel', 'crate', 'basket']);
  b.pile(-28.8, 63.4, 0.9, 4, ['crate', 'barrel', 'crate', 'urn']);
  b.breakables('basket', [[-33.2, 53.6], [-31.6, 63.8]]);
  b.chest('cutters', -37.8, 54.4, Math.PI / 2 + 0.3, { blue: 25, red: 2 }, b.col.terrainAt(-37.8, 54.4));

  // The trade itself: sawn blocks, a loaded sledge, the long saw.
  iceStack(b, -29.2, 60.6, y);
  sledge(b, -30.4, 54.2, y, 0.5, true);
  put(b, GEO.box(), mat(IRON, { rough: 0.5, metal: 0.5 }), -28.1, y + 0.9, 59.1, 0.05, 0.28, 2.6, 0.9, 0.2, 0);
  put(b, GEO.box(), woodM(), -28.1, y + 1.95, 58.5, 0.1, 0.1, 0.6, 0.9, 0.2, 0);
  fishRack(b, -27.8, 56.8, y, 0.2);
  b.letter('cutter', -28.6, 61.8, y);
  lamp(b, -35, y, 61.1, Math.PI / 2);

  b.scatter(12, cx, cz, 13, (x, z) => b.tree(x, z, 0.9 + Math.abs(jitter(x * 2 + z)) * 0.5, 'snowPine', { leaf: 0x2c5446 }),
    (x, z, gy) => Math.hypot(x - cx, z - cz) > 7.5 && gy > 2.8 && x < -30);
  // Rocks only where the slope is gentle enough for them to sit, not hang.
  const gentle = (x: number, z: number) => Math.abs(b.col.terrainAt(x + 0.8, z) - b.col.terrainAt(x - 0.8, z)) + Math.abs(b.col.terrainAt(x, z + 0.8) - b.col.terrainAt(x, z - 0.8)) < 1.6;
  b.scatter(10, cx, cz, 11, (x, z) => snowRock(b, x, z, 0.5 + Math.abs(jitter(x - z)) * 0.6), (x, z, gy) => Math.hypot(x - cx, z - cz) > 7 && gy > 1 && gentle(x, z));
  b.scatter(16, cx, cz, 7, (x, z, gy) => b.decor.grass(x, gy, z, 0.8, 0x9aa89a), (_x, _z, gy) => gy > 2);
  b.crystal(-38.6, 63.4, 'blue', 10);
}

/**
 * The old harvest cellar, cut into the west slope beside the Lower Works:
 * what the Frostworks was built for, before the chains. A barricade seals
 * it; a rime golem minds the stores; the egg sits on the top shelf at the back.
 */
function harvestCellar(b: Builder): void {
  const g = b.game;
  const { x0, x1, z, y } = CELLAR;
  const h = 4.4;
  const z0 = z - 3.4;
  const z1 = z + 3.4;
  // Facade, walls, roof.
  sbox(b, x1, y - 0.5, (z0 - 0.8 + z - 1.6) / 2, 1, h + 0.5, z - 1.6 - z0 + 0.8, STONE);
  sbox(b, x1, y - 0.5, (z + 1.6 + z1 + 0.8) / 2, 1, h + 0.5, z1 + 0.8 - z - 1.6, STONE);
  sbox(b, x1, y + 3.3, z, 1, h - 3.3, 3.2, STONE_DARK);
  for (const sd of [-1, 1]) {
    sbox(b, (x0 + x1) / 2, y - 0.5, z + sd * 3.6, x1 - x0, h + 0.5, 0.6, STONE);
    put(b, GEO.box(), woodM(), x1 + 0.6, y + 1.65, z + sd * 1.75, 0.3, 3.3, 0.3);
  }
  put(b, GEO.box(), woodM(), x1 + 0.6, y + 3.4, z, 0.35, 0.3, 3.9);
  sbox(b, x0 - 0.3, y - 0.5, z, 0.6, h + 0.5, z1 - z0 + 0.8, STONE);
  sbox(b, (x0 + x1) / 2 - 0.1, y + h, z, x1 - x0 + 1.6, 0.6, z1 - z0 + 2, STONE_DARK);
  put(b, GEO.box(), mat(SNOW, { rough: 0.9, flat: true }), (x0 + x1) / 2 - 0.1, y + h + 0.66, z, x1 - x0 + 1.2, 0.2, z1 - z0 + 1.6, 0, 0, 0, false);
  icicles(b, x1 + 0.55, z0 - 0.4, x1 + 0.55, z1 + 0.4, y + h, 10);
  // A sign over the door, lanterns either side, drifts round the doorway.
  put(b, GEO.box(), woodM(), x1 + 0.62, y + 3.9, z, 0.08, 0.55, 2.2);
  put(b, GEO.box(), mat(0xd84a3a, { rough: 0.6, emissive: 0xd84a3a, emissiveIntensity: 0.2 }), x1 + 0.68, y + 3.9, z, 0.04, 0.3, 0.3, Math.PI / 4, 0, 0, false);
  for (const sd of [-1, 1]) {
    lamp(b, x1 + 1.3, y, z + sd * 2.6, Math.PI / 2);
    put(b, GEO.blob(), mat(SNOW, { rough: 0.9, flat: true }), x1 + 1.0, y - 0.1, z + sd * 3.7, 1.4, 0.7, 1.2, 0, sd, 0);
    snowRock(b, x1 + 2.6, z + sd * 4.4, 0.9);
  }
  put(b, GEO.blob(), mat(SNOW, { rough: 0.9, flat: true }), (x0 + x1) / 2 + 2, y + h + 0.7, z + 1.5, 2.6, 0.5, 2.2, 0, 0.4, 0, false);
  b.gate(x1 + 0.1, z, 3.2, 3.3, Math.PI / 2, 'wood', '', y);
  b.story('cellar', x1 + 5, z, 3.5, () => {
    g.hud.flick('A door into the hillside, boarded up. Charge it, or give it some fire!', 6);
  });

  // Shelves of preserves down both sides.
  for (const sd of [-1, 1]) {
    for (const sy of [1.1, 2.3]) sbox(b, (x0 + x1) / 2 - 0.3, y + sy - 0.1, z + sd * 2.95, x1 - x0 - 1.6, 0.1, 0.7, PLANK_DARK, 0, 'wood');
    for (let x = x0 + 0.8; x < x1 - 0.8; x += 2.6) put(b, GEO.box(), woodM(PLANK_DARK), x, y, z + sd * 3.2, 0.12, 2.5, 0.12);
    for (let i = 0; i < 3; i++) jar(b, x0 + 1.3 + i * 3.6, y + 1.1, z + sd * 2.95, i + (sd > 0 ? 7 : 0));
  }
  b.breakables('urn', [[x0 + 2.4, z - 2.9], [x0 + 6, z + 2.9], [x0 + 7.8, z - 2.9]], { y: y + 2.3, scale: 0.7 });
  b.breakables('basket', [[x0 + 3.1, z + 2.9], [x0 + 6.7, z - 2.9]], { y: y + 1.1, scale: 0.8 });
  // Frozen harvest crates up the back, climbable to the top shelf.
  frozenCrate(b, x0 + 1.4, y, z + 1.4, 0, 1.5);
  frozenCrate(b, x0 + 1.0, y, z - 0.1, 1, 2.6);
  sbox(b, x0 + 0.4, y + 2.4, z - 1.8, 0.8, 0.12, 2.0, PLANK_DARK, 0, 'wood');
  b.egg('cellar', x0 + 0.45, z - 1.8, y + 2.52);
  b.chest('keeper', x0 + 1.2, z - 2.4, Math.PI / 2, { blue: 25, red: 2 }, y);
  // Inside, under the roof: heights are passed, or b.y would find the roof.
  b.breakables('barrel', [[x1 - 2.6, z + 2.2], [x1 - 1.5, z + 2.5]], { y });
  b.breakables('crate', [[x1 - 2.4, z - 2.3], [x0 + 4.6, z - 2.2], [x1 - 3.6, z + 2.4]], { y });
  b.letter('keeper', x1 - 1.6, z - 0.9, y);
  for (const x of [x0 + 2.5, x0 + 7]) {
    put(b, GEO.cyl6(), mat(IRON, { rough: 0.6, metal: 0.3 }), x, y + h - 0.9, z, 0.03, 0.9, 0.03, 0, 0, 0, false);
    put(b, GEO.blobLow(), glow(0xffc070), x, y + h - 1.1, z, 0.18, 0.24, 0.18, 0, 0, 0, false);
  }
  for (const [x, zz, ry] of [[x0 + 3, z + 3.25, 0], [x0 + 8.4, z - 3.25, 0], [x0 + 0.05, z + 2.2, Math.PI / 2]] as const) {
    put(b, GEO.box(), iceMat(), x, y + 2.8, zz, 1.4, 1.2, 0.08, 0, ry, 0, false);
  }
  b.enemy('frostGolem', x0 + 5, z, Math.PI / 2, y);
  b.gemLine([[-20.5, z], [x1 + 3.5, z]], 'blue', 2);
}

/** A sawn ice block on a berg in the lake, with an egg frozen inside. */
function frozenBerg(b: Builder): void {
  const g = b.game;
  const { x, z, top } = BERG;
  const ice = mat(0xd8f0fb, { rough: 0.2, metal: 0.05, flat: true });
  b.col.add(makeCyl(x, z, 2.3, -3, top)).surface = 'ice';
  put(b, GEO.cyl6(), ice, x, -1.2, z, 2.4, top + 1.2, 2.4, 0, 0.4, 0);
  put(b, GEO.rock(), ice, x + 0.6, top - 0.5, z - 0.4, 2.5, 0.6, 2.2, 0.1, 1.2, 0);
  put(b, GEO.rock(), ice, x - 1.2, -0.2, z + 1.4, 1.6, 0.8, 1.3, 0.2, 0.5, 0);
  iceHouse(b, x + 0.5, z, top, 1.6, 1.6, 2.1, -Math.PI / 2 + 0.35, true);
  b.egg('berg', x + 0.5, z, top);
  b.story('berg', 1.5, 74.8, 2.2, () => g.hud.flick('An egg, frozen into that berg! Melt the ice... and don\'t dawdle on the floes!', 6));
}

/** The iron post in the gear pit: an egg on its cap, a glide down from the Upper Works. */
function supportEgg(b: Builder): void {
  const g = b.game;
  const { x, z, top } = SUPPORT;
  const s = b.box(x, top - 0.6, z, 3, 0.6, 3, IRON, { noMesh: true, surface: 'metal' });
  // No respawning out here: a fall sends you back up to where you jumped.
  s.unsafe = true;
  b.egg('post', x, z, top);
  for (let i = 1; i <= 3; i++) {
    const t = i / 4;
    g.placeGem('blue', 1, -7.6 + (x + 7.6) * t, 13.2 - t * 3, 204 + (z - 204) * t);
  }
  // Flick spots it from the drafting-room roof, the best view of the pit.
  let told = false;
  b.level.props.push({
    update: () => {
      const p = g.player;
      if (told || !p.body.grounded || p.y < TOP + 4 || Math.hypot(p.x + 6, p.z - 210) > 6) return;
      told = true;
      g.hud.flick('From up here you can see down into the gear pit: another egg, on that iron post! Glide down, and let go right over it.', 7);
    },
  });
}

/** Crates stacked as steps up the drafting room, and an egg on its snowy roof. */
function draftingRoof(b: Builder): void {
  const g = b.game;
  const y = TOP;
  const sz = 215.6;
  for (const [x, w, hh, d, yaw] of [[-8.5, 1.4, 2.1, 1.5, 0.1], [-6.7, 1.5, 3.8, 1.5, -0.05]] as const) {
    sbox(b, x, y - 0.2, sz, w, hh, d, 0x6a5238, yaw, 'wood');
    put(b, GEO.box(), mat(IRON, { rough: 0.5, metal: 0.35 }), x, y - 0.2 + hh - 0.3, sz, w + 0.06, 0.12, d + 0.06, 0, yaw, 0, false);
    put(b, GEO.box(), mat(SNOW, { rough: 0.9, flat: true }), x, y - 0.2 + hh + 0.04, sz, w - 0.1, 0.08, d - 0.1, 0, yaw, 0, false);
  }
  b.egg('roof', -6.2, 210.4, y + 5.1);
  b.story('roof', -8.6, 217.4, 2.2, () => g.hud.flick('Is that an egg up on the drafting room roof? Those crates make a handy staircase.', 6));
}

/**
 * Lived-in touches along the main route: a waystation at the landing, a
 * Gloom supply sled in the Hollow, stores round the Lower Works kilns,
 * cargo on the gear docks and powder by the Upper Works anvil.
 */
function dressFrost(b: Builder): void {
  // Landing: a snowman, a broken sled and lanterns up the path.
  snowman(b, 5.6, -4.2, b.y(5.6, -4.2), -0.5);
  sledge(b, -7.4, 1.2, b.y(-7.4, 1.2), 2.4, false);
  b.pile(-8.6, -0.8, 0.9, 3, ['crate', 'barrel', 'basket']);
  for (const [x, z, yaw] of [[-3, 5.5, Math.PI / 2], [3, 10.5, -Math.PI / 2], [-3, 15, Math.PI / 2]] as const) lamp(b, x, b.y(x, z), z, yaw);
  signpost(b, 3.4, 1.2, b.y(3.4, 1.2), 0.2);
  // Frost Hollow: the Gloom's supply sled, with powder by the golem.
  sledge(b, 7.8, 42.4, b.y(7.8, 42.4), -0.4, false);
  b.breakables('keg', [[3.6, 46.4], [4.6, 47.4]]);
  b.pile(9.6, 40.6, 0.8, 3, ['crate', 'crate', 'barrel']);
  // Lower Works: stores by the kilns, and a keg or two in the yard.
  b.pile(-16.4, 88.8, 0.9, 3, ['crate', 'barrel', 'basket']);
  b.breakables('barrel', [[16.6, 93.4], [17.4, 94.6]]);
  b.breakables('keg', [[-9.8, 97.4], [5.8, 101.6]]);
  b.letter('quota', 6.6, 92.8);
  // Gear docks.
  b.pile(-8.4, 186.6, 0.6, 2, ['crate', 'barrel']);
  // Upper Works: finished chain crated for shipping, powder by the anvil.
  b.pile(15.6, 206.4, 0.9, 3, ['crate', 'crate', 'barrel']);
  b.breakables('keg', [[3.2, 213.6], [12.6, 214.6]]);
  b.breakables('crate', [[1.2, 205.2], [24.4, 213.6]]);
  b.letter('apprentice', 1.8, 218.6);
}

// ---------------------------------------------------------------------------
// Local builders for the side areas: solids drawn as merged statics, small
// props made of instanced or merged parts.
// ---------------------------------------------------------------------------

const PLANK = 0x7a5a3a;
const PLANK_DARK = 0x5a4a3a;
const HIDE = 0x8a7458;

const stoneM = (c: number) => mat(c, { rough: 0.9, flat: true });
const woodM = (c = PLANK) => mat(c, { rough: 0.95 });
const cutIce = () => mat(0xd8f2fc, { rough: 0.1, metal: 0.05, emissive: 0x4a9ac8, emissiveIntensity: 0.2, flat: true, transparent: true, opacity: 0.75 });

/**
 * A piece of static scenery. Unlike instanced decor (one draw for the whole
 * level, so always drawn), these merge per material in 24 m chunks at the
 * end of the build and are culled with their area.
 */
function put(b: Builder, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number,
  sx: number, sy: number, sz: number, rx = 0, ry = 0, rz = 0, cast = true): void {
  const mesh = new THREE.Mesh(geo.clone(), m);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  b.addStatic(mesh);
}

/** The same, but instanced: for small props repeated all along the route (one draw for all of them). */
function dec(b: Builder, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number,
  sx: number, sy: number, sz: number, rx = 0, ry = 0, rz = 0, cast = true): void {
  b.decor.add(geo, m, x, y, z, sx, sy, sz, rx, ry, rz, cast);
}

/** A solid box drawn as a merged static. */
function sbox(b: Builder, x: number, y0: number, z: number, w: number, h: number, d: number, color: number, yaw = 0, surface: Surface = 'stone'): Solid {
  const s = b.box(x, y0, z, w, h, d, color, { yaw, surface, noMesh: true });
  put(b, GEO.box(), surface === 'wood' ? woodM(color) : stoneM(color), x, y0 + h / 2, z, w, h, d, 0, yaw, 0);
  return s;
}

/** A lantern on a post, its arm reaching along yaw. */
function lamp(b: Builder, x: number, y: number, z: number, yaw = 0, color = 0xffc070): void {
  const post = woodM(PLANK_DARK);
  const ax = Math.sin(yaw);
  const az = Math.cos(yaw);
  dec(b, GEO.cyl6(), post, x, y, z, 0.07, 2.2, 0.07);
  dec(b, GEO.box(), post, x + ax * 0.25, y + 2.15, z + az * 0.25, 0.06, 0.06, 0.55, 0, yaw, 0);
  dec(b, GEO.blobLow(), glow(color), x + ax * 0.45, y + 1.9, z + az * 0.45, 0.14, 0.2, 0.14, 0, 0, 0, false);
  dec(b, GEO.cap(), mat(SNOW, { rough: 0.9, flat: true }), x + ax * 0.25, y + 2.18, z + az * 0.25, 0.12, 0.05, 0.3, 0, yaw, 0, false);
}

/**
 * A little house of sawn ice blocks with its door (local +z, turned by yaw)
 * sealed by an ice gate. `small` makes a single block-cairn with a slab roof.
 */
function iceHouse(b: Builder, cx: number, cz: number, y: number, w: number, d: number, h: number, yaw: number, small = false): void {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const L = (lx: number, lz: number): [number, number] => [cx + lx * c + lz * s, cz - lx * s + lz * c];
  const t = small ? 0.35 : 0.5;
  const door = small ? 1.1 : 1.6;
  const ice = cutIce();
  const wall = (lx: number, lz: number, ww: number, dd: number, hh = h, y0 = y) => {
    const [px, pz] = L(lx, lz);
    b.box(px, y0 - 0.3, pz, ww, hh + 0.3, dd, 0xd8f2fc, { yaw, surface: 'ice', noMesh: true });
    // Courses of blocks rather than one slab.
    const rows = Math.max(1, Math.round(hh / 0.7));
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * 0.12;
      put(b, GEO.box(), ice, px + c * off, y0 + (r + 0.5) * (hh / rows), pz - s * off, ww - 0.04, hh / rows - 0.05, dd - 0.02, 0, yaw, 0);
    }
  };
  wall(0, -d / 2, w + t, t);
  for (const sd of [-1, 1]) {
    wall(sd * w / 2, 0, t, d);
    wall(sd * (door / 2 + (w - door) / 4), d / 2, (w - door) / 2, t);
  }
  wall(0, d / 2, door, t, h - (small ? 1.7 : 2.3), y + (small ? 1.7 : 2.3));
  const [rx, rz] = L(0, 0);
  b.box(rx, y + h, rz, w + 0.8, 0.4, d + 0.8, 0xd8f2fc, { yaw, surface: 'ice', noMesh: true });
  put(b, GEO.box(), ice, rx, y + h + 0.2, rz, w + 0.8, 0.4, d + 0.8, 0, yaw, 0);
  put(b, GEO.box(), mat(SNOW, { rough: 0.9, flat: true }), rx, y + h + 0.45, rz, w + 0.6, 0.14, d + 0.6, 0, yaw, 0, false);
  const [gx, gz] = L(0, d / 2);
  b.gate(gx, gz, door, small ? 1.7 : 2.3, yaw, 'ice', '', y);
  icicles(b, ...L(-(w + 0.8) / 2, d / 2 + 0.4), ...L((w + 0.8) / 2, d / 2 + 0.4), y + h, small ? 4 : 7);
}

/** A cone tent of stitched hides on a pole frame. */
function hideTent(b: Builder, x: number, z: number, y: number, yaw: number): void {
  b.box(x, y, z, 2.4, 2.2, 2.4, HIDE, { noMesh: true, yaw });
  put(b, GEO.cone(), mat(HIDE, { rough: 1, flat: true }), x, y, z, 1.8, 2.8, 1.8, 0, yaw, 0);
  put(b, GEO.cone(), mat(SNOW, { rough: 0.9, flat: true }), x, y + 1.9, z, 0.62, 0.9, 0.62, 0, yaw, 0, false);
  for (let i = 0; i < 3; i++) {
    const a = yaw + (i / 3) * Math.PI * 2;
    put(b, GEO.cyl6(), woodM(PLANK_DARK), x + Math.sin(a) * 0.12, y + 2.5, z + Math.cos(a) * 0.12, 0.04, 0.8, 0.04, Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3, false);
  }
  put(b, GEO.box(), mat(0x3a2e24, { rough: 1 }), x + Math.sin(yaw) * 1.25, y + 0.5, z + Math.cos(yaw) * 1.25, 0.7, 1.0, 0.05, -0.55, yaw, 0, false);
}

function campfire(b: Builder, x: number, z: number, y: number): void {
  const stone = stoneM(STONE_DARK);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    put(b, GEO.rock(), stone, x + Math.sin(a) * 0.7, y + 0.08, z + Math.cos(a) * 0.7, 0.22, 0.16, 0.22, 0, a, 0, false);
  }
  for (let i = 0; i < 3; i++) put(b, GEO.cyl6(), woodM(PLANK_DARK), x, y + 0.12, z, 0.07, 0.9, 0.07, Math.PI / 2, i * 2.1, 0, false);
  put(b, GEO.cone(), glow(0xff8a2a), x, y + 0.1, z, 0.28, 0.75, 0.28, 0, 0, 0, false);
  put(b, GEO.cone(), glow(0xffe0a0), x, y + 0.1, z, 0.13, 0.42, 0.13, 0, 0.4, 0, false);
  b.level.props.push(new Smoker(b.game, x, y + 1.2, z, 0.35));
}

/** A log bench. */
function log(b: Builder, x: number, z: number, y: number, yaw: number): void {
  put(b, GEO.cyl6(), woodM(PLANK), x, y + 0.25, z, 0.25, 1.6, 0.25, Math.PI / 2, yaw, 0);
  put(b, GEO.cap(), mat(SNOW, { rough: 0.9, flat: true }), x, y + 0.48, z, 0.2, 0.06, 0.7, 0, yaw, 0, false);
}

/** Sawn blocks of lake ice stacked for the sledge. */
function iceStack(b: Builder, x: number, z: number, y: number): void {
  const ice = cutIce();
  b.box(x, y, z, 2.6, 1.6, 1.8, 0xd8f2fc, { noMesh: true, surface: 'ice' });
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 3 - r; i++) {
      for (let k = 0; k < 2; k++) {
        put(b, GEO.box(), ice, x - 0.85 + i * 0.85 + r * 0.42, y + 0.4 + r * 0.8, z - 0.45 + k * 0.9, 0.8, 0.76, 0.86, 0, jitter(i + k + r * 3, 2) * 0.06, 0);
      }
    }
  }
}

/** A cutters' sledge on runners, loaded with ice or broken down and empty. */
function sledge(b: Builder, x: number, z: number, y: number, yaw: number, loaded: boolean): void {
  const wood = woodM(PLANK);
  const iron = mat(IRON, { rough: 0.5, metal: 0.4 });
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  b.box(x, y, z, 1.4, loaded ? 1.5 : 0.7, 2.8, PLANK, { yaw, noMesh: true, surface: 'wood' });
  dec(b, GEO.box(), wood, x, y + 0.55, z, 1.4, 0.12, 2.6, 0, yaw, 0);
  for (const sd of [-1, 1]) {
    dec(b, GEO.box(), iron, x + rx * sd * 0.6, y + 0.08, z + rz * sd * 0.6, 0.08, 0.1, 3.0, 0, yaw, 0);
    dec(b, GEO.box(), iron, x + rx * sd * 0.6 + fx * 1.55, y + 0.25, z + rz * sd * 0.6 + fz * 1.55, 0.08, 0.1, 0.5, -0.8, yaw, 0);
    for (const t of [-0.9, 0.9]) dec(b, GEO.box(), wood, x + rx * sd * 0.6 + fx * t, y + 0.3, z + rz * sd * 0.6 + fz * t, 0.1, 0.45, 0.1, 0, yaw, 0);
  }
  if (loaded) {
    const ice = cutIce();
    for (let i = 0; i < 3; i++) dec(b, GEO.box(), ice, x + rx * (i % 2 ? 0.3 : -0.3), y + 0.95, z + fz * (i - 1) * 0.8 + rz * 0, 0.6, 0.7, 0.7, 0, yaw + i * 0.1, 0);
    dec(b, GEO.cyl6(), mat(0xc8b080, { rough: 1 }), x, y + 1.32, z, 0.03, 2.4, 0.03, Math.PI / 2, yaw, 0, false);
  } else {
    dec(b, GEO.box(), wood, x + fx * 0.4, y + 0.75, z + fz * 0.4, 1.2, 0.3, 0.9, 0.2, yaw, 0.1);
  }
}

/** A drying rack with the day's catch. */
function fishRack(b: Builder, x: number, z: number, y: number, yaw: number): void {
  const ox = Math.cos(yaw);
  const oz = -Math.sin(yaw);
  for (const sd of [-1, 1]) put(b, GEO.cyl6(), woodM(PLANK_DARK), x + ox * 1.1 * sd, y, z + oz * 1.1 * sd, 0.07, 1.8, 0.07);
  put(b, GEO.box(), woodM(PLANK_DARK), x, y + 1.75, z, 2.4, 0.07, 0.07, 0, yaw, 0);
  for (let i = 0; i < 5; i++) {
    const t = (i - 2) * 0.4;
    put(b, GEO.blobLow(), mat(0x9ab0b8, { rough: 0.4, metal: 0.4 }), x + ox * t, y + 1.45, z + oz * t, 0.07, 0.26, 0.04, 0, yaw + Math.PI / 2, 0, false);
  }
}

/** A glass jar of preserves on a shelf. */
function jar(b: Builder, x: number, y: number, z: number, i: number): void {
  const fruit = [0xd84a3a, 0xf0b040, 0x8ac050][i % 3]!;
  put(b, GEO.cyl(), mat(fruit, { rough: 0.6, emissive: fruit, emissiveIntensity: 0.2 }), x, y, z, 0.17, 0.36, 0.17, 0, 0, 0, false);
  put(b, GEO.cyl(), woodM(PLANK_DARK), x, y + 0.36, z, 0.19, 0.06, 0.19, 0, 0, 0, false);
}

/** A crate of harvest frozen in a block of ice, at an explicit height. */
function frozenCrate(b: Builder, x: number, y: number, z: number, i: number, h: number): void {
  b.box(x, y - 0.2, z, 1.4, h + 0.2, 1.4, 0x6a5238, { yaw: i * 0.3, surface: 'ice', noMesh: true });
  put(b, GEO.box(), woodM(0x6a5238), x, y + (h * 0.55) / 2 - 0.1, z, 1.4, h * 0.55 + 0.2, 1.4, 0, i * 0.3, 0);
  put(b, GEO.box(), cutIce(), x, y + h * 0.55 + (h * 0.45) / 2, z, 1.3, h * 0.45, 1.3, 0, i * 0.3, 0);
  const fruit = [0xd84a3a, 0xf0b040, 0x8ac050][i % 3]!;
  put(b, GEO.blobLow(), mat(fruit, { rough: 0.6, emissive: fruit, emissiveIntensity: 0.2 }), x, y + h * 0.78, z, 0.3, 0.3, 0.3, 0, 0, 0, false);
}

/** A snowman: three balls, coal eyes, a carrot and a forge-apprentice's scarf. */
function snowman(b: Builder, x: number, z: number, y: number, yaw: number): void {
  const snow = mat(SNOW, { rough: 0.9, flat: true });
  b.col.add(makeCyl(x, z, 0.7, y - 0.5, y + 2.1));
  dec(b, GEO.blob(), snow, x, y + 0.55, z, 0.75, 0.65, 0.75);
  dec(b, GEO.blob(), snow, x, y + 1.35, z, 0.52, 0.48, 0.52);
  dec(b, GEO.blob(), snow, x, y + 1.95, z, 0.36, 0.34, 0.36);
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  for (const sd of [-1, 1]) dec(b, GEO.blobLow(), mat(0x1a1a20, { rough: 0.8 }), x + fx * 0.32 + rx * sd * 0.13, y + 2.05, z + fz * 0.32 + rz * sd * 0.13, 0.05, 0.05, 0.05, 0, 0, 0, false);
  dec(b, GEO.cone(), mat(0xe87a2a, { rough: 0.7 }), x + fx * 0.3, y + 1.95, z + fz * 0.3, 0.06, 0.4, 0.06, Math.PI / 2, yaw, 0, false);
  dec(b, GEO.cyl(), mat(0xb03a3a, { rough: 0.9 }), x, y + 1.66, z, 0.42, 0.12, 0.42, 0, 0, 0, false);
  dec(b, GEO.box(), mat(0xb03a3a, { rough: 0.9 }), x + rx * 0.3 + fx * 0.3, y + 1.35, z + rz * 0.3 + fz * 0.3, 0.12, 0.5, 0.05, 0.2, yaw, 0.1, false);
  for (const sd of [-1, 1]) dec(b, GEO.cyl6(), woodM(PLANK_DARK), x + rx * sd * 0.5, y + 1.35, z + rz * sd * 0.5, 0.03, 0.7, 0.03, 0, yaw, sd * 1.0, false);
}

/** A signpost with two arms, capped with snow. */
function signpost(b: Builder, x: number, z: number, y: number, yaw: number): void {
  dec(b, GEO.cyl6(), woodM(PLANK_DARK), x, y, z, 0.08, 1.9, 0.08);
  dec(b, GEO.box(), woodM(), x + Math.sin(yaw) * 0.35, y + 1.65, z + Math.cos(yaw) * 0.35, 0.05, 0.26, 0.9, 0, yaw, 0);
  dec(b, GEO.box(), woodM(), x - Math.sin(yaw + 0.5) * 0.3, y + 1.3, z - Math.cos(yaw + 0.5) * 0.3, 0.05, 0.22, 0.75, 0, yaw + 0.5, 0);
  dec(b, GEO.box(), mat(SNOW, { rough: 0.9, flat: true }), x + Math.sin(yaw) * 0.35, y + 1.8, z + Math.cos(yaw) * 0.35, 0.08, 0.05, 0.9, 0, yaw, 0, false);
}

// ---------------------------------------------------------------------------
// Moving parts
// ---------------------------------------------------------------------------

/** Builds a toothed iron gear mesh lying flat, top at y = 0. */
function gearMesh(r: number, thick: number, color: number): THREE.Group {
  const root = new THREE.Group();
  const iron = mat(color, { rough: 0.55, metal: 0.35, flat: true });
  const dark = mat(0x2a2c32, { rough: 0.7, metal: 0.3, flat: true });
  const brass = mat(BRASS, { rough: 0.45, metal: 0.4 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, thick, 28), iron);
  disc.position.y = -thick / 2;
  disc.castShadow = disc.receiveShadow = true;
  root.add(disc);
  const n = Math.max(12, Math.round(r * 4.2));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.62, thick * 0.9, 0.7), iron);
    t.position.set(Math.sin(a) * (r + 0.28), -thick / 2, Math.cos(a) * (r + 0.28));
    t.rotation.y = a;
    root.add(t);
  }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r - 0.35, 0.12, 5, 28), brass);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.02;
  root.add(rim);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.2, 0.05, 10), dark);
    hole.position.set(Math.sin(a) * r * 0.55, 0.01, Math.cos(a) * r * 0.55);
    root.add(hole);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.26, 0.2, 10), glow(0xff8a30));
  hub.position.y = 0.05;
  root.add(hub);
  return root;
}

/**
 * A great flat gear turning on its axle; the dragon rides it round. With a
 * beam it becomes a lever whose ends sweep past distant ledges.
 */
class Gear implements Prop {
  private hub: Solid;
  private beam: Solid | null = null;
  private root = new THREE.Group();
  private yaw = 0;

  constructor(b: Builder, readonly x: number, readonly top: number, readonly z: number, readonly r: number, readonly spin: number,
    beamHalf = 0, beamW = 2.6) {
    this.hub = makeCyl(x, z, r, top - 0.8, top);
    this.hub.dynamic = true;
    this.hub.surface = 'metal';
    b.col.add(this.hub);
    this.root.add(gearMesh(r, 0.8, 0x5a5e68));
    if (beamHalf > 0) {
      this.beam = makeBox(x, z, beamW / 2, beamHalf, top - 0.5, top, 0);
      this.beam.dynamic = true;
      this.beam.surface = 'metal';
      b.col.add(this.beam);
      const iron = mat(0x4a4e58, { rough: 0.55, metal: 0.35, flat: true });
      const m = new THREE.Mesh(new THREE.BoxGeometry(beamW, 0.5, beamHalf * 2), iron);
      m.position.y = -0.25 + 0.01;
      m.castShadow = m.receiveShadow = true;
      this.root.add(m);
      for (const sx of [-1, 1]) {
        const trim = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, beamHalf * 2), glow(0xf5c46b, 0.85));
        trim.position.set(sx * beamW * 0.5, -0.2, 0);
        this.root.add(trim);
      }
      for (const sz of [-1, 1]) {
        const cap = new THREE.Mesh(new THREE.BoxGeometry(beamW + 0.3, 0.7, 0.5), mat(BRASS, { rough: 0.45, metal: 0.4 }));
        cap.position.set(0, -0.3, sz * (beamHalf - 0.25));
        this.root.add(cap);
      }
    }
    // Axle into the water below.
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, top + 4, 8), mat(IRON, { rough: 0.6, metal: 0.3 }));
    axle.position.set(x, (top - 0.8 - 4) / 2 - 0.2, z);
    b.addStatic(axle);
    this.root.position.set(x, top, z);
    mergeStatic(this.root);
    this.root.userData.fogCull = true;
    b.level.root.add(this.root);
  }

  update(dt: number): void {
    const d = this.spin * dt;
    this.yaw += d;
    for (const s of [this.hub, this.beam]) {
      if (!s) continue;
      s.dx = s.dy = s.dz = 0;
      s.setYaw(this.yaw);
      s.dyaw = d;
    }
    this.root.rotation.y = this.yaw;
  }
}

/** A stone column that rises out of the melt when its signal fires, and stays up. */
class Piston implements Prop {
  private game: Game;
  private solid: Solid;
  private mesh: THREE.Group;
  private active = false;
  private cur: number;
  private readonly tall = 5;

  constructor(b: Builder, private x: number, private z: number, w: number, d: number, low: number, private top: number, signal: string, private speed = 1.8) {
    this.game = b.game;
    this.cur = low;
    this.solid = makeBox(x, z, w / 2, d / 2, low - this.tall, low);
    this.solid.dynamic = true;
    b.col.add(this.solid);
    this.mesh = new THREE.Group();
    const col = new THREE.Mesh(new THREE.BoxGeometry(w, this.tall, d), mat(SLAB, { rough: 0.9, flat: true }));
    col.position.y = -this.tall / 2;
    col.castShadow = col.receiveShadow = true;
    this.mesh.add(col);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.15, 0.2, d + 0.15), mat(BRASS, { rough: 0.45, metal: 0.4 }));
    cap.position.y = -0.1;
    this.mesh.add(cap);
    for (const sy of [-1.2, -2.6]) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.25, d + 0.1), glow(0xff8a30));
      band.position.y = sy;
      this.mesh.add(band);
    }
    this.mesh.position.set(x, low, z);
    mergeStatic(this.mesh);
    b.level.root.add(this.mesh);
    b.level.on(signal, () => (this.active = true));
  }

  update(dt: number): void {
    const s = this.solid;
    s.dx = s.dy = s.dz = s.dyaw = 0;
    if (!this.active || this.cur >= this.top) return;
    const ny = Math.min(this.top, this.cur + this.speed * dt);
    s.dy = ny - this.cur;
    this.cur = ny;
    s.y1 = ny;
    s.y0 = ny - this.tall;
    this.mesh.position.y = ny;
    if (rng.chance(0.4)) this.game.fx.emit(this.x + rng.signed() * 1.6, 1.5, this.z + rng.signed() * 1.6, { count: 1, speed: 2, dir: [0, 1, 0], life: [0.4, 0.8], size: [0.2, 0.35], color: 0xffa040, bright: 2, gravity: 4 });
  }
}

/** A floe of lake ice that cracks and sinks a moment after you land on it. */
class IceFloe implements Prop {
  private game: Game;
  private solid: Solid;
  private mesh: THREE.Group;
  private m: THREE.MeshStandardMaterial;
  private timer = -1;
  private down = 0;

  constructor(b: Builder, private x: number, private y: number, private z: number, size: number) {
    this.game = b.game;
    this.solid = makeCyl(x, z, size * 0.58, y - 0.6, y);
    // Dynamic so it never counts as safe ground to respawn on.
    this.solid.dynamic = true;
    this.solid.surface = 'ice';
    b.col.add(this.solid);
    this.mesh = new THREE.Group();
    this.m = matUnique(0xd6f0fa, { rough: 0.15, metal: 0.05, flat: true, emissive: 0x3a8ab8, emissiveIntensity: 0.12 });
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.6, size * 0.5, 0.7, 9), this.m);
    slab.position.y = -0.35;
    slab.rotation.y = rng.next() * 3;
    slab.castShadow = slab.receiveShadow = true;
    this.mesh.add(slab);
    const snow = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.45, size * 0.55, 0.08, 7), mat(SNOW, { rough: 0.9, flat: true }));
    snow.position.y = 0.02;
    snow.rotation.y = rng.next() * 3;
    this.mesh.add(snow);
    this.mesh.position.set(x, y, z);
    b.level.root.add(this.mesh);
    this.solid.onStand = () => {
      if (this.timer < 0 && this.down <= 0) {
        this.timer = 0;
        b.game.sfx('iceCrack', x, y, z, 1.4, 0.5);
      }
    };
  }

  update(dt: number): void {
    const g = this.game;
    if (this.timer >= 0) {
      this.timer += dt;
      this.mesh.position.x = this.x + Math.sin(this.timer * 55) * 0.06;
      this.m.emissiveIntensity = 0.12 + this.timer * 0.8;
      if (this.timer > 0.75) {
        this.timer = -1;
        this.down = 4;
        this.solid.enabled = false;
        g.fx.shatter(this.x, this.y, this.z, 0xdff6ff);
        g.fx.splash(this.x, 0, this.z);
        g.sfx('shatter', this.x, this.y, this.z, 1.3, 0.5);
      }
    }
    if (this.down > 0) {
      this.down -= dt;
      this.mesh.position.y -= dt * 3;
      if (this.down <= 0) {
        this.solid.enabled = true;
        this.mesh.position.set(this.x, this.y, this.z);
        this.m.emissiveIntensity = 0.12;
        g.fx.sparkle(this.x, this.y, this.z, 0xdff6ff, 8);
      }
    }
    this.mesh.visible = this.down <= 0 || this.down > 2.6;
  }
}

/**
 * Hides what lies wholly beyond the fog. Fully fogged things cannot be seen,
 * but three.js still draws them: from the landing that was about 160 draw
 * calls for the far end of the valley. It only touches things whose
 * visibility nothing else manages (plain static meshes, gems, dragon rigs and
 * the gears), and only shows again what it hid itself.
 */
class FogCull implements Prop {
  private t = 0;
  private hidden = new Set<THREE.Object3D>();
  private sphere = new THREE.Sphere();
  private fwd = new THREE.Vector3();
  constructor(private game: Game) {}
  update(dt: number): void {
    this.t -= dt;
    if (this.t > 0) return;
    this.t = 0.15;
    const g = this.game;
    const level = g.level;
    const fog = g.renderer.scene.fog as THREE.Fog | null;
    if (!level || !fog) return;
    const cam = g.camera.position;
    // Fog thickens with depth along the view, not with distance.
    const fwd = this.fwd.set(0, 0, -1).applyQuaternion(g.camera.quaternion);
    const far = fog.far;
    const check = (o: THREE.Object3D, r: number, cx: number, cy: number, cz: number) => {
      const d = (cx - cam.x) * fwd.x + (cy - cam.y) * fwd.y + (cz - cam.z) * fwd.z - r;
      if (d > far + 2) {
        if (o.visible) {
          o.visible = false;
          this.hidden.add(o);
        }
      } else if (d < far && this.hidden.has(o)) {
        o.visible = true;
        this.hidden.delete(o);
      }
    };
    for (const o of level.root.children) {
      const m = o as THREE.Mesh;
      // The game's own fog cull handles the level's merged chunks.
      if (o.userData.cull) continue;
      if (m.isMesh && !(m as unknown as THREE.InstancedMesh).isInstancedMesh) {
        if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
        // The level root sits at the origin, so a child's own matrix is its world matrix.
        m.updateMatrix();
        this.sphere.copy(m.geometry.boundingSphere!).applyMatrix4(m.matrix);
        check(m, this.sphere.radius, this.sphere.center.x, this.sphere.center.y, this.sphere.center.z);
      } else if (o.userData.fogCull) check(o, 6, o.position.x, o.position.y, o.position.z);
    }
    for (const n of level.npcs) check(n.rig.root, 5, n.x, n.y + 1, n.z);
    for (const gem of g.gems) if (gem.alive) check(gem.mesh, 0.5, gem.x, gem.y, gem.z);
  }
}

/** A decorative wheel turning on a wall. `yaw` faces its axle. */
class Wheel implements Prop {
  private spinner: THREE.Group;
  constructor(b: Builder, x: number, y: number, z: number, r: number, yaw: number, private rate: number, color: number) {
    const holder = new THREE.Group();
    holder.position.set(x, y, z);
    holder.rotation.y = yaw;
    this.spinner = new THREE.Group();
    const gm = gearMesh(r, 0.6, color);
    gm.rotation.x = Math.PI / 2;
    mergeStatic(gm);
    this.spinner.add(gm);
    holder.add(this.spinner);
    holder.userData.fogCull = true;
    b.level.root.add(holder);
  }
  update(dt: number): void {
    this.spinner.rotation.z += this.rate * dt;
  }
}

/** Chimney smoke or rising embers from the melt. */
class Smoker implements Prop {
  private t = rng.next();
  constructor(private g: Game, private x: number, private y: number, private z: number, private every: number, private embers = false) {}
  update(dt: number): void {
    const g = this.g;
    const p = g.player;
    if (Math.abs(p.z - this.z) > 70 || Math.abs(p.x - this.x) > 70) return;
    this.t -= dt;
    if (this.t > 0) return;
    this.t = this.every;
    if (this.embers) {
      g.fx.emit(this.x + rng.signed() * 1.5, this.y, this.z + rng.signed() * 1.5, { count: 1, speed: 1.6, dir: [0, 1, 0], spread: 0.4, life: [1.2, 2.2], size: [0.07, 0.13], color: 0xffa040, bright: 2, gravity: -1.2 });
    } else {
      g.fx.emit(this.x, this.y, this.z, { count: 1, speed: 1.4, dir: [0.15, 1, 0], spread: 0.25, life: [2.4, 3.4], size: [0.7, 1.1], sizeEnd: 3.4, color: 0x5a5660, alpha: 0.5, additive: false, gravity: -0.8, drag: 0.3 });
    }
  }
}

// ---------------------------------------------------------------------------
// Scenery helpers
// ---------------------------------------------------------------------------

function iceMat(): THREE.MeshStandardMaterial {
  return mat(0xc4e8f8, { rough: 0.12, metal: 0.08, emissive: 0x4aa8d8, emissiveIntensity: 0.28, flat: true });
}

/**
 * A stone hut with its open side (local +Z, turned by yaw) sealed by a gate.
 * Returns the floor height inside.
 */
function hut(b: Builder, cx: number, cz: number, w: number, d: number, h: number, yaw: number, kind: GateKind, signal = ''): number {
  const y = b.y(cx, cz);
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const L = (lx: number, lz: number): [number, number] => [cx + lx * c + lz * s, cz - lx * s + lz * c];
  const [ax, az] = L(-w / 2, -d / 2);
  const [bx, bz] = L(w / 2, -d / 2);
  const [fx1, fz1] = L(-w / 2, d / 2);
  const [fx2, fz2] = L(w / 2, d / 2);
  b.wall(ax, az, bx, bz, y - 0.5, h + 0.5, 0.8, STONE);
  b.wall(ax, az, fx1, fz1, y - 0.5, h + 0.5, 0.8, STONE);
  b.wall(bx, bz, fx2, fz2, y - 0.5, h + 0.5, 0.8, STONE);
  block(b, cx, y + h, cz, w + 0.9, 0.6, d + 0.9, STONE_DARK, IRON, yaw);
  b.decor.add(GEO.box(), mat(SNOW, { rough: 0.9, flat: true }), cx, y + h + 0.68, cz, w + 0.5, 0.2, d + 0.5, 0, yaw, 0, false);
  const iron = mat(IRON, { rough: 0.6, metal: 0.3 });
  for (const [lx, lz] of [[-w / 2, d / 2], [w / 2, d / 2], [-w / 2, -d / 2], [w / 2, -d / 2]] as const) {
    const [px, pz] = L(lx, lz);
    b.decor.add(GEO.box(), iron, px, y + h / 2 - 0.2, pz, 1, h + 0.5, 1, 0, yaw, 0);
  }
  const [lx, lz] = L(0, d / 2 + 0.45);
  b.decor.add(GEO.box(), iron, lx, y + h - 0.35, lz, w + 0.4, 0.5, 0.25, 0, yaw, 0);
  b.decor.add(GEO.box(), glow(0xff9a40), lx, y + h - 0.35, lz, 0.5, 0.25, 0.3, 0, yaw, 0, false);
  const [gx, gz] = L(0, d / 2);
  b.gate(gx, gz, w - 0.5, h - 0.2, yaw, kind, signal, y);
  return y;
}

/** A box with a metal band just under its top edge (no coplanar faces, so no flicker). */
function block(b: Builder, x: number, y0: number, z: number, w: number, h: number, d: number, color: number, trim: number, yaw = 0): Solid {
  const s = b.box(x, y0, z, w, h, d, color, { yaw });
  const band = Math.min(0.22, h * 0.3);
  b.decor.add(GEO.box(), mat(trim, { rough: 0.5, metal: 0.35 }), x, y0 + h - 0.12 - band / 2, z, w + 0.1, band, d + 0.1, 0, yaw, 0);
  return s;
}

/** An iron crane arm with a hook and chain, leaning out over a drop. */
function crane(b: Builder, x: number, z: number, yaw: number): void {
  const y = b.y(x, z);
  const iron = mat(IRON, { rough: 0.6, metal: 0.3 });
  b.col.add(makeCyl(x, z, 0.5, y - 0.5, y + 7));
  b.decor.add(GEO.box(), iron, x, y + 3.5, z, 0.6, 7, 0.6);
  const ax = x + Math.sin(yaw) * 3;
  const az = z + Math.cos(yaw) * 3;
  b.decor.add(GEO.box(), iron, (x + ax) / 2, y + 6.8, (z + az) / 2, 0.4, 0.4, 6.4, 0, yaw, 0);
  chain(b, [ax, y + 6.6, az], [ax, y + 2.5, az], 0);
  b.decor.add(GEO.cone(), iron, ax, y + 2.5, az, 0.3, 0.6, 0.3, Math.PI, 0, 0);
}

/** Broken stone blocks. */
function rubble(b: Builder, x: number, z: number): void {
  const y = b.y(x, z);
  const m = mat(STONE, { rough: 0.95, flat: true });
  for (let i = 0; i < 4; i++) {
    b.decor.add(GEO.box(), m, x + jitter(i + x, 2) * 0.9, y + 0.25, z + jitter(i + z, 3) * 0.9, 0.8, 0.5, 0.7, jitter(i, 4) * 0.4, i, jitter(i, 5) * 0.3);
  }
}

function snowRock(b: Builder, x: number, z: number, s: number): void {
  b.rock(x, z, s, 0x6a7280);
  b.decor.add(GEO.blobLow(), mat(SNOW, { rough: 0.9, flat: true }), x, b.y(x, z) + s * 0.55, z, s * 0.8, s * 0.25, s * 0.75, 0, jitter(x + z) * 3, 0, false);
}

/** A waterfall frozen mid-fall down a cliff face. `yaw` points out of the cliff. */
function frozenFall(b: Builder, x: number, z: number, top: number, bottom: number, w: number, yaw: number): void {
  const m = iceMat();
  const deep = mat(0x8fcbe8, { rough: 0.15, metal: 0.08, emissive: 0x2a88c0, emissiveIntensity: 0.3, flat: true });
  const h = top - bottom;
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  const n = Math.max(3, Math.round(w / 1.1));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n - 0.5;
    const hh = h * (0.75 + Math.abs(jitter(i + x, 2)) * 0.25);
    const px = x + rx * t * w;
    const pz = z + rz * t * w;
    b.decor.add(GEO.cyl6(), i % 2 ? m : deep, px, top - hh, pz, 0.55 + Math.abs(jitter(i, 3)) * 0.3, hh, 0.4, 0, yaw + i, 0);
    // Bulges where the flow piled up.
    b.decor.add(GEO.octa(), m, px + fx * 0.3, bottom + 0.6 + Math.abs(jitter(i, 4)) * h * 0.4, pz + fz * 0.3, 0.7, 1.4, 0.6, 0, yaw, 0);
  }
  for (let i = 0; i < n + 2; i++) {
    const t = i / (n + 1) - 0.5;
    b.decor.add(GEO.cone(), m, x + rx * t * w + fx * 0.3, top, z + rz * t * w + fz * 0.3, 0.3, 1.2 + Math.abs(jitter(i, 6)) * 1.4, 0.3, Math.PI, 0, 0, false);
  }
  // Frozen pool at the foot.
  b.decor.add(GEO.cyl(), m, x + fx * 1.4, bottom - 0.1, z + fz * 1.4, w * 0.55, 0.25, 1.8, 0, yaw, 0);
}

/** A row of icicles hanging from y between two points. */
function icicles(b: Builder, ax: number, az: number, bx: number, bz: number, y: number, n: number): void {
  const m = iceMat();
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const len = 0.5 + Math.abs(jitter(i + ax * 3 + az, 7)) * 1.1;
    b.decor.add(GEO.cone(), m, ax + (bx - ax) * t, y, az + (bz - az) * t, 0.12, len, 0.12, Math.PI, 0, 0, false);
  }
}

/** Iron chain links from a to b, sagging by `sag` in the middle. */
function chain(b: Builder, a: [number, number, number], c: [number, number, number], sag: number): void {
  const m = mat(0x3e4048, { rough: 0.5, metal: 0.4 });
  const len = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
  const n = Math.max(2, Math.round(len / 0.5));
  const q = new THREE.Quaternion();
  const q2 = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const at = (t: number, out: THREE.Vector3) => out.set(
    a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (c[2] - a[2]) * t,
  );
  for (let i = 0; i < n; i++) {
    at((i + 0.5) / n, p0);
    at((i + 0.6) / n, p1);
    const dir = p1.sub(p0).normalize();
    q.setFromUnitVectors(Y_AXIS, dir);
    if (i % 2) q.premultiply(q2.setFromAxisAngle(dir, Math.PI / 2));
    e.setFromQuaternion(q);
    b.decor.add(LINK, m, p0.x, p0.y, p0.z, 1, 1.5, 1, e.x, e.y, e.z, false);
  }
}

/** A heavy forge wall with iron bands and buttresses. */
function forgeWall(b: Builder, x1: number, z1: number, x2: number, z2: number, y0: number, h: number): void {
  b.wall(x1, z1, x2, z2, y0, h, 1.2, STONE);
  const len = Math.hypot(x2 - x1, z2 - z1);
  const yaw = Math.atan2(x2 - x1, z2 - z1);
  const iron = mat(IRON, { rough: 0.6, metal: 0.3 });
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  for (const by of [y0 + h * 0.55, y0 + h - 0.6]) b.decor.add(GEO.box(), iron, cx, by, cz, 1.45, 0.4, len, 0, yaw, 0);
  b.decor.add(GEO.box(), mat(SNOW, { rough: 0.9, flat: true }), cx, y0 + h + 0.1, cz, 1.35, 0.25, len, 0, yaw, 0, false);
  const n = Math.floor(len / 7);
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const x = x1 + (x2 - x1) * t;
    const z = z1 + (z2 - z1) * t;
    b.decor.add(GEO.box(), mat(STONE_DARK, { rough: 0.9, flat: true }), x, y0 + h / 2, z, 1.9, h, 1.1, 0, yaw, 0);
    b.decor.add(GEO.box(), glow(0xff9a40), x, y0 + h * 0.75, z, 1.95, 0.8, 0.3, 0, yaw, 0, false);
  }
}

/** A domed kiln with a glowing mouth. */
function kilnDecor(b: Builder, x: number, z: number, yaw: number): void {
  const y = b.y(x, z);
  b.col.add(makeCyl(x, z, 1.8, y - 1, y + 3));
  const stone = mat(STONE_DARK, { rough: 0.95, flat: true });
  b.decor.add(GEO.cyl(), stone, x, y, z, 2, 1.6, 2);
  b.decor.add(GEO.cap(), stone, x, y + 1.6, z, 2, 1.6, 2);
  b.decor.add(GEO.cyl(), mat(IRON, { rough: 0.6, metal: 0.3 }), x, y + 2.8, z, 0.4, 1.8, 0.4);
  b.decor.add(GEO.box(), glow(0xff8a2a), x + Math.sin(yaw) * 1.95, y + 0.9, z + Math.cos(yaw) * 1.95, 1.1, 1.0, 0.1, 0, yaw, 0, false);
  b.level.props.push(new Smoker(b.game, x, y + 4.8, z, 0.3));
}

/** A glowing trough of melt around a lava hazard. */
function trough(b: Builder, x: number, z: number, w: number, d: number): void {
  const y = b.y(x, z);
  const iron = mat(IRON, { rough: 0.6, metal: 0.3 });
  b.decor.add(GEO.box(), iron, x, y - 0.05, z - d / 2 - 0.2, w + 0.8, 0.5, 0.4);
  b.decor.add(GEO.box(), iron, x, y - 0.05, z + d / 2 + 0.2, w + 0.8, 0.5, 0.4);
  b.decor.add(GEO.box(), iron, x - w / 2 - 0.2, y - 0.05, z, 0.4, 0.5, d);
  b.decor.add(GEO.box(), iron, x + w / 2 + 0.2, y - 0.05, z, 0.4, 0.5, d);
  b.decor.add(GEO.box(), glow(LAVA), x, y + 0.02, z, w, 0.1, d, 0, 0, 0, false);
}

function anvil(b: Builder, x: number, z: number, yaw: number, s: number): void {
  const y = b.y(x, z);
  const iron = mat(0x33353c, { rough: 0.45, metal: 0.5, flat: true });
  b.col.add(makeCyl(x, z, 0.9 * s, y - 0.5, y + 1.3 * s));
  b.decor.add(GEO.box(), iron, x, y + 0.3 * s, z, 1.2 * s, 0.6 * s, 0.9 * s, 0, yaw, 0);
  b.decor.add(GEO.box(), iron, x, y + 0.8 * s, z, 0.6 * s, 0.5 * s, 0.5 * s, 0, yaw, 0);
  b.decor.add(GEO.box(), iron, x, y + 1.15 * s, z, 1.8 * s, 0.35 * s, 0.75 * s, 0, yaw, 0);
  b.decor.add(GEO.cone(), iron, x + Math.cos(yaw) * 1.05 * s, y + 1.15 * s, z - Math.sin(yaw) * 1.05 * s, 0.3 * s, 0.7 * s, 0.3 * s, 0, 0, -Math.PI / 2 + yaw * 0);
}

/** Coils of finished rime chain, glowing faintly with cold. */
function chainPile(b: Builder, x: number, z: number): void {
  const y = b.y(x, z);
  const m = mat(0x8ab8d0, { rough: 0.3, metal: 0.3, emissive: 0x3a90c8, emissiveIntensity: 0.35 });
  for (let i = 0; i < 9; i++) {
    const a = i * 2.1;
    const rr = (i % 3) * 0.35;
    b.decor.add(LINK, m, x + Math.sin(a) * rr, y + 0.12 + Math.floor(i / 3) * 0.16, z + Math.cos(a) * rr, 2.6, 2.6, 2.6, Math.PI / 2, a, 0, false);
  }
  b.col.add(makeCyl(x, z, 0.8, y - 0.5, y + 0.4));
}

/** One of the harvest stores the forge was built for: fruit frozen in a block. */
function harvestCrate(b: Builder, x: number, z: number, i: number): void {
  const y = b.y(x, z);
  b.box(x, y - 0.2, z, 1.4, 1.5, 1.4, 0x6a5238, { yaw: i * 0.3, surface: 'wood' });
  const ice = mat(0xd8f2fc, { rough: 0.1, metal: 0.05, emissive: 0x4a9ac8, emissiveIntensity: 0.2, flat: true, transparent: true, opacity: 0.75 });
  b.decor.add(GEO.box(), ice, x, y + 1.6, z, 1.1, 0.9, 1.1, 0, i * 0.3, 0);
  const fruit = [0xd84a3a, 0xf0b040, 0x8ac050][i % 3]!;
  b.decor.add(GEO.blobLow(), mat(fruit, { rough: 0.6, emissive: fruit, emissiveIntensity: 0.2 }), x, y + 1.6, z, 0.3, 0.3, 0.3, 0, 0, 0, false);
}

/** Glowing ingots cooling in a mold. */
function ingots(b: Builder, x: number, z: number): void {
  const y = b.y(x, z);
  b.decor.add(GEO.box(), mat(IRON, { rough: 0.6, metal: 0.3 }), x, y + 0.15, z, 1.8, 0.3, 1.1);
  for (let i = 0; i < 3; i++) b.decor.add(GEO.box(), glow(i === 1 ? 0xffb050 : LAVA), x - 0.55 + i * 0.55, y + 0.33, z, 0.4, 0.08, 0.8, 0, 0, 0, false);
}
