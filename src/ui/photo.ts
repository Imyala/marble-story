import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Quality } from '../render/renderer';

/**
 * Photo mode, from the pause menu: the world holds still, the HUD goes away,
 * and a free camera orbits Aster. Filters restyle the shot, and a capture
 * saves it as a PNG. It renders at the high setting while open, whatever the
 * graphics option says, since nothing is moving.
 */

interface Filter { name: string; sat: number; contrast: number; lift: number; tint: [number, number, number]; vig: number }

const FILTERS: Filter[] = [
  { name: 'Natural', sat: 1, contrast: 1, lift: 0, tint: [1, 1, 1], vig: 0 },
  { name: 'Vivid', sat: 1.35, contrast: 1.08, lift: 0, tint: [1, 1, 1], vig: 0.15 },
  { name: 'Dusk', sat: 1.1, contrast: 1.04, lift: 0.01, tint: [1.08, 0.95, 0.84], vig: 0.35 },
  { name: 'Noir', sat: 0, contrast: 1.22, lift: -0.02, tint: [1, 1, 1], vig: 0.45 },
  { name: 'Dream', sat: 0.85, contrast: 0.92, lift: 0.06, tint: [1.0, 0.95, 1.08], vig: 0.25 },
];

const REACH = 25;

export class PhotoMode {
  active = false;
  private overlay: HTMLDivElement | null = null;
  private label: HTMLElement | null = null;
  private target = new THREE.Vector3();
  private anchor = new THREE.Vector3();
  private yaw = 0;
  private pitch = 0.25;
  private dist = 6;
  private filter = 0;
  /** Depth-of-field strength, 0 (off) to 4. */
  private dof = 0;
  private keys = new Set<string>();
  private drag: { id: number; x: number; y: number } | null = null;
  private prevQuality: Quality = 'high';
  private offs: (() => void)[] = [];

  constructor(private game: Game) {}

  enter(): void {
    const g = this.game;
    if (this.active || !g.level) return;
    this.active = true;
    g.menus.hideAll();
    g.hud.show(false);
    g.input.releaseLock();
    this.prevQuality = g.renderer.quality;
    if (g.renderer.quality !== 'high') g.renderer.setQuality('high');
    const p = g.player.body;
    this.anchor.set(p.x, p.y + 1, p.z);
    this.target.copy(this.anchor);
    const off = g.camera.position.clone().sub(this.target);
    this.dist = THREE.MathUtils.clamp(off.length(), 2, 14);
    this.yaw = Math.atan2(off.x, off.z);
    this.pitch = Math.asin(THREE.MathUtils.clamp(off.y / (off.length() || 1), -0.9, 0.9));
    this.filter = 0;
    this.dof = 0;
    this.applyFilter();
    this.buildUi();
  }

  exit(): void {
    const g = this.game;
    if (!this.active) return;
    this.active = false;
    g.renderer.setPhotoFilter(null);
    g.renderer.setDof(null);
    if (this.prevQuality !== 'high') g.renderer.setQuality(this.prevQuality);
    for (const off of this.offs) off();
    this.offs = [];
    this.overlay?.remove();
    this.overlay = null;
    this.keys.clear();
    g.input.clearBuffers();
    g.hud.show(true);
    g.menus.showPause();
  }

  private applyFilter(): void {
    const f = FILTERS[this.filter]!;
    this.game.renderer.setPhotoFilter(f);
    if (this.label) this.label.textContent = `Filter: ${f.name}${this.dof ? ` \u00b7 Focus blur ${this.dof}` : ''}`;
  }

  private cycle(d = 1): void {
    this.filter = (this.filter + d + FILTERS.length) % FILTERS.length;
    this.applyFilter();
    this.game.audio.play('ui');
  }

  private on<K extends keyof WindowEventMap>(t: EventTarget, type: K | string, fn: (e: never) => void, opt?: AddEventListenerOptions): void {
    t.addEventListener(type, fn as EventListener, opt);
    this.offs.push(() => t.removeEventListener(type, fn as EventListener, opt));
  }

  private buildUi(): void {
    const g = this.game;
    const o = document.createElement('div');
    o.className = 'photo-layer';
    o.innerHTML = `<div class="photo-bar"><b>Photo mode</b><span class="photo-filter"></span>
      <span class="photo-keys">Drag: orbit &middot; Wheel: zoom &middot; WASD, R/F: move &middot; 1-5 or Tab: filter &middot; [ ]: focus blur &middot; Enter: capture &middot; Esc: back</span></div>
      <div class="photo-btns"><button class="btn small" data-a="filter">Filter</button><button class="btn small" data-a="dof">Blur</button><button class="btn small" data-a="in">+</button><button class="btn small" data-a="out">&minus;</button><button class="btn small" data-a="snap">Capture</button><button class="btn small" data-a="done">Done</button></div>`;
    this.label = o.querySelector('.photo-filter');
    g.renderer.canvas.parentElement!.appendChild(o);
    this.overlay = o;
    this.applyFilter();
    o.querySelectorAll('button').forEach((b) => {
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const a = (b as HTMLElement).dataset.a;
        if (a === 'filter') this.cycle();
        else if (a === 'dof') this.setDof((this.dof + 1) % 5);
        else if (a === 'in') this.dist = Math.max(1.5, this.dist * 0.85);
        else if (a === 'out') this.dist = Math.min(18, this.dist / 0.85);
        else if (a === 'snap') this.snap();
        else if (a === 'done') this.exit();
      });
    });
    this.on(o, 'pointerdown', (e: PointerEvent) => {
      if (this.drag) return;
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      o.setPointerCapture(e.pointerId);
    });
    this.on(o, 'pointermove', (e: PointerEvent) => {
      if (!this.drag || e.pointerId !== this.drag.id) return;
      this.yaw -= (e.clientX - this.drag.x) * 0.006;
      this.pitch = THREE.MathUtils.clamp(this.pitch + (e.clientY - this.drag.y) * 0.005, -0.6, 1.35);
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
    });
    const up = (e: PointerEvent) => { if (this.drag && e.pointerId === this.drag.id) this.drag = null; };
    this.on(o, 'pointerup', up);
    this.on(o, 'pointercancel', up);
    this.on(o, 'wheel', (e: WheelEvent) => { this.dist = THREE.MathUtils.clamp(this.dist * (e.deltaY > 0 ? 1.1 : 0.9), 1.5, 18); }, { passive: true });
    this.on(window, 'keydown', (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.code === 'Escape') { this.exit(); return; }
      if (e.code === 'Enter' || e.code === 'Space') { this.snap(); return; }
      if (e.code === 'Tab') { e.preventDefault(); this.cycle(e.shiftKey ? -1 : 1); return; }
      if (e.code === 'BracketRight') { this.setDof(Math.min(4, this.dof + 1)); return; }
      if (e.code === 'BracketLeft') { this.setDof(Math.max(0, this.dof - 1)); return; }
      const n = Number(e.key);
      if (n >= 1 && n <= FILTERS.length) { this.filter = n - 1; this.applyFilter(); return; }
      this.keys.add(e.code);
    }, { capture: true });
    this.on(window, 'keyup', (e: KeyboardEvent) => { e.stopPropagation(); this.keys.delete(e.code); }, { capture: true });
  }

  private setDof(n: number): void {
    this.dof = n;
    this.applyFilter();
    this.game.audio.play('ui');
  }

  /** Saves what the camera sees (at the current filter) as a PNG. */
  snap(): void {
    const g = this.game;
    g.renderer.render(g.realTime, 0);
    const name = `wyrmling-${g.level?.def.id ?? 'shot'}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
    g.renderer.canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
    g.audio.play('cue', 1.6, 0.6);
    const flash = document.createElement('div');
    flash.className = 'photo-flash';
    this.overlay?.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
  }

  update(dt: number): void {
    if (!this.active) return;
    const cam = this.game.camera;
    const k = this.keys;
    const sp = 6 * dt;
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    const move = new THREE.Vector3();
    if (k.has('KeyW')) move.add(new THREE.Vector3(fx, 0, fz));
    if (k.has('KeyS')) move.add(new THREE.Vector3(-fx, 0, -fz));
    if (k.has('KeyA')) move.add(new THREE.Vector3(fz, 0, -fx));
    if (k.has('KeyD')) move.add(new THREE.Vector3(-fz, 0, fx));
    if (k.has('KeyR')) move.y += 1;
    if (k.has('KeyF')) move.y -= 1;
    if (k.has('ArrowLeft')) this.yaw += 1.6 * dt;
    if (k.has('ArrowRight')) this.yaw -= 1.6 * dt;
    if (k.has('ArrowUp')) this.pitch = Math.min(1.35, this.pitch + 1.2 * dt);
    if (k.has('ArrowDown')) this.pitch = Math.max(-0.6, this.pitch - 1.2 * dt);
    if (k.has('Equal') || k.has('NumpadAdd')) this.dist = Math.max(1.5, this.dist - 6 * dt);
    if (k.has('Minus') || k.has('NumpadSubtract')) this.dist = Math.min(18, this.dist + 6 * dt);
    this.target.addScaledVector(move, sp);
    // Stay near Aster: this is a photo mode, not a way to scout the level.
    const off = this.target.clone().sub(this.anchor);
    if (off.length() > REACH) this.target.copy(this.anchor).addScaledVector(off.normalize(), REACH);
    const cp = Math.cos(this.pitch);
    cam.position.set(
      this.target.x + Math.sin(this.yaw) * cp * this.dist,
      this.target.y + Math.sin(this.pitch) * this.dist,
      this.target.z + Math.cos(this.yaw) * cp * this.dist,
    );
    cam.lookAt(this.target);
    // Focus on whatever the camera orbits.
    this.game.renderer.setDof(this.dof ? this.dist : null, [0, 0.0006, 0.0014, 0.0028, 0.005][this.dof]);
  }
}
