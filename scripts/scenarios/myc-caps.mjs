/**
 * The Capstair, played: bounce caps up the chasm, the feeble top cap that
 * only a pounded (or Earth-swollen) bounce clears, the lift cap that fire
 * shrinks and that grows back carrying Aster, the Cap Hopper Skill Point,
 * and the Motherstalk's egg.
 *   node scripts/play.mjs myc-caps
 */
import { boot, place, step, pos, airTo, noPartner, element, breathe, lookAt, found, shot, calm, skip } from './myc-lib.mjs';

export default async function (h) {
  await boot(h);
  await noPartner(h);
  // --- The climb, from the chasm floor, touching nothing but mushrooms.
  await place(h, 0, 58, 0);
  await step(h, 0.5);
  await calm(h);
  await place(h, -3, 77.5, 0);
  const s1 = await airTo(h, -3, 82, 3, { jump: true, stop: 0.2, then: [-7, 87.3], near: 1.8 });
  h.check('the floor cap throws Aster up onto the first shelf', s1.y > 6 && s1.grounded, JSON.stringify(s1));
  const s2 = await airTo(h, -7.4, 88.9, 3, { jump: true, stop: 0.2, then: [-3.3, 92.5], near: 1.4 });
  h.check('the second cap reaches the second shelf', s2.y > 12 && s2.grounded, JSON.stringify(s2));
  await shot(h, 'myc-caps-shelf', false);
  // A plain bounce off the feeble cap falls short of the top...
  const feeble = await airTo(h, -2.3, 95, 1.5, { jump: true, stop: 0.2, near: 0.1 });
  h.check('a plain bounce on the top cap does not reach the lip', feeble.peak < 24.2, JSON.stringify(feeble));
  // ...but pounding down onto it on the way back down does, and on over the lip.
  const lip = await airTo(h, -2.3, 95, 4, { stop: 0.15, pound: true, poundAt: 1.2, then: [0, 101], near: 2.5 });
  await skip(h);
  const top = await airTo(h, 0, 101, 2, { near: 1 });
  top.peak = lip.peak;
  h.check('a pounded bounce clears the lip onto the gardens', top.y > 24.5 && top.z > 97, JSON.stringify(top));
  h.check('Cap Hopper: the Skill Point for climbing on mushrooms alone', await found(h, 'skill:mycelium:capstair'));
  // --- Earth swells a cap: a plain landing then throws Aster sky-high.
  await place(h, -2.8, 92.2, 0, 12.6);
  await element(h, 'earth');
  await lookAt(h, -2.3, 95);
  await breathe(h, 0.5);
  const swell = await h.eval(() => window.wyrm.level.props.find((p) => p.constructor.name === 'BounceCap' && Math.abs(p.x + 2.3) < 0.1).swell);
  const up = await airTo(h, -2.3, 95, 4, { jump: true, stop: 0.2, then: [0, 101], near: 2.5 });
  h.check('Earth swells the cap, and the next bounce carries Aster over the lip', swell > 0 && up.peak > 26.5 && up.y > 24.5, JSON.stringify({ swell, up }));

  await skip(h);
  // --- The lift cap: too tall to climb; burn it down, hop on, ride it up.
  await place(h, 5.4, 64, 0);
  await calm(h);
  await element(h, 'fire');
  await lookAt(h, 5.4, 70);
  await airTo(h, 5.4, 66.5, 0.6, { stop: 0.2 });
  await breathe(h, 0.6);
  const lift = () => h.eval(() => { const l = window.wyrm.level.props.find((p) => p.constructor.name === 'LiftCap'); return { mode: l.mode, h: +l.height.toFixed(2) }; });
  await step(h, 1.2);
  const low = await lift();
  h.check('fire shrinks the tall cap to a stub', low.mode === 'wait' || low.h < 2.5, JSON.stringify(low));
  await airTo(h, 5.4, 70, 1.4, { jump: true, stop: 0.3, near: 0.8 });
  const riding = await pos(h);
  await step(h, 8);
  const ridden = await pos(h);
  h.check('it grows back up with Aster on it', riding.y < 3.5 && ridden.y > 12, JSON.stringify({ riding, ridden }));
  const shelf = await airTo(h, 8.1, 75.3, 1.6, { jump: true, near: 0.8 });
  await step(h, 0.5);
  h.check('from its top, a jump to the east shelf and the Capstair egg', shelf.y > 13.5 && await found(h, 'mycelium:egg-capstair'), JSON.stringify(shelf));

  // --- The Motherstalk: a pounded bounce off the cap beside it, up onto the giant cap and its egg.
  await place(h, 6, 26, 0);
  await step(h, 0.3);
  await calm(h);
  await place(h, -3, 23.5, -Math.PI / 2);
  await airTo(h, -6.5, 23.5, 1.2, { jump: true, stop: 0.2, near: 0.1 });
  const mother = await airTo(h, -6.5, 23.5, 4, { stop: 0.15, pound: true, poundAt: 1.2, then: [-16, 26], near: 3 });
  await step(h, 0.5);
  h.check('the Motherstalk\'s egg, for a dragon who pounds its springy cap', await found(h, 'mycelium:egg-motherstalk'), JSON.stringify(mother));
}
