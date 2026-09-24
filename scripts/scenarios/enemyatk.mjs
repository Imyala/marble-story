export default async function (h) {
  await h.go('?level=fen&seed=7&quality=low&maxdt=0.25', 2500);
  await h.tap('Escape');
  await h.wait(500);
  await h.eval(() => {
    const g = window.wyrm;
    g.player.place(0, 1.2, 0, 0);
    const e = g.spawnEnemy('grunt', 0, 1.2, 1.8, Math.PI, false);
    e.aggro = true;
    window.__e = e;
  });
  for (let i = 0; i < 12; i++) {
    await h.wait(400);
    const r = await h.eval(() => { const e = window.__e; const g = window.wyrm; return `${e.state} t=${e.stateT.toFixed(2)} tok=${e.hasToken} cd=${e.globalCd?.toFixed?.(2)} d=${e.distToPlayer().toFixed(2)} php=${g.player.hp} pst=${g.player.state} gs=${g.state}`; });
    console.log(r);
  }
}
