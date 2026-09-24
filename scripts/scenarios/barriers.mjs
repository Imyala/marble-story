/**
 * Walls that levels use as barriers must stay barriers: a jump, a flap and a
 * ledge grab together must not carry the dragon over them.
 */
async function jumpFlapAt(h, x, z, yaw) {
  await h.eval(({ x, z, yaw }) => {
    const g = window.wyrm;
    for (const e of g.enemies) { e.alive = false; e.state = 'dead'; e.deadT = 1; }
    const y = g.col.groundAt(x, z, 1e4, 0.1).y;
    g.player.place(x, y + 0.05, z, yaw);
    g.cam.snapBehind(yaw);
    window.__top = -99;
  }, { x, z, yaw });
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 100; i++) {
      await h.wait(60);
      const t = await h.eval(() => { const g = window.wyrm; window.__top = Math.max(window.__top, g.player.y); return g.time; });
      if (t - start >= sec) return;
    }
  };
  await waitGame(0.3);
  await h.page.keyboard.down('KeyW');
  await h.page.keyboard.down('Space');
  await waitGame(0.3);
  await h.page.keyboard.up('Space');
  await waitGame(0.08);
  await h.page.keyboard.down('Space');
  await waitGame(0.25);
  await h.page.keyboard.up('Space');
  await waitGame(1.6);
  await h.page.keyboard.up('KeyW');
  return h.eval(() => ({ y: +window.wyrm.player.y.toFixed(2), z: +window.wyrm.player.z.toFixed(2), top: +window.__top.toFixed(2), st: window.wyrm.player.state }));
}

export default async function (h) {
  // Stonewild Plains: the 5.5 m terrace wall is climbed by freezing the spring, not by flapping.
  await h.go('?level=plains&seed=3&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  const r = await jumpFlapAt(h, 12, 21.5, 0);
  h.check('a jump and flap from the Vale cannot climb the terrace wall', r.y < 5, JSON.stringify(r));
  // Sanctum: the Hall of Moments' 7 m cross walls.
  await h.go('?level=sanctum&seed=3&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  const s = await jumpFlapAt(h, 31, 32.8, 0);
  h.check('a jump and flap cannot top the Hall of Moments wall', s.z < 34, JSON.stringify(s));
}
