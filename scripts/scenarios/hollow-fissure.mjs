/**
 * Getting to Act II: the fissure opens in the Warden Sanctum only once Eclipse
 * Keep is won; its portal leads down to the Hollow Gate (intro with Nyxa), which
 * then joins the Wardgate's list and has a way back up.
 *   node scripts/play.mjs hollow-fissure
 */
import { act2Save, boot, place, step, press, pos, shot, skip } from './hollow-lib.mjs';

const fissurePortal = (h) => h.eval(() => {
  const p = window.wyrm.level.interactables.find((i) => i.target === 'hollow');
  return p ? { x: p.x, y: p.y, z: p.z, label: p.label } : null;
});

export default async function (h) {
  // Before the Keep: no crack in the lawn.
  const before = act2Save();
  delete before.levelsDone.keep;
  before.clears = 0;
  await boot(h, 'sanctum', { save: before });
  h.check('no fissure before Eclipse Keep is won', (await fissurePortal(h)) === null);
  h.check('no Hollow Gate on the Wardgate yet', !(await h.eval(() => {
    window.wyrm.menus.showTravel();
    const t = document.body.innerText.includes('The Hollow Gate');
    window.wyrm.resume();
    return t;
  })));

  // After the Keep: the ground has split, and Flick says so.
  await boot(h, 'sanctum', { intro: true });
  const portal = await fissurePortal(h);
  const told = await h.eval(() => ({ key: !!window.wyrm.save.found['story:sanctum:fissure'], line: document.querySelector('.flick p')?.textContent ?? '' }));
  h.check('the fissure opens once the Keep is done', !!portal, JSON.stringify(portal));
  h.check('Flick points it out the first time', told.key && /split open/.test(told.line), JSON.stringify(told));
  await place(h, 0, -10, Math.PI, undefined, 0.35);
  await step(h, 0.5);
  await shot(h, 'hollow-fissure-courtyard', false);
  await place(h, 3.5, -18, Math.PI * 1.1, undefined, 0.25);
  await step(h, 0.5);
  await shot(h, 'hollow-fissure-close', false);

  // Down through it.
  await place(h, portal.x - 1.2, portal.z + 2.2, Math.PI);
  await step(h, 0.2);
  const prompt = await h.eval(() => document.querySelector('.prompt')?.textContent ?? '');
  await press(h, 'interact', 0.15);
  for (let i = 0; i < 30; i++) {
    await step(h, 0.1);
    if ((await h.eval(() => window.wyrm.level?.def.id)) === 'hollow' && (await h.eval(() => window.wyrm.state)) !== 'transition') break;
  }
  const arrive = await h.eval(() => {
    const g = window.wyrm;
    return { level: g.level?.def.id, state: g.state, speaker: g.dialogueSpeaker, nyxa: g.level?.npcs.some((n) => n.id === 'nyxa'), unlocked: g.save.unlocked.includes('hollow') };
  });
  h.check('the portal says where it goes', /Hollow Below/.test(prompt), prompt);
  h.check('it leads down to the Hollow Gate', arrive.level === 'hollow' && arrive.unlocked, JSON.stringify(arrive));
  h.check('where Aster, Flick and Nyxa talk it over', arrive.state === 'dialogue' && arrive.nyxa, JSON.stringify(arrive));
  await step(h, 0.6);
  await shot(h, 'hollow-intro');
  // Talk through to Nyxa's line, then skip the rest.
  let heardNyxa = false;
  for (let i = 0; i < 10; i++) {
    if ((await h.eval(() => window.wyrm.dialogueSpeaker)) === 'nyxa') heardNyxa = true;
    await press(h, 'confirm', 0.05);
    await h.eval(() => window.wyrm.dialogue.advance());
    await step(h, 0.2);
  }
  await skip(h);
  const after = await h.eval(() => ({ state: window.wyrm.state, nyxa: window.wyrm.level.npcs.length }));
  h.check('Nyxa speaks in the scene', heardNyxa);
  h.check('then goes her own way (no Nyxa left standing)', after.state === 'play' && after.nyxa === 0, JSON.stringify(after));
  h.check('a way back up to the Sanctum', await h.eval(() => window.wyrm.level.interactables.some((i) => i.target === 'sanctum')));
  const listed = await h.eval(() => {
    window.wyrm.menus.showTravel();
    const t = [...document.querySelectorAll('.levels button h3')].map((e) => e.textContent);
    window.wyrm.resume();
    return t;
  });
  h.check('the Wardgate now lists the Hollow Gate', listed.includes('The Hollow Gate'), JSON.stringify(listed));
  await step(h, 0.3);
  console.log('arrived at', JSON.stringify(await pos(h)));
}
