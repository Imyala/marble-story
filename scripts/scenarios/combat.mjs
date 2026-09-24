export default async function (h) {
  await h.go('?level=fen&seed=7&quality=low&maxdt=0.25', 2500);
  await h.skipDialogue();
  await h.wait(500);
  // Put a grunt right in front of the player.
  await h.eval(() => {
    const g = window.wyrm;
    g.player.place(0, 1.2, 0, 0);
    g.cam.snapBehind(0);
    const e = g.spawnEnemy('grunt', 0, 1.2, 2.2, Math.PI, false);
    e.aggro = true;
    window.__e = e;
  });
  await h.wait(500);
  const hp0 = await h.eval(() => window.__e.hp);
  for (let i = 0; i < 3; i++) await h.tap('KeyJ', 1, 220);
  await h.wait(600);
  const hp1 = await h.eval(() => window.__e.hp);
  let s = await h.state();
  h.check('horn combo damages', hp1 < hp0, `hp ${hp0} -> ${hp1}, combo ${s.combo}`);
  await h.shot('combat-horn');
  // Launcher then air combo on a fresh, sturdy enemy.
  await h.eval(() => {
    const g = window.wyrm;
    const e = g.spawnEnemy('grunt', g.player.x, g.player.y, g.player.z + 2, Math.PI, false);
    e.hp = e.maxHp = 400;
    window.__e = e;
    g.player.yaw = 0;
  });
  await h.wait(300);
  // Horn, then Tail (the launcher), then hold Jump to rise with the enemy.
  await h.tap('KeyJ', 1, 200);
  await h.page.keyboard.press('KeyL');
  await h.wait(60);
  await h.page.keyboard.down('Space');
  await h.wait(700);
  const mid = await h.eval(() => ({ py: window.wyrm.player.y, ey: window.__e.y, ps: window.wyrm.player.state, st: window.__e.state }));
  await h.page.keyboard.up('Space');
  h.check('launcher lifts enemy and player', mid.ey > 2 && mid.py > 2, JSON.stringify(mid));
  await h.tap('KeyJ', 3, 250);
  await h.shot('combat-air');
  const s2 = await h.state();
  h.check('air combo keeps hitting', s2.combo >= 4, JSON.stringify(s2));
  await h.wait(1500);
  // Kill it and collect gems.
  await h.eval(() => { const e = window.__e; if (e.alive) e.hp = 1; });
  await h.tap('KeyJ', 2, 200);
  await h.wait(2500);
  s = await h.state();
  h.check('kill drops gems that get collected', s.gems > 0, JSON.stringify(s));
  // Enemy attacks the player.
  await h.eval(() => {
    const g = window.wyrm;
    const e = g.spawnEnemy('grunt', g.player.x, g.player.y, g.player.z + 1.8, Math.PI, false);
    e.aggro = true;
  });
  await h.wait(5000);
  s = await h.state();
  h.check('enemy hurts the player', s.hp < 100, JSON.stringify(s));
}
