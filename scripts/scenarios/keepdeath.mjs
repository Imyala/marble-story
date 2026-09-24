// Dying in Eclipse Keep: arenas and the boss must reset cleanly.
import { place, run, down, up } from './keeplib.mjs';

const kill = (h) => h.eval(() => {
  const g = window.wyrm;
  g.player.invuln = false;
  g.player.iframes = 0;
  g.player.takeHit({ damage: 9999, type: 'physical', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 0, heavy: false, spike: false, source: 'enemy', move: 'test', fromPlayer: false, ox: 0, oz: 0 }, null);
});

const waitRespawn = async (h) => {
  for (let i = 0; i < 40; i++) {
    await h.wait(400);
    const s = await h.eval(() => window.wyrm.state);
    if (s === 'play') return true;
  }
  return false;
};

export default async function (h) {
  await h.go('?level=keep&seed=2&quality=low&maxdt=0.25', 3000);
  await h.skipDialogue();
  await h.eval(() => {
    const g = window.wyrm;
    for (const e of ['fire', 'lightning', 'ice', 'earth']) if (!g.save.elements.includes(e)) g.learnElement(e);
    for (const e of g.enemies) e.die(null);
  });
  // Arena: the bastion Wardstone first, then die mid-fight in the hall.
  await place(h, 0, -79, Math.PI);
  await h.wait(800);
  await place(h, 0, -141, Math.PI);
  await run(h, [{ keys: down('KeyW') }, { after: 0.6, keys: up('KeyW') }, { after: 2.0 }]);
  const inArena = await h.eval(() => window.wyrm.level.arenas.find((a) => a.id === 'hall').state);
  await kill(h);
  await waitRespawn(h);
  await h.wait(1500);
  const after = await h.eval(() => {
    const g = window.wyrm;
    return {
      arena: g.level.arenas.find((a) => a.id === 'hall').state,
      zombies: g.enemies.filter((e) => !e.alive && e.state !== 'dead').length,
      alive: g.enemies.filter((e) => e.alive).length,
      hp: g.player.hp,
      at: [Math.round(g.player.x), Math.round(g.player.z)],
    };
  });
  await h.wait(3000);
  const hp2 = await h.eval(() => window.wyrm.player.hp);
  h.check('respawn at the bastion Wardstone', Math.abs(after.at[1] + 79.5) < 2, JSON.stringify(after.at));
  h.check('dying in an arena resets it with no invisible attackers', inArena === 'active' && after.arena === 'idle' && after.zombies === 0 && hp2 === after.hp, `${inArena} ${JSON.stringify(after)} hp later ${hp2}`);

  // Boss: die in phase 2 with knights up, then in phase 3 with the rim.
  await place(h, 0, -240, Math.PI);
  await h.wait(800);
  await place(h, 0, -244, Math.PI);
  await run(h, [{ keys: down('KeyW') }, { when: 'g.state === "dialogue"', keys: up('KeyW') }, { after: 0.5 }], 8);
  await h.skipDialogue(6000);
  await h.eval(() => { const g = window.wyrm; if (g.state === 'pause') g.resume(); g.player.invuln = true; const b = g.boss; b.hp = b.maxHp * 0.6; });
  for (let i = 0; i < 30; i++) {
    await h.wait(500);
    const k = await h.eval(() => window.wyrm.enemies.filter((e) => e.alive && e.def.id === 'knight').length);
    if (k > 0) break;
  }
  await h.eval(() => { const b = window.wyrm.boss; b.hp = b.maxHp * 0.3; });
  let rim = false;
  for (let i = 0; i < 30 && !rim; i++) {
    await h.wait(500);
    rim = await h.eval(() => window.wyrm.level.hazards.some((z) => z.constructor.name === 'EclipseRim'));
  }
  const mid = await h.eval(() => ({ knights: window.wyrm.enemies.filter((e) => e.alive && e.def.id === 'knight').length, phase: window.wyrm.boss.phase }));
  await kill(h);
  await waitRespawn(h);
  await h.wait(1500);
  const reset = await h.eval(() => {
    const g = window.wyrm;
    return {
      boss: !!(g.boss && g.boss.alive),
      knights: g.enemies.filter((e) => e.alive && e.def.id === 'knight').length,
      zombies: g.enemies.filter((e) => !e.alive && e.state !== 'dead').length,
      rim: g.level.hazards.some((z) => z.constructor.name === 'EclipseRim'),
      barrier: g.level.props.some((p) => p.constructor.name === 'Barrier' && p.on),
      at: [Math.round(g.player.x), Math.round(g.player.z)],
      music: g.audio.music?.name ?? null,
    };
  });
  h.check('respawn at the throne Wardstone, outside the boss trigger', Math.abs(reset.at[1] + 240.5) < 2, JSON.stringify(reset.at));
  h.check('dying to Nyxa clears her knights, the rim and the barrier', rim && mid.knights > 0 && !reset.boss && reset.knights === 0 && !reset.rim && !reset.barrier && reset.zombies === 0,
    `mid=${JSON.stringify(mid)} rim=${rim} reset=${JSON.stringify(reset)}`);
  // Walk back in: a rematch without the intro.
  await place(h, 0, -244, Math.PI);
  await run(h, [{ keys: down('KeyW') }, { when: 'g.boss && g.boss.alive', keys: up('KeyW') }, { after: 0.6 }], 8);
  const re = await h.eval(() => { const g = window.wyrm; return { alive: !!g.boss?.alive, awake: g.boss?.awake, hp: Math.round(g.boss?.hp ?? 0), max: Math.round(g.boss?.maxHp ?? 0), state: g.state }; });
  h.check('the rematch starts at full health without the intro', re.alive && re.awake && re.hp === re.max && re.state === 'play', JSON.stringify(re));
  await h.shot('kd-rematch');
}
