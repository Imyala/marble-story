/**
 * Every egg, letter, chest and relic in the Hollow Gate, reached the way a
 * player would: teleport near, then do the last approach for real (swim,
 * dive, burn, climb, bounce, charge).
 *   node scripts/play.mjs hollow-secrets            (everything)
 *   node scripts/play.mjs hollow-secrets:lake       (sunken shrine relic, canal chest)
 *   node scripts/play.mjs hollow-secrets:grotto     (the egg through the underwater passage)
 *   node scripts/play.mjs hollow-secrets:rootway    (relic behind the roots, the scout's letter)
 *   node scripts/play.mjs hollow-secrets:camp       (Tallow's letter, the camp chest, the folk)
 *   node scripts/play.mjs hollow-secrets:aerie      (the brazier vault, the tower egg, the iron chest)
 *   node scripts/play.mjs hollow-secrets:glowcap    (the egg on the tallest cap, Grubb's orders)
 */
import { boot, place, step, press, down, up, stick, stop, pos, face, steerTo, shot, found } from './hollow-lib.mjs';

/** Where a collectible (or any prop with an id) is, by its full id. */
const where = (h, id) => h.eval((id) => {
  const p = window.wyrm.level.props.find((q) => q.id === id);
  return p ? { x: p.x, y: p.y, z: p.z } : null;
}, id);

/**
 * Swims toward (x, y, z) underwater, aiming the camera (and so the stroke) at
 * it each step, until within `near` or out of time. Dives first if at the surface.
 */
async function swimTo(h, x, y, z, sec = 8, near = 1) {
  for (let t = 0; t < sec; t += 0.1) {
    const d = await h.eval(([x, y, z]) => {
      const g = window.wyrm;
      const p = g.player;
      const dx = x - p.x;
      const dz = z - p.z;
      const dy = y - p.y;
      const dh = Math.hypot(dx, dz);
      g.cam.yaw = Math.atan2(dx, dz);
      // Forward strokes climb or dive by how far the view is tilted from its usual angle.
      const elev = Math.max(-1.1, Math.min(1.1, Math.atan2(dy, Math.max(dh, 0.5))));
      g.cam.pitch = 0.3 - elev / 1.25;
      g.input.forceMove = { x: 0, y: dh + Math.abs(dy) > 0.5 ? 1 : 0 };
      return Math.hypot(dh, dy);
    }, [x, y, z]);
    if (d < near) break;
    const st = await pos(h);
    if (st.st === 'swim' && !st.under && y < -1.5) {
      await down(h, 'dodge');
      await step(h, 0.3);
      await up(h, 'dodge');
    }
    await step(h, 0.1);
  }
  await stop(h);
  return pos(h);
}

/** Puts Aster afloat at (x, z). */
async function afloat(h, x, z, yaw = 0) {
  await place(h, x, z, yaw, -0.8);
  await step(h, 0.3);
}

export async function lake(h) {
  await boot(h);
  // The sunken shrine's relic, on its altar on the lake bed.
  const relic = await where(h, 'hollow:relic1');
  await afloat(h, relic.x - 9, relic.z, Math.PI / 2);
  let p = await swimTo(h, relic.x - 5, relic.y + 2.5, relic.z, 6, 1.2);
  p = await swimTo(h, relic.x, relic.y + 0.8, relic.z, 6, 0.4);
  await step(h, 0.3);
  h.check('the sunken shrine\'s relic is found by diving', await found(h, 'hollow:relic1'), JSON.stringify({ p, relic }));
  await shot(h, 'hollow-secret-shrine');
  await down(h, 'jump');
  await step(h, 3);
  await up(h, 'jump');
  // The chest lost in the drowned canal: dive to it and bump it open with a strong stroke.
  const chest = await h.eval(() => { const c = window.wyrm.level.props.find((q) => q.id === 'hollow:chest:sunken'); return { x: c.x, y: c.y, z: c.z }; });
  await afloat(h, chest.x - 5, chest.z + 4, Math.atan2(5, -4));
  p = await swimTo(h, chest.x - 1.6, chest.y + 0.5, chest.z + 1.3, 6, 0.6);
  await face(h, Math.atan2(chest.x - p.x, chest.z - p.z), 0.3);
  await press(h, 'horn', 0.1);
  await step(h, 0.6);
  h.check('the canal chest opens to a strong stroke underwater', await found(h, 'hollow:chest:sunken'), JSON.stringify({ p, chest }));
  await shot(h, 'hollow-secret-canal');
}

export async function grotto(h) {
  await boot(h);
  const egg = await where(h, 'hollow:egg-grotto');
  // The inlet: paddle to where the water runs under the cliff.
  await afloat(h, -38, -38.5, Math.atan2(-1, -0.7));
  let p = await steerTo(h, -42.6, -41.4, 4, 0.8);
  h.check('the inlet leads to a rock wall at the surface', p.st === 'swim', JSON.stringify(p));
  await shot(h, 'hollow-secret-inlet');
  // Dive under the rock and follow the channel.
  await down(h, 'dodge');
  await step(h, 0.6);
  await up(h, 'dodge');
  p = await swimTo(h, -45, -4.6, -43.2, 5, 1);
  p = await swimTo(h, -52.5, -4.6, -47.8, 6, 1);
  await shot(h, 'hollow-secret-tunnel');
  p = await swimTo(h, -56, -1.5, -50.2, 5, 1);
  await down(h, 'jump');
  await step(h, 1.2);
  await up(h, 'jump');
  p = await pos(h);
  h.check('the channel comes up inside the grotto', p.st === 'swim' && !p.under && Math.hypot(p.x + 58, p.z + 52) < 7.5, JSON.stringify(p));
  // Paddle onto the ledge with the egg.
  p = await steerTo(h, egg.x, egg.z, 5, 0.4);
  await step(h, 0.4);
  h.check('the grotto egg is found', await found(h, 'hollow:egg-grotto'), JSON.stringify({ p, egg }));
  await shot(h, 'hollow-secret-grotto');
}

export async function rootway(h) {
  await boot(h);
  // The relic behind the Hollow King's roots: fire burns them away.
  const relic = await where(h, 'hollow:relic2');
  const gate = await h.eval(() => {
    const r = window.wyrm.level.props.find((q) => q.constructor.name === 'RootGate' && Math.hypot(q.x, q.z - 76) < 14);
    return r ? { x: r.x, y: r.y, z: r.z } : null;
  });
  h.check('roots seal the Rootway nook', !!gate, JSON.stringify(gate));
  const back = { x: gate.x + (gate.x - relic.x) * 0.9, z: gate.z + (gate.z - relic.z) * 0.9 };
  const yaw = Math.atan2(gate.x - back.x, gate.z - back.z);
  await place(h, back.x, back.z, yaw);
  await h.eval(() => { const p = window.wyrm.player; p.element = 'fire'; });
  await down(h, 'breath');
  await step(h, 2.2);
  await up(h, 'breath');
  await step(h, 1.6);
  const burnt = await h.eval(() => !window.wyrm.level.props.find((q) => q.constructor.name === 'RootGate' && Math.hypot(q.x, q.z - 76) < 14).alive);
  h.check('fire burns the roots away', burnt);
  await steerTo(h, relic.x, relic.z, 5, 0.3);
  await step(h, 0.3);
  h.check('the Rootway relic is found', await found(h, 'hollow:relic2'), JSON.stringify(await pos(h)));
  // The scout's letter in the nook across the way.
  const letter = await where(h, 'hollow:letter-scout');
  const mouth = await h.eval(([x, z]) => {
    // Step back out toward the route, then walk in.
    return { x: x + 4, z: z + 3 };
  }, [letter.x, letter.z]);
  await place(h, mouth.x, mouth.z, Math.atan2(letter.x - mouth.x, letter.z - mouth.z));
  await steerTo(h, letter.x, letter.z, 4, 0.3);
  await step(h, 0.3);
  h.check('the scout\'s letter is found', await found(h, 'letter:hollow:scout'), JSON.stringify(await pos(h)));
  await shot(h, 'hollow-secret-rootway');
}

export async function camp(h) {
  await boot(h);
  // Tallow's letter on her lamp stall.
  const letter = await where(h, 'hollow:letter-lamps');
  await place(h, letter.x, letter.z + 3, Math.PI);
  await steerTo(h, letter.x, letter.z, 3, 0.6);
  await step(h, 0.3);
  h.check('Tallow\'s letter is found', await found(h, 'letter:hollow:lamps'), JSON.stringify({ at: await pos(h), letter }));
  // The chest behind the elder's hut: a horn swipe opens it.
  const chest = await h.eval(() => { const c = window.wyrm.level.props.find((q) => q.id === 'hollow:chest:camp'); return { x: c.x, z: c.z }; });
  await place(h, chest.x + 3, chest.z + 2, Math.atan2(-3, -2));
  await steerTo(h, chest.x + 1.2, chest.z + 0.8, 3, 0.3);
  await face(h, Math.atan2(chest.x - (chest.x + 1.2), chest.z - (chest.z + 0.8)), 0.3);
  for (let i = 0; i < 3 && !(await found(h, 'hollow:chest:camp')); i++) await press(h, 'horn', 0.1), await step(h, 0.4);
  h.check('the camp chest opens', await found(h, 'hollow:chest:camp'));
  // Talk to each of the Burrowfolk.
  for (const [id, key] of [['Mossa', 'mossa'], ['Tallow', 'tallow'], ['Pip', 'pip']]) {
    const t = await h.eval((name) => {
      const it = window.wyrm.level.interactables.find((i) => i.label.includes(name));
      return it ? { x: it.x, y: it.y, z: it.z } : null;
    }, id);
    await place(h, t.x + 1.8, t.z + 1.2, Math.atan2(-1.8, -1.2), t.y + 0.05);
    await step(h, 0.3);
    await press(h, 'interact', 0.1);
    await step(h, 0.4);
    const talk = await h.eval(() => ({ state: window.wyrm.state, who: window.wyrm.dialogueSpeaker }));
    if (key === 'mossa') await shot(h, 'hollow-talk-mossa');
    for (let i = 0; i < 12 && (await h.eval(() => window.wyrm.state)) === 'dialogue'; i++) {
      await h.eval(() => window.wyrm.dialogue.advance());
      await h.eval(() => window.wyrm.dialogue.advance());
      await step(h, 0.2);
    }
    h.check(`${id} has something to say`, talk.state === 'dialogue' && talk.who === key && (await found(h, `story:hollow:${key}`)), JSON.stringify(talk));
  }
}

export async function aerie(h) {
  await boot(h);
  // Light the four braziers in the old hall: the vault opens.
  const torches = await h.eval(() => window.wyrm.level.hittables.filter((t) => t.constructor.name === 'Torch' && t.x < -70).map((t) => ({ x: t.x, y: t.y, z: t.z })));
  h.check('four braziers in the old hall', torches.length === 4, JSON.stringify(torches));
  // From the middle of the hall, turn to each brazier and breathe fire at it.
  const mid = { x: torches.reduce((a, t) => a + t.x, 0) / 4, z: torches.reduce((a, t) => a + t.z, 0) / 4 };
  for (const t of torches) {
    const yaw = Math.atan2(t.x - mid.x, t.z - mid.z);
    await place(h, mid.x + Math.sin(yaw) * 1.2, mid.z + Math.cos(yaw) * 1.2, yaw);
    await h.eval(() => { const p = window.wyrm.player; p.element = 'fire'; p.mana = 999; p.lock = null; });
    await down(h, 'breath');
    await step(h, 1.0);
    await up(h, 'breath');
    await step(h, 0.2);
  }
  await step(h, 2);
  h.check('the vault opens once all four burn', await h.eval(() => window.wyrm.level.fired.has('aerie-vault')));
  const letter = await where(h, 'hollow:letter-aerie');
  await place(h, letter.x, letter.z - 4.5, 0);
  await steerTo(h, letter.x, letter.z, 4, 0.3);
  await step(h, 0.3);
  h.check('the Aerie-Keeper\'s letter is found in the vault', await found(h, 'letter:hollow:aerie'), JSON.stringify(await pos(h)));
  await shot(h, 'hollow-secret-vault');
  // The vine tower: climb it for the egg on the roof.
  const egg = await where(h, 'hollow:egg-tower');
  await place(h, egg.x + 4.6, egg.z - 0.5, -Math.PI / 2);
  await face(h, -Math.PI / 2, 0.3);
  await stick(h, 0, 1);
  let climbed = false;
  for (let i = 0; i < 80; i++) {
    await step(h, 0.1);
    const q = await pos(h);
    if (q.st === 'move' && q.grounded && q.y > egg.y - 0.3) { climbed = true; break; }
  }
  await stop(h);
  h.check('the vines climb to the tower roof', climbed, JSON.stringify(await pos(h)));
  await steerTo(h, egg.x, egg.z, 3, 0.3);
  await step(h, 0.3);
  h.check('the tower egg is found', await found(h, 'hollow:egg-tower'), JSON.stringify({ at: await pos(h), egg }));
  // Charge down the speed runes and ram the iron-bound chest at the end.
  const chest = await h.eval(() => { const c = window.wyrm.level.props.find((q) => q.id === 'hollow:chest:aerie'); return { x: c.x, z: c.z }; });
  // Runes lie down the avenue from its start; begin a few steps before the first.
  const lane = await h.eval(() => {
    const l = window.wyrm.level.props.find((q) => q.constructor.name === 'SpeedLane' && q.cx < -30);
    const a = l.runes[0];
    const b = l.runes[l.runes.length - 1];
    return { x: a.x, z: a.z, bx: b.x, bz: b.z };
  });
  const yaw = Math.atan2(lane.bx - lane.x, lane.bz - lane.z);
  await place(h, lane.x - Math.sin(yaw) * 4.5, lane.z - Math.cos(yaw) * 4.5, yaw);
  await face(h, yaw, 0.3);
  await stick(h, 0, 1);
  await step(h, 0.3);
  await down(h, 'dodge');
  let opened = false;
  let sup = 0;
  for (let i = 0; i < 60 && !opened; i++) {
    sup = Math.max(sup, await h.eval(([x, z, bx, bz]) => {
      const g = window.wyrm;
      const p = g.player;
      // Down the lane, then on to the chest.
      const past = (p.x - bx) * (bx - x) + (p.z - bz) * (bz - z) > 0;
      if (past) g.cam.yaw = Math.atan2(x - p.x, z - p.z);
      return p.superT;
    }, [chest.x, chest.z, lane.bx, lane.bz]));
    await step(h, 0.1);
    opened = await found(h, 'hollow:chest:aerie');
  }
  await up(h, 'dodge');
  await stop(h);
  h.check('a supercharged charge off the runes breaks the iron chest', opened, JSON.stringify({ at: await pos(h), chest, sup }));
}

export async function glowcap(h) {
  await boot(h);
  // Grubb's orders, in the Gloom camp (the Gloom are kept busy elsewhere).
  const letter = await where(h, 'hollow:letter-gloom');
  await h.eval(() => { window.wyrm.player.invuln = true; });
  await place(h, letter.x + 3, letter.z - 2, Math.atan2(-3, 2));
  await steerTo(h, letter.x, letter.z, 3, 0.3);
  await step(h, 0.3);
  h.check('Grubb\'s orders are found in the Gloom camp', await found(h, 'letter:hollow:gloom'));
  await step(h, 0.5);
  const foes = await h.eval(() => window.wyrm.enemies.filter((e) => e.alive && e.x > 60).length);
  h.check('the Gloom camp is guarded', foes >= 3, `${foes}`);
  await h.eval(() => { for (const e of window.wyrm.enemies) { e.alive = false; e.state = 'dead'; e.deadT = 1; } });
  // The mushroom climb: a bounce off the shroom on the middle cap reaches the tallest one and its egg.
  const egg = await where(h, 'hollow:egg-cap');
  const shroom = await h.eval(([ex, ez]) => {
    const list = window.wyrm.level.props.filter((q) => q.constructor.name === 'BounceShroom').map((q) => ({ x: q.x, y: q.y, z: q.z }));
    return list.sort((a, b) => b.y - a.y)[0];
  }, [egg.x, egg.z]);
  await place(h, shroom.x - (egg.x - shroom.x) * 0.25, shroom.z - (egg.z - shroom.z) * 0.25, Math.atan2(egg.x - shroom.x, egg.z - shroom.z), shroom.y + 0.1);
  await shot(h, 'hollow-secret-caps-before');
  await face(h, Math.atan2(egg.x - shroom.x, egg.z - shroom.z), 0.3);
  await steerTo(h, shroom.x, shroom.z, 1.5, 0.2);
  let top = 0;
  for (let i = 0; i < 40 && !(await found(h, 'hollow:egg-cap')); i++) {
    const q = await pos(h);
    top = Math.max(top, q.y);
    await h.eval(([x, z]) => { const g = window.wyrm; const p = g.player; g.cam.yaw = Math.atan2(x - p.x, z - p.z); g.input.forceMove = { x: 0, y: 1 }; }, [egg.x, egg.z]);
    // A flap at the top of the bounce.
    if (i === 6) await press(h, 'jump', 0.15);
    await step(h, 0.1);
  }
  await stop(h);
  h.check('the tallest cap\'s egg is reached by bouncing', await found(h, 'hollow:egg-cap'), JSON.stringify({ at: await pos(h), egg, shroom, top }));
  await shot(h, 'hollow-secret-caps');
}

export async function rings(h) {
  await boot(h);
  // Off the landing: run, jump, flap and glide, steering for each ring in turn.
  const course = await h.eval(() => {
    const c = window.wyrm.level.props.find((q) => q.constructor.name === 'GlideCourse');
    return c.rings.map((r) => ({ x: r.x, y: r.y, z: r.z }));
  });
  const first = course[0];
  const yaw0 = Math.atan2(first.x - 0, first.z - 97);
  await place(h, 0, 97, yaw0);
  await face(h, yaw0, 0.3);
  await stick(h, 0, 1);
  await step(h, 0.75);
  await press(h, 'jump', 0.25);
  await step(h, 0.1);
  await down(h, 'jump');
  await step(h, 0.35);
  let passed = 0;
  for (let i = 0; i < 140; i++) {
    const s = await h.eval((course) => {
      const g = window.wyrm;
      const c = g.level.props.find((q) => q.constructor.name === 'GlideCourse');
      const r = course[Math.min(c.next, course.length - 1)];
      const p = g.player;
      g.cam.yaw = Math.atan2(r.x - p.x, r.z - p.z);
      return { next: c.next, done: !!g.save.found['hollow:rings:rootway'], y: p.y, gliding: p.gliding, st: p.state, grounded: p.body.grounded };
    }, course);
    passed = Math.max(passed, s.next);
    if (process.env.TRACE) console.log(JSON.stringify(s), JSON.stringify(await pos(h)));
    if (s.done || (s.grounded && i > 10)) break;
    if (i === 2) {
      // The flap, then hold on into the glide.
      await up(h, 'jump');
      await step(h, 1 / 30);
      await down(h, 'jump');
    }
    await step(h, 0.05);
  }
  await up(h, 'jump');
  await stop(h);
  h.check('the Rootway glide rings can all be flown in one go', await found(h, 'hollow:rings:rootway'), JSON.stringify({ passed, of: course.length, at: await pos(h) }));
}

export default async function (h) {
  for (const part of [lake, grotto, rootway, camp, aerie, glowcap, rings]) await part(h);
}
