import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Prop } from './props';
import { glow } from '../render/materials';
import { bump } from '../game/feats';

/**
 * A flight-ring challenge: a chain of glowing rings strung through the air.
 * Fly (jump, flap, glide) through the first to start the clock; every ring
 * adds a few seconds and lights the next. Finish the chain for a hoard of
 * gems (a big one the first time). Miss the clock and the rings reset.
 */
export class SkyRings implements Prop {
  private rings: { p: THREE.Vector3; n: THREE.Vector3; mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; done: boolean }[] = [];
  private next = 0;
  private timeLeft = 0;
  private running = false;
  private hud: HTMLDivElement;
  private t = 0;
  private cooldown = 0;

  constructor(private game: Game, readonly id: string, points: [number, number, number][], private opts: { time?: number; bonus?: number; reward?: number } = {}) {
    const R = 2.3;
    const geo = new THREE.TorusGeometry(R, 0.16, 8, 32);
    points.forEach((pt, i) => {
      const p = new THREE.Vector3(...pt);
      // Each ring faces along the path: from the previous ring to the next.
      const a = new THREE.Vector3(...(points[Math.max(0, i - 1)] ?? pt));
      const b = new THREE.Vector3(...(points[Math.min(points.length - 1, i + 1)] ?? pt));
      const n = b.sub(a);
      n.y *= 0.5;
      if (n.lengthSq() < 1e-4) n.set(0, 0, 1);
      n.normalize();
      const mat = glow(0xf5c46b, 0.9, true).clone() as THREE.MeshBasicMaterial;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(p);
      mesh.lookAt(p.clone().add(n));
      game.level!.root.add(mesh);
      this.rings.push({ p, n, mesh, mat, done: false });
    });
    this.hud = document.createElement('div');
    this.hud.className = 'toast good';
    this.hud.style.cssText = 'position:absolute;left:50%;top:7%;transform:translateX(-50%);font-size:16px;display:none;';
    game.hud.root.appendChild(this.hud);
    this.paint();
  }

  dispose(): void {
    this.hud.remove();
  }

  private get key(): string {
    return `rings:${this.id}`;
  }

  private paint(): void {
    this.rings.forEach((r, i) => {
      const on = i === this.next;
      r.mat.color.setHex(r.done ? 0x80f0a0 : on ? 0xffe08a : 0xb090ff);
      r.mat.opacity = r.done ? 0.2 : on ? 0.75 : this.running ? 0.45 : 0.3;
    });
  }

  private reset(): void {
    this.running = false;
    this.next = 0;
    for (const r of this.rings) r.done = false;
    this.hud.style.display = 'none';
    this.cooldown = 1;
    this.paint();
  }

  update(dt: number): void {
    const g = this.game;
    this.t += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    const b = g.player.body;
    const c = new THREE.Vector3(b.x, b.y + 0.7, b.z);
    // Rings breathe; the one to aim for pulses.
    this.rings.forEach((r, i) => {
      const s = i === this.next ? 1 + Math.sin(this.t * 6) * 0.06 : 1;
      r.mesh.scale.setScalar(s);
      r.mesh.rotation.z += dt * (i === this.next ? 1.5 : 0.3);
    });
    const r = this.rings[this.next];
    if (r && this.cooldown <= 0) {
      const d = c.clone().sub(r.p);
      const along = d.dot(r.n);
      const across = d.clone().addScaledVector(r.n, -along).length();
      if (Math.abs(along) < 1.2 && across < 2.4) this.pass();
    }
    if (this.running) {
      this.timeLeft -= dt;
      this.hud.innerHTML = `Flight rings ${this.next}/${this.rings.length} &middot; ${Math.max(0, this.timeLeft).toFixed(1)}s`;
      // A trail of sparks toward the next ring.
      const nx = this.rings[this.next];
      if (nx && Math.random() < 0.5) {
        const k = Math.random();
        g.fx.sparkle(c.x + (nx.p.x - c.x) * k * 0.3, c.y + (nx.p.y - c.y) * k * 0.3, c.z + (nx.p.z - c.z) * k * 0.3, 0xffe08a, 1);
      }
      if (this.timeLeft <= 0 || !g.player.alive) {
        g.toast('The rings dim. Fly through the first one to try again.', 'warn');
        g.audio.play('uiBack');
        this.reset();
      }
    }
  }

  private pass(): void {
    const g = this.game;
    const r = this.rings[this.next]!;
    r.done = true;
    g.fx.ring(r.p.x, r.p.y, r.p.z, 1.5, 3.4, 0xffe08a, 0.4);
    g.fx.sparkle(r.p.x, r.p.y, r.p.z, 0xffe08a, 14);
    g.audio.play('gemPurple', 1 + this.next * 0.06, 0.7);
    if (!this.running) {
      this.running = true;
      this.timeLeft = this.opts.time ?? 8;
      this.hud.style.display = '';
      g.toast('Flight rings! Through every one before the time runs out.', 'hint');
    } else this.timeLeft += this.opts.bonus ?? 2.5;
    this.next++;
    if (this.next >= this.rings.length) this.finish();
    this.paint();
  }

  private finish(): void {
    const g = this.game;
    const first = !g.save.found[this.key];
    g.save.found[this.key] = true;
    const reward = first ? this.opts.reward ?? 60 : 12;
    const p = g.player.body;
    g.spawnGems(p.x, p.y + 1.5, p.z, { blue: reward, ...(first ? { purple: 2 } : {}) }, false);
    g.audio.play('levelUp');
    g.fx.motes(p.x, p.y + 1, p.z, 0xffe08a, 30);
    g.toast(first ? `Flight rings complete! +${reward} gems` : 'Flight rings complete again!', 'good');
    bump(g.save, 'rings');
    g.checkFeats();
    g.style.bonus(40);
    this.reset();
  }
}
