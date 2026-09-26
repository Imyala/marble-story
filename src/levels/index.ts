import type { LevelDef } from '../world/level';
import { fen } from './fen';
import { falls } from './falls';
import { frostworks } from './frostworks';
import { keep } from './keep';
import { plains } from './plains';
import { sanctum } from './sanctum';
// Act II.
import { hollow } from './hollow';
import { mycelium } from './mycelium';

export const LEVELS: Record<string, LevelDef> = {
  fen,
  falls,
  frostworks,
  keep,
  plains,
  sanctum,
  hollow,
  mycelium,
};
