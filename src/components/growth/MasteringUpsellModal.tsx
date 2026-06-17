import { Sparkles, Wand2, X } from "lucide-react";
import type { Loop } from "@/types/loop";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

import type { AppLocale } from "@/i18n/config";
type Props = {
  open: boolean;
  loop: Loop | null;
  locale: AppLocale;
  onClose: () => void;
  onTryMastering: () => void;
  onUpgrade: () => void;
};

export function MasteringUpsellModal({ open, loop, locale, onClose, onTryMastering, onUpgrade }: Props) {
  const isFr = locale === "fr";
  if (!loop) return null;

  return (
    <Modal
      open={open}
      title={isFr ? "Plot twist : t'as débloqué le Mastering 🎚️" : "Plot twist: you unlocked Mastering 🎚️"}
      description={
        isFr
          ? `4 tracks — ton son mérite le fini studio. Écoute « ${loop.name} » masterisée en aperçu. Export = Studio / Plus.`
          : `4 tracks — your sound deserves the studio finish. Preview « ${loop.name} » mastered. Export = Studio / Plus.`
      }
      onClose={onClose}
      confirmText={isFr ? "Fermer" : "Close"}
      onConfirm={onClose}
      hideFooter
    >
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/15 to-cyan-500/10 p-4">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(167,139,250,0.25),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(34,211,238,0.15),transparent_40%)] animate-pulse" aria-hidden />
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/25 text-violet-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{loop.name}</div>
              <div className="text-xs text-white/55">
                {loop.genre} · {loop.bpm} BPM
              </div>
            </div>
          </div>
          <ul className="relative mt-3 space-y-1 text-xs text-white/60">
            <li>{isFr ? "✓ Aperçu mastering gratuit (écoute A/B)" : "✓ Free mastering preview (A/B listen)"}</li>
            <li>{isFr ? "✓ Presets studio pro" : "✓ Pro studio presets"}</li>
            <li>{isFr ? "🔒 Export WAV & application — Studio / Plus" : "🔒 WAV export & apply — Studio / Plus"}</li>
          </ul>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="primary" size="sm" onClick={onTryMastering}>
            <Wand2 className="h-4 w-4" />
            {isFr ? "Essayer Mastering Studio" : "Try Mastering Studio"}
          </Button>
          <Button variant="secondary" size="sm" onClick={onUpgrade}>
            {isFr ? "Passer Studio" : "Go Studio"}
          </Button>
        </div>

        <button type="button" className="flex w-full items-center justify-center gap-1 text-xs text-white/45 hover:text-white/70" onClick={onClose}>
          <X className="h-3 w-3" />
          {isFr ? "Plus tard" : "Later"}
        </button>
      </div>
    </Modal>
  );
}
