/**
 * World collision for actors that are vertical cylinders (the dragon, every
 * enemy) against three kinds of static-or-moving solids plus an optional
 * terrain heightfield:
 *
 *   box   an oriented box, rotated about Y only
 *   ramp  a box whose top slopes along its local Z axis
 *   cyl   a vertical cylinder (pillars, round platforms, tree trunks)
 *
 * A solid is a wall to an actor when its top is above the actor's step
 * height; otherwise it is floor the actor can stand on or step onto. That one
 * rule is what makes ledges, stairs, ramps and platform edges behave the way a
 * platformer player expects without any per-case code.
 */

export type SolidShape = 'box' | 'cyl' | 'ramp';
export type Surface = 'grass' | 'stone' | 'wood' | 'ice' | 'metal' | 'mud' | 'crystal' | 'sand';

export const HOLE = -1e4;

let queryStamp = 1;

export class Solid {
  shape: SolidShape;
  x = 0;
  z = 0;
  /** Bottom of the solid. */
  y0 = 0;
  /** Top (box, cyl) or top at the local -Z end (ramp). */
  y1 = 1;
  /** Ramp only: top at the local +Z end. */
  y2 = 1;
  hx = 1;
  hz = 1;
  r = 1;
  yaw = 0;
  cos = 1;
  sin = 0;
  enabled = true;
  surface: Surface = 'stone';
  /** Moves every frame; lives outside the spatial grid. */
  dynamic = false;
  /** Displacement during the last step, used to carry standing actors. */
  dx = 0;
  dy = 0;
  dz = 0;
  dyaw = 0;
  /** Blocks actors but cannot be stood on (invisible level bounds). */
  wallOnly = false;
  /** Only the camera collides with it (tree canopies it should not sit inside). */
  cameraOnly = false;
  tag = '';
  /** Anything the owner wants to hang off the solid (breakables, platforms). */
  owner: unknown = null;
  /** Called while an actor is standing on it. */
  onStand: ((who: unknown) => void) | null = null;
  stamp = 0;

  constructor(shape: SolidShape) {
    this.shape = shape;
  }

  setYaw(yaw: number): void {
    this.yaw = yaw;
    this.cos = Math.cos(yaw);
    this.sin = Math.sin(yaw);
  }

  get top(): number {
    return this.shape === 'ramp' ? Math.max(this.y1, this.y2) : this.y1;
  }

  /** Radius of a circle enclosing the footprint, for broadphase. */
  get boundR(): number {
    return this.shape === 'cyl' ? this.r : Math.hypot(this.hx, this.hz);
  }

  /** World XZ -> local XZ (for box and ramp). */
  toLocalX(px: number, pz: number): number {
    const dx = px - this.x;
    const dz = pz - this.z;
    return dx * this.cos - dz * this.sin;
  }
  toLocalZ(px: number, pz: number): number {
    const dx = px - this.x;
    const dz = pz - this.z;
    return dx * this.sin + dz * this.cos;
  }

  /** Height of the top surface at a local Z (only varies for ramps). */
  topAtLocal(lz: number): number {
    if (this.shape !== 'ramp') return this.y1;
    const t = Math.min(1, Math.max(0, (lz + this.hz) / (2 * this.hz)));
    return this.y1 + (this.y2 - this.y1) * t;
  }

  /** Top surface height at the footprint point closest to (px, pz). */
  topNear(px: number, pz: number): number {
    if (this.shape !== 'ramp') return this.y1;
    return this.topAtLocal(this.toLocalZ(px, pz));
  }

  /** Distance from (px, pz) to the footprint (0 if inside). */
  footprintDist(px: number, pz: number): number {
    if (this.shape === 'cyl') {
      return Math.max(0, Math.hypot(px - this.x, pz - this.z) - this.r);
    }
    const lx = this.toLocalX(px, pz);
    const lz = this.toLocalZ(px, pz);
    const ox = Math.max(0, Math.abs(lx) - this.hx);
    const oz = Math.max(0, Math.abs(lz) - this.hz);
    return Math.hypot(ox, oz);
  }
}

export class Heightfield {
  readonly x0: number;
  readonly z0: number;
  readonly cell: number;
  /** Vertex counts along X and Z. */
  readonly nx: number;
  readonly nz: number;
  readonly h: Float32Array;

  constructor(x0: number, z0: number, cell: number, nx: number, nz: number, h: Float32Array) {
    this.x0 = x0;
    this.z0 = z0;
    this.cell = cell;
    this.nx = nx;
    this.nz = nz;
    this.h = h;
  }

  static fromFunction(
    x0: number, z0: number, sizeX: number, sizeZ: number, cell: number,
    fn: (x: number, z: number) => number,
  ): Heightfield {
    const nx = Math.round(sizeX / cell) + 1;
    const nz = Math.round(sizeZ / cell) + 1;
    const h = new Float32Array(nx * nz);
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) h[j * nx + i] = fn(x0 + i * cell, z0 + j * cell);
    }
    return new Heightfield(x0, z0, cell, nx, nz, h);
  }

  vertex(i: number, j: number): number {
    if (i < 0 || j < 0 || i >= this.nx || j >= this.nz) return HOLE;
    return this.h[j * this.nx + i]!;
  }

  /**
   * Height at (x, z), interpolated across the same two triangles per cell
   * that the terrain mesh draws, so what you see is what you stand on.
   * Returns -Infinity over holes and outside the field.
   */
  at(x: number, z: number): number {
    const fx = (x - this.x0) / this.cell;
    const fz = (z - this.z0) / this.cell;
    const i = Math.floor(fx);
    const j = Math.floor(fz);
    if (i < 0 || j < 0 || i >= this.nx - 1 || j >= this.nz - 1) return -Infinity;
    const u = fx - i;
    const v = fz - j;
    const h00 = this.vertex(i, j);
    const h10 = this.vertex(i + 1, j);
    const h01 = this.vertex(i, j + 1);
    const h11 = this.vertex(i + 1, j + 1);
    if (u + v <= 1) {
      if (h00 <= HOLE || h10 <= HOLE || h01 <= HOLE) return -Infinity;
      return h00 + (h10 - h00) * u + (h01 - h00) * v;
    }
    if (h11 <= HOLE || h10 <= HOLE || h01 <= HOLE) return -Infinity;
    return h11 + (h01 - h11) * (1 - u) + (h10 - h11) * (1 - v);
  }
}

/** A physical actor: feet position, velocity, cylinder size. */
export class Body {
  x = 0;
  y = 0;
  z = 0;
  vx = 0;
  vy = 0;
  vz = 0;
  radius: number;
  height: number;
  stepUp = 0.45;
  grounded = false;
  /** Solid being stood on, or null for terrain / air. */
  ground: Solid | null = null;
  groundY = -Infinity;
  /** Set when the last move pushed the body out of a wall. */
  hitWall = false;
  wallNX = 0;
  wallNZ = 0;
  hitCeiling = false;
  /** Terrain slope this body refuses to climb, as rise over run. */
  maxSlope = 1.3;

  constructor(radius: number, height: number) {
    this.radius = radius;
    this.height = height;
  }

  setPos(x: number, y: number, z: number): void {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

const CELL = 8;
const cellKey = (ix: number, iz: number): number => (ix + 2048) * 4096 + (iz + 2048);

export interface RayHit {
  t: number;
  solid: Solid | null;
}

export class CollisionWorld {
  terrain: Heightfield | null = null;
  readonly solids: Solid[] = [];
  private dynamics: Solid[] = [];
  private grid = new Map<number, Solid[]>();
  private scratch: Solid[] = [];

  add(s: Solid): Solid {
    this.solids.push(s);
    if (s.dynamic) this.dynamics.push(s);
    else this.insert(s);
    return s;
  }

  remove(s: Solid): void {
    const i = this.solids.indexOf(s);
    if (i >= 0) this.solids.splice(i, 1);
    const d = this.dynamics.indexOf(s);
    if (d >= 0) this.dynamics.splice(d, 1);
    else this.forCells(s.x, s.z, s.boundR, (list) => {
      const k = list.indexOf(s);
      if (k >= 0) list.splice(k, 1);
    });
  }

  private insert(s: Solid): void {
    this.forCells(s.x, s.z, s.boundR, (list) => list.push(s), true);
  }

  private forCells(x: number, z: number, r: number, fn: (list: Solid[]) => void, create = false): void {
    const i0 = Math.floor((x - r) / CELL);
    const i1 = Math.floor((x + r) / CELL);
    const j0 = Math.floor((z - r) / CELL);
    const j1 = Math.floor((z + r) / CELL);
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const k = cellKey(i, j);
        let list = this.grid.get(k);
        if (!list) {
          if (!create) continue;
          list = [];
          this.grid.set(k, list);
        }
        fn(list);
      }
    }
  }

  /** Solids whose footprint could touch a circle. Reuses one array. */
  query(x: number, z: number, r: number): Solid[] {
    const out = this.scratch;
    out.length = 0;
    const stamp = ++queryStamp;
    this.forCells(x, z, r, (list) => {
      for (const s of list) {
        if (s.stamp === stamp) continue;
        s.stamp = stamp;
        out.push(s);
      }
    });
    for (const s of this.dynamics) out.push(s);
    return out;
  }

  terrainAt(x: number, z: number): number {
    return this.terrain ? this.terrain.at(x, z) : -Infinity;
  }

  /**
   * Highest standable surface under (x, z) no higher than maxY. `pad` widens
   * the footprint test so an actor whose center is just past an edge still
   * stands on it, which is far more forgiving than center-point support.
   */
  groundAt(x: number, z: number, maxY: number, pad: number): { y: number; solid: Solid | null } {
    let best = this.terrainAt(x, z);
    let solid: Solid | null = null;
    for (const s of this.query(x, z, pad)) {
      if (!s.enabled || s.wallOnly || s.cameraOnly) continue;
      if (s.footprintDist(x, z) > pad) continue;
      const top = s.topNear(x, z);
      if (top <= maxY && top > best) {
        best = top;
        solid = s;
      }
    }
    return { y: best, solid };
  }

  /** Carries a grounded body along with the moving solid it stands on. */
  carry(b: Body): void {
    const s = b.ground;
    if (!s || !b.grounded || !s.dynamic) return;
    if (s.dyaw !== 0) {
      const rx = b.x - (s.x - s.dx);
      const rz = b.z - (s.z - s.dz);
      const c = Math.cos(s.dyaw);
      const sn = Math.sin(s.dyaw);
      b.x = s.x - s.dx + rx * c + rz * sn;
      b.z = s.z - s.dz - rx * sn + rz * c;
    }
    b.x += s.dx;
    b.y += s.dy;
    b.z += s.dz;
  }

  /** Integrates a body one step and resolves it against the world. */
  move(b: Body, dt: number): void {
    const wasGrounded = b.grounded;
    b.hitWall = false;
    b.hitCeiling = false;

    // Horizontal, in substeps small enough that nothing tunnels.
    const hx = b.vx * dt;
    const hz = b.vz * dt;
    const hd = Math.hypot(hx, hz);
    const n = Math.max(1, Math.ceil(hd / (b.radius * 0.7)));
    for (let k = 0; k < n; k++) {
      const px = b.x;
      const pz = b.z;
      b.x += hx / n;
      b.z += hz / n;
      if (this.terrain && !this.terrainPassable(b, px, pz, wasGrounded)) {
        // Try sliding along each axis before giving up the move.
        b.x = px + hx / n;
        b.z = pz;
        if (!this.terrainPassable(b, px, pz, wasGrounded)) {
          b.x = px;
          b.z = pz + hz / n;
          if (!this.terrainPassable(b, px, pz, wasGrounded)) b.z = pz;
        }
        b.hitWall = true;
      }
      this.resolveWalls(b);
    }

    // Vertical.
    const prevY = b.y;
    b.y += b.vy * dt;

    if (b.vy > 0) {
      const head = b.y + b.height;
      const prevHead = prevY + b.height;
      for (const s of this.query(b.x, b.z, b.radius)) {
        if (!s.enabled || s.cameraOnly) continue;
        if (s.footprintDist(b.x, b.z) > b.radius * 0.5) continue;
        if (s.y0 >= prevHead - 0.05 && s.y0 < head) {
          b.y = s.y0 - b.height;
          b.vy = 0;
          b.hitCeiling = true;
        }
      }
    }

    const probe = Math.max(prevY, b.y) + b.stepUp;
    const g = this.groundAt(b.x, b.z, probe, b.radius * 0.6);
    b.groundY = g.y;
    const snap = wasGrounded ? 0.4 : 0;
    if (b.vy <= 0 && b.y <= g.y + snap && g.y > -Infinity) {
      b.y = g.y;
      b.vy = 0;
      b.grounded = true;
      b.ground = g.solid;
      if (g.solid?.onStand) g.solid.onStand(b);
    } else {
      b.grounded = false;
      b.ground = null;
    }
  }

  private terrainPassable(b: Body, px: number, pz: number, grounded: boolean): boolean {
    const h = this.terrainAt(b.x, b.z);
    if (h === -Infinity) return true;
    const rise = h - b.y;
    if (rise <= 0.02) return true;
    if (rise > b.stepUp) return false;
    if (!grounded) return true;
    const run = Math.hypot(b.x - px, b.z - pz);
    return run <= 0 || rise / run <= b.maxSlope;
  }

  private resolveWalls(b: Body): void {
    const feet = b.y;
    const head = b.y + b.height;
    const r = b.radius;
    for (let iter = 0; iter < 2; iter++) {
      let moved = false;
      for (const s of this.query(b.x, b.z, r)) {
        if (!s.enabled || s.cameraOnly) continue;
        if (s.y0 >= head - 0.01) continue;
        const top = s.topNear(b.x, b.z);
        if (!s.wallOnly && top <= feet + b.stepUp) continue;
        if (s.shape === 'cyl') {
          const dx = b.x - s.x;
          const dz = b.z - s.z;
          const d = Math.hypot(dx, dz);
          const min = r + s.r;
          if (d >= min) continue;
          const nx = d > 1e-6 ? dx / d : 1;
          const nz = d > 1e-6 ? dz / d : 0;
          b.x = s.x + nx * min;
          b.z = s.z + nz * min;
          this.noteWall(b, nx, nz);
          moved = true;
          continue;
        }
        const lx = s.toLocalX(b.x, b.z);
        const lz = s.toLocalZ(b.x, b.z);
        const qx = Math.max(-s.hx, Math.min(s.hx, lx));
        const qz = Math.max(-s.hz, Math.min(s.hz, lz));
        let ox = lx - qx;
        let oz = lz - qz;
        const d = Math.hypot(ox, oz);
        let nlx: number;
        let nlz: number;
        let push: number;
        if (d > 1e-6) {
          if (d >= r) continue;
          nlx = ox / d;
          nlz = oz / d;
          push = r - d;
        } else {
          // Center inside the footprint: leave through the nearest side.
          const penX = s.hx - Math.abs(lx);
          const penZ = s.hz - Math.abs(lz);
          if (penX < penZ) {
            nlx = Math.sign(lx) || 1;
            nlz = 0;
            push = penX + r;
          } else {
            nlx = 0;
            nlz = Math.sign(lz) || 1;
            push = penZ + r;
          }
        }
        ox = nlx * push;
        oz = nlz * push;
        // local -> world: inverse of the rotation in toLocal
        const wx = ox * s.cos + oz * s.sin;
        const wz = -ox * s.sin + oz * s.cos;
        b.x += wx;
        b.z += wz;
        const wn = Math.hypot(wx, wz) || 1;
        this.noteWall(b, wx / wn, wz / wn);
        moved = true;
      }
      if (!moved) break;
    }
  }

  private noteWall(b: Body, nx: number, nz: number): void {
    b.hitWall = true;
    b.wallNX = nx;
    b.wallNZ = nz;
    // Kill the velocity component driving into the wall.
    const into = b.vx * nx + b.vz * nz;
    if (into < 0) {
      b.vx -= into * nx;
      b.vz -= into * nz;
    }
  }

  /** Is a vertical cylinder at this spot overlapping any solid? */
  blocked(x: number, y: number, z: number, r: number, h: number): boolean {
    for (const s of this.query(x, z, r)) {
      if (!s.enabled || s.cameraOnly) continue;
      if (s.y0 >= y + h || s.top <= y) continue;
      if (s.footprintDist(x, z) < r) return true;
    }
    return false;
  }

  /**
   * First hit along a ray, or maxT. Used for the camera, line of sight and
   * aiming. Ramps are treated as their bounding box, which is conservative in
   * the direction the camera cares about.
   */
  raycast(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxT: number, ignoreDynamic = false, camera = false): RayHit {
    let best = maxT;
    let hit: Solid | null = null;
    const mx = ox + dx * maxT * 0.5;
    const mz = oz + dz * maxT * 0.5;
    const reach = maxT * 0.5 * Math.hypot(dx, dz) + 1;
    for (const s of this.query(mx, mz, reach)) {
      if (!s.enabled || (ignoreDynamic && s.dynamic) || (s.cameraOnly && !camera)) continue;
      const t = s.shape === 'cyl' ? rayCyl(s, ox, oy, oz, dx, dy, dz) : rayBox(s, ox, oy, oz, dx, dy, dz);
      if (t >= 0 && t < best) {
        best = t;
        hit = s;
      }
    }
    if (this.terrain) {
      const tt = this.rayTerrain(ox, oy, oz, dx, dy, dz, best);
      if (tt < best) {
        best = tt;
        hit = null;
      }
    }
    return { t: best, solid: hit };
  }

  private rayTerrain(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxT: number): number {
    const step = 0.4;
    let prevT = 0;
    let prevAbove = oy - this.terrainAt(ox, oz) >= 0;
    if (!prevAbove) return 0;
    for (let t = step; t <= maxT + step; t += step) {
      const tt = Math.min(t, maxT);
      const above = oy + dy * tt - this.terrainAt(ox + dx * tt, oz + dz * tt) >= 0;
      if (!above) {
        let lo = prevT;
        let hi = tt;
        for (let k = 0; k < 6; k++) {
          const m = (lo + hi) * 0.5;
          if (oy + dy * m - this.terrainAt(ox + dx * m, oz + dz * m) >= 0) lo = m;
          else hi = m;
        }
        return lo;
      }
      prevT = tt;
      prevAbove = above;
      if (tt >= maxT) break;
    }
    return Infinity;
  }
}

function rayBox(s: Solid, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number): number {
  const lox = s.toLocalX(ox, oz);
  const loz = s.toLocalZ(ox, oz);
  const ldx = dx * s.cos - dz * s.sin;
  const ldz = dx * s.sin + dz * s.cos;
  let tmin = -Infinity;
  let tmax = Infinity;
  const slab = (o: number, d: number, lo: number, hi: number): boolean => {
    if (Math.abs(d) < 1e-9) return o >= lo && o <= hi;
    let t1 = (lo - o) / d;
    let t2 = (hi - o) / d;
    if (t1 > t2) [t1, t2] = [t2, t1];
    if (t1 > tmin) tmin = t1;
    if (t2 < tmax) tmax = t2;
    return tmin <= tmax;
  };
  if (!slab(lox, ldx, -s.hx, s.hx)) return -1;
  if (!slab(oy, dy, s.y0, s.top)) return -1;
  if (!slab(loz, ldz, -s.hz, s.hz)) return -1;
  if (tmax < 0) return -1;
  return tmin >= 0 ? tmin : 0;
}

function rayCyl(s: Solid, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number): number {
  const px = ox - s.x;
  const pz = oz - s.z;
  const a = dx * dx + dz * dz;
  let best = -1;
  if (a > 1e-9) {
    const b = 2 * (px * dx + pz * dz);
    const c = px * px + pz * pz - s.r * s.r;
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const sq = Math.sqrt(disc);
      for (const t of [(-b - sq) / (2 * a), (-b + sq) / (2 * a)]) {
        if (t < 0) continue;
        const y = oy + dy * t;
        if (y >= s.y0 && y <= s.y1) {
          best = t;
          break;
        }
      }
    }
  }
  if (Math.abs(dy) > 1e-9) {
    for (const cap of [s.y0, s.y1]) {
      const t = (cap - oy) / dy;
      if (t < 0) continue;
      const x = px + dx * t;
      const z = pz + dz * t;
      if (x * x + z * z <= s.r * s.r && (best < 0 || t < best)) best = t;
    }
  }
  // Origin inside the cylinder.
  if (px * px + pz * pz <= s.r * s.r && oy >= s.y0 && oy <= s.y1) return 0;
  return best;
}

export function makeBox(x: number, z: number, hx: number, hz: number, y0: number, y1: number, yaw = 0): Solid {
  const s = new Solid('box');
  s.x = x;
  s.z = z;
  s.hx = hx;
  s.hz = hz;
  s.y0 = y0;
  s.y1 = y1;
  s.setYaw(yaw);
  return s;
}

export function makeRamp(x: number, z: number, hx: number, hz: number, y0: number, yLow: number, yHigh: number, yaw = 0): Solid {
  const s = new Solid('ramp');
  s.x = x;
  s.z = z;
  s.hx = hx;
  s.hz = hz;
  s.y0 = y0;
  s.y1 = yLow;
  s.y2 = yHigh;
  s.setYaw(yaw);
  return s;
}

export function makeCyl(x: number, z: number, r: number, y0: number, y1: number): Solid {
  const s = new Solid('cyl');
  s.x = x;
  s.z = z;
  s.r = r;
  s.y0 = y0;
  s.y1 = y1;
  return s;
}
