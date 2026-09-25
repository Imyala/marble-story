// Nyxa as a partner: when she appears (only after Eclipse Keep, never on the title),
// following Aster through the Plains (over the column bridge across the stream and on
// up the meadow), catching up after a teleport and a glide, the HUD portrait, the
// Options toggle that sends her home, and the Sanctum, where she is at home.
import { waitGame, withNyxa, place, nyxa, walk } from './nyxa-lib.mjs';

export default async function (h) {
  await h.page.addInitScript(() => localStorage.clear());
  // 1) The title screen: no Nyxa.
  await h.go('?seed=5&quality=low&maxdt=0.1', 2500);
  const title = await h.eval(() => ({ state: window.wyrm.state, present: window.wyrm.partner.present }));
  h.check('no Nyxa on the title screen', title.state === 'title' && !title.present, JSON.stringify(title));

  // 2) Before the Keep is done: not in the Plains.
  await h.go('?level=plains&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  await waitGame(h, 0.5);
  let n = await nyxa(h);
  h.check('before Eclipse Keep, Nyxa is not with Aster', !n.present && !n.hud, JSON.stringify(n));

  // 3) The Keep done: she comes along into the realm.
  await withNyxa(h, 'plains');
  n = await nyxa(h);
  h.check('once the Keep is done she arrives beside Aster', n.present && !n.hidden && n.d > 1.5 && n.d < 7 && n.hud, JSON.stringify(n));
  await waitGame(h, 1);
  await h.shot('nyxa-arrive');

  // 4) About the Vale: north over the toppled column across the stream (single file: there is
  //    no room beside him), along the far bank and back, over the column again, and round the near side.
  const route = [[0, -10], [-2, 2], [-2, 14], [0, 21], [14, 20], [2, 19], [-2, 14], [-2, 2], [10, -6], [-10, -10], [0, -4]];
  const w = await walk(h, route);
  await waitGame(h, 1.5);
  n = await nyxa(h);
  const seen = w.samples;
  const mean = seen.reduce((a, b) => a + b, 0) / Math.max(1, seen.length);
  const far = seen.filter((d) => d > 14).length;
  console.log('follow', JSON.stringify({ n: seen.length, hidden: w.hidden, falls: w.falls, missed: w.missed, mean: +mean.toFixed(2), max: +Math.max(...seen).toFixed(2), steps: n.steps, leg: w.leg }));
  h.check('Aster walks the route (no falls)', w.leg >= route.length && w.missed === 0 && w.falls === 0, JSON.stringify({ leg: w.leg, missed: w.missed, falls: w.falls }));
  h.check('she follows the whole walk, close by, without getting lost', seen.length >= (seen.length + w.hidden) * 0.85 && mean < 6.5 && far <= 2 && n.present && !n.hidden && n.d < 7,
    JSON.stringify({ mean, far, hidden: w.hidden, n }));
  await h.shot('nyxa-follow');

  // 5) Aster jumps across the realm (a Wardstone flight, say): she shadow-steps after him.
  const steps0 = n.steps;
  await place(h, -4, 30, Math.PI);
  await waitGame(h, 1.5);
  n = await nyxa(h);
  h.check('after Aster teleports she shadow-steps to him', n.present && !n.hidden && n.d < 7 && n.steps > steps0, JSON.stringify(n));

  // 6) Aster glides off a height: she takes wing with him, then lands beside him.
  await h.eval(() => {
    const g = window.wyrm;
    const p = g.player;
    const y = g.col.groundAt(0, 40, 1e4, 0.2).y;
    p.place(0, y + 10, 40, 0);
    p.body.vy = -1;
    p.gliding = true;
    p.airTime = 1;
    g.input.simulate('jump', true);
    g.cam.snapBehind(0, 0.3);
  });
  let flew = false;
  for (let i = 0; i < 16; i++) {
    await waitGame(h, 0.2);
    const m = await h.eval(() => ({ mode: window.wyrm.partner.mode, hid: window.wyrm.partner.hidden }));
    if (m.mode === 'fly' && !m.hid) flew = true;
    if (flew && i === 7) await h.shot('nyxa-glide');
    if (flew && i > 8) break;
  }
  await h.eval(() => window.wyrm.input.simulate('jump', false));
  await waitGame(h, 3);
  n = await nyxa(h);
  h.check('she glides when Aster glides, then lands beside him', flew && n.mode === 'ground' && !n.hidden && n.d < 9, JSON.stringify({ flew, n }));

  // 7) Options: "Nyxa fights beside you" off sends her home; on brings her back.
  await h.eval(() => { const g = window.wyrm; g.pause(); });
  const opt = await h.eval(() => {
    const btn = [...document.querySelectorAll('.menu button')].find((b) => /Options/.test(b.textContent));
    btn?.click();
    const labels = [...document.querySelectorAll('.opts label')];
    const row = labels.find((l) => l.textContent === 'Nyxa fights beside you');
    const off = row ? [...row.nextElementSibling.querySelectorAll('button')].find((b) => /Sent home/.test(b.textContent)) : null;
    off?.click();
    return { row: !!row, off: !!off, value: window.wyrm.options.partner };
  });
  await h.eval(() => { const g = window.wyrm; g.menus.hideAll(); g.resume(); });
  await waitGame(h, 0.5);
  const gone = await nyxa(h);
  await h.eval(() => { const g = window.wyrm; g.options.partner = true; g.applyOptions(); });
  await waitGame(h, 1);
  const back = await nyxa(h);
  h.check('the Options toggle sends her home', opt.row && opt.off && opt.value === false && !gone.present && !gone.hud, JSON.stringify({ opt, gone }));
  h.check('switching it back on brings her back', back.present && !back.hidden && back.d < 7, JSON.stringify(back));

  // 8) At home in the Sanctum she stands as herself, not as a follower.
  await h.eval(() => window.wyrm.loadLevel('sanctum', {}));
  await h.skipDialogue(6000);
  await waitGame(h, 0.5);
  const home = await h.eval(() => ({ present: window.wyrm.partner.present, npc: window.wyrm.level.npcs.some((q) => q.id === 'nyxa') }));
  h.check('in the Sanctum she is at home (the NPC there), not following', !home.present && home.npc, JSON.stringify(home));
}

/** She hops a gap between two raised slabs and up a waist-high step, instead of shadow-stepping. */
export async function gaps(h) {
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=plains&seed=5&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  await withNyxa(h, 'plains');
  // Two slabs 3 m up with a 2.2 m gap between them, and a step up at the far end.
  const top = await h.eval(async () => {
    const g = window.wyrm;
    const { Builder } = await import('/src/world/level.ts');
    const b = new Builder(g, g.level);
    const y = g.col.groundAt(0, 56, 1e4, 0.2).y;
    b.platform(0, y + 3, 52, 8, 10, 0x8a7a6a, 3.5);
    b.platform(0, y + 3, 64.1, 8, 10, 0x8a7a6a, 3.5);
    b.platform(0, y + 4.2, 72, 8, 6, 0x9a8a7a, 1.2);
    return y + 3;
  });
  await h.eval((top) => {
    const g = window.wyrm;
    g.player.place(0, top + 0.05, 54.5, 0);
    g.cam.snapBehind(0, 0.3);
    g.partner.placeAt(2.5, top + 0.05, 52, 0);
  }, top);
  await waitGame(h, 1);
  const s0 = (await nyxa(h)).steps;
  // Aster crosses (a hop short enough not to count as a flight across the realm).
  await h.eval((top) => { const g = window.wyrm; g.player.place(0, top + 0.05, 61, 0); }, top);
  await waitGame(h, 3);
  let n = await nyxa(h);
  h.check('she hops the gap between the slabs', n.z > 59.2 && n.y > top - 0.5 && n.steps === s0, JSON.stringify({ n, top, s0 }));
  await h.shot('nyxa-gap');
  // Then up onto a waist-high step after him.
  await h.eval((top) => { const g = window.wyrm; g.player.place(0, top + 0.05, 66, 0); }, top);
  await waitGame(h, 1.5);
  await h.eval((top) => { const g = window.wyrm; g.player.place(0, top + 1.25, 72, 0); }, top);
  await waitGame(h, 3);
  n = await nyxa(h);
  h.check('and hops up a waist-high step after him', n.z > 69 && n.y > top + 1 && n.steps === s0, JSON.stringify({ n, top, s0 }));
}
