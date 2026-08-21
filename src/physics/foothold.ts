/**
 * Foothold collision.
 *
 * Collision geometry is a set of line segments linked into chains, not a tile
 * grid and not an AABB mesh. This is what gives the genre its signature feel:
 *
 *  - slopes are free (y is interpolated along the segment),
 *  - platforms are one-way (you only land when crossing downward),
 *  - walking is a chain traversal, so running off the end of a chain is a
 *    clean, well-defined transition into falling.
 *
 * See docs/DESIGN.md §1.3.
 */
import { LAND_EPSILON } from './constants';

export interface Foothold {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Id of the adjacent foothold to the left, 0 for none. */
  prev: number;
  /** Id of the adjacent foothold to the right, 0 for none. */
  next: number;
  /** Entities only collide with footholds on their own layer. */
  layer: number;
}

/** Vertical segments act as walls rather than floors. */
export function isWall(fh: Foothold): boolean {
  return fh.x1 === fh.x2;
}

export function fhLeft(fh: Foothold): number {
  return Math.min(fh.x1, fh.x2);
}

export function fhRight(fh: Foothold): number {
  return Math.max(fh.x1, fh.x2);
}

export function fhTop(fh: Foothold): number {
  return Math.min(fh.y1, fh.y2);
}

export function fhBottom(fh: Foothold): number {
  return Math.max(fh.y1, fh.y2);
}

/** Surface height at a given x, clamped to the segment's own range. */
export function fhYAt(fh: Foothold, x: number): number {
  if (fh.x1 === fh.x2) return fh.y1;
  const t = (x - fh.x1) / (fh.x2 - fh.x1);
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  return fh.y1 + (fh.y2 - fh.y1) * clamped;
}

/** Rise over run. Steeper slopes could be used to slow movement. */
export function fhSlope(fh: Foothold): number {
  if (fh.x1 === fh.x2) return Infinity;
  return (fh.y2 - fh.y1) / (fh.x2 - fh.x1);
}

export interface WalkResult {
  /** The foothold now underfoot, or null if the chain ended (start falling). */
  fh: Foothold | null;
  /** x after wall clamping. */
  x: number;
  /** True when a wall stopped horizontal movement. */
  blocked: boolean;
}

export class FootholdSet {
  readonly all: readonly Foothold[];
  readonly floors: readonly Foothold[];
  readonly walls: readonly Foothold[];
  private readonly byId = new Map<number, Foothold>();
  private readonly floorsByLayer = new Map<number, Foothold[]>();
  private readonly wallsByLayer = new Map<number, Foothold[]>();

  constructor(footholds: readonly Foothold[]) {
    this.all = footholds;
    const floors: Foothold[] = [];
    const walls: Foothold[] = [];
    for (const fh of footholds) {
      this.byId.set(fh.id, fh);
      const bucket = isWall(fh) ? walls : floors;
      bucket.push(fh);
      const map = isWall(fh) ? this.wallsByLayer : this.floorsByLayer;
      const list = map.get(fh.layer) ?? [];
      list.push(fh);
      map.set(fh.layer, list);
    }
    this.floors = floors;
    this.walls = walls;
  }

  get(id: number): Foothold | null {
    return this.byId.get(id) ?? null;
  }

  floorsOn(layer: number): readonly Foothold[] {
    return this.floorsByLayer.get(layer) ?? [];
  }

  wallsOn(layer: number): readonly Foothold[] {
    return this.wallsByLayer.get(layer) ?? [];
  }

  /**
   * Find the foothold an entity lands on when moving from y0 to y1 at x.
   *
   * Only downward crossings count, which is exactly why platforms are one-way:
   * jumping up through a foothold never registers a hit.
   */
  findLanding(x: number, y0: number, y1: number, layer: number): Foothold | null {
    if (y1 < y0) return null;
    let best: Foothold | null = null;
    let bestY = Infinity;
    for (const fh of this.floorsOn(layer)) {
      if (x < fhLeft(fh) || x > fhRight(fh)) continue;
      const fy = fhYAt(fh, x);
      if (y0 <= fy + LAND_EPSILON && y1 >= fy && fy < bestY) {
        bestY = fy;
        best = fh;
      }
    }
    return best;
  }

  /** Nearest floor at or below (x, y) — used to place spawns and dropped items. */
  groundBelow(x: number, y: number, layer = 0): Foothold | null {
    let best: Foothold | null = null;
    let bestY = Infinity;
    for (const fh of this.floorsOn(layer)) {
      if (x < fhLeft(fh) || x > fhRight(fh)) continue;
      const fy = fhYAt(fh, x);
      if (fy >= y - 1 && fy < bestY) {
        bestY = fy;
        best = fh;
      }
    }
    return best;
  }

  /**
   * Walk a grounded entity along its foothold chain to a new x.
   *
   * Traverses prev/next links until the target x falls inside a segment.
   * A missing link means the chain ended (fall off); a wall link means the
   * entity is blocked and x is clamped to the segment edge.
   */
  walk(from: Foothold, x: number): WalkResult {
    let cur = from;
    // Guard against malformed map data linking a chain into a cycle.
    for (let guard = 0; guard < 128; guard++) {
      const lo = fhLeft(cur);
      const hi = fhRight(cur);
      if (x < lo) {
        const prev = this.get(cur.prev);
        if (!prev) return { fh: null, x, blocked: false };
        if (isWall(prev)) return { fh: cur, x: lo, blocked: true };
        cur = prev;
        continue;
      }
      if (x > hi) {
        const next = this.get(cur.next);
        if (!next) return { fh: null, x, blocked: false };
        if (isWall(next)) return { fh: cur, x: hi, blocked: true };
        cur = next;
        continue;
      }
      return { fh: cur, x, blocked: false };
    }
    return { fh: cur, x, blocked: false };
  }

  /**
   * Clamp horizontal movement against wall segments.
   * Returns the furthest x reachable from x0 toward x1 at height y.
   */
  clampHorizontal(x0: number, x1: number, y: number, layer: number, halfWidth: number): number {
    if (x1 === x0) return x1;
    const dir = Math.sign(x1 - x0);
    let result = x1;
    for (const w of this.wallsOn(layer)) {
      if (y < fhTop(w) || y > fhBottom(w)) continue;
      const wx = w.x1;
      if (dir > 0) {
        const limit = wx - halfWidth;
        if (x0 <= limit && x1 > limit) result = Math.min(result, limit);
      } else {
        const limit = wx + halfWidth;
        if (x0 >= limit && x1 < limit) result = Math.max(result, limit);
      }
    }
    return result;
  }
}

export interface ChainOptions {
  layer?: number;
  /** Add a wall segment at the left end so entities cannot walk off. */
  wallLeft?: boolean;
  /** Add a wall segment at the right end. */
  wallRight?: boolean;
  /** How tall the generated end walls are. */
  wallHeight?: number;
}

/**
 * Builds foothold chains from polylines, which is far more readable in map
 * data than hand-writing linked segments.
 *
 *   b.chain([[0, 400], [300, 400], [420, 360]], { wallLeft: true })
 */
export class FootholdBuilder {
  private nextId = 1;
  private list: Foothold[] = [];

  chain(points: readonly (readonly [number, number])[], opts: ChainOptions = {}): Foothold[] {
    if (points.length < 2) throw new Error('a foothold chain needs at least 2 points');
    const layer = opts.layer ?? 0;
    const wallHeight = opts.wallHeight ?? 600;
    const made: Foothold[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[i + 1];
      made.push({ id: this.nextId++, x1, y1, x2, y2, prev: 0, next: 0, layer });
    }
    for (let i = 0; i < made.length; i++) {
      if (i > 0) made[i].prev = made[i - 1].id;
      if (i < made.length - 1) made[i].next = made[i + 1].id;
    }

    if (opts.wallLeft) {
      const head = made[0];
      const wall: Foothold = {
        id: this.nextId++,
        x1: head.x1, y1: head.y1,
        x2: head.x1, y2: head.y1 - wallHeight,
        prev: 0, next: head.id, layer,
      };
      head.prev = wall.id;
      made.push(wall);
    }
    if (opts.wallRight) {
      const tail = made[made.length - 1 - (opts.wallLeft ? 1 : 0)];
      const wall: Foothold = {
        id: this.nextId++,
        x1: tail.x2, y1: tail.y2,
        x2: tail.x2, y2: tail.y2 - wallHeight,
        prev: tail.id, next: 0, layer,
      };
      tail.next = wall.id;
      made.push(wall);
    }

    this.list.push(...made);
    return made;
  }

  /** A flat platform, the most common case. */
  platform(x1: number, x2: number, y: number, opts: ChainOptions = {}): Foothold[] {
    return this.chain([[x1, y], [x2, y]], opts);
  }

  build(): FootholdSet {
    return new FootholdSet(this.list);
  }
}
