// Screenshots of Nyxa's attacks, forced one at a time.
import { place, run, down, up } from './keeplib.mjs';

async function force(h, id, phase, fly) {
  await h.eval(([id, phase, fly]) => {
    const g = window.wyrm;
    const b = g.boss;
    b.phase = phase;
    b.hp = b.maxHp * (phase === 1 ? 0.9 : phase === 2 ? 0.5 : 0.2);
    b.awake = true;
    b.status.clear();
    if (fly && !b.flying) b.takeOff(true);
    b.startAttack(b.def.attacks.find((a) => a.id === id));
  }, [id, phase, fly]);
}

async function snapWhen(h, pred, name, limit = 6) {
  await run(h, [{ when: pred }], limit);
  await h.shot(name);
}

export default async function (h) {
  await h.go('?level=keep&seed=5&quality=low&maxdt=0.25', 3000);
  await h.skipDialogue();
  await h.eval(() => {
    const g = window.wyrm;
    for (const e of ['fire', 'lightning', 'ice', 'earth']) if (!g.save.elements.includes(e)) g.learnElement(e);
    for (const e of g.enemies) if (!e.isBoss) e.die(null);
  });
  await place(h, 0, -243, Math.PI);
  await run(h, [{ keys: down('KeyW') }, { when: 'g.state === "dialogue"', keys: up('KeyW') }, { after: 0.8 }], 8);
  await h.skipDialogue(6000);
  await h.eval(() => { const g = window.wyrm; g.player.invuln = true; g.boss.awake = false; });
  // Stand facing her from the south with the camera behind.
  const stand = async () => {
    await h.eval(() => {
      const g = window.wyrm;
      const b = g.boss;
      b.body.setPos(0, b.y, -262);
      b.body.vx = b.body.vz = 0;
      b.yaw = 0;
      const y = g.col.groundAt(0, -254, 1e4, 0.2).y;
      g.player.place(0, y + 0.1, -254, Math.PI);
      g.cam.snapBehind(Math.PI, 0.3);
    });
    await h.wait(600);
  };
  await stand();
  await h.shot('kv-idle');
  await force(h, 'breath', 1, false);
  await snapWhen(h, 'g.boss.state === "active" && g.boss.stateT > 0.5', 'kv-breath');
  await stand();
  await force(h, 'scythe', 1, false);
  await snapWhen(h, 'g.boss.state === "windup" && g.boss.stateT > 0.3', 'kv-scythe-windup');
  await snapWhen(h, 'g.boss.state === "active"', 'kv-scythe');
  await stand();
  await force(h, 'lunge', 1, false);
  await snapWhen(h, 'g.boss.state === "active"', 'kv-lunge');
  await stand();
  await force(h, 'poof', 1, false);
  await snapWhen(h, 'g.boss.attack?.id === "ambush" && g.boss.state === "windup"', 'kv-ambush');
  await stand();
  await force(h, 'orbs', 2, true);
  await snapWhen(h, 'g.boss.state === "active" && g.boss.stateT > 0.2', 'kv-orbs');
  await h.eval(() => { const g = window.wyrm; g.player.place(0, g.player.y + 0.1, -254, Math.PI); });
  await force(h, 'dive', 2, true);
  await snapWhen(h, 'g.boss.state === "windup" && g.boss.stateT > 0.7', 'kv-dive-windup');
  await snapWhen(h, 'g.boss.state === "recover"', 'kv-dive-impact');
  await stand();
  await force(h, 'nova', 3, false);
  await snapWhen(h, 'g.boss.state === "recover"', 'kv-nova');
  await stand();
  await h.eval(() => { const b = window.wyrm.boss; b.awake = false; b.setState('down'); b.flipped = 3; });
  await h.wait(800);
  await h.shot('kv-down');
}
