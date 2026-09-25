// Views of Stonewild Plains and Eclipse Keep: screenshots and draw calls on
// the low quality setting. ONLY=name,name limits the views; TAG prefixes shots.
import { load, calmEnemies, place, shotFrom, calls, census } from './pk-lib.mjs';

const PLAINS = [
  // [name, player x, z, yaw, optional camera [pos], [look]]
  ['vale', 0, -20, 0],
  ['vale-east', 6, -12, Math.PI / 2],
  ['meadow', 8, 36, 0],
  ['meadow-west', -20, 60, -Math.PI / 2],
  ['colonnade', 0, 100, 0],
  ['heights', 5, 140, 0],
  ['fields', -5, 211, 0],
  ['over-vale', 0, -20, 0, [0, 40, -45], [0, 0, 5]],
  ['over-meadow', 8, 36, 0, [0, 55, 20], [0, 5, 75]],
  ['over-north', -5, 211, 0, [0, 60, 180], [0, 5, 230]],
];

const KEEP = [
  ['landing', 0, 4, Math.PI],
  ['bastion', 0, -46, Math.PI],
  ['court', 0, -92, Math.PI],
  ['hall', 0, -140, Math.PI],
  ['stair', 0, -181, Math.PI],
  ['terrace', 0, -220, Math.PI],
  ['over-front', 0, 4, Math.PI, [30, 45, 20], [0, 0, -50]],
  ['over-court', 0, -92, Math.PI, [40, 50, -80], [0, 5, -120]],
  ['over-back', 0, -181, Math.PI, [40, 50, -170], [0, 10, -215]],
];

async function tour(h, level, views) {
  await load(h, level);
  await calmEnemies(h);
  // KILL=1 removes every enemy first, to measure the scenery alone.
  if (process.env.KILL === '1') await h.eval(() => { const g = window.wyrm; for (const e of g.enemies) { e.alive = false; e.dispose(); } g.enemies = []; });
  if (process.env.HUD !== '1') await h.eval(() => window.wyrm.hud.show(false));
  const only = (process.env.ONLY ?? '').split(',').filter(Boolean);
  const tag = process.env.TAG ?? 'pk';
  const out = [];
  for (const [name, x, z, yaw, pos, look] of views) {
    if (only.length && !only.includes(name)) continue;
    await place(h, x, z, yaw);
    if (pos) await shotFrom(h, pos, look);
    const n = await calls(h);
    out.push(`${name}:${n}`);
    if (process.env.NOSHOT !== '1') await h.shot(`${tag}-${level}-${name}`);
  }
  console.log('draw calls', out.join(' '));
  console.log('census', JSON.stringify(await census(h)));
}

export async function plains(h) {
  await tour(h, 'plains', PLAINS);
}

export async function keep(h) {
  await tour(h, 'keep', KEEP);
}

export default async function (h) {
  await plains(h);
  await keep(h);
}
