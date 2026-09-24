import { describe, expect, it } from 'vitest';
import { Shaper, segDist } from '../src/world/shaper';
import { HOLE } from '../src/world/collision';

describe('terrain shaper', () => {
  it('raises islands and blends their edges down', () => {
    const s = new Shaper().base(-2).island(0, 0, 10, 3, 4, 0);
    expect(s.height(0, 0)).toBeCloseTo(3);
    expect(s.height(20, 0)).toBeCloseTo(-2);
    const edge = s.height(12, 0);
    expect(edge).toBeLessThan(3);
    expect(edge).toBeGreaterThan(-2);
  });

  it('lays paths at their own height and paints a mask', () => {
    const s = new Shaper().base(0).path([[0, 0, 2], [10, 0, 4]], 4, 2);
    expect(s.height(5, 0)).toBeCloseTo(3);
    expect(s.pathMask(5, 0)).toBeGreaterThan(0.9);
    expect(s.pathMask(5, 20)).toBe(0);
  });

  it('void terrain only exists where features put it', () => {
    const s = new Shaper().void().island(0, 0, 5, 1, 2, 0);
    expect(s.height(0, 0)).toBeCloseTo(1);
    expect(s.height(30, 30)).toBe(HOLE);
  });

  it('measures distance to a polyline', () => {
    const r = segDist([[0, 0, 0], [10, 0, 10]], 5, 3);
    expect(r.d).toBeCloseTo(3);
    expect(r.y).toBeCloseTo(5);
  });
});
