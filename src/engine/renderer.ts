/**
 * Canvas 2D renderer.
 *
 * The game renders at a fixed internal resolution and is letterboxed with an
 * integer scale factor so procedural pixel art stays crisp.
 */
export const VIEW_W = 1024;
export const VIEW_H = 700;

export class Renderer {
  readonly ctx: CanvasRenderingContext2D;
  scale = 1;
  private observer: ResizeObserver | null = null;

  constructor(readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('canvas 2d context unavailable');
    this.ctx = ctx;
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    this.resize();
    window.addEventListener('resize', this.resize);

    // Size to the containing element rather than the window, so the game can
    // be embedded in a page that has its own chrome around it.
    const host = canvas.parentElement;
    if (host && typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(this.resize);
      this.observer.observe(host);
    }
  }

  destroy(): void {
    window.removeEventListener('resize', this.resize);
    this.observer?.disconnect();
    this.observer = null;
  }

  private resize = (): void => {
    const host = this.canvas.parentElement;
    const availW = host?.clientWidth || window.innerWidth;
    const availH = host?.clientHeight || window.innerHeight;
    // Prefer whole-number scaling; fall back to fractional on small screens.
    const raw = Math.min(availW / VIEW_W, availH / VIEW_H);
    this.scale = raw >= 1 ? Math.floor(raw * 20) / 20 : Math.max(0.2, raw);
    this.canvas.style.width = `${Math.floor(VIEW_W * this.scale)}px`;
    this.canvas.style.height = `${Math.floor(VIEW_H * this.scale)}px`;
  };

  clear(color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  /** Convert a client-space pointer position into internal view coordinates. */
  toViewSpace(clientX: number, clientY: number): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) / this.scale,
      y: (clientY - r.top) / this.scale,
    };
  }
}

/** Rounded rectangle path — used constantly by the UI. */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** Text with a 1px outline so it stays readable over any background. */
export function outlinedText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  fill = '#ffffff', outline = 'rgba(0,0,0,0.85)', width = 3,
): void {
  ctx.lineWidth = width;
  ctx.strokeStyle = outline;
  ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}
