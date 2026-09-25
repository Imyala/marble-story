import * as THREE from 'three';
import type { Game } from '../game/game';
import type { Builder, Level } from '../world/level';
import { Collectible, Portal, Wardstone, type CollectKind } from '../entities/props';
import { Chest } from '../entities/breakables';
import { EggThief } from '../entities/thief';
import { PowerShrine, POWERS } from '../entities/powerups';
import { explored } from '../game/progress';

/**
 * The world map: an aerial view of the current realm, rendered once from
 * straight above with an orthographic camera and tinted into an old map
 * (parchment by day, indigo in the Keep), with markers on top: Aster, the
 * Wardstones (awakened ones fly you there), fights, the boss, portals,
 * power-up shrines, secrets already found and the current quest targets.
 * Secrets still missing are only counted in the side panel, so the map
 * guides without spoiling.
 *
 * Opened from the pause menu or with the Map action (M). Drag, the wheel,
 * pinch, the keys or a stick pan and zoom it.
 */

/** Long side of the aerial image, in pixels (about 3 px a metre in a big realm). */
const MAP_PX = 800;
/** Clear colour for empty sky under the camera, keyed out when tinting. */
const KEY = new THREE.Color(1, 0, 1);

/** Where a realm's secrets lie (found ones included), noted while it is built. */
interface SecretSpot { kind: CollectKind; x: number; z: number }
const SECRET_SPOTS = new WeakMap<Level, Map<string, SecretSpot>>();

/**
 * Notes where every collectible of the realm is placed, including the ones
 * already found (which the builder skips). Called before the realm's build.
 */
export function noteSecrets(b: Builder): void {
  const spots = new Map<string, SecretSpot>();
  SECRET_SPOTS.set(b.level, spots);
  const lvl = b.level.def.id;
  const collectible = b.collectible.bind(b);
  b.collectible = (id, kind, x, z, y, relicId) => {
    spots.set(`${lvl}:${id}`, { kind, x, z });
    collectible(id, kind, x, z, y, relicId);
  };
  const thief = b.eggThief.bind(b);
  b.eggThief = (id, x, z, leash) => {
    spots.set(`${lvl}:egg-${id}`, { kind: 'egg', x, z });
    thief(id, x, z, leash);
  };
}

/** A cached aerial image of one realm. */
interface Aerial {
  level: Level;
  /** Changes when the realm changes shape (a gate opens, a bridge drops...). */
  key: string;
  img: HTMLCanvasElement;
  /** The camera it was taken with: projects the world onto the image. */
  cam: THREE.OrthographicCamera;
  w: number;
  h: number;
  /** How long the render took, in milliseconds. */
  ms: number;
}

type MarkKind = 'aster' | 'ward' | 'arena' | 'boss' | 'portal' | 'shrine' | 'quest' | 'giver' | CollectKind | 'chest';

interface Mark {
  kind: MarkKind;
  /** Image-space position. */
  ix: number;
  iy: number;
  label: string;
  detail?: string;
  /** Lit (awake, cleared, found, ready) or dim. */
  on?: boolean;
  /** Screen colour for shrines. */
  color?: string;
  ward?: Wardstone;
  /** The tracked quest's target. */
  tracked?: boolean;
  /** Heading on the image, radians (Aster). */
  angle?: number;
}

const wardName = (id: string) => id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export class WorldMap {
  active = false;
  /** Opened from the pause menu (closing goes back there) or straight from play. */
  private fromPause = false;
  private cache: Aerial | null = null;
  private root: HTMLDivElement | null = null;
  private view: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private pop: HTMLDivElement | null = null;
  private marks: Mark[] = [];
  /** View: the image point at the centre of the view, and screen px per image px. */
  private vx = 0;
  private vy = 0;
  private s = 1;
  private fit = 1;
  private pointers = new Map<number, { x: number; y: number }>();
  private dragged = 0;
  private pinch: { d: number; s: number } | null = null;
  private hover: Mark | null = null;
  private selected: Mark | null = null;
  private offs: (() => void)[] = [];
  private keys = new Set<string>();
  private t = 0;
  /** Last aerial render time, for tests and tuning. */
  lastRenderMs = 0;
  /** ...and where it went: setting up, the render and read-back, tinting, the paper. */
  lastTimes: Record<string, number> = {};

  constructor(private game: Game) {}

  /** Opens the map of the current realm. */
  open(fromPause = false): void {
    const g = this.game;
    if (this.active || !g.level) return;
    this.active = true;
    this.fromPause = fromPause;
    g.menus.hideAll();
    if (!fromPause) {
      g.state = 'pause';
      g.audio.stopAllLoops();
      g.player.breath.stop();
    }
    g.input.wantPointerLock = false;
    g.input.releaseLock();
    g.input.releaseAll();
    g.audio.play('page', 1.1, 0.8);
    const a = this.aerial();
    this.build(a);
    this.collect(a);
    this.layout(true);
  }

  /** Closes the map: back to the pause menu, or straight back to play. */
  close(toPlay = !this.fromPause): void {
    const g = this.game;
    if (!this.active) return;
    this.active = false;
    for (const off of this.offs) off();
    this.offs = [];
    this.root?.remove();
    this.root = this.view = this.canvas = this.pop = null;
    this.ctx = null;
    this.keys.clear();
    this.pointers.clear();
    this.selected = this.hover = null;
    g.input.releaseAll();
    g.audio.play('uiBack');
    if (toPlay) g.resume();
    else g.menus.showPause();
  }

  // --- the aerial image -----------------------------------------------------------

  /** The realm's aerial image, rendered afresh only when the realm changed. */
  private aerial(): Aerial {
    const level = this.game.level!;
    const key = `${level.def.id}|${level.fired.size}`;
    if (this.cache && this.cache.level === level && this.cache.key === key) return this.cache;
    this.cache = this.renderAerial(level, key);
    this.lastRenderMs = this.cache.ms;
    return this.cache;
  }

  /** The realm's extent on the ground. */
  private bounds(level: Level): { x0: number; z0: number; x1: number; z1: number } {
    const t = level.def.terrain;
    if (t) return { x0: t.x0, z0: t.z0, x1: t.x0 + t.sizeX, z1: t.z0 + t.sizeZ };
    // No terrain: frame everything that matters, with a margin.
    const pts: [number, number][] = [[level.def.spawn[0], level.def.spawn[1]]];
    for (const w of level.wardstones.values()) pts.push([w.x, w.z]);
    for (const q of level.goals) pts.push([q.x, q.z]);
    const xs = pts.map((p) => p[0]);
    const zs = pts.map((p) => p[1]);
    return { x0: Math.min(...xs) - 60, z0: Math.min(...zs) - 60, x1: Math.max(...xs) + 60, z1: Math.max(...zs) + 60 };
  }

  /**
   * Renders the realm once from above. Uses the same shader variants as the
   * game's own frame (the canvas when there is no post chain, an offscreen
   * target when there is), so nothing recompiles; fog, the sky, particles,
   * the dragon and anything culled by distance are set aside and restored.
   */
  private renderAerial(level: Level, key: string): Aerial {
    const t0 = performance.now();
    const g = this.game;
    const r = g.renderer;
    const gl = r.gl;
    const scene = g.scene;
    const b = this.bounds(level);
    const sx = b.x1 - b.x0;
    const sz = b.z1 - b.z0;
    const k = MAP_PX / Math.max(sx, sz);
    const w = Math.max(2, Math.round(sx * k));
    const h = Math.max(2, Math.round(sz * k));
    const cx = (b.x0 + b.x1) / 2;
    const cz = (b.z0 + b.z1) / 2;
    // The top of the map points the way the realm's story goes (the boss lies "north").
    const boss = level.goals.find((q) => q.label === 'boss') ?? level.goals[level.goals.length - 1];
    const flip = !!boss && boss.z < level.def.spawn[1] - 20;
    const cam = new THREE.OrthographicCamera(-sx / 2, sx / 2, sz / 2, -sz / 2, 1, 4000);
    cam.up.set(0, 0, flip ? -1 : 1);
    cam.position.set(cx, 1500, cz);
    cam.lookAt(cx, 0, cz);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true);

    // Set the stage.
    const undo: (() => void)[] = [];
    const setVis = (o: THREE.Object3D, v: boolean) => {
      if (o.visible === v) return;
      o.visible = v;
      undo.push(() => (o.visible = !v));
    };
    for (const c of scene.children) if (c !== level.root && !(c as THREE.Light).isLight) setVis(c, false);
    for (const c of level.root.children) if (c.userData.cull) setVis(c, true);
    // Grass, pebbles and flowers are specks from up here: skip their many instances.
    for (const c of level.root.children) {
      const im = c as THREE.InstancedMesh;
      if (!im.isInstancedMesh) continue;
      if (!im.geometry.boundingSphere) im.geometry.computeBoundingSphere();
      const r0 = im.geometry.boundingSphere!.radius;
      if (im.count > 60 && r0 < 0.75) setVis(im, false);
    }
    // Sky dressing drawn over the fog (the Falls' clouds) would only hide the ground.
    level.root.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m && !Array.isArray(m) && (m as { fog?: boolean }).fog === false && (o as THREE.Mesh).isMesh) setVis(o, false);
    });
    for (const p of level.props) {
      // Secrets never show on the map's picture; thieves carry eggs.
      if (p instanceof Collectible) setVis((p as unknown as { root: THREE.Object3D }).root, false);
      else if (p instanceof EggThief) setVis((p as unknown as { model: { root: THREE.Object3D } }).model.root, false);
    }
    // Meshes the camera faded for being in the way get their own look back.
    const occ = (g.cam as unknown as { occluders?: { mesh: THREE.Mesh; orig: THREE.Material; faded: boolean }[] }).occluders ?? [];
    for (const o of occ) if (o.faded) {
      const was = o.mesh.material;
      o.mesh.material = o.orig;
      undo.push(() => (o.mesh.material = was));
    }
    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      const [near, far] = [fog.near, fog.far];
      fog.near = 1e6;
      fog.far = 2e6;
      undo.push(() => {
        fog.near = near;
        fog.far = far;
      });
    }
    const bg = scene.background;
    scene.background = KEY;
    undo.push(() => (scene.background = bg));
    // No shadows: the shadow map only covers the ground round Aster, and skipping
    // it (a uniform per mesh, not a new shader) makes the shot much cheaper.
    level.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && o.receiveShadow) {
        o.receiveShadow = false;
        undo.push(() => (o.receiveShadow = true));
      }
    });
    const autoShadow = gl.shadowMap.autoUpdate;
    gl.shadowMap.autoUpdate = false;
    undo.push(() => (gl.shadowMap.autoUpdate = autoShadow));
    // Water follows the camera: centre it on the map for the shot. It is drawn
    // flat, opaque pure blue, so the tint can paint it as a map's water wash.
    if (level.water) {
      const wm = level.water.mesh;
      const [wx, wz] = [wm.position.x, wm.position.z];
      level.water.update(g.realTime, cx, cz);
      const u = (wm.material as THREE.ShaderMaterial).uniforms;
      const keep = ['uDeep', 'uShallow', 'uGlint', 'uSunColor'].map((k) => [k, (u[k]!.value as THREE.Color).clone()] as const);
      const opacity = u.uOpacity!.value as number;
      (u.uDeep!.value as THREE.Color).setRGB(0, 0, 1);
      (u.uShallow!.value as THREE.Color).setRGB(0, 0, 1);
      (u.uGlint!.value as THREE.Color).setRGB(0, 0, 0);
      (u.uSunColor!.value as THREE.Color).setRGB(0, 0, 0);
      u.uOpacity!.value = 1;
      undo.push(() => {
        wm.position.set(wx, wm.position.y, wz);
        for (const [k, c] of keep) (u[k]!.value as THREE.Color).copy(c);
        u.uOpacity!.value = opacity;
      });
    }

    const img = document.createElement('canvas');
    img.width = w;
    img.height = h;
    const ctx = img.getContext('2d', { willReadFrequently: true })!;
    let data: ImageData;
    const t1 = performance.now();
    try {
      if (r.grading) data = this.shootTarget(gl, scene, cam, w, h, ctx);
      else data = this.shootCanvas(gl, scene, cam, w, h, ctx);
    } finally {
      for (let i = undo.length - 1; i >= 0; i--) undo[i]!();
    }
    const t2 = performance.now();
    this.tint(data, level);
    const t3 = performance.now();
    const o = new THREE.Vector3(0, 0, 0).project(cam);
    this.paper(ctx, w, h, level, data, [((o.x + 1) / 2) * w, ((1 - o.y) / 2) * h], 20 * k);
    const t4 = performance.now();
    this.lastTimes = { stage: t1 - t0, shot: t2 - t1, tint: t3 - t2, paper: t4 - t3 };
    return { level, key, img, cam, w, h, ms: t4 - t0 };
  }

  /** Straight to the canvas, briefly resized to the map (no post chain in use). */
  private shootCanvas(gl: THREE.WebGLRenderer, scene: THREE.Scene, cam: THREE.Camera, w: number, h: number, ctx: CanvasRenderingContext2D): ImageData {
    const size = gl.getSize(new THREE.Vector2());
    const pr = gl.getPixelRatio();
    gl.setPixelRatio(1);
    gl.setSize(w, h, false);
    try {
      gl.render(scene, cam);
      ctx.drawImage(gl.domElement, 0, 0, w, h);
    } finally {
      gl.setPixelRatio(pr);
      gl.setSize(size.x, size.y, false);
    }
    return ctx.getImageData(0, 0, w, h);
  }

  /**
   * Into an offscreen target, as the post chain does (linear, not yet tone
   * mapped); the filmic curve and sRGB are applied here while reading back.
   */
  private shootTarget(gl: THREE.WebGLRenderer, scene: THREE.Scene, cam: THREE.Camera, w: number, h: number, ctx: CanvasRenderingContext2D): ImageData {
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: true });
    const prev = gl.getRenderTarget();
    const raw = new Uint16Array(w * h * 4);
    try {
      gl.setRenderTarget(rt);
      gl.render(scene, cam);
      gl.readRenderTargetPixels(rt, 0, 0, w, h, raw);
    } finally {
      gl.setRenderTarget(prev);
      rt.dispose();
    }
    const out = ctx.createImageData(w, h);
    const d = out.data;
    const half = THREE.DataUtils.fromHalfFloat;
    const exp = gl.toneMappingExposure;
    const tm = (v: number) => {
      // A filmic curve close to the game's, then sRGB.
      const x = Math.max(0, v * exp * 0.6);
      const c = Math.min(1, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14));
      return Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055));
    };
    for (let y = 0; y < h; y++) {
      // Targets read bottom-up.
      const src = (h - 1 - y) * w * 4;
      const dst = y * w * 4;
      for (let x = 0; x < w * 4; x += 4) {
        const rr = half(raw[src + x]!);
        const gg = half(raw[src + x + 1]!);
        const bb = half(raw[src + x + 2]!);
        if (rr > 0.9 && gg < 0.08 && bb > 0.9) {
          d[dst + x] = 255;
          d[dst + x + 1] = 0;
          d[dst + x + 2] = 255;
        } else {
          d[dst + x] = tm(rr);
          d[dst + x + 1] = tm(gg);
          d[dst + x + 2] = tm(bb);
        }
        d[dst + x + 3] = 255;
      }
    }
    return out;
  }

  /** Night map for the dark realms, parchment for the rest. */
  private palette(level: Level): { ink: [number, number, number]; paper: [number, number, number]; water: [number, number, number]; keep: number; night: boolean } {
    const night = level.def.id === 'keep';
    return night
      ? { ink: [16, 12, 34], paper: [196, 186, 238], water: [40, 52, 100], keep: 0.3, night }
      : { ink: [62, 42, 24], paper: [240, 224, 184], water: [128, 156, 166], keep: 0.34, night };
  }

  /**
   * Turns the render into a drawn map: brightness (stretched to the realm's
   * own range, so a dark realm still reads) maps onto ink and paper, a little
   * of the real colour stays (so water still reads as water), and the empty
   * sky becomes transparent.
   */
  private tint(img: ImageData, level: Level): void {
    const P = this.palette(level);
    const d = img.data;
    const [ir, ig, ib] = P.ink;
    const [pr, pg, pb] = P.paper;
    const lums = new Uint8Array(d.length / 4);
    /** 1 where the pixel is water (drawn pure blue). */
    const wet = new Uint8Array(d.length / 4);
    const hist = new Uint32Array(256);
    let n = 0;
    for (let i = 0, j = 0; i < d.length; i += 4, j++) {
      const r = d[i]!;
      const gr = d[i + 1]!;
      const bl = d[i + 2]!;
      if (r > 240 && gr < 16 && bl > 240) {
        d[i + 3] = 0;
        continue;
      }
      if (bl > 130 && r < 75 && gr < 75 && bl > Math.max(r, gr) * 2 + 20) {
        wet[j] = 1;
        continue;
      }
      const l = Math.min(255, Math.round(0.3 * r + 0.55 * gr + 0.15 * bl));
      lums[j] = l;
      hist[l]!++;
      n++;
    }
    const pct = (f: number) => {
      let acc = 0;
      for (let v = 0; v < 256; v++) if ((acc += hist[v]!) >= n * f) return v;
      return 255;
    };
    const lo = pct(0.02);
    const hi = Math.max(lo + 40, pct(0.985));
    const [wr, wg, wb] = P.water;
    const W = img.width;
    for (let i = 0, j = 0; i < d.length; i += 4, j++) {
      if (d[i + 3] === 0) continue;
      if (wet[j]) {
        // A wash of blue, a touch lighter along the shore.
        const shore = wet[j - 1] === 0 || wet[j + 1] === 0 || wet[j - W] === 0 || wet[j + W] === 0 ? 14 : 0;
        const n = ((j * 2654435761) >>> 27) - 16;
        d[i] = wr + shore + n * 0.3;
        d[i + 1] = wg + shore + n * 0.3;
        d[i + 2] = wb + shore + n * 0.3;
        continue;
      }
      const r = d[i]!;
      const gr = d[i + 1]!;
      const bl = d[i + 2]!;
      const lum = Math.max(0, Math.min(1, (lums[j]! - lo) / (hi - lo)));
      // Lift the midtones so the paper shows through, like a wash.
      const k = Math.pow(lum, P.night ? 0.85 : 0.7);
      const tr = ir + (pr - ir) * k;
      const tg = ig + (pg - ig) * k;
      const tb = ib + (pb - ib) * k;
      // Land against water gets an inked edge.
      const edge = wet[j - 1] || wet[j + 1] || wet[j - W] || wet[j + W] ? 0.62 : 1;
      d[i] = (tr + (r - tr) * P.keep) * edge;
      d[i + 1] = (tg + (gr - tg) * P.keep) * edge;
      d[i + 2] = (tb + (bl - tb) * P.keep) * edge;
    }
  }

  /** Paper grain, the tinted realm, a faint grid, a compass and a darkened edge. */
  private paper(ctx: CanvasRenderingContext2D, w: number, h: number, level: Level, data: ImageData, origin: [number, number], step: number): void {
    const P = this.palette(level);
    const [pr, pg, pb] = P.paper;
    const [ir, ig, ib] = P.ink;
    const rgb = (c: [number, number, number], a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    // The realm itself goes onto its own layer first, so the paper can sit beneath it.
    const layer = document.createElement('canvas');
    layer.width = w;
    layer.height = h;
    layer.getContext('2d')!.putImageData(data, 0, 0);
    // Paper: a base tone, a darker wash for the void, and a grain of specks.
    const base: [number, number, number] = P.night ? [ir + 18, ig + 16, ib + 34] : [Math.round(pr * 0.86), Math.round(pg * 0.8), Math.round(pb * 0.7)];
    ctx.fillStyle = rgb(base);
    ctx.fillRect(0, 0, w, h);
    let seed = level.def.id.length * 7919;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < (w * h) / 90; i++) {
      const a = rnd() * 0.08;
      ctx.fillStyle = rnd() < 0.5 ? rgb(P.ink, a) : rgb(P.paper, a);
      ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    // A soft ink shadow under the land, then the land.
    ctx.save();
    ctx.shadowColor = rgb(P.ink, 0.55);
    ctx.shadowBlur = 6;
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
    // A grid every 20 m, like a surveyor's, through the realm's origin.
    ctx.strokeStyle = rgb(P.night ? P.paper : P.ink, 0.07);
    ctx.lineWidth = 1;
    for (let x = (origin[0] % step + step) % step; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, h);
      ctx.stroke();
    }
    for (let y = (origin[1] % step + step) % step; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, Math.round(y) + 0.5);
      ctx.lineTo(w, Math.round(y) + 0.5);
      ctx.stroke();
    }
    // Burnt edges.
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.hypot(w, h) * 0.56);
    vg.addColorStop(0, rgb(P.ink, 0));
    vg.addColorStop(1, rgb(P.ink, P.night ? 0.55 : 0.45));
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
    // A compass rose in the corner.
    this.compass(ctx, w - 44, 48, 26, P.night ? P.paper : P.ink, P.night ? P.ink : P.paper);
  }

  private compass(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ink: [number, number, number], paper: [number, number, number]): void {
    const c = (col: [number, number, number], a = 1) => `rgba(${col[0]},${col[1]},${col[2]},${a})`;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = c(ink, 0.7);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.18, 0);
      ctx.lineTo(-r * 0.18, 0);
      ctx.closePath();
      ctx.fillStyle = i === 3 ? c(ink, 0.85) : c(ink, 0.45);
      ctx.fill();
    }
    ctx.fillStyle = c(paper, 0.9);
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c(ink, 0.9);
    ctx.font = 'bold 11px Palatino, Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', 0, -r - 4);
    ctx.restore();
  }

  // --- world and image ---------------------------------------------------------------

  private tmp = new THREE.Vector3();

  /** Where a world point falls on the aerial image, in image pixels. */
  imagePoint(x: number, z: number, y = 0): [number, number] {
    const a = this.cache ?? this.aerial();
    const v = this.tmp.set(x, y, z).project(a.cam);
    return [((v.x + 1) / 2) * a.w, ((1 - v.y) / 2) * a.h];
  }

  /** Where a world point is drawn on screen while the map is open (CSS px within the view). */
  screenPoint(x: number, z: number): [number, number] {
    const [ix, iy] = this.imagePoint(x, z);
    return this.toScreen(ix, iy);
  }

  private toScreen(ix: number, iy: number): [number, number] {
    const vw = this.view?.clientWidth ?? 0;
    const vh = this.view?.clientHeight ?? 0;
    return [vw / 2 + (ix - this.vx) * this.s, vh / 2 + (iy - this.vy) * this.s];
  }

  /** The heading of a world yaw on the image (0 = up, clockwise). */
  private imageAngle(x: number, z: number, yaw: number): number {
    const [ax, ay] = this.imagePoint(x, z);
    const [bx, by] = this.imagePoint(x + Math.sin(yaw) * 4, z + Math.cos(yaw) * 4);
    return Math.atan2(bx - ax, -(by - ay));
  }

  // --- markers ----------------------------------------------------------------------

  /** Everything worth a marker in the realm, and the counts for the side panel. */
  private collect(a: Aerial): void {
    const g = this.game;
    const level = a.level;
    const found = g.save.found;
    const lvl = level.def.id;
    const marks: Mark[] = [];
    const at = (x: number, z: number) => this.imagePoint(x, z);
    for (const w of level.wardstones.values()) {
      const awake = !!found[`ward:${lvl}:${w.id}`];
      const [ix, iy] = at(w.x, w.z);
      marks.push({ kind: 'ward', ix, iy, label: `${wardName(w.id)} Wardstone`, detail: awake ? 'Awakened: fly here from the map.' : 'Asleep. Walk up to it to awaken it.', on: awake, ward: w });
    }
    for (const ar of level.arenas) {
      const [ix, iy] = at(ar.x, ar.z);
      const cleared = ar.state === 'cleared';
      marks.push({ kind: 'arena', ix, iy, label: cleared ? 'Fight won' : 'Gloom fight', detail: cleared ? 'Cleared.' : 'The Gloom holds this ground.', on: cleared });
    }
    const boss = level.goals.find((q) => q.label === 'boss');
    if (boss) {
      const [ix, iy] = at(boss.x, boss.z);
      marks.push({ kind: 'boss', ix, iy, label: 'The realm\'s master', detail: boss.done() ? 'Beaten.' : 'Something big waits here.', on: boss.done() });
    } else {
      const stone = level.interactables.find((i) => /^Challenge /.test(i.label));
      if (stone) {
        const [ix, iy] = at(stone.x, stone.z);
        marks.push({ kind: 'boss', ix, iy, label: 'Rematch stone', detail: stone.label, on: true });
      }
    }
    for (const p of level.props) {
      if (p instanceof Portal) {
        const [ix, iy] = at(p.x, p.z);
        marks.push({ kind: 'portal', ix, iy, label: p.label.replace(/^Step through the /, ''), detail: p.label });
      } else if (p instanceof PowerShrine) {
        const [ix, iy] = at(p.x, p.z);
        const def = POWERS[p.kind];
        marks.push({ kind: 'shrine', ix, iy, label: `${def.name} shrine`, detail: p.state === 'locked' ? 'Asleep while its Gloom guards stand.' : p.state === 'ready' ? 'Awake: run through the ring.' : 'Recharging.', on: p.state === 'ready', color: def.css });
      } else if (p instanceof Chest && found[p.id]) {
        const [ix, iy] = at(p.x, p.z);
        marks.push({ kind: 'chest', ix, iy, label: p.iron ? 'Iron-bound chest (opened)' : 'Treasure chest (opened)', on: true });
      }
    }
    const names: Record<CollectKind, string> = { egg: 'Dragon egg', letter: 'Letter', heart: 'Heart Shard', mana: 'Spirit Shard', relic: 'Dragon Relic' };
    for (const [id, s] of SECRET_SPOTS.get(level) ?? []) {
      if (!found[id]) continue;
      const [ix, iy] = at(s.x, s.z);
      marks.push({ kind: s.kind, ix, iy, label: `${names[s.kind]} (found)`, on: true });
    }
    for (const q of g.quests.markers(lvl)) {
      const [ix, iy] = at(q.x, q.z);
      marks.push({ kind: q.kind === 'giver' ? 'giver' : 'quest', ix, iy, label: q.label ?? 'Quest', detail: q.detail, tracked: q.tracked, on: true });
    }
    const p = g.player;
    const [ax, ay] = at(p.x, p.z);
    marks.push({ kind: 'aster', ix: ax, iy: ay, label: 'Aster', detail: 'You are here.', angle: this.imageAngle(p.x, p.z, p.yaw) });
    this.marks = marks;
  }

  /** Found / total secrets of each kind in this realm (the missing ones stay off the map). */
  counts(): { label: string; have: number; total: number }[] {
    const g = this.game;
    const level = g.level;
    if (!level) return [];
    const found = g.save.found;
    const of = (kinds: CollectKind[]) => {
      const l = level.secrets.filter((s) => kinds.includes(s.kind));
      return { have: l.filter((s) => found[s.id]).length, total: l.length };
    };
    const chests = level.props.filter((p): p is Chest => p instanceof Chest);
    const rows = [
      { label: 'Dragon eggs', ...of(['egg']) },
      { label: 'Letters', ...of(['letter']) },
      { label: 'Heart &amp; Spirit Shards', ...of(['heart', 'mana']) },
      { label: 'Dragon Relics', ...of(['relic']) },
      { label: 'Treasure chests', have: chests.filter((c) => found[c.id]).length, total: chests.length },
    ];
    return rows.filter((r) => r.total > 0);
  }

  // --- the screen ---------------------------------------------------------------------

  private on(t: EventTarget, type: string, fn: (e: never) => void, opt?: AddEventListenerOptions): void {
    t.addEventListener(type, fn as EventListener, opt);
    this.offs.push(() => t.removeEventListener(type, fn as EventListener, opt));
  }

  private build(a: Aerial): void {
    const g = this.game;
    const level = a.level;
    const root = document.createElement('div');
    root.className = 'map-screen';
    const ex = explored(g.save, level.def.id);
    const rows = this.counts();
    const counts = rows.map((c) => `<li class="${c.have >= c.total ? 'all' : ''}"><span>${c.label}</span><b>${c.have} / ${c.total}</b></li>`).join('');
    const tr = g.quests.tracker();
    const wards = [...level.wardstones.values()].filter((w) => g.save.found[`ward:${level.def.id}:${w.id}`]);
    const pad = g.input.usingPad;
    const touch = g.input.usingTouch;
    const keys = touch ? 'Drag to pan &middot; pinch to zoom &middot; tap a marker'
      : pad ? 'Left stick: pan &middot; LB / RB: zoom &middot; A: select &middot; R3: find Aster &middot; B: close'
        : 'Drag or WASD: pan &middot; wheel or Q / E: zoom &middot; click a marker &middot; H: find Aster &middot; M or Esc: close';
    root.innerHTML = `<div class="map-frame">
      <div class="map-view"><canvas class="map-canvas"></canvas><div class="map-cross"></div><div class="map-pop" style="display:none"></div>
        <button class="map-close" aria-label="Close the map">&times;</button></div>
      <div class="map-side">
        <h2>${level.def.name}</h2><div class="sub">${ex !== null ? `${Math.round(ex * 100)}% explored` : 'Map of the realm'}</div>
        ${counts ? `<h4>Secrets</h4><ul class="map-counts">${counts}</ul><p class="map-note">Found ones are marked. The rest are still out there.</p>` : ''}
        ${tr ? `<h4>${tr.main ? 'Main quest' : 'Tracked quest'}</h4><div class="map-quest"><b>${tr.title}</b><p>${tr.text}</p></div>` : ''}
        ${wards.length ? `<h4>Fly to a Wardstone</h4><div class="map-wards"></div>` : ''}
        <h4>Legend</h4><div class="map-legend"></div>
        <div class="map-btns"></div>
      </div></div><div class="map-keys">${keys}</div>`;
    const host = g.renderer.canvas.parentElement!;
    host.appendChild(root);
    this.root = root;
    this.view = root.querySelector('.map-view');
    this.canvas = root.querySelector('.map-canvas');
    this.ctx = this.canvas!.getContext('2d');
    this.pop = root.querySelector('.map-pop');
    const btn = (label: string, fn: () => void, cls = 'btn small') => {
      const b = document.createElement('button');
      b.className = cls;
      b.innerHTML = label;
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        g.audio.play('uiConfirm');
        fn();
      });
      return b;
    };
    const wl = root.querySelector('.map-wards');
    for (const w of wards) wl?.append(btn(wardName(w.id), () => this.fly(w)));
    const leg = root.querySelector('.map-legend')!;
    const legend: [MarkKind, string, boolean?][] = [
      ['aster', 'Aster'], ['ward', 'Wardstone (awake)', true], ['ward', 'Wardstone (asleep)', false], ['arena', 'Gloom fight'], ['arena', 'Fight won', true],
      ['boss', 'Boss'], ['portal', 'Portal'], ['shrine', 'Power-up shrine', true], ['quest', 'Quest target'], ['giver', 'Someone needs help'],
      ['egg', 'Egg found'], ['letter', 'Letter read'], ['heart', 'Shard found'], ['relic', 'Relic found'], ['chest', 'Chest opened'],
    ];
    for (const [kind, label, on] of legend) {
      const item = document.createElement('div');
      item.className = 'map-leg';
      const c = document.createElement('canvas');
      c.width = c.height = 44;
      c.style.width = c.style.height = '22px';
      const cx = c.getContext('2d')!;
      cx.scale(2, 2);
      this.icon(cx, { kind, ix: 0, iy: 0, label, on: on ?? false, color: '#9ad8ff', angle: 0.6, tracked: kind === 'quest' }, 11, 11, false);
      item.append(c, Object.assign(document.createElement('span'), { textContent: label }));
      leg.append(item);
    }
    const bb = root.querySelector('.map-btns')!;
    bb.append(btn('Find Aster', () => this.centerOnAster()), btn('Close', () => this.close()));
    root.querySelector('.map-close')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });
    root.querySelector('.map-close')!.addEventListener('pointerdown', (e) => e.stopPropagation());
    const v = this.view!;
    this.on(v, 'pointerdown', (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('.map-pop')) return;
      try {
        v.setPointerCapture?.(e.pointerId);
      } catch {
        /* capture is a nicety: drags still work inside the view */
      }
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.dragged = 0;
      if (this.pointers.size === 2) {
        const [p1, p2] = [...this.pointers.values()];
        this.pinch = { d: Math.hypot(p1!.x - p2!.x, p1!.y - p2!.y), s: this.s };
      }
    });
    this.on(v, 'pointermove', (e: PointerEvent) => {
      const prev = this.pointers.get(e.pointerId);
      if (!prev) {
        this.hoverAt(e);
        return;
      }
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      prev.x = e.clientX;
      prev.y = e.clientY;
      if (this.pinch && this.pointers.size >= 2) {
        const [p1, p2] = [...this.pointers.values()];
        const d = Math.hypot(p1!.x - p2!.x, p1!.y - p2!.y);
        const rect = v.getBoundingClientRect();
        this.zoomTo(this.pinch.s * (d / Math.max(1, this.pinch.d)), (p1!.x + p2!.x) / 2 - rect.left, (p1!.y + p2!.y) / 2 - rect.top);
        this.dragged += 99;
        return;
      }
      this.dragged += Math.abs(dx) + Math.abs(dy);
      this.vx -= dx / this.s;
      this.vy -= dy / this.s;
      this.clampView();
    });
    const up = (e: PointerEvent) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinch = null;
      if (this.dragged < 6 && this.pointers.size === 0) this.clickAt(e);
    };
    this.on(v, 'pointerup', up);
    this.on(v, 'pointercancel', (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      this.pinch = null;
    });
    this.on(v, 'wheel', (e: WheelEvent) => {
      e.preventDefault();
      const rect = v.getBoundingClientRect();
      this.zoomTo(this.s * Math.pow(1.0015, -e.deltaY), e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });
    // Zoom keys the action map does not name.
    this.on(window, 'keydown', (e: KeyboardEvent) => {
      if (e.code === 'Equal' || e.code === 'NumpadAdd') this.keys.add('in');
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') this.keys.add('out');
    });
    this.on(window, 'keyup', (e: KeyboardEvent) => {
      if (e.code === 'Equal' || e.code === 'NumpadAdd') this.keys.delete('in');
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') this.keys.delete('out');
    });
  }

  /** Sizes the canvas to the view; on first open, fits the whole realm. */
  private layout(first = false): void {
    const v = this.view;
    const c = this.canvas;
    const a = this.cache;
    if (!v || !c || !a) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.max(1, v.clientWidth);
    const H = Math.max(1, v.clientHeight);
    if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    this.fit = Math.min(W / a.w, H / a.h) * 0.94;
    if (first) {
      this.s = this.fit;
      this.vx = a.w / 2;
      this.vy = a.h / 2;
    }
    this.clampView();
  }

  private zoomTo(s: number, fx?: number, fy?: number): void {
    const v = this.view;
    if (!v) return;
    const ns = Math.max(this.fit * 0.8, Math.min(this.fit * 7, s));
    // Keep the point under the cursor (or the centre) where it is.
    const W = v.clientWidth;
    const H = v.clientHeight;
    const px = fx ?? W / 2;
    const py = fy ?? H / 2;
    const ix = this.vx + (px - W / 2) / this.s;
    const iy = this.vy + (py - H / 2) / this.s;
    this.s = ns;
    this.vx = ix - (px - W / 2) / ns;
    this.vy = iy - (py - H / 2) / ns;
    this.clampView();
  }

  private clampView(): void {
    const a = this.cache;
    if (!a) return;
    this.vx = Math.max(0, Math.min(a.w, this.vx));
    this.vy = Math.max(0, Math.min(a.h, this.vy));
  }

  centerOnAster(): void {
    const p = this.game.player;
    const [ix, iy] = this.imagePoint(p.x, p.z);
    this.vx = ix;
    this.vy = iy;
    if (this.s < this.fit * 2) this.s = this.fit * 2.2;
    this.clampView();
    this.game.audio.play('ui');
  }

  /** The marker under a screen point (within the view), if any. */
  private markAt(x: number, y: number, r = 16): Mark | null {
    let best: Mark | null = null;
    let bd = r;
    for (const m of this.marks) {
      const [sx, sy] = this.toScreen(m.ix, m.iy);
      const d = Math.hypot(sx - x, sy - y);
      if (d < bd) {
        bd = d;
        best = m;
      }
    }
    return best;
  }

  private hoverAt(e: PointerEvent): void {
    const rect = this.view!.getBoundingClientRect();
    this.hover = this.markAt(e.clientX - rect.left, e.clientY - rect.top);
    this.view!.style.cursor = this.hover ? 'pointer' : '';
  }

  private clickAt(e: PointerEvent): void {
    const rect = this.view!.getBoundingClientRect();
    const m = this.markAt(e.clientX - rect.left, e.clientY - rect.top, e.pointerType === 'touch' ? 26 : 16);
    this.select(m);
  }

  /** Shows a marker's card (Wardstones offer a flight). */
  private select(m: Mark | null): void {
    const pop = this.pop;
    if (!pop) return;
    this.selected = m;
    if (!m) {
      pop.style.display = 'none';
      return;
    }
    const g = this.game;
    g.audio.play('ui');
    pop.innerHTML = `<b>${m.label}</b>${m.detail ? `<p>${m.detail}</p>` : ''}`;
    if (m.kind === 'ward' && m.on && m.ward) {
      const w = m.ward;
      const fight = !!g.activeArena || !!(g.boss && g.boss.alive);
      const b = document.createElement('button');
      b.className = 'btn small';
      b.textContent = fight ? 'Not in the middle of a fight!' : 'Fly here';
      b.disabled = fight;
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        this.fly(w);
      });
      pop.append(b);
    }
    pop.style.display = '';
    this.placePop();
  }

  private placePop(): void {
    const m = this.selected;
    const pop = this.pop;
    const v = this.view;
    if (!m || !pop || !v) return;
    const [sx, sy] = this.toScreen(m.ix, m.iy);
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    const x = Math.max(6, Math.min(v.clientWidth - pw - 6, sx - pw / 2));
    const y = sy - ph - 18 < 6 ? sy + 18 : sy - ph - 18;
    pop.style.left = `${x}px`;
    pop.style.top = `${Math.max(6, Math.min(v.clientHeight - ph - 6, y))}px`;
  }

  /** Fast travel to an awakened Wardstone of this realm. */
  private fly(w: Wardstone): void {
    const g = this.game;
    if (g.activeArena || (g.boss && g.boss.alive)) {
      g.toast('Not in the middle of a fight!', 'warn');
      return;
    }
    // Closed without resuming: the flight's fade lands in play.
    this.active = false;
    for (const off of this.offs) off();
    this.offs = [];
    this.root?.remove();
    this.root = this.view = this.canvas = this.pop = null;
    this.ctx = null;
    g.flyToWardstone(w);
  }

  // --- per frame ------------------------------------------------------------------------

  update(dt: number): void {
    if (!this.active) return;
    const g = this.game;
    const inp = g.input;
    this.t += dt;
    if (inp.take('back', 0.2) || inp.take('map', 0.2) || inp.take('pause', 0.2)) {
      if (this.selected) this.select(null);
      else {
        this.close();
        return;
      }
    }
    this.layout();
    // Pan with the move keys or stick, zoom with Q/E, LB/RB, +/- or the right stick.
    const pan = 520 * dt / this.s;
    if (inp.moveX || inp.moveY) {
      this.vx += inp.moveX * pan;
      this.vy -= inp.moveY * pan;
      this.clampView();
    }
    let z = 0;
    if (inp.down('tail') || inp.down('lock') || this.keys.has('in')) z += 1;
    if (inp.down('burst') || this.keys.has('out')) z -= 1;
    // The right stick (look input is already scaled by the frame; undo that).
    z -= (inp.lookY / Math.max(dt, 1e-3)) * 0.45;
    if (z) this.zoomTo(this.s * Math.exp(z * dt * 1.6));
    if (inp.take('hint', 0.2)) this.centerOnAster();
    // With keys or a pad, the crosshair picks the marker under it.
    const v = this.view!;
    const aim = inp.usingPad || inp.moveX || inp.moveY ? this.markAt(v.clientWidth / 2, v.clientHeight / 2, 22) : null;
    if (inp.usingPad || aim) this.hover = aim;
    this.root?.classList.toggle('aiming', inp.usingPad);
    if (inp.take('confirm', 0.2) || inp.take('interact', 0.2)) {
      const flyBtn = this.pop?.querySelector('button');
      if (this.selected && flyBtn && !(flyBtn as HTMLButtonElement).disabled && this.selected === (aim ?? this.selected)) {
        (flyBtn as HTMLButtonElement).click();
        return;
      }
      this.select(aim ?? this.markAt(v.clientWidth / 2, v.clientHeight / 2, 22));
    }
    this.draw();
    this.placePop();
  }

  private draw(): void {
    const c = this.canvas;
    const ctx = this.ctx;
    const a = this.cache;
    const v = this.view;
    if (!c || !ctx || !a || !v) return;
    const dpr = c.width / Math.max(1, v.clientWidth);
    const W = v.clientWidth;
    const H = v.clientHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const night = a.level.def.id === 'keep';
    ctx.fillStyle = night ? '#0c0918' : '#2a1d12';
    ctx.fillRect(0, 0, W, H);
    const [x0, y0] = this.toScreen(0, 0);
    ctx.imageSmoothingEnabled = this.s < 2.5;
    ctx.drawImage(a.img, x0, y0, a.w * this.s, a.h * this.s);
    ctx.strokeStyle = night ? 'rgba(200,190,255,.35)' : 'rgba(245,196,107,.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x0 - 1, y0 - 1, a.w * this.s + 2, a.h * this.s + 2);
    // Small things first, then the Wardstones, quest marks, and Aster on top.
    const order: MarkKind[] = ['egg', 'letter', 'heart', 'mana', 'relic', 'chest', 'arena', 'shrine', 'portal', 'boss', 'ward', 'giver', 'quest', 'aster'];
    const sorted = [...this.marks].sort((m1, m2) => order.indexOf(m1.kind) - order.indexOf(m2.kind));
    for (const m of sorted) {
      const [sx, sy] = this.toScreen(m.ix, m.iy);
      if (sx < -30 || sy < -30 || sx > W + 30 || sy > H + 30) continue;
      this.icon(ctx, m, sx, sy, true);
      if (m.kind === 'ward') this.label(ctx, wardName(m.ward?.id ?? ''), sx, sy + 17, m.on ? '#ffe8b0' : '#d8cdb8');
    }
    const hl = this.selected ?? this.hover;
    if (hl) {
      const [sx, sy] = this.toScreen(hl.ix, hl.iy);
      ctx.strokeStyle = '#fff4dc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 15 + Math.sin(this.t * 6) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      if (!this.selected && hl.kind !== 'ward') this.label(ctx, hl.label, sx, sy - 20, '#fff4dc');
    }
  }

  private label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void {
    ctx.font = '600 12px Palatino, "Palatino Linotype", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(20,12,6,.85)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  /** One marker's symbol, centred on x, y. */
  private icon(ctx: CanvasRenderingContext2D, m: Mark, x: number, y: number, live: boolean): void {
    const t = live ? this.t : 0;
    const path = (pts: [number, number][]) => {
      ctx.beginPath();
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(x + px, y + py) : ctx.moveTo(x + px, y + py)));
      ctx.closePath();
    };
    const disc = (r: number, fill: string, stroke = 'rgba(20,12,6,.9)', lw = 1.5) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = lw;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    };
    ctx.save();
    ctx.lineJoin = 'round';
    switch (m.kind) {
      case 'aster': {
        const pulse = live ? (t * 0.9) % 1 : 0.4;
        ctx.strokeStyle = `rgba(201,162,255,${0.8 * (1 - pulse)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 6 + pulse * 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.translate(x, y);
        ctx.rotate(m.angle ?? 0);
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(7, 7);
        ctx.lineTo(0, 3.5);
        ctx.lineTo(-7, 7);
        ctx.closePath();
        ctx.fillStyle = '#b07cff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff4dc';
        ctx.stroke();
        break;
      }
      case 'ward': {
        disc(7, m.on ? '#f5c46b' : 'rgba(120,112,130,.9)', m.on ? '#3a2410' : 'rgba(30,24,36,.9)');
        ctx.beginPath();
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x + 3, y);
        ctx.lineTo(x, y + 4);
        ctx.lineTo(x - 3, y);
        ctx.closePath();
        ctx.fillStyle = m.on ? '#7a3cd0' : 'rgba(40,32,48,.9)';
        ctx.fill();
        break;
      }
      case 'arena': {
        disc(7, m.on ? 'rgba(120,170,100,.85)' : 'rgba(170,40,40,.9)');
        ctx.strokeStyle = '#fff4dc';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        if (m.on) {
          ctx.moveTo(x - 3.5, y);
          ctx.lineTo(x - 1, y + 3);
          ctx.lineTo(x + 4, y - 3);
        } else {
          ctx.moveTo(x - 3.5, y - 3.5);
          ctx.lineTo(x + 3.5, y + 3.5);
          ctx.moveTo(x + 3.5, y - 3.5);
          ctx.lineTo(x - 3.5, y + 3.5);
        }
        ctx.stroke();
        break;
      }
      case 'boss': {
        const r = 10;
        const pts: [number, number][] = [];
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          const rr = i % 2 ? r * 0.55 : r;
          pts.push([Math.sin(a) * rr, -Math.cos(a) * rr]);
        }
        path(pts);
        ctx.fillStyle = m.on ? 'rgba(120,110,120,.9)' : '#c02838';
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = 'rgba(20,12,6,.9)';
        ctx.stroke();
        disc(3.2, '#fff4dc', 'rgba(20,12,6,.9)', 1);
        break;
      }
      case 'portal': {
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#8a4fd8';
        ctx.stroke();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = '#f0e0ff';
        ctx.stroke();
        break;
      }
      case 'shrine': {
        const pts: [number, number][] = [];
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const rr = i % 2 ? 3.5 : 8;
          pts.push([Math.sin(a) * rr, -Math.cos(a) * rr]);
        }
        path(pts);
        ctx.fillStyle = m.on ? m.color ?? '#ffe070' : 'rgba(150,140,160,.9)';
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = 'rgba(20,12,6,.9)';
        ctx.stroke();
        break;
      }
      case 'quest': {
        if (m.tracked) {
          const pulse = live ? (t * 0.7) % 1 : 0.3;
          ctx.strokeStyle = `rgba(255,224,112,${0.9 * (1 - pulse)})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(x, y, 6 + pulse * 14, 0, Math.PI * 2);
          ctx.stroke();
        }
        // A star on a little staff over the spot, so whatever stands there still shows.
        const lift = live ? 15 : 0;
        if (lift) {
          ctx.strokeStyle = '#3a2410';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y - lift + 6);
          ctx.stroke();
          disc(2.2, m.tracked ? '#ffe070' : '#e8c890', '#3a2410', 1.2);
        }
        const pts: [number, number][] = [];
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          const rr = i % 2 ? 4.2 : 10;
          pts.push([Math.sin(a) * rr, -Math.cos(a) * rr - lift]);
        }
        path(pts);
        ctx.fillStyle = m.tracked ? '#ffe070' : '#e8c890';
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = '#3a2410';
        ctx.stroke();
        break;
      }
      case 'giver': {
        disc(8, '#2a1a3a', '#ffe070', 2);
        ctx.fillStyle = '#ffe070';
        ctx.fillRect(x - 1.3, y - 5, 2.6, 6);
        ctx.fillRect(x - 1.3, y + 2.4, 2.6, 2.6);
        break;
      }
      case 'egg': {
        ctx.beginPath();
        ctx.ellipse(x, y, 3.8, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#f4ecd8';
        ctx.fill();
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = '#5a2aa8';
        ctx.stroke();
        break;
      }
      case 'letter': {
        ctx.fillStyle = '#f0e2c0';
        ctx.fillRect(x - 5, y - 3.5, 10, 7);
        ctx.strokeStyle = 'rgba(40,24,10,.9)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x - 5, y - 3.5, 10, 7);
        disc(1.8, '#d03a3a', '#d03a3a', 0.5);
        break;
      }
      case 'heart':
      case 'mana': {
        path([[0, -6], [3.5, 0], [0, 6], [-3.5, 0]]);
        ctx.fillStyle = m.kind === 'heart' ? '#ff5a6a' : '#5ae08a';
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(20,12,6,.9)';
        ctx.stroke();
        break;
      }
      case 'relic': {
        ctx.fillStyle = '#e0b050';
        ctx.fillRect(x - 3.5, y - 4.5, 7, 9);
        ctx.strokeStyle = 'rgba(40,24,10,.9)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x - 3.5, y - 4.5, 7, 9);
        break;
      }
      case 'chest': {
        ctx.fillStyle = '#8a5a30';
        ctx.fillRect(x - 5, y - 2, 10, 6);
        ctx.fillStyle = '#e0b050';
        ctx.fillRect(x - 5, y - 4.5, 10, 2.5);
        ctx.strokeStyle = 'rgba(30,18,8,.9)';
        ctx.lineWidth = 1.1;
        ctx.strokeRect(x - 5, y - 4.5, 10, 8.5);
        break;
      }
    }
    ctx.restore();
  }

  /** Test and debug view of what the map holds right now. */
  debug(): { marks: { kind: string; label: string; ix: number; iy: number; on?: boolean }[]; w: number; h: number; ms: number } {
    const a = this.cache;
    return { marks: this.marks.map((m) => ({ kind: m.kind, label: m.label, ix: m.ix, iy: m.iy, on: m.on })), w: a?.w ?? 0, h: a?.h ?? 0, ms: a?.ms ?? 0 };
  }

  /** The tinted aerial image, for screenshots of the whole realm. */
  get image(): HTMLCanvasElement | null {
    return this.cache?.img ?? null;
  }
}

