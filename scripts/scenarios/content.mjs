/** New content: breakables, chests, letters, eggs, per-realm counts and scales. */
export default async function (h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 150; i++) {
      await h.wait(60);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.go('?level=fen&seed=4&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  const setup = await h.eval(() => {
    const g = window.wyrm;
    const bs = g.level.hittables.filter((x) => x.constructor.name === 'Breakable');
    return { n: bs.length, kinds: [...new Set(bs.map((b) => b.kind))], secrets: g.level.secrets.map((s) => s.kind) };
  });
  h.check('breakables built', setup.n === 8, JSON.stringify(setup));
  // Smash the urns with horns.
  const gems0 = await h.eval(() => window.wyrm.save.gems);
  for (let i = 0; i < 3; i++) {
    await h.eval((i) => {
      const g = window.wyrm;
      const u = g.level.hittables.filter((x) => x.constructor.name === 'Breakable' && x.kind === 'urn' && x.alive)[0];
      if (!u) return;
      const y = g.col.groundAt(u.x - 1.6, u.z, 1e4, 0.1).y;
      g.player.place(u.x - 1.6, y + 0.05, u.z, Math.PI / 2);
    }, i);
    await waitGame(0.2);
    await h.eval(() => window.wyrm.input.simulate('horn', true));
    await waitGame(0.1);
    await h.eval(() => window.wyrm.input.simulate('horn', false));
    await waitGame(0.5);
  }
  await waitGame(1.5);
  const after = await h.eval(() => ({ urns: window.wyrm.level.hittables.filter((x) => x.constructor.name === 'Breakable' && x.kind === 'urn' && x.alive).length, gems: window.wyrm.save.gems }));
  h.check('horns smash urns and they spill gems', after.urns === 0 && after.gems > gems0, JSON.stringify(after) + ` gems before ${gems0}`);
  await h.shot('content-urns');
  // Crates take two hits (or one heavy).
  await h.eval(() => {
    const g = window.wyrm;
    const c = g.level.hittables.find((x) => x.constructor.name === 'Breakable' && x.kind === 'crate' && x.alive);
    const y = g.col.groundAt(c.x, c.z - 1.8, 1e4, 0.1).y;
    g.player.place(c.x, y + 0.05, c.z - 1.8, 0);
    window.__crate = c;
  });
  await waitGame(0.2);
  await h.eval(() => window.wyrm.input.simulate('tail', true));
  await waitGame(0.1);
  await h.eval(() => window.wyrm.input.simulate('tail', false));
  await waitGame(0.8);
  h.check('a tail whip breaks a crate', await h.eval(() => !window.__crate.alive));
  // The chest opens once and remembers.
  await h.eval(() => {
    const g = window.wyrm;
    const y = g.col.groundAt(-2.5, -14.8, 1e4, 0.1).y;
    g.player.place(-2.5, y + 0.05, -14.8, 0);
  });
  await waitGame(0.2);
  await h.eval(() => window.wyrm.input.simulate('horn', true));
  await waitGame(0.1);
  await h.eval(() => window.wyrm.input.simulate('horn', false));
  await waitGame(1.2);
  h.check('the chest opens and is remembered', await h.eval(() => !!window.wyrm.save.found['fen:chest:hollow']));
  await h.shot('content-chest');
  // Letter: walk into it; the card shows its text.
  await h.eval(() => { const g = window.wyrm; g.player.place(-11.2, g.col.groundAt(-11.2, -19.8, 1e4, 0.1).y + 0.05, -19.8, 0); });
  await waitGame(0.4);
  const letter = await h.eval(() => ({ found: !!window.wyrm.save.found['letter:fen:glimmer'], card: document.querySelector('.relic-card.letter h2')?.textContent ?? '' }));
  h.check('picking up a letter shows it and saves it', letter.found && letter.card.includes('Raft'), JSON.stringify(letter));
  await h.shot('content-letter');
  // Egg.
  await h.eval(() => { const g = window.wyrm; g.player.place(14.5, g.col.groundAt(14.5, -8.5, 1e4, 0.1).y + 0.05, -8.5, 0); });
  await waitGame(0.4);
  const egg = await h.eval(() => !!window.wyrm.save.found['fen:egg-hollow']);
  h.check('the lost egg is collected', egg);
  // Pause shows this realm's counts; Scales lists the skins.
  await h.eval(() => window.wyrm.pause());
  await h.wait(400);
  const sub = await h.eval(() => document.querySelector('.panel .sub')?.textContent ?? '');
  h.check('pause counts eggs and letters', sub.includes('eggs 1/') && sub.includes('letters 1/'), sub);
  await h.shot('content-pause');
}
