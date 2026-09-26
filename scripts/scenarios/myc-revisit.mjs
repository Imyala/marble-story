/**
 * Back in the Deep after Mycora has fallen: the realm loads cleanly from a
 * finished save; the gate portal by the start and the portal at the grove's
 * mouth both lead home; the grove's cocoons stay empty; a standing stone by
 * the trigger offers a rematch (no story, no second outro, no second portal);
 * the freed foragers are still free.
 *   node scripts/play.mjs myc-revisit
 */
import { boot, place, step, noPartner, calm, skip, shot, airTo } from './myc-lib.mjs';

const DONE = {
  'story:mycelium:threadworks': true, 'story:mycelium:market': true, 'story:mycelium:rootchoke': true, 'story:mycelium:all-freed': true,
  'story:mycelium:freed-bramble': true, 'story:mycelium:freed-pickle': true, 'story:mycelium:freed-burdock': true, 'story:mycelium:freed-tansy': true,
  'story:mycelium:mycora': true, 'story:mycelium:done': true, 'arena:mycelium:rootchoke': true,
};

const portals = (h) => h.eval(() => window.wyrm.level.interactables.filter((i) => i.constructor.name === 'Portal').map((p) => ({ x: +p.x.toFixed(1), z: +p.z.toFixed(1), target: p.target, label: p.label })));

export default async function (h) {
  await boot(h, { done: true, found: DONE });
  await noPartner(h);
  const st = await h.eval(() => ({ id: window.wyrm.level.def.id, state: window.wyrm.state, done: !!window.wyrm.save.levelsDone.mycelium }));
  h.check('a finished save loads the Deep cleanly', st.id === 'mycelium' && st.state === 'play' && st.done, JSON.stringify(st));
  const ps = await portals(h);
  h.check('a portal home by the start (the gate)', ps.some((p) => p.target === 'hollow' && p.z < 0), JSON.stringify(ps));
  h.check('and one at the grove\'s mouth', ps.some((p) => p.target === 'hollow' && p.z > 190), JSON.stringify(ps));
  const market = await h.eval(() => window.wyrm.level.props.filter((p) => p.constructor.name === 'Forager').map((f) => [f.id, f.freed, f.talker?.enabled ?? null]));
  h.check('the Market\'s foragers are still free, and still talk', market.length >= 4 && market.every(([, freed, t]) => freed && t !== false), JSON.stringify(market));
  const stone = await h.eval(() => { const s = window.wyrm.level.interactables.find((i) => i.constructor.name === 'RematchStone'); return s ? { x: s.x, z: s.z, label: s.label, enabled: s.enabled } : null; });
  h.check('a rematch stone by the grove\'s trigger', !!stone && stone.enabled, JSON.stringify(stone));
  // Walk to the grove (the far roots have withered, the Rootchoke is won) and look in.
  await place(h, 13, 195, -1);
  await calm(h);
  await airTo(h, 2, 200.5, 3, { near: 0.6 });
  await airTo(h, 0, 206, 2, { near: 0.6 });
  const quiet = await h.eval(() => ({ boss: window.wyrm.boss?.displayName ?? null, state: window.wyrm.state }));
  h.check('walking over the trigger starts nothing now', !quiet.boss && quiet.state === 'play', JSON.stringify(quiet));
  await shot(h, 'myc-revisit-grove', false);
  // The rematch.
  await h.eval(() => window.wyrm.level.interactables.find((i) => i.constructor.name === 'RematchStone').interact());
  await step(h, 0.5);
  const re = await h.eval(() => ({ boss: window.wyrm.boss?.displayName ?? null, awake: !!window.wyrm.boss?.awake, state: window.wyrm.state }));
  h.check('the stone wakes Mycora straight away (no story)', re.boss === 'Mycora, the Spore Mother' && re.awake && re.state === 'play', JSON.stringify(re));
  await h.eval(() => {
    const b = window.wyrm.boss;
    b.hp = 1;
    b.takeHit({ damage: 999, type: 'fire', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 0, heavy: true, spike: false, source: 'melee', move: 'test', fromPlayer: true, ox: b.x, oz: b.z - 1 });
  });
  let outro = false;
  for (let i = 0; i < 24; i++) {
    await step(h, 0.25);
    if ((await h.eval(() => window.wyrm.state)) === 'dialogue') outro = true;
    await skip(h);
  }
  const ps2 = await portals(h);
  h.check('a rematch won plays no second outro and opens no second portal', !outro && ps2.length === ps.length, JSON.stringify({ outro, ps2 }));
  // Home through the gate portal by the start.
  const gate = ps.find((p) => p.target === 'hollow' && p.z < 0);
  await place(h, gate.x, gate.z + 3, Math.PI);
  await step(h, 0.3);
  await h.eval(() => window.wyrm.level.interactables.find((i) => i.constructor.name === 'Portal' && i.z < 0).interact());
  for (let i = 0; i < 30; i++) {
    const s = await h.eval(() => window.wyrm.state);
    if (s === 'pause') await h.eval(() => document.querySelector('.panel.results button')?.click());
    await step(h, 0.3);
    if ((await h.eval(() => window.wyrm.level?.def.id)) === 'hollow') break;
  }
  h.check('the gate portal by the start takes Aster home', (await h.eval(() => window.wyrm.level?.def.id)) === 'hollow');
}
