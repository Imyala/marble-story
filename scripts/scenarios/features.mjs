/** Flick's secret-finder, freezing water with ice breath, and lightning through water. */
export default async function (h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 150; i++) {
      await h.wait(60);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);

  // 1) Flick finds the nearest secret.
  await h.eval(() => { const g = window.wyrm; g.player.place(10, g.col.groundAt(10, -4, 1e4, 0.1).y + 0.05, -4, 0); });
  await waitGame(0.3);
  await h.eval(() => window.wyrm.input.simulate('hint', true));
  await waitGame(0.1);
  await h.eval(() => window.wyrm.input.simulate('hint', false));
  await waitGame(0.8);
  const seek = await h.eval(() => {
    const g = window.wyrm;
    const f = g.flick;
    return { target: f.seekTarget && [f.seekTarget.x, f.seekTarget.z], line: document.querySelector('.flick p')?.textContent ?? '', fx: f.position.x, fz: f.position.z };
  });
  h.check('Flick darts toward a hidden secret', !!seek.target && /paces|Right here/.test(seek.line), JSON.stringify(seek));
  await h.shot('feature-flick');

  // 2) Ice breath freezes water into floes you can stand on.
  await h.eval(() => {
    const g = window.wyrm;
    g.save.elements = ['fire', 'lightning', 'ice'];
    g.player.element = 'ice';
    g.player.mana = 999;
    // The causeway shore, facing open water to the east.
    const y = g.col.groundAt(4.5, 24, 1e4, 0.1).y;
    g.player.place(4.5, y + 0.05, 24, Math.PI / 2);
    g.cam.snapBehind(Math.PI / 2);
  });
  await waitGame(0.3);
  const shore = await h.eval(() => ({ y: window.wyrm.player.y, water: window.wyrm.waterLevel, t: window.wyrm.col.terrainAt(9, 24) }));
  await h.eval(() => window.wyrm.input.simulate('breath', true));
  await waitGame(1.2);
  await h.eval(() => window.wyrm.input.simulate('breath', false));
  const floes = await h.eval(() => window.wyrm.level.waterIce.floes.map((f) => [+f.x.toFixed(1), +f.z.toFixed(1)]));
  h.check('ice breath freezes the water ahead into floes', floes.length >= 2, JSON.stringify({ floes, shore }));
  await h.shot('feature-ice-floes');
  // Walk out onto the ice.
  await h.page.keyboard.down('KeyW');
  await waitGame(0.6);
  await h.page.keyboard.up('KeyW');
  await waitGame(0.2);
  const out = await h.eval(() => {
    const g = window.wyrm;
    const b = g.player.body;
    return { x: +b.x.toFixed(2), y: +b.y.toFixed(2), grounded: b.grounded, state: g.state, terrain: +g.col.terrainAt(b.x, b.z).toFixed(2) };
  });
  h.check('the dragon stands on the frozen water', out.state === 'play' && out.grounded && out.x > 6 && out.terrain < -0.3, JSON.stringify(out));

  // 3) Lightning conducts through water: a wet grunt's shock arcs to the other.
  await h.eval(() => {
    const g = window.wyrm;
    g.player.element = 'lightning';
    for (const e of g.enemies) { e.alive = false; e.state = 'dead'; e.deadT = 1; }
    // The east bog is shallow water.
    const y = g.col.groundAt(36, 142, 1e4, 0.1).y;
    const a = g.spawnEnemy('grunt', 36, y + 0.05, 142, Math.PI, false);
    const b = g.spawnEnemy('grunt', 39, y + 0.05, 145, Math.PI, false);
    a.state = 'idle'; b.state = 'idle';
    window.__wet = [a, b];
    const py = g.col.groundAt(36, 138.5, 1e4, 0.1).y;
    g.player.place(36, py + 0.05, 138.5, 0);
  });
  await waitGame(0.9);
  const before = await h.eval(() => window.__wet.map((e) => e.hp));
  await h.eval(() => { const e = window.__wet[0]; e.takeHit({ damage: 6, type: 'lightning', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 10, heavy: false, spike: false, source: 'breath', move: 'arcBreath', fromPlayer: true, ox: 36, oz: 138.5 }); });
  const after = await h.eval(() => window.__wet.map((e) => e.hp));
  const wet = await h.eval(() => ({ y: window.__wet[0].y, water: window.wyrm.waterLevel }));
  h.check('lightning on a wet foe arcs to another in the water', after[1] < before[1] && before[0] - after[0] > 6, `${before} -> ${after} ${JSON.stringify(wet)}`);
}

/** The Gloom Sapper lobs kegs; fire on the keg it carries blows up its friends. Elites glow gold. */
export async function sapper(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 150; i++) {
      await h.wait(60);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.go('?level=sanctum&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  await h.eval(() => {
    const g = window.wyrm;
    g.player.place(0, 0.3, -8, 0);
    g.player.invuln = true;
    const s = g.spawnEnemy('sapper', 0, 0.3, 2, Math.PI, false);
    s.aggro = true;
    window.__sap = s;
    window.__lobbed = 0;
    const orig = g.spawnProjectile.bind(g);
    g.spawnProjectile = (spec) => { if (!spec.fromPlayer && spec.explode) window.__lobbed++; return orig(spec); };
  });
  for (let i = 0; i < 40; i++) {
    await waitGame(0.3);
    if (await h.eval(() => window.__lobbed > 0)) break;
  }
  h.check('the sapper lobs a keg', await h.eval(() => window.__lobbed > 0));
  await h.shot('feature-sapper-lob');
  // Fire on the sapper sets off its keg and hurts a grunt standing beside it.
  await h.eval(() => {
    const g = window.wyrm;
    const s = window.__sap;
    const gr = g.spawnEnemy('grunt', s.x + 1.2, s.y, s.z, Math.PI, false);
    gr.state = 'idle';
    window.__gr = gr;
  });
  await waitGame(0.2);
  const r = await h.eval(() => {
    const s = window.__sap;
    const gr = window.__gr;
    const hp0 = gr.hp;
    s.takeHit({ damage: 3, type: 'fire', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 5, heavy: false, spike: false, source: 'breath', move: 'fireBreath', fromPlayer: true, ox: 0, oz: -8 });
    return { grunt: [hp0, gr.hp, gr.alive], sapper: s.alive };
  });
  h.check('fire detonates the sapper\'s keg and it hurts its allies', r.grunt[1] < r.grunt[0], JSON.stringify(r));
  // An elite: tougher and gold.
  const el = await h.eval(() => {
    const g = window.wyrm;
    const e = g.spawnEnemy('grunt', 4, 0.3, 0, Math.PI, false);
    const hp = e.maxHp;
    e.makeElite();
    return { hp, eliteHp: e.maxHp, elite: e.elite };
  });
  h.check('an elite has more health', el.elite && el.eliteHp > el.hp * 1.5, JSON.stringify(el));
  await waitGame(0.5);
  await h.shot('feature-elite');
}
