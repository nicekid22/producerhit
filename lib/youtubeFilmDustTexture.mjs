/**
 * Static film-dust overlay PNG — very subtle, uneven vintage distribution.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";

const W = 1080;
const H = 1920;
const VERSION = 3;
const CACHED = join(process.cwd(), "public", "img", "overlays", `film-dust-portrait-v${VERSION}.png`);

function seededRng(seed) {
  let h = createHash("sha256").update(seed).digest();
  let i = 0;
  return () => {
    if (i >= h.length - 4) {
      h = createHash("sha256").update(h).digest();
      i = 0;
    }
    const n = h.readUInt32BE(i);
    i += 4;
    return (n % 10000) / 10000;
  };
}

/** 0–1 local dust density — edges + random patches, calmer on player card zone. */
function patchDensity(x, y, rnd) {
  const nx = x / W;
  const ny = y / H;
  const dx = (nx - 0.5) * 1.15;
  const dy = (ny - 0.46) * 1.05;
  const dist = Math.min(1, Math.sqrt(dx * dx + dy * dy));

  const inCard = ny > 0.26 && ny < 0.74 && Math.abs(nx - 0.5) < 0.44;
  const edge = 0.22 + dist * 0.78;
  const patch = 0.35 + 0.65 * Math.abs(Math.sin(nx * 11.3 + ny * 7.1 + rnd() * 0.4));
  const band = 0.55 + 0.45 * Math.abs(Math.sin(ny * 28 + rnd() * 1.7));
  const cluster = rnd() < 0.72 ? 1 : 0.25;

  let d = edge * patch * band * cluster;
  if (inCard) d *= 0.28;
  if (ny < 0.1 || ny > 0.92) d *= 1.15;
  return Math.min(1, d);
}

function buildDustSvg() {
  const rnd = seededRng(`producerhit-film-dust-v${VERSION}`);
  const dots = [];

  for (let i = 0; i < 1400; i += 1) {
    const x = rnd() * W;
    const y = rnd() * H;
    const density = patchDensity(x, y, rnd);
    if (rnd() > density) continue;

    const r = rnd() * 1.1 + 0.15;
    const op = (rnd() * 0.09 + 0.015) * density;
    if (op < 0.008) continue;

    dots.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="rgba(255,255,255,${op.toFixed(3)})"/>`,
    );
  }

  const scratches = [];
  for (let i = 0; i < 7; i += 1) {
    const x1 = rnd() * W;
    const y1 = rnd() * H;
    const density = patchDensity(x1, y1, rnd);
    if (density < 0.35) continue;

    const x2 = x1 + (rnd() - 0.5) * 420;
    const y2 = y1 + (rnd() - 0.5) * 70;
    const cx = (x1 + x2) / 2 + (rnd() - 0.5) * 50;
    const cy = (y1 + y2) / 2 + (rnd() - 0.5) * 30;
    const op = (rnd() * 0.035 + 0.008) * density;
    const sw = rnd() * 0.55 + 0.25;
    scratches.push(
      `<path d="M ${x1.toFixed(0)} ${y1.toFixed(0)} Q ${cx.toFixed(0)} ${cy.toFixed(0)} ${x2.toFixed(0)} ${y2.toFixed(0)}" stroke="rgba(255,255,255,${op.toFixed(3)})" stroke-width="${sw.toFixed(2)}" fill="none" stroke-linecap="round"/>`,
    );
  }

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="vig" cx="50%" cy="46%" r="72%">
      <stop offset="0%" stop-color="white" stop-opacity="0.25"/>
      <stop offset="55%" stop-color="white" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="white" stop-opacity="1"/>
    </radialGradient>
    <mask id="mv"><rect width="100%" height="100%" fill="url(#vig)"/></mask>
  </defs>
  <g mask="url(#mv)" opacity="0.85">
    ${scratches.join("\n    ")}
    ${dots.join("\n    ")}
  </g>
</svg>`;
}

export async function ensureFilmDustTexture(outPath) {
  if (existsSync(CACHED)) return CACHED;

  const target = outPath ?? CACHED;
  mkdirSync(dirname(target), { recursive: true });

  const svg = Buffer.from(buildDustSvg());
  await sharp(svg).ensureAlpha().png().toFile(target);

  return target;
}

export function filmDustOverlayFilter(fromLabel, dustInput = "3:v") {
  return `[${fromLabel}][${dustInput}]overlay=0:0:format=auto[vout]`;
}
