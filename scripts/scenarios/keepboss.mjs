// Nyxa: intro, three phases, every element, knockdowns, the rim, the ending.
import { place, where, run, tap, down, up } from './keeplib.mjs';

const boss = (h) => h.eval(() => {
  const g = window.wyrm;
  const b = g.boss;
  if (!b) return null;
  return {
    hp: Math.round(b.hp), max: Math.round(b.maxHp), phase: b.phase, st: b.state, atk: b.attack?.id ?? '-', fly: b.flying, fall: b.falling,
    hidden: b.hidden, awake: b.awake, alive: b.alive, x: +b.x.toFixed(1), y: +b.y.toFixed(1), z: +b.z.toFixed(1), php: Math.round(g.player.hp),
    minions: g.enemies.filter((e) => e.alive && e !== b).map((e) => e.def.id).join(','),
  };
});

/** Watches the fight for `secs` of simulated time, keeping the dragon alive; returns the attacks seen. */
async function watch(h, secs, label) {
  return h.eval(([secs, label]) => new Promise((res) => {
    const g = window.wyrm;
    const orig = g.frame;
    const seen = {};
    const log = [];
    let hurt = 0;
    let lastHp = g.player.hp;
    let lastKey = '';
    const t0 = g.realTime;
    g.frame = (dt) => {
      orig.call(g, dt);
      const b = g.boss;
      const p = g.player;
      if (p.hp < lastHp) hurt += lastHp - p.hp;
      if (p.hp < 60) p.hp = p.maxHp;
      lastHp = p.hp;
      if (b && b.attack) seen[b.attack.id] = (seen[b.attack.id] ?? 0) + (b.state === 'windup' && b.stateT < 0.3 ? 0 : 0);
      const key = b ? `${b.state}:${b.attack?.id ?? '-'}:${b.flying ? 'air' : 'gnd'}` : 'none';
      if (key !== lastKey) {
        lastKey = key;
        if (b?.attack && b.state === 'windup') seen[b.attack.id] = (seen[b.attack.id] ?? 0) + 1;
        log.push(`${(g.realTime - t0).toFixed(1)} ${key}`);
      }
      if (g.realTime - t0 > secs) {
        g.frame = orig;
        res({ label, seen, hurt: Math.round(hurt), log: log.slice(-40) });
      }
    };
  }), [secs, label]);
}

export default async function (h) {
  await h.go('?level=keep&seed=3&quality=low&maxdt=0.25', 3000);
  await h.skipDialogue();
  await h.eval(() => {
    const g = window.wyrm;
    for (const e of ['fire', 'lightning', 'ice', 'earth']) if (!g.save.elements.includes(e)) g.learnElement(e);
    for (const e of g.enemies) if (!e.isBoss) e.die(null);
  });
  // Walk into the throne arena.
  await place(h, 0, -243, Math.PI);
  await run(h, [{ keys: down('KeyW') }, { when: 'g.state === "dialogue"', keys: up('KeyW') }, { after: 0.8 }], 8);
  await h.shot('kb-intro');
  let b = await boss(h);
  h.check('Nyxa spawns with her intro', !!b && (await h.eval(() => window.wyrm.state)) === 'dialogue', JSON.stringify(b));
  const name = await h.eval(() => window.wyrm.boss?.displayName);
  console.log('  boss bar:', name);
  await h.skipDialogue(6000);
  await h.wait(500);
  b = await boss(h);
  const barrier = await h.eval(() => window.wyrm.level.props.some((p) => p.constructor.name === 'Barrier' && p.on));
  h.check('fight starts: awake, barrier up, boss music', b.awake && barrier, JSON.stringify(b));

  // Phase 1: the ground duel.
  let w = await watch(h, 16, 'phase1');
  console.log('  phase 1 attacks:', JSON.stringify(w.seen), 'damage to dragon:', w.hurt);
  console.log('   ', w.log.join(' | '));
  await h.shot('kb-phase1');
  h.check('phase 1 uses melee, breath and shadow-steps', (w.seen.scythe || w.seen.lunge) && (w.seen.breath || w.seen.poof), JSON.stringify(w.seen));

  // Every element hurts her (she holds still for this).
  const results = {};
  for (const [el, key] of [['fire', 'Digit1'], ['lightning', 'Digit2'], ['ice', 'Digit3'], ['earth', 'Digit4']]) {
    await h.eval(() => { const b = window.wyrm.boss; b.awake = false; b.attack = null; b.setState('idle'); b.status.clear(); b.body.vx = b.body.vz = 0; if (Math.hypot(b.x, b.z + 263) > 8) b.body.setPos(0, b.y, -263); });
    const bb = await boss(h);
    const yaw = Math.PI;
    await place(h, bb.x, bb.z + 3.2, yaw);
    await h.eval(() => { const g = window.wyrm; g.player.lock = g.boss; });
    const hp0 = (await boss(h)).hp;
    await run(h, [{ keys: tap(key) }, { after: 0.1, keys: down('KeyK') }, { after: 0.7, keys: up('KeyK') }, { after: 0.2 }]);
    const hp1 = (await boss(h)).hp;
    results[el] = hp0 - hp1;
  }
  h.check('fire, lightning, ice and earth all damage Nyxa', Object.values(results).every((d) => d > 0), JSON.stringify(results));
  const shadow = await h.eval(() => {
    const b = window.wyrm.boss;
    const hp0 = b.hp;
    const r = b.takeHit({ damage: 30, type: 'shadow', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 0, heavy: false, spike: false, source: 'burst', move: 'test', fromPlayer: true, ox: b.x, oz: b.z + 3 });
    return { r, dmg: hp0 - b.hp };
  });
  h.check('shadow does nothing to her', shadow.r === 'immune' && shadow.dmg === 0, JSON.stringify(shadow));
  await h.eval(() => { const b = window.wyrm.boss; b.awake = true; b.status.clear(); });

  // Phase 2: into the sky.
  await h.eval(() => { const b = window.wyrm.boss; b.hp = b.maxHp * 0.62; });
  await place(h, 0, -258, Math.PI);
  w = await watch(h, 3.5, 'takeoff');
  b = await boss(h);
  h.check('phase 2: she roars and takes flight', b.phase === 2 && b.fly && b.y > 23, JSON.stringify(b));
  await h.shot('kb-phase2-air');
  w = await watch(h, 22, 'phase2');
  console.log('  phase 2 attacks:', JSON.stringify(w.seen), 'damage to dragon:', w.hurt);
  console.log('   ', w.log.join(' | '));
  b = await boss(h);
  const knights = await h.eval(() => window.wyrm.enemies.filter((e) => e.alive && e.def.id === 'knight').length);
  h.check('phase 2: orb volleys, dive-bombs and Shade Knights', w.seen.orbs && w.seen.dive && (w.seen.summon || knights > 0), JSON.stringify(w.seen) + ` knights=${knights}`);
  await h.shot('kb-phase2');
  // Knock her out of the sky with a freeze.
  await h.eval(() => { for (const e of window.wyrm.enemies) if (e.alive && e.def.id === 'knight') e.die(null); });
  for (let i = 0; i < 20; i++) {
    b = await boss(h);
    if (b.fly && b.st !== 'windup' && b.st !== 'active' && b.st !== 'recover') break;
    await h.wait(400);
  }
  b = await boss(h);
  console.log('  before freeze', JSON.stringify(b));
  await h.eval(() => {
    const b = window.wyrm.boss;
    b.takeHit({ damage: 5, type: 'ice', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 400, heavy: false, spike: false, source: 'breath', move: 'test', fromPlayer: true, ox: b.x, oz: b.z + 3 });
  });
  await h.wait(2500);
  b = await boss(h);
  h.check('a freeze knocks her out of the sky onto the floor', !b.fly && b.y < 21 && (b.st === 'down' || b.st === 'hitstun' || b.st === 'chase'), JSON.stringify(b));
  await h.shot('kb-knocked-down');
  // A heavy blow does it too.
  await h.eval(() => { const b = window.wyrm.boss; b.status.clear(); b.flipped = 0; b.attack = null; b.setState('chase'); b.takeOff(true); b.globalCd = 3; });
  await run(h, [{ when: 'g.boss.flying && g.boss.y > 23 && !g.boss.diving' }], 6);
  const upAgain = await boss(h);
  await h.eval(() => {
    const b = window.wyrm.boss;
    b.takeHit({ damage: 20, type: 'earth', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 400, hitstop: 0, buildup: 0, heavy: true, spike: false, source: 'burst', move: 'test', fromPlayer: true, ox: b.x, oz: b.z + 3 });
  });
  await h.wait(2500);
  b = await boss(h);
  h.check('a heavy (stagger) hit also brings her down', upAgain.fly && !b.fly && b.y < 21, JSON.stringify(upAgain) + ' -> ' + JSON.stringify(b));

  // Phase 3: eclipse fury.
  await h.eval(() => { const b = window.wyrm.boss; b.status.clear(); b.hp = b.maxHp * 0.31; });
  for (let i = 0; i < 20; i++) {
    b = await boss(h);
    if (b.phase === 3) break;
    await h.wait(400);
  }
  let rim = false;
  for (let i = 0; i < 30 && !rim; i++) {
    await h.wait(400);
    rim = await h.eval(() => window.wyrm.level.hazards.some((z) => z.constructor.name === 'EclipseRim'));
  }
  b = await boss(h);
  h.check('phase 3: she returns to the ground and the rim turns to shadow', b.phase === 3 && rim && !b.fly, JSON.stringify(b));
  await place(h, 0, -263 + 17.5, Math.PI);
  const hpRim0 = await h.eval(() => window.wyrm.player.hp);
  await h.wait(1500);
  const hpRim1 = await h.eval(() => window.wyrm.player.hp);
  const pr = await where(h);
  h.check('the shadow rim hurts and pushes the dragon inward', hpRim1 < hpRim0 && Math.hypot(pr.x, pr.z + 263) < 17.5, `${hpRim0} -> ${hpRim1} ${JSON.stringify(pr)}`);
  await h.shot('kb-phase3-rim');
  await place(h, 0, -256, Math.PI);
  w = await watch(h, 20, 'phase3');
  console.log('  phase 3 attacks:', JSON.stringify(w.seen), 'damage to dragon:', w.hurt);
  console.log('   ', w.log.join(' | '));
  h.check('phase 3: faster combos, nova and desperate dives', Object.keys(w.seen).length >= 3, JSON.stringify(w.seen));
  await h.shot('kb-phase3');

  // The end.
  await h.eval(() => { const g = window.wyrm; g.player.invuln = true; const b = g.boss; b.status.clear(); b.hp = 4; });
  for (let i = 0; i < 12; i++) {
    b = await boss(h);
    if (!b.alive) break;
    if (!b.hidden && b.st !== 'windup') {
      await place(h, b.x, b.z + 3, Math.PI);
      await h.eval(() => { const g = window.wyrm; g.player.lock = g.boss; });
      await run(h, [{ keys: tap('Digit1') }, { after: 0.1, keys: down('KeyK') }, { after: 0.6, keys: up('KeyK') }, { after: 0.2 }]);
    } else await h.wait(300);
  }
  b = await boss(h);
  h.check('Nyxa is defeated', !b.alive, JSON.stringify(b));
  await h.eval(() => { window.wyrm.player.invuln = false; });
  await run(h, [{ when: 'g.state === "dialogue"' }, { after: 1.0 }], 8);
  const npc = await h.eval(() => !!window.wyrm.level.npcs.find((n) => n.id === 'nyxa'));
  h.check('ending dialogue plays with the freed Nyxa', (await h.eval(() => window.wyrm.state)) === 'dialogue' && npc);
  await h.shot('kb-ending-talk');
  // Step through the lines to see the Hollow King's.
  for (let i = 0; i < 4; i++) {
    await h.eval(() => window.wyrm.dialogue.advance());
    await h.wait(250);
    await h.eval(() => window.wyrm.dialogue.advance());
    await h.wait(700);
  }
  await h.shot('kb-hollow');
  await h.skipDialogue(8000);
  await h.wait(1500);
  const st = await h.eval(() => ({ state: window.wyrm.state, done: !!window.wyrm.save.levelsDone.keep, crawl: !!document.querySelector('.crawl') }));
  h.check('ending screen shows and the realm is marked done', st.state === 'ending' && st.done && st.crawl, JSON.stringify(st));
  await h.wait(16000);
  await h.shot('kb-ending-screen');
  // The button returns to the sanctum, where Nyxa waits.
  const clicked = await h.eval(() => {
    const btn = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Return to the Sanctum'));
    if (!btn) return false;
    btn.click();
    return true;
  });
  await h.wait(4000);
  await h.skipDialogue(4000);
  const sanc = await h.eval(() => ({ level: window.wyrm.level?.def.id, nyxa: !!window.wyrm.level?.npcs.find((n) => n.id === 'nyxa') }));
  h.check('the ending button travels to the sanctum, Nyxa is there', clicked && sanc.level === 'sanctum' && sanc.nyxa, JSON.stringify(sanc));
  await h.eval(() => { const g = window.wyrm; g.player.place(10, 0.3, 6, Math.PI / 2); g.cam.snapBehind(Math.PI / 2, 0.25); });
  await h.wait(1500);
  await h.shot('kb-sanctum-nyxa');
}
