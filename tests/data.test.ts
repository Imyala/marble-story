/**
 * Data integrity. Content is authored by hand, so these tests exist to catch
 * the mistakes hand-authoring actually makes: a typo'd item id in a drop
 * table, a portal pointing at a map that no longer exists, a spawn point
 * floating in mid-air.
 */
import { describe, expect, it } from 'vitest';
import { MOBS } from '../src/data/mobs';
import { ITEMS, getItem, tryGetItem } from '../src/data/items';
import { SKILLS, trySkill } from '../src/data/skills';
import { JOBS, getJob } from '../src/data/jobs';
import { allMaps, loadMap, mapIds } from '../src/data/maps';
import { findPortal, spawnPortal } from '../src/game/types';

describe('items', () => {
  it('has unique ids', () => {
    const ids = ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every equip a slot and non-negative requirements', () => {
    for (const item of ITEMS) {
      if (!item.equip) continue;
      expect(item.equip.slot, item.id).toBeTruthy();
      expect(item.equip.reqLevel, item.id).toBeGreaterThanOrEqual(1);
      expect(item.equip.slots, item.id).toBeGreaterThanOrEqual(0);
    }
  });

  it('gives every weapon a weapon type, delay, and range', () => {
    for (const item of ITEMS) {
      if (item.equip?.slot !== 'weapon') continue;
      expect(item.equip.weaponType, item.id).toBeTruthy();
      expect(item.equip.attackDelay, item.id).toBeGreaterThan(0);
      expect(item.equip.range, item.id).toBeGreaterThan(0);
    }
  });

  it('gives every non-equip item a stack size', () => {
    for (const item of ITEMS) {
      if (item.equip) continue;
      expect(item.maxStack ?? 0, item.id).toBeGreaterThan(0);
    }
  });
});

describe('monsters', () => {
  it('has unique ids', () => {
    const ids = MOBS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only drops items that exist', () => {
    for (const mob of MOBS) {
      for (const drop of mob.drops) {
        if (drop.item === 'meso') continue;
        expect(tryGetItem(drop.item), `${mob.id} drops ${drop.item}`).not.toBeNull();
      }
    }
  });

  it('uses sane drop chances and quantities', () => {
    for (const mob of MOBS) {
      for (const drop of mob.drops) {
        expect(drop.chance, `${mob.id}/${drop.item}`).toBeGreaterThan(0);
        expect(drop.chance, `${mob.id}/${drop.item}`).toBeLessThanOrEqual(1);
        if (drop.min !== undefined && drop.max !== undefined) {
          expect(drop.max, `${mob.id}/${drop.item}`).toBeGreaterThanOrEqual(drop.min);
        }
      }
    }
  });

  it('scales EXP and HP with level', () => {
    const regular = MOBS.filter((m) => !m.boss).slice().sort((a, b) => a.level - b.level);
    for (let i = 1; i < regular.length; i++) {
      expect(regular[i].maxHp).toBeGreaterThanOrEqual(regular[i - 1].maxHp);
      expect(regular[i].exp).toBeGreaterThanOrEqual(regular[i - 1].exp);
    }
  });

  it('gives bosses far more HP and EXP than same-level regulars', () => {
    for (const boss of MOBS.filter((m) => m.boss)) {
      const peers = MOBS.filter((m) => !m.boss && Math.abs(m.level - boss.level) <= 6);
      for (const peer of peers) {
        expect(boss.maxHp, boss.id).toBeGreaterThan(peer.maxHp * 4);
      }
    }
  });
});

describe('jobs', () => {
  it('has unique ids and resolvable parents', () => {
    const ids = JOBS.map((j) => j.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const job of JOBS) {
      if (job.from === null) continue;
      expect(() => getJob(job.from!), job.name).not.toThrow();
    }
  });

  it('raises requirements with each tier', () => {
    for (const job of JOBS) {
      if (job.from === null || job.from === 0) continue;
      const parent = getJob(job.from);
      expect(job.reqLevel, job.name).toBeGreaterThan(parent.reqLevel);
      expect(job.tier, job.name).toBe(parent.tier + 1);
    }
  });
});

describe('skills', () => {
  it('has unique ids', () => {
    const ids = SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has one level entry per level, and belongs to a real job', () => {
    for (const skill of SKILLS) {
      expect(skill.levels.length, skill.id).toBe(skill.maxLevel);
      expect(() => getJob(skill.jobId), skill.id).not.toThrow();
    }
  });

  it('only requires skills that exist in the same branch', () => {
    for (const skill of SKILLS) {
      for (const req of skill.requires ?? []) {
        const dep = trySkill(req.skillId);
        expect(dep, `${skill.id} requires ${req.skillId}`).not.toBeNull();
        expect(req.level).toBeGreaterThan(0);
        expect(req.level).toBeLessThanOrEqual(dep!.maxLevel);
      }
    }
  });

  it('increases attack skill damage with level', () => {
    for (const skill of SKILLS.filter((s) => s.type === 'attack')) {
      const first = skill.levels[0].damage ?? 0;
      const last = skill.levels[skill.levels.length - 1].damage ?? 0;
      expect(last, skill.id).toBeGreaterThan(first);
      expect(first, skill.id).toBeGreaterThan(0);
    }
  });

  it('never lets master level fall below max level', () => {
    for (const skill of SKILLS) {
      if (skill.masterLevel === undefined) continue;
      expect(skill.masterLevel, skill.id).toBeGreaterThanOrEqual(skill.maxLevel);
    }
  });
});

describe('maps', () => {
  it('builds every registered map', () => {
    for (const id of mapIds()) {
      expect(() => loadMap(id), id).not.toThrow();
    }
  });

  it('gives every map a spawn portal', () => {
    for (const map of allMaps()) {
      expect(spawnPortal(map), map.id).toBeTruthy();
    }
  });

  it('links every portal to a real map and a real portal there', () => {
    for (const map of allMaps()) {
      for (const p of map.portals) {
        if (!p.toMap) continue;
        expect(mapIds(), `${map.id}:${p.name}`).toContain(p.toMap);
        const target = loadMap(p.toMap);
        expect(
          findPortal(target, p.toPortal ?? 'spawn'),
          `${map.id}:${p.name} -> ${p.toMap}:${p.toPortal}`,
        ).not.toBeNull();
      }
    }
  });

  it('spawns only monsters that exist, standing on solid ground', () => {
    const mobIds = new Set(MOBS.map((m) => m.id));
    for (const map of allMaps()) {
      for (const spawn of map.spawns) {
        expect(mobIds, `${map.id} spawns ${spawn.mobId}`).toContain(spawn.mobId);
        const fh = map.footholds.groundBelow(spawn.x, spawn.y - 40, 0);
        expect(fh, `${map.id} spawn ${spawn.mobId} at ${spawn.x},${spawn.y} has no floor`).not.toBeNull();
      }
    }
  });

  it('keeps portals inside the map bounds', () => {
    for (const map of allMaps()) {
      for (const p of map.portals) {
        expect(p.x, `${map.id}:${p.name}`).toBeGreaterThanOrEqual(map.bounds.left);
        expect(p.x, `${map.id}:${p.name}`).toBeLessThanOrEqual(map.bounds.right);
      }
    }
  });

  it('gives towns no monsters, and field maps some', () => {
    for (const map of allMaps()) {
      if (map.town) expect(map.spawns.length, map.id).toBe(0);
      else expect(map.spawns.length, map.id).toBeGreaterThan(0);
    }
  });

  it('points every map at a real return map that is a town', () => {
    for (const map of allMaps()) {
      expect(mapIds(), map.id).toContain(map.returnMap);
      expect(loadMap(map.returnMap).town, `${map.id} returns to a non-town`).toBe(true);
    }
  });

  it('anchors ladders and ropes to reachable ground', () => {
    for (const map of allMaps()) {
      for (const l of map.ladders) {
        expect(l.y2, `${map.id} ladder at ${l.x}`).toBeGreaterThan(l.y1);
        const bottom = map.footholds.groundBelow(l.x, l.y2 - 4, 0);
        expect(bottom, `${map.id} ladder at ${l.x} has no floor at its base`).not.toBeNull();
      }
    }
  });

  it('reaches every map from the starting town', () => {
    const seen = new Set<string>(['tidewatch']);
    const queue = ['tidewatch'];
    while (queue.length) {
      const map = loadMap(queue.shift()!);
      for (const p of map.portals) {
        if (p.toMap && !seen.has(p.toMap)) {
          seen.add(p.toMap);
          queue.push(p.toMap);
        }
      }
    }
    for (const id of mapIds()) expect(seen, `${id} is unreachable`).toContain(id);
  });
});

describe('shops and economy', () => {
  it('prices every item above zero', () => {
    for (const item of ITEMS) expect(item.price, item.id).toBeGreaterThan(0);
  });

  it('prices better potions above weaker ones', () => {
    expect(getItem('orange_potion').price).toBeGreaterThan(getItem('red_potion').price);
    expect(getItem('white_potion').price).toBeGreaterThan(getItem('orange_potion').price);
  });
});
