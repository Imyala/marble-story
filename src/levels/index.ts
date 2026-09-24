import type { LevelDef } from '../world/level';
import { fen } from './fen';
import { falls } from './falls';
import { sanctum } from './sanctum';

export const LEVELS: Record<string, LevelDef> = {
  fen,
  falls,
  sanctum,
};
