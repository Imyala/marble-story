// Close-up portraits of Graveljaw: exposed head, the arch, the spit pose.
export default async function (h) {
  await h.go('?level=plains&seed=7&quality=low&maxdt=0.25', 3000);
  await h.skipDialogue();
  await h.eval(() => {
    const g = window.wyrm;
    for (const e of g.enemies) { e.alive = false; e.dispose(); }
    g.enemies = [];
    g.level.emit('canyon-door');
    g.player.place(0, 0, 244, 0);
    g.player.invuln = true;
  });
  await h.wait(1500);
  await h.skipDialogue(8000);
  const waitMode = async (modes, maxMs) => {
    const t0 = Date.now();
    while (Date.now() - t0 < maxMs) {
      if (modes.includes(await h.eval(() => window.wyrm.boss?.mode))) return true;
      await h.wait(100);
    }
    return false;
  };
  const portrait = async (name, dist, height, side) => {
    await h.eval(([dist, height, side]) => {
      const g = window.wyrm;
      const b = g.boss;
      const V = g.camera.position.constructor;
      const fx = Math.sin(b.yaw + side);
      const fz = Math.cos(b.yaw + side);
      g.cam.setShot(new V(b.hx + fx * dist, b.hy + height, b.hz + fz * dist), new V(b.hx, b.hy + 0.5, b.hz));
    }, [dist, height, side]);
    await h.wait(1400);
    await h.shot(name);
    await h.eval(() => window.wyrm.cam.clearShot());
  };
  if (await waitMode(['exposed'], 60000)) await portrait('worm-head', 7, 1.5, 0.5);
  if (await waitMode(['exposed'], 60000)) await portrait('worm-arch', 16, 5, 1.6);
  if (await waitMode(['spit'], 90000)) await portrait('worm-spit', 10, 0, 0.3);
}
