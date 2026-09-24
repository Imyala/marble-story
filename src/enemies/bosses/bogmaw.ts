import * as THREE from 'three';
import { Boss } from '../boss';
import type { EnemyDef, AttackDef } from '../enemy';
import type { EnemyModel, EnemyPose } from '../models';
import type { Game } from '../../game/game';
import type { Hit } from '../../game/types';
import { makeHit } from '../../game/types';
import { matUnique, mat, glow } from '../../render/materials';
import { ellipsoid, spike, limb } from '../../render/shapes';
import { damp, smoothstep, yawOf, approachAngle } from '../../core/math';
import { rng } from '../../core/rng';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

class BogmawModel implements EnemyModel {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  private jaw = new THREE.Group();
  private tongue: THREE.Mesh;
  private arms: THREE.Group[] = [];
  private eyes: THREE.Mesh[] = [];
  private mats: THREE.MeshStandardMaterial[] = [];
  private t = 0;
  private p = { crouch: 0, jaw: 0, tongue: 0, armL: 0, armR: 0, lean: 0, sink: 0 };

  constructor() {
    const skin = matUnique(0x5a6a32, { rough: 0.8 });
    const belly = matUnique(0xa89a5a, { rough: 0.85 });
    this.mats.push(skin, belly);
    const dark = mat(0x2a2a18, { rough: 1 });
    this.root.add(this.body);
    const torso = ellipsoid(2.3, 1.7, 2.1, skin, 20);
    torso.position.y = 2.0;
    this.body.add(torso);
    const bel = ellipsoid(1.9, 1.3, 1.4, belly, 16);
    bel.position.set(0, 1.6, 0.9);
    this.body.add(bel);
    // Mouth line and jaw.
    const lip = ellipsoid(1.9, 0.18, 1.2, dark, 14);
    lip.position.set(0, 2.1, 1.25);
    this.body.add(lip);
    this.jaw.position.set(0, 2.05, 0.6);
    this.body.add(this.jaw);
    const jawM = ellipsoid(1.8, 0.45, 1.3, belly, 14);
    jawM.position.set(0, -0.3, 0.7);
    this.jaw.add(jawM);
    const tg = new THREE.CylinderGeometry(0.28, 0.35, 1, 10);
    tg.rotateX(Math.PI / 2);
    tg.translate(0, 0, 0.5);
    this.tongue = new THREE.Mesh(tg, matUnique(0xd8506a, { rough: 0.4 }));
    this.tongue.position.set(0, 0, 0.9);
    this.tongue.scale.z = 0.01;
    this.jaw.add(this.tongue);
    for (let i = -3; i <= 3; i++) {
      const t = spike(0.09, 0.3, mat(0xf0e8d0), 4);
      t.position.set(i * 0.28, 2.0, 1.7 - Math.abs(i) * 0.12);
      t.rotation.x = Math.PI;
      this.body.add(t);
    }
    // Eyes on top.
    for (const sx of [-1, 1]) {
      const bulge = ellipsoid(0.55, 0.5, 0.55, skin, 12);
      bulge.position.set(sx * 0.95, 3.45, 0.7);
      this.body.add(bulge);
      const e = ellipsoid(0.34, 0.34, 0.2, glow(0xffd040), 10);
      e.position.set(sx * 0.98, 3.55, 1.12);
      this.body.add(e);
      this.eyes.push(e);
      const pu = ellipsoid(0.08, 0.26, 0.05, mat(0x100808), 6);
      pu.position.set(sx * 0.98, 3.55, 1.3);
      this.body.add(pu);
    }
    // Corruption cracks and moss.
    const crack = glow(0xc050ff);
    for (let i = 0; i < 8; i++) {
      const c = ellipsoid(0.08, 0.5, 0.05, crack, 6);
      const a = -1.2 + i * 0.35;
      c.position.set(Math.sin(a) * 2.2, 2.2 + Math.cos(i * 1.7) * 0.5, Math.cos(a) * 1.9 - 0.3);
      c.rotation.set(0, a, i * 0.7);
      this.body.add(c);
    }
    const moss = mat(0x3a5a22, { rough: 1, flat: true });
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + rng.next() * 0.3, 0), moss);
      const a = rng.next() * Math.PI * 2;
      m.position.set(Math.sin(a) * 1.6, 3.2 + rng.next() * 0.3, Math.cos(a) * 1.3 - 0.5);
      this.body.add(m);
    }
    for (let i = 0; i < 5; i++) {
      const s = spike(0.25, 0.9, mat(0x4a3a28), 5);
      s.position.set((i - 2) * 0.6, 3.4, -0.6 - Math.abs(i - 2) * 0.2);
      s.rotation.x = -0.6;
      this.body.add(s);
    }
    // Arms.
    for (const side of [1, -1]) {
      const a = new THREE.Group();
      a.position.set(side * 2.1, 2.3, 0.6);
      a.add(limb(V(0, 0, 0), V(side * 0.4, -1.1, 0.4), 0.45, 0.4, skin, 10));
      const hand = ellipsoid(0.55, 0.4, 0.6, skin, 10);
      hand.position.set(side * 0.45, -1.3, 0.55);
      a.add(hand);
      for (let c = -1; c <= 1; c++) {
        const cl = spike(0.1, 0.4, mat(0xf0e8d0), 4);
        cl.position.set(side * 0.45 + c * 0.25, -1.5, 1.0);
        cl.rotation.x = Math.PI * 0.6;
        a.add(cl);
      }
      this.body.add(a);
      this.arms.push(a);
      const leg = ellipsoid(0.9, 0.7, 1.1, skin, 12);
      leg.position.set(side * 1.7, 0.7, -0.8);
      this.body.add(leg);
      const foot = ellipsoid(0.7, 0.3, 1.0, skin, 10);
      foot.position.set(side * 1.8, 0.2, -0.1);
      this.body.add(foot);
    }
    this.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
  }

  setFlash(amount: number, color: number): void {
    for (const m of this.mats) {
      m.emissive.setHex(color);
      m.emissiveIntensity = amount;
    }
  }

  update(dt: number, pose: EnemyPose): void {
    this.t += dt;
    const P = this.p;
    let crouch = 0;
    let jaw = 0.05 + Math.sin(this.t * 1.5) * 0.03;
    let tongue = 0;
    let armL = Math.sin(this.t * 1.2) * 0.1;
    let armR = -armL;
    let lean = 0;
    let sink = 0;
    const atk = pose.attack;
    const w = pose.state === 'windup' ? smoothstep(0, 1, pose.windup) : 0;
    const active = pose.state === 'active';
    if (pose.state === 'windup' || active || pose.state === 'recover') {
      switch (atk) {
        case 'tongue':
          jaw = pose.state === 'windup' ? 0.2 + w * 0.3 : active ? 0.6 : 0.3;
          tongue = active ? Math.min(1, pose.t / 0.12) : 0;
          lean = -0.15 * w + (active ? 0.15 : 0);
          break;
        case 'swing':
          armL = pose.state === 'windup' ? -1.8 * w : active ? 0.9 : 0.4;
          lean = active ? 0.2 : 0;
          break;
        case 'slam':
          crouch = pose.state === 'windup' ? w : 0;
          jaw = 0.3;
          armL = armR = -0.8;
          break;
        case 'spit':
          jaw = pose.state === 'windup' ? w * 0.5 : 0.7;
          lean = pose.state === 'windup' ? -0.3 * w : 0.25;
          break;
        case 'roar':
          jaw = 0.8;
          lean = -0.3;
          armL = armR = -1.2;
          break;
      }
    }
    if (pose.state === 'hitstun') {
      lean = 0.35;
      jaw = 0.4;
      armL = armR = 0.5;
      sink = pose.flipped ? 0.8 : 0.2;
    }
    if (pose.dead) {
      lean = 0.6;
      jaw = 0.6;
      sink = 1.2;
    }
    P.crouch = damp(P.crouch, crouch, 10, dt);
    P.jaw = damp(P.jaw, jaw, 18, dt);
    P.tongue = damp(P.tongue, tongue, 30, dt);
    P.armL = damp(P.armL, armL, 14, dt);
    P.armR = damp(P.armR, armR, 14, dt);
    P.lean = damp(P.lean, lean, 10, dt);
    P.sink = damp(P.sink, sink, 4, dt);
    const breathe = 1 + Math.sin(this.t * 2) * 0.02;
    const walk = pose.speed > 0.1 ? Math.abs(Math.sin(this.t * 6)) * 0.25 * Math.min(1, pose.speed) : 0;
    this.body.scale.set(breathe * (1 + P.crouch * 0.12), (1 - P.crouch * 0.25) / breathe, breathe);
    this.body.position.y = walk - P.sink;
    this.body.rotation.x = P.lean;
    this.jaw.rotation.x = P.jaw;
    this.tongue.scale.z = Math.max(0.01, P.tongue * 9);
    this.arms[0]!.rotation.x = P.armR;
    this.arms[1]!.rotation.x = P.armL;
    for (const e of this.eyes) e.scale.y = pose.state === 'hitstun' ? 0.3 : 1;
  }
}

export const BOGMAW_DEF: EnemyDef = {
  id: 'bogmaw', name: 'Bogmaw', hp: 720, radius: 2.3, height: 4.2, speed: 3.4, turnRate: 2.2, mass: 0, poise: 180,
  resist: { fire: 1.4 }, statusResist: { ice: 0.5, lightning: 0.5, fire: 0.8 }, aggroRange: 60,
  gems: { blue: 150, red: 6, green: 4, purple: 6 },
  attacks: [
    { id: 'swipe', pose: 'swing', range: 4.8, windup: 0.75, active: 0.25, recover: 0.8, cooldown: 1.6, weight: 3, kind: 'melee', damage: 16, knockback: 12, hitRange: 2.6, hitArc: 1.4 },
    { id: 'tongue', pose: 'tongue', range: 11, minRange: 3, windup: 0.7, active: 0.35, recover: 0.9, cooldown: 3, weight: 2, kind: 'melee', damage: 14, knockback: 14, hitRange: 9, hitArc: 0.22 },
    { id: 'spit', pose: 'spit', range: 22, minRange: 7, windup: 0.8, active: 0.1, recover: 0.8, cooldown: 4, weight: 2, kind: 'projectile', damage: 12, knockback: 6 },
    { id: 'belly', pose: 'slam', range: 16, minRange: 2, windup: 0.9, active: 2.0, recover: 1.1, cooldown: 6, weight: 2, kind: 'melee', damage: 22, knockback: 12, telegraph: false },
    { id: 'summon', pose: 'roar', range: 60, windup: 0.9, active: 0.2, recover: 0.8, cooldown: 14, weight: 1, kind: 'projectile', damage: 0, knockback: 0 },
  ],
  build: () => new BogmawModel(),
  styleValue: 10,
};

export class Bogmaw extends Boss {
  readonly displayName = 'Bogmaw, the Mire King';
  private jumping = false;
  private stuck = 0;
  private minions = 0;

  constructor(game: Game, x: number, y: number, z: number, yaw: number) {
    super(game, BOGMAW_DEF, x, y, z, yaw);
    this.speakerId = 'bogmaw';
    this.phases = 3;
  }

  protected override think(dt: number): void {
    const g = this.game;
    const b = this.body;
    if (!this.awake) {
      this.yaw = approachAngle(this.yaw, this.yawToPlayer(), dt * 2);
      return;
    }
    // Phases.
    const f = this.hpFrac;
    const want = f < 0.33 ? 3 : f < 0.66 ? 2 : 1;
    if (want > this.phase) {
      this.phase = want;
      g.sfx('bossRoar', b.x, b.y, b.z);
      g.shake(0.5, 0.6);
      g.toast(want === 2 ? 'Bogmaw calls the Gloom!' : 'Bogmaw is enraged!', 'warn');
      this.globalCd = 0.3;
      this.cooldowns.set('summon', 0);
    }
    if (this.stuck > 0) {
      this.stuck -= dt;
      b.vx *= 0.8;
      b.vz *= 0.8;
      if (Math.random() < 0.2) g.fx.dust(b.x, b.y, b.z, 2, 0x5a4a30);
      return;
    }
    const d = this.distToPlayer();
    if (this.state === 'windup' || this.state === 'active' || this.state === 'recover') {
      if (this.attack?.id === 'belly' && this.state === 'active') {
        this.bellyUpdate();
        return;
      }
      this.runAttack(dt * (this.phase === 3 ? 1.25 : 1), d, this.yawToPlayer());
      return;
    }
    const pick = this.globalCd <= 0 ? this.pickAttack(d) : null;
    if (pick && !(pick.id === 'summon' && (this.phase < 2 || this.minions >= 3))) {
      this.startAttack(pick);
      return;
    }
    this.globalCd = Math.max(0, this.globalCd - dt * (this.phase === 3 ? 0.5 : 0));
    const dirYaw = this.yawToPlayer();
    if (d > 4) this.moveDir(dirYaw, this.def.speed * (this.phase === 3 ? 1.3 : 1), dt);
    else this.yaw = approachAngle(this.yaw, dirYaw, this.def.turnRate * dt);
    this.state = d > 4 ? 'chase' : 'strafe';
  }

  protected override onActiveStart(a: AttackDef): void {
    const g = this.game;
    const b = this.body;
    const p = g.player.body;
    if (a.id === 'belly') {
      const dx = p.x - b.x;
      const dz = p.z - b.z;
      const air = 1.1;
      b.vx = dx / air;
      b.vz = dz / air;
      b.vy = 15;
      b.grounded = false;
      this.jumping = true;
      this.yaw = yawOf(dx, dz);
      g.sfx('flap', b.x, b.y, b.z, 0.4);
      g.fx.ring(p.x, p.y, p.z, 0.3, 4, 0xff3030, 1.1);
      return;
    }
    if (a.id === 'spit') {
      const n = this.phase >= 2 ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const lead = i === 0 ? 0 : (i === 1 ? 1 : -1) * 3.5;
        const tx = p.x + p.vx * 0.5 + Math.cos(this.yaw) * lead;
        const tz = p.z + p.vz * 0.5 - Math.sin(this.yaw) * lead;
        const ox = b.x + Math.sin(this.yaw) * 2;
        const oz = b.z + Math.cos(this.yaw) * 2;
        const oy = b.y + 2.4;
        const dist = Math.hypot(tx - ox, tz - oz);
        const theta = 0.6;
        const grav = 16;
        const speed = Math.sqrt((dist * grav) / Math.sin(2 * theta));
        const yaw = yawOf(tx - ox, tz - oz);
        g.spawnProjectile({
          x: ox, y: oy, z: oz, dx: Math.sin(yaw) * Math.cos(theta), dy: Math.sin(theta), dz: Math.cos(yaw) * Math.cos(theta),
          speed, radius: 0.6, damage: 12, type: 'physical', color: 0x6a5a2a, life: 4, gravity: grav, fromPlayer: false, kind: 'boulder',
          explode: 2.4, knockback: 6,
        });
      }
      g.sfx('swingHeavy', b.x, b.y, b.z, 0.5);
      return;
    }
    if (a.id === 'summon') {
      const count = this.phase === 3 ? 3 : 2;
      for (let i = 0; i < count; i++) {
        const ang = this.yaw + (i - (count - 1) / 2) * 0.9;
        const x = b.x + Math.sin(ang) * 5;
        const z = b.z + Math.cos(ang) * 5;
        const gy = g.col.groundAt(x, z, b.y + 4, 0.3).y;
        const e = g.spawnEnemy(i === 2 ? 'slinger' : 'grunt', x, gy + 0.05, z, ang, true);
        e.aggro = true;
        this.minions++;
        e.onDeath = () => this.minions--;
      }
      g.sfx('bossRoar', b.x, b.y, b.z, 1.2, 0.7);
      g.shake(0.4, 0.5);
    }
  }

  private bellyUpdate(): void {
    const g = this.game;
    const b = this.body;
    if (this.jumping && b.grounded && this.stateT > 0.2) {
      this.jumping = false;
      g.spawnShockwave(b.x, b.y, b.z, this.phase >= 2 ? 16 : 12, 11, 14 * g.difficultyInfo.enemyDamage, 9, this);
      g.shake(0.9, 0.5);
      g.sfx('pound', b.x, b.y, b.z, 0.6);
      g.fx.dust(b.x, b.y, b.z, 30, 0x6a5a3a);
      g.fx.splash(b.x, b.y, b.z, 0x8a8a5a);
      // Crushing the dragon underneath.
      const p = g.player;
      const d = Math.hypot(p.x - b.x, p.z - b.z);
      if (d < this.def.radius + 1.2) {
        const n = d || 1;
        p.takeHit(makeHit({ damage: 22 * g.difficultyInfo.enemyDamage, dirX: (p.x - b.x) / n, dirZ: (p.z - b.z) / n, knockback: 14, launch: 7, source: 'enemy', fromPlayer: false, ox: b.x, oz: b.z }), this);
      }
      b.vx = b.vz = 0;
      this.state = 'recover';
      this.stateT = 0;
      if (this.phase === 3) {
        this.stuck = 2.6;
        g.toast('Bogmaw is stuck in the mud! Strike now!', 'good');
      }
    } else if (this.stateT > 2.2) {
      this.state = 'recover';
      this.stateT = 0;
      this.jumping = false;
    }
  }

  protected override onBossStagger(_hit: Hit): void {
    this.attack = null;
    this.jumping = false;
    this.setState('hitstun');
    this.hitstunMax = 2.4;
    this.game.toast('Bogmaw is staggered!', 'good');
    this.game.sfx('bossRoar', this.x, this.y, this.z, 1.4, 0.6);
  }

  override takeHit(hit: Hit) {
    const r = super.takeHit(hit);
    if (this.stuck > 0 && r === 'hit') this.hp -= hit.damage * 0.5;
    return r;
  }

  protected override onReset(): void {
    this.stuck = 0;
    this.jumping = false;
  }
}
