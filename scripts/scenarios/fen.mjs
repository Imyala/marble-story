export default async function (h) {
  await h.go('?level=fen&seed=7&quality=medium', 2500);
  await h.skipDialogue();
  await h.wait(600);
  let s = await h.state();
  h.check('in play after skipping intro', s.state === 'play', JSON.stringify(s));
  const z0 = s.z;
  await h.hold('KeyW', 1500);
  s = await h.state();
  h.check('walked', Math.hypot(s.z - z0, s.x) > 4, JSON.stringify(s));
  await h.shot('fen-walk');
  await h.page.keyboard.down('Space');
  await h.wait(250);
  s = await h.state();
  h.check('jumped', s.y > 1.5, JSON.stringify(s));
  await h.page.keyboard.up('Space');
  await h.wait(800);
  // Teleport to the willow arena to fight.
  await h.eval(() => { const g = window.wyrm; g.player.place(0, 4, 68, 0); });
  await h.wait(3000);
  s = await h.state();
  h.check('arena spawned enemies', s.enemies >= 2, JSON.stringify(s));
  await h.skipDialogue();
  await h.wait(400);
  await h.shot('fen-arena');
  for (let i = 0; i < 20; i++) { await h.tap('KeyJ', 1, 90); }
  await h.shot('fen-combo');
  s = await h.state();
  console.log('after combo', JSON.stringify(s));
}
