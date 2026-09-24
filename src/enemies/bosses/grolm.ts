import * as THREE from 'three';
import { Boss } from '../boss';
import type { Enemy, EnemyDef, AttackDef } from '../enemy';
import type { EnemyModel, EnemyPose } from '../models';
import type { Game } from '../../game/game';
import type { Hit, HitResult } from '../../game/types';
import { makeHit } from '../../game/types';
import { matUnique, mat, glow } from '../../render/materials';
import { spike } from '../../render/shapes';
import { damp, smoothstep, yawOf, approachAngle, angleDiff, clamp } from '../../core/math';
import { rng } from '../../core/rng';

/**
 * Forgemaster Grolm: the Frostworks' overseer, a walking forge of ice and
 * iron with a furnace for a heart. Three phases:
 *   1  hammer slams (jump the shockwave; the hammer sticks and the furnace
 *      opens), low sweeps (jump them), stomps and slag lobs
 *   2  vents coolant into freezing floor patches and calls rime golems
 *   3  armors itself in a rime shell that only fire can melt; melting it
 *      staggers him with the furnace wide open
 */

// Shoulder of the hammer arm in model space, and the lever from it to the
// hammer's striking face. The slam telegraph uses the same numbers.
const SHOULDER_X = -2.45;
const SHOULDER_Y = 5.2;
const REACH = 7.0;
const SLAM_PITCH = -0.72;
const SLAM_YAW = 0.32;
const SWEEP_YAW = 1.9;
const SWEEP_PITCH = -0.95;

class GrolmModel implements EnemyModel {
  readonly root = new THREE.Group();
  private legs: THREE.Group[] = [];
  private body = new THREE.Group();
  private torso = new THREE.Group();
  private head = new THREE.Group();
  private armR = new THREE.Group();
  private armL = new THREE.Group();
  private hammer = new THREE.Group();
  private doors: THREE.Group[] = [];
  private core: THREE.Mesh;
  private coreMat: THREE.MeshBasicMaterial;
  private halo: THREE.Mesh;
  private haloMat: THREE.MeshBasicMaterial;
  private runeMat: THREE.MeshBasicMaterial;
  private eyeMat: THREE.MeshBasicMaterial;
  private shellMat: THREE.MeshStandardMaterial;
  private shellParts: THREE.Mesh[] = [];
  private mats: THREE.MeshStandardMaterial[] = [];
  readonly chimneys: THREE.Object3D[] = [];
  readonly coreAnchor = new THREE.Object3D();
  private t = 0;
  private walk = 0;
  private p = {
    pitchR: -0.35, yawR: 0, wrist: -0.85, pitchL: -0.2, yawL: 0, lean: 0, twist: 0, crouch: 0, doors: 0, legR: 0, legL: 0, head: 0, sink: 0,
  };
  /** Driven by the boss each frame. */
  stuck = false;
  exposed = false;
  shell = 0;

  constructor() {
    const ice = matUnique(0xa8d8f0, { rough: 0.25, metal: 0.05, flat: true });
    const iceDark = matUnique(0x6fa6c8, { rough: 0.3, flat: true });
    const iron = matUnique(0x3c3f48, { rough: 0.55, metal: 0.45, flat: true });
    const ironDark = matUnique(0x25272e, { rough: 0.6, metal: 0.4, flat: true });
    const brass = matUnique(0x9a7a44, { rough: 0.45, metal: 0.5 });
    this.mats.push(ice, iceDark, iron, ironDark, brass);
    const rivet = mat(0x8a8a90, { rough: 0.4, metal: 0.6 });
    this.runeMat = glow(0xff8a2a);
    this.eyeMat = glow(0xffb040);
    this.shellMat = matUnique(0xdff6ff, { rough: 0.08, metal: 0.1, transparent: true, opacity: 0.55, emissive: 0x6ac8ff, emissiveIntensity: 0.35, flat: true });
    this.shellMat.depthWrite = false;

    // --- legs -----------------------------------------------------------------------
    for (const sx of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(sx * 1.25, 2.7, 0);
      this.root.add(leg);
      const thigh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 0), ice);
      thigh.scale.set(1, 1.25, 1);
      thigh.position.y = -0.65;
      leg.add(thigh);
      const knee = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.14, 6, 14), iron);
      knee.rotation.x = Math.PI / 2;
      knee.position.y = -1.35;
      leg.add(knee);
      const shin = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 0), iceDark);
      shin.scale.set(1, 1.15, 1.05);
      shin.position.y = -1.8;
      leg.add(shin);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 2.1), iron);
      foot.position.set(0, -2.35, 0.3);
      leg.add(foot);
      for (let i = -1; i <= 1; i++) {
        const toe = spike(0.18, 0.5, iceDark, 5);
        toe.rotation.x = Math.PI / 2;
        toe.position.set(i * 0.45, -2.45, 1.3);
        leg.add(toe);
      }
      this.legs.push(leg);
      this.addShell(leg, 0, -1.2, 0, 1.0, 1.5, 1.0);
    }

    // --- body -----------------------------------------------------------------------
    this.body.position.y = 2.7;
    this.root.add(this.body);
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 1.7), iron);
    pelvis.position.y = 0.2;
    this.body.add(pelvis);
    this.torso.position.y = 1.9;
    this.body.add(this.torso);
    const chest = new THREE.Mesh(new THREE.DodecahedronGeometry(1.95, 0), ice);
    chest.scale.set(1.25, 1.05, 0.95);
    this.torso.add(chest);
    // Frost chunks grown over the chest.
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.45 + (i % 3) * 0.12, 0), iceDark);
      c.position.set(Math.sin(a) * 2.1, 0.8 + Math.cos(i * 2.3) * 0.5, Math.cos(a) * 1.5 - 0.3);
      c.scale.y = 1.6;
      c.rotation.set(Math.cos(a) * 0.5, a, Math.sin(a) * 0.4);
      this.torso.add(c);
    }
    // Iron bands and rivets.
    for (const by of [-0.95, 0.85]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.16, 6, 22), iron);
      band.rotation.x = Math.PI / 2;
      band.scale.set(1.1, 0.86, 1);
      band.position.y = by;
      this.torso.add(band);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const r = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), rivet);
        r.position.set(Math.sin(a) * 2.42, by, Math.cos(a) * 1.9);
        this.torso.add(r);
      }
    }
    // Furnace: an iron frame, a grille and the burning core.
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.0, 0.5), ironDark);
    frame.position.set(0, 0, 1.55);
    this.torso.add(frame);
    this.coreMat = glow(0xff7a20);
    this.core = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 10), this.coreMat);
    this.core.position.set(0, 0, 1.75);
    this.torso.add(this.core);
    this.haloMat = glow(0xff8a30, 0.2, true);
    this.halo = new THREE.Mesh(new THREE.SphereGeometry(0.75, 12, 8), this.haloMat);
    this.halo.position.copy(this.core.position);
    this.torso.add(this.halo);
    this.coreAnchor.position.set(0, 0, 2.1);
    this.torso.add(this.coreAnchor);
    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.7, 0.1), ironDark);
      bar.position.set(-0.6 + i * 0.4, 0, 1.95);
      this.torso.add(bar);
    }
    for (const sx of [-1, 1]) {
      const door = new THREE.Group();
      door.position.set(sx * 1.05, 0, 2.02);
      this.torso.add(door);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.9, 0.16), iron);
      plate.position.x = -sx * 0.52;
      door.add(plate);
      for (let k = 0; k < 3; k++) {
        const r = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), rivet);
        r.position.set(-sx * 0.52, -0.6 + k * 0.6, 0.1);
        door.add(r);
      }
      this.doors.push(door);
    }
    // Glowing seams down the flanks.
    for (let i = 0; i < 6; i++) {
      const sx = i % 2 ? 1 : -1;
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), this.runeMat);
      seam.position.set(sx * (1.9 + (i % 3) * 0.1), -0.4 + Math.floor(i / 2) * 0.5, 0.9);
      seam.rotation.z = sx * 0.4;
      this.torso.add(seam);
    }
    // Chimneys on the back.
    for (const sx of [-1, 1]) {
      const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 2.6, 8), ironDark);
      ch.position.set(sx * 0.85, 1.4, -1.35);
      ch.rotation.x = -0.2;
      this.torso.add(ch);
      const lip = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.08, 5, 10), this.runeMat);
      lip.rotation.x = Math.PI / 2 - 0.2;
      lip.position.set(sx * 0.85, 2.68, -1.62);
      this.torso.add(lip);
      const top = new THREE.Object3D();
      top.position.set(sx * 0.85, 2.9, -1.68);
      this.torso.add(top);
      this.chimneys.push(top);
    }
    // Draped rime chain across the belly.
    const link = new THREE.TorusGeometry(0.2, 0.06, 5, 10);
    for (let i = 0; i < 11; i++) {
      const t = i / 10;
      const l = new THREE.Mesh(link, iron);
      l.position.set(-2.2 + t * 4.4, -1.3 - Math.sin(t * Math.PI) * 0.45, 1.5 - Math.sin(t * Math.PI) * 0.1);
      l.rotation.set(0, i % 2 ? Math.PI / 2 : 0, Math.PI / 2 + (t - 0.5) * 0.6);
      l.scale.set(1.5, 1, 1);
      this.torso.add(l);
    }
    // Shoulders.
    for (const sx of [-1, 1]) {
      const pad = new THREE.Mesh(new THREE.SphereGeometry(1.05, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), iron);
      pad.position.set(sx * 2.45, 0.95, 0);
      pad.scale.set(1, 0.8, 1.1);
      this.torso.add(pad);
      for (let k = 0; k < 3; k++) {
        const s = spike(0.22, 1.0 + k * 0.25, ice, 5);
        s.position.set(sx * (2.2 + k * 0.3), 1.5, -0.4 + k * 0.4);
        s.rotation.set(-0.2, 0, -sx * (0.35 + k * 0.15));
        this.torso.add(s);
      }
    }
    // Head.
    this.head.position.set(0, 2.05, 0.45);
    this.torso.add(this.head);
    const skull = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.1, 1.25), ice);
    this.head.add(skull);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.34, 0.5), iron);
    brow.position.set(0, 0.35, 0.5);
    brow.rotation.x = 0.2;
    this.head.add(brow);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.4, 0.9), iron);
    jaw.position.set(0, -0.55, 0.3);
    this.head.add(jaw);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.06), this.eyeMat);
      eye.position.set(sx * 0.33, 0.12, 0.64);
      eye.rotation.z = sx * -0.2;
      this.head.add(eye);
      const horn = spike(0.2, 1.1, ice, 5);
      horn.position.set(sx * 0.65, 0.45, 0);
      horn.rotation.set(-0.3, 0, -sx * 0.7);
      this.head.add(horn);
    }
    for (let i = -2; i <= 2; i++) {
      const ic = spike(0.1, 0.5 + (2 - Math.abs(i)) * 0.15, iceDark, 4);
      ic.rotation.x = Math.PI;
      ic.position.set(i * 0.24, -0.72, 0.62);
      this.head.add(ic);
    }
    this.addShell(this.torso, 0, 0.2, 0, 2.7, 2.4, 2.2);
    this.addShell(this.head, 0, 0, 0, 1.0, 0.9, 0.9);

    // --- arms -----------------------------------------------------------------------
    for (const [arm, sx] of [[this.armR, -1], [this.armL, 1]] as const) {
      arm.rotation.order = 'YXZ';
      arm.position.set(sx * 2.45, SHOULDER_Y - 2.7, 0.1);
      this.body.add(arm);
      const up = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72, 0), ice);
      up.scale.set(1, 1.4, 1);
      up.position.y = -0.85;
      arm.add(up);
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.13, 6, 14), iron);
      cuff.rotation.x = Math.PI / 2;
      cuff.position.y = -1.6;
      arm.add(cuff);
      const fore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), iceDark);
      fore.scale.set(1, 1.3, 1);
      fore.position.y = -2.05;
      arm.add(fore);
      const fist = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.0, 1.15), iron);
      fist.position.y = -2.8;
      arm.add(fist);
      this.addShell(arm, 0, -1.4, 0, 1.05, 1.9, 1.05);
    }
    // Chain wrapped round the left fist.
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.07, 5, 14), iron);
      c.rotation.set(Math.PI / 2 + (i - 1.5) * 0.25, 0, i * 0.4);
      c.position.y = -2.55 - i * 0.18;
      this.armL.add(c);
    }

    // --- the hammer ------------------------------------------------------------------
    this.hammer.position.y = -2.8;
    this.armR.add(this.hammer);
    const haftG = new THREE.CylinderGeometry(0.2, 0.22, 4.6, 8);
    haftG.translate(0, -2.1, 0);
    const haft = new THREE.Mesh(haftG, ironDark);
    this.hammer.add(haft);
    for (let i = 0; i < 3; i++) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.2, 8), brass);
      band.position.y = -0.8 - i * 1.1;
      this.hammer.add(band);
    }
    const head = new THREE.Group();
    head.position.y = -4.4;
    this.hammer.add(head);
    const block = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 2.8), iron);
    head.add(block);
    for (const sz of [-1, 1]) {
      const face = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.75, 0.35), ironDark);
      face.position.z = sz * 1.45;
      head.add(face);
    }
    for (const sx of [-1, 1]) {
      const rune = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 1.9), this.runeMat);
      rune.position.x = sx * 0.77;
      head.add(rune);
    }
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), ice);
      c.position.set((i % 2 ? 1 : -1) * 0.5, 0.75, -0.8 + i * 0.55);
      c.scale.y = 1.8;
      head.add(c);
    }

    this.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && !this.shellParts.includes(o as THREE.Mesh)) o.castShadow = true;
    });
  }

  private addShell(parent: THREE.Object3D, x: number, y: number, z: number, sx: number, sy: number, sz: number): void {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), this.shellMat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.userData.base = [sx, sy, sz];
    m.visible = false;
    parent.add(m);
    this.shellParts.push(m);
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
    const w = pose.state === 'windup' ? smoothstep(0, 1, pose.windup) : 0;
    const active = pose.state === 'active';
    const busy = pose.state === 'windup' || active || pose.state === 'recover';
    this.walk += dt * 4.2 * Math.min(1.2, pose.speed);
    const stride = Math.min(1, pose.speed);
    let pitchR = -0.35 + Math.sin(this.t * 1.3) * 0.04;
    let yawR = 0.1;
    let wrist = -0.85;
    let pitchL = -0.15 + Math.sin(this.walk) * 0.3 * stride;
    let yawL = 0;
    let lean = 0.05 + stride * 0.06;
    let twist = 0;
    let crouch = 0;
    let doors = 0;
    let legR = Math.sin(this.walk) * 0.35 * stride;
    let legL = -legR;
    let head = 0;
    let sink = 0;
    let rate = 9;
    if (busy) {
      switch (pose.attack) {
        case 'slam':
          if (pose.state === 'windup') {
            pitchR = -0.35 - 3.15 * w;
            wrist = -0.85 * (1 - w);
            yawR = SLAM_YAW * w;
            pitchL = -1.8 * w;
            lean = -0.28 * w;
            crouch = 0.1 * w;
          } else {
            pitchR = SLAM_PITCH;
            wrist = 0;
            yawR = SLAM_YAW;
            pitchL = -0.7;
            lean = 0.42;
            crouch = 0.35;
            rate = active ? 30 : 12;
          }
          break;
        case 'sweep':
          pitchR = SWEEP_PITCH;
          wrist = 0;
          if (pose.state === 'windup') {
            yawR = -SWEEP_YAW * w;
            twist = -0.45 * w;
            lean = 0.15;
            crouch = 0.15 * w;
          } else if (active) {
            yawR = SWEEP_YAW;
            twist = 0.45;
            rate = 22;
          } else {
            yawR = SWEEP_YAW * 0.8;
            twist = 0.3;
          }
          pitchL = -0.9;
          yawL = 0.4;
          break;
        case 'stomp':
          if (pose.state === 'windup') {
            legR = -0.95 * w;
            crouch = -0.05;
            lean = -0.1 * w;
            pitchL = pitchR = -1.1 * w;
          } else {
            legR = 0.05;
            crouch = 0.3;
            lean = 0.2;
            rate = active ? 30 : 10;
          }
          break;
        case 'vent':
        case 'lob':
          doors = 1;
          lean = pose.state === 'windup' ? -0.3 * w : active ? 0.2 : 0.05;
          pitchL = -1.3;
          yawL = 0.8;
          pitchR = -0.9;
          yawR = -0.6;
          wrist = -0.6;
          break;
        case 'summon':
          pitchL = -2.7 * (pose.state === 'windup' ? w : 1);
          pitchR = -2.4 * (pose.state === 'windup' ? w : 1);
          wrist = -0.4;
          head = -0.45;
          lean = -0.25;
          break;
        case 'armor':
          crouch = 0.35;
          pitchL = pitchR = -1.25;
          yawL = 0.9;
          yawR = -0.9;
          wrist = -0.5;
          head = 0.3;
          lean = 0.3;
          doors = 0;
          break;
      }
    }
    if (this.stuck) {
      // Hammer buried in the floor: straining, furnace open.
      pitchR = SLAM_PITCH + Math.sin(this.t * 17) * 0.03;
      wrist = 0;
      yawR = SLAM_YAW;
      pitchL = -0.8 + Math.sin(this.t * 9) * 0.1;
      lean = 0.5;
      crouch = 0.4;
      doors = 1;
      rate = 12;
    }
    if (pose.state === 'hitstun' || pose.state === 'down') {
      lean = -0.35;
      pitchL = -1.7;
      pitchR = -1.2;
      yawR = -0.5;
      wrist = -0.3;
      head = -0.4;
      doors = 1;
      crouch = 0.2;
    }
    if (this.exposed) doors = 1;
    if (pose.dead) {
      lean = 0.7;
      sink = 1.4;
      doors = 1;
      pitchL = pitchR = -0.2;
    }
    P.pitchR = damp(P.pitchR, pitchR, rate, dt);
    P.yawR = damp(P.yawR, yawR, rate, dt);
    P.wrist = damp(P.wrist, wrist, rate, dt);
    P.pitchL = damp(P.pitchL, pitchL, 10, dt);
    P.yawL = damp(P.yawL, yawL, 10, dt);
    P.lean = damp(P.lean, lean, 8, dt);
    P.twist = damp(P.twist, twist, rate, dt);
    P.crouch = damp(P.crouch, crouch, 10, dt);
    P.doors = damp(P.doors, doors, 7, dt);
    P.legR = damp(P.legR, legR, 12, dt);
    P.legL = damp(P.legL, legL, 12, dt);
    P.head = damp(P.head, head, 8, dt);
    P.sink = damp(P.sink, sink, 3, dt);

    const bob = Math.abs(Math.sin(this.walk)) * 0.15 * stride;
    this.body.position.y = 2.7 - P.crouch * 0.7 + bob - P.sink;
    this.body.rotation.x = P.lean;
    this.body.rotation.y = P.twist;
    this.legs[0]!.rotation.x = P.legR;
    this.legs[1]!.rotation.x = P.legL;
    this.legs[0]!.position.y = this.legs[1]!.position.y = 2.7 - P.sink;
    this.armR.rotation.x = P.pitchR;
    this.armR.rotation.y = P.yawR;
    this.armL.rotation.x = P.pitchL;
    this.armL.rotation.y = P.yawL;
    this.hammer.rotation.x = P.wrist;
    this.head.rotation.x = P.head;
    this.doors[0]!.rotation.y = P.doors * 1.7;
    this.doors[1]!.rotation.y = -P.doors * 1.7;
    // The furnace heart: dim behind its doors, white-hot when exposed.
    const hot = this.exposed ? 1 : P.doors * 0.6;
    const pulse = 1 + Math.sin(this.t * (this.exposed ? 14 : 5)) * (0.08 + hot * 0.12);
    this.core.scale.setScalar(pulse * (1 + hot * 0.25));
    this.coreMat.color.setHex(hot > 0.8 ? 0xffe0a0 : hot > 0.3 ? 0xffa040 : 0xff6a18);
    this.halo.scale.setScalar(pulse * (1 + hot * 0.35));
    this.haloMat.opacity = 0.12 + hot * 0.2;
    this.eyeMat.color.setHex(pose.state === 'windup' ? 0xffffff : 0xffb040);
    // Rime shell.
    for (const s of this.shellParts) {
      s.visible = this.shell > 0.02;
      const b = s.userData.base as number[];
      const k = 0.6 + this.shell * 0.45;
      s.scale.set(b[0]! * k, b[1]! * k, b[2]! * k);
    }
    this.shellMat.opacity = 0.25 + this.shell * 0.4;
  }

  dispose(): void {
    for (const m of this.mats) m.dispose();
    this.shellMat.dispose();
  }
}

export const GROLM_DEF: EnemyDef = {
  id: 'grolm', name: 'Forgemaster Grolm', hp: 1350, radius: 2.5, height: 7.4, speed: 2.7, turnRate: 1.7, mass: 0, poise: 240,
  resist: { fire: 1.4, ice: 0, lightning: 0.85 }, statusResist: { ice: 0, fire: 0.6, lightning: 0.35 }, aggroRange: 60,
  gems: { blue: 180, red: 8, green: 6, purple: 6 },
  attacks: [
    { id: 'slam', pose: 'slam', range: 9.5, windup: 1.2, active: 0.2, recover: 0.9, cooldown: 4.2, weight: 3, kind: 'slam', damage: 26, knockback: 12 },
    { id: 'sweep', pose: 'sweep', range: 7.8, windup: 0.95, active: 0.4, recover: 0.8, cooldown: 3.2, weight: 3, kind: 'slam', damage: 18, knockback: 14 },
    { id: 'stomp', pose: 'stomp', range: 4.6, windup: 0.75, active: 0.2, recover: 0.7, cooldown: 4.5, weight: 2, kind: 'slam', damage: 12, knockback: 9 },
    { id: 'lob', pose: 'lob', range: 26, minRange: 9.5, windup: 0.9, active: 0.2, recover: 0.8, cooldown: 5.5, weight: 2, kind: 'projectile', damage: 9, knockback: 6 },
    { id: 'vent', pose: 'vent', range: 40, windup: 0.9, active: 0.3, recover: 0.9, cooldown: 9, weight: 3, kind: 'projectile', damage: 8, knockback: 3 },
    { id: 'summon', pose: 'summon', range: 60, windup: 1.1, active: 0.2, recover: 0.8, cooldown: 20, weight: 2, kind: 'projectile', damage: 0, knockback: 0 },
  ],
  build: () => new GrolmModel(),
  styleValue: 12,
};

const ARMOR: AttackDef = {
  id: 'armor', pose: 'armor', range: 99, windup: 1.4, active: 0.3, recover: 0.8, cooldown: 0, weight: 0, kind: 'projectile', damage: 0, knockback: 0,
};

interface FrostPatch {
  x: number;
  y: number;
  z: number;
  r: number;
  t: number;
  tick: number;
  root: THREE.Group;
  disc: THREE.MeshBasicMaterial;
  ring: THREE.MeshBasicMaterial;
  spikes: THREE.Mesh[];
}

const PATCH_WARN = 1.1;
const PATCH_LIFE = 7;

export class Grolm extends Boss {
  readonly displayName = 'Forgemaster Grolm';
  private gm: GrolmModel;
  private stuck = 0;
  private shellHp = 0;
  private shellMax = 0;
  private reshell = 0;
  private slamMarked = false;
  private impactX = 0;
  private impactZ = 0;
  private sweepHit = false;
  private minions: Enemy[] = [];
  private patches: FrostPatch[] = [];
  private smokeT = 0;
  private stepT = 0;
  private hintT = 0;
  private told = new Set<string>();

  constructor(game: Game, x: number, y: number, z: number, yaw: number, private arena: { x: number; z: number; r: number }) {
    super(game, GROLM_DEF, x, y, z, yaw);
    this.speakerId = 'grolm';
    this.phases = 3;
    this.gm = this.model as GrolmModel;
    this.body.stepUp = 0.6;
    // Dying mid-fight despawns the boss; take the frost and the minions with it.
    game.level?.on('boss-reset', () => this.cleanup(false));
  }

  private tell(key: string, text: string, secs = 6): void {
    if (this.told.has(key)) return;
    this.told.add(key);
    this.game.hud.flick(text, secs);
  }

  /** Model space (lx, lz) to world. */
  private local(lx: number, lz: number): [number, number] {
    const c = Math.cos(this.yaw);
    const s = Math.sin(this.yaw);
    return [this.body.x + lx * c + lz * s, this.body.z - lx * s + lz * c];
  }

  /** Where the hammer's face lands at the bottom of a slam. */
  private slamPoint(): [number, number] {
    const dx = -Math.sin(SLAM_PITCH) * Math.sin(SLAM_YAW);
    const dz = -Math.sin(SLAM_PITCH) * Math.cos(SLAM_YAW);
    return this.local(SHOULDER_X + dx * REACH, 0.1 + dz * REACH);
  }

  private get shelled(): boolean {
    return this.shellHp > 0;
  }

  private get exposed(): boolean {
    return this.stuck > 0 || this.state === 'hitstun';
  }

  protected override think(dt: number): void {
    const g = this.game;
    const b = this.body;
    if (!this.awake) {
      this.yaw = approachAngle(this.yaw, this.yawToPlayer(), dt * 1.5);
      return;
    }
    // Phases.
    const f = this.hpFrac;
    const want = f < 0.33 ? 3 : f < 0.66 ? 2 : 1;
    if (want > this.phase) {
      this.phase = want;
      g.sfx('bossRoar', b.x, b.y, b.z, 0.8);
      g.shake(0.6, 0.7);
      this.stuck = 0;
      this.attack = null;
      if (want === 2) {
        g.toast('Grolm opens the coolant lines!', 'warn');
        this.tell('phase2', 'Coolant! Stay off the frozen patches, and remember: fire melts golems!', 6);
        this.cooldowns.set('vent', 0);
        this.cooldowns.set('summon', 4);
        this.setState('chase');
        this.globalCd = 0.4;
      } else {
        this.startAttack(ARMOR);
        return;
      }
    }
    // Hammer stuck in the floor: the punish window.
    if (this.stuck > 0) {
      this.stuck -= dt;
      this.stateT = 0;
      b.vx *= 0.8;
      b.vz *= 0.8;
      if (this.stuck <= 0) {
        g.sfx('rumble', b.x, b.y, b.z, 0.7);
        const [hx, hz] = this.slamPoint();
        g.fx.rocks(hx, b.y + 0.5, hz, 12, 0x8a96a8);
      }
      return;
    }
    if (this.phase === 3 && !this.shelled && this.reshell > 0 && !this.attack) {
      this.reshell -= dt;
      if (this.reshell <= 0) {
        this.startAttack(ARMOR);
        return;
      }
    }
    const d = this.distToPlayer();
    const speedMul = this.phase === 3 ? 1.2 : 1;
    if (this.state === 'windup' || this.state === 'active' || this.state === 'recover') {
      const a = this.attack!;
      const keepYaw = this.yaw;
      if (a.id === 'slam' && this.state === 'windup' && this.stateT >= a.windup * 0.45) {
        if (!this.slamMarked) {
          this.slamMarked = true;
          const [ix, iz] = this.slamPoint();
          this.impactX = ix;
          this.impactZ = iz;
          g.fx.ring(ix, b.y + 0.1, iz, 0.3, 3.4, 0xff3030, a.windup * 0.55);
        }
      }
      if (a.id === 'sweep' && this.state === 'active') this.sweepCheck(a);
      this.runAttack(dt * speedMul, d, this.yawToPlayer());
      if (a.id === 'slam' && this.slamMarked) this.yaw = keepYaw;
      if (a.id === 'armor') this.yaw = keepYaw;
      return;
    }
    const pick = this.globalCd <= 0 ? this.pick(d) : null;
    if (pick) {
      this.startAttack(pick);
      return;
    }
    const dirYaw = this.yawToPlayer();
    if (d > 5.5) {
      this.moveDir(dirYaw, this.def.speed * speedMul, dt);
      this.state = 'chase';
      this.stepT -= dt;
      if (this.stepT <= 0) {
        this.stepT = 0.75;
        g.sfx('pound', b.x, b.y, b.z, 0.55, 0.3);
        g.shake(0.06, 0.15);
        g.fx.dust(b.x, b.y, b.z, 3, 0xdfe8f0);
      }
    } else {
      this.yaw = approachAngle(this.yaw, dirYaw, this.def.turnRate * dt);
      this.state = 'strafe';
    }
  }

  private pick(d: number): AttackDef | null {
    let total = 0;
    const options: AttackDef[] = [];
    for (const a of this.def.attacks) {
      if ((this.cooldowns.get(a.id) ?? 0) > 0) continue;
      if (d > a.range || d < (a.minRange ?? 0)) continue;
      if ((a.id === 'vent' || a.id === 'summon') && this.phase < 2) continue;
      if (a.id === 'summon' && this.minions.filter((m) => m.alive).length >= 2) continue;
      options.push(a);
      total += a.weight;
    }
    if (!options.length) return null;
    let r = rng.next() * total;
    for (const a of options) {
      r -= a.weight;
      if (r <= 0) return a;
    }
    return options[options.length - 1]!;
  }

  override startAttack(a: AttackDef): void {
    super.startAttack(a);
    const g = this.game;
    const b = this.body;
    this.slamMarked = false;
    this.sweepHit = false;
    if (a.id === 'sweep') {
      g.fx.ring(b.x, b.y + 0.1, b.z, 1, 8.2, 0xff6030, a.windup);
      this.tell('sweep', 'Low swing! Jump over the hammer, or dodge through it!', 5);
    } else if (a.id === 'stomp') {
      g.fx.ring(b.x, b.y + 0.1, b.z, 0.5, 4.5, 0xff3030, a.windup);
    } else if (a.id === 'slam') {
      this.tell('slam', 'He\'s winding up! Get clear of the red ring, then JUMP the shockwave!', 5);
    } else if (a.id === 'armor') {
      g.sfx('iceCrack', b.x, b.y, b.z, 0.6);
    }
  }

  private sweepCheck(a: AttackDef): void {
    if (this.sweepHit) return;
    const g = this.game;
    const p = g.player;
    if (!p.alive) return;
    const b = this.body;
    const pb = p.body;
    const k = clamp(this.stateT / (a.active * 0.8), 0, 1);
    const headYaw = this.yaw + (-SWEEP_YAW + k * SWEEP_YAW * 2);
    const dx = pb.x - b.x;
    const dz = pb.z - b.z;
    const d = Math.hypot(dx, dz);
    if (d > 8.4 || d < 1) return;
    if (Math.abs(angleDiff(headYaw, yawOf(dx, dz))) > 0.45) return;
    // The hammer skims the floor: anything airborne clears it.
    if (pb.y > b.y + 1.3) return;
    this.sweepHit = true;
    const n = d || 1;
    p.takeHit(makeHit({
      damage: a.damage * g.difficultyInfo.enemyDamage, dirX: dx / n, dirZ: dz / n, knockback: a.knockback, launch: 7,
      source: 'enemy', move: 'sweep', fromPlayer: false, ox: b.x, oz: b.z,
    }), this);
  }

  protected override onActiveStart(a: AttackDef): void {
    const g = this.game;
    const b = this.body;
    const p = g.player;
    const dmgK = g.difficultyInfo.enemyDamage;
    switch (a.id) {
      case 'slam': {
        const [ix, iz] = this.slamMarked ? [this.impactX, this.impactZ] : this.slamPoint();
        const iy = g.col.groundAt(ix, iz, b.y + 2, 0.3).y;
        const y = iy > -1e3 ? iy : b.y;
        g.spawnShockwave(ix, y, iz, [12, 14, 15][this.phase - 1]!, 10.5, 16 * dmgK, 10, this);
        const d = Math.hypot(p.x - ix, p.z - iz);
        if (d < 3.4 && p.y < y + 2.5) {
          const n = d || 1;
          p.takeHit(makeHit({ damage: a.damage * dmgK, dirX: (p.x - ix) / n, dirZ: (p.z - iz) / n, knockback: a.knockback, launch: 9, source: 'enemy', move: 'slam', fromPlayer: false, ox: ix, oz: iz }), this);
        }
        g.shake(1.0, 0.5);
        g.sfx('pound', ix, y, iz, 0.6);
        g.sfx('iceCrack', ix, y, iz, 0.7);
        g.fx.dust(ix, y, iz, 36, 0xdfe8f0);
        g.fx.rocks(ix, y + 0.3, iz, 16, 0x8a96a8);
        g.fx.shatter(ix, y + 0.5, iz);
        g.fx.ring(ix, y + 0.1, iz, 0.5, 5, 0xffffff, 0.35);
        this.stuck = [3.0, 2.6, 2.2][this.phase - 1]!;
        this.state = 'recover';
        this.stateT = 0;
        this.tell('stuck', 'His hammer\'s stuck! The furnace in his chest is open. Hit it, hard!', 5);
        break;
      }
      case 'sweep':
        g.sfx('swingHeavy', b.x, b.y, b.z, 0.5);
        g.shake(0.3, 0.3);
        break;
      case 'stomp': {
        g.spawnShockwave(b.x, b.y, b.z, 9, 12, a.damage * dmgK, a.knockback, this);
        g.shake(0.6, 0.35);
        g.sfx('pound', b.x, b.y, b.z, 0.5);
        g.fx.dust(b.x, b.y, b.z, 24, 0xdfe8f0);
        const d = this.distToPlayer();
        if (d < this.def.radius + 1.6 && p.y < b.y + 1.5) {
          const n = d || 1;
          p.takeHit(makeHit({ damage: 14 * dmgK, dirX: (p.x - b.x) / n, dirZ: (p.z - b.z) / n, knockback: 12, launch: 8, source: 'enemy', move: 'stomp', fromPlayer: false, ox: b.x, oz: b.z }), this);
        }
        break;
      }
      case 'lob': {
        const n = this.phase >= 2 ? 3 : 1;
        const [ox, oz] = this.local(0, 2.4);
        const oy = b.y + 4.6;
        for (let i = 0; i < n; i++) {
          const lead = i === 0 ? 0 : (i === 1 ? 1 : -1) * 4;
          let tx = p.x + p.body.vx * 0.6 + Math.cos(this.yaw) * lead;
          let tz = p.z + p.body.vz * 0.6 - Math.sin(this.yaw) * lead;
          [tx, tz] = this.clampToArena(tx, tz, 2);
          const dist = Math.max(2, Math.hypot(tx - ox, tz - oz));
          const theta = 0.7;
          const grav = 16;
          const drop = oy - p.y;
          const speed = Math.sqrt((dist * grav) / Math.max(0.3, Math.sin(2 * theta) + (2 * drop * Math.cos(theta) ** 2) / dist));
          const yaw = yawOf(tx - ox, tz - oz);
          g.spawnProjectile({
            x: ox, y: oy, z: oz, dx: Math.sin(yaw) * Math.cos(theta), dy: Math.sin(theta), dz: Math.cos(yaw) * Math.cos(theta),
            speed, radius: 0.6, damage: a.damage, type: 'fire', color: 0xff6a1a, life: 5, gravity: grav, fromPlayer: false, kind: 'boulder',
            explode: 2.6, knockback: 6,
          });
          g.fx.ring(tx, p.y + 0.1, tz, 0.3, 2.6, 0xff5020, 1.3);
        }
        g.sfx('fireBurst', b.x, b.y + 4, b.z, 0.6);
        g.fx.explosion(ox, oy, oz, 1, 0xff8a30);
        break;
      }
      case 'vent': {
        const n = this.phase >= 3 ? 4 : 3;
        const spots: [number, number][] = [this.clampToArena(p.x, p.z, 3)];
        for (let tries = 0; tries < 40 && spots.length < n; tries++) {
          const ang = rng.next() * Math.PI * 2;
          const rr = Math.sqrt(rng.next()) * (this.arena.r - 4);
          const x = this.arena.x + Math.sin(ang) * rr;
          const z = this.arena.z + Math.cos(ang) * rr;
          if (Math.hypot(x - b.x, z - b.z) < 5) continue;
          if (spots.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < 6.5)) continue;
          spots.push([x, z]);
        }
        for (const [x, z] of spots) this.addPatch(x, z, 2.9);
        const [cx, cz] = this.local(0, 2.2);
        g.fx.emit(cx, b.y + 4.5, cz, { count: 40, speed: 7, dir: [Math.sin(this.yaw), 0.4, Math.cos(this.yaw)], spread: 0.6, life: [0.6, 1.1], size: [0.8, 1.4], sizeEnd: 3, color: 0xe8f6ff, alpha: 0.6, additive: false, drag: 2 });
        g.sfx('steam', b.x, b.y, b.z, 0.8);
        break;
      }
      case 'summon': {
        const alive = this.minions.filter((m) => m.alive).length;
        const count = Math.max(0, Math.min(this.phase >= 3 ? 2 : 1, 2 - alive));
        for (let i = 0; i < count; i++) {
          const ang = this.yaw + (i === 0 ? 1.4 : -1.4);
          const [x, z] = this.clampToArena(b.x + Math.sin(ang) * 7, b.z + Math.cos(ang) * 7, 3);
          const gy = g.col.groundAt(x, z, b.y + 4, 0.3).y;
          const e = g.spawnEnemy('frostGolem', x, gy + 0.05, z, ang, true);
          e.aggro = true;
          this.minions.push(e);
          g.fx.shatter(x, gy + 1, z);
        }
        this.minions = this.minions.filter((m) => m.alive);
        g.sfx('bossRoar', b.x, b.y, b.z, 1.1, 0.7);
        g.shake(0.4, 0.5);
        if (count > 0) this.tell('summon', 'He\'s forging golems! Fire melts them, and they can\'t stand lightning then fire either!', 6);
        break;
      }
      case 'armor':
        this.shellMax = this.told.has('shellBroken') ? 110 : 150;
        this.shellHp = this.shellMax;
        this.status.burn = 0;
        this.status.heat = 0;
        this.status.resist.fire = 0;
        this.poiseDmg = 0;
        g.sfx('shatter', b.x, b.y, b.z, 0.6);
        g.sfx('iceCrack', b.x, b.y, b.z, 0.5);
        g.fx.shatter(b.x, b.y + 4, b.z, 0xdff6ff);
        g.fx.ring(b.x, b.y + 0.2, b.z, 1, 7, 0xbff4ff, 0.6);
        g.shake(0.5, 0.5);
        g.toast('Grolm armors itself in rime!', 'warn');
        this.tell('shell', 'A rime shell! Nothing gets through that but fire. Burn it off!', 6);
        break;
    }
  }

  private clampToArena(x: number, z: number, margin: number): [number, number] {
    const dx = x - this.arena.x;
    const dz = z - this.arena.z;
    const d = Math.hypot(dx, dz);
    const max = this.arena.r - margin;
    if (d <= max) return [x, z];
    return [this.arena.x + (dx / d) * max, this.arena.z + (dz / d) * max];
  }

  // --- frost patches -----------------------------------------------------------------

  private addPatch(x: number, z: number, r: number): void {
    const g = this.game;
    const level = g.level;
    if (!level) return;
    const gy = g.col.groundAt(x, z, this.body.y + 3, 0.3).y;
    const y = gy > -1e3 ? gy : this.body.y;
    const root = new THREE.Group();
    root.position.set(x, y + 0.06, z);
    const disc = new THREE.MeshBasicMaterial({ color: 0xbff0ff, transparent: true, opacity: 0.15, depthWrite: false });
    const dm = new THREE.Mesh(new THREE.CircleGeometry(r, 24), disc);
    dm.rotation.x = -Math.PI / 2;
    root.add(dm);
    const ring = new THREE.MeshBasicMaterial({ color: 0x8fe4ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const rm = new THREE.Mesh(new THREE.RingGeometry(r - 0.25, r, 32), ring);
    rm.rotation.x = -Math.PI / 2;
    rm.position.y = 0.02;
    root.add(rm);
    const sm = mat(0xdff6ff, { rough: 0.1, emissive: 0x4ab0e0, emissiveIntensity: 0.5, flat: true });
    const spikes: THREE.Mesh[] = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + rng.next();
      const rr = r * (0.2 + rng.next() * 0.65);
      const s = spike(0.18, 0.7 + rng.next() * 0.6, sm, 4);
      s.position.set(Math.sin(a) * rr, 0, Math.cos(a) * rr);
      s.rotation.set(rng.signed() * 0.3, 0, rng.signed() * 0.3);
      s.scale.y = 0.01;
      root.add(s);
      spikes.push(s);
    }
    level.root.add(root);
    this.patches.push({ x, y, z, r, t: 0, tick: 0, root, disc, ring, spikes });
    g.fx.emit(x, y + 0.3, z, { count: 12, speed: 1.5, dir: [0, 1, 0], spread: 0.8, life: [0.5, 1], size: [0.5, 0.9], sizeEnd: 2, color: 0xe8f6ff, alpha: 0.5, additive: false, jitter: r * 0.6 });
  }

  private updatePatches(dt: number): void {
    const g = this.game;
    const p = g.player;
    for (const f of this.patches) {
      f.t += dt;
      f.tick -= dt;
      if (f.t < PATCH_WARN) {
        const k = f.t / PATCH_WARN;
        f.disc.opacity = 0.12 + k * 0.25;
        f.ring.opacity = 0.5 + Math.sin(f.t * 20) * 0.4;
        continue;
      }
      const live = f.t - PATCH_WARN;
      const fade = Math.max(0, live - (PATCH_LIFE - 0.8)) / 0.8;
      f.disc.opacity = 0.62 * (1 - fade);
      f.ring.opacity = 0.7 * (1 - fade);
      for (const s of f.spikes) s.scale.y = Math.min(1, live * 6) * (1 - fade);
      if (rng.chance(0.12)) g.fx.emit(f.x + rng.signed() * f.r * 0.7, f.y + 0.2, f.z + rng.signed() * f.r * 0.7, { count: 1, speed: 0.5, dir: [0, 1, 0], life: [0.6, 1.1], size: [0.3, 0.5], sizeEnd: 1.4, color: 0xf0faff, alpha: 0.45, additive: false });
      if (fade < 0.5 && f.tick <= 0 && p.alive && Math.hypot(p.x - f.x, p.z - f.z) < f.r + p.body.radius * 0.5 && Math.abs(p.y - f.y) < 1) {
        f.tick = 0.6;
        const dx = p.x - f.x;
        const dz = p.z - f.z;
        const n = Math.hypot(dx, dz) || 1;
        p.takeHit(makeHit({ damage: 8 * g.difficultyInfo.enemyDamage, type: 'ice', dirX: dx / n, dirZ: dz / n, knockback: 4, launch: 7, source: 'enemy', move: 'frost', fromPlayer: false, ox: f.x, oz: f.z }), this);
        g.sfx('iceCrack', p.x, p.y, p.z, 1.3, 0.6);
      }
    }
    const done = this.patches.filter((f) => f.t > PATCH_WARN + PATCH_LIFE);
    for (const f of done) this.removePatch(f);
    if (done.length) this.patches = this.patches.filter((f) => f.t <= PATCH_WARN + PATCH_LIFE);
  }

  private removePatch(f: FrostPatch): void {
    this.game.level?.root.remove(f.root);
    f.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.geometry.dispose();
    });
    f.disc.dispose();
    f.ring.dispose();
  }

  private cleanup(killMinions: boolean): void {
    for (const f of this.patches) this.removePatch(f);
    this.patches = [];
    for (const m of this.minions) {
      if (!m.alive) continue;
      if (killMinions) m.die(null);
      else {
        m.alive = false;
        m.setState('dead');
        m.deadT = 10;
      }
    }
    this.minions = [];
  }

  // --- per-step extras ------------------------------------------------------------------

  override updateBoss(dt: number): void {
    const g = this.game;
    const b = this.body;
    this.gm.stuck = this.stuck > 0;
    this.gm.exposed = this.alive && this.exposed;
    this.gm.shell = damp(this.gm.shell, this.shelled ? 1 : 0, 6, dt);
    this.hintT -= dt;
    this.updatePatches(dt);
    if (!this.alive) return;
    this.smokeT -= dt;
    if (this.smokeT <= 0) {
      this.smokeT = 0.12;
      const v = new THREE.Vector3();
      for (const c of this.gm.chimneys) {
        c.getWorldPosition(v);
        g.fx.emit(v.x, v.y, v.z, { count: 1, speed: 1.6, dir: [0, 1, 0], spread: 0.3, life: [1.2, 1.8], size: [0.5, 0.8], sizeEnd: 2.6, color: 0x4a4650, alpha: 0.55, additive: false, gravity: -1.5 });
        if (rng.chance(0.4)) g.fx.emit(v.x, v.y, v.z, { count: 1, speed: 2.4, dir: [0, 1, 0], spread: 0.5, life: [0.6, 1], size: [0.08, 0.14], color: 0xff9040, bright: 2, gravity: -2 });
      }
      if (this.exposed) {
        this.gm.coreAnchor.getWorldPosition(v);
        g.fx.emit(v.x, v.y, v.z, { count: 3, speed: 3, dir: [Math.sin(this.yaw), 0.6, Math.cos(this.yaw)], spread: 0.6, life: [0.3, 0.6], size: [0.15, 0.3], color: 0xffc060, bright: 2.2, gravity: -1 });
      }
    }
    void b;
  }

  // --- taking hits -------------------------------------------------------------------------

  override takeHit(hit: Hit): HitResult {
    if (!this.alive || !this.awake) return 'none';
    const g = this.game;
    let h = hit;
    if (this.shelled) {
      const top = this.body.y + this.def.height * 0.6;
      if (hit.type === 'fire') {
        const melt = hit.damage * 1.3;
        this.shellHp -= melt;
        g.fx.emit(this.body.x, top, this.body.z, { count: 6, speed: 2.5, dir: [0, 1, 0], spread: 0.8, life: [0.5, 0.9], size: [0.6, 1.0], sizeEnd: 2.5, color: 0xf0f8ff, alpha: 0.5, additive: false, jitter: this.def.radius });
        if (g.options.damageNumbers) g.hud.number(this.body.x, top + 1.5, this.body.z, Math.round(melt), 0xbff4ff, false);
        if (this.shellHp <= 0) {
          this.breakShell();
          return 'hit';
        }
        h = { ...hit, damage: hit.damage * 0.35, stagger: 0, buildup: 0 };
      } else {
        h = { ...hit, damage: hit.damage * 0.12, stagger: 0, buildup: hit.type === 'lightning' ? hit.buildup * 0.5 : 0 };
        g.fx.sparkle(this.body.x, top, this.body.z, 0xdff6ff, 5);
        if (this.hintT <= 0) {
          this.hintT = 7;
          g.toast('The rime shell shrugs it off. It needs fire!', 'hint');
        }
      }
    } else if (this.exposed) {
      h = { ...hit, damage: hit.damage * 1.75 };
      const v = new THREE.Vector3();
      this.gm.coreAnchor.getWorldPosition(v);
      g.fx.hit(v.x, v.y, v.z, 0xffc060, 1.3);
    }
    return super.takeHit(h);
  }

  private breakShell(): void {
    const g = this.game;
    const b = this.body;
    this.shellHp = 0;
    this.status.resist.fire = 0.6;
    this.told.add('shellBroken');
    this.stuck = 0;
    this.attack = null;
    this.releaseToken();
    this.setState('hitstun');
    this.hitstunMax = 3.6;
    this.reshell = 13;
    g.fx.shatter(b.x, b.y + 3, b.z, 0xdff6ff);
    g.fx.shatter(b.x, b.y + 5, b.z, 0xbff4ff);
    g.sfx('shatter', b.x, b.y, b.z, 0.7);
    g.sfx('steam', b.x, b.y, b.z);
    g.shake(0.6, 0.4);
    g.slowmo(0.35, 0.4);
    g.hud.bigText('SHELL MELTED', 0xffb060);
    g.toast('Grolm is staggered! Strike the furnace!', 'good');
  }

  protected override onBossStagger(_hit: Hit): void {
    if (this.shelled) return;
    this.attack = null;
    this.stuck = 0;
    this.setState('hitstun');
    this.hitstunMax = 2.2;
    this.game.toast('Grolm is staggered!', 'good');
    this.game.sfx('bossRoar', this.x, this.y, this.z, 1.4, 0.6);
  }

  override die(hit: Hit | null, reaction: Parameters<Boss['die']>[1] = null): void {
    if (!this.alive) return;
    this.cleanup(true);
    this.stuck = 0;
    this.shellHp = 0;
    super.die(hit, reaction);
    const g = this.game;
    g.fx.explosion(this.x, this.y + 4, this.z, 3, 0xffa040);
    g.fx.shatter(this.x, this.y + 3, this.z, 0xdff6ff);
  }

  override dispose(): void {
    this.cleanup(false);
    super.dispose();
  }

  protected override onReset(): void {
    this.cleanup(false);
    this.stuck = 0;
    this.shellHp = 0;
    this.reshell = 0;
    this.status.resist.fire = 0.6;
  }
}
