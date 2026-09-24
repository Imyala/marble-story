import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Sky, type SkyDef } from './sky';

export type Quality = 'low' | 'medium' | 'high';

export class Renderer {
  readonly gl: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly sky = new Sky();
  readonly canvas: HTMLCanvasElement;
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
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
        this.composer = new EffectComposer(this.gl);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.55, 0.5, 0.82);
        this.composer.addPass(this.bloom);
        this.composer.addPass(new OutputPass());
      }
    } else if (this.composer) {
      this.composer.dispose();
      this.composer = null;
      this.bloom = null;
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

  applySky(def: SkyDef): void {
    this.sky.apply(def);
    const fogColor = new THREE.Color(def.fog ?? def.horizon);
    this.scene.fog = new THREE.Fog(fogColor, def.fogNear, def.fogFar);
    this.scene.background = fogColor;
    this.sun.color.setHex(def.sunColor);
    this.sun.intensity = def.sunIntensity;
    this.hemi.color.setHex(def.hemiSky);
    this.hemi.groundColor.setHex(def.hemiGround);
    this.hemi.intensity = def.hemiIntensity;
    this.sunOffset.set(...def.sunDir).normalize().multiplyScalar(70);
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

  render(time: number): void {
    this.sky.update(this.camera.position, time);
    if (this.composer) this.composer.render();
    else this.gl.render(this.scene, this.camera);
  }
}
