import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Element } from '../game/types';
import { ELEMENT_NAMES } from '../game/types';
import { RANKS } from '../combat/style';
import type { Boss } from '../enemies/boss';
import { Enemy } from '../enemies/enemy';
import { SHARDS_PER_UPGRADE, eggsFound } from '../game/progress';
import { forInput } from './keys';
import { POWERS } from '../entities/powerups';

const EL_COLORS: Record<Element, string> = { fire: '#ff7a2a', lightning: '#7ac8ff', ice: '#8fe4ff', earth: '#8bd05a' };
const EL_KEYS: Record<Element, string> = { fire: '1', lightning: '2', ice: '3', earth: '4' };
const EL_POS: Record<Element, [number, number]> = { fire: [60, 16], lightning: [104, 60], ice: [60, 104], earth: [16, 60] };
const RANK_COLORS = ['#b8b0d0', '#ffb070', '#ff8a3a', '#ff5a3a', '#ff3a8a', '#e0a0ff'];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

interface DmgNum {
  e: HTMLDivElement;
  x: number;
  y: number;
  z: number;
  t: number;
  vy: number;
  /** What it is stacking on (rapid breath ticks add up into one number). */
  key?: unknown;
  sum?: number;
}

export class Hud {
  readonly root: HTMLDivElement;
  private overlay: HTMLDivElement;
  private hpFill!: HTMLElement;
  private hpLag!: HTMLElement;
  private manaFill!: HTMLElement;
  private dtFill!: HTMLElement;
  private powerBox!: HTMLElement;
  private powerName!: HTMLElement;
  private powerFill!: HTMLElement;
  private hpBar!: HTMLElement;
  private manaBar!: HTMLElement;
  private furyArc!: SVGCircleElement;
  private furyRing!: SVGSVGElement;
  private gemText!: HTMLElement;
  private gemsBox!: HTMLElement;
  private shardsBox!: HTMLElement;
  private elBoxes = new Map<Element, HTMLElement>();
  private elName!: HTMLElement;
  private styleBox!: HTMLElement;
  private styleRank!: HTMLElement;
  private styleName!: HTMLElement;
  private styleBarFill!: HTMLElement;
  private comboBox!: HTMLElement;
  private promptBox!: HTMLElement;
  private toasts!: HTMLElement;
  private bossBox!: HTMLElement;
  private bossFill!: HTMLElement;
  private bossLag!: HTMLElement;
  private bossName!: HTMLElement;
  private bossPhase!: HTMLElement;
  private vignette!: HTMLElement;
  private lowhp!: HTMLElement;
  private fadeBox!: HTMLElement;
  private perfectBox!: HTMLElement;
  private reticle!: HTMLElement;
  private elKeys!: HTMLElement;
  private ebars: { el: HTMLElement; fill: HTMLElement; chip: HTMLElement; chipV: number; who: unknown }[] = [];
  private flickBox!: HTMLElement;
  private flickText!: HTMLElement;
  private deathBox!: HTMLElement;
  private clickHint!: HTMLElement;
  private nums: DmgNum[] = [];
  private boss: Boss | null = null;
  private hurtT = 0;
  private flickT = 0;
  private lastToast = new Map<string, number>();
  private relicBox: HTMLElement | null = null;
  private relicT = 0;
  private wardT = 0;
  private proj = new THREE.Vector3();
  private threats: Enemy[] = [];
  private arrows: HTMLDivElement[] = [];
  /** The quest tracker under the bars (the tracked quest's current step). */
  private questBox!: HTMLElement;
  private questHtml = '';
  private questT = 0;

  constructor(private game: Game, parent: HTMLElement) {
    this.overlay = el('div', 'ui-layer');
    this.root = el('div', 'ui-layer');
    // A soft vignette frames the scene and pulls the eye to the middle.
    parent.appendChild(el('div', 'vignette'));
    parent.appendChild(this.overlay);
    parent.appendChild(this.root);
    this.build();
  }

  private build(): void {
    const r = this.root;
    const o = this.overlay;
    this.vignette = el('div', 'vignette');
    this.lowhp = el('div', 'lowhp');
    this.perfectBox = el('div', 'perfect-flash');
    o.append(this.vignette, this.lowhp, this.perfectBox);

    const tl = el('div', 'hud-tl');
    const emblem = el('div', 'hud-emblem');
    emblem.innerHTML = `<svg viewBox="0 0 64 64"><path d="M32 12 L38 26 L52 28 L41 37 L44 51 L32 44 L20 51 L23 37 L12 28 L26 26 Z" fill="#f5c46b" opacity=".9"/></svg>`;
    this.furyRing = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.furyRing.setAttribute('viewBox', '0 0 76 76');
    this.furyRing.classList.add('fury-ring');
    this.furyRing.innerHTML = `<circle cx="38" cy="38" r="35" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="5"/>
      <circle class="arc" cx="38" cy="38" r="35" fill="none" stroke="#c070ff" stroke-width="5" stroke-linecap="round"
      stroke-dasharray="220" stroke-dashoffset="220" transform="rotate(-90 38 38)"/>`;
    this.furyArc = this.furyRing.querySelector('.arc') as SVGCircleElement;
    this.furyRing.style.width = '76px';
    this.furyRing.style.height = '76px';
    emblem.appendChild(this.furyRing);
    const bars = el('div', 'bars');
    this.hpBar = el('div', 'bar hp');
    this.hpLag = el('i', 'lag');
    this.hpFill = el('i', 'fill');
    this.hpBar.append(this.hpLag, this.hpFill);
    this.manaBar = el('div', 'bar mana');
    this.manaFill = el('i', 'fill');
    this.manaBar.append(this.manaFill);
    const dt = el('div', 'bar thin dt');
    this.dtFill = el('i', 'fill');
    dt.append(this.dtFill);
    this.powerBox = el('div', 'power-meter');
    this.powerName = el('b');
    const pb = el('div', 'bar thin');
    this.powerFill = el('i', 'fill');
    pb.append(this.powerFill);
    this.powerBox.append(this.powerName, pb);
    bars.append(this.hpBar, this.manaBar, dt, this.powerBox);
    tl.append(emblem, bars);
    r.appendChild(tl);
    this.questBox = el('div', 'quest-tracker');
    this.questBox.style.display = 'none';
    r.appendChild(this.questBox);

    const tr = el('div', 'hud-tr');
    this.gemsBox = el('div', 'gems');
    this.gemText = el('span', '', '0');
    this.gemsBox.append(el('i', 'gem-icon'), this.gemText);
    this.shardsBox = el('div', 'shards');
    tr.append(this.gemsBox, this.shardsBox);
    r.appendChild(tr);

    const br = el('div', 'hud-br');
    const els = el('div', 'elements');
    for (const e of ['fire', 'lightning', 'ice', 'earth'] as Element[]) {
      const b = el('div', 'el', `<span>${EL_KEYS[e]}</span>`);
      b.style.left = `${EL_POS[e][0]}px`;
      b.style.top = `${EL_POS[e][1]}px`;
      b.style.setProperty('--c', EL_COLORS[e]);
      els.appendChild(b);
      this.elBoxes.set(e, b);
    }
    this.elName = el('div', 'el-name', '');
    this.elKeys = el('div', 'el-keys', 'Hold RMB: Breath &middot; Q: Burst');
    br.append(els, this.elName, this.elKeys);
    r.appendChild(br);

    this.styleBox = el('div', 'style-meter');
    this.styleRank = el('div', 'style-rank', 'D');
    this.styleName = el('div', 'style-name', '');
    const sb = el('div', 'style-bar');
    this.styleBarFill = el('i');
    sb.appendChild(this.styleBarFill);
    this.comboBox = el('div', 'combo');
    this.styleBox.append(this.styleRank, this.styleName, sb, this.comboBox);
    r.appendChild(this.styleBox);

    this.promptBox = el('div', 'prompt');
    this.promptBox.style.opacity = '0';
    r.appendChild(this.promptBox);
    this.toasts = el('div', 'toasts');
    r.appendChild(this.toasts);

    this.bossBox = el('div', 'boss');
    this.bossName = el('div', 'boss-name');
    const bb = el('div', 'bar');
    this.bossLag = el('i', 'lag');
    this.bossFill = el('i', 'fill');
    bb.append(this.bossLag, this.bossFill);
    this.bossPhase = el('div', 'boss-phase');
    this.bossBox.append(this.bossName, bb, this.bossPhase);
    this.bossBox.style.display = 'none';
    r.appendChild(this.bossBox);

    this.reticle = el('div', 'reticle');
    this.reticle.style.display = 'none';
    r.appendChild(this.reticle);
    for (let i = 0; i < 8; i++) {
      const bar = el('div', 'ebar');
      const chip = el('i', 'chip');
      const fill = el('i', 'fill');
      bar.append(chip, fill);
      bar.style.display = 'none';
      r.appendChild(bar);
      this.ebars.push({ el: bar, fill, chip, chipV: 1, who: null });
    }

    this.flickBox = el('div', 'flick hidden');
    this.flickText = el('p');
    const fb = el('div');
    fb.append(el('b', '', 'FLICK'), this.flickText);
    this.flickBox.append(el('div', 'flick-face'), fb);
    r.appendChild(this.flickBox);

    this.clickHint = el('div', 'prompt', 'Click to play &middot; the mouse steers the camera');
    this.clickHint.style.cssText = 'top:46%;bottom:auto;opacity:0;';
    r.appendChild(this.clickHint);

    for (let i = 0; i < 6; i++) {
      const a = el('div', 'threat');
      a.style.display = 'none';
      r.appendChild(a);
      this.arrows.push(a);
    }

    this.deathBox = el('div', 'death', '<h1>The light fades...</h1>');
    o.appendChild(this.deathBox);
    this.fadeBox = el('div', 'fade');
    o.appendChild(this.fadeBox);
  }

  show(on: boolean): void {
    this.root.classList.toggle('hidden', !on);
  }

  fade(v: number): void {
    this.fadeBox.style.opacity = String(v);
  }

  update(dt: number): void {
    const g = this.game;
    const p = g.player;
    const hpK = Math.max(0, p.hp / p.maxHp);
    this.hpFill.style.width = `${hpK * 100}%`;
    this.hpLag.style.width = `${hpK * 100}%`;
    this.hpBar.style.width = `${200 + (p.maxHp - 100) * 0.8}px`;
    this.manaFill.style.width = `${Math.max(0, p.mana / p.maxMana) * 100}%`;
    this.manaBar.style.width = `${200 + (p.maxMana - 100) * 0.8}px`;
    this.dtFill.style.width = `${(p.dtime / p.dtimeMax) * 100}%`;
    this.furyArc.setAttribute('stroke-dashoffset', String(220 - (p.fury / 100) * 220));
    const pw = p.power ?? (p.superT > 0 ? 'supercharge' : null);
    this.powerBox.classList.toggle('on', !!pw);
    if (pw) {
      const def = POWERS[pw];
      const k = p.power ? p.powerT / def.secs : p.superT / 3;
      if (this.powerName.textContent !== def.name) this.powerName.textContent = def.name;
      this.powerBox.style.setProperty('--pc', def.css);
      this.powerFill.style.width = `${Math.max(0, k) * 100}%`;
      this.powerBox.classList.toggle('ending', !!p.power && p.powerT < 3);
    }
    this.furyRing.classList.toggle('ready', p.fury >= 100);
    this.gemText.textContent = String(g.save.gems);
    const hs = g.save.heartShards % SHARDS_PER_UPGRADE;
    const ms = g.save.manaShards % SHARDS_PER_UPGRADE;
    const eggs = eggsFound(g.save);
    const shardHtml = `<span style="color:#ff8a9a">&#9829; <b>${hs}</b>/4</span><span style="color:#8af0aa">&#9670; <b>${ms}</b>/4</span>${eggs ? `<span class="egg-count" title="Lost dragon eggs returned"><i></i><b>${eggs}</b></span>` : ''}`;
    if (this.shardsBox.innerHTML !== shardHtml) this.shardsBox.innerHTML = shardHtml;

    // Elements.
    const owned = g.save.elements;
    for (const [e, b] of this.elBoxes) {
      b.classList.toggle('owned', owned.includes(e));
      b.classList.toggle('active', p.element === e);
    }
    this.elName.textContent = p.element ? ELEMENT_NAMES[p.element] : owned.length ? '' : 'No element yet';
    this.elName.style.color = p.element ? EL_COLORS[p.element] : '#a99cc9';

    // Style meter.
    const st = g.style;
    const rank = st.rank;
    const showStyle = st.points > 1 || st.combo > 1;
    this.styleBox.style.opacity = showStyle ? '1' : '0';
    this.styleRank.textContent = RANKS[rank]!.letter;
    this.styleRank.style.color = RANK_COLORS[rank]!;
    this.styleName.textContent = RANKS[rank]!.name;
    this.styleName.style.color = RANK_COLORS[rank]!;
    this.styleBarFill.style.width = `${st.progress * 100}%`;
    this.styleBarFill.style.color = RANK_COLORS[rank]!;
    this.comboBox.innerHTML = st.combo > 1 ? `${st.combo} <small>HITS</small>` : '';

    // Hurt vignette.
    this.hurtT = Math.max(0, this.hurtT - dt);
    this.vignette.style.opacity = String(Math.min(1, this.hurtT * 2));
    this.lowhp.style.opacity = hpK < 0.25 && p.alive ? '1' : '0';

    // Boss.
    if (this.boss) {
      const k = Math.max(0, this.boss.hp / this.boss.maxHp);
      this.bossFill.style.width = `${k * 100}%`;
      this.bossLag.style.width = `${k * 100}%`;
      const n = this.boss.phases;
      let html = '';
      for (let i = 0; i < n; i++) html += `<i class="${i < this.boss.phase ? 'on' : ''}"></i>`;
      if (this.bossPhase.innerHTML !== html) this.bossPhase.innerHTML = html;
      if (!this.boss.alive && this.boss.deadT > 1.5) this.bossBar(null);
    }

    // Lock-on reticle.
    const lock = p.lock;
    if (lock && lock.alive) {
      const s = this.toScreen(lock.x, lock.y + lock.height * 0.6, lock.z);
      if (s) {
        this.reticle.style.display = 'block';
        this.reticle.style.left = `${s[0]}px`;
        this.reticle.style.top = `${s[1]}px`;
      } else this.reticle.style.display = 'none';
    } else this.reticle.style.display = 'none';

    // The element hint names the buttons in hand.
    const keys = forInput('Hold RMB: Breath \u00b7 Q: Burst', g.input);
    if (this.elKeys.textContent !== keys) this.elKeys.textContent = keys;

    // Health bars over foes hit in the last few seconds (and the lock target).
    {
      const px = p.x;
      const pz = p.z;
      const list = g.enemies
        .filter((e) => e.alive && !e.isBoss && (e === lock || (e.hp < e.maxHp && g.time - e.hurtAt < 4)) && Math.hypot(e.x - px, e.z - pz) < 32)
        .sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz))
        .slice(0, this.ebars.length);
      this.ebars.forEach((bar, i) => {
        const e = list[i];
        const s = e ? this.toScreen(e.x, e.y + e.height + 0.45, e.z) : null;
        if (!e || !s) {
          bar.el.style.display = 'none';
          bar.who = null;
          return;
        }
        const f = Math.max(0, e.hp / e.maxHp);
        if (bar.who !== e) {
          bar.who = e;
          bar.chipV = f;
          bar.el.classList.toggle('elite', !!e.elite);
        }
        // The white chip trails the real value, so each hit reads as a bite.
        bar.chipV = bar.chipV > f ? Math.max(f, bar.chipV - dt * 0.6) : f;
        bar.el.style.display = 'block';
        bar.el.style.left = `${s[0]}px`;
        bar.el.style.top = `${s[1]}px`;
        bar.el.style.opacity = String(e === lock ? 1 : Math.min(1, (4 - (g.time - e.hurtAt)) * 2));
        bar.fill.style.width = `${f * 100}%`;
        bar.chip.style.width = `${bar.chipV * 100}%`;
      });
    }

    // Damage numbers.
    for (const n of this.nums) {
      n.t += dt;
      n.y += n.vy * dt;
      n.vy -= 4 * dt;
      const s = this.toScreen(n.x, n.y, n.z);
      if (s && n.t < 0.9) {
        n.e.style.display = 'block';
        n.e.style.left = `${s[0]}px`;
        n.e.style.top = `${s[1]}px`;
        n.e.style.opacity = String(Math.min(1, (0.9 - n.t) * 3));
      } else n.e.style.display = 'none';
    }
    const done = this.nums.filter((n) => n.t >= 0.9);
    for (const d of done) d.e.remove();
    if (done.length) this.nums = this.nums.filter((n) => n.t < 0.9);

    // Flick bubble: waits while a conversation is on screen.
    const talking = g.state === 'dialogue';
    if (this.flickT > 0) {
      this.flickBox.classList.toggle('hidden', talking);
      if (!talking) {
        this.flickT -= dt;
        this.flickShown += dt;
        // Long lines get longer before a queued one takes over.
        const minShow = Math.min(this.flickDur, 2 + (this.flickText.textContent?.length ?? 0) * 0.035);
        const next = this.flickQueue.length > 0 && (this.flickT <= 0 || this.flickShown >= minShow);
        if (next) {
          const [text, secs] = this.flickQueue.shift()!;
          this.showFlick(text, secs);
        } else if (this.flickT <= 0) this.flickBox.classList.add('hidden');
      }
    }
    if (this.relicBox) {
      this.relicT -= dt;
      if (this.relicT <= 0 || (this.relicT < 7 && (g.input.pressed('confirm') || g.input.pressed('interact')))) {
        this.relicBox.remove();
        this.relicBox = null;
      }
    }
    this.wardT -= dt;
    this.updateQuest(dt);
    this.updateThreats();
    const needClick = g.state === 'play' && g.input.wantPointerLock && !g.input.locked && !g.input.usingPad && !g.input.usingTouch;
    this.clickHint.style.opacity = needClick ? '1' : '0';
  }

  /** Redraws the quest tracker a few times a second, and flashes it when the step changes. */
  private updateQuest(dt: number): void {
    const g = this.game;
    this.questBox.classList.toggle('away', g.state === 'dialogue');
    this.questT -= dt;
    if (this.questT > 0) return;
    this.questT = 0.3;
    const tr = g.options.questTracker !== false && g.level ? g.quests.tracker() : null;
    const html = tr ? `<b>${tr.main ? '' : '<i></i>'}${tr.title}</b><p>${tr.text}</p>` : '';
    if (html === this.questHtml) return;
    const flash = this.questHtml !== '' && html !== '';
    this.questHtml = html;
    this.questBox.innerHTML = html;
    this.questBox.style.display = html ? '' : 'none';
    if (flash) {
      this.questBox.classList.remove('flash');
      void this.questBox.offsetWidth;
      this.questBox.classList.add('flash');
    }
  }

  private toScreen(x: number, y: number, z: number): [number, number] | null {
    const v = this.proj.set(x, y, z).project(this.game.camera);
    if (v.z > 1 || v.z < -1) return null;
    return [(v.x * 0.5 + 0.5) * window.innerWidth, (-v.y * 0.5 + 0.5) * window.innerHeight];
  }

  /** An enemy started winding up; point at it if it is off screen. */
  threat(e: Enemy): void {
    if (!this.threats.includes(e)) this.threats.push(e);
  }

  private updateThreats(): void {
    this.threats = this.threats.filter((e) => e.alive && (e.state === 'windup' || e.state === 'active'));
    const cam = this.game.camera;
    let n = 0;
    const W = window.innerWidth;
    const H = window.innerHeight;
    for (const e of this.threats) {
      if (n >= this.arrows.length) break;
      const v = this.proj.set(e.x, e.y + e.height * 0.5, e.z).project(cam);
      const behind = v.z > 1;
      const onScreen = !behind && Math.abs(v.x) < 0.92 && Math.abs(v.y) < 0.9;
      if (onScreen) continue;
      let dx = behind ? -v.x : v.x;
      let dy = behind ? -v.y : v.y;
      if (behind && Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) dy = -1;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      const a = this.arrows[n++]!;
      const rx = W * 0.44;
      const ry = H * 0.42;
      a.style.display = 'block';
      a.style.left = `${W / 2 + dx * rx}px`;
      a.style.top = `${H / 2 - dy * ry}px`;
      a.style.transform = `translate(-50%, -50%) rotate(${Math.atan2(dx, dy)}rad)`;
      const col = e.attack ? Enemy.telegraphColor(e.attack) : 0xff4040;
      a.style.borderBottomColor = `#${col.toString(16).padStart(6, '0')}`;
    }
    for (let i = n; i < this.arrows.length; i++) this.arrows[i]!.style.display = 'none';
  }

  prompt(label: string | null): void {
    if (label) {
      const html = `<kbd>F</kbd>${label}`;
      if (this.promptBox.innerHTML !== html) this.promptBox.innerHTML = html;
      this.promptBox.style.opacity = '1';
    } else this.promptBox.style.opacity = '0';
  }

  toast(text: string, kind: 'info' | 'good' | 'warn' | 'hint' = 'info'): void {
    const now = performance.now();
    if ((this.lastToast.get(text) ?? 0) > now - 1500) return;
    this.lastToast.set(text, now);
    const t = el('div', `toast ${kind}`, forInput(text, this.game.input));
    this.toasts.appendChild(t);
    while (this.toasts.children.length > 4) this.toasts.firstChild!.remove();
    setTimeout(() => t.classList.add('out'), 2200);
    setTimeout(() => t.remove(), 2800);
  }

  bigText(text: string, color: number): void {
    const t = el('div', 'big-text', text);
    t.style.color = `#${color.toString(16).padStart(6, '0')}`;
    this.root.appendChild(t);
    setTimeout(() => t.remove(), 1200);
  }

  levelTitle(name: string, sub: string): void {
    const t = el('div', 'level-title', `<h1>${name}</h1><div class="rule"></div><p>${sub}</p>`);
    this.root.appendChild(t);
    setTimeout(() => t.remove(), 4600);
  }

  number(x: number, y: number, z: number, n: number, color: number, crit: boolean, key?: unknown): void {
    // Small, fast hits on the same foe add up into one number instead of a swarm.
    if (key !== undefined && !crit) {
      const same = this.nums.find((q) => q.key === key && q.t < 0.35);
      if (same) {
        same.sum = (same.sum ?? 0) + n;
        same.e.textContent = String(same.sum);
        same.t = Math.min(same.t, 0.12);
        same.e.classList.toggle('big', same.sum >= 20);
        return;
      }
    }
    if (this.nums.length > 30) return;
    const e = el('div', `dmg${crit ? ' crit' : ''}`, String(n));
    e.style.color = `#${color.toString(16).padStart(6, '0')}`;
    e.style.display = 'none';
    this.root.appendChild(e);
    this.nums.push({ e, x: x + (Math.random() - 0.5) * 0.6, y, z: z + (Math.random() - 0.5) * 0.6, t: 0, vy: 2.5, key, sum: n });
  }

  bossBar(b: Boss | null): void {
    this.boss = b;
    this.bossBox.style.display = b ? 'block' : 'none';
    if (b) this.bossName.textContent = b.displayName;
  }

  hurt(frac: number): void {
    this.hurtT = Math.max(this.hurtT, 0.3 + frac * 2);
  }

  flashMana(): void {
    this.manaBar.classList.remove('flash');
    void this.manaBar.offsetWidth;
    this.manaBar.classList.add('flash');
  }

  furyReady(): void {
    this.flick('Your fury is full! Press X to unleash it!', 4);
  }

  furyUsed(): void {
    this.perfectBox.style.opacity = '1';
    setTimeout(() => (this.perfectBox.style.opacity = '0'), 250);
  }

  perfect(): void {
    this.perfectBox.style.opacity = '1';
    setTimeout(() => (this.perfectBox.style.opacity = '0'), 350);
  }

  gemBump(): void {
    this.gemsBox.classList.remove('bump');
    void this.gemsBox.offsetWidth;
    this.gemsBox.classList.add('bump');
  }

  elementChanged(e: Element): void {
    const b = this.elBoxes.get(e);
    if (b) {
      b.animate([{ transform: 'translate(-50%,-50%) rotate(45deg) scale(1.4)' }, { transform: 'translate(-50%,-50%) rotate(45deg) scale(1)' }], { duration: 250 });
    }
  }

  dragonTime(on: boolean): void {
    const r = this.game.renderer;
    r.look.dragon = on;
    r.canvas.classList.toggle('dtime', on && !r.grading);
  }

  /**
   * Flick says something. A line that arrives while another is showing waits
   * its turn; the current line then gets at least three seconds on screen.
   */
  flick(text: string, seconds = 5, now = false): void {
    // Something the player just asked for jumps the queue.
    if (now) {
      this.showFlick(text, seconds);
      return;
    }
    if (this.flickT > 0) {
      if (this.flickText.textContent === text) {
        this.flickT = Math.max(this.flickT, seconds);
        return;
      }
      if (this.flickQueue.length < 3 && !this.flickQueue.some(([t]) => t === text)) this.flickQueue.push([text, seconds]);
      return;
    }
    this.showFlick(text, seconds);
  }

  private flickQueue: [string, number][] = [];
  private flickShown = 0;
  private flickDur = 0;

  /** Drops whatever Flick was saying or about to say (a new level, say). */
  clearFlick(): void {
    this.flickQueue.length = 0;
    this.flickT = 0;
    this.flickBox.classList.add('hidden');
  }

  private showFlick(text: string, seconds: number): void {
    this.flickText.textContent = forInput(text, this.game.input);
    this.flickBox.classList.remove('hidden');
    this.flickT = seconds;
    this.flickDur = seconds;
    this.flickShown = 0;
  }

  /** A parchment card; quests reuse it for the pages they pay (with their own heading and hint). */
  letter(title: string, from: string, text: string, sub = 'Letter found', hint = 'Kept in the Journal.'): void {
    this.relicBox?.remove();
    this.relicBox = el('div', 'relic-card letter', `<div class="sub">${sub}</div><h2>${title}</h2><p>${text}</p><div class="from">&mdash; ${from}</div><div class="hint">${hint}</div>`);
    this.root.appendChild(this.relicBox);
    this.relicT = 11;
  }

  relic(title: string, text: string): void {
    this.relicBox?.remove();
    this.relicBox = el('div', 'relic-card', `<div class="sub">Dragon Relic found</div><h2>${title}</h2><p>${text}</p><div class="hint">Read it again any time in the Journal.</div>`);
    this.root.appendChild(this.relicBox);
    this.relicT = 9;
  }

  wardHint(): void {
    if (this.wardT > 0) return;
    this.wardT = 12;
    this.flick('A Gloom Totem is shielding them! Smash the totem first!', 4);
  }

  death(on: boolean): void {
    this.deathBox.classList.toggle('on', on);
  }
}
