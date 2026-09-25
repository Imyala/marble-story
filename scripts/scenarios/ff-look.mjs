// Screenshots and draw calls for views of Stormspire Falls and the Frostworks.
//   node scripts/play.mjs ff-look:falls      (VIEWS=name1,name2 to pick some)
import { boot, chase, vista } from './ff-lib.mjs';

const FALLS = {
  landing: ['chase', -4, -4, 0.2, 0.4],
  bank: ['chase', 2, 52, 0, 0.35],
  terrace: ['chase', 1, 86, 0.1, 0.35],
  crater: ['chase', -4, 134, 0, 0.35],
  outpost: ['chase', 17, 215, 0.6, 0.35],
  // New areas.
  ferry: ['vista', [7, 10, -15], [21, 3, -2], 15.5, -2.6],
  stacks: ['vista', [2, 15, 49], [-24, 9, 61], -9, 61.5],
  draft: ['vista', [-18, 22, 46], [-40, 24, 61], -29.5, 61.5],
  arrival: ['chase', -46.5, 61.5, -Math.PI / 2, 0.3],
  aerie: ['vista', [-44, 48, 28], [-64, 36, 53], -47, 61.5],
  hall: ['chase', -59, 45, -Math.PI / 2, 0.3],
  tower: ['vista', [-65, 45, 50], [-77, 40, 61], -70, 60],
  watch: ['vista', [-4, 25, 72], [-30, 16, 80.5], -9, 80.5],
  niche: ['chase', 1, 145.5, Math.PI / 2, 0.35],
  spray: ['vista', [30, 30, 116], [42, 20, 136], 33.5, 97],
  brood: ['chase', 8.5, 99.5, 0.8, 0.35],
  camp: ['chase', 1, 84, -Math.PI / 2, 0.35],
  vista: ['vista', [30, 60, -20], [0, 10, 90]],
};

const FROST = {
  landing: ['chase', 0, -3, 0, 0.35],
  hollow: ['chase', 0, 28, 0, 0.35],
  lake: ['chase', 0, 57, 0, 0.35],
  works: ['chase', 0, 86, 0, 0.35],
  hall: ['chase', 0, 117, 0, 0.4],
  upper: ['chase', 8, 200, 0, 0.35],
  // New areas.
  camp: ['vista', [-17, 11, 45], [-33, 3, 58], -16, 48],
  camp2: ['chase', -27.5, 57.5, -Math.PI / 2, 0.3],
  cellar: ['vista', [-17, 10, 91], [-31, 5, 98], -24, 98],
  cellarIn: ['vista', [-31.5, 6, 97], [-40, 4, 98], -33, 98],
  berg: ['vista', [-3, 7, 64], [8, 1.5, 72.5], 1.5, 74.8],
  roof: ['vista', [4, 21, 197], [-6.5, 15, 207], -8, 202],
  post: ['vista', [-4, 17, 197], [-16, 9, 186], -7.6, 204],
  overview: ['vista', [0, 50, -20], [0, 0, 80]],
  snowman: ['vista', [12, 5, -10], [4, 1.5, -2], 0, -3],
  sled: ['vista', [14, 7, 34], [6, 2.4, 44], 0, 40],
  steps: ['vista', [-2, 18, 222], [-7.5, 14, 215], -3, 218],
};

async function run(h, level, views) {
  await boot(h, level);
  const pick = process.env.VIEWS ? process.env.VIEWS.split(',') : Object.keys(views);
  const calls = {};
  for (const name of pick) {
    const v = views[name];
    if (!v) { console.log('no view', name); continue; }
    if (v[0] === 'chase') calls[name] = await chase(h, `ff-${level}-${name}`, v[1], v[2], v[3], v[4]);
    else calls[name] = await vista(h, `ff-${level}-${name}`, v[1], v[2], v[3], v[4]);
  }
  console.log('draw calls', JSON.stringify(calls));
}

export const falls = (h) => run(h, 'falls', FALLS);
export const frost = (h) => run(h, 'frostworks', FROST);
export default falls;

/** What the scene is made of: mesh counts by kind, to see where draw calls go. */
async function diag(h, level, x, z, yaw) {
  await boot(h, level);
  await chase(h, `ff-${level}-diag`, x, z, yaw, 0.35);
  const out = await h.eval(() => {
    const g = window.wyrm;
    const cam = g.camera;
    const THREE_Frustum = cam.projectionMatrix.constructor;
    const hist = {};
    let inst = 0; let instCount = 0; let meshes = 0; let other = 0;
    g.renderer.scene.traverseVisible((o) => {
      if (o.isInstancedMesh) { inst++; instCount += o.count; return; }
      if (o.isMesh) {
        meshes++;
        const key = `${o.geometry.type}|${o.material.type}${o.parent && o.parent !== g.level.root && o.parent.type !== 'Scene' ? '|child' : ''}`;
        hist[key] = (hist[key] ?? 0) + 1;
        return;
      }
      if (o.isPoints || o.isLine || o.isSprite) other++;
    });
    void THREE_Frustum;
    const top = Object.entries(hist).sort((a, b) => b[1] - a[1]).slice(0, 25);
    return { inst, instCount, meshes, other, top, gems: g.gems?.length ?? null, calls: g.renderer.gl.info.render.calls };
  });
  console.log(JSON.stringify(out, null, 1));
}
export const diagFalls = (h) => diag(h, 'falls', -4, -4, 0.2);
export const diagFrost = (h) => diag(h, 'frostworks', 0, -3, 0);

/** Which objects are drawn from a view (frustum-tested), grouped by what they are. */
async function drawn(h, level, view) {
  await boot(h, level);
  const v = (level === 'falls' ? FALLS : FROST)[view];
  if (v[0] === 'chase') {
    await chase(h, `ff-${level}-drawn`, v[1], v[2], v[3], v[4]);
  } else {
    await vista(h, `ff-${level}-drawn`, v[1], v[2], v[3], v[4]);
    await h.eval(([c, l]) => { const g = window.wyrm; const V = g.camera.position.constructor; g.cam.setShot(new V(...c), new V(...l)); }, [v[1], v[2]]);
    await h.eval(() => window.__step(2.5, 1 / 30));
    await h.eval(() => window.__draw());
  }
  const out = await h.eval(() => {
    const g = window.wyrm;
    const cam = g.camera;
    cam.updateMatrixWorld();
    const M = cam.projectionMatrix.clone().multiply(cam.matrixWorldInverse);
    const e = M.elements;
    const planes = [
      [e[3] + e[0], e[7] + e[4], e[11] + e[8], e[15] + e[12]], [e[3] - e[0], e[7] - e[4], e[11] - e[8], e[15] - e[12]],
      [e[3] + e[1], e[7] + e[5], e[11] + e[9], e[15] + e[13]], [e[3] - e[1], e[7] - e[5], e[11] - e[9], e[15] - e[13]],
      [e[3] + e[2], e[7] + e[6], e[11] + e[10], e[15] + e[14]], [e[3] - e[2], e[7] - e[6], e[11] - e[10], e[15] - e[14]],
    ].map(([a, b, c, d]) => { const n = Math.hypot(a, b, c); return [a / n, b / n, c / n, d / n]; });
    const hist = {};
    let n = 0;
    let beyond = 0;
    const beyondKinds = {};
    g.renderer.scene.traverseVisible((o) => {
      if (!o.isMesh && !o.isPoints) return;
      const geo = o.geometry;
      if (!geo.boundingSphere) geo.computeBoundingSphere();
      const s = geo.boundingSphere.clone().applyMatrix4(o.matrixWorld);
      if (o.frustumCulled !== false && planes.some(([a, b, c, d]) => a * s.center.x + b * s.center.y + c * s.center.z + d < -s.radius)) return;
      n++;
      const far = g.renderer.scene.fog ? g.renderer.scene.fog.far : 1e9;
      if (s.center.distanceTo(cam.position) - s.radius > far) { beyond++; beyondKinds[o.type + ' ' + (o.material?.color?.getHexString() ?? '')] = (beyondKinds[o.type + ' ' + (o.material?.color?.getHexString() ?? '')] ?? 0) + 1; }
      let p = o.parent; let owner = '';
      while (p && p !== g.level.root && p.type !== 'Scene') { owner = p.type + (p.name ? ':' + p.name : ''); p = p.parent; }
      const col = o.material?.color ? o.material.color.getHexString() : '';
      const key = `${o.isInstancedMesh ? 'I' : 'M'} ${geo.type} ${o.material?.type} #${col}${owner ? ' in ' + owner : ''}`;
      hist[key] = (hist[key] ?? 0) + 1;
    });
    return { n, beyond, beyondKinds: Object.entries(beyondKinds).sort((a, b) => b[1] - a[1]).slice(0, 12), calls: g.renderer.gl.info.render.calls, top: Object.entries(hist).sort((a, b) => b[1] - a[1]).slice(0, 45) };
  });
  console.log('drawn', out.n, 'calls', out.calls, 'beyond fog', out.beyond, JSON.stringify(out.beyondKinds));
  for (const [k, c] of out.top) console.log(String(c).padStart(4), k);
}
export const drawnFalls = (h) => drawn(h, 'falls', process.env.VIEW ?? 'vista');
export const drawnFrost = (h) => drawn(h, 'frostworks', process.env.VIEW ?? 'landing');
