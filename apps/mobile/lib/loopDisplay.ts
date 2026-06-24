import type { Loop } from "@producerhit/shared";
import type { AppLocale } from "@/lib/i18n/catalog";
import { t } from "@/lib/i18n/catalog";

export function resolveLoopCoverUrl(loop: Pick<Loop, "coverUrl" | "stemsUrl">): string | null {
  const raw = loop.coverUrl?.trim() ?? "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  const stems = loop.stemsUrl;
  if (stems && typeof stems === "object") {
    const ace = (stems as Record<string, unknown>).ace;
    if (ace && typeof ace === "object") {
      const aceCover = (ace as Record<string, unknown>).coverUrl;
      if (typeof aceCover === "string") {
        const trimmed = aceCover.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
      }
    }
  }

  return null;
}

export function isSongLoop(loop: Loop): boolean {
  return loop.name.includes("Song") || (!loop.mood && loop.loopLength === "16 bars");
}

export function loopKindLabel(loop: Loop, locale: AppLocale = "en"): string {
  return isSongLoop(loop) ? t(locale, "loopKindSong") : t(locale, "loopKindBeat");
}

export function formatDurationMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function shareLoopUrl(loopId: string): string {
  return `https://www.producerhit.com/loop/${encodeURIComponent(loopId)}?utm_source=ios&utm_medium=app`;
}
