/**
 * The style meter: rewards landing hits with variety, and pays out in extra
 * gems and fury. Repeating the same move earns less each time; reactions and
 * launch-into-air-combo strings earn the most. Taking a hit costs a rank.
 */

export const RANKS = [
  { letter: 'D', name: 'Spark', at: 0 },
  { letter: 'C', name: 'Ember', at: 120 },
  { letter: 'B', name: 'Blaze', at: 300 },
  { letter: 'A', name: 'Wildfire', at: 520 },
  { letter: 'S', name: 'Inferno', at: 800 },
  { letter: 'SS', name: 'Legendary', at: 1150 },
] as const;

export const MAX_POINTS = 1400;

export class StyleMeter {
  points = 0;
  combo = 0;
  bestCombo = 0;
  private idle = 0;
  private recent: string[] = [];
  /** Seconds since the last hit before the combo counter resets. */
  static readonly COMBO_WINDOW = 2.6;

  get rank(): number {
    let r = 0;
    for (let i = 0; i < RANKS.length; i++) if (this.points >= RANKS[i]!.at) r = i;
    return r;
  }

  /** 0..1 progress toward the next rank. */
  get progress(): number {
    const r = this.rank;
    if (r >= RANKS.length - 1) return Math.min(1, (this.points - RANKS[r]!.at) / (MAX_POINTS - RANKS[r]!.at));
    const a = RANKS[r]!.at;
    const b = RANKS[r + 1]!.at;
    return (this.points - a) / (b - a);
  }

  /** Multiplier applied to gem drops and fury gain. */
  get reward(): number {
    return 1 + this.rank * 0.15;
  }

  /** Records a landed hit; returns the points it earned. */
  hit(move: string, basePoints: number): number {
    const repeats = this.recent.filter((m) => m === move).length;
    const novelty = repeats === 0 ? 1.25 : repeats === 1 ? 0.8 : repeats === 2 ? 0.45 : 0.2;
    this.recent.push(move);
    if (this.recent.length > 5) this.recent.shift();
    this.combo++;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    this.idle = 0;
    const comboBonus = 1 + Math.min(this.combo, 40) * 0.02;
    const gained = basePoints * novelty * comboBonus;
    this.points = Math.min(MAX_POINTS, this.points + gained);
    return gained;
  }

  bonus(points: number): void {
    this.points = Math.min(MAX_POINTS, this.points + points);
    this.idle = 0;
  }

  /** The player got hit: drop a full rank and the combo. */
  hurt(): void {
    const r = this.rank;
    const floor = r > 0 ? RANKS[r - 1]!.at : 0;
    this.points = Math.max(0, Math.min(this.points, floor + (RANKS[r]!.at - floor) * 0.5));
    if (r === 0) this.points = 0;
    this.combo = 0;
    this.recent.length = 0;
  }

  update(dt: number, inCombat: boolean): void {
    this.idle += dt;
    if (this.idle > StyleMeter.COMBO_WINDOW) this.combo = 0;
    if (this.idle > 1.6) {
      const rate = inCombat ? 45 : 120;
      this.points = Math.max(0, this.points - rate * dt);
    }
  }

  reset(): void {
    this.points = 0;
    this.combo = 0;
    this.recent.length = 0;
    this.idle = 0;
  }
}
