// Eclipse Keep new content: the hatchery, the storehouse, Nyxa's nest, the
// Moonwatch, the ledge under the bridge and the bastion armory. `look` checks
// counts and ground and takes pictures; the other parts reach every new
// egg, letter and chest by its intended route.
import { load, calmEnemies, place, shotFrom, calls, census, waitGame, found } from './pk-lib.mjs';
import { setup } from './plains-lib.mjs';

const top = (h, x, z, from = 1e4) => h.eval(([x, z, from]) => +window.wyrm.col.groundAt(x, z, from, 0.05).y.toFixed(2), [x, z, from]);

export async function look(h) {
  await load(h, 'keep');
  await calmEnemies(h);
  const c = await census(h);
  console.log('census', JSON.stringify(c));
  h.check('four letters placed', c.letters.length === 4, JSON.stringify(c.letters));
  h.check('five eggs placed', c.eggs.length === 5, JSON.stringify(c.eggs));
  h.check('two chests', c.chests === 2);
  h.check('40-90 breakables', c.breakables >= 40 && c.breakables <= 90, `${c.breakables}`);
  const spots = {
    causewayEnd: [-29, -115.2, 8.2], islA: [-33, -115.5, 8.2], islB: [-40.8, -110.8, 9.3], crumble: [-47.4, -108.1, 10.1], hatchery: [-57, -106, 10.5],
    storehouseYard: [38, -106, 9], storeRoof: [45.3, -100, 12.5], storeInside: [47, -101.5, 9], pier: [53.4, -106.4, 9],
    nestIslet: [-27, -157, 9], stone1: [-18.8, -155.8, 8.4], moonwatch: [-24.6, -221.8, 13], ledge: [7.1, -21.2, -3], armory: [11, -54, 6],
  };
  for (const [name, [x, z, want]] of Object.entries(spots)) {
    const y = await top(h, x, z, want + 1.5);
    h.check(`ground at ${name}`, Math.abs(y - want) < 0.8, `${y} want ~${want}`);
  }
  for (const [name, [x, z, want]] of Object.entries({ landing: [0, 2, 4], bastion: [0, -52, 6], court: [0, -108, 8], hall: [0, -150, 8], terrace: [0, -226, 20] })) {
    const y = await top(h, x, z);
    h.check(`existing ${name} height`, Math.abs(y - want) < 0.5, `${y}`);
  }
  if (process.env.NOSHOT === '1') return;
  await h.eval(() => window.wyrm.hud.show(false));
  const views = [
    ['hatch-over', -40, -110, -Math.PI / 2, [-30, 26, -88], [-52, 8, -106]],
    ['hatch-in', -52, -106, -Math.PI / 2 - 0.3],
    ['hatch-path', -18, -114.5, -Math.PI / 2],
    ['store-over', 38, -106, Math.PI / 2, [26, 24, -122], [44, 8, -103]],
    ['store-yard', 37.5, -106.5, Math.PI / 2 + 0.4],
    ['store-roof', 45, -101.5, Math.PI / 2],
    ['court', 0, -95, Math.PI],
    ['hall', 0, -142, Math.PI],
    ['nest', -25.6, -157.6, -Math.PI / 2 - 0.3],
    ['moonwatch', -8, -223, -Math.PI / 2, [-6, 26, -214], [-24, 12, -222]],
    ['ledge', 1.2, -17, 1.2, [0, 8, -12], [7, -3, -22]],
    ['armory', 4, -54, Math.PI / 2],
  ];
  const only = (process.env.ONLY ?? '').split(',').filter(Boolean);
  const out = [];
  for (const [name, x, z, yaw, pos, lk] of views) {
    if (only.length && !only.includes(name)) continue;
    await place(h, x, z, yaw);
    if (pos) await shotFrom(h, pos, lk);
    out.push(`${name}:${await calls(h)}`);
    await h.shot(`pk-keep-${name}`);
  }
  console.log('draw calls', out.join(' '));
}

export default async function (h) {
  await look(h);
}

// --- reachability ----------------------------------------------------------------------------------

async function start(h, extra = '') {
  await h.go(`?level=keep&seed=3&quality=low&maxdt=0.1${extra}`, 3000);
  await h.skipDialogue(8000);
  const t = await setup(h);
  await h.eval(() => {
    const g = window.wyrm;
    if (!g.save.elements.includes('earth')) g.learnElement('earth');
    for (const a of g.level.arenas) if (a.id !== 'hatchery') a.state = 'cleared';
    g.player.invuln = true;
  });
  return t;
}
const kfound = (h, id) => found(h, `keep:${id}`);
const press = async (h, action, hold = 0.12, after = 0.6) => {
  await h.eval((a) => window.wyrm.input.simulate(a, true), action);
  await waitGame(h, hold);
  await h.eval((a) => window.wyrm.input.simulate(a, false), action);
  await waitGame(h, after);
};
async function hop(h, t, [fx, fz, fy], [tx, tz, ty], label) {
  const want = ty ?? await top(h, tx, tz);
  const from = fy ?? await top(h, fx, fz);
  let s;
  for (let i = 0; i < 3; i++) {
    await t.tp(fx, fz, Math.atan2(tx - fx, tz - fz), from);
    await t.jumpTo(tx, tz, true);
    s = await h.state();
    if (Math.abs(s.y - want) < 0.4) break;
  }
  h.check(label, Math.abs(s.y - want) < 0.4, `${JSON.stringify(s)} top ${want}`);
}
/** Jump, flap and glide toward (x, z); let go over the target and drop onto it. */
async function glide(h, t, from, [x, z], release = 1.0, maxT = 10) {
  await t.tp(from[0], from[1], Math.atan2(x - from[0], z - from[1]), from[2]);
  await h.eval(([x, z, maxT]) => { window.__auto = { kind: 'jump', x, z, stop: 0.3, slow: 1.2, flap: true, flapAt: 0.26, glide: true, maxT }; }, [x, z, maxT]);
  for (let k = 0; k < 160; k++) {
    await h.wait(100);
    const q = await h.eval(() => { const p = window.wyrm.player; const a = window.__auto; return { d: Math.hypot(p.x - a.x, p.z - a.z), done: a.done }; });
    if (q.d < release) await h.eval(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' })));
    if (q.done) break;
  }
  await h.wait(400);
  return h.state();
}
/** Jump and glide inside an updraft, circling over (ux, uz) until high, then head for (x, z). */
async function ride(h, t, [ux, uz, uy], high, [x, z], release = 1.2) {
  await t.tp(ux + 0.3, uz, 0, uy);
  await h.eval(([ux, uz]) => { window.__auto = { kind: 'jump', x: ux - 0.5, z: uz - 0.5, stop: 0.2, slow: 0.8, flap: true, flapAt: 0.26, glide: true, maxT: 18 }; }, [ux, uz]);
  let phase = 0;
  let peak = -99;
  for (let k = 0; k < 240; k++) {
    await h.wait(100);
    const q = await h.eval(([x, z]) => { const p = window.wyrm.player; const a = window.__auto; return { y: p.y, gl: p.gliding, done: a.done, d: Math.hypot(p.x - x, p.z - z) }; }, [x, z]);
    peak = Math.max(peak, q.y);
    if (phase === 0 && q.gl) await h.eval(([ux, uz]) => { window.__auto.x = ux; window.__auto.z = uz; }, [ux, uz]);
    if (phase === 0 && q.y > high) { phase = 1; await h.eval(([x, z]) => { window.__auto.x = x; window.__auto.z = z; }, [x, z]); }
    if (phase === 1 && q.d < release) { phase = 2; await h.eval(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }))); }
    if (q.done) break;
  }
  await h.wait(500);
  const s = await h.state();
  console.log('  ride peak', peak.toFixed(1), JSON.stringify(s));
  return s;
}

export async function hatch(h) {
  const t = await start(h);
  // Out of the court's west arch, along the causeway, over the rocks and the crumbling stone.
  await t.tp(-16, -114.5, -Math.PI / 2);
  await t.walkTo(-24, -114.8, 0.8, 8);
  await t.walkTo(-31, -115.4, 0.8, 8);
  let s = await h.state();
  h.check('walked the causeway to the first rock', s.x < -29.5 && Math.abs(s.y - 8.2) < 0.6, JSON.stringify(s));
  await hop(h, t, [-34.8, -114.6], [-40.8, -110.8], 'jump to the second rock');
  await t.tp(-42.4, -110.2, Math.atan2(-5, 2.1), await top(h, -42.4, -110.2));
  await t.jumpTo(-47.4, -108.1, false);
  s = await h.state();
  h.check('landed on the crumbling stone', Math.abs(s.y - 10.1) < 0.4, JSON.stringify(s));
  await t.jumpTo(-53, -106, true);
  s = await h.state();
  h.check('jumped from the crumbling stone to the hatchery', s.x < -51 && Math.abs(s.y - 10.5) < 0.6, JSON.stringify(s));
  const crumbled = await h.eval(() => window.wyrm.level.props.some((p) => p.constructor.name === 'CrumblePlatform' && p.timer === -1 && p.down > 0));
  h.check('the stone crumbled behind us', crumbled);
  await h.shot('pk-reach-hatchery');
  await t.walkTo(-54.4, -100.4, 0.3, 5);
  h.check('the hatchery ledger on the lectern', await found(h, 'letter:keep:ledger'));
  await h.skipDialogue(2000);
  // The keepers: the arena starts, clearing it unseals the strongbox.
  await t.walkTo(-58, -102, 0.6, 5);
  await h.wait(1500);
  let st = '';
  for (let w = 0; w < 14; w++) {
    await h.wait(1200);
    st = await h.eval(() => {
      const g = window.wyrm;
      const a = g.level.arenas.find((q) => q.id === 'hatchery');
      for (const e of g.enemies) if (e.alive && e.state !== 'spawn' && Math.hypot(e.x - a.x, e.z - a.z) < a.r + 2) e.die(null);
      return a.state;
    });
    if (st === 'cleared') break;
  }
  h.check('the hatchery keepers arena clears', st === 'cleared', st);
  await h.wait(1500);
  h.check('clearing it opens the shadow vault', await h.eval(() => window.wyrm.level.fired.has('hatchery-open')));
  await t.walkTo(-60, -96.6, 0.3, 5);
  for (let i = 0; i < 3 && !(await kfound(h, 'chest:hatchery')); i++) {
    await t.face(0);
    await press(h, 'horn', 0.12, 1.0);
  }
  h.check('the hatchery strongbox opens', await kfound(h, 'chest:hatchery'));
  await t.walkTo(-62.6, -106.4, 0.4, 6);
  await t.walkTo(-62.6, -107.5, 0.3, 4);
  h.check('the egg in the last full nest', await kfound(h, 'egg-hatchery'));
  // Home again: a glide from the hatchery's edge carries back to the court.
  s = await glide(h, t, [-51.8, -106.4, 10.5], [-19, -113], 0.2, 12);
  h.check('glided home from the hatchery to the court', s.x > -21 && Math.abs(s.y - 8) < 0.8, JSON.stringify(s));
}

export async function store(h) {
  const t = await start(h);
  // Ride the barge across.
  await t.tp(20.8, -108, Math.PI / 2);
  await h.eval(() => new Promise((res) => {
    const m = window.wyrm.level.props.filter((q) => q.constructor.name === 'MovingPlatform')[2];
    const i = setInterval(() => { if (Math.hypot(m.solid.x - 23.4, m.solid.z + 108) < 0.3) { clearInterval(i); res(); } }, 40);
  }));
  await t.walkTo(23.6, -108, 0.3, 3);
  let s = await h.state();
  h.check('stepped onto the barge', s.x > 22.3 && Math.abs(s.y - 8) < 0.7, JSON.stringify(s));
  await h.eval(() => new Promise((res) => {
    const m = window.wyrm.level.props.filter((q) => q.constructor.name === 'MovingPlatform')[2];
    const i = setInterval(() => { if (Math.hypot(m.solid.x - 34.2, m.solid.z + 106) < 0.3) { clearInterval(i); res(); } }, 40);
  }));
  await t.walkTo(37.2, -106, 0.5, 4);
  s = await h.state();
  h.check('rode the barge to the storehouse', s.x > 36 && Math.abs(s.y - 9) < 0.6, JSON.stringify(s));
  await h.shot('pk-reach-store');
  // The guards' kegs: one breath of fire and the whole pile goes.
  const kegs = () => h.eval(() => window.wyrm.level.hittables.filter((x) => x.kind === 'keg' && x.alive && x.x > 37 && x.z < -108).length);
  const k0 = await kegs();
  await t.tp(36.4, -108.4, Math.atan2(3.2, -1.3));
  await t.breathe('Digit1', 1200);
  await h.wait(1500);
  h.check('fire sets off the barge kegs, and they chain', k0 === 4 && (await kegs()) === 0, `${k0} -> ${await kegs()}`);
  // The cook's note, the barricade, and the strongbox inside.
  await t.tp(40.4, -99.6, Math.PI / 2);
  await t.walkTo(41.9, -99.6, 0.3, 4);
  h.check('the cook\'s note by the door', await found(h, 'letter:keep:cook'));
  await h.skipDialogue(2000);
  const door = () => h.eval(() => window.wyrm.level.hittables.find((x) => x.kind === 'wood' && Math.abs(x.x - 43.2) < 0.2)?.alive);
  for (let i = 0; i < 6 && (await door()); i++) {
    await t.tp(41.6, -101, Math.PI / 2);
    await press(h, 'tail', 0.12, 0.9);
  }
  h.check('the barricade breaks', (await door()) === false);
  await t.walkTo(45, -101, 0.4, 5);
  await t.walkTo(47.9, -101, 0.4, 5);
  for (let i = 0; i < 3 && !(await kfound(h, 'chest:pantry')); i++) {
    await t.face(Math.PI / 2);
    await press(h, 'horn', 0.12, 1.0);
  }
  h.check('the storehouse strongbox opens', await kfound(h, 'chest:pantry'));
  // Up the cargo onto the roof.
  const gy = await top(h, 45.1, -107.6);
  await hop(h, t, [45.1, -107.6, gy], [45.1, -105.6, gy + 1.2], 'jump onto the first cargo box');
  await hop(h, t, [45.1, -105.6, gy + 1.2], [47, -104.3, gy + 2.4], 'jump onto the tall cargo box');
  await hop(h, t, [47, -104.3, gy + 2.4], [46.4, -102.2, gy + 3.5], 'jump onto the storehouse roof');
  await t.walkTo(45.3, -100.1, 0.3, 5);
  s = await h.state();
  h.check('the egg on the storehouse roof', await kfound(h, 'egg-roof'), JSON.stringify(s));
}

export async function small(h) {
  const t = await start(h);
  // Under the broken bridge: drop to the ledge, then the warm air back up to the far span.
  let s = await glide(h, t, [1.2, -17.2, 4.5], [7.1, -21.2], 1.2, 8);
  h.check('dropped from the bridge end to the ledge egg', await kfound(h, 'egg-ledge'), JSON.stringify(s));
  s = await ride(h, t, [6.4, -20.6, -3], 8.5, [0, -27], 1.4);
  h.check('the ledge updraft carries back up to the far span', s.z < -24 && s.y > 4.4, JSON.stringify(s));
  // The bastion armory: through the crates.
  await t.tp(7.8, -54, Math.PI / 2);
  for (let i = 0; i < 4; i++) {
    await t.face(Math.PI / 2);
    await press(h, 'tail', 0.12, 0.9);
  }
  await t.walkTo(11, -54, 0.3, 5);
  s = await h.state();
  h.check('smashed through the armory crates to its egg', await kfound(h, 'egg-armory'), JSON.stringify(s));
  // Nyxa's nest, over two stones off the hall.
  const hallY = await top(h, -13.4, -155.6);
  await hop(h, t, [-13.4, -155.6, hallY], [-18.8, -155.8, 8.4], 'jump to the first stone off the hall');
  await hop(h, t, [-18.8, -155.8, 8.4], [-22.4, -157.3, 8.9], 'jump to the second stone');
  await hop(h, t, [-22.4, -157.3, 8.9], [-26.4, -157.8, 9], 'jump to Nyxa\'s rock');
  await t.walkTo(-28.4, -158.4, 0.3, 4);
  h.check('Nyxa\'s diary page in her nest', await found(h, 'letter:keep:nyxa-diary'));
  await h.skipDialogue(2000);
  // The Moonwatch: glide down from the terrace, read, and ride the wind home.
  s = await glide(h, t, [-7.8, -220.6, 20], [-24.3, -221.3], 1.0, 10);
  h.check('glided from the terrace to the Moonwatch egg', await kfound(h, 'egg-moonwatch'), JSON.stringify(s));
  await t.walkTo(-22.8, -220.4, 0.3, 4);
  h.check('the captain\'s last words by the telescope', await found(h, 'letter:keep:deserter'));
  await h.skipDialogue(2000);
  s = await ride(h, t, [-23, -219.2, 13], 22.5, [-4, -225], 1.5);
  h.check('the Moonwatch updraft carries back to the terrace', s.y > 19.5 && s.x > -9, JSON.stringify(s));
}
