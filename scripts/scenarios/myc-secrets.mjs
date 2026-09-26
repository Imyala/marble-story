/**
 * The Mycelium Deep's secrets that myc-caps, myc-threads and myc-vents do not
 * already fetch, each reached the way a player would: teleport near, then the
 * last approach for real (walk, burn, charge, dive, climb, fight, power up).
 *   node scripts/play.mjs myc-secrets
 * (Across the four scenarios: five eggs, four letters, two relics, the heart
 * shard and all three chests.)
 */
import { boot, place, step, pos, airTo, noPartner, element, breathe, lookAt, found, calm, skip, swimTo, where, tap } from './myc-lib.mjs';

export default async function (h) {
  await boot(h, { found: { 'story:mycelium:threadworks': true, 'story:mycelium:market': true, 'story:mycelium:rootchoke': true } });
  await noPartner(h);
  // --- The forager's note, at the cold camp by the way in.
  const note = await where(h, 'mycelium:letter-forager');
  await place(h, note.x + 3, note.z, -Math.PI / 2);
  await airTo(h, note.x, note.z, 2, { near: 0.4 });
  await skip(h);
  await h.eval(() => window.wyrm.hud.letterClose?.());
  h.check('the forager\'s note', await found(h, 'mycelium:letter-forager'));

  // --- The store-cellar: burn the planks, open the chest.
  await place(h, -21, 9, -Math.PI / 2);
  await calm(h);
  await element(h, 'fire');
  await airTo(h, -25.5, 9, 1.5, { near: 0.4 });
  await breathe(h, 0.8);
  await step(h, 0.6);
  await airTo(h, -31, 9, 2.5, { near: 0.6 });
  await lookAt(h, -32.6, 9);
  await tap(h, 'horn');
  await tap(h, 'horn');
  await step(h, 1);
  h.check('the store-cellar\'s chest, behind boarded planks', await found(h, 'mycelium:chest:cellar'), JSON.stringify(await pos(h)));

  // --- The egg thief: caught, the egg drops.
  const thief = await h.eval(() => { const t = window.wyrm.level.props.find((p) => p.id === 'mycelium:egg-thief' && p.mode); return t ? { x: t.x, z: t.z } : null; });
  h.check('an egg thief waits in the Sporefall', !!thief);
  if (thief) {
    await place(h, thief.x - 2, thief.z, Math.PI / 2);
    await h.eval(() => { const t = window.wyrm.level.props.find((p) => p.id === 'mycelium:egg-thief' && p.mode); t.takeHit(null); });
    await step(h, 1);
    const egg = await where(h, 'mycelium:egg-thief');
    if (egg) await airTo(h, egg.x, egg.z, 3, { near: 0.4 });
    await step(h, 0.5);
    h.check('caught: the thief\'s egg', await found(h, 'mycelium:egg-thief'), JSON.stringify(egg));
  }

  // --- The Glimmer Pools: dive under the root arch for the egg; swim to the rock and climb out for the chest.
  await place(h, 50, 22, -Math.PI / 2, -0.8);
  await calm(h);
  await step(h, 0.3);
  const pegg = await where(h, 'mycelium:egg-pool');
  await swimTo(h, pegg.x + 1.5, pegg.y + 1.5, pegg.z, 8, 1.2);
  await swimTo(h, pegg.x, pegg.y + 1, pegg.z, 5, 0.6);
  await step(h, 0.3);
  h.check('the egg at the bottom of the deep pool', await found(h, 'mycelium:egg-pool'), JSON.stringify(await pos(h)));
  await swimTo(h, 45.5, -1.1, 29, 6, 1.2);
  const leap = await airTo(h, 47.2, 30.2, 2.5, { near: 1 });
  await lookAt(h, 47.5, 30.5);
  await tap(h, 'horn');
  await tap(h, 'horn');
  await step(h, 1);
  h.check('out of the water onto the rock, and its chest', await found(h, 'mycelium:chest:pools'), JSON.stringify(leap));

  // --- The gardener's plaque in the Threadworks' west wing.
  const plaque = await where(h, 'mycelium:letter-garden');
  await place(h, plaque.x, plaque.z - 3, 0);
  await airTo(h, plaque.x, plaque.z, 2, { jump: true, near: 0.5 });
  await step(h, 0.5);
  await skip(h);
  h.check('the gardener\'s plaque', await found(h, 'mycelium:letter-garden'), JSON.stringify(await pos(h)));

  // --- Pickle's ledger, on her stall.
  const ledger = await where(h, 'mycelium:letter-ledger');
  await place(h, ledger.x + 2.2, ledger.z - 1.2, -Math.PI / 2);
  await calm(h);
  await airTo(h, ledger.x, ledger.z, 1.5, { jump: true, near: 0.5 });
  await step(h, 0.5);
  await skip(h);
  h.check('Pickle\'s ledger, on the stall', await found(h, 'mycelium:letter-ledger'), JSON.stringify(await pos(h)));

  // --- The Superflame shrine behind the square: its guards fall, it wakes; white-hot breath opens the iron chest.
  // (From behind it: the square's own fight is another matter.)
  await place(h, 58.5, 190.6, Math.PI);
  await calm(h);
  await step(h, 1);
  const shrine = await h.eval(() => window.wyrm.level.props.find((p) => p.constructor.name === 'PowerShrine').state);
  await airTo(h, 58.5, 187.2, 2, { stop: 0.2, near: 0.3 });
  await step(h, 0.3);
  const power = await h.eval(() => window.wyrm.player.power);
  await place(h, 64.5, 185.2, 0);
  await element(h, 'fire');
  await lookAt(h, 67, 186.8);
  await breathe(h, 1);
  await step(h, 1);
  h.check('the shrine wakes, and Superflame opens the iron-bound chest', shrine === 'ready' && power === 'superflame' && await found(h, 'mycelium:chest:market'), JSON.stringify({ shrine, power }));

  // --- The Strangled Hollow: past the Rootchoke's own fight, burn the roots, win the Hollow's fight, read the wall.
  await place(h, 24, 186, Math.PI);
  for (let i = 0; i < 14; i++) {
    if ((await h.eval(() => window.wyrm.level.arenas.find((a) => a.id === 'rootchoke').state)) === 'cleared') break;
    await calm(h);
    await step(h, 1.5);
  }
  await place(h, 24, 177.5, Math.PI);
  await calm(h);
  await element(h, 'fire');
  await breathe(h, 1.2);
  await step(h, 1.5);
  await airTo(h, 24, 166, 3, { near: 1 });
  for (let i = 0; i < 12; i++) {
    const st = await h.eval(() => window.wyrm.level.arenas.find((a) => a.id === 'strangled').state);
    if (st === 'cleared') break;
    await calm(h);
    await step(h, 1.5);
  }
  const arena = await h.eval(() => window.wyrm.level.arenas.find((a) => a.id === 'strangled').state);
  const scrawl = await where(h, 'mycelium:letter-root');
  if (scrawl) await airTo(h, scrawl.x, scrawl.z, 3, { near: 0.4 });
  await step(h, 0.5);
  await skip(h);
  h.check('through the roots, the Hollow\'s fight won, and the scratched letter', arena === 'cleared' && await found(h, 'mycelium:letter-root'), JSON.stringify({ arena, scrawl }));

  // What the save now holds from this realm (with the other scenarios' finds, the full set).
  const got = await h.eval(() => Object.keys(window.wyrm.save.found).filter((k) => k.startsWith('mycelium:')).sort());
  console.log(JSON.stringify(got));
}
