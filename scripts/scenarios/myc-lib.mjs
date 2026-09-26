// Shared helpers for the myc-* scenarios (Act II: the Mycelium Deep).
//
// Built on hollow-lib's fixed-step fast mode: the game is detached from
// requestAnimationFrame and stepped at 1/30 s, rendering only for screenshots,
// so bounces, puffs and glides time the same on a slow headless machine.
import { act2Save, useSave, fastMode, step, skip, pos } from './hollow-lib.mjs';

export { act2Save, useSave, fastMode, step, skip, place, press, down, up, stick, stop, pos, face, steerTo, shot, found } from './hollow-lib.mjs';

/** An Act II save that has come through the Hollow Gate to the Deep (the Deep's arrival seen unless `intro`). */
export function mycSave(o = {}) {
  const s = act2Save({
    'story:hollow:arrive': true, 'story:hollow:mossa': true, 'tip:swim': true, 'tip:quests': true,
    ...(o.intro ? {} : { 'story:mycelium:arrive': true }), ...(o.found ?? {}),
  });
  s.unlocked.push('hollow', 'mycelium');
  s.level = 'mycelium';
  if (o.done) s.levelsDone.mycelium = true;
  return s;
}

/** Loads the Deep with `mycSave(o)` (or `o.save`), in fixed-step mode, talk skipped. */
export async function boot(h, o = {}) {
  await useSave(h, o.save === undefined ? mycSave(o) : o.save);
  await h.go(`?level=mycelium&seed=${o.seed ?? 3}&quality=${o.quality ?? 'low'}&maxdt=0.1${o.cp ? `&cp=${o.cp}` : ''}`, 2500);
  await fastMode(h);
  await step(h, 0.3);
  if (!o.keepDialogue) await skip(h);
  await h.eval(() => {
    const g = window.wyrm;
    if (g.state === 'pause') g.resume();
    g.input.wantPointerLock = false;
    g.player.element = g.player.element ?? 'fire';
  });
}

/** Sends Nyxa home for a scenario (tour shots, or puzzles she would stand in). */
export const noPartner = (h) => h.eval(() => { const g = window.wyrm; g.options.partner = false; g.partner.clear(); });

/** Clears every foe (so a puzzle test is not a fight). */
export const calm = (h) => h.eval(() => { for (const e of window.wyrm.enemies) if (e.alive) e.die(null); window.wyrm.player.hp = window.wyrm.player.maxHp; });

/** Selects an element (fire, lightning, ice, earth). */
export const element = (h, el) => h.eval((el) => { const g = window.wyrm; g.player.element = el; g.hud.elementChanged?.(el); }, el);

/** Breathes the current element for `sec` of game time, facing `yaw` first (optional). */
export async function breathe(h, sec, yaw) {
  if (yaw !== undefined) await h.eval((y) => { const g = window.wyrm; g.player.yaw = y; g.cam.yaw = y; }, yaw);
  await h.eval(() => window.wyrm.input.simulate('breath', true));
  await step(h, sec);
  await h.eval(() => window.wyrm.input.simulate('breath', false));
  await step(h, 0.1);
}

/** Faces (x, z) from where the dragon stands. */
export const lookAt = (h, x, z) => h.eval(([x, z]) => {
  const g = window.wyrm;
  const p = g.player;
  const y = Math.atan2(x - p.x, z - p.z);
  p.yaw = y;
  g.cam.yaw = y;
}, [x, z]);

/** A free camera at `from` looking at `to` (the dragon parked out of the way), for a clean vista. */
export async function vista(h, name, from, to, hud = false) {
  await h.eval(([f, t]) => {
    const g = window.wyrm;
    g.player.place(f[0], g.col.groundAt(f[0], f[2], 1e4, 0.2).y + 0.05, f[2], 0);
    g.player.hidden = true;
    const orig = g.cam.update.bind(g.cam);
    g.cam.update = () => {
      g.camera.position.set(f[0], f[1], f[2]);
      g.camera.lookAt(t[0], t[1], t[2]);
    };
    window.__restoreCam = () => { g.cam.update = orig; g.player.hidden = false; };
  }, [from, to]);
  await step(h, 0.5);
  await skip(h);
  await step(h, 0.2);
  const { shot } = await import('./hollow-lib.mjs');
  await shot(h, name, hud);
  await h.eval(() => window.__restoreCam());
}

/** The level's props of a class (by constructor name, fine in the dev build). */
export const props = (h, cls, map = 'p => ({ x: p.x, y: p.y, z: p.z })') => h.eval(([cls, map]) => {
  // eslint-disable-next-line no-new-func
  const f = new Function('return ' + map)();
  return window.wyrm.level.props.filter((p) => p.constructor.name === cls).map(f);
}, [cls, map]);

/** Talks to the interactable whose label matches `re`, and clicks through the conversation. */
export async function talk(h, re) {
  const ok = await h.eval((src) => {
    const t = window.wyrm.level.interactables.find((i) => new RegExp(src).test(i.label) && i.enabled);
    t?.interact();
    return !!t;
  }, re);
  await step(h, 0.1);
  for (let i = 0; i < 40; i++) {
    if ((await h.eval(() => window.wyrm.state)) !== 'dialogue') break;
    await h.eval(() => window.wyrm.dialogue.advance());
    await step(h, 0.1);
  }
  await step(h, 0.3);
  return ok;
}

/**
 * Moves toward (x, z) for up to `sec` of game time, steering every tenth of
 * a second: optionally jumping first (`jump`), flapping once near the top of
 * the arc (`flap`; with `then`, the arc after the bounce), holding Jump to glide (`glide`), or pounding (Tail in the
 * air) once falling (`pound`). Stops early once the dragon is standing within
 * `near` of the target. Returns the final position, the peak height and the
 * time taken.
 */
export async function airTo(h, x, z, sec = 3, o = {}) {
  let peak = -1e9;
  if (o.jump) await h.eval(() => window.wyrm.input.simulate('jump', true));
  let flapped = false;
  let pounded = false;
  let t = 0;
  for (; t < sec; t += 0.1) {
    const s = await h.eval(([x, z, stop]) => {
      const g = window.wyrm;
      const p = g.player;
      const d = Math.hypot(x - p.x, z - p.z);
      g.cam.yaw = Math.atan2(x - p.x, z - p.z);
      g.input.forceMove = d > stop ? { x: 0, y: 1 } : null;
      return { d, y: p.y, vy: p.body.vy, grounded: p.body.grounded };
    }, [x, z, o.stop ?? 0.4]);
    peak = Math.max(peak, s.y);
    if (o.jump && t >= 0.2 && !o.glide) await h.eval(() => window.wyrm.input.simulate('jump', false));
    if (o.flap && !flapped && !o.then && !s.grounded && s.vy < 1 && t > 0.2) {
      flapped = true;
      await h.eval(() => window.wyrm.input.simulate('jump', false));
      await step(h, 1 / 30);
      await h.eval(() => window.wyrm.input.simulate('jump', true));
      await step(h, 1 / 30);
      if (!o.glide) await h.eval(() => window.wyrm.input.simulate('jump', false));
    }
    if (o.pound && !pounded && !s.grounded && s.vy < -2 && s.d < (o.poundAt ?? 1) && t > 0.3) {
      pounded = true;
      await h.eval(() => window.wyrm.input.simulate('tail', true));
      await step(h, 1 / 30);
      await h.eval(() => window.wyrm.input.simulate('tail', false));
    }
    // Bounced (faster than `thenVy` up): on to the next target.
    if (o.then && s.vy > (o.thenVy ?? 12)) {
      [x, z] = o.then;
      o = { ...o, then: undefined };
    }
    if (s.grounded && s.d < (o.near ?? 1.2) && t > 0.3) break;
    await step(h, 0.1);
  }
  await h.eval(() => { const g = window.wyrm; g.input.forceMove = null; g.input.simulate('jump', false); });
  await step(h, 0.1);
  const p = await pos(h);
  return { ...p, peak: +peak.toFixed(2), t: +t.toFixed(1) };
}

/**
 * Swims toward (x, y, z) underwater, aiming the camera (and so the stroke)
 * at it each step, until within `near` or out of time; dives first if at the
 * surface. (As in hollow-secrets.)
 */
export async function swimTo(h, x, y, z, sec = 8, near = 1) {
  for (let t = 0; t < sec; t += 0.1) {
    const d = await h.eval(([x, y, z]) => {
      const g = window.wyrm;
      const p = g.player;
      const dx = x - p.x;
      const dz = z - p.z;
      const dy = y - p.y;
      const dh = Math.hypot(dx, dz);
      g.cam.yaw = Math.atan2(dx, dz);
      const elev = Math.max(-1.1, Math.min(1.1, Math.atan2(dy, Math.max(dh, 0.5))));
      g.cam.pitch = 0.3 - elev / 1.25;
      g.input.forceMove = { x: 0, y: dh + Math.abs(dy) > 0.5 ? 1 : 0 };
      return Math.hypot(dh, dy);
    }, [x, y, z]);
    if (d < near) break;
    const st = await pos(h);
    if (st.st === 'swim' && !st.under && y < -1.5) {
      await h.eval(() => window.wyrm.input.simulate('dodge', true));
      await step(h, 0.3);
      await h.eval(() => window.wyrm.input.simulate('dodge', false));
    }
    await step(h, 0.1);
  }
  await h.eval(() => { window.wyrm.input.forceMove = null; });
  return pos(h);
}

/** Where the collectible `id` is (x, y, z), or null once taken. */
export const where = (h, id) => h.eval((id) => {
  const c = window.wyrm.level.props.find((p) => p.id === id && !p.taken);
  return c ? { x: c.x, y: c.y, z: c.z } : null;
}, id);

/** A tap of an action (Horn, Tail...). */
export async function tap(h, action) {
  await h.eval((a) => window.wyrm.input.simulate(a, true), action);
  await step(h, 1 / 15);
  await h.eval((a) => window.wyrm.input.simulate(a, false), action);
  await step(h, 0.4);
}
