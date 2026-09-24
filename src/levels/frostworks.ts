import * as THREE from 'three';
import type { LevelDef, Builder } from '../world/level';
import { Npc } from '../world/level';
import { ambient, paint, jitter, bossFight, Cage, rescueWarden } from './common';
import { Grolm } from '../enemies/bosses/grolm';
import { FROSTFANG } from '../game/story';
import type { Game } from '../game/game';
import type { Prop, GateKind } from '../entities/props';
import { makeBox, makeCyl, type Solid } from '../world/collision';
import { GEO } from '../render/decor';
import { mat, matUnique, glow } from '../render/materials';
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

const LINK = new THREE.TorusGeometry(0.2, 0.055, 5, 10);
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
  b.level.root.add(paving);
  for (const [r, w] of [[6.5, 0.12], [13.5, 0.14], [20.2, 0.2]] as const) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, w, 4, 64), glow(r > 20 ? 0xff9a40 : 0xff7a2a));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(BOSS_X, TOP + 0.27, BOSS_Z);
    b.level.root.add(ring);
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
  b.level.root.add(hub);
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
    id: 'grolm', x: BOSS_X, z: BOSS_Z, r: BOSS_R, triggerX: 0, triggerZ: 235, triggerR: 5,
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
    b.level.root.add(axle);
    this.root.position.set(x, top, z);
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
    this.spinner.add(gm);
    holder.add(this.spinner);
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
