import type { Sfx } from '../core/audio';

/**
 * Frame data for every melee move, in seconds. A move has one or more hit
 * windows; during a window, anything inside its arc gets hit once. Pressing
 * Horn or Tail after `cancelFrom` chains into the move named in `next`.
 */

export interface HitWindow {
  t0: number;
  t1: number;
  range: number;
  /** Half-angle of the arc in radians; Math.PI hits all around. */
  arc: number;
  /** Vertical band relative to the player's feet. */
  low: number;
  high: number;
  /** Shifts the arc's center forward. */
  offset?: number;
  damage: number;
  knockback: number;
  launch: number;
  stagger: number;
  hitstop: number;
  heavy?: boolean;
  spike?: boolean;
  /** Keeps airborne targets hanging in front of you during air combos. */
  float?: number;
}

export interface Swoosh {
  t: number;
  radius: number;
  arc: number;
  plane: 'h' | 'v';
  height: number;
  tilt?: number;
  start?: number;
  color?: number;
}

export interface MoveDef {
  id: string;
  name: string;
  pose: string;
  duration: number;
  air: boolean;
  hits: HitWindow[];
  cancelFrom: number;
  /** [t0, t1, speed] forward motion during the move. */
  lunge?: [number, number, number];
  /** Holds the dragon up in the air for air moves. */
  hover?: boolean;
  next: { horn?: string; tail?: string };
  swooshes: Swoosh[];
  sfx: Sfx;
  sfxAt: number;
  /** How strongly the move turns you toward the nearest enemy at its start. */
  tracking: number;
  /** Style points per hit. */
  style: number;
  requires?: string;
}

const PI = Math.PI;

export const MOVES: Record<string, MoveDef> = {
  horn1: {
    id: 'horn1', name: 'Horn Jab', pose: 'horn1', duration: 0.36, air: false, cancelFrom: 0.16,
    hits: [{ t0: 0.08, t1: 0.17, range: 2.0, arc: 0.95, low: -0.3, high: 1.8, damage: 10, knockback: 3, launch: 0, stagger: 12, hitstop: 0.045 }],
    lunge: [0, 0.14, 7], next: { horn: 'horn2', tail: 'uppercut' },
    swooshes: [{ t: 0.08, radius: 1.8, arc: 1.4, plane: 'h', height: 0.8, tilt: 0.25 }],
    sfx: 'swing', sfxAt: 0.05, tracking: 1, style: 10,
  },
  horn2: {
    id: 'horn2', name: 'Horn Sweep', pose: 'horn2', duration: 0.4, air: false, cancelFrom: 0.2,
    hits: [{ t0: 0.1, t1: 0.22, range: 2.2, arc: 1.3, low: -0.3, high: 1.8, damage: 12, knockback: 3.5, launch: 0, stagger: 14, hitstop: 0.05 }],
    lunge: [0, 0.16, 7], next: { horn: 'horn3', tail: 'uppercut' },
    swooshes: [{ t: 0.1, radius: 2.0, arc: 2.2, plane: 'h', height: 0.85, tilt: -0.2 }],
    sfx: 'swing', sfxAt: 0.07, tracking: 1, style: 12,
  },
  horn3: {
    id: 'horn3', name: 'Horn Ram', pose: 'horn3', duration: 0.56, air: false, cancelFrom: 0.3,
    hits: [{ t0: 0.14, t1: 0.27, range: 2.3, arc: 0.9, low: -0.3, high: 1.9, damage: 18, knockback: 11, launch: 2, stagger: 35, hitstop: 0.09, heavy: true }],
    lunge: [0.05, 0.22, 10], next: { horn: 'horn4', tail: 'tail3' },
    swooshes: [{ t: 0.14, radius: 2.1, arc: 1.2, plane: 'v', height: 0.2, start: -0.2 }],
    sfx: 'swingHeavy', sfxAt: 0.1, tracking: 1, style: 18,
  },
  horn4: {
    id: 'horn4', name: 'Horn Cyclone', pose: 'horn4', duration: 0.62, air: false, cancelFrom: 0.5,
    hits: [
      { t0: 0.1, t1: 0.25, range: 2.6, arc: PI, low: -0.3, high: 1.9, damage: 12, knockback: 4, launch: 0, stagger: 18, hitstop: 0.04 },
      { t0: 0.3, t1: 0.42, range: 2.6, arc: PI, low: -0.3, high: 1.9, damage: 16, knockback: 10, launch: 3, stagger: 40, hitstop: 0.08, heavy: true },
    ],
    lunge: [0, 0.2, 4], next: {}, requires: 'hornFinisher',
    swooshes: [
      { t: 0.1, radius: 2.4, arc: PI * 1.6, plane: 'h', height: 0.7 },
      { t: 0.3, radius: 2.6, arc: PI * 1.9, plane: 'h', height: 0.8 },
    ],
    sfx: 'swingHeavy', sfxAt: 0.08, tracking: 0.5, style: 20,
  },
  uppercut: {
    id: 'uppercut', name: 'Horn Toss', pose: 'uppercut', duration: 0.58, air: false, cancelFrom: 0.34,
    hits: [{ t0: 0.16, t1: 0.3, range: 2.1, arc: 1.0, low: -0.4, high: 2.2, damage: 12, knockback: 1.2, launch: 13.5, stagger: 45, hitstop: 0.07 }],
    lunge: [0, 0.14, 5], next: { horn: 'horn1' },
    swooshes: [{ t: 0.16, radius: 1.9, arc: 2.0, plane: 'v', height: 0.1, start: -0.9, color: 0xffe7a8 }],
    sfx: 'launch', sfxAt: 0.14, tracking: 1, style: 20,
  },
  tail1: {
    id: 'tail1', name: 'Tail Whip', pose: 'tail1', duration: 0.5, air: false, cancelFrom: 0.28,
    hits: [{ t0: 0.12, t1: 0.32, range: 2.8, arc: PI, low: -0.3, high: 1.4, damage: 13, knockback: 7, launch: 0, stagger: 28, hitstop: 0.06, heavy: true }],
    lunge: [0, 0.2, 3], next: { tail: 'tail2', horn: 'horn2' },
    swooshes: [{ t: 0.12, radius: 2.6, arc: PI * 1.7, plane: 'h', height: 0.45, color: 0xfff0c0 }],
    sfx: 'swingHeavy', sfxAt: 0.08, tracking: 0.6, style: 14,
  },
  tail2: {
    id: 'tail2', name: 'Tail Lash', pose: 'tail2', duration: 0.5, air: false, cancelFrom: 0.28,
    hits: [{ t0: 0.12, t1: 0.32, range: 2.8, arc: PI, low: -0.3, high: 1.4, damage: 15, knockback: 8, launch: 0, stagger: 30, hitstop: 0.06, heavy: true }],
    lunge: [0, 0.2, 3], next: { tail: 'tail3', horn: 'horn3' },
    swooshes: [{ t: 0.12, radius: 2.6, arc: PI * 1.7, plane: 'h', height: 0.5, color: 0xfff0c0 }],
    sfx: 'swingHeavy', sfxAt: 0.08, tracking: 0.6, style: 15,
  },
  tail3: {
    id: 'tail3', name: 'Tail Smash', pose: 'tail3', duration: 0.72, air: false, cancelFrom: 0.55,
    hits: [{ t0: 0.34, t1: 0.44, range: 2.2, arc: 0.8, low: -0.4, high: 1.6, offset: 0.9, damage: 26, knockback: 5, launch: 7, stagger: 65, hitstop: 0.11, heavy: true }],
    lunge: [0, 0.3, 3], next: {},
    swooshes: [{ t: 0.3, radius: 2.3, arc: 2.2, plane: 'v', height: 0.2, start: -0.4, color: 0xfff0c0 }],
    sfx: 'swingHeavy', sfxAt: 0.28, tracking: 1, style: 24,
  },
  tailSpin: {
    id: 'tailSpin', name: 'Tail Cyclone', pose: 'tailSpin', duration: 1.6, air: false, cancelFrom: 1.6,
    hits: [0.1, 0.3, 0.5, 0.7, 0.9, 1.1, 1.3].map((t) => ({
      t0: t, t1: t + 0.1, range: 2.9, arc: PI, low: -0.3, high: 1.5, damage: 6, knockback: 2.5, launch: 0, stagger: 10, hitstop: 0.02,
    })),
    next: {}, requires: 'tailSpin',
    swooshes: [0.1, 0.3, 0.5, 0.7, 0.9, 1.1, 1.3].map((t) => ({ t, radius: 2.7, arc: PI * 1.8, plane: 'h' as const, height: 0.5, color: 0xfff0c0 })),
    sfx: 'swingHeavy', sfxAt: 0.05, tracking: 0, style: 6,
  },
  air1: {
    id: 'air1', name: 'Air Horn', pose: 'air1', duration: 0.32, air: true, hover: true, cancelFrom: 0.14,
    hits: [{ t0: 0.06, t1: 0.16, range: 2.3, arc: 1.1, low: -1.3, high: 2.4, damage: 10, knockback: 1.2, launch: 0, stagger: 12, hitstop: 0.045, float: 4 }],
    lunge: [0, 0.12, 5], next: { horn: 'air2', tail: 'slam' },
    swooshes: [{ t: 0.06, radius: 1.9, arc: 1.8, plane: 'h', height: 0.8, tilt: 0.35 }],
    sfx: 'swing', sfxAt: 0.04, tracking: 1, style: 14,
  },
  air2: {
    id: 'air2', name: 'Air Sweep', pose: 'air2', duration: 0.34, air: true, hover: true, cancelFrom: 0.16,
    hits: [{ t0: 0.07, t1: 0.17, range: 2.3, arc: 1.2, low: -1.3, high: 2.4, damage: 11, knockback: 1.2, launch: 0, stagger: 12, hitstop: 0.045, float: 4 }],
    lunge: [0, 0.12, 5], next: { horn: 'air3', tail: 'slam' },
    swooshes: [{ t: 0.07, radius: 1.9, arc: 1.9, plane: 'h', height: 0.8, tilt: -0.35 }],
    sfx: 'swing', sfxAt: 0.05, tracking: 1, style: 15,
  },
  air3: {
    id: 'air3', name: 'Comet Flip', pose: 'air3', duration: 0.5, air: true, hover: true, cancelFrom: 0.4,
    hits: [{ t0: 0.16, t1: 0.3, range: 2.4, arc: 1.2, low: -1.5, high: 2.4, damage: 18, knockback: 9, launch: 0, stagger: 45, hitstop: 0.09, heavy: true, spike: true }],
    lunge: [0, 0.15, 4], next: { tail: 'slam' },
    swooshes: [{ t: 0.14, radius: 2.0, arc: 2.6, plane: 'v', height: 0.4, start: 1.2 }],
    sfx: 'swingHeavy', sfxAt: 0.12, tracking: 1, style: 22,
  },
  ram: {
    id: 'ram', name: 'Horn Dash', pose: 'horn3', duration: 0.46, air: false, cancelFrom: 0.36,
    hits: [{ t0: 0.04, t1: 0.3, range: 1.9, arc: 0.8, low: -0.3, high: 1.8, damage: 16, knockback: 12, launch: 3, stagger: 50, hitstop: 0.08, heavy: true }],
    lunge: [0, 0.3, 15], next: { horn: 'horn2', tail: 'uppercut' },
    swooshes: [{ t: 0.05, radius: 1.8, arc: 1.2, plane: 'v', height: 0.3, start: -0.3 }],
    sfx: 'swingHeavy', sfxAt: 0.02, tracking: 1, style: 18,
  },
  counter: {
    id: 'counter', name: 'Counter', pose: 'counter', duration: 0.6, air: false, cancelFrom: 0.45,
    hits: [{ t0: 0.16, t1: 0.36, range: 3.0, arc: PI, low: -0.5, high: 2.4, damage: 34, knockback: 10, launch: 6, stagger: 80, hitstop: 0.13, heavy: true }],
    lunge: [0, 0.18, 12], next: { horn: 'horn2', tail: 'uppercut' },
    swooshes: [{ t: 0.16, radius: 2.8, arc: PI * 1.9, plane: 'h', height: 0.8, color: 0xd9b3ff }],
    sfx: 'counter', sfxAt: 0.12, tracking: 1, style: 40,
  },
};

// Moves reached by timing and direction rather than by button count.
Object.assign(MOVES, {
  lunge: {
    id: 'lunge', name: 'Horn Lunge', pose: 'horn3', duration: 0.48, air: false, cancelFrom: 0.3,
    hits: [{ t0: 0.05, t1: 0.26, range: 2.0, arc: 0.85, low: -0.3, high: 1.9, damage: 15, knockback: 9, launch: 2, stagger: 35, hitstop: 0.07, heavy: true }],
    lunge: [0, 0.24, 14], next: { horn: 'horn2', tail: 'uppercut' },
    swooshes: [{ t: 0.05, radius: 1.9, arc: 1.3, plane: 'v', height: 0.3, start: -0.3, color: 0xffe0a0 }],
    sfx: 'swingHeavy', sfxAt: 0.02, tracking: 1, style: 18,
  },
  flurry: {
    id: 'flurry', name: 'Horn Flurry', pose: 'horn2', duration: 0.9, air: false, cancelFrom: 0.78,
    hits: [
      ...[0.06, 0.18, 0.3, 0.42].map((t): HitWindow => ({
        t0: t, t1: t + 0.08, range: 2.2, arc: 1.2, low: -0.3, high: 1.9, damage: 5, knockback: 1, launch: 0, stagger: 8, hitstop: 0.025,
      })),
      { t0: 0.6, t1: 0.72, range: 2.4, arc: 1.3, low: -0.3, high: 2, damage: 16, knockback: 12, launch: 3, stagger: 50, hitstop: 0.1, heavy: true },
    ],
    lunge: [0, 0.5, 3], next: { tail: 'uppercut' },
    swooshes: [0.06, 0.18, 0.3, 0.42, 0.6].map((t, i) => ({ t, radius: 1.9, arc: 1.5, plane: 'h' as const, height: 0.7 + (i % 2) * 0.3, tilt: i % 2 ? -0.4 : 0.4 })),
    sfx: 'swing', sfxAt: 0.04, tracking: 1, style: 9,
  },
  sweep: {
    id: 'sweep', name: 'Tail Sweep', pose: 'tail1', duration: 0.62, air: false, cancelFrom: 0.45,
    hits: [{ t0: 0.1, t1: 0.36, range: 3.2, arc: Math.PI, low: -0.4, high: 0.9, damage: 12, knockback: 11, launch: 0, stagger: 60, hitstop: 0.06, heavy: true }],
    next: { horn: 'horn1', tail: 'tail3' },
    swooshes: [{ t: 0.1, radius: 3.0, arc: Math.PI * 1.9, plane: 'h', height: 0.2, color: 0xfff0c0 }],
    sfx: 'swingHeavy', sfxAt: 0.06, tracking: 0, style: 16,
  },
} satisfies Record<string, MoveDef>);

/** Finishers that take an element when Breath is held as they land. */
export const FINISHERS = new Set(['horn3', 'horn4', 'tail3', 'uppercut', 'air3', 'counter', 'lunge', 'flurry', 'sweep']);

/** Moves that open a timing window when they end: pause, then press again. */
export const DELAY_FOLLOWUPS: Record<string, { button: 'horn' | 'tail'; move: string }> = {
  horn2: { button: 'horn', move: 'flurry' },
  tail1: { button: 'tail', move: 'sweep' },
};

/** The slam's landing blast, applied when a Ground Pound touches down. */
export const SLAM_HIT: HitWindow = {
  t0: 0, t1: 0.1, range: 3.4, arc: PI, low: -1, high: 2, damage: 20, knockback: 7, launch: 7, stagger: 55, hitstop: 0.1, heavy: true,
};
