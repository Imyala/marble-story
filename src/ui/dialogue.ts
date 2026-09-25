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
    const other = this.speakerPos(l.who) ?? this.lastOther ?? aster.clone().add(new THREE.Vector3(Math.sin(g.player.yaw) * 3, 0.5, Math.cos(g.player.yaw) * 3));
    if (l.who !== 'aster' && l.who !== 'flick' && this.speakerPos(l.who)) this.lastOther = other.clone();
    const focus = l.who === 'aster' || l.who === 'flick' ? aster : other;
    const mid = aster.clone().lerp(other, 0.5);
    const along = other.clone().sub(aster);
    along.y = 0;
    const len = Math.max(1, along.length());
    along.normalize();
    const side = new THREE.Vector3(-along.z, 0, along.x);
    const wide = l.shot === 'wide';
    const dist = wide ? len + 9 : len * 0.8 + 4.5;
    const pos = mid.clone().addScaledVector(side, dist).addScaledVector(along, l.who === 'aster' ? len * 0.35 : -len * 0.35);
    pos.y += wide ? 4 : 1.2;
    const gy = g.col.terrainAt(pos.x, pos.z);
    if (gy > -1e3 && pos.y < gy + 1) pos.y = gy + 1;
    const look = focus.clone().lerp(mid, 0.4);
    g.cam.setShot(pos, look);
  }

  private lastOther: THREE.Vector3 | null = null;

  private speakerPos(who: string): THREE.Vector3 | null {
    const g = this.game;
    if (who === 'aster') return new THREE.Vector3(g.player.x, g.player.y + 1.1, g.player.z);
    if (who === 'flick') return g.flick.position.clone();
    const npc = g.level?.npcs.find((n) => n.id === who);
    if (npc) return new THREE.Vector3(npc.x, npc.y + 1.4 * npc.rig.look.scale, npc.z);
    if (g.boss && g.boss.speakerId === who) return new THREE.Vector3(g.boss.x, g.boss.y + g.boss.height * 0.7, g.boss.z);
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
