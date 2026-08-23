/**
 * The application shell.
 *
 * Owns the canvas, the loop, and input, and switches between the front-end
 * screens and a running game. The Game itself is now just one screen among
 * several — it is handed a prepared character and a way to persist it, and
 * knows nothing about worlds or slots.
 */
import { GameLoop } from './engine/loop';
import { Input } from './engine/input';
import { Renderer } from './engine/renderer';
import { Rng } from './engine/rng';
import { UiInput } from './ui/imgui';
import { Game, GameSession } from './game/game';
import { QuestLog } from './game/quests';
import { createStarterCharacter, randomName } from './game/newgame';
import { restore, SaveData } from './game/save';
import {
  Profile, clearProfile, deleteCharacter, loadProfile, putCharacter,
  saveProfile, worldSlots,
} from './game/profile';
import { DEFAULT_WORLD, getWorld, tryWorld } from './data/worlds';
import { DEFAULT_CLASS } from './data/classes';
import {
  MenuAction, MenuContext, Screen, drawCharacterSelect, drawClassSelect,
  drawWorldSelect, validateName,
} from './ui/screens';
import { STARTING_MAP } from './data/maps';

const AUTOSAVE_INTERVAL = 25;
const MAX_NAME = 12;

export class App {
  private readonly renderer: Renderer;
  private readonly input = new Input();
  private readonly ui = new UiInput();
  private readonly loop: GameLoop;
  private readonly rng = new Rng();

  private profile: Profile;
  private screen: Screen = 'world';
  private game: Game | null = null;

  private worldId: string | null = null;
  private slot: number | null = null;
  private classId = DEFAULT_CLASS;
  private nameDraft = '';
  private nameError: string | null = null;
  private page = 0;
  private time = 0;
  private autosave = AUTOSAVE_INTERVAL;

  /** Slot being created into, while the class screen is up. */
  private creatingSlot: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.profile = loadProfile();

    // Land on the world the player last used, so returning feels continuous.
    if (this.profile.lastWorld && tryWorld(this.profile.lastWorld)) {
      this.worldId = this.profile.lastWorld;
      this.screen = 'characters';
    }

    this.bindPointer(canvas);
    this.bindTextEntry();

    this.loop = new GameLoop({
      update: (dt) => this.update(dt),
      render: (alpha, frameDt) => this.render(alpha, frameDt),
    });
  }

  start(): void {
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
    this.input.destroy();
    this.renderer.destroy();
  }

  /* ------------------------------------------------------------- input -- */

  private bindPointer(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('mousemove', (e) => {
      const p = this.renderer.toViewSpace(e.clientX, e.clientY);
      this.ui.move(p.x, p.y);
    });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.ui.press();
      if (e.button === 2) this.ui.rightPress();
    });
    canvas.addEventListener('mouseup', () => this.ui.release());
    canvas.addEventListener('dblclick', () => this.ui.doublePress());
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.ui.scroll(e.deltaY * 0.5);
    }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('mouseleave', () => this.ui.move(-999, -999));
  }

  /** Raw key capture for the name field — the action bindings can't type. */
  private bindTextEntry(): void {
    window.addEventListener('keydown', (e) => {
      if (this.screen !== 'class') return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        this.nameDraft = this.nameDraft.slice(0, -1);
        this.nameError = null;
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        this.confirmCreate();
        return;
      }
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      if (!/[A-Za-z0-9]/.test(e.key)) return;
      if (this.nameDraft.length >= MAX_NAME) return;
      e.preventDefault();
      this.nameDraft += e.key;
      this.nameError = null;
    });
  }

  /* ------------------------------------------------------------ update -- */

  private update(dt: number): void {
    this.time += dt;

    if (this.game) {
      this.game.update(dt);
      this.autosave -= dt;
      if (this.autosave <= 0) {
        this.autosave = AUTOSAVE_INTERVAL;
        this.persist(this.game.snapshot());
      }
      return;
    }

    // Menu screens: Esc steps back one level.
    if (this.input.pressed('uiClose')) {
      this.input.consume('uiClose');
      if (this.screen === 'class') this.screen = 'characters';
      else if (this.screen === 'characters') this.toWorldSelect();
    }
    this.input.endTick();
  }

  /* ------------------------------------------------------------ render -- */

  private render(alpha: number, frameDt: number): void {
    this.ui.beginFrame();

    if (this.game) {
      this.game.render(alpha, frameDt);
      return;
    }

    const menu: MenuContext = {
      ctx: this.renderer.ctx,
      ui: this.ui,
      time: this.time,
      profile: this.profile,
      worldId: this.worldId,
      slot: this.slot,
      classId: this.classId,
      nameDraft: this.nameDraft,
      nameError: this.nameError,
      page: this.page,
    };

    const action =
      this.screen === 'world' ? drawWorldSelect(menu) :
      this.screen === 'characters' ? drawCharacterSelect(menu) :
      drawClassSelect(menu);

    if (action) this.handle(action);
  }

  /* ----------------------------------------------------------- actions -- */

  private handle(action: NonNullable<MenuAction>): void {
    switch (action.kind) {
      case 'selectWorld':     this.selectWorld(action.worldId); break;
      case 'backToWorlds':    this.toWorldSelect(); break;
      case 'setPage':         this.page = action.page; break;
      case 'play':            this.play(action.slot); break;
      case 'createAt':        this.beginCreate(action.slot); break;
      case 'deleteAt':        this.deleteAt(action.slot); break;
      case 'pickClass':       this.chooseClass(action.classId); break;
      case 'confirmCreate':   this.createCharacter(); break;
      case 'backToCharacters': this.screen = 'characters'; break;
    }
  }

  /* ------------------------------------------------------- navigation -- */

  selectWorld(worldId: string): void {
    if (!tryWorld(worldId)) return;
    this.worldId = worldId;
    this.slot = null;
    this.page = 0;
    this.screen = 'characters';
  }

  /** Open the class screen for an empty slot. */
  beginCreate(slot: number): void {
    if (this.worldId === null) return;
    const slots = worldSlots(this.profile, this.worldId);
    if (slot < 0 || slot >= slots.length || slots[slot]) return;
    this.creatingSlot = slot;
    this.classId = DEFAULT_CLASS;
    this.nameDraft = randomName(this.rng);
    this.nameError = null;
    this.screen = 'class';
  }

  chooseClass(classId: string): void {
    this.classId = classId;
  }

  /**
   * Set the name field. Deliberately does NOT truncate: the keyboard handler
   * caps what can be typed, and silently trimming here would turn an invalid
   * name into a valid one instead of reporting it.
   */
  setName(name: string): void {
    this.nameDraft = name;
    this.nameError = null;
  }

  /** Validate and create. Returns false (with an error set) if rejected. */
  createCharacter(): boolean {
    this.confirmCreate();
    return this.game !== null;
  }

  play(slot: number): void {
    this.enterGame(slot);
  }

  deleteAt(slot: number): void {
    this.deleteSlot(slot);
  }

  /** Leave the running game and return to character select. */
  exitToMenu(): void {
    if (this.game) this.game.exitToMenu();
  }

  get nameFieldError(): string | null {
    return this.nameError;
  }

  get selectedClass(): string {
    return this.classId;
  }

  private toWorldSelect(): void {
    this.screen = 'world';
    this.slot = null;
    this.page = 0;
  }

  private deleteSlot(slot: number): void {
    if (!this.worldId) return;
    const summary = worldSlots(this.profile, this.worldId)[slot];
    if (!summary) return;
    const label = `${summary.player.name} (Lv. ${summary.player.level})`;
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    deleteCharacter(this.profile, this.worldId, slot);
    saveProfile(this.profile);
    this.slot = null;
  }

  private confirmCreate(): void {
    if (this.worldId === null || this.creatingSlot === null) return;
    const error = validateName(this.nameDraft);
    if (error) {
      this.nameError = error;
      return;
    }

    const taken = worldSlots(this.profile, this.worldId).some(
      (s) => s && s.player.name.toLowerCase() === this.nameDraft.trim().toLowerCase(),
    );
    if (taken) {
      this.nameError = 'That name is already used in this world.';
      return;
    }

    const created = createStarterCharacter(this.rng, this.nameDraft.trim(), this.classId);
    const session: GameSession = {
      player: created.player,
      quests: new QuestLog(),
      quickSlots: created.quickSlots,
      mapId: STARTING_MAP,
      portalName: 'spawn',
      fresh: true,
    };
    this.slot = this.creatingSlot;
    this.creatingSlot = null;
    this.startGame(session);
  }

  private enterGame(slot: number): void {
    if (!this.worldId) return;
    const data = worldSlots(this.profile, this.worldId)[slot];
    if (!data) return;
    this.slot = slot;

    const restored = restore(data);
    this.startGame({
      player: restored.player,
      quests: restored.quests,
      quickSlots: restored.quickSlots,
      mapId: restored.mapId,
      portalName: restored.portalName,
      fresh: false,
    });
  }

  private startGame(session: GameSession): void {
    this.autosave = AUTOSAVE_INTERVAL;
    this.game = new Game(this.renderer, this.input, this.ui, session, {
      persist: (data) => this.persist(data),
      exitToMenu: () => this.leaveGame(),
    });
    // Save immediately so a brand-new character survives a closed tab.
    this.persist(this.game.snapshot());
    exposeForTools(this.game, this);
  }

  private leaveGame(): void {
    this.game = null;
    this.screen = 'characters';
    exposeForTools(null, this);
  }

  private persist(data: SaveData): boolean {
    if (this.worldId === null || this.slot === null) return false;
    putCharacter(this.profile, this.worldId, this.slot, data);
    return saveProfile(this.profile);
  }

  /* -------------------------------------------------------------- utils -- */

  /** Save whatever is in progress. Used on tab close. */
  saveNow(): void {
    if (this.game) this.persist(this.game.snapshot());
  }

  /** Wipe everything and start over. */
  resetAll(): void {
    clearProfile();
    location.reload();
  }

  /**
   * Create a character and drop straight into the world.
   *
   * Used by `?quickstart=` and by the headless tests, which should not have to
   * click through three screens to reach the thing they are testing.
   */
  quickStart(classId = DEFAULT_CLASS, worldId = DEFAULT_WORLD, name?: string): void {
    this.worldId = tryWorld(worldId) ? worldId : DEFAULT_WORLD;
    const slots = worldSlots(this.profile, this.worldId);
    const free = slots.indexOf(null);
    this.creatingSlot = free >= 0 ? free : 0;
    this.classId = classId;
    this.nameDraft = name ?? randomName(this.rng);
    this.confirmCreate();
  }

  get currentScreen(): Screen | 'playing' {
    return this.game ? 'playing' : this.screen;
  }

  get world() {
    return this.worldId ? getWorld(this.worldId) : null;
  }
}

/** Keep window.marble pointing at the live game, for the console and tests. */
function exposeForTools(game: Game | null, app: App): void {
  const w = window as unknown as { marble?: Game | null; marbleApp?: App };
  w.marble = game;
  w.marbleApp = app;
}
