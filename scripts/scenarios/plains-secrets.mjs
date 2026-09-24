// Stonewild Plains: every secret is reachable with the tools the player has
// at that point, and the Earth shard really needs Earth.
import { setup } from './plains-lib.mjs';

export default async function (h) {
  await h.go('?level=plains&seed=3&quality=low&maxdt=0.25', 3000);
  await h.skipDialogue();
  const t = await setup(h);
  const top = (x, z) => h.eval(([x, z]) => window.wyrm.col.groundAt(x, z, 1e4, 0.05).y, [x, z]);
  let s;
  /** One jump from a standing spot to a top, retried from the same spot if it misses. */
  const hop = async ([fx, fz], [tx, tz], label, flap = null) => {
    const want = await top(tx, tz);
    const from = await top(fx, fz);
    for (let i = 0; i < 3; i++) {
      await t.tp(fx, fz, Math.atan2(tx - fx, tz - fz), from);
      await t.jumpTo(tx, tz, flap ?? want - from > 2.1);
      s = await h.state();
      if (Math.abs(s.y - want) < 0.3) break;
    }
    h.check(label, Math.abs(s.y - want) < 0.3, `${JSON.stringify(s)} top ${want.toFixed(2)}`);
  };

  // relic1: the Sleeping Giant hoodoos.
  const hoodoos = [[-12.8, -1.4], [-15.5, -2.5], [-18, -5], [-20.8, -3.3]];
  for (let i = 1; i < hoodoos.length; i++) await hop(hoodoos[i - 1], hoodoos[i], `hoodoo ${i}`);
  h.check('relic plains1 on the tallest hoodoo', await t.found('relic1'));
  await h.shot('sec-hoodoo');

  // relic3: the spiral of standing stones.
  const sp = { x: -36, z: 56 };
  const stones = [0, 1, 2, 3, 4].map((i) => [sp.x + Math.sin(i * 1.1) * 3.9, sp.z + Math.cos(i * 1.1) * 3.9]);
  const [s0x, s0z] = stones[0];
  const path = [[s0x - 2.5, s0z + 1.5], ...stones];
  for (let i = 1; i < path.length; i++) await hop(path[i - 1], path[i], `spiral stone ${i}`, true);
  s = await h.state();
  h.check('climbed the spiral of stones', s.y > 13.5, JSON.stringify(s));
  h.check('relic plains3 on top of the spiral', await t.found('relic3'));
  await h.shot('sec-spiral');

  // heart2: the overgrown shrine in the Meadow.
  await t.tp(31.5, 73, Math.PI / 2);
  await t.breathe('Digit1', 1200);
  await t.walkTo(37.6, 73, 0.5, 6);
  h.check('heart2 behind the burned vines', await t.found('heart2'));

  // heart1: the Needle, from the second gorge spring, and back.
  await h.eval(() => {
    const g = window.wyrm;
    const gs = g.level.props.filter((p) => p.frozen !== undefined);
    gs[2].freeze();
  });
  await t.tp(4, 128, Math.PI / 2, 14.6);
  await t.jumpTo(11.2, 127.6);
  s = await h.state();
  h.check('landed on the Needle', Math.abs(s.y - 13.6) < 0.3, JSON.stringify(s));
  h.check('heart1 on the Needle', await t.found('heart1'));
  await t.jumpTo(4, 128);
  s = await h.state();
  h.check('jumped back to the frozen spring', Math.abs(s.y - 14.6) < 0.3, JSON.stringify(s));

  // mana1: glide to the Hawk's Perch, ride the thermal back up.
  await t.tp(-27, 146, -Math.PI / 2);
  await h.eval(() => { window.__auto = { kind: 'jump', x: -42, z: 146, stop: 0.4, slow: 1.5, flap: true, flapAt: 0.26, glide: true, maxT: 8, dropAt: 1.5 }; });
  for (let i = 0; i < 120; i++) {
    await h.wait(100);
    const q = await h.eval(() => { const p = window.wyrm.player; const a = window.__auto; return { d: Math.hypot(p.x - a.x, p.z - a.z), done: a.done }; });
    // Let go of glide once over the perch and drop onto it.
    if (q.d < 2.5) await h.eval(() => { window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' })); });
    if (q.done) break;
  }
  await h.wait(400);
  s = await h.state();
  h.check('glided down to the Hawk\'s Perch', Math.abs(s.y - 13) < 0.6 && s.x < -39, JSON.stringify(s));
  h.check('mana1 on the Perch', await t.found('mana1'));
  // Running jump west into the thermal, then turn round for the Heights.
  await t.tp(-41.6, 146, -Math.PI / 2);
  await h.eval(() => { window.__auto = { kind: 'jump', x: -60, z: 146, stop: 0.4, slow: 1.5, flap: true, flapAt: 0.26, glide: true, maxT: 12 }; });
  let turned = false;
  for (let i = 0; i < 160; i++) {
    await h.wait(100);
    const q = await h.eval(() => ({ y: window.wyrm.player.y, gl: window.wyrm.player.gliding, done: window.__auto.done }));
    if (!turned && q.gl) { turned = true; await h.eval(() => { window.__auto.x = -24; }); }
    if (q.done) break;
  }
  await h.wait(400);
  s = await h.state();
  h.check('the thermal lifts you back onto the Heights', s.y > 19 && s.x > -29, JSON.stringify(s));
  await h.shot('sec-perch');

  // relic2: the hidden plate in the Burrow Fields opens a cairn.
  await t.tp(-22, 214.5, 0);
  await t.auto({ kind: 'jump', x: -22, z: 214.5, stop: 0.3, slow: 1, flap: false, slam: true, slamAt: 0.3 });
  await h.wait(2500);
  const cairn = await h.eval(() => window.wyrm.level.fired.has('plains-cairn'));
  h.check('pounding the hidden plate opens the cairn', cairn);
  await t.walkTo(-24, 219.5, 0.5, 5);
  await t.walkTo(-24, 222, 0.4, 4);
  h.check('relic plains2 inside the cairn', await t.found('relic2'));

  // mana2: the cracked alcove only breaks with Earth.
  await t.tp(15.2, -16, Math.PI / 2);
  await t.breathe('Digit1', 900);
  await t.breathe('Digit3', 900);
  await h.tap('KeyJ', 3, 250);
  await h.tap('KeyE', 1, 450);
  let gate = await h.eval(() => window.wyrm.level.hittables.find((x) => x.kind === 'rock').alive);
  h.check('fire, ice and horns do not break the cracked rock', gate === true);
  await h.eval(() => { window.wyrm.learnElement('earth'); });
  for (let i = 0; i < 4 && gate; i++) {
    await t.face(Math.PI / 2);
    await h.eval(() => { window.wyrm.player.mana = 100; });
    await h.tap('Digit4');
    await h.tap('KeyU', 1, 1400);
    gate = await h.eval(() => window.wyrm.level.hittables.find((x) => x.kind === 'rock').alive);
  }
  h.check('an Earth boulder breaks the cracked rock', gate === false);
  await t.walkTo(20.4, -16, 0.4, 5);
  h.check('mana2 in the alcove', await t.found('mana2'));
  const total = await h.eval(() => Object.keys(window.wyrm.save.found).filter((k) => /^plains:(heart|mana|relic)\d$/.test(k)).sort());
  h.check('all 7 secrets collected', total.length === 7, JSON.stringify(total));
}
