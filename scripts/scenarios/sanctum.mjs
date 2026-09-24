export default async function (h) {
  await h.go('?level=sanctum&seed=3&quality=low&maxdt=0.25', 3000);
  await h.shot('sanctum-arrive');
  await h.skipDialogue();
  await h.wait(800);
  let s = await h.state();
  const el = await h.eval(() => ({ el: window.wyrm.player.element, owned: window.wyrm.save.elements }));
  h.check('learned fire', el.el === 'fire', JSON.stringify(el) + JSON.stringify(s));
  await h.shot('sanctum-court');
  // Breathe fire at a dummy.
  await h.eval(() => {
    const g = window.wyrm;
    g.player.place(46, 0.5, -4, 0);
    g.cam.snapBehind(0);
    window.__d = g.enemies.find((e) => e.def.id === 'dummy' && Math.hypot(e.x - 42, e.z) < 1);
  });
  await h.wait(500);
  await h.eval(() => { const g = window.wyrm; const d = window.__d; g.player.yaw = Math.atan2(d.x - g.player.x, d.z - g.player.z); });
  const d0 = await h.eval(() => window.__d.hp);
  await h.page.keyboard.down('KeyK');
  await h.wait(900);
  await h.shot('sanctum-breath');
  await h.wait(700);
  await h.page.keyboard.up('KeyK');
  const d1 = await h.eval(() => ({ hp: window.__d.hp, burn: window.__d.status.burn, alive: window.__d.alive }));
  s = await h.state();
  h.check('fire breath burns dummy', d1.hp < d0 || !d1.alive, `${d0} -> ${JSON.stringify(d1)} mana ${s.mana}`);
  // Fireball.
  await h.tap('KeyU', 1, 250);
  await h.shot('sanctum-fireball');
  await h.wait(800);
  // Light all four lesson torches.
  const torches = [[38, -4], [54, -4], [38, 12], [54, 12]];
  for (const [tx, tz] of torches) {
    await h.eval(([x, z]) => { const g = window.wyrm; g.player.place(x, 0.5, z - 3.2, 0); g.player.yaw = 0; g.player.lock = null; }, [tx, tz]);
    await h.wait(300);
    await h.page.keyboard.down('KeyK');
    await h.wait(900);
    await h.page.keyboard.up('KeyK');
    await h.eval(() => { window.wyrm.player.mana = 100; });
  }
  await h.wait(1000);
  s = await h.state();
  const done = await h.eval(() => !!window.wyrm.save.found['story:sanctum:lesson-done']);
  h.check('torch lesson complete', done, JSON.stringify(s));
  await h.shot('sanctum-lesson');
  await h.skipDialogue();
  // Fury.
  await h.eval(() => { const g = window.wyrm; g.player.fury = 100; g.player.place(46, 0.5, 4, 0); });
  await h.wait(300);
  await h.tap('KeyX', 1, 900);
  await h.shot('sanctum-fury');
  await h.wait(2500);
  s = await h.state();
  h.check('fury used', s.fury < 50, JSON.stringify(s));
}
