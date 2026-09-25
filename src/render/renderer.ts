import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { GradeShader, chroma } from './grade';
import { Sky, type SkyDef } from './sky';
import { WATER_LIGHT } from './water';
import { Backdrop } from './backdrop';

export type Quality = 'low' | 'medium' | 'high';

/** The color the world fades into seen from under water. */
const UNDERWATER_FOG = new THREE.Color(0x0e4a5a);

export class Renderer {
  readonly gl: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly sky = new Sky();
  readonly backdrop = new Backdrop();
  readonly canvas: HTMLCanvasElement;
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  private grade: ShaderPass | null = null;
  private bokeh: BokehPass | null = null;
  /** Wanted grade state; eased every frame. */
  readonly look = { dragon: false, fury: 0, dt: 0, pulse: 1, sky: null as SkyDef | null, impact: 0, underwater: 0 };
  /** The realm's own fog, and how far the view has gone under water (eased 0..1). */
  private fogBase = { color: new THREE.Color(), near: 60, far: 260 };
  private uw = 0;
  /** Reduced flashing: no lens ripple or fringing, a gentler Fury glow, softer lightning. */
  calm = false;
  quality: Quality = 'high';
  private sunOffset = new THREE.Vector3(30, 50, 20);

  constructor(container: HTMLElement) {
    this.gl = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.gl.outputColorSpace = THREE.SRGBColorSpace;
    this.gl.toneMapping = THREE.ACESFilmicToneMapping;
    this.gl.toneMappingExposure = 1.2;
    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = THREE.PCFShadowMap;
    this.canvas = this.gl.domElement;
    this.canvas.id = 'game';
    container.appendChild(this.canvas);

    this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1200);
    this.scene.add(this.camera);

    this.hemi = new THREE.HemisphereLight(0xbfd8ff, 0x4a3a2a, 1.0);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff0d8, 2.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -40;
    sc.right = 40;
    sc.top = 40;
    sc.bottom = -40;
    sc.near = 1;
    sc.far = 160;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    this.scene.add(this.sky.mesh);
    this.scene.add(this.backdrop.mesh);

    this.setQuality('high');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setQuality(q: Quality): void {
    this.quality = q;
    const dpr = Math.min(window.devicePixelRatio || 1, q === 'high' ? 2 : q === 'medium' ? 1.25 : 1);
    this.gl.setPixelRatio(dpr);
    this.gl.shadowMap.enabled = q !== 'low';
    this.sun.castShadow = q !== 'low';
    const size = q === 'high' ? 2048 : 1024;
    if (this.sun.shadow.mapSize.x !== size) {
      this.sun.shadow.mapSize.set(size, size);
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
    }
    if (q === 'high') {
      if (!this.composer) {
        // Multisampled, so the post chain keeps its antialiasing.
        const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
        this.composer = new EffectComposer(this.gl, rt);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.55, 0.5, 0.82);
        this.composer.addPass(this.bloom);
        this.composer.addPass(new OutputPass());
        this.grade = new ShaderPass(GradeShader);
        this.composer.addPass(this.grade);
        if (this.look.sky) this.applyGrade(this.look.sky);
      }
    } else if (this.composer) {
      this.composer.dispose();
      this.composer = null;
      this.bloom = null;
      this.grade = null;
      this.bokeh = null;
    }
    this.resize();
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.gl.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.composer) {
      this.composer.setPixelRatio(this.gl.getPixelRatio());
      this.composer.setSize(w, h);
    }
  }

  get height(): number {
    return this.gl.domElement.height;
  }

  /** Depth of field for photo mode: focus distance and aperture (0 or null turns it off). */
  setDof(focus: number | null, aperture = 0): void {
    if (!this.composer) return;
    if (focus === null || aperture <= 0) {
      if (this.bokeh) this.bokeh.enabled = false;
      return;
    }
    if (!this.bokeh) {
      this.bokeh = new BokehPass(this.scene, this.camera, { focus, aperture, maxblur: 0.012 });
      // After bloom, before the output conversion and the grade.
      this.composer.insertPass(this.bokeh, 2);
    }
    this.bokeh.enabled = true;
    const u = (this.bokeh as unknown as { uniforms: Record<string, THREE.IUniform> }).uniforms;
    u.focus!.value = focus;
    u.aperture!.value = aperture;
  }

  /** A one-beat flash on a big hit (0..1). */
  impact(amount = 1): void {
    this.look.impact = Math.max(this.look.impact, amount);
  }

  /** Photo-mode filter; null restores the normal look. */
  setPhotoFilter(f: { sat: number; contrast: number; lift: number; tint: [number, number, number]; vig: number } | null): void {
    if (!this.grade) return;
    const u = this.grade.uniforms;
    u.uPhotoSat!.value = f?.sat ?? 1;
    u.uContrast!.value = f?.contrast ?? 1;
    u.uLift!.value = f?.lift ?? 0;
    u.uVig!.value = f?.vig ?? 0;
    (u.uTint!.value as THREE.Vector3).set(...(f?.tint ?? [1, 1, 1]));
  }

  /** True when the post chain draws Dragon Time itself (no CSS filter needed). */
  get grading(): boolean {
    return !!this.grade;
  }

  private applyGrade(def: SkyDef): void {
    if (!this.grade) return;
    const u = this.grade.uniforms;
    (u.uShadow!.value as THREE.Vector3).copy(chroma(def.top));
    (u.uHigh!.value as THREE.Vector3).copy(chroma(def.sunColor));
  }

  applySky(def: SkyDef): void {
    this.sky.apply(def);
    this.look.sky = def;
    this.applyGrade(def);
    const fogColor = new THREE.Color(def.fog ?? def.horizon);
    this.scene.fog = new THREE.Fog(fogColor, def.fogNear, def.fogFar);
    this.scene.background = fogColor;
    this.fogBase = { color: fogColor.clone(), near: def.fogNear, far: def.fogFar };
    // A new realm starts dry (the swimmer's camera sets this again each frame it is under).
    this.look.underwater = 0;
    this.uw = 0;
    if (this.grade) this.grade.uniforms.uWater!.value = 0;
    this.sun.color.setHex(def.sunColor);
    this.sun.intensity = def.sunIntensity;
    this.hemi.color.setHex(def.hemiSky);
    this.hemi.groundColor.setHex(def.hemiGround);
    this.hemi.intensity = def.hemiIntensity;
    this.sunOffset.set(...def.sunDir).normalize().multiplyScalar(70);
    WATER_LIGHT.uSunDir.value.set(...def.sunDir).normalize();
    WATER_LIGHT.uSunColor.value.setHex(def.sunColor);
    WATER_LIGHT.uSky.value.setHex(def.horizon);
  }

  /**
   * With the camera under water (look.underwater), the fog closes in and
   * turns blue-green, and the grade (when there is one) tints the view.
   */
  private underwater(dt: number): void {
    const want = this.look.underwater > 0 ? 1 : 0;
    const was = this.uw;
    this.uw += (want - this.uw) * (1 - Math.exp(-(want ? 9 : 6) * dt));
    if (this.uw < 0.002) this.uw = 0;
    if (this.uw === 0 && was === 0) return;
    const fog = this.scene.fog as THREE.Fog | null;
    if (fog) {
      const k = this.uw;
      const base = this.fogBase;
      fog.color.copy(base.color).lerp(UNDERWATER_FOG, k);
      fog.near = base.near + (1.5 - base.near) * k;
      fog.far = base.far + (34 - base.far) * k;
    }
    if (this.grade) this.grade.uniforms.uWater!.value = this.uw;
  }

  /** Keeps the shadow frustum centered on the action. */
  follow(center: THREE.Vector3): void {
    // Snap to shadow texels so shadows do not shimmer as the camera moves.
    const texel = 80 / this.sun.shadow.mapSize.x;
    const x = Math.round(center.x / texel) * texel;
    const z = Math.round(center.z / texel) * texel;
    this.sun.target.position.set(x, center.y, z);
    this.sun.position.set(x + this.sunOffset.x, center.y + this.sunOffset.y, z + this.sunOffset.z);
  }

  render(time: number, dt = 1 / 60): void {
    this.underwater(dt);
    if (this.grade) {
      const L = this.look;
      const was = L.dt;
      L.dt += ((L.dragon ? 1 : 0) - L.dt) * (1 - Math.exp(-(L.dragon ? 7 : 4) * dt));
      if (L.dragon && was < 0.05 && !this.calm) L.pulse = 0;
      L.pulse = Math.min(1, L.pulse + dt * 1.8);
      const u = this.grade.uniforms;
      u.uDT!.value = L.dt;
      u.uPulse!.value = L.pulse;
      u.uFury!.value += (L.fury * (this.calm ? 0.35 : 1) - u.uFury!.value) * (1 - Math.exp(-5 * dt));
      u.uCalm!.value = this.calm ? 1 : 0;
      u.uImpact!.value = this.calm ? 0 : L.impact;
      L.impact = Math.max(0, L.impact - dt * 9);
      u.uTime!.value = time;
      u.uAspect!.value = this.camera.aspect;
    }
    this.sky.update(this.camera.position, time);
    this.backdrop.update(this.camera.position);
    if (this.composer) this.composer.render();
    else this.gl.render(this.scene, this.camera);
  }
}
