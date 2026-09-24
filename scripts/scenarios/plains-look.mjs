// Stonewild Plains: loads the realm, probes key heights and screenshots each
// area from a gameplay camera and from a scripted wide shot.
export default async function (h) {
  await h.go('?level=plains&seed=1&quality=low&maxdt=0.25', 3000);
  await h.shot('pl-intro');
  await h.skipDialogue();
  await h.wait(500);
  const s = await h.state();
  h.check('loaded in play', s.state === 'play' && s.level === 'plains', JSON.stringify(s));
  const counts = await h.eval(() => {
    const g = window.wyrm;
    const l = g.level;
    return {
      collectibles: l.props.filter((p) => p.relicId !== undefined).map((p) => p.id),
      wardstones: [...l.wardstones.keys()],
      arenas: l.arenas.map((a) => `${a.id}:${a.waves.flat().length}`),
      roaming: g.enemies.length,
      gems: g.gems.length,
      crystals: l.hittables.filter((x) => x.constructor.name === 'GemCluster').length,
    };
  });
  console.log(JSON.stringify(counts));
  // Roaming enemies stand on real ground, inside nothing, and stay alive.
  await h.wait(3000);
  const bad = await h.eval(() => {
    const g = window.wyrm;
    const out = [];
    for (const e of g.enemies) {
      const gy = g.col.groundAt(e.x, e.z, e.y + 1, 0.2).y;
      const stuck = g.col.blocked(e.x, e.y + 0.2, e.z, e.radius * 0.8, e.height * 0.8);
      if (!e.alive || (!e.def.flying && Math.abs(e.y - gy) > 0.6) || stuck) out.push(`${e.def.id}@${e.x.toFixed(1)},${e.z.toFixed(1)} y${e.y.toFixed(1)} g${gy.toFixed(1)} alive${e.alive} stuck${stuck}`);
    }
    return out;
  });
  h.check('roaming enemies stand on open ground', bad.length === 0, bad.join('; '));
  await h.eval(() => { const g = window.wyrm; g.player.invuln = true; for (const e of g.enemies) e.aggro = false; });
  const views = [
    // name, player x, z, yaw, camera [x, y, z], look [x, y, z]
    ['pl-v-vale', [0, -18, 0], [14, 9, -30], [0, 2, 0]],
    ['pl-v-spring', [0, 18, 0], [10, 6, 12], [0, 3, 25]],
    ['pl-v-meadow', [0, 34, 0], [-20, 16, 26], [0, 7, 62]],
    ['pl-v-spiral', [-30, 52, 0], [-24, 13, 44], [-36, 10, 56]],
    ['pl-v-gatehouse', [0, 80, 0], [14, 13, 76], [0, 9, 92]],
    ['pl-v-colonnade', [0, 104, 0], [-14, 20, 96], [0, 12, 110]],
    ['pl-v-gorge', [0, 119, 0], [18, 16, 118], [0, 12, 130]],
    ['pl-v-heights', [4, 142, 0], [-20, 28, 132], [0, 20, 165]],
    ['pl-v-circle', [0, 170, 0], [9, 27, 164], [0, 20, 182]],
    ['pl-v-fields', [-5, 212, 0], [24, 22, 206], [0, 5, 226]],
    ['pl-v-canyon', [0, 228, 0], [16, 20, 236], [0, 2, 258]],
    ['pl-v-cage', [0, 228, 0], [8, 12, 266], [0, 11, 277]],
  ];
  for (const [name, [x, z, yaw], cam, look] of views) {
    await h.eval(([x, z, yaw, cam, look]) => {
      const g = window.wyrm;
      const y = g.col.groundAt(x, z, 1e4, 0.2).y;
      g.player.place(x, y + 0.1, z, yaw);
      g.cam.snapBehind(yaw, 0.32);
      const V = g.camera.position.constructor;
      g.cam.setShot(new V(cam[0], cam[1], cam[2]), new V(look[0], look[1], look[2]));
    }, [x, z, yaw, cam, look]);
    await h.wait(2600);
    await h.skipDialogue();
    await h.shot(name);
  }
  await h.eval(() => window.wyrm.cam.clearShot());
}
