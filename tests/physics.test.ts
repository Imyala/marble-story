import { describe, expect, it } from 'vitest';
import { FootholdBuilder, fhYAt } from '../src/physics/foothold';
import { createBody, stepBody, Terrain, MoveIntent } from '../src/physics/body';
import { TICK_DT } from '../src/engine/loop';

const bounds = { left: 0, top: -600, right: 2000, bottom: 800 };

function terrain(): Terrain {
  const b = new FootholdBuilder();
  // Flat ground, then a ramp up, then flat again, walled at both ends.
  b.chain([[0, 400], [400, 400], [600, 320], [1000, 320]], { wallLeft: true, wallRight: true });
  // A floating one-way platform above the flat section.
  b.platform(150, 350, 320);
  return { footholds: b.build(), ladders: [], bounds };
}

function intent(p: Partial<MoveIntent> = {}): MoveIntent {
  return { moveX: 0, moveY: 0, jump: false, ...p };
}

function run(body: ReturnType<typeof createBody>, t: Terrain, ticks: number, i: MoveIntent) {
  for (let n = 0; n < ticks; n++) stepBody(body, i, TICK_DT, t);
}

describe('foothold geometry', () => {
  it('interpolates y along a sloped segment', () => {
    const b = new FootholdBuilder();
    const [fh] = b.chain([[0, 100], [100, 0]]);
    expect(fhYAt(fh, 0)).toBe(100);
    expect(fhYAt(fh, 50)).toBe(50);
    expect(fhYAt(fh, 100)).toBe(0);
  });

  it('clamps y queries to the segment range', () => {
    const b = new FootholdBuilder();
    const [fh] = b.chain([[0, 100], [100, 0]]);
    expect(fhYAt(fh, -50)).toBe(100);
    expect(fhYAt(fh, 150)).toBe(0);
  });

  it('links a polyline into a prev/next chain', () => {
    const b = new FootholdBuilder();
    const fhs = b.chain([[0, 0], [10, 0], [20, 0]]);
    expect(fhs).toHaveLength(2);
    expect(fhs[0].next).toBe(fhs[1].id);
    expect(fhs[1].prev).toBe(fhs[0].id);
    expect(fhs[0].prev).toBe(0);
  });
});

describe('movement', () => {
  it('falls onto the ground and stands', () => {
    const t = terrain();
    const body = createBody({ x: 380, y: 100 });
    run(body, t, 60, intent());
    expect(body.state).toBe('stand');
    expect(body.y).toBeCloseTo(400, 1);
  });

  it('walks up a slope, following the surface', () => {
    const t = terrain();
    const body = createBody({ x: 380, y: 400 });
    run(body, t, 5, intent());
    run(body, t, 120, intent({ moveX: 1 }));
    expect(body.x).toBeGreaterThan(500);
    expect(body.y).toBeCloseTo(fhYAt(t.footholds.get(2)!, body.x), 1);
    expect(body.y).toBeLessThan(400); // climbed
  });

  it('is stopped by a wall at the end of a chain', () => {
    const t = terrain();
    const body = createBody({ x: 950, y: 320 });
    run(body, t, 5, intent());
    run(body, t, 200, intent({ moveX: 1 }));
    expect(body.x).toBeLessThanOrEqual(1000);
    expect(body.state).not.toBe('fall');
  });

  it('jumps and returns to the ground', () => {
    const t = terrain();
    const body = createBody({ x: 700, y: 320 });
    run(body, t, 5, intent());
    const groundY = body.y;
    stepBody(body, intent({ jump: true }), TICK_DT, t);
    expect(body.state).toBe('jump');
    let apex = body.y;
    for (let n = 0; n < 120; n++) {
      stepBody(body, intent(), TICK_DT, t);
      apex = Math.min(apex, body.y);
    }
    expect(groundY - apex).toBeGreaterThan(60); // cleared a meaningful height
    expect(body.state).toBe('stand');
    expect(body.y).toBeCloseTo(groundY, 1);
  });

  it('passes up through a one-way platform but lands on it coming down', () => {
    const t = terrain();
    const body = createBody({ x: 250, y: 400 });
    run(body, t, 5, intent());
    stepBody(body, intent({ jump: true }), TICK_DT, t);
    let wentAbove = false;
    for (let n = 0; n < 120; n++) {
      stepBody(body, intent(), TICK_DT, t);
      if (body.y < 320) wentAbove = true;
    }
    expect(wentAbove).toBe(true);
    expect(body.y).toBeCloseTo(320, 1); // landed on the platform, not the floor
  });

  it('drops through a platform with down+jump', () => {
    const t = terrain();
    const body = createBody({ x: 250, y: 300 });
    run(body, t, 30, intent());
    expect(body.y).toBeCloseTo(320, 1);
    stepBody(body, intent({ moveY: 1, jump: true }), TICK_DT, t);
    run(body, t, 60, intent());
    expect(body.y).toBeCloseTo(400, 1); // fell to the floor below
  });

  it('walks off the end of a chain into a fall', () => {
    const b = new FootholdBuilder();
    b.platform(0, 200, 300);
    b.platform(0, 600, 700);
    const t: Terrain = { footholds: b.build(), ladders: [], bounds };
    const body = createBody({ x: 150, y: 300 });
    run(body, t, 5, intent());
    run(body, t, 40, intent({ moveX: 1 }));
    expect(body.x).toBeGreaterThan(200);
    run(body, t, 90, intent());
    expect(body.y).toBeCloseTo(700, 1);
  });
});

describe('ladders', () => {
  it('grabs, climbs, and steps off at the top', () => {
    const b = new FootholdBuilder();
    b.platform(0, 600, 500);
    b.platform(200, 400, 300);
    const t: Terrain = {
      footholds: b.build(),
      ladders: [{ id: 1, x: 300, y1: 300, y2: 500, isLadder: true, layer: 0 }],
      bounds,
    };
    const body = createBody({ x: 300, y: 500 });
    run(body, t, 5, intent());
    expect(body.state).toBe('stand');

    stepBody(body, intent({ moveY: -1 }), TICK_DT, t);
    expect(body.state).toBe('climb');

    run(body, t, 200, intent({ moveY: -1 }));
    expect(body.state).toBe('stand');
    expect(body.y).toBeCloseTo(300, 1);
  });

  it('jumps off a ladder sideways', () => {
    const b = new FootholdBuilder();
    b.platform(0, 600, 500);
    const t: Terrain = {
      footholds: b.build(),
      ladders: [{ id: 1, x: 300, y1: 300, y2: 500, isLadder: true, layer: 0 }],
      bounds,
    };
    const body = createBody({ x: 300, y: 500 });
    run(body, t, 5, intent());
    stepBody(body, intent({ moveY: -1 }), TICK_DT, t);
    run(body, t, 40, intent({ moveY: -1 }));
    const yBefore = body.y;
    expect(yBefore).toBeLessThan(500);
    stepBody(body, intent({ moveX: -1, jump: true }), TICK_DT, t);
    expect(body.state).toBe('jump');
    expect(body.vx).toBeLessThan(0);
  });
});
