// Dying inside an arena and mid-boss: what is left behind after the respawn?
import { place, waitGame, until } from './frostlib.mjs';

export default async function (h) {
  await h.go('?level=frostworks&seed=8&quality=low&maxdt=0.1', 3000);
  await h.skipDialogue();
  await h.eval(() => { const g = window.wyrm; for (const e of ['fire', 'lightning']) if (!g.save.elements.includes(e)) g.learnElement(e); });
  await place(h, 1.5, 88, 0);
  await waitGame(h, 0.3);
  await place(h, -2, 99, 0);
  await until(h, () => window.wyrm.enemies.filter((e) => e.alive && e.state !== 'spawn').length >= 3, null, 6);
  await h.skipDialogue();
  // Die in the arena.
  await h.eval(() => { const p = window.wyrm.player; p.hp = 1; p.takeHit({ damage: 50, type: 'physical', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 0, heavy: false, spike: false, source: 'enemy', move: 'x', fromPlayer: false, ox: 0, oz: 0 }, null); });
  await until(h, () => window.wyrm.state === 'dead', null, 3);
  await h.tap('Space', 1, 200);
  await until(h, () => window.wyrm.state === 'play', null, 10);
  await waitGame(h, 2);
  const left = await h.eval(() => {
    const g = window.wyrm;
    const a = g.level.arenas.find((a) => a.id === 'kilnyard');
    const zombies = g.enemies.filter((e) => !e.alive && e.state !== 'dead').map((e) => ({ id: e.def.id, st: e.state, x: +e.x.toFixed(1), z: +e.z.toFixed(1), aggro: e.aggro }));
    return { arena: a.state, zombies, cp: g.save.checkpoint, p: [+g.player.x.toFixed(1), +g.player.z.toFixed(1)], hp: g.player.hp };
  });
  console.log('after arena death', JSON.stringify(left));
  h.check('arena reset after death', left.arena === 'idle', JSON.stringify(left));
  console.log(left.zombies.length ? `NOTE: ${left.zombies.length} disposed arena enemies still in g.enemies (engine Arena.reset)` : 'no leftover arena enemies');

  // Boss death: minions and frost patches must go away with the boss.
  await h.eval(() => { const g = window.wyrm; g.level.arenas.forEach((a) => { a.state = 'cleared'; }); });
  await place(h, 0, 233, 0, 13);
  await waitGame(h, 0.5);
  await h.skipDialogue(8000);
  await until(h, () => window.wyrm.boss && window.wyrm.boss.awake, null, 5);
  await h.eval(() => {
    const b = window.wyrm.boss;
    b.hp = b.maxHp * 0.5;
  });
  await waitGame(h, 0.5);
  await h.eval(() => { const b = window.wyrm.boss; b.setState('chase'); b.startAttack(b.def.attacks.find((a) => a.id === 'summon')); });
  await until(h, () => window.wyrm.boss.minions.length > 0, null, 4);
  await h.eval(() => { const b = window.wyrm.boss; b.setState('chase'); b.startAttack(b.def.attacks.find((a) => a.id === 'vent')); });
  await until(h, () => window.wyrm.boss.patches.length > 0, null, 4);
  await h.eval(() => { const p = window.wyrm.player; p.hp = 1; p.takeHit({ damage: 50, type: 'physical', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 0, heavy: false, spike: false, source: 'enemy', move: 'x', fromPlayer: false, ox: 0, oz: 0 }, null); });
  await until(h, () => window.wyrm.state === 'dead', null, 3);
  await h.tap('Space', 1, 200);
  await until(h, () => window.wyrm.state === 'play', null, 10);
  await waitGame(h, 2);
  const after = await h.eval(() => {
    const g = window.wyrm;
    const golems = g.enemies.filter((e) => e.def.id === 'frostGolem' && e.alive && Math.hypot(e.x, e.z - 253) < 22).length;
    const barrier = g.level.props.some((p) => p.constructor.name === 'Barrier' && p.on);
    return { boss: !!g.boss, golems, barrier, p: [+g.player.x.toFixed(1), +g.player.z.toFixed(1)] };
  });
  console.log('after boss death', JSON.stringify(after));
  h.check('boss, minions and barrier cleared on death', !after.boss && after.golems === 0 && !after.barrier, JSON.stringify(after));
  // Walk back in: the rematch starts without the intro.
  await place(h, 0, 233, 0, 13);
  await waitGame(h, 0.8);
  const re = await h.eval(() => ({ boss: !!window.wyrm.boss, awake: window.wyrm.boss?.awake, state: window.wyrm.state, hp: window.wyrm.boss?.hp }));
  h.check('rematch starts straight away', re.boss && re.awake && re.state === 'play', JSON.stringify(re));
}
