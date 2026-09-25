import * as THREE from 'three';
import { Body } from '../world/collision';
import { DragonRig, defaultPose } from './dragonRig';
import { NYXA_FREED } from '../game/story';
import type { Game } from '../game/game';
import type { Enemy } from '../enemies/enemy';
import type { Boss } from '../enemies/boss';
import type { Sfx } from '../core/audio';
import type { CollectKind } from '../entities/props';
import { makeHit, type DamageType, type HitResult, type HitSource } from '../game/types';
import { angleDiff, approachAngle, clamp, yawOf } from '../core/math';
import { glow } from '../render/materials';
import { TwinPlates } from '../entities/twinplate';

/**
 * Nyxa, fighting beside Aster once Eclipse Keep is behind them.
 *
 * She follows a little behind and to one side, walking and running on the
 * same rig as every dragon, hopping small gaps and steps, and gliding when
 * Aster glides. Whenever the ground will not take her there (a wall, a pit,
 * deep water, a hazard, a long way behind), she shadow-steps: a violet poof,
 * and she steps out of the shadows at a safe spot near Aster. She never
 * collides with Aster and never blocks a path; with nowhere safe to stand
 * she waits unseen in his shadow.
 *
 * In a fight she picks from the foes already engaged near Aster (his lock-on
 * target first), closes in from the flank and uses a claw combo, a scythe-tail
 * sweep or a shadow bolt, for about a third of what Aster deals. She follows
 * up when Aster launches a foe, finishes foes that are frozen, stunned or
 * knocked flat, and throws up a Shadow Veil over him when he is nearly down.
 * Every hit goes through the enemy's own takeHit; the move ids start with
 * `nyxa:` so the game keeps them off Aster's combo and style meter.
 *
 * The partner command (G): a tap sends her at Aster's target with a heavy
 * strike (8 s cooldown); holding it makes her stay put (on a twin plate, if
 * one is near) until the next tap. Foes never target her; anything that
 * would hit her, she simply steps out of.
 */

/** Every hit Nyxa lands carries a move id with this prefix. */
export const PARTNER_MOVE = 'nyxa:';
export const isPartnerMove = (move: string | undefined | null): boolean => !!move && move.startsWith(PARTNER_MOVE);
/** Her damage numbers and HUD accents. */
export const PARTNER_COLOR = 0xd9a0ff;

const SCALE = NYXA_FREED.scale;
const RADIUS = 0.62;
const HEIGHT = 1.25 * SCALE;
const RUN = 10.5;
const GRAVITY = 32;
const ACCEL = 42;
const COMMAND_CD = 8;
const VEIL_CD = 60;
const HOLD_STAY = 0.5;
/** Farther than this from Aster (or out of reach) and she shadow-steps back. */
const LEASH = 17;
/** She only fights foes this close to Aster. */
const FIGHT_R = 15;
const SHADOW = 0xb04cff;

type Mode = 'away' | 'ground' | 'fly' | 'shadow';

interface ActHit {
  t: number;
  range: number;
  arc: number;
  damage: number;
  knockback: number;
  launch: number;
  stagger: number;
  heavy?: boolean;
  hitstop?: number;
  offset?: number;
  swoosh?: { radius: number; arc: number; plane: 'h' | 'v'; height: number; tilt?: number; start?: number; spin?: boolean };
}

interface ActDef {
  id: string;
  pose: string;
  dur: number;
  hits: ActHit[];
  lunge?: [number, number, number];
  sfx: Sfx;
  sfxAt: number;
  /** Chains into this act if the foe is still in reach. */
  next?: string;
  air?: boolean;
  source?: HitSource;
}

const PI = Math.PI;

/** Her moves. Damage is about a third of Aster's equivalents (before his horn upgrades, which she shares). */
const ACTS: Record<string, ActDef> = {
  claw1: {
    id: 'claw', pose: 'claw1', dur: 0.46, sfx: 'swing', sfxAt: 0.14, lunge: [0, 0.18, 6], next: 'claw2',
    hits: [{ t: 0.22, range: 2.0, arc: 1.0, damage: 6, knockback: 2.5, launch: 0, stagger: 14, swoosh: { radius: 1.7, arc: 1.7, plane: 'h', height: 1.1, tilt: 0.5 } }],
  },
  claw2: {
    id: 'claw', pose: 'claw2', dur: 0.5, sfx: 'swing', sfxAt: 0.14, lunge: [0, 0.18, 6],
    hits: [{ t: 0.24, range: 2.0, arc: 1.0, damage: 7, knockback: 4, launch: 0, stagger: 18, swoosh: { radius: 1.7, arc: 1.7, plane: 'h', height: 1.0, tilt: -0.5 } }],
  },
  sweep: {
    id: 'scythe', pose: 'tail1', dur: 0.64, sfx: 'swingHeavy', sfxAt: 0.1, lunge: [0, 0.2, 2.5],
    hits: [{ t: 0.28, range: 3.0, arc: PI, damage: 12, knockback: 7, launch: 0, stagger: 32, heavy: true, swoosh: { radius: 3.0, arc: PI * 1.7, plane: 'h', height: 0.45, spin: true } }],
  },
  finish: {
    id: 'finisher', pose: 'tail3', dur: 0.8, sfx: 'swingHeavy', sfxAt: 0.3, lunge: [0, 0.3, 3],
    hits: [{ t: 0.42, range: 2.3, arc: 0.95, offset: 1.0, damage: 14, knockback: 5, launch: 4, stagger: 60, heavy: true, hitstop: 0.05, swoosh: { radius: 2.5, arc: 2.2, plane: 'v', height: 0.3, start: -0.4 } }],
  },
  strike: {
    id: 'strike', pose: 'counter', dur: 0.64, sfx: 'counter', sfxAt: 0.12, lunge: [0, 0.2, 9],
    hits: [{ t: 0.24, range: 3.1, arc: PI, damage: 22, knockback: 9, launch: 5, stagger: 90, heavy: true, hitstop: 0.05, swoosh: { radius: 3.0, arc: PI * 1.9, plane: 'h', height: 0.9 } }],
  },
  rise: {
    id: 'rise', pose: 'air3', dur: 0.6, sfx: 'launch', sfxAt: 0.05, air: true,
    hits: [{ t: 0.26, range: 2.6, arc: 1.5, damage: 8, knockback: 1, launch: 7, stagger: 20, swoosh: { radius: 2.0, arc: 2.4, plane: 'v', height: 0.6, start: 1.2 } }],
  },
  bolt: { id: 'bolt', pose: 'burst', dur: 0.56, sfx: 'zap', sfxAt: 0.22, hits: [], source: 'breath' },
  veil: { id: 'veil', pose: 'roar', dur: 0.8, sfx: 'fury', sfxAt: 0.1, hits: [] },
};

/** Lines for her speech bubble. Dry, protective, a little haunted, warming up. */
const LINES = {
  enter: {
    fen: ['So this is where the fireflies raised you. It\'s damp. I think I like it.', 'Marshlight Fen. The Hollow King called it the swamp that stole his egg. He sulked about it for a year.'],
    falls: ['Skrieka\'s old roost. I used to watch her circle from the Keep. I never once asked if she wanted to.'],
    frostworks: ['I signed the orders for these forges. I remember the ink.', 'Cold in here. The forges still hammer his chains, even now.'],
    plains: ['The stones hum here. Stonehide says it\'s the ground resting. It sounds like breathing to me.'],
    keep: ['Back here. Walls are walls. Just don\'t expect me to enjoy the view.', 'I know every corridor in this place. I wish I didn\'t.'],
    hollow: ['His roots go down forever. I can feel him at the bottom of them, listening.', 'Stay close, Aster. Down here, the dark knows my name.'],
    any: ['New ground. I\'ll keep to your shadow. It\'s where I\'m good.', 'Lead on. I\'ll watch your back.'],
  } as Record<string, string[]>,
  fight: [
    'That\'s the lot. You fight like the fireflies taught you: all at once and very bright.',
    'Clear. Breathe, Aster. You forget to.',
    'I used to lead soldiers like those. They never went down this easily when I was the one losing.',
    'Done. Flick, you can come out from behind his horn now.',
    'Not bad. Not as good as me. But not bad.',
  ],
  boss: ['It\'s over. Whatever the Gloom made of it, it\'s free now. Like me.', 'Down. I know what it\'s like to wake up after that. Be kind to it.'],
  mirror: ['That\'s what I was. Hit her harder than you hit me.'],
  hurt: ['Aster! Get behind me.', 'Stay on your feet. I am not losing you to this.', 'Careful. You\'re the only brother I\'ve got. Probably.'],
  veil: ['Not while I\'m here.', 'Shadow, cover him.', 'Stay inside the dark. It won\'t hurt you.'],
  down: ['Get up. ...There. Don\'t do that again.', 'You scared Flick. And me. Mostly Flick.'],
  idle: ['Standing still makes the quiet too loud. Can we move?', 'Flick, does he always stare at the scenery like this?', 'The voice used to fill moments like this. I prefer the frogs.'],
  secret: {
    egg: ['An egg. Still warm. Take it home. Someone took mine once.', 'Another for the hatchery. The nest by yours is getting crowded.'],
    relic: ['Old words. The Wardens wrote everything down. He only ever whispered.'],
    letter: ['Someone wrote that for somebody who never came back. Keep it safe.'],
    heart: ['You\'re getting stronger. Good. It means I worry less.'],
    mana: ['More spirit in you. I can feel it from here.'],
  } as Record<CollectKind, string[]>,
  now: ['Now.', 'Mine.', 'With pleasure.', 'Watch this.', 'Stay down.'],
  nothing: ['Nothing to hit. Lucky them.', 'At what? The scenery?'],
  notYet: ['Give me a moment.', 'Not yet.'],
  stay: ['I\'ll hold here.', 'Staying. Don\'t go far.', 'Here? Fine. I\'m good at waiting.'],
  plate: ['On the plate. Your turn.'],
  follow: ['Right behind you.', 'Coming.'],
  join: ['I\'m back. Did you miss me? Don\'t answer that.'],
};

const blobGeo = new THREE.CircleGeometry(0.55, 20);
blobGeo.rotateX(-Math.PI / 2);
const boltGeo = new THREE.SphereGeometry(0.22, 10, 8);
const veilGeo = new THREE.SphereGeometry(1, 24, 16);
const tmpV = new THREE.Vector3();
let boltMat: THREE.MeshBasicMaterial | null = null;

interface Bolt {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  target: Enemy;
  life: number;
}

export class Companion {
  readonly body = new Body(RADIUS, HEIGHT);
  private rig: DragonRig | null = null;
  private readonly pose = defaultPose();
  private blob: THREE.Mesh | null = null;
  private blobMat: THREE.MeshBasicMaterial | null = null;
  private veilMesh: THREE.Mesh | null = null;
  private veilMat: THREE.MeshBasicMaterial | null = null;
  yaw = 0;
  private visYaw = 0;
  private lastVisYaw = 0;
  mode: Mode = 'away';
  /** Hidden in the shadows: in the middle of a shadow-step, or waiting for somewhere safe to stand. */
  hidden = true;
  private stepT = 0;
  private retryT = 0;
  private pending: { x: number; y: number; z: number; then: 'strike' | 'rise' | null } | null = null;
  /** Shadow-steps taken this realm (for the tests). */
  steps = 0;
  /** Waiting where told ("Nyxa, stay") until the next tap. */
  staying = false;
  private stayX = 0;
  private stayY = 0;
  private stayZ = 0;
  target: Enemy | null = null;
  private targetT = 0;
  private reachT = 0;
  private act: ActDef | null = null;
  private actT = 0;
  private actTarget: Enemy | null = null;
  private actDone: boolean[] = [];
  private actSfx = false;
  private dashT = -1;
  private dashTarget: Enemy | null = null;
  /** Seconds until the partner command can send her in again. */
  cmdCd = 0;
  veilCd = 0;
  private veilT = 0;
  private veilOwns = false;
  private riseCd = 0;
  private finishCd = 0;
  private sweepCd = 0;
  private boltCd = 0;
  private attackCd = 0;
  private evadeCd = 0;
  private flashT = 0;
  private side = 1;
  private sideT = 0;
  private trailT = 0;
  private leadYaw = 0;
  private moveYaw = 0;
  private steerT = 0;
  private edgeT = 0;
  private edgeStop = false;
  private stuckT = 0;
  private progT = 0;
  private progD = 0;
  private flyT = 0;
  private landT = 0;
  private airHop = false;
  private idleT = 0;
  private resting = false;
  private footT = 0;
  private wispT = 0;
  private lastPX = 0;
  private lastPZ = 0;
  /** Aster's recent footsteps, for walking single file over bridges and round corners. */
  private crumbs: { x: number; y: number; z: number }[] = [];
  /** Following in his footsteps because there is no room beside him. */
  trail = false;
  private asterGroundT = 0;
  private cmdHeld = -1;
  private bolts: Bolt[] = [];
  private helpedSet = new WeakSet<Enemy>();
  /** Damage she has dealt this realm (for the tests and tuning). */
  dealt = 0;
  // Banter.
  private sayCd = 6;
  private barkCd = 0;
  private enterT = -1;
  private used = new Map<string, number>();
  private fightKills = 0;
  private calmT = 0;
  private hurtCd = 0;
  private asterWasDead = false;
  private stillT = 0;
  private bossSeen: Boss | null = null;
  private mirrorSaid = false;
  private talkT = 0;
  /** Left because the Options sent her home (she says so when she comes back). */
  private sentHome = false;

  constructor(private game: Game) {}

  // --- state for the HUD, the plates and the game -----------------------------------------

  /** Travelling with Aster in this realm (maybe hidden in his shadow). */
  get present(): boolean {
    return this.mode !== 'away';
  }
  /** 0..1: how ready the partner command is (1 = ready). */
  get ready(): number {
    return 1 - clamp(this.cmdCd / COMMAND_CD, 0, 1);
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
  get busy(): boolean {
    return this.act !== null || this.dashT >= 0;
  }

  /** Did Nyxa land a blow on this foe? (Better Together counts these.) */
  helped(e: Enemy): boolean {
    return this.helpedSet.has(e);
  }

  /** Standing (visibly, on her feet) within r of a point: twin plates ask this. */
  standingOn(x: number, y: number, z: number, r: number): boolean {
    const b = this.body;
    return this.present && !this.hidden && b.grounded && Math.hypot(b.x - x, b.z - z) < r && Math.abs(b.y - y) < 0.9;
  }

  /**
   * Whether she should be here at all: the Keep is done, she is not sent home,
   * and she is not already standing in this realm. `loading` skips the state
   * check (a realm loads before the game leaves the title or a fade).
   */
  private wanted(loading = false): boolean {
    const g = this.game;
    const lv = g.level;
    if (!lv || g.player.hidden || (!loading && (g.state === 'title' || g.state === 'menu'))) return false;
    if (!g.save.levelsDone.keep || g.options.partner === false) return false;
    // Where Nyxa already stands as herself (at home in the Sanctum, freed in the Keep), she does not also follow.
    return !lv.npcs.some((n) => n.id === 'nyxa');
  }

  // --- lifecycle ------------------------------------------------------------------------------

  private ensureRig(): DragonRig {
    if (this.rig) return this.rig;
    const g = this.game;
    const rig = new DragonRig(NYXA_FREED);
    rig.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    rig.root.visible = false;
    g.scene.add(rig.root);
    this.rig = rig;
    this.blobMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false });
    this.blob = new THREE.Mesh(blobGeo, this.blobMat);
    this.blob.renderOrder = 2;
    this.blob.visible = false;
    g.scene.add(this.blob);
    this.veilMat = new THREE.MeshBasicMaterial({ color: 0x9a50ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    this.veilMesh = new THREE.Mesh(veilGeo, this.veilMat);
    this.veilMesh.visible = false;
    this.veilMesh.renderOrder = 4;
    g.scene.add(this.veilMesh);
    return rig;
  }

  /** A new realm (or the title): she arrives with Aster, if she is coming at all. */
  reset(): void {
    this.clear();
    this.used.clear();
    this.mirrorSaid = false;
    this.sayCd = 8;
    this.enterT = -1;
    if (!this.wanted(true)) return;
    this.join(false);
    this.enterT = 5;
  }

  /** The realm is going away: hide and forget it. */
  clear(): void {
    this.leave(false);
    this.steps = 0;
    this.dealt = 0;
    this.helpedSet = new WeakSet();
  }

  private join(poof: boolean): void {
    const g = this.game;
    this.ensureRig();
    this.mode = 'shadow';
    this.hidden = true;
    this.staying = false;
    this.cmdCd = 0;
    this.stepT = 0;
    this.retryT = 0;
    this.pending = null;
    const p = g.player;
    this.leadYaw = p.yaw;
    this.lastPX = p.x;
    this.lastPZ = p.z;
    this.side = 1;
    this.crumbs.length = 0;
    this.trail = false;
    const spot = this.spotNearAster(false);
    if (spot) this.appear(spot.x, spot.y, spot.z, p.yaw, poof);
  }

  private leave(poof: boolean): void {
    if (poof && this.present && !this.hidden) this.game.fx.shadowPoof(this.body.x, this.body.y + 1.2, this.body.z, 1.8);
    this.mode = 'away';
    this.hidden = true;
    this.staying = false;
    this.target = null;
    this.act = null;
    this.dashT = -1;
    this.pending = null;
    this.cmdHeld = -1;
    this.endVeil();
    for (const b of this.bolts) this.game.scene.remove(b.mesh);
    this.bolts = [];
    if (this.rig) this.rig.root.visible = false;
    if (this.blob) this.blob.visible = false;
  }

  // --- the partner command ------------------------------------------------------------------------

  /** Once per rendered frame while playing: tap G to send her in, hold it to make her stay. */
  input(dt: number): void {
    const g = this.game;
    const inp = g.input;
    if (!this.present) {
      this.cmdHeld = -1;
      return;
    }
    if (inp.pressed('partner')) {
      // On a gamepad the button doubles as Use: something to use in reach takes the press.
      this.cmdHeld = inp.usingPad && this.promptInReach() ? -1 : 0;
    }
    if (this.cmdHeld >= 0 && inp.down('partner')) {
      this.cmdHeld += dt;
      if (this.cmdHeld >= HOLD_STAY) {
        this.cmdHeld = -1;
        this.commandStay();
      }
    }
    if (this.cmdHeld >= 0 && inp.released('partner')) {
      this.cmdHeld = -1;
      this.commandNow();
    }
  }

  private promptInReach(): boolean {
    const g = this.game;
    const p = g.player.body;
    return !!g.level?.interactables.some((it) => it.enabled && Math.hypot(it.x - p.x, it.z - p.z) < it.range && Math.abs(it.y - p.y) < 3);
  }

  /** "Nyxa, now!": at Aster's target (or the nearest foe) with a heavy strike. A tap also ends a stay. */
  commandNow(): void {
    const g = this.game;
    if (!this.present) return;
    const wasStaying = this.staying;
    this.staying = false;
    const e = this.commandTarget();
    if (!e) {
      if (wasStaying) this.bark(LINES.follow);
      else this.bark(LINES.nothing);
      return;
    }
    if (this.cmdCd > 0) {
      if (wasStaying) this.bark(LINES.follow);
      else this.bark(LINES.notYet);
      return;
    }
    this.cmdCd = COMMAND_CD;
    this.target = e;
    this.targetT = 0.6;
    this.act = null;
    this.bark(LINES.now);
    g.sfx('dodge', this.body.x, this.body.y, this.body.z, 0.7, 0.8);
    const b = this.body;
    const d = Math.hypot(e.x - b.x, e.z - b.z);
    const clear = !this.hidden && this.mode === 'ground' && d < 11 && this.lineClear(b.x, b.y + 1, b.z, e.x, e.y + 1, e.z);
    if (clear) {
      this.dashT = 0;
      this.dashTarget = e;
      return;
    }
    // Too far, or something in the way: out of the shadows beside it.
    const spot = this.spotNear(e.x, e.y, e.z, yawOf(e.x - g.player.x, e.z - g.player.z), [e.radius + 1.6, e.radius + 2.4], true);
    if (spot) this.shadowStep({ ...spot, then: 'strike' }, 0.18);
    else if (!this.hidden) {
      this.dashT = 0;
      this.dashTarget = e;
    }
  }

  /** "Nyxa, stay": she holds her ground (or the twin plate beside her) until the next tap. */
  commandStay(): void {
    const g = this.game;
    if (!this.present) return;
    const b = this.body;
    const plate = this.plateNear();
    this.staying = true;
    this.target = null;
    this.dashT = -1;
    this.act = null;
    g.sfx('ui', b.x, b.y, b.z, 0.7, 0.8);
    if (plate) {
      this.stayX = plate.x;
      this.stayY = plate.y;
      this.stayZ = plate.z;
      this.bark(LINES.plate);
    } else {
      this.stayX = b.x;
      this.stayY = b.y;
      this.stayZ = b.z;
      this.bark(LINES.stay);
    }
    if (this.hidden) {
      const y = this.safeAt(this.stayX, this.stayZ, this.stayY, 1.5, 3);
      if (y !== null) this.pending = { x: this.stayX, y, z: this.stayZ, then: null };
    }
  }

  private plateNear(): { x: number; y: number; z: number } | null {
    const g = this.game;
    const b = this.body;
    const p = g.player.body;
    for (const pr of g.level?.props ?? []) {
      if (!(pr instanceof TwinPlates)) continue;
      const s = pr.freeSpot(b.x, b.z, 6.5) ?? pr.freeSpot(p.x, p.z, 4);
      if (s) return s;
    }
    return null;
  }

  private commandTarget(): Enemy | null {
    const g = this.game;
    const p = g.player;
    const ok = (e: Enemy | null | undefined): e is Enemy => !!e && this.hittable(e) && Math.hypot(e.x - p.x, e.z - p.z) < 22;
    if (ok(p.lock)) return p.lock;
    const t = p.target as Enemy | null;
    if (t && t.isEnemy && g.enemies.includes(t) && ok(t)) return t;
    let best: Enemy | null = null;
    let bd = 17;
    for (const e of g.enemies) {
      if (!this.hittable(e) || Math.abs(e.y - p.y) > 6) continue;
      const d = Math.hypot(e.x - p.x, e.z - p.z) - (e.aggro ? 3 : 0);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  // --- the frame ----------------------------------------------------------------------------------------

  update(dt: number): void {
    const g = this.game;
    const want = this.wanted();
    if (want && !this.present) {
      this.join(true);
      if (this.sentHome && g.state === 'play') this.line('join', LINES.join, 4, true);
      this.sentHome = false;
    } else if (!want && this.present) {
      this.leave(true);
      this.sentHome = g.options.partner === false;
    }
    if (!this.present) return;
    this.timers(dt);
    const p = g.player;
    // Aster moved a long way at once (a Wardstone flight, a respawn): catch up.
    const jumped = Math.hypot(p.x - this.lastPX, p.z - this.lastPZ) > 9;
    this.lastPX = p.x;
    this.lastPZ = p.z;
    this.asterGroundT = p.body.grounded ? this.asterGroundT + dt : 0;
    this.footprints(jumped);
    this.updateBolts(dt);
    this.updateVeil(dt);
    this.banter(dt);
    if (this.hidden) {
      this.updateHidden(dt);
      this.present3d(dt);
      return;
    }
    if (jumped && !this.staying) {
      this.shadowStep(null);
      this.present3d(dt);
      return;
    }
    if (this.danger()) {
      this.present3d(dt);
      return;
    }
    const b = this.body;
    g.col.carry(b);
    if (this.mode === 'fly') this.updateFly(dt);
    else this.updateGround(dt);
    this.present3d(dt);
  }

  private timers(dt: number): void {
    this.cmdCd = Math.max(0, this.cmdCd - dt);
    this.veilCd = Math.max(0, this.veilCd - dt);
    this.riseCd = Math.max(0, this.riseCd - dt);
    this.finishCd = Math.max(0, this.finishCd - dt);
    this.sweepCd = Math.max(0, this.sweepCd - dt);
    this.boltCd = Math.max(0, this.boltCd - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.evadeCd = Math.max(0, this.evadeCd - dt);
    this.flashT = Math.max(0, this.flashT - dt);
    this.sayCd = Math.max(0, this.sayCd - dt);
    this.barkCd = Math.max(0, this.barkCd - dt);
    this.hurtCd = Math.max(0, this.hurtCd - dt);
    this.talkT = Math.max(0, this.talkT - dt);
    this.sideT -= dt;
    this.trailT -= dt;
    this.steerT -= dt;
    this.edgeT -= dt;
    this.targetT -= dt;
  }

  // --- shadow-stepping -----------------------------------------------------------------------------------

  /** Into the shadows: a poof here, and out again at `dest` (or somewhere safe near Aster). */
  private shadowStep(dest: { x: number; y: number; z: number; then?: 'strike' | 'rise' | null } | null, delay = 0.35): void {
    const g = this.game;
    const b = this.body;
    if (!this.hidden) {
      g.fx.shadowPoof(b.x, b.y + 1.1, b.z, 1.6);
      g.sfx('dodge', b.x, b.y, b.z, 0.6, 0.6);
    }
    this.hidden = true;
    this.mode = 'shadow';
    this.act = null;
    this.dashT = -1;
    this.stepT = delay;
    this.retryT = 0;
    this.stuckT = 0;
    this.pending = dest ? { x: dest.x, y: dest.y, z: dest.z, then: dest.then ?? null } : null;
    b.vx = b.vy = b.vz = 0;
    this.steps++;
  }

  private updateHidden(dt: number): void {
    const g = this.game;
    this.stepT -= dt;
    if (this.stepT > 0) return;
    this.retryT -= dt;
    if (this.retryT > 0) return;
    this.retryT = 0.3;
    const p = g.player;
    if (this.pending) {
      const d = this.pending;
      this.pending = null;
      const face = d.then && this.target ? yawOf(this.target.x - d.x, this.target.z - d.z) : yawOf(p.x - d.x, p.z - d.z);
      this.appear(d.x, d.y, d.z, face, true);
      if (d.then === 'strike' && this.target && this.hittable(this.target)) this.startAct('strike', this.target);
      return;
    }
    if (this.staying) {
      const y = this.safeAt(this.stayX, this.stayZ, this.stayY, 1.5, 3);
      if (y !== null) {
        this.appear(this.stayX, y, this.stayZ, yawOf(p.x - this.stayX, p.z - this.stayZ), true);
        return;
      }
    }
    // Gliding: step out of the dark into the air beside him.
    if (p.gliding) {
      const s = this.airSpot();
      if (s) {
        this.appear(s.x, s.y, s.z, p.yaw, true);
        this.mode = 'fly';
        this.flyT = 0;
        this.landT = 0;
      }
      return;
    }
    // Only once Aster has his feet under him (not mid-jump, not on a moving lift).
    if (!p.body.grounded && p.y - p.body.groundY > 1.2) return;
    const s = this.spotNearAster(true);
    if (s) this.appear(s.x, s.y, s.z, p.yaw, true);
  }

  private appear(x: number, y: number, z: number, yaw: number, poof: boolean): void {
    const g = this.game;
    const b = this.body;
    b.setPos(x, y, z);
    b.vx = b.vy = b.vz = 0;
    b.grounded = true;
    this.yaw = yaw;
    this.visYaw = yaw;
    this.lastVisYaw = yaw;
    this.hidden = false;
    this.mode = 'ground';
    this.stuckT = 0;
    this.progT = 0;
    this.reachT = 0;
    this.resting = false;
    this.idleT = 0;
    this.airHop = false;
    if (poof) {
      g.fx.shadowPoof(x, y + 1.1, z, 1.6);
      g.fx.ring(x, y + 0.1, z, 0.3, 2.4, SHADOW, 0.35);
      g.sfx('dodge', x, y, z, 0.8, 0.5);
    }
    if (this.rig) this.rig.root.visible = true;
  }

  /** A safe spot beside Aster, behind or to a side, ideally out of the camera's view. */
  private spotNearAster(hiddenFirst: boolean): { x: number; y: number; z: number } | null {
    const p = this.game.player;
    const heading = Math.hypot(p.body.vx, p.body.vz) > 1.5 ? yawOf(p.body.vx, p.body.vz) : p.yaw;
    const y = p.body.grounded ? p.y : Math.max(p.body.groundY, p.y - 3);
    return this.spotNear(p.x, y, p.z, heading, [3, 4.2, 2.4, 5.6], false, hiddenFirst);
  }

  /**
   * Picks a place to stand around (x, y, z): solid, dry, off hazards, clear of
   * walls and foes, in sight of the centre, at one of the given distances.
   * Behind the heading reads best; out of the camera's view is better still.
   */
  private spotNear(x: number, y: number, z: number, heading: number, radii: number[], near: boolean, hiddenFirst = false): { x: number; y: number; z: number } | null {
    const g = this.game;
    const angles = near ? [0, 0.7, -0.7, 1.4, -1.4, 2.2, -2.2] : [PI * 0.55, -PI * 0.55, PI * 0.75, -PI * 0.75, PI * 0.3, -PI * 0.3, PI, 0];
    let best: { x: number; y: number; z: number } | null = null;
    let bestS = -Infinity;
    const cam = g.camera;
    for (let ri = 0; ri < radii.length; ri++) {
      const r = radii[ri]!;
      for (let ai = 0; ai < angles.length; ai++) {
        const a = heading + angles[ai]!;
        const sx = x + Math.sin(a) * r;
        const sz = z + Math.cos(a) * r;
        const sy = this.safeAt(sx, sz, y, 1.4, 1.8);
        if (sy === null) continue;
        if (!this.lineClear(x, y + 1, z, sx, sy + 1, sz)) continue;
        if (g.enemies.some((e) => e.alive && Math.hypot(e.x - sx, e.z - sz) < e.radius + RADIUS + 0.4 && Math.abs(e.y - sy) < 2)) continue;
        let s = -ri * 0.8 - ai * 0.35 - Math.abs(sy - y) * 0.6;
        if (hiddenFirst) {
          tmpV.set(sx, sy + 1, sz).project(cam);
          if (tmpV.z > 1 || Math.abs(tmpV.x) > 1 || Math.abs(tmpV.y) > 1) s += 2.5;
        }
        if (s > bestS) {
          bestS = s;
          best = { x: sx, y: sy, z: sz };
        }
      }
      // A good spot at a close ring beats searching the wider ones.
      if (best && bestS > -ri * 0.8 - 1.2) break;
    }
    return best;
  }

  /** Beside a gliding Aster, in open air. */
  private airSpot(): { x: number; y: number; z: number } | null {
    const g = this.game;
    const p = g.player;
    for (const s of [this.side, -this.side]) {
      const r = this.rightOf(p.yaw);
      const x = p.x + r.x * s * 2.8 - Math.sin(p.yaw) * 2;
      const z = p.z + r.z * s * 2.8 - Math.cos(p.yaw) * 2;
      const y = p.y + 0.2;
      if (g.col.blocked(x, y, z, RADIUS, HEIGHT)) continue;
      if (!this.lineClear(p.x, p.y + 1, p.z, x, y + 1, z)) continue;
      this.side = s;
      return { x, y, z };
    }
    return null;
  }

  /**
   * Ground height to stand at (x, z), no more than `rise` above or `drop`
   * below refY, or null if it is not somewhere she should stand.
   */
  private safeAt(x: number, z: number, refY: number, rise: number, drop: number): number | null {
    const g = this.game;
    const col = g.col;
    const gr = col.groundAt(x, z, refY + rise, 0.25);
    if (gr.y < -1e3 || gr.y < refY - drop || gr.y < g.killY + 1.5) return null;
    if (gr.solid && (gr.solid.dynamic || gr.solid.unsafe)) return null;
    if (g.isDeepWater(x, z, gr.y) || g.inHazard(x, gr.y + 0.3, z)) return null;
    for (const [ox, oz] of [[0.75, 0], [-0.75, 0], [0, 0.75], [0, -0.75]] as const) {
      const gy = col.groundAt(x + ox, z + oz, gr.y + 0.6, 0.05).y;
      if (gy < gr.y - 0.7 || g.isDeepWater(x + ox, z + oz, gy)) return null;
    }
    if (col.blocked(x, gr.y + 0.4, z, RADIUS * 0.9, HEIGHT - 0.5)) return null;
    return gr.y;
  }

  private lineClear(ax: number, ay: number, az: number, bx: number, by: number, bz: number): boolean {
    const dx = bx - ax;
    const dy = by - ay;
    const dz = bz - az;
    const len = Math.hypot(dx, dy, dz);
    if (len < 0.1) return true;
    const hit = this.game.col.raycast(ax, ay, az, dx / len, dy / len, dz / len, len, false);
    return hit.t >= len - 0.25;
  }

  private rightOf(yaw: number): { x: number; z: number } {
    return { x: -Math.cos(yaw), z: Math.sin(yaw) };
  }

  // --- danger: hazards, falls, blows aimed her way ----------------------------------------------------

  /** Returns true if she had to step away this frame. */
  private danger(): boolean {
    const g = this.game;
    const b = this.body;
    // Fell out of the world, or into deep water or a hazard.
    const wl = g.waterLevel;
    if (b.y < g.killY + 1 || (wl > -1e3 && b.y < wl - 0.6) || (b.grounded && g.isDeepWater(b.x, b.z, b.y)) || g.inHazard(b.x, b.y + 0.3, b.z)) {
      this.shadowStep(this.staying ? this.stayDest() : null, 0.3);
      return true;
    }
    if (this.evadeCd > 0 || this.act?.air) return false;
    const cy = b.y + HEIGHT * 0.5;
    let threat: { x: number; z: number } | null = null;
    for (const pr of g.projectiles) {
      if (!pr.alive || pr.spec.fromPlayer || pr.reflected) continue;
      if (Math.hypot(pr.x - b.x, (pr.y - cy) * 0.8, pr.z - b.z) < pr.spec.radius + RADIUS + 0.8) {
        threat = { x: pr.x, z: pr.z };
        break;
      }
    }
    if (!threat) {
      for (const e of g.enemies) {
        if (!e.alive || e.state !== 'active' || !e.attack || e.attack.kind !== 'melee') continue;
        const d = Math.hypot(e.x - b.x, e.z - b.z);
        const reach = e.radius + (e.attack.hitRange ?? 2) + RADIUS + 0.3;
        if (d > reach || Math.abs(e.y - b.y) > 2.5) continue;
        if (Math.abs(angleDiff(e.yaw, yawOf(b.x - e.x, b.z - e.z))) > (e.attack.hitArc ?? 1.2) + 0.3) continue;
        threat = { x: e.x, z: e.z };
        break;
      }
    }
    if (!threat) {
      // Shockwaves: hop them, like Aster does.
      for (const s of g.shockwaves) {
        if (!s.alive || !b.grounded) continue;
        const d = Math.hypot(s.x - b.x, s.z - b.z);
        if (d > s.r - 0.3 && d < s.r + 1.6 && d < s.maxR && Math.abs(s.y - b.y) < 1.5) {
          b.vy = 9;
          b.grounded = false;
          this.airHop = true;
          this.evadeCd = 0.5;
          return false;
        }
      }
      return false;
    }
    this.evadeCd = 1.4;
    this.flashT = 0.3;
    // A short step aside, away from whatever it was.
    const away = yawOf(b.x - threat.x, b.z - threat.z);
    const spot = this.staying ? this.stayDest() : this.spotNear(b.x, b.y, b.z, away, [2.6, 3.4], true) ?? this.spotNearAster(false);
    this.shadowStep(spot ? { ...spot, then: null } : null, 0.15);
    return true;
  }

  private stayDest(): { x: number; y: number; z: number; then: null } | null {
    const y = this.safeAt(this.stayX, this.stayZ, this.stayY, 1.5, 3);
    return y === null ? null : { x: this.stayX, y, z: this.stayZ, then: null };
  }

  // --- on the ground: following and fighting -------------------------------------------------------

  private updateGround(dt: number): void {
    const g = this.game;
    const b = this.body;
    const p = g.player;
    const pb = p.body;
    const playing = g.state === 'play';
    const distA = Math.hypot(pb.x - b.x, pb.z - b.z);

    // Take to the air with a gliding Aster.
    if (!this.staying && p.gliding && p.airTime > 0.3 && pb.y - pb.groundY > 2.2 && !this.busy) {
      if (distA > 10) {
        const s = this.airSpot();
        if (s) {
          this.shadowStep(null, 0.2);
          return;
        }
      }
      this.takeOff();
      return;
    }

    // Too far behind, or stuck below or above him.
    if (!this.staying && !this.busy && (distA > LEASH || (Math.abs(pb.y - b.y) > 4.5 && this.asterGroundT > 0.6 && b.grounded))) {
      this.shadowStep(null);
      return;
    }

    if (playing && !this.staying) this.assists();
    if (this.hidden) return;

    if (this.act) this.updateAct(dt);
    else if (this.dashT >= 0) this.updateDash(dt);
    else if (this.staying) this.updateStay(dt);
    else {
      if (playing) this.pickTarget();
      else this.target = null;
      if (this.target) this.updateFight(dt);
      else this.updateFollow(dt);
    }
    if (this.hidden) return;
    this.physics(dt);
  }

  private physics(dt: number): void {
    const g = this.game;
    const b = this.body;
    const pb = g.player.body;
    // Never on top of Aster, never inside a foe: she gives way.
    if (!this.act && this.dashT < 0 && b.grounded) {
      const dx = b.x - pb.x;
      const dz = b.z - pb.z;
      const d = Math.hypot(dx, dz);
      if (d < 1.5 && Math.abs(pb.y - b.y) < 2) {
        const n = d || 1;
        b.vx += (dx / n) * 20 * dt;
        b.vz += (dz / n) * 20 * dt;
      }
    }
    for (const e of g.enemies) {
      if (!e.alive || e.def.flying) continue;
      const dx = b.x - e.x;
      const dz = b.z - e.z;
      const min = e.radius + RADIUS * 0.85;
      const d = Math.hypot(dx, dz);
      if (d < min && d > 1e-4 && Math.abs(b.y - e.y) < 1.5) {
        b.x += (dx / d) * (min - d) * 0.8;
        b.z += (dz / d) * (min - d) * 0.8;
      }
    }
    b.vy = Math.max(-32, b.vy - GRAVITY * (b.vy < 0 ? 1.15 : 1) * dt);
    const wasGrounded = b.grounded;
    const vy0 = b.vy;
    g.col.move(b, dt);
    if (b.grounded && !wasGrounded) {
      this.airHop = false;
      if (vy0 < -8) {
        g.fx.dust(b.x, b.y, b.z, 5);
        g.sfx('land', b.x, b.y, b.z, 0.8, Math.min(0.6, -vy0 / 30));
      }
    }
  }

  /** Where she walks when all is calm: behind Aster and off to one side. */
  private followPoint(dt: number): { x: number; z: number } {
    const g = this.game;
    const p = g.player;
    const pb = p.body;
    const hs = Math.hypot(pb.vx, pb.vz);
    const want = hs > 1.5 ? yawOf(pb.vx, pb.vz) : p.yaw;
    this.leadYaw += angleDiff(this.leadYaw, want) * Math.min(1, (hs > 1.5 ? 3 : 0.8) * dt);
    const r = this.rightOf(this.leadYaw);
    const fx = Math.sin(this.leadYaw);
    const fz = Math.cos(this.leadYaw);
    // Keep to whichever side she is already on, unless that side is walled off.
    if (this.sideT <= 0) {
      this.sideT = 0.8;
      const b = this.body;
      const cur = (b.x - pb.x) * r.x + (b.z - pb.z) * r.z;
      let s = Math.abs(cur) > 0.6 ? Math.sign(cur) : this.side;
      const ok = (side: number) => this.lineClear(pb.x, pb.y + 1, pb.z, pb.x + r.x * side * 3 - fx * 0.8, pb.y + 1, pb.z + r.z * side * 3 - fz * 0.8);
      if (!ok(s) && ok(-s)) s = -s;
      this.side = s;
    }
    // Beside him and a little back, out of the camera's line to him.
    const back = hs > 5 ? 0.9 : 0.4;
    const side = (s: number) => ({ x: pb.x + r.x * s * 3 - fx * back, z: pb.z + r.z * s * 3 - fz * back });
    if (this.trailT <= 0) {
      // No room at his side (a bridge, a ledge, a corridor): single file, in his footsteps.
      this.trailT = 0.3;
      const ok = (q: { x: number; z: number }) => this.safeAt(q.x, q.z, pb.y, 1.2, 1.6) !== null && this.lineClear(pb.x, pb.y + 1, pb.z, q.x, pb.y + 1, q.z) && this.walkable(q.x, q.z);
      if (ok(side(this.side))) this.trail = false;
      else if (ok(side(-this.side))) {
        this.side = -this.side;
        this.trail = false;
      } else this.trail = this.crumbs.length >= 2;
    }
    if (this.trail) {
      const t = this.trailPoint();
      if (t) return t;
    }
    return side(this.side);
  }

  /** Notes where Aster walks (on firm ground only), and forgets it all when he jumps across the realm. */
  private footprints(jumped: boolean): void {
    const pb = this.game.player.body;
    const c = this.crumbs;
    if (jumped) c.length = 0;
    if (!pb.grounded || (pb.ground && pb.ground.dynamic)) return;
    const last = c[c.length - 1];
    if (last && Math.hypot(last.x - pb.x, last.z - pb.z) < 0.7) return;
    c.push({ x: pb.x, y: pb.y, z: pb.z });
    if (c.length > 48) c.shift();
  }

  /**
   * Can she walk straight from where she is to (x, z)? Ground all the way
   * (no drop she could not step down, no deep water, no hazard). A cheap
   * test at a few points, for choosing between his side and his footsteps.
   */
  private walkable(x: number, z: number): boolean {
    const g = this.game;
    const b = this.body;
    const d = Math.hypot(x - b.x, z - b.z);
    const n = Math.min(8, Math.ceil(d / 1.2));
    let y = b.y;
    for (let i = 1; i <= n; i++) {
      const k = i / n;
      const px = b.x + (x - b.x) * k;
      const pz = b.z + (z - b.z) * k;
      const gy = g.col.groundAt(px, pz, y + 1.2, 0.2).y;
      if (gy < y - 1.9 || gy < g.killY + 1.5 || g.isDeepWater(px, pz, gy) || g.inHazard(px, gy + 0.3, pz)) return false;
      y = gy;
    }
    return true;
  }

  /** Is she walking on Aster's footsteps (not just heading for them)? */
  private onTrail = false;

  /** A footstep of Aster's a little behind him, reached along the way he went. */
  private trailPoint(): { x: number; z: number } | null {
    const c = this.crumbs;
    const n = c.length;
    if (n < 2) return null;
    const pb = this.game.player.body;
    const b = this.body;
    let k = n - 1;
    let acc = Math.hypot(c[k]!.x - pb.x, c[k]!.z - pb.z);
    while (k > 0 && acc < 2.8) {
      acc += Math.hypot(c[k]!.x - c[k - 1]!.x, c[k]!.z - c[k - 1]!.z);
      k--;
    }
    // Walk the trail from the footstep nearest her, a couple at a time.
    let j = -1;
    let jd = 3.5;
    for (let i = 0; i <= k; i++) {
      const d = Math.hypot(c[i]!.x - b.x, c[i]!.z - b.z);
      if (d < jd) {
        jd = d;
        j = i;
      }
    }
    // Off the trail: first to the nearest footstep (carefully); on it, a couple of steps ahead.
    const on = j >= 0 && jd < 1.2;
    const idx = j < 0 ? k : on ? Math.min(k, j + 2) : j;
    // Footsteps close together were walked; a wide space between two means he jumped it, so look where she steps.
    let walked = on;
    for (let i = Math.max(0, j); walked && i < idx; i++) if (Math.hypot(c[i + 1]!.x - c[i]!.x, c[i + 1]!.z - c[i]!.z) > 1.3) walked = false;
    this.onTrail = walked;
    const q = c[idx]!;
    return { x: q.x, z: q.z };
  }

  private updateFollow(dt: number): void {
    const g = this.game;
    const b = this.body;
    const pb = g.player.body;
    const f = this.followPoint(dt);
    const d = Math.hypot(f.x - b.x, f.z - b.z);
    const hs = Math.hypot(pb.vx, pb.vz);
    const speed = d > 7 ? RUN : d > 2.2 ? Math.max(4, Math.min(RUN, hs + 2 + d * 0.3)) : Math.max(2.2, hs);
    this.drive(dt, f.x, f.z, speed, this.trail ? 0.3 : 0.6, pb.y, this.trail && this.onTrail);
    this.watchProgress(dt, d);
    // Settling down when nothing is happening: a stretch, then a rest.
    const still = hs < 0.5 && d < 1.4;
    this.idleT = still ? this.idleT + dt : 0;
    if (this.idleT > 16) this.resting = true;
    if (!still) this.resting = false;
    if (still && this.idleT > 0.8) this.yaw = approachAngle(this.yaw, yawOf(pb.x - b.x, pb.z - b.z) + this.side * 0.9, 1.5 * dt);
  }

  /** Counts time spent not getting closer to where she wants to be. */
  private watchProgress(dt: number, d: number): void {
    this.progT += dt;
    if (this.progT < 0.8) return;
    this.progT = 0;
    if (d > 3.5 && d > this.progD - 0.4) this.stuckT += 0.8;
    else this.stuckT = 0;
    this.progD = d;
    if (this.stuckT >= 1.6) this.shadowStep(null);
  }

  /**
   * Walks toward (gx, gz): turns the body along the way, steers round what is
   * in front, stops at edges and water, and hops gaps and steps it can manage.
   */
  private drive(dt: number, gx: number, gz: number, speed: number, stop: number, goalY: number, trusted = false): number {
    const b = this.body;
    const dx = gx - b.x;
    const dz = gz - b.z;
    const d = Math.hypot(dx, dz);
    let want = 0;
    if (d > stop) {
      want = speed * clamp((d - stop) / 1.2, 0.3, 1);
      if (trusted) this.moveYaw = yawOf(dx, dz);
      else if (this.steerT <= 0) {
        this.steerT = 0.12;
        this.moveYaw = this.steer(yawOf(dx, dz), Math.min(d, 3));
      }
    }
    if (!b.grounded) {
      // Airborne (a hop, a fall): keep the arc, with a little air control.
      if (!this.airHop && want > 0) {
        b.vx += (Math.sin(this.moveYaw) * want - b.vx) * Math.min(1, dt * 2);
        b.vz += (Math.cos(this.moveYaw) * want - b.vz) * Math.min(1, dt * 2);
      }
      return d;
    }
    // Aster's own footsteps are known ground: no need to test the edge.
    if (want > 0.5 && !trusted) {
      if (this.edgeT <= 0) {
        this.edgeT = 0.1;
        this.edgeStop = !this.edgeOk(this.moveYaw, goalY);
        if (this.airHop) return d;
      }
      if (this.edgeStop) want = 0;
    }
    const hs = Math.hypot(b.vx, b.vz);
    if (want > 0.3) {
      const k = clamp(hs / RUN, 0, 1);
      this.yaw = approachAngle(this.yaw, this.moveYaw, (13 - 6 * k) * dt);
    }
    const align = Math.cos(angleDiff(this.yaw, this.moveYaw));
    const tgt = want * clamp(0.45 + 0.55 * align, 0.2, 1);
    const tx = Math.sin(this.yaw) * tgt;
    const tz = Math.cos(this.yaw) * tgt;
    const ddx = tx - b.vx;
    const ddz = tz - b.vz;
    const dl = Math.hypot(ddx, ddz);
    const a = ACCEL * dt;
    if (dl <= a) {
      b.vx = tx;
      b.vz = tz;
    } else {
      b.vx += (ddx / dl) * a;
      b.vz += (ddz / dl) * a;
    }
    // Walking into a step or a low ledge: hop up it.
    if (b.hitWall && want > 1 && b.grounded) this.tryStepUp(this.moveYaw);
    return d;
  }

  /** The way toward `yaw`, or the nearest clear way around what is in front. */
  private steer(yaw: number, look: number): number {
    const col = this.game.col;
    const b = this.body;
    const reach = look + RADIUS;
    for (const off of [0, 0.5, -0.5, 1.0, -1.0, 1.5, -1.5]) {
      const a = yaw + off * this.side;
      const ex = b.x + Math.sin(a) * reach;
      const ez = b.z + Math.cos(a) * reach;
      // Aim along the ground (up or down a slope), at about knee height.
      const gy = col.groundAt(ex, ez, b.y + 1.2, 0.1).y;
      const ey = (gy > b.y - 3 ? gy : b.y) + 0.8;
      if (this.lineClear(b.x, b.y + 0.8, b.z, ex, ey, ez)) return a;
    }
    return yaw;
  }

  /** Ground ahead is fine to walk onto? If not, she tries a hop across; false means stop here. */
  private edgeOk(yaw: number, goalY: number): boolean {
    const g = this.game;
    const b = this.body;
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    const px = b.x + fx * (RADIUS + 1.0);
    const pz = b.z + fz * (RADIUS + 1.0);
    const lower = goalY < b.y - 1.2;
    if (this.safeAt(px, pz, b.y, 0.9, lower ? 6 : 1.9) !== null) return true;
    // A step or a low ledge in the way: hop up onto it.
    for (const dist of [RADIUS + 1.5, RADIUS + 1.0]) {
      const ux = b.x + fx * dist;
      const uz = b.z + fz * dist;
      const uy = this.safeAt(ux, uz, b.y + 1.0, 0.9, 0.6);
      if (uy !== null && uy > b.y + b.stepUp + 0.05 && this.lineClear(b.x, uy + 1.2, b.z, ux, uy + 1.2, uz)) {
        this.hop(ux, uy, uz);
        return true;
      }
    }
    // Something to walk on right there at all (a slope, rubble)? Then it is a real drop or a hazard.
    for (const dist of [2.6, 3.5, 4.4, 5.4]) {
      const lx = b.x + fx * dist;
      const lz = b.z + fz * dist;
      const ly = this.safeAt(lx, lz, b.y, 1.1, 2.6);
      if (ly !== null && this.lineClear(b.x, b.y + 1.6, b.z, lx, ly + 1.6, lz)) {
        this.hop(lx, ly, lz);
        return true;
      }
    }
    void g;
    return false;
  }

  private tryStepUp(yaw: number): void {
    const g = this.game;
    const b = this.body;
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    for (const reach of [RADIUS + 0.45, RADIUS + 0.9]) {
      const x = b.x + fx * reach;
      const z = b.z + fz * reach;
      const top = g.col.groundAt(x, z, b.y + 2.0, 0.05).y;
      const rise = top - b.y;
      if (rise <= b.stepUp + 0.05 || rise > 1.9) continue;
      const lx = x + fx * 0.6;
      const lz = z + fz * 0.6;
      const ly = this.safeAt(lx, lz, top, 0.3, 0.5);
      if (ly === null) continue;
      this.hop(lx, ly, lz);
      return;
    }
  }

  private hop(tx: number, ty: number, tz: number): void {
    const g = this.game;
    const b = this.body;
    const dx = tx - b.x;
    const dz = tz - b.z;
    const d = Math.hypot(dx, dz) || 1;
    const vy = 10 + Math.max(0, ty - b.y) * 1.6;
    const disc = vy * vy - 2 * GRAVITY * (ty - b.y);
    const t = (vy + Math.sqrt(Math.max(0, disc))) / GRAVITY;
    const hs = Math.min(13, d / Math.max(0.3, t));
    b.vx = (dx / d) * hs;
    b.vz = (dz / d) * hs;
    b.vy = vy;
    b.grounded = false;
    this.airHop = true;
    this.yaw = yawOf(dx, dz);
    this.moveYaw = this.yaw;
    this.pose.flapT = 0;
    g.sfx('jump', b.x, b.y, b.z, 0.8, 0.6);
  }

  // --- flight --------------------------------------------------------------------------------------------

  private takeOff(): void {
    const g = this.game;
    const b = this.body;
    this.mode = 'fly';
    this.flyT = 0;
    this.landT = 0;
    this.act = null;
    this.target = null;
    b.vy = Math.max(b.vy, 9);
    b.grounded = false;
    this.pose.flapT = 0;
    g.sfx('flap', b.x, b.y, b.z, 0.8, 0.7);
  }

  private updateFly(dt: number): void {
    const g = this.game;
    const b = this.body;
    const p = g.player;
    const pb = p.body;
    this.flyT += dt;
    const landing = !p.gliding;
    let gx: number;
    let gy: number;
    let gz: number;
    if (!landing) {
      const r = this.rightOf(p.yaw);
      gx = pb.x + r.x * this.side * 2.8 - Math.sin(p.yaw) * 2.2;
      gz = pb.z + r.z * this.side * 2.8 - Math.cos(p.yaw) * 2.2;
      gy = pb.y + 0.2;
    } else {
      this.landT += dt;
      const f = this.followPoint(dt);
      gx = f.x;
      gz = f.z;
      const ground = g.col.groundAt(gx, gz, pb.y + 2, 0.3).y;
      gy = ground > -1e3 ? ground : pb.y;
    }
    const dx = gx - b.x;
    const dy = gy - b.y;
    const dz = gz - b.z;
    const hs = Math.hypot(pb.vx, pb.vz);
    const maxS = Math.max(9, hs + 5);
    let vx = dx * 2.6;
    let vz = dz * 2.6;
    const h = Math.hypot(vx, vz);
    if (h > maxS) {
      vx *= maxS / h;
      vz *= maxS / h;
    }
    const k = Math.min(1, dt * 4);
    b.vx += (vx - b.vx) * k;
    b.vz += (vz - b.vz) * k;
    b.vy += (clamp(dy * 2.2, landing ? -9 : -4, 6) - b.vy) * k;
    if (Math.hypot(b.vx, b.vz) > 1) this.yaw = approachAngle(this.yaw, yawOf(b.vx, b.vz), 4 * dt);
    if (this.flyT % 1.6 < dt) this.pose.flapT = 0;
    g.col.move(b, dt);
    const unsafe = b.y < g.killY + 1 || (g.waterLevel > -1e3 && b.y < g.waterLevel - 0.3);
    if (landing && b.grounded) {
      const ok = this.safeAt(b.x, b.z, b.y, 0.5, 0.5) !== null;
      this.mode = 'ground';
      if (!ok) this.shadowStep(null, 0.2);
      return;
    }
    // Nowhere to come down near him, a wall in the way, or a long flight: shadow-step instead.
    if (unsafe || (landing && this.landT > 2.5) || this.flyT > 25 || Math.hypot(pb.x - b.x, pb.z - b.z) > 22 || (b.hitWall && this.flyT > 0.5 && Math.hypot(dx, dz) > 6)) {
      this.shadowStep(null, 0.3);
    }
  }

  // --- choosing a fight ------------------------------------------------------------------------------

  private hittable(e: Enemy): boolean {
    if (!e.alive || e.state === 'spawn' || e.state === 'dead' || !e.model.root.visible || e.def.id === 'dummy') return false;
    if (e.isBoss && !(e as Boss).awake) return false;
    return true;
  }

  private engaged(e: Enemy): boolean {
    const p = this.game.player;
    // Bosses run their own brains and may never flag aggro: awake is engaged enough.
    return this.hittable(e) && (e.aggro || e.isBoss) && Math.hypot(e.x - p.x, e.z - p.z) < FIGHT_R + (e.isBoss ? e.radius : 0) && Math.abs(e.y - p.y) < 6;
  }

  private finishable(e: Enemy): boolean {
    return e.status.frozen > 0 || e.status.stunned || e.state === 'down' || e.flipped > 0;
  }

  /** Freshly launched by Aster (not by her), and still rising or hanging. */
  private launched(e: Enemy): boolean {
    return e.state === 'air' && e.airTime < 0.5 && e.juggleHits <= 2 && !isPartnerMove(e.lastHitBy);
  }

  private pickTarget(): void {
    const g = this.game;
    const p = g.player;
    if (this.target && (!this.engaged(this.target) || Math.hypot(this.target.x - p.x, this.target.z - p.z) > FIGHT_R + 2)) this.target = null;
    if (this.targetT > 0) return;
    this.targetT = 0.3;
    const lock = p.lock;
    if (lock && this.engaged(lock)) {
      this.target = lock;
      return;
    }
    let best: Enemy | null = null;
    let bs = Infinity;
    const b = this.body;
    for (const e of g.enemies) {
      if (!this.engaged(e)) continue;
      let s = Math.hypot(e.x - p.x, e.z - p.z) + Math.hypot(e.x - b.x, e.z - b.z) * 0.4;
      if (e === p.target) s -= 3;
      if (e === this.target) s -= 2.5;
      if (this.finishable(e)) s -= 4;
      if (s < bs) {
        bs = s;
        best = e;
      }
    }
    if (best !== this.target) this.reachT = 0;
    this.target = best;
  }

  /** Can a light blow land, or would a shield or shell turn it? */
  private guarded(e: Enemy): boolean {
    const b = this.body;
    if (e.def.armored && e.flipped <= 0) return true;
    if (!e.def.shield || e.guardBroken > 0 || e.status.stunned || e.state === 'hitstun' || e.state === 'air' || e.state === 'down') return false;
    return Math.abs(angleDiff(e.yaw, yawOf(b.x - e.x, b.z - e.z))) < 1.3;
  }

  private updateFight(dt: number): void {
    const g = this.game;
    const b = this.body;
    const e = this.target!;
    const p = g.player;
    const d = Math.hypot(e.x - b.x, e.z - b.z);
    const gap = d - e.radius - RADIUS;
    const high = e.y > b.y + 2.4 || (e.def.flying && e.y > b.y + 1.6);
    // Out of her reach (up in the air, across water): a shadow bolt from where she stands.
    if ((high || this.reachT > 2.6) && d < 16 && this.attackCd <= 0) {
      this.startAct('bolt', e);
      this.reachT = 0;
      return;
    }
    // Close in from the flank, the side away from Aster (and round a shield).
    const base = yawOf(e.x - p.x, e.z - p.z);
    const slot = base + this.side * 1.05;
    const ring = e.radius + RADIUS + 0.9;
    const sx = e.x + Math.sin(slot) * ring;
    const sz = e.z + Math.cos(slot) * ring;
    const toSlot = Math.hypot(sx - b.x, sz - b.z);
    if (gap < 1.6) {
      this.reachT = 0;
      // In reach: face it, and swing when ready.
      this.yaw = approachAngle(this.yaw, yawOf(e.x - b.x, e.z - b.z), 10 * dt);
      if (this.attackCd <= 0) {
        this.startAct(this.choose(e), e);
        return;
      }
      if (toSlot > 1) this.drive(dt, sx, sz, 3.5, 0.5, e.y);
      else this.brake(dt);
      return;
    }
    // Now and then, a bolt on the way in.
    if (gap > 4 && d < 12 && this.boltCd <= 0 && this.attackCd <= 0) {
      this.boltCd = 5;
      if (Math.random() < 0.35 && this.lineClear(b.x, b.y + 1.2, b.z, e.x, e.y + e.height * 0.5, e.z)) {
        this.startAct('bolt', e);
        return;
      }
    }
    this.reachT += dt;
    this.drive(dt, sx, sz, RUN, 0.4, e.y);
    if (Math.hypot(b.vx, b.vz) < 0.8 && this.reachT > 1) this.reachT += dt;
  }

  private brake(dt: number): void {
    const b = this.body;
    const f = Math.exp(-10 * dt);
    b.vx *= f;
    b.vz *= f;
  }

  private choose(e: Enemy): string {
    const g = this.game;
    const b = this.body;
    if (this.finishable(e) && this.finishCd <= 0) return 'finish';
    // A shield or a shell wants the heavy tail.
    if (this.guarded(e)) return 'sweep';
    let crowd = 0;
    for (const o of g.enemies) if (o.alive && this.hittable(o) && Math.hypot(o.x - b.x, o.z - b.z) < o.radius + 3.2) crowd++;
    // The sweep for a crowd, the claws for one; never the same one for long.
    if (this.sweepCd <= 0 && Math.random() < (crowd >= 2 ? 0.7 : 0.35)) {
      this.sweepCd = 2.4;
      return 'sweep';
    }
    return 'claw1';
  }

  /** Follow-ups on Aster's work: a rising slash after a launch, a finisher, the Shadow Veil. */
  private assists(): void {
    const g = this.game;
    const p = g.player;
    const b = this.body;
    // Shadow Veil: Aster is nearly down and foes are close.
    if (this.veilCd <= 0 && p.alive && p.hp > 0 && p.hp < p.maxHp * 0.25 && g.enemies.some((e) => this.engaged(e) && Math.hypot(e.x - p.x, e.z - p.z) < 9)) {
      this.veilCd = VEIL_CD;
      if (Math.hypot(p.x - b.x, p.z - b.z) > 5) {
        const s = this.spotNear(p.x, p.y, p.z, p.yaw, [2.2, 3], false);
        if (s) {
          this.appear(s.x, s.y, s.z, yawOf(p.x - s.x, p.z - s.z), true);
          this.steps++;
        }
      }
      this.act = null;
      this.dashT = -1;
      this.startAct('veil', null);
      return;
    }
    if (this.busy || !b.grounded) return;
    // A foe Aster just tossed into the air: meet it on the way up.
    if (this.riseCd <= 0) {
      for (const e of g.enemies) {
        if (!this.hittable(e) || !this.launched(e)) continue;
        const d = Math.hypot(e.x - b.x, e.z - b.z);
        if (d > 7 || Math.hypot(e.x - p.x, e.z - p.z) > 10) continue;
        this.riseCd = 3;
        this.target = e;
        this.startAct('rise', e);
        return;
      }
    }
  }

  // --- acts: her attacks -----------------------------------------------------------------------------

  private startAct(id: string, target: Enemy | null): void {
    const def = ACTS[id]!;
    const b = this.body;
    this.act = def;
    this.actT = 0;
    this.actTarget = target;
    this.actDone = def.hits.map(() => false);
    this.actSfx = false;
    this.resting = false;
    this.idleT = 0;
    if (target) this.yaw = yawOf(target.x - b.x, target.z - b.z);
    if (def.id === 'finisher') this.finishCd = 2.5;
    if (def.air && target) {
      // Leap up at the foe.
      const dx = target.x - b.x;
      const dz = target.z - b.z;
      const d = Math.hypot(dx, dz) || 1;
      const hs = Math.min(10, Math.max(0, d - target.radius - 0.6) / 0.35);
      b.vx = (dx / d) * hs;
      b.vz = (dz / d) * hs;
      b.vy = clamp(8 + (target.y - b.y) * 2.2, 9, 15);
      b.grounded = false;
      this.pose.flapT = 0;
      this.game.sfx('flap', b.x, b.y, b.z, 0.8, 0.7);
    }
  }

  private updateAct(dt: number): void {
    const g = this.game;
    const b = this.body;
    const def = this.act!;
    const prev = this.actT;
    this.actT += dt;
    const t = this.actT;
    const tgt = this.actTarget && this.actTarget.alive ? this.actTarget : null;
    const first = def.hits[0]?.t ?? def.dur * 0.4;
    if (tgt && t < first) this.yaw = approachAngle(this.yaw, yawOf(tgt.x - b.x, tgt.z - b.z), 12 * dt);
    if (def.lunge && t >= def.lunge[0] && t <= def.lunge[1]) {
      let sp = def.lunge[2];
      if (tgt) {
        const gap = Math.hypot(tgt.x - b.x, tgt.z - b.z) - tgt.radius - RADIUS - 0.3;
        sp = gap < 0.3 ? 0 : Math.min(sp, gap / Math.max(0.05, def.lunge[1] - t) + 1);
      }
      b.vx = Math.sin(this.yaw) * sp;
      b.vz = Math.cos(this.yaw) * sp;
    } else if (!def.air) this.brake(dt);
    if (!this.actSfx && t >= def.sfxAt) {
      this.actSfx = true;
      g.sfx(def.sfx, b.x, b.y, b.z, 0.78 + Math.random() * 0.08, 0.8);
    }
    def.hits.forEach((h, i) => {
      if (!this.actDone[i] && t >= h.t) {
        this.actDone[i] = true;
        this.land(def, h);
      }
    });
    if (def.id === 'bolt' && prev < 0.24 && t >= 0.24 && tgt) this.fireBolt(tgt);
    if (def.id === 'veil' && prev < 0.18 && t >= 0.18) this.veil();
    if (def.air && t > 0.3 && b.grounded) {
      this.endAct();
      return;
    }
    if (t >= def.dur) {
      const next = def.next ? ACTS[def.next] : null;
      if (next && tgt && this.hittable(tgt) && Math.hypot(tgt.x - b.x, tgt.z - b.z) - tgt.radius < 2.6) {
        this.startAct(def.next!, tgt);
        return;
      }
      this.endAct();
    }
  }

  private endAct(): void {
    const id = this.act?.id;
    this.act = null;
    // A breath between moves, so she helps rather than carries.
    this.attackCd = id === 'bolt' ? 1.6 + Math.random() * 0.8 : 0.9 + Math.random() * 0.6;
  }

  private land(def: ActDef, h: ActHit): void {
    const g = this.game;
    const b = this.body;
    const fx = Math.sin(this.yaw);
    const fz = Math.cos(this.yaw);
    const cx = b.x + fx * (h.offset ?? 0);
    const cz = b.z + fz * (h.offset ?? 0);
    if (h.swoosh) {
      const s = h.swoosh;
      g.fx.swoosh(b.x, b.y + s.height * SCALE, b.z, this.yaw + (s.spin ? PI : 0), s.radius, s.arc, 0xd9a8ff, s.plane, s.tilt ?? 0, 0.18, 0.5, s.start);
    }
    for (const e of [...g.enemies]) {
      if (!this.hittable(e)) continue;
      const dx = e.x - cx;
      const dz = e.z - cz;
      const d = Math.hypot(dx, dz);
      if (d - e.radius > h.range) continue;
      if (e.y > b.y + (def.air ? 3.4 : 2.6) || e.y + e.height < b.y - 0.8) continue;
      if (h.arc < PI - 0.01 && d > e.radius + 0.6 && Math.abs(angleDiff(this.yaw, yawOf(dx, dz))) > h.arc) continue;
      const n = d || 1;
      this.strikeFoe(e, {
        damage: h.damage, knockback: h.knockback, launch: h.launch, stagger: h.stagger, heavy: h.heavy ?? false,
        hitstop: h.hitstop ?? 0, source: def.source ?? 'melee', move: def.id, dirX: dx / n, dirZ: dz / n,
      });
    }
  }

  /** One of her blows, through the foe's own takeHit. */
  private strikeFoe(e: Enemy, o: { damage: number; knockback: number; launch: number; stagger: number; heavy: boolean; hitstop: number; source: HitSource; move: string; dirX: number; dirZ: number }): HitResult {
    const g = this.game;
    const b = this.body;
    // Where a light blow would only bounce off a shield or a shell, hers land heavy.
    const heavy = o.heavy || this.guarded(e);
    const type: DamageType = (e.def.resist.shadow ?? 1) >= 0.9 ? 'shadow' : 'physical';
    // Noted before the hit lands, so a foe she finishes in one blow still counts as helped.
    const had = this.helpedSet.has(e);
    this.helpedSet.add(e);
    const r = e.takeHit(makeHit({
      damage: o.damage * g.player.meleeMult, type, dirX: o.dirX, dirZ: o.dirZ, knockback: o.knockback, launch: o.launch,
      stagger: o.stagger * (e.isBoss ? 0.5 : 1), hitstop: o.hitstop, heavy, source: o.source, move: PARTNER_MOVE + o.move,
      fromPlayer: true, ox: b.x, oz: b.z,
    }));
    if (r !== 'hit' && r !== 'killed' && !had) this.helpedSet.delete(e);
    if (r === 'hit' || r === 'killed') {
      this.dealt += e.lastDamage;
      const hx = (e.x + b.x) * 0.5;
      const hz = (e.z + b.z) * 0.5;
      const hy = Math.min(e.y + e.height * 0.6, b.y + 1.4);
      g.fx.hit(hx, hy, hz, 0xe0b8ff, heavy ? 1.2 : 0.8);
      g.sfx(heavy ? 'hitHeavy' : 'hit', hx, hy, hz, 0.8 + Math.random() * 0.1, 0.8);
      if (heavy) g.shake(0.12, 0.1);
    }
    return r;
  }

  /** "Nyxa, now!" part one: a streak of shadow at the foe. */
  private updateDash(dt: number): void {
    const g = this.game;
    const b = this.body;
    const e = this.dashTarget;
    this.dashT += dt;
    if (!e || !this.hittable(e)) {
      this.dashT = -1;
      return;
    }
    const dx = e.x - b.x;
    const dz = e.z - b.z;
    const d = Math.hypot(dx, dz);
    this.yaw = yawOf(dx, dz);
    const gap = d - e.radius - RADIUS;
    if (gap < 1.4 || this.dashT > 0.7) {
      this.dashT = -1;
      if (gap < 3.5) this.startAct('strike', e);
      else {
        const s = this.spotNear(e.x, e.y, e.z, yawOf(e.x - g.player.x, e.z - g.player.z), [e.radius + 1.6, e.radius + 2.4], true);
        if (s) this.shadowStep({ ...s, then: 'strike' }, 0.12);
      }
      return;
    }
    const sp = 24;
    b.vx = (dx / d) * sp;
    b.vz = (dz / d) * sp;
    g.fx.emit(b.x, b.y + 1.0, b.z, { count: 3, speed: 0.8, life: [0.25, 0.45], size: [0.6, 1.0], sizeEnd: 0.1, color: SHADOW, colorEnd: 0x1a0830, bright: 1.5, jitter: 0.5 });
  }

  // --- stay -------------------------------------------------------------------------------------------

  private updateStay(dt: number): void {
    const g = this.game;
    const b = this.body;
    const p = g.player;
    const d = Math.hypot(this.stayX - b.x, this.stayZ - b.z);
    if (d > 0.35) {
      this.drive(dt, this.stayX, this.stayZ, d > 3 ? 7 : 3, 0.2, this.stayY);
      this.watchStay(dt, d);
    } else {
      this.brake(dt);
      this.stuckT = 0;
      // Settle exactly on the spot (a plate wants her in the middle).
      b.x += (this.stayX - b.x) * Math.min(1, dt * 6);
      b.z += (this.stayZ - b.z) * Math.min(1, dt * 6);
      this.yaw = approachAngle(this.yaw, yawOf(p.x - b.x, p.z - b.z), 2 * dt);
      // Covering fire from where she stands.
      if (g.state === 'play' && this.attackCd <= 0) {
        const e = g.enemies.find((q) => this.engaged(q) && Math.hypot(q.x - b.x, q.z - b.z) < 12);
        if (e) this.startAct('bolt', e);
      }
    }
  }

  private watchStay(dt: number, d: number): void {
    this.progT += dt;
    if (this.progT < 0.8) return;
    this.progT = 0;
    if (d > this.progD - 0.3) this.stuckT += 0.8;
    else this.stuckT = 0;
    this.progD = d;
    if (this.stuckT >= 1.6) {
      const dest = this.stayDest();
      this.shadowStep(dest, 0.3);
    }
  }

  // --- the shadow bolt ---------------------------------------------------------------------------------

  private fireBolt(e: Enemy): void {
    const g = this.game;
    const rig = this.rig;
    if (!rig) return;
    rig.mouth.getWorldPosition(tmpV);
    boltMat ??= glow(0xd070ff, 1, true);
    const mesh = new THREE.Mesh(boltGeo, boltMat);
    mesh.position.copy(tmpV);
    g.scene.add(mesh);
    const ty = e.y + e.height * 0.55;
    const dx = e.x - tmpV.x;
    const dy = ty - tmpV.y;
    const dz = e.z - tmpV.z;
    const n = Math.hypot(dx, dy, dz) || 1;
    this.bolts.push({ mesh, x: tmpV.x, y: tmpV.y, z: tmpV.z, vx: (dx / n) * 18, vy: (dy / n) * 18, vz: (dz / n) * 18, target: e, life: 1.6 });
    g.fx.flash(tmpV.x, tmpV.y, tmpV.z, SHADOW, 3, 8, 0.12);
  }

  private updateBolts(dt: number): void {
    const g = this.game;
    for (const bo of this.bolts) {
      bo.life -= dt;
      const e = bo.target;
      if (e.alive) {
        const ty = e.y + e.height * 0.55;
        const dx = e.x - bo.x;
        const dy = ty - bo.y;
        const dz = e.z - bo.z;
        const d = Math.hypot(dx, dy, dz) || 1;
        const k = Math.min(1, dt * 6);
        bo.vx += ((dx / d) * 20 - bo.vx) * k;
        bo.vy += ((dy / d) * 20 - bo.vy) * k;
        bo.vz += ((dz / d) * 20 - bo.vz) * k;
        if (d < e.radius + 0.45) {
          const n = Math.hypot(dx, dz) || 1;
          if (this.hittable(e)) {
            this.strikeFoe(e, { damage: 8, knockback: 2, launch: 0, stagger: 10, heavy: false, hitstop: 0, source: 'breath', move: 'bolt', dirX: dx / n, dirZ: dz / n });
          }
          g.fx.shadowPoof(bo.x, bo.y, bo.z, 0.5);
          bo.life = 0;
        }
      }
      bo.x += bo.vx * dt;
      bo.y += bo.vy * dt;
      bo.z += bo.vz * dt;
      bo.mesh.position.set(bo.x, bo.y, bo.z);
      g.fx.emit(bo.x, bo.y, bo.z, { count: 1, speed: 0.4, life: [0.2, 0.35], size: [0.3, 0.45], sizeEnd: 0.1, color: 0xd070ff, colorEnd: 0x2a0a40, bright: 1.6 });
      if (bo.life > 0 && g.col.groundAt(bo.x, bo.z, bo.y + 0.1, 0).y > bo.y) {
        g.fx.shadowPoof(bo.x, bo.y, bo.z, 0.4);
        bo.life = 0;
      }
    }
    if (this.bolts.some((b) => b.life <= 0)) {
      for (const b of this.bolts) if (b.life <= 0) g.scene.remove(b.mesh);
      this.bolts = this.bolts.filter((b) => b.life > 0);
    }
  }

  // --- the Shadow Veil ----------------------------------------------------------------------------------

  private veil(): void {
    const g = this.game;
    const p = g.player;
    this.veilT = 3;
    if (!p.invuln) {
      p.invuln = true;
      this.veilOwns = true;
    }
    g.fx.ring(p.x, p.y + 0.2, p.z, 0.5, 6.5, SHADOW, 0.6);
    g.fx.shadowPoof(p.x, p.y + 1, p.z, 2.2);
    g.sfx('fury', p.x, p.y, p.z, 0.6, 0.7);
    g.shake(0.25, 0.25);
    for (const e of [...g.enemies]) {
      if (!this.hittable(e)) continue;
      const dx = e.x - p.x;
      const dz = e.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > 6 + e.radius || Math.abs(e.y - p.y) > 3) continue;
      const n = d || 1;
      this.strikeFoe(e, { damage: 3, knockback: 12, launch: 3, stagger: 70, heavy: false, hitstop: 0, source: 'melee', move: 'veil', dirX: dx / n, dirZ: dz / n });
    }
    for (const pr of g.projectiles) {
      if (!pr.alive || pr.spec.fromPlayer || pr.reflected) continue;
      if (Math.hypot(pr.x - p.x, pr.z - p.z) > 7) continue;
      g.fx.sparkle(pr.x, pr.y, pr.z, 0xd9a8ff, 6);
      pr.kill();
    }
    this.line('veil', LINES.veil, 3, true);
  }

  private updateVeil(dt: number): void {
    const m = this.veilMesh;
    const mat = this.veilMat;
    if (!m || !mat) return;
    if (this.veilT <= 0) {
      m.visible = false;
      return;
    }
    this.veilT -= dt;
    const p = this.game.player;
    m.visible = true;
    m.position.set(p.x, p.y + 0.8, p.z);
    const k = this.veilT;
    m.scale.setScalar(1.7 + Math.sin(this.game.time * 6) * 0.05);
    mat.opacity = Math.min(0.22, k * 0.4) * (0.8 + Math.sin(this.game.time * 9) * 0.2);
    if (Math.random() < dt * 20) {
      const a = Math.random() * PI * 2;
      this.game.fx.emit(p.x + Math.sin(a) * 1.6, p.y + 0.3 + Math.random() * 1.6, p.z + Math.cos(a) * 1.6, {
        count: 1, speed: 0.6, dir: [0, 1, 0], life: [0.5, 0.9], size: [0.2, 0.35], sizeEnd: 0, color: 0xc070ff, bright: 1.8, gravity: -0.5,
      });
    }
    if (this.veilT <= 0) this.endVeil();
  }

  private endVeil(): void {
    this.veilT = 0;
    if (this.veilOwns) this.game.player.invuln = false;
    this.veilOwns = false;
    if (this.veilMesh) this.veilMesh.visible = false;
  }

  // --- banter -----------------------------------------------------------------------------------------

  /** Shows a line in her speech bubble, unless someone is talking or she spoke a moment ago. */
  say(text: string, secs = 4.5, force = false): boolean {
    const g = this.game;
    if (!this.present || g.state !== 'play') return false;
    if (!force && this.sayCd > 0) return false;
    g.hud.partnerSay(text, secs);
    this.sayCd = force ? Math.max(this.sayCd, 8) : 24;
    this.talkT = Math.min(2.2, 0.6 + text.length * 0.03);
    return true;
  }

  private line(key: string, lines: string[], secs = 4.5, force = false): void {
    const i = this.used.get(key) ?? 0;
    if (this.say(lines[i % lines.length]!, secs, force)) this.used.set(key, i + 1);
  }

  /** A short reply to a command: always heard, but not every time. */
  private bark(lines: string[]): void {
    if (this.barkCd > 0) return;
    this.barkCd = 3;
    this.line(`bark:${lines[0]}`, lines, 2.2, true);
  }

  /** A foe fell (the game tells her about every kill). */
  onKill(_e: Enemy): void {
    if (!this.present) return;
    this.fightKills++;
  }

  /** Aster found something hidden. */
  onSecret(kind: CollectKind): void {
    if (!this.present || this.hidden) return;
    const lines = LINES.secret[kind];
    if (lines && this.sayCd < 16) {
      this.sayCd = 0;
      this.line(`secret:${kind}`, lines, 5);
    }
  }

  private banter(dt: number): void {
    const g = this.game;
    const p = g.player;
    if (g.state === 'dialogue') {
      this.sayCd = Math.max(this.sayCd, 3);
      return;
    }
    // Entering a realm, once the title card has had its moment.
    if (this.enterT > 0 && g.state === 'play') {
      this.enterT -= dt;
      if (this.enterT <= 0) {
        const id = g.level?.def.id ?? '';
        const lines = LINES.enter[id] ?? LINES.enter.any!;
        this.sayCd = 0;
        this.line(`enter:${id}`, lines, 5.5);
      }
    }
    // After a big fight.
    const fighting = g.enemies.some((e) => e.alive && e.aggro && Math.hypot(e.x - p.x, e.z - p.z) < 26);
    if (fighting) this.calmT = 0;
    else {
      this.calmT += dt;
      if (this.calmT > 2.5 && this.fightKills >= 4) {
        this.fightKills = 0;
        this.line('fight', LINES.fight, 5);
      } else if (this.calmT > 6) this.fightKills = 0;
    }
    // A boss.
    const boss = g.boss;
    if (boss && boss.awake && boss.alive) {
      this.bossSeen = boss;
      if (boss.def.id === 'nyxa' && !this.mirrorSaid) {
        this.mirrorSaid = true;
        this.say(LINES.mirror[0]!, 4.5, true);
      }
    } else if (this.bossSeen && !this.bossSeen.alive) {
      this.bossSeen = null;
      this.sayCd = 0;
      this.line('boss', LINES.boss, 5);
    }
    // Aster in trouble, and back up again.
    if (p.alive && p.hp < p.maxHp * 0.35 && this.hurtCd <= 0 && fighting) {
      this.hurtCd = 45;
      this.line('hurt', LINES.hurt, 3.5, true);
    }
    if (!p.alive) this.asterWasDead = true;
    else if (this.asterWasDead && g.state === 'play') {
      this.asterWasDead = false;
      this.sayCd = 0;
      this.line('down', LINES.down, 4);
    }
    // Aster admiring the view for a long while.
    const still = Math.hypot(p.body.vx, p.body.vz) < 0.3 && !fighting && g.state === 'play';
    this.stillT = still ? this.stillT + dt : 0;
    if (this.stillT > 40) {
      this.stillT = -80;
      this.line('idle', LINES.idle, 5);
    }
  }

  // --- presentation -------------------------------------------------------------------------------------

  private present3d(dt: number): void {
    const g = this.game;
    const rig = this.rig;
    if (!rig) return;
    const b = this.body;
    const vis = !this.hidden;
    rig.root.visible = vis;
    if (this.blob) this.blob.visible = false;
    if (!vis) return;
    rig.root.position.set(b.x, b.y, b.z);
    const vd = angleDiff(this.visYaw, this.yaw);
    this.visYaw += vd * (1 - Math.exp(-(Math.abs(vd) > 2.5 ? 26 : 16) * dt));
    rig.root.rotation.y = this.visYaw;
    const P = this.pose;
    const hs = Math.hypot(b.vx, b.vz);
    const flying = this.mode === 'fly';
    const act = this.act;
    P.speed = act || flying ? 0 : clamp(hs / 8.8, 0, 1.3);
    P.grounded = b.grounded && !flying;
    P.vy = b.vy;
    P.glide = flying;
    P.hover = flying && this.landT > 0 && Math.hypot(b.vx, b.vz) < 3;
    P.charge = this.dashT >= 0;
    P.dodge = -1;
    P.hurt = 0;
    P.dead = false;
    P.breath = false;
    P.aimPitch = 0;
    const turn = dt > 0 ? angleDiff(this.lastVisYaw, this.visYaw) / dt : 0;
    this.lastVisYaw = this.visYaw;
    P.turn = clamp(turn, -6, 6);
    P.talk = this.talkT > 0 || (g.state === 'dialogue' && g.dialogueSpeaker === 'nyxa');
    P.sleep = this.resting;
    if (P.speed < 0.15 && Math.abs(P.turn) > 1.2 && b.grounded && !act) P.speed = 0.25;
    if (act) {
      P.attack = act.pose;
      P.attackT = Math.min(1, this.actT / act.dur);
    } else P.attack = null;
    // Where to look: the foe she is after, else Aster.
    const look = this.target && this.target.alive ? { x: this.target.x, y: this.target.y + this.target.height * 0.6, z: this.target.z } : { x: g.player.x, y: g.player.y + 1, z: g.player.z };
    const rel = angleDiff(this.visYaw, yawOf(look.x - b.x, look.z - b.z));
    P.gaze = Math.abs(rel) < 1.8 && !this.resting ? rel : null;
    P.gazePitch = Math.atan2(look.y - (b.y + 1.5), Math.hypot(look.x - b.x, look.z - b.z) + 0.5);
    rig.update(dt, P);
    P.flapT = 1;
    // A faint violet sheen keeps her readable in the dark; a flash when she slips a blow.
    rig.setFlash(this.flashT > 0 ? this.flashT * 3 : 0.16, this.flashT > 0 ? 0xd090ff : 0x4a2080);
    rig.setOpacity(this.betweenCameraAndAster() ? 0.4 : 1);

    // Blob shadow.
    const blob = this.blob;
    const bm = this.blobMat;
    if (blob && bm) {
      const gy = g.col.groundAt(b.x, b.z, b.y + 0.1, 0.1).y;
      if (gy > -1e3) {
        const h = Math.max(0, b.y - gy);
        blob.visible = true;
        blob.position.set(b.x, gy + 0.035, b.z);
        blob.scale.setScalar(Math.max(0.35, 1 - h * 0.06) * 1.55);
        bm.opacity = Math.max(0.1, 0.38 - h * 0.02);
      }
    }
    // Footfalls and a trail of shadow when she runs.
    if (b.grounded && hs > 2 && !act) {
      this.footT -= dt * Math.min(1.5, hs / 8);
      if (this.footT <= 0) {
        this.footT = 0.34;
        if (Math.hypot(b.x - g.camera.position.x, b.z - g.camera.position.z) < 22) g.audio.footstep(b.ground?.surface ?? 'stone', Math.min(0.5, hs / 16));
      }
    }
    this.wispT -= dt;
    if (this.wispT <= 0 && (hs > 4 || flying)) {
      this.wispT = 0.09;
      rig.tailTip.getWorldPosition(tmpV);
      g.fx.emit(tmpV.x, tmpV.y, tmpV.z, { count: 1, speed: 0.3, life: [0.3, 0.6], size: [0.14, 0.24], sizeEnd: 0, color: 0xa060ff, bright: 1.4, gravity: -0.4 });
    }
  }

  /** Is she standing in the camera's line to Aster, or right up against the lens? Then she fades so he stays in view. */
  private betweenCameraAndAster(): boolean {
    const g = this.game;
    const c = g.camera.position;
    const p = g.player;
    const b = this.body;
    if (Math.hypot(b.x - c.x, b.y + 1 - c.y, b.z - c.z) < 3) return true;
    const ax = p.x - c.x;
    const ay = p.y + 0.8 - c.y;
    const az = p.z - c.z;
    const len2 = ax * ax + ay * ay + az * az;
    if (len2 < 1) return false;
    const t = ((b.x - c.x) * ax + (b.y + 1 - c.y) * ay + (b.z - c.z) * az) / len2;
    if (t <= 0.05 || t >= 0.92) return false;
    const qx = c.x + ax * t - b.x;
    const qy = c.y + ay * t - (b.y + 1);
    const qz = c.z + az * t - b.z;
    return Math.hypot(qx, qy, qz) < 1.3;
  }

  /** Test and tinkering handle: puts her, visible and standing, at a point. */
  placeAt(x: number, y: number, z: number, yaw = this.yaw): void {
    if (!this.present) return;
    this.appear(x, y, z, yaw, false);
  }
}
