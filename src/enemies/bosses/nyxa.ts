import * as THREE from 'three';
import { Boss } from '../boss';
import type { Enemy, EnemyDef, AttackDef } from '../enemy';
import type { EnemyModel, EnemyPose } from '../models';
import type { Game } from '../../game/game';
import type { Hit, HitResult } from '../../game/types';
import { makeHit } from '../../game/types';
import type { Reaction } from '../../combat/status';
import { Hazard } from '../../entities/props';
import { DragonRig, defaultPose, type DragonPose } from '../../player/dragonRig';
import { NYXA } from '../../game/story';
import { angleDiff, approachAngle, clamp, clamp01, damp, lerp, yawOf } from '../../core/math';
import { rng } from '../../core/rng';

/**
 * Nyxa, the shadow dragoness: the last fight of the first flight.
 *   Phase 1  a ground duel: tail-scythe sweeps, horn lunges, a shadow breath
 *            cone, and short shadow-steps that end in an ambush. Perfect
 *            dodges are the answer to all of it.
 *   Phase 2  she takes to the sky: orb volleys, telegraphed dive-bombs, and
 *            Shade Knights. A reaction or a heavy blow knocks her down, and
 *            she lands on her own after her dives.
 *   Phase 3  the eclipse fury: the arena rim turns to shadow, and she fights
 *            faster, chaining her attacks and leaping into desperate dives.
 */

const SCALE = 2.2;
/** Height above the arena floor she circles at in phase 2. */
const HOVER = 6;
const BREATH_RANGE = 10.5;
const SHADOW = 0xb04cff;
const ROSE = 0xff3080;

const tmp = new THREE.Vector3();

/** What the boss wants the dragon rig to do this frame. */
interface Drive {
  flying: boolean;
  glide: boolean;
  breath: boolean;
  charge: boolean;
  attack: string | null;
  attackT: number;
  hidden: boolean;
  flap: boolean;
  talk: boolean;
  fury: number;
}

/** Adapts the procedural dragon rig to the enemy model interface. */
class NyxaModel implements EnemyModel {
  readonly root = new THREE.Group();
  readonly rig: DragonRig;
  readonly drive: Drive = {
    flying: false, glide: false, breath: false, charge: false, attack: null, attackT: 0, hidden: false, flap: false, talk: false, fury: 0,
  };
  private pose: DragonPose = defaultPose();
  private hurt = 0;
  private lastYaw = 0;
  private turn = 0;
  private halo: THREE.Mesh;
  private haloMat: THREE.MeshBasicMaterial;
  private haloAmt = 0;

  constructor() {
    this.rig = new DragonRig({ ...NYXA, scale: SCALE });
    this.rig.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    this.root.add(this.rig.root);
    // The eclipse ring that burns over her back in the last phase.
    this.haloMat = new THREE.MeshBasicMaterial({
      color: 0xe060ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    this.halo = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.07, 6, 40), this.haloMat);
    this.halo.position.set(0, 3.1, -0.5);
    this.root.add(this.halo);
  }

  setFlash(amount: number, color: number): void {
    // A faint violet sheen keeps the shadow dragoness readable at night.
    if (amount <= 0.001) this.rig.setFlash(0.28, 0x6a1aa0);
    else this.rig.setFlash(amount, color);
  }

  update(dt: number, pose: EnemyPose): void {
    const d = this.drive;
    const P = this.pose;
    const down = pose.state === 'hitstun' || pose.state === 'down';
    this.hurt = damp(this.hurt, down ? 1 : 0, 10, dt);
    const yaw = this.root.rotation.y;
    if (dt > 0) this.turn = damp(this.turn, clamp(angleDiff(this.lastYaw, yaw) / dt, -4, 4), 8, dt);
    this.lastYaw = yaw;
    P.grounded = !d.flying && !pose.airborne;
    P.speed = d.flying ? 0 : pose.speed;
    P.vy = d.flying || !pose.airborne ? 0 : -6;
    P.hover = d.flying && !d.glide;
    P.glide = d.flying && d.glide;
    P.breath = d.breath && !down;
    P.charge = d.charge && !down;
    P.aimPitch = 0;
    P.attack = down || pose.dead ? null : d.attack;
    P.attackT = d.attackT;
    P.hurt = this.hurt;
    P.dead = pose.dead;
    P.talk = d.talk;
    P.turn = this.turn;
    // Knocked flat: she sprawls on the floor until she shakes it off.
    P.sleep = pose.dead || pose.state === 'down';
    if (d.flap) {
      P.flapT = 0;
      d.flap = false;
    } else P.flapT = 1;
    this.rig.update(dt, P);
    this.root.visible = !d.hidden;
    this.haloAmt = damp(this.haloAmt, pose.dead ? 0 : d.fury, 3, dt);
    this.haloMat.opacity = this.haloAmt * (0.55 + Math.sin(performance.now() * 0.006) * 0.2);
    this.halo.rotation.z += dt * 0.8;
    this.halo.visible = this.haloAmt > 0.02;
  }
}

// --- attacks --------------------------------------------------------------------------------

const SCYTHE: AttackDef = {
  id: 'scythe', pose: 'tail1', range: 4.8, windup: 0.55, active: 0.45, recover: 0.55, cooldown: 1.5, weight: 3, kind: 'melee',
  damage: 15, knockback: 10, hitRange: 3.3, hitArc: Math.PI, telegraph: true,
};
const LUNGE: AttackDef = {
  id: 'lunge', pose: 'horn3', range: 11, minRange: 3.5, windup: 0.55, active: 0.42, recover: 0.65, cooldown: 2.6, weight: 2, kind: 'melee',
  damage: 17, knockback: 12, hitRange: 2.2, hitArc: 0.9, lunge: 22,
};
const BREATH: AttackDef = {
  id: 'breath', pose: 'breath', range: 10, minRange: 3, windup: 0.75, active: 1.6, recover: 0.7, cooldown: 5.5, weight: 2, kind: 'projectile',
  damage: 8, knockback: 6,
};
const POOF: AttackDef = {
  id: 'poof', pose: 'roar', range: 18, minRange: 3, windup: 0.3, active: 0.5, recover: 0, cooldown: 6, weight: 2, kind: 'projectile',
  damage: 0, knockback: 0,
};
const AMBUSH: AttackDef = {
  id: 'ambush', pose: 'uppercut', range: 99, windup: 0.45, active: 0.32, recover: 0.75, cooldown: 0, weight: 0, kind: 'melee',
  damage: 19, knockback: 11, launch: 8, hitRange: 2.6, hitArc: 1.3, lunge: 9,
};
const ORBS: AttackDef = {
  id: 'orbs', pose: 'burst', range: 45, windup: 0.8, active: 0.9, recover: 0.6, cooldown: 3.2, weight: 3, kind: 'projectile',
  damage: 10, knockback: 4,
};
const DIVE: AttackDef = {
  id: 'dive', pose: 'horn1', range: 45, windup: 1.15, active: 1.3, recover: 1.9, cooldown: 4.5, weight: 2.2, kind: 'dive',
  damage: 20, knockback: 12,
};
const SUMMON: AttackDef = {
  id: 'summon', pose: 'roar', range: 80, windup: 1.0, active: 0.3, recover: 0.8, cooldown: 24, weight: 1.5, kind: 'projectile',
  damage: 0, knockback: 0,
};
const NOVA: AttackDef = {
  id: 'nova', pose: 'fury', range: 30, windup: 0.9, active: 0.3, recover: 0.9, cooldown: 7, weight: 1.2, kind: 'projectile',
  damage: 10, knockback: 5,
};
const LEAP: AttackDef = {
  id: 'leap', pose: 'roar', range: 30, minRange: 6, windup: 0.5, active: 0.75, recover: 0, cooldown: 11, weight: 1, kind: 'projectile',
  damage: 0, knockback: 0,
};

const GROUND = [SCYTHE, LUNGE, BREATH, POOF];
const GROUND3 = [SCYTHE, LUNGE, BREATH, POOF, NOVA, LEAP];
const AIR = [ORBS, DIVE, SUMMON];

export const NYXA_DEF: EnemyDef = {
  id: 'nyxa', name: 'Nyxa', hp: 2100, radius: 1.3, height: 2.8, speed: 7.2, turnRate: 5, mass: 0, poise: 240,
  resist: { shadow: 0 }, statusResist: { fire: 0.7, lightning: 0.6, ice: 0.55 }, aggroRange: 80,
  gems: { blue: 260, red: 8, green: 6, purple: 8 },
  attacks: [SCYTHE, LUNGE, BREATH, POOF, AMBUSH, ORBS, DIVE, SUMMON, NOVA, LEAP],
  build: () => new NyxaModel(),
  styleValue: 12,
};

export interface ArenaInfo {
  x: number;
  y: number;
  z: number;
  /** Walkable radius of the arena floor. */
  r: number;
}

// --- the shadow rim ------------------------------------------------------------------------

/** In the last phase the edge of the arena turns to shadow. */
class EclipseRim extends Hazard {
  private world: Game;
  private ring: THREE.Mesh;
  private ringMat: THREE.MeshBasicMaterial;
  private t = 0;
  private hitCd = 0;
  private inner: number;
  private fxT = 0;

  constructor(game: Game, private cx: number, private cy: number, private cz: number, private innerTarget: number, private outer: number) {
    super(game, cx, cy, cz, 0.01, 0.01, 1.4, 9, 'shadow');
    this.world = game;
    this.inner = outer;
    this.ringMat = new THREE.MeshBasicMaterial({
      color: 0x8a2af0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    this.ring = new THREE.Mesh(new THREE.RingGeometry(innerTarget, outer, 72, 1), this.ringMat);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.set(cx, cy + 0.1, cz);
    game.level!.root.add(this.ring);
    game.level!.props.push(this);
    game.level!.hazards.push(this);
  }

  override contains(px: number, py: number, pz: number): boolean {
    const d = Math.hypot(px - this.cx, pz - this.cz);
    return d > this.inner && py < this.cy + 1.4 && py > this.cy - 0.6;
  }

  override update(dt: number): void {
    const g = this.world;
    this.t += dt;
    const k = clamp01(this.t / 1.6);
    this.inner = lerp(this.outer, this.innerTarget, k);
    this.ringMat.opacity = k * (0.5 + Math.sin(this.t * 4) * 0.15);
    this.fxT -= dt;
    if (this.fxT <= 0) {
      this.fxT = 0.04;
      const a = rng.next() * Math.PI * 2;
      const r = lerp(this.inner, this.outer, rng.next());
      g.fx.emit(this.cx + Math.sin(a) * r, this.cy + 0.1, this.cz + Math.cos(a) * r, {
        count: 1, speed: 1.6, dir: [0, 1, 0], spread: 0.3, life: [0.6, 1.1], size: [0.4, 0.7], sizeEnd: 0.1, color: 0xb04cff, colorEnd: 0x200830,
        bright: 1.6, gravity: -2,
      });
    }
    this.hitCd -= dt;
    const p = g.player;
    if (this.hitCd <= 0 && p.alive && this.contains(p.x, p.y, p.z)) {
      this.hitCd = 0.55;
      const dx = this.cx - p.x;
      const dz = this.cz - p.z;
      const n = Math.hypot(dx, dz) || 1;
      p.takeHit(makeHit({
        damage: 9 * g.difficultyInfo.enemyDamage, type: 'shadow', dirX: dx / n, dirZ: dz / n, knockback: 9, launch: 7,
        source: 'env', move: 'eclipseRim', fromPlayer: false, ox: p.x - dx / n, oz: p.z - dz / n,
      }), null);
    }
  }

  remove(): void {
    const level = this.world.level;
    if (!level) return;
    level.root.remove(this.ring);
    const i = level.props.indexOf(this);
    if (i >= 0) level.props.splice(i, 1);
    const j = level.hazards.indexOf(this);
    if (j >= 0) level.hazards.splice(j, 1);
  }
}

// --- the boss ----------------------------------------------------------------------------------

export class Nyxa extends Boss {
  readonly displayName = 'Nyxa, Shadow of the Eclipse';
  private m: NyxaModel;
  private arena: ArenaInfo;
  private flying = false;
  private falling = false;
  private diving = false;
  private hidden = false;
  /** Phase 2: seconds on the ground before she takes off again. */
  private groundT = 0;
  private divesLeft = 2;
  private orbitA = 0;
  private orbitDir = 1;
  private flyX = 0;
  private flyY = 0;
  private flyZ = 0;
  private flapT = 0;
  private roarT = 0;
  private roarKind = 1;
  private minions: Enemy[] = [];
  private summons = 0;
  private recentDmg = 0;
  private poofEscape = false;
  private poofX = 0;
  private poofZ = 0;
  private diveX = 0;
  private diveY = 0;
  private diveZ = 0;
  private breathTick = 0;
  private volley2 = false;
  private forceNext: AttackDef | null = null;
  private marker: THREE.Mesh;
  private markerMat: THREE.MeshBasicMaterial;
  private rim: EclipseRim | null = null;

  constructor(game: Game, x: number, y: number, z: number, yaw: number, arena: ArenaInfo) {
    super(game, NYXA_DEF, x, y, z, yaw);
    this.speakerId = 'nyxa';
    this.phases = 3;
    this.arena = arena;
    this.m = this.model as NyxaModel;
    this.markerMat = new THREE.MeshBasicMaterial({
      color: 0xff2050, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    this.marker = new THREE.Mesh(new THREE.RingGeometry(1.7, 2.4, 40, 1), this.markerMat);
    this.marker.rotation.x = -Math.PI / 2;
    this.marker.visible = false;
    game.level!.root.add(this.marker);
  }

  private get speedMul(): number {
    return this.phase === 3 ? 1.3 : 1;
  }

  // --- the brain ------------------------------------------------------------------------------

  protected override think(dt: number): void {
    const g = this.game;
    const dr = this.m.drive;
    this.recentDmg = Math.max(0, this.recentDmg - dt * 18);
    dr.talk = g.dialogueSpeaker === 'nyxa';
    if (!this.awake) {
      this.yaw = approachAngle(this.yaw, this.yawToPlayer(), dt * 2);
      dr.attack = null;
      return;
    }
    // Phases, one at a time.
    const f = this.hpFrac;
    const want = f < 0.33 ? 3 : f < 0.66 ? 2 : 1;
    if (want > this.phase && this.roarT <= 0) {
      this.enterPhase(this.phase + 1);
      return;
    }
    if (this.roarT > 0) {
      this.roarStep(dt);
      return;
    }
    if (this.falling) return;
    if (this.state === 'windup' || this.state === 'active' || this.state === 'recover') {
      this.attackStep(dt);
      return;
    }
    if (this.flying) this.thinkAir(dt);
    else this.thinkGround(dt);
  }

  private enterPhase(n: number): void {
    const g = this.game;
    const b = this.body;
    const a = this.arena;
    this.phase = n;
    this.attack = null;
    this.diving = false;
    this.marker.visible = false;
    this.setHidden(false);
    this.m.drive.breath = false;
    this.m.drive.charge = false;
    this.setState('strafe');
    this.roarKind = n;
    this.roarT = n === 2 ? 1.7 : 2.3;
    this.globalCd = 0.8;
    g.sfx('bossRoar', b.x, b.y, b.z, n === 2 ? 0.9 : 0.75);
    g.shake(0.6, 0.8);
    if (n === 2) {
      this.forceNext = SUMMON;
      this.cooldowns.set('summon', 0);
      g.toast('Nyxa takes to the sky!', 'warn');
      g.hud.flick('She\'s flying! Arc Breath and Fireballs reach her up there. A reaction or a heavy hit will knock her down!', 8);
    } else {
      // She drops out of the sky into the heart of the arena.
      this.flying = false;
      this.falling = false;
      this.m.drive.flying = false;
      g.fx.shadowPoof(b.x, b.y + 1.5, b.z, 2.5);
      const p = g.player.body;
      let x = a.x;
      let z = a.z;
      if (Math.hypot(p.x - a.x, p.z - a.z) < 5) {
        const ang = yawOf(a.x - p.x, a.z - p.z);
        x = a.x + Math.sin(ang) * 6;
        z = a.z + Math.cos(ang) * 6;
      }
      b.setPos(x, a.y, z);
      b.vx = b.vy = b.vz = 0;
      g.fx.shadowPoof(x, a.y + 1.5, z, 3);
      this.m.drive.fury = 1;
      g.toast('Eclipse Fury!', 'warn');
      g.hud.flick('The edge of the arena is pure shadow! Stay near the middle and keep moving!', 7);
    }
  }

  private roarStep(dt: number): void {
    const g = this.game;
    const b = this.body;
    const dr = this.m.drive;
    this.roarT -= dt;
    if (!this.flying) {
      b.vx *= 0.8;
      b.vz *= 0.8;
    }
    this.yaw = approachAngle(this.yaw, this.yawToPlayer(), dt * 3);
    dr.attack = this.roarKind === 3 ? 'fury' : 'roar';
    dr.attackT = 0.5;
    if (this.roarKind === 2 && !this.flying && this.roarT < 1.0) this.takeOff(true);
    if (this.flying) this.setFly(b.x, this.arena.y + HOVER, b.z);
    if (this.roarT <= 0) {
      dr.attack = null;
      if (this.roarKind === 3) {
        g.spawnShockwave(b.x, b.y, b.z, 15, 12, 12 * g.difficultyInfo.enemyDamage, 8, this);
        g.fx.ring(b.x, b.y + 0.2, b.z, 0.5, 15, SHADOW, 0.9);
        g.shake(0.7, 0.6);
        this.raiseRim();
      }
    }
  }

  private thinkGround(dt: number): void {
    const b = this.body;
    const a = this.arena;
    const d = this.distToPlayer();
    const dirYaw = this.yawToPlayer();
    this.m.drive.attack = null;
    if (this.phase === 2) {
      this.groundT -= dt;
      if (this.groundT <= 0 && this.globalCd <= 0) {
        this.takeOff(true);
        return;
      }
    }
    // Pressed hard, she slips away through the shadow.
    if (this.recentDmg > 60 && (this.cooldowns.get('poof') ?? 0) <= 0) {
      this.recentDmg = 0;
      this.poofEscape = true;
      this.startAttack(POOF);
      return;
    }
    const pick = this.globalCd <= 0 ? this.pickAttack(d) : null;
    if (pick) {
      this.poofEscape = false;
      this.startAttack(pick);
      return;
    }
    const sp = this.def.speed * this.speedMul;
    // Stay off the rim: drift back toward the middle when near the edge.
    const off = Math.hypot(b.x - a.x, b.z - a.z);
    const home = off > a.r - 5 ? yawOf(a.x - b.x, a.z - b.z) : null;
    if (home !== null && d > 3) {
      this.moveDir(home, sp * 0.8, dt);
      this.setState('chase');
    } else if (d > 6) {
      this.moveDir(dirYaw + this.strafeDir * 0.3, sp, dt);
      this.setState('chase');
    } else if (d < 3) {
      this.moveDir(dirYaw + Math.PI, sp * 0.6, dt, false);
      this.yaw = approachAngle(this.yaw, dirYaw, this.def.turnRate * dt);
      this.setState('strafe');
    } else {
      this.moveDir(dirYaw + this.strafeDir * Math.PI * 0.5, sp * 0.55, dt, false);
      this.yaw = approachAngle(this.yaw, dirYaw, this.def.turnRate * dt);
      this.setState('strafe');
    }
    if (rng.chance(dt * 0.35)) this.strafeDir = -this.strafeDir;
  }

  private thinkAir(dt: number): void {
    const g = this.game;
    const a = this.arena;
    const b = this.body;
    const p = g.player.body;
    this.m.drive.attack = null;
    this.orbitA += dt * 0.32 * this.orbitDir;
    if (rng.chance(dt * 0.08)) this.orbitDir = -this.orbitDir;
    // Circle the arena, leaning toward the dragon so her breath can reach.
    const ox = a.x + Math.sin(this.orbitA) * 11;
    const oz = a.z + Math.cos(this.orbitA) * 11;
    this.setFly(lerp(ox, p.x, 0.25), a.y + HOVER + Math.sin(g.time * 1.3) * 0.5, lerp(oz, p.z, 0.25));
    this.yaw = approachAngle(this.yaw, this.yawToPlayer(), 4 * dt);
    this.m.drive.glide = Math.hypot(b.vx, b.vz) > 7;
    if (this.globalCd > 0) return;
    const next = this.forceNext ?? this.pickAttack(this.distToPlayer());
    this.forceNext = null;
    if (next) this.startAttack(next);
  }

  protected override pickAttack(d: number): AttackDef | null {
    const set = this.flying ? AIR : this.phase === 3 ? GROUND3 : GROUND;
    let total = 0;
    const opts: AttackDef[] = [];
    for (const a of set) {
      if ((this.cooldowns.get(a.id) ?? 0) > 0) continue;
      if (d > a.range || d < (a.minRange ?? 0)) continue;
      if (a.id === 'summon' && !this.canSummon()) continue;
      if (a.id === 'dive' && this.divesLeft <= 0) continue;
      opts.push(a);
      total += a.weight;
    }
    if (opts.length === 0) return null;
    let r = rng.next() * total;
    for (const a of opts) {
      r -= a.weight;
      if (r <= 0) return a;
    }
    return opts[opts.length - 1]!;
  }

  private canSummon(): boolean {
    if (this.phase !== 2) return false;
    this.minions = this.minions.filter((e) => e.alive);
    if (this.minions.length > 0 || this.summons >= 2) return false;
    return this.summons === 0 || this.hpFrac < 0.52;
  }

  // --- attacks ----------------------------------------------------------------------------------

  override startAttack(a: AttackDef): void {
    super.startAttack(a);
    this.volley2 = false;
    this.breathTick = 0;
    this.m.drive.breath = false;
    this.m.drive.charge = false;
    if (a.id === 'dive') {
      const p = this.game.player.body;
      this.diveX = p.x;
      this.diveZ = p.z;
      this.marker.visible = true;
      this.game.sfx('bossRoar', this.x, this.y, this.z, 1.3, 0.5);
    }
  }

  private attackStep(dt: number): void {
    const a = this.attack;
    if (!a) {
      this.setState('chase');
      return;
    }
    const g = this.game;
    const b = this.body;
    const agg = g.difficultyInfo.aggression * this.speedMul;
    const dr = this.m.drive;
    const dirYaw = this.yawToPlayer();
    if (this.state === 'windup') {
      const w = a.windup / agg;
      const k = clamp01(this.stateT / w);
      this.windupStep(a, dt, dirYaw, k);
      if (this.stateT >= w) {
        this.state = 'active';
        this.stateT = 0;
        this.onActiveStart(a);
      }
      return;
    }
    if (this.state === 'active') {
      const dur = a.id === 'breath' || a.id === 'dive' ? a.active : a.active / agg;
      const k = clamp01(this.stateT / dur);
      this.activeStep(a, dt, dirYaw, k);
      if (this.state === 'active' && this.stateT >= dur) {
        this.state = 'recover';
        this.stateT = 0;
        this.onActiveEnd(a);
      }
      return;
    }
    // Recover.
    const r = a.recover / agg;
    const k = clamp01(this.stateT / Math.max(0.01, r));
    dr.breath = false;
    dr.charge = false;
    switch (a.id) {
      case 'scythe': dr.attackT = lerp(0.8, 1, k); break;
      case 'lunge': dr.attackT = lerp(0.5, 0.95, k); break;
      case 'ambush': dr.attackT = lerp(0.7, 1, k); break;
      case 'dive':
        dr.attack = k < 0.35 ? 'slamLand' : null;
        dr.attackT = k / 0.35;
        break;
      default: dr.attack = null;
    }
    if (!this.flying) {
      b.vx *= 0.85;
      b.vz *= 0.85;
    }
    if (this.stateT >= r) this.finishAttack(a);
  }

  private windupStep(a: AttackDef, dt: number, dirYaw: number, k: number): void {
    const g = this.game;
    const b = this.body;
    const dr = this.m.drive;
    dr.attack = POSE[a.id] ?? null;
    if (!this.flying) {
      this.yaw = approachAngle(this.yaw, dirYaw, this.def.turnRate * 1.5 * dt);
      b.vx *= 0.8;
      b.vz *= 0.8;
    } else {
      this.yaw = approachAngle(this.yaw, dirYaw, 4 * dt);
    }
    switch (a.id) {
      case 'scythe': dr.attackT = 0.02; break;
      case 'lunge': dr.attackT = 0.08 * k; break;
      case 'ambush': dr.attackT = 0.1 * k; break;
      case 'breath':
      case 'orbs': dr.attack = 'burst'; dr.attackT = 0.3 * k; break;
      case 'nova': dr.attackT = 0.5; break;
      case 'poof':
      case 'leap':
      case 'summon': dr.attackT = 0.4; break;
      case 'dive': {
        // Rear up, and paint the landing spot.
        dr.attack = 'fury';
        dr.attackT = 0.5;
        this.setFly(b.x - Math.sin(this.yaw) * 1.5, this.arena.y + HOVER + 2, b.z - Math.cos(this.yaw) * 1.5);
        const p = g.player.body;
        this.diveX = damp(this.diveX, p.x, 5, dt);
        this.diveZ = damp(this.diveZ, p.z, 5, dt);
        this.clampToArena(3);
        this.marker.position.set(this.diveX, this.arena.y + 0.12, this.diveZ);
        const s = 1 + Math.sin(g.time * 14) * 0.08;
        this.marker.scale.set(s * (1.4 - k * 0.4), s * (1.4 - k * 0.4), 1);
        this.markerMat.opacity = 0.45 + k * 0.45;
        break;
      }
    }
    if (this.flying && a.id !== 'dive') this.setFly(b.x, this.flyY, b.z);
  }

  protected override onActiveStart(a: AttackDef): void {
    const g = this.game;
    const b = this.body;
    switch (a.id) {
      case 'scythe':
        g.fx.swoosh(b.x, b.y + 0.9, b.z, this.yaw, 4, Math.PI * 2, 0xd070ff, 'h', 0, 0.35, 0.7);
        g.sfx('swingHeavy', b.x, b.y, b.z, 0.7);
        break;
      case 'lunge':
      case 'ambush':
        g.sfx('swingHeavy', b.x, b.y, b.z, 0.85);
        g.fx.swoosh(b.x, b.y + 1.4, b.z, this.yaw, 2.8, 1.6, 0xff60c0, 'v', 0, 0.25, 0.5);
        break;
      case 'breath':
        g.sfx('fireBurst', b.x, b.y, b.z, 0.55);
        break;
      case 'poof':
        this.vanish();
        break;
      case 'orbs':
        this.volley(this.phase === 3 ? 7 : 5, 0.32);
        break;
      case 'dive':
        this.diving = true;
        this.diveY = this.arena.y;
        g.sfx('flap', b.x, b.y, b.z, 0.5);
        break;
      case 'summon':
        this.summon();
        break;
      case 'nova':
        this.nova();
        break;
      case 'leap':
        this.flying = true;
        this.m.drive.flying = true;
        this.m.drive.flap = true;
        b.vy = 12;
        b.grounded = false;
        this.setFly(b.x, this.arena.y + HOVER + 1, b.z);
        g.sfx('flap', b.x, b.y, b.z, 0.5);
        g.fx.dust(b.x, b.y, b.z, 20, 0x6a5a7a);
        break;
    }
  }

  private activeStep(a: AttackDef, dt: number, dirYaw: number, k: number): void {
    const b = this.body;
    const dr = this.m.drive;
    switch (a.id) {
      case 'scythe':
        dr.attack = 'tail1';
        dr.attackT = lerp(0.05, 0.8, k);
        this.meleeCheck(a);
        break;
      case 'lunge':
      case 'ambush':
        dr.attack = POSE[a.id] ?? null;
        dr.attackT = a.id === 'lunge' ? lerp(0.1, 0.5, k) : lerp(0.25, 0.7, k);
        dr.charge = a.id === 'lunge';
        this.moveForward(a.lunge ?? 0, dt);
        this.meleeCheck(a);
        break;
      case 'breath':
        dr.attack = null;
        dr.breath = true;
        this.yaw = approachAngle(this.yaw, dirYaw, (this.phase === 3 ? 1.5 : 1.1) * dt);
        b.vx *= 0.8;
        b.vz *= 0.8;
        this.breathStep(dt);
        break;
      case 'orbs':
        dr.attack = 'burst';
        dr.attackT = lerp(0.35, 1, k);
        if (!this.volley2 && this.stateT > 0.45) {
          this.volley2 = true;
          this.volley(this.phase === 3 ? 6 : 4, 0.22);
        }
        break;
      case 'dive':
        this.diveStep();
        break;
      case 'nova':
        dr.attack = 'burst';
        dr.attackT = lerp(0.4, 1, k);
        break;
      case 'leap':
        dr.attack = null;
        if (this.stateT % 0.3 < dt) dr.flap = true;
        break;
      default:
        break;
    }
  }

  private onActiveEnd(a: AttackDef): void {
    if (a.id === 'poof' || a.id === 'leap') this.cooldowns.set(a.id, a.cooldown);
    switch (a.id) {
      case 'poof':
        this.reappear();
        if (this.poofEscape) {
          this.poofEscape = false;
          const d = this.distToPlayer();
          this.startAttack(d > 5 && rng.chance(0.6) ? BREATH : LUNGE);
        } else this.startAttack(AMBUSH);
        break;
      case 'leap':
        this.divesLeft = 1;
        this.startAttack(DIVE);
        break;
      case 'dive':
        if (this.diving) this.diveImpact();
        break;
    }
  }

  private finishAttack(a: AttackDef): void {
    const g = this.game;
    this.cooldowns.set(a.id, a.cooldown);
    const base = this.phase === 3 ? 0.25 + rng.next() * 0.35 : 0.45 + rng.next() * 0.7;
    this.globalCd = base / g.difficultyInfo.aggression;
    this.attack = null;
    const dr = this.m.drive;
    dr.attack = null;
    dr.breath = false;
    dr.charge = false;
    this.setState('chase');
    const d = this.distToPlayer();
    if (a.id === 'dive') {
      if (this.phase === 2 && this.divesLeft > 0) this.takeOff(false);
      else if (this.phase === 2) {
        this.groundT = 7.5;
        g.hud.flick('She\'s landed! Hit her while she\'s on the ground!', 4);
      }
      return;
    }
    // Chains: she gets more relentless as she weakens.
    if (this.phase === 3 && a.id === 'scythe' && d < 9 && rng.chance(0.6)) this.startAttack(LUNGE);
    else if (this.phase === 3 && a.id === 'lunge' && rng.chance(0.35)) this.startAttack(POOF);
    else if (this.phase >= 2 && !this.flying && a.id === 'lunge' && d < 4.5 && rng.chance(0.4)) this.startAttack(SCYTHE);
  }

  // --- attack pieces ---------------------------------------------------------------------------

  private mouthPos(): THREE.Vector3 {
    this.m.rig.mouth.getWorldPosition(tmp);
    return tmp;
  }

  private breathStep(dt: number): void {
    const g = this.game;
    const b = this.body;
    const m = this.mouthPos();
    const dx = Math.sin(this.yaw);
    const dz = Math.cos(this.yaw);
    g.fx.emit(m.x, m.y, m.z, {
      count: 5, speed: 21, speedJitter: 0.25, dir: [dx, -0.14, dz], spread: 0.15, life: [0.35, 0.5], size: [0.35, 0.55], sizeEnd: 4,
      color: 0xd070ff, colorEnd: 0x2a0a40, bright: 1.7, drag: 1.3,
    });
    if (rng.chance(0.4)) {
      g.fx.emit(m.x + dx * 5, m.y - 0.5, m.z + dz * 5, {
        count: 1, speed: 1, dir: [0, 1, 0], life: [0.5, 0.9], size: [0.9, 1.3], sizeEnd: 2.6, color: 0x140820, alpha: 0.45, additive: false, gravity: -2,
      });
    }
    g.fx.flash(m.x + dx, m.y, m.z + dz, SHADOW, 3, 10, 0.1);
    this.breathTick -= dt;
    if (this.breathTick > 0) return;
    this.breathTick = 0.14;
    const p = g.player;
    const px = p.x - m.x;
    const pz = p.z - m.z;
    const d = Math.hypot(px, pz);
    const ang = Math.abs(angleDiff(this.yaw, yawOf(px, pz)));
    if (d < BREATH_RANGE && ang < 0.34 + Math.atan2(0.6, Math.max(1, d)) && Math.abs(p.y - b.y) < 3) {
      const n = d || 1;
      p.takeHit(makeHit({
        damage: 8 * g.difficultyInfo.enemyDamage, type: 'shadow', dirX: px / n, dirZ: pz / n, knockback: 6, launch: 3,
        source: 'enemy', move: 'shadowBreath', fromPlayer: false, ox: b.x, oz: b.z,
      }), this);
    }
  }

  private vanish(): void {
    const g = this.game;
    const b = this.body;
    const a = this.arena;
    const p = g.player.body;
    g.fx.shadowPoof(b.x, b.y + 1.3, b.z, 2);
    g.sfx('swingHeavy', b.x, b.y, b.z, 0.45);
    let ang: number;
    let dist: number;
    if (this.poofEscape) {
      ang = yawOf(a.x - p.x, a.z - p.z) + rng.signed() * 0.9;
      dist = 8.5;
    } else {
      const from = yawOf(b.x - p.x, b.z - p.z);
      const swing = 1.9 + rng.next() * 0.6;
      // Of the two flanks, take the one farther from the camera.
      const cam = g.camera.position;
      const score = (s: number) => {
        const t = from + s * swing;
        return Math.hypot(p.x + Math.sin(t) * 3.4 - cam.x, p.z + Math.cos(t) * 3.4 - cam.z);
      };
      ang = from + (score(1) >= score(-1) ? 1 : -1) * swing;
      dist = 3.4;
    }
    let x = p.x + Math.sin(ang) * dist;
    let z = p.z + Math.cos(ang) * dist;
    const ox = x - a.x;
    const oz = z - a.z;
    const od = Math.hypot(ox, oz);
    const lim = a.r - 3.5;
    if (od > lim) {
      x = a.x + (ox / od) * lim;
      z = a.z + (oz / od) * lim;
    }
    this.poofX = x;
    this.poofZ = z;
    b.vx = b.vz = 0;
    this.setHidden(true);
  }

  private reappear(): void {
    const g = this.game;
    const b = this.body;
    const gy = g.col.groundAt(this.poofX, this.poofZ, this.arena.y + 3, 0.3).y;
    b.setPos(this.poofX, gy > -1e3 ? gy : this.arena.y, this.poofZ);
    b.vx = b.vy = b.vz = 0;
    this.yaw = this.yawToPlayer();
    this.setHidden(false);
    g.fx.shadowPoof(b.x, b.y + 1.3, b.z, 2);
    g.fx.ring(b.x, b.y + 0.1, b.z, 0.3, 3.2, ROSE, 0.4);
    g.sfx('enemyAlert', b.x, b.y, b.z, 0.6);
  }

  private setHidden(h: boolean): void {
    this.hidden = h;
    this.m.drive.hidden = h;
  }

  private volley(n: number, spread: number): void {
    const g = this.game;
    const p = g.player.body;
    const m = this.mouthPos();
    const tx = p.x + p.vx * 0.35;
    const ty = p.y + 0.8;
    const tz = p.z + p.vz * 0.35;
    const baseYaw = yawOf(tx - m.x, tz - m.z);
    const pitch = Math.atan2(ty - m.y, Math.hypot(tx - m.x, tz - m.z));
    for (let i = 0; i < n; i++) {
      const yaw = baseYaw + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread * 2);
      g.spawnProjectile({
        x: m.x, y: m.y, z: m.z, dx: Math.sin(yaw) * Math.cos(pitch), dy: Math.sin(pitch), dz: Math.cos(yaw) * Math.cos(pitch),
        speed: 13, radius: 0.45, damage: 10, type: 'shadow', color: 0xd070ff, life: 3.2, gravity: 0, fromPlayer: false, homing: 0.5, knockback: 5,
      });
    }
    g.sfx('zap', m.x, m.y, m.z, 0.5, 0.8);
    g.fx.flash(m.x, m.y, m.z, SHADOW, 6, 12, 0.2);
  }

  private nova(): void {
    const g = this.game;
    const b = this.body;
    const n = 14;
    const off = rng.next() * Math.PI;
    for (let i = 0; i < n; i++) {
      const yaw = off + (i / n) * Math.PI * 2;
      g.spawnProjectile({
        x: b.x + Math.sin(yaw) * 1.4, y: b.y + 0.75, z: b.z + Math.cos(yaw) * 1.4, dx: Math.sin(yaw), dy: 0, dz: Math.cos(yaw),
        speed: 9, radius: 0.5, damage: 10, type: 'shadow', color: 0xe060ff, life: 2.6, gravity: 0, fromPlayer: false, knockback: 6,
      });
    }
    g.fx.ring(b.x, b.y + 0.3, b.z, 0.5, 6, 0xe060ff, 0.5);
    g.sfx('explosion', b.x, b.y, b.z, 0.7, 0.7);
    g.shake(0.3, 0.3);
  }

  private summon(): void {
    const g = this.game;
    const a = this.arena;
    const pAng = yawOf(g.player.x - a.x, g.player.z - a.z);
    for (const s of [-1, 1]) {
      const ang = pAng + s * 1.7;
      const x = a.x + Math.sin(ang) * 9;
      const z = a.z + Math.cos(ang) * 9;
      const gy = g.col.groundAt(x, z, a.y + 4, 0.3).y;
      const e = g.spawnEnemy('knight', x, (gy > -1e3 ? gy : a.y) + 0.05, z, yawOf(a.x - x, a.z - z), true);
      e.aggro = true;
      e.spawnDelay = s > 0 ? 0.35 : 0;
      this.minions.push(e);
      g.fx.shadowPoof(x, a.y + 1, z, 2);
    }
    this.summons++;
    g.sfx('bossRoar', this.x, this.y, this.z, 1.2, 0.7);
    g.toast('Shade Knights rise from the dark!', 'warn');
  }

  private diveStep(): void {
    const g = this.game;
    const b = this.body;
    const dr = this.m.drive;
    dr.attack = null;
    dr.charge = true;
    dr.glide = true;
    if (!this.diving) return;
    const dx = this.diveX - b.x;
    const dy = this.diveY - b.y;
    const dz = this.diveZ - b.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 1.0 || (b.grounded && this.stateT > 0.08) || this.stateT > 1.2) {
      this.diveImpact();
      return;
    }
    const sp = 30;
    b.vx = (dx / dist) * sp;
    b.vy = (dy / dist) * sp;
    b.vz = (dz / dist) * sp;
    this.yaw = yawOf(dx, dz);
    g.fx.emit(b.x, b.y + 1.2, b.z, { count: 2, speed: 1, life: [0.3, 0.5], size: [0.8, 1.2], sizeEnd: 0.2, color: SHADOW, bright: 1.4, jitter: 0.8 });
    // Clipping the dragon on the way down hurts too.
    const p = g.player;
    if (!this.attackHit && Math.hypot(p.x - b.x, p.y + 0.6 - (b.y + 1.2), p.z - b.z) < 2.2) {
      this.attackHit = true;
      const n = Math.hypot(p.x - b.x, p.z - b.z) || 1;
      p.takeHit(makeHit({
        damage: 16 * g.difficultyInfo.enemyDamage, type: 'shadow', dirX: (p.x - b.x) / n, dirZ: (p.z - b.z) / n, knockback: 12, launch: 6,
        source: 'enemy', move: 'dive', fromPlayer: false, ox: b.x, oz: b.z,
      }), this);
    }
  }

  private diveImpact(): void {
    const g = this.game;
    const b = this.body;
    this.diving = false;
    this.flying = false;
    this.m.drive.flying = false;
    this.m.drive.glide = false;
    this.m.drive.charge = false;
    this.marker.visible = false;
    b.vx = b.vz = 0;
    b.vy = Math.min(b.vy, 0);
    const gy = g.col.groundAt(b.x, b.z, b.y + 2, 0.4).y;
    const y = gy > -1e3 ? gy : this.arena.y;
    g.spawnShockwave(b.x, y, b.z, 11, 13, 13 * g.difficultyInfo.enemyDamage, 9, this);
    g.explode(b.x, y + 0.8, b.z, 3.4, 18, 'shadow', false, {
      buildup: 0, knockback: 12, launch: 7, stagger: 0, heavy: false, move: 'nyxaDive', color: SHADOW, burnGround: false,
    });
    g.fx.shadowPoof(b.x, y + 0.5, b.z, 2.5);
    g.fx.ring(b.x, y + 0.15, b.z, 0.5, 5, ROSE, 0.4);
    g.fx.dust(b.x, y, b.z, 24, 0x5a4a6a);
    g.shake(0.9, 0.5);
    g.sfx('pound', b.x, y, b.z, 0.6);
    this.divesLeft--;
    this.state = 'recover';
    this.stateT = 0;
  }

  // --- flight ------------------------------------------------------------------------------------

  private setFly(x: number, y: number, z: number): void {
    const a = this.arena;
    const ox = x - a.x;
    const oz = z - a.z;
    const od = Math.hypot(ox, oz);
    const lim = a.r - 3;
    if (od > lim) {
      x = a.x + (ox / od) * lim;
      z = a.z + (oz / od) * lim;
    }
    this.flyX = x;
    this.flyY = y;
    this.flyZ = z;
  }

  private clampToArena(margin: number): void {
    const a = this.arena;
    const ox = this.diveX - a.x;
    const oz = this.diveZ - a.z;
    const od = Math.hypot(ox, oz);
    const lim = a.r - margin;
    if (od > lim) {
      this.diveX = a.x + (ox / od) * lim;
      this.diveZ = a.z + (oz / od) * lim;
    }
  }

  private takeOff(fresh: boolean): void {
    if (this.flying) return;
    const g = this.game;
    const b = this.body;
    const a = this.arena;
    this.flying = true;
    this.falling = false;
    if (fresh) this.divesLeft = 2;
    this.m.drive.flying = true;
    this.m.drive.flap = true;
    this.orbitA = yawOf(b.x - a.x, b.z - a.z);
    this.setFly(b.x, a.y + HOVER, b.z);
    b.vy = 8;
    b.grounded = false;
    this.setState('strafe');
    g.sfx('flap', b.x, b.y, b.z, 0.45);
    g.fx.dust(b.x, b.y, b.z, 24, 0x6a5a7a);
    g.fx.ring(b.x, b.y + 0.1, b.z, 0.5, 6, SHADOW, 0.5);
  }

  private startFall(): void {
    if (!this.flying) return;
    this.flying = false;
    this.falling = true;
    this.diving = false;
    this.attack = null;
    this.marker.visible = false;
    const dr = this.m.drive;
    dr.flying = false;
    dr.glide = false;
    dr.charge = false;
    dr.breath = false;
    const b = this.body;
    b.vy = Math.min(b.vy, 0);
    b.vx *= 0.3;
    b.vz *= 0.3;
    this.game.toast('Nyxa is knocked out of the sky!', 'good');
  }

  private land(): void {
    const g = this.game;
    const b = this.body;
    this.falling = false;
    g.shake(0.6, 0.4);
    g.sfx('pound', b.x, b.y, b.z, 0.7);
    g.fx.dust(b.x, b.y, b.z, 26, 0x5a4a6a);
    g.fx.shadowPoof(b.x, b.y + 0.5, b.z, 1.5);
    this.attack = null;
    this.setState('down');
    // Dazed: she stays down and takes extra damage for a moment.
    this.flipped = 3.2;
    this.groundT = 8;
    this.divesLeft = 2;
    g.hud.flick('She\'s down! Now, Aster, everything you\'ve got!', 4);
  }

  override integrate(dt: number, friction: number): void {
    const b = this.body;
    if (this.flying && this.alive) {
      if (this.status.stunned || this.state === 'hitstun' || this.state === 'down') {
        this.startFall();
      } else {
        if (!this.diving) {
          // Steer toward the flight target with a soft spring.
          let tx = (this.flyX - b.x) * 1.8;
          let ty = (this.flyY - b.y) * 2.2;
          let tz = (this.flyZ - b.z) * 1.8;
          const s = Math.hypot(tx, tz);
          if (s > 13) {
            tx *= 13 / s;
            tz *= 13 / s;
          }
          ty = clamp(ty, -8, 10);
          const k = 1 - Math.exp(-4 * dt);
          b.vx += (tx - b.vx) * k;
          b.vy += (ty - b.vy) * k;
          b.vz += (tz - b.vz) * k;
          this.flapT -= dt;
          if (this.flapT <= 0 && !this.m.drive.glide) {
            this.flapT = 0.55;
            this.m.drive.flap = true;
            if (rng.chance(0.3)) this.game.sfx('flap', b.x, b.y, b.z, 0.55, 0.5);
          }
        }
        this.game.col.move(b, dt);
        return;
      }
    }
    super.integrate(dt, friction);
    if (this.falling && b.grounded && this.alive) this.land();
    // Never lose her to the void.
    if (this.alive && b.y < this.arena.y - 6) {
      const a = this.arena;
      this.falling = false;
      b.setPos(a.x, a.y + 0.2, a.z);
      b.vx = b.vy = b.vz = 0;
      this.game.fx.shadowPoof(a.x, a.y + 1.5, a.z, 3);
    }
  }

  // --- the rim ------------------------------------------------------------------------------------

  private raiseRim(): void {
    if (this.rim) return;
    const a = this.arena;
    this.rim = new EclipseRim(this.game, a.x, a.y, a.z, a.r - 5.5, a.r + 1);
  }

  // --- damage and endings -------------------------------------------------------------------------

  override takeHit(hit: Hit): HitResult {
    if (this.hidden) return 'none';
    if (this.roarT > 0 && this.awake) {
      this.game.fx.sparkle(this.x, this.y + this.height * 0.6, this.z, 0xe060ff, 5);
      return 'immune';
    }
    const hp0 = this.hp;
    const r = super.takeHit(hit);
    // A phase can only end once she has fought it.
    if (this.alive && this.phase < 3) {
      const floor = (this.phase === 1 ? 0.645 : 0.315) * this.maxHp;
      if (this.hp < floor) this.hp = floor;
    }
    this.recentDmg += Math.max(0, hp0 - this.hp);
    return r;
  }

  protected override onBossStagger(_hit: Hit): void {
    if (this.hidden || this.roarT > 0) return;
    const g = this.game;
    if (this.flying) {
      this.startFall();
      return;
    }
    this.attack = null;
    this.m.drive.breath = false;
    this.m.drive.charge = false;
    this.setState('hitstun');
    this.hitstunMax = 1.7;
    g.toast('Nyxa staggers!', 'good');
    g.sfx('bossRoar', this.x, this.y, this.z, 1.4, 0.6);
  }

  private cleanup(): void {
    this.marker.visible = false;
    this.rim?.remove();
    this.rim = null;
    for (const e of this.minions) {
      if (!e.alive) continue;
      e.alive = false;
      e.releaseToken();
      e.setState('dead');
      e.deadT = 0;
      this.game.fx.shadowPoof(e.x, e.y + 1, e.z, 1.5);
    }
    this.minions = [];
  }

  override die(hit: Parameters<Enemy['die']>[0], reaction: Reaction | null = null): void {
    if (!this.alive) return;
    this.flying = false;
    this.falling = false;
    this.diving = false;
    this.setHidden(false);
    const dr = this.m.drive;
    dr.flying = false;
    dr.breath = false;
    dr.charge = false;
    dr.attack = null;
    this.cleanup();
    super.die(hit, reaction);
  }

  override dispose(): void {
    this.cleanup();
    super.dispose();
  }
}

/** Rig pose for each attack's windup and strike. */
const POSE: Record<string, string> = {
  scythe: 'tail1',
  lunge: 'horn3',
  ambush: 'uppercut',
  breath: 'burst',
  orbs: 'burst',
  poof: 'roar',
  summon: 'roar',
  nova: 'fury',
  leap: 'roar',
  dive: 'fury',
};
