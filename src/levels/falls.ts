import * as THREE from 'three';
import type { LevelDef, Builder } from '../world/level';
import { Npc } from '../world/level';
import { ambient, paint, jitter, bossFight, Cage, rescueWarden } from './common';
import { Skrieka } from '../enemies/bosses/skrieka';
import { STORMCREST } from '../game/story';
import type { Game } from '../game/game';
import type { Prop, Torch, Updraft } from '../entities/props';
import type { Hit, HitResult, Hittable } from '../game/types';
import { makeBox, makeCyl, type Solid } from '../world/collision';
import { GEO } from '../render/decor';
import { mat, matUnique } from '../render/materials';
import { rng } from '../core/rng';

/**
 * Stormspire Falls: a canyon of cliffs and waterfalls climbing toward the
 * lightning-struck Stormspire. Teaches gliding into updrafts, burning vines,
 * a timed torch puzzle, crumbling and moving platforms, fighting flyers and
 * breaking a Gloom Totem, and ends with Skrieka on the spire top.
 *
 * Route, south to north:
 *   Mistfall Landing -> rope bridges -> Windward Bank (arena) -> Windstair
 *   updraft -> High Terrace (brute) -> Rain Bell crater (vines, torches)
 *   -> Cascade crossing (crumbles, Roost arena, movers) -> Gloom outpost
 *   (totem arena) -> Spire updraft -> Skrieka.
 */

const COLORS = paint({
  under: 0x243c44, shore: 0x5a7a74, grass: 0x4f9a78, grass2: 0x66ab84, rock: 0x5f7080, path: 0xa8a48e, high: 0x5e9a86, highAt: 24,
});

const ROCK = 0x6a7a88;
const STONE = 0xa8b0a8;
const STONE_DARK = 0x7a8488;

// Key places, shared between terrain shaping and building.
const SPIRE = { x: 0, z: 243, r: 19, h: 35 };
const OUTPOST = { x: 24, z: 216, r: 10, h: 24 };
const CRATER = { x: -4, z: 144 };
const NEST = { x: 33.5, z: 97 };
const ARENA_R = 14;
/** How far below a cliff top its updraft stops lifting. */
const UPDRAFT_SHORT = 2.5;

export const falls: LevelDef = {
  id: 'falls',
  name: 'Stormspire Falls',
  subtitle: 'Where the rivers fall upward',
  music: 'falls',
  killY: -20,
  spawn: [-4, -6, 0],
  sky: {
    top: 0x2f78c8, horizon: 0xb8dfea, bottom: 0x6a9cae, sunDir: [-0.35, 0.62, -0.5], sunColor: 0xfff2d8, sunIntensity: 2.0,
    hemiSky: 0xbadcf8, hemiGround: 0x44625e, hemiIntensity: 1.0, fogNear: 70, fogFar: 330, fog: 0xaed6e2,
  },
  water: { level: 0, deep: 0x16404e, shallow: 0x3a98a6, glint: 0xd8fbff, opacity: 0.86 },
  terrain: {
    x0: -90, z0: -35, sizeX: 180, sizeZ: 300, cell: 1.5,
    color: COLORS,
    shape: (s) => {
      s.base(-4).noise(0.8, 0.04, 5);
      // The canyon: walls east, west and south; it opens into a lake in the north.
      s.island(-74, 50, 32, 36, 5, 0.2, 1, 5);
      s.island(74, 50, 32, 36, 5, 0.2, 1, 5);
      s.island(0, -62, 30, 36, 5, 0.2, 3.5, 1);
      s.island(-45, 44, 7, 30, 4, 0.6);
      s.island(45, 30, 8, 28, 4, 0.6);
      s.island(-45, 100, 9, 33, 4, 0.6);
      s.island(46, 150, 8, 31, 4, 0.6);
      s.island(-44, 208, 9, 26, 5, 0.6);
      // Mistfall Landing.
      s.island(-4, 0, 13, 4, 3, 0.3);
      // Rope-bridge pillars and the Windward Bank.
      s.island(6, 27, 3.5, 5, 2, 0.15);
      s.island(-5, 41, 4, 6, 2, 0.15);
      s.island(2, 60, 11, 6, 3, 0.3);
      // High Terrace, the roc's pinnacle and the grotto islet.
      s.island(0, 98, 20, 16, 2.5, 0.35);
      s.island(NEST.x, NEST.z, 6.5, 26, 2, 0.1);
      s.island(-31, 104, 5.5, 16.5, 2, 0.2);
      // The Rain Bell crater: a rim you cannot climb, notched for two gates.
      s.island(CRATER.x, CRATER.z, 17, 30, 2.5, 0.35);
      s.pit(CRATER.x, CRATER.z, 11, 21, 2.5);
      s.path([[-2, 117, 16], [-3.5, 127, 21], [-4, 134, 21]], 6, 1.5, true, false);
      s.path([[-4, 154, 21], [-3, 161, 21], [-2, 165, 21]], 6, 1.5, true, false);
      // Cascade crossing: the Roost, a sea stack in the gorge.
      s.island(1, 194, 6.5, 21, 2, 0.2);
      // Gloom outpost and the Stormspire.
      s.island(OUTPOST.x, OUTPOST.z, OUTPOST.r, OUTPOST.h, 2.5, 0.3);
      s.island(SPIRE.x, SPIRE.z, SPIRE.r, SPIRE.h, 3, 0.12);
    },
  },

  build(b: Builder) {
    const g = b.game;
    hints = new Hints(g);
    b.level.props.push(hints);
    ambient(b, 'pollen', 6);
    b.level.props.push(new Mist(g));
    b.bound(-88, -33, 88, -33);
    b.bound(88, -33, 88, 263);
    b.bound(88, 263, -88, 263);
    b.bound(-88, 263, -88, -33);
    b.level.props.push(new StormSky(b, -6, 274));
    skyClouds(b);

    // --- Waterfalls ------------------------------------------------------------
    waterfallFrom(b, -4, -20, 0, -1, 10, 8);
    const westFall = waterfallFrom(b, -30, 6, -1, 0, 9, 8);
    waterfallFrom(b, 30, 62, 1, 0, 7, 7);
    waterfallFrom(b, -30, 180, -1, 0, 18, 9);
    waterfallFrom(b, 30, 130, 1, 0, 6, 6);
    waterfallFrom(b, 32, 198, 1, 0, 8, 7);

    mistfallLanding(b, westFall);
    ropeBridges(b);
    windwardBank(b);
    stormglassCache(b);
    highTerrace(b);
    rainBellCrater(b);
    cascadeCrossing(b);
    gloomOutpost(b);
    stormspire(b);
  },

  onEnter(g, fresh) {
    if (fresh && !g.save.found['story:falls:intro']) {
      g.save.found['story:falls:intro'] = true;
      g.say([
        { who: 'flick', text: 'Whoa. Okay. That is a LOT of waterfall.' },
        { who: 'aster', text: 'And that has to be the Stormspire, way up in the clouds. Emberhold said Stormcrest is on top of it.' },
        { who: 'flick', text: 'On top. Of the pointy mountain. That gets hit by lightning all day. Why is it always the top?' },
        { who: 'aster', text: 'Because that\'s where the view is. Come on, Flick!' },
      ], () => say('Follow the rope bridges north. The wind here is strong enough to lift a dragon!', 6));
    }
  },
};

// ---------------------------------------------------------------------------
// Areas
// ---------------------------------------------------------------------------

function mistfallLanding(b: Builder, westFall: WaterfallInfo): void {
  b.scatter(40, -4, 0, 12, (x, z, y) => b.decor.grass(x, y, z, 0.9, 0x5aa27e));
  b.scatter(16, -4, 0, 12, (x, z, y) => b.decor.flower(x, y, z, [0x9ad8ff, 0xffffff, 0xffe07a][Math.floor(Math.abs(jitter(x + z)) * 3)]!));
  [[-12, 5], [6, 7], [5, -8], [-9, -9]].forEach(([x, z], i) => b.tree(x!, z!, 1 + (i % 2) * 0.3, 'pine', { leaf: 0x2f6a5a }));
  b.tree(7, 2, 0.9, 'crystal', { leaf: 0x7ae8f0 });
  b.rock(-13, -1, 1.4, ROCK);
  b.rock(8, -4, 1.0, ROCK);
  b.crystal(3, -5, 'blue', 8);
  b.crystal(-10, 8, 'green', 3);
  b.crystal(8, 9, 'blue', 8);
  b.gemLine([[-4, -2], [-3, 6], [-2, 11]]);
  // The Wardgate's landing stone.
  b.box(-4, b.y(-4, -6) - 0.3, -6, 4, 0.5, 4, STONE, { trim: STONE_DARK });

  // Lookout: stepping stones up the west side, then a glide through the
  // waterfall to a ledge hidden behind it.
  const steps: [number, number, number, number][] = [[-15, -7, 5.6, 1.3], [-18.5, -9.5, 7.1, 1.2], [-22, -7.5, 8.6, 1.2], [-25, -4.5, 10.1, 1.4]];
  for (const [x, z, top, r] of steps) b.pillar(x, z, r, -3, top, ROCK);
  b.gems(-25, -4.5, 'blue', 3, 0.7, 10.1);
  b.story('veil', -25, -4.5, 2.5, () => say('Psst. Is something sparkling behind that waterfall?', 5));
  // The ledge sits against the cliff at y 9, just behind the falling water.
  const ledgeY = 9;
  const [fx] = faceAt(b, -30, westFall.z, -1, 0, ledgeY + 1.5);
  const lx = fx + 1.1;
  b.box(lx, ledgeY - 1.2, westFall.z, 2.6, 1.2, 8, ROCK, { surface: 'stone' });
  b.collectible('heart1', 'heart', lx + 0.2, westFall.z, ledgeY);
  b.crystal(lx, westFall.z + 3, 'blue', 10);
}

function ropeBridges(b: Builder): void {
  const legs: [number, number, number, number][] = [[-2, 11.5, 5, 24.5], [4.5, 29.5, -3.5, 38.5], [-4.5, 44.5, 0, 51.5]];
  for (const [ax, az, bx, bz] of legs) {
    b.bridge(ax, az, b.y(ax, az), bx, bz, b.y(bx, bz), 3);
    b.gemLine([[ax, az], [bx, bz]], 'blue', 1.8);
  }
  b.story('bridges', -2, 10, 3, () => say('Rope bridges! They are sturdier than they look. Probably. Don\'t look down!', 5));
  // Slingers on the rock pillars pepper the crossing; tethers keep them on their rocks.
  b.enemy('slinger', 6.5, 27.5, Math.PI);
  b.enemy('slinger', -5, 42, Math.PI);
  const tethers = new Tether(b.game);
  tethers.add(6, 27, 2.2);
  tethers.add(-5, 41, 2.6);
  b.level.props.push(tethers);
  b.crystal(7.5, 29, 'red', 2);
  b.crystal(-6.5, 39, 'blue', 8);
  for (const [x, z] of [[6, 27], [-5, 41]] as const) {
    b.scatter(6, x, z, 3, (px, pz, y) => b.decor.grass(px, y, pz, 0.8, 0x5aa27e));
  }
}

function windwardBank(b: Builder): void {
  const g = b.game;
  b.scatter(30, 2, 60, 10, (x, z, y) => b.decor.grass(x, y, z, 1, 0x5aa27e));
  [[-6, 66], [10, 64], [9, 54]].forEach(([x, z]) => b.tree(x!, z!, 1.1, 'pine', { leaf: 0x2f6a5a }));
  b.tree(-6, 55, 0.9, 'crystal', { leaf: 0x7ae8f0 });
  b.rock(-8, 60, 1.3, ROCK);
  b.rock(11, 59, 1.1, ROCK);
  b.crystal(-7, 63, 'blue', 10, true);
  b.crystal(10, 67, 'green', 3);
  const bank = b.arena('bank', 2, 60, 10, [
    [{ type: 'grunt', x: -2, z: 64 }, { type: 'grunt', x: 6, z: 64, delay: 0.2 }, { type: 'grunt', x: 2, z: 67, delay: 0.4 }],
    [{ type: 'slinger', x: -4, z: 66 }, { type: 'slinger', x: 8, z: 66, delay: 0.2 }, { type: 'shieldbearer', x: 2, z: 64, delay: 0.5 }],
  ], 35);
  bank.onStart = () => say('Gloomlings, all the way out here? Don\'t let them knock you off the edge!', 6);
  bank.onClear = () => say('Nice! That cliff is too high to climb... but see the mist blowing UP it? That\'s an updraft!', 7);

  // The Windstair: an updraft hugging the terrace cliff.
  const [, fz] = faceAt(b, 1, 70, 0, 1, 9);
  // Each updraft stops a little short of the cliff top: the wind's momentum
  // carries a glider over the lip without flinging it across the plateau.
  windColumn(b, b.updraft(1, fz - 1.4, 4, 0, 16 - UPDRAFT_SHORT, 34));
  b.story('updraft', 1, 69, 4, () => say('Run off the edge toward the cliff: jump, flap, then HOLD Space to glide into the rising wind. It will carry you up!', 8));
  b.gemLine([[1, 64], [1, 70]]);
  for (let i = 0; i < 5; i++) g.placeGem('blue', 1, 1, 8 + i * 2.2, fz - 1.4);
}

/**
 * The Stormglass cache on the High Terrace: three old lightning conduits
 * around a Gloom cage. Charge all three before the first fades (Lightning,
 * so it is a reason to come back after the Stormspire).
 */
function stormglassCache(b: Builder): void {
  const g = b.game;
  const cx = -9;
  const cz = 97;
  const cy = b.y(cx, cz);
  const cage = new Cage(b, cx, cz, 1.7, 3.2);
  const cageSolid = b.col.add(makeCyl(cx, cz, 2.0, cy, cy + 3.2));
  b.crystal(cx, cz, 'mixed', 45, true, cy);
  for (const [x, z] of [[-14.5, 91.5], [-3, 92], [-9, 104]] as const) b.conduit(x, z, 'stormglass', 4.5);
  b.conduitGroup('stormglass', 'stormglass');
  b.level.on('stormglass', () => {
    cage.shatter(g);
    cageSolid.enabled = false;
    say('All three at once! The old Wardens hid their stormglass well.', 5);
  });
  b.story('conduits', cx, cz, 6, () => {
    if (g.save.elements.includes('lightning')) say('Three iron conduits around a cage. Spark them all before the first one fades!', 6);
    else say('Iron posts with glass on top, all around that cage. They look like they are waiting for a spark...', 6);
  });
  b.puzzleHint(cx, cz, 9, [
    'Lightning breath (hold Right Mouse) charges a conduit for a few seconds. Get all three glowing together.',
    'Stand by the cage so all three are close, and sweep from one to the next quickly.',
  ], 'stormglass', 25, 30);
}

function highTerrace(b: Builder): void {
  const g = b.game;
  b.checkpoint('terrace', 1, 84, 0);
  b.scatter(70, 0, 98, 19, (x, z, y) => b.decor.grass(x, y, z, 1, 0x5aa27e));
  b.scatter(22, 0, 98, 18, (x, z, y) => b.decor.flower(x, y, z, [0x9ad8ff, 0xffffff, 0xd0b0ff][Math.floor(Math.abs(jitter(x * 3 + z)) * 3)]!));
  b.scatter(14, 0, 98, 19, (x, z) => b.tree(x, z, 1 + Math.abs(jitter(x * 7 + z)) * 0.5, 'pine', { leaf: 0x2f6a5a }),
    (x, z) => Math.hypot(x - 1, z - 86) > 6 && Math.abs(x) > 5 && Math.hypot(x, z - 104) > 7);
  [[-12, 90], [13, 108], [-9, 113]].forEach(([x, z], i) => b.tree(x!, z!, 1 + i * 0.1, 'crystal', { leaf: 0x7ae8f0 }));
  [[-15, 96], [16, 92], [8, 114], [-16, 110]].forEach(([x, z], i) => b.rock(x!, z!, 1.2 + (i % 2) * 0.5, ROCK));
  b.crystal(-14, 86, 'blue', 10, true);
  b.crystal(15, 100, 'red', 3);
  b.crystal(-4, 116, 'blue', 8);
  b.gemLine([[1, 88], [0, 100], [-2, 114]]);
  // The brute holds the way to the crater.
  b.enemy('brute', 4, 110, Math.PI);
  b.enemy('grunt', -6, 112, Math.PI);
  b.enemy('slinger', -12, 104, Math.PI / 2);
  b.story('brute', 1, 101, 6, () => say('That big one is a Gloom Brute. It shrugs off hits! When it slams the ground, jump the shockwave, then punish it.', 7));

  // The roc's nest on the pinnacle, reached on an updraft from the east edge.
  const nestY = b.y(NEST.x, NEST.z);
  const [px] = faceAt(b, 20, NEST.z, 1, 0, 20);
  windColumn(b, b.updraft(px - 1.4, NEST.z, 3.8, 8, nestY - UPDRAFT_SHORT, 34));
  for (let i = 0; i < 4; i++) g.placeGem('blue', 1, px - 1.4, 18 + i * 2.2, NEST.z);
  rocNest(b, NEST.x, nestY, NEST.z);
  b.collectible('relic2', 'relic', NEST.x, NEST.z, nestY + 0.4, 'falls2');
  b.crystal(NEST.x + 2, NEST.z + 2.5, 'purple', 3);

  // A rope bridge west to the grotto islet: cracked stone seals it (Earth).
  const gx = -31;
  const gz = 104;
  b.bridge(-18.5, 102, b.y(-18.5, 102), -26.5, 103.5, b.y(-26.5, 103.5), 3);
  const gy = b.y(gx, gz);
  b.wall(gx - 2.4, gz - 2.2, gx - 2.4, gz + 2.2, gy - 0.5, 4, 1, ROCK);
  b.wall(gx - 2.4, gz - 2.4, gx + 1.8, gz - 2.4, gy - 0.5, 4, 1, ROCK);
  b.wall(gx - 2.4, gz + 2.4, gx + 1.8, gz + 2.4, gy - 0.5, 4, 1, ROCK);
  b.platform(gx - 0.3, gy + 3.9, gz, 5.4, 6, ROCK, 0.6, { trim: STONE_DARK });
  b.gate(gx + 2, gz, 4.6, 3.6, Math.PI / 2, 'rock', '', gy);
  b.collectible('mana2', 'mana', gx - 0.6, gz, gy);
  b.crystal(gx - 1, gz + 1.4, 'blue', 12, false, gy);
  b.decor.rock(gx + 0.5, gy + 3.9, gz - 1, 1.3, ROCK);
  b.decor.tree(gx - 1, gy + 4.1, gz + 1, 0.7, 'pine', { leaf: 0x2f6a5a });
}

function rainBellCrater(b: Builder): void {
  const g = b.game;
  const cx = CRATER.x;
  const cz = CRATER.z;
  const floor = b.y(cx, cz);
  // South notch: thorny vines under a stone lintel that closes the notch above.
  b.gate(-3.6, 129.3, 7, 5.5, Math.atan2(-0.5, 7), 'vines');
  lintel(b, -3.6, 129.3, Math.atan2(-0.5, 7), floor + 5.5);
  b.story('vines', -2.6, 121, 3.5, () => say('Thorny vines! Burn them away with fire: hold Right Mouse.', 6));
  b.gemLine([[-2, 118], [-3, 126]]);
  // The shrine of the Rain Bell.
  const sx = cx;
  const sz = cz + 2;
  b.platform(sx, floor + 0.5, sz, 7.4, 7.4, STONE, 0.6, { trim: STONE_DARK });
  for (const [ox, oz] of [[-2.9, -2.9], [2.9, -2.9], [-2.9, 2.9], [2.9, 2.9]] as const) b.pillar(sx + ox, sz + oz, 0.45, floor + 0.5, floor + 4.2, STONE);
  b.platform(sx, floor + 4.7, sz, 8.4, 8.4, STONE_DARK, 0.5, { trim: STONE });
  const bell = new RainBell(g, sx, floor + 1.9, sz);
  b.level.props.push(bell);
  b.level.hittables.push(bell);
  b.collectible('relic3', 'relic', sx, sz, floor + 4.7, 'falls3');
  // A broken column to climb onto the roof.
  b.pillar(sx + 5.4, sz + 1.5, 1.0, floor - 0.5, floor + 3.0, STONE);
  b.gems(sx + 5.4, sz + 1.5, 'blue', 1, 0, floor + 3.0);

  // Three braziers that burn out: light them all in time.
  const torches: Torch[] = [
    b.torch(cx - 7, cz - 4, 'bell', false, 14),
    b.torch(cx + 7, cz - 5, 'bell', false, 14),
  ];
  const shelfX = cx - 8;
  const shelfZ = cz + 6;
  b.box(shelfX, floor - 0.5, shelfZ, 3.8, 3.1, 3.8, ROCK, { trim: STONE_DARK });
  torches.push(b.torch(shelfX - 1.0, shelfZ + 0.6, 'bell', false, 14, floor + 2.6));
  b.torchGroup('bell', 'falls-bellgate');
  b.level.props.push(new TorchWatch(g, torches));
  b.gate(-3.2, 159.5, 7, 5.5, Math.atan2(1, 7), 'stone', 'falls-bellgate');
  lintel(b, -3.2, 159.5, Math.atan2(1, 7), floor + 5.5);
  b.level.on('falls-bellgate', () => say('All three lit! The north gate is opening!', 4));
  b.story('bells', cx, cz - 9, 4, () => say('An old shrine... Three braziers. Light them all before they burn out and that stone gate should open!', 7));
  b.story('flyers', cx, cz - 5, 5, () => say('Shade Wisps! Flyers dodge your horns on the ground. Breathe fire up at them, throw fireballs (Q), or jump and horn them out of the air!', 8));
  b.enemy('wisp', cx - 5, cz + 1, 0);
  b.enemy('wisp', cx + 5, cz + 4, 0);

  b.scatter(40, cx, cz, 10, (x, z, y) => b.decor.grass(x, y, z, 1, 0x5aa27e), (x, z) => Math.hypot(x - sx, z - sz) > 5);
  b.scatter(18, cx, cz, 10, (x, z, y) => b.decor.flower(x, y, z, 0x9ad8ff), (x, z) => Math.hypot(x - sx, z - sz) > 5);
  b.scatter(10, cx, cz, 16.5, (x, z, y) => b.decor.glowCrystal(x, y, z, 1.4, 0x7ae8f0), (x, z, y) => y > 27 && Math.hypot(x - cx, z - cz) > 13);
  b.scatter(8, cx, cz, 16.5, (x, z) => b.tree(x, z, 1.1, 'pine', { leaf: 0x2f6a5a }, false), (x, z, y) => y > 27 && Math.hypot(x - cx, z - cz) > 14);
  b.crystal(cx + 8, cz + 5, 'blue', 10);
  b.crystal(cx - 2, cz - 8, 'green', 3);
  b.crystal(cx + 3, cz + 9, 'blue', 8, true);
  b.gemLine([[-3.5, 134], [-8, 139]]);
  b.gemLine([[-3.5, 154], [-3, 162], [-2, 166]]);
}

function cascadeCrossing(b: Builder): void {
  const g = b.game;
  // Crumbling stones over the gorge, in front of the great waterfall.
  const crumbles: [number, number, number][] = [[-0.5, 21, 172], [2.5, 21, 176.5], [0, 21, 181], [3, 21, 185]];
  for (const [x, y, z] of crumbles) {
    b.level.props.push(new Crumble(g, x, y, z, 3, 3));
    g.placeGem('blue', 1, x, y + 0.5, z);
  }
  b.story('crumble', -2, 166, 3, () => say('Those stones are cracked. They crumble when you land, so keep moving!', 5));
  // A side trail of crumbles to a ledge by the waterfall.
  const side: [number, number, number][] = [[-4.8, 21.6, 179.8], [-9.6, 22.2, 178.4], [-14.4, 22.8, 177]];
  for (const [x, y, z] of side) b.level.props.push(new Crumble(g, x, y, z, 2.6, 2.6));
  b.pillar(-20.2, 176.2, 2.2, -3, 23.4, ROCK);
  b.collectible('mana1', 'mana', -20.2, 176.2, 23.4);
  b.gems(-20.2, 176.2, 'green', 3, 1.2, 23.4);

  // The Roost: flyers nest on the sea stack.
  b.scatter(18, 1, 194, 6, (x, z, y) => b.decor.grass(x, y, z, 0.9, 0x5aa27e));
  b.tree(-3, 197, 0.8, 'crystal', { leaf: 0x7ae8f0 });
  b.crystal(4.5, 191, 'blue', 8);
  const roost = b.arena('roost', 1, 194, 7, [
    [{ type: 'wisp', x: -2, z: 196 }, { type: 'wisp', x: 4, z: 196, delay: 0.3 }],
    [{ type: 'stormWisp', x: -2, z: 191 }, { type: 'stormWisp', x: 4, z: 191, delay: 0.3 }, { type: 'wisp', x: 1, z: 198, delay: 0.6 }],
  ], 30);
  roost.onStart = () => say('Flyers! Breath and fireballs reach them in the air, or jump up and give them the horns!', 6);
  roost.onClear = () => say('That stone platform is moving. Hop on, ride it across, hop off. Easy! ...Right?', 6);

  // Moving stones to the outpost.
  b.mover([[2, 21, 202.5], [2, 22.5, 210]], 3, 3, 2.6, 0x7a8a90, 0, '', 0.9);
  b.pillar(2, 214, 1.8, -3, 22.5, ROCK);
  b.gems(2, 214, 'blue', 1, 0, 22.5);
  b.mover([[6, 22.5, 214], [11.5, 24, 214]], 3, 3, 2.4, 0x7a8a90, 0, '', 1.0);
  b.story('movers', 1.5, 199.5, 2.5, () => say('Wait for the stone to come to you, then jump on!', 4));
}

function gloomOutpost(b: Builder): void {
  const g = b.game;
  const { x: ox, z: oz } = OUTPOST;
  b.checkpoint('outpost', 16.8, 215, Math.PI / 2);
  b.scatter(30, ox, oz, 9, (x, z, y) => b.decor.grass(x, y, z, 1, 0x4f8a6e));
  [[30.5, 212], [21, 224], [18, 209.5]].forEach(([x, z]) => tent(b, x!, z!));
  b.scatter(10, ox, oz, 9.5, (x, z, y) => b.decor.glowCrystal(x, y, z, 1.1, 0xb04cff), (x, z) => Math.hypot(x - ox, z - oz) > 7);
  b.crystal(32, 217, 'blue', 12, true);
  b.crystal(17, 220, 'green', 3);
  const camp = b.arena('totem', 26, 218, 8.5, [
    [{ type: 'totem', x: 27, z: 222 }, { type: 'grunt', x: 22, z: 217, delay: 0.2 }, { type: 'grunt', x: 30, z: 217, delay: 0.3 }, { type: 'shieldbearer', x: 26, z: 213, delay: 0.5 }],
    [{ type: 'slinger', x: 21, z: 221 }, { type: 'slinger', x: 31, z: 221, delay: 0.2 }, { type: 'grunt', x: 26, z: 214, delay: 0.4 }, { type: 'grunt', x: 24, z: 221, delay: 0.6 }],
  ], 45);
  camp.onStart = () => {
    if (!g.save.found['story:falls:totem']) {
      g.save.found['story:falls:totem'] = true;
      g.say([
        { who: 'flick', text: 'See that glowing crystal pole? That\'s a Gloom Totem. It shields every Gloomling standing near it!' },
        { who: 'aster', text: 'So we break it first.' },
        { who: 'flick', text: 'So we break it FIRST. Great minds!' },
      ]);
    }
  };
  camp.onClear = () => say('The Spire is right there. One more updraft, straight up the cliff!', 6);

  // A sealed storm vault: it wants a spark (Lightning).
  const vx = 24;
  const vz = 208;
  const vy = b.y(vx, vz) + 0.1;
  b.platform(vx, vy, vz, 5, 4.2, STONE_DARK, 1.2);
  b.wall(vx - 2.2, vz - 1.8, vx - 2.2, vz + 1.8, vy - 0.5, 3.8, 0.8, STONE_DARK);
  b.wall(vx + 2.2, vz - 1.8, vx + 2.2, vz + 1.8, vy - 0.5, 3.8, 0.8, STONE_DARK);
  b.wall(vx - 2.2, vz - 1.8, vx + 2.2, vz - 1.8, vy - 0.5, 3.8, 0.8, STONE_DARK);
  b.platform(vx, vy + 3.6, vz, 5.4, 4.6, STONE, 0.5, { trim: STONE_DARK });
  b.gate(vx, vz + 2.0, 3.8, 3.3, 0, 'stone', 'falls-vault', vy);
  b.switchCrystal(vx - 3.6, vz + 1.5, 'lightning', 'falls-vault');
  b.collectible('heart2', 'heart', vx, vz - 0.3, vy);
  b.crystal(vx + 1.2, vz - 1, 'blue', 15, false, vy);
  b.story('vault', vx - 2, vz + 5, 3, () => say('That crystal door looks like it wants a zap. We\'ll need lightning for that one. Remember this spot!', 6));

  // The last updraft, up the Stormspire's face.
  const dx = SPIRE.x - ox;
  const dz = SPIRE.z - oz;
  const n = Math.hypot(dx, dz);
  const ux = dx / n;
  const uz = dz / n;
  const [fx, fz] = faceAt(b, ox + ux * 8, oz + uz * 8, ux, uz, 28);
  windColumn(b, b.updraft(fx - ux * 1.5, fz - uz * 1.5, 4, 0, SPIRE.h - UPDRAFT_SHORT, 34));
  for (let i = 0; i < 5; i++) g.placeGem('blue', 1, fx - ux * 1.5, 27 + i * 2, fz - uz * 1.5);
  b.story('spire', ox + ux * 8, oz + uz * 8, 3, () => say('Here we go: glide into the wind by the Spire and it will take us all the way up. Hold on to your horns!', 7));
}

function stormspire(b: Builder): void {
  const g = b.game;
  const { x: cx, z: cz } = SPIRE;
  const top = b.y(cx, cz);
  const floor = arenaFloor(b, cx, top, cz, ARENA_R + 0.8);
  const polar = (a: number, d: number): [number, number] => [cx + Math.sin(a) * d, cz + Math.cos(a) * d];
  const entryA = Math.atan2(OUTPOST.x - cx, OUTPOST.z - cz);
  const [wx, wz] = polar(entryA, 17.2);
  const ward = b.checkpoint('spire', wx, wz, Math.atan2(cx - wx, cz - wz));
  // The updraft can carry a dragon right past the stone; wake it on touchdown.
  b.level.props.push({
    update: () => {
      const p = g.player;
      if (g.save.checkpoint === 'spire' || !p.alive || !p.body.grounded || p.y < top - 1.5 || Math.hypot(p.x - cx, p.z - cz) > SPIRE.r) return;
      ward.setActive(true);
      g.activateCheckpoint(ward);
    },
  });

  // Crags around the rim; the tallest hides a relic. The west rim stays low:
  // that is where conversations up here put the camera.
  const crags: [number, number, number, number][] = [
    [-2.35, 16.8, 2.0, 1.2], [-1.25, 17.4, 2.2, 1.3], [-2.8, 17.3, 2.0, 1.3], [0.85, 17.2, 4.6, 1.2],
    [1.18, 17.6, 5.8, 1.4], [1.62, 16.4, 2.4, 1.0], [1.8, 17.1, 4.8, 1.0], [3.0, 17.4, 4.6, 1.2],
  ];
  for (const [a, d, h, r] of crags) {
    const [x, z] = polar(a, d);
    crag(b, x, z, top, h, r);
  }
  const [rx, rz] = polar(1.8, 17.1);
  b.collectible('relic1', 'relic', rx, rz, top + 4.8, 'falls1');
  b.scatter(24, cx, cz, 18, (x, z, y) => b.decor.grass(x, y, z, 0.8, 0x4f8a6e), (x, z) => Math.hypot(x - cx, z - cz) > 15.4);
  b.scatter(14, cx, cz, 18.5, (x, z, y) => b.decor.glowCrystal(x, y, z, 1.3, 0x9fe8ff), (x, z) => Math.hypot(x - cx, z - cz) > 15);
  const [lx, lz] = polar(-0.75, 16);
  waterfallFrom(b, lx, lz, Math.sin(-0.75), Math.cos(-0.75), 6, 6, true);
  b.crystal(wx + 1.5, wz - 1.5, 'green', 4);
  b.crystal(wx - 2, wz + 0.5, 'red', 3);

  if (g.save.levelsDone.falls) {
    b.portal(cx, cz + 4, Math.PI, 'sanctum', 'Return to the Sanctum', 0x7ac8ff);
    return;
  }
  const [kx, kz] = polar(0, 17.2);
  const cage = new Cage(b, kx, kz, 2.6, 5);
  b.level.npcs.push(new Npc(g, 'stormcrest', STORMCREST, kx, b.y(kx, kz), kz, Math.PI));
  b.story('rim', cx, cz, SPIRE.r, () => say('Aster, look! A cage, on the far side. And something BIG is circling up there...', 6));
  bossFight(b, {
    id: 'skrieka', x: cx, z: cz, r: ARENA_R, triggerX: cx, triggerZ: cz, triggerR: 7,
    spawn: (gg) => new Skrieka(gg, cx, floor, cz, ARENA_R),
    intro: [
      { who: 'stormcrest', text: 'Hey! HEY! Over here! In the very sparkly cage! Are you a rescue? You look like a rescue. A small one.' },
      { who: 'aster', text: 'I\'m Aster. Emberhold sent me. Hang on, I\'ll get you out!' },
      { who: 'stormcrest', text: 'Love it! Great plan! One teeny problem. Look up.', action: () => {
        g.shake(0.6, 1);
        g.sfx('bossRoar', cx, top, cz, 1.3);
        const tip = new THREE.Vector3(cx, top + 30, cz);
        g.fx.arc(tip, new THREE.Vector3(cx + 3, top + 12, cz - 4), 0xe8f8ff, 0.5, 0.3, 0.3);
        g.fx.flash(cx, top + 14, cz, 0xbfe8ff, 10, 60, 0.4);
      } },
      { who: 'skrieka', text: 'SKRRRRAAAAAAAK!' },
      { who: 'flick', text: 'That\'s a storm roc! Aster, she\'s HUGE!' },
      { who: 'stormcrest', text: 'Skrieka used to carry my letters. Sweetest bird in the sky! The shadow got into her. Don\'t let her grab you!' },
      { who: 'flick', text: 'When she dives, get out of the red streak! If she misses, she crashes. That\'s when we hit her. Fire works best!' },
    ],
    onDefeated: (gg) => rescueWarden(gg, {
      warden: 'stormcrest', look: STORMCREST, x: kx, z: kz, yaw: Math.PI, element: 'lightning', unlocks: 'frostworks', cage,
      lines: [
        { who: 'stormcrest', text: 'FREE! Oh, legs! I missed you, legs! Kid, that was AMAZING. The dives! The fire! The part where you nearly fell off!' },
        { who: 'aster', text: 'Is Skrieka going to be all right?' },
        { who: 'stormcrest', text: 'Look at her go! The shadow\'s out of her. She\'ll sleep it off on a thundercloud and wake up grumpy. Like always.' },
        { who: 'flick', text: 'So YOU\'RE the Lightning Warden. You\'re... smaller than I pictured.' },
        { who: 'stormcrest', text: 'I\'m compact! Compact is aerodynamic! Now hold still, kid. This is going to tingle. Maybe sting. Possibly both.' },
      ],
    }),
  });
}

// ---------------------------------------------------------------------------
// Flick's hints, one at a time
// ---------------------------------------------------------------------------

/** Queues Flick's hints so two triggers close together do not talk over each other. */
class Hints implements Prop {
  private queue: [string, number][] = [];
  private t = 0;
  constructor(private game: Game) {}
  say(text: string, seconds: number): void {
    if (this.t <= 0) this.show(text, seconds);
    else if (this.queue.length < 3) this.queue.push([text, seconds]);
  }
  private show(text: string, seconds: number): void {
    this.game.hud.flick(text, seconds);
    this.t = seconds;
  }
  update(dt: number): void {
    if (this.game.state === 'dialogue') return;
    this.t -= dt;
    if (this.queue.length && this.t < 0.4) {
      const [text, secs] = this.queue.shift()!;
      this.show(text, secs);
    } else if (this.queue.length && this.t > 4.5) this.t = 4.5;
  }
}

let hints: Hints | null = null;

function say(text: string, seconds = 5): void {
  hints?.say(text, seconds);
}

// ---------------------------------------------------------------------------
// Terrain helpers
// ---------------------------------------------------------------------------

/** First point from (x, z) along (dx, dz) where the terrain reaches height y. */
function faceAt(b: Builder, x: number, z: number, dx: number, dz: number, y: number, max = 45): [number, number] {
  const n = Math.hypot(dx, dz) || 1;
  for (let t = 0; t < max; t += 0.2) {
    const px = x + (dx / n) * t;
    const pz = z + (dz / n) * t;
    if (b.col.terrainAt(px, pz) >= y) return [px, pz];
  }
  return [x + (dx / n) * max, z + (dz / n) * max];
}

/** First point from (x, z) along (dx, dz) where the terrain drops below y. */
function edgeAt(b: Builder, x: number, z: number, dx: number, dz: number, y: number, max = 30): [number, number] {
  const n = Math.hypot(dx, dz) || 1;
  for (let t = 0; t < max; t += 0.2) {
    const px = x + (dx / n) * t;
    const pz = z + (dz / n) * t;
    if (b.col.terrainAt(px, pz) < y) return [px, pz];
  }
  return [x + (dx / n) * max, z + (dz / n) * max];
}

// ---------------------------------------------------------------------------
// Waterfalls
// ---------------------------------------------------------------------------

const fallVert = /* glsl */ `
#include <common>
#include <fog_pars_vertex>
attribute float aS;
varying vec2 vUv;
varying float vS;
void main() {
  vUv = uv;
  vS = aS;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const fallFrag = /* glsl */ `
#include <common>
#include <fog_pars_fragment>
uniform float uTime;
uniform float uWidth;
uniform float uOpacity;
uniform vec3 uColor;
uniform vec3 uFoam;
varying vec2 vUv;
varying float vS;
float h1(float n) { return fract(sin(n * 91.3458) * 47453.5453); }
void main() {
  float cx = vUv.x * uWidth * 1.4;
  float c = floor(cx);
  float f = fract(cx);
  float sp = 1.1 + h1(c) * 0.9;
  float t = vUv.y * 0.9 - uTime * sp + h1(c + 7.0) * 10.0;
  float ft = fract(t);
  float band = smoothstep(0.3, 0.5, ft) * (1.0 - smoothstep(0.55, 0.95, ft));
  float edge = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
  float body = 0.6 + 0.4 * band * (0.5 + 0.5 * sin(f * 3.14159));
  vec3 col = mix(uColor, uFoam, clamp(band * 0.55 + smoothstep(0.7, 1.0, vS) * 0.7 + (1.0 - smoothstep(0.0, 0.06, vS)) * 0.4, 0.0, 1.0));
  float a = uOpacity * edge * body * smoothstep(0.0, 0.03, vS);
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

/** Where a waterfall lands. */
interface WaterfallInfo {
  x: number;
  z: number;
}

/** A sheet of falling water from a cliff lip down to the gorge, with mist at its foot. */
class Waterfall implements Prop {
  private uniforms: Record<string, THREE.IUniform>;
  private fxT = 0;
  private baseX: number;
  private baseZ: number;
  constructor(private game: Game, parent: THREE.Object3D, private lipX: number, private lipY: number, private lipZ: number,
    private dirX: number, private dirZ: number, private width: number, reach: number, private bottom = 0) {
    const rows = 16;
    const h = lipY - bottom;
    const px = -dirZ;
    const pz = dirX;
    const pos: number[] = [];
    const uv: number[] = [];
    const ss: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= rows; i++) {
      const s = i / rows;
      const off = reach * Math.sqrt(s);
      const w = width * (1 + s * 0.25) * 0.5;
      const cx = lipX + dirX * off;
      const cz = lipZ + dirZ * off;
      const y = lipY - s * h;
      pos.push(cx - px * w, y, cz - pz * w, cx + px * w, y, cz + pz * w);
      uv.push(0, (s * h) / 6, 1, (s * h) / 6);
      ss.push(s, s);
      if (i < rows) {
        const a = i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('aS', new THREE.Float32BufferAttribute(ss, 1));
    geo.setIndex(idx);
    geo.computeBoundingSphere();
    this.uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: { value: 0 },
        uWidth: { value: width },
        uOpacity: { value: 0.78 },
        uColor: { value: new THREE.Color(0x7ac8d8) },
        uFoam: { value: new THREE.Color(0xf4ffff) },
      },
    ]);
    const m = new THREE.ShaderMaterial({
      uniforms: this.uniforms, vertexShader: fallVert, fragmentShader: fallFrag, transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, m);
    mesh.renderOrder = 6;
    parent.add(mesh);
    this.baseX = lipX + dirX * reach;
    this.baseZ = lipZ + dirZ * reach;
  }

  update(dt: number): void {
    const g = this.game;
    this.uniforms.uTime!.value = g.realTime;
    this.fxT -= dt;
    if (this.fxT > 0) return;
    this.fxT = 0.12;
    const p = g.player;
    if (Math.hypot(p.x - this.baseX, p.z - this.baseZ) > 110) return;
    const px = -this.dirZ;
    const pz = this.dirX;
    const k = rng.signed() * this.width * 0.55;
    // Mist boiling up where it lands, and spray off the lip.
    g.fx.emit(this.baseX + px * k, this.bottom + 0.4, this.baseZ + pz * k, {
      count: 2, speed: 2.2, dir: [this.dirX * 0.6, 1, this.dirZ * 0.6], spread: 0.6, life: [1.6, 2.8], size: [1.4, 2.4], sizeEnd: 2.6,
      color: 0xf2fbff, alpha: 0.4, additive: false, drag: 0.8, gravity: -0.4, jitter: 1,
    });
    if (rng.chance(0.4)) {
      g.fx.emit(this.lipX + px * k + this.dirX, this.lipY - 0.5, this.lipZ + pz * k + this.dirZ, {
        count: 1, speed: 1.2, dir: [this.dirX, -0.5, this.dirZ], spread: 0.5, life: [0.8, 1.4], size: [0.5, 0.9], sizeEnd: 2,
        color: 0xffffff, alpha: 0.35, additive: false, drag: 0.5,
      });
    }
  }
}

/**
 * Finds the cliff lip by marching from (x, z) along (dx, dz), then pours a
 * waterfall back out along the reverse direction. `fromTop` starts on a
 * plateau and marches outward to where the ground drops away instead.
 */
function waterfallFrom(b: Builder, x: number, z: number, dx: number, dz: number, width: number, reach: number, fromTop = false): WaterfallInfo {
  let lx: number;
  let lz: number;
  let ly: number;
  let fx: number;
  let fz: number;
  if (fromTop) {
    ly = b.col.terrainAt(x, z);
    [lx, lz] = edgeAt(b, x, z, dx, dz, ly - 0.4);
    fx = dx;
    fz = dz;
  } else {
    // Walls top out near 36; pour from just below the rim.
    const [ax, az] = faceAt(b, x, z, dx, dz, 30);
    ly = Math.min(36, b.col.terrainAt(ax + dx * 3, az + dz * 3)) - 0.6;
    [lx, lz] = faceAt(b, x, z, dx, dz, ly);
    fx = -dx;
    fz = -dz;
  }
  const n = Math.hypot(fx, fz) || 1;
  const w = new Waterfall(b.game, b.level.root, lx - (fx / n) * 0.6, ly + 0.3, lz - (fz / n) * 0.6, fx / n, fz / n, width, reach, 0);
  b.level.props.push(w);
  return { x: lx + (fx / n) * reach, z: lz + (fz / n) * reach };
}

const windFrag = /* glsl */ `
#include <common>
#include <fog_pars_fragment>
uniform float uTime;
uniform float uAlpha;
varying vec2 vUv;
varying float vS;
float h1(float n) { return fract(sin(n * 91.3458) * 47453.5453); }
void main() {
  // Short slanted dashes that spiral upward: wind, not water.
  float slant = vUv.x * 14.0 + vUv.y * 0.35;
  float c = floor(slant);
  float f = fract(slant);
  float t = vUv.y * 0.22 - uTime * (0.9 + h1(c) * 0.8) + h1(c + 3.0) * 10.0;
  float ft = fract(t);
  float dash = smoothstep(0.0, 0.08, ft) * (1.0 - smoothstep(0.14, 0.3, ft)) * (1.0 - abs(f - 0.5) * 2.0);
  float fade = smoothstep(0.0, 0.12, vS) * (1.0 - smoothstep(0.75, 1.0, vS));
  gl_FragColor = vec4(vec3(0.78, 1.0, 0.9), dash * fade * uAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

/** Makes an updraft readable: swirling streaks of rising wind and drifting motes. */
class WindColumn implements Prop {
  private meshes: THREE.Mesh[] = [];
  private uniforms: Record<string, THREE.IUniform>;
  private fxT = 0;
  constructor(private game: Game, parent: THREE.Object3D, private u: Updraft) {
    this.uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uAlpha: { value: 0.55 } }]);
    const m = new THREE.ShaderMaterial({
      uniforms: this.uniforms, vertexShader: fallVert, fragmentShader: windFrag, transparent: true, depthWrite: false, fog: true,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    });
    for (const k of [0.9, 0.55]) {
      const mesh = new THREE.Mesh(openColumn(u.r * k, u.y0, u.y1), m);
      mesh.position.set(u.x, 0, u.z);
      mesh.rotation.y = k * 3;
      mesh.renderOrder = 7;
      parent.add(mesh);
      this.meshes.push(mesh);
    }
  }
  update(dt: number): void {
    const g = this.game;
    this.uniforms.uTime!.value = g.realTime;
    this.meshes.forEach((m, i) => (m.rotation.y += dt * (i ? -1.1 : 0.7)));
    this.fxT -= dt;
    if (this.fxT > 0) return;
    this.fxT = 0.09;
    const u = this.u;
    if (Math.hypot(g.player.x - u.x, g.player.z - u.z) > 70) return;
    const a = rng.next() * Math.PI * 2;
    const r = rng.next() * u.r * 0.9;
    const y = u.y0 + rng.next() * (u.y1 - u.y0) * 0.4;
    g.fx.emit(u.x + Math.sin(a) * r, y, u.z + Math.cos(a) * r, {
      count: 1, speed: 7, dir: [Math.cos(a) * 0.3, 1, -Math.sin(a) * 0.3], spread: 0.1, life: [1.2, 2.2], size: [0.5, 0.9], sizeEnd: 2.2,
      color: 0xf2fbff, alpha: 0.3, additive: false, drag: 0.2,
    });
    if (rng.chance(0.35)) {
      g.fx.emit(u.x + Math.sin(a + 2) * r, y, u.z + Math.cos(a + 2) * r, {
        count: 1, speed: 8, dir: [0, 1, 0], spread: 0.25, life: [1.2, 2], size: [0.12, 0.2], sizeEnd: 1, color: 0x9ae8a0, bright: 1.2, drag: 0.2,
      });
    }
  }
}

/** An open tube from y0 to y1 with the attributes the flow shaders read. */
function openColumn(r: number, y0: number, y1: number): THREE.BufferGeometry {
  const seg = 18;
  const rows = 6;
  const pos: number[] = [];
  const uv: number[] = [];
  const ss: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= rows; i++) {
    const s = i / rows;
    const y = y0 + (y1 - y0) * s;
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      pos.push(Math.sin(a) * r, y, Math.cos(a) * r);
      uv.push(j / seg, y - y0);
      ss.push(s);
    }
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < seg; j++) {
      const a = i * (seg + 1) + j;
      const b = a + seg + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aS', new THREE.Float32BufferAttribute(ss, 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

function windColumn(b: Builder, u: Updraft): void {
  b.level.props.push(new WindColumn(b.game, b.level.root, u));
}

/** Low mist drifting over the gorge water near the dragon. */
class Mist implements Prop {
  private t = 0;
  constructor(private game: Game) {}
  update(dt: number): void {
    this.t += dt * 7;
    const g = this.game;
    const p = g.player;
    while (this.t >= 1) {
      this.t -= 1;
      const a = rng.next() * Math.PI * 2;
      const r = 8 + rng.next() * 30;
      const x = p.x + Math.sin(a) * r;
      const z = p.z + Math.cos(a) * r;
      if (g.col.terrainAt(x, z) > -0.5) continue;
      g.fx.emit(x, 0.6 + rng.next() * 2, z, {
        count: 1, speed: 0.5, dir: [1, 0.1, 0.4], spread: 0.4, life: [3, 5], size: [2.5, 4], sizeEnd: 1.8, color: 0xeaf6fa,
        alpha: 0.22, additive: false, drag: 0.3,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// The storm: the Stormspire needle, its clouds and the lightning
// ---------------------------------------------------------------------------

function cloudMat(color: number, emissive = 0): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true, emissive, emissiveIntensity: 1 });
  m.fog = false;
  return m;
}

/** Fair-weather clouds over the canyon. */
function skyClouds(b: Builder): void {
  const m = cloudMat(0xf4f8fb, 0x405060);
  const r = b.decor.rng;
  for (let i = 0; i < 12; i++) {
    const x = (r.next() - 0.5) * 320;
    const z = -40 + r.next() * 220;
    const y = 85 + r.next() * 30;
    for (let k = 0; k < 4; k++) {
      const s = 7 + r.next() * 8;
      b.decor.add(GEO.blob(), m, x + (k - 1.5) * s * 0.9, y + r.next() * 3, z + r.signed() * 4, s * 1.4, s * 0.55, s, 0, r.next() * 6, 0, false);
    }
  }
}

class StormSky implements Prop {
  private clouds = new THREE.Group();
  private crystal: THREE.MeshStandardMaterial;
  private t = 2;
  private glowT = 0;
  readonly tip: THREE.Vector3;
  private from = new THREE.Vector3();
  constructor(private b: Builder, private x: number, private z: number) {
    const root = b.level.root;
    // The Stormspire itself: a jagged needle rising out of the lake.
    const rock = mat(0x48586a, { rough: 0.95, flat: true });
    const rock2 = mat(0x3a4858, { rough: 0.95, flat: true });
    let y = -4;
    let r = 9;
    let ox = x;
    let oz = z;
    for (let i = 0; i < 7; i++) {
      const h = 12 - i * 0.6;
      const r1 = r * 0.78;
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r, h, 7, 1), i % 2 ? rock2 : rock);
      seg.position.set(ox, y + h / 2, oz);
      seg.rotation.y = i * 0.9;
      root.add(seg);
      for (let k = 0; k < 2; k++) {
        const a = i * 1.7 + k * 3.1;
        const spur = new THREE.Mesh(new THREE.ConeGeometry(r * 0.35, h * 0.9, 5), rock2);
        spur.position.set(ox + Math.sin(a) * r * 0.8, y + h * 0.35, oz + Math.cos(a) * r * 0.8);
        spur.rotation.set(Math.cos(a) * 0.4, a, -Math.sin(a) * 0.4);
        root.add(spur);
      }
      y += h - 0.3;
      r = r1;
      ox += jitter(i, 3) * 0.8;
      oz += jitter(i, 4) * 0.8;
    }
    this.crystal = matUnique(0x9fe8ff, { rough: 0.1, metal: 0.2, emissive: 0x7ac8ff, emissiveIntensity: 0.6, flat: true });
    for (let k = 0; k < 5; k++) {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), this.crystal);
      c.scale.set(0.9, 3.2 - k * 0.3, 0.9);
      c.position.set(ox + (k ? Math.sin(k * 1.3) * 1.5 : 0), y + 2.2, oz + (k ? Math.cos(k * 1.3) * 1.5 : 0));
      c.rotation.set(k ? Math.cos(k) * 0.4 : 0, k, k ? Math.sin(k) * 0.4 : 0);
      root.add(c);
    }
    this.tip = new THREE.Vector3(ox, y + 5, oz);
    // A crown of storm clouds turning around the needle, open in the middle
    // so the bolts come down through the eye.
    const dark = cloudMat(0x46526c, 0x182030);
    const mid = cloudMat(0x66728c, 0x1c2434);
    for (let i = 0; i < 13; i++) {
      const a = (i / 13) * Math.PI * 2;
      const rr = 24 + (i % 3) * 10;
      for (let k = 0; k < 3; k++) {
        const s = 6 + ((i * 7 + k * 3) % 5);
        const m = new THREE.Mesh(GEO.blob(), (i + k) % 2 ? dark : mid);
        m.scale.set(s * 1.4, s * 0.42, s);
        m.position.set(Math.sin(a + k * 0.14) * rr, this.tip.y + 13 + (k - 1) * 2 + (i % 4) * 1.5, Math.cos(a + k * 0.14) * rr);
        m.rotation.y = a;
        this.clouds.add(m);
      }
    }
    this.clouds.position.set(ox, 0, oz);
    root.add(this.clouds);
  }

  update(dt: number): void {
    const g = this.b.game;
    this.clouds.rotation.y += dt * 0.03;
    this.t -= dt;
    this.glowT = Math.max(0, this.glowT - dt * 2.5);
    this.crystal.emissiveIntensity = 0.6 + this.glowT * 2.5;
    if (this.t > 0) return;
    this.t = 1.8 + rng.next() * 3.2;
    // Strike the needle from somewhere in the cloud crown.
    const a = rng.next() * Math.PI * 2;
    const rr = 16 + rng.next() * 18;
    this.from.set(this.tip.x + Math.sin(a) * rr, this.tip.y + 12 + rng.next() * 6, this.tip.z + Math.cos(a) * rr);
    const d = Math.hypot(g.player.x - this.x, g.player.z - this.z);
    const w = 0.6 + Math.min(2.2, d / 60);
    g.fx.arc(this.from, this.tip, 0xeaf8ff, w, 0.26, 0.28);
    if (rng.chance(0.5)) {
      // A fork down toward the lake.
      const down = new THREE.Vector3(this.tip.x + rng.signed() * 18, this.tip.y - 25 - rng.next() * 20, this.tip.z + rng.signed() * 18);
      g.fx.arc(this.tip, down, 0xbfe8ff, w * 0.6, 0.2, 0.4);
    }
    g.fx.flash(this.tip.x, this.tip.y, this.tip.z, 0xbfe8ff, 5, 70, 0.3);
    this.glowT = 1;
    const vol = Math.max(0, 1 - d / 280) * 0.5;
    if (vol > 0.03) setTimeout(() => g.audio.play('rumble', 0.45 + rng.next() * 0.2, vol), Math.min(1500, d * 3));
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * A crumbling stone. Unlike the shared CrumblePlatform its collider is marked
 * dynamic, so the dragon never records it as safe ground to respawn on.
 */
class Crumble implements Prop {
  private solid: Solid;
  private mesh: THREE.Mesh;
  private timer = -1;
  private down = 0;
  constructor(private game: Game, private x: number, private y: number, private z: number, w: number, d: number) {
    this.solid = makeBox(x, z, w / 2, d / 2, y - 0.6, y);
    this.solid.dynamic = true;
    this.solid.surface = 'stone';
    game.col.add(this.solid);
    const m = matUnique(0x9aa4a0, { rough: 1, flat: true });
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, d), m);
    this.mesh.position.set(x, y - 0.3, z);
    this.mesh.castShadow = this.mesh.receiveShadow = true;
    // Cracks, so it reads as fragile.
    const crack = mat(0x3a4448, { rough: 1 });
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.03, 0.06), crack);
      c.position.set(0, 0.31, (i - 1) * d * 0.25);
      c.rotation.y = (i - 1) * 0.6 + 0.3;
      this.mesh.add(c);
    }
    game.level!.root.add(this.mesh);
    this.solid.onStand = (who) => {
      if (who === game.player.body && this.timer < 0 && this.down <= 0) this.timer = 0;
    };
  }

  update(dt: number): void {
    const s = this.solid;
    s.dx = s.dy = s.dz = s.dyaw = 0;
    if (this.timer >= 0) {
      this.timer += dt;
      this.mesh.position.x = this.x + Math.sin(this.timer * 60) * 0.06;
      if (this.timer > 0.7) {
        this.timer = -1;
        this.down = 4;
        s.enabled = false;
        this.game.fx.rocks(this.x, this.y, this.z, 10, 0x9aa4a0);
        this.game.sfx('rumble', this.x, this.y, this.z, 1.4, 0.5);
      }
    }
    if (this.down > 0) {
      this.down -= dt;
      this.mesh.position.y -= dt * 8;
      if (this.down <= 0) {
        s.enabled = true;
        this.mesh.position.set(this.x, this.y - 0.3, this.z);
        this.game.fx.sparkle(this.x, this.y, this.z, 0x9fe8ff, 8);
      }
    }
    this.mesh.visible = this.down <= 0 || this.down > 3;
  }
}

/**
 * Keeps sentries on small rock pillars. Idle enemies wander a few metres
 * around their post, which is wider than a pillar top; this reels them back.
 */
class Tether implements Prop {
  private posts: { x: number; z: number; r: number }[] = [];
  constructor(private game: Game) {}
  add(x: number, z: number, r: number): void {
    this.posts.push({ x, z, r });
  }
  update(): void {
    for (const e of this.game.enemies) {
      if (!e.alive || e.def.flying || e.state === 'air') continue;
      for (const p of this.posts) {
        const dx = e.x - p.x;
        const dz = e.z - p.z;
        const d = Math.hypot(dx, dz);
        if (d <= p.r || d > p.r + 4) continue;
        e.body.x = p.x + (dx / d) * p.r;
        e.body.z = p.z + (dz / d) * p.r;
        e.body.vx *= 0.3;
        e.body.vz *= 0.3;
      }
    }
  }
}

/** Notices when a timed brazier goes out, so Flick can say something. */
class TorchWatch implements Prop {
  private lit = 0;
  private told = false;
  private done = false;
  constructor(game: Game, private torches: Torch[]) {
    game.level!.on('falls-bellgate', () => (this.done = true));
  }
  update(): void {
    if (this.done) return;
    const n = this.torches.filter((t) => t.lit).length;
    if (n < this.lit && !this.told) {
      this.told = true;
      say('Too slow! They burn out after a while. Light all three quickly, one after another!', 6);
    }
    this.lit = n;
  }
}

/** The shrine's bell. "Ring once for rain, twice for thunder. Never three times." */
class RainBell implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius = 0.9;
  readonly height = 1.4;
  private root = new THREE.Group();
  private swing = 0;
  private rings = 0;
  private cd = 0;
  private resetT = 0;
  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number) {
    const bronze = mat(0x9a7a3a, { rough: 0.35, metal: 0.7 });
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.8, 1.2, 12, 1, true), bronze);
    bell.position.y = -0.6;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), bronze);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 6, 20), bronze);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = -1.2;
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 5), mat(0xc8b080));
    rope.position.y = 0.5;
    const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(0x4a3a2a));
    clapper.position.y = -1.1;
    this.root.add(bell, cap, lip, rope, clapper);
    this.root.position.set(x, y + 1.4, z);
    this.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    game.level!.root.add(this.root);
  }

  takeHit(hit: Hit): HitResult {
    if (this.cd > 0 || hit.source === 'breath') return 'none';
    const g = this.game;
    this.cd = 0.5;
    this.swing = 1;
    this.rings++;
    this.resetT = 8;
    g.sfx('switch', this.x, this.y, this.z, 0.5, 1);
    g.sfx('crystalBreak', this.x, this.y, this.z, 0.4, 0.6);
    g.fx.ring(this.x, this.y + 0.2, this.z, 0.5, 5, 0xf5d27a, 0.6);
    if (this.rings === 1) {
      // Rain.
      for (let i = 0; i < 40; i++) {
        g.fx.emit(this.x + rng.signed() * 9, this.y + 9, this.z + rng.signed() * 9, {
          count: 1, speed: 12, dir: [0, -1, 0], spread: 0.05, life: [0.6, 0.9], size: [0.05, 0.08], sizeEnd: 1, color: 0xbfe8ff, alpha: 0.8, additive: false,
        });
      }
    } else if (this.rings === 2) {
      g.audio.play('rumble', 0.5, 0.6);
      g.shake(0.2, 0.4);
    } else if (this.rings === 3) {
      const top = new THREE.Vector3(this.x + 6, this.y + 30, this.z - 4);
      const bot = new THREE.Vector3(this.x + 4.5, this.y - 1.5, this.z - 3);
      g.fx.arc(top, bot, 0xeaf8ff, 0.4, 0.3, 0.3);
      g.fx.explosion(bot.x, bot.y + 0.5, bot.z, 1.2, 0xbfe8ff, 0x3a6ac8);
      g.sfx('zap', bot.x, bot.y, bot.z, 0.7);
      g.sfx('explosion', bot.x, bot.y, bot.z, 1.4, 0.7);
      g.shake(0.4, 0.3);
      say('It SAID never three times! Leave the bell alone!', 4);
      this.rings = 0;
    }
    return 'hit';
  }

  update(dt: number): void {
    this.cd = Math.max(0, this.cd - dt);
    this.swing = Math.max(0, this.swing - dt * 0.6);
    this.root.rotation.z = Math.sin(this.game.time * 7) * 0.35 * this.swing;
    if (this.resetT > 0) {
      this.resetT -= dt;
      if (this.resetT <= 0) this.rings = 0;
    }
  }
}

// ---------------------------------------------------------------------------
// Scenery pieces
// ---------------------------------------------------------------------------

/** Fills a rim notch from the top of its gate up to the rim, so nobody glides over the gate. */
function lintel(b: Builder, x: number, z: number, yaw: number, y0: number): void {
  b.box(x, y0, z, 9.5, 30.5 - y0, 1.6, STONE_DARK, { yaw, trim: STONE });
  const rune = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.07, 6, 20), new THREE.MeshBasicMaterial({ color: 0x7ac8ff }));
  rune.position.set(x - Math.sin(yaw) * 0.82, y0 + 1.7, z - Math.cos(yaw) * 0.82);
  rune.rotation.y = yaw;
  b.level.root.add(rune);
}

function tent(b: Builder, x: number, z: number): void {
  const y = b.y(x, z);
  b.box(x, y, z, 2.8, 2.4, 2.8, 0x3a2848, { noMesh: true });
  b.decor.add(GEO.cone(), mat(0x3a2848, { rough: 0.95, flat: true }), x, y, z, 2.1, 3.1, 2.1, 0, jitter(x) * 3, 0);
  b.decor.glowCrystal(x + 1.7, y, z + 1.7, 1, 0xb04cff);
}

/** The duelling floor on the spire top: a slate disc ringed with storm runes. Returns its top. */
function arenaFloor(b: Builder, x: number, ground: number, z: number, r: number): number {
  const topY = ground + 0.15;
  const s = makeCyl(x, z, r, ground - 1.5, topY);
  b.col.add(s);
  const slab = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.4, 1.2, 48), mat(0x56626e, { rough: 0.9, flat: true }));
  slab.position.set(x, topY - 0.6, z);
  slab.receiveShadow = true;
  b.level.root.add(slab);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(r + 0.05, 0.22, 6, 56), mat(0x8a96a0, { rough: 0.8, flat: true }));
  trim.rotation.x = Math.PI / 2;
  trim.position.set(x, topY, z);
  b.level.root.add(trim);
  const rune = new THREE.MeshBasicMaterial({ color: 0x7ac8ff, transparent: true, opacity: 0.55 });
  for (const rr of [r * 0.42, r * 0.82]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(rr - 0.12, rr + 0.12, 64).rotateX(-Math.PI / 2), rune);
    ring.position.set(x, topY + 0.02, z);
    b.level.root.add(ring);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.22, r * 0.36).rotateX(-Math.PI / 2), rune);
    const m = r * 0.62;
    bar.position.set(x + Math.sin(a) * m, topY + 0.02, z + Math.cos(a) * m);
    bar.rotation.y = a;
    b.level.root.add(bar);
  }
  return topY;
}

/** A rim crag you can stand on: a jagged rock column with a flat top. */
function crag(b: Builder, x: number, z: number, base: number, h: number, r: number): void {
  const s = makeCyl(x, z, r, base - 2, base + h);
  b.col.add(s);
  const rock = mat(0x4e5a68, { rough: 0.95, flat: true });
  b.decor.add(GEO.cyl6(), rock, x, base - 1, z, r * 1.05, h + 1, r * 1.05, 0, jitter(x + z) * 3, 0);
  b.decor.add(GEO.rock(), rock, x, base + h - 0.15, z, r * 1.05, 0.35, r * 1.05, 0, jitter(x) * 3, 0);
  for (let i = 0; i < 3; i++) {
    const a = jitter(x * 3 + i, 2) * Math.PI;
    b.decor.add(GEO.cone(), rock, x + Math.sin(a) * r * 0.9, base - 0.5, z + Math.cos(a) * r * 0.9, r * 0.45, h * (0.5 + i * 0.15), r * 0.45,
      Math.cos(a) * 0.25, 0, -Math.sin(a) * 0.25);
  }
  b.decor.glowCrystal(x + r * 0.7, base + h, z, 0.8, 0x9fe8ff);
}

/** A storm roc's nest: a ring of storm-bleached sticks and one great feather. */
function rocNest(b: Builder, x: number, y: number, z: number): void {
  const wood = mat(0x8a7a64, { rough: 1 });
  const dark = mat(0x5a4a3a, { rough: 1 });
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const r = 2.1 + jitter(i, 5) * 0.3;
    b.decor.add(GEO.cyl6(), i % 3 ? wood : dark, x + Math.sin(a) * r, y + 0.25 + (i % 3) * 0.18, z + Math.cos(a) * r, 0.09, 2.4, 0.09,
      Math.PI / 2, a + 0.6, 0, false);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.45, 6, 18), dark);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, y + 0.3, z);
  ring.castShadow = true;
  b.level.root.add(ring);
  // A shed feather, taller than Aster.
  const f = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 3.2), new THREE.MeshStandardMaterial({ color: 0x44639e, roughness: 0.6, side: THREE.DoubleSide, flatShading: true }));
  f.position.set(x - 1.4, y + 1.5, z + 1.2);
  f.rotation.set(0.2, 0.7, 0.35);
  b.level.root.add(f);
  const quill = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 3.4, 5), mat(0xe8e0c8));
  quill.position.copy(f.position);
  quill.rotation.copy(f.rotation);
  b.level.root.add(quill);
  for (let i = 0; i < 3; i++) {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xd8e0e8, { rough: 0.5 }));
    shell.position.set(x + 0.6 + i * 0.4, y + 0.2, z - 0.8 + i * 0.3);
    shell.rotation.x = Math.PI * (0.6 + i * 0.2);
    b.level.root.add(shell);
  }
}
