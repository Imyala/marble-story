import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Turns a rig built from Groups carrying small meshes into one skinned mesh per
 * material, with the Groups themselves as the bones. Animation code keeps
 * turning the Groups exactly as before; the GPU moves the vertices. A dragon
 * drops from about sixty draw calls to about ten.
 *
 * Meshes marked `userData.keep` (moved, hidden or swapped on their own) and
 * meshes that have children are left as they are.
 */
export function skinify(root: THREE.Object3D): THREE.SkinnedMesh[] {
  root.updateMatrixWorld(true);
  const rootInv = root.matrixWorld.clone().invert();
  const bones: THREE.Object3D[] = [];
  const boneIndex = new Map<THREE.Object3D, number>();
  const byMat = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; meshes: THREE.Mesh[] }>();
  const local = new THREE.Matrix4();
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || o === root) return;
    if ((m as THREE.SkinnedMesh).isSkinnedMesh || (m as unknown as THREE.InstancedMesh).isInstancedMesh) return;
    if (Array.isArray(m.material) || m.userData.keep || m.children.length > 0 || !m.parent) return;
    // Anything under a kept or hidden branch stays as it is.
    for (let p: THREE.Object3D | null = m; p && p !== root; p = p.parent) if (!p.visible || (p !== m && p.userData.keep)) return;
    const bone = m.parent;
    let bi = boneIndex.get(bone);
    if (bi === undefined) {
      bi = bones.length;
      bones.push(bone);
      boneIndex.set(bone, bi);
    }
    let g = m.geometry.clone();
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    if (g.index) g = g.toNonIndexed();
    g.applyMatrix4(local.multiplyMatrices(rootInv, m.matrixWorld));
    const n = g.getAttribute('position').count;
    const si = new Uint16Array(n * 4);
    const sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      si[i * 4] = bi;
      sw[i * 4] = 1;
    }
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    const e = byMat.get(m.material as THREE.Material) ?? { geos: [], meshes: [] };
    e.geos.push(g);
    e.meshes.push(m);
    byMat.set(m.material as THREE.Material, e);
  });
  if (bones.length === 0) return [];
  const skeleton = new THREE.Skeleton(bones as THREE.Bone[]);
  const out: THREE.SkinnedMesh[] = [];
  for (const [material, { geos, meshes }] of byMat) {
    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    if (!merged) continue;
    const sm = new THREE.SkinnedMesh(merged, material);
    sm.castShadow = meshes.some((m) => m.castShadow);
    sm.receiveShadow = meshes.some((m) => m.receiveShadow);
    for (const m of meshes) m.parent?.remove(m);
    root.add(sm);
    sm.updateMatrixWorld(true);
    sm.bind(skeleton);
    // Culling uses the rest pose, padded for swinging tails and wings.
    merged.computeBoundingSphere();
    sm.boundingSphere = merged.boundingSphere!.clone();
    sm.boundingSphere.radius *= 1.5;
    out.push(sm);
  }
  return out;
}
