import * as THREE from 'three';
import type { Game } from '../game/game';
import { SPEAKERS } from '../game/story';
import { forInput } from './keys';

export interface Line {
  who: string;
  text: string;
  /** Runs when the line appears. */
  action?: () => void;
  /** 'none' keeps the gameplay camera. */
  shot?: 'speaker' | 'none' | 'wide';
}

export class Dialogue {
  private box: HTMLDivElement;
  private nameEl: HTMLDivElement;
  private textEl: HTMLDivElement;
  private topBar: HTMLDivElement;
  private botBar: HTMLDivElement;
  private lines: Line[] = [];
  private idx = 0;
  private shown = 0;
  private full = '';
  private done: (() => void) | null = null;
  private active = false;
  private talkT = 0;

  constructor(private game: Game, parent: HTMLElement) {
    const layer = document.createElement('div');
    layer.className = 'ui-layer';
    this.topBar = document.createElement('div');
    this.topBar.className = 'letterbox top';
    this.botBar = document.createElement('div');
    this.botBar.className = 'letterbox bot';
    this.box = document.createElement('div');
    this.box.className = 'dialogue';
    this.box.style.display = 'none';
    this.box.innerHTML = `<div class="dlg-box"><div class="dlg-name"></div><div class="dlg-text"></div><div class="dlg-next">Space / Click &#9656; &nbsp; Esc to skip</div></div>`;
    this.nameEl = this.box.querySelector('.dlg-name')!;
    this.textEl = this.box.querySelector('.dlg-text')!;
    layer.append(this.topBar, this.botBar, this.box);
    parent.appendChild(layer);
    this.box.addEventListener('pointerdown', () => this.advance());
  }

  get isActive(): boolean {
    return this.active;
  }

  start(lines: Line[], onDone: () => void): void {
    this.lines = lines;
    this.idx = -1;
    this.done = onDone;
    this.active = true;
    this.box.style.display = 'block';
    this.topBar.classList.add('on');
    this.botBar.classList.add('on');
    this.next();
  }

  private next(): void {
    this.idx++;
    if (this.idx >= this.lines.length) {
      this.finish();
      return;
    }
    const l = this.lines[this.idx]!;
    const sp = SPEAKERS[l.who] ?? { name: l.who, color: '#ffffff' };
    this.nameEl.textContent = sp.name;
    this.nameEl.style.color = sp.color;
    this.full = forInput(l.text, this.game.input);
    this.shown = 0;
    const hint = this.box.querySelector('.dlg-next');
    if (hint) hint.innerHTML = forInput('Space / Click &#9656; &nbsp; Esc to skip', this.game.input);
    this.textEl.textContent = '';
    this.game.dialogueSpeaker = l.who;
    l.action?.();
    this.frame(l);
  }

  private frame(l: Line): void {
    const g = this.game;
    if (l.shot === 'none') {
      g.cam.clearShot();
      return;
    }
    const aster = new THREE.Vector3(g.player.x, g.player.y + 1.1, g.player.z);
    const ours = l.who === 'aster' || l.who === 'flick';
    // The one Aster is talking with: this speaker, or (for Aster's and Flick's own lines) the last one.
    const found = ours ? null : this.speakerPos(l.who);
    const other = found ?? this.lastOther ?? aster.clone().add(new THREE.Vector3(Math.sin(g.player.yaw) * 3, 0.5, Math.cos(g.player.yaw) * 3));
    if (found) {
      this.lastOther = other.clone();
      this.lastShort = this.isShort(l.who);
    }
    // Small folk (the Burrowfolk, a firefly, a Gloomling cook): the camera comes down to their height and in closer.
    const short = ours ? this.lastShort : this.isShort(l.who);
    const focus = ours ? aster : other;
    const along = other.clone().sub(aster);
    along.y = 0;
    const len = Math.max(1, along.length());
    along.normalize();
    const wide = l.shot === 'wide';
    // A pair standing far apart: the shot centres on the one speaking, framed as if they stood 6 m apart.
    const span = wide ? len : Math.min(len, 6);
    const centre = focus.clone().lerp(ours ? other : aster, span / (2 * len));
    const dist = wide ? len + 9 : short ? span * 0.7 + 3.4 : span * 0.8 + 4.5;
    const at = (side: THREE.Vector3): THREE.Vector3 => {
      const pos = centre.clone().addScaledVector(side, dist).addScaledVector(along, l.who === 'aster' ? span * 0.35 : -span * 0.35);
      pos.y += wide ? 4 : short ? 0.45 : 1.2;
      const gy = g.col.terrainAt(pos.x, pos.z);
      if (gy > -1e3 && pos.y < gy + 1) pos.y = gy + 1;
      return pos;
    };
    // One side of the pair or the other: the usual one, unless Nyxa or the scenery is in the way there and not on the far side.
    const side = new THREE.Vector3(-along.z, 0, along.x);
    let pos = at(side);
    const inWay = this.blockers(pos, aster, other);
    if (inWay > 0) {
      const alt = at(side.clone().negate());
      if (this.blockers(alt, aster, other) < inWay) pos = alt;
    }
    const look = focus.clone().lerp(centre, short ? 0.3 : 0.4);
    // Aimed a little low, so short heads sit clear above the text box.
    if (short && !wide) look.y -= 0.3;
    g.cam.setShot(pos, look);
  }

  /** How many of the two speakers the camera at `pos` would not see: Nyxa standing in front, or rock, walls and huts between. */
  private blockers(pos: THREE.Vector3, ...who: THREE.Vector3[]): number {
    const g = this.game;
    const partner = g.partner.present && !g.partner.hidden ? new THREE.Vector3(g.partner.x, g.partner.y + 1, g.partner.z) : null;
    const seg = new THREE.Line3();
    const near = new THREE.Vector3();
    let n = 0;
    for (const t of who) {
      seg.set(pos, t);
      if (partner && partner.distanceTo(t) > 1.2 && seg.closestPointToPoint(partner, true, near).distanceTo(partner) < 1.3) {
        n++;
        continue;
      }
      const d = t.clone().sub(pos);
      const L = d.length();
      if (L < 0.5) continue;
      d.divideScalar(L);
      if (g.col.raycast(pos.x, pos.y, pos.z, d.x, d.y, d.z, L - 0.6, true, true).t < L - 0.6) n++;
    }
    return n;
  }

  private lastOther: THREE.Vector3 | null = null;
  /** Whether the last other speaker was one of the small folk (for Aster's and Flick's replies). */
  private lastShort = false;

  /** Height of the face above the feet for small folk that do not say (a firefly elder, a Gloomling cook). */
  private static readonly FOLK_TALK_Y = 1.0;

  /**
   * A speaker who is not a dragon but a prop of the realm with that id (the
   * Burrowfolk, the side quests' firefly and Gloomling givers). Such a prop
   * may give `talkY`, the height of its face above its feet.
   */
  private folk(who: string): { x: number; y: number; z: number; talkY?: number } | null {
    for (const p of this.game.level?.props ?? []) {
      const f = p as unknown as { id?: unknown; x?: unknown; y?: unknown; z?: unknown; talkY?: unknown };
      if (f.id === who && typeof f.x === 'number' && typeof f.y === 'number' && typeof f.z === 'number') {
        return { x: f.x, y: f.y, z: f.z, ...(typeof f.talkY === 'number' ? { talkY: f.talkY } : {}) };
      }
    }
    return null;
  }

  /** One of the small folk: the talk camera frames them lower and closer than a dragon. */
  private isShort(who: string): boolean {
    const f = this.folk(who);
    return !!f && (f.talkY ?? Dialogue.FOLK_TALK_Y) < 1.5;
  }

  private speakerPos(who: string): THREE.Vector3 | null {
    const g = this.game;
    if (who === 'aster') return new THREE.Vector3(g.player.x, g.player.y + 1.1, g.player.z);
    if (who === 'flick') return g.flick.position.clone();
    const npc = g.level?.npcs.find((n) => n.id === who);
    if (npc) return new THREE.Vector3(npc.x, npc.y + 1.4 * npc.rig.look.scale, npc.z);
    const folk = this.folk(who);
    if (folk) return new THREE.Vector3(folk.x, folk.y + (folk.talkY ?? Dialogue.FOLK_TALK_Y), folk.z);
    if (g.boss && g.boss.speakerId === who) return new THREE.Vector3(g.boss.x, g.boss.y + g.boss.height * 0.7, g.boss.z);
    // Nyxa travelling as Aster's partner (not standing as an NPC).
    if (who === 'nyxa' && g.partner.present && !g.partner.hidden) return new THREE.Vector3(g.partner.x, g.partner.y + 1.9, g.partner.z);
    return null;
  }

  advance(): void {
    if (!this.active) return;
    if (this.shown < this.full.length) {
      this.shown = this.full.length;
      this.textEl.textContent = this.full;
      return;
    }
    this.game.audio.play('ui', 1.1, 0.6);
    this.next();
  }

  private finish(): void {
    this.active = false;
    this.box.style.display = 'none';
    this.topBar.classList.remove('on');
    this.botBar.classList.remove('on');
    this.lastOther = null;
    this.lastShort = false;
    const d = this.done;
    this.done = null;
    d?.();
  }

  update(dt: number): void {
    if (!this.active) return;
    const inp = this.game.input;
    if (this.shown < this.full.length) {
      this.shown = Math.min(this.full.length, this.shown + dt * 55);
      this.textEl.textContent = this.full.slice(0, Math.floor(this.shown));
      this.talkT -= dt;
      if (this.talkT <= 0) {
        this.talkT = 0.07;
        this.game.audio.play('talk');
      }
    }
    if (inp.take('confirm', 0.2) || inp.take('horn', 0.2) || inp.take('interact', 0.2)) this.advance();
    if (inp.take('back', 0.2)) {
      // The same Esc press also reads as Pause; eat it so skipping does not pause.
      inp.consume('pause');
      // Skip: run the remaining actions so story state still advances.
      for (let i = this.idx + 1; i < this.lines.length; i++) this.lines[i]!.action?.();
      this.finish();
    }
  }
}
