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

    let want = 6.8 + this.extraDist;
    if (p.gliding) want = 8.2;
    else if (p.state === 'charge') want = 7.6;
    if (this.furyT > 0) {
      this.furyT -= dt;
      want = 10.5;
    }
    this.dist = want;

    const cp = Math.cos(this.pitch);
    const dir = new THREE.Vector3(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
    // Pull in when geometry is in the way; ease back out.
    const ray = g.col.raycast(this.focus.x, this.focus.y, this.focus.z, dir.x, dir.y, dir.z, this.dist, true);
    const clear = Math.max(1.3, ray.t - 0.35);
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

    let fov = 62;
    if (p.gliding || p.state === 'charge') fov = 69;
    if (p.dragonTimeActive) fov = 56;
    if (this.furyT > 0) fov = 70;
    this.fov = damp(this.fov, fov, 4, dt);
    if (Math.abs(cam.fov - this.fov) > 0.01) {
      cam.fov = this.fov;
      cam.updateProjectionMatrix();
    }
  }
}
