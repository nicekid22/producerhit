/** Compact 3D simplex + fBM for orb vertex displacement (worklet-safe). */

function grad3(hash: number, x: number, y: number, z: number): number {
  "worklet";
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function permute(i: number): number {
  "worklet";
  const p = (i * 34 + 1) % 256;
  return p;
}

export function simplex3(x: number, y: number, z: number): number {
  "worklet";
  const F3 = 1 / 3;
  const G3 = 1 / 6;
  const s = (x + y + z) * F3;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const k = Math.floor(z + s);
  const t = (i + j + k) * G3;
  const x0 = x - (i - t);
  const y0 = y - (j - t);
  const z0 = z - (k - t);

  const i1 = x0 >= y0 ? (y0 >= z0 ? 1 : x0 >= z0 ? 0 : 2) : x0 >= z0 ? 0 : z0 >= y0 ? 2 : 1;
  const j1 = i1 === 0 ? (y0 >= z0 ? 1 : 2) : i1 === 1 ? (x0 >= z0 ? 0 : 2) : x0 >= y0 ? 0 : 1;
  const k1 = i1 === 0 ? (y0 >= z0 ? 2 : 1) : i1 === 1 ? (x0 >= z0 ? 2 : 1) : x0 >= y0 ? 1 : 2;

  const x1 = x0 - (i1 === 0 ? 1 : 0) + G3;
  const y1 = y0 - (j1 === 1 ? 1 : 0) + G3;
  const z1 = z0 - (k1 === 2 ? 1 : 0) + G3;
  const x2 = x0 - (i1 === 2 ? 1 : 0) + 2 * G3;
  const y2 = y0 - (j1 === 2 ? 1 : 0) + 2 * G3;
  const z2 = z0 - (k1 === 1 ? 1 : 0) + 2 * G3;
  const x3 = x0 - 1 + 3 * G3;
  const y3 = y0 - 1 + 3 * G3;
  const z3 = z0 - 1 + 3 * G3;

  const ii = permute(i & 255);
  const jj = permute(j & 255);
  const kk = permute(k & 255);

  let n0 = 0;
  let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
  if (t0 > 0) {
    t0 *= t0;
    n0 = t0 * t0 * grad3(permute(ii + jj + kk), x0, y0, z0);
  }

  let n1 = 0;
  let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
  if (t1 > 0) {
    t1 *= t1;
    n1 = t1 * t1 * grad3(permute(ii + i1 + jj + j1 + kk + k1), x1, y1, z1);
  }

  let n2 = 0;
  let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
  if (t2 > 0) {
    t2 *= t2;
    n2 = t2 * t2 * grad3(permute(ii + 2 * i1 + jj + 2 * j1 + kk + 2 * k1), x2, y2, z2);
  }

  let n3 = 0;
  let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
  if (t3 > 0) {
    t3 *= t3;
    n3 = t3 * t3 * grad3(permute(ii + 3 * i1 + jj + 3 * j1 + kk + 3 * k1), x3, y3, z3);
  }

  return 32 * (n0 + n1 + n2 + n3);
}

export function fbm3(x: number, y: number, z: number, octaves = 3): number {
  "worklet";
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  for (let o = 0; o < octaves; o += 1) {
    sum += amp * simplex3(x * freq, y * freq, z * freq);
    amp *= 0.5;
    freq *= 2.05;
  }
  return sum;
}
