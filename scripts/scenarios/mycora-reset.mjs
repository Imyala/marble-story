// When Aster dies mid-fight the game despawns Mycora (the realm's bossFight re-arms its trigger):
// her brood, puffcaps, blight, telegraphs and sac targets must go with her, the bounce caps
// must sleep again, and a fresh Mycora must start from the top. Plus: Nyxa can hurt her.

import { grove, boss, step, place, until, LAB } from './mycora-lib.mjs';
import { spores, me } from './foe-lib.mjs';

export default async function (h) {
  await grove(h, { awake: true });
  await place(h, LAB.x, LAB.z - 10, 0);
  await h.eval(() => { window.wyrm.player.invuln = true; });
  // Let her call her brood, then push her into the canopy phase so everything is out.
  await h.eval(() => { const b = window.__boss; b.nextIn = 0; b.pattern = 2; b.callCd = 0; });
  await until(h, () => window.wyrm.enemies.some((e) => e.alive && e.def.id === 'sporeling'), 8);
  await h.eval(() => { const b = window.__boss; b.hp = b.maxHp * 0.6; b.settle(); b.setMode('idle'); });
  await until(h, () => window.__boss.mode === 'stalk', 6);
  await h.eval(() => { const b = window.__boss; b.settle(); b.setMode('stalk'); b.startBlight(); });
  await step(h, 3);
  await h.eval(() => { const b = window.__boss; b.hp = b.maxHp * 0.3; b.settle(); b.setMode('stalk'); });
  await until(h, () => window.__boss.mode === 'hang', 10);
  const before = await boss(h);
  const sp0 = await spores(h);
  const sacs0 = await h.eval(() => window.wyrm.level.hittables.filter((x) => x.constructor.name === 'Sac').length);
  h.check('mid-fight: brood, puffcaps, blight and bounce caps all out', before.brood >= 1 && before.puffs >= 1 && sp0.patches >= 1 && before.caps === 4 && sacs0 === 3, JSON.stringify({ before, sp0, sacs0 }));

  // Aster falls.
  await h.eval(() => {
    const g = window.wyrm;
    const p = g.player;
    p.invuln = false;
    p.iframes = 0;
    p.takeHit({ damage: 9999, type: 'physical', dirX: 0, dirZ: 1, knockback: 5, launch: 0, stagger: 0, hitstop: 0, buildup: 0, heavy: false, spike: false, source: 'enemy', move: 'test', fromPlayer: false, ox: 0, oz: 0 }, null);
  });
  const dead = await h.eval(() => window.wyrm.state);
  await step(h, 4.5);
  const after = await h.eval(() => {
    const g = window.wyrm;
    const b = window.__boss;
    return {
      state: g.state, boss: g.boss === null, disposed: b.disposed, inScene: g.enemies.includes(b),
      brood: g.enemies.filter((e) => e.alive && e.def.id === 'sporeling').length, puffs: g.enemies.filter((e) => e.alive && e.def.id === 'puffcap').length,
      patches: g.level.hittables.filter((x) => x.alive && x.constructor.name === 'BlightPatch').length,
      sacs: g.level.hittables.filter((x) => x.constructor.name === 'Sac').length, caps: b.grove.caps.filter((c) => c.awake).length,
      cam: g.cam.extraDist, bar: document.querySelector('.boss')?.style.display ?? '?',
    };
  });
  const s = await me(h);
  h.check('Aster died', dead === 'dead', dead);
  h.check('the fight resets: she is gone, and her brood, puffcaps, blight and sac targets with her', after.boss && after.disposed && !after.inScene && after.brood === 0 && after.puffs === 0 && after.patches === 0 && after.sacs === 0, JSON.stringify(after));
  h.check('the bounce caps sleep again, the camera is back to normal', after.caps === 0 && after.cam === 0, JSON.stringify(after));
  h.check('Aster is back on her feet', s.alive && s.state === 'play', JSON.stringify(s));
  await step(h, 1.5);
  const caps = await h.eval(() => window.__boss.grove.caps.map((c) => c.awake || c.solid.enabled));
  h.check('the sleeping caps no longer launch anyone', caps.every((c) => !c), JSON.stringify(caps));

  // Walking back in: a fresh Mycora, from the top.
  await h.eval(() => { const b = window.__spawnBoss(); b.awake = true; });
  await step(h, 1);
  const fresh = await boss(h);
  const sacs1 = await h.eval(() => window.wyrm.level.hittables.filter((x) => x.constructor.name === 'Sac' && x.alive).length);
  h.check('a fresh Mycora starts over: phase 1, full health, three sacs', fresh.phase === 1 && fresh.frac === 1 && fresh.sacs === 3 && sacs1 === 3 && fresh.mode !== 'dormant', JSON.stringify({ fresh, sacs1 }));
}

/** Nyxa fights at Aster's side: her blows land on Mycora (and on her while she hangs, with bolts). */
export async function nyxa(h) {
  await grove(h, { awake: true, nyxa: true });
  await place(h, LAB.x, LAB.z - 9, 0);
  await h.eval(() => {
    window.wyrm.player.invuln = true;
    const b = window.__boss;
    b.nextIn = 99;
    window.__nyx = [];
    const orig = b.takeHit.bind(b);
    b.takeHit = (hit) => {
      const hp0 = b.hp;
      const r = orig(hit);
      if (hit.move.startsWith('nyxa:')) window.__nyx.push([hit.move, r, +(hp0 - b.hp).toFixed(1), b.mode]);
      return r;
    };
  });
  await until(h, () => window.__nyx.some(([, r, d]) => r === 'hit' && d > 0), 20);
  const ground = await h.eval(() => window.__nyx.slice());
  h.check('Nyxa\'s blows land on Mycora', ground.some(([, r, d]) => r === 'hit' && d > 0), JSON.stringify(ground.slice(0, 6)));
  // Up in the canopy she is out of Nyxa's reach from the floor, so Nyxa takes on the brood
  // she drops while Aster goes up after her.
  await h.eval(() => { const b = window.__boss; b.hp = b.maxHp * 0.3; b.phase = 3; b.settle(); b.setMode('climb'); });
  await until(h, () => window.__boss.mode === 'hang', 10);
  await h.eval(() => {
    const g = window.wyrm;
    const b = window.__boss;
    b.nextIn = 0;
    b.pattern = 2;
    window.__nyx = [];
    window.__brood = [];
    for (const e of g.enemies) {
      if (!e.alive || e.isBoss) continue;
      const orig = e.takeHit.bind(e);
      e.takeHit = (hit) => { const r = orig(hit); if (hit.move.startsWith('nyxa:')) window.__brood.push([e.def.id, hit.move, r]); return r; };
    }
  });
  // Wait for her brood to drop, then watch Nyxa go after it.
  await until(h, () => window.wyrm.enemies.some((e) => e.alive && e.def.id === 'sporeling'), 10);
  await h.eval(() => {
    const g = window.wyrm;
    for (const e of g.enemies) {
      if (!e.alive || e.isBoss || e.__watched) continue;
      e.__watched = true;
      const orig = e.takeHit.bind(e);
      e.takeHit = (hit) => { const r = orig(hit); if (hit.move.startsWith('nyxa:')) window.__brood.push([e.def.id, hit.move, r]); return r; };
    }
    window.__boss.nextIn = 99;
  });
  await until(h, () => window.__brood.some(([, , r]) => r === 'hit' || r === 'killed'), 20);
  const brood = await h.eval(() => window.__brood.slice());
  h.check('while Mycora hangs out of reach, Nyxa takes on her brood', brood.some(([, , r]) => r === 'hit' || r === 'killed'), JSON.stringify(brood.slice(0, 6)));
}
