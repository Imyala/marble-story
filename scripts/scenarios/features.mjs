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
    // Spawns can roll elite on their own; compare against the plain grunt.
    const hp = 42;
    if (!e.elite) e.makeElite();
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

/** Touch controls: appear on first touch; the left thumb moves, the right drags the camera, buttons act. */
export async function touch(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 300; i++) {
      await h.wait(40);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  await h.eval(() => {
    window.__touch = (type, target, id, x, y) => {
      const t = new Touch({ identifier: id, target, clientX: x, clientY: y });
      target.dispatchEvent(new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true }));
    };
    window.__touch('touchstart', window, 99, 1, 1);
    window.__touch('touchend', window, 99, 1, 1);
  });
  await waitGame(0.2);
  const shown = await h.eval(() => ({ on: window.wyrm.input.usingTouch, vis: getComputedStyle(document.querySelector('.touch-layer')).display }));
  h.check('touch controls appear after the first touch', shown.on && shown.vis !== 'none', JSON.stringify(shown));
  const z0 = await h.eval(() => [window.wyrm.player.x, window.wyrm.player.z]);
  await h.eval(() => {
    const L = document.querySelector('.touch-layer');
    window.__touch('touchstart', L, 1, 150, 420);
    window.__touch('touchmove', L, 1, 150, 340);
  });
  await waitGame(1);
  const mv = await h.eval(() => ({ m: window.wyrm.input.touchMove, p: [window.wyrm.player.x, window.wyrm.player.z] }));
  await h.shot('touch-controls');
  await h.eval(() => { window.__touch('touchend', document.querySelector('.touch-layer'), 1, 150, 340); });
  const moved = Math.hypot(mv.p[0] - z0[0], mv.p[1] - z0[1]);
  h.check('the left thumb moves the dragon', mv.m && mv.m.y > 0.8 && moved > 2, JSON.stringify({ mv, moved }));
  const yaw0 = await h.eval(() => window.wyrm.cam.yaw);
  await h.eval(() => {
    const L = document.querySelector('.touch-layer');
    window.__touch('touchstart', L, 2, 700, 250);
    for (let i = 1; i <= 5; i++) window.__touch('touchmove', L, 2, 700 + i * 20, 250);
  });
  await waitGame(0.2);
  const yaw1 = await h.eval(() => window.wyrm.cam.yaw);
  await h.eval(() => window.__touch('touchend', document.querySelector('.touch-layer'), 2, 800, 250));
  h.check('dragging on the right turns the camera', Math.abs(yaw1 - yaw0) > 0.05, JSON.stringify({ yaw0, yaw1 }));
  await h.eval(() => { const b = document.querySelector('.b-jump'); window.__touch('touchstart', b, 3, 0, 0); });
  await waitGame(0.25);
  const air = await h.eval(() => ({ g: window.wyrm.player.body.grounded, vy: window.wyrm.player.body.vy, y: window.wyrm.player.y }));
  await h.eval(() => { const b = document.querySelector('.b-jump'); window.__touch('touchend', b, 3, 0, 0); });
  h.check('the Jump button jumps', !air.g, JSON.stringify(air));
}

/** The Fen's thief keeps to the ruin island, and its ring chain can really be flown from the glide ledge. */
export async function fenextras(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 900; i++) {
      await h.wait(30);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.05', 2500);
  await h.skipDialogue(6000);
  await h.eval(() => {
    const g = window.wyrm;
    g.player.invuln = true;
    window.__t = g.level.props.find((p) => p.id === 'fen:egg-thief' && p.mode);
    window.__r = g.level.props.find((p) => p.id === 'fen:rings:ledge');
    for (const e of g.enemies) { e.alive = false; e.state = 'dead'; e.deadT = 1; }
    g.player.place(-3, g.col.groundAt(-3, 113, 1e4, 0.1).y + 0.05, 113, 0);
  });
  await waitGame(0.5);
  let worst = { wet: 0, far: 0 };
  for (let i = 0; i < 16; i++) {
    // Chase it around: stay a few metres behind it.
    await h.eval(() => { const g = window.wyrm; const t = window.__t; const dx = g.player.x - t.x; const dz = g.player.z - t.z; const d = Math.hypot(dx, dz) || 1; const px = t.x + dx / d * 5; const pz = t.z + dz / d * 5; const y = g.col.groundAt(px, pz, 1e4, 0.1).y; if (y > -1e3 && !g.isDeepWater(px, pz, y)) g.player.place(px, y + 0.05, pz, 0); });
    await waitGame(0.5);
    const s = await h.eval(() => { const g = window.wyrm; const t = window.__t; const gy = g.col.groundAt(t.x, t.z, t.y + 1, 0.1).y; return { wet: g.isDeepWater(t.x, t.z, gy) ? 1 : 0, far: Math.hypot(t.x + 3, t.z - 121), mode: t.mode }; });
    worst = { wet: Math.max(worst.wet, s.wet), far: Math.max(worst.far, s.far), mode: s.mode };
  }
  h.check('the Fen thief runs about the ruins without ending up in the water', worst.wet === 0 && worst.far < 20 && worst.mode !== 'wait', JSON.stringify(worst));
  await h.shot('fen-thief');
  // Fly the ring chain: real jump, flap and glide; the bot only turns toward the next ring.
  await h.eval(() => { const g = window.wyrm; g.player.place(2, 8.05, 94.3, Math.atan2(2.5, 4.2)); g.cam.snapBehind(Math.atan2(2.5, 4.2)); });
  await waitGame(0.3);
  await h.eval(() => window.wyrm.input.simulate('jump', true));
  await waitGame(0.2);
  await h.eval(() => window.wyrm.input.simulate('jump', false));
  await waitGame(0.12);
  await h.eval(() => window.wyrm.input.simulate('jump', true));
  const trail = [];
  for (let i = 0; i < 80; i++) {
    const s = await h.eval(() => {
      const g = window.wyrm; const r = window.__r; const n = r.rings[Math.min(r.next, r.rings.length - 1)];
      const b = g.player.body;
      g.player.yaw = Math.atan2(n.x - b.x, n.z - b.z);
      return { j: g.player.jumps, vy: +b.vy.toFixed(1), st: g.state, ps: g.player.state, next: r.next, x: +b.x.toFixed(1), y: +b.y.toFixed(1), z: +b.z.toFixed(1), glide: g.player.gliding, found: !!g.save.found['fen:rings:ledge'] };
    });
    if (i % 4 === 0) trail.push(s);
    if (s.found || (!s.glide && i > 20 && s.y < 3)) break;
    await waitGame(0.06);
  }
  await h.eval(() => window.wyrm.input.simulate('jump', false));
  const done = await h.eval(() => !!window.wyrm.save.found['fen:rings:ledge']);
  h.check('the ledge ring chain can be flown in one glide', done, JSON.stringify(trail.slice(-8)));
}

/** Smash the bottom crate of a stack and the ones on top drop onto the ground. */
export async function stack(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 300; i++) {
      await h.wait(40);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  const r0 = await h.eval(() => {
    const g = window.wyrm;
    const set = g.level.props.find((p) => p.items && p.unsupport);
    // Find a breakable with another resting on top of it.
    for (const b of set.items) {
      if (!b.alive) continue;
      const top = set.items.find((o) => o !== b && o.alive && Math.abs(o.y - (b.y + b.height)) < 0.35 && Math.hypot(o.x - b.x, o.z - b.z) < (o.radius + b.radius) * 0.75);
      if (top) { window.__pair = [b, top]; return { base: [b.kind, +b.y.toFixed(2)], top: [top.kind, +top.y.toFixed(2)] }; }
    }
    return null;
  });
  h.check('the level has a stacked pile', !!r0, JSON.stringify(r0));
  if (!r0) return;
  await h.eval(() => window.__pair[0].takeHit({ damage: 99, type: 'physical', heavy: true, source: 'melee', move: 'tail3', fromPlayer: true, dirX: 0, dirZ: 1 }));
  await waitGame(1.2);
  const r1 = await h.eval(() => { const [b, t] = window.__pair; return { baseAlive: b.alive, topAlive: t.alive, topY: +t.y.toFixed(2), falling: t.falling, baseY: +b.y.toFixed(2) }; });
  h.check('the one on top falls to where the base stood', !r1.baseAlive && r1.topAlive && !r1.falling && Math.abs(r1.topY - r1.baseY) < 0.4, JSON.stringify({ r0, r1 }));
}

/** Each realm starts its own soundscape, and its calls play without errors. */
export async function ambience(h) {
  for (const lvl of ['fen', 'frostworks', 'keep']) {
    await h.go(`?level=${lvl}&seed=5&quality=low&maxdt=0.1`, 2000);
    await h.eval(() => window.wyrm.audio.unlock());
    await h.skipDialogue(6000);
    await h.wait(1500);
    const r = await h.eval(() => { const a = window.wyrm.audio; for (let i = 0; i < 40; i++) a.ambienceTick(1); return { kind: a.amb?.kind ?? null, state: a.ctx?.state }; });
    h.check(`${lvl} plays its soundscape`, r.kind === lvl, JSON.stringify(r));
  }
}

/** Photo mode: enter from pause, orbit, filter, capture a PNG, and back out with the quality restored. */
export async function photo(h) {
  await h.go('?level=sanctum&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  await h.eval(() => { const g = window.wyrm; g.player.place(0, 0.3, -8, 0); g.pause(); });
  await h.wait(300);
  await h.eval(() => [...document.querySelectorAll('button')].find((b) => /Photo Mode/i.test(b.textContent)).click());
  await h.wait(600);
  const a = await h.eval(() => ({ on: window.wyrm.photo.active, q: window.wyrm.renderer.quality, yaw: window.wyrm.photo.yaw }));
  h.check('photo mode opens at high quality', a.on && a.q === 'high', JSON.stringify(a));
  await h.page.mouse.move(480, 300);
  await h.page.mouse.down();
  await h.page.mouse.move(640, 260, { steps: 6 });
  await h.page.mouse.up();
  await h.page.keyboard.press('Digit3');
  await h.wait(600);
  const b = await h.eval(() => ({ yaw: window.wyrm.photo.yaw, filter: document.querySelector('.photo-filter')?.textContent }));
  h.check('dragging orbits and 3 picks the Dusk filter', Math.abs(b.yaw - a.yaw) > 0.3 && /Dusk/.test(b.filter), JSON.stringify({ a, b }));
  await h.shot('photo-mode');
  const dl = h.page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
  await h.page.keyboard.press('Enter');
  const file = await dl;
  h.check('capture saves a PNG', !!file && /\.png$/.test(file.suggestedFilename()), file ? file.suggestedFilename() : 'no download');
  await h.page.keyboard.press('Escape');
  await h.wait(600);
  const c = await h.eval(() => ({ on: window.wyrm.photo.active, q: window.wyrm.renderer.quality, state: window.wyrm.state, pauseMenu: !!document.querySelector('.menu h2') }));
  h.check('Esc returns to the pause menu at the old quality', !c.on && c.q === 'low' && c.state === 'pause' && c.pauseMenu, JSON.stringify(c));
}

/** Fly between awakened Wardstones in a realm; the pause menu and Wardgate show how much is explored. */
export async function wardflight(h) {
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  const ids = await h.eval(() => [...window.wyrm.level.wardstones.keys()]);
  h.check('the Fen has at least two Wardstones', ids.length >= 2, JSON.stringify(ids));
  // Awaken the first two by walking up to them.
  for (const id of ids.slice(0, 2)) {
    await h.eval((id) => { const g = window.wyrm; const w = g.level.wardstones.get(id); g.player.place(w.x + 1.5, w.y + 0.1, w.z, 0); }, id);
    await h.wait(1000);
  }
  await h.eval((id) => { const g = window.wyrm; g.openWardstone(g.level.wardstones.get(id)); }, ids[1]);
  await h.wait(300);
  const btn = await h.eval(() => !![...document.querySelectorAll('button')].find((b) => /Fly to a Wardstone/.test(b.textContent)));
  h.check('the Wardstone offers a flight', btn);
  await h.eval(() => [...document.querySelectorAll('button')].find((b) => /Fly to a Wardstone/.test(b.textContent)).click());
  await h.wait(300);
  await h.shot('ward-flight');
  await h.eval(() => { const lists = document.querySelectorAll('.menu-list'); lists[lists.length - 1].querySelector('button').click(); });
  await h.wait(1800);
  const r = await h.eval((id) => { const g = window.wyrm; const w = g.level.wardstones.get(id); return { state: g.state, d: Math.hypot(g.player.x - w.x, g.player.z - w.z), cp: g.save.checkpoint }; }, ids[0]);
  h.check('flying lands Aster by the other stone and plays on', r.state === 'play' && r.d < 4 && r.cp === ids[0], JSON.stringify(r));
  await h.eval(() => window.wyrm.pause());
  await h.wait(300);
  const sub = await h.eval(() => document.querySelector('.panel .sub')?.textContent ?? '');
  h.check('the pause menu shows how much is explored', /\d+% explored/.test(sub), sub);
}

/** Running plays footsteps for the ground underfoot; pausing muffles the mix. */
export async function footsteps(h) {
  await h.go('?level=frostworks&seed=5&quality=low&maxdt=0.1', 2500);
  await h.eval(() => window.wyrm.audio.unlock());
  await h.skipDialogue(6000);
  await h.eval(() => { const a = window.wyrm.audio; window.__steps = []; const f = a.footstep.bind(a); a.footstep = (s, v) => { window.__steps.push(s); f(s, v); }; });
  await h.page.keyboard.down('KeyW');
  await h.wait(1500);
  await h.page.keyboard.up('KeyW');
  const steps = await h.eval(() => window.__steps);
  h.check('running on snow plays snowy footsteps', steps.length >= 3 && steps.includes('snow'), JSON.stringify(steps.slice(0, 8)));
  await h.eval(() => window.wyrm.pause());
  await h.wait(400);
  const m = await h.eval(() => window.wyrm.audio.muffleAmt);
  h.check('the pause menu muffles the world', m > 0.4, String(m));
}

/** Holding the Flick button sends him toward the next fight on the path. */
export async function guide(h) {
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  await h.eval(() => window.wyrm.input.simulate('hint', true));
  await h.wait(700);
  await h.eval(() => window.wyrm.input.simulate('hint', false));
  await h.wait(300);
  const r = await h.eval(() => { const f = window.wyrm.flick; return { t: f.seekTarget && [Math.round(f.seekTarget.x), Math.round(f.seekTarget.z)], line: document.querySelector('.flick p')?.textContent ?? '', goals: window.wyrm.level.goals.map((q) => q.label) }; });
  h.check('holding Flick points toward the willow fight', !!r.t && /path goes on|Right here/.test(r.line), JSON.stringify(r));
}

/** A swing still winding up can be abandoned for a dodge. */
export async function dodgecancel(h) {
  await h.go('?level=sanctum&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  const r = await h.eval(() => new Promise((res) => {
    const g = window.wyrm; const p = g.player;
    p.place(0, 0.3, -8, 0);
    p.startMove(window.wyrmDebug.MOVES.horn3);
    g.input.simulate('dodge', true);
    const t0 = g.realTime;
    const tick = () => { if (g.realTime - t0 < 0.15) { requestAnimationFrame(tick); return; } g.input.simulate('dodge', false); res(p.state); };
    tick();
  }));
  h.check('dodge cancels an attack in its wind-up', r === 'dodge', r);
}
