import * as THREE from 'three';
import type { LevelDef, Builder } from '../world/level';
import { Npc } from '../world/level';
import { ambient, paint, jitter } from './common';
import { Bogmaw } from '../enemies/bosses/bogmaw';
import { Barrier } from '../entities/props';
import { EMBERHOLD } from '../game/story';
import type { Game } from '../game/game';
import { GEO } from '../render/decor';
import { mat } from '../render/materials';
import { THEMES } from '../core/audio';

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
      b.decor.lantern(Math.sin(a) * 14, b.y(Math.sin(a) * 14, Math.cos(a) * 14), Math.cos(a) * 14, i % 2 ? 0xfff0a0 : 0xa0ffb0);
    }
    b.scatter(60, 0, 0, 16, (x, z, y) => b.decor.grass(x, y, z, 0.9, 0x6aa84a));
    b.scatter(24, 0, 0, 15, (x, z, y) => b.decor.flower(x, y, z, [0xff9ad0, 0xffe070, 0xc0a0ff][Math.floor(Math.abs(jitter(x + z)) * 3)]!));
    b.crystal(-4, -8, 'blue', 8);
    b.crystal(5, -10, 'blue', 8);
    b.crystal(-10, 12, 'red', 3);
    b.crystal(3, 13, 'green', 3);
    b.gemLine([[0, 8], [0, 16], [3, 24]]);
    b.collectible('relic1', 'relic', -13, -16, undefined, 'fen1');
    // The raft that carried the egg.
    b.box(-14, 0.1, -18.5, 2.6, 0.25, 1.6, 0x8a6a44, { yaw: 0.4, surface: 'wood' });

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
    b.tree(0, 79, 2.3, 'willow', { leaf: 0x4a7a40 });
    b.scatter(18, 0, 77, 12, (x, z) => { if (Math.hypot(x, z - 79) > 4) b.tree(x, z, 0.8 + Math.abs(jitter(x)) * 0.5, 'round', { leaf: 0x3f6f32 }); }, (x, z) => Math.hypot(x, z - 77) > 7);
    b.scatter(50, 0, 77, 12, (x, z, y) => b.decor.grass(x, y, z, 1, 0x5a9a42));
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
    b.scatter(30, 0, 216, 20, (x, z, y) => b.decor.glowCrystal(x, y, z, 1.2, 0xb04cff), (x, z) => Math.hypot(x, z - 216) > 12);
    const barrier = new Barrier(g, 0, b.y(0, 216), 216, 20.5);
    b.level.props.push(barrier);
    b.story('bogmaw', 0, 204, 5, () => startBogmaw(g, barrier));
    if (g.save.found['story:fen:bogmaw'] && !g.save.levelsDone.fen) {
      // Died or quit mid-fight: the trigger is spent, so rearm the encounter.
      b.trigger(0, 204, 5, () => startBogmaw(g, barrier, true));
    }
    if (g.save.levelsDone.fen) {
      b.portal(0, 226, Math.PI, 'sanctum', 'Return to the Sanctum', 0xff9a50);
    }
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
  b.decor.glowCrystal(x + 1.8, y, z + 1.8, 1, 0xb04cff);
}

function coneGeo() {
  return GEO.cone();
}
function tentMat() {
  return mat(0x3a2848, { rough: 0.95, flat: true });
}

function startBogmaw(g: Game, barrier: Barrier, rematch = false): void {
  if (g.boss) return;
  const y = g.col.groundAt(0, 222, 20, 0.3).y;
  const boss = new Bogmaw(g, 0, y, 222, Math.PI);
  g.addBoss(boss);
  g.fx.splash(0, y, 222, 0x8a8a5a);
  g.fx.dust(0, y, 222, 30, 0x5a4a30);
  g.shake(0.6, 1);
  g.sfx('bossRoar', 0, y, 222);
  barrier.set(true);
  const begin = () => {
    boss.awake = true;
    g.audio.setMusic(THEMES.boss!);
  };
  boss.onDefeated = () => {
    barrier.set(false);
    g.audio.setMusic(null);
    setTimeout(() => fenOutro(g), 1800);
  };
  if (rematch) {
    begin();
    return;
  }
  g.say([
    { who: 'flick', text: 'Aster... the mud is moving.' },
    { who: 'bogmaw', text: 'GRRRAAAHHH! Little violet morsel! The Master promised you to Bogmaw!' },
    { who: 'aster', text: 'Nobody is eating anybody today!' },
    { who: 'flick', text: 'Watch his belly flop, jump over the shockwave! And hit him hard enough and he\'ll stagger!' },
  ], begin);
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
