import * as THREE from 'three';
import type { Game } from '../game/game';

const disc = new THREE.CircleGeometry(0.5, 18);
disc.rotateX(-Math.PI / 2);

/**
 * Soft round shadows under every enemy, all in one instanced draw. They keep
 * foes grounded on the low setting (no shadow maps) and read as contact
 * shadows on the others.
 */
export class BlobShadows {
  readonly mesh: THREE.InstancedMesh;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private p = new THREE.Vector3();
  private s = new THREE.Vector3();

  constructor(scene: THREE.Scene, private cap = 96) {
    const mat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    this.mesh = new THREE.InstancedMesh(disc, mat, cap);
    this.mesh.renderOrder = 2;
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    scene.add(this.mesh);
  }

  update(g: Game): void {
    let i = 0;
    for (const e of g.enemies) {
      if (i >= this.cap) break;
      if (!e.alive || !e.model.root.visible) continue;
      const gy = g.col.groundAt(e.x, e.z, e.y + 0.5, 0.1).y;
      if (gy < -1e3) continue;
      const h = Math.max(0, e.y - gy);
      if (h > 14) continue;
      const k = Math.max(0.35, 1 - h * 0.07);
      const r = e.radius * 2.3 * k;
      this.p.set(e.x, gy + 0.04, e.z);
      this.s.set(r, 1, r);
      this.mesh.setMatrixAt(i++, this.m.compose(this.p, this.q, this.s));
    }
    this.mesh.count = i;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
