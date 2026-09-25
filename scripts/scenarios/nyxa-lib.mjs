// Shared helpers for the nyxa-* scenarios.

/** Waits `sec` of game time. */
export async function waitGame(h, sec) {
  const start = await h.eval(() => window.wyrm.time);
  for (let i = 0; i < 1200; i++) {
    await h.wait(50);
    if ((await h.eval(() => window.wyrm.time)) - start >= sec) return;
  }
}

/** Loads a realm with Eclipse Keep done (so Nyxa travels along), Aster untouchable and the realm's foes gone. */
export async function withNyxa(h, level, clearFoes = true) {
  await h.eval((level) => { const g = window.wyrm; g.save.levelsDone.keep = true; g.loadLevel(level, {}); }, level);
  await h.skipDialogue(6000);
  await h.eval((clearFoes) => {
    const g = window.wyrm;
    g.player.invuln = true;
    // No "click to play" card over the screenshots.
    g.input.wantPointerLock = false;
    if (clearFoes) for (const e of g.enemies) { e.alive = false; e.state = 'dead'; e.deadT = 9; }
  }, clearFoes);
  await waitGame(h, 0.4);
}

/** Puts Aster on the ground at (x, z), facing yaw, with the camera behind him. */
export async function place(h, x, z, yaw = 0) {
  await h.eval(([x, z, yaw]) => {
    const g = window.wyrm;
    const y = g.col.groundAt(x, z, 1e4, 0.2).y;
    g.player.place(x, y + 0.05, z, yaw);
    g.player.body.grounded = true;
    g.cam.snapBehind(yaw, 0.3);
  }, [x, z, yaw]);
}

export const nyxa = (h) => h.eval(() => {
  const g = window.wyrm;
  const n = g.partner;
  const p = g.player;
  return {
    present: n.present, hidden: n.hidden, mode: n.mode, steps: n.steps, staying: n.staying, cd: +n.cmdCd.toFixed(2), ready: +n.ready.toFixed(2),
    d: +Math.hypot(n.x - p.x, n.z - p.z).toFixed(2), dy: +(n.y - p.y).toFixed(2), x: +n.x.toFixed(2), y: +n.y.toFixed(2), z: +n.z.toFixed(2),
    px: +p.x.toFixed(1), pz: +p.z.toFixed(1), dealt: Math.round(n.dealt),
    hud: !document.querySelector('.partner')?.classList.contains('off'), cls: document.querySelector('.partner')?.className ?? '',
    say: document.querySelector('.partner-say.on span')?.textContent ?? '',
  };
});

/**
 * Walks Aster through waypoints with the movement axes (the way a stick would),
 * steered every frame inside the page. Samples Nyxa's distance from him four
 * times a game second; resolves with the samples once the route is done.
 */
export async function walk(h, route, legMax = 14) {
  await h.eval(([route, legMax]) => {
    const g = window.wyrm;
    const st = { i: 0, samples: [], hidden: 0, done: false, legT: g.time, sT: 0, route, falls: 0, missed: 0 };
    window.__walk = st;
    if (!window.__walkHooked) {
      window.__walkHooked = true;
      const orig = g.frame.bind(g);
      g.frame = (dt) => {
        const s = window.__walk;
        if (s && !s.done) {
          const p = g.player;
          const [x, z] = s.route[s.i];
          const dx = x - p.x;
          const dz = z - p.z;
          const d = Math.hypot(dx, dz);
          if (d < 1.4 || g.time - s.legT > s.legMax) {
            if (d >= 1.4) s.missed++;
            s.i++;
            s.legT = g.time;
            if (s.i >= s.route.length) {
              s.done = true;
              g.input.forceMove = null;
            }
          } else {
            const a = g.cam.yaw;
            const ux = dx / d;
            const uz = dz / d;
            const k = Math.min(1, d / 2.5);
            g.input.forceMove = { x: (-Math.cos(a) * ux + Math.sin(a) * uz) * k, y: (Math.sin(a) * ux + Math.cos(a) * uz) * k };
          }
          if (p.state === 'fall') s.falls++;
          if (g.time - s.sT > 0.25) {
            s.sT = g.time;
            const n = g.partner;
            if (n.present && !n.hidden) s.samples.push(Math.hypot(n.x - p.x, n.z - p.z));
            else s.hidden++;
          }
        }
        orig(dt);
      };
    }
    st.legMax = legMax;
  }, [route, legMax]);
  for (let i = 0; i < 600; i++) {
    await waitGame(h, 0.5);
    if (await h.eval(() => window.__walk.done)) break;
  }
  return h.eval(() => ({ samples: window.__walk.samples, hidden: window.__walk.hidden, falls: window.__walk.falls, leg: window.__walk.i, missed: window.__walk.missed }));
}

/** A quick press and release of the partner command (G). */
export async function tapG(h) {
  await h.eval(() => window.wyrm.input.simulate('partner', true));
  await waitGame(h, 0.08);
  await h.eval(() => window.wyrm.input.simulate('partner', false));
}

export async function holdG(h, sec) {
  await h.eval(() => window.wyrm.input.simulate('partner', true));
  await waitGame(h, sec);
  await h.eval(() => window.wyrm.input.simulate('partner', false));
}
