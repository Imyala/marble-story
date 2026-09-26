// The Rootspawn: rootstalkers (burrow, a ring, erupt; flipped by Earth or a Ground Pound on
// their trail, driven up by Fire) and thornspitters (volleys with wind-ups; pull in when Aster
// is close, come back up with a ring, then hang dazed; a thorn batted back dazes them too).

import { lab, LAB, spawn, foe, step, place, invuln, aim, clearFoes, me, strike, watchHits, hits, element, hold, press, shot } from './foe-lib.mjs';

/** Steps until foe i's mode is `m` (or `sec` runs out); returns the snapshot. */
async function untilMode(h, i, m, sec = 10) {
  for (let t = 0; t < sec; t += 1 / 15) {
    const f = await foe(h, i);
    if (f.mode === m || !f.alive) return f;
    await step(h, 1 / 15);
  }
  return foe(h, i);
}

/** Aster jumps and slams down (a Ground Pound: jump, then Tail in the air). */
async function pound(h) {
  await press(h, 'jump', 0.12);
  await step(h, 0.25);
  await press(h, 'tail', 0.08);
  await step(h, 0.7);
}

export default async function (h) {
  await lab(h);
  await step(h, 0.5);

  // --- Rootstalker: dig, ring, erupt --------------------------------------------------------
  await place(h, LAB.x, LAB.z - 9, 0);
  const a = await spawn(h, 'rootstalker', LAB.x, LAB.z + 3, Math.PI, { aggro: true, noElite: true });
  await h.eval(() => { const e = window.__foes[0]; e.burrowCd = 0.5; });
  let f = await untilMode(h, a, 'tunnel', 8);
  h.check('a rootstalker dives underground (model hidden, a ripple instead)', f.mode === 'tunnel' && !f.vis, JSON.stringify(f));
  await shot(h, 'foe-root-tunnel');
  f = await untilMode(h, a, 'mark', 6);
  const mk = await h.eval(() => { const e = window.__foes[0]; return { dur: e.markDur, x: e.markX, z: e.markZ }; });
  const at = await me(h);
  h.check('it marks where it will come up with a ring, a beat (>= 0.55 s) before', f.mode === 'mark' && mk.dur >= 0.55 && Math.hypot(mk.x - at.x, mk.z - at.z) < 2, JSON.stringify({ f, mk, at }));
  await shot(h, 'foe-root-mark');
  // Aster stands still in the ring: it erupts under her.
  const hp0 = (await me(h)).hp;
  f = await untilMode(h, a, 'stalk', 3);
  const hp1 = (await me(h)).hp;
  h.check('standing in the ring gets Aster hit by the eruption', hp1 < hp0, `${hp0} -> ${hp1}`);
  // Next time, she steps out of the ring as soon as it shows: no hit.
  await h.eval(() => { const g = window.wyrm; g.player.hp = g.player.maxHp; g.player.iframes = 0; const e = window.__foes[0]; e.burrowCd = 0; e.globalCd = 0; });
  await step(h, 1.2);
  f = await untilMode(h, a, 'mark', 10);
  const hp2 = (await me(h)).hp;
  await h.eval(() => { const g = window.wyrm; const e = window.__foes[0]; const p = g.player; const dx = p.x - e.markX || 0.01; const dz = p.z - e.markZ; const n = Math.hypot(dx, dz) || 1; g.input.forceMove = null; p.place(e.markX + (dx / n) * 3.6, p.y, e.markZ + (dz / n) * 3.6, p.yaw); });
  f = await untilMode(h, a, 'stalk', 3);
  const hp3 = (await me(h)).hp;
  h.check('stepping out of the ring in time avoids the eruption', f.mode === 'stalk' && hp3 === hp2, `${hp2} -> ${hp3}`);
  await shot(h, 'foe-root-erupt');
  await invuln(h);

  // Surfaced, its thorny back turns light blows; heavy ones get through; Earth flips it.
  await h.eval(() => { const e = window.__foes[0]; e.globalCd = 99; e.burrowCd = 99; e.aggro = false; });
  const light = await strike(h, a, { damage: 10 });
  const heavy = await strike(h, a, { damage: 10, heavy: true, move: 'tail2' });
  h.check('light blows glance off its back (about a third gets through)', light.dmg > 0 && light.dmg < 4 && heavy.dmg >= 9.5, JSON.stringify({ light, heavy }));
  const earth = await strike(h, a, { damage: 10, type: 'earth', source: 'breath', move: 'quakeBreath' });
  f = await foe(h, a);
  h.check('Earth flips it onto its back', f.flipped > 0 && f.st === 'down', JSON.stringify({ earth, f }));
  const belly = await strike(h, a, { damage: 10 });
  h.check('belly up, it takes double', belly.dmg >= 19, JSON.stringify(belly));
  await shot(h, 'foe-root-flipped');
  await clearFoes(h);
  await step(h, 0.5);

  // A Ground Pound (real inputs) beside its trail shakes it out, flipped.
  await place(h, LAB.x, LAB.z - 9, 0);
  const b = await spawn(h, 'rootstalker', LAB.x, LAB.z + 5, Math.PI, { aggro: true, noElite: true });
  await h.eval(() => { const e = window.__foes[0]; e.burrowCd = 0; });
  f = await untilMode(h, b, 'tunnel', 8);
  await step(h, 0.4);
  // Beside the ripple, and pound.
  await h.eval(() => { const g = window.wyrm; const e = window.__foes[0]; g.player.place(e.x + 1.8, e.y + 0.05, e.z, -Math.PI / 2); });
  await pound(h);
  f = await foe(h, b);
  const pops = await h.eval(() => window.__foes[0].pops);
  h.check('a Ground Pound on its trail forces it up, flipped', f.mode !== 'tunnel' && f.mode !== 'mark' && f.flipped > 0 && pops >= 1, JSON.stringify({ f, pops }));
  await clearFoes(h);

  // Fire on the ripple drives it up in a panic (not flipped). Real fire breath.
  await place(h, LAB.x, LAB.z - 9, 0);
  const c = await spawn(h, 'rootstalker', LAB.x, LAB.z + 5, Math.PI, { aggro: true, noElite: true });
  await h.eval(() => { const e = window.__foes[0]; e.burrowCd = 0; });
  f = await untilMode(h, c, 'tunnel', 8);
  await h.eval(() => { const g = window.wyrm; const e = window.__foes[0]; g.player.place(e.x, e.y + 0.05, e.z - 3.2, 0); g.player.yaw = 0; g.player.mana = g.player.maxMana; e.modeT = 0; });
  await element(h, 'fire');
  await hold(h, 'breath', 0.5);
  f = await foe(h, c);
  h.check('Fire on its ripple drives it up in a panic', f.mode === 'panic' && f.flipped === 0 && f.vis, JSON.stringify(f));
  await clearFoes(h);

  // Earth breath on the ripple (real inputs) flips it out.
  await place(h, LAB.x, LAB.z - 9, 0);
  const d = await spawn(h, 'rootstalker', LAB.x, LAB.z + 5, Math.PI, { aggro: true, noElite: true });
  await h.eval(() => { const e = window.__foes[0]; e.burrowCd = 0; });
  f = await untilMode(h, d, 'tunnel', 8);
  await h.eval(() => { const g = window.wyrm; const e = window.__foes[0]; g.player.place(e.x, e.y + 0.05, e.z - 2.6, 0); g.player.yaw = 0; g.player.mana = g.player.maxMana; e.modeT = 0; });
  await element(h, 'earth');
  await hold(h, 'breath', 0.5);
  f = await foe(h, d);
  h.check('Earth breath on its ripple flips it out', f.flipped > 0 && f.vis, JSON.stringify(f));
  await clearFoes(h);

  // --- Thornspitter --------------------------------------------------------------------------
  await invuln(h, false);
  await h.eval(() => { const p = window.wyrm.player; p.hp = p.maxHp; });
  await place(h, LAB.x, LAB.z - 10, 0);
  const t = await spawn(h, 'thornspitter', LAB.x, LAB.z, Math.PI, { aggro: true, noElite: true });
  // Volleys, each wound up first.
  const seen = await h.eval(() => {
    const e = window.__foes[0];
    const out = [];
    let w = -1;
    let time = 0;
    let thorns = 0;
    for (let k = 0; k < 8 * 30; k++) {
      window.__step(1 / 30, 1 / 30);
      time += 1 / 30;
      if (e.state === 'windup' && w < 0) w = time;
      if (e.state === 'active' && w >= 0) { out.push([e.attack?.id, +(time - w).toFixed(2)]); w = -1; }
      thorns = Math.max(thorns, window.wyrm.projectiles.filter((p) => p.alive && !p.spec.fromPlayer).length);
    }
    return { out, thorns };
  });
  const s1 = await me(h);
  h.check('a thornspitter fires fans and bursts, each wound up (>= 0.7 s)', seen.out.length >= 2 && seen.out.every(([, w]) => w >= 0.7) && seen.thorns >= 3, JSON.stringify(seen));
  h.check('its thorns hurt', s1.hp < s1.max, JSON.stringify(s1));
  await invuln(h);
  // Close in: it pulls itself down (untouchable), comes back up with a ring, then hangs dazed.
  await h.eval(() => { for (const p of window.wyrm.projectiles) p.kill(); });
  await place(h, LAB.x, LAB.z - 2.2, 0);
  f = await untilMode(h, t, 'hidden', 3);
  const im = await strike(h, t, { damage: 20, heavy: true });
  h.check('close in, it pulls itself under and shrugs off blows', f.mode === 'hidden' && !f.vis && im.r === 'immune' && im.dmg === 0, JSON.stringify({ f, im }));
  await shot(h, 'foe-spitter-hidden');
  f = await untilMode(h, t, 'rise', 4);
  const riseDur = await h.eval(() => window.__foes[0].hideFor);
  h.check('a ring warns (>= 0.55 s) before it bursts back up', f.mode === 'rise' && riseDur >= 0.55, JSON.stringify({ f, riseDur }));
  await shot(h, 'foe-spitter-rise');
  f = await untilMode(h, t, 'dazed', 3);
  const hz = await strike(h, t, { damage: 10 });
  h.check('back up, it hangs dazed and takes extra', f.mode === 'dazed' && hz.dmg >= 14, JSON.stringify({ f, hz }));
  await shot(h, 'foe-spitter-dazed');
  // Burning, it cannot pull itself in.
  await h.eval(() => { const e = window.__foes[0]; e.mode = 'up'; e.modeT = 0; e.model.dazed = false; e.retractCd = 0; e.status.burn = 4; e.hp = e.maxHp; });
  await step(h, 1);
  f = await foe(h, t);
  h.check('burning vines cannot hide', f.mode === 'up', JSON.stringify(f));
  await h.eval(() => { window.__foes[0].status.burn = 0; });
  const fireD = await strike(h, t, { damage: 10, type: 'fire' });
  h.check('Fire burns it well', fireD.dmg >= 15, JSON.stringify(fireD));
  await clearFoes(h);
  await step(h, 0.5);

  // A thorn batted back with the Horn (real input, timed on the thorn's approach) dazes it.
  await place(h, LAB.x, LAB.z - 7, 0);
  const u = await spawn(h, 'thornspitter', LAB.x, LAB.z, Math.PI, { aggro: true, noElite: true });
  await watchHits(h, u);
  let reflected = false;
  for (let k = 0; k < 400 && !reflected; k++) {
    const near = await h.eval(() => {
      const g = window.wyrm;
      const p = g.player;
      return g.projectiles.some((q) => q.alive && !q.spec.fromPlayer && Math.hypot(q.x - p.x, q.z - p.z) < 2.6);
    });
    if (near) {
      await aim(h, LAB.x, LAB.z);
      await press(h, 'horn', 1 / 30);
      await step(h, 0.1);
    } else await step(h, 1 / 30);
    reflected = await h.eval(() => window.wyrm.projectiles.some((q) => q.alive && q.reflected));
  }
  await step(h, 1);
  const hr = await hits(h, u);
  f = await foe(h, u);
  h.check('a thorn batted back with the Horn stings it and dazes it', reflected && hr.some(([m]) => m === 'reflected') && (f.mode === 'dazed' || !f.alive), JSON.stringify({ reflected, hr, f }));
  await clearFoes(h);
  const s = await me(h);
  h.check('Aster fine at the end', s.alive, JSON.stringify(s));
}

/** Nyxa fights the Rootspawn: her blows land on a surfaced rootstalker and a thornspitter. */
export async function nyxa(h) {
  await lab(h, { nyxa: true });
  await invuln(h);
  await place(h, LAB.x, LAB.z - 8, 0);
  await step(h, 5);
  const fight = async (type, x, z, setup) => {
    const i = await spawn(h, type, x, z, Math.PI, { aggro: true, noElite: true, hp: 400 });
    await h.eval(setup, i);
    await watchHits(h, i);
    for (let t = 0; t < 16; t += 0.5) {
      await step(h, 0.5);
      if (await h.eval((i) => window.__hits[i].some(([m, , r, d]) => m.startsWith('nyxa:') && r === 'hit' && d > 0), i)) break;
    }
    const out = await hits(h, i);
    await clearFoes(h);
    return out;
  };
  // Kept on the surface (no digging) so she can reach it.
  const hr = await fight('rootstalker', LAB.x + 2, LAB.z, (i) => { window.__foes[i].burrowCd = 999; });
  await step(h, 1);
  // Kept up (no hiding), as it would be after re-emerging.
  const ht = await fight('thornspitter', LAB.x - 2, LAB.z, (i) => { window.__foes[i].retractCd = 999; });
  h.check('Nyxa damages a rootstalker', hr.some(([m, , r, d]) => m.startsWith('nyxa:') && r === 'hit' && d > 0), JSON.stringify(hr.slice(0, 6)));
  h.check('Nyxa damages a thornspitter', ht.some(([m, , r, d]) => m.startsWith('nyxa:') && r === 'hit' && d > 0), JSON.stringify(ht.slice(0, 6)));
}
