// A simple combat bot fights Nyxa start to finish to measure the fight: it
// locks on, dodges late in her windups, uses horn combos up close and breath
// at range (rotating all four elements). Damage it takes is tallied; it is
// kept alive so the whole fight can be timed.
import { place, run, down, up } from './keeplib.mjs';

export default async function (h) {
  await h.go('?level=keep&seed=11&quality=low&maxdt=0.25', 3000);
  await h.skipDialogue();
  await h.eval(() => {
    const g = window.wyrm;
    for (const e of ['fire', 'lightning', 'ice', 'earth']) if (!g.save.elements.includes(e)) g.learnElement(e);
    for (const e of g.enemies) if (!e.isBoss) e.die(null);
  });
  await place(h, 0, -243, Math.PI);
  await run(h, [{ keys: down('KeyW') }, { when: 'g.state === "dialogue"', keys: up('KeyW') }, { after: 0.8 }], 8);
  await h.skipDialogue(6000);
  await h.eval(() => { const g = window.wyrm; if (g.state === 'pause') g.resume(); });
  const result = await h.eval(() => new Promise((res) => {
    const g = window.wyrm;
    const key = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code }));
    const held = new Set();
    const hold = (code, on) => {
      if (on && !held.has(code)) { key('keydown', code); held.add(code); }
      if (!on && held.has(code)) { key('keyup', code); held.delete(code); }
    };
    const press = (code) => { key('keydown', code); key('keyup', code); };
    const orig = g.frame;
    g.maxDt = 0.12;
    const t0 = g.realTime;
    let lastHp = g.player.hp;
    let taken = 0;
    let refills = 0;
    let hornT = 0;
    let dodgedFor = null;
    let elemT = 0;
    let elemI = 0;
    const phaseAt = {};
    const hits = {};
    let perfect = 0;
    const elems = ['Digit3', 'Digit4', 'Digit1', 'Digit2'];
    const origHud = g.hud.perfect.bind(g.hud);
    g.hud.perfect = () => { perfect++; origHud(); };
    const origDamaged = g.onEnemyDamaged.bind(g);
    g.onEnemyDamaged = (e, dmg, hit, r) => { if (e === g.boss && hit) hits[hit.type] = (hits[hit.type] ?? 0) + dmg; origDamaged(e, dmg, hit, r); };
    g.frame = (dt) => {
      orig.call(g, dt);
      const p = g.player;
      const b = g.boss;
      const t = g.realTime - t0;
      if (p.hp < lastHp) taken += lastHp - p.hp;
      if (p.hp < 35) { p.hp = p.maxHp; refills++; }
      lastHp = p.hp;
      if (g.state === 'pause') g.resume();
      if (!b || !b.alive || t > 420) {
        for (const c of [...held]) hold(c, false);
        g.frame = orig;
        res({ t: t.toFixed(1), alive: !!b?.alive, hp: b ? Math.round(b.hp) : null, taken: Math.round(taken), refills, perfect, phaseAt, hits: Object.fromEntries(Object.entries(hits).map(([k, v]) => [k, Math.round(v)])) });
        return;
      }
      if (!phaseAt[b.phase]) phaseAt[b.phase] = t.toFixed(1);
      if (g.state !== 'play') return;
      p.mana = Math.max(p.mana, 0);
      if (!b.hidden) p.lock = b;
      const d = Math.hypot(b.x - p.x, b.z - p.z);
      elemT -= dt;
      if (elemT <= 0) { elemT = 7; elemI = (elemI + 1) % 4; press(elems[elemI]); }
      // Dodge late in a telegraphed attack.
      const a = b.attack;
      if (a && b.state === 'windup' && dodgedFor !== a && ['scythe', 'lunge', 'ambush', 'breath', 'dive', 'nova'].includes(a.id) && d < 9) {
        const w = a.windup / (g.difficultyInfo.aggression * (b.phase === 3 ? 1.3 : 1));
        if (b.stateT > w * 0.72) { hold('KeyK', false); press('ShiftLeft'); dodgedFor = a; return; }
      }
      hornT -= dt;
      const reachable = Math.abs(b.y - p.y) < 2;
      if (d < 3.4 && reachable) {
        hold('KeyW', false);
        hold('KeyK', false);
        if (hornT <= 0) { press('KeyJ'); hornT = 0.22; }
      } else if (d < 9 && p.mana > 12) {
        hold('KeyW', false);
        hold('KeyK', true);
      } else {
        hold('KeyK', false);
        hold('KeyW', true);
      }
    };
  }));
  console.log('fight', JSON.stringify(result));
  h.check('the bot defeats Nyxa', !result.alive, JSON.stringify(result));
}
