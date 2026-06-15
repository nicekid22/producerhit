/**
 * Community Shorts player themes — cinema (validated), prism, warm-glass.
 */
import sharp from "sharp";
import { subtleRetroTvFilter } from "./youtubeBrandOverlay.mjs";

export const PLAYER_THEME_IDS = ["cinema", "prism", "warm-glass"];

const LEGACY_MAP = {
  ios: "cinema",
  lofi: "warm-glass",
  cinema: "cinema",
  prism: "prism",
  "warm-glass": "warm-glass",
  warmglass: "warm-glass",
};

export function normalizePlayerTheme(raw) {
  const key = String(raw ?? "cinema").trim().toLowerCase();
  return LEGACY_MAP[key] ?? "cinema";
}

export function playerTheme() {
  return normalizePlayerTheme(process.env.YOUTUBE_PLAYER_THEME ?? process.env.YOUTUBE_PLAYER_VARIANT ?? "cinema");
}

/** Community accounts → prism / warm-glass · override via YOUTUBE_PLAYER_THEME */
export function playerThemeForAccount(accountId) {
  const env = (process.env.YOUTUBE_PLAYER_THEME ?? process.env.YOUTUBE_PLAYER_VARIANT ?? "").trim();
  if (env) return normalizePlayerTheme(env);
  const id = String(accountId ?? "").trim().toLowerCase();
  if (id === "vibez" || id === "lowdey") return "prism";
  if (id === "market" || id === "producerhitai" || id === "beatmakerunion") return "warm-glass";
  return "cinema";
}

/** @deprecated — use playerTheme */
export function playerVariant() {
  return playerTheme();
}

/** @deprecated — use playerThemeForAccount */
export function playerVariantForAccount(accountId) {
  return playerThemeForAccount(accountId);
}

function bgZoom(fps) {
  const lite = process.env.VERCEL === "1" || process.env.YOUTUBE_RENDER_LITE === "1";
  if (lite) {
    return `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920`;
  }
  return `scale=1440:2560:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.00010,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=${fps}`;
}

function bgBlur(sigma) {
  const lite = process.env.VERCEL === "1" || process.env.YOUTUBE_RENDER_LITE === "1";
  return lite ? `gblur=sigma=${Math.max(24, Math.round(sigma * 0.55))}` : `gblur=sigma=${sigma}`;
}

function prismPostGrade(fromLabel) {
  return [
    `[${fromLabel}]split=2[gb][gs]`,
    `[gs]format=gray,noise=alls=4:allf=t+u,geq=lum='lum(X\\,Y)*0.14'[gn]`,
    `[gb][gn]blend=all_mode=overlay:all_opacity=0.08[grained]`,
    `[grained]eq=saturation=1.04[graded]`,
    `[graded]vignette=PI/4.8:mode=forward[retro]`,
  ].join(";");
}

function warmPostGrade(fromLabel) {
  return [
    `[${fromLabel}]split=2[gb][gs]`,
    `[gs]format=gray,noise=alls=3:allf=t+u,geq=lum='lum(X\\,Y)*0.13'[gn]`,
    `[gb][gn]blend=all_mode=overlay:all_opacity=0.07[grained]`,
    `[grained]eq=saturation=1.06:gamma_r=1.04:gamma_g=1.02[graded]`,
    `[graded]vignette=PI/5.2:mode=forward[retro]`,
  ].join(";");
}

/** Card + ffmpeg styling per theme. */
export const PLAYER_THEMES = {
  cinema: {
    id: "cinema",
    label: "Cinema",
    useDust: true,
    bgChain: (fps) =>
      `[0:v]${bgZoom(fps)},eq=brightness=-0.06:saturation=0.92:gamma_g=1.05:gamma_r=0.98:gamma_b=0.97,${bgBlur(52)}[blur]`,
    vignetteAngle: "PI/4.5",
    postGrade: subtleRetroTvFilter,
    wordmarkColor: "white",
    wordmarkOpacity: 0.78,
    progressColor: "white@0.92",
    progressHeadColor: "white@0.95",
    timeColor: "white@0.72",
    remainColor: "white@0.50",
    card: {
      header: "ProducerHit",
      footer: "",
      panel: "rgba(16,22,18,0.74)",
      border: "rgba(180,210,190,0.14)",
      sheen0: "rgba(140,190,150,0.10)",
      sheen1: "rgba(255,255,255,0)",
      titleSize: 44,
      titleWeight: 700,
      titleStyle: "normal",
      titleFont: "Inter, 'Segoe UI', system-ui, sans-serif",
      subSize: 24,
      subColor: "rgba(200,220,205,0.58)",
      accent: "rgba(255,255,255,0.94)",
      barStroke: "rgba(255,255,255,0.18)",
      eqBarFill: "rgba(255,255,255,0.22)",
    },
  },
  prism: {
    id: "prism",
    label: "Prism",
    useDust: false,
    bgChain: (fps) =>
      `[0:v]${bgZoom(fps)},eq=brightness=-0.05:saturation=1.08:gamma_b=1.07:gamma_r=0.96:gamma_g=1.0,${bgBlur(48)}[blur]`,
    vignetteAngle: "PI/4.8",
    postGrade: prismPostGrade,
    wordmarkColor: "cyan",
    wordmarkOpacity: 0.82,
    progressColor: "white@0.92",
    progressHeadColor: "white@0.95",
    timeColor: "white@0.72",
    remainColor: "white@0.50",
    card: {
      header: "PRODUCERHIT",
      footer: "producerhit.com",
      panel: "rgba(12,10,32,0.78)",
      border: "rgba(103,195,255,0.28)",
      sheen0: "rgba(103,195,255,0.14)",
      sheen1: "rgba(157,124,255,0.05)",
      titleSize: 56,
      titleWeight: 700,
      titleStyle: "normal",
      titleFont: "Inter, 'Segoe UI', system-ui, sans-serif",
      subSize: 26,
      subColor: "rgba(103,195,255,0.72)",
      accent: "rgba(238,242,255,0.98)",
      barStroke: "rgba(103,195,255,0.32)",
      eqBarFill: "rgba(157,124,255,0.30)",
      headerSize: 18,
      logoMark: "◆",
    },
  },
  "warm-glass": {
    id: "warm-glass",
    label: "Warm Glass",
    useDust: false,
    bgChain: (fps) =>
      `[0:v]${bgZoom(fps)},eq=brightness=-0.04:saturation=1.10:gamma_r=1.06:gamma_g=1.03:gamma_b=0.96,${bgBlur(50)}[blur]`,
    vignetteAngle: "PI/5.2",
    postGrade: warmPostGrade,
    wordmarkColor: "gold",
    wordmarkOpacity: 0.84,
    progressColor: "gold@0.92",
    progressHeadColor: "pink@0.94",
    timeColor: "white@0.76",
    remainColor: "orange@0.55",
    card: {
      header: "PRODUCERHIT",
      footer: "producerhit.com",
      panel: "rgba(38,16,10,0.62)",
      border: "rgba(255,195,150,0.32)",
      sheen0: "rgba(240,200,72,0.16)",
      sheen1: "rgba(216,88,120,0.06)",
      titleSize: 58,
      titleWeight: 600,
      titleStyle: "italic",
      titleFont: "Georgia, 'Times New Roman', serif",
      subSize: 26,
      subColor: "rgba(255,220,180,0.68)",
      accent: "rgba(255,248,240,0.96)",
      barStroke: "rgba(240,200,72,0.36)",
      eqBarFill: "rgba(232,120,56,0.32)",
      headerSize: 17,
      logoMark: "✦",
    },
  },
};

export function getPlayerTheme(themeId) {
  const id = normalizePlayerTheme(themeId);
  return PLAYER_THEMES[id] ?? PLAYER_THEMES.cinema;
}

export function themeCardMeta(themeId, trackKind) {
  const theme = getPlayerTheme(themeId);
  const c = theme.card;
  const subtitle =
    trackKind === "type_beat"
      ? "Type Beat · AI"
      : trackKind === "instrumental"
        ? "Instrumental · AI"
        : "AI Song · Community";
  return { ...c, subtitle };
}

export function brandWordmarkForTheme(fromLabel, cardY, themeId, fontSuffix = "") {
  const theme = getPlayerTheme(themeId);
  const y = Math.max(40, Math.round(cardY - 44));
  return `[${fromLabel}]drawtext=text='producerhit.com':fontcolor=${theme.wordmarkColor}@${theme.wordmarkOpacity}:fontsize=26${fontSuffix}:shadowcolor=black@0.5:shadowx=0:shadowy=2:x=(w-text_w)/2:y=${y}[branded]`;
}

/** PNG wordmark for serverless ffmpeg (no drawtext filter). */
export async function renderBrandWordmarkPng(themeId, cardY, outPath) {
  const theme = getPlayerTheme(themeId);
  const y = Math.max(40, Math.round(cardY - 44));
  const w = 520;
  const h = 52;
  const mark = theme.card?.logoMark ?? "◆";
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <text x="50%" y="34" text-anchor="middle" fill="${theme.wordmarkColor}" fill-opacity="${theme.wordmarkOpacity}"
    font-family="Inter, Arial, Helvetica, sans-serif" font-size="32" font-weight="800" letter-spacing="1"
    stroke="black" stroke-opacity="0.45" stroke-width="1.2" paint-order="stroke">${mark} producerhit.com</text>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  return { outPath, y, w, h };
}

export function brandWordmarkOverlayFilter(fromLabel, logoY, wordmarkInput = "2:v") {
  return `[${wordmarkInput}]format=rgba[wm];[${fromLabel}][wm]overlay=x=(main_w-overlay_w)/2:y=${logoY}:format=auto[branded]`;
}
