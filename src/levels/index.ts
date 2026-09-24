import type { LevelDef } from '../world/level';
import { fen } from './fen';
import { falls } from './falls';
import { plains } from './plains';
import { sanctum } from './sanctum';

export const LEVELS: Record<string, LevelDef> = {
  fen,
  falls,
  plains,
  sanctum,
};
