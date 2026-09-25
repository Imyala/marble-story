/**
 * The Hollow Gate's quests: the Act II main quest points the way, Tallow's
 * "Lamp Oil" (clear the Glowcap camp, gather spores) and Pip's "The Drowned
 * Lantern" (a dive in the canal) run start to finish and pay once.
 *   node scripts/play.mjs hollow-quests
 */
import { boot, step } from './hollow-lib.mjs';

const talkThrough = async (h) => {
  for (let i = 0; i < 40; i++) {
    if ((await h.eval(() => window.wyrm.state)) !== 'dialogue') return;
    await h.eval(() => window.wyrm.dialogue.advance());
    await step(h, 0.1);
  }
};
const talk = async (h, re) => {
  const ok = await h.eval((src) => { const t = window.wyrm.level.interactables.find((i) => new RegExp(src).test(i.label)); t?.interact(); return !!t; }, re);
  await step(h, 0.1);
  await talkThrough(h);
  await step(h, 0.3);
  return ok;
};
const q = (h, id) => h.eval((id) => ({ ...(window.wyrm.save.quests?.[id] ?? {}), text: window.wyrm.quests.tracker()?.text }), id);

export default async function (h) {
  await boot(h, 'hollow');
  const m0 = await h.eval(() => window.wyrm.quests.main());
  h.check('the main quest leads to the Burrowfolk before Aster has met them', /Burrowfolk/.test(m0.text) && m0.spot?.level === 'hollow', JSON.stringify(m0));
  await talk(h, 'Mossa');
  const m1 = await h.eval(() => window.wyrm.quests.main());
  h.check('after Mossa, the main quest speaks of the sealed gates', /seal the four gates/.test(m1.text), JSON.stringify(m1));

  // --- Lamp Oil ---
  const gems0 = await h.eval(() => window.wyrm.save.gems);
  h.check('Tallow gives the Lamp Oil quest', await talk(h, 'Tallow') && (await q(h, 'hollow-oil')).step === 0, JSON.stringify(await q(h, 'hollow-oil')));
  // Wake the Glowcap camp and put its Gloom down.
  await h.eval(() => { const g = window.wyrm; g.player.place(70, g.col.groundAt(70, 0, 1e4, 0.2).y + 0.1, 0, Math.PI / 2); });
  await step(h, 0.6);
  const killed = await h.eval(() => {
    const g = window.wyrm;
    const camp = g.enemies.filter((e) => e.alive && Math.hypot(e.homeX - 80, e.homeZ + 2) < 16);
    for (const e of camp) e.takeHit({ damage: 99999, type: 'physical', dirX: 1, dirZ: 0, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 0, heavy: true, spike: false, source: 'melee', move: 'test', fromPlayer: true, ox: e.x - 1, oz: e.z });
    return camp.length;
  });
  await step(h, 1);
  const s1 = await q(h, 'hollow-oil');
  h.check('clearing the Glowcap camp moves the quest on', killed >= 4 && s1.step === 1, JSON.stringify({ killed, s1 }));
  // The spores, round the giant caps.
  const spores = await h.eval(() => window.wyrm.level.props.filter((p) => p.constructor.name === 'QuestItem' && /^spore-/.test(p.id) && !p.taken).map((p) => [p.x, p.y, p.z]));
  for (const [x, y, z] of spores) {
    await h.eval(([x, y, z]) => window.wyrm.player.place(x, y + 0.1, z, 0), [x, y, z]);
    await step(h, 0.4);
  }
  const s2 = await q(h, 'hollow-oil');
  h.check('four spores gathered, some up on the caps', spores.length === 4 && s2.step === 2, JSON.stringify({ spores, s2 }));
  await h.eval(() => { const g = window.wyrm; g.player.place(6.2, g.col.groundAt(6.2, -48.5, 1e4, 0.2).y + 0.1, -48.5, Math.PI); });
  await talk(h, 'Tallow');
  const s3 = await q(h, 'hollow-oil');
  const gems1 = await h.eval(() => window.wyrm.save.gems);
  h.check('Tallow takes the spores and pays once', s3.done && gems1 - gems0 >= 90, JSON.stringify({ s3, gems: gems1 - gems0 }));

  // --- The Drowned Lantern ---
  h.check('Pip gives the Drowned Lantern quest', await talk(h, 'Pip') && (await q(h, 'hollow-lantern')).step === 0, JSON.stringify(await q(h, 'hollow-lantern')));
  const lamp = await h.eval(() => { const p = window.wyrm.level.props.find((p) => p.constructor.name === 'QuestItem' && p.id === 'pip-lantern'); return p ? [p.x, p.y, p.z] : null; });
  h.check('the lantern lies on the canal bed, under the water', !!lamp && lamp[1] < -1.5, JSON.stringify(lamp));
  // Swimming at the surface over it is not enough...
  await h.eval(([x, z]) => { const g = window.wyrm; g.player.place(x, -0.4, z, 0); }, [lamp[0], lamp[2]]);
  await step(h, 0.8);
  const surf = await h.eval(() => ({ taken: !!window.wyrm.save.quests?.['hollow-lantern']?.items?.includes('pip-lantern'), swim: window.wyrm.player.swimming, y: window.wyrm.player.y }));
  h.check('floating at the surface does not reach it', !surf.taken, JSON.stringify(surf));
  // ...a dive does.
  await h.page.keyboard.down('ShiftLeft');
  for (let i = 0; i < 30; i++) {
    await step(h, 0.1);
    if (await h.eval(() => !!window.wyrm.save.quests?.['hollow-lantern']?.items?.includes('pip-lantern'))) break;
  }
  await h.page.keyboard.up('ShiftLeft');
  const dove = await h.eval(() => ({ taken: !!window.wyrm.save.quests?.['hollow-lantern']?.items?.includes('pip-lantern'), y: window.wyrm.player.y, x: window.wyrm.player.x, z: window.wyrm.player.z, st: window.wyrm.player.state, sub: window.wyrm.player.submerged }));
  h.check('diving down picks the lantern up', dove.taken, JSON.stringify(dove));
  await h.eval(() => { const g = window.wyrm; g.player.place(3.6, g.col.groundAt(3.6, -41, 1e4, 0.2).y + 0.1, -41, 0); });
  await step(h, 0.5);
  await talk(h, 'Pip');
  const l2 = await q(h, 'hollow-lantern');
  h.check('Pip gets the lantern back and the quest completes', l2.done, JSON.stringify(l2));
}
