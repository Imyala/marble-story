/**
 * The Hollow Gate: loads cleanly, holds what it should, and screenshots every area.
 *   node scripts/play.mjs hollow-look            (load checks, then every view)
 *   node scripts/play.mjs hollow-look:start      (load checks only)
 *   node scripts/play.mjs hollow-look:views      (views only)
 */
import { boot, place, step, shot, useSave } from './hollow-lib.mjs';

/** Stands Aster at (x, z) facing yaw, with the camera behind at `pitch`, and takes a clean shot. */
async function view(h, name, x, z, yaw, pitch = 0.3, y) {
  await place(h, x, z, yaw, y, pitch);
  await step(h, 0.8);
  const calls = await h.eval(() => { window.__draw(); return window.wyrm.renderer.gl.info.render.calls; });
  await shot(h, `hollow-${name}`, false);
  return calls;
}

/** A free camera at `from` looking at `to` (the dragon parked out of the way), for vistas. */
async function vista(h, name, from, to) {
  await h.eval(([f, t]) => {
    const g = window.wyrm;
    // Park the dragon under the camera so culling and fog follow the view.
    g.player.place(f[0], g.col.groundAt(f[0], f[2], 1e4, 0.2).y + 0.05, f[2], 0);
    g.player.hidden = true;
    const orig = g.cam.update.bind(g.cam);
    g.cam.update = () => {
      g.camera.position.set(f[0], f[1], f[2]);
      g.camera.lookAt(t[0], t[1], t[2]);
    };
    window.__restoreCam = () => { g.cam.update = orig; g.player.hidden = false; };
  }, [from, to]);
  await step(h, 0.5);
  await shot(h, `hollow-vista-${name}`, false);
  await h.eval(() => window.__restoreCam());
}

export async function start(h) {
  await useSave(h, null);
  await h.go('?level=hollow&seed=4&quality=low&maxdt=0.1', 3000);
  const s = await h.state();
  h.check('the Hollow Gate loads', s.level === 'hollow', JSON.stringify(s));
  await h.skipDialogue(8000);
  await h.wait(300);
  const info = await h.eval(() => {
    const g = window.wyrm;
    const sec = {};
    for (const q of g.level.secrets) sec[q.kind] = (sec[q.kind] ?? 0) + 1;
    const chests = g.level.props.filter((p) => p.constructor.name === 'Chest');
    return { state: g.state, sec, chests: chests.length, iron: chests.filter((c) => c.iron).length, npcs: g.level.npcs.length,
      breakables: g.level.hittables.filter((x) => x.constructor.name === 'Breakable').length, wards: [...g.level.wardstones.keys()],
      critters: g.level.props.filter((p) => p.constructor.name === 'Critter').length, arenas: g.level.arenas.length };
  });
  console.log(JSON.stringify(info));
  h.check('in play after the arrival', info.state === 'play', info.state);
  h.check('three eggs, four letters, two relics', info.sec.egg === 3 && info.sec.letter === 4 && info.sec.relic === 2, JSON.stringify(info.sec));
  h.check('three chests, one iron-bound', info.chests === 3 && info.iron === 1, `${info.chests}/${info.iron}`);
  h.check('Nyxa left after the intro', info.npcs === 0, `${info.npcs}`);
  h.check('two Wardstones, critters and plenty to smash', info.wards.length === 2 && info.critters >= 2 && info.breakables >= 25, JSON.stringify(info));
}

export async function views(h) {
  await boot(h);
  const calls = {};
  calls.landing = await view(h, 'landing', 0, 90, Math.PI, 0.25);
  calls.rootway = await view(h, 'rootway', -9, 77, Math.PI * 0.85, 0.3);
  calls.shore = await view(h, 'lake-north', 4, 46, Math.PI, 0.35);
  calls.islet = await view(h, 'islet', 2, 1, Math.PI * 1.1, 0.3);
  calls.camp = await view(h, 'camp', 2, -44, Math.PI, 0.32);
  calls.aerie = await view(h, 'aerie', -46, 9, -Math.PI / 2, 0.3);
  calls.hall = await view(h, 'hall', -79, 23, 0, 0.32);
  calls.glowcap = await view(h, 'glowcap', 46, 23, Math.PI / 2, 0.3);
  calls.grove = await view(h, 'grove', 62, 22, Math.PI * 0.3, 0.2);
  calls.canal = await view(h, 'canal', 30, -30, Math.PI * 0.72, 0.3, -0.8);
  calls.mycelium = await view(h, 'gate-mycelium', 92, 15, Math.PI / 2, 0.15);
  calls.mine = await view(h, 'gate-mine', -93, 12, -Math.PI / 2, 0.15);
  calls.hatchery = await view(h, 'gate-hatchery', -34, -67, Math.atan2(-1, -0.3), 0.15);
  calls.drowned = await view(h, 'gate-drowned', 38, -40, Math.atan2(10, -7), 0.15, -0.8);
  console.log('draw calls', JSON.stringify(calls));
  await vista(h, 'from-north', [2, 16, 52], [0, 2, 0]);
  await vista(h, 'high', [30, 34, 40], [-10, 0, -10]);
  await vista(h, 'lake-west', [-40, 6, 0], [10, 3, -6]);
  await vista(h, 'lake-camp', [6, 5, -50], [0, 4, 10]);
  await vista(h, 'glowcap', [44, 7, 14], [80, 5, 20]);
  await vista(h, 'aerie', [-50, 8, 2], [-90, 5, 22]);
}

export default async function (h) {
  await start(h);
  await views(h);
}
