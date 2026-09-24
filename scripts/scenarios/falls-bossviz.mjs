// Visual review of the Skrieka fight: intro shots, gust, volley, whirlwind.
import { boot, place, step, shot, clearArenas } from './falls-lib.mjs';

export default async function (h) {
  await boot(h);
  await clearArenas(h);
  const k = h.page.keyboard;
  await place(h, 6, 232, -0.5);
  await k.down('KeyW');
  await step(h, 1.0);
  await k.up('KeyW');
  await step(h, 0.3);
  for (let i = 0; i < 8; i++) {
    const st = await h.eval(() => window.wyrm.state);
    if (st !== 'dialogue') break;
    await step(h, 1.6);
    await shot(h, `viz-intro-${i}`);
    await h.eval(() => { const d = window.wyrm.dialogue; d.advance(); d.advance(); });
  }
  await step(h, 0.5);
  await h.eval(() => { window.wyrm.player.invuln = true; });
  const face = () => h.eval(() => { const g = window.wyrm; const b = g.boss; const p = g.player; g.cam.snapBehind(Math.atan2(b.x - p.x, b.z - p.z), 0.12); });
  // Gust.
  await h.eval(() => {
    const g = window.wyrm; const b = g.boss; const p = g.player;
    p.place(b.cx, b.floorY + 0.1, b.cz - 5, 0);
    b.hoverX = b.cx; b.hoverZ = b.cz + 6; b.lastAction = 'volley';
    b.mode = 'gustMove'; b.modeT = 0;
  });
  for (let i = 0; i < 20; i++) {
    await step(h, 0.1);
    await face();
    const m = await h.eval(() => `${window.wyrm.boss.mode}:${window.wyrm.boss.state}`);
    if (m === 'gust:active') { await step(h, 0.4); await face(); await shot(h, 'viz-gust'); break; }
  }
  // Volley.
  await h.eval(() => { const b = window.wyrm.boss; b.volleys = 1; b.mode = 'volley'; b.modeT = 0; b.state = 'chase'; });
  for (let i = 0; i < 20; i++) {
    await step(h, 0.1);
    await face();
    const m = await h.eval(() => `${window.wyrm.boss.mode}:${window.wyrm.boss.state}`);
    if (m === 'volley:active') { await step(h, 0.25); await face(); await shot(h, 'viz-volley'); break; }
  }
  // Phase 3 whirlwind.
  await h.eval(() => { const b = window.wyrm.boss; b.hp = b.maxHp * 0.3; b.mode = 'circle'; b.modeT = 99; });
  for (let i = 0; i < 40; i++) {
    await step(h, 0.2);
    if (await h.eval(() => !!window.wyrm.boss.whirl)) break;
  }
  await step(h, 1.5);
  await h.eval(() => { const g = window.wyrm; const w = g.boss.whirl; const p = g.player; p.place(w.x + 7, p.y, w.z - 6, 0); g.cam.snapBehind(Math.atan2(w.x - p.x, w.z - p.z), 0.2); });
  await step(h, 0.3);
  await shot(h, 'viz-whirlwind');
}
