import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const sphereCache = new Map<number, THREE.SphereGeometry>();

/** Unit sphere geometry shared by detail level. */
export function unitSphere(detail = 16): THREE.SphereGeometry {
  let g = sphereCache.get(detail);
  if (!g) {
    g = new THREE.SphereGeometry(1, detail, Math.max(6, Math.round(detail * 0.75)));
    sphereCache.set(detail, g);
  }
  return g;
}

export function ellipsoid(rx: number, ry: number, rz: number, material: THREE.Material, detail = 16): THREE.Mesh {
  const m = new THREE.Mesh(unitSphere(detail), material);
  m.scale.set(rx, ry, rz);
  m.castShadow = true;
  return m;
}

/**
 * A tube along a curve whose radius tapers from r0 to r1. Used for horns,
 * tails, claws and tendrils, where three's constant-radius TubeGeometry
 * would look like pipe.
 */
export function taperedTube(
  points: THREE.Vector3[], r0: number, r1: number, segments = 10, radial = 8, closeTip = true,
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(segments, false);
  const pos: number[] = [];
  const norm: number[] = [];
  const idx: number[] = [];
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, p);
    const r = r0 + (r1 - r0) * t;
    const N = frames.normals[i]!;
    const B = frames.binormals[i]!;
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const s = Math.sin(a);
      const c = -Math.cos(a);
      n.set(c * N.x + s * B.x, c * N.y + s * B.y, c * N.z + s * B.z).normalize();
      pos.push(p.x + r * n.x, p.y + r * n.y, p.z + r * n.z);
      norm.push(n.x, n.y, n.z);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = (i + 1) * (radial + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  if (closeTip && r1 > 0.0001) {
    curve.getPointAt(1, p);
    const tipIndex = pos.length / 3;
    const T = frames.tangents[segments]!;
    pos.push(p.x + T.x * r1, p.y + T.y * r1, p.z + T.z * r1);
    norm.push(T.x, T.y, T.z);
    const base = segments * (radial + 1);
    for (let j = 0; j < radial; j++) idx.push(base + j, tipIndex, base + j + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  g.setIndex(idx);
  return g;
}

/** A cylinder whose ends sit at two points. */
export function limb(a: THREE.Vector3, b: THREE.Vector3, r0: number, r1: number, material: THREE.Material, radial = 8): THREE.Mesh {
  const len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r1, r0, len, radial, 1);
  g.translate(0, len / 2, 0);
  const m = new THREE.Mesh(g, material);
  m.position.copy(a);
  const dir = new THREE.Vector3().subVectors(b, a).normalize();
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  m.castShadow = true;
  return m;
}

/** A cone pointing along +Y whose base sits at the origin. */
export function spike(r: number, h: number, material: THREE.Material, radial = 6): THREE.Mesh {
  const g = new THREE.ConeGeometry(r, h, radial, 1);
  g.translate(0, h / 2, 0);
  const m = new THREE.Mesh(g, material);
  m.castShadow = true;
  return m;
}

/** A flat membrane from a 2D outline in the XZ plane (y = 0). */
export function membrane(outline: [number, number][], material: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(outline[0]![0], outline[0]![1]);
  for (let i = 1; i < outline.length; i++) shape.lineTo(outline[i]![0], outline[i]![1]);
  shape.closePath();
  const g = new THREE.ShapeGeometry(shape, 4);
  g.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(g, material);
  m.castShadow = true;
  return m;
}

export function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function setShadows(obj: THREE.Object3D, cast: boolean, receive = false): void {
  obj.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
}

/**
 * Merges each group's plain mesh children that share a material into one
 * mesh, keeping every group (the animated joints) intact. A procedural
 * dragon goes from ~90 draw calls to ~25. Only use it on models that animate
 * groups, never individual meshes.
 */
export function mergeStatic(root: THREE.Object3D): void {
  const groups: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (!(o as THREE.Mesh).isMesh) groups.push(o);
  });
  for (const grp of groups) {
    const byMat = new Map<THREE.Material, THREE.Mesh[]>();
    for (const c of grp.children) {
      const m = c as THREE.Mesh;
      if (!m.isMesh || m.children.length > 0 || Array.isArray(m.material) || m.userData.keep) continue;
      const list = byMat.get(m.material as THREE.Material) ?? [];
      list.push(m);
      byMat.set(m.material as THREE.Material, list);
    }
    for (const [material, meshes] of byMat) {
      if (meshes.length < 2) continue;
      const geos: THREE.BufferGeometry[] = [];
      for (const m of meshes) {
        m.updateMatrix();
        let g = m.geometry.clone();
        for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
        if (!g.getAttribute('normal')) g.computeVertexNormals();
        if (g.index) g = g.toNonIndexed();
        g.applyMatrix4(m.matrix);
        geos.push(g);
      }
      const merged = mergeGeometries(geos, false);
      for (const g of geos) g.dispose();
      if (!merged) continue;
      const out = new THREE.Mesh(merged, material);
      out.castShadow = meshes.some((m) => m.castShadow);
      out.receiveShadow = meshes.some((m) => m.receiveShadow);
      for (const m of meshes) grp.remove(m);
      grp.add(out);
    }
  }
}
