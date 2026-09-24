import * as THREE from 'three';
import type { LevelDef, Builder } from '../world/level';
import { Npc } from '../world/level';
import { ambient, paint, jitter, bossFight } from './common';
import { Nyxa } from '../enemies/bosses/nyxa';
import { NYXA, ENDING } from '../game/story';
import type { Game } from '../game/game';
import type { Prop } from '../entities/props';
import type { Line } from '../ui/dialogue';
import type { DragonLook } from '../player/dragonRig';
import { GEO } from '../render/decor';
import { mat, glow } from '../render/materials';
import { makeCyl } from '../world/collision';
import { rng } from '../core/rng';

/**
 * Eclipse Keep: Nyxa's fortress on a floating rock beneath the eclipse.
 * The finale. A broken bridge, a gatehouse ambush, a great door sealed by
 * all four breaths, a gauntlet of knights and totems, a climb on the wind,
 * and Nyxa herself on the Eclipse Throne.
 */

const OBS = 0x362e4c;
const OBS2 = 0x463d60;
const OBS3 = 0x5e527c;
const TRIM = 0x7a68a0;
const VIOLET = 0xb04cff;
const MAGENTA = 0xe060ff;
const ROSE = 0xff3080;

const COLORS = paint({
  under: 0x2a2238, shore: 0x362c48, grass: 0x4a4268, grass2: 0x575078, rock: 0x363048, path: 0x6c6088, high: 0x5c5280, highAt: 16, water: -100,
});

/** Arena of the final fight. */
const AX = 0;
const AZ = -263;
const AR = 19.5;

/** Nyxa once the shadow has let her go. */
const FREED: DragonLook = { ...NYXA, eye: 0x8ad8ff, glowEyes: false };

const LINK = (() => {
  const g = new THREE.TorusGeometry(0.16, 0.045, 4, 8);
  g.scale(1.6, 1, 1);
  return g;
})();

export const keep: LevelDef = {
  id: 'keep',
  name: 'Eclipse Keep',
  subtitle: 'Beneath the darkened moons',
  music: 'keep',
  killY: -22,
  spawn: [0, 2, Math.PI],
  sky: {
    top: 0x0c0820, horizon: 0x3a2060, bottom: 0x0a0614, sunDir: [-0.45, 0.42, -0.78], sunColor: 0xc8b0ff, sunIntensity: 1.25,
    hemiSky: 0xa898e8, hemiGround: 0x44345c, hemiIntensity: 1.5, fogNear: 45, fogFar: 215, stars: 1, moons: true, fog: 0x2a1848,
  },
  terrain: {
    x0: -80, z0: -300, sizeX: 160, sizeZ: 330, cell: 1.5,
    color: COLORS,
    skirt: { depth: 18, color: 0x241c34 },
    shape: (s) => {
      s.void();
      // Moonfall Landing.
      s.island(0, 3, 10, 4, 2, 0.25);
      // The outer bastion.
      s.island(0, -58, 14, 6, 2, 0.2);
      // Up to the Court of Seals.
      s.path([[0, -70.5, 6], [0, -87.5, 8]], 7, 1);
      s.island(0, -110, 22, 8, 2, 0.25);
      // Through the great door to the Hall of Umbra.
      s.path([[0, -129, 8], [0, -139, 8]], 7.5, 1);
      s.island(0, -153, 15, 8, 2, 0.2);
      // The Broken Stair.
      s.island(0, -181, 5, 9, 2, 0.15);
      s.island(0, -209.5, 4.5, 14, 2, 0.15);
      s.island(17.5, -197, 3, 17, 2, 0.1);
      // The Eclipse Terrace and the throne.
      s.island(0, -229, 11, 20, 2, 0.2);
      s.path([[0, -239, 20], [0, -245, 20]], 7, 1);
      s.island(AX, AZ, AR, 20, 2, 0.1);
    },
  },

  build(b: Builder) {
    const g = b.game;
    ambient(b, 'shadow', 12);
    b.bound(-78, 28, 78, 28);
    b.bound(78, 28, 78, -298);
    b.bound(78, -298, -78, -298);
    b.bound(-78, -298, -78, 28);
    const flames = new Flames(g);
    b.level.props.push(flames);
    b.level.props.push(new Janitor(g));
    const later = new Deferred(g);
    b.level.props.push(later);
    backdrop(b);

    // --- Moonfall Landing ----------------------------------------------------------
    [[-7, 4], [7, 5], [-7, -2], [7, -2.5], [-4, 8.5], [5, 8]].forEach(([x, z], i) => {
      b.decor.pillar(x!, b.y(x!, z!), z!, 0.55, 2.2 + (i % 3) * 0.9, OBS3, i % 2 === 0);
    });
    crystals(b, -6, b.y(-6, 7), 7, 1.1);
    crystals(b, 7.5, b.y(7.5, 1), 1, 0.9);
    crystals(b, -8.5, b.y(-8.5, -1), -1, 0.8);
    for (const [x, z] of [[-3, -4.5], [3, -4.5]] as const) brazier(b, flames, x, b.y(x, z), z);
    b.scatter(10, 0, 3, 9, (x, z) => b.rock(x, z, 0.4 + Math.abs(jitter(x * 3 + z)) * 0.5, OBS2), (x, z) => Math.abs(x) > 3 || z > 6);
    b.crystal(6, 7, 'blue', 10);
    b.crystal(-2, 10, 'green', 3);
    b.gemLine([[0, -1], [0, -6]]);
    spire(b, -8, b.y(-8, 7), 7, 8, 0.8, true);
    spire(b, 8.5, b.y(8.5, 4), 4, 6, 0.65, true);
    // Below the landing, a nest the shadow left behind.
    b.islet(-15, -1.5, 17, 2.6, OBS3, OBS);
    nest(b, -15.6, -1.5, 17.4);
    b.collectible('relic1', 'relic', -14.2, 16.3, -1.5, 'keep1');
    crystals(b, -16.6, -1.5, 15.8, 0.8);
    b.updraft(-15, 17, 2.1, -1.5, 13, 34);
    if (g.save.levelsDone.keep) b.portal(0, 8, 0, 'sanctum', 'Return to the Sanctum', 0xc9a2ff);

    // --- The broken bridge ------------------------------------------------------------
    causeway(b, 0, -7, 4, 0, -18, 4.5, 3.6);
    causeway(b, 0, -24, 4.8, 0, -44.8, 6, 3.6);
    // The broken ends, jagged.
    for (const [z, y] of [[-18.3, 4.5], [-23.7, 4.8]] as const) {
      for (let i = 0; i < 4; i++) b.decor.add(GEO.rock(), mat(OBS2, { rough: 1, flat: true }), -1.4 + i * 0.9, y - 0.6 - (i % 2) * 0.4, z, 0.5, 0.6, 0.4, i, i * 1.3, 0);
    }
    chain(b, -1.8, 5.6, -18, -1.8, 5.2, -24, 1.4);
    b.story('gap', 0, -14, 3, () => g.hud.flick('The bridge is out! Jump, flap at the top, and glide if you have to. And don\'t look down. I looked down.', 7));
    b.enemy('slinger', 0, -27, Math.PI);
    b.enemy('shieldbearer', 0, -37, Math.PI);
    spire(b, -7, 0, -30, 11, 1.1);
    spire(b, 7, -2, -36, 13, 1.2);
    b.decor.add(GEO.cone(), mat(OBS, { rough: 1, flat: true }), -7, 0, -30, 1.6, 6, 1.6, Math.PI);
    b.decor.add(GEO.cone(), mat(OBS, { rough: 1, flat: true }), 7, -2, -36, 1.8, 7, 1.8, Math.PI);
    chain(b, -7, 9, -30, -1.8, 5.9, -31, 1.2);
    chain(b, 7, 10, -36, 1.8, 6.6, -37, 1.2);

    // --- The outer bastion ---------------------------------------------------------------
    const bz = -58;
    const by = b.y(0, bz);
    const R = 13.2;
    for (let i = 0; i < 16; i++) {
      if (i === 0 || i === 8 || i === 12) continue;
      const a0 = (i - 0.5) * (Math.PI / 8);
      const a1 = (i + 0.5) * (Math.PI / 8);
      rampart(b, Math.sin(a0) * R, bz + Math.cos(a0) * R, Math.sin(a1) * R, bz + Math.cos(a1) * R, by, 3.4);
    }
    // Gate towers on either side of the north arch and the south entrance.
    for (const sx of [-1, 1]) {
      tower(b, sx * 3.6, bz - 13.4, by - 1, 1.5, 9);
      tower(b, sx * 3.4, bz + 13.2, by - 1, 1.3, 7);
    }
    const gatehouse = b.arena('gatehouse', 0, bz, 12, [
      [{ type: 'grunt', x: -4, z: bz - 5 }, { type: 'grunt', x: 4, z: bz - 5, delay: 0.2 }, { type: 'slinger', x: 0, z: bz - 9, delay: 0.4 }],
      [{ type: 'shieldbearer', x: 0, z: bz - 8 }, { type: 'grunt', x: -6, z: bz, delay: 0.3 }, { type: 'grunt', x: 6, z: bz, delay: 0.5 }],
      [{ type: 'knight', x: 0, z: bz - 8 }],
    ], 45);
    b.gate(0, bz - 13.2, 5, 5, 0, 'shadow', 'bastion-open');
    b.box(0, by + 5, bz - 13.3, 8.6, 1.6, 1.6, OBS2);
    gatehouse.onStart = () => g.hud.flick('It\'s an ambush! Shade Knights guard from the front: Tail attacks, Charges and Earth break a guard.', 7);
    gatehouse.onClear = () => {
      b.level.emit('bastion-open');
      g.hud.flick('The shadow seal on the gate is gone. Onward, up the stairs!', 5);
    };
    if (gatehouse.state === 'cleared') later.emit('bastion-open');
    for (const a of [Math.PI * 0.25, Math.PI * 0.75, -Math.PI * 0.25, -Math.PI * 0.75]) {
      const x = Math.sin(a) * 11;
      const z = bz + Math.cos(a) * 11;
      brazier(b, flames, x, b.y(x, z), z);
    }
    banner(b, -5.6, by + 1.2, bz - 12.4, 0);
    banner(b, 5.6, by + 1.2, bz - 12.4, 0);
    crystals(b, -9, by, bz + 6, 1.2);
    crystals(b, 9.5, by, bz - 4, 1);
    b.crystal(8, bz + 7, 'red', 3);
    b.crystal(-8, bz - 7, 'blue', 12);
    // West: cracked stone, and a balcony over the void behind it.
    b.gate(-R, bz, 5, 3.6, Math.PI / 2, 'rock');
    causeway(b, -13.9, bz, by, -21.4, bz, by, 3);
    b.islet(-24.4, by, bz, 3.2, OBS3, OBS);
    b.collectible('heart1', 'heart', -25, bz);
    crystals(b, -26, by, bz + 1.8, 0.8);
    b.crystal(-24, bz - 2, 'blue', 14);
    b.checkpoint('bastion', 0, -77, Math.PI);

    // --- Court of the Four Seals ------------------------------------------------------------
    const cz = -110;
    const cy = b.y(0, cz);
    // The great wall and its door.
    b.wall(-15, -128, -4, -128, cy - 1, 14, 2.4, OBS);
    b.wall(4, -128, 15, -128, cy - 1, 14, 2.4, OBS);
    for (const sx of [-1, 1]) {
      tower(b, sx * 16.5, -128, cy - 6, 3, 26);
      for (let i = 0; i < 7; i++) b.decor.add(GEO.box(), mat(OBS2, { flat: true }), sx * (4.8 + i * 1.5), cy + 13.35, -128, 0.8, 0.7, 2.2);
      banner(b, sx * 7.5, cy + 3, -126.7, 0);
      brazier(b, flames, sx * 5.5, cy, -125);
    }
    b.gate(0, -128, 8, 9, 0, 'stone', 'keep-door');
    b.box(0, cy + 9, -128, 8.2, 4, 2.4, OBS);
    // Four runes above the door, one per seal.
    const runeOrder = ['storm', 'flame', 'stone', 'frost'] as const;
    const runeColors: Record<(typeof runeOrder)[number], number> = { storm: 0x7ac8ff, flame: 0xff8a30, stone: 0x9be06a, frost: 0xbff4ff };
    const runeMats = new Map<string, THREE.MeshStandardMaterial>();
    runeOrder.forEach((id, i) => {
      const m = new THREE.MeshStandardMaterial({ color: 0x3a3450, emissive: 0x000000, roughness: 0.3, metalness: 0.3, flatShading: true });
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), m);
      orb.scale.y = 1.4;
      orb.position.set(-4.5 + i * 3, cy + 10.6, -126.6);
      b.level.root.add(orb);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.07, 6, 20), mat(TRIM, { rough: 0.5, metal: 0.5 }));
      ring.position.copy(orb.position);
      b.level.root.add(ring);
      runeMats.set(id, m);
    });
    const sealNames: Record<string, string> = { storm: 'Storm', flame: 'Flame', stone: 'Stone', frost: 'Frost' };
    const lightRune = (id: (typeof runeOrder)[number]) => {
      const m = runeMats.get(id);
      if (!m) return;
      m.color.setHex(runeColors[id]);
      m.emissive.setHex(runeColors[id]);
      m.emissiveIntensity = 1.2;
    };
    const sealDone = (id: (typeof runeOrder)[number]) => {
      const key = `story:keep:seal-${id}`;
      if (g.save.found[key]) return;
      g.save.found[key] = true;
      lightRune(id);
      const n = runeOrder.filter((r) => g.save.found[`story:keep:seal-${r}`]).length;
      g.audio.play('unlock');
      g.toast(`The ${sealNames[id]} Seal breaks (${n}/4)`, 'good');
      g.fx.motes(0, cy + 10.6, -126.6, runeColors[id], 30);
      if (n >= 4) openDoor();
      else g.saveNow();
    };
    const openDoor = () => {
      if (g.save.found['story:keep:door']) return;
      g.save.found['story:keep:door'] = true;
      g.saveNow();
      b.level.emit('keep-door');
      g.shake(0.4, 1.4);
      g.say([
        { who: 'aster', text: 'That\'s all four! Open up!' },
        { who: 'flick', text: 'It\'s... actually opening. Part of me was really hoping it wouldn\'t.' },
      ]);
    };
    for (const id of runeOrder) if (g.save.found[`story:keep:seal-${id}`]) lightRune(id);
    if (g.save.found['story:keep:door']) later.emit('keep-door');
    b.level.on('seal-storm', () => sealDone('storm'));
    b.level.on('seal-flame', () => sealDone('flame'));
    b.level.on('broken:seal-stone', () => sealDone('stone'));
    b.level.on('seal-frost', () => sealDone('frost'));
    b.story('court', 0, -92, 5, () => g.hud.flick('That door has four dark runes: storm, flame, stone and frost. Wake all four seals and it should open!', 8));
    b.story('door', 0, -122, 4, () => {
      if (!g.save.found['story:keep:door']) g.hud.flick('Four runes, four seals. Look around the court: west, east, and that walled room by the door.', 7);
    });

    // West: the Storm Seal, a starving crystal on a plinth.
    obPillar(b, -17, -106, 0.9, cy - 0.5, cy + 1.6);
    b.switchCrystal(-17, -106, 'lightning', 'seal-storm', cy + 1.6);
    crystals(b, -19, cy, -102.5, 0.9);
    crystals(b, -18.5, cy, -110, 0.7);
    b.story('storm', -14, -106, 5, () => g.hud.flick('That crystal is starving for a spark. Arc Breath! Press 2, then hold Right Mouse.', 6));
    b.enemy('knight', -11, -113, Math.PI / 2);

    // East: the Flame Seal, four braziers that burn out fast.
    const torches: [number, number, number][] = [[9, -97, 0], [17, -102, 1.8], [17.5, -114, 1.8], [8, -112, 0]];
    for (const [x, z, h] of torches) {
      if (h > 0) obPillar(b, x, z, 0.9, cy - 0.5, b.y(x, z) + h);
      b.torch(x, z, 'flame', false, 10);
    }
    b.torchGroup('flame', 'seal-flame');
    b.story('flame', 12, -102, 6, () => g.hud.flick('Four braziers, and they don\'t burn for long. Light them all before the first one goes out! A Fireball can reach the high ones.', 8));
    b.enemy('totem', 13, -106, -Math.PI / 2);
    b.enemy('slinger', 13, -96, -Math.PI / 2);

    // North-east: the Stone and Frost Seals share a walled room.
    const fy = b.y(9, -121.5);
    b.wall(4, -126, 4, -116.5, cy - 1, 6.5, 1, OBS2);
    b.wall(14, -126, 14, -116.5, cy - 1, 6.5, 1, OBS2);
    b.wall(4, -126, 14, -126, cy - 1, 6.5, 1, OBS2);
    b.wall(4, -116.5, 6.8, -116.5, cy - 1, 6.5, 1, OBS2);
    b.wall(11.2, -116.5, 14, -116.5, cy - 1, 6.5, 1, OBS2);
    b.gate(9, -116.5, 4.4, 4, 0, 'rock', 'seal-stone');
    b.box(9, cy + 4, -116.5, 4.4, 1.5, 1, OBS2);
    b.story('stone', 9, -113.5, 3.5, () => g.hud.flick('That wall is cracked right through. A Boulder should do it: press 4, then Q.', 6));
    const geyser = b.geyser(9, -121.5, 1.3, 2.8, false, '', fy);
    void geyser;
    b.plate(9, -121.5, 'seal-frost', fy + 2.8);
    b.story('frost', 9, -118.5, 2.5, () => g.hud.flick('The frost seal is riding the geyser! Freeze it with Ice (3), climb on top and ground-pound it: jump, then E.', 8));
    // A shelf only the frozen geyser reaches.
    b.box(12.6, cy - 1, -124.2, 2.2, 6.6, 3, OBS3, { trim: TRIM });
    b.collectible('mana1', 'mana', 12.8, -124.2, cy + 5.6);
    crystals(b, 5.2, cy, -125, 0.8);
    b.enemy('crawler', 6.5, -119, 0);
    b.enemy('crawler', 11.8, -119.5, 0);

    // South-west: a shrine walled in ice.
    b.wall(-15.5, -102, -15.5, -96.5, cy - 1, 5.2, 1, OBS2);
    b.wall(-15.5, -102, -10, -102, cy - 1, 5.2, 1, OBS2);
    b.wall(-15.5, -96.5, -10, -96.5, cy - 1, 5.2, 1, OBS2);
    b.wall(-10, -102, -10, -100.95, cy - 1, 5.2, 1, OBS2);
    b.wall(-10, -97.55, -10, -96.5, cy - 1, 5.2, 1, OBS2);
    b.gate(-10, -99.25, 3.4, 3.6, Math.PI / 2, 'ice');
    b.box(-10, cy + 3.6, -99.25, 1, 0.6, 3.4, OBS2);
    hollowStatue(b, -13.9, cy, -99.25);
    b.collectible('relic2', 'relic', -12.1, -99.25, undefined, 'keep2');

    // The court itself.
    for (const [x, z] of [[-17.5, -93], [-19.5, -114], [19, -108], [-8, -93], [8, -92.5]] as const) crystals(b, x, b.y(x, z), z, 1 + Math.abs(jitter(x + z)) * 0.4);
    for (const [x, z] of [[-6, -95], [6, -95], [-6, -120], [-15, -120], [0, -104]] as const) brazier(b, flames, x, b.y(x, z), z);
    for (const sx of [-1, 1]) {
      gothicArch(b, sx * 9, -93, 0, 4.5, 4.5);
    }
    gothicArch(b, 17.5, -108, Math.PI / 2, 4.5, 4.5);
    gothicArch(b, -18, -114.5, Math.PI / 2, 4.5, 4.5);
    b.crystal(-4, -100, 'blue', 14, true);
    b.crystal(3, -118, 'green', 4);
    b.crystal(-20, -108, 'purple', 3);
    b.crystal(17, -108, 'red', 3);
    b.enemy('brute', 0, -100, Math.PI);
    b.enemy('wisp', -3, -115, Math.PI);
    b.scatter(18, 0, cz, 21, (x, z) => b.rock(x, z, 0.35 + Math.abs(jitter(x * 7 + z)) * 0.4, OBS2, false), (x, z) => Math.abs(x) > 6 && z > -125);

    // --- Hall of Umbra -------------------------------------------------------------------------
    b.checkpoint('door', 0, -134, Math.PI);
    const hz = -152.5;
    const hy = b.y(0, hz);
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const z = -144 - i * 5;
        obPillar(b, sx * 8.5, z, 0.6, hy - 0.5, hy + 7);
        if (i < 3) pointedTop(b, sx * 8.5, z - 2.5, Math.PI / 2, 5, hy + 7, OBS2);
      }
      banner(b, sx * 8.5 + sx * -0.7, hy + 1.8, -151.5, sx * Math.PI / 2);
      brazier(b, flames, sx * 5.5, hy, -163.5);
    }
    b.wall(-7.5, -166.5, -2.6, -166.5, hy - 1, 11, 1.5, OBS);
    b.wall(2.6, -166.5, 7.5, -166.5, hy - 1, 11, 1.5, OBS);
    roseWindow(b, 0, hy + 7.4, -165.6);
    const hall = b.arena('hall', 0, hz, 12.5, [
      [{ type: 'totem', x: 0, z: hz - 9 }, { type: 'grunt', x: -5, z: hz + 2 }, { type: 'grunt', x: 5, z: hz + 2, delay: 0.3 }, { type: 'slinger', x: 0, z: hz - 7, delay: 0.5 }],
      [{ type: 'knight', x: -4, z: hz - 6 }, { type: 'totem', x: 6, z: hz + 5, delay: 0.3 }, { type: 'shieldbearer', x: 4, z: hz - 5, delay: 0.5 }],
      [{ type: 'knight', x: -5, z: hz - 3 }, { type: 'knight', x: 5, z: hz - 3, delay: 0.4 }, { type: 'wisp', x: 0, z: hz - 8, delay: 0.8 }],
    ], 60);
    b.gate(0, -166.5, 5, 5, 0, 'shadow', 'hall-open');
    b.box(0, hy + 5, -166.5, 5.4, 5, 1.5, OBS);
    hall.onStart = () => g.hud.flick('Totems! Their glow shields everything near them. Break the totem first!', 7);
    hall.onClear = () => {
      b.level.emit('hall-open');
      g.hud.flick('That\'s the hall cleared. The way up is through the back!', 5);
    };
    if (hall.state === 'cleared') later.emit('hall-open');
    crystals(b, -12, hy, -146, 1.2);
    crystals(b, 12, hy, -158, 1.1);
    crystals(b, -11, hy, -161, 0.9);
    b.crystal(11, -146, 'blue', 12);
    b.crystal(-12, -155, 'green', 4);

    // --- The Broken Stair ---------------------------------------------------------------------------
    causeway(b, 0, -168, hy, 0, -176.2, b.y(0, -181), 3.6);
    b.enemy('crawler', 1, -182, Math.PI);
    b.islet(3.5, 10.5, -190, 1.5, OBS3, OBS);
    b.mover([[-4.5, 12, -195.5], [1.5, 12, -195.5]], 2.4, 2.4, 2.2, OBS3, 0, '', 0.9);
    b.islet(2.5, 13.2, -201, 1.5, OBS3, OBS);
    b.gems(3.5, -190, 'blue', 1, 0, 10.5);
    b.gems(2.5, -201, 'blue', 1, 0, 13.2);
    const sy = b.y(0, -209.5);
    b.updraft(-3, -212, 2.2, sy, 27, 36);
    b.story('wind', 0, -208, 4, () => g.hud.flick('Wind is rising over there! Jump, flap, and hold Space to glide into it.', 6));
    b.enemy('slinger', 1.5, -207.5, Math.PI);
    spire(b, -9, sy - 8, -205, 14, 1.2);
    spire(b, 9, sy - 10, -214, 16, 1.3);
    // An old lift, still waiting for a spark, to a Warden's lost desk.
    b.switchCrystal(2, -211.2, 'lightning', 'keep-lift');
    b.mover([[4.8, sy, -207.8], [14.2, b.y(17.5, -197), -199.6]], 2.6, 2.6, 2.6, OBS3, 0, 'keep-lift', 1.4);
    lectern(b, 18.4, b.y(17.5, -197), -196.2);
    b.collectible('relic3', 'relic', 17, -197.8, undefined, 'keep3');
    crystals(b, 19.5, b.y(19.5, -198.5), -198.5, 0.8);

    // --- The Eclipse Terrace ---------------------------------------------------------------------------
    const tz = -227.5;
    const ty = b.y(0, tz);
    const terrace = b.arena('terrace', 0, tz, 8.5, [
      [{ type: 'crawler', x: -4, z: tz - 3 }, { type: 'crawler', x: 4, z: tz - 3, delay: 0.3 }, { type: 'slinger', x: 0, z: tz - 6, delay: 0.5 }],
      [{ type: 'stoneGolem', x: -3.5, z: tz - 4 }, { type: 'frostGolem', x: 3.5, z: tz - 4, delay: 0.6 }],
    ], 50);
    terrace.onStart = () => g.hud.flick('Crawlers! Flip them with a heavy hit or Earth, then pile on.', 6);
    terrace.onClear = () => g.hud.flick('Golems from the Frostworks and the Plains... she stole them too. The throne is just ahead.', 6);
    for (const [x, z] of [[-7, -223], [7, -223], [-7, -235], [7, -235]] as const) {
      spire(b, x, b.y(x, z), z, 7, 0.7, true);
    }
    crystals(b, -6, ty, -219.5, 1);
    crystals(b, 6.5, ty, -220, 0.9);
    b.checkpoint('throne', 0, -238, Math.PI);
    b.story('last', 0, -241.5, 3, () => g.hud.flick('This is it. Whatever happens, Aster, I\'m right behind you. Way behind you. Safely behind you.', 7));

    // --- The Eclipse Throne ---------------------------------------------------------------------------
    const ay = b.y(AX, AZ);
    throneArena(b, flames, ay);
    let bossTrigger: Prop | null = null;
    const before = b.level.props.length;
    bossFight(b, {
      id: 'nyxa', x: AX, z: AZ, r: AR, triggerX: 0, triggerZ: -249, triggerR: 3,
      spawn: (gg) => new Nyxa(gg, 0, gg.col.groundAt(0, -271, ay + 5, 0.3).y, -271, 0, { x: AX, y: ay, z: AZ, r: AR }),
      intro: [
        { who: 'nyxa', text: 'So the violet egg hatched after all. I told him the river would take you.', action: () => {
          g.fx.shadowPoof(0, ay + 2, -271, 3);
          g.shake(0.4, 0.8);
          g.sfx('bossRoar', 0, ay, -271, 0.9);
        } },
        { who: 'aster', text: 'You\'re Nyxa. Emberhold says the shadow stole you from the Sanctum, the same night as me.' },
        { who: 'nyxa', text: 'Stole me? It RAISED me. It gave me wings and a purpose. What did your fireflies ever give you?' },
        { who: 'flick', text: 'A name, manners, and one extremely handsome best friend!' },
        { who: 'flick', text: 'Aster, she steps through the shadows. When she vanishes, get ready to dodge!' },
        { who: 'nyxa', text: 'Enough. Let the eclipse decide which of us was worth saving.' },
      ],
      onDefeated: (gg) => keepEnding(gg, bossTrigger),
    });
    if (b.level.props.length > before) bossTrigger = b.level.props[b.level.props.length - 1] ?? null;
    if (g.save.levelsDone.keep) b.portal(0, -272, 0, 'sanctum', 'Return to the Sanctum', 0xc9a2ff);
  },

  onEnter(g, fresh) {
    if (fresh && !g.save.found['story:keep:intro']) {
      g.save.found['story:keep:intro'] = true;
      g.say([
        { who: 'flick', text: 'Okay. Floating fortress. Purple fire. Moons eating the sun. This is the worst place we have ever been, and I have been inside a frog.' },
        { who: 'aster', text: 'Nyxa is up there somewhere. At the very top.' },
        { who: 'flick', text: 'Of course she is. Nobody ever builds an evil lair at the bottom.' },
        { who: 'aster', text: 'Four breaths, one dragon, one firefly. Let\'s finish this.' },
      ]);
    }
  },
};

// --- the ending -------------------------------------------------------------------------------------

function keepEnding(g: Game, trigger: Prop | null): void {
  const level = g.level;
  if (!level || level.def.id !== 'keep') return;
  // No rematch once she is free.
  if (trigger) {
    const i = level.props.indexOf(trigger);
    if (i >= 0) level.props.splice(i, 1);
  }
  const boss = g.boss;
  let x = boss ? boss.x : AX;
  let z = boss ? boss.z : AZ - 4;
  const off = Math.hypot(x - AX, z - AZ);
  if (off > AR - 4) {
    x = AX + ((x - AX) / off) * (AR - 4);
    z = AZ + ((z - AZ) / off) * (AR - 4);
  }
  const p = g.player;
  if (Math.hypot(p.x - x, p.z - z) < 3) {
    const n = Math.hypot(p.x - x, p.z - z) || 1;
    x = p.x + ((x - p.x) / n) * 3.5;
    z = p.z + ((z - p.z) / n) * 3.5;
  }
  const y = g.col.groundAt(x, z, 1e4, 0.3).y;
  const npc = new Npc(g, 'nyxa', FREED, x, y, z, Math.atan2(p.x - x, p.z - z));
  npc.pose.sleep = true;
  level.npcs.push(npc);
  g.fx.shadowPoof(x, y + 1, z, 3);
  g.fx.motes(x, y + 1, z, 0xffe0f0, 40);
  const lines: Line[] = [
    { who: 'nyxa', text: '...Where did it go? The voice. It was always there, and now there is only the wind.', action: () => {
      npc.pose.sleep = false;
      g.fx.motes(x, y + 1.5, z, 0x8ad8ff, 30);
    } },
    { who: 'aster', text: 'It\'s gone. Whatever it was, it isn\'t holding on to you anymore.' },
    { who: 'nyxa', text: 'I remember everything I did. The Wardens. The cages. You. It feels like someone else\'s bad dream.' },
    { who: 'flick', text: 'For the record, you hurt my feelings the most. But I\'m very forgiving. Mostly.' },
    { who: 'hollow', text: 'Heh... heh heh heh... Enjoy your quiet, little dragons. The moons always come back around.', shot: 'wide', action: () => {
      g.shake(0.8, 2.5);
      g.sfx('bossRoar', AX, y - 10, AZ, 0.45);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.fx.shadowPoof(AX + Math.sin(a) * (AR + 1), y - 1, AZ + Math.cos(a) * (AR + 1), 2.5);
      }
    } },
    { who: 'flick', text: 'Please tell me everyone else heard that.' },
    { who: 'aster', text: 'We heard it. Come on, Nyxa. There\'s a hatchery at the Sanctum, and an empty nest right next to mine.' },
    { who: 'nyxa', text: '...Next to yours. I think I remember that.' },
  ];
  g.say(lines, () => {
    g.save.levelsDone.keep = true;
    g.saveNow();
    g.menus.showEnding(ENDING);
  });
}

// --- props --------------------------------------------------------------------------------------------

/** Violet fire in the braziers, only near the dragon. */
class Flames implements Prop {
  private pts: { x: number; y: number; z: number; c: number }[] = [];
  constructor(private g: Game) {}
  add(x: number, y: number, z: number, c: number): void {
    this.pts.push({ x, y, z, c });
  }
  update(dt: number): void {
    const p = this.g.player;
    for (const f of this.pts) {
      if (Math.abs(f.x - p.x) > 32 || Math.abs(f.z - p.z) > 32) continue;
      if (!rng.chance(dt * 14)) continue;
      this.g.fx.emit(f.x, f.y, f.z, {
        count: 1, speed: 1.3, dir: [0, 1.5, 0], spread: 0.35, life: [0.3, 0.6], size: [0.3, 0.5], sizeEnd: 0.1, color: f.c, colorEnd: 0x3a0a60,
        bright: 1.8, gravity: -2.5, jitter: 0.12,
      });
    }
  }
}

/**
 * Signals for progress restored at load wait for the first frame that moves
 * time forward: the first frame after a page load can arrive with a negative
 * step, which would leave a gate opened during build stuck shut forever.
 */
class Deferred implements Prop {
  private queue: string[] = [];
  constructor(private g: Game) {}
  emit(signal: string): void {
    this.queue.push(signal);
  }
  update(dt: number): void {
    if (dt <= 0 || this.queue.length === 0) return;
    const q = this.queue;
    this.queue = [];
    for (const s of q) this.g.level?.emit(s);
  }
}

/**
 * Arena resets leave their enemies flagged dead but still thinking; retire
 * them properly so nothing invisible keeps swinging at the dragon.
 */
class Janitor implements Prop {
  constructor(private g: Game) {}
  update(): void {
    for (const e of this.g.enemies) {
      if (!e.alive && e.state !== 'dead') {
        e.setState('dead');
        e.deadT = 1;
      }
    }
  }
}

// --- scenery helpers ------------------------------------------------------------------------------------

function crystalMat(): THREE.MeshStandardMaterial {
  return mat(0x5a2090, { emissive: VIOLET, emissiveIntensity: 0.8, rough: 0.25, metal: 0.2, flat: true });
}

/** A cluster of shadow crystals growing out of the rock. */
function crystals(b: Builder, x: number, y: number, z: number, s = 1): void {
  const r = b.decor.rng;
  const n = 3 + Math.floor(r.next() * 3);
  for (let i = 0; i < n; i++) {
    const a = r.next() * Math.PI * 2;
    const d = i === 0 ? 0 : (0.35 + r.next() * 0.5) * s;
    const h = (i === 0 ? 1.5 : 0.6 + r.next() * 0.7) * s;
    b.decor.add(GEO.octa(), crystalMat(), x + Math.sin(a) * d, y + h * 0.3, z + Math.cos(a) * d, 0.3 * s, h, 0.3 * s, Math.cos(a) * 0.4, r.next() * 3, Math.sin(a) * 0.4);
  }
  b.decor.glowCrystal(x, y, z, 0.8 * s, MAGENTA);
}

/** A stone pillar in keep colors, with a collider. */
function obPillar(b: Builder, x: number, z: number, r: number, y0: number, top: number): void {
  const m = mat(OBS2, { rough: 0.85, flat: true });
  b.decor.add(GEO.cyl6(), m, x, y0, z, r * 1.2, 0.5, r * 1.2, 0, 0.3, 0);
  b.decor.add(GEO.cyl6(), m, x, y0, z, r, top - y0, r);
  b.decor.add(GEO.cyl6(), mat(TRIM, { rough: 0.6, flat: true }), x, top - 0.3, z, r * 1.18, 0.3, r * 1.18, 0, 0.3, 0);
  b.col.add(makeCyl(x, z, r, y0, top));
}

/** Tall obsidian spire with a glowing tip. */
function spire(b: Builder, x: number, y: number, z: number, h: number, r: number, collide = false): void {
  const turn = jitter(x * 1.3 + z) * 3;
  b.decor.add(GEO.cyl6(), mat(OBS, { rough: 0.8, flat: true }), x, y - 1, z, r, h * 0.45 + 1, r, 0, turn, 0);
  b.decor.add(GEO.cone(), mat(OBS2, { rough: 0.7, flat: true }), x, y + h * 0.45, z, r * 1.15, h * 0.55, r * 1.15, 0, turn, 0);
  b.decor.add(GEO.cyl6(), glow(VIOLET), x, y + h * 0.3, z, r * 1.03, 0.22, r * 1.03, 0, turn, 0, false);
  b.decor.add(GEO.octa(), glow(MAGENTA), x, y + h + 0.3, z, 0.22 * r + 0.1, 0.5 * r + 0.2, 0.22 * r + 0.1, 0, 0, 0, false);
  if (collide) b.col.add(makeCyl(x, z, r, y - 1, y + h));
}

/** A round tower with a pointed roof and a ring of lit windows. */
function tower(b: Builder, x: number, z: number, y0: number, r: number, h: number): void {
  b.decor.add(GEO.cyl6(), mat(OBS, { rough: 0.85, flat: true }), x, y0, z, r, h, r);
  b.decor.add(GEO.cyl6(), mat(OBS2, { rough: 0.8, flat: true }), x, y0 + h, z, r * 1.15, 0.5, r * 1.15, 0, 0.5, 0);
  b.decor.add(GEO.cone(), mat(0x3a2e52, { rough: 0.7, flat: true }), x, y0 + h + 0.5, z, r * 1.1, r * 2.6, r * 1.1, 0, 0.5, 0);
  b.decor.add(GEO.octa(), glow(MAGENTA), x, y0 + h + 0.7 + r * 2.6, z, 0.2, 0.45, 0.2, 0, 0, 0, false);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.26;
    b.decor.add(GEO.box(), glow(i % 2 ? VIOLET : ROSE), x + Math.sin(a) * r, y0 + h * 0.72, z + Math.cos(a) * r, 0.3, 0.8, 0.1, 0, a, 0, false);
  }
  b.col.add(makeCyl(x, z, r, y0, y0 + h));
}

/** A wall with merlons along the top. */
function rampart(b: Builder, x1: number, z1: number, x2: number, z2: number, y: number, h: number): void {
  b.wall(x1, z1, x2, z2, y - 1, h + 1, 1.2, OBS);
  const len = Math.hypot(x2 - x1, z2 - z1);
  const yaw = Math.atan2(x2 - x1, z2 - z1);
  const n = Math.max(1, Math.floor(len / 1.6));
  const m = mat(OBS2, { rough: 0.85, flat: true });
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    b.decor.add(GEO.box(), m, x1 + (x2 - x1) * t, y + h + 0.35, z1 + (z2 - z1) * t, 1.1, 0.7, 0.8, 0, yaw, 0);
  }
  b.decor.add(GEO.box(), mat(TRIM, { rough: 0.6, flat: true }), (x1 + x2) / 2, y + h - 0.05, (z1 + z2) / 2, 1.3, 0.12, len, 0, yaw, 0, false);
}

/** A stone causeway with lamp posts and chain rails. */
function causeway(b: Builder, ax: number, az: number, ay: number, bx: number, bz: number, by: number, w: number): void {
  const len = Math.hypot(bx - ax, bz - az);
  const yaw = Math.atan2(bx - ax, bz - az);
  b.ramp((ax + bx) / 2, (az + bz) / 2, w, len, yaw, ay, by, OBS2, 0.8);
  // A glowing seam down each edge so the path reads at night.
  const seam = glow(0x7a3ac0);
  for (const side of [-1, 1]) {
    const ox = Math.cos(yaw) * side * (w / 2 - 0.08);
    const oz = -Math.sin(yaw) * side * (w / 2 - 0.08);
    const n = Math.max(2, Math.round(len / 4));
    let px = 0;
    let py = 0;
    let pz = 0;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = ax + (bx - ax) * t + ox;
      const z = az + (bz - az) * t + oz;
      const y = ay + (by - ay) * t;
      b.decor.add(GEO.cyl6(), mat(OBS, { rough: 0.8, flat: true }), x, y - 0.1, z, 0.13, 1.3, 0.13);
      b.decor.add(GEO.octa(), glow(i % 2 ? VIOLET : MAGENTA), x, y + 1.35, z, 0.11, 0.18, 0.11, 0, 0, 0, false);
      if (i > 0) chain(b, px, py + 1.05, pz, x, y + 1.05, z, 0.3);
      px = x;
      py = y;
      pz = z;
    }
    const mx = (ax + bx) / 2 + ox;
    const mz = (az + bz) / 2 + oz;
    const rise = by - ay;
    b.decor.add(GEO.box(), seam, mx, (ay + by) / 2 + 0.02, mz, 0.1, 0.05, Math.hypot(len, rise), -Math.atan2(rise, len), yaw, 0, false);
  }
}

/** Chain links hung between two points. */
function chain(b: Builder, ax: number, ay: number, az: number, bx: number, by: number, bz: number, sag = 0.6): void {
  const len = Math.hypot(bx - ax, by - ay, bz - az);
  const n = Math.max(2, Math.round(len / 0.34));
  const yaw = Math.atan2(bx - ax, bz - az);
  const m = mat(0x6a6484, { rough: 0.45, metal: 0.6 });
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = ax + (bx - ax) * t;
    const z = az + (bz - az) * t;
    const y = ay + (by - ay) * t - Math.sin(t * Math.PI) * sag;
    if (i % 2 === 0) b.decor.add(LINK, m, x, y, z, 1, 1, 1, 0, yaw + Math.PI / 2, 0, false);
    else b.decor.add(LINK, m, x, y, z, 1, 1, 1, -Math.PI / 2, 0, yaw - Math.PI / 2, false);
  }
}

/** A brazier of violet fire. */
function brazier(b: Builder, flames: Flames, x: number, y: number, z: number, color = MAGENTA): void {
  b.decor.add(GEO.cyl6(), mat(OBS2, { rough: 0.8, flat: true }), x, y, z, 0.22, 1.1, 0.22);
  b.decor.add(GEO.cyl(), mat(0x4a3e5c, { rough: 0.5, metal: 0.4 }), x, y + 1.0, z, 0.5, 0.32, 0.5);
  b.decor.add(GEO.blobLow(), glow(color), x, y + 1.45, z, 0.3, 0.42, 0.3, 0, 0, 0, false);
  b.col.add(makeCyl(x, z, 0.35, y, y + 1.3));
  flames.add(x, y + 1.5, z, color);
}

/** A banner of the eclipse hanging from a crossbar. */
function banner(b: Builder, x: number, y: number, z: number, yaw: number): void {
  const cloth = mat(0x4a1238, { rough: 0.95, side: THREE.DoubleSide });
  b.decor.add(GEO.box(), mat(OBS2, { flat: true }), x, y + 4.1, z, 1.8, 0.12, 0.12, 0, yaw, 0);
  b.decor.add(GEO.box(), cloth, x, y + 2.2, z, 1.4, 3.6, 0.05, 0, yaw, 0);
  const fx = Math.sin(yaw) * 0.04;
  const fz = Math.cos(yaw) * 0.04;
  b.decor.add(GEO.octa(), glow(ROSE), x + fx, y + 2.8, z + fz, 0.34, 0.34, 0.04, 0, yaw, 0, false);
  b.decor.add(GEO.box(), glow(0x2a0a20), x + fx * 1.5, y + 2.8, z + fz * 1.5, 0.3, 0.3, 0.02, 0, yaw, Math.PI / 4, false);
}

/** Two pillars and a pointed arch. */
function gothicArch(b: Builder, x: number, z: number, yaw: number, w: number, h: number): void {
  const y0 = b.y(x, z);
  for (const side of [-1, 1]) {
    obPillar(b, x + Math.cos(yaw) * side * w * 0.5, z - Math.sin(yaw) * side * w * 0.5, 0.45, y0 - 0.5, y0 + h);
  }
  pointedTop(b, x, z, yaw, w, y0 + h, OBS2);
}

/** The pointed crown of an arch whose feet stand w apart at height y. */
function pointedTop(b: Builder, x: number, z: number, yaw: number, w: number, y: number, color: number): void {
  const rise = w * 0.55;
  const len = Math.hypot(w / 2, rise);
  const lean = Math.atan2(w / 2, rise);
  const m = mat(color, { rough: 0.85, flat: true });
  for (const side of [-1, 1]) {
    const lx = side * w * 0.25;
    b.decor.add(GEO.box(), m, x + Math.cos(yaw) * lx, y + rise / 2, z - Math.sin(yaw) * lx, 0.45, len, 0.55, 0, yaw, side * lean);
  }
  b.decor.add(GEO.octa(), glow(MAGENTA), x, y + rise + 0.1, z, 0.2, 0.3, 0.2, 0, yaw, 0, false);
}

/** A great round window of violet light. */
function roseWindow(b: Builder, x: number, y: number, z: number): void {
  const root = b.level.root;
  for (const [r, t, c] of [[2.4, 0.16, MAGENTA], [1.5, 0.1, VIOLET], [0.5, 0.12, ROSE]] as const) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, t, 6, 36), glow(c));
    ring.position.set(x, y, z);
    root.add(ring);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.decor.add(GEO.box(), glow(VIOLET), x + Math.sin(a) * 1.45, y + Math.cos(a) * 1.45, z, 0.1, 1.9, 0.1, 0, 0, -a, false);
  }
  const back = new THREE.Mesh(new THREE.CircleGeometry(2.5, 32), new THREE.MeshBasicMaterial({ color: 0x3a1060 }));
  back.position.set(x, y, z - 0.05);
  root.add(back);
}

/** The broken nest where the shadow once kept an egg. */
function nest(b: Builder, x: number, y: number, z: number): void {
  const twig = mat(0x3a2e3a, { rough: 1 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    b.decor.add(GEO.cyl6(), twig, x + Math.sin(a) * 0.7, y + 0.1, z + Math.cos(a) * 0.7, 0.06, 1.1, 0.06, Math.PI / 2, a, 0.3);
  }
  const shell = mat(0x7a6a8a, { rough: 0.4 });
  b.decor.add(GEO.cap(), shell, x - 0.2, y + 0.15, z, 0.42, 0.5, 0.42, 0.4, 0, 0.3);
  b.decor.add(GEO.cap(), shell, x + 0.35, y + 0.1, z + 0.2, 0.4, 0.45, 0.4, Math.PI - 0.5, 0.4, 0);
}

/** A robed, crowned figure with nothing inside the hood. */
function hollowStatue(b: Builder, x: number, y: number, z: number): void {
  const stone = mat(0x1e1828, { rough: 0.8, flat: true });
  b.decor.add(GEO.cyl6(), mat(OBS2, { flat: true }), x, y, z, 1.1, 0.5, 1.1);
  b.decor.add(GEO.cone(), stone, x, y + 0.5, z, 0.9, 3.2, 0.9, 0, 0.4, 0);
  b.decor.add(GEO.blob(), stone, x, y + 3.5, z, 0.5, 0.6, 0.5);
  for (let i = 0; i < 5; i++) {
    const a = -0.9 + i * 0.45;
    b.decor.add(GEO.cone(), glow(VIOLET), x + Math.sin(a) * 0.4, y + 3.9, z + Math.cos(a) * 0.4 - 0.4, 0.07, 0.55, 0.07, Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3, false);
  }
  for (const sx of [-1, 1]) b.decor.add(GEO.blobLow(), glow(ROSE), x + 0.45, y + 3.55, z + sx * 0.16, 0.05, 0.06, 0.05, 0, 0, 0, false);
  b.col.add(makeCyl(x, z, 0.9, y, y + 4));
}

/** A Warden's writing desk, abandoned on a rock in the sky. */
function lectern(b: Builder, x: number, y: number, z: number): void {
  const wood = mat(0x4a3a2e, { rough: 0.9 });
  b.decor.add(GEO.box(), wood, x, y + 0.5, z, 0.3, 1, 0.3);
  b.decor.add(GEO.box(), wood, x, y + 1.05, z, 1.1, 0.12, 0.8, 0.35, 0.6, 0);
  const page = mat(0xe8dcc0, { rough: 0.9 });
  b.decor.add(GEO.box(), page, x - 0.2, y + 1.14, z + 0.05, 0.42, 0.03, 0.56, 0.35, 0.8, 0);
  b.decor.add(GEO.box(), page, x + 0.22, y + 1.14, z - 0.1, 0.42, 0.03, 0.56, 0.35, 0.4, 0);
  b.decor.lantern(x + 1.2, y, z + 0.6, 0xffd890);
}

/** The throne platform: sigils, spires, chains and the eclipse overhead. */
function throneArena(b: Builder, flames: Flames, y: number): void {
  const root = b.level.root;
  // Floor sigils. The inner ring marks where the shadow cannot reach.
  const sig = (r: number, t: number, c: number) => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r - t, r, 64, 1), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(AX, y + 0.04, AZ);
    root.add(ring);
  };
  sig(3.2, 0.18, MAGENTA);
  sig(8.5, 0.12, VIOLET);
  sig(AR - 5.5, 0.22, ROSE);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    b.decor.add(GEO.box(), glow(0x6a2ab0), AX + Math.sin(a) * 5.9, y + 0.05, AZ + Math.cos(a) * 5.9, 0.1, 0.02, 5.1, 0, a, 0, false);
  }
  // Spires on rocks around the rim, chained to the throne.
  const ring = AR + 5;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = AX + Math.sin(a) * ring;
    const z = AZ + Math.cos(a) * ring;
    const yy = y - 3 + (i % 3) * 1.5;
    b.decor.add(GEO.cone(), mat(OBS, { rough: 1, flat: true }), x, yy, z, 2.4, 8, 2.4, Math.PI);
    b.decor.add(GEO.cyl6(), mat(OBS3, { rough: 1, flat: true }), x, yy - 0.5, z, 2.5, 0.6, 2.5);
    spire(b, x, yy, z, 14 + (i % 2) * 5, 1.2);
    if (i % 2 === 0) chain(b, x, yy + 10, z, AX + Math.sin(a) * 6, y + 26, AZ + Math.cos(a) * 6, 2.5);
  }
  // The throne, on a dais past the north rim.
  const tz = AZ - AR - 4;
  b.box(AX, y - 1.5, tz, 12, 1.5, 7, OBS2, { trim: TRIM });
  b.decor.add(GEO.cone(), mat(OBS, { rough: 1, flat: true }), AX, y - 1.5, tz, 6, 10, 4, Math.PI);
  b.box(AX, y, tz - 1, 3.4, 1.2, 2.4, OBS);
  b.box(AX, y + 1.2, tz - 2, 3.4, 5, 0.8, OBS);
  for (const sx of [-1, 1]) {
    b.decor.add(GEO.cone(), mat(OBS2, { flat: true }), AX + sx * 1.6, y + 6.2, tz - 2, 0.4, 2.2, 0.4);
    brazier(b, flames, AX + sx * 4.5, y, tz + 1.5, ROSE);
    banner(b, AX + sx * 3.2, y, tz - 2.4, 0);
  }
  b.decor.add(GEO.octa(), glow(ROSE), AX, y + 5.2, tz - 1.55, 0.5, 0.7, 0.1, 0, 0, 0, false);
  // The eclipse: a black sun burning in a violet ring.
  const ex = AX;
  const ey = y + 32;
  const ez = AZ - 12;
  const sun = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 16), new THREE.MeshBasicMaterial({ color: 0x06030c }));
  sun.position.set(ex, ey, ez);
  root.add(sun);
  for (const [r, t, c] of [[6.4, 0.35, MAGENTA], [7.2, 0.18, ROSE], [8.4, 0.08, VIOLET]] as const) {
    const corona = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 64), glow(c, 0.9, true));
    corona.position.set(ex, ey, ez);
    root.add(corona);
  }
  const halo = new THREE.Mesh(new THREE.CircleGeometry(11, 48), glow(0x6a1aa0, 0.35, true));
  halo.position.set(ex, ey, ez - 0.5);
  root.add(halo);
  for (const [x, z] of [[-12, -255], [12, -255], [-10, -272], [10, -272]] as const) crystals(b, x, b.y(x, z), z, 1.3);
  // A little healing for a long fight.
  b.crystal(AX - 9, AZ + 4, 'red', 4);
  b.crystal(AX + 9, AZ - 4, 'red', 4);
  b.crystal(AX + 2, AZ + 10, 'green', 4);
}

/** Far-off rocks and spires that float around the keep. */
function backdrop(b: Builder): void {
  const rock = mat(0x241c34, { rough: 1, flat: true });
  const top = mat(0x3a3250, { rough: 1, flat: true });
  const spots: [number, number, number, number][] = [
    [-52, 10, -10, 6], [48, -20, 4, 7], [-60, -80, 14, 9], [62, -120, -4, 8], [-45, -160, 20, 6], [55, -190, 26, 9],
    [-58, -230, 8, 7], [50, -260, 34, 8], [-36, -40, -14, 4], [34, -86, 22, 5], [-30, -205, -6, 5], [30, -150, -12, 4],
    [0, 40, -20, 7], [-20, -295, 40, 6],
  ];
  for (const [x, z, y, s] of spots) {
    b.decor.add(GEO.cyl6(), top, x, y - 0.6, z, s, 0.8, s * 0.9, 0, jitter(x) * 3, 0);
    b.decor.add(GEO.cone(), rock, x, y - 0.6, z, s * 0.95, s * 2.2, s * 0.85, Math.PI, jitter(z) * 3, 0);
    spire(b, x + s * 0.2, y, z - s * 0.1, s * 2.2, s * 0.22);
    if (s > 6) spire(b, x - s * 0.45, y, z + s * 0.3, s * 1.3, s * 0.15);
  }
}
