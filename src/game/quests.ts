import type { Game } from './game';
import { eggsFound, type QuestSave, type SaveData } from './progress';
import { bump, extra, type ExtraStats } from './feats';
import { LEVEL_INFO } from './story';

/**
 * Quests: the main story line, worked out afresh from the story state so it
 * always says what to do next, and side quests from the folk of each realm
 * (defined in src/levels/sidequests.ts), whose progress lives in
 * `SaveData.quests`.
 *
 * The game reports what happens through `notify` (a kill, a pickup, a talk,
 * entering a realm, a reaction...). Each side quest step either waits for
 * events like that (`on`, counted), or for a condition to hold (`done`,
 * checked a few times a second). Chests, critters, butterflies and flight
 * rings are noticed from the save's counters, so the code that opens chests
 * and frees butterflies needs no hooks of its own.
 */

export type QuestEvent = 'kill' | 'collect' | 'talk' | 'enter' | 'chest' | 'critter' | 'butterfly' | 'ring' | 'reaction' | 'item' | 'signal';

export interface QuestEventData {
  /** The realm it happened in (filled in when left out). */
  level?: string;
  /** An NPC, quest item, collectible or signal id. */
  id?: string;
  /** An enemy's kind (its def id). */
  enemy?: string;
  /** A collectible kind or a reaction name. */
  kind?: string;
  /** The object itself, such as the Enemy that fell. */
  ref?: unknown;
}

/** A place on a realm's map. */
export interface QuestSpot {
  level: string;
  x: number;
  z: number;
  label?: string;
}

export interface QuestMarker extends QuestSpot {
  kind: 'target' | 'giver';
  tracked: boolean;
  detail?: string;
}

export interface QuestStep {
  /** What the tracker and Journal say. `{n}` and `{goal}` show a count ("Lanterns {n}/{goal}"). */
  text: string;
  /** Advances on matching events, `count` of them (default 1). */
  on?: {
    event: QuestEvent;
    id?: string | RegExp;
    enemy?: string;
    kind?: string;
    level?: string;
    count?: number;
    test?: (d: QuestEventData, g: Game) => boolean;
  };
  /** Or advances as soon as this holds. */
  done?: (g: Game) => boolean;
  /** Where it happens, for the map. */
  at?: QuestSpot[] | ((g: Game) => QuestSpot[]);
}

export interface QuestDef {
  id: string;
  title: string;
  /** Who asks (shown in the Journal). */
  giver: string;
  /** The realm the quest belongs to. */
  realm: string;
  desc: string;
  /** Where the giver stands: marked on the map until the quest is taken. */
  giverAt?: QuestSpot;
  steps: QuestStep[];
  /** Spirit gems, and sometimes a page for the Journal. */
  reward: { gems: number; page?: { title: string; from: string; text: string } };
  /** Offered only once this holds (the giver waits until then). */
  available?: (g: Game) => boolean;
}

/** One line of the main story: what to do next and where. */
export interface MainQuest {
  title: string;
  text: string;
  spot: QuestSpot | null;
  /** The story's chapters so far (Act I's, then Act II's once the Keep is won), with the ones behind Aster ticked off. */
  chapters: { title: string; done: boolean }[];
}

/** The tracker's view of the quest being followed. */
export interface Tracked {
  id: string;
  title: string;
  text: string;
  main: boolean;
}

interface Chapter {
  level: string;
  title: string;
  warden?: string;
  boss?: string;
}

/** Act I, realm by realm. */
const ACT_I: Chapter[] = [
  { level: 'fen', title: 'The Gloom Comes to the Fen', boss: 'Bogmaw, the Mire King' },
  { level: 'sanctum', title: 'The Warden Sanctum' },
  { level: 'falls', title: 'The Storm Warden', warden: 'Stormcrest', boss: 'Skrieka, the Last Storm Roc' },
  { level: 'frostworks', title: 'The Ice Warden', warden: 'Frostfang', boss: 'Forgemaster Grolm' },
  { level: 'plains', title: 'The Earth Warden', warden: 'Stonehide', boss: 'Graveljaw, the Burrow Wyrm' },
  { level: 'keep', title: 'Beneath the Eclipse', boss: 'Nyxa, Shadow of the Eclipse' },
];

/** Dragon eggs the Mycelium gate asks for (Mossa's rite: see gates() in src/levels/hollow.ts). */
export const MYCELIUM_EGGS = 12;

/** Save counters watched for the events of the same names. */
const COUNTERS: [keyof ExtraStats, QuestEvent][] = [['critters', 'critter'], ['butterflies', 'butterfly'], ['chests', 'chest'], ['rings', 'ring']];

const realmName = (id: string) => LEVEL_INFO[id]?.name ?? id;
/** A realm's name inside a sentence ("to the Frostworks"). */
const inText = (id: string) => realmName(id).replace(/^The /, 'the ');

export class Quests {
  /** Bumped on every change, so the HUD and menus know to redraw. */
  version = 0;
  private hooks = new Map<string, ((step: number) => void)[]>();
  private pollT = 0;
  private seen: Record<string, number> = {};
  private seenSave: SaveData | null = null;

  constructor(private game: Game, readonly defs: QuestDef[]) {}

  get(id: string): QuestDef | undefined {
    return this.defs.find((q) => q.id === id);
  }

  /** A side quest's progress, if it has been taken. */
  state(id: string): QuestSave | undefined {
    return this.game.save.quests?.[id];
  }

  isStarted(id: string): boolean {
    return !!this.state(id);
  }

  isDone(id: string): boolean {
    return !!this.state(id)?.done;
  }

  /** The quest's current step index, or -1 before it starts. */
  step(id: string): number {
    return this.state(id)?.step ?? -1;
  }

  /** Taken and not yet finished. */
  active(): QuestDef[] {
    return this.defs.filter((q) => this.isStarted(q.id) && !this.isDone(q.id));
  }

  completed(): QuestDef[] {
    return this.defs.filter((q) => this.isDone(q.id));
  }

  /** Offered by now, for the map's "someone needs help" marks. */
  available(q: QuestDef): boolean {
    return q.available ? q.available(this.game) : true;
  }

  /** Takes on a side quest (once). It becomes the tracked quest. */
  start(id: string): void {
    const g = this.game;
    const def = this.get(id);
    if (!def || this.isStarted(id)) return;
    const all = (g.save.quests ??= {});
    for (const s of Object.values(all)) s.tracked = false;
    all[id] = { step: 0, tracked: true };
    this.changed();
    g.audio.play('relic', 1.15, 0.8);
    g.toast(`New quest: ${def.title}`, 'good');
    if (!g.save.found['tip:quests']) {
      g.save.found['tip:quests'] = true;
      g.hud.flick('A quest! It\'s written in the Journal, and the map marks where to go. Press M for the map.', 7);
    }
    this.fire(id, 0);
    this.check(def);
    g.saveNow();
  }

  /** Follows a side quest on the HUD and map (null goes back to the main quest). */
  track(id: string | null): void {
    const all = this.game.save.quests ?? {};
    for (const [k, s] of Object.entries(all)) s.tracked = k === id && !s.done;
    this.changed();
    this.game.saveNow();
  }

  /** The side quest being followed, if any. */
  trackedQuest(): QuestDef | null {
    const all = this.game.save.quests ?? {};
    const id = Object.keys(all).find((k) => all[k]!.tracked && !all[k]!.done);
    return id ? this.get(id) ?? null : null;
  }

  /** Runs `fn` whenever quest `id` reaches a new step (for this realm visit only). */
  onStep(id: string, fn: (step: number) => void): void {
    const l = this.hooks.get(id) ?? [];
    l.push(fn);
    this.hooks.set(id, l);
  }

  /** Drops the realm's step hooks; called as each realm is built. */
  clearHooks(): void {
    this.hooks.clear();
  }

  private fire(id: string, step: number): void {
    for (const fn of this.hooks.get(id) ?? []) fn(step);
  }

  private changed(): void {
    this.version++;
  }

  // --- events -----------------------------------------------------------------------

  /** Something happened in the world: advances every quest step waiting for it. */
  notify(event: QuestEvent, data: QuestEventData = {}): void {
    const g = this.game;
    const d: QuestEventData = { level: g.level?.def.id, ...data };
    for (const def of this.defs) {
      const st = this.state(def.id);
      if (!st || st.done) continue;
      const step = def.steps[st.step];
      const on = step?.on;
      if (!step || !on || on.event !== event) continue;
      if (on.level && on.level !== d.level) continue;
      if (on.enemy && on.enemy !== d.enemy) continue;
      if (on.kind && on.kind !== d.kind) continue;
      if (on.id !== undefined && !(typeof on.id === 'string' ? on.id === d.id : on.id.test(d.id ?? ''))) continue;
      if (on.test && !on.test(d, g)) continue;
      st.n = (st.n ?? 0) + 1;
      const goal = on.count ?? 1;
      if (st.n >= goal) this.advance(def);
      else {
        this.changed();
        g.audio.play('gem', 1.3, 0.7);
        g.toast(`${def.title}: ${this.stepText(def, st)}`, 'info');
        g.saveNow();
      }
    }
  }

  /** Notes a quest item picked up (so it is not placed again), then reports it. */
  pickItem(questId: string, itemId: string): void {
    const st = this.state(questId);
    if (!st) return;
    const items = (st.items ??= []);
    if (!items.includes(itemId)) items.push(itemId);
    this.notify('item', { id: itemId });
    this.game.saveNow();
  }

  hasItem(questId: string, itemId: string): boolean {
    return !!this.state(questId)?.items?.includes(itemId);
  }

  private advance(def: QuestDef): void {
    const g = this.game;
    const st = this.state(def.id)!;
    st.step++;
    st.n = 0;
    this.changed();
    if (st.step >= def.steps.length) {
      this.complete(def);
      return;
    }
    g.audio.play('unlock', 1.2, 0.7);
    g.toast(`Quest updated: ${this.stepText(def, st)}`, 'good');
    this.fire(def.id, st.step);
    this.check(def);
    g.saveNow();
  }

  /** Finishes a side quest and pays for it (once: a finished quest never pays again). */
  private complete(def: QuestDef): void {
    const g = this.game;
    const st = this.state(def.id)!;
    if (st.done) return;
    st.done = true;
    st.tracked = false;
    st.step = def.steps.length;
    g.save.gems += def.reward.gems;
    bump(g.save, 'quests');
    this.changed();
    g.hud.gemBump();
    g.audio.play('levelUp');
    g.hud.bigText('QUEST COMPLETE', 0xffe070);
    g.toast(`${def.title} complete! +${def.reward.gems} spirit gems`, 'good');
    const page = def.reward.page;
    if (page) g.hud.letter(page.title, page.from, page.text, 'A page for the Journal', 'Kept with the quest in the Journal.');
    this.fire(def.id, st.step);
    g.checkFeats();
    g.saveNow();
  }

  /** Checks a quest's current `done` condition. */
  private check(def: QuestDef): void {
    const st = this.state(def.id);
    if (!st || st.done) return;
    const step = def.steps[st.step];
    if (step?.done?.(this.game)) this.advance(def);
  }

  /** Called every frame of play: polls conditions and counters a few times a second. */
  update(dt: number): void {
    this.pollT -= dt;
    if (this.pollT > 0) return;
    this.pollT = 0.25;
    const g = this.game;
    const ex = extra(g.save);
    // A new or reloaded save starts counting afresh.
    if (this.seenSave !== g.save) {
      this.seenSave = g.save;
      for (const [k] of COUNTERS) this.seen[k] = ex[k] ?? 0;
    }
    for (const [k, ev] of COUNTERS) {
      const now = ex[k] ?? 0;
      const was = this.seen[k] ?? now;
      this.seen[k] = now;
      for (let i = was; i < Math.min(now, was + 20); i++) this.notify(ev);
    }
    for (const def of this.active()) this.check(def);
  }

  // --- what to show -----------------------------------------------------------------

  /** A step's text with its count filled in. */
  stepText(def: QuestDef, st: QuestSave | undefined = this.state(def.id)): string {
    const step = def.steps[st?.step ?? 0];
    if (!step) return 'Done.';
    const goal = step.on?.count ?? 1;
    return step.text.replace('{n}', String(Math.min(goal, st?.n ?? 0))).replace('{goal}', String(goal));
  }

  /** Where a quest's current step happens, in any realm. */
  spots(def: QuestDef): QuestSpot[] {
    const st = this.state(def.id);
    if (!st || st.done) return [];
    const at = def.steps[st.step]?.at;
    if (!at) return [];
    return typeof at === 'function' ? at(this.game) : at;
  }

  /** The tracked side quest's step, or the main quest's next goal. */
  tracker(): Tracked | null {
    const q = this.trackedQuest();
    if (q) return { id: q.id, title: q.title, text: this.stepText(q), main: false };
    const m = this.main();
    return { id: 'main', title: m.title, text: m.text, main: true };
  }

  /** Marks for a realm's map: quest targets, and givers waiting to be met. */
  markers(level: string): QuestMarker[] {
    const out: QuestMarker[] = [];
    const tracked = this.trackedQuest();
    for (const def of this.active()) {
      for (const s of this.spots(def)) {
        if (s.level !== level) continue;
        out.push({ ...s, kind: 'target', tracked: def === tracked, label: s.label ?? def.title, detail: `${def.title}: ${this.stepText(def)}` });
      }
    }
    for (const def of this.defs) {
      const at = def.giverAt;
      if (!at || at.level !== level || this.isStarted(def.id) || !this.available(def)) continue;
      out.push({ ...at, kind: 'giver', tracked: false, label: at.label ?? def.giver, detail: `${def.giver} looks like they could use a hand.` });
    }
    const m = this.main();
    if (m.spot && m.spot.level === level) {
      out.push({ ...m.spot, kind: 'target', tracked: !tracked, label: m.spot.label ?? m.title, detail: `Main quest: ${m.text}` });
    }
    return out;
  }

  // --- the main quest ---------------------------------------------------------------

  /**
   * The story's next step, worked out from which realms are done, what is
   * unlocked, and (in the current realm) which of its fights still stand.
   */
  main(): MainQuest {
    const g = this.game;
    const s = g.save;
    const here = g.level?.def.id ?? s.level;
    const done = (l: string) => !!s.levelsDone[l];
    const lessonDone = !!s.found['story:sanctum:lesson-done'];
    const chapters = ACT_I.map((c) => ({ title: c.title, done: c.level === 'sanctum' ? lessonDone : done(c.level) }));
    // Act II's chapters join once the Keep is won.
    if (done('keep')) chapters.push({ title: 'The Hollow Below', done: !!s.found['story:hollow:mossa'] }, { title: 'The Mycelium Deep', done: done('mycelium') });
    const out = (title: string, text: string, spot: QuestSpot | null = null): MainQuest => ({ title, text, spot, chapters });
    /** The next fight in this realm, or its boss once the fights are won. */
    const next = (lvl: string): { label: string; spot: QuestSpot } | null => {
      const level = g.level;
      if (!level || level.def.id !== lvl) return null;
      const open = level.goals.filter((q) => !q.done());
      if (!open.length) return null;
      const fights = open.filter((q) => q.label !== 'boss');
      const pool = fights.length ? fights : open;
      const p = g.player;
      const best = pool.reduce((a, b) => (Math.hypot(a.x - p.x, a.z - p.z) <= Math.hypot(b.x - p.x, b.z - p.z) ? a : b));
      return { label: best.label, spot: { level: lvl, x: best.x, z: best.z, label: best.label === 'boss' ? 'The boss' : 'The way on' } };
    };
    /** Home, from wherever Aster is: the Wardgate, or a Wardstone that flies there. */
    const home = (then: string): MainQuest => {
      const c = ACT_I.find((k) => k.level === then);
      const title = c?.title ?? realmName(then);
      if (here === 'sanctum') return out(title, `Take the Wardgate to ${inText(then)}`, { level: 'sanctum', x: 0, z: 48, label: 'The Wardgate' });
      return out(title, `Return to the Sanctum, then take the Wardgate to ${inText(then)}`, this.nearestWard());
    };

    if (!done('fen')) {
      const c = ACT_I[0]!;
      if (here !== 'fen') return out(c.title, 'Return to Marshlight Fen', null);
      const n = next('fen');
      if (n?.label === 'boss') return out(c.title, `Defeat ${c.boss}`, n.spot);
      return out(c.title, 'Follow the marsh path and drive the Gloom from the Fen', n?.spot ?? null);
    }
    if (!lessonDone) {
      const c = ACT_I[1]!;
      if (here !== 'sanctum') return out(c.title, 'Return to the Sanctum', this.nearestWard());
      return out(c.title, 'Learn Fire from Emberhold: burn the dummies and light the braziers on the training grounds', { level: 'sanctum', x: 46, z: 4, label: 'Training grounds' });
    }
    for (const c of ACT_I.slice(2)) {
      if (done(c.level)) continue;
      if (here !== c.level) {
        if (!s.unlocked.includes(c.level)) break;
        return home(c.level);
      }
      const n = next(c.level);
      if (n?.label === 'boss') return out(c.title, `Defeat ${c.boss}`, n.spot);
      if (n) return out(c.title, c.warden ? `Reach ${c.warden}, the Warden of ${inText(c.level)}` : `Storm ${inText(c.level)} and find Nyxa`, n.spot);
      return out(c.title, c.warden ? `Free ${c.warden}` : `Face ${c.boss}`, null);
    }
    // After the Keep: Act II's thread. The roots split the Sanctum's lawn; the fissure leads down to the Hollow Gate.
    const title = 'The Hollow Below';
    if (s.levelsDone.keep) {
      const hollow = 'hollow';
      const fissure: QuestSpot = { level: 'sanctum', x: 0, z: -25, label: 'The fissure' };
      const myc = 'mycelium';
      const met = !!s.found['story:hollow:mossa'];
      // Inside the Mycelium Deep: what feeds the roots, then the one feeding them.
      if (here === myc && !done(myc)) {
        const n = next(myc);
        if (n?.label === 'boss') return out(title, 'Defeat Mycora, the Spore Mother', n.spot);
        return out(title, 'Find what feeds the roots in the Mycelium Deep', n?.spot ?? null);
      }
      if (here === hollow) {
        const n = next(hollow);
        if (n?.label === 'boss') return out(title, 'Something waits at the heart of the Hollow', n.spot);
        if (!met) return out(title, 'Follow the lights down to the Burrowfolk\'s camp by the lake', { level: hollow, x: 0, z: -54, label: 'Lanternhollow' });
      }
      if (!s.unlocked.includes(hollow) && here !== hollow) {
        return here === 'sanctum'
          ? out(title, 'The ground has split open in the Sanctum. Go down through the fissure', fissure)
          : out(title, 'Something stirs beneath the Sanctum. Return there', this.nearestWard());
      }
      /** The way back to the Hollow Gate from here: the fissure in the Sanctum, else a Wardstone home. */
      const wayDown = here === 'sanctum' ? fissure : this.nearestWard();
      if (!met) {
        return here === 'sanctum'
          ? out(title, `Go back down through the fissure to ${inText(hollow)}`, fissure)
          : out(title, `Return to ${inText(hollow)}, through the Sanctum's fissure or the Wardgate`, this.nearestWard());
      }
      // Mossa's rite: twelve returned eggs open the Mycelium gate (sealedGate in src/world/kits.ts).
      const gate: QuestSpot = { level: hollow, x: 100, z: 16, label: 'The Mycelium gate' };
      if (!done(myc)) {
        if (!s.found['gate:mycelium']) {
          const eggs = eggsFound(s);
          if (eggs < MYCELIUM_EGGS) return out(title, `Return ${MYCELIUM_EGGS} dragon eggs to open the Mycelium gate (${eggs}/${MYCELIUM_EGGS})`, gate);
          return out(title, `${MYCELIUM_EGGS} eggs returned: take their warmth to the Mycelium gate${here === hollow ? '' : ` in ${inText(hollow)}`}`, here === hollow ? gate : wayDown);
        }
        if (here === 'sanctum' && s.unlocked.includes(myc)) return out(title, `The Mycelium gate is open: take the Wardgate to ${inText(myc)}`, { level: 'sanctum', x: 0, z: 48, label: 'The Wardgate' });
        return out(title, 'The Mycelium gate is open: go through', here === hollow ? gate : this.nearestWard());
      }
      // Mycora has fallen: home to Mossa, and then the next gate (a later chapter).
      if (!s.found['story:hollow:mossa-mycelium']) {
        return here === hollow ? out(title, 'Return to Elder Mossa', { level: hollow, x: -3, z: -57, label: 'Elder Mossa' }) : out(title, `Return to Elder Mossa in ${inText(hollow)}`, wayDown);
      }
      return out(title, 'The Drowned City\'s gate still holds. More of the Hollow\'s folk need you', null);
    }
    return out(title, 'Find where the story goes next', null);
  }

  /** The awakened Wardstone nearest Aster in this realm (they fly to the Sanctum). */
  private nearestWard(): QuestSpot | null {
    const g = this.game;
    const level = g.level;
    if (!level) return null;
    const p = g.player;
    let best: QuestSpot | null = null;
    let bd = Infinity;
    for (const w of level.wardstones.values()) {
      const d = Math.hypot(w.x - p.x, w.z - p.z);
      if (d < bd) {
        bd = d;
        best = { level: level.def.id, x: w.x, z: w.z, label: 'A Wardstone can take you home' };
      }
    }
    return best;
  }
}
