// Balance check: a simple bot fights Skrieka on Normal through the game's own
// Input (held keys and synthetic presses), and we time the kill.
//   dodges locked-in dives, punishes crashes with horns and fire, throws
//   fireballs while she hovers in reach, steps out of lightning rings and away
//   from the whirlwind. A "death" is counted (and healed) at low health.
import { boot, place, step, skip, clearArenas } from './falls-lib.mjs';

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
  await h.eval(() => {
    const g = window.wyrm;
    const inp = g.input;
    const keys = inp.keysDown;
    const bot = { t: 0, deaths: 0, dmg: 0, lastHp: g.player.hp, cd: 0, phaseAt: {}, modes: {}, fireballs: 0, crashes: 0, lastMode: '' };
    window.__bot = bot;
    bot.byMove = {};
    const th = g.player.takeHit.bind(g.player);
    g.player.takeHit = (hit, who) => {
      const hp0 = g.player.hp;
      const r = th(hit, who);
      const d = hp0 - g.player.hp;
      if (d > 0) {
        const key = hit.move === 'projectile' ? (Math.round(hit.damage) >= 9 ? 'wispZap' : 'feather') : hit.move;
        bot.byMove[key] = Math.round((bot.byMove[key] ?? 0) + d);
      }
      return r;
    };
    const tap = (a) => { inp.simulate(a, true); inp.simulate(a, false); };
    const hold = (code, on) => { if (on) keys.add(code); else keys.delete(code); };
    bot.tick = (dt) => {
      const b = g.boss;
      const p = g.player;
      if (!b || !b.alive) return;
      bot.t += dt;
      bot.cd -= dt;
      if (p.hp < bot.lastHp) bot.dmg += bot.lastHp - p.hp;
      if (p.hp < 22) { bot.deaths++; p.hp = p.maxHp; }
      bot.lastHp = p.hp;
      if (!bot.phaseAt[b.phase]) bot.phaseAt[b.phase] = +bot.t.toFixed(1);
      bot.modes[b.mode] = (bot.modes[b.mode] ?? 0) + dt;
      if (b.mode === 'crash' && bot.lastMode !== 'crash') bot.crashes++;
      bot.lastMode = b.mode;
      for (const c of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) hold(c, false);
      const dx = b.x - p.x;
      const dz = b.z - p.z;
      const d = Math.hypot(dx, dz);
      const toBoss = Math.atan2(dx, dz);
      g.cam.yaw = toBoss;
      const dy = b.y - p.y;
      const cx = b.cx;
      const cz = b.cz;
      // Lightning rings and the whirlwind: get out.
      const ring = b.rings.find((r) => r.active && !r.struck && Math.hypot(r.x - p.x, r.z - p.z) < r.r + 1.2);
      if (ring) {
        g.cam.yaw = Math.atan2(p.x - ring.x, p.z - ring.z);
        hold('KeyW', true);
        return;
      }
      if (b.whirl && Math.hypot(b.whirl.x - p.x, b.whirl.z - p.z) < 4) {
        g.cam.yaw = Math.atan2(p.x - b.whirl.x, p.z - b.whirl.z);
        hold('KeyW', true);
        return;
      }
      if (b.mode === 'swoopAim' && b.swoopLocked) { hold('KeyD', true); return; }
      if (b.mode === 'swoop') { hold('KeyD', true); return; }
      if (b.mode === 'crash' && b.state !== 'windup') {
        if (d > 3.6) { hold('KeyW', true); return; }
        if (p.mana > 40 && b.modeT < 1.4) {
          if (p.state !== 'breath') inp.simulate('breath', true);
          return;
        }
        inp.simulate('breath', false);
        if (bot.cd <= 0) { tap('horn'); bot.cd = 0.22; }
        return;
      }
      inp.simulate('breath', false);
      if (b.mode === 'crash' || b.mode === 'rise') { hold('KeyS', true); return; }
      // Shoot her while she hovers in reach.
      if ((b.mode === 'gust' || b.mode === 'volley' || b.mode === 'summon') && d < 15 && dy < 6 && p.mana > 24 && bot.cd <= 0) {
        tap('burst');
        bot.fireballs++;
        bot.cd = 0.7;
        return;
      }
      // Storm Wisps: horns up close, fireballs at range (locked on).
      const wisp = g.enemies.filter((e) => e.alive && e.def.id === 'stormWisp' && e.state !== 'spawn')
        .sort((a, c) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(c.x - p.x, c.z - p.z))[0];
      if (wisp && bot.cd <= 0) {
        const wd = Math.hypot(wisp.x - p.x, wisp.z - p.z);
        g.cam.yaw = Math.atan2(wisp.x - p.x, wisp.z - p.z);
        if (wd < 3.5) { tap('horn'); bot.cd = 0.3; return; }
        if (wd < 15 && p.mana > 24) { p.lock = wisp; tap('burst'); bot.fireballs++; bot.cd = 0.8; return; }
      }
      if (p.lock && p.lock !== b) p.lock = null;
      // Otherwise drift toward the middle.
      const mc = Math.hypot(cx - p.x, cz - p.z);
      if (mc > 6) { g.cam.yaw = Math.atan2(cx - p.x, cz - p.z); hold('KeyW', true); }
    };
    const orig = window.__step;
    window.__step = (sec, dt) => {
      const n = Math.max(1, Math.round(sec / dt));
      for (let i = 0; i < n; i++) { bot.tick(dt); g.__frame(dt); }
    };
    void orig;
  });
  let r;
  for (let i = 0; i < 150; i++) {
    await step(h, 2.0);
    r = await h.eval(() => {
      const g = window.wyrm;
      const b = window.__bot;
      return { t: +b.t.toFixed(1), hp: g.boss ? Math.round(g.boss.hp) : null, alive: g.boss?.alive, ph: g.boss?.phase, deaths: b.deaths, dmg: Math.round(b.dmg), crashes: b.crashes, fireballs: b.fireballs, phaseAt: b.phaseAt, state: g.state };
    });
    if (i % 5 === 0) console.log(JSON.stringify(r));
    if (!r.alive) break;
  }
  const modes = await h.eval(() => Object.fromEntries(Object.entries(window.__bot.modes).map(([k, v]) => [k, +v.toFixed(1)])));
  console.log('final', JSON.stringify(r));
  console.log('time in modes', JSON.stringify(modes));
  console.log('damage by move', JSON.stringify(await h.eval(() => window.__bot.byMove)));
  h.check('bot kills Skrieka in 1.5 to 4 minutes', !r.alive && r.t > 90 && r.t < 240, JSON.stringify(r));
}
