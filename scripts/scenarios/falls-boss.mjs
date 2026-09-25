// Stormspire Falls: Skrieka. Spawns, attacks, takes damage, changes phase,
// dies; the rescue outro runs and travels to the Sanctum.
import { boot, place, step, snap, shot, skip, clearArenas } from './falls-lib.mjs';

const bossInfo = (h) => h.eval(() => {
  const g = window.wyrm;
  const b = g.boss;
  if (!b) return null;
  return {
    mode: b.mode, st: b.state, hp: Math.round(b.hp), max: Math.round(b.maxHp), ph: b.phase, awake: b.awake, alive: b.alive,
    x: +b.x.toFixed(1), y: +b.y.toFixed(1), z: +b.z.toFixed(1), minions: g.enemies.filter((e) => e.alive && e.def.id === 'stormWisp').length,
    rings: b.rings.filter((r) => r.active).length, whirl: !!b.whirl, php: Math.round(g.player.hp),
  };
});

export default async function (h) {
  await boot(h);
  await clearArenas(h);
  const k = h.page.keyboard;
  // Walk into the middle of the spire top.
  await place(h, 6, 232, -0.5);
  await k.down('KeyW');
  await step(h, 1.0);
  await k.up('KeyW');
  await step(h, 0.5);
  let s = await snap(h);
  h.check('boss intro starts', s.state === 'dialogue', JSON.stringify(s));
  await shot(h, 'boss-intro');
  await skip(h);
  await step(h, 0.5);
  let b = await bossInfo(h);
  h.check('Skrieka spawned and awake', !!b && b.awake, JSON.stringify(b));
  const barrier = await h.eval(() => window.wyrm.level.props.some((p) => p.constructor.name === 'Barrier' && p.on));
  h.check('barrier raised', barrier);

  // Watch phase 1 for a while; the dragon stands its ground and gets healed.
  const seen = new Set();
  let hits = 0;
  let crashAt = null;
  let lastHp = 100;
  for (let i = 0; i < 90; i++) {
    await step(h, 0.2);
    b = await bossInfo(h);
    seen.add(b.mode);
    if (b.php < lastHp) hits++;
    await h.eval(() => { const p = window.wyrm.player; p.hp = p.maxHp; });
    lastHp = 100;
    if (b.mode === 'swoopAim' && !seen.has('shot-aim')) {
      seen.add('shot-aim');
      await shot(h, 'boss-swoop-aim');
    }
    // When the dive locks in, face her and sidestep off the red streak.
    const locked = await h.eval(() => window.wyrm.boss.swoopLocked && window.wyrm.boss.mode === 'swoopAim');
    if (locked && (i % 2 === 0)) {
      await h.eval(() => { const g = window.wyrm; const b = g.boss; const p = g.player; g.cam.snapBehind(Math.atan2(b.x - p.x, b.z - p.z), 0.1); });
      await k.down('KeyD');
      await step(h, 0.75);
      await k.up('KeyD');
      if (!seen.has('shot-dive')) {
        seen.add('shot-dive');
        await shot(h, 'boss-dive');
      }
    }
    if (b.mode === 'volley' && b.st === 'active' && !seen.has('shot-volley')) {
      seen.add('shot-volley');
      await shot(h, 'boss-volley');
    }
    if (b.mode === 'gust' && b.st === 'active' && !seen.has('shot-gust')) {
      seen.add('shot-gust');
      await shot(h, 'boss-gust');
    }
    if (b.mode === 'crash' && crashAt === null) {
      crashAt = b;
      await shot(h, 'boss-crash');
      break;
    }
    if (i % 10 === 0) console.log(JSON.stringify(b));
  }
  console.log('modes seen', [...seen].join(','), 'player hit', hits);
  h.check('phase 1 swoops and crashes', !!crashAt, JSON.stringify(crashAt));

  // Punish the crash: horns and fire.
  if (crashAt) {
    await h.eval(() => {
      const g = window.wyrm;
      const b = g.boss;
      const p = g.player;
      const a = Math.atan2(p.x - b.x, p.z - b.z);
      p.place(b.x + Math.sin(a) * 3.6, b.y + 0.1, b.z + Math.cos(a) * 3.6, a + Math.PI);
      g.cam.snapBehind(a + Math.PI);
    });
    const hp0 = (await bossInfo(h)).hp;
    for (let i = 0; i < 5; i++) {
      await k.press('KeyJ');
      await step(h, 0.22);
    }
    const hp1 = (await bossInfo(h)).hp;
    h.check('horns hurt her while she is down', hp1 < hp0, `${hp0} -> ${hp1}`);
    await k.down('KeyK');
    await step(h, 1.0);
    await k.up('KeyK');
    const hp2 = (await bossInfo(h)).hp;
    h.check('fire hurts her more', hp2 < hp1, `${hp1} -> ${hp2}`);
    await shot(h, 'boss-punish');
  }
  // Lightning does nothing.
  const imm = await h.eval(() => {
    const g = window.wyrm;
    const b = g.boss;
    const r = b.takeHit({ damage: 30, type: 'lightning', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 30, heavy: false, spike: false, source: 'breath', move: 'test', fromPlayer: true, ox: b.x, oz: b.z - 3 });
    return r;
  });
  h.check('immune to lightning', imm === 'immune', imm);

  // Phase 2: storm wisps and lightning rings.
  await h.eval(() => { const b = window.wyrm.boss; b.hp = b.maxHp * 0.6; });
  const seen2 = new Set();
  let ringsSeen = 0;
  let shots2 = 0;
  for (let i = 0; i < 120; i++) {
    await step(h, 0.2);
    b = await bossInfo(h);
    seen2.add(b.mode);
    ringsSeen = Math.max(ringsSeen, b.rings);
    await h.eval(() => { const p = window.wyrm.player; p.hp = p.maxHp; });
    if (b.rings > 0 && shots2 === 0) {
      shots2++;
      await shot(h, 'boss-strike');
    }
    if (b.ph === 2 && seen2.has('strike') && b.minions > 0 && ringsSeen > 0 && i > 30) break;
  }
  b = await bossInfo(h);
  console.log('phase 2 modes', [...seen2].join(','), JSON.stringify(b));
  h.check('phase 2 reached', b.ph === 2);
  h.check('storm wisps summoned', b.minions > 0 || seen2.has('summon'), JSON.stringify(b));
  h.check('lightning rings telegraphed', ringsSeen > 0, `max rings ${ringsSeen}`);
  await shot(h, 'boss-phase2');

  // Phase 3: whirlwind.
  await h.eval(() => { const b = window.wyrm.boss; b.hp = b.maxHp * 0.3; });
  const seen3 = new Set();
  for (let i = 0; i < 60; i++) {
    await step(h, 0.2);
    b = await bossInfo(h);
    seen3.add(b.mode);
    await h.eval(() => { const p = window.wyrm.player; p.hp = p.maxHp; });
    if (b.whirl && i > 20) break;
  }
  b = await bossInfo(h);
  h.check('phase 3 whirlwind', b.ph === 3 && b.whirl, JSON.stringify(b));
  await shot(h, 'boss-phase3');

  // Finish her.
  await h.eval(() => {
    const g = window.wyrm;
    const b = g.boss;
    b.hp = 1;
    b.takeHit({ damage: 20, type: 'fire', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 0, heavy: false, spike: false, source: 'burst', move: 'test', fromPlayer: true, ox: b.x, oz: b.z - 3 });
  });
  b = await bossInfo(h);
  h.check('Skrieka defeated', b && !b.alive, JSON.stringify(b));
  await step(h, 0.8);
  await shot(h, 'boss-death');
  // The outro waits two seconds of game time.
  await step(h, 2.4);
  s = await snap(h);
  h.check('rescue dialogue', s.state === 'dialogue', JSON.stringify(s));
  await shot(h, 'boss-rescue');
  await skip(h, 20);
  for (let i = 0; i < 10; i++) {
    await step(h, 0.3);
    // The Realm Restored card waits for Continue before the journey home.
    await h.eval(() => document.querySelector('.panel.results button')?.click());
    const lvl = await h.eval(() => window.wyrm.level?.def.id);
    if (lvl === 'sanctum') break;
  }
  const end = await h.eval(() => {
    const g = window.wyrm;
    return { level: g.level?.def.id, els: g.save.elements, unlocked: g.save.unlocked, done: g.save.levelsDone };
  });
  h.check('traveled to the sanctum', end.level === 'sanctum', JSON.stringify(end));
  h.check('learned lightning', end.els.includes('lightning'), JSON.stringify(end.els));
  h.check('frostworks unlocked, falls done', end.unlocked.includes('frostworks') && !!end.done.falls, JSON.stringify(end));
  await skip(h, 20);
  await step(h, 0.5);
  await shot(h, 'boss-sanctum');
}
