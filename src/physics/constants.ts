/**
 * Movement tuning. Units are pixels and seconds; +y is down (screen space).
 *
 * These are the numbers that decide whether the game "feels right". They were
 * chosen so that: a base jump clears ~74px of height and ~120px of distance,
 * a fall from the top of a tall map takes about a second, and air control is
 * weak enough that jumps commit you.
 */

/** Downward acceleration while airborne. */
export const GRAVITY = 2000;
/** Fall-speed cap. Without this, long drops become unrecoverable. */
export const TERMINAL_VY = 670;

/** Ground speed at speed stat 100. */
export const WALK_SPEED = 125;
/** Initial upward velocity at jump stat 100. Apex is v^2/2g = ~96px. */
export const JUMP_SPEED = 620;

/** Ground acceleration toward target speed. */
export const WALK_ACCEL = 1400;
/** Ground deceleration with no input. */
export const WALK_DRAG = 2500;
/** Air control, deliberately much weaker than ground control. */
export const AIR_ACCEL = 500;
/** Horizontal drag while airborne (very light). */
export const AIR_DRAG = 120;

/** Ladder / rope climb speed. */
export const CLIMB_SPEED = 110;
/** Rope is slightly slower than ladder. */
export const ROPE_SPEED_SCALE = 0.86;

/** Stat caps — equipment beyond these is wasted. */
export const SPEED_CAP = 140;
export const JUMP_CAP = 123;
export const SPEED_MIN = 40;

/** How far above a foothold we still count as "landing on it". */
export const LAND_EPSILON = 12;
/** Grace period after a down-jump during which footholds are ignored. */
export const DROP_THROUGH_TIME = 0.16;
/** Coyote time — you may still jump this long after walking off a ledge. */
export const COYOTE_TIME = 0.08;

/** Knockback applied when damaged. */
export const KNOCKBACK_VX = 190;
export const KNOCKBACK_VY = -260;
export const STAGGER_TIME = 0.32;
/** Invulnerability after taking a hit. */
export const IFRAME_TIME = 0.7;

/** Distance from a ladder's centre line at which you can grab it. */
export const LADDER_GRAB_X = 14;
export const LADDER_GRAB_Y = 22;
