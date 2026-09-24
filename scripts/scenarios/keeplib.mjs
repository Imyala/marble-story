// Shared helpers for the Eclipse Keep scenarios.

/** Places the dragon, full health and mana, camera behind. */
export async function place(h, x, z, yaw, y) {
  await h.eval(([x, z, yaw, y]) => {
    const g = window.wyrm;
    const gy = y ?? g.col.groundAt(x, z, 1e4, 0.2).y;
    g.player.place(x, gy + 0.1, z, yaw);
    g.cam.snapBehind(yaw, 0.3);
    g.player.lock = null;
    g.player.mana = g.player.maxMana;
    g.player.hp = g.player.maxHp;
  }, [x, z, yaw, y ?? null]);
  await h.wait(400);
}

export const where = (h) => h.eval(() => {
  const g = window.wyrm;
  const p = g.player;
  return { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), grounded: p.body.grounded, st: p.state, hp: Math.round(p.hp), gs: g.state };
});

/**
 * Runs an input script inside the frame loop so timing follows simulated
 * time, not the (very slow) software renderer. Each step waits for `after`
 * simulated seconds since the previous step and/or for the `when` predicate
 * (a JS expression over g and p), then sends its key events.
 */
export async function run(h, steps, limit = 12) {
  return h.eval(([steps, limit]) => new Promise((resolve) => {
    const g = window.wyrm;
    const key = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code }));
    const preds = steps.map((s) => (s.when ? new Function('g', 'p', `return (${s.when});`) : null));
    const orig = g.frame;
    const log = [];
    let i = 0;
    const t0 = g.realTime;
    let last = t0;
    g.maxDt = 1 / 30;
    g.frame = (dt) => {
      orig.call(g, dt);
      const now = g.realTime;
      while (i < steps.length) {
        const s = steps[i];
        if (now - last < (s.after ?? 0)) break;
        if (preds[i] && !preds[i](g, g.player)) break;
        for (const [type, code] of s.keys ?? []) key(type, code);
        const p = g.player;
        log.push(`${(now - t0).toFixed(2)}s #${i} x=${p.x.toFixed(1)} y=${p.y.toFixed(1)} z=${p.z.toFixed(1)}`);
        last = now;
        i++;
      }
      if (i >= steps.length || now - t0 > limit) {
        g.frame = orig;
        g.maxDt = 0.25;
        for (const c of ['KeyW', 'Space', 'KeyK']) key('keyup', c);
        resolve({ done: i >= steps.length, log });
      }
    };
  }), [steps, limit]);
}

export const tap = (code) => [['keydown', code], ['keyup', code]];
export const down = (code) => [['keydown', code]];
export const up = (code) => [['keyup', code]];

/** Grants all four breaths. */
export async function allElements(h) {
  await h.eval(() => {
    const g = window.wyrm;
    for (const e of ['fire', 'lightning', 'ice', 'earth']) if (!g.save.elements.includes(e)) g.learnElement(e);
  });
}
