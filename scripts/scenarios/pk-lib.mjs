// Shared helpers for the pk-* scenarios (Stonewild Plains and Eclipse Keep content).

export async function waitGame(h, sec) {
  const start = await h.eval(() => window.wyrm.time);
  for (let i = 0; i < 200; i++) {
    await h.wait(60);
    if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
  }
}

/** Loads a realm on low quality with game-time stepping and no intro chatter. */
export async function load(h, level, extra = '') {
  await h.go(`?level=${level}&seed=3&quality=low&maxdt=0.1${extra}`, 2500);
  await h.skipDialogue(8000);
  await h.eval(() => {
    const g = window.wyrm;
    for (const e of ['fire', 'lightning', 'ice', 'earth']) if (!g.save.elements.includes(e)) g.learnElement(e);
  });
}

/** Freezes every roaming enemy in place so views and routes are not interrupted. */
export async function calmEnemies(h) {
  await h.eval(() => {
    for (const e of window.wyrm.enemies) if (!e.isBoss) { e.aggro = false; e.def = { ...e.def, aggroRange: 0 }; }
  });
}

export async function place(h, x, z, yaw, y) {
  await h.eval(([x, z, yaw, y]) => {
    const g = window.wyrm;
    const gy = y ?? g.col.groundAt(x, z, 1e4, 0.2).y;
    g.player.place(x, gy + 0.05, z, yaw);
    g.player.setState('move');
    g.player.yaw = yaw;
    g.cam.clearShot();
    g.cam.snapBehind(yaw, 0.3);
    g.player.mana = g.player.maxMana;
    g.player.hp = g.player.maxHp;
  }, [x, z, yaw, y ?? null]);
  await waitGame(h, 0.4);
}

/** A fixed camera shot from pos looking at look. */
export async function shotFrom(h, pos, look) {
  await h.eval(([pos, look]) => {
    const g = window.wyrm;
    const V = g.camera.position.constructor;
    g.cam.setShot(new V(...pos), new V(...look));
  }, [pos, look]);
  await waitGame(h, 0.5);
}

/** Draw calls of the most recent rendered frame (low quality renders in one pass). */
export async function calls(h) {
  await h.wait(300);
  return h.eval(() => window.wyrm.renderer.gl.info.render.calls);
}

export const where = (h) => h.eval(() => {
  const p = window.wyrm.player;
  return { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), grounded: p.body.grounded, st: p.state, hp: Math.round(p.hp) };
});

export const found = (h, key) => h.eval((key) => !!window.wyrm.save.found[key], key);

/**
 * Runs an input script inside the frame loop so timing follows game time.
 * Each step waits `after` game seconds and/or until `when` (JS over g, p) holds,
 * then sends its key events. Movement can be steered toward `to: [x, z]`.
 */
export async function run(h, steps, limit = 12) {
  return h.eval(([steps, limit]) => new Promise((resolve) => {
    const g = window.wyrm;
    const key = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code }));
    const preds = steps.map((s) => (s.when ? new Function('g', 'p', `return (${s.when});`) : null));
    const orig = g.frame;
    const log = [];
    let i = 0;
    const t0 = g.time;
    let last = t0;
    let steer = null;
    g.frame = (dt) => {
      orig.call(g, dt);
      const now = g.time;
      const p = g.player;
      if (steer) {
        const dx = steer[0] - p.x;
        const dz = steer[1] - p.z;
        const d = Math.hypot(dx, dz);
        const cy = g.cam.yaw;
        const fx = Math.sin(cy);
        const fz = Math.cos(cy);
        const rx = -Math.cos(cy);
        const rz = Math.sin(cy);
        g.input.forceMove = d > 0.3 ? { x: (dx * rx + dz * rz) / d, y: (dx * fx + dz * fz) / d } : { x: 0, y: 0 };
      }
      while (i < steps.length) {
        const s = steps[i];
        if (now - last < (s.after ?? 0)) break;
        if (preds[i] && !preds[i](g, p)) break;
        for (const [type, code] of s.keys ?? []) key(type, code);
        if (s.to !== undefined) steer = s.to;
        if (s.stop) { steer = null; g.input.forceMove = null; }
        log.push(`${(now - t0).toFixed(2)}s #${i} x=${p.x.toFixed(1)} y=${p.y.toFixed(1)} z=${p.z.toFixed(1)}`);
        last = now;
        i++;
      }
      if (i >= steps.length || now - t0 > limit) {
        g.frame = orig;
        g.input.forceMove = null;
        for (const c of ['KeyW', 'Space', 'KeyK', 'KeyE']) key('keyup', c);
        resolve({ done: i >= steps.length, log });
      }
    };
  }), [steps, limit]);
}

export const tap = (code) => [['keydown', code], ['keyup', code]];
export const down = (code) => [['keydown', code]];
export const up = (code) => [['keyup', code]];

/** Counts of this realm's new content. */
export const census = (h) => h.eval(() => {
  const g = window.wyrm;
  const l = g.level;
  const bs = l.hittables.filter((x) => x.constructor.name === 'Breakable');
  const kinds = {};
  for (const b of bs) kinds[b.kind] = (kinds[b.kind] ?? 0) + 1;
  return {
    breakables: bs.length, kinds,
    chests: l.hittables.filter((x) => x.constructor.name === 'Chest').length,
    letters: l.secrets.filter((s) => s.kind === 'letter').map((s) => s.id),
    eggs: l.secrets.filter((s) => s.kind === 'egg').map((s) => s.id),
    enemies: g.enemies.filter((e) => e.alive).length,
  };
});
