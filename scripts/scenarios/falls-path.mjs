// Stormspire Falls: the critical path with real inputs (bridges, updrafts,
// vines, torches, crumbles, movers, the spire updraft). Arena fights are
// staged in falls-arenas; here they are marked cleared.
import { boot, place, snap, step, track, glideJump, hop, hold, releaseAll, summary, fell, shot, clearArenas } from './falls-lib.mjs';

const want = (name) => !process.env.ONLY || process.env.ONLY.split(',').includes(name);

export default async function (h) {
  await boot(h);
  const k = h.page.keyboard;
  await clearArenas(h);
  await h.eval(() => { window.wyrm.player.invuln = true; });
  let s;
  let end;
  if (want('bridges')) {

  // Rope bridges: walk each one end to end.
  const legs = [[-2, 11.5, 5, 24.5, 5], [4.5, 29.5, -3.5, 38.5, 6], [-4.5, 44.5, 0, 51.5, 6]];
  for (const [ax, az, bx, bz, topY] of legs) {
    const yaw = Math.atan2(bx - ax, bz - az);
    const len = Math.hypot(bx - ax, bz - az);
    await place(h, ax - Math.sin(yaw) * 1.5, az - Math.cos(yaw) * 1.5, yaw);
    await k.down('KeyW');
    const s = await track(h, (len + 1.5) / 8.8 + 0.2);
    await k.up('KeyW');
    await step(h, 0.3);
    const end = await snap(h);
    h.check(`bridge ${ax},${az} -> ${bx},${bz}`, !fell(s) && end.g && end.y > topY - 0.5 && Math.hypot(end.x - bx, end.z - bz) < 3.5, summary(s));
  }
  await shot(h, 'path-bridge');
  }

  if (want('updrafts')) {
  // Windstair: from the bank's edge, glide into the updraft by the cliff.
  await place(h, 1, 68.5, 0, 8.8);
  s = await glideJump(h, 2.2);
  await shot(h, 'path-windstair');
  await releaseAll(h);
  s = s.concat(await track(h, 1.5));
  end = s[s.length - 1];
  h.check('windstair updraft lifts onto the terrace', !fell(s) && end.g && end.y > 15 && end.z > 79 && end.z < 105, summary(s));

  // Roc pinnacle: glide east off the terrace into the updraft beside it.
  await place(h, 17.5, 97, Math.PI / 2, 8.8);
  s = await glideJump(h, 2.0);
  await releaseAll(h);
  s = s.concat(await track(h, 1.5));
  end = s[s.length - 1];
  h.check('pinnacle updraft lands on the nest', end.g && end.y > 24 && Math.hypot(end.x - 33.5, end.z - 97) < 6.5, summary(s));
  await hop(h, 33.5, 97, { brake: 0.4 });
  const relic2 = await h.eval(() => !!window.wyrm.save.found['falls:relic2']);
  h.check('roc nest relic collected', relic2);
  console.log(s.map((q) => `${q.x},${q.y},${q.g ? 'G' : ''}${q.glide ? 'gl' : ''}`).join(' '));
  await shot(h, 'path-nest');
  }

  if (want('crater')) {
  // Vines: burn them.
  await place(h, -3.5, 125.5, 0);
  await hold(h, 'KeyK', 1.2);
  await step(h, 0.3);
  const gate = await h.eval(() => window.wyrm.level.hittables.filter((x) => x.kind === 'vines').map((x) => x.alive));
  h.check('fire burns the vines', gate.length === 1 && gate[0] === false, JSON.stringify(gate));
  await k.down('KeyW');
  s = await track(h, 1.2);
  await k.up('KeyW');
  end = s[s.length - 1];
  h.check('through the vine notch into the crater', end.z > 132 && end.y > 20.5, summary(s));

  // Torches: two on the floor, one on a shelf that needs a jump and a flap.
  const torches = await h.eval(() => window.wyrm.level.hittables.filter((x) => x.constructor.name === 'Torch').map((t) => [t.x, t.y, t.z]));
  const lit = () => h.eval(() => window.wyrm.level.hittables.filter((x) => x.constructor.name === 'Torch').map((t) => t.lit));
  const [sx, sy, sz] = torches[2];
  await place(h, sx + 3.2, sz, -Math.PI / 2);
  await hold(h, 'KeyK', 1.0);
  h.check('shelf torch cannot be lit from the floor', (await lit())[2] === false, JSON.stringify(await lit()));
  // A single jump reaches the shelf only by catching its edge (ledge grab), never by clearing it.
  await place(h, sx + 3.4, sz, -Math.PI / 2);
  s = await hop(h, sx, sz);
  h.check('a plain jump reaches the shelf only with a ledge grab', s[s.length - 1].y < sy - 1 || s.some((f) => f.st === 'ledge'), summary(s));
  for (const i of [0, 1]) {
    const [tx, , tz] = torches[i];
    await place(h, tx, tz - 3, 0);
    await hold(h, 'KeyK', 1.0);
    await h.eval(() => { window.wyrm.player.mana = 100; });
  }
  await place(h, sx + 4.4, sz, -Math.PI / 2);
  s = await hop(h, sx + 1.4, sz, { flap: true, brake: 0.2 });
  end = s[s.length - 1];
  h.check('jump+flap onto the torch shelf', end.g && end.y > sy - 0.2, summary(s));
  // Back off a step from the post, then breathe on it.
  await h.eval(([x, z]) => { const g = window.wyrm; const p = g.player; p.yaw = Math.atan2(x - p.x, z - p.z); g.cam.snapBehind(p.yaw); }, [sx, sz]);
  await hold(h, 'KeyS', 0.22);
  await h.eval(([x, z]) => { const g = window.wyrm; const p = g.player; p.yaw = Math.atan2(x - p.x, z - p.z); g.cam.snapBehind(p.yaw); }, [sx, sz]);
  await hold(h, 'KeyK', 1.0);
  console.log('on shelf', JSON.stringify(await snap(h)));
  await step(h, 2);
  const north = await h.eval(() => window.wyrm.level.hittables.filter((x) => x.kind === 'stone' && x.signal === 'falls-bellgate').map((x) => x.alive));
  h.check('three torches open the north gate', north.length === 1 && north[0] === false, JSON.stringify(north) + JSON.stringify(await lit()));
  await shot(h, 'path-crater');
  }

  if (want('cascade')) {
  // Crumbles: hop across; each gives way behind us.
  await place(h, -1.5, 166.5, 0);
  const hops = [[-0.5, 172], [2.5, 176.5], [0, 181], [3, 185], [1.5, 190]];
  let ok = true;
  for (const [tx, tz] of hops) {
    const ss = await hop(h, tx, tz);
    const e = ss[ss.length - 1];
    const good = !fell(ss) && e.g && Math.hypot(e.x - tx, e.z - tz) < 2.4 && e.y > 20.5;
    if (!good) ok = false;
    console.log(`hop -> ${tx},${tz}: ${JSON.stringify(e)}`);
  }
  h.check('crumble hops reach the Roost', ok);
  const crumbled = await h.eval(() => window.wyrm.level.props.filter((p) => p.constructor.name === 'Crumble').map((c) => c.down > 0 || c.timer >= 0));
  h.check('crumbles gave way behind us', crumbled.slice(0, 4).filter(Boolean).length >= 3, JSON.stringify(crumbled));
  const safe = await snap(h);
  h.check('crumbles are never remembered as safe ground', Math.hypot(safe.safe[0] - 1.5, safe.safe[2] - 190) < 5 || safe.safe[2] < 168, JSON.stringify(safe.safe));

  // Movers: ride the first stone across.
  const resetMover = (i) => h.eval((i) => {
    const g = window.wyrm;
    const m = g.level.props.filter((p) => p.constructor.name === 'MovingPlatform')[i];
    m.t = 0; m.seg = 0;
    m.update(0.0001);
  }, i);
  await resetMover(0);
  await place(h, 2, 202.5, 0);
  s = await track(h, 3.6, 0.2);
  end = s[s.length - 1];
  h.check('first mover carries us across', end.g && end.z > 207 && end.y > 21.5, summary(s));
  s = await hop(h, 2, 214);
  end = s[s.length - 1];
  h.check('jump from the mover to the pillar', end.g && Math.hypot(end.x - 2, end.z - 214) < 1.8, summary(s));
  // Wait for the second stone to come back to us, then board it.
  await h.eval(() => {
    const g = window.wyrm;
    const m = g.level.props.filter((p) => p.constructor.name === 'MovingPlatform')[1];
    const a = m.pts[0]; const b = m.pts[1];
    m.seg = 1; m.t = a.distanceTo(b) / m.speed; m.update(0.0001);
  });
  s = await hop(h, 6, 214);
  end = s[s.length - 1];
  h.check('onto the second mover', end.g && end.y > 22, summary(s));
  s = await track(h, 3.2, 0.2);
  end = s[s.length - 1];
  console.log('riding mover 2', summary(s));
  s = await hop(h, 16, 214);
  end = s[s.length - 1];
  h.check('second mover to the outpost', end.g && end.x > 14 && end.y > 23.5, summary(s));
  await shot(h, 'path-outpost');
  }

  if (want('spire')) {
  // The Spire updraft: run off the outpost toward the spire and glide up its face.
  const dir = [(0 - 24) / Math.hypot(24, 27), 27 / Math.hypot(24, 27)];
  const yaw = Math.atan2(dir[0], dir[1]);
  await place(h, 24 + dir[0] * 8.5, 216 + dir[1] * 8.5, yaw, 8.8);
  s = await glideJump(h, 2.6);
  await shot(h, 'path-spire-updraft');
  await releaseAll(h);
  s = s.concat(await track(h, 1.5));
  end = s[s.length - 1];
  const cp = await h.eval(() => window.wyrm.save.checkpoint);
  h.check('spire updraft reaches the top', end.g && end.y > 34 && !fell(s), summary(s));
  h.check('spire wardstone wakes on landing', cp === 'spire', cp);
  await shot(h, 'path-spire-top');
  }
}
