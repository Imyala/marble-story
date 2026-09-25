/** A realm's egg thief: chase it for a while; it must keep to dry, reachable ground near its den. LVL=<id> */
export default async function (h) {
  const lvl = process.env.LVL ?? 'fen';
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 900; i++) {
      await h.wait(30);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.page.addInitScript(() => localStorage.clear());
  await h.go(`?level=${lvl}&seed=5&quality=low&maxdt=0.05`, 2500);
  await h.skipDialogue(8000);
  const home = await h.eval((lvl) => {
    const g = window.wyrm;
    if (g.state === 'pause') g.resume();
    g.player.invuln = true;
    const t = g.level.props.find((p) => p.id === `${lvl}:egg-thief` && p.mode);
    window.__t = t;
    if (!t) return null;
    for (const e of g.enemies) { e.alive = false; e.state = 'dead'; e.deadT = 1; }
    g.player.place(t.x, g.col.groundAt(t.x, t.z - 8, t.y + 3, 0.1).y + 0.05, t.z - 8, 0);
    return [t.x, t.y, t.z];
  }, lvl);
  h.check('the realm has an egg thief', !!home, lvl);
  if (!home) return;
  await waitGame(0.5);
  let worst = { wet: 0, far: 0, drop: 0, path: 0 };
  let last = null;
  for (let i = 0; i < 20; i++) {
    await h.eval(() => { const g = window.wyrm; const t = window.__t; const dx = g.player.x - t.x; const dz = g.player.z - t.z; const d = Math.hypot(dx, dz) || 1; const px = t.x + dx / d * 5; const pz = t.z + dz / d * 5; const y = g.col.groundAt(px, pz, t.y + 3, 0.1).y; if (y > t.y - 3 && !g.isDeepWater(px, pz, y)) g.player.place(px, y + 0.05, pz, 0); });
    await waitGame(0.5);
    const s = await h.eval((home) => { const g = window.wyrm; const t = window.__t; const gy = g.col.groundAt(t.x, t.z, t.y + 1, 0.1).y; return { x: t.x, z: t.z, wet: g.isDeepWater(t.x, t.z, gy) ? 1 : 0, far: Math.hypot(t.x - home[0], t.z - home[2]), drop: home[1] - t.y, mode: t.mode }; }, home);
    if (last) worst.path += Math.hypot(s.x - last.x, s.z - last.z);
    last = s;
    worst = { wet: Math.max(worst.wet, s.wet), far: Math.max(worst.far, s.far), drop: Math.max(worst.drop, s.drop), path: worst.path, mode: s.mode };
  }
  h.check('it runs about on dry ground near its den, without dropping off', worst.wet === 0 && worst.far < 22 && worst.drop < 3 && worst.path > 15, JSON.stringify(worst));
  await h.shot(`thief-${lvl}`);
}
