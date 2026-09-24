import * as THREE from 'three';
import { HOLE, type Heightfield } from '../world/collision';

export type TerrainColorFn = (x: number, z: number, h: number, slope: number) => number;

/**
 * Builds a mesh for a heightfield using exactly the triangle split that
 * Heightfield.at interpolates across. Hole vertices drop their triangles.
 */
export function buildTerrainMesh(hf: Heightfield, colorFn: TerrainColorFn): THREE.Mesh {
  const { nx, nz, cell, x0, z0 } = hf;
  const pos = new Float32Array(nx * nz * 3);
  const col = new Float32Array(nx * nz * 3);
  const c = new THREE.Color();
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      let h = hf.vertex(i, j);
      const isHole = h <= HOLE;
      if (isHole) h = -30;
      const x = x0 + i * cell;
      const z = z0 + j * cell;
      pos[k * 3] = x;
      pos[k * 3 + 1] = h;
      pos[k * 3 + 2] = z;
      const hl = hf.vertex(i - 1, j);
      const hr = hf.vertex(i + 1, j);
      const hd = hf.vertex(i, j - 1);
      const hu = hf.vertex(i, j + 1);
      const sx = (hr > HOLE && hl > HOLE ? hr - hl : 0) / (2 * cell);
      const sz = (hu > HOLE && hd > HOLE ? hu - hd : 0) / (2 * cell);
      const slope = Math.hypot(sx, sz);
      c.setHex(colorFn(x, z, h, slope));
      col[k * 3] = c.r;
      col[k * 3 + 1] = c.g;
      col[k * 3 + 2] = c.b;
    }
  }
  const idx: number[] = [];
  const hole = (i: number, j: number) => hf.vertex(i, j) <= HOLE;
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i; // 00
      const b = j * nx + i + 1; // 10
      const d = (j + 1) * nx + i; // 01
      const e = (j + 1) * nx + i + 1; // 11
      if (!hole(i, j) && !hole(i + 1, j) && !hole(i, j + 1)) idx.push(a, d, b);
      if (!hole(i + 1, j + 1) && !hole(i + 1, j) && !hole(i, j + 1)) idx.push(b, d, e);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  const mesh = new THREE.Mesh(g, m);
  mesh.receiveShadow = true;
  return mesh;
}

/** Soft cliff skirts under island edges so floating ground does not look paper thin. */
export function buildTerrainSkirt(hf: Heightfield, depth: number, color: number): THREE.Mesh | null {
  const { nx, nz, cell, x0, z0 } = hf;
  const pos: number[] = [];
  const hole = (i: number, j: number) => hf.vertex(i, j) <= HOLE;
  const push = (i0: number, j0: number, i1: number, j1: number) => {
    const ax = x0 + i0 * cell;
    const az = z0 + j0 * cell;
    const bx = x0 + i1 * cell;
    const bz = z0 + j1 * cell;
    const ah = hf.vertex(i0, j0);
    const bh = hf.vertex(i1, j1);
    const jag = (x: number, z: number) => depth * (0.6 + 0.4 * Math.abs(Math.sin(x * 1.7 + z * 2.3)));
    pos.push(ax, ah, az, bx, bh, bz, bx, bh - jag(bx, bz), bz);
    pos.push(ax, ah, az, bx, bh - jag(bx, bz), bz, ax, ah - jag(ax, az), az);
  };
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      if (hole(i, j)) continue;
      if (i + 1 < nx && !hole(i + 1, j)) {
        const up = j + 1 >= nz || hole(i, j + 1) || hole(i + 1, j + 1);
        const dn = j - 1 < 0 || hole(i, j - 1) || hole(i + 1, j - 1);
        if (up) push(i + 1, j, i, j);
        if (dn) push(i, j, i + 1, j);
      }
      if (j + 1 < nz && !hole(i, j + 1)) {
        const rt = i + 1 >= nx || hole(i + 1, j) || hole(i + 1, j + 1);
        const lt = i - 1 < 0 || hole(i - 1, j) || hole(i - 1, j + 1);
        if (rt) push(i, j, i, j + 1);
        if (lt) push(i, j + 1, i, j);
      }
    }
  }
  if (pos.length === 0) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ color, roughness: 1, side: THREE.DoubleSide, flatShading: true });
  return new THREE.Mesh(g, m);
}
