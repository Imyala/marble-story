/**
 * Fixed-timestep game loop with an accumulator.
 *
 * Physics runs at a locked 60 Hz so jump arcs and foothold landings are
 * frame-rate independent and reproducible; rendering runs as fast as the
 * display allows and receives an interpolation alpha.
 */
export const TICK_HZ = 60;
export const TICK_DT = 1 / TICK_HZ;

/** Never simulate more than this many ticks in one frame (spiral-of-death guard). */
const MAX_TICKS_PER_FRAME = 5;

export interface LoopCallbacks {
  update(dt: number): void;
  render(alpha: number, frameDt: number): void;
}

export class GameLoop {
  private accumulator = 0;
  private lastTime = 0;
  private rafId = 0;
  private running = false;

  /** Wall-clock seconds of simulated time since start. */
  elapsed = 0;
  /** Smoothed frames-per-second for the debug overlay. */
  fps = 0;

  constructor(private cb: LoopCallbacks) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.frame);

    let frameDt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // A tab that was backgrounded returns a huge dt; clamp rather than
    // fast-forwarding the whole simulation.
    if (frameDt > 0.25) frameDt = 0.25;
    this.fps += (1 / Math.max(frameDt, 1e-4) - this.fps) * 0.1;

    this.accumulator += frameDt;
    let ticks = 0;
    while (this.accumulator >= TICK_DT && ticks < MAX_TICKS_PER_FRAME) {
      this.cb.update(TICK_DT);
      this.elapsed += TICK_DT;
      this.accumulator -= TICK_DT;
      ticks++;
    }
    if (ticks === MAX_TICKS_PER_FRAME) this.accumulator = 0;

    this.cb.render(this.accumulator / TICK_DT, frameDt);
  };
}
