/**
 * UI state and the hook interface windows use to act on the game.
 *
 * Windows never mutate game state directly — they call hooks. That keeps every
 * state change in one place (Game) and makes the windows pure drawing code.
 */
import type { ItemTab } from '../data/items';
import type { EquippedSlot } from '../game/equipment';
import type { BaseStats } from '../game/stats';

export type WindowId =
  | 'inventory' | 'equip' | 'stats' | 'skills' | 'quests'
  | 'worldmap' | 'help' | 'shop' | 'dialogue' | 'advance' | 'system';

export interface DialogueSession {
  npcId: string;
  /** Current node id, or a synthetic quest node. */
  node: string;
  /** Quest being offered or turned in, when the node is a quest node. */
  questId?: string;
  mode: 'node' | 'quest-offer' | 'quest-progress' | 'quest-complete';
}

export interface UiState {
  open: Set<WindowId>;
  invTab: ItemTab;
  /** Selected inventory slot within the current tab, or -1. */
  invSelected: number;
  selectedSkill: string | null;
  /** Skill ids bound to number keys 1..8. */
  quickSlots: (string | null)[];
  dialogue: DialogueSession | null;
  shopNpc: string | null;
  /** Scroll offsets for list windows. */
  scroll: Record<string, number>;
  /** Which region the world map is showing. */
  worldMapRegion: string | null;
}

export function newUiState(): UiState {
  return {
    open: new Set(),
    invTab: 'equip',
    invSelected: -1,
    selectedSkill: null,
    quickSlots: [null, null, null, null, null, null, null, null],
    dialogue: null,
    shopNpc: null,
    scroll: {},
    worldMapRegion: null,
  };
}

export interface UiHooks {
  useItem(tab: ItemTab, index: number): void;
  equipItem(index: number): void;
  unequipSlot(slot: EquippedSlot): void;
  dropItem(tab: ItemTab, index: number): void;
  sortTab(tab: ItemTab): void;
  allocateAp(stat: keyof BaseStats): void;
  learnSkill(id: string): void;
  castSkill(id: string): void;
  bindQuickSlot(index: number, skillId: string | null): void;
  advanceJob(jobId: number): void;
  dialogueOption(index: number): void;
  closeDialogue(): void;
  buy(itemId: string, qty: number): void;
  sell(tab: ItemTab, index: number): void;
  startQuest(id: string): void;
  completeQuest(id: string): void;
  abandonQuest(id: string): void;
  log(text: string, color?: string): void;
}

export function toggleWindow(state: UiState, id: WindowId): void {
  if (state.open.has(id)) state.open.delete(id);
  else state.open.add(id);
}

/** True when a window is capturing input (movement should still work). */
export function isModal(state: UiState): boolean {
  return state.open.has('dialogue') || state.open.has('shop') ||
         state.open.has('advance') || state.open.has('system');
}
