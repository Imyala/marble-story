// Shared helpers for the hollow-* scenarios (Act II: the Hollow Gate, swimming).
//
// Like falls-lib, the game is detached from requestAnimationFrame and stepped
// at a fixed 1/30 s, rendering only for screenshots, so swims, dives and
// jumps time the same way on a slow headless machine as on a fast one.

/** A save that has finished Act I: every element, the Keep done, the Sanctum's talks heard. */
export function act2Save(found = {}) {
  const els = ['fire', 'lightning', 'ice', 'earth'];
  const upgrades = {};
  for (const e of els) upgrades[`${e}Breath`] = upgrades[`${e}Burst`] = 1;
  return {
    version: 1, level: 'sanctum', checkpoint: null, elements: els, upgrades, gems: 400, heartShards: 0, manaShards: 0,
    found: {
      'story:sanctum:arrive': true, 'story:sanctum:lesson-done': true, 'story:sanctum:back-falls': true, 'story:sanctum:back-frost': true,
      'story:sanctum:back-plains': true, ...found,
    },
    levelsDone: { fen: true, falls: true, frostworks: true, plains: true, keep: true },
    unlocked: ['fen', 'sanctum', 'falls', 'frostworks', 'plains', 'keep'],
    difficulty: 'normal', stats: { kills: 0, bestCombo: 0, playTime: 0, deaths: 0, reactions: 0 }, clears: 1,
  };
}

/** Writes `save` (or clears storage when null) before every page load. */
export async function useSave(h, save) {
  await h.page.addInitScript((s) => {
    localStorage.clear();
    if (s) localStorage.setItem('wyrmling.save.v1', JSON.stringify(s));
  }, save);
}

/** Loads a level with the Act II save (the Hollow's intro already seen unless `intro`), in fixed-step mode. */
export async function boot(h, level = 'hollow', o = {}) {
  const found = o.intro ? {} : { 'story:hollow:arrive': true, 'tip:swim': true, ...(o.found ?? {}) };
  await useSave(h, o.save === undefined ? act2Save(found) : o.save);
  await h.go(`?level=${level}&seed=${o.seed ?? 3}&quality=low&maxdt=0.1`, 2500);
  await fastMode(h);
  await step(h, 0.3);
  if (!o.keepDialogue) await skip(h);
  await h.eval(() => {
    const g = window.wyrm;
    if (g.state === 'pause') g.resume();
    // Headless has no pointer lock: hide the "click to play" hint.
    g.input.wantPointerLock = false;
    g.player.element = g.player.element ?? 'fire';
  });
}

export async function fastMode(h) {
  await h.eval(() => {
    const g = window.wyrm;
    if (g.__frame) return;
    g.__frame = g.frame.bind(g);
    g.__render = g.renderer.render.bind(g.renderer);
    g.frame = () => {};
    g.renderer.render = () => {};
    window.__step = (sec, dt) => {
      const n = Math.max(1, Math.round(sec / dt));
      for (let i = 0; i < n; i++) g.__frame(dt);
    };
    window.__draw = () => {
      g.renderer.render = g.__render;
      g.__frame(1 / 60);
      g.renderer.render = () => {};
    };
  });
}

export const step = (h, sec, dt = 1 / 30) => h.eval(([s, d]) => window.__step(s, d), [sec, dt]);

/** Presses Esc through any open conversation (stepping the game meanwhile). */
export async function skip(h, max = 16) {
  for (let i = 0; i < max; i++) {
    const st = await h.eval(() => window.wyrm.state);
    if (st === 'dialogue') {
      await h.page.keyboard.press('Escape');
      await step(h, 0.2);
    } else if (st === 'transition') await step(h, 0.3);
    else break;
  }
  await h.eval(() => { const g = window.wyrm; if (g.state === 'pause') g.resume(); });
}

/** Puts the dragon on the highest ground at (x, z) (or at height y), facing yaw. */
export async function place(h, x, z, yaw = 0, y, pitch = 0.3) {
  await h.eval(([x, z, yaw, y, pitch]) => {
    const g = window.wyrm;
    const p = g.player;
    const gy = y ?? g.col.groundAt(x, z, 1e4, 0.2).y + 0.05;
    p.setState('move');
    p.place(x, gy, z, yaw);
    p.body.vx = p.body.vz = 0;
    p.hp = p.maxHp;
    p.mana = p.maxMana;
    g.cam.snapBehind(yaw, pitch);
  }, [x, z, yaw, y ?? null, pitch]);
  await step(h, 0.1);
}

/** Holds an action for `sec` of game time. */
export async function press(h, action, sec = 0.1) {
  await h.eval((a) => window.wyrm.input.simulate(a, true), action);
  await step(h, sec);
  await h.eval((a) => window.wyrm.input.simulate(a, false), action);
  await step(h, 1 / 30);
}

export const down = (h, action) => h.eval((a) => window.wyrm.input.simulate(a, true), action);
export const up = (h, action) => h.eval((a) => window.wyrm.input.simulate(a, false), action);
/** Holds the move stick (x right, y forward) until `stop`. */
export const stick = (h, x, y) => h.eval(([x, y]) => { window.wyrm.input.forceMove = { x, y }; }, [x, y]);
export const stop = (h) => h.eval(() => { window.wyrm.input.forceMove = null; });

/** Where the dragon is and what it is doing. */
export const pos = (h) => h.eval(() => {
  const g = window.wyrm;
  const p = g.player;
  return {
    x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), st: p.state, under: p.swimUnder, sub: p.submerged, air: +p.air.toFixed(2),
    hp: Math.round(p.hp), grounded: p.body.grounded, state: g.state, camY: +g.camera.position.y.toFixed(2), uw: g.renderer.look.underwater,
  };
});

/** Turns the camera (and the stick with it) to face `yaw`. */
export const face = (h, yaw, pitch) => h.eval(([yaw, pitch]) => {
  const g = window.wyrm;
  g.cam.yaw = yaw;
  if (pitch !== null) g.cam.pitch = pitch;
}, [yaw, pitch ?? null]);

/** Runs `sec` of game time while steering the stick toward (x, z) each step. Returns the final position. */
export async function steerTo(h, x, z, sec = 4, near = 0.6) {
  for (let t = 0; t < sec; t += 0.1) {
    const d = await h.eval(([x, z]) => {
      const g = window.wyrm;
      const p = g.player;
      g.cam.yaw = Math.atan2(x - p.x, z - p.z);
      g.input.forceMove = { x: 0, y: 1 };
      return Math.hypot(x - p.x, z - p.z);
    }, [x, z]);
    if (d < near) break;
    await step(h, 0.1);
  }
  await stop(h);
  return pos(h);
}

/** Screenshot of the current view; `hud` false hides the HUD for a clean look at the scene. */
export async function shot(h, name, hud = true) {
  await h.eval((hud) => {
    const g = window.wyrm;
    g.input.wantPointerLock = false;
    g.hud.show(hud);
    g.hud.clearFlick();
    window.__draw();
  }, hud);
  // Let the HUD's fades finish (they run on the wall clock).
  await h.page.waitForTimeout(450);
  await h.eval(() => window.__draw());
  await h.shot(name);
  await h.eval(() => window.wyrm.hud.show(true));
}

/** True if the save holds `key`. */
export const found = (h, key) => h.eval((k) => !!window.wyrm.save.found[k], key);
