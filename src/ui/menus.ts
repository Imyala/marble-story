import type { Game } from '../game/game';
import {
  UPGRADES, nextCost, buyUpgrade, upgradeLevel, loadSave, DIFFICULTY, writeSave, eggsFound, SKINS, explored, skinUnlocked, recordTime, PAR_TIMES, clock, type UpgradeTree, type Difficulty,
} from '../game/progress';
import type { Wardstone } from '../entities/props';
import { RELICS, PROLOGUE, LEVEL_INFO } from '../game/story';
import { LETTERS, letterKey } from '../game/letters';
import { FEATS, BESTIARY, featKey, extra } from '../game/feats';
import { SKILLS, SKILL_REWARD, skillKey } from '../game/skills';
import { ENEMIES } from '../enemies/defs';
import { HERO_LOOK } from '../player/dragonRig';
import { ELEMENTS } from '../game/types';
import { TRIALS, type TrialGround } from '../levels/trials';
import { RANKS } from '../combat/style';

type Screen = { el: HTMLElement; focus: HTMLElement[]; idx: number; back: (() => void) | null; grid?: number };

const TREE_NAMES: Record<UpgradeTree, string> = {
  horn: 'Horns', tail: 'Tail', wings: 'Wings', spirit: 'Spirit', fire: 'Fire', lightning: 'Lightning', ice: 'Ice', earth: 'Earth',
};

const MOVE_LIST: { name: string; input: string; desc: string; requires?: string; element?: boolean }[] = [
  { name: 'Horn Combo', input: 'LMB, LMB, LMB', desc: 'Three quick horn strikes. The third knocks enemies away.' },
  { name: 'Horn Cyclone', input: 'LMB x4', desc: 'A spinning fourth strike that hits everything around you.', requires: 'hornFinisher' },
  { name: 'Horn Flurry', input: 'LMB, LMB, pause, LMB', desc: 'Wait a beat after the second strike for a rapid flurry and a heavy finish.' },
  { name: 'Horn Lunge', input: 'LMB while running', desc: 'A charging horn strike that closes distance fast.' },
  { name: 'Horn Toss', input: 'LMB then E', desc: 'Launches an enemy into the air. Hold Space to rise with it.' },
  { name: 'Air Combo', input: 'LMB x3 in the air', desc: 'Keeps you and your target aloft; the finisher spikes them down.' },
  { name: 'Tail Whip', input: 'E, E', desc: 'Spinning tail sweeps. Heavy: breaks guards, shatters ice.' },
  { name: 'Tail Smash', input: 'E, E, E  or  LMB x3, E', desc: 'An overhead slam that bounces enemies up.' },
  { name: 'Tail Sweep', input: 'E, pause, E', desc: 'A low spinning sweep that knocks down everything around you.' },
  { name: 'Tail Cyclone', input: 'Hold E', desc: 'Spin like a top while you hold the button.', requires: 'tailSpin' },
  { name: 'Elemental Finisher', input: 'Hold RMB as a finisher lands', desc: 'Horn Ram, Tail Smash, Horn Toss, Comet Flip, Lunge, Flurry or Counter take your element for 12 mana.', element: true },
  { name: 'Ground Pound', input: 'E in the air', desc: 'Dive and slam. Presses plates. Higher falls hit harder.' },
  { name: 'Dodge', input: 'Shift', desc: 'A quick dash with invulnerability. Works once in the air.' },
  { name: 'Perfect Dodge', input: 'Shift just before a hit', desc: 'Time slows. Press LMB for a devastating Counter.' },
  { name: 'Dodge Strike', input: 'Shift, then LMB', desc: 'Cancel a dodge into a lunge, or an air dash into an air combo.' },
  { name: 'Charge', input: 'Hold Shift', desc: 'Sprint horns-first, ramming anything in the way. LMB to Horn Dash.' },
  { name: 'Reflect', input: 'LMB into a projectile', desc: 'Bat enemy bolts back where they came from.' },
  { name: 'Flap and Glide', input: 'Space in the air, hold', desc: 'A second jump, then hold to glide. Ride updrafts upward.' },
  { name: 'Dive and Swoop', input: 'Hold Shift while gliding', desc: 'Dive to build speed, let go to swoop back up with it.' },
  { name: 'Ledge Grab', input: 'Jump at a ledge', desc: 'Catch edges you barely miss and pull yourself up.' },
  { name: 'Claw Climb', input: 'Walk into vines', desc: 'Climb vine walls with W/A/S/D; Space leaps off.' },
  { name: 'Breath', input: 'Hold RMB', desc: 'Your element\'s breath. Costs mana over time.', element: true },
  { name: 'Burst', input: 'Q', desc: 'Your element\'s special attack. Costs a chunk of mana.', element: true },
  { name: 'Fury', input: 'X when the ring is full', desc: 'A screen-clearing elemental storm. Build it by fighting.', element: true },
  { name: 'Dragon Time', input: 'Hold C', desc: 'Slow the world while you move freely.' },
  { name: 'Lock On', input: 'Tab / MMB, flick to switch', desc: 'Frame a target and circle it; flick the mouse or stick to change targets.' },
];

const TIPS = [
  ['Elemental Reactions', 'Freeze an enemy, then hit it with a heavy blow to SHATTER it. Fire on a shocked foe causes an OVERLOAD explosion. Ice on a burning foe makes a STEAM BURST that stuns a crowd.'],
  ['Style', 'Landing varied hits raises your style rank from Spark to Legendary. Higher ranks drop more gems and build fury faster. Getting hit costs you a rank.'],
  ['Guards and Shells', 'Shields block your horns and breath from the front. Circle behind, or use heavy Tail moves, Earth, or a Battering Ram charge. Shellbacks must be flipped with a heavy hit.'],
  ['Totems', 'Gloom Totems shield every enemy near them. Break the totem first.'],
  ['Gems', 'Blue gems are spirit: spend them at Wardstones. Red heals, green restores mana, purple feeds your fury.'],
  ['Reading Puzzles', 'Every puzzle piece answers to one ability. Gloom eyes: bat their bolts back with a well-timed Horn. Boulders: Tail, Charge or Earth rolls them onto weight plates. Conduits: charge every one with Lightning before the first fades. Glowing rings on water: Ice freezes a floe. Ropes burn. Snap gates and blades: Dragon Time. Element locks: strike each socket with its element in the order the dots count.'],
  ['Stuck?', 'Linger near a puzzle and Flick will start offering hints, a little plainer each time.'],
  ['Power-ups', 'A shrine ringed with dull stone sleeps while Gloom guards stand near it. Beat them and the ring lights up: run through it for SUPERFLAME (white-hot breath that melts iron), SUPERCHARGE (a faster charge that bowls foes over and smashes iron) or INVINCIBILITY (nothing hurts you, and touching foes hurts them). Speed runes on the ground supercharge a charge that runs over them without stopping.'],
  ['Iron-bound Chests', 'Ordinary blows just ring off the iron. A supercharged ram, Superflame breath or Invincibility cracks them open.'],
  ['Critters and Flick', 'Flick\'s glow shows how you are holding up: gold, then blue, then a flickering green. Roast or ram the realm\'s critters and Flick eats the butterflies they leave, mending you a little (or turning them into gems when you are well).'],
];

export class Menus {
  private layer: HTMLDivElement;
  private stack: Screen[] = [];
  private tree: UpgradeTree = 'horn';

  constructor(private game: Game, parent: HTMLElement) {
    this.layer = document.createElement('div');
    this.layer.className = 'ui-layer';
    parent.appendChild(this.layer);
  }

  get open(): boolean {
    return this.stack.length > 0;
  }

  hideAll(): void {
    for (const s of this.stack) s.el.remove();
    this.stack = [];
  }

  private push(el: HTMLElement, back: (() => void) | null, grid?: number): Screen {
    // The press that opened this screen must not also act inside it.
    this.game.input.clearBuffers();
    const top = this.stack[this.stack.length - 1];
    if (top) top.el.style.display = 'none';
    this.layer.appendChild(el);
    const s: Screen = { el, focus: [], idx: 0, back, ...(grid ? { grid } : {}) };
    this.stack.push(s);
    this.refreshFocus(s);
    return s;
  }

  private pop(): void {
    this.game.input.clearBuffers();
    const s = this.stack.pop();
    s?.el.remove();
    const top = this.stack[this.stack.length - 1];
    if (top) {
      top.el.style.display = '';
      this.refreshFocus(top);
    }
  }

  private replaceTop(el: HTMLElement, back: (() => void) | null, grid?: number): void {
    const s = this.stack.pop();
    s?.el.remove();
    this.push(el, back, grid);
  }

  private refreshFocus(s: Screen): void {
    s.focus = [...s.el.querySelectorAll<HTMLElement>('[data-f]')].filter((e) => !(e as HTMLButtonElement).disabled);
    s.idx = Math.min(s.idx, Math.max(0, s.focus.length - 1));
    s.focus.forEach((f, i) => {
      f.classList.toggle('focus', i === s.idx);
      f.onmouseenter = () => {
        s.idx = i;
        s.focus.forEach((g, k) => g.classList.toggle('focus', k === i));
      };
    });
  }

  update(_dt: number): void {
    const s = this.stack[this.stack.length - 1];
    if (!s) return;
    const inp = this.game.input;
    const n = s.focus.length;
    const step = s.grid ?? 1;
    let moved = false;
    if (n) {
      if (inp.take('down', 0.2)) {
        s.idx = (s.idx + step) % n;
        moved = true;
      }
      if (inp.take('up', 0.2)) {
        s.idx = (s.idx - step + n) % n;
        moved = true;
      }
      if (s.grid && inp.take('right', 0.2)) {
        s.idx = (s.idx + 1) % n;
        moved = true;
      }
      if (s.grid && inp.take('left', 0.2)) {
        s.idx = (s.idx - 1 + n) % n;
        moved = true;
      }
      if (moved) {
        this.game.audio.play('ui');
        s.focus.forEach((f, i) => f.classList.toggle('focus', i === s.idx));
        s.focus[s.idx]?.scrollIntoView({ block: 'nearest' });
      }
      if (inp.take('confirm', 0.2) || inp.take('interact', 0.2)) s.focus[s.idx]?.click();
    }
    if (inp.take('back', 0.2) && s.back) {
      this.game.audio.play('uiBack');
      s.back();
    }
  }

  private btn(label: string, fn: () => void, disabled = false, cls = 'btn'): HTMLButtonElement {
    const b = document.createElement('button');
    b.className = cls;
    b.innerHTML = label;
    b.dataset.f = '1';
    b.disabled = disabled;
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      if (b.disabled) return;
      this.game.audio.unlock();
      this.game.audio.play('uiConfirm');
      fn();
    });
    return b;
  }

  private div(cls: string, html = ''): HTMLDivElement {
    const d = document.createElement('div');
    d.className = cls;
    d.innerHTML = html;
    return d;
  }

  // --- title ----------------------------------------------------------------

  showTitle(): void {
    this.hideAll();
    const m = this.div('menu');
    const t = this.div('title-screen', '<h1>WYRMLING</h1><h2>First Flight</h2>');
    const list = this.div('menu-list');
    const save = loadSave();
    if (save) {
      const ex = explored(save, save.level);
      const eggs = eggsFound(save);
      const bits = [save.ngPlus ? `Legend Run ${save.ngPlus}` : '', LEVEL_INFO[save.level]?.name ?? save.level, ex !== null ? `${Math.round(ex * 100)}% explored` : '', eggs ? `${eggs} eggs` : ''].filter(Boolean).join(' &middot; ');
      list.append(this.btn(`Continue <small style="opacity:.6">&middot; ${bits}</small>`, () => this.game.continueGame()));
    }
    if (save && (save.clears ?? 0) > 0) {
      const n = (save.ngPlus ?? 0) + 1;
      list.append(this.btn(`New Game+ <small style="opacity:.6">&middot; Legend Run ${n}</small>`, () => this.confirmNewGamePlus()));
    }
    list.append(
      this.btn('New Game', () => this.showDifficulty()),
      this.btn('Options', () => this.showOptions()),
      this.btn('Controls', () => this.showControls()),
      this.btn('Credits', () => this.showCredits()),
    );
    t.append(list);
    m.append(t, this.div('menu-foot', 'A fan-made elemental dragon adventure &middot; best with mouse and keyboard or a gamepad'));
    this.push(m, null);
  }

  /** New Game+: explains what carries over, then starts the next Legend Run. */
  private confirmNewGamePlus(): void {
    const g = this.game;
    const save = g.state === 'ending' ? g.save : loadSave() ?? g.save;
    const n = (save.ngPlus ?? 0) + 1;
    const k = 1 + 0.45 * n;
    const m = this.div('menu dim');
    const p = this.div('panel', `<h2>Legend Run ${n}</h2><div class="sub">The Gloom returns, and it has learned.</div>
      <div class="entry"><p style="font-style:normal">The story begins again in the Fen. <b>You keep</b> your upgrades, health and spirit shards, spirit gems, relics, letters, eggs and scales, feats, Skill Points, medals and the Bestiary.</p>
      <p style="font-style:normal"><b>It gets harder:</b> foes have about ${Math.round(k * 100)}% of their health, hit harder, press the attack and are far more often elite. <b>It pays more:</b> ${Math.round((1 + 0.25 * n) * 100)}% gems from every foe, the treasure chests fill again, and new scales wait at the end.</p></div>`);
    const list = this.div('menu-list');
    list.append(this.btn('Begin the Legend Run', () => g.newGamePlus()), this.btn('Not yet', () => this.pop()));
    p.append(list);
    m.append(p);
    this.push(m, () => this.pop());
  }

  private showDifficulty(): void {
    const m = this.div('menu dim');
    const p = this.div('panel', '<h2>Choose your path</h2><div class="sub">You can change this later in Options.</div>');
    const list = this.div('menu-list');
    const desc: Record<Difficulty, string> = {
      story: 'Enemies hit softly and fall quickly. For the tale.',
      normal: 'The intended challenge. Learn the dodge.',
      hard: 'Enemies are tougher, faster and hit hard. Perfect dodges required.',
    };
    for (const d of ['story', 'normal', 'hard'] as Difficulty[]) {
      list.append(this.btn(`${DIFFICULTY[d].label}<br><small style="text-transform:none;letter-spacing:0;opacity:.7;font-family:system-ui">${desc[d]}</small>`, () => this.showPrologue(d)));
    }
    if (loadSave()) list.append(this.div('sub', '<br>Starting a new game replaces your saved progress.'));
    p.append(list);
    m.append(p);
    this.push(m, () => this.pop());
  }

  private showPrologue(d: Difficulty): void {
    const m = this.div('menu dim');
    m.style.background = 'rgba(4,2,10,.92)';
    const c = this.div('crawl');
    PROLOGUE.forEach((line, i) => {
      const p = document.createElement('p');
      p.textContent = line;
      p.style.animationDelay = `${i * 2.2}s`;
      c.append(p);
    });
    const go = this.btn('Begin', () => this.game.newGame(d));
    go.style.marginTop = '12px';
    go.style.opacity = '0';
    go.style.animation = `crawlIn 1s ${PROLOGUE.length * 2.2}s forwards`;
    c.append(go);
    const skip = this.div('menu-foot', 'Esc to skip');
    m.append(skip);
    m.append(c);
    this.replaceTop(m, () => this.game.newGame(d));
  }

  private showCredits(): void {
    const m = this.div('menu dim');
    const p = this.div('panel lore', `<h2>Credits</h2>
      <div class="entry"><h4>Wyrmling: First Flight</h4><p>An original fan tribute to the elemental dragon adventures of the mid-2000s. Every model, texture, sound and note of music is generated by code at runtime.</p></div>
      <div class="entry"><h4>Built with</h4><p>TypeScript, three.js and the Web Audio API.</p></div>`);
    p.append(this.btn('Back', () => this.pop()));
    m.append(p);
    this.push(m, () => this.pop());
  }

  // --- pause -----------------------------------------------------------------

  showPause(): void {
    this.hideAll();
    const g = this.game;
    const m = this.div('menu dim');
    const p = this.div('panel');
    p.style.minWidth = '360px';
    // Count this realm's secrets from what it actually placed.
    const count = (kinds: string[]) => {
      const list = (g.level?.secrets ?? []).filter((s) => kinds.includes(s.kind));
      return { have: list.filter((s) => g.save.found[s.id]).length, total: list.length };
    };
    const sec = count(['heart', 'mana', 'relic']);
    const eggs = count(['egg']);
    const letters = count(['letter']);
    const ex = g.level ? explored(g.save, g.level.def.id) : null;
    const bits = [
      ex !== null ? `${Math.round(ex * 100)}% explored` : '',
      sec.total ? `secrets ${sec.have}/${sec.total}` : '',
      eggs.total ? `eggs ${eggs.have}/${eggs.total}` : '',
      letters.total ? `letters ${letters.have}/${letters.total}` : '',
    ].filter(Boolean);
    p.innerHTML = `<h2>Paused</h2><div class="sub">${g.level?.def.name ?? ''}${bits.length ? ` &middot; ${bits.join(' &middot; ')}` : ''}</div>`;
    const st = g.save.stats;
    const mins = Math.floor(st.playTime / 60);
    p.append(this.div('stats', `<span>Spirit gems</span><b>${g.save.gems}</b><span>Enemies defeated</span><b>${st.kills}</b>
      <span>Best combo</span><b>${st.bestCombo}</b><span>Reactions</span><b>${st.reactions}</b><span>Time</span><b>${Math.floor(mins / 60)}h ${mins % 60}m</b>`));
    const list = this.div('menu-list');
    list.append(
      this.btn('Resume', () => g.resume()),
      this.btn('Abilities', () => this.showUpgrades()),
      this.btn('Moves', () => this.showMoves()),
      this.btn('Journal', () => this.showJournal()),
      this.btn('Scales', () => this.showSkins()),
      this.btn('Photo Mode', () => g.photo.enter()),
      this.btn('Options', () => this.showOptions()),
      this.btn('Controls', () => this.showControls()),
    );
    if (g.level?.def.id !== 'sanctum' && g.save.unlocked.includes('sanctum')) {
      list.append(this.btn('Return to the Sanctum', () => {
        this.hideAll();
        g.travel('sanctum');
      }));
    }
    list.append(this.btn('Save &amp; Quit to Title', () => g.quitToTitle()));
    p.append(list);
    m.append(p);
    this.push(m, () => g.resume());
  }

  showWardstone(w: Wardstone): void {
    this.hideAll();
    const g = this.game;
    const m = this.div('menu dim');
    const p = this.div('panel');
    p.style.minWidth = '360px';
    p.innerHTML = `<h2>Wardstone</h2><div class="sub">The stone hums. Your progress is safe here.</div>`;
    const list = this.div('menu-list');
    list.append(
      this.btn('Abilities', () => this.showUpgrades()),
      this.btn('Journal', () => this.showJournal()),
    );
    const others = g.wardstonesVisited(w);
    if (others.length > 0) list.append(this.btn('Fly to a Wardstone', () => this.showWardFlight(w)));
    if (g.level?.def.id !== 'sanctum' && g.save.unlocked.includes('sanctum')) {
      list.append(this.btn('Travel to the Sanctum', () => {
        this.hideAll();
        g.travel('sanctum');
      }));
    }
    list.append(this.btn('Leave', () => g.resume()));
    p.append(list);
    m.append(p);
    this.push(m, () => g.resume());
  }

  /** The other awakened Wardstones of this realm, nearest first. */
  private showWardFlight(from: Wardstone): void {
    const g = this.game;
    const m = this.div('menu dim');
    const p = this.div('panel');
    p.style.minWidth = '360px';
    p.innerHTML = '<h2>Fly to a Wardstone</h2><div class="sub">Stones you have awakened in this realm.</div>';
    const list = this.div('menu-list');
    const name = (id: string) => id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    for (const w of g.wardstonesVisited(from).sort((a, b) => Math.hypot(a.x - from.x, a.z - from.z) - Math.hypot(b.x - from.x, b.z - from.z))) {
      const d = Math.round(Math.hypot(w.x - from.x, w.z - from.z));
      list.append(this.btn(`${name(w.id)} <small style="opacity:.7">${d} m</small>`, () => g.flyToWardstone(w)));
    }
    list.append(this.btn('Back', () => this.pop()));
    p.append(list);
    m.append(p);
    this.push(m, () => this.pop());
  }

  showTravel(): void {
    const g = this.game;
    this.hideAll();
    g.state = 'pause';
    g.input.wantPointerLock = false;
    g.input.releaseLock();
    const m = this.div('menu dim');
    const p = this.div('panel', '<h2>The Wardgate</h2><div class="sub">Choose a realm. Realms you have finished can be revisited for secrets you could not reach before.</div>');
    const grid = this.div('levels');
    const medalOf = (lvl: string) => [3, 2, 1].find((n) => g.save.found[`medal:${lvl}:${n}`]) ?? 0;
    const exploredBar = (lvl: string) => {
      const e = explored(g.save, lvl);
      if (e === null) return '';
      const pct = Math.round(e * 100);
      return `<div class="lvl-explored"><i style="width:${pct}%"></i></div><p class="lvl-pct">${pct}% explored</p>`;
    };
    for (const id of ['fen', 'falls', 'frostworks', 'plains', 'keep']) {
      const info = LEVEL_INFO[id]!;
      const unlocked = g.save.unlocked.includes(id);
      const b = document.createElement('button');
      b.className = `lvl${g.save.levelsDone[id] ? ' done' : ''}`;
      b.dataset.f = '1';
      b.disabled = !unlocked;
      const found = Object.keys(g.save.found).filter((k) => k.startsWith(`${id}:`) && /:(heart|mana|relic)\d+$/.test(k)).length;
      b.innerHTML = `<h3>${unlocked ? info.name : '???'}</h3><p>${unlocked ? info.blurb : 'Sealed.'}</p><p style="margin-top:6px">${unlocked ? `Collectibles found: ${found}/${info.collectibles}` : ''}</p>${exploredBar(id)}${medalOf(id) ? `<p class="lvl-medal m${medalOf(id)}">${['', 'Bronze', 'Silver', 'Gold'][medalOf(id)]} Dragon Medal</p>` : ''}${unlocked && g.save.bestTimes?.[id] !== undefined ? `<p class="lvl-pct">Best time ${clock(g.save.bestTimes[id]!)}${PAR_TIMES[id] && g.save.bestTimes[id]! <= PAR_TIMES[id]! ? ' &#10022;' : ` &middot; par ${clock(PAR_TIMES[id] ?? 0)}`}</p>` : ''}`;
      b.addEventListener('click', () => {
        if (!unlocked) return;
        g.audio.play('uiConfirm');
        this.hideAll();
        g.input.wantPointerLock = true;
        g.input.requestLock();
        g.travel(id);
      });
      grid.append(b);
    }
    p.append(grid);
    const close = this.btn('Stay', () => g.resume());
    close.style.marginTop = '16px';
    p.append(close);
    m.append(p);
    this.push(m, () => g.resume(), 2);
  }

  showTrials(ground: TrialGround): void {
    const g = this.game;
    this.hideAll();
    g.state = 'pause';
    g.input.wantPointerLock = false;
    g.input.releaseLock();
    const m = this.div('menu dim');
    const p = this.div('panel', '<h2>Dragon Trials</h2><div class="sub">Optional challenges. The first clear pays far more than repeats.</div>');
    const grid = this.div('levels');
    for (const t of TRIALS) {
      const locked = t.needs.some((e) => !g.save.elements.includes(e));
      const done = !!g.save.found[`trial:${t.id}`];
      const b = document.createElement('button');
      b.className = `lvl${done ? ' done' : ''}`;
      b.dataset.f = '1';
      b.disabled = locked;
      b.innerHTML = `<h3>${t.name}</h3><p>${locked ? `Requires ${t.needs.join(', ')}.` : t.desc}</p>
        <p style="margin-top:6px;color:#cfe6ff">${locked ? '' : t.goal === 'endless' ? `Gems every wave &middot; best: ${extra(g.save).riftBest ?? 0} waves` : `Reward: ${done ? t.repeat : t.reward} gems &middot; ${t.time}s`}</p>`;
      b.addEventListener('click', () => {
        if (locked) return;
        g.audio.play('uiConfirm');
        this.hideAll();
        g.resume();
        ground.start(t);
      });
      grid.append(b);
    }
    p.append(grid);
    const close = this.btn('Not now', () => g.resume());
    close.style.marginTop = '16px';
    p.append(close);
    m.append(p);
    this.push(m, () => g.resume(), 2);
  }

  // --- abilities --------------------------------------------------------------

  private showUpgrades(): void {
    const el = this.buildUpgrades();
    this.push(el, () => this.pop(), 2);
  }

  private buildUpgrades(): HTMLElement {
    const g = this.game;
    const m = this.div('menu dim');
    const p = this.div('panel');
    p.innerHTML = `<h2>Abilities</h2>`;
    const bank = this.div('bank', `<i class="gem-icon"></i><span>${g.save.gems}</span> <small style="font:13px system-ui;color:#a99cc9">spirit gems to spend</small>`);
    p.append(bank);
    const tabs = this.div('tabs');
    const trees: UpgradeTree[] = ['horn', 'tail', 'wings', 'spirit', ...ELEMENTS];
    for (const t of trees) {
      const tb = document.createElement('button');
      const locked = (ELEMENTS as readonly string[]).includes(t) && !g.save.elements.includes(t as never);
      tb.className = `tab${t === this.tree ? ' on' : ''}${locked ? ' locked' : ''}`;
      tb.textContent = locked ? `${TREE_NAMES[t]} (sealed)` : TREE_NAMES[t];
      tb.addEventListener('click', () => {
        this.tree = t;
        g.audio.play('ui');
        this.rebuildUpgrades();
      });
      tabs.append(tb);
    }
    p.append(tabs);
    const cards = this.div('cards');
    for (const u of UPGRADES.filter((x) => x.tree === this.tree)) {
      const lvl = upgradeLevel(g.save, u.id);
      const cost = nextCost(g.save, u.id);
      const locked = u.element && !g.save.elements.includes(u.element);
      const card = this.div('card');
      const pips = u.costs.map((_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
      const desc = locked ? `Learn ${TREE_NAMES[u.tree]} from its Warden to unlock.` : lvl >= u.costs.length ? u.desc[u.desc.length - 1]! : u.desc[lvl]!;
      card.innerHTML = `<h3>${u.name}</h3><div class="pips">${pips}</div><p>${desc}</p>`;
      const row = this.div('row');
      if (locked) row.append(this.div('cost no', 'Sealed'));
      else if (cost === null) row.append(this.div('cost', 'Mastered'));
      else {
        const afford = g.save.gems >= cost;
        row.append(this.div(`cost${afford ? '' : ' no'}`, `<i class="gem-icon" style="width:12px;height:16px"></i>${cost}`));
        const b = this.btn(lvl === 0 ? 'Learn' : 'Upgrade', () => {
          if (buyUpgrade(g.save, u.id)) {
            g.audio.play('levelUp');
            writeSave(g.save);
            this.rebuildUpgrades();
          }
        }, !afford, 'btn small');
        row.append(b);
      }
      card.append(row);
      cards.append(card);
    }
    p.append(cards);
    const back = this.btn('Back', () => this.pop());
    back.style.marginTop = '16px';
    p.append(back);
    m.append(p);
    return m;
  }

  private rebuildUpgrades(): void {
    const s = this.stack[this.stack.length - 1];
    if (!s) return;
    const idx = s.idx;
    const el = this.buildUpgrades();
    s.el.replaceWith(el);
    s.el = el;
    this.refreshFocus(s);
    s.idx = Math.min(idx, s.focus.length - 1);
    s.focus.forEach((f, i) => f.classList.toggle('focus', i === s.idx));
  }

  // --- moves, journal, options, controls -----------------------------------------

  private showMoves(): void {
    const g = this.game;
    const m = this.div('menu dim');
    const p = this.div('panel', '<h2>Moves</h2><div class="sub">Gamepad: A jump &middot; X horn &middot; Y tail &middot; B dodge &middot; RT breath &middot; LB burst &middot; LT dragon time &middot; RB lock &middot; D-pad elements &middot; Back fury</div>');
    const list = this.div('moves');
    for (const mv of MOVE_LIST) {
      const locked = (mv.requires && upgradeLevel(g.save, mv.requires) === 0) || (mv.element && g.save.elements.length === 0);
      list.append(this.div(`move${locked ? ' locked' : ''}`, `<b>${mv.name}</b><span class="in">${mv.input}</span><p>${locked ? (mv.requires ? 'Unlock in Abilities.' : 'Learn an element first.') : mv.desc}</p>`));
    }
    p.append(list);
    const back = this.btn('Back', () => this.pop());
    back.style.marginTop = '16px';
    p.append(back);
    m.append(p);
    this.push(m, () => this.pop());
  }

  private journalTab: 'relics' | 'letters' | 'bestiary' | 'feats' | 'skills' | 'tips' = 'relics';

  private showJournal(): void {
    const g = this.game;
    const m = this.div('menu dim');
    const p = this.div('panel lore');
    p.innerHTML = '<h2>Journal</h2><div class="sub">Dragon Relics, letters and field notes.</div>';
    const tabs = this.div('tabs');
    const tab = (id: typeof this.journalTab, label: string) => {
      const b = this.btn(label, () => {
        this.journalTab = id;
        this.pop();
        this.showJournal();
      });
      if (this.journalTab === id) b.classList.add('on');
      tabs.append(b);
    };
    tab('relics', 'Relics');
    tab('letters', 'Letters');
    tab('bestiary', 'Bestiary');
    tab('feats', 'Feats');
    tab('skills', 'Skill Points');
    tab('tips', 'Field notes');
    p.append(tabs);
    if (this.journalTab === 'tips') {
      for (const [t, d] of TIPS) p.append(this.div('entry', `<h4>${t}</h4><p>${d}</p>`));
    } else if (this.journalTab === 'bestiary') {
      const ids = Object.keys(BESTIARY);
      const seen = ids.filter((id) => g.save.found[`seen:${id}`]).length;
      p.append(this.div('entry', `<p style="font-style:normal;color:#a99cc9">Foes met: ${seen} / ${ids.length}</p>`));
      for (const id of ids) {
        const def = ENEMIES[id];
        if (!def) continue;
        if (!g.save.found[`seen:${id}`]) {
          p.append(this.div('entry missing', '<h4>???</h4><p style="font-style:normal;color:#a99cc9">Not yet met.</p>'));
          continue;
        }
        const b = BESTIARY[id]!;
        const weak: string[] = [];
        const strong: string[] = [];
        for (const [t, v] of Object.entries(def.resist)) {
          const name = t[0]!.toUpperCase() + t.slice(1);
          if (v > 1) weak.push(name);
          else if (v === 0) strong.push(`${name} (immune)`);
          else if (v < 1) strong.push(name);
        }
        const tags = [
          weak.length ? `<span class="tag weak">Weak: ${weak.join(', ')}</span>` : '',
          strong.length ? `<span class="tag strong">Resists: ${strong.join(', ')}</span>` : '',
        ].join('');
        p.append(this.div('entry beast', `<h4>${def.name}</h4><p>${b.blurb}</p><div class="tags">${tags}</div><div class="tip">${b.tip}</div>`));
      }
    } else if (this.journalTab === 'skills') {
      const done = SKILLS.filter((s) => g.save.found[skillKey(s.id)]).length;
      p.append(this.div('entry', `<p style="font-style:normal;color:#a99cc9">Skill Points: ${done} / ${SKILLS.length} &middot; ${SKILL_REWARD} spirit gems each. A beaten boss waits by a standing stone for a rematch.</p>`));
      let lvl = '';
      for (const s of SKILLS) {
        if (s.level !== lvl) {
          lvl = s.level;
          p.append(this.div('entry', `<h4 style="color:var(--gold)">${LEVEL_INFO[lvl]?.name ?? lvl}</h4>`));
        }
        const have = !!g.save.found[skillKey(s.id)];
        p.append(this.div(`entry feat${have ? ' done' : ''}`, `<h4>${have ? '&#10022; ' : ''}${s.name}</h4><p>${s.desc}</p>`));
      }
    } else if (this.journalTab === 'feats') {
      const done = FEATS.filter((f) => g.save.found[featKey(f.id)]).length;
      p.append(this.div('entry', `<p style="font-style:normal;color:#a99cc9">Feats earned: ${done} / ${FEATS.length}</p>`));
      for (const f of FEATS) {
        const have = !!g.save.found[featKey(f.id)];
        const n = Math.min(f.goal, f.progress(g.save));
        const pct = Math.round((n / f.goal) * 100);
        p.append(this.div(`entry feat${have ? ' done' : ''}`,
          `<h4>${have ? '&#10022; ' : ''}${f.name}<small>${f.reward} gems</small></h4><p>${f.desc}</p><div class="bar"><i style="width:${pct}%"></i></div><small class="count">${n} / ${f.goal}</small>`));
      }
    } else if (this.journalTab === 'relics') {
      for (const [id, r] of Object.entries(RELICS)) {
        const have = !!g.save.found[`relic:${id}`];
        p.append(this.div(`entry${have ? '' : ' missing'}`, have ? `<h4>${r.title}</h4><p>${r.text}</p>` : `<h4>Undiscovered relic</h4><p style="font-style:normal;color:#a99cc9">Somewhere in ${LEVEL_INFO[r.level]?.name ?? 'the realms'}.</p>`));
      }
    } else {
      let any = false;
      for (const [lvl, list] of Object.entries(LETTERS)) {
        const read = list.filter((l) => g.save.found[letterKey(lvl, l.id)]);
        if (read.length === 0) continue;
        any = true;
        p.append(this.div('entry', `<h4 style="color:var(--gold)">${LEVEL_INFO[lvl]?.name ?? lvl}</h4>`));
        for (const l of read) p.append(this.div('entry letter', `<h4>${l.title}</h4><p>${l.text}</p><div class="from">&mdash; ${l.from}</div>`));
      }
      if (!any) p.append(this.div('entry missing', '<h4>No letters yet</h4><p style="font-style:normal;color:#a99cc9">Letters, diaries and orders lie scattered across the realms. Keep an eye out for a glint of red wax.</p>'));
    }
    const back = this.btn('Back', () => this.pop());
    back.style.marginTop = '16px';
    p.append(back);
    m.append(p);
    this.push(m, () => this.pop());
  }

  /** The end of a realm: how the visit went, with a medal for the best runs. */
  showResults(then: () => void): void {
    const g = this.game;
    const v = g.visit;
    this.hideAll();
    g.state = 'pause';
    g.input.wantPointerLock = false;
    g.input.releaseLock();
    const list = g.level?.secrets ?? [];
    const have = list.filter((s) => g.save.found[s.id]).length;
    const secFrac = list.length ? have / list.length : 1;
    const secs = Math.max(0, Math.round(g.save.stats.playTime - v.t0));
    const kills = g.save.stats.kills - v.kills0;
    const deaths = g.save.stats.deaths - v.deaths0;
    const rank = RANKS[Math.min(RANKS.length - 1, v.rank)]!;
    const newBest = recordTime(g.save, v.id, secs);
    const par = PAR_TIMES[v.id];
    const score = secFrac * 45 + (v.rank / (RANKS.length - 1)) * 30 + Math.max(0, 15 - v.hits * 0.5) + Math.max(0, 10 - deaths * 5);
    const medal = score >= 82 ? 3 : score >= 58 ? 2 : 1;
    const prev = [3, 2, 1].find((n) => g.save.found[`medal:${v.id}:${n}`]) ?? 0;
    for (let n = 1; n <= medal; n++) g.save.found[`medal:${v.id}:${n}`] = true;
    g.checkFeats();
    writeSave(g.save);
    const MEDALS = ['', 'Bronze', 'Silver', 'Gold'];
    const m = this.div('menu dim');
    const p = this.div('panel results');
    p.innerHTML = `<h2>Realm Restored</h2><div class="sub">${g.level?.def.name ?? ''}</div>`;
    const rows: [string, string][] = [
      ['Time', `${clock(secs)}${par ? ` <small style="opacity:.75">${secs <= par ? '&#10022; under par' : `par ${clock(par)}`}</small>` : ''}${newBest ? ' <small style="color:var(--gold)">best!</small>' : ` <small style="opacity:.6">best ${clock(g.save.bestTimes?.[v.id] ?? secs)}</small>`}`],
      ['Foes defeated', String(kills)],
      ['Spirit gems gathered', String(v.gems)],
      ['Best combo', String(v.combo)],
      ['Top style rank', `${rank.letter} &middot; ${rank.name}`],
      ['Hits taken', String(v.hits)],
      ['Secrets found', `${have} / ${list.length}`],
    ];
    const lvlSkills = SKILLS.filter((s) => s.level === g.level?.def.id);
    if (lvlSkills.length) rows.push(['Skill Points', `${lvlSkills.filter((s) => g.save.found[skillKey(s.id)]).length} / ${lvlSkills.length}`]);
    const grid = this.div('res-grid');
    rows.forEach(([k, val], i) => {
      const row = this.div('res-row', `<span>${k}</span><b>${val}</b>`);
      row.style.animationDelay = `${0.15 + i * 0.12}s`;
      grid.append(row);
    });
    p.append(grid);
    const md = this.div(`medal m${medal}`, `<i></i><b>${MEDALS[medal]} Dragon Medal</b>${medal > prev && prev > 0 ? '<small>New best!</small>' : ''}${secFrac < 1 ? '<small>Secrets remain. The Wardgate lets you return any time.</small>' : ''}`);
    md.style.animationDelay = `${0.2 + rows.length * 0.12}s`;
    p.append(md);
    const go = this.btn('Continue', () => {
      this.hideAll();
      g.state = 'play';
      then();
    });
    go.style.marginTop = '14px';
    p.append(go);
    m.append(p);
    this.push(m, null);
    g.audio.play('levelUp');
  }

  private showSkins(): void {
    const g = this.game;
    const m = this.div('menu dim');
    const p = this.div('panel');
    p.style.minWidth = '420px';
    const n = eggsFound(g.save);
    p.innerHTML = `<h2>Scales</h2><div class="sub">Return lost dragon eggs to earn new scales. Eggs returned: ${n}</div>`;
    const grid = this.div('skin-grid');
    const cur = g.save.skin ?? 'violet';
    const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
    for (const k of SKINS) {
      const open = skinUnlocked(g.save, k.id);
      const look = { ...HERO_LOOK, ...k.look };
      const card = this.div(`skin-card${open ? '' : ' locked'}${cur === k.id ? ' on' : ''}`,
        `<div class="sw"><span style="background:${hex(look.body)}"></span><span style="background:${hex(look.belly)}"></span><span style="background:${hex(look.membrane)}"></span></div><b>${open ? k.name : '???'}</b><small>${open ? (cur === k.id ? 'Wearing' : 'Wear') : k.clears ? (k.clears === 1 ? 'Finish the story' : 'Finish a Legend Run') : `${k.eggs} eggs`}</small>`);
      if (open) {
        card.addEventListener('click', () => {
          g.save.skin = k.id;
          writeSave(g.save);
          g.applySkin();
          g.audio.play('uiConfirm');
          this.pop();
          this.showSkins();
        });
      }
      grid.append(card);
    }
    p.append(grid);
    p.append(this.btn('Back', () => this.pop()));
    m.append(p);
    this.push(m, () => this.pop());
  }

  private showOptions(): void {
    const g = this.game;
    const o = g.options;
    const m = this.div('menu dim');
    const p = this.div('panel');
    p.innerHTML = '<h2>Options</h2>';
    const grid = this.div('opts');
    const slider = (label: string, get: () => number, set: (v: number) => void, min = 0, max = 1, step = 0.05) => {
      const l = document.createElement('label');
      l.textContent = label;
      const s = document.createElement('input');
      s.type = 'range';
      s.min = String(min);
      s.max = String(max);
      s.step = String(step);
      s.value = String(get());
      s.addEventListener('input', () => {
        set(Number(s.value));
        g.applyOptions();
      });
      grid.append(l, s);
    };
    const choice = <T extends string | boolean>(label: string, opts: [T, string][], get: () => T, set: (v: T) => void) => {
      const l = document.createElement('label');
      l.textContent = label;
      const c = this.div('seg-ctl');
      const render = () => {
        c.innerHTML = '';
        for (const [v, name] of opts) {
          const b = this.btn(name, () => {
            set(v);
            g.applyOptions();
            render();
            this.refreshFocus(this.stack[this.stack.length - 1]!);
          }, false, `btn small${get() === v ? ' focus' : ''}`);
          if (get() === v) b.style.borderColor = '#f5c46b';
          c.append(b);
        }
      };
      render();
      grid.append(l, c);
    };
    slider('Master volume', () => o.volume, (v) => (o.volume = v));
    slider('Music', () => o.music, (v) => (o.music = v));
    slider('Sound effects', () => o.sfx, (v) => (o.sfx = v));
    slider('Camera sensitivity', () => o.sensitivity, (v) => (o.sensitivity = v), 0.2, 2.5, 0.05);
    slider('Screen shake', () => o.shake, (v) => (o.shake = v), 0, 1.5, 0.05);
    choice('Invert camera Y', [[false, 'Off'], [true, 'On']], () => o.invertY, (v) => (o.invertY = v));
    choice('Auto camera', [[true, 'On'], [false, 'Off']], () => o.autoCamera, (v) => (o.autoCamera = v));
    choice('Damage numbers', [[true, 'On'], [false, 'Off']], () => o.damageNumbers, (v) => (o.damageNumbers = v));
    choice('Flashing effects', [[false, 'Full'], [true, 'Reduced']], () => !!o.reduceFlashing, (v) => (o.reduceFlashing = v));
    choice('Graphics', [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']], () => o.quality, (v) => (o.quality = v));
    if (g.state !== 'title') {
      choice('Difficulty', [['story', 'Story'], ['normal', 'Adventurer'], ['hard', 'Legend']] as [Difficulty, string][], () => g.save.difficulty, (v) => {
        g.save.difficulty = v;
        writeSave(g.save);
      });
    }
    p.append(grid);
    const back = this.btn('Back', () => this.pop());
    back.style.marginTop = '18px';
    p.append(back);
    m.append(p);
    this.push(m, () => this.pop());
  }

  private showControls(): void {
    const m = this.div('menu dim');
    const rows: [string, string, string][] = [
      ['Move', 'W A S D', 'Left stick'], ['Camera', 'Mouse', 'Right stick'], ['Jump / flap / glide', 'Space (hold to glide)', 'A'],
      ['Horn attack', 'Left mouse / J', 'X'], ['Tail attack', 'E / L', 'Y'], ['Breath', 'Hold right mouse / K', 'RT'],
      ['Burst', 'Q / U', 'LB'], ['Fury', 'X', 'Back'], ['Dodge / hold to charge', 'Shift', 'B'], ['Dragon Time', 'Hold C', 'LT'],
      ['Lock on', 'Tab / middle mouse', 'RB'], ['Change element', '1-4, mouse wheel, R', 'D-pad'], ['Interact', 'F', 'L3'], ['Flick: tap for a secret, hold for the way on!', 'H', 'R3'], ['Pause', 'Esc', 'Start'],
    ];
    const p = this.div('panel', `<h2>Controls</h2><div class="stats" style="grid-template-columns:auto auto auto;gap:8px 28px">
      <b style="text-align:left;color:#f5c46b">Action</b><b style="text-align:left;color:#f5c46b">Keyboard &amp; mouse</b><b style="text-align:left;color:#f5c46b">Gamepad</b>
      ${rows.map(([a, k, pd]) => `<span>${a}</span><b style="text-align:left">${k}</b><b style="text-align:left">${pd}</b>`).join('')}</div>
      <div class="sub">Click the game to capture the mouse. Esc releases it.</div>`);
    p.append(this.btn('Back', () => this.pop()));
    m.append(p);
    this.push(m, () => this.pop());
  }

  // --- ending --------------------------------------------------------------------------

  showEnding(lines: string[]): void {
    const g = this.game;
    this.hideAll();
    g.state = 'ending';
    g.input.wantPointerLock = false;
    g.input.releaseLock();
    const m = this.div('menu dim');
    m.style.background = 'rgba(4,2,10,.8)';
    const c = this.div('crawl');
    lines.forEach((line, i) => {
      const p = document.createElement('p');
      p.innerHTML = line;
      p.style.animationDelay = `${i * 2.4}s`;
      c.append(p);
    });
    const st = g.save.stats;
    const stats = this.div('stats', `<span>Enemies defeated</span><b>${st.kills}</b><span>Best combo</span><b>${st.bestCombo}</b>
      <span>Elemental reactions</span><b>${st.reactions}</b><span>Collectibles</span><b>${Object.keys(g.save.found).filter((k) => /^[a-z]+:(heart|mana|relic)\d+$/.test(k)).length}</b>`);
    stats.style.opacity = '0';
    stats.style.animation = `crawlIn 1s ${lines.length * 2.4}s forwards`;
    stats.style.justifyContent = 'center';
    c.append(stats);
    const go = this.btn('Return to the Sanctum', () => {
      this.hideAll();
      g.state = 'play';
      g.travel('sanctum');
    });
    go.style.opacity = '0';
    go.style.animation = `crawlIn 1s ${lines.length * 2.4 + 0.5}s forwards`;
    c.append(go);
    // The story is done: offer the next, harder journey (it can also wait for the title screen).
    const again = this.btn(`Begin Legend Run ${(g.save.ngPlus ?? 0) + 1} (New Game+)`, () => this.confirmNewGamePlus());
    again.style.opacity = '0';
    again.style.animation = `crawlIn 1s ${lines.length * 2.4 + 0.8}s forwards`;
    c.append(again);
    const unlocked = SKINS.filter((k) => k.clears === (g.save.clears ?? 0));
    if (unlocked.length) {
      const note = this.div('sub', `New scales unlocked: ${unlocked.map((k) => k.name).join(', ')}. Wear them from the pause menu.`);
      note.style.opacity = '0';
      note.style.animation = `crawlIn 1s ${lines.length * 2.4 + 0.5}s forwards`;
      c.append(note);
    }
    m.append(c);
    this.push(m, null);
  }
}
