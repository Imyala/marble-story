/**
 * The Hollow Gate's realm gates: the Mycelium gate is sealed (its prompt
 * counting eggs once Mossa has told the rite), opens once with 12 eggs
 * returned (roots burn, the slab sinks, a portal lights the doorway), saves
 * that, leads to the Mycelium Deep, and stands open on a revisit. The other
 * three gates stay sealed.
 *   node scripts/play.mjs gate-mycelium
 */
import { act2Save, boot, place, step, press, pos, shot, skip, found } from './hollow-lib.mjs';

/** `n` returned eggs (eggsFound counts any found key with ":egg-"). */
const eggs = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`fen:egg-t${i}`, true]));
const MET = { 'story:hollow:arrive': true, 'tip:swim': true, 'story:hollow:mossa': true, 'story:hollow:mossa-rite': true };
const save = (n, more = {}) => {
  const s = act2Save({ ...MET, ...eggs(n), ...more });
  s.unlocked.push('hollow');
  s.level = 'hollow';
  return s;
};

/** The gate at (107.5, 16) faces west: Aster walks up from -x. */
const GX = 107.5;
const GZ = 16;
const gate = (h) => h.eval(() => {
  const g = window.wyrm;
  const it = g.level.interactables;
  const talk = it.find((i) => /^The Mycelium Deep/.test(i.label));
  const portal = it.find((i) => i.target === 'mycelium');
  return {
    label: talk?.label ?? null, talk: !!talk?.enabled, portals: it.filter((i) => i.target === 'mycelium').length, portal: portal ? { x: +portal.x.toFixed(1), z: +portal.z.toFixed(1), label: portal.label, target: portal.target } : null,
    // Is the doorway solid? (the slab, 0.6 m behind the gate line)
    shut: g.col.blocked(106.9, g.col.groundAt(104, 16, 1e4, 0.2).y + 0.5, 16, 0.4, 1.2),
    open: !!g.save.found['gate:mycelium'], unlocked: g.save.unlocked.includes('mycelium'), ps: g.player.state, shot: g.cam.inShot,
  };
});
const prompt = (h) => h.eval(() => document.querySelector('.prompt')?.textContent ?? '');
/** A wide look at the whole gate from the west (a scripted camera shot). */
async function wide(h, name) {
  await h.eval(([x, z]) => {
    const g = window.wyrm;
    const V = g.camera.position.constructor;
    g.cam.setShot(new V(x - 19, 9.5, z + 5), new V(x, 7.5, z));
  }, [GX, GZ]);
  await step(h, 1.8);
  await shot(h, name, false);
  await h.eval(() => window.wyrm.cam.clearShot());
  await step(h, 0.1);
}
const flick = (h) => h.eval(() => document.querySelector('.flick p')?.textContent ?? '');

export default async function (h) {
  // --- Sealed, with 5 eggs ---------------------------------------------------------------
  await boot(h, 'hollow', { save: save(5) });
  await h.eval(() => window.wyrm.hud.clearFlick());
  await place(h, 102, GZ, Math.PI / 2, undefined, 0.2);
  await step(h, 0.6);
  const told = await flick(h);
  await place(h, 104.3, GZ, Math.PI / 2, undefined, 0.15);
  await step(h, 0.5);
  const p5 = await prompt(h);
  const g5 = await gate(h);
  h.check('sealed with 5 eggs: the prompt counts them (5/12)', /The Mycelium Deep\s*—\s*5\/12 eggs/.test(p5) && !g5.open && g5.shut && g5.portals === 0, JSON.stringify({ p5, g5 }));
  h.check('Flick says what is missing when Aster walks up', /7 more dragon eggs/.test(told), told);
  await press(h, 'interact', 0.1);
  await step(h, 0.2);
  const asked = await flick(h);
  h.check('pressing Use at the gate says it again', /7 more dragon eggs/.test(asked), asked);
  // Walking at the door does not get through.
  await h.eval(() => { window.wyrm.input.forceMove = { x: 0, y: 1 }; });
  await step(h, 1.5);
  await h.eval(() => { window.wyrm.input.forceMove = null; });
  const pushed = await pos(h);
  h.check('the sealed door holds (Aster stays outside)', pushed.x < 106.5, JSON.stringify(pushed));
  // (Kept east of x 100: the Glowcap Wood's Gloom camp wakes within 26 m of (80, -2).)
  await place(h, 100.5, GZ + 1.5, Math.atan2(7, -1.5), undefined, 0.22);
  await step(h, 0.4);
  await shot(h, 'gate-sealed', false);
  await wide(h, 'gate-sealed-wide');

  // --- Before Mossa has told the rite, it is just "sealed" -------------------------------
  const before = await h.eval(() => {
    const g = window.wyrm;
    delete g.save.found['story:hollow:mossa'];
    return true;
  });
  await place(h, 104.3, GZ, Math.PI / 2, undefined, 0.15);
  await step(h, 0.6);
  const pNo = await prompt(h);
  h.check('before meeting Mossa the gate only says it is sealed', before && /The Mycelium Deep \(sealed\)/.test(pNo), pNo);
  await h.eval(() => { window.wyrm.save.found['story:hollow:mossa'] = true; });

  // --- Twelve eggs: the opening plays once and is saved ---------------------------------
  await place(h, 100.5, GZ, Math.PI / 2, undefined, 0.2);
  await h.eval(() => { const f = window.wyrm.save.found; for (let i = 0; i < 12; i++) f[`fen:egg-t${i}`] = true; });
  await step(h, 0.6);
  const g0 = await gate(h);
  h.check('with 12 eggs, walking up starts the opening (saved at once, Aster held, camera on the gate)', g0.open && g0.unlocked && g0.ps === 'locked' && g0.shot, JSON.stringify(g0));
  const saved = await h.eval(() => JSON.parse(localStorage.getItem('wyrmling.save.v1')).found['gate:mycelium'] === true);
  h.check('the opening is written to the save', saved);
  await step(h, 0.9);
  await shot(h, 'gate-opening-burn', false);
  await step(h, 1.0);
  await shot(h, 'gate-opening-sink', false);
  await step(h, 2.4);
  const g1 = await gate(h);
  h.check('then the doorway holds a portal to the Mycelium Deep, and the door is gone', g1.portals === 1 && !g1.shut && !g1.talk && /Enter The Mycelium Deep/.test(g1.portal?.label ?? ''), JSON.stringify(g1));
  h.check('Aster is free again afterwards', g1.ps === 'move' && !g1.shot, JSON.stringify(g1));
  await step(h, 3);
  const g2 = await gate(h);
  h.check('the opening plays once (still one portal, nothing held)', g2.portals === 1 && g2.ps === 'move', JSON.stringify(g2));
  await place(h, 100.5, GZ + 1.5, Math.atan2(7, -1.5), undefined, 0.22);
  await step(h, 0.4);
  await shot(h, 'gate-open', false);
  await wide(h, 'gate-open-wide');

  // --- Walking through ---------------------------------------------------------------------
  const realm = await h.eval(() => window.wyrmDebug.levels.has('mycelium'));
  if (!realm) {
    // The Mycelium Deep is built elsewhere this round: check where the doorway leads instead of going.
    await h.eval(() => { const g = window.wyrm; g.__travel = g.travel; g.travel = (t) => { window.__went = t; }; });
  }
  await place(h, 104, GZ + 0.3, Math.PI / 2, undefined, 0.2);
  for (let i = 0; i < 40; i++) {
    await h.eval(() => { window.wyrm.input.forceMove = { x: 0, y: 1 }; });
    await step(h, 0.1);
    const st = await h.eval(() => ({ went: window.__went ?? null, level: window.wyrm.level?.def.id, state: window.wyrm.state }));
    if (st.went || (st.level === 'mycelium' && st.state !== 'transition')) break;
  }
  await h.eval(() => { window.wyrm.input.forceMove = null; });
  if (realm) {
    const inside = await h.eval(() => ({ level: window.wyrm.level?.def.id, save: window.wyrm.save.level }));
    h.check('walking through the doorway loads the Mycelium Deep', inside.level === 'mycelium' && inside.save === 'mycelium', JSON.stringify(inside));
    await skip(h);
    await h.eval(() => window.wyrm.loadLevel('hollow', {}));
    await step(h, 0.5);
    await skip(h);
  } else {
    const went = await h.eval(() => { const g = window.wyrm; g.travel = g.__travel; return window.__went ?? null; });
    h.check('walking into the doorway travels to mycelium (the realm is not in this tree)', went === 'mycelium', String(went));
    h.check('the portal in the doorway targets mycelium', g1.portal?.target === 'mycelium' && Math.abs(g1.portal.x - 107.9) < 0.3, JSON.stringify(g1.portal));
    await h.eval(() => window.wyrm.loadLevel('hollow', {}));
    await step(h, 0.5);
    await skip(h);
  }

  // --- A revisit: simply open ---------------------------------------------------------------
  await place(h, 100.5, GZ, Math.PI / 2, undefined, 0.2);
  await step(h, 1);
  const g3 = await gate(h);
  h.check('on a revisit the gate is simply open (portal, no door, no second opening)', g3.open && g3.portals === 1 && !g3.shut && g3.ps === 'move' && !g3.shot, JSON.stringify(g3));
  const listed = await h.eval(() => {
    window.wyrm.menus.showTravel();
    const t = [...document.querySelectorAll('.levels button h3')].map((e) => e.textContent);
    window.wyrm.resume();
    return t;
  });
  h.check('the Wardgate lists the Mycelium Deep once its gate is open (when the realm exists)', realm ? listed.includes('The Mycelium Deep') : !listed.includes('mycelium'), JSON.stringify(listed));
  await step(h, 0.2);

  // --- The other gates stay sealed, twelve eggs or not ------------------------------------------
  const others = await h.eval(() => {
    const g = window.wyrm;
    const it = g.level.interactables;
    return ['The Drowned City', 'The Crystal Mine', 'The First Hatchery'].map((n) => {
      const t = it.find((i) => i.label.startsWith(n));
      return { n, label: t?.label, portal: it.some((i) => i.target && i.label === `Enter ${n}`) };
    });
  });
  h.check('the other three gates stay sealed', others.every((o) => o.label === `${o.n} (sealed)` && !o.portal), JSON.stringify(others));
  for (const [x, z, yaw, name] of [[-104, 12, -Math.PI / 2, 'mine'], [-45.6, -68.6, Math.atan2(1, 0.3) + Math.PI, 'hatchery']]) {
    await place(h, x, z, yaw, undefined, 0.2);
    await step(h, 0.8);
    const st = await h.eval(() => ({ ps: window.wyrm.player.state, shot: window.wyrm.cam.inShot }));
    h.check(`walking up to the ${name} gate opens nothing`, st.ps === 'move' && !st.shot, JSON.stringify(st));
  }
  const keys = await h.eval(() => Object.keys(window.wyrm.save.found).filter((k) => k.startsWith('gate:')));
  h.check('only the Mycelium gate is saved as opened', JSON.stringify(keys) === '["gate:mycelium"]', JSON.stringify(keys));
  console.log('found', await found(h, 'gate:mycelium'));
}
