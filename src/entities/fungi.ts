import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Hit, HitResult, Hittable } from '../game/types';
import { makeHit } from '../game/types';
import type { Builder } from '../world/level';
import { makeBox, makeCyl, type Solid } from '../world/collision';
import { GEO } from '../render/decor';
import { mat, matUnique, glow, glowShared } from '../render/materials';
import { mergeStatic, taperedTube } from '../render/shapes';
import { clamp01, smoothstep } from '../core/math';
import { rng } from '../core/rng';
import { Hazard, type Prop } from './props';

/**
 * The Mycelium Deep's living puzzles. Each answers to one ability, shows its
 * state at a glance (they all glow, so they read in the dark and under
 * Flick's light), makes a sound when it changes, and fires a level signal
 * the realm can react to.
 *
 *   BounceCap   a springy cap: land on it to bounce. A Ground Pound onto it, or
 *               a blast of Earth first, makes the next bounce huge; Fire
 *               shrivels it into a plain step for a while
 *   LiftCap     a tall table-cap: Fire shrinks it to a stub, then it grows back
 *               up, carrying whoever stands on it (a mushroom lift)
 *   shelfCap    a bracket fungus on a wall: a ledge to stand on (no prop)
 *   SporeVent   puffs on a rhythm and throws Aster high; Ice freezes it open
 *               into a steady column that carries her higher still
 *   Glowthread  a node Lightning wakes, and a thread of light it sends a pulse
 *               along; the pulse opens a CapDoor, lights a LightBridge plank by
 *               plank, or wakes one socket of a TwinLock (both at once opens it)
 *   BlightCloud a choking wall of spores that hurts and shoves; Fire burns it
 *               away, and it creeps back after a while
 *
 * The builder helpers at the bottom (bounceCap, sporeVent, glowthread...) add
 * the static parts to the level's instanced decor and register the prop.
 */

/** The Deep's glow colors. */
export const SPORE = { violet: 0xb07aff, teal: 0x4af0d8, gold: 0xffc850, pink: 0xff6ab8, blight: 0xa8c040, ice: 0xbfefff } as const;

/** Tag on the solids of caps and shelf fungi (Skill Point: climb touching nothing else). */
export const CAP_TAG = 'cap';

/**
 * The Deep's shared fungus materials. Scenery is drawn in instanced batches,
 * one per shape and material, so every cap of a color shares one material
 * (the same one DecorBatch.mushroom uses) and every stalk shares another.
 */
export const capMat = (color: number): THREE.MeshStandardMaterial => mat(color, { rough: 0.6, emissive: color, emissiveIntensity: 0.55 });
export const stalkMat = (): THREE.MeshStandardMaterial => mat(0xe0d6cc, { rough: 0.8, emissive: 0x3a3450, emissiveIntensity: 0.4 });
/** Grey-green rot: blight's leavings on the ground and on roofs. */
export const rotMat = (): THREE.MeshStandardMaterial => mat(0x6a6a50, { rough: 1, emissive: 0x3a4a10, emissiveIntensity: 0.3 });

const UP = new THREE.Vector3(0, 1, 0);

// ---------------------------------------------------------------------------
// Bounce caps
// ---------------------------------------------------------------------------

export interface CapOpts {
  /** Upward speed of a normal bounce (18 lifts about 5 m, 20 about 6). Default 20. */
  power?: number;
  /** How much a pounded or Earth-swollen bounce multiplies it. Default 1.45. */
  big?: number;
  /** Cap radius. Default 1.6. */
  r?: number;
  color?: number;
  /** Seconds Fire shrivels it for (0: fireproof). Default 10. */
  shrivel?: number;
  /** Fired on every big bounce. */
  signal?: string;
}

/**
 * A springy glowing cap. Landing on it throws Aster up; landing on it in a
 * Ground Pound (or after swelling it with Earth) throws her far higher. Fire
 * shrivels it to a stub that does not bounce, and it plumps back up later.
 */
export class BounceCap implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius: number;
  readonly height: number;
  readonly solid: Solid;
  /** Bounces so far, and big ones. */
  bounces = 0;
  bigBounces = 0;
  private cap = new THREE.Group();
  private capMat: THREE.MeshStandardMaterial;
  private rimMat: THREE.MeshBasicMaterial;
  private squash = 0;
  /** Seconds of Earth-swell left. */
  swell = 0;
  /** Seconds shrivelled left. */
  shrivelT = 0;
  private size = 1;
  private hintT = 0;
  private readonly power: number;
  private readonly big: number;
  private readonly shrivel: number;
  private readonly color: number;
  private readonly signal: string;
  private readonly top: number;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, o: CapOpts = {}) {
    const r = o.r ?? 1.6;
    this.power = o.power ?? 20;
    this.big = o.big ?? 1.45;
    this.shrivel = o.shrivel ?? 10;
    this.color = o.color ?? SPORE.pink;
    this.signal = o.signal ?? '';
    this.radius = r;
    const stalkH = 1.0;
    this.top = stalkH + r * 0.42;
    this.height = this.top + 0.3;
    this.capMat = matUnique(this.color, { rough: 0.5, emissive: this.color, emissiveIntensity: 0.45 });
    this.rimMat = glow(this.color);
    const dome = new THREE.Mesh(GEO.cap(), this.capMat);
    dome.scale.set(r, r * 0.5, r);
    dome.castShadow = true;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 0.98, 0.07, 5, 28), this.rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.02;
    this.cap.add(dome, rim);
    const spot = glowShared(0xfff4d8);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.4;
      const d = r * (i % 2 ? 0.62 : 0.35);
      const s = new THREE.Mesh(GEO.blobLow(), spot);
      s.scale.set(0.16 + r * 0.04, 0.06, 0.16 + r * 0.04);
      s.position.set(Math.sin(a) * d, r * 0.5 * Math.sqrt(1 - (d / r) ** 2) - 0.02, Math.cos(a) * d);
      this.cap.add(s);
    }
    mergeStatic(this.cap);
    this.cap.position.set(x, y + stalkH, z);
    game.level!.root.add(this.cap);
    this.solid = makeCyl(x, z, r * 0.9, y - 0.5, y + this.top);
    this.solid.surface = 'mud';
    this.solid.tag = CAP_TAG;
    this.solid.onStand = (who) => this.stand(who);
    game.col.add(this.solid);
  }

  private stand(who: unknown): void {
    const g = this.game;
    const p = g.player;
    if (who !== p.body || this.shrivelT > 0) return;
    const b = p.body;
    const big = p.state === 'slam' || this.swell > 0;
    // A pound turns into the bounce (the slam would otherwise pin Aster to the cap).
    if (p.state === 'slam') p.setState('move');
    b.vy = this.power * (big ? this.big : 1);
    b.grounded = false;
    this.squash = big ? 1.4 : 1;
    this.bounces++;
    g.sfx('jump', this.x, this.y, this.z, big ? 0.45 : 0.6);
    g.audio.play('gemPurple', big ? 0.45 : 0.6, 0.6);
    g.fx.sparkle(this.x, this.y + this.top + 0.3, this.z, this.color, big ? 22 : 10);
    if (big) {
      this.swell = 0;
      this.bigBounces++;
      g.fx.ring(this.x, this.y + this.top, this.z, 0.5, this.radius * 2.6, SPORE.gold, 0.45);
      g.fx.emit(this.x, this.y + this.top, this.z, {
        count: 24, speed: 7, dir: [0, 1, 0], spread: 0.6, life: [0.6, 1.2], size: [0.12, 0.22], sizeEnd: 0.3, color: SPORE.gold, bright: 2.2, drag: 1.2, gravity: 2,
      });
      g.sfx('launch', this.x, this.y, this.z, 1.1);
      g.shake(0.18, 0.2);
      if (this.signal) g.level!.emit(this.signal);
    }
  }

  takeHit(hit: Hit): HitResult {
    const g = this.game;
    if (hit.type === 'earth') {
      if (this.shrivelT > 0) return 'none';
      const was = this.swell > 0;
      this.swell = 9;
      if (!was) {
        g.sfx('rumble', this.x, this.y, this.z, 1.6, 0.5);
        g.fx.sparkle(this.x, this.y + this.top, this.z, SPORE.gold, 14);
      }
      return 'hit';
    }
    if (hit.type === 'fire' && this.shrivel > 0) {
      if (this.shrivelT <= 0) {
        g.sfx('torch', this.x, this.y, this.z, 0.8);
        g.fx.smoke(this.x, this.y + this.top, this.z, 8);
        this.swell = 0;
      }
      this.shrivelT = this.shrivel;
      return 'hit';
    }
    this.squash = Math.max(this.squash, 0.5);
    if (hit.type !== 'physical') {
      this.hintT -= 1;
      if (this.hintT <= 0) {
        this.hintT = 6;
        g.toast('A springy cap. Pound down onto it, or shake it up with Earth, for a huge bounce.', 'hint');
      }
    }
    return 'none';
  }

  update(dt: number): void {
    const g = this.game;
    this.squash = Math.max(0, this.squash - dt * 3);
    this.swell = Math.max(0, this.swell - dt);
    if (this.shrivelT > 0) {
      this.shrivelT -= dt;
      if (this.shrivelT <= 0) {
        g.sfx('jump', this.x, this.y, this.z, 0.4, 0.8);
        g.fx.sparkle(this.x, this.y + this.top, this.z, this.color, 14);
      }
    }
    // Shrivelled: a small brown stub. Swollen: fat, gold and throbbing.
    const want = this.shrivelT > 0 ? 0.42 : this.swell > 0 ? 1.18 + Math.sin(g.time * 9) * 0.04 : 1;
    this.size += (want - this.size) * Math.min(1, dt * 6);
    const k = Math.sin(this.squash * Math.PI * 3) * this.squash * 0.3;
    this.cap.scale.set(this.size * (1 + k), this.size * (1 - k), this.size * (1 + k));
    this.cap.position.y = this.y + 1.0 * (this.shrivelT > 0 ? 0.5 : 1);
    const burnt = this.shrivelT > 0;
    const hot = this.swell > 0;
    this.capMat.color.setHex(burnt ? 0x4a3830 : hot ? SPORE.gold : this.color);
    this.capMat.emissive.setHex(burnt ? 0x1a0e08 : hot ? SPORE.gold : this.color);
    this.capMat.emissiveIntensity = hot ? 0.7 + Math.sin(g.time * 9) * 0.2 : 0.45;
    this.rimMat.color.setHex(burnt ? 0x3a2a24 : hot ? 0xfff0b0 : this.color);
    this.solid.y1 = this.y + (burnt ? 0.7 : this.top);
    if (hot && rng.chance(dt * 10)) {
      g.fx.emit(this.x + rng.signed() * this.radius * 0.6, this.y + this.top + 0.2, this.z + rng.signed() * this.radius * 0.6, {
        count: 1, speed: 1, dir: [0, 1, 0], spread: 0.4, life: [0.5, 0.9], size: [0.08, 0.14], color: SPORE.gold, bright: 2, gravity: -1,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Lift caps
// ---------------------------------------------------------------------------

export interface LiftOpts {
  /** Stalk height when grown, and when burnt down. */
  high: number;
  low?: number;
  /** Cap radius. Default 2.2. */
  r?: number;
  color?: number;
  /** Seconds it takes to grow back up. Default 6. */
  grow?: number;
  /** Fired when it has been burnt down. */
  signal?: string;
}

/**
 * A tall fungus with a broad, flat cap: a table too high to climb. Fire makes
 * it shrink to a stub, and after a moment it grows back up, slowly, carrying
 * whoever stands on its cap.
 */
export class LiftCap implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius: number;
  height: number;
  private capSolid: Solid;
  private stalkSolid: Solid;
  private cap = new THREE.Group();
  private stalk: THREE.Mesh;
  private h: number;
  /** 'up' (grown), 'shrink', 'wait' (a stub), 'grow'. */
  mode: 'up' | 'shrink' | 'wait' | 'grow' = 'up';
  private t = 0;
  private hintT = 0;
  private readonly high: number;
  private readonly low: number;
  private readonly grow: number;
  private readonly signal: string;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, o: LiftOpts) {
    const r = o.r ?? 2.2;
    this.radius = r;
    this.high = o.high;
    this.low = o.low ?? 0.9;
    this.grow = o.grow ?? 6;
    this.signal = o.signal ?? '';
    this.h = this.high;
    this.height = this.high + 0.6;
    const color = o.color ?? SPORE.violet;
    this.stalk = new THREE.Mesh(GEO.cyl(), stalkMat());
    this.stalk.position.set(x, y - 0.2, z);
    this.stalk.castShadow = true;
    game.level!.root.add(this.stalk);
    const top = new THREE.Mesh(GEO.cap(), mat(color, { rough: 0.55, emissive: color, emissiveIntensity: 0.5 }));
    top.scale.set(r, r * 0.22, r);
    top.castShadow = true;
    const under = new THREE.Mesh(GEO.cyl(), mat(0x2a1a38, { rough: 1 }));
    under.scale.set(r * 0.97, 0.12, r * 0.97);
    under.position.y = -0.1;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.08, 5, 30), glowShared(color));
    rim.rotation.x = Math.PI / 2;
    this.cap.add(top, under, rim);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const d = r * (i % 3 === 0 ? 0.3 : 0.68);
      const s = new THREE.Mesh(GEO.blobLow(), glowShared(0xfff4d8));
      s.scale.set(0.2, 0.05, 0.2);
      s.position.set(Math.sin(a) * d, r * 0.22 * Math.sqrt(1 - (d / r) ** 2), Math.cos(a) * d);
      this.cap.add(s);
    }
    mergeStatic(this.cap);
    game.level!.root.add(this.cap);
    this.capSolid = makeCyl(x, z, r * 0.92, y + this.h - 0.6, y + this.h + 0.2);
    this.capSolid.dynamic = true;
    this.capSolid.surface = 'mud';
    this.capSolid.tag = CAP_TAG;
    game.col.add(this.capSolid);
    this.stalkSolid = makeCyl(x, z, 0.62, y - 1, y + this.h - 0.6);
    this.stalkSolid.dynamic = true;
    game.col.add(this.stalkSolid);
    this.place(0);
  }

  private place(dt: number): void {
    const s = this.capSolid;
    const oy = s.y1;
    s.y1 = this.y + this.h + 0.2;
    s.y0 = s.y1 - 0.8;
    s.dx = s.dz = s.dyaw = 0;
    s.dy = s.y1 - oy;
    s.pvx = s.pvz = 0;
    s.pvy = dt > 0 ? s.dy / dt : 0;
    // Only a platform on its way somewhere is unsafe footing to respawn on.
    s.unsafe = this.mode !== 'up';
    this.stalkSolid.y1 = s.y0;
    this.stalk.scale.set(0.55, this.h + 0.2, 0.55);
    this.cap.position.set(this.x, this.y + this.h, this.z);
    this.height = this.h + 0.6;
  }

  takeHit(hit: Hit): HitResult {
    const g = this.game;
    if (hit.type === 'fire') {
      if (this.mode === 'up' || this.mode === 'grow') {
        this.mode = 'shrink';
        this.t = 0;
        g.sfx('torch', this.x, this.y, this.z, 0.7);
        g.fx.smoke(this.x, this.y + this.h, this.z, 10);
      }
      return 'hit';
    }
    if (hit.type !== 'physical') {
      this.hintT -= 1;
      if (this.hintT <= 0) {
        this.hintT = 6;
        g.toast('Too tall to climb. Mushrooms shrink from fire... and grow back.', 'hint');
      }
    }
    return 'none';
  }

  update(dt: number): void {
    const g = this.game;
    this.t += dt;
    switch (this.mode) {
      case 'shrink':
        this.h = Math.max(this.low, this.h - dt * (this.high - this.low) * 1.4);
        if (rng.chance(dt * 30)) g.fx.emit(this.x + rng.signed() * this.radius * 0.7, this.y + this.h + 0.2, this.z + rng.signed() * this.radius * 0.7, {
          count: 1, speed: 1.4, dir: [0, 1, 0], life: [0.4, 0.8], size: [0.3, 0.5], sizeEnd: 0.1, color: 0xffb050, colorEnd: 0x8030ff, bright: 1.8, gravity: -2,
        });
        if (this.h <= this.low) {
          this.mode = 'wait';
          this.t = 0;
          g.sfx('rumble', this.x, this.y, this.z, 1.8, 0.4);
          if (this.signal) g.level!.emit(this.signal);
        }
        break;
      case 'wait':
        // A shiver, then it starts to grow.
        if (this.t > 1.6) {
          this.mode = 'grow';
          this.t = 0;
          g.sfx('jump', this.x, this.y, this.z, 0.35, 0.8);
        }
        break;
      case 'grow':
        this.h = Math.min(this.high, this.h + dt * (this.high - this.low) / this.grow);
        if (rng.chance(dt * 8)) g.fx.sparkle(this.x + rng.signed() * 0.6, this.y + this.h * rng.next(), this.z + rng.signed() * 0.6, SPORE.violet, 1);
        if (this.h >= this.high) {
          this.mode = 'up';
          g.fx.sparkle(this.x, this.y + this.h + 0.3, this.z, SPORE.violet, 12);
        }
        break;
      default:
        break;
    }
    const wob = this.mode === 'wait' ? Math.sin(this.t * 40) * 0.03 : 0;
    this.place(dt);
    this.cap.rotation.z = wob;
  }
}

// ---------------------------------------------------------------------------
// Spore vents
// ---------------------------------------------------------------------------

export interface VentOpts {
  /** Radius of the throat. Default 1.3. */
  r?: number;
  /** How high a puff throws Aster. Default 8. */
  h?: number;
  /** How high the frozen-open column carries her. Default the puff height. */
  frozenH?: number;
  /**
   * How far above the throat a puff still catches her: a vent that reaches
   * high throws a dragon gliding over it upward again. Default 0.6 of `h`.
   */
  reach?: number;
  /** Seconds between puffs, and where in the cycle it starts. */
  period?: number;
  phase?: number;
  /** How long each puff lasts (it throws during the first three quarters). Default 0.7. */
  puff?: number;
  /** Seconds a freeze holds it open. Default 12. */
  freeze?: number;
  /** Fired each time it is frozen open. */
  signal?: string;
}

/**
 * A fungal vent that breathes out a column of spores every few seconds: the
 * throat swells and glows gold for a moment first, then the puff throws
 * anyone standing in it high into the air. Ice freezes it open: a steady,
 * frosted column that lifts Aster up and holds her there, higher than a puff
 * reaches, until it thaws.
 */
export class SporeVent implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius: number;
  readonly height = 2;
  frozen = false;
  /** Puffs so far (for scenarios and the realm's hints). */
  puffs = 0;
  private t: number;
  private frozenT = 0;
  private chill = 0;
  private coreMat: THREE.MeshBasicMaterial;
  private core: THREE.Mesh;
  private colMat: THREE.MeshBasicMaterial;
  private col: THREE.Mesh;
  private frost: THREE.Mesh;
  private fxT = 0;
  private hintT = 0;
  private launched = false;
  /** This puff has already thrown Aster (a puff throws once, however long she stays in it). */
  private threw = false;
  private readonly h: number;
  private readonly frozenH: number;
  private readonly reach: number;
  private readonly period: number;
  private readonly freezeFor: number;
  private readonly signal: string;
  private readonly puffLen: number;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, o: VentOpts = {}) {
    this.radius = o.r ?? 1.3;
    this.h = o.h ?? 8;
    this.frozenH = o.frozenH ?? this.h;
    this.reach = o.reach ?? this.h * 0.6;
    this.period = o.period ?? 3.2;
    this.puffLen = o.puff ?? 0.7;
    this.t = ((o.phase ?? 0) % this.period + this.period) % this.period;
    this.freezeFor = o.freeze ?? 12;
    this.signal = o.signal ?? '';
    const r = this.radius;
    this.coreMat = glow(SPORE.gold);
    this.core = new THREE.Mesh(new THREE.CircleGeometry(r * 0.8, 20), this.coreMat);
    this.core.rotation.x = -Math.PI / 2;
    this.core.position.set(x, y + 0.12, z);
    game.level!.root.add(this.core);
    this.colMat = new THREE.MeshBasicMaterial({ color: SPORE.gold, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const colGeo = new THREE.CylinderGeometry(r * 0.75, r * 0.9, 1, 18, 1, true);
    colGeo.translate(0, 0.5, 0);
    this.col = new THREE.Mesh(colGeo, this.colMat);
    this.col.position.set(x, y, z);
    this.col.visible = false;
    game.level!.root.add(this.col);
    this.frost = new THREE.Mesh(new THREE.TorusGeometry(r * 1.05, 0.28, 6, 18), mat(SPORE.ice, { rough: 0.15, emissive: 0x4ab0e0, emissiveIntensity: 0.5, flat: true }));
    this.frost.rotation.x = Math.PI / 2;
    this.frost.position.set(x, y + 0.25, z);
    this.frost.visible = false;
    game.level!.root.add(this.frost);
  }

  /** Seconds until the next puff starts (0 while one is going). */
  get untilPuff(): number {
    const at = this.period - this.puffLen;
    return this.t >= at ? 0 : at - this.t;
  }

  get puffing(): boolean {
    return !this.frozen && this.t >= this.period - this.puffLen;
  }

  takeHit(hit: Hit): HitResult {
    const g = this.game;
    if (hit.type === 'ice') {
      if (this.frozen) {
        this.frozenT = 0;
        return 'hit';
      }
      this.chill += hit.buildup + hit.damage;
      g.fx.sparkle(this.x, this.y + 0.6, this.z, SPORE.ice, 2);
      if (this.chill >= 50) this.freeze();
      return 'hit';
    }
    if (hit.type !== 'physical') {
      this.hintT -= 1;
      if (this.hintT <= 0) {
        this.hintT = 6;
        g.toast('The vent breathes in and out. Ice would hold it open.', 'hint');
      }
    }
    return 'none';
  }

  private freeze(): void {
    const g = this.game;
    this.frozen = true;
    this.frozenT = 0;
    this.frost.visible = true;
    g.sfx('iceCrack', this.x, this.y, this.z);
    g.fx.shatter(this.x, this.y + 0.6, this.z, SPORE.ice);
    if (this.signal) g.level!.emit(this.signal);
  }

  private thaw(): void {
    const g = this.game;
    this.frozen = false;
    this.chill = 0;
    this.frost.visible = false;
    this.t = 0;
    g.sfx('steam', this.x, this.y, this.z, 1.2, 0.6);
    g.fx.splash(this.x, this.y + 0.4, this.z, SPORE.ice);
  }

  /** Is the dragon standing or flying in the column (up to `h` above the throat)? */
  private inColumn(h: number): boolean {
    const b = this.game.player.body;
    return Math.hypot(b.x - this.x, b.z - this.z) < this.radius + 0.25 && b.y > this.y - 0.6 && b.y < this.y + h;
  }

  update(dt: number): void {
    const g = this.game;
    const p = g.player;
    const b = p.body;
    this.fxT -= dt;
    if (this.frozen) {
      this.frozenT += dt;
      const left = this.freezeFor - this.frozenT;
      // A steady column: up it goes, and hovers at the top.
      const H = this.frozenH;
      this.col.visible = true;
      this.col.scale.set(1, H, 1);
      this.colMat.color.setHex(SPORE.ice);
      this.colMat.opacity = left < 2.5 ? 0.12 + (Math.sin(g.time * 22) > 0 ? 0.1 : 0) : 0.2 + Math.sin(g.time * 3) * 0.04;
      this.coreMat.color.setHex(SPORE.ice);
      if (p.alive && this.inColumn(H + 0.5)) {
        if (p.state === 'slam') p.setState('move');
        if (b.y < this.y + H - 0.4) b.vy = Math.max(b.vy, 9);
        else b.vy = Math.max(b.vy, 1.5);
        b.grounded = false;
      }
      if (this.fxT <= 0) {
        this.fxT = 0.05;
        const a = rng.next() * Math.PI * 2;
        const rr = rng.next() * this.radius * 0.8;
        g.fx.emit(this.x + Math.sin(a) * rr, this.y + 0.3, this.z + Math.cos(a) * rr, {
          count: 1, speed: 9, dir: [0, 1, 0], spread: 0.05, life: [H / 10, H / 8], size: [0.1, 0.18], sizeEnd: 0.4, color: 0xe0f8ff, bright: 1.4, drag: 0,
        });
      }
      if (left <= 0) this.thaw();
      return;
    }
    this.chill = Math.max(0, this.chill - dt * 8);
    this.t += dt;
    if (this.t >= this.period) {
      this.t -= this.period;
      this.launched = false;
      this.threw = false;
    }
    const puffAt = this.period - this.puffLen;
    const warn = smoothstep(puffAt - 1.1, puffAt, this.t);
    const puffing = this.t >= puffAt;
    this.coreMat.color.setHex(SPORE.gold).multiplyScalar(0.35 + warn * 0.65 + (puffing ? 0.3 : 0));
    this.core.scale.setScalar(0.7 + warn * 0.35);
    if (warn > 0 && !puffing && rng.chance(dt * 14)) g.fx.sparkle(this.x + rng.signed() * this.radius * 0.6, this.y + 0.3, this.z + rng.signed() * this.radius * 0.6, SPORE.gold, 1);
    if (puffing) {
      const k = (this.t - puffAt) / this.puffLen;
      if (!this.launched) {
        this.launched = true;
        this.puffs++;
        g.sfx('steam', this.x, this.y, this.z, 0.7, 0.8);
        g.fx.ring(this.x, this.y + 0.2, this.z, this.radius * 0.5, this.radius * 2.2, SPORE.gold, 0.4);
      }
      this.col.visible = true;
      this.col.scale.set(1, this.h * (0.4 + k * 0.8), 1);
      this.colMat.color.setHex(SPORE.gold);
      this.colMat.opacity = 0.32 * (1 - k * 0.7);
      if (this.fxT <= 0) {
        this.fxT = 0.03;
        g.fx.emit(this.x, this.y + 0.4, this.z, {
          count: 3, speed: this.h * 1.6, dir: [0, 1, 0], spread: 0.18, life: [0.6, 0.9], size: [0.18, 0.3], sizeEnd: 1.2, color: SPORE.gold, colorEnd: 0xff8ad8,
          bright: 1.8, drag: 2, jitter: this.radius * 0.5,
        });
      }
      // The first part of a puff throws whoever is in it, once: `h` higher than wherever she was.
      if (!this.threw && p.alive && k < 0.75 && this.inColumn(this.reach)) {
        this.threw = true;
        if (p.state === 'slam') p.setState('move');
        // A throw, not an updraft: a glider is tossed like a jumper (held wings would carry her on up forever).
        p.gliding = false;
        b.vy = Math.max(b.vy, Math.sqrt(2 * 32 * this.h));
        b.grounded = false;
        g.sfx('launch', this.x, this.y, this.z, 1.2, 0.8);
      }
    } else {
      this.col.visible = false;
      if (this.fxT <= 0 && Math.hypot(b.x - this.x, b.z - this.z) < 40) {
        this.fxT = 0.25;
        g.fx.emit(this.x + rng.signed() * this.radius * 0.5, this.y + 0.3, this.z + rng.signed() * this.radius * 0.5, {
          count: 1, speed: 0.6, dir: [0, 1, 0], spread: 0.4, life: [1, 1.8], size: [0.08, 0.14], sizeEnd: 0.3, color: SPORE.gold, bright: 1.6, gravity: -0.3,
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Glowthreads: nodes, threads and what they power
// ---------------------------------------------------------------------------

/** Something a glowthread's pulse can power. */
export interface ThreadSink {
  /** The pulse has arrived (through thread `i`, for sinks fed by several). */
  power(i: number): void;
}

export interface ThreadOpts {
  /** Metres per second the pulse runs. Default 7. */
  speed?: number;
  color?: number;
  /** Fired when the pulse arrives. */
  signal?: string;
  /** Which input of the sink this thread feeds. */
  input?: number;
}

/**
 * A glowing bulb on a stalk, and the thread of light that runs from it
 * across the ground and walls. Lightning wakes the bulb and sends a bead of
 * light down the thread; when it arrives, the thread's sink is powered (a
 * door opens, a bridge lights). While a pulse is on its way the node rests.
 */
export class Glowthread implements Prop, Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius = 0.8;
  readonly height = 2.4;
  /** Metres along the thread the pulse has run, or -1 when none is running. */
  pulse = -1;
  readonly length: number;
  private curve: THREE.CatmullRomCurve3;
  private bulbMat: THREE.MeshBasicMaterial;
  private bulb: THREE.Mesh;
  private bead: THREE.Mesh;
  private threadMat: THREE.MeshBasicMaterial;
  private glowT = 0;
  private hintT = 0;
  private readonly speed: number;
  private readonly color: number;
  private readonly signal: string;
  private readonly input: number;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, path: THREE.Vector3[], private sink: ThreadSink | null, o: ThreadOpts = {}) {
    this.speed = o.speed ?? 7;
    this.color = o.color ?? SPORE.teal;
    this.signal = o.signal ?? '';
    this.input = o.input ?? 0;
    const root = new THREE.Group();
    const stalk = new THREE.Mesh(taperedTube([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.12, 0.9, 0.05), new THREE.Vector3(-0.05, 1.7, 0)], 0.22, 0.12, 8, 6, false),
      mat(0xd8d0e0, { rough: 0.8, emissive: 0x2a4a50, emissiveIntensity: 0.4 }));
    stalk.castShadow = true;
    root.add(stalk);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const leaf = new THREE.Mesh(GEO.cone(), mat(0x3a2a58, { rough: 0.9 }));
      leaf.scale.set(0.14, 0.7, 0.14);
      leaf.position.set(Math.sin(a) * 0.15, 1.75, Math.cos(a) * 0.15);
      leaf.rotation.set(Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9);
      root.add(leaf);
    }
    this.bulbMat = glow(this.color);
    this.bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), this.bulbMat);
    this.bulb.position.y = 2.05;
    this.bulb.userData.keep = true;
    root.add(this.bulb);
    mergeStatic(root);
    root.position.set(x, y, z);
    game.level!.root.add(root);
    game.col.add(makeCyl(x, z, 0.3, y, y + 1.6));
    // The thread: from the foot of the node along `path`.
    const pts = [new THREE.Vector3(x, y + 0.15, z), ...path];
    this.curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1);
    this.length = this.curve.getLength();
    this.threadMat = new THREE.MeshBasicMaterial({ color: this.color });
    const seg = Math.max(8, Math.round(this.length * 1.5));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(this.curve, seg, 0.06, 5, false), this.threadMat);
    game.level!.root.add(tube);
    this.bead = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), glow(0xffffff, 0.95, true));
    this.bead.visible = false;
    game.level!.root.add(this.bead);
    this.dim();
  }

  private dim(): void {
    this.threadMat.color.setHex(this.color).multiplyScalar(0.28);
  }

  /** Where along the thread a point `d` metres from the node lies. */
  pointAt(d: number, out = new THREE.Vector3()): THREE.Vector3 {
    return this.curve.getPointAt(clamp01(d / Math.max(0.01, this.length)), out);
  }

  /** Sends a pulse, as a Lightning strike does. */
  send(): boolean {
    if (this.pulse >= 0) return false;
    const g = this.game;
    this.pulse = 0;
    this.glowT = 1;
    this.bead.visible = true;
    g.sfx('zap', this.x, this.y + 2, this.z, 1.3, 0.8);
    g.sfx('switch', this.x, this.y, this.z, 1.5, 0.6);
    g.fx.ring(this.x, this.y + 0.2, this.z, 0.3, 2.5, this.color, 0.4);
    return true;
  }

  takeHit(hit: Hit): HitResult {
    if (hit.type === 'lightning') {
      this.send();
      return 'hit';
    }
    if (hit.type !== 'physical') {
      this.hintT -= 1;
      if (this.hintT <= 0) {
        this.hintT = 6;
        this.game.toast('The bulb flickers and goes dark. It wants a spark: Lightning.', 'hint');
      }
    }
    return 'none';
  }

  update(dt: number): void {
    const g = this.game;
    this.glowT = Math.max(0, this.glowT - dt * 0.8);
    const idle = 0.45 + Math.sin(g.time * 2.4 + this.x) * 0.12;
    this.bulbMat.color.setHex(this.color).multiplyScalar(Math.min(1.4, idle + this.glowT * 0.9));
    this.bulb.scale.setScalar(1 + this.glowT * 0.25);
    if (this.pulse < 0) return;
    this.pulse += this.speed * dt;
    this.pointAt(this.pulse, this.bead.position);
    this.bead.scale.setScalar(1 + Math.sin(g.time * 30) * 0.15);
    // The thread behind the bead glows, fading back to dim.
    const k = clamp01(this.pulse / this.length);
    this.threadMat.color.setHex(this.color).multiplyScalar(0.28 + 0.9 * (1 - Math.abs(k - 0.5) * 0.6));
    if (rng.chance(dt * 40)) g.fx.sparkle(this.bead.position.x, this.bead.position.y, this.bead.position.z, this.color, 1);
    if (this.pulse >= this.length) {
      this.pulse = -1;
      this.bead.visible = false;
      this.dim();
      g.sfx('zap', this.bead.position.x, this.bead.position.y, this.bead.position.z, 1.6, 0.6);
      this.sink?.power(this.input);
      if (this.signal) g.level!.emit(this.signal);
    }
  }
}

/**
 * A door of fungal gills across an arch: powered, the gills fold up into the
 * lintel for `hold` seconds, flicker for the last second and a half, and drop
 * shut again (shoving anyone caught under it out of the way). `openForever`
 * leaves it open for good.
 */
export class CapDoor implements Prop, ThreadSink {
  private solid: Solid;
  private root = new THREE.Group();
  private gillMat: THREE.MeshStandardMaterial;
  /** 0 shut .. 1 open. */
  private k = 0;
  private openT = 0;
  forever = false;

  constructor(private game: Game, readonly x: number, readonly y: number, readonly z: number, private w: number, private h: number, private yaw: number,
    private hold: number, readonly signal = '') {
    this.solid = makeBox(x, z, w / 2, 0.5, y - 1, y + h, yaw);
    game.col.add(this.solid);
    this.gillMat = matUnique(0x6a3a8a, { rough: 0.7, emissive: SPORE.violet, emissiveIntensity: 0.25 });
    const n = Math.max(5, Math.round(w / 0.45));
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n - 0.5;
      const gill = new THREE.Mesh(GEO.box(), this.gillMat);
      const hh = h * (0.92 - Math.abs(u) * 0.3);
      gill.scale.set(w / n * 0.8, hh, 0.35 + (i % 2) * 0.15);
      gill.position.set(u * w, hh / 2, (i % 2) * 0.08);
      gill.castShadow = true;
      this.root.add(gill);
    }
    const edge = new THREE.Mesh(GEO.box(), glowShared(SPORE.violet));
    edge.scale.set(w, 0.12, 0.6);
    edge.position.y = 0.06;
    this.root.add(edge);
    mergeStatic(this.root);
    this.root.position.set(x, y, z);
    this.root.rotation.y = yaw;
    game.level!.root.add(this.root);
  }

  get isOpen(): boolean {
    return !this.solid.enabled;
  }

  power(): void {
    if (this.forever) return;
    if (this.openT <= 0) this.game.sfx('door', this.x, this.y, this.z, 1.3);
    this.openT = this.hold;
  }

  openForever(): void {
    if (this.forever) return;
    this.forever = true;
    this.openT = 1;
    this.game.sfx('unlock', this.x, this.y, this.z);
    if (this.signal) this.game.level!.emit(this.signal);
  }

  update(dt: number): void {
    const g = this.game;
    if (!this.forever) this.openT = Math.max(0, this.openT - dt);
    const want = this.openT > 0 ? 1 : 0;
    const was = this.k;
    this.k += (want - this.k) * Math.min(1, dt * (want ? 7 : 10));
    if (Math.abs(this.k - want) < 0.01) this.k = want;
    this.root.position.y = this.y + this.k * (this.h * 0.85);
    this.root.scale.y = 1 - this.k * 0.8;
    const warn = !this.forever && this.openT > 0 && this.openT < 1.5;
    this.gillMat.emissiveIntensity = warn ? (Math.sin(g.time * 28) > 0 ? 0.9 : 0.2) : 0.25 + this.k * 0.5;
    const open = this.k > 0.7;
    if (this.solid.enabled && open) this.solid.enabled = false;
    else if (!this.solid.enabled && !open) {
      this.solid.enabled = true;
      if (was > this.k) {
        g.sfx('pound', this.x, this.y, this.z, 1.4, 0.5);
        this.shove();
      }
    }
  }

  /** Caught in the doorway as it drops: out to whichever side is nearer. */
  private shove(): void {
    const g = this.game;
    const b = g.player.body;
    const nx = Math.sin(this.yaw);
    const nz = Math.cos(this.yaw);
    const along = (b.x - this.x) * nx + (b.z - this.z) * nz;
    const across = (b.x - this.x) * nz - (b.z - this.z) * nx;
    if (Math.abs(along) > 0.5 + b.radius || Math.abs(across) > this.w / 2 + b.radius || b.y > this.y + this.h) return;
    const side = along >= 0 ? 1 : -1;
    const push = side * (0.5 + b.radius + 0.2) - along;
    g.player.place(b.x + nx * push, b.y, b.z + nz * push, g.player.yaw);
  }
}

/**
 * A bridge of light over a gap: planks of glowing mycelium that are there
 * only while lit. Powered, a bead of light runs across it and lights the
 * planks one by one; each stays solid for `hold` seconds after the bead
 * passed it, so they go out in the same order: follow the light across.
 */
export class LightBridge implements Prop, ThreadSink {
  private planks: { x: number; y: number; z: number; solid: Solid; litT: number }[] = [];
  private mesh: THREE.InstancedMesh;
  private run = -1;
  private readonly yaw: number;
  private readonly spacing: number;
  private col = new THREE.Color();
  private m4 = new THREE.Matrix4();
  private q = new THREE.Quaternion();

  constructor(private game: Game, ax: number, ay: number, az: number, bx: number, by: number, bz: number, readonly w: number, private hold: number,
    private speed = 7, readonly signal = '') {
    const len = Math.hypot(bx - ax, bz - az);
    this.yaw = Math.atan2(bx - ax, bz - az);
    const n = Math.max(3, Math.round(len / 1.15));
    this.spacing = len / n;
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), n);
    this.q.setFromAxisAngle(UP, this.yaw);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      const z = az + (bz - az) * t;
      const solid = makeBox(x, z, w / 2, this.spacing / 2 + 0.02, y - 0.3, y, this.yaw);
      solid.enabled = false;
      solid.unsafe = true;
      solid.surface = 'wood';
      game.col.add(solid);
      this.planks.push({ x, y, z, solid, litT: 0 });
      this.m4.compose(new THREE.Vector3(x, y - 0.15, z), this.q, new THREE.Vector3(w, 0.22, this.spacing * 0.86));
      this.mesh.setMatrixAt(i, this.m4);
      this.mesh.setColorAt(i, this.col.setHex(SPORE.teal).multiplyScalar(0.12));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2), len / 2 + w + 1);
    game.level!.root.add(this.mesh);
  }

  /** Planks lit right now. */
  get lit(): number {
    return this.planks.filter((p) => p.solid.enabled).length;
  }

  power(): void {
    this.run = 0;
    this.game.sfx('unlock', this.planks[0]!.x, this.planks[0]!.y, this.planks[0]!.z, 1.4, 0.7);
  }

  update(dt: number): void {
    const g = this.game;
    if (this.run >= 0) {
      this.run += dt * this.speed;
      const upTo = Math.floor(this.run / this.spacing);
      this.planks.forEach((p, i) => {
        if (i <= upTo && p.litT <= 0 && this.run - i * this.spacing < this.spacing * 1.5) {
          p.litT = this.hold;
          g.fx.sparkle(p.x, p.y + 0.2, p.z, SPORE.teal, 3);
          if (i % 3 === 0) g.audio.play('gem', 1 + i * 0.04, 0.35);
        }
      });
      if (upTo >= this.planks.length) this.run = -1;
    }
    this.planks.forEach((p, i) => {
      if (p.litT > 0) {
        p.litT -= dt;
        if (p.litT <= 0) {
          p.litT = 0;
          g.fx.sparkle(p.x, p.y, p.z, SPORE.teal, 2);
        }
      }
      const on = p.litT > 0;
      p.solid.enabled = on;
      const warn = on && p.litT < 1.2;
      const k = on ? (warn ? (Math.sin(g.time * 26 + i) > 0 ? 1 : 0.35) : 1) : 0.12 + Math.sin(g.time * 2 + i * 0.7) * 0.04;
      this.mesh.setColorAt(i, this.col.setHex(on ? 0xbafff4 : SPORE.teal).multiplyScalar(k));
    });
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

/**
 * A door with two sockets, each fed by its own thread: a socket stays lit for
 * `window` seconds after its pulse arrives, and the door opens for good only
 * when both are lit at once. Threads of different lengths make it a puzzle
 * of timing: send the slow pulse first.
 */
export class TwinLock implements Prop, ThreadSink {
  private lit = [0, 0];
  private mats: THREE.MeshBasicMaterial[] = [];
  private sockets: THREE.Mesh[] = [];
  solved = false;

  constructor(private game: Game, private door: CapDoor, sockets: [number, number, number][], private window = 2.5) {
    for (const [x, y, z] of sockets) {
      const m = glow(0x2a3a40);
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), m);
      s.scale.y = 1.4;
      s.position.set(x, y, z);
      game.level!.root.add(s);
      this.mats.push(m);
      this.sockets.push(s);
    }
  }

  /** How many sockets are lit right now. */
  get litCount(): number {
    return this.lit.filter((t) => t > 0).length;
  }

  power(i: number): void {
    if (this.solved) return;
    const g = this.game;
    this.lit[i] = this.window;
    const s = this.sockets[i];
    if (s) g.fx.sparkle(s.position.x, s.position.y, s.position.z, SPORE.teal, 10);
    if (this.lit.every((t) => t > 0)) {
      this.solved = true;
      this.door.openForever();
    } else {
      g.sfx('switch', this.door.x, this.door.y, this.door.z, 1.2, 0.7);
    }
  }

  update(dt: number): void {
    const g = this.game;
    this.lit.forEach((t, i) => {
      const left = Math.max(0, t - dt);
      if (t > 0 && left === 0 && !this.solved) g.sfx('dragonTimeOff', this.door.x, this.door.y, this.door.z, 1.6, 0.5);
      this.lit[i] = this.solved ? 1 : left;
      const on = this.lit[i]! > 0;
      const warn = on && !this.solved && left < 0.8;
      this.mats[i]!.color.setHex(on ? (warn && Math.sin(g.time * 30) > 0 ? 0x4a8a88 : 0xbafff4) : 0x2a3a40);
      this.sockets[i]!.rotation.y += dt * (on ? 3 : 0.5);
    });
  }
}

// ---------------------------------------------------------------------------
// Blight clouds
// ---------------------------------------------------------------------------

export interface BlightOpts {
  /** Seconds it stays burnt away before it has crept back. Default 9. */
  regrow?: number;
  /** Fired each time it is burnt away. */
  signal?: string;
  /** Damage per sting. Default 7. */
  damage?: number;
}

/**
 * A wall of choking blight spores filling a passage `w` across and `d`
 * deep (along `yaw`), `h` high. Standing in it stings and shoves Aster back
 * out the way she came. Fire burns it away in a moment; it creeps back after
 * `regrow` seconds (the last two and a half of them it visibly gathers
 * again), so a burnt passage is a race.
 */
export class BlightCloud extends Hazard implements Hittable {
  readonly isEnemy = false;
  alive = true;
  readonly radius: number;
  readonly height: number;
  /** 'full', 'burn' (going up in flames), 'gone', 'creep' (gathering again). */
  mode: 'full' | 'burn' | 'gone' | 'creep' = 'full';
  burns = 0;
  private stateT = 0;
  private heat = 0;
  private sting = 0;
  /** The face Aster came in by (+1 or -1 along the passage), while she is inside. */
  private entry = 0;
  private blobs: THREE.InstancedMesh;
  private base: { x: number; y: number; z: number; s: number; ph: number }[] = [];
  private blobMat: THREE.MeshStandardMaterial;
  private fx2 = 0;
  private m4 = new THREE.Matrix4();
  private readonly cos: number;
  private readonly sin: number;
  private readonly regrow: number;
  private readonly sig: string;
  private readonly dmg: number;
  private vis = 1;

  constructor(private world: Game, x: number, y: number, z: number, readonly w: number, readonly d: number, readonly yaw: number, readonly hh: number, o: BlightOpts = {}) {
    super(world, x, y, z, 0.01, 0.01, hh, o.damage ?? 7, 'shadow');
    this.radius = Math.max(w, d) * 0.5;
    this.height = hh;
    this.cos = Math.cos(yaw);
    this.sin = Math.sin(yaw);
    this.regrow = o.regrow ?? 9;
    this.sig = o.signal ?? '';
    this.dmg = o.damage ?? 7;
    const n = Math.max(10, Math.min(34, Math.round((w * d * hh) / 3.5)));
    this.blobMat = matUnique(0x4a5236, { rough: 1, emissive: 0x7a8a30, emissiveIntensity: 0.3, transparent: true, opacity: 0.5 });
    this.blobMat.depthWrite = false;
    this.blobs = new THREE.InstancedMesh(GEO.blob(), this.blobMat, n);
    for (let i = 0; i < n; i++) {
      const u = (rng.next() - 0.5) * w * 0.9;
      const v = (rng.next() - 0.5) * d * 0.8;
      const yy = y + 0.4 + rng.next() * (hh - 0.6);
      const s = 0.7 + rng.next() * Math.min(1.2, Math.min(w, hh) * 0.3);
      // Local (u across, v along the passage) to world.
      this.base.push({ x: x + this.cos * u + this.sin * v, y: yy, z: z - this.sin * u + this.cos * v, s, ph: rng.next() * 6 });
    }
    this.blobs.boundingSphere = new THREE.Sphere(new THREE.Vector3(x, y + hh / 2, z), Math.hypot(w, d, hh) / 2 + 2.5);
    world.level!.root.add(this.blobs);
    this.layout(1);
    world.level!.props.push(this);
    world.level!.hazards.push(this);
    world.level!.hittables.push(this);
  }

  /** Local coordinates: across (u) and along (v) the passage. */
  private local(px: number, pz: number): { u: number; v: number } {
    const dx = px - this.x;
    const dz = pz - this.z;
    return { u: dx * this.cos - dz * this.sin, v: dx * this.sin + dz * this.cos };
  }

  /** Harmful right now? */
  get thick(): boolean {
    return this.mode === 'full' || (this.mode === 'creep' && this.stateT > 2.5 * 0.6);
  }

  override contains(px: number, py: number, pz: number): boolean {
    if (!this.thick) return false;
    const { u, v } = this.local(px, pz);
    return Math.abs(u) < this.w / 2 && Math.abs(v) < this.d / 2 && py < this.y + this.hh && py > this.y - 0.8;
  }

  takeHit(hit: Hit): HitResult {
    if (hit.type !== 'fire') return 'none';
    if (this.mode === 'burn' || this.mode === 'gone') return 'none';
    this.heat += Math.max(hit.damage, 3);
    if (this.heat >= 8) this.burn();
    return 'hit';
  }

  /** Goes up in flames (as Fire does). */
  burn(): void {
    const g = this.world;
    this.mode = 'burn';
    this.stateT = 0;
    this.heat = 0;
    this.burns++;
    g.sfx('fireBurst', this.x, this.y, this.z, 0.9);
    g.fx.explosion(this.x, this.y + this.hh * 0.5, this.z, Math.min(3, this.radius), 0xffa040, 0x5a7020);
    if (this.sig) g.level!.emit(this.sig);
  }

  private layout(k: number): void {
    const g = this.world;
    this.base.forEach((p, i) => {
      const s = p.s * k * (1 + Math.sin(g.time * 1.3 + p.ph) * 0.08);
      this.m4.makeScale(s, s * 0.8, s);
      this.m4.setPosition(p.x + Math.sin(g.time * 0.5 + p.ph) * 0.3, p.y + Math.sin(g.time * 0.7 + p.ph * 2) * 0.2, p.z + Math.cos(g.time * 0.4 + p.ph) * 0.3);
      this.blobs.setMatrixAt(i, this.m4);
    });
    this.blobs.instanceMatrix.needsUpdate = true;
  }

  override update(dt: number): void {
    const g = this.world;
    this.stateT += dt;
    this.heat = Math.max(0, this.heat - dt * 4);
    let k = 1;
    switch (this.mode) {
      case 'burn': {
        k = 1 - this.stateT / 0.8;
        this.blobMat.emissive.setHex(0xff8030);
        this.blobMat.emissiveIntensity = 0.9;
        if (rng.chance(0.8)) {
          const p = this.base[Math.floor(rng.next() * this.base.length)]!;
          g.fx.emit(p.x, p.y, p.z, { count: 2, speed: 2, dir: [0, 1, 0], spread: 0.6, life: [0.4, 0.8], size: [0.4, 0.7], sizeEnd: 0.1, color: 0xffc060, colorEnd: 0xff3010, bright: 2, gravity: -3 });
          if (rng.chance(0.4)) g.fx.smoke(p.x, p.y, p.z, 2, 0x4a4a30);
        }
        if (this.stateT >= 0.8) {
          this.mode = 'gone';
          this.stateT = 0;
        }
        break;
      }
      case 'gone':
        k = 0;
        if (this.stateT >= this.regrow - 2.5) {
          this.mode = 'creep';
          this.stateT = 0;
          g.sfx('steam', this.x, this.y, this.z, 0.6, 0.7);
        }
        break;
      case 'creep': {
        k = smoothstep(0, 2.5, this.stateT);
        this.blobMat.emissive.setHex(0x7a8a30);
        this.blobMat.emissiveIntensity = 0.3;
        if (rng.chance(dt * 20)) {
          const p = this.base[Math.floor(rng.next() * this.base.length)]!;
          g.fx.emit(p.x, p.y, p.z, { count: 1, speed: 0.6, life: [0.6, 1], size: [0.3, 0.5], sizeEnd: 1.2, color: 0x9ab050, alpha: 0.4, additive: false });
        }
        if (this.stateT >= 2.5) {
          this.mode = 'full';
          this.stateT = 0;
        }
        break;
      }
      default:
        this.blobMat.emissiveIntensity = 0.3 + Math.sin(g.time * 2) * 0.06;
        break;
    }
    this.vis += (k - this.vis) * Math.min(1, dt * 10);
    this.blobs.visible = this.vis > 0.02;
    const p = g.player;
    const near = Math.hypot(p.x - this.x, p.z - this.z) < 45;
    if (this.blobs.visible && near) this.layout(this.vis);
    // Spores drift off it all the while.
    this.fx2 -= dt;
    if (this.thick && near && this.fx2 <= 0) {
      this.fx2 = 0.12;
      const b = this.base[Math.floor(rng.next() * this.base.length)]!;
      g.fx.emit(b.x, b.y, b.z, { count: 1, speed: 0.4, spread: 1, life: [1.2, 2], size: [0.06, 0.12], sizeEnd: 0.3, color: 0xd0f070, bright: 1.4, gravity: -0.1 });
    }
    // It stings, thickens the air like mud, and shoves back out the way she came in.
    this.sting -= dt;
    const inside = p.alive && this.contains(p.x, p.y + 0.3, p.z);
    if (!inside) this.entry = 0;
    else {
      if (this.entry === 0) this.entry = this.local(p.x, p.z).v >= 0 ? 1 : -1;
      const k = Math.exp(-7 * dt);
      p.body.vx *= k;
      p.body.vz *= k;
    }
    if (this.sting <= 0 && inside) {
      this.sting = 0.5;
      const side = this.entry;
      p.takeHit(makeHit({
        damage: this.dmg * g.difficultyInfo.enemyDamage, type: 'shadow', dirX: this.sin * side, dirZ: this.cos * side, knockback: 9, launch: 3,
        source: 'env', move: 'blight', fromPlayer: false, ox: this.x - this.sin * side * 3, oz: this.z - this.cos * side * 3,
      }), null);
      g.fx.emit(p.x, p.y + 1, p.z, { count: 6, speed: 2, spread: 1, life: [0.4, 0.7], size: [0.2, 0.3], sizeEnd: 0.8, color: 0xb0d060, alpha: 0.6, additive: false });
    }
  }
}

// ---------------------------------------------------------------------------
// Builder helpers: static parts to the decor batch, the prop to the level
// ---------------------------------------------------------------------------

/** A bounce cap at (x, z) (on the ground there, or at `y`). */
export function bounceCap(b: Builder, x: number, z: number, o: CapOpts = {}, y?: number): BounceCap {
  const gy = y ?? b.y(x, z);
  const r = o.r ?? 1.6;
  const stalk = stalkMat();
  b.decor.add(GEO.cyl(), stalk, x, gy - 0.3, z, 0.3 + r * 0.12, 1.4, 0.3 + r * 0.12);
  b.decor.add(GEO.cyl(), stalk, x, gy - 0.2, z, 0.5 + r * 0.18, 0.45, 0.5 + r * 0.18);
  const c = new BounceCap(b.game, x, gy, z, o);
  b.level.props.push(c);
  b.level.hittables.push(c);
  return c;
}

/**
 * A bracket fungus growing out of a wall at (x, z), its standable top at
 * `top`, reaching out along `yaw` (away from the wall): a ledge, with a
 * glowing rim so it reads from below. No prop; one solid.
 */
export function shelfCap(b: Builder, x: number, z: number, top: number, r: number, yaw: number, color: number = SPORE.gold): Solid {
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const capM = capMat(color);
  // Seen from below (as a climber mostly sees them), the gills glow a little.
  const under = glowShared(0x4a2a6a);
  // Two tiers of shelf, the lower one smaller, like the real thing.
  b.decor.add(GEO.cap(), capM, x, top - 0.35, z, r, 0.45, r, 0, yaw, 0);
  b.decor.add(GEO.cyl(), under, x, top - 0.45, z, r * 0.96, 0.12, r * 0.96, 0, 0, 0, false);
  b.decor.add(GEO.cyl(), glowShared(color), x, top - 0.38, z, r * 1.01, 0.06, r * 1.01, 0, 0, 0, false);
  b.decor.add(GEO.cap(), capM, x - fx * r * 0.3, top - 1.3, z - fz * r * 0.3, r * 0.6, 0.3, r * 0.6, 0, yaw, 0);
  // The stem back into the wall.
  b.decor.add(GEO.cone(), stalkMat(), x - fx * r * 0.6, top - 2.2, z - fz * r * 0.6, 0.5, 1.9, 0.5, 0, 0, 0, false);
  for (let i = 0; i < 4; i++) {
    const a = yaw + (i - 1.5) * 0.7;
    b.decor.add(GEO.blobLow(), glowShared(0xfff4d8), x + Math.sin(a) * r * 0.55, top - 0.02, z + Math.cos(a) * r * 0.55, 0.14, 0.05, 0.14, 0, 0, 0, false);
  }
  const s = makeCyl(x, z, r * 0.88, top - 0.8, top);
  s.surface = 'mud';
  s.tag = CAP_TAG;
  b.col.add(s);
  return s;
}

/** A lift cap at (x, z) on the ground there (or at `y`). */
export function liftCap(b: Builder, x: number, z: number, o: LiftOpts, y?: number): LiftCap {
  const gy = y ?? b.y(x, z);
  b.decor.add(GEO.cyl(), stalkMat(), x, gy - 0.2, z, 1.1, 0.6, 1.1);
  const c = new LiftCap(b.game, x, gy, z, o);
  b.level.props.push(c);
  b.level.hittables.push(c);
  return c;
}

/** A spore vent at (x, z): fleshy lips round a glowing throat. */
export function sporeVent(b: Builder, x: number, z: number, o: VentOpts = {}, y?: number): SporeVent {
  const gy = y ?? b.y(x, z);
  const r = o.r ?? 1.3;
  const lip = mat(0x8a4a8a, { rough: 0.7, emissive: 0x4a1a5a, emissiveIntensity: 0.4 });
  const lip2 = mat(0x6a3a7a, { rough: 0.8 });
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const s = 0.55 + (i % 3) * 0.12;
    b.decor.add(GEO.blob(), i % 2 ? lip : lip2, x + Math.sin(a) * (r + 0.35), gy + 0.15, z + Math.cos(a) * (r + 0.35), s, s * 0.8, s * 1.2, 0, a, 0);
  }
  b.decor.add(GEO.cone(), mat(0x1a0e20, { rough: 1 }), x, gy - 0.6, z, r * 1.1, 0.7, r * 1.1, Math.PI, 0, 0, false);
  const v = new SporeVent(b.game, x, gy, z, o);
  b.level.props.push(v);
  b.level.hittables.push(v);
  return v;
}

/**
 * A node at (x, z) and its thread through `path` ([x, y, z] points) to
 * `sink`. The thread is laid a little above whatever it runs over.
 */
export function glowthread(b: Builder, x: number, z: number, path: [number, number, number][], sink: ThreadSink | null, o: ThreadOpts = {}, y?: number): Glowthread {
  const gy = y ?? b.y(x, z);
  const pts = path.map(([px, py, pz]) => new THREE.Vector3(px, py, pz));
  const t = new Glowthread(b.game, x, gy, z, pts, sink, o);
  b.level.props.push(t);
  b.level.hittables.push(t);
  // A mat of mycelium round the node's foot.
  b.decor.add(GEO.disc(), mat(0xc8c0d8, { rough: 1, emissive: 0x3a4a5a, emissiveIntensity: 0.4 }), x, gy + 0.03, z, 1.4, 1, 1.4, 0, x, 0, false);
  return t;
}

/** A cap door across an opening at (x, z), `w` wide and `h` high, facing `yaw`. */
export function capDoor(b: Builder, x: number, z: number, w: number, h: number, yaw: number, hold: number, signal = '', y?: number): CapDoor {
  const d = new CapDoor(b.game, x, y ?? b.y(x, z), z, w, h, yaw, hold, signal);
  b.level.props.push(d);
  return d;
}

/** A light bridge from (ax, ay, az) to (bx, by, bz). */
export function lightBridge(b: Builder, a: [number, number, number], c: [number, number, number], w: number, hold: number, speed = 7): LightBridge {
  const br = new LightBridge(b.game, a[0], a[1], a[2], c[0], c[1], c[2], w, hold, speed);
  b.level.props.push(br);
  // Glowing stubs where the bridge meets the ground at each end.
  for (const [px, py, pz] of [a, c]) {
    for (const s of [-1, 1]) {
      const yaw = Math.atan2(c[0] - a[0], c[2] - a[2]);
      const ox = Math.cos(yaw) * s * (w / 2 + 0.3);
      const oz = -Math.sin(yaw) * s * (w / 2 + 0.3);
      b.decor.add(GEO.cyl6(), mat(0x4a3a5a, { rough: 0.9 }), px + ox, py - 1, pz + oz, 0.18, 2.2, 0.18);
      b.decor.add(GEO.blobLow(), glowShared(SPORE.teal), px + ox, py + 1.3, pz + oz, 0.22, 0.22, 0.22, 0, 0, 0, false);
    }
  }
  return br;
}

/** A blight cloud filling a passage centred at (x, z) (see BlightCloud). */
export function blightCloud(b: Builder, x: number, z: number, w: number, d: number, yaw: number, h: number, o: BlightOpts = {}, y?: number): BlightCloud {
  const gy = y ?? b.y(x, z);
  // Grey, rotten growth on the floor under it.
  const rot = rotMat();
  for (let i = 0; i < 6; i++) {
    const u = (b.decor.rng.next() - 0.5) * w;
    const v = (b.decor.rng.next() - 0.5) * d;
    const px = x + Math.cos(yaw) * u + Math.sin(yaw) * v;
    const pz = z - Math.sin(yaw) * u + Math.cos(yaw) * v;
    b.decor.add(GEO.cap(), rot, px, b.y(px, pz) - 0.05, pz, 0.4 + b.decor.rng.next() * 0.4, 0.25, 0.4 + b.decor.rng.next() * 0.4, 0, 0, 0, false);
  }
  return new BlightCloud(b.game, x, gy, z, w, d, yaw, h, o);
}
