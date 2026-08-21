/**
 * Keyboard input with edge detection and rebindable actions.
 *
 * The default bindings mirror the genre convention: arrows to move,
 * Alt to jump, Ctrl to attack, Z to loot.
 */
export type GameAction =
  | 'left' | 'right' | 'up' | 'down'
  | 'jump' | 'attack' | 'pickup'
  | 'skill1' | 'skill2' | 'skill3' | 'skill4'
  | 'skill5' | 'skill6' | 'skill7' | 'skill8'
  | 'potionHp' | 'potionMp'
  | 'uiInventory' | 'uiStats' | 'uiSkills' | 'uiQuests' | 'uiEquip'
  | 'uiMinimap' | 'uiHelp' | 'uiClose' | 'uiDebug'
  | 'confirm';

export const DEFAULT_BINDINGS: Record<GameAction, string[]> = {
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  jump: ['AltLeft', 'AltRight', 'Space'],
  attack: ['ControlLeft', 'ControlRight'],
  pickup: ['KeyZ'],
  skill1: ['Digit1'],
  skill2: ['Digit2'],
  skill3: ['Digit3'],
  skill4: ['Digit4'],
  skill5: ['Digit5'],
  skill6: ['Digit6'],
  skill7: ['Digit7'],
  skill8: ['Digit8'],
  potionHp: ['KeyX'],
  potionMp: ['KeyC'],
  uiInventory: ['KeyI'],
  uiStats: ['KeyA'],
  uiSkills: ['KeyS'],
  uiQuests: ['KeyQ'],
  uiEquip: ['KeyE'],
  uiMinimap: ['KeyM'],
  uiHelp: ['F1', 'Slash'],
  uiClose: ['Escape'],
  uiDebug: ['F3', 'Backquote'],
  confirm: ['Enter', 'Space'],
};

/** Keys we always swallow so the browser doesn't scroll or open menus. */
const SWALLOW = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space',
  'AltLeft', 'AltRight', 'ControlLeft', 'ControlRight', 'F1', 'F3', 'Slash', 'Tab',
]);

export class Input {
  private bindings: Record<GameAction, string[]> = structuredClone(DEFAULT_BINDINGS);
  private codeToActions = new Map<string, GameAction[]>();

  private held = new Set<GameAction>();
  private pressedThisTick = new Set<GameAction>();
  private releasedThisTick = new Set<GameAction>();
  /** Buffered presses survive one tick so a fast tap is never dropped. */
  private buffered = new Set<GameAction>();

  /** When true (a text field has focus) all game input is ignored. */
  enabled = true;

  constructor(private target: EventTarget = window) {
    this.rebuild();
    this.target.addEventListener('keydown', this.onKeyDown as EventListener);
    this.target.addEventListener('keyup', this.onKeyUp as EventListener);
    window.addEventListener('blur', this.onBlur);
  }

  destroy(): void {
    this.target.removeEventListener('keydown', this.onKeyDown as EventListener);
    this.target.removeEventListener('keyup', this.onKeyUp as EventListener);
    window.removeEventListener('blur', this.onBlur);
  }

  private rebuild(): void {
    this.codeToActions.clear();
    for (const action of Object.keys(this.bindings) as GameAction[]) {
      for (const code of this.bindings[action]) {
        const list = this.codeToActions.get(code) ?? [];
        list.push(action);
        this.codeToActions.set(code, list);
      }
    }
  }

  rebind(action: GameAction, codes: string[]): void {
    this.bindings[action] = codes;
    this.rebuild();
  }

  getBindings(): Readonly<Record<GameAction, string[]>> {
    return this.bindings;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (SWALLOW.has(e.code)) e.preventDefault();
    if (!this.enabled || e.repeat) return;
    const actions = this.codeToActions.get(e.code);
    if (!actions) return;
    for (const a of actions) {
      if (!this.held.has(a)) {
        this.held.add(a);
        this.pressedThisTick.add(a);
        this.buffered.add(a);
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const actions = this.codeToActions.get(e.code);
    if (!actions) return;
    for (const a of actions) {
      if (this.held.delete(a)) this.releasedThisTick.add(a);
    }
  };

  /** Losing focus must clear held keys or the character walks forever. */
  private onBlur = (): void => {
    for (const a of this.held) this.releasedThisTick.add(a);
    this.held.clear();
  };

  down(action: GameAction): boolean {
    return this.enabled && this.held.has(action);
  }

  pressed(action: GameAction): boolean {
    return this.enabled && (this.pressedThisTick.has(action) || this.buffered.has(action));
  }

  released(action: GameAction): boolean {
    return this.enabled && this.releasedThisTick.has(action);
  }

  /** Consume a buffered press so it can't trigger twice. */
  consume(action: GameAction): void {
    this.pressedThisTick.delete(action);
    this.buffered.delete(action);
  }

  /** -1, 0, or 1 from the horizontal keys. */
  moveAxis(): number {
    const l = this.down('left') ? 1 : 0;
    const r = this.down('right') ? 1 : 0;
    return r - l;
  }

  verticalAxis(): number {
    const u = this.down('up') ? 1 : 0;
    const d = this.down('down') ? 1 : 0;
    return d - u;
  }

  /** Call at the end of every simulation tick. */
  endTick(): void {
    this.pressedThisTick.clear();
    this.releasedThisTick.clear();
    this.buffered.clear();
  }
}
