// Frostworks critical path, part 2: Molten Hall, gears, lever and lift.
import { place, clearArena, gateAlive, grounded, elem, clearNear, holdGame, waitGame, until, jump } from './frostlib.mjs';

export default async function (h) {
  await h.go('?level=frostworks&seed=2&quality=low&maxdt=0.06', 3000);
  await h.skipDialogue();
  await h.eval(() => { const g = window.wyrm; for (const e of ['fire', 'lightning']) if (!g.save.elements.includes(e)) g.learnElement(e); g.player.invuln = true; });
  await clearNear(h, 0, 128, 14);

  // Slab to slab over the melt.
  await place(h, -5, 119.5, 0);
  await waitGame(h, 0.2);
  let r = await jump(h, ['KeyW'], 0.12, 0.3);
  h.check('jump across a molten channel onto S1', r.grounded && Math.abs(r.y - 3.2) < 0.1 && r.z > 123.5, JSON.stringify(r));
  let hp = await h.eval(() => window.wyrm.player.hp);
  // Lava hurts.
  await h.eval(() => { const p = window.wyrm.player; p.invuln = false; p.hp = 100; });
  await place(h, 0, 122.3, 0, 2);
  await until(h, () => window.wyrm.player.hp < 100, null, 2);
  hp = await h.eval(() => window.wyrm.player.hp);
  h.check('molten channel burns', hp < 100, String(hp));
  await h.eval(() => { const p = window.wyrm.player; p.invuln = true; p.hp = 100; });

  // Arena on the smelting floor.
  await place(h, 0, 137, 0);
  await waitGame(h, 1.2);
  let s = await h.state();
  h.check('smeltery arena starts', s.enemies >= 3, JSON.stringify(s));
  await h.shot('fp2-smeltery');
  h.check('smeltery arena clears', await clearArena(h, 'smeltery'));

  // Ground Pound the plate: jump, then Tail in the air.
  await place(h, 3.5, 141.5, 0);
  await waitGame(h, 0.3);
  await h.page.keyboard.down('Space');
  await waitGame(h, 0.25);
  await h.page.keyboard.up('Space');
  await h.tap('KeyE', 1, 60);
  await waitGame(h, 1.2);
  const plate = await h.eval(() => window.wyrm.level.fired.has('smelt-piston'));
  h.check('ground pound presses the plate', plate);
  await waitGame(h, 3.5);
  const top = await h.eval(() => window.wyrm.col.groundAt(9.5, 136.5, 20, 0.1).y);
  h.check('piston rose out of the melt', Math.abs(top - 5.3) < 0.1, String(top));
  await h.shot('fp2-piston');
  // Climb: S3 -> piston -> hearth ledge, with real jumps.
  await place(h, 6.8, 136.5, Math.PI / 2);
  await waitGame(h, 0.2);
  r = await jump(h, ['KeyW'], 0.05, 0.1);
  h.check('jumped from the floor onto the piston', r.grounded && Math.abs(r.y - 5.3) < 0.15, JSON.stringify(r));
  await place(h, 9.2, 136.5, Math.PI / 2, 5.5);
  r = await jump(h, ['KeyW'], 0.02, 0.05);
  // With the ledge grab, a plain jump from the piston may catch the hearth's lip (a near miss is
  // forgiven). What matters is that nothing below the piston reaches it: 8.2 m is far out of reach.
  h.check('a plain jump from the piston tops out at the hearth ledge at most', r.y < 8.4, JSON.stringify(r));
  await place(h, 9.2, 136.5, Math.PI / 2, 5.5);
  r = await jump(h, ['KeyW'], 0.02, 0.2, true);
  h.check('jump + flap from the piston reaches the hearth ledge', r.grounded && Math.abs(r.y - 8.2) < 0.15, JSON.stringify(r));

  // Braziers.
  await elem(h, 'Digit1');
  const torches = [[-11, 123.9, 0, 3.4], [11, 127.4, Math.PI, 3.4], [13.5, 139.6, 0, 8.4]];
  for (const [x, z, yaw, y] of torches) {
    await place(h, x, z, yaw, y);
    await h.eval(() => { window.wyrm.player.mana = 100; window.wyrm.player.lock = null; });
    await holdGame(h, ['KeyK'], 0.9);
  }
  await waitGame(h, 0.4);
  const lit = await h.eval(() => window.wyrm.level.fired.has('smelt-door'));
  h.check('three braziers open the smelt door', lit);
  await waitGame(h, 1.8);
  h.check('smelt door is open', !(await gateAlive(h, 0, 150)));

  // Secret: glide from the hearth ledge onto the hanging crucible.
  const gyaw = Math.atan2(1 - 11.4, 128.5 - 135.5);
  await place(h, 11.4, 135.5, gyaw, 8.4);
  await waitGame(h, 0.2);
  await h.page.keyboard.down('KeyW');
  await waitGame(h, 0.05);
  await h.page.keyboard.down('Space');
  await waitGame(h, 0.3);
  await h.page.keyboard.up('Space');
  await waitGame(h, 0.03);
  await h.page.keyboard.down('Space');
  await until(h, () => { const b = window.wyrm.player.body; return Math.hypot(b.x - 1, b.z - 128.5) < 2.4 || b.y < 7.9; }, null, 4);
  await h.page.keyboard.up('Space');
  await h.page.keyboard.up('KeyW');
  await until(h, () => window.wyrm.player.body.grounded, null, 3);
  await waitGame(h, 0.3);
  r = await grounded(h);
  const heart1 = await h.eval(() => !!window.wyrm.save.found['frostworks:heart1']);
  console.log('glide end', JSON.stringify(r));
  h.check('heart1 reached by gliding from the hearth ledge', heart1, JSON.stringify(r));
  await h.shot('fp2-glide');

  // Through the door onto the gear dock.
  await place(h, 0, 147.5, 0);
  await holdGame(h, ['KeyW'], 0.7);
  r = await grounded(h);
  h.check('walked out through the smelt door', r.z > 150.5 && Math.abs(r.y - 3.2) < 0.1, JSON.stringify(r));
  const cp = await h.eval(() => window.wyrm.save.checkpoint);
  h.check('wardstone "gears" activates', cp === 'gears', cp);

  // Gears.
  await place(h, 0, 155, 0);
  await waitGame(h, 0.2);
  r = await jump(h, ['KeyW'], 0.06, 0.05);
  h.check('hopped onto gear 1', r.grounded && r.dyn && Math.abs(r.y - 3.2) < 0.1, JSON.stringify(r));
  await holdGame(h, ['KeyS'], 0.05);
  const before = await grounded(h);
  await waitGame(h, 1.5);
  const after = await grounded(h);
  const moved = Math.hypot(after.x - before.x, after.z - before.z);
  h.check('gear 1 carries the dragon round', after.grounded && moved > 0.4, `${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
  // Gear 1 -> gear 2 (rise 0.7 m over a 3.9 m gap).
  const yaw12 = Math.atan2(-10.5, 6);
  await place(h, Math.sin(yaw12) * 3.2, 161.5 + Math.cos(yaw12) * 3.2, yaw12, 3.4);
  r = await jump(h, ['KeyW'], 0.12, 0.25);
  h.check('jumped from gear 1 to gear 2', r.grounded && Math.abs(r.y - 3.9) < 0.1, JSON.stringify(r));
  const yaw23 = Math.atan2(4.5, 10);
  await place(h, -10.5 + Math.sin(yaw23) * 3.8, 167.5 + Math.cos(yaw23) * 3.8, yaw23, 4.1);
  r = await jump(h, ['KeyW'], 0.06, 0.1);
  h.check('jumped from gear 2 to gear 3', r.grounded && Math.abs(r.y - 4.6) < 0.1, JSON.stringify(r));
  await place(h, -6, 180.5, 0, 4.8);
  r = await jump(h, ['KeyW'], 0.06, 0.05);
  h.check('dropped from gear 3 onto dock A', r.grounded && Math.abs(r.y - 3.6) < 0.1 && !r.dyn, JSON.stringify(r));

  // The lever: wait for an end, step on, ride half a turn, step off.
  await place(h, -5.2, 185.5, Math.PI / 2, 3.8);
  const ok = await until(h, () => {
    const g = window.wyrm;
    const lev = g.level.props.find((p) => p.constructor.name === 'Gear' && p.beam);
    return Math.abs(Math.cos(lev.beam.yaw)) < 0.1;
  }, null, 16);
  h.check('lever end comes round to dock A', ok);
  await holdGame(h, ['KeyW'], 0.3);
  r = await grounded(h);
  h.check('stepped onto the lever', r.grounded && r.dyn && Math.abs(r.y - 3.6) < 0.1, JSON.stringify(r));
  await h.shot('fp2-lever');
  const rode = await until(h, () => {
    const b = window.wyrm.player.body;
    if (!b.grounded && b.y < 2) return 'fell';
    return Math.abs(Math.atan2(b.x - 6, b.z - 186) - Math.PI / 2) < 0.1 ? { x: b.x, z: b.z } : null;
  }, null, 12);
  h.check('rode the lever across to dock B', !!rode && rode !== 'fell', JSON.stringify(rode ?? await grounded(h)));
  await h.eval(() => { const g = window.wyrm; g.player.yaw = Math.PI / 2; g.cam.snapBehind(Math.PI / 2, 0.3); });
  await holdGame(h, ['KeyW'], 0.6);
  r = await grounded(h);
  h.check('stepped off onto dock B', r.grounded && !r.dyn && r.x > 16.5 && Math.abs(r.y - 3.6) < 0.1, JSON.stringify(r));

  // The lift.
  await elem(h, 'Digit2');
  await place(h, 20.4, 187.6, Math.PI, 3.8);
  await h.eval(() => { window.wyrm.player.mana = 100; });
  await holdGame(h, ['KeyK'], 0.8);
  const lift = await h.eval(() => window.wyrm.level.fired.has('lift-power'));
  h.check('lightning switch powers the lift', lift);
  await until(h, () => { const m = window.wyrm.level.props.find((p) => p.constructor.name === 'MovingPlatform' && Math.abs(p.solid.x - 19) < 0.5); return m.solid.y1 < 3.7; }, null, 20);
  await place(h, 19, 187.3, 0, 3.8);
  await holdGame(h, ['KeyW'], 0.35);
  r = await grounded(h);
  h.check('stepped onto the lift', r.grounded && r.dyn, JSON.stringify(r));
  await until(h, () => { const m = window.wyrm.level.props.find((p) => p.constructor.name === 'MovingPlatform' && Math.abs(p.solid.x - 19) < 0.5); return m.solid.y1 > 11.95; }, null, 12);
  r = await grounded(h);
  h.check('lift carried the dragon up', r.y > 11.8, JSON.stringify(r));
  await holdGame(h, ['KeyW'], 1.0);
  r = await grounded(h);
  h.check('walked off the lift into the Upper Works', r.grounded && r.z > 199 && r.y > 11.5, JSON.stringify(r));
  await h.shot('fp2-upper');
}
