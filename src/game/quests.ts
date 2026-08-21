/**
 * Quest tracking.
 *
 * Kill objectives are counted as they happen; item objectives are checked
 * against the inventory at turn-in, so a player who already had the items
 * can hand them straight over.
 */
import type { QuestDef } from '../data/quests';
import { QUESTS, getQuest, questsForNpc } from '../data/quests';
import type { Inventory } from './inventory';
import type { Player } from './player';

export type QuestState = 'locked' | 'available' | 'active' | 'ready' | 'done';

export interface ActiveQuest {
  id: string;
  /** mobId → kills so far. */
  kills: Record<string, number>;
}

export class QuestLog {
  readonly active = new Map<string, ActiveQuest>();
  readonly completed = new Set<string>();

  /** Where a quest stands for this character right now. */
  stateOf(id: string, player: Player, inv: Inventory): QuestState {
    if (this.completed.has(id)) return 'done';
    const def = getQuest(id);
    const entry = this.active.get(id);
    if (entry) return this.objectivesMet(def, entry, inv) ? 'ready' : 'active';
    return this.meetsRequirements(def, player) ? 'available' : 'locked';
  }

  private meetsRequirements(def: QuestDef, player: Player): boolean {
    const r = def.requires;
    if (r.minLevel !== undefined && player.level < r.minLevel) return false;
    if (r.maxLevel !== undefined && player.level > r.maxLevel) return false;
    if (r.jobs && !r.jobs.includes(player.jobId)) return false;
    if (r.quests && !r.quests.every((q) => this.completed.has(q))) return false;
    return true;
  }

  objectivesMet(def: QuestDef, entry: ActiveQuest, inv: Inventory): boolean {
    for (const [mobId, needed] of Object.entries(def.objectives.kills ?? {})) {
      if ((entry.kills[mobId] ?? 0) < needed) return false;
    }
    for (const [itemId, needed] of Object.entries(def.objectives.items ?? {})) {
      if (inv.countOf(itemId) < needed) return false;
    }
    return true;
  }

  start(id: string): boolean {
    if (this.active.has(id) || this.completed.has(id)) return false;
    this.active.set(id, { id, kills: {} });
    return true;
  }

  /** Record a kill against every active quest that wants it. */
  recordKill(mobId: string): string[] {
    const advanced: string[] = [];
    for (const entry of this.active.values()) {
      const def = getQuest(entry.id);
      const needed = def.objectives.kills?.[mobId];
      if (needed === undefined) continue;
      const current = entry.kills[mobId] ?? 0;
      if (current >= needed) continue;
      entry.kills[mobId] = current + 1;
      advanced.push(entry.id);
    }
    return advanced;
  }

  /**
   * Hand in a quest: consumes the required items and marks it done.
   * Returns false if the objectives are not actually met.
   */
  complete(id: string, inv: Inventory): boolean {
    const entry = this.active.get(id);
    if (!entry) return false;
    const def = getQuest(id);
    if (!this.objectivesMet(def, entry, inv)) return false;
    for (const [itemId, qty] of Object.entries(def.objectives.items ?? {})) {
      inv.consume(itemId, qty);
    }
    this.active.delete(id);
    this.completed.add(id);
    return true;
  }

  abandon(id: string): boolean {
    return this.active.delete(id);
  }

  /** Quests this NPC can offer or take a turn-in for, in that order. */
  forNpc(npcId: string, player: Player, inv: Inventory): { def: QuestDef; state: QuestState }[] {
    return questsForNpc(npcId)
      .map((def) => ({ def, state: this.stateOf(def.id, player, inv) }))
      .filter(({ def, state }) =>
        (state === 'available' && def.npcStart === npcId) ||
        ((state === 'active' || state === 'ready') && def.npcEnd === npcId))
      // Turn-ins first: a player standing at an NPC usually came to hand something in.
      .sort((a, b) => rank(a.state) - rank(b.state));
  }

  /** Progress lines for the quest window, e.g. "Field Boar 12/20". */
  progressLines(id: string, inv: Inventory): { label: string; have: number; need: number }[] {
    const def = getQuest(id);
    const entry = this.active.get(id);
    const lines: { label: string; have: number; need: number }[] = [];
    for (const [mobId, need] of Object.entries(def.objectives.kills ?? {})) {
      lines.push({ label: mobId, have: entry?.kills[mobId] ?? 0, need });
    }
    for (const [itemId, need] of Object.entries(def.objectives.items ?? {})) {
      lines.push({ label: itemId, have: inv.countOf(itemId), need });
    }
    return lines;
  }

  activeQuests(): QuestDef[] {
    return [...this.active.keys()].map(getQuest);
  }

  /** Quests the player could take right now, for the "!" marker over NPCs. */
  availableCount(player: Player, inv: Inventory): number {
    return QUESTS.filter((q) => this.stateOf(q.id, player, inv) === 'available').length;
  }

  toJSON(): { active: ActiveQuest[]; completed: string[] } {
    return { active: [...this.active.values()], completed: [...this.completed] };
  }

  static fromJSON(data: { active: ActiveQuest[]; completed: string[] }): QuestLog {
    const log = new QuestLog();
    for (const entry of data.active ?? []) log.active.set(entry.id, entry);
    for (const id of data.completed ?? []) log.completed.add(id);
    return log;
  }
}

function rank(state: QuestState): number {
  return state === 'ready' ? 0 : state === 'active' ? 1 : 2;
}
