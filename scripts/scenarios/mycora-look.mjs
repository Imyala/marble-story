// A look at Mycora and her grove in every phase, for judging by eye (checks only that nothing breaks).

import { grove, boss, step, shot, place, view, unview, until, LAB } from './mycora-lib.mjs';

export default async function (h) {
  await grove(h, { awake: false });
  await h.eval(() => { window.wyrm.player.invuln = true; });
  await step(h, 1);
  // The grove, asleep.
  await view(h, 0, 9, -26, 0, 5, 0);
  await shot(h, 'mycora-grove', false);
  await view(h, 7, 3, -11, 0, 5.5, 0);
  await shot(h, 'mycora-close', false);
  await unview(h);
  // Awake: the gameplay camera, from the south edge.
  await place(h, LAB.x, LAB.z - 10, 0);
  await h.eval(() => { window.__boss.awake = true; });
  await step(h, 0.5);
  // A root sweep.
  await h.eval(() => { const b = window.__boss; b.nextIn = 99; b.startSweep(); });
  await step(h, 0.7);
  await shot(h, 'mycora-sweep-tele', false);
  await step(h, 0.6);
  await shot(h, 'mycora-sweep', false);
  await until(h, () => window.__boss.mode !== 'sweep', 6);
  // A volley of spore bombs.
  await h.eval(() => { const b = window.__boss; b.startLob(); });
  await step(h, 1.0);
  await shot(h, 'mycora-lob', false);
  await step(h, 2.0);
  await shot(h, 'mycora-clouds', false);
  // Burn the sacs: collapse.
  await h.eval(() => {
    const b = window.__boss;
    for (const s of b.sacs) b.hitSac(s, { damage: 40, type: 'fire', fromPlayer: true, source: 'burst', move: 'fireball', heavy: false });
  });
  await step(h, 1.5);
  const c = await boss(h);
  h.check('burning the three sacs collapses her', c.mode === 'collapse' && c.stats.collapses === 1, JSON.stringify(c));
  await view(h, 6, 2.5, -9, 0, 2, 0);
  await shot(h, 'mycora-collapse', false);
  await unview(h);
  // Phase 2.
  await h.eval(() => { const b = window.__boss; b.hp = b.maxHp * 0.6; b.setMode('idle'); });
  await until(h, () => window.__boss.mode === 'tear', 3);
  await step(h, 1.3);
  await view(h, 8, 3, -12, 0, 4, 0, 0.8);
  await shot(h, 'mycora-tear', false);
  await unview(h);
  await until(h, () => window.__boss.mode === 'stalk', 5);
  await step(h, 1.5);
  await h.eval(() => { const b = window.__boss; b.startSlam(true); });
  await step(h, 0.7);
  await shot(h, 'mycora-slam-tele', false);
  await step(h, 0.45);
  await shot(h, 'mycora-slam', false);
  await h.eval(() => { const b = window.__boss; b.setMode('stalk'); b.startBlight(); });
  await step(h, 3.2);
  await shot(h, 'mycora-blight', false);
  const p2 = await boss(h);
  h.check('phase 2: torn free, puffcaps sprouted', p2.phase === 2 && p2.puffs >= 1, JSON.stringify(p2));
  // Phase 3.
  await h.eval(() => { const b = window.__boss; b.hp = b.maxHp * 0.3; b.settle(); b.setMode('stalk'); });
  await until(h, () => window.__boss.mode === 'hang', 10);
  await step(h, 0.5);
  await view(h, 0, 1.5, -13, 0, 9, 0);
  await shot(h, 'mycora-canopy', false);
  await unview(h);
  await place(h, LAB.x + 6.8 * Math.sin(Math.PI * 1.25), LAB.z + 6.8 * Math.cos(Math.PI * 1.25) - 3, 0.6);
  await step(h, 1);
  await shot(h, 'mycora-canopy-play', false);
  const p3 = await boss(h);
  h.check('phase 3: up in the canopy, bounce caps awake', p3.phase === 3 && p3.caps === 4 && p3.y > 5, JSON.stringify(p3));
  await h.eval(() => { const b = window.__boss; b.startLash(true); });
  await step(h, 0.9);
  await shot(h, 'mycora-lash', false);
  // She falls.
  await h.eval(() => { const b = window.__boss; b.canopyDmg = 999; });
  await until(h, () => window.__boss.mode === 'downed', 4);
  await step(h, 0.8);
  await view(h, 7, 2.5, -10, 0, 2, 0, 0.8);
  await shot(h, 'mycora-downed', false);
  const d = await boss(h);
  h.check('she falls to the floor when her grip goes', d.mode === 'downed' && d.stats.falls === 1 && d.y < 1, JSON.stringify(d));
  await unview(h);
  // The end.
  await h.eval(() => { const b = window.__boss; b.hp = 5; b.takeHit({ damage: 50, type: 'physical', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 0, heavy: true, spike: false, source: 'melee', move: 'horn3', fromPlayer: true, ox: 0, oz: 220 }); });
  await step(h, 1.4);
  await view(h, 7, 3, -11, 0, 2, 0, 0.3);
  await shot(h, 'mycora-death', false);
  const e = await boss(h);
  h.check('she dies on the floor, her brood withers', !e.alive && e.brood === 0 && e.puffs === 0, JSON.stringify(e));
}
