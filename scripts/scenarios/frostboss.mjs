// Forgemaster Grolm: intro, attacks, punish windows, phases, rime shell, death and rescue.
import { place, waitGame, until, elem, holdGame } from './frostlib.mjs';

const boss = (h) => h.eval(() => {
  const g = window.wyrm;
  const b = g.boss;
  if (!b) return null;
  return {
    hp: Math.round(b.hp), max: b.maxHp, awake: b.awake, st: b.state, atk: b.attack?.id ?? '-', ph: b.phase, stuck: +b.stuck.toFixed(2),
    shell: Math.round(b.shellHp), x: +b.x.toFixed(1), z: +b.z.toFixed(1), patches: b.patches.length, minions: b.minions.filter((m) => m.alive).length,
    php: Math.round(g.player.hp),
  };
});

/** Stand in front of the boss's furnace, facing it. */
async function front(h, d = 3.6) {
  await h.eval((d) => {
    const g = window.wyrm;
    const b = g.boss;
    const x = b.x + Math.sin(b.yaw) * (b.radius + d - 2.5);
    const z = b.z + Math.cos(b.yaw) * (b.radius + d - 2.5);
    const yaw = Math.atan2(b.x - x, b.z - z);
    g.player.place(x, b.y + 0.1, z, yaw);
    g.cam.snapBehind(yaw, 0.3);
    g.player.lock = null;
  }, d);
  await waitGame(h, 0.05);
}

async function force(h, id) {
  await h.eval((id) => {
    const b = window.wyrm.boss;
    b.stuck = 0;
    b.setState('chase');
    b.startAttack(b.def.attacks.find((a) => a.id === id));
  }, id);
}

export default async function (h) {
  await h.go('?level=frostworks&seed=4&quality=low&maxdt=0.1', 3000);
  await h.skipDialogue();
  await h.eval(() => { const g = window.wyrm; for (const e of ['fire', 'lightning']) if (!g.save.elements.includes(e)) g.learnElement(e); g.player.invuln = true; });
  const npc = await h.eval(() => window.wyrm.level.npcs.map((n) => n.id));
  h.check('Frostfang is caged beside the Crucible', npc.includes('frostfang'), JSON.stringify(npc));
  await place(h, 0, 231, 0);
  await holdGame(h, ['KeyW'], 0.6);
  await waitGame(h, 0.8);
  let s = await h.state();
  h.check('boss intro plays', s.state === 'dialogue', JSON.stringify(s));
  await h.shot('fb-intro');
  await h.skipDialogue(6000);
  let b = await boss(h);
  h.check('Grolm spawned and awake', !!b && b.awake, JSON.stringify(b));
  const barrier = await h.eval(() => window.wyrm.level.props.some((p) => p.constructor.name === 'Barrier' && p.on));
  h.check('arena barrier is up', barrier);

  // Free fight: let him pick his own attacks against a dodging-free dragon.
  await h.eval(() => { window.wyrm.player.invuln = false; });
  const seen = new Set();
  let hurt = false;
  await place(h, 0, 246, 0);
  for (let i = 0; i < 40; i++) {
    b = await boss(h);
    seen.add(b.atk);
    if (b.php < 100) hurt = true;
    if (i === 12) await h.shot('fb-fight');
    await h.eval(() => { const p = window.wyrm.player; if (p.hp < 40) p.hp = 100; });
    await waitGame(h, 0.35);
  }
  console.log('attacks seen', [...seen].join(','));
  h.check('Grolm attacks on his own (slam/sweep/stomp/lob)', ['slam', 'sweep', 'stomp', 'lob'].some((a) => seen.has(a)), [...seen].join(','));
  h.check('his attacks hurt the dragon', hurt);
  await h.eval(() => { const p = window.wyrm.player; p.invuln = true; p.hp = 100; });

  // Slam: telegraph, shockwave, stuck hammer and exposed furnace.
  await front(h, 7);
  await force(h, 'slam');
  await waitGame(h, 0.7);
  await h.shot('fb-slam-windup');
  const sw = await until(h, () => window.wyrm.shockwaves.length > 0 && window.wyrm.boss.stuck > 0, null, 3);
  h.check('slam spawns a shockwave and sticks the hammer', !!sw);
  await h.shot('fb-stuck');
  await front(h, 3.2);
  let hp0 = (await boss(h)).hp;
  await h.tap('KeyJ', 3, 150);
  await waitGame(h, 0.4);
  let hp1 = (await boss(h)).hp;
  const exposedDmg = hp0 - hp1;
  console.log('exposed dmg', exposedDmg);
  h.check('the exposed furnace takes damage', exposedDmg > 0, `${hp0} -> ${hp1}`);
  await until(h, () => window.wyrm.boss.stuck <= 0 && window.wyrm.boss.state !== 'recover', null, 6);
  // Normal hits for comparison.
  await h.eval(() => { const b = window.wyrm.boss; b.setState('strafe'); b.globalCd = 5; b.stuck = 0; });
  await front(h, 3.2);
  hp0 = (await boss(h)).hp;
  await h.tap('KeyJ', 3, 150);
  await waitGame(h, 0.4);
  hp1 = (await boss(h)).hp;
  console.log('normal dmg', hp0 - hp1);
  h.check('the stuck hammer window deals more damage', exposedDmg > (hp0 - hp1) * 1.2, `exposed ${exposedDmg} vs normal ${hp0 - hp1}`);

  // Sweep: jumping clears it.
  await front(h, 5);
  await h.eval(() => { const p = window.wyrm.player; p.invuln = false; p.hp = 100; });
  await force(h, 'sweep');
  await until(h, () => window.wyrm.boss.state === 'windup' && window.wyrm.boss.stateT > 0.55, null, 3);
  await h.page.keyboard.down('Space');
  await waitGame(h, 0.3);
  await h.page.keyboard.up('Space');
  await until(h, () => window.wyrm.boss.state === 'recover', null, 3);
  let php = await h.eval(() => window.wyrm.player.hp);
  h.check('jumping over the low sweep avoids it', php === 100, String(php));
  await h.shot('fb-sweep');
  await waitGame(h, 1);
  await front(h, 5);
  await h.eval(() => { const p = window.wyrm.player; p.hp = 100; });
  await force(h, 'sweep');
  await until(h, () => window.wyrm.boss.state === 'recover', null, 4);
  php = await h.eval(() => window.wyrm.player.hp);
  h.check('standing still gets swept', php < 100, String(php));
  await h.eval(() => { const p = window.wyrm.player; p.invuln = true; p.hp = 100; });

  // Phase 2: coolant patches and golem minions.
  await h.eval(() => { const b = window.wyrm.boss; b.hp = b.maxHp * 0.6; b.setState('chase'); b.stuck = 0; });
  await waitGame(h, 0.5);
  b = await boss(h);
  h.check('phase 2 at 60% health', b.ph === 2, JSON.stringify(b));
  await force(h, 'vent');
  await until(h, () => window.wyrm.boss.patches.length > 0, null, 3);
  await waitGame(h, 1.4);
  b = await boss(h);
  h.check('vent spreads freezing floor patches', b.patches >= 3, JSON.stringify(b));
  await h.shot('fb-vent');
  await h.eval(() => { const p = window.wyrm.player; p.invuln = false; p.hp = 100; const f = window.wyrm.boss.patches[0]; p.place(f.x, f.y + 0.05, f.z, 0); });
  await waitGame(h, 0.8);
  php = await h.eval(() => window.wyrm.player.hp);
  h.check('frost patches hurt', php < 100, String(php));
  await h.eval(() => { const p = window.wyrm.player; p.invuln = true; p.hp = 100; });
  await force(h, 'summon');
  await until(h, () => window.wyrm.boss.minions.length > 0, null, 3);
  await waitGame(h, 1);
  b = await boss(h);
  h.check('summon calls frost golems', b.minions >= 1, JSON.stringify(b));
  await h.shot('fb-summon');
  await h.eval(() => { for (const m of window.wyrm.boss.minions) if (m.alive) { m.hp = 0; m.die(null); } });

  // Phase 3: the rime shell.
  await h.eval(() => { const b = window.wyrm.boss; b.hp = b.maxHp * 0.3; b.setState('chase'); b.stuck = 0; b.attack = null; });
  const shelled = await until(h, () => window.wyrm.boss.shellHp > 0, null, 6);
  b = await boss(h);
  h.check('phase 3 armors Grolm in a rime shell', !!shelled && b.ph === 3, JSON.stringify(b));
  await waitGame(h, 0.8);
  await h.shot('fb-shell');
  await h.eval(() => { const b = window.wyrm.boss; b.setState('strafe'); b.globalCd = 8; });
  await elem(h, 'Digit2');
  await front(h, 3.2);
  hp0 = (await boss(h)).hp;
  await h.tap('KeyJ', 3, 150);
  await waitGame(h, 0.4);
  hp1 = (await boss(h)).hp;
  console.log('shelled horn dmg', hp0 - hp1);
  h.check('the shell shrugs off non-fire hits', hp0 - hp1 < exposedDmg * 0.25, `${hp0} -> ${hp1}`);
  await elem(h, 'Digit1');
  const sh0 = (await boss(h)).shell;
  await h.eval(() => { const b = window.wyrm.boss; b.globalCd = 8; window.wyrm.player.mana = 100; });
  await front(h, 3.5);
  await holdGame(h, ['KeyK'], 1.5);
  const sh1 = (await boss(h)).shell;
  h.check('fire melts the rime shell', sh1 < sh0, `${sh0} -> ${sh1}`);
  await h.eval(() => { const b = window.wyrm.boss; b.shellHp = 4; b.globalCd = 8; window.wyrm.player.mana = 100; });
  await front(h, 3.5);
  await holdGame(h, ['KeyK'], 0.8);
  b = await boss(h);
  h.check('melting the shell staggers Grolm', b.shell <= 0 && b.st === 'hitstun', JSON.stringify(b));
  await h.shot('fb-melted');

  // Finish him.
  await h.eval(() => { const b = window.wyrm.boss; b.hp = 5; });
  await front(h, 3.2);
  await h.tap('KeyJ', 3, 200);
  const dead = await until(h, () => !window.wyrm.boss || !window.wyrm.boss.alive, null, 3);
  h.check('Grolm dies', dead);
  await until(h, () => window.wyrm.state === 'dialogue', null, 6);
  s = await h.state();
  h.check('rescue dialogue plays', s.state === 'dialogue', JSON.stringify(s));
  await h.shot('fb-rescue');
  await h.skipDialogue(8000);
  await h.wait(5000);
  s = await h.state();
  const save = await h.eval(() => ({ els: window.wyrm.save.elements, done: window.wyrm.save.levelsDone.frostworks, unl: window.wyrm.save.unlocked }));
  h.check('Aster learned Ice', save.els.includes('ice'), JSON.stringify(save));
  h.check('Stonewild Plains unlocked', save.unl.includes('plains'), JSON.stringify(save));
  h.check('traveled to the sanctum', s.level === 'sanctum' && !!save.done, JSON.stringify(s));
  await h.skipDialogue(4000);
  await h.shot('fb-sanctum');
  // Revisit: no boss, no cage, return portals instead.
  await h.eval(() => window.wyrm.loadLevel('frostworks', { checkpoint: null }));
  await h.wait(2500);
  await h.skipDialogue();
  const rv = await h.eval(() => {
    const g = window.wyrm;
    return {
      portals: g.level.interactables.filter((i) => i.constructor.name === 'Portal').length,
      cage: g.level.npcs.some((n) => n.id === 'frostfang'),
      // A beaten boss only comes back if Aster asks for a rematch at the standing stone.
      barrier: g.level.props.some((p) => p.constructor.name === 'Barrier' && p.on),
      boss: !!g.boss?.alive,
      rematch: g.level.interactables.some((i) => /Challenge Grolm/.test(i.label)),
    };
  });
  h.check('revisit has return portals and no boss or cage', rv.portals >= 2 && !rv.cage && !rv.barrier && !rv.boss, JSON.stringify(rv));
  h.check('a standing stone offers a rematch', rv.rematch, JSON.stringify(rv));
}
