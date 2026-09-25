/**
 * Frame rate and draw calls at a spot, with the normal game camera.
 *   FS_LEVEL=sanctum FS_AT='46,2,0' node scripts/play.mjs fs-fps
 */
export default async function (h) {
  const level = process.env.FS_LEVEL ?? 'sanctum';
  const [x, z, yaw] = (process.env.FS_AT ?? '46,2,0').split(',').map(Number);
  await h.go(`?level=${level}&seed=4&quality=low&maxdt=0.25`, 2500);
  await h.skipDialogue(8000);
  await h.wait(500);
  await h.eval(({ x, z, yaw }) => {
    const g = window.wyrm;
    if (g.state === 'pause') g.resume();
    g.player.place(x, g.col.groundAt(x, z, 1e4, 0.1).y + 0.05, z, yaw);
    g.cam.snapBehind(yaw);
    window.__frames = 0;
    const loop = () => { window.__frames++; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }, { x, z, yaw });
  await h.wait(1500);
  const a = await h.eval(() => ({ f: window.__frames, t: window.wyrm.time, w: performance.now() }));
  await h.wait(6000);
  const b = await h.eval(() => ({ f: window.__frames, t: window.wyrm.time, w: performance.now(), calls: window.wyrm.renderer.gl.info.render.calls, tris: window.wyrm.renderer.gl.info.render.triangles }));
  const sec = (b.w - a.w) / 1000;
  console.log(`fps ${((b.f - a.f) / sec).toFixed(2)}  game-sec per sec ${((b.t - a.t) / sec).toFixed(2)}  calls ${b.calls}  tris ${b.tris}`);
}
