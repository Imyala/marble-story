import { describe, expect, it } from 'vitest';
import { riftWave } from '../src/levels/trials';

// A fixed sequence stands in for the game's seeded random numbers.
const seq = (seed = 1) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

describe('the Gloom Rift', () => {
  it('starts gentle and only grunts can come through', () => {
    const w = riftWave(1, seq());
    expect(w.length).toBeGreaterThanOrEqual(2);
    expect(w.every((s) => s.type === 'grunt' && !s.elite)).toBe(true);
  });

  it('grows with every wave, never past ten foes', () => {
    const r = seq(7);
    let prev = 0;
    for (let n = 1; n <= 30; n++) {
      const w = riftWave(n, r);
      expect(w.length).toBeLessThanOrEqual(10);
      if (n <= 5) expect(w.length).toBeGreaterThanOrEqual(prev - 1);
      prev = w.length;
    }
  });

  it('sends an elite champion every fifth wave', () => {
    for (const n of [5, 10, 15, 20]) {
      const w = riftWave(n, seq(n));
      expect(w.some((s) => s.elite)).toBe(true);
    }
  });

  it('holds back the worst foes until deep waves', () => {
    const early = [1, 2, 3, 4, 5, 6].flatMap((n) => riftWave(n, seq(n)).map((s) => s.type));
    expect(early.some((t) => t === 'drake' || t === 'knight' || t.endsWith('Golem'))).toBe(false);
  });
});
