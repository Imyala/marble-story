/**
 * Marble Isle — the starting region (levels 1-10).
 *
 * The shape follows the genre convention: one safe town, a short chain of
 * field maps with a gentle level gradient, and a one-way exit to the mainland
 * once you have taken a first job.
 */
import { defineMap, backdrop, deco, ladder, portal, rope, spawnLine } from './builder';
import type { GameMap } from '../../game/types';

const GROUND = 560;

/** Tidewatch — the starter town. No monsters, every service NPC. */
export const tidewatch = (): GameMap => defineMap({
  id: 'tidewatch', name: 'Tidewatch Harbour', region: 'Marble Isle',
  theme: 'wood', levelRange: [1, 10], returnMap: 'tidewatch', town: true,
  bounds: { left: 0, top: -240, right: 1700, bottom: 760 },
  backdrop: backdrop('coast', GROUND),
  geometry: (b) => {
    b.chain([[0, GROUND], [520, GROUND], [640, GROUND - 40], [1080, GROUND - 40],
             [1200, GROUND], [1700, GROUND]], { wallLeft: true, wallRight: true });
    // Dock platforms above the waterline.
    b.platform(180, 470, GROUND - 150);
    b.platform(760, 1000, GROUND - 190);
    b.platform(1280, 1560, GROUND - 140);
  },
  ladders: [
    rope(300, GROUND - 150, GROUND),
    ladder(880, GROUND - 190, GROUND - 40),
    rope(1400, GROUND - 140, GROUND),
  ],
  portals: [
    portal('spawn', 300, GROUND, 'spawn'),
    portal('east', 1660, GROUND, 'visible', {
      toMap: 'snail_meadow', toPortal: 'west', label: 'Snail Meadow',
    }),
    portal('pier', 900, GROUND - 190, 'scripted', {
      toMap: 'verdant_cross', toPortal: 'dock', requireLevel: 10,
      label: 'Ferry to the mainland',
    }),
  ],
  npcs: [
    { npcId: 'guide_mira', x: 400, y: GROUND, facing: 1 },
    { npcId: 'shop_pell', x: 700, y: GROUND - 40, facing: -1 },
    { npcId: 'storage_bern', x: 980, y: GROUND - 40, facing: -1 },
    { npcId: 'instructor_hale', x: 1350, y: GROUND - 140, facing: -1 },
  ],
  decorations: [
    deco('lamp', 240, GROUND), deco('lamp', 1120, GROUND),
    deco('crate', 560, GROUND - 40), deco('crate', 600, GROUND - 40, { scale: 0.8 }),
    deco('banner', 820, GROUND - 190), deco('sign', 1620, GROUND),
    deco('tree', 120, GROUND, { scale: 1.2 }), deco('tree', 1520, GROUND, { scale: 0.9 }),
  ],
});

/** Snail Meadow — the first hunting ground. */
export const snailMeadow = (): GameMap => defineMap({
  id: 'snail_meadow', name: 'Snail Meadow', region: 'Marble Isle',
  theme: 'grass', levelRange: [1, 6], returnMap: 'tidewatch',
  bounds: { left: 0, top: -320, right: 2400, bottom: 800 },
  backdrop: backdrop('meadow', GROUND),
  geometry: (b) => {
    b.chain([[0, GROUND], [700, GROUND], [880, GROUND - 60], [1500, GROUND - 60],
             [1680, GROUND], [2400, GROUND]], { wallLeft: true, wallRight: true });
    b.platform(240, 640, GROUND - 170);
    b.chain([[900, GROUND - 210], [1180, GROUND - 250], [1460, GROUND - 210]]);
    b.platform(1760, 2160, GROUND - 180);
    b.platform(1000, 1320, GROUND - 400);
  },
  ladders: [
    rope(420, GROUND - 170, GROUND),
    rope(1180, GROUND - 400, GROUND - 250),
    ladder(1000, GROUND - 210, GROUND - 60),
    rope(1940, GROUND - 180, GROUND),
  ],
  portals: [
    portal('spawn', 120, GROUND, 'spawn'),
    portal('west', 30, GROUND, 'visible', { toMap: 'tidewatch', toPortal: 'east', label: 'Tidewatch' }),
    portal('east', 2370, GROUND, 'visible', {
      toMap: 'slime_hollow', toPortal: 'west', label: 'Slime Hollow',
    }),
  ],
  spawns: [
    ...spawnLine('snail', 200, 660, GROUND, 6),
    ...spawnLine('snail', 300, 600, GROUND - 170, 3),
    ...spawnLine('blue_snail', 950, 1440, GROUND - 60, 5),
    ...spawnLine('blue_snail', 1800, 2120, GROUND - 180, 3),
    ...spawnLine('snail', 1750, 2320, GROUND, 4),
  ],
  decorations: [
    deco('tree', 160, GROUND, { scale: 1.3 }), deco('tree', 760, GROUND - 60),
    deco('bush', 520, GROUND), deco('bush', 1560, GROUND - 60),
    deco('flower', 340, GROUND), deco('flower', 1900, GROUND),
    deco('rock', 2200, GROUND, { scale: 1.1 }), deco('sign', 60, GROUND),
  ],
});

/** Slime Hollow — a shallow bowl, denser spawns, first real pressure. */
export const slimeHollow = (): GameMap => defineMap({
  id: 'slime_hollow', name: 'Slime Hollow', region: 'Marble Isle',
  theme: 'grass', levelRange: [5, 12], returnMap: 'tidewatch',
  bounds: { left: 0, top: -360, right: 2200, bottom: 860 },
  backdrop: backdrop('forest', GROUND + 60),
  geometry: (b) => {
    // A bowl: the floor dips in the middle, so mobs collect at the bottom.
    b.chain([[0, GROUND - 60], [420, GROUND - 60], [700, GROUND + 60],
             [1500, GROUND + 60], [1780, GROUND - 60], [2200, GROUND - 60]],
            { wallLeft: true, wallRight: true });
    b.platform(180, 560, GROUND - 230);
    b.platform(820, 1380, GROUND - 190);
    b.platform(1640, 2040, GROUND - 250);
    b.platform(560, 900, GROUND - 420);
    b.platform(1300, 1660, GROUND - 430);
  },
  ladders: [
    rope(300, GROUND - 230, GROUND - 60),
    ladder(1100, GROUND - 190, GROUND + 60),
    rope(1860, GROUND - 250, GROUND - 60),
    rope(700, GROUND - 420, GROUND - 190),
    rope(1500, GROUND - 430, GROUND - 190),
  ],
  portals: [
    portal('spawn', 120, GROUND - 60, 'spawn'),
    portal('west', 30, GROUND - 60, 'visible', {
      toMap: 'snail_meadow', toPortal: 'east', label: 'Snail Meadow',
    }),
    portal('throne', 1780, GROUND - 430, 'scripted', {
      toMap: 'slime_throne', toPortal: 'entrance', requireLevel: 15,
      label: 'The Throne — Lv.15+',
    }),
  ],
  spawns: [
    ...spawnLine('green_slime', 760, 1440, GROUND + 60, 7),
    ...spawnLine('green_slime', 880, 1320, GROUND - 190, 4),
    ...spawnLine('orange_mushroom', 220, 520, GROUND - 230, 3),
    ...spawnLine('orange_mushroom', 1680, 2000, GROUND - 250, 3),
    ...spawnLine('green_slime', 600, 860, GROUND - 420, 2),
    ...spawnLine('orange_mushroom', 1340, 1620, GROUND - 430, 2),
  ],
  decorations: [
    deco('tree', 240, GROUND - 60, { scale: 1.4 }), deco('tree', 2040, GROUND - 60),
    deco('rock', 900, GROUND + 60), deco('rock', 1240, GROUND + 60, { scale: 0.8 }),
    deco('bush', 1000, GROUND - 190), deco('flower', 1400, GROUND + 60),
  ],
});

/** Slime Throne — the region's boss arena. One entrance, one occupant. */
export const slimeThrone = (): GameMap => defineMap({
  id: 'slime_throne', name: 'The Slime Throne', region: 'Marble Isle',
  theme: 'dark', levelRange: [15, 25], returnMap: 'tidewatch', mobRate: 1,
  bounds: { left: 0, top: -200, right: 1400, bottom: 760 },
  backdrop: backdrop('ruin', GROUND),
  geometry: (b) => {
    b.chain([[0, GROUND], [1400, GROUND]], { wallLeft: true, wallRight: true });
    b.platform(160, 420, GROUND - 200);
    b.platform(980, 1240, GROUND - 200);
  },
  ladders: [rope(290, GROUND - 200, GROUND), rope(1110, GROUND - 200, GROUND)],
  portals: [
    portal('entrance', 90, GROUND, 'spawn'),
    portal('out', 40, GROUND, 'visible', {
      toMap: 'slime_hollow', toPortal: 'spawn', label: 'Leave',
    }),
  ],
  spawns: [
    { mobId: 'king_slime', x: 760, y: GROUND, boss: true },
    ...spawnLine('green_slime', 400, 1100, GROUND, 4),
  ],
  decorations: [
    deco('banner', 300, GROUND - 200), deco('banner', 1120, GROUND - 200),
    deco('lamp', 200, GROUND), deco('lamp', 1200, GROUND),
  ],
});
