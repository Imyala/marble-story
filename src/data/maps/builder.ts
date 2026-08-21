/**
 * Map authoring helpers.
 *
 * Maps are hand-authored geometry, so the priority here is that a map file
 * reads like a level sketch rather than a wall of coordinates.
 */
import { FootholdBuilder } from '../../physics/foothold';
import type { LadderRope } from '../../physics/ladder';
import type { Backdrop, BackdropLayer, TerrainTheme } from '../../art/terrain';
import type { Decoration, GameMap, MobSpawn, NpcPlacement, Portal } from '../../game/types';

export interface MapSpec {
  id: string;
  name: string;
  region: string;
  theme: TerrainTheme;
  levelRange: [number, number];
  returnMap: string;
  town?: boolean;
  mobRate?: number;
  bounds: { left: number; top: number; right: number; bottom: number };
  backdrop: Backdrop;
  /** Build the collision geometry. */
  geometry: (b: FootholdBuilder) => void;
  ladders?: Omit<LadderRope, 'id' | 'layer'>[];
  portals: Portal[];
  spawns?: MobSpawn[];
  npcs?: NpcPlacement[];
  decorations?: Decoration[];
}

export function defineMap(spec: MapSpec): GameMap {
  const builder = new FootholdBuilder();
  spec.geometry(builder);
  return {
    id: spec.id,
    name: spec.name,
    region: spec.region,
    theme: spec.theme,
    levelRange: spec.levelRange,
    returnMap: spec.returnMap,
    town: spec.town ?? false,
    mobRate: spec.mobRate ?? 1,
    bounds: spec.bounds,
    backdrop: spec.backdrop,
    footholds: builder.build(),
    ladders: (spec.ladders ?? []).map((l, i) => ({ ...l, id: i + 1, layer: 0 })),
    portals: spec.portals,
    spawns: spec.spawns ?? [],
    npcs: spec.npcs ?? [],
    decorations: spec.decorations ?? [],
  };
}

/* --------------------------------------------------------- backdrops -- */

type BackdropPreset = 'coast' | 'meadow' | 'forest' | 'town' | 'cavern' | 'night' | 'ruin';

export function backdrop(preset: BackdropPreset, groundY: number): Backdrop {
  const layer = (
    kind: BackdropLayer['kind'], color: string, parallax: number,
    dy: number, height: number,
  ): BackdropLayer => ({ kind, color, parallax, baseY: groundY + dy, height });

  switch (preset) {
    case 'coast':
      return {
        sky: ['#7fc4e8', '#cfe9f2'],
        layers: [
          layer('clouds', '#ffffff', 0.12, -320, 120),
          layer('mountains', '#8fb4c9', 0.25, -20, 210),
          layer('hills', '#6f9e88', 0.45, 10, 120),
          layer('forest', '#3f6b52', 0.7, 30, 90),
        ],
      };
    case 'meadow':
      return {
        sky: ['#89ccef', '#dcefd8'],
        layers: [
          layer('clouds', '#ffffff', 0.1, -350, 140),
          layer('hills', '#a3c98f', 0.3, 0, 180),
          layer('hills', '#7aab6b', 0.5, 20, 130),
          layer('forest', '#4a7f4c', 0.72, 34, 100),
        ],
      };
    case 'forest':
      return {
        sky: ['#4e8f6b', '#9ed0a8'],
        layers: [
          layer('forest', '#2f6b48', 0.28, -10, 260),
          layer('forest', '#255a3c', 0.5, 14, 190),
          layer('forest', '#1c4630', 0.75, 36, 130),
        ],
      };
    case 'town':
      return {
        sky: ['#8ec6e8', '#e6ddc9'],
        layers: [
          layer('clouds', '#ffffff', 0.1, -340, 130),
          layer('hills', '#9dbfa2', 0.28, 0, 150),
          layer('skyline', '#8a7a63', 0.52, 22, 220),
          layer('skyline', '#6d5f4d', 0.74, 40, 150),
        ],
      };
    case 'cavern':
      return {
        sky: ['#1a1f2e', '#2b2436'],
        layers: [
          layer('cave', '#141a26', 0.3, -420, 200),
          layer('mountains', '#241f33', 0.5, 30, 220),
          layer('mountains', '#191624', 0.75, 50, 150),
        ],
      };
    case 'night':
      return {
        sky: ['#0d1226', '#241f3d'],
        layers: [
          layer('stars', '#ffffff', 0.04, -120, 620),
          layer('mountains', '#1c2140', 0.28, 10, 240),
          layer('forest', '#141833', 0.6, 34, 150),
        ],
      };
    case 'ruin':
      return {
        sky: ['#3a3350', '#6b5a72'],
        layers: [
          layer('mountains', '#2b2740', 0.26, 0, 250),
          layer('skyline', '#231f36', 0.5, 24, 200),
          layer('cave', '#171426', 0.8, -400, 160),
        ],
      };
  }
}

/* ---------------------------------------------------------- shorthand -- */

export function portal(
  name: string, x: number, y: number,
  type: Portal['type'], extra: Partial<Portal> = {},
): Portal {
  return { name, x, y, type, ...extra };
}

/** Evenly spread `count` spawn points of one monster across an x range. */
export function spawnLine(
  mobId: string, x1: number, x2: number, y: number, count: number,
): MobSpawn[] {
  const out: MobSpawn[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    out.push({ mobId, x: Math.round(x1 + (x2 - x1) * t), y });
  }
  return out;
}

export function rope(x: number, top: number, bottom: number): Omit<LadderRope, 'id' | 'layer'> {
  return { x, y1: top, y2: bottom, isLadder: false };
}

export function ladder(x: number, top: number, bottom: number): Omit<LadderRope, 'id' | 'layer'> {
  return { x, y1: top, y2: bottom, isLadder: true };
}

export function deco(
  kind: Decoration['kind'], x: number, y: number,
  extra: Partial<Decoration> = {},
): Decoration {
  return { kind, x, y, ...extra };
}
