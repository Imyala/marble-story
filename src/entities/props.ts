import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Hit, HitResult, Hittable, Element } from '../game/types';
import { makeBox, makeCyl, type Solid } from '../world/collision';
import { mat, matUnique, glow } from '../render/materials';
import { ellipsoid, spike, taperedTube } from '../render/shapes';
import { GEM_COLORS, type GemKind } from './gems';
import { rng } from '../core/rng';
import { ENEMIES } from '../enemies/defs';
import type { Enemy } from '../enemies/enemy';

export interface Prop {
  update(dt: number): void;
  dispose?(): void;
}

export interface Interactable {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly range: number;
  label: string;
  enabled: boolean;
  interact(): void;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------------------
// Gem clusters
// ---------------------------------------------------------------------------

export class GemCluster implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly radius: number;
  readonly height: number;
  private hp: number;
  private mesh = new THREE.Group();
  private wobble = 0;
  private solid: Solid | null = null;

  constructor(
    private game: Game, x: number, y: number, z: number, private kind: GemKind | 'mixed', private value: number, big = false,
  ) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.radius = big ? 0.9 : 0.6;
    this.height = big ? 1.8 : 1.1;
    this.hp = big ? 3 : 1;
    const colors = kind === 'mixed' ? [GEM_COLORS.blue, GEM_COLORS.red, GEM_COLORS.green, GEM_COLORS.purple] : [GEM_COLORS[kind]];
    const base = new THREE.Mesh(new THREE.DodecahedronGeometry(this.radius * 0.7, 0), mat(0x5a5048, { rough: 1, flat: true }));
    base.scale.y = 0.4;
    base.position.y = 0.1;
    base.receiveShadow = true;
    this.mesh.add(base);
    const n = big ? 7 : 5;
    for (let i = 0; i < n; i++) {
      const c = colors[i % colors.length]!;
      const m = mat(c, { rough: 0.15, metal: 0.2, emissive: c, emissiveIntensity: 0.5, flat: true });
      const cr = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), m);
      const a = (i / n) * Math.PI * 2;
      const rr = i === 0 ? 0 : this.radius * 0.45;
      const s = (i === 0 ? 0.32 : 0.2 + rng.next() * 0.1) * (big ? 1.5 : 1);
      cr.scale.set(s, s * 2.4, s);
      cr.position.set(Math.sin(a) * rr, s * 2.2, Math.cos(a) * rr);
      cr.rotation.set(Math.sin(a) * 0.4, rng.next() * 3, Math.cos(a) * 0.4);
      cr.castShadow = true;
      this.mesh.add(cr);
    }
    this.mesh.position.set(x, y, z);
    game.level!.root.add(this.mesh);
    if (big) {
      this.solid = makeCyl(x, z, this.radius * 0.8, y - 0.5, y + 1.2);
      game.col.add(this.solid);
    }
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive) return 'none';
    this.hp -= hit.damage >= 8 || hit.heavy ? 1 : 0.34;
    this.wobble = 0.3;
    const g = this.game;
    g.fx.sparkle(this.x, this.y + this.height * 0.6, this.z, this.kind === 'mixed' ? 0xffffff : GEM_COLORS[this.kind], 6);
    g.sfx('crystalBreak', this.x, this.y, this.z, 1.5, 0.35);
    if (this.hp <= 0) this.shatter();
    return 'hit';
  }

  private shatter(): void {
    this.alive = false;
    const g = this.game;
    const col = this.kind === 'mixed' ? 0xffffff : GEM_COLORS[this.kind];
    g.fx.shatter(this.x, this.y + 0.6, this.z, col);
    g.sfx('crystalBreak', this.x, this.y, this.z);
    if (this.kind === 'mixed') {
      g.spawnGems(this.x, this.y + 0.8, this.z, { blue: this.value, red: 2, green: 2, purple: 1 }, false);
    } else {
      g.spawnGems(this.x, this.y + 0.8, this.z, { [this.kind]: this.value } as Partial<Record<GemKind, number>>, false);
    }
    this.game.level!.root.remove(this.mesh);
    if (this.solid) this.game.col.remove(this.solid);
  }

  update(dt: number): void {
    if (!this.alive) return;
    if (this.wobble > 0) {
      this.wobble -= dt;
      this.mesh.rotation.z = Math.sin(this.wobble * 60) * this.wobble * 0.4;
    }
  }
}

// ---------------------------------------------------------------------------
// Torches (fire puzzles)
// ---------------------------------------------------------------------------

export class Torch implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius = 0.6;
  readonly height = 2.2;
  lit: boolean;
  private flameT = 0;
  private flame: THREE.Mesh;
  private litFor = 0;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, readonly group: string, lit = false, private burnTime = 0) {
    this.lit = lit;
    const root = new THREE.Group();
    const stone = mat(0x8a8272, { rough: 0.9, flat: true });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.5, 6), stone);
    post.position.y = 0.75;
    post.castShadow = true;
    root.add(post);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.25, 0.4, 8), mat(0x5a4a3a, { rough: 0.6, metal: 0.4 }));
    bowl.position.y = 1.7;
    bowl.castShadow = true;
    root.add(bowl);
    this.flame = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), glow(0xffa040, 0.9, true));
    this.flame.position.y = 2.05;
    root.add(this.flame);
    root.position.set(x, y, z);
    game.level!.root.add(root);
    game.col.add(makeCyl(x, z, 0.35, y, y + 1.9));
    this.flame.visible = lit;
  }

  takeHit(hit: Hit): HitResult {
    if (hit.type === 'fire' && !this.lit) {
      this.light();
      return 'hit';
    }
    if (hit.type === 'ice' && this.lit && this.burnTime === 0) return 'none';
    return 'none';
  }

  light(): void {
    this.lit = true;
    this.litFor = 0;
    this.flame.visible = true;
    const g = this.game;
    g.sfx('torch', this.x, this.y, this.z);
    g.fx.explosion(this.x, this.y + 2, this.z, 0.8, 0xffb050);
    g.level!.torchLit(this.group);
  }

  update(dt: number): void {
    if (!this.lit) return;
    this.flameT -= dt;
    this.litFor += dt;
    const s = 1 + Math.sin(this.game.time * 14 + this.x) * 0.15;
    this.flame.scale.set(s, s * 1.3, s);
    if (this.flameT <= 0) {
      this.flameT = 0.06;
      this.game.fx.emit(this.x, this.y + 2.05, this.z, {
        count: 2, speed: 1.2, dir: [0, 1.6, 0], spread: 0.4, life: [0.3, 0.6], size: [0.4, 0.6], sizeEnd: 0.1,
        color: 0xffc060, colorEnd: 0xff3010, bright: 1.8, gravity: -2, jitter: 0.15,
      });
    }
    if (this.burnTime > 0 && this.litFor > this.burnTime && !this.game.level!.groupDone(this.group)) {
      this.lit = false;
      this.flame.visible = false;
      this.game.fx.smoke(this.x, this.y + 2, this.z, 6);
      this.game.level!.torchOut(this.group);
    }
  }
}

// ---------------------------------------------------------------------------
// Gates: doors that open on a signal, or barriers an element removes.
// ---------------------------------------------------------------------------

export type GateKind = 'stone' | 'vines' | 'ice' | 'rock' | 'wood' | 'shadow';

const GATE_NEEDS: Record<GateKind, string> = {
  stone: '',
  vines: 'Thorny vines. Fire would clear them.',
  ice: 'A wall of solid ice. It needs heat.',
  rock: 'Cracked stone. Something heavy and earthen could break it.',
  wood: 'A barricade. Charge through it or smash it.',
  shadow: 'Shadow seals this way.',
};

export class Gate implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius: number;
  readonly height: number;
  private solid: Solid;
  private root = new THREE.Group();
  private opening = -1;
  private hp: number;
  private hintT = 0;
  readonly y: number;

  constructor(
    private game: Game, readonly x: number, y: number, readonly z: number, private w: number, private h: number, yaw: number,
    readonly kind: GateKind, readonly signal: string,
  ) {
    this.y = y;
    this.radius = w * 0.5;
    this.height = h;
    this.hp = kind === 'ice' ? 40 : kind === 'rock' ? 40 : kind === 'wood' ? 24 : 1;
    this.solid = makeBox(x, z, w * 0.5, 0.6, y - 1, y + h, yaw);
    game.col.add(this.solid);
    this.build();
    this.root.position.set(x, y, z);
    this.root.rotation.y = yaw;
    game.level!.root.add(this.root);
    if (signal) game.level!.on(signal, () => this.open());
  }

  private build(): void {
    const { w, h } = this;
    switch (this.kind) {
      case 'stone': {
        const m = mat(0x7a7468, { rough: 0.9, flat: true });
        const d = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.9), m);
        d.position.y = h / 2;
        d.castShadow = d.receiveShadow = true;
        this.root.add(d);
        const rune = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, h) * 0.22, 0.06, 6, 20), glow(0xf5c46b));
        rune.position.set(0, h * 0.55, 0.47);
        this.root.add(rune);
        const rune2 = rune.clone();
        rune2.position.z = -0.47;
        this.root.add(rune2);
        break;
      }
      case 'vines': {
        const m = matUnique(0x3a6a2a, { rough: 0.9 });
        for (let i = 0; i < 14; i++) {
          const x0 = (rng.next() - 0.5) * w;
          const x1 = (rng.next() - 0.5) * w;
          const t = new THREE.Mesh(taperedTube([V(x0, 0, 0), V((x0 + x1) / 2 + rng.signed(), h * 0.5, rng.signed() * 0.2), V(x1, h, 0)], 0.12, 0.06, 10, 5, false), m);
          t.castShadow = true;
          this.root.add(t);
          if (i % 2 === 0) {
            const th = spike(0.06, 0.3, mat(0x6a4a2a), 4);
            th.position.set((x0 + x1) / 2, h * rng.next(), 0.1);
            th.rotation.x = Math.PI / 2;
            this.root.add(th);
          }
        }
        const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(0x1a2a14, { rough: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }));
        back.position.y = h / 2;
        this.root.add(back);
        break;
      }
      case 'ice': {
        const m = matUnique(0xbfefff, { rough: 0.1, metal: 0.1, transparent: true, opacity: 0.75, emissive: 0x3aa0d0, emissiveIntensity: 0.2, flat: true });
        const d = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.1), m);
        d.position.y = h / 2;
        this.root.add(d);
        for (let i = 0; i < 6; i++) {
          const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.6 + rng.next() * 0.5, 0), m);
          c.position.set((rng.next() - 0.5) * w, rng.next() * h, (rng.next() - 0.5) * 0.8);
          c.scale.y = 1.6;
          this.root.add(c);
        }
        break;
      }
      case 'rock': {
        const m = mat(0x6a6050, { rough: 1, flat: true });
        for (let i = 0; i < 9; i++) {
          const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7 + rng.next() * 0.4, 0), m);
          r.position.set(((i % 3) - 1) * w * 0.33, 0.6 + Math.floor(i / 3) * h * 0.33, 0);
          r.castShadow = true;
          this.root.add(r);
        }
        for (let i = 0; i < 4; i++) {
          const c = new THREE.Mesh(new THREE.BoxGeometry(0.08, h * 0.35, 0.05), glow(0x9be06a));
          c.position.set((i - 1.5) * w * 0.22, h * (0.3 + (i % 2) * 0.3), 0.72);
          c.rotation.z = (i - 1.5) * 0.5;
          this.root.add(c);
        }
        break;
      }
      case 'wood': {
        const m = mat(0x7a5a3a, { rough: 0.95 });
        for (let i = 0; i < 5; i++) {
          const p = new THREE.Mesh(new THREE.BoxGeometry(0.35, h, 0.3), m);
          p.position.set((i - 2) * (w / 5), h / 2, 0);
          p.rotation.z = rng.signed() * 0.05;
          p.castShadow = true;
          this.root.add(p);
        }
        for (const yy of [h * 0.3, h * 0.75]) {
          const c = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, 0.2), m);
          c.position.set(0, yy, 0.25);
          c.rotation.z = 0.15;
          this.root.add(c);
        }
        break;
      }
      case 'shadow': {
        const m = new THREE.MeshBasicMaterial({ color: 0x9040ff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
        const d = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
        d.position.y = h / 2;
        this.root.add(d);
        break;
      }
    }
  }

  takeHit(hit: Hit): HitResult {
    if (!this.alive || this.opening >= 0) return 'none';
    const g = this.game;
    let dmg = 0;
    if (this.kind === 'vines' && hit.type === 'fire') dmg = 999;
    if (this.kind === 'ice' && hit.type === 'fire') dmg = hit.damage;
    if (this.kind === 'rock' && (hit.type === 'earth' && (hit.heavy || hit.source === 'burst'))) dmg = hit.damage;
    if (this.kind === 'wood' && (hit.heavy || hit.source === 'charge' || hit.type === 'fire' || hit.type === 'earth')) dmg = Math.max(hit.damage, 8);
    if (dmg <= 0) {
      if (this.kind !== 'stone' && this.kind !== 'shadow') {
        this.hintT -= 1;
        if (this.hintT <= 0) {
          this.hintT = 6;
          g.toast(GATE_NEEDS[this.kind], 'hint');
        }
      }
      return this.kind === 'stone' || this.kind === 'shadow' ? 'none' : 'immune';
    }
    this.hp -= dmg;
    if (this.kind === 'ice') g.fx.emit(this.x, this.y + this.h * 0.5, this.z, { count: 4, speed: 2, dir: [0, 1, 0], life: [0.5, 0.9], size: [0.5, 0.8], sizeEnd: 2, color: 0xf0f8ff, alpha: 0.5, additive: false });
    if (this.hp <= 0) {
      if (this.kind === 'vines') {
        g.fx.explosion(this.x, this.y + this.h * 0.4, this.z, 1.5, 0xff8a30);
        g.sfx('fireBurst', this.x, this.y, this.z);
      } else if (this.kind === 'ice') {
        g.fx.shatter(this.x, this.y + this.h * 0.5, this.z);
        g.sfx('shatter', this.x, this.y, this.z);
      } else {
        g.fx.rocks(this.x, this.y + this.h * 0.5, this.z, 20, this.kind === 'wood' ? 0x7a5a3a : 0x6a6050);
        g.sfx('rumble', this.x, this.y, this.z);
        g.shake(0.3, 0.3);
      }
      this.break();
    }
    return 'hit';
  }

  private break(): void {
    this.alive = false;
    this.solid.enabled = false;
    this.game.level!.root.remove(this.root);
    if (this.signal) this.game.level!.emit(`broken:${this.signal}`);
  }

  open(): void {
    if (this.shutting >= 0) {
      // Reopening mid-close: carry on from where the door is.
      this.opening = (1 - Math.min(1, this.shutting)) * 1.4;
      this.shutting = -1;
      this.game.sfx('door', this.x, this.y, this.z);
      return;
    }
    if (this.opening >= 0 || !this.alive) return;
    this.opening = 0;
    this.game.sfx('door', this.x, this.y, this.z);
    this.game.shake(0.15, 0.8);
  }

  close(): void {
    this.opening = -1;
    this.shutting = -1;
    this.alive = true;
    this.solid.enabled = true;
    this.root.position.y = this.y;
    this.root.visible = true;
  }

  private shutting = -1;

  /** Slides back up (a held gate whose weight came off). */
  shut(): void {
    if (this.opening < 0 && this.alive) return;
    const k = this.opening < 0 ? 1 : Math.min(1, this.opening / 1.4);
    this.opening = -1;
    this.alive = true;
    this.root.visible = true;
    this.shutting = 1 - k;
    this.game.sfx('door', this.x, this.y, this.z, 0.8);
  }

  update(dt: number): void {
    if (this.shutting >= 0) {
      this.shutting += dt / 0.9;
      const k = Math.min(1, this.shutting);
      this.root.position.y = this.y - (1 - k) * (this.h + 0.2);
      if (k > 0.5) this.solid.enabled = true;
      if (k >= 1) {
        this.shutting = -1;
        this.game.shake(0.12, 0.3);
      }
      return;
    }
    if (this.opening >= 0 && this.alive) {
      this.opening += dt;
      const k = Math.min(1, this.opening / 1.4);
      this.root.position.y = this.y - k * (this.h + 0.2);
      if (this.opening % 0.1 < dt) this.game.fx.dust(this.x, this.y, this.z, 3);
      if (k >= 1) {
        this.solid.enabled = false;
        this.alive = false;
        this.root.visible = false;
      }
    }
    if (this.kind === 'shadow') this.root.children.forEach((c) => (c.rotation.y = Math.sin(this.game.time) * 0.02));
  }
}

// ---------------------------------------------------------------------------
// Switches: lightning crystals and strike switches.
// ---------------------------------------------------------------------------

export class Switch implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius = 0.7;
  readonly height = 2;
  on = false;
  private crystal: THREE.Mesh;
  private cm: THREE.MeshStandardMaterial;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, readonly kind: Element | 'strike', readonly signal: string) {
    const root = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.6, 8), mat(0x5a5664, { rough: 0.9, flat: true }));
    base.position.y = 0.3;
    base.castShadow = true;
    root.add(base);
    const off = kind === 'lightning' ? 0x2a3a5a : kind === 'fire' ? 0x5a2a1a : 0x4a4a3a;
    this.cm = matUnique(off, { rough: 0.2, metal: 0.2, flat: true });
    this.crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), this.cm);
    this.crystal.scale.y = 1.8;
    this.crystal.position.y = 1.5;
    this.crystal.castShadow = true;
    root.add(this.crystal);
    root.position.set(x, y, z);
    game.level!.root.add(root);
    game.col.add(makeCyl(x, z, 0.6, y, y + 0.6));
  }

  takeHit(hit: Hit): HitResult {
    if (this.on) return 'none';
    const ok = this.kind === 'strike' ? hit.source === 'melee' || hit.source === 'charge' : hit.type === this.kind;
    if (!ok) {
      if (this.kind === 'lightning') this.game.toast('The crystal is dark. It wants a spark.', 'hint');
      return 'none';
    }
    this.on = true;
    const col = this.kind === 'lightning' ? 0xa8e6ff : this.kind === 'fire' ? 0xff8a30 : 0xf5c46b;
    this.cm.color.setHex(col);
    this.cm.emissive.setHex(col);
    this.cm.emissiveIntensity = 0.9;
    this.game.sfx('switch', this.x, this.y, this.z);
    this.game.fx.ring(this.x, this.y + 0.2, this.z, 0.3, 3, col, 0.5);
    this.game.level!.emit(this.signal);
    return 'hit';
  }

  update(dt: number): void {
    this.crystal.rotation.y += dt * (this.on ? 2 : 0.3);
    if (this.on && this.kind === 'lightning' && rng.chance(0.08)) {
      const a = V(this.x, this.y + 1.5, this.z);
      const b = V(this.x + rng.signed(), this.y + 1 + rng.next(), this.z + rng.signed());
      this.game.fx.arc(a, b, 0xbfe8ff, 0.04, 0.08, 0.5);
    }
  }
}

export class PressurePlate implements Prop {
  pressed = false;
  private top: THREE.Mesh;
  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, readonly signal: string) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.2, 12), mat(0x6a6458, { rough: 0.9 }));
    base.position.set(x, y + 0.1, z);
    base.receiveShadow = true;
    game.level!.root.add(base);
    this.top = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.25, 12), matUnique(0xa89868, { rough: 0.6, emissive: 0xf5c46b, emissiveIntensity: 0.15 }));
    this.top.position.set(x, y + 0.25, z);
    game.level!.root.add(this.top);
    game.level!.onSlam((sx, sy, sz) => {
      if (this.pressed) return;
      if (Math.hypot(sx - x, sz - z) < 1.6 && Math.abs(sy - y) < 1) this.press();
    });
  }
  press(): void {
    this.pressed = true;
    this.top.position.y = this.y + 0.08;
    (this.top.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.9;
    this.game.sfx('switch', this.x, this.y, this.z, 0.7);
    this.game.level!.emit(this.signal);
  }
  update(): void {
    /* static */
  }
}

// ---------------------------------------------------------------------------
// Platforms
// ---------------------------------------------------------------------------

export class MovingPlatform implements Prop {
  readonly solid: Solid;
  private mesh: THREE.Mesh;
  private t = 0;
  private active: boolean;
  private seg = 0;

  constructor(
    game: Game, private pts: THREE.Vector3[], w: number, d: number, private speed: number, color: number,
    private spin = 0, signal = '', private pause = 0.6,
  ) {
    const p0 = pts[0]!;
    this.solid = makeBox(p0.x, p0.z, w / 2, d / 2, p0.y - 0.5, p0.y);
    this.solid.dynamic = true;
    this.solid.surface = 'stone';
    game.col.add(this.solid);
    const m = mat(color, { rough: 0.85, flat: true });
    const g = new THREE.BoxGeometry(w, 0.5, d);
    this.mesh = new THREE.Mesh(g, m);
    this.mesh.castShadow = this.mesh.receiveShadow = true;
    const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.1, d + 0.1), glow(0xf5c46b, 0.8));
    trim.position.y = -0.2;
    this.mesh.add(trim);
    this.mesh.position.set(p0.x, p0.y - 0.25, p0.z);
    game.level!.root.add(this.mesh);
    this.active = !signal;
    if (signal) game.level!.on(signal, () => (this.active = true));
  }

  update(dt: number): void {
    const s = this.solid;
    const ox = s.x;
    const oy = s.y1;
    const oz = s.z;
    const oyaw = s.yaw;
    s.dx = s.dy = s.dz = s.dyaw = 0;
    if (!this.active) return;
    if (this.pts.length > 1) {
      const a = this.pts[this.seg]!;
      const b = this.pts[(this.seg + 1) % this.pts.length]!;
      const len = a.distanceTo(b);
      const travel = len / this.speed;
      this.t += dt;
      let k = Math.min(1, this.t / travel);
      k = k * k * (3 - 2 * k);
      const x = a.x + (b.x - a.x) * k;
      const y = a.y + (b.y - a.y) * k;
      const z = a.z + (b.z - a.z) * k;
      if (this.t >= travel + this.pause) {
        this.t = 0;
        this.seg = (this.seg + 1) % this.pts.length;
      }
      s.x = x;
      s.z = z;
      s.y1 = y;
      s.y0 = y - 0.5;
    }
    if (this.spin) s.setYaw(s.yaw + this.spin * dt);
    s.dx = s.x - ox;
    s.dy = s.y1 - oy;
    s.dz = s.z - oz;
    s.dyaw = s.yaw - oyaw;
    if (dt > 0) {
      s.pvx = s.dx / dt;
      s.pvy = s.dy / dt;
      s.pvz = s.dz / dt;
    }
    this.mesh.position.set(s.x, s.y1 - 0.25, s.z);
    this.mesh.rotation.y = s.yaw;
  }
}

export class CrumblePlatform implements Prop {
  private solid: Solid;
  private mesh: THREE.Mesh;
  private timer = -1;
  private down = 0;

  constructor(private game: Game, private x: number, private y: number, private z: number, w: number, d: number) {
    this.solid = makeBox(x, z, w / 2, d / 2, y - 0.6, y);
    this.solid.unsafe = true;
    game.col.add(this.solid);
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, d), matUnique(0x9a8a6a, { rough: 1, flat: true }));
    this.mesh.position.set(x, y - 0.3, z);
    this.mesh.castShadow = this.mesh.receiveShadow = true;
    game.level!.root.add(this.mesh);
    this.solid.onStand = () => {
      if (this.timer < 0 && this.down <= 0) this.timer = 0;
    };
  }

  update(dt: number): void {
    if (this.timer >= 0) {
      this.timer += dt;
      this.mesh.position.x = this.x + Math.sin(this.timer * 60) * 0.05;
      if (this.timer > 0.7) {
        this.timer = -1;
        this.down = 4;
        this.solid.enabled = false;
        this.game.fx.rocks(this.x, this.y, this.z, 10, 0x9a8a6a);
        this.game.sfx('rumble', this.x, this.y, this.z, 1.4, 0.5);
      }
    }
    if (this.down > 0) {
      this.down -= dt;
      this.mesh.position.y -= dt * 8;
      if (this.down <= 0) {
        this.solid.enabled = true;
        this.mesh.position.set(this.x, this.y - 0.3, this.z);
        this.game.fx.sparkle(this.x, this.y, this.z, 0xf5c46b, 8);
      }
    }
    this.mesh.visible = this.down <= 0 || this.down > 3;
  }
}

export class Updraft implements Prop {
  private fxT = 0;
  constructor(private game: Game, readonly x: number, readonly y0: number, readonly z: number, readonly r: number, readonly y1: number, readonly strength = 34) {}
  contains(x: number, y: number, z: number): boolean {
    return y > this.y0 - 1 && y < this.y1 && Math.hypot(x - this.x, z - this.z) < this.r;
  }
  update(dt: number): void {
    this.fxT -= dt;
    if (this.fxT <= 0) {
      this.fxT = 0.05;
      const a = rng.next() * Math.PI * 2;
      const rr = rng.next() * this.r;
      this.game.fx.emit(this.x + Math.sin(a) * rr, this.y0, this.z + Math.cos(a) * rr, {
        count: 1, speed: 9, dir: [0, 1, 0], spread: 0.05, life: [(this.y1 - this.y0) / 10, (this.y1 - this.y0) / 8], size: [0.1, 0.18],
        sizeEnd: 0.5, color: 0xe8f4ff, alpha: 0.7, additive: true, bright: 0.8, drag: 0,
      });
    }
  }
}

export class BounceShroom implements Prop {
  private cap: THREE.Group;
  private squash = 0;
  constructor(game: Game, readonly x: number, readonly y: number, readonly z: number, private power = 18, color = 0xff5a9a) {
    this.cap = new THREE.Group();
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.2, 8), mat(0xe8dcc0));
    stalk.position.y = 0.6;
    stalk.castShadow = true;
    const capM = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(color, { rough: 0.5, emissive: color, emissiveIntensity: 0.35 }));
    capM.scale.y = 0.55;
    capM.castShadow = true;
    this.cap.add(capM);
    this.cap.position.y = 1.2;
    const root = new THREE.Group();
    root.add(stalk, this.cap);
    for (let i = 0; i < 6; i++) {
      const d = ellipsoid(0.16, 0.08, 0.16, mat(0xfff4dc, { emissive: 0xfff0c0, emissiveIntensity: 0.4 }), 6);
      const a = (i / 6) * Math.PI * 2;
      d.position.set(Math.sin(a) * 0.8, 0.55, Math.cos(a) * 0.8);
      this.cap.add(d);
    }
    root.position.set(x, y, z);
    game.level!.root.add(root);
    const s = makeCyl(x, z, 1.3, y, y + 1.9);
    s.surface = 'mud';
    s.onStand = (who) => {
      if (who === game.player.body) {
        game.player.body.vy = this.power;
        game.player.body.grounded = false;
        this.squash = 1;
        game.sfx('jump', x, y, z, 0.6);
        game.audio.play('gemPurple', 0.6, 0.6);
        game.fx.sparkle(x, y + 2, z, color, 10);
      }
    };
    game.col.add(s);
  }
  update(dt: number): void {
    this.squash = Math.max(0, this.squash - dt * 3);
    const k = Math.sin(this.squash * Math.PI * 3) * this.squash * 0.35;
    this.cap.scale.set(1 + k, 1 - k, 1 + k);
  }
}

// ---------------------------------------------------------------------------
// Wardstones (checkpoints and the upgrade shop)
// ---------------------------------------------------------------------------

export class Wardstone implements Prop, Interactable {
  readonly range = 3.2;
  label = 'Commune with the Wardstone';
  enabled = true;
  active = false;
  private rune: THREE.Mesh;
  private runeMat: THREE.MeshBasicMaterial;
  private orb: THREE.Mesh;

  constructor(private game: Game, readonly id: string, readonly x: number, readonly y: number, readonly z: number, readonly yaw: number) {
    const root = new THREE.Group();
    const stone = mat(0x6e6a78, { rough: 0.9, flat: true });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.4, 8), stone);
    base.position.y = 0.2;
    base.receiveShadow = true;
    root.add(base);
    const ob = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 2.6, 5), stone);
    ob.position.y = 1.7;
    ob.castShadow = true;
    root.add(ob);
    this.runeMat = new THREE.MeshBasicMaterial({ color: 0x6a5a8a });
    this.rune = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 6, 16), this.runeMat);
    this.rune.position.set(0, 2.1, 0.47);
    root.add(this.rune);
    this.orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), glow(0xc9a2ff, 0.9, true));
    this.orb.position.y = 3.4;
    this.orb.visible = false;
    root.add(this.orb);
    root.position.set(x, y, z);
    root.rotation.y = yaw;
    game.level!.root.add(root);
    game.col.add(makeCyl(x, z, 0.55, y, y + 3));
    if (game.save.checkpoint === id && game.save.level === game.level!.def.id) this.setActive(false);
  }

  setActive(announce: boolean): void {
    this.active = true;
    this.runeMat.color.setHex(0xf5c46b);
    this.orb.visible = true;
    if (announce) {
      const g = this.game;
      g.sfx('checkpoint', this.x, this.y, this.z);
      g.fx.ring(this.x, this.y + 0.2, this.z, 0.5, 5, 0xc9a2ff, 0.7);
      g.fx.motes(this.x, this.y + 2, this.z, 0xc9a2ff, 20);
      g.toast('Wardstone awakened. Progress saved.', 'good');
    }
  }

  interact(): void {
    this.game.openWardstone(this);
  }

  update(dt: number): void {
    const g = this.game;
    const p = g.player.body;
    const d = Math.hypot(p.x - this.x, p.z - this.z);
    if (d < 3.5 && Math.abs(p.y - this.y) < 3 && g.player.alive) {
      if (g.save.checkpoint !== this.id || g.save.level !== g.level!.def.id) {
        this.setActive(true);
        g.activateCheckpoint(this);
      }
    }
    this.orb.rotation.y += dt * 1.5;
    this.orb.position.y = 3.4 + Math.sin(g.time * 2) * 0.12;
  }
}

// ---------------------------------------------------------------------------
// Collectibles
// ---------------------------------------------------------------------------

export type CollectKind = 'heart' | 'mana' | 'relic';

export class Collectible implements Prop {
  private root = new THREE.Group();
  taken = false;
  constructor(private game: Game, readonly id: string, readonly kind: CollectKind, readonly x: number, readonly y: number, readonly z: number, readonly relicId = '') {
    if (kind === 'relic') {
      const tab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.12), mat(0xd8b060, { rough: 0.4, metal: 0.6, emissive: 0x8a6020, emissiveIntensity: 0.4 }));
      this.root.add(tab);
      const rune = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 14), glow(0xfff0b0));
      rune.position.z = 0.07;
      this.root.add(rune);
    } else {
      const c = kind === 'heart' ? 0xff4a5a : 0x4ae07a;
      const m = mat(c, { rough: 0.15, metal: 0.3, emissive: c, emissiveIntensity: 0.8, flat: true });
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), m);
      shard.scale.set(0.6, 1.3, 0.6);
      this.root.add(shard);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.03, 6, 20), glow(c, 0.7, true));
      ring.rotation.x = Math.PI / 2;
      this.root.add(ring);
    }
    this.root.position.set(x, y + 1.2, z);
    game.level!.root.add(this.root);
  }

  update(dt: number): void {
    if (this.taken) return;
    const g = this.game;
    this.root.rotation.y += dt * 1.8;
    this.root.position.y = this.y + 1.2 + Math.sin(g.time * 2.5 + this.x) * 0.15;
    if (rng.chance(0.15)) g.fx.sparkle(this.x, this.y + 1.2, this.z, this.kind === 'heart' ? 0xff8a9a : this.kind === 'mana' ? 0x8af0aa : 0xfff0b0, 1);
    const p = g.player.body;
    if (Math.hypot(p.x - this.x, p.y + 0.6 - (this.y + 1.2), p.z - this.z) < 1.5) {
      this.taken = true;
      g.level!.root.remove(this.root);
      g.collect(this);
    }
  }
}

// ---------------------------------------------------------------------------
// Hazards and triggers
// ---------------------------------------------------------------------------

export class Hazard implements Prop {
  private cd = 0;
  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, readonly hx: number, readonly hz: number,
    readonly h: number, readonly damage: number, readonly kind: 'thorns' | 'shadow' | 'lava' | 'spikes') {
    const root = new THREE.Group();
    if (kind === 'thorns' || kind === 'spikes') {
      const m = mat(kind === 'thorns' ? 0x4a3a28 : 0x8a8a98, { rough: 0.8, metal: kind === 'spikes' ? 0.6 : 0 });
      const n = Math.round(hx * hz * 3);
      for (let i = 0; i < n; i++) {
        const s = spike(0.08, 0.5 + rng.next() * 0.5, m, 4);
        s.position.set((rng.next() - 0.5) * hx * 2, 0, (rng.next() - 0.5) * hz * 2);
        s.rotation.set(rng.signed() * 0.5, 0, rng.signed() * 0.5);
        root.add(s);
      }
      if (kind === 'thorns') {
        const bush = new THREE.Mesh(new THREE.BoxGeometry(hx * 2, 0.3, hz * 2), mat(0x2a3a1a, { rough: 1 }));
        bush.position.y = 0.1;
        root.add(bush);
      }
    } else {
      const col = kind === 'lava' ? 0xff5a10 : 0x6a20c0;
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), glow(col, 0.85));
      pool.rotation.x = -Math.PI / 2;
      pool.position.y = 0.05;
      root.add(pool);
    }
    root.position.set(x, y, z);
    game.level!.root.add(root);
  }

  contains(px: number, py: number, pz: number): boolean {
    return Math.abs(px - this.x) < this.hx && Math.abs(pz - this.z) < this.hz && py < this.y + this.h && py > this.y - 0.5;
  }

  update(dt: number): void {
    this.cd -= dt;
    const g = this.game;
    const p = g.player;
    if (this.kind === 'shadow' || this.kind === 'lava') {
      if (rng.chance(0.3)) g.fx.emit(this.x + (rng.next() - 0.5) * this.hx * 2, this.y + 0.1, this.z + (rng.next() - 0.5) * this.hz * 2, {
        count: 1, speed: 1, dir: [0, 1, 0], life: [0.6, 1.2], size: [0.3, 0.5], color: this.kind === 'lava' ? 0xff8a30 : 0xa050ff, bright: 1.5, gravity: -1,
      });
    }
    if (this.cd <= 0 && p.alive && this.contains(p.x, p.y, p.z)) {
      this.cd = 0.6;
      p.takeHit({
        damage: this.damage, type: this.kind === 'lava' ? 'fire' : this.kind === 'shadow' ? 'shadow' : 'physical', dirX: 0, dirZ: 0, knockback: 2, launch: 9,
        stagger: 0, hitstop: 0, buildup: 0, heavy: false, spike: false, source: 'env', move: 'hazard', fromPlayer: false, ox: this.x, oz: this.z,
      }, null);
    }
  }
}

export class Trigger implements Prop {
  fired = false;
  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, readonly r: number,
    private fn: () => void, readonly once = true, readonly h = 6) {}
  update(): void {
    if (this.fired && this.once) return;
    const p = this.game.player.body;
    if (Math.hypot(p.x - this.x, p.z - this.z) < this.r && Math.abs(p.y - this.y) < this.h && this.game.player.alive) {
      if (!this.fired || !this.once) {
        this.fired = true;
        this.fn();
      }
    } else if (!this.once) this.fired = false;
  }
}

// ---------------------------------------------------------------------------
// Arenas: locked-in fights in waves.
// ---------------------------------------------------------------------------

export interface SpawnSpec {
  type: string;
  x: number;
  z: number;
  delay?: number;
}

/** A glowing ring wall that seals a fight in. */
export class Barrier {
  private mesh: THREE.Mesh;
  private matR: THREE.MeshBasicMaterial;
  private walls: Solid[] = [];
  on = false;
  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, readonly r: number, color = 0xa050ff) {
    this.matR = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
    this.mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 7, 48, 1, true), this.matR);
    this.mesh.position.set(x, y + 2.5, z);
    this.mesh.visible = false;
    game.level!.root.add(this.mesh);
    const n = Math.max(16, Math.round(r * 2.4));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const seg = (2 * Math.PI * r) / n;
      const s = makeBox(x + Math.sin(a) * (r + 0.4), z + Math.cos(a) * (r + 0.4), seg * 0.6, 0.4, y - 3, y + 14, a);
      s.wallOnly = true;
      s.enabled = false;
      game.col.add(s);
      this.walls.push(s);
    }
  }
  set(on: boolean): void {
    this.on = on;
    for (const w of this.walls) w.enabled = on;
    this.mesh.visible = on;
  }
  update(dt: number): void {
    if (!this.on) return;
    this.matR.opacity = 0.18 + Math.sin(this.game.time * 3) * 0.06;
    this.mesh.rotation.y += dt * 0.2;
  }
}

export class Arena implements Prop {
  state: 'idle' | 'active' | 'cleared' = 'idle';
  private wave = -1;
  private alive: Enemy[] = [];
  private waveGap = 0;
  private barrier: THREE.Mesh;
  private barrierMat: THREE.MeshBasicMaterial;
  private walls: Solid[] = [];
  onClear: (() => void) | null = null;
  onStart: (() => void) | null = null;

  constructor(private game: Game, readonly id: string, readonly x: number, readonly y: number, readonly z: number, readonly r: number,
    readonly waves: SpawnSpec[][], readonly reward = 40, readonly music = true) {
    this.barrierMat = new THREE.MeshBasicMaterial({
      color: 0xa050ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    });
    this.barrier = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 7, 48, 1, true), this.barrierMat);
    this.barrier.position.set(x, y + 3.5 - 1, z);
    this.barrier.visible = false;
    game.level!.root.add(this.barrier);
    const n = Math.max(16, Math.round(r * 2.4));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const seg = (2 * Math.PI * r) / n;
      const s = makeBox(x + Math.sin(a) * (r + 0.4), z + Math.cos(a) * (r + 0.4), seg * 0.6, 0.4, y - 3, y + 12, a);
      s.wallOnly = true;
      s.enabled = false;
      game.col.add(s);
      this.walls.push(s);
    }
    if (game.save.found[`arena:${game.level!.def.id}:${id}`]) this.state = 'cleared';
  }

  private setBarrier(on: boolean): void {
    for (const w of this.walls) w.enabled = on;
    this.barrier.visible = on;
  }

  start(): void {
    if (this.state !== 'idle') return;
    this.state = 'active';
    this.wave = -1;
    this.setBarrier(true);
    this.game.sfx('door', this.x, this.y, this.z, 1.3);
    this.game.arenaStarted(this);
    this.onStart?.();
    this.nextWave();
  }

  private nextWave(): void {
    this.wave++;
    if (this.wave >= this.waves.length) {
      this.finish();
      return;
    }
    const g = this.game;
    for (const s of this.waves[this.wave]!) {
      const def = ENEMIES[s.type];
      if (!def) continue;
      const gy = g.col.groundAt(s.x, s.z, this.y + 5, 0.3).y;
      const e = g.spawnEnemy(s.type, s.x, (gy > -1e3 ? gy : this.y) + (def.flying ? 2 : 0.05), s.z, Math.atan2(this.x - s.x, this.z - s.z), true);
      e.spawnDelay = s.delay ?? 0;
      e.aggro = true;
      this.alive.push(e);
    }
    if (this.waves.length > 1) g.toast(`Wave ${this.wave + 1} of ${this.waves.length}`, 'warn');
  }

  private finish(): void {
    const g = this.game;
    this.state = 'cleared';
    this.setBarrier(false);
    g.save.found[`arena:${g.level!.def.id}:${this.id}`] = true;
    g.sfx('unlock', this.x, this.y, this.z);
    g.toast('Area cleared!', 'good');
    g.spawnGems(this.x, this.y + 1, this.z, { blue: this.reward, red: 3, green: 2 }, true);
    g.arenaEnded(this);
    this.onClear?.();
  }

  /** The player died inside: put everything back. */
  reset(): void {
    if (this.state !== 'active') return;
    for (const e of this.alive) if (e.alive) {
      e.alive = false;
      e.releaseToken();
      e.state = 'dead';
      e.deadT = 1;
      e.dispose();
    }
    this.alive = [];
    this.state = 'idle';
    this.wave = -1;
    this.setBarrier(false);
  }

  update(dt: number): void {
    const g = this.game;
    if (this.state === 'idle') {
      const p = g.player.body;
      if (Math.hypot(p.x - this.x, p.z - this.z) < this.r - 2 && Math.abs(p.y - this.y) < 5 && g.player.alive) this.start();
      return;
    }
    if (this.state !== 'active') return;
    this.barrierMat.opacity = 0.18 + Math.sin(g.time * 3) * 0.06;
    this.barrier.rotation.y += dt * 0.2;
    this.alive = this.alive.filter((e) => e.alive);
    if (this.alive.length === 0) {
      this.waveGap += dt;
      if (this.waveGap > 1.2) {
        this.waveGap = 0;
        this.nextWave();
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Portals and talkers
// ---------------------------------------------------------------------------

export class Portal implements Prop, Interactable {
  readonly range = 3;
  enabled = true;
  private ring: THREE.Mesh;
  private disc: THREE.Mesh;
  private root = new THREE.Group();

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, yaw: number,
    readonly target: string, public label: string, color = 0xc9a2ff, private action: (() => void) | null = null) {
    const stone = mat(0x6e6a78, { rough: 0.9, flat: true });
    for (const sx of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 4.2, 6), stone);
      p.position.set(sx * 1.9, 2.1, 0);
      p.castShadow = true;
      this.root.add(p);
      game.col.add(makeCyl(x + Math.cos(yaw) * sx * 1.9, z - Math.sin(yaw) * sx * 1.9, 0.4, y, y + 4.2));
    }
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.12, 8, 32), glow(color));
    this.ring.position.y = 2.2;
    this.root.add(this.ring);
    this.disc = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    }));
    this.disc.position.y = 2.2;
    this.root.add(this.disc);
    this.root.position.set(x, y, z);
    this.root.rotation.y = yaw;
    game.level!.root.add(this.root);
  }

  interact(): void {
    if (this.action) this.action();
    else this.game.travel(this.target);
  }

  update(dt: number): void {
    this.ring.rotation.z += dt;
    (this.disc.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(this.game.time * 3) * 0.1;
    if (rng.chance(0.3)) this.game.fx.sparkle(this.x + rng.signed() * 1.2, this.y + 1 + rng.next() * 2.4, this.z + rng.signed() * 0.3, 0xe0c8ff, 1);
  }
}

export class Talker implements Prop, Interactable {
  readonly range = 3.2;
  enabled = true;
  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, public label: string, private fn: () => void) {
    void this.game;
  }
  interact(): void {
    this.fn();
  }
  update(): void {
    /* driven by the NPC model */
  }
}

// ---------------------------------------------------------------------------
// Geysers: water jets that throw you upward; Ice freezes them into pillars.
// ---------------------------------------------------------------------------

export class Geyser implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius: number;
  readonly height: number;
  frozen = false;
  private solid: Solid;
  private column: THREE.Mesh;
  private ice: THREE.Mesh;
  private fxT = 0;
  private chill = 0;
  private frozenT = 0;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, r: number, private h: number,
    private permanent: boolean, readonly signal: string) {
    this.radius = r;
    this.height = h;
    const m = new THREE.MeshStandardMaterial({ color: 0x9ad8ff, transparent: true, opacity: 0.45, roughness: 0.1, emissive: 0x3a8ab8, emissiveIntensity: 0.3, depthWrite: false });
    this.column = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, h, 12, 1, true), m);
    this.column.position.set(x, y + h / 2, z);
    game.level!.root.add(this.column);
    const im = new THREE.MeshStandardMaterial({ color: 0xcff6ff, roughness: 0.1, metalness: 0.1, emissive: 0x3aa0d0, emissiveIntensity: 0.25, flatShading: true, transparent: true, opacity: 0.92 });
    this.ice = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.25, h, 7, 3), im);
    this.ice.position.copy(this.column.position);
    this.ice.visible = false;
    this.ice.castShadow = true;
    game.level!.root.add(this.ice);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 1.1, 0.25, 6, 16), mat(0x6a6a72, { rough: 0.9, flat: true }));
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, y + 0.1, z);
    game.level!.root.add(rim);
    this.solid = makeCyl(x, z, r * 1.05, y - 0.5, y + h);
    this.solid.enabled = false;
    this.solid.surface = 'ice';
    this.solid.unsafe = !permanent;
    game.col.add(this.solid);
  }

  takeHit(hit: Hit): HitResult {
    if (hit.type !== 'ice') {
      if (!this.frozen && hit.type !== 'physical') this.game.toast('The geyser needs to be frozen.', 'hint');
      return 'none';
    }
    if (this.frozen) {
      this.frozenT = 0;
      return 'hit';
    }
    this.chill += hit.buildup + hit.damage;
    if (this.chill >= 60) this.freeze();
    return 'hit';
  }

  private freeze(): void {
    this.frozen = true;
    this.frozenT = 0;
    this.solid.enabled = true;
    this.column.visible = false;
    this.ice.visible = true;
    const g = this.game;
    g.sfx('iceCrack', this.x, this.y, this.z);
    g.fx.shatter(this.x, this.y + this.h, this.z);
    if (this.signal) g.level!.emit(this.signal);
  }

  private thaw(): void {
    this.frozen = false;
    this.chill = 0;
    this.solid.enabled = false;
    this.column.visible = true;
    this.ice.visible = false;
    this.game.fx.splash(this.x, this.y + this.h, this.z);
  }

  update(dt: number): void {
    const g = this.game;
    if (this.frozen) {
      this.frozenT += dt;
      if (!this.permanent && this.frozenT > 14) this.thaw();
      return;
    }
    this.chill = Math.max(0, this.chill - dt * 10);
    this.fxT -= dt;
    if (this.fxT <= 0) {
      this.fxT = 0.05;
      g.fx.emit(this.x, this.y + this.h, this.z, { count: 3, speed: 4, dir: [0, 1, 0], spread: 0.6, life: [0.5, 0.9], size: [0.2, 0.35], sizeEnd: 1.5, color: 0xe0f6ff, alpha: 0.7, additive: false, gravity: 10, jitter: this.radius * 0.5 });
    }
    (this.column.material as THREE.MeshStandardMaterial).opacity = 0.38 + Math.sin(g.time * 12) * 0.06;
    // The jet throws anything in it upward.
    const p = g.player;
    const b = p.body;
    if (Math.hypot(b.x - this.x, b.z - this.z) < this.radius && b.y >= this.y - 0.5 && b.y < this.y + this.h + 1) {
      b.vy = Math.max(b.vy, 14);
      b.grounded = false;
    }
  }
}

// ---------------------------------------------------------------------------
// Vine walls the dragon can claw-climb.
// ---------------------------------------------------------------------------

export class ClimbWall implements Prop {
  /** Outward normal (the side you climb on). */
  readonly nx: number;
  readonly nz: number;
  readonly tx: number;
  readonly tz: number;

  constructor(game: Game, readonly x: number, readonly z: number, readonly yaw: number, readonly w: number, readonly y0: number, readonly y1: number, solid: boolean) {
    this.nx = Math.sin(yaw);
    this.nz = Math.cos(yaw);
    this.tx = Math.cos(yaw);
    this.tz = -Math.sin(yaw);
    const h = y1 - y0;
    const root = new THREE.Group();
    root.position.set(x, y0, z);
    root.rotation.y = yaw;
    if (solid) {
      const rock = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, h, 1.2), mat(0x7a7064, { rough: 0.95, flat: true }));
      rock.position.set(0, h / 2, -0.6);
      rock.castShadow = rock.receiveShadow = true;
      root.add(rock);
      game.col.add(makeBox(x - this.nx * 0.6, z - this.nz * 0.6, (w + 0.6) / 2, 0.6, y0 - 0.5, y1, yaw));
    }
    // A lattice of vines and leaves: the visual rule for "you can climb this".
    const vine = mat(0x3f7a2a, { rough: 0.9 });
    const leaf = mat(0x6ab83a, { rough: 0.8, emissive: 0x2a5a14, emissiveIntensity: 0.35, side: THREE.DoubleSide });
    const cols = Math.max(2, Math.round(w / 0.9));
    for (let i = 0; i < cols; i++) {
      const vx = -w / 2 + (i + 0.5) * (w / cols);
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 6; k++) pts.push(new THREE.Vector3(vx + Math.sin(k * 1.3 + i) * 0.18, (k / 6) * h, 0.05));
      const t = new THREE.Mesh(taperedTube(pts, 0.07, 0.05, 12, 5, false), vine);
      root.add(t);
    }
    const leafGeo = new THREE.CircleGeometry(0.22, 5);
    const n = Math.round(w * h * 1.6);
    for (let i = 0; i < n; i++) {
      const l = new THREE.Mesh(leafGeo, leaf);
      l.position.set((rng.next() - 0.5) * w, rng.next() * h, 0.08);
      l.rotation.set(rng.signed() * 0.6, rng.signed() * 0.6, rng.next() * 6);
      l.scale.set(1, 0.6, 1);
      root.add(l);
    }
    game.level!.root.add(root);
  }

  /** Signed distance from the climbing face, and position along it. */
  local(px: number, pz: number): { d: number; u: number } {
    const dx = px - this.x;
    const dz = pz - this.z;
    return { d: dx * this.nx + dz * this.nz, u: dx * this.tx + dz * this.tz };
  }

  update(): void {
    /* static */
  }
}

// ---------------------------------------------------------------------------
// Glide rings: fly through them in order before the timer runs out.
// ---------------------------------------------------------------------------

export class GlideCourse implements Prop {
  private rings: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; x: number; y: number; z: number; nx: number; nz: number }[] = [];
  private next = 0;
  private timeLeft = 0;
  private done: boolean;
  private prev = new THREE.Vector3();

  constructor(private game: Game, readonly id: string, pts: [number, number, number, number][], private limit: number, private reward: number) {
    this.done = !!game.save.found[id];
    for (const [x, y, z, yaw] of pts) {
      const m = new THREE.MeshBasicMaterial({ color: 0xf5c46b, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.16, 8, 32), m);
      ring.position.set(x, y, z);
      ring.rotation.y = yaw;
      game.level!.root.add(ring);
      this.rings.push({ mesh: ring, mat: m, x, y, z, nx: Math.sin(yaw), nz: Math.cos(yaw) });
    }
    this.paint();
  }

  private paint(): void {
    this.rings.forEach((r, i) => {
      const col = this.done ? 0x9af0aa : i === this.next ? 0xffffff : i < this.next ? 0x6a8aff : 0xf5c46b;
      r.mat.color.setHex(col);
      r.mat.opacity = i < this.next ? 0.35 : 0.85;
    });
  }

  update(dt: number): void {
    const g = this.game;
    const p = g.player.body;
    const cy = p.y + 0.6;
    if (this.next > 0) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.next = 0;
        g.toast('Too slow! The rings reset.', 'warn');
        g.audio.play('uiBack');
        this.paint();
      }
    }
    const r = this.rings[this.next];
    if (r) {
      r.mesh.rotation.z += dt * 1.5;
      // Crossed the ring's plane close to its center since last step?
      const a = (this.prev.x - r.x) * r.nx + (this.prev.z - r.z) * r.nz;
      const b = (p.x - r.x) * r.nx + (p.z - r.z) * r.nz;
      const near = Math.hypot(p.x - r.x, cy - r.y, p.z - r.z) < 2.6;
      if (near && (Math.sign(a) !== Math.sign(b) || Math.abs(b) < 0.6)) {
        if (this.next === 0) this.timeLeft = this.limit;
        g.audio.play('gem', 1 + this.next * 0.08, 0.9);
        g.fx.ring(r.x, r.y - 0.5, r.z, 0.5, 3, 0xffffff, 0.3);
        g.fx.sparkle(r.x, r.y, r.z, 0xf5c46b, 12);
        this.next++;
        if (this.next >= this.rings.length) {
          this.next = 0;
          const first = !this.done;
          this.done = true;
          g.save.found[this.id] = true;
          g.spawnGems(p.x, p.y + 1, p.z, { blue: first ? this.reward : Math.round(this.reward / 5) }, true);
          g.hud.bigText('RINGS CLEARED', 0xf5c46b);
          g.audio.play('unlock');
        } else if (this.next === 1) g.toast(`Glide rings: ${this.limit}s to fly through them all!`, 'info');
        this.paint();
      }
    }
    this.prev.set(p.x, cy, p.z);
  }
}
