import * as THREE from 'three';
import { Boss } from '../boss';
import type { Enemy, EnemyDef } from '../enemy';
import type { EnemyModel, EnemyPose } from '../models';
import type { Game } from '../../game/game';
import type { Hit, HitResult } from '../../game/types';
import { makeHit } from '../../game/types';
import type { Reaction } from '../../combat/status';
import { matUnique, mat, glow } from '../../render/materials';
import { ellipsoid, spike, limb } from '../../render/shapes';
import { damp, clamp, lerp, smoothstep, yawOf, approachAngle, angleDiff } from '../../core/math';
import { rng } from '../../core/rng';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/**
 * Skrieka, the Last Storm Roc. The Wardens' old message-bird, twisted by the
 * Gloom. She fights on the wing over the top of the Stormspire:
 *
 *   Phase 1  circles, swoops across the arena (miss and she crashes, open to
 *            attack), fires lightning feather volleys, blasts the dragon with
 *            wing gusts
 *   Phase 2  also calls Storm Wisps and brings down telegraphed lightning
 *   Phase 3  faster, and a whirlwind prowls the arena
 *
 * Fire hurts her most; lightning does nothing. Enough fire while she hovers
 * knocks her out of the sky.
 */

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export type RocPose = 'perch' | 'fly' | 'glide' | 'hover' | 'gust' | 'dive' | 'crash' | 'screech' | 'dead';

const featherCache = new Map<string, THREE.BufferGeometry>();

/** A flat feather blade lying in the XZ plane, quill at the origin, tip toward -Z. */
function featherGeo(len: number, width: number): THREE.BufferGeometry {
  const key = `${len.toFixed(2)}|${width.toFixed(2)}`;
  let g = featherCache.get(key);
  if (!g) {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(width, len * 0.35, width * 0.35, len * 0.9);
    s.lineTo(0, len);
    s.lineTo(-width * 0.35, len * 0.9);
    s.quadraticCurveTo(-width, len * 0.35, 0, 0);
    g = new THREE.ShapeGeometry(s, 3);
    g.rotateX(-Math.PI / 2);
    featherCache.set(key, g);
  }
  return g;
}

class SkriekaModel implements EnemyModel {
  readonly root = new THREE.Group();
  /** Points lightning crackles between: wing tips, crest, tail. */
  readonly sparks: THREE.Object3D[] = [];
  mode: RocPose = 'glide';
  /** Roll from turning, set by the AI. */
  bank = 0;
  /** 0 corrupted, 1 the shadow has left her. */
  purified = 0;
  private body = new THREE.Group();
  private head = new THREE.Group();
  private jaw = new THREE.Group();
  private tail = new THREE.Group();
  private wings: { root: THREE.Group; outer: THREE.Group; side: number }[] = [];
  private legs: THREE.Group[] = [];
  private stars = new THREE.Group();
  private eyeMat: THREE.MeshBasicMaterial;
  private crackMat: THREE.MeshBasicMaterial;
  private streakMat: THREE.MeshBasicMaterial;
  private flashMats: THREE.MeshStandardMaterial[] = [];
  private t = 0;
  private phase = 0;
  private p = { amp: 0.7, speed: 2.2, lift: 0.1, fold: 0, pitch: 0, roll: 0, beak: 0.05, tuck: 1, head: 0, sink: 0, splay: 0 };

  constructor() {
    const skin = this.flashable(0x3a5480, 0.75);
    const belly = this.flashable(0xa8b8d4, 0.8);
    const featherIn = this.flashable(0x3a5688, 0.7, true);
    const featherOut = this.flashable(0x5f86c4, 0.6, true);
    const headM = this.flashable(0x405a86, 0.7);
    const beak = mat(0xe0b448, { rough: 0.4, metal: 0.2 });
    const talon = mat(0x18141a, { rough: 0.35, metal: 0.3 });
    const legM = mat(0xb89a58, { rough: 0.7 });
    const dark = mat(0x141824, { rough: 0.9 });
    this.eyeMat = glow(0xe070ff);
    this.crackMat = glow(0xb04cff, 0.95);
    this.streakMat = glow(0xa8e6ff, 0.9, true);

    this.root.add(this.body);
    this.body.position.y = 2.4;
    const torso = ellipsoid(1.2, 1.1, 2.0, skin, 18);
    this.body.add(torso);
    const bel = ellipsoid(0.95, 0.85, 1.55, belly, 14);
    bel.position.set(0, -0.35, 0.35);
    this.body.add(bel);
    // Chest ruff and a ridge of feather cones down the spine.
    for (let i = 0; i < 9; i++) {
      const r = spike(0.2, 0.85, featherIn, 5);
      r.position.set((i - 4) * 0.2, 0.15 - Math.abs(i - 4) * 0.06, 1.5 - Math.abs(i - 4) * 0.08);
      r.rotation.set(Math.PI * 0.82, 0, (i - 4) * 0.08);
      this.body.add(r);
    }
    for (let i = 0; i < 6; i++) {
      const r = spike(0.2 - i * 0.015, 0.9 - i * 0.05, featherOut, 5);
      r.position.set(0, 1.0 - i * 0.07, 1.0 - i * 0.55);
      r.rotation.x = -2.0;
      this.body.add(r);
    }
    // Corruption: violet cracks along the flanks.
    for (let i = 0; i < 8; i++) {
      const c = ellipsoid(0.06, 0.42, 0.04, this.crackMat, 6);
      const a = -1.3 + (i % 4) * 0.55;
      const side = i < 4 ? 1 : -1;
      c.position.set(side * Math.cos(a * 0.4) * 1.12, Math.sin(i * 1.9) * 0.4, Math.sin(a) * 1.4);
      c.rotation.set(0.3 * side, a * side, i * 0.9);
      this.body.add(c);
    }

    // Neck and head.
    this.body.add(limb(V(0, 0.45, 1.45), V(0, 1.25, 2.25), 0.55, 0.42, skin, 10));
    this.head.position.set(0, 1.35, 2.35);
    this.body.add(this.head);
    this.head.add(ellipsoid(0.55, 0.5, 0.7, headM, 14));
    for (const sx of [-1, 1]) {
      const brow = ellipsoid(0.18, 0.08, 0.34, dark, 8);
      brow.position.set(sx * 0.3, 0.24, 0.28);
      brow.rotation.set(0.2, sx * 0.3, sx * 0.35);
      this.head.add(brow);
      const eye = ellipsoid(0.13, 0.1, 0.09, this.eyeMat, 8);
      eye.position.set(sx * 0.34, 0.1, 0.42);
      this.head.add(eye);
    }
    const upper = spike(0.3, 1.05, beak, 6);
    upper.position.set(0, -0.02, 0.55);
    upper.rotation.x = Math.PI / 2 + 0.28;
    this.head.add(upper);
    const hook = spike(0.1, 0.32, beak, 5);
    hook.position.set(0, -0.28, 1.5);
    hook.rotation.x = Math.PI - 0.3;
    this.head.add(hook);
    this.jaw.position.set(0, -0.2, 0.55);
    this.head.add(this.jaw);
    const lower = spike(0.22, 0.8, beak, 6);
    lower.rotation.x = Math.PI / 2 + 0.1;
    this.jaw.add(lower);
    // Crest: swept-back feathers, two of them crackling.
    for (let i = 0; i < 5; i++) {
      const c = spike(0.09, 1.25 - Math.abs(i - 2) * 0.15, i % 2 ? featherOut : featherIn, 5);
      c.position.set((i - 2) * 0.12, 0.4, -0.05);
      c.rotation.set(-2.25 + Math.abs(i - 2) * 0.1, 0, (i - 2) * 0.2);
      this.head.add(c);
    }
    for (const sx of [-1, 1]) {
      const s = spike(0.04, 1.6, this.streakMat, 4);
      s.position.set(sx * 0.18, 0.42, -0.05);
      s.rotation.set(-2.1, 0, sx * 0.35);
      this.head.add(s);
    }
    const crestTip = new THREE.Object3D();
    crestTip.position.set(0, 1.1, -1.2);
    this.head.add(crestTip);
    this.sparks.push(crestTip);

    // Wings.
    for (const side of [1, -1]) {
      const root = new THREE.Group();
      root.position.set(side * 1.0, 0.55, 0.45);
      this.body.add(root);
      root.add(limb(V(0, 0, 0), V(side * 2.4, 0.15, -0.35), 0.38, 0.26, skin, 8));
      for (let k = 0; k < 6; k++) {
        const t = (k + 0.5) / 6;
        const f = new THREE.Mesh(featherGeo(2.0 + t * 0.5, 0.42), k % 2 ? featherIn : featherOut);
        f.position.set(side * 2.4 * t, 0.1 * t - 0.02, -0.35 * t);
        f.rotation.y = -side * (0.05 + t * 0.2);
        root.add(f);
        const cov = new THREE.Mesh(featherGeo(1.1, 0.34), featherIn);
        cov.position.set(side * 2.4 * t, 0.06 + 0.1 * t, -0.35 * t + 0.1);
        cov.rotation.y = -side * 0.1;
        root.add(cov);
      }
      const outer = new THREE.Group();
      outer.position.set(side * 2.4, 0.15, -0.35);
      root.add(outer);
      outer.add(limb(V(0, 0, 0), V(side * 2.3, 0.05, -0.2), 0.26, 0.12, skin, 8));
      for (let k = 0; k < 7; k++) {
        const t = 0.3 + k * 0.1;
        const theta = 0.22 + k * 0.19;
        const len = 2.5 - Math.abs(k - 4.5) * 0.14;
        const f = new THREE.Mesh(featherGeo(len, 0.4), k % 2 ? featherOut : featherIn);
        f.position.set(side * 2.3 * t, 0.03 + k * 0.004, -0.2 * t);
        f.rotation.y = -side * theta;
        outer.add(f);
        if (k % 2 === 0) {
          const s = new THREE.Mesh(featherGeo(len * 0.85, 0.07), this.streakMat);
          s.position.copy(f.position);
          s.position.y += 0.03;
          s.rotation.y = f.rotation.y;
          outer.add(s);
        }
      }
      const tip = new THREE.Object3D();
      tip.position.set(side * 3.9, 0.05, -1.6);
      outer.add(tip);
      this.sparks.push(tip);
      this.wings.push({ root, outer, side });
    }

    // Tail fan.
    this.tail.position.set(0, 0.05, -1.85);
    this.body.add(this.tail);
    for (let k = 0; k < 7; k++) {
      const f = new THREE.Mesh(featherGeo(2.7 - Math.abs(k - 3) * 0.15, 0.45), k % 2 ? featherIn : featherOut);
      f.rotation.y = (k - 3) * 0.17;
      f.position.y = Math.abs(k - 3) * -0.01;
      this.tail.add(f);
      if (k >= 2 && k <= 4) {
        const s = new THREE.Mesh(featherGeo(2.4, 0.07), this.streakMat);
        s.rotation.y = f.rotation.y;
        s.position.y = 0.03;
        this.tail.add(s);
      }
    }
    const tailTip = new THREE.Object3D();
    tailTip.position.set(0, 0, -2.6);
    this.tail.add(tailTip);
    this.sparks.push(tailTip);

    // Legs and talons.
    for (const sx of [1, -1]) {
      const leg = new THREE.Group();
      leg.position.set(sx * 0.55, -0.85, 0.25);
      this.body.add(leg);
      leg.add(limb(V(0, 0, 0), V(0, -0.6, 0.1), 0.34, 0.22, skin, 8));
      leg.add(limb(V(0, -0.6, 0.1), V(0, -1.42, 0.22), 0.13, 0.11, legM, 6));
      for (let c = -1; c <= 1; c++) {
        const tl = spike(0.07, 0.5, talon, 5);
        tl.position.set(c * 0.14, -1.48, 0.3);
        tl.rotation.set(Math.PI * 0.56, c * 0.35, 0);
        leg.add(tl);
      }
      const back = spike(0.06, 0.36, talon, 5);
      back.position.set(0, -1.46, 0.12);
      back.rotation.x = -Math.PI * 0.6;
      leg.add(back);
      this.legs.push(leg);
    }

    // Dizzy stars for when she crashes.
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), glow(0xfff0a0));
      const a = (i / 4) * Math.PI * 2;
      s.position.set(Math.sin(a) * 0.85, 0, Math.cos(a) * 0.85);
      this.stars.add(s);
    }
    this.stars.position.set(0, 0.8, 0);
    this.stars.visible = false;
    this.head.add(this.stars);

    this.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
  }

  private flashable(color: number, rough: number, double = false): THREE.MeshStandardMaterial {
    const m = matUnique(color, { rough, flat: true, side: double ? THREE.DoubleSide : THREE.FrontSide });
    this.flashMats.push(m);
    return m;
  }

  setFlash(amount: number, color: number): void {
    for (const m of this.flashMats) {
      if (amount > 0.01) {
        m.emissive.setHex(color);
        m.emissiveIntensity = amount;
      } else {
        // A faint storm glow so she never reads as a black cut-out.
        m.emissive.setHex(0x1a2c4a);
        m.emissiveIntensity = 1;
      }
    }
  }

  update(dt: number, pose: EnemyPose): void {
    this.t += dt;
    const P = this.p;
    let amp = 0.75;
    let speed = 2.3;
    let lift = 0.1;
    let fold = 0.05;
    let pitch = 0.08;
    let roll = 0;
    let beak = 0.05 + Math.max(0, Math.sin(this.t * 0.9)) * 0.08;
    let tuck = 1;
    let head = 0.05;
    let sink = 0;
    let splay = 0;
    const mode = pose.dead ? 'dead' : this.mode;
    switch (mode) {
      case 'glide':
        amp = 0.14;
        speed = 1.3;
        lift = 0.14;
        fold = 0.08;
        break;
      case 'hover':
        amp = 0.95;
        speed = 2.8;
        lift = 0.22;
        pitch = -0.45;
        tuck = 0.35;
        head = 0.35;
        break;
      case 'gust':
        amp = 1.25;
        speed = 4.4;
        lift = 0.3;
        fold = -0.3;
        pitch = -0.55;
        tuck = 0.2;
        beak = 0.5;
        head = 0.45;
        break;
      case 'dive':
        amp = 0.08;
        speed = 1;
        lift = 0.45;
        fold = 0.8;
        pitch = 0.3;
        tuck = -0.55;
        beak = 0.75;
        head = 0.25;
        break;
      case 'crash':
        amp = 0.08;
        speed = 7;
        lift = -0.35;
        fold = 0.1;
        pitch = 0.2;
        roll = 1.0;
        sink = 1;
        head = 0.55;
        beak = 0.35;
        tuck = 1.4;
        splay = 1;
        break;
      case 'screech':
        amp = 1.0;
        speed = 3.1;
        lift = 0.25;
        pitch = -0.5;
        tuck = 0.3;
        head = -0.75;
        beak = 1.0;
        break;
      case 'perch':
        amp = 0;
        lift = -0.55;
        fold = 1.25;
        pitch = 0;
        tuck = 0;
        break;
      case 'dead':
        amp = 0.45;
        speed = 1.6;
        lift = 0.15;
        pitch = -0.1;
        tuck = 0.8;
        head = -0.2;
        break;
      case 'fly':
        break;
    }
    if (pose.state === 'windup' && mode !== 'crash') beak = Math.max(beak, 0.6);
    P.amp = damp(P.amp, amp, 6, dt);
    P.speed = damp(P.speed, speed, 4, dt);
    P.lift = damp(P.lift, lift, 6, dt);
    P.fold = damp(P.fold, fold, 6, dt);
    P.pitch = damp(P.pitch, pitch, 5, dt);
    P.roll = damp(P.roll, roll + this.bank, 5, dt);
    P.beak = damp(P.beak, beak, 12, dt);
    P.tuck = damp(P.tuck, tuck, 6, dt);
    P.head = damp(P.head, head, 6, dt);
    P.sink = damp(P.sink, sink, 7, dt);
    P.splay = damp(P.splay, splay, 6, dt);
    this.phase += dt * P.speed * Math.PI * 2 * (mode === 'crash' ? 0.3 : 1);
    const s = Math.sin(this.phase);
    const twitch = mode === 'crash' ? Math.sin(this.t * 23) * 0.06 : 0;
    for (const w of this.wings) {
      const up = P.lift + P.amp * s - P.splay * (w.side > 0 ? 0.05 : -0.9);
      w.root.rotation.set(0, w.side * P.fold * 0.9, w.side * (up + twitch));
      w.outer.rotation.set(0, w.side * P.fold * 1.3, w.side * (P.amp * 0.55 * Math.sin(this.phase - 0.8) + P.lift * 0.4 - P.splay * 0.2));
    }
    this.body.position.y = 2.4 - P.sink * 1.35 - s * 0.12 * P.amp;
    this.body.rotation.set(P.pitch, 0, P.roll);
    this.head.rotation.set(P.head + Math.sin(this.t * 1.7) * 0.04, Math.sin(this.t * 0.8) * 0.15 * (1 - P.sink), 0);
    this.jaw.rotation.x = P.beak * 0.6;
    this.tail.rotation.set(-P.pitch * 0.5 + Math.sin(this.t * 1.3) * 0.05, 0, 0);
    this.tail.scale.x = 1 + P.amp * 0.15 + (mode === 'dive' ? -0.35 : 0);
    for (const l of this.legs) l.rotation.x = P.tuck * 1.05;
    this.stars.visible = mode === 'crash';
    this.stars.rotation.y += dt * 5;
    // The shadow leaving her: violet eyes turn storm blue.
    const k = clamp(this.purified, 0, 1);
    this.eyeMat.color.setHex(0xe070ff).lerp(new THREE.Color(0x9fe8ff), k);
    this.crackMat.opacity = 0.95 * (1 - k);
    this.streakMat.opacity = 0.75 + Math.sin(this.t * 9) * 0.2;
  }

  dispose(): void {
    for (const m of this.flashMats) m.dispose();
    this.eyeMat.dispose();
    this.crackMat.dispose();
    this.streakMat.dispose();
  }
}

// ---------------------------------------------------------------------------
// Arena hazards: telegraphed lightning and the phase 3 whirlwind.
// ---------------------------------------------------------------------------

interface StrikeRing {
  group: THREE.Group;
  ring: THREE.Mesh;
  fill: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  fillMat: THREE.MeshBasicMaterial;
  x: number;
  y: number;
  z: number;
  r: number;
  t: number;
  dur: number;
  active: boolean;
  struck: boolean;
}

const ringGeo = new THREE.RingGeometry(0.86, 1, 40, 1).rotateX(-Math.PI / 2);
const discGeo = new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2);
const stripGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

/** Solid red reads on pale stone where additive red washes out to pink. */
function redMat(opacity = 0.5): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: 0xff2a1a, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, fog: false,
  });
}

class Whirlwind {
  x: number;
  z: number;
  private root = new THREE.Group();
  private layers: THREE.Mesh[] = [];
  private mats: THREE.MeshBasicMaterial[] = [];
  private t = 0;
  private hitCd = 0;
  private wobble = rng.next() * 10;
  private tx: number;
  private tz: number;
  private retarget = 0;
  life = 1;

  constructor(private game: Game, x: number, private y: number, z: number, private cx: number, private cz: number, private maxR: number) {
    this.x = x;
    this.z = z;
    this.tx = x;
    this.tz = z;
    for (let i = 0; i < 6; i++) {
      const k = i / 5;
      const m = new THREE.MeshBasicMaterial({
        color: i % 2 ? 0xdff4ff : 0x9fc8e8, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      });
      const r0 = 0.5 + k * 2.2;
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r0 + 0.5, r0, 1.5, 14, 1, true, 0, Math.PI * 1.6), m);
      mesh.position.y = 0.7 + i * 1.25;
      this.root.add(mesh);
      this.layers.push(mesh);
      this.mats.push(m);
    }
    this.root.position.set(x, y, z);
    game.level!.root.add(this.root);
  }

  update(dt: number, speed: number): void {
    const g = this.game;
    const p = g.player;
    this.t += dt;
    this.hitCd = Math.max(0, this.hitCd - dt);
    // Roams the arena, drifting toward wherever the dragon was a moment ago:
    // a zone to fight around, not a hunter.
    const dx = p.x - this.x;
    const dz = p.z - this.z;
    const d = Math.hypot(dx, dz) || 1;
    this.retarget -= dt;
    if (this.retarget <= 0 || Math.hypot(this.tx - this.x, this.tz - this.z) < 1.5) {
      this.retarget = 3.5 + rng.next() * 2;
      const a = rng.next() * Math.PI * 2;
      const r = Math.sqrt(rng.next()) * this.maxR;
      const toward = rng.chance(0.35);
      this.tx = toward ? p.x : this.cx + Math.sin(a) * r;
      this.tz = toward ? p.z : this.cz + Math.cos(a) * r;
    }
    const weave = Math.sin(this.t * 0.7 + this.wobble) * 0.6;
    const ang = Math.atan2(this.tx - this.x, this.tz - this.z) + weave;
    this.x += Math.sin(ang) * speed * dt;
    this.z += Math.cos(ang) * speed * dt;
    const ox = this.x - this.cx;
    const oz = this.z - this.cz;
    const od = Math.hypot(ox, oz);
    if (od > this.maxR) {
      this.x = this.cx + (ox / od) * this.maxR;
      this.z = this.cz + (oz / od) * this.maxR;
    }
    this.root.position.set(this.x, this.y, this.z);
    this.layers.forEach((l, i) => {
      l.rotation.y += dt * (5 + i * 1.2);
      l.position.x = Math.sin(this.t * 2 + i * 0.8) * 0.25 * i * 0.3;
      l.position.z = Math.cos(this.t * 2.3 + i * 0.8) * 0.25 * i * 0.3;
    });
    for (const m of this.mats) m.opacity = 0.26 * this.life + Math.sin(this.t * 7) * 0.04;
    if (rng.chance(0.5)) {
      const a = rng.next() * Math.PI * 2;
      const r = 0.6 + rng.next() * 1.8;
      g.fx.emit(this.x + Math.sin(a) * r, this.y + 0.2 + rng.next() * 5, this.z + Math.cos(a) * r, {
        count: 1, speed: 4, dir: [Math.cos(a), 0.8, -Math.sin(a)], spread: 0.3, life: [0.4, 0.8], size: [0.25, 0.5], sizeEnd: 1.8,
        color: 0xd8e8f0, alpha: 0.5, additive: false, drag: 1,
      });
    }
    if (rng.chance(0.25)) g.fx.dust(this.x, this.y, this.z, 2, 0x8a9aa8);
    // Pulls the dragon in, then throws it out.
    const pb = p.body;
    if (!p.alive || pb.y > this.y + 7 || this.life < 1) return;
    if (d < 4.5 && d > 0.3) {
      const pull = (1 - d / 4.5) * 2.6 * this.life;
      pb.x -= (dx / d) * pull * dt;
      pb.z -= (dz / d) * pull * dt;
    }
    if (d < 1.9 && this.hitCd <= 0) {
      this.hitCd = 1.1;
      const r = p.takeHit(makeHit({
        damage: 8 * g.difficultyInfo.enemyDamage, type: 'physical', dirX: dx / d, dirZ: dz / d, knockback: 10, launch: 11,
        source: 'enemy', move: 'whirlwind', fromPlayer: false, ox: this.x, oz: this.z,
      }), null);
      if (r === 'hit') g.sfx('swingHeavy', this.x, this.y, this.z, 0.6);
    }
  }

  dispose(): void {
    this.game.level?.root.remove(this.root);
    for (const l of this.layers) l.geometry.dispose();
    for (const m of this.mats) m.dispose();
  }
}

// ---------------------------------------------------------------------------
// Boss
// ---------------------------------------------------------------------------

export const SKRIEKA_DEF: EnemyDef = {
  id: 'skrieka', name: 'Skrieka', hp: 850, radius: 2.2, height: 4.2, speed: 9, turnRate: 3, mass: 0, poise: 999, flying: true, hover: 7,
  resist: { fire: 1.3, lightning: 0 }, statusResist: { lightning: 0, fire: 0.8, ice: 0.6 }, aggroRange: 80,
  gems: { blue: 170, red: 6, green: 6, purple: 6 },
  attacks: [],
  build: () => new SkriekaModel(),
  styleValue: 10,
};

type Mode =
  | 'intro' | 'circle' | 'volley' | 'swoopAim' | 'swoop' | 'pullUp' | 'crash' | 'rise'
  | 'gustMove' | 'gust' | 'strikeUp' | 'strike' | 'summon' | 'phase' | 'fall';

/** Circling height: low enough to stay in view and to lock on to (Tab). */
const ALT = 5.5;
const CIRCLE_R = 10.5;

export class Skrieka extends Boss {
  readonly displayName = 'Skrieka, the Last Storm Roc';
  private mode: Mode = 'intro';
  private modeT = 0;
  private readonly cx: number;
  private readonly cz: number;
  private readonly floorY: number;
  private readonly arenaR: number;
  private ang = 0;
  private circleDir = 1;
  private circleFor = 3;
  private sinceSwoop = 2;
  private lastAction: Mode = 'intro';
  /** A new phase opens with its signature attack. */
  private queued: Mode | null = null;
  private prevX: number;
  private prevZ: number;
  private swoopS = new THREE.Vector3();
  private swoopP = new THREE.Vector3();
  private swoopE = new THREE.Vector3();
  private swoopLocked = false;
  private swoopDist = 0;
  private swoopHit = false;
  private slideX = 0;
  private slideZ = 0;
  private hoverX = 0;
  private hoverZ = 0;
  private volleys = 0;
  private gustBurst = false;
  private gustFeathers = false;
  private strikeWaves = 0;
  private knock = 0;
  private knockCd = 0;
  private summonCd = 0;
  private minions: Enemy[] = [];
  private crashes = 0;
  private sparkT = 0;
  private hazardRoot = new THREE.Group();
  private strip: THREE.Mesh;
  private stripMat: THREE.MeshBasicMaterial;
  private aimRing: THREE.Mesh;
  private aimMat: THREE.MeshBasicMaterial;
  private rings: StrikeRing[] = [];
  private whirl: Whirlwind | null = null;
  private shadow: THREE.Mesh;
  private shadowMat: THREE.MeshBasicMaterial;
  private tmpA = new THREE.Vector3();
  private tmpB = new THREE.Vector3();
  private told = new Set<string>();

  /** (cx, floorY, cz) is the arena center on the spire top; r the barrier radius. */
  constructor(game: Game, cx: number, floorY: number, cz: number, arenaR: number) {
    super(game, SKRIEKA_DEF, cx, floorY + 13, cz - 6, 0);
    this.speakerId = 'skrieka';
    this.phases = 3;
    this.cx = cx;
    this.cz = cz;
    this.floorY = floorY;
    this.arenaR = arenaR;
    this.prevX = this.body.x;
    this.prevZ = this.body.z;
    this.ang = Math.atan2(this.body.x - cx, this.body.z - cz);
    this.state = 'chase';
    this.stripMat = redMat(0);
    this.strip = new THREE.Mesh(stripGeo, this.stripMat);
    this.strip.visible = false;
    this.strip.renderOrder = 24;
    this.hazardRoot.add(this.strip);
    this.aimMat = redMat(0);
    this.aimRing = new THREE.Mesh(ringGeo, this.aimMat);
    this.aimRing.visible = false;
    this.aimRing.renderOrder = 24;
    this.hazardRoot.add(this.aimRing);
    for (let i = 0; i < 8; i++) {
      const group = new THREE.Group();
      const m = redMat(0.8);
      const fm = redMat(0.3);
      const ring = new THREE.Mesh(ringGeo, m);
      const fill = new THREE.Mesh(discGeo, fm);
      ring.renderOrder = fill.renderOrder = 24;
      group.add(ring, fill);
      group.visible = false;
      this.hazardRoot.add(group);
      this.rings.push({ group, ring, fill, mat: m, fillMat: fm, x: 0, y: 0, z: 0, r: 2.4, t: 0, dur: 1, active: false, struck: false });
    }
    // A soft shadow on the floor shows where she is even when she is overhead.
    this.shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false });
    this.shadow = new THREE.Mesh(discGeo, this.shadowMat);
    this.shadow.renderOrder = 23;
    this.hazardRoot.add(this.shadow);
    game.level!.root.add(this.hazardRoot);
    this.rocModel.mode = 'glide';
  }

  private get rocModel(): SkriekaModel {
    return this.model as SkriekaModel;
  }

  private get agg(): number {
    return this.game.difficultyInfo.aggression;
  }

  private setMode(m: Mode): void {
    this.mode = m;
    this.modeT = 0;
  }

  private hint(key: string, text: string, seconds = 6): void {
    if (this.told.has(key)) return;
    this.told.add(key);
    this.game.hud.flick(text, seconds);
  }

  // --- flight helpers ------------------------------------------------------------

  private flyToward(x: number, y: number, z: number, rate: number, maxSpeed: number, dt: number): void {
    const b = this.body;
    const k = 1 - Math.exp(-rate * dt);
    let dx = (x - b.x) * k;
    let dy = (y - b.y) * k;
    let dz = (z - b.z) * k;
    const d = Math.hypot(dx, dy, dz);
    const max = maxSpeed * dt;
    if (d > max) {
      dx *= max / d;
      dy *= max / d;
      dz *= max / d;
    }
    b.vx = dx / dt;
    b.vy = dy / dt;
    b.vz = dz / dt;
  }

  private faceMotion(dt: number, rate = 4): void {
    const b = this.body;
    if (Math.hypot(b.vx, b.vz) > 0.8) this.yaw = approachAngle(this.yaw, yawOf(b.vx, b.vz), rate * dt);
  }

  private facePlayer(dt: number, rate = 4): void {
    this.yaw = approachAngle(this.yaw, this.yawToPlayer(), rate * dt);
  }

  /** Keeps a point inside the arena, `margin` in from the barrier. */
  private clampArena(v: THREE.Vector3, margin: number): THREE.Vector3 {
    const dx = v.x - this.cx;
    const dz = v.z - this.cz;
    const d = Math.hypot(dx, dz);
    const max = this.arenaR - margin;
    if (d > max) {
      v.x = this.cx + (dx / d) * max;
      v.z = this.cz + (dz / d) * max;
    }
    return v;
  }

  private playerAngle(): number {
    const p = this.game.player;
    return Math.atan2(p.x - this.cx, p.z - this.cz);
  }

  // --- the brain -----------------------------------------------------------------

  protected override think(dt: number): void {
    const g = this.game;
    const b = this.body;
    this.modeT += dt;
    this.knock = Math.max(0, this.knock - 5 * dt);
    this.knockCd = Math.max(0, this.knockCd - dt);
    this.summonCd = Math.max(0, this.summonCd - dt);
    const fast = this.phase === 3 ? 1.3 : 1;
    const agg = this.agg;

    if (!this.awake) {
      // Circling high over the spire while everyone talks.
      this.ang += dt * 0.45;
      this.flyToward(this.cx + Math.sin(this.ang) * 9, this.floorY + 13 + Math.sin(g.time) * 0.5, this.cz + Math.cos(this.ang) * 9, 2, 12, dt);
      this.faceMotion(dt, 3);
      this.rocModel.mode = 'glide';
      this.rocModel.bank = -0.3;
      return;
    }

    switch (this.mode) {
      case 'intro': {
        this.setMode('circle');
        this.circleFor = 1.6;
        break;
      }
      case 'circle': {
        this.setState('chase');
        const speed = 8.5 * fast;
        this.ang += (this.circleDir * speed / CIRCLE_R) * dt;
        const tx = this.cx + Math.sin(this.ang) * CIRCLE_R;
        const tz = this.cz + Math.cos(this.ang) * CIRCLE_R;
        const ty = this.floorY + ALT + Math.sin(g.time * 1.3) * 0.6;
        this.flyToward(tx, ty, tz, 2.6, 15 * fast, dt);
        this.faceMotion(dt, 5);
        this.rocModel.mode = Math.sin(g.time * 0.6) > 0.3 ? 'glide' : 'fly';
        this.rocModel.bank = -this.circleDir * 0.35;
        if (this.modeT > this.circleFor) {
          if (this.checkPhase()) break;
          this.pickAction();
        }
        break;
      }
      case 'volley': {
        this.rocModel.mode = 'hover';
        this.rocModel.bank = 0;
        // Low enough to answer with fireballs.
        this.flyToward(b.x, this.floorY + 4.8, b.z, 2, 6, dt);
        this.facePlayer(dt, 5);
        const wind = 0.75 / agg;
        if (this.state !== 'active') {
          this.setState('windup');
          if (this.modeT >= wind) {
            this.setState('active');
            // The follow-up volley is a short one.
            this.fireFeathers(this.volleys > 1 ? 3 : this.phase === 3 ? 7 : 5, 0.16);
            this.volleys--;
          }
        } else if (this.stateT > 0.55) {
          if (this.volleys > 0) {
            this.setState('windup');
            this.modeT = wind * 0.35;
          } else this.backToCircle(1.8);
        }
        break;
      }
      case 'swoopAim': {
        this.updateSwoopAim(dt, fast);
        break;
      }
      case 'swoop': {
        this.updateSwoop(dt, fast);
        break;
      }
      case 'pullUp': {
        this.setState('chase');
        this.rocModel.mode = 'fly';
        this.rocModel.bank = 0;
        const out = this.tmpA.set(b.x + b.vx * 0.3, this.floorY + ALT, b.z + b.vz * 0.3);
        this.clampArena(out, 3);
        this.flyToward(out.x, out.y, out.z, 2.5, 16, dt);
        this.faceMotion(dt, 3);
        if (this.modeT > 1.1) this.backToCircle(1.2);
        break;
      }
      case 'fall': {
        this.rocModel.mode = 'crash';
        this.setState('recover');
        b.vx *= Math.exp(-3 * dt);
        b.vz *= Math.exp(-3 * dt);
        b.vy -= 26 * dt;
        if (b.y <= this.groundY(b.x, b.z) + 0.05) this.startCrash(false);
        break;
      }
      case 'crash': {
        this.updateCrash(dt);
        break;
      }
      case 'rise': {
        this.rocModel.mode = 'hover';
        if (this.modeT < 0.6 / agg) {
          this.setState('windup');
          b.vx = b.vy = b.vz = 0;
          this.facePlayer(dt, 2);
          break;
        }
        if (this.state === 'windup') {
          this.setState('active');
          g.spawnShockwave(b.x, this.floorY, b.z, 7, 12, 8 * g.difficultyInfo.enemyDamage, 8, this);
          g.fx.dust(b.x, this.floorY, b.z, 20, 0x9aa8b8);
          g.sfx('flap', b.x, b.y, b.z, 0.5);
          g.sfx('swingHeavy', b.x, b.y, b.z, 0.6);
          g.shake(0.3, 0.3);
        }
        this.flyToward(b.x, this.floorY + ALT, b.z, 2.2, 9, dt);
        if (this.modeT > 0.6 / agg + 1.1) this.backToCircle(1.4);
        break;
      }
      case 'gustMove': {
        this.setState('chase');
        this.rocModel.mode = 'fly';
        this.rocModel.bank = 0;
        this.flyToward(this.hoverX, this.floorY + 4.2, this.hoverZ, 3, 14 * fast, dt);
        this.faceMotion(dt, 4);
        if (this.modeT > 1.1 || Math.hypot(b.x - this.hoverX, b.z - this.hoverZ) < 1) {
          this.setMode('gust');
          this.setState('windup');
          this.gustBurst = false;
          this.gustFeathers = false;
        }
        break;
      }
      case 'gust': {
        this.updateGust(dt);
        break;
      }
      case 'strikeUp': {
        this.setState('chase');
        this.rocModel.mode = 'fly';
        this.rocModel.bank = 0;
        this.flyToward(this.cx, this.floorY + 9, this.cz, 2.5, 14 * fast, dt);
        this.faceMotion(dt, 3);
        if (this.modeT > 1.1) {
          this.setMode('strike');
          this.setState('windup');
          this.strikeWaves = this.phase === 3 ? 2 : 1;
        }
        break;
      }
      case 'strike': {
        this.updateStrike(dt);
        break;
      }
      case 'summon': {
        this.rocModel.mode = 'screech';
        this.flyToward(b.x, this.floorY + 4.8, b.z, 2, 6, dt);
        this.facePlayer(dt, 3);
        if (this.modeT < 0.9 / agg) this.setState('windup');
        else if (this.state === 'windup') {
          this.setState('active');
          this.summonWisps(1);
        } else if (this.modeT > 0.9 / agg + 0.8) this.backToCircle(2);
        break;
      }
      case 'phase': {
        this.updatePhaseChange(dt);
        break;
      }
    }
  }

  private backToCircle(t: number): void {
    this.setMode('circle');
    this.setState('chase');
    this.circleFor = (this.phase === 3 ? t * 0.7 : t) + rng.next() * 1.0;
    this.ang = Math.atan2(this.body.x - this.cx, this.body.z - this.cz);
    this.aimRing.visible = false;
    this.strip.visible = false;
  }

  private checkPhase(): boolean {
    const f = this.hpFrac;
    const want = f < 0.33 ? 3 : f < 0.66 ? 2 : 1;
    if (want <= this.phase) return false;
    this.phase = want;
    this.setMode('phase');
    this.setState('chase');
    return true;
  }

  private pickAction(): void {
    const ph = this.phase;
    this.circleDir = rng.chance(0.5) ? 1 : -1;
    let pick: Mode;
    if (this.queued) {
      pick = this.queued;
      this.queued = null;
    } else if (this.sinceSwoop >= (ph === 3 ? 1 : 2)) pick = 'swoopAim';
    else {
      const opts: [Mode, number][] = [['swoopAim', 3], ['volley', 2]];
      if (this.lastAction !== 'gustMove') opts.push(['gustMove', 1.7]);
      if (ph >= 2) {
        opts.push(['strikeUp', 2.2]);
        if (this.aliveMinions() < 2 && this.summonCd <= 0) opts.push(['summon', 2.2]);
      }
      let total = 0;
      for (const [, w] of opts) total += w;
      let r = rng.next() * total;
      pick = opts[0]![0];
      for (const [m, w] of opts) {
        r -= w;
        if (r <= 0) {
          pick = m;
          break;
        }
      }
    }
    this.lastAction = pick;
    if (pick === 'swoopAim') this.startSwoopAim();
    else {
      this.sinceSwoop++;
      if (pick === 'volley') {
        this.volleys = ph >= 2 ? 2 : 1;
        this.setMode('volley');
      } else if (pick === 'gustMove') {
        // Hover on the far side from the dragon, then blow it back.
        const a = this.playerAngle() + Math.PI + rng.signed() * 0.5;
        this.hoverX = this.cx + Math.sin(a) * 9;
        this.hoverZ = this.cz + Math.cos(a) * 9;
        this.setMode('gustMove');
      } else if (pick === 'summon') {
        this.summonCd = 18;
        this.setMode('summon');
      } else this.setMode(pick);
    }
  }

  // --- swoop -----------------------------------------------------------------------

  private startSwoopAim(): void {
    this.sinceSwoop = 0;
    this.swoopLocked = false;
    this.setMode('swoopAim');
    this.setState('windup');
    const g = this.game;
    g.sfx('bossRoar', this.x, this.y, this.z, 1.5, 0.6);
    this.hint('swoop', 'She\'s lining up a dive! Watch the red streak and get out of the way. Dodge (Shift) at the last second!', 6);
  }

  private updateSwoopAim(dt: number, fast: number): void {
    const g = this.game;
    const b = this.body;
    const p = g.player;
    const wind = (this.phase === 3 ? 0.9 : 1.15) / this.agg;
    this.rocModel.mode = 'hover';
    this.rocModel.bank = 0;
    // Swing out to the far side of the arena from the dragon.
    const a = this.playerAngle() + Math.PI;
    const sx = this.cx + Math.sin(a) * (this.arenaR - 2.5);
    const sz = this.cz + Math.cos(a) * (this.arenaR - 2.5);
    if (!this.swoopLocked) this.flyToward(sx, this.floorY + 5, sz, 2.4, 16 * fast, dt);
    else this.flyToward(b.x, this.floorY + 5, b.z, 4, 4, dt);
    this.facePlayer(dt, 6);
    if (!this.swoopLocked) {
      this.swoopP.set(p.x, this.floorY, p.z);
      if (this.modeT > wind * 0.72) {
        this.swoopLocked = true;
        g.sfx('enemyAttack', b.x, b.y, b.z, 0.6);
      }
    }
    // The streak from her to where she will crash.
    const dx = this.swoopP.x - b.x;
    const dz = this.swoopP.z - b.z;
    const d = Math.hypot(dx, dz) || 1;
    this.swoopE.set(this.swoopP.x + (dx / d) * 7, this.floorY, this.swoopP.z + (dz / d) * 7);
    this.clampArena(this.swoopE, 2.4);
    const ex = this.swoopE.x - b.x;
    const ez = this.swoopE.z - b.z;
    const len = Math.hypot(ex, ez);
    this.strip.visible = true;
    this.strip.position.set(b.x + ex * 0.5, this.groundY(this.swoopE.x, this.swoopE.z) + 0.07, b.z + ez * 0.5);
    this.strip.rotation.y = yawOf(ex, ez);
    this.strip.scale.set(2.6, 1, Math.max(1, len));
    const k = this.modeT / wind;
    this.stripMat.opacity = this.swoopLocked ? 0.6 + Math.sin(g.time * 40) * 0.15 : 0.2 + k * 0.35;
    this.stripMat.color.setHex(this.swoopLocked ? 0xff5a10 : 0xff2a1a);
    this.aimRing.visible = true;
    this.aimRing.position.set(this.swoopE.x, this.groundY(this.swoopE.x, this.swoopE.z) + 0.09, this.swoopE.z);
    this.aimRing.scale.setScalar(2.4 + Math.sin(g.time * 12) * 0.2);
    this.aimMat.opacity = 0.5;
    if (this.modeT >= wind) {
      this.swoopS.set(b.x, b.y, b.z);
      this.swoopDist = 0;
      this.swoopHit = false;
      this.setMode('swoop');
      this.setState('active');
      g.sfx('bossRoar', b.x, b.y, b.z, 1.8, 0.8);
      g.sfx('flap', b.x, b.y, b.z, 0.6);
    }
  }

  private updateSwoop(dt: number, fast: number): void {
    const g = this.game;
    const b = this.body;
    const p = g.player;
    this.rocModel.mode = 'dive';
    this.rocModel.bank = 0;
    const speed = 25 * fast;
    const ex = this.swoopE.x - this.swoopS.x;
    const ez = this.swoopE.z - this.swoopS.z;
    const total = Math.hypot(ex, ez) || 1;
    const dp = Math.max(1, Math.hypot(this.swoopP.x - this.swoopS.x, this.swoopP.z - this.swoopS.z));
    this.swoopDist = Math.min(total, this.swoopDist + speed * dt);
    const t = this.swoopDist / total;
    const nx = this.swoopS.x + ex * t;
    const nz = this.swoopS.z + ez * t;
    const drop = smoothstep(0, dp, this.swoopDist);
    const ny = lerp(this.swoopS.y, this.floorY + 0.9, drop);
    b.vx = (nx - b.x) / dt;
    b.vy = (ny - b.y) / dt;
    b.vz = (nz - b.z) / dt;
    this.yaw = yawOf(ex, ez);
    this.stripMat.opacity = Math.max(0, this.stripMat.opacity - dt * 2);
    if (rng.chance(0.6)) g.fx.emit(b.x, b.y + 2, b.z, { count: 2, speed: 2, life: [0.2, 0.4], size: [0.3, 0.6], color: 0xbfe8ff, bright: 1.6, jitter: 1.5 });
    // Talons.
    if (!this.swoopHit && p.alive) {
      const pb = p.body;
      const d = Math.hypot(pb.x - b.x, pb.z - b.z);
      if (d < 2.6 && pb.y < b.y + 3.2 && pb.y + pb.height > b.y - 0.4) {
        const n = d || 1;
        const r = p.takeHit(makeHit({
          damage: 16 * g.difficultyInfo.enemyDamage, type: 'physical', dirX: (pb.x - b.x) / n, dirZ: (pb.z - b.z) / n,
          knockback: 12, launch: 7, source: 'enemy', move: 'swoop', fromPlayer: false, ox: b.x, oz: b.z,
        }), this);
        if (r === 'hit' || r === 'killed') {
          this.swoopHit = true;
          g.sfx('hitHeavy', b.x, b.y, b.z, 0.8);
          this.strip.visible = false;
          this.aimRing.visible = false;
          this.setMode('pullUp');
          this.setState('chase');
          return;
        }
        if (r === 'dodged') this.swoopHit = true;
      }
    }
    if (this.swoopDist >= total - 0.01) {
      this.slideX = ex / total;
      this.slideZ = ez / total;
      this.startCrash(true);
    }
  }

  private startCrash(fromSwoop: boolean): void {
    const g = this.game;
    const b = this.body;
    this.strip.visible = false;
    this.aimRing.visible = false;
    this.setMode('crash');
    this.setState('recover');
    this.crashes++;
    b.y = this.groundY(b.x, b.z);
    b.vx = b.vy = b.vz = 0;
    if (!fromSwoop) this.slideX = this.slideZ = 0;
    g.shake(0.6, 0.45);
    g.sfx('pound', b.x, b.y, b.z, 0.7);
    g.sfx('bossRoar', b.x, b.y, b.z, 1.3, 0.6);
    g.fx.dust(b.x, b.y, b.z, 30, 0x9aa8b8);
    g.fx.rocks(b.x, b.y + 0.3, b.z, 14, 0x6a7a88);
    g.fx.ring(b.x, b.y, b.z, 0.5, 6, 0xbfe8ff, 0.4);
    if (this.crashes === 1) g.toast('Skrieka crashed! Strike now!', 'good');
    // A little health shakes loose when she hits the ground.
    g.spawnGems(b.x, b.y + 1.5, b.z, { red: 1 }, false);
    this.hint('crash', 'She crashed! Get in there with horns, tail and fire before she gets up!', 5);
  }

  private updateCrash(dt: number): void {
    const g = this.game;
    const b = this.body;
    const p = g.player;
    this.rocModel.mode = 'crash';
    this.rocModel.bank = 0;
    const dur = 2.8 / Math.pow(this.agg, 0.6);
    // A short skid along the dive, then stillness.
    const slide = Math.max(0, 1 - this.modeT / 0.35) * 9;
    const next = this.tmpA.set(b.x + this.slideX * slide * dt, 0, b.z + this.slideZ * slide * dt);
    this.clampArena(next, 2);
    b.vx = (next.x - b.x) / dt;
    b.vz = (next.z - b.z) / dt;
    b.vy = 0;
    b.y = this.groundY(b.x, b.z);
    if (slide > 0 && rng.chance(0.5)) g.fx.dust(b.x, b.y, b.z, 3, 0x9aa8b8);
    // Nobody walks through a fallen roc.
    const pb = p.body;
    const dx = pb.x - b.x;
    const dz = pb.z - b.z;
    const d = Math.hypot(dx, dz);
    const min = 1.9 + pb.radius;
    if (d < min && d > 1e-3 && Math.abs(pb.y - b.y) < 2.5) {
      pb.x = b.x + (dx / d) * min;
      pb.z = b.z + (dz / d) * min;
    }
    if (this.modeT > dur - 0.6 / this.agg) this.setState('windup');
    if (this.modeT > dur) {
      this.setMode('rise');
      this.setState('active');
    }
  }

  // --- gust ------------------------------------------------------------------------

  private updateGust(dt: number): void {
    const g = this.game;
    const b = this.body;
    const p = g.player;
    const wind = 0.9 / this.agg;
    const active = this.phase === 3 ? 2.6 : 2.2;
    this.flyToward(this.hoverX, this.floorY + 4.2 + Math.sin(g.time * 3) * 0.2, this.hoverZ, 3, 5, dt);
    this.facePlayer(dt, 3);
    this.rocModel.bank = 0;
    if (this.modeT < wind) {
      this.rocModel.mode = 'hover';
      this.setState('windup');
      if (rng.chance(0.4)) g.fx.emit(b.x, b.y + 2.4, b.z, { count: 2, speed: 3, life: [0.3, 0.5], size: [0.2, 0.4], color: 0xdff4ff, bright: 1.2, jitter: 3 });
      this.hint('gust', 'She\'s going to blow us away! Hold your ground, or hit her with fireballs (Q) while she hovers!', 6);
      return;
    }
    this.rocModel.mode = 'gust';
    this.setState('active');
    const pb = p.body;
    const dx = pb.x - b.x;
    const dz = pb.z - b.z;
    const d = Math.hypot(dx, dz) || 1;
    const inCone = Math.abs(angleDiff(this.yaw, yawOf(dx, dz))) < 1.0 && d < 26;
    if (!this.gustBurst) {
      this.gustBurst = true;
      g.sfx('flap', b.x, b.y, b.z, 0.35);
      g.sfx('swingHeavy', b.x, b.y, b.z, 0.5);
      g.shake(0.25, 0.3);
      if (inCone && d < 9 && p.alive) {
        p.takeHit(makeHit({
          damage: 5 * g.difficultyInfo.enemyDamage, type: 'physical', dirX: dx / d, dirZ: dz / d, knockback: 10, launch: 4,
          source: 'enemy', move: 'gust', fromPlayer: false, ox: b.x, oz: b.z,
        }), this);
      }
    }
    if (inCone && p.alive) {
      const push = (this.phase === 3 ? 8.5 : 7) * (1 - Math.min(1, d / 30) * 0.4);
      pb.x += (dx / d) * push * dt;
      pb.z += (dz / d) * push * dt;
    }
    if (rng.chance(0.8)) {
      const fx = Math.sin(this.yaw);
      const fz = Math.cos(this.yaw);
      g.fx.emit(b.x + fx * 2, b.y + 2 + rng.signed() * 1.5, b.z + fz * 2, {
        count: 2, speed: 17, dir: [fx, -0.08, fz], spread: 0.22, life: [0.6, 1.0], size: [0.25, 0.5], sizeEnd: 2.4,
        color: 0xeef8ff, alpha: 0.45, additive: false, drag: 0.6, jitter: 2,
      });
    }
    if (this.phase >= 2 && !this.gustFeathers && this.modeT > wind + 0.8) {
      this.gustFeathers = true;
      this.fireFeathers(3, 0.12);
    }
    if (this.modeT > wind + active) this.backToCircle(1.8);
  }

  // --- feathers ----------------------------------------------------------------------

  private fireFeathers(n: number, spread: number): void {
    const g = this.game;
    const b = this.body;
    const p = g.player.body;
    const ox = b.x + Math.sin(this.yaw) * 1.8;
    const oy = b.y + 2.6;
    const oz = b.z + Math.cos(this.yaw) * 1.8;
    const tx = p.x + p.vx * 0.3;
    const ty = p.y + 0.7;
    const tz = p.z + p.vz * 0.3;
    const base = yawOf(tx - ox, tz - oz);
    const pitch = Math.atan2(ty - oy, Math.hypot(tx - ox, tz - oz));
    for (let i = 0; i < n; i++) {
      const yaw = base + (n === 1 ? 0 : (i - (n - 1) / 2) * spread);
      g.spawnProjectile({
        x: ox, y: oy, z: oz, dx: Math.sin(yaw) * Math.cos(pitch), dy: Math.sin(pitch), dz: Math.cos(yaw) * Math.cos(pitch),
        speed: 15, radius: 0.42, damage: this.phase === 3 ? 7 : 6, type: 'lightning', color: 0xa8e6ff, life: 3.2, gravity: 0,
        fromPlayer: false, kind: 'shard', knockback: 4,
      });
    }
    g.sfx('zap', ox, oy, oz, 0.8);
    g.sfx('swing', ox, oy, oz, 0.7);
    g.fx.flash(ox, oy, oz, 0xa8e6ff, 5, 14, 0.2);
  }

  // --- lightning strikes -----------------------------------------------------------

  private updateStrike(dt: number): void {
    const g = this.game;
    const b = this.body;
    this.flyToward(this.cx, this.floorY + 9 + Math.sin(g.time * 2) * 0.3, this.cz, 2, 5, dt);
    this.facePlayer(dt, 2);
    this.rocModel.mode = this.state === 'windup' ? 'screech' : 'hover';
    const wind = 0.6 / this.agg;
    if (this.state === 'windup') {
      if (this.modeT >= wind) {
        this.setState('active');
        this.placeRings(this.phase === 3 ? 5 : 4);
        this.strikeWaves--;
        this.modeT = 0;
        g.sfx('bossRoar', b.x, b.y, b.z, 1.6, 0.7);
        this.hint('strike', 'Red rings! Lightning\'s coming down on them. Keep moving!', 5);
      }
      return;
    }
    if (this.strikeWaves > 0 && this.modeT > 0.75) {
      this.placeRings(3);
      this.strikeWaves--;
      this.modeT = 0;
    }
    if (this.strikeWaves <= 0 && !this.rings.some((r) => r.active) && this.modeT > 0.4) this.backToCircle(1.6);
  }

  private placeRings(n: number): void {
    const p = this.game.player;
    const spots: [number, number][] = [[p.x + p.body.vx * 0.35, p.z + p.body.vz * 0.35]];
    let tries = 0;
    while (spots.length < n && tries++ < 60) {
      const a = rng.next() * Math.PI * 2;
      const r = Math.sqrt(rng.next()) * (this.arenaR - 2.5);
      const x = this.cx + Math.sin(a) * r;
      const z = this.cz + Math.cos(a) * r;
      if (spots.every(([sx, sz]) => Math.hypot(sx - x, sz - z) > 5)) spots.push([x, z]);
    }
    const dur = (this.phase === 3 ? 1.15 : 1.35) / this.agg;
    for (const [x, z] of spots) {
      const v = this.clampArena(this.tmpB.set(x, 0, z), 1.5);
      const ring = this.rings.find((r) => !r.active);
      if (!ring) break;
      ring.active = true;
      ring.struck = false;
      ring.x = v.x;
      ring.z = v.z;
      ring.y = this.groundY(v.x, v.z);
      ring.r = 2.4;
      ring.t = 0;
      ring.dur = dur;
      ring.group.visible = true;
      ring.group.position.set(ring.x, ring.y + 0.08, ring.z);
      ring.ring.scale.setScalar(ring.r);
      ring.fill.scale.setScalar(0.01);
    }
  }

  private updateRings(dt: number): void {
    const g = this.game;
    for (const r of this.rings) {
      if (!r.active) continue;
      r.t += dt;
      if (!r.struck) {
        const k = Math.min(1, r.t / r.dur);
        r.fill.scale.setScalar(Math.max(0.01, r.r * k));
        r.mat.opacity = 0.7 + Math.sin(r.t * 25) * 0.2;
        r.fillMat.opacity = 0.2 + k * 0.35;
        if (rng.chance(0.15)) g.fx.sparkle(r.x + rng.signed() * r.r, r.y + 0.3, r.z + rng.signed() * r.r, 0xbfe8ff, 1);
        if (k >= 1) this.bolt(r);
      } else {
        const k = (r.t - r.dur) / 0.35;
        r.mat.opacity = Math.max(0, 0.8 * (1 - k));
        r.fillMat.opacity = Math.max(0, 0.5 * (1 - k));
        if (k >= 1) {
          r.active = false;
          r.group.visible = false;
        }
      }
    }
  }

  private bolt(r: StrikeRing): void {
    const g = this.game;
    r.struck = true;
    r.mat.color.setHex(0xbfe8ff);
    r.fillMat.color.setHex(0xbfe8ff);
    const top = this.tmpA.set(r.x + rng.signed() * 3, r.y + 26, r.z + rng.signed() * 3);
    const bot = this.tmpB.set(r.x, r.y + 0.1, r.z);
    g.fx.arc(top, bot, 0xe8f8ff, 0.35, 0.28, 0.25);
    g.fx.explosion(r.x, r.y + 0.6, r.z, 1.4, 0xbfe8ff, 0x3a6ac8);
    g.sfx('zap', r.x, r.y, r.z, 0.7);
    g.sfx('explosion', r.x, r.y, r.z, 1.4, 0.6);
    g.shake(0.2, 0.2);
    const p = g.player;
    const pb = p.body;
    const d = Math.hypot(pb.x - r.x, pb.z - r.z);
    if (p.alive && d < r.r + pb.radius * 0.5 && pb.y < r.y + 3) {
      const n = d || 1;
      p.takeHit(makeHit({
        damage: 14 * g.difficultyInfo.enemyDamage, type: 'lightning', dirX: (pb.x - r.x) / n, dirZ: (pb.z - r.z) / n,
        knockback: 8, launch: 6, source: 'enemy', move: 'stormStrike', fromPlayer: false, ox: r.x, oz: r.z,
      }), this);
    }
    // Lightning grounds out through the Storm Wisps too, but they drink it.
    setTimeout(() => {
      r.mat.color.setHex(0xff3030);
      r.fillMat.color.setHex(0xff3030);
    }, 400);
  }

  // --- summons and phases ------------------------------------------------------------

  private aliveMinions(): number {
    this.minions = this.minions.filter((m) => m.alive);
    return this.minions.length;
  }

  private summonWisps(n: number): void {
    const g = this.game;
    const b = this.body;
    const room = Math.max(0, 2 - this.aliveMinions());
    const a0 = this.playerAngle();
    for (let i = 0; i < Math.min(n, room); i++) {
      const a = a0 + (i === 0 ? 1.2 : -1.2) + rng.signed() * 0.3;
      const x = this.cx + Math.sin(a) * (this.arenaR - 3);
      const z = this.cz + Math.cos(a) * (this.arenaR - 3);
      const e = g.spawnEnemy('stormWisp', x, this.groundY(x, z) + 3.5, z, a + Math.PI, true);
      e.aggro = true;
      // Each wisp she calls carries a spark of health for whoever pops it.
      e.onDeath = (w) => g.spawnGems(w.x, w.y + 1, w.z, { red: 1 }, true);
      this.minions.push(e);
    }
    g.sfx('bossRoar', b.x, b.y, b.z, 1.2, 0.8);
    g.shake(0.3, 0.4);
    for (let i = 0; i < 4; i++) this.crackle(6);
  }

  private updatePhaseChange(dt: number): void {
    const g = this.game;
    const b = this.body;
    this.flyToward(this.cx, this.floorY + 9, this.cz, 2, 14, dt);
    this.facePlayer(dt, 2);
    if (this.modeT < 1.0) {
      this.rocModel.mode = 'fly';
      this.setState('chase');
      return;
    }
    this.rocModel.mode = 'screech';
    if (this.state !== 'windup') {
      this.setState('windup');
      g.sfx('bossRoar', b.x, b.y, b.z, 1.1);
      g.shake(0.5, 0.8);
      g.spawnGems(this.cx, this.floorY + 1, this.cz, { red: 3 }, false);
      if (this.phase === 2) {
        g.toast('Skrieka calls the storm!', 'warn');
        g.hud.flick('She\'s calling Storm Wisps and lightning! Watch the ground for red rings!', 6);
      } else {
        g.toast('Skrieka is enraged!', 'warn');
        g.hud.flick('A whirlwind! Stay clear of it. She\'s faster now, but so are we!', 6);
      }
    }
    if (rng.chance(0.3)) this.crackle(8);
    if (this.modeT > 2.4) {
      if (this.phase === 2) {
        this.summonWisps(2);
        this.summonCd = 14;
      } else if (!this.whirl) {
        const a = this.playerAngle() + Math.PI;
        const x = this.cx + Math.sin(a) * (this.arenaR - 4);
        const z = this.cz + Math.cos(a) * (this.arenaR - 4);
        this.whirl = new Whirlwind(g, x, this.floorY, z, this.cx, this.cz, this.arenaR - 3);
        g.sfx('steam', x, this.floorY, z, 0.5);
      }
      this.queued = this.phase === 2 ? 'strikeUp' : 'swoopAim';
      this.backToCircle(1.2);
    }
  }

  // --- per-step extras (run even while stunned) ------------------------------------------

  override updateBoss(dt: number): void {
    const g = this.game;
    this.updateRings(dt);
    const b = this.body;
    const gy = this.groundY(b.x, b.z);
    const alt = Math.max(0, b.y - gy);
    this.shadow.visible = this.alive;
    this.shadow.position.set(b.x, gy + 0.05, b.z);
    this.shadow.scale.setScalar(Math.max(1.6, 3.6 - alt * 0.12));
    this.shadowMat.opacity = Math.max(0.12, 0.38 - alt * 0.02);
    // Pull the camera back while she is in the air.
    if (this.awake) g.cam.extraDist = this.alive ? 3.5 : 0;
    if (this.whirl) {
      if (this.alive) this.whirl.update(dt, 2.8);
      else {
        this.whirl.life -= dt * 1.5;
        this.whirl.update(dt, 0);
        if (this.whirl.life <= 0) {
          this.whirl.dispose();
          this.whirl = null;
        }
      }
    }
    if (!this.alive) {
      this.strip.visible = false;
      this.aimRing.visible = false;
      return;
    }
    if (this.awake && this.modeT > 2 && this.mode === 'circle') this.hint('lock', 'Tip: press Tab (or the middle mouse button) to lock on and keep her in view!', 6);
    // Lightning crackles over her wings.
    this.sparkT -= dt;
    if (this.sparkT <= 0) {
      this.sparkT = (this.state === 'windup' ? 0.1 : 0.22) + rng.next() * 0.25;
      this.crackle(1.5);
    }
  }

  /** One arc from a spark point on her body to somewhere nearby. */
  private crackle(reach: number): void {
    const g = this.game;
    const pts = this.rocModel.sparks;
    const from = pts[Math.floor(rng.next() * pts.length)];
    if (!from) return;
    from.getWorldPosition(this.tmpA);
    this.tmpB.set(this.tmpA.x + rng.signed() * reach, this.tmpA.y + rng.signed() * reach * 0.6, this.tmpA.z + rng.signed() * reach);
    g.fx.arc(this.tmpA, this.tmpB, 0xbfe8ff, 0.06 + reach * 0.01, 0.09, 0.5);
  }

  // --- physics -----------------------------------------------------------------------

  private groundY(x: number, z: number): number {
    const gy = this.game.col.groundAt(x, z, this.floorY + 3, 0.3).y;
    return gy > -1e3 ? gy : this.floorY;
  }

  /** She flies under her own power; only a fall or death brings gravity back. */
  override integrate(dt: number, _friction: number): void {
    const b = this.body;
    const m = this.rocModel;
    if (this.state === 'dead') {
      // The shadow leaves her; she beats her wings and climbs away.
      const t = this.deadT;
      m.purified = Math.min(1, t / 1.2);
      if (t < 0.5) {
        b.vy = Math.max(b.vy - 20 * dt, -6);
      } else {
        const ox = b.x - this.cx;
        const oz = b.z - this.cz;
        const od = Math.hypot(ox, oz) || 1;
        b.vx = damp(b.vx, (ox / od) * 7, 2, dt);
        b.vz = damp(b.vz, (oz / od) * 7, 2, dt);
        b.vy = damp(b.vy, 8, 2, dt);
        this.yaw = approachAngle(this.yaw, yawOf(ox, oz), dt * 2);
      }
      b.x += b.vx * dt;
      b.y = Math.max(this.groundY(b.x, b.z), b.y + b.vy * dt);
      b.z += b.vz * dt;
      return;
    }
    if (this.status.frozen > 0 || this.mode === 'fall') {
      b.vy = Math.max(-25, b.vy - 26 * dt);
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.z += b.vz * dt;
    const v = this.clampArena(this.tmpA.set(b.x, 0, b.z), this.mode === 'crash' ? 2 : 1.5);
    b.x = v.x;
    b.z = v.z;
    const gy = this.groundY(b.x, b.z);
    if (b.y < gy) {
      b.y = gy;
      b.vy = Math.max(0, b.vy);
    }
    b.grounded = this.mode === 'crash' || this.mode === 'rise';
    // Bank into turns.
    if (this.mode === 'circle' || this.mode === 'intro') {
      const turn = angleDiff(yawOf(this.prevX - this.cx, this.prevZ - this.cz), yawOf(b.x - this.cx, b.z - this.cz));
      m.bank = damp(m.bank, clamp(-turn / Math.max(dt, 1e-3) * 0.35, -0.5, 0.5), 3, dt);
    }
    this.prevX = b.x;
    this.prevZ = b.z;
  }

  override syncModel(dt: number): void {
    super.syncModel(dt);
    // She does not shrink away like a Gloomling; she flies off, fading late.
    if (this.state === 'dead') this.model.root.scale.setScalar(Math.max(0.001, 1 - Math.max(0, this.deadT - 1.7) * 1.2));
  }

  // --- damage -------------------------------------------------------------------------

  override takeHit(hit: Hit): HitResult {
    if (!this.awake) return 'none';
    const r = super.takeHit(hit);
    if (r !== 'hit') return r;
    const g = this.game;
    if (this.mode === 'crash') {
      // Grounded, she is wide open.
      const extra = hit.damage * 0.25 * (this.def.resist[hit.type] ?? 1);
      this.hp -= extra;
      if (this.hp <= 0) {
        this.die(hit, null);
        return 'killed';
      }
    } else if ((this.mode === 'circle' || this.mode === 'volley' || this.mode === 'gust' || this.mode === 'gustMove' || this.mode === 'strike' || this.mode === 'summon') &&
      this.knockCd <= 0 && (hit.type === 'fire' || hit.heavy)) {
      this.knock += hit.stagger;
      if (this.knock >= 75) {
        this.knock = 0;
        this.knockCd = 8;
        this.rings.forEach((ring) => ring.active && !ring.struck && (ring.t = Math.min(ring.t, ring.dur - 0.05)));
        this.setMode('fall');
        this.setState('recover');
        this.body.vy = 2;
        g.toast('Knocked out of the sky!', 'good');
        g.sfx('bossRoar', this.x, this.y, this.z, 1.4, 0.8);
        this.hint('knock', 'Ha! Enough fire and she falls right out of the air!', 5);
      }
    }
    return r;
  }

  override die(hit: Hit | null, reaction: Reaction | null = null): void {
    if (!this.alive) return;
    super.die(hit, reaction);
    this.strip.visible = false;
    this.aimRing.visible = false;
    for (const r of this.rings) {
      r.active = false;
      r.group.visible = false;
    }
    // The storm breaks with her: her wisps burst.
    for (const m of this.minions) if (m.alive) m.die(null);
    this.minions = [];
    this.rocModel.mode = 'dead';
  }

  protected override onReset(): void {
    this.setMode('intro');
  }

  override dispose(): void {
    super.dispose();
    this.game.cam.extraDist = 0;
    this.shadowMat.dispose();
    this.game.level?.root.remove(this.hazardRoot);
    this.stripMat.dispose();
    this.aimMat.dispose();
    for (const r of this.rings) {
      r.mat.dispose();
      r.fillMat.dispose();
    }
    this.whirl?.dispose();
    this.whirl = null;
    // Her Storm Wisps scatter with her when the fight resets.
    for (const m of this.minions) {
      if (!m.alive) continue;
      m.alive = false;
      m.releaseToken();
      m.setState('dead');
      m.deadT = 1;
    }
    this.minions = [];
  }
}
