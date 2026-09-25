import * as THREE from 'three';

/**
 * A final color pass (display space, after tone mapping): realm split toning,
 * a little extra saturation, and the big moments: Dragon Time drains the
 * color and bends the edges of the lens with a ripple as it starts, and Fury
 * burns warm around the frame.
 */
export const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uAspect: { value: 1 },
    uTime: { value: 0 },
    uSat: { value: 1.08 },
    uTone: { value: 0.1 },
    uShadow: { value: new THREE.Vector3() },
    uHigh: { value: new THREE.Vector3() },
    uDT: { value: 0 },
    uPulse: { value: 1 },
    uFury: { value: 0 },
    // Photo-mode filters (identity by default).
    uContrast: { value: 1 },
    uLift: { value: 0 },
    uTint: { value: new THREE.Vector3(1, 1, 1) },
    uVig: { value: 0 },
    uPhotoSat: { value: 1 },
    uCalm: { value: 0 },
    uImpact: { value: 0 },
    /** 0..1: the camera is under water (a blue-green cast, darker at the edges). */
    uWater: { value: 0 },
  },
  vertexShader: /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse;
uniform float uAspect, uTime, uSat, uTone, uDT, uPulse, uFury, uContrast, uLift, uVig, uPhotoSat, uCalm, uImpact, uWater;
uniform vec3 uTint;
uniform vec3 uShadow, uHigh;
varying vec2 vUv;
void main() {
  vec2 d = vUv - 0.5;
  vec2 c = d; c.x *= uAspect;
  float r = length(c);
  vec2 dir = d / max(length(d), 1e-4);
  // Dragon Time begins with a ring of bent light racing outward.
  float ring = uPulse < 1.0 ? smoothstep(0.09, 0.0, abs(r - uPulse * 1.1)) * (1.0 - uPulse) : 0.0;
  vec2 uv = vUv - dir * ring * 0.018;
  float ca = (uDT * 0.0024 + ring * 0.006) * (0.2 + r * r * 3.0) * (1.0 - uCalm);
  vec3 col = vec3(texture2D(tDiffuse, uv + dir * ca).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - dir * ca).b);
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  // Realm split toning: cool shadows, sun-warmed highlights.
  float hl = smoothstep(0.12, 0.85, l);
  col += mix(uShadow * (1.0 - l), uHigh * l, hl) * uTone;
  col = mix(vec3(l), col, uSat);
  // Dragon Time: most of the color drains away into a cold blue hush.
  vec3 dt = mix(vec3(l), col, 0.3) * vec3(0.8, 0.94, 1.14);
  dt = (dt - 0.5) * 1.08 + 0.5;
  col = mix(col, dt, uDT);
  col += vec3(0.45, 0.7, 1.0) * ring * 0.35;
  // Fury: warm, and the edges of the frame smoulder.
  col = mix(col, col * vec3(1.1, 0.96, 0.86), uFury * 0.7);
  col += vec3(1.0, 0.42, 0.12) * smoothstep(0.45, 0.95, r) * uFury * (0.22 + 0.08 * sin(uTime * 9.0) * (1.0 - uCalm));
  // Under water: a mild blue-green cast that deepens toward the edges of the frame.
  col = mix(col, col * vec3(0.62, 0.9, 1.0) + vec3(0.0, 0.025, 0.04), uWater * (0.7 + 0.3 * smoothstep(0.3, 0.9, r)));
  // Impact frame: a bright, drained pop on the biggest hits.
  float il = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(il * 1.35 + 0.08), uImpact * 0.55);
  // Photo filters.
  float pl = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(pl), col, uPhotoSat);
  col = (col - 0.5) * uContrast + 0.5 + uLift;
  col *= uTint;
  col *= 1.0 - uVig * smoothstep(0.35, 1.0, r);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`,
};

/** The color with its brightness taken out: a direction to nudge toward. */
export function chroma(hex: number): THREE.Vector3 {
  const c = new THREE.Color(hex);
  const l = c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
  return new THREE.Vector3(c.r - l, c.g - l, c.b - l);
}
