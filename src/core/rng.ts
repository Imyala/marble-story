/** Small seedable PRNG (mulberry32). Deterministic runs make bugs reproducible. */
export class Rng {
  private s: number;
  constructor(seed = Date.now() & 0xffffffff) {
    this.s = seed >>> 0;
  }
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(lo: number, hi: number): number {
    return lo + (hi - lo) * this.next();
  }
  int(lo: number, hiInclusive: number): number {
    return lo + Math.floor(this.next() * (hiInclusive - lo + 1));
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]!;
  }
  /** Uniform in [-1, 1]. */
  signed(): number {
    return this.next() * 2 - 1;
  }
}

export const rng = new Rng();

export function reseed(seed: number): void {
  (rng as unknown as { s: number }).s = seed >>> 0;
}
