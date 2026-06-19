import type { AppLocale } from "@/i18n/config";
import { buildLoopCardSection } from "@/i18n/loopCardCatalog";
import { cn } from "@/lib/utils";
import type { Loop } from "@/types/loop";
import { resolveStemsDownloadUrl } from "@/lib/stemsDownload";

export type LoopCardFooterHint = {
  label: string;
  variant: "public" | "stems";
};

/** Info positive en bas de carte (remplace le countdown d’expiration). */
export function getLoopCardFooterHint(loop: Loop, locale: AppLocale): LoopCardFooterHint | null {
  const lc = buildLoopCardSection(locale);
  if (loop.isPublic) {
    return {
      label: lc.footerLiveCommunity,
      variant: "public",
    };
  }
  const stemsZip = resolveStemsDownloadUrl(loop.stemsUrl);
  if (stemsZip) {
    return {
      label: lc.footerStemsReady,
      variant: "stems",
    };
  }
  return null;
}

/** Play/Pause — états selected (track courante) et playing (lecture active). */
export function loopPlayButtonClass(active: boolean, playing: boolean, extra?: string) {
  return cn(
    "pk-loop-play-btn",
    active && "pk-loop-play-btn--selected",
    playing && "pk-loop-play-btn--playing",
    extra,
  );
}

/** Toggle persistant (Save, Public, etc.) — reste allumé tant que l'état est actif. */
export function loopToggleButtonClass(on: boolean, extra?: string) {
  return cn("pk-loop-toggle-btn", on && "pk-loop-toggle-btn--on", extra);
}

export function loopPublicButtonClass(isPublic: boolean, extra?: string) {
  return cn("pk-loop-toggle-btn", isPublic && "pk-loop-toggle-btn--public", extra);
}

export function loopCardClass(active: boolean, playing: boolean, extra?: string) {
  return cn(
    active && "pk-loop-card--active shadow-glow",
    playing && "pk-loop-card--playing",
    extra,
  );
}

export function loopCoverClass(active: boolean, playing: boolean, extra?: string) {
  return cn(
    active && "pk-loop-cover--selected",
    playing && "pk-loop-cover--playing",
    extra,
  );
}
