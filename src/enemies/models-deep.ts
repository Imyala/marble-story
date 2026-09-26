import * as THREE from 'three';
import { mat, matUnique, glow, addRim } from '../render/materials';
import { ellipsoid, limb, spike, taperedTube, mergeStatic } from '../render/shapes';
import { damp, lerp, smoothstep } from '../core/math';
import { skinify } from '../render/skinify';
import type { EnemyModel, EnemyPose } from './models';

/**
 * Models for the Mycelium Deep's two foe families (Act II):
 *
 *   SporelingModel    a knee-high hopping mushroom: big cap, stubby legs, glowing gills and eyes
 *   PuffcapModel      a squat puffball under a wide cap, spore sacs on its flanks, a vent on top
 *   RootstalkerModel  a low, many-legged beast of thorny black root with a soft glowing belly
 *   ThornspitterModel a rooted pod of thorny vine on a stem that pulls down into its mound
 *
 * Built to read in a dark, glowing cave: pale or black bodies against the
 * teal gloom, and every tell (gills, sacs, throat, eyes) an unlit glow that
 * brightens as an attack winds up. The Spore family glows a sickly
 * yellow-green; the Rootspawn glow the Hollow King's violet and a hot pink.
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Spore green: the colour of everything Mycora grows. */
export const SPORE_GLOW = 0xd4ff5a;
/** The Hollow King's veins, and the Rootspawn's hot throat. */
export const ROOT_VEIN = 0xa24cff;
export const ROOT_HOT = 0xff4ab8;

/** The plumbing every model here shares (the same contract as the models in models.ts). */
abstract class DeepModel implements EnemyModel {
  readonly root = new THREE.Group();
  protected flashMats: THREE.MeshStandardMaterial[] = [];
  /** Unlit glow materials this model owns (tells that pulse). */
  protected glows: THREE.MeshBasicMaterial[] = [];
  protected time = Math.random() * 10;
  abstract update(dt: number, pose: EnemyPose): void;

  /** A lit material that flashes on hits and windups. */
  protected skin(color: number, rough = 0.7, flat = false): THREE.MeshStandardMaterial {
    const m = matUnique(color, { rough, flat });
    this.flashMats.push(m);
    return m;
  }

  /** A glow of this model's own, free to change colour. */
  protected glowMat(color: number, opacity = 1, additive = false): THREE.MeshBasicMaterial {
    const m = glow(color, opacity, additive);
    this.glows.push(m);
    return m;
  }

  setFlash(amount: number, color: number): void {
    for (const m of this.flashMats) {
      m.emissive.setHex(color);
      m.emissiveIntensity = amount;
    }
  }

  rim(color: number, strength: number): void {
    for (const m of this.flashMats) addRim(m, color, strength);
  }

  dispose(): void {
    for (const m of this.flashMats) m.dispose();
    for (const m of this.glows) m.dispose();
    this.root.traverse((o) => {
      if ((o as THREE.SkinnedMesh).isSkinnedMesh) {
        (o as THREE.SkinnedMesh).geometry.dispose();
        (o as THREE.SkinnedMesh).skeleton?.dispose();
      }
    });
  }
}

/** A half-dome cap of radius r (flat side down), for mushroom tops. */
function dome(r: number, squash: number, material: THREE.Material, detail = 16): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, detail, Math.max(5, detail >> 1), 0, Math.PI * 2, 0, Math.PI / 2), material);
  m.scale.y = squash;
  m.castShadow = true;
  return m;
}

const tmpCol = new THREE.Color();

/** Blends a glow material between two colours (k in 0..1, may overshoot for a hot flash). */
function tint(m: THREE.MeshBasicMaterial, from: number, to: number, k: number): void {
  m.color.setHex(from).lerp(tmpCol.setHex(to), Math.max(0, Math.min(1, k)));
}

// ---------------------------------------------------------------------------
// Sporeling
// ---------------------------------------------------------------------------

export interface SporelingLook {
  cap: number;
  spots: number;
  gills: number;
  stalk: number;
  eye: number;
  scale: number;
}

export const SPORELING_LOOK: SporelingLook = { cap: 0x9c34c0, spots: 0xeaff8a, gills: 0x86c83a, stalk: 0xe8dcc6, eye: 0xf2ff9a, scale: 1 };

/** A knee-high mushroom that hops everywhere it goes. */
export class SporelingModel extends DeepModel {
  private body = new THREE.Group();
  private capG = new THREE.Group();
  private legs: THREE.Group[] = [];
  private gillMat: THREE.MeshBasicMaterial;
  private spotMat: THREE.MeshBasicMaterial;
  private look: SporelingLook;
  private hop = 0;
  private p = { squash: 0, lean: 0, back: 0, roll: 0, lift: 0, sink: 0, cap: 0 };

  constructor(look: SporelingLook = SPORELING_LOOK) {
    super();
    this.look = look;
    const S = look.scale;
    const outer = new THREE.Group();
    outer.scale.setScalar(S);
    this.root.add(outer);
    outer.add(this.body);
    const stalk = this.skin(look.stalk, 0.75);
    const capM = this.skin(look.cap, 0.55);
    this.gillMat = this.glowMat(look.gills);
    this.spotMat = this.glowMat(look.spots);
    const eyeM = glow(look.eye);
    this.glows.push(eyeM);
    const dark = mat(0x2a1a30, { rough: 1 });
    // A plump stalk for a body, with a face.
    const trunk = ellipsoid(0.27, 0.3, 0.25, stalk, 12);
    trunk.position.y = 0.42;
    this.body.add(trunk);
    for (const sx of [-1, 1]) {
      const e = ellipsoid(0.065, 0.08, 0.035, eyeM, 8);
      e.position.set(sx * 0.1, 0.5, 0.225);
      e.rotation.z = sx * 0.25;
      this.body.add(e);
    }
    const mouth = ellipsoid(0.075, 0.03, 0.02, dark, 8);
    mouth.position.set(0, 0.37, 0.24);
    this.body.add(mouth);
    // The cap: a dome with glowing spots, glowing gills beneath.
    this.capG.position.y = 0.62;
    this.body.add(this.capG);
    this.capG.add(dome(0.5, 0.62, capM, 14));
    const gills = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.22, 0.1, 14), this.gillMat);
    gills.position.y = -0.03;
    this.capG.add(gills);
    for (let i = 0; i < 6; i++) {
      const a = i * 2.39 + 0.4;
      const r = i === 0 ? 0 : 0.2 + (i % 2) * 0.12;
      const h = Math.sqrt(Math.max(0, 1 - (r / 0.5) ** 2)) * 0.31;
      const s = ellipsoid(0.07 - (i % 3) * 0.012, 0.03, 0.07 - (i % 3) * 0.012, this.spotMat, 6);
      s.position.set(Math.sin(a) * r, h - 0.005, Math.cos(a) * r);
      s.rotation.set(Math.cos(a) * r * 1.2, 0, -Math.sin(a) * r * 1.2);
      this.capG.add(s);
    }
    // Stubby legs.
    for (const sx of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(sx * 0.12, 0.25, 0);
      this.body.add(hip);
      hip.add(limb(V(0, 0, 0), V(0, -0.2, 0.02), 0.085, 0.07, stalk, 7));
      const foot = ellipsoid(0.095, 0.055, 0.13, stalk, 7);
      foot.position.set(0, -0.215, 0.05);
      hip.add(foot);
      this.legs.push(hip);
    }
    this.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    mergeStatic(this.root);
    skinify(this.root);
  }

  update(dt: number, pose: EnemyPose): void {
    this.time += dt;
    const P = this.p;
    const t = this.time;
    const moving = pose.state === 'chase' || pose.state === 'strafe' || pose.state === 'idle' ? Math.min(1.2, pose.speed) : 0;
    // Hops: a parabola per hop, a squash on each landing.
    if (moving > 0.08) this.hop += dt * (4.2 + moving * 2.6);
    else this.hop = damp(this.hop, Math.round(this.hop), 10, dt);
    const u = this.hop % 1;
    let lift = 4 * u * (1 - u) * 0.3 * Math.min(1, moving * 1.5);
    let squash = (u < 0.12 ? 1 - u / 0.12 : u > 0.92 ? (u - 0.92) / 0.08 : 0) * 0.22 * Math.min(1, moving * 1.5);
    let lean = 0.12 * moving;
    let back = 0;
    let roll = 0;
    let sink = 0;
    let cap = Math.sin(t * 2.2) * 0.05;
    let glowK = 0.25 + 0.15 * Math.sin(t * 3.1);
    let rate = 14;
    if (moving <= 0.08) squash += Math.sin(t * 2.6) * 0.03;
    if (pose.state === 'windup' || pose.state === 'active' || pose.state === 'recover') {
      rate = 22;
      const w = smoothstep(0, 1, pose.windup);
      if (pose.state === 'windup') {
        squash = 0.34 * w + Math.sin(t * 40) * 0.03 * w;
        lean = -0.35 * w;
        cap = -0.2 * w;
        glowK = 0.4 + 0.9 * w;
      } else if (pose.state === 'active') {
        squash = -0.22;
        lean = 0.55;
        lift = 0.25;
        cap = 0.25;
        glowK = 1.3;
      } else {
        const k = 1 - smoothstep(0, 0.4, pose.t);
        lean = 0.3 * k;
        squash = 0.1 * k;
      }
    }
    if (pose.state === 'hitstun') {
      back = 0.55 * (1 - smoothstep(0, 0.3, pose.t));
      cap = Math.sin(t * 30) * 0.25;
      rate = 30;
    }
    if (pose.state === 'air') {
      back = 0.4;
      roll = Math.sin(t * 16) * 0.4;
      cap = Math.sin(t * 22) * 0.3;
    }
    if (pose.state === 'down') {
      roll = 1.35;
      sink = -0.12;
      cap = 0.3;
    }
    if (pose.dead) {
      squash = 0.55;
      glowK = 1.6;
      rate = 20;
    }
    if (pose.state === 'spawn') {
      sink = -0.95 * (1 - smoothstep(0, 0.7, pose.t));
      glowK = 1.2;
    }
    P.squash = damp(P.squash, squash, rate, dt);
    P.lean = damp(P.lean, lean, rate, dt);
    P.back = damp(P.back, back, rate, dt);
    P.roll = damp(P.roll, roll, 12, dt);
    P.lift = damp(P.lift, lift, 30, dt);
    P.sink = damp(P.sink, sink, 16, dt);
    P.cap = damp(P.cap, cap, rate, dt);
    this.body.position.y = P.lift + P.sink;
    this.body.scale.set(1 + P.squash * 0.6, 1 - P.squash, 1 + P.squash * 0.6);
    this.body.rotation.set(P.lean - P.back, 0, P.roll);
    this.capG.rotation.set(P.cap, 0, Math.sin(t * 1.7) * 0.04);
    for (const [i, l] of this.legs.entries()) {
      const k = Math.sin(this.hop * Math.PI * 2 + i * Math.PI);
      l.rotation.x = k * 0.5 * Math.min(1, moving) + (pose.state === 'air' ? Math.sin(t * 24 + i) * 0.8 : 0);
    }
    tint(this.gillMat, this.look.gills, 0xf6ffb0, glowK - 0.25);
    tint(this.spotMat, this.look.spots, 0xffffff, glowK - 0.6);
  }
}

// ---------------------------------------------------------------------------
// Puffcap
// ---------------------------------------------------------------------------

/** A squat puffball under a wide cap: spore sacs on its flanks, a vent on top. */
export class PuffcapModel extends DeepModel {
  private bodyG = new THREE.Group();
  private ball = new THREE.Group();
  private capG = new THREE.Group();
  private sacs: THREE.Mesh[] = [];
  private sacMat: THREE.MeshBasicMaterial;
  private gillMat: THREE.MeshBasicMaterial;
  private ventMat: THREE.MeshBasicMaterial;
  private lids: THREE.Mesh[] = [];
  private p = { swell: 0, lean: 0, wobble: 0, sag: 0, sink: 0 };
  /** 0..1 while it is growing a sporeling (set by the foe's brain). */
  growing = 0;

  constructor(scale = 1.15) {
    super();
    const skin = this.skin(0xcbb6d8, 0.8);
    const wart = this.skin(0x8a6a9c, 0.9);
    const capM = this.skin(0x5a267c, 0.55);
    const rootM = this.skin(0x3a2a48, 0.9);
    this.sacMat = this.glowMat(SPORE_GLOW);
    this.gillMat = this.glowMat(0x7ab83a);
    this.ventMat = this.glowMat(0xb8f050);
    const eyeM = this.glowMat(0xf6ff9a);
    const dark = mat(0x1e1226, { rough: 1 });
    this.root.add(this.bodyG);
    // Mycelium feet, spread over the ground.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const r = new THREE.Mesh(taperedTube([V(0, 0.35, 0), V(Math.sin(a) * 0.8, 0.12, Math.cos(a) * 0.8), V(Math.sin(a) * 1.45, 0.02, Math.cos(a) * 1.45)], 0.2, 0.03, 8, 6), rootM);
      this.root.add(r);
      const tip = ellipsoid(0.07, 0.05, 0.07, this.sacMat, 6);
      tip.position.set(Math.sin(a) * 1.45, 0.04, Math.cos(a) * 1.45);
      this.root.add(tip);
    }
    // The puffball.
    this.ball.position.y = 0.95;
    this.bodyG.add(this.ball);
    this.ball.add(ellipsoid(0.95, 0.85, 0.95, skin, 18));
    for (let i = 0; i < 9; i++) {
      const a = i * 2.1 + 0.5;
      const y = -0.35 + (i % 3) * 0.3;
      const rr = Math.sqrt(Math.max(0, 1 - (y / 0.85) ** 2)) * 0.95;
      if (Math.cos(a) > 0.75 && y > -0.1) continue;
      const w = ellipsoid(0.12, 0.08, 0.12, wart, 7);
      w.position.set(Math.sin(a) * rr, y, Math.cos(a) * rr);
      this.ball.add(w);
    }
    // Spore sacs bulging from the flanks and back: they swell as it grows a sporeling.
    for (const [a, y, s] of [[1.35, 0.1, 0.26], [-1.35, 0.05, 0.24], [2.6, 0.2, 0.22], [-2.5, -0.15, 0.2]] as [number, number, number][]) {
      const rr = Math.sqrt(Math.max(0, 1 - (y / 0.85) ** 2)) * 0.9;
      const sac = ellipsoid(s, s * 1.15, s, this.sacMat, 10);
      sac.position.set(Math.sin(a) * rr, y, Math.cos(a) * rr);
      sac.userData.keep = true;
      sac.userData.s = s;
      this.ball.add(sac);
      this.sacs.push(sac);
    }
    // A sleepy face.
    for (const sx of [-1, 1]) {
      const e = ellipsoid(0.13, 0.075, 0.05, eyeM, 8);
      e.position.set(sx * 0.3, 0.3, 0.86);
      e.rotation.z = sx * -0.2;
      this.ball.add(e);
      const lid = ellipsoid(0.17, 0.08, 0.08, skin, 8);
      lid.position.set(sx * 0.3, 0.37, 0.85);
      lid.rotation.z = sx * -0.2;
      lid.userData.keep = true;
      this.ball.add(lid);
      this.lids.push(lid);
    }
    const mouth = ellipsoid(0.2, 0.09, 0.05, dark, 10);
    mouth.position.set(0, 0.02, 0.93);
    this.ball.add(mouth);
    // The wide cap, glowing gills under it and a vent on top.
    this.capG.position.y = 1.72;
    this.bodyG.add(this.capG);
    this.capG.add(dome(1.25, 0.45, capM, 20));
    const gills = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 0.55, 0.2, 20), this.gillMat);
    gills.position.y = -0.06;
    this.capG.add(gills);
    const rimRing = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.05, 6, 32), this.sacMat);
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = 0.02;
    this.capG.add(rimRing);
    for (let i = 0; i < 7; i++) {
      const a = i * 0.9 + 0.2;
      const r = 0.5 + (i % 3) * 0.2;
      const h = Math.sqrt(Math.max(0, 1 - (r / 1.25) ** 2)) * 0.56;
      const s = ellipsoid(0.13, 0.04, 0.13, this.sacMat, 6);
      s.position.set(Math.sin(a) * r, h - 0.01, Math.cos(a) * r);
      s.rotation.set(Math.cos(a) * r * 0.5, 0, -Math.sin(a) * r * 0.5);
      this.capG.add(s);
    }
    const vent = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.07, 6, 16), this.ventMat);
    vent.rotation.x = Math.PI / 2;
    vent.position.y = 0.55;
    this.capG.add(vent);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), dark);
    hole.rotation.x = -Math.PI / 2;
    hole.position.y = 0.565;
    this.capG.add(hole);
    // Everything one size up (inside the root, which the game scales on its own).
    const inner = new THREE.Group();
    inner.scale.setScalar(scale);
    for (const c of [...this.root.children]) inner.add(c);
    this.root.add(inner);
    this.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    mergeStatic(this.root);
    skinify(this.root);
  }

  update(dt: number, pose: EnemyPose): void {
    this.time += dt;
    const P = this.p;
    const t = this.time;
    let swell = Math.sin(t * 1.6) * 0.03;
    let lean = 0;
    let wobble = Math.sin(t * 1.1) * 0.03 + (pose.speed > 0.1 ? Math.sin(t * 5) * 0.08 * pose.speed : 0);
    let sag = 0;
    let sink = 0;
    let glowK = 0.2 + 0.12 * Math.sin(t * 2.4);
    let vent = 0.2;
    let lid = 0.5;
    const grow = this.growing;
    if (pose.state === 'windup' || pose.state === 'active' || pose.state === 'recover') {
      const w = smoothstep(0, 1, pose.windup);
      const act = pose.state === 'active';
      if (pose.attack === 'puff') {
        swell = pose.state === 'windup' ? 0.26 * w + Math.sin(t * 36) * 0.02 * w : act ? -0.14 : -0.08 * (1 - smoothstep(0, 0.5, pose.t));
        glowK = pose.state === 'windup' ? 0.3 + w : act ? 1.4 : 0.3;
        vent = pose.state === 'windup' ? 0.3 + w : act ? 1.5 : 0.3;
        lid = 0;
      } else if (pose.attack === 'lob') {
        lean = pose.state === 'windup' ? -0.28 * w : act ? 0.25 : 0.12 * (1 - smoothstep(0, 0.5, pose.t));
        swell = pose.state === 'windup' ? 0.12 * w : 0;
        vent = pose.state === 'windup' ? 0.3 + w : 0.6;
        lid = 0.2;
      }
    }
    if (grow > 0) {
      wobble = Math.sin(t * 14) * 0.08 * grow;
      glowK = Math.max(glowK, 0.4 + grow * 1.1);
      swell = Math.max(swell, grow * 0.1);
      lid = 0;
    }
    if (pose.state === 'hitstun') {
      swell = -0.1 * (1 - smoothstep(0, 0.3, pose.t));
      wobble = Math.sin(t * 30) * 0.1;
      lid = 1;
    }
    if (pose.state === 'down' || pose.shocked) {
      sag = pose.state === 'down' ? 0.25 : 0.1;
      lid = 1;
    }
    if (pose.dead) {
      sag = 0.6;
      swell = -0.2;
      lid = 1;
    }
    if (pose.state === 'spawn') sink = -2.2 * (1 - smoothstep(0, 0.7, pose.t));
    P.swell = damp(P.swell, swell, 16, dt);
    P.lean = damp(P.lean, lean, 14, dt);
    P.wobble = damp(P.wobble, wobble, 14, dt);
    P.sag = damp(P.sag, sag, 6, dt);
    P.sink = damp(P.sink, sink, 12, dt);
    const s = 1 + P.swell;
    this.ball.scale.set(s, s * (1 - P.sag * 0.5), s);
    this.bodyG.position.y = P.sink - P.sag * 0.4;
    this.bodyG.rotation.set(P.lean, 0, P.wobble);
    this.capG.position.y = 1.72 + P.swell * 0.8 - P.sag * 0.5;
    this.capG.rotation.set(-P.lean * 0.5 + P.sag * 0.4, 0, -P.wobble * 0.6);
    for (const [i, sac] of this.sacs.entries()) {
      const base = sac.userData.s as number;
      const k = 1 + Math.sin(t * 4 + i * 1.7) * 0.08 + grow * 0.45;
      sac.scale.set(base * k, base * 1.15 * k, base * k);
    }
    for (const l of this.lids) l.position.y = lerp(0.37, 0.3, lid);
    tint(this.sacMat, SPORE_GLOW, 0xffffff, glowK - 0.8);
    tint(this.gillMat, 0x7ab83a, 0xeaff9a, glowK);
    tint(this.ventMat, 0xb8f050, 0xffffff, vent - 0.6);
  }
}

// ---------------------------------------------------------------------------
// Rootstalker
// ---------------------------------------------------------------------------

/** A low beast of knotted black root on eight legs; its belly is soft and glows. */
export class RootstalkerModel extends DeepModel {
  private shell = new THREE.Group();
  private head = new THREE.Group();
  private mands: THREE.Group[] = [];
  private legs: { g: THREE.Group; side: number; i: number }[] = [];
  private veinMat: THREE.MeshBasicMaterial;
  private eyeMat: THREE.MeshBasicMaterial;
  private heartMat: THREE.MeshBasicMaterial;
  private phase = 0;
  private flipK = 0;
  private p = { burrow: 0, rear: 0, lunge: 0, jaw: 0 };
  /** 0 surfaced .. 1 under the ground (set by the foe's brain). */
  burrow = 0;
  /** 0..1 rearing straight up out of the ground. */
  rear = 0;

  constructor(scale = 1) {
    super();
    const g = new THREE.Group();
    g.scale.setScalar(scale);
    this.root.add(g);
    g.add(this.shell);
    this.shell.position.y = 0.6;
    const bark = this.skin(0x2c2238, 0.85, true);
    const knot = this.skin(0x3a2c46, 0.9, true);
    const belly = this.skin(0x7a6268, 0.8);
    const bone = mat(0xdcccb0, { rough: 0.5 });
    this.veinMat = this.glowMat(ROOT_VEIN);
    this.eyeMat = this.glowMat(ROOT_HOT);
    this.heartMat = this.glowMat(0xff7ad8);
    // Three knotted segments, nose to tail along +z.
    for (const [z, rx, ry, rz] of [[-0.72, 0.52, 0.36, 0.55], [0, 0.64, 0.44, 0.56], [0.66, 0.5, 0.36, 0.44]] as [number, number, number, number][]) {
      const seg = ellipsoid(rx, ry, rz, bark, 12);
      seg.position.z = z;
      this.shell.add(seg);
      // Glowing cracks between the knots.
      for (const sx of [-1, 1]) {
        const c = ellipsoid(0.06, 0.045, rz * 0.75, this.veinMat, 6);
        c.position.set(sx * rx * 0.62, ry * 0.62, z);
        c.rotation.z = sx * 0.7;
        this.shell.add(c);
        const c2 = ellipsoid(0.05, 0.035, rz * 0.5, this.veinMat, 6);
        c2.position.set(sx * rx * 0.9, ry * 0.05, z);
        c2.rotation.z = sx * 1.3;
        this.shell.add(c2);
      }
    }
    for (let i = 0; i < 9; i++) {
      const k = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16 + (i % 3) * 0.05, 0), knot);
      k.position.set(Math.sin(i * 2.3) * 0.42, 0.3 + (i % 2) * 0.08, -0.9 + i * 0.22);
      k.rotation.set(i, i * 1.3, 0);
      this.shell.add(k);
    }
    // A ridge of thorns down the back (the armour), each rooted in a glowing vein.
    for (let i = 0; i < 7; i++) {
      const z = -0.95 + i * 0.3;
      for (const sx of i % 2 ? [-1, 1] : [0]) {
        const th = spike(0.07, 0.42 + (i % 3) * 0.12, knot, 5);
        th.position.set(sx * 0.22, 0.34 + Math.cos(z) * 0.06, z);
        th.rotation.set(-0.55, 0, sx * -0.45);
        this.shell.add(th);
        const v = ellipsoid(0.09, 0.05, 0.12, this.veinMat, 6);
        v.position.set(sx * 0.22, 0.33 + Math.cos(z) * 0.06, z + 0.02);
        this.shell.add(v);
      }
    }
    // A glowing seam down the spine.
    const seam = ellipsoid(0.05, 0.05, 1.05, this.veinMat, 6);
    seam.position.set(0, 0.4, -0.1);
    this.shell.add(seam);
    // The soft belly, with the glowing heart that shows when it is flipped.
    const bel = ellipsoid(0.55, 0.2, 1.05, belly, 12);
    bel.position.set(0, -0.18, 0);
    this.shell.add(bel);
    const heart = ellipsoid(0.26, 0.08, 0.36, this.heartMat, 10);
    heart.position.set(0, -0.33, 0.05);
    this.shell.add(heart);
    // Head: a wedge with four eyes and two hooked mandibles.
    this.head.position.set(0, 0.02, 1.02);
    this.shell.add(this.head);
    const skull = ellipsoid(0.36, 0.25, 0.38, bark, 12);
    this.head.add(skull);
    for (const [sx, y, s] of [[-0.14, 0.1, 0.06], [0.14, 0.1, 0.06], [-0.24, 0.04, 0.045], [0.24, 0.04, 0.045]] as [number, number, number][]) {
      const e = ellipsoid(s, s * 0.8, s * 0.6, this.eyeMat, 6);
      e.position.set(sx, y, 0.32);
      this.head.add(e);
    }
    for (const sx of [-1, 1]) {
      const m = new THREE.Group();
      m.position.set(sx * 0.18, -0.08, 0.26);
      this.head.add(m);
      m.add(new THREE.Mesh(taperedTube([V(0, 0, 0), V(sx * 0.2, -0.02, 0.22), V(sx * 0.06, -0.05, 0.46)], 0.07, 0.008, 8, 5), bone));
      this.mands.push(m);
    }
    // Eight root legs, jointed at the knee, each with a thorn.
    for (const side of [1, -1]) {
      for (let i = 0; i < 4; i++) {
        const lg = new THREE.Group();
        lg.position.set(side * 0.46, -0.04, 0.72 - i * 0.48);
        this.shell.add(lg);
        const knee = V(side * 0.62, 0.34, 0.05 - i * 0.04);
        const foot = V(side * 0.98, -0.56, 0.12 - i * 0.1);
        lg.add(limb(V(0, 0, 0), knee, 0.09, 0.07, bark, 6));
        lg.add(limb(knee, foot, 0.07, 0.025, knot, 6));
        const th = spike(0.04, 0.22, knot, 4);
        th.position.copy(knee);
        th.rotation.z = -side * 0.7;
        lg.add(th);
        this.legs.push({ g: lg, side, i });
      }
    }
    this.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    mergeStatic(this.root);
    skinify(this.root);
  }

  update(dt: number, pose: EnemyPose): void {
    this.time += dt;
    const P = this.p;
    const t = this.time;
    const moving = pose.state === 'chase' || pose.state === 'strafe' || pose.state === 'idle' ? pose.speed : 0;
    this.phase += dt * (5 + moving * 16);
    let lunge = 0;
    let jaw = 0.15 + Math.sin(t * 3) * 0.05;
    let glowK = 0.35 + 0.15 * Math.sin(t * 2.3);
    if (pose.state === 'windup') {
      lunge = -0.35 * pose.windup;
      jaw = 0.2 + 0.6 * pose.windup;
      glowK = 0.5 + pose.windup;
    } else if (pose.state === 'active') {
      lunge = 0.3;
      jaw = -0.1;
      glowK = 1.3;
    }
    if (pose.state === 'hitstun') lunge = -0.25;
    const flip = pose.flipped || pose.dead ? 1 : 0;
    this.flipK = damp(this.flipK, flip, 9, dt);
    P.burrow = damp(P.burrow, this.burrow, 12, dt);
    P.rear = damp(P.rear, this.rear, 16, dt);
    P.lunge = damp(P.lunge, lunge, 14, dt);
    P.jaw = damp(P.jaw, jaw, 18, dt);
    const s = this.shell;
    s.rotation.z = this.flipK * Math.PI;
    s.rotation.x = P.lunge + P.burrow * 0.7 - P.rear * 1.15;
    s.position.y = 0.6 + this.flipK * 0.25 - P.burrow * 1.9 + P.rear * 0.6 + (moving > 0.1 ? Math.abs(Math.sin(this.phase)) * 0.04 : 0);
    this.head.rotation.x = Math.sin(t * 2.1) * 0.06;
    this.mands[0]!.rotation.y = P.jaw;
    this.mands[1]!.rotation.y = -P.jaw;
    const flail = this.flipK > 0.5 ? 1 : 0;
    const tuck = Math.max(P.burrow, P.rear * 0.6);
    for (const l of this.legs) {
      const ph = this.phase + l.i * 1.4 + (l.side > 0 ? 0 : Math.PI);
      const stride = Math.min(1, moving + 0.08);
      l.g.rotation.y = Math.sin(ph) * 0.4 * stride * (1 - flail) + Math.sin(t * 18 + l.i) * 0.5 * flail;
      l.g.rotation.z = -l.side * (Math.max(0, Math.cos(ph)) * 0.25 * stride + tuck * 0.9 + flail * (0.4 + Math.sin(t * 14 + l.i * 2) * 0.35));
    }
    tint(this.veinMat, ROOT_VEIN, 0xf0c8ff, glowK - 0.35);
    tint(this.eyeMat, ROOT_HOT, 0xffffff, glowK - 0.8);
    tint(this.heartMat, 0xff7ad8, 0xffffff, this.flipK * (0.3 + 0.3 * Math.sin(t * 8)));
  }
}

// ---------------------------------------------------------------------------
// Thornspitter
// ---------------------------------------------------------------------------

/** A pod of thorny vine on a stem, rooted in a mound it can pull itself down into. */
export class ThornspitterModel extends DeepModel {
  private stem = new THREE.Group();
  private head = new THREE.Group();
  private petals: THREE.Group[] = [];
  private tendrils: THREE.Group[] = [];
  private throat: THREE.Mesh;
  private throatMat: THREE.MeshBasicMaterial;
  private veinMat: THREE.MeshBasicMaterial;
  private p = { retract: 0, open: 0, lean: 0, droop: 0 };
  /** 0 standing .. 1 pulled down into the mound (set by the foe's brain). */
  retract = 0;
  /** 0 closed .. 1 wide open (winding up a volley). */
  open = 0;
  /** Stunned after re-emerging (or a thorn of its own came back): the head hangs. */
  dazed = false;
  /**
   * The mound of roots it grows from, kept apart from the skinned body (the
   * foe moves it into the world, so it still shows while the rest is pulled in).
   */
  readonly mound = new THREE.Group();

  constructor() {
    super();
    const bark = this.skin(0x1e1628, 0.85, true);
    const vine = this.skin(0x2a3a2c, 0.8);
    const pod = this.skin(0x2e1e3a, 0.6);
    const thorn = mat(0xd8c8b8, { rough: 0.5 });
    this.veinMat = this.glowMat(ROOT_VEIN);
    this.throatMat = this.glowMat(ROOT_HOT);
    this.mound.userData.keep = true;
    this.root.add(this.mound);
    const hump = ellipsoid(1.05, 0.4, 1.05, bark, 14);
    hump.position.y = 0.05;
    this.mound.add(hump);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const r = new THREE.Mesh(taperedTube([V(Math.sin(a) * 0.6, 0.25, Math.cos(a) * 0.6), V(Math.sin(a) * 1.2, 0.1, Math.cos(a) * 1.2), V(Math.sin(a + 0.3) * 1.7, -0.05, Math.cos(a + 0.3) * 1.7)], 0.16, 0.03, 8, 5), bark);
      this.mound.add(r);
      const v = ellipsoid(0.03, 0.03, 0.3, this.veinMat, 5);
      v.position.set(Math.sin(a) * 0.85, 0.28, Math.cos(a) * 0.85);
      v.rotation.y = a;
      this.mound.add(v);
      // Thorn tips poking out of the mound: something is in there.
      if (i % 2 === 0) {
        const th = spike(0.06, 0.4, thorn, 4);
        th.position.set(Math.sin(a + 0.4) * 0.45, 0.3, Math.cos(a + 0.4) * 0.45);
        th.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5);
        this.mound.add(th);
      }
    }
    // The stem, thorned all the way up.
    this.stem.position.y = 0.25;
    this.root.add(this.stem);
    this.stem.add(new THREE.Mesh(taperedTube([V(0, 0, 0), V(0.08, 0.6, -0.05), V(-0.04, 1.15, 0.05), V(0, 1.5, 0.08)], 0.3, 0.2, 12, 8, false), vine));
    for (let i = 0; i < 10; i++) {
      const y = 0.15 + i * 0.13;
      const a = i * 2.3;
      const th = spike(0.045, 0.28, thorn, 4);
      th.position.set(Math.sin(a) * 0.24, y, Math.cos(a) * 0.24);
      th.rotation.set(Math.cos(a) * 1.3, 0, -Math.sin(a) * 1.3);
      this.stem.add(th);
    }
    for (let i = 0; i < 3; i++) {
      const v = ellipsoid(0.035, 0.28, 0.035, this.veinMat, 5);
      const a = i * 2.1 + 0.4;
      v.position.set(Math.sin(a) * 0.25, 0.6 + i * 0.25, Math.cos(a) * 0.25);
      this.stem.add(v);
    }
    // The pod: petals of thorny leaf round a hot throat.
    this.head.position.y = 1.85;
    this.root.add(this.head);
    this.head.add(ellipsoid(0.46, 0.44, 0.46, pod, 14));
    this.throat = ellipsoid(0.28, 0.2, 0.28, this.throatMat, 12);
    this.throat.position.set(0, 0.28, 0.1);
    this.throat.userData.keep = true;
    this.head.add(this.throat);
    for (const [x, y] of [[-0.16, 0.08], [0.16, 0.08], [0, 0.2]] as [number, number][]) {
      const e = ellipsoid(0.06, 0.05, 0.03, this.throatMat, 6);
      e.position.set(x, y - 0.05, 0.42);
      this.head.add(e);
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const pg = new THREE.Group();
      pg.position.set(Math.sin(a) * 0.3, 0.18, Math.cos(a) * 0.3);
      pg.rotation.y = a;
      this.head.add(pg);
      pg.add(new THREE.Mesh(taperedTube([V(0, 0, 0), V(0, 0.32, 0.1), V(0, 0.55, 0.02)], 0.17, 0.02, 8, 5), vine));
      for (const k of [0.25, 0.45]) {
        const th = spike(0.035, 0.18, thorn, 4);
        th.position.set(0, k, 0.08);
        th.rotation.x = 1.2;
        pg.add(th);
      }
      this.petals.push(pg);
    }
    // Lashing side tendrils.
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.9;
      const tg = new THREE.Group();
      tg.position.set(Math.sin(a) * 0.5, 0.25, Math.cos(a) * 0.5);
      tg.rotation.y = a;
      this.root.add(tg);
      tg.add(new THREE.Mesh(taperedTube([V(0, 0, 0), V(0, 0.45, 0.3), V(0, 0.75, 0.75), V(0, 0.7, 1.05)], 0.1, 0.02, 10, 5), vine));
      for (const k of [0.3, 0.55, 0.8]) {
        const th = spike(0.03, 0.15, thorn, 4);
        th.position.set(0, 0.2 + k * 0.6, k * 1.0);
        th.rotation.x = -0.4;
        tg.add(th);
      }
      this.tendrils.push(tg);
    }
    this.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    mergeStatic(this.root);
    skinify(this.root);
  }

  update(dt: number, pose: EnemyPose): void {
    this.time += dt;
    const P = this.p;
    const t = this.time;
    let lean = Math.sin(t * 1.3) * 0.05;
    let droop = this.dazed ? 1 : 0;
    let glowK = 0.3 + 0.15 * Math.sin(t * 2.7);
    if (pose.state === 'windup') {
      lean = -0.25 * pose.windup;
      glowK = 0.5 + pose.windup * 1.1;
    } else if (pose.state === 'active') {
      lean = 0.3;
      glowK = 1.4;
    }
    if (pose.state === 'hitstun') lean = -0.3;
    if (pose.dead) droop = 1;
    P.retract = damp(P.retract, this.retract, this.retract > P.retract ? 18 : 9, dt);
    P.open = damp(P.open, Math.max(this.open, this.dazed ? 0.6 : 0), 14, dt);
    P.lean = damp(P.lean, lean, 12, dt);
    P.droop = damp(P.droop, droop, 6, dt);
    const up = 1 - P.retract * 0.9;
    this.stem.scale.set(1 + P.retract * 0.4, up, 1 + P.retract * 0.4);
    this.stem.rotation.x = P.lean + P.droop * 0.35;
    // The head rides the top of the stem.
    const hy = 0.25 + 1.55 * up;
    this.head.position.set(0, hy, Math.sin(this.stem.rotation.x) * 1.55 * up);
    this.head.rotation.x = P.lean * 0.6 + P.droop * 0.9;
    this.head.scale.setScalar(1 - P.retract * 0.25);
    for (const [i, pg] of this.petals.entries()) {
      pg.rotation.x = P.open * 1.25 + Math.sin(t * 3 + i) * 0.05;
    }
    const th = 0.55 + P.open * 0.75 + Math.sin(t * 9) * 0.05 * P.open;
    this.throat.scale.set(0.28 * th, 0.2 * th, 0.28 * th);
    for (const [i, tg] of this.tendrils.entries()) {
      tg.rotation.x = Math.sin(t * 2.2 + i * 2) * 0.25 - P.retract * 1.2;
      tg.rotation.z = Math.cos(t * 1.7 + i) * 0.15;
      tg.scale.setScalar(1 - P.retract * 0.5);
    }
    tint(this.throatMat, ROOT_HOT, 0xffffff, glowK - 0.9 + (this.dazed ? 0.3 + 0.3 * Math.sin(t * 10) : 0));
    tint(this.veinMat, ROOT_VEIN, 0xf0c8ff, glowK - 0.3);
  }
}
