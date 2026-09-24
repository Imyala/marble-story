// Eclipse Keep critical path: real-input jumps and glides, every seal of the
// great door, the three locked arenas and the secrets. PART=a,b,... runs a subset.
import { place, where, run, tap, down, up } from './keeplib.mjs';

const parts = (process.env.PART ?? 'jumps,court,arenas,stair').split(',');

async function killArena(h, id) {
  // Waits for each wave to appear, then defeats it.
  for (let w = 0; w < 12; w++) {
    await h.wait(1500);
    const st = await h.eval((id) => {
      const g = window.wyrm;
      const a = g.level.arenas.find((a) => a.id === id);
      const alive = g.enemies.filter((e) => e.alive && Math.hypot(e.x - a.x, e.z - a.z) < a.r + 1);
      const names = alive.map((e) => `${e.def.id}:${e.state}`);
      for (const e of alive) if (e.state !== 'spawn') e.die(null);
      return { state: a.state, names };
    }, id);
    console.log(`  arena ${id}:`, JSON.stringify(st));
    if (st.state === 'cleared') return true;
  }
  return h.eval((id) => window.wyrm.level.arenas.find((a) => a.id === id).state === 'cleared', id);
}

export default async function (h) {
  await h.go('?level=keep&seed=1&quality=low&maxdt=0.25', 3000);
  await h.skipDialogue();
  await h.eval(() => {
    const g = window.wyrm;
    for (const e of ['fire', 'lightning', 'ice', 'earth']) if (!g.save.elements.includes(e)) g.learnElement(e);
    // Roaming enemies stay out of the way unless a test wants them.
    for (const e of g.enemies) if (!e.isBoss) { e.aggro = false; e.def = { ...e.def, aggroRange: 0 }; }
  });
  const fired = () => h.eval(() => [...window.wyrm.level.fired]);
  const face = (x, z) => h.eval(([x, z]) => { const g = window.wyrm; g.player.yaw = Math.atan2(x - g.player.x, z - g.player.z); g.cam.snapBehind(g.player.yaw, 0.3); }, [x, z]);
  const breathe = (secs) => run(h, [{ keys: down('KeyK') }, { after: secs, keys: up('KeyK') }, { after: 0.2 }]);
  const element = (n) => run(h, [{ keys: tap(`Digit${n}`) }, { after: 0.1 }]);

  if (parts.includes('jumps')) {
    // The broken bridge: run, jump, flap.
    await place(h, 0, -11, Math.PI);
    let r = await run(h, [
      { keys: down('KeyW') },
      { when: 'p.z < -16.8', keys: tap('Space') },
      { after: 0.3, keys: tap('Space') },
      { after: 0.4, when: 'p.body.grounded || p.y < 1', keys: up('KeyW') },
      { after: 0.5 },
    ]);
    let p = await where(h);
    h.check('bridge gap: jump + flap lands on the far side', p.z < -24.2 && p.y > 4.6 && p.grounded && p.hp >= 100, JSON.stringify(p) + r.log.join(' | '));
    // A plain jump falls short (the gap needs the flap).
    await place(h, 0, -11, Math.PI);
    r = await run(h, [
      { keys: down('KeyW') },
      { when: 'p.z < -16.8', keys: tap('Space') },
      { after: 0.3, when: 'p.body.grounded || p.y < 1', keys: up('KeyW') },
      { after: 0.3 },
    ]);
    p = await where(h);
    h.check('bridge gap: a plain jump does not make it', p.y < 3 || p.z > -24, JSON.stringify(p));
    await h.wait(2500);
    // Moonfall nest: glide down from the landing and drop onto the islet.
    await place(h, -5, 6.5, Math.atan2(-10, 10.5));
    r = await run(h, [
      { keys: down('KeyW') },
      { when: 'Math.hypot(p.x, p.z - 3) > 8.6', keys: tap('Space') },
      { after: 0.3, keys: down('Space') },
      { when: 'Math.hypot(p.x + 15, p.z - 17) < 2.8', keys: [...up('Space'), ...up('KeyW')] },
      { after: 0.2, when: 'p.body.grounded || p.y < -5' },
      { after: 0.4 },
    ]);
    p = await where(h);
    const relic1 = await h.eval(() => !!window.wyrm.save.found['keep:relic1']);
    h.check('nest islet reached by gliding (relic keep1)', relic1 && p.y < 0 && p.y > -3 && p.grounded, JSON.stringify(p) + r.log.join(' | '));
    await h.skipDialogue(800);
    // And back up on the updraft.
    await place(h, -15 - 1.4 * 0.73, 17 + 1.4 * 0.68, Math.atan2(15, -14));
    r = await run(h, [
      { keys: tap('Space') },
      { after: 0.3, keys: down('Space') },
      { after: 0.3, keys: down('KeyW') },
      { after: 0.5, when: '(window.__maxY = Math.max(window.__maxY ?? -99, p.y)) && Math.hypot(p.x, p.z - 3) < 6', keys: [...up('Space'), ...up('KeyW')] },
      { after: 0.2, when: 'p.body.grounded || p.y < -8' },
      { after: 0.3 },
    ], 14);
    console.log('  updraft peak y', await h.eval(() => window.__maxY));
    p = await where(h);
    h.check('updraft carries the dragon back to the landing', Math.hypot(p.x, p.z - 3) < 10.5 && p.y > 3.5 && p.grounded, JSON.stringify(p) + r.log.join(' | '));
    await h.shot('kp-updraft');
  }

  if (parts.includes('court')) {
    // The court's defenders are dealt with first (auto-aim prefers enemies).
    await h.eval(() => { for (const e of window.wyrm.enemies) if (e.alive && e.z < -86 && e.z > -130) e.die(null); });
    // Storm Seal: Arc Breath at the crystal from the court floor.
    await place(h, -10, -106, -Math.PI / 2);
    await element(2);
    await run(h, [{ keys: down('KeyK') }, { after: 0.8 }]);
    await h.shot('kp-storm');
    await run(h, [{ after: 0.4, keys: up('KeyK') }, { after: 0.2 }]);
    let f = await fired();
    h.check('storm seal: lightning breath wakes the crystal', f.includes('seal-storm'), JSON.stringify(f));
    // Flame Seal: four timed braziers.
    await element(1);
    const torches = [[9, -97, 0], [17, -102, 1.8], [17.5, -114, 1.8], [8, -112, 0]];
    const t0 = await h.eval(() => window.wyrm.realTime);
    for (const [tx, tz, th] of torches) {
      const d = th > 0 ? 3.6 : 3;
      await place(h, tx - d, tz, Math.PI / 2);
      await face(tx, tz);
      await breathe(0.7);
      console.log('  torches lit:', JSON.stringify(await h.eval(() => window.wyrm.level.props.filter((p) => p.constructor.name === 'Torch').map((t) => t.lit))));
    }
    const t1 = await h.eval(() => window.wyrm.realTime);
    f = await fired();
    h.check('flame seal: all four braziers lit in time', f.includes('seal-flame'), `${(t1 - t0).toFixed(1)}s sim ` + JSON.stringify(f));
    await h.shot('kp-flame');
    // Stone Seal: Boulders crack the wall of the frost room.
    await place(h, 9, -110.5, Math.PI);
    await element(4);
    for (let i = 0; i < 3; i++) {
      f = await fired();
      if (f.includes('broken:seal-stone')) break;
      await h.eval(() => { window.wyrm.player.mana = 100; });
      await run(h, [{ keys: tap('KeyU') }, { after: 1.6 }]);
    }
    f = await fired();
    h.check('stone seal: Boulder breaks the cracked wall', f.includes('broken:seal-stone'), JSON.stringify(f));
    // Frost Seal: freeze the geyser, climb it, ground-pound the plate.
    await place(h, 9, -118.2, Math.PI);
    await element(3);
    await breathe(0.8);
    const frozen = await h.eval(() => window.wyrm.level.props.find((p) => p.constructor.name === 'Geyser')?.frozen);
    h.check('frost seal: ice freezes the geyser', frozen === true, String(frozen));
    await h.shot('kp-frozen');
    await place(h, 9, -119.3, Math.PI);
    let r = await run(h, [
      { keys: [...down('KeyW'), ...down('Space')] },
      { after: 0.28, keys: up('Space') },
      { after: 0.02, keys: tap('Space') },
      { after: 0.1, when: 'Math.hypot(p.x - 9, p.z + 121.5) < 0.6', keys: up('KeyW') },
      { when: 'p.body.grounded' },
      { after: 0.3, keys: down('Space') },
      { after: 0.25, keys: [...up('Space'), ...tap('KeyE')] },
      { after: 0.8 },
    ]);
    let p = await where(h);
    f = await fired();
    h.check('frost seal: ground pound on the frozen geyser presses the plate', f.includes('seal-frost'), JSON.stringify(p) + r.log.join(' | '));
    await h.wait(1200);
    await h.skipDialogue(3000);
    // The shelf above: mana shard, from the pillar top.
    await h.eval(() => { const gz = window.wyrm.level.props.find((p) => p.constructor.name === 'Geyser'); if (!gz.frozen) gz.takeHit({ type: 'ice', buildup: 100, damage: 10 }); });
    await place(h, 10, -122.1, Math.atan2(12.8 - 10, -124.2 + 122.1));
    r = await run(h, [
      { keys: [...down('KeyW'), ...down('Space')] },
      { after: 0.28, keys: up('Space') },
      { after: 0.02, keys: tap('Space') },
      { after: 0.2, when: 'p.body.grounded', keys: up('KeyW') },
      { after: 0.3 },
    ]);
    const mana1 = await h.eval(() => !!window.wyrm.save.found['keep:mana1']);
    p = await where(h);
    h.check('mana1 reached from the frozen geyser', mana1, JSON.stringify(p) + r.log.join(' | '));
    await h.wait(1500);
    const door = await h.eval(() => {
      const g = window.wyrm;
      const d = g.level.props.find((p) => p.constructor.name === 'Gate' && p.signal === 'keep-door');
      return { fired: g.level.fired.has('keep-door'), alive: d.alive, found: !!g.save.found['story:keep:door'] };
    });
    h.check('great door opens after all four seals', door.fired && !door.alive && door.found, JSON.stringify(door));
    await place(h, 0, -116, Math.PI);
    await h.shot('kp-door-open');
    await run(h, [{ keys: down('KeyW') }, { after: 2.2, keys: up('KeyW') }]);
    p = await where(h);
    h.check('walked through the great door', p.z < -131 && p.grounded, JSON.stringify(p));
    // keep2: melt the ice shrine with fire.
    await place(h, -5.5, -99.25, -Math.PI / 2);
    await element(1);
    for (let i = 0; i < 3; i++) {
      const alive = await h.eval(() => window.wyrm.level.props.find((p) => p.constructor.name === 'Gate' && p.kind === 'ice').alive);
      if (!alive) break;
      await h.eval(() => { window.wyrm.player.mana = 100; });
      await run(h, [{ keys: tap('KeyU') }, { after: 0.9 }]);
    }
    const ice = await h.eval(() => window.wyrm.level.props.find((p) => p.constructor.name === 'Gate' && p.kind === 'ice').alive);
    await run(h, [{ keys: down('KeyW') }, { after: 0.9, keys: up('KeyW') }, { after: 0.3 }]);
    const relic2 = await h.eval(() => !!window.wyrm.save.found['keep:relic2']);
    h.check('ice shrine melts (Fire) and holds relic keep2', !ice && relic2, `ice alive=${ice}`);
    await h.skipDialogue(1000);
  }

  if (parts.includes('arenas')) {
    await h.eval(() => { window.wyrm.player.invuln = true; });
    // Gatehouse.
    await place(h, 0, -50, Math.PI);
    await run(h, [{ keys: down('KeyW') }, { after: 0.5, keys: up('KeyW') }]);
    let ok = await killArena(h, 'gatehouse');
    let f = await fired();
    h.check('gatehouse arena clears and unseals the north gate', ok && f.includes('bastion-open'), JSON.stringify(f));
    // Hall of Umbra.
    await place(h, 0, -140, Math.PI);
    await run(h, [{ keys: down('KeyW') }, { after: 0.5, keys: up('KeyW') }]);
    await h.wait(900);
    await h.shot('kp-hall-fight');
    ok = await killArena(h, 'hall');
    f = await fired();
    h.check('hall arena clears and opens the back gate', ok && f.includes('hall-open'), JSON.stringify(f));
    // Terrace.
    await place(h, 0, -219.5, Math.PI);
    await run(h, [{ keys: down('KeyW') }, { after: 0.5, keys: up('KeyW') }]);
    await h.wait(900);
    await h.shot('kp-terrace-fight');
    ok = await killArena(h, 'terrace');
    h.check('terrace arena clears', ok);
    await h.eval(() => { window.wyrm.player.invuln = false; });
  }

  if (parts.includes('stair')) {
    const hop = (flap, stopWhen) => run(h, [
      { keys: [...down('KeyW'), ...down('Space')] },
      { after: 0.28, keys: up('Space') },
      ...(flap ? [{ after: 0.02, keys: tap('Space') }] : []),
      { after: 0.1, when: stopWhen, keys: up('KeyW') },
      { when: 'p.body.grounded || p.y < 0' },
      { after: 0.3 },
    ]);
    // Hall back door to the stair islet.
    await h.eval(() => window.wyrm.level.emit('hall-open'));
    await h.wait(1500);
    await place(h, 0, -163, Math.PI);
    await run(h, [{ keys: down('KeyW') }, { when: 'p.z < -179', keys: up('KeyW') }, { after: 0.3 }], 6);
    let p = await where(h);
    h.check('causeway from the hall to the stair islet', p.z < -176 && p.y > 8.5 && p.grounded, JSON.stringify(p));
    // A -> C1.
    await place(h, 2.6, -184.5, Math.PI);
    await face(3.5, -190);
    await hop(false, 'Math.hypot(p.x - 3.5, p.z + 190) < 0.7');
    p = await where(h);
    h.check('jump to the first floating stone', Math.hypot(p.x - 3.5, p.z + 190) < 1.6 && p.y > 10.3 && p.grounded, JSON.stringify(p));
    // C1 -> the moving slab once it is near.
    await h.eval(() => new Promise((res) => {
      const m = window.wyrm.level.props.find((q) => q.constructor.name === 'MovingPlatform');
      const t = setInterval(() => { if (m.solid.x > 0.8) { clearInterval(t); res(); } }, 40);
    }));
    await face(1.5, -195.5);
    await hop(true, 'Math.abs(p.z + 195.5) < 0.6');
    p = await where(h);
    h.check('jump + flap onto the moving slab', p.y > 11.8 && Math.abs(p.z + 195.5) < 1.6 && p.grounded, JSON.stringify(p));
    await face(2.5, -201);
    await hop(true, 'Math.hypot(p.x - 2.5, p.z + 201) < 0.7');
    p = await where(h);
    h.check('jump to the third stone', p.y > 13 && Math.hypot(p.x - 2.5, p.z + 201) < 1.6 && p.grounded, JSON.stringify(p));
    await face(0, -207);
    await hop(true, 'p.z < -206');
    p = await where(h);
    h.check('jump to the upper islet', p.y > 13.8 && p.z < -204.5 && p.grounded, JSON.stringify(p));
    // Updraft to the terrace.
    await place(h, -3, -210.4, Math.PI);
    let r = await run(h, [
      { keys: tap('Space') },
      { after: 0.3, keys: down('Space') },
      { after: 0.3, keys: down('KeyW') },
      { after: 0.5, when: '(window.__maxY2 = Math.max(window.__maxY2 ?? -99, p.y)) && p.z < -221', keys: [...up('Space'), ...up('KeyW')] },
      { when: 'p.body.grounded || p.y < 0' },
      { after: 0.3 },
    ], 14);
    p = await where(h);
    console.log('  updraft peak y', await h.eval(() => window.__maxY2));
    await h.shot('kp-terrace-glide');
    h.check('updraft glide reaches the Eclipse Terrace', p.y > 19.5 && p.z < -217 && p.grounded, JSON.stringify(p) + r.log.join(' | '));
    // Lightning lift to the Warden's desk (after dealing with the islet's slinger).
    await h.eval(() => { for (const e of window.wyrm.enemies) if (e.alive && e.z < -204 && e.z > -215) e.die(null); });
    await place(h, -1, -211.2, Math.PI / 2);
    await element(2);
    await breathe(0.8);
    const lift = await h.eval(() => window.wyrm.level.fired.has('keep-lift'));
    h.check('lightning switch starts the lift', lift);
    await h.eval(() => new Promise((res) => {
      const q = window.wyrm.level.props.filter((q) => q.constructor.name === 'MovingPlatform')[1];
      const t = setInterval(() => { if (Math.hypot(q.solid.x - 4.8, q.solid.z + 207.8) < 0.25) { clearInterval(t); res(); } }, 30);
    }));
    await place(h, 4.8, -207.8, 0.8, 14.0);
    r = await run(h, [{ when: 'Math.hypot(p.x - 14.2, p.z + 199.6) < 0.5' }, { after: 0.2 }], 12);
    p = await where(h);
    console.log('  rode lift to', JSON.stringify(p));
    await face(17, -197.8);
    await run(h, [{ keys: down('KeyW') }, { when: 'Math.hypot(p.x - 17, p.z + 197.8) < 1.2', keys: up('KeyW') }, { after: 0.4 }], 4);
    const relic3 = await h.eval(() => !!window.wyrm.save.found['keep:relic3']);
    p = await where(h);
    h.check('lift carries the dragon to relic keep3', relic3, JSON.stringify(p));
    await h.skipDialogue(1000);
    // Bastion west: Boulder the cracked wall for the heart shard.
    await place(h, -7, -58, -Math.PI / 2);
    await element(4);
    for (let i = 0; i < 3; i++) {
      const alive = await h.eval(() => window.wyrm.level.props.find((p) => p.constructor.name === 'Gate' && p.kind === 'rock' && !p.signal).alive);
      if (!alive) break;
      await h.eval(() => { window.wyrm.player.mana = 100; });
      await run(h, [{ keys: tap('KeyU') }, { after: 1.6 }]);
    }
    const rock = await h.eval(() => window.wyrm.level.props.find((p) => p.constructor.name === 'Gate' && p.kind === 'rock' && !p.signal).alive);
    await run(h, [{ keys: down('KeyW') }, { when: 'p.x < -24', keys: up('KeyW') }, { after: 0.4 }], 5);
    const heart = await h.eval(() => !!window.wyrm.save.found['keep:heart1']);
    p = await where(h);
    h.check('boulder opens the bastion wall; heart1 on the balcony', !rock && heart, JSON.stringify(p) + ` rock=${rock}`);
    const found = await h.eval(() => Object.keys(window.wyrm.save.found).filter((k) => k.startsWith('keep:')));
    console.log('  collectibles found:', JSON.stringify(found));
  }
}
