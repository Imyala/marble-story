import { describe, expect, it } from 'vitest';
import { Body, CollisionWorld, Heightfield, HOLE, makeBox, makeCyl, makeRamp } from '../src/world/collision';

function step(w: CollisionWorld, b: Body, seconds: number, gravity = 30): void {
  const dt = 1 / 60;
  for (let t = 0; t < seconds; t += dt) {
    b.vy -= gravity * dt;
    w.move(b, dt);
  }
}

describe('heightfield', () => {
  it('interpolates across the same triangles the mesh draws', () => {
    // A single cell: corners 0, 0, 0 and 4 at (1,1).
    const hf = new Heightfield(0, 0, 1, 2, 2, new Float32Array([0, 0, 0, 4]));
    expect(hf.at(0, 0)).toBeCloseTo(0);
    expect(hf.at(0.25, 0.25)).toBeCloseTo(0); // lower-left triangle is flat
    expect(hf.at(0.9, 0.9)).toBeCloseTo(4 * 0.8, 5); // upper-right rises toward the 4
  });

  it('reports holes and out-of-range as -Infinity', () => {
    const hf = new Heightfield(0, 0, 1, 2, 2, new Float32Array([HOLE, 0, 0, 0]));
    expect(hf.at(0.1, 0.1)).toBe(-Infinity);
    expect(hf.at(-5, 0)).toBe(-Infinity);
  });
});

describe('actor collision', () => {
  it('lands on flat terrain and stays grounded', () => {
    const w = new CollisionWorld();
    w.terrain = Heightfield.fromFunction(-10, -10, 20, 20, 1, () => 2);
    const b = new Body(0.5, 1.2);
    b.setPos(0, 6, 0);
    step(w, b, 2);
    expect(b.grounded).toBe(true);
    expect(b.y).toBeCloseTo(2, 3);
  });

  it('stands on a box top and is pushed out of its sides', () => {
    const w = new CollisionWorld();
    w.add(makeBox(0, 0, 2, 2, 0, 1));
    const b = new Body(0.5, 1.2);
    b.setPos(0, 3, 0);
    step(w, b, 1.5);
    expect(b.y).toBeCloseTo(1, 3);
    expect(b.ground).not.toBeNull();

    // Walk into the side of a tall wall: the body stops at radius distance.
    const w2 = new CollisionWorld();
    w2.add(makeBox(3, 0, 1, 5, -1, 4));
    const c = new Body(0.5, 1.2);
    c.setPos(0, 0, 0);
    w2.terrain = Heightfield.fromFunction(-10, -10, 20, 20, 1, () => 0);
    for (let i = 0; i < 120; i++) {
      c.vx = 8;
      c.vy -= 0.5;
      w2.move(c, 1 / 60);
    }
    expect(c.x).toBeLessThanOrEqual(2 - 0.5 + 1e-6);
    expect(c.hitWall).toBe(true);
  });

  it('steps up small ledges', () => {
    const w = new CollisionWorld();
    w.terrain = Heightfield.fromFunction(-10, -10, 20, 20, 1, () => 0);
    w.add(makeBox(3, 0, 1, 3, 0, 0.3));
    const b = new Body(0.5, 1.2);
    b.setPos(0, 0, 0);
    b.grounded = true;
    // 30 steps at 6 m/s ends at x = 3, on top of the ledge.
    for (let i = 0; i < 30; i++) {
      b.vx = 6;
      b.vy -= 0.5;
      w.move(b, 1 / 60);
    }
    expect(b.y).toBeCloseTo(0.3, 2);
  });

  it('walks up a ramp', () => {
    const w = new CollisionWorld();
    w.terrain = Heightfield.fromFunction(-20, -20, 40, 40, 1, () => 0);
    // Rises from y 0 at z -5 to y 2.5 at z +5.
    w.add(makeRamp(0, 0, 2, 5, -1, 0, 2.5));
    const b = new Body(0.5, 1.2);
    b.setPos(0, 0, -7);
    b.grounded = true;
    // 115 steps at 6 m/s ends near the top end at z = 4.5.
    for (let i = 0; i < 115; i++) {
      b.vz = 6;
      b.vy -= 0.5;
      w.move(b, 1 / 60);
    }
    expect(b.z).toBeGreaterThan(4);
    expect(b.y).toBeGreaterThan(2);
    expect(b.ground?.shape).toBe('ramp');
  });

  it('carries a body standing on a moving platform', () => {
    const w = new CollisionWorld();
    const p = makeBox(0, 0, 2, 2, -0.5, 0);
    p.dynamic = true;
    w.add(p);
    const b = new Body(0.5, 1.2);
    b.setPos(0, 0.5, 0);
    step(w, b, 0.5);
    expect(b.grounded).toBe(true);
    for (let i = 0; i < 30; i++) {
      p.x += 0.05;
      p.dx = 0.05;
      w.carry(b);
      b.vy -= 0.5;
      w.move(b, 1 / 60);
    }
    expect(b.x).toBeCloseTo(1.5, 2);
  });

  it('raycasts against boxes, cylinders and terrain', () => {
    const w = new CollisionWorld();
    w.add(makeBox(5, 0, 1, 1, 0, 2));
    w.add(makeCyl(0, 5, 1, 0, 3));
    expect(w.raycast(0, 1, 0, 1, 0, 0, 20).t).toBeCloseTo(4, 5);
    expect(w.raycast(0, 1, 0, 0, 0, 1, 20).t).toBeCloseTo(4, 5);
    w.terrain = Heightfield.fromFunction(-20, -20, 40, 40, 1, () => 0);
    expect(w.raycast(-10, 5, -10, 0, -1, 0, 20).t).toBeCloseTo(5, 1);
  });
});
