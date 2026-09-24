// A simple bot fights Graveljaw with real inputs (move, jump, horn, tail) to
// check the fight is survivable and how long it lasts. It dodges marks and
// landing spots, jumps the tail sweep and attacks only while the worm is down.
import { setup } from './plains-lib.mjs';

export default async function (h) {
  await h.go('?level=plains&seed=6&quality=low&maxdt=0.25', 3000);
  await h.skipDialogue();
  const t = await setup(h, { fast: true });
  await h.eval(() => { window.wyrm.level.emit('canyon-door'); });
  await t.tp(0, 243.5, 0);
  await h.wait(1500);
  await h.skipDialogue(8000);
  await h.eval(() => {
    const g = window.wyrm;
    const key = (code, type) => window.dispatchEvent(new KeyboardEvent(type, { code }));
    const stats = { t0: g.time, heals: 0, taken: 0, hits: 0, last: g.player.hp, end: 0, modes: {} };
    window.__bot = stats;
    let tap = 0;
    let held = '';
    // Keys toggle frame by frame so every press registers as a new one.
    let justReleased = false;
    const release = () => { if (held) { key(held, 'keyup'); held = ''; justReleased = true; } else justReleased = false; };
    const press = (code) => { if (justReleased || held) return; key(code, 'keydown'); held = code; };
    const tick = () => {
      const b = g.boss;
      const p = g.player;
      if (!b || !b.alive) { stats.end = g.time; g.input.forceMove = null; release(); return; }
      if (p.hp < stats.last) stats.taken += stats.last - p.hp;
      if (p.hp < 30) { p.hp = 100; stats.heals++; }
      stats.last = p.hp;
      stats.modes[b.mode] = (stats.modes[b.mode] ?? 0) + 1;
      const px = p.x;
      const pz = p.z;
      let wx = 0;
      let wz = 0;
      const away = (x, z, r) => {
        const dx = px - x;
        const dz = pz - z;
        const d = Math.hypot(dx, dz) || 1;
        if (d < r) { wx = dx / d; wz = dz / d; return true; }
        return false;
      };
      const toward = (x, z, stop) => {
        const dx = x - px;
        const dz = z - pz;
        const d = Math.hypot(dx, dz) || 1;
        if (d > stop) { wx = dx / d; wz = dz / d; }
        return d;
      };
      // Keep inside the arena.
      const cx = b.cx;
      const cz = b.cz;
      const orbit = () => {
        const dx = px - cx;
        const dz = pz - cz;
        const d = Math.hypot(dx, dz) || 1;
        wx = -dz / d + (10 - d) * 0.08 * dx / d;
        wz = dx / d + (10 - d) * 0.08 * dz / d;
      };
      tap++;
      release();
      switch (b.mode) {
        case 'hunt':
        case 'travel':
          orbit();
          break;
        case 'mark':
          if (!away(b.ex, b.ez, 5)) orbit();
          break;
        case 'erupt':
        case 'arch':
        case 'slamAim':
        case 'slam':
          if (!away(b.lx, b.lz, 4.2) && !away(b.ex, b.ez, 3.8)) toward(b.lx, b.lz, 5.5);
          break;
        case 'pop':
        case 'exposed': {
          const fx = b.hx + Math.sin(b.yaw) * 3.1;
          const fz = b.hz + Math.cos(b.yaw) * 3.1;
          const d = toward(fx, fz, 0.6);
          if (d < 1.8 && b.mode === 'exposed') {
            p.yaw = Math.atan2(b.hx - px, b.hz - pz);
            press(tap % 7 === 0 ? 'KeyE' : 'KeyJ');
          }
          break;
        }
        case 'sweep':
        case 'sweepTele': {
          const dx = px - cx;
          const dz = pz - cz;
          const d = Math.hypot(dx, dz) || 1;
          wx = (8 - d) * 0.3 * dx / d;
          wz = (8 - d) * 0.3 * dz / d;
          const pa = Math.atan2(dx, dz);
          let diff = pa - b.sweepA;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          if (b.mode === 'sweep' && diff * b.sweepDir > 0 && diff * b.sweepDir < 0.45 && p.body.grounded) press('Space');
          break;
        }
        default:
          orbit();
      }
      // Step off any red disc about to land.
      for (const m of b.markers) if (m.active && m.t / m.dur > 0.3 && Math.hypot(px - m.root.position.x, pz - m.root.position.z) < m.r + 0.8) away(m.root.position.x, m.root.position.z, m.r + 1);
      const cyaw = g.cam.yaw;
      const n = Math.hypot(wx, wz);
      if (n > 0.01) {
        wx /= n;
        wz /= n;
        g.input.forceMove = { x: wx * -Math.cos(cyaw) + wz * Math.sin(cyaw), y: wx * Math.sin(cyaw) + wz * Math.cos(cyaw) };
      } else g.input.forceMove = { x: 0, y: 0 };
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  let last = '';
  for (let i = 0; i < 1500; i++) {
    await h.wait(1000);
    const r = await h.eval(() => {
      const g = window.wyrm;
      const b = g.boss;
      const s = window.__bot;
      return { alive: !!b && b.alive, hp: b ? Math.round(b.hp) : 0, phase: b?.phase, mode: b?.mode, t: +(g.time - s.t0).toFixed(1), taken: Math.round(s.taken), heals: s.heals, php: Math.round(g.player.hp), state: g.state };
    });
    const line = `t=${r.t} boss ${r.hp} p${r.phase} ${r.mode} | dragon ${r.php} taken ${r.taken} heals ${r.heals}`;
    if (i % 15 === 0 || !r.alive) console.log(line);
    last = line;
    if (!r.alive) break;
    if (i === 60) await h.shot('bot-fight');
  }
  const s = await h.eval(() => window.__bot);
  const fight = (s.end || 0) - s.t0;
  console.log('bot result', last, 'fight seconds', fight.toFixed(1), JSON.stringify(s.modes));
  h.check('the bot beats Graveljaw', s.end > 0, last);
  h.check('fight length is 1.5 to 4 minutes of game time for a simple bot', fight > 90 && fight < 240, `${fight.toFixed(0)} s`);
}
