// Graveljaw: spawns, hunts, erupts, arches, takes damage, is shaken loose by a
// Ground Pound, freezes and shatters, spits boulders, changes phase, sweeps its
// tail, rains rocks, dies; then the rescue plays and the game travels home.
export default async function (h) {
  await h.go('?level=plains&seed=2&quality=low&maxdt=0.25', 3000);
  await h.skipDialogue();
  await h.eval(() => {
    const g = window.wyrm;
    for (const e of ['fire', 'lightning', 'ice']) if (!g.save.elements.includes(e)) g.learnElement(e);
    for (const e of g.enemies) { e.alive = false; e.dispose(); }
    g.enemies = [];
    g.renderer.gl.setPixelRatio(0.6);
    g.level.emit('canyon-door');
    // Log every mode change of the boss with the world time.
    window.__modes = [];
    let last = '';
    const tick = () => {
      const b = g.boss;
      const m = b ? `${b.mode}` : '';
      if (b && m !== last) { window.__modes.push(`${g.time.toFixed(1)}:${m}:p${b.phase}`); last = m; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const key = (code, type) => h.eval(([code, type]) => window.dispatchEvent(new KeyboardEvent(type, { code })), [code, type]);
  const boss = () => h.eval(() => {
    const g = window.wyrm;
    const b = g.boss;
    if (!b) return null;
    return { mode: b.mode, hp: Math.round(b.hp), max: Math.round(b.maxHp), phase: b.phase, alive: b.alive, awake: b.awake, x: +b.x.toFixed(1), z: +b.z.toFixed(1), hy: +b.hy.toFixed(1), php: Math.round(g.player.hp), pounds: b.pounds, frozen: +b.status.frozen.toFixed(1) };
  });
  const waitMode = async (modes, maxMs = 20000, heal = true) => {
    // maxMs of game time (headless frame rates vary), with a generous wall-clock cap.
    const t0 = Date.now();
    const g0 = await h.eval(() => window.wyrm.time);
    while (Date.now() - t0 < maxMs * 6 && (await h.eval(() => window.wyrm.time)) - g0 < maxMs / 1000) {
      const b = await boss();
      if (b && modes.includes(b.mode)) return b;
      if (heal) await h.eval(() => { const p = window.wyrm.player; p.hp = Math.max(p.hp, 60); });
      await h.wait(120);
    }
    return boss();
  };
  /** A screenshot from the canyon rim, looking at the worm's head. */
  const wide = async (name) => {
    await h.eval(() => {
      const g = window.wyrm;
      const b = g.boss;
      const THREE = g.camera.position.constructor;
      const hx = b ? b.hx : 0;
      const hz = b ? b.hz : 256;
      const px = g.player.x;
      const pz = g.player.z;
      const mx = (hx + px) / 2;
      const mz = (hz + pz) / 2;
      let dx = mx - 0;
      let dz = mz - 256;
      const n = Math.hypot(dx, dz) || 1;
      dx /= n; dz /= n;
      // Stand off to the side of the line between the two.
      const sx = -(pz - hz);
      const sz = px - hx;
      const sn = Math.hypot(sx, sz) || 1;
      g.cam.setShot(new THREE(mx + (sx / sn) * 15 + dx * 2, 9, mz + (sz / sn) * 15 + dz * 2), new THREE(mx, 1.5, mz));
    });
    await h.wait(1300);
    await h.shot(name);
    await h.eval(() => window.wyrm.cam.clearShot());
  };
  const place = (x, z, yaw = 0) => h.eval(([x, z, yaw]) => {
    const g = window.wyrm;
    const y = g.col.groundAt(x, z, 1e4, 0.2).y;
    g.player.place(x, y + 0.05, z, yaw);
    g.player.setState('move');
    g.player.yaw = yaw;
    g.cam.snapBehind(yaw, 0.35);
  }, [x, z, yaw]);

  // --- Intro -----------------------------------------------------------------------------
  await place(0, 243.5, 0);
  await h.wait(2500);
  await h.shot('gj-intro');
  let b = await boss();
  h.check('graveljaw spawns and the intro plays', !!b && (await h.eval(() => window.wyrm.state)) === 'dialogue', JSON.stringify(b));
  await h.skipDialogue(8000);
  await h.wait(600);
  b = await boss();
  h.check('graveljaw is awake after the intro', !!b && b.awake, JSON.stringify(b));
  const barrier = await h.eval(() => window.wyrm.level.props.some((p) => p.constructor.name === 'Barrier' && p.on));
  h.check('arena barrier is up', barrier);

  // --- Hunt, mark, erupt, arch, exposed -------------------------------------------------------
  await place(0, 244, 0);
  b = await waitMode(['hunt', 'mark']);
  h.check('it burrows and hunts', b?.mode === 'hunt' || b?.mode === 'mark', JSON.stringify(b));
  await h.wait(500);
  const trail0 = await h.eval(() => ({ x: window.wyrm.boss.x, z: window.wyrm.boss.z }));
  await h.wait(900);
  const trail1 = await h.eval(() => ({ x: window.wyrm.boss.x, z: window.wyrm.boss.z, p: { x: window.wyrm.player.x, z: window.wyrm.player.z } }));
  const d0 = Math.hypot(trail0.x - trail1.p.x, trail0.z - trail1.p.z);
  const d1 = Math.hypot(trail1.x - trail1.p.x, trail1.z - trail1.p.z);
  h.check('the dust trail homes toward the dragon', d1 < d0 || d1 < 1.5, `${d0.toFixed(1)} -> ${d1.toFixed(1)}`);
  await wide('gj-hunt');
  b = await waitMode(['mark']);
  const hpBefore = await h.eval(() => { const p = window.wyrm.player; p.hp = 100; return p.hp; });
  await wide('gj-mark');
  b = await waitMode(['erupt', 'arch'], 8000, false);
  await h.wait(200);
  await wide('gj-erupt');
  const hpAfter = await h.eval(() => window.wyrm.player.hp);
  h.check('standing still on the mark gets you hit by the eruption', hpAfter < hpBefore, `${hpBefore} -> ${hpAfter}`);
  b = await waitMode(['exposed']);
  h.check('it arches over and lies exposed', b?.mode === 'exposed', JSON.stringify(b));
  await wide('gj-exposed');
  b = await waitMode(['exposed']);
  // Hit it while it is dazed.
  const hx = await h.eval(() => { const g = window.wyrm; const b = g.boss; g.player.hp = 100; const yaw = b.yaw + Math.PI; g.player.place(b.x + Math.sin(b.yaw) * 3.3, b.y + 0.05, b.z + Math.cos(b.yaw) * 3.3, yaw); g.player.yaw = yaw; g.cam.snapBehind(yaw); return b.hp; });
  await h.tap('KeyJ', 3, 260);
  await h.tap('KeyE', 2, 400);
  const hy = await h.eval(() => window.wyrm.boss.hp);
  h.check('it takes damage while exposed', hy < hx, `${Math.round(hx)} -> ${Math.round(hy)}`);
  await h.shot('gj-hit');
  // Not while buried.
  b = await waitMode(['hunt', 'travel']);
  const hb0 = await h.eval(() => window.wyrm.boss.hp);
  await h.eval(() => { const g = window.wyrm; const b = g.boss; g.player.place(b.x, g.col.groundAt(b.x, b.z - 2, 50, 0.2).y + 0.05, b.z - 2, 0); g.player.yaw = 0; });
  await h.tap('KeyJ', 2, 250);
  const hb1 = await h.eval(() => window.wyrm.boss.hp);
  h.check('buried, it cannot be hurt', hb1 === hb0, `${hb0} -> ${hb1}`);

  // --- Ground Pound beside the trail -----------------------------------------------------------
  // Per frame in the page: as soon as it digs, stand beside the trail, jump and pound.
  await h.eval(() => {
    const g = window.wyrm;
    const key = (code, type) => window.dispatchEvent(new KeyboardEvent(type, { code }));
    window.__pound = 'waiting';
    let t0 = 0;
    const tick = () => {
      const b = g.boss;
      if (!b || window.__pound === 'done') return;
      if (window.__pound === 'waiting' && (b.mode === 'hunt' || b.mode === 'mark')) {
        const x = b.tx + 2.2;
        g.player.place(x, g.col.groundAt(x, b.tz, 50, 0.2).y + 0.05, b.tz, 0);
        g.player.setState('move');
        key('Space', 'keydown');
        window.__pound = 'jump';
        t0 = g.time;
      } else if (window.__pound === 'jump' && g.time - t0 > 0.12 && !g.player.body.grounded) {
        key('Space', 'keyup');
        key('KeyE', 'keydown');
        window.__pound = 'slam';
      } else if (window.__pound === 'slam') {
        key('KeyE', 'keyup');
        window.__pound = 'landing';
      } else if (window.__pound === 'landing' && g.time - t0 > 1.2) {
        window.__pound = 'done';
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  for (let i = 0; i < 150; i++) {
    await h.wait(200);
    if (await h.eval(() => window.__pound === 'done')) break;
  }
  b = await boss();
  h.check('a Ground Pound beside the trail shakes it loose', (b?.pounds ?? 0) > 0 && ['pop', 'exposed'].includes(b.mode), JSON.stringify(b));
  if (!((b?.pounds ?? 0) > 0 && ['pop', 'exposed'].includes(b.mode))) console.log('modes', JSON.stringify(await h.eval(() => window.__modes.slice(-12))), await h.eval(() => window.__pound));
  await h.shot('gj-pound');
  // Freeze it and shatter its plates.
  b = await waitMode(['exposed'], 4000);
  if (b?.mode === 'exposed') {
    await h.eval(() => { const g = window.wyrm; const b = g.boss; g.player.hp = 100; b.status.frozen = 3; b.status.chill = 0; const yaw = b.yaw + Math.PI; g.player.place(b.x + Math.sin(b.yaw) * 3.2, b.y + 0.05, b.z + Math.cos(b.yaw) * 3.2, yaw); g.player.yaw = yaw; });
    const r0 = await h.eval(() => window.wyrm.save.stats.reactions);
    const s0 = await h.eval(() => window.wyrm.boss.hp);
    await h.tap('KeyE', 1, 1500);
    const [r1, s1] = await h.eval(() => [window.wyrm.save.stats.reactions, window.wyrm.boss.hp]);
    h.check('a frozen Graveljaw shatters for bonus damage', r1 > r0 && s0 - s1 > 60, `reactions ${r0}->${r1} hp ${Math.round(s0)}->${Math.round(s1)}`);
    await h.shot('gj-shatter');
  }
  // Ice breath really freezes it: breathe on it through its next exposed windows.
  let fz = 0;
  for (let w = 0; w < 3 && fz <= 0; w++) {
    b = await waitMode(['exposed'], 40000);
    if (b?.mode !== 'exposed') break;
    await h.eval(() => { const g = window.wyrm; const b = g.boss; g.player.hp = 100; g.player.mana = 100; const yaw = b.yaw + Math.PI; g.player.place(b.x + Math.sin(b.yaw) * 4.5, b.y + 0.05, b.z + Math.cos(b.yaw) * 4.5, yaw); g.player.yaw = yaw; });
    await h.tap('Digit3');
    await key('KeyK', 'keydown');
    for (let i = 0; i < 40 && fz <= 0; i++) {
      await h.wait(150);
      fz = await h.eval(() => { const g = window.wyrm; g.player.mana = 100; return g.boss.mode === 'exposed' ? g.boss.status.frozen : -1; });
      if (fz < 0) { fz = 0; break; }
    }
    await key('KeyK', 'keyup');
  }
  h.check('ice breath freezes it while exposed', fz > 0, `frozen ${fz}`);
  await wide('gj-frozen');

  // --- Boulder volley ----------------------------------------------------------------------------
  b = await waitMode(['spit'], 90000);
  h.check('it rears up to spit boulders', b?.mode === 'spit', JSON.stringify(b));
  let boulders = 0;
  for (let i = 0; i < 25 && boulders === 0; i++) {
    await h.wait(120);
    boulders = await h.eval(() => window.wyrm.projectiles.filter((p) => p.alive && p.spec.kind === 'boulder').length);
  }
  await h.shot('gj-spit-near');
  await wide('gj-spit');
  h.check('boulders fly', boulders > 0, `${boulders}`);

  // --- Phase 2: double eruptions ---------------------------------------------------------------------
  await h.eval(() => { const b = window.wyrm.boss; b.hp = b.maxHp * 0.6; });
  await h.wait(800);
  b = await boss();
  h.check('phase 2 at 60%', b?.phase === 2, JSON.stringify(b));
  await h.skipDialogue();
  const seen2 = await h.eval(() => window.__modes.length);
  for (let i = 0; i < 200; i++) {
    const log = await h.eval((n) => window.__modes.slice(n).join(' '), seen2);
    if (/erupt:p2 [\d.]+:dive:p2 [\d.]+:(hunt:p2 [\d.]+:)?mark:p2 [\d.]+:erupt:p2/.test(log)) break;
    await h.eval(() => { const p = window.wyrm.player; p.hp = 100; });
    await h.wait(400);
  }
  const log2 = await h.eval((n) => window.__modes.slice(n).join(' '), seen2);
  h.check('phase 2 erupts twice in a row', /erupt:p2 [\d.]+:dive:p2 [\d.]+:(hunt:p2 [\d.]+:)?mark:p2 [\d.]+:erupt:p2/.test(log2), log2);

  // --- Phase 3: tail sweep and rock rain ---------------------------------------------------------------
  await h.eval(() => { const b = window.wyrm.boss; b.hp = b.maxHp * 0.3; });
  b = await waitMode(['sweepTele', 'sweep'], 40000);
  h.check('phase 3 sweeps its tail', b?.phase === 3 && (b.mode === 'sweep' || b.mode === 'sweepTele'), JSON.stringify(b));
  await h.wait(1200);
  await wide('gj-sweep');
  // Stand in the sweep's path on the ground: it should connect.
  b = await waitMode(['sweep'], 8000);
  await h.eval(() => {
    const g = window.wyrm;
    const b = g.boss;
    const a = b.sweepA + b.sweepDir * 1.0;
    g.player.hp = 100;
    g.player.iframes = 0;
    g.player.place(b.cx + Math.sin(a) * 10, -0.95, b.cz + Math.cos(a) * 10, 0);
  });
  let swept = false;
  for (let i = 0; i < 20 && !swept; i++) {
    await h.wait(200);
    swept = await h.eval(() => window.wyrm.player.hp < 100);
  }
  h.check('the sweep hits a dragon that does not jump', swept);
  const rains = await h.eval(() => window.wyrm.boss.rains);
  h.check('rocks rain in phase 3', rains > 0, `${rains}`);
  await skipTo(h, boss, ['exposed']);

  // --- Death and rescue ------------------------------------------------------------------------------------
  const log3 = await h.eval(() => window.__modes.join(' '));
  console.log('mode log:', log3);
  await h.eval(() => { const g = window.wyrm; g.boss.hp = 5; g.player.invuln = true; });
  for (let i = 0; i < 12; i++) {
    const alive = await h.eval(() => window.wyrm.boss.alive);
    if (!alive) break;
    await skipTo(h, boss, ['exposed']);
    await h.eval(() => { const g = window.wyrm; const b = g.boss; const yaw = b.yaw + Math.PI; g.player.place(b.x + Math.sin(b.yaw) * 3.3, b.y + 0.05, b.z + Math.cos(b.yaw) * 3.3, yaw); g.player.yaw = yaw; });
    await h.tap('KeyJ', 3, 300);
    await h.wait(600);
  }
  b = await boss();
  h.check('graveljaw dies', !!b && !b.alive, JSON.stringify(b));
  await wide('gj-death');
  await h.wait(3500);
  const st = await h.state();
  h.check('the rescue conversation starts', st.state === 'dialogue', JSON.stringify(st));
  await h.wait(1500);
  await h.shot('gj-rescue');
  await h.skipDialogue(12000);
  await h.wait(3500);
  const end = await h.eval(() => ({ level: window.wyrm.level.def.id, earth: window.wyrm.save.elements.includes('earth'), done: !!window.wyrm.save.levelsDone.plains, keep: window.wyrm.save.unlocked.includes('keep') }));
  h.check('learned earth, unlocked the keep, went home to the sanctum', end.level === 'sanctum' && end.earth && end.done && end.keep, JSON.stringify(end));
  await h.skipDialogue(6000);
  await h.wait(1000);
  await h.shot('gj-home');
}

async function skipTo(h, boss, modes) {
  for (let i = 0; i < 80; i++) {
    const b = await boss();
    if (!b || modes.includes(b.mode)) return;
    await h.eval(() => { const p = window.wyrm.player; p.hp = 100; });
    await h.wait(250);
  }
}
