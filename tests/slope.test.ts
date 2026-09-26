import { describe, expect, it } from 'vitest';
import { Body, CollisionWorld, Heightfield } from '../src/world/collision';

/** Terrain that is a function of x only: a floor, a slope, whatever `h` says. */
function world(h: (x: number) => number): CollisionWorld {
  const w = new CollisionWorld();
  w.terrain = Heightfield.fromFunction(-20, -20, 60, 40, 0.5, (x) => h(x));
  return w;
}

/** The dragon's body, sliding off too-steep landings or not. */
function dragon(slide: boolean, x: number, y: number): Body {
  const b = new Body(0.48, 1.25);
  b.slideSteep = slide;
  b.setPos(x, y, 0);
  return b;
}

/**
 * Runs at +x into the slope and jumps whenever it can (jump-spam), for
 * `secs`. Returns the highest point stood on and reached.
 */
function jumpSpam(w: CollisionWorld, b: Body, secs: number): { stood: number; top: number } {
  const dt = 1 / 60;
  let stood = b.y;
  let top = b.y;
  for (let t = 0; t < secs; t += dt) {
    if (b.grounded) {
      stood = Math.max(stood, b.y);
      b.vy = 11.5;
      b.grounded = false;
    }
    // Air steering toward the wall, as the dragon does with the stick held.
    b.vx += Math.max(-30 * dt, Math.min(30 * dt, 8.4 - b.vx));
    b.vy -= 32 * dt;
    w.move(b, dt);
    top = Math.max(top, b.y);
  }
  return { stood, top };
}

/** A floor at 0, then a face rising at `slope` from x = 5 to height `height`, flat beyond. */
const cliff = (slope: number, height: number) => (x: number) => Math.min(height, Math.max(0, (x - 5) * slope));

describe('too-steep landings', () => {
  it('jump-spam used to climb a slope too steep to walk; now it cannot', () => {
    const w = world(cliff(2.5, 20));
    const before = jumpSpam(w, dragon(false, 3, 0), 10);
    const after = jumpSpam(w, dragon(true, 3, 0), 10);
    expect(before.stood).toBeGreaterThan(8);
    expect(after.stood).toBeLessThan(0.5);
    // A jump's height, no more.
    expect(after.top).toBeLessThan(3);
  });

  it('a body landing on the face slides down to the foot of it', () => {
    const w = world(cliff(2.5, 20));
    const b = dragon(true, 8, 10);
    let steep = false;
    for (let t = 0; t < 3; t += 1 / 60) {
      b.vy -= 32 / 60;
      w.move(b, 1 / 60);
      steep ||= b.steep;
    }
    expect(steep).toBe(true);
    expect(b.grounded).toBe(true);
    expect(b.x).toBeLessThan(5.3);
    expect(b.y).toBeLessThan(0.8);
  });

  it('still stands on a slope gentle enough to walk', () => {
    const w = world((x) => x * 0.9);
    const b = dragon(true, 4, 8);
    for (let t = 0; t < 2; t += 1 / 60) {
      b.vy -= 32 / 60;
      w.move(b, 1 / 60);
    }
    expect(b.grounded).toBe(true);
    expect(b.x).toBeCloseTo(4, 3);
  });

  it('a jump that tops out just short of a ledge catches its lip; one well short slides back', () => {
    // A 3 m step with a steep face.
    const jumpAt = (x0: number, apex: number): Body => {
      const w = world(cliff(3, 3));
      const b = dragon(true, x0, 0);
      b.vy = Math.sqrt(2 * 32 * apex);
      for (let t = 0; t < 2; t += 1 / 60) {
        b.vx = 5;
        b.vy -= 32 / 60;
        w.move(b, 1 / 60);
      }
      // One more jump from wherever it stands gets up (or not).
      b.vy = 11.5;
      b.grounded = false;
      for (let t = 0; t < 1.5; t += 1 / 60) {
        b.vx = 5;
        b.vy -= 32 / 60;
        w.move(b, 1 / 60);
      }
      return b;
    };
    // Feet a quarter metre under the lip: it holds there, and the next jump is on top.
    const near = jumpAt(3.5, 2.9);
    expect(near.grounded).toBe(true);
    expect(near.y).toBeCloseTo(3, 2);
    expect(near.x).toBeGreaterThan(6);
    // A metre short: down the face to the floor (it used to stick there, halfway up).
    const far = jumpAt(2.5, 2.6);
    expect(far.y).toBeLessThan(2.6);
  });

  it('leaves bodies that do not ask for it alone', () => {
    const w = world(cliff(2.5, 20));
    const b = dragon(false, 8, 10);
    for (let t = 0; t < 1; t += 1 / 60) {
      b.vy -= 32 / 60;
      w.move(b, 1 / 60);
    }
    expect(b.grounded).toBe(true);
    expect(b.x).toBeCloseTo(8, 3);
  });
});
