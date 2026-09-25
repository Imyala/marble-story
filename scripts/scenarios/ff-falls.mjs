// Stormspire Falls side areas: every new egg, letter and chest is reachable
// the way it is meant to be (ONLY=ferry,draft,... to run some).
import { boot, place, step, snap, hop, glideJump, track, releaseAll, clearArenas, groundAt, finds, found, walkTo, face, smashAround, breakableCounts, draw } from './ff-lib.mjs';

const want = (n) => !process.env.ONLY || process.env.ONLY.split(',').includes(n);
const alive = (h, fn) => h.eval(fn);
const K = (h) => h.page.keyboard;

export default async function (h) {
  await boot(h, 'falls');
  await clearArenas(h);

  if (want('census')) {
    const all = await finds(h);
    for (const f of all) console.log('find', JSON.stringify(f));
    const eggs = all.filter((f) => f.kind === 'egg').length;
    const letters = all.filter((f) => f.kind === 'letter').length;
    const chests = all.filter((f) => f.kind === 'chest').length;
    h.check('falls places 5 eggs, 4 letters and 1-3 chests', eggs === 5 && letters === 4 && chests >= 1 && chests <= 3, `${eggs} eggs, ${letters} letters, ${chests} chests`);
    const bc = await breakableCounts(h);
    const total = Object.values(bc).reduce((a, b) => a + b, 0);
    h.check('40-80 breakables', total >= 40 && total <= 80, JSON.stringify(bc) + ` total ${total}`);
    const letterIds = await h.eval(() => window.wyrm.level.props.filter((p) => p.constructor.name === 'Collectible' && p.kind === 'letter').map((p) => p.relicId));
    const known = await h.eval(async (ids) => {
      const m = await import('/src/game/letters.ts');
      return ids.map((id) => [id, !!m.findLetter('falls', id)]);
    }, letterIds);
    h.check('every placed letter has text', known.every(([, ok]) => ok), JSON.stringify(known));
    const grounds = {};
    for (const [n, x, z, lo, hi] of [['ferry', 20, -4.5, 2.6, 3.4], ['stack1', -14.5, 61.5, 6.8, 7.6], ['stack3', -29.5, 61.5, 9.2, 10], ['aerie', -60, 50, 35.5, 36.6],
      ['tower', -77, 61, 41.8, 42.2], ['watch', -36, 80.5, 15.6, 16.4], ['spray', 42.4, 136.5, 19.9, 20.1], ['pier', -15, 80.5, 15.9, 16.1]]) {
      const y = await groundAt(h, x, z);
      grounds[n] = y;
      if (!(y >= lo && y <= hi)) h.check(`ground at ${n}`, false, `${y}`);
    }
    console.log('grounds', JSON.stringify(grounds));
  }

  if (want('ferry')) {
    await place(h, 12.5, -2.6, Math.PI / 2);
    let s = await walkTo(h, 17.9, -1.2, 4);
    console.log('at the shack door', JSON.stringify(s));
    const blocked = await h.eval(() => window.wyrm.level.hittables.some((t) => t.constructor.name === 'Breakable' && t.alive && Math.hypot(t.x - 19.15, t.z + 1.2) < 0.4));
    h.check('a crate blocks the shack door', blocked);
    await smashAround(h, 19.15, -1.2, 0.8);
    s = await walkTo(h, 21.6, -1.2, 3, 0.3);
    h.check('egg behind the fish crates', await found(h, 'falls:egg-ferry'), JSON.stringify(s));
    await place(h, 24.8, -3.5, Math.PI / 2);
    s = await walkTo(h, 30.9, -3.5, 3, 0.3);
    h.check('letter at the end of the jetty', await found(h, 'falls:letter-ferry'), JSON.stringify(s));
  }

  if (want('draft')) {
    await place(h, -8.2, 61.5, -Math.PI / 2);
    let ok = true;
    for (const [x, z, top] of [[-14.5, 61.5, 7.2], [-22, 58.5, 8.4], [-29.5, 61.5, 9.6]]) {
      const s = await hop(h, x, z, { flap: true, brake: 0.6 });
      const e = s[s.length - 1];
      console.log(`stack ${x},${z}:`, JSON.stringify(e));
      if (!(e.g && e.y > top - 0.4)) ok = false;
    }
    h.check('hop the three sea stacks', ok);
    await walkTo(h, -28.9, 60.7, 1.5, 0.3);
    h.check('climber letter on the last stack', await found(h, 'falls:letter-climber'));
    await place(h, -30.5, 61.5, -Math.PI / 2);
    const s = await glideJump(h, 5.5);
    await releaseAll(h);
    const t = s.concat(await track(h, 2));
    const e = t[t.length - 1];
    h.check('the Riders\' Draft lifts onto the rim', e.g && e.y > 35.4 && e.x < -44, `maxY=${Math.max(...t.map((q) => q.y)).toFixed(1)} last=${JSON.stringify(e)}`);
  }

  if (want('aerie')) {
    // The strongroom: burn the barricade, then open the chest.
    await place(h, -66, 45, -Math.PI / 2);
    await h.eval(() => { const g = window.wyrm; for (const e of g.enemies) if (e.alive && e.x < -45) { e.hp = 0; e.die(null); } });
    await walkTo(h, -68.8, 45, 2, 0.3);
    await face(h, -71, 45);
    await K(h).down('KeyK');
    await step(h, 2.5);
    await K(h).up('KeyK');
    await step(h, 0.5);
    const gate = await alive(h, () => window.wyrm.level.hittables.filter((t) => t.kind === 'wood').map((t) => t.alive));
    h.check('fire breaks the strongroom barricade', gate.length === 1 && gate[0] === false, JSON.stringify(gate));
    let s = await walkTo(h, -73.2, 45, 3, 0.3);
    await face(h, -74.4, 45);
    for (let i = 0; i < 3 && !(await found(h, 'falls:chest:riders')); i++) { await K(h).press('KeyJ'); await step(h, 0.6); }
    h.check('the Riders\' purse opens', await found(h, 'falls:chest:riders'), JSON.stringify(s));
    await place(h, -65.2, 45, -Math.PI / 2);
    s = await walkTo(h, -65.6, 45, 1, 0.2);
    if (!(await found(h, 'falls:letter-rider'))) {
      await hop(h, -66.8, 45, { brake: 0.3 });
    }
    h.check('rider letter on the hall table', await found(h, 'falls:letter-rider'), JSON.stringify(await snap(h)));
    // The tower: four jutting stones, then the top.
    await place(h, -72.5, 61.6, -Math.PI / 2);
    let ok = true;
    for (let i = 0; i < 4; i++) {
      const a = 1.4 + i * 0.95;
      const x = -77 + Math.sin(a) * 3.05;
      const z = 61 + Math.cos(a) * 3.05;
      const hs = await hop(h, x, z, { flap: true, brake: 0.4 });
      const e = hs[hs.length - 1];
      console.log(`step ${i}:`, JSON.stringify(e));
      if (!(e.g && e.y > 36 + 0.8 + i * 1.25)) ok = false;
    }
    let hs = await hop(h, -77, 61, { flap: true, brake: 0.5 });
    h.check('climb the jutting stones to the tower top', ok && hs[hs.length - 1].y > 41.5, JSON.stringify(hs[hs.length - 1]));
    h.check('egg in the tower nest', await found(h, 'falls:egg-aerie'));
    // The Riders' Run: step off the rim through the rings.
    const dir = Math.atan2(25.5, 20);
    await place(h, -40.5 - Math.sin(dir) * 5, 66 - Math.cos(dir) * 5, dir, 1e4, 0.2);
    s = await glideJump(h, 4.0);
    await releaseAll(h);
    s = s.concat(await track(h, 1.5));
    console.log('run', s.filter((_, i) => i % 3 === 0).map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)},${q.z.toFixed(1)}`).join(' '));
    console.log('rings next', await h.eval(() => window.wyrm.level.props.find((p) => p.constructor.name === 'GlideCourse').next));
    h.check('glide through the Riders\' Run rings', await found(h, 'falls:rings:riders'), JSON.stringify(s[s.length - 1]));
  }

  if (want('watch')) {
    await place(h, -21.2, 80.5, -Math.PI / 2);
    const rope = await h.eval(() => { const r = window.wyrm.level.hittables.find((t) => t.constructor.name === 'Rope'); return [r.x, r.y, r.z]; });
    await face(h, rope[0], rope[2]);
    await h.eval(() => { const p = window.wyrm.player; p.element = 'fire'; p.mana = p.maxMana; });
    await K(h).press('KeyU');
    await step(h, 2.5);
    const burnt = await h.eval(() => !window.wyrm.level.hittables.find((t) => t.constructor.name === 'Rope').alive);
    h.check('a fireball burns the watch bridge rope', burnt);
    await step(h, 1.5);
    let s = await walkTo(h, -35.8, 80.5, 3, 0.4);
    h.check('walk the lowered drawbridge to the watch post', s.g && s.y > 15.6 && s.x < -34, JSON.stringify(s));
    s = await walkTo(h, -37.9, 80.2, 2, 0.3);
    if (!(await found(h, 'falls:letter-stormcrest'))) await hop(h, -37.9, 79.9, { brake: 0.3 });
    h.check('Stormcrest\'s orders at the watch post', await found(h, 'falls:letter-stormcrest'), JSON.stringify(await snap(h)));
    await place(h, -37.4, 81.7, -Math.PI / 2, 17);
    await face(h, -39.1, 81.7);
    for (let i = 0; i < 3 && !(await found(h, 'falls:chest:watch')); i++) { await K(h).press('KeyJ'); await step(h, 0.6); }
    h.check('the watch strongbox opens', await found(h, 'falls:chest:watch'));
  }

  if (want('thrice')) {
    // Shade Wisps in the crater would pull the horns' aim: clear them first, as a player would.
    await h.eval(() => { const g = window.wyrm; for (const e of g.enemies) if (e.alive && Math.hypot(e.x + 4, e.z - 144) < 20) { e.hp = 0; e.die(null); } });
    await place(h, -4, 144.4, 0, 22.5);
    const bell = await h.eval(() => { const b = window.wyrm.level.hittables.find((t) => t.constructor.name === 'RainBell'); return [b.x, b.y, b.z]; });
    console.log('bell', JSON.stringify(bell), JSON.stringify(await snap(h)));
    for (let i = 0; i < 3; i++) {
      await face(h, bell[0], bell[2]);
      await K(h).press('KeyJ');
      await step(h, 0.8);
      console.log('bell', JSON.stringify(await h.eval(() => { const g = window.wyrm; const b = g.level.hittables.find((t) => t.constructor.name === 'RainBell'); return { rings: b.rings, cd: b.cd, st: g.player.state, yaw: g.player.yaw, x: g.player.x, z: g.player.z }; })));
    }
    const rung = await h.eval(() => window.wyrm.level.fired.has('falls-thrice'));
    h.check('three rings of the Rain Bell call the lightning', rung);
    await step(h, 2);
    await place(h, 3.2, 145.5, Math.PI / 2);
    const s = await walkTo(h, 6.9, 145.5, 3, 0.3);
    h.check('egg in the thunder-struck niche', await found(h, 'falls:egg-thrice'), JSON.stringify(s));
  }

  if (want('spray')) {
    await place(h, 33.5, 101.5, Math.atan2(42.4 - 33.5, 136.5 - 101.5), 1e4, 0.25);
    let s = await glideJump(h, 4.2);
    await releaseAll(h);
    s = s.concat(await track(h, 1.0));
    const e = s[s.length - 1];
    console.log('spray glide', JSON.stringify(e));
    if (e.g && e.y > 19.5 && !(await found(h, 'falls:egg-spray'))) await walkTo(h, 43.2, 136.8, 2, 0.3);
    h.check('glide from the nest to the spray ledge egg', await found(h, 'falls:egg-spray'), JSON.stringify(await snap(h)));
    await face(h, 30, 136.5);
    await K(h).down('KeyW');
    await step(h, 1.2);
    await K(h).up('KeyW');
    await step(h, 4);
    const back = await snap(h);
    h.check('falling off the spray ledge respawns at the nest, not the ledge', back.x < 40 && back.z < 110, JSON.stringify(back));
  }

  if (want('brood')) {
    await place(h, 10, 104, Math.PI / 2);
    const left = await smashAround(h, 13.5, 104, 2.2, 24);
    const s = await walkTo(h, 13.5, 104, 2, 0.3);
    h.check('smash the Gloom cocoons for the brood egg', left && await found(h, 'falls:egg-brood'), JSON.stringify(s));
  }

  if (want('calls')) {
    await place(h, -4, -4, 0.2);
    await step(h, 0.5);
    console.log('landing draw calls', await draw(h));
  }
}
