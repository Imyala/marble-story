/**
 * Verdant Vale and the Grey Cavern — the mainland (levels 10-35).
 *
 * Verdant Cross is the hub every later chain radiates from, which is why it
 * sits geographically central and has the widest set of exits.
 */
import { defineMap, backdrop, deco, ladder, portal, rope, spawnLine } from './builder';
import type { GameMap } from '../../game/types';

const G = 560;

/** Verdant Cross — the mainland hub town. */
export const verdantCross = (): GameMap => defineMap({
  id: 'verdant_cross', name: 'Verdant Cross', region: 'Verdant Vale',
  theme: 'grass', levelRange: [10, 40], returnMap: 'verdant_cross', town: true,
  bounds: { left: 0, top: -300, right: 2000, bottom: 760 },
  backdrop: backdrop('town', G),
  geometry: (b) => {
    b.chain([[0, G], [2000, G]], { wallLeft: true, wallRight: true });
    b.platform(200, 620, G - 160);
    b.platform(760, 1240, G - 200);
    b.platform(1380, 1800, G - 160);
    b.platform(880, 1120, G - 400);
  },
  ladders: [
    rope(330, G - 160, G),
    ladder(1000, G - 200, G),
    rope(1000, G - 400, G - 200),
    rope(1640, G - 160, G),
  ],
  portals: [
    portal('spawn', 1000, G, 'spawn'),
    portal('dock', 120, G, 'visible', {
      toMap: 'tidewatch', toPortal: 'pier', label: 'Ferry to Marble Isle',
    }),
    portal('east', 1960, G, 'visible', { toMap: 'boar_downs', toPortal: 'west', label: 'Boar Downs' }),
    portal('north', 1000, G - 400, 'visible', {
      toMap: 'thorn_thicket', toPortal: 'south', label: 'Thorn Thicket',
    }),
  ],
  npcs: [
    { npcId: 'shop_pell', x: 420, y: G - 160, facing: 1 },
    { npcId: 'storage_bern', x: 560, y: G - 160, facing: -1 },
    { npcId: 'instructor_hale', x: 860, y: G - 200, facing: 1 },
    { npcId: 'quest_dagny', x: 1500, y: G - 160, facing: -1 },
    { npcId: 'healer_orin', x: 1200, y: G, facing: -1 },
  ],
  decorations: [
    deco('lamp', 300, G), deco('lamp', 900, G), deco('lamp', 1500, G),
    deco('banner', 1000, G - 400), deco('crate', 640, G),
    deco('tree', 100, G, { scale: 1.4 }), deco('tree', 1900, G, { scale: 1.2 }),
    deco('sign', 1940, G),
  ],
});

/** Boar Downs — the first map with aggressive monsters. */
export const boarDowns = (): GameMap => defineMap({
  id: 'boar_downs', name: 'Boar Downs', region: 'Verdant Vale',
  theme: 'grass', levelRange: [14, 22], returnMap: 'verdant_cross',
  bounds: { left: 0, top: -340, right: 2600, bottom: 820 },
  backdrop: backdrop('meadow', G),
  geometry: (b) => {
    b.chain([[0, G], [600, G], [900, G - 90], [1500, G - 90], [1800, G],
             [2600, G]], { wallLeft: true, wallRight: true });
    b.platform(160, 560, G - 200);
    b.chain([[940, G - 260], [1200, G - 320], [1460, G - 260]]);
    b.platform(1900, 2400, G - 210);
    b.platform(500, 860, G - 430);
  },
  ladders: [
    rope(360, G - 200, G),
    ladder(1200, G - 320, G - 90),
    rope(2150, G - 210, G),
    rope(680, G - 430, G - 200),
  ],
  portals: [
    portal('spawn', 120, G, 'spawn'),
    portal('west', 30, G, 'visible', { toMap: 'verdant_cross', toPortal: 'east', label: 'Verdant Cross' }),
    portal('east', 2570, G, 'visible', { toMap: 'sun_shore', toPortal: 'west', label: 'Sun Shore' }),
  ],
  spawns: [
    ...spawnLine('field_boar', 200, 560, G, 4),
    ...spawnLine('field_boar', 950, 1450, G - 90, 5),
    ...spawnLine('horned_slime', 200, 520, G - 200, 3),
    ...spawnLine('horned_slime', 1950, 2350, G - 210, 4),
    ...spawnLine('field_boar', 1900, 2500, G, 4),
    ...spawnLine('horned_slime', 540, 820, G - 430, 2),
  ],
  decorations: [
    deco('tree', 180, G, { scale: 1.5 }), deco('tree', 1620, G - 90),
    deco('rock', 780, G), deco('bush', 1300, G - 90),
    deco('flower', 2200, G), deco('rock', 2450, G, { scale: 1.2 }),
  ],
});

/** Sun Shore — crabs and wolves along a bright, open beach. */
export const sunShore = (): GameMap => defineMap({
  id: 'sun_shore', name: 'Sun Shore', region: 'Verdant Vale',
  theme: 'sand', levelRange: [14, 26], returnMap: 'verdant_cross',
  bounds: { left: 0, top: -300, right: 2400, bottom: 800 },
  backdrop: backdrop('coast', G),
  geometry: (b) => {
    b.chain([[0, G - 40], [500, G - 40], [760, G + 40], [1700, G + 40],
             [1960, G - 40], [2400, G - 40]], { wallLeft: true, wallRight: true });
    b.platform(220, 660, G - 220);
    b.platform(1000, 1500, G - 190);
    b.platform(1780, 2200, G - 240);
  },
  ladders: [
    rope(420, G - 220, G - 40),
    ladder(1250, G - 190, G + 40),
    rope(1980, G - 240, G - 40),
  ],
  portals: [
    portal('spawn', 100, G - 40, 'spawn'),
    portal('west', 30, G - 40, 'visible', { toMap: 'boar_downs', toPortal: 'east', label: 'Boar Downs' }),
    portal('cave', 2360, G - 40, 'visible', {
      toMap: 'grey_cavern', toPortal: 'mouth', label: 'Grey Cavern',
    }),
  ],
  spawns: [
    ...spawnLine('sand_crab', 800, 1650, G + 40, 7),
    ...spawnLine('sand_crab', 260, 620, G - 220, 3),
    ...spawnLine('dune_wolf', 1050, 1450, G - 190, 3),
    ...spawnLine('dune_wolf', 1820, 2160, G - 240, 3),
    ...spawnLine('sand_crab', 2000, 2340, G - 40, 3),
  ],
  decorations: [
    deco('rock', 900, G + 40), deco('rock', 1500, G + 40, { scale: 0.9 }),
    deco('bush', 300, G - 40), deco('sign', 2330, G - 40),
  ],
});

/** Thorn Thicket — vertical, poisonous, and full of stationary blockers. */
export const thornThicket = (): GameMap => defineMap({
  id: 'thorn_thicket', name: 'Thorn Thicket', region: 'Verdant Vale',
  theme: 'grass', levelRange: [18, 26], returnMap: 'verdant_cross',
  bounds: { left: 0, top: -900, right: 1600, bottom: 800 },
  backdrop: backdrop('forest', G),
  geometry: (b) => {
    b.chain([[0, G], [1600, G]], { wallLeft: true, wallRight: true });
    // A vertical shaft of staggered platforms — climb or fall.
    b.platform(120, 620, G - 190);
    b.platform(900, 1440, G - 190);
    b.platform(320, 860, G - 380);
    b.platform(1080, 1520, G - 380);
    b.platform(140, 640, G - 570);
    b.platform(880, 1380, G - 570);
    b.platform(420, 1080, G - 760);
  },
  ladders: [
    rope(420, G - 190, G), ladder(1180, G - 190, G),
    rope(560, G - 380, G - 190), rope(1200, G - 380, G - 190),
    rope(420, G - 570, G - 380), rope(1140, G - 570, G - 380),
    rope(760, G - 760, G - 570),
  ],
  portals: [
    portal('south', 800, G, 'spawn'),
    portal('exit', 60, G, 'visible', { toMap: 'verdant_cross', toPortal: 'north', label: 'Verdant Cross' }),
  ],
  spawns: [
    ...spawnLine('thorn_bloom', 180, 580, G - 190, 3),
    ...spawnLine('thorn_bloom', 950, 1400, G - 190, 3),
    ...spawnLine('horned_slime', 380, 820, G - 380, 4),
    ...spawnLine('thorn_bloom', 1120, 1480, G - 380, 3),
    ...spawnLine('thorn_bloom', 200, 600, G - 570, 3),
    ...spawnLine('horned_slime', 920, 1340, G - 570, 4),
    ...spawnLine('thorn_bloom', 480, 1020, G - 760, 4),
  ],
  decorations: [
    deco('tree', 200, G, { scale: 1.6 }), deco('tree', 1400, G, { scale: 1.4 }),
    deco('bush', 700, G - 190), deco('bush', 500, G - 570),
    deco('flower', 900, G - 760),
  ],
});

/** Grey Cavern — dark, bats and golems, the gate to the Warden. */
export const greyCavern = (): GameMap => defineMap({
  id: 'grey_cavern', name: 'Grey Cavern', region: 'Grey Cavern',
  theme: 'stone', levelRange: [22, 34], returnMap: 'verdant_cross',
  bounds: { left: 0, top: -500, right: 2600, bottom: 860 },
  backdrop: backdrop('cavern', G),
  geometry: (b) => {
    b.chain([[0, G], [520, G], [700, G + 70], [1500, G + 70], [1680, G],
             [2600, G]], { wallLeft: true, wallRight: true });
    b.platform(180, 640, G - 200);
    b.platform(860, 1420, G - 180);
    b.platform(1720, 2200, G - 220);
    b.platform(560, 1000, G - 400);
    b.platform(1320, 1820, G - 420);
    b.platform(900, 1400, G - 620);
  },
  ladders: [
    ladder(360, G - 200, G),
    ladder(1140, G - 180, G + 70),
    ladder(1960, G - 220, G),
    rope(780, G - 400, G - 200),
    rope(1560, G - 420, G - 180),
    rope(1150, G - 620, G - 420),
  ],
  portals: [
    portal('mouth', 100, G, 'spawn'),
    portal('out', 30, G, 'visible', { toMap: 'sun_shore', toPortal: 'cave', label: 'Sun Shore' }),
    portal('deep', 1150, G - 620, 'scripted', {
      toMap: 'warden_hall', toPortal: 'gate', requireLevel: 30,
      label: "Warden's Hall — Lv.30+",
    }),
  ],
  spawns: [
    ...spawnLine('cave_bat', 700, 1500, G - 60, 6),
    ...spawnLine('rock_golem', 900, 1380, G - 180, 4),
    ...spawnLine('rock_golem', 220, 600, G - 200, 3),
    ...spawnLine('cave_bat', 1750, 2180, G - 300, 4),
    ...spawnLine('grave_wisp', 600, 960, G - 400, 3),
    ...spawnLine('grave_wisp', 1360, 1780, G - 420, 3),
    ...spawnLine('rock_golem', 940, 1360, G - 620, 3),
  ],
  decorations: [
    deco('rock', 800, G + 70, { scale: 1.3 }), deco('rock', 1300, G + 70),
    deco('lamp', 400, G), deco('lamp', 2000, G),
    deco('crate', 2300, G),
  ],
});

/** Warden's Hall — the second boss arena. */
export const wardenHall = (): GameMap => defineMap({
  id: 'warden_hall', name: "Warden's Hall", region: 'Grey Cavern',
  theme: 'dark', levelRange: [30, 45], returnMap: 'verdant_cross',
  bounds: { left: 0, top: -280, right: 1700, bottom: 780 },
  backdrop: backdrop('ruin', G),
  geometry: (b) => {
    b.chain([[0, G], [1700, G]], { wallLeft: true, wallRight: true });
    b.platform(140, 480, G - 220);
    b.platform(1220, 1560, G - 220);
    b.platform(700, 1000, G - 380);
  },
  ladders: [
    rope(300, G - 220, G), rope(1400, G - 220, G),
    rope(850, G - 380, G),
  ],
  portals: [
    portal('gate', 90, G, 'spawn'),
    portal('out', 40, G, 'visible', { toMap: 'grey_cavern', toPortal: 'mouth', label: 'Leave' }),
  ],
  spawns: [
    { mobId: 'stone_warden', x: 900, y: G, boss: true },
    ...spawnLine('rock_golem', 400, 1400, G, 3),
  ],
  decorations: [
    deco('banner', 300, G - 220), deco('banner', 1400, G - 220),
    deco('lamp', 180, G), deco('lamp', 1520, G),
  ],
});
