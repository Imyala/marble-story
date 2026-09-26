// Shared helpers for the mycora-* scenarios: Mycora's grove built on the Deep Lab's floor (see foe-lib).

import { lab, LAB, step, shot, place } from './foe-lib.mjs';

export { LAB, step, shot, place };

/**
 * Loads the lab, builds Mycora's grove at its centre and spawns her there
 * (asleep unless `awake`). The realm is not needed: this is what its
 * bossFight() does, minus the barrier and the conversation.
 */
export async function grove(h, o = {}) {
  await lab(h, { nyxa: o.nyxa ?? false, seed: o.seed ?? 5, slamWave: o.slamWave });
  await h.eval(async ([L, awake]) => {
    const g = window.wyrm;
    const { buildMycoraArena, Mycora } = await window.__mod('/src/enemies/bosses/mycora.ts');
    const { Builder } = await window.__mod('/src/world/level.ts');
    window.__Mycora = Mycora;
    buildMycoraArena(new Builder(g, g.level), L.x, L.z, 24);
    window.__spawnBoss = () => {
      const y = g.col.groundAt(L.x, L.z, 1e4, 0.3).y;
      const boss = new Mycora(g, L.x, y, L.z, Math.PI);
      g.addBoss(boss);
      window.__boss = boss;
      return boss;
    };
    const boss = window.__spawnBoss();
    boss.awake = awake;
  }, [LAB, o.awake ?? false]);
  await place(h, LAB.x, LAB.z - 14, 0);
}

/** A snapshot of the boss. */
export const boss = (h) => h.eval(() => {
  const b = window.__boss;
  const g = window.wyrm;
  return {
    alive: b.alive, hp: Math.round(b.hp), max: b.maxHp, frac: +(b.hp / b.maxHp).toFixed(3), phase: b.phase, mode: b.mode, st: b.state, awake: b.awake,
    x: +b.x.toFixed(1), y: +b.y.toFixed(1), z: +b.z.toFixed(1), stats: { ...b.stats },
    sacs: b.sacs.filter((s) => s.alive).length, brood: g.enemies.filter((e) => e.alive && e.def.id === 'sporeling').length,
    puffs: g.enemies.filter((e) => e.alive && e.def.id === 'puffcap').length, isBoss: g.boss === b,
    caps: b.grove.caps.filter((c) => c.awake).length,
  };
});

/** Runs `sec` of game time in small steps, calling `each` (in the page) between them. */
export async function run(h, sec, dt = 0.1) {
  for (let t = 0; t < sec; t += dt) await step(h, dt);
}

/** Watches for the moment the boss enters mode `m` (up to `sec` of game time). */
export async function until(h, pred, sec = 20, dt = 0.1) {
  for (let t = 0; t < sec; t += dt) {
    if (await h.eval(pred)) return true;
    await step(h, dt);
  }
  return h.eval(pred);
}

/** A cinematic look at the grove from (x, y, z) toward (lx, ly, lz), world units relative to the grove centre. */
export async function view(h, x, y, z, lx, ly, lz, settle = 1.2) {
  await h.eval(([L, x, y, z, lx, ly, lz]) => {
    const g = window.wyrm;
    const pos = g.camera.position.clone().set(L.x + x, y, L.z + z);
    g.cam.setShot(pos, pos.clone().set(L.x + lx, ly, L.z + lz));
  }, [LAB, x, y, z, lx, ly, lz]);
  await step(h, settle);
}

export const unview = (h) => h.eval(() => window.wyrm.cam.clearShot());
