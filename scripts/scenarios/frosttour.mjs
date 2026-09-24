// Visual tour of the Frostworks: teleports to each area and screenshots it.
// Usage: node scripts/play.mjs frosttour   (optionally TOUR=name1,name2)
const SPOTS = [
  ['landing', 0, -3, 0],
  ['pass', -3, 8, 0.3],
  ['hollow', 0, 27, 0],
  ['lake', 0, 55, 0],
  ['shore', 0, 84, 0],
  ['works', -2, 90, 0],
  ['hall', 0, 116, 0],
  ['hall2', -8, 128, 0.4],
  ['hallN', 0, 140, 0],
  ['gears', 0, 154, 0],
  ['gears2', -6, 177.5, 0.6],
  ['docka', -7, 185.5, 1.2],
  ['dockb', 19, 186, 0],
  ['upper', 19, 202, -0.8],
  ['upper2', 8, 204, 0],
  ['bridge', 0, 220, 0],
  ['cage', 0, 266, 0],
  ['crucible', 0, 234, 0],
];

export default async function (h) {
  await h.go('?level=frostworks&seed=1&quality=low&maxdt=0.25', 3000);
  await h.skipDialogue();
  await h.eval(() => { const g = window.wyrm; for (const e of ['fire', 'lightning']) if (!g.save.elements.includes(e)) g.learnElement(e); g.player.invuln = true; });
  const only = process.env.TOUR ? process.env.TOUR.split(',') : null;
  for (const [name, x, z, yaw] of SPOTS) {
    if (only && !only.includes(name)) continue;
    await h.eval(([x, z, yaw]) => {
      const g = window.wyrm;
      const y = g.col.groundAt(x, z, 1e4, 0.2).y;
      g.player.place(x, y + 0.1, z, yaw);
      g.cam.snapBehind(yaw, 0.32);
    }, [x, z, yaw]);
    await h.wait(1600);
    await h.skipDialogue();
    const s = await h.state();
    console.log(name, JSON.stringify(s));
    await h.shot(`ft-${name}`);
  }
}
