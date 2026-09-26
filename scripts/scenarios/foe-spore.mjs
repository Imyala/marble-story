// The Spore family: sporelings (swarms that burst into spore clouds unless Fire or ice takes
// them) and puffcaps (spore bombs, a jumpable puff ring, regrowing sporelings). Real inputs
// for the breath and the swings; direct hits where only the rule is under test.

import { lab, LAB, spawn, foe, step, place, invuln, aim, clearFoes, me, spores, strike, watchHits, hits, element, hold, press, shot } from './foe-lib.mjs';

/** Watches foe i's state for `sec` and reports how long each windup lasted before it struck. */
async function windups(h, i, sec) {
  return h.eval(([i, sec]) => {
    const g = window.wyrm;
    const e = window.__foes[i];
    const out = [];
    let t = 0;
    let w = -1;
    for (let k = 0; k < sec * 30; k++) {
      window.__step(1 / 30, 1 / 30);
      t += 1 / 30;
      if (e.state === 'windup' && w < 0) w = t;
      if (e.state === 'active' && w >= 0) {
        out.push([e.attack?.id, +(t - w).toFixed(2)]);
        w = -1;
      }
      if (e.state !== 'windup' && e.state !== 'active') w = -1;
      if (!e.alive) break;
    }
    void g;
    return out;
  }, [i, sec]);
}

export default async function (h) {
  await lab(h);
  await step(h, 0.5);

  // --- Sporelings -------------------------------------------------------------------------
  // A swarm comes at Aster, each blow wound up for half a second or more.
  await place(h, LAB.x, LAB.z - 6, 0);
  for (let k = 0; k < 5; k++) await spawn(h, 'sporeling', LAB.x - 2 + k, LAB.z + 1, Math.PI, { aggro: true, noElite: true });
  const w = await windups(h, 0, 6);
  const s0 = await me(h);
  h.check('a sporeling swarm attacks, each blow telegraphed >= 0.45 s', w.length > 0 && w.every(([, t]) => t >= 0.45), JSON.stringify({ w, hp: s0.hp }));
  h.check('the swarm hurts Aster (fair: not all at once)', s0.hp < s0.max && s0.hp > s0.max * 0.4, JSON.stringify(s0));
  await shot(h, 'foe-spore-swarm');
  await clearFoes(h);
  await invuln(h);

  // Killed by a plain blow: a lingering cloud; Aster standing in it is stung, lightly.
  await place(h, LAB.x, LAB.z, 0);
  const a = await spawn(h, 'sporeling', LAB.x, LAB.z + 1.5, Math.PI, { noElite: true });
  await step(h, 0.8);
  let r = await strike(h, a, { damage: 60, type: 'physical' });
  await step(h, 0.1);
  let sp = await spores(h);
  h.check('a sporeling killed by a plain blow bursts into a spore cloud', r.r === 'killed' && sp.clouds === 1, JSON.stringify({ r, sp }));
  await invuln(h, false);
  await h.eval(() => { const g = window.wyrm; const c = g.level.hittables.find((x) => x.alive && x.constructor.name === 'SporeCloud'); g.player.place(c.x, c.y + 0.05, c.z, 0); g.player.hp = 30; });
  await step(h, 2.4);
  let s = await me(h);
  h.check('the cloud stings (a little: about 3 a second) while Aster stands in it', s.hp < 30 && s.hp >= 21, JSON.stringify(s));
  await h.eval(() => { window.wyrm.player.hp = 1.5; });
  await step(h, 1.5);
  s = await me(h);
  h.check('spores alone never finish Aster off', s.alive && s.hp >= 1, JSON.stringify(s));
  await step(h, 1.5);
  sp = await spores(h);
  h.check('the cloud clears after a few seconds', sp.clouds === 0, JSON.stringify(sp));
  await h.eval(() => { window.wyrm.player.hp = window.wyrm.player.maxHp; });
  await invuln(h);

  // Killed by Fire: no cloud. Real fire breath from Aster.
  await place(h, LAB.x, LAB.z, 0);
  const b = await spawn(h, 'sporeling', LAB.x, LAB.z + 2.6, Math.PI, { noElite: true });
  await watchHits(h, b);
  await step(h, 0.8);
  await h.eval(() => { const e = window.__foes[1]; e.aggro = false; e.globalCd = 99; });
  await element(h, 'fire');
  await aim(h, LAB.x, LAB.z + 2.6);
  await hold(h, 'breath', 2.2);
  await step(h, 2.5);
  let f = await foe(h, b);
  sp = await spores(h);
  const hb = await hits(h, b);
  h.check('fire breath kills a sporeling without a cloud (the spores burn)', !f.alive && sp.clouds === 0 && hb.some(([m, t]) => t === 'fire'), JSON.stringify({ f, sp, n: hb.length }));

  // Frozen, then shattered: no cloud either.
  const c = await spawn(h, 'sporeling', LAB.x + 1, LAB.z + 2, Math.PI, { noElite: true });
  await step(h, 0.8);
  await strike(h, c, { damage: 2, type: 'ice', buildup: 300 });
  f = await foe(h, c);
  r = await strike(h, c, { damage: 30, heavy: true, move: 'tail2' });
  await step(h, 0.1);
  sp = await spores(h);
  h.check('a frozen sporeling shatters clean, no cloud', f.frozen > 0 && r.r === 'killed' && sp.clouds === 0, JSON.stringify({ f, r, sp }));

  // A cloud already hanging there burns away in Fire (and singes foes in it).
  const d = await spawn(h, 'sporeling', LAB.x, LAB.z + 3, Math.PI, { noElite: true });
  await step(h, 0.8);
  await strike(h, d, { damage: 60 });
  await step(h, 0.1);
  const sp1 = await spores(h);
  await place(h, LAB.x, LAB.z - 0.5, 0);
  await aim(h, LAB.x, LAB.z + 3);
  await hold(h, 'breath', 0.6);
  await step(h, 0.2);
  const sp2 = await spores(h);
  h.check('fire breath burns a hanging cloud away', sp1.clouds === 1 && sp2.clouds === 0, JSON.stringify({ sp1, sp2 }));
  await clearFoes(h);

  // --- Puffcaps ---------------------------------------------------------------------------------
  await h.eval(() => { const p = window.wyrm.player; p.mana = p.maxMana; });
  await place(h, LAB.x, LAB.z - 11, 0);
  const pc = await spawn(h, 'puffcap', LAB.x, LAB.z, Math.PI, { aggro: true, noElite: true });
  await invuln(h, false);
  // From range it lobs spore bombs (a red ring where each lands), leaving clouds.
  let lobbed = false;
  let cloudSeen = false;
  for (let t = 0; t < 8; t += 0.1) {
    await step(h, 0.1);
    const q = await h.eval(() => ({ bombs: window.wyrm.projectiles.filter((p) => p.alive && !p.spec.fromPlayer && p.spec.gravity > 0).length }));
    if (q.bombs > 0) lobbed = true;
    if ((await spores(h)).clouds > 0) cloudSeen = true;
    if (lobbed && cloudSeen) break;
  }
  h.check('a puffcap lobs spore bombs from range, leaving spore clouds', lobbed && cloudSeen, JSON.stringify({ lobbed, cloudSeen }));
  await shot(h, 'foe-puffcap-lob');
  // Up close it puffs a ring (a shockwave, wound up first).
  await h.eval(() => { const g = window.wyrm; g.player.hp = g.player.maxHp; for (const p of g.projectiles) p.kill(); });
  await place(h, LAB.x, LAB.z - 3.2, 0);
  const pw = await windups(h, pc, 5);
  const waves = await h.eval(() => window.wyrm.shockwaves.length);
  h.check('close in, it winds up (>= 0.8 s) and puffs a ring', pw.some(([id, t]) => id === 'puff' && t >= 0.8), JSON.stringify({ pw, waves }));
  await invuln(h);
  // It grows sporelings every so often; kill it and they wither (no clouds).
  await h.eval(() => { const e = window.__foes[0]; e.growIn = 0; e.cooldowns.set('grow', 0); e.cooldowns.set('lob', 5); e.cooldowns.set('puff', 5); e.globalCd = 0; });
  await place(h, LAB.x, LAB.z - 9, 0);
  let grown = 0;
  for (let t = 0; t < 8 && grown === 0; t += 0.2) {
    await step(h, 0.2);
    grown = await h.eval(() => window.__foes[0].broodAlive);
  }
  await step(h, 1);
  h.check('a puffcap grows sporelings while it lives', grown >= 1, `${grown}`);
  await shot(h, 'foe-puffcap-grow');
  // Fire hurts it more than a plain blow; Lightning stops a windup.
  const fireD = await strike(h, pc, { damage: 10, type: 'fire' });
  const physD = await strike(h, pc, { damage: 10 });
  h.check('fire bites a puffcap harder', fireD.dmg > physD.dmg * 1.4, JSON.stringify({ fireD, physD }));
  await h.eval(() => { const e = window.__foes[0]; e.hp = e.maxHp; e.startAttack(e.def.attacks.find((a) => a.id === 'puff')); });
  await step(h, 0.3);
  await strike(h, pc, { damage: 4, type: 'lightning', buildup: 10, source: 'breath', move: 'arcBreath' });
  let pf = await foe(h, pc);
  h.check('lightning makes it drop its windup', pf.st === 'hitstun' && pf.atk === null, JSON.stringify(pf));
  const broodBefore = await h.eval(() => window.__foes[0].broodAlive);
  await strike(h, pc, { damage: 999, type: 'fire' });
  await step(h, 0.3);
  const after = await h.eval(() => ({ brood: window.wyrm.enemies.filter((e) => e.alive && e.def.id === 'sporeling').length }));
  sp = await spores(h);
  h.check('its brood withers when it falls (and leaves no clouds)', broodBefore >= 1 && after.brood === 0 && sp.clouds === 0, JSON.stringify({ broodBefore, after, sp }));
  await clearFoes(h);
  await step(h, 3.5);
  s = await me(h);
  h.check('Aster fine at the end', s.alive, JSON.stringify(s));
}

/** Nyxa fights the Spore family: her blows land on sporelings and puffcaps alike. */
export async function nyxa(h) {
  await lab(h, { nyxa: true });
  await invuln(h);
  await place(h, LAB.x, LAB.z - 8, 0);
  await step(h, 5);
  const present = await h.eval(() => window.wyrm.partner.present);
  // One at a time: she keeps to one target while it lasts.
  const fight = async (type, x, z) => {
    const i = await spawn(h, type, x, z, Math.PI, { aggro: true, noElite: true, hp: 400 });
    await watchHits(h, i);
    for (let t = 0; t < 14; t += 0.5) {
      await step(h, 0.5);
      if (await h.eval((i) => window.__hits[i].some(([m, , r]) => m.startsWith('nyxa:') && (r === 'hit' || r === 'killed')), i)) break;
    }
    const out = await hits(h, i);
    await clearFoes(h);
    return out;
  };
  const hp = await fight('puffcap', LAB.x + 2, LAB.z);
  await step(h, 1);
  const hs = await fight('sporeling', LAB.x - 2, LAB.z - 2);
  h.check('Nyxa is with Aster', present, `${present}`);
  h.check('Nyxa damages a puffcap', hp.some(([m, , r, d]) => m.startsWith('nyxa:') && r === 'hit' && d > 0), JSON.stringify(hp.slice(0, 6)));
  h.check('Nyxa damages a sporeling', hs.some(([m, , r, d]) => m.startsWith('nyxa:') && (r === 'hit' || r === 'killed') && d > 0), JSON.stringify(hs.slice(0, 6)));
  await shot(h, 'foe-spore-nyxa');
}
