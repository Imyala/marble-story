/**
 * Side quests: every Act I realm has a giver standing on clear ground, whose
 * talk starts the quest; the quest's things turn up in the world.
 */

const GIVERS = { fen: 'wick', sanctum: 'quillon', falls: 'brisa', frostworks: 'maud', plains: 'tamsin', keep: 'brine' };
const QUESTS = { fen: 'fen-lanterns', sanctum: 'sanctum-overdue', falls: 'falls-race', frostworks: 'frost-hearths', plains: 'plains-goats', keep: 'keep-cake' };

/** Waits `sec` of game time. */
async function waitGame(h, sec) {
  const start = await h.eval(() => window.wyrm.time);
  for (let i = 0; i < 400; i++) {
    await h.wait(50);
    if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
  }
}

/** Walks Aster up to an NPC's talker and presses Use; skips the talk. */
export async function talkTo(h, label) {
  const ok = await h.eval((label) => {
    const g = window.wyrm;
    const t = g.level.interactables.find((i) => i.label === label);
    if (!t) return false;
    const a = Math.atan2(g.player.x - t.x, g.player.z - t.z);
    const x = t.x + Math.sin(a) * 2;
    const z = t.z + Math.cos(a) * 2;
    g.player.place(x, g.col.groundAt(x, z, t.y + 3, 0.2).y + 0.05, z, Math.atan2(t.x - x, t.z - z));
    g.cam.snapBehind(Math.atan2(t.x - x, t.z - z), 0.3);
    return true;
  }, label);
  if (!ok) return false;
  await waitGame(h, 0.3);
  await h.eval(() => window.wyrm.input.simulate('interact', true));
  await waitGame(h, 0.15);
  await h.eval(() => window.wyrm.input.simulate('interact', false));
  await waitGame(h, 0.4);
  return true;
}

/** Stands Aster on a quest item so she picks it up. */
async function pickUp(h, id) {
  const ok = await h.eval((id) => {
    const g = window.wyrm;
    const it = g.level.props.find((p) => p.constructor.name === 'QuestItem' && p.id === id && !p.taken && !p.gone);
    if (!it) return false;
    g.player.place(it.x, it.y + 0.05, it.z, 0);
    return true;
  }, id);
  await waitGame(h, 0.4);
  return ok;
}

/** The named elite the quests put out (it wears a nameplate). */
async function killNamed(h) {
  return h.eval(() => {
    const g = window.wyrm;
    const e = g.enemies.find((q) => q.alive && q.model.root.children.some((c) => c.isSprite));
    if (!e) return null;
    const at = [+e.x.toFixed(1), +e.z.toFixed(1)];
    g.player.place(e.x + 2, e.y + 0.05, e.z, 0);
    e.die(null);
    return at;
  });
}

/**
 * The Fen's quest from start to finish: find two flames, beat Snig, pick up
 * his, a reload in the middle, then Wick pays (once), the feat counts it,
 * and the Journal shows it done with its page.
 */
export async function fen(h) {
  await h.page.addInitScript(() => { if (!sessionStorage.getItem('kept')) { localStorage.clear(); sessionStorage.setItem('kept', '1'); } });
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  const Q = 'fen-lanterns';
  const glyph0 = await h.eval(() => window.wyrm.quests.markers('fen').filter((m) => m.kind === 'giver').map((m) => m.label));
  h.check('the map marks Old Wick as someone who needs help', glyph0.includes('Old Wick'), JSON.stringify(glyph0));
  await talkTo(h, 'Talk to Old Wick');
  await h.skipDialogue(8000);
  const s0 = await h.eval((q) => ({ step: window.wyrm.quests.step(q), items: window.wyrm.level.props.filter((p) => p.constructor.name === 'QuestItem' && !p.gone).map((p) => p.id) }), Q);
  h.check('starting the quest puts two lantern-flames out in the marsh', s0.step === 0 && s0.items.includes('jar-a') && s0.items.includes('jar-b'), JSON.stringify(s0));
  await waitGame(h, 0.4);
  const t0 = await h.eval(() => document.querySelector('.quest-tracker p')?.textContent);
  await pickUp(h, 'jar-a');
  await waitGame(h, 0.5);
  const t1 = await h.eval(() => document.querySelector('.quest-tracker p')?.textContent);
  h.check('the HUD tracker counts the first flame', /\(0\/2\)/.test(t0 ?? '') && /\(1\/2\)/.test(t1 ?? ''), `${t0} -> ${t1}`);
  await pickUp(h, 'jar-b');
  const s1 = await h.eval((q) => ({ step: window.wyrm.quests.step(q), snig: window.wyrm.enemies.some((e) => e.alive && e.elite && e.model.root.children.some((c) => c.isSprite)) }), Q);
  h.check('two flames found: Snig turns up, gold-lit and named', s1.step === 1 && s1.snig, JSON.stringify(s1));
  await h.eval(() => { const g = window.wyrm; const e = g.enemies.find((q) => q.alive && q.model.root.children.some((c) => c.isSprite)); g.player.place(e.x + 3.5, e.y + 0.05, e.z, -Math.PI / 2); g.cam.snapBehind(-Math.PI / 2, 0.3); });
  await waitGame(h, 0.8);
  await h.shot('quests-snig');
  const at = await killNamed(h);
  await waitGame(h, 0.3);
  const s2 = await h.eval((q) => { const g = window.wyrm; const it = g.level.props.find((p) => p.constructor.name === 'QuestItem' && p.id === 'jar-c' && !p.gone); return { step: g.quests.step(q), jar: it && [+it.x.toFixed(1), +it.z.toFixed(1)] }; }, Q);
  h.check('Snig falls and drops the last flame where he stood', s2.step === 2 && !!s2.jar && Math.hypot(s2.jar[0] - at[0], s2.jar[1] - at[1]) < 1, JSON.stringify({ at, s2 }));
  await pickUp(h, 'jar-c');
  const s3 = await h.eval((q) => ({ step: window.wyrm.quests.step(q), gems: window.wyrm.save.gems }), Q);
  h.check('the last flame found: back to Wick', s3.step === 3, JSON.stringify(s3));
  // A reload in the middle keeps where the quest is.
  await h.eval(() => window.wyrm.saveNow());
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  const r = await h.eval((q) => ({ step: window.wyrm.quests.step(q), items: window.wyrm.quests.state(q)?.items, snig: window.wyrm.enemies.some((e) => e.alive && e.model.root.children.some((c) => c.isSprite)), jars: window.wyrm.level.props.filter((p) => p.constructor.name === 'QuestItem' && !p.gone).length }), Q);
  h.check('the quest survives a save and reload (no flames or Snig come back)', r.step === 3 && r.items?.length === 3 && !r.snig && r.jars === 0, JSON.stringify(r));
  // Loose gems on Wick's boardwalk would muddle the count: pick-ups pay nothing here.
  await h.eval(() => { window.wyrm.collectGem = () => {}; });
  const gems0 = await h.eval(() => window.wyrm.save.gems);
  await talkTo(h, 'Talk to Old Wick');
  await h.skipDialogue(8000);
  await waitGame(h, 0.5);
  const done = await h.eval((q) => { const g = window.wyrm; return { done: g.quests.isDone(q), gems: g.save.gems, quests: g.save.stats.quests }; }, Q);
  h.check('Wick pays 80 gems for the flames', done.done && done.gems - gems0 === 80 && done.quests === 1, JSON.stringify({ gems0, done }));
  // Talking and reporting again pays nothing more.
  await h.eval(() => { const g = window.wyrm; g.quests.notify('talk', { id: 'wick' }); g.quests.start('fen-lanterns'); });
  await talkTo(h, 'Talk to Old Wick');
  await h.skipDialogue(8000);
  const again = await h.eval(() => window.wyrm.save.gems);
  h.check('a finished quest never pays twice', again === done.gems, `${done.gems} -> ${again}`);
  // The Journal's Quests tab.
  await h.eval(() => { const g = window.wyrm; g.pause(); });
  await h.wait(300);
  await h.eval(() => [...document.querySelectorAll('.menu button')].find((b) => /Journal/.test(b.textContent))?.click());
  await h.wait(300);
  await h.eval(() => [...document.querySelectorAll('.tabs button')].find((b) => /Quests/.test(b.textContent))?.click());
  await h.wait(300);
  const j = await h.eval(() => ({ main: document.querySelector('.entry.quest.main h4')?.textContent, done: [...document.querySelectorAll('.entry.quest.done h4')].map((e) => e.textContent), page: document.querySelector('.entry.quest.done .page b')?.textContent, hint: document.querySelector('.entry.missing h4')?.textContent }));
  h.check('the Journal lists the main quest, the finished quest and its page', /Main quest/.test(j.main ?? '') && j.done.some((t) => /Old Wick/.test(t)) && /Lamplighters/.test(j.page ?? ''), JSON.stringify(j));
  await h.shot('quests-journal');
  // A Legend Run starts the side quests over; the feat count stays.
  const ng = await h.eval(async () => {
    const { startNewGamePlus } = await import('/src/game/progress.ts');
    const s = JSON.parse(JSON.stringify(window.wyrm.save));
    startNewGamePlus(s);
    return { quests: s.quests ?? null, count: s.stats.quests };
  });
  h.check('New Game+ resets the side quests but keeps the count toward Helping Paw', ng.quests === null && ng.count === 1, JSON.stringify(ng));
}

/**
 * The other five quests, each played through by its own verbs: a delivery
 * round the Sanctum, the Falls race, the Frostworks braziers, the Plains
 * goats and the Keep's cake. Five finished quests earn Helping Paw.
 */
export async function realms(h) {
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=sanctum&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  // Gems lying about would muddle the payout counts: pick-ups pay nothing here.
  await h.eval(() => { window.wyrm.collectGem = () => {}; });
  const step = (q) => h.eval((q) => (window.wyrm.quests.isDone(q) ? 'done' : window.wyrm.quests.step(q)), q);
  const gems = () => h.eval(() => window.wyrm.save.gems);
  const talk = async (label) => { await talkTo(h, label); await h.skipDialogue(8000); await waitGame(h, 0.3); };

  // --- Sanctum: a delivery between two keepers, and a page on the wind.
  let g0 = await gems();
  await talk('Talk to Quillon');
  const a = [await step('sanctum-overdue')];
  await talk('Talk to Keeper Hesper');
  a.push(await step('sanctum-overdue'));
  await pickUp(h, 'roll-page');
  a.push(await step('sanctum-overdue'));
  await talk('Talk to Keeper Hesper');
  a.push(await step('sanctum-overdue'));
  await talk('Talk to Quillon');
  a.push(await step('sanctum-overdue'));
  h.check('Sanctum: Quillon to Hesper, the lost page, and the overdue book back', a.join() === '0,1,2,3,done' && (await gems()) - g0 === 70, JSON.stringify({ a, paid: (await gems()) - g0 }));

  // --- Falls: the Windstair Run, gate by gate.
  await h.eval(() => window.wyrm.loadLevel('falls', {}));
  await h.skipDialogue(8000);
  await talk('Talk to Old Brisa');
  g0 = await gems();
  const gates = await h.eval(() => {
    const g = window.wyrm;
    const c = g.level.props.find((p) => p.constructor.name === 'RaceCourse');
    return c ? c.gates.map((r) => [r.x, r.y, r.z, r.nx, r.nz]) : null;
  });
  h.check('Falls: taking the quest lays out the race gates', !!gates && gates.length >= 6, JSON.stringify(gates?.length));
  for (const [x, y, z, nx, nz] of gates ?? []) {
    for (const k of [-1.2, 1.2]) {
      await h.eval(([x, y, z]) => { const g = window.wyrm; g.player.place(x, g.col.groundAt(x, z, y + 1, 0.2).y + 0.05, z, 0); }, [x + nx * k, y, z + nz * k]);
      await waitGame(h, 0.12);
    }
  }
  await waitGame(h, 0.3);
  const race = await step('falls-race');
  await talk('Talk to Old Brisa');
  h.check('Falls: every gate inside the limit beats Brisa\'s record, and she pays up', race === 1 && (await step('falls-race')) === 'done' && (await gems()) - g0 === 100, JSON.stringify({ race, paid: (await gems()) - g0 }));

  // --- Frostworks: clear the camp, light four braziers.
  await h.eval(() => window.wyrm.loadLevel('frostworks', {}));
  await h.skipDialogue(8000);
  await talk('Talk to Maud');
  const f0 = await step('frost-hearths');
  await h.eval(() => { const g = window.wyrm; for (const e of g.enemies) if (e.alive && Math.hypot(e.homeX + 32.2, e.homeZ - 58.2) < 10) e.die(null); });
  await waitGame(h, 0.6);
  const f1 = await step('frost-hearths');
  await h.eval(() => { const g = window.wyrm; const ts = g.level.props.filter((p) => p.constructor.name === 'Torch' && p.group === 'quest-hearths'); window.__hearths = ts.length; for (const t of ts.slice(0, 2)) t.light(); });
  await waitGame(h, 0.3);
  const tr = await h.eval(() => document.querySelector('.quest-tracker p')?.textContent);
  await h.eval(() => { const g = window.wyrm; for (const t of g.level.props.filter((p) => p.constructor.name === 'Torch' && p.group === 'quest-hearths')) if (!t.lit) t.light(); });
  await waitGame(h, 0.3);
  const f2 = await step('frost-hearths');
  g0 = await gems();
  await talk('Talk to Maud');
  const f3 = await step('frost-hearths');
  const fpaid = (await gems()) - g0;
  h.check('Frostworks: the camp cleared, four braziers lit, Maud thanks you', f0 === 0 && f1 === 1 && /2\/4/.test(tr ?? '') && f2 === 2 && f3 === 'done' && fpaid === 90, JSON.stringify({ f0, f1, tr, f2, f3, fpaid }));
  await h.shot('quests-hearths');

  // --- Plains: lead the goats home.
  await h.eval(() => window.wyrm.loadLevel('plains', {}));
  await h.skipDialogue(8000);
  await talk('Talk to Tamsin');
  const goat = await h.eval(() => {
    const g = window.wyrm;
    const q = g.level.props.find((p) => p.constructor.name === 'QuestGoat' && p.name === 'Clover');
    window.__goat = q;
    g.player.place(q.x + 3, q.y + 0.05, q.z, 0);
    return [q.x, q.z, q.mode];
  });
  await waitGame(h, 0.5);
  const m1 = await h.eval(() => window.__goat.mode);
  await h.eval(() => { const g = window.wyrm; const q = window.__goat; g.player.place(q.x + 10, g.col.groundAt(q.x + 10, q.z, 1e4, 0.2).y + 0.05, q.z, 0); });
  await waitGame(h, 1.5);
  const g1 = await h.eval(() => [window.__goat.x, window.__goat.z, window.__goat.mode]);
  h.check('Plains: a goat follows once Aster comes near', m1 === 'follow' && Math.hypot(g1[0] - goat[0], g1[1] - goat[1]) > 3, JSON.stringify({ goat, m1, g1 }));
  await h.shot('quests-goat');
  // Bring each home (walked the last stretch by the pen).
  for (const name of ['Clover', 'Nettle', 'Duchess']) {
    await h.eval((name) => {
      const g = window.wyrm;
      const q = g.level.props.find((p) => p.constructor.name === 'QuestGoat' && p.name === name);
      q.mode = 'follow';
      q.x = 43; q.z = -12; q.y = g.col.groundAt(43, -12, 1e4, 0.2).y;
      g.player.place(43.5, g.col.groundAt(43.5, -5.5, 1e4, 0.2).y + 0.05, -5.5, 0);
    }, name);
    await waitGame(h, 1.6);
  }
  const p1 = await h.eval(() => ({ step: window.wyrm.quests.step('plains-goats'), home: window.wyrm.level.props.filter((p) => p.constructor.name === 'QuestGoat').map((q) => q.mode) }));
  g0 = await gems();
  await talk('Talk to Tamsin');
  h.check('Plains: three goats home, Tamsin pays', p1.step === 1 && p1.home.every((m) => m === 'home') && (await step('plains-goats')) === 'done' && (await gems()) - g0 === 110, JSON.stringify(p1));

  // --- Keep: Gristle, the cake, Nyxa's nest.
  await h.eval(() => window.wyrm.loadLevel('keep', {}));
  await h.skipDialogue(8000);
  await talk('Talk to Old Brine');
  const feat0 = await h.eval(() => !!window.wyrm.save.found['feat:helper']);
  await killNamed(h);
  await waitGame(h, 0.3);
  await pickUp(h, 'cake');
  const k1 = await step('keep-cake');
  g0 = await gems();
  await h.eval(() => { const g = window.wyrm; g.player.place(-27.6, g.col.groundAt(-27.6, -158.2, 20, 0.2).y + 0.05, -158.2, 0); });
  await waitGame(h, 0.6);
  await h.skipDialogue(8000);
  await waitGame(h, 0.4);
  const k2 = await h.eval(() => ({ done: window.wyrm.quests.isDone('keep-cake'), feat: !!window.wyrm.save.found['feat:helper'], quests: window.wyrm.save.stats.quests }));
  h.check('Keep: Gristle beaten, the cake left in Nyxa\'s nest', k1 === 2 && k2.done && (await gems()) - g0 === 150 + 150, JSON.stringify({ k1, k2 }));
  h.check('five side quests earn the Helping Paw feat', !feat0 && k2.feat && k2.quests === 5, JSON.stringify({ feat0, k2 }));
}

/**
 * The Windstair Run can really be run: a bot that only steers toward the next
 * gate and holds forward (no teleports) beats Brisa's time.
 */
export async function race(h) {
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=falls&seed=5&quality=low&maxdt=0.05', 2500);
  await h.skipDialogue(8000);
  await talkTo(h, 'Talk to Old Brisa');
  await h.skipDialogue(8000);
  // The slingers on the rock pillars would be dealt with first by most players.
  await h.eval(() => { const g = window.wyrm; g.player.invuln = true; for (const e of g.enemies) if (e.alive && e.def.id === 'slinger' && e.z < 50) e.die(null); });
  // Start a few paces before the first gate, on Brisa's bridge.
  await h.eval(() => { const g = window.wyrm; g.player.place(16.5, g.col.groundAt(16.5, -2.6, 1e4, 0.2).y + 0.05, -2.6, -Math.PI / 2); g.cam.snapBehind(-Math.PI / 2, 0.3); window.__course = g.level.props.find((p) => p.constructor.name === 'RaceCourse'); });
  await waitGame(h, 0.3);
  const trail = [];
  let result = null;
  // The way a player runs it: over the landing, then along each rope bridge.
  await h.eval(() => { window.__route = [[8.3, -2.5], [-2.5, 10.6], [-2, 11.5], [1.5, 18], [5, 24.5], [4.8, 27.1], [4.5, 29.5], [0.5, 34], [-3.5, 38.5], [-4.1, 41.4], [-4.5, 44.5], [-0.7, 50.3], [0.2, 52]]; window.__wp = 0; });
  for (let i = 0; i < 600; i++) {
    const s = await h.eval(() => {
      const g = window.wyrm;
      const c = window.__course;
      const b = g.player.body;
      const R = window.__route;
      while (window.__wp < R.length - 1 && Math.hypot(R[window.__wp][0] - b.x, R[window.__wp][1] - b.z) < 1.3) window.__wp++;
      const [tx, tz] = R[window.__wp];
      const yaw = Math.atan2(tx - b.x, tz - b.z);
      g.cam.yaw = yaw;
      g.input.forceMove = { x: 0, y: 1 };
      return { next: c.next, t: +c.t.toFixed(2), x: +b.x.toFixed(1), z: +b.z.toFixed(1), y: +b.y.toFixed(1), step: g.quests.step('falls-race'), done: g.quests.isDone('falls-race') };
    });
    if (i % 10 === 0) trail.push(s);
    if (s.step === 1) { result = s; break; }
    if (s.y < -5) { result = { fell: true, ...s }; break; }
    await h.wait(30);
  }
  await h.eval(() => { window.wyrm.input.forceMove = null; });
  h.check('running the gates for real beats Brisa\'s record', result?.step === 1, JSON.stringify({ result, trail: trail.slice(-6) }));
  await h.shot('quests-race-done');
}

/** Screenshots of the quest things in the world, for looking at (W=960 H=540 reads well). */
export async function look(h) {
  await h.page.addInitScript(() => localStorage.clear());
  /** A still of (x, z) from `back` metres off along `yaw`, `up` metres high; Aster stands aside. */
  const view = async (name, x, z, yaw, back = 5, up = 2.2) => {
    await h.eval(([x, z, yaw, back, up]) => {
      const g = window.wyrm;
      const gy = g.col.groundAt(x, z, 1e4, 0.2).y;
      const cx = x - Math.sin(yaw) * back;
      const cz = z - Math.cos(yaw) * back;
      // Aster waits to one side of the camera, on dry ground (or else by the subject).
      let px = cx + Math.cos(yaw) * 2.5;
      let pz = cz - Math.sin(yaw) * 2.5;
      let py = g.col.groundAt(px, pz, 1e4, 0.2).y;
      if (py < -1e3 || g.isDeepWater(px, pz, py)) [px, py, pz] = [x + Math.cos(yaw) * 1.8, gy, z - Math.sin(yaw) * 1.8];
      g.player.invuln = true;
      g.player.place(px, py + 0.05, pz, yaw);
      const v = g.camera.position.clone();
      g.cam.setShot(v.clone().set(cx, gy + up, cz), v.clone().set(x, gy + 1.2, z));
      g.hud.clearFlick();
      g.hud.show(false);
    }, [x, z, yaw, back, up]);
    await waitGame(h, 1.6);
    await h.shot(name);
    await h.eval(() => { const g = window.wyrm; g.cam.clearShot(); g.hud.show(true); });
  };
  // Where a giver stands, and the way Aster comes at them (from the realm's start).
  const at = (label) => h.eval((label) => { const g = window.wyrm; const t = g.level.interactables.find((i) => i.label === label); const [sx, sz] = g.level.def.spawn; return [t.x, t.z, Math.atan2(t.x - sx, t.z - sz)]; }, label);
  await h.go('?level=fen&seed=5&quality=high&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  let [x, z, yaw] = await at('Talk to Old Wick');
  await view('quests-look-wick', x, z, yaw, 4, 2.2);
  await h.eval(() => window.wyrm.quests.start('fen-lanterns'));
  await h.skipDialogue(3000);
  await view('quests-look-flame', 7.4, 57.4, 2.2, 4, 1.8);
  for (const [lvl, label] of [['sanctum', 'Talk to Quillon'], ['sanctum', 'Talk to Keeper Hesper'], ['falls', 'Talk to Old Brisa'], ['frostworks', 'Talk to Maud'], ['plains', 'Talk to Tamsin'], ['keep', 'Talk to Old Brine']]) {
    await h.eval((l) => { const g = window.wyrm; if (g.level.def.id !== l) g.loadLevel(l, {}); }, lvl);
    await h.skipDialogue(8000);
    [x, z, yaw] = await at(label);
    await view(`quests-look-${label.split(' ').pop().toLowerCase()}`, x, z, yaw, 5.5, 2.6);
  }
  await h.eval(() => window.wyrm.loadLevel('plains', {}));
  await h.skipDialogue(8000);
  await h.eval(() => window.wyrm.quests.start('plains-goats'));
  await h.skipDialogue(3000);
  await view('quests-look-goat', -40, 66, -2.4, 5, 1.8);
  await h.eval(() => window.wyrm.loadLevel('frostworks', {}));
  await h.skipDialogue(8000);
  await h.eval(() => { const g = window.wyrm; g.quests.start('frost-hearths'); for (const e of g.enemies) if (e.alive && Math.hypot(e.homeX + 32.2, e.homeZ - 58.2) < 14) { e.alive = false; e.state = 'dead'; e.deadT = 1; } for (const t of g.level.props.filter((p) => p.constructor.name === 'Torch' && p.group === 'quest-hearths').slice(0, 2)) t.light(); });
  await h.skipDialogue(3000);
  await view('quests-look-camp', -33, 58, -2.0, 11, 6);
}

export default async function (h) {
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  for (const lvl of Object.keys(GIVERS)) {
    if (lvl !== 'fen') {
      await h.eval((l) => window.wyrm.loadLevel(l, {}), lvl);
      await h.skipDialogue(6000);
    }
    await waitGame(h, 0.3);
    const info = await h.eval((id) => {
      const g = window.wyrm;
      const t = g.level.interactables.find((i) => /^Talk to /.test(i.label) && (i.label.toLowerCase().includes(id) || i.label.includes('Old ' + id[0].toUpperCase() + id.slice(1))));
      const all = g.level.interactables.filter((i) => /^Talk to /.test(i.label)).map((i) => [i.label, +i.x.toFixed(1), +i.y.toFixed(1), +i.z.toFixed(1)]);
      // A dragon's talker sits on top of its own collider; measure the dragon itself.
      const npc = g.level.npcs.find((n) => n.id === id);
      const who = npc ?? t;
      const lift = who ? +(who.y - g.col.terrainAt(who.x, who.z)).toFixed(2) : null;
      return { found: !!t, label: t?.label, all, lift, water: g.waterLevel };
    }, GIVERS[lvl]);
    h.check(`${lvl}: the quest giver stands in the realm, on the ground`, info.found && info.lift < 0.9, JSON.stringify(info));
    if (!info.found) continue;
    await talkTo(h, info.label);
    await h.shot(`quests-giver-${lvl}`);
    await h.skipDialogue(8000);
    await waitGame(h, 0.3);
    const st = await h.eval((q) => {
      const g = window.wyrm;
      return { started: g.quests.isStarted(q), step: g.quests.step(q), tracker: document.querySelector('.quest-tracker')?.textContent, marks: g.quests.markers(g.level.def.id).map((m) => [m.kind, m.label, Math.round(m.x), Math.round(m.z)]) };
    }, QUESTS[lvl]);
    h.check(`${lvl}: talking starts the quest and the tracker follows it`, st.started && st.step === 0, JSON.stringify(st));
    await waitGame(h, 0.6);
    await h.shot(`quests-started-${lvl}`);
  }
}
