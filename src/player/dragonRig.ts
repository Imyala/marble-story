import * as THREE from 'three';
import { skinify } from '../render/skinify';
import { mat, matUnique, glow } from '../render/materials';
import { ellipsoid, taperedTube, spike, membrane, limb, mergeStatic } from '../render/shapes';
import { addRim } from '../render/materials';
import { clamp01, damp, dampAngle, smoothstep, lerp } from '../core/math';

/**
 * A dragon built entirely from primitives and animated procedurally. The same
 * rig draws the hero, the four Wardens and the shadow dragoness: only the
 * look (colors, proportions, horn and tail styles) changes.
 */

export type HornStyle = 'swept' | 'curled' | 'crown' | 'blade';
export type TailStyle = 'arrow' | 'club' | 'fan' | 'scythe';

export interface DragonLook {
  body: number;
  belly: number;
  horn: number;
  membrane: number;
  eye: number;
  spikes: number;
  scale: number;
  hornStyle: HornStyle;
  tailStyle: TailStyle;
  /** 0 = stocky hatchling, 1 = long and lean. */
  slender: number;
  glowEyes?: boolean;
  beard?: boolean;
}

export const HERO_LOOK: DragonLook = {
  body: 0x8a4fd8,
  belly: 0xf2c65a,
  horn: 0xf5d27a,
  membrane: 0xf2a33a,
  eye: 0x6ee07a,
  spikes: 0xf5d27a,
  scale: 1,
  hornStyle: 'swept',
  tailStyle: 'arrow',
  slender: 0.2,
};

export interface DragonPose {
  speed: number;
  grounded: boolean;
  vy: number;
  glide: boolean;
  /** Set to 0 to start a wing flap; the rig advances it. */
  flapT: number;
  breath: boolean;
  aimPitch: number;
  attack: string | null;
  attackT: number;
  charge: boolean;
  dodge: number;
  hurt: number;
  dead: boolean;
  turn: number;
  talk: boolean;
  hover: boolean;
  sleep?: boolean;
  /** Climbing a wall: the value is the step phase; negative when not climbing. */
  climb?: number;
  hang?: boolean;
  pull?: boolean;
  dive?: boolean;
  skid?: boolean;
  /** Where something interesting is, relative to the body (radians); null when nothing. */
  gaze?: number | null;
  gazePitch?: number;
}

export function defaultPose(): DragonPose {
  return {
    speed: 0, grounded: true, vy: 0, glide: false, flapT: 1, breath: false, aimPitch: 0,
    attack: null, attackT: 0, charge: false, dodge: -1, hurt: 0, dead: false, turn: 0, talk: false, hover: false,
  };
}

interface Leg {
  hip: THREE.Group;
  knee: THREE.Group;
  foot: THREE.Group;
  front: boolean;
  side: number;
  phase: number;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export class DragonRig {
  readonly root = new THREE.Group();
  readonly model = new THREE.Group();
  readonly hips = new THREE.Group();
  readonly neck = new THREE.Group();
  readonly head = new THREE.Group();
  readonly jaw = new THREE.Group();
  /** Where breath comes from. */
  readonly mouth = new THREE.Object3D();
  readonly hornTip = new THREE.Object3D();
  readonly tailTip = new THREE.Object3D();
  private wings: { root: THREE.Group; outer: THREE.Group; side: number }[] = [];
  private legs: Leg[] = [];
  private tail: THREE.Group[] = [];
  private eyes: THREE.Group[] = [];
  private flashMats: THREE.MeshStandardMaterial[] = [];
  readonly look: DragonLook;

  // Animated state.
  private gait = 0;
  private time = Math.random() * 10;
  private blink = 0;
  private nextBlink = 2;
  private p = {
    bodyPitch: 0, bodyRoll: 0, bodyY: 0, bodyYaw: 0,
    neckPitch: -0.75, headPitch: 0.6, headYaw: 0, jaw: 0,
    wingSpread: 0, wingFlap: 0, tailYaw: 0, tailPitch: 0,
    tuck: 0, spin: 0, flip: 0, roll: 0, squash: 0,
  };
  private lastGrounded = true;
  private flapT = 1;
  private climbLegs = -1;

  /** `skinned` draws the rig as a few GPU-skinned meshes; off for rigs posed once and baked into statues. */
  constructor(look: DragonLook = HERO_LOOK, skinned = true) {
    this.look = look;
    this.build();
    this.root.add(this.model);
    this.model.scale.setScalar(look.scale);
    mergeStatic(this.model);
    if (skinned) skinify(this.model);
    for (const m of this.flashMats) addRim(m, 0xfff0e0, 0.3);
  }

  private bodyMat(color: number): THREE.MeshStandardMaterial {
    const m = matUnique(color, { rough: 0.6 });
    this.flashMats.push(m);
    return m;
  }

  private build(): void {
    const L = this.look;
    const lean = L.slender;
    const bodyM = this.bodyMat(L.body);
    const bellyM = this.bodyMat(L.belly);
    const hornM = mat(L.horn, { rough: 0.4, metal: 0.2 });
    const spikeM = mat(L.spikes, { rough: 0.45, metal: 0.15 });
    const memM = matUnique(L.membrane, { rough: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
    const clawM = mat(0xf4ecd8, { rough: 0.5 });

    this.model.add(this.hips);
    this.hips.position.set(0, 0.6, 0);

    // Torso and belly plates.
    const torsoLen = 0.62 + lean * 0.18;
    const torso = ellipsoid(0.36 - lean * 0.06, 0.34 - lean * 0.04, torsoLen, bodyM, 20);
    this.hips.add(torso);
    const chest = ellipsoid(0.33 - lean * 0.05, 0.33, 0.34, bodyM, 16);
    chest.position.set(0, 0.06, torsoLen * 0.55);
    this.hips.add(chest);
    const belly = ellipsoid(0.27 - lean * 0.05, 0.22, torsoLen * 0.92, bellyM, 16);
    belly.position.set(0, -0.12, 0.04);
    this.hips.add(belly);
    for (let i = 0; i < 5; i++) {
      const band = ellipsoid(0.25 - lean * 0.04, 0.05, 0.1, bellyM, 10);
      band.position.set(0, -0.26 + Math.abs(i - 2) * 0.012, -0.34 + i * 0.17);
      this.hips.add(band);
    }
    // Spine spikes.
    for (let i = 0; i < 5; i++) {
      const s = spike(0.05, 0.14 - Math.abs(i - 1.5) * 0.015, spikeM, 5);
      s.position.set(0, 0.32 - Math.abs(i - 1) * 0.02, 0.35 - i * 0.2);
      s.rotation.x = -0.5;
      this.hips.add(s);
    }

    // Neck.
    this.neck.position.set(0, 0.14, torsoLen * 0.72);
    this.hips.add(this.neck);
    const neckLen = 0.42 + lean * 0.25;
    this.neck.add(limb(V(0, 0, -0.05), V(0, 0, neckLen), 0.2, 0.15, bodyM, 12));
    const neckBelly = limb(V(0, -0.1, 0), V(0, -0.08, neckLen * 0.95), 0.12, 0.09, bellyM, 10);
    this.neck.add(neckBelly);
    for (let i = 0; i < 3; i++) {
      const s = spike(0.04, 0.1, spikeM, 5);
      s.position.set(0, 0.15 - i * 0.012, 0.05 + i * neckLen * 0.3);
      s.rotation.x = -0.9;
      this.neck.add(s);
    }

    // Head.
    this.head.position.set(0, 0, neckLen);
    this.neck.add(this.head);
    const skull = ellipsoid(0.24, 0.22, 0.27, bodyM, 18);
    skull.position.set(0, 0.06, 0.05);
    this.head.add(skull);
    const snout = ellipsoid(0.17, 0.13, 0.25 + lean * 0.05, bodyM, 16);
    snout.position.set(0, 0.0, 0.3);
    this.head.add(snout);
    const nose = ellipsoid(0.12, 0.08, 0.1, bodyM, 12);
    nose.position.set(0, 0.04, 0.5 + lean * 0.05);
    this.head.add(nose);
    for (const sx of [-1, 1]) {
      const nostril = ellipsoid(0.02, 0.015, 0.02, mat(0x2a1640), 6);
      nostril.position.set(sx * 0.05, 0.08, 0.58 + lean * 0.05);
      this.head.add(nostril);
      const brow = ellipsoid(0.08, 0.04, 0.12, bodyM, 10);
      brow.position.set(sx * 0.12, 0.2, 0.2);
      brow.rotation.z = sx * 0.3;
      this.head.add(brow);
      const cheek = spike(0.035, 0.14, spikeM, 5);
      cheek.position.set(sx * 0.2, -0.02, -0.05);
      cheek.rotation.set(-1.9, 0, sx * -0.7);
      this.head.add(cheek);
    }
    // Jaw.
    this.jaw.position.set(0, -0.08, 0.08);
    this.head.add(this.jaw);
    const jawM = ellipsoid(0.14, 0.055, 0.22, bellyM, 12);
    jawM.position.set(0, -0.01, 0.15);
    this.jaw.add(jawM);
    const tongue = ellipsoid(0.07, 0.02, 0.13, mat(0xd8506a), 8);
    tongue.position.set(0, 0.03, 0.15);
    this.jaw.add(tongue);
    this.mouth.position.set(0, -0.02, 0.62);
    this.head.add(this.mouth);

    // Eyes.
    const eyeWhite = mat(0xffffff, { rough: 0.2 });
    const iris = L.glowEyes ? glow(L.eye) : mat(L.eye, { rough: 0.2, emissive: L.eye, emissiveIntensity: 0.25 });
    const pupil = mat(0x10081a, { rough: 0.1 });
    for (const sx of [-1, 1]) {
      const eye = new THREE.Group();
      eye.position.set(sx * 0.13, 0.13, 0.22);
      eye.rotation.y = sx * 0.55;
      const w = ellipsoid(0.085, 0.095, 0.06, eyeWhite, 12);
      eye.add(w);
      const ir = ellipsoid(0.055, 0.07, 0.03, iris, 10);
      ir.position.set(0, 0, 0.045);
      eye.add(ir);
      const pu = ellipsoid(0.022, 0.05, 0.02, pupil, 8);
      pu.position.set(0, 0, 0.062);
      eye.add(pu);
      const hl = ellipsoid(0.014, 0.014, 0.01, glow(0xffffff), 6);
      hl.position.set(0.02, 0.03, 0.072);
      eye.add(hl);
      this.head.add(eye);
      this.eyes.push(eye);
    }

    // Horns.
    this.buildHorns(hornM);
    this.hornTip.position.set(0, 0.3, 0.1);
    this.head.add(this.hornTip);
    for (let i = 0; i < 3; i++) {
      const s = spike(0.03, 0.09, spikeM, 5);
      s.position.set(0, 0.24 - i * 0.02, -0.05 - i * 0.09);
      s.rotation.x = -1.1;
      this.head.add(s);
    }
    if (L.beard) {
      for (let i = 0; i < 4; i++) {
        const b = spike(0.04, 0.22 - i * 0.03, mat(0xe8e0d0), 5);
        b.position.set((i - 1.5) * 0.06, -0.12, 0.1 - Math.abs(i - 1.5) * 0.03);
        b.rotation.x = Math.PI * 0.85;
        this.jaw.add(b);
      }
    }

    // Wings.
    for (const side of [1, -1]) {
      const root = new THREE.Group();
      root.position.set(side * 0.2, 0.26, torsoLen * 0.35);
      root.scale.x = side;
      const outer = new THREE.Group();
      const span = 0.55 + lean * 0.15;
      root.add(limb(V(0, 0, 0), V(span, 0.04, 0.02), 0.045, 0.035, bodyM, 6));
      const inner = membrane([[0, 0.02], [span, 0.02], [span * 0.95, -0.34], [span * 0.55, -0.42], [span * 0.2, -0.55], [0, -0.5]], memM);
      root.add(inner);
      outer.position.set(span, 0.04, 0.02);
      root.add(outer);
      outer.add(limb(V(0, 0, 0), V(0.62 + lean * 0.2, 0.08, 0.1), 0.035, 0.018, bodyM, 6));
      const o = 0.62 + lean * 0.2;
      const outerMem = membrane([[0, 0], [o, 0.1], [o * 0.82, -0.12], [o * 0.62, -0.2], [o * 0.45, -0.3], [o * 0.22, -0.36], [0, -0.36]], memM);
      outer.add(outerMem);
      const claw = spike(0.025, 0.1, clawM, 5);
      claw.position.set(0, 0.03, 0.02);
      claw.rotation.z = -0.4;
      outer.add(claw);
      this.hips.add(root);
      this.wings.push({ root, outer, side });
    }

    // Legs.
    const legDefs: [number, number, number, boolean][] = [
      [0.21, 0.02, torsoLen * 0.62, true],
      [-0.21, 0.02, torsoLen * 0.62, true],
      [0.23, 0.02, -torsoLen * 0.58, false],
      [-0.23, 0.02, -torsoLen * 0.58, false],
    ];
    for (const [x, y, z, front] of legDefs) {
      const hip = new THREE.Group();
      hip.position.set(x, y, z);
      this.hips.add(hip);
      const thigh = ellipsoid(front ? 0.1 : 0.15, front ? 0.13 : 0.18, front ? 0.11 : 0.17, bodyM, 12);
      thigh.position.set(0, -0.05, 0);
      hip.add(thigh);
      const upperLen = 0.28;
      hip.add(limb(V(0, 0, 0), V(0, -upperLen, front ? 0.02 : -0.04), 0.11, 0.085, bodyM, 8));
      const knee = new THREE.Group();
      knee.position.set(0, -upperLen, front ? 0.02 : -0.04);
      hip.add(knee);
      const lowerLen = 0.27;
      knee.add(limb(V(0, 0, 0), V(0, -lowerLen, front ? 0.03 : 0.06), 0.085, 0.07, bodyM, 8));
      const foot = new THREE.Group();
      foot.position.set(0, -lowerLen, front ? 0.03 : 0.06);
      knee.add(foot);
      const paw = ellipsoid(0.1, 0.055, 0.13, bodyM, 10);
      paw.position.set(0, 0.02, 0.04);
      foot.add(paw);
      for (let c = -1; c <= 1; c++) {
        const cl = spike(0.022, 0.08, clawM, 4);
        cl.position.set(c * 0.05, 0.01, 0.13);
        cl.rotation.x = Math.PI / 2;
        foot.add(cl);
      }
      const side = x > 0 ? 1 : -1;
      // Trot: diagonal pairs share a phase.
      const phase = (front ? 0 : Math.PI) + (side > 0 ? 0 : Math.PI);
      this.legs.push({ hip, knee, foot, front, side, phase });
    }

    // Tail.
    const segs = 9;
    let parent: THREE.Object3D = this.hips;
    const segLen = 0.17 + lean * 0.04;
    for (let i = 0; i < segs; i++) {
      const g = new THREE.Group();
      g.position.set(0, i === 0 ? 0.05 : 0, i === 0 ? -torsoLen * 0.9 : -segLen);
      const r0 = lerp(0.16, 0.04, i / segs);
      const r1 = lerp(0.16, 0.04, (i + 1) / segs);
      g.add(limb(V(0, 0, 0.02), V(0, 0, -segLen - 0.02), r0, r1, bodyM, 8));
      if (i % 2 === 0 && i < segs - 1) {
        const s = spike(0.03, 0.08 - i * 0.005, spikeM, 5);
        s.position.set(0, r0 * 0.9, -segLen * 0.5);
        s.rotation.x = -1.0;
        g.add(s);
      }
      parent.add(g);
      this.tail.push(g);
      parent = g;
    }
    const tip = new THREE.Group();
    tip.position.set(0, 0, -segLen);
    parent.add(tip);
    this.buildTailTip(tip, hornM);
    this.tailTip.position.set(0, 0, -0.3);
    tip.add(this.tailTip);
  }

  private buildHorns(hornM: THREE.Material): void {
    const style = this.look.hornStyle;
    for (const sx of [-1, 1]) {
      let pts: THREE.Vector3[];
      let r0 = 0.055;
      switch (style) {
        case 'curled':
          pts = [V(0, 0, 0), V(sx * 0.1, 0.1, -0.12), V(sx * 0.2, 0.02, -0.25), V(sx * 0.18, -0.12, -0.2), V(sx * 0.12, -0.1, -0.08)];
          r0 = 0.07;
          break;
        case 'crown':
          pts = [V(0, 0, 0), V(sx * 0.05, 0.18, -0.04), V(sx * 0.1, 0.36, -0.1)];
          break;
        case 'blade':
          pts = [V(0, 0, 0), V(sx * 0.06, 0.08, -0.2), V(sx * 0.1, 0.1, -0.46)];
          r0 = 0.045;
          break;
        default:
          pts = [V(0, 0, 0), V(sx * 0.06, 0.12, -0.14), V(sx * 0.1, 0.18, -0.36)];
      }
      const h = new THREE.Mesh(taperedTube(pts, r0, 0.005, 10, 7), hornM);
      h.position.set(sx * 0.12, 0.2, -0.02);
      h.castShadow = true;
      this.head.add(h);
      if (style === 'crown') {
        for (let k = 0; k < 2; k++) {
          const s = new THREE.Mesh(taperedTube([V(0, 0, 0), V(sx * 0.1, 0.1, -0.1), V(sx * 0.18, 0.14, -0.26)], 0.035, 0.004, 8, 6), hornM);
          s.position.set(sx * 0.17, 0.12 - k * 0.08, -0.05);
          this.head.add(s);
        }
      }
    }
  }

  private buildTailTip(tip: THREE.Group, hornM: THREE.Material): void {
    const style = this.look.tailStyle;
    if (style === 'club') {
      const c = ellipsoid(0.13, 0.11, 0.16, hornM, 10);
      c.position.z = -0.12;
      tip.add(c);
      for (const [x, y] of [[0.1, 0], [-0.1, 0], [0, 0.1], [0, -0.1]] as const) {
        const s = spike(0.04, 0.1, hornM, 5);
        s.position.set(x, y, -0.12);
        s.lookAt(x * 10, y * 10, -0.12);
        s.rotateX(Math.PI / 2);
        tip.add(s);
      }
      return;
    }
    const outline: [number, number][] =
      style === 'fan' ? [[0, 0.05], [0.2, -0.1], [0.24, -0.3], [0, -0.22], [-0.24, -0.3], [-0.2, -0.1]]
        : style === 'scythe' ? [[0.02, 0.05], [0.1, -0.1], [0.3, -0.34], [0.05, -0.22], [-0.08, -0.3], [-0.06, -0.05]]
          : [[0, 0.06], [0.16, -0.12], [0.04, -0.1], [0, -0.34], [-0.04, -0.1], [-0.16, -0.12]];
    const blade = membrane(outline, matUnique(this.look.horn, { rough: 0.35, metal: 0.25, side: THREE.DoubleSide }));
    // Membrane lies in XZ; stand it upright along the tail.
    blade.rotation.set(0, 0, Math.PI / 2);
    tip.add(blade);
  }

  /** Brief white flash on the body (hurt feedback). */
  setFlash(amount: number, color = 0xffffff): void {
    for (const m of this.flashMats) {
      m.emissive.setHex(color);
      m.emissiveIntensity = amount;
    }
  }

  setOpacity(o: number): void {
    for (const m of this.flashMats) {
      m.transparent = o < 1;
      m.opacity = o;
    }
  }

  update(dt: number, pose: DragonPose): void {
    this.time += dt;
    const t = this.time;
    const P = this.p;

    // Blink.
    this.nextBlink -= dt;
    if (this.nextBlink <= 0) {
      this.blink = 0.14;
      this.nextBlink = 2 + Math.random() * 3;
    }
    this.blink = Math.max(0, this.blink - dt);
    const eyeY = pose.dead || pose.sleep ? 0.12 : this.blink > 0 ? 0.15 : 1;
    for (const e of this.eyes) e.scale.y = damp(e.scale.y, eyeY, 40, dt);

    // Wing flap trigger.
    if (pose.flapT === 0) this.flapT = 0;
    this.flapT = Math.min(1, this.flapT + dt * 2.8);

    // --- locomotion targets ---
    const sp = clamp01(pose.speed);
    const air = !pose.grounded;
    this.gait += dt * (pose.charge ? 17 : 5 + sp * 9) * (air ? 0 : 1);
    const g = this.gait;

    let bodyPitch = air ? clampRange(-pose.vy * 0.03, -0.35, 0.4) : Math.sin(g * 2) * 0.03 * sp;
    let bodyRoll = clampRange(-pose.turn * 0.08, -0.5, 0.5);
    let bodyY = air ? 0 : Math.abs(Math.sin(g)) * 0.06 * sp + Math.sin(t * 2) * 0.012 * (1 - sp);
    let bodyYaw = 0;
    let neckPitch = -0.75 + sp * 0.28 + Math.sin(t * 2) * 0.02;
    let headPitch = 0.62 - sp * 0.2;
    let headYaw = Math.sin(t * 0.37) * 0.15 * (1 - sp);
    // Glance at foes and treasures nearby, the head leading and the neck following.
    if (pose.gaze != null && !pose.attack && !pose.breath && !pose.dead && !pose.sleep) {
      headYaw = clampRange(pose.gaze, -1.1, 1.1) * (1 - sp * 0.35);
      headPitch -= clampRange(pose.gazePitch ?? 0, -0.3, 0.35);
    }
    let jaw = 0;
    let wingSpread = air ? 0.55 : 0;
    let wingFlap = air ? Math.sin(t * 5) * 0.15 : 0;
    let tailYaw = clampRange(-pose.turn * 0.12, -0.5, 0.5);
    let tailPitch = air ? 0.15 : -0.05;
    let tuck = air ? 0.6 : 0;
    let spin = 0;
    let flip = 0;
    let roll = 0;
    let rate = 14;

    if (pose.glide) {
      wingSpread = 1;
      wingFlap = Math.sin(t * 2) * 0.06;
      bodyPitch = 0.12;
      neckPitch = -0.35;
      headPitch = 0.3;
      tuck = 0.9;
      bodyRoll = clampRange(-pose.turn * 0.25, -0.7, 0.7);
    }
    if (pose.hover) {
      wingSpread = 1;
      wingFlap = Math.sin(t * 16) * 0.55;
      tuck = 0.5;
    }
    if (this.flapT < 1) {
      const f = this.flapT;
      wingSpread = 1;
      wingFlap = Math.sin(f * Math.PI * 2) * 0.9;
      tuck = 0.8;
    }
    if (pose.charge) {
      neckPitch = -0.25;
      headPitch = 0.55;
      bodyPitch = 0.12;
      wingSpread = 0.35;
      wingFlap = -0.2;
      tailPitch = 0.1;
    }
    if (pose.breath) {
      neckPitch = -0.35 - pose.aimPitch * 0.5;
      headPitch = 0.25 - pose.aimPitch * 0.5;
      jaw = 0.55 + Math.sin(t * 30) * 0.05;
      bodyPitch -= 0.05;
      rate = 20;
    }
    if (pose.talk) {
      jaw = Math.max(jaw, (Math.sin(t * 16) * 0.5 + 0.5) * 0.25);
      headPitch += Math.sin(t * 5) * 0.06;
    }
    if (pose.dive) {
      bodyPitch = 0.55;
      neckPitch = -0.05;
      headPitch = 0.1;
      wingSpread = 0.55;
      wingFlap = -0.25;
      tuck = 1;
    }
    if (pose.skid) {
      bodyPitch = -0.28;
      neckPitch = -0.95;
      tailPitch = -0.2;
      rate = 20;
    }
    if (pose.climb !== undefined && pose.climb >= 0) {
      const c = pose.climb;
      bodyPitch = -1.25;
      neckPitch = -0.2;
      headPitch = 1.1;
      wingSpread = 0.15;
      tuck = 0;
      tailPitch = 0.6;
      bodyY = Math.sin(c * 2) * 0.04;
      rate = 16;
      this.climbLegs = c;
    } else this.climbLegs = -1;
    if (pose.hang) {
      bodyPitch = -1.05;
      neckPitch = -0.5;
      headPitch = 0.9;
      wingSpread = 0.7;
      wingFlap = Math.sin(t * 9) * 0.25;
      tuck = 0.2;
      rate = 25;
    }
    if (pose.pull) {
      bodyPitch = -0.3;
      neckPitch = -0.25;
      headPitch = 0.7;
      wingSpread = 0.9;
      wingFlap = Math.sin(t * 20) * 0.5;
      tuck = 0.8;
      rate = 25;
    }
    if (pose.dodge >= 0) {
      const d = pose.dodge;
      roll = d * Math.PI * 2;
      tuck = 1;
      wingSpread = 0.2;
      rate = 40;
    }

    // --- attacks ---
    if (pose.attack) {
      rate = 30;
      const a = pose.attackT;
      switch (pose.attack) {
        case 'horn1': {
          const k = bump(a, 0.15, 0.45, 0.9);
          neckPitch = lerp(-0.6, -0.1, k);
          headPitch = lerp(0.5, 1.0, k);
          bodyPitch = 0.12 * k;
          break;
        }
        case 'horn2': {
          const k = smoothstep(0.1, 0.55, a);
          headYaw = lerp(0.8, -0.8, k);
          bodyYaw = lerp(0.35, -0.35, k);
          neckPitch = -0.3;
          headPitch = 0.8;
          break;
        }
        case 'horn3': {
          const k = bump(a, 0.1, 0.4, 0.95);
          neckPitch = lerp(-0.5, 0.05, k);
          headPitch = lerp(0.4, 1.1, k);
          bodyPitch = lerp(-0.15, 0.3, k);
          tailPitch = 0.4 * k;
          break;
        }
        case 'horn4': {
          spin = smoothstep(0.05, 0.7, a) * Math.PI * 2;
          neckPitch = -0.1;
          headPitch = 1.0;
          tuck = 0.3;
          break;
        }
        case 'counter': {
          spin = smoothstep(0.0, 0.5, a) * Math.PI * 2;
          const k = bump(a, 0.3, 0.55, 1);
          neckPitch = lerp(-0.4, 0.1, k);
          headPitch = lerp(0.5, 1.1, k);
          wingSpread = 0.8;
          break;
        }
        case 'uppercut': {
          const down = 1 - smoothstep(0.0, 0.3, a);
          const up = smoothstep(0.25, 0.6, a);
          neckPitch = lerp(0.1 * down, -1.25, up);
          headPitch = lerp(1.1, -0.3, up);
          bodyPitch = lerp(0.25, -0.45, up);
          wingSpread = up * 0.7;
          tailPitch = -0.3 * up;
          break;
        }
        case 'tail1':
        case 'tail2': {
          const dir = pose.attack === 'tail1' ? 1 : -1;
          spin = dir * easeInOut(smoothstep(0.05, 0.75, a)) * Math.PI * 2;
          tailPitch = 0.25;
          tailYaw = -dir * 0.6;
          neckPitch = -0.5;
          bodyPitch = 0.05;
          break;
        }
        case 'tail3': {
          // Overhead tail smash: rear up, then slam.
          const up = smoothstep(0.0, 0.35, a) * (1 - smoothstep(0.4, 0.55, a));
          bodyPitch = lerp(0.35, -0.5, up);
          tailPitch = lerp(-1.4, 0.9, up);
          neckPitch = lerp(-0.2, -0.9, up);
          break;
        }
        case 'tailSpin': {
          spin = a * Math.PI * 2 * 3;
          tailPitch = 0.3;
          tuck = 0.3;
          wingSpread = 0.5;
          break;
        }
        case 'air1':
        case 'air2': {
          const dir = pose.attack === 'air1' ? 1 : -1;
          const k = smoothstep(0.1, 0.55, a);
          headYaw = dir * lerp(0.8, -0.8, k);
          bodyYaw = dir * lerp(0.4, -0.4, k);
          neckPitch = -0.35;
          headPitch = 0.8;
          wingSpread = 0.9;
          wingFlap = Math.sin(a * 12) * 0.4;
          break;
        }
        case 'air3': {
          flip = easeInOut(smoothstep(0.05, 0.8, a)) * Math.PI * 2;
          tuck = 1;
          wingSpread = 0.3;
          break;
        }
        case 'slamFall': {
          flip = this.p.flip + dt * 16;
          tuck = 1;
          wingSpread = 0;
          neckPitch = 0.2;
          headPitch = 1.2;
          break;
        }
        case 'slamLand': {
          const k = 1 - a;
          wingSpread = 1;
          wingFlap = -0.4 * k;
          bodyPitch = 0.2 * k;
          neckPitch = -0.2;
          headPitch = 1.0;
          break;
        }
        case 'burst': {
          const rear = smoothstep(0, 0.35, a) * (1 - smoothstep(0.35, 0.5, a));
          const thrust = smoothstep(0.35, 0.5, a) * (1 - smoothstep(0.8, 1, a));
          neckPitch = -0.9 * rear - 0.2 * thrust - pose.aimPitch * 0.4;
          headPitch = -0.3 * rear + 0.2 * thrust - pose.aimPitch * 0.4;
          jaw = 0.8 * thrust + 0.3 * rear;
          bodyPitch = -0.25 * rear + 0.1 * thrust;
          wingSpread = 0.6;
          break;
        }
        case 'fury': {
          neckPitch = -1.3;
          headPitch = -0.4;
          jaw = 0.9;
          wingSpread = 1;
          wingFlap = Math.sin(a * 30) * 0.3;
          bodyPitch = -0.5;
          tuck = 0.8;
          break;
        }
        case 'roar': {
          neckPitch = -1.0;
          headPitch = -0.2;
          jaw = 0.8;
          wingSpread = 0.9;
          bodyPitch = -0.2;
          break;
        }
      }
    }

    if (pose.hurt > 0) {
      const k = pose.hurt;
      neckPitch -= 0.4 * k;
      headPitch -= 0.4 * k;
      bodyPitch -= 0.15 * k;
      rate = 25;
    }
    if (pose.dead) {
      roll = 1.45;
      bodyY = -0.3;
      neckPitch = 0.1;
      headPitch = 0.1;
      wingSpread = 0.3;
      tuck = 0.2;
      rate = 6;
    }
    if (pose.sleep) {
      neckPitch = 0.3;
      headPitch = 0.1;
      bodyY = -0.35;
      tuck = 0;
      rate = 4;
    }

    // Landing squash.
    if (pose.grounded && !this.lastGrounded) P.squash = Math.min(0.35, 0.12 + Math.max(0, -pose.vy) * 0.015);
    this.lastGrounded = pose.grounded;
    P.squash = damp(P.squash, 0, 10, dt);

    // --- damp toward targets ---
    P.bodyPitch = damp(P.bodyPitch, bodyPitch, rate, dt);
    P.bodyRoll = damp(P.bodyRoll, bodyRoll, 8, dt);
    P.bodyY = damp(P.bodyY, bodyY, 18, dt);
    P.bodyYaw = damp(P.bodyYaw, bodyYaw, rate, dt);
    P.neckPitch = damp(P.neckPitch, neckPitch, rate, dt);
    P.headPitch = damp(P.headPitch, headPitch, rate, dt);
    P.headYaw = dampAngle(P.headYaw, headYaw, rate, dt);
    P.jaw = damp(P.jaw, jaw, 25, dt);
    P.wingSpread = damp(P.wingSpread, wingSpread, 12, dt);
    P.wingFlap = damp(P.wingFlap, wingFlap, 22, dt);
    P.tailYaw = damp(P.tailYaw, tailYaw, 8, dt);
    P.tailPitch = damp(P.tailPitch, tailPitch, 8, dt);
    P.tuck = damp(P.tuck, tuck, 14, dt);
    // Spins and flips are driven directly so they complete exactly.
    P.spin = spin;
    P.flip = pose.attack === 'slamFall' ? flip : flip;
    P.roll = pose.dead ? damp(P.roll, roll, 6, dt) : roll;

    // --- apply ---
    this.model.rotation.set(0, 0, 0);
    this.model.position.set(0, 0, 0);
    // Spin (yaw), flip (pitch) and roll are about the body center.
    const cy = 0.7 * this.look.scale;
    this.model.position.y = P.bodyY + (P.flip !== 0 || P.roll !== 0 ? 0 : 0);
    this.model.rotation.order = 'YXZ';
    this.model.rotation.y = P.spin;
    this.model.rotation.x = P.flip;
    this.model.rotation.z = P.roll;
    if (P.flip !== 0 || P.roll !== 0) {
      // Rotate about the body center rather than the feet.
      const off = new THREE.Vector3(0, cy, 0).applyEuler(this.model.rotation);
      this.model.position.set(-off.x, P.bodyY + cy - off.y, -off.z);
    }
    const sq = P.squash;
    const s = this.look.scale;
    this.model.scale.set(s * (1 + sq * 0.5), s * (1 - sq), s * (1 + sq * 0.5));

    this.hips.rotation.set(P.bodyPitch, P.bodyYaw, P.bodyRoll);
    this.neck.rotation.set(P.neckPitch, P.headYaw * 0.4, 0);
    this.head.rotation.set(P.headPitch - P.neckPitch * 0.15, P.headYaw * 0.6, 0);
    this.jaw.rotation.x = P.jaw;

    // Wings: folded along the back at spread 0, fully out at 1.
    for (const w of this.wings) {
      const spread = P.wingSpread;
      // The root is mirrored with scale.x, so its yaw and roll take the side's
      // sign to make both wings mirror images of each other.
      w.root.rotation.order = 'YZX';
      // Folded: the arm lies back along the flank and the outer half tucks
      // back over it, like a closed fan.
      w.root.rotation.y = w.side * lerp(1.42, 0.12, spread);
      w.root.rotation.z = w.side * (lerp(0.42, 0.08, spread) + P.wingFlap);
      w.root.rotation.x = 0;
      w.root.scale.z = lerp(0.6, 1, spread);
      w.outer.rotation.set(0, lerp(-2.55, 0.0, spread), lerp(0.15, P.wingFlap * 0.6, spread));
    }

    // Legs.
    for (const leg of this.legs) {
      const ph = g + leg.phase;
      let swing = Math.sin(ph) * 0.65 * sp * (pose.charge ? 1.3 : 1);
      let knee = Math.max(0, Math.cos(ph)) * 0.9 * sp;
      if (!pose.grounded || P.tuck > 0.05) {
        const tk = P.tuck;
        swing = lerp(swing, leg.front ? -0.7 : 0.9, tk);
        knee = lerp(knee, leg.front ? 1.4 : -1.1, tk);
      }
      if (this.climbLegs >= 0) {
        // Alternate reaching claws up the wall.
        const ph = this.climbLegs + leg.phase;
        swing = (leg.front ? -1.2 : -0.2) + Math.sin(ph) * 0.45;
        knee = 0.6 + Math.cos(ph) * 0.3;
      }
      // Keep feet planted when the body pitches.
      leg.hip.rotation.set(swing - P.bodyPitch, 0, leg.side * 0.05);
      leg.knee.rotation.set(leg.front ? knee : -knee * 0.6 + (pose.grounded ? 0 : 0), 0, 0);
      leg.foot.rotation.set(-(swing - P.bodyPitch) - (leg.front ? knee : -knee * 0.6), 0, 0);
    }

    // Tail: a travelling wave, stiffer when running.
    const n = this.tail.length;
    const amp = pose.glide ? 0.05 : 0.12 * (1 - sp * 0.6);
    for (let i = 0; i < n; i++) {
      const seg = this.tail[i]!;
      const f = i / n;
      seg.rotation.y = Math.sin(t * 2.2 - i * 0.55) * amp + P.tailYaw * (0.5 + f * 0.5) / n * 3;
      seg.rotation.x = P.tailPitch / n * 2 + (i === 0 ? 0.1 : 0) - (pose.grounded ? f * 0.02 : 0);
    }
  }
}

function clampRange(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** 0 -> 1 -> 0 over [a, b, c]. */
function bump(t: number, a: number, b: number, c: number): number {
  if (t <= a || t >= c) return 0;
  if (t < b) return smoothstep(a, b, t);
  return 1 - smoothstep(b, c, t);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
