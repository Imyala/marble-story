export type Element = 'fire' | 'lightning' | 'ice' | 'earth';
export const ELEMENTS: readonly Element[] = ['fire', 'lightning', 'ice', 'earth'];
export type DamageType = Element | 'physical' | 'shadow';

export const ELEMENT_NAMES: Record<Element, string> = {
  fire: 'Fire',
  lightning: 'Lightning',
  ice: 'Ice',
  earth: 'Earth',
};

export type HitSource = 'melee' | 'breath' | 'burst' | 'fury' | 'reaction' | 'env' | 'charge' | 'enemy';

export interface Hit {
  damage: number;
  type: DamageType;
  /** Push direction on the XZ plane, normalized. */
  dirX: number;
  dirZ: number;
  knockback: number;
  /** Upward velocity given to the target. */
  launch: number;
  /** Poise damage; enough of it staggers heavy enemies. */
  stagger: number;
  /** Freeze-frame duration on contact. */
  hitstop: number;
  /** Elemental status buildup. */
  buildup: number;
  /** Heavy hits break guards and shatter frozen targets. */
  heavy: boolean;
  /** Slams an airborne target into the ground. */
  spike: boolean;
  source: HitSource;
  /** Move id, used to reward variety in the style meter. */
  move: string;
  fromPlayer: boolean;
  /** World position of the attacker, for guards that block from the front. */
  ox: number;
  oz: number;
}

export function makeHit(p: Partial<Hit> & { damage: number }): Hit {
  return {
    type: 'physical', dirX: 0, dirZ: 1, knockback: 0, launch: 0, stagger: 0, hitstop: 0, buildup: 0,
    heavy: false, spike: false, source: 'melee', move: 'hit', fromPlayer: true, ox: 0, oz: 0, ...p,
  };
}

export type HitResult = 'none' | 'hit' | 'blocked' | 'immune' | 'killed' | 'dodged';

/** Anything the player's attacks can connect with. */
export interface Hittable {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly radius: number;
  readonly height: number;
  alive: boolean;
  /** Enemies count toward combos, fury and the style meter. */
  readonly isEnemy: boolean;
  /** Breath and bursts ignore targets that do not want them (e.g. switches of another element). */
  takeHit(hit: Hit): HitResult;
}
