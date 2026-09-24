import type { LevelDef } from '../world/level';
import { fen } from './fen';
import { falls } from './falls';
import { frostworks } from './frostworks';
import { plains } from './plains';
import { sanctum } from './sanctum';

export const LEVELS: Record<string, LevelDef> = {
  fen,
  falls,
  frostworks,
  plains,
  sanctum,
};
