// Shared helpers for the Stonewild Plains scenarios.
//
// An in-page autopilot drives the real input paths once per rendered frame:
// movement through Input.forceMove, and jumps, flaps and slams as keyboard
// events. Software GL runs at a few frames per second, so polling from the
// test process alone is too coarse for jumps between pillars.

export async function setup(h, { fast = true, clearEnemies = true } = {}) {
  await h.eval(({ fast, clearEnemies }) => {
    const g = window.wyrm;
    for (const e of ['fire', 'lightning', 'ice']) if (!g.save.elements.includes(e)) g.learnElement(e);
    if (clearEnemies) {
      for (const e of g.enemies) { e.alive = false; e.dispose(); }
      g.enemies = [];
    }
    if (fast) {
      g.renderer.gl.setPixelRatio(0.4);
      g.camera.far = 70;
      g.camera.updateProjectionMatrix();
      g.level.root.traverse((o) => { if (o.isInstancedMesh) o.visible = false; });
    }
    const key = (code, type) => window.dispatchEvent(new KeyboardEvent(type, { code }));
    window.__auto = null;
    const tick = () => {
      const a = window.__auto;
      if (a && !a.done) {
        const p = g.player.body;
        const dx = a.x - p.x;
        const dz = a.z - p.z;
        const d = Math.hypot(dx, dz);
        const cy = g.cam.yaw;
        const fx = Math.sin(cy);
        const fz = Math.cos(cy);
        const rx = -Math.cos(cy);
        const rz = Math.sin(cy);
        const m = d < a.stop ? 0 : Math.min(1, d / a.slow);
        g.input.forceMove = m > 0 ? { x: ((dx * rx + dz * rz) / d) * m, y: ((dx * fx + dz * fz) / d) * m } : { x: 0, y: 0 };
        if (a.tStart === undefined) a.tStart = g.time;
        const t = g.time - a.tStart;
        if (a.kind === 'jump') {
          // Hold the jump until it stops rising fast: an early release is a short hop.
          if (!a.pressed) { a.pressed = true; key('Space', 'keydown'); }
          else if (!a.up1 && (t >= 0.24 || p.vy < 4)) { a.up1 = true; a.upAt = t; key('Space', 'keyup'); }
          if (!p.grounded) a.left = true;
          if (a.flap && !a.flapped && a.up1 && t > a.upAt && t >= a.flapAt) { a.flapped = true; key('Space', 'keydown'); a.up2 = false; }
          else if (a.flapped && a.up2 === false) {
            a.up2 = true;
            // Keep Space held to glide after the flap.
            if (!a.glide) key('Space', 'keyup');
          }
          if (a.slam && !a.slammed && a.left && t >= a.slamAt) { a.slammed = true; key('KeyE', 'keydown'); a.upE = false; }
          else if (a.slammed && a.upE === false) { a.upE = true; key('KeyE', 'keyup'); }
          if ((a.left && p.grounded && t > 0.2) || t > (a.maxT ?? 5)) {
            a.done = true;
            // Never leave a key held into the next manoeuvre.
            key('Space', 'keyup');
            key('KeyE', 'keyup');
          }
        } else if (d < a.stop || t > a.maxT) a.done = true;
        if (a.done) g.input.forceMove = null;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, { fast, clearEnemies });

  const settle = async () => {
    for (let i = 0; i < 40; i++) {
      const q = await h.eval(() => ({ st: window.wyrm.state, ps: window.wyrm.player.state }));
      if (q.st === 'dialogue') { await h.page.keyboard.press('Escape'); await h.wait(200); continue; }
      if (q.st === 'play' && (q.ps === 'move' || q.ps === 'breath')) return;
      await h.wait(200);
    }
  };
  const face = (yaw) => h.eval((yaw) => { const g = window.wyrm; g.player.yaw = yaw; g.cam.snapBehind(yaw, 0.3); }, yaw);
  const tp = async (x, z, yaw, y) => {
    await settle();
    await h.eval(([x, z, yaw, y]) => {
      const g = window.wyrm;
      const gy = y ?? g.col.groundAt(x, z, 1e4, 0.2).y;
      g.player.place(x, gy + 0.05, z, yaw);
      g.player.setState('move');
      g.player.yaw = yaw;
      g.cam.snapBehind(yaw, 0.3);
      g.player.mana = g.player.maxMana;
      g.player.hp = g.player.maxHp;
    }, [x, z, yaw, y]);
    await h.wait(400);
  };
  const pos = () => h.eval(() => { const p = window.wyrm.player; return { x: p.x, y: p.y, z: p.z, vy: p.body.vy, g: p.body.grounded, ps: p.state }; });
  const auto = async (spec) => {
    await h.eval((spec) => { window.__auto = spec; }, spec);
    for (let i = 0; i < 150; i++) {
      await h.wait(100);
      if (await h.eval(() => !window.__auto || window.__auto.done)) break;
    }
    await h.wait(250);
  };
  const walkTo = (x, z, near = 0.8, maxT = 8) => auto({ kind: 'walk', x, z, stop: near, slow: 1.2, maxT });
  const jumpTo = (x, z, flap = true) => auto({ kind: 'jump', x, z, stop: 0.25, slow: 2.2, flap, flapAt: 0.26 });
  const glideTo = (x, z, maxT = 8) => auto({ kind: 'jump', x, z, stop: 0.4, slow: 1.5, flap: true, flapAt: 0.26, glide: true, maxT });
  const breathe = async (key, ms) => {
    await h.tap(key);
    await h.page.keyboard.down('KeyK');
    await h.wait(ms);
    await h.page.keyboard.up('KeyK');
  };
  const found = (id) => h.eval((id) => !!window.wyrm.save.found[`plains:${id}`], id);
  return { settle, face, tp, pos, auto, walkTo, jumpTo, glideTo, breathe, found };
}
