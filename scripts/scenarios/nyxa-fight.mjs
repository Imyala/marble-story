// Nyxa in a fight: she damages foes through their own takeHit, leaves Aster's combo
// and style meter alone, her kills still pay gems and count toward Better Together,
// and she fights a boss (Forgemaster Grolm) too.

import { waitGame, withNyxa } from './nyxa-lib.mjs';

export default async function (h) {
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=plains&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  await withNyxa(h, 'plains');

  // Three grunts rush Aster, who stands still: only Nyxa fights.
  const before = await h.eval(() => {
    const g = window.wyrm;
    for (const e of g.enemies) { e.alive = false; e.state = 'dead'; e.deadT = 9; }
    const y = g.col.groundAt(0, 40, 1e4, 0.2).y;
    g.player.place(0, y + 0.05, 40, 0);
    g.cam.snapBehind(0, 0.3);
    g.partner.placeAt(2.6, g.col.groundAt(2.6, 39, 1e4, 0.2).y + 0.05, 39, 0);
    window.__foes = [];
    for (const [x, z] of [[-3, 47], [0, 48], [3, 47]]) {
      const e = g.spawnEnemy('grunt', x, g.col.groundAt(x, z, 1e4, 0.2).y + 0.05, z, Math.PI, false);
      e.aggro = true;
      window.__foes.push(e);
    }
    // Every hit that lands on them, by move.
    window.__moves = {};
    for (const e of window.__foes) {
      const orig = e.takeHit.bind(e);
      e.takeHit = (hit) => { const r = orig(hit); if (r === 'hit' || r === 'killed') window.__moves[hit.move] = (window.__moves[hit.move] ?? 0) + 1; return r; };
    }
    return { kills: g.save.stats.kills, gems: g.save.gems, pk: g.save.stats.partnerKills ?? 0, points: g.style.points, combo: g.style.combo };
  });
  let shot = false;
  let hp = [];
  for (let i = 0; i < 60; i++) {
    await waitGame(h, 0.5);
    const r = await h.eval(() => ({ alive: window.__foes.filter((e) => e.alive).length, dealt: window.wyrm.partner.dealt, hp: window.__foes.map((e) => Math.round(e.hp)) }));
    hp = r.hp;
    if (!shot && r.dealt > 10) {
      shot = true;
      await h.shot('nyxa-fight');
    }
    if (r.alive === 0) break;
  }
  await waitGame(h, 2);
  const after = await h.eval(() => {
    const g = window.wyrm;
    return {
      kills: g.save.stats.kills, gems: g.save.gems, pk: g.save.stats.partnerKills ?? 0, points: g.style.points, combo: g.style.combo, best: g.style.bestCombo,
      dealt: Math.round(g.partner.dealt), alive: window.__foes.filter((e) => e.alive).length, moves: window.__moves, t: g.time,
    };
  });
  console.log('fight', JSON.stringify(after), 'hp', JSON.stringify(hp));
  const nyxaMoves = Object.keys(after.moves).filter((m) => m.startsWith('nyxa:'));
  h.check('Nyxa fights the grunts through their own hits (claws, scythe, bolt...)', after.dealt > 60 && nyxaMoves.length >= 2 && Object.keys(after.moves).every((m) => m.startsWith('nyxa:')), JSON.stringify(after.moves));
  h.check('she defeats them, and the kills pay gems', after.alive === 0 && after.kills - before.kills === 3 && after.gems > before.gems, JSON.stringify({ before, after }));
  h.check('her hits leave Aster\'s combo and style meter alone', after.points === 0 && after.combo === 0 && after.best === 0, JSON.stringify(after));
  h.check('Better Together counts foes she helped defeat', after.pk - before.pk === 3, JSON.stringify({ before: before.pk, after: after.pk }));

  // Aster and Nyxa together: her share of the damage stays well under his.
  const share = await h.eval(() => {
    const g = window.wyrm;
    const y = g.col.groundAt(0, 40, 1e4, 0.2).y;
    g.player.place(0, y + 0.05, 40, 0);
    const e = g.spawnEnemy('brute', 0, g.col.groundAt(0, 43.2, 1e4, 0.2).y + 0.05, 43.2, Math.PI, false);
    e.aggro = true;
    e.hp = e.maxHp = 5000;
    window.__big = e;
    window.__byAster = 0;
    window.__byNyxa = 0;
    const orig = e.takeHit.bind(e);
    e.takeHit = (hit) => { const hp0 = e.hp; const r = orig(hit); const d = hp0 - e.hp; if (hit.move.startsWith('nyxa:')) window.__byNyxa += d; else window.__byAster += d; return r; };
    return true;
  });
  void share;
  // Aster keeps up a Horn combo on it for a while.
  for (let i = 0; i < 24; i++) {
    await h.eval(() => {
      const g = window.wyrm;
      const e = window.__big;
      const p = g.player;
      if (Math.hypot(e.x - p.x, e.z - p.z) > 3) p.place(e.x, e.y + 0.05, e.z - 2.6, 0);
      p.yaw = Math.atan2(e.x - p.x, e.z - p.z);
      g.input.simulate('horn', true);
    });
    await waitGame(h, 0.06);
    await h.eval(() => window.wyrm.input.simulate('horn', false));
    await waitGame(h, 0.3);
  }
  const split = await h.eval(() => ({ aster: Math.round(window.__byAster), nyxa: Math.round(window.__byNyxa) }));
  const k = split.nyxa / Math.max(1, split.aster);
  console.log('damage split', JSON.stringify(split), 'nyxa/aster', k.toFixed(2));
  h.check('her damage helps without carrying (roughly a third of Aster\'s)', split.nyxa > 0 && k > 0.12 && k < 0.6, JSON.stringify(split));
  await h.eval(() => { const e = window.__big; e.alive = false; e.state = 'dead'; e.deadT = 9; });

  // Better Together pays out at fifty.
  await h.eval(() => {
    const g = window.wyrm;
    g.save.stats.partnerKills = 49;
    const y = g.col.groundAt(0, 40, 1e4, 0.2).y;
    g.player.place(0, y + 0.05, 40, 0);
    const e = g.spawnEnemy('grunt', 1, g.col.groundAt(1, 45, 1e4, 0.2).y + 0.05, 45, Math.PI, false);
    e.aggro = true;
    e.hp = 10;
    window.__last = e;
  });
  for (let i = 0; i < 30; i++) {
    await waitGame(h, 0.4);
    if (!(await h.eval(() => window.__last.alive))) break;
  }
  const feat = await h.eval(() => ({ got: !!window.wyrm.save.found['feat:together'], pk: window.wyrm.save.stats.partnerKills }));
  h.check('the Better Together feat is earned at 50 foes', feat.got && feat.pk >= 50, JSON.stringify(feat));

  // A boss: Forgemaster Grolm in the Frostworks.
  await withNyxa(h, 'frostworks');
  await h.eval(() => {
    const g = window.wyrm;
    for (const e of ['fire', 'lightning']) if (!g.save.elements.includes(e)) g.learnElement(e);
    const y = g.col.groundAt(0, 231, 1e4, 0.2).y;
    g.player.place(0, y + 0.05, 231, 0);
    g.cam.snapBehind(0, 0.3);
    g.input.forceMove = { x: 0, y: 1 };
  });
  await waitGame(h, 0.8);
  await h.eval(() => { window.wyrm.input.forceMove = null; });
  await waitGame(h, 0.6);
  await h.skipDialogue(6000);
  const b0 = await h.eval(() => {
    const g = window.wyrm;
    const b = g.boss;
    if (!b) return null;
    window.__bossBy = 0;
    const orig = b.takeHit.bind(b);
    b.takeHit = (hit) => { const hp0 = b.hp; const r = orig(hit); if (hit.move.startsWith('nyxa:')) window.__bossBy += hp0 - b.hp; return r; };
    return { hp: b.hp, awake: b.awake };
  });
  h.check('Grolm wakes for the fight', !!b0 && b0.awake, JSON.stringify(b0));
  let bshot = false;
  for (let i = 0; i < 40; i++) {
    await waitGame(h, 0.5);
    const r = await h.eval(() => ({ by: window.__bossBy, php: window.wyrm.player.hp }));
    if (!bshot && r.by > 20) {
      bshot = true;
      await h.shot('nyxa-boss');
    }
    await h.eval(() => { const p = window.wyrm.player; p.hp = p.maxHp; });
    if (r.by > 80 && i > 10) break;
  }
  const b1 = await h.eval(() => ({ hp: window.wyrm.boss?.hp, by: Math.round(window.__bossBy), n: window.wyrm.partner.mode, hid: window.wyrm.partner.hidden, steps: window.wyrm.partner.steps }));
  if (!bshot) await h.shot('nyxa-boss');
  console.log('boss', JSON.stringify(b1));
  h.check('she damages the boss too', b1.by > 20 && b1.hp < b0.hp, JSON.stringify({ b0, b1 }));
}

/** Her assists: a rising slash after Aster launches a foe, a finisher on a frozen one (Shatter), and the Shadow Veil. */
export async function assists(h) {
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=plains&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  await withNyxa(h, 'plains');
  /** A tough grunt beside Aster that logs every hit it takes. */
  const spawn = (h, x, z) => h.eval(([x, z]) => {
    const g = window.wyrm;
    const e = g.spawnEnemy('grunt', x, g.col.groundAt(x, z, 1e4, 0.2).y + 0.05, z, Math.PI, false);
    e.aggro = true;
    e.hp = e.maxHp = 400;
    window.__e = e;
    window.__hits = [];
    const orig = e.takeHit.bind(e);
    e.takeHit = (hit) => { const r = orig(hit); window.__hits.push(hit.move + ':' + r); return r; };
    return true;
  }, [x, z]);
  const hits = () => h.eval(() => window.__hits);
  await h.eval(() => {
    const g = window.wyrm;
    const y = g.col.groundAt(0, 40, 1e4, 0.2).y;
    g.player.place(0, y + 0.05, 40, 0);
    g.cam.snapBehind(0, 0.3);
    g.partner.placeAt(2.4, g.col.groundAt(2.4, 41, 1e4, 0.2).y + 0.05, 41, 0);
  });
  await waitGame(h, 0.5);

  // 1) Aster launches a foe (his Horn Toss): she leaps after it.
  await spawn(h, 0, 42.6);
  await waitGame(h, 0.3);
  await h.eval(() => {
    const g = window.wyrm;
    const e = window.__e;
    g.partner.attackCd = 5;
    e.takeHit({ damage: 12, type: 'physical', dirX: 0, dirZ: 1, knockback: 1.2, launch: 13.5, stagger: 45, hitstop: 0, buildup: 0, heavy: false, spike: false, source: 'melee', move: 'uppercut', fromPlayer: true, ox: 0, oz: 40 });
  });
  for (let i = 0; i < 10 && !(await hits()).some((m) => m.startsWith('nyxa:rise')); i++) await waitGame(h, 0.2);
  let log = await hits();
  h.check('when Aster launches a foe she follows it up with a rising slash', log.some((m) => /^nyxa:rise:(hit|killed)/.test(m)), JSON.stringify(log));
  await h.shot('nyxa-assist-rise');
  await h.eval(() => { const e = window.__e; e.alive = false; e.state = 'dead'; e.deadT = 9; });
  await waitGame(h, 2.5);

  // 2) A frozen foe: she finishes it with the overhead scythe, which Shatters it.
  await spawn(h, 1.5, 44);
  const pts0 = await h.eval(() => {
    const g = window.wyrm;
    const e = window.__e;
    e.status.frozen = 4;
    g.style.reset();
    window.__react = 0;
    const orig = g.triggerReaction.bind(g);
    g.triggerReaction = (en, r) => { if (r === 'shatter') window.__react++; return orig(en, r); };
    return g.style.points;
  });
  for (let i = 0; i < 20 && !(await hits()).some((m) => m.startsWith('nyxa:finisher')); i++) await waitGame(h, 0.25);
  log = await hits();
  const fin = await h.eval(() => ({ shatter: window.__react, points: window.wyrm.style.points, reactions: window.wyrm.save.stats.reactions }));
  h.check('she finishes a frozen foe with a heavy blow that Shatters it', log.some((m) => m.startsWith('nyxa:finisher')) && fin.shatter >= 1, JSON.stringify({ log, fin }));
  h.check('her Shatter does not feed Aster\'s style meter', fin.points === pts0, JSON.stringify({ pts0, fin }));
  await h.eval(() => { const e = window.__e; if (e.alive) { e.alive = false; e.state = 'dead'; e.deadT = 9; } });
  await waitGame(h, 2.5);

  // 3) Aster nearly down with a foe on him: the Shadow Veil.
  await spawn(h, -1, 43.5);
  await h.eval(() => {
    const g = window.wyrm;
    g.player.invuln = false;
    g.player.hp = g.player.maxHp * 0.2;
  });
  let veil = null;
  for (let i = 0; i < 10; i++) {
    await waitGame(h, 0.2);
    veil = await h.eval(() => ({ cd: window.wyrm.partner.veilCd, invuln: window.wyrm.player.invuln, hp: window.wyrm.player.hp, say: document.querySelector('.partner-say.on span')?.textContent ?? '' }));
    if (veil.cd > 0) break;
  }
  await waitGame(h, 0.3);
  log = await hits();
  await h.shot('nyxa-veil');
  h.check('below a quarter health, Nyxa throws up the Shadow Veil: foes pushed back, Aster shielded', veil.cd > 50 && veil.invuln && log.some((m) => m.startsWith('nyxa:veil')), JSON.stringify({ veil, log }));
  await waitGame(h, 3.5);
  const after = await h.eval(() => ({ invuln: window.wyrm.player.invuln, cd: window.wyrm.partner.veilCd }));
  h.check('the veil lifts after a few seconds and waits a long while to return', !after.invuln && after.cd > 45, JSON.stringify(after));
}
