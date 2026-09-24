/** Puzzle props: the Fen's Gloom eye (reflect a bolt) and storehouse (boulder on a weight plate). */
export default async function (h) {
  /** Waits for `sec` seconds of game time (headless frames can be far slower than real time). */
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 400; i++) {
      await h.wait(100);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.go('?level=fen&cp=ruins&seed=3&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  const info = await h.eval(() => {
    const g = window.wyrm;
    for (const a of g.level.arenas) a.state = 'cleared';
    const t = (x, z) => +g.col.terrainAt(x, z).toFixed(2);
    const gnd = (x, z) => +g.col.groundAt(x, z, 1e4, 0.1).y.toFixed(2);
    return { shore: [t(9, 134), t(9, 136), t(9, 137), t(9, 138)], drum: gnd(9, 150), bridgeEnd: gnd(9, 137.5), water: g.waterLevel };
  });
  console.log('heights', JSON.stringify(info));

  // 1) Gloom eye. Stand on the shore facing it and bat a bolt back. (Headless frames are too
  // coarse to time a real swing, so the bolt is moved to arrive as the horn swings.)
  await h.eval(() => {
    const g = window.wyrm;
    const y = g.col.groundAt(9.5, 134.5, 1e4, 0.1).y;
    g.player.place(9.5, y + 0.05, 134.5, 0);
    g.cam.snapBehind(0);
  });
  await h.wait(500);
  let solved = false;
  let swings = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < 60000 && !solved) {
    const st = await h.eval(() => {
      const g = window.wyrm;
      const b = g.player.body;
      g.player.hp = g.player.maxHp;
      g.player.yaw = 0;
      const bolt = g.projectiles.find((p) => p.alive && !p.spec.fromPlayer);
      if (bolt && g.player.state === 'move' && b.grounded) {
        bolt.x = b.x; bolt.y = b.y + 1; bolt.z = b.z + 3;
        bolt.vx = 0; bolt.vy = 0; bolt.vz = -9;
        g.input.simulate('horn', true);
        return { swung: true, fired: false };
      }
      g.input.simulate('horn', false);
      return { swung: false, fired: g.level.fired.has('fen-eye') };
    });
    if (st.fired) { solved = true; break; }
    if (st.swung) { swings++; await h.wait(400); } else await h.wait(60);
  }
  h.check('batting a Gloom eye bolt back into its switch solves the eye', solved, `swings ${swings}`);
  await waitGame(1.6);
  const bridge = await h.eval(() => +window.wyrm.col.groundAt(9, 141, 1e4, 0.1).y.toFixed(2));
  h.check('the drawbridge drops to the drum', bridge > 1.0, `ground on the bridge ${bridge}`);
  await h.shot('puzzle-eye');
  // Walk across the bridge onto the drum.
  await h.page.keyboard.down('KeyW');
  await waitGame(1.6);
  await h.page.keyboard.up('KeyW');
  const onDrum = await h.eval(() => ({ z: window.wyrm.player.z, y: window.wyrm.player.y }));
  h.check('walks over the drawbridge', onDrum.z > 144 && onDrum.y > 1.2, JSON.stringify(onDrum));

  // 2) Storehouse. Roll the boulder onto the plate with tail swipes.
  const plate = { x: 2.6, z: 71 };
  let pressed = false;
  for (let i = 0; i < 14 && !pressed; i++) {
    const pos = await h.eval(({ px, pz }) => {
      const g = window.wyrm;
      const bo = g.level.boulders[0];
      const dx = px - bo.x;
      const dz = pz - bo.z;
      const n = Math.hypot(dx, dz) || 1;
      // Stand behind the boulder, facing the plate.
      const sx = bo.x - (dx / n) * 1.9;
      const sz = bo.z - (dz / n) * 1.9;
      const y = g.col.groundAt(sx, sz, 1e4, 0.1).y;
      const yaw = Math.atan2(dx, dz);
      g.player.place(sx, y + 0.05, sz, yaw);
      g.cam.snapBehind(yaw);
      return { bx: +bo.x.toFixed(2), bz: +bo.z.toFixed(2), d: +n.toFixed(2) };
    }, { px: plate.x, pz: plate.z });
    if (pos.d < 0.9) {
      // Close enough: a gentle nudge is all it needs; wait for it to settle.
      await waitGame(0.6);
    } else {
      await h.page.keyboard.press('KeyE');
      await waitGame(1.2);
    }
    pressed = await h.eval(() => window.wyrm.level.fired.has('fen-store'));
    console.log('boulder', JSON.stringify(pos), 'pressed', pressed);
  }
  h.check('rolling the boulder onto the weight plate fires the plate', pressed);
  await waitGame(1.8);
  const gate = await h.eval(() => {
    const g = window.wyrm;
    // The gate solid sits at x 6.8: a ray along +x at waist height passes if it is open.
    const y = g.col.groundAt(5, 71, 1e4, 0.1).y + 1;
    return +g.col.raycast(5, y, 71, 1, 0, 0, 3).t.toFixed(2);
  });
  h.check('the held gate opens', gate >= 3, `ray ${gate}`);
  await h.shot('puzzle-store');
  // Take the boulder off (the plate's rim holds it against a nudge): the door shuts again.
  await h.eval(() => {
    const g = window.wyrm;
    const bo = g.level.boulders[0];
    bo.body.setPos(-4, g.col.groundAt(-4, 67, 1e4, 0.1).y + 0.1, 67);
  });
  await waitGame(2);
  const shut = await h.eval(() => {
    const g = window.wyrm;
    const y = g.col.groundAt(5, 71, 1e4, 0.1).y + 1;
    return { t: +g.col.raycast(5, y, 71, 1, 0, 0, 3).t.toFixed(2), off: g.level.fired.has('fen-store:off') };
  });
  h.check('the door closes when the weight comes off', shut.off && shut.t < 3, JSON.stringify(shut));
}

/** The Sanctum's Hall of Moments: Dragon Time through a snap gate, then the element lock. */
export async function sanctum(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 400; i++) {
      await h.wait(100);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.go('?level=sanctum&seed=3&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  await h.eval(() => {
    const g = window.wyrm;
    g.save.elements = ['fire', 'lightning', 'ice', 'earth'];
    const y = g.col.groundAt(36, 32.6, 1e4, 0.1).y;
    g.player.place(36, y + 0.05, 32.6, 0);
    g.cam.snapBehind(0);
  });
  await waitGame(0.4);
  // Normal time: holding forward against the door never gets through.
  await h.page.keyboard.down('KeyW');
  await waitGame(4.5);
  await h.page.keyboard.up('KeyW');
  const plain = await h.eval(() => window.wyrm.player.z);
  h.check('the snap gate is too quick to pass in normal time', plain < 34, `z ${plain.toFixed(2)}`);
  // Dragon Time: wait for the glow, then hold C and run.
  let through = false;
  for (let tries = 0; tries < 3 && !through; tries++) {
    await h.eval(() => {
      const g = window.wyrm;
      const y = g.col.groundAt(36, 32.6, 1e4, 0.1).y;
      g.player.place(36, y + 0.05, 32.6, 0);
      g.player.dtime = g.player.dtimeMax;
    });
    for (let i = 0; i < 200; i++) {
      const left = await h.eval(() => {
        const gate = window.wyrm.level.props.find((p) => p.constructor.name === 'SnapGate');
        return gate.cycle - gate.open - gate.t;
      });
      if (left > 0 && left < 0.35) break;
      await h.wait(20);
    }
    await h.page.keyboard.down('KeyC');
    await h.page.keyboard.down('KeyW');
    // Run until the door has opened and shut again, then see which side Aster is on.
    let sawOpen = false;
    for (let i = 0; i < 400; i++) {
      await h.wait(40);
      const open = await h.eval(() => !window.wyrm.level.props.find((p) => p.constructor.name === 'SnapGate').solid.enabled);
      if (open) sawOpen = true;
      if (sawOpen && !open) break;
    }
    await h.wait(200);
    through = (await h.eval(() => window.wyrm.player.z)) > 35;
    await h.page.keyboard.up('KeyW');
    await h.page.keyboard.up('KeyC');
  }
  const z1 = await h.eval(() => window.wyrm.player.z);
  h.check('Dragon Time gets through the snap gate', through, `z ${z1.toFixed(2)}`);
  await h.shot('puzzle-moments');
  // The blade: walking straight into it hurts.
  const hp0 = await h.eval(() => window.wyrm.player.hp);
  await h.eval(() => { const g = window.wyrm; g.player.place(36, g.player.y, 36.9, 0); });
  await waitGame(1.2);
  const hp1 = await h.eval(() => window.wyrm.player.hp);
  h.check('the spin blade hurts', hp1 < hp0, `${hp0} -> ${hp1}`);

  // Element lock: breathe on each socket. Out of order first, which must reset it.
  const sockX = (slot) => 36 - (1.5 - slot) * 1.6;
  const slots = { ice: 1, fire: 3, earth: 0, lightning: 2 };
  const breatheAt = async (el) => {
    await h.eval(({ el, x }) => {
      const g = window.wyrm;
      g.player.hp = g.player.maxHp;
      g.player.mana = 999;
      g.player.element = el;
      const y = g.col.groundAt(x, 45.3, 1e4, 0.1).y;
      g.player.place(x, y + 0.05, 45.3, 0);
      g.cam.snapBehind(0);
    }, { el, x: sockX(slots[el]) });
    await waitGame(0.3);
    await h.page.keyboard.down('KeyK');
    await waitGame(0.9);
    await h.page.keyboard.up('KeyK');
    await waitGame(0.4);
    return h.eval(() => window.wyrm.level.props.find((p) => p.constructor.name === 'ElementLock').step);
  };
  await breatheAt('ice');
  const wrong = await breatheAt('earth');
  h.check('striking a socket out of turn resets the lock', wrong === 0, `step ${wrong}`);
  const steps = [];
  for (const el of ['ice', 'fire', 'earth', 'lightning']) steps.push(await breatheAt(el));
  const vault = await h.eval(() => window.wyrm.level.fired.has('moments-vault'));
  h.check('breathing on the sockets in the dotted order opens the vault', vault, `steps ${steps}`);
  await h.shot('puzzle-lock');
}

/** Stormspire Falls: the Stormglass cache's three conduits, charged together with lightning. */
export async function falls(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 100; i++) {
      await h.wait(80);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
    console.log('stuck', JSON.stringify(await h.eval(() => ({ gs: window.wyrm.state, t: window.wyrm.time, ps: window.wyrm.player.state }))));
  };
  await h.go('?level=falls&cp=terrace&seed=3&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  await h.eval(() => {
    const g = window.wyrm;
    g.save.elements = ['fire', 'lightning'];
    g.player.element = 'lightning';
    for (const e of g.enemies) { e.alive = false; e.state = 'dead'; e.deadT = 0.1; }
  });
  const conduits = await h.eval(() => window.wyrm.level.conduits.map((c) => [c.x, c.z]));
  h.check('three conduits built', conduits.length === 3, JSON.stringify(conduits));
  const breathe = async ([x, z]) => {
    await h.eval(({ x, z }) => {
      const g = window.wyrm;
      g.player.mana = 999;
      const px = -9 + (x + 9) * 0.35;
      const pz = 97 + (z - 97) * 0.35;
      const yaw = Math.atan2(x - px, z - pz);
      g.player.place(px, g.col.groundAt(px, pz, 1e4, 0.1).y + 0.05, pz, yaw);
    }, { x, z });
    await waitGame(0.15);
    await h.eval(() => window.wyrm.input.simulate('breath', true));
    await waitGame(0.45);
    console.log('breath', JSON.stringify(await h.eval(() => ({ st: window.wyrm.player.state, el: window.wyrm.player.element, t: window.wyrm.time }))));
    await h.eval(() => window.wyrm.input.simulate('breath', false));
    await waitGame(0.15);
  };
  const lit = [];
  for (const c of conduits) {
    await breathe(c);
    lit.push(await h.eval(() => window.wyrm.level.conduits.filter((c) => c.charged).length));
  }
  await waitGame(0.3);
  const opened = await h.eval(() => window.wyrm.level.fired.has('stormglass'));
  h.check('charging all three conduits together opens the stormglass cage', opened, `charged after each: ${lit}`);
  await h.shot('puzzle-conduits');
}

/** Stonewild Plains: the storehouse behind the arrival circle (boulder onto a weight plate). */
export async function plains(h) {
  const waitGame = async (sec) => {
    const start = await h.eval(() => window.wyrm.time);
    for (let i = 0; i < 100; i++) {
      await h.wait(80);
      if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
    }
  };
  await h.go('?level=plains&seed=3&quality=low&maxdt=0.1', 2500);
  await h.skipDialogue(8000);
  const plate = { x: 7.4, z: -34.5 };
  let pressed = false;
  for (let i = 0; i < 16 && !pressed; i++) {
    const pos = await h.eval(({ px, pz }) => {
      const g = window.wyrm;
      g.player.hp = g.player.maxHp;
      const bo = g.level.boulders[0];
      const dx = px - bo.x;
      const dz = pz - bo.z;
      const n = Math.hypot(dx, dz) || 1;
      const sx = bo.x - (dx / n) * 1.9;
      const sz = bo.z - (dz / n) * 1.9;
      const yaw = Math.atan2(dx, dz);
      g.player.place(sx, g.col.groundAt(sx, sz, 1e4, 0.1).y + 0.05, sz, yaw);
      g.cam.snapBehind(yaw);
      return { bx: +bo.x.toFixed(2), bz: +bo.z.toFixed(2), d: +n.toFixed(2) };
    }, { px: plate.x, pz: plate.z });
    await waitGame(0.3);
    if (pos.d > 0.9) await h.page.keyboard.press('KeyE');
    await waitGame(1.2);
    pressed = await h.eval(() => window.wyrm.level.fired.has('plains-cairn'));
    console.log('boulder', JSON.stringify(pos), 'pressed', pressed);
  }
  h.check('the plains boulder rolls onto its weight plate', pressed);
  await waitGame(1.8);
  const ray = await h.eval(() => {
    const g = window.wyrm;
    return +g.col.raycast(9.2, 1.8, -34.5, 1, 0, 0, 3.5).t.toFixed(2);
  });
  h.check('the storehouse door opens', ray >= 3.5, `ray ${ray}`);
  await h.shot('puzzle-plains');
}
