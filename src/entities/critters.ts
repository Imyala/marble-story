import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Sfx } from '../core/audio';
import type { Hit, HitResult, Hittable } from '../game/types';
import type { Prop } from './props';
import { mat, glow } from '../render/materials';
import { mergeStatic } from '../render/shapes';
import { bump } from '../game/feats';

/**
 * Critters: harmless wildlife that wanders each realm and scatters when the
 * dragon comes close. Roast one, ram it or swat it and it vanishes in a puff,
 * leaving a glowing butterfly that Flick gulps down, which mends Aster a
 * little (or, at full health, turns into a few spirit gems).
 */

export type CritterKind = 'sheep' | 'frog' | 'hare' | 'goat' | 'beetle' | 'moth';

/** The wildlife each realm is known for. */
export const REALM_CRITTERS: Record<string, CritterKind[]> = {
  fen: ['frog', 'frog', 'beetle'],
  sanctum: ['sheep'],
  falls: ['goat', 'sheep'],
  frostworks: ['hare'],
  plains: ['sheep', 'beetle', 'hare'],
  keep: ['moth'],
};

const SPEC: Record<CritterKind, { walk: number; run: number; hop: boolean; hover: number; voice: Sfx; pitch: number }> = {
  sheep: { walk: 1.1, run: 4.6, hop: false, hover: 0, voice: 'bleat', pitch: 1 },
  goat: { walk: 1.3, run: 5.4, hop: false, hover: 0, voice: 'bleat', pitch: 1.3 },
  frog: { walk: 1.6, run: 4.2, hop: true, hover: 0, voice: 'croak', pitch: 1 },
  hare: { walk: 1.8, run: 6.2, hop: true, hover: 0, voice: 'squeak', pitch: 1 },
  beetle: { walk: 0.9, run: 3.4, hop: false, hover: 0, voice: 'chirr', pitch: 1 },
  moth: { walk: 1.4, run: 4.4, hop: false, hover: 1.4, voice: 'chirr', pitch: 1.4 },
};

function buildModel(kind: CritterKind): THREE.Group {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  };
  const ball = new THREE.IcosahedronGeometry(0.5, 1);
  const leg = new THREE.CylinderGeometry(0.05, 0.045, 0.3, 5);
  switch (kind) {
    case 'sheep': case 'goat': {
      const wool = mat(kind === 'sheep' ? 0xf4f0e6 : 0xcdb28a, { rough: 1, flat: true });
      const dark = mat(kind === 'sheep' ? 0x2e2836 : 0x5a4432, { rough: 0.8 });
      add(ball, wool, 0, 0.5, 0, 0.62, 0.5, 0.8);
      for (const [x, z] of [[0.2, 0.3], [-0.2, 0.3], [0.1, -0.1], [-0.15, -0.3]] as const) add(ball, wool, x, 0.62, z, 0.3, 0.26, 0.3);
      add(ball, dark, 0, 0.62, 0.52, 0.24, 0.24, 0.3);
      for (const [x, z] of [[0.17, 0.25], [-0.17, 0.25], [0.17, -0.25], [-0.17, -0.25]] as const) add(leg, dark, x, 0.15, z);
      if (kind === 'goat') for (const s of [-1, 1]) add(new THREE.ConeGeometry(0.04, 0.26, 5), mat(0xe8dcc0, { rough: 0.6 }), s * 0.1, 0.86, 0.46);
      break;
    }
    case 'frog': {
      const skin = mat(0x5aa84a, { rough: 0.5, flat: true });
      add(ball, skin, 0, 0.18, 0, 0.36, 0.22, 0.42);
      for (const s of [-1, 1]) {
        add(ball, skin, s * 0.13, 0.33, 0.14, 0.1, 0.1, 0.1);
        add(ball, mat(0x1a1a18, { rough: 0.3 }), s * 0.14, 0.36, 0.2, 0.05, 0.05, 0.04);
        add(ball, skin, s * 0.22, 0.08, -0.1, 0.14, 0.08, 0.24);
      }
      break;
    }
    case 'hare': {
      const fur = mat(0xf2f4f8, { rough: 1, flat: true });
      add(ball, fur, 0, 0.26, 0, 0.3, 0.28, 0.42);
      add(ball, fur, 0, 0.44, 0.24, 0.2, 0.2, 0.22);
      for (const s of [-1, 1]) add(ball, fur, s * 0.06, 0.68, 0.2, 0.05, 0.2, 0.06);
      add(ball, mat(0xffc8d0, { rough: 1 }), 0, 0.42, 0.34, 0.04, 0.04, 0.03);
      break;
    }
    case 'beetle': {
      const shell = mat(0x2e6a5a, { rough: 0.2, metal: 0.4, flat: true, emissive: 0x0a3a30, emissiveIntensity: 0.4 });
      add(ball, shell, 0, 0.14, 0, 0.3, 0.16, 0.38);
      add(ball, mat(0x1a1a20, { rough: 0.5 }), 0, 0.12, 0.3, 0.14, 0.1, 0.12);
      break;
    }
    case 'moth': {
      const body = glow(0xe8d8ff);
      add(ball, body, 0, 0, 0, 0.08, 0.08, 0.2);
      const wing = new THREE.MeshBasicMaterial({ color: 0xc8a8ff, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false });
      for (const s of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.CircleGeometry(0.22, 8), wing);
        w.position.set(s * 0.16, 0, 0);
        w.rotation.x = -Math.PI / 2;
        w.userData.keep = true;
        w.userData.wing = s;
        g.add(w);
      }
      break;
    }
  }
  mergeStatic(g);
  return g;
}

export class Critter implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius = 0.45;
  x: number;
  y: number;
  z: number;
  private yaw = Math.random() * Math.PI * 2;
  private model: THREE.Group;
  private wings: THREE.Object3D[] = [];
  private goal: { x: number; z: number } | null = null;
  private idleT = Math.random() * 3;
  private t = Math.random() * 10;
  private fleeing = 0;
  private callT = 4 + Math.random() * 10;
  private spec: (typeof SPEC)[CritterKind];

  /** Tall enough to cover a moth's hover, so a swing at it connects. */
  get height(): number {
    return 0.8 + this.spec.hover;
  }

  constructor(private game: Game, readonly kind: CritterKind, private homeX: number, private homeZ: number, private range = 6) {
    this.x = homeX;
    this.z = homeZ;
    this.y = game.col.groundAt(homeX, homeZ, 1e4, 0.2).y;
    this.spec = SPEC[kind];
    this.model = buildModel(kind);
    this.model.traverse((o) => { if (o.userData.wing) this.wings.push(o); });
    this.model.position.set(this.x, this.y, this.z);
    game.level!.root.add(this.model);
  }

  private ok(x: number, z: number): number | null {
    const g = this.game;
    const gy = g.col.groundAt(x, z, this.y + 0.8, 0.1).y;
    if (gy < this.y - 0.9 || gy > this.y + 0.6) return null;
    if (g.isDeepWater(x, z, gy) || g.inHazard(x, gy + 0.1, z)) return null;
    if (g.col.raycast(this.x, this.y + 0.35, this.z, x - this.x, 0, z - this.z, 1, true).t < 1) return null;
    return gy;
  }

  takeHit(_hit: Hit): HitResult {
    if (!this.alive) return 'none';
    const g = this.game;
    this.alive = false;
    g.level!.root.remove(this.model);
    g.fx.shadowPoof(this.x, this.y + 0.4, this.z, 0.7);
    g.fx.sparkle(this.x, this.y + 0.5, this.z, 0xfff0c0, 8);
    g.sfx(this.spec.voice, this.x, this.y, this.z, this.spec.pitch * 1.2, 0.9);
    g.sfx('pound', this.x, this.y, this.z, 2, 0.25);
    bump(g.save, 'critters');
    g.checkFeats();
    g.style.bonus(3);
    g.level!.props.push(new Butterfly(g, this.x, this.y + 0.6 + this.spec.hover, this.z));
    return 'hit';
  }

  update(dt: number): void {
    if (!this.alive) return;
    const g = this.game;
    this.t += dt;
    const cam = g.camera.position;
    const far = (this.x - cam.x) ** 2 + (this.z - cam.z) ** 2 > 70 * 70;
    this.model.visible = !far;
    const p = g.player.body;
    const pd = Math.hypot(p.x - this.x, p.z - this.z);
    // A charging dragon bowls them over.
    if (pd < 1.1 && Math.abs(p.y - this.y - this.spec.hover) < 1.5 && (g.player.state === 'charge' || g.player.state === 'dodge')) {
      this.takeHit(null as unknown as Hit);
      return;
    }
    if (far) return;
    let speed = 0;
    if (pd < 5 && g.player.alive) {
      // A startled cry as it bolts.
      if (this.fleeing <= 0 && Math.random() < 0.6) g.sfx(this.spec.voice, this.x, this.y, this.z, this.spec.pitch * 1.1, 0.8);
      this.fleeing = 1.5;
    }
    this.callT -= dt;
    if (this.callT <= 0) {
      this.callT = 6 + Math.random() * 10;
      if (pd < 28) g.sfx(this.spec.voice, this.x, this.y, this.z, this.spec.pitch * (0.9 + Math.random() * 0.2), 0.5);
    }
    if (this.fleeing > 0) {
      this.fleeing -= dt;
      const away = Math.atan2(this.x - p.x, this.z - p.z);
      const home = Math.atan2(this.homeX - this.x, this.homeZ - this.z);
      const hd = Math.hypot(this.homeX - this.x, this.homeZ - this.z);
      const want = hd > this.range * 1.6 ? home : away + Math.sin(this.t * 2) * 0.4;
      this.yaw += Math.atan2(Math.sin(want - this.yaw), Math.cos(want - this.yaw)) * Math.min(1, dt * 8);
      speed = this.spec.run;
    } else {
      this.idleT -= dt;
      if (this.idleT <= 0) {
        this.idleT = 2 + Math.random() * 4;
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * this.range;
        this.goal = Math.random() < 0.6 ? { x: this.homeX + Math.sin(a) * r, z: this.homeZ + Math.cos(a) * r } : null;
      }
      if (this.goal) {
        const dx = this.goal.x - this.x;
        const dz = this.goal.z - this.z;
        if (Math.hypot(dx, dz) < 0.4) this.goal = null;
        else {
          const want = Math.atan2(dx, dz);
          this.yaw += Math.atan2(Math.sin(want - this.yaw), Math.cos(want - this.yaw)) * Math.min(1, dt * 4);
          speed = this.spec.walk;
        }
      }
    }
    // Hoppers move in bounds; others walk.
    const hopPhase = this.spec.hop ? Math.max(0, Math.sin(this.t * 7)) : 0;
    if (this.spec.hop && speed > 0) speed *= hopPhase * 1.8;
    if (speed > 0) {
      const nx = this.x + Math.sin(this.yaw) * speed * dt;
      const nz = this.z + Math.cos(this.yaw) * speed * dt;
      const gy = this.ok(nx, nz);
      if (gy !== null) {
        this.x = nx;
        this.z = nz;
        this.y += (gy - this.y) * Math.min(1, dt * 15);
      } else {
        this.goal = null;
        this.yaw += Math.PI * 0.6;
      }
    }
    const bob = this.spec.hover
      ? this.spec.hover + Math.sin(this.t * 3) * 0.25
      : this.spec.hop ? hopPhase * (speed > 0 ? 0.35 : 0.05) : Math.abs(Math.sin(this.t * 10)) * 0.04 * (speed > 0 ? 1 : 0);
    this.model.position.set(this.x, this.y + bob, this.z);
    this.model.rotation.y = this.yaw;
    for (const w of this.wings) w.rotation.z = Math.sin(this.t * 22) * 0.9 * (w.userData.wing as number);
  }

  dispose(): void {
    this.model.traverse((o) => { if ((o as THREE.Mesh).isMesh && !(o as THREE.Mesh).userData.keep) (o as THREE.Mesh).geometry.dispose(); });
  }
}

const bWing = new THREE.MeshBasicMaterial({ color: 0xffe07a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });

/** A butterfly freed from a critter: flutters up, then Flick snaps it up. */
export class Butterfly implements Prop {
  private root = new THREE.Group();
  private wings: THREE.Mesh[] = [];
  private t = 0;
  private done = false;

  constructor(private game: Game, private x: number, private y: number, private z: number) {
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.16, 8), bWing);
      w.position.x = s * 0.12;
      w.rotation.x = -Math.PI / 2;
      this.root.add(w);
      this.wings.push(w);
    }
    this.root.position.set(x, y, z);
    game.level!.root.add(this.root);
  }

  update(dt: number): void {
    if (this.done) return;
    const g = this.game;
    this.t += dt;
    this.wings.forEach((w, i) => { w.rotation.z = Math.sin(this.t * 26) * 1.1 * (i ? 1 : -1); });
    const f = g.flick.position;
    const d = Math.hypot(f.x - this.x, f.y - this.y, f.z - this.z);
    if (this.t < 0.7) {
      this.y += dt * 1.2;
      this.x += Math.sin(this.t * 9) * dt * 0.8;
    } else {
      // Flick darts in: the butterfly is drawn to him.
      const sp = Math.min(1, dt * (2 + this.t * 3));
      this.x += (f.x - this.x) * sp;
      this.y += (f.y - this.y) * sp;
      this.z += (f.z - this.z) * sp;
    }
    this.root.position.set(this.x, this.y + Math.sin(this.t * 6) * 0.08, this.z);
    if ((this.t > 0.7 && d < 0.6) || this.t > 6) this.eat();
  }

  private eat(): void {
    const g = this.game;
    this.done = true;
    g.level?.root.remove(this.root);
    const p = g.player;
    g.fx.sparkle(this.x, this.y, this.z, 0xffe07a, 10);
    g.audio.play('gemGreen', 1.5, 0.6);
    bump(g.save, 'butterflies');
    if (++g.visit.butterflies >= 5 && g.level?.def.id === 'fen') g.skill('fen:butterflies');
    if (p.hp < p.maxHp) {
      p.heal(Math.round(p.maxHp * 0.15));
    } else {
      g.spawnGems(this.x, this.y, this.z, { blue: 3 }, true);
    }
    g.checkFeats();
  }
}
