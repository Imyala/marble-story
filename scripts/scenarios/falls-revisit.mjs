// Stormspire Falls after Skrieka: no boss, a portal home on the spire top,
// and Stormcrest waiting in the Sanctum.
import { boot, place, step, shot, skip, snap } from './falls-lib.mjs';

export default async function (h) {
  await boot(h);
  await h.eval(() => {
    const g = window.wyrm;
    g.save.levelsDone.falls = true;
    if (!g.save.elements.includes('lightning')) g.learnElement('lightning');
    if (!g.save.unlocked.includes('sanctum')) g.save.unlocked.push('sanctum');
    g.save.found['story:sanctum:arrive'] = true;
    g.save.found['story:sanctum:lesson-done'] = true;
    g.loadLevel('falls', { checkpoint: null });
  });
  await step(h, 0.5);
  await skip(h);
  const info = await h.eval(() => {
    const g = window.wyrm;
    return {
      portals: g.level.props.filter((p) => p.constructor.name === 'Portal').map((p) => [+p.x.toFixed(1), +p.y.toFixed(1), +p.z.toFixed(1), p.target]),
      barriers: g.level.props.filter((p) => p.constructor.name === 'Barrier' && p.on).length,
      npcs: g.level.npcs.map((n) => n.id),
    };
  });
  h.check('no boss arena or caged warden on a revisit', info.barriers === 0 && info.npcs.length === 0, JSON.stringify(info));
  h.check('a portal home waits on the spire', info.portals.length === 1 && info.portals[0][3] === 'sanctum', JSON.stringify(info.portals));
  const [px, py, pz] = info.portals[0];
  await place(h, px, pz - 5, 0);
  await step(h, 3);
  const s = await snap(h);
  h.check('the spire top stays quiet', s.state === 'play' && !(await h.eval(() => !!window.wyrm.boss)), JSON.stringify(s));
  await shot(h, 'revisit-portal');
  await place(h, px, pz - 2.2, 0);
  await h.page.keyboard.press('KeyF');
  for (let i = 0; i < 10; i++) {
    await step(h, 0.3);
    // Finishing the realm this visit shows the results card first.
    await h.eval(() => document.querySelector('.panel.results button')?.click());
    if (await h.eval(() => window.wyrm.level?.def.id === 'sanctum')) break;
  }
  await step(h, 0.5);
  const lv = await h.eval(() => ({ level: window.wyrm.level.def.id, state: window.wyrm.state, npcs: window.wyrm.level.npcs.map((n) => n.id) }));
  h.check('portal returns to the Sanctum', lv.level === 'sanctum', JSON.stringify(lv));
  h.check('Stormcrest is home in the Sanctum', lv.npcs.includes('stormcrest'), JSON.stringify(lv));
  void py;
  await shot(h, 'revisit-sanctum');
  await skip(h, 20);
}
