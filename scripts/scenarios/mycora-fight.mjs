// Mycora, the Spore Mother, fought for real. A scripted bot takes phase 1 with the game's own
// inputs (it burns her spore sacs with fire breath, jumps her root sweeps and spore rings, steps
// out from under spore bombs, burns sporelings, and lays into her while she is collapsed);
// phases 2 and 3 are then checked beat by beat: the slam pair and the stuck punish window,
// blight burned away, the canopy reached from a bounce cap, her fall, and the finish.

import { grove, boss, step, shot, place, until, LAB } from './mycora-lib.mjs';
import { strike, me } from './foe-lib.mjs';

/**
 * The bot, run inside the page for `sec` of game time (1/30 s steps). Returns what it did.
 * It only moves the stick, turns the camera and presses buttons, like a player would.
 */
function installBot() {
  window.__bot = (sec, stopWhen) => {
    const g = window.wyrm;
    const b = window.__boss;
    const p = g.player;
    const inp = g.input;
    const C = { x: b.grove.cx, z: b.grove.cz };
    const R = 6.3;
    const log = { jumps: 0, breathT: 0, horns: 0, tails: 0, bursts: 0, dodges: 0, hitsTaken: 0, hp0: p.hp, t: 0, collapses0: b.stats.collapses };
    const down = new Set();
    const set = (a, on) => {
      if (on && !down.has(a)) { inp.simulate(a, true); down.add(a); }
      if (!on && down.has(a)) { inp.simulate(a, false); down.delete(a); }
    };
    let jumpT = 0;
    let pressT = 0;
    let presses = 0;
    let hp = p.hp;
    const angOf = (x, z) => Math.atan2(x - C.x, z - C.z);
    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    /** Steer toward world point (x, z) at full tilt (the camera turned that way). */
    const go = (x, z, slow = 1) => {
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < 0.35) { inp.forceMove = null; return d; }
      g.cam.yaw = Math.atan2(x - p.x, z - p.z);
      inp.forceMove = { x: 0, y: Math.min(1, d / 1.5) * slow };
      return d;
    };
    const face = (x, z) => {
      const yaw = Math.atan2(x - p.x, z - p.z);
      g.cam.yaw = yaw;
      p.yaw = yaw;
    };
    for (let k = 0; k < sec * 30; k++) {
      log.t += 1 / 30;
      if (stopWhen && stopWhen(b)) break;
      if (p.hp < hp - 0.5) log.hitsTaken++;
      hp = p.hp;
      jumpT = Math.max(0, jumpT - 1 / 30);
      pressT = Math.max(0, pressT - 1 / 30);
      const pa = angOf(p.x, p.z);
      const pd = Math.hypot(p.x - C.x, p.z - C.z);
      let dodge = null;
      let jump = false;
      // Her root sweep: jump it as it comes.
      if (b.mode === 'sweep' && b.state === 'active' && pd > 2.4 && pd < 14) {
        const ahead = wrap(pa - b.sweepA) * b.sweepDir;
        const w = (b.phase >= 2 ? 2.9 : 2.5) * g.difficultyInfo.aggression;
        if (ahead > -0.05 && ahead / w < 0.2) jump = true;
      }
      // Shockwave rings (her gasp, her slams): jump as the ring arrives.
      for (const s of g.shockwaves) {
        if (!s.alive) continue;
        const d = Math.hypot(p.x - s.x, p.z - s.z);
        const gap = d - s.r;
        if (gap > -0.3 && gap / s.speed < 0.16 && d < s.maxR + 0.5) jump = true;
      }
      // Spore bombs: step out from under wherever one will land.
      for (const q of g.projectiles) {
        if (!q.alive || q.spec.fromPlayer || !(q.spec.gravity > 0)) continue;
        const gy = b.floor + 0.3;
        const a = -0.5 * q.spec.gravity;
        const disc = q.vy * q.vy - 4 * a * (q.y - gy);
        if (disc < 0) continue;
        const t = (-q.vy - Math.sqrt(disc)) / (2 * a);
        if (t < 0) continue;
        const lx = q.x + q.vx * t;
        const lz = q.z + q.vz * t;
        const r = (q.spec.explode ?? 2) + 1.2;
        const dd = Math.hypot(p.x - lx, p.z - lz);
        if (dd < r) {
          const n = dd || 1;
          dodge = { x: p.x + ((p.x - lx) / n) * (r - dd + 1.5), z: p.z + ((p.z - lz) / n) * (r - dd + 1.5) };
        }
      }
      // Standing in a spore cloud: get out.
      if (!dodge) {
        for (const h of g.level.hittables) {
          if (!h.alive || h.isEnemy || h.constructor.name !== 'SporeCloud' && h.constructor.name !== 'BlightPatch') continue;
          const dd = Math.hypot(p.x - h.x, p.z - h.z);
          if (dd < h.radius + 0.4) {
            const n = dd || 1;
            dodge = { x: h.x + ((p.x - h.x) / n) * (h.radius + 1.5), z: h.z + ((p.z - h.z) / n) * (h.radius + 1.5) };
          }
        }
      }
      // A slam or lash aimed at the ground under Aster: get out of its disc.
      if (!dodge && (b.mode === 'slam' || b.mode === 'lash') && b.state === 'windup') {
        const [mx, mz] = b.mode === 'slam' ? [b.slamX, b.slamZ] : [b.lashX, b.lashZ];
        const dd = Math.hypot(p.x - mx, p.z - mz);
        if (dd < 4.2) {
          const n = dd || 1;
          dodge = { x: mx + ((p.x - mx) / n) * 5.5, z: mz + ((p.z - mz) / n) * 5.5 };
        }
      }
      if (jump && jumpT <= 0 && p.body.grounded) {
        set('breath', false);
        set('jump', true);
        jumpT = 0.45;
        log.jumps++;
      } else if (jumpT < 0.2) set('jump', false);
      if (dodge) {
        set('breath', false);
        go(dodge.x, dodge.z);
        log.dodges++;
      } else if (b.mode === 'collapse' || b.mode === 'downed' || b.mode === 'stuck' || b.mode === 'reel') {
        // Punish: up close, Horn combos with a Tail finisher.
        set('breath', false);
        const d = Math.hypot(p.x - b.x, p.z - b.z);
        if (d > b.radius + 1.8) go(b.x, b.z);
        else {
          inp.forceMove = null;
          face(b.x, b.z);
          if (pressT <= 0) {
            presses++;
            const tail = presses % 4 === 0;
            inp.simulate(tail ? 'tail' : 'horn', true);
            inp.simulate(tail ? 'tail' : 'horn', false);
            if (tail) log.tails++; else log.horns++;
            pressT = 0.24;
          }
        }
      } else {
        // Sporelings close by: burn them (fire leaves no spores).
        const sp = g.enemies.find((e) => e.alive && e.def.id === 'sporeling' && Math.hypot(e.x - p.x, e.z - p.z) < 3.2 && e.state !== 'spawn');
        const sacs = b.sacs.filter((s) => s.alive);
        if (sp && p.mana > 6) {
          inp.forceMove = null;
          face(sp.x, sp.z);
          set('breath', true);
          log.breathT += 1 / 30;
        } else if (sacs.length && b.phase === 1) {
          // The sac nearest round the ring from here, and the spot in front of it.
          let best = sacs[0];
          let bd = 9;
          for (const s of sacs) {
            const da = Math.abs(wrap(angOf(s.x, s.z) - pa));
            if (da < bd) { bd = da; best = s; }
          }
          const sa = angOf(best.x, best.z);
          const diff = wrap(sa - pa);
          const step = Math.max(-0.7, Math.min(0.7, diff));
          const tx = C.x + Math.sin(pa + step) * R;
          const tz = C.z + Math.cos(pa + step) * R;
          if (Math.abs(diff) > 0.3 || Math.abs(pd - R) > 1.2) {
            set('breath', false);
            go(tx, tz);
          } else if (p.mana > 6) {
            inp.forceMove = null;
            face(C.x, C.z);
            set('breath', true);
            log.breathT += 1 / 30;
          } else {
            set('breath', false);
            go(tx, tz, 0.3);
          }
        } else {
          set('breath', false);
          const tx = C.x + Math.sin(pa) * R;
          const tz = C.z + Math.cos(pa) * R;
          go(tx, tz);
        }
      }
      window.__step(1 / 30, 1 / 30);
    }
    for (const a of [...down]) set(a, false);
    inp.forceMove = null;
    log.hp = p.hp;
    log.alive = p.alive;
    log.collapses = b.stats.collapses - log.collapses0;
    return log;
  };
}

export default async function (h) {
  await grove(h, { awake: false });
  await h.eval(installBot);
  // A fresh Aster, south of her, and the fight begins.
  await place(h, LAB.x, LAB.z - 9, 0);
  await h.eval(() => { const g = window.wyrm; g.player.hp = g.player.maxHp; g.player.mana = g.player.maxMana; window.__boss.awake = true; g.audio.setMusic(null); });
  await step(h, 0.3);
  const b0 = await boss(h);
  h.check('she wakes, rooted, with three spore sacs', b0.awake && b0.phase === 1 && b0.sacs === 3, JSON.stringify(b0));

  // --- Phase 1, fought by the bot, in stretches (so a death shows up in the log). ---
  let phase1 = null;
  let total = { jumps: 0, hits: 0, breathT: 0, horns: 0, tails: 0, collapses: 0, t: 0 };
  for (let round = 0; round < 8; round++) {
    const log = await h.eval(() => window.__bot(20, (b) => b.phase > 1));
    total.jumps += log.jumps;
    total.hits += log.hitsTaken;
    total.breathT += log.breathT;
    total.horns += log.horns;
    total.tails += log.tails;
    total.collapses += log.collapses;
    total.t += log.t;
    const bs = await boss(h);
    console.log(`round ${round}: t=${log.t.toFixed(1)} hp=${Math.round(log.hp)} jumps=${log.jumps} hits=${log.hitsTaken} breath=${log.breathT.toFixed(1)}s horns=${log.horns} boss=${bs.hp} ${bs.mode} sacs=${bs.sacs} collapses=${bs.stats.collapses} sweeps=${bs.stats.sweeps} lobs=${bs.stats.lobs} calls=${bs.stats.calls}`);
    if (round === 0) await shot(h, 'mycora-bot-p1');
    if (!log.alive) break;
    // A potion's worth between stretches keeps the bot going (it has no gems to spend).
    await h.eval(() => { const p = window.wyrm.player; p.hp = Math.min(p.maxHp, p.hp + 40); });
    if (bs.phase > 1) {
      phase1 = bs;
      break;
    }
  }
  console.log('phase 1 took', total.t.toFixed(1), 's', JSON.stringify(total));
  h.check('the bot burns her sacs with fire and she collapses', total.collapses >= 1 && total.breathT > 2, JSON.stringify(total));
  h.check('the bot jumps her sweeps and rings', total.jumps >= 2, JSON.stringify(total));
  h.check('really fighting (no cheats), phase 1 falls and she tears free', !!phase1 && phase1.phase === 2, JSON.stringify(phase1));
  h.check('phase 1 lasts a fair while even for a perfect bot (25 s or more)', total.t >= 25, `${total.t.toFixed(1)} s`);

  // --- Phase 2 ---
  await until(h, () => window.__boss.mode === 'stalk', 6);
  const p2 = await boss(h);
  h.check('torn free, she stalks the grove and her puffcaps sprout', p2.phase === 2 && p2.mode === 'stalk' && p2.puffs >= 1, JSON.stringify(p2));
  await h.eval(() => { const g = window.wyrm; g.player.hp = g.player.maxHp; g.player.invuln = true; });
  // A slam pair, then her arms stick: the punish window.
  await h.eval(() => { const b = window.__boss; b.pattern = 0; b.nextIn = 0; });
  const stuck = await until(h, () => window.__boss.mode === 'stuck', 12);
  const waves = await h.eval(() => window.__boss.stats.slams);
  h.check('she slams twice (shockwaves) and gets her arms stuck', stuck && waves >= 2, JSON.stringify(await boss(h)));
  await h.eval(() => { window.__foes = [window.__boss]; });
  const hit1 = await strike(h, 0, { damage: 10 });
  h.check('stuck, she takes extra (x1.4)', hit1.dmg >= 13.9 && hit1.dmg <= 14.1, JSON.stringify(hit1));
  await shot(h, 'mycora-bot-stuck');
  // Blight: she seeds the floor; fire burns a patch away.
  await h.eval(() => { const b = window.__boss; b.settle(); b.setMode('stalk'); b.startBlight(); });
  await step(h, 3);
  const patches = await h.eval(() => window.wyrm.level.hittables.filter((x) => x.alive && x.constructor.name === 'BlightPatch').length);
  // Fire on a patch (three ticks of fire breath) burns it away.
  await h.eval(() => {
    const g = window.wyrm;
    const pt = g.level.hittables.find((x) => x.alive && x.constructor.name === 'BlightPatch');
    for (let i = 0; i < 3; i++) pt.takeHit({ damage: 2.4, type: 'fire', fromPlayer: true, source: 'breath', move: 'fireBreath', heavy: false });
    window.__patch = pt;
  });
  await step(h, 0.2);
  const burnt = await h.eval(() => window.__patch.burning || !window.__patch.alive);
  h.check('her blight breath seeds patches on the floor; a moment of fire burns one away', patches >= 2 && burnt, JSON.stringify({ patches, burnt }));
  await shot(h, 'mycora-bot-blight');
  // Heavy blows add up to a reel.
  await h.eval(() => { const b = window.__boss; b.settle(); b.setMode('stalk'); b.nextIn = 9; });
  for (let i = 0; i < 12; i++) await strike(h, 0, { damage: 2, heavy: true, stagger: 40 });
  const reel = await boss(h);
  h.check('heavy blows make her reel (a punish window)', reel.mode === 'reel' && reel.stats.stagger >= 1, JSON.stringify(reel));

  // --- Phase 3 ---
  await h.eval(() => { const b = window.__boss; b.hp = b.maxHp * 0.34; b.settle(); b.setMode('stalk'); });
  await strike(h, 0, { damage: 40 });
  const hung = await until(h, () => window.__boss.mode === 'hang', 12);
  const p3 = await boss(h);
  h.check('below a third, she climbs into the canopy and the bounce caps sprout', hung && p3.phase === 3 && p3.caps === 4 && p3.y > 5, JSON.stringify(p3));
  // A bounce cap throws Aster up to her; an air strike connects.
  await h.eval(() => { const b = window.__boss; b.nextIn = 99; window.wyrm.player.invuln = true; });
  const cap = await h.eval(() => { const c = window.__boss.grove.caps[0]; return { x: c.x, z: c.z, y: c.y }; });
  await h.eval((c) => { const g = window.wyrm; g.player.place(c.x, c.y + 2.3, c.z, Math.atan2(window.__boss.x - c.x, window.__boss.z - c.z)); g.player.body.vy = -1; }, cap);
  const flight = await h.eval(() => {
    const g = window.wyrm;
    const p = g.player;
    const b = window.__boss;
    const hp0 = b.hp;
    let top = -99;
    let pressed = 0;
    for (let k = 0; k < 90; k++) {
      // Drift in toward her, and swing when level with her.
      const yaw = Math.atan2(b.x - p.x, b.z - p.z);
      g.cam.yaw = yaw;
      p.yaw = yaw;
      g.input.forceMove = Math.hypot(b.x - p.x, b.z - p.z) > b.radius + 1.6 ? { x: 0, y: 1 } : null;
      if (p.y > b.y + 1.5 && k % 6 === 0 && pressed < 6) {
        g.input.simulate('horn', true);
        g.input.simulate('horn', false);
        pressed++;
      }
      top = Math.max(top, p.y);
      window.__step(1 / 30, 1 / 30);
    }
    g.input.forceMove = null;
    return { top: +top.toFixed(2), bossY: +b.y.toFixed(2), dealt: Math.round(hp0 - b.hp), canopy: Math.round(b.canopyDmg), bounces: b.grove.caps[0].bounces };
  });
  h.check('a bounce cap throws Aster up level with her, and an air strike lands', flight.bounces >= 1 && flight.top > flight.bossY + 1.5 && flight.dealt > 0, JSON.stringify(flight));
  await shot(h, 'mycora-bot-canopy');
  // Hurt enough up there, she loses her grip and falls; down, she takes extra.
  await h.eval(() => { window.__boss.canopyDmg = 999; });
  const fell = await until(h, () => window.__boss.mode === 'downed', 5);
  const hit3 = await strike(h, 0, { damage: 10 });
  h.check('she falls, and down on the floor she takes extra (x1.3)', fell && hit3.dmg >= 12.9, JSON.stringify(hit3));
  const up2 = await until(h, () => window.__boss.mode === 'hang', 14);
  h.check('if she is not finished, she climbs back up', up2, JSON.stringify(await boss(h)));
  // The last fall is for good.
  await h.eval(() => { const b = window.__boss; b.hp = b.maxHp * 0.1; });
  await step(h, 0.2);
  const last = await until(h, () => window.__boss.mode === 'downed', 5);
  await step(h, 12);
  const stay = await boss(h);
  h.check('weak enough, she falls for the finish and stays down', last && stay.mode === 'downed' && stay.alive, JSON.stringify(stay));
  for (let i = 0; i < 20 && (await boss(h)).alive; i++) await strike(h, 0, { damage: 30, heavy: true });
  await step(h, 1.5);
  const end = await boss(h);
  h.check('she can be defeated; her brood withers and the caps sleep', !end.alive && end.brood === 0 && end.puffs === 0 && end.caps === 0, JSON.stringify(end));
  const s = await me(h);
  h.check('Aster alive at the end', s.alive, JSON.stringify(s));
}
