export default async function (h) {
  await h.go('?level=fen&seed=5&quality=low&maxdt=0.25', 2500);
  await h.skipDialogue();
  await h.eval(() => { const g = window.wyrm; g.player.place(0, 2, 200, 0); g.cam.snapBehind(0); });
  await h.wait(2500);
  await h.shot('bog-intro');
  await h.skipDialogue();
  await h.wait(500);
  let b = await h.eval(() => { const g = window.wyrm; const b = g.boss; return b ? { hp: b.hp, awake: b.awake, st: b.state, x: b.x, z: b.z } : null; });
  h.check('bogmaw spawned and awake', !!b && b.awake, JSON.stringify(b));
  // Let him attack for a while.
  await h.eval(() => { const g = window.wyrm; g.player.place(0, 2, 210, 0); });
  for (let i = 0; i < 6; i++) {
    await h.wait(1000);
    const r = await h.eval(() => { const g = window.wyrm; const b = g.boss; return `${b.state} ${b.attack?.id ?? '-'} hp=${Math.round(b.hp)} php=${Math.round(g.player.hp)} ph=${b.phase}`; });
    console.log(r);
    if (i === 2) await h.shot('bog-fight');
  }
  // Hit him.
  await h.eval(() => { const g = window.wyrm; g.player.hp = 100; const b = g.boss; g.player.place(b.x, b.y, b.z - 3.4, 0); g.player.yaw = 0; });
  const hp0 = await h.eval(() => window.wyrm.boss.hp);
  await h.tap('KeyJ', 3, 260);
  const hp1 = await h.eval(() => window.wyrm.boss.hp);
  h.check('bogmaw takes damage', hp1 < hp0, `${hp0} -> ${hp1}`);
  // Phase 2 and 3.
  await h.eval(() => { window.wyrm.boss.hp = window.wyrm.boss.maxHp * 0.5; });
  await h.wait(3000);
  await h.shot('bog-phase2');
  const ph = await h.eval(() => ({ phase: window.wyrm.boss.phase, enemies: window.wyrm.enemies.filter((e) => e.alive).length }));
  console.log('phase2', JSON.stringify(ph));
  // Finish him.
  await h.eval(() => { const g = window.wyrm; g.player.hp = 100; g.player.invuln = true; const b = g.boss; b.hp = 3; g.player.place(b.x, b.y, b.z - 3.4, 0); g.player.yaw = 0; });
  await h.tap('KeyJ', 2, 300);
  await h.wait(4500);
  let s = await h.state();
  h.check('outro dialogue', s.state === 'dialogue', JSON.stringify(s));
  await h.shot('bog-outro');
  await h.skipDialogue(8000);
  await h.wait(4000);
  s = await h.state();
  h.check('traveled to sanctum', s.level === 'sanctum', JSON.stringify(s));
}
