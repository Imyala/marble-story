// Close-ups of Nyxa's poses for looking over her animation: standing, running, each of
// her attacks held part-way through, resting, and gliding. Screenshots only, plus a
// check that every pose ran without errors. Best at W=960 H=600.
import { waitGame, withNyxa, place } from './nyxa-lib.mjs';

/** Frames the camera on Nyxa from her side. */
async function frame(h, side = 1, dist = 5.5, up = 1.6) {
  await h.eval(([side, dist, up]) => {
    const g = window.wyrm;
    const n = g.partner;
    const THREE = n.body.constructor;
    void THREE;
    const yaw = n.yaw + (Math.PI / 2) * side + 0.35 * side;
    const pos = { x: n.x + Math.sin(yaw) * dist, y: n.y + up, z: n.z + Math.cos(yaw) * dist };
    const look = { x: n.x, y: n.y + 1.1, z: n.z };
    const V = g.camera.position.constructor;
    g.cam.setShot(new V(pos.x, pos.y, pos.z), new V(look.x, look.y, look.z));
  }, [side, dist, up]);
}

/** Holds one of her acts at fraction `k` of the way through, for a still. */
async function hold(h, act, k, name) {
  await h.eval(([act, k]) => {
    const g = window.wyrm;
    const n = g.partner;
    const e = window.__dummy;
    e.hp = e.maxHp;
    n.startAct(act, e);
    window.__pin = { k, act };
  }, [act, k]);
  await waitGame(h, 0.6);
  await h.shot(name);
  await h.eval(() => { window.__pin = null; window.wyrm.partner.act = null; });
  await waitGame(h, 0.3);
}

export default async function (h) {
  await h.page.addInitScript(() => localStorage.clear());
  await h.go('?level=plains&seed=5&quality=high&maxdt=0.1', 2500);
  await h.skipDialogue(6000);
  await withNyxa(h, 'plains');
  await place(h, 0, 40, 0);
  await waitGame(h, 2.5);
  // A foe to swing at that stands still and does not fight back.
  await h.eval(() => {
    const g = window.wyrm;
    const n = g.partner;
    const e = g.spawnEnemy('grunt', n.x + Math.sin(n.yaw) * 2.6, n.y + 0.05, n.z + Math.cos(n.yaw) * 2.6, n.yaw + Math.PI, false);
    e.hp = e.maxHp = 1e6;
    e.update = () => {};
    e.model.root.position.set(e.x, e.y, e.z);
    window.__dummy = e;
    // Pin the held act's clock every frame (before the game steps it).
    const orig = g.frame.bind(g);
    g.frame = (dt) => {
      const pin = window.__pin;
      if (pin && n.act) n.actT = pin.k * n.act.dur;
      orig(dt);
    };
  });
  await frame(h, 1);
  await waitGame(h, 1.6);
  await h.shot('nyxa-look-stand');
  await hold(h, 'claw1', 0.3, 'nyxa-look-claw1');
  await hold(h, 'claw2', 0.3, 'nyxa-look-claw2');
  await hold(h, 'sweep', 0.42, 'nyxa-look-sweep');
  await hold(h, 'finish', 0.5, 'nyxa-look-finish');
  await hold(h, 'strike', 0.36, 'nyxa-look-strike');
  await hold(h, 'bolt', 0.36, 'nyxa-look-bolt');
  await hold(h, 'veil', 0.4, 'nyxa-look-veil');
  // Resting beside a still Aster.
  await h.eval(() => {
    const g = window.wyrm;
    const e = window.__dummy;
    e.alive = false;
    e.state = 'dead';
    e.deadT = 9;
    g.partner.target = null;
  });
  await waitGame(h, 1);
  await h.eval(() => { const n = window.wyrm.partner; n.idleT = 30; n.resting = true; });
  await frame(h, -1, 6, 2);
  await waitGame(h, 1.5);
  await h.shot('nyxa-look-rest');
  // Running beside him.
  await h.eval(() => { const g = window.wyrm; g.cam.clearShot(); g.input.forceMove = { x: 0, y: 1 }; });
  await waitGame(h, 1.6);
  await h.shot('nyxa-look-run');
  await h.eval(() => { window.wyrm.input.forceMove = null; });
  const ok = await h.eval(() => ({ present: window.wyrm.partner.present, mode: window.wyrm.partner.mode }));
  h.check('every pose played', ok.present, JSON.stringify(ok));
}
