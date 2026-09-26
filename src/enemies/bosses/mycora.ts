import { Bogmaw } from './bogmaw';
import type { Game } from '../../game/game';
import type { Builder } from '../../world/level';

/**
 * PLACEHOLDER for Mycora, the Spore Mother, the Mycelium Deep's boss. It
 * borrows Bogmaw's body and brain so the realm around it can be built and
 * tested; the real fight replaces this file (same exports, same signatures).
 */
export class Mycora extends Bogmaw {
  constructor(game: Game, x: number, y: number, z: number, yaw: number) {
    super(game, x, y, z, yaw);
    this.speakerId = 'mycora';
    (this as { displayName: string }).displayName = 'Mycora, the Spore Mother';
  }
}

/**
 * Builds whatever the fight needs inside Mycora's grove (a round, flat floor
 * of radius `r` around (cx, cz), left clear by the realm): pillars, caps,
 * spore sacs. The realm calls this before its bossFight(). Placeholder: none.
 */
export function buildMycoraArena(_b: Builder, _cx: number, _cz: number, _r: number): void {
  /* the real arena dressing comes with the real fight */
}
