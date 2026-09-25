// The Frostworks side areas: every new egg, letter and chest is reachable
// the way it is meant to be (ONLY=camp,cellar,... to run some).
import { boot, place, step, snap, hop, track, releaseAll, clearArenas, groundAt, finds, found, walkTo, face, breakableCounts } from './ff-lib.mjs';

const want = (n) => !process.env.ONLY || process.env.ONLY.split(',').includes(n);
const K = (h) => h.page.keyboard;
const killNear = (h, x, z, r) => h.eval(([x, z, r]) => {
  const g = window.wyrm;
  for (const e of g.enemies) if (e.alive && !e.isBoss && Math.hypot(e.x - x, e.z - z) < r) { e.hp = 0; e.die(null); }
}, [x, z, r]);
const gateAt = (h, x, z) => h.eval(([x, z]) => {
  const g = window.wyrm.level.hittables.find((t) => t.constructor.name === 'Gate' && Math.hypot(t.x - x, t.z - z) < 1.2);
  return g ? g.alive : 'missing';
}, [x, z]);

/** Breathes fire at (x, z) until the gate there is gone (or `sec` runs out). */
async function burn(h, x, z, sec = 6) {
  await face(h, x, z);
  await h.eval(() => { const p = window.wyrm.player; p.element = 'fire'; p.mana = p.maxMana; });
  await K(h).down('KeyK');
  for (let t = 0; t < sec; t += 0.5) {
    await step(h, 0.5);
    await h.eval(() => { const p = window.wyrm.player; p.mana = p.maxMana; });
    if ((await gateAt(h, x, z)) === false) break;
  }
  await K(h).up('KeyK');
  await step(h, 0.4);
  return (await gateAt(h, x, z)) === false;
}

export default async function (h) {
  await boot(h, 'frostworks');
  await clearArenas(h);

  if (want('census')) {
    const all = await finds(h);
    for (const f of all) console.log('find', JSON.stringify(f));
    const eggs = all.filter((f) => f.kind === 'egg').length;
    const letters = all.filter((f) => f.kind === 'letter').length;
    const chests = all.filter((f) => f.kind === 'chest').length;
    h.check('frostworks places 5 eggs, 4 letters and 1-3 chests', eggs === 5 && letters === 4 && chests >= 1 && chests <= 3, `${eggs} eggs, ${letters} letters, ${chests} chests`);
    const bc = await breakableCounts(h);
    const total = Object.values(bc).reduce((a, b) => a + b, 0);
    h.check('40-80 breakables', total >= 40 && total <= 80, JSON.stringify(bc) + ` total ${total}`);
    const letterIds = await h.eval(() => window.wyrm.level.props.filter((p) => p.constructor.name === 'Collectible' && p.kind === 'letter').map((p) => p.relicId));
    const known = await h.eval(async (ids) => {
      const m = await import('/src/game/letters.ts');
      return ids.map((id) => [id, !!m.findLetter('frostworks', id)]);
    }, letterIds);
    h.check('every placed letter has text', known.every(([, ok]) => ok), JSON.stringify(known));
    const grounds = {};
    for (const [n, x, z, lo, hi, maxY] of [['camp', -33, 58, 2.3, 2.5], ['camp-edge', -28, 55, 2.2, 2.6], ['cellar-way', -25, 98, 3.1, 3.3], ['cellar-in', -35, 98, 3.1, 3.3, 5],
      ['berg', 6.0, 73.2, 1.35, 1.45], ['post', -16, 186, 8.85, 8.95], ['roof', -6, 209, 17, 17.2], ['hollow', 0, 38, 2.1, 2.8], ['works', 1.5, 86, 3, 3.5]]) {
      const y = await groundAt(h, x, z, maxY ?? 1e4);
      grounds[n] = y;
      if (!(y >= lo && y <= hi)) h.check(`ground at ${n}`, false, `${y}`);
    }
    console.log('grounds', JSON.stringify(grounds));
  }

  if (want('camp')) {
    await place(h, -14.4, 47.6, -1.1);
    let s = await walkTo(h, -28.6, 55.2, 4, 0.5);
    h.check('the rope bridge reaches the cutters\' camp', s.g && s.y > 2.2 && s.x < -27, JSON.stringify(s));
    await killNear(h, -33, 58, 12);
    s = await walkTo(h, -34.4, 58.6, 2, 0.3);
    const melted = await burn(h, -35.8, 58.6);
    h.check('fire melts the ice-house door', melted);
    s = await walkTo(h, -37.8, 58.6, 2, 0.3);
    h.check('egg in the cutters\' ice-house', await found(h, 'frostworks:egg-camp'), JSON.stringify(s));
    await place(h, -35.6, 54.8, -Math.PI / 2);
    await face(h, -37.8, 54.4);
    for (let i = 0; i < 3 && !(await found(h, 'frostworks:chest:cutters')); i++) { await K(h).press('KeyJ'); await step(h, 0.6); }
    h.check('the cutters\' strongbox opens', await found(h, 'frostworks:chest:cutters'));
    await place(h, -30.4, 62.2, Math.PI / 2);
    s = await walkTo(h, -28.6, 61.9, 2, 0.3);
    h.check('the cutters\' tally board', await found(h, 'frostworks:letter-cutter'), JSON.stringify(s));
  }

  if (want('cellar')) {
    await place(h, -25, 98, -Math.PI / 2);
    await walkTo(h, -28.6, 98, 2, 0.3);
    const broke = await burn(h, -30.4, 98, 8);
    h.check('fire breaks the cellar barricade', broke);
    await killNear(h, -36, 98, 8);
    let s = await walkTo(h, -32.1, 97.3, 3, 0.3);
    h.check('the harvest-keeper\'s inventory', await found(h, 'frostworks:letter-keeper'), JSON.stringify(s));
    s = await walkTo(h, -38.2, 97, 3, 0.4);
    await face(h, -39.8, 95.6);
    for (let i = 0; i < 3 && !(await found(h, 'frostworks:chest:keeper')); i++) { await K(h).press('KeyJ'); await step(h, 0.6); }
    h.check('the cold-store chest opens', await found(h, 'frostworks:chest:keeper'), JSON.stringify(await snap(h)));
    // Up the frozen crates to the top shelf.
    await place(h, -37.4, 99.4, -Math.PI / 2, 5);
    let hs = await hop(h, -39.6, 99.4, { brake: 0.5 });
    console.log('crate 1', JSON.stringify(hs[hs.length - 1]));
    hs = await hop(h, -40, 97.8, { flap: true, brake: 0.4 });
    console.log('crate 2', JSON.stringify(hs[hs.length - 1]));
    if (!(await found(h, 'frostworks:egg-cellar'))) await walkTo(h, -40.2, 97.1, 1, 0.2);
    h.check('climb the frozen crates to the egg on the top shelf', await found(h, 'frostworks:egg-cellar'), JSON.stringify(await snap(h)));
  }

  if (want('berg')) {
    await place(h, 2.6, 74.4, 1.9);
    const hs = await hop(h, 5.9, 73.2, { brake: 0.5 });
    const e = hs[hs.length - 1];
    h.check('jump from the stepping rock onto the berg', e.g && e.y > 1.3, JSON.stringify(e));
    // The lake's Shade Wisps would pull the breath's aim off the ice: clear them first.
    await killNear(h, 6, 72, 20);
    await place(h, 6.2, 73.3, 1.9);
    const door = await h.eval(() => { const t = window.wyrm.level.hittables.filter((t) => t.constructor.name === 'Gate' && t.kind === 'ice' && Math.hypot(t.x - 8, t.z - 72.5) < 3); return t.map((g) => [g.x, g.z]); });
    const melted = await burn(h, door[0][0], door[0][1]);
    h.check('fire melts the ice block', melted);
    const s = await walkTo(h, 8.3, 72.5, 2, 0.3);
    h.check('egg frozen in the berg', await found(h, 'frostworks:egg-berg'), JSON.stringify(s));
  }

  if (want('roof')) {
    await place(h, -7.4, 217.6, -2.5, 13);
    let hs = await hop(h, -8.5, 215.6, { brake: 0.4 });
    let e = hs[hs.length - 1];
    console.log('step 1', JSON.stringify(e));
    hs = await hop(h, -6.7, 215.6, { flap: true, brake: 0.4 });
    e = hs[hs.length - 1];
    console.log('step 2', JSON.stringify(e));
    hs = await hop(h, -6.4, 213.2, { flap: true, brake: 0.4 });
    e = hs[hs.length - 1];
    h.check('crate steps up onto the drafting-room roof', e.g && e.y > 16.9, JSON.stringify(e));
    await walkTo(h, -6.2, 210.4, 2, 0.3);
    h.check('egg on the drafting-room roof', await found(h, 'frostworks:egg-roof'));
  }

  if (want('post')) {
    // From the Upper Works' south-west edge, glide down and let go over the post.
    await place(h, -7.4, 204.6, Math.atan2(-16 + 7.4, 186 - 204.6), 13);
    const k = K(h);
    await k.down('KeyW');
    await k.down('Space');
    await step(h, 0.3);
    await k.up('Space');
    await step(h, 0.07);
    await k.down('Space');
    let s;
    for (let t = 0; t < 4; t += 0.05) {
      await step(h, 0.05);
      s = await snap(h);
      if (Math.hypot(s.x + 16, s.z - 186) < 3.2) break;
    }
    await k.up('Space');
    await k.up('KeyW');
    const land = await track(h, 1.2);
    s = land.find((q) => q.g) ?? land[land.length - 1];
    console.log('post glide', land.filter((_, i) => i % 2 === 0).map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)},${q.z.toFixed(1)}${q.g ? 'G' : ''}`).join(' '));
    h.check('glide down onto the iron post', await found(h, 'frostworks:egg-post') && s.g && Math.abs(s.y - 8.9) < 0.2, JSON.stringify(s));
    await face(h, -16, 176);
    await k.down('KeyW');
    await step(h, 1.0);
    await k.up('KeyW');
    await step(h, 4);
    s = await snap(h);
    h.check('a fall from the post respawns up on the works, not on the post', s.y > 11 && s.z > 195, JSON.stringify(s));
  }

  if (want('letters')) {
    await place(h, 5.2, 92.8, Math.PI / 2);
    await walkTo(h, 6.6, 92.8, 1.5, 0.3);
    h.check('Grolm\'s work order in the Lower Works', await found(h, 'frostworks:letter-quota'));
    await place(h, 0.2, 218.6, Math.PI / 2, 13);
    await walkTo(h, 1.8, 218.6, 1.5, 0.3);
    h.check('the apprentice\'s diary by the Crucible bridge', await found(h, 'frostworks:letter-apprentice'));
  }
  if (want('lift')) {
    // frostpath2's last check, in fixed steps: a second of walking takes you off the lift.
    await h.eval(() => window.wyrm.level.emit('lift-power'));
    for (let i = 0; i < 40; i++) {
      await step(h, 0.25);
      const up = await h.eval(() => window.wyrm.level.props.find((p) => p.constructor.name === 'MovingPlatform' && Math.abs(p.solid.x - 19) < 0.5).solid.y1);
      if (up > 11.95) break;
    }
    await place(h, 19, 190.5, 0, 12.5);
    await K(h).down('KeyW');
    await step(h, 1.0);
    await K(h).up('KeyW');
    await step(h, 0.2);
    const s = await snap(h);
    h.check('a second of walking takes the dragon off the lift into the Upper Works', s.g && s.z > 199 && s.y > 11.5, JSON.stringify(s));
  }
  await releaseAll(h);
}
