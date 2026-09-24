export default async function (h) {
  const page = h.page;
  await page.addInitScript(() => localStorage.clear());
  await h.go('?level=fen&seed=2&quality=low&maxdt=0.25', 2500);
  await h.skipDialogue();
  // Death and respawn.
  await h.eval(() => {
    const g = window.wyrm;
    g.player.hp = 1;
    const e = g.spawnEnemy('grunt', g.player.x, g.player.y, g.player.z + 1.8, Math.PI, false);
    e.aggro = true;
  });
  await h.wait(5000);
  let s = await h.state();
  h.check('player can die', s.state === 'dead' || s.state === 'transition' || s.hp === 100, JSON.stringify(s));
  await h.wait(5000);
  s = await h.state();
  h.check('respawns with full health', s.state === 'play' && s.hp === 100, JSON.stringify(s));
  // Wardstone: activates, heals, opens its menu with F.
  await h.eval(() => { const g = window.wyrm; const w = g.level.wardstones.get('ruins'); g.player.place(w.x, w.y + 0.1, w.z - 2.2, 0); g.player.hp = 40; });
  await h.wait(1500);
  s = await h.state();
  const cp = await h.eval(() => window.wyrm.save.checkpoint);
  h.check('wardstone saves and heals', cp === 'ruins' && s.hp === 100, `${cp} hp ${s.hp}`);
  await h.tap('KeyF', 1, 500);
  s = await h.state();
  const title = await page.locator('.panel h2').first().textContent().catch(() => '');
  h.check('wardstone menu opens', s.state === 'pause' && title === 'Wardstone', `${s.state} ${title}`);
  await page.getByRole('button', { name: /leave/i }).click();
  await h.wait(300);
  // Wardgate travel from the sanctum.
  await h.eval(() => { const g = window.wyrm; g.save.found['story:sanctum:arrive'] = true; g.save.found['story:sanctum:lesson-done'] = true; g.save.unlocked.push('sanctum'); g.travel('sanctum'); });
  await h.wait(3000);
  await h.skipDialogue();
  await h.eval(() => window.wyrm.menus.showTravel());
  await h.wait(500);
  const n = await page.locator('.lvl').count();
  h.check('wardgate lists realms', n === 5, `${n}`);
  await h.shot('flows-wardgate');
  await page.locator('.lvl').first().click();
  await h.wait(3500);
  s = await h.state();
  h.check('travel back to the fen', s.level === 'fen', JSON.stringify(s));
}
