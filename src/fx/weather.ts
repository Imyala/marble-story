import * as THREE from 'three';
import type { Game } from '../game/game';

/**
 * Realm weather: rain streaks that follow the camera, and lightning that
 * forks down on the horizon, lights the sky and the land for a heartbeat,
 * and rolls thunder in a moment later (farther bolts, longer wait).
 */

export interface WeatherDef {
  /** Rain density, 0..1. */
  rain?: number;
  /** Mean seconds between lightning strikes. */
  lightning?: number;
  boltColor?: number;
  /** Overrides the sky's cloud cover (storms want a heavy deck). */
  clouds?: number;
  /** Glowing spores drifting down like snow round the camera (Act II's fungal caverns), 0..1. */
  spores?: number;
  /** Their colors (picked at random per spore). */
  sporeColors?: number[];
}

export const WEATHER: Record<string, WeatherDef> = {
  falls: { rain: 0.45, lightning: 9, boltColor: 0xe8f2ff, clouds: 0.8 },
  keep: { lightning: 12, boltColor: 0xd8b8ff },
  // Act II: the Mycelium Deep, where the spores fall like snow.
  mycelium: { spores: 0.85, sporeColors: [0xffc850, 0xffe29a, 0x6af0dc, 0xc890ff] },
};

const SPORES = 700;
const SR = 30;
const SH = 18;

const DROPS = 900;
const R = 26;
const H = 22;

export class Weather {
  private def: WeatherDef = {};
  private rain: THREE.LineSegments;
  private drops = new Float32Array(DROPS * 3);
  private rainMat = new THREE.LineBasicMaterial({ color: 0xcfe0f0, transparent: true, opacity: 0.32, depthWrite: false, fog: false });
  private boltMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
  private bolt: THREE.Mesh | null = null;
  private boltT = 0;
  private nextStrike = 5;
  private flash = 0;
  private thunder: { t: number; v: number }[] = [];
  private hemiBase = 1;
  private spores: THREE.Points;
  private sporePos = new Float32Array(SPORES * 3);
  private sporePhase = new Float32Array(SPORES);

  constructor(private game: Game) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DROPS * 6), 3));
    this.rain = new THREE.LineSegments(geo, this.rainMat);
    this.rain.frustumCulled = false;
    this.rain.visible = false;
    game.renderer.scene.add(this.rain);
    // Spores: soft round points of light, drifting and swaying on their way down.
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(this.sporePos, 3));
    sg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(SPORES * 3), 3));
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const x = c.getContext('2d');
    if (x) {
      const grad = x.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = grad;
      x.fillRect(0, 0, 32, 32);
    }
    this.spores = new THREE.Points(sg, new THREE.PointsMaterial({
      size: 0.22, map: new THREE.CanvasTexture(c), vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.spores.frustumCulled = false;
    this.spores.visible = false;
    game.renderer.scene.add(this.spores);
  }

  apply(def: WeatherDef | undefined): void {
    this.def = def ?? {};
    this.clearBolt();
    this.flash = 0;
    this.thunder = [];
    this.hemiBase = this.game.renderer.hemi.intensity;
    this.nextStrike = 3 + Math.random() * (this.def.lightning ?? 10);
    this.rain.visible = !!this.def.rain;
    const c = this.game.renderer.camera.position;
    for (let i = 0; i < DROPS; i++) this.respawn(i, c, true);
    this.spores.visible = !!this.def.spores;
    if (this.def.spores) {
      const cols = this.def.sporeColors ?? [0xffe0a0];
      const ca = this.spores.geometry.getAttribute('color') as THREE.BufferAttribute;
      const col = new THREE.Color();
      for (let i = 0; i < SPORES; i++) {
        this.sporeSpawn(i, c, true);
        this.sporePhase[i] = Math.random() * 100;
        col.setHex(cols[Math.floor(Math.random() * cols.length)]!).multiplyScalar(0.55 + Math.random() * 0.45);
        ca.setXYZ(i, col.r, col.g, col.b);
      }
      ca.needsUpdate = true;
    }
    this.game.renderer.sky.flash(0);
    if (this.def.clouds !== undefined) this.game.renderer.sky.setClouds(this.def.clouds);
  }

  private respawn(i: number, c: THREE.Vector3, anyHeight: boolean): void {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * R;
    this.drops[i * 3] = c.x + Math.sin(a) * r;
    this.drops[i * 3 + 1] = c.y + (anyHeight ? (Math.random() - 0.4) * H : H * 0.6 + Math.random() * 4);
    this.drops[i * 3 + 2] = c.z + Math.cos(a) * r;
  }

  private sporeSpawn(i: number, c: THREE.Vector3, anyHeight: boolean): void {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * SR;
    this.sporePos[i * 3] = c.x + Math.sin(a) * r;
    this.sporePos[i * 3 + 1] = c.y + (anyHeight ? (Math.random() - 0.45) * SH : SH * 0.55 + Math.random() * 3);
    this.sporePos[i * 3 + 2] = c.z + Math.cos(a) * r;
  }

  private clearBolt(): void {
    if (!this.bolt) return;
    this.game.renderer.scene.remove(this.bolt);
    this.bolt.geometry.dispose();
    this.bolt = null;
  }

  /** A forked bolt far off on the horizon, as a ribbon facing the camera. */
  private strike(): void {
    const g = this.game;
    const cam = g.renderer.camera.position;
    // Most strikes land somewhere in view.
    const fwd = g.renderer.camera.getWorldDirection(new THREE.Vector3());
    const az = Math.random() < 0.75 ? Math.atan2(fwd.x, fwd.z) + (Math.random() - 0.5) * 1.6 : Math.random() * Math.PI * 2;
    const dist = 330 + Math.random() * 260;
    const bx = cam.x + Math.sin(az) * dist;
    const bz = cam.z + Math.cos(az) * dist;
    const side = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az));
    const pos: number[] = [];
    const ribbon = (pts: THREE.Vector3[], w: number) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]!;
        const b = pts[i + 1]!;
        const wa = w * (1 - (i / pts.length) * 0.5);
        const wb = w * (1 - ((i + 1) / pts.length) * 0.5);
        const a0 = a.clone().addScaledVector(side, -wa);
        const a1 = a.clone().addScaledVector(side, wa);
        const b0 = b.clone().addScaledVector(side, -wb);
        const b1 = b.clone().addScaledVector(side, wb);
        pos.push(a0.x, a0.y, a0.z, a1.x, a1.y, a1.z, b1.x, b1.y, b1.z, a0.x, a0.y, a0.z, b1.x, b1.y, b1.z, b0.x, b0.y, b0.z);
      }
    };
    const top = 220 + Math.random() * 60;
    const main: THREE.Vector3[] = [];
    let x = 0;
    for (let y = top; y > -10; y -= 14 + Math.random() * 12) {
      x += (Math.random() - 0.5) * 26;
      main.push(new THREE.Vector3(bx, y, bz).addScaledVector(side, x));
    }
    main.push(new THREE.Vector3(bx, -20, bz).addScaledVector(side, x));
    ribbon(main, 2.2);
    for (let k = 0; k < 3; k++) {
      const from = main[1 + Math.floor(Math.random() * (main.length / 2))]!;
      const br: THREE.Vector3[] = [from.clone()];
      let p = from.clone();
      const dir = Math.random() < 0.5 ? -1 : 1;
      for (let s = 0; s < 4; s++) {
        p = p.clone().add(new THREE.Vector3(0, -10 - Math.random() * 10, 0)).addScaledVector(side, dir * (6 + Math.random() * 10));
        br.push(p);
      }
      ribbon(br, 1.1);
    }
    this.clearBolt();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.boltMat.color.setHex(this.def.boltColor ?? 0xffffff);
    this.bolt = new THREE.Mesh(geo, this.boltMat);
    this.bolt.frustumCulled = false;
    this.bolt.renderOrder = -800;
    g.renderer.scene.add(this.bolt);
    this.boltT = 0.28;
    // Reduced flashing keeps the bolt but only a faint glow over the land.
    this.flash = g.renderer.calm ? 0.25 : 1;
    g.renderer.sky.flash(this.flash, az);
    this.thunder.push({ t: 0.6 + dist / 340, v: 1.25 - dist / 700 });
  }

  update(dt: number): void {
    const g = this.game;
    const d = this.def;
    const cam = g.renderer.camera.position;
    if (d.rain) {
      g.audio.startLoopOnce('rain', 'rain');
      const pos = this.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      const fall = 26 * dt;
      const wx = 2.2 * dt;
      const n = Math.floor(DROPS * d.rain);
      for (let i = 0; i < DROPS; i++) {
        const j = i * 3;
        if (i >= n) {
          arr[i * 6 + 1] = arr[i * 6 + 4] = -1e4;
          continue;
        }
        this.drops[j]! += wx;
        this.drops[j + 1]! -= fall;
        const dx = this.drops[j]! - cam.x;
        const dz = this.drops[j + 2]! - cam.z;
        if (this.drops[j + 1]! < cam.y - H * 0.4 || dx * dx + dz * dz > R * R) this.respawn(i, cam, this.drops[j + 1]! >= cam.y - H * 0.4);
        const x = this.drops[j]!;
        const y = this.drops[j + 1]!;
        const z = this.drops[j + 2]!;
        arr[i * 6] = x; arr[i * 6 + 1] = y; arr[i * 6 + 2] = z;
        arr[i * 6 + 3] = x - 0.1; arr[i * 6 + 4] = y + 0.75; arr[i * 6 + 5] = z;
      }
      pos.needsUpdate = true;
    }
    if (d.spores) {
      const n = Math.floor(SPORES * d.spores);
      const t = g.realTime;
      for (let i = 0; i < SPORES; i++) {
        const j = i * 3;
        if (i >= n) {
          this.sporePos[j + 1] = -1e4;
          continue;
        }
        const ph = this.sporePhase[i]!;
        this.sporePos[j]! += Math.sin(t * 0.7 + ph) * 0.5 * dt;
        this.sporePos[j + 1]! -= (0.45 + (ph % 1) * 0.5) * dt;
        this.sporePos[j + 2]! += Math.cos(t * 0.6 + ph * 1.3) * 0.5 * dt;
        const dx = this.sporePos[j]! - cam.x;
        const dz = this.sporePos[j + 2]! - cam.z;
        if (this.sporePos[j + 1]! < cam.y - SH * 0.45 || dx * dx + dz * dz > SR * SR) this.sporeSpawn(i, cam, this.sporePos[j + 1]! >= cam.y - SH * 0.45);
      }
      this.spores.geometry.getAttribute('position').needsUpdate = true;
    }
    if (d.lightning) {
      this.nextStrike -= dt;
      if (this.nextStrike <= 0) {
        this.strike();
        // Sometimes a second strike follows close behind.
        this.nextStrike = Math.random() < 0.25 ? 0.4 + Math.random() * 0.6 : d.lightning * (0.5 + Math.random());
      }
    }
    if (this.bolt) {
      this.boltT -= dt;
      // Flickers: bright, dim, bright, gone (a steady fade with reduced flashing).
      this.boltMat.opacity = g.renderer.calm ? Math.min(0.7, this.boltT / 0.28) : this.boltT > 0.2 ? 1 : this.boltT > 0.14 ? 0.25 : this.boltT > 0.06 ? 0.9 : Math.max(0, this.boltT / 0.06);
      if (this.boltT <= 0) this.clearBolt();
    }
    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - dt * 3.2);
      const f = this.flash * (this.boltT > 0.14 && this.boltT < 0.2 ? 0.3 : 1);
      g.renderer.sky.flash(f);
      g.renderer.hemi.intensity = this.hemiBase * (1 + f * 0.9);
    }
    for (const t of this.thunder) t.t -= dt;
    for (const t of this.thunder.filter((q) => q.t <= 0)) g.audio.play('thunder', 0.85 + Math.random() * 0.3, Math.max(0.35, t.v));
    this.thunder = this.thunder.filter((q) => q.t > 0);
  }
}
