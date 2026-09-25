import * as THREE from 'three';
import { WIND, PUSHER } from '../render/materials';
import { BlobShadows } from '../fx/blobs';
import { Renderer } from '../render/renderer';
import { Input } from '../core/input';
import { audio, THEMES, type Audio, type Sfx } from '../core/audio';
import { FX } from '../fx/fx';
import { CameraRig } from './camera';
import { Player } from '../player/player';
import { Enemy } from '../enemies/enemy';
import { ENEMIES, TOTEM_WARD } from '../enemies/defs';
import { Projectile, Shockwave, type ProjectileSpec } from '../entities/projectile';
import { Gem, GemBatch, splitValue, type GemKind, GEM_COLORS } from '../entities/gems';
import { StyleMeter } from '../combat/style';
import { REACTION_INFO, type Reaction } from '../combat/status';
import { makeHit, type DamageType, type Hit, type Hittable, type Element } from './types';
import {
  DIFFICULTY, loadOptions, loadSave, newSave, writeOptions, writeSave, maxHp, maxMana, SHARDS_PER_UPGRADE, learnElement,
  eggsFound, SKINS, skinUnlocked, type Options, type SaveData, type Difficulty,
} from './progress';
import { findLetter, letterKey } from './letters';
import { BESTIARY, bump, extra, featKey, newlyDone } from './feats';
import { Level, Builder, type LevelDef } from '../world/level';
import type { Wardstone, Collectible, Arena } from '../entities/props';
import { LEVELS } from '../levels';
import { Hud } from '../ui/hud';
import { Menus } from '../ui/menus';
import { BACKDROPS } from '../render/backdrop';
import { Weather, WEATHER } from '../fx/weather';
import { EggThief } from '../entities/thief';
import { TouchControls } from '../ui/touch';
import { Dialogue, type Line } from '../ui/dialogue';
import { Flick } from '../player/flick';
import { RELICS } from './story';
import type { Boss } from '../enemies/boss';
import { rng } from '../core/rng';

export type GameState = 'title' | 'play' | 'pause' | 'dialogue' | 'transition' | 'dead' | 'menu' | 'ending';

/** Limits how many enemies may attack at once, so fights stay readable. */
export class CombatDirector {
  private melee = new Set<Enemy>();
  private ranged = new Set<Enemy>();
  constructor(private game: Game) {}
  request(e: Enemy, ranged: boolean): boolean {
    const d = this.game.save.difficulty;
    const maxMelee = d === 'story' ? 1 : d === 'normal' ? 2 : 3;
    const maxRanged = d === 'story' ? 1 : 2;
    const set = ranged ? this.ranged : this.melee;
    if (set.has(e)) return true;
    if (set.size >= (ranged ? maxRanged : maxMelee)) return false;
    set.add(e);
    return true;
  }
  release(e: Enemy): void {
    this.melee.delete(e);
    this.ranged.delete(e);
  }
  clear(): void {
    this.melee.clear();
    this.ranged.clear();
  }
}

interface FirePatch {
  x: number;
  y: number;
  z: number;
  r: number;
  t: number;
  tick: number;
}

interface Spikes {
  meshes: THREE.Mesh[];
  t: number;
}

export class Game {
  readonly renderer: Renderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly input: Input;
  readonly audio: Audio = audio;
  readonly fx: FX;
  private blobs: BlobShadows;
  readonly cam = new CameraRig();
  readonly hud: Hud;
  readonly menus: Menus;
  readonly weather: Weather;
  private gemBatch: GemBatch;
  readonly touch: TouchControls;
  readonly dialogue: Dialogue;
  save: SaveData;
  options: Options;
  player: Player;
  flick: Flick;
  level: Level | null = null;
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  shockwaves: Shockwave[] = [];
  gems: Gem[] = [];
  readonly director: CombatDirector;
  readonly style = new StyleMeter();
  state: GameState = 'title';
  time = 0;
  realTime = 0;
  readonly stats = { damageTaken: 0 };
  pendingSpawns: { type: string; x: number; y: number; z: number; yaw: number }[] = [];
  dialogueSpeaker: string | null = null;
  boss: Boss | null = null;
  private hitstopT = 0;
  private slowScale = 1;
  private slowT = 0;
  private hitList: Hittable[] = [];
  private deadT = 0;
  private combatHold = 0;
  private gemChain = 0;
  private gemChainT = 0;
  private firePatches: FirePatch[] = [];
  private spikes: Spikes[] = [];
  private transitionFn: (() => void) | null = null;
  private transitionT = 0;
  private transitionPhase: 'out' | 'in' = 'out';
  private stateBeforeTransition: GameState = 'play';
  private interactTarget: import('../entities/props').Interactable | null = null;
  private autosaveT = 0;
  activeArena: Arena | null = null;
  private titleT = 0;
  /** Tallies for the current visit to a realm, for the results card at the end. */
  readonly visit = { id: '', t0: 0, kills0: 0, gems: 0, combo: 0, rank: 0, hits: 0, deaths0: 0, doneAtStart: true, shown: false };

  /** Level flags set by story scripts during this visit. */
  readonly sessionFlags = new Set<string>();

  constructor(root: HTMLElement) {
    this.renderer = new Renderer(root);
    this.scene = this.renderer.scene;
    this.camera = this.renderer.camera;
    this.input = new Input(this.renderer.canvas);
    this.fx = new FX(this.camera);
    this.blobs = new BlobShadows(this.scene);
    this.weather = new Weather(this);
    this.gemBatch = new GemBatch(this.scene);
    this.scene.add(this.fx.root);
    this.options = loadOptions();
    this.save = loadSave() ?? newSave();
    this.director = new CombatDirector(this);
    this.player = new Player(this);
    this.flick = new Flick(this);
    this.hud = new Hud(this, root);
    this.touch = new TouchControls(this, root);
    this.dialogue = new Dialogue(this, root);
    this.menus = new Menus(this, root);
    this.applyOptions();
    window.addEventListener('resize', () => this.fx.setViewport(this.renderer.height, this.camera.fov));
    this.fx.setViewport(this.renderer.height, this.camera.fov);
    // Losing the mouse (Esc in the browser) pauses instead of leaving the
    // dragon running around unattended.
    document.addEventListener('pointerlockchange', () => {
      if (!this.input.locked && this.state === 'play' && this.input.wantPointerLock && !this.input.usingPad && !this.input.usingTouch) this.pause();
    });
    // Audio can only start after a user gesture.
    const unlock = () => this.audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  // --- accessors ---------------------------------------------------------------

  get col() {
    return this.level!.col;
  }
  get waterLevel(): number {
    return this.level ? this.level.waterLevel : -1e4;
  }
  get killY(): number {
    return this.level ? this.level.killY : -50;
  }
  get difficultyInfo() {
    return DIFFICULTY[this.save.difficulty];
  }

  applyOptions(): void {
    const o = this.options;
    this.audio.volume = o.volume;
    this.audio.musicVolume = o.music;
    this.audio.sfxVolume = o.sfx;
    this.audio.applyVolumes();
    this.input.mouseSensitivity = o.sensitivity;
    this.input.invertY = o.invertY;
    if (this.renderer.quality !== o.quality) this.renderer.setQuality(o.quality);
    this.fx.density = o.quality === 'low' ? 0.5 : o.quality === 'medium' ? 0.8 : 1;
    writeOptions(o);
  }

  // --- lifecycle ------------------------------------------------------------------

  showTitle(): void {
    this.state = 'title';
    this.input.wantPointerLock = false;
    this.input.releaseLock();
    this.loadLevel('fen', { title: true });
    this.menus.showTitle();
    this.audio.setMusic(THEMES.title!);
  }

  newGame(difficulty: Difficulty): void {
    this.save = newSave(difficulty);
    writeSave(this.save);
    this.player.element = null;
    this.startPlaying(this.save.level, null);
  }

  continueGame(): void {
    const s = loadSave();
    if (!s) return;
    this.save = s;
    this.player.element = s.elements[0] ?? null;
    this.startPlaying(s.level, s.checkpoint);
  }

  private startPlaying(levelId: string, checkpoint: string | null): void {
    this.menus.hideAll();
    this.fadeTo(() => {
      this.input.wantPointerLock = true;
      this.input.requestLock();
      this.loadLevel(levelId, { checkpoint });
    });
  }

  /** Fade out, run fn, fade in. fn may change the state it resumes to. */
  fadeTo(fn: () => void): void {
    if (this.state !== 'transition') this.stateBeforeTransition = this.state;
    this.transitionFn = fn;
    this.transitionT = 0;
    this.transitionPhase = 'out';
    this.state = 'transition';
  }

  travel(target: string): void {
    // Finishing a realm for the first time: show how it went before leaving.
    const v = this.visit;
    if (this.level && v.id === this.level.def.id && v.id !== 'sanctum' && !v.doneAtStart && !v.shown && this.save.levelsDone[v.id] && this.state !== 'ending') {
      v.shown = true;
      this.menus.showResults(() => this.travel(target));
      return;
    }
    this.audio.play('uiConfirm');
    this.fadeTo(() => {
      this.save.level = target;
      this.save.checkpoint = null;
      if (!this.save.unlocked.includes(target)) this.save.unlocked.push(target);
      writeSave(this.save);
      this.loadLevel(target, { checkpoint: null });
    });
  }

  loadLevel(id: string, opts: { checkpoint?: string | null; title?: boolean } = {}): void {
    let def: LevelDef | undefined = LEVELS[id];
    if (!def) {
      // A save from a newer build, or a typo in ?level=: land somewhere safe.
      console.warn(`unknown level "${id}", loading a safe fallback`);
      def = this.save.unlocked.includes('sanctum') ? LEVELS.sanctum! : LEVELS.fen!;
      opts = { ...opts, checkpoint: null };
    }
    this.clearLevel();
    this.hud.clearFlick();
    this.applySkin();
    const level = new Level(def);
    this.level = level;
    this.scene.add(level.root);
    this.renderer.applySky(def.sky);
    const b = new Builder(this, level);
    if (def.terrain) b.terrain(def.terrain);
    if (def.water) b.water(def.water);
    def.build(b);
    b.finish();
    this.renderer.backdrop.apply(BACKDROPS[def.id], def.sky, level.waterLevel > -1e3 ? level.waterLevel - 0.5 : -2);
    this.weather.apply(WEATHER[def.id]);
    this.cam.collectOccluders(level.root);
    for (const s of this.pendingSpawns) this.spawnEnemy(s.type, s.x, s.y, s.z, s.yaw, false);
    this.pendingSpawns = [];
    // Place the player.
    let [sx, sz, syaw] = def.spawn;
    const cp = opts.checkpoint ? level.wardstones.get(opts.checkpoint) : undefined;
    if (cp) {
      sx = cp.x + Math.sin(cp.yaw) * 2.5;
      sz = cp.z + Math.cos(cp.yaw) * 2.5;
      syaw = cp.yaw;
    }
    const sy = level.col.groundAt(sx, sz, 1e4, 0.2).y;
    this.player.place(sx, (sy > -1e3 ? sy : 0) + 0.1, sz, syaw);
    this.player.resetForLevel();
    this.player.hidden = !!opts.title;
    this.flick.reset();
    this.cam.snapBehind(syaw, 0.32);
    this.cam.extraDist = 0;
    this.time = 0;
    this.style.reset();
    this.audio.stopAllLoops();
    this.prewarm();
    if (!opts.title) {
      const v = this.visit;
      if (v.id !== id) {
        Object.assign(v, { id, t0: this.save.stats.playTime, kills0: this.save.stats.kills, gems: 0, combo: 0, rank: 0, hits: 0, deaths0: this.save.stats.deaths, shown: false });
        v.doneAtStart = !!this.save.levelsDone[id];
      }
      this.state = 'play';
      this.audio.setMusic(THEMES[def.music] ?? THEMES.fen!);
      this.hud.show(true);
      this.hud.levelTitle(def.name, def.subtitle);
      const fresh = !this.sessionFlags.has(`entered:${id}`);
      this.sessionFlags.add(`entered:${id}`);
      def.onEnter?.(this, fresh);
    } else this.hud.show(false);
  }

  /**
   * Compiles every shader the level will use now, during the fade, instead
   * of hitching the first time an effect or enemy appears on screen.
   */
  private prewarm(): void {
    const gl = this.renderer.gl;
    try {
      // Spawn one of each enemy the level uses so their materials compile too.
      const types = new Set(this.enemies.map((e) => e.def.id));
      for (const l of this.level?.arenas ?? []) for (const w of l.waves) for (const sp of w) types.add(sp.type);
      const temp: THREE.Object3D[] = [];
      for (const t of types) {
        const def = ENEMIES[t];
        if (!def) continue;
        const m = def.build();
        // Same shader variant as the real thing (see Enemy's rim light).
        m.rim?.(0xc8a0ff, 0.28);
        m.root.position.set(this.player.x, this.player.y - 200, this.player.z);
        this.scene.add(m.root);
        temp.push(m.root);
      }
      gl.compile(this.scene, this.camera);
      for (const o of temp) this.scene.remove(o);
    } catch {
      /* best effort */
    }
  }

  private clearLevel(): void {
    for (const e of this.enemies) e.dispose();
    for (const p of this.projectiles) p.kill();
    for (const s of this.shockwaves) s.kill();
    for (const g of this.gems) g.kill();
    for (const s of this.spikes) for (const m of s.meshes) this.scene.remove(m);
    this.enemies = [];
    this.projectiles = [];
    this.shockwaves = [];
    this.gems = [];
    this.firePatches = [];
    this.spikes = [];
    this.boss = null;
    this.activeArena = null;
    this.director.clear();
    this.fx.clear();
    this.hud.bossBar(null);
    this.cam.clearShot();
    if (this.level) this.level.dispose(this.scene);
    this.level = null;
  }

  // --- frame ----------------------------------------------------------------------

  /** Longest frame simulated in real time; slower frames run in slow motion. */
  maxDt = 0.05;

  frame(rawDt: number): void {
    // The first animation frame's stamp can precede the startup clock: never step backwards.
    const dt = Math.max(0, Math.min(rawDt, this.maxDt));
    this.realTime += dt;
    WIND.value += dt;
    this.input.update(dt);

    switch (this.state) {
      case 'title':
      case 'menu':
        this.menus.update(dt);
        this.titleCamera(dt);
        break;
      case 'pause':
        this.menus.update(dt);
        break;
      case 'play':
        if (this.input.take('pause', 0.2)) {
          this.pause();
          break;
        }
        this.updateInteract();
        this.simulate(dt);
        break;
      case 'dialogue':
        this.dialogue.update(dt);
        this.simulate(dt);
        break;
      case 'dead':
        this.simulate(dt);
        this.deadT += dt;
        if (this.deadT > 2.6) this.respawnAtCheckpoint();
        break;
      case 'ending':
        this.menus.update(dt);
        this.simulate(dt);
        break;
      case 'transition':
        this.updateTransition(dt);
        if (this.stateBeforeTransition !== 'title' && this.level && !this.player.hidden) this.simulate(dt * 0.2);
        break;
    }

    if (this.state === 'play' && this.input.take('hint', 0.1)) this.hud.flick(this.flick.seek(), 4, true);
    if (this.state !== 'title' && this.state !== 'menu' && this.level) this.cam.update(dt, this);
    this.hud.update(dt);
    this.touch.update();
    if (this.level) this.blobs.update(this);
    this.gemBatch.update(this.gems);
    this.renderer.follow(this.player.body.y > -1e3 ? new THREE.Vector3(this.player.x, this.player.y, this.player.z) : new THREE.Vector3());
    if (this.level?.water) this.level.water.update(this.realTime, this.camera.position.x, this.camera.position.z);
    this.renderer.look.fury = this.player.state === 'fury' ? 1 : 0;
    PUSHER.value.set(this.player.body.x, this.player.body.y, this.player.body.z);
    if (this.level && this.state !== 'menu' && this.state !== 'pause') this.weather.update(dt);
    this.renderer.render(this.realTime, dt);
  }

  private titleCamera(dt: number): void {
    this.titleT += dt;
    const t = this.titleT * 0.05;
    const cx = Math.sin(t) * 26;
    const cz = Math.cos(t) * 26 + 10;
    this.camera.position.set(cx, 9 + Math.sin(this.titleT * 0.2) * 1.5, cz);
    this.camera.lookAt(0, 3, 10);
    this.fx.update(dt);
    if (this.level) {
      this.level.update(dt);
      this.flick.updateTitle(dt);
    }
  }

  private updateTransition(dt: number): void {
    this.transitionT += dt;
    if (this.transitionPhase === 'out') {
      this.hud.fade(Math.min(1, this.transitionT / 0.45));
      if (this.transitionT >= 0.45) {
        const fn = this.transitionFn;
        this.transitionFn = null;
        this.transitionPhase = 'in';
        this.transitionT = 0;
        this.state = this.stateBeforeTransition;
        fn?.();
        // Whatever state fn left us in is where the fade-in lands.
        this.stateBeforeTransition = this.state;
        this.state = 'transition';
      }
    } else {
      this.hud.fade(1 - Math.min(1, this.transitionT / 0.5));
      if (this.transitionT >= 0.5) {
        this.hud.fade(0);
        this.state = this.stateBeforeTransition;
      }
    }
  }

  pause(): void {
    this.state = 'pause';
    this.input.wantPointerLock = false;
    this.input.releaseLock();
    this.audio.stopAllLoops();
    this.player.breath.stop();
    this.menus.showPause();
    this.audio.play('uiBack');
  }

  resume(): void {
    this.menus.hideAll();
    this.state = 'play';
    this.input.wantPointerLock = true;
    this.input.requestLock();
    this.input.clearBuffers();
  }

  quitToTitle(): void {
    writeSave(this.save);
    this.menus.hideAll();
    this.fadeTo(() => this.showTitle());
  }

  private simulate(dt: number): void {
    const level = this.level;
    if (!level) return;
    if (this.hitstopT > 0) {
      this.hitstopT -= dt;
      this.fx.update(dt * 0.25);
      return;
    }
    this.slowT = Math.max(0, this.slowT - dt);
    let worldScale = this.slowT > 0 ? this.slowScale : 1;
    const dtime = this.player.dragonTimeActive;
    if (dtime) worldScale = Math.min(worldScale, 0.33);
    const playerScale = dtime ? 0.8 : 1;
    this.hud.dragonTime(dtime);
    const wdt = dt * worldScale;
    const pdt = dt * playerScale;
    this.time += wdt;
    this.save.stats.playTime += dt;

    const steps = Math.max(1, Math.ceil(Math.max(wdt, pdt) / (1 / 60)));
    for (let i = 0; i < steps; i++) {
      this.rebuildHitList();
      level.update(wdt / steps);
      this.player.update(pdt / steps);
      for (const e of this.enemies) e.update(wdt / steps);
      for (const p of this.projectiles) if (p.alive) p.update(wdt / steps);
      for (const s of this.shockwaves) if (s.alive) s.update(wdt / steps);
      this.boss?.updateBoss(wdt / steps);
    }
    for (const g of this.gems) if (g.alive) g.update(pdt);
    this.updatePatches(wdt);
    this.updateSpikes(wdt);
    this.flick.update(dt);
    this.fx.update(wdt);

    // Cleanup.
    const removed = this.enemies.filter((e) => e.removable);
    for (const e of removed) e.dispose();
    if (removed.length) this.enemies = this.enemies.filter((e) => !e.removable);
    if (this.projectiles.some((p) => !p.alive)) this.projectiles = this.projectiles.filter((p) => p.alive);
    if (this.shockwaves.some((s) => !s.alive)) this.shockwaves = this.shockwaves.filter((s) => s.alive);
    if (this.gems.length > 20 && this.gems.some((g) => !g.alive)) this.gems = this.gems.filter((g) => g.alive);
    for (const s of this.pendingSpawns) this.spawnEnemy(s.type, s.x, s.y, s.z, s.yaw, false);
    this.pendingSpawns = [];

    // Combat music follows engaged enemies.
    const engaged = this.enemies.some((e) => e.alive && e.aggro && Math.hypot(e.x - this.player.x, e.z - this.player.z) < 28);
    if (engaged || this.activeArena || this.boss) this.combatHold = 3;
    else this.combatHold = Math.max(0, this.combatHold - dt);
    const want = this.combatHold > 0 ? 1 : 0;
    if (want !== this.audio.combatLevel) this.audio.setCombat(want);
    this.style.update(dt, this.combatHold > 0);
    this.visit.combo = Math.max(this.visit.combo, this.style.combo);
    this.visit.rank = Math.max(this.visit.rank, this.style.rank);
    if (this.style.bestCombo > this.save.stats.bestCombo) {
      this.save.stats.bestCombo = this.style.bestCombo;
      this.checkFeats();
    }
    const ex = extra(this.save);
    if (this.style.rank > (ex.bestRank ?? 0)) {
      ex.bestRank = this.style.rank;
      this.checkFeats();
    }

    // Gem chime chain.
    this.gemChainT -= dt;
    if (this.gemChainT <= 0) this.gemChain = 0;

    // Loops that follow the dragon.
    if (this.player.gliding) {
      this.audio.startLoopOnce('glide', 'wind');
      const sp = Math.hypot(this.player.body.vx, this.player.body.vz);
      this.audio.tuneLoop('glide', 400 + sp * 60, 0.1 + sp * 0.01);
    } else this.audio.stopLoop('glide');

    this.autosaveT += dt;
    if (this.autosaveT > 30) {
      this.autosaveT = 0;
      writeSave(this.save);
    }
  }

  private rebuildHitList(): void {
    const l = this.hitList;
    l.length = 0;
    for (const e of this.enemies) if (e.alive) l.push(e);
    if (this.level) for (const h of this.level.hittables) if (h.alive) l.push(h);
  }

  hittables(): Hittable[] {
    return this.hitList;
  }

  private updateInteract(): void {
    const level = this.level;
    if (!level || !this.player.alive) return;
    const p = this.player.body;
    let best: typeof this.interactTarget = null;
    let bestD = Infinity;
    for (const it of level.interactables) {
      if (!it.enabled) continue;
      const d = Math.hypot(it.x - p.x, it.z - p.z);
      if (d < it.range && Math.abs(it.y - p.y) < 3 && d < bestD) {
        bestD = d;
        best = it;
      }
    }
    this.interactTarget = best;
    this.hud.prompt(best ? best.label : null);
    if (best && this.input.take('interact', 0.2)) best.interact();
  }

  // --- time effects -------------------------------------------------------------------

  hitstop(d: number): void {
    this.hitstopT = Math.max(this.hitstopT, Math.min(d, 0.14));
  }

  slowmo(scale: number, dur: number): void {
    if (this.slowT <= 0 || scale < this.slowScale) this.slowScale = scale;
    this.slowT = Math.max(this.slowT, dur);
  }

  shake(amount: number, dur = 0.2): void {
    this.cam.shake(amount, dur);
    if (this.input.usingPad && amount >= 0.2 && this.options.shake > 0) this.rumble(Math.min(1, amount), dur);
  }

  private rumble(strength: number, dur: number): void {
    try {
      for (const pad of navigator.getGamepads?.() ?? []) {
        const act = (pad as (Gamepad & { vibrationActuator?: { playEffect?: (t: string, o: object) => Promise<unknown> } }) | null)?.vibrationActuator;
        act?.playEffect?.('dual-rumble', { duration: Math.round(dur * 1000), strongMagnitude: strength, weakMagnitude: strength * 0.6 })?.catch?.(() => {});
      }
    } catch {
      /* rumble is best-effort */
    }
  }

  toast(text: string, kind: 'info' | 'good' | 'warn' | 'hint' = 'info'): void {
    this.hud.toast(text, kind);
  }

  sfx(id: Sfx, x?: number, y?: number, z?: number, pitch = 1, vol = 1): void {
    let v = vol;
    if (x !== undefined && z !== undefined) {
      const d = Math.hypot(x - this.player.x, (y ?? this.player.y) - this.player.y, z - this.player.z);
      v *= Math.max(0.08, Math.min(1, 1.25 - d / 32));
      if (d > 60) return;
    }
    this.audio.play(id, pitch, v);
  }

  // --- spawning -----------------------------------------------------------------------

  spawnEnemy(type: string, x: number, y: number, z: number, yaw: number, arena: boolean): Enemy {
    const def = ENEMIES[type];
    if (!def) throw new Error(`unknown enemy ${type}`);
    const e = new Enemy(this, def, x, y, z, yaw);
    if (!arena) {
      e.state = 'idle';
      e.model.root.visible = true;
    }
    // Now and then a foe is an elite: gold-lit, tougher, and worth more.
    const common = def.speed > 0 && def.id !== 'dummy' && def.id !== 'totem';
    if (common && this.level && this.level.def.id !== 'fen' && rng.chance(arena ? 0.06 : 0.1)) e.makeElite();
    this.enemies.push(e);
    return e;
  }

  addBoss(b: Boss): void {
    this.boss = b;
    this.enemies.push(b);
    this.hud.bossBar(b);
  }

  spawnProjectile(s: ProjectileSpec): Projectile {
    const p = new Projectile(this, s);
    this.projectiles.push(p);
    return p;
  }

  spawnShockwave(x: number, y: number, z: number, r: number, speed: number, dmg: number, kb: number, _src: unknown): void {
    this.shockwaves.push(new Shockwave(this, x, y, z, r, speed, dmg, kb));
  }

  spawnGems(x: number, y: number, z: number, amounts: Partial<Record<GemKind, number>>, auto: boolean): void {
    for (const k of ['blue', 'red', 'green', 'purple'] as GemKind[]) {
      const total = amounts[k] ?? 0;
      if (total <= 0) continue;
      for (const v of splitValue(total)) this.gems.push(new Gem(this, k, v, x, y, z, 5, auto));
    }
  }

  placeGem(kind: GemKind, value: number, x: number, y: number, z: number): void {
    const g = new Gem(this, kind, value, x, y, z, 0, false);
    g.vy = 0;
    g.age = 1;
    this.gems.push(g);
  }

  nearestEnemy(x: number, y: number, z: number, r: number): Enemy | null {
    let best: Enemy | null = null;
    let bd = r;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - x, e.y - y, e.z - z);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  // --- combat events -------------------------------------------------------------------

  isWarded(e: Enemy): boolean {
    if (e.def.id === 'totem') return false;
    for (const t of this.enemies) {
      if (t.alive && t.def.id === 'totem' && Math.hypot(t.x - e.x, t.z - e.z) < TOTEM_WARD) return true;
    }
    return false;
  }

  onEnemyDamaged(e: Enemy, dmg: number, hit: Hit | null, reaction: Reaction | null): void {
    if (this.options.damageNumbers && dmg >= 0.5) {
      const col = hit ? typeColor(hit.type) : 0xff9a50;
      const tick = hit?.source === 'breath' || dmg < 4;
      this.hud.number(e.x, e.y + e.height + 0.2, e.z, Math.round(dmg), col, reaction !== null || (hit?.heavy ?? false), tick ? e : undefined);
    }
  }

  /** Pays out any feat the save has just earned. */
  checkFeats(): void {
    for (const f of newlyDone(this.save)) {
      this.save.found[featKey(f.id)] = true;
      this.save.gems += f.reward;
      this.hud.gemBump();
      this.audio.play('levelUp');
      this.toast(`Feat: ${f.name}! +${f.reward} spirit gems`, 'good');
    }
  }

  /** An egg thief guarding egg `fullId` near (x, z), unless that egg is already home. */
  addEggThief(fullId: string, x: number, z: number, leash = 24): EggThief | null {
    const level = this.level;
    if (!level || this.save.found[fullId]) return null;
    const t = new EggThief(this, fullId, x, z, leash);
    level.props.push(t);
    level.hittables.push(t);
    return t;
  }

  /** First time a foe of this kind turns up: a new Bestiary page. */
  noticeEnemy(e: Enemy): void {
    const key = `seen:${e.def.id}`;
    if (this.save.found[key] || !BESTIARY[e.def.id]) return;
    this.save.found[key] = true;
    this.toast(`New in the Bestiary: ${e.def.name}`, 'hint');
  }

  onEnemyKilled(e: Enemy, reaction: Reaction | null): void {
    this.save.stats.kills++;
    if (e.elite) bump(this.save, 'elites');
    const mul = this.style.reward * (reaction === 'shatter' ? 1.5 : 1) * (e.elite ? 2.5 : 1);
    const g = e.def.gems;
    this.spawnGems(e.x, e.y + e.height * 0.5, e.z, {
      blue: Math.round(g.blue * mul), red: (g.red ?? 0) + (e.elite ? 1 : 0), green: g.green ?? 0, purple: (g.purple ?? 0) + (e.elite ? 1 : 0),
    }, true);
    this.style.bonus(15 * (e.def.styleValue ?? 1));
    this.player.gainFury(5);
    if (this.player.lock === e) this.player.lock = null;
    this.checkFeats();
    // The last foe of a fight falls in slow motion.
    const others = this.enemies.some((o) => o !== e && o.alive && o.aggro && Math.hypot(o.x - e.x, o.z - e.z) < 32);
    if (!others && !this.activeArena && !this.boss && e.def.id !== 'dummy' && this.combatHold > 0 && this.encounterKills >= 1) {
      this.slowmo(0.3, 0.55);
      this.cam.punchT = 0.5;
      this.shake(0.25, 0.2);
      this.audio.play('perfect', 0.7, 0.6);
    }
    this.encounterKills = others ? this.encounterKills + 1 : 0;
  }
  /** Kills in the current fight, so a lone straggler does not get the finale. */
  private encounterKills = 0;

  triggerReaction(e: Enemy, r: Reaction): void {
    const info = REACTION_INFO[r];
    const x = e.x;
    const y = e.y + e.height * 0.5;
    const z = e.z;
    this.save.stats.reactions++;
    this.checkFeats();
    this.style.bonus(90);
    this.hud.bigText(info.name, info.color);
    this.player.gainFury(10);
    if (r === 'shatter') {
      this.fx.shatter(x, y, z);
      this.sfx('shatter', x, y, z);
      this.slowmo(0.3, 0.25);
      this.shake(0.3, 0.2);
    } else if (r === 'overload') {
      this.fx.explosion(x, y, z, 2.2, 0xffd36a, 0x8040ff);
      for (let i = 0; i < 6; i++) {
        const a = new THREE.Vector3(x, y, z);
        const b = new THREE.Vector3(x + rng.signed() * 4, y + rng.signed() * 2, z + rng.signed() * 4);
        this.fx.arc(a, b, 0xffe8a0, 0.1, 0.2, 0.4);
      }
      this.sfx('explosion', x, y, z, 1.2);
      this.shake(0.4, 0.3);
      this.aoe(x, y, z, info.radius, info.damage, 'lightning', e, { knockback: 8, launch: 5, buildup: 30, stagger: 40 });
    } else {
      this.fx.emit(x, y, z, { count: 40, speed: 6, life: [0.6, 1.1], size: [0.8, 1.4], sizeEnd: 3, color: 0xf4f8ff, alpha: 0.6, additive: false, drag: 3, gravity: -2 });
      this.sfx('steam', x, y, z);
      this.aoe(x, y, z, info.radius, info.damage, 'physical', e, { knockback: 4, launch: 0, buildup: 0, stagger: 60, steam: true });
    }
  }

  private aoe(x: number, y: number, z: number, r: number, dmg: number, type: DamageType, skip: Enemy | null,
    o: { knockback: number; launch: number; buildup: number; stagger: number; steam?: boolean }): void {
    for (const e of [...this.enemies]) {
      if (!e.alive || e === skip) continue;
      const dx = e.x - x;
      const dz = e.z - z;
      const d = Math.hypot(dx, dz);
      if (d > r + e.radius || Math.abs(e.y - y) > 3) continue;
      if (o.steam) e.status.steam = 1.8;
      const n = d || 1;
      e.takeHit(makeHit({
        damage: dmg, type, dirX: dx / n, dirZ: dz / n, knockback: o.knockback, launch: o.launch, buildup: o.buildup,
        stagger: o.stagger, source: 'reaction', move: 'reaction', ox: x, oz: z,
      }));
    }
  }

  explode(x: number, y: number, z: number, r: number, dmg: number, type: DamageType, fromPlayer: boolean, o: {
    buildup: number; knockback: number; launch: number; stagger: number; heavy: boolean; move: string; color: number; burnGround: boolean;
  }): void {
    const col = type === 'fire' ? 0xffa040 : type === 'earth' ? 0xc8a878 : type === 'lightning' ? 0xbfe8ff : type === 'ice' ? 0xcff6ff : o.color;
    if (type === 'earth') {
      this.fx.rocks(x, y, z, 18);
      this.fx.ring(x, y - 0.3, z, 0.3, r * 1.3, 0xd8c8a0, 0.4);
      this.sfx('pound', x, y, z);
    } else {
      this.fx.explosion(x, y, z, r * 0.6, col);
      this.sfx('explosion', x, y, z, type === 'lightning' ? 1.4 : 1, 0.8);
    }
    this.shake(0.3 * Math.min(1.5, r / 3), 0.25);
    if (fromPlayer) {
      for (const h of this.hittables()) {
        if (!h.alive) continue;
        const dx = h.x - x;
        const dz = h.z - z;
        const d = Math.hypot(dx, dz, (h.y + h.height * 0.5 - y) * 0.7);
        if (d > r + h.radius) continue;
        const fall = 1 - Math.min(1, d / (r + h.radius)) * 0.5;
        const n = Math.hypot(dx, dz) || 1;
        const res = h.takeHit(makeHit({
          damage: dmg * fall, type, buildup: o.buildup, dirX: dx / n, dirZ: dz / n, knockback: o.knockback, launch: o.launch,
          stagger: o.stagger, heavy: o.heavy, source: 'burst', move: o.move, ox: x, oz: z, hitstop: 0.03,
        }));
        this.player.onDealt(res, h, dmg * fall, o.move, 12);
      }
      if (o.burnGround) this.firePatches.push({ x, y, z, r: r * 0.8, t: 3, tick: 0 });
    } else {
      const p = this.player;
      const d = Math.hypot(p.x - x, p.y + 0.6 - y, p.z - z);
      if (d < r + p.body.radius) {
        const n = Math.hypot(p.x - x, p.z - z) || 1;
        p.takeHit(makeHit({ damage: dmg * this.difficultyInfo.enemyDamage, type, dirX: (p.x - x) / n, dirZ: (p.z - z) / n, knockback: o.knockback, launch: 6, source: 'enemy', fromPlayer: false, ox: x, oz: z }), null);
      }
    }
  }

  private updatePatches(dt: number): void {
    for (const f of this.firePatches) {
      f.t -= dt;
      f.tick -= dt;
      if (rng.chance(0.6)) {
        const a = rng.next() * Math.PI * 2;
        const rr = Math.sqrt(rng.next()) * f.r;
        this.fx.emit(f.x + Math.sin(a) * rr, f.y, f.z + Math.cos(a) * rr, { count: 1, speed: 1.5, dir: [0, 1.5, 0], life: [0.3, 0.6], size: [0.4, 0.7], sizeEnd: 0.1, color: 0xffb040, colorEnd: 0xff2000, bright: 1.6, gravity: -2 });
      }
      if (f.tick <= 0) {
        f.tick = 0.5;
        for (const e of this.enemies) {
          if (!e.alive || Math.hypot(e.x - f.x, e.z - f.z) > f.r + e.radius || Math.abs(e.y - f.y) > 1.5) continue;
          e.takeHit(makeHit({ damage: 4, type: 'fire', buildup: 30, source: 'burst', move: 'firePatch', ox: f.x, oz: f.z }));
        }
      }
    }
    if (this.firePatches.some((f) => f.t <= 0)) this.firePatches = this.firePatches.filter((f) => f.t > 0);
  }

  spawnIceSpikes(x: number, y: number, z: number, r: number): void {
    const m = new THREE.MeshStandardMaterial({ color: 0xcff6ff, roughness: 0.1, emissive: 0x3aa0d0, emissiveIntensity: 0.4, flatShading: true, transparent: true });
    const meshes: THREE.Mesh[] = [];
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * (0.55 + rng.next() * 0.4);
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.2, 5), m);
      sp.position.set(x + Math.sin(a) * rr, y - 1, z + Math.cos(a) * rr);
      sp.rotation.set(Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.35);
      this.scene.add(sp);
      meshes.push(sp);
    }
    this.spikes.push({ meshes, t: 0 });
    for (const e of this.enemies) {
      if (!e.alive || Math.hypot(e.x - x, e.z - z) > r + e.radius) continue;
      e.takeHit(makeHit({ damage: 10, type: 'ice', buildup: 30, launch: 6, stagger: 30, source: 'burst', move: 'iceSpikes', ox: x, oz: z }));
    }
  }

  private updateSpikes(dt: number): void {
    for (const s of this.spikes) {
      s.t += dt;
      const up = Math.min(1, s.t / 0.12);
      for (const m of s.meshes) {
        m.position.y += (up < 1 ? 9 : 0) * dt;
        const mm = m.material as THREE.MeshStandardMaterial;
        if (s.t > 1.2) mm.opacity = Math.max(0, 1 - (s.t - 1.2) * 2);
      }
      if (s.t > 1.8) for (const m of s.meshes) this.scene.remove(m);
    }
    if (this.spikes.some((s) => s.t > 1.8)) this.spikes = this.spikes.filter((s) => s.t <= 1.8);
  }

  onSlam(x: number, y: number, z: number, r: number): void {
    this.level?.slam(x, y, z, r);
  }

  // --- world queries -----------------------------------------------------------------------

  isDeepWater(_x: number, _z: number, groundY: number): boolean {
    const wl = this.waterLevel;
    return wl > -1e3 && wl > groundY + 0.9;
  }

  inHazard(x: number, y: number, z: number): boolean {
    return !!this.level?.hazards.some((h) => h.contains(x, y, z));
  }

  updraftAt(x: number, y: number, z: number): number {
    let s = 0;
    for (const u of this.level?.updrafts ?? []) if (u.contains(x, y, z)) s += u.strength;
    return s;
  }

  // --- player events -------------------------------------------------------------------------

  playerFell(): void {
    const p = this.player;
    if (p.state === 'fall' || p.state === 'dead') return;
    p.setState('fall');
    p.breath.stop();
    this.fadeTo(() => {
      p.respawnAtSafe();
      p.hp = Math.max(1, p.hp - 8);
      this.toast('-8', 'warn');
      this.cam.snapBehind(p.yaw);
    });
  }

  onPlayerDied(): void {
    this.state = 'dead';
    this.deadT = 0;
    this.save.stats.deaths++;
    this.hud.death(true);
    this.audio.stopAllLoops();
  }

  private respawnAtCheckpoint(): void {
    this.hud.death(false);
    this.fadeTo(() => {
      for (const a of this.level?.arenas ?? []) a.reset();
      if (this.activeArena) this.arenaEnded(this.activeArena);
      if (this.boss && this.boss.alive) {
        // The fight starts over when the player walks back in.
        const boss = this.boss;
        boss.alive = false;
        boss.releaseToken();
        boss.dispose();
        this.enemies = this.enemies.filter((e) => e !== boss);
        this.boss = null;
        this.hud.bossBar(null);
        this.audio.setMusic(THEMES[this.level!.def.music] ?? null);
        this.level!.emit('boss-reset');
      }
      const cp = this.save.level === this.level!.def.id && this.save.checkpoint ? this.level!.wardstones.get(this.save.checkpoint) : undefined;
      let x: number;
      let z: number;
      let yaw: number;
      if (cp) {
        x = cp.x + Math.sin(cp.yaw) * 2.5;
        z = cp.z + Math.cos(cp.yaw) * 2.5;
        yaw = cp.yaw;
      } else [x, z, yaw] = this.level!.def.spawn;
      const y = this.col.groundAt(x, z, 1e4, 0.2).y;
      this.player.place(x, y + 0.1, z, yaw);
      this.player.resetForLevel();
      this.player.fury = 0;
      // A moment's grace so nothing lands a hit the instant Aster is back.
      this.player.iframes = 2;
      for (const p of this.projectiles) p.kill();
      for (const e of this.enemies) if (e.alive) {
        e.aggro = false;
        e.releaseToken();
        e.body.setPos(e.homeX, e.body.y, e.homeZ);
      }
      this.cam.snapBehind(yaw);
      this.state = 'play';
    });
  }

  activateCheckpoint(w: Wardstone): void {
    this.save.checkpoint = w.id;
    this.save.level = this.level!.def.id;
    this.player.heal(this.player.maxHp);
    this.player.mana = this.player.maxMana;
    writeSave(this.save);
  }

  openWardstone(w: Wardstone): void {
    this.state = 'pause';
    this.input.wantPointerLock = false;
    this.input.releaseLock();
    this.audio.stopAllLoops();
    this.menus.showWardstone(w);
  }

  private wornSkin = 'violet';

  /** Puts Aster in the chosen scales, if they have been earned. */
  applySkin(): void {
    const want = this.save.skin && skinUnlocked(this.save, this.save.skin) ? this.save.skin : 'violet';
    if (want === this.wornSkin) return;
    this.wornSkin = want;
    this.player.setLook(SKINS.find((k) => k.id === want)?.look ?? {});
  }

  collect(c: Collectible): void {
    const s = this.save;
    s.found[c.id] = true;
    const p = this.player;
    if (c.kind === 'heart') {
      s.heartShards++;
      const k = s.heartShards % SHARDS_PER_UPGRADE;
      this.sfx('shard');
      if (k === 0) {
        this.toast('Four Heart Shards! Maximum health increased.', 'good');
        this.audio.play('levelUp');
        p.hp = maxHp(s);
      } else this.toast(`Heart Shard (${k}/${SHARDS_PER_UPGRADE})`, 'good');
    } else if (c.kind === 'mana') {
      s.manaShards++;
      const k = s.manaShards % SHARDS_PER_UPGRADE;
      this.sfx('shard');
      if (k === 0) {
        this.toast('Four Spirit Shards! Maximum mana increased.', 'good');
        this.audio.play('levelUp');
        p.mana = maxMana(s);
      } else this.toast(`Spirit Shard (${k}/${SHARDS_PER_UPGRADE})`, 'good');
    } else if (c.kind === 'letter') {
      this.sfx('page');
      const lvl = this.level!.def.id;
      s.found[letterKey(lvl, c.relicId)] = true;
      const l = findLetter(lvl, c.relicId);
      if (l) this.hud.letter(l.title, l.from, l.text);
    } else if (c.kind === 'egg') {
      this.sfx('egg');
      const n = eggsFound(s);
      const skin = SKINS.find((k) => k.eggs === n && k.eggs > 0);
      if (skin) {
        this.audio.play('levelUp');
        this.toast(`Lost Dragon Egg! (${n} returned) New scales unlocked: ${skin.name}. Wear them from the pause menu.`, 'good');
      } else {
        const next = SKINS.find((k) => k.eggs > n);
        this.toast(`Lost Dragon Egg! (${n} returned${next ? `, ${next.eggs - n} more for new scales` : ''})`, 'good');
      }
    } else {
      this.sfx('relic');
      s.found[`relic:${c.relicId}`] = true;
      const r = RELICS[c.relicId];
      if (r) this.hud.relic(r.title, r.text);
    }
    this.checkFeats();
    const mote = c.kind === 'heart' ? 0xff6a7a : c.kind === 'mana' ? 0x6af09a : c.kind === 'egg' ? 0xd8b0ff : c.kind === 'letter' ? 0xffe0c0 : 0xfff0b0;
    this.fx.motes(c.x, c.y + 1, c.z, mote, 30);
    writeSave(s);
  }

  collectGem(kind: GemKind, value: number, x: number, y: number, z: number): void {
    const p = this.player;
    this.gemChain++;
    this.gemChainT = 0.6;
    const pitch = 1 + Math.min(12, this.gemChain) * 0.045;
    switch (kind) {
      case 'blue':
        this.save.gems += value;
        this.visit.gems += value;
        this.hud.gemBump();
        this.audio.play('gemBlue', pitch, 0.7);
        break;
      case 'red':
        p.heal(8 * value);
        this.audio.play('gemRed', pitch, 0.7);
        break;
      case 'green':
        p.mana = Math.min(p.maxMana, p.mana + 8 * value);
        this.audio.play('gemGreen', pitch, 0.7);
        break;
      case 'purple':
        p.gainFury(6 * value);
        this.audio.play('gemPurple', pitch, 0.7);
        break;
    }
    this.fx.sparkle(x, y, z, GEM_COLORS[kind], 3);
  }

  // --- arenas and bosses -------------------------------------------------------------------------

  arenaStarted(a: Arena): void {
    this.activeArena = a;
    this.cam.extraDist = 1.5;
  }

  arenaEnded(a: Arena): void {
    if (this.activeArena === a) this.activeArena = null;
    this.cam.extraDist = 0;
    writeSave(this.save);
  }

  // --- story ----------------------------------------------------------------------------------------

  say(lines: Line[], onDone?: () => void): void {
    this.player.breath.stop();
    this.player.gliding = false;
    const prev = this.state === 'dialogue' ? 'play' : this.state;
    this.state = 'dialogue';
    this.player.setState('locked');
    this.dialogue.start(lines, () => {
      this.dialogueSpeaker = null;
      this.cam.clearShot();
      this.player.setState('move');
      this.state = prev === 'dead' ? 'dead' : 'play';
      this.input.clearBuffers();
      onDone?.();
    });
  }

  learnElement(e: Element): void {
    learnElement(this.save, e);
    this.player.element = e;
    this.hud.elementChanged(e);
    writeSave(this.save);
  }

  saveNow(): void {
    writeSave(this.save);
  }
}

function typeColor(t: DamageType): number {
  switch (t) {
    case 'fire': return 0xffa040;
    case 'lightning': return 0xbfe8ff;
    case 'ice': return 0x9fe8ff;
    case 'earth': return 0xb8e07a;
    case 'shadow': return 0xd070ff;
    default: return 0xfff6e0;
  }
}
