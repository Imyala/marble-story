import { LADDER_GRAB_X, LADDER_GRAB_Y } from './constants';

export interface LadderRope {
  id: number;
  /** Centre line. Climbing snaps the entity to this x. */
  x: number;
  /** Top y (smaller value — usually the surface of the platform above). */
  y1: number;
  /** Bottom y. */
  y2: number;
  /** Ladders climb slightly faster than ropes and use a different pose. */
  isLadder: boolean;
  layer: number;
}

/** A ladder the entity can grab by pressing Up at its current position. */
export function ladderAt(
  ladders: readonly LadderRope[],
  x: number,
  y: number,
  layer: number,
): LadderRope | null {
  for (const l of ladders) {
    if (l.layer !== layer) continue;
    if (Math.abs(l.x - x) > LADDER_GRAB_X) continue;
    if (y < l.y1 - LADDER_GRAB_Y || y > l.y2 + LADDER_GRAB_Y) continue;
    return l;
  }
  return null;
}

/**
 * A ladder whose top is at the entity's feet — pressing Down here should drop
 * onto the ladder rather than into a prone pose.
 */
export function ladderBelow(
  ladders: readonly LadderRope[],
  x: number,
  y: number,
  layer: number,
): LadderRope | null {
  for (const l of ladders) {
    if (l.layer !== layer) continue;
    if (Math.abs(l.x - x) > LADDER_GRAB_X) continue;
    if (Math.abs(l.y1 - y) > LADDER_GRAB_Y) continue;
    return l;
  }
  return null;
}
