/**
 * The Mycelium Deep's draw calls at its busiest views, and what they are made of.
 *   node scripts/play.mjs myc-calls
 */
import { boot, place, step } from './myc-lib.mjs';

const VIEWS = [['spawn', 0, -3, 0, 0.22], ['chasm', 0, 52, 0, 0.05], ['sporefall', 2, 6, 0.15, 0.18], ['garden', 0, 109, 0, 0.2], ['east', 20, 112, Math.PI / 2, 0.2]];

export default async function (h) {
  await boot(h);
  let worst = 0;
  for (const [name, x, z, yaw, pitch] of VIEWS) {
    await place(h, x, z, yaw, undefined, pitch);
    await step(h, 0.6);
    const r = await h.eval(() => {
      const g = window.wyrm;
      const gl = g.renderer.gl;
      window.__draw();
      const calls = gl.info.render.calls;
      // What is on screen, by kind: instanced batches, merged statics, and loose meshes (named by their parent's class).
      const cam = g.camera;
      cam.updateMatrixWorld();
      const THREE = cam.constructor.prototype.constructor;
      void THREE;
      const frustum = new (Object.getPrototypeOf(g.scene).constructor === Object ? Object : Object)();
      void frustum;
      const kinds = {};
      let shadowCasters = 0;
      g.scene.traverseVisible((o) => {
        if (!o.isMesh && !o.isPoints && !o.isLine) return;
        const k = o.isInstancedMesh ? 'instanced' : o.userData.static || o.userData.cull ? 'static' : (o.parent && o.parent !== g.level.root ? 'group' : 'loose');
        kinds[k] = (kinds[k] ?? 0) + 1;
        if (o.castShadow) shadowCasters++;
      });
      return { calls, kinds, shadowCasters, shadows: gl.shadowMap.enabled };
    });
    worst = Math.max(worst, r.calls);
    console.log(name, JSON.stringify(r));
  }
  h.check('worst view under 300 draw calls', worst < 300, `${worst}`);
}
