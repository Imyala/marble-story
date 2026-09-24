import { describe, expect, it } from 'vitest';
import { newSave, buyUpgrade, nextCost, learnElement, maxHp, maxMana, upgradeLevel, UPGRADES, SHARDS_PER_UPGRADE } from '../src/game/progress';
import { RELICS, LEVEL_INFO } from '../src/game/story';

describe('upgrades', () => {
  it('buys levels in order and stops at the cap', () => {
    const s = newSave();
    s.gems = 10000;
    const def = UPGRADES.find((u) => u.id === 'hornPower')!;
    for (let i = 0; i < def.costs.length; i++) expect(buyUpgrade(s, 'hornPower')).toBe(true);
    expect(upgradeLevel(s, 'hornPower')).toBe(def.costs.length);
    expect(buyUpgrade(s, 'hornPower')).toBe(false);
    expect(nextCost(s, 'hornPower')).toBeNull();
    expect(s.gems).toBe(10000 - def.costs.reduce((a, b) => a + b, 0));
  });

  it('refuses when broke, and seals element trees until learned', () => {
    const s = newSave();
    expect(buyUpgrade(s, 'magnet')).toBe(false);
    s.gems = 5000;
    expect(nextCost(s, 'iceBurst')).toBeNull();
    learnElement(s, 'ice');
    expect(upgradeLevel(s, 'iceBreath')).toBe(1);
    expect(nextCost(s, 'iceBreath')).toBeGreaterThan(0);
    expect(buyUpgrade(s, 'iceBreath')).toBe(true);
  });

  it('grows max health and mana every four shards', () => {
    const s = newSave();
    const hp = maxHp(s);
    s.heartShards = SHARDS_PER_UPGRADE - 1;
    expect(maxHp(s)).toBe(hp);
    s.heartShards = SHARDS_PER_UPGRADE;
    expect(maxHp(s)).toBeGreaterThan(hp);
    s.manaShards = SHARDS_PER_UPGRADE * 2;
    expect(maxMana(s)).toBe(maxMana(newSave()) + 50);
  });
});

describe('story data', () => {
  it('has a level for every relic and consistent collectible counts', () => {
    for (const r of Object.values(RELICS)) expect(LEVEL_INFO[r.level]).toBeDefined();
    for (const [id, info] of Object.entries(LEVEL_INFO)) {
      const relics = Object.values(RELICS).filter((r) => r.level === id).length;
      expect(info.collectibles).toBeGreaterThanOrEqual(relics);
    }
  });
});
