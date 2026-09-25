/** Close-ups of skinned rigs mid-animation: the dragon, a Gloomling, a drake and a Warden NPC. */
export default async function (h) {
  await h.go('?level=sanctum&seed=5&quality=high&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  await h.eval(() => {
    const g = window.wyrm;
    g.hud.show(false);
    g.player.place(0, 0.3, -8, 0);
    g.player.invuln = true;
    const a = g.spawnEnemy('grunt', -1.6, 0.3, -5, Math.PI, false); a.aggro = true;
    const d = g.spawnEnemy('drake', 2.2, 0.3, -4.5, Math.PI, false); d.aggro = true;
    const THREE = g.camera.position.constructor;
    g.cam.setShot(new THREE(4.5, 2.6, -11), new THREE(0, 1, -6));
  });
  await h.wait(1500);
  await h.shot('rig-idle');
  await h.eval(() => window.wyrm.input.simulate('horn', true));
  await h.wait(100);
  await h.eval(() => window.wyrm.input.simulate('horn', false));
  await h.wait(180);
  await h.shot('rig-attack');
  await h.eval(() => { const g = window.wyrm; g.input.simulate('jump', true); });
  await h.wait(250);
  await h.eval(() => { const g = window.wyrm; g.input.simulate('jump', false); });
  await h.wait(120);
  await h.eval(() => { const g = window.wyrm; g.input.simulate('jump', true); });
  await h.wait(500);
  await h.shot('rig-glide');
  await h.eval(() => window.wyrm.input.simulate('jump', false));
}
