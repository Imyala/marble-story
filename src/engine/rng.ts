/**
 * Seedable PRNG. Every random decision in the game (damage rolls, drop rolls,
 * mob AI, equipment stat variance) pulls from one of these so combat math is
 * deterministic under test.
 */
export class Rng {
  private s: number;

  constructor(seed = 0x2f6e2b1) {
    this.s = seed >>> 0 || 1;
  }

  /** mulberry32 — small, fast, good enough distribution for a game. */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Uniform integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** True with probability p (0..1). */
  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** +/- spread around 1.0, e.g. variance(0.1) -> [0.9, 1.1) */
  variance(spread: number): number {
    return 1 + this.range(-spread, spread);
  }

  sign(): 1 | -1 {
    return this.next() < 0.5 ? -1 : 1;
  }
}

/** Shared game-wide RNG. Tests construct their own with a fixed seed. */
export const rng = new Rng((Math.random() * 0xffffffff) >>> 0);
