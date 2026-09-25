// The partner command (G): a tap sends Nyxa at a foe with a heavy strike on a cooldown,
// holding makes her stay until the next tap. And the twin plates, which open only
// with a dragon on each.

import { waitGame, withNyxa, place, nyxa, walk, tapG as tap, holdG as hold } from './nyxa-lib.mjs';

/** Aster walks to (x, z). */
const walkTo = (h, x, z) => walk(h, [[x, z]], 10);

export default async function (h) {
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=plains&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  await withNyxa(h, 'plains');
  await place(h, 2, 38, 0);
  await waitGame(h, 2);

  // 1) A tap with nothing about: she says so, no cooldown spent.
  await tap(h);
  await waitGame(h, 0.3);
  let n = await nyxa(h);
  h.check('a tap with no foe near spends nothing', n.cd === 0 && n.ready === 1 && n.say.length > 0, JSON.stringify(n));

  // 2) "Nyxa, now!": a grunt that has not noticed Aster yet, a way off.
  await h.eval(() => {
    const g = window.wyrm;
    const e = g.spawnEnemy('grunt', 4, g.col.groundAt(4, 49, 1e4, 0.2).y + 0.05, 49, Math.PI, false);
    e.state = 'idle';
    window.__g = e;
    window.__hits = [];
    const orig = e.takeHit.bind(e);
    e.takeHit = (hit) => { const r = orig(hit); window.__hits.push([hit.move, r, hit.heavy]); return r; };
  });
  await waitGame(h, 0.2);
  await tap(h);
  await waitGame(h, 1.3);
  n = await nyxa(h);
  const hits = await h.eval(() => window.__hits);
  h.check('a tap sends her at the foe with a heavy strike', hits.some(([m, r, heavy]) => m === 'nyxa:strike' && (r === 'hit' || r === 'killed') && heavy), JSON.stringify(hits));
  h.check('the command then cools down (shown on the HUD ring)', n.cd > 5 && n.cd < 8 && n.ready < 0.4 && !/ready/.test(n.cls), JSON.stringify(n));
  await h.shot('nyxa-command-strike');
  // A second tap straight away: no second strike.
  const strikes0 = hits.filter(([m]) => m === 'nyxa:strike').length;
  await tap(h);
  await waitGame(h, 1);
  const strikes1 = (await h.eval(() => window.__hits)).filter(([m]) => m === 'nyxa:strike').length;
  h.check('no second strike while it cools down', strikes1 === strikes0, `${strikes0} -> ${strikes1}`);
  await h.eval(() => { const e = window.__g; if (e.alive) { e.alive = false; e.state = 'dead'; e.deadT = 9; } });
  await waitGame(h, 8);
  n = await nyxa(h);
  h.check('the command is ready again after about 8 seconds', n.cd === 0 && /ready/.test(n.cls), JSON.stringify(n));

  // 3) "Nyxa, stay": hold, walk away, she waits; a tap and she follows again.
  await waitGame(h, 1);
  await hold(h, 0.7);
  await waitGame(h, 0.8);
  const spot = await nyxa(h);
  h.check('holding the command makes her stay', spot.staying && /staying/.test(spot.cls), JSON.stringify(spot));
  await walkTo(h, 2, 58);
  await waitGame(h, 1);
  n = await nyxa(h);
  const moved = Math.hypot(n.x - spot.x, n.z - spot.z);
  h.check('she waits where she was told while Aster walks off', n.staying && moved < 1 && n.d > 12, JSON.stringify({ spot, n, moved }));
  await h.shot('nyxa-stay');
  await tap(h);
  await waitGame(h, 3.5);
  n = await nyxa(h);
  h.check('a tap and she follows again', !n.staying && n.d < 7, JSON.stringify(n));

  // 4) Twin plates, built for the test.
  await h.eval(async () => {
    const g = window.wyrm;
    const { twinPlates } = await import('/src/entities/twinplate.ts');
    const { Builder } = await import('/src/world/level.ts');
    const b = new Builder(g, g.level);
    window.__tp = twinPlates(b, [-4, 46], [5, 46], 'twin-test');
    window.__solved = 0;
    g.level.on('twin-test', () => { window.__solved++; });
  });
  // Aster alone on one plate: nothing, and a hint.
  await walkTo(h, -4, 46);
  await waitGame(h, 2.2);
  const alone = await h.eval(() => ({ solved: window.__solved, a: window.__tp.plates[0].who, b: window.__tp.plates[1].who }));
  n = await nyxa(h);
  h.check('Aster alone on a plate opens nothing, and Nyxa offers a hint', alone.solved === 0 && alone.a === 'aster' && !alone.b && /plate/.test(n.say), JSON.stringify({ alone, say: n.say }));
  await h.shot('nyxa-plate-alone');
  // Nyxa alone on the other plate: still nothing.
  await walkTo(h, -6, 36);
  await h.eval(() => { const g = window.wyrm; const pl = window.__tp.plates[1]; g.partner.placeAt(pl.x, pl.y, pl.z, 0); g.partner.commandStay(); });
  await waitGame(h, 1.5);
  const lone = await h.eval(() => ({ solved: window.__solved, a: window.__tp.plates[0].who, b: window.__tp.plates[1].who }));
  h.check('Nyxa alone on a plate opens nothing either', lone.solved === 0 && lone.b === 'nyxa' && !lone.a, JSON.stringify(lone));
  await tap(h);
  await waitGame(h, 1.5);
  // The real way: walk her over to one plate, tell her to stay, take the other.
  await walkTo(h, 4.5, 42);
  await waitGame(h, 1.2);
  await hold(h, 0.7);
  await waitGame(h, 2);
  const onB = await h.eval(() => ({ b: window.__tp.plates[1].who, st: window.wyrm.partner.staying }));
  await walkTo(h, -4, 46);
  await waitGame(h, 1);
  const both = await h.eval(() => ({ solved: window.__solved, done: window.__tp.solved, a: window.__tp.plates[0].who, b: window.__tp.plates[1].who }));
  h.check('with Nyxa told to stay on one and Aster on the other, the plates open', onB.b === 'nyxa' && onB.st && both.solved === 1 && both.done, JSON.stringify({ onB, both }));
  await h.shot('nyxa-plates-solved');
  // Latched: stepping off keeps them open (the signal fired once).
  await walkTo(h, 0, 36);
  await waitGame(h, 1);
  const latch = await h.eval(() => ({ solved: window.__solved, done: window.__tp.solved }));
  h.check('the solved plates stay solved (the signal fires once)', latch.solved === 1 && latch.done, JSON.stringify(latch));
}
