// Shared helpers for the Frostworks scenarios.

/** Teleports the dragon onto the ground at (x, z), at or below `maxY`. */
export async function place(h, x, z, yaw = 0, maxY = 1e4) {
  await h.eval(([x, z, yaw, maxY]) => {
    const g = window.wyrm;
    const y = g.col.groundAt(x, z, maxY, 0.2).y;
    g.player.place(x, y + 0.05, z, yaw);
    g.player.body.grounded = true;
    g.cam.snapBehind(yaw, 0.32);
  }, [x, z, yaw, maxY]);
  await h.wait(150);
}

export async function grounded(h) {
  return h.eval(() => {
    const b = window.wyrm.player.body;
    return { grounded: b.grounded, y: +b.y.toFixed(2), x: +b.x.toFixed(2), z: +b.z.toFixed(2), dyn: !!(b.ground && b.ground.dynamic) };
  });
}

export async function elem(h, key) {
  await h.tap(key, 1, 200);
}

export async function gateAlive(h, x, z) {
  return h.eval(([x, z]) => {
    const g = window.wyrm;
    const gate = g.level.hittables.find((t) => t.constructor.name === 'Gate' && Math.hypot(t.x - x, t.z - z) < 1.5);
    return gate ? gate.alive : 'missing';
  }, [x, z]);
}

/** Kills whatever the arena spawns until it reports cleared (timeout in game seconds). */
export async function clearArena(h, id, maxGame = 30) {
  const t0 = await h.eval(() => window.wyrm.time);
  for (;;) {
    const st = await h.eval((id) => {
      const g = window.wyrm;
      const a = g.level.arenas.find((a) => a.id === id);
      if (!a) return 'missing';
      if (a.state !== 'active') return a.state;
      for (const e of g.enemies) {
        if (!e.alive || e.state === 'spawn') continue;
        if (Math.hypot(e.x - a.x, e.z - a.z) > a.r + 4) continue;
        e.hp = 0;
        e.die(null);
      }
      return a.state;
    }, id);
    if (st === 'cleared') return true;
    if (st === 'missing' || st === 'idle') return false;
    if ((await h.eval(() => window.wyrm.time)) - t0 > maxGame) return false;
    await h.skipDialogue(300);
    await h.wait(150);
  }
}

export async function heal(h) {
  await h.eval(() => { const p = window.wyrm.player; p.hp = p.maxHp; p.mana = p.maxMana; });
}

/** Removes roaming enemies within r of (x, z) so scripted moves are not interrupted. */
export async function clearNear(h, x, z, r) {
  await h.eval(([x, z, r]) => {
    const g = window.wyrm;
    for (const e of g.enemies) if (e.alive && !e.isBoss && Math.hypot(e.x - x, e.z - z) < r) { e.hp = 0; e.die(null); }
  }, [x, z, r]);
}

/** Waits until `secs` of game time have passed (the software renderer runs slow). */
export async function waitGame(h, secs, maxMs = 400000) {
  const t0 = await h.eval(() => window.wyrm.time);
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const t = await h.eval(() => window.wyrm.time);
    if (t - t0 >= secs) return;
    await h.wait(40);
  }
}

/** Holds keys for `secs` of game time. */
export async function holdGame(h, keys, secs) {
  for (const k of keys) await h.page.keyboard.down(k);
  await waitGame(h, secs);
  for (const k of keys) await h.page.keyboard.up(k);
}

/** Polls a page predicate until it is truthy or `maxGame` seconds of game time pass. */
export async function until(h, fn, arg, maxGame = 20) {
  const t0 = await h.eval(() => window.wyrm.time);
  for (;;) {
    const v = await h.eval(fn, arg);
    if (v) return v;
    const t = await h.eval(() => window.wyrm.time);
    if (t - t0 > maxGame) return null;
    await h.wait(30);
  }
}

/**
 * A real jump: optional run-up, a full jump (held past the short-hop cut),
 * an optional flap, then waits to land.
 */
export async function jump(h, keys, run, air, flap = false) {
  for (const k of keys) await h.page.keyboard.down(k);
  await waitGame(h, run);
  await h.page.keyboard.down('Space');
  await waitGame(h, 0.3);
  await h.page.keyboard.up('Space');
  if (flap) {
    await waitGame(h, 0.03);
    await h.page.keyboard.down('Space');
    await waitGame(h, 0.12);
    await h.page.keyboard.up('Space');
  }
  await waitGame(h, air);
  for (const k of keys) await h.page.keyboard.up(k);
  await until(h, () => window.wyrm.player.body.grounded, null, 3);
  await waitGame(h, 0.1);
  return grounded(h);
}
