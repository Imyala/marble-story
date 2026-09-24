// A simple in-page bot fights Forgemaster Grolm with real inputs to measure
// fight length and how much damage a careful player takes.
// It jumps shockwaves and sweeps, leaves slam and stomp rings and frost patches,
// hits the furnace when the hammer sticks, burns the rime shell with fire and
// throws fireballs from range otherwise. HP is topped up below 25 and counted.
import { place, waitGame, until } from './frostlib.mjs';

export default async function (h) {
  await h.go('?level=frostworks&seed=6&quality=low&maxdt=0.1', 3000);
  await h.skipDialogue();
  await h.eval(() => { const g = window.wyrm; for (const e of ['fire', 'lightning']) if (!g.save.elements.includes(e)) g.learnElement(e); });
  await place(h, 0, 233, 0, 13);
  await waitGame(h, 0.5);
  await h.skipDialogue(8000);
  const ok = await until(h, () => window.wyrm.boss && window.wyrm.boss.awake, null, 5);
  h.check('fight started', !!ok);
  await h.eval(() => {
    const g = window.wyrm;
    const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code }));
    const held = new Set();
    const hold = (code, on) => {
      if (on && !held.has(code)) { key(code, true); held.add(code); }
      if (!on && held.has(code)) { key(code, false); held.delete(code); }
    };
    const tap = (code) => { key(code, true); setTimeout(() => key(code, false), 0); };
    const byMove = {};
    const th = g.player.takeHit.bind(g.player);
    g.player.takeHit = (hit, src) => {
      const before = g.player.hp;
      const r = th(hit, src);
      const lost = before - g.player.hp;
      if (lost > 0) { const k = src && src !== g.boss ? `minion:${hit.move}` : hit.move; byMove[k] = (byMove[k] ?? 0) + Math.round(lost); }
      return r;
    };
    const st = window.__bot = { byMove, t0: g.time, heals: 0, dmg: 0, lastHp: g.player.hp, atkT: 0, qT: 0, jumpT: 0, log: [], phaseT: {}, done: false, strafe: 1, swapT: 0 };
    const f = g.frame.bind(g);
    g.frame = (dt) => {
      try { think(); } catch (e) { st.err = String(e); }
      f(dt);
    };
    function think() {
      const p = g.player;
      const b = g.boss;
      if (g.state === 'dialogue') { tap('Escape'); return; }
      if (!b || !b.alive) {
        if (!st.done) { st.done = true; st.t1 = g.time; }
        g.input.forceMove = null;
        for (const c of [...held]) hold(c, false);
        return;
      }
      if (g.state !== 'play') return;
      if (!st.phaseT[b.phase]) st.phaseT[b.phase] = +(g.time - st.t0).toFixed(1);
      if (p.hp < st.lastHp) st.dmg += st.lastHp - p.hp;
      if (p.hp < 25) { st.heals++; p.hp = p.maxHp; }
      st.lastHp = p.hp;
      const dx = b.x - p.x;
      const dz = b.z - p.z;
      const d = Math.hypot(dx, dz);
      const toBoss = Math.atan2(dx, dz);
      g.cam.yaw = toBoss;
      const now = g.time;
      const grounded = p.body.grounded;
      let mx = 0;
      let my = 0;
      let jumpNow = false;
      // --- danger ---
      for (const s of g.shockwaves) {
        if (!s.alive) continue;
        const sd = Math.hypot(p.x - s.x, p.z - s.z);
        if (sd > s.r && sd - s.r < 1.8) jumpNow = true;
      }
      const a = b.attack;
      if (a && a.id === 'sweep' && ((b.state === 'windup' && b.stateT > a.windup * 0.72) || b.state === 'active') && d < 9) jumpNow = true;
      let flee = null;
      if (a && a.id === 'slam' && b.state === 'windup' && b.slamMarked) {
        const id = Math.hypot(p.x - b.impactX, p.z - b.impactZ);
        if (id < 4.5) flee = [p.x - b.impactX, p.z - b.impactZ];
      }
      if (a && a.id === 'stomp' && b.state === 'windup' && d < 5.5) flee = [-dx, -dz];
      for (const pt of b.patches) {
        const pd = Math.hypot(p.x - pt.x, p.z - pt.z);
        if (pd < pt.r + 1) flee = [p.x - pt.x, p.z - pt.z];
      }
      const exposed = b.stuck > 0 || b.state === 'hitstun';
      const shelled = b.shellHp > 0;
      // --- offense ---
      let breathe = false;
      let horn = false;
      if (flee) {
        const n = Math.hypot(flee[0], flee[1]) || 1;
        // Convert a world direction into camera-relative axes (camera faces the boss).
        const fx = flee[0] / n;
        const fz = flee[1] / n;
        const c = Math.cos(toBoss);
        const s = Math.sin(toBoss);
        my = fx * s + fz * c;
        mx = -(fx * c - fz * s);
      } else if (shelled) {
        if (p.element !== 'fire') tap('Digit1');
        if (d > 4.2) my = 1;
        else if (d < 3.2) my = -0.5;
        breathe = p.mana > 6 && d < 6;
        if (p.mana <= 6) { my = -1; mx = st.strafe; }
      } else if (exposed) {
        if (d > 3.3) my = 1;
        horn = d < 4.5;
      } else {
        // Keep a respectful distance, circle, and throw fireballs.
        if (p.element !== 'fire') tap('Digit1');
        st.swapT -= 0.1;
        if (st.swapT <= 0) { st.swapT = 2 + Math.random() * 2; st.strafe = -st.strafe; }
        mx = st.strafe;
        if (d < 8) my = -0.7;
        else if (d > 12) my = 0.7;
        if (p.mana > 45 && now - st.qT > 1.4 && d < 16) { st.qT = now; tap('KeyQ'); }
        // Minions nearby: melt them.
        const m = b.minions.find((e) => e.alive && Math.hypot(e.x - p.x, e.z - p.z) < 6);
        if (m) {
          g.cam.yaw = Math.atan2(m.x - p.x, m.z - p.z);
          p.yaw = g.cam.yaw;
          breathe = p.mana > 10;
          mx = 0;
          my = 0;
        }
      }
      g.input.forceMove = { x: mx, y: my };
      hold('KeyK', breathe && !jumpNow);
      if (horn && now - st.atkT > 0.18) { st.atkT = now; tap('KeyJ'); }
      if (held.has('Space') && now - st.jumpT > 0.32) hold('Space', false);
      if (jumpNow && grounded && !held.has('Space') && now - st.jumpT > 0.5) { st.jumpT = now; hold('Space', true); }
    }
  });
  let last = '';
  const startMs = Date.now();
  for (let i = 0; Date.now() - startMs < 55 * 60 * 1000; i++) {
    const r = await h.eval(() => {
      const g = window.wyrm;
      const st = window.__bot;
      const b = g.boss;
      return { done: st.done, t: +(g.time - st.t0).toFixed(1), hp: b ? Math.round(b.hp) : 0, ph: b ? b.phase : 0, shell: b ? Math.round(b.shellHp) : 0, php: Math.round(g.player.hp), heals: st.heals, err: st.err ?? '', state: g.state };
    });
    const line = `t=${r.t} boss=${r.hp} ph=${r.ph} shell=${r.shell} php=${r.php} heals=${r.heals} ${r.state} ${r.err}`;
    if (i % 25 === 0 && line !== last) { console.log(line); last = line; }
    if (i === 60) await h.shot('fbot-mid');
    if (r.done || r.state === 'dialogue' || r.t > 400) break;
    await h.wait(400);
  }
  const res = await h.eval(() => { const st = window.__bot; return { t: st.t1 ? +(st.t1 - st.t0).toFixed(1) : null, heals: st.heals, dmg: Math.round(st.dmg), phases: st.phaseT, byMove: st.byMove }; });
  console.log('RESULT', JSON.stringify(res));
  h.check('bot defeated Grolm', res.t !== null, JSON.stringify(res));
}
