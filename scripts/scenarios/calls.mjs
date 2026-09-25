/** Draw calls at each realm's spawn, looking four ways (low quality, like the realm surveys). CALLS_LVLS=a,b */
export default async function (h) {
  const lvls = (process.env.CALLS_LVLS ?? 'fen,sanctum,falls,frostworks,plains,keep').split(',');
  const out = {};
  for (const lvl of lvls) {
    await h.go(`?level=${lvl}&seed=1&quality=low&maxdt=0.1`, 2500);
    await h.skipDialogue(8000);
    const r = [];
    for (let k = 0; k < 4; k++) {
      await h.eval((k) => { const g = window.wyrm; if (g.state === 'pause') g.resume(); const yaw = g.level.def.spawn[2] + k * Math.PI / 2; g.player.place(g.player.x, g.player.y, g.player.z, yaw); g.cam.snapBehind(yaw, 0.25); }, k);
      await h.wait(900);
      r.push(await h.eval(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => res(window.wyrm.renderer.gl.info.render.calls))))));
    }
    out[lvl] = r;
    console.log(lvl, JSON.stringify(r));
  }
}
