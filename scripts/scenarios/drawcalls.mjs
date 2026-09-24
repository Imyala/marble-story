export default async function (h) {
  await h.go('?level=fen&seed=1&quality=medium&maxdt=0.25', 3000);
  await h.skipDialogue();
  await h.eval(() => {
    const g = window.wyrm; const p = g.player;
    p.place(0, 1.2, 0, 0);
    for (const [t, dx, dz] of [['grunt', -2, 3], ['shieldbearer', 0.5, 4], ['slinger', 2.5, 3.5], ['brute', 0, 8]]) {
      const e = g.spawnEnemy(t, dx, 1.2, dz, Math.PI, false);
      e.state = 'idle';
    }
    const THREE = g.camera.position.constructor;
    g.hud.show(false);
    g.cam.setShot(new THREE(3.5, 3.2, -3.5), new THREE(0, 1.2, 3));
  });
  await h.wait(3000);
  await h.shot('merged-close');
}
