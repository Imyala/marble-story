/**
 * Fen and Sanctum survey: loads a realm, frames a list of views, reports the
 * draw calls of each (low quality) and screenshots them.
 *   node scripts/play.mjs fs-survey:fen      (or :sanctum)
 * FS_VIEWS=name1,name2 limits the run to some views.
 */
const V = {
  fen: [
    // name, player [x, z], camera [x, y, z], look [x, y, z]
    ['hollow', [0, 0], [24, 20, -26], [0, 1, 2]],
    ['hollow-near', [0, 4], [0, 4.5, -6], [0, 1.5, 6]],
    ['causeway', [0, 30], [16, 18, 18], [0, 1, 42]],
    ['willow', [0, 72], [22, 18, 56], [0, 3, 78]],
    ['ruins', [0, 118], [24, 22, 100], [0, 1, 124]],
    ['bog', [36, 140], [60, 22, 120], [38, 0, 142]],
    ['camp', [6, 172], [30, 22, 150], [6, 1, 174]],
    ['bogmaw', [0, 200], [26, 24, 190], [0, 1, 216]],
    ['lamphouse', [-38, 10.5], [-28, 13, -6], [-49, 3, 12]],
    ['lamphouse-near', [-38, 10.5], [-39, 4.5, 1], [-50, 3, 11]],
    ['perch', [0, 93.5], [3, 12.5, 90], [-18, 6, 104]],
    ['mill', [14, 118], [16, 13, 90], [33, 2, 103]],
    ['mill-near', [14, 118], [25.5, 3.5, 97.5], [37, 3, 102.5]],
    ['mill-east', [14, 118], [50, 11, 92], [37, 3, 102]],
    ['nest', [20, 180], [21, 8, 176], [35, 1.5, 187]],
    ['jetty', [0, 56], [-5, 5, 51], [7, 1, 59]],
    ['top-south', [0, 40], [0, 150, 30], [0, 0, 60]],
    ['top-north', [0, 170], [0, 160, 150], [0, 0, 175]],
  ],
  sanctum: [
    ['court', [0, -4], [0, 22, -34], [0, 0, 6]],
    ['court-near', [0, 8], [2, 4, -2], [0, 2, 12]],
    ['wardgate', [0, 30], [18, 16, 20], [0, 4, 42]],
    ['training', [46, 4], [70, 16, -16], [46, 0, 4]],
    ['hatchery', [-46, -6], [-66, 16, -26], [-46, 1, -6]],
    ['south', [0, -30], [30, 26, -64], [0, 0, -30]],
    ['hall', [36, 30], [56, 20, 22], [36, 1, 42]],
    ['library', [-24, 18], [-24, 14, 16], [-46, 3, 37]],
    ['library-in', [-37, 36], [-36, 7, 30], [-47, 2, 38]],
    ['tower', [-37, 36], [-40, 8, 52], [-50, 6, 44]],
    ['stargazers', [22, -40], [26, 12, -48], [48, 5, -31]],
    ['stars-top', [22, -40], [58, 16, -40], [49, 8, -31]],
    ['ledge', [-46, -6], [-50, 8, -24], [-61, -5, -17]],
    ['terrace', [0, 30], [-6, 9, 36], [6, 5, 50]],
    ['top', [0, 0], [0, 170, -5], [0, 0, 0]],
  ],
};

async function run(h, level) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 200; i++) {
      await h.wait(60);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  const extra = level === 'sanctum' ? '' : '';
  await h.go(`?level=${level}&seed=3&quality=low&maxdt=0.1${extra}`, 2500);
  await h.skipDialogue(8000);
  const only = (process.env.FS_VIEWS ?? '').split(',').filter(Boolean);
  // Quiet the realm: no arenas, no boss, no story pop-ups while we look around.
  await h.eval(() => {
    const g = window.wyrm;
    for (const a of g.level.arenas) a.state = 'cleared';
    for (const p of g.level.props) if (p.constructor.name === 'Trigger') p.fn = () => {};
  });
  const info = await h.eval(() => {
    const g = window.wyrm;
    const bs = g.level.hittables.filter((x) => x.constructor.name === 'Breakable');
    const kinds = {};
    for (const b of bs) kinds[b.kind] = (kinds[b.kind] ?? 0) + 1;
    const sec = {};
    for (const s of g.level.secrets) sec[s.kind] = (sec[s.kind] ?? 0) + 1;
    return { breakables: bs.length, kinds, secrets: sec, chests: g.level.props.filter((p) => p.constructor.name === 'Chest').length,
      enemies: g.enemies.filter((e) => e.alive).length, objects: g.level.root.children.length };
  });
  console.log('level', level, JSON.stringify(info));
  await waitGame(0.5);
  console.log(`view spawn (game camera): draw calls ${await h.eval(() => window.wyrm.renderer.gl.info.render.calls)}`);
  if (!only.length) await h.shot(`fs-${level}-spawn`);
  for (const [name, [px, pz], cam, look] of V[level]) {
    if (only.length && !only.includes(name)) continue;
    await h.eval(({ px, pz, cam, look }) => {
      const g = window.wyrm;
      for (const e of g.enemies) e.aggro = false;
      g.player.invuln = true;
      g.player.hp = g.player.maxHp;
      const y = g.col.groundAt(px, pz, 1e4, 0.1).y;
      g.player.place(px, y + 0.1, pz, 0);
      const T = g.camera.position.constructor;
      g.hud.show(false);
      const p = new T(...cam);
      const l = new T(...look);
      g.cam.setShot(p, l);
      g.cam.shotPos.copy(p);
      g.cam.shotLook.copy(l);
      g.cam.shotBlend = 1;
      const top = cam[1] > 60;
      g.scene.fog.near = top ? 1e4 : g.level.def.sky.fogNear;
      g.scene.fog.far = top ? 2e4 : g.level.def.sky.fogFar;
    }, { px, pz, cam, look });
    await h.skipDialogue(3000);
    await waitGame(0.5);
    const calls = await h.eval(() => window.wyrm.renderer.gl.info.render.calls);
    console.log(`view ${name}: draw calls ${calls}`);
    await h.shot(`fs-${level}-${name}`);
  }
  // A normal gameplay camera at the busiest spot, too.
  await h.eval(() => { const g = window.wyrm; g.cam.clearShot(); g.hud.show(true); });
}

export async function fen(h) {
  await run(h, 'fen');
}
export async function sanctum(h) {
  await run(h, 'sanctum');
}
export default async function (h) {
  await run(h, 'fen');
}
