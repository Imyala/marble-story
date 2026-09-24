// Screenshots of the secrets and the skyline, with free camera angles.
export default async function (h) {
  await h.go('?level=keep&seed=1&quality=low&maxdt=0.25', 3000);
  await h.skipDialogue();
  await h.wait(600);
  await h.eval(() => { const g = window.wyrm; if (g.state === 'pause') g.resume(); for (const e of g.enemies) e.die(null); g.player.invuln = true; });
  const views = [
    // name, x, z, player yaw, cam yaw, pitch
    ['kw-nest', -6, 8.5, 2.4, Math.atan2(-9, 8.5), 0.75],
    ['kw-balcony', -9, -58, -Math.PI / 2, -Math.PI / 2, 0.35],
    ['kw-lift', 1, -210, 0.9, 0.9, 0.25],
    ['kw-eclipse', 0, -237, Math.PI, Math.PI, -0.25],
    ['kw-keep-from-stair', 0, -181, Math.PI, Math.PI, -0.2],
    ['kw-shrine', -6, -99.25, -Math.PI / 2, -Math.PI / 2, 0.3],
  ];
  for (const [name, x, z, yaw, camYaw, pitch] of views) {
    await h.eval(([x, z, yaw, camYaw, pitch]) => {
      const g = window.wyrm;
      const y = g.col.groundAt(x, z, 1e4, 0.2).y;
      g.player.place(x, y + 0.1, z, yaw);
      g.cam.snapBehind(camYaw, pitch);
    }, [x, z, yaw, camYaw, pitch]);
    await h.wait(1800);
    await h.shot(name);
  }
}
