import * as THREE from 'three';
import type { Game } from '../game/game';
import { glow } from '../render/materials';
import { damp } from '../core/math';
import { Collectible } from '../entities/props';
import { Chest } from '../entities/breakables';

/**
 * Flick, the firefly who grew up alongside Aster. Hovers over the dragon's
 * shoulder, glows, and chimes in with hints through the HUD.
 */
export class Flick {
  readonly root = new THREE.Group();
  readonly position = new THREE.Vector3();
  private wings: THREE.Mesh[] = [];
  private t = 0;
  private sparkT = 0;
  private titleAngle = 0;
  /** Flick darting off to point at a secret: where, and how long left. */
  private seekTarget: THREE.Vector3 | null = null;
  private seekT = 0;
  private seekCd = 0;

  constructor(private game: Game) {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), glow(0x3a2a10));
    body.scale.set(1, 1, 1.6);
    this.root.add(body);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), glow(0xb8a850));
    tail.position.z = -0.16;
    this.root.add(tail);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), glow(0xffe060, 0.08, true));
    halo.position.z = -0.16;
    this.root.add(halo);
    const wm = new THREE.MeshBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.16, 10), wm);
      w.scale.set(1, 0.45, 1);
      w.position.set(s * 0.12, 0.06, 0);
      w.rotation.x = -Math.PI / 2;
      this.root.add(w);
      this.wings.push(w);
    }
    game.scene.add(this.root);
  }

  reset(): void {
    const p = this.game.player;
    this.position.set(p.x + 0.8, p.y + 1.8, p.z);
    this.root.visible = true;
    this.seekTarget = null;
    this.seekT = 0;
    this.seekCd = 0;
  }

  /**
   * "Flick, find something!" He darts toward the nearest undiscovered egg,
   * letter, shard, relic or unopened chest, hovers there glowing, then comes
   * back. Returns what he said.
   */
  seek(): string {
    const g = this.game;
    if (this.seekCd > 0) return 'Give my wings a second!';
    const p = g.player;
    let best: THREE.Vector3 | null = null;
    let bestD = 140;
    for (const pr of g.level?.props ?? []) {
      let x = 0;
      let y = 0;
      let z = 0;
      if (pr instanceof Collectible) {
        if (pr.taken) continue;
        x = pr.x; y = pr.y + 1.2; z = pr.z;
      } else if (pr instanceof Chest) {
        if (!pr.alive) continue;
        x = pr.x; y = pr.y + 1; z = pr.z;
      } else continue;
      const d = Math.hypot(x - p.x, (y - p.y) * 0.5, z - p.z);
      if (d < bestD) {
        bestD = d;
        best = new THREE.Vector3(x, y, z);
      }
    }
    this.seekCd = 8;
    if (!best) return 'I can\'t sense anything else hidden around here. We found it all!';
    this.seekTarget = best;
    this.seekT = Math.min(6, 1.6 + bestD / 14);
    g.sfx('relic', best.x, best.y, best.z, 1.6, 0.4);
    const paces = Math.round(bestD);
    const high = best.y - p.y > 4 ? ' It\'s up high!' : best.y - p.y < -4 ? ' Somewhere below us!' : '';
    return bestD < 8 ? `Right here! Look close!${high}` : `This way! Something's hidden about ${paces} paces off.${high}`;
  }

  update(dt: number): void {
    const p = this.game.player;
    this.t += dt;
    this.seekCd = Math.max(0, this.seekCd - dt);
    if (this.seekTarget && this.seekT > 0) {
      // Dart out, hover over the find, trailing light so the path is easy to follow.
      this.seekT -= dt;
      const s = this.seekTarget;
      const k = Math.min(1, dt * 2.4);
      this.position.x += (s.x - this.position.x) * k;
      this.position.y += (s.y + 0.6 + Math.sin(this.t * 5) * 0.2 - this.position.y) * k;
      this.position.z += (s.z - this.position.z) * k;
      const g = this.game;
      g.fx.emit(this.position.x, this.position.y, this.position.z, {
        count: 2, speed: 0.4, life: [0.8, 1.4], size: [0.14, 0.24], sizeEnd: 0, color: 0xfff080, bright: 2.4, gravity: -0.2,
      });
      if (this.position.distanceTo(s) < 1.5 && Math.floor(this.t * 3) !== Math.floor((this.t - dt) * 3)) g.fx.ring(s.x, s.y - 1, s.z, 0.3, 1.8, 0xffe890, 0.6);
      this.pose(dt, Math.atan2(s.x - this.position.x, s.z - this.position.z));
      this.root.visible = !p.hidden;
      if (this.seekT <= 0) this.seekTarget = null;
      return;
    }
    const side = Math.sin(this.t * 0.4) * 0.3 + 0.9;
    const tx = p.x + Math.cos(p.yaw) * side - Math.sin(p.yaw) * 0.6;
    const tz = p.z - Math.sin(p.yaw) * side - Math.cos(p.yaw) * 0.6;
    const ty = p.y + 1.9 + Math.sin(this.t * 2.6) * 0.18;
    this.position.x = damp(this.position.x, tx, 4, dt);
    this.position.y = damp(this.position.y, ty, 4, dt);
    this.position.z = damp(this.position.z, tz, 4, dt);
    this.pose(dt, p.yaw);
    this.root.visible = !p.hidden;
  }

  updateTitle(dt: number): void {
    this.t += dt;
    this.titleAngle += dt * 0.5;
    this.position.set(Math.sin(this.titleAngle) * 5, 4 + Math.sin(this.t * 1.3) * 0.8, 10 + Math.cos(this.titleAngle) * 5);
    this.pose(dt, this.titleAngle + Math.PI / 2);
  }

  private pose(dt: number, yaw: number): void {
    this.root.position.copy(this.position);
    this.root.rotation.y = yaw;
    for (const w of this.wings) w.rotation.y = Math.sin(this.t * 60) * 0.6 * Math.sign(w.position.x);
    this.sparkT -= dt;
    if (this.sparkT <= 0) {
      this.sparkT = 0.12;
      this.game.fx.emit(this.position.x, this.position.y, this.position.z, {
        count: 1, speed: 0.3, life: [0.5, 0.9], size: [0.08, 0.14], sizeEnd: 0, color: 0xfff080, bright: 2, gravity: 0.3,
      });
    }
  }
}
