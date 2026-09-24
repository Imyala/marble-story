import * as THREE from 'three';
import { mat, matUnique, glow } from '../render/materials';
import { ellipsoid, limb, spike, taperedTube, box } from '../render/shapes';
import { damp, lerp, smoothstep } from '../core/math';
import type { EnemyState } from './enemy';

export interface EnemyPose {
  state: EnemyState;
  t: number;
  speed: number;
  attack: string | null;
  windup: number;
  frozen: boolean;
  shocked: boolean;
  dead: boolean;
  deadT: number;
  airborne: boolean;
  guard: boolean;
  flipped: boolean;
}

export interface EnemyModel {
  root: THREE.Group;
  update(dt: number, pose: EnemyPose): void;
  setFlash(amount: number, color: number): void;
  dispose?(): void;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

abstract class BaseModel implements EnemyModel {
  readonly root = new THREE.Group();
  protected flashMats: THREE.MeshStandardMaterial[] = [];
  protected time = Math.random() * 10;
  abstract update(dt: number, pose: EnemyPose): void;
  protected skin(color: number, rough = 0.7): THREE.MeshStandardMaterial {
    const m = matUnique(color, { rough });
    this.flashMats.push(m);
    return m;
  }
  setFlash(amount: number, color: number): void {
    for (const m of this.flashMats) {
      m.emissive.setHex(color);
      m.emissiveIntensity = amount;
    }
  }
  dispose(): void {
    for (const m of this.flashMats) m.dispose();
  }
}

// ---------------------------------------------------------------------------
// Imp: the gloomling family and its larger cousins.
// ---------------------------------------------------------------------------

export interface ImpOpts {
  skin: number;
  belly: number;
  eye: number;
  scale: number;
  bulk: number;
  ears: 'long' | 'short' | 'horns';
  weapon: 'club' | 'spear' | 'staff' | 'sword' | 'none';
  offhand: 'shield' | 'orb' | 'none';
  hood?: number;
  armor?: number;
  cracks?: number;
  weaponGlow?: number;
}

export class ImpModel extends BaseModel {
  private body = new THREE.Group();
  private torso = new THREE.Group();
  private head = new THREE.Group();
  private arms: { sh: THREE.Group; el: THREE.Group; side: number }[] = [];
  private legs: { hip: THREE.Group; knee: THREE.Group; side: number }[] = [];
  private p = { lean: 0.25, armR: 0, elbowR: 0, armL: 0, elbowL: 0, twist: 0, bodyY: 0, headPitch: 0, back: 0, sideRoll: 0 };
  private phase = 0;
  private o: ImpOpts;

  constructor(o: ImpOpts) {
    super();
    this.o = o;
    const S = o.scale;
    const bulk = o.bulk;
    const skin = this.skin(o.skin, 0.65);
    const belly = this.skin(o.belly, 0.75);
    const eyeM = glow(o.eye);
    const tooth = mat(0xf0e8d8, { rough: 0.4 });
    this.root.add(this.body);
    this.body.scale.setScalar(S);
    const hipY = 0.5 + bulk * 0.15;
    this.body.position.y = hipY;
    this.body.add(this.torso);

    const tw = 0.34 + bulk * 0.2;
    const chest = ellipsoid(tw, 0.38 + bulk * 0.12, 0.3 + bulk * 0.12, skin, 14);
    chest.position.set(0, 0.35, 0);
    this.torso.add(chest);
    const pot = ellipsoid(tw * 0.8, 0.28, 0.27 + bulk * 0.08, belly, 12);
    pot.position.set(0, 0.2, 0.08);
    this.torso.add(pot);
    if (o.armor !== undefined) {
      const am = mat(o.armor, { rough: 0.35, metal: 0.6 });
      const plate = ellipsoid(tw * 1.05, 0.3, 0.33 + bulk * 0.1, am, 12);
      plate.position.set(0, 0.45, 0.02);
      this.torso.add(plate);
      for (const sx of [-1, 1]) {
        const pad = ellipsoid(0.16 + bulk * 0.05, 0.1, 0.16, am, 10);
        pad.position.set(sx * (tw + 0.02), 0.6, 0);
        this.torso.add(pad);
        const sp = spike(0.05, 0.18, am, 5);
        sp.position.set(sx * (tw + 0.05), 0.66, 0);
        sp.rotation.z = -sx * 0.6;
        this.torso.add(sp);
      }
    }
    if (o.cracks !== undefined) {
      const cm = glow(o.cracks);
      for (let i = 0; i < 5; i++) {
        const c = ellipsoid(0.03, 0.14, 0.02, cm, 6);
        c.position.set(Math.sin(i * 1.7) * tw * 0.7, 0.3 + (i % 3) * 0.1, 0.25 + bulk * 0.12);
        c.rotation.z = i * 0.8;
        this.torso.add(c);
      }
      for (let i = 0; i < 4; i++) {
        const s = spike(0.07 + bulk * 0.04, 0.22 + bulk * 0.1, mat(0x2a1a36, { rough: 0.6 }), 5);
        s.position.set((i - 1.5) * 0.12, 0.62 + bulk * 0.1, -0.2 - Math.abs(i - 1.5) * 0.04);
        s.rotation.x = -0.6;
        this.torso.add(s);
      }
    }

    // Head.
    this.head.position.set(0, 0.72 + bulk * 0.1, 0.06);
    this.torso.add(this.head);
    const hs = 1 - bulk * 0.35;
    const skull = ellipsoid(0.3 * hs, 0.27 * hs, 0.28 * hs, skin, 14);
    this.head.add(skull);
    const snout = ellipsoid(0.18 * hs, 0.12 * hs, 0.12 * hs, skin, 10);
    snout.position.set(0, -0.06 * hs, 0.22 * hs);
    this.head.add(snout);
    for (const sx of [-1, 1]) {
      const eye = ellipsoid(0.07 * hs, 0.05 * hs, 0.04 * hs, eyeM, 8);
      eye.position.set(sx * 0.12 * hs, 0.06 * hs, 0.24 * hs);
      eye.rotation.z = sx * -0.35;
      this.head.add(eye);
      if (o.ears === 'long') {
        const ear = new THREE.Mesh(taperedTube([V(0, 0, 0), V(sx * 0.2, 0.08, -0.04), V(sx * 0.42, 0.2, -0.12)], 0.08, 0.005, 8, 6), skin);
        ear.position.set(sx * 0.2 * hs, 0.08 * hs, -0.02);
        this.head.add(ear);
      } else if (o.ears === 'short') {
        const ear = spike(0.07, 0.2, skin, 5);
        ear.position.set(sx * 0.2 * hs, 0.15 * hs, -0.05);
        ear.rotation.z = -sx * 0.9;
        this.head.add(ear);
      } else {
        const horn = new THREE.Mesh(taperedTube([V(0, 0, 0), V(sx * 0.12, 0.12, 0.02), V(sx * 0.2, 0.3, 0.12)], 0.07, 0.005, 8, 6), mat(0xd8cfb8, { rough: 0.5 }));
        horn.position.set(sx * 0.18 * hs, 0.14 * hs, 0);
        this.head.add(horn);
      }
    }
    for (let i = -2; i <= 2; i++) {
      const t = spike(0.02, 0.06, tooth, 4);
      t.position.set(i * 0.045 * hs, -0.12 * hs, 0.28 * hs);
      t.rotation.x = Math.PI;
      this.head.add(t);
    }
    if (o.hood !== undefined) {
      const hm = mat(o.hood, { rough: 0.9, side: THREE.DoubleSide });
      const hood = new THREE.Mesh(new THREE.ConeGeometry(0.38 * hs, 0.62, 10, 1, true), hm);
      hood.position.set(0, 0.16, -0.05);
      hood.rotation.x = -0.25;
      this.head.add(hood);
      const cape = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.0, 10, 1, true, Math.PI * 0.2, Math.PI * 1.6), hm);
      cape.position.set(0, 0.2, -0.05);
      cape.rotation.y = Math.PI;
      this.torso.add(cape);
    }

    // Arms.
    for (const side of [1, -1]) {
      const sh = new THREE.Group();
      sh.position.set(side * (tw + 0.05), 0.55, 0);
      this.torso.add(sh);
      const ua = 0.3 + bulk * 0.2;
      sh.add(limb(V(0, 0, 0), V(0, -ua, 0), 0.09 + bulk * 0.1, 0.07 + bulk * 0.08, skin, 8));
      const el = new THREE.Group();
      el.position.set(0, -ua, 0);
      sh.add(el);
      const la = 0.28 + bulk * 0.2;
      el.add(limb(V(0, 0, 0), V(0, -la, 0.02), 0.07 + bulk * 0.08, 0.06 + bulk * 0.1, skin, 8));
      const hand = ellipsoid(0.08 + bulk * 0.12, 0.08 + bulk * 0.1, 0.08 + bulk * 0.1, skin, 8);
      hand.position.set(0, -la - 0.04, 0.02);
      el.add(hand);
      for (let c = -1; c <= 1; c++) {
        const cl = spike(0.018 + bulk * 0.02, 0.08 + bulk * 0.05, tooth, 4);
        cl.position.set(c * 0.04, -la - 0.1 - bulk * 0.08, 0.06);
        cl.rotation.x = Math.PI * 0.8;
        el.add(cl);
      }
      const holder = new THREE.Group();
      holder.position.set(0, -la - 0.05, 0.03);
      el.add(holder);
      if (side === -1) this.buildWeapon(holder, o);
      else this.buildOffhand(holder, o);
      this.arms.push({ sh, el, side });
    }

    // Legs.
    for (const side of [1, -1]) {
      const hip = new THREE.Group();
      hip.position.set(side * 0.18, 0.02, 0);
      this.body.add(hip);
      const ul = 0.26 + bulk * 0.08;
      hip.add(limb(V(0, 0, 0), V(0, -ul, 0.04), 0.1 + bulk * 0.08, 0.08 + bulk * 0.06, skin, 8));
      const knee = new THREE.Group();
      knee.position.set(0, -ul, 0.04);
      hip.add(knee);
      const ll = hipY - ul - 0.04;
      knee.add(limb(V(0, 0, 0), V(0, -ll, -0.03), 0.08 + bulk * 0.06, 0.06 + bulk * 0.05, skin, 8));
      const foot = ellipsoid(0.1 + bulk * 0.05, 0.05, 0.16 + bulk * 0.05, skin, 8);
      foot.position.set(0, -ll + 0.02, 0.06);
      knee.add(foot);
      this.legs.push({ hip, knee, side });
    }
    this.root.traverse((ob) => {
      if ((ob as THREE.Mesh).isMesh) ob.castShadow = true;
    });
  }

  private buildWeapon(h: THREE.Group, o: ImpOpts): void {
    const wood = mat(0x5a3a22, { rough: 0.9 });
    const bone = mat(0xdcd2bc, { rough: 0.6 });
    const metal = mat(0x8a8fa0, { rough: 0.3, metal: 0.7 });
    const gl = o.weaponGlow !== undefined ? glow(o.weaponGlow) : null;
    switch (o.weapon) {
      case 'club': {
        const shaft = limb(V(0, 0, 0), V(0, 0.1, 0.6), 0.04, 0.06, wood, 6);
        h.add(shaft);
        const headM = ellipsoid(0.1, 0.1, 0.16, bone, 8);
        headM.position.set(0, 0.1, 0.62);
        h.add(headM);
        for (let i = 0; i < 3; i++) {
          const s = spike(0.03, 0.1, bone, 4);
          s.position.set(Math.sin(i * 2.1) * 0.08, 0.1 + Math.cos(i * 2.1) * 0.08, 0.66);
          s.lookAt(new THREE.Vector3(Math.sin(i * 2.1), 0.1 + Math.cos(i * 2.1), 0.66).multiplyScalar(3));
          h.add(s);
        }
        break;
      }
      case 'spear': {
        h.add(limb(V(0, 0, -0.6), V(0, 0, 0.9), 0.03, 0.03, wood, 6));
        const tip = spike(0.06, 0.28, gl ?? metal, 4);
        tip.position.set(0, 0, 0.9);
        tip.rotation.x = Math.PI / 2;
        h.add(tip);
        break;
      }
      case 'staff': {
        h.add(limb(V(0, -0.5, 0), V(0, 0.9, 0.05), 0.03, 0.035, wood, 6));
        const orb = ellipsoid(0.12, 0.12, 0.12, gl ?? glow(0xc070ff), 10);
        orb.position.set(0, 0.98, 0.05);
        h.add(orb);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 6, 16), bone);
        ring.position.set(0, 0.98, 0.05);
        h.add(ring);
        break;
      }
      case 'sword': {
        h.add(limb(V(0, 0, -0.1), V(0, 0, 0.12), 0.035, 0.035, mat(0x2a2030), 6));
        const guard = box(0.3, 0.05, 0.06, metal);
        guard.position.set(0, 0, 0.12);
        h.add(guard);
        const blade = box(0.08, 0.025, 1.0, gl ?? metal);
        blade.position.set(0, 0, 0.64);
        h.add(blade);
        break;
      }
      case 'none':
        break;
    }
  }

  private buildOffhand(h: THREE.Group, o: ImpOpts): void {
    if (o.offhand === 'shield') {
      const wood = mat(0x4a3020, { rough: 0.9 });
      const rim = mat(0x9a9aa8, { rough: 0.3, metal: 0.8 });
      const sh = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 16), wood);
      disc.rotation.x = Math.PI / 2;
      sh.add(disc);
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 6, 24), rim);
      sh.add(r);
      const boss = ellipsoid(0.12, 0.12, 0.08, rim, 8);
      boss.position.z = 0.05;
      sh.add(boss);
      const emblem = ellipsoid(0.2, 0.2, 0.02, glow(o.weaponGlow ?? 0xb04cff), 8);
      emblem.position.z = 0.05;
      emblem.scale.set(0.2, 0.05, 0.02);
      sh.add(emblem);
      sh.position.set(-0.1, 0.25, 0.28);
      sh.rotation.y = -0.2;
      h.add(sh);
    } else if (o.offhand === 'orb') {
      const orb = ellipsoid(0.13, 0.13, 0.13, glow(o.weaponGlow ?? 0xc070ff), 10);
      orb.position.set(0, -0.05, 0.1);
      h.add(orb);
    }
  }

  update(dt: number, pose: EnemyPose): void {
    this.time += dt;
    const P = this.p;
    const t = this.time;
    const moving = pose.speed;
    this.phase += dt * (4 + moving * 8) * (moving > 0.05 ? 1 : 0);
    let lean = 0.2 + moving * 0.15;
    let armR = Math.sin(this.phase) * 0.6 * moving;
    let armL = -Math.sin(this.phase) * 0.6 * moving;
    let elbowR = -0.4;
    let elbowL = -0.4;
    let twist = 0;
    let bodyY = Math.abs(Math.sin(this.phase)) * 0.06 * moving + Math.sin(t * 3) * 0.015;
    let headPitch = Math.sin(t * 1.7) * 0.05;
    let back = 0;
    let sideRoll = 0;
    let rate = 14;
    const atk = pose.attack;
    if (pose.guard && this.o.offhand === 'shield') {
      armR = -1.2;
      elbowR = -0.9;
    }
    if (pose.state === 'windup' || pose.state === 'active' || pose.state === 'recover') {
      rate = 22;
      const w = smoothstep(0, 1, pose.windup);
      const strike = pose.state === 'windup' ? 0 : pose.state === 'active' ? smoothstep(0, 0.12, pose.t) : 1;
      const k = pose.state === 'recover' ? 1 - smoothstep(0, 0.5, pose.t) : 1;
      switch (atk) {
        case 'swing':
          armL = lerp(lerp(0, -2.6, w), 0.7, strike) * k;
          elbowL = lerp(-1.2 * w, -0.1, strike);
          lean = lerp(0.2 - w * 0.3, 0.6, strike);
          twist = lerp(0.3 * w, -0.3, strike) * k;
          break;
        case 'thrust':
          armL = lerp(-0.3 * w, -1.5, strike) * k - 0.2;
          elbowL = lerp(-1.6 * w, 0, strike);
          lean = lerp(0.1, 0.5, strike);
          twist = lerp(0.4 * w, -0.2, strike) * k;
          break;
        case 'throw':
          armL = lerp(-2.4 * w, -1.2, strike) * k;
          elbowL = lerp(-1.0 * w, 0, strike);
          twist = lerp(0.6 * w, -0.4, strike) * k;
          break;
        case 'cast':
          armL = -2.4 * Math.max(w, 1 - strike * 0.5) * k;
          armR = -1.8 * w * k;
          elbowL = -0.2;
          headPitch = -0.3 * w;
          lean = 0.05;
          break;
        case 'slam':
          armL = lerp(-2.8 * w, 0.2, strike) * k;
          armR = lerp(-2.8 * w, 0.2, strike) * k;
          elbowL = elbowR = lerp(-0.3, 0, strike);
          lean = lerp(-0.25 * w, 0.8, strike);
          bodyY -= strike * 0.1;
          break;
        case 'charge':
          lean = 0.7 * Math.max(w, strike);
          armL = armR = 0.8 * Math.max(w, strike);
          break;
        default:
          armL = lerp(-1.5 * w, 0.4, strike) * k;
          lean = lerp(0.2, 0.5, strike);
      }
    }
    if (pose.state === 'hitstun') {
      back = 0.5 * (1 - smoothstep(0, 0.3, pose.t));
      armL = armR = -0.6;
      rate = 30;
    }
    if (pose.state === 'air') {
      back = 0.6;
      armL = -2 + Math.sin(t * 20) * 0.5;
      armR = -2 + Math.cos(t * 20) * 0.5;
      rate = 20;
    }
    if (pose.state === 'down' || pose.flipped) {
      back = 1.45;
      bodyY = -0.35;
      armL = armR = -1.5 + Math.sin(t * 12) * (pose.flipped ? 0.4 : 0.1);
      rate = 12;
    }
    if (pose.dead) {
      back = 1.4;
      bodyY = -0.3;
      rate = 10;
    }
    if (pose.state === 'spawn') {
      bodyY = -1.2 * (1 - smoothstep(0, 0.7, pose.t));
    }
    if (pose.shocked) {
      sideRoll = Math.sin(t * 60) * 0.1;
    }
    P.lean = damp(P.lean, lean, rate, dt);
    P.armR = damp(P.armR, armR, rate, dt);
    P.armL = damp(P.armL, armL, rate, dt);
    P.elbowR = damp(P.elbowR, elbowR, rate, dt);
    P.elbowL = damp(P.elbowL, elbowL, rate, dt);
    P.twist = damp(P.twist, twist, rate, dt);
    P.bodyY = damp(P.bodyY, bodyY, 16, dt);
    P.headPitch = damp(P.headPitch, headPitch, rate, dt);
    P.back = damp(P.back, back, rate, dt);
    P.sideRoll = damp(P.sideRoll, sideRoll, 30, dt);

    const hipY = (0.5 + this.o.bulk * 0.15) * this.o.scale;
    this.body.position.y = hipY + P.bodyY * this.o.scale;
    this.body.rotation.set(-P.back, 0, P.sideRoll);
    this.torso.rotation.set(P.lean, P.twist, 0);
    this.head.rotation.set(P.headPitch - P.lean * 0.6, 0, 0);
    for (const a of this.arms) {
      const isL = a.side === -1;
      a.sh.rotation.set(isL ? P.armL : P.armR, 0, a.side * 0.15);
      a.el.rotation.set(isL ? P.elbowL : P.elbowR, 0, 0);
    }
    for (const l of this.legs) {
      const s = Math.sin(this.phase + (l.side > 0 ? 0 : Math.PI));
      const air = pose.state === 'air' ? 1 : 0;
      l.hip.rotation.set(-s * 0.7 * moving - P.lean * 0.3 - air * 0.8, 0, 0);
      l.knee.rotation.set(Math.max(0, -Math.cos(this.phase + (l.side > 0 ? 0 : Math.PI))) * 0.9 * moving + air * 1.2, 0, 0);
    }
  }
}

// ---------------------------------------------------------------------------
// Wisp: a floating shadow flame with bat wings.
// ---------------------------------------------------------------------------

export class WispModel extends BaseModel {
  private core: THREE.Mesh;
  private shroud = new THREE.Group();
  private wings: THREE.Group[] = [];
  private tendrils: THREE.Mesh[] = [];
  private color: number;

  constructor(color = 0xc050ff, shroudColor = 0x1a1028, scale = 1) {
    super();
    this.color = color;
    const g = new THREE.Group();
    g.scale.setScalar(scale);
    this.root.add(g);
    g.add(this.shroud);
    this.shroud.position.y = 1.1;
    const shroudM = this.skin(shroudColor, 0.9);
    const body = ellipsoid(0.42, 0.5, 0.42, shroudM, 14);
    this.shroud.add(body);
    this.core = ellipsoid(0.22, 0.22, 0.22, glow(color), 12);
    this.core.position.set(0, 0.05, 0.28);
    this.shroud.add(this.core);
    for (const sx of [-1, 1]) {
      const e = ellipsoid(0.06, 0.04, 0.03, glow(0xffffff), 6);
      e.position.set(sx * 0.14, 0.2, 0.36);
      this.shroud.add(e);
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const t = new THREE.Mesh(
        taperedTube([V(0, 0, 0), V(Math.sin(a) * 0.2, -0.4, Math.cos(a) * 0.2), V(Math.sin(a) * 0.1, -0.9, Math.cos(a) * 0.1)], 0.12, 0.01, 8, 6),
        shroudM,
      );
      t.position.set(Math.sin(a) * 0.2, -0.25, Math.cos(a) * 0.2);
      this.shroud.add(t);
      this.tendrils.push(t);
    }
    const memM = mat(0x2a1a3a, { rough: 0.8, side: THREE.DoubleSide });
    for (const side of [1, -1]) {
      const w = new THREE.Group();
      w.position.set(side * 0.35, 0.15, -0.05);
      w.scale.x = side;
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.9, 0.35);
      shape.lineTo(0.75, 0.05);
      shape.lineTo(0.6, -0.1);
      shape.lineTo(0.4, 0.0);
      shape.lineTo(0.25, -0.2);
      shape.lineTo(0, -0.15);
      const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), memM);
      w.add(m);
      this.shroud.add(w);
      this.wings.push(w);
    }
    this.root.traverse((ob) => {
      if ((ob as THREE.Mesh).isMesh) ob.castShadow = true;
    });
  }

  update(dt: number, pose: EnemyPose): void {
    this.time += dt;
    const t = this.time;
    const flap = Math.sin(t * (pose.state === 'windup' ? 22 : 12));
    for (const w of this.wings) w.rotation.set(0, 0, flap * 0.7 * w.scale.x);
    this.tendrils.forEach((m, i) => {
      m.rotation.x = Math.sin(t * 4 + i) * 0.25;
      m.rotation.z = Math.cos(t * 3 + i) * 0.25;
    });
    const s = 1 + Math.sin(t * 8) * 0.08 + (pose.state === 'windup' ? pose.windup * 0.6 : 0);
    this.core.scale.setScalar(0.22 * s);
    let tilt = 0;
    if (pose.state === 'active' && pose.attack === 'dive') tilt = 0.8;
    if (pose.state === 'hitstun' || pose.state === 'air') tilt = -0.6;
    this.shroud.rotation.x = damp(this.shroud.rotation.x, tilt, 10, dt);
    this.shroud.position.y = 1.1 + Math.sin(t * 2.5) * 0.08;
    void this.color;
  }
}

// ---------------------------------------------------------------------------
// Golem: blocks of ice or stone around a glowing core.
// ---------------------------------------------------------------------------

export class GolemModel extends BaseModel {
  private torso = new THREE.Group();
  private arms: THREE.Group[] = [];
  private legs: THREE.Group[] = [];
  private core: THREE.Mesh;
  private phase = 0;
  private p = { armL: 0, armR: 0, lean: 0, back: 0 };
  private scaleK: number;

  constructor(stone: number, coreColor: number, scale = 1, crystal = false) {
    super();
    this.scaleK = scale;
    const S = scale;
    const m = crystal
      ? this.skin(stone, 0.15)
      : this.skin(stone, 0.85);
    if (crystal) {
      m.transparent = true;
      m.opacity = 0.9;
      m.metalness = 0.1;
    }
    const root = new THREE.Group();
    root.scale.setScalar(S);
    this.root.add(root);
    root.add(this.torso);
    this.torso.position.y = 1.35;
    const chest = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), m);
    chest.scale.set(1.2, 0.95, 0.9);
    chest.castShadow = true;
    this.torso.add(chest);
    this.core = ellipsoid(0.2, 0.2, 0.2, glow(coreColor), 10);
    this.core.position.set(0, 0.05, 0.62);
    this.torso.add(this.core);
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), m);
    head.position.set(0, 0.85, 0.15);
    head.castShadow = true;
    this.torso.add(head);
    for (const sx of [-1, 1]) {
      const eye = ellipsoid(0.07, 0.04, 0.03, glow(coreColor), 6);
      eye.position.set(sx * 0.12, 0.88, 0.43);
      this.torso.add(eye);
      const arm = new THREE.Group();
      arm.position.set(sx * 1.0, 0.35, 0);
      this.torso.add(arm);
      const up = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 0), m);
      up.position.y = -0.2;
      up.castShadow = true;
      arm.add(up);
      const fist = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 0), m);
      fist.position.y = -0.95;
      fist.castShadow = true;
      arm.add(fist);
      const mid = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), m);
      mid.position.y = -0.55;
      arm.add(mid);
      this.arms.push(arm);
      const leg = new THREE.Group();
      leg.position.set(sx * 0.45, 0.85, 0);
      root.add(leg);
      const l = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 0), m);
      l.position.y = -0.5;
      l.scale.set(1, 1.3, 1);
      l.castShadow = true;
      leg.add(l);
      this.legs.push(leg);
    }
    if (crystal) {
      for (let i = 0; i < 6; i++) {
        const c = spike(0.12, 0.5 + (i % 3) * 0.15, m, 5);
        c.position.set((i - 2.5) * 0.25, 0.5, -0.3);
        c.rotation.set(-0.4, 0, (i - 2.5) * 0.25);
        this.torso.add(c);
      }
    }
  }

  update(dt: number, pose: EnemyPose): void {
    this.time += dt;
    const P = this.p;
    this.phase += dt * 5 * pose.speed;
    let armL = Math.sin(this.phase) * 0.4 * pose.speed;
    let armR = -armL;
    let lean = 0.1;
    let back = 0;
    if (pose.state === 'windup' || pose.state === 'active' || pose.state === 'recover') {
      const w = smoothstep(0, 1, pose.windup);
      const strike = pose.state === 'windup' ? 0 : pose.state === 'active' ? smoothstep(0, 0.15, pose.t) : 1;
      const k = pose.state === 'recover' ? 1 - smoothstep(0, 0.6, pose.t) : 1;
      if (pose.attack === 'slam') {
        armL = armR = lerp(-2.8 * w, 0.2, strike) * k;
        lean = lerp(-0.3 * w, 0.6, strike) * k;
      } else if (pose.attack === 'throw') {
        armR = lerp(-2.6 * w, -1.0, strike) * k;
      } else {
        armL = lerp(-1.8 * w, -0.2, strike) * k;
        lean = lerp(0, 0.4, strike) * k;
      }
    }
    if (pose.state === 'hitstun') back = 0.25;
    if (pose.state === 'down' || pose.dead) back = 1.2;
    P.armL = damp(P.armL, armL, 16, dt);
    P.armR = damp(P.armR, armR, 16, dt);
    P.lean = damp(P.lean, lean, 14, dt);
    P.back = damp(P.back, back, 10, dt);
    this.arms[0]!.rotation.x = P.armR;
    this.arms[1]!.rotation.x = P.armL;
    this.torso.rotation.x = P.lean - P.back;
    this.torso.position.y = 1.35 - P.back * 0.4 + Math.sin(this.time * 2) * 0.03;
    this.legs[0]!.rotation.x = Math.sin(this.phase) * 0.5 * pose.speed;
    this.legs[1]!.rotation.x = -Math.sin(this.phase) * 0.5 * pose.speed;
    this.core.scale.setScalar(0.2 * (1 + Math.sin(this.time * 6) * 0.1 + (pose.state === 'windup' ? pose.windup * 0.5 : 0)));
    void this.scaleK;
  }
}

// ---------------------------------------------------------------------------
// Crawler: an armored rock beetle.
// ---------------------------------------------------------------------------

export class CrawlerModel extends BaseModel {
  private shell = new THREE.Group();
  private legs: THREE.Group[] = [];
  private headG = new THREE.Group();
  private phase = 0;
  private flipK = 0;

  constructor(shellColor: number, bodyColor: number, eye: number, scale = 1) {
    super();
    const g = new THREE.Group();
    g.scale.setScalar(scale);
    this.root.add(g);
    g.add(this.shell);
    this.shell.position.y = 0.55;
    const sm = this.skin(shellColor, 0.8);
    const bm = this.skin(bodyColor, 0.7);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), sm);
    top.scale.set(1, 0.7, 1.25);
    top.castShadow = true;
    this.shell.add(top);
    for (let i = 0; i < 7; i++) {
      const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + (i % 3) * 0.05, 0), sm);
      const a = i * 0.9;
      r.position.set(Math.sin(a) * 0.45, 0.45 + (i % 2) * 0.05, Math.cos(a) * 0.55);
      this.shell.add(r);
    }
    const under = ellipsoid(0.7, 0.2, 0.95, bm, 12);
    under.position.y = -0.02;
    this.shell.add(under);
    this.headG.position.set(0, 0.0, 0.95);
    this.shell.add(this.headG);
    const head = ellipsoid(0.32, 0.24, 0.3, bm, 10);
    this.headG.add(head);
    for (const sx of [-1, 1]) {
      const e = ellipsoid(0.05, 0.05, 0.04, glow(eye), 6);
      e.position.set(sx * 0.14, 0.08, 0.25);
      this.headG.add(e);
      const mand = new THREE.Mesh(taperedTube([V(0, 0, 0), V(sx * 0.12, -0.02, 0.2), V(sx * 0.02, -0.04, 0.38)], 0.05, 0.005, 6, 5), mat(0xe0d4b0));
      mand.position.set(sx * 0.15, -0.08, 0.15);
      this.headG.add(mand);
    }
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? 1 : -1;
      const k = i % 3;
      const leg = new THREE.Group();
      leg.position.set(side * 0.6, -0.05, 0.5 - k * 0.5);
      leg.add(limb(V(0, 0, 0), V(side * 0.45, 0.15, 0), 0.07, 0.05, bm, 6));
      leg.add(limb(V(side * 0.45, 0.15, 0), V(side * 0.6, -0.5, 0.05), 0.05, 0.02, bm, 6));
      this.shell.add(leg);
      this.legs.push(leg);
    }
  }

  update(dt: number, pose: EnemyPose): void {
    this.time += dt;
    this.phase += dt * (6 + pose.speed * 14);
    this.legs.forEach((l, i) => {
      l.rotation.y = Math.sin(this.phase + i * 1.3) * 0.35 * Math.min(1, pose.speed + 0.1);
      l.rotation.z = Math.cos(this.phase + i * 1.3) * 0.15;
    });
    const flip = pose.flipped || pose.dead ? 1 : 0;
    this.flipK = damp(this.flipK, flip, 8, dt);
    this.shell.rotation.z = this.flipK * Math.PI;
    this.shell.position.y = 0.55 + this.flipK * 0.2;
    let lunge = 0;
    if (pose.state === 'windup') lunge = -0.3 * pose.windup;
    if (pose.state === 'active') lunge = 0.3;
    this.shell.rotation.x = damp(this.shell.rotation.x, lunge, 12, dt);
    this.headG.rotation.x = Math.sin(this.time * 3) * 0.08;
  }
}

// ---------------------------------------------------------------------------
// Totem: a shadow crystal obelisk that shields nearby enemies.
// ---------------------------------------------------------------------------

export class TotemModel extends BaseModel {
  private crystal: THREE.Mesh;
  private rings: THREE.Mesh[] = [];

  constructor(color = 0xb04cff) {
    super();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.5, 8), mat(0x2a2432, { rough: 0.9 }));
    base.position.y = 0.25;
    base.castShadow = true;
    base.receiveShadow = true;
    this.root.add(base);
    const cm = this.skin(0x3a1a5a, 0.2);
    cm.emissive.setHex(color);
    this.crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), cm);
    this.crystal.scale.set(0.8, 2.0, 0.8);
    this.crystal.position.y = 1.6;
    this.crystal.castShadow = true;
    this.root.add(this.crystal);
    for (let i = 0; i < 2; i++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.75 + i * 0.2, 0.03, 6, 24), glow(color, 0.8, true));
      r.position.y = 1.4 + i * 0.5;
      r.rotation.x = Math.PI / 2;
      this.root.add(r);
      this.rings.push(r);
    }
  }

  override setFlash(amount: number, color: number): void {
    const m = this.flashMats[0]!;
    if (amount > 0.01) {
      m.emissive.setHex(color);
      m.emissiveIntensity = amount;
    } else {
      m.emissive.setHex(0xb04cff);
      m.emissiveIntensity = 0.6;
    }
  }

  update(dt: number, pose: EnemyPose): void {
    this.time += dt;
    this.crystal.rotation.y += dt * 0.8;
    this.crystal.position.y = 1.6 + Math.sin(this.time * 2) * 0.1;
    this.rings.forEach((r, i) => {
      r.rotation.z += dt * (i ? -1.2 : 1.5);
      r.position.y = 1.3 + i * 0.5 + Math.sin(this.time * 3 + i) * 0.08;
    });
    if (pose.dead) this.crystal.scale.multiplyScalar(0.9);
  }
}

// ---------------------------------------------------------------------------
// Training dummy: a straw gloomling on a post.
// ---------------------------------------------------------------------------

export class DummyModel extends BaseModel {
  private body = new THREE.Group();
  private wob = 0;
  constructor() {
    super();
    const wood = mat(0x7a5a3a, { rough: 0.95 });
    const straw = this.skin(0xd8b868, 0.95);
    const mask = this.skin(0x3a2856, 0.7);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.2, 6), wood);
    post.position.y = 0.6;
    this.root.add(post);
    this.root.add(this.body);
    this.body.position.y = 1.1;
    const torso = ellipsoid(0.45, 0.55, 0.35, straw, 10);
    torso.position.y = 0.3;
    this.body.add(torso);
    const head = ellipsoid(0.32, 0.3, 0.3, mask, 10);
    head.position.y = 1.05;
    this.body.add(head);
    for (const sx of [-1, 1]) {
      const e = ellipsoid(0.06, 0.04, 0.03, glow(0xffd040), 6);
      e.position.set(sx * 0.12, 1.1, 0.27);
      this.body.add(e);
      const ear = spike(0.07, 0.35, mask, 4);
      ear.position.set(sx * 0.22, 1.2, 0);
      ear.rotation.z = -sx * 1.1;
      this.body.add(ear);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 5), wood);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(sx * 0.6, 0.55, 0);
      this.body.add(arm);
    }
    this.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
  }
  update(dt: number, pose: EnemyPose): void {
    this.time += dt;
    if (pose.state === 'hitstun' || pose.state === 'air') this.wob = 1;
    this.wob = Math.max(0, this.wob - dt * 1.5);
    this.body.rotation.z = Math.sin(this.time * 18) * 0.35 * this.wob;
    this.body.rotation.x = Math.cos(this.time * 14) * 0.2 * this.wob;
  }
}
