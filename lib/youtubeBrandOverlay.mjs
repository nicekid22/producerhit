/**
 * Modern Shorts brand overlay — wordmark PNG + typography (2026 native look).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

export const BRAND_WORDMARK = join(process.cwd(), "public", "img", "brand", "producerhit-wordmark.png");

export function resolveWordmarkPath() {
  if (existsSync(BRAND_WORDMARK)) return BRAND_WORDMARK;
  const legacy = join(process.cwd(), "public", "img", "ChatGPT Image 3 juin 2026, 06_36_17.png");
  if (existsSync(legacy)) return legacy;
  return "";
}

export function visualStyle() {
  const raw = (process.env.YOUTUBE_VISUAL_STYLE ?? "modern").trim().toLowerCase();
  return raw === "vhs" ? "vhs" : "modern";
}

export function resolveFontfile() {
  const cwd = process.cwd();
  const candidates = [
    join(cwd, "public", "fonts", "Arial-Bold.ttf"),
    join(cwd, "public", "fonts", "DejaVuSans-Bold.ttf"),
    join(cwd, "public", "fonts", "Inter-SemiBold.ttf"),
    join(cwd, "public", "fonts", "Inter-Bold.ttf"),
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  ];
  const hit = candidates.find((p) => existsSync(p));
  if (!hit) return "";
  return `:fontfile='${hit.replace(/\\/g, "/").replace(/:/g, "\\:")}'`;
}

export function escapePath(p) {
  return String(p).replace(/\\/g, "/").replace(/:/g, "\\:");
}

/** Subtle grain + soft vignette — TikTok-native, not camcorder cosplay. */
export function modernBaseFilter(inputLabel = "0:v", fps = 30) {
  return [
    `[${inputLabel}]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x0a0a0f,zoompan=z='min(1+on*0.000028,1.035)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':s=1080x1920:fps=${fps}:d=1,setsar=1[vid]`,
    `[vid]split=2[base][grainSrc]`,
    `[grainSrc]format=gray,noise=alls=4:allf=t+u,geq=lum='lum(X\\,Y)*0.18'[grain]`,
    `[base][grain]blend=all_mode=overlay:all_opacity=0.12[grained]`,
    `[grained]vignette=PI/5:mode=forward[vg]`,
  ].join(";");
}

/** Optional light VHS accent (when YOUTUBE_VISUAL_STYLE=vhs). */
export function vhsOverlayFilter(fromLabel = "vg", fps = 12) {
  const bandSpeed = 22;
  return [
    `[${fromLabel}]split=3[base][ovScan][ovBand]`,
    `[ovScan]format=gray,geq=lum='255*if(eq(mod(Y\\,4)\\,0)\\,0.10\\,0)'[scan]`,
    `[ovBand]format=gray,geq=lum='255*if(between(Y\\,mod(N*${bandSpeed}\\,1920)\\,mod(N*${bandSpeed}\\,1920)+14)\\,0.35\\,0)'[band]`,
    `[scan][band]blend=all_mode=lighten[ov]`,
    `[base][ov]blend=all_mode=screen:all_opacity=0.22[vhs]`,
  ].join(";");
}

/** Logo just above the player card — avoids YouTube mobile top UI. */
export function brandWordmarkAboveCardFilter(fromLabel, cardY) {
  const font = resolveFontfile();
  const y = Math.max(40, Math.round(cardY - 44));
  return `[${fromLabel}]drawtext=text='producerhit.com':fontcolor=0xE8F4FF@0.78:fontsize=26${font}:shadowcolor=black@0.5:shadowx=0:shadowy=2:x=(w-text_w)/2:y=${y}[branded]`;
}

/** @deprecated Prefer brandWordmarkAboveCardFilter for player template. */
export function brandWordmarkDrawtextFilter(fromLabel) {
  const font = resolveFontfile();
  return `[${fromLabel}]drawtext=text='producerhit.com':fontcolor=0xE8F4FF@0.72:fontsize=24${font}:shadowcolor=black@0.45:shadowx=0:shadowy=1:x=(w-text_w)/2:y=H*0.042[branded]`;
}

/**
 * Subtle retro grade — neutral grain + vignette only (no rgbashift → no magenta veil).
 */
export function subtleRetroTvFilter(fromLabel) {
  return [
    `[${fromLabel}]split=2[gb][gs]`,
    `[gs]format=gray,noise=alls=4:allf=t+u,geq=lum='lum(X\\,Y)*0.16'[gn]`,
    `[gb][gn]blend=all_mode=overlay:all_opacity=0.09[grained]`,
    `[grained]vignette=PI/5:mode=forward[retro]`,
  ].join(";");
}

/** B-roll base — scale/crop portrait stock clip + grain/vignette. */
export function stockVideoBaseFilter(inputLabel = "0:v", fps = 30) {
  return [
    `[${inputLabel}]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,eq=brightness=-0.05:saturation=0.92[vid]`,
    `[vid]split=2[base][grainSrc]`,
    `[grainSrc]format=gray,noise=alls=4:allf=t+u,geq=lum='lum(X\\,Y)*0.18'[grain]`,
    `[base][grain]blend=all_mode=overlay:all_opacity=0.12[grained]`,
    `[grained]vignette=PI/5:mode=forward[vg]`,
  ].join(";");
}

export const MODERN_TEXT = {
  hook: "fontcolor=white:fontsize=56:line_spacing=10:shadowcolor=black@0.55:shadowx=0:shadowy=2:box=1:boxcolor=0x000000@0.45:boxborderw=14",
  body: "fontcolor=white:fontsize=42:line_spacing=8:shadowcolor=black@0.5:shadowx=0:shadowy=2:box=1:boxcolor=0x000000@0.40:boxborderw=12",
  reveal: "fontcolor=0xA5D8FF:fontsize=40:line_spacing=8:shadowcolor=black@0.55:shadowx=0:shadowy=2:box=1:boxcolor=0x000000@0.42:boxborderw=12",
  cta: "fontcolor=white:fontsize=36:line_spacing=6:shadowcolor=black@0.45:shadowx=0:shadowy=2:box=1:boxcolor=0x7C6CFF@0.35:boxborderw=10",
};

export const LEGACY_TEXT = {
  hook: "fontcolor=white:fontsize=50:line_spacing=10:shadowcolor=black@0.85:shadowx=2:shadowy=3:box=1:boxcolor=black@0.62:boxborderw=22",
  body: "fontcolor=white:fontsize=40:line_spacing=8:box=1:boxcolor=black@0.58:boxborderw=18",
  reveal: "fontcolor=#FFE566:fontsize=38:line_spacing=8:shadowcolor=black@0.8:shadowx=2:shadowy=2:box=1:boxcolor=black@0.62:boxborderw=18",
  cta: "fontcolor=white:fontsize=34:line_spacing=6:box=1:boxcolor=black@0.55:boxborderw=16",
};

export function textStyle() {
  return visualStyle() === "vhs" ? LEGACY_TEXT : MODERN_TEXT;
}

export const ART_TEMPLATE_FPS = visualStyle() === "vhs" ? 12 : 30;
