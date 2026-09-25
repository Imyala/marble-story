import type { Game } from '../game/game';
import type { Action } from '../core/input';

/**
 * On-screen controls for phones and tablets. Nothing shows until the first
 * touch, so mouse, keyboard and gamepad players never see them. The left of
 * the screen is a floating joystick (it appears under the thumb), the right
 * drags the camera, and a gamepad-style cluster holds the moves.
 */

interface Btn { action: Action; label: string; cls: string }

const BUTTONS: Btn[] = [
  { action: 'jump', label: 'Jump', cls: 'b-jump' },
  { action: 'horn', label: 'Horn', cls: 'b-horn' },
  { action: 'tail', label: 'Tail', cls: 'b-tail' },
  { action: 'dodge', label: 'Dodge', cls: 'b-dodge' },
  { action: 'breath', label: 'Breath', cls: 'b-breath' },
  { action: 'burst', label: 'Burst', cls: 'b-burst' },
  { action: 'lock', label: 'Lock', cls: 's b-lock' },
  { action: 'dragonTime', label: 'Time', cls: 's b-time' },
  { action: 'fury', label: 'Fury', cls: 's b-fury' },
  { action: 'elemNext', label: 'Element', cls: 's b-elem' },
  { action: 'interact', label: 'Use', cls: 's b-use' },
  { action: 'hint', label: 'Flick', cls: 's b-hint' },
  { action: 'pause', label: '&#10074;&#10074;', cls: 's b-pause' },
];

const STICK_R = 58;

export class TouchControls {
  readonly root: HTMLDivElement;
  private stick: HTMLDivElement;
  private knob: HTMLDivElement;
  private stickId: number | null = null;
  private stickX = 0;
  private stickY = 0;
  private lookId: number | null = null;
  private lookX = 0;
  private lookY = 0;
  private enabled = false;

  constructor(private game: Game, parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'touch-layer';
    this.root.style.display = 'none';
    this.stick = document.createElement('div');
    this.stick.className = 'touch-stick';
    this.knob = document.createElement('div');
    this.knob.className = 'touch-knob';
    this.stick.append(this.knob);
    this.root.append(this.stick);
    for (const b of BUTTONS) this.root.append(this.button(b));
    parent.appendChild(this.root);

    window.addEventListener('touchstart', () => this.enable(), { once: true, passive: true });
    const opt = { passive: false } as const;
    this.root.addEventListener('touchstart', (e) => this.onStart(e), opt);
    this.root.addEventListener('touchmove', (e) => this.onMove(e), opt);
    this.root.addEventListener('touchend', (e) => this.onEnd(e), opt);
    this.root.addEventListener('touchcancel', (e) => this.onEnd(e), opt);
  }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    this.game.input.usingTouch = true;
    document.getElementById('game-root')?.classList.add('touch-on');
  }

  private button(b: Btn): HTMLElement {
    const el = document.createElement('div');
    el.className = `touch-btn ${b.cls}`;
    el.innerHTML = `<span>${b.label}</span>`;
    const inp = this.game.input;
    let id: number | null = null;
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (id !== null) return;
      id = e.changedTouches[0]!.identifier;
      el.classList.add('on');
      inp.touchPress(b.action);
      if (b.action === 'jump') inp.touchPress('confirm');
    }, { passive: false });
    const up = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier !== id) continue;
        e.preventDefault();
        e.stopPropagation();
        id = null;
        el.classList.remove('on');
        inp.touchRelease(b.action);
        if (b.action === 'jump') inp.touchRelease('confirm');
      }
    };
    el.addEventListener('touchend', up, { passive: false });
    el.addEventListener('touchcancel', up, { passive: false });
    return el;
  }

  private onStart(e: TouchEvent): void {
    e.preventDefault();
    for (const t of Array.from(e.changedTouches)) {
      if (t.clientX < window.innerWidth * 0.42 && this.stickId === null) {
        this.stickId = t.identifier;
        this.stickX = t.clientX;
        this.stickY = t.clientY;
        this.stick.style.left = `${t.clientX}px`;
        this.stick.style.top = `${t.clientY}px`;
        this.stick.classList.add('on');
        this.knob.style.transform = 'translate(-50%, -50%)';
        this.game.input.touchMove = { x: 0, y: 0 };
      } else if (this.lookId === null) {
        this.lookId = t.identifier;
        this.lookX = t.clientX;
        this.lookY = t.clientY;
      }
    }
  }

  private onMove(e: TouchEvent): void {
    e.preventDefault();
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this.stickId) {
        let dx = t.clientX - this.stickX;
        let dy = t.clientY - this.stickY;
        const d = Math.hypot(dx, dy);
        // Dragging past the rim pulls the stick along, so it never runs out.
        if (d > STICK_R * 1.4) {
          const k = (d - STICK_R * 1.4) / d;
          this.stickX += dx * k;
          this.stickY += dy * k;
          this.stick.style.left = `${this.stickX}px`;
          this.stick.style.top = `${this.stickY}px`;
          dx = t.clientX - this.stickX;
          dy = t.clientY - this.stickY;
        }
        const m = Math.min(1, Math.hypot(dx, dy) / STICK_R);
        const a = Math.atan2(dy, dx);
        const kx = Math.cos(a) * m;
        const ky = Math.sin(a) * m;
        this.knob.style.transform = `translate(calc(-50% + ${kx * STICK_R}px), calc(-50% + ${ky * STICK_R}px))`;
        // A small dead zone, then full speed comes quickly.
        const s = m < 0.12 ? 0 : Math.min(1, (m - 0.12) / 0.7);
        this.game.input.touchMove = { x: Math.cos(a) * s, y: -Math.sin(a) * s };
      } else if (t.identifier === this.lookId) {
        this.game.input.touchLook(t.clientX - this.lookX, t.clientY - this.lookY);
        this.lookX = t.clientX;
        this.lookY = t.clientY;
      }
    }
  }

  private onEnd(e: TouchEvent): void {
    e.preventDefault();
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this.stickId) {
        this.stickId = null;
        this.stick.classList.remove('on');
        this.game.input.touchMove = null;
      } else if (t.identifier === this.lookId) this.lookId = null;
    }
  }

  /** Shown only while actually playing; menus and dialogue take plain taps. */
  update(): void {
    const show = this.enabled && this.game.state === 'play';
    this.root.style.display = show ? '' : 'none';
    if (!show && this.stickId !== null) {
      this.stickId = null;
      this.stick.classList.remove('on');
      this.game.input.touchMove = null;
    }
  }
}
