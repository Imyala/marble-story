/** A mid-fight screenshot at high quality, for judging combat readability. */
export default async function (h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 300; i++) {
      await h.wait(40);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.go('?level=sanctum&seed=3&quality=high&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  await h.eval(() => {
    const g = window.wyrm;
    g.player.place(0, 0.3, -6, 0);
    g.player.invuln = true;
    g.save.elements = ['fire', 'lightning'];
    g.player.element = 'fire';
    for (const [t, x, z] of [['grunt', -3, 2], ['grunt', 3, 1], ['slinger', 0, 8], ['drake', 5, 5], ['shieldbearer', -5, 5]]) {
      const e = g.spawnEnemy(t, x, 0.3, z, Math.PI, false);
      e.aggro = true;
    }
    g.cam.snapBehind(0, 0.3);
  });
  await waitGame(1.5);
  for (let i = 0; i < 6; i++) { await h.tap('KeyJ', 1, 90); }
  await waitGame(0.3);
  await h.shot('combat-look-1');
  await h.eval(() => window.wyrm.input.simulate('breath', true));
  await waitGame(0.8);
  await h.shot('combat-look-2');
  await h.eval(() => window.wyrm.input.simulate('breath', false));
}
