import * as THREE from 'three';
import type { LevelDef, Builder } from '../world/level';
import { Npc } from '../world/level';
import { ambient, paint, jitter, bossFight, Cage } from './common';
import { Bogmaw } from '../enemies/bosses/bogmaw';
import { EMBERHOLD } from '../game/story';
import type { Game } from '../game/game';
import { GEO } from '../render/decor';
import { mat, glow } from '../render/materials';
import { mergeStatic } from '../render/shapes';
import { makeCyl, makeRamp, type Surface } from '../world/collision';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const stakeGeo = (() => {
  const g = new THREE.CylinderGeometry(0.08, 0.2, 1, 5);
  g.translate(0, 0.5, 0);
  return g;
})();

/**
 * Marshlight Fen: the firefly marsh. Tutorial level. Teaches movement,
 * jumping, flapping, gliding, horn and tail combos, dodging, charging, and
 * ends with Bogmaw. Two secrets need elements learned later.
 */

const COLORS = paint({
  under: 0x3a3424, shore: 0x5a5a32, grass: 0x4a7a36, grass2: 0x5e8a40, rock: 0x6a665a, path: 0x7a6a48, high: 0x6a8a4a, highAt: 4,
});

export const fen: LevelDef = {
  id: 'fen',
  name: 'Marshlight Fen',
  subtitle: 'Where the fireflies keep their secrets',
  music: 'fen',
  killY: -25,
  spawn: [0, 2, Math.PI],
  sky: {
    top: 0x24305e, horizon: 0xd8987a, bottom: 0x28283a, sunDir: [0.55, 0.28, -0.6], sunColor: 0xffc890, sunIntensity: 1.9,
    hemiSky: 0x9ab0e0, hemiGround: 0x3a4a2a, hemiIntensity: 1.0, fogNear: 35, fogFar: 190, stars: 0.4, fog: 0xa89090,
  },
  water: { level: 0, deep: 0x1a3226, shallow: 0x3a6a4a, glint: 0xb0e8b0, opacity: 0.86 },
  terrain: {
    x0: -80, z0: -40, sizeX: 160, sizeZ: 290, cell: 1.5,
    color: COLORS,
    shape: (s) => {
      s.base(-2.4).noise(0.9, 0.035, 3);
      // Firefly Hollow and the raft beach.
      s.island(0, 0, 17, 1.0, 5, 0.4);
      s.island(-13, -15, 6, 0.4, 3, 0.2);
      // Causeway north.
      s.path([[0, 14, 1.0], [3, 24, 0.7], [-1, 32, 0.6]], 5, 3);
      // Stepping stones.
      s.island(1, 38, 2.2, 0.8, 1.2, 0);
      s.island(-2, 43.5, 2.2, 0.9, 1.2, 0);
      s.island(2, 49, 2.2, 1.0, 1.2, 0);
      s.island(0, 58, 5, 1.0, 2, 0.2);
      // Willow clearing, a flap above the landing.
      s.island(0, 77, 13, 3.4, 3, 0.3);
      s.island(-32, 83, 4.5, 2.0, 2, 0.1);
      // Ruin island.
      s.island(0, 122, 15, 1.2, 4, 0.3);
      s.island(9, 136.5, 3, 1.1, 1.5, 0);
      s.path([[-14, 121, 1.2], [-26, 119, 1.3]], 4, 2);
      s.island(-40, 118, 7, 1.4, 3, 0.2);
      // East bog: shallow wading water with dry islands.
      s.path([[14, 124, 1.2], [24, 130, 0.9]], 4, 2);
      s.island(38, 142, 17, -0.42, 3, 0.1);
      s.island(31, 135, 3.2, 1.2, 2, 0.1);
      s.island(47, 146, 3.2, 1.4, 2, 0.1);
      s.island(38, 154, 3.2, 1.0, 2, 0.1);
      s.island(46, 132, 3.5, 1.0, 2, 0.1);
      // Onward to the Gloom camp.
      s.path([[38, 156, 1.0], [26, 162, 1.2], [16, 166, 1.4]], 5, 3);
      s.island(6, 174, 18, 1.4, 4, 0.3);
      s.path([[-12, 172, 1.4], [-22, 170, 1.4]], 4, 2);
      s.island(-30, 170, 5.5, 1.5, 2, 0.1);
      // Bogmaw's hollow.
      s.path([[6, 190, 1.4], [2, 198, 1.2]], 6, 3);
      s.island(0, 216, 22, 1.2, 4, 0.2);
      // --- Optional corners (all out in open water, clear of the older ground) ---
      // Old Wick's lamphouse, west of the Hollow, over two reed hummocks.
      s.island(-24.5, 7, 2.3, 0.8, 1.4, 0);
      s.island(-29.8, 9.2, 2.1, 0.9, 1.4, 0);
      s.island(-47, 11, 10, 1.2, 3, 0.3);
      s.island(-40, 21.5, 3.6, 0.9, 2, 0.1);
      // The Drowned Mill, off the ruin island's south-east shore.
      s.island(30, 104, 10, 1.3, 3, 0.3);
      s.island(22.5, 97, 3.2, 1.0, 2, 0.1);
      // The Gloom nest east of the camp.
      s.island(27.5, 182.5, 1.8, 1.2, 1.2, 0);
      s.island(35, 187, 4.4, 1.4, 1.6, 0.1);
    },
  },

  build(b: Builder) {
    const g = b.game;
    ambient(b, 'firefly', 14);
    b.bound(-78, -38, 78, -38);
    b.bound(78, -38, 78, 248);
    b.bound(78, 248, -78, 248);
    b.bound(-78, 248, -78, -38);

    // --- Firefly Hollow -------------------------------------------------------
    const mushroomColors = [0xff7ab0, 0x9a7aff, 0x7ad0ff, 0xffb05a];
    [[-9, -4, 3.4], [8, -7, 3.0], [-6, 9, 2.6], [12, 4, 4.0], [-13, 4, 2.2]].forEach(([x, z, s], i) => {
      b.mushroom(x!, z!, s!, mushroomColors[i % 4]!, true);
    });
    // The tall mushroom has a relic on top.
    const bigTop = b.y(12, 4) + 6.2;
    b.box(12, bigTop - 0.4, 4, 5.2, 0.4, 5.2, 0, { noMesh: true, surface: 'mud' });
    b.collectible('relic2', 'relic', 12, 4, bigTop, 'fen2');
    b.shroom(6, 10, 17, 0xff5a9a);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      lantern(b, Math.sin(a) * 14, b.y(Math.sin(a) * 14, Math.cos(a) * 14), Math.cos(a) * 14, i % 2 ? 0xfff0a0 : 0xa0ffb0);
    }
    b.scatter(60, 0, 0, 16, (x, z, y) => b.decor.grass(x, y, z, 0.9, 0x6aa84a));
    b.scatter(24, 0, 0, 15, (x, z, y) => b.decor.flower(x, y, z, [0xff9ad0, 0xffe070, 0xc0a0ff][Math.floor(Math.abs(jitter(x + z)) * 3)]!));
    b.crystal(-4, -8, 'blue', 8);
    b.crystal(5, -10, 'blue', 8);
    b.crystal(-10, 12, 'red', 3);
    b.crystal(3, 13, 'green', 3);
    b.gemLine([[0, 8], [0, 16], [3, 24]]);
    b.collectible('relic1', 'relic', -13, -16, undefined, 'fen1');
    // The raft that carried the egg, and the note that came with it.
    b.box(-14, 0.1, -18.5, 2.6, 0.25, 1.6, 0x8a6a44, { yaw: 0.4, surface: 'wood' });
    b.letter('glimmer', -11.2, -19.8);
    // The fireflies' stores: crates, barrels and urns to smash, a chest, and a lost egg.
    b.pile(-7, 3.5, 1.7, 5, ['crate', 'barrel', 'crate', 'urn', 'basket']);
    b.breakables('urn', [[6.5, -3], [7.6, -1.6], [5.4, -1.2]]);
    b.chest('hollow', -2.5, -13, 0.3, { blue: 18, red: 2 });
    b.egg('hollow', 14.5, -8.5);

    b.story('intro-move', 0, 6, 5, () => g.hud.flick('WASD to move, mouse to look. Race you to the old willow! Loser eats a beetle.', 6));
    b.story('crystals', 0, -6, 4, () => g.hud.flick('Smash crystals with your horns (Left Mouse) for gems!', 5));

    // --- Causeway and stepping stones --------------------------------------------
    b.scatter(40, 0, 25, 14, (x, z, y) => b.decor.reeds(x, y, z, 1));
    for (let i = 0; i < 26; i++) {
      const x = jitter(i, 1) * 14;
      const z = 20 + i * 1.6 + jitter(i, 2) * 3;
      if (Math.abs(x) > 4) b.decor.lilypad(x, 0, z, 0.6 + Math.abs(jitter(i, 3)) * 0.5);
    }
    b.story('jump', -1, 33, 3, () => g.hud.flick('Space to jump across the stones!', 5));
    b.gems(1, 38, 'blue', 1);
    b.gems(-2, 43.5, 'blue', 1);
    b.gems(2, 49, 'blue', 1);
    b.story('flap', 0, 60, 4, () => g.hud.flick('Too high to jump? Press Space again in mid-air to flap your wings!', 6));
    b.gemLine([[0, 60], [0, 64]], 'blue', 1);

    // --- Willow clearing ---------------------------------------------------------------
    b.tree(-7, 76, 2.1, 'willow', { leaf: 0x4a7a40 });
    b.scatter(18, 0, 77, 12, (x, z) => b.tree(x, z, 0.8 + Math.abs(jitter(x)) * 0.5, 'round', { leaf: 0x4f8a3a }),
      (x, z) => Math.hypot(x, z - 77) > 7 && Math.abs(x) > 5 && Math.hypot(x + 7, z - 76) > 5 && !(x > 0 && x < 14 && Math.abs(z - 71) < 6));
    b.scatter(50, 0, 77, 12, (x, z, y) => b.decor.grass(x, y, z, 1, 0x5a9a42));
    // The old storehouse: a door held open by a weight plate. Horns can't move the boulder; Tail and Charge can.
    const vy = b.y(8.5, 71);
    b.wall(6.8, 72.9, 11.2, 72.9, vy, 3.4, 0.8, 0x8a8272);
    b.wall(6.8, 69.1, 11.2, 69.1, vy, 3.4, 0.8, 0x8a8272);
    b.wall(11.2, 69.1, 11.2, 72.9, vy, 3.4, 0.8, 0x8a8272);
    b.platform(9, vy + 3.8, 71, 5.4, 4.6, 0x8a8272, 0.4);
    b.holdGate(6.8, 71, 3, 3, Math.PI / 2, 'fen-store', vy);
    b.weightPlate(2.6, 71, 'fen-store');
    b.boulder(-4, 67);
    b.crystal(9, 71, 'mixed', 24, true, vy);
    b.puzzleHint(3, 71, 8, [
      'That door has a plate in front of it. Something heavy has to sit on it.',
      'Horns just bounce off that boulder. Hit it with your Tail (E) or Charge into it (hold Shift) to roll it!',
    ], 'fen-store', 20, 25);
    const willowArena = b.arena('willow', 0, 75, 11, [
      [{ type: 'grunt', x: -5, z: 80 }, { type: 'grunt', x: 5, z: 80, delay: 0.3 }],
      [{ type: 'grunt', x: -6, z: 70 }, { type: 'grunt', x: 6, z: 70, delay: 0.2 }, { type: 'grunt', x: 0, z: 82, delay: 0.5 }],
    ], 30);
    willowArena.onStart = () => {
      if (!g.save.found['story:fen:gloomFirst']) {
        g.save.found['story:fen:gloomFirst'] = true;
        g.say([
          { who: 'flick', text: 'Uh, Aster? Those are NOT swamp toads.' },
          { who: 'gloom', text: 'Hssss... the violet one. The master wants it.' },
          { who: 'aster', text: 'Master? Who are you calling "it"?!' },
          { who: 'flick', text: 'Horns! Use your horns! Left Mouse, and keep clicking for a combo!' },
        ], () => g.hud.flick('Tap Shift to dodge. Dodge right before a hit to slow time and counter!', 7));
      }
    };
    willowArena.onClear = () => g.hud.flick('Nice! Hold Space after a flap to glide. Those ruins up the steps are the way north.', 7);
    // Steps up to the glide ledge.
    b.stairs(0, 86.5, 4, 0, 3.4, 8, 7);
    b.platform(0, 8, 93.5, 8, 5, 0xa89e8a);
    b.pillar(-3.4, 95.5, 0.5, 8, 10.5);
    b.pillar(3.4, 95.5, 0.5, 8, 10.5);
    b.story('glide', 0, 93, 3, () => g.hud.flick('Jump, flap, then HOLD Space to glide over the water!', 6));
    b.gemLine([[0, 100], [0, 106]], 'blue', 2);
    b.collectible('mana1', 'mana', -32, 83);
    b.crystal(-30, 81, 'green', 4);

    // --- Ruin island -------------------------------------------------------------------
    b.checkpoint('ruins', 0, 115, 0);
    b.story('wardstone', 0, 115, 5, () => g.hud.flick('A Wardstone! It saves your progress. Press F to spend blue gems on abilities.', 7));
    b.arch(0, 128, 0, 6, 5);
    [[-8, 118], [8, 119], [-10, 128], [10, 130], [-4, 133], [5, 134]].forEach(([x, z], i) => b.decor.pillar(x!, b.y(x!, z!), z!, 0.6, 3 + (i % 3), 0xb8ad98, i % 2 === 0));
    b.collectible('relic3', 'relic', 6, 124, undefined, 'fen3');
    b.box(6, b.y(6, 124) - 0.2, 124.9, 1.6, 1.2, 0.5, 0x8a8272);
    b.scatter(40, 0, 122, 13, (x, z, y) => b.decor.grass(x, y, z, 0.9, 0x5a8a42));
    b.crystal(-6, 112, 'blue', 10, true);
    b.crystal(8, 113, 'red', 3);
    // Sealed shrine: a lightning crystal opens it (come back later).
    const sx = -9;
    const sz = 136;
    const sy = b.y(sx, sz);
    b.wall(sx - 4, sz - 3, sx - 4, sz + 3, sy, 4);
    b.wall(sx + 4, sz - 3, sx + 4, sz + 3, sy, 4);
    b.wall(sx - 4, sz + 3, sx + 4, sz + 3, sy, 4);
    b.platform(sx, sy + 4.4, sz, 9, 7, 0x8a8272, 0.4);
    b.gate(sx, sz - 3, 7, 4, 0, 'stone', 'fen-shrine');
    b.switchCrystal(sx - 6, sz - 5, 'lightning', 'fen-shrine');
    b.crystal(sx, sz + 1, 'mixed', 40, true);
    // West: cracked rock hides a heart shard.
    b.gate(-18, 121, 4, 3.5, Math.PI / 2 + 0.15, 'rock');
    b.wall(-18, 117, -18, 119, 1.2, 4, 1.2);
    b.wall(-18, 123, -18, 125, 1.2, 4, 1.2);
    b.collectible('heart2', 'heart', -41, 118);
    b.crystal(-38, 122, 'blue', 12);
    b.tree(-43, 114, 1.2, 'dead');
    // East: a barricade to charge through.
    b.gate(14, 124.5, 4.5, 3, Math.PI / 2 - 0.4, 'wood');
    b.story('charge', 10, 124, 4, () => g.hud.flick('A barricade! Hold Shift to charge straight through it!', 6));

    // The Gloom eye: a statue on a drum of rock that shoots bolts. Bat one back into the switch beside it
    // and the drawbridge drops to its hoard. It only watches the ruins, not the camp beyond.
    const ex = 9;
    const ez = 150;
    const et = 1.4;
    b.pillar(ex, ez, 4.4, -3, et, 0x8a8272);
    b.boltTurret(ex + 2.2, ez - 0.6, 17, 2.8, et, 'fen-eye', Math.PI);
    b.reflectSwitch(ex - 2.2, ez - 0.6, 'fen-eye', et);
    b.drawbridge(ex, et, ez - 4.2, Math.PI, 8.6, 2.6, 'fen-eye');
    // The hoard sits in a Gloom cage that breaks with the eye's spell.
    const cage = new Cage(b, ex, ez + 2.2, 1.7, 3.2);
    const cageSolid = b.col.add(makeCyl(ex, ez + 2.2, 2.0, et, et + 3.2));
    b.crystal(ex, ez + 2.2, 'mixed', 30, true, et);
    b.level.on('fen-eye', () => {
      cage.shatter(g);
      cageSolid.enabled = false;
    });
    b.story('eye', ex, 134, 4, () => g.hud.flick('That eye statue shoots bolts! Swing your horns just as one reaches you to bat it back at the other eye!', 8));
    b.puzzleHint(ex, 137, 10, [
      'Face the statue and tap Horn (Left Mouse) right as a bolt reaches you. It flies back to the other eye!',
    ], 'fen-eye', 20);

    // --- East bog ------------------------------------------------------------------------
    b.scatter(50, 38, 142, 16, (x, z, y) => b.decor.reeds(x, y, z, 1.1), () => true);
    for (let i = 0; i < 30; i++) b.decor.lilypad(38 + jitter(i, 5) * 15, 0, 142 + jitter(i, 6) * 15, 0.7);
    b.enemy('slinger', 31, 135, Math.PI);
    b.enemy('slinger', 47, 146, Math.PI);
    b.enemy('grunt', 36, 142, Math.PI);
    b.enemy('grunt', 42, 138, Math.PI);
    b.story('dodge', 28, 131, 5, () => g.hud.flick('They\'re throwing shadow bolts! Dodge (Shift) just before they hit, or bat them back with your horns!', 7));
    b.shroom(44, 131, 19, 0xff5a9a);
    b.pillar(53, 126, 2.6, -2, 9.5, 0x8a8272);
    b.collectible('heart1', 'heart', 53, 126, 9.5);
    b.crystal(38, 154, 'blue', 8);
    b.crystal(47, 147, 'green', 3);
    b.gemLine([[26, 130], [31, 135]]);

    // --- Gloom camp ------------------------------------------------------------------------
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = 16.5;
      const x = 6 + Math.sin(a) * r;
      const z = 174 + Math.cos(a) * r;
      if (Math.abs(Math.cos(a) + 0.9) < 0.3 || Math.abs(Math.cos(a) - 0.95) < 0.2 || Math.abs(Math.sin(a) + 1) < 0.15) continue;
      b.decor.add(stakeGeo, mat(0x4a3424, { rough: 1 }), x, b.y(x, z), z, 1, 2 + (i % 3) * 0.4, 1, Math.sin(a) * 0.25, 0, Math.cos(a) * 0.25);
    }
    [[0, 180], [14, 170], [-2, 166]].forEach(([x, z]) => tent(b, x!, z!));
    const camp = b.arena('camp', 6, 174, 15, [
      [{ type: 'grunt', x: 0, z: 170 }, { type: 'grunt', x: 12, z: 172 }, { type: 'grunt', x: 6, z: 182, delay: 0.3 }],
      [{ type: 'slinger', x: -4, z: 178 }, { type: 'slinger', x: 16, z: 178 }, { type: 'grunt', x: 6, z: 166, delay: 0.4 }, { type: 'grunt', x: 2, z: 180, delay: 0.6 }],
      [{ type: 'shieldbearer', x: 6, z: 180 }, { type: 'grunt', x: 0, z: 168, delay: 0.3 }, { type: 'grunt', x: 12, z: 168, delay: 0.5 }],
    ], 50);
    camp.onStart = () => g.hud.flick('A whole camp of them! Mix up Horn and Tail. The fancier your combos, the more gems they drop!', 7);
    const shieldHint = () => g.hud.flick('That one has a shield! Tail attacks (E) smash guards. Or get behind it!', 7);
    camp.onClear = () => g.hud.flick('We did it! The trail keeps going north... it smells awful up there.', 6);
    b.trigger(6, 174, 15, () => {
      if (g.enemies.some((e) => e.alive && e.def.id === 'shieldbearer')) shieldHint();
    }, false);
    b.gate(-11, 172, 4, 3.5, Math.PI / 2, 'vines');
    b.wall(-11, 168, -11, 170, 1.4, 4, 1);
    b.wall(-11, 174, -11, 176, 1.4, 4, 1);
    b.collectible('mana2', 'mana', -31, 170);
    b.crystal(-28, 173, 'purple', 3);
    b.crystal(-30, 166, 'blue', 10);
    b.checkpoint('camp', 8, 191, 0);
    b.scatter(30, 6, 174, 16, (x, z, y) => b.decor.grass(x, y, z, 1, 0x4a7a36));

    // --- Bogmaw's hollow ------------------------------------------------------------------
    b.scatter(22, 0, 216, 21, (x, z) => b.tree(x, z, 1 + Math.abs(jitter(x * 3)) * 0.6, 'dead'), (x, z) => Math.hypot(x, z - 216) > 17);
    b.scatter(30, 0, 216, 20, (x, z, y) => glowCrystal(b, x, y, z, 1.2, 0xb04cff), (x, z) => Math.hypot(x, z - 216) > 12);
    bossFight(b, {
      id: 'bogmaw', x: 0, z: 216, r: 20.5, triggerX: 0, triggerZ: 204, triggerR: 5,
      spawn: (gg) => new Bogmaw(gg, 0, gg.col.groundAt(0, 222, 20, 0.3).y, 222, Math.PI),
      intro: [
        { who: 'flick', text: 'Aster... the mud is moving.', action: () => {
          g.fx.splash(0, 1.2, 222, 0x8a8a5a);
          g.fx.dust(0, 1.2, 222, 30, 0x5a4a30);
          g.shake(0.6, 1);
          g.sfx('bossRoar', 0, 1, 222);
        } },
        { who: 'bogmaw', text: 'GRRRAAAHHH! Little violet morsel! The Master promised you to Bogmaw!' },
        { who: 'aster', text: 'Nobody is eating anybody today!' },
        { who: 'flick', text: 'Watch his belly flop, jump over the shockwave! Hit him hard enough and he\'ll stagger!' },
      ],
      onDefeated: (gg) => fenOutro(gg),
    });
    if (g.save.levelsDone.fen) {
      b.portal(0, 226, Math.PI, 'sanctum', 'Return to the Sanctum', 0xff9a50);
    }

    // Everything below came later. It is built last so the older scenery above
    // keeps its exact random layout.
    hollowLife(b);
    lamphouse(b);
    fishingJetty(b);
    heronPerch(b);
    ruinDressing(b);
    drownedMill(b);
    bogSupplies(b);
    campLoot(b);
    gloomNest(b);
  },

  onEnter(g, fresh) {
    if (fresh && !g.save.found['story:fen:intro']) {
      g.save.found['story:fen:intro'] = true;
      g.say([
        { who: 'flick', text: 'Aster! Aster, wake up! The fireflies are lighting the lanterns without us!' },
        { who: 'aster', text: 'Five more minutes, Flick...' },
        { who: 'flick', text: 'You said that an hour ago. Also you\'re lying on Mother Glimmer\'s flower bed. Again.' },
        { who: 'aster', text: 'Fine, fine. I\'m up. What\'s the big hurry?' },
        { who: 'flick', text: 'The big hurry is the race you promised me. First one to the old willow wins. Go!' },
      ]);
    }
  },
};

function tent(b: Builder, x: number, z: number): void {
  const y = b.y(x, z);
  b.box(x, y, z, 3, 2.5, 3, 0x3a2848, { noMesh: true });
  b.decor.add(coneGeo(), tentMat(), x, y, z, 2.2, 3.2, 2.2, 0, jitter(x) * 3, 0);
  glowCrystal(b, x + 1.8, y, z + 1.8, 1, 0xb04cff);
}

function coneGeo() {
  return GEO.cone();
}
function tentMat() {
  return mat(0x3a2848, { rough: 0.95, flat: true });
}

function fenOutro(g: Game): void {
  const level = g.level;
  if (!level || level.def.id !== 'fen') return;
  const x = 6;
  const z = 208;
  const y = g.col.groundAt(x, z, 30, 0.3).y;
  const npc = new Npc(g, 'emberhold', EMBERHOLD, x, y, z, Math.PI);
  level.npcs.push(npc);
  g.fx.explosion(x, y + 1, z, 2, 0xffa040);
  g.sfx('fireBurst', x, y, z);
  g.say([
    { who: 'emberhold', text: 'Stand easy, little one. That was bravely done.' },
    { who: 'aster', text: 'You\'re... a dragon. Like me.' },
    { who: 'emberhold', text: 'Not quite like you. No dragon has worn scales your color in a very long time.' },
    { who: 'flick', text: 'Hey! Back off, big guy. He\'s with me.' },
    { who: 'emberhold', text: 'Peace, firefly. I am Emberhold, Warden of Fire. Twelve years ago I set an egg on this river and prayed the shadow would never find it.' },
    { who: 'emberhold', text: 'It has found you now. The Gloom does not raid firefly marshes by chance. It came for you.' },
    { who: 'aster', text: 'Then teach me how to fight it.' },
    { who: 'emberhold', text: 'Come to the Warden Sanctum. You have a fire in you that has not woken yet. Let us wake it.' },
  ], () => {
    g.save.levelsDone.fen = true;
    if (!g.save.unlocked.includes('sanctum')) g.save.unlocked.push('sanctum');
    g.saveNow();
    g.travel('sanctum');
  });
}

// ============================================================================================
// Later additions: the lamphouse, the heron's perch, the Drowned Mill, the Gloom's egg nest,
// and a lot more to look at and smash along the way.
// ============================================================================================

const WOOD = 0x8a6a44;
const DARK = 0x5a4028;
const LOG = 0x6e5236;
const STONE = 0x8a8272;
const THATCH = 0x9a8248;

/** Shared materials for instanced details (one draw call per shape and material, level-wide). */
const M = {
  wood: () => mat(WOOD, { rough: 0.95 }),
  dark: () => mat(DARK, { rough: 0.95 }),
  pale: () => mat(0xb8ad98, { rough: 0.9, flat: true }),
  moss: () => mat(0x4f7a38, { rough: 1, flat: true }),
  gloom: () => mat(0x3a2848, { rough: 0.95, flat: true }),
  cloth: () => mat(0xc8584a, { rough: 0.9 }),
  paper: () => mat(0xe8dcc0, { rough: 0.9 }),
  water: () => mat(0x9ad8f0, { rough: 0.2, transparent: true, opacity: 0.55, emissive: 0x3a8ab0, emissiveIntensity: 0.3 }),
};

const GLOWS = new Map<number, THREE.MeshBasicMaterial>();
/** One glow material per colour, so all the lamps of a colour are a single instanced draw. */
function glowOf(color: number): THREE.MeshBasicMaterial {
  let m = GLOWS.get(color);
  if (!m) {
    m = glow(color);
    GLOWS.set(color, m);
  }
  return m;
}

/** decor.lantern with a shared glow. Unlit lanterns have cold, dark glass. */
function lantern(b: Builder, x: number, y: number, z: number, color = 0xffc070, lit = true, ry = 0): void {
  const post = mat(0x3a2e24, { rough: 0.9 });
  const ax = Math.cos(ry);
  const az = -Math.sin(ry);
  b.decor.add(GEO.cyl6(), post, x, y, z, 0.07, 2.2, 0.07);
  b.decor.add(GEO.box(), post, x + ax * 0.25, y + 2.15, z + az * 0.25, 0.55, 0.06, 0.06, 0, ry, 0);
  b.decor.add(GEO.blobLow(), lit ? glowOf(color) : mat(0x4a4a3e, { rough: 0.4 }), x + ax * 0.45, y + 1.9, z + az * 0.45, 0.14, 0.2, 0.14, 0, 0, 0, false);
}

/** decor.glowCrystal with a shared glow: the same random draws, so the same look and layout. */
function glowCrystal(b: Builder, x: number, y: number, z: number, scale: number, color: number): void {
  const r = b.decor.rng;
  const m = glowOf(color);
  for (let i = 0; i < 3; i++) {
    const px = x + r.signed() * 0.3 * scale;
    const pz = z + r.signed() * 0.3 * scale;
    const sy = (0.4 + r.next() * 0.4) * scale;
    const rx = r.signed() * 0.4;
    const ry = r.next() * 6;
    const rz = r.signed() * 0.4;
    b.decor.add(GEO.octa(), m, px, y + 0.3 * scale, pz, 0.15 * scale, sy, 0.15 * scale, rx, ry, rz, false);
  }
}

/** An instanced box with no collision; y is its base. */
function deco(b: Builder, m: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, ry = 0, rx = 0, rz = 0): void {
  b.decor.add(GEO.box(), m, x, y + h / 2, z, w, h, d, rx, ry, rz);
}

/** An instanced six-sided post, base at y. */
function stick(b: Builder, m: THREE.Material, x: number, y: number, z: number, r: number, h: number, rx = 0, ry = 0, rz = 0): void {
  b.decor.add(GEO.cyl6(), m, x, y, z, r, h, r, rx, ry, rz);
}

/** A log lying on the ground along `ry`, centred on (x, z). */
function log(b: Builder, m: THREE.Material, x: number, y: number, z: number, r: number, len: number, ry: number): void {
  const dx = -Math.cos(ry);
  const dz = Math.sin(ry);
  b.decor.add(GEO.cyl6(), m, x - (dx * len) / 2, y + r, z - (dz * len) / 2, r, len, r, 0, ry, Math.PI / 2);
}

/** Pitched roof: ridge along local z (length d), eaves at yEave, `rise` up to the ridge. You can walk on it. */
function roof(b: Builder, x: number, z: number, w: number, d: number, yEave: number, rise: number, color: number, yaw = 0, surface: Surface = 'wood',
  sides: number[] = [-1, 1]): void {
  const m = mat(color, { rough: 0.95, flat: true });
  const half = w / 2;
  const tilt = Math.atan2(rise, half);
  const slab = Math.hypot(half, rise) + 0.5;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  for (const side of sides) {
    const lx = (side * half) / 2;
    const cx = x + c * lx;
    const cz = z - s * lx;
    b.decor.add(GEO.box(), m, cx, yEave + rise / 2 - 0.05, cz, slab, 0.22, d + 0.7, 0, yaw, -side * tilt);
    // Eave to ridge runs toward local -x on the +x side and toward +x on the other.
    const ry = side > 0 ? Math.atan2(-c, s) : Math.atan2(c, -s);
    const r = makeRamp(cx, cz, d / 2 + 0.3, half / 2 + 0.2, yEave - 0.3, yEave, yEave + rise, ry);
    r.surface = surface;
    b.col.add(r);
  }
  deco(b, mat(DARK, { rough: 0.95 }), x, yEave + rise - 0.05, z, 0.3, 0.26, d + 0.8, yaw);
}

type Side = 'n' | 's' | 'e' | 'w';
/**
 * Four walls of a room, axis aligned, with optional door gaps (width per side).
 * North is +z, east is +x. Doors are `doorH` tall with a lintel above.
 */
function room(b: Builder, x: number, y: number, z: number, w: number, d: number, h: number, color: number, t = 0.35,
  doors: Partial<Record<Side, number>> = {}, doorH = 2.3, surface: Surface = 'stone'): void {
  const wall = (cx: number, cz: number, len: number, alongX: boolean, gap: number | undefined) => {
    const piece = (off: number, l: number, y0: number, hh: number) => {
      if (l <= 0.05 || hh <= 0.05) return;
      b.box(alongX ? cx + off : cx, y0, alongX ? cz : cz + off, alongX ? l : t, hh, alongX ? t : l, color, { surface });
    };
    if (!gap) {
      piece(0, len, y, h);
      return;
    }
    const side = (len - gap) / 2;
    piece(-(gap / 2 + side / 2), side, y, h);
    piece(gap / 2 + side / 2, side, y, h);
    piece(0, gap, y + doorH, h - doorH);
  };
  wall(x, z + d / 2 - t / 2, w, true, doors.n);
  wall(x, z - d / 2 + t / 2, w, true, doors.s);
  wall(x + w / 2 - t / 2, z, d - 2 * t, false, doors.e);
  wall(x - w / 2 + t / 2, z, d - 2 * t, false, doors.w);
}

/**
 * Enemies that only turn up once Aster comes within `r` of (x, z). Far-off
 * enemies still cost draw calls, so optional corners keep theirs until needed.
 */
function lazyEnemies(b: Builder, x: number, z: number, r: number, list: [string, number, number, number][]): void {
  const g = b.game;
  b.trigger(x, z, r, () => {
    for (const [type, ex, ez, yaw] of list) g.pendingSpawns.push({ type, x: ex, y: g.col.groundAt(ex, ez, 1e4, 0.3).y + 0.05, z: ez, yaw });
  }, true, undefined);
}

/** Runs `make`, then merges the meshes of any groups it added to the level (a vine wall is a mesh per leaf). */
function merged<T>(b: Builder, make: () => T): T {
  const before = new Set(b.level.root.children);
  const out = make();
  for (const c of b.level.root.children) if (!before.has(c) && !(c as THREE.Mesh).isMesh) mergeStatic(c);
  return out;
}

/** A plank deck on posts over the water, top at `top`, running from (ax, az) to (bx, bz). */
function jetty(b: Builder, ax: number, az: number, bx: number, bz: number, width: number, top: number): void {
  const len = Math.hypot(bx - ax, bz - az);
  const yaw = Math.atan2(bx - ax, bz - az);
  b.box((ax + bx) / 2, top - 0.35, (az + bz) / 2, width, 0.35, len, 0, { noMesh: true, yaw, surface: 'wood' });
  const n = Math.max(2, Math.round(len / 0.55));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    deco(b, i % 4 === 0 ? M.dark() : M.wood(), ax + (bx - ax) * t, top - 0.16, az + (bz - az) * t, width, 0.16, 0.48, yaw);
  }
  const ox = Math.cos(yaw) * (width / 2 - 0.1);
  const oz = -Math.sin(yaw) * (width / 2 - 0.1);
  const posts = Math.max(1, Math.round(len / 2.4));
  for (let i = 0; i <= posts; i++) {
    const t = i / posts;
    for (const sd of [-1, 1]) stick(b, M.dark(), ax + (bx - ax) * t + ox * sd, top - 2.6, az + (bz - az) * t + oz * sd, 0.11, 2.9);
  }
}

/** A little rowing boat, bow along `yaw`. */
function boat(b: Builder, x: number, z: number, yaw: number): void {
  const m = M.wood();
  const dk = M.dark();
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  deco(b, dk, x, -0.12, z, 1.0, 0.16, 2.8, yaw);
  for (const sd of [-1, 1]) deco(b, m, x + c * sd * 0.52, -0.1, z - s * sd * 0.52, 0.1, 0.46, 2.9, yaw, 0, sd * 0.25);
  deco(b, m, x + Math.sin(yaw) * 1.45, -0.05, z + Math.cos(yaw) * 1.45, 0.9, 0.42, 0.12, yaw);
  deco(b, m, x - Math.sin(yaw) * 1.45, -0.05, z - Math.cos(yaw) * 1.45, 0.9, 0.42, 0.12, yaw);
  deco(b, dk, x, 0.12, z, 1.0, 0.08, 0.3, yaw);
  // An oar across the benches.
  b.decor.add(GEO.cyl6(), dk, x - c * 0.3, 0.24, z + s * 0.3, 0.04, 2.2, 0.04, Math.PI / 2 - 0.1, yaw + 0.3, 0);
}

/** A signpost with one board pointing along `ry`. */
function signpost(b: Builder, x: number, z: number, ry: number): void {
  const y = b.y(x, z);
  stick(b, M.dark(), x, y, z, 0.08, 1.9);
  deco(b, M.wood(), x + Math.sin(ry) * 0.45, y + 1.45, z + Math.cos(ry) * 0.45, 0.08, 0.34, 1.1, ry);
}

/** A slowly turning water wheel, axle along world x, as one merged mesh. */
function waterWheel(b: Builder, x: number, y: number, z: number, r: number, width: number): void {
  const parts: THREE.BufferGeometry[] = [];
  const add = (g: THREE.BufferGeometry, m4: THREE.Matrix4) => {
    for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal') g.deleteAttribute(n);
    const ng = g.index ? g.toNonIndexed() : g;
    ng.applyMatrix4(m4);
    parts.push(ng);
  };
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const one = new THREE.Vector3(1, 1, 1);
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    // Paddles on the rim, spokes to the hub: the wheel turns about x, so it lies in the y-z plane.
    e.set(-a, 0, 0);
    q.setFromEuler(e);
    m4.compose(new THREE.Vector3(0, Math.cos(a) * r, Math.sin(a) * r), q, one);
    add(new THREE.BoxGeometry(width, 0.7, 0.12), m4);
    m4.compose(new THREE.Vector3(0, Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5), q, one);
    add(new THREE.BoxGeometry(0.12, r, 0.12), m4);
  }
  for (const sx of [-width / 2, width / 2]) {
    m4.makeTranslation(sx, 0, 0);
    add(new THREE.TorusGeometry(r, 0.07, 5, 24).rotateY(Math.PI / 2), m4);
  }
  e.set(0, 0, Math.PI / 2);
  q.setFromEuler(e);
  m4.compose(new THREE.Vector3(0, 0, 0), q, one);
  add(new THREE.CylinderGeometry(0.28, 0.28, width + 0.6, 8), m4);
  const geo = mergeGeometries(parts, false)!;
  geo.computeBoundingSphere();
  const wheel = new THREE.Mesh(geo, mat(0x6a4a2c, { rough: 0.95, flat: true }));
  wheel.position.set(x, y, z);
  wheel.castShadow = true;
  b.level.root.add(wheel);
  b.level.props.push({ update: (dt: number) => { wheel.rotation.x -= dt * 0.55; } });
}

// --- Firefly Hollow: Mother Glimmer's flower bed, the raft's cargo, signposts -------------------

function hollowLife(b: Builder): void {
  // Aster wakes up on Mother Glimmer's flower bed. Again.
  const bed: [number, number] = [0.8, 3.3];
  const petals = [0xff9ad0, 0xffe070, 0xc0a0ff, 0xffffff];
  for (let i = 0; i < 46; i++) {
    const a = i * 2.39996;
    const d = 1.55 * Math.sqrt((i + 0.5) / 46);
    const x = bed[0] + Math.sin(a) * d;
    const z = bed[1] + Math.cos(a) * d;
    b.decor.flower(x, b.y(x, z), z, petals[i % 4]!);
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const x = bed[0] + Math.sin(a) * 1.85;
    const z = bed[1] + Math.cos(a) * 1.85;
    b.decor.rock(x, b.y(x, z) - 0.05, z, 0.22, 0xa89e8a);
  }
  // Signs: north to the willow, west to Old Wick's.
  signpost(b, 3.2, 12.6, 0.2);
  signpost(b, -14.2, 4.2, -Math.PI / 2 + 0.1);
  // The raft's cargo washed up with it.
  b.breakable(-16.4, -16.3, 'crate');
  b.breakable(-17.3, -17.6, 'basket');
  log(b, M.dark(), -15.6, b.y(-15.6, -20.4), -20.4, 0.16, 2.2, 1.1);
  b.decor.add(GEO.cyl6(), M.dark(), -12.8, b.y(-12.8, -17.6) + 0.1, -17.6, 0.05, 1.8, 0.05, Math.PI / 2 - 0.05, 0.9, 0);
  // Lamps along the causeway.
  for (const [x, z, lit] of [[4.2, 18, true], [-3.6, 23.5, true], [5.2, 27, false], [-4.5, 31, true]] as [number, number, boolean][]) {
    lantern(b, x, b.y(x, z), z, 0xfff0a0, lit, x > 0 ? Math.PI : 0);
  }
}

// --- Old Wick's lamphouse --------------------------------------------------------------------------

/**
 * West of the Hollow, over two reed hummocks: the lamplighter's island. His
 * hut (and his log), the great lamp on its tower (a lost egg up top), a dock,
 * and an oil shed the vines have swallowed. A powder keg sits by its door.
 */
function lamphouse(b: Builder): void {
  const g = b.game;
  b.bridge(-16.2, 5.5, b.y(-16.2, 5.5), -23.3, 7.1, b.y(-23.3, 7.1), 2.4);
  b.bridge(-32.1, 9.2, b.y(-32.1, 9.2), -37.4, 10.4, b.y(-37.4, 10.4), 2.4);
  lantern(b, -25.3, b.y(-25.3, 5.4), 5.4, 0xfff0a0, false);
  lantern(b, -30.4, b.y(-30.4, 10.9), 10.9, 0xfff0a0, true, Math.PI);
  lantern(b, -38.4, b.y(-38.4, 12.4), 12.4, 0xfff0a0, true);
  b.gemLine([[-16.2, 5.4], [-23.3, 7.1]], 'blue', 2.4);
  b.gemLine([[-32.1, 9.2], [-37.4, 10.4]], 'blue', 2.6);
  b.story('lamphouse', -15.2, 5.2, 2.2, () => g.hud.flick('Old Wick\'s boardwalk. He hasn\'t lit his lamps in days... let\'s check on him.', 6));

  // The hut.
  const hx = -42.6;
  const hz = 6.6;
  const hy = b.y(hx, hz);
  room(b, hx, hy - 0.2, hz, 5.2, 4.4, 2.7, 0x7a5a3a, 0.3, { e: 1.5 }, 2.2, 'wood');
  roof(b, hx, hz, 5.0, 5.8, hy + 2.5, 1.3, THATCH, Math.PI / 2);
  b.box(hx - 1.7, hy + 1.8, hz + 1.5, 0.7, 2.6, 0.7, STONE, { surface: 'stone' });
  // Inside: table (his log on it), bed, stool, a shelf of oil jars.
  b.box(hx - 1.1, hy, hz + 1.1, 1.3, 0.8, 0.8, DARK, { surface: 'wood' });
  b.decor.add(GEO.blobLow(), glowOf(0xffd070), hx - 1.5, hy + 0.92, hz + 1.2, 0.05, 0.09, 0.05, 0, 0, 0, false);
  deco(b, M.paper(), hx - 1.5, hy + 0.8, hz + 1.2, 0.07, 0.1, 0.07);
  b.box(hx - 1.6, hy, hz - 1.0, 1.9, 0.45, 1.0, DARK, { surface: 'wood' });
  deco(b, M.cloth(), hx - 1.4, hy + 0.45, hz - 1.0, 1.4, 0.1, 1.04);
  deco(b, M.wood(), hx - 0.2, hy, hz + 1.2, 0.4, 0.45, 0.4);
  deco(b, M.dark(), hx - 2.3, hy + 1.3, hz, 0.3, 0.06, 2.4);
  for (let i = 0; i < 5; i++) deco(b, M.cloth(), hx - 2.3, hy + 1.36, hz - 1.0 + i * 0.5, 0.14, 0.22, 0.14);
  b.letter('lamplighter', hx - 0.8, hz + 1.1, hy);
  // Oil for the lamps and baskets of wicks.
  b.breakable(hx + 1.3, hz - 3.0, 'barrel');
  b.breakable(hx + 0.1, hz - 3.05, 'barrel');
  b.breakable(hx + 3.4, hz - 2.2, 'basket');
  b.breakable(hx + 3.4, hz + 2.3, 'basket');

  // The lamp tower: vines up the east face, the great lamp and a lost egg on top.
  const tx = -51.5;
  const tz = 16.5;
  const ty = b.y(tx, tz);
  const top = ty + 8.6;
  b.box(tx, ty - 0.5, tz, 3.2, top - ty + 0.5, 3.2, STONE, { trim: 0x9a9080 });
  for (const [cx, cz] of [[-1.3, -1.3], [-1.3, 1.3], [1.3, -1.3], [1.3, 1.3]] as [number, number][]) {
    stick(b, M.dark(), tx + cx * 0.5 - 0.4, top, tz + cz * 0.5, 0.05, 1.5);
  }
  deco(b, M.dark(), tx - 0.4, top + 1.5, tz, 1.6, 0.1, 1.6);
  b.decor.add(GEO.cone(), M.gloom(), tx - 0.4, top + 1.6, tz, 1.0, 0.6, 1.0);
  b.decor.add(GEO.blobLow(), glowOf(0xffd070), tx - 0.4, top + 0.85, tz, 0.4, 0.5, 0.4, 0, 0, 0, false);
  merged(b, () => b.climbWall(tx + 1.6, tz, Math.PI / 2, 2.4, ty, top, false));
  b.egg('lamp', tx + 0.6, tz - 0.8, top);
  b.gems(tx + 0.6, tz + 0.9, 'blue', 1, 0, top);
  b.story('lamptower', tx + 3.6, tz, 2.4, () => g.hud.flick('Vines! Walk into them to climb, W and S to go up and down, Space to leap off. Something glints up top!', 7));
  b.breakable(tx + 2.4, tz + 2.3, 'crate');
  b.breakable(tx + 2.4, tz + 2.3, 'crate');
  b.breakable(tx + 3.5, tz + 2.9, 'basket');

  // The oil shed, choked with vines. A powder keg sits right by the door.
  const sx = -53.2;
  const sz = 6.4;
  const sy = b.y(sx, sz);
  room(b, sx, sy - 0.2, sz, 3.6, 3.6, 2.6, STONE, 0.4, { e: 2.1 }, 2.3);
  b.box(sx, sy + 2.4, sz, 4.0, 0.35, 4.0, 0x6e6858, { trim: 0x9a9080 });
  b.gate(sx + 1.6, sz, 2.2, 2.3, Math.PI / 2, 'vines');
  b.chest('lamphouse', sx - 0.4, sz, Math.PI / 2, { blue: 24, red: 2, green: 1 });
  b.breakable(sx + 2.9, sz - 1.9, 'keg');
  b.breakable(sx + 2.9, sz - 1.9, 'keg');
  b.story('shed', sx + 4.2, sz, 3, () => g.hud.flick('Vines have swallowed Wick\'s oil shed. That keg has a flame painted on it... give it a smack and stand back!', 7));

  // The dock, a boat, a lamp at the end.
  jetty(b, -57.2, 12, -63.8, 12.4, 2.3, 0.6);
  boat(b, -61.6, 14.3, Math.PI / 2 + 0.15);
  b.breakable(-58.8, 12.5, 'crate', { y: 0.6 });
  b.breakable(-60.4, 11.5, 'barrel', { y: 0.6 });
  b.breakable(-62.4, 12.7, 'basket', { y: 0.6 });
  lantern(b, -63.4, 0.6, 13.3, 0xfff0a0, true, Math.PI);
  b.decor.add(GEO.cyl6(), M.dark(), -61.8, 0.5, 13.0, 0.025, 1.4, 0.025, 1.2, 0.15, 0);

  // Lamps round the island, some still lit.
  for (const [x, z, lit] of [[-45.8, 9.4, false], [-49.2, 13.4, true], [-55.4, 9.4, false], [-44.2, 15.6, true], [-47.5, 3.2, true]] as [number, number, boolean][]) {
    lantern(b, x, b.y(x, z), z, 0xfff0a0, lit, jitter(x) * 3);
  }
  b.tree(-40.8, 17.2, 1.1, 'willow', { leaf: 0x4a7a40 });
  b.tree(-48.2, 2.0, 0.9, 'round', { leaf: 0x4f8a3a });
  b.tree(-55, 17.6, 0.8, 'round', { leaf: 0x5a9a42 });
  b.tree(-56.4, 4.6, 0.9, 'dead');
  b.tree(-40, 22, 0.8, 'round', { leaf: 0x4f8a3a });
  b.crystal(-44.6, 13.4, 'blue', 8);
  for (const [x, z, s, c] of [[-49.3, 18.6, 0.7, 0x7ad0ff], [-50.1, 19.2, 0.5, 0xff7ab0], [-53.6, 14.4, 0.6, 0x9a7aff]] as [number, number, number, number][]) {
    b.mushroom(x, z, s, c, true);
  }
  const clear = (x: number, z: number) => Math.hypot(x - hx, z - hz) > 3.8 && Math.hypot(x - sx, z - sz) > 3 && Math.hypot(x - tx, z - tz) > 2.6;
  b.scatter(34, -47, 11, 12.5, (x, z, y) => b.decor.reeds(x, y, z, 1), (x, z, y) => y < 1.0 && clear(x, z));
  b.scatter(12, -27, 8, 5, (x, z, y) => b.decor.reeds(x, y, z, 0.9));
  b.scatter(40, -47, 11, 9.5, (x, z, y) => b.decor.grass(x, y, z, 0.9, 0x5e8a40), (x, z) => clear(x, z));
  b.scatter(16, -47, 11, 9, (x, z, y) => b.decor.flower(x, y, z, [0xff9ad0, 0xffe070, 0xc0a0ff][Math.floor(Math.abs(jitter(x + z)) * 3)]!), (x, z) => clear(x, z));
  for (let i = 0; i < 18; i++) {
    const a = i * 2.1;
    const r = 13.5 + Math.abs(jitter(i, 9)) * 4;
    b.decor.lilypad(-47 + Math.sin(a) * r, 0, 11 + Math.cos(a) * r, 0.5 + Math.abs(jitter(i, 4)) * 0.4);
  }
}

// --- the landing's fishing jetty ---------------------------------------------------------------------

function fishingJetty(b: Builder): void {
  jetty(b, 4.4, 57.6, 9.6, 57.2, 1.9, 0.8);
  boat(b, 8.6, 60.0, 0.1);
  b.breakable(8.8, 57.4, 'basket', { y: 0.8 });
  b.breakable(6.4, 57.9, 'crate', { y: 0.8 });
  lantern(b, 9.4, 0.8, 56.5, 0xfff0a0, true, Math.PI / 2);
  // A rod propped over the water, line in.
  b.decor.add(GEO.cyl6(), M.dark(), 7.6, 0.85, 56.7, 0.03, 3.2, 0.03, -0.9, Math.PI / 2 + 0.3, 0);
  stick(b, M.dark(), 10.1, -0.6, 55.9, 0.008, 2.6);
  b.scatter(10, 0, 58, 5.5, (x, z, y) => b.decor.reeds(x, y, z, 0.9));
}

// --- the heron's perch: a sea stack only a glide from the ledge reaches ------------------------------

function heronPerch(b: Builder): void {
  const x = -18.5;
  const z = 104;
  const top = 7.2;
  b.col.add(makeCyl(x, z, 2.3, -3, top));
  const rock = mat(0x6e6c5c, { rough: 0.95, flat: true });
  b.decor.add(GEO.rock(), rock, x, 0.1, z, 2.9, 2.2, 2.8, 0.2, 0.5, 0.1);
  b.decor.add(GEO.rock(), rock, x + 0.2, 2.8, z - 0.1, 2.5, 1.9, 2.5, 0.1, 1.9, 0.2);
  b.decor.add(GEO.rock(), rock, x - 0.1, 5.2, z + 0.1, 2.35, 1.3, 2.35, 0.3, 0.7, 0.1);
  b.decor.add(GEO.cyl(), M.moss(), x, 6.35, z, 2.3, 0.85, 2.3);
  // A heron's nest of sticks and feathers, and in it something that is not a heron egg.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    b.decor.add(GEO.cyl6(), M.dark(), x + Math.sin(a) * 0.62, top + 0.12, z + Math.cos(a) * 0.62, 0.05, 0.9, 0.05, Math.PI / 2, a + 1.2, 0);
  }
  for (let i = 0; i < 5; i++) deco(b, M.paper(), x + jitter(i, 3) * 1.4, top, z + jitter(i, 5) * 1.4, 0.08, 0.02, 0.32, i);
  b.decor.tree(x - 1.4, top - 0.1, z - 1.0, 0.5, 'dead');
  b.egg('heron', x, z, top);
  // Gems hang in the air along the glide from the ledge.
  for (const [gx, gz, gy] of [[-6.6, 97.6, 9.4], [-10.2, 99.7, 9.1], [-13.8, 101.6, 8.6]] as [number, number, number][]) b.gems(gx, gz, 'blue', 1, 0, gy);
  for (let i = 0; i < 8; i++) b.decor.lilypad(x + jitter(i, 7) * 6, 0, z + jitter(i, 8) * 6, 0.6);
}

// --- the ruin island: fallen columns, rubble, Gloom creeping in ------------------------------------------

function ruinDressing(b: Builder): void {
  const drum = (x: number, z: number, ry: number, r: number, len: number) => {
    const y = b.y(x, z);
    log(b, M.pale(), x, y - 0.1, z, r, len, ry);
    b.box(x, y - 0.3, z, r * 2, r * 2 + 0.2, len, 0, { noMesh: true, yaw: Math.atan2(-Math.cos(ry), Math.sin(ry)) });
  };
  drum(-5.2, 125.4, 0.5, 0.55, 2.6);
  drum(7.6, 128.2, 2.2, 0.5, 2.2);
  drum(-11.2, 115.8, 1.3, 0.55, 2.4);
  b.wall(-12.6, 125.6, -12.6, 129.8, b.y(-12.6, 127.7) - 0.3, 1.7, 0.8, STONE);
  b.wall(11.6, 129, 12.4, 132.6, b.y(12, 130.8) - 0.3, 1.3, 0.8, STONE);
  for (let i = 0; i < 16; i++) {
    const x = jitter(i, 21) * 12;
    const z = 122 + jitter(i, 22) * 12;
    if (Math.hypot(x, z - 115) < 4 || Math.hypot(x - 9, z - 136) < 5 || Math.hypot(x + 9, z - 136) < 6) continue;
    b.decor.rock(x, b.y(x, z) - 0.1, z, 0.25 + Math.abs(jitter(i, 23)) * 0.3, 0xa89e8a);
  }
  // Gloom cocoons creeping up to the sealed shrine, and a scavenger's crates by the arch.
  b.breakable(-3.6, 132.6, 'pod');
  b.breakable(-4.3, 134.3, 'pod');
  b.breakable(-14.4, 134, 'pod');
  b.breakable(-6.4, 119.8, 'crate');
  b.breakable(-6.4, 119.8, 'crate');
  b.breakable(-5.3, 120.9, 'basket');
  glowCrystal(b, -3.2, b.y(-3.2, 134.8), 134.8, 0.8, 0xb04cff);
}

// --- the Drowned Mill ------------------------------------------------------------------------------------

/**
 * South-east of the ruins, over a bridge: the miller's island. Gloom looters
 * have made camp in the yard (sitting on the powder kegs), the wheel still
 * turns, and a lost egg is tucked away in the loft among the flour sacks.
 */
function drownedMill(b: Builder): void {
  const g = b.game;
  b.bridge(13.8, 114.7, b.y(13.8, 114.7), 22.4, 110.2, b.y(22.4, 110.2), 2.6);
  lantern(b, 13.0, b.y(13.0, 116.4), 116.4, 0xfff0a0, true);
  lantern(b, 23.4, b.y(23.4, 111.9), 111.9, 0xfff0a0, false, Math.PI);
  b.gemLine([[13.8, 114.7], [22.4, 110.2]], 'blue', 2.4);
  b.story('mill', 14.2, 114.9, 2.4, () => g.hud.flick('The old mill! And Gloomlings sitting on the miller\'s powder kegs. Brave. Or very, very dumb.', 7));

  // The mill: stone below, timber above, a loft at the back and a thatched roof.
  const mx = 36.6;
  const mz = 101.8;
  const W = 7.2;
  const D = 6.2;
  const Y = 1.45;
  b.box(mx, -1.6, mz, W + 0.4, Y + 1.6, D + 0.4, 0x6e6858, { trim: 0x9a9080 });
  room(b, mx, Y, mz, W, D, 3.2, STONE, 0.4, { w: 2.0 }, 2.4);
  // Timber above: the south side and half the roof fell in long ago, which lets the light into the loft.
  b.box(mx, Y + 3.2, mz + D / 2 - 0.15, W, 1.6, 0.3, 0x6a4a2c, { surface: 'wood' });
  for (const sx of [-1, 1]) b.box(mx + sx * (W / 2 - 0.15), Y + 3.2, mz, 0.3, 1.6, D - 0.6, 0x6a4a2c, { surface: 'wood' });
  b.box(mx - 1.6, Y + 3.2, mz - D / 2 + 0.15, W - 3.2, 0.7, 0.3, 0x6a4a2c, { surface: 'wood' });
  b.box(mx + 2.6, Y + 3.2, mz - D / 2 + 0.15, 2.0, 1.1, 0.3, 0x6a4a2c, { surface: 'wood' });
  roof(b, mx, mz, D + 0.2, W + 0.2, Y + 4.8, 1.9, 0x6a4a3a, Math.PI / 2, 'wood', [-1]);
  const tilt = Math.atan2(1.9, (D + 0.2) / 2);
  for (let i = 0; i < 4; i++) {
    const rxx = mx - W / 2 + 0.8 + i * 1.9;
    b.decor.add(GEO.box(), M.dark(), rxx, Y + 4.8 + 0.9, mz - (D + 0.2) / 4, 0.16, 0.16, Math.hypot((D + 0.2) / 2, 1.9) * (i === 2 ? 0.6 : 1), -tilt, 0, 0);
  }
  const loftX0 = mx;
  const loftX1 = mx + W / 2 - 0.4;
  const loftTop = Y + 3.0;
  b.box((loftX0 + loftX1) / 2, loftTop - 0.25, mz, loftX1 - loftX0, 0.25, D - 0.8, 0x7a5a38, { surface: 'wood' });
  for (const pz of [mz - D / 2 + 0.7, mz + D / 2 - 0.7]) stick(b, M.dark(), loftX0 + 0.15, Y, pz, 0.12, loftTop - Y - 0.25);
  deco(b, M.dark(), loftX0 + 0.1, loftTop, mz - 1.6, 0.1, 0.8, 2.0);
  // Crates to climb, millstones, flour sacks.
  b.breakable(mx - 2.2, mz + 1.9, 'crate', { y: Y });
  const step = b.breakable(mx - 1.0, mz + 1.9, 'crate', { y: Y });
  b.breakable(mx - 1.0, mz + 1.9, 'crate', { y: step.y + step.height });
  b.col.add(makeCyl(mx - 2.0, mz - 1.6, 1.0, Y, Y + 0.7));
  b.decor.add(GEO.cyl(), M.pale(), mx - 2.0, Y, mz - 1.6, 1.0, 0.34, 1.0);
  b.decor.add(GEO.cyl(), M.pale(), mx - 2.0, Y + 0.36, mz - 1.6, 0.95, 0.32, 0.95);
  stick(b, M.dark(), mx - 2.0, Y + 0.6, mz - 1.6, 0.1, 1.9);
  b.breakable(mx + 2.6, mz - 2.3, 'basket', { y: Y });
  b.breakable(mx + 1.6, mz - 2.4, 'basket', { y: Y });
  b.breakable(mx + 2.7, mz + 1.0, 'barrel', { y: Y });
  b.letter('miller', mx + 0.8, mz - 0.2, Y);
  // Up in the loft: the good sacks, and behind them something warm.
  b.breakable(mx + 1.6, mz - 2.2, 'basket', { y: loftTop });
  b.breakable(mx + 2.6, mz - 1.0, 'basket', { y: loftTop });
  b.breakable(mx + 0.8, mz + 2.1, 'crate', { y: loftTop });
  b.breakable(mx + 2.4, mz + 2.1, 'basket', { y: loftTop });
  b.egg('mill', mx + 2.7, mz - 2.1, loftTop);
  // The wheel, and the race that feeds it.
  const rx = mx + W / 2 + 1.1;
  waterWheel(b, rx, Y + 0.1, mz, 2.3, 0.9);
  for (const [z0, z1, y0] of [[mz + 1.6, mz + 4.6, Y + 2.35], [mz + 4.6, mz + 8.6, Y + 2.1]] as [number, number, number][]) {
    deco(b, M.wood(), rx, y0, (z0 + z1) / 2, 0.8, 0.1, z1 - z0);
    for (const sd of [-0.4, 0.4]) deco(b, M.wood(), rx + sd, y0, (z0 + z1) / 2, 0.08, 0.3, z1 - z0);
    stick(b, M.dark(), rx, -1.2, z1, 0.1, y0 + 1.2);
  }
  deco(b, M.water(), rx, Y + 2.4, mz + 1.4, 0.6, 0.06, 0.5);
  deco(b, M.water(), rx, Y + 0.6, mz + 1.1, 0.5, 1.8, 0.14, 0, 0.2, 0);

  // The yard: the looters' fire, kegs far too close to it, a cart, crates.
  const fx = 27.2;
  const fz = 103.5;
  const fy = b.y(fx, fz);
  for (let i = 0; i < 3; i++) log(b, M.dark(), fx, fy, fz, 0.12, 1.1, i * 1.05);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    b.decor.rock(fx + Math.sin(a) * 0.75, fy - 0.05, fz + Math.cos(a) * 0.75, 0.2, 0xa89e8a);
  }
  b.decor.add(GEO.blobLow(), glowOf(0xff9040), fx, fy + 0.35, fz, 0.32, 0.4, 0.32, 0, 0, 0, false);
  b.decor.add(GEO.blobLow(), glowOf(0xffd070), fx, fy + 0.45, fz, 0.16, 0.36, 0.16, 0, 0, 0, false);
  b.breakable(28.9, 105.3, 'keg');
  b.breakable(28.9, 105.3, 'keg');
  b.breakable(30.0, 106.2, 'keg');
  lazyEnemies(b, 28, 104, 34, [['grunt', 26.0, 104.8, Math.PI / 2], ['grunt', 27.9, 101.8, 0], ['sapper', 30.5, 96.8, 0]]);
  // The cart.
  const cx = 31.4;
  const cz = 109.0;
  const cy = b.y(cx, cz);
  const cc = Math.cos(0.4);
  const cs = Math.sin(0.4);
  b.box(cx, cy + 0.45, cz, 1.5, 0.3, 2.6, WOOD, { yaw: 0.4, surface: 'wood' });
  for (const [ox, oz] of [[-0.85, 0.7], [0.85, 0.7], [-0.85, -0.7], [0.85, -0.7]] as [number, number][]) {
    b.decor.add(GEO.cyl(), M.dark(), cx + ox * cc + oz * cs, cy + 0.45, cz - ox * cs + oz * cc, 0.45, 0.12, 0.45, 0, 0.4, Math.PI / 2);
  }
  b.decor.add(GEO.cyl6(), M.dark(), cx - cs * 1.3, cy + 0.55, cz - cc * 1.3, 0.05, 1.8, 0.05, -Math.PI / 2 + 0.25, 0.4, 0);
  b.breakable(cx, cz + 0.4, 'basket');
  b.breakable(cx + 0.2, cz - 0.6, 'basket');
  b.breakable(32.1, 99.5, 'crate');
  b.breakable(32.1, 99.5, 'crate');
  b.breakable(32.2, 98.2, 'barrel');
  b.breakable(24.4, 108.4, 'barrel');

  // The miller's dock, and his strongbox at the end of it.
  jetty(b, 29.8, 94.4, 29.8, 88.4, 2.2, 0.9);
  boat(b, 27.6, 90.6, 0.2);
  b.chest('mill', 29.8, 89.3, 0, { blue: 26, red: 2 });
  b.breakable(30.6, 92.8, 'barrel', { y: 0.9 });
  lantern(b, 30.8, 0.9, 88.4, 0xfff0a0, true, Math.PI);

  b.tree(25.2, 110.6, 0.9, 'round', { leaf: 0x4f8a3a });
  b.tree(33.6, 110.4, 0.85, 'round', { leaf: 0x5a9a42 });
  b.tree(22.6, 97.2, 0.85, 'autumn', { leaf: 0xc88a3a });
  b.tree(23.2, 103.4, 1.0, 'willow', { leaf: 0x4a7a40 });
  b.crystal(26.2, 110.8, 'blue', 8);
  const clear = (x: number, z: number) => !(x > mx - W / 2 - 1 && x < mx + W / 2 + 2.5 && Math.abs(z - mz) < D / 2 + 1) && Math.hypot(x - fx, z - fz) > 2;
  b.scatter(36, 30, 104, 10.5, (x, z, y) => b.decor.grass(x, y, z, 1, 0x5a9a42), (x, z) => clear(x, z));
  b.scatter(14, 30, 104, 10, (x, z, y) => b.decor.flower(x, y, z, 0xffe070), (x, z) => clear(x, z));
  b.scatter(30, 30, 104, 13, (x, z, y) => b.decor.reeds(x, y, z, 1), (x, z, y) => y < 1.0 && clear(x, z));
  for (let i = 0; i < 14; i++) {
    const a = i * 2.3;
    const r = 13 + Math.abs(jitter(i, 12)) * 4;
    b.decor.lilypad(30 + Math.sin(a) * r, 0, 104 + Math.cos(a) * r, 0.6);
  }
}

// --- the east bog: a Gloom supply raft --------------------------------------------------------------------

function bogSupplies(b: Builder): void {
  b.box(40.2, -0.45, 139.8, 3.2, 0.8, 2.6, LOG, { yaw: 0.3, surface: 'wood' });
  for (let i = 0; i < 4; i++) log(b, M.dark(), 40.2 + Math.cos(0.3) * (i - 1.5) * 0.7, 0.2, 139.8 - Math.sin(0.3) * (i - 1.5) * 0.7, 0.12, 2.9, 0.3 + Math.PI / 2);
  b.breakable(39.6, 139.3, 'keg');
  b.breakable(40.6, 140.4, 'keg');
  b.breakable(41.1, 139.2, 'crate');
  b.breakable(32.4, 136.7, 'pod');
  b.breakable(47.9, 144.4, 'pod');
  b.breakable(39.6, 155.4, 'pod');
  for (const [x, z] of [[29.4, 136.6], [48.8, 147.8], [36.8, 155.6]] as [number, number][]) b.decor.tree(x, b.y(x, z), z, 0.8, 'dead');
  glowCrystal(b, 33.0, b.y(33.0, 135.6), 135.6, 0.7, 0xb04cff);
  glowCrystal(b, 46.6, b.y(46.6, 144.8), 144.8, 0.7, 0xb04cff);
}

// --- the Gloom camp: loot, kegs by the spawn points, the sergeant's orders ---------------------------------

function campLoot(b: Builder): void {
  b.breakable(17.6, 171.3, 'crate');
  b.breakable(17.6, 171.3, 'crate');
  b.breakable(18.4, 169.8, 'barrel');
  b.breakable(16.9, 168.4, 'basket');
  b.breakable(8.2, 182.4, 'keg');
  b.breakable(8.2, 182.4, 'keg');
  b.breakable(-1.6, 171.2, 'keg');
  b.breakable(-6.4, 178.6, 'pod');
  b.breakable(-5.4, 180.0, 'pod');
  b.breakable(18.8, 180.4, 'pod');
  b.breakable(-4.2, 184.6, 'crate');
  b.breakable(-3.0, 185.3, 'barrel');
  // The sergeant's table, with his orders on it.
  const tx = 11.8;
  const tz = 178.4;
  const ty = b.y(tx, tz);
  b.box(tx, ty, tz, 1.6, 0.8, 1.0, DARK, { surface: 'wood' });
  deco(b, M.paper(), tx + 0.2, ty + 0.8, tz - 0.1, 0.9, 0.02, 0.6, 0.3);
  for (const ox of [-0.6, 0.65]) b.decor.add(GEO.blobLow(), glowOf(0xb04cff), tx + ox, ty + 0.9, tz + 0.3, 0.06, 0.1, 0.06, 0, 0, 0, false);
  deco(b, M.dark(), tx - 1.2, ty, tz + 0.2, 0.5, 0.45, 0.5, 0.4);
  b.letter('orders', tx, tz, ty);
  // Banners at the way in from the bog.
  for (const [x, z] of [[18.6, 165.4], [13.4, 161.6]] as [number, number][]) {
    const y = b.y(x, z);
    stick(b, M.dark(), x, y, z, 0.09, 3.4);
    deco(b, M.gloom(), x + 0.05, y + 1.7, z, 0.06, 1.5, 0.9, 0.9);
    glowCrystal(b, x, y + 3.2, z, 0.5, 0xb04cff);
  }
  // A jar of stolen fireflies.
  const jx = -3.6;
  const jz = 175.2;
  const jy = b.y(jx, jz);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    stick(b, M.dark(), jx + Math.sin(a) * 0.45, jy, jz + Math.cos(a) * 0.45, 0.03, 1.1);
  }
  b.decor.add(GEO.cone(), M.gloom(), jx, jy + 1.1, jz, 0.55, 0.4, 0.55);
  for (let i = 0; i < 5; i++) b.decor.add(GEO.blobLow(), glowOf(0xfff0a0), jx + jitter(i, 31) * 0.25, jy + 0.3 + Math.abs(jitter(i, 32)) * 0.6, jz + jitter(i, 33) * 0.25, 0.05, 0.05, 0.05, 0, 0, 0, false);
}

// --- the Gloom's egg nest -------------------------------------------------------------------------------

/** East of the camp, two hops over the water: the Gloom have been collecting eggs. */
function gloomNest(b: Builder): void {
  const g = b.game;
  const x = 35.2;
  const z = 187.2;
  const y = b.y(x, z);
  b.box(x, y - 0.2, z, 1.0, 0.5, 1.0, 0x2a2432);
  b.egg('nest', x, z, y + 0.3);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    b.breakable(x + Math.sin(a) * 1.25, z + Math.cos(a) * 1.25, 'pod', { y });
  }
  for (const [ox, oz] of [[-2.6, 1.6], [2.4, -2.2], [1.8, 2.6], [-2.2, -2.4]] as [number, number][]) glowCrystal(b, x + ox, b.y(x + ox, z + oz), z + oz, 1, 0xb04cff);
  const py = b.y(x + 2.8, z + 0.6);
  stick(b, M.dark(), x + 2.8, py, z + 0.6, 0.09, 3.0);
  deco(b, M.gloom(), x + 2.85, py + 1.4, z + 0.6, 0.06, 1.4, 0.9, 0.3);
  b.decor.tree(x - 3.0, b.y(x - 3.0, z + 2.2), z + 2.2, 0.7, 'dead');
  lazyEnemies(b, x, z, 30, [['grunt', x + 2.6, z - 1.2, -Math.PI / 2], ['shieldbearer', x - 0.4, z + 3.0, Math.PI]]);
  b.story('nest', 27.5, 182.5, 2, () => g.hud.flick('Aster, look, over there! An egg, wrapped up in Gloom goo. They\'ve been stealing eggs?!', 7));
  b.gems(24.8, 181.6, 'blue', 1);
  b.gems(27.5, 182.5, 'blue', 1);
  b.gems(30.2, 184, 'blue', 1, 0, 2.2);
}
