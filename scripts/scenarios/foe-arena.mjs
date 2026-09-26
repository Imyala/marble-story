// The new foes in the systems around them: an arena's waves (spawned with a poof, counted,
// cleared), gem drops, lock-on, elites, the Bestiary, and the Gloom Rift's later waves.

import { lab, LAB, step, place, invuln, clearFoes, me, shot } from './foe-lib.mjs';

export default async function (h) {
  await lab(h);
  await invuln(h);
  await place(h, LAB.x, LAB.z - 16, 0);
  // An arena on the lab floor with two waves of the Deep's foes.
  await h.eval(async ([L]) => {
    const g = window.wyrm;
    const { Builder } = await window.__mod('/src/world/level.ts');
    const b = new Builder(g, g.level);
    const s = (type, dx, dz, delay = 0) => ({ type, x: L.x + dx, z: L.z + dz, delay });
    window.__arena = b.arena('deep-test', L.x, L.z, 14, [
      [s('sporeling', -3, 2), s('sporeling', -1.5, 3), s('sporeling', 1.5, 3, 0.2), s('sporeling', 3, 2, 0.2), s('thornspitter', 0, 8)],
      [s('puffcap', -5, 5), s('rootstalker', 4, 3), s('rootstalker', 0, -4, 0.4)],
    ], 30);
  }, [LAB]);
  await place(h, LAB.x, LAB.z - 6, 0);
  await step(h, 0.5);
  const a1 = await h.eval(() => ({ state: window.__arena.state, foes: window.wyrm.enemies.filter((e) => e.alive).map((e) => [e.def.id, e.state]) }));
  h.check('stepping in starts the arena: wave 1 poofs in (spawn state)', a1.state === 'active' && a1.foes.length === 5 && a1.foes.some(([, st]) => st === 'spawn'), JSON.stringify(a1));
  await step(h, 1.5);
  await shot(h, 'foe-arena-wave1');
  // Lock-on finds them.
  const lock = await h.eval(() => { const t = window.wyrm.player.findTarget(22, true); return t ? t.def?.id ?? '?' : null; });
  h.check('lock-on picks up the new foes', !!lock, `${lock}`);
  // Kill wave 1 (plain blows: the sporelings leave clouds; fire would not).
  const gems0 = await h.eval(() => window.wyrm.save.gems);
  await h.eval(() => {
    const g = window.wyrm;
    for (const e of [...g.enemies]) if (e.alive) e.takeHit({ damage: 999, type: 'fire', dirX: 0, dirZ: 1, knockback: 2, launch: 0, stagger: 10, hitstop: 0, buildup: 0, heavy: true, spike: false, source: 'melee', move: 'horn3', fromPlayer: true, ox: g.player.x, oz: g.player.z });
  });
  await step(h, 2.5);
  const a2 = await h.eval(() => ({ state: window.__arena.state, foes: window.wyrm.enemies.filter((e) => e.alive).map((e) => e.def.id) }));
  h.check('with wave 1 down, wave 2 comes (puffcap and rootstalkers)', a2.state === 'active' && a2.foes.includes('puffcap') && a2.foes.filter((f) => f === 'rootstalker').length === 2, JSON.stringify(a2));
  await step(h, 2);
  await shot(h, 'foe-arena-wave2');
  await h.eval(() => {
    const g = window.wyrm;
    for (const e of [...g.enemies]) if (e.alive) e.takeHit({ damage: 999, type: 'earth', dirX: 0, dirZ: 1, knockback: 2, launch: 0, stagger: 10, hitstop: 0, buildup: 0, heavy: true, spike: false, source: 'melee', move: 'tail2', fromPlayer: true, ox: g.player.x, oz: g.player.z });
  });
  // Whatever the puffcap grew withers with it; whatever dug in comes up.
  await step(h, 4);
  const a3 = await h.eval(() => ({ state: window.__arena.state, foes: window.wyrm.enemies.filter((e) => e.alive).map((e) => e.def.id), gems: window.wyrm.save.gems }));
  h.check('the arena clears when its foes fall', a3.state === 'cleared' && a3.foes.length === 0, JSON.stringify(a3));
  h.check('they drop gems that get collected', a3.gems > gems0, `${gems0} -> ${a3.gems}`);
  const seen = await h.eval(() => ['sporeling', 'puffcap', 'rootstalker', 'thornspitter'].map((id) => !!window.wyrm.save.found[`seen:${id}`]));
  h.check('each gets a Bestiary page when first met', seen.every(Boolean), JSON.stringify(seen));
  await clearFoes(h);

  // Elites: gold-lit, tougher, still working.
  const el = await h.eval(() => {
    const g = window.wyrm;
    const out = [];
    let i = 0;
    for (const id of ['sporeling', 'puffcap', 'rootstalker', 'thornspitter']) {
      const x = -4.5 + i++ * 3;
      const e = g.spawnEnemy(id, x, g.col.groundAt(x, 236, 1e4, 0.3).y + 0.05, 236, Math.PI, false);
      e.makeElite();
      e.aggro = true;
      out.push(e);
    }
    window.__elites = out;
    return out.map((e) => [e.def.id, e.elite, e.maxHp > e.def.hp]);
  });
  await step(h, 6);
  const ok = await h.eval(() => window.__elites.every((e) => e.alive && Number.isFinite(e.x) && Number.isFinite(e.y)));
  h.check('elite versions spawn and fight without trouble', el.every(([, e, hp]) => e && hp) && ok, JSON.stringify(el));
  await shot(h, 'foe-arena-elites');
  await clearFoes(h);

  // The Gloom Rift's later waves bring them in.
  const rift = await h.eval(async () => {
    const { riftWave } = await window.__mod('/src/levels/trials.ts');
    let s = 11;
    const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const early = [];
    const late = new Set();
    for (let n = 1; n <= 11; n++) for (const w of riftWave(n, rand)) early.push(w.type);
    for (let n = 12; n <= 30; n++) for (const w of riftWave(n, rand)) late.add(w.type);
    return { early: early.filter((t) => ['sporeling', 'puffcap', 'rootstalker', 'thornspitter'].includes(t)), late: [...late].filter((t) => ['sporeling', 'puffcap', 'rootstalker', 'thornspitter'].includes(t)) };
  });
  h.check('the Rift keeps them out of its early waves and sends them later', rift.early.length === 0 && rift.late.length >= 3, JSON.stringify(rift));
  const s = await me(h);
  h.check('Aster fine', s.alive, JSON.stringify(s));
}
