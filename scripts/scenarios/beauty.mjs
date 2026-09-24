export default async function (h) {
  const shots = [
    ['fen', 0, 60, Math.PI, 'beauty-fen-start'],
    ['fen', 0, 88, 0, 'beauty-fen-willow'],
    ['fen', 2, 196, 0, 'beauty-fen-boss'],
    ['sanctum', 0, -12, 0, 'beauty-sanctum'],
  ];
  for (const [lvl, x, z, yaw, name] of shots) {
    await h.go(`?level=${lvl}&seed=1&quality=high&maxdt=0.25`, 2500);
    await h.skipDialogue();
    await h.eval(([x, z, yaw]) => { const g = window.wyrm; const y = g.col.groundAt(x, z, 1e4, 0.2).y; g.player.place(x, y + 0.1, z, yaw); g.cam.snapBehind(yaw, 0.28); g.hud.show(false); }, [x, z, yaw]);
    await h.wait(3500);
    await h.shot(name);
  }
}
