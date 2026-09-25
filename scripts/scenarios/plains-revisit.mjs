// Dying mid-fight restarts Graveljaw cleanly, and a finished realm reloads
// with the portal home, Stonehide free and no boss.
import { setup } from './plains-lib.mjs';

export default async function (h) {
  await h.go('?level=plains&seed=5&quality=low&maxdt=0.25', 3000);
  await h.skipDialogue();
  const t = await setup(h, { fast: true });
  await h.eval(() => { const g = window.wyrm; g.level.emit('canyon-door'); g.save.checkpoint = 'burrow'; g.save.level = 'plains'; });
  await t.tp(0, 243.5, 0);
  await h.wait(1500);
  await h.skipDialogue(8000);
  await h.wait(1500);
  const before = await h.eval(() => ({ boss: !!window.wyrm.boss, kids: window.wyrm.scene.children.length }));
  h.check('fight started', before.boss, JSON.stringify(before));
  // Die in the arena.
  await h.eval(() => { const p = window.wyrm.player; p.invuln = false; p.iframes = 0; p.hp = 1; p.takeHit({ damage: 50, type: 'physical', dirX: 0, dirZ: 1, knockback: 1, launch: 0, stagger: 0, hitstop: 0, buildup: 0, heavy: false, spike: false, source: 'env', move: 'test', fromPlayer: false, ox: 0, oz: 0 }, null); });
  await h.wait(6000);
  await t.settle();
  const after = await h.eval(() => {
    const g = window.wyrm;
    const barrier = g.level.props.find((p) => p.constructor.name === 'Barrier');
    return { boss: !!g.boss, kids: g.scene.children.length, barrier: barrier?.on, extra: g.cam.extraDist, x: g.player.x, z: g.player.z };
  });
  h.check('death despawns the worm and drops the barrier', !after.boss && after.barrier === false && after.kids < before.kids && after.extra === 0, JSON.stringify(after));
  // Walk back in: it comes straight back, no intro this time.
  await t.tp(0, 243.5, 0);
  await h.wait(2500);
  const again = await h.eval(() => ({ boss: !!window.wyrm.boss, awake: window.wyrm.boss?.awake, state: window.wyrm.state }));
  h.check('walking back in restarts the fight without the intro', again.boss && again.awake && again.state === 'play', JSON.stringify(again));

  // A finished realm.
  await h.eval(() => {
    const g = window.wyrm;
    g.save.levelsDone.plains = true;
    if (!g.save.elements.includes('earth')) g.learnElement('earth');
    g.loadLevel('plains', { checkpoint: 'burrow' });
  });
  await h.wait(2500);
  await h.skipDialogue();
  const done = await h.eval(() => {
    const g = window.wyrm;
    const l = g.level;
    return {
      boss: !!g.boss, portal: l.interactables.some((i) => i.target === 'sanctum'), stonehide: l.npcs.some((n) => n.id === 'stonehide'),
      door: l.fired.has('canyon-door'), state: g.state,
    };
  });
  h.check('a finished realm has the portal home, Stonehide and no boss', !done.boss && done.portal && done.stonehide && done.door && done.state === 'play', JSON.stringify(done));
  await h.eval(() => { const g = window.wyrm; g.renderer.gl.setPixelRatio(1); g.camera.far = 1200; g.camera.updateProjectionMatrix(); });
  await t.tp(0, 244, 0);
  await h.wait(2500);
  await h.shot('rv-canyon');
  await t.walkTo(0, 247.5, 0.6, 6);
  await h.wait(500);
  await h.page.keyboard.press('KeyF');
  await h.wait(1500);
  // Finishing the realm this visit shows the results card first.
  await h.skipDialogue(3000);
  await h.wait(2000);
  const home = await h.eval(() => window.wyrm.level.def.id);
  h.check('the portal takes you home', home === 'sanctum', home);
}
