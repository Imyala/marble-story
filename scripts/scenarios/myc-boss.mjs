/**
 * Mycora's Grove: the roots across its mouth wither once the Rootchoke is
 * won; the trigger at (0, 204) starts the fight (Mycora speaks, the barrier
 * rises); defeating her (put straight into her last, downed state here) plays the outro, frees the grove's
 * foragers, sets levelsDone.mycelium and opens a portal home.
 *   node scripts/play.mjs myc-boss
 */
import { boot, place, step, pos, airTo, noPartner, calm, skip, shot } from './myc-lib.mjs';

export default async function (h) {
  await boot(h, { found: { 'story:mycelium:threadworks': true, 'story:mycelium:market': true, 'story:mycelium:rootchoke': true } });
  await noPartner(h);
  // Before the Rootchoke is won, its far roots bar the way to the grove.
  await place(h, 14, 193.5, -1);
  await calm(h);
  const barred = await airTo(h, 4, 200, 2.5, { near: 0.5 });
  h.check('roots bar the way to the grove until the Rootchoke is won', barred.x > 8, JSON.stringify(barred));
  // Win it.
  await place(h, 24, 186, Math.PI);
  for (let i = 0; i < 14; i++) {
    if ((await h.eval(() => window.wyrm.level.arenas.find((a) => a.id === 'rootchoke').state)) === 'cleared') break;
    await calm(h);
    await step(h, 1.5);
  }
  await step(h, 2);
  const open = await h.eval(() => window.wyrm.level.fired.has('myc-choke-out'));
  h.check('winning the Rootchoke withers the roots', open);
  // Into the grove's mouth, and onto the trigger.
  await place(h, 13, 195, -1);
  await airTo(h, 2, 200.5, 3, { near: 0.6 });
  await airTo(h, 0, 204, 2, { near: 0.5 });
  const st = await h.eval(() => ({ state: window.wyrm.state, boss: window.wyrm.boss?.displayName ?? null, speaker: window.wyrm.dialogueSpeaker }));
  h.check('the trigger at (0, 204) starts the fight: Mycora and her intro', st.boss === 'Mycora, the Spore Mother' && st.state === 'dialogue', JSON.stringify(st));
  await shot(h, 'myc-boss-intro', true);
  await skip(h, 20);
  const fight = await h.eval(() => {
    const g = window.wyrm;
    const b = g.boss;
    return { awake: b.awake, x: +b.x.toFixed(1), y: +b.y.toFixed(1), z: +b.z.toFixed(1), barrier: g.level.props.some((p) => p.constructor.name === 'Barrier' && p.on) };
  });
  h.check('she wakes on the grove floor behind a barrier', fight.awake && fight.barrier && fight.z > 225, JSON.stringify(fight));
  await step(h, 1.5);
  await shot(h, 'myc-boss-fight', false);
  // Defeat her.
  await h.eval(() => {
    const b = window.wyrm.boss;
    // Mycora never skips a phase and only dies downed on the floor in her last one:
    // put her there (the fight itself is tested beat by beat in mycora-fight).
    b.phase = 3;
    b.setMode?.('downed');
    b.hp = 1;
    b.takeHit({ damage: 999, type: 'fire', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 0, heavy: true, spike: false, source: 'melee', move: 'test', fromPlayer: true, ox: b.x, oz: b.z - 1 });
  });
  // (Her fall runs in slow motion; the outro follows it.)
  for (let i = 0; i < 40 && (await h.eval(() => window.wyrm.state)) !== 'dialogue'; i++) await step(h, 0.25);
  const outro = await h.eval(() => ({ state: window.wyrm.state, speaker: window.wyrm.dialogueSpeaker }));
  h.check('the outro plays', outro.state === 'dialogue', JSON.stringify(outro));
  await shot(h, 'myc-boss-outro', true);
  await skip(h, 20);
  await step(h, 1);
  const after = await h.eval(() => {
    const g = window.wyrm;
    const portal = g.level.interactables.find((i) => i.constructor.name === 'Portal' && i.target === 'hollow' && i.z > 150);
    const foragers = g.level.props.filter((p) => p.constructor.name === 'Forager' && p.id.startsWith('lost')).length;
    return { done: !!g.save.levelsDone.mycelium, portal: portal ? [+portal.x.toFixed(1), +portal.z.toFixed(1), portal.label] : null, foragers, music: g.state };
  });
  h.check('levelsDone.mycelium is set', after.done, JSON.stringify(after));
  h.check('a portal home to the Hollow Gate opens by the grove\'s mouth', !!after.portal, JSON.stringify(after));
  h.check('the grove\'s lost foragers are out of their cocoons', after.foragers >= 6, JSON.stringify(after));
  await step(h, 4);
  await shot(h, 'myc-boss-after', false);
  // The portal takes Aster home (the realm's results card first).
  await place(h, -3.2, 202.5, Math.PI);
  await step(h, 0.3);
  await h.eval(() => { const g = window.wyrm; g.level.interactables.find((i) => i.constructor.name === 'Portal' && i.z > 150).interact(); });
  for (let i = 0; i < 30; i++) {
    const s = await h.eval(() => window.wyrm.state);
    if (s === 'pause') await h.eval(() => document.querySelector('.panel.results button')?.click());
    await step(h, 0.3);
    if ((await h.eval(() => window.wyrm.level?.def.id)) === 'hollow') break;
  }
  h.check('through the portal to the Hollow Gate', (await h.eval(() => window.wyrm.level?.def.id)) === 'hollow');
}
