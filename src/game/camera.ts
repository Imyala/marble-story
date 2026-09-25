import * as THREE from 'three';
import type { Game } from './game';
import { angleDiff, clamp, damp, dampAngle, yawOf } from '../core/math';
import { rng } from '../core/rng';

/**
 * Third-person orbit camera. Mouse or right stick orbits; when you stop
 * steering it, it drifts back behind the dragon. Lock-on frames you and the
 * target. Scripted shots (dialogue, boss intros) blend in and out.
 */
export class CameraRig {
  yaw = 0;
  pitch = 0.3;
  private dist = 6.8;
  private curDist = 6.8;
  private focus = new THREE.Vector3();
  private shakeAmt = 0;
  private shakeTime = 0;
  private idleLook = 0;
  private furyT = 0;
  private fov = 62;
  private shot: { pos: THREE.Vector3; look: THREE.Vector3 } | null = null;
  private shotBlend = 0;
  private shotLook = new THREE.Vector3();
  private shotPos = new THREE.Vector3();
  private lookAtV = new THREE.Vector3();
  private initialized = false;
  /** Extra distance the level asks for (boss arenas). */
  extraDist = 0;
  /** A brief lens push-in for dramatic beats (the last foe falling). */
  punchT = 0;
  private lead = new THREE.Vector3();
  private pitchBias = 0;
  private occluders: { mesh: THREE.Mesh; center: THREE.Vector3; r: number; orig: THREE.Material; faded: boolean }[] = [];
  private fadedMats = new Map<THREE.Material, THREE.Material>();
  private occT = 0;

  /**
   * Remembers the level's solid scenery so pieces that come between the
   * camera and the dragon can be faded out. Instanced scenery (trees) uses
   * camera-only colliders instead.
   */
  collectOccluders(root: THREE.Object3D): void {
    for (const o of this.occluders) if (o.faded) o.mesh.material = o.orig;
    this.occluders = [];
    root.updateMatrixWorld(true);
    root.traverse((ob) => {
      const m = ob as THREE.Mesh;
      if (!m.isMesh || (m as unknown as THREE.InstancedMesh).isInstancedMesh || Array.isArray(m.material)) return;
      const mat = m.material as THREE.Material;
      if (mat.transparent || !m.castShadow) return;
      const g = m.geometry;
      if (!g.boundingSphere) g.computeBoundingSphere();
      const bs = g.boundingSphere!;
      const scale = m.getWorldScale(new THREE.Vector3());
      const r = bs.radius * Math.max(scale.x, scale.y, scale.z);
      if (r < 0.8 || r > 30) return;
      this.occluders.push({ mesh: m, center: bs.center.clone().applyMatrix4(m.matrixWorld), r, orig: mat, faded: false });
    });
  }

  private fadedFor(m: THREE.Material): THREE.Material {
    let f = this.fadedMats.get(m);
    if (!f) {
      f = m.clone();
      f.transparent = true;
      f.opacity = 0.28;
      f.depthWrite = false;
      this.fadedMats.set(m, f);
    }
    return f;
  }

  private updateOccluders(dt: number, from: THREE.Vector3, to: THREE.Vector3): void {
    this.occT -= dt;
    if (this.occT > 0) return;
    this.occT = 0.05;
    const seg = new THREE.Vector3().subVectors(to, from);
    const len = seg.length();
    if (len < 0.01) return;
    seg.divideScalar(len);
    const tmp = new THREE.Vector3();
    for (const o of this.occluders) {
      // Distance from the sphere center to the camera-to-dragon segment.
      tmp.subVectors(o.center, from);
      const t = Math.max(0, Math.min(len - 0.6, tmp.dot(seg)));
      const d = tmp.addScaledVector(seg, -t).length();
      const hit = d < o.r * 0.75 && t > 0.2;
      if (hit !== o.faded) {
        o.faded = hit;
        o.mesh.material = hit ? this.fadedFor(o.orig) : o.orig;
      }
    }
  }

  snapBehind(yaw: number, pitch = 0.3): void {
    this.yaw = yaw;
    this.pitch = pitch;
    this.initialized = false;
  }

  shake(amount: number, duration = 0.2): void {
    this.shakeAmt = Math.max(this.shakeAmt, amount);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  furyZoom(duration: number): void {
    this.furyT = duration;
  }

  setShot(pos: THREE.Vector3, look: THREE.Vector3): void {
    if (!this.shot) {
      this.shotPos.copy(this.lastPos);
      this.shotLook.copy(this.lookAtV);
    }
    this.shot = { pos: pos.clone(), look: look.clone() };
  }

  clearShot(): void {
    this.shot = null;
  }

  get inShot(): boolean {
    return this.shot !== null;
  }

  private lastPos = new THREE.Vector3();

  update(dt: number, g: Game): void {
    const cam = g.camera;
    const p = g.player;
    const b = p.body;
    const inp = g.input;
    const target = new THREE.Vector3(b.x, b.y + 1.25, b.z);

    if (!this.initialized) {
      this.focus.copy(target);
      this.curDist = this.dist;
      this.initialized = true;
    }

    // Player look input.
    const lookActive = Math.abs(inp.lookX) + Math.abs(inp.lookY) > 0.0001;
    if (!this.shot && g.state === 'play') {
      this.yaw -= inp.lookX;
      this.pitch = clamp(this.pitch + inp.lookY, -0.3, 1.1);
    }
    this.idleLook = lookActive ? 0 : this.idleLook + dt;

    // Look a little ahead of where the dragon is heading.
    const leadK = p.state === 'climb' || p.state === 'ledge' ? 0 : p.gliding ? 0.28 : 0.16;
    this.lead.x = damp(this.lead.x, clamp(b.vx * leadK, -2.5, 2.5), 3, dt);
    this.lead.z = damp(this.lead.z, clamp(b.vz * leadK, -2.5, 2.5), 3, dt);
    target.x += this.lead.x;
    target.z += this.lead.z;
    // Follow with some vertical lag so jumps do not bob the view.
    this.focus.x = damp(this.focus.x, target.x, 16, dt);
    this.focus.z = damp(this.focus.z, target.z, 16, dt);
    const dy = target.y - this.focus.y;
    this.focus.y = damp(this.focus.y, target.y, Math.abs(dy) > 3 ? 12 : b.grounded ? 8 : 3.5, dt);

    const hs = Math.hypot(b.vx, b.vz);
    if (p.lock && p.lock.alive) {
      const mx = (p.lock.x + b.x) * 0.5;
      const mz = (p.lock.z + b.z) * 0.5;
      const want = yawOf(p.lock.x - b.x, p.lock.z - b.z);
      this.yaw = dampAngle(this.yaw, want, 5, dt);
      this.pitch = damp(this.pitch, 0.38, 3, dt);
      this.focus.x = damp(this.focus.x, mx, 3, dt);
      this.focus.z = damp(this.focus.z, mz, 3, dt);
    } else if (g.options.autoCamera && this.idleLook > 0.9 && hs > 3 && !this.shot && g.state === 'play') {
      const moveYaw = yawOf(b.vx, b.vz);
      if (Math.abs(angleDiff(this.yaw, moveYaw)) < 2.3) this.yaw = dampAngle(this.yaw, moveYaw, p.gliding ? 1.8 : 0.9, dt);
      if (p.gliding) this.pitch = damp(this.pitch, 0.42, 1, dt);
    }

    // Tilt down to show the landing when falling, gliding high, or standing
    // at a drop; the player's own look input always wins.
    let bias = 0;
    if (!b.grounded && b.vy < -3) bias = 0.22;
    if (p.gliding && b.y - b.groundY > 6) bias = 0.18;
    if (b.grounded && hs > 1) {
      const ax = b.x + Math.sin(p.yaw) * 3.5;
      const az = b.z + Math.cos(p.yaw) * 3.5;
      const ahead = g.col.groundAt(ax, az, b.y + 0.5, 0.2).y;
      if (b.y - ahead > 2.5) bias = 0.2;
    }
    this.pitchBias = damp(this.pitchBias, this.idleLook > 0.5 && !p.lock ? bias : 0, 2.5, dt);

    let want = 6.8 + this.extraDist;
    if (p.gliding) want = 8.2;
    else if (p.state === 'charge') want = 7.6;
    if (this.furyT > 0) {
      this.furyT -= dt;
      want = 10.5;
    }
    this.dist = want;

    const pitch = clamp(this.pitch + this.pitchBias, -0.3, 1.2);
    const cp = Math.cos(pitch);
    const dir = new THREE.Vector3(-Math.sin(this.yaw) * cp, Math.sin(pitch), -Math.cos(this.yaw) * cp);
    // Pull in when geometry is in the way; ease back out. A small fan of rays
    // stands in for a sphere so the lens does not clip past corners.
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const up = new THREE.Vector3(0, 1, 0);
    let t = this.dist;
    for (const [ox, oy] of [[0, 0], [0.35, 0], [-0.35, 0], [0, 0.3], [0, -0.25]] as const) {
      const d = dir.clone().multiplyScalar(this.dist).addScaledVector(right, ox).addScaledVector(up, oy);
      const L = d.length();
      d.divideScalar(L);
      const hit = g.col.raycast(this.focus.x, this.focus.y, this.focus.z, d.x, d.y, d.z, L, true, true);
      if (hit.t < L) t = Math.min(t, (hit.t / L) * this.dist);
    }
    const clear = Math.max(1.3, t - 0.35);
    if (clear < this.curDist) this.curDist = clear;
    else this.curDist = damp(this.curDist, Math.min(clear, this.dist), 3, dt);
    const pos = this.focus.clone().addScaledVector(dir, this.curDist);
    const ground = g.col.terrainAt(pos.x, pos.z);
    if (ground > -1e3 && pos.y < ground + 0.6) pos.y = ground + 0.6;
    if (g.waterLevel > -1e3 && pos.y < g.waterLevel + 0.4) pos.y = g.waterLevel + 0.4;

    const look = this.lookAtV.copy(this.focus);
    look.y += 0.1;

    // Scripted shot blending.
    this.shotBlend = damp(this.shotBlend, this.shot ? 1 : 0, 3.2, dt);
    if (this.shot) {
      this.shotPos.lerp(this.shot.pos, 1 - Math.exp(-3 * dt));
      this.shotLook.lerp(this.shot.look, 1 - Math.exp(-4 * dt));
    }
    if (this.shotBlend > 0.001) {
      pos.lerp(this.shotPos, this.shotBlend);
      look.lerp(this.shotLook, this.shotBlend);
    } else {
      this.shotPos.copy(pos);
      this.shotLook.copy(look);
    }

    // Shake.
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const a = this.shakeAmt * g.options.shake;
      pos.x += rng.signed() * a * 0.5;
      pos.y += rng.signed() * a * 0.5;
      pos.z += rng.signed() * a * 0.5;
      if (this.shakeTime <= 0) this.shakeAmt = 0;
      else this.shakeAmt *= Math.exp(-6 * dt);
    }

    cam.position.copy(pos);
    this.lastPos.copy(pos);
    cam.lookAt(look);
    if (this.shotBlend < 0.5) this.updateOccluders(dt, pos, new THREE.Vector3(b.x, b.y + 0.9, b.z));

    let fov = 62;
    if (p.gliding || p.state === 'charge') fov = 69;
    if (p.dragonTimeActive) fov = 56;
    if (this.furyT > 0) fov = 70;
    if (this.punchT > 0) {
      this.punchT -= dt;
      fov -= 7;
    }
    this.fov = damp(this.fov, fov, 4, dt);
    if (Math.abs(cam.fov - this.fov) > 0.01) {
      cam.fov = this.fov;
      cam.updateProjectionMatrix();
    }
  }
}
