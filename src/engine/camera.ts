import type { Rect } from '../physics/body';

/**
 * Follow camera with lag, clamped to the map's view bounds.
 *
 * The focus point sits slightly above the character's feet and above the
 * centre of the screen, because in a side-scroller you need to see more of
 * what is ahead and below you than above you.
 */
export class Camera {
  /** Top-left of the view in world space. */
  x = 0;
  y = 0;
  /** Screen shake, decays each tick. */
  private shake = 0;
  private shakeX = 0;
  private shakeY = 0;

  constructor(public viewW: number, public viewH: number) {}

  /** How far above the character's feet the camera focuses. */
  private static readonly FOCUS_LIFT = 60;
  /** Fraction of the screen height the focus sits at (0.5 = dead centre). */
  private static readonly FOCUS_Y = 0.56;

  snapTo(wx: number, wy: number, bounds: Rect): void {
    this.x = wx - this.viewW * 0.5;
    this.y = wy - Camera.FOCUS_LIFT - this.viewH * Camera.FOCUS_Y;
    this.clamp(bounds);
  }

  follow(wx: number, wy: number, bounds: Rect, dt: number): void {
    const tx = wx - this.viewW * 0.5;
    const ty = wy - Camera.FOCUS_LIFT - this.viewH * Camera.FOCUS_Y;
    // Frame-rate independent exponential smoothing.
    const k = 1 - Math.exp(-12 * dt);
    this.x += (tx - this.x) * k;
    this.y += (ty - this.y) * k;
    this.clamp(bounds);

    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 3);
      const mag = this.shake * 7;
      this.shakeX = (Math.random() * 2 - 1) * mag;
      this.shakeY = (Math.random() * 2 - 1) * mag;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  addShake(amount: number): void {
    this.shake = Math.min(1.4, this.shake + amount);
  }

  private clamp(b: Rect): void {
    const w = b.right - b.left;
    const h = b.bottom - b.top;
    // Maps narrower than the view are centred rather than clamped to a corner.
    this.x = w <= this.viewW
      ? b.left + (w - this.viewW) * 0.5
      : Math.max(b.left, Math.min(this.x, b.right - this.viewW));
    this.y = h <= this.viewH
      ? b.top + (h - this.viewH) * 0.5
      : Math.max(b.top, Math.min(this.y, b.bottom - this.viewH));
  }

  /** Camera offset for a parallax layer (1 = world speed, 0 = pinned). */
  offsetX(parallax = 1): number {
    return -(this.x * parallax) + this.shakeX;
  }

  offsetY(parallax = 1): number {
    return -(this.y * parallax) + this.shakeY;
  }

  screenX(worldX: number, parallax = 1): number {
    return worldX + this.offsetX(parallax);
  }

  screenY(worldY: number, parallax = 1): number {
    return worldY + this.offsetY(parallax);
  }

  /** Cull test in world space with a generous margin for large sprites. */
  isVisible(worldX: number, worldY: number, margin = 160): boolean {
    return (
      worldX > this.x - margin &&
      worldX < this.x + this.viewW + margin &&
      worldY > this.y - margin &&
      worldY < this.y + this.viewH + margin
    );
  }
}
