/**
 * The Threadworks' glowthreads, played: the Garden Gate (strike the bulb,
 * run through before the gills drop), the light bridge over the gorge
 * (burn the blight, strike the bulb, chase the light across; fall, and back
 * to the ledge), and the Twinned Vault (two threads, one slow: both sockets
 * lit at once).
 *   node scripts/play.mjs myc-threads
 */
import { boot, place, step, pos, airTo, noPartner, element, breathe, lookAt, found, calm, skip, shot } from './myc-lib.mjs';

const door = (h, x, z) => h.eval(([x, z]) => {
  const d = window.wyrm.level.props.find((p) => p.constructor.name === 'CapDoor' && Math.abs(p.x - x) < 0.6 && Math.abs(p.z - z) < 0.6);
  return d ? { open: d.isOpen, forever: d.forever } : null;
}, [x, z]);

export default async function (h) {
  await boot(h, { found: { 'story:mycelium:threadworks': true } });
  await noPartner(h);
  // --- The Garden Gate.
  await place(h, 4, 101.5, 0);
  await calm(h);
  const shut = await airTo(h, 0, 109, 1.6, { near: 0.5 });
  h.check('the gate is shut: the gills stop Aster', shut.z < 106 && !(await door(h, 0, 106)).open, JSON.stringify(shut));
  await place(h, 4.6, 101.4, 0);
  await element(h, 'lightning');
  await lookAt(h, 7, 103.2);
  await breathe(h, 0.35);
  await step(h, 2.2);
  const d1 = await door(h, 0, 106);
  h.check('Lightning on the bulb runs a pulse down the thread and opens the gate', d1.open, JSON.stringify(d1));
  await shot(h, 'myc-threads-gate', false);
  const through = await airTo(h, 0, 110, 4, { near: 0.8 });
  h.check('through the gate before it drops', through.z > 107.5, JSON.stringify(through));
  await step(h, 8);
  h.check('and it drops shut again behind', !(await door(h, 0, 106)).open);

  // --- The blight passage and the light bridge.
  await place(h, 9.5, 140.5, Math.PI / 2, 32.05);
  await calm(h);
  const hp0 = await h.eval(() => window.wyrm.player.hp);
  const into = await airTo(h, 18, 140, 1.5, { near: 0.5 });
  await step(h, 0.4);
  const hp1 = await h.eval(() => window.wyrm.player.hp);
  h.check('the blight stings and holds Aster back', hp1 < hp0 && into.x < 17.2, JSON.stringify({ hp0, hp1, into }));
  await h.eval(() => { const p = window.wyrm.player; p.hp = p.maxHp; });
  await place(h, 10.5, 140, Math.PI / 2, 32.05);
  await element(h, 'fire');
  await breathe(h, 0.5);
  await step(h, 0.9);
  const burnt = await h.eval(() => window.wyrm.level.props.find((p) => p.constructor.name === 'BlightCloud' && Math.abs(p.z - 140) < 1).mode);
  h.check('Fire burns the blight away', burnt === 'gone' || burnt === 'burn', burnt);
  await place(h, 9.2, 141.5, 0, 32.05);
  await element(h, 'lightning');
  await lookAt(h, 7.5, 143.2);
  await breathe(h, 0.3);
  // Chase the light: along the passage and out across the gorge.
  const across = await airTo(h, 44.5, 140, 7, { near: 1.2 });
  h.check('the bridge lights plank by plank and carries Aster over the gorge', across.x > 42 && across.y > 31, JSON.stringify(across));
  h.check('the crossing counts', await h.eval(() => window.wyrm.level.fired.has('myc-bridge')));
  // Back to the west ledge, and a step off it with no bridge: the gorge sends her back.
  await place(h, 22, 140, Math.PI / 2, 32.05);
  await step(h, 1);
  await airTo(h, 30, 140, 1.2, { near: 0.3 });
  await step(h, 2.5);
  await skip(h);
  const back = await pos(h);
  h.check('falling into the gorge puts Aster back on the ledge', back.y > 31 && back.x < 24, JSON.stringify(back));

  // --- The Twinned Vault in the east wing.
  const QX = 26.5;
  const QZ = 108.5;
  const SX = 24.5;
  const SZ = 115;
  await place(h, QX + 1, QZ + 2, 0);
  await calm(h);
  await element(h, 'lightning');
  const pulses = () => h.eval(() => window.wyrm.level.props.filter((p) => p.constructor.name === 'Glowthread').map((t) => `${t.x.toFixed(1)},${t.z.toFixed(1)}:${t.pulse.toFixed(1)}/${t.length.toFixed(1)}`).join(' '));
  const lockState = () => h.eval(() => { const l = window.wyrm.level.props.find((p) => p.constructor.name === 'TwinLock'); return l ? l.litCount : -1; });
  // The quick one alone: its socket lights, and fades.
  await lookAt(h, QX, QZ);
  await breathe(h, 0.3);
  console.log('after quick strike', await pulses());
  await step(h, 1.2);
  console.log('lit after quick arrives', await lockState());
  await step(h, 2.8);
  h.check('one socket alone does not open the vault', !(await door(h, 34.5 - 3, 112.5)).open);
  // The slow one first, then the quick one as its light nears the top of the pillar.
  await place(h, SX + 1.5, SZ + 1, 0);
  await lookAt(h, SX, SZ);
  await breathe(h, 0.3);
  console.log('after slow strike', await pulses());
  const t0 = await h.eval(() => window.wyrm.time);
  await place(h, QX + 1, QZ + 2, 0);
  await lookAt(h, QX, QZ);
  const slowLen = await h.eval(() => window.wyrm.level.props.filter((p) => p.constructor.name === 'Glowthread').map((t) => t.length).sort((a, b) => b - a)[0]);
  // Arrival of the slow pulse is length / 5.5 s after the strike; send the quick one to land alongside it.
  const wait = slowLen / 5.5 - 1.2 - (await h.eval(() => window.wyrm.time) - t0);
  if (wait > 0) await step(h, wait);
  console.log('before quick strike', await pulses(), wait);
  await breathe(h, 0.3);
  console.log('after quick strike', await pulses());
  await step(h, 0.9);
  console.log('lit', await lockState(), await pulses());
  await step(h, 1.6);
  const vault = await door(h, 31.5, 112.5);
  h.check('both sockets lit at once: the vault opens for good', vault.open && vault.forever, JSON.stringify({ vault, slowLen }));
  await airTo(h, 35.5, 112.5, 3, { near: 0.5 });
  await step(h, 0.4);
  h.check('the vault\'s relic', await found(h, 'mycelium:relic1'));
  await shot(h, 'myc-threads-vault', false);
}
