import { DUSTY_ORB_MESH } from "@/theme/dustyCloud";

import { fbm3 } from "./noise";

/** Default orb palette — Dusty Cloud (rose / mauve / lavande). */
export const PRISM_MESH = DUSTY_ORB_MESH;

export type MeshPalette = {
  apex: string;
  gold: string;
  mid: string;
  violet: string;
  base: string;
  coral: string;
  hot: string;
  cyan: string;
  ice: string;
  rose: string;
  sky: string;
  lavender: string;
  cream: string;
};

export type OrbMeshPoint = {
  bx: number;
  by: number;
  bz: number;
  color: string;
  /** 0–1 emphasis for rim hotspots */
  sparkle: number;
};

export type OrbParticleFrame = {
  x: number;
  y: number;
  z: number;
  r: number;
  opacity: number;
  color: string;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const c = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mixHex(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(lerp(A.r, B.r, t), lerp(A.g, B.g, t), lerp(A.b, B.b, t));
}

/** Vertical + horizontal gradient on the sphere (premium mesh ref). */
export function meshColorForPosition(
  bx: number,
  by: number,
  bz: number,
  palette: MeshPalette = PRISM_MESH,
): string {
  const lat = (by + 1) / 2;
  const lon = (Math.atan2(bz, bx) / Math.PI + 1) / 2;

  let color: string;
  if (lat > 0.82) color = mixHex(palette.cream, palette.ice, (lat - 0.82) / 0.18);
  else if (lat > 0.68) color = mixHex(palette.gold, palette.cream, (lat - 0.68) / 0.14);
  else if (lat > 0.52) color = mixHex(palette.lavender, palette.sky, (lat - 0.52) / 0.16);
  else if (lat > 0.36) color = mixHex(palette.violet, palette.rose, (lat - 0.36) / 0.16);
  else if (lat > 0.2) color = mixHex(palette.base, palette.mid, (lat - 0.2) / 0.16);
  else color = mixHex(palette.coral, palette.base, lat / 0.2);

  if (lon < 0.25) color = mixHex(color, palette.hot, 0.24);
  else if (lon < 0.45) color = mixHex(color, palette.rose, 0.2);
  else if (lon > 0.75) color = mixHex(color, palette.cyan, 0.22);
  else if (lon > 0.55) color = mixHex(color, palette.sky, 0.18);

  const poleGlow = Math.pow(Math.abs(by), 3);
  if (poleGlow > 0.55) color = mixHex(color, "#FFFFFF", (poleGlow - 0.55) * 0.9);

  return color;
}

/** @deprecated latitude-only gradient */
export function meshColorForLatitude(y: number, palette: MeshPalette = PRISM_MESH): string {
  return meshColorForPosition(0, y, 0, palette);
}

export function orbMeshDensity(size: number, state: "idle" | "active" = "active"): { rings: number; segments: number } {
  let rings: number;
  let segments: number;
  if (size <= 34) {
    rings = 9;
    segments = 14;
  } else if (size <= 56) {
    rings = 12;
    segments = 20;
  } else if (size <= 88) {
    rings = 16;
    segments = 26;
  } else {
    rings = 20;
    segments = 32;
  }
  if (state === "idle") {
    rings = Math.max(6, Math.floor(rings * 0.72));
    segments = Math.max(10, Math.floor(segments * 0.72));
  }
  return { rings, segments };
}

export function buildOrbMesh(rings: number, segments: number, palette: MeshPalette = PRISM_MESH): OrbMeshPoint[] {
  const pts: OrbMeshPoint[] = [];
  for (let i = 0; i < rings; i++) {
    const phi = (i / Math.max(rings - 1, 1)) * Math.PI;
    const y = Math.cos(phi);
    const ringR = Math.sin(phi);
    const isPole = i === 0 || i === rings - 1;
    const isCore = ringR < 0.35;
    const step = isCore && !isPole ? 2 : 1;

    for (let j = 0; j < segments; j += step) {
      const theta = (j / segments) * Math.PI * 2;
      const bx = ringR * Math.cos(theta);
      const bz = ringR * Math.sin(theta);
      const edge = ringR;
      const sparkle = 0.15 + edge * 0.55 + (isPole ? 0.35 : 0);
      pts.push({
        bx,
        by: y,
        bz,
        color: meshColorForPosition(bx, y, bz, palette),
        sparkle,
      });
    }
  }
  return pts;
}

function displaceOrbVertex(
  bx: number,
  by: number,
  bz: number,
  time: number,
  morph: number,
): { bx: number; by: number; bz: number } {
  "worklet";
  const n1 = fbm3(bx * 2.4 + time * 0.9, by * 2.4, bz * 2.4 + time * 0.55, 3);
  const n2 = fbm3(bx * 4.2 - time * 0.4, by * 4.2 + time * 0.3, bz * 4.2, 2);
  const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
  const radial = Math.sqrt(bx * bx + bz * bz);
  const amp = 0.05 + morph * 0.16;
  const d = (n1 * 0.7 + n2 * 0.3) * amp * (0.45 + radial * 0.75);
  return {
    bx: bx + (bx / len) * d,
    by: by + (by / len) * d * 1.35,
    bz: bz + (bz / len) * d,
  };
}

function rotateY(bx: number, by: number, bz: number, angle: number) {
  "worklet";
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: bx * cos - bz * sin, y: by, z: bx * sin + bz * cos };
}

function rotateX(x: number, y: number, z: number, angle: number) {
  "worklet";
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x, y: y * cos - z * sin, z: y * sin + z * cos };
}

/** Single worklet pass — all particles for one frame. */
export function computeOrbParticleFrame(
  mesh: readonly OrbMeshPoint[],
  size: number,
  rotation: number,
  tilt: number,
  pulse: number,
  morph: number,
  time: number,
  reduced: boolean,
): OrbParticleFrame[] {
  "worklet";
  const r = size / 2;
  const angleY = rotation * Math.PI * 2;
  const angleX = tilt * 0.42 - 0.18;
  const scaleBase = 0.84 + pulse * 0.05;
  const baseDot = Math.max(0.45, size * 0.011);
  const out: OrbParticleFrame[] = new Array(mesh.length);

  for (let i = 0; i < mesh.length; i += 1) {
    const p = mesh[i]!;
    const d = displaceOrbVertex(p.bx, p.by, p.bz, time, morph);
    const ry = rotateY(d.bx, d.by, d.bz, angleY);
    const rx = rotateX(ry.x, ry.y, ry.z, angleX);
    const z3 = rx.z;
    const x2 = rx.x;
    const y2 = rx.y;

    const depth = (z3 + 1) / 2;
    const rim = Math.pow(1 - Math.abs(y2), 1.4) * (0.35 + depth * 0.65);
    const facing = 0.22 + depth * 0.78;
    const hollow = 1 - Math.pow(Math.max(0, 0.55 - depth), 2) * 0.65;

    const wobble = 1 + Math.sin(p.by * 5 + time * 2.1) * morph * 0.04;
    const scale = scaleBase * wobble;

    const sparkleBoost = p.sparkle > 0.75 && ((i + Math.floor(time * 8)) % 7 === 0) ? 1.45 : 1;
    const dotR = baseDot * (0.65 + rim * 0.95 + p.sparkle * 0.25) * sparkleBoost;
    const opacity = reduced
      ? 0.5 * hollow
      : (0.12 + facing * 0.55 + rim * 0.28 + p.sparkle * 0.12) * hollow;

    out[i] = {
      x: r + x2 * r * scale,
      y: r + y2 * r * scale,
      z: z3,
      r: dotR,
      opacity: opacity < 0.06 ? 0 : Math.min(1, opacity),
      color: p.color,
    };
  }

  return out;
}

/** @deprecated */
export function projectOrbPoint(
  p: OrbMeshPoint,
  r: number,
  cx: number,
  cy: number,
  angle: number,
  morph: number,
) {
  const wobble = 1 + Math.sin(p.by * 4 + angle * 2) * morph * 0.06;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const x3 = p.bx * cos - p.bz * sin;
  const z3 = p.bx * sin + p.bz * cos;
  const scale = 0.9 * wobble;
  return {
    x: cx + x3 * r * scale,
    y: cy + p.by * r * scale,
    z: z3,
    color: p.color,
  };
}
