// Shared helpers for the foe-* and mycora-* scenarios (the Mycelium Deep's foes and its boss).
//
// Nothing here needs the realm itself: `lab` registers a small test level at
// runtime (a flat cave floor ringed by rock, lit like the Hollow Gate, with a
// few glowing groves) and loads it with an Act II save. Like hollow-lib, the
// game is detached from requestAnimationFrame and stepped at a fixed 1/30 s,
// rendering only for screenshots, so fights time the same on any machine.

import { act2Save, useSave, fastMode, step, skip, place, press, down, up, stick, stop, face, shot } from './hollow-lib.mjs';

export { step, skip, place, press, down, up, stick, stop, face, shot };

/** The lab floor's centre: the same spot as Mycora's grove in the real realm. */
export const LAB = { x: 0, z: 230, r: 34 };

/**
 * Loads the Deep Lab with an Act II save (every element, a few upgrades
 * bought), in fixed-step mode. `nyxa` false keeps the partner out of it.
 */
export async function lab(h, o = {}) {
  const save = act2Save({ 'story:hollow:arrive': true, 'tip:swim': true, ...(o.found ?? {}) });
  save.upgrades = { ...save.upgrades, hornPower: 1, tailSpin: 1, dragonTime: 1, slamWave: o.slamWave ? 1 : 0 };
  save.level = 'hollow';
  await useSave(h, save);
  await h.go(`?level=hollow&seed=${o.seed ?? 5}&quality=low&maxdt=0.1`, 2500);
  await fastMode(h);
  await step(h, 0.2);
  await skip(h);
  await h.eval(async ([L, nyxa]) => {
    const g = window.wyrm;
    // The dev server stamps edited modules (?t=...): import the very module instances the game runs on.
    window.__mod = (path) => {
      const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.split('?')[0].endsWith(path));
      return import(url ?? path);
    };
    const { LEVELS } = await window.__mod('/src/levels/index.ts');
    const kits = await window.__mod('/src/world/kits.ts');
    if (!LEVELS.deeplab) {
      LEVELS.deeplab = {
        id: 'deeplab', name: 'The Deep Lab', subtitle: 'A test floor for the Mycelium Deep', music: 'hollow', killY: -30,
        spawn: [L.x, L.z - 20, 0],
        sky: {
          top: 0x070812, horizon: 0x12303a, bottom: 0x060a0e, sunDir: [0.08, 0.9, 0.45], sunColor: 0xb8c8ff, sunIntensity: 1.35,
          hemiSky: 0x8070c0, hemiGround: 0x2a9a90, hemiIntensity: 2.1, fogNear: 30, fogFar: 150, stars: 0, fog: 0x12303a, clouds: 0,
        },
        terrain: {
          x0: L.x - 70, z0: L.z - 70, sizeX: 140, sizeZ: 140, cell: 1.5,
          shape: (s) => {
            s.base(26).noise(3, 0.05, 4);
            s.flatten(L.x, L.z, L.r, 0, 10);
          },
          color: (x, z, h, slope) => {
            const n = Math.sin(x * 0.21 + z * 0.13) * 0.5 + Math.sin(x * 0.05 - z * 0.09) * 0.5;
            if (slope > 0.7) return 0x3a3448;
            return n > 0.2 ? 0x24333a : 0x2a2a3c;
          },
        },
        build: (b) => {
          kits.fungalGrove(b, L.x - 26, L.z + 18, 7, { count: 2, small: 10 });
          kits.fungalGrove(b, L.x + 27, L.z - 12, 7, { count: 2, small: 10 });
          kits.fungalGrove(b, L.x + 20, L.z + 26, 6, { count: 1, small: 8 });
          kits.crystalCluster(b, L.x - 24, L.z - 22, 1.2, 0x6ab8ff);
          kits.lanternPost(b, L.x - 6, L.z - 24);
          kits.lanternPost(b, L.x + 6, L.z - 24);
        },
      };
    }
    g.options.partner = nyxa;
    g.loadLevel('deeplab', {});
  }, [LAB, o.nyxa ?? false]);
  await step(h, 0.3);
  await skip(h);
  await h.eval(() => {
    const g = window.wyrm;
    if (g.state === 'pause') g.resume();
    g.input.wantPointerLock = false;
    g.player.element = 'fire';
    // Page errors and anything thrown inside a step are collected here.
    window.__errs = [];
  });
}

/** Spawns a foe of `type` at (x, z) facing yaw; returns its index in window.__foes. */
export async function spawn(h, type, x, z, yaw = Math.PI, o = {}) {
  return h.eval(([type, x, z, yaw, o]) => {
    const g = window.wyrm;
    const y = g.col.groundAt(x, z, 1e4, 0.3).y;
    const e = g.spawnEnemy(type, x, y + 0.05, z, yaw, !!o.arena);
    if (o.aggro) e.aggro = true;
    if (o.hp) e.hp = e.maxHp = o.hp;
    if (o.noElite && e.elite) { e.elite = false; e.eliteDmg = 1; e.hp = e.maxHp = e.def.hp; e.model.root.scale.setScalar(1); }
    window.__foes = window.__foes ?? [];
    window.__foes.push(e);
    return window.__foes.length - 1;
  }, [type, x, z, yaw, o]);
}

/** A snapshot of foe `i`. */
export const foe = (h, i) => h.eval((i) => {
  const e = window.__foes[i];
  return {
    alive: e.alive, hp: +e.hp.toFixed(1), max: e.maxHp, st: e.state, mode: e.mode ?? null, x: +e.x.toFixed(2), y: +e.y.toFixed(2), z: +e.z.toFixed(2),
    atk: e.attack?.id ?? null, flipped: +e.flipped.toFixed(2), vis: e.model.root.visible, burn: +e.status.burn.toFixed(2), frozen: +e.status.frozen.toFixed(2),
    shock: +e.status.shock.toFixed(2), aggro: e.aggro, lastHitBy: e.lastHitBy,
  };
}, i);

/** Aster's state. */
export const me = (h) => h.eval(() => {
  const g = window.wyrm;
  const p = g.player;
  return { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), hp: +p.hp.toFixed(1), max: p.maxHp, st: p.state, alive: p.alive, state: g.state };
});

/** Counts the level's live spore clouds and blight patches. */
export const spores = (h) => h.eval(() => {
  const lv = window.wyrm.level;
  const hs = lv.hittables.filter((x) => x.alive && !x.isEnemy);
  return { clouds: hs.filter((x) => x.constructor.name === 'SporeCloud').length, patches: hs.filter((x) => x.constructor.name === 'BlightPatch').length };
});

/** Records every hit foe `i` takes in window.__hits[i] as [move, type, result, damage]. */
export async function watchHits(h, i) {
  await h.eval((i) => {
    const e = window.__foes[i];
    window.__hits = window.__hits ?? {};
    window.__hits[i] = [];
    const orig = e.takeHit.bind(e);
    e.takeHit = (hit) => {
      const hp0 = e.hp;
      const r = orig(hit);
      window.__hits[i].push([hit.move, hit.type, r, +(hp0 - e.hp).toFixed(1)]);
      return r;
    };
  }, i);
}

export const hits = (h, i) => h.eval((i) => window.__hits[i], i);

/** Deals a hit to foe `i` from Aster's side (the way her attacks do). */
export const strike = (h, i, o) => h.eval(([i, o]) => {
  const g = window.wyrm;
  const e = window.__foes[i];
  const p = g.player;
  const dx = e.x - p.x;
  const dz = e.z - p.z;
  const n = Math.hypot(dx, dz) || 1;
  const hit = {
    damage: 10, type: 'physical', dirX: dx / n, dirZ: dz / n, knockback: 3, launch: 0, stagger: 12, hitstop: 0, buildup: 0,
    heavy: false, spike: false, source: 'melee', move: 'horn1', fromPlayer: true, ox: p.x, oz: p.z, ...o,
  };
  const hp0 = e.hp;
  const r = e.takeHit(hit);
  return { r, dmg: +(hp0 - e.hp).toFixed(1) };
}, [i, o]);

/** Kills every foe in the level (without clouds: they simply vanish). */
export const clearFoes = (h) => h.eval(() => {
  const g = window.wyrm;
  for (const e of g.enemies) if (!e.isBoss) { e.alive = false; e.state = 'dead'; e.deadT = 9; }
  window.__foes = [];
});

/** Makes Aster unhurtable (or not). */
export const invuln = (h, on = true) => h.eval((on) => { window.wyrm.player.invuln = on; }, on);

/** Points Aster (and the camera) at world point (x, z). */
export const aim = (h, x, z, pitch = 0.3) => h.eval(([x, z, pitch]) => {
  const g = window.wyrm;
  const p = g.player;
  const yaw = Math.atan2(x - p.x, z - p.z);
  p.yaw = yaw;
  g.cam.yaw = yaw;
  g.cam.pitch = pitch;
}, [x, z, pitch]);

/** Holds an action down for `sec` of game time, then lets go. */
export async function hold(h, action, sec) {
  await down(h, action);
  await step(h, sec);
  await up(h, action);
  await step(h, 1 / 30);
}

/** Selects an element (1 fire, 2 lightning, 3 ice, 4 earth). */
export const element = (h, el) => h.eval((el) => { window.wyrm.player.element = el; window.wyrm.player.mana = window.wyrm.player.maxMana; }, el);
