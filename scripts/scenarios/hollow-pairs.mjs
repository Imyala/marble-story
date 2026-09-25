/**
 * The Hollow Gate's Pair's Door: Nyxa scouts ahead after the arrival and
 * catches up when Aster meets Elder Mossa; the door opens only with both
 * dragons on its plates, and the heart shard behind it can be taken.
 *   node scripts/play.mjs hollow-pairs
 */
import { boot, step, shot } from './hollow-lib.mjs';

export default async function (h) {
  await boot(h, 'hollow', { intro: true, keepDialogue: true });
  // The arrival scene: Nyxa stands for it, then goes scouting.
  for (let i = 0; i < 40; i++) {
    const st = await h.eval(() => window.wyrm.state);
    if (st !== 'dialogue') break;
    await h.eval(() => window.wyrm.dialogue.advance());
    await step(h, 0.1);
  }
  await step(h, 1);
  const away = await h.eval(() => ({ present: window.wyrm.partner.present, flag: window.wyrm.sessionFlags.has('nyxa-away') }));
  h.check('after the arrival Nyxa goes scouting (not following yet)', !away.present && away.flag, JSON.stringify(away));
  // Meeting Elder Mossa brings her back.
  await h.eval(() => {
    const g = window.wyrm;
    const t = g.level.interactables.find((i) => /Mossa/i.test(i.label));
    window.__mossa = !!t;
    t?.interact();
  });
  for (let i = 0; i < 40; i++) {
    const st = await h.eval(() => window.wyrm.state);
    if (st !== 'dialogue') break;
    await h.eval(() => window.wyrm.dialogue.advance());
    await step(h, 0.1);
  }
  await step(h, 2);
  const back = await h.eval(() => ({ mossa: window.__mossa, present: window.wyrm.partner.present, flag: window.wyrm.sessionFlags.has('nyxa-away') }));
  h.check('she rejoins once Aster has met the Burrowfolk', back.mossa && back.present && !back.flag, JSON.stringify(back));

  // The Pair's Door.
  const plates = await h.eval(() => {
    const g = window.wyrm;
    const tp = g.level.props.find((p) => p.constructor.name === 'TwinPlates');
    window.__tp = tp;
    return tp ? tp.plates.map((p) => [p.x, p.y, p.z]) : null;
  });
  h.check('the Pair\'s Door has its twin plates', !!plates && plates.length === 2, JSON.stringify(plates));
  const [a, bp] = plates;
  await h.eval(([a]) => { const g = window.wyrm; g.player.place(a[0], a[1] + 0.1, a[2], Math.PI); }, [a]);
  await step(h, 1.5);
  const alone = await h.eval(() => ({ open: window.wyrm.level.fired.has('pairs-door') }));
  h.check('Aster alone on a plate does not open it', !alone.open, JSON.stringify(alone));
  await h.eval(([bp]) => { const g = window.wyrm; g.partner.placeAt(bp[0], bp[1], bp[2], 0); g.partner.commandStay(); }, [bp]);
  await step(h, 1.5);
  const open = await h.eval(() => ({ open: window.wyrm.level.fired.has('pairs-door'), who: window.__tp.plates.map((p) => p.who) }));
  h.check('with Nyxa on the other plate, the door opens', open.open, JSON.stringify(open));
  await shot(h, 'hollow-pairs-open');
  // Walk into the vault for the heart shard.
  await h.eval(() => { const g = window.wyrm; g.player.place(-67, g.col.groundAt(-67, 7.5, 1e4, 0.2).y + 0.1, 7.5, Math.PI); });
  await h.page.keyboard.down('KeyW');
  for (let i = 0; i < 40; i++) {
    await step(h, 0.1);
    if (await h.eval(() => !!window.wyrm.save.found['hollow:heart1'])) break;
    await h.eval(() => { const g = window.wyrm; g.cam.snapBehind(Math.PI); });
  }
  await h.page.keyboard.up('KeyW');
  const got = await h.eval(() => ({ heart: !!window.wyrm.save.found['hollow:heart1'], p: [window.wyrm.player.x, window.wyrm.player.z] }));
  h.check('the heart shard behind the Pair\'s Door can be taken', got.heart, JSON.stringify(got));
}
