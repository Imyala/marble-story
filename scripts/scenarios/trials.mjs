export default async function (h) {
  const page = h.page;
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await h.go('?level=sanctum&seed=4&quality=low&maxdt=0.25', 2500);
  await h.skipDialogue(8000);
  await h.eval(() => { const g = window.wyrm; g.save.found['story:sanctum:lesson-done'] = true; g.loadLevel('sanctum'); });
  await h.wait(2500);
  await h.skipDialogue();
  await h.eval(() => { const g = window.wyrm; g.player.place(46, 0.5, -1.2, Math.PI); });
  await h.wait(600);
  await h.tap('KeyF', 1, 600);
  const n = await page.locator('.lvl').count();
  h.check('trial menu lists trials', n >= 4, `${n}`);
  await h.shot('trials-menu');
  await page.locator('.lvl').first().click();
  await h.wait(2500);
  let s = await h.state();
  h.check('trial starts with enemies', s.enemies >= 3, JSON.stringify(s));
  await h.shot('trials-fight');
  // Win it quickly.
  for (let w = 0; w < 4; w++) {
    await h.eval(() => { for (const e of window.wyrm.enemies) if (e.alive && e.def.id !== 'dummy' && e.state !== 'spawn') e.hp = 0.5; });
    await h.tap('KeyX', 1, 100);
    await h.eval(() => { const g = window.wyrm; for (const e of g.enemies) if (e.alive && e.def.id !== 'dummy') e.die(null); });
    await h.wait(2200);
  }
  s = await h.state();
  const done = await h.eval(() => !!window.wyrm.save.found['trial:rush']);
  h.check('trial completes and pays out', done, JSON.stringify(s));
  await h.wait(2500);
  const dummies = await h.eval(() => window.wyrm.enemies.filter((e) => e.alive && e.def.id === 'dummy').length);
  h.check('dummies come back', dummies === 5, `${dummies}`);
}
