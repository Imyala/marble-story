import * as THREE from 'three';
import type { LevelDef, Builder } from '../world/level';
import { ambient, paint, jitter, Cage } from './common';
import { EMBERHOLD, STORMCREST, FROSTFANG, STONEHIDE, NYXA } from '../game/story';
import type { Game } from '../game/game';
import { Water } from '../render/water';
import { DragonRig, defaultPose, type DragonLook } from '../player/dragonRig';
import { makeCyl } from '../world/collision';
import type { Line } from '../ui/dialogue';
import { trialGround } from './trials';

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
    b.climbWall(tx + 2.5, tz, Math.PI / 2, 3.6, ty, ty + 9, false);
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
    if (g.save.levelsDone.keep) b.npc('nyxa', NYXA, 14, 6, -Math.PI * 0.5, 'Talk to Nyxa', () => talkWarden(g, 'nyxa'));
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
    b.decor.lantern(lx, b.y(lx, lz), lz, 0xffe0a0);
  }
}

// --- scenery helpers ------------------------------------------------------------------------------

function statue(b: Builder, x: number, z: number, look: DragonLook, lit: boolean): void {
  const y = 0.25;
  b.box(x, y, z, 3, 1.2, 3, STONE_DARK, { trim: STONE });
  const stoneLook: DragonLook = { ...look, body: 0xa89e8a, belly: 0xb8ae9a, horn: lit ? look.body : 0x8a8272, membrane: 0x9a9080, spikes: 0x8a8272, eye: lit ? look.eye : 0x6a6458, scale: 1.3 };
  const rig = new DragonRig(stoneLook);
  const p = defaultPose();
  p.attack = 'roar';
  p.attackT = 0.5;
  for (let i = 0; i < 30; i++) rig.update(0.05, p);
  rig.root.position.set(x, y + 1.2, z);
  rig.root.rotation.y = Math.atan2(-x, -z);
  rig.root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  b.level.root.add(rig.root);
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
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), new THREE.MeshStandardMaterial({ color: 0x6a6070, roughness: 0.4 }));
  m.scale.set(1, 1.3, 1);
  m.position.set(x, y + 0.6, z);
  m.castShadow = true;
  b.level.root.add(m);
  const nest = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.18, 6, 14), new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 1 }));
  nest.rotation.x = Math.PI / 2;
  nest.position.set(x, y + 0.15, z);
  b.level.root.add(nest);
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
