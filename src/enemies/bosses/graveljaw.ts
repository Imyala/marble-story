import * as THREE from 'three';
import { Boss } from '../boss';
import type { EnemyDef } from '../enemy';
import type { EnemyModel, EnemyPose } from '../models';
import type { Game } from '../../game/game';
import type { Hit, HitResult } from '../../game/types';
import { makeHit } from '../../game/types';
import { reactionFor, type Reaction } from '../../combat/status';
import { matUnique, mat, glow } from '../../render/materials';
import { ellipsoid, spike } from '../../render/shapes';
import { damp, clamp, lerp, smoothstep, yawOf, approachAngle, angleDiff } from '../../core/math';
import { rng } from '../../core/rng';

/**
 * Graveljaw, the Burrow Wyrm: a stone-plated worm that swims through the sand.
 *
 * The fight is a loop the player can read: a dust trail hunts them, stops,
 * a red ring marks the spot, the worm erupts, arches over and slams its head
 * down, then lies dazed for a few seconds. A Ground Pound beside the moving
 * trail shakes it loose early. Between hunts it rears up and spits boulders.
 * Phase 2 erupts twice in a row. Phase 3 adds a tail sweep to jump over and
 * rocks falling from the canyon walls.
 */

const SEGS = 17;
const SPACING = 1.45;
const NECK = 1.7;
const HEAD_REST = 1.35;
const UNDER = 4.6;
const REACH = 16.5;
const RED = 0xff3a20;

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

class GraveljawModel implements EnemyModel {
  readonly root = new THREE.Group();
  /** The body chain lives in world space, next to root in the scene. */
  readonly chain = new THREE.Group();
  private head = new THREE.Group();
  private teeth = new THREE.Group();
  private innerTeeth = new THREE.Group();
  private throat: THREE.MeshBasicMaterial;
  private segs: THREE.Group[] = [];
  private radii: number[] = [];
  private eyes: THREE.Mesh[] = [];
  private mats: THREE.MeshStandardMaterial[] = [];
  private t = 0;
  private open = 0;
  // Written by the boss every step.
  headLift = 0;
  pitch = 0;
  mawOpen = 0;
  dazed = false;
  trueX = 0;
  trueZ = 0;

  constructor() {
    const plate = matUnique(0x8a7a62, { rough: 0.9, flat: true });
    const plateDark = matUnique(0x5e5244, { rough: 0.95, flat: true });
    const hide = matUnique(0xa07a52, { rough: 0.8 });
    this.mats.push(plate, plateDark, hide);
    const bone = mat(0xe8dcc0, { rough: 0.5 });
    const crack = glow(0xc050ff);
    this.root.add(this.head);

    // Skull and crown plates.
    const skull = ellipsoid(1.9, 1.65, 2.0, hide, 18);
    skull.position.z = -0.2;
    this.head.add(skull);
    for (let i = 0; i < 7; i++) {
      const a = (i / 6 - 0.5) * 2.4;
      const p = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 0), i % 2 ? plate : plateDark);
      p.scale.set(1.1, 0.45, 1.25);
      p.position.set(Math.sin(a) * 1.35, 1.05 + Math.cos(a) * 0.45, -0.35 - Math.abs(a) * 0.2);
      p.rotation.set(0.2, a * 0.5, -a * 0.6);
      this.head.add(p);
    }
    for (let i = 0; i < 4; i++) {
      const s = spike(0.3, 1.2 - i * 0.18, plateDark, 5);
      s.position.set(0, 1.55 - i * 0.12, -0.5 - i * 0.6);
      s.rotation.x = -0.95;
      this.head.add(s);
    }
    // The maw: a heavy lip, a ring of teeth that grinds round, a glowing throat.
    const lip = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.4, 8, 22), plateDark);
    lip.position.z = 1.55;
    this.head.add(lip);
    this.teeth.position.z = 1.62;
    this.head.add(this.teeth);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const tooth = spike(0.15, 0.8, bone, 4);
      tooth.position.set(Math.cos(a) * 1.18, Math.sin(a) * 1.18, 0);
      tooth.quaternion.setFromUnitVectors(UP, V(-Math.cos(a), -Math.sin(a), 0.5).normalize());
      this.teeth.add(tooth);
    }
    this.innerTeeth.position.z = 1.15;
    this.head.add(this.innerTeeth);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3;
      const tooth = spike(0.1, 0.5, bone, 4);
      tooth.position.set(Math.cos(a) * 0.78, Math.sin(a) * 0.78, 0);
      tooth.quaternion.setFromUnitVectors(UP, V(-Math.cos(a), -Math.sin(a), 0.3).normalize());
      this.innerTeeth.add(tooth);
    }
    const dark = new THREE.Mesh(new THREE.CircleGeometry(1.05, 20), new THREE.MeshBasicMaterial({ color: 0x1a0806 }));
    dark.position.z = 1.2;
    this.head.add(dark);
    this.throat = new THREE.MeshBasicMaterial({ color: 0xff6a2a, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
    const glowDisc = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), this.throat);
    glowDisc.position.z = 1.24;
    this.head.add(glowDisc);
    // Eyes: two big, two small, above the maw.
    for (const sx of [-1, 1]) {
      const big = ellipsoid(0.27, 0.2, 0.12, glow(0xffb030), 10);
      big.position.set(sx * 0.95, 1.08, 1.32);
      big.rotation.y = sx * 0.4;
      this.head.add(big);
      this.eyes.push(big);
      const small = ellipsoid(0.15, 0.12, 0.08, glow(0xffb030), 8);
      small.position.set(sx * 1.4, 0.72, 1.0);
      small.rotation.y = sx * 0.7;
      this.head.add(small);
      this.eyes.push(small);
      const tusk = spike(0.26, 1.3, bone, 5);
      tusk.position.set(sx * 1.35, -0.85, 1.3);
      tusk.quaternion.setFromUnitVectors(UP, V(-sx * 0.25, -0.55, 0.8).normalize());
      this.head.add(tusk);
    }
    for (let i = 0; i < 5; i++) {
      const c = ellipsoid(0.06, 0.45, 0.05, crack, 6);
      const a = -1.1 + i * 0.55;
      c.position.set(Math.sin(a) * 1.85, 0.2 + Math.cos(i * 1.9) * 0.4, Math.cos(a) * 1.2 - 0.6);
      c.rotation.set(0, a, i * 0.8);
      this.head.add(c);
    }

    // Body segments, thick at the neck and tapering to a spiked tail club.
    for (let i = 0; i < SEGS; i++) {
      const k = i / (SEGS - 1);
      const r = lerp(1.45, 0.55, k);
      this.radii.push(r);
      const g = new THREE.Group();
      g.add(ellipsoid(r, r * 0.92, r * 0.85, hide, 12));
      const back = new THREE.Mesh(new THREE.DodecahedronGeometry(r * 0.95, 0), i % 2 ? plate : plateDark);
      back.scale.set(1.08, 0.55, 0.85);
      back.position.y = r * 0.55;
      g.add(back);
      for (const sx of [-1, 1]) {
        const side = new THREE.Mesh(new THREE.DodecahedronGeometry(r * 0.6, 0), i % 2 ? plateDark : plate);
        side.scale.set(0.55, 0.85, 0.85);
        side.position.set(sx * r * 0.82, r * 0.05, 0);
        g.add(side);
      }
      if (i % 2 === 0 && i < SEGS - 1) {
        const s = spike(r * 0.22, r * 0.95, bone, 4);
        s.position.y = r * 0.95;
        s.rotation.x = -0.55;
        g.add(s);
      }
      if (i % 3 === 1) {
        const c = ellipsoid(0.05, r * 0.4, 0.05, crack, 6);
        c.position.set(r * 0.9, 0, 0);
        g.add(c);
      }
      if (i === SEGS - 1) {
        for (let j = 0; j < 5; j++) {
          const a = (j / 5) * Math.PI * 2;
          const s = spike(0.16, 0.8, bone, 4);
          s.position.set(Math.cos(a) * 0.35, Math.sin(a) * 0.35, -0.3);
          s.quaternion.setFromUnitVectors(UP, V(Math.cos(a), Math.sin(a), -0.8).normalize());
          g.add(s);
        }
      }
      this.chain.add(g);
      this.segs.push(g);
    }
    for (const o of [this.root, this.chain]) {
      o.traverse((m) => {
        if ((m as THREE.Mesh).isMesh) m.castShadow = true;
      });
    }
  }

  setFlash(amount: number, color: number): void {
    for (const m of this.mats) {
      m.emissive.setHex(color);
      m.emissiveIntensity = amount;
    }
  }

  update(dt: number, pose: EnemyPose): void {
    this.t += dt;
    this.open = damp(this.open, pose.dead ? 1 : this.mawOpen, 10, dt);
    this.root.position.x = this.trueX;
    this.root.position.z = this.trueZ;
    this.head.position.y = this.headLift;
    this.head.rotation.x = -this.pitch;
    this.head.rotation.z = this.dazed ? Math.sin(this.t * 2.2) * 0.12 : 0;
    this.teeth.scale.setScalar(1 + this.open * 0.22);
    this.teeth.rotation.z = this.t * (0.5 + this.open * 2.5);
    this.innerTeeth.rotation.z = -this.t * (0.8 + this.open * 3);
    this.throat.opacity = 0.25 + this.open * 0.6 + Math.sin(this.t * 9) * 0.05;
    const blink = this.dazed ? 0.3 : Math.sin(this.t * 0.9) > 0.985 ? 0.15 : 1;
    for (const e of this.eyes) e.scale.y = e.scale.x * (blink * 0.75);
  }

  /** Places the chain along points (world space); segments below the floor hide. */
  layout(pts: THREE.Vector3[], head: THREE.Vector3, floor: number): void {
    for (let i = 0; i < this.segs.length; i++) {
      const s = this.segs[i]!;
      const p = pts[i]!;
      const r = this.radii[i]!;
      s.position.copy(p);
      s.lookAt(i === 0 ? head : pts[i - 1]!);
      s.visible = p.y + r > floor - 0.2 && s.userData.gone !== true;
    }
  }

  /** Death: one segment turns to rubble. */
  crumble(i: number): THREE.Vector3 | null {
    const s = this.segs[i];
    if (!s || s.userData.gone) return null;
    s.userData.gone = true;
    s.visible = false;
    return s.position;
  }

  get segmentCount(): number {
    return this.segs.length;
  }
}

/** A red ground disc that fills in as the hit it warns about arrives. */
class Marker {
  readonly root = new THREE.Group();
  private ringMat: THREE.MeshBasicMaterial;
  private fillMat: THREE.MeshBasicMaterial;
  private fill: THREE.Mesh;
  private ring: THREE.Mesh;
  private t = 0;
  private dur = 1;
  private r = 1;
  active = false;

  constructor(ringGeo: THREE.BufferGeometry, discGeo: THREE.BufferGeometry) {
    this.ringMat = new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.fillMat = new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.ring = new THREE.Mesh(ringGeo, this.ringMat);
    this.fill = new THREE.Mesh(discGeo, this.fillMat);
    this.ring.renderOrder = this.fill.renderOrder = 24;
    this.root.add(this.ring, this.fill);
    this.root.visible = false;
  }

  show(x: number, y: number, z: number, r: number, dur: number): void {
    this.active = true;
    this.t = 0;
    this.dur = Math.max(0.1, dur);
    this.r = r;
    this.root.position.set(x, y + 0.07, z);
    this.ring.scale.setScalar(r);
    this.fill.scale.setScalar(0.01);
    this.root.visible = true;
  }

  hide(): void {
    this.active = false;
    this.root.visible = false;
  }

  update(dt: number): void {
    if (!this.active) return;
    this.t += dt;
    const k = Math.min(1, this.t / this.dur);
    this.fill.scale.setScalar(Math.max(0.01, this.r * k));
    this.ringMat.opacity = 0.55 + 0.4 * Math.abs(Math.sin(this.t * (8 + k * 10)));
    this.fillMat.opacity = 0.18 + k * 0.3;
    if (this.t >= this.dur + 0.12) this.hide();
  }
}

export const GRAVELJAW_DEF: EnemyDef = {
  id: 'graveljaw', name: 'Graveljaw', hp: 1100, radius: 2.2, height: 3.6, speed: 0, turnRate: 3, mass: 0, poise: 220,
  resist: { earth: 0.4, ice: 1.4 }, statusResist: { ice: 0.65, lightning: 0.4, fire: 0.8 }, aggroRange: 60,
  gems: { blue: 180, red: 6, green: 6, purple: 6 },
  attacks: [],
  build: () => new GraveljawModel(),
  styleValue: 10,
};

type Mode =
  | 'rise' | 'dive' | 'hunt' | 'mark' | 'erupt' | 'arch' | 'exposed' | 'pop'
  | 'travel' | 'spitRise' | 'spit' | 'sweepRise' | 'sweepTele' | 'sweep' | 'slamAim' | 'slam';

export class Graveljaw extends Boss {
  readonly displayName = 'Graveljaw, the Burrow Wyrm';
  private readonly m: GraveljawModel;
  private readonly world = new THREE.Group();
  private readonly mound = new THREE.Group();
  private readonly markers: Marker[] = [];
  private readonly spokeMark: THREE.Mesh;
  private readonly spokeMat: THREE.MeshBasicMaterial;
  private readonly cx: number;
  private readonly cz: number;
  private readonly g0: number;
  mode: Mode = 'rise';
  private modeT = 0;
  private hx: number;
  private hy: number;
  private hz: number;
  private pitch = 0;
  private headV = new THREE.Vector3();
  private trail: THREE.Vector3[] = [];
  private pts: THREE.Vector3[] = [];
  private spoke = false;
  // Hunting and eruptions.
  private tx = 0;
  private tz = 0;
  private trailYaw = 0;
  private ex = 0;
  private ez = 0;
  private lx = 0;
  private lz = 0;
  private ax = 0;
  private ay = 0;
  private az = 0;
  private second = false;
  private secondLeft = false;
  private burst = false;
  private markDur = 1;
  private diveDur = 0.8;
  private diveStraight = false;
  private pattern = 0;
  private exposedFor = 0;
  private dmgMul = 1;
  private reeled = false;
  // Spitting and sweeping.
  private travelFor: 'spit' | 'sweep' = 'spit';
  private sx = 0;
  private sz = 0;
  private volleys = 0;
  private spitStage = 0;
  private sweepA = 0;
  private sweepDir = 1;
  private sweepLeft = 0;
  private sweepHitCd = 0;
  private chompT = 0;
  private chomp = -1;
  private rainT = 99;
  // Bookkeeping.
  private fxT = 0;
  private rumbleT = 0;
  private deathT = -1;
  private sinkT = 0;
  private collapsed = false;
  private crumbled = 0;
  private hinted = { expose: false, pound: false, rain: false, sweep: false };
  /** How many times the fight has been shaken loose by a Ground Pound (tests read this). */
  pounds = 0;
  /** Rock falls so far (tests read this). */
  rains = 0;

  constructor(game: Game, x: number, y: number, z: number, yaw: number) {
    super(game, GRAVELJAW_DEF, x, y, z, yaw);
    this.speakerId = 'graveljaw';
    this.phases = 3;
    this.m = this.model as GraveljawModel;
    this.cx = x;
    this.cz = z;
    this.g0 = y;
    this.hx = x;
    this.hy = y - UNDER - 1;
    this.hz = z;
    for (let i = 0; i < SEGS; i++) this.pts.push(new THREE.Vector3(x, y - 8, z));
    this.seedTrail();
    // Trail mound: rock chunks that ride the sand above the buried head.
    const rockM = mat(0x8a7a62, { rough: 0.95, flat: true });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 + (i % 3) * 0.18, 0), rockM);
      r.position.set(Math.sin(a) * 1.1, 0.1, Math.cos(a) * 1.1);
      r.rotation.set(i, i * 2, 0);
      r.castShadow = true;
      this.mound.add(r);
    }
    const hump = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xc8a878, { rough: 1, flat: true }));
    hump.scale.y = 0.45;
    this.mound.add(hump);
    this.mound.visible = false;
    this.world.add(this.mound);
    const ringGeo = new THREE.RingGeometry(0.86, 1, 40, 1);
    ringGeo.rotateX(-Math.PI / 2);
    const discGeo = new THREE.CircleGeometry(1, 32);
    discGeo.rotateX(-Math.PI / 2);
    for (let i = 0; i < 10; i++) {
      const mk = new Marker(ringGeo, discGeo);
      this.markers.push(mk);
      this.world.add(mk.root);
    }
    this.spokeMat = new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const spokeGeo = new THREE.PlaneGeometry(1, 1);
    spokeGeo.rotateX(-Math.PI / 2);
    spokeGeo.translate(0, 0, 0.5);
    this.spokeMark = new THREE.Mesh(spokeGeo, this.spokeMat);
    this.spokeMark.renderOrder = 24;
    this.spokeMark.visible = false;
    this.world.add(this.spokeMark);
    game.scene.add(this.m.chain, this.world);
    this.layoutChain();
  }

  // --- helpers ---------------------------------------------------------------

  private seedTrail(): void {
    this.trail = [];
    for (let i = 0; i < 40; i++) this.trail.push(new THREE.Vector3(this.hx, this.hy - i * 0.8, this.hz));
  }

  private get aggression(): number {
    return this.game.difficultyInfo.aggression;
  }

  private get dmg(): number {
    return this.game.difficultyInfo.enemyDamage;
  }

  private marker(x: number, z: number, r: number, dur: number): void {
    const mk = this.markers.find((q) => !q.active) ?? this.markers[0]!;
    mk.show(x, this.g0, z, r, dur);
  }

  private clampArena(x: number, z: number, r = REACH): [number, number] {
    const dx = x - this.cx;
    const dz = z - this.cz;
    const d = Math.hypot(dx, dz);
    if (d <= r) return [x, z];
    return [this.cx + (dx / d) * r, this.cz + (dz / d) * r];
  }

  private surfaced(): boolean {
    if (!this.awake && this.state !== 'dead') return false;
    if (this.mode === 'hunt' || this.mode === 'mark' || this.mode === 'travel') return false;
    return this.hy > this.g0 - 0.4 || this.state === 'dead';
  }

  private damageMul(): number {
    switch (this.mode) {
      case 'exposed': return this.dmgMul;
      case 'spit':
      case 'spitRise': return 0.75;
      case 'sweep':
      case 'sweepTele':
      case 'sweepRise':
      case 'slamAim': return 0.6;
      default: return 0.5;
    }
  }

  private setMode(m: Mode): void {
    this.mode = m;
    this.modeT = 0;
  }

  /** Hits the dragon if it stands within r of (x, z) and below maxH above the floor. */
  private strike(x: number, z: number, r: number, maxH: number, damage: number, knockback: number, launch: number, move: string): boolean {
    const p = this.game.player;
    const b = p.body;
    const d = Math.hypot(b.x - x, b.z - z);
    if (!p.alive || d > r || b.y > this.g0 + maxH) return false;
    const n = d || 1;
    const dirX = d > 0.05 ? (b.x - x) / n : Math.sin(this.yaw);
    const dirZ = d > 0.05 ? (b.z - z) / n : Math.cos(this.yaw);
    p.takeHit(makeHit({ damage: damage * this.dmg, dirX, dirZ, knockback, launch, source: 'enemy', move, fromPlayer: false, ox: x, oz: z }), this);
    return true;
  }

  // --- the fight ---------------------------------------------------------------

  protected override think(dt: number): void {
    this.modeT += dt;
    if (this.awake) {
      this.checkPhase();
      if (this.phase >= 3) this.rockRain(dt);
    }
    this.state = this.telegraphing() ? 'windup' : 'chase';
    switch (this.mode) {
      case 'rise': this.doRise(dt); break;
      case 'dive': this.doDive(); break;
      case 'hunt': this.doHunt(dt); break;
      case 'mark': this.doMark(dt); break;
      case 'erupt': this.doErupt(); break;
      case 'arch': this.doArch(); break;
      case 'exposed': this.doExposed(dt); break;
      case 'pop': this.doPop(); break;
      case 'travel': this.doTravel(dt); break;
      case 'spitRise': this.doSpitRise(dt); break;
      case 'spit': this.doSpit(dt); break;
      case 'sweepRise': this.doSweepRise(dt); break;
      case 'sweepTele': this.doSweepTele(dt); break;
      case 'sweep': this.doSweep(dt); break;
      case 'slamAim': this.doSlamAim(dt); break;
      case 'slam': this.doSlam(); break;
    }
    this.sinkBody(dt);
    this.recordHead();
    // A worm this long needs the camera further out.
    if (this.awake) this.game.cam.extraDist = 3.2;
  }

  /**
   * Once the head is buried, whatever is left of the body above the sand
   * sinks after it, then the path it would have followed is buried too.
   */
  private sinkBody(dt: number): void {
    const under = this.mode === 'hunt' || this.mode === 'travel' || this.mode === 'mark';
    if (!under) {
      this.sinkT = 0;
      this.collapsed = false;
      return;
    }
    this.sinkT += dt;
    if (this.sinkT < 0.6) {
      const p = this.pts[Math.floor(rng.next() * this.pts.length)]!;
      if (p.y > this.g0 - 1.5 && rng.chance(0.5)) this.game.fx.dust(p.x, this.g0, p.z, 3, 0xd0b88c);
    } else if (!this.collapsed) {
      this.collapsed = true;
      for (const q of this.trail) if (q.y > this.g0 - 2.4) q.y = this.g0 - 2.4;
    }
  }

  private telegraphing(): boolean {
    if (this.mode === 'sweepTele' || this.mode === 'slamAim') return true;
    if (this.mode === 'spit') return this.spitStage === 0;
    if (this.mode === 'sweep') return this.chomp >= 0 && this.chomp < 0.55;
    return false;
  }

  private checkPhase(): void {
    const f = this.hpFrac;
    const want = f < 0.33 ? 3 : f < 0.66 ? 2 : 1;
    if (want <= this.phase) return;
    const g = this.game;
    this.phase = want;
    g.sfx('bossRoar', this.hx, this.g0, this.hz);
    g.shake(0.6, 0.8);
    if (want === 2) {
      g.toast('Graveljaw burrows faster!', 'warn');
      g.hud.flick('It\'s getting quicker! It pops up twice in a row now, so keep moving!', 6);
    } else {
      g.toast('Graveljaw is enraged! The canyon walls are crumbling!', 'warn');
      g.hud.flick('Watch its tail! Jump over the sweep, and look out for falling rocks!', 6);
      this.rainT = 1.2;
      this.pattern = 0;
    }
  }

  private doRise(dt: number): void {
    const g = this.game;
    const k = smoothstep(0, 1.6, this.modeT);
    this.hx = this.cx;
    this.hz = this.cz;
    this.hy = lerp(this.g0 - UNDER - 1, this.g0 + 6, k);
    this.pitch = lerp(1.4, 0.3, smoothstep(0.8, 2.2, this.modeT));
    this.yaw = approachAngle(this.yaw, this.yawToPlayer(), dt * 1.5);
    this.m.mawOpen = this.modeT < 2.6 ? 1 : 0.35 + Math.sin(this.modeT * 2) * 0.1;
    this.fxT -= dt;
    if (this.modeT < 1.4 && this.fxT <= 0) {
      this.fxT = 0.08;
      g.fx.rocks(this.cx + rng.signed() * 1.5, this.g0 + 0.2, this.cz + rng.signed() * 1.5, 5, 0x9a8a6a);
      g.shake(0.25, 0.1);
    }
    if (this.awake && this.modeT > 1.8) this.startDive(false);
  }

  private startDive(straight: boolean): void {
    this.setMode('dive');
    this.diveStraight = straight;
    this.diveDur = straight ? 0.45 : 0.8;
    this.ax = this.hx;
    this.ay = this.hy;
    this.az = this.hz;
    const f = straight ? 1 : 4;
    const [dx, dz] = this.clampArena(this.hx + Math.sin(this.yaw) * f, this.hz + Math.cos(this.yaw) * f);
    this.lx = dx;
    this.lz = dz;
    this.m.dazed = false;
    this.m.mawOpen = 0.3;
    this.burst = false;
  }

  private doDive(): void {
    const g = this.game;
    const k = Math.min(1, this.modeT / this.diveDur);
    const e = k * k;
    // Up a little, then down head first.
    const midY = this.ay + (this.diveStraight ? 0.5 : 1.8);
    const y = (1 - k) * (1 - k) * this.ay + 2 * (1 - k) * k * midY + k * k * (this.g0 - UNDER - 0.5);
    this.hx = lerp(this.ax, this.lx, e);
    this.hz = lerp(this.az, this.lz, e);
    this.hy = y;
    this.pitch = lerp(this.pitch, -1.35, 0.15);
    if (!this.burst && this.hy < this.g0 + 0.5) {
      this.burst = true;
      g.fx.rocks(this.hx, this.g0 + 0.2, this.hz, 16, 0x9a8a6a);
      g.fx.dust(this.hx, this.g0, this.hz, 16, 0xc8b08a);
      g.sfx('rumble', this.hx, this.g0, this.hz, 0.9);
    }
    if (k >= 1) {
      if (this.diveStraight) this.startHunt(true);
      else this.nextAttack();
    }
  }

  private nextAttack(): void {
    const lists: string[][] = [
      ['hunt', 'hunt', 'spit'],
      ['hunt', 'spit', 'hunt', 'hunt', 'spit'],
      ['sweep', 'hunt', 'spit', 'hunt'],
    ];
    const list = lists[this.phase - 1] ?? lists[0]!;
    const act = list[this.pattern % list.length]!;
    this.pattern++;
    if (act === 'hunt') this.startHunt(false);
    else if (act === 'spit') this.startTravel('spit');
    else this.startTravel('sweep');
  }

  private startHunt(second: boolean): void {
    this.setMode('hunt');
    this.second = second;
    this.secondLeft = !second && this.phase >= 2;
    this.tx = this.hx;
    this.tz = this.hz;
    const p = this.game.player.body;
    this.trailYaw = yawOf(p.x - this.tx, p.z - this.tz);
    this.clearLock();
  }

  private clearLock(): void {
    const p = this.game.player;
    if (p.lock === this) p.lock = null;
  }

  /** Dust, rocks and a rumble where the buried head is. */
  private trailFx(dt: number, speed: number): void {
    const g = this.game;
    this.mound.visible = true;
    this.mound.position.set(this.tx, this.g0 + Math.sin(this.modeT * 14) * 0.08, this.tz);
    this.mound.rotation.y = this.trailYaw;
    this.fxT -= dt;
    if (this.fxT <= 0) {
      this.fxT = 0.05;
      g.fx.dust(this.tx + rng.signed() * 0.8, this.g0, this.tz + rng.signed() * 0.8, 3, 0xd0b88c);
      if (rng.chance(0.35)) g.fx.rocks(this.tx, this.g0 + 0.2, this.tz, 2, 0x9a8a6a);
    }
    this.rumbleT -= dt;
    if (this.rumbleT <= 0) {
      this.rumbleT = speed > 10 ? 0.3 : 0.45;
      g.sfx('rumble', this.tx, this.g0, this.tz, 0.7 + rng.next() * 0.2, 0.7);
      const p = g.player.body;
      if (Math.hypot(p.x - this.tx, p.z - this.tz) < 9) g.shake(0.12, 0.25);
    }
  }

  private doHunt(dt: number): void {
    const p = this.game.player.body;
    const speed = (this.second ? 11 : this.phase >= 2 ? 9.2 : 7.4) * Math.sqrt(this.aggression);
    const turn = this.second ? 5 : this.phase >= 2 ? 4 : 3.2;
    this.trailYaw = approachAngle(this.trailYaw, yawOf(p.x - this.tx, p.z - this.tz), turn * dt);
    const [nx, nz] = this.clampArena(this.tx + Math.sin(this.trailYaw) * speed * dt, this.tz + Math.cos(this.trailYaw) * speed * dt);
    this.tx = nx;
    this.tz = nz;
    this.hx = this.tx;
    this.hz = this.tz;
    this.hy = this.g0 - UNDER;
    this.pitch = 0;
    this.yaw = this.trailYaw;
    this.trailFx(dt, speed);
    const d = Math.hypot(p.x - this.tx, p.z - this.tz);
    const maxT = this.second ? 1.0 : this.phase >= 2 ? 3.0 : 3.6;
    if (d < 1.1 || this.modeT > maxT) this.startMark(p.x, p.z);
  }

  private startMark(x: number, z: number): void {
    const g = this.game;
    const [mx, mz] = this.clampArena(x, z);
    // A streak of dust if the trail had to lunge the last few metres.
    const gap = Math.hypot(mx - this.tx, mz - this.tz);
    for (let i = 1; i <= Math.min(6, Math.ceil(gap / 1.2)); i++) {
      const t = i / Math.ceil(gap / 1.2);
      g.fx.dust(lerp(this.tx, mx, t), this.g0, lerp(this.tz, mz, t), 4, 0xd0b88c);
    }
    this.setMode('mark');
    this.ex = this.tx = this.hx = mx;
    this.ez = this.tz = this.hz = mz;
    this.markDur = (this.second ? 0.7 : this.phase >= 2 ? 0.78 : 0.95) / this.aggression;
    this.marker(mx, mz, 3.1, this.markDur);
    g.sfx('rumble', mx, this.g0, mz, 0.6, 1);
  }

  private doMark(dt: number): void {
    const g = this.game;
    this.trailFx(dt, 12);
    this.fxT -= dt;
    if (rng.chance(0.4)) g.fx.emit(this.ex + rng.signed() * 2.2, this.g0 + 0.1, this.ez + rng.signed() * 2.2, {
      count: 1, speed: 3, dir: [0, 1, 0], spread: 0.3, life: [0.3, 0.6], size: [0.3, 0.5], sizeEnd: 1.8, color: 0xd8c098, alpha: 0.6, additive: false, gravity: 4,
    });
    if (this.modeT >= this.markDur) this.startErupt();
  }

  private startErupt(): void {
    this.setMode('erupt');
    this.burst = false;
    this.mound.visible = false;
  }

  private doErupt(): void {
    const g = this.game;
    const k = Math.min(1, this.modeT / 0.42);
    this.hx = this.ex;
    this.hz = this.ez;
    this.hy = lerp(this.g0 - UNDER, this.g0 + 7.5, 1 - (1 - k) * (1 - k));
    this.pitch = 1.4;
    this.m.mawOpen = 1;
    if (!this.burst && this.hy > this.g0 - 1.2) {
      this.burst = true;
      g.fx.rocks(this.ex, this.g0 + 0.3, this.ez, 36, 0x9a8a6a);
      g.fx.dust(this.ex, this.g0, this.ez, 40, 0xd0b88c);
      g.fx.ring(this.ex, this.g0, this.ez, 0.5, 5, 0xffd8a0, 0.45);
      g.shake(0.8, 0.45);
      g.sfx('rumble', this.ex, this.g0, this.ez, 0.6, 1);
      g.sfx('bossRoar', this.ex, this.g0, this.ez, 1.1, 0.8);
      this.strike(this.ex, this.ez, 3.1, 4, 18, 7, 14, 'erupt');
    }
    if (this.modeT >= 0.55) {
      if (this.secondLeft) {
        this.secondLeft = false;
        this.startDive(true);
      } else this.startArch();
    }
  }

  private startArch(): void {
    const p = this.game.player.body;
    this.setMode('arch');
    this.ax = this.hx;
    this.ay = this.hy;
    this.az = this.hz;
    let dx = p.x - this.ex;
    let dz = p.z - this.ez;
    const d = Math.hypot(dx, dz);
    if (d < 1.5) {
      dx = Math.sin(this.yaw);
      dz = Math.cos(this.yaw);
    } else {
      dx /= d;
      dz /= d;
    }
    const [lx, lz] = this.clampArena(this.ex + dx * 6.5, this.ez + dz * 6.5);
    this.lx = lx;
    this.lz = lz;
    this.yaw = yawOf(lx - this.ex, lz - this.ez);
    this.marker(lx, lz, 2.4, 0.8);
  }

  private doArch(): void {
    const g = this.game;
    const T = 0.8;
    const k = Math.min(1, this.modeT / T);
    // Cubic curve: straight up out of the hole, over, and down onto the landing.
    const p0y = this.ay;
    const c1y = this.ay + 3.5;
    const c2y = this.g0 + HEAD_REST + 5;
    const p3y = this.g0 + HEAD_REST;
    const u = 1 - k;
    const b0 = u * u * u;
    const b1 = 3 * u * u * k;
    const b2 = 3 * u * k * k;
    const b3 = k * k * k;
    this.hx = (b0 + b1) * this.ax + (b2 + b3) * this.lx;
    this.hz = (b0 + b1) * this.az + (b2 + b3) * this.lz;
    this.hy = b0 * p0y + b1 * c1y + b2 * c2y + b3 * p3y;
    // Face along the curve.
    const dy = 3 * u * u * (c1y - p0y) + 6 * u * k * (c2y - c1y) + 3 * k * k * (p3y - c2y);
    const dh = 6 * u * k * Math.hypot(this.lx - this.ax, this.lz - this.az);
    this.pitch = Math.atan2(dy, Math.max(0.01, dh));
    if (k >= 1) {
      g.fx.rocks(this.lx, this.g0 + 0.3, this.lz, 22, 0x9a8a6a);
      g.fx.dust(this.lx, this.g0, this.lz, 24, 0xd0b88c);
      g.shake(0.5, 0.3);
      g.sfx('pound', this.lx, this.g0, this.lz, 0.7);
      this.strike(this.lx, this.lz, 2.4, 2.5, 10, 10, 6, 'headSlam');
      this.startExposed(this.phase >= 3 ? 3.0 : this.phase === 2 ? 3.3 : 3.6, 1);
    }
  }

  private startExposed(dur: number, mul: number): void {
    const g = this.game;
    this.setMode('exposed');
    this.exposedFor = dur;
    this.dmgMul = mul;
    this.reeled = false;
    this.m.dazed = true;
    this.m.mawOpen = 0.45;
    if (!this.hinted.expose) {
      this.hinted.expose = true;
      g.hud.flick('It\'s dazed! Hit it now! Ice freezes it in place, and a Tail smash on the ice shatters its plates!', 7);
    }
  }

  private doExposed(dt: number): void {
    const g = this.game;
    this.hy = this.g0 + HEAD_REST + Math.sin(this.modeT * 3) * 0.05;
    this.pitch = -0.22 + Math.sin(this.modeT * 1.7) * 0.05;
    this.fxT -= dt;
    if (this.fxT <= 0) {
      this.fxT = 0.16;
      const a = this.modeT * 5;
      g.fx.sparkle(this.hx + Math.sin(a) * 1.3, this.g0 + HEAD_REST + 2.2, this.hz + Math.cos(a) * 1.3, 0xfff0a0, 2);
    }
    if (this.modeT >= this.exposedFor) {
      if (!this.hinted.pound) {
        this.hinted.pound = true;
        g.hud.flick('Next time it digs, try a Ground Pound (jump, then E) right beside the dust trail to shake it loose!', 7);
      }
      this.startDive(false);
    }
  }

  /** A Ground Pound landed at (x, y, z); the level forwards every slam here. */
  onGroundPound(x: number, y: number, z: number): void {
    if (!this.alive || !this.awake) return;
    if (this.mode !== 'hunt' && this.mode !== 'mark' && this.mode !== 'travel') return;
    if (Math.abs(y - this.g0) > 2.5) return;
    const d = Math.hypot(x - this.tx, z - this.tz);
    if (d > 5.5) {
      if (d < 10) this.game.toast('Closer! Pound right beside the dust trail!', 'hint');
      return;
    }
    const g = this.game;
    this.pounds++;
    this.hinted.pound = true;
    for (const mk of this.markers) mk.hide();
    this.mound.visible = false;
    this.setMode('pop');
    this.ex = this.tx;
    this.ez = this.tz;
    this.burst = false;
    let dx = this.tx - x;
    let dz = this.tz - z;
    const n = Math.hypot(dx, dz);
    if (n < 0.3) {
      dx = Math.sin(this.trailYaw);
      dz = Math.cos(this.trailYaw);
    } else {
      dx /= n;
      dz /= n;
    }
    const [lx, lz] = this.clampArena(this.ex + dx * 4.2, this.ez + dz * 4.2);
    this.lx = lx;
    this.lz = lz;
    this.yaw = yawOf(lx - this.ex, lz - this.ez);
    g.toast('You shook Graveljaw loose!', 'good');
    g.sfx('bossRoar', this.tx, this.g0, this.tz, 1.3, 0.8);
    g.shake(0.5, 0.4);
  }

  private doPop(): void {
    const g = this.game;
    if (this.modeT < 0.3) {
      const k = this.modeT / 0.3;
      this.hx = this.ex;
      this.hz = this.ez;
      this.hy = lerp(this.g0 - UNDER, this.g0 + 3.2, 1 - (1 - k) * (1 - k));
      this.pitch = 1.2;
      this.m.mawOpen = 1;
      if (!this.burst && this.hy > this.g0 - 1) {
        this.burst = true;
        g.fx.rocks(this.ex, this.g0 + 0.3, this.ez, 26, 0x9a8a6a);
        g.fx.dust(this.ex, this.g0, this.ez, 26, 0xd0b88c);
      }
      this.ax = this.hx;
      this.ay = this.hy;
      this.az = this.hz;
      return;
    }
    const k = Math.min(1, (this.modeT - 0.3) / 0.45);
    this.hx = lerp(this.ax, this.lx, k);
    this.hz = lerp(this.az, this.lz, k);
    this.hy = lerp(this.ay, this.g0 + HEAD_REST, k * k) + Math.sin(k * Math.PI) * 1.5;
    this.pitch = lerp(1.2, -0.9, k);
    if (k >= 1) {
      g.fx.dust(this.lx, this.g0, this.lz, 20, 0xd0b88c);
      g.shake(0.35, 0.25);
      g.sfx('pound', this.lx, this.g0, this.lz, 0.8);
      this.startExposed(4.5, 1.25);
    }
  }

  // --- boulder volleys ------------------------------------------------------------

  private startTravel(to: 'spit' | 'sweep'): void {
    const p = this.game.player.body;
    this.setMode('travel');
    this.travelFor = to;
    this.tx = this.hx;
    this.tz = this.hz;
    if (to === 'sweep') {
      this.sx = this.cx;
      this.sz = this.cz;
    } else {
      // Surface well away from the dragon, on the far side of the arena.
      let dx = this.cx - p.x;
      let dz = this.cz - p.z;
      const n = Math.hypot(dx, dz);
      const a = (n > 0.5 ? Math.atan2(dx, dz) : rng.next() * Math.PI * 2) + rng.signed() * 0.8;
      dx = Math.sin(a);
      dz = Math.cos(a);
      this.sx = this.cx + dx * 11.5;
      this.sz = this.cz + dz * 11.5;
      if (Math.hypot(this.sx - p.x, this.sz - p.z) < 8) {
        this.sx = this.cx - dx * 11.5;
        this.sz = this.cz - dz * 11.5;
      }
    }
    this.trailYaw = yawOf(this.sx - this.tx, this.sz - this.tz);
    this.clearLock();
  }

  private doTravel(dt: number): void {
    const speed = 13;
    const dx = this.sx - this.tx;
    const dz = this.sz - this.tz;
    const d = Math.hypot(dx, dz);
    this.trailYaw = approachAngle(this.trailYaw, yawOf(dx, dz), 6 * dt);
    const step = Math.min(d, speed * dt);
    this.tx += Math.sin(this.trailYaw) * step;
    this.tz += Math.cos(this.trailYaw) * step;
    this.hx = this.tx;
    this.hz = this.tz;
    this.hy = this.g0 - UNDER;
    this.yaw = this.trailYaw;
    this.trailFx(dt, speed);
    if (d < 0.6 || this.modeT > 3) {
      this.mound.visible = false;
      this.ex = this.tx;
      this.ez = this.tz;
      this.burst = false;
      this.setMode(this.travelFor === 'spit' ? 'spitRise' : 'sweepRise');
      if (this.travelFor === 'sweep') this.marker(this.cx, this.cz, 3.4, 0.5);
    }
  }

  private doSpitRise(dt: number): void {
    const g = this.game;
    const k = Math.min(1, this.modeT / 0.6);
    this.hx = this.ex;
    this.hz = this.ez;
    this.hy = lerp(this.g0 - UNDER, this.g0 + 5.4, 1 - (1 - k) * (1 - k));
    this.pitch = lerp(1.3, 0.12, k);
    this.yaw = approachAngle(this.yaw, this.yawToPlayer(), 4 * dt);
    if (!this.burst && this.hy > this.g0 - 1) {
      this.burst = true;
      g.fx.rocks(this.ex, this.g0 + 0.3, this.ez, 24, 0x9a8a6a);
      g.fx.dust(this.ex, this.g0, this.ez, 24, 0xd0b88c);
      g.shake(0.35, 0.3);
      g.sfx('bossRoar', this.ex, this.g0, this.ez, 0.9, 0.7);
      this.strike(this.ex, this.ez, 2.6, 3, 10, 9, 8, 'burst');
    }
    if (k >= 1) {
      this.setMode('spit');
      this.volleys = this.phase >= 2 ? 2 : 1;
      this.spitStage = 0;
    }
  }

  private doSpit(dt: number): void {
    this.yaw = approachAngle(this.yaw, this.yawToPlayer(), 3 * dt);
    this.hy = this.g0 + 5.4 + Math.sin(this.modeT * 2.5) * 0.15;
    const windup = 0.85 / this.aggression;
    if (this.spitStage === 0) {
      const w = Math.min(1, this.modeT / windup);
      this.pitch = 0.12 + w * 0.35;
      this.m.mawOpen = w;
      if (this.modeT >= windup) {
        this.spitStage = 1;
        this.modeT = 0;
        this.fireVolley(this.phase >= 2 ? 5 : 3);
        this.volleys--;
      }
      return;
    }
    this.pitch = damp(this.pitch, 0.05, 8, dt);
    this.m.mawOpen = damp(this.m.mawOpen, 0.2, 5, dt);
    if (this.modeT >= 0.9) {
      if (this.volleys > 0) {
        this.spitStage = 0;
        this.modeT = 0;
      } else this.startDive(false);
    }
  }

  private fireVolley(n: number): void {
    const g = this.game;
    const p = g.player.body;
    const cp = Math.cos(this.pitch);
    const ox = this.hx + Math.sin(this.yaw) * cp * 2.3;
    const oz = this.hz + Math.cos(this.yaw) * cp * 2.3;
    const oy = this.hy + Math.sin(this.pitch) * 2.3;
    const [px, pz] = this.clampArena(p.x + p.vx * 0.45, p.z + p.vz * 0.45, 17.5);
    const aim = yawOf(px - ox, pz - oz);
    const sideX = Math.cos(aim);
    const sideZ = -Math.sin(aim);
    const grav = 16;
    for (let i = 0; i < n; i++) {
      const off = i - (n - 1) / 2;
      const along = (i % 2 === 0 ? 1 : -1) * Math.abs(off) * 0.8;
      const [txx, tzz] = this.clampArena(px + sideX * off * 3.3 + Math.sin(aim) * along, pz + sideZ * off * 3.3 + Math.cos(aim) * along, 17.5);
      const T = 1.05 + Math.abs(off) * 0.12;
      const vx = (txx - ox) / T;
      const vz = (tzz - oz) / T;
      const vy = (this.g0 + 0.3 - oy + 0.5 * grav * T * T) / T;
      const sp = Math.hypot(vx, vy, vz);
      g.spawnProjectile({
        x: ox, y: oy, z: oz, dx: vx / sp, dy: vy / sp, dz: vz / sp, speed: sp, radius: 0.65, damage: 12, type: 'earth',
        color: 0x8a7a5a, life: 4, gravity: grav, fromPlayer: false, kind: 'boulder', explode: 2.3, knockback: 7,
      });
      this.marker(txx, tzz, 2.3, T);
    }
    g.fx.rocks(ox, oy, oz, 12, 0x9a8a6a);
    g.sfx('swingHeavy', ox, oy, oz, 0.5);
    g.shake(0.2, 0.2);
  }

  // --- tail sweep (phase 3) ----------------------------------------------------------

  private doSweepRise(dt: number): void {
    const g = this.game;
    const k = Math.min(1, this.modeT / 0.8);
    this.hx = this.cx;
    this.hz = this.cz;
    this.hy = lerp(this.g0 - UNDER, this.g0 + 6.5, 1 - (1 - k) * (1 - k));
    this.pitch = lerp(1.3, 0.5, k);
    this.m.mawOpen = 1;
    this.yaw = approachAngle(this.yaw, this.yawToPlayer(), 3 * dt);
    if (!this.burst && this.hy > this.g0 - 1) {
      this.burst = true;
      g.fx.rocks(this.cx, this.g0 + 0.3, this.cz, 30, 0x9a8a6a);
      g.shake(0.5, 0.4);
      g.sfx('bossRoar', this.cx, this.g0, this.cz, 0.8, 1);
      this.strike(this.cx, this.cz, 3, 3, 10, 10, 8, 'burst');
    }
    if (k >= 1) {
      this.setMode('sweepTele');
      const p = g.player.body;
      this.sweepDir = rng.chance(0.5) ? 1 : -1;
      this.sweepA = yawOf(p.x - this.cx, p.z - this.cz) - this.sweepDir * 2.2;
      this.spoke = true;
      this.spokeMark.visible = true;
      this.spokeMark.position.set(this.cx, this.g0 + 0.08, this.cz);
      this.spokeMark.scale.set(2.2, 1, REACH + 3);
      for (let r = 3; r < 19; r += 2) {
        g.fx.rocks(this.cx + Math.sin(this.sweepA) * r, this.g0 + 0.3, this.cz + Math.cos(this.sweepA) * r, 6, 0x9a8a6a);
      }
      g.sfx('rumble', this.cx, this.g0, this.cz, 0.5, 1);
      if (!this.hinted.sweep) {
        this.hinted.sweep = true;
        g.toast('Tail sweep! Jump over it!', 'warn');
      }
    }
  }

  private doSweepTele(dt: number): void {
    this.hy = this.g0 + 6.5 + Math.sin(this.modeT * 4) * 0.2;
    this.pitch = 0.5;
    this.yaw = approachAngle(this.yaw, this.yawToPlayer(), 3 * dt);
    this.spokeMark.rotation.y = this.sweepA;
    this.spokeMat.opacity = 0.2 + 0.25 * Math.abs(Math.sin(this.modeT * 12));
    if (this.modeT >= 1.1 / Math.sqrt(this.aggression)) {
      this.spokeMark.visible = false;
      this.setMode('sweep');
      this.sweepLeft = Math.PI * 3;
      this.sweepHitCd = 0;
      this.chompT = 0.9;
      this.chomp = -1;
    }
  }

  private doSweep(dt: number): void {
    const g = this.game;
    const w = ((Math.PI * 2) / 3.1) * Math.sqrt(this.aggression);
    const step = Math.min(this.sweepLeft, w * dt);
    const prev = this.sweepA;
    this.sweepA += this.sweepDir * step;
    this.sweepLeft -= step;
    this.hy = this.g0 + 6.5 + Math.sin(this.modeT * 4) * 0.2;
    this.yaw = approachAngle(this.yaw, this.yawToPlayer(), 2.5 * dt);
    // Dust kicked up along the sweeping tail.
    this.fxT -= dt;
    if (this.fxT <= 0) {
      this.fxT = 0.04;
      const r = 3.5 + rng.next() * 15;
      g.fx.dust(this.cx + Math.sin(this.sweepA) * r, this.g0, this.cz + Math.cos(this.sweepA) * r, 3, 0xd0b88c);
    }
    this.rumbleT -= dt;
    if (this.rumbleT <= 0) {
      this.rumbleT = 0.35;
      g.sfx('swingHeavy', this.cx, this.g0, this.cz, 0.35, 0.7);
    }
    // The tail hits anything on the ground it passes through.
    this.sweepHitCd -= dt;
    const p = g.player;
    const b = p.body;
    const pr = Math.hypot(b.x - this.cx, b.z - this.cz);
    if (this.sweepHitCd <= 0 && p.alive && pr > 3.4 && pr < 19.5 && b.y < this.g0 + 1.15) {
      const pa = yawOf(b.x - this.cx, b.z - this.cz);
      const d0 = angleDiff(prev, pa);
      const d1 = angleDiff(this.sweepA, pa);
      const crossed = Math.sign(d0) !== Math.sign(d1) && Math.abs(d0) < 1.5;
      if (crossed || Math.abs(d1) * pr < 0.85) {
        this.sweepHitCd = 0.6;
        const tx = Math.cos(this.sweepA) * this.sweepDir;
        const tz = -Math.sin(this.sweepA) * this.sweepDir;
        p.takeHit(makeHit({ damage: 14 * this.dmg, dirX: tx, dirZ: tz, knockback: 10, launch: 7, source: 'enemy', move: 'tailSweep', fromPlayer: false, ox: this.cx, oz: this.cz }), this);
      }
    }
    // Snaps at anyone brave enough to hug its neck.
    this.chompT -= dt;
    if (this.chomp < 0 && this.chompT <= 0 && pr < 6) this.chomp = 0;
    if (this.chomp >= 0) {
      this.chomp += dt;
      this.m.mawOpen = Math.min(1, this.chomp / 0.55);
      this.pitch = this.chomp < 0.55 ? 0.6 : -0.4;
      if (this.chomp >= 0.55 && this.chomp - dt < 0.55) {
        g.sfx('swingHeavy', this.cx, this.g0 + 3, this.cz, 0.7);
        this.strike(this.cx, this.cz, 4.6, 3, 12, 12, 5, 'chomp');
      }
      if (this.chomp > 0.9) {
        this.chomp = -1;
        this.chompT = 1.6;
      }
    } else {
      this.pitch = damp(this.pitch, 0.5, 6, dt);
      this.m.mawOpen = damp(this.m.mawOpen, 0.4, 6, dt);
    }
    if (this.sweepLeft <= 0) this.startSlamAim();
  }

  private startSlamAim(): void {
    const p = this.game.player.body;
    this.setMode('slamAim');
    // The body leaves the spoke and goes back to following the head.
    this.trail = [this.headV.set(this.hx, this.hy, this.hz).clone(), ...this.pts.map((q) => q.clone())];
    this.spoke = false;
    this.chomp = -1;
    const [lx, lz] = this.clampArena(p.x, p.z, 12);
    this.lx = lx;
    this.lz = lz;
    this.ax = this.hx;
    this.ay = this.hy;
    this.az = this.hz;
    this.marker(lx, lz, 2.8, 0.85 / this.aggression);
  }

  private doSlamAim(dt: number): void {
    this.yaw = approachAngle(this.yaw, yawOf(this.lx - this.hx, this.lz - this.hz), 5 * dt);
    this.hy = lerp(this.ay, this.g0 + 8, Math.min(1, this.modeT / 0.5));
    this.pitch = damp(this.pitch, 0.9, 6, dt);
    this.m.mawOpen = 1;
    if (this.modeT >= 0.85 / this.aggression) {
      this.ax = this.hx;
      this.ay = this.hy;
      this.az = this.hz;
      this.setMode('slam');
    }
  }

  private doSlam(): void {
    const g = this.game;
    const k = Math.min(1, this.modeT / 0.35);
    this.hx = lerp(this.ax, this.lx, k);
    this.hz = lerp(this.az, this.lz, k);
    this.hy = lerp(this.ay, this.g0 + HEAD_REST, k * k);
    this.pitch = lerp(0.9, -0.5, k);
    if (k >= 1) {
      g.fx.rocks(this.lx, this.g0 + 0.3, this.lz, 30, 0x9a8a6a);
      g.fx.dust(this.lx, this.g0, this.lz, 30, 0xd0b88c);
      g.fx.ring(this.lx, this.g0, this.lz, 0.5, 5, 0xffd8a0, 0.4);
      g.shake(0.8, 0.4);
      g.sfx('pound', this.lx, this.g0, this.lz, 0.6);
      this.strike(this.lx, this.lz, 2.8, 2.5, 14, 11, 7, 'headSlam');
      this.startExposed(3.2, 1);
    }
  }

  // --- rock rain (phase 3) -------------------------------------------------------------

  private rockRain(dt: number): void {
    if (this.mode === 'rise') return;
    this.rainT -= dt;
    if (this.rainT > 0) return;
    this.rainT = 6.5 / Math.sqrt(this.aggression);
    this.rains++;
    const g = this.game;
    const p = g.player.body;
    for (let i = 0; i < 4; i++) {
      const [x, z] = i === 0
        ? this.clampArena(p.x + p.vx * 0.8, p.z + p.vz * 0.8, 17.5)
        : this.clampArena(p.x + rng.signed() * 7, p.z + rng.signed() * 7, 17.5);
      const h = 17;
      const v0 = 5;
      const grav = 20;
      const T = (-v0 + Math.sqrt(v0 * v0 + 2 * grav * h)) / grav;
      g.spawnProjectile({
        x, y: this.g0 + h, z, dx: 0, dy: -1, dz: 0, speed: v0, radius: 0.8, damage: 10, type: 'earth',
        color: 0x8a7a5a, life: 3, gravity: grav, fromPlayer: false, kind: 'boulder', explode: 2.2, knockback: 6,
      });
      this.marker(x, z, 2.2, T);
      g.fx.dust(x, this.g0 + h, z, 4, 0xb8a078);
    }
    g.sfx('rumble', p.x, this.g0, p.z, 0.5, 0.8);
    g.shake(0.2, 0.6);
    if (!this.hinted.rain) {
      this.hinted.rain = true;
      g.toast('Falling rocks! Watch the red rings!', 'warn');
    }
  }

  // --- body ----------------------------------------------------------------------------

  private recordHead(): void {
    const t0 = this.trail[0];
    this.headV.set(this.hx, this.hy, this.hz);
    if (t0 && t0.distanceTo(this.headV) < 0.35) return;
    this.trail.unshift(this.headV.clone());
    let acc = 0;
    const need = NECK + SEGS * SPACING + 4;
    for (let i = 1; i < this.trail.length; i++) {
      acc += this.trail[i]!.distanceTo(this.trail[i - 1]!);
      if (acc > need) {
        this.trail.length = i + 1;
        break;
      }
    }
  }

  private layoutChain(): void {
    const head = this.headV.set(this.hx, this.hy, this.hz);
    if (this.spoke) this.layoutSpoke(head);
    else this.layoutTrail(head);
    this.m.layout(this.pts, head, this.g0);
  }

  private layoutTrail(head: THREE.Vector3): void {
    let prev = head;
    let acc = 0;
    let j = 0;
    for (let i = 0; i < SEGS; i++) {
      const s = NECK + i * SPACING;
      const out = this.pts[i]!;
      let placed = false;
      while (j < this.trail.length) {
        const q = this.trail[j]!;
        const L = prev.distanceTo(q);
        if (acc + L >= s && L > 1e-4) {
          out.lerpVectors(prev, q, (s - acc) / L);
          placed = true;
          break;
        }
        acc += L;
        prev = q;
        j++;
      }
      if (!placed) out.set(prev.x, prev.y - (s - acc), prev.z);
    }
    const sink = smoothstep(0, 0.6, this.sinkT);
    if (sink > 0) for (const p of this.pts) if (p.y > this.g0 - 2.4) p.y = lerp(p.y, this.g0 - 2.4, sink);
  }

  private layoutSpoke(head: THREE.Vector3): void {
    const sx = Math.sin(this.sweepA);
    const sz = Math.cos(this.sweepA);
    const path = [
      head,
      V(this.cx, this.g0 + 3.2, this.cz),
      V(this.cx + sx * 2.4, this.g0 + 0.85, this.cz + sz * 2.4),
      V(this.cx + sx * 26, this.g0 + 0.75, this.cz + sz * 26),
    ];
    let seg = 0;
    let acc = 0;
    for (let i = 0; i < SEGS; i++) {
      const s = NECK + i * SPACING;
      while (seg < path.length - 2 && acc + path[seg]!.distanceTo(path[seg + 1]!) < s) {
        acc += path[seg]!.distanceTo(path[seg + 1]!);
        seg++;
      }
      const a = path[seg]!;
      const b = path[seg + 1]!;
      const L = a.distanceTo(b) || 1;
      this.pts[i]!.lerpVectors(a, b, clamp((s - acc) / L, 0, 1));
    }
  }

  override integrate(dt: number, _friction: number): void {
    const b = this.body;
    if (this.state === 'dead') this.deathStep(dt);
    const up = this.surfaced();
    const by = up ? this.g0 : this.g0 - 9;
    b.vx = b.vy = b.vz = 0;
    b.setPos(this.hx, by, this.hz);
    b.grounded = true;
    if (!up) this.clearLock();
    const m = this.m;
    m.trueX = this.hx;
    m.trueZ = this.hz;
    m.headLift = this.hy - by;
    m.pitch = this.pitch;
    this.layoutChain();
  }

  override updateBoss(dt: number): void {
    for (const mk of this.markers) mk.update(dt);
  }

  override takeHit(hit: Hit): HitResult {
    if (!this.alive || !this.surfaced()) return 'none';
    const mul = this.damageMul();
    const reaction: Reaction | null = reactionFor(this.status, hit);
    const h: Hit = mul !== 1 ? { ...hit, damage: hit.damage * mul, stagger: hit.stagger * mul } : hit;
    const r = super.takeHit(h);
    if (reaction === 'shatter' && r === 'hit' && this.alive) {
      const g = this.game;
      const bonus = 40;
      this.hp -= bonus;
      g.onEnemyDamaged(this, bonus, hit, 'shatter');
      g.toast('Its plates shatter!', 'good');
      g.fx.rocks(this.hx, this.hy, this.hz, 30, 0x8a7a62);
      if (this.hp <= 0) {
        this.die(hit, 'shatter');
        return 'killed';
      }
    }
    return r;
  }

  protected override onBossStagger(_hit: Hit): void {
    if (this.mode !== 'exposed' || this.reeled) return;
    this.reeled = true;
    this.exposedFor += 1.2;
    this.game.toast('Graveljaw reels!', 'good');
    this.game.sfx('bossRoar', this.hx, this.g0, this.hz, 1.4, 0.6);
  }

  override die(hit: Hit | null, reaction: Reaction | null = null): void {
    if (!this.alive) return;
    if (!this.surfaced()) {
      // Burned to death while buried: come up to die where the dragon can see.
      this.setMode('exposed');
      this.hy = this.g0 + HEAD_REST;
      this.body.setPos(this.hx, this.g0, this.hz);
    }
    super.die(hit, reaction);
    const g = this.game;
    g.cam.extraDist = 0;
    this.deathT = 0;
    this.crumbled = 0;
    this.mound.visible = false;
    this.spokeMark.visible = false;
    for (const mk of this.markers) mk.hide();
    this.m.mawOpen = 1;
    g.fx.rocks(this.hx, this.hy + 1, this.hz, 40, 0x8a7a62);
    g.fx.dust(this.hx, this.g0, this.hz, 30, 0xd0b88c);
    g.sfx('rumble', this.hx, this.g0, this.hz, 0.5, 1);
  }

  /** The body falls to rubble from the tail up. */
  private deathStep(dt: number): void {
    if (this.deathT < 0) return;
    this.deathT += dt;
    const g = this.game;
    const n = this.m.segmentCount;
    const want = Math.min(n, Math.floor((this.deathT / 2.0) * n));
    while (this.crumbled < want) {
      const p = this.m.crumble(n - 1 - this.crumbled);
      this.crumbled++;
      if (p && p.y > this.g0 - 1.5) {
        g.fx.rocks(p.x, p.y, p.z, 10, 0x8a7a62);
        if (this.crumbled % 3 === 0) g.sfx('rumble', p.x, p.y, p.z, 1.2, 0.5);
      }
    }
    this.hy = damp(this.hy, this.g0 + 0.6, 3, dt);
  }

  protected override onReset(): void {
    this.setMode('rise');
    this.hx = this.cx;
    this.hz = this.cz;
    this.hy = this.g0 - UNDER - 1;
    this.spoke = false;
    this.pattern = 0;
    this.rainT = 99;
    this.mound.visible = false;
    this.spokeMark.visible = false;
    for (const mk of this.markers) mk.hide();
    this.seedTrail();
  }

  override dispose(): void {
    super.dispose();
    this.game.cam.extraDist = 0;
    this.game.scene.remove(this.m.chain, this.world);
  }
}
