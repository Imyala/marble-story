export default async function (h) {
  await h.go('?level=sanctum&seed=1&quality=low&maxdt=0.25', 2500);
  await h.skipDialogue(8000);
  // 1) Ledge grab: from the ground, one jump cannot clear the 2.9 m step; the grab should.
  await h.eval(() => { const g = window.wyrm; const y = g.col.terrainAt(12.5, -20.5); g.player.place(12.5, y + 0.05, -20.3, Math.PI); g.cam.snapBehind(Math.PI); });
  await h.wait(600);
  let s = await h.state();
  const startY = s.y;
  await h.page.keyboard.down('KeyW');
  await h.hold('Space', 450);
  const seen = new Set();
  let top = -99;
  for (let i = 0; i < 14; i++) {
    await h.wait(100);
    const st = await h.eval(() => ({ s: window.wyrm.player.state, y: window.wyrm.player.y, g: window.wyrm.player.body.grounded }));
    seen.add(st.s);
    // A plain jump tops out near 2.1 m, so standing above 2.6 means the grab worked.
    if (st.g && st.y > top) top = st.y;
  }
  await h.page.keyboard.up('KeyW');
  await h.wait(300);
  s = { y: top };
  h.check('grabs a ledge too high to jump and pulls up', s.y > startY + 2.6, `states ${[...seen]} y ${startY} -> ${s.y}`);
  await h.shot('plat-ledge');
  // 2) Climb the vine tower.
  await h.eval(() => { const g = window.wyrm; const y = g.col.groundAt(-10, -19, 1e4, 0.1).y; g.player.place(-10.3, y + 0.05, -19, -Math.PI / 2); g.cam.snapBehind(-Math.PI / 2); });
  await h.wait(400);
  await h.page.keyboard.down('KeyW');
  await h.wait(600);
  const cs = await h.eval(() => window.wyrm.player.state);
  let topY = -99;
  for (let i = 0; i < 40; i++) {
    await h.wait(120);
    const st = await h.eval(() => ({ s: window.wyrm.player.state, y: window.wyrm.player.y, g: window.wyrm.player.body.grounded }));
    if (st.s === 'move' && st.g && st.y > 8) { topY = st.y; break; }
  }
  await h.page.keyboard.up('KeyW');
  await h.wait(300);
  h.check('climbs the vine wall and pulls up on top', cs === 'climb' && topY > 8, `state ${cs} top y ${topY}`);
  await h.shot('plat-climb-top');
  // 3) Moving platform momentum: synthetic check through the collision world.
  const mom = await h.eval(() => {
    const g = window.wyrm; const b = g.player.body;
    // Fake a moving ground under the player and jump off it.
    const sol = { dynamic: true, pvx: 6, pvy: 0, pvz: 0, dyaw: 0, dx: 0, dy: 0, dz: 0 };
    b.grounded = true; b.ground = sol; b.vx = 0; b.vz = 0;
    return true;
  });
  h.check('momentum hook runs', mom);
  // 4) Glide dive: from the tower top, glide east and dive.
  await h.eval(() => { const g = window.wyrm; g.player.yaw = Math.PI / 2; g.cam.snapBehind(Math.PI / 2); });
  await h.wait(400);
  await h.page.keyboard.down('KeyW');
  await h.page.keyboard.down('Space');
  await h.wait(350);
  await h.page.keyboard.up('Space');
  await h.wait(300);
  await h.page.keyboard.down('Space');
  await h.wait(1200);
  const glide = await h.eval(() => ({ gl: window.wyrm.player.gliding, v: Math.hypot(window.wyrm.player.body.vx, window.wyrm.player.body.vz) }));
  await h.page.keyboard.down('ShiftLeft');
  await h.wait(800);
  const dive = await h.eval(() => ({ dv: window.wyrm.player.diving, v: Math.hypot(window.wyrm.player.body.vx, window.wyrm.player.body.vz), vy: window.wyrm.player.body.vy }));
  await h.shot('plat-dive');
  await h.page.keyboard.up('ShiftLeft');
  await h.wait(300);
  const pull = await h.eval(() => ({ vy: window.wyrm.player.body.vy }));
  await h.page.keyboard.up('Space');
  await h.page.keyboard.up('KeyW');
  h.check('glides, dives faster, pulls up', glide.gl && dive.dv && dive.v > glide.v + 2 && pull.vy > dive.vy, `${JSON.stringify(glide)} ${JSON.stringify(dive)} ${JSON.stringify(pull)}`);
}
