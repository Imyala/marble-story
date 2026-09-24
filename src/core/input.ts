/**
 * Input: keyboard, mouse (with pointer lock) and gamepad, folded into named
 * actions. Gameplay code never looks at raw keys.
 *
 * Presses are buffered with a timestamp so combat can read "was Horn pressed
 * in the last 150 ms" and consume it. That buffer is what makes combo input
 * feel responsive instead of demanding frame-perfect timing.
 */

export type Action =
  | 'jump' | 'horn' | 'tail' | 'breath' | 'burst' | 'fury' | 'dodge'
  | 'dragonTime' | 'interact' | 'lock' | 'pause' | 'elemNext' | 'elemPrev'
  | 'elem1' | 'elem2' | 'elem3' | 'elem4' | 'confirm' | 'back'
  | 'up' | 'down' | 'left' | 'right';

const KEY_BINDINGS: Record<string, Action[]> = {
  Space: ['jump', 'confirm'],
  KeyE: ['tail'],
  KeyQ: ['burst'],
  KeyX: ['fury'],
  ShiftLeft: ['dodge'],
  ShiftRight: ['dodge'],
  KeyC: ['dragonTime'],
  KeyF: ['interact'],
  Tab: ['lock'],
  Escape: ['pause', 'back'],
  KeyP: ['pause'],
  Digit1: ['elem1'],
  Digit2: ['elem2'],
  Digit3: ['elem3'],
  Digit4: ['elem4'],
  Enter: ['confirm'],
  NumpadEnter: ['confirm'],
  ArrowUp: ['up'],
  ArrowDown: ['down'],
  ArrowLeft: ['left'],
  ArrowRight: ['right'],
  KeyW: ['up'],
  KeyS: ['down'],
  KeyA: ['left'],
  KeyD: ['right'],
  // Keyboard-only fallbacks for players without a mouse.
  KeyJ: ['horn'],
  KeyK: ['breath'],
  KeyL: ['tail'],
  KeyU: ['burst'],
  KeyI: ['lock'],
  KeyR: ['elemNext'],
};

const MOUSE_BINDINGS: Record<number, Action> = { 0: 'horn', 1: 'lock', 2: 'breath' };

// Standard gamepad layout indices.
const PAD_BINDINGS: Record<number, Action[]> = {
  0: ['jump', 'confirm'],
  1: ['dodge', 'back'],
  2: ['horn'],
  3: ['tail'],
  4: ['burst'],
  5: ['lock'],
  6: ['dragonTime'],
  7: ['breath'],
  8: ['fury'],
  9: ['pause'],
  10: ['interact'],
  11: ['lock'],
  12: ['elem1', 'up'],
  13: ['elem3', 'down'],
  14: ['elem4', 'left'],
  15: ['elem2', 'right'],
};

export class Input {
  /** Seconds since start, advanced by the game loop. */
  time = 0;
  moveX = 0;
  moveY = 0;
  lookX = 0;
  lookY = 0;
  wheel = 0;
  /** Raw horizontal look this frame (mouse pixels, or a scaled right stick), for flick gestures. */
  flickX = 0;
  usingPad = false;
  mouseSensitivity = 1;
  invertY = false;
  /** Overrides the movement axes; used by automated tests. */
  forceMove: { x: number; y: number } | null = null;
  /** Set by the game; while false the mouse moves freely over menus. */
  wantPointerLock = false;

  private held = new Set<Action>();
  private keysDown = new Set<string>();
  private mouseDown = new Set<number>();
  private padDown = new Set<number>();
  private pressAt = new Map<Action, number>();
  private consumedAt = new Map<Action, number>();
  private pressedThisFrame = new Set<Action>();
  private releasedThisFrame = new Set<Action>();
  private pendingPress = new Set<Action>();
  private pendingRelease = new Set<Action>();
  private mouseDX = 0;
  private mouseDY = 0;
  private wheelAcc = 0;
  private canvas: HTMLElement;

  constructor(canvas: HTMLElement) {
    this.canvas = canvas;
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      if (e.repeat) return;
      this.keysDown.add(e.code);
      for (const a of KEY_BINDINGS[e.code] ?? []) this.pendingPress.add(a);
      this.usingPad = false;
    });
    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
      for (const a of KEY_BINDINGS[e.code] ?? []) this.pendingRelease.add(a);
    });
    window.addEventListener('blur', () => {
      for (const a of this.held) this.pendingRelease.add(a);
      this.keysDown.clear();
      this.mouseDown.clear();
    });
    canvas.addEventListener('mousedown', (e) => {
      if (this.wantPointerLock && document.pointerLockElement !== canvas) {
        this.requestLock();
        return;
      }
      this.mouseDown.add(e.button);
      const a = MOUSE_BINDINGS[e.button];
      if (a) this.pendingPress.add(a);
      this.usingPad = false;
    });
    window.addEventListener('mouseup', (e) => {
      this.mouseDown.delete(e.button);
      const a = MOUSE_BINDINGS[e.button];
      if (a) this.pendingRelease.add(a);
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === canvas) {
        this.mouseDX += e.movementX;
        this.mouseDY += e.movementY;
      }
    });
    window.addEventListener(
      'wheel',
      (e) => {
        if (document.pointerLockElement === canvas) this.wheelAcc += Math.sign(e.deltaY);
      },
      { passive: true },
    );
  }

  requestLock(): void {
    const el = this.canvas as HTMLElement & { requestPointerLock?: () => Promise<void> | void };
    try {
      const r = el.requestPointerLock?.();
      if (r && typeof (r as Promise<void>).catch === 'function') (r as Promise<void>).catch(() => {});
    } catch {
      /* not allowed yet; the next click retries */
    }
  }

  releaseLock(): void {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  get locked(): boolean {
    return document.pointerLockElement === this.canvas;
  }

  /** Called once per rendered frame, before any game logic reads input. */
  update(dt: number): void {
    this.time += dt;
    this.pressedThisFrame.clear();
    this.releasedThisFrame.clear();

    const pad = this.pollPad();

    for (const a of this.pendingPress) {
      if (!this.held.has(a)) {
        this.held.add(a);
        this.pressedThisFrame.add(a);
        this.pressAt.set(a, this.time);
      }
    }
    this.pendingPress.clear();
    for (const a of this.pendingRelease) {
      if (!this.stillHeldBySomething(a)) {
        this.held.delete(a);
        this.releasedThisFrame.add(a);
      }
    }
    this.pendingRelease.clear();

    // Movement axes.
    let mx = 0;
    let my = 0;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) mx -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) mx += 1;
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) my += 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) my -= 1;
    if (pad && (Math.abs(pad.lx) > 0 || Math.abs(pad.ly) > 0)) {
      mx = pad.lx;
      my = -pad.ly;
    }
    if (this.forceMove) {
      mx = this.forceMove.x;
      my = this.forceMove.y;
    }
    const m = Math.hypot(mx, my);
    if (m > 1) {
      mx /= m;
      my /= m;
    }
    this.moveX = mx;
    this.moveY = my;

    this.flickX = this.mouseDX + (pad ? pad.rx * 30 : 0);
    const sens = 0.0024 * this.mouseSensitivity;
    this.lookX = this.mouseDX * sens;
    this.lookY = this.mouseDY * sens * (this.invertY ? -1 : 1);
    if (pad) {
      const ps = 2.6 * dt * this.mouseSensitivity;
      this.lookX += pad.rx * ps;
      this.lookY += pad.ry * ps * (this.invertY ? -1 : 1);
    }
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = this.wheelAcc;
    this.wheelAcc = 0;
  }

  private stillHeldBySomething(a: Action): boolean {
    for (const code of this.keysDown) if (KEY_BINDINGS[code]?.includes(a)) return true;
    for (const b of this.mouseDown) if (MOUSE_BINDINGS[b] === a) return true;
    for (const b of this.padDown) if (PAD_BINDINGS[b]?.includes(a)) return true;
    return false;
  }

  private pollPad(): { lx: number; ly: number; rx: number; ry: number } | null {
    const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
    let pad: Gamepad | null = null;
    for (const p of pads) if (p && p.connected) { pad = p; break; }
    if (!pad) return null;
    const dz = (v: number) => (Math.abs(v) < 0.18 ? 0 : (v - Math.sign(v) * 0.18) / 0.82);
    const now = new Set<number>();
    pad.buttons.forEach((b, i) => {
      if (b.pressed || b.value > 0.5) now.add(i);
    });
    for (const i of now) {
      if (!this.padDown.has(i)) {
        for (const a of PAD_BINDINGS[i] ?? []) this.pendingPress.add(a);
        this.usingPad = true;
      }
    }
    for (const i of this.padDown) {
      if (!now.has(i)) for (const a of PAD_BINDINGS[i] ?? []) this.pendingRelease.add(a);
    }
    this.padDown = now;
    // The pending sets are folded in by update() right after this returns.
    const axes = { lx: dz(pad.axes[0] ?? 0), ly: dz(pad.axes[1] ?? 0), rx: dz(pad.axes[2] ?? 0), ry: dz(pad.axes[3] ?? 0) };
    if (axes.lx || axes.ly || axes.rx || axes.ry) this.usingPad = true;
    return axes;
  }

  down(a: Action): boolean {
    return this.held.has(a);
  }

  pressed(a: Action): boolean {
    return this.pressedThisFrame.has(a);
  }

  released(a: Action): boolean {
    return this.releasedThisFrame.has(a);
  }

  /** How long the action has been held, or 0. */
  heldFor(a: Action): number {
    if (!this.held.has(a)) return 0;
    return this.time - (this.pressAt.get(a) ?? this.time);
  }

  /** True if pressed within `window` seconds and not yet consumed. */
  buffered(a: Action, window = 0.15): boolean {
    const t = this.pressAt.get(a);
    if (t === undefined) return false;
    if (this.time - t > window) return false;
    const c = this.consumedAt.get(a);
    return c === undefined || c < t;
  }

  consume(a: Action): void {
    this.consumedAt.set(a, this.time);
  }

  /** Buffered-and-consume in one call. */
  take(a: Action, window = 0.15): boolean {
    if (this.buffered(a, window)) {
      this.consume(a);
      return true;
    }
    return false;
  }

  clearBuffers(): void {
    this.pressAt.clear();
    this.consumedAt.clear();
  }

  /** Synthetic input for automated tests and the attract demo. */
  simulate(a: Action, down: boolean): void {
    if (down) this.pendingPress.add(a);
    else this.pendingRelease.add(a);
  }
}
