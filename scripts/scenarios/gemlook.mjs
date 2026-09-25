/** A burst of every gem color, to check the instanced gems draw. */
export default async function (h) {
  await h.go('?level=sanctum&seed=5&quality=high&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  const n = await h.eval(() => {
    const g = window.wyrm;
    g.player.place(0, 0.3, -8, 0);
    g.player.magnetRadius = 0;
    g.spawnGems(0, 1.5, -3, { blue: 40, red: 3, green: 3, purple: 3 }, false);
    g.cam.snapBehind(0, 0.3);
    return g.gems.length;
  });
  await h.wait(2500);
  const r = await h.eval(() => { const g = window.wyrm; return { live: g.gems.filter((x) => x.alive).length, calls: g.renderer.gl.info.render.calls }; });
  await h.shot('gems-instanced');
  h.check('gems spawn and draw', n > 5 && r.live > 5, JSON.stringify({ n, ...r }));
}
