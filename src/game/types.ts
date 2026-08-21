/**
 * Shared world types: maps, portals, spawn points, NPC placements.
 * See docs/DESIGN.md §1.3.
 */
import type { Rect } from '../physics/body';
import type { FootholdSet } from '../physics/foothold';
import type { LadderRope } from '../physics/ladder';
import type { Backdrop, TerrainTheme } from '../art/terrain';

export type PortalType = 'spawn' | 'visible' | 'hidden' | 'scripted' | 'townwarp';

export interface Portal {
  /** Unique within its map. Links target portals by name, not coordinate. */
  name: string;
  x: number;
  y: number;
  type: PortalType;
  /** Destination map id, absent for pure spawn points. */
  toMap?: string;
  /** Destination portal name in the target map. */
  toPortal?: string;
  /** Scripted gate: minimum level to pass. */
  requireLevel?: number;
  /** Scripted gate: quest that must be complete. */
  requireQuest?: string;
  /** Shown on the world map / when standing in the portal. */
  label?: string;
}

export interface MobSpawn {
  mobId: string;
  x: number;
  y: number;
  /** Overrides the monster's default respawn time. */
  respawnMs?: number;
  /** Spawn a boss here instead of a regular monster. */
  boss?: boolean;
}

export interface NpcPlacement {
  npcId: string;
  x: number;
  y: number;
  facing?: 1 | -1;
}

/** Decorative, non-colliding scenery placed by map data. */
export interface Decoration {
  kind: 'tree' | 'rock' | 'sign' | 'lamp' | 'crate' | 'flower' | 'bush' | 'banner';
  x: number;
  y: number;
  scale?: number;
  color?: string;
}

export interface GameMap {
  id: string;
  name: string;
  /** Towns have no monsters and no death penalty. */
  town: boolean;
  theme: TerrainTheme;
  backdrop: Backdrop;
  bounds: Rect;
  footholds: FootholdSet;
  ladders: LadderRope[];
  portals: Portal[];
  spawns: MobSpawn[];
  npcs: NpcPlacement[];
  decorations: Decoration[];
  /** Multiplier on how many spawn points are active. */
  mobRate: number;
  /** Where death and town-scrolls send you. */
  returnMap: string;
  /** Suggested level range, shown on the world map. */
  levelRange: [number, number];
  /** Region this map belongs to, for the world map grouping. */
  region: string;
}

export function findPortal(map: GameMap, name: string): Portal | null {
  return map.portals.find((p) => p.name === name) ?? null;
}

export function spawnPortal(map: GameMap): Portal {
  return (
    map.portals.find((p) => p.type === 'spawn' && p.name === 'spawn') ??
    map.portals.find((p) => p.type === 'spawn') ??
    map.portals[0]
  );
}
