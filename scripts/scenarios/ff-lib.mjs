// Shared helpers for the ff-* scenarios (Stormspire Falls and The Frostworks
// side areas, lore letters, eggs, chests and breakables).
import { fastMode, step, skip, snap, hop, glideJump, track, releaseAll, clearArenas } from './falls-lib.mjs';

export { fastMode, step, skip, snap, hop, glideJump, track, releaseAll, clearArenas };

/** Loads a level in fixed-step mode (the renderer only runs for screenshots). */
export async function boot(h, level, extra = '') {
  await h.go(`?level=${level}&seed=${process.env.SEED ?? 1}&quality=low&maxdt=0.25${extra}`, 2500);
  await h.skipDialogue();
  await fastMode(h);
  await step(h, 0.3);
  await skip(h);
  await step(h, 0.5);
  await unpause(h);
  await h.eval(() => {
    const g = window.wyrm;
    for (const e of ['fire', 'lightning']) if (!g.save.elements.includes(e)) g.learnElement(e);
    g.player.element = 'fire';
    g.player.invuln = true;
  });
}

/** An Esc buffered while skipping a conversation can open the pause menu: close it. */
export async function unpause(h) {
  await h.eval(() => { const g = window.wyrm; if (g.state === 'pause') g.resume(); });
}

/** Puts the dragon on the highest ground at or below maxY at (x, z). */
export async function place(h, x, z, yaw = 0, maxY = 1e4, pitch = 0.3) {
  await unpause(h);
  await h.eval(([x, z, yaw, maxY, pitch]) => {
    const g = window.wyrm;
    const p = g.player;
    const y = g.col.groundAt(x, z, maxY, 0.2).y;
    p.place(x, y + 0.05, z, yaw);
    p.setState('move');
    p.body.vx = p.body.vz = 0;
    p.hp = p.maxHp;
    p.mana = p.maxMana;
    g.cam.snapBehind(yaw, pitch);
  }, [x, z, yaw, maxY, pitch]);
  await step(h, 0.15);
}

/** Renders one frame and returns the draw calls it took. */
export async function draw(h) {
  return h.eval(() => {
    window.__draw();
    return window.wyrm.renderer.gl.info.render.calls;
  });
}

/** Screenshot from the dragon's chase camera. Returns draw calls. */
export async function chase(h, name, x, z, yaw, pitch = 0.35, maxY = 1e4) {
  await place(h, x, z, yaw, maxY, pitch);
  await h.eval(() => { const g = window.wyrm; g.hud.show(false); g.hud.flick('', 0.01); });
  await step(h, 0.6);
  const calls = await draw(h);
  await h.shot(name);
  await h.eval(() => window.wyrm.hud.show(true));
  console.log(`view ${name}: ${calls} draw calls`);
  return calls;
}

/** Screenshot from a fixed camera (the dragon stands at px, pz). Returns draw calls. */
export async function vista(h, name, cam, look, px = look[0], pz = look[2]) {
  await place(h, px, pz, 0);
  await h.eval(([c, l]) => {
    const g = window.wyrm;
    const V = g.camera.position.constructor;
    g.hud.show(false);
    g.cam.setShot(new V(...c), new V(...l));
  }, [cam, look]);
  await step(h, 2.5);
  const calls = await draw(h);
  await h.shot(name);
  await h.eval(() => { const g = window.wyrm; g.cam.clearShot(); g.hud.show(true); });
  console.log(`vista ${name}: ${calls} draw calls`);
  return calls;
}

/** Ground height at (x, z) under maxY, or null over a void. */
export async function groundAt(h, x, z, maxY = 1e4) {
  return h.eval(([x, z, maxY]) => {
    const r = window.wyrm.col.groundAt(x, z, maxY, 0.2);
    return r.y > -1e3 ? +r.y.toFixed(2) : null;
  }, [x, z, maxY]);
}

/** Every egg, letter and chest the level placed, with where it is and whether it is taken. */
export async function finds(h) {
  return h.eval(() => {
    const g = window.wyrm;
    const out = [];
    for (const p of g.level.props) {
      const n = p.constructor.name;
      if (n === 'Collectible' && (p.kind === 'egg' || p.kind === 'letter')) out.push({ id: p.id, kind: p.kind, x: +p.x.toFixed(1), y: +p.y.toFixed(1), z: +p.z.toFixed(1) });
      if (n === 'Chest') out.push({ id: p.id, kind: 'chest', x: +p.x.toFixed(1), y: +p.y.toFixed(1), z: +p.z.toFixed(1) });
    }
    return out;
  });
}

export const found = (h, key) => h.eval((k) => !!window.wyrm.save.found[k], key);

/** Walks toward (tx, tz) holding W for up to `sec`, steering each tick. Returns the last sample. */
export async function walkTo(h, tx, tz, sec = 3, near = 0.6) {
  const k = h.page.keyboard;
  await k.down('KeyW');
  let s;
  for (let t = 0; t < sec; t += 0.1) {
    const d = await h.eval(([x, z]) => {
      const g = window.wyrm; const p = g.player; const y = Math.atan2(x - p.x, z - p.z);
      g.cam.snapBehind(y, g.cam.pitch); return Math.hypot(x - p.x, z - p.z);
    }, [tx, tz]);
    if (d < near) break;
    await step(h, 0.1);
  }
  await k.up('KeyW');
  await step(h, 0.2);
  s = await snap(h);
  return s;
}

/** Faces (tx, tz) exactly. */
export async function face(h, tx, tz) {
  await h.eval(([x, z]) => {
    const g = window.wyrm; const p = g.player; const y = Math.atan2(x - p.x, z - p.z);
    p.yaw = y; g.cam.snapBehind(y, g.cam.pitch);
  }, [tx, tz]);
}

/** Horn attacks (J) until nothing breakable stands within r of (x, z), or `max` swings. */
export async function smashAround(h, x, z, r = 2.5, max = 16) {
  for (let i = 0; i < max; i++) {
    const left = await h.eval(([x, z, r]) => {
      const g = window.wyrm; const p = g.player;
      const bs = g.level.hittables.filter((t) => t.constructor.name === 'Breakable' && t.alive && Math.hypot(t.x - x, t.z - z) < r);
      if (!bs.length) return 0;
      bs.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
      const t = bs[0];
      p.yaw = Math.atan2(t.x - p.x, t.z - p.z);
      g.cam.snapBehind(p.yaw, g.cam.pitch);
      return bs.length;
    }, [x, z, r]);
    if (!left) return true;
    await h.page.keyboard.press('KeyJ');
    await step(h, 0.45);
  }
  return false;
}

/** Counts breakables of each kind in the level. */
export async function breakableCounts(h) {
  return h.eval(() => {
    const out = {};
    for (const t of window.wyrm.level.hittables) if (t.constructor.name === 'Breakable') out[t.kind] = (out[t.kind] ?? 0) + 1;
    return out;
  });
}
