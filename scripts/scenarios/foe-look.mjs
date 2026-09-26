// A look at the Mycelium Deep's four new foes in a dark cave: a line-up, then
// each one close up, idle and mid-trick. Checks only that nothing breaks; the
// screenshots are for judging readability by eye.

import { lab, LAB, spawn, foe, step, place, shot, invuln, aim, clearFoes, me } from './foe-lib.mjs';

/**
 * A portrait of foe i: Aster off to one side, the camera `d` metres out at
 * angle `side` from the foe's front, looking at it from `up` metres high.
 */
async function frame(h, i, d = 5.5, side = 0, up = 1.6) {
  await h.eval(([i, d, side, up]) => {
    const g = window.wyrm;
    const e = window.__foes[i];
    const a = Math.PI + side;
    const ax = e.x + Math.sin(a + 0.9) * (d * 0.8);
    const az = e.z + Math.cos(a + 0.9) * (d * 0.8);
    g.player.place(ax, g.col.groundAt(ax, az, 1e4, 0.3).y + 0.05, az, Math.atan2(e.x - ax, e.z - az));
    g.player.body.vx = g.player.body.vz = 0;
    const cx = e.x + Math.sin(a) * d;
    const cz = e.z + Math.cos(a) * d;
    const cy = g.col.groundAt(cx, cz, 1e4, 0.3).y + up;
    const pos = g.camera.position.clone().set(cx, cy, cz);
    const look = pos.clone().set(e.x, e.y + e.height * 0.55, e.z);
    g.cam.setShot(pos, look);
  }, [i, d, side, up]);
}

/** Holds foe i in place, calm, facing Aster. */
const calm = (h, i) => h.eval((i) => {
  const e = window.__foes[i];
  e.aggro = false;
  e.globalCd = 99;
}, i);

/** Starts attack `id` of foe i (from its def, or a scripted one by name). */
const windup = (h, i, id) => h.eval(([i, id]) => {
  const e = window.__foes[i];
  const a = e.def.attacks.find((q) => q.id === id);
  e.aggro = true;
  if (a) e.startAttack(a);
}, [i, id]);

export default async function (h) {
  await lab(h);
  await invuln(h);
  await h.eval(() => window.wyrm.hud.clearFlick());
  // A line-up, seen from the front.
  await place(h, LAB.x, LAB.z - 9, 0);
  await spawn(h, 'sporeling', LAB.x - 4.5, LAB.z - 2.5, Math.PI, { noElite: true });
  await spawn(h, 'sporeling', LAB.x - 3.4, LAB.z - 3.6, Math.PI, { noElite: true });
  await spawn(h, 'puffcap', LAB.x - 1.2, LAB.z, Math.PI, { noElite: true });
  await spawn(h, 'rootstalker', LAB.x + 2.2, LAB.z - 2, Math.PI, { noElite: true });
  await spawn(h, 'thornspitter', LAB.x + 5.4, LAB.z + 0.5, Math.PI, { noElite: true });
  for (let i = 0; i < 5; i++) await calm(h, i);
  await step(h, 3.5);
  await aim(h, LAB.x, LAB.z, 0.22);
  await h.eval(() => { const g = window.wyrm; g.cam.snapBehind(g.player.yaw, 0.2); });
  await step(h, 0.2);
  await shot(h, 'foe-lineup', false);
  const n = await h.eval(() => window.wyrm.enemies.filter((e) => e.alive).length);
  h.check('all four kinds spawn', n === 5, `${n}`);
  await clearFoes(h);

  // Sporelings: a gang, one winding up a headbutt.
  for (let k = 0; k < 4; k++) await spawn(h, 'sporeling', LAB.x - 1.5 + k * 1.1, LAB.z + (k % 2) * 0.8, Math.PI, { noElite: true });
  for (let k = 0; k < 4; k++) await calm(h, k);
  await frame(h, 1, 4.5, 0.3, 1.3);
  await step(h, 1.2);
  await windup(h, 2, 'headbutt');
  await step(h, 0.35);
  await shot(h, 'foe-sporelings', false);
  await clearFoes(h);

  // Puffcap: calm, then swelling for its puff, then growing sporelings.
  await spawn(h, 'puffcap', LAB.x, LAB.z, Math.PI, { noElite: true });
  await calm(h, 0);
  await frame(h, 0, 6.5, 0.35, 2.0);
  await step(h, 1.2);
  await shot(h, 'foe-puffcap', false);
  await windup(h, 0, 'puff');
  await step(h, 0.65);
  await shot(h, 'foe-puffcap-puff', false);
  await step(h, 0.45);
  await shot(h, 'foe-puffcap-ring', false);
  await clearFoes(h);

  // Rootstalker: close up, then flipped on its back.
  await spawn(h, 'rootstalker', LAB.x, LAB.z, Math.PI, { noElite: true });
  await calm(h, 0);
  await frame(h, 0, 5, 0.6, 2.2);
  await step(h, 1.2);
  await shot(h, 'foe-rootstalker', false);
  await h.eval(() => { const e = window.__foes[0]; e.flipped = 4.5; e.state = 'down'; e.stateT = 0; });
  await step(h, 0.6);
  await shot(h, 'foe-rootstalker-flipped', false);
  await clearFoes(h);

  // Thornspitter: idle, winding up a fan, pulled in, and dazed.
  await spawn(h, 'thornspitter', LAB.x, LAB.z, Math.PI, { noElite: true });
  await calm(h, 0);
  await frame(h, 0, 6.5, 0.3, 1.8);
  await step(h, 1.2);
  await shot(h, 'foe-thornspitter', false);
  await windup(h, 0, 'fan');
  await step(h, 0.7);
  await shot(h, 'foe-thornspitter-windup', false);
  await step(h, 0.35);
  await shot(h, 'foe-thornspitter-fan', false);
  await h.eval(() => { const e = window.__foes[0]; e.aggro = true; e.mode = 'sink'; e.modeT = 0; });
  await step(h, 0.6);
  const m = await foe(h, 0);
  await shot(h, 'foe-thornspitter-hidden', false);
  h.check('a pulled-in thornspitter hides all but its mound', !m.vis && (m.mode === 'hidden'), JSON.stringify(m));
  await h.eval(() => { const e = window.__foes[0]; e.mode = 'dazed'; e.modeT = 0; e.hideFor = 3; e.model.dazed = true; e.model.retract = 0; });
  await step(h, 0.6);
  await shot(h, 'foe-thornspitter-dazed', false);
  await clearFoes(h);
  await h.eval(() => window.wyrm.cam.clearShot());
  const s = await me(h);
  h.check('Aster fine after all that', s.alive, JSON.stringify(s));
}
