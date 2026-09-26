/**
 * The main quest line, worked out from the story state: what it says on a new
 * game, in the Fen with the fights won, after the Fen, at the Sanctum before
 * and after the fire lesson, in the Falls, back at the Sanctum between
 * realms, after the Keep, and through Act II's first gate: Mossa's rite
 * (twelve eggs), the Mycelium gate, the Deep and Mycora, and back to Mossa.
 * The HUD tracker shows it.
 */

async function waitGame(h, sec) {
  const start = await h.eval(() => window.wyrm.time);
  for (let i = 0; i < 300; i++) {
    await h.wait(50);
    if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
  }
}

const main = (h) => h.eval(() => { const m = window.wyrm.quests.main(); return { title: m.title, text: m.text, spot: m.spot && [m.spot.level, Math.round(m.spot.x), Math.round(m.spot.z)], done: m.chapters.filter((c) => c.done).length }; });

export default async function (h) {
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?seed=5&quality=low&maxdt=0.1', 2500);
  // A real new game, from the title.
  await h.eval(() => window.wyrm.newGame('normal'));
  await h.wait(2500);
  await h.skipDialogue(8000);
  await waitGame(h, 0.8);
  let m = await main(h);
  const tracker = await h.eval(() => document.querySelector('.quest-tracker')?.textContent ?? '');
  h.check('new game: the main quest sends Aster along the marsh path', m.title === 'The Gloom Comes to the Fen' && /marsh path/.test(m.text) && m.spot?.[0] === 'fen' && m.done === 0, JSON.stringify(m));
  h.check('the HUD tracker shows the main quest', /Gloom Comes to the Fen/.test(tracker) && /marsh path/.test(tracker), tracker);
  await h.shot('quests-main-newgame');
  // Options can put the tracker away (and bring it back).
  await h.eval(() => { const g = window.wyrm; g.options.questTracker = false; g.applyOptions(); });
  await waitGame(h, 0.5);
  const off = await h.eval(() => getComputedStyle(document.querySelector('.quest-tracker')).display);
  await h.eval(() => { const g = window.wyrm; g.options.questTracker = true; g.applyOptions(); });
  await waitGame(h, 0.5);
  const on = await h.eval(() => getComputedStyle(document.querySelector('.quest-tracker')).display);
  h.check('the Quest tracker option hides and shows the tracker', off === 'none' && on !== 'none', JSON.stringify({ off, on }));
  // Every fight in the Fen won: now it names the boss.
  await h.eval(() => { const g = window.wyrm; for (const a of g.level.arenas) a.state = 'cleared'; });
  m = await main(h);
  h.check('with the fights won, it says to defeat Bogmaw', /Defeat Bogmaw/.test(m.text) && m.spot?.[0] === 'fen', JSON.stringify(m));
  await waitGame(h, 0.5);
  const tr2 = await h.eval(() => document.querySelector('.quest-tracker p')?.textContent ?? '');
  h.check('the HUD tracker updates with it', /Defeat Bogmaw/.test(tr2), tr2);

  // After the Fen: to the Sanctum and the fire lesson.
  await h.eval(() => { const g = window.wyrm; g.save.levelsDone.fen = true; g.save.unlocked.push('sanctum'); });
  m = await main(h);
  h.check('after the Fen, in the Fen: return to the Sanctum', /Return to the Sanctum/.test(m.text), JSON.stringify(m));
  await h.eval(() => window.wyrm.loadLevel('sanctum', {}));
  await h.skipDialogue(8000);
  m = await main(h);
  h.check('at the Sanctum: learn Fire from Emberhold on the training grounds', /Learn Fire from Emberhold/.test(m.text) && m.spot?.[0] === 'sanctum' && m.done === 1, JSON.stringify(m));
  await h.eval(() => { const g = window.wyrm; g.save.found['story:sanctum:lesson-done'] = true; if (!g.save.unlocked.includes('falls')) g.save.unlocked.push('falls'); });
  m = await main(h);
  h.check('lesson done: take the Wardgate to Stormspire Falls', /Take the Wardgate to Stormspire Falls/.test(m.text) && m.spot?.[1] === 0 && m.spot?.[2] === 48, JSON.stringify(m));

  // In the Falls: reach the Warden, then the boss.
  await h.eval(() => window.wyrm.loadLevel('falls', {}));
  await h.skipDialogue(8000);
  m = await main(h);
  h.check('in the Falls: reach Stormcrest', /Reach Stormcrest, the Warden of Stormspire Falls/.test(m.text) && m.spot?.[0] === 'falls', JSON.stringify(m));
  await h.eval(() => { const g = window.wyrm; for (const a of g.level.arenas) a.state = 'cleared'; });
  m = await main(h);
  h.check('its fights won: defeat Skrieka', /Defeat Skrieka/.test(m.text), JSON.stringify(m));

  // Between realms: home, then on to the next one.
  await h.eval(() => { const g = window.wyrm; g.save.levelsDone.falls = true; g.save.unlocked.push('frostworks'); g.loadLevel('sanctum', {}); });
  await h.skipDialogue(8000);
  m = await main(h);
  h.check('back at the Sanctum: the Wardgate to the Frostworks', /Wardgate to the Frostworks/.test(m.text) && m.done === 3, JSON.stringify(m));

  // After the Keep.
  await h.eval(() => { const g = window.wyrm; for (const l of ['frostworks', 'plains', 'keep']) { g.save.levelsDone[l] = true; if (!g.save.unlocked.includes(l)) g.save.unlocked.push(l); } g.loadLevel('sanctum', {}); });
  await h.skipDialogue(8000);
  await waitGame(h, 0.6);
  m = await main(h);
  h.check('after the Keep: down through the fissure in the Sanctum', /split open in the Sanctum.*fissure/.test(m.text) && m.title === 'The Hollow Below' && m.done === 6 && m.spot?.[0] === 'sanctum', JSON.stringify(m));
  await h.shot('quests-main-after-keep');

  // Act II: the Hollow Gate, Mossa's rite, the Mycelium gate and the Deep.
  await h.eval(() => { const g = window.wyrm; g.save.unlocked.push('hollow'); g.save.found['story:hollow:arrive'] = true; return g.loadLevel('hollow', {}); });
  await h.skipDialogue(8000);
  await waitGame(h, 0.4);
  m = await main(h);
  h.check('in the Hollow: down to the Burrowfolk first', /Burrowfolk/.test(m.text) && m.spot?.[0] === 'hollow', JSON.stringify(m));
  // Mossa has told the rite; five eggs returned.
  await h.eval(() => {
    const f = window.wyrm.save.found;
    f['story:hollow:mossa'] = true;
    f['story:hollow:mossa-rite'] = true;
    for (let i = 0; i < 5; i++) f[`fen:egg-q${i}`] = true;
  });
  m = await main(h);
  h.check('after Mossa: return 12 dragon eggs to open the Mycelium gate (5/12), marked at the gate', m.text === 'Return 12 dragon eggs to open the Mycelium gate (5/12)' && m.spot?.[0] === 'hollow' && m.spot?.[1] === 100 && m.spot?.[2] === 16 && m.done === 7, JSON.stringify(m));
  await waitGame(h, 0.5);
  const trEggs = await h.eval(() => document.querySelector('.quest-tracker p')?.textContent ?? '');
  h.check('the tracker counts the eggs', /\(5\/12\)/.test(trEggs), trEggs);
  await h.eval(() => { const f = window.wyrm.save.found; for (let i = 5; i < 12; i++) f[`fen:egg-q${i}`] = true; });
  m = await main(h);
  h.check('with twelve: take them to the Mycelium gate', /12 eggs returned.*Mycelium gate/.test(m.text) && m.spot?.[1] === 100, JSON.stringify(m));
  await h.eval(() => { const g = window.wyrm; g.save.found['gate:mycelium'] = true; g.save.unlocked.push('mycelium'); });
  m = await main(h);
  h.check('the gate open: go through', m.text === 'The Mycelium gate is open: go through' && m.spot?.[0] === 'hollow', JSON.stringify(m));
  // Inside the Mycelium Deep (stood in for by this level's id and goals, so the realm's content does not matter).
  const inDeep = async (fightDone) => h.eval((fightDone) => {
    const g = window.wyrm;
    const lv = g.level;
    const def = lv.def;
    const goals = lv.goals.slice();
    lv.def = { ...def, id: 'mycelium' };
    lv.goals.length = 0;
    lv.goals.push({ x: 0, y: 0, z: 120, label: 'fight', done: () => fightDone }, { x: 0, y: 0, z: 204, label: 'boss', done: () => false });
    const mq = g.quests.main();
    lv.def = def;
    lv.goals.length = 0;
    lv.goals.push(...goals);
    return { title: mq.title, text: mq.text, spot: mq.spot && [mq.spot.level, Math.round(mq.spot.x), Math.round(mq.spot.z)] };
  }, fightDone);
  m = await inDeep(false);
  h.check('in the Deep: find what feeds the roots', m.text === 'Find what feeds the roots in the Mycelium Deep' && m.spot?.[0] === 'mycelium', JSON.stringify(m));
  m = await inDeep(true);
  h.check('its fights won: defeat Mycora at her grove (0, 204)', m.text === 'Defeat Mycora, the Spore Mother' && JSON.stringify(m.spot) === '["mycelium",0,204]', JSON.stringify(m));
  await h.eval(() => { window.wyrm.save.levelsDone.mycelium = true; });
  m = await main(h);
  h.check('Mycora fallen: return to Elder Mossa', m.text === 'Return to Elder Mossa' && m.spot?.[0] === 'hollow' && m.done === 8, JSON.stringify(m));
  await h.eval(() => { window.wyrm.save.found['story:hollow:mossa-mycelium'] = true; });
  m = await main(h);
  h.check('then: the Drowned City\'s gate still holds', /Drowned City's gate still holds/.test(m.text), JSON.stringify(m));
  await waitGame(h, 0.5);
  await h.shot('quests-main-act2');
}
