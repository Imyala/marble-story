import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Prop } from './props';
import type { Enemy } from '../enemies/enemy';
import { mat, glow } from '../render/materials';

/**
 * Power-ups, after the classic powerup gates: a shrine sleeps while Gloom
 * guards stand near it, wakes when they fall, and fills the dragon with
 * power for a little while when walked through. Speed runes on the ground
 * supercharge a charge that runs over them. Iron-bound chests only open to
 * a powered-up dragon.
 */

export type PowerKind = 'superflame' | 'supercharge' | 'invincible';

export const POWERS: Record<PowerKind, { name: string; secs: number; color: number; css: string; line: string }> = {
  superflame: { name: 'Superflame', secs: 20, color: 0x9ad8ff, css: '#9ad8ff', line: 'Your breath burns white-hot! Iron melts, foes melt faster!' },
  supercharge: { name: 'Supercharge', secs: 14, color: 0xffa040, css: '#ffa040', line: 'Supercharged! Charge and nothing can stand in your way!' },
  invincible: { name: 'Invincibility', secs: 15, color: 0xffe070, css: '#ffe070', line: 'Invincible! Nothing can hurt you, and everything you touch, hurts!' },
};

const stone = () => mat(0x7a7488, { rough: 0.9, flat: true });

/** A shrine that grants a power-up once the Gloom guarding it is gone. */
export class PowerShrine implements Prop {
  private root = new THREE.Group();
  private ringMat: THREE.MeshBasicMaterial;
  private coreMat: THREE.MeshBasicMaterial;
  private core: THREE.Mesh;
  private icon: THREE.Mesh;
  private guards: Enemy[] | null = null;
  private t = 0;
  /** 'locked' while guards stand, then 'ready'; after use it recharges. */
  state: 'locked' | 'ready' | 'spent' = 'locked';
  private spentT = 0;
  private color: THREE.Color;

  constructor(private game: Game, readonly id: string, readonly kind: PowerKind, readonly x: number, readonly y: number, readonly z: number,
    private yaw: number, private guardRadius = 18) {
    this.color = new THREE.Color(POWERS[kind].color);
    const s = stone();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 0.35, 10), s);
    base.position.y = 0.17;
    base.receiveShadow = true;
    this.root.add(base);
    for (const side of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 3.2, 6), s);
      p.position.set(side * 1.55, 1.9, 0);
      p.castShadow = true;
      this.root.add(p);
    }
    this.ringMat = glow(0x6a6480);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.13, 8, 36), this.ringMat);
    ring.position.y = 1.9;
    this.root.add(ring);
    this.coreMat = new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.core = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), this.coreMat);
    this.core.position.y = 1.9;
    this.root.add(this.core);
    const iconGeo = kind === 'superflame' ? new THREE.ConeGeometry(0.28, 0.7, 6)
      : kind === 'supercharge' ? new THREE.TetrahedronGeometry(0.36) : new THREE.OctahedronGeometry(0.34);
    this.icon = new THREE.Mesh(iconGeo, glow(POWERS[kind].color));
    this.icon.position.y = 4.1;
    this.root.add(this.icon);
    this.root.position.set(x, y, z);
    this.root.rotation.y = yaw;
    game.level!.root.add(this.root);
  }

  private claimGuards(): void {
    // Whoever was posted near the shrine when the realm was built.
    this.guards = this.game.enemies.filter((e) => e.alive && Math.hypot(e.homeX - this.x, e.homeZ - this.z) < this.guardRadius);
  }

  private wake(quiet = false): void {
    const g = this.game;
    this.state = 'ready';
    this.coreMat.opacity = 0.35;
    if (quiet) return;
    g.fx.ring(this.x, this.y + 0.3, this.z, 0.5, 6, POWERS[this.kind].color, 0.7);
    g.fx.motes(this.x, this.y + 2, this.z, POWERS[this.kind].color, 24);
    g.sfx('unlock', this.x, this.y, this.z, 1.2, 0.8);
    const p = g.player;
    if (Math.hypot(p.x - this.x, p.z - this.z) < 40) g.hud.flick(`The ${POWERS[this.kind].name} shrine is awake! Run through the ring!`, 5);
  }

  update(dt: number): void {
    const g = this.game;
    this.t += dt;
    if (!this.guards) {
      this.claimGuards();
      if (this.guards!.length === 0) this.wake(true);
    }
    const cam = g.camera.position;
    this.root.visible = (cam.x - this.x) ** 2 + (cam.z - this.z) ** 2 < 110 * 110;
    if (!this.root.visible) return;
    this.icon.rotation.y += dt * 1.6;
    this.icon.position.y = 4.1 + Math.sin(this.t * 2) * 0.15;
    if (this.state === 'locked') {
      this.ringMat.color.setHex(0x6a6480);
      if (this.guards!.every((e) => !e.alive)) this.wake();
      else if (Math.floor(this.t * 4) !== Math.floor((this.t - dt) * 4)) g.fx.motes(this.x, this.y + 1.9, this.z, 0x6a3a9a, 2);
      return;
    }
    if (this.state === 'spent') {
      this.spentT -= dt;
      this.ringMat.color.copy(this.color).multiplyScalar(0.25 + 0.2 * (1 - this.spentT / 20));
      this.coreMat.opacity = 0;
      if (this.spentT <= 0) this.wake(true);
      return;
    }
    // Ready: the ring blazes and the portal swirls.
    const pulse = 0.75 + 0.25 * Math.sin(this.t * 4);
    this.ringMat.color.copy(this.color).multiplyScalar(1.1 * pulse + 0.3);
    this.coreMat.opacity = 0.25 + 0.15 * pulse;
    this.core.rotation.z += dt * 2;
    if (Math.floor(this.t * 8) !== Math.floor((this.t - dt) * 8)) {
      const a = this.t * 3;
      g.fx.emit(this.x + Math.cos(this.yaw) * Math.cos(a) * 1.5, this.y + 1.9 + Math.sin(a) * 1.5, this.z - Math.sin(this.yaw) * Math.cos(a) * 1.5, {
        count: 1, speed: 0.5, life: [0.5, 0.9], size: [0.15, 0.25], sizeEnd: 0, color: POWERS[this.kind].color, bright: 2.2, gravity: -0.4,
      });
    }
    const p = g.player;
    if (!p.alive || p.hidden) return;
    const dx = p.x - this.x;
    const dz = p.z - this.z;
    if (Math.hypot(dx, dz) < 1.5 && p.y > this.y - 0.5 && p.y < this.y + 3.4) {
      this.state = 'spent';
      this.spentT = 20;
      p.grantPower(this.kind);
      g.fx.ring(this.x, this.y + 1.9, this.z, 0.4, 3.5, POWERS[this.kind].color, 0.5);
      g.fx.motes(p.x, p.y + 0.8, p.z, POWERS[this.kind].color, 30);
    }
  }
}

const runeGeo = (() => {
  // A chevron: two slanted bars meeting at the front.
  const shape = new THREE.Shape();
  shape.moveTo(-0.9, -0.5);
  shape.lineTo(0, 0.45);
  shape.lineTo(0.9, -0.5);
  shape.lineTo(0.9, -0.05);
  shape.lineTo(0, 0.9);
  shape.lineTo(-0.9, -0.05);
  shape.closePath();
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(-Math.PI / 2);
  // Point the chevron along +Z.
  g.scale(1, 1, -1);
  return g;
})();

/**
 * A lane of speed runes: charge over them without stopping and the dragon
 * supercharges, fast enough to smash iron. Lit chevrons race along the lane
 * to show the way.
 */
export class SpeedLane implements Prop {
  private runes: { m: THREE.Mesh; mat: THREE.MeshBasicMaterial; x: number; y: number; z: number; flash: number }[] = [];
  private t = 0;
  private hinted = false;
  readonly cx: number;
  readonly cz: number;
  /** Runes lit during the current charge, for a lane with a Skill Point. */
  private run = -1;
  private lit = new Set<number>();

  constructor(private game: Game, pts: { x: number; y: number; z: number; yaw?: number }[], yaw: number, private skill: string | null = null) {
    for (const p of pts) {
      const mt = new THREE.MeshBasicMaterial({ color: 0xff9a40, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const m = new THREE.Mesh(runeGeo, mt);
      m.position.set(p.x, p.y + 0.06, p.z);
      m.rotation.y = p.yaw ?? yaw;
      m.renderOrder = 2;
      game.level!.root.add(m);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.08, 8), mat(0x5a5060, { rough: 0.8, flat: true }));
      base.position.set(p.x, p.y + 0.02, p.z);
      base.receiveShadow = true;
      // Merged with the level's other static scenery at the end of the build.
      base.userData.static = true;
      game.level!.root.add(base);
      this.runes.push({ m, mat: mt, x: p.x, y: p.y, z: p.z, flash: 0 });
    }
    this.cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
    this.cz = pts.reduce((a, p) => a + p.z, 0) / pts.length;
  }

  update(dt: number): void {
    const g = this.game;
    this.t += dt;
    const cam = g.camera.position;
    const vis = (cam.x - this.cx) ** 2 + (cam.z - this.cz) ** 2 < 100 * 100;
    const p = g.player;
    this.runes.forEach((r, i) => {
      r.m.visible = vis;
      if (!vis) return;
      // A wave of light runs down the lane.
      const wave = 0.5 + 0.5 * Math.sin(this.t * 6 - i * 0.9);
      r.flash = Math.max(0, r.flash - dt * 2);
      r.mat.color.setHex(0xff9a40).multiplyScalar(0.45 + wave * 0.6 + r.flash * 1.5);
      if (!p.alive) return;
      if (Math.hypot(p.x - r.x, p.z - r.z) > 1.5 || Math.abs(p.y - r.y) > 1.4) return;
      if (p.state === 'charge') {
        if (r.flash <= 0.2) {
          g.fx.ring(r.x, r.y + 0.1, r.z, 0.4, 2.4, 0xffa040, 0.35);
          g.sfx('launch', r.x, r.y, r.z, 1.2 + Math.min(0.8, p.superT * 0.2), 0.5);
        }
        r.flash = 1;
        p.boostCharge();
        if (this.skill) {
          if (this.run !== p.chargeId) {
            this.run = p.chargeId;
            this.lit.clear();
          }
          this.lit.add(i);
          if (this.lit.size === this.runes.length) g.skill(this.skill);
        }
      } else if (!this.hinted && p.body.grounded) {
        this.hinted = true;
        g.hud.flick('Speed runes! Charge over them without stopping and you\'ll go faster and faster!', 5);
      }
    });
  }
}
