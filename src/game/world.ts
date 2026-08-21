/**
 * The live state of one map: monsters, spawn timers, ground items, effects.
 *
 * A World is created when the player enters a map and discarded when they
 * leave, which is exactly how the genre works — nothing persists in a map you
 * are not standing in, so monsters are always fresh when you return.
 */
import type { Rng } from '../engine/rng';
import { IFRAME_TIME } from '../physics/constants';
import { Terrain, applyKnockback } from '../physics/body';
import { fhYAt } from '../physics/foothold';
import type { GameMap, NpcPlacement, Portal } from './types';
import { Mob, snapToGround } from './mob';
import { getMob } from '../data/mobs';
import { GroundItem, PICKUP_RANGE, isExpired, rollDrops, spawnDrops, stepDrop } from './drops';
import { EffectPool } from './effects';
import { DefenderProfile, resolveAttack, resolveIncoming } from './combat';
import { expLevelModifier } from '../data/expTable';
import type { Player } from './player';
import type { AttackSpec } from './player';
import { getItem } from '../data/items';
import { getNpc } from '../data/npcs';

export interface WorldCallbacks {
  log(text: string, color?: string): void;
  onLevelUp(levels: number): void;
  onKill(mobId: string): void;
  shake(amount: number): void;
}

/** How close the player must be to interact with an NPC or portal. */
export const INTERACT_RANGE = 44;

export class World {
  readonly map: GameMap;
  readonly terrain: Terrain;
  readonly mobs: Mob[] = [];
  drops: GroundItem[] = [];
  readonly effects = new EffectPool();

  /** Seconds until each spawn point may spawn again; <= 0 means ready. */
  private readonly spawnTimers: number[];
  /** Spawn index → the mob currently occupying it. */
  private readonly occupied = new Map<number, Mob>();
  /** Number of spawn points active after applying the map's mob rate. */
  private readonly activeSpawns: number;

  constructor(map: GameMap, private rng: Rng, private cb: WorldCallbacks) {
    this.map = map;
    this.terrain = {
      footholds: map.footholds,
      ladders: map.ladders,
      bounds: map.bounds,
    };
    this.spawnTimers = map.spawns.map(() => 0);
    this.activeSpawns = Math.max(
      map.spawns.length > 0 ? 1 : 0,
      Math.round(map.spawns.length * map.mobRate),
    );
    this.populate();
  }

  /** Fill the map on entry so it never looks empty when you walk in. */
  private populate(): void {
    for (let i = 0; i < this.activeSpawns; i++) this.spawnAt(i);
  }

  private spawnAt(index: number): void {
    const spawn = this.map.spawns[index];
    if (!spawn || this.occupied.has(index)) return;
    const def = getMob(spawn.mobId);
    const mob = new Mob(def, spawn.x, spawn.y, index, this.rng);
    snapToGround(mob, this.terrain);
    if (def.move === 'fly') mob.body.y = spawn.y - 70;
    this.mobs.push(mob);
    this.occupied.set(index, mob);
  }

  /* ------------------------------------------------------------- update -- */

  update(dt: number, player: Player): void {
    this.updateSpawns(dt);
    this.updateMobs(dt, player);
    this.updateTouchDamage(player);
    this.updateDrops(dt);
    this.effects.update(dt);
  }

  private updateSpawns(dt: number): void {
    for (let i = 0; i < this.activeSpawns; i++) {
      if (this.occupied.has(i)) continue;
      this.spawnTimers[i] -= dt;
      if (this.spawnTimers[i] <= 0) this.spawnAt(i);
    }
  }

  private updateMobs(dt: number, player: Player): void {
    const target = player.dead
      ? null
      : { x: player.body.x, y: player.body.y, alive: !player.dead };

    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const mob = this.mobs[i];
      mob.update(dt, this.terrain, target, this.rng);
      if (!mob.removable) continue;

      this.mobs.splice(i, 1);
      this.occupied.delete(mob.spawnIndex);
      const spawn = this.map.spawns[mob.spawnIndex];
      this.spawnTimers[mob.spawnIndex] =
        (spawn?.respawnMs ?? mob.def.respawnMs) / 1000;
    }
  }

  /**
   * Contact damage. Simply walking into a monster is the dominant source of
   * incoming damage in this genre, so this runs every tick against every mob.
   */
  private updateTouchDamage(player: Player): void {
    if (player.dead || player.body.iframe > 0) return;
    const pb = {
      left: player.body.x - player.body.width * 0.5,
      right: player.body.x + player.body.width * 0.5,
      top: player.body.y - player.body.height,
      bottom: player.body.y,
    };

    for (const mob of this.mobs) {
      if (!mob.alive || !mob.def.bodyAttack) continue;
      const mb = mob.bounds();
      if (mb.right < pb.left || mb.left > pb.right) continue;
      if (mb.bottom < pb.top || mb.top > pb.bottom) continue;

      const result = resolveIncoming(
        { attack: mob.def.pad, magic: false, level: mob.def.level },
        {
          level: player.level,
          wdef: player.stats.wdef,
          mdef: player.stats.mdef,
          avoid: player.stats.avoid,
        },
        this.rng,
      );

      if (result.miss) {
        this.effects.damage(player.body.x, player.body.y - 60, 0, 'miss');
        player.body.iframe = 0.25;
        return;
      }

      const dealt = player.takeDamage(result.damage);
      this.effects.damage(player.body.x, player.body.y - 60, dealt, 'taken');
      applyKnockback(player.body, mob.body.x, 1);
      player.body.iframe = IFRAME_TIME;
      this.cb.shake(0.25);

      if (player.dead) this.onPlayerDeath(player);
      return;
    }
  }

  private onPlayerDeath(player: Player): void {
    const lost = player.applyDeathPenalty();
    this.cb.log(
      lost > 0
        ? `You died. Lost ${lost.toLocaleString()} EXP.`
        : 'You died.',
      '#ff5d6c',
    );
  }

  private updateDrops(dt: number): void {
    for (const d of this.drops) stepDrop(d, dt, this.map.footholds);
    this.drops = this.drops.filter((d) => !isExpired(d));
  }

  /* ------------------------------------------------------------ attacks -- */

  /**
   * Resolve an attack the player just launched.
   *
   * Targets are the nearest `mobCount` monsters inside the attack box in front
   * of the character. Each hit rolls independently, which is why multi-hit
   * skills feel more consistent than single big ones.
   */
  performAttack(player: Player, spec: AttackSpec): void {
    const dir = player.body.facing;
    const originX = player.body.x;
    const originY = player.body.y - player.body.height * 0.5;
    const vertical = spec.ranged ? 90 : 62;

    const candidates = this.mobs
      .filter((mob) => {
        if (!mob.alive) return false;
        const dx = (mob.body.x - originX) * dir;
        // A small negative allowance so a mob overlapping you still gets hit.
        if (dx < -24 || dx > spec.range) return false;
        const b = mob.bounds();
        return b.bottom > originY - vertical && b.top < originY + vertical;
      })
      .sort((a, b) => Math.abs(a.body.x - originX) - Math.abs(b.body.x - originX))
      .slice(0, spec.mobCount);

    if (spec.ranged) {
      const style = projectileStyle(player);
      const colour = player.look.weaponColor;
      const targetX = candidates[0]?.body.x ?? originX + dir * spec.range;
      const targetY = candidates[0] ? candidates[0].headY() + 14 : originY;
      for (let i = 0; i < spec.attackCount; i++) {
        this.effects.shoot(originX + dir * 14, originY - 6, targetX, targetY, style, colour);
      }
    }

    if (candidates.length === 0) return;

    const profile = player.attackProfile();
    for (const mob of candidates) {
      const defender: DefenderProfile = {
        level: mob.def.level,
        wdef: mob.def.pdef,
        mdef: mob.def.mdef,
        avoid: mob.def.avoid,
        resist: mob.def.resist,
        isBoss: mob.def.boss,
      };
      const hits = resolveAttack(
        profile, defender,
        { damagePercent: spec.damagePercent, element: spec.element },
        spec.attackCount, this.rng,
      );

      let killed = false;
      hits.forEach((hit, i) => {
        if (hit.miss) {
          this.effects.damage(mob.body.x, mob.headY(), 0, 'miss', i);
          return;
        }
        this.effects.damage(mob.body.x, mob.headY(), hit.damage, hit.crit ? 'crit' : 'damage', i);
        this.effects.spark(
          mob.body.x - Math.sign(mob.body.x - originX) * 8,
          mob.body.y - mob.def.height * 0.5,
          hit.crit ? '#ff8a3d' : '#ffe9a8',
          hit.crit ? 22 : 15,
        );
        if (!killed && mob.takeDamage(hit.damage, originX)) killed = true;
      });

      if (killed) this.onMobKilled(mob, player);
    }
  }

  private onMobKilled(mob: Mob, player: Player): void {
    if (mob.dropsClaimed) return;
    mob.dropsClaimed = true;
    player.killCount++;

    const gained = Math.max(
      1,
      Math.floor(mob.def.exp * expLevelModifier(player.level, mob.def.level)),
    );
    const levels = player.gainExp(gained, this.rng);
    this.effects.notice(mob.body.x, mob.headY() - 18, `+${gained} EXP`, 'exp');
    if (levels > 0) this.cb.onLevelUp(levels);
    if (mob.def.boss) this.cb.shake(1);

    const rolls = rollDrops(mob.def, this.rng);
    const items = spawnDrops(rolls, mob.body.x, mob.body.y, this.rng);
    this.drops.push(...items);

    this.cb.onKill(mob.def.id);
  }

  /* ------------------------------------------------------------- pickup -- */

  /** Collect every drop within reach. Returns lines describing what was taken. */
  pickUp(player: Player): string[] {
    const taken: string[] = [];
    const remaining: GroundItem[] = [];

    for (const d of this.drops) {
      const near =
        Math.abs(d.x - player.body.x) < PICKUP_RANGE &&
        Math.abs(d.y - player.body.y) < PICKUP_RANGE + 10;
      if (!near || !d.landed) {
        remaining.push(d);
        continue;
      }

      if (d.kind === 'meso') {
        player.inventory.addMesos(d.qty);
        taken.push(`${d.qty.toLocaleString()} mesos`);
        this.effects.notice(d.x, d.y - 20, `+${d.qty} mesos`, 'notice');
        continue;
      }

      if (d.kind === 'equip' && d.inst) {
        if (!player.inventory.addEquip(d.inst)) {
          this.cb.log('Your equipment inventory is full.', '#ff5d6c');
          remaining.push(d);
          continue;
        }
        taken.push(getItem(d.itemId).name);
        this.effects.notice(d.x, d.y - 20, getItem(d.itemId).name, 'notice');
        continue;
      }

      const leftover = player.inventory.addStack(d.itemId, d.qty);
      if (leftover === d.qty) {
        this.cb.log(`Your ${getItem(d.itemId).tab.toUpperCase()} inventory is full.`, '#ff5d6c');
        remaining.push(d);
        continue;
      }
      const got = d.qty - leftover;
      taken.push(got > 1 ? `${getItem(d.itemId).name} x${got}` : getItem(d.itemId).name);
      this.effects.notice(d.x, d.y - 20, getItem(d.itemId).name, 'notice');
      if (leftover > 0) {
        d.qty = leftover;
        remaining.push(d);
      }
    }

    this.drops = remaining;
    return taken;
  }

  /* -------------------------------------------------------- interaction -- */

  portalNear(x: number, y: number, includeHidden = true): Portal | null {
    for (const p of this.map.portals) {
      if (p.type === 'spawn') continue;
      if (!includeHidden && p.type === 'hidden') continue;
      if (Math.abs(p.x - x) < INTERACT_RANGE && Math.abs(p.y - y) < INTERACT_RANGE + 20) {
        return p;
      }
    }
    return null;
  }

  npcNear(x: number, y: number): NpcPlacement | null {
    for (const npc of this.map.npcs) {
      if (Math.abs(npc.x - x) < INTERACT_RANGE && Math.abs(npc.y - y) < INTERACT_RANGE + 20) {
        return npc;
      }
    }
    return null;
  }

  /** Place an entity on the ground beneath a point — used on map entry. */
  groundAt(x: number, y: number): number {
    const fh = this.map.footholds.groundBelow(x, y - 60, 0);
    return fh ? fhYAt(fh, x) : y;
  }

  /** Monsters that should show a floating HP bar (recently damaged). */
  livingMobs(): Mob[] {
    return this.mobs;
  }
}

/** Pick the projectile look from what the character is holding. */
function projectileStyle(player: Player): 'bolt' | 'orb' | 'arrow' | 'star' {
  switch (player.weaponType()) {
    case 'bow':
    case 'crossbow': return 'arrow';
    case 'claw': return 'star';
    case 'wand':
    case 'staff': return 'orb';
    default: return 'bolt';
  }
}

/** Look up an NPC definition for a placement. */
export function npcDefOf(placement: NpcPlacement) {
  return getNpc(placement.npcId);
}
