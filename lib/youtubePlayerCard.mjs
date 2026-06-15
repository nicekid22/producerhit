/**
 * Compose a frosted-glass music player card PNG (cinema / prism / warm-glass).
 */
import { promises as fs } from "node:fs";
import sharp from "sharp";
import {
  normalizePlayerTheme,
  playerTheme,
  themeCardMeta,
} from "./youtubePlayerThemes.mjs";

/** Shared layout — keep in sync with youtubePlayerTemplate.mjs overlay math. */
export const PLAYER_CARD = {
  cardW: 920,
  cardH: 1180,
  artSize: 760,
  artX: 80,
  artY: 72,
  get titleY() {
    return this.artY + this.artSize + 56;
  },
  get subY() {
    return this.titleY + 54;
  },
  get barY() {
    return this.subY + 48;
  },
  get controlsY() {
    return this.barY + 52;
  },
};

export function playerCardFramePos(cardY = Math.round((1920 - PLAYER_CARD.cardH) / 2 - 24)) {
  const cardX = Math.round((1080 - PLAYER_CARD.cardW) / 2);
  const { artX, artY, artSize, barY } = PLAYER_CARD;
  return {
    cardX,
    cardY,
    barX: cardX + artX,
    barY: cardY + barY,
    barW: artSize,
    logoY: Math.max(40, cardY - 44),
  };
}

function escXml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(s, max) {
  const t = String(s ?? "").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/** Single-line title — shrink font for long hooks (no overlap with CTA). */
function fitSingleLineTitle(title, baseSize = 56) {
  const text = truncate(String(title ?? "").trim(), 52);
  const len = text.length;
  let size = baseSize;
  if (len > 36) size = Math.round(baseSize * 0.62);
  else if (len > 30) size = Math.round(baseSize * 0.72);
  else if (len > 24) size = Math.round(baseSize * 0.82);
  else if (len > 18) size = Math.round(baseSize * 0.92);
  return { text, size: Math.max(34, size) };
}

function appleEqBarsSvg(artX, artY, artSize, fill) {
  const baseY = artY + artSize + 18;
  const heights = [6, 11, 8, 14, 9, 12, 7, 13, 10, 8, 12, 6];
  const barW = 3;
  const gap = 9;
  const totalW = heights.length * barW + (heights.length - 1) * (gap - barW);
  let x = artX + Math.round((artSize - totalW) / 2);
  return heights
    .map((h) => {
      const el = `<rect x="${x}" y="${baseY + 16 - h}" width="${barW}" height="${h}" rx="1.5" fill="${fill}"/>`;
      x += gap;
      return el;
    })
    .join("\n  ");
}

export async function renderPlayerCardPng({
  coverPath,
  title,
  subtitle,
  trackKind = "song",
  theme,
  variant,
  outPath,
  cardW = PLAYER_CARD.cardW,
  cardH = PLAYER_CARD.cardH,
  artSize = PLAYER_CARD.artSize,
}) {
  const coverBuf = await fs.readFile(coverPath);
  const artX = PLAYER_CARD.artX;
  const artY = PLAYER_CARD.artY;
  const themeId = normalizePlayerTheme(theme ?? variant ?? playerTheme());
  const meta = themeCardMeta(themeId, trackKind);
  const baseTitleSize = meta.titleSize ?? 56;
  const { text: titleText, size: titleSize } = fitSingleLineTitle(title, baseTitleSize);
  const subText = truncate(subtitle || meta.subtitle, 44);

  const art = await sharp(coverBuf)
    .resize(artSize, artSize, { fit: "cover", position: "centre" })
    .jpeg({ quality: 92 })
    .toBuffer();

  const artRounded = await sharp(art)
    .composite([
      {
        input: Buffer.from(
          `<svg width="${artSize}" height="${artSize}"><rect width="${artSize}" height="${artSize}" rx="24" ry="24" fill="white"/></svg>`,
        ),
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  const titleY = PLAYER_CARD.titleY;
  const subY = titleY + Math.round(titleSize * 0.55) + 28;
  const barY = subY + 44;
  const controlsY = barY + 52;
  const cx = Math.round(cardW / 2);
  const headerSize = meta.headerSize ?? 16;
  const titleSvg = `<text x="${artX}" y="${titleY}" fill="${meta.accent}" font-family="${meta.titleFont}" font-size="${titleSize}" font-weight="${meta.titleWeight}" font-style="${meta.titleStyle}">${escXml(titleText)}</text>`;

  const svg = `<svg width="${cardW}" height="${cardH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sheen" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="${meta.sheen0}"/>
      <stop offset="100%" stop-color="${meta.sheen1}"/>
    </linearGradient>
  </defs>
  <rect width="${cardW}" height="${cardH}" rx="48" ry="48" fill="${meta.panel}" stroke="${meta.border}" stroke-width="1.5"/>
  <rect width="${cardW}" height="${cardH}" rx="48" ry="48" fill="url(#sheen)"/>
  <text x="${artX}" y="48" fill="${meta.subColor}" font-family="Inter, Segoe UI, sans-serif" font-size="${headerSize}" font-weight="700" letter-spacing="3">${escXml(meta.header)}</text>
  ${appleEqBarsSvg(artX, artY, artSize, meta.eqBarFill)}
  ${titleSvg}
  <text x="${artX}" y="${subY}" fill="${meta.subColor}" font-family="Inter, Segoe UI, sans-serif" font-size="${meta.subSize}">${escXml(subText)}</text>
  <line x1="${artX}" y1="${barY}" x2="${artX + artSize}" y2="${barY}" stroke="${meta.barStroke}" stroke-width="3" stroke-linecap="round"/>
  <g transform="translate(${cx - 88}, ${controlsY})" fill="white" opacity="0.88">
    <polygon points="0,8 0,24 14,16"/>
    <polygon points="-16,8 -16,24 -2,16"/>
    <circle cx="88" cy="16" r="22" fill="none" stroke="white" stroke-width="2" opacity="0.85"/>
    <rect x="80" y="8" width="5" height="16" rx="1.5"/>
    <rect x="91" y="8" width="5" height="16" rx="1.5"/>
    <polygon points="162,8 162,24 176,16"/>
    <polygon points="178,8 178,24 192,16"/>
  </g>
  ${meta.footer ? `<text x="${cx}" y="${cardH - 32}" text-anchor="middle" fill="rgba(255,255,255,0.32)" font-family="Inter, Segoe UI, sans-serif" font-size="15">${escXml(meta.footer)}</text>` : ""}
</svg>`;

  const cardBase = await sharp(Buffer.from(svg)).png().toBuffer();

  await sharp(cardBase)
    .composite([{ input: artRounded, left: artX, top: artY }])
    .png()
    .toFile(outPath);

  return outPath;
}

export function communityTemplateMode() {
  const raw = (process.env.YOUTUBE_COMMUNITY_TEMPLATE ?? "player").trim().toLowerCase();
  return raw === "classic" ? "classic" : "player";
}

export {
  normalizePlayerTheme,
  playerTheme,
  playerThemeForAccount,
  playerVariant,
  playerVariantForAccount,
  renderBrandWordmarkPng,
} from "./youtubePlayerThemes.mjs";
