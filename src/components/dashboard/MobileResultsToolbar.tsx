import { AudioWaveform, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

import type { AppLocale } from "@/i18n/config";
type Props = {
  locale: AppLocale;
  generating: boolean;
  activeCount: number;
  onCreate: () => void;
};

/** Barre d’action mobile — génération en cours ou CTA vers l’onglet Créer. */
export function MobileResultsToolbar({ locale, generating, activeCount, onCreate }: Props) {
  const isFr = locale === "fr";
  const busy = generating || activeCount > 0;

  return (
    <div
      className={cn(
        "pk-mobile-gen-notice pk-mobile-results-toolbar -mx-1 mb-2 flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2.5 backdrop-blur-xl md:hidden",
        busy && "pk-mobile-gen-notice--busy",
      )}
    >
      {busy ? (
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="pk-mobile-gen-notice__icon-box relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
            <AudioWaveform className="pk-mobile-gen-notice__icon h-4 w-4 animate-pulse" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">
              {generating
                ? isFr
                  ? "Génération en cours…"
                  : "Generating…"
                : isFr
                  ? "Traitement en cours…"
                  : "Processing…"}
            </div>
            <div className="truncate text-[11px] text-white/45">
              {isFr
                ? "Tes morceaux apparaissent ci-dessous — lecture auto si possible."
                : "Tracks appear below — autoplay when ready."}
            </div>
          </div>
          {activeCount > 0 ? (
            <span className="pk-mobile-gen-notice__badge shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold">
              {activeCount > 9 ? "9+" : activeCount}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="min-w-0 flex-1 text-xs leading-snug text-white/50">
          {isFr ? "Tes créations sont listées ici." : "Your creations are listed here."}
        </p>
      )}
      {!generating ? (
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white/[0.08] px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10 transition-colors hover:bg-white/[0.12]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {isFr ? "Créer" : "Create"}
        </button>
      ) : null}
    </div>
  );
}
