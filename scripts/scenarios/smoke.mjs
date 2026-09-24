/** End-to-end smoke test of the built game: title -> new game -> play -> menus. */
export default async function (h) {
  const page = h.page;
  await page.addInitScript(() => localStorage.clear());
  await h.go('?seed=11&quality=low&maxdt=0.25', 3000);
  const title = await page.locator('.title-screen h1').textContent();
  h.check('title screen', title === 'WYRMLING', title);
  await h.shot('smoke-title');
  await page.getByRole('button', { name: /new game/i }).click();
  await page.getByRole('button', { name: /adventurer/i }).click();
  await h.wait(1500);
  await h.shot('smoke-prologue');
  // Esc skips the prologue straight into the game.
  await page.keyboard.press('Escape');
  await h.wait(4000);
  let s = await h.state();
  h.check('new game starts in the fen', s.level === 'fen', JSON.stringify(s));
  await h.skipDialogue();
  s = await h.state();
  h.check('intro dialogue ends in play', s.state === 'play', JSON.stringify(s));
  const z0 = s.z;
  await h.hold('KeyW', 1500);
  s = await h.state();
  h.check('player moves', Math.abs(s.z - z0) > 3, `z ${z0} -> ${s.z}`);
  await h.tap('KeyJ', 3, 250);
  await h.shot('smoke-play');
  // Pause menu and the abilities screen.
  await page.keyboard.press('Escape');
  await h.wait(500);
  s = await h.state();
  h.check('pause opens', s.state === 'pause', s.state);
  await page.getByRole('button', { name: /abilities/i }).click();
  await h.wait(400);
  const cards = await page.locator('.card').count();
  h.check('abilities screen lists upgrades', cards >= 3, `${cards} cards`);
  await h.shot('smoke-abilities');
  await page.keyboard.press('Escape');
  await h.wait(300);
  await page.getByRole('button', { name: /resume/i }).click();
  await h.wait(400);
  s = await h.state();
  h.check('resume returns to play', s.state === 'play', s.state);
  const saved = await h.eval(() => !!localStorage.getItem('wyrmling.save.v1'));
  h.check('progress is saved', saved);
  // Jump to the hub and check the fire lesson starts.
  await h.eval(() => window.wyrm.travel('sanctum'));
  await h.wait(3000);
  s = await h.state();
  h.check('travel to the sanctum', s.level === 'sanctum', JSON.stringify(s));
  await h.skipDialogue(6000);
  const fire = await h.eval(() => window.wyrm.save.elements.includes('fire'));
  h.check('fire learned in the sanctum', fire);
  await h.shot('smoke-sanctum');
}
