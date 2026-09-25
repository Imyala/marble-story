/** Which kinds of object make up the draw calls in a realm's long view. LVL=<id> */
export default async function (h) {
  const lvl = process.env.LVL ?? 'plains';
  await h.go(`?level=${lvl}&seed=1&quality=low&maxdt=0.1`, 2500);
  await h.skipDialogue(8000);
  await h.eval(() => { const g = window.wyrm; if (g.state === 'pause') g.resume(); g.cam.snapBehind(g.level.def.spawn[2], 0.25); });
  await h.wait(1200);
  const res = await h.eval(() => {
    const g = window.wyrm;
    const out = {};
    const cam = g.camera;
    cam.updateMatrixWorld();
    const pv = cam.projectionMatrix.clone().multiply(cam.matrixWorldInverse);
    const vis = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    const inView = (o) => {
      const geo = o.geometry; if (!geo) return false;
      let sp;
      if (o.isInstancedMesh) { if (!o.boundingSphere) o.computeBoundingSphere(); sp = o.boundingSphere; } else { if (!geo.boundingSphere) geo.computeBoundingSphere(); sp = geo.boundingSphere; }
      const s = sp.clone().applyMatrix4(o.matrixWorld);
      const c = s.center.clone().applyMatrix4(pv);
      const d = Math.max(0.1, s.center.distanceTo(cam.position));
      const pad = 1 + (s.radius / d) * 2;
      return c.z < 1 + pad && Math.abs(c.x) < pad && Math.abs(c.y) < pad;
    };
    const owner = new Map();
    for (const e of g.enemies) e.model.root.traverse((o) => owner.set(o, 'enemy:' + e.def.id));
    for (const p of g.level.props) { const r = p.root ?? p.model?.root; if (r && r.traverse) r.traverse((o) => { if (!owner.has(o)) owner.set(o, 'prop:' + p.constructor.name); }); }
    g.player.rig.root.traverse((o) => owner.set(o, 'player'));
    g.scene.traverse((o) => {
      if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite) || !vis(o)) return;
      if (o.frustumCulled !== false && !inView(o)) return;
      if (o.isInstancedMesh && o.count === 0) return;
      let k = owner.get(o);
      if (!k) {
        let p = o; while (p.parent && p.parent !== g.level.root && p.parent !== g.scene) p = p.parent;
        k = p.parent === g.level.root ? (o.isInstancedMesh ? 'level:instanced' : o.userData.cull ? 'level:static' : 'level:' + (p.type)) : 'scene:' + (p.constructor.name);
      }
      out[k] = (out[k] ?? 0) + 1;
    });
    const total = Object.values(out).reduce((a, b) => a + b, 0);
    return { total, top: Object.entries(out).sort((a, b) => b[1] - a[1]).slice(0, 22) };
  });
  console.log(JSON.stringify(res));
}
