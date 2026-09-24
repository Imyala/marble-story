import * as THREE from 'three';
import type { LevelDef, Builder } from '../world/level';
import { Npc } from '../world/level';
import { ambient, paint, jitter, mix, bossFight, Cage, rescueWarden } from './common';
import { Graveljaw } from '../enemies/bosses/graveljaw';
import { STONEHIDE } from '../game/story';
import type { Game } from '../game/game';
import type { Arena, Geyser, Prop } from '../entities/props';
import { makeHit } from '../game/types';
import { makeCyl, makeBox } from '../world/collision';
import { GEO } from '../render/decor';
import { mat, glow } from '../render/materials';
import { smoothstep } from '../core/math';
import { rng } from '../core/rng';

/**
 * Stonewild Plains: golden grass on a stair of mesas, cut by river gorges.
 * Teaches freezing hot springs into pillars, burning vines, lightning
 * crystals, the Shellback flip, the three elemental reactions and the Ground
 * Pound, then ends with Graveljaw in a sandy canyon. Stonehide waits in a
 * cage on the canyon rim.
 *
 * Route (south to north): the Vale -> hot spring and the old terrace wall ->
 * the Meadow -> vine-choked gatehouse -> the Colonnade (arena) -> the gorge
 * springs -> Cairn Heights -> the Circle of the Fallen (reaction arena) ->
 * down to the Burrow Fields (arena, pressure plate) -> Graveljaw's canyon.
 *
 * Every step up is either a built wall or a cliff fenced by invisible bounds
 * over the water, so the springs and gates cannot be climbed around.
 */

const WATER = -3;
const SAND = 0xd8c08a;
const STONE = 0xb8a88c;
const STONE_DARK = 0x8a7c66;
const SANDSTONE = 0xb88a5e;
const GOLD = [0xd9b85a, 0xc79f45, 0xb0a44e] as const;
const FLOWERS = [0xffffff, 0xff9ab8, 0x9ab8ff, 0xffd84a, 0xd88aff, 0xff7a4a] as const;

// Mesa heights.
const VALE = 0.8;
const MEADOW = 6.5;
const TERRACE = 11.5;
const HEIGHTS = 19.3;
const FIELDS = 5;
const FLOOR = -1;

// Where things are.
const BASIN = { x: 0, z: 256, r: 18.5 };
const CIRCLE = { x: 0, z: 176, r: 14.5 };
const COLONNADE = { x: 0, z: 108, r: 12.5 };
/** Where Stonehide lands after breaking out of his cage on the rim. */
const STONEHIDE_SPOT = { x: 0, z: 270 };

/** South edge of the Meadow mesa (the middle of its cliff). */
const meadowEdgeZ = (x: number) => 62 - Math.sqrt(35 * 35 - (x / 1.45) ** 2) - 0.6;
/** South edge of Cairn Heights. */
const heightsEdgeZ = (x: number) => 148 - Math.sqrt(13 * 13 - (x / 2.2) ** 2) - 0.75;

const base = paint({
  under: 0x4a4030, shore: 0x8a7a50, grass: 0xc2a24a, grass2: 0xd6b75a, rock: SANDSTONE, path: 0xb08e62, high: 0xb8a458, highAt: 14, water: WATER,
});

function colorer(x: number, z: number, h: number, slope: number, path: number): number {
  let c = base(x, z, h, slope, path);
  // Canyon strata on the cliffs.
  if (slope > 0.6) c = mix(c, 0x8a5a3a, (Math.sin(h * 1.25) * 0.5 + 0.5) * 0.4 * Math.min(1, (slope - 0.6) * 2));
  // Graveljaw's sand, and the dusty burrow patches.
  const db = Math.hypot(x - BASIN.x, z - BASIN.z);
  if (db < 22 && h < 4) c = mix(c, SAND, smoothstep(22, 17, db) * (1 - Math.min(1, slope)));
  if (z > 205 && z < 238 && h > 3 && h < 7) {
    const n = Math.sin(x * 0.21 + z * 0.13) + Math.sin(x * 0.07 - z * 0.19);
    if (n > 0.6) c = mix(c, SAND, Math.min(1, (n - 0.6) * 2) * 0.7);
  }
  return c;
}

export const plains: LevelDef = {
  id: 'plains',
  name: 'Stonewild Plains',
  subtitle: 'Tall grass over stone older than dragons',
  music: 'plains',
  killY: -14,
  spawn: [0, -24, 0],
  sky: {
    top: 0x4a78c0, horizon: 0xf8c888, bottom: 0xe8c090, sunDir: [0.55, 0.26, -0.45], sunColor: 0xffc27a, sunIntensity: 2.3,
    hemiSky: 0xbcd4f0, hemiGround: 0x8a6a3a, hemiIntensity: 1.1, fogNear: 70, fogFar: 250, fog: 0xecc79a,
  },
  water: { level: WATER, deep: 0x2a5058, shallow: 0x5a9a8a, glint: 0xfff0c0, opacity: 0.86 },
  terrain: {
    x0: -75, z0: -42, sizeX: 150, sizeZ: 324, cell: 1.5,
    color: colorer,
    shape: (s) => {
      s.base(-7).noise(0.8, 0.05, 11);
      // Far hills around the plains.
      s.ridge([[-72, -44], [-72, 60], [-66, 160], [-70, 290]], 12, 24);
      s.ridge([[72, -44], [72, 60], [66, 160], [70, 290]], 12, 24);
      s.ridge([[-72, -44], [72, -44]], 10, 17);
      // The Vale: a flat strip between two grassy hills.
      s.path([[0, -60, VALE], [0, 26, VALE]], 56, 3, false);
      s.ridge([[-26, -40], [-26, 16]], 6, 6.5);
      s.ridge([[26, -40], [26, 16]], 6, 6.5);
      s.mound(-16, -8, 7, 2.2);
      s.mound(11, -3, 6, 1.1);
      s.flatten(18, -16, 4.5, VALE, 1.5);
      s.trail([[0, -22], [0, -6], [-2, 3], [-2, 13], [0, 22]], 3);
      // A stream across the Vale.
      s.path([[-45, 5, -5], [-14, 10, -5], [4, 7, -5], [45, 10, -5]], 4, 2, false, false);
      // Stonewild Meadow.
      s.island(0, 62, 35, MEADOW, 1.2, 0, 1.45, 1);
      s.mound(20, 58, 11, 2.4);
      s.mound(-24, 76, 9, 1.8);
      s.mound(10, 79, 7, 1.2);
      s.mound(-30, 46, 7, 1.4);
      s.mound(-6, 64, 6, 0.9);
      s.mound(28, 42, 5, 1.0);
      s.trail([[0, 28], [3, 44], [8, 60], [4, 76], [0, 87]], 3);
      // The Colonnade terrace.
      s.island(COLONNADE.x, COLONNADE.z, COLONNADE.r, TERRACE, 1.3, 0);
      // The gatehouse stair cuts a slot up through the terrace edge.
      s.path([[0, 88.1, MEADOW], [0, 97.2, TERRACE]], 5.2, 0.8, false, false);
      // Cairn Heights, the Circle of the Fallen and the north ledge.
      s.island(0, 148, 13, HEIGHTS, 1.5, 0, 2.2, 1);
      s.mound(-14, 146, 5, 0.8);
      s.pit(9, 154, 3.2, -8, 1.2);
      s.island(CIRCLE.x, CIRCLE.z, 14.2, HEIGHTS, 1.5, 0);
      s.island(0, 196, 6.5, HEIGHTS, 1.2, 0);
      s.island(-44, 146, 4.5, 13, 1.2, 0.15);
      // The long ramp down to the Burrow Fields.
      s.path([[0, 199, HEIGHTS], [9, 204, 16.6], [15, 210, 12.8], [12, 216, 9], [5, 217, 5.4]], 5, 2.5);
      // Burrow Fields.
      s.island(0, 221, 15, FIELDS, 1.5, 0.2, 1.9, 1);
      s.mound(-16, 213, 3, 0.8);
      s.mound(19, 226, 3, 0.7);
      s.mound(-21, 228, 2.5, 0.6);
      // Graveljaw's canyon: a mesa with a sandy crater, a cleft through its rim.
      s.island(BASIN.x, BASIN.z, 24.5, 10, 2.5, 0.3);
      s.pit(BASIN.x, BASIN.z, 18, FLOOR, 3);
      s.path([[0, 229, FIELDS], [0, 243, FLOOR]], 5.6, 1.2, true, false);
    },
  },

  build(b: Builder) {
    const g = b.game;
    ambient(b, 'pollen', 16);
    fences(b);

    // --- The Vale ---------------------------------------------------------------------
    // The arrival circle.
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * 0.35 + (i / 6) * Math.PI * 1.3;
      standingStone(b, Math.sin(a) * 7.5, -24 + Math.cos(a) * 7.5, 2.6 + (i % 3) * 0.6, i + 1);
    }
    b.crystal(-3, -18, 'blue', 8);
    b.crystal(4, -17, 'blue', 8);
    b.crystal(-10, -26, 'green', 3);
    b.gemLine([[0, -18], [0, -6], [-2, 2]]);
    b.story('intro-look', 0, -14, 5, () => g.hud.flick('Stonehide is out here somewhere. The trail runs north, past the stream.', 5));

    // The Sleeping Giant: three sandstone hoodoos, a relic on the tallest.
    const hy = b.y(-19, -4);
    spire(b, -15.5, -2.5, 1.3, hy + 2.0);
    spire(b, -18, -5, 1.2, hy + 4.0);
    spire(b, -20.8, -3.3, 1.1, hy + 6.0);
    b.collectible('relic1', 'relic', -20.8, -3.3, hy + 6.0, 'plains1');
    b.crystal(-14, -9, 'blue', 12, true);

    // A sealed alcove in the east hill: cracked rock, Earth only.
    const ax = 18;
    const az = -16;
    const ay = b.y(ax, az);
    b.wall(ax + 0.2, az - 2.4, ax + 4.4, az - 2.4, ay - 0.5, 4.4, 1, STONE_DARK);
    b.wall(ax + 0.2, az + 2.4, ax + 4.4, az + 2.4, ay - 0.5, 4.4, 1, STONE_DARK);
    b.wall(ax + 4.4, az - 2.9, ax + 4.4, az + 2.9, ay - 0.5, 4.4, 1, STONE_DARK);
    b.platform(ax + 2.2, ay + 4.3, az, 6, 6.2, STONE, 0.5);
    b.gate(ax - 0.2, az, 4.2, 3.9, Math.PI / 2, 'rock', '', ay);
    b.collectible('mana2', 'mana', ax + 2.4, az, ay);
    b.crystal(ax + 3.2, az + 1.2, 'green', 4, false, ay);
    if (!g.save.elements.includes('earth')) {
      b.story('alcove', ax - 3, az, 4, () => g.hud.flick('Cracked rock. Our breath can\'t even scratch that. Maybe a Warden of Earth could...', 6));
    }

    // Toppled column bridge over the stream.
    toppledColumn(b, -2, 8, 0.12, 10, 0.58, 0.12);
    b.gemLine([[-2.6, 4], [-1.4, 13]], 'blue', 1.5);
    b.enemy('grunt', 6, -2, Math.PI);
    b.enemy('grunt', -5, 1, Math.PI);
    b.enemy('slinger', 8, 18, Math.PI);
    b.crystal(12, 16, 'red', 3);
    b.crystal(-12, 18, 'blue', 10);
    b.gemLine([[0, 14], [0, 21]]);

    // The old terrace wall and the hot spring that climbs it.
    const wallPts: [number, number][] = [];
    for (let x = -28.5; x <= 28.51; x += 57 / 8) wallPts.push([x, meadowEdgeZ(x)]);
    stoneWall(b, wallPts, VALE - 1, MEADOW - 0.2, 2.4, STONE, true);
    // Too short to reach the wall top on its own, and too hot to ride: freeze it, hop on, then jump and flap.
    const spring = b.geyser(0, meadowEdgeZ(0) - 2.35, 1.1, 2.4, true, '', VALE);
    b.story('spring', 0, 16, 6, () => g.hud.flick('That spring is boiling hot! Freeze it with Ice (3), hop on, then jump and flap up the wall.', 7));
    b.gems(0, meadowEdgeZ(0) - 2.35, 'blue', 1, 0, VALE + 3.2);
    b.gems(0, meadowEdgeZ(0) - 0.4, 'blue', 1, 0, MEADOW - 0.4);
    for (const x of [-20, -9, 9, 20]) b.rock(x, meadowEdgeZ(x) - 2.6, 0.7 + Math.abs(jitter(x)) * 0.5, 0x9a8c74, false);

    // --- Stonewild Meadow -------------------------------------------------------------------
    b.checkpoint('meadow', 8, 34, 0);
    b.gemLine([[0, 30], [3, 44], [8, 58]]);
    b.crystal(-6, 36, 'blue', 8);
    b.crystal(14, 38, 'green', 3);
    // A Shellback to learn on.
    b.enemy('crawler', -3, 52, Math.PI);
    b.enemy('grunt', 5, 50, Math.PI);
    b.story('shellback', -3, 46, 7, () => g.hud.flick('A Shellback! Horns and breath bounce off that shell. Flip it with a heavy hit: a Tail whip (E) or a Ground Pound!', 8));
    b.enemy('slinger', 20, 60, Math.PI);
    b.enemy('grunt', -14, 72, Math.PI);
    b.enemy('grunt', -8, 77, Math.PI);
    b.enemy('crawler', 16, 84, Math.PI);
    b.crystal(20, 56, 'blue', 10, true);
    b.crystal(-10, 70, 'red', 3);
    b.crystal(6, 72, 'blue', 8);
    b.gemLine([[8, 60], [4, 76], [0, 84]]);

    // The spiral of the fallen: stepping stones up to a relic.
    const sp = { x: -36, z: 56 };
    for (let i = 0; i < 5; i++) {
      const a = i * 1.1;
      const x = sp.x + Math.sin(a) * 3.9;
      const z = sp.z + Math.cos(a) * 3.9;
      const top = MEADOW + 1.5 * (i + 1);
      b.box(x, MEADOW - 1, z, 1.9, top - MEADOW + 1, 1.9, STONE, { yaw: a, trim: STONE_DARK });
      rune(b, x, top - 0.7, z, a, 0.96);
      if (i === 4) b.collectible('relic3', 'relic', x, z, top, 'plains3');
      else b.gems(x, z, 'blue', 1, 0, top);
    }
    standingStone(b, sp.x, sp.z, 5.5, 40);
    b.crystal(sp.x + 1.5, sp.z - 6, 'mixed', 30, true);
    b.story('spiral', sp.x + 2, sp.z - 7, 6, () => g.hud.flick('So many standing stones... Somebody carved a dragon on every single one.', 6));

    // An overgrown shrine in the east: burn the vines for a heart shard.
    const rx = 37;
    const rz = 73;
    const ry = b.y(rx, rz);
    b.wall(rx - 2.4, rz - 2.6, rx + 2.6, rz - 2.6, ry - 0.5, 4, 1, STONE_DARK);
    b.wall(rx - 2.4, rz + 2.6, rx + 2.6, rz + 2.6, ry - 0.5, 4, 1, STONE_DARK);
    b.wall(rx + 2.6, rz - 3.1, rx + 2.6, rz + 3.1, ry - 0.5, 4, 1, STONE_DARK);
    b.platform(rx + 0.1, ry + 3.9, rz, 6.2, 6.4, STONE, 0.5);
    b.gate(rx - 2.4, rz, 4.4, 3.6, Math.PI / 2, 'vines', '', ry);
    b.collectible('heart2', 'heart', rx + 0.4, rz, ry);
    for (let i = 0; i < 4; i++) toppledColumn(b, rx - 6 + i * 2.2, rz + 7 + jitter(i, 3) * 2, 1.2 + i * 0.4, 3 + i % 2, 0.5);

    // The gatehouse: a stair up the terrace wall, choked with thorny vines.
    const rampPts: [number, number][] = [];
    for (const deg of [90, 115, 140, 165]) rampPts.push(onCircle(COLONNADE, 13.2, deg));
    stoneWall(b, rampPts, MEADOW - 1, TERRACE - 0.2, 1.8, STONE, true);
    const rampW: [number, number][] = [];
    for (const deg of [195, 220, 245, 270]) rampW.push(onCircle(COLONNADE, 13.2, deg));
    stoneWall(b, rampW, MEADOW - 1, TERRACE - 0.2, 1.8, STONE, true);
    const gz = 87.4;
    b.box(-3.3, MEADOW - 1, 92, 1.4, TERRACE + 1.8 - MEADOW, 10.5, STONE_DARK, { trim: STONE });
    b.box(3.3, MEADOW - 1, 92, 1.4, TERRACE + 1.8 - MEADOW, 10.5, STONE_DARK, { trim: STONE });
    b.box(-3.3, TERRACE + 0.8, 87.6, 1.6, 2.4, 1.6, STONE, {});
    b.box(3.3, TERRACE + 0.8, 87.6, 1.6, 2.4, 1.6, STONE, {});
    b.stairs(0, gz + 0.7, 5.2, 0, MEADOW, TERRACE, 13, STONE);
    b.gate(0, gz, 5.4, 5.2, 0, 'vines', '', MEADOW);
    b.story('vines', 0, 83, 5, () => g.hud.flick('Thorny vines are choking the stairs. Burn them! Fire (1) with Right Mouse, or a fireball with Q.', 7));
    b.gemLine([[0, 90], [0, 98]], 'blue', 1.4);

    // --- The Colonnade (arena) -------------------------------------------------------------------
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3;
      const x = COLONNADE.x + Math.sin(a) * 9.2;
      const z = COLONNADE.z + Math.cos(a) * 9.2;
      if (Math.abs(x) < 3.5 && z < COLONNADE.z) continue;
      const broken = i % 3 === 1;
      const h = broken ? 1.3 + (i % 2) * 0.6 : 4.4;
      b.decor.pillar(x, TERRACE, z, 0.6, h, 0xd0c4aa, broken);
      b.col.add(makeCyl(x, z, 0.65, TERRACE - 1, TERRACE + h));
    }
    toppledColumn(b, -5, 104, 0.9, 5, 0.6);
    toppledColumn(b, 6, 113, -0.4, 4.5, 0.6);
    const colonnade = b.arena('colonnade', COLONNADE.x, COLONNADE.z, 14, [
      [{ type: 'grunt', x: -5, z: 112 }, { type: 'grunt', x: 5, z: 112, delay: 0.3 }, { type: 'slinger', x: 0, z: 117, delay: 0.5 }],
      [{ type: 'shieldbearer', x: 0, z: 114 }, { type: 'crawler', x: -6, z: 105, delay: 0.3 }, { type: 'grunt', x: 6, z: 104, delay: 0.5 }],
      [{ type: 'slinger', x: -7, z: 113 }, { type: 'slinger', x: 7, z: 113, delay: 0.2 }, { type: 'grunt', x: 0, z: 104, delay: 0.4 }],
    ], 45);
    colonnade.onStart = () => g.hud.flick('Gloom in the ruins! Tail smashes shields, and your horns can bat bolts right back.', 6);
    colonnade.onClear = () => g.hud.flick('The springs past the ruins go up to the Heights. And the humming is getting louder.', 6);
    b.crystal(-7, 110, 'blue', 8);
    b.crystal(7, 106, 'red', 3);

    // --- The gorge springs ----------------------------------------------------------------------
    const springY = WATER - 0.2;
    const climb = [
      b.geyser(0, 124, 1.2, TERRACE + 0.5 - springY, false, '', springY),
      b.geyser(4, 128, 1.2, 14.6 - springY, false, '', springY),
      b.geyser(-1, 131.3, 1.2, 17.5 - springY, false, '', springY),
    ];
    b.story('gorge', 0, 118.5, 4, () => g.hud.flick('More springs! Freeze one, hop on, freeze the next. The ice melts after a while, so keep moving!', 7));
    b.gems(0, 124, 'blue', 1, 0, TERRACE + 1.4);
    b.gems(4, 128, 'blue', 1, 0, 15.5);
    b.gems(-1, 131.3, 'blue', 1, 0, 18.4);
    // The Needle: a spire off to the side with a heart shard.
    spire(b, 11.2, 127.6, 1.2, 13.6, SANDSTONE, -8);
    b.collectible('heart1', 'heart', 11.2, 127.6, 13.6);
    // The Heights cliff, with stone strata so the springs are the only way up.
    const cliffPts: [number, number][] = [];
    for (let x = -13.8; x <= 13.81; x += 27.6 / 6) cliffPts.push([x, heightsEdgeZ(x)]);
    stoneWall(b, cliffPts, -5, HEIGHTS - 0.2, 2.2, SANDSTONE, false, true);
    // Decorative hoodoos standing in the river beyond reach.
    for (const [x, z, h] of [[-21, 124, 9], [22, 131, 12], [-18, 128, 7], [25, 118, 6], [-26, 112, 5]] as const) spire(b, x, z, 1.6, h, SANDSTONE, -8);
    b.level.props.push(new HotSprings(g, [spring, ...climb]));

    // --- Cairn Heights ----------------------------------------------------------------------------
    b.checkpoint('heights', 5, 139.5, 0);
    b.enemy('stoneGolem', -12, 147, Math.PI);
    b.enemy('wisp', -4, 150, Math.PI);
    b.enemy('wisp', 14, 144, Math.PI);
    b.story('golem', -8, 143, 8, () => g.hud.flick('A Cairn Golem! Stone shrugs off horns, but ice cracks it. Freeze it, then smash it with your Tail!', 7));
    b.crystal(-2, 142, 'blue', 10);
    b.crystal(18, 146, 'green', 3);
    b.crystal(-20, 150, 'blue', 12, true);
    b.gemLine([[5, 142], [0, 150], [0, 158]]);
    // The Hawk's Perch: glide down for a spirit shard, ride the thermal back up.
    // The thermal only starts once you have landed, so it cannot fling you
    // past the perch on the way in.
    b.collectible('mana1', 'mana', -42.5, 146);
    b.crystal(-45.5, 148.5, 'green', 4);
    let thermal = false;
    b.trigger(-44, 146, 4.6, () => {
      if (thermal) return;
      thermal = true;
      b.updraft(-44, 146, 6, 12.5, 30, 38);
      g.fx.motes(-44, 14, 146, 0xfff0c0, 30);
    });
    b.story('perch', -44, 146, 4.6, () => g.hud.flick('Feel that warm air rising? Jump, glide and turn around inside it. It will carry us back up!', 7));

    // The Circle of the Fallen: a ring of monoliths and walls, two doors.
    circleOfTheFallen(b);
    b.switchCrystal(-5.5, 158.5, 'lightning', 'circle-a');
    b.pillar(9, 154, 0.95, -8, HEIGHTS, 0x9a8c74);
    b.switchCrystal(9, 154, 'lightning', 'circle-b', HEIGHTS);
    b.gate(0, CIRCLE.z - 14.0, 7.4, 5.5, 0, 'stone', 'circle-south', HEIGHTS);
    b.gate(0, CIRCLE.z + 14.0, 7.4, 5.5, 0, 'stone', 'circle-north', HEIGHTS);
    let lit = 0;
    const onLit = () => {
      lit++;
      if (lit >= 2) {
        b.level.emit('circle-south');
        g.hud.flick('The door is open! Something is moving around in there...', 5);
      } else g.toast('One crystal hums. Light the other!', 'hint');
    };
    b.level.on('circle-a', onLit);
    b.level.on('circle-b', onLit);
    b.story('circle-door', 0, 156.5, 5, () => g.hud.flick('The door is sealed, and those crystals are dark. They want a spark: breathe Lightning (2) on both of them!', 7));
    const circle = b.arena('circle', CIRCLE.x, CIRCLE.z, 13, [
      [{ type: 'stoneGolem', x: -5, z: 181 }, { type: 'stoneGolem', x: 5, z: 181, delay: 0.4 }, { type: 'grunt', x: 0, z: 185, delay: 0.6 }],
      [{ type: 'wisp', x: -6, z: 176 }, { type: 'wisp', x: 6, z: 176, delay: 0.3 }, { type: 'grunt', x: -4, z: 184, delay: 0.5 }, { type: 'grunt', x: 4, z: 184, delay: 0.7 }],
      [{ type: 'brute', x: 0, z: 182 }, { type: 'grunt', x: -6, z: 172, delay: 0.4 }, { type: 'grunt', x: 6, z: 172, delay: 0.6 }],
    ], 60);
    const watch = new ReactionWatch(g, circle, [
      ['wisp', 'Wisps! Shock them with Lightning (2), then hit them with Fire (1). OVERLOAD!'],
      ['brute', 'A Brute! Set it on fire, then hit it with Ice (3) while it burns. STEAM BURST!'],
    ]);
    b.level.props.push(watch);
    circle.onStart = () => g.hud.flick('Cairn Golems! Freeze one solid with Ice (3), then Tail smash it to SHATTER it!', 7);
    circle.onClear = () => {
      b.level.emit('circle-north');
      const n = watch.count;
      if (n > 0) {
        g.spawnGems(CIRCLE.x, HEIGHTS + 1, CIRCLE.z, { blue: Math.min(12, n) * 10, purple: Math.min(4, n) }, true);
        g.toast(`${n} reaction${n === 1 ? '' : 's'}! Bonus spirit gems.`, 'good');
      }
      g.hud.flick(n >= 3 ? 'Look at you, mixing breaths like a real Warden!' : 'Phew. Mixing your breaths makes fights like that much easier. Just saying.', 6);
    };
    if (g.save.found['arena:plains:circle']) {
      b.level.emit('circle-south');
      b.level.emit('circle-north');
    }

    // --- Down to the Burrow Fields ------------------------------------------------------------------
    b.gemLine([[0, 197], [9, 204], [15, 210], [12, 216]], 'blue', 1.8);
    b.story('ledge', 0, 196, 4, () => g.hud.flick('That camp below... and a canyon beyond it. Stonehide is down there, I can feel it.', 6));
    b.checkpoint('burrow', -5, 211, 0);
    b.enemy('crawler', 20, 216, -Math.PI / 2);
    b.crystal(-10, 212, 'blue', 10);
    b.crystal(22, 219, 'red', 3);
    for (const [x, z] of [[-16, 213], [19, 226], [-21, 228], [-12, 230], [-8, 218]] as const) burrowMound(b, x, z);
    campTents(b);
    const camp = b.arena('camp', 0, 224, 9.5, [
      [{ type: 'totem', x: 0, z: 229 }, { type: 'grunt', x: -5, z: 223, delay: 0.2 }, { type: 'grunt', x: 5, z: 223, delay: 0.4 }, { type: 'slinger', x: 0, z: 219, delay: 0.6 }],
      [{ type: 'shieldbearer', x: -4, z: 226 }, { type: 'crawler', x: 4, z: 226, delay: 0.3 }],
    ], 40);
    camp.onStart = () => g.hud.flick('A Gloom camp! That Totem shields everything near it. Smash the Totem first!', 6);
    const plateHint = () => g.hud.flick('That plate is carved with a worm. Ground Pound it: jump, then Tail (E) in the air!', 7);
    camp.onClear = plateHint;
    if (g.save.found['arena:plains:camp']) b.story('plate', 0, 227, 4, plateHint);
    // The worm door into the canyon.
    b.plate(0, 229.3, 'canyon-door');
    b.box(-3.9, FIELDS - 3, 234, 1.4, 12, 7, STONE_DARK, { trim: STONE });
    b.box(3.9, FIELDS - 3, 234, 1.4, 12, 7, STONE_DARK, { trim: STONE });
    b.box(0, FIELDS + 7.6, 231.2, 9.2, 1.4, 1.6, STONE, {});
    const doorY = b.y(0, 232.2);
    b.gate(0, 232.2, 6.4, 7, 0, 'stone', 'canyon-door', doorY);
    const doorOpen = !!g.save.found['story:plains:door'] || !!g.save.levelsDone.plains;
    b.level.on('canyon-door', () => {
      if (g.save.found['story:plains:door']) return;
      g.save.found['story:plains:door'] = true;
      if (!doorOpen) g.hud.flick('It opened! Careful, Aster. The humming is coming from right below us.', 5);
    });
    if (doorOpen) b.level.emit('canyon-door');
    // Burrow Signs: a hidden plate in the grass opens a cairn.
    b.plate(-22, 214.5, 'plains-cairn');
    const cx = -24;
    const cz = 222;
    const cy = b.y(cx, cz);
    b.wall(cx - 1.8, cz - 1.6, cx - 1.8, cz + 1.6, cy - 0.5, 2.8, 0.8, STONE_DARK);
    b.wall(cx + 1.8, cz - 1.6, cx + 1.8, cz + 1.6, cy - 0.5, 2.8, 0.8, STONE_DARK);
    b.wall(cx - 2.2, cz + 1.6, cx + 2.2, cz + 1.6, cy - 0.5, 2.8, 0.8, STONE_DARK);
    b.platform(cx, cy + 2.7, cz, 4.6, 4, STONE, 0.4);
    b.gate(cx, cz - 1.6, 2.8, 2.3, 0, 'stone', 'plains-cairn', cy);
    b.collectible('relic2', 'relic', cx, cz, cy, 'plains2');

    // --- Graveljaw's canyon ----------------------------------------------------------------------------
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const r = 15 + Math.abs(jitter(i, 2)) * 2.5;
      b.rock(BASIN.x + Math.sin(a) * r, BASIN.z + Math.cos(a) * r, 0.6 + Math.abs(jitter(i, 3)) * 0.5, 0x9a8a6a, false);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.5;
      ribBone(b, BASIN.x + Math.sin(a) * 13, BASIN.z + Math.cos(a) * 13, a);
    }
    b.gemLine([[0, 236], [0, 242]], 'blue', 1.5);
    // Stonehide, caged on a dais in the canyon rim, watching the fight.
    const shelf = { x: 0, z: 278.5 };
    b.platform(shelf.x, 10.3, shelf.z, 10, 7, STONE, 12, { trim: STONE_DARK });
    let cage: Cage | undefined;
    if (!g.save.levelsDone.plains) {
      cage = new Cage(b, shelf.x, shelf.z, 3.6, 6.5);
      b.level.npcs.push(new Npc(g, 'stonehide', STONEHIDE, shelf.x, b.y(shelf.x, shelf.z), shelf.z, Math.PI));
    }
    b.level.onSlam((x, y, z) => {
      const boss = g.boss;
      if (boss instanceof Graveljaw) boss.onGroundPound(x, y, z);
    });
    bossFight(b, {
      id: 'graveljaw', x: BASIN.x, z: BASIN.z, r: BASIN.r, triggerX: 0, triggerZ: 244, triggerR: 4.5,
      spawn: (gg) => new Graveljaw(gg, BASIN.x, gg.col.groundAt(BASIN.x, BASIN.z, 5, 0.3).y, BASIN.z, Math.PI),
      intro: [
        { who: 'flick', text: 'Aster... the sand is moving. The SAND is MOVING.', shot: 'none', action: () => {
          g.shake(0.5, 1.2);
          g.sfx('rumble', BASIN.x, FLOOR, BASIN.z);
          g.fx.dust(BASIN.x, FLOOR, BASIN.z, 30, 0xd0b88c);
        } },
        { who: 'graveljaw', text: 'Grrrnnnhh... A dragonling. Soft scales. Hollow bones. Graveljaw has not tasted dragon since the moons went dark.' },
        { who: 'aster', text: 'Let Stonehide go, you overgrown earthworm!', shot: 'none' },
        { who: 'graveljaw', text: 'The old stone? He crunches too slowly. You will be quicker.', shot: 'none' },
        { who: 'stonehide', text: '...Little one. Watch the sand, not the worm.', shot: 'none' },
        { who: 'flick', text: 'Watch the dust trail! When a red ring opens under you, RUN. Then hit its face while it\'s dazed!', shot: 'none' },
      ],
      onDefeated: (gg) => plainsOutro(gg, cage),
    });
    if (g.save.levelsDone.plains) {
      b.portal(0, 250, Math.PI, 'sanctum', 'Return to the Sanctum', 0x9be06a);
      b.npc('stonehide', STONEHIDE, STONEHIDE_SPOT.x, STONEHIDE_SPOT.z, Math.PI, 'Talk to Stonehide', () => g.say([
        { who: 'stonehide', text: 'The sand is still. It will stay still.' },
      ]));
    }

    scenery(b);
  },

  onEnter(g, fresh) {
    if (fresh && !g.save.found['story:plains:intro']) {
      g.save.found['story:plains:intro'] = true;
      g.say([
        { who: 'flick', text: 'Whoa. Look at all this grass! It\'s taller than you, Aster. Which, to be fair, is not hard.', shot: 'none' },
        { who: 'aster', text: 'Shh. Do you feel that?', shot: 'none', action: () => {
          g.shake(0.18, 1.6);
          g.sfx('rumble', g.player.x, g.player.y, g.player.z, 0.6, 0.8);
        } },
        { who: 'flick', text: 'The ground is... humming. Why is the ground humming?', shot: 'none' },
        { who: 'aster', text: 'Something big is moving down there. Stonehide can\'t be far. Come on.', shot: 'none' },
      ]);
    }
  },
};

// --- invisible bounds ------------------------------------------------------------------------------

/**
 * The playable corridor, drawn over water and hill crests. The left side
 * mirrors the right except for a pocket around the Hawk's Perch.
 */
function fences(b: Builder): void {
  const right: [number, number][] = [
    [28, -38], [28, 31], [40, 38], [52, 50], [55, 62], [52, 76], [44, 86], [30, 92], [18, 95], [13.8, 98],
    [13.8, 135], [32, 137], [34, 148], [30, 158], [15.2, 176],
    [16, 190], [26, 196], [31, 208], [32, 222], [28, 231], [3.4, 233.2],
    [12, 236.5], [19, 244], [22.5, 256], [20, 268], [12, 277], [0, 281.5],
  ];
  const left: [number, number][] = right.map(([x, z]) => [-x, z]);
  // The Hawk's Perch pocket on the west.
  const i0 = left.findIndex(([x, z]) => x === -13.8 && z === 135);
  left.splice(i0 + 1, 3, [-30, 136], [-52, 138], [-52, 155], [-30, 159.5]);
  for (const side of [right, left]) {
    for (let i = 0; i < side.length - 1; i++) {
      const [x1, z1] = side[i]!;
      const [x2, z2] = side[i + 1]!;
      b.bound(x1, z1, x2, z2);
    }
  }
  b.bound(-28, -38, 28, -38);
}

// --- construction helpers ------------------------------------------------------------------------

function onCircle(c: { x: number; z: number }, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [c.x + Math.sin(a) * r, c.z + Math.cos(a) * r];
}

/** Retaining walls and cliff faces: solid boxes along a polyline, with masonry courses. */
function stoneWall(b: Builder, pts: [number, number][], y0: number, top: number, thick: number, color: number, courses: boolean, strata = false): void {
  const dark = mat(STONE_DARK, { rough: 0.95, flat: true });
  const bands = [mat(0x9a6a44, { rough: 1, flat: true }), mat(0xc89a6a, { rough: 1, flat: true }), mat(0x8a5a3a, { rough: 1, flat: true })];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, z1] = pts[i]!;
    const [x2, z2] = pts[i + 1]!;
    const len = Math.hypot(x2 - x1, z2 - z1);
    const yaw = Math.atan2(x2 - x1, z2 - z1);
    const mx = (x1 + x2) / 2;
    const mz = (z1 + z2) / 2;
    b.box(mx, y0, mz, thick, top - y0, len + thick * 0.6, color, { yaw });
    if (courses) {
      for (let y = y0 + 1.6; y < top - 0.4; y += 1.4) {
        b.decor.add(GEO.box(), dark, mx, y, mz, thick + 0.1, 0.12, len + thick * 0.6, 0, yaw, 0, false);
      }
      // A few blocks that stick out, so it reads as masonry.
      for (let k = 0; k < 3; k++) {
        const t = (k + 0.5) / 3 + jitter(i * 7 + k, 4) * 0.1;
        const by = y0 + 1 + Math.abs(jitter(i * 3 + k, 5)) * (top - y0 - 2);
        b.decor.add(GEO.box(), dark, x1 + (x2 - x1) * t, by, z1 + (z2 - z1) * t, thick + 0.25, 0.9, 1.4, 0, yaw, 0);
      }
    }
    if (strata) {
      for (let y = y0 + 2, k = 0; y < top - 1; y += 2.2, k++) {
        b.decor.add(GEO.box(), bands[k % 3]!, mx, y, mz, thick + 0.14, 1.1, len + thick * 0.6 + 0.1, 0, yaw, 0, false);
      }
    }
  }
}

/** A rough monolith marking a fallen Warden, with a faint green rune. */
function standingStone(b: Builder, x: number, z: number, h: number, seed: number): void {
  const y = b.y(x, z);
  const w = 1.1 + Math.abs(jitter(seed, 3)) * 0.5;
  const tilt = jitter(seed, 4) * 0.07;
  const yaw = jitter(seed, 5) * Math.PI;
  b.decor.add(GEO.box(), mat(0xb4ac9c, { rough: 0.95, flat: true }), x, y - 0.5 + (h + 0.5) / 2, z, w, h + 0.5, w * 0.62, tilt, yaw, -tilt);
  b.decor.add(GEO.box(), mat(0x7a7468, { rough: 1, flat: true }), x, y + h - 0.1, z, w * 1.04, 0.3, w * 0.66, tilt, yaw, -tilt);
  rune(b, x, y + h * 0.55, z, yaw, w * 0.33);
  b.col.add(makeCyl(x, z, w * 0.45, y - 1, y + h));
}

/** A glowing earth rune on a stone face. */
function rune(b: Builder, x: number, y: number, z: number, yaw: number, out: number): void {
  const m = glow(0x9be06a);
  const fx = Math.sin(yaw) * out;
  const fz = Math.cos(yaw) * out;
  b.decor.add(GEO.box(), m, x + fx, y, z + fz, 0.07, 0.7, 0.04, 0, yaw, 0, false);
  b.decor.add(GEO.box(), m, x + fx, y + 0.12, z + fz, 0.4, 0.07, 0.04, 0, yaw, 0.5, false);
}

/** A sandstone hoodoo you can stand on. */
function spire(b: Builder, x: number, z: number, r: number, top: number, color = SANDSTONE, y0?: number): void {
  const bottom = y0 ?? b.y(x, z) - 1.5;
  b.col.add(makeCyl(x, z, r, bottom, top));
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.94, r * 1.15, top - bottom, 7, 3), mat(color, { rough: 0.95, flat: true }));
  m.position.set(x, (bottom + top) / 2, z);
  m.rotation.y = jitter(x * 3 + z) * 3;
  m.castShadow = m.receiveShadow = true;
  b.level.root.add(m);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.98, r * 0.94, 0.3, 7), mat(0xc2a24a, { rough: 1, flat: true }));
  cap.position.set(x, top - 0.12, z);
  cap.rotation.y = m.rotation.y;
  cap.receiveShadow = true;
  b.level.root.add(cap);
  for (let y = top - 1.6; y > bottom + 1; y -= 2.1) {
    b.decor.add(GEO.cyl6(), mat(0x9a6a44, { rough: 1, flat: true }), x, y, z, r * 1.02, 0.5, r * 1.02, 0, m.rotation.y, 0, false);
  }
}

/** A fallen column lying on the ground; solid, so it doubles as a bridge. */
function toppledColumn(b: Builder, x: number, z: number, yaw: number, len: number, r: number, y?: number): void {
  const gy = y ?? b.y(x, z) - r * 0.25;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 9), mat(0xd0c4aa, { rough: 0.9, flat: true }));
  m.rotation.order = 'YXZ';
  m.rotation.set(Math.PI / 2, yaw, 0);
  m.position.set(x, gy + r * 0.85, z);
  m.castShadow = m.receiveShadow = true;
  b.level.root.add(m);
  const s = makeBox(x, z, r * 0.85, len / 2, gy - 0.6, gy + r * 1.75, yaw);
  s.surface = 'stone';
  b.col.add(s);
}

function burrowMound(b: Builder, x: number, z: number): void {
  const y = b.y(x, z);
  const m = mat(0xb89a6a, { rough: 1, flat: true });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + jitter(x + i) * 0.3;
    b.decor.add(GEO.rock(), m, x + Math.sin(a) * 1.5, y + 0.1, z + Math.cos(a) * 1.5, 0.6, 0.35, 0.5, i, a, 0);
  }
  b.decor.add(GEO.cyl(), mat(0x2a2016, { rough: 1 }), x, y - 0.02, z, 0.9, 0.06, 0.9, 0, 0, 0, false);
}

function ribBone(b: Builder, x: number, z: number, a: number): void {
  const y = b.y(x, z);
  const m = mat(0xe8dcc0, { rough: 0.6 });
  for (let i = 0; i < 4; i++) {
    const s = 1 - i * 0.18;
    const ox = Math.cos(a) * (i - 1.5) * 1.1;
    const oz = -Math.sin(a) * (i - 1.5) * 1.1;
    b.decor.add(GEO.cone(), m, x + ox, y - 0.3, z + oz, 0.18 * s, 2.6 * s, 0.18 * s, Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.35, true);
  }
}

function campTents(b: Builder): void {
  const tent = mat(0x3a2848, { rough: 0.95, flat: true });
  for (const [x, z] of [[-8, 227], [8, 228], [-9, 220]] as const) {
    const y = b.y(x, z);
    b.box(x, y, z, 2.6, 2.4, 2.6, 0x3a2848, { noMesh: true });
    b.decor.add(GEO.cone(), tent, x, y, z, 2, 3, 2, 0, jitter(x) * 3, 0);
    b.decor.glowCrystal(x + 1.6, y, z + 1.6, 1, 0xb04cff);
  }
  const stake = mat(0x4a3424, { rough: 1 });
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    if (Math.abs(Math.cos(a) + 1) < 0.35 || Math.abs(Math.cos(a) - 1) < 0.25) continue;
    const x = Math.sin(a) * 10.5;
    const z = 224 + Math.cos(a) * 10.5;
    b.decor.add(GEO.cone(), stake, x, b.y(x, z) - 0.2, z, 0.18, 2.1 + (i % 3) * 0.4, 0.18, Math.cos(a) * 0.2, 0, -Math.sin(a) * 0.2);
  }
}

/** Twelve monoliths joined by walls, doors in the south and north gaps. */
function circleOfTheFallen(b: Builder): void {
  const c = CIRCLE;
  for (let k = 0; k < 12; k++) {
    const a0 = ((15 + k * 30) * Math.PI) / 180;
    const x = c.x + Math.sin(a0) * c.r;
    const z = c.z + Math.cos(a0) * c.r;
    // Walls between monoliths, except the two door chords (south and north).
    if (k !== 5 && k !== 11) {
      const [x2, z2] = onCircle(c, c.r, 15 + (k + 1) * 30);
      b.wall(x, z, x2, z2, HEIGHTS - 4, 9, 1.2, STONE_DARK);
      const mx = (x + x2) / 2;
      const mz = (z + z2) / 2;
      b.decor.add(GEO.box(), mat(STONE, { rough: 0.9, flat: true }), mx, HEIGHTS + 5.05, mz, 1.4, 0.2, Math.hypot(x2 - x, z2 - z), 0, Math.atan2(x2 - x, z2 - z), 0, false);
    }
    const h = 7 + (k % 2) * 1.2;
    b.decor.add(GEO.box(), mat(0x9a9488, { rough: 0.95, flat: true }), x, HEIGHTS - 1 + (h + 1) / 2, z, 1.7, h + 1, 1.2, 0, a0, 0);
    rune(b, x, HEIGHTS + h * 0.6, z, a0 + Math.PI, 0.62);
    b.col.add(makeCyl(x, z, 1.0, HEIGHTS - 4, HEIGHTS + h));
  }
}

// --- scenery -------------------------------------------------------------------------------------------

function tallGrass(b: Builder, x: number, y: number, z: number, s: number, color: number): void {
  const m = mat(color, { rough: 1, emissive: color, emissiveIntensity: 0.16 });
  const r = b.decor.rng;
  const n = 5 + r.int(0, 2);
  for (let i = 0; i < n; i++) {
    b.decor.add(GEO.blade(), m, x + r.signed() * 0.45 * s, y - 0.05, z + r.signed() * 0.45 * s,
      s * 2.4, s * (0.8 + r.next() * 0.9), s * 2.4, r.signed() * 0.35, r.next() * 6, r.signed() * 0.35, false);
  }
  if (r.chance(0.35)) b.decor.add(GEO.blobLow(), mat(0xf0dca0, { rough: 1 }), x, y + s * 1.5, z, 0.08, 0.2, 0.08, 0, 0, 0, false);
}

function acacia(b: Builder, x: number, z: number, s: number): void {
  const y = b.y(x, z);
  const bark = mat(0x6a4a30, { rough: 0.95 });
  const leaf = mat(0x8a9a3a, { rough: 0.9, flat: true, emissive: 0x8a9a3a, emissiveIntensity: 0.12 });
  const ry = jitter(x * 1.3 + z) * 3;
  b.decor.add(GEO.trunk(), bark, x, y, z, 0.8 * s, 3.4 * s, 0.8 * s, 0, ry, 0);
  b.decor.add(GEO.blob(), leaf, x, y + 3.6 * s, z, 3.0 * s, 0.65 * s, 2.7 * s, 0, ry, 0);
  b.decor.add(GEO.blob(), leaf, x + 1.2 * s, y + 3.3 * s, z + 0.6 * s, 1.6 * s, 0.45 * s, 1.5 * s, 0, ry, 0);
  b.col.add(makeCyl(x, z, 0.3 * s, y - 1, y + 3.2 * s));
}

function scenery(b: Builder): void {
  const gold = (x: number, z: number) => GOLD[Math.floor(Math.abs(jitter(x * 0.7 + z * 1.3, 9)) * 3)]!;
  const flower = (x: number, z: number) => FLOWERS[Math.floor(Math.abs(jitter(x * 1.9 + z, 13)) * FLOWERS.length)]!;
  // The Vale.
  const inVale = (x: number, z: number, y: number) => y > VALE - 0.3 && y < 5 && z < meadowEdgeZ(x) - 3.5 && Math.hypot(x, z + 24) > 4 && Math.hypot(x - 20, z + 16) > 4;
  b.scatter(110, 0, -8, 32, (x, z, y) => tallGrass(b, x, y, z, 0.8 + Math.abs(jitter(x + z, 2)) * 0.5, gold(x, z)), inVale);
  b.scatter(60, 0, -8, 32, (x, z, y) => b.decor.flower(x, y, z, flower(x, z)), inVale);
  for (const [x, z, s] of [[-22, -30, 1.1], [21, -28, 1.0], [-24, 20, 1.2], [23, 2, 0.9], [-9, -34, 0.9], [15, 21, 1.0]] as const) acacia(b, x, z, s);
  b.tree(12, -26, 1.1, 'autumn', { leaf: 0xd8a040 });
  b.tree(-17, 22, 1.0, 'autumn', { leaf: 0xc88a38 });
  for (let i = 0; i < 10; i++) {
    const x = jitter(i, 21) * 24;
    const z = -30 + Math.abs(jitter(i, 22)) * 44;
    if (Math.abs(x) < 4 || Math.abs(z - 8) < 5 || Math.hypot(x + 18, z + 4) < 5 || Math.hypot(x - 20, z + 16) < 6) continue;
    b.rock(x, z, 0.5 + Math.abs(jitter(i, 23)) * 0.9, 0x9a8c74);
  }
  standingStone(b, -10, 16, 3.4, 61);
  standingStone(b, 11, 2, 2.8, 62);
  standingStone(b, 16, -8, 3.2, 63);

  // The Meadow.
  const inMeadow = (x: number, z: number, y: number) => y > MEADOW - 0.3 && z > meadowEdgeZ(x) + 2.5 && z < 86 &&
    Math.hypot(x + 36, z - 56) > 6.5 && Math.hypot(x - 37, z - 73) > 5 && Math.hypot(x - 8, z - 34) > 3;
  b.scatter(170, 0, 62, 48, (x, z, y) => tallGrass(b, x, y, z, 0.85 + Math.abs(jitter(x - z, 2)) * 0.55, gold(x, z)), inMeadow);
  b.scatter(80, 0, 62, 48, (x, z, y) => b.decor.flower(x, y, z, flower(x, z)), inMeadow);
  for (const [x, z, s] of [[-18, 40, 1.2], [26, 50, 1.0], [-40, 68, 1.1], [30, 82, 1.3], [-20, 84, 1.0], [40, 60, 1.1], [-8, 58, 0.9]] as const) acacia(b, x, z, s);
  b.tree(22, 70, 1.2, 'autumn', { leaf: 0xd8a040 });
  b.tree(-28, 62, 1.1, 'autumn', { leaf: 0xe0b050 });
  b.tree(12, 88, 1.0, 'round', { leaf: 0x8a9a3a });
  for (const [x, z, h, s] of [[12, 44, 3.2, 71], [-16, 56, 4.0, 72], [28, 66, 3.6, 73], [-24, 88, 3.0, 74], [2, 70, 2.8, 75], [36, 50, 3.4, 76]] as const) standingStone(b, x, z, h, s);
  for (const [x, z, yaw, len] of [[-12, 46, 0.6, 5], [24, 76, 2.1, 6], [-30, 80, 1.4, 5], [-2, 58, 2.6, 4]] as const) toppledColumn(b, x, z, yaw, len, 0.6);
  for (let i = 0; i < 12; i++) {
    const x = jitter(i, 31) * 40;
    const z = 40 + Math.abs(jitter(i, 32)) * 44;
    if (Math.hypot(x + 36, z - 56) < 8 || Math.hypot(x - 37, z - 73) < 7 || Math.abs(x) < 5) continue;
    b.rock(x, z, 0.6 + Math.abs(jitter(i, 33)) * 1.0, 0x9a8c74);
  }
  // The Colonnade and the Heights.
  b.scatter(20, 0, 108, 11, (x, z, y) => tallGrass(b, x, y, z, 0.7, gold(x, z)), (x, z, y) => y > TERRACE - 0.3 && Math.abs(Math.hypot(x, z - 108) - 9.2) > 1.2);
  const inHeights = (x: number, z: number, y: number) => y > HEIGHTS - 0.3 && z > heightsEdgeZ(x) + 2.5 && z < 160 && Math.hypot(x - 9, z - 154) > 5 && Math.hypot(x - 5, z - 139.5) > 3;
  b.scatter(70, 0, 148, 28, (x, z, y) => tallGrass(b, x, y, z, 0.8 + Math.abs(jitter(x + z, 4)) * 0.4, gold(x, z)), inHeights);
  b.scatter(35, 0, 148, 28, (x, z, y) => b.decor.flower(x, y, z, flower(x, z)), inHeights);
  b.scatter(16, CIRCLE.x, CIRCLE.z, 12, (x, z, y) => tallGrass(b, x, y, z, 0.6, GOLD[1]), (x, z, y) => y > HEIGHTS - 0.3 && Math.hypot(x, z - CIRCLE.z) < 12);
  acacia(b, -22, 144, 1.1);
  acacia(b, 20, 152, 1.0);
  for (const [x, z, h, s] of [[-18, 140, 3.4, 81], [16, 138, 3.0, 82], [-6, 156, 2.6, 83]] as const) standingStone(b, x, z, h, s);
  // The Burrow Fields.
  const inFields = (x: number, z: number, y: number) => y > FIELDS - 0.3 && y < 7 && Math.hypot(x, z - 224) > 11 && Math.hypot(x + 24, z - 222) > 3.5 && z < 230;
  b.scatter(50, 0, 220, 28, (x, z, y) => tallGrass(b, x, y, z, 0.75, gold(x, z)), inFields);
  b.scatter(20, 0, 220, 28, (x, z, y) => b.decor.flower(x, y, z, flower(x, z)), inFields);
  b.scatter(20, 0, 224, 9, (x, z, y) => b.decor.grass(x, y, z, 0.8, 0x9a8a4a), (x, z) => Math.hypot(x, z - 224) < 9);
  acacia(b, -25, 210, 1.0);
  acacia(b, 25, 232, 0.9);
  // The canyon floor: tufts of dry grass along the edge.
  b.scatter(30, BASIN.x, BASIN.z, 19, (x, z, y) => b.decor.grass(x, y, z, 0.8, 0xa89a58), (x, z) => Math.hypot(x - BASIN.x, z - BASIN.z) > 15);
}

// --- props ---------------------------------------------------------------------------------------------

/**
 * The Stonewild springs are boiling: unfrozen jets push the dragon out and
 * scald it, so the only way up is to freeze them. Also keeps the dragon's
 * respawn point off spring pillars, which thaw.
 */
class HotSprings implements Prop {
  private cd = 0;
  private fxT = 0;
  private safe = new THREE.Vector3();
  private hasSafe = false;
  private warned = false;

  constructor(private game: Game, private springs: Geyser[]) {}

  update(dt: number): void {
    const g = this.game;
    const p = g.player;
    const b = p.body;
    this.cd -= dt;
    this.fxT -= dt;
    const puff = this.fxT <= 0;
    if (puff) this.fxT = 0.12;
    for (const s of this.springs) {
      if (s.frozen) continue;
      if (puff) g.fx.emit(s.x + rng.signed() * s.radius * 0.5, s.y + s.height * (0.3 + rng.next() * 0.7), s.z + rng.signed() * s.radius * 0.5, {
        count: 1, speed: 1.2, dir: [0, 1, 0], spread: 0.5, life: [0.8, 1.4], size: [0.6, 1.0], sizeEnd: 2.5, color: 0xf4f6ff, alpha: 0.35, additive: false, drag: 1, gravity: -1,
      });
      const d = Math.hypot(b.x - s.x, b.z - s.z);
      if (!p.alive || d > s.radius + 0.25 || b.y < s.y - 0.5 || b.y > s.y + s.height + 1) continue;
      const n = d || 1;
      const dx = d > 0.05 ? (b.x - s.x) / n : -Math.sin(p.yaw);
      const dz = d > 0.05 ? (b.z - s.z) / n : -Math.cos(p.yaw);
      b.vx = dx * 9;
      b.vz = dz * 9;
      if (this.cd <= 0) {
        this.cd = 0.7;
        p.takeHit(makeHit({ damage: 5, dirX: dx, dirZ: dz, knockback: 9, launch: 5, source: 'env', move: 'scald', fromPlayer: false, ox: s.x, oz: s.z }), null);
        g.sfx('steam', s.x, b.y, s.z);
        if (!this.warned) {
          this.warned = true;
          g.hud.flick('Ow! That water is boiling! Freeze the spring with Ice (3) first!', 5);
        }
      }
    }
    // Never respawn on a spring pillar: it may have melted by then.
    const ls = p.lastSafe;
    const onSpring = this.springs.some((s) => Math.hypot(ls.x - s.x, ls.z - s.z) < s.radius * 1.3 + 0.6 && ls.y > s.y + 0.5);
    if (onSpring) {
      if (this.hasSafe) ls.copy(this.safe);
    } else {
      this.safe.copy(ls);
      this.hasSafe = true;
    }
  }
}

/** Hints for each reaction as its wave appears, and a count for the bonus. */
class ReactionWatch implements Prop {
  private base = -1;
  private hinted = new Set<string>();
  constructor(private game: Game, private arena: Arena, private hints: [string, string][]) {}

  get count(): number {
    return this.base < 0 ? 0 : this.game.save.stats.reactions - this.base;
  }

  update(): void {
    const a = this.arena;
    const g = this.game;
    if (a.state === 'idle') this.base = -1;
    if (a.state !== 'active') return;
    if (this.base < 0) this.base = g.save.stats.reactions;
    for (const [id, text] of this.hints) {
      if (this.hinted.has(id)) continue;
      if (g.enemies.some((e) => e.alive && e.def.id === id && e.state !== 'spawn' && Math.hypot(e.x - a.x, e.z - a.z) < a.r)) {
        this.hinted.add(id);
        g.hud.flick(text, 7);
      }
    }
  }
}

// --- story -------------------------------------------------------------------------------------------------

function plainsOutro(g: Game, cage: Cage | undefined): void {
  const level = g.level;
  if (!level || level.def.id !== 'plains') return;
  // Stonehide breaks out and drops from the rim; Aster goes to meet him.
  const x = STONEHIDE_SPOT.x;
  const z = STONEHIDE_SPOT.z;
  g.fadeTo(() => {
    // The caged Stonehide leaves the dais; rescueWarden stands him on the sand.
    const i = level.npcs.findIndex((n) => n.id === 'stonehide');
    if (i >= 0) {
      level.root.remove(level.npcs[i]!.rig.root);
      level.npcs.splice(i, 1);
    }
    g.player.place(x, FLOOR + 0.05, z - 8, 0);
    g.cam.snapBehind(0, 0.25);
    g.fx.rocks(x, FLOOR + 0.5, z, 30, 0x9a8a6a);
    rescueWarden(g, stonehideRescue(cage, x, z));
  });
}

function stonehideRescue(cage: Cage | undefined, x: number, z: number): Parameters<typeof rescueWarden>[1] {
  return {
    warden: 'stonehide', look: STONEHIDE, x, z, yaw: Math.PI, element: 'earth', unlocks: 'keep', cage,
    lines: [
      { who: 'stonehide', text: '...' },
      { who: 'stonehide', text: 'The worm is quiet. Good.' },
      { who: 'aster', text: 'Are you all right? You\'re Stonehide, aren\'t you?' },
      { who: 'stonehide', text: 'I am. You are small.' },
      { who: 'flick', text: 'Small but LOUD. Er, mighty. Loudly mighty.' },
      { who: 'stonehide', text: 'Mountains are only small stones that did not give up. Plant your feet, little one. Feel the ground. Now breathe.' },
    ],
  };
}
