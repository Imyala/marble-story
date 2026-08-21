/**
 * Top-level orchestration: owns the player, the current world, the camera,
 * input routing, the UI, and persistence.
 *
 * The split is deliberate — systems below this file never reach for global
 * state, so they stay testable and a client/server split stays possible.
 */
import { GameLoop } from '../engine/loop';
import { Input } from '../engine/input';
import { Camera } from '../engine/camera';
import { Renderer, VIEW_H, VIEW_W } from '../engine/renderer';
import { Rng } from '../engine/rng';
import { MoveIntent, stepBody } from '../physics/body';
import { PAL } from '../art/palette';
import { drawScene, drawVignette } from '../render/scene';
import { drawDeathOverlay, drawHud, drawLevelUp, HudState, LogLine } from '../ui/hud';
import { UiInput } from '../ui/imgui';
import { drawEquipment, drawInventory, drawQuests, drawSkills, drawStats, rewardLines } from '../ui/windows';
import { DialogueView, drawAdvancement, drawDialogue, drawHelp, drawShop, drawWorldMap } from '../ui/dialogs';
import { isModal, newUiState, UiHooks, UiState, WindowId } from '../ui/state';
import { Player } from './player';
import { QuestLog } from './quests';
import { World } from './world';
import { loadMap, STARTING_MAP } from '../data/maps';
import { findPortal, Portal, spawnPortal } from './types';
import { getNpc, DialogueAction, NpcDef } from '../data/npcs';
import { getQuest } from '../data/quests';
import { getMob } from '../data/mobs';
import { ItemTab, getItem, sellPrice } from '../data/items';
import { EquippedSlot } from './equipment';
import { applyScroll } from './equipment';
import { BaseStats, emptyStats } from './stats';
import { trySkill } from '../data/skills';
import { clearSave, loadRaw, restore, save, serialise } from './save';
import { createStarterCharacter } from './newgame';

const AUTOSAVE_INTERVAL = 25;
/** How long the map-transition fade takes, each way. */
const FADE_TIME = 0.22;

export class Game {
  private readonly renderer: Renderer;
  private readonly cam = new Camera(VIEW_W, VIEW_H);
  private readonly input = new Input();
  private readonly ui = new UiInput();
  private readonly loop: GameLoop;
  private readonly rng = new Rng((Math.random() * 0xffffffff) >>> 0);

  player: Player;
  quests: QuestLog;
  world!: World;
  mapId = STARTING_MAP;

  private readonly uiState: UiState = newUiState();
  private readonly log: LogLine[] = [];
  private levelUpTimer = 0;
  private autosaveTimer = AUTOSAVE_INTERVAL;
  private time = 0;

  /** Pending map change, applied at the midpoint of the fade. */
  private pendingWarp: { mapId: string; portal: string } | null = null;
  private fade = 0;
  private fadingOut = false;

  /** Actions for the dialogue options currently on screen. */
  private dialogueActions: (() => void)[] = [];
  private dialogueView: DialogueView | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);

    const saved = loadRaw();
    if (saved) {
      const restored = restore(saved);
      this.player = restored.player;
      this.quests = restored.quests;
      this.mapId = restored.mapId;
      this.uiState.quickSlots = restored.quickSlots;
      this.enterMap(restored.mapId, restored.portalName, true);
      this.pushLog('Welcome back.', PAL.exp);
    } else {
      const fresh = createStarterCharacter(this.rng);
      this.player = fresh.player;
      this.quests = new QuestLog();
      this.uiState.quickSlots = fresh.quickSlots;
      this.enterMap(STARTING_MAP, 'spawn', true);
      this.pushLog('Press F1 for controls. Talk to Mira to get started.', PAL.gold);
    }

    this.bindPointer(canvas);
    this.loop = new GameLoop({
      update: (dt) => this.update(dt),
      render: (alpha, frameDt) => this.render(alpha, frameDt),
    });
  }

  start(): void {
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
    this.input.destroy();
    this.renderer.destroy();
  }

  /* ---------------------------------------------------------- pointer -- */

  private bindPointer(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('mousemove', (e) => {
      const p = this.renderer.toViewSpace(e.clientX, e.clientY);
      this.ui.move(p.x, p.y);
    });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.ui.press();
      if (e.button === 2) this.ui.rightPress();
    });
    canvas.addEventListener('mouseup', () => this.ui.release());
    canvas.addEventListener('dblclick', () => this.ui.doublePress());
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.ui.scroll(e.deltaY * 0.5);
    }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('mouseleave', () => this.ui.move(-999, -999));
  }

  /* ----------------------------------------------------------- update -- */

  private update(dt: number): void {
    this.time += dt;
    this.updateFade(dt);
    this.updateLog(dt);

    if (this.levelUpTimer > 0) this.levelUpTimer -= dt * 0.6;

    this.handleWindowKeys();

    const frozen = isModal(this.uiState) || this.player.dead || this.fade > 0;
    const intent = frozen ? { moveX: 0, moveY: 0, jump: false } : this.readIntent();

    if (!frozen) this.handleActionKeys();

    this.player.update(dt);
    stepBody(this.player.body, intent, dt, this.world.terrain);
    this.world.update(dt, this.player);

    // Falling out of the world is a map-design failure, not a death; put the
    // player back at the spawn portal rather than punishing them for it.
    if (this.player.body.fellOut) {
      this.player.body.fellOut = false;
      this.placeAtPortal(spawnPortal(this.world.map));
      this.player.takeDamage(Math.floor(this.player.stats.maxHp * 0.1));
      this.pushLog('You fell out of the map.', PAL.dmgTaken);
    }

    this.cam.follow(this.player.body.x, this.player.body.y, this.world.map.bounds, dt);

    this.autosaveTimer -= dt;
    if (this.autosaveTimer <= 0) {
      this.autosaveTimer = AUTOSAVE_INTERVAL;
      this.saveGame(false);
    }

    this.input.endTick();
  }

  private updateFade(dt: number): void {
    if (this.fadingOut) {
      this.fade += dt / FADE_TIME;
      if (this.fade >= 1) {
        this.fade = 1;
        this.fadingOut = false;
        if (this.pendingWarp) {
          this.enterMap(this.pendingWarp.mapId, this.pendingWarp.portal, true);
          this.pendingWarp = null;
        }
      }
    } else if (this.fade > 0) {
      this.fade = Math.max(0, this.fade - dt / FADE_TIME);
    }
  }

  private updateLog(dt: number): void {
    for (const line of this.log) line.life -= dt;
    while (this.log.length > 40) this.log.shift();
  }

  private readIntent(): MoveIntent {
    const jump = this.input.pressed('jump');
    if (jump) this.input.consume('jump');
    return {
      moveX: this.input.moveAxis(),
      moveY: this.input.verticalAxis(),
      jump,
    };
  }

  /* ------------------------------------------------------- input: keys -- */

  private handleWindowKeys(): void {
    const toggles: [Parameters<Input['pressed']>[0], WindowId][] = [
      ['uiInventory', 'inventory'],
      ['uiStats', 'stats'],
      ['uiSkills', 'skills'],
      ['uiQuests', 'quests'],
      ['uiEquip', 'equip'],
      ['uiHelp', 'help'],
    ];

    if (isModal(this.uiState)) {
      // While a modal is up, the number keys pick dialogue options.
      for (let i = 0; i < 8; i++) {
        const action = (`skill${i + 1}`) as 'skill1';
        if (this.input.pressed(action)) {
          this.input.consume(action);
          this.dialogueActions[i]?.();
        }
      }
      if (this.input.pressed('uiClose')) {
        this.input.consume('uiClose');
        this.closeDialogue();
      }
      return;
    }

    for (const [action, id] of toggles) {
      if (!this.input.pressed(action)) continue;
      this.input.consume(action);
      if (this.uiState.open.has(id)) this.uiState.open.delete(id);
      else this.uiState.open.add(id);
    }

    if (this.input.pressed('uiMinimap')) {
      this.input.consume('uiMinimap');
      if (this.uiState.open.has('worldmap')) this.uiState.open.delete('worldmap');
      else this.uiState.open.add('worldmap');
    }

    if (this.input.pressed('uiClose')) {
      this.input.consume('uiClose');
      if (this.uiState.open.size > 0) this.uiState.open.clear();
    }
  }

  private handleActionKeys(): void {
    // Up interacts with a portal or an NPC before it reaches the climb code.
    if (this.input.pressed('up') && this.tryInteract()) {
      this.input.consume('up');
    }

    if (this.input.down('attack') && this.player.canAttack()) {
      this.world.performAttack(this.player, this.player.startBasicAttack());
    }

    for (let i = 0; i < 8; i++) {
      const action = (`skill${i + 1}`) as 'skill1';
      if (!this.input.pressed(action)) continue;
      this.input.consume(action);
      const skillId = this.uiState.quickSlots[i];
      if (skillId) this.castSkill(skillId);
    }

    if (this.input.pressed('pickup')) {
      this.input.consume('pickup');
      const taken = this.world.pickUp(this.player);
      for (const line of taken) this.pushLog(`Picked up ${line}.`, PAL.text);
    }

    if (this.input.pressed('potionHp')) {
      this.input.consume('potionHp');
      this.useFirstPotion('hp');
    }
    if (this.input.pressed('potionMp')) {
      this.input.consume('potionMp');
      this.useFirstPotion('mp');
    }
  }

  /** Enter a portal or start a conversation. Returns true if something happened. */
  private tryInteract(): boolean {
    const { x, y } = this.player.body;
    const portal = this.world.portalNear(x, y);
    if (portal) {
      this.usePortal(portal);
      return true;
    }
    const npc = this.world.npcNear(x, y);
    if (npc) {
      this.openDialogue(npc.npcId);
      return true;
    }
    return false;
  }

  private castSkill(skillId: string): void {
    const def = trySkill(skillId);
    if (!def) return;
    if (def.type === 'attack') {
      if (!this.player.canAttack()) return;
      const spec = this.player.startSkill(skillId);
      if (!spec) {
        this.pushLog(`Cannot use ${def.name} right now.`, PAL.textDim);
        return;
      }
      this.world.performAttack(this.player, spec);
      return;
    }
    if (this.player.castSupport(skillId)) {
      this.pushLog(`${def.name} activated.`, def.icon.color);
    } else {
      this.pushLog(`Cannot use ${def.name} right now.`, PAL.textDim);
    }
  }

  private useFirstPotion(kind: 'hp' | 'mp'): void {
    if (this.player.potionCooldown > 0) return;
    const slots = this.player.inventory.tabs.use;
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot?.kind !== 'stack') continue;
      const use = getItem(slot.itemId).use;
      if (!use) continue;
      const matches = kind === 'hp'
        ? (use.hp ?? 0) > 0 || (use.hpPercent ?? 0) > 0
        : (use.mp ?? 0) > 0 || (use.mpPercent ?? 0) > 0;
      if (!matches) continue;
      this.hooks.useItem('use', i);
      return;
    }
    this.pushLog(`No ${kind.toUpperCase()} potions.`, PAL.textDim);
  }

  /* ------------------------------------------------------------- maps -- */

  private enterMap(mapId: string, portalName: string, immediate: boolean): void {
    const map = loadMap(mapId);
    this.mapId = mapId;
    this.world = new World(map, this.rng, {
      log: (t, c) => this.pushLog(t, c),
      onLevelUp: (levels) => this.onLevelUp(levels),
      onKill: (mobId) => this.onKill(mobId),
      shake: (amount) => this.cam.addShake(amount),
    });

    const portal = findPortal(map, portalName) ?? spawnPortal(map);
    this.placeAtPortal(portal);
    if (immediate) {
      this.cam.snapTo(this.player.body.x, this.player.body.y, map.bounds);
    }
    this.pushLog(`— ${map.name} —`, map.town ? '#7fd8e8' : PAL.textDim);
    this.saveGame(false);
  }

  private placeAtPortal(portal: Portal): void {
    this.player.body.x = portal.x;
    this.player.body.y = this.world.groundAt(portal.x, portal.y);
    this.player.body.vx = 0;
    this.player.body.vy = 0;
    this.player.body.fh = null;
    this.player.body.ladder = null;
    this.player.body.state = 'fall';
    this.player.body.iframe = 1.2;
  }

  private usePortal(portal: Portal): void {
    if (!portal.toMap) return;
    if (portal.requireLevel && this.player.level < portal.requireLevel) {
      this.pushLog(`You need to be level ${portal.requireLevel} to go this way.`, PAL.hp);
      return;
    }
    if (portal.requireQuest && !this.quests.completed.has(portal.requireQuest)) {
      this.pushLog('Something is stopping you from going this way.', PAL.hp);
      return;
    }
    this.warpTo(portal.toMap, portal.toPortal ?? 'spawn');
  }

  warpTo(mapId: string, portalName: string): void {
    if (this.pendingWarp) return;
    this.pendingWarp = { mapId, portal: portalName };
    this.fadingOut = true;
    this.uiState.open.clear();
    this.closeDialogue();
  }

  /* ---------------------------------------------------------- feedback -- */

  private onLevelUp(levels: number): void {
    this.levelUpTimer = 1;
    this.cam.addShake(0.3);
    this.pushLog(
      levels > 1 ? `Level up! You are now level ${this.player.level}.` : `Level up! Level ${this.player.level}.`,
      PAL.gold,
    );
  }

  private onKill(mobId: string): void {
    const advanced = this.quests.recordKill(mobId);
    for (const questId of advanced) {
      const def = getQuest(questId);
      const lines = this.quests.progressLines(questId, this.player.inventory);
      const line = lines.find((l) => l.label === mobId);
      if (!line) continue;
      if (line.have >= line.need) {
        this.pushLog(`${def.name}: objective complete.`, PAL.exp);
      }
    }
  }

  pushLog(text: string, color: string = PAL.text): void {
    this.log.push({ text, color, life: 6 });
  }

  /* --------------------------------------------------------- dialogue -- */

  private openDialogue(npcId: string): void {
    this.uiState.dialogue = { npcId, node: getNpc(npcId).root, mode: 'node' };
    this.uiState.open.add('dialogue');
  }

  private closeDialogue(): void {
    this.uiState.dialogue = null;
    this.uiState.shopNpc = null;
    this.uiState.open.delete('dialogue');
    this.uiState.open.delete('shop');
    this.uiState.open.delete('advance');
    this.dialogueActions = [];
  }

  /**
   * Build the dialogue view for this frame, and the matching action list.
   *
   * Quest offers and turn-ins are injected into the NPC's root node so adding
   * a quest never means editing an NPC script.
   */
  private buildDialogue(): DialogueView | null {
    const session = this.uiState.dialogue;
    if (!session) return null;
    const npc = getNpc(session.npcId);
    const actions: (() => void)[] = [];
    const options: { label: string; enabled: boolean }[] = [];
    let body = '';

    const push = (label: string, fn: () => void, enabled = true): void => {
      options.push({ label, enabled });
      actions.push(enabled ? fn : () => {});
    };

    if (session.mode !== 'node' && session.questId) {
      const quest = getQuest(session.questId);
      const rewards = rewardLines(session.questId).join(', ');

      if (session.mode === 'quest-offer') {
        body = `${quest.offerText}\n\nReward: ${rewards}`;
        push('Accept.', () => {
          this.quests.start(quest.id);
          this.pushLog(`Quest started: ${quest.name}`, PAL.exp);
          session.mode = 'node';
          session.node = npc.root;
        });
        push('Not right now.', () => {
          session.mode = 'node';
          session.node = npc.root;
        });
      } else if (session.mode === 'quest-progress') {
        const lines = this.quests
          .progressLines(quest.id, this.player.inventory)
          .map((l) => `  ${objectiveName(l.label)}  ${Math.min(l.have, l.need)}/${l.need}`)
          .join('\n');
        body = `${quest.progressText}\n\n${lines}`;
        push('Back.', () => {
          session.mode = 'node';
          session.node = npc.root;
        });
      } else {
        body = `${quest.completeText}\n\nReward: ${rewards}`;
        push('Take the reward.', () => {
          this.completeQuest(quest.id);
          session.mode = 'node';
          session.node = npc.root;
        });
      }
      return { npcName: npc.name, npcTitle: npc.title, look: npc.look, body, options };
    }

    const node = npc.nodes[session.node] ?? npc.nodes[npc.root];
    body = node.text;

    // Quest entries first — a player at an NPC usually came to hand something in.
    if (session.node === npc.root) {
      for (const entry of this.quests.forNpc(npc.id, this.player, this.player.inventory)) {
        const label =
          entry.state === 'available' ? `[!] ${entry.def.name}` :
          entry.state === 'ready' ? `[✓] ${entry.def.name}` :
          `[…] ${entry.def.name}`;
        push(label, () => {
          session.questId = entry.def.id;
          session.mode =
            entry.state === 'available' ? 'quest-offer' :
            entry.state === 'ready' ? 'quest-complete' : 'quest-progress';
        });
      }
    }

    for (const opt of node.options ?? [{ label: 'Goodbye.', action: { kind: 'close' } as DialogueAction }]) {
      const enabled = this.optionEnabled(opt.requires);
      push(opt.label, () => this.runDialogueOption(opt.next, opt.action, npc), enabled);
    }

    this.dialogueActions = actions;
    return { npcName: npc.name, npcTitle: npc.title, look: npc.look, body, options };
  }

  private optionEnabled(req: { minLevel?: number; noJob?: boolean; hasJob?: boolean } | undefined): boolean {
    if (!req) return true;
    if (req.minLevel !== undefined && this.player.level < req.minLevel) return false;
    if (req.noJob && this.player.jobId !== 0) return false;
    if (req.hasJob && this.player.jobId === 0) return false;
    return true;
  }

  private runDialogueOption(next: string | undefined, action: DialogueAction | undefined, npc: NpcDef): void {
    if (action) {
      switch (action.kind) {
        case 'close':
          this.closeDialogue();
          return;
        case 'shop':
          this.uiState.shopNpc = npc.id;
          this.uiState.open.add('shop');
          this.uiState.open.delete('dialogue');
          return;
        case 'advance':
          this.uiState.open.add('advance');
          this.uiState.open.delete('dialogue');
          return;
        case 'heal':
          if (!this.player.inventory.spendMesos(action.cost)) {
            this.pushLog('You cannot afford that.', PAL.hp);
            return;
          }
          this.player.hp = this.player.stats.maxHp;
          this.player.mp = this.player.stats.maxMp;
          this.pushLog('Fully restored.', PAL.exp);
          this.closeDialogue();
          return;
        case 'expand':
          if (this.player.inventory.capacityOf(action.tab) >= 96) {
            this.pushLog('That pack is already as big as it gets.', PAL.textDim);
            return;
          }
          if (!this.player.inventory.spendMesos(action.cost)) {
            this.pushLog('You cannot afford that.', PAL.hp);
            return;
          }
          this.player.inventory.expand(action.tab, 8);
          this.pushLog(`${action.tab.toUpperCase()} inventory expanded by 8 slots.`, PAL.exp);
          return;
        case 'warp':
          if (action.cost && !this.player.inventory.spendMesos(action.cost)) {
            this.pushLog('You cannot afford that.', PAL.hp);
            return;
          }
          this.warpTo(action.mapId, action.portal);
          return;
        case 'quest':
          if (this.uiState.dialogue) {
            this.uiState.dialogue.questId = action.questId;
            this.uiState.dialogue.mode = 'quest-offer';
          }
          return;
      }
    }
    if (next && this.uiState.dialogue) this.uiState.dialogue.node = next;
    else this.closeDialogue();
  }

  private completeQuest(questId: string): void {
    if (!this.quests.complete(questId, this.player.inventory)) {
      this.pushLog('You are not finished with that yet.', PAL.hp);
      return;
    }
    const quest = getQuest(questId);
    const r = quest.rewards;
    if (r.exp) {
      const levels = this.player.gainExp(r.exp, this.rng);
      if (levels > 0) this.onLevelUp(levels);
    }
    if (r.meso) this.player.inventory.addMesos(r.meso);
    if (r.sp) this.player.sp += r.sp;
    if (r.fame) this.player.fame += r.fame;
    for (const item of r.items ?? []) {
      const left = this.player.inventory.addItem(item.id, item.qty, this.rng);
      if (left > 0) this.pushLog(`No room for ${getItem(item.id).name} x${left}.`, PAL.hp);
    }
    this.pushLog(`Quest complete: ${quest.name}`, PAL.gold);
  }

  /* -------------------------------------------------------------- hooks -- */

  readonly hooks: UiHooks = {
    useItem: (tab, index) => this.useItem(tab, index),
    equipItem: (index) => this.equipItem(index),
    unequipSlot: (slot) => this.unequipSlot(slot),
    dropItem: (tab, index) => this.dropItem(tab, index),
    sortTab: (tab) => this.player.inventory.sort(tab),
    allocateAp: (stat: keyof BaseStats) => {
      if (this.player.allocateAp(stat)) this.pushLog(`${stat.toUpperCase()} increased.`, PAL.exp);
    },
    learnSkill: (id) => {
      if (this.player.learnSkill(id)) {
        const def = trySkill(id);
        this.pushLog(`${def?.name} is now level ${this.player.skillLevelOf(id)}.`, PAL.exp);
        this.autoBindQuickSlot(id);
      }
    },
    castSkill: (id) => this.castSkill(id),
    bindQuickSlot: (index, skillId) => {
      // A skill can only occupy one slot at a time.
      if (skillId) {
        const existing = this.uiState.quickSlots.indexOf(skillId);
        if (existing >= 0) this.uiState.quickSlots[existing] = null;
      }
      this.uiState.quickSlots[index] = skillId;
    },
    advanceJob: (jobId) => {
      const result = this.player.advanceTo(jobId);
      if (!result.ok) {
        this.pushLog('You do not meet the requirements.', PAL.hp);
        return;
      }
      this.pushLog(`You are now a ${result.job.name}.`, PAL.gold);
      this.levelUpTimer = 1;
      this.uiState.open.delete('advance');
      this.saveGame(false);
    },
    dialogueOption: (index) => this.dialogueActions[index]?.(),
    closeDialogue: () => this.closeDialogue(),
    buy: (itemId, qty) => this.buy(itemId, qty),
    sell: (tab, index) => this.sell(tab, index),
    startQuest: (id) => {
      this.quests.start(id);
    },
    completeQuest: (id) => this.completeQuest(id),
    abandonQuest: (id) => {
      if (this.quests.abandon(id)) this.pushLog(`Abandoned ${getQuest(id).name}.`, PAL.textDim);
    },
    log: (text, color) => this.pushLog(text, color),
  };

  /** Put a newly learned attack skill on the first free quick slot. */
  private autoBindQuickSlot(skillId: string): void {
    const def = trySkill(skillId);
    if (!def || def.type === 'passive') return;
    if (this.uiState.quickSlots.includes(skillId)) return;
    const free = this.uiState.quickSlots.indexOf(null);
    if (free >= 0) this.uiState.quickSlots[free] = skillId;
  }

  private useItem(tab: ItemTab, index: number): void {
    const slot = this.player.inventory.tabs[tab][index];
    if (!slot) return;
    if (slot.kind === 'equip') {
      this.equipItem(index);
      return;
    }
    const def = getItem(slot.itemId);
    const use = def.use;
    if (!use) return;
    if (this.player.potionCooldown > 0 && (use.hp || use.mp || use.hpPercent || use.mpPercent)) return;

    if (use.scroll) {
      this.useScroll(tab, index);
      return;
    }

    if (use.townScroll) {
      this.player.inventory.removeAt(tab, index, 1);
      this.warpTo(this.world.map.returnMap, 'spawn');
      return;
    }

    let used = false;
    if (use.hp) used = this.player.heal(use.hp) > 0 || used;
    if (use.mp) used = this.player.restoreMp(use.mp) > 0 || used;
    if (use.hpPercent) used = this.player.heal(this.player.stats.maxHp * use.hpPercent) > 0 || used;
    if (use.mpPercent) used = this.player.restoreMp(this.player.stats.maxMp * use.mpPercent) > 0 || used;
    if (use.buff) {
      this.player.applyBuff({
        id: `item:${def.id}`,
        name: use.buff.name,
        stats: { ...emptyStats(), ...use.buff.stats },
        remaining: use.buff.durationMs / 1000,
        durationSec: use.buff.durationMs / 1000,
        icon: { glyph: '+', color: def.icon.color },
      });
      used = true;
    }

    if (!used) {
      this.pushLog('Nothing would be restored.', PAL.textDim);
      return;
    }
    this.player.potionCooldown = (use.cooldownMs ?? 300) / 1000;
    this.player.inventory.removeAt(tab, index, 1);
  }

  /**
   * Scrolls apply to the equipped item in their target slot. The real game
   * drags a scroll onto an item; targeting what you are wearing keeps the same
   * decision without needing drag-and-drop.
   */
  private useScroll(tab: ItemTab, index: number): void {
    const slot = this.player.inventory.tabs[tab][index];
    if (slot?.kind !== 'stack') return;
    const scroll = getItem(slot.itemId).use?.scroll;
    if (!scroll) return;

    const targetSlot: EquippedSlot | null =
      scroll.target === 'any'
        ? (this.player.inventory.equipped.weapon ? 'weapon' : firstEquippedSlot(this.player))
        : (scroll.target as EquippedSlot);
    const inst = targetSlot ? this.player.inventory.equipped[targetSlot] : null;

    if (!inst) {
      this.pushLog('Equip the item you want to scroll first.', PAL.textDim);
      return;
    }
    if (inst.slotsUsed >= inst.slotsTotal) {
      this.pushLog('That item has no upgrade slots left.', PAL.textDim);
      return;
    }

    this.player.inventory.removeAt(tab, index, 1);
    const result = applyScroll(inst, scroll, this.rng);

    switch (result) {
      case 'success':
        this.pushLog(`Success! ${getItem(inst.itemId).name} is now +${inst.upgrades}.`, PAL.exp);
        break;
      case 'fail':
        this.pushLog('The scroll failed. A slot was consumed.', PAL.hp);
        break;
      case 'destroyed':
        delete this.player.inventory.equipped[targetSlot!];
        this.pushLog(`${getItem(inst.itemId).name} was destroyed.`, PAL.dmgTaken);
        break;
      default:
        this.pushLog('That scroll cannot be used on this item.', PAL.textDim);
        break;
    }
    this.player.recompute();
  }

  private equipItem(index: number): void {
    const result = this.player.inventory.equip(index, (id) => this.player.canWear(id));
    if (!result.ok) {
      const messages = {
        'not-equip': 'That is not equipment.',
        'no-space': 'Not enough inventory space to swap.',
        requirements: 'You do not meet the requirements for that.',
      };
      this.pushLog(messages[result.reason], PAL.hp);
      return;
    }
    this.player.recompute();
    this.uiState.invSelected = -1;
  }

  private unequipSlot(slot: EquippedSlot): void {
    if (!this.player.inventory.unequip(slot)) {
      this.pushLog('No room in your equipment inventory.', PAL.hp);
      return;
    }
    this.player.recompute();
  }

  private dropItem(tab: ItemTab, index: number): void {
    const slot = this.player.inventory.tabs[tab][index];
    if (!slot) return;
    const name = slot.kind === 'equip' ? getItem(slot.inst.itemId).name : getItem(slot.itemId).name;
    this.player.inventory.removeAt(tab, index, slot.kind === 'stack' ? slot.qty : 1);
    this.pushLog(`Discarded ${name}.`, PAL.textDim);
  }

  private buy(itemId: string, qty: number): void {
    const def = getItem(itemId);
    const cost = def.price * qty;
    if (this.player.inventory.mesos < cost) {
      this.pushLog('You cannot afford that.', PAL.hp);
      return;
    }
    const leftover = this.player.inventory.addItem(itemId, qty, this.rng);
    const bought = qty - leftover;
    if (bought <= 0) {
      this.pushLog('Your inventory is full.', PAL.hp);
      return;
    }
    this.player.inventory.spendMesos(def.price * bought);
    this.pushLog(`Bought ${def.name}${bought > 1 ? ` x${bought}` : ''}.`, PAL.text);
  }

  private sell(tab: ItemTab, index: number): void {
    const slot = this.player.inventory.tabs[tab][index];
    if (!slot) return;
    const itemId = slot.kind === 'equip' ? slot.inst.itemId : slot.itemId;
    const def = getItem(itemId);
    const qty = slot.kind === 'stack' ? slot.qty : 1;
    const value = sellPrice(def) * qty;
    this.player.inventory.removeAt(tab, index, qty);
    this.player.inventory.addMesos(value);
    this.pushLog(`Sold ${def.name}${qty > 1 ? ` x${qty}` : ''} for ${value.toLocaleString()} mesos.`, PAL.gold);
  }

  /* -------------------------------------------------------------- save -- */

  saveGame(announce = true): void {
    const data = serialise(this.player, this.quests, this.mapId, 'spawn', this.uiState.quickSlots);
    const ok = save(data);
    if (announce) this.pushLog(ok ? 'Game saved.' : 'Could not save.', ok ? PAL.exp : PAL.hp);
  }

  resetSave(): void {
    clearSave();
    location.reload();
  }

  /* ------------------------------------------------------------ render -- */

  private render(alpha: number, frameDt: number): void {
    const ctx = this.renderer.ctx;
    this.ui.beginFrame();
    this.renderer.clear(PAL.sky);

    drawScene({
      ctx, cam: this.cam, world: this.world, player: this.player,
      time: this.time, alpha,
    });

    const hudState: HudState = {
      log: this.log,
      minimapOpen: !this.uiState.open.has('worldmap'),
      quickSlots: this.uiState.quickSlots,
    };
    drawHud(ctx, this.ui, this.player, this.world, hudState, this.time);

    this.renderWindows(ctx);

    if (this.levelUpTimer > 0) drawLevelUp(ctx, this.player, this.levelUpTimer);

    if (this.player.dead) {
      const choice = drawDeathOverlay(ctx, this.ui, this.player);
      if (choice.revive) {
        this.player.revive();
        this.pushLog('Revived.', PAL.exp);
      } else if (choice.town) {
        this.player.revive();
        this.warpTo(this.world.map.returnMap, 'spawn');
      }
    }

    drawVignette(ctx, '#05070c', this.fade);
    void frameDt;
  }

  private renderWindows(ctx: CanvasRenderingContext2D): void {
    const s = this.uiState;
    if (s.open.has('stats')) drawStats(ctx, this.ui, s, this.player, this.hooks);
    if (s.open.has('skills')) drawSkills(ctx, this.ui, s, this.player, this.hooks);
    if (s.open.has('quests')) drawQuests(ctx, this.ui, s, this.player, this.quests, this.hooks);
    if (s.open.has('equip')) drawEquipment(ctx, this.ui, s, this.player, this.hooks);
    if (s.open.has('inventory')) drawInventory(ctx, this.ui, s, this.player, this.hooks);
    if (s.open.has('worldmap')) drawWorldMap(ctx, this.ui, s, this.mapId);
    if (s.open.has('help')) drawHelp(ctx, this.ui, s);

    if (s.open.has('shop') && s.shopNpc) {
      drawShop(ctx, this.ui, s, this.player, getNpc(s.shopNpc).shop ?? [], this.hooks);
      if (!s.open.has('shop')) this.closeDialogue();
    }
    if (s.open.has('advance')) drawAdvancement(ctx, this.ui, s, this.player, this.hooks);

    if (s.open.has('dialogue')) {
      this.dialogueView = this.buildDialogue();
      if (this.dialogueView) {
        drawDialogue(ctx, this.ui, this.dialogueView, this.hooks, this.time);
      }
    }
  }
}

function firstEquippedSlot(player: Player): EquippedSlot | null {
  for (const [slot, inst] of Object.entries(player.inventory.equipped)) {
    if (inst) return slot as EquippedSlot;
  }
  return null;
}

/** Objective ids are either mob ids or item ids; show whichever resolves. */
function objectiveName(id: string): string {
  try {
    return getMob(id).name;
  } catch {
    try {
      return getItem(id).name;
    } catch {
      return id;
    }
  }
}
