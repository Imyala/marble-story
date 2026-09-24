export default async function (h) {
  await h.go('?level=sanctum&seed=1&quality=medium&maxdt=0.25', 2500);
  await h.skipDialogue();
  const views = [['behind', 0, 2.2, -3.2], ['side', 3.4, 1.6, 0.2], ['front', 0.5, 1.6, 3.4]];
  for (const [name, dx, dy, dz] of views) {
    await h.eval(([dx, dy, dz]) => {
      const g = window.wyrm; const THREE = g.camera.position.constructor;
      g.player.place(-30, 3.1, -24, 0);
      g.hud.show(false);
      g.flick.root.visible = false;
      g.cam.setShot(new THREE(-30 + dx, 3.1 + dy, -24 + dz), new THREE(-30, 3.1 + 0.8, -24));
    }, [dx, dy, dz]);
    await h.wait(2500);
    await h.shot(`close-${name}`);
  }
}
