/**
 * Repeated jumps no longer climb slopes too steep to walk (Body.slideSteep):
 * in the Hollow Gate, spots at the foot of the cavern walls that jump-spam
 * used to scale (checked with the limit switched off) now hold Aster to a
 * jump's height; a landing on the face slides down it; weaving and hopping
 * up the walls never finds footing high up (so the Hollow no longer needs
 * its old "too high, back down" guard). Vine walls, ledge grabs and bounce
 * shrooms still work.
 *   node scripts/play.mjs eng-slope
 */
import { boot, place, step, shot } from './hollow-lib.mjs';

/**
 * Holds the stick toward yaw (weaving left and right) and hops every other
 * beat for `sec`. Returns where it started and the highest point reached and stood on.
 */
async function climb(h, x, z, yaw, sec, limit, weave = 0.7, snap = null) {
  await h.eval((l) => { window.wyrm.player.slopeLimit = l; }, limit);
  await place(h, x, z, yaw, undefined, 0.3);
  const y0 = await h.eval(() => window.wyrm.player.y);
  let top = y0;
  let stood = y0;
  for (let t = 0; t < sec; t += 0.2) {
    const phase = Math.floor(t / 2) % 4;
    await h.eval(([sd, j]) => {
      const g = window.wyrm;
      g.input.forceMove = { x: sd, y: 0.7 };
      g.input.simulate('jump', j);
    }, [phase < 2 ? weave : -weave, phase % 2 === 1 || weave === 0]);
    await step(h, 0.1);
    await h.eval(() => window.wyrm.input.simulate('jump', false));
    await step(h, 0.1);
    const r = await h.eval(() => { const g = window.wyrm; if (g.state !== 'play') g.state = 'play'; return [g.player.y, g.player.body.grounded]; });
    top = Math.max(top, r[0]);
    if (r[1]) stood = Math.max(stood, r[0]);
    // A picture partway up (the first time Aster stands that high).
    if (snap && r[1] && r[0] > snap.at) {
      await wideOn(h, snap.name);
      snap = null;
    }
  }
  await h.eval(() => { const g = window.wyrm; g.input.forceMove = null; g.player.slopeLimit = true; });
  return { y0: +y0.toFixed(1), top: +top.toFixed(1), stood: +stood.toFixed(1) };
}

/** A wide look at Aster from the middle of the cavern (a scripted camera shot). */
async function wideOn(h, name) {
  await h.eval(() => {
    const g = window.wyrm;
    const p = g.player;
    const V = g.camera.position.constructor;
    const d = Math.hypot(p.x, p.z) || 1;
    g.cam.setShot(new V(p.x - (p.x / d) * 26, p.y + 6, p.z - (p.z / d) * 26), new V(p.x, p.y + 1, p.z));
  });
  await step(h, 1.5);
  await shot(h, name, false);
  await h.eval(() => window.wyrm.cam.clearShot());
}

/** Feet of the cavern walls (from a scan of the Hollow's terrain) and the way uphill. */
const WALLS = [[-94, 0, -1.57], [93, 0, 1.57], [41, 41, 0.79], [29, 50.2, 0.52], [55.5, -14.9, 1.83], [-50.2, -29, -2.09], [-29, 50.2, -0.52], [0, -74, 3.14]];

export default async function (h) {
  await boot(h, 'hollow');
  const guard = await h.eval(() => window.wyrm.level.props.some((p) => p.update && /y > 26/.test(String(p.update))));
  h.check('the Hollow no longer carries its "too high up here" guard', !guard);

  // --- The same jump-spam, before and after -------------------------------------------------
  for (const [x, z, yaw] of WALLS.slice(0, 3)) {
    const before = await climb(h, x, z, yaw, 10, false, 0, x === -94 ? { at: 18, name: 'eng-slope-before' } : null);
    const after = await climb(h, x, z, yaw, 10, true, 0);
    if (x === -94) await wideOn(h, 'eng-slope-after');
    h.check(`jump-spam at the wall (${x}, ${z}) used to climb it, and now cannot`, before.stood - before.y0 > 8 && after.stood - after.y0 < 1.5 && after.top - after.y0 < 5.5,
      JSON.stringify({ before, after }));
  }

  // --- A landing on the face slides down it --------------------------------------------------
  const slid = await h.eval(() => {
    const g = window.wyrm;
    const p = g.player;
    // Two metres out from the wall above (-94, 0), over its face.
    const x = -99;
    const z = 0;
    const gy = g.col.terrainAt(x, z);
    p.setState('move');
    p.place(x, gy + 1.5, z, -Math.PI / 2);
    p.body.vx = p.body.vz = 0;
    let steep = false;
    const slope = g.col.terrainSlope(x, z, p.body.radius).slope;
    for (let i = 0; i < 90; i++) {
      window.__step(1 / 30, 1 / 30);
      steep ||= p.body.steep;
    }
    return { gy: +gy.toFixed(1), slope: +slope.toFixed(2), steep, y: +p.y.toFixed(1), x: +p.x.toFixed(1), grounded: p.body.grounded };
  });
  h.check('a landing on the steep face slides off it, down to the floor', slid.slope > 1.3 && slid.steep && slid.grounded && slid.y < slid.gy - 3, JSON.stringify(slid));

  // --- Weaving and hopping up the walls never finds footing high up --------------------------
  let worst = -99;
  for (const [x, z, yaw] of WALLS) {
    for (const weave of [0.7, -0.7]) {
      const r = await climb(h, x, z, yaw, 12, true, weave);
      worst = Math.max(worst, r.stood);
    }
  }
  h.check('no footing high on the cavern walls (the old guard stood at 26 m)', worst < 20, `highest stood on: ${worst}`);

  // --- Climbing that is meant to work still does -----------------------------------------------
  // The vine tower by the Old Aerie: up the vines and onto its roof.
  const foot = await h.eval(() => {
    const g = window.wyrm;
    // East of the vines (on the tower's east face), on the ground below the tower's roof.
    const y = g.col.groundAt(-91.3, 27, g.col.terrainAt(-95, 27) + 1, 0.2).y;
    g.player.setState('move');
    g.player.place(-91.3, y + 0.05, 27, -Math.PI / 2);
    g.cam.snapBehind(-Math.PI / 2, 0.3);
    return y;
  });
  await step(h, 0.2);
  await h.eval(() => { window.wyrm.input.forceMove = { x: 0, y: 1 }; });
  let roof = -99;
  let climbed = false;
  for (let i = 0; i < 60; i++) {
    await step(h, 0.1);
    const st = await h.eval(() => ({ s: window.wyrm.player.state, y: window.wyrm.player.y, g: window.wyrm.player.body.grounded }));
    climbed ||= st.s === 'climb';
    if (st.s === 'move' && st.g && st.y > roof) roof = st.y;
    if (roof > 12) break;
  }
  await h.eval(() => { window.wyrm.input.forceMove = null; });
  const tower = await h.eval(() => window.wyrm.col.groundAt(-95, 27, 1e4, 0.2).y);
  h.check('the vine tower climbs, and Aster pulls up onto its roof', climbed && Math.abs(roof - tower) < 0.3, JSON.stringify({ foot, climbed, roof, tower }));
  await shot(h, 'eng-slope-tower', false);

  // A bounce shroom in the Glowcap Wood still throws Aster up.
  const bounce = await h.eval(() => {
    const g = window.wyrm;
    const p = g.player;
    const s = g.level.props.find((q) => q.constructor.name === 'BounceShroom');
    if (!s) return null;
    const base = g.col.terrainAt(s.x, s.z);
    p.setState('move');
    p.place(s.x, base + 3, s.z, 0);
    let top = p.y;
    for (let i = 0; i < 45; i++) {
      window.__step(1 / 30, 1 / 30);
      top = Math.max(top, p.y);
    }
    return { base: +base.toFixed(1), top: +top.toFixed(1) };
  });
  h.check('a bounce shroom still launches Aster', !!bounce && bounce.top - bounce.base > 6, JSON.stringify(bounce));
}
