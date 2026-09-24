// Shared helpers for the Stormspire Falls scenarios.
//
// Software rendering runs at a few frames per second, far too coarse to time a
// jump and a flap. fastMode() detaches the game from requestAnimationFrame so
// a scenario steps it at a fixed 1/30 s, skipping the renderer except when a
// screenshot is wanted. Keys are still real keyboard events read by the game's
// own Input, so every move goes through the same code a player's would.

export async function boot(h, extra = '') {
  await h.go(`?level=falls&seed=${process.env.SEED ?? 1}&quality=low&maxdt=0.25${extra}`, 2500);
  await h.skipDialogue();
  await h.eval(() => {
    const g = window.wyrm;
    if (!g.save.elements.includes('fire')) g.learnElement('fire');
    g.player.element = 'fire';
  });
  await fastMode(h);
  await step(h, 0.3);
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

export async function shot(h, name) {
  await h.eval(() => window.__draw());
  await h.shot(name);
}

/** Presses Esc through any open conversation (stepping the game meanwhile). */
export async function skip(h, max = 12) {
  for (let i = 0; i < max; i++) {
    const st = await h.eval(() => window.wyrm.state);
    if (st === 'dialogue') {
      await h.page.keyboard.press('Escape');
      await step(h, 0.2);
    } else if (st === 'transition') await step(h, 0.3);
    else return;
  }
}

/** Puts the dragon on the ground at (x, z) facing yaw, optionally already running. */
export async function place(h, x, z, yaw, speed = 0, pitch = 0.3) {
  await h.eval(([x, z, yaw, speed, pitch]) => {
    const g = window.wyrm;
    const p = g.player;
    const y = g.col.groundAt(x, z, 1e4, 0.2).y;
    p.place(x, y + 0.05, z, yaw);
    p.setState('move');
    p.body.vx = Math.sin(yaw) * speed;
    p.body.vz = Math.cos(yaw) * speed;
    p.hp = p.maxHp;
    p.mana = p.maxMana;
    g.cam.snapBehind(yaw, pitch);
  }, [x, z, yaw, speed, pitch]);
  await step(h, 0.15);
}

export async function snap(h) {
  return h.eval(() => {
    const g = window.wyrm;
    const p = g.player;
    return {
      x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), g: p.body.grounded, st: p.state, glide: p.gliding,
      t: +g.time.toFixed(2), state: g.state, hp: Math.round(p.hp), safe: [+p.lastSafe.x.toFixed(1), +p.lastSafe.y.toFixed(1), +p.lastSafe.z.toFixed(1)],
    };
  });
}

/** Steps `sec` seconds in `every`-second slices, sampling the dragon. */
export async function track(h, sec, every = 0.1) {
  const out = [];
  for (let t = 0; t < sec; t += every) {
    await step(h, every);
    out.push(await snap(h));
  }
  return out;
}

/**
 * A full jump (Space held through the rise), then a flap, holding Space to
 * glide, with forward held throughout. Returns samples.
 */
export async function glideJump(h, holdSec, { forward = true, jumpHold = 0.3, flapGap = 0.07 } = {}) {
  const k = h.page.keyboard;
  if (forward) await k.down('KeyW');
  await k.down('Space');
  await step(h, jumpHold);
  await k.up('Space');
  await step(h, flapGap);
  await k.down('Space');
  const s = await track(h, holdSec);
  await k.up('Space');
  return s;
}

/**
 * Runs and jumps toward (tx, tz), easing off forward as the target comes
 * under us, the way a player steers a jump. `flap` adds a wing flap at the
 * top of the jump.
 */
export async function hop(h, tx, tz, { flap = false, maxSec = 1.6, brake = 1.3 } = {}) {
  const k = h.page.keyboard;
  const aim = () => h.eval(([x, z]) => {
    const g = window.wyrm; const p = g.player; const y = Math.atan2(x - p.x, z - p.z);
    g.cam.snapBehind(y, g.cam.pitch); return Math.hypot(x - p.x, z - p.z);
  }, [tx, tz]);
  await aim();
  await k.down('KeyW');
  await step(h, 0.1);
  await k.down('Space');
  let forward = true;
  const out = [];
  for (let t = 0; t < maxSec; t += 1 / 30) {
    if (Math.abs(t - 0.3) < 0.017) await k.up('Space');
    if (flap && Math.abs(t - 0.37) < 0.017) await k.down('Space');
    if (flap && Math.abs(t - 0.47) < 0.017) await k.up('Space');
    await step(h, 1 / 30);
    const d = forward ? await aim() : 0;
    if (forward && d < brake) {
      await k.up('KeyW');
      forward = false;
    }
    const s = await snap(h);
    out.push(s);
    if (s.g && t > 0.2) break;
  }
  await k.up('Space');
  await k.up('KeyW');
  await step(h, 0.15);
  out.push(await snap(h));
  return out;
}

/** Marks every arena cleared (for tests that walk past fights they do not stage). */
export async function clearArenas(h, ids = null) {
  await h.eval((ids) => {
    const g = window.wyrm;
    for (const a of g.level.arenas) {
      if (ids && !ids.includes(a.id)) continue;
      if (a.state === 'active') {
        for (const e of a.alive) if (e.alive) e.die(null);
        a.finish();
      } else a.state = 'cleared';
    }
  }, ids);
}

export async function hold(h, key, sec) {
  await h.page.keyboard.down(key);
  await step(h, sec);
  await h.page.keyboard.up(key);
}

export async function releaseAll(h) {
  for (const key of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyK', 'KeyJ', 'KeyQ', 'KeyU', 'ShiftLeft']) await h.page.keyboard.up(key);
  await step(h, 0.05);
}

export function summary(samples) {
  const maxY = Math.max(...samples.map((s) => s.y));
  const last = samples[samples.length - 1];
  return `maxY=${maxY.toFixed(1)} last=${JSON.stringify(last)}`;
}

/** True if the dragon fell into the gorge and respawned at some point. */
export function fell(samples) {
  return samples.some((s) => s.st === 'fall' || s.state === 'transition');
}
