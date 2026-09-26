/**
 * The spore vents, played: the terrace vent (step in as its throat glows,
 * ride the puff up onto the terrace), the west wing's vent (freeze it open
 * with Ice and ride the steady column up beside the tower, to its egg), and
 * the Thornpit (launch off the first vent and catch the second one's puff in
 * mid-air, up to the relic on the high roots). Also Blight Row: three clouds
 * in a row, burnt one after another, to the heart shard.
 *   node scripts/play.mjs myc-vents
 */
import { boot, place, step, pos, airTo, noPartner, element, breathe, lookAt, found, calm, skip, shot } from './myc-lib.mjs';

/** Steps until the vent at (x, z) is `lead` seconds from its next puff. */
async function waitForPuff(h, x, z, lead) {
  for (let i = 0; i < 200; i++) {
    const t = await h.eval(([x, z]) => {
      const v = window.wyrm.level.props.find((p) => p.constructor.name === 'SporeVent' && Math.abs(p.x - x) < 0.5 && Math.abs(p.z - z) < 0.5);
      return v.untilPuff;
    }, [x, z]);
    if (t > 0 && t <= lead) return t;
    await step(h, 1 / 30);
  }
  return -1;
}

export default async function (h) {
  await boot(h, { found: { 'story:mycelium:threadworks': true, 'story:mycelium:market': true, 'story:mycelium:rootchoke': true } });
  await noPartner(h);
  // --- The terrace vent: walk in just before it puffs.
  await place(h, -3, 124.8, 0);
  await calm(h);
  const early = await airTo(h, -3, 131, 1.2, { near: 0.5 });
  h.check('the terrace is out of reach on foot', early.y < 26, JSON.stringify(early));
  await place(h, -3, 125.2, 0);
  await waitForPuff(h, -3, 127.6, 0.35);
  const up = await airTo(h, -3, 127.6, 0.7, { stop: 0.2, near: 0.1 });
  const terrace = await airTo(h, -2, 135, 3, { near: 1.5 });
  h.check('the vent\'s puff throws Aster up onto the terrace', terrace.y > 31.5 && terrace.z > 131, JSON.stringify({ up, terrace }));
  await shot(h, 'myc-vents-terrace', false);

  // --- The west wing: the puff alone falls short of the tower; frozen open, the column carries her up.
  const VX = -30.5;
  const VZ = 117.5;
  await place(h, VX + 2.5, VZ + 1.5, 0);
  await calm(h);
  await waitForPuff(h, VX, VZ, 0.3);
  const puff = await airTo(h, VX, VZ, 1.6, { stop: 0.2, near: 0.1 });
  h.check('a puff alone does not reach the tower top', puff.peak < 39, JSON.stringify(puff));
  await step(h, 1.5);
  await place(h, VX + 3, VZ + 2, 0);
  await element(h, 'ice');
  await lookAt(h, VX, VZ);
  await breathe(h, 1.2);
  const frozen = await h.eval(([x, z]) => window.wyrm.level.props.find((p) => p.constructor.name === 'SporeVent' && Math.abs(p.x - x) < 0.5 && Math.abs(p.z - z) < 0.5).frozen, [VX, VZ]);
  h.check('Ice freezes the vent open', frozen);
  await airTo(h, VX, VZ, 1.2, { stop: 0.15, near: 0.1 });
  await step(h, 3.5);
  const high = await pos(h);
  h.check('the steady column carries Aster up level with the tower', high.y > 41, JSON.stringify(high));
  await shot(h, 'myc-vents-column', false);
  const tower = await airTo(h, WEST_TOWER[0], WEST_TOWER[1], 3, { jump: true, glide: true, flap: true, near: 1.5 });
  await step(h, 0.5);
  h.check('glide over to the tower and its egg', await found(h, 'mycelium:egg-vent'), JSON.stringify(tower));
  await skip(h);

  // --- The Thornpit: off the first vent, glide into the second's puff, up to the perch.
  await place(h, 82.5, 172, Math.PI / 2);
  await calm(h);
  await waitForPuff(h, 85, 172, 0.3);
  const vbState = () => h.eval(() => { const v = window.wyrm.level.props.find((p) => p.constructor.name === 'SporeVent' && Math.abs(p.x - 98) < 0.5); return { puffing: v.puffing, until: +v.untilPuff.toFixed(2) }; });
  const launch = await airTo(h, 85, 172, 0.8, { stop: 0.15, near: 0.1 });
  // Glide straight at the second vent and note how its rhythm meets the arrival.
  await h.eval(() => { window.wyrm.input.simulate('jump', true); window.__boosted = false; });
  let arrival = null;
  let peak = 0;
  for (let t = 0; t < 4; t += 0.1) {
    const s = await h.eval(() => {
      const g = window.wyrm;
      const p = g.player;
      // Once the second vent has thrown her, on to the perch.
      if (p.body.vy > 12 && p.x > 95) window.__boosted = true;
      const tx = window.__boosted ? 106 : 98;
      const tz = window.__boosted ? 172 : 170.5;
      g.cam.yaw = Math.atan2(tx - p.x, tz - p.z);
      g.input.forceMove = Math.hypot(106 - p.x, 172 - p.z) > 0.6 ? { x: 0, y: 1 } : null;
      return { x: p.x, y: p.y, vy: p.body.vy, d: Math.hypot(98 - p.x, 170.5 - p.z), grounded: p.body.grounded };
    });
    peak = Math.max(peak, s.y);
    if (!arrival && s.d < 2) arrival = { t: +t.toFixed(1), y: +s.y.toFixed(1), ...(await vbState()) };
    if (s.grounded && t > 0.5) break;
    await step(h, 0.1);
  }
  await h.eval(() => { const g = window.wyrm; g.input.forceMove = null; g.input.simulate('jump', false); });
  await step(h, 0.5);
  // Up on the roots (a landing a little long or short is fine): walk to the relic.
  if ((await pos(h)).y > 28) await airTo(h, 106, 172, 2, { near: 0.5 });
  const chain = await found(h, 'mycelium:relic2');
  h.check('off the first vent, into the second one\'s puff in mid-air, up onto the high roots and the relic', chain, JSON.stringify({ launch: launch.peak, arrival, peak, end: await pos(h) }));

  // --- Blight Row: burn, step, burn, step, burn... and the heart shard at the end.
  await place(h, 63.2, 163, Math.PI * 0.77);
  await calm(h);
  await element(h, 'fire');
  const row = [[67, 158.75], [72.5, 152.75], [77.5, 147]];
  for (const [cx, cz] of row) {
    await lookAt(h, cx, cz);
    await breathe(h, 0.45);
    await step(h, 0.8);
    await airTo(h, cx, cz, 2.2, { near: 0.8 });
  }
  await airTo(h, 80.5, 143.5, 2, { near: 0.6 });
  await step(h, 0.4);
  h.check('through Blight Row to the heart shard', await found(h, 'mycelium:heart1'), JSON.stringify(await pos(h)));
}

/** The west wing tower's top (see westWing in src/levels/mycelium.ts). */
const WEST_TOWER = [-36.5, 112.5];
