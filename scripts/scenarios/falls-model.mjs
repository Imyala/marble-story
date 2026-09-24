// Showcase shots of Skrieka's model in a few poses.
import { boot, place, step, shot, skip, clearArenas } from './falls-lib.mjs';

export default async function (h) {
  await boot(h);
  await clearArenas(h);
  const k = h.page.keyboard;
  await place(h, 6, 232, -0.5);
  await k.down('KeyW');
  await step(h, 1.0);
  await k.up('KeyW');
  await step(h, 0.3);
  await skip(h);
  const poses = process.env.POSES ? JSON.parse(process.env.POSES) : ['hover', 'fly', 'dive', 'gust', 'crash', 'screech'];
  for (const pose of poses) {
    await h.eval((pose) => {
      const g = window.wyrm;
      const b = g.boss;
      b.awake = false;
      b.think = () => {};
      b.rocModel.mode = pose;
      const alt = pose === 'crash' ? 0 : 4.5;
      b.body.setPos(0, b.floorY + alt, 246);
      b.body.vx = b.body.vy = b.body.vz = 0;
      b.yaw = Math.PI * 0.85;
      b.integrate = () => {};
      b.state = pose === 'gust' ? 'active' : 'chase';
      const p = g.player;
      p.place(3, b.floorY + 0.1, 234, 0);
      g.cam.snapBehind(-0.2, pose === 'crash' ? 0.35 : -0.05);
    }, pose);
    await step(h, 1.2);
    await shot(h, `model-${pose}`);
  }
}
