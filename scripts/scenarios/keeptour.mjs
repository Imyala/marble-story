// Visual tour of Eclipse Keep: teleports to each area and screenshots it.
export default async function (h) {
  await h.go('?level=keep&seed=1&quality=low&maxdt=0.25', 3000);
  await h.shot('k-intro');
  await h.skipDialogue();
  await h.wait(800);
  const unpause = () => h.eval(() => { const g = window.wyrm; if (g.state === 'pause') g.resume(); });
  await unpause();
  const s = await h.state();
  h.check('loaded keep', s.level === 'keep' && s.state === 'play', JSON.stringify(s));
  const only = process.env.SPOT;
  const spots = [
    ['k-landing', 0, 2, Math.PI, 0.25],
    ['k-landing-back', 0, -2, 0, 0.3],
    ['k-bridge', 0, -10, Math.PI, 0.3],
    ['k-bastion', 0, -46, Math.PI, 0.35],
    ['k-court', 0, -90, Math.PI, 0.3],
    ['k-court-east', 2, -104, Math.PI / 2, 0.3],
    ['k-court-west', 0, -106, -Math.PI / 2, 0.3],
    ['k-door', 0, -118, Math.PI, 0.25],
    ['k-hall', 0, -138, Math.PI, 0.3],
    ['k-stair', 0, -178, Math.PI, 0.35],
    ['k-terrace', 0, -219, Math.PI, 0.3],
    ['k-throne', 0, -243, Math.PI, 0.3],
  ].filter((sp) => !only || only.split(',').includes(sp[0]));
  for (const [name, x, z, yaw, pitch] of spots) {
    await h.eval(([x, z, yaw, pitch]) => {
      const g = window.wyrm;
      for (const e of g.enemies) e.aggro = false;
      const y = g.col.groundAt(x, z, 1e4, 0.2).y;
      g.player.place(x, y + 0.1, z, yaw);
      g.player.invuln = true;
      g.cam.snapBehind(yaw, pitch);
    }, [x, z, yaw, pitch]);
    await h.wait(1600);
    await h.skipDialogue(500);
    await unpause();
    await h.wait(300);
    const st = await h.state();
    console.log(name, JSON.stringify(st));
    await h.shot(name);
  }
}
