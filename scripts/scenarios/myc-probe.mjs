// Debug probe (not a test): traces Aster through the Thornpit's vent chain.
import { boot, place, step, airTo, noPartner, calm } from './myc-lib.mjs';

export default async function (h) {
  await boot(h, { found: { 'story:mycelium:market': true } });
  await noPartner(h);
  await place(h, 82.5, 172, Math.PI / 2);
  await calm(h);
  for (let i = 0; i < 200; i++) {
    const t = await h.eval(() => window.wyrm.level.props.find((p) => p.constructor.name === 'SporeVent' && Math.abs(p.x - 85) < 0.5).untilPuff);
    if (t > 0 && t <= 0.3) break;
    await step(h, 1 / 30);
  }
  await airTo(h, 85, 172, 0.8, { stop: 0.15, near: 0.1 });
  await h.eval(() => window.wyrm.input.simulate('jump', true));
  const log = [];
  for (let t = 0; t < 4; t += 0.1) {
    const s = await h.eval((t) => {
      const g = window.wyrm;
      const p = g.player;
      const tx = p.body.vy > 12 ? 106 : 98;
      const tz = p.body.vy > 12 ? 172 : 170.5;
      g.cam.yaw = Math.atan2(tx - p.x, tz - p.z);
      g.input.forceMove = Math.hypot(106 - p.x, 172 - p.z) > 0.6 ? { x: 0, y: 1 } : null;
      const v = g.level.props.find((q) => q.constructor.name === 'SporeVent' && Math.abs(q.x - 98) < 0.5);
      return `${t.toFixed(1)} x${p.x.toFixed(1)} y${p.y.toFixed(1)} vy${p.body.vy.toFixed(1)} ${p.state}${p.gliding ? ' glide' : ''} vb:${v.puffing ? 'P' : '-'}`;
    }, t);
    log.push(s);
    await step(h, 0.1);
  }
  console.log(log.join('\n'));
}
