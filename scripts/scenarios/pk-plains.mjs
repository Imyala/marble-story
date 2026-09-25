// Stonewild Plains new content: the farmstead, the quarry, letters, eggs,
// chests and breakables. `look` checks counts and ground and takes pictures;
// `reach` walks, jumps and glides to every new egg, letter and chest.
import { load, calmEnemies, place, shotFrom, calls, census, waitGame, found } from './pk-lib.mjs';
import { setup } from './plains-lib.mjs';

const top = (h, x, z, from = 1e4) => h.eval(([x, z, from]) => +window.wyrm.col.groundAt(x, z, from, 0.05).y.toFixed(2), [x, z, from]);

export async function look(h) {
  await load(h, 'plains');
  await calmEnemies(h);
  const c = await census(h);
  console.log('census', JSON.stringify(c));
  h.check('four letters placed', c.letters.length === 4, JSON.stringify(c.letters));
  h.check('five eggs placed, plus the thief egg', c.eggs.length === 6, JSON.stringify(c.eggs));
  h.check('two chests', c.chests === 2);
  h.check('40-90 breakables', c.breakables >= 40 && c.breakables <= 90, `${c.breakables}`);
  // Ground where the new areas should be.
  const spots = {
    pass: [27, -5, 1.3], yard: [42, -7, 2], loft: [55, -2, 5], barnFloor: [53, -5, 2], house: [50, -16, 2],
    quarryFloor: [33, 110, 9.5], bridgeMid: [18.4, 112, 10.5], s4: [49.6, 105.6, 16.7], heron: [-22, 204, 12.5], hawk: [-50, 152, 23],
    heightsEdge: [-9, 139.2, 19.3],
  };
  for (const [name, [x, z, want]] of Object.entries(spots)) {
    const y = await top(h, x, z, want + 1.5);
    h.check(`ground at ${name}`, Math.abs(y - want) < 1.2, `${y} want ~${want}`);
  }
  // Existing spots keep their heights.
  for (const [name, [x, z, want]] of Object.entries({ vale: [0, -20, 0.8], meadow: [4, 40, 6.5], terrace: [0, 108, 11.5], heights: [0, 142, 19.3], fields: [-8, 214, 5], perch: [-44, 146, 13] })) {
    const y = await top(h, x, z);
    h.check(`existing ${name} height`, Math.abs(y - want) < 0.3, `${y}`);
  }
  if (process.env.NOSHOT === '1') return;
  await h.eval(() => window.wyrm.hud.show(false));
  const views = [
    ['farm-over', 40, -6, Math.PI / 2, [22, 24, -28], [47, 2, -8]],
    ['farm-yard', 36, -6, Math.PI / 2 + 0.3],
    ['farm-barn', 53, -10, 0.1],
    ['farm-house', 44, -15, Math.PI / 2],
    ['vale-pass', 12, -6, Math.PI / 2],
    ['quarry-over', 30, 110, Math.PI / 2, [18, 26, 95], [40, 9, 110]],
    ['quarry-camp', 27, 112, Math.PI / 2 + 0.6],
    ['quarry-stair', 40, 110, Math.PI / 2 - 0.3],
    ['heights-dolmen', 17, 147, Math.PI / 2],
    ['burrow-nest', 8, 222, 0.8],
    ['meadow-camp', -16, 44, -Math.PI / 2 - 0.2, [-14, 9, 36], [-25, 7, 45]],
    ['heron', -4, 197, -1.2, [-2, 23, 193], [-20, 11, 205]],
  ];
  const only = (process.env.ONLY ?? '').split(',').filter(Boolean);
  const out = [];
  for (const [name, x, z, yaw, pos, lk] of views) {
    if (only.length && !only.includes(name)) continue;
    await place(h, x, z, yaw);
    if (pos) await shotFrom(h, pos, lk);
    out.push(`${name}:${await calls(h)}`);
    await h.shot(`pk-plains-${name}`);
  }
  console.log('draw calls', out.join(' '));
}

export default async function (h) {
  await look(h);
}

// --- reachability: every new egg, letter and chest by its intended route -------------------------------

async function start(h) {
  await h.go('?level=plains&seed=3&quality=low&maxdt=0.1', 3000);
  await h.skipDialogue(8000);
  const t = await setup(h);
  await h.eval(() => {
    const g = window.wyrm;
    if (!g.save.elements.includes('earth')) g.learnElement('earth');
    for (const a of g.level.arenas) a.state = 'cleared';
  });
  return t;
}
const pfound = (h, id) => found(h, `plains:${id}`);
const press = async (h, action, hold = 0.12, after = 0.6) => {
  await h.eval((a) => window.wyrm.input.simulate(a, true), action);
  await waitGame(h, hold);
  await h.eval((a) => window.wyrm.input.simulate(a, false), action);
  await waitGame(h, after);
};
/** Hops from one standing spot to the next top, retrying from the same spot. */
async function hop(h, t, [fx, fz, fy], [tx, tz, ty], label) {
  const want = ty ?? await top(h, tx, tz);
  const from = fy ?? await top(h, fx, fz);
  let s;
  for (let i = 0; i < 3; i++) {
    await t.tp(fx, fz, Math.atan2(tx - fx, tz - fz), from);
    await t.jumpTo(tx, tz, true);
    s = await h.state();
    if (Math.abs(s.y - want) < 0.35) break;
  }
  h.check(label, Math.abs(s.y - want) < 0.35, `${JSON.stringify(s)} top ${want}`);
}

export async function farm(h) {
  const t = await start(h);
  // Through the pass from the Vale, on foot.
  await t.tp(16, -5, Math.PI / 2);
  await t.walkTo(24, -5, 0.8, 8);
  await t.walkTo(33, -5, 0.8, 8);
  await t.walkTo(40, -6.5, 0.8, 8);
  let s = await h.state();
  h.check('walked from the Vale through the pass into the farmyard', s.x > 38.5 && Math.abs(s.y - 2) < 0.6, JSON.stringify(s));
  h.check('the farm story trigger fired', await h.eval(() => !!window.wyrm.save.found['story:plains:farm']));
  await h.shot('pk-reach-farm');
  // Tamsin's letter by the door.
  await t.tp(45.4, -12.2, Math.PI);
  await t.walkTo(45.4, -14.3, 0.3, 4);
  h.check('Tamsin\'s letter by the farmhouse door', await found(h, 'letter:plains:herder'));
  await h.skipDialogue(2000);
  // The boarded door: tail whips smash it, then the chest inside.
  const door = () => h.eval(() => window.wyrm.level.hittables.find((x) => x.kind === 'wood' && Math.abs(x.x - 47.25) < 0.2)?.alive);
  for (let i = 0; i < 6 && (await door()); i++) {
    await t.tp(45.4, -16, Math.PI / 2);
    await press(h, 'tail', 0.12, 0.9);
  }
  h.check('tail whips smash the boarded farmhouse door', (await door()) === false);
  await t.walkTo(49.5, -16, 0.5, 5);
  await t.walkTo(52.4, -16.3, 0.4, 5);
  for (let i = 0; i < 3 && !(await pfound(h, 'chest:cellar')); i++) {
    await t.face(Math.PI / 2);
    await press(h, 'horn', 0.12, 1.0);
  }
  h.check('the cellar chest opens', await pfound(h, 'chest:cellar'));
  await h.shot('pk-reach-cellar');
  // The hayloft: floor, bale stack, loft, then past the baskets to the egg.
  const fy = await top(h, 54.6, -7.4, 3);
  await hop(h, t, [54.6, -7.4, fy], [55.1, -5.3, fy + 1.58], 'jump onto the hay bale stack');
  await hop(h, t, [55.1, -5.3, fy + 1.58], [53.6, -2.6, fy + 3.0], 'jump from the bales up into the loft');
  await t.face(Math.PI / 2);
  await press(h, 'tail', 0.12, 0.9);
  await press(h, 'horn', 0.12, 0.8);
  await t.walkTo(56.2, -1.5, 0.3, 5);
  s = await h.state();
  h.check('the hayloft egg', await pfound(h, 'egg-hayloft'), JSON.stringify(s));
  await h.shot('pk-reach-hayloft');
}

export async function quarryRoute(h) {
  const t = await start(h);
  // Across the plank bridge from the Colonnade.
  await t.tp(4, 112, Math.PI / 2);
  await t.walkTo(12, 112, 0.8, 8);
  await t.walkTo(28, 112, 0.8, 10);
  let s = await h.state();
  h.check('walked the plank bridge from the Colonnade to the quarry', s.x > 26.5 && Math.abs(s.y - 9.5) < 0.6, JSON.stringify(s));
  await h.shot('pk-reach-quarry');
  await t.walkTo(29, 114.6, 0.3, 4);
  h.check('the foreman\'s notice', await found(h, 'letter:plains:foreman'));
  await h.skipDialogue(2000);
  // The cutting stair.
  const steps = [[40.6, 114.6], [43, 113.5], [46.2, 111.8], [48.6, 109.2], [49.8, 105.6]];
  for (let i = 1; i < steps.length; i++) await hop(h, t, steps[i - 1], steps[i], `cutting stair block ${i}`);
  h.check('the egg on the top block', await pfound(h, 'egg-topblock'));
  await h.shot('pk-reach-topblock');
  // The cracked seam: fire and horns do nothing, an Earth boulder breaks it.
  const seam = () => h.eval(() => window.wyrm.level.hittables.find((x) => x.kind === 'rock' && Math.abs(x.z - 116.2) < 0.2)?.alive);
  await t.tp(38, 113.2, 0);
  await t.breathe('Digit1', 900);
  await press(h, 'horn', 0.12, 0.6);
  h.check('fire and horns leave the seam alone', (await seam()) === true);
  for (let i = 0; i < 4 && (await seam()); i++) {
    await t.tp(38, 113.2, 0);
    await h.eval(() => { window.wyrm.player.mana = 100; });
    await h.tap('Digit4');
    await h.tap('KeyU', 1, 1400);
  }
  h.check('an Earth boulder breaks the seam', (await seam()) === false);
  await t.walkTo(38, 117, 0.4, 5);
  for (let i = 0; i < 3 && !(await pfound(h, 'chest:seam')); i++) {
    await t.face(0);
    await press(h, 'horn', 0.12, 1.0);
  }
  h.check('the seam chest opens', await pfound(h, 'chest:seam'));
}

export async function air(h) {
  const t = await start(h);
  // Heron Rock: glide off the north ledge.
  for (let i = 0; i < 3 && !(await pfound(h, 'egg-heron')); i++) {
    await t.tp(-3.5, 196.6, Math.atan2(-18.5, 7.6));
    await h.eval(() => { window.__auto = { kind: 'jump', x: -22, z: 204.2, stop: 0.3, slow: 1.2, flap: true, flapAt: 0.26, glide: true, maxT: 8 }; });
    for (let k = 0; k < 140; k++) {
      await h.wait(100);
      const q = await h.eval(() => { const p = window.wyrm.player; const a = window.__auto; return { d: Math.hypot(p.x - a.x, p.z - a.z), done: a.done, y: p.y }; });
      if (q.d < 1.1) await h.eval(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' })));
      if (q.done) break;
    }
    await h.wait(400);
  }
  let s = await h.state();
  h.check('glided from the north ledge onto Heron Rock for its egg', await pfound(h, 'egg-heron'), JSON.stringify(s));
  await h.shot('pk-reach-heron');
  // The thermal: land on the Hawk's Perch, ride the warm air up, glide to the tall hoodoo.
  await t.tp(-44, 146, -Math.PI / 2);
  await h.wait(600);
  let ok = false;
  for (let i = 0; i < 3 && !ok; i++) {
    await t.tp(-41.6, 146, -Math.PI / 2);
    await h.eval(() => { window.__auto = { kind: 'jump', x: -46, z: 146, stop: 0.2, slow: 0.8, flap: true, flapAt: 0.26, glide: true, maxT: 16 }; });
    let phase = 0;
    let peak = 0;
    for (let k = 0; k < 220; k++) {
      await h.wait(100);
      const q = await h.eval(() => { const p = window.wyrm.player; const a = window.__auto; return { x: p.x, z: p.z, y: p.y, gl: p.gliding, done: a.done, d: Math.hypot(p.x + 50, p.z - 152) }; });
      peak = Math.max(peak, q.y);
      // Circle over the thermal until high enough, then head for the hoodoo and drop onto it.
      if (phase === 0 && q.gl) await h.eval(() => { window.__auto.x = -44; window.__auto.z = 146; });
      if (phase === 0 && q.y > 26.5) { phase = 1; await h.eval(() => { window.__auto.x = -50; window.__auto.z = 152; }); }
      if (phase === 1 && q.d < 0.9) { phase = 2; await h.eval(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }))); }
      if (q.done) break;
    }
    await h.wait(500);
    ok = await pfound(h, 'egg-thermal');
    s = await h.state();
    console.log('  thermal try', i, 'peak', peak.toFixed(1), JSON.stringify(s));
  }
  h.check('rode the thermal up and dropped onto the tall hoodoo for its egg', ok, JSON.stringify(s));
  await h.shot('pk-reach-thermal');
}

export async function finds(h) {
  const t = await start(h);
  // The Gloom egg pile: smash a cocoon, step in.
  await t.tp(11.8, 228.4, Math.PI / 2);
  await press(h, 'tail', 0.12, 0.9);
  await t.walkTo(15, 228.4, 0.3, 5);
  let s = await h.state();
  h.check('the egg inside the ring of cocoons', await pfound(h, 'egg-podnest'), JSON.stringify(s));
  await t.tp(-11.4, 216.2, 0);
  await t.walkTo(-11.4, 218.4, 0.3, 4);
  h.check('the Gloom orders by the camp', await found(h, 'letter:plains:orders'));
  await h.skipDialogue(2000);
  // Stonehide's words under the dolmen.
  await t.tp(20, 147.5, Math.PI / 2);
  await t.walkTo(22.6, 147.5, 0.3, 4);
  s = await h.state();
  h.check('Stonehide\'s letter under the dolmen', await found(h, 'letter:plains:stonehide'), JSON.stringify(s));
  await h.skipDialogue(2000);
  // The raiders' powder kegs go up with fire, and chain.
  const kegs = () => h.eval(() => window.wyrm.level.hittables.filter((x) => x.kind === 'keg' && x.alive && Math.hypot(x.x - 42, x.z + 12.3) < 2).length);
  const k0 = await kegs();
  await t.tp(38.6, -12.4, Math.PI / 2);
  await t.breathe('Digit1', 1200);
  await h.wait(1500);
  const k1 = await kegs();
  h.check('fire sets off the raiders\' powder kegs and they chain', k0 === 3 && k1 === 0, `${k0} -> ${k1}`);
}
