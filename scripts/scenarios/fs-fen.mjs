/**
 * Marshlight Fen additions: counts, and every new egg, letter and chest reached
 * by its intended route (teleport close, then do the last bit for real).
 *   node scripts/play.mjs fs-fen            (everything)
 *   node scripts/play.mjs fs-fen:lamp       (one part: counts, lamp, perch, mill, nest)
 */

function helpers(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 600; i++) {
      await h.wait(50);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  const place = (x, z, yaw, y) => h.eval(({ x, z, yaw, y }) => {
    const g = window.wyrm;
    const gy = y ?? g.col.groundAt(x, z, 1e4, 0.1).y;
    // A ledge hang or climb from the last step would carry over otherwise.
    if (g.player.state !== 'move') g.player.setState('move');
    g.player.place(x, gy + 0.05, z, yaw);
    g.cam.snapBehind(yaw);
    g.player.hp = g.player.maxHp;
  }, { x, z, yaw, y });
  const found = (key) => h.eval((key) => !!window.wyrm.save.found[key], key);
  const press = async (action, hold = 0.1) => {
    await h.eval((a) => window.wyrm.input.simulate(a, true), action);
    await waitGame(hold);
    await h.eval((a) => window.wyrm.input.simulate(a, false), action);
  };
  const pos = () => h.eval(() => { const p = window.wyrm.player; return { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), st: p.state }; });
  /** Walks toward (x, z) with W held (camera snapped behind), until close or out of time. */
  const walkTo = async (x, z, sec = 3, near = 0.5) => {
    await h.eval(({ x, z }) => {
      const g = window.wyrm;
      const yaw = Math.atan2(x - g.player.x, z - g.player.z);
      g.player.yaw = yaw;
      g.cam.snapBehind(yaw);
    }, { x, z });
    await h.page.keyboard.down('KeyW');
    const t0 = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 400; i++) {
      await h.wait(50);
      const s = await h.eval(({ x, z }) => {
        const g = window.wyrm;
        const yaw = Math.atan2(x - g.player.x, z - g.player.z);
        g.cam.snapBehind(yaw);
        return { d: Math.hypot(x - g.player.x, z - g.player.z), t: g.time };
      }, { x, z });
      if (s.d < near || s.t - t0 > sec) break;
    }
    await h.page.keyboard.up('KeyW');
  };
  const start = async () => {
    await h.go('?level=fen&seed=3&quality=low&maxdt=0.1', 2500);
    await h.skipDialogue(6000);
    await h.wait(400);
    // A stray Esc from skipping the intro can land just after it closes and pause the game.
    await h.eval(() => { if (window.wyrm.state === 'pause') window.wyrm.resume(); });
    await h.eval(() => {
      const g = window.wyrm;
      for (const a of g.level.arenas) a.state = 'cleared';
      g.save.found['story:fen:gloomFirst'] = true;
    });
  };
  const calm = () => h.eval(() => { for (const e of window.wyrm.enemies) { e.alive = false; e.state = 'dead'; e.deadT = 0.1; } });
  return { waitGame, place, found, press, pos, walkTo, start, calm };
}

export async function counts(h) {
  const { start } = helpers(h);
  await start();
  const c = await h.eval(() => {
    const g = window.wyrm;
    const bs = g.level.hittables.filter((x) => x.constructor.name === 'Breakable');
    const sec = {};
    for (const s of g.level.secrets) sec[s.kind] = (sec[s.kind] ?? 0) + 1;
    // Breakables standing well above the terrain: fine on a dock, a floor or a stack, suspicious anywhere else.
    const high = bs.filter((b) => b.y - g.col.terrainAt(b.x, b.z) > 0.35).map((b) => `${b.kind}@${b.x.toFixed(1)},${b.z.toFixed(1)}+${(b.y - g.col.terrainAt(b.x, b.z)).toFixed(1)}`);
    const kinds = {};
    for (const b of bs) kinds[b.kind] = (kinds[b.kind] ?? 0) + 1;
    return { n: bs.length, kinds, sec, chests: g.level.props.filter((p) => p.constructor.name === 'Chest').length, high, enemies: g.enemies.filter((e) => e.alive).length };
  });
  console.log(JSON.stringify(c));
  h.check('40 to 80 breakables', c.n >= 40 && c.n <= 80, `${c.n}`);
  h.check('no new urns (content.mjs smashes every urn)', c.kinds.urn === 4, JSON.stringify(c.kinds));
  h.check('five eggs plus the thief egg, four letters', c.sec.egg === 6 && c.sec.letter === 4, JSON.stringify(c.sec));
  h.check('three chests', c.chests === 3, `${c.chests}`);
  // Ground where the new areas expect it.
  const g = await h.eval(() => {
    const g = window.wyrm;
    const at = (x, z, from = 1e4) => +g.col.groundAt(x, z, from, 0.1).y.toFixed(2);
    return {
      bridge1: at(-19.5, 6.3), hummock: at(-27.5, 8.1), bridge2: at(-34.8, 9.8), lampIsland: at(-47, 11), dock: at(-61, 12.2),
      perch: at(-18.5, 104), millBridge: at(18, 112.5), millYard: at(28, 104), millFloor: at(37.5, 101, 3), loft: at(38.8, 101.5, 5.5), millRoof: at(36.6, 101.8), millDock: at(29.8, 90.5),
      nestHop: at(27.5, 182.5), nest: at(33.5, 186), jetty: at(8, 57.5), raft: at(40.2, 139.8),
    };
  });
  console.log('ground', JSON.stringify(g));
  const ok = g.bridge1 > 0.3 && g.hummock > 0.2 && g.bridge2 > 0.3 && g.lampIsland > 1 && g.dock > 0.4 && g.perch > 7 && g.millBridge > 0.8 && g.millYard > 1
    && g.millFloor > 1.3 && g.millFloor < 1.6 && g.loft > 4.3 && g.loft < 4.6 && g.millRoof > 7.5 && g.millDock > 0.8 && g.nestHop > 1 && g.nest > 1 && g.jetty > 0.7 && g.raft > 0.2;
  h.check('ground where the new areas expect it', ok, JSON.stringify(g));
}

export async function lamp(h) {
  const { waitGame, place, found, press, pos, walkTo, start } = helpers(h);
  await start();
  // Walk the boardwalk from the Hollow onto the second hummock.
  await place(-14.5, 5.2, -Math.PI / 2 - 0.2);
  await walkTo(-28.5, 8.6, 4);
  let p = await pos();
  h.check('the boardwalk carries Aster to the hummocks', p.x < -26 && p.y > 0.4, JSON.stringify(p));
  await walkTo(-39, 10.8, 4);
  p = await pos();
  h.check('the second bridge reaches the lamphouse island', p.x < -37.5 && p.y > 0.8, JSON.stringify(p));
  await h.shot('fs-fen-lamp-arrive');
  // The letter on Wick's table.
  await place(-38.6, 6.6, -Math.PI / 2);
  await walkTo(-41.2, 6.6, 2, 0.3);
  await walkTo(-42.4, 7.4, 2, 0.3);
  h.check('Old Wick\'s log is on his table', await found('letter:fen:lamplighter') || await found('fen:letter-lamplighter'), JSON.stringify(await pos()));
  await h.skipDialogue();
  await h.eval(() => { document.querySelector('.relic-card')?.remove(); });
  // Climb the tower's vines to the egg.
  await place(-47.6, 16.5, -Math.PI / 2);
  await h.page.keyboard.down('KeyW');
  let climbed = false;
  for (let i = 0; i < 60; i++) {
    await waitGame(0.3);
    p = await pos();
    if (p.y > 9.2 && p.st !== 'climb') { climbed = true; break; }
  }
  await h.page.keyboard.up('KeyW');
  h.check('the lamp tower\'s vines climb to the top', climbed, JSON.stringify(p));
  await walkTo(-50.9, 15.7, 2, 0.3);
  await waitGame(0.3);
  h.check('the egg on the lamp tower', await found('fen:egg-lamp'), JSON.stringify(await pos()));
  await h.shot('fs-fen-lamp-top');
  // The powder keg by the oil shed burns the vines away.
  await place(-48.9, 4.5, -Math.PI / 2);
  await waitGame(0.3);
  await press('horn');
  await waitGame(1.2);
  const gate = await h.eval(() => {
    const g = window.wyrm;
    const gt = g.level.hittables.find((x) => x.constructor.name === 'Gate' && Math.hypot(x.x + 51.6, x.z - 6.4) < 0.5);
    const kegs = g.level.hittables.filter((x) => x.constructor.name === 'Breakable' && x.kind === 'keg' && Math.hypot(x.x + 50.3, x.z - 4.5) < 0.5).map((k) => k.alive);
    return { gate: gt ? gt.alive : 'missing', kegs };
  });
  h.check('smashing the powder keg burns the vines off the shed', gate.gate === false, JSON.stringify(gate));
  await h.shot('fs-fen-shed-open');
  await place(-51.0, 6.4, -Math.PI / 2);
  await walkTo(-52.4, 6.4, 1.5, 0.3);
  await press('horn');
  await waitGame(1);
  h.check('the lamphouse chest opens', await found('fen:chest:lamphouse'), JSON.stringify(await pos()));
}

export async function perch(h) {
  const { waitGame, place, found, pos, start } = helpers(h);
  await start();
  // From the glide ledge: jump, flap, hold to glide west to the heron's rock.
  // Start clear of the ledge's corner pillar (at -3.4, 95.5).
  const yaw = Math.atan2(-18.5 - -2.5, 104 - 93);
  let got = false;
  for (let attempt = 0; attempt < 2 && !got; attempt++) {
    await place(-2.5, 93, yaw, 8);
    await waitGame(0.3);
    await h.page.keyboard.down('KeyW');
    await waitGame(0.15);
    await h.page.keyboard.down('Space');
    await waitGame(0.3);
    await h.page.keyboard.up('Space');
    await waitGame(0.05);
    await h.page.keyboard.down('Space');
    // Let go over the rock (a player would), and drop onto it.
    for (let i = 0; i < 80; i++) {
      await waitGame(0.05);
      await h.eval((yaw) => window.wyrm.cam.snapBehind(yaw), yaw);
      const p = await pos();
      if (Math.hypot(p.x + 18.5, p.z - 104) < 1.6 || p.y < 6 || (await found('fen:egg-heron'))) break;
    }
    await h.page.keyboard.up('Space');
    await h.page.keyboard.up('KeyW');
    await waitGame(1.0);
    got = await found('fen:egg-heron');
    console.log('glide attempt', attempt, JSON.stringify(await pos()), got, await h.eval(() => `${window.wyrm.state} t=${window.wyrm.time.toFixed(1)}`));
  }
  h.check('a jump, flap and glide from the ledge reaches the heron\'s egg', got, JSON.stringify(await pos()));
  await h.shot('fs-fen-perch');
  // From the ruin island's shore a jump and flap cannot reach it.
  await place(-12, 110.5, Math.atan2(-6.5, -6.5));
  await waitGame(0.3);
  await h.eval(() => { window.__top = -99; });
  await h.page.keyboard.down('KeyW');
  await h.page.keyboard.down('Space');
  await waitGame(0.3);
  await h.page.keyboard.up('Space');
  await waitGame(0.06);
  await h.page.keyboard.down('Space');
  for (let i = 0; i < 20; i++) {
    await waitGame(0.1);
    await h.eval(() => { window.__top = Math.max(window.__top, window.wyrm.player.y); });
  }
  await h.page.keyboard.up('Space');
  await h.page.keyboard.up('KeyW');
  const top = await h.eval(() => window.__top);
  h.check('the perch is out of reach from the ruin shore', top < 7.0, `peak ${top.toFixed(2)}`);
}

export async function mill(h) {
  const { waitGame, place, found, press, pos, walkTo, start, calm } = helpers(h);
  await start();
  // Over the bridge from the ruins.
  await place(12.5, 115.5, Math.atan2(10, -5.3));
  await walkTo(24.5, 109.2, 4);
  let p = await pos();
  h.check('the mill bridge reaches the island', p.x > 22.5 && p.y > 1, JSON.stringify(p));
  const foes = await h.eval(() => window.wyrm.enemies.filter((e) => e.alive && Math.hypot(e.x - 27, e.z - 102) < 14).map((e) => e.def.id));
  h.check("looters camp in the mill yard (a sapper among them)", foes.length === 3 && foes.includes("sapper"), JSON.stringify(foes));
  await h.shot('fs-fen-mill-yard');
  await calm();
  // The miller's notice inside.
  await place(31.6, 101.8, Math.PI / 2);
  await walkTo(37.4, 101.6, 3, 0.3);
  h.check('the miller\'s notice is on the mill floor', await found('fen:letter-miller'), JSON.stringify(await pos()));
  await h.eval(() => { document.querySelector('.relic-card')?.remove(); });
  // Up the crate steps to the loft: floor, one crate, two crates, loft.
  const steps = await h.eval(() => window.wyrm.level.hittables.filter((b) => b.constructor.name === 'Breakable' && b.kind === 'crate' && Math.abs(b.z - 103.7) < 0.1 && b.x > 34 && b.x < 36).map((b) => [b.x, b.y + b.height]));
  console.log('steps', JSON.stringify(steps));
  const hopUp = async (x, z, yaw, y) => {
    await place(x, z, yaw, y);
    await waitGame(0.2);
    await h.page.keyboard.down('KeyW');
    await press('jump', 0.3);
    await waitGame(0.5);
    await h.page.keyboard.up('KeyW');
    await waitGame(0.2);
    return pos();
  };
  // From the floor, keep jumping east up the crates until Aster stands in the loft.
  const trail = [await hopUp(33.6, 103.7, Math.PI / 2, 1.45)];
  for (let i = 0; i < 3 && trail[trail.length - 1].y < 4.3; i++) {
    const q = trail[trail.length - 1];
    trail.push(await hopUp(q.x, q.z, Math.PI / 2, q.y - 0.05));
  }
  h.check('the crate steps climb to the mill loft', trail[trail.length - 1].y > 4.3, JSON.stringify(trail));
  // Break the sacks in the way and take the egg.
  await place(38.0, 101.2, Math.PI * 0.85, 4.45);
  await waitGame(0.2);
  await press('horn');
  await waitGame(0.6);
  await walkTo(39.3, 99.7, 2, 0.2);
  await waitGame(0.3);
  h.check('the egg in the mill loft', await found('fen:egg-mill'), JSON.stringify(await pos()));
  await h.shot('fs-fen-mill-loft');
  // The strongbox at the end of the dock.
  await place(29.8, 92.5, Math.PI);
  await walkTo(29.8, 90.6, 2, 0.3);
  await press('horn');
  await waitGame(1);
  h.check('the mill chest opens', await found('fen:chest:mill'), JSON.stringify(await pos()));
  await h.shot('fs-fen-mill-dock');
}

export async function nest(h) {
  const { waitGame, place, found, press, pos, walkTo, start, calm } = helpers(h);
  await start();
  await calm();
  // The sergeant's orders on the war table.
  await place(10.2, 178.4, Math.PI / 2);
  await walkTo(11.3, 178.4, 1.5, 0.3);
  h.check('the sergeant\'s orders are on the war table', await found('fen:letter-orders'), JSON.stringify(await pos()));
  await h.eval(() => { document.querySelector('.relic-card')?.remove(); });
  // Two hops from the camp's east shore.
  const hop = async (fromX, fromZ, toX, toZ) => {
    const yaw = Math.atan2(toX - fromX, toZ - fromZ);
    await place(fromX, fromZ, yaw);
    await waitGame(0.2);
    await h.page.keyboard.down('KeyW');
    // Run up until Aster is moving (slow headless frames make fixed waits unreliable).
    for (let i = 0; i < 12; i++) {
      await waitGame(0.05);
      const q = await pos();
      if (Math.hypot(q.x - fromX, q.z - fromZ) > 1.0) break;
    }
    await h.page.keyboard.down('Space');
    await waitGame(0.3);
    await h.page.keyboard.up('Space');
    // Let go of W over the target, as a player would on a small rock.
    for (let i = 0; i < 40; i++) {
      const q = await h.eval(({ toX, toZ }) => {
        const p = window.wyrm.player;
        return { d: Math.hypot(toX - p.x, toZ - p.z), gr: p.body.grounded, vy: p.body.vy };
      }, { toX, toZ });
      if (q.d < 0.8 || (q.gr && q.vy <= 0 && i > 3)) break;
      await waitGame(0.04);
    }
    await h.page.keyboard.up('KeyW');
    await waitGame(0.6);
    return pos();
  };
  const onHummock = (p) => Math.hypot(p.x - 27.5, p.z - 182.5) < 2.2 && p.y > 1;
  const onNest = (p) => p.x > 31.5 && p.y > 1;
  let p = await hop(21.2, 180.2, 27.5, 182.5);
  if (!onHummock(p)) p = await hop(21.2, 180.2, 27.5, 182.5);
  h.check('a running jump from the camp lands on the hummock', onHummock(p), JSON.stringify(p));
  p = await hop(26.6, 182.1, 33.5, 185.6);
  if (!onNest(p)) p = await hop(26.6, 182.1, 33.5, 185.6);
  h.check('a second jump lands on the nest rock', onNest(p), JSON.stringify(p));
  const guards = await h.eval(() => window.wyrm.enemies.filter((e) => e.alive && Math.hypot(e.x - 35.2, e.z - 187.2) < 6).map((e) => e.def.id));
  h.check('the nest is guarded', guards.length === 2, JSON.stringify(guards));
  await h.shot('fs-fen-nest');
  await calm();
  // Break into the ring of cocoons.
  await place(33.0, 186.4, Math.atan2(2.2, 0.8));
  for (let i = 0; i < 3; i++) {
    await waitGame(0.2);
    await press('horn');
    await waitGame(0.5);
  }
  await walkTo(35.2, 187.2, 2, 0.2);
  await waitGame(0.4);
  h.check('the egg in the Gloom nest', await found('fen:egg-nest'), JSON.stringify(await pos()));
}

export default async function (h) {
  for (const part of [counts, lamp, perch, mill, nest]) await part(h);
}
