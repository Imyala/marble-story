/**
 * The player character: stats, progression, skills, buffs, and attacking.
 *
 * Everything that changes a character's power goes through `recompute()`,
 * which rebuilds derived stats from four additive layers — base (AP), passive
 * skills, equipment, and buffs. Nothing mutates derived stats directly, so an
 * expiring buff or a swapped weapon can never leave a stale bonus behind.
 */
import type { Rng } from '../engine/rng';
import { Body, createBody } from '../physics/body';
import { AP_PER_LEVEL, Branch, JobDef, SP_ON_ADVANCE, SP_PER_LEVEL, advancementsFrom, getJob } from '../data/jobs';
import { MAX_LEVEL, deathExpPenalty, expToNext } from '../data/expTable';
import { SkillDef, SkillLevel, getSkill, skillLevel, skillsForJob, trySkill } from '../data/skills';
import { AttackerProfile, Element, WeaponType } from './combat';
import { BaseStats, DerivedStats, STARTING_STATS, StatBlock, addStats, deriveStats, emptyStats } from './stats';
import { Inventory } from './inventory';
import { checkRequirements } from './equipment';
import { CharacterLook, DEFAULT_LOOK, WeaponArt } from '../art/character';
import { getItem } from '../data/items';

export interface Buff {
  /** Skill id, or an item-defined buff name. */
  id: string;
  name: string;
  stats: StatBlock;
  /** Seconds remaining. */
  remaining: number;
  durationSec: number;
  mpShield?: number;
  /** Fraction of max HP restored per tick-second. */
  regenPercent?: number;
  attackSpeedScale?: number;
  icon: { glyph: string; color: string };
}

/** What the world needs in order to resolve an attack the player launched. */
export interface AttackSpec {
  skillId: string | null;
  damagePercent: number;
  attackCount: number;
  mobCount: number;
  /** Reach in pixels from the character's centre. */
  range: number;
  element: Element;
  /** Ranged attacks fire a visible projectile. */
  ranged: boolean;
}

export type AdvanceResult =
  | { ok: true; job: JobDef }
  | { ok: false; reason: 'level' | 'stat' | 'no-path' };

export class Player {
  name: string;
  level = 1;
  exp = 0;
  jobId = 0;
  base: BaseStats = { ...STARTING_STATS };
  ap = 0;
  sp = 0;
  fame = 0;

  hp = 50;
  mp = 20;
  /** HP/MP pools accumulated from levelling, before equipment and buffs. */
  baseHp = 50;
  baseMp = 20;

  /** skillId → learned level. */
  readonly skills = new Map<string, number>();
  buffs: Buff[] = [];
  readonly inventory = new Inventory();
  readonly body: Body;
  look: CharacterLook = { ...DEFAULT_LOOK };

  /** Derived stats, rebuilt by recompute(). */
  stats: DerivedStats;

  /** Seconds until the next attack is allowed. */
  attackCooldown = 0;
  /** 0..1 while an attack animation plays, null when idle. */
  attackAnim: number | null = null;
  /** Skill the current animation belongs to. */
  attackSkill: string | null = null;
  /** Per-skill cooldowns in seconds. */
  readonly skillCooldowns = new Map<string, number>();
  /** Shared potion cooldown in seconds. */
  potionCooldown = 0;

  /** 0..1 white flash when damaged. */
  flash = 0;
  dead = false;
  /** Seconds since death, used to gate the respawn prompt. */
  deadTime = 0;

  /** Total monsters killed — a small stat for the character window. */
  killCount = 0;

  constructor(name: string, x = 0, y = 0) {
    this.name = name;
    this.body = createBody({ x, y, width: 26, height: 56 });
    this.stats = this.buildStats();
    this.hp = this.stats.maxHp;
    this.mp = this.stats.maxMp;
  }

  get job(): JobDef {
    return getJob(this.jobId);
  }

  get branch(): Branch {
    return this.job.branch;
  }

  /* --------------------------------------------------------- stat build -- */

  /** Stats contributed by learned passive skills. */
  private passiveStats(): StatBlock {
    const total = emptyStats();
    for (const [id, lv] of this.skills) {
      const def = trySkill(id);
      if (!def || def.type !== 'passive') continue;
      const level = skillLevel(def, lv);
      if (level?.stats) addStats(total, level.stats);
    }
    return total;
  }

  private buffStats(): StatBlock {
    const total = emptyStats();
    for (const b of this.buffs) addStats(total, b.stats);
    return total;
  }

  private buildStats(): DerivedStats {
    const equip = this.inventory.equippedStats();
    const passive = this.passiveStats();
    // Passives fold into the equipment layer — both are permanent-while-held.
    addStats(equip, passive);
    return deriveStats({
      level: this.level,
      jobId: this.jobId,
      base: this.base,
      equip,
      buffs: this.buffStats(),
      baseHp: this.baseHp,
      baseMp: this.baseMp,
    });
  }

  /** Rebuild derived stats and clamp current HP/MP into the new pools. */
  recompute(): void {
    this.stats = this.buildStats();
    this.hp = Math.min(this.hp, this.stats.maxHp);
    this.mp = Math.min(this.mp, this.stats.maxMp);
    this.body.speedStat = this.stats.speed;
    this.body.jumpStat = this.stats.jump;
    this.syncLook();
  }

  /** Keep the drawn avatar in step with the equipped weapon. */
  private syncLook(): void {
    const weapon = this.inventory.equippedWeapon();
    if (!weapon) {
      this.look.weapon = 'none';
      return;
    }
    const def = getItem(weapon.itemId);
    this.look.weapon = WEAPON_ART[def.equip?.weaponType ?? 'none'];
    this.look.weaponColor = def.icon.color;
  }

  weaponType(): WeaponType {
    const w = this.inventory.equippedWeapon();
    if (!w) return 'none';
    return getItem(w.itemId).equip?.weaponType ?? 'none';
  }

  /** Base attack reach, from the weapon. */
  weaponRange(): number {
    const w = this.inventory.equippedWeapon();
    if (!w) return 54;
    return getItem(w.itemId).equip?.range ?? 60;
  }

  weaponDelay(): number {
    const w = this.inventory.equippedWeapon();
    const base = w ? getItem(w.itemId).equip?.attackDelay ?? 600 : 600;
    let scale = 1;
    for (const b of this.buffs) if (b.attackSpeedScale) scale = Math.min(scale, b.attackSpeedScale);
    return base * scale;
  }

  /** Mastery fraction for the currently equipped weapon type. */
  masteryFor(weapon: WeaponType): number {
    let best = 0.1;
    for (const [id, lv] of this.skills) {
      const def = trySkill(id);
      if (!def || def.type !== 'passive') continue;
      if (def.weapons && !def.weapons.includes(weapon)) continue;
      const level = skillLevel(def, lv);
      if (level?.mastery) best = Math.max(best, level.mastery);
    }
    return best;
  }

  /** Package the character up for the damage formula. */
  attackProfile(): AttackerProfile {
    const weapon = this.weaponType();
    const job = this.job;
    const primaryName = job.primary;
    const secondaryName = job.secondary;
    return {
      level: this.level,
      primary: this.stats[primaryName],
      secondary: this.stats[secondaryName],
      weapon,
      watk: this.stats.watk,
      matk: this.stats.matk,
      mastery: this.masteryFor(weapon),
      accuracy: this.stats.accuracy,
      critRate: this.stats.critRate,
      critDamage: this.stats.critDamage,
      ignoreDef: this.stats.ignoreDef,
      bossDamage: this.stats.bossDamage,
    };
  }

  /* ------------------------------------------------------------ levelling */

  /** Award EXP. Returns how many levels were gained. */
  gainExp(amount: number, rng: Rng): number {
    if (this.level >= MAX_LEVEL || amount <= 0) return 0;
    this.exp += Math.floor(amount);
    let gained = 0;
    while (this.level < MAX_LEVEL && this.exp >= expToNext(this.level)) {
      this.exp -= expToNext(this.level);
      this.levelUp(rng);
      gained++;
    }
    if (this.level >= MAX_LEVEL) this.exp = 0;
    return gained;
  }

  private levelUp(rng: Rng): void {
    this.level++;
    const job = this.job;
    this.baseHp += rng.int(job.hpGain[0], job.hpGain[1]);
    this.baseMp += rng.int(job.mpGain[0], job.mpGain[1]);
    this.ap += AP_PER_LEVEL;
    if (this.jobId !== 0) this.sp += SP_PER_LEVEL;
    this.recompute();
    // Levelling is a full restore — the reward moment should not be spent
    // walking back to a healer.
    this.hp = this.stats.maxHp;
    this.mp = this.stats.maxMp;
  }

  expToNextLevel(): number {
    return expToNext(this.level);
  }

  expFraction(): number {
    const need = expToNext(this.level);
    return need <= 0 ? 1 : Math.min(1, this.exp / need);
  }

  /** Spend one AP on a base stat. */
  allocateAp(stat: keyof BaseStats, amount = 1): boolean {
    if (this.ap < amount) return false;
    this.base[stat] += amount;
    this.ap -= amount;
    this.recompute();
    return true;
  }

  /* ------------------------------------------------------------- skills -- */

  skillLevelOf(id: string): number {
    return this.skills.get(id) ?? 0;
  }

  /** Skills this character is allowed to see and spend SP on. */
  availableSkills(): SkillDef[] {
    const jobs: number[] = [];
    let cur: JobDef | null = this.job;
    while (cur) {
      jobs.push(cur.id);
      cur = cur.from === null ? null : getJob(cur.from);
    }
    return jobs.flatMap((id) => skillsForJob(id));
  }

  canLearn(id: string): boolean {
    const def = trySkill(id);
    if (!def) return false;
    if (this.sp < 1) return false;
    const current = this.skillLevelOf(id);
    const cap = def.masterLevel && current >= def.maxLevel ? def.masterLevel : def.maxLevel;
    if (current >= cap) return false;
    if (!this.availableSkills().some((s) => s.id === id)) return false;
    for (const req of def.requires ?? []) {
      if (this.skillLevelOf(req.skillId) < req.level) return false;
    }
    return true;
  }

  learnSkill(id: string): boolean {
    if (!this.canLearn(id)) return false;
    this.skills.set(id, this.skillLevelOf(id) + 1);
    this.sp -= 1;
    this.recompute();
    return true;
  }

  /** The per-level numbers for a learned skill, or null. */
  skillStats(id: string): SkillLevel | null {
    const lv = this.skillLevelOf(id);
    if (lv < 1) return null;
    return skillLevel(getSkill(id), lv);
  }

  /* -------------------------------------------------------- advancement -- */

  advancementOptions(): JobDef[] {
    return advancementsFrom(this.jobId);
  }

  canAdvanceTo(jobId: number): AdvanceResult {
    const target = advancementsFrom(this.jobId).find((j) => j.id === jobId);
    if (!target) return { ok: false, reason: 'no-path' };
    if (this.level < target.reqLevel) return { ok: false, reason: 'level' };
    if (this.base[target.primary] < target.reqStat) return { ok: false, reason: 'stat' };
    return { ok: true, job: target };
  }

  advanceTo(jobId: number): AdvanceResult {
    const check = this.canAdvanceTo(jobId);
    if (!check.ok) return check;
    const job = check.job;
    this.jobId = job.id;
    this.baseHp += job.hpBonus;
    this.baseMp += job.mpBonus;
    this.sp += SP_ON_ADVANCE;
    // The first advancement hands out the SP the novice levels never granted.
    if (job.tier === 1) this.sp += Math.max(0, (this.level - 10) * SP_PER_LEVEL) + 1;
    this.recompute();
    this.hp = this.stats.maxHp;
    this.mp = this.stats.maxMp;
    return { ok: true, job };
  }

  /* --------------------------------------------------------- buffs / hp -- */

  applyBuff(buff: Buff): void {
    const existing = this.buffs.findIndex((b) => b.id === buff.id);
    if (existing >= 0) this.buffs[existing] = buff;
    else this.buffs.push(buff);
    this.recompute();
  }

  removeBuff(id: string): void {
    const before = this.buffs.length;
    this.buffs = this.buffs.filter((b) => b.id !== id);
    if (this.buffs.length !== before) this.recompute();
  }

  buffFrom(def: SkillDef, level: number): Buff {
    const stats = skillLevel(def, level);
    const block = emptyStats();
    if (stats?.stats) addStats(block, stats.stats);
    return {
      id: def.id,
      name: def.name,
      stats: block,
      remaining: (stats?.duration ?? 0) / 1000,
      durationSec: (stats?.duration ?? 0) / 1000,
      mpShield: stats?.mpShield,
      regenPercent: stats?.healPercent,
      attackSpeedScale: stats?.attackSpeedScale,
      icon: def.icon,
    };
  }

  heal(amount: number): number {
    const before = this.hp;
    this.hp = Math.min(this.stats.maxHp, this.hp + amount);
    return this.hp - before;
  }

  restoreMp(amount: number): number {
    const before = this.mp;
    this.mp = Math.min(this.stats.maxMp, this.mp + amount);
    return this.mp - before;
  }

  spendMp(amount: number): boolean {
    if (this.mp < amount) return false;
    this.mp -= amount;
    return true;
  }

  /**
   * Take damage. Magic Guard-style buffs divert most of it to MP, which is
   * what lets a paper-thin mage survive at all.
   */
  takeDamage(amount: number): number {
    let remaining = amount;
    const shield = this.buffs.find((b) => b.mpShield)?.mpShield ?? 0;
    if (shield > 0) {
      const toMp = Math.floor(remaining * shield);
      const absorbed = Math.min(this.mp, toMp);
      this.mp -= absorbed;
      remaining -= absorbed;
    }
    this.hp = Math.max(0, this.hp - Math.floor(remaining));
    this.flash = 1;
    if (this.hp <= 0 && !this.dead) {
      this.dead = true;
      this.deadTime = 0;
      this.body.state = 'dead';
    }
    return Math.floor(remaining);
  }

  /** Apply the EXP penalty and return how much was lost. */
  applyDeathPenalty(hasCharm = false): number {
    const rate = deathExpPenalty(this.level, hasCharm);
    if (rate <= 0) return 0;
    const lost = Math.floor(expToNext(this.level) * rate);
    const actual = Math.min(this.exp, lost);
    this.exp -= actual;
    return actual;
  }

  revive(fraction = 0.5): void {
    this.dead = false;
    this.deadTime = 0;
    this.hp = Math.max(1, Math.floor(this.stats.maxHp * fraction));
    this.mp = Math.max(1, Math.floor(this.stats.maxMp * fraction));
    this.body.state = 'stand';
    this.body.iframe = 2;
  }

  /* ------------------------------------------------------------- update -- */

  update(dt: number): void {
    this.flash = Math.max(0, this.flash - dt * 5);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.potionCooldown = Math.max(0, this.potionCooldown - dt);

    for (const [id, left] of this.skillCooldowns) {
      const next = left - dt;
      if (next <= 0) this.skillCooldowns.delete(id);
      else this.skillCooldowns.set(id, next);
    }

    if (this.attackAnim !== null) {
      this.attackAnim += dt / 0.36;
      if (this.attackAnim >= 1) {
        this.attackAnim = null;
        this.attackSkill = null;
      }
    }

    if (this.dead) {
      this.deadTime += dt;
      return;
    }

    // Buff ticking, including regeneration buffs.
    let expired = false;
    for (const b of this.buffs) {
      b.remaining -= dt;
      if (b.regenPercent) this.heal(this.stats.maxHp * b.regenPercent * dt * 0.2);
      if (b.remaining <= 0) expired = true;
    }
    if (expired) {
      this.buffs = this.buffs.filter((b) => b.remaining > 0);
      this.recompute();
    }
  }

  /* ------------------------------------------------------------ attacks -- */

  canAttack(): boolean {
    return !this.dead && this.attackCooldown <= 0 && this.body.state !== 'climb';
  }

  /** Begin a basic weapon attack. */
  startBasicAttack(): AttackSpec {
    this.attackCooldown = this.weaponDelay() / 1000;
    this.attackAnim = 0;
    this.attackSkill = null;
    const weapon = this.weaponType();
    return {
      skillId: null,
      damagePercent: 100,
      attackCount: 1,
      mobCount: 1,
      range: this.weaponRange(),
      element: 'neutral',
      ranged: isRangedWeapon(weapon),
    };
  }

  /**
   * Begin a skill attack, or return null if it can't be used right now
   * (not learned, not enough MP, on cooldown, wrong weapon).
   */
  startSkill(id: string): AttackSpec | null {
    const def = trySkill(id);
    if (!def || def.type !== 'attack') return null;
    const lv = this.skillLevelOf(id);
    if (lv < 1) return null;
    if (this.skillCooldowns.has(id)) return null;
    if (def.weapons && !def.weapons.includes(this.weaponType())) return null;

    const stats = skillLevel(def, lv);
    if (!stats) return null;
    if (this.mp < stats.mpCost) return null;
    if (stats.hpCost && this.hp <= stats.hpCost) return null;

    this.mp -= stats.mpCost;
    if (stats.hpCost) this.hp = Math.max(1, this.hp - stats.hpCost);
    if (stats.cooldown) this.skillCooldowns.set(id, stats.cooldown / 1000);

    this.attackCooldown = this.weaponDelay() / 1000;
    this.attackAnim = 0;
    this.attackSkill = id;

    return {
      skillId: id,
      damagePercent: stats.damage ?? 100,
      attackCount: stats.attackCount ?? 1,
      mobCount: stats.mobCount ?? 1,
      range: stats.range ?? this.weaponRange(),
      element: def.element,
      ranged: (stats.range ?? this.weaponRange()) > 150,
    };
  }

  /** Cast a non-attack skill (buff or heal). Returns true if it fired. */
  castSupport(id: string): boolean {
    const def = trySkill(id);
    if (!def) return false;
    if (def.type !== 'buff' && def.type !== 'heal') return false;
    const lv = this.skillLevelOf(id);
    if (lv < 1) return false;
    const stats = skillLevel(def, lv);
    if (!stats || this.mp < stats.mpCost) return false;
    if (this.skillCooldowns.has(id)) return false;

    this.mp -= stats.mpCost;
    if (stats.hpCost) this.hp = Math.max(1, this.hp - stats.hpCost);
    if (stats.cooldown) this.skillCooldowns.set(id, stats.cooldown / 1000);

    if (def.type === 'heal' && stats.healPercent) {
      this.heal(this.stats.maxHp * stats.healPercent);
    } else {
      this.applyBuff(this.buffFrom(def, lv));
    }
    return true;
  }

  /** Requirement check for wearing an item, using base + equipped stats. */
  canWear(itemId: string): boolean {
    return checkRequirements(itemId, {
      level: this.level,
      str: this.stats.str,
      dex: this.stats.dex,
      int: this.stats.int,
      luk: this.stats.luk,
      branch: this.branch,
    }).ok;
  }
}

function isRangedWeapon(w: WeaponType): boolean {
  return w === 'bow' || w === 'crossbow' || w === 'gun' || w === 'claw' || w === 'wand' || w === 'staff';
}

/** Map a mechanical weapon type onto the avatar's drawn weapon. */
const WEAPON_ART: Record<WeaponType, WeaponArt> = {
  none: 'none',
  oneHandSword: 'sword', twoHandSword: 'sword',
  oneHandAxe: 'axe', twoHandAxe: 'axe',
  oneHandBlunt: 'axe', twoHandBlunt: 'axe',
  spear: 'spear', polearm: 'spear',
  dagger: 'sword', claw: 'claw',
  bow: 'bow', crossbow: 'bow',
  knuckle: 'claw', gun: 'gun',
  wand: 'wand', staff: 'wand',
};
