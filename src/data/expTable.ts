/**
 * EXP required to advance from each level to the next.
 *
 * This is a hand-shaped curve, not a clean formula. The genre's curve has
 * deliberate walls right at the job-advancement levels (30 / 70 / 120): the
 * jump in required EXP is what makes reaching an advancement feel earned.
 * Between walls the curve is smoothly exponential with a slowly rising
 * exponent, which is what stretches late levels into multi-hour affairs.
 *
 * See docs/DESIGN.md §6.
 */

export const MAX_LEVEL = 200;

/** Anchor points the curve is fitted through (level → exp to next level). */
const ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [1, 15], [2, 34], [3, 57], [4, 92], [5, 135],
  [6, 372], [7, 560], [8, 840], [9, 1242], [10, 1573],
  [15, 3350], [20, 7842], [25, 11128], [30, 15000],
  [35, 26000], [40, 43000], [45, 66000], [50, 95000],
  [55, 133000], [60, 184000], [65, 265000], [70, 380000],
  [75, 545000], [80, 750000], [85, 985000], [90, 1240000],
  [95, 1480000], [100, 1700000], [105, 2100000], [110, 2800000],
  [115, 3700000], [120, 4900000], [125, 6600000], [130, 8900000],
  [135, 11500000], [140, 14500000], [145, 18000000], [150, 22000000],
  [155, 27000000], [160, 33000000], [165, 40000000], [170, 48500000],
  [175, 59000000], [180, 78000000], [185, 122000000], [190, 320000000],
  [195, 1000000000], [199, 2207026470], [200, 0],
];

/**
 * Log-linear interpolation between anchors. Interpolating in log space keeps
 * the curve smooth in the way an exponential curve should be — linear
 * interpolation would leave visible kinks between anchors.
 */
function buildTable(): number[] {
  const table = new Array<number>(MAX_LEVEL + 1).fill(0);
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const [l0, e0] = ANCHORS[i];
    const [l1, e1] = ANCHORS[i + 1];
    for (let lv = l0; lv < l1; lv++) {
      if (e0 <= 0 || e1 <= 0) {
        table[lv] = e0;
        continue;
      }
      const t = (lv - l0) / (l1 - l0);
      const value = Math.exp(Math.log(e0) + (Math.log(e1) - Math.log(e0)) * t);
      // Round to something that looks authored rather than computed.
      table[lv] = roundNicely(value);
    }
  }
  table[MAX_LEVEL] = 0;
  for (const [lv, e] of ANCHORS) table[lv] = e;
  return table;
}

function roundNicely(v: number): number {
  if (v < 100) return Math.round(v);
  if (v < 10_000) return Math.round(v / 10) * 10;
  if (v < 1_000_000) return Math.round(v / 100) * 100;
  if (v < 100_000_000) return Math.round(v / 1000) * 1000;
  return Math.round(v / 10_000) * 10_000;
}

export const EXP_TABLE: readonly number[] = buildTable();

/** EXP needed to go from `level` to `level + 1`. 0 at max level. */
export function expToNext(level: number): number {
  if (level < 1 || level >= MAX_LEVEL) return 0;
  return EXP_TABLE[level];
}

/** Total EXP from level 1 to the given level. Useful for progress readouts. */
export function cumulativeExp(level: number): number {
  let total = 0;
  for (let lv = 1; lv < Math.min(level, MAX_LEVEL); lv++) total += EXP_TABLE[lv];
  return total;
}

/**
 * How much of a kill's EXP you actually receive, based on the level gap.
 *
 * This is the invisible leash that keeps players moving to harder maps: it is
 * never surfaced in the UI, the EXP bar simply stops moving.
 */
export function expLevelModifier(playerLevel: number, mobLevel: number): number {
  const gap = playerLevel - mobLevel;
  if (gap <= -5) return 1.2;   // punching up pays, if you survive
  if (gap <= 4) return 1.0;
  if (gap <= 9) return 1.0 - (gap - 4) * 0.08;   // 1.0 → 0.6
  if (gap <= 19) return 0.6 - (gap - 9) * 0.04;  // 0.6 → 0.2
  return 0.05;
}

/**
 * EXP lost on death: a percentage of the EXP required for the current level.
 * Low levels are exempt so new players are never punished for learning.
 */
export function deathExpPenalty(level: number, hasCharm: boolean): number {
  if (hasCharm || level < 10) return 0;
  if (level < 30) return 0.05;
  if (level < 70) return 0.07;
  return 0.10;
}
