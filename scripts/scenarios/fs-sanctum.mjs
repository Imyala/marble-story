/**
 * Warden Sanctum additions: counts, and every new egg, letter and chest reached
 * by its intended route (teleport close, then do the last bit for real).
 *   node scripts/play.mjs fs-sanctum            (everything)
 *   node scripts/play.mjs fs-sanctum:library    (one part: counts, library, stargazers, hatchery)
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
  const walkTo = async (x, z, sec = 3, near = 0.5) => {
    await h.page.keyboard.down('KeyW');
    const t0 = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 400; i++) {
      const s = await h.eval(({ x, z }) => {
        const g = window.wyrm;
        const yaw = Math.atan2(x - g.player.x, z - g.player.z);
        g.cam.snapBehind(yaw);
        return { d: Math.hypot(x - g.player.x, z - g.player.z), t: g.time };
      }, { x, z });
      if (s.d < near || s.t - t0 > sec) break;
      await h.wait(50);
    }
    await h.page.keyboard.up('KeyW');
  };
  /** Run toward (toX, toZ) and jump once Aster is moving. */
  const hop = async (fromX, fromZ, toX, toZ, fromY, flap = false) => {
    const yaw = Math.atan2(toX - fromX, toZ - fromZ);
    await place(fromX, fromZ, yaw, fromY);
    await waitGame(0.2);
    await h.page.keyboard.down('KeyW');
    for (let i = 0; i < 12; i++) {
      await waitGame(0.05);
      const q = await pos();
      if (Math.hypot(q.x - fromX, q.z - fromZ) > 0.9) break;
    }
    await h.page.keyboard.down('Space');
    await waitGame(0.3);
    await h.page.keyboard.up('Space');
    if (flap) {
      await waitGame(0.05);
      await press('jump', 0.15);
    }
    // Steer for the target and let go of W over it, as a player would on a small stone.
    for (let i = 0; i < 40; i++) {
      const q = await h.eval(({ toX, toZ }) => {
        const g = window.wyrm;
        const p = g.player;
        g.cam.snapBehind(Math.atan2(toX - p.x, toZ - p.z));
        return { d: Math.hypot(toX - p.x, toZ - p.z), gr: p.body.grounded, vy: p.body.vy };
      }, { toX, toZ });
      if (q.d < 0.6) break;
      if (q.gr && q.vy <= 0 && i > 3) break;
      await waitGame(0.04);
    }
    await h.page.keyboard.up('KeyW');
    await waitGame(0.6);
    return pos();
  };
  const start = async () => {
    await h.go('?level=sanctum&seed=3&quality=low&maxdt=0.1', 2500);
    await h.skipDialogue(8000);
    await h.eval(() => {
      const g = window.wyrm;
      g.save.found['story:sanctum:lesson-done'] = true;
    });
    await h.skipDialogue(3000);
    await h.wait(400);
    // A stray Esc from skipping the intro can land just after it closes and pause the game.
    await h.eval(() => { if (window.wyrm.state === 'pause') window.wyrm.resume(); });
  };
  const calm = () => h.eval(() => { for (const e of window.wyrm.enemies) if (e.def.id !== 'dummy') { e.alive = false; e.state = 'dead'; e.deadT = 0.1; } });
  const closeCard = () => h.eval(() => { document.querySelector('.relic-card')?.remove(); });
  return { waitGame, place, found, press, pos, walkTo, hop, start, calm, closeCard };
}

export async function counts(h) {
  const { start } = helpers(h);
  await start();
  const c = await h.eval(() => {
    const g = window.wyrm;
    const bs = g.level.hittables.filter((x) => x.constructor.name === 'Breakable');
    const sec = {};
    for (const s of g.level.secrets) sec[s.kind] = (sec[s.kind] ?? 0) + 1;
    const high = bs.filter((b) => b.y - g.col.terrainAt(b.x, b.z) > 0.45).map((b) => `${b.kind}@${b.x.toFixed(1)},${b.z.toFixed(1)}+${(b.y - g.col.terrainAt(b.x, b.z)).toFixed(1)}`);
    return { n: bs.length, sec, chests: g.level.props.filter((p) => p.constructor.name === 'Chest' && !p.iron).length, high, dummies: g.enemies.filter((e) => e.alive && e.def.id === 'dummy').length, others: g.enemies.filter((e) => e.alive && e.def.id !== 'dummy').length };
  });
  console.log(JSON.stringify(c));
  h.check('40 to 80 breakables', c.n >= 40 && c.n <= 80, `${c.n}`);
  h.check('three eggs, four letters', c.sec.egg === 3 && c.sec.letter === 4, JSON.stringify(c.sec));
  h.check('two chests', c.chests === 2, `${c.chests}`);
  h.check('no Gloom at the hub until Aster goes looking', c.dummies === 5 && c.others === 0, JSON.stringify(c));
  const g = await h.eval(() => {
    const g = window.wyrm;
    const at = (x, z, from = 1e4) => +g.col.groundAt(x, z, from, 0.1).y.toFixed(2);
    return { bridgeA: at(-27, 21), bridgeB: at(-35, 27.2), libFloor: at(-45.5, 37.3, 4), vault: at(-55.6, 37, 4), towerTop: at(-50, 45), terrace: at(47, -36), top: at(49, -31.5), landing: at(50.8, -34.2), islet: at(-61.8, -17.8), hatchEdge: at(-56, -13.4) };
  });
  console.log('ground', JSON.stringify(g));
  h.check('ground where the new areas expect it', g.bridgeA > -0.5 && g.bridgeB > 0.5 && g.libFloor > 2.2 && g.vault > 2.2 && g.towerTop > 10 && g.terrace > 2.8
    && g.top > 11 && g.landing > 6.4 && g.islet > -5.2 && g.hatchEdge > 0.8, JSON.stringify(g));
}

export async function library(h) {
  const { waitGame, place, found, press, pos, walkTo, hop, start, calm, closeCard } = helpers(h);
  await start();
  // Over the old bridge: walk the first half, jump the burnt gap, walk on.
  await place(-22.8, 17.6, Math.atan2(-13, 10));
  await walkTo(-29.3, 22.8, 3, 0.4);
  let p = await hop((await pos()).x, (await pos()).z, -32.8, 25.5, (await pos()).y);
  h.check('a jump clears the burnt gap in the bridge', p.x < -31 && p.y > 0.3, JSON.stringify(p));
  await walkTo(-38.6, 30.2, 3, 0.5);
  p = await pos();
  h.check('the bridge reaches the library', p.x < -37.5 && p.y > 1.6, JSON.stringify(p));
  const foes = await h.eval(() => window.wyrm.enemies.filter((e) => e.alive && e.def.id !== 'dummy').map((e) => e.def.id));
  h.check('Gloom remnants turn up in the library', foes.length === 3, JSON.stringify(foes));
  await h.shot('fs-sanctum-lib-arrive');
  await calm();
  // The Keeper of Scrolls' notice on the first desk.
  await place(-47, 36.2, -Math.PI / 2, 2.3);
  await walkTo(-48.8, 36.3, 2, 0.3);
  await waitGame(0.3);
  h.check('the archivist\'s notice is on the desk', await found('sanctum:letter-archivist'), JSON.stringify(await pos()));
  await closeCard();
  // The scroll tower: round the back of the hall and up the vines.
  await place(-45.2, 44.9, -Math.PI / 2);
  await h.page.keyboard.down('KeyW');
  let climbed = false;
  for (let i = 0; i < 60; i++) {
    await waitGame(0.3);
    p = await pos();
    if (p.y > 10.5 && p.st !== 'climb') { climbed = true; break; }
  }
  await h.page.keyboard.up('KeyW');
  h.check('the scroll tower\'s vines climb to the roof', climbed, JSON.stringify(p));
  await walkTo(-50.4, 45.3, 2, 0.3);
  await waitGame(0.3);
  h.check('the egg on the scroll tower', await found('sanctum:egg-tower'), JSON.stringify(await pos()));
  await h.shot('fs-sanctum-tower-top');
  // The archive door: horns do nothing, an earth blast shifts it.
  await place(-51.6, 37, -Math.PI / 2, 2.3);
  await waitGame(0.2);
  await press('horn');
  await waitGame(0.6);
  const shut = await h.eval(() => window.wyrm.level.hittables.find((x) => x.constructor.name === 'Gate' && x.kind === 'rock').alive);
  h.check('horns bounce off the Warden stone', shut === true);
  await h.eval(() => {
    const g = window.wyrm;
    g.save.elements = ['fire', 'lightning', 'ice', 'earth'];
    g.player.element = 'earth';
    g.player.mana = 999;
  });
  let open = false;
  for (let i = 0; i < 3 && !open; i++) {
    await place(-50.6, 37, -Math.PI / 2, 2.3);
    await waitGame(0.2);
    await press('burst', 0.1);
    await waitGame(1.4);
    open = await h.eval(() => !window.wyrm.level.hittables.find((x) => x.constructor.name === 'Gate' && x.kind === 'rock').alive);
  }
  h.check('an earth blast opens the archive', open);
  await place(-53.0, 37, -Math.PI / 2, 2.3);
  await walkTo(-54.9, 37, 1.5, 0.3);
  await press('horn');
  await waitGame(1);
  h.check('the archive chest opens', await found('sanctum:chest:archive'), JSON.stringify(await pos()));
  await h.shot('fs-sanctum-archive');
}

export async function stargazers(h) {
  const { waitGame, place, found, press, pos, walkTo, hop, start, closeCard } = helpers(h);
  await start();
  // From the heart-shard islet: two floating stones, then the terrace.
  let p = await hop(25.8, -39.3, 29.6, -38.3);
  const a = p;
  p = await hop(29.6, -38.3, 34.6, -36.0, 2.3);
  const b2 = p;
  p = await hop(34.6, -36.0, 40.5, -34.8, 3.2);
  h.check('two floating stones lead to the Stargazers\' terrace', a.y > 2.1 && b2.y > 3.0 && p.x > 39.5 && p.y > 2.8, JSON.stringify([a, b2, p]));
  // Her log on the desk.
  await walkTo(44.6, -34.8, 3, 0.3);
  await waitGame(0.3);
  h.check('the stargazer\'s log is on her desk', await found('sanctum:letter-stargazer'), JSON.stringify(await pos()));
  await closeCard();
  // Up the star-steps, one jump each, from the ground to the top.
  const steps = await h.eval(() => {
    const out = [];
    for (let k = 1; k <= 6; k++) {
      const a = -Math.PI / 2 - (k - 1) * 1.08;
      out.push([49 + Math.sin(a) * 3.3, -31.5 + Math.cos(a) * 3.3, 3.0 + 1.2 * k]);
    }
    return out;
  });
  let from = [44.2, -31.5, undefined];
  const reached = [];
  for (const [x, z, y] of steps) {
    p = await hop(from[0], from[1], x, z, from[2]);
    // A missed landing: try that jump again from the same stone, as a player would.
    if (Math.abs(p.y - y) >= 0.3 && Math.abs(p.y - y - 1) >= 0.1) p = await hop(from[0], from[1], x, z, from[2]);
    reached.push(+(p.y - y).toFixed(2));
    from = [x, z, y];
    if (Math.abs(p.y - y) < 0.3 && Math.hypot(p.x - 50.8, p.z + 34.2) < 1.5 && !(await found('sanctum:chest:stargazer'))) {
      // The landing: open the strongbox.
      await h.eval(() => { const g = window.wyrm; g.player.yaw = Math.atan2(50.8 - g.player.x, -34.2 - g.player.z); });
      await press('horn');
      await waitGame(0.8);
    }
  }
  // (On the landing Aster may come down on the strongbox's lid, a metre up.)
  h.check('every star-step is one jump from the last', reached.every((d, i) => Math.abs(d) < 0.3 || (i === 2 && Math.abs(d - 1) < 0.1)), JSON.stringify(reached));
  if (!(await found('sanctum:chest:stargazer'))) {
    await place(50.0, -33.6, Math.atan2(0.8, -0.6), 6.6);
    await press('horn');
    await waitGame(0.8);
  }
  h.check('the strongbox on the landing opens', await found('sanctum:chest:stargazer'));
  p = await hop(from[0], from[1], 49, -31.5, from[2]);
  h.check('the last step reaches the telescope', p.y > 11, JSON.stringify(p));
  await walkTo(48.1, -30.7, 1.5, 0.2);
  await waitGame(0.3);
  h.check('the egg by the great telescope', await found('sanctum:egg-stars'), JSON.stringify(await pos()));
  await h.shot('fs-sanctum-stars');
}

export async function hatchery(h) {
  const { waitGame, place, found, press, pos, walkTo, hop, start, closeCard } = helpers(h);
  await start();
  await place(-42.8, -9.8, Math.PI * 0.8, 1.2);
  await walkTo(-41.4, -11.0, 2, 0.3);
  await waitGame(0.3);
  h.check('the hatchery roll is on the Keeper\'s desk', await found('sanctum:letter-hatchery'), JSON.stringify(await pos()));
  await closeCard();
  // Emberhold's letter on the terrace.
  await place(6.6, 49.4, Math.PI * 0.25, 4.6);
  await walkTo(8.4, 51.0, 2, 0.3);
  await waitGame(0.3);
  h.check('Emberhold\'s unsent letter is behind the east arch', await found('sanctum:letter-emberhold'), JSON.stringify(await pos()));
  await closeCard();
  // Off the south-west edge of the hatchery island, down onto the little rock.
  await place(-55.2, -12.6, Math.atan2(-6.6, -5.2));
  await walkTo(-62.3, -18.2, 3, 0.4);
  await waitGame(1.2);
  let p = await pos();
  h.check('a run off the edge lands on the rock below', p.y > -5.3 && p.y < -4.5, JSON.stringify(p));
  await walkTo(-62.8, -18.6, 1.5, 0.2);
  await waitGame(0.3);
  h.check('the egg that rolled off the ledge', await found('sanctum:egg-ledge'), JSON.stringify(await pos()));
  await h.shot('fs-sanctum-ledge');
  // And back up: the vines on the spire, then a hop onto the ledge.
  await place(-61.2, -17.4, Math.atan2(1.9, 1.4), -5);
  await h.page.keyboard.down('KeyW');
  let climbed = false;
  for (let i = 0; i < 50; i++) {
    await h.eval(() => window.wyrm.cam.snapBehind(Math.atan2(1.9, 1.4)));
    await waitGame(0.25);
    p = await pos();
    if (p.y > 0.8 && p.st !== 'climb') { climbed = true; break; }
    if (i === 3 && p.st !== 'climb') await press('jump', 0.15);
  }
  await h.page.keyboard.up('KeyW');
  h.check('the vines on the spire climb back to ledge height', climbed, JSON.stringify(p));
  p = await hop(p.x, p.z, -55.2, -12.9, p.y);
  h.check('a hop from the spire lands back on the hatchery island', p.y > 0.7 && p.x > -57.5, JSON.stringify(p));
}

export default async function (h) {
  for (const part of [counts, library, stargazers, hatchery]) await part(h);
}
