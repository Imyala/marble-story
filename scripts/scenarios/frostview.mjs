// Overview camera shots of the Frostworks (free camera, HUD hidden).
// Usage: node scripts/play.mjs frostview   (optionally VIEW=name1,name2)
const VIEWS = [
  ['v-landing', [18, 22, -14], [0, 2, 14]],
  ['v-lake', [30, 26, 50], [0, 1, 75]],
  ['v-works', [26, 24, 80], [0, 3, 105]],
  ['v-hall', [0, 30, 108], [0, 2, 134]],
  ['v-hall-side', [-14, 16, 142], [8, 3, 128]],
  ['v-gears', [-26, 26, 150], [2, 3, 178]],
  ['v-lever', [6, 22, 168], [6, 3, 188]],
  ['v-upper', [-10, 34, 190], [8, 12, 212]],
  ['v-crucible', [26, 34, 226], [0, 12, 255]],
];

export default async function (h) {
  await h.go('?level=frostworks&seed=1&quality=low&maxdt=0.25', 3000);
  await h.skipDialogue();
  await h.eval(() => { const g = window.wyrm; g.player.invuln = true; g.hud.show(false); for (const e of g.enemies) e.aggro = false; });
  const only = process.env.VIEW ? process.env.VIEW.split(',') : null;
  for (const [name, pos, look] of VIEWS) {
    if (only && !only.includes(name)) continue;
    await h.eval(([pos, look]) => {
      const g = window.wyrm;
      // Park the dragon somewhere harmless so no fights start.
      g.player.place(0, 1.8, -3, 0);
      const P = g.camera.position.clone().set(pos[0], pos[1], pos[2]);
      const L = g.camera.position.clone().set(look[0], look[1], look[2]);
      g.cam.clearShot();
      g.cam.setShot(P, L);
      g.cam.setShot(P, L);
    }, [pos, look]);
    await h.wait(2200);
    await h.eval(() => { const g = window.wyrm; if (g.state === 'dialogue') g.dialogue.advance(); });
    await h.shot(name);
  }
}
