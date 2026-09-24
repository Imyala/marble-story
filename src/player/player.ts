import * as THREE from 'three';
import { Body } from '../world/collision';
import { DragonRig, defaultPose, HERO_LOOK } from './dragonRig';
import { MOVES, SLAM_HIT, type HitWindow, type MoveDef } from './moves';
import { BreathController, BREATH_COST, BURST_COST } from './breath';
import type { Game } from '../game/game';
import { ELEMENTS, makeHit, type Element, type Hit, type HitResult, type Hittable } from '../game/types';
import { angleDiff, approachAngle, clamp, dampAngle, yawOf } from '../core/math';
import { maxHp, maxMana, upgradeLevel } from '../game/progress';
import type { Enemy } from '../enemies/enemy';

export type PState =
  | 'move' | 'attack' | 'slam' | 'dodge' | 'charge' | 'breath' | 'burst' | 'fury'
  | 'hurt' | 'down' | 'dead' | 'locked' | 'fall';

const RUN = 8.8;
const ACCEL = 65;
const DECEL = 50;
const AIR_ACCEL = 30;
const GRAVITY = 32;
const JUMP = 11.5;
const FLAP = 10.2;
const GLIDE = 11.5;
const GLIDE_FALL = 2.1;
const TURN = 15;
const CHARGE = 15.5;
const DODGE_TIME = 0.32;
const COYOTE = 0.13;

const blobGeo = new THREE.CircleGeometry(0.55, 20);
blobGeo.rotateX(-Math.PI / 2);

export class Player {
  readonly game: Game;
  readonly body = new Body(0.48, 1.25);
  readonly rig = new DragonRig(HERO_LOOK);
  readonly pose = defaultPose();
  readonly breath: BreathController;
  yaw = 0;
  state: PState = 'move';
  stateT = 0;
  hp = 100;
  mana = 100;
  fury = 0;
  dtime = 100;
  element: Element | null = null;
  alive = true;
  hidden = false;
  invuln = false;
  iframes = 0;
  private jumps = 0;
  private jumpCut = true;
  private coyote = 0;
  airTime = 0;
  private airBudget = 1.6;
  private airDashUsed = false;
  gliding = false;
  move: MoveDef | null = null;
  moveT = 0;
  private hitSets: Set<Hittable>[] = [];
  private swooshDone: boolean[] = [];
  private sfxDone = false;
  private moveHits = 0;
  private followLaunch = false;
  counterWindow = 0;
  private dodgeX = 0;
  private dodgeZ = 1;
  private perfectUsed = false;
  private slamLanded = false;
  target: Hittable | null = null;
  lock: Enemy | null = null;
  private hurtT = 0;
  readonly lastSafe = new THREE.Vector3();
  private safeT = 0;
  private dtimeIdle = 0;
  dragonTimeActive = false;
  private ramCooldown = new Map<Hittable, number>();
  private tailHeld = 0;
  private blob: THREE.Mesh;
  private blobMat: THREE.MeshBasicMaterial;
  private lastGroundedY = 0;
  private wadeFx = 0;
  private flashT = 0;
  inWater = false;
  /** Seconds the combat music should stay up after a fight. */
  lastCombat = -99;

  constructor(game: Game) {
    this.game = game;
    this.breath = new BreathController(game, this);
    game.scene.add(this.rig.root);
    this.rig.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    this.blobMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false });
    this.blob = new THREE.Mesh(blobGeo, this.blobMat);
    this.blob.renderOrder = 2;
    game.scene.add(this.blob);
  }

  // --- stats ------------------------------------------------------------------

  get maxHp(): number {
    return maxHp(this.game.save);
  }
  get maxMana(): number {
    return maxMana(this.game.save);
  }
  get dtimeMax(): number {
    return 100 * (1 + 0.4 * upgradeLevel(this.game.save, 'dragonTime'));
  }
  get magnetRadius(): number {
    return 3.5 + upgradeLevel(this.game.save, 'magnet') * 3;
  }
  get meleeMult(): number {
    return 1 + 0.15 * upgradeLevel(this.game.save, 'hornPower');
  }
  hasUpgrade(id: string): boolean {
    return upgradeLevel(this.game.save, id) > 0;
  }
  get elements(): Element[] {
    return this.game.save.elements;
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

  /** Mouth position in world space, for breath. */
  mouth(out: THREE.Vector3): THREE.Vector3 {
    this.rig.mouth.getWorldPosition(out);
    return out;
  }

  place(x: number, y: number, z: number, yaw: number): void {
    this.body.setPos(x, y, z);
    this.body.vx = this.body.vy = this.body.vz = 0;
    this.body.grounded = false;
    this.yaw = yaw;
    this.lastSafe.set(x, y, z);
    this.syncRig(0);
  }

  resetForLevel(): void {
    this.hp = this.maxHp;
    this.mana = this.maxMana;
    this.dtime = this.dtimeMax;
    this.alive = true;
    this.state = 'move';
    this.stateT = 0;
    this.move = null;
    this.lock = null;
    this.target = null;
    this.iframes = 0;
    this.gliding = false;
    this.breath.stop();
    this.rig.setFlash(0);
    this.rig.setOpacity(1);
    if (!this.element && this.elements.length) this.element = this.elements[0]!;
  }

  setState(s: PState): void {
    if (this.state === 'breath' && s !== 'breath') this.breath.stop();
    if (this.state === 'charge' && s !== 'charge') this.game.audio.stopLoop('charge');
    this.state = s;
    this.stateT = 0;
  }

  // --- input helpers ------------------------------------------------------------

  /** Movement input rotated into world space. Returns magnitude. */
  private wish(out: { x: number; z: number }): number {
    const inp = this.game.input;
    const a = this.game.cam.yaw;
    const fx = Math.sin(a);
    const fz = Math.cos(a);
    const rx = -Math.cos(a);
    const rz = Math.sin(a);
    out.x = fx * inp.moveY + rx * inp.moveX;
    out.z = fz * inp.moveY + rz * inp.moveX;
    const m = Math.hypot(out.x, out.z);
    if (m > 1) {
      out.x /= m;
      out.z /= m;
      return 1;
    }
    return m;
  }

  private readonly w = { x: 0, z: 0 };

  // --- update -------------------------------------------------------------------

  update(dt: number): void {
    const g = this.game;
    const b = this.body;
    this.stateT += dt;
    this.iframes = Math.max(0, this.iframes - dt);
    this.counterWindow = Math.max(0, this.counterWindow - dt);
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.flashT = Math.max(0, this.flashT - dt);
    for (const [k, v] of this.ramCooldown) {
      if (v - dt <= 0) this.ramCooldown.delete(k);
      else this.ramCooldown.set(k, v - dt);
    }

    if (this.state === 'dead') {
      this.gravity(dt, 1);
      this.friction(dt, 8);
      g.col.move(b, dt);
      this.syncRig(dt);
      return;
    }
    if (this.state === 'fall') {
      this.syncRig(dt);
      return;
    }

    g.col.carry(b);
    if (this.state !== 'locked') this.handleMeta(dt);

    switch (this.state) {
      case 'move': this.updateMove(dt); break;
      case 'attack': this.updateAttack(dt); break;
      case 'slam': this.updateSlam(dt); break;
      case 'dodge': this.updateDodge(dt); break;
      case 'charge': this.updateCharge(dt); break;
      case 'breath': this.updateBreath(dt); break;
      case 'burst': this.updateBurst(dt); break;
      case 'fury': this.updateFury(dt); break;
      case 'hurt':
      case 'down':
        this.gravity(dt, 1);
        this.friction(dt, b.grounded ? 9 : 1);
        if (this.stateT > (this.state === 'down' ? 0.75 : 0.32)) this.setState('move');
        break;
      case 'locked':
        this.gravity(dt, 1);
        this.friction(dt, 14);
        break;
    }

    const wasGrounded = b.grounded;
    const vyBefore = b.vy;
    g.col.move(b, dt);
    if (b.grounded) {
      if (!wasGrounded) this.onLand(vyBefore);
      this.coyote = COYOTE;
      this.airTime = 0;
      this.jumps = 0;
      this.airDashUsed = false;
      this.gliding = false;
      this.airBudget = this.hasUpgrade('airMastery') ? 3.2 : 1.6;
      this.lastGroundedY = b.y;
    } else {
      this.coyote = Math.max(0, this.coyote - dt);
      this.airTime += dt;
    }
    this.pushOffEnemies();
    this.water(dt);
    this.trackSafeGround(dt);
    if (b.y < g.killY) g.playerFell();
    this.regen(dt);
    this.syncRig(dt);
  }

  private handleMeta(dt: number): void {
    const g = this.game;
    const inp = g.input;
    // Element selection.
    const owned = this.elements;
    if (owned.length) {
      let pick: Element | null = null;
      if (inp.take('elem1', 0.2) && owned.includes('fire')) pick = 'fire';
      if (inp.take('elem2', 0.2) && owned.includes('lightning')) pick = 'lightning';
      if (inp.take('elem3', 0.2) && owned.includes('ice')) pick = 'ice';
      if (inp.take('elem4', 0.2) && owned.includes('earth')) pick = 'earth';
      // The wheel is per frame but this runs per physics step: use it once.
      const wheel = inp.wheel;
      inp.wheel = 0;
      const cycle = wheel !== 0 ? Math.sign(wheel) : inp.take('elemNext', 0.2) ? 1 : 0;
      if (cycle !== 0) {
        const order = ELEMENTS.filter((e) => owned.includes(e));
        const i = Math.max(0, order.indexOf(this.element ?? order[0]!));
        pick = order[(i + cycle + order.length) % order.length]!;
      }
      if (pick && pick !== this.element) {
        this.element = pick;
        g.audio.play('ui', 1.3);
        g.hud.elementChanged(pick);
        if (this.state === 'breath') this.breath.start(pick);
      }
    }
    // Lock-on.
    if (inp.take('lock', 0.2)) {
      if (this.lock) this.lock = null;
      else {
        const t = this.findTarget(22, true);
        this.lock = t && (t as Enemy).isEnemy ? (t as Enemy) : null;
      }
    }
    if (this.lock && (!this.lock.alive || Math.hypot(this.lock.x - this.body.x, this.lock.z - this.body.z) > 30)) this.lock = null;

    // Dragon Time.
    const wants = inp.down('dragonTime') && this.state !== 'fury';
    if (wants && !this.dragonTimeActive && this.dtime > 12) {
      this.dragonTimeActive = true;
      g.audio.play('dragonTimeOn');
    } else if (this.dragonTimeActive && (!wants || this.dtime <= 0)) {
      this.dragonTimeActive = false;
      g.audio.play('dragonTimeOff');
    }
    if (this.dragonTimeActive) {
      this.dtime = Math.max(0, this.dtime - 24 * dt);
      this.dtimeIdle = 0;
    } else {
      this.dtimeIdle += dt;
      const lvl = upgradeLevel(g.save, 'dragonTime');
      if (this.dtimeIdle > 1.2) this.dtime = Math.min(this.dtimeMax, this.dtime + (9 + (lvl >= 2 ? 6 : 0)) * dt);
    }

    // Fury.
    if (inp.take('fury', 0.2) && this.fury >= 100 && this.element && this.state !== 'fury') {
      this.startFury();
    }
  }

  private regen(dt: number): void {
    if (this.state !== 'breath') {
      const flow = 1 + upgradeLevel(this.game.save, 'manaFlow');
      this.mana = Math.min(this.maxMana, this.mana + 2.2 * flow * dt);
    }
  }

  // --- movement -------------------------------------------------------------------

  private gravity(dt: number, scale: number): void {
    const b = this.body;
    const g = b.vy < 0 ? GRAVITY * 1.15 : GRAVITY;
    b.vy = Math.max(-32, b.vy - g * scale * dt);
  }

  private friction(dt: number, rate: number): void {
    const f = Math.exp(-rate * dt);
    this.body.vx *= f;
    this.body.vz *= f;
  }

  private steer(dt: number, speed: number, accel: number, turn: number): number {
    const b = this.body;
    const m = this.wish(this.w);
    const tx = this.w.x * speed;
    const tz = this.w.z * speed;
    const dvx = tx - b.vx;
    const dvz = tz - b.vz;
    const dl = Math.hypot(dvx, dvz);
    const a = (m > 0.05 ? accel : DECEL) * dt;
    if (dl <= a) {
      b.vx = tx;
      b.vz = tz;
    } else {
      b.vx += (dvx / dl) * a;
      b.vz += (dvz / dl) * a;
    }
    if (m > 0.1) this.yaw = approachAngle(this.yaw, yawOf(this.w.x, this.w.z), turn * dt);
    return m;
  }

  private updateMove(dt: number): void {
    const g = this.game;
    const inp = g.input;
    const b = this.body;
    const grounded = b.grounded;
    const speedMul = this.inWater ? 0.62 : 1;

    if (grounded) {
      this.steer(dt, RUN * speedMul, ACCEL, TURN);
      this.gravity(dt, 1);
    } else if (this.gliding) {
      // Glide: constant forward speed, slow fall, gentle steering.
      const m = this.wish(this.w);
      if (m > 0.1) this.yaw = approachAngle(this.yaw, yawOf(this.w.x, this.w.z), 2.6 * dt);
      const sp = GLIDE * (this.hasUpgrade('swiftWings') ? 1.2 : 1);
      const k = 1 - Math.exp(-4 * dt);
      b.vx += (Math.sin(this.yaw) * sp - b.vx) * k;
      b.vz += (Math.cos(this.yaw) * sp - b.vz) * k;
      const lift = g.updraftAt(b.x, b.y, b.z);
      if (lift > 0) b.vy = Math.min(9, b.vy + lift * dt);
      else b.vy = Math.max(-GLIDE_FALL, b.vy - GRAVITY * 0.2 * dt);
      if (!inp.down('jump')) this.gliding = false;
    } else {
      this.steer(dt, RUN * 0.95, AIR_ACCEL, TURN * 0.6);
      this.gravity(dt, 1);
      // Short hop when the button is released early (once per jump).
      if (!inp.down('jump') && !this.jumpCut && b.vy > 4 && this.jumps === 1) {
        b.vy *= 0.5;
        this.jumpCut = true;
      }
    }

    // Jumping and flapping.
    const maxJumps = this.hasUpgrade('swiftWings') ? 3 : 2;
    if (inp.buffered('jump', 0.12)) {
      if (grounded || this.coyote > 0) {
        inp.consume('jump');
        b.vy = JUMP;
        this.jumps = 1;
        this.jumpCut = false;
        this.coyote = 0;
        b.grounded = false;
        g.sfx('jump');
      } else if (this.jumps < maxJumps && !this.gliding) {
        inp.consume('jump');
        b.vy = FLAP;
        this.jumps = Math.max(2, this.jumps + 1);
        this.pose.flapT = 0;
        g.sfx('flap');
        g.fx.dust(b.x, b.y, b.z, 3, 0xffffff);
        // A flap re-aims your momentum.
        const m = this.wish(this.w);
        if (m > 0.1) {
          const hs = Math.max(Math.hypot(b.vx, b.vz), RUN * 0.8);
          b.vx = this.w.x * hs;
          b.vz = this.w.z * hs;
        }
      } else if (this.jumps >= 2 && !this.gliding) {
        inp.consume('jump');
        this.gliding = true;
      }
    }
    // Holding jump through the top of a flap goes straight into a glide.
    if (!grounded && !this.gliding && this.jumps >= 2 && inp.down('jump') && b.vy < 0 && inp.heldFor('jump') > 0.18) {
      this.gliding = true;
    }

    this.actions(dt);
  }

  /** Attack, breath and dodge inputs shared by movement states. */
  private actions(_dt: number): void {
    const g = this.game;
    const inp = g.input;
    const b = this.body;
    const air = !b.grounded;

    if (inp.take('dodge', 0.12)) {
      this.startDodge();
      return;
    }
    if (inp.take('horn', 0.15)) {
      if (this.counterWindow > 0 && !air) this.startMove(MOVES.counter!);
      else this.startMove(air ? MOVES.air1! : MOVES.horn1!);
      return;
    }
    if (inp.take('tail', 0.15)) {
      if (air) this.startSlam();
      else {
        this.tailHeld = 0;
        this.startMove(MOVES.tail1!);
      }
      return;
    }
    if (inp.down('breath') && this.element && this.mana > 2) {
      this.setState('breath');
      this.breath.start(this.element);
      return;
    }
    if (inp.take('burst', 0.15) && this.element) {
      const cost = BURST_COST[this.element];
      if (this.mana >= cost) {
        this.mana -= cost;
        this.setState('burst');
        this.gliding = false;
        return;
      }
      g.toast('Not enough mana', 'warn');
      g.hud.flashMana();
    }
  }

  private onLand(vy: number): void {
    const g = this.game;
    const b = this.body;
    if (vy < -8) {
      g.sfx('land', b.x, b.y, b.z, 1, Math.min(1, -vy / 20));
      g.fx.dust(b.x, b.y, b.z, 6);
    }
    this.gliding = false;
  }

  private startDodge(): void {
    const g = this.game;
    const b = this.body;
    const m = this.wish(this.w);
    if (m > 0.1) {
      this.dodgeX = this.w.x;
      this.dodgeZ = this.w.z;
    } else {
      this.dodgeX = -Math.sin(this.yaw);
      this.dodgeZ = -Math.cos(this.yaw);
    }
    if (!b.grounded) {
      if (this.airDashUsed) return;
      this.airDashUsed = true;
      b.vy = Math.max(b.vy, 3);
    }
    if (this.state === 'breath') this.breath.stop();
    this.move = null;
    this.gliding = false;
    this.perfectUsed = false;
    this.setState('dodge');
    this.iframes = 0.26;
    g.sfx('dodge');
  }

  private updateDodge(dt: number): void {
    const b = this.body;
    const k = this.stateT / DODGE_TIME;
    const sp = 17 * (1 - k) + 4;
    b.vx = this.dodgeX * sp;
    b.vz = this.dodgeZ * sp;
    if (b.grounded) b.vy = 0;
    this.gravity(dt, b.grounded ? 1 : 0.4);
    if (k > 0.2) this.game.fx.emit(b.x, b.y + 0.6, b.z, { count: 1, speed: 0.3, life: [0.2, 0.3], size: [0.6, 0.8], color: 0x9a70ff, bright: 0.6, alpha: 0.5 });
    if (this.stateT >= DODGE_TIME) {
      if (this.game.input.down('dodge') && b.grounded) {
        this.setState('charge');
        this.game.audio.startLoop('charge', 'charge');
        this.game.sfx('charge');
      } else this.setState('move');
    }
  }

  /** Called by takeHit when an attack connects during dodge i-frames. */
  private onEvaded(): void {
    const g = this.game;
    if (this.perfectUsed || this.state !== 'dodge' || this.stateT > 0.24) return;
    this.perfectUsed = true;
    const riposte = this.hasUpgrade('counter');
    this.counterWindow = riposte ? 1.6 : 1.0;
    g.slowmo(0.25, riposte ? 1.3 : 0.8);
    g.sfx('perfect');
    g.toast('Perfect dodge! Horn to counter', 'good');
    g.style.bonus(60);
    this.dtime = Math.min(this.dtimeMax, this.dtime + 10);
    const b = this.body;
    g.fx.ring(b.x, b.y, b.z, 0.5, 4, 0xc9a2ff, 0.5);
    g.fx.motes(b.x, b.y + 0.8, b.z, 0xd0b0ff, 16);
    g.hud.perfect();
  }

  private updateCharge(dt: number): void {
    const g = this.game;
    const inp = g.input;
    const b = this.body;
    const m = this.wish(this.w);
    if (m > 0.1) this.yaw = approachAngle(this.yaw, yawOf(this.w.x, this.w.z), 3.4 * dt);
    const k = 1 - Math.exp(-8 * dt);
    b.vx += (Math.sin(this.yaw) * CHARGE - b.vx) * k;
    b.vz += (Math.cos(this.yaw) * CHARGE - b.vz) * k;
    this.gravity(dt, 1);
    if (this.stateT % 0.08 < dt) g.fx.dust(b.x - Math.sin(this.yaw) * 0.6, b.y, b.z - Math.cos(this.yaw) * 0.6, 2);
    // Ram anything in front.
    const dmgMul = this.hasUpgrade('ramBreaker') ? 2 : 1;
    for (const h of g.hittables()) {
      if (!h.alive || this.ramCooldown.has(h)) continue;
      const dx = h.x - b.x;
      const dz = h.z - b.z;
      const d = Math.hypot(dx, dz);
      if (d > h.radius + b.radius + 0.7) continue;
      if (Math.abs(angleDiff(this.yaw, yawOf(dx, dz))) > 0.9) continue;
      if (h.y > b.y + 1.8 || h.y + h.height < b.y) continue;
      this.ramCooldown.set(h, 0.6);
      const r = h.takeHit(makeHit({
        damage: 8 * dmgMul * this.meleeMult, dirX: dx / (d || 1), dirZ: dz / (d || 1), knockback: 12, launch: 3, stagger: 40,
        hitstop: 0.06, heavy: dmgMul > 1, source: 'charge', move: 'charge', ox: b.x, oz: b.z,
      }));
      this.onDealt(r, h, 8 * dmgMul, 'charge', 12);
    }
    if (b.hitWall && Math.hypot(b.vx, b.vz) < CHARGE * 0.5 && this.stateT > 0.2) {
      g.shake(0.25, 0.2);
      g.sfx('hitHeavy', b.x, b.y, b.z, 0.7, 0.6);
      b.vx = -Math.sin(this.yaw) * 4;
      b.vz = -Math.cos(this.yaw) * 4;
      this.setState('hurt');
      return;
    }
    if (inp.take('horn', 0.15)) {
      this.startMove(MOVES.ram!);
      return;
    }
    if (inp.take('jump', 0.12) && b.grounded) {
      b.vy = JUMP * 0.95;
      this.jumps = 1;
      g.sfx('jump');
      this.setState('move');
      return;
    }
    if (!inp.down('dodge') || (!b.grounded && this.stateT > 0.1)) this.setState('move');
  }

  // --- melee ------------------------------------------------------------------------

  startMove(def: MoveDef): void {
    const g = this.game;
    const b = this.body;
    if (def.requires && !this.hasUpgrade(def.requires)) return;
    this.move = def;
    this.moveT = 0;
    this.moveHits = 0;
    this.hitSets = def.hits.map(() => new Set<Hittable>());
    this.swooshDone = def.swooshes.map(() => false);
    this.sfxDone = false;
    this.followLaunch = false;
    this.gliding = false;
    this.setState('attack');
    // Soft lock: turn toward the best target.
    const t = this.findTarget(6.5, false);
    this.target = t;
    if (t && def.tracking > 0) {
      const want = yawOf(t.x - b.x, t.z - b.z);
      const diff = angleDiff(this.yaw, want);
      this.yaw += diff * Math.min(1, def.tracking);
    } else {
      const m = this.wish(this.w);
      if (m > 0.2) this.yaw = yawOf(this.w.x, this.w.z);
    }
    if (def.air) {
      if (this.airBudget > 0) b.vy = Math.max(b.vy * 0.3, 1.2);
    } else {
      b.vx *= 0.3;
      b.vz *= 0.3;
    }
    if (def.id === 'counter') {
      g.slowmo(0.4, 0.35);
      this.counterWindow = 0;
    }
  }

  private updateAttack(dt: number): void {
    const g = this.game;
    const inp = g.input;
    const b = this.body;
    const def = this.move!;
    this.moveT += dt;
    const t = this.moveT;

    // Motion.
    let lunging = false;
    if (def.lunge && t >= def.lunge[0] && t <= def.lunge[1]) {
      let sp = def.lunge[2];
      if (this.target && this.target.alive) {
        const d = Math.hypot(this.target.x - b.x, this.target.z - b.z) - this.target.radius - b.radius;
        if (d < 0.5) sp = 0;
        else sp = Math.min(sp, d / Math.max(0.05, def.lunge[1] - t) + 1);
      }
      b.vx = Math.sin(this.yaw) * sp;
      b.vz = Math.cos(this.yaw) * sp;
      lunging = true;
    }
    if (!lunging) this.friction(dt, b.grounded ? 14 : 3);
    if (def.air && this.airBudget > 0) {
      this.airBudget -= dt;
      b.vy = Math.max(b.vy - 5 * dt, -0.8);
    } else this.gravity(dt, 1);
    if (!def.air && !b.grounded && t > 0.1 && def.id !== 'uppercut') {
      // Walked off a ledge mid-combo.
      this.setState('move');
      return;
    }
    if (def.air && b.grounded && t > 0.05) {
      this.setState('move');
      return;
    }

    if (!this.sfxDone && t >= def.sfxAt) {
      this.sfxDone = true;
      g.sfx(def.sfx, b.x, b.y, b.z, 0.95 + Math.random() * 0.1);
    }
    def.swooshes.forEach((s, i) => {
      if (!this.swooshDone[i] && t >= s.t) {
        this.swooshDone[i] = true;
        const spin = def.pose === 'tail1' || def.pose === 'tail2' || def.pose === 'horn4' || def.pose === 'tailSpin' || def.pose === 'counter';
        g.fx.swoosh(b.x, b.y + s.height, b.z, this.yaw + (spin ? Math.PI : 0), s.radius, s.arc, s.color ?? 0xfff6e0, s.plane, s.tilt ?? 0, 0.16, 0.5, s.start);
      }
    });
    def.hits.forEach((w, i) => {
      if (t >= w.t0 && t <= w.t1) this.checkWindow(w, this.hitSets[i]!, def);
    });
    if (def.id === 'horn1' || def.id === 'horn2' || def.id === 'air1' || def.id === 'air2' || def.id === 'horn3') this.reflectProjectiles(def);

    // Launcher follow-up: hold (or press) jump to rise with the target.
    if (def.id === 'uppercut' && this.moveHits > 0 && !this.followLaunch && t >= 0.24 &&
      (inp.down('jump') || inp.buffered('jump', 0.4))) {
      inp.consume('jump');
      this.followLaunch = true;
      b.vy = 13.5;
      b.grounded = false;
      this.jumps = 1;
      this.airBudget = this.hasUpgrade('airMastery') ? 3.2 : 1.6;
      g.sfx('flap');
      this.pose.flapT = 0;
      this.setState('move');
      return;
    }

    // Tail held: spin into the cyclone.
    if (def.id === 'tail1') {
      if (inp.down('tail')) this.tailHeld += dt;
      if (this.tailHeld > 0.3 && this.hasUpgrade('tailSpin')) {
        this.startMove(MOVES.tailSpin!);
        return;
      }
    }
    if (def.id === 'tailSpin') {
      this.steer(dt, 3.5, 20, 0);
      if (!inp.down('tail') && t > 0.4) {
        this.setState('move');
        return;
      }
    }

    // Chaining.
    if (t >= def.cancelFrom) {
      if (inp.take('dodge', 0.2)) {
        this.startDodge();
        return;
      }
      const air = !b.grounded;
      if (inp.buffered('horn', 0.4) && def.next.horn) {
        const n = MOVES[def.next.horn]!;
        if (!n.requires || this.hasUpgrade(n.requires)) {
          if (n.air === air || def.id === 'uppercut') {
            inp.consume('horn');
            this.startMove(n);
            return;
          }
        }
      }
      if (inp.buffered('tail', 0.4) && def.next.tail) {
        inp.consume('tail');
        if (def.next.tail === 'slam') this.startSlam();
        else this.startMove(MOVES[def.next.tail]!);
        return;
      }
      if (inp.down('breath') && this.element && this.mana > 2 && t >= def.cancelFrom + 0.05) {
        this.setState('breath');
        this.breath.start(this.element);
        return;
      }
    }
    if (t >= def.duration) {
      this.move = null;
      this.setState('move');
    }
  }

  private checkWindow(w: HitWindow, set: Set<Hittable>, def: MoveDef): void {
    const g = this.game;
    const b = this.body;
    const fx = Math.sin(this.yaw);
    const fz = Math.cos(this.yaw);
    const cx = b.x + fx * (w.offset ?? 0);
    const cz = b.z + fz * (w.offset ?? 0);
    const counterMul = def.id === 'counter' && this.hasUpgrade('counter') ? 1.5 : 1;
    for (const h of g.hittables()) {
      if (!h.alive || set.has(h)) continue;
      const dx = h.x - cx;
      const dz = h.z - cz;
      const dist = Math.hypot(dx, dz);
      if (dist - h.radius > w.range) continue;
      if (h.y > b.y + w.high || h.y + h.height < b.y + w.low) continue;
      if (w.arc < Math.PI - 0.01 && dist > h.radius + 0.5) {
        if (Math.abs(angleDiff(this.yaw, yawOf(dx, dz))) > w.arc) continue;
      }
      set.add(h);
      const n = dist || 1;
      const dmg = w.damage * this.meleeMult * counterMul;
      const hit = makeHit({
        damage: dmg, dirX: dx / n, dirZ: dz / n, knockback: w.knockback, launch: w.launch, stagger: w.stagger,
        hitstop: w.hitstop, heavy: w.heavy ?? false, spike: w.spike ?? false, source: 'melee', move: def.id, ox: b.x, oz: b.z,
      });
      const r = h.takeHit(hit);
      this.onDealt(r, h, dmg, def.id, def.style, w);
    }
  }

  /** Common bookkeeping after one of our hits resolves. */
  onDealt(r: HitResult, h: Hittable, dmg: number, move: string, style: number, w?: HitWindow): void {
    const g = this.game;
    const b = this.body;
    if (r === 'hit' || r === 'killed') {
      this.moveHits++;
      const px = (h.x + b.x) * 0.5;
      const pz = (h.z + b.z) * 0.5;
      const py = Math.min(h.y + h.height * 0.6, b.y + 1.2);
      const heavy = (w?.heavy ?? false) || move === 'charge';
      g.fx.hit(px, py, pz, heavy ? 0xffe0a0 : 0xfff6e0, heavy ? 1.4 : 1);
      g.sfx(heavy ? 'hitHeavy' : 'hit', px, py, pz, 0.9 + Math.random() * 0.2);
      g.shake(heavy ? 0.22 : 0.1, 0.12);
      if (h.isEnemy) {
        this.gainFury(dmg * 0.14);
        g.style.hit(move, style);
        this.lastCombat = g.time;
      }
    } else if (r === 'blocked') {
      const bx = b.x - h.x;
      const bz = b.z - h.z;
      const n = Math.hypot(bx, bz) || 1;
      b.vx = (bx / n) * 5;
      b.vz = (bz / n) * 5;
    }
  }

  /** An enemy's guard stopped our hit. */
  onBlocked(_e: Enemy): void {
    this.game.hud.flick('Blocked! Shields stop horns and breath from the front. Use your Tail (E), or get behind it.', 5);
  }

  gainFury(amount: number): void {
    if (this.state === 'fury') return;
    const mul = (this.hasUpgrade('furyHeart') ? 1.35 : 1) * this.game.style.reward;
    const before = this.fury;
    this.fury = Math.min(100, this.fury + amount * mul);
    if (before < 100 && this.fury >= 100) {
      this.game.toast('FURY READY - press X', 'good');
      this.game.hud.furyReady();
    }
  }

  private reflectProjectiles(def: MoveDef): void {
    const b = this.body;
    const w = def.hits[0]!;
    if (this.moveT < w.t0 || this.moveT > w.t1) return;
    for (const p of this.game.projectiles) {
      if (!p.alive || p.spec.fromPlayer || p.reflected) continue;
      const dx = p.x - b.x;
      const dz = p.z - b.z;
      const d = Math.hypot(dx, dz);
      if (d > w.range + 0.4 || Math.abs(p.y - (b.y + 0.8)) > 1.6) continue;
      if (Math.abs(angleDiff(this.yaw, yawOf(dx, dz))) > 1.3) continue;
      const tgt = this.game.nearestEnemy(b.x, b.y, b.z, 25);
      let rx = Math.sin(this.yaw);
      let rz = Math.cos(this.yaw);
      if (tgt) {
        const n = Math.hypot(tgt.x - p.x, tgt.z - p.z) || 1;
        rx = (tgt.x - p.x) / n;
        rz = (tgt.z - p.z) / n;
      }
      p.reflect(rx, rz);
      this.game.sfx('shieldBlock', p.x, p.y, p.z, 1.4);
      this.game.fx.hit(p.x, p.y, p.z, 0xffffff, 1);
      this.game.style.bonus(40);
      this.game.toast('Reflected!', 'good');
    }
  }

  private startSlam(): void {
    this.move = null;
    this.slamLanded = false;
    this.gliding = false;
    this.setState('slam');
    this.body.vy = 5;
    this.game.sfx('swingHeavy');
  }

  private updateSlam(dt: number): void {
    const g = this.game;
    const b = this.body;
    if (!this.slamLanded) {
      this.friction(dt, 6);
      if (this.stateT < 0.14) this.gravity(dt, 0.5);
      else b.vy = -30;
      if (b.grounded && this.stateT > 0.05) {
        this.slamLanded = true;
        this.stateT = 0;
        const wave = this.hasUpgrade('slamWave');
        const w: HitWindow = wave ? { ...SLAM_HIT, range: 6, launch: 10, damage: 26 } : SLAM_HIT;
        const set = new Set<Hittable>();
        const fall = Math.max(0, this.lastGroundedY - b.y);
        const bonus = 1 + Math.min(1, fall / 12);
        for (const h of g.hittables()) {
          if (!h.alive) continue;
          const dx = h.x - b.x;
          const dz = h.z - b.z;
          const d = Math.hypot(dx, dz);
          if (d - h.radius > w.range || Math.abs(h.y - b.y) > 2.5) continue;
          set.add(h);
          const n = d || 1;
          const dmg = w.damage * this.meleeMult * bonus;
          const r = h.takeHit(makeHit({
            damage: dmg, dirX: dx / n, dirZ: dz / n, knockback: w.knockback, launch: w.launch, stagger: w.stagger,
            hitstop: w.hitstop, heavy: true, source: 'melee', move: 'slam', ox: b.x, oz: b.z, type: 'physical',
          }));
          this.onDealt(r, h, dmg, 'slam', 20, w);
        }
        g.shake(0.45, 0.3);
        g.sfx('pound', b.x, b.y, b.z);
        g.fx.ring(b.x, b.y, b.z, 0.4, w.range, 0xffe6b0, 0.35);
        g.fx.dust(b.x, b.y, b.z, 18);
        g.fx.rocks(b.x, b.y + 0.2, b.z, 8);
        g.onSlam(b.x, b.y, b.z, w.range);
      }
    } else {
      this.friction(dt, 20);
      this.gravity(dt, 1);
      if (this.stateT > 0.32) this.setState('move');
      else if (this.stateT > 0.12) {
        const inp = g.input;
        if (inp.buffered('jump', 0.15)) {
          inp.consume('jump');
          b.vy = JUMP * 1.1;
          this.jumps = 1;
          g.sfx('jump');
          this.setState('move');
        }
      }
    }
  }

  // --- breath, burst, fury -----------------------------------------------------------

  private updateBreath(dt: number): void {
    const g = this.game;
    const inp = g.input;
    const b = this.body;
    const el = this.element!;
    const air = !b.grounded;
    // Aim: face the lock target, else steer slowly.
    const tgt = this.lock ?? this.findTarget(10, false);
    if (tgt) this.yaw = dampAngle(this.yaw, yawOf(tgt.x - b.x, tgt.z - b.z), 6, dt);
    else {
      const m = this.wish(this.w);
      if (m > 0.1) this.yaw = approachAngle(this.yaw, yawOf(this.w.x, this.w.z), 3.2 * dt);
    }
    if (air) {
      this.friction(dt, 3);
      if (this.airBudget > 0) {
        this.airBudget -= dt * 0.6;
        b.vy = Math.max(b.vy - 6 * dt, -1.2);
      } else this.gravity(dt, 0.6);
    } else {
      this.steer(dt, 2.6, 30, 0);
      this.gravity(dt, 1);
    }
    const cost = BREATH_COST[el] * this.breath.costMul;
    this.mana -= cost * dt;
    this.breath.update(dt);
    if (inp.take('dodge', 0.12)) {
      this.startDodge();
      return;
    }
    if (inp.take('jump', 0.12) && !air) {
      b.vy = JUMP;
      this.jumps = 1;
    }
    if (!inp.down('breath') || this.mana <= 0) {
      this.mana = Math.max(0, this.mana);
      if (this.mana <= 0) {
        g.toast('Out of mana', 'warn');
        g.hud.flashMana();
      }
      this.setState('move');
    }
  }

  private updateBurst(dt: number): void {
    const b = this.body;
    this.friction(dt, 10);
    if (!b.grounded && this.airBudget > 0) b.vy = Math.max(b.vy - 4 * dt, -0.5);
    else this.gravity(dt, 1);
    const tgt = this.lock ?? this.findTarget(16, false);
    if (tgt && this.stateT < 0.2) this.yaw = dampAngle(this.yaw, yawOf(tgt.x - b.x, tgt.z - b.z), 14, dt);
    if (this.stateT >= 0.22 && this.stateT - dt < 0.22) this.breath.burst(this.element!, tgt);
    if (this.stateT >= 0.5) this.setState('move');
  }

  private startFury(): void {
    const g = this.game;
    this.fury = 0;
    this.move = null;
    this.gliding = false;
    this.breath.stop();
    this.setState('fury');
    g.sfx('fury');
    g.hud.furyUsed();
    this.breath.furyStart(this.element!);
  }

  private updateFury(dt: number): void {
    const b = this.body;
    const t = this.stateT;
    this.friction(dt, 6);
    // Rise, hang, then drop.
    if (t < 0.6) b.vy = 5 * (1 - t / 0.6);
    else if (t < 2.4) b.vy = Math.sin(t * 3) * 0.3;
    else this.gravity(dt, 1);
    this.breath.furyUpdate(this.element!, t, dt);
    if (t > 2.7) this.setState('move');
  }

  // --- targeting -----------------------------------------------------------------------

  findTarget(maxDist: number, forLock: boolean): Hittable | null {
    const g = this.game;
    const b = this.body;
    if (this.lock && this.lock.alive && !forLock) {
      const d = Math.hypot(this.lock.x - b.x, this.lock.z - b.z);
      if (d < maxDist + 3) return this.lock;
    }
    const m = this.wish(this.w);
    const refYaw = forLock ? g.cam.yaw : m > 0.2 ? yawOf(this.w.x, this.w.z) : this.yaw;
    let best: Hittable | null = null;
    let bestScore = Infinity;
    for (const h of g.hittables()) {
      if (!h.alive || !h.isEnemy) continue;
      const dx = h.x - b.x;
      const dz = h.z - b.z;
      const d = Math.hypot(dx, dz);
      if (d > maxDist || Math.abs(h.y - b.y) > 6) continue;
      const ang = Math.abs(angleDiff(refYaw, yawOf(dx, dz)));
      if (!forLock && ang > 1.9 && d > 2.5) continue;
      const score = d + ang * (forLock ? 8 : 2.5);
      if (score < bestScore) {
        bestScore = score;
        best = h;
      }
    }
    return best;
  }

  // --- damage -----------------------------------------------------------------------------

  takeHit(hit: Hit, _attacker: Enemy | null): HitResult {
    const g = this.game;
    if (!this.alive || this.invuln || this.state === 'fury' || this.state === 'fall' || this.state === 'locked') return 'none';
    if (this.iframes > 0) {
      if (this.state === 'dodge') this.onEvaded();
      return 'dodged';
    }
    const b = this.body;
    this.hp -= hit.damage;
    g.style.hurt();
    g.sfx('hurt');
    g.shake(0.35, 0.25);
    g.hud.hurt(hit.damage / this.maxHp);
    this.flashT = 0.25;
    this.breath.stop();
    this.move = null;
    this.gliding = false;
    this.dragonTimeActive = false;
    g.stats.damageTaken += hit.damage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
      return 'killed';
    }
    b.vx = hit.dirX * hit.knockback;
    b.vz = hit.dirZ * hit.knockback;
    b.vy = Math.max(b.vy, hit.launch > 0 ? hit.launch : 2.5);
    b.grounded = false;
    this.yaw = yawOf(-hit.dirX, -hit.dirZ);
    this.hurtT = 0.4;
    this.iframes = 0.9;
    this.setState(hit.knockback >= 10 ? 'down' : 'hurt');
    return 'hit';
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  private die(): void {
    const g = this.game;
    this.alive = false;
    this.setState('dead');
    g.sfx('death');
    g.onPlayerDied();
  }

  // --- world -----------------------------------------------------------------------------

  private pushOffEnemies(): void {
    const b = this.body;
    for (const e of this.game.enemies) {
      if (!e.alive || e.def.flying) continue;
      const dx = b.x - e.x;
      const dz = b.z - e.z;
      const min = e.radius + b.radius * 0.9;
      const d = Math.hypot(dx, dz);
      if (d < min && d > 1e-4 && Math.abs(b.y - e.y) < 1.2) {
        const push = (min - d) * (e.def.mass > 0.5 ? 0.3 : 0.75);
        b.x += (dx / d) * push;
        b.z += (dz / d) * push;
      }
    }
  }

  private water(dt: number): void {
    const g = this.game;
    const b = this.body;
    const wl = g.waterLevel;
    this.inWater = false;
    if (wl <= -1e3) return;
    if (b.y < wl + 0.05 && b.grounded) {
      if (g.isDeepWater(b.x, b.z, b.y)) {
        g.fx.splash(b.x, wl, b.z);
        g.sfx('splash');
        g.playerFell();
        return;
      }
      this.inWater = true;
      this.wadeFx -= dt;
      if (this.wadeFx <= 0 && Math.hypot(b.vx, b.vz) > 1) {
        this.wadeFx = 0.12;
        g.fx.emit(b.x, wl + 0.05, b.z, { count: 3, speed: 2, dir: [0, 1, 0], spread: 0.8, life: [0.3, 0.5], size: [0.12, 0.2], color: 0xd0f0ff, gravity: 12, additive: false, alpha: 0.8 });
      }
    } else if (!b.grounded && b.y < wl - 0.8) {
      g.fx.splash(b.x, wl, b.z);
      g.sfx('splash');
      g.playerFell();
    }
  }

  private trackSafeGround(dt: number): void {
    const b = this.body;
    const g = this.game;
    this.safeT -= dt;
    if (this.safeT > 0 || !b.grounded || this.inWater) return;
    if (b.ground && b.ground.dynamic) return;
    this.safeT = 0.3;
    // Only remember spots with solid footing all around.
    const r = 0.9;
    for (const [ox, oz] of [[r, 0], [-r, 0], [0, r], [0, -r]] as const) {
      const gy = g.col.groundAt(b.x + ox, b.z + oz, b.y + 0.5, 0.05).y;
      if (gy < b.y - 0.6 || g.isDeepWater(b.x + ox, b.z + oz, gy)) return;
    }
    if (g.inHazard(b.x, b.y, b.z)) return;
    this.lastSafe.set(b.x, b.y, b.z);
  }

  /** After falling into a pit or deep water. */
  respawnAtSafe(): void {
    const s = this.lastSafe;
    this.place(s.x, s.y + 0.1, s.z, this.yaw);
    this.setState('move');
    this.iframes = 1.2;
    this.body.grounded = true;
  }

  // --- presentation ------------------------------------------------------------------------

  syncRig(dt: number): void {
    const b = this.body;
    const r = this.rig.root;
    r.position.set(b.x, b.y, b.z);
    r.rotation.y = this.yaw;
    r.visible = !this.hidden;
    const P = this.pose;
    const hs = Math.hypot(b.vx, b.vz);
    P.speed = this.state === 'move' || this.state === 'breath' || this.state === 'charge' ? clamp(hs / RUN, 0, 1.3) : 0;
    P.grounded = b.grounded;
    P.vy = b.vy;
    P.glide = this.gliding;
    P.breath = this.state === 'breath';
    P.aimPitch = this.breath.aimPitch;
    P.charge = this.state === 'charge';
    P.dodge = this.state === 'dodge' ? this.stateT / DODGE_TIME : -1;
    P.hurt = this.hurtT / 0.4;
    P.dead = this.state === 'dead';
    P.hover = this.state === 'breath' && !b.grounded;
    P.turn = 0;
    P.talk = this.state === 'locked' && this.game.dialogueSpeaker === 'aster';
    if (this.state === 'attack' && this.move) {
      P.attack = this.move.pose;
      P.attackT = this.move.id === 'tailSpin' ? (this.moveT % 0.6) / 0.6 : this.moveT / this.move.duration;
    } else if (this.state === 'slam') {
      P.attack = this.slamLanded ? 'slamLand' : 'slamFall';
      P.attackT = this.slamLanded ? this.stateT / 0.32 : 0;
    } else if (this.state === 'burst') {
      P.attack = 'burst';
      P.attackT = this.stateT / 0.5;
    } else if (this.state === 'fury') {
      P.attack = 'fury';
      P.attackT = this.stateT / 2.7;
    } else {
      P.attack = null;
    }
    this.rig.update(dt, P);
    P.flapT = 1;
    // Hurt flash and i-frame flicker.
    if (this.flashT > 0) this.rig.setFlash(this.flashT * 4, 0xff3030);
    else if (this.counterWindow > 0) this.rig.setFlash(0.35 + Math.sin(this.game.time * 30) * 0.2, 0xb080ff);
    else if (this.state === 'fury') this.rig.setFlash(0.5, this.element === 'fire' ? 0xff6020 : this.element === 'ice' ? 0x60d0ff : this.element === 'earth' ? 0x80d050 : 0xa0e0ff);
    else this.rig.setFlash(0);
    this.rig.setOpacity(this.iframes > 0 && this.state !== 'dodge' && Math.sin(this.game.time * 40) > 0.3 ? 0.5 : 1);

    // Blob shadow on whatever is below.
    const gy = this.game.col.groundAt(b.x, b.z, b.y + 0.1, 0.1).y;
    if (gy > -1e3 && !this.hidden) {
      const h = Math.max(0, b.y - gy);
      this.blob.visible = true;
      this.blob.position.set(b.x, gy + 0.03, b.z);
      const s = Math.max(0.35, 1 - h * 0.06);
      this.blob.scale.setScalar(s * 1.2);
      this.blobMat.opacity = Math.max(0.12, 0.4 - h * 0.02);
    } else this.blob.visible = false;
  }

  dispose(): void {
    this.game.scene.remove(this.rig.root);
    this.game.scene.remove(this.blob);
  }
}
