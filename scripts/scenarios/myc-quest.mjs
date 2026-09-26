/**
 * The Rotting Market's foragers and Bramble's side quest, "Lamps for the
 * Lost": cut the four foragers out of their cocoons (fire, or three hits),
 * each thanks Aster; Bramble then offers the quest; the three lost lamps
 * (one under the Glimmer Pools, one high on the Capstair's west wall, one in
 * the Strangled Hollow) go back to her, and it pays once. Pickle hands out a
 * snack once per visit.
 *   node scripts/play.mjs myc-quest
 */
import { boot, place, step, pos, airTo, noPartner, element, breathe, lookAt, found, calm, skip, swimTo, talk, tap } from './myc-lib.mjs';

const Q = 'mycelium-lamps';
const quest = (h) => h.eval((id) => ({ ...(window.wyrm.save.quests?.[id] ?? {}), avail: window.wyrm.quests.available(window.wyrm.quests.get(id)) }), Q);
const forager = (h, id) => h.eval((id) => { const f = window.wyrm.level.props.find((p) => p.constructor.name === 'Forager' && p.id === id); return { freed: f.freed, x: f.x, z: f.z, talk: f.talker?.enabled }; }, id);

export default async function (h) {
  await boot(h, { found: { 'story:mycelium:market': true, 'story:mycelium:threadworks': true, 'story:mycelium:rootchoke': true } });
  await noPartner(h);
  const q0 = await quest(h);
  const b0 = await forager(h, 'bramble');
  h.check('Bramble is cocooned, and her quest not yet on offer', !b0.freed && !b0.talk && !q0.avail && !q0.step, JSON.stringify({ q0, b0 }));
  // Burn Bramble free.
  await place(h, b0.x + 3.2, b0.z - 1, 0);
  await calm(h);
  await element(h, 'fire');
  await lookAt(h, b0.x, b0.z);
  await breathe(h, 0.5);
  await step(h, 0.3);
  const said = await h.eval(() => window.wyrm.dialogueSpeaker);
  await skip(h);
  const b1 = await forager(h, 'bramble');
  h.check('fire burns the silk away; Bramble tumbles out and says thanks', b1.freed && b1.talk && said === 'bramble', JSON.stringify({ b1, said }));
  // Claw Burdock out (three hits), and burn the other two.
  const bd = await forager(h, 'burdock');
  await place(h, bd.x - 2, bd.z, Math.PI / 2);
  await calm(h);
  await lookAt(h, bd.x, bd.z);
  for (let i = 0; i < 4 && !(await forager(h, 'burdock')).freed; i++) await tap(h, 'horn');
  await skip(h);
  h.check('three hits claw a cocoon open too', (await forager(h, 'burdock')).freed);
  for (const id of ['pickle', 'tansy']) {
    const f = await forager(h, id);
    await place(h, f.x + 2.5, f.z, -Math.PI / 2);
    await calm(h);
    await lookAt(h, f.x, f.z);
    await breathe(h, 0.5);
    await step(h, 0.3);
    await skip(h);
  }
  const all = await h.eval(() => !!window.wyrm.save.found['story:mycelium:all-freed']);
  h.check('every forager in the Market freed', all);
  // Bramble's quest.
  const gems0 = await h.eval(() => window.wyrm.save.gems);
  await place(h, b0.x + 2, b0.z, -Math.PI / 2);
  await calm(h);
  const q1ok = await talk(h, 'Bramble');
  const q1 = await quest(h);
  h.check('Bramble gives "Lamps for the Lost"', q1ok && q1.step === 0 && q1.avail, JSON.stringify(q1));
  const lamps = await h.eval(() => window.wyrm.level.props.filter((p) => p.constructor.name === 'QuestItem' && /^myc-lamp-/.test(p.id)).map((p) => ({ id: p.id, x: p.x, y: p.y, z: p.z })));
  h.check('three lamps are out in the Deep', lamps.length === 3, JSON.stringify(lamps));
  // Lamp 0: on the bed of the shallow pool (dive).
  const l0 = lamps.find((l) => l.id === 'myc-lamp-0');
  await place(h, l0.x - 4, l0.z - 3, 0.9, -0.8);
  await step(h, 0.3);
  await swimTo(h, l0.x, l0.y + 1.1, l0.z, 8, 0.6);
  await step(h, 0.3);
  // Lamp 1: on the hidden ledge high on the Capstair's west wall (reached with a pounded bounce off the floor cap).
  const l1 = lamps.find((l) => l.id === 'myc-lamp-1');
  await place(h, 0, 58, 0);
  await step(h, 0.4);
  await calm(h);
  await place(h, -1.5, 79, -0.3);
  await airTo(h, -3, 82, 1.2, { jump: true, stop: 0.2, near: 0.1 });
  const ledge = await airTo(h, -3, 82, 4, { stop: 0.15, pound: true, poundAt: 1.2, then: [l1.x, l1.z], thenVy: 24, near: 0.6, flap: true });
  await step(h, 0.3);
  const lit = await h.eval(() => (window.wyrm.save.quests?.['mycelium-lamps']?.items ?? []).includes('myc-lamp-1'));
  h.check('a pounded bounce off the floor cap, a flap, and the west-wall ledge', lit && ledge.y > 14, JSON.stringify(ledge));
  // Lamp 2: in the Strangled Hollow.
  const l2 = lamps.find((l) => l.id === 'myc-lamp-2');
  await place(h, l2.x - 1, l2.z + 3, Math.PI);
  await calm(h);
  await airTo(h, l2.x, l2.z, 2, { near: 0.4 });
  await step(h, 0.3);
  const q2 = await quest(h);
  h.check('all three lamps found (a dive, a big bounce, the Hollow)', q2.step === 1, JSON.stringify({ q2, ledge }));
  // Home to Bramble.
  await place(h, b0.x + 2, b0.z, -Math.PI / 2);
  await calm(h);
  await talk(h, 'Bramble');
  const q3 = await quest(h);
  const gems1 = await h.eval(() => window.wyrm.save.gems);
  h.check('Bramble takes the lamps and pays', q3.done && gems1 - gems0 >= 110, JSON.stringify({ q3, gems: gems1 - gems0 }));
  await talk(h, 'Bramble');
  const gems2 = await h.eval(() => window.wyrm.save.gems);
  h.check('and pays only once', gems2 === gems1, `${gems2 - gems1}`);
  // Pickle's snack: red and green gems, once a visit (her first one came with her thanks).
  const pk = await forager(h, 'pickle');
  await place(h, pk.x + 2.6, pk.z - 0.4, -Math.PI / 2);
  await calm(h);
  await step(h, 3);
  const had = await h.eval(() => window.wyrm.sessionFlags.has('myc-snack'));
  await h.eval(() => window.wyrm.sessionFlags.delete('myc-snack'));
  const snacks = () => h.eval(() => window.wyrm.gems.filter((g) => g.alive && (g.kind === 'red' || g.kind === 'green')).length);
  const n0 = await snacks();
  await talk(h, 'Pickle');
  const n1 = await snacks();
  await step(h, 3);
  await talk(h, 'Pickle');
  const n2 = await snacks();
  h.check('Pickle hands out a snack, once a visit', had && n1 > n0 && n2 === 0, JSON.stringify({ had, n0, n1, n2 }));
}
