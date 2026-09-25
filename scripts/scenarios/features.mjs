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

/** Feats pay out once; the Bestiary fills as you meet foes; both show in the Journal. */
export async function journal(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 150; i++) {
      await h.wait(60);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  const r = await h.eval(() => {
    const g = window.wyrm;
    const gems0 = g.save.gems;
    g.save.stats.kills = 49;
    const e = g.spawnEnemy('grunt', g.player.body.x + 3, g.player.body.y, g.player.body.z, Math.PI, false);
    g.noticeEnemy(e);
    const seen = !!g.save.found['seen:grunt'];
    g.onEnemyKilled(e, null);
    const paid = g.save.gems - gems0;
    g.onEnemyKilled(e, null);
    const again = g.save.gems - gems0;
    return { seen, paid, again, feat: !!g.save.found['feat:kills1'] };
  });
  h.check('meeting a foe adds it to the Bestiary', r.seen, JSON.stringify(r));
  h.check('a feat pays its reward exactly once', r.feat && r.paid >= 60 && r.again - r.paid < 60, JSON.stringify(r));
  await h.eval(() => { const m = window.wyrm.menus; m.journalTab = 'bestiary'; m.showJournal(); });
  await h.wait(300);
  const beast = await h.eval(() => [...document.querySelectorAll('.entry.beast h4')].map((e) => e.textContent));
  h.check('the Bestiary lists the Gloomling', beast.includes('Gloomling'), JSON.stringify(beast));
  await h.shot('journal-bestiary');
  await h.eval(() => { const m = window.wyrm.menus; m.pop(); m.journalTab = 'feats'; m.showJournal(); });
  await h.wait(300);
  const feats = await h.eval(() => [...document.querySelectorAll('.entry.feat')].map((e) => [e.querySelector('h4').textContent, e.classList.contains('done')]));
  h.check('the Feats page shows progress and the earned feat', feats.length >= 10 && feats.some(([n, d]) => /Gloombane/.test(n) && d), JSON.stringify(feats));
  await h.shot('journal-feats');
}

/** The dragon turns its head toward a foe beside it. */
export async function gaze(h) {
  await h.go('?level=fen&seed=5&quality=high&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  await h.eval(() => {
    const g = window.wyrm;
    for (const e of g.enemies) { e.alive = false; e.state = 'dead'; e.deadT = 1; }
    const y = g.col.groundAt(10, -4, 1e4, 0.1).y + 0.05;
    g.player.place(10, y, -4, 0);
    g.player.invuln = true;
    const e = g.spawnEnemy('grunt', 14, y, -2, -Math.PI / 2, false);
    e.aggro = true; e.def.speed; window.__g = e;
    e.state = 'idle';
    g.cam.snapBehind(Math.PI);
  });
  await h.wait(2500);
  const r = await h.eval(() => ({ gaze: window.wyrm.player.pose.gaze, yaw: window.wyrm.player.rig.P?.headYaw }));
  h.check('the head turns toward the nearby foe', r.gaze != null && r.gaze > 0.5, JSON.stringify(r));
  await h.shot('feature-gaze');
}

/** Dragon Time drains the color with a ripple; the grade pass runs on high quality. */
export async function grade(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.realTime);
    for (let i = 0; i < 150; i++) {
      await h.wait(60);
      if ((await h.eval(() => window.wyrm.realTime)) - start >= sec) return;
    }
  };
  await h.go('?level=sanctum&seed=5&quality=high&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  await h.eval(() => { const g = window.wyrm; g.hud.show(false); g.player.dtime = 100; });
  await waitGame(0.5);
  await h.shot('grade-normal');
  await h.eval(() => { window.wyrm.player.dtime = 100; window.wyrm.input.simulate('dragonTime', true); });
  await waitGame(0.25);
  await h.shot('grade-dtime-ripple');
  await waitGame(0.8);
  const r = await h.eval(() => ({ on: window.wyrm.player.dragonTimeActive, grading: window.wyrm.renderer.grading, dt: window.wyrm.renderer.look.dt }));
  h.check('Dragon Time eases the grade in', r.on && r.grading && r.dt > 0.8, JSON.stringify(r));
  await h.shot('grade-dtime');
  await h.eval(() => window.wyrm.input.simulate('dragonTime', false));
}

/** Storm weather in the Falls: rain and a lightning strike that lights the sky. */
export async function storm(h) {
  await h.go('?level=falls&seed=5&quality=high&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  await h.eval(() => { const g = window.wyrm; g.hud.show(false); g.weather.nextStrike = 0.05; });
  let r = null;
  for (let i = 0; i < 40; i++) {
    await h.wait(30);
    r = await h.eval(() => ({ bolt: !!window.wyrm.weather.bolt, rain: window.wyrm.weather.rain.visible, flash: window.wyrm.weather.flash }));
    if (r.bolt) break;
  }
  await h.shot('storm-strike');
  h.check('the Falls have rain and a lightning strike', r.bolt && r.rain, JSON.stringify(r));
}

/** Finishing a realm shows a results card with a medal before leaving. */
export async function results(h) {
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=falls&seed=5&quality=high&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  await h.eval(() => {
    const g = window.wyrm;
    g.visit.hits = 3; g.visit.combo = 24; g.visit.rank = 4; g.visit.gems = 318;
    g.save.stats.kills += 41;
    g.save.levelsDone.falls = true;
    g.travel('sanctum');
  });
  await h.wait(2500);
  const r = await h.eval(() => ({ state: window.wyrm.state, rows: [...document.querySelectorAll('.res-row')].map((e) => e.textContent), medal: document.querySelector('.medal b')?.textContent }));
  h.check('a results card shows before leaving a finished realm', r.state === 'pause' && r.rows.length === 7 && !!r.medal, JSON.stringify(r));
  // Headless frames are slow; skip the entrance animations for the screenshot.
  await h.eval(() => document.getAnimations().forEach((a) => { if (a.effect?.target?.closest?.('.results')) a.finish(); }));
  await h.wait(300);
  await h.shot('results');
  await h.eval(() => [...document.querySelectorAll('.panel.results button')].find((b) => /Continue/i.test(b.textContent)).click());
  await h.wait(1500);
  const after = await h.eval(() => ({ state: window.wyrm.state, level: window.wyrm.level.def.id, medal: Object.keys(window.wyrm.save.found).filter((k) => k.startsWith('medal:')) }));
  h.check('continuing travels on and keeps the medal', (after.state === 'transition' || after.level === 'sanctum') && after.medal.length > 0, JSON.stringify(after));
}

/** An egg thief bolts when the dragon comes near, runs in bursts, and drops its egg when caught. */
export async function thief(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 200; i++) {
      await h.wait(60);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  const hx = Number(process.env.TX ?? 0), hz = Number(process.env.TZ ?? -6);
  await h.eval(([hx, hz]) => {
    const g = window.wyrm;
    for (const e of g.enemies) { e.alive = false; e.state = 'dead'; e.deadT = 1; }
    window.__t = g.addEggThief('fen:egg-thief', hx, hz, 12);
    g.player.place(hx, g.col.groundAt(hx, hz + 14, 1e4, 0.1).y + 0.05, hz + 14, Math.PI);
    g.cam.snapBehind(Math.PI);
  }, [hx, hz]);
  await waitGame(0.5);
  const wait = await h.eval(() => window.__t.mode);
  await h.eval(([hx, hz]) => { const g = window.wyrm; g.player.place(hx, g.col.groundAt(hx, hz + 7, 1e4, 0.1).y + 0.05, hz + 7, Math.PI); }, [hx, hz]);
  await waitGame(0.3);
  const p0 = await h.eval(() => [window.__t.x, window.__t.z, window.__t.mode]);
  await h.shot('thief-bolts');
  await waitGame(2);
  const p1 = await h.eval(() => [window.__t.x, window.__t.z, window.__t.mode, window.__t.y]);
  const moved = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  h.check('the thief waits, then bolts when the dragon comes close', wait === 'wait' && (p0[2] === 'flee' || p0[2] === 'rest') && moved > 4, JSON.stringify({ wait, p0, p1, moved }));
  const home = await h.eval(([hx, hz]) => Math.hypot(window.__t.x - hx, window.__t.z - hz), [hx, hz]);
  // Run it for a while: it should stay near its den and on the ground.
  await waitGame(6);
  const p2 = await h.eval(([hx, hz]) => { const t = window.__t; const g = window.wyrm; return { d: Math.hypot(t.x - hx, t.z - hz), y: t.y, ground: g.col.groundAt(t.x, t.z, t.y + 1, 0.1).y }; }, [hx, hz]);
  h.check('it stays within its leash and on solid ground', p2.d < 34 && Math.abs(p2.y - p2.ground) < 0.8, JSON.stringify({ home, p2 }));
  // Catch it with a blow; the egg drops and can be collected.
  const r = await h.eval(() => {
    const g = window.wyrm;
    const t = window.__t;
    g.player.place(t.x, t.y + 0.05, t.z + 1.4, Math.PI);
    t.takeHit({});
    const egg = g.level.props.find((p) => p.id === 'fen:egg-thief' && p.kind === 'egg');
    return { alive: t.alive, egg: !!egg, ex: egg?.x, ez: egg?.z };
  });
  await waitGame(0.2);
  await h.eval(() => { const g = window.wyrm; const e = g.level.props.find((p) => p.id === 'fen:egg-thief'); g.player.place(e.x, e.y + 0.05, e.z, 0); });
  await waitGame(0.6);
  const got = await h.eval(() => !!window.wyrm.save.found['fen:egg-thief']);
  h.check('catching it drops the egg, which can be collected', !r.alive && r.egg && got, JSON.stringify({ ...r, got }));
}

/** Grass bends away from the dragon's feet (shader compiles, no errors). */
export async function grass(h) {
  await h.go('?level=plains&seed=5&quality=high&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  await h.eval(() => { const g = window.wyrm; g.hud.show(false); g.cam.snapBehind(g.player.yaw, 0.5); });
  await h.wait(2500);
  await h.shot('grass-push');
  const u = await h.eval(() => window.wyrm.player.body.y);
  h.check('the scene renders with the push shader', typeof u === 'number');
}

/** The Shade Drake: a wild Gloom dragon that bites, pounces, lashes and spits. */
export async function drake(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 300; i++) {
      await h.wait(60);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.go('?level=sanctum&seed=5&quality=high&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  await h.eval(() => {
    const g = window.wyrm;
    g.player.place(0, 0.3, -8, 0);
    g.player.invuln = true;
    const d = g.spawnEnemy('drake', 0, 0.3, 4, Math.PI, false);
    d.aggro = true;
    window.__d = d;
    window.__atk = new Set();
    const orig = d.startAttack?.bind(d);
    g.cam.snapBehind(0, 0.25);
    g.hud.show(false);
  });
  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    await waitGame(0.25);
    const a = await h.eval(() => (window.__d.attack && window.__d.state !== 'chase' ? window.__d.attack.id : null));
    if (a) seen.add(a);
    if (i === 12) await h.shot('drake-fight');
    if (seen.size >= 2 && i > 14) break;
  }
  h.check('the drake attacks with several moves', seen.size >= 2, JSON.stringify([...seen]));
  const r = await h.eval(() => {
    const d = window.__d;
    d.hp = 1;
    d.takeHit({ damage: 10, type: 'physical', dirX: 0, dirZ: 1, knockback: 2, launch: 0, stagger: 10, hitstop: 0, buildup: 0, heavy: false, spike: false, source: 'melee', move: 'horn1', fromPlayer: true, ox: 0, oz: -8 });
    return { alive: d.alive, seen: !!window.wyrm.save.found['seen:drake'] };
  });
  h.check('it can be defeated and joins the Bestiary', !r.alive && r.seen, JSON.stringify(r));
  await waitGame(1);
}

/** Flight rings: flying through the first starts the clock; the whole chain pays out; timing out resets. */
export async function rings(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 900; i++) {
      await h.wait(40);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=sanctum&seed=5&quality=high&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  await h.eval(() => {
    const g = window.wyrm;
    const R = window.wyrmDebug.SkyRings;
    const pts = [[0, 2.5, -2], [0, 3.5, 8], [4, 3.5, 17], [8, 3, 26]];
    window.__r = new R(g, 'sanctum:test', pts, { time: 4, bonus: 2, reward: 50 });
    g.level.props.push(window.__r);
    g.player.place(0, 0.3, -9, 0);
    g.player.invuln = true;
    g.cam.snapBehind(0, 0.2);
  });
  await waitGame(0.3);
  await h.shot('rings-idle');
  const gems0 = await h.eval(() => window.wyrm.save.gems);
  // Fly the dragon through each ring in turn.
  for (const [x, y, z] of [[0, 2.5, -2], [0, 3.5, 8], [4, 3.5, 17]]) {
    await h.eval(([x, y, z]) => { const g = window.wyrm; g.player.body.x = x; g.player.body.y = y - 0.7; g.player.body.z = z; g.player.body.vy = 0; }, [x, y, z]);
    await waitGame(0.25);
  }
  const mid = await h.eval(() => ({ next: window.__r.next, running: window.__r.running, hud: window.__r.hud.textContent }));
  await h.shot('rings-running');
  await h.eval(() => { const g = window.wyrm; g.player.body.x = 8; g.player.body.y = 2.3; g.player.body.z = 26; });
  await waitGame(0.3);
  await waitGame(1);
  const done = await h.eval(() => ({ found: !!window.wyrm.save.found['rings:sanctum:test'], running: window.__r.running, gems: window.wyrm.save.gems }));
  h.check('the ring chain starts, counts and pays out', mid.running && mid.next === 3 && done.found && !done.running, JSON.stringify({ mid, done, gems0 }));
  // A second attempt that times out resets.
  await h.eval(() => { const g = window.wyrm; g.player.body.x = 0; g.player.body.y = 1.8; g.player.body.z = -2; });
  await waitGame(0.3);
  await h.eval(() => { const g = window.wyrm; g.player.place(0, 0.3, -9, 0); });
  for (let k = 0; k < 6; k++) {
    await waitGame(1);
    console.log(await h.eval(() => [window.wyrm.time.toFixed(2), window.__r.timeLeft.toFixed(2), window.__r.running, window.wyrm.state]));
  }
  const reset = await h.eval(() => ({ running: window.__r.running, next: window.__r.next }));
  h.check('running out of time resets the rings', !reset.running && reset.next === 0, JSON.stringify(reset));
}
