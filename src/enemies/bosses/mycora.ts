import * as THREE from 'three';
import { Boss } from '../boss';
import type { AttackDef, Enemy, EnemyDef } from '../enemy';
import type { EnemyModel, EnemyPose } from '../models';
import type { Game } from '../../game/game';
import type { Hit, HitResult, Hittable } from '../../game/types';
import { makeHit } from '../../game/types';
import type { Reaction } from '../../combat/status';
import { Builder, type Level } from '../../world/level';
import type { Prop } from '../../entities/props';
import { makeCyl, type Solid } from '../../world/collision';
import { mat, matUnique, glow, glowShared, addRim } from '../../render/materials';
import { ellipsoid, spike, taperedTube, mergeStatic } from '../../render/shapes';
import { angleDiff, approachAngle, clamp, damp, lerp, smoothstep, yawOf } from '../../core/math';
import { rng } from '../../core/rng';
import { THEMES } from '../../core/audio';
import { GroundMark, lobSpore, sporeField, sproutSporeling, witherAll } from '../deep';
import { SPORE_GLOW, ROOT_VEIN, ROOT_HOT } from '../models-deep';

/**
 * Mycora, the Spore Mother: the Mycelium Deep's boss, a vast fungal queen
 * rooted in the middle of her grove and wed to the Hollow King's roots.
 *
 *   Phase 1  Rooted. Root sweeps along the floor (jump them), spore bomb
 *            volleys, sporelings called up, a choking gasp if you hug her.
 *            Three glowing spore sacs feed her (hits barely hurt): burn
 *            them all with Fire and she collapses for a punish window.
 *   Phase 2  She tears free and stalks the grove: overhead slams with
 *            jumpable shockwaves (after a pair her arms stick in the
 *            ground), arm swipes, blight breath that carpets the floor
 *            (burn it away), and puffcaps sprouting at the edge.
 *   Phase 3  She hauls herself up into the canopy under the Mother Cap.
 *            Bounce caps sprout around the grove to throw Aster up to her
 *            while she rains spores, lashes the floor and drops her brood.
 *            Hurt her enough up there and she loses her grip and falls;
 *            once she is weak enough, she stays down for the finish.
 *
 * The grove's props (the Mother Cap overhead, the canopy, and the sleeping
 * bounce caps) come from buildMycoraArena(), which the realm calls first.
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Hit points where the phases turn (fractions of max). */
const P2 = 0.66;
const P3 = 0.33;
/** How high she hangs in the canopy (her base above the grove floor). */
const HANG = 6.8;
/** Damage taken up in the canopy before she loses her grip. */
const GRIP = 150;
/** Under this fraction of health a fall is the last one. */
const FINAL = 0.12;
/** Fire it takes to burst one spore sac. */
const SAC_HEAT = 60;

// ---------------------------------------------------------------------------
// The grove: bounce caps, canopy, the Mother Cap
// ---------------------------------------------------------------------------

/** A bounce cap that sleeps under the floor until the canopy phase, then throws Aster up to her. */
class BounceCap {
  private readonly root = new THREE.Group();
  private readonly capG = new THREE.Group();
  private readonly solid: Solid;
  private readonly ringMat: THREE.MeshBasicMaterial;
  private k = 0;
  private squash = 0;
  private t = rng.next() * 6;
  awake = false;
  /** Launches so far (tests read this). */
  bounces = 0;

  constructor(private game: Game, level: Level, readonly x: number, readonly y: number, readonly z: number) {
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 1.3, 10), mat(0xe8dcc6, { rough: 0.8, emissive: 0x3a4a50, emissiveIntensity: 0.4 }));
    stalk.position.y = 0.65;
    this.root.add(stalk);
    const capM = mat(0xff5aa8, { rough: 0.5, emissive: 0xff5aa8, emissiveIntensity: 0.55 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.6, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), capM);
    dome.scale.y = 0.55;
    this.capG.add(dome);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const d = ellipsoid(0.18, 0.08, 0.18, glowShared(0xfff4dc), 6);
      d.position.set(Math.sin(a) * 0.95, 0.62, Math.cos(a) * 0.95);
      this.capG.add(d);
    }
    this.capG.position.y = 1.3;
    this.root.add(this.capG);
    // A ring on the floor so it reads from across the grove.
    this.ringMat = new THREE.MeshBasicMaterial({ color: 0xff8ad0, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.75, 2.0, 32), this.ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, y + 0.06, z);
    ring.renderOrder = 22;
    ring.userData.ring = true;
    level.root.add(ring);
    this.ring = ring;
    this.root.position.set(x, y, z);
    this.root.visible = false;
    level.root.add(this.root);
    this.solid = makeCyl(x, z, 1.5, y, y + 2.1);
    this.solid.surface = 'mud';
    this.solid.enabled = false;
    this.solid.onStand = (who) => {
      const p = this.game.player;
      if (who !== p.body || this.k < 0.9) return;
      p.body.vy = 23;
      p.body.grounded = false;
      this.squash = 1;
      this.bounces++;
      this.game.sfx('jump', x, y, z, 0.55);
      this.game.audio.play('gemPurple', 0.55, 0.7);
      this.game.fx.sparkle(x, y + 2.2, z, 0xff8ad0, 12);
      this.game.fx.ring(x, y + 2, z, 0.5, 2.4, 0xff8ad0, 0.4);
    };
    level.col.add(this.solid);
    this.ring.visible = false;
  }

  private readonly ring: THREE.Mesh;

  update(dt: number): void {
    this.t += dt;
    const want = this.awake ? 1 : 0;
    const was = this.k;
    this.k = this.awake ? Math.min(1, this.k + dt * 1.2) : Math.max(0, this.k - dt * 1.5);
    if (this.k > 0 && was === 0 && this.awake) {
      this.game.fx.dust(this.x, this.y, this.z, 14, 0x5a4a60);
      this.game.sfx('burrow', this.x, this.y, this.z, 1.2, 0.7);
    }
    void want;
    this.root.visible = this.k > 0.01;
    this.ring.visible = this.k > 0.5;
    this.solid.enabled = this.k > 0.9;
    const grow = smoothstep(0, 1, this.k);
    this.root.scale.set(0.3 + grow * 0.7, Math.max(0.01, grow), 0.3 + grow * 0.7);
    this.squash = Math.max(0, this.squash - dt * 3);
    const s = Math.sin(this.squash * Math.PI * 3) * this.squash * 0.35;
    this.capG.scale.set(1 + s, 1 - s, 1 + s);
    this.ringMat.opacity = 0.35 + 0.25 * Math.sin(this.t * 3);
  }
}

/** What buildMycoraArena leaves in the grove for the fight. */
export class MycoraGrove implements Prop {
  readonly caps: BounceCap[] = [];
  constructor(readonly cx: number, readonly cz: number, readonly r: number, readonly floor: number) {}

  /** The bounce caps sprout (the canopy phase). */
  wake(): void {
    for (const c of this.caps) c.awake = true;
  }

  /** Back under the floor (the fight starts over, or is won). */
  sleep(): void {
    for (const c of this.caps) c.awake = false;
  }

  get awake(): boolean {
    return this.caps.some((c) => c.awake);
  }

  update(dt: number): void {
    for (const c of this.caps) c.update(dt);
  }
}

const groves = new WeakMap<Level, MycoraGrove>();

/** The grove the current level built for Mycora, if any. */
export function mycoraGrove(g: Game): MycoraGrove | null {
  return (g.level && groves.get(g.level)) ?? null;
}

/**
 * Builds whatever the fight needs inside Mycora's grove (a round, flat floor
 * of radius `r` around (cx, cz), left clear by the realm): the Mother Cap she
 * climbs into, a ring of canopy caps round the rim, mycelium veins across the
 * floor, and four sleeping bounce caps. The realm calls this before its bossFight().
 */
export function buildMycoraArena(b: Builder, cx: number, cz: number, r: number): void {
  const g = b.game;
  const floor = b.y(cx, cz);
  const grove = new MycoraGrove(cx, cz, r, floor);
  const bark = mat(0x1e1628, { rough: 0.9, flat: true });
  const pale = mat(0xd8ccdc, { rough: 0.8, emissive: 0x2a2a3a, emissiveIntensity: 0.5 });
  const stat = (m: THREE.Mesh, cast = true) => {
    m.castShadow = cast;
    m.receiveShadow = true;
    b.addStatic(m);
  };
  // The Mother Cap overhead: vast and dark, glowing gills under it, roots hanging down.
  const top = floor + 20;
  const mother = new THREE.Mesh(new THREE.SphereGeometry(10.5, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x4a1658, { rough: 0.6, emissive: 0x2a0a38, emissiveIntensity: 0.6 }));
  mother.scale.y = 0.34;
  mother.position.set(cx, top, cz);
  stat(mother, false);
  const gillsM = new THREE.Mesh(new THREE.CylinderGeometry(10.2, 2.5, 1.2, 36, 1, true), glowShared(0x7a2a78));
  gillsM.position.set(cx, top - 0.5, cz);
  stat(gillsM, false);
  const under = new THREE.Mesh(new THREE.CircleGeometry(2.6, 16), glowShared(0x5a1a60));
  under.rotation.x = Math.PI / 2;
  under.position.set(cx, top - 1.1, cz);
  stat(under, false);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const rr = 5 + (i % 3) * 1.6;
    const len = 3 + (i % 4) * 1.4;
    const x = cx + Math.sin(a) * rr;
    const z = cz + Math.cos(a) * rr;
    const hang = new THREE.Mesh(taperedTube([V(0, 0, 0), V(0.3, -len * 0.5, 0.2), V(-0.1, -len, 0)], 0.22, 0.03, 8, 5), bark);
    hang.position.set(x, top - 0.4, z);
    stat(hang, false);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), glowShared(SPORE_GLOW));
    tip.position.set(x - 0.1, top - 0.4 - len, z);
    stat(tip, false);
  }
  // Roots from the cavern roof that hold the Mother Cap up.
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const root = new THREE.Mesh(taperedTube([V(Math.sin(a) * 9, 16, Math.cos(a) * 9), V(Math.sin(a) * 5, 6, Math.cos(a) * 5), V(Math.sin(a) * 2.5, 0.5, Math.cos(a) * 2.5)], 1.1, 0.5, 12, 8, false), bark);
    root.position.set(cx, top, cz);
    stat(root, false);
  }
  // Canopy caps round the rim, leaning in.
  const capCols = [0x3ae0d0, 0x9a6aff, 0x6ab8ff, 0xff6ab8];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + Math.PI / 7;
    // The south side (where the dragon walks in) stays open.
    if (Math.abs(angleDiff(a, Math.PI)) < 0.5) continue;
    const sr = r - 1.2;
    const x = cx + Math.sin(a) * sr;
    const z = cz + Math.cos(a) * sr;
    const h = 11 + (i % 3) * 2;
    const lean = 0.18;
    const tx = x - Math.sin(a) * h * Math.sin(lean);
    const tz = z - Math.cos(a) * h * Math.sin(lean);
    const stalk = new THREE.Mesh(taperedTube([V(x, floor - 0.5, z), V((x * 2 + tx) / 3, floor + h * 0.4, (z * 2 + tz) / 3), V(tx, floor + h, tz)], 1.0, 0.7, 10, 10, false), pale);
    stat(stalk);
    const col = capCols[i % capCols.length]!;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(5 + (i % 2), 22, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(col, { rough: 0.55, emissive: col, emissiveIntensity: 0.55 }));
    cap.scale.y = 0.4;
    cap.position.set(tx, floor + h, tz);
    stat(cap);
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(4.8 + (i % 2), 0.9, 0.5, 22, 1, true), glowShared(0x2a3a44));
    gl.position.set(tx, floor + h - 0.2, tz);
    stat(gl, false);
    b.col.add(makeCyl(x, z, 1.0, floor - 1, floor + h * 0.6));
  }
  // Mycelium veins across the floor, all running to her.
  const veinM = glowShared(0x24463e);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.13;
    let px = cx + Math.sin(a) * 3.5;
    let pz = cz + Math.cos(a) * 3.5;
    let ang = a;
    for (let k = 0; k < 4; k++) {
      ang += (((i * 7 + k * 3) % 5) - 2) * 0.12;
      const len = (r - 5) / 4;
      const nx = px + Math.sin(ang) * len;
      const nz = pz + Math.cos(ang) * len;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.22 - k * 0.03, 0.06, len + 0.1), veinM);
      seg.position.set((px + nx) / 2, floor + 0.03, (pz + nz) / 2);
      seg.rotation.y = ang;
      stat(seg, false);
      px = nx;
      pz = nz;
    }
  }
  // Small glowing caps around the rim.
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + 0.2;
    if (Math.abs(angleDiff(a, Math.PI)) < 0.25) continue;
    const rr = r - 3 + (i % 3) * 0.8;
    const x = cx + Math.sin(a) * rr;
    const z = cz + Math.cos(a) * rr;
    const s = 0.5 + (i % 4) * 0.2;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.12 * s, 0.8 * s, 6), pale);
    st.position.set(x, floor + 0.4 * s, z);
    stat(st, false);
    const col = capCols[i % capCols.length]!;
    const cm = new THREE.Mesh(new THREE.SphereGeometry(0.45 * s, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), glowShared(col));
    cm.scale.y = 0.5;
    cm.position.set(x, floor + 0.8 * s, z);
    stat(cm, false);
  }
  // Four bounce caps, asleep under the floor until she climbs.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    grove.caps.push(new BounceCap(g, b.level, cx + Math.sin(a) * 6.8, floor, cz + Math.cos(a) * 6.8));
  }
  b.level.props.push(grove);
  groves.set(b.level, grove);
  b.level.on('boss-reset', () => grove.sleep());
}

// ---------------------------------------------------------------------------
// Her body
// ---------------------------------------------------------------------------

type Act =
  | 'idle' | 'sweep' | 'lob' | 'roar' | 'gasp' | 'collapse' | 'rise' | 'tear' | 'walk' | 'slam' | 'stuck' | 'swipe'
  | 'blight' | 'reel' | 'climb' | 'hang' | 'rain' | 'lash' | 'fall' | 'downed';

/** Where her three spore sacs sit on her body (angle round her, height, radius out). */
const SACS: [number, number, number][] = [[0.8, 3.6, 1.55], [-0.8, 3.6, 1.55], [Math.PI, 3.9, 1.45]];

class MycoraModel implements EnemyModel {
  readonly root = new THREE.Group();
  private body = new THREE.Group();
  private torso = new THREE.Group();
  private head = new THREE.Group();
  private cap = new THREE.Group();
  private arms: { sh: THREE.Group; el: THREE.Group; side: number }[] = [];
  private roots: THREE.Group[] = [];
  private hyphae: THREE.Group[] = [];
  readonly sacs: THREE.Mesh[] = [];
  private scars: THREE.Mesh[] = [];
  private sacMats: THREE.MeshBasicMaterial[] = [];
  private mats: THREE.MeshStandardMaterial[] = [];
  private gillMat: THREE.MeshBasicMaterial;
  private eyeMat: THREE.MeshBasicMaterial;
  private mouthMat: THREE.MeshBasicMaterial;
  private veinMat: THREE.MeshBasicMaterial;
  private spotMat: THREE.MeshBasicMaterial;
  private heartMat = glow(0x5a2a5a);
  private heart: THREE.Mesh;
  private mouth: THREE.Mesh;
  private t = 0;
  private P = {
    lift: 0, bend: 0, back: 0, twist: 0, head: 0, capTilt: 0, armLx: 0, armLz: 0, armRx: 0, armRz: 0, elbowL: 0, elbowR: 0,
    swell: 0, mouth: 0, gills: 0.2, rootLift: 0, sink: 0, heart: 0,
  };
  // Driven by the boss.
  act: Act = 'idle';
  /** 0..1 through the current act (windup then strike, as the act likes). */
  k = 0;
  /** Which arm leads a one-armed act (1 right, -1 left). */
  side = 1;
  /** How fast she is walking (0..1). */
  walk = 0;
  /** Sweep angle relative to her facing, for the twist that follows her root. */
  sweepRel = 0;
  sacAlive = [true, true, true];
  sacHeat = [0, 0, 0];

  constructor() {
    const pale = this.skin(0xd4c6de, 0.8);
    const pale2 = this.skin(0xb8a8c8, 0.85);
    const bark = this.skin(0x241a2c, 0.9, true);
    const capM = this.skin(0x6a1e7a, 0.55);
    const claw = mat(0xe0d0b8, { rough: 0.5 });
    this.gillMat = glow(0xc84aa8);
    this.eyeMat = glow(0xeaff9a);
    this.mouthMat = glow(0xff7ad8);
    this.veinMat = glow(ROOT_VEIN);
    this.spotMat = glow(SPORE_GLOW);
    this.root.add(this.body);
    // The roots she stands in: a skirt that becomes legs when she tears free.
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.2;
      const rg = new THREE.Group();
      rg.position.set(Math.sin(a) * 1.7, 0.7, Math.cos(a) * 1.7);
      rg.rotation.y = a;
      this.root.add(rg);
      const len = 3.2 + (i % 3) * 0.6;
      rg.add(new THREE.Mesh(taperedTube([V(0, 0, 0), V(0, 0.45, len * 0.45), V(0, -0.35, len * 0.85), V(0, -1.1, len)], 0.55, 0.12, 10, 8), bark));
      const v = ellipsoid(0.07, 0.07, len * 0.35, this.veinMat, 5);
      v.position.set(0, 0.62, len * 0.4);
      rg.add(v);
      this.roots.push(rg);
    }
    // A gown of woven mycelium, bound in black roots.
    const gown = new THREE.Mesh(new THREE.LatheGeometry([[2.5, 0.1], [2.4, 0.8], [2.0, 1.7], [1.6, 2.6], [1.35, 3.3], [1.2, 3.5]].map(([x, y]) => new THREE.Vector2(x, y)), 20), pale);
    gown.castShadow = true;
    this.body.add(gown);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 6; k++) {
        const y = 0.2 + k * 0.52;
        const rr = lerp(2.5, 1.3, k / 6) + 0.05;
        const aa = a + k * 0.35;
        pts.push(V(Math.sin(aa) * rr, y, Math.cos(aa) * rr));
      }
      this.body.add(new THREE.Mesh(taperedTube(pts, 0.14, 0.08, 18, 6), bark));
    }
    for (let i = 0; i < 14; i++) {
      const a = i * 2.39;
      const y = 0.5 + (i % 5) * 0.55;
      const rr = lerp(2.45, 1.35, y / 3.3);
      const v = ellipsoid(0.05, 0.3, 0.05, this.veinMat, 5);
      v.position.set(Math.sin(a) * rr, y, Math.cos(a) * rr);
      v.rotation.set(Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3);
      this.body.add(v);
    }
    // Torso, sacs, arms, head.
    this.torso.position.y = 3.2;
    this.body.add(this.torso);
    const chest = ellipsoid(1.45, 1.5, 1.15, pale, 18);
    chest.position.y = 0.9;
    this.torso.add(chest);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.28, 8, 20), pale2);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 1.95;
    this.torso.add(collar);
    for (const [i, [a, y, rr]] of SACS.entries()) {
      const sm = glow(SPORE_GLOW);
      this.sacMats.push(sm);
      const sac = ellipsoid(0.55, 0.66, 0.55, sm, 14);
      sac.position.set(Math.sin(a) * rr, y - 3.2, Math.cos(a) * rr);
      this.torso.add(sac);
      this.sacs.push(sac);
      // Burst, it shrivels to a husk.
      const scar = ellipsoid(0.34, 0.42, 0.24, mat(0x4a4028, { rough: 1, flat: true }), 7);
      scar.position.copy(sac.position).multiplyScalar(0.96);
      scar.position.y = sac.position.y - 0.1;
      scar.rotation.set(0.3, a, 0.4);
      scar.visible = false;
      this.torso.add(scar);
      this.scars.push(scar);
      // Veins feeding each sac.
      for (let k = 0; k < 3; k++) {
        const v = ellipsoid(0.05, 0.45, 0.05, this.veinMat, 5);
        v.position.set(Math.sin(a + (k - 1) * 0.25) * rr * 0.92, y - 3.2 - 0.6, Math.cos(a + (k - 1) * 0.25) * rr * 0.92);
        this.torso.add(v);
      }
      void i;
    }
    for (const side of [1, -1]) {
      const sh = new THREE.Group();
      sh.position.set(side * 1.45, 1.45, 0.2);
      this.torso.add(sh);
      sh.add(new THREE.Mesh(taperedTube([V(0, 0, 0), V(side * 0.7, -0.6, 0.4), V(side * 1.1, -1.5, 0.8)], 0.42, 0.3, 8, 7), bark));
      const el = new THREE.Group();
      el.position.set(side * 1.1, -1.5, 0.8);
      sh.add(el);
      el.add(new THREE.Mesh(taperedTube([V(0, 0, 0), V(side * 0.2, -0.9, 0.6), V(side * 0.1, -1.7, 1.3)], 0.3, 0.16, 8, 7), bark));
      for (let c = -1; c <= 1; c++) {
        const cl = spike(0.1, 0.8, claw, 5);
        cl.position.set(side * 0.1 + c * 0.22, -1.7, 1.3);
        cl.rotation.set(1.9, 0, c * 0.35);
        el.add(cl);
      }
      const v = ellipsoid(0.06, 0.06, 0.6, this.veinMat, 5);
      v.position.set(side * 0.55, -0.75, 0.45);
      v.rotation.x = 0.8;
      sh.add(v);
      // Pale threads wound round the arm.
      const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.08, 6, 12), pale2);
      wrap.position.set(side * 0.6, -0.8, 0.45);
      wrap.rotation.set(0.9, 0, side * 0.4);
      sh.add(wrap);
      this.arms.push({ sh, el, side });
    }
    this.head.position.y = 2.35;
    this.torso.add(this.head);
    const face = ellipsoid(1.05, 1.2, 0.88, pale, 18);
    this.head.add(face);
    for (const sx of [-1, 1]) {
      const eye = ellipsoid(0.24, 0.15, 0.08, this.eyeMat, 10);
      eye.position.set(sx * 0.4, 0.12, 0.8);
      eye.rotation.z = sx * -0.35;
      this.head.add(eye);
      const brow = ellipsoid(0.34, 0.09, 0.12, pale2, 8);
      brow.position.set(sx * 0.4, 0.33, 0.76);
      brow.rotation.z = sx * -0.45;
      this.head.add(brow);
      // Tear tracks of glowing veins.
      const tr = ellipsoid(0.035, 0.32, 0.035, this.veinMat, 5);
      tr.position.set(sx * 0.44, -0.2, 0.8);
      this.head.add(tr);
    }
    this.mouth = ellipsoid(0.34, 0.07, 0.06, this.mouthMat, 10);
    this.mouth.position.set(0, -0.48, 0.8);
    this.head.add(this.mouth);
    // Her heart, glowing through the weave of her chest when she is laid open.
    this.heart = ellipsoid(0.55, 0.6, 0.25, this.heartMat, 12);
    this.heart.position.set(0, 0.95, 1.08);
    this.torso.add(this.heart);
    // The crowned cap.
    this.cap.position.y = 1.2;
    this.head.add(this.cap);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3.4, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), capM);
    dome.scale.y = 0.5;
    dome.castShadow = true;
    this.cap.add(dome);
    const gills = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 0.9, 0.45, 32, 1, true), this.gillMat);
    gills.position.y = -0.1;
    this.cap.add(gills);
    const rimRing = new THREE.Mesh(new THREE.TorusGeometry(3.32, 0.09, 6, 40), this.spotMat);
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = 0.04;
    this.cap.add(rimRing);
    for (let i = 0; i < 12; i++) {
      const a = i * 2.39 + 0.3;
      const rr = 0.9 + (i % 4) * 0.6;
      const h = Math.sqrt(Math.max(0, 1 - (rr / 3.4) ** 2)) * 1.7;
      const s = ellipsoid(0.26 - (i % 3) * 0.05, 0.07, 0.26 - (i % 3) * 0.05, this.spotMat, 8);
      s.position.set(Math.sin(a) * rr, h - 0.02, Math.cos(a) * rr);
      s.rotation.set(Math.cos(a) * rr * 0.28, 0, -Math.sin(a) * rr * 0.28);
      this.cap.add(s);
    }
    // A crown of stout spires, each tipped with a little glowing cap.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const h = 1.0 + (i % 2) * 0.45;
      const sp = spike(0.3, h, bark, 6);
      sp.position.set(Math.sin(a) * 1.1, 1.3, Math.cos(a) * 1.1);
      sp.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5);
      this.cap.add(sp);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), this.spotMat);
      tip.scale.y = 0.55;
      tip.position.set(Math.sin(a) * (1.1 + h * 0.48), 1.3 + h * 0.88, Math.cos(a) * (1.1 + h * 0.48));
      tip.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5);
      this.cap.add(tip);
    }
    // Hyphae hanging from the rim, swaying.
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.15;
      const hg = new THREE.Group();
      hg.position.set(Math.sin(a) * 3.0, -0.05, Math.cos(a) * 3.0);
      this.cap.add(hg);
      const len = 1.4 + (i % 3) * 0.6;
      hg.add(new THREE.Mesh(taperedTube([V(0, 0, 0), V(0.05, -len * 0.5, 0), V(0, -len, 0)], 0.06, 0.02, 6, 4), pale2));
      const bead = ellipsoid(0.07, 0.09, 0.07, this.spotMat, 6);
      bead.position.y = -len;
      hg.add(bead);
      this.hyphae.push(hg);
    }
    this.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    // The parts that change on their own stay separate; everything else is one draw per material per joint.
    for (const m of [...this.sacs, ...this.scars, this.heart, this.mouth]) m.userData.keep = true;
    mergeStatic(this.root);
  }

  private skin(color: number, rough = 0.7, flat = false): THREE.MeshStandardMaterial {
    const m = matUnique(color, { rough, flat });
    this.mats.push(m);
    return m;
  }

  setFlash(amount: number, color: number): void {
    for (const m of this.mats) {
      m.emissive.setHex(color);
      m.emissiveIntensity = amount;
    }
  }

  rim(color: number, strength: number): void {
    for (const m of this.mats) addRim(m, color, strength);
  }

  dispose(): void {
    for (const m of this.mats) m.dispose();
    for (const m of [this.gillMat, this.eyeMat, this.mouthMat, this.veinMat, this.spotMat, this.heartMat, ...this.sacMats]) m.dispose();
  }

  /** A sac's world position (for the fire that has to reach it). */
  sacWorld(i: number, out: THREE.Vector3): THREE.Vector3 {
    return this.sacs[i]!.getWorldPosition(out);
  }

  update(dt: number, pose: EnemyPose): void {
    this.t += dt;
    const t = this.t;
    const P = this.P;
    const k = this.k;
    const e = (a: number, b: number) => smoothstep(a, b, k);
    let lift = 0;
    let bend = Math.sin(t * 0.7) * 0.03;
    let back = 0;
    let twist = Math.sin(t * 0.5) * 0.05;
    let head = Math.sin(t * 0.9) * 0.05;
    let capTilt = Math.sin(t * 0.8) * 0.03;
    let armLx = -0.1 + Math.sin(t * 1.1) * 0.08;
    let armRx = -0.1 + Math.sin(t * 1.1 + 1) * 0.08;
    let armLz = 0.1;
    let armRz = 0.1;
    let elbowL = -0.3;
    let elbowR = -0.3;
    let swell = Math.sin(t * 1.3) * 0.015;
    let mouth = 0.1;
    let gills = 0.25 + Math.sin(t * 1.7) * 0.08;
    let rootLift = 0;
    let sink = 0;
    let heart = 0;
    let rate = 6;
    const side = this.side;
    const setArm = (s: number, x: number, z: number, el: number) => {
      if (s > 0) {
        armRx = x;
        armRz = z;
        elbowR = el;
      } else {
        armLx = x;
        armLz = z;
        elbowL = el;
      }
    };
    switch (this.act) {
      case 'sweep':
        // One arm down to the floor, driving the root round; she turns with it.
        setArm(side, -0.4, 0.9, -0.2);
        twist = clamp(this.sweepRel, -1.2, 1.2) * 0.35;
        bend = 0.15;
        gills = 0.5 + k * 0.4;
        mouth = 0.3;
        rate = 8;
        break;
      case 'lob':
        back = k < 0.7 ? e(0, 0.7) * 0.3 : 0.3 - e(0.7, 0.8) * 0.5;
        capTilt = -back * 0.6;
        armLx = armRx = -1.2 * e(0, 0.7);
        gills = 0.4 + k;
        mouth = 0.3 + k * 0.5;
        rate = 10;
        break;
      case 'roar':
        back = 0.25;
        head = -0.3;
        armLx = armRx = -1.6;
        armLz = armRz = 0.9;
        mouth = 1;
        gills = 1.4;
        rate = 8;
        break;
      case 'gasp':
        swell = k < 0.8 ? e(0, 0.8) * 0.08 : 0.08 - e(0.8, 0.9) * 0.14;
        gills = 0.4 + k * 1.2;
        mouth = 0.5 + k * 0.5;
        head = -0.15;
        armLz = armRz = 0.5;
        rate = 10;
        break;
      case 'collapse':
      case 'downed':
        // Slumped back on her roots, face to the canopy, her heart laid open.
        lift = -1.25;
        back = 0.55;
        head = -0.35;
        capTilt = -0.25;
        armLx = armRx = 0.35;
        armLz = armRz = 1.15;
        elbowL = elbowR = 0.4;
        gills = 0.7 + Math.sin(t * 6) * 0.35;
        mouth = 0.6;
        heart = 1;
        rate = 4;
        break;
      case 'rise':
        lift = -1.25 * (1 - e(0, 1));
        back = 0.55 * (1 - e(0, 1));
        heart = 1 - e(0.3, 1);
        gills = 0.8;
        rate = 5;
        break;
      case 'tear':
        lift = e(0.2, 0.8) * 0.9;
        back = 0.25 * e(0, 0.5);
        head = -0.3;
        armLx = armRx = -1.8;
        armLz = armRz = 0.8;
        mouth = 1;
        gills = 1.3;
        rootLift = e(0.2, 0.9);
        rate = 5;
        break;
      case 'walk':
        lift = 0.9 + Math.abs(Math.sin(t * 3.2)) * 0.15 * this.walk;
        bend = 0.1;
        rootLift = 1;
        twist = Math.sin(t * 3.2) * 0.08 * this.walk;
        armLx = -0.2 + Math.sin(t * 3.2) * 0.25 * this.walk;
        armRx = -0.2 - Math.sin(t * 3.2) * 0.25 * this.walk;
        break;
      case 'slam': {
        // Both arms up over the cap, then down.
        const up = k < 0.75 ? e(0, 0.75) : 1 - e(0.75, 0.82);
        lift = 0.9;
        rootLift = 1;
        armLx = armRx = lerp(0.6, -2.6, up);
        armLz = armRz = 0.35;
        elbowL = elbowR = lerp(0.1, -0.5, up);
        back = up * 0.25 - (k > 0.78 ? 0.5 : 0);
        bend = k > 0.78 ? 0.45 : 0;
        gills = 0.4 + up;
        mouth = 0.3 + up * 0.6;
        rate = k > 0.75 ? 22 : 9;
        break;
      }
      case 'stuck':
        heart = 0.7;
        lift = 0.6;
        rootLift = 1;
        bend = 0.5 + Math.sin(t * 9) * 0.04;
        armLx = armRx = 0.55;
        armLz = armRz = 0.3;
        elbowL = elbowR = 0.2;
        gills = 0.9 + Math.sin(t * 8) * 0.2;
        mouth = 0.6;
        head = 0.2;
        rate = 8;
        break;
      case 'swipe': {
        const w = k < 0.6 ? e(0, 0.6) : 1;
        const s = k < 0.6 ? 0 : e(0.6, 0.75);
        lift = 0.9;
        rootLift = 1;
        setArm(side, lerp(-0.3, -1.2, w), lerp(0.4, 1.4, w) - s * 2.4, -0.2);
        twist = side * (0.5 * w - 1.1 * s);
        gills = 0.4 + w * 0.6;
        rate = k < 0.6 ? 9 : 24;
        break;
      }
      case 'blight':
        lift = 0.9;
        rootLift = 1;
        head = -0.1 + k * 0.5;
        bend = k * 0.3;
        mouth = 0.4 + k * 0.6;
        gills = 0.6 + k;
        armLz = armRz = 0.6;
        rate = 8;
        break;
      case 'reel':
        heart = 0.6;
        lift = 0.5;
        rootLift = 1;
        back = 0.45;
        head = -0.4;
        armLx = armRx = -1.2 + Math.sin(t * 10) * 0.3;
        armLz = armRz = 1.0;
        mouth = 0.8;
        gills = 0.8;
        rate = 8;
        break;
      case 'climb':
      case 'hang':
      case 'rain':
      case 'lash': {
        // Hauling on root ropes, arms up; her roots dangle.
        armLx = armRx = -2.6 + Math.sin(t * 1.5) * 0.1;
        armLz = armRz = 0.35;
        elbowL = elbowR = -0.2;
        rootLift = 1.6;
        head = 0.2;
        gills = 0.4;
        if (this.act === 'rain') {
          gills = 0.5 + k;
          mouth = 0.4 + k * 0.5;
          head = 0.35;
        } else if (this.act === 'lash') {
          setArm(side, lerp(-2.6, 0.4, e(0.55, 0.75)), 0.3, -0.1);
          gills = 0.5 + k * 0.8;
        }
        rate = 6;
        break;
      }
      case 'fall':
        armLx = armRx = -2.2 + Math.sin(t * 14) * 0.4;
        armLz = armRz = 1.1;
        rootLift = 1.4;
        mouth = 1;
        rate = 10;
        break;
      default:
        break;
    }
    if (pose.dead) {
      lift = -1.4;
      back = 0.6;
      head = -0.4;
      armLz = armRz = 1.0;
      armLx = armRx = -0.4;
      gills = Math.max(0, 1 - pose.deadT * 0.5);
      sink = -Math.max(0, pose.deadT - 0.6) * 1.6;
      rate = 3;
    }
    P.lift = damp(P.lift, lift, rate, dt);
    P.bend = damp(P.bend, bend, rate, dt);
    P.back = damp(P.back, back, rate, dt);
    P.twist = damp(P.twist, twist, rate, dt);
    P.head = damp(P.head, head, rate, dt);
    P.capTilt = damp(P.capTilt, capTilt, rate, dt);
    P.armLx = damp(P.armLx, armLx, rate * 1.4, dt);
    P.armRx = damp(P.armRx, armRx, rate * 1.4, dt);
    P.armLz = damp(P.armLz, armLz, rate * 1.4, dt);
    P.armRz = damp(P.armRz, armRz, rate * 1.4, dt);
    P.elbowL = damp(P.elbowL, elbowL, rate * 1.4, dt);
    P.elbowR = damp(P.elbowR, elbowR, rate * 1.4, dt);
    P.swell = damp(P.swell, swell, 12, dt);
    P.mouth = damp(P.mouth, mouth, 12, dt);
    P.gills = damp(P.gills, gills, 8, dt);
    P.rootLift = damp(P.rootLift, rootLift, 3, dt);
    P.sink = damp(P.sink, sink, 4, dt);
    P.heart = damp(P.heart, heart, 6, dt);
    this.body.position.y = P.lift + P.sink;
    this.body.rotation.set(0, P.twist, 0);
    this.body.scale.setScalar(1 + P.swell);
    this.torso.rotation.set(P.bend - P.back, 0, 0);
    this.head.rotation.set(P.head, 0, 0);
    this.cap.rotation.set(P.capTilt, t * 0.05, Math.sin(t * 0.6) * 0.03);
    for (const a of this.arms) {
      const r = a.side > 0;
      a.sh.rotation.set(r ? P.armRx : P.armLx, 0, a.side * (r ? P.armRz : P.armLz));
      a.el.rotation.set(r ? P.elbowR : P.elbowL, 0, 0);
    }
    const walkPh = t * 3.2;
    for (const [i, rg] of this.roots.entries()) {
      // Rooted: pressed flat. Torn free: they lift and step. Hanging: they dangle.
      const step = P.rootLift > 0.5 && P.rootLift < 1.2 ? Math.max(0, Math.sin(walkPh + i * 2.1)) * 0.35 * this.walk : 0;
      const dangle = Math.max(0, P.rootLift - 1) * 2;
      rg.rotation.x = -Math.min(1, P.rootLift) * 0.25 - step + dangle * (0.9 + Math.sin(t * 2 + i) * 0.1);
      rg.position.y = 0.7 + Math.min(1, P.rootLift) * 0.2;
    }
    for (const [i, hg] of this.hyphae.entries()) {
      hg.rotation.x = Math.sin(t * 1.3 + i) * 0.12;
      hg.rotation.z = Math.cos(t * 1.1 + i * 1.7) * 0.12;
    }
    this.mouth.scale.set(0.34, 0.07 + P.mouth * 0.24, 0.06);
    this.heartMat.color.setHex(0x5a2a5a).lerp(new THREE.Color(0xff8ae0), clamp(P.heart * (0.75 + 0.25 * Math.sin(t * 7)), 0, 1));
    this.heart.scale.set(0.55 * (1 + P.heart * 0.15), 0.6 * (1 + P.heart * 0.15), 0.25);
    this.gillMat.color.setHex(0xc84aa8).lerp(new THREE.Color(0xffe0f4), clamp(P.gills - 0.4, 0, 1));
    this.eyeMat.color.setHex(0xeaff9a).multiplyScalar(pose.dead ? Math.max(0.1, 1 - pose.deadT * 0.6) : 1);
    for (let i = 0; i < 3; i++) {
      const alive = this.sacAlive[i]!;
      const sac = this.sacs[i]!;
      const s = alive ? 1 + Math.sin(t * 3 + i * 2) * 0.08 + this.sacHeat[i]! * 0.25 : 0.001;
      sac.scale.set(0.55 * s, 0.66 * s, 0.55 * s);
      sac.visible = alive;
      this.scars[i]!.visible = !alive;
      // Heating up: yellow-green to orange to white-hot.
      const h = this.sacHeat[i]!;
      this.sacMats[i]!.color.setHex(SPORE_GLOW).lerp(new THREE.Color(0xff8a30), clamp(h * 1.4, 0, 1)).lerp(new THREE.Color(0xffffff), clamp(h * 2 - 1.2, 0, 1));
    }
  }
}

// ---------------------------------------------------------------------------
// The fight
// ---------------------------------------------------------------------------

export const MYCORA_DEF: EnemyDef = {
  id: 'mycora', name: 'Mycora', hp: 1800, radius: 2.8, height: 8.2, speed: 2.7, turnRate: 1.6, mass: 0, poise: 280,
  resist: { fire: 1.25, ice: 0.9 }, statusResist: { fire: 0.5, ice: 0.4, lightning: 0.5 }, aggroRange: 60,
  gems: { blue: 200, red: 8, green: 6, purple: 8 },
  attacks: [],
  build: () => new MycoraModel(),
  styleValue: 10,
};

/** A stand-in AttackDef for the flash and the HUD's threat arrow while she winds something up. */
const tele = (id: string, windup: number, kind: AttackDef['kind'], knockback = 10): AttackDef => ({
  id, pose: id, range: 99, windup, active: 0.2, recover: 0.5, cooldown: 0, weight: 1, kind, damage: 10, knockback, telegraph: kind === 'slam',
});

/** One of her spore sacs: a target only Fire can hurt. */
class Sac implements Hittable {
  readonly isEnemy = false;
  readonly radius = 0.8;
  readonly height = 1.4;
  alive = true;
  x = 0;
  y = 0;
  z = 0;
  heat = 0;
  constructor(private boss: Mycora, readonly i: number) {}
  takeHit(hit: Hit): HitResult {
    return this.boss.hitSac(this, hit);
  }
}

type Mode =
  | 'dormant' | 'idle' | 'sweep' | 'lob' | 'call' | 'gasp' | 'collapse' | 'rise'
  | 'tear' | 'stalk' | 'slam' | 'stuck' | 'swipe' | 'blight' | 'reel'
  | 'climb' | 'hang' | 'rain' | 'lash' | 'drop' | 'fall' | 'downed';

const tmpV = new THREE.Vector3();

export class Mycora extends Boss {
  readonly displayName = 'Mycora, the Spore Mother';
  mode: Mode = 'dormant';
  private modeT = 0;
  private readonly m: MycoraModel;
  private readonly world = new THREE.Group();
  private readonly marks: GroundMark[] = [];
  private readonly sweepRoot = new THREE.Group();
  private readonly lashRoot = new THREE.Group();
  private readonly ropes: THREE.Mesh[] = [];
  private readonly sacs: Sac[];
  private readonly grove: MycoraGrove;
  private readonly cx: number;
  private readonly cz: number;
  private readonly floor: number;
  private brood: Enemy[] = [];
  private puffs: Enemy[] = [];
  private patches: ReturnType<NonNullable<ReturnType<typeof sporeField>>['patch']>[] = [];
  private told = new Set<string>();
  private pattern = 0;
  private nextIn = 2;
  private hugT = 0;
  private callCd = 3;
  private puffCd = 0;
  // Attack bookkeeping.
  private sweepA = 0;
  private sweepDir = 1;
  private sweepLeft = 0;
  private sweepHit = false;
  private slams = 0;
  private slamX = 0;
  private slamZ = 0;
  private struck = false;
  private lashX = 0;
  private lashZ = 0;
  private lashes = 0;
  private canopyDmg = 0;
  private final = false;
  private hangY = 0;
  private fxT = 0;
  private disposed = false;
  /** How many times she has collapsed, reeled, stuck or fallen (tests read these). */
  readonly stats = { collapses: 0, stagger: 0, stuck: 0, falls: 0, sacsBurst: 0, sweeps: 0, slams: 0, lobs: 0, calls: 0, blights: 0, rains: 0, lashes: 0 };

  constructor(game: Game, x: number, y: number, z: number, yaw: number) {
    super(game, MYCORA_DEF, x, y, z, yaw);
    this.speakerId = 'mycora';
    this.phases = 3;
    this.m = this.model as MycoraModel;
    this.cx = x;
    this.cz = z;
    this.floor = y;
    let grove = mycoraGrove(game);
    if (!grove && game.level) {
      // The realm forgot the arena (or a test spawned her bare): build it now.
      buildMycoraArena(new Builder(game, game.level), x, z, 24);
      grove = mycoraGrove(game);
    }
    this.grove = grove ?? new MycoraGrove(x, z, 24, y);
    // The sweeping root: a long thorny tendril lying along +z.
    const bark = mat(0x241a2c, { rough: 0.9, flat: true });
    const thorn = mat(0x3a2c46, { rough: 0.8 });
    const tend = new THREE.Mesh(taperedTube([V(0, 0.2, 2.2), V(0, 1.0, 5), V(0, 0.8, 9), V(0, 0.35, 13.2)], 0.6, 0.14, 16, 8), bark);
    tend.castShadow = true;
    this.sweepRoot.add(tend);
    // A hot seam along its top, so it reads against a dark floor.
    const seam = new THREE.Mesh(taperedTube([V(0, 0.75, 2.4), V(0, 1.55, 5), V(0, 1.3, 9), V(0, 0.55, 13.1)], 0.14, 0.05, 16, 5), glowShared(ROOT_HOT));
    this.sweepRoot.add(seam);
    for (let i = 0; i < 9; i++) {
      const z = 3 + i * 1.2;
      const th = spike(0.09, 0.6, thorn, 4);
      th.position.set(0, 0.9 - Math.abs(z - 6) * 0.05, z);
      th.rotation.set(-0.4, 0, (i % 2 ? 1 : -1) * 0.5);
      this.sweepRoot.add(th);
      const v = new THREE.Mesh(new THREE.SphereGeometry(1, 6, 4), glowShared(ROOT_HOT));
      v.scale.set(0.09, 0.09, 0.4);
      v.position.set(0, 0.95 - Math.abs(z - 6) * 0.05, z);
      this.sweepRoot.add(v);
    }
    this.sweepRoot.visible = false;
    const lash = new THREE.Mesh(taperedTube([V(0, 0, 0), V(0.15, -0.5, 0.1), V(0, -1, 0)], 0.3, 0.14, 10, 6), bark);
    this.lashRoot.add(lash);
    const lashGlow = new THREE.Mesh(taperedTube([V(0, 0, 0.18), V(0.15, -0.5, 0.26), V(0, -1, 0.12)], 0.06, 0.04, 10, 4), glowShared(ROOT_HOT));
    this.lashRoot.add(lashGlow);
    this.lashRoot.visible = false;
    // Her ropes up to the Mother Cap: pale mycelium, glowing faintly.
    const ropeM = mat(0xd8c8e8, { rough: 0.8, emissive: 0x6a4a8a, emissiveIntensity: 0.6 });
    for (let i = 0; i < 4; i++) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1, 6), ropeM);
      r.visible = false;
      this.world.add(r);
      this.ropes.push(r);
    }
    this.world.add(this.sweepRoot, this.lashRoot);
    game.scene.add(this.world);
    this.sacs = [0, 1, 2].map((i) => new Sac(this, i));
    game.level?.hittables.push(...this.sacs);
    // Dying mid-fight despawns her: take her brood, her blight and the bounce caps with her.
    game.level?.on('boss-reset', () => {
      if (!this.disposed) this.cleanup(false);
    });
  }

  // --- helpers ---------------------------------------------------------------------

  private get dmg(): number {
    return this.game.difficultyInfo.enemyDamage;
  }

  private get aggr(): number {
    return this.game.difficultyInfo.aggression;
  }

  private setMode(m: Mode): void {
    this.mode = m;
    this.modeT = 0;
    this.struck = false;
  }

  private tell(key: string, text: string, secs = 6): void {
    if (this.told.has(key)) return;
    this.told.add(key);
    this.game.hud.flick(text, secs);
  }

  /** Her voice, in a line on screen. */
  private say(text: string): void {
    this.game.toast(`Mycora: "${text}"`, 'warn');
  }

  private mark(x: number, z: number, r: number, dur: number, color = 0xff3a2a, fill = true): void {
    let mk = this.marks.find((q) => !q.active);
    if (!mk) {
      mk = new GroundMark(color);
      this.marks.push(mk);
      this.world.add(mk.root);
    }
    mk.show(x, this.floor, z, r, dur, color, fill);
  }

  /** Clamps a point into the grove (inside `edge` of its rim). */
  private inGrove(x: number, z: number, edge = 3): [number, number] {
    const dx = x - this.grove.cx;
    const dz = z - this.grove.cz;
    const d = Math.hypot(dx, dz);
    const R = this.grove.r - edge;
    if (d <= R) return [x, z];
    return [this.grove.cx + (dx / d) * R, this.grove.cz + (dz / d) * R];
  }

  /** Hits the dragon if within r of (x, z) and below `maxH` over the floor. */
  private strike(x: number, z: number, r: number, maxH: number, damage: number, knockback: number, launch: number, move: string): boolean {
    const p = this.game.player;
    const b = p.body;
    const d = Math.hypot(b.x - x, b.z - z);
    if (!p.alive || d > r + b.radius || b.y > this.floor + maxH) return false;
    const n = d || 1;
    p.takeHit(makeHit({
      damage: damage * this.dmg, dirX: d > 0.05 ? (b.x - x) / n : Math.sin(this.yaw), dirZ: d > 0.05 ? (b.z - z) / n : Math.cos(this.yaw),
      knockback, launch, source: 'enemy', move, fromPlayer: false, ox: x, oz: z,
    }), this);
    return true;
  }

  private get sacsLeft(): number {
    return this.sacs.filter((s) => s.alive).length;
  }

  private get up(): boolean {
    return this.mode === 'hang' || this.mode === 'rain' || this.mode === 'lash' || this.mode === 'drop';
  }

  /** Starts a windup: the flash, the threat arrow, the model's act. */
  private windup(a: AttackDef): void {
    this.tele = a;
    this.attack = a;
    this.state = 'windup';
    this.stateT = 0;
    this.body.vx = this.body.vz = 0;
    this.game.hud.threat(this);
    this.game.sfx('enemyAttack', this.x, this.y, this.z, a.kind === 'slam' ? 0.55 : 0.8, 1);
  }

  private settle(): void {
    this.attack = null;
    this.tele = null;
    this.state = 'chase';
  }

  /** The windup in progress (kept apart from `attack`, which a freeze or a shock clears). */
  private tele: AttackDef | null = null;

  // --- spore sacs --------------------------------------------------------------------

  /** Fire on a sac heats it; enough fire bursts it; nothing else does anything. */
  hitSac(s: Sac, hit: Hit): HitResult {
    const g = this.game;
    if (!s.alive || !this.alive || !this.awake || this.phase > 1) return 'none';
    if (hit.type !== 'fire' || !hit.fromPlayer) {
      if (hit.fromPlayer && hit.source !== 'enemy' && !hit.move.startsWith('nyxa:')) {
        g.fx.sparkle(s.x, s.y + s.height * 0.5, s.z, SPORE_GLOW, 3);
        this.tell('sac-fire', 'Those glowing sacs only care about Fire, Aster! Breath or fireballs, burn them!', 6);
      }
      return 'immune';
    }
    s.heat += hit.damage * (hit.source === 'breath' ? 1 : 1.5);
    g.fx.emit(s.x, s.y + s.height * 0.5, s.z, { count: 3, speed: 1.5, dir: [0, 1, 0], life: [0.3, 0.5], size: [0.3, 0.5], sizeEnd: 0.1, color: 0xffa040, bright: 2, gravity: -2 });
    if (s.heat >= SAC_HEAT) this.burstSac(s);
    return 'hit';
  }

  private burstSac(s: Sac): void {
    const g = this.game;
    s.alive = false;
    s.heat = 0;
    this.m.sacAlive[s.i] = false;
    this.stats.sacsBurst++;
    const cy = s.y + s.height * 0.5;
    g.fx.explosion(s.x, cy, s.z, 1.6, 0xffc050, 0x6a8a20);
    g.fx.emit(s.x, cy, s.z, { count: 40, speed: 6, spread: 1, life: [0.5, 1], size: [0.4, 0.8], sizeEnd: 1.6, color: 0xc8f070, alpha: 0.6, additive: false, drag: 2.5 });
    g.fx.emit(s.x, cy, s.z, { count: 20, speed: 5, spread: 1, life: [0.4, 0.8], size: [0.12, 0.2], sizeEnd: 0, color: SPORE_GLOW, bright: 2.4 });
    g.sfx('sacBurst', s.x, s.y, s.z);
    g.shake(0.3, 0.25);
    g.style.bonus(60);
    this.game.sfx('mycoraCry', this.x, this.y, this.z, 1.4, 0.6);
    const left = this.sacsLeft;
    if (left > 0) {
      g.toast(`Spore sac burst! ${left} to go.`, 'good');
      if (this.stats.sacsBurst === 1) this.say('My breath... you BURN my breath!');
    } else this.startCollapse();
  }

  /** Tearing free, she leaves her sacs behind: shrivelled husks. */
  private witherSacs(): void {
    for (const s of this.sacs) {
      s.alive = false;
      this.m.sacAlive[s.i] = false;
    }
  }

  private regrowSacs(): void {
    for (const s of this.sacs) {
      s.alive = true;
      s.heat = 0;
      this.m.sacAlive[s.i] = true;
    }
  }

  // --- taking hits -------------------------------------------------------------------

  /** How much of a blow gets through, by what she is doing. */
  private damageMul(): number {
    switch (this.mode) {
      case 'collapse':
      case 'downed':
        return 1.3;
      case 'stuck':
      case 'reel':
        return 1.4;
      case 'tear':
      case 'climb':
      case 'rise':
        return 0.15;
      default:
        if (this.phase === 1 && this.sacsLeft > 0) return 0.4;
        return 1;
    }
  }

  override takeHit(hit: Hit): HitResult {
    if (!this.alive || !this.awake || this.mode === 'dormant') return 'none';
    const mul = this.damageMul();
    const hp0 = this.hp;
    const r = super.takeHit(mul === 1 ? hit : { ...hit, damage: hit.damage * mul });
    if (mul < 1 && (r === 'hit' || r === 'killed') && hit.fromPlayer) {
      // The sacs feed her: a green shimmer where the blow soaks in.
      const g = this.game;
      g.fx.emit(this.x + (hit.ox - this.x) * 0.3, this.y + 3, this.z + (hit.oz - this.z) * 0.3, { count: 4, speed: 1.2, life: [0.3, 0.5], size: [0.2, 0.35], sizeEnd: 0, color: SPORE_GLOW, bright: 1.6, jitter: 1 });
      if (this.phase === 1 && this.sacsLeft > 0 && hit.source === 'melee' && !hit.move.startsWith('nyxa:')) {
        this.tell('sac', 'She\'s barely feeling that! It\'s those glowing sacs, Aster: burn them with Fire!', 7);
      }
    }
    this.clampHp();
    if (this.up) this.canopyDmg += Math.max(0, hp0 - this.hp);
    return r;
  }

  /** A phase never skips: she holds at each threshold until the next phase begins. */
  private clampHp(): void {
    const max = this.maxHp;
    if (this.phase === 1) this.hp = Math.max(this.hp, max * P2 - 0.5);
    else if (this.phase === 2) this.hp = Math.max(this.hp, max * P3 - 0.5);
    else if (this.up || this.mode === 'climb' || this.mode === 'fall') this.hp = Math.max(this.hp, 1);
  }

  override die(hit: Hit | null, reaction: Reaction | null = null): void {
    if (!this.alive) return;
    // Only on the floor, only in the last phase.
    if (this.phase < 3 || this.up || this.mode === 'climb' || this.mode === 'fall') {
      this.hp = Math.max(1, this.hp);
      this.clampHp();
      return;
    }
    this.cleanup(true);
    this.m.act = 'downed';
    super.die(hit, reaction);
    const g = this.game;
    g.fx.explosion(this.x, this.y + 4, this.z, 3, 0xc8f070, 0x6a2a8a);
    g.fx.emit(this.x, this.y + 5, this.z, { count: 80, speed: 7, spread: 1, life: [1, 2], size: [0.6, 1.2], sizeEnd: 2.4, color: 0xb8e060, alpha: 0.5, additive: false, drag: 1.5 });
    g.fx.emit(this.x, this.y + 5, this.z, { count: 60, speed: 6, spread: 1, life: [1, 2.2], size: [0.12, 0.22], sizeEnd: 0, color: SPORE_GLOW, bright: 2.4, gravity: -1 });
    g.sfx('mycoraCry', this.x, this.y, this.z, 0.8, 1.2);
  }

  protected override onBossStagger(_hit: Hit): void {
    // Heavy blows add up: in her walking phase, enough of them rock her back.
    if (this.phase !== 2 || this.mode === 'tear' || this.mode === 'stuck' || this.mode === 'reel') return;
    this.stats.stagger++;
    this.hideSweep();
    this.setMode('reel');
    this.settle();
    this.state = 'recover';
    this.game.toast('Mycora reels!', 'good');
    this.game.sfx('mycoraCry', this.x, this.y, this.z, 1.3, 0.8);
  }

  // --- the brain ----------------------------------------------------------------------

  protected override think(dt: number): void {
    const g = this.game;
    if (this.stunT > 0) this.afterStun();
    this.modeT += dt;
    this.m.act = this.act();
    if (!this.awake) {
      this.mode = 'dormant';
      this.yaw = approachAngle(this.yaw, this.yawToPlayer(), dt * 0.8);
      return;
    }
    if (this.mode === 'dormant') {
      this.setMode('idle');
      this.nextIn = 1.5;
      // Her own theme over the grove (the realm's bossFight starts the generic one).
      if (THEMES.mycora && g.boss === this) g.audio.setMusic(THEMES.mycora);
      this.tell('start', 'See those glowing sacs on her? Burn them with Fire, Aster! That\'s what\'s keeping her strong!', 7);
    }
    this.checkPhase();
    g.cam.extraDist = this.phase >= 3 ? 5 : 2.5;
    switch (this.mode) {
      case 'idle': this.idle(dt); break;
      case 'sweep': this.doSweep(dt); break;
      case 'lob': this.doLob(); break;
      case 'call': this.doCall(); break;
      case 'gasp': this.doGasp(); break;
      case 'collapse': this.doCollapse(); break;
      case 'rise': this.doRise(); break;
      case 'tear': this.doTear(); break;
      case 'stalk': this.stalk(dt); break;
      case 'slam': this.doSlam(dt); break;
      case 'stuck': this.doStuck(); break;
      case 'swipe': this.doSwipe(dt); break;
      case 'blight': this.doBlight(); break;
      case 'reel': this.doReel(); break;
      case 'climb': this.doClimb(dt); break;
      case 'hang': this.hang(dt); break;
      case 'rain': this.doRain(); break;
      case 'lash': this.doLash(); break;
      case 'drop': this.doDrop(); break;
      case 'fall': this.doFall(); break;
      case 'downed': this.doDowned(); break;
      default: break;
    }
    // Up in the canopy: tip the view up so she stays in sight (the player's own look still wins).
    if (this.up || (this.mode === 'climb' && this.hangY > 1)) {
      const inp = g.input;
      if (Math.abs(inp.lookY) < 1e-4 && Math.abs(inp.lookX) < 1e-4) {
        const want = g.player.y > this.floor + 4 ? 0.12 : -0.2;
        g.cam.pitch = damp(g.cam.pitch, want, g.player.lock ? 7 : 2.5, dt);
      }
    }
  }

  /** What the model should be doing. */
  private act(): Act {
    switch (this.mode) {
      case 'dormant': case 'idle': return this.phase >= 2 ? 'walk' : 'idle';
      case 'call': return 'roar';
      case 'drop': return 'hang';
      case 'stalk': return 'walk';
      default: return this.mode as Act;
    }
  }

  private checkPhase(): void {
    const g = this.game;
    const f = this.hpFrac;
    if (this.phase === 1 && f <= P2 + 0.001 && this.mode !== 'collapse') {
      this.phase = 2;
      this.hideSweep();
      this.settle();
      this.setMode('tear');
      this.witherSacs();
      g.sfx('rootRip', this.x, this.y, this.z);
      g.sfx('mycoraCry', this.x, this.y, this.z, 0.9, 1.1);
      g.shake(0.8, 1.2);
      this.say('Enough! I will come to you myself!');
    } else if (this.phase === 1 && f <= P2 + 0.001 && this.mode === 'collapse' && this.modeT > 1.2) {
      // Knocked past the threshold while collapsed: she tears free as she rises.
      this.phase = 2;
      this.setMode('tear');
      this.witherSacs();
      g.sfx('rootRip', this.x, this.y, this.z);
      g.shake(0.8, 1.2);
      this.say('Enough! I will come to you myself!');
    } else if (this.phase === 2 && f <= P3 + 0.001 && this.mode !== 'tear') {
      this.phase = 3;
      this.hideSweep();
      this.settle();
      this.setMode('climb');
      g.sfx('mycoraCry', this.x, this.y, this.z, 0.8, 1.2);
      g.shake(0.6, 0.8);
      this.say('Come up to me, little spark... if you can fly.');
    }
  }

  // --- phase 1: rooted ---------------------------------------------------------------

  private idle(dt: number): void {
    const g = this.game;
    const d = this.distToPlayer();
    // Rooted, she turns slowly: a dragon who keeps moving can get round to the sac on her back.
    this.yaw = approachAngle(this.yaw, this.yawToPlayer(), (this.phase === 1 ? 0.5 : this.def.turnRate) * dt);
    this.state = 'strafe';
    if (this.phase >= 2) {
      this.setMode('stalk');
      return;
    }
    this.nextIn -= dt;
    this.callCd -= dt;
    // Hugging her base earns a choking gasp.
    this.hugT = d < 6 ? this.hugT + dt : Math.max(0, this.hugT - dt);
    if (this.hugT > 1.6 && this.nextIn < 0.8) {
      this.hugT = 0;
      this.startGasp();
      return;
    }
    if (this.nextIn > 0) return;
    const order = ['lob', 'sweep', 'call', 'lob', 'sweep', 'lob', 'call', 'sweep'];
    let next = order[this.pattern++ % order.length]!;
    if (next === 'call' && (this.callCd > 0 || this.broodAlive() >= 5)) next = 'lob';
    if (next === 'lob') this.startLob();
    else if (next === 'sweep') this.startSweep();
    else this.startCall();
    void g;
  }

  private broodAlive(): number {
    this.brood = this.brood.filter((e) => e.alive);
    return this.brood.length;
  }

  private startSweep(): void {
    const g = this.game;
    const p = g.player.body;
    this.setMode('sweep');
    this.stats.sweeps++;
    // Starts a quarter turn away from the dragon, sweeping toward (and past) it.
    this.sweepDir = rng.chance(0.5) ? 1 : -1;
    const toP = yawOf(p.x - this.x, p.z - this.z);
    this.sweepA = toP - this.sweepDir * 1.6;
    this.sweepLeft = Math.PI * (this.phase >= 2 ? 1.6 : 1.35);
    this.sweepHit = false;
    this.m.side = this.sweepDir;
    this.windup(tele('sweep', 1.0, 'slam'));
    this.sweepRoot.visible = true;
    this.sweepRoot.position.set(this.x, this.floor - 1.2, this.z);
    this.sweepRoot.rotation.y = this.sweepA;
    // Its reach: everything inside this ring gets swept.
    this.mark(this.x, this.z, 13.6, 1.0 / this.aggr + this.sweepLeft / ((this.phase >= 2 ? 2.9 : 2.5) * this.aggr), 0xff3a2a, false);
    g.sfx('burrow', this.x + Math.sin(this.sweepA) * 7, this.floor, this.z + Math.cos(this.sweepA) * 7, 0.6, 1);
    this.tell('sweep', 'Her roots are sweeping the floor! Jump over them!', 5);
  }

  private hideSweep(): void {
    this.sweepRoot.visible = false;
  }

  private doSweep(dt: number): void {
    const g = this.game;
    const T = 1.0 / this.aggr;
    const root = this.sweepRoot;
    this.m.sweepRel = angleDiff(this.yaw, this.sweepA);
    if (this.modeT < T) {
      // The root heaves up out of the floor where it starts, glowing and shaking.
      const k = this.modeT / T;
      this.m.k = k;
      root.position.y = this.floor - 1.2 + smoothstep(0, 0.6, k) * 1.2 + Math.sin(this.modeT * 40) * 0.04;
      this.fxT -= dt;
      if (this.fxT <= 0) {
        this.fxT = 0.05;
        const r = 3 + rng.next() * 10;
        g.fx.dust(this.x + Math.sin(this.sweepA) * r, this.floor, this.z + Math.cos(this.sweepA) * r, 2, 0x5a4a60);
        // Sparks running ahead along the path it will take.
        const a = this.sweepA + this.sweepDir * rng.next() * 0.9;
        const rr = 3.5 + rng.next() * 9.5;
        g.fx.emit(this.x + Math.sin(a) * rr, this.floor + 0.15, this.z + Math.cos(a) * rr, { count: 1, speed: 1.5, dir: [0, 1, 0], life: [0.3, 0.5], size: [0.12, 0.2], sizeEnd: 0, color: ROOT_HOT, bright: 2 });
      }
      return;
    }
    this.state = 'active';
    root.position.y = this.floor;
    const speed = (this.phase >= 2 ? 2.9 : 2.5) * this.aggr;
    const step = Math.min(this.sweepLeft, speed * dt);
    const a0 = this.sweepA;
    this.sweepA += this.sweepDir * step;
    this.sweepLeft -= step;
    root.rotation.y = this.sweepA;
    this.yaw = approachAngle(this.yaw, this.sweepA, 1.5 * dt);
    // Dust and sparks along its length as it goes.
    for (let i = 0; i < 2; i++) {
      const r = 3 + rng.next() * 10;
      g.fx.dust(this.x + Math.sin(this.sweepA) * r, this.floor, this.z + Math.cos(this.sweepA) * r, 1, 0x5a4a60);
      g.fx.emit(this.x + Math.sin(this.sweepA) * r, this.floor + 0.9, this.z + Math.cos(this.sweepA) * r, {
        count: 1, speed: 2, dir: [Math.cos(this.sweepA) * this.sweepDir, 0.6, -Math.sin(this.sweepA) * this.sweepDir], spread: 0.4, life: [0.2, 0.4], size: [0.12, 0.2], sizeEnd: 0, color: ROOT_HOT, bright: 2,
      });
    }
    // Does it cross the dragon this step? (A jump clears it: it lies low.)
    const p = g.player;
    const pb = p.body;
    if (!this.sweepHit && p.alive) {
      const d = Math.hypot(pb.x - this.x, pb.z - this.z);
      const pa = yawOf(pb.x - this.x, pb.z - this.z);
      const before = angleDiff(a0, pa) * this.sweepDir;
      const after = angleDiff(this.sweepA, pa) * this.sweepDir;
      if (d > 2.6 && d < 13.6 && pb.y < this.floor + 1.05 && before >= -0.05 && after <= 0.12) {
        this.sweepHit = true;
        p.takeHit(makeHit({
          damage: 12 * this.dmg, dirX: Math.cos(this.sweepA) * this.sweepDir, dirZ: -Math.sin(this.sweepA) * this.sweepDir, knockback: 9, launch: 6,
          source: 'enemy', move: 'rootSweep', fromPlayer: false, ox: this.x, oz: this.z,
        }), this);
      }
    }
    if (this.sweepLeft <= 0) {
      this.hideSweep();
      for (const mk of this.marks) if (mk.active) mk.hide();
      g.fx.dust(this.x + Math.sin(this.sweepA) * 8, this.floor, this.z + Math.cos(this.sweepA) * 8, 16, 0x5a4a60);
      g.sfx('burrow', this.x, this.floor, this.z, 0.7);
      this.settle();
      this.setMode(this.phase >= 2 ? 'stalk' : 'idle');
      this.nextIn = 1.6 / this.aggr;
    }
  }

  private startLob(): void {
    this.setMode('lob');
    this.stats.lobs++;
    this.windup(tele('lob', 0.85, 'projectile'));
  }

  private doLob(): void {
    const g = this.game;
    const T = 0.85 / this.aggr;
    this.m.k = Math.min(1, this.modeT / (T * 1.3));
    if (this.phase > 1) this.yaw = approachAngle(this.yaw, this.yawToPlayer(), 0.03);
    if (!this.struck && this.modeT >= T) {
      this.struck = true;
      this.state = 'active';
      const p = g.player.body;
      const n = this.phase >= 3 ? 5 : this.phase === 2 ? 4 : 3;
      const hx = this.x;
      const hy = this.y + 7.2;
      const hz = this.z;
      for (let i = 0; i < n; i++) {
        let tx = p.x + p.vx * 0.5;
        let tz = p.z + p.vz * 0.5;
        if (i > 0) {
          const a = (i / (n - 1)) * Math.PI * 2 + rng.next();
          tx += Math.sin(a) * 3.8;
          tz += Math.cos(a) * 3.8;
        }
        [tx, tz] = this.inGrove(tx, tz, 1.5);
        lobSpore(g, hx, hy, hz, tx, tz, 1.25 + i * 0.12, { damage: 10, blast: 2.3, cloud: 1.8, cloudLife: 3, radius: 0.55 });
      }
      g.sfx('sporePuff', this.x, this.y + 6, this.z, 0.5, 1.2);
      g.fx.emit(this.x, this.y + 7.5, this.z, { count: 26, speed: 4, dir: [0, 1, 0], spread: 0.7, life: [0.6, 1.1], size: [0.6, 1], sizeEnd: 2.4, color: 0xb8e060, alpha: 0.5, additive: false, drag: 1.5 });
    }
    if (this.modeT >= T + 0.9) {
      this.settle();
      this.setMode('idle');
      this.nextIn = (this.phase === 1 ? 1.8 : 1.2) / this.aggr;
    }
  }

  private startCall(): void {
    this.setMode('call');
    this.stats.calls++;
    this.windup(tele('call', 1.1, 'projectile'));
    this.game.sfx('mycoraCry', this.x, this.y, this.z, 1.1, 0.9);
    this.say(rng.chance(0.5) ? 'Rise, little ones. Mother is hungry.' : 'Grow, my darlings! Grow!');
  }

  private doCall(): void {
    const g = this.game;
    this.m.k = Math.min(1, this.modeT / 1.1);
    if (!this.struck && this.modeT >= 1.1) {
      this.struck = true;
      this.state = 'active';
      const p = g.player.body;
      const n = Math.min(3, 5 - this.broodAlive());
      for (let i = 0; i < n; i++) {
        const a = yawOf(p.x - this.x, p.z - this.z) + (i - (n - 1) / 2) * 0.8 + rng.signed() * 0.2;
        const [x, z] = this.inGrove(this.x + Math.sin(a) * 7.5, this.z + Math.cos(a) * 7.5, 2);
        this.brood.push(sproutSporeling(g, x, z, a + Math.PI, this.floor));
      }
      g.shake(0.3, 0.4);
      this.callCd = 15;
    }
    if (this.modeT >= 2) {
      this.settle();
      this.setMode(this.phase >= 2 ? 'stalk' : 'idle');
      this.nextIn = 1.4 / this.aggr;
    }
  }

  private startGasp(): void {
    this.setMode('gasp');
    const T = 1.0 / this.aggr;
    this.windup(tele('gasp', T, 'slam'));
    this.mark(this.x, this.z, 8, T, 0xff3a2a);
    this.tell('gasp', 'She\'s going to cough out a ring of spores! Jump it, or get back!', 5);
  }

  private doGasp(): void {
    const g = this.game;
    const T = 1.0 / this.aggr;
    this.m.k = Math.min(1, this.modeT / T);
    if (!this.struck && this.modeT >= T) {
      this.struck = true;
      this.state = 'active';
      g.spawnShockwave(this.x, this.floor, this.z, 9, 9, 12 * this.dmg, 9, this);
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        g.fx.emit(this.x + Math.sin(a) * 2.8, this.floor + 0.4, this.z + Math.cos(a) * 2.8, {
          count: 1, speed: 9, dir: [Math.sin(a), 0.05, Math.cos(a)], spread: 0.04, life: [0.65, 0.7], size: [0.7, 1], sizeEnd: 1.8, color: 0xa8d850, alpha: 0.55, additive: false,
        });
      }
      g.sfx('sporePuff', this.x, this.y, this.z, 0.4, 1.4);
      g.shake(0.35, 0.3);
    }
    if (this.modeT >= T + 0.8) {
      this.settle();
      this.setMode(this.phase === 3 ? 'downed' : this.phase === 2 ? 'stalk' : 'idle');
      this.nextIn = 1.2 / this.aggr;
    }
  }

  private startCollapse(): void {
    const g = this.game;
    this.hideSweep();
    this.settle();
    this.setMode('collapse');
    this.state = 'recover';
    this.stats.collapses++;
    g.sfx('mycoraCry', this.x, this.y, this.z, 0.7, 1.2);
    g.shake(0.7, 0.6);
    g.fx.dust(this.x, this.floor, this.z, 30, 0x5a4a60);
    g.toast('Mycora collapses! Strike now!', 'good');
    this.say('Nnnh... my roots... hold me...');
    this.tell('collapse', 'She\'s down! Everything you\'ve got, Aster!', 5);
  }

  private doCollapse(): void {
    this.state = 'recover';
    if (this.modeT >= 5) {
      this.setMode('rise');
      this.regrowSacs();
      this.game.sfx('mycoraCry', this.x, this.y, this.z, 1.2, 0.8);
    }
  }

  private doRise(): void {
    this.m.k = Math.min(1, this.modeT / 1.6);
    this.state = 'recover';
    if (this.modeT >= 1.6) {
      this.settle();
      this.setMode('idle');
      this.nextIn = 1.5;
      this.pattern = 0;
    }
  }

  // --- phase 2: torn free ------------------------------------------------------------

  private doTear(): void {
    const g = this.game;
    this.m.k = Math.min(1, this.modeT / 2.6);
    this.state = 'recover';
    if (this.modeT < 2 && rng.chance(0.5)) {
      const a = rng.next() * Math.PI * 2;
      const r = 2 + rng.next() * 3;
      g.fx.rocks(this.x + Math.sin(a) * r, this.floor + 0.2, this.z + Math.cos(a) * r, 3, 0x4a3a50);
      g.fx.dust(this.x + Math.sin(a) * r, this.floor, this.z + Math.cos(a) * r, 3, 0x5a4a60);
    }
    if (!this.struck && this.modeT >= 1.2) {
      this.struck = true;
      // Her puffcaps sprout at the grove's edge.
      this.sproutPuffs(2);
      this.tell('p2', 'She tore herself free! Jump her shockwaves, and burn away the blight before it spreads!', 7);
    }
    if (this.modeT >= 2.6) {
      this.settle();
      this.setMode('stalk');
      this.nextIn = 1.2;
      this.pattern = 0;
    }
  }

  private sproutPuffs(n: number): void {
    const g = this.game;
    const p = g.player.body;
    this.puffs = this.puffs.filter((e) => e.alive);
    const toP = yawOf(p.x - this.grove.cx, p.z - this.grove.cz);
    for (let i = 0; i < n && this.puffs.length < 2; i++) {
      const a = toP + (i === 0 ? 1.4 : -1.4) + rng.signed() * 0.3;
      const x = this.grove.cx + Math.sin(a) * (this.grove.r - 6);
      const z = this.grove.cz + Math.cos(a) * (this.grove.r - 6);
      const e = g.spawnEnemy('puffcap', x, this.floor + 0.05, z, a + Math.PI, true);
      e.aggro = true;
      this.puffs.push(e);
      g.fx.emit(x, this.floor + 0.5, z, { count: 24, speed: 4, dir: [0, 1.2, 0], spread: 0.6, life: [0.5, 0.9], size: [0.4, 0.7], sizeEnd: 1.4, color: 0xb8e060, alpha: 0.55, additive: false });
    }
    this.puffCd = 24;
  }

  private stalk(dt: number): void {
    const d = this.distToPlayer();
    const toP = this.yawToPlayer();
    this.state = 'chase';
    this.nextIn -= dt;
    this.puffCd -= dt;
    if (this.puffCd <= 0 && this.puffs.filter((e) => e.alive).length === 0) this.sproutPuffs(1);
    this.yaw = approachAngle(this.yaw, toP, this.def.turnRate * dt);
    this.m.walk = d > 5 ? 1 : 0.3;
    if (d > 5) this.moveDir(toP, this.def.speed * (0.9 + 0.1 * this.aggr), dt);
    else {
      this.body.vx *= 0.9;
      this.body.vz *= 0.9;
    }
    if (this.nextIn > 0) return;
    const facing = Math.abs(angleDiff(this.yaw, toP)) < 0.6;
    if (d < 7.5 && facing && rng.chance(0.45)) {
      this.startSwipe();
      return;
    }
    const order = ['slam', 'blight', 'slam', 'sweep', 'slam', 'blight', 'lob'];
    const next = order[this.pattern++ % order.length]!;
    if (next === 'slam') this.startSlam(true);
    else if (next === 'blight') this.startBlight();
    else if (next === 'sweep') this.startSweep();
    else this.startLob();
  }

  private startSlam(first: boolean): void {
    const g = this.game;
    const p = g.player.body;
    this.setMode('slam');
    if (first) this.slams = 0;
    this.slams++;
    this.stats.slams++;
    // Aimed a little ahead of where the dragon stands, within her reach.
    const toP = yawOf(p.x - this.x, p.z - this.z);
    const d = clamp(Math.hypot(p.x - this.x, p.z - this.z), 3.5, 6);
    [this.slamX, this.slamZ] = this.inGrove(this.x + Math.sin(toP) * d, this.z + Math.cos(toP) * d, 1);
    const T = (first ? 1.05 : 0.85) / this.aggr;
    this.windup(tele('slam', T, 'slam'));
    this.mark(this.slamX, this.slamZ, 3.2, T);
    this.tell('slam', 'Her slams send out a shockwave! Jump it!', 5);
  }

  private doSlam(dt: number): void {
    const g = this.game;
    const T = (this.slams === 1 ? 1.05 : 0.85) / this.aggr;
    this.m.k = this.modeT < T ? (this.modeT / T) * 0.75 : 0.75 + Math.min(0.25, (this.modeT - T) * 2);
    this.yaw = approachAngle(this.yaw, yawOf(this.slamX - this.x, this.slamZ - this.z), 2 * dt);
    if (!this.struck && this.modeT >= T) {
      this.struck = true;
      this.state = 'active';
      g.spawnShockwave(this.slamX, this.floor, this.slamZ, 12, 10, 14 * this.dmg, 9, this);
      this.strike(this.slamX, this.slamZ, 3.2, 3, 16, 10, 8, 'slam');
      g.fx.rocks(this.slamX, this.floor + 0.3, this.slamZ, 24, 0x4a3a50);
      g.fx.dust(this.slamX, this.floor, this.slamZ, 26, 0x5a4a60);
      g.shake(0.8, 0.45);
      g.sfx('pound', this.slamX, this.floor, this.slamZ, 0.6);
    }
    if (this.modeT >= T + 0.55) {
      if (this.slams < 2) {
        this.startSlam(false);
        return;
      }
      // After a pair, her arms are stuck fast in the floor.
      this.setMode('stuck');
      this.stats.stuck++;
      this.state = 'recover';
      g.toast('Her arms are stuck in the ground! Strike!', 'good');
      this.tell('stuck', 'Her arms are stuck in the floor! Now, Aster!', 5);
    }
  }

  private doStuck(): void {
    const g = this.game;
    this.state = 'recover';
    if (rng.chance(0.15)) g.fx.dust(this.slamX + rng.signed(), this.floor, this.slamZ + rng.signed(), 2, 0x5a4a60);
    if (this.modeT >= 2.8) {
      g.fx.rocks(this.slamX, this.floor + 0.3, this.slamZ, 12, 0x4a3a50);
      g.sfx('rootRip', this.slamX, this.floor, this.slamZ, 1.3, 0.6);
      this.settle();
      this.setMode('stalk');
      this.nextIn = 1.4 / this.aggr;
    }
  }

  private startSwipe(): void {
    this.setMode('swipe');
    this.m.side = rng.chance(0.5) ? 1 : -1;
    this.windup(tele('swipe', 0.75, 'melee', 12));
  }

  private doSwipe(dt: number): void {
    const g = this.game;
    const T = 0.75 / this.aggr;
    this.m.k = this.modeT < T ? (this.modeT / T) * 0.6 : 0.6 + Math.min(0.4, (this.modeT - T) * 2);
    if (this.modeT < T) this.yaw = approachAngle(this.yaw, this.yawToPlayer(), 2.2 * dt);
    if (!this.struck && this.modeT >= T + 0.08) {
      this.struck = true;
      this.state = 'active';
      const p = g.player.body;
      const d = Math.hypot(p.x - this.x, p.z - this.z);
      const ang = Math.abs(angleDiff(this.yaw, yawOf(p.x - this.x, p.z - this.z)));
      g.fx.swoosh(this.x, this.y + 1.2, this.z, this.yaw, 6.5, 2.6, 0xd8a0ff, 'h', 0, 0.25, 0.9);
      g.sfx('swingHeavy', this.x, this.y, this.z, 0.5);
      // Low and wide: jump it, or be out of reach.
      if (d < 7.2 && ang < 1.3 && p.y < this.floor + 1.6 && g.player.alive) {
        const n = d || 1;
        g.player.takeHit(makeHit({ damage: 13 * this.dmg, dirX: (p.x - this.x) / n, dirZ: (p.z - this.z) / n, knockback: 12, launch: 5, source: 'enemy', move: 'swipe', fromPlayer: false, ox: this.x, oz: this.z }), this);
      }
    }
    if (this.modeT >= T + 0.9) {
      this.settle();
      this.setMode('stalk');
      this.nextIn = 1.0 / this.aggr;
    }
  }

  private startBlight(): void {
    this.setMode('blight');
    this.stats.blights++;
    this.windup(tele('blight', 1.0, 'projectile'));
    if (this.stats.blights === 1) this.say('Let the Deep take root in you.');
  }

  private doBlight(): void {
    const g = this.game;
    const T = 1.0 / this.aggr;
    this.m.k = Math.min(1, this.modeT / T);
    if (!this.struck && this.modeT >= T) {
      this.struck = true;
      this.state = 'active';
      const p = g.player.body;
      const f = sporeField(g);
      const toP = yawOf(p.x - this.x, p.z - this.z);
      for (let i = 0; i < 3; i++) {
        const a = toP + (i - 1) * 0.55;
        const r = clamp(Math.hypot(p.x - this.x, p.z - this.z), 5, 12) + (i === 1 ? 0 : -1.5);
        const [tx, tz] = this.inGrove(this.x + Math.sin(a) * r, this.z + Math.cos(a) * r, 2.5);
        const proj = lobSpore(g, this.x, this.y + 6.5, this.z, tx, tz, 1.0 + i * 0.1, { damage: 6, blast: 1.6, cloud: 0, cloudLife: 0, radius: 0.4 });
        if (proj && f) this.seeds.push({ proj, x: tx, z: tz });
      }
      g.sfx('sporePuff', this.x, this.y + 6, this.z, 0.45, 1.3);
    }
    if (this.modeT >= T + 0.8) {
      this.settle();
      this.setMode('stalk');
      this.nextIn = 1.3 / this.aggr;
    }
  }

  /** Blight seeds in flight: where each lands, a patch takes root. */
  private seeds: { proj: { alive: boolean; x: number; z: number }; x: number; z: number }[] = [];

  private doReel(): void {
    this.state = 'recover';
    if (this.modeT >= 3) {
      this.settle();
      this.setMode('stalk');
      this.nextIn = 1;
    }
  }

  // --- phase 3: the canopy -----------------------------------------------------------

  private doClimb(dt: number): void {
    const g = this.game;
    const b = this.body;
    this.state = 'recover';
    this.m.walk = 1;
    if (!this.struck) {
      // First, back to the middle of the grove.
      const d = Math.hypot(this.grove.cx - b.x, this.grove.cz - b.z);
      if (d > 0.6 && this.modeT < 3) {
        this.moveDir(yawOf(this.grove.cx - b.x, this.grove.cz - b.z), 6, dt);
        this.hangY = 0;
        return;
      }
      this.struck = true;
      this.modeT = 0;
      b.vx = b.vz = 0;
      this.grove.wake();
      g.sfx('rootRip', b.x, this.floor + 10, b.z, 0.8);
      this.tell('p3', 'She\'s gone up into the canopy! Those caps will bounce you up to her. Hit her enough and she\'ll fall!', 8);
    }
    // Then up the ropes.
    const k = smoothstep(0, 2.4, this.modeT);
    this.hangY = k * HANG;
    if (this.modeT >= 2.6) {
      this.canopyDmg = 0;
      this.setMode('hang');
      this.nextIn = 1.2;
      this.pattern = 0;
    }
  }

  private hang(dt: number): void {
    this.state = 'strafe';
    this.hangY = HANG;
    this.yaw = approachAngle(this.yaw, this.yawToPlayer(), 1.2 * dt);
    if (this.checkGrip()) return;
    this.nextIn -= dt;
    if (this.nextIn > 0) return;
    const order = ['rain', 'lash', 'drop', 'rain', 'lash', 'lash'];
    let next = order[this.pattern++ % order.length]!;
    if (next === 'drop' && this.broodAlive() >= 4) next = 'rain';
    if (next === 'rain') this.startRain();
    else if (next === 'lash') this.startLash(true);
    else this.startDrop();
  }

  /** Hurt enough up there, she loses her hold (true if she fell). */
  private checkGrip(): boolean {
    if (this.canopyDmg < GRIP && this.hpFrac > FINAL) return false;
    const g = this.game;
    this.settle();
    this.setMode('fall');
    this.stats.falls++;
    this.final = this.hpFrac <= FINAL + 0.02;
    this.lashRoot.visible = false;
    // Where she will land, for anyone underneath.
    this.mark(this.grove.cx, this.grove.cz, this.def.radius + 0.8, 0.75);
    g.sfx('mycoraCry', this.x, this.y + HANG, this.z, 1.2, 1);
    this.say(this.final ? 'No... NO! My threads!' : 'Hnh! You... tore my threads!');
    return true;
  }

  private startRain(): void {
    this.setMode('rain');
    this.stats.rains++;
    this.windup(tele('rain', 0.9, 'projectile'));
  }

  private doRain(): void {
    const g = this.game;
    const T = 0.9 / this.aggr;
    this.m.k = Math.min(1, this.modeT / T);
    if (this.checkGrip()) return;
    if (!this.struck && this.modeT >= T) {
      this.struck = true;
      this.state = 'active';
      const p = g.player.body;
      for (let i = 0; i < 6; i++) {
        let tx = p.x;
        let tz = p.z;
        if (i > 0) {
          const a = rng.next() * Math.PI * 2;
          const r = 2.5 + rng.next() * 5;
          tx += Math.sin(a) * r;
          tz += Math.cos(a) * r;
        }
        [tx, tz] = this.inGrove(tx, tz, 1.5);
        lobSpore(g, this.x + rng.signed() * 2, this.y + 2, this.z + rng.signed() * 2, tx, tz, 1.25 + i * 0.1, { damage: 9, blast: 2.1, cloud: 1.6, cloudLife: 2.5, radius: 0.5 });
      }
      g.sfx('sporePuff', this.x, this.y + 4, this.z, 0.5, 1.2);
    }
    if (this.modeT >= T + 1) {
      this.settle();
      this.setMode('hang');
      this.nextIn = 1.5 / this.aggr;
    }
  }

  private startLash(first: boolean): void {
    const g = this.game;
    const p = g.player.body;
    this.setMode('lash');
    if (first) this.lashes = 0;
    this.lashes++;
    this.stats.lashes++;
    this.m.side = rng.chance(0.5) ? 1 : -1;
    [this.lashX, this.lashZ] = this.inGrove(p.x + p.vx * 0.3, p.z + p.vz * 0.3, 1);
    const T = 0.95 / this.aggr;
    this.windup(tele('lash', T, 'slam'));
    this.mark(this.lashX, this.lashZ, 2.3, T);
  }

  private doLash(): void {
    const g = this.game;
    const T = 0.95 / this.aggr;
    this.m.k = Math.min(1, this.modeT / (T + 0.3));
    if (this.checkGrip()) return;
    if (!this.struck && this.modeT >= T) {
      this.struck = true;
      this.state = 'active';
      this.strike(this.lashX, this.lashZ, 2.3, 2.5, 14, 8, 9, 'lash');
      g.fx.rocks(this.lashX, this.floor + 0.3, this.lashZ, 16, 0x4a3a50);
      g.fx.dust(this.lashX, this.floor, this.lashZ, 16, 0x5a4a60);
      g.fx.ring(this.lashX, this.floor, this.lashZ, 0.4, 3, 0xff6aa0, 0.35);
      g.shake(0.45, 0.3);
      g.sfx('erupt', this.lashX, this.floor, this.lashZ, 0.9);
    }
    // The lashing root, from her down to the floor, for a moment.
    const show = this.modeT >= T - 0.08 && this.modeT < T + 0.4;
    this.lashRoot.visible = show;
    if (show) {
      const top = tmpV.set(this.x, this.y + 3, this.z);
      const len = Math.max(1, top.y - this.floor);
      this.lashRoot.position.set(this.lashX, this.floor + len, this.lashZ);
      this.lashRoot.scale.set(1, len, 1);
      const dx = top.x - this.lashX;
      const dz = top.z - this.lashZ;
      this.lashRoot.rotation.set(Math.atan2(dz, len) * 0.9, 0, -Math.atan2(dx, len) * 0.9);
    }
    if (this.modeT >= T + 0.6) {
      this.lashRoot.visible = false;
      if (this.lashes < (this.hpFrac < 0.22 ? 3 : 2)) {
        this.startLash(false);
        return;
      }
      this.settle();
      this.setMode('hang');
      this.nextIn = 1.4 / this.aggr;
    }
  }

  private startDrop(): void {
    this.setMode('drop');
    this.windup(tele('drop', 0.8, 'projectile'));
  }

  private doDrop(): void {
    const g = this.game;
    if (this.checkGrip()) return;
    if (!this.struck && this.modeT >= 0.8) {
      this.struck = true;
      this.state = 'active';
      const p = g.player.body;
      for (let i = 0; i < 2; i++) {
        const a = rng.next() * Math.PI * 2;
        const [x, z] = this.inGrove(p.x + Math.sin(a) * 4, p.z + Math.cos(a) * 4, 2);
        const e = sproutSporeling(g, x, z, a + Math.PI, this.floor);
        this.brood.push(e);
      }
      g.sfx('sporePuff', this.x, this.y + 4, this.z, 1.1, 0.8);
    }
    if (this.modeT >= 1.8) {
      this.settle();
      this.setMode('hang');
      this.nextIn = 1.2 / this.aggr;
    }
  }

  private doFall(): void {
    const g = this.game;
    this.state = 'recover';
    const k = Math.min(1, this.modeT / 0.75);
    this.hangY = HANG * (1 - k * k);
    if (k >= 1 && !this.struck) {
      this.struck = true;
      this.hangY = 0;
      g.spawnShockwave(this.x, this.floor, this.z, 10, 11, 12 * this.dmg, 9, this);
      this.strike(this.x, this.z, this.def.radius + 0.8, 3, 18, 12, 8, 'crash');
      g.fx.rocks(this.x, this.floor + 0.3, this.z, 30, 0x4a3a50);
      g.fx.dust(this.x, this.floor, this.z, 40, 0x5a4a60);
      g.shake(1.1, 0.7);
      g.sfx('pound', this.x, this.floor, this.z, 0.45);
      g.sfx('rootRip', this.x, this.floor, this.z, 0.8);
      this.setMode('downed');
      this.state = 'recover';
      g.toast(this.final ? 'Mycora has fallen! Finish her!' : 'Mycora falls! Strike now!', 'good');
      this.tell('fall', 'She fell! Hit her while she\'s down!', 5);
    }
  }

  private doDowned(): void {
    this.state = 'recover';
    this.hangY = 0;
    // Weak enough now, she stays down for good: she lies there for the finish.
    if (!this.final && this.hpFrac <= FINAL) {
      this.final = true;
      this.game.toast('Mycora can\'t rise again! Finish her!', 'good');
    }
    if (this.final) return;
    if (this.modeT >= 6.5) {
      this.setMode('climb');
      this.struck = true;
      this.game.sfx('mycoraCry', this.x, this.y, this.z, 1.1, 0.9);
    }
  }

  /** Seconds she has spent frozen or shocked since her brain last ran. */
  private stunT = 0;

  /**
   * Back from a freeze or a shock: anything she was still winding up starts
   * its warning over, so no blow ever lands without its full telegraph.
   */
  private afterStun(): void {
    this.stunT = 0;
    if (this.struck) return;
    const tele = ['sweep', 'lob', 'gasp', 'slam', 'swipe', 'blight', 'rain', 'lash', 'call', 'drop'];
    if (!tele.includes(this.mode)) return;
    if (this.mode === 'sweep' && this.state === 'active') return;
    this.modeT = 0;
    if (this.tele) this.windup(this.tele);
    if (this.mode === 'slam') this.mark(this.slamX, this.slamZ, 3.2, (this.slams === 1 ? 1.05 : 0.85) / this.aggr);
    else if (this.mode === 'lash') this.mark(this.lashX, this.lashZ, 2.3, 0.95 / this.aggr);
    else if (this.mode === 'gasp') this.mark(this.x, this.z, 8, 1.0 / this.aggr);
    else if (this.mode === 'sweep') this.mark(this.x, this.z, 13.6, 1.0 / this.aggr + this.sweepLeft / ((this.phase >= 2 ? 2.9 : 2.5) * this.aggr), 0xff3a2a, false);
  }

  // --- per step ------------------------------------------------------------------------

  override integrate(dt: number, friction: number): void {
    const b = this.body;
    const aloft = this.mode === 'climb' || this.mode === 'fall' || this.up;
    if (aloft && this.alive) {
      // On her ropes: placed, not simulated.
      b.vy = 0;
      b.y = this.floor + this.hangY;
      if (this.mode !== 'climb' || this.struck) {
        b.vx = b.vz = 0;
        const sway = this.up ? Math.sin(this.game.time * 0.6) * 0.6 : 0;
        b.x = this.grove.cx + sway;
        b.z = this.grove.cz + Math.cos(this.game.time * 0.45) * 0.4 * (this.up ? 1 : 0);
        return;
      }
      b.y = this.floor;
    }
    super.integrate(dt, friction);
    // Rooted: nothing moves her.
    if (this.phase === 1 && this.alive) {
      b.x = this.cx;
      b.z = this.cz;
    }
    // Never out of her grove.
    const [x, z] = this.inGrove(b.x, b.z, 3);
    b.x = x;
    b.z = z;
  }

  override updateBoss(dt: number): void {
    const g = this.game;
    if (this.status.stunned && this.alive) {
      this.stunT += dt;
      // Her warnings vanish while she is held; they come back in full after.
      if (!this.struck) for (const mk of this.marks) mk.hide();
    }
    for (const mk of this.marks) mk.update(dt);
    // Sac targets ride her body.
    for (const s of this.sacs) {
      if (!s.alive) continue;
      this.m.sacWorld(s.i, tmpV);
      s.x = tmpV.x;
      s.y = tmpV.y - s.height * 0.5;
      s.z = tmpV.z;
    }
    for (let i = 0; i < 3; i++) this.m.sacHeat[i] = this.sacs[i]!.alive ? Math.min(1, this.sacs[i]!.heat / SAC_HEAT) : 0;
    // Sacs cool slowly if left alone.
    for (const s of this.sacs) s.heat = Math.max(0, s.heat - dt * 2);
    // Blight takes root where each seed lands.
    const f = sporeField(g);
    for (const sd of this.seeds) {
      if (sd.proj.alive || !f) continue;
      this.patches.push(f.patch(sd.proj.x, this.floor, sd.proj.z, 3.1, 16, 1.6, 2.5));
    }
    this.seeds = this.seeds.filter((sd) => sd.proj.alive);
    this.patches = this.patches.filter((p) => p.alive);
    while (this.patches.length > 7) this.patches.shift()!.kill();
    // Ropes up to the Mother Cap while she climbs or hangs.
    const roped = this.alive && (this.up || this.mode === 'climb' || this.mode === 'fall') && this.hangY > 0.3;
    for (const [i, r] of this.ropes.entries()) {
      r.visible = roped && this.mode !== 'fall';
      if (!r.visible) continue;
      const a = (i / 4) * Math.PI * 2 + this.yaw + Math.PI / 4;
      const fx = this.x + Math.sin(a) * 1.3;
      const fz = this.z + Math.cos(a) * 1.3;
      const fy = this.y + 7.2;
      const ty = this.floor + 19.2;
      const tx = this.grove.cx + Math.sin(a) * 2.2;
      const tz = this.grove.cz + Math.cos(a) * 2.2;
      const len = Math.hypot(tx - fx, ty - fy, tz - fz);
      r.position.set((fx + tx) / 2, (fy + ty) / 2, (fz + tz) / 2);
      r.scale.set(1, len, 1);
      r.lookAt(tx, ty, tz);
      r.rotateX(Math.PI / 2);
    }
    // Spores drifting off her while she lives.
    this.fxT -= dt;
    if (this.fxT <= 0 && this.alive) {
      this.fxT = 0.12;
      const a = rng.next() * Math.PI * 2;
      g.fx.emit(this.x + Math.sin(a) * 3, this.y + 6.5 + rng.next(), this.z + Math.cos(a) * 3, {
        count: 1, speed: 0.4, dir: [0, -0.3, 0], spread: 0.8, life: [1.5, 2.5], size: [0.1, 0.16], sizeEnd: 0.3, color: SPORE_GLOW, bright: 2, drag: 0.5,
      });
    }
    if (!this.alive) {
      for (const mk of this.marks) mk.hide();
      this.hideSweep();
      this.lashRoot.visible = false;
    }
  }

  override syncModel(dt: number): void {
    super.syncModel(dt);
    // A slow, spore-shedding end rather than the quick shrink of a small foe.
    if (this.state === 'dead') {
      const k = Math.max(0.001, 1 - Math.max(0, this.deadT - 0.8) / 1.6);
      this.model.root.scale.setScalar(k);
    }
  }

  /** Clears her brood, puffcaps, blight, telegraphs and the bounce caps. */
  private cleanup(wither: boolean): void {
    // Hers are the ones she grew, and anything of the Spore family inside her grove (a puffcap's brood).
    const g = this.game;
    const mine = new Set([...this.brood, ...this.puffs]);
    for (const e of g.enemies) {
      if (!e.alive || e.isBoss || (e.def.id !== 'sporeling' && e.def.id !== 'puffcap')) continue;
      if (Math.hypot(e.x - this.grove.cx, e.z - this.grove.cz) < this.grove.r + 2) mine.add(e);
    }
    if (wither) witherAll([...mine]);
    else {
      for (const e of mine) {
        if (!e.alive) continue;
        e.alive = false;
        e.setState('dead');
        e.deadT = 10;
      }
    }
    this.brood = [];
    this.puffs = [];
    for (const p of this.patches) p.kill();
    this.patches = [];
    this.seeds = [];
    for (const mk of this.marks) mk.hide();
    this.hideSweep();
    this.lashRoot.visible = false;
    this.grove.sleep();
    this.dropSacs();
  }

  /** Takes the sac targets out of the level. */
  private dropSacs(): void {
    const hs = this.game.level?.hittables;
    for (const s of this.sacs) {
      s.alive = false;
      const i = hs?.indexOf(s) ?? -1;
      if (hs && i >= 0) hs.splice(i, 1);
    }
  }

  protected override onReset(): void {
    this.cleanup(false);
    this.mode = 'dormant';
    this.phase = 1;
    this.hangY = 0;
    this.canopyDmg = 0;
    this.final = false;
    this.regrowSacs();
    this.game.level?.hittables.push(...this.sacs.filter((s) => !this.game.level!.hittables.includes(s)));
  }

  override dispose(): void {
    if (!this.disposed) {
      this.disposed = true;
      this.cleanup(false);
      for (const mk of this.marks) mk.dispose();
      this.game.scene.remove(this.world);
      // Her own props' geometry (the marks share theirs and are already done).
      for (const o of [this.sweepRoot, this.lashRoot, ...this.ropes]) {
        o.traverse((c) => (c as THREE.Mesh).geometry?.dispose());
      }
      this.game.cam.extraDist = 0;
    }
    super.dispose();
  }
}
