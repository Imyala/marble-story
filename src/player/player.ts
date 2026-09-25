import * as THREE from 'three';
import { Body } from '../world/collision';
import { DragonRig, defaultPose, HERO_LOOK, type DragonLook } from './dragonRig';
import { bump } from '../game/feats';
import { MOVES, SLAM_HIT, FINISHERS, DELAY_FOLLOWUPS, type HitWindow, type MoveDef } from './moves';
import { BreathController, BREATH_COST, BURST_COST } from './breath';
import type { Game } from '../game/game';
import { ELEMENTS, makeHit, type Element, type Hit, type HitResult, type Hittable } from '../game/types';
import { angleDiff, approachAngle, clamp, damp, dampAngle, yawOf } from '../core/math';
import { maxHp, maxMana, upgradeLevel } from '../game/progress';
import { POWERS, type PowerKind } from '../entities/powerups';
import type { Enemy } from '../enemies/enemy';
import { Collectible, type ClimbWall } from '../entities/props';

export type PState =
  | 'move' | 'attack' | 'slam' | 'dodge' | 'charge' | 'breath' | 'burst' | 'fury'
  | 'hurt' | 'down' | 'dead' | 'locked' | 'fall' | 'ledge' | 'climb'
  // Swimming in realms whose water sets `swim` (see swimWater).
  | 'swim';

interface LedgeMove {
  /** Where the body is when the grab starts, where it hangs, and where it ends up. */
  sx: number;
  sy: number;
  sz: number;
  hx: number;
  hy: number;
  hz: number;
  tx: number;
  ty: number;
  tz: number;
  hang: boolean;
  pulling: boolean;
  t: number;
}

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

// Swimming (only where LevelDef.water.swim is set).
/** Paddling speed at the surface: a little slower than running. */
const SWIM = 6.4;
/** Swimming speed underwater. */
const SWIM_UNDER = 5.6;
/** How far below the surface the feet hang while floating: back and head stay above water. */
const FLOAT = 0.8;
/** Upward speed of a leap out of the water (a flap can follow). */
const SWIM_LEAP = 11.2;
/** Seconds of air on one breath. */
const AIR_MAX = 15;
/** Extra speed from a strong stroke (Horn in the water). */
const SURGE = 5.5;

const INFUSE_COLOR: Record<Element, number> = { fire: 0xff8a30, lightning: 0xbfe8ff, ice: 0x9fe8ff, earth: 0xb8e07a };

const blobGeo = new THREE.CircleGeometry(0.55, 20);
blobGeo.rotateX(-Math.PI / 2);
const markerGeo = new THREE.RingGeometry(0.55, 0.72, 28);
markerGeo.rotateX(-Math.PI / 2);

export class Player {
  readonly game: Game;
  readonly body = new Body(0.48, 1.25);
  rig = new DragonRig(HERO_LOOK);
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
  /** The power-up running (from a shrine), and how long it has left. */
  power: PowerKind | null = null;
  powerT = 0;
  /** Supercharge built up on speed runes: topped up while charging over them. */
  superT = 0;
  private touchT = 0;
  /** Counts charges, so speed runes can tell one unbroken run from the next. */
  chargeId = 0;
  private chargeFoes = new Set<Hittable>();
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
  private ledge: LedgeMove | null = null;
  private ledgeCd = 0;
  private climbWall: ClimbWall | null = null;
  private climbCd = 0;
  private climbPhase = 0;
  /** Holding Shift while gliding dives for speed; releasing pulls up for height. */
  diving = false;
  private glideSpeed = GLIDE;
  private skidT = 0;
  private landLag = 0;
  private lastYaw = 0;
  /** The facing the model shows: eases after the logical facing so nothing visibly snaps. */
  private visYaw = 0;
  private pushT = 0;
  private marker: THREE.Mesh;
  private markerMat: THREE.MeshBasicMaterial;
  /** Player-time clock (unaffected by world slow motion). */
  private clock = 0;
  /** The last move that ended on its own, for pause-then-press follow-ups. */
  private lastEnded: { id: string; t: number } | null = null;
  /** Element a finisher took on because Breath was held as it landed. */
  private infused: Element | null = null;
  private infuseChecked = false;
  private lockSwitchCd = 0;
  private lastFlickFrame = -1;

  // --- swimming ---
  /** Diving (below the surface) rather than paddling on top of it. */
  swimUnder = false;
  /** Air left while diving, in seconds (the HUD's breath meter). */
  air = AIR_MAX;
  readonly airMax = AIR_MAX;
  /** Held up by the water this step: swimming, or talking while afloat. */
  private afloat = false;
  private swimPhase = 0;
  private swimPitch = 0;
  private surgeT = 0;
  private strokeCd = 0;
  private drownT = 0;
  private bubbleT = 0;
  private wakeT = 0;
  private swimHintT = 0;
  /** What the current strong stroke has already bumped. */
  private strokeHits = new Set<Hittable>();
  /** 0..1, how far the camera has gone under with the dragon. */
  private uwCam = 0;
  private readonly uwPos = new THREE.Vector3();

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
    this.markerMat = new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
    this.marker = new THREE.Mesh(markerGeo, this.markerMat);
    this.marker.renderOrder = 3;
    game.scene.add(this.marker);
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
  /** Swimming, at the surface or under it. */
  get swimming(): boolean {
    return this.state === 'swim';
  }
  /** Diving with the head under water: air runs down. */
  get submerged(): boolean {
    return this.state === 'swim' && this.swimUnder && this.body.y + 1.05 < this.game.waterLevel;
  }
  /** Does this realm's water hold the dragon up (LevelDef.water.swim)? */
  private get swimLevel(): boolean {
    return !!this.game.level?.def.water?.swim;
  }
  /** Charging faster than the wind: from a shrine, or speed runes. */
  get supercharged(): boolean {
    return this.power === 'supercharge' || this.superT > 0;
  }

  grantPower(kind: PowerKind): void {
    const g = this.game;
    const had = this.power === kind;
    this.power = kind;
    this.powerT = POWERS[kind].secs;
    g.sfx('fury', this.x, this.y, this.z, 1.3, 0.8);
    g.hud.bigText(POWERS[kind].name.toUpperCase(), POWERS[kind].color);
    if (!had) g.hud.flick(POWERS[kind].line, 4);
  }

  /** A speed rune under a charging dragon: more speed, for a little while. */
  boostCharge(): void {
    this.superT = Math.min(3, Math.max(this.superT, 1.4) + 0.08);
  }

  clearPower(): void {
    this.power = null;
    this.powerT = 0;
    this.superT = 0;
  }

  /** Iron gives way only to a powered-up dragon. */
  canBreakIron(hit: Hit | undefined): boolean {
    if (this.power === 'invincible') return true;
    if (!hit) return false;
    if (hit.source === 'charge' && this.supercharged) return true;
    return this.power === 'superflame' && (hit.type === 'fire' || hit.source === 'breath' || hit.source === 'burst');
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
    this.visYaw = yaw;
    this.lastSafe.set(x, y, z);
    this.swimUnder = false;
    this.air = AIR_MAX;
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
    this.clearPower();
    this.breath.stop();
    this.rig.setFlash(0);
    this.rig.setOpacity(1);
    if (!this.element && this.elements.length) this.element = this.elements[0]!;
  }

  setState(s: PState): void {
    if (this.state === 'breath' && s !== 'breath') this.breath.stop();
    if (this.state === 'charge' && s !== 'charge') this.game.audio.stopLoop('charge');
    if (s === 'charge' && this.state !== 'charge') {
      this.chargeId++;
      this.chargeFoes.clear();
    }
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
    this.updatePower(dt);
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

    this.clock += dt;
    this.lockSwitchCd = Math.max(0, this.lockSwitchCd - dt);
    this.ledgeCd = Math.max(0, this.ledgeCd - dt);
    this.climbCd = Math.max(0, this.climbCd - dt);
    this.skidT = Math.max(0, this.skidT - dt);
    this.landLag = Math.max(0, this.landLag - dt);

    g.col.carry(b);
    // Standing on something that moves: turn with it, and keep its speed if we leave it.
    const plat = b.grounded && b.ground && b.ground.dynamic ? b.ground : null;
    if (plat) this.yaw += plat.dyaw;
    if (this.state !== 'locked') this.handleMeta(dt);

    // Ledges and climbing position the body directly.
    if (this.state === 'ledge' || this.state === 'climb') {
      if (this.state === 'ledge') this.updateLedge(dt);
      else this.updateClimb(dt);
      this.water(dt);
      this.regen(dt);
      this.syncRig(dt);
      return;
    }

    switch (this.state) {
      case 'move': this.updateMove(dt); break;
      case 'attack': this.updateAttack(dt); break;
      case 'slam': this.updateSlam(dt); break;
      case 'dodge': this.updateDodge(dt); break;
      case 'charge': this.updateCharge(dt); break;
      case 'breath': this.updateBreath(dt); break;
      case 'burst': this.updateBurst(dt); break;
      case 'fury': this.updateFury(dt); break;
      case 'swim': this.updateSwim(dt); break;
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
    if (plat && !b.grounded) {
      b.vx += plat.pvx;
      b.vz += plat.pvz;
      b.vy += Math.max(0, plat.pvy);
    }
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
    this.motionFx(dt);
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
    // Flick the camera while locked to switch targets.
    const frame = Math.round(inp.time * 1000);
    if (this.lock && this.lockSwitchCd <= 0 && Math.abs(inp.flickX) > 22 && frame !== this.lastFlickFrame) {
      this.lastFlickFrame = frame;
      const next = this.nextLockTarget(Math.sign(inp.flickX));
      if (next) {
        this.lock = next;
        this.lockSwitchCd = 0.3;
        g.audio.play('ui', 1.6, 0.6);
      }
    }

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

    // Fury (not in the water: it needs room to rear up and breathe).
    if (inp.take('fury', 0.2) && this.fury >= 100 && this.element && this.state !== 'fury' && this.state !== 'swim') {
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

  /**
   * Ground running follows the dragon's facing: it pivots fast from a
   * standstill and carves wider arcs the faster it goes, so a change of
   * direction curves instead of snapping. Sharp reversals skid (see updateMove).
   */
  private run(dt: number, speed: number): number {
    const b = this.body;
    const m = this.wish(this.w);
    const hs = Math.hypot(b.vx, b.vz);
    const k = clamp(hs / RUN, 0, 1);
    let align = 1;
    if (m > 0.1) {
      const want = yawOf(this.w.x, this.w.z);
      const diff = angleDiff(this.yaw, want);
      // Eased toward the stick, but never faster than the speed allows.
      const maxStep = (20 - 12 * k) * dt;
      const step = Math.min(Math.abs(diff), maxStep, Math.abs(diff) * (1 - Math.exp(-14 * dt)) + 1.2 * dt);
      this.yaw += Math.sign(diff) * step;
      align = Math.cos(angleDiff(this.yaw, want));
    }
    // Speed carries through a turn and eases off only on tight ones.
    const target = m > 0.05 ? speed * m * clamp(0.55 + 0.45 * align, 0.25, 1) : 0;
    const tx = Math.sin(this.yaw) * target;
    const tz = Math.cos(this.yaw) * target;
    const dvx = tx - b.vx;
    const dvz = tz - b.vz;
    const dl = Math.hypot(dvx, dvz);
    // Softer take-off from a standstill, firm once running.
    const a = (m > 0.05 ? ACCEL * (0.55 + 0.45 * k) : DECEL) * dt;
    if (dl <= a) {
      b.vx = tx;
      b.vz = tz;
    } else {
      b.vx += (dvx / dl) * a;
      b.vz += (dvz / dl) * a;
    }
    return m;
  }

  private updateMove(dt: number): void {
    const g = this.game;
    const inp = g.input;
    const b = this.body;
    const grounded = b.grounded;
    const speedMul = this.inWater ? 0.62 : 1;

    if (grounded) {
      const hs = Math.hypot(b.vx, b.vz);
      const m = this.wish(this.w);
      // Reversing at speed skids instead of turning on a dime.
      if (this.skidT <= 0 && hs > 6.5 && m > 0.5 && (this.w.x * b.vx + this.w.z * b.vz) / hs < -0.45 && this.state === 'move') {
        this.skidT = 0.2;
        g.fx.dust(b.x, b.y, b.z, 6);
        g.sfx('land', b.x, b.y, b.z, 1.3, 0.4);
      }
      if (this.skidT > 0) {
        this.friction(dt, 12);
        if (m > 0.1) this.yaw = approachAngle(this.yaw, yawOf(this.w.x, this.w.z), TURN * 1.4 * dt);
        if (this.stateT % 0.05 < dt) g.fx.dust(b.x, b.y, b.z, 1);
      } else if (this.lock) this.steer(dt, RUN * speedMul * (this.landLag > 0 ? 0.35 : 1) * 0.85, ACCEL, TURN);
      else this.run(dt, RUN * speedMul * (this.landLag > 0 ? 0.35 : 1));
      // Locked on: keep facing the target so side input circles it.
      if (this.lock && this.lock.alive && this.skidT <= 0 && Math.hypot(this.lock.x - b.x, this.lock.z - b.z) < 16) {
        this.yaw = approachAngle(this.yaw, yawOf(this.lock.x - b.x, this.lock.z - b.z), TURN * dt);
      }
      this.gravity(dt, 1);
      // Walking into a waist-high ledge vaults onto it.
      if (b.hitWall && m > 0.5) {
        this.pushT += dt;
        if (this.pushT > 0.12 && this.tryLedge(this.w.x, this.w.z, 1.15, false)) return;
      } else this.pushT = 0;
      if (this.tryClimb()) return;
    } else if (this.gliding) {
      this.updateGlide(dt);
    } else {
      this.steer(dt, RUN * 0.95, AIR_ACCEL, TURN * 0.6);
      // Holding jump through the top of the arc hangs a moment longer.
      this.gravity(dt, inp.down('jump') && Math.abs(b.vy) < 2.2 ? 0.55 : 1);
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
        this.startGlide();
      }
    }
    // Holding jump through the top of a flap goes straight into a glide.
    if (!grounded && !this.gliding && this.jumps >= 2 && inp.down('jump') && b.vy < 0 && inp.heldFor('jump') > 0.18) {
      this.startGlide();
    }
    if (!grounded) {
      // Catch ledges we are falling past or just barely missed.
      const m = this.wish(this.w);
      if (b.vy < 2.5 && (m > 0.3 || Math.hypot(b.vx, b.vz) > 3)) {
        const dx = m > 0.3 ? this.w.x : b.vx;
        const dz = m > 0.3 ? this.w.z : b.vz;
        const n = Math.hypot(dx, dz) || 1;
        // Only a lip at about chest height: enough to forgive a near miss,
        // not enough to turn a flap into a climb over walls meant to stop you.
        if (this.tryLedge(dx / n, dz / n, 1.1, true)) return;
      }
      if (this.tryClimb()) return;
    }

    this.actions(dt);
  }

  private startGlide(): void {
    this.gliding = true;
    this.diving = false;
    const base = GLIDE * (this.hasUpgrade('swiftWings') ? 1.2 : 1);
    this.glideSpeed = Math.max(base, Math.hypot(this.body.vx, this.body.vz));
  }

  private stepFxT = 0;
  private trailT = 0;

  /** Footfall puffs when running, and wingtip streaks when gliding fast. */
  private footT = 0;

  private motionFx(dt: number): void {
    const g = this.game;
    const b = this.body;
    const hs = Math.hypot(b.vx, b.vz);
    const fx = Math.sin(this.yaw);
    const fz = Math.cos(this.yaw);
    // Footfalls, paced by speed and pitched to the ground underfoot.
    if (b.grounded && (this.state === 'move' || this.state === 'charge') && hs > 1.2) {
      this.footT -= dt * Math.min(1.6, hs / RUN);
      if (this.footT <= 0) {
        this.footT = this.state === 'charge' ? 0.16 : 0.3;
        const lvl = g.level?.def.id;
        const surf = this.inWater ? 'water' : b.ground?.surface ?? (lvl === 'frostworks' ? 'snow' : lvl === 'keep' ? 'stone' : lvl === 'fen' ? 'mud' : 'grass');
        g.audio.footstep(surf, Math.min(1, hs / RUN) * (this.state === 'charge' ? 1.3 : 1));
      }
    } else this.footT = 0.05;
    if (b.grounded && !this.inWater && (this.state === 'move' || this.state === 'charge') && hs > 4.5) {
      this.stepFxT -= dt * (hs / RUN);
      if (this.stepFxT <= 0) {
        this.stepFxT = this.state === 'charge' ? 0.12 : 0.27;
        const surf = b.ground?.surface;
        const snowy = surf === 'ice' || g.level?.def.id === 'frostworks';
        g.fx.emit(b.x - fx * 0.35, b.y + 0.06, b.z - fz * 0.35, {
          count: this.state === 'charge' ? 4 : 2, speed: 1.3, dir: [-fx, 0.6, -fz], spread: 0.9, life: [0.35, 0.6], size: [0.18, 0.3], sizeEnd: 0.9,
          color: snowy ? 0xf4f8ff : 0xc8b898, alpha: snowy ? 0.55 : 0.32, additive: false, drag: 3, gravity: -0.4,
        });
      }
    }
    if (this.gliding && (this.glideSpeed > 10 || this.diving)) {
      this.trailT -= dt;
      if (this.trailT <= 0) {
        this.trailT = this.diving ? 0.02 : 0.04;
        const rx = Math.cos(this.yaw);
        const rz = -Math.sin(this.yaw);
        for (const side of [-1, 1]) {
          g.fx.emit(b.x + rx * side * 1.25 - fx * 0.2, b.y + 0.95, b.z + rz * side * 1.25 - fz * 0.2, {
            count: 1, speed: 0.2, life: [0.3, 0.45], size: [0.1, 0.14], sizeEnd: 0, color: this.diving ? 0xe8f4ff : 0xfff4e0, bright: 1.6, alpha: 0.55,
          });
        }
      }
    }
  }

  private updateGlide(dt: number): void {
    const g = this.game;
    const inp = g.input;
    const b = this.body;
    const base = GLIDE * (this.hasUpgrade('swiftWings') ? 1.2 : 1);
    // Shift dives while gliding (no air dash).
    if (inp.buffered('dodge', 0.3)) inp.consume('dodge');
    this.diving = inp.down('dodge');
    const m = this.wish(this.w);
    if (m > 0.1) this.yaw = approachAngle(this.yaw, yawOf(this.w.x, this.w.z), (this.diving ? 1.7 : 2.6) * dt);
    const lift = g.updraftAt(b.x, b.y, b.z);
    if (this.diving) {
      this.glideSpeed = Math.min(base * 1.9, this.glideSpeed + 15 * dt);
      b.vy += (-10 - b.vy) * (1 - Math.exp(-3 * dt));
    } else if (this.glideSpeed > base + 0.3) {
      // Pulling out of a dive trades speed for height.
      const trade = Math.min(this.glideSpeed - base, 16 * dt);
      this.glideSpeed -= trade;
      b.vy = Math.min(8.5, b.vy + trade * 1.9);
    } else {
      this.glideSpeed += (base - this.glideSpeed) * (1 - Math.exp(-2 * dt));
      if (lift > 0) b.vy = Math.min(9, b.vy + lift * dt);
      else b.vy = Math.max(-GLIDE_FALL, b.vy - GRAVITY * 0.2 * dt);
    }
    if (lift > 0 && this.diving) b.vy += lift * dt * 0.5;
    const k = 1 - Math.exp(-4 * dt);
    b.vx += (Math.sin(this.yaw) * this.glideSpeed - b.vx) * k;
    b.vz += (Math.cos(this.yaw) * this.glideSpeed - b.vz) * k;
    if (this.diving && this.stateT % 0.06 < dt) g.fx.emit(b.x, b.y + 0.7, b.z, { count: 1, speed: 0.2, life: [0.25, 0.4], size: [0.1, 0.18], color: 0xffffff, alpha: 0.6, bright: 0.8 });
    if (!inp.down('jump')) {
      this.gliding = false;
      this.diving = false;
    }
  }

  // --- ledges and climbing ------------------------------------------------------

  /**
   * Looks for a ledge in direction (dx, dz) whose top is between step
   * height and maxRise above the feet, with room to stand on it. Air grabs
   * hang first if the ledge is high; low ledges vault straight up.
   */
  private tryLedge(dx: number, dz: number, maxRise: number, air: boolean): boolean {
    if (this.ledgeCd > 0) return false;
    const g = this.game;
    const col = g.col;
    const b = this.body;
    const feet = b.y;
    for (const reach of [b.radius + 0.3, b.radius + 0.65]) {
      const px = b.x + dx * reach;
      const pz = b.z + dz * reach;
      const top = col.groundAt(px, pz, feet + maxRise, 0.04).y;
      if (top === -Infinity) continue;
      const rise = top - feet;
      if (rise < b.stepUp + 0.05 || rise > maxRise) continue;
      const here = col.groundAt(b.x, b.z, feet + 0.3, 0.04).y;
      if (here > top - 0.4) continue;
      if (col.blocked(px + dx * 0.3, top + 0.08, pz + dz * 0.3, b.radius * 0.8, b.height * 0.85)) continue;
      if (g.isDeepWater(px, pz, top) || g.inHazard(px, top, pz)) continue;
      // Find where the ledge surface begins between us and the probe.
      let lo = 0;
      let hi = reach;
      for (let k = 0; k < 7; k++) {
        const mid = (lo + hi) / 2;
        const gy = col.groundAt(b.x + dx * mid, b.z + dz * mid, feet + maxRise, 0.02).y;
        if (gy >= top - 0.25) hi = mid;
        else lo = mid;
      }
      const edge = hi;
      const hang = air && rise > 1.05;
      const hx = b.x + dx * Math.max(0, edge - b.radius - 0.05);
      const hz = b.z + dz * Math.max(0, edge - b.radius - 0.05);
      this.ledge = {
        sx: b.x, sy: b.y, sz: b.z,
        hx, hy: hang ? top - 1.2 : b.y, hz,
        tx: b.x + dx * (edge + b.radius + 0.1), ty: top, tz: b.z + dz * (edge + b.radius + 0.1),
        hang, pulling: !hang, t: 0,
      };
      this.yaw = yawOf(dx, dz);
      b.vx = b.vy = b.vz = 0;
      this.gliding = false;
      this.diving = false;
      this.move = null;
      this.setState('ledge');
      g.sfx(hang ? 'land' : 'jump', b.x, b.y, b.z, hang ? 1.4 : 1.2, 0.6);
      if (hang) g.fx.dust(hx + dx * b.radius, top, hz + dz * b.radius, 4);
      return true;
    }
    return false;
  }

  private updateLedge(dt: number): void {
    const g = this.game;
    const inp = g.input;
    const b = this.body;
    const L = this.ledge;
    if (!L) {
      this.setState('move');
      return;
    }
    L.t += dt;
    if (!L.pulling) {
      // Settle into the hang, then climb unless the player pulls away.
      const k = Math.min(1, L.t / 0.08);
      b.x = L.sx + (L.hx - L.sx) * k;
      b.y = L.sy + (L.hy - L.sy) * k;
      b.z = L.sz + (L.hz - L.sz) * k;
      const m = this.wish(this.w);
      const away = m > 0.5 && (this.w.x * Math.sin(this.yaw) + this.w.z * Math.cos(this.yaw)) < -0.4;
      if (away || inp.take('dodge', 0.2)) {
        this.ledge = null;
        this.ledgeCd = 0.5;
        this.setState('move');
        return;
      }
      if (L.t > 0.14 || inp.take('jump', 0.2)) {
        L.pulling = true;
        L.t = 0;
        L.sx = b.x;
        L.sy = b.y;
        L.sz = b.z;
        g.sfx('flap', b.x, b.y, b.z, 1.2, 0.5);
      }
      return;
    }
    const dur = L.hang ? 0.3 : 0.22;
    const k = Math.min(1, L.t / dur);
    const e = k * k * (3 - 2 * k);
    b.x = L.sx + (L.tx - L.sx) * e;
    b.z = L.sz + (L.tz - L.sz) * e;
    // Rise first, then move over the lip.
    const up = Math.min(1, k / 0.6);
    b.y = L.sy + (L.ty + 0.15 - L.sy) * (1 - (1 - up) * (1 - up)) - Math.max(0, k - 0.8) * 0.75;
    if (k >= 1) {
      b.y = L.ty;
      b.vx = Math.sin(this.yaw) * 3;
      b.vz = Math.cos(this.yaw) * 3;
      b.vy = 0;
      b.grounded = true;
      this.ledge = null;
      this.ledgeCd = 0.25;
      this.jumps = 0;
      this.setState('move');
    }
  }

  private tryClimb(): boolean {
    if (this.climbCd > 0) return false;
    const walls = this.game.level?.climbWalls;
    if (!walls || walls.length === 0) return false;
    const b = this.body;
    const m = this.wish(this.w);
    if (m < 0.35) return false;
    for (const w of walls) {
      const { d, u } = w.local(b.x, b.z);
      if (d < -0.2 || d > b.radius + 0.6) continue;
      if (Math.abs(u) > w.w / 2 - 0.1) continue;
      if (b.y + 0.3 < w.y0 || b.y + 1.0 > w.y1) continue;
      const into = -(this.w.x * w.nx + this.w.z * w.nz) / m;
      if (into < 0.55) continue;
      this.climbWall = w;
      this.yaw = yawOf(-w.nx, -w.nz);
      b.vx = b.vy = b.vz = 0;
      this.gliding = false;
      this.diving = false;
      this.move = null;
      this.setState('climb');
      this.game.sfx('land', b.x, b.y, b.z, 1.5, 0.4);
      return true;
    }
    return false;
  }

  private updateClimb(dt: number): void {
    const g = this.game;
    const inp = g.input;
    const b = this.body;
    const w = this.climbWall;
    if (!w) {
      this.setState('move');
      return;
    }
    const upIn = inp.moveY;
    const sideIn = inp.moveX;
    const { u } = w.local(b.x, b.z);
    let nu = u + sideIn * 3.6 * dt;
    nu = Math.max(-w.w / 2 + b.radius * 0.6, Math.min(w.w / 2 - b.radius * 0.6, nu));
    let ny = b.y + upIn * 4.4 * dt;
    this.climbPhase += (Math.abs(upIn) + Math.abs(sideIn)) * dt * 6;
    const off = b.radius + 0.12;
    b.x = w.x + w.tx * nu + w.nx * off;
    b.z = w.z + w.tz * nu + w.nz * off;
    this.yaw = yawOf(-w.nx, -w.nz);
    // Over the top: pull up onto whatever is there.
    if (ny + 1.0 >= w.y1) {
      ny = w.y1 - 1.0;
      if (upIn > 0.3) {
        b.y = ny;
        this.ledgeCd = 0;
        if (this.tryLedge(-w.nx, -w.nz, 2.3, true)) {
          this.climbWall = null;
          return;
        }
      }
    }
    const floor = g.col.groundAt(b.x, b.z, ny + 0.3, 0.1).y;
    b.y = Math.max(ny, floor);
    b.vx = b.vy = b.vz = 0;
    if (upIn < -0.3 && b.y <= floor + 0.02) {
      this.climbWall = null;
      this.climbCd = 0.4;
      b.grounded = true;
      this.setState('move');
      return;
    }
    if (inp.take('jump', 0.15)) {
      // Kick off the wall.
      b.vx = w.nx * 6.5;
      b.vz = w.nz * 6.5;
      b.vy = 9.5;
      b.grounded = false;
      this.yaw = yawOf(w.nx, w.nz);
      this.jumps = 1;
      this.jumpCut = true;
      this.climbWall = null;
      this.climbCd = 0.35;
      g.sfx('jump');
      this.setState('move');
      return;
    }
    if (inp.take('dodge', 0.15) || b.y + 0.3 < w.y0) {
      this.climbWall = null;
      this.climbCd = 0.5;
      b.grounded = false;
      this.setState('move');
    }
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
    const follow = (button: 'horn' | 'tail'): MoveDef | null => {
      const le = this.lastEnded;
      if (!le || air) return null;
      const f = DELAY_FOLLOWUPS[le.id];
      const since = this.clock - le.t;
      if (!f || f.button !== button || since < 0.08 || since > 0.6) return null;
      return MOVES[f.move] ?? null;
    };
    if (inp.take('horn', 0.15)) {
      const hs = Math.hypot(b.vx, b.vz);
      const delayed = follow('horn');
      if (this.counterWindow > 0 && !air) this.startMove(MOVES.counter!);
      else if (delayed) this.startMove(delayed);
      else if (!air && hs > 7.2 && this.wish(this.w) > 0.6) this.startMove(MOVES.lunge!);
      else this.startMove(air ? MOVES.air1! : MOVES.horn1!);
      return;
    }
    if (inp.take('tail', 0.15)) {
      const delayed = follow('tail');
      if (air) this.startSlam();
      else if (delayed) this.startMove(delayed);
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
    if (vy < -21 && this.state === 'move') {
      // A long fall costs a beat to recover.
      this.landLag = 0.18;
      g.fx.ring(b.x, b.y, b.z, 0.3, 2.2, 0xd8c8a8, 0.3);
      g.shake(0.12, 0.12);
    }
    this.gliding = false;
    this.diving = false;
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
    // Cancel a dodge into an attack: air dashes flow into air combos, ground
    // dodges into a lunge.
    const inp = this.game.input;
    if (this.counterWindow > 0 && b.grounded && inp.buffered('horn', 0.2)) {
      inp.consume('horn');
      this.startMove(MOVES.counter!);
      return;
    }
    if (this.stateT > 0.06 && this.counterWindow <= 0 && inp.buffered('horn', 0.15)) {
      if (!b.grounded) {
        inp.consume('horn');
        this.startMove(MOVES.air1!);
        return;
      }
      if (this.stateT > 0.16) {
        inp.consume('horn');
        this.startMove(MOVES.lunge!);
        return;
      }
    }
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
    bump(g.save, 'perfects');
    g.checkFeats();
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
    const sup = this.supercharged;
    const speed = CHARGE * (sup ? 1.55 : 1);
    b.vx += (Math.sin(this.yaw) * speed - b.vx) * k;
    b.vz += (Math.cos(this.yaw) * speed - b.vz) * k;
    this.gravity(dt, 1);
    if (this.stateT % 0.08 < dt) g.fx.dust(b.x - Math.sin(this.yaw) * 0.6, b.y, b.z - Math.cos(this.yaw) * 0.6, 2);
    if (sup) g.fx.emit(b.x - Math.sin(this.yaw) * 0.8, b.y + 0.6, b.z - Math.cos(this.yaw) * 0.8, {
      count: 2, speed: 1.5, life: [0.25, 0.45], size: [0.35, 0.55], sizeEnd: 0, color: 0xffd070, colorEnd: 0xff5010, bright: 2.2, gravity: -1,
    });
    // Ram anything in front.
    const dmgMul = (this.hasUpgrade('ramBreaker') ? 2 : 1) * (sup ? 3 : 1);
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
        damage: 8 * dmgMul * this.meleeMult, dirX: dx / (d || 1), dirZ: dz / (d || 1), knockback: sup ? 18 : 12, launch: sup ? 6 : 3, stagger: sup ? 100 : 40,
        hitstop: 0.06, heavy: dmgMul > 1, source: 'charge', move: 'charge', ox: b.x, oz: b.z,
      }));
      this.onDealt(r, h, 8 * dmgMul, 'charge', 12);
      if (sup && h.isEnemy && (r === 'hit' || r === 'killed')) {
        this.chargeFoes.add(h);
        if (this.chargeFoes.size >= 3 && g.level?.def.id === 'plains') g.skill('plains:bowl');
      }
    }
    if (b.hitWall && Math.hypot(b.vx, b.vz) < speed * 0.5 && this.stateT > 0.2) {
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
    this.infused = null;
    this.infuseChecked = false;
    this.lastEnded = null;
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
      // Keep a little of the run so a swing flows out of movement.
      b.vx *= 0.5;
      b.vz *= 0.5;
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
    // Holding Breath as a finisher lands gives it the current element.
    const first = def.hits[0];
    if (!this.infuseChecked && first && t > first.t1) this.infuseChecked = true;
    if (!this.infuseChecked && first && FINISHERS.has(def.id) && inp.down('breath')) {
      this.infuseChecked = true;
      if (this.element && this.mana >= 12) {
        this.infused = this.element;
        this.mana -= 12;
        const col = INFUSE_COLOR[this.element];
        g.fx.emit(b.x + Math.sin(this.yaw), b.y + 1, b.z + Math.cos(this.yaw), { count: 16, speed: 4, life: [0.2, 0.4], size: [0.25, 0.4], sizeEnd: 0, color: col, bright: 2.2 });
        g.fx.swoosh(b.x, b.y + 0.8, b.z, this.yaw, 2.2, 2.2, col, 'h', 0, 0.22, 0.6);
        g.sfx(this.element === 'fire' ? 'fireBurst' : this.element === 'lightning' ? 'zap' : this.element === 'ice' ? 'iceCrack' : 'rumble', b.x, b.y, b.z, 1.2, 0.7);
      }
    }
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

    // A swing still winding up can be abandoned for a dodge, so a telegraph is always answerable.
    const startup = def.hits?.[0]?.t0 ?? 0;
    if (t < startup * 0.85 && !def.air && inp.take('dodge', 0.12)) {
      this.startDodge();
      return;
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
      // Breath cancels a combo only once it has been held a moment, so
      // Breath + Horn can still reach an elemental finisher.
      if (inp.down('breath') && inp.heldFor('breath') > 0.15 && this.element && this.mana > 2 && t >= def.cancelFrom + 0.05 && !this.infused) {
        this.setState('breath');
        this.breath.start(this.element);
        return;
      }
      // Out of the recovery: once the last blow has landed, jump or steer
      // straight out instead of waiting for the swing to finish.
      const lastHit = def.hits.reduce((a, w) => Math.max(a, w.t1), 0);
      if (b.grounded && !def.air && def.id !== 'uppercut' && def.id !== 'tailSpin' && t > lastHit + 0.05) {
        if (inp.buffered('jump', 0.15)) {
          inp.consume('jump');
          b.vy = JUMP;
          this.jumps = 1;
          this.jumpCut = false;
          b.grounded = false;
          g.sfx('jump');
          this.endMove(def);
          return;
        }
        // Heading somewhere new (or late in the recovery) breaks off; holding
        // the way you are swinging keeps the combo open.
        const m = this.wish(this.w);
        if (m > 0.6 && t > lastHit + 0.15 && (Math.abs(angleDiff(this.yaw, yawOf(this.w.x, this.w.z))) > 0.9 || t > def.duration * 0.78)) {
          this.endMove(def);
          return;
        }
      }
    }
    if (t >= def.duration) this.endMove(def);
  }

  private endMove(def: MoveDef): void {
    this.move = null;
    if (DELAY_FOLLOWUPS[def.id]) this.lastEnded = { id: def.id, t: this.clock };
    this.setState('move');
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
      const inf = this.infused;
      const dmg = w.damage * this.meleeMult * counterMul * (inf ? 1.3 : 1);
      const hit = makeHit({
        damage: dmg, dirX: dx / n, dirZ: dz / n, knockback: w.knockback * (inf === 'earth' ? 1.5 : 1), launch: w.launch, stagger: w.stagger * (inf === 'earth' ? 1.6 : 1),
        hitstop: w.hitstop, heavy: w.heavy ?? false, spike: w.spike ?? false, source: 'melee', move: inf ? `${def.id}:${inf}` : def.id, ox: b.x, oz: b.z,
        ...(inf ? { type: inf, buildup: 70 } : {}),
      });
      const r = h.takeHit(hit);
      this.onDealt(r, h, dmg, def.id, def.style + (inf ? 10 : 0), w);
      if (inf && (r === 'hit' || r === 'killed')) this.infuseImpact(inf, h);
    }
  }

  /** The elemental burst when an infused finisher connects. */
  private infuseImpact(el: Element, h: Hittable): void {
    const g = this.game;
    const x = h.x;
    const y = h.y + h.height * 0.5;
    const z = h.z;
    const col = INFUSE_COLOR[el];
    if (el === 'fire') g.fx.explosion(x, y, z, 1.4, 0xffa040);
    else if (el === 'ice') g.fx.shatter(x, y, z);
    else if (el === 'earth') {
      g.fx.rocks(x, y, z, 12);
      g.fx.ring(x, h.y + 0.1, z, 0.3, 3, 0xd8c8a0, 0.3);
    } else {
      // Lightning jumps to up to two more enemies nearby.
      let chains = 2;
      const from = new THREE.Vector3(x, y, z);
      for (const e of g.enemies) {
        if (chains <= 0) break;
        if (!e.alive || e === h || Math.hypot(e.x - x, e.z - z) > 6) continue;
        chains--;
        g.fx.arc(from, new THREE.Vector3(e.x, e.y + e.height * 0.5, e.z), 0xcff0ff, 0.1, 0.15, 0.4);
        const n = Math.hypot(e.x - x, e.z - z) || 1;
        e.takeHit(makeHit({ damage: 8, type: 'lightning', buildup: 45, dirX: (e.x - x) / n, dirZ: (e.z - z) / n, knockback: 1, stagger: 10, source: 'melee', move: 'chain', ox: x, oz: z }));
      }
    }
    g.fx.sparkle(x, y, z, col, 8);
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
      if (d > w.range + 1.0 || Math.abs(p.y - (b.y + 0.8)) > 2) continue;
      if (Math.abs(angleDiff(this.yaw, yawOf(dx, dz))) > 1.3) continue;
      // A reflect switch broadly ahead wins over enemies: that is what the bolt is for.
      let aim: { x: number; y: number; z: number } | null = null;
      let bestA = 1.5;
      for (const r of this.game.level?.reflectTargets ?? []) {
        if (r.on) continue;
        const rd = Math.hypot(r.x - b.x, r.z - b.z);
        const a = Math.abs(angleDiff(this.yaw, yawOf(r.x - b.x, r.z - b.z)));
        if (rd < 30 && a < bestA) {
          bestA = a;
          aim = { x: r.x, y: r.y + 1.9, z: r.z };
        }
      }
      const tgt = aim ? null : this.game.nearestEnemy(b.x, b.y, b.z, 25);
      let rx = Math.sin(this.yaw);
      let rz = Math.cos(this.yaw);
      if (tgt) {
        const n = Math.hypot(tgt.x - p.x, tgt.z - p.z) || 1;
        rx = (tgt.x - p.x) / n;
        rz = (tgt.z - p.z) / n;
      }
      p.reflect(rx, rz, aim);
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
    // A horn or tail press interrupts the breath.
    if (inp.take('horn', 0.12)) {
      this.startMove(air ? MOVES.air1! : MOVES.horn1!);
      return;
    }
    if (inp.take('tail', 0.12)) {
      if (air) this.startSlam();
      else this.startMove(MOVES.tail1!);
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

  /** The next enemy to the screen-right (dir > 0) or left of the current lock. */
  private nextLockTarget(dir: number): Enemy | null {
    const g = this.game;
    const b = this.body;
    const cur = this.lock;
    if (!cur) return null;
    const camYaw = g.cam.yaw;
    const a0 = angleDiff(camYaw, yawOf(cur.x - b.x, cur.z - b.z));
    let best: Enemy | null = null;
    let bestD = Infinity;
    for (const e of g.enemies) {
      if (!e.alive || e === cur || e.state === 'spawn') continue;
      if (Math.hypot(e.x - b.x, e.z - b.z) > 24) continue;
      const a = angleDiff(camYaw, yawOf(e.x - b.x, e.z - b.z));
      // Screen-right is decreasing yaw.
      const delta = (a0 - a) * dir;
      if (delta <= 0.02) continue;
      if (delta < bestD) {
        bestD = delta;
        best = e;
      }
    }
    return best;
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

  // --- power-ups ---------------------------------------------------------------------------

  private updatePower(dt: number): void {
    const g = this.game;
    if (this.superT > 0 && this.state !== 'charge') this.superT = Math.max(0, this.superT - dt * 3);
    else this.superT = Math.max(0, this.superT - dt);
    if (!this.power) return;
    this.powerT -= dt;
    if (this.powerT <= 0) {
      g.sfx('dragonTimeOff', this.x, this.y, this.z, 1.2, 0.6);
      g.hud.toast(`${POWERS[this.power].name} fades.`, 'info');
      this.power = null;
      this.powerT = 0;
      return;
    }
    if (this.power === 'invincible' && this.alive) {
      // Anything the dragon touches gets hurt.
      this.touchT -= dt;
      if (this.touchT > 0) return;
      this.touchT = 0.2;
      const b = this.body;
      for (const e of g.enemies) {
        if (!e.alive) continue;
        const dx = e.x - b.x;
        const dz = e.z - b.z;
        const d = Math.hypot(dx, dz);
        if (d > e.radius + 1.3 || e.y > b.y + 2 || e.y + e.height < b.y - 0.5) continue;
        const r = e.takeHit(makeHit({
          damage: 14, type: 'physical', dirX: dx / (d || 1), dirZ: dz / (d || 1), knockback: 9, launch: 3, stagger: 60, heavy: true,
          hitstop: 0.04, source: 'charge', move: 'starTouch', ox: b.x, oz: b.z,
        }));
        this.onDealt(r, e, 14, 'starTouch', 9);
        if (r === 'killed' && ++g.visit.starKills >= 6 && g.level?.def.id === 'keep') g.skill('keep:star');
        g.fx.sparkle(e.x, e.y + e.height * 0.5, e.z, 0xffe070, 8);
      }
    }
  }

  // --- damage -----------------------------------------------------------------------------

  takeHit(hit: Hit, _attacker: Enemy | null): HitResult {
    const g = this.game;
    if (!this.alive || this.invuln || this.state === 'fury' || this.state === 'fall' || this.state === 'locked') return 'none';
    if (this.power === 'invincible') {
      g.fx.sparkle(this.x, this.y + 0.8, this.z, 0xffe070, 6);
      return 'dodged';
    }
    if (this.iframes > 0) {
      if (this.state === 'dodge') this.onEvaded();
      return 'dodged';
    }
    const b = this.body;
    this.hp -= hit.damage;
    g.visit.hits++;
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
    if (this.state === 'swim') {
      // The water soaks up the blow: pushed back, still swimming.
      b.vx = hit.dirX * hit.knockback * 0.6;
      b.vz = hit.dirZ * hit.knockback * 0.6;
      this.hurtT = 0.4;
      this.iframes = 0.9;
      return 'hit';
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
    this.clearPower();
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
    this.afloat = false;
    if (wl <= -1e3) {
      this.air = AIR_MAX;
      return;
    }
    // Swimmable water holds the dragon up instead of washing it back ashore.
    const swim = this.swimLevel;
    if (swim && this.swimWater(dt)) return;
    if (this.air < AIR_MAX) this.air = Math.min(AIR_MAX, this.air + dt * 6);
    if (b.y < wl + 0.05 && b.grounded) {
      if (!swim && g.isDeepWater(b.x, b.z, b.y)) {
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
    } else if (!swim && !b.grounded && b.y < wl - 0.8) {
      g.fx.splash(b.x, wl, b.z);
      g.sfx('splash');
      g.playerFell();
    }
  }

  // --- swimming -------------------------------------------------------------------------
  //
  // Only in realms whose water sets `swim` (LevelDef.water). Deep water there
  // floats the dragon at the surface; WASD paddles (turning like running),
  // Jump leaps out (and a flap can follow), Horn is a strong stroke, and
  // holding Dodge dives. Underwater, movement follows the camera in 3D (tilt
  // the view down to swim down), Dodge sinks and Jump rises, and the breath
  // meter drains; empty, it hurts and the water pushes Aster back up.
  // Breath, bursts, tail and Fury wait until there is ground underfoot.

  /**
   * Swimmable water, run after each move. Returns true while the water has
   * the dragon (swimming, just dived in, or afloat during a conversation);
   * false hands back to the ordinary wading code.
   */
  private swimWater(dt: number): boolean {
    const g = this.game;
    const b = this.body;
    const wl = g.waterLevel;
    const floor = g.col.groundAt(b.x, b.z, b.y + 0.3, 0.1).y;
    const deep = g.isDeepWater(b.x, b.z, floor);
    if (this.state === 'swim') {
      // Footing again (a beach or a shelf), or thrown clear of the water: back to the ordinary moves.
      if ((!deep && floor > b.y - 0.4) || b.y > wl + 0.5) {
        this.swimUnder = false;
        // Paddling up to a steep bank: climb straight out rather than wading into it.
        const m = this.wish(this.w);
        if (!deep && m > 0.5 && this.tryLedge(this.w.x, this.w.z, 2.2, true)) return false;
        this.setState('move');
        return false;
      }
      this.afloat = true;
      if (this.submerged) {
        this.air = Math.max(0, this.air - dt);
        if (this.air <= 0) {
          this.drownT -= dt;
          if (this.drownT <= 0) {
            this.drownT = 0.6;
            this.drown(6);
          }
        }
      } else {
        this.air = Math.min(AIR_MAX, this.air + dt * 6);
        this.drownT = 0.35;
      }
      this.swimFx(dt);
      return true;
    }
    if (!deep || b.y > wl - 0.25) return false;
    if (this.state === 'locked') {
      // A conversation while afloat: bob at the surface instead of sinking.
      this.afloat = true;
      b.y += (wl - FLOAT - b.y) * (1 - Math.exp(-6 * dt));
      b.vy = 0;
      return true;
    }
    if (this.state === 'ledge' || this.state === 'climb' || this.state === 'dead' || this.state === 'fall') return false;
    this.enterSwim();
    return true;
  }

  private enterSwim(): void {
    const g = this.game;
    const b = this.body;
    const wl = g.waterLevel;
    const plunge = -b.vy;
    this.move = null;
    this.gliding = false;
    this.diving = false;
    this.setState('swim');
    this.afloat = true;
    this.swimUnder = false;
    this.swimPitch = 0;
    this.strokeCd = 0;
    this.surgeT = 0;
    this.drownT = 0.35;
    // A hard landing ducks under for a moment; the float spring brings Aster back up.
    b.vy = plunge > 4 ? -Math.min(6, plunge * 0.3) : Math.min(0, b.vy);
    b.vx *= 0.6;
    b.vz *= 0.6;
    if (plunge > 3) {
      g.fx.splash(b.x, wl, b.z);
      g.sfx('splash', b.x, wl, b.z, 1, Math.min(1, 0.4 + plunge / 20));
    } else g.fx.ring(b.x, wl + 0.03, b.z, 0.3, 1.6, 0xcfefff, 0.5);
    if (!g.save.found['tip:swim']) {
      g.save.found['tip:swim'] = true;
      g.hud.flick('We can swim here! WASD to paddle, Space to leap out. Hold Shift to dive, Space to rise, Left Mouse for a strong stroke. Mind your breath!', 9);
    }
  }

  private updateSwim(dt: number): void {
    const g = this.game;
    const inp = g.input;
    const b = this.body;
    const wl = g.waterLevel;
    this.surgeT = Math.max(0, this.surgeT - dt);
    this.strokeCd = Math.max(0, this.strokeCd - dt);
    this.swimHintT = Math.max(0, this.swimHintT - dt);
    const noAir = this.air <= 0;
    // No dodging in the water: Dodge is the dive button.
    if (inp.buffered('dodge', 0.3)) inp.consume('dodge');
    // Horn: a strong stroke forward.
    if (inp.take('horn', 0.15) && this.strokeCd <= 0) {
      this.surgeT = 0.4;
      this.strokeCd = 0.55;
      this.strokeHits.clear();
      // Along the way Aster is pointing: level at the surface, pitched underwater.
      const pitch = this.swimUnder ? this.swimPitch : 0;
      b.vx += Math.sin(this.yaw) * Math.cos(pitch) * SURGE;
      b.vz += Math.cos(this.yaw) * Math.cos(pitch) * SURGE;
      b.vy += Math.sin(pitch) * SURGE;
      g.sfx('dodge', b.x, b.y, b.z, 0.7, 0.6);
      if (this.swimUnder) this.bubbles(8);
      else g.fx.emit(b.x - Math.sin(this.yaw) * 0.8, wl + 0.05, b.z - Math.cos(this.yaw) * 0.8, {
        count: 12, speed: 3, dir: [-Math.sin(this.yaw) * 0.5, 1, -Math.cos(this.yaw) * 0.5], spread: 0.5, life: [0.3, 0.6], size: [0.14, 0.26],
        color: 0xe0f6ff, gravity: 14, additive: false, alpha: 0.85,
      });
    }
    // The rest of the moveset waits for dry land.
    if ((inp.take('tail', 0.15) || inp.take('burst', 0.15) || inp.pressed('breath')) && this.swimHintT <= 0) {
      this.swimHintT = 12;
      g.hud.flick('No fire in the water, Aster! Horn gives a strong stroke. Fight once we\'re back on land.', 5);
    }
    const speedK = this.surgeT > 0 ? 1.7 : 1;
    this.swimPhase += dt * (3 + Math.hypot(b.vx, b.vz, b.vy) * 0.9);
    // A strong stroke bumps open what it swims into: chests, urns and crates in the water.
    if (this.surgeT > 0) {
      const fx = Math.sin(this.yaw);
      const fz = Math.cos(this.yaw);
      for (const h of g.hittables()) {
        if (!h.alive || this.strokeHits.has(h)) continue;
        const dx = h.x - b.x;
        const dz = h.z - b.z;
        const d = Math.hypot(dx, dz);
        if (d > h.radius + b.radius + 1.1 || (dx * fx + dz * fz) < -0.2 * d) continue;
        if (h.y > b.y + 1.6 || h.y + h.height < b.y - 0.4) continue;
        this.strokeHits.add(h);
        const r = h.takeHit(makeHit({ damage: 6, dirX: dx / (d || 1), dirZ: dz / (d || 1), knockback: 3, stagger: 10, source: 'melee', move: 'stroke', ox: b.x, oz: b.z }));
        this.onDealt(r, h, 6, 'stroke', 4);
      }
    }

    if (!this.swimUnder) {
      // --- at the surface ---
      const m = this.paddle(dt, SWIM * speedK);
      // Bob on the float line: a stiff spring, well damped.
      const target = wl - FLOAT + Math.sin(this.clock * 2.1) * 0.035;
      b.vy += ((target - b.y) * 34 - b.vy * 9) * dt;
      this.swimPitch = damp(this.swimPitch, 0, 6, dt);
      // Hold Dodge to dive.
      if (inp.down('dodge') && !noAir && this.stateT > 0.12) {
        this.swimUnder = true;
        b.vy = -4.5;
        g.sfx('splash', b.x, wl, b.z, 1.5, 0.35);
        g.fx.ring(b.x, wl + 0.03, b.z, 0.3, 2.2, 0xcfefff, 0.5);
        this.bubbles(10);
        return;
      }
      // Jump leaps out of the water: onto the bank if it is close, and a flap can follow.
      if (inp.take('jump', 0.12) && this.stateT > 0.08) {
        const hs = Math.max(Math.hypot(b.vx, b.vz), m > 0.3 ? 5.5 : 2.5);
        b.vx = Math.sin(this.yaw) * hs;
        b.vz = Math.cos(this.yaw) * hs;
        b.vy = SWIM_LEAP;
        b.grounded = false;
        this.jumps = 1;
        this.jumpCut = false;
        this.coyote = 0;
        this.setState('move');
        g.fx.splash(b.x, wl, b.z);
        g.sfx('splash', b.x, wl, b.z, 1.25, 0.7);
        g.sfx('jump');
        return;
      }
      // Paddling into a low bank or a pier climbs out of the water.
      if (b.hitWall && m > 0.5) {
        this.pushT += dt;
        if (this.pushT > 0.1 && this.tryLedge(this.w.x, this.w.z, 2.2, true)) return;
      } else this.pushT = 0;
      return;
    }

    // --- underwater: camera-relative, in three dimensions ---
    const cy = g.cam.yaw;
    const fx = Math.sin(cy);
    const fz = Math.cos(cy);
    // Tilting the view down from its usual angle aims forward strokes down, and up aims them up.
    const elev = -clamp((g.cam.pitch - 0.3) * 1.25, -1.15, 1.15);
    const ce = Math.cos(elev);
    const se = Math.sin(elev);
    const fwd = inp.moveY;
    const side = inp.moveX;
    let dx = fx * ce * fwd - Math.cos(cy) * side;
    let dz = fz * ce * fwd + Math.sin(cy) * side;
    let dy = se * fwd;
    const rise = inp.down('jump') ? 1 : 0;
    const sink = inp.down('dodge') && !noAir ? 1 : 0;
    dy += (rise - sink) * 0.9;
    const mag = Math.hypot(dx, dy, dz);
    if (mag > 1) {
      dx /= mag;
      dy /= mag;
      dz /= mag;
    }
    const sp = SWIM_UNDER * speedK;
    let tvx = dx * sp;
    let tvz = dz * sp;
    let tvy = dy * sp;
    // Out of air, the water shoves Aster back up (and nothing else matters).
    if (noAir) {
      tvx *= 0.4;
      tvz *= 0.4;
      tvy = 4.2;
    } else if (mag < 0.05) tvy = 0.45;
    const k = 1 - Math.exp(-(mag > 0.05 ? 3.2 : 1.8) * dt);
    b.vx += (tvx - b.vx) * k;
    b.vz += (tvz - b.vz) * k;
    b.vy += (tvy - b.vy) * k;
    const hs = Math.hypot(b.vx, b.vz);
    const hw = Math.hypot(dx, dz);
    if (hw > 0.15) this.yaw = dampAngle(this.yaw, yawOf(dx, dz), 7, dt);
    this.swimPitch = damp(this.swimPitch, hs + Math.abs(b.vy) > 0.6 ? Math.atan2(b.vy, Math.max(hs, 0.4)) : 0, 5, dt);
    // Back at the top: surface (unless still holding the dive).
    if (b.y >= wl - FLOAT - 0.05 && b.vy > -0.3 && !sink) {
      this.swimUnder = false;
      b.y = Math.min(b.y, wl - FLOAT + 0.05);
      b.vy = Math.min(b.vy, 1.5);
      g.fx.ring(b.x, wl + 0.03, b.z, 0.3, 1.8, 0xcfefff, 0.5);
      g.sfx('splash', b.x, wl, b.z, 1.6, 0.3);
      if (this.air < AIR_MAX * 0.3) g.sfx('flap', b.x, b.y, b.z, 1.4, 0.5);
      return;
    }
    if (b.y > wl - FLOAT && b.vy > 0) b.vy *= 0.5;
  }

  /** Surface swimming: turns like running (arcs, not snaps), with a softer pull and a long glide. */
  private paddle(dt: number, speed: number): number {
    const b = this.body;
    const m = this.wish(this.w);
    let align = 1;
    if (m > 0.1) {
      const want = yawOf(this.w.x, this.w.z);
      const diff = angleDiff(this.yaw, want);
      const step = Math.min(Math.abs(diff), 7.5 * dt, Math.abs(diff) * (1 - Math.exp(-9 * dt)) + 0.9 * dt);
      this.yaw += Math.sign(diff) * step;
      align = Math.cos(angleDiff(this.yaw, want));
    }
    const target = m > 0.05 ? speed * m * clamp(0.5 + 0.5 * align, 0.2, 1) : 0;
    const k = 1 - Math.exp(-(m > 0.05 ? 3.4 : 1.5) * dt);
    b.vx += (Math.sin(this.yaw) * target - b.vx) * k;
    b.vz += (Math.cos(this.yaw) * target - b.vz) * k;
    return m;
  }

  /** Out of air: the water takes its toll. Not a hit (no knockback), but it can end the dive for good. */
  private drown(dmg: number): void {
    const g = this.game;
    if (!this.alive || this.invuln || this.power === 'invincible') return;
    this.hp -= dmg;
    g.stats.damageTaken += dmg;
    g.hud.hurt(dmg / this.maxHp);
    g.sfx('hurt', this.x, this.y, this.z, 0.85, 0.7);
    this.flashT = 0.2;
    this.bubbles(14);
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
  }

  private bubbles(n: number): void {
    const b = this.body;
    const m = this.mouth(new THREE.Vector3());
    this.game.fx.emit(m.x, Math.min(m.y, this.game.waterLevel - 0.1), m.z, {
      count: n, speed: 0.9, dir: [0, 1, 0], spread: 0.6, life: [0.7, 1.4], size: [0.08, 0.2], sizeEnd: 1.3,
      color: 0xd8f6ff, alpha: 0.8, additive: false, drag: 1.5, gravity: -5, jitter: 0.15,
    });
    void b;
  }

  /** A wake behind a paddling dragon, and bubbles from a diving one. */
  private swimFx(dt: number): void {
    const g = this.game;
    const b = this.body;
    const wl = g.waterLevel;
    const hs = Math.hypot(b.vx, b.vz);
    if (!this.swimUnder) {
      this.wakeT -= dt * (0.5 + hs / SWIM);
      if (this.wakeT <= 0) {
        this.wakeT = 0.14;
        const fx = Math.sin(this.yaw);
        const fz = Math.cos(this.yaw);
        if (hs > 1.2) {
          for (const s of [-1, 1]) {
            g.fx.emit(b.x + fz * s * 0.45 - fx * 0.3, wl + 0.04, b.z - fx * s * 0.45 - fz * 0.3, {
              count: 2, speed: 1.2, dir: [fz * s, 0.5, -fx * s], spread: 0.4, life: [0.35, 0.6], size: [0.12, 0.22], sizeEnd: 1.6,
              color: 0xe8f8ff, gravity: 5, additive: false, alpha: 0.75,
            });
          }
          if (Math.floor(this.swimPhase) % 3 === 0) g.fx.ring(b.x - fx * 0.6, wl + 0.03, b.z - fz * 0.6, 0.4, 1.6, 0xcfefff, 0.7);
        } else if (Math.floor(this.clock * 1.4) !== Math.floor((this.clock - dt) * 1.4)) {
          g.fx.ring(b.x, wl + 0.03, b.z, 0.4, 1.3, 0xcfefff, 0.9);
        }
      }
      return;
    }
    this.bubbleT -= dt;
    if (this.bubbleT <= 0) {
      this.bubbleT = this.air < AIR_MAX * 0.3 ? 0.25 : 0.7 + Math.random() * 0.5;
      this.bubbles(this.air < AIR_MAX * 0.3 ? 5 : 3);
    }
  }

  /**
   * Underwater, the camera follows the dragon below the surface (the orbit
   * camera never dips under water), and the view takes on the water's tint.
   * Runs every frame after the camera rig.
   */
  swimCamera(dt: number): void {
    const g = this.game;
    const cam = g.camera;
    const wl = g.waterLevel;
    const want = this.submerged && !g.cam.inShot && g.state !== 'dead' ? 1 : 0;
    this.uwCam += (want - this.uwCam) * (1 - Math.exp(-7 * dt));
    if (want === 0 && this.uwCam < 0.02) this.uwCam = 0;
    if (this.uwCam > 0) {
      const b = this.body;
      const fy = b.y + 0.8;
      const yaw = g.cam.yaw;
      const pitch = clamp(g.cam.pitch, -0.3, 1.1);
      const cp = Math.cos(pitch);
      const dx = -Math.sin(yaw) * cp;
      const dy = Math.sin(pitch);
      const dz = -Math.cos(yaw) * cp;
      const L = 5.8;
      const hit = g.col.raycast(b.x, fy, b.z, dx, dy, dz, L, true, true);
      const t = clamp(hit.t - 0.35, 1.3, L);
      let py = fy + dy * t;
      const px = b.x + dx * t;
      const pz = b.z + dz * t;
      py = Math.min(py, wl - 0.35);
      const floor = g.col.terrainAt(px, pz);
      if (floor > -1e3) py = Math.max(py, Math.min(wl - 0.35, floor + 0.5));
      this.uwPos.set(px, py, pz);
      cam.position.lerp(this.uwPos, this.uwCam);
      cam.lookAt(b.x, b.y + 1.35 + (fy - b.y - 1.35) * this.uwCam, b.z);
    }
    g.renderer.look.underwater = wl > -1e3 && cam.position.y < wl - 0.05 ? 1 : 0;
  }

  private trackSafeGround(dt: number): void {
    const b = this.body;
    const g = this.game;
    this.safeT -= dt;
    if (this.safeT > 0 || !b.grounded || this.inWater) return;
    if (b.ground && (b.ground.dynamic || b.ground.unsafe)) return;
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

  private gazeT = 0;
  private gazeAt: { x: number; y: number; z: number } | null = null;

  /** Picks something to look at: the lock target, a foe closing in, or a treasure close by. */
  private updateGaze(dt: number): void {
    const P = this.pose;
    this.gazeT -= dt;
    if (this.gazeT <= 0) {
      this.gazeT = 0.25;
      const g = this.game;
      const b = this.body;
      let best: { x: number; y: number; z: number } | null = null;
      if (this.lock?.alive) best = { x: this.lock.x, y: this.lock.y + this.lock.height * 0.6, z: this.lock.z };
      else {
        let bd = 13;
        for (const e of g.enemies) {
          if (!e.alive || !e.aggro) continue;
          const d = Math.hypot(e.x - b.x, e.z - b.z);
          if (d < bd) { bd = d; best = { x: e.x, y: e.y + e.height * 0.6, z: e.z }; }
        }
        if (!best) {
          bd = 7;
          for (const pr of g.level?.props ?? []) {
            if (!(pr instanceof Collectible) || pr.taken) continue;
            const d = Math.hypot(pr.x - b.x, pr.z - b.z);
            if (d < bd && Math.abs(pr.y - b.y) < 4) { bd = d; best = { x: pr.x, y: pr.y + 0.6, z: pr.z }; }
          }
        }
      }
      this.gazeAt = best;
    }
    const t = this.gazeAt;
    if (!t) { P.gaze = null; return; }
    const dx = t.x - this.body.x;
    const dz = t.z - this.body.z;
    const rel = angleDiff(this.visYaw, Math.atan2(dx, dz));
    // Beyond a comfortable neck turn, it just faces forward (and the body turns instead).
    P.gaze = Math.abs(rel) < 1.9 ? rel : null;
    P.gazePitch = Math.atan2(t.y - (this.body.y + 1.1), Math.hypot(dx, dz) + 0.5);
  }

  syncRig(dt: number): void {
    const b = this.body;
    const r = this.rig.root;
    r.position.set(b.x, b.y, b.z);
    // Fast enough to read as instant for small corrections, smooth for big ones.
    const vd = angleDiff(this.visYaw, this.yaw);
    this.visYaw += Math.abs(vd) > 2.8 ? vd * (1 - Math.exp(-30 * dt)) : vd * (1 - Math.exp(-22 * dt));
    r.rotation.y = this.visYaw;
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
    const turn = dt > 0 ? angleDiff(this.lastYaw, this.visYaw) / dt : 0;
    this.lastYaw = this.visYaw;
    P.turn = clamp(turn, -6, 6);
    P.talk = this.state === 'locked' && this.game.dialogueSpeaker === 'aster';
    P.climb = this.state === 'climb' ? this.climbPhase : -1;
    P.hang = this.state === 'ledge' && !!this.ledge && !this.ledge.pulling;
    P.pull = this.state === 'ledge' && !!this.ledge && this.ledge.pulling;
    P.dive = this.gliding && this.diving;
    P.skid = this.skidT > 0;
    // Afloat: level body, folded wings, paddling legs (see DragonRig).
    P.swim = this.afloat ? this.swimPhase : -1;
    P.swimPitch = this.swimPitch;
    P.under = this.afloat && this.swimUnder;
    if (this.afloat) {
      P.speed = 0;
      P.grounded = false;
    }
    this.updateGaze(dt);
    // Turning in place still steps the feet.
    if (P.speed < 0.15 && Math.abs(P.turn) > 1.2 && b.grounded && this.state === 'move') P.speed = 0.25;
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
    else if (this.power || this.superT > 0) {
      // A power-up shimmers, and flickers as it runs out.
      const kind = this.power ?? 'supercharge';
      const ending = this.power && this.powerT < 3 ? (Math.sin(this.game.time * 24) > 0 ? 1 : 0.2) : 1;
      this.rig.setFlash((0.28 + Math.sin(this.game.time * 9) * 0.1) * ending, POWERS[kind].color);
    } else this.rig.setFlash(0);
    this.rig.setOpacity(this.iframes > 0 && this.state !== 'dodge' && Math.sin(this.game.time * 40) > 0.3 ? 0.5 : 1);

    // Blob shadow on whatever is below, plus a landing marker when high up.
    const gy = this.game.col.groundAt(b.x, b.z, b.y + 0.1, 0.1).y;
    if (gy > -1e3 && !this.hidden && !this.afloat) {
      const h = Math.max(0, b.y - gy);
      this.blob.visible = true;
      this.blob.position.set(b.x, gy + 0.03, b.z);
      const s = Math.max(0.35, 1 - h * 0.06);
      this.blob.scale.setScalar(s * 1.2);
      this.blobMat.opacity = Math.max(0.12, 0.4 - h * 0.02);
      const show = !b.grounded && h > 2.2 && this.state !== 'climb';
      this.marker.visible = show;
      if (show) {
        this.marker.position.set(b.x, gy + 0.05, b.z);
        this.marker.scale.setScalar(1 + Math.min(1.5, h * 0.04));
        this.markerMat.opacity = 0.25 + 0.2 * Math.sin(this.game.time * 8);
        // Red over water that would wash Aster back (swimmable water is a fine place to land).
        this.markerMat.color.setHex((!this.swimLevel && this.game.isDeepWater(b.x, b.z, gy)) || gy < this.game.killY + 1 ? 0xff6a5a : 0xfff0c0);
      }
    } else {
      this.blob.visible = false;
      this.marker.visible = false;
    }
  }

  /** Rebuilds the model with other scales (skins unlocked by eggs). */
  setLook(overrides: Partial<DragonLook>): void {
    const old = this.rig;
    this.game.scene.remove(old.root);
    this.rig = new DragonRig({ ...HERO_LOOK, ...overrides });
    this.rig.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    this.game.scene.add(this.rig.root);
    this.syncRig(0);
  }

  dispose(): void {
    this.game.scene.remove(this.rig.root);
    this.game.scene.remove(this.blob);
    this.game.scene.remove(this.marker);
  }
}
