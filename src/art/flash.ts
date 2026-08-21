/**
 * Hit-flash compositing.
 *
 * Tinting a sprite white means compositing only over the pixels that sprite
 * drew. `source-atop` does that — but only against an isolated surface. Applied
 * straight to the main canvas it tints everything already drawn underneath,
 * which shows up as a bright rectangle around the character.
 *
 * So when something is flashing we draw it into a scratch canvas, tint there,
 * and blit the result. Nothing flashing takes the fast path and draws directly.
 */

/** Scratch surface, large enough for the biggest boss sprite. */
const BUF_W = 320;
const BUF_H = 320;
/** Where the entity's origin (feet, centre) sits inside the scratch canvas. */
const ORIGIN_X = BUF_W / 2;
const ORIGIN_Y = BUF_H - 90;

let buffer: HTMLCanvasElement | null = null;
let bufferCtx: CanvasRenderingContext2D | null = null;

function scratch(): CanvasRenderingContext2D | null {
  if (bufferCtx) return bufferCtx;
  if (typeof document === 'undefined') return null;
  buffer = document.createElement('canvas');
  buffer.width = BUF_W;
  buffer.height = BUF_H;
  bufferCtx = buffer.getContext('2d');
  return bufferCtx;
}

/**
 * Draw an entity at (x, y), optionally tinted white by `flash` (0..1).
 *
 * `draw` receives a context whose origin is already at the entity's feet, so
 * it is identical in both paths.
 */
export function drawFlashed(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  flash: number,
  alpha: number,
  draw: (c: CanvasRenderingContext2D) => void,
): void {
  if (flash <= 0.01) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(x), Math.round(y));
    draw(ctx);
    ctx.restore();
    return;
  }

  const buf = scratch();
  if (!buf || !buffer) {
    // No DOM (tests, SSR): fall back to the untinted path rather than failing.
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(x), Math.round(y));
    draw(ctx);
    ctx.restore();
    return;
  }

  buf.clearRect(0, 0, BUF_W, BUF_H);
  buf.save();
  buf.translate(ORIGIN_X, ORIGIN_Y);
  draw(buf);
  buf.restore();

  // Tint only where the sprite actually painted.
  buf.save();
  buf.globalCompositeOperation = 'source-atop';
  buf.fillStyle = `rgba(255,255,255,${Math.min(1, flash) * 0.8})`;
  buf.fillRect(0, 0, BUF_W, BUF_H);
  buf.restore();

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(buffer, Math.round(x) - ORIGIN_X, Math.round(y) - ORIGIN_Y);
  ctx.restore();
}
