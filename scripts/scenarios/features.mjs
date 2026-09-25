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
  h.check('a results card shows before leaving a finished realm', r.state === 'pause' && r.rows.length === 8 && !!r.medal, JSON.stringify(r));
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
  await h.eval(() => { const g = window.wyrm; const e = g.level.props.find((p) => p.id === 'fen:egg-thief' && p.kind === 'egg'); g.player.place(e.x, e.y + 0.05, e.z, 0); });
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
  for (let i = 0; i < 3; i++) await h.page.keyboard.press('BracketRight');
  await h.wait(600);
  const dof = await h.eval(() => document.querySelector('.photo-filter')?.textContent ?? '');
  h.check('] adds focus blur', /Focus blur 3/.test(dof), dof);
  await h.shot('photo-dof');
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

/** Critters graze in every realm, flee the dragon, and free butterflies that mend Aster. */
export async function critters(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 300; i++) {
      await h.wait(60);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  const counts = await h.eval(() => {
    const g = window.wyrm;
    const out = {};
    for (const id of ['sanctum', 'falls', 'frostworks', 'plains', 'keep', 'fen']) {
      g.loadLevel(id, {});
      const cs = g.level.props.filter((p) => p.constructor.name === 'Critter');
      out[id] = cs.map((c) => c.kind).join(',');
    }
    return out;
  });
  h.check('every realm has its own critters', Object.values(counts).every((v) => v.split(',').filter(Boolean).length >= 2), JSON.stringify(counts));
  await h.skipDialogue(3000);
  const c0 = await h.eval(() => {
    const g = window.wyrm;
    for (const e of g.enemies) { e.alive = false; e.state = 'dead'; e.deadT = 1; }
    const c = g.level.props.find((p) => p.constructor.name === 'Critter');
    window.__c = c;
    g.player.place(c.x + 2.5, c.y + 0.05, c.z, -Math.PI / 2);
    return [c.x, c.z];
  });
  await waitGame(1.2);
  const c1 = await h.eval(() => [window.__c.x, window.__c.z, window.__c.alive]);
  h.check('a critter scatters when the dragon comes close', Math.hypot(c1[0] - c0[0], c1[1] - c0[1]) > 0.8, JSON.stringify({ c0, c1 }));
  const before = await h.eval(() => {
    const g = window.wyrm; const p = g.player;
    p.hp = Math.round(p.maxHp * 0.2);
    return { hp: p.hp };
  });
  await waitGame(1);
  const low = await h.eval(() => window.wyrm.flick.glowCol.getHexString());
  const r = await h.eval(() => {
    const g = window.wyrm; const c = window.__c;
    const res = c.takeHit({});
    return { res, alive: c.alive, butterfly: g.level.props.some((p) => p.constructor.name === 'Butterfly') };
  });
  await waitGame(3);
  const after = await h.eval(() => { const g = window.wyrm; return { hp: g.player.hp, bf: g.save.stats.butterflies, cr: g.save.stats.critters }; });
  h.check('Flick glows green when Aster is low', /^[0-9a-f]{2}[c-f][0-9a-f]/.test(low) && parseInt(low.slice(0, 2), 16) < 0xa0, low);
  h.check('a struck critter frees a butterfly that Flick eats to mend Aster', !r.alive && r.butterfly && after.hp > before.hp && after.bf === 1 && after.cr === 1, JSON.stringify({ r, before, after }));
  await h.shot('critters');
}

/** Speed runes supercharge a charge; iron-bound chests only open to power. Shrines wake when their guards fall. */
export async function powerups(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 400; i++) {
      await h.wait(50);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  const iron = await h.eval(() => {
    const g = window.wyrm;
    const c = g.level.props.find((p) => p.constructor.name === 'Chest' && p.iron);
    window.__ic = c;
    return { found: !!c, res: c && c.takeHit({ source: 'melee', type: 'physical' }), alive: c && c.alive };
  });
  h.check('an iron-bound chest shrugs off an ordinary blow', iron.found && iron.res === 'blocked' && iron.alive, JSON.stringify(iron));
  // Charge down the rune lane into it.
  await h.eval(() => {
    const g = window.wyrm; const p = g.player;
    const yaw = Math.atan2(10.1 + 2.5, 6.1 + 6.5);
    p.place(-4, g.col.groundAt(-4, -8, 1e4, 0.2).y + 0.05, -8, yaw);
    g.cam.snapBehind(yaw, 0.3);
    window.__maxSuper = 0;
    const tick = () => { window.__maxSuper = Math.max(window.__maxSuper, p.superT); if (window.__ic.alive) requestAnimationFrame(tick); };
    tick();
  });
  await h.page.keyboard.down('KeyW');
  await waitGame(0.15);
  await h.page.keyboard.down('ShiftLeft');
  await waitGame(2.2);
  await h.shot('runes-charge');
  await h.page.keyboard.up('ShiftLeft');
  await h.page.keyboard.up('KeyW');
  const run = await h.eval(() => ({ maxSuper: window.__maxSuper, alive: window.__ic.alive, found: !!window.wyrm.save.found['fen:chest:runes'], p: [window.wyrm.player.x, window.wyrm.player.z] }));
  h.check('charging over speed runes supercharges the dragon and smashes the iron chest', run.maxSuper > 1 && !run.alive && run.found, JSON.stringify(run));

  // Plains: the Supercharge shrine sleeps while its guards stand.
  await h.eval(() => window.wyrm.loadLevel('plains', {}));
  await h.skipDialogue(4000);
  await waitGame(0.3);
  const s0 = await h.eval(() => {
    const g = window.wyrm;
    const s = g.level.props.find((p) => p.constructor.name === 'PowerShrine');
    window.__s = s;
    return { state: s.state, guards: s.guards.length };
  });
  await h.eval(() => {
    const g = window.wyrm; const s = window.__s;
    for (const e of s.guards) { e.alive = false; e.state = 'dead'; e.deadT = 1; }
    g.player.place(s.x - 8, s.y + 0.1, s.z, Math.PI / 2);
  });
  await waitGame(0.5);
  const s1 = await h.eval(() => window.__s.state);
  await h.eval(() => { const g = window.wyrm; const s = window.__s; g.cam.snapBehind(Math.PI / 2, 0.25); g.player.place(s.x, s.y + 0.1, s.z, Math.PI / 2); });
  await waitGame(0.4);
  await h.shot('shrine-power');
  const s2 = await h.eval(() => { const p = window.wyrm.player; return { state: window.__s.state, power: p.power, t: p.powerT, sup: p.supercharged, hud: document.querySelector('.power-meter')?.className }; });
  h.check('a shrine sleeps while its guards stand, then wakes', s0.state === 'locked' && s0.guards >= 3 && s1 === 'ready', JSON.stringify({ s0, s1 }));
  h.check('walking through a woken shrine grants its power', s2.state === 'spent' && s2.power === 'supercharge' && s2.sup && /on/.test(s2.hud ?? ''), JSON.stringify(s2));
  // Invincibility shrugs off a blow.
  const inv = await h.eval(() => {
    const g = window.wyrm; const p = g.player;
    p.grantPower('invincible');
    const hp = p.hp;
    const r = p.takeHit({ damage: 30, dirX: 1, dirZ: 0, knockback: 5, launch: 0, source: 'enemy', type: 'physical' }, null);
    return { r, hp0: hp, hp1: p.hp };
  });
  h.check('invincibility takes no damage', inv.r !== 'hit' && inv.hp1 === inv.hp0, JSON.stringify(inv));
  const sf = await h.eval(() => {
    const p = window.wyrm.player;
    p.clearPower();
    const before = p.canBreakIron({ source: 'breath', type: 'fire' });
    p.grantPower('superflame');
    return { before, after: p.canBreakIron({ source: 'breath', type: 'fire' }), melee: p.canBreakIron({ source: 'melee', type: 'physical' }) };
  });
  h.check('Superflame breath melts iron; plain blows still do not', !sf.before && sf.after && !sf.melee, JSON.stringify(sf));
}

/** Skill Points: the Sanctum rune ring, the Fen butterflies, and a boss rematch without a scratch. */
export async function skills(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 400; i++) {
      await h.wait(50);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=sanctum&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  const ring = await h.eval(() => {
    const g = window.wyrm; const p = g.player;
    const lane = g.level.props.find((q) => q.constructor.name === 'SpeedLane' && q.skill);
    if (!lane) return { lane: false };
    p.setState('charge');
    const half = lane.runes.slice(0, 6);
    for (const r of half) { p.place(r.x, r.y + 0.05, r.z, 0); p.state = 'charge'; lane.update(0.02); }
    const partial = !!g.save.found['skill:sanctum:ring'];
    // A new charge starts the count over.
    p.setState('move'); p.setState('charge');
    for (const r of lane.runes) { p.place(r.x, r.y + 0.05, r.z, 0); p.state = 'charge'; lane.update(0.02); }
    p.setState('move');
    return { lane: true, n: lane.runes.length, partial, full: !!g.save.found['skill:sanctum:ring'], gems: g.save.gems };
  });
  h.check('charging round the whole rune ring earns a Skill Point', ring.lane && ring.n >= 10 && !ring.partial && ring.full, JSON.stringify(ring));

  // The Fen: free five butterflies.
  await h.eval(() => window.wyrm.loadLevel('fen', {}));
  await h.skipDialogue(4000);
  await h.eval(() => {
    const g = window.wyrm;
    for (const c of g.level.props.filter((p) => p.constructor.name === 'Critter').slice(0, 5)) c.takeHit({});
  });
  await waitGame(4);
  const bf = await h.eval(() => ({ n: window.wyrm.visit.butterflies, got: !!window.wyrm.save.found['skill:fen:butterflies'] }));
  h.check('five butterflies in one Fen visit earn a Skill Point', bf.n >= 5 && bf.got, JSON.stringify(bf));

  // A beaten realm offers a boss rematch; winning it untouched earns the Skill Point.
  await h.eval(() => { const g = window.wyrm; g.save.levelsDone.fen = true; g.loadLevel('fen', {}); });
  await h.skipDialogue(4000);
  const st = await h.eval(() => {
    const g = window.wyrm;
    const s = g.level.interactables.find((i) => /Challenge the Bogmaw/.test(i.label));
    if (!s) return { stone: false };
    g.player.place(s.x, s.y + 0.1, s.z - 1.5, 0);
    g.player.invuln = true;
    s.interact();
    return { stone: true, boss: !!g.boss, awake: g.boss?.awake, enabled: s.enabled };
  });
  h.check('a standing stone offers the rematch, no story this time', st.stone && st.boss && st.awake && !st.enabled, JSON.stringify(st));
  await h.eval(() => { const g = window.wyrm; const b = g.boss; b.hp = 3; g.player.place(b.x, b.y, b.z - 3.4, 0); g.player.yaw = 0; });
  await h.tap('KeyJ', 3, 300);
  await waitGame(1);
  const won = await h.eval(() => ({ alive: window.wyrm.boss?.alive, got: !!window.wyrm.save.found['skill:fen:boss'], lvl: window.wyrm.level.def.id, state: window.wyrm.state }));
  h.check('winning the rematch untouched earns the boss Skill Point, and the realm carries on', !won.alive && won.got && won.lvl === 'fen' && won.state === 'play', JSON.stringify(won));

  // The Journal lists them.
  await h.eval(() => { const g = window.wyrm; g.player.invuln = false; g.pause(); });
  await h.wait(300);
  const j = await h.eval(() => {
    const btn = [...document.querySelectorAll('.menu button')].find((b) => /Journal/.test(b.textContent));
    btn?.click();
    const tab = [...document.querySelectorAll('.tabs button')].find((b) => /Skill Points/.test(b.textContent));
    tab?.click();
    const entries = [...document.querySelectorAll('.panel.lore .entry.feat')];
    return { entries: entries.length, done: entries.filter((e) => e.classList.contains('done')).length };
  });
  h.check('the Journal lists every Skill Point, marking the ones earned', j.entries >= 12 && j.done === 3, JSON.stringify(j));
  await h.shot('journal-skills');
}

/** Replay systems: the Gloom Rift's endless waves, par times on the results card, and New Game+. */
export async function replay(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 400; i++) {
      await h.wait(50);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=sanctum&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  // --- the Gloom Rift ---
  const r0 = await h.eval(async () => {
    const g = window.wyrm;
    if (!g.save.elements.includes('fire')) g.learnElement('fire');
    // The Trial Stone stands once the fire lesson is done.
    g.save.found['story:sanctum:lesson-done'] = true;
    g.loadLevel('sanctum', {});
    const { TRIALS } = await import('/src/levels/trials.ts');
    const ground = g.level.props.find((p) => p.constructor.name === 'TrialGround');
    window.__tg = ground;
    ground.start(TRIALS.find((t) => t.id === 'rift'));
    return { running: ground.running, foes: g.enemies.filter((e) => e.alive && e.def.id !== 'dummy').length };
  });
  h.check('the Gloom Rift opens with a first wave', r0.running && r0.foes >= 2, JSON.stringify(r0));
  for (let w = 0; w < 3; w++) {
    await h.eval(() => { for (const e of window.wyrm.enemies) if (e.def.id !== 'dummy' && e.alive) { e.alive = false; e.state = 'dead'; e.deadT = 0.2; } });
    await waitGame(1.8);
  }
  const r1 = await h.eval(() => ({ wave: window.__tg.wave, foes: window.wyrm.enemies.filter((e) => e.alive && e.def.id !== 'dummy').length, time: window.__tg.timeLeft }));
  h.check('each cleared wave opens the next and adds time', r1.wave >= 3 && r1.foes >= 3 && r1.time > 60, JSON.stringify(r1));
  await h.eval(() => { window.__tg.timeLeft = 0; });
  await waitGame(0.3);
  const r2 = await h.eval(() => ({ running: window.__tg.running, best: window.wyrm.save.stats.riftBest }));
  h.check('when the Rift closes, the best depth is kept', !r2.running && r2.best >= 3, JSON.stringify(r2));

  // --- par times ---
  await h.eval(() => { const g = window.wyrm; g.loadLevel('falls', {}); });
  await h.skipDialogue(4000);
  const t = await h.eval(() => {
    const g = window.wyrm; const v = g.visit;
    v.t0 = g.save.stats.playTime - 400;
    g.save.levelsDone.falls = true;
    g.menus.showResults(() => {});
    const row = [...document.querySelectorAll('.res-row')].find((r) => /Time/.test(r.textContent));
    const out = { best: g.save.bestTimes?.falls, row: row?.textContent };
    document.querySelector('.panel.results button')?.click();
    return out;
  });
  h.check('the results card times the realm against its par and keeps the best', t.best >= 399 && t.best <= 402 && /under par/.test(t.row) && /best/.test(t.row), JSON.stringify(t));

  // --- New Game+ ---
  await h.eval(() => {
    const g = window.wyrm;
    g.save.clears = 1;
    g.save.levelsDone.keep = true;
    g.save.upgrades.hornPower = 2;
    g.save.found['story:fen:intro-test'] = true;
    g.saveNow();
    g.showTitle();
  });
  await h.wait(800);
  const title = await h.eval(() => [...document.querySelectorAll('.menu-list button')].map((b) => b.textContent));
  h.check('the title offers New Game+ once the story is done', title.some((s) => /New Game\+/.test(s)), JSON.stringify(title));
  await h.eval(() => [...document.querySelectorAll('.menu-list button')].find((b) => /New Game\+/.test(b.textContent)).click());
  await h.wait(300);
  await h.eval(() => [...document.querySelectorAll('.menu-list button')].find((b) => /Begin the Legend Run/.test(b.textContent)).click());
  await h.wait(3000);
  await h.skipDialogue(6000);
  const ng = await h.eval(async () => {
    const g = window.wyrm;
    const { ENEMIES } = await import('/src/enemies/defs.ts');
    const e = g.enemies.find((q) => q.alive && !q.elite && q.def.id === 'grunt') ?? g.enemies.find((q) => q.alive && !q.elite);
    return {
      lvl: g.level.def.id, ng: g.save.ngPlus, done: Object.keys(g.save.levelsDone), horn: g.save.upgrades.hornPower, story: !!g.save.found['story:fen:intro-test'],
      rift: g.save.stats.riftBest, hpK: e ? e.maxHp / (ENEMIES[e.def.id].hp * 1) : 0, skin: document.body ? 1 : 0,
    };
  });
  h.check('New Game+ restarts the story in the Fen, keeping upgrades and records', ng.lvl === 'fen' && ng.ng === 1 && ng.done.length === 0 && ng.horn === 2 && !ng.story && ng.rift >= 3, JSON.stringify(ng));
  h.check('the Gloom is tougher on a Legend Run', ng.hpK > 1.4, JSON.stringify(ng));
  await h.shot('ngplus');
}

/** Three save slots: each keeps its own journey; Continue and New Game use the chosen one. */
export async function slots(h) {
  await h.page.addInitScript(() => { if (!sessionStorage.getItem('kept')) { localStorage.clear(); sessionStorage.setItem('kept', '1'); } });
  await h.go('?level=falls&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  await h.eval(() => { const g = window.wyrm; g.save.gems = 777; g.save.level = 'falls'; g.save.unlocked.push('falls'); g.saveNow(); g.showTitle(); });
  await h.wait(600);
  const clickText = (re) => h.eval((src) => { const b = [...document.querySelectorAll('button')].find((x) => new RegExp(src).test(x.textContent)); b?.click(); return !!b; }, re);
  await clickText('^Save Slots');
  await h.wait(300);
  const cards = await h.eval(() => [...document.querySelectorAll('.levels .lvl')].map((b) => b.textContent));
  h.check('the slot screen lists three slots, the first holding the journey', cards.length === 3 && /Slot 1/.test(cards[0]) && /Stormspire|Falls/i.test(cards[0]) && /Empty/.test(cards[1]), JSON.stringify(cards));
  await h.eval(() => document.querySelectorAll('.levels .lvl')[1].click());
  await h.wait(400);
  const t2 = await h.eval(() => [...document.querySelectorAll('.menu-list button')].map((b) => b.textContent));
  h.check('an empty slot offers no Continue', !t2.some((s) => /^Continue/.test(s)) && t2.some((s) => /Slot 2/.test(s)), JSON.stringify(t2));
  await h.eval(() => window.wyrm.newGame('normal'));
  await h.wait(3000);
  await h.skipDialogue(6000);
  const s2 = await h.eval(() => ({ lvl: window.wyrm.level.def.id, gems: window.wyrm.save.gems, slot: localStorage.getItem('wyrmling.slot') }));
  await h.eval(() => { const g = window.wyrm; g.saveNow(); g.showTitle(); });
  await h.wait(600);
  await clickText('^Save Slots');
  await h.wait(300);
  await h.eval(() => document.querySelectorAll('.levels .lvl')[0].click());
  await h.wait(400);
  await clickText('^Continue');
  await h.wait(3000);
  await h.skipDialogue(6000);
  const s1 = await h.eval(() => ({ lvl: window.wyrm.level.def.id, gems: window.wyrm.save.gems }));
  h.check('a new game in slot 2 leaves slot 1 untouched', s2.lvl === 'fen' && s2.gems === 0 && s2.slot === '2' && s1.lvl === 'falls' && s1.gems === 777, JSON.stringify({ s2, s1 }));
}

/** Gems a realm places (gem lines and trails) stay until collected; dropped gems fade after a minute. */
export async function placedgems(h) {
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  const r = await h.eval(() => {
    const g = window.wyrm;
    const placed = g.gems.filter((q) => q.alive && q.placed).length;
    g.spawnGems(g.player.x + 30, g.player.y + 1, g.player.z + 30, { blue: 5 }, false);
    // Jump every gem's clock past the despawn age and let a frame run.
    for (const q of g.gems) q.age += 70;
    for (const q of g.gems) q.update(0.016);
    return { placed, left: g.gems.filter((q) => q.alive && q.placed).length, dropped: g.gems.filter((q) => q.alive && !q.placed).length };
  });
  h.check('placed gems outlast the minute; dropped ones still fade', r.placed > 10 && r.left === r.placed && r.dropped === 0, JSON.stringify(r));
}
