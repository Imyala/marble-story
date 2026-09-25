/** Horizon shots of every realm, to judge the distant backdrop. Pass ?yaw offsets via VISTA_YAW. */
export default async function (h) {
  const levels = (process.env.VISTAS ?? 'fen,sanctum,falls,frostworks,plains,keep').split(',');
  for (const lvl of levels) {
    await h.go(`?level=${lvl}&seed=1&quality=high&maxdt=0.25`, 2500);
    await h.skipDialogue(8000);
    for (const [i, off] of [0, Math.PI].entries()) {
      await h.eval((off) => { const g = window.wyrm; const yaw = g.level.def.spawn[2] + off; g.player.place(g.player.x, g.player.y, g.player.z, yaw); g.cam.snapBehind(yaw, 0.12); g.hud.show(false); }, off);
      await h.wait(2500);
      await h.shot(`vista-${lvl}-${i}`);
    }
  }
}
