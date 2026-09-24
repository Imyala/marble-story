import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Element, Hit, HitResult, Hittable } from '../game/types';
import { makeHit } from '../game/types';
import { Body, makeBox, makeCyl, makeRamp, type Solid } from '../world/collision';
import { mat, matUnique, glow } from '../render/materials';
import type { Prop } from './props';
import type { Enemy } from '../enemies/enemy';

/**
 * Puzzle pieces. Each one answers to a specific ability so solving a room
 * is about reading what is in it:
 *   Conduit        Lightning charges it for a few seconds; charge a whole set at once
 *   BoltTurret +   a Gloom eye fires bolts; bat one back into a ReflectSwitch
 *   ReflectSwitch
 *   WeightPlate +  holds a door open while something heavy sits on it: a pushed
 *   Boulder        boulder, a frozen enemy, or a brute
 *   IceFloes       Ice freezes water into stepping floes that melt again
 *   Rope +         Fire burns the rope and the drawbridge drops
 *   Drawbridge
 *   SnapGate,      too fast to pass in normal time; Dragon Time slows them
 *   SpinBlade
 *   ElementLock    strike its sockets with elements in the order its glyphs show
 *   PuzzleHint     Flick offers stronger hints the longer you linger unsolved
 */

const EL_COLOR: Record<Element, number> = { fire: 0xff7a2a, lightning: 0xa8e6ff, ice: 0x8fe4ff, earth: 0x9be06a };

// ---------------------------------------------------------------------------

export class Conduit implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius = 0.7;
  readonly height = 3;
  charge = 0;
  private crystal: THREE.Mesh;
  private cm: THREE.MeshStandardMaterial;
  private arcT = 0;
  private sfxT = 0;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, readonly group: string, private hold: number) {
    const root = new THREE.Group();
    const iron = mat(0x4a4a58, { rough: 0.4, metal: 0.8 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.4, 2.2, 6), iron);
    post.position.y = 1.1;
    post.castShadow = true;
    root.add(post);
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 5, 14), mat(0xb89a5a, { rough: 0.3, metal: 0.9 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.6 + i * 0.6;
      root.add(ring);
    }
    this.cm = matUnique(0x2a3a5a, { rough: 0.2, flat: true, emissive: 0x3a6aa8, emissiveIntensity: 0.15 });
    this.crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), this.cm);
    this.crystal.scale.y = 1.6;
    this.crystal.position.y = 2.7;
    root.add(this.crystal);
    root.position.set(x, y, z);
    game.level!.root.add(root);
    game.col.add(makeCyl(x, z, 0.4, y, y + 2.2));
  }

  get charged(): boolean {
    return this.charge > 0;
  }

  takeHit(hit: Hit): HitResult {
    if (hit.type !== 'lightning') {
      if (hit.type !== 'physical') this.game.toast('The conduit only takes a spark.', 'hint');
      return 'none';
    }
    const was = this.charged;
    this.charge = this.hold;
    if (!was) {
      this.game.sfx('switch', this.x, this.y, this.z, 1.4, 0.7);
      this.game.level!.conduitChanged(this.group);
    }
    return 'hit';
  }

  update(dt: number): void {
    const g = this.game;
    if (this.charge > 0) {
      this.charge = Math.max(0, this.charge - dt);
      if (this.charge === 0) {
        g.sfx('dragonTimeOff', this.x, this.y, this.z, 1.5, 0.5);
        g.level!.conduitChanged(this.group);
      }
    }
    const k = this.charge / this.hold;
    const lit = this.charge > 0;
    this.cm.emissive.setHex(lit ? 0xbfe8ff : 0x3a6aa8);
    // Flickers faster as the charge runs out.
    this.cm.emissiveIntensity = lit ? 0.6 + 0.4 * (k > 0.3 ? 1 : Math.sin(g.time * 30) * 0.5 + 0.5) : 0.15;
    this.crystal.rotation.y += dt * (lit ? 3 : 0.4);
    if (!lit) return;
    this.arcT -= dt;
    if (this.arcT <= 0) {
      this.arcT = 0.09;
      const top = new THREE.Vector3(this.x, this.y + 2.8, this.z);
      for (const o of g.level!.conduits) {
        if (o === this || o.group !== this.group || !o.charged) continue;
        if (Math.hypot(o.x - this.x, o.z - this.z) > 26) continue;
        if (o.x + o.z < this.x + this.z) continue;
        g.fx.arc(top, new THREE.Vector3(o.x, o.y + 2.8, o.z), 0xcff0ff, 0.1, 0.1, 0.25);
      }
      g.fx.sparkle(this.x, this.y + 2.8, this.z, 0xcff0ff, 2);
    }
    this.sfxT -= dt;
    if (this.sfxT <= 0) {
      this.sfxT = 0.6;
      g.sfx('zap', this.x, this.y, this.z, 0.6, 0.25);
    }
  }
}

// ---------------------------------------------------------------------------

export class ReflectSwitch implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius = 0.9;
  readonly height = 2.4;
  on = false;
  private eye: THREE.Mesh;
  private em: THREE.MeshStandardMaterial;
  private hintT = 0;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, readonly signal: string) {
    const root = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.2, 8), mat(0x5a5664, { rough: 0.9, flat: true }));
    base.position.y = 0.6;
    base.castShadow = true;
    root.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.12, 8, 24), mat(0xd8b060, { rough: 0.3, metal: 0.8 }));
    ring.position.y = 1.9;
    root.add(ring);
    this.em = matUnique(0x3a2050, { rough: 0.2, emissive: 0x7a40c0, emissiveIntensity: 0.3 });
    this.eye = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 10), this.em);
    this.eye.position.y = 1.9;
    root.add(this.eye);
    root.position.set(x, y, z);
    game.level!.root.add(root);
    game.col.add(makeCyl(x, z, 0.8, y, y + 1.2));
    game.level!.reflectTargets.push(this);
  }

  takeHit(hit: Hit): HitResult {
    if (this.on) return 'none';
    if (hit.move !== 'reflected') {
      this.hintT -= 1;
      if (this.hintT <= 0) {
        this.hintT = 5;
        this.game.toast('It only answers its own magic. Send a bolt back into it!', 'hint');
      }
      return 'immune';
    }
    this.on = true;
    this.em.color.setHex(0xfff0c0);
    this.em.emissive.setHex(0xf5c46b);
    this.em.emissiveIntensity = 1;
    const g = this.game;
    g.sfx('unlock', this.x, this.y, this.z);
    g.fx.ring(this.x, this.y + 0.2, this.z, 0.4, 4, 0xf5c46b, 0.5);
    g.level!.emit(this.signal);
    g.style.bonus(60);
    return 'hit';
  }

  update(dt: number): void {
    this.eye.rotation.y += dt * (this.on ? 2 : 0.5);
  }
}

/** A Gloom eye statue that shoots at the dragon. Not an enemy: it cannot be destroyed. */
export class BoltTurret implements Prop {
  private cd: number;
  private eye: THREE.Mesh;
  private windup = 0;

  private asleep = false;

  /**
   * `until` puts it to sleep for good; with `facing`, it only watches a
   * cone of `cone` radians either side of that yaw.
   */
  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, private range: number, private interval: number,
    until = '', private facing: number | null = null, private cone = 1.2) {
    this.cd = interval;
    if (until) game.level!.on(until, () => this.sleep());
    const root = new THREE.Group();
    const stone = mat(0x3a3448, { rough: 0.9, flat: true });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 2.4, 6), stone);
    body.position.y = 1.2;
    body.castShadow = true;
    root.add(body);
    this.eye = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), new THREE.MeshBasicMaterial({ color: 0xc050ff }));
    this.eye.position.set(0, 2.1, 0.75);
    root.add(this.eye);
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.7, 5), stone);
      sp.position.set(Math.sin(i * 1.57) * 0.8, 2.6, Math.cos(i * 1.57) * 0.8);
      root.add(sp);
    }
    root.position.set(x, y, z);
    game.level!.root.add(root);
    this.root = root;
    game.col.add(makeCyl(x, z, 0.9, y, y + 2.6));
  }

  private root: THREE.Group;

  private sleep(): void {
    this.asleep = true;
    this.windup = 0;
    this.eye.scale.setScalar(0.7);
    (this.eye.material as THREE.MeshBasicMaterial).color.setHex(0x40304a);
    this.game.fx.shadowPoof(this.x, this.y + 2.1, this.z, 1);
  }

  private watching(): boolean {
    const p = this.game.player;
    if (!p.alive || this.game.state !== 'play') return false;
    const dx = p.x - this.x;
    const dz = p.z - this.z;
    if (Math.hypot(dx, dz) > this.range || Math.abs(p.y - this.y) > 8) return false;
    if (this.facing === null) return true;
    let a = Math.atan2(dx, dz) - this.facing;
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return Math.abs(a) < this.cone;
  }

  update(dt: number): void {
    if (this.asleep) return;
    const g = this.game;
    const p = g.player;
    const inRange = this.watching();
    if (inRange) this.root.rotation.y = Math.atan2(p.x - this.x, p.z - this.z);
    this.cd -= dt;
    if (this.windup > 0) {
      this.windup -= dt;
      this.eye.scale.setScalar(1 + (0.6 - this.windup) * 0.8);
      if (this.windup <= 0) this.fire();
      return;
    }
    this.eye.scale.setScalar(1);
    if (inRange && this.cd <= 0) {
      this.windup = 0.6;
      this.cd = this.interval;
      g.sfx('enemyAttack', this.x, this.y, this.z, 1.35, 0.7);
    }
  }

  private fire(): void {
    const g = this.game;
    const p = g.player.body;
    const yaw = this.root.rotation.y;
    const ox = this.x + Math.sin(yaw) * 1.1;
    const oz = this.z + Math.cos(yaw) * 1.1;
    const oy = this.y + 2.1;
    const dx = p.x - ox;
    const dy = p.y + 0.8 - oy;
    const dz = p.z - oz;
    g.spawnProjectile({ x: ox, y: oy, z: oz, dx, dy, dz, speed: 9, radius: 0.4, damage: 7, type: 'shadow', color: 0xc050ff, life: 5, gravity: 0, fromPlayer: false });
    g.sfx('cue', ox, oy, oz, 0.8, 0.6);
  }
}

// ---------------------------------------------------------------------------

export class Boulder implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius = 1.0;
  readonly height = 2;
  readonly body = new Body(1.0, 1.9);
  private mesh: THREE.Mesh;
  private solid: Solid;
  private home: THREE.Vector3;
  private respawn = 0;
  private hintT = 0;
  private bowled: Enemy[] = [];

  constructor(private game: Game, x: number, y: number, z: number) {
    this.body.setPos(x, y, z);
    this.body.stepUp = 0.3;
    this.home = new THREE.Vector3(x, y, z);
    this.mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 1), mat(0x8a7a60, { rough: 1, flat: true }));
    this.mesh.castShadow = this.mesh.receiveShadow = true;
    game.level!.root.add(this.mesh);
    this.solid = makeCyl(x, z, 0.9, y, y + 1.9);
    this.solid.dynamic = true;
    game.col.add(this.solid);
    game.level!.boulders.push(this);
  }

  get x(): number {
    return this.body.x;
  }
  get y(): number {
    return this.body.y;
  }
  get z(): number {
    return this.body.z;
  }

  takeHit(hit: Hit): HitResult {
    const heavy = hit.heavy || hit.source === 'charge' || hit.type === 'earth';
    if (!heavy) {
      this.hintT -= 1;
      if (this.hintT <= 0) {
        this.hintT = 5;
        this.game.toast('Too heavy for horns. Tail, Charge or Earth can roll it.', 'hint');
      }
      return 'immune';
    }
    const push = hit.type === 'earth' ? 12 : 9;
    this.body.vx += hit.dirX * push;
    this.body.vz += hit.dirZ * push;
    this.game.sfx('rumble', this.x, this.y, this.z, 1.4, 0.6);
    return 'hit';
  }

  update(dt: number): void {
    const g = this.game;
    const b = this.body;
    if (this.respawn > 0) {
      this.respawn -= dt;
      if (this.respawn <= 0) {
        b.setPos(this.home.x, this.home.y + 1, this.home.z);
        b.vx = b.vy = b.vz = 0;
        this.mesh.visible = true;
        g.fx.sparkle(b.x, b.y + 1, b.z, 0xf5c46b, 10);
      }
      return;
    }
    // The solid moves with the body, but must not block the body itself.
    this.solid.enabled = false;
    const ox = b.x;
    const oz = b.z;
    b.vy -= 30 * dt;
    const f = Math.exp(-(b.grounded ? 1.6 : 0.2) * dt);
    b.vx *= f;
    b.vz *= f;
    g.col.move(b, dt);
    this.solid.enabled = true;
    this.solid.dx = b.x - this.solid.x;
    this.solid.dy = b.y - this.solid.y0;
    this.solid.dz = b.z - this.solid.z;
    this.solid.x = b.x;
    this.solid.z = b.z;
    this.solid.y0 = b.y;
    this.solid.y1 = b.y + 1.9;
    this.mesh.position.set(b.x, b.y + 1, b.z);
    // Roll with the ground.
    const mx = b.x - ox;
    const mz = b.z - oz;
    const moved = Math.hypot(mx, mz);
    if (moved > 1e-5) this.mesh.rotateOnWorldAxis(new THREE.Vector3(mz, 0, -mx).normalize(), moved / 1.0);
    // Rolling fast, it bowls enemies over.
    const sp = Math.hypot(b.vx, b.vz);
    this.bowled = this.bowled.filter((e) => Math.hypot(e.x - b.x, e.z - b.z) < 2.6);
    if (sp > 4.5) {
      for (const e of g.enemies) {
        if (!e.alive || this.bowled.includes(e) || Math.hypot(e.x - b.x, e.z - b.z) > 1.1 + e.radius || Math.abs(e.y - b.y) > 2) continue;
        this.bowled.push(e);
        e.takeHit(makeHit({ damage: 14 + sp * 1.5, dirX: b.vx / sp, dirZ: b.vz / sp, knockback: 10, launch: 4, stagger: 60, heavy: true, source: 'env', move: 'boulder', ox: b.x, oz: b.z }));
        g.sfx('hitHeavy', e.x, e.y, e.z, 0.8);
      }
    }
    if (b.y < g.killY || (b.grounded && g.isDeepWater(b.x, b.z, b.y))) {
      g.fx.splash(b.x, Math.max(b.y, g.waterLevel), b.z);
      this.mesh.visible = false;
      this.respawn = 2;
    }
  }
}

export class WeightPlate implements Prop {
  pressed = false;
  private top: THREE.Mesh;
  private tm: THREE.MeshStandardMaterial;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, readonly signal: string) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 3.2), mat(0x5a5664, { rough: 0.9 }));
    base.position.set(x, y + 0.12, z);
    base.receiveShadow = true;
    game.level!.root.add(base);
    this.tm = matUnique(0x8a7a50, { rough: 0.6, emissive: 0xf5c46b, emissiveIntensity: 0.1 });
    this.top = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 2.6), this.tm);
    this.top.position.set(x, y + 0.3, z);
    game.level!.root.add(this.top);
    // A glyph of a boulder and an ice crystal: something heavy goes here.
    const glyph = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.8, 6), glow(0xf5c46b, 0.8));
    glyph.rotation.x = -Math.PI / 2;
    glyph.position.set(x, y + 0.47, z);
    game.level!.root.add(glyph);
  }

  private weighted(): boolean {
    const g = this.game;
    const inside = (px: number, py: number, pz: number) => Math.abs(px - this.x) < 1.6 && Math.abs(pz - this.z) < 1.6 && Math.abs(py - this.y) < 1.5;
    for (const b of g.level!.boulders) if (inside(b.x, b.y, b.z)) return true;
    for (const e of g.enemies) {
      if (!e.alive || !inside(e.x, e.y, e.z)) continue;
      if (e.status.frozen > 0 || e.def.mass < 0.3) return true;
    }
    return false;
  }

  private told = false;

  update(dt: number): void {
    // The plate's rim catches a boulder that rolls onto it and settles it in the middle.
    for (const bo of this.game.level!.boulders) {
      const dx = this.x - bo.x;
      const dz = this.z - bo.z;
      if (Math.abs(dx) > 1.7 || Math.abs(dz) > 1.7 || Math.abs(bo.y - this.y) > 1.5) continue;
      const f = Math.exp(-5 * dt);
      bo.body.vx = bo.body.vx * f + dx * 10 * dt;
      bo.body.vz = bo.body.vz * f + dz * 10 * dt;
    }
    const pb = this.game.player.body;
    if (!this.told && !this.pressed && pb.grounded && Math.abs(pb.x - this.x) < 1.4 && Math.abs(pb.z - this.z) < 1.4 && Math.abs(pb.y - this.y) < 1) {
      this.told = true;
      this.game.hud.flick('It won\'t budge for us. It needs something really heavy!', 5);
    }
    const w = this.weighted();
    if (w !== this.pressed) {
      this.pressed = w;
      this.top.position.y = this.y + (w ? 0.15 : 0.3);
      this.tm.emissiveIntensity = w ? 0.9 : 0.1;
      this.game.sfx('switch', this.x, this.y, this.z, w ? 0.7 : 0.5);
      this.game.level!.emit(w ? this.signal : `${this.signal}:off`);
    }
  }
}

// ---------------------------------------------------------------------------

interface Floe {
  x: number;
  z: number;
  solid: Solid;
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  t: number;
}

/** A row of freezable water. Each slot is its own small target. */
export class IceFloes implements Prop {
  private floes: Floe[] = [];

  constructor(private game: Game, pts: [number, number][], readonly waterY: number, private life = 14) {
    for (const [x, z] of pts) {
      const m = matUnique(0xcff6ff, { rough: 0.15, metal: 0.1, flat: true, transparent: true, opacity: 0.92, emissive: 0x3aa0d0, emissiveIntensity: 0.2 });
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.5, 7), m);
      mesh.position.set(x, waterY - 0.1, z);
      mesh.visible = false;
      mesh.receiveShadow = true;
      game.level!.root.add(mesh);
      const solid = makeCyl(x, z, 1.5, waterY - 1, waterY + 0.15);
      solid.enabled = false;
      solid.surface = 'ice';
      solid.unsafe = true;
      game.col.add(solid);
      const f: Floe = { x, z, solid, mesh, mat: m, t: 0 };
      this.floes.push(f);
      // A faint ring on the water marks where a floe can form.
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.45, 20), glow(0xbfefff, 0.35, true));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, waterY + 0.04, z);
      game.level!.root.add(ring);
      const floeRef = f;
      game.level!.hittables.push({
        isEnemy: false, alive: true, x, y: waterY - 0.5, z, radius: 1.4, height: 1.2,
        takeHit: (hit: Hit): HitResult => {
          if (hit.type !== 'ice') return 'none';
          this.freeze(floeRef);
          return 'hit';
        },
      });
    }
  }

  private freeze(f: Floe): void {
    const g = this.game;
    if (f.t <= 0) {
      g.sfx('iceCrack', f.x, this.waterY, f.z, 1.2, 0.8);
      g.fx.sparkle(f.x, this.waterY + 0.3, f.z, 0xdff8ff, 8);
    }
    f.t = this.life;
    f.solid.enabled = true;
    f.mesh.visible = true;
    f.mat.opacity = 0.92;
  }

  update(dt: number): void {
    for (const f of this.floes) {
      if (f.t <= 0) continue;
      f.t -= dt;
      // Blink before it melts.
      if (f.t < 2.5) f.mat.opacity = Math.sin(f.t * 14) > 0 ? 0.92 : 0.5;
      if (f.t <= 0) {
        f.solid.enabled = false;
        f.mesh.visible = false;
        this.game.fx.splash(f.x, this.waterY, f.z);
        this.game.sfx('splash', f.x, this.waterY, f.z, 1.3, 0.5);
      }
    }
  }
}

// ---------------------------------------------------------------------------

export class Rope implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius = 0.5;
  readonly height: number;
  private burnT = -1;
  private mesh: THREE.Mesh;
  private rm: THREE.MeshStandardMaterial;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, len: number, readonly signal: string) {
    this.height = len;
    this.rm = matUnique(0xc8a870, { rough: 1 });
    this.mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, len, 6), this.rm);
    this.mesh.position.set(x, y + len / 2, z);
    game.level!.root.add(this.mesh);
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), this.rm);
    knot.position.set(x, y + 0.1, z);
    game.level!.root.add(knot);
    this.knot = knot;
  }

  private knot: THREE.Mesh;

  takeHit(hit: Hit): HitResult {
    if (!this.alive || this.burnT >= 0) return 'none';
    if (hit.type !== 'fire') {
      if (hit.source === 'melee') this.game.toast('The rope is too tough to cut. It might burn.', 'hint');
      return 'immune';
    }
    this.burnT = 0;
    this.game.sfx('torch', this.x, this.y, this.z);
    return 'hit';
  }

  update(dt: number): void {
    if (this.burnT < 0 || !this.alive) return;
    this.burnT += dt;
    const g = this.game;
    const k = this.burnT / 0.8;
    this.rm.color.setHex(0x3a2a1a);
    this.rm.emissive.setHex(0xff5a10);
    this.rm.emissiveIntensity = 0.8;
    g.fx.emit(this.x, this.y + this.height * (1 - k), this.z, { count: 2, speed: 1, dir: [0, 1, 0], life: [0.3, 0.5], size: [0.3, 0.5], sizeEnd: 0.1, color: 0xffb040, colorEnd: 0xff2000, bright: 1.8 });
    if (k >= 1) {
      this.alive = false;
      g.level!.root.remove(this.mesh);
      g.level!.root.remove(this.knot);
      g.fx.smoke(this.x, this.y + 1, this.z, 6);
      g.level!.emit(this.signal);
    }
  }
}

/** A plank bridge hinged at one end, held up until its signal drops it. */
export class Drawbridge implements Prop {
  private pivot = new THREE.Group();
  private t = -1;
  private solid: Solid;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, private yaw: number, private len: number, w: number, signal: string, lowered = false) {
    this.pivot.position.set(x, y, z);
    this.pivot.rotation.order = 'YXZ';
    this.pivot.rotation.y = yaw;
    const wood = mat(0x8a6a44, { rough: 0.95 });
    const dark = mat(0x5a4028, { rough: 0.95 });
    const n = Math.round(len / 0.6);
    for (let i = 0; i < n; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, 0.55), i % 3 === 0 ? dark : wood);
      p.position.set(0, -0.1, (i + 0.5) * (len / n));
      p.castShadow = p.receiveShadow = true;
      this.pivot.add(p);
    }
    for (const sx of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, len), dark);
      rail.position.set(sx * w * 0.45, 0.05, len / 2);
      this.pivot.add(rail);
    }
    game.level!.root.add(this.pivot);
    const cx = x + Math.sin(yaw) * len / 2;
    const cz = z + Math.cos(yaw) * len / 2;
    this.solid = makeRamp(cx, cz, w / 2, len / 2, y - 0.5, y, y, yaw);
    this.solid.surface = 'wood';
    game.col.add(this.solid);
    if (lowered) this.t = 1;
    else this.solid.enabled = false;
    this.apply();
    game.level!.on(signal, () => {
      if (this.t < 0) {
        this.t = 0;
        game.sfx('door', x, y, z, 1.2);
      }
    });
  }

  private apply(): void {
    const k = this.t < 0 ? 0 : Math.min(1, this.t);
    // Raised: pointing up (pitch -90 degrees). Lowered: flat.
    const e = 1 - Math.pow(1 - k, 3);
    this.pivot.rotation.x = -Math.PI / 2 * (1 - e);
  }

  update(dt: number): void {
    if (this.t < 0 || this.t >= 1) return;
    this.t += dt / 1.2;
    this.apply();
    if (this.t >= 1) {
      this.solid.enabled = true;
      this.game.shake(0.3, 0.3);
      this.game.fx.dust(this.x + Math.sin(this.yaw) * this.len, this.y, this.z + Math.cos(this.yaw) * this.len, 12);
      this.game.sfx('pound', this.x, this.y, this.z, 1.3, 0.7);
    }
  }
}

// ---------------------------------------------------------------------------

/** A door that snaps open for a moment every cycle. Dragon Time makes the moment long enough. */
export class SnapGate implements Prop {
  private solid: Solid;
  private door: THREE.Mesh;
  private t: number;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, private w: number, private h: number, private yaw: number,
    private open: number, private cycle: number, phase = 0) {
    this.t = phase;
    this.solid = makeBox(x, z, w / 2, 0.5, y - 1, y + h, yaw);
    game.col.add(this.solid);
    this.door = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.8), mat(0x6a6070, { rough: 0.5, metal: 0.4, flat: true }));
    this.door.position.set(x, y + h / 2, z);
    this.door.rotation.y = yaw;
    this.door.castShadow = true;
    game.level!.root.add(this.door);
    this.edgeMat = new THREE.MeshBasicMaterial({ color: 0x806020 });
    const edge = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.2, 0.9), this.edgeMat);
    edge.position.y = -h / 2 + 0.1;
    this.door.add(edge);
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.8, h + 1, 1.2), mat(0x3a3448, { rough: 0.9, flat: true }));
      post.position.set(x + Math.cos(yaw) * sx * (w / 2 + 0.4), y + (h + 1) / 2, z - Math.sin(yaw) * sx * (w / 2 + 0.4));
      post.rotation.y = yaw;
      post.castShadow = true;
      game.level!.root.add(post);
      game.col.add(makeBox(post.position.x, post.position.z, 0.4, 0.6, y - 1, y + h + 1, yaw));
    }
  }

  private edgeMat: THREE.MeshBasicMaterial;

  update(dt: number): void {
    this.t = (this.t + dt) % this.cycle;
    // Slam shut, stay closed, flick open for `open` seconds.
    const openAt = this.cycle - this.open;
    const k = this.t < openAt ? 0 : 1;
    // The rune edge brightens in the second before it opens: the cue for Dragon Time.
    const warn = Math.max(0, 1 - (openAt - this.t) / 1.0);
    this.edgeMat.color.setHex(k ? 0xffffff : warn > 0 ? (Math.sin(this.game.realTime * 30) > 0 ? 0xffe890 : 0xffb030) : 0x806020);
    const target = this.y + (k ? this.h + 0.2 : 0) + this.h / 2;
    const cur = this.door.position.y;
    this.door.position.y = cur + (target - cur) * Math.min(1, dt * 30);
    const wasOpen = !this.solid.enabled;
    this.solid.enabled = k === 0;
    const g = this.game;
    const b = g.player.body;
    // Along the door's normal: which side the dragon is on.
    const nx = Math.sin(this.yaw);
    const nz = Math.cos(this.yaw);
    const along = (b.x - this.x) * nx + (b.z - this.z) * nz;
    const across = (b.x - this.x) * nz - (b.z - this.z) * nx;
    if (!wasOpen && k === 1) this.side = along >= 0 ? 1 : -1;
    if (wasOpen && k === 0) {
      g.sfx('pound', this.x, this.y, this.z, 1.6, 0.4);
      // Caught in the doorway: the door throws the dragon back the way it came.
      const r = b.radius;
      if (Math.abs(along) < 0.5 + r && Math.abs(across) < this.w / 2 + r && b.y < this.y + this.h) {
        const push = this.side * (0.5 + r + 0.15) - along;
        g.player.place(b.x + nx * push, b.y, b.z + nz * push, g.player.yaw);
        g.player.takeHit(makeHit({ damage: 5, dirX: nx * this.side, dirZ: nz * this.side, knockback: 6, source: 'env', move: 'door', fromPlayer: false, ox: this.x, oz: this.z }), null);
      }
    }
  }

  private side = -1;
}

/** A spinning bar of blades; slow it with Dragon Time to slip past. */
export class SpinBlade implements Prop {
  private root = new THREE.Group();
  private angle = 0;
  private cd = 0;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, private r: number, private speed: number, private arms = 2) {
    const metal = mat(0x9a9aa8, { rough: 0.25, metal: 0.9 });
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.4, 8), mat(0x3a3448, { rough: 0.9 }));
    hub.position.y = 0.7;
    this.root.add(hub);
    for (let i = 0; i < arms; i++) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, r), metal);
      const a = (i / arms) * Math.PI * 2;
      arm.position.set(Math.sin(a) * r / 2, 0.9, Math.cos(a) * r / 2);
      arm.rotation.y = a;
      arm.castShadow = true;
      this.root.add(arm);
      for (let k = 1; k <= 3; k++) {
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 4), metal);
        blade.position.set(Math.sin(a) * r * (k / 3.2), 1.2, Math.cos(a) * r * (k / 3.2));
        this.root.add(blade);
      }
    }
    this.root.position.set(x, y, z);
    game.level!.root.add(this.root);
    game.col.add(makeCyl(x, z, 0.55, y, y + 1.4));
  }

  update(dt: number): void {
    this.angle += this.speed * dt;
    this.root.rotation.y = this.angle;
    this.cd -= dt;
    const g = this.game;
    const p = g.player;
    const b = p.body;
    if (this.cd > 0 || !p.alive || b.y > this.y + 1.7 || b.y + b.height < this.y + 0.3) return;
    const dx = b.x - this.x;
    const dz = b.z - this.z;
    const d = Math.hypot(dx, dz);
    if (d > this.r + b.radius || d < 0.6) return;
    const pa = Math.atan2(dx, dz);
    for (let i = 0; i < this.arms; i++) {
      const a = this.angle + (i / this.arms) * Math.PI * 2;
      let diff = Math.abs(((pa - a) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      if (diff * d < b.radius + 0.25) {
        this.cd = 0.7;
        const n = d || 1;
        p.takeHit(makeHit({ damage: 10, dirX: dx / n, dirZ: dz / n, knockback: 9, launch: 5, source: 'env', move: 'blade', fromPlayer: false, ox: this.x, oz: this.z }), null);
        g.sfx('hitHeavy', b.x, b.y, b.z, 1.3, 0.8);
        diff = 0;
        break;
      }
    }
  }
}

// ---------------------------------------------------------------------------

/** A sealed door whose sockets must be struck with elements in the glyphs' order. */
export class ElementLock implements Prop {
  private step = 0;
  private sockets: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; el: Element }[] = [];
  solved = false;

  /**
   * `order` is the sequence to strike; `slots[i]` is where the i-th socket sits
   * along the slab (left to right as seen from the front), so the glyph dots,
   * not the positions, tell the order.
   */
  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, yaw: number, order: Element[], readonly signal: string,
    slots: number[] = order.map((_, i) => i)) {
    const n = order.length;
    const root = new THREE.Group();
    root.position.set(x, y, z);
    root.rotation.y = yaw;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(n * 1.6 + 1, 1.2, 0.8), mat(0x4a4458, { rough: 0.9, flat: true }));
    slab.position.y = 0.6;
    slab.castShadow = true;
    root.add(slab);
    order.forEach((el, i) => {
      const m = matUnique(0x2a2a34, { rough: 0.3, emissive: EL_COLOR[el], emissiveIntensity: 0.12 });
      const sock = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), m);
      // Local +x is the viewer's left when the slab faces them, so count slots from +x.
      const lx = ((n - 1) / 2 - slots[i]!) * 1.6;
      sock.position.set(lx, 1.7, 0);
      root.add(sock);
      // The glyph under each socket shows its element and its place in line.
      const pip = new THREE.Mesh(new THREE.CircleGeometry(0.18, 12), glow(EL_COLOR[el]));
      pip.position.set(lx, 0.7, 0.41);
      root.add(pip);
      for (let k = 0; k <= i; k++) {
        const dot = new THREE.Mesh(new THREE.CircleGeometry(0.06, 8), glow(0xffffff));
        dot.position.set(lx - i * 0.09 + k * 0.18, 0.35, 0.41);
        root.add(dot);
      }
      this.sockets.push({ mesh: sock, mat: m, el });
      // The target sits on the slab's front face, so shards and flames that
      // dip a little low still land before the stone stops them.
      const wx = x + Math.cos(yaw) * lx + Math.sin(yaw) * 0.6;
      const wz = z - Math.sin(yaw) * lx + Math.cos(yaw) * 0.6;
      game.level!.hittables.push({
        isEnemy: false, alive: true, x: wx, y: y + 0.2, z: wz, radius: 0.7, height: 2,
        takeHit: (hit: Hit): HitResult => this.strike(i, hit),
      });
    });
    game.level!.root.add(root);
    game.col.add(makeBox(x, z, (n * 1.6 + 1) / 2, 0.4, y, y + 1.2, yaw));
  }

  private fizzleT = 0;

  /**
   * A socket answers only to its own element, so a wide breath that brushes
   * its neighbours does no harm. Striking one out of turn resets the lock.
   */
  private strike(i: number, hit: Hit): HitResult {
    if (this.solved) return 'none';
    const g = this.game;
    const s = this.sockets[i]!;
    if (hit.type !== s.el) {
      if (hit.type === 'physical' && hit.source === 'melee' && this.fizzleT <= 0) {
        this.fizzleT = 4;
        g.toast('The socket wants an element, not horns.', 'hint');
      }
      return 'none';
    }
    if (i < this.step) return 'hit';
    if (i === this.step) {
      s.mat.emissiveIntensity = 1;
      s.mat.color.setHex(EL_COLOR[s.el]);
      this.step++;
      g.sfx('switch', this.x, this.y, this.z, 1 + this.step * 0.15);
      g.fx.sparkle(s.mesh.getWorldPosition(new THREE.Vector3()).x, this.y + 1.7, s.mesh.getWorldPosition(new THREE.Vector3()).z, EL_COLOR[s.el], 8);
      if (this.step >= this.sockets.length) {
        this.solved = true;
        g.sfx('unlock', this.x, this.y, this.z);
        g.fx.ring(this.x, this.y + 0.2, this.z, 0.5, 5, 0xf5c46b, 0.6);
        g.level!.emit(this.signal);
      }
      return 'hit';
    }
    // Out of turn: everything resets.
    for (const k of this.sockets) {
      k.mat.emissiveIntensity = 0.12;
      k.mat.color.setHex(0x2a2a34);
    }
    const had = this.step > 0;
    this.step = 0;
    if (had || this.fizzleT <= 0) {
      this.fizzleT = 3;
      g.sfx('uiBack', this.x, this.y, this.z);
      g.toast('The lock flares and goes dark. Count the dots: order matters.', 'hint');
    }
    return 'hit';
  }

  update(dt: number): void {
    this.fizzleT -= dt;
    for (const [i, s] of this.sockets.entries()) s.mesh.rotation.y += dt * (i < this.step ? 3 : 0.6);
  }
}

// ---------------------------------------------------------------------------

/** Flick offers stronger hints the longer the player lingers near an unsolved puzzle. */
export class PuzzleHint implements Prop {
  private t = 0;
  private given = 0;
  private solved = false;

  constructor(private game: Game, readonly x: number, readonly z: number, readonly r: number, private hints: string[], solvedSignal: string, private first = 30, private step = 35) {
    game.level!.on(solvedSignal, () => (this.solved = true));
    if (game.level!.fired.has(solvedSignal)) this.solved = true;
  }

  update(dt: number): void {
    if (this.solved || this.given >= this.hints.length) return;
    const g = this.game;
    const p = g.player;
    if (Math.hypot(p.x - this.x, p.z - this.z) > this.r || g.state !== 'play') return;
    this.t += dt;
    if (this.t > this.first + this.given * this.step) {
      g.hud.flick(this.hints[this.given]!, 8);
      this.given++;
    }
  }
}
