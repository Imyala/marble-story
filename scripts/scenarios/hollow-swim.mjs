/**
 * Swimming and diving in the Hollow Gate's lake, and Act I water unchanged.
 *   node scripts/play.mjs hollow-swim           (everything)
 *   node scripts/play.mjs hollow-swim:lake      (float, paddle, dive, breath, drowning, leap out, climb a pier)
 *   node scripts/play.mjs hollow-swim:fen       (deep water in the Fen still washes Aster back ashore)
 */
import { boot, place, step, down, up, stick, stop, pos, press, face, shot } from './hollow-lib.mjs';

export async function lake(h) {
  await boot(h);
  // Walk off the north shore into the lake.
  await place(h, 4, 43, Math.PI);
  await face(h, Math.PI, 0.3);
  await stick(h, 0, 1);
  let swam = false;
  for (let i = 0; i < 40 && !swam; i++) {
    await step(h, 0.1);
    swam = (await pos(h)).st === 'swim';
  }
  await step(h, 0.8);
  await stop(h);
  await step(h, 0.6);
  let p = await pos(h);
  const safe = await h.eval(() => ({ z: window.wyrm.player.lastSafe.z, fell: window.wyrm.state }));
  h.check('walking into deep water starts a swim, not a respawn', swam && p.st === 'swim' && safe.fell === 'play', JSON.stringify({ p, safe }));
  h.check('Aster floats at the surface', p.y > -1.1 && p.y < -0.5 && !p.under, JSON.stringify(p));
  await shot(h, 'hollow-swim-surface');
  // Side-on, paddling: body level, wings folded, legs and tail working.
  await stick(h, 0, 1);
  await step(h, 0.8);
  await face(h, Math.PI / 2, 0.15);
  await stick(h, -1, 0);
  await step(h, 0.5);
  await shot(h, 'hollow-swim-side', false);
  await stop(h);
  // Out over the deepest part of the lake, heading west, for the dives.
  await place(h, -2, 17, -Math.PI / 2, -0.8);
  await face(h, -Math.PI / 2, 0.3);
  await step(h, 0.5);
  p = await pos(h);

  // Paddle: a little slower than running, and it turns like running.
  const x0 = p.x;
  await stick(h, 0, 1);
  await step(h, 1.5);
  p = await pos(h);
  const sp = await h.eval(() => Math.hypot(window.wyrm.player.body.vx, window.wyrm.player.body.vz));
  h.check('paddling moves across the lake', x0 - p.x > 5 && p.st === 'swim', `${x0} -> ${p.x}`);
  h.check('swimming is a bit slower than running', sp > 4.5 && sp < 8.5, sp.toFixed(2));
  await stop(h);

  // Hold Dodge to dive.
  await down(h, 'dodge');
  await step(h, 0.9);
  await up(h, 'dodge');
  p = await pos(h);
  h.check('holding Dodge dives under', p.under && p.sub && p.y < -2, JSON.stringify(p));
  await step(h, 2.0);
  p = await pos(h);
  h.check('let go, Aster stays under (drifting up only a little)', p.under && p.y < -1.8, JSON.stringify(p));
  h.check('breath drains underwater', p.air < 15 - 2.5, `${p.air}`);
  h.check('the camera follows under the surface, tinted', p.camY < 0 && p.uw === 1, JSON.stringify(p));
  const meter = await h.eval(() => {
    window.__draw();
    const e = document.querySelector('.air-meter');
    const r = e.getBoundingClientRect();
    return { shown: e.style.display === 'block' && Number(e.style.opacity) > 0.5, on: r.y > 0 && r.bottom < innerHeight && r.x > 0 && r.right < innerWidth, arc: e.querySelector('.arc').getAttribute('stroke-dashoffset') };
  });
  h.check('the breath meter shows beside the diving dragon, part empty', meter.shown && meter.on && Number(meter.arc) > 5, JSON.stringify(meter));
  await shot(h, 'hollow-swim-under');
  await face(h, 0, 0.1);
  await stick(h, -1, 0);
  await step(h, 0.6);
  await shot(h, 'hollow-swim-under-side');
  await stop(h);
  await face(h, -Math.PI / 2, 0.3);
  await step(h, 0.3);
  p = await pos(h);
  // Swim forward underwater, looking down: the stroke dives deeper.
  await face(h, -Math.PI / 2, 0.9);
  const y0 = p.y;
  await stick(h, 0, 1);
  await step(h, 1.0);
  await stop(h);
  p = await pos(h);
  h.check('tilting the view down steers the swim down', p.y < y0 - 1, `${y0} -> ${p.y}`);
  await face(h, -Math.PI / 2, 0.3);
  // Jump rises; back at the top, air comes back.
  await down(h, 'jump');
  for (let i = 0; i < 40; i++) {
    await step(h, 0.1);
    if (!(await pos(h)).under) break;
  }
  await up(h, 'jump');
  p = await pos(h);
  h.check('holding Jump rises back to the surface', !p.under && p.st === 'swim', JSON.stringify(p));
  await step(h, 2.5);
  p = await pos(h);
  h.check('breath refills at the surface', p.air > 14.5, `${p.air}`);

  // Out of air: it hurts, and the water pushes Aster up.
  await down(h, 'dodge');
  await step(h, 1.2);
  await h.eval(() => { window.wyrm.player.air = 0.2; });
  const before = await pos(h);
  await step(h, 2.5);
  p = await pos(h);
  await up(h, 'dodge');
  h.check('at zero breath Aster takes damage', p.hp < before.hp, `${before.hp} -> ${p.hp}`);
  h.check('and is pushed back up even holding Dodge', p.y > before.y + 0.5 || !p.under, `${before.y} -> ${p.y} ${p.under}`);
  await step(h, 1.5);

  // Leap out of the water onto the north shore.
  await place(h, 4, 35.2, 0, -0.8);
  await step(h, 0.4);
  p = await pos(h);
  h.check('placed afloat', p.st === 'swim', JSON.stringify(p));
  await face(h, 0, 0.3);
  await stick(h, 0, 1);
  await step(h, 0.3);
  await press(h, 'jump', 0.25);
  let landed = false;
  for (let i = 0; i < 30 && !landed; i++) {
    await step(h, 0.1);
    const q = await pos(h);
    landed = q.st === 'move' && q.grounded && q.y > -0.6;
  }
  await stop(h);
  p = await pos(h);
  h.check('Jump leaps out of the water onto land', landed, JSON.stringify(p));

  // Paddle into the side of the camp's pier: Aster climbs up onto it.
  await place(h, 7.5, -41, -Math.PI / 2, -0.8);
  await step(h, 0.3);
  await face(h, -Math.PI / 2, 0.3);
  await stick(h, 0, 1);
  let onDeck = false;
  for (let i = 0; i < 40 && !onDeck; i++) {
    await step(h, 0.1);
    const q = await pos(h);
    onDeck = q.st === 'move' && q.grounded && q.y > 0.5;
  }
  await stop(h);
  p = await pos(h);
  h.check('swimming into a pier climbs out onto it', onDeck, JSON.stringify(p));
  await shot(h, 'hollow-swim-pier');
}

export async function fen(h) {
  await boot(h, 'fen', { save: null });
  await h.eval(() => { const g = window.wyrm; g.save.found['story:fen:intro'] = true; });
  // East edge of Firefly Hollow: deep marsh water beyond.
  await place(h, 10, -12, Math.PI / 2);
  await step(h, 0.5);
  const start = await pos(h);
  await face(h, Math.PI / 2, 0.3);
  await stick(h, 0, 1);
  const seen = new Set();
  let wet = null;
  for (let i = 0; i < 60; i++) {
    await step(h, 0.1);
    const q = await pos(h);
    seen.add(q.st);
    if (q.st === 'fall' && !wet) {
      wet = q;
      await stop(h);
    }
    if (wet && q.st === 'move' && q.state === 'play') break;
  }
  await stop(h);
  await step(h, 0.8);
  const end = await pos(h);
  const dry = await h.eval(() => { const g = window.wyrm; return g.col.terrainAt(g.player.x, g.player.z) > g.waterLevel; });
  h.check('Fen deep water still washes Aster back (no swimming in Act I)', !!wet && !seen.has('swim'), JSON.stringify({ seen: [...seen], wet }));
  h.check('back on dry ground, a little hurt', dry && end.hp < start.hp && end.st === 'move', JSON.stringify({ start, end }));
}

export default async function (h) {
  await lake(h);
  await fen(h);
}
