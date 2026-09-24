import * as THREE from 'three';
import type { Game } from '../game/game';
import { glow } from '../render/materials';
import { damp } from '../core/math';

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

  constructor(private game: Game) {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), glow(0x3a2a10));
    body.scale.set(1, 1, 1.6);
    this.root.add(body);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), glow(0xd8c860));
    tail.position.z = -0.16;
    this.root.add(tail);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), glow(0xffe060, 0.14, true));
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
  }

  update(dt: number): void {
    const p = this.game.player;
    this.t += dt;
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
