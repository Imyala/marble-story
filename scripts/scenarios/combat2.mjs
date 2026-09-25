export default async function (h) {
  await h.go('?level=fen&seed=3&quality=low&maxdt=0.25', 2500);
  await h.skipDialogue();
  await h.eval(() => {
    const g = window.wyrm;
    window.__moves = [];
    window.__sfx = [];
    const p = g.player;
    const sm = p.startMove.bind(p);
    p.startMove = (d) => { window.__moves.push(d.id); sm(d); };
    const sf = g.sfx.bind(g);
    g.sfx = (id, ...rest) => { window.__sfx.push(id); sf(id, ...rest); };
    g.player.place(0, 1.2, 0, 0);
    g.cam.snapBehind(0);
    window.__spawn = (type, dz = 2.2, hp = 400) => { const e = g.spawnEnemy(type, g.player.x, g.player.y, g.player.z + dz, Math.PI, false); e.hp = e.maxHp = hp; e.aggro = true; return e; };
  });
  // 1) Telegraph cue before an enemy hit.
  await h.eval(() => window.__spawn('grunt', 1.9));
  await h.wait(4500);
  const sfx = await h.eval(() => window.__sfx);
  h.check('enemy attack plays the dodge cue first', sfx.includes('cue'), sfx.filter((x) => x === 'cue' || x === 'enemyAttack').join(','));
  await h.eval(() => { for (const e of window.wyrm.enemies) if (e.alive) e.die(null); window.wyrm.player.hp = 100; });
  await h.wait(800);
  // 2) Delay combo: horn2 ended a beat ago, then horn -> flurry (logic check).
  const fl = await h.eval(() => {
    const g = window.wyrm; const p = g.player; const M = window.wyrmDebug.MOVES;
    for (const e of g.enemies) if (e.alive) e.die(null);
    p.setState('move'); p.move = null;
    p.lastEnded = { id: 'horn2', t: p.clock - 0.25 };
    g.input.simulate('horn', true);
    return new Promise((res) => setTimeout(() => { g.input.simulate('horn', false); res({ state: p.state, move: p.move?.id }); }, 400));
  });
  h.check('horn, horn, pause, horn gives a flurry', fl.move === 'flurry', JSON.stringify(fl));
  await h.wait(900);
  let mv;
  // 3) Running horn -> lunge.
  await h.eval(() => { const g = window.wyrm; g.player.place(0, 1.2, -8, 0); window.__moves.length = 0; });
  await h.page.keyboard.down('KeyW');
  // Run until actually at speed (game time, not wall time), then swing.
  for (let i = 0; i < 120; i++) {
    const sp = await h.eval(() => Math.hypot(window.wyrm.player.body.vx, window.wyrm.player.body.vz));
    if (sp > 7.6) break;
    await h.wait(40);
  }
  await h.tap('KeyJ', 1, 300);
  await h.page.keyboard.up('KeyW');
  mv = await h.eval(() => window.__moves.slice());
  h.check('horn while running is a lunge', mv[0] === 'lunge', mv.join(','));
  await h.wait(600);
  // 4) Infused finisher: start a Horn Ram while holding breath.
  await h.eval(() => { const g = window.wyrm; if (!g.save.elements.includes('fire')) g.learnElement('fire'); g.player.element = 'fire'; g.player.mana = 100;
    for (const e of g.enemies) if (e.alive) e.die(null);
    g.player.place(0, 1.2, 0, 0); g.player.yaw = 0; window.__e = window.__spawn('grunt', 2.1, 500); window.__e.globalCd = 99; });
  await h.wait(400);
  await h.eval(() => { const g = window.wyrm; g.input.simulate('breath', true); });
  await h.wait(150);
  await h.eval(() => { const g = window.wyrm; g.player.startMove(window.wyrmDebug.MOVES.horn3); });
  await h.wait(700);
  await h.eval(() => window.wyrm.input.simulate('breath', false));
  const inf = await h.eval(() => ({ heat: window.__e.status.heat, burn: window.__e.status.burn, last: window.__e.lastHitBy, mana: Math.round(window.wyrm.player.mana) }));
  h.check('holding breath on the finisher infuses it', inf.last.includes(':fire') || inf.burn > 0 || inf.heat > 30, JSON.stringify(inf));
  await h.wait(600);
  // 5) Juggle decay.
  const jug = await h.eval(() => {
    const e = window.__e; e.status.clear();
    const mk = (launch) => ({ damage: 1, type: 'physical', dirX: 0, dirZ: 1, knockback: 1, launch, stagger: 100, hitstop: 0, buildup: 0, heavy: false, spike: false, source: 'melee', move: 'x', fromPlayer: true, ox: 0, oz: 0 });
    e.takeHit(mk(12));
    const vys = [];
    for (let i = 0; i < 6; i++) { e.body.vy = 0; e.takeHit(mk(0)); vys.push(+e.body.vy.toFixed(2)); }
    return { hits: e.juggleHits, vys };
  });
  h.check('juggle hits lift less each time', jug.vys[0] > jug.vys[5] && jug.hits >= 6, JSON.stringify(jug));
  // 6) Lock target switching.
  const sw = await h.eval(() => {
    const g = window.wyrm; const p = g.player;
    for (const e of g.enemies) if (e.alive) e.die(null);
    const a = g.spawnEnemy('grunt', p.x - 4, p.y, p.z + 6, 0, false);
    const b = g.spawnEnemy('grunt', p.x + 4, p.y, p.z + 6, 0, false);
    g.cam.yaw = 0; p.lock = a;
    const next = p.nextLockTarget(a.x < b.x ? -1 : 1);
    return next === b;
  });
  h.check('flick switches lock to the enemy on the other side', sw);
  // 7) Dodge then horn -> lunge (dodge strike).
  await h.eval(() => { window.__moves.length = 0; for (const e of window.wyrm.enemies) if (e.alive) e.die(null); });
  await h.wait(500);
  await h.page.keyboard.down('KeyW');
  await h.tap('ShiftLeft', 1, 200);
  await h.tap('KeyJ', 1, 300);
  await h.page.keyboard.up('KeyW');
  mv = await h.eval(() => window.__moves.slice());
  h.check('dodge into horn is a dodge strike', mv.includes('lunge'), mv.join(','));
}
