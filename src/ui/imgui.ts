/**
 * A very small immediate-mode UI toolkit for canvas.
 *
 * Windows are redrawn every frame from game state, so there is no retained
 * widget tree to keep in sync — a slot is whatever the inventory says it is
 * this frame. Hit-testing happens during drawing, which keeps layout and
 * interaction in one place.
 */
import { PAL, rgba, shade } from '../art/palette';
import { roundRect } from '../engine/renderer';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function rect(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h };
}

export function hit(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/** Mouse state for one frame, fed by the host page. */
export class UiInput {
  mx = -999;
  my = -999;
  /** True for exactly one frame after a left click. */
  clicked = false;
  rightClicked = false;
  doubleClicked = false;
  /** True while the left button is held. */
  down = false;
  wheel = 0;

  private pendingClick = false;
  private pendingRight = false;
  private pendingDouble = false;
  private pendingWheel = 0;

  press(): void {
    this.down = true;
    this.pendingClick = true;
  }

  release(): void {
    this.down = false;
  }

  rightPress(): void {
    this.pendingRight = true;
  }

  doublePress(): void {
    this.pendingDouble = true;
  }

  scroll(delta: number): void {
    this.pendingWheel += delta;
  }

  move(x: number, y: number): void {
    this.mx = x;
    this.my = y;
  }

  /** Call once at the start of each frame. */
  beginFrame(): void {
    this.clicked = this.pendingClick;
    this.rightClicked = this.pendingRight;
    this.doubleClicked = this.pendingDouble;
    this.wheel = this.pendingWheel;
    this.pendingClick = false;
    this.pendingRight = false;
    this.pendingDouble = false;
    this.pendingWheel = 0;
  }

  /** Prevent a click from being handled twice by overlapping widgets. */
  consume(): void {
    this.clicked = false;
    this.rightClicked = false;
    this.doubleClicked = false;
  }
}

/* ---------------------------------------------------------------- chrome -- */

export function panel(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  title?: string,
  opts: { alpha?: number } = {},
): void {
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, r.x + 3, r.y + 4, r.w, r.h, 8);
  ctx.fill();

  ctx.fillStyle = PAL.panel;
  roundRect(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fill();

  ctx.strokeStyle = PAL.border;
  ctx.lineWidth = 1;
  roundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 8);
  ctx.stroke();

  if (title) {
    ctx.fillStyle = PAL.panelLight;
    roundRect(ctx, r.x + 1, r.y + 1, r.w - 2, 30, 7);
    ctx.fill();
    ctx.fillStyle = PAL.panel;
    ctx.fillRect(r.x + 1, r.y + 26, r.w - 2, 6);
    ctx.strokeStyle = rgba(PAL.borderLit, 0.6);
    ctx.beginPath();
    ctx.moveTo(r.x + 1, r.y + 31.5);
    ctx.lineTo(r.x + r.w - 1, r.y + 31.5);
    ctx.stroke();

    ctx.fillStyle = PAL.text;
    ctx.font = '700 13px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(title.toUpperCase(), r.x + 14, r.y + 16);
  }
  ctx.restore();
}

/** Standard window close button, top-right. Returns true when clicked. */
export function closeButton(ctx: CanvasRenderingContext2D, ui: UiInput, r: Rect): boolean {
  const b = rect(r.x + r.w - 26, r.y + 8, 17, 17);
  const hovered = hit(b, ui.mx, ui.my);
  ctx.fillStyle = hovered ? PAL.hp : rgba(PAL.border, 0.9);
  roundRect(ctx, b.x, b.y, b.w, b.h, 4);
  ctx.fill();
  ctx.strokeStyle = hovered ? '#ffffff' : PAL.textDim;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(b.x + 5, b.y + 5);
  ctx.lineTo(b.x + b.w - 5, b.y + b.h - 5);
  ctx.moveTo(b.x + b.w - 5, b.y + 5);
  ctx.lineTo(b.x + 5, b.y + b.h - 5);
  ctx.stroke();
  if (hovered && ui.clicked) {
    ui.consume();
    return true;
  }
  return false;
}

export interface ButtonOptions {
  disabled?: boolean;
  tone?: 'default' | 'primary' | 'danger' | 'ghost';
  font?: string;
  align?: CanvasTextAlign;
}

export function button(
  ctx: CanvasRenderingContext2D,
  ui: UiInput,
  r: Rect,
  label: string,
  opts: ButtonOptions = {},
): boolean {
  const disabled = opts.disabled ?? false;
  const hovered = !disabled && hit(r, ui.mx, ui.my);
  const tone = opts.tone ?? 'default';

  const base =
    tone === 'primary' ? '#2f5f8a' :
    tone === 'danger' ? '#6b2b30' :
    tone === 'ghost' ? 'rgba(30,39,64,0.45)' : PAL.panelLight;

  ctx.fillStyle = disabled ? rgba(PAL.panelLight, 0.45) : hovered ? shade(base.startsWith('rgba') ? PAL.panelLight : base, 0.18) : base;
  roundRect(ctx, r.x, r.y, r.w, r.h, 5);
  ctx.fill();

  ctx.strokeStyle = disabled ? rgba(PAL.border, 0.5) : hovered ? PAL.borderLit : PAL.border;
  ctx.lineWidth = 1;
  roundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 5);
  ctx.stroke();

  ctx.fillStyle = disabled ? rgba(PAL.textDim, 0.55) : PAL.text;
  ctx.font = opts.font ?? '600 12px ui-monospace, monospace';
  ctx.textAlign = opts.align ?? 'center';
  ctx.textBaseline = 'middle';
  const tx = opts.align === 'left' ? r.x + 10 : r.x + r.w / 2;
  ctx.fillText(label, tx, r.y + r.h / 2);

  if (hovered && ui.clicked) {
    ui.consume();
    return true;
  }
  return false;
}

/** A small square +/- style button used by the stat window. */
export function tinyButton(
  ctx: CanvasRenderingContext2D, ui: UiInput, r: Rect, glyph: string, disabled = false,
): boolean {
  const hovered = !disabled && hit(r, ui.mx, ui.my);
  ctx.fillStyle = disabled ? rgba(PAL.panelLight, 0.4) : hovered ? '#3f6b8a' : PAL.panelLight;
  roundRect(ctx, r.x, r.y, r.w, r.h, 4);
  ctx.fill();
  ctx.strokeStyle = disabled ? rgba(PAL.border, 0.4) : PAL.border;
  ctx.lineWidth = 1;
  roundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 4);
  ctx.stroke();
  ctx.fillStyle = disabled ? rgba(PAL.textDim, 0.5) : PAL.text;
  ctx.font = '700 13px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, r.x + r.w / 2, r.y + r.h / 2 + 0.5);
  if (hovered && ui.clicked) {
    ui.consume();
    return true;
  }
  return false;
}

/* ------------------------------------------------------------------ bars -- */

export function bar(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  fraction: number,
  fill: string,
  back: string,
  label?: string,
): void {
  const f = Math.max(0, Math.min(1, fraction));
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, r.x - 1, r.y - 1, r.w + 2, r.h + 2, r.h / 2 + 1);
  ctx.fill();

  ctx.fillStyle = back;
  roundRect(ctx, r.x, r.y, r.w, r.h, r.h / 2);
  ctx.fill();

  if (f > 0) {
    ctx.save();
    roundRect(ctx, r.x, r.y, r.w, r.h, r.h / 2);
    ctx.clip();
    const grad = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    grad.addColorStop(0, shade(fill, 0.28));
    grad.addColorStop(0.5, fill);
    grad.addColorStop(1, shade(fill, -0.22));
    ctx.fillStyle = grad;
    ctx.fillRect(r.x, r.y, r.w * f, r.h);
    // A highlight along the top sells the glassy bar look.
    ctx.fillStyle = rgba('#ffffff', 0.22);
    ctx.fillRect(r.x, r.y + 1, r.w * f, Math.max(1, r.h * 0.32));
    ctx.restore();
  }

  if (label) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineJoin = 'round';
    ctx.strokeText(label, r.x + r.w / 2, r.y + r.h / 2 + 0.5);
    ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 0.5);
  }
}

/* ----------------------------------------------------------------- text -- */

export function text(
  ctx: CanvasRenderingContext2D,
  str: string, x: number, y: number,
  opts: { color?: string; font?: string; align?: CanvasTextAlign; baseline?: CanvasTextBaseline } = {},
): void {
  ctx.fillStyle = opts.color ?? PAL.text;
  ctx.font = opts.font ?? '12px ui-monospace, monospace';
  ctx.textAlign = opts.align ?? 'left';
  ctx.textBaseline = opts.baseline ?? 'alphabetic';
  ctx.fillText(str, x, y);
}

/** Word-wrap a string into lines, without drawing. */
export function wrapLines(
  ctx: CanvasRenderingContext2D,
  str: string, maxWidth: number, font = '12px ui-monospace, monospace',
): string[] {
  ctx.font = font;
  const out: string[] = [];
  for (const paragraph of str.split('\n')) {
    if (paragraph === '') {
      out.push('');
      continue;
    }
    let current = '';
    for (const word of paragraph.split(' ')) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        out.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) out.push(current);
  }
  return out;
}

/** Word-wrap into a fixed width, returning the number of lines drawn. */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  str: string, x: number, y: number, maxWidth: number, lineHeight: number,
  opts: { color?: string; font?: string } = {},
): number {
  const font = opts.font ?? '12px ui-monospace, monospace';
  const lines = wrapLines(ctx, str, maxWidth, font);
  ctx.fillStyle = opts.color ?? PAL.text;
  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  lines.forEach((line, i) => {
    if (line) ctx.fillText(line, x, y + i * lineHeight);
  });
  return lines.length;
}

/** A tooltip anchored near the cursor, kept inside the view. */
export function tooltip(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  lines: { text: string; color?: string; font?: string }[],
  viewW: number, viewH: number,
): void {
  ctx.save();
  let width = 0;
  for (const l of lines) {
    ctx.font = l.font ?? '12px ui-monospace, monospace';
    width = Math.max(width, ctx.measureText(l.text).width);
  }
  const w = width + 22;
  const h = lines.length * 16 + 18;
  const px = Math.min(x + 16, viewW - w - 8);
  const py = Math.min(Math.max(8, y - h - 8), viewH - h - 8);

  ctx.fillStyle = 'rgba(8,11,18,0.96)';
  roundRect(ctx, px, py, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = PAL.borderLit;
  ctx.lineWidth = 1;
  roundRect(ctx, px + 0.5, py + 0.5, w - 1, h - 1, 6);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  lines.forEach((l, i) => {
    ctx.fillStyle = l.color ?? PAL.text;
    ctx.font = l.font ?? '12px ui-monospace, monospace';
    ctx.fillText(l.text, px + 11, py + 22 + i * 16);
  });
  ctx.restore();
}
