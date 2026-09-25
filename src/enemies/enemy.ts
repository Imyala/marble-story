import * as THREE from 'three';
import { Body } from '../world/collision';
import { Status, reactionFor, computeDamage, consumeReaction, type Reaction } from '../combat/status';
import type { DamageType, Element, Hit, HitResult, Hittable } from '../game/types';
import { makeHit } from '../game/types';
import type { Game } from '../game/game';
import { angleDiff, approachAngle, clamp, yawOf } from '../core/math';
import { rng } from '../core/rng';
import type { EnemyModel, EnemyPose } from './models';
import type { ProjectileSpec } from '../entities/projectile';

export type EnemyState =
  | 'spawn' | 'idle' | 'chase' | 'strafe' | 'windup' | 'active' | 'recover'
  | 'hitstun' | 'air' | 'down' | 'dead';

export interface AttackDef {
  id: string;
  pose: string;
  /** Start the attack when the player is within this distance. */
  range: number;
  minRange?: number;
  windup: number;
  active: number;
  recover: number;
  cooldown: number;
  weight: number;
  kind: 'melee' | 'projectile' | 'slam' | 'dive';
  damage: number;
  knockback: number;
  launch?: number;
  hitRange?: number;
  hitArc?: number;
  /** Forward speed during the active phase. */
  lunge?: number;
  projectile?: Omit<ProjectileSpec, 'x' | 'y' | 'z' | 'dx' | 'dy' | 'dz' | 'fromPlayer'> & { count?: number; spread?: number; aimLead?: number };
  shockwave?: { radius: number; speed: number };
  type?: DamageType;
  /** Ground ring telegraph for big hits. */
  telegraph?: boolean;
}

export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  radius: number;
  height: number;
  speed: number;
  turnRate: number;
  /** Knockback multiplier: 1 normal, lower is heavier. */
  mass: number;
  /** Stagger needed to interrupt; 0 flinches on every hit. */
  poise: number;
  flying?: boolean;
  hover?: number;
  resist: Partial<Record<DamageType, number>>;
  statusResist: Partial<Record<Element, number>>;
  attacks: AttackDef[];
  aggroRange: number;
  /** Ranged enemies try to hold this distance. */
  keepAway?: number;
  gems: { blue: number; red?: number; green?: number; purple?: number };
  shield?: boolean;
  armored?: boolean;
  /** Runs from the player while burning. */
  panics?: boolean;
  build: () => EnemyModel;
  styleValue?: number;
}

const tmp = new THREE.Vector3();

export class Enemy implements Hittable {
  readonly def: EnemyDef;
  readonly body: Body;
  readonly model: EnemyModel;
  readonly status: Status;
  readonly isEnemy = true;
  game: Game;
  hp: number;
  maxHp: number;
  alive = true;
  state: EnemyState = 'spawn';
  stateT = 0;
  yaw = 0;
  homeX: number;
  homeZ: number;
  aggro = false;
  attack: AttackDef | null = null;
  protected attackHit = false;
  protected cooldowns = new Map<string, number>();
  protected globalCd = 0.8;
  hasToken = false;
  private tokenT = 0;
  poiseDmg = 0;
  private poiseRegen = 0;
  guardBroken = 0;
  flipped = 0;
  flash = 0;
  hurtT = 0;
  deadT = 0;
  strafeDir = rng.chance(0.5) ? 1 : -1;
  private strafeSwap = 2;
  private wander = 0;
  private wanderX = 0;
  private wanderZ = 0;
  lastHitBy = '';
  /** Arena this enemy belongs to, cleared when it dies. */
  onDeath: ((e: Enemy) => void) | null = null;
  /** Bosses and scripted foes skip the generic AI. */
  scripted = false;
  isBoss = false;
  private burnFx = 0;
  private statusFx = 0;
  private iceBlock: THREE.Mesh | null = null;
  airTime = 0;
  /** Hits taken since this juggle began; each one keeps it up less. */
  juggleHits = 0;
  private cueDone = false;
  /** Where around the player this enemy likes to wait its turn. */
  private slotAngle = rng.next() * Math.PI * 2;
  private slotT = 0;
  private retreatT = 0;
  private retreated = false;
  hitstunMax = 0;
  lastDamage = 0;
  spawnDelay = 0;

  constructor(game: Game, def: EnemyDef, x: number, y: number, z: number, yaw = 0) {
    this.game = game;
    this.def = def;
    this.body = new Body(def.radius, def.height);
    this.body.setPos(x, y, z);
    this.body.stepUp = 0.5;
    this.homeX = x;
    this.homeZ = z;
    this.yaw = yaw;
    const hpScale = game.difficultyInfo.enemyHp;
    this.maxHp = this.hp = def.hp * hpScale;
    this.model = def.build();
    // A cool violet rim: the Gloom reads against any backdrop.
    this.model.rim?.(0xc8a0ff, 0.28);
    this.model.root.position.set(x, y, z);
    this.status = new Status(def.statusResist);
    game.scene.add(this.model.root);
    this.wanderX = x;
    this.wanderZ = z;
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
  get radius(): number {
    return this.def.radius;
  }
  get height(): number {
    return this.def.height;
  }
  get airborne(): boolean {
    return this.state === 'air';
  }
  get stunned(): boolean {
    return this.status.stunned;
  }
  get center(): THREE.Vector3 {
    return tmp.set(this.body.x, this.body.y + this.def.height * 0.55, this.body.z);
  }

  distToPlayer(): number {
    const p = this.game.player.body;
    return Math.hypot(p.x - this.body.x, p.z - this.body.z);
  }

  yawToPlayer(): number {
    const p = this.game.player.body;
    return yawOf(p.x - this.body.x, p.z - this.body.z);
  }

  setState(s: EnemyState): void {
    if (this.state === s) return;
    if ((this.state === 'windup' || this.state === 'active' || this.state === 'recover') &&
      s !== 'active' && s !== 'recover') this.releaseToken();
    this.state = s;
    this.stateT = 0;
  }

  releaseToken(): void {
    if (this.hasToken) {
      this.game.director.release(this);
      this.hasToken = false;
    }
  }

  // --- hits ------------------------------------------------------------------

  takeHit(hit: Hit): HitResult {
    if (!this.alive || this.state === 'spawn') return 'none';
    const g = this.game;
    if (!this.aggro) this.alertAllies();
    this.aggro = true;

    // Frontal guard.
    if (this.def.shield && this.guardBroken <= 0 && !this.status.stunned && this.state !== 'hitstun' &&
      this.state !== 'air' && this.state !== 'down') {
      const toAttacker = yawOf(hit.ox - this.body.x, hit.oz - this.body.z);
      const facing = Math.abs(angleDiff(this.yaw, toAttacker)) < 1.2;
      if (facing) {
        const breaks = hit.heavy || hit.type === 'earth' || (hit.source === 'charge' && g.player.hasUpgrade('ramBreaker'));
        if (!breaks) {
          g.fx.hit(this.body.x + Math.sin(this.yaw) * this.def.radius, this.body.y + 0.9, this.body.z + Math.cos(this.yaw) * this.def.radius, 0xbfe0ff, 0.8);
          g.sfx('shieldBlock', this.body.x, this.body.y, this.body.z);
          if (hit.source === 'melee') g.hitstop(0.04);
          this.game.player.onBlocked(this);
          return 'blocked';
        }
        this.guardBroken = 4;
        g.toast('Guard broken!', 'good');
        g.sfx('shieldBlock', this.body.x, this.body.y, this.body.z, 0.6);
        g.fx.hit(this.body.x, this.body.y + 1, this.body.z, 0xffffff, 1.5);
      }
    }

    // Armored shell: only heavy blows flip it; flipped it is wide open.
    if (this.def.armored && this.flipped <= 0) {
      if (hit.heavy || hit.type === 'earth') {
        this.flipped = 5;
        g.sfx('hitHeavy', this.body.x, this.body.y, this.body.z, 0.8);
        g.toast('Flipped!', 'good');
        this.state = 'down';
        this.stateT = 0;
        this.body.vy = 6;
      } else {
        g.fx.hit(this.body.x, this.body.y + 0.6, this.body.z, 0xd0c8b0, 0.6);
        g.sfx('shieldBlock', this.body.x, this.body.y, this.body.z, 0.8);
        if (hit.source === 'melee') g.hitstop(0.03);
        return 'immune';
      }
    }

    const reaction = reactionFor(this.status, hit);
    const resist = this.def.resist;
    if ((resist[hit.type] ?? 1) <= 0 && !reaction) {
      g.fx.sparkle(this.body.x, this.body.y + this.def.height * 0.6, this.body.z, 0xffffff, 4);
      return 'immune';
    }
    let dmg = computeDamage(hit.damage, hit.type, resist, this.status, reaction);
    if (this.flipped > 0) dmg *= 1.5;
    if (g.isWarded(this)) {
      dmg *= 0.35;
      g.fx.emit(this.body.x, this.body.y + this.def.height * 0.5, this.body.z, { count: 6, speed: 2, life: [0.2, 0.4], size: [0.3, 0.5], color: 0xb04cff, bright: 1.5, jitter: this.def.radius });
      g.hud.wardHint();
    }
    this.hp -= dmg;
    this.lastDamage = dmg;
    this.lastHitBy = hit.move;
    this.flash = 0.12;
    g.onEnemyDamaged(this, dmg, hit, reaction);
    if (reaction) {
      consumeReaction(this.status, reaction);
      g.triggerReaction(this, reaction);
    }
    const triggered = this.status.build(hit.type, hit.buildup);
    if (triggered) this.onStatus(triggered);

    if (this.hp <= 0) {
      this.die(hit, reaction);
      return 'killed';
    }

    this.poiseDmg += hit.stagger;
    this.poiseRegen = 1.5;
    const staggers = this.def.poise <= 0 || this.poiseDmg >= this.def.poise || this.status.frozen > 0 || this.state === 'air';
    if (staggers && !this.isBoss) {
      if (this.def.poise > 0 && this.poiseDmg >= this.def.poise) this.poiseDmg = 0;
      this.flinch(hit);
    } else if (this.isBoss && this.poiseDmg >= this.def.poise && this.def.poise > 0) {
      this.poiseDmg = 0;
      this.onBossStagger(hit);
    }
    if (hit.hitstop > 0) g.hitstop(hit.hitstop);
    return 'hit';
  }

  protected flinch(hit: Hit): void {
    const m = this.def.mass;
    const b = this.body;
    this.releaseToken();
    this.attack = null;
    if (this.status.frozen > 0) {
      // Frozen solid: slides a little, no reaction.
      b.vx = hit.dirX * hit.knockback * m * 0.3;
      b.vz = hit.dirZ * hit.knockback * m * 0.3;
      return;
    }
    if (hit.spike && this.state === 'air') {
      b.vy = -22;
      b.vx = hit.dirX * 2;
      b.vz = hit.dirZ * 2;
      return;
    }
    // Juggles decay: each hit in the same air time lifts a little less, so
    // air combos stay a skill rather than an infinite loop.
    const decay = Math.pow(0.84, this.juggleHits);
    if (hit.launch > 0 && m > 0.15) {
      const wasAir = this.state === 'air';
      b.vy = hit.launch * Math.min(1, 0.4 + m * 0.6) * (wasAir ? decay : 1);
      b.vx = hit.dirX * hit.knockback * m;
      b.vz = hit.dirZ * hit.knockback * m;
      if (!wasAir) {
        this.juggleHits = 0;
        this.airTime = 0;
      }
      this.juggleHits++;
      this.setState('air');
      return;
    }
    if (this.state === 'air') {
      this.juggleHits++;
      if (this.juggleHits < 12) b.vy = Math.max(b.vy, 3.5 * decay);
      b.vx = hit.dirX * hit.knockback * m * 0.6;
      b.vz = hit.dirZ * hit.knockback * m * 0.6;
      return;
    }
    b.vx = hit.dirX * hit.knockback * m;
    b.vz = hit.dirZ * hit.knockback * m;
    if (this.def.flying) b.vy = Math.max(b.vy, 1);
    this.hitstunMax = 0.28 + Math.min(0.5, hit.stagger * 0.008);
    if (hit.knockback * m > 9 && !this.def.flying) {
      this.setState('down');
      this.body.vy = 4;
    } else this.setState('hitstun');
  }

  /** Bosses override this to open a vulnerability window. */
  protected onBossStagger(_hit: Hit): void {
    /* default: nothing */
  }

  protected onStatus(s: 'burn' | 'shock' | 'freeze'): void {
    const g = this.game;
    this.releaseToken();
    if (s === 'freeze') {
      this.attack = null;
      if (this.state !== 'air') this.setState('hitstun');
      g.sfx('iceCrack', this.body.x, this.body.y, this.body.z);
      g.toast('Frozen', 'info');
      this.ensureIceBlock();
    } else if (s === 'shock') {
      this.attack = null;
      if (this.state !== 'air') this.setState('hitstun');
      g.sfx('zap', this.body.x, this.body.y, this.body.z, 0.7);
    } else {
      g.sfx('fireBurst', this.body.x, this.body.y, this.body.z, 1.2, 0.5);
    }
  }

  private ensureIceBlock(): void {
    if (this.iceBlock) return;
    const r = this.def.radius * 1.35;
    const g = new THREE.IcosahedronGeometry(1, 0);
    const m = new THREE.MeshStandardMaterial({
      color: 0xbfefff, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.1, emissive: 0x3aa0d0, emissiveIntensity: 0.25,
      flatShading: true, depthWrite: false,
    });
    this.iceBlock = new THREE.Mesh(g, m);
    this.iceBlock.scale.set(r, this.def.height * 0.65, r);
    this.iceBlock.position.y = this.def.height * 0.5;
    this.model.root.add(this.iceBlock);
  }

  die(hit: Hit | null, reaction: Reaction | null = null): void {
    if (!this.alive) return;
    this.alive = false;
    this.releaseToken();
    this.setState('dead');
    this.deadT = 0;
    const g = this.game;
    if (hit) {
      this.body.vx = hit.dirX * Math.max(4, hit.knockback) * this.def.mass;
      this.body.vz = hit.dirZ * Math.max(4, hit.knockback) * this.def.mass;
      this.body.vy = this.def.flying ? 2 : 5;
    }
    g.sfx('enemyDie', this.body.x, this.body.y, this.body.z, 0.9 + rng.next() * 0.2);
    g.onEnemyKilled(this, reaction);
    this.onDeath?.(this);
    if (this.iceBlock) {
      g.fx.shatter(this.body.x, this.body.y + 0.8, this.body.z);
      this.model.root.remove(this.iceBlock);
      this.iceBlock = null;
    }
  }

  dispose(): void {
    this.releaseToken();
    this.game.scene.remove(this.model.root);
    this.model.dispose?.();
  }

  // --- update -----------------------------------------------------------------

  update(dt: number): void {
    const g = this.game;
    const b = this.body;
    this.stateT += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.guardBroken = Math.max(0, this.guardBroken - dt);
    this.flipped = Math.max(0, this.flipped - dt);
    this.globalCd = Math.max(0, this.globalCd - dt);
    for (const [k, v] of this.cooldowns) this.cooldowns.set(k, v - dt);
    this.poiseRegen -= dt;
    if (this.poiseRegen <= 0) this.poiseDmg = Math.max(0, this.poiseDmg - this.def.poise * dt);

    if (this.state === 'dead') {
      this.deadT += dt;
      this.integrate(dt, 1);
      if (this.deadT > 0.35 && this.deadT - dt <= 0.35) g.fx.shadowPoof(b.x, b.y + this.def.height * 0.5, b.z, this.def.radius * 1.4);
      this.syncModel(dt);
      return;
    }

    // Status effects.
    const burn = this.status.update(dt);
    if (burn > 0) {
      this.hp -= burn;
      g.onEnemyDamaged(this, burn, null, null);
      if (this.hp <= 0) {
        this.die(null);
        return;
      }
    }
    this.statusVisuals(dt);

    if (this.state === 'spawn') {
      if (this.spawnDelay > 0) {
        this.spawnDelay -= dt;
        this.stateT = 0;
        this.model.root.visible = false;
        return;
      }
      this.model.root.visible = true;
      if (this.stateT < dt * 1.5) {
        g.fx.shadowPoof(b.x, b.y + 0.2, b.z, this.def.radius * 1.2);
        g.sfx('enemyAlert', b.x, b.y, b.z, 0.7);
      }
      if (this.stateT > 0.7) {
        this.setState('chase');
        this.aggro = true;
      }
      this.integrate(dt, 1);
      this.syncModel(dt);
      return;
    }

    const frozen = this.status.frozen > 0;
    const stunned = this.status.stunned;
    if (!frozen && this.iceBlock) {
      g.fx.shatter(b.x, b.y + 0.8, b.z, 0xdff8ff);
      g.sfx('iceCrack', b.x, b.y, b.z);
      this.model.root.remove(this.iceBlock);
      this.iceBlock = null;
    }

    if (this.state === 'air') {
      this.airTime += dt;
      if (b.grounded && b.vy <= 0 && this.airTime > 0.1) {
        this.juggleHits = 0;
        if (this.airTime > 0.5) {
          g.fx.dust(b.x, b.y, b.z, 6);
          this.setState('down');
        } else this.setState('hitstun');
        this.hitstunMax = 0.3;
      }
    } else if (this.state === 'hitstun') {
      if (this.stateT > this.hitstunMax && !stunned) this.setState('chase');
    } else if (this.state === 'down') {
      if (this.stateT > (this.flipped > 0 ? 4.5 : 1.0) && !stunned) {
        this.setState('chase');
        this.flipped = 0;
      }
    } else if (!stunned) {
      if (this.scripted) this.think(dt);
      else this.ai(dt);
    }

    const friction = this.state === 'air' ? 0.5 : this.state === 'hitstun' || this.state === 'down' ? 7 : 12;
    this.integrate(dt, friction);
    this.separate();
    this.syncModel(dt);
  }

  /** Scripted enemies override this. */
  protected think(_dt: number): void {
    /* bosses */
  }

  /** Seconds until a nearby ally's shout brings this one into the fight. */
  alertT = 0;

  /** A fight never stays a private matter: allies nearby join in, a beat apart. */
  alertAllies(): void {
    const b = this.body;
    for (const e of this.game.enemies) {
      if (e === this || !e.alive || e.aggro || e.alertT > 0 || e.scripted || e.def.speed <= 0) continue;
      if (Math.hypot(e.x - b.x, e.z - b.z) > 13 || Math.abs(e.y - b.y) > 6) continue;
      e.alertT = 0.25 + rng.next() * 0.6;
    }
  }

  private ai(dt: number): void {
    const g = this.game;
    const p = g.player;
    const d = this.distToPlayer();
    const def = this.def;
    const dirYaw = this.yawToPlayer();
    const b = this.body;

    if (!this.aggro) {
      // Notice the dragon a little before it is on top of us, or when an ally calls.
      let alerted = false;
      if (this.alertT > 0) {
        this.alertT -= dt;
        alerted = this.alertT <= 0;
        this.yaw = approachAngle(this.yaw, dirYaw, def.turnRate * dt);
      }
      if ((alerted || d < def.aggroRange * 1.35) && p.alive && !p.hidden && Math.abs(p.body.y - b.y) < 8) {
        this.aggro = true;
        this.alertT = 0;
        this.alertAllies();
        g.sfx('enemyAlert', b.x, b.y, b.z);
        g.fx.emit(b.x, b.y + def.height + 0.5, b.z, { count: 6, speed: 2, life: [0.3, 0.5], size: [0.2, 0.3], color: 0xff5050, bright: 2 });
        this.setState('chase');
      } else {
        this.idleWander(dt);
        return;
      }
    }
    if (!p.alive || p.hidden) {
      this.idleWander(dt);
      return;
    }
    // Leash: give up if dragged far from home.
    if (Math.hypot(b.x - this.homeX, b.z - this.homeZ) > 45 && d > 20) {
      this.aggro = false;
      this.setState('idle');
      return;
    }

    if (this.state === 'windup' || this.state === 'active' || this.state === 'recover') {
      this.runAttack(dt, d, dirYaw);
      return;
    }

    // Panic while burning.
    if (def.panics && this.status.burn > 0) {
      this.yaw = approachAngle(this.yaw, dirYaw + Math.PI + Math.sin(g.time * 3) * 0.8, def.turnRate * dt);
      this.moveForward(def.speed * 1.2, dt);
      return;
    }

    // Badly hurt foot soldiers fall back to regroup once.
    const keep = def.keepAway ?? 0;
    const ranged = keep > 0;
    if (!this.retreated && !ranged && !this.isBoss && def.speed > 0 && this.hp < this.maxHp * 0.3 && def.poise < 60 && rng.chance(0.6)) {
      this.retreated = true;
      this.retreatT = 2.2;
      this.releaseToken();
    }
    if (this.retreatT > 0) {
      this.retreatT -= dt;
      this.moveDir(dirYaw + Math.PI + this.strafeDir * 0.4, def.speed * 1.15, dt);
      this.setState('chase');
      if (this.retreatT <= 0) this.globalCd = 0.6;
      return;
    }

    // Ask the director for a turn to attack; with one, close in and swing.
    if (!this.hasToken && this.globalCd <= 0) {
      this.hasToken = g.director.request(this, ranged);
      this.tokenT = 0;
    }
    if (this.hasToken) {
      this.tokenT += dt;
      const choice = this.pickAttack(d);
      if (choice) {
        this.startAttack(choice);
        return;
      }
      if (this.tokenT > 4) {
        // Could not get into position: let someone else try.
        this.releaseToken();
        this.globalCd = 1;
      }
    }

    // Position.
    this.yaw = approachAngle(this.yaw, dirYaw, def.turnRate * dt);
    if (ranged) {
      if (d < keep * 0.7) this.moveDir(dirYaw + Math.PI, def.speed, dt);
      else if (d > keep * 1.3) this.moveDir(dirYaw, def.speed, dt);
      else this.strafe(dt, dirYaw, def.speed * 0.5);
      this.setState(d > keep * 1.3 ? 'chase' : 'strafe');
    } else if (this.hasToken) {
      this.moveDir(dirYaw, def.speed * 1.1, dt);
      this.setState('chase');
    } else {
      // Waiting for a turn: spread around the player, favoring the flanks
      // and back, instead of queueing up in front.
      // The waiting ring breathes in and out so a crowd keeps shifting.
      const ring = 3.6 + (this.def.radius > 1 ? 1.5 : 0) + Math.sin(g.time * 0.9 + this.homeX * 1.7) * 0.9;
      this.slotT -= dt;
      if (this.slotT <= 0) {
        this.slotT = 4 + rng.next() * 4;
        const behind = p.yaw + Math.PI;
        this.slotAngle = rng.chance(0.65) ? behind + rng.signed() * 1.7 : rng.next() * Math.PI * 2;
      }
      const sx = p.body.x + Math.sin(this.slotAngle) * ring;
      const sz = p.body.z + Math.cos(this.slotAngle) * ring;
      const ds = Math.hypot(sx - b.x, sz - b.z);
      if (d < ring - 1.2) {
        this.moveDir(dirYaw + Math.PI, def.speed * 0.7, dt);
        this.setState('strafe');
      } else if (ds > 1.2) {
        this.moveDir(yawOf(sx - b.x, sz - b.z), def.speed * (d > ring + 3 ? 1 : 0.75), dt, false);
        this.setState(d > ring + 3 ? 'chase' : 'strafe');
      } else {
        this.strafe(dt, dirYaw, def.speed * 0.5);
        this.setState('strafe');
      }
      // Guards keep their shields toward the dragon.
      const turn = def.shield && d < 7 ? def.turnRate * 1.8 : def.turnRate;
      this.yaw = approachAngle(this.yaw, dirYaw, turn * dt);
    }
  }

  private strafe(dt: number, dirYaw: number, speed: number): void {
    this.strafeSwap -= dt;
    if (this.strafeSwap <= 0) {
      this.strafeSwap = 1.5 + rng.next() * 2;
      this.strafeDir = -this.strafeDir;
    }
    this.moveDir(dirYaw + this.strafeDir * Math.PI * 0.5, speed, dt, false);
  }

  private idleWander(dt: number): void {
    this.wander -= dt;
    const b = this.body;
    if (this.wander <= 0) {
      this.wander = 2.5 + rng.next() * 3.5;
      this.wanderX = this.homeX + rng.signed() * 5.5;
      this.wanderZ = this.homeZ + rng.signed() * 5.5;
    }
    const dx = this.wanderX - b.x;
    const dz = this.wanderZ - b.z;
    if (Math.hypot(dx, dz) > 0.6) {
      this.moveDir(yawOf(dx, dz), this.def.speed * 0.42, dt);
      this.setState('idle');
    } else {
      // Arrived: look around until it is time to move on.
      this.yaw += Math.sin(this.game.time * 0.9 + this.homeX) * dt * 0.8;
    }
  }

  moveDir(yaw: number, speed: number, dt: number, face = true): void {
    const b = this.body;
    const tx = Math.sin(yaw) * speed;
    const tz = Math.cos(yaw) * speed;
    const k = 1 - Math.exp(-10 * dt);
    b.vx += (tx - b.vx) * k;
    b.vz += (tz - b.vz) * k;
    if (face) this.yaw = approachAngle(this.yaw, yaw, this.def.turnRate * dt);
    // Do not walk off ledges into pits or water.
    if (!this.def.flying && b.grounded) {
      const ax = b.x + Math.sin(yaw) * (this.def.radius + 0.6);
      const az = b.z + Math.cos(yaw) * (this.def.radius + 0.6);
      const gnd = this.game.col.groundAt(ax, az, b.y + 0.6, 0.1).y;
      if (gnd < b.y - 1.6 || this.game.isDeepWater(ax, az, gnd)) {
        b.vx *= 0.1;
        b.vz *= 0.1;
      }
    }
  }

  moveForward(speed: number, dt: number): void {
    this.moveDir(this.yaw, speed, dt, false);
  }

  protected pickAttack(d: number): AttackDef | null {
    let total = 0;
    const options: AttackDef[] = [];
    for (const a of this.def.attacks) {
      if ((this.cooldowns.get(a.id) ?? 0) > 0) continue;
      if (d > a.range || d < (a.minRange ?? 0)) continue;
      options.push(a);
      total += a.weight;
    }
    if (options.length === 0) return null;
    let r = rng.next() * total;
    for (const a of options) {
      r -= a.weight;
      if (r <= 0) return a;
    }
    return options[options.length - 1]!;
  }

  /** Warning color for an attack: orange quick hits, red heavy blows, violet shots, cyan dives. */
  static telegraphColor(a: AttackDef): number {
    if (a.kind === 'projectile') return 0xc050ff;
    if (a.kind === 'dive') return 0x40d8ff;
    if (a.kind === 'slam' || a.knockback >= 10 || a.telegraph) return 0xff1a1a;
    return 0xff8a1a;
  }

  startAttack(a: AttackDef): void {
    this.attack = a;
    this.attackHit = false;
    this.cueDone = false;
    this.setState('windup');
    const g = this.game;
    const col = Enemy.telegraphColor(a);
    const heavy = col === 0xff1a1a;
    const pitch = a.kind === 'projectile' ? 1.35 : heavy ? 0.7 : 1;
    g.sfx('enemyAttack', this.body.x, this.body.y, this.body.z, pitch + rng.signed() * 0.08, heavy ? 1 : 0.8);
    if (a.telegraph) {
      g.fx.ring(this.body.x, this.body.y, this.body.z, 0.2, a.shockwave?.radius ?? (a.hitRange ?? 3), 0xff3030, a.windup);
    }
    g.hud.threat(this);
  }

  /** The moment to dodge: a bright glint just before the blow lands. */
  private cue(): void {
    const g = this.game;
    const b = this.body;
    const hy = b.y + this.def.height * 0.9;
    g.fx.emit(b.x, hy, b.z, { count: 8, speed: 3, life: [0.12, 0.22], size: [0.18, 0.3], sizeEnd: 0, color: 0xffffff, bright: 3 });
    g.fx.emit(b.x, hy, b.z, { count: 1, speed: 0, life: [0.14, 0.14], size: [1.4, 1.4], sizeEnd: 0.2, color: 0xfff6d0, bright: 2.5 });
    g.sfx('cue', b.x, b.y, b.z, 1, 0.8);
  }

  protected runAttack(dt: number, _d: number, dirYaw: number): void {
    const a = this.attack!;
    const g = this.game;
    const b = this.body;
    const aggression = g.difficultyInfo.aggression;
    if (this.state === 'windup') {
      // Track the player during the windup, then commit.
      this.yaw = approachAngle(this.yaw, dirYaw, this.def.turnRate * 1.5 * dt);
      b.vx *= 0.8;
      b.vz *= 0.8;
      const windup = a.windup / aggression;
      if (!this.cueDone && this.stateT >= windup - 0.2 && a.damage > 0) {
        this.cueDone = true;
        this.cue();
      }
      if (this.stateT >= windup) {
        this.state = 'active';
        this.stateT = 0;
        this.onActiveStart(a);
      }
      return;
    }
    if (this.state === 'active') {
      if (a.lunge) this.moveForward(a.lunge, dt);
      if (a.kind === 'melee' || a.kind === 'dive') this.meleeCheck(a);
      if (this.stateT >= a.active) {
        this.state = 'recover';
        this.stateT = 0;
      }
      return;
    }
    // recover
    b.vx *= 0.85;
    b.vz *= 0.85;
    if (this.stateT >= a.recover / aggression) {
      this.cooldowns.set(a.id, a.cooldown);
      this.globalCd = (0.5 + rng.next() * 0.8) / aggression;
      this.attack = null;
      this.releaseToken();
      this.setState('chase');
    }
    void g;
  }

  protected onActiveStart(a: AttackDef): void {
    const g = this.game;
    const b = this.body;
    if (a.kind === 'projectile' && a.projectile) {
      const p = g.player.body;
      const count = a.projectile.count ?? 1;
      const spread = a.projectile.spread ?? 0.2;
      const ox = b.x + Math.sin(this.yaw) * this.def.radius;
      const oy = b.y + this.def.height * 0.7;
      const oz = b.z + Math.cos(this.yaw) * this.def.radius;
      const lead = a.projectile.aimLead ?? 0.3;
      const tx = p.x + p.vx * lead;
      const tz = p.z + p.vz * lead;
      const ty = p.y + 0.8;
      for (let i = 0; i < count; i++) {
        const off = count === 1 ? 0 : (i / (count - 1) - 0.5) * spread * 2;
        const yaw = yawOf(tx - ox, tz - oz) + off;
        const horiz = Math.hypot(tx - ox, tz - oz);
        const pitch = Math.atan2(ty - oy, horiz);
        g.spawnProjectile({
          ...a.projectile,
          x: ox, y: oy, z: oz,
          dx: Math.sin(yaw) * Math.cos(pitch), dy: Math.sin(pitch), dz: Math.cos(yaw) * Math.cos(pitch),
          fromPlayer: false,
        });
      }
    } else if (a.kind === 'slam' && a.shockwave) {
      g.spawnShockwave(b.x, b.y, b.z, a.shockwave.radius, a.shockwave.speed, a.damage * g.difficultyInfo.enemyDamage, a.knockback, this);
      g.shake(0.35, 0.3);
      g.fx.dust(b.x, b.y, b.z, 14);
      g.sfx('pound', b.x, b.y, b.z);
      // The slammer's own fists still hit up close.
      this.meleeCheck(a);
    }
  }

  protected meleeCheck(a: AttackDef): void {
    if (this.attackHit) return;
    const g = this.game;
    const p = g.player;
    if (!p.alive) return;
    const b = this.body;
    const pb = p.body;
    const dx = pb.x - b.x;
    const dz = pb.z - b.z;
    const d = Math.hypot(dx, dz) - pb.radius;
    const range = (a.hitRange ?? 1.6) + this.def.radius;
    if (d > range) return;
    if (pb.y > b.y + this.def.height + 0.5 || pb.y + pb.height < b.y - 0.3) return;
    const ang = Math.abs(angleDiff(this.yaw, yawOf(dx, dz)));
    if (ang > (a.hitArc ?? 1.0)) return;
    this.attackHit = true;
    const n = Math.hypot(dx, dz) || 1;
    p.takeHit(makeHit({
      damage: a.damage * g.difficultyInfo.enemyDamage, type: a.type ?? 'physical', dirX: dx / n, dirZ: dz / n,
      knockback: a.knockback, launch: a.launch ?? 0, source: 'enemy', move: a.id, fromPlayer: false, ox: b.x, oz: b.z,
    }), this);
  }

  integrate(dt: number, friction: number): void {
    const b = this.body;
    const def = this.def;
    const frozen = this.status.frozen > 0;
    if (def.flying && this.alive && this.state !== 'air' && !frozen) {
      // Hover toward a preferred height above ground.
      const gy = this.game.col.groundAt(b.x, b.z, b.y + 2, 0.2).y;
      const target = Math.max(gy, this.game.waterLevel) + (def.hover ?? 2.5) + Math.sin(this.game.time * 2 + this.homeX) * 0.3;
      b.vy += (target - b.y) * 6 * dt - b.vy * 3 * dt;
    } else {
      const gravity = this.state === 'air' ? 22 : 30;
      b.vy = Math.max(-30, b.vy - gravity * dt);
    }
    if (friction > 0 && (b.grounded || def.flying)) {
      const f = Math.exp(-friction * dt);
      if (this.state !== 'chase' && this.state !== 'strafe' && this.state !== 'idle' && this.state !== 'active') {
        b.vx *= f;
        b.vz *= f;
      }
    }
    if (frozen) {
      b.vx *= Math.exp(-6 * dt);
      b.vz *= Math.exp(-6 * dt);
    }
    this.game.col.move(b, dt);
    if (b.y < this.game.killY) this.die(null);
    else if (!def.flying && b.grounded && this.game.isDeepWater(b.x, b.z, b.y)) {
      this.game.fx.splash(b.x, this.game.waterLevel, b.z);
      this.game.sfx('splash', b.x, b.y, b.z);
      this.die(null);
    }
  }

  private separate(): void {
    const b = this.body;
    for (const o of this.game.enemies) {
      if (o === this || !o.alive) continue;
      const dx = b.x - o.body.x;
      const dz = b.z - o.body.z;
      const min = this.def.radius + o.def.radius;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min && d2 > 1e-6 && Math.abs(b.y - o.body.y) < 1.5) {
        const d = Math.sqrt(d2);
        const push = (min - d) * 0.5;
        b.x += (dx / d) * push;
        b.z += (dz / d) * push;
      }
    }
    // Keep out of the player (the player gets nudged by Player itself).
    const p = this.game.player.body;
    const dx = b.x - p.x;
    const dz = b.z - p.z;
    const min = this.def.radius + p.radius * 0.9;
    const d = Math.hypot(dx, dz);
    if (d < min && d > 1e-4 && Math.abs(b.y - p.y) < 1.2 && this.state !== 'dead') {
      const push = (min - d) * (this.def.mass > 0.5 ? 0.7 : 0.25);
      b.x += (dx / d) * push;
      b.z += (dz / d) * push;
    }
  }

  private statusVisuals(dt: number): void {
    const g = this.game;
    const b = this.body;
    const h = this.def.height;
    if (this.status.burn > 0) {
      this.burnFx -= dt;
      if (this.burnFx <= 0) {
        this.burnFx = 0.05;
        g.fx.emit(b.x, b.y + h * 0.5, b.z, {
          count: 2, speed: 1.5, dir: [0, 1.5, 0], spread: 0.5, life: [0.3, 0.6], size: [0.35, 0.6], sizeEnd: 0.1,
          color: 0xffa040, colorEnd: 0xff3010, bright: 1.8, jitter: this.def.radius * 0.6, gravity: -3,
        });
      }
    }
    if (this.status.shock > 0 || this.status.steam > 0) {
      this.statusFx -= dt;
      if (this.statusFx <= 0) {
        this.statusFx = 0.08;
        if (this.status.shock > 0) {
          const a = new THREE.Vector3(b.x + rng.signed() * this.def.radius, b.y + rng.next() * h, b.z + rng.signed() * this.def.radius);
          const c = new THREE.Vector3(b.x + rng.signed() * this.def.radius, b.y + rng.next() * h, b.z + rng.signed() * this.def.radius);
          g.fx.arc(a, c, 0xbfe8ff, 0.05, 0.08, 0.5);
        } else {
          g.fx.emit(b.x, b.y + h, b.z, { count: 2, speed: 0.8, dir: [0, 1, 0], life: [0.6, 1], size: [0.4, 0.7], sizeEnd: 2, color: 0xf0f4ff, alpha: 0.5, additive: false });
        }
      }
    }
  }

  syncModel(dt: number): void {
    const b = this.body;
    const r = this.model.root;
    r.position.set(b.x, b.y, b.z);
    r.rotation.y = this.yaw;
    const frozen = this.status.frozen > 0;
    const shock = this.status.shock > 0;
    const pose: EnemyPose = {
      state: this.state,
      t: this.stateT,
      speed: clamp(Math.hypot(b.vx, b.vz) / Math.max(1, this.def.speed), 0, 1.5),
      attack: this.attack?.pose ?? null,
      windup: this.state === 'windup' && this.attack ? this.stateT / this.attack.windup : 0,
      frozen,
      shocked: shock,
      dead: this.state === 'dead',
      deadT: this.deadT,
      airborne: this.state === 'air' || !b.grounded,
      guard: !!this.def.shield && this.guardBroken <= 0,
      flipped: this.flipped > 0,
    };
    if (!frozen) this.model.update(shock ? dt * 0.2 : dt, pose);
    if (shock) r.position.x += Math.sin(this.game.time * 90) * 0.04;
    const windupCol = this.attack ? Enemy.telegraphColor(this.attack) : 0xff2020;
    const windupK = this.state === 'windup' && this.attack ? Math.min(1, this.stateT / Math.max(0.05, this.attack.windup)) : 0;
    const flashCol = this.flash > 0 ? 0xffffff : this.state === 'windup' ? windupCol : 0x000000;
    const flashAmt = this.flash > 0 ? this.flash * 8 : this.state === 'windup' ? 0.1 + 0.42 * windupK + 0.1 * Math.sin(this.stateT * 30) : 0;
    this.model.setFlash(flashAmt, flashCol);
    if (this.state === 'dead') {
      const k = Math.max(0, 1 - Math.max(0, this.deadT - 0.25) * 2.5);
      r.scale.setScalar(Math.max(0.001, k));
    }
  }

  get removable(): boolean {
    return this.state === 'dead' && this.deadT > 0.8;
  }
}
