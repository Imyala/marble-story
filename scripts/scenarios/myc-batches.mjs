/**
 * Lists the Mycelium Deep's instanced decor batches (each is a draw call wherever it is seen), biggest first.
 *   node scripts/play.mjs myc-batches
 */
import { boot } from './myc-lib.mjs';

export default async function (h) {
  await boot(h);
  const list = await h.eval(() => {
    const g = window.wyrm;
    const out = [];
    for (const o of g.level.root.children) {
      if (!o.isInstancedMesh) continue;
      const m = o.material;
      out.push({ n: o.count, geo: o.geometry.type + (o.geometry.parameters ? JSON.stringify(Object.values(o.geometry.parameters).slice(0, 3)) : ''), color: '#' + m.color.getHexString(),
        em: m.emissive ? '#' + m.emissive.getHexString() : '-', type: m.type, cast: o.castShadow });
    }
    return out.sort((a, b) => a.color.localeCompare(b.color));
  });
  for (const l of list) console.log(JSON.stringify(l));
  console.log('batches', list.length);
  const loose = await h.eval(() => {
    const g = window.wyrm;
    const byParent = {};
    for (const o of g.level.root.children) {
      if (o.isInstancedMesh || o.userData.static || o.userData.cull) continue;
      let n = 0;
      o.traverse((c) => { if (c.isMesh || c.isPoints) n++; });
      const k = o.type + ':' + (o.children.length ? o.children.map((c) => c.type[0]).join('').slice(0, 12) : (o.geometry?.type ?? ''));
      byParent[k] = (byParent[k] ?? 0) + n;
    }
    return Object.entries(byParent).sort((a, b) => b[1] - a[1]).slice(0, 30);
  });
  console.log(JSON.stringify(loose));
}
