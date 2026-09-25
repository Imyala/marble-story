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

describe('New Game+', () => {
  it('restarts the story but keeps what was earned', async () => {
    const { startNewGamePlus, ngScale, skinUnlocked } = await import('../src/game/progress');
    const s = newSave('hard');
    s.gems = 900;
    s.heartShards = 6;
    s.upgrades = { hornPower: 2 };
    s.elements = ['fire', 'lightning', 'ice', 'earth'];
    s.levelsDone = { fen: true, keep: true };
    s.unlocked = ['fen', 'sanctum', 'falls', 'keep'];
    s.level = 'keep';
    s.clears = 1;
    for (const k of ['story:fen:intro', 'arena:fen:willow', 'ward:fen:ruins', 'fen:chest:hollow', 'falls:rings:ledge', 'fen:egg-hollow', 'letter:fen:glimmer', 'relic:fen1', 'feat:kills1', 'skill:fen:boss', 'medal:fen:3', 'seen:grunt', 'trial:rush', 'fen:heart1']) s.found[k] = true;
    startNewGamePlus(s);
    expect(s.ngPlus).toBe(1);
    expect(s.levelsDone).toEqual({});
    expect(s.unlocked).toEqual(['fen']);
    expect(s.level).toBe('fen');
    expect(s.elements).toEqual([]);
    expect(s.gems).toBe(900);
    expect(s.heartShards).toBe(6);
    expect(s.upgrades.hornPower).toBe(2);
    expect(s.difficulty).toBe('hard');
    for (const k of ['story:fen:intro', 'arena:fen:willow', 'ward:fen:ruins', 'fen:chest:hollow', 'falls:rings:ledge']) expect(s.found[k]).toBeUndefined();
    for (const k of ['fen:egg-hollow', 'letter:fen:glimmer', 'relic:fen1', 'feat:kills1', 'skill:fen:boss', 'medal:fen:3', 'seen:grunt', 'trial:rush', 'fen:heart1']) expect(s.found[k]).toBe(true);
    const k1 = ngScale(s);
    expect(k1.hp).toBeGreaterThan(1.3);
    expect(k1.gems).toBeGreaterThan(1);
    expect(skinUnlocked(s, 'ascendant')).toBe(true);
    expect(skinUnlocked(s, 'voidfire')).toBe(false);
    startNewGamePlus(s);
    expect(s.ngPlus).toBe(2);
    expect(ngScale(s).hp).toBeGreaterThan(k1.hp);
  });
});
