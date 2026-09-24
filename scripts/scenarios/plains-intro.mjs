// The realm intro and the Graveljaw intro, one screenshot per line.
export default async function (h) {
  await h.go('?level=plains&seed=4&quality=low&maxdt=0.25', 2500);
  for (let i = 0; i < 4; i++) {
    await h.wait(1200);
    await h.shot(`in-realm-${i}`);
    await h.page.keyboard.press('Space');
    await h.wait(150);
    await h.page.keyboard.press('Space');
  }
  await h.skipDialogue();
  await h.eval(() => {
    const g = window.wyrm;
    for (const e of g.enemies) { e.alive = false; e.dispose(); }
    g.enemies = [];
    g.level.emit('canyon-door');
    g.player.place(0, 2, 244, 0);
    g.cam.snapBehind(0);
  });
  for (let i = 0; i < 6; i++) {
    await h.wait(1500);
    const st = await h.eval(() => window.wyrm.state);
    console.log('state', st, JSON.stringify(await h.state()));
    if (st !== 'dialogue') break;
    await h.shot(`in-boss-${i}`);
    await h.page.keyboard.press('Space');
    await h.wait(150);
    await h.page.keyboard.press('Space');
  }
}
