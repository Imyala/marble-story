/**
 * The talk camera frames the short Burrowfolk (Mossa, Tallow, Pip) as it
 * does the dragons: each speaker's head is in the picture, above the
 * dialogue box and near the middle, with the camera down at their height
 * rather than looking over their heads.
 *   node scripts/play.mjs eng-talk
 */
import { boot, step, shot } from './hollow-lib.mjs';

/** Walks up to a Burrowfolk (from the side Aster would come) and starts the conversation. */
async function talkTo(h, re, from) {
  await h.eval(([src, from]) => {
    const g = window.wyrm;
    const t = g.level.interactables.find((i) => new RegExp(src).test(i.label));
    const [dx, dz] = from;
    const x = t.x + dx;
    const z = t.z + dz;
    g.player.setState('move');
    g.player.place(x, g.col.groundAt(x, z, t.y + 2, 0.2).y + 0.05, z, Math.atan2(t.x - x, t.z - z));
    g.cam.snapBehind(g.player.yaw, 0.3);
  }, [re, from]);
  // Nyxa catches up and settles beside Aster first, as she would have on the walk over.
  await step(h, 3);
  await h.eval((src) => window.wyrm.level.interactables.find((i) => new RegExp(src).test(i.label)).interact(), re);
  await step(h, 1.4);
}

/** Where the speaking Burrowfolk's head and Aster fall on screen (0..1, top-left origin), and the camera's height over the speaker. */
const framing = (h, id) => h.eval((id) => {
  const g = window.wyrm;
  const f = g.level.props.find((p) => p.id === id && typeof p.talkY === 'number');
  const V = g.camera.position.constructor;
  const onScreen = (x, y, z) => {
    const v = new V(x, y, z).project(g.camera);
    return [+((v.x + 1) / 2).toFixed(2), +((1 - v.y) / 2).toFixed(2), v.z < 1];
  };
  const box = document.querySelector('.dlg-box')?.getBoundingClientRect();
  return {
    speaker: g.dialogueSpeaker,
    head: f ? onScreen(f.x, f.y + f.talkY, f.z) : null,
    feet: f ? onScreen(f.x, f.y, f.z) : null,
    aster: onScreen(g.player.x, g.player.y + 1.1, g.player.z),
    camOver: f ? +(g.camera.position.y - (f.y + f.talkY)).toFixed(2) : null,
    dist: f ? +Math.hypot(g.camera.position.x - f.x, g.camera.position.z - f.z).toFixed(1) : null,
    boxTop: box ? +(box.top / innerHeight).toFixed(2) : null,
  };
}, id);

/** Advances the conversation until `who` speaks (or it ends). */
async function until(h, who) {
  for (let i = 0; i < 12; i++) {
    if ((await h.eval(() => window.wyrm.dialogueSpeaker)) === who) return true;
    if ((await h.eval(() => window.wyrm.state)) !== 'dialogue') return false;
    await h.eval(() => window.wyrm.dialogue.advance());
    await h.eval(() => window.wyrm.dialogue.advance());
    await step(h, 1.2);
  }
  return false;
}

async function endTalk(h) {
  for (let i = 0; i < 20 && (await h.eval(() => window.wyrm.state)) === 'dialogue'; i++) {
    await h.page.keyboard.press('Escape');
    await step(h, 0.2);
  }
  await h.eval(() => { const g = window.wyrm; if (g.state === 'pause') g.resume(); });
  await step(h, 0.5);
}

/** The speaker's head is well framed: on screen, above the dialogue box, not squeezed to an edge. */
const framed = (f) => !!f.head && f.head[2] && f.head[0] > 0.15 && f.head[0] < 0.85 && f.head[1] > 0.18 && f.head[1] < Math.min(0.62, (f.boxTop ?? 1) - 0.06);

export default async function (h) {
  await boot(h, 'hollow');
  for (const [id, re, from, shotName] of [['mossa', 'Mossa', [2.4, 2.8], 'eng-talk-mossa'], ['tallow', 'Tallow', [-0.4, 3.2], 'eng-talk-tallow'], ['pip', 'Pip', [0.2, -3.0], 'eng-talk-pip']]) {
    await talkTo(h, re, from);
    const spoke = await until(h, id);
    const f = await framing(h, id);
    await shot(h, shotName);
    h.check(`${id}: the talk camera frames the speaker's head (above the text, near the middle)`, spoke && framed(f), JSON.stringify(f));
    h.check(`${id}: the camera sits at the speaker's height, not high over them`, f.camOver !== null && f.camOver < 1.4 && f.camOver > -0.6, JSON.stringify(f));
    // Aster's reply (when there is one) is framed too.
    if (await until(h, 'aster')) {
      const a = await framing(h, id);
      await shot(h, `${shotName}-aster`);
      h.check(`${id}: Aster's lines keep both of them in view`, a.aster[2] && a.aster[0] > 0.05 && a.aster[0] < 0.95 && a.aster[1] > 0.1 && a.aster[1] < 0.8, JSON.stringify(a));
    }
    await endTalk(h);
  }
}
