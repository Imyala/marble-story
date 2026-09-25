// Stonewild Plains critical path with real inputs: the spring, the vines,
// the gorge climb, the lightning door, the arenas and the canyon door.
// Rendering is cut down (test only) so software GL keeps up with the inputs.
import { setup } from './plains-lib.mjs';

export default async function (h) {
  await h.go('?level=plains&seed=1&quality=low&maxdt=0.25', 3000);
  await h.skipDialogue();
  // Roaming enemies would only get in the way of the timing tests.
  const { settle, tp, face, pos, walkTo, jumpTo, breathe, auto } = await setup(h);
  void face;
  void pos;
  const st = () => h.state();
  const arenas = () => h.eval(() => window.wyrm.level.arenas.map((a) => `${a.id}:${a.state}`).join(' '));
  const springs = () => h.eval(() => window.wyrm.level.props.filter((p) => p.frozen !== undefined).map((s) => ({ x: s.x, z: s.z, top: s.y + s.height, frozen: s.frozen })));
  /** Finishes an arena by striking down each wave as it arrives. */
  const clearArena = async (id) => {
    const bad = [];
    for (let i = 0; i < 30; i++) {
      const r = await h.eval((id) => {
        const g = window.wyrm;
        const a = g.level.arenas.find((q) => q.id === id);
        if (!a || a.state === 'cleared') return { done: true, bad: [] };
        // Every wave spawns on open ground inside the ring.
        const bad = [];
        for (const e of g.enemies) {
          if (!e.alive || e.state === 'spawn' || e.def.flying) continue;
          const gy = g.col.groundAt(e.x, e.z, e.y + 1, 0.2).y;
          if (Math.abs(e.y - gy) > 0.6 || Math.hypot(e.x - a.x, e.z - a.z) > a.r || g.col.blocked(e.x, e.y + 0.2, e.z, e.radius * 0.8, e.height * 0.8)) bad.push(`${e.def.id}@${e.x.toFixed(1)},${e.z.toFixed(1)}`);
        }
        g.player.hp = g.player.maxHp;
        for (const e of g.enemies) if (e.alive && e.state !== 'spawn') e.die(null);
        return { done: false, bad };
      }, id);
      bad.push(...r.bad);
      if (r.done) break;
      await h.wait(500);
    }
    h.check(`${id} waves spawn on open ground`, bad.length === 0, bad.join('; '));
  };

  // --- 1. The hot spring scalds and pushes back ---------------------------------------
  await tp(0, 20.5, 0);
  await walkTo(0, 24.05, 0.3, 6);
  await h.wait(800);
  let s = await st();
  h.check('unfrozen spring scalds and does not lift you onto the Meadow', s.y < 4 && s.hp < 100, JSON.stringify(s));

  // --- 2. Freeze it, hop on, jump and flap up the wall ------------------------------------
  await tp(0, 20, 0);
  await breathe('Digit3', 1300);
  let sp = await springs();
  h.check('ice freezes the Vale spring', sp[0].frozen === true, JSON.stringify(sp[0]));
  await h.shot('pl-spring-frozen');
  await tp(0, 21.6, 0);
  await jumpTo(0, 24.05);
  s = await st();
  h.check('stood on the frozen spring', Math.abs(s.y - 3.2) < 0.3, JSON.stringify(s));
  await jumpTo(0, 28);
  s = await st();
  h.check('climbed the terrace wall onto the Meadow', s.y > 6 && s.z > 25, JSON.stringify(s));
  await h.shot('pl-spring-top');

  // --- 3. Burn the vines, walk up the gatehouse stair --------------------------------------
  await tp(0, 84.5, 0);
  await breathe('Digit1', 1200);
  const vines = await h.eval(() => window.wyrm.level.hittables.filter((x) => x.kind === 'vines').map((x) => ({ x: x.x, z: x.z, alive: x.alive })));
  h.check('fire burns the gatehouse vines', vines.some((v) => Math.abs(v.z - 87.4) < 0.5 && !v.alive), JSON.stringify(vines));
  await walkTo(0, 99, 0.8, 8000);
  s = await st();
  h.check('walked up the stair to the terrace', s.y > 11 && s.z > 96, JSON.stringify(s));
  await h.shot('pl-stair');
  await h.wait(1200);
  let ar = await arenas();
  h.check('colonnade arena starts', ar.includes('colonnade:active'), ar);
  await clearArena('colonnade');
  ar = await arenas();
  h.check('colonnade arena clears', ar.includes('colonnade:cleared'), ar);
  await settle();

  // --- 4. The gorge climb ------------------------------------------------------------------
  await tp(0, 119.6, 0);
  sp = await springs();
  for (let i = 1; i <= 3; i++) {
    const t = sp[i];
    const q = await pos();
    await face(Math.atan2(t.x - q.x, t.z - q.z));
    await breathe('Digit3', 1000);
    const f = (await springs())[i].frozen;
    h.check(`gorge spring ${i} freezes`, f === true);
    await jumpTo(t.x, t.z);
    s = await st();
    h.check(`landed on gorge spring ${i}`, Math.abs(s.y - t.top) < 0.3, JSON.stringify(s) + ' top ' + t.top.toFixed(2));
    if (i === 1) await h.shot('pl-gorge-1');
  }
  await h.shot('pl-gorge-3');
  await jumpTo(-1, 136.5, false);
  s = await st();
  h.check('reached Cairn Heights by the springs', s.y > 18.9 && s.z > 133, JSON.stringify(s));
  await h.shot('pl-heights-top');

  // --- 5. Two lightning crystals open the Circle ---------------------------------------------
  await tp(-5.5, 155.5, 0);
  await breathe('Digit2', 900);
  await tp(9, 148, 0);
  await breathe('Digit2', 1100);
  await h.wait(1500);
  const sw = await h.eval(() => window.wyrm.level.hittables.filter((x) => x.kind === 'lightning').map((x) => x.on));
  const southOpen = await h.eval(() => window.wyrm.level.fired.has('circle-south'));
  h.check('both lightning crystals lit and the Circle door opens', sw.every(Boolean) && southOpen, JSON.stringify(sw));
  await h.shot('pl-circle-door');
  await settle();
  await tp(0, 159, 0);
  await walkTo(0, 166, 0.8, 5000);
  await h.wait(1200);
  ar = await arenas();
  h.check('circle arena starts', ar.includes('circle:active'), ar);
  await h.wait(1500);
  // Freeze a golem and shatter it with the tail, for real.
  const golem = await h.eval(() => {
    const g = window.wyrm;
    const e = g.enemies.find((q) => q.alive && q.def.id === 'stoneGolem' && q.state !== 'spawn');
    if (!e) return null;
    g.player.hp = g.player.maxHp;
    // Hold its swings so a knockdown cannot eat the tail press.
    e.globalCd = 99;
    g.player.place(e.x, e.y + 0.05, e.z - 2.6, 0);
    g.player.yaw = 0;
    g.cam.snapBehind(0);
    window.__golem = e;
    return { hp: Math.round(e.hp) };
  });
  if (golem) await breathe('Digit3', 2600);
  const chill = await h.eval(() => (window.__golem ? { frozen: window.__golem.status.frozen, hp: Math.round(window.__golem.hp) } : { frozen: 0 }));
  const r0 = await h.eval(() => window.wyrm.save.stats.reactions);
  await h.eval(() => { const g = window.wyrm; const e = window.__golem; if (e) { g.player.place(e.x, e.y + 0.05, e.z - 2.4, 0); g.player.yaw = 0; } });
  // Let the breath wind down first: a Tail pressed mid-breath is not taken.
  await h.wait(250);
  await h.tap('KeyE', 1, 1500);
  const r1 = await h.eval(() => window.wyrm.save.stats.reactions);
  h.check('ice freezes a golem and the tail shatters it', chill.frozen > 0 && r1 > r0, `golem ${JSON.stringify(golem)} after ice ${JSON.stringify(chill)} reactions ${r0}->${r1}`);
  await h.shot('pl-shatter');
  await clearArena('circle');
  ar = await arenas();
  const northOpen = await h.eval(() => window.wyrm.level.fired.has('circle-north'));
  h.check('circle arena clears and opens the north door', ar.includes('circle:cleared') && northOpen, ar);
  await settle();
  await walkTo(0, 193, 0.8, 6000);
  s = await st();
  h.check('walked out through the north door', s.z > 191 && s.y > 19, JSON.stringify(s));

  // --- 6. Down the ramp, clear the camp, pound the plate ------------------------------------------
  for (const [x, z] of [[0, 199], [9, 204], [15, 210], [12, 216], [5, 217]]) await walkTo(x, z, 1.0, 5000);
  s = await st();
  h.check('walked down the ramp to the Burrow Fields', Math.abs(s.y - 5) < 0.8 && s.z > 212, JSON.stringify(s));
  await walkTo(0, 220, 1.0, 4000);
  await h.wait(1500);
  ar = await arenas();
  h.check('camp arena starts', ar.includes('camp:active'), ar);
  await clearArena('camp');
  ar = await arenas();
  h.check('camp arena clears', ar.includes('camp:cleared'), ar);
  await settle();
  await tp(0, 229.3, 0);
  await auto({ kind: 'jump', x: 0, z: 229.3, stop: 0.3, slow: 1, flap: false, slam: true, slamAt: 0.3 });
  await h.wait(800);
  const door = await h.eval(() => window.wyrm.level.fired.has('canyon-door'));
  h.check('ground pound on the plate opens the canyon door', door);
  await h.wait(1500);
  await settle();
  await walkTo(0, 245, 1.0, 8);
  s = await st();
  h.check('walked through the cleft into the canyon', s.z > 235 && s.y < 3, JSON.stringify(s));
  await h.wait(1500);
  const boss = await h.eval(() => { const b = window.wyrm.boss; return b ? { name: b.displayName, mode: b.mode } : null; });
  h.check('graveljaw appears', !!boss, JSON.stringify(boss));
}
