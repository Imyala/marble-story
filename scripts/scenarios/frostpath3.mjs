// Frostworks part 3: Upper Works arena and puzzles, the later-element secrets, the lever relic.
import { place, clearArena, gateAlive, grounded, elem, waitGame, holdGame, clearNear } from './frostlib.mjs';

const found = (h, id) => h.eval((id) => !!window.wyrm.save.found[`frostworks:${id}`], id);

async function breatheAt(h, x, z, yaw, y, secs) {
  await place(h, x, z, yaw, y);
  await h.eval(() => { window.wyrm.player.mana = 100; window.wyrm.player.lock = null; });
  await holdGame(h, ['KeyK'], secs);
}

export default async function (h) {
  await h.go('?level=frostworks&seed=3&quality=low&maxdt=0.06', 3000);
  await h.skipDialogue();
  await h.eval(() => { const g = window.wyrm; for (const e of ['fire', 'lightning']) if (!g.save.elements.includes(e)) g.learnElement(e); g.player.invuln = true; });

  // Lever relic: from the beam, jump + flap up onto the axle cap.
  await place(h, 6, 186, 0, 7);
  let r = await grounded(h);
  h.check('lever axle cap is solid at 6.7', r.grounded && Math.abs(r.y - 6.7) < 0.1, JSON.stringify(r));
  await waitGame(h, 0.4);
  h.check('relic frost2 on the lever axle', await found(h, 'relic2'));

  // Upper Works arena.
  await place(h, 19, 201, -0.8);
  await holdGame(h, ['KeyW'], 1.4);
  await waitGame(h, 1);
  await h.skipDialogue();
  let s = await h.state();
  h.check('anvil arena starts', s.enemies >= 3, JSON.stringify(s));
  await h.shot('fp3-anvil');
  h.check('anvil arena clears', await clearArena(h, 'anvil'));
  await clearNear(h, 8, 205, 40);

  // Timed braziers: too slow and they go out; quick and the drafting room opens.
  await elem(h, 'Digit1');
  const torches = [[-1, 206.3, Math.PI], [-1, 214.2, 0], [-3.8, 217.6, -Math.PI / 2]];
  await breatheAt(h, torches[0][0], torches[0][1], torches[0][2], 12.5, 0.6);
  await waitGame(h, 7);
  const lit1 = await h.eval(() => window.wyrm.level.hittables.filter((t) => t.constructor.name === 'Torch' && t.group === 'drafting' && t.lit).length);
  h.check('timed brazier burns out', lit1 === 0, String(lit1));
  for (const [x, z, yaw] of torches) await breatheAt(h, x, z, yaw, 12.5, 0.6);
  await waitGame(h, 0.3);
  const opened = await h.eval(() => window.wyrm.level.fired.has('drafting'));
  h.check('lighting all three in time opens the drafting room', opened);
  await waitGame(h, 1.8);
  await place(h, 0, 210, -Math.PI / 2, 12.5);
  await holdGame(h, ['KeyW'], 0.9);
  h.check('relic frost3 in the drafting room', await found(h, 'relic3'));
  await h.shot('fp3-drafting');

  // Coolant vault: fire does nothing, the jet throws you up, Ice freezes it open.
  await breatheAt(h, 17.5, 212, 0, 12.5, 0.6);
  h.check('vault stays shut without Ice', !(await h.eval(() => window.wyrm.level.fired.has('vault'))));
  await place(h, 17.5, 215, 0, 12.5);
  await waitGame(h, 0.3);
  r = await grounded(h);
  h.check('the coolant jet throws the dragon up', r.y > 13, JSON.stringify(r));
  await waitGame(h, 2);
  await h.eval(() => window.wyrm.learnElement('ice'));
  console.log('pre-ice', JSON.stringify(await h.eval(() => { const g = window.wyrm; const p = g.player; return { st: p.state, el: p.element, y: p.y, gs: g.state, mana: p.mana }; })));
  await breatheAt(h, 17.5, 212, 0, 12.5, 2.5);
  console.log('post-ice', JSON.stringify(await h.eval(() => { const g = window.wyrm; const p = g.player; const gz = g.level.hittables.find((t) => t.constructor.name === 'Geyser'); return { st: p.state, el: p.element, x: p.x, y: p.y, z: p.z, yaw: p.yaw, gs: g.state, mana: p.mana, chill: gz.chill, frozen: gz.frozen }; })));
  const frozen = await h.eval(() => window.wyrm.level.fired.has('vault'));
  h.check('Ice freezes the geyser and opens the vault', frozen);
  await waitGame(h, 1.8);
  h.check('vault door open', !(await gateAlive(h, 19.8, 210)));
  await place(h, 17.5, 210, Math.PI / 2, 12.5);
  await holdGame(h, ['KeyW'], 0.8);
  h.check('mana2 in the vault', await found(h, 'mana2'));
  await h.shot('fp3-vault');
  // Frozen geyser is a pillar you can stand on.
  await place(h, 17.5, 215, 0, 20);
  r = await grounded(h);
  h.check('frozen geyser is a standable pillar', r.grounded && r.y > 16, JSON.stringify(r));

  // Earth breaks the storehouse rock in the Lower Works.
  await clearNear(h, 0, 90, 35);
  await elem(h, 'Digit3');
  await place(h, 7, 99, Math.PI / 2, 4);
  await h.tap('KeyU', 1, 300);
  await waitGame(h, 1);
  h.check('Ice cannot break the cracked rock', await gateAlive(h, 11.2, 99) === true);
  await h.eval(() => window.wyrm.learnElement('earth'));
  console.log('pre-earth', JSON.stringify(await h.eval(() => { const g = window.wyrm; const p = g.player; return { st: p.state, el: p.element, x: p.x, y: p.y, z: p.z, gs: g.state }; })));
  for (let i = 0; i < 3 && (await gateAlive(h, 11.2, 99)) === true; i++) {
    await place(h, 6.5, 99, Math.PI / 2, 4);
    await h.eval(() => { window.wyrm.player.mana = 100; });
    await h.tap('KeyU', 1, 300);
    await waitGame(h, 1.2);
  }
  h.check('Earth boulder breaks the storehouse rock', !(await gateAlive(h, 11.2, 99)));
  await place(h, 8, 99, Math.PI / 2, 4);
  await holdGame(h, ['KeyW'], 0.8);
  h.check('heart2 behind the cracked rock', await found(h, 'heart2'));
  await h.shot('fp3-heart2');

  // Crucible wardstone and the bridge.
  await place(h, -1, 216, 0, 12.5);
  await holdGame(h, ['KeyW'], 0.5);
  const cp = await h.eval(() => window.wyrm.save.checkpoint);
  h.check('wardstone "crucible" activates on the way to the bridge', cp === 'crucible', cp);
  await place(h, 0, 221, 0, 12.5);
  await holdGame(h, ['KeyW'], 0.9);
  r = await grounded(h);
  h.check('crossed the chain bridge', r.grounded && r.z > 228 && r.y > 11.8, JSON.stringify(r));
  const total = await h.eval(() => Object.keys(window.wyrm.save.found).filter((k) => k.startsWith('frostworks:') && !k.startsWith('frostworks:arena')).length);
  console.log('collectibles found this run', total);
}
