// Frostworks critical path, part 1: landing, ice walls, floes, Lower Works.
import { place, clearArena, gateAlive, grounded, elem, clearNear, holdGame, waitGame, jump } from './frostlib.mjs';

export default async function (h) {
  await h.go('?level=frostworks&seed=1&quality=low&maxdt=0.06', 3000);
  let s = await h.state();
  h.check('intro dialogue plays', s.state === 'dialogue', JSON.stringify(s));
  await h.shot('fp1-intro');
  await h.skipDialogue();
  await h.eval(() => { const g = window.wyrm; for (const e of ['fire', 'lightning']) if (!g.save.elements.includes(e)) g.learnElement(e); g.player.invuln = true; });
  const gol = await h.eval(() => {
    const g = window.wyrm;
    const e = g.enemies.find((e) => e.def.id === 'frostGolem');
    if (!e) return null;
    return { fire: e.def.resist.fire, ice: e.def.resist.ice, x: +e.x.toFixed(1), y: +e.y.toFixed(2), z: +e.z.toFixed(1), grounded: e.body.grounded };
  });
  h.check('hollow golem present, weak to fire, immune to ice', !!gol && gol.fire > 1 && gol.ice === 0, JSON.stringify(gol));
  await clearNear(h, 0, 38, 20);

  // The ice wall blocks the pass.
  await place(h, 0, 15.5, 0);
  await holdGame(h, ['KeyW'], 1.2);
  s = await h.state();
  h.check('ice wall blocks the pass', s.z < 19, JSON.stringify(s));
  // Melt it with fire breath.
  await elem(h, 'Digit1');
  await place(h, 0, 16, 0);
  await holdGame(h, ['KeyK'], 2.5);
  let alive = await gateAlive(h, 0, 19.5);
  if (alive) {
    await h.eval(() => { window.wyrm.player.mana = 100; });
    await h.tap('KeyU', 2, 900);
    await waitGame(h, 1);
    alive = await gateAlive(h, 0, 19.5);
  }
  h.check('fire melts the ice wall', !alive);
  await h.shot('fp1-melted');
  await h.eval(() => { window.wyrm.player.mana = 100; });
  await holdGame(h, ['KeyW'], 1.2);
  s = await h.state();
  h.check('walked through the pass', s.z > 23 && s.state === 'play', JSON.stringify(s));

  // Grotto relic behind a second ice wall.
  await place(h, -12, 7, 0);
  const gy = (await grounded(h)).y;
  h.check('grotto sits on dry land', gy > 1, String(gy));
  await h.eval(() => { window.wyrm.player.mana = 100; });
  await holdGame(h, ['KeyK'], 2.5);
  alive = await gateAlive(h, -12, 10.6);
  if (alive) {
    await h.eval(() => { window.wyrm.player.mana = 100; });
    await h.tap('KeyU', 2, 900);
    await waitGame(h, 1);
    alive = await gateAlive(h, -12, 10.6);
  }
  h.check('grotto ice melts', !alive);
  await holdGame(h, ['KeyW'], 1.2);
  console.log('grotto pos', JSON.stringify(await grounded(h)));
  let found = await h.eval(() => !!window.wyrm.save.found['frostworks:relic1']);
  h.check('relic frost1 collected in the grotto', found);
  await h.shot('fp1-grotto');

  // Floes: every floe holds the dragon.
  const floes = [[0, 62.8], [0.5, 68.8], [0, 80.5], [-4.5, 74], [-10.5, 73.2], [-16.5, 72.4]];
  let okAll = true;
  for (const [x, z] of floes) {
    await place(h, x, z, 0, 1.3);
    await waitGame(h, 0.1);
    const g1 = await grounded(h);
    if (!(g1.grounded && Math.abs(g1.y - 1.0) < 0.15)) { okAll = false; console.log('floe fail', x, z, JSON.stringify(g1)); }
  }
  h.check('all floes are standable at y=1.0', okAll);
  await waitGame(h, 5);
  // Real input: jump from the jetty onto the first floe, then on to the second.
  await clearNear(h, 0, 70, 20);
  await place(h, 0, 57, 0);
  await waitGame(h, 0.3);
  let g2 = await jump(h, ['KeyW'], 0.1, 0.05);
  console.log('after jump 1', JSON.stringify(g2));
  h.check('jumped from the jetty onto floe 1', g2.z > 60.7 && g2.z < 64.9 && g2.y > 0.8, JSON.stringify(g2));
  await h.shot('fp1-floe');
  g2 = await jump(h, ['KeyW'], 0.3, 0.05);
  console.log('after jump 2', JSON.stringify(g2));
  h.check('jumped from floe 1 onto floe 2', g2.z > 66.7 && g2.z < 70.9 && g2.y > 0.8, JSON.stringify(g2));
  // Standing still makes it crack and sink: the dragon is put back on safe ground.
  await waitGame(h, 3);
  s = await h.state();
  console.log('after crack', JSON.stringify(s));
  h.check('floe cracked and dragon was put back on safe ground', s.state === 'play' && s.y > 1.5, JSON.stringify(s));
  // Mana islet.
  await place(h, -24, 71, 0);
  await waitGame(h, 0.4);
  found = await h.eval(() => !!window.wyrm.save.found['frostworks:mana1']);
  h.check('mana1 on the lake islet', found);

  // Lower Works arena and the lightning gate.
  await place(h, 1.5, 88, 0);
  await waitGame(h, 0.4);
  const ws = await h.eval(() => window.wyrm.save.checkpoint);
  h.check('wardstone "works" activates', ws === 'works', String(ws));
  await place(h, -2, 97, 0);
  await waitGame(h, 1.2);
  await h.skipDialogue();
  s = await h.state();
  h.check('kilnyard arena starts', s.enemies >= 3, JSON.stringify(s));
  await h.shot('fp1-kilnyard');
  const cleared = await clearArena(h, 'kilnyard');
  h.check('kilnyard arena clears', cleared);
  await elem(h, 'Digit2');
  await place(h, -8, 104.5, 0);
  await h.eval(() => { window.wyrm.player.mana = 100; });
  await holdGame(h, ['KeyK'], 1.0);
  await waitGame(h, 1.8);
  const fired = await h.eval(() => window.wyrm.level.fired.has('forge-gate'));
  h.check('lightning switch powers the forge gate', fired);
  alive = await gateAlive(h, 0, 112.25);
  h.check('forge gate opened', !alive);
  await place(h, 0, 108, 0);
  await holdGame(h, ['KeyW'], 1.2);
  s = await h.state();
  h.check('walked into the Molten Hall', s.z > 114 && s.y > 3, JSON.stringify(s));
  await h.shot('fp1-hall');
}
