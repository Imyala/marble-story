// Stormspire Falls: loads, intro plays, and a tour of screenshots.
export default async function (h) {
  await h.go('?level=falls&seed=1&quality=low&maxdt=0.25', 3000);
  let s = await h.state();
  h.check('intro dialogue', s.state === 'dialogue', JSON.stringify(s));
  await h.shot('falls-intro');
  await h.skipDialogue();
  await h.wait(600);
  s = await h.state();
  h.check('in play after intro', s.state === 'play' && s.level === 'falls', JSON.stringify(s));
  const info = await h.eval(() => {
    const g = window.wyrm;
    return {
      enemies: g.enemies.length, props: g.level.props.length, hittables: g.level.hittables.length, solids: g.level.col.solids.length,
      meshes: (() => { let n = 0; g.level.root.traverse((o) => { if (o.isMesh) n++; }); return n; })(),
      insts: (() => { let n = 0; g.level.root.traverse((o) => { if (o.isInstancedMesh) n += o.count; }); return n; })(),
      collectibles: g.level.props.filter((p) => p.constructor.name === 'Collectible').map((p) => `${p.id}@${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}`),
      wardstones: [...g.level.wardstones.keys()],
      arenas: g.level.arenas.map((a) => `${a.id}@${a.x},${a.y.toFixed(1)},${a.z}`),
      updrafts: g.level.updrafts.map((u) => `${u.x.toFixed(1)},${u.z.toFixed(1)} r${u.r} ${u.y0.toFixed(1)}-${u.y1.toFixed(1)}`),
    };
  });
  console.log(JSON.stringify(info, null, 1));
  const spots = process.env.SPOTS ? JSON.parse(process.env.SPOTS) : [
    ['landing', -4, -6, 0, 0.3],
  ];
  for (const [name, x, z, yaw, pitch] of spots) {
    await h.eval(([x, z, yaw, pitch]) => {
      const g = window.wyrm;
      const y = g.col.groundAt(x, z, 1e4, 0.2).y;
      g.player.place(x, y + 0.1, z, yaw);
      g.cam.snapBehind(yaw, pitch);
      g.player.invuln = true;
    }, [x, z, yaw, pitch]);
    await h.wait(1500);
    await h.shot(`falls-${name}`);
    console.log(name, JSON.stringify(await h.state()));
  }
}
