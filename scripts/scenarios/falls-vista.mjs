// Wide camera shots of Stormspire Falls for an art review.
import { boot, place, step, shot, clearArenas } from './falls-lib.mjs';

export default async function (h) {
  const q = process.env.Q ?? 'low';
  await boot(h);
  if (q !== 'low') await h.eval((q) => { const g = window.wyrm; g.options.quality = q; g.applyOptions(); }, q);
  await clearArenas(h);
  await h.eval(() => { window.wyrm.player.invuln = true; });
  const vistas = process.env.VISTAS ? JSON.parse(process.env.VISTAS) : [
    ['landing', [-4, -6], [-6, 11, -14], [2, 18, 90]],
    ['canyon', [1, 86], [14, 44, 62], [-4, 26, 150]],
    ['crater', [-3, 124], [-12, 33, 124], [-4, 22, 148]],
    ['cascade', [-2, 164], [-12, 30, 158], [4, 22, 200]],
    ['spire', [18, 212], [34, 33, 196], [0, 42, 246]],
    ['storm', [8, 232], [8, 44, 222], [-6, 62, 274]],
  ];
  for (const [name, [px, pz], pos, look] of vistas) {
    await place(h, px, pz, 0);
    await h.eval(([p, l]) => {
      const g = window.wyrm;
      const V = g.camera.position.constructor;
      g.cam.setShot(new V(p[0], p[1], p[2]), new V(l[0], l[1], l[2]));
    }, [pos, look]);
    await step(h, 3.0);
    // Call down a bolt so the shot catches the storm.
    await h.eval(() => { const sky = window.wyrm.level.props.find((p) => p.constructor.name === 'StormSky'); if (sky) sky.t = 0; });
    await step(h, 1 / 30);
    await shot(h, `vista-${name}`);
    await step(h, 1.3);
    await shot(h, `vista-${name}-b`);
    await h.eval(() => window.wyrm.cam.clearShot());
  }
}
