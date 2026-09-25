/**
 * Triangles drawn at a spot, by object: the biggest in-frustum level objects.
 *   FS_LEVEL=sanctum FS_AT='46,2,0' node scripts/play.mjs fs-tris
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
  }, { x, z, yaw });
  await h.wait(2500);
  const out = await h.eval(() => {
    const g = window.wyrm;
    const cam = g.camera;
    const THREE_Frustum = g.camera.constructor;
    void THREE_Frustum;
    cam.updateMatrixWorld();
    const m = cam.projectionMatrix.clone().multiply(cam.matrixWorldInverse);
    // A frustum test without importing three: planes from the matrix.
    const e = m.elements;
    const planes = [
      [e[3] - e[0], e[7] - e[4], e[11] - e[8], e[15] - e[12]], [e[3] + e[0], e[7] + e[4], e[11] + e[8], e[15] + e[12]],
      [e[3] + e[1], e[7] + e[5], e[11] + e[9], e[15] + e[13]], [e[3] - e[1], e[7] - e[5], e[11] - e[9], e[15] - e[13]],
      [e[3] - e[2], e[7] - e[6], e[11] - e[10], e[15] - e[14]], [e[3] + e[2], e[7] + e[6], e[11] + e[10], e[15] + e[14]],
    ].map(([a, b, c, d]) => { const n = Math.hypot(a, b, c); return [a / n, b / n, c / n, d / n]; });
    const inView = (o) => {
      const geo = o.geometry;
      if (!geo.boundingSphere) geo.computeBoundingSphere();
      if (o.isInstancedMesh && !o.boundingSphere) o.computeBoundingSphere();
      const s = (o.isInstancedMesh ? o.boundingSphere : geo.boundingSphere).clone().applyMatrix4(o.matrixWorld);
      return planes.every(([a, b, c, d]) => a * s.center.x + b * s.center.y + c * s.center.z + d > -s.radius);
    };
    const rows = [];
    g.level.root.traverseVisible((o) => {
      if (!o.isMesh) return;
      if (!inView(o)) return;
      const geo = o.geometry;
      const tris = (geo.index ? geo.index.count : geo.getAttribute('position').count) / 3 * (o.isInstancedMesh ? o.count : 1);
      rows.push([Math.round(tris), `${o.isInstancedMesh ? 'I' : ''}${geo.type.replace('Geometry', '')}#${o.material.color?.getHexString?.()}${o.isInstancedMesh ? 'x' + o.count : ''}@${o.position.x.toFixed(0)},${o.position.z.toFixed(0)}`]);
    });
    rows.sort((a, b) => b[0] - a[0]);
    return { total: rows.reduce((s, r) => s + r[0], 0), top: rows.slice(0, 25) };
  });
  console.log('level tris in view', out.total);
  for (const [t, n] of out.top) console.log(t, n);
}
