/**
 * Génère les tuiles PNG du voile texture (fine + cozy flou).
 * Usage: node scripts/generate-prism-veil-texture.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "textures");
const OUT_FINE = join(OUT_DIR, "prism-landing-veil.png");
const OUT_COZY = join(OUT_DIR, "site-texture-veil-cozy.png");
const SIZE = 512;

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function hash(x, y) {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function encodePng(rgba, width, height) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function noiseToRgba(size, field, alphaScale = 1) {
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const v = field[y * size + x];
      const alpha = Math.min(255, Math.floor(v * alphaScale));
      const lum = Math.floor(245 + v * 10);
      out[i] = lum;
      out[i + 1] = lum;
      out[i + 2] = lum;
      out[i + 3] = alpha;
    }
  }
  return out;
}

/** Speckle fin — voile ambient léger. */
function buildFineField(size) {
  const field = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const n = hash(x, y);
      const n2 = hash(x + 17, y + 31);
      const speckle = n * 0.55 + n2 * 0.45;
      field[i] = 52 + speckle * 118 + n2 * 42;
    }
  }
  return field;
}

/** Grain plus large + flou box — cozy fond arrière-plan. */
function buildCozyField(size) {
  const coarse = new Float32Array(size * size);
  const cell = 5;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      const n = hash(cx, cy);
      const n2 = hash(cx + 11, cy + 23);
      coarse[y * size + x] = n * 0.6 + n2 * 0.4;
    }
  }

  const blurred = new Float32Array(size * size);
  const radius = 3;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const sx = (x + dx + size) % size;
          const sy = (y + dy + size) % size;
          sum += coarse[sy * size + sx];
          count++;
        }
      }
      const v = sum / count;
      blurred[y * size + x] = 38 + v * 145;
    }
  }
  return blurred;
}

mkdirSync(OUT_DIR, { recursive: true });

const finePng = encodePng(noiseToRgba(SIZE, buildFineField(SIZE)), SIZE, SIZE);
writeFileSync(OUT_FINE, finePng);
console.log(`Wrote ${OUT_FINE} (${finePng.length} bytes)`);

const cozyPng = encodePng(noiseToRgba(SIZE, buildCozyField(SIZE), 1.05), SIZE, SIZE);
writeFileSync(OUT_COZY, cozyPng);
console.log(`Wrote ${OUT_COZY} (${cozyPng.length} bytes)`);
