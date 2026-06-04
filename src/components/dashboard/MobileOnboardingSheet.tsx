import { useState } from "react";
import { Sparkles, Share2, Music2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "producerhit_mobile_onboarding_v1";

type Props = {
  locale: "en" | "fr";
  open: boolean;
  onClose: () => void;
};

const STEPS = [Music2, Sparkles, Share2] as const;

export function hasSeenMobileOnboarding(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markMobileOnboardingSeen(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    void 0;
  }
}

export function MobileOnboardingSheet({ locale, open, onClose }: Props) {
  const isFr = locale === "fr";
  const [step, setStep] = useState(0);

  const copy = isFr
    ? [
        {
          title: "Crée ton son",
          body: "Onglet Créer : Type Beat, Song ou Remix — configure, puis Générer. Tu passes sur Résultats automatiquement.",
        },
        {
          title: "Écoute & peaufine",
          body: "Onglet Résultats : écoute, variations, détails. Studio = mastering et export WAV.",
        },
        {
          title: "Partage & export",
          body: "Paramètres : progression, parrainage et promos. Export MP3/WAV depuis tes tracks.",
        },
      ]
    : [
        {
          title: "Create your track",
          body: "Create tab: Type Beat, Song, or Remix — configure, then Generate. You switch to Results automatically.",
        },
        {
          title: "Listen & polish",
          body: "Results tab: listen, variations, details. Studio tab = mastering and WAV export.",
        },
        {
          title: "Share & export",
          body: "Settings: progress, referrals, and promos. Export MP3/WAV from your tracks.",
        },
      ];

  const current = copy[step] ?? copy[0]!;
  const Icon = STEPS[step] ?? Music2;
  const isLast = step >= copy.length - 1;

  const finish = () => {
    markMobileOnboardingSeen();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] md:hidden">
      <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Close" onClick={finish} />
      <div className="pk-mobile-onboarding-sheet absolute bottom-0 left-0 right-0 rounded-t-3xl border border-white/10 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-24px_80px_rgba(0,0,0,0.55)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
            {isFr ? "Bienvenue" : "Welcome"} · {step + 1}/{copy.length}
          </div>
          <button type="button" className="rounded-full p-1 text-white/45 hover:text-white" onClick={finish}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className={cn("pk-mobile-onboarding-icon-box mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06]", `pk-mobile-onboarding-icon-box--${step}`)}>
            <Icon className="pk-mobile-onboarding-icon h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-white">{current.title}</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">{current.body}</p>
        </div>

        <div className="mt-5 flex justify-center gap-1.5">
          {copy.map((_, i) => (
            <span
              key={i}
              className={cn(
                "pk-mobile-onboarding-dot h-1.5 rounded-full transition-all",
                i === step ? "pk-mobile-onboarding-dot--active w-6" : "w-1.5 bg-white/20",
              )}
            />
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          {!isLast ? (
            <>
              <Button variant="secondary" className="flex-1" onClick={finish}>
                {isFr ? "Passer" : "Skip"}
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => setStep((s) => s + 1)}>
                {isFr ? "Suivant" : "Next"}
              </Button>
            </>
          ) : (
            <Button variant="primary" className="w-full" onClick={finish}>
              {isFr ? "C'est parti 🎧" : "Let's go 🎧"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
