import * as THREE from 'three';
import type { LevelDef, Builder } from '../world/level';
import { ambient, paint, jitter, Cage } from './common';
import { EMBERHOLD, STORMCREST, FROSTFANG, STONEHIDE, NYXA_FREED } from '../game/story';
import type { Game } from '../game/game';
import { Water } from '../render/water';
import { DragonRig, defaultPose, type DragonLook } from '../player/dragonRig';
import { makeCyl } from '../world/collision';
import type { Line } from '../ui/dialogue';
import { trialGround } from './trials';
import { GEO } from '../render/decor';
import { mat, glow } from '../render/materials';
import { mergeStatic } from '../render/shapes';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * The Warden Sanctum: the hub. Emberhold teaches fire here; the Wardgate
 * sends Aster to each realm; rescued Wardens return here and teach their
 * element's secrets.
 */

const COLORS = paint({
  under: 0x6a6a72, shore: 0x8a8a7a, grass: 0x6a9a4a, grass2: 0x7aa854, rock: 0x9a9488, path: 0xc8bca4, high: 0x8aa860, highAt: 6, water: -100,
});

const STONE = 0xc8bca4;
const STONE_DARK = 0x9a9080;

export const sanctum: LevelDef = {
  id: 'sanctum',
  name: 'Warden Sanctum',
  subtitle: 'The temple above the clouds',
  music: 'sanctum',
  killY: -18,
  spawn: [0, -18, 0],
  sky: {
    top: 0x3a6ab8, horizon: 0xf0c890, bottom: 0xf8e8d0, sunDir: [-0.5, 0.35, 0.6], sunColor: 0xffe0b0, sunIntensity: 2.2,
    hemiSky: 0xc0d8ff, hemiGround: 0x8a7a60, hemiIntensity: 1.05, fogNear: 60, fogFar: 260,
  },
  terrain: {
    x0: -80, z0: -60, sizeX: 160, sizeZ: 150, cell: 1.5,
    color: COLORS,
    skirt: { depth: 16, color: 0x8a8274 },
    shape: (s) => {
      s.void();
      s.island(0, 0, 32, 0, 3, 0.2);
      s.island(0, 44, 13, 4.5, 2, 0.1);
      s.path([[0, 28, 0], [0, 33, 0]], 8, 1);
      s.island(46, 4, 15, 0.2, 2, 0.2);
      s.island(-46, -6, 13, 1.0, 2, 0.2);
      s.island(-24, -34, 6, 3, 1.5, 0.1);
      s.island(-38, -42, 5, 6, 1.5, 0.1);
      s.island(22, -40, 5, 1.5, 1.5, 0.1);
      // The Hall of Moments.
      s.island(36, 42, 12, 0.6, 1.5, 0.1);
      // The burnt library, over the old bridge north-west of the courtyard.
      s.island(-46, 36, 12, 2.0, 2, 0.2);
      // The Stargazers' terrace, past the south-east islets.
      s.island(47, -32, 8, 3.0, 2, 0.15);
    },
  },

  build(b: Builder) {
    const g = b.game;
    ambient(b, 'pollen', 10);
    // A sea of clouds below.
    const clouds = new Water(-16, 700, 0xf0d8c8, 0xfff4e8, 0xffffff, 0.95);
    b.level.root.add(clouds.mesh);
    b.level.props.push({ update: () => clouds.update(g.realTime * 0.3, g.camera.position.x, g.camera.position.z) });

    // --- Courtyard ------------------------------------------------------------------
    b.platform(0, 0.25, 0, 26, 26, STONE, 0.5, { trim: STONE_DARK });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
      const x = Math.sin(a) * 17;
      const z = Math.cos(a) * 17;
      if (Math.abs(x) < 5 && z > 0) continue;
      if (i % 3 === 1) b.decor.pillar(x, 0, z, 0.8, 3.5, STONE, true);
      else b.pillar(x, z, 0.8, -1, 7, STONE);
    }
    // Inlaid floor: concentric bands, a gold rune ring and four element spokes.
    floorRing(b, 3.2, 5.5, 0x9a8f7c);
    floorRing(b, 7.0, 7.4, 0xd8b060, true);
    floorRing(b, 10.5, 12.2, 0xb0a590);
    const spokes: [number, number][] = [[0xff7a2a, -Math.PI * 0.75], [0x7ac8ff, -Math.PI * 0.25], [0x8fe4ff, Math.PI * 0.25], [0x8bd05a, Math.PI * 0.75]];
    for (const [c, a] of spokes) {
      const sp = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 5), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.6 }));
      sp.rotation.x = -Math.PI / 2;
      sp.rotation.z = -a;
      sp.position.set(Math.sin(a) * 9.2, 0.27, Math.cos(a) * 9.2);
      b.level.root.add(sp);
    }
    // Central brazier.
    b.torch(0, 0, 'hearth', true, 0, 0.25);
    // Warden statues around the brazier, lit as each element returns.
    const statues: [number, number, DragonLook, string][] = [
      [-8, -8, EMBERHOLD, 'fire'], [8, -8, STORMCREST, 'lightning'], [8, 8, FROSTFANG, 'ice'], [-8, 8, STONEHIDE, 'earth'],
    ];
    for (const [x, z, look, el] of statues) statue(b, x, z, look, g.save.elements.includes(el as never));

    // --- Wardgate terrace -----------------------------------------------------------------
    b.stairs(0, 28.5, 7, 0, 0.25, 4.5, 6);
    b.platform(0, 4.6, 44, 22, 18, STONE, 0.6, { trim: STONE_DARK });
    b.arch(-9, 40, 0, 3, 5, STONE);
    b.arch(9, 40, 0, 3, 5, STONE);
    const gate = b.portal(0, 48, Math.PI, 'wardgate', 'Step through the Wardgate', 0xc9a2ff, () => g.menus.showTravel());
    b.gate(0, 34.5, 8, 5, 0, 'stone', 'wardgate-open', 0.25);
    if (g.save.found['story:sanctum:lesson-done']) b.level.emit('wardgate-open');
    void gate;
    b.checkpoint('courtyard', -5, 20, Math.PI);
    // A ring of speed runes round the plaza: light them all in one charge for a Skill Point.
    b.runeRing(0, 0, 15, 12, 'sanctum:ring');

    // --- Training grounds (east) --------------------------------------------------------------
    b.bridge(16, 2, 0.25, 32, 3, 0.2, 4);
    b.platform(46, 0.4, 4, 18, 18, STONE_DARK, 0.4, { trim: STONE });
    const dummySpots: [number, number][] = [[42, 0], [50, 0], [46, 9], [40, 8], [52, 8]];
    for (const [x, z] of dummySpots) dummy(g, x, z);
    // Trials clear the dummies away while they run.
    b.level.on('trial-start', () => {
      for (const e of g.enemies) {
        if (e.alive && e.def.id === 'dummy') {
          e.onDeath = null;
          e.alive = false;
          e.state = 'dead';
          e.deadT = 0.3;
        }
      }
    });
    b.level.on('trial-end', () => {
      if (g.enemies.some((e) => e.alive && e.def.id === 'dummy')) return;
      for (const [x, z] of dummySpots) dummy(g, x, z);
    });
    b.torch(38, -4, 'lesson', false, 0, 0.4);
    b.torch(54, -4, 'lesson', false, 0, 0.4);
    b.torch(38, 12, 'lesson', false, 0, 0.4);
    b.torch(54, 12, 'lesson', false, 0, 0.4);
    b.torchGroup('lesson', 'lesson-torches');
    b.level.on('lesson-torches', () => lessonTorchesDone(g));
    b.crystal(58, 2, 'green', 6);
    b.crystal(58, 7, 'red', 4);
    // Dragon Trials open once the fire lesson is done.
    if (g.save.found['story:sanctum:lesson-done']) {
      trialGround(b, 46, -3.5, 46, 4);
      b.story('trials', 46, -1, 4, () => g.hud.flick('A Trial Stone! Emberhold says the Sanctum\'s trials pay well. Press F.', 6));
    }

    // --- Hatchery (west) -------------------------------------------------------------------------
    b.bridge(-16, -2, 0.25, -34, -5, 1.0, 3.5);
    b.platform(-46, 1.2, -6, 14, 14, STONE, 0.5, { trim: STONE_DARK });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      egg(b, -46 + Math.sin(a) * 4, -6 + Math.cos(a) * 4, 1.2);
    }
    b.collectible('relic1', 'relic', -46, -6, 1.2, 'sanc1');
    b.wall(-53, -13, -39, -13, 1.2, 3, 1, STONE_DARK);
    b.wall(-53, -13, -53, 1, 1.2, 2.2, 1, STONE_DARK);
    // Stepping islets south of the hatchery hide the second relic and a shard.
    b.islet(-30, 3, -24, 2.2, 0x6a9a4a);
    b.collectible('relic2', 'relic', -38, -42, undefined, 'sanc2');
    b.collectible('mana1', 'mana', -24, -34);
    b.updraft(-30, -24, 2, 3, 12, 30);
    b.islet(-8, 5, -38, 2.5, 0x6a9a4a);
    b.islet(8, 3, -40, 2.5, 0x6a9a4a);
    b.collectible('heart1', 'heart', 22, -40);
    b.gemLine([[-8, -38], [8, -40], [22, -40]]);
    b.crystal(20, -42, 'blue', 15);

    // --- Flight yard (south): ledge steps, a vine tower and glide rings -------------
    const steps: [number, number, number][] = [[6, -20, 1.2], [9, -22.5, 2.0], [12.5, -24, 2.9], [15.5, -22, 3.8]];
    for (const [x, z, top] of steps) b.box(x, b.y(x, z) - 0.5, z, 2.6, top + 0.5, 2.6, STONE, { trim: STONE_DARK });
    b.gems(15.5, -22, 'blue', 1, 0, b.y(15.5, -22) + 0.3);
    b.story('ledges', 4, -18, 3, () => g.hud.flick('Jump at a ledge you can\'t quite reach: Aster grabs the edge and pulls up!', 6));
    const tx = -14;
    const tz = -19;
    const ty = b.y(tx, tz);
    b.box(tx, ty - 1, tz, 5, 10, 5, 0x8a8274, { trim: 0x9a9080 });
    merged(b, () => b.climbWall(tx + 2.5, tz, Math.PI / 2, 3.6, ty, ty + 9, false));
    b.crystal(tx - 1, tz - 1, 'blue', 12, false, ty + 9);
    b.story('climb', tx + 5, tz, 3, () => g.hud.flick('Vines mean climbable! Walk into them, then W/S to climb and Space to leap off.', 6));
    b.glideRings('tower', [
      [tx + 8, ty + 7.8, tz - 1, Math.PI / 2], [tx + 18, ty + 6.0, tz - 5, Math.PI * 0.6], [tx + 28, ty + 6.0, tz - 3, Math.PI * 0.4],
      [tx + 36, ty + 4.2, tz + 4, Math.PI * 0.2],
    ], 12, 40);
    b.updraft(tx + 23, tz - 4.5, 2.2, ty, ty + 8, 30);
    b.story('rings', tx, tz + 3, 6, () => g.hud.flick('Glide through the rings from the top of the tower. Hold Shift to dive for speed, let go to swoop up!', 7));

    hallOfMoments(b);

    b.scatter(50, 0, 0, 30, (x, z, y) => b.decor.grass(x, y, z, 0.9, 0x6a9a4a), (x, z) => Math.hypot(x, z) > 18);
    b.scatter(18, 0, 0, 30, (x, z) => b.tree(x, z, 1 + Math.abs(jitter(x + z)) * 0.5, 'round', { leaf: 0x5a8a3a }), (x, z) => Math.hypot(x, z) > 21 && Math.abs(x) > 6);
    b.scatter(20, 46, 4, 14, (x, z, y) => b.decor.flower(x, y, z, 0xffd070), (x, z) => Math.abs(x - 46) > 9 || Math.abs(z - 4) > 9);

    // --- Wardens ----------------------------------------------------------------------------------
    b.npc('emberhold', EMBERHOLD, 4, 8, Math.PI * 0.8, 'Talk to Emberhold', () => talkEmberhold(g));
    if (g.save.levelsDone.falls) b.npc('stormcrest', STORMCREST, 12, 22, -Math.PI * 0.8, 'Talk to Stormcrest', () => talkWarden(g, 'stormcrest'));
    if (g.save.levelsDone.frostworks) b.npc('frostfang', FROSTFANG, -12, 22, Math.PI * 0.8, 'Talk to Frostfang', () => talkWarden(g, 'frostfang'));
    if (g.save.levelsDone.plains) b.npc('stonehide', STONEHIDE, -14, 6, Math.PI * 0.5, 'Talk to Stonehide', () => talkWarden(g, 'stonehide'));
    if (g.save.levelsDone.keep) b.npc('nyxa', NYXA_FREED, 14, 6, -Math.PI * 0.5, 'Talk to Nyxa', () => talkWarden(g, 'nyxa'));

    // Later additions, built last so the older scenery above keeps its exact random layout.
    library(b);
    stargazers(b);
    hatcheryLife(b);
    hubLife(b);
  },

  onEnter(g, fresh) {
    if (!g.save.found['story:sanctum:arrive']) {
      g.save.found['story:sanctum:arrive'] = true;
      g.say(ARRIVE, () => startLesson(g));
      return;
    }
    if (!g.save.found['story:sanctum:lesson-done'] && g.save.elements.includes('fire')) {
      g.hud.flick('Emberhold wanted us on the training grounds to the east. Burn those dummies!', 6);
      return;
    }
    // Returning from a realm.
    const returns: [string, string, Line[]][] = [
      ['falls', 'story:sanctum:back-falls', BACK_FALLS],
      ['frostworks', 'story:sanctum:back-frost', BACK_FROST],
      ['plains', 'story:sanctum:back-plains', BACK_PLAINS],
    ];
    for (const [lvl, key, lines] of returns) {
      if (g.save.levelsDone[lvl] && !g.save.found[key]) {
        g.save.found[key] = true;
        g.say(lines, () => g.saveNow());
        return;
      }
    }
    if (fresh) g.hud.flick('The Wardgate is up the north stairs. Wardstones let you spend gems on new abilities.', 5);
  },
};

// --- the Hall of Moments ----------------------------------------------------------------------------

/**
 * An island vault north-east of the courtyard. Two doors snap open too briefly
 * to pass in normal time and a blade sweeps the hall between them: Dragon Time
 * is the key. At the far end an element lock wants every breath in the order
 * its glyphs count out.
 */
function hallOfMoments(b: Builder): void {
  const g = b.game;
  const cx = 36;
  const y = b.y(cx, 42);
  b.bridge(23.5, 21.5, b.y(23.5, 21.5), 34.5, 31.5, b.y(34.5, 31.5), 3.5);
  // Cross walls run past the island's edge so there is no easy way round.
  const H = 7;
  const cross = (z: number) => {
    b.wall(22, z, cx - 2, z, y - 1, H + 1, 1, STONE_DARK);
    b.wall(cx + 2, z, 50, z, y - 1, H + 1, 1, STONE_DARK);
    b.box(cx, y + 5, z, 4, H - 5, 1, STONE_DARK);
  };
  cross(34);
  cross(44);
  b.wall(cx - 3, 34, cx - 3, 44, y - 1, H + 1, 1, STONE);
  b.wall(cx + 3, 34, cx + 3, 44, y - 1, H + 1, 1, STONE);
  b.snapGate(cx, 34, 4, 5, 0, 0.2, 2.2, 0, y);
  b.spinBlade(cx, 39, 2.4, 3.4, 2, y);
  b.snapGate(cx, 44, 4, 5, 0, 0.2, 2.2, 1.1, y);
  b.story('moments', cx - 1, 32, 3, () => g.hud.flick('That door only opens for a blink! Wait till its edge glows, then hold C for Dragon Time and dash through.', 8));
  b.puzzleHint(cx, 32, 5, ['The glowing edge means it\'s about to open. Start Dragon Time (hold C) just before, then run!'], 'moments-in', 25);
  b.trigger(cx, 42.4, 1, () => b.level.emit('moments-in'));
  // The vault. A lock of four sockets, struck in the order the dots count.
  const order: ('fire' | 'lightning' | 'ice' | 'earth')[] = ['ice', 'fire', 'earth', 'lightning'];
  b.elementLock(cx, 47.5, Math.PI, order, 'moments-vault', [1, 3, 0, 2]);
  const cage = new Cage(b, cx, 50.5, 1.8, 3.4);
  const cageSolid = b.col.add(makeCyl(cx, 50.5, 2.1, y, y + 3.4));
  b.crystal(cx - 0.6, 50.5, 'mixed', 60, true, y);
  b.collectible('heart2', 'heart', cx + 0.7, 50.5, y);
  b.level.on('moments-vault', () => {
    cage.shatter(g);
    cageSolid.enabled = false;
    g.hud.flick('It opened! The Wardens hid all sorts in here.', 5);
  });
  if (b.level.fired.has('moments-vault')) cageSolid.enabled = false;
  b.story('lock', cx, 46, 3, () => {
    const all = (['fire', 'lightning', 'ice', 'earth'] as const).every((e) => g.save.elements.includes(e));
    g.hud.flick(all
      ? 'Four sockets, four elements. The little dots under each glyph must be the order to hit them in!'
      : 'Four sockets, four elements... We\'ll have to come back once you know every breath.', 7);
  });
  b.puzzleHint(cx, 47, 5, [
    'Count the dots under each glyph: one dot first, then two, three, four. Hit each socket with its own element.',
  ], 'moments-vault', 30);
  for (const [lx, lz] of [[cx - 5, 49], [cx + 5, 49], [cx - 5, 32], [cx + 5, 32]] as [number, number][]) {
    lantern(b, lx, b.y(lx, lz), lz, 0xffe0a0);
  }
}

// --- scenery helpers ------------------------------------------------------------------------------

function statue(b: Builder, x: number, z: number, look: DragonLook, lit: boolean): void {
  const y = 0.25;
  b.box(x, y, z, 3, 1.2, 3, STONE_DARK, { trim: STONE });
  const stoneLook: DragonLook = { ...look, body: 0xa89e8a, belly: 0xb8ae9a, horn: lit ? look.body : 0x8a8272, membrane: 0x9a9080, spikes: 0x8a8272, eye: lit ? look.eye : 0x6a6458, scale: 1.3 };
  const rig = new DragonRig(stoneLook, false);
  const p = defaultPose();
  p.attack = 'roar';
  p.attackT = 0.5;
  for (let i = 0; i < 30; i++) rig.update(0.05, p);
  rig.root.position.set(x, y + 1.2, z);
  rig.root.rotation.y = Math.atan2(-x, -z);
  // A statue never moves: bake it to a few static meshes instead of a live rig.
  bakeRig(b, rig.root);
  b.col.add(makeCyl(x, z, 1.5, y, y + 3.5));
  if (lit) b.beacon(x, y + 5, z, look.eye, 0.6);
}

function floorRing(b: Builder, r0: number, r1: number, color: number, glowing = false): void {
  const m = glowing
    ? new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 })
    : new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 48, 1), m);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.26;
  ring.receiveShadow = true;
  b.level.root.add(ring);
}

function egg(b: Builder, x: number, z: number, y: number): void {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), mat(0x6a6070, { rough: 0.4 }));
  m.scale.set(1, 1.3, 1);
  m.position.set(x, y + 0.6, z);
  m.castShadow = true;
  b.addStatic(m);
  const nest = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.18, 6, 14), mat(0x7a5a3a, { rough: 1 }));
  nest.rotation.x = Math.PI / 2;
  nest.position.set(x, y + 0.15, z);
  b.addStatic(nest);
}

function dummy(g: Game, x: number, z: number): void {
  const y = g.col.groundAt(x, z, 20, 0.2).y;
  const spawn = () => {
    const e = g.spawnEnemy('dummy', x, y + 0.05, z, Math.PI, false);
    e.onDeath = () => {
      setTimeout(() => {
        if (g.level?.def.id === 'sanctum') {
          spawn();
          g.fx.sparkle(x, y + 1, z, 0xf5c46b, 10);
        }
      }, 3000);
    };
  };
  spawn();
}

// --- story ---------------------------------------------------------------------------------------------

const ARRIVE: Line[] = [
  { who: 'emberhold', text: 'Welcome to the Warden Sanctum, Aster. Or what the Hollow King left of it.' },
  { who: 'flick', text: 'Whoa. It\'s... floating. Why is it floating?' },
  { who: 'emberhold', text: 'Because it was built by dragons, firefly. We do not care for walking.' },
  { who: 'emberhold', text: 'Four Wardens once taught the four breaths here. Fire, lightning, ice and earth. On the night of the Eclipse, three of them were taken.' },
  { who: 'aster', text: 'Taken by who?' },
  { who: 'emberhold', text: 'By a young shadow dragoness named Nyxa. She serves the Hollow King now. I escaped only because I stayed to save one egg.' },
  { who: 'aster', text: 'Me.' },
  { who: 'emberhold', text: 'You. Now, let us see if you have your father\'s fire. Come to me.' },
];

function startLesson(g: Game): void {
  g.learnElement('fire');
  g.say([
    { who: 'emberhold', text: 'Breathe in. Feel the heat under your scales. Now let it out.', action: () => g.fx.explosion(g.player.x, g.player.y + 1, g.player.z, 1.5, 0xffa040) },
    { who: 'aster', text: 'I... I breathed FIRE!' },
    { who: 'flick', text: 'You singed my wings! Watch where you point that thing!' },
    { who: 'emberhold', text: 'Hold your right claw (Right Mouse) to breathe flame. It burns your mana, the green light, so watch it.' },
    { who: 'emberhold', text: 'Press Q to hurl a fireball. Go to the training grounds east of here. Burn the dummies, then light the four braziers.' },
  ], () => g.hud.flick('Training grounds are across the east bridge. Hold Right Mouse to breathe fire, Q for a fireball!', 7));
}

function lessonTorchesDone(g: Game): void {
  if (g.save.found['story:sanctum:lesson-done']) return;
  g.save.found['story:sanctum:lesson-done'] = true;
  if (!g.save.unlocked.includes('falls')) g.save.unlocked.push('falls');
  g.level?.emit('wardgate-open');
  g.player.fury = 100;
  g.say([
    { who: 'emberhold', text: 'Well done! Now: fire is anger made useful. Strike hard and fast, and fury builds inside you.' },
    { who: 'emberhold', text: 'When the ring around your emblem glows, press X to release your Fury. I have lent you mine. Try it.' },
    { who: 'emberhold', text: 'And one thing more. Hold C and the world will slow for you. We call it Dragon Time.' },
    { who: 'emberhold', text: 'Stormcrest, the Lightning Warden, was dragged to Stormspire Falls. The Wardgate at the top of the north stairs is open.' },
    { who: 'aster', text: 'Then that\'s where I\'m going.' },
    { who: 'emberhold', text: 'Wardstones like the one by the stairs will let you spend the spirit gems you gather. Grow strong, Aster.' },
  ], () => g.saveNow());
}

function talkEmberhold(g: Game): void {
  const s = g.save;
  let lines: Line[];
  if (!s.found['story:sanctum:lesson-done']) {
    lines = [{ who: 'emberhold', text: 'The training grounds are across the east bridge. Burn the dummies, then light all four braziers with fire.' }];
  } else if (!s.levelsDone.falls) {
    lines = [
      { who: 'emberhold', text: 'Stormcrest waits at Stormspire Falls. Take the Wardgate at the top of the north stairs.' },
      { who: 'emberhold', text: 'Remember: a guarded foe fears your tail. A burning foe fears ice. And a frozen foe shatters under a heavy blow.' },
    ];
  } else if (!s.levelsDone.keep) {
    lines = [
      { who: 'emberhold', text: 'Every Warden you free makes you stronger, and makes Nyxa more desperate.' },
      { who: 'emberhold', text: 'Combine your breaths. Fire on a shocked enemy overloads. Ice on a burning one bursts into steam.' },
    ];
  } else {
    lines = [{ who: 'emberhold', text: 'The Sanctum has two young dragons again. I had stopped hoping I would ever say that.' }];
  }
  g.say(lines);
}

function talkWarden(g: Game, who: string): void {
  const lines: Record<string, Line[]> = {
    stormcrest: [
      { who: 'stormcrest', text: 'Kid! Hey! Did you know that lightning is five times hotter than the sun? I read it. Well, I made it up. But it FEELS true.' },
      { who: 'stormcrest', text: 'Arc Breath jumps between enemies. More targets, more fun. Shock them and they take extra damage from everything!' },
    ],
    frostfang: [
      { who: 'frostfang', text: 'Patience, young one. Chill an enemy enough and it freezes solid. Then strike with your tail, and it shatters like winter glass.' },
    ],
    stonehide: [
      { who: 'stonehide', text: '...Earth does not hurry. Earth does not need to.' },
      { who: 'stonehide', text: 'My Boulder cracks stone walls. There may be old walls in places you have already been.' },
    ],
    nyxa: [
      { who: 'nyxa', text: 'I keep waking up and expecting the voice to be there. It isn\'t. It\'s very quiet without it.' },
      { who: 'aster', text: 'Quiet\'s not so bad. You get used to it.' },
    ],
  };
  g.say(lines[who] ?? []);
}

const BACK_FALLS: Line[] = [
  { who: 'emberhold', text: 'Stormcrest is home, and his lightning is yours. You have done in days what I could not do in years.' },
  { who: 'emberhold', text: 'Frostfang, our Ice Warden, is chained in the Frostworks, the old ice forges. The Wardgate will take you there.' },
  { who: 'flick', text: 'Ice forges. Great. My wings are going to freeze off.' },
];
const BACK_FROST: Line[] = [
  { who: 'emberhold', text: 'Frostfang returns, and so does the cold wisdom of ice. Only Stonehide remains.' },
  { who: 'emberhold', text: 'He was taken to the Stonewild Plains. The ground itself has turned on the Sanctum there.' },
];
const BACK_PLAINS: Line[] = [
  { who: 'emberhold', text: 'All four breaths, in one young dragon. It has not happened in a thousand years.' },
  { who: 'emberhold', text: 'Nyxa will come for you now with everything she has. Better we go to her. Eclipse Keep lies open through the Wardgate.' },
  { who: 'aster', text: 'I\'m ready.' },
  { who: 'emberhold', text: 'No one is ever ready, Aster. Go anyway.' },
];

// ============================================================================================
// Later additions: the burnt library, the Stargazers' terrace, the ledge below the hatchery,
// and things to find and smash around the hub (kept off the main paths).
// ============================================================================================

const WOOD = 0x7a5a3a;
const SHELF = 0x6a4a30;
const LIB_WALL = 0xb4a894;

const M = {
  wood: () => mat(0x8a6a44, { rough: 0.95 }),
  dark: () => mat(0x4a3a30, { rough: 1 }),
  stone: () => mat(STONE, { rough: 0.9, flat: true }),
  paper: () => mat(0xe8dcc0, { rough: 0.9 }),
  straw: () => mat(0xd8b868, { rough: 1, flat: true }),
  banner: () => mat(0xa8423a, { rough: 0.9 }),
  brass: () => mat(0xc8a050, { rough: 0.35, metal: 0.7, flat: true }),
  books: [() => mat(0x8a3a3a, { rough: 0.9 }), () => mat(0x3a5a8a, { rough: 0.9 }), () => mat(0x5a7a3a, { rough: 0.9 })],
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

/** decor.lantern with a shared glow. */
function lantern(b: Builder, x: number, y: number, z: number, color = 0xffe0a0, ry = 0): void {
  const post = mat(0x3a2e24, { rough: 0.9 });
  const ax = Math.cos(ry);
  const az = -Math.sin(ry);
  b.decor.add(GEO.cyl6(), post, x, y, z, 0.07, 2.2, 0.07);
  b.decor.add(GEO.box(), post, x + ax * 0.25, y + 2.15, z + az * 0.25, 0.55, 0.06, 0.06, 0, ry, 0);
  b.decor.add(GEO.blobLow(), glowOf(color), x + ax * 0.45, y + 1.9, z + az * 0.45, 0.14, 0.2, 0.14, 0, 0, 0, false);
}

/** An instanced box with no collision; y is its base. */
function deco(b: Builder, m: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, ry = 0, rx = 0, rz = 0): void {
  b.decor.add(GEO.box(), m, x, y + h / 2, z, w, h, d, rx, ry, rz);
}

/** An instanced six-sided post, base at y. */
function stick(b: Builder, m: THREE.Material, x: number, y: number, z: number, r: number, h: number, rx = 0, ry = 0, rz = 0): void {
  b.decor.add(GEO.cyl6(), m, x, y, z, r, h, r, rx, ry, rz);
}

/** A log or beam lying along `ry`, centred on (x, z), resting at y. */
function beam(b: Builder, m: THREE.Material, x: number, y: number, z: number, r: number, len: number, ry: number, lift = 0): void {
  const dx = -Math.cos(ry);
  const dz = Math.sin(ry);
  b.decor.add(GEO.cyl6(), m, x - (dx * len) / 2, y + r, z - (dz * len) / 2, r, len, r, 0, ry, Math.PI / 2 - lift);
}

/** Runs `make`, then merges the meshes of any groups it added to the level (a vine wall is a mesh per leaf). */
function merged<T>(b: Builder, make: () => T): T {
  const before = new Set(b.level.root.children);
  const out = make();
  for (const c of b.level.root.children) if (!before.has(c) && !(c as THREE.Mesh).isMesh) mergeStatic(c);
  return out;
}

/** Enemies that only turn up once Aster comes within `r` of (x, z), so far-off ones cost nothing until then. */
function lazyEnemies(b: Builder, x: number, z: number, r: number, list: [string, number, number, number][]): void {
  const g = b.game;
  b.trigger(x, z, r, () => {
    for (const [type, ex, ez, yaw] of list) g.pendingSpawns.push({ type, x: ex, y: g.col.groundAt(ex, ez, 1e4, 0.3).y + 0.05, z: ez, yaw });
  });
}

/**
 * Bakes a posed rig into plain static meshes, one per material, which the
 * level then merges with its other statics. A statue drawn as a live rig costs
 * about sixty draw calls; baked, a handful.
 */
function bakeRig(b: Builder, root: THREE.Object3D): void {
  root.updateMatrixWorld(true);
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
  root.traverseVisible((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || Array.isArray(m.material)) return;
    let geo = m.geometry.clone();
    for (const n of Object.keys(geo.attributes)) if (n !== 'position' && n !== 'normal') geo.deleteAttribute(n);
    if (!geo.getAttribute('normal')) geo.computeVertexNormals();
    if (geo.index) geo = geo.toNonIndexed();
    geo.applyMatrix4(m.matrixWorld);
    const list = byMat.get(m.material as THREE.Material) ?? [];
    list.push(geo);
    byMat.set(m.material as THREE.Material, list);
  });
  for (const [material, geos] of byMat) {
    const one = mergeGeometries(geos, false);
    for (const geo of geos) geo.dispose();
    if (!one) continue;
    one.computeBoundingSphere();
    const mesh = new THREE.Mesh(one, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // Chunked by where it stands: the geometry is in world space, so place the mesh's origin there.
    // A copy: translate() recomputes the bounding sphere in place.
    const c = one.boundingSphere!.center.clone();
    one.translate(-c.x, 0, -c.z);
    mesh.position.set(c.x, 0, c.z);
    b.addStatic(mesh);
  }
}

/** A stone dragon on a plinth, baked to static geometry. */
function stoneDragon(b: Builder, x: number, y: number, z: number, yaw: number, look: DragonLook, attack: 'roar' | null = null): void {
  const rig = new DragonRig(look, false);
  const p = defaultPose();
  if (attack) {
    p.attack = attack;
    p.attackT = 0.5;
  }
  for (let i = 0; i < 30; i++) rig.update(0.05, p);
  rig.root.position.set(x, y, z);
  rig.root.rotation.y = yaw;
  bakeRig(b, rig.root);
}

const ARCHIVIST: DragonLook = {
  body: 0xa89e8a, belly: 0xb8ae9a, horn: 0x8a8272, membrane: 0x9a9080, eye: 0x6a6458, spikes: 0x8a8272,
  scale: 1.5, hornStyle: 'crown', tailStyle: 'fan', slender: 0.8, beard: true,
};

// --- the burnt library ------------------------------------------------------------------------

/**
 * Over the old bridge north-west of the courtyard: the Wardens' library,
 * burnt on the night of the Eclipse. Gloom remnants still nest among the
 * shelves. A scroll tower with vines hides a lost egg on top, and the sealed
 * archive (Warden stone: only an earth blast shifts it) keeps a chest.
 */
function library(b: Builder): void {
  const g = b.game;
  // The old bridge, burnt through in the middle.
  const ax = -24.4;
  const az = 19.0;
  const bx = -37.4;
  const bz = 29.0;
  const lerp = (t: number): [number, number, number] => [ax + (bx - ax) * t, az + (bz - az) * t, b.y(bx, bz) * t];
  const [m1x, m1z, m1y] = lerp(0.44);
  const [m2x, m2z, m2y] = lerp(0.56);
  b.bridge(ax, az, b.y(ax, az), m1x, m1z, m1y, 3);
  b.bridge(m2x, m2z, m2y, bx, bz, b.y(bx, bz), 3);
  b.gemLine([[ax, az], [m1x, m1z]], 'blue', 2.4);
  b.gems((m1x + m2x) / 2, (m1z + m2z) / 2, 'blue', 1, 0, (m1y + m2y) / 2 + 0.8);
  b.gemLine([[m2x, m2z], [bx, bz]], 'blue', 2.4);
  b.arch(ax + (bx - ax) * 0.06, az + (bz - az) * 0.06, Math.atan2(bx - ax, bz - az), 4.4, 3.8, STONE_DARK);
  b.story('library', ax + 0.8, az - 0.6, 2.5, () => g.hud.flick('The old library. Emberhold says the Hollow King\'s host burned half the Sanctum. Something\'s still moving over there...', 7));

  // The hall: a stone floor, broken walls, toppled shelves.
  const F = 2.3;
  const X0 = -54;
  const X1 = -37;
  const Z0 = 31.3;
  const Z1 = 42.7;
  const cx = (X0 + X1) / 2;
  b.platform(cx, F, (Z0 + Z1) / 2, X1 - X0, Z1 - Z0, STONE, 0.8, { trim: STONE_DARK });
  const wall = (x1: number, z1: number, x2: number, z2: number, h: number, y0 = F) => b.wall(x1, z1, x2, z2, y0, h, 0.8, LIB_WALL);
  wall(X0, Z1 - 0.4, -49.5, Z1 - 0.4, 6.2);
  wall(-49.5, Z1 - 0.4, -45, Z1 - 0.4, 4.6);
  wall(-45, Z1 - 0.4, -40.5, Z1 - 0.4, 5.8);
  wall(-40.5, Z1 - 0.4, X1, Z1 - 0.4, 3.2);
  wall(X0 + 0.4, Z0, X0 + 0.4, 35.9, 5.2);
  wall(X0 + 0.4, 38.1, X0 + 0.4, Z1 - 0.8, 5.2);
  b.box(X0 + 0.4, F + 2.9, 37, 0.8, 2.3, 2.2, LIB_WALL);
  wall(X1 - 0.4, 38.4, X1 - 0.4, Z1 - 0.8, 3.4);
  wall(X1 - 0.4, Z0, X1 - 0.4, 32.8, 1.8);
  wall(X0 + 0.8, Z0 + 0.4, -48.5, Z0 + 0.4, 4.2);
  wall(-45, Z0 + 0.4, -42, Z0 + 0.4, 2.2);
  for (const [x, z, n] of [[-47, 31.2, 5], [-40.5, 31.4, 4], [-37.2, 35.6, 6], [-42.8, 42.9, 4]] as [number, number, number][]) {
    for (let i = 0; i < n; i++) b.decor.rock(x + jitter(i + x, 1) * 1.4, F - 0.1, z + jitter(i + z, 2) * 0.9, 0.3 + Math.abs(jitter(i, 3)) * 0.3, 0xb0a590);
  }
  // Shelves: two rows, the middle of the front row toppled.
  const shelf = (x: number, z: number) => {
    b.box(x, F, z, 3.6, 3.4, 0.8, SHELF, { surface: 'wood' });
    for (let lv = 0; lv < 3; lv++) {
      for (const sd of [-1, 1]) deco(b, M.books[(lv + (x > -47 ? 1 : 0)) % 3]!(), x + jitter(x + lv, sd) * 0.15, F + 0.35 + lv * 1.05, z + sd * 0.36, 3.2, 0.72, 0.12);
    }
  };
  for (const x of [-50.8, -46.6, -42.4]) shelf(x, 39.6);
  shelf(-50.8, 35.0);
  shelf(-42.4, 35.0);
  b.box(-46.6, F, 34.4, 3.6, 0.9, 1.9, SHELF, { surface: 'wood' });
  deco(b, M.books[0]!(), -46.2, F, 33.1, 1.2, 0.2, 0.8, 0.4);
  deco(b, M.books[1]!(), -47.4, F, 33.4, 0.9, 0.18, 0.6, 1.2);
  // Books and scrolls all over the floor, charred beams fallen in from the roof.
  for (let i = 0; i < 14; i++) {
    const x = cx + jitter(i, 41) * 7.5;
    const z = 37.3 + jitter(i, 42) * 1.6;
    if (Math.abs(x + 49) < 1.4 || Math.abs(x + 41.5) < 1.4) continue;
    deco(b, M.books[i % 3]!(), x, F, z, 0.34, 0.08, 0.26, i * 1.3);
  }
  for (let i = 0; i < 6; i++) stick(b, M.paper(), -39.5 + jitter(i, 44) * 1.4, F + 0.07, 34.5 + jitter(i, 45) * 2.5, 0.07, 0.6, Math.PI / 2, i * 0.9);
  beam(b, M.dark(), -44.2, F, 41.0, 0.18, 5.5, 0.35, 0.7);
  beam(b, M.dark(), -52.4, F, 37.2, 0.16, 4.5, 1.9, 0.55);
  beam(b, M.dark(), -39.6, F + 3.4, 40.2, 0.16, 4.6, Math.PI / 2 + 0.1, 0);
  // Torn banners on the back wall.
  for (const x of [-51.5, -43]) deco(b, M.banner(), x, F + 2.6, Z1 - 0.84, 1.1, 2.6, 0.06);
  // Reading desks. The Keeper of Scrolls left a notice on the first.
  for (const x of [-49, -41.5]) {
    b.box(x, F, 37.3, 1.8, 0.8, 0.9, WOOD, { surface: 'wood' });
    deco(b, M.paper(), x + 0.3, F + 0.8, 37.2, 0.6, 0.04, 0.45, 0.3);
    b.decor.add(GEO.blobLow(), glowOf(0xffd070), x - 0.6, F + 0.95, 37.5, 0.05, 0.09, 0.05, 0, 0, 0, false);
  }
  b.letter('archivist', -49, 37.3, F);

  // The sealed archive: Warden stone across the door.
  const vx = -55.4;
  b.platform(vx, F, 37, 3.6, 4.2, STONE_DARK, 0.8);
  b.box(vx, F, 38.9, 3.6, 3.2, 0.5, STONE_DARK);
  b.box(vx, F, 35.1, 3.6, 3.2, 0.5, STONE_DARK);
  b.box(vx - 1.55, F, 37, 0.5, 3.2, 3.3, STONE_DARK);
  b.box(vx, F + 3.2, 37, 4.0, 0.4, 4.4, STONE, { trim: STONE_DARK });
  b.gate(X0 + 0.4, 37, 2.2, 2.8, Math.PI / 2, 'rock', '', F);
  b.chest('archive', vx - 0.3, 37, Math.PI / 2, { blue: 30, red: 2, green: 2 });

  // The scroll tower, vines up its east face, a lost egg on the roof.
  const tx = -50;
  const tz = 45;
  const ty = b.y(tx, tz);
  const top = ty + 9;
  b.box(tx, ty - 0.5, tz, 3.6, top - ty + 0.5, 3.6, 0x8a8274, { trim: STONE_DARK });
  merged(b, () => b.climbWall(tx + 1.8, tz, Math.PI / 2, 2.6, ty, top, false));
  deco(b, M.banner(), tx + 0.3, top - 3.2, tz - 1.83, 1.0, 2.4, 0.05);
  b.egg('tower', tx - 0.4, tz + 0.3, top);
  b.gems(tx + 0.9, tz - 0.9, 'blue', 3, 0.6, top);
  b.story('scrolltower', tx + 4.2, tz, 2.5, () => g.hud.flick('Vines up the scroll tower. Something up top is glowing... climb!', 5));

  // Gloom remnants, their cocoons, and powder kegs from the Wardens' stores.
  lazyEnemies(b, cx, 36, 30, [['grunt', -44.5, 33.3, 0], ['grunt', -40.5, 40.2, Math.PI], ['sapper', -47.5, 28.4, 0]]);
  b.breakable(-39.2, 33.8, 'keg');
  b.breakable(-39.2, 33.8, 'keg');
  b.breakable(-49.2, 29.4, 'keg');
  for (const [x, z] of [[-51.2, 33.0], [-52.9, 41.2], [-38.9, 41.2], [-53.4, 44.4], [-40.8, 29.4]] as [number, number][]) b.breakable(x, z, 'pod');
  b.breakable(-53.1, 32.6, 'crate');
  b.breakable(-53.1, 32.6, 'crate');
  b.breakable(-52.2, 32.2, 'basket');
  b.breakable(-49.6, 41.3, 'urn');
  b.breakable(-43.8, 41.3, 'urn');
  b.breakable(-45.2, 32.4, 'crate');
  // Crates of rescued scrolls, stacked by the sapper's kegs.
  b.breakable(-51.0, 28.6, 'crate');
  b.breakable(-51.0, 28.6, 'crate');
  b.breakable(-38.9, 39.3, 'basket');

  // Outside: the Archivist's statue greets visitors; dead trees, ash and weeds.
  const sx = -45;
  const sz = 27.6;
  const sy = b.y(sx, sz);
  b.box(sx, sy - 0.3, sz, 2.6, 1.3, 2.6, STONE_DARK, { trim: STONE });
  stoneDragon(b, sx, sy + 1.0, sz, 0, ARCHIVIST);
  b.col.add(makeCyl(sx, sz, 1.3, sy + 1, sy + 4));
  b.breakable(sx - 2.1, sz + 0.6, 'urn');
  b.breakable(sx + 2.1, sz + 0.6, 'urn');
  b.tree(-39.4, 45.2, 0.9, 'dead');
  b.tree(-55.6, 29.4, 0.8, 'dead');
  b.tree(-41, 25.6, 0.8, 'autumn', { leaf: 0xc86a3a });
  lantern(b, -38.6, b.y(-38.6, 29.6), 29.6, 0xffe0a0, Math.PI);
  const inHall = (x: number, z: number) => x > X0 - 4.5 && x < X1 + 0.5 && z > Z0 - 0.5 && z < Z1 + 0.5;
  b.scatter(34, -46, 36, 12, (x, z, y) => b.decor.grass(x, y, z, 0.9, 0x7a8a4a), (x, z) => !inHall(x, z) && Math.hypot(x - tx, z - tz) > 2.8);
  b.scatter(10, -46, 36, 12, (x, z, y) => b.decor.flower(x, y, z, 0xffd070), (x, z) => !inHall(x, z));
}

// --- the Stargazers' terrace ----------------------------------------------------------------------

/**
 * South-east, past the heart-shard islet: where the Stargazers watched the
 * twin moons. Star-steps spiral up a column to the great telescope (a lost
 * egg sits by it), the strongbox rests on the landing halfway, and the last
 * Stargazer's log lies on her desk.
 */
function stargazers(b: Builder): void {
  const g = b.game;
  b.islet(29.6, 2.3, -38.3, 1.5, 0x6a9a4a);
  b.islet(34.6, 3.2, -36.0, 1.4, 0x6a9a4a);
  b.gems(29.6, -38.3, 'blue', 1, 0, 2.3);
  b.gems(34.6, -36.0, 'blue', 1, 0, 3.2);
  b.story('stargazers', 41.5, -34.4, 3, () => g.hud.flick('The Stargazers\' terrace! Those floating stones spiral all the way up to the big telescope.', 6));
  const cx = 49;
  const cz = -31.5;
  const base = b.y(cx, cz);
  const top = base + 8.2;
  b.pillar(cx, cz, 1.2, base - 0.5, top, STONE);
  b.box(cx, top - 0.3, cz, 3.8, 0.3, 3.8, STONE_DARK, { trim: STONE });
  // Star-steps: floating stones rising round the column. The third is a landing with the strongbox.
  let chestAt: [number, number, number] | null = null;
  for (let k = 1; k <= 6; k++) {
    const a = -Math.PI / 2 - (k - 1) * 1.08;
    const x = cx + Math.sin(a) * 3.3;
    const z = cz + Math.cos(a) * 3.3;
    const y = base + 1.2 * k;
    const r = k === 3 ? 1.5 : 0.95;
    b.islet(x, y, z, r, 0xd8ccb0, 0x9a9080);
    b.decor.add(GEO.blobLow(), glowOf(0xbfe0ff), x, y - 1.6 - r * 0.9, z, 0.12, 0.12, 0.12, 0, 0, 0, false);
    if (k === 3) chestAt = [x, y, z];
  }
  b.chest('stargazer', chestAt![0], chestAt![2], Math.atan2(cx - chestAt![0], cz - chestAt![2]) + Math.PI, { blue: 24, red: 2, green: 1 }, chestAt![1]);
  // The great telescope, and the egg someone left in its cradle.
  const tube = M.brass();
  b.decor.add(GEO.cyl(), tube, cx + 0.2, top + 1.1, cz - 0.2, 0.32, 3.0, 0.32, 0, 0.7, 1.05);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    stick(b, M.dark(), cx + Math.sin(a) * 0.5, top, cz + Math.cos(a) * 0.5, 0.05, 1.3, Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3);
  }
  b.egg('stars', cx - 0.9, cz + 0.8, top);
  // The orrery: brass rings and glowing moons round a sun.
  const ox = 43.8;
  const oz = -28.2;
  const oy = b.y(ox, oz);
  stick(b, M.brass(), ox, oy, oz, 0.1, 1.5);
  b.decor.add(GEO.blobLow(), glowOf(0xffd070), ox, oy + 1.9, oz, 0.3, 0.3, 0.3, 0, 0, 0, false);
  const ring = orreryRing();
  for (let i = 0; i < 3; i++) {
    const r = 0.7 + i * 0.45;
    b.decor.add(ring, tube, ox, oy + 1.9, oz, r, r, r, 1.2 + i * 0.25, i * 0.9, 0.2);
    const a = i * 2.2;
    b.decor.add(GEO.blobLow(), glowOf([0xbfe0ff, 0xe0c0ff, 0xbfe0ff][i]!), ox + Math.sin(a) * r, oy + 1.9 + Math.cos(a) * r * 0.3, oz + Math.cos(a) * r, 0.1, 0.1, 0.1, 0, 0, 0, false);
  }
  // The desk with her log, a star chart on an easel, crates of lenses.
  b.box(44.6, base, -35.6, 1.7, 0.8, 0.9, WOOD, { surface: 'wood' });
  deco(b, M.paper(), 44.9, base + 0.8, -35.6, 0.7, 0.04, 0.5, 0.2);
  b.letter('stargazer', 44.6, -35.6, base);
  deco(b, mat(0x2a3050, { rough: 0.8 }), 42.4, base + 0.8, -32.4, 0.1, 1.3, 1.1, Math.PI / 2 + 0.3);
  for (let i = 0; i < 5; i++) b.decor.add(GEO.blobLow(), glowOf(0xfff0c0), 42.5 + jitter(i, 51) * 0.1, base + 1.1 + Math.abs(jitter(i, 52)) * 0.9, -32.4 + jitter(i, 53) * 0.45, 0.04, 0.04, 0.04, 0, 0, 0, false);
  stick(b, M.dark(), 42.5, base, -32.4, 0.05, 1.3, 0.2);
  b.breakable(44.2, -37.9, 'crate');
  b.breakable(44.2, -37.9, 'crate');
  b.breakable(45.3, -38.4, 'basket');
  b.breakable(52.6, -26.6, 'crate');
  b.breakable(53.4, -27.6, 'crate');
  b.breakable(52.4, -34.6, 'crate');
  b.decor.tree(52.8, base, -37.2, 0.8, 'crystal', { leaf: 0xbfe0ff });
  b.decor.tree(41.6, base, -29.6, 0.7, 'crystal', { leaf: 0xd0b0ff });
  lantern(b, 41.2, base, -36.6, 0xffe0a0);
  lantern(b, 54.2, base, -30.4, 0xffe0a0, Math.PI);
  b.scatter(16, 47, -32, 7.5, (x, z, y) => b.decor.flower(x, y, z, [0xbfe0ff, 0xffd070][Math.floor(Math.abs(jitter(x * z)) * 2)]!), (x, z) => Math.hypot(x - cx, z - cz) > 4.8);
  b.scatter(20, 47, -32, 7.5, (x, z, y) => b.decor.grass(x, y, z, 0.8, 0x6a9a4a), (x, z) => Math.hypot(x - cx, z - cz) > 4.8);
}

let ringGeo: THREE.BufferGeometry | null = null;
function orreryRing(): THREE.BufferGeometry {
  ringGeo ??= new THREE.TorusGeometry(1, 0.03, 4, 28);
  return ringGeo;
}

// --- the hatchery: straw, baskets, the Keeper's desk, and an egg that rolled off the ledge ---------

function hatcheryLife(b: Builder): void {
  const y = 1.2;
  for (const [x, z, s] of [[-50.5, -10.4, 1.2], [-41.6, -1.6, 1.0], [-51.2, -1.2, 0.9]] as [number, number, number][]) {
    b.decor.add(GEO.blob(), M.straw(), x, y, z, 1.1 * s, 0.3 * s, 0.9 * s, 0, x, 0);
  }
  for (const [x, z] of [[-51.8, -11.6], [-50.6, -11.8], [-51.8, 0.0]] as [number, number][]) b.breakable(x, z, 'basket', { y });
  for (const [x, z] of [[-40.2, -1.8], [-40.3, -0.3], [-44.5, -11.9]] as [number, number][]) b.breakable(x, z, 'basket', { y });
  // The Keeper's desk, the hatchery roll on it.
  b.box(-41.2, y, -11.6, 1.6, 0.8, 0.9, WOOD, { surface: 'wood' });
  deco(b, M.paper(), -41.0, y + 0.8, -11.6, 0.6, 0.04, 0.45, 0.2);
  b.decor.add(GEO.blobLow(), glowOf(0xffd070), -41.8, y + 0.95, -11.3, 0.05, 0.09, 0.05, 0, 0, 0, false);
  b.letter('hatchery', -41.2, -11.6, y);
  // Far below the south-west edge, a little rock with a nest on it, and a warm draft back up.
  const ex = -61.8;
  const ez = -17.8;
  const ey = -5;
  b.islet(ex, ey, ez, 2.4, 0x6a9a4a);
  // A vine-grown spire leans against the cliff: climb it, then hop back onto the ledge.
  const vyaw = Math.atan2(ex - -59.3, ez - -16.0);
  merged(b, () => b.climbWall(-59.3, -16.0, vyaw, 2.6, ey - 0.4, 1.0, true));
  for (const [ox, oz, sc] of [[0.9, 0.2, 1.1], [-0.6, 0.9, 0.9], [0.3, -0.8, 0.8]] as [number, number, number][]) {
    b.decor.rock(-58.8 + ox, ey - 1.2, -15.6 + oz, sc, 0x7a7064);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    b.decor.add(GEO.cyl6(), M.dark(), ex - 1.0 + Math.sin(a) * 0.55, ey + 0.1, ez - 0.8 + Math.cos(a) * 0.55, 0.05, 0.8, 0.05, Math.PI / 2, a + 1.2, 0);
  }
  b.egg('ledge', ex - 1.0, ez - 0.8, ey);
  for (let i = 0; i < 3; i++) b.decor.add(GEO.octa(), glowOf(0xbfe0ff), ex + 1.3 + i * 0.2, ey + 0.3, ez - 1.2 + i * 0.25, 0.14, 0.5 - i * 0.1, 0.14, 0.2 * i, i, -0.2 * i, false);
}

// --- small comforts around the hub ------------------------------------------------------------------

function hubLife(b: Builder): void {
  // Emberhold's unsent letter, on a writing stand behind the east arch.
  const ty = 4.6;
  stick(b, M.dark(), 8.6, ty, 51.6, 0.06, 1.0);
  deco(b, M.wood(), 8.6, ty + 1.0, 51.6, 0.7, 0.06, 0.5, 0, -0.35);
  b.letter('emberhold', 8.6, 51.2, ty);
  // Courtyard corners: urns and a bench or two, off the paths.
  b.breakable(-15.2, 13.6, 'crate');
  b.breakable(-14.4, -14.6, 'crate');
  b.breakable(14.4, -14.6, 'crate');
  for (const [x, z, ry] of [[-18.5, -4.5, Math.PI / 2], [18.5, -6.5, Math.PI / 2]] as [number, number, number][]) {
    const y = b.y(x, z);
    b.box(x, y, z, 2.2, 0.5, 0.7, STONE_DARK, { yaw: ry });
  }
  // The Sanctum's stores by the flight yard.
  for (const [x, z, k] of [[19.4, -15.8, 'crate'], [20.5, -16.6, 'barrel'], [18.6, -16.9, 'basket'], [20.2, -15.0, 'crate']] as [number, number, 'crate' | 'barrel' | 'basket'][]) {
    b.breakable(x, z, k, { y: b.col.terrainAt(x, z) });
  }
  // Training grounds: practice gear and straw targets past the east edge.
  b.breakable(56.8, -2.4, 'crate');
  b.breakable(56.8, -2.4, 'crate');
  b.breakable(57.4, -1.0, 'barrel');
  b.breakable(56.9, 10.4, 'barrel');
  b.breakable(57.5, 9.2, 'crate');
  for (const [x, z] of [[56.2, -4.8], [56.4, 12.8]] as [number, number][]) {
    const y = b.y(x, z);
    stick(b, M.wood(), x, y, z, 0.08, 1.6);
    b.decor.add(GEO.cyl(), M.straw(), x - 0.15, y + 1.55, z, 0.62, 0.24, 0.62, 0, 0, Math.PI / 2);
    b.decor.add(GEO.cyl(), M.banner(), x - 0.29, y + 1.55, z, 0.3, 0.04, 0.3, 0, 0, Math.PI / 2);
  }
}
