import { useState } from "react";
import { Sparkles, Wand2, Music, ArrowRight } from "lucide-react";
import { useLocaleStore } from "@/stores/localeStore";
import { Button } from "@/components/ui/Button";

export function WelcomeOnboarding({ onGoCreate }: { onGoCreate: () => void }) {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const steps = [
    {
      icon: Music,
      title: isFr ? "Choisis un style" : "Pick a genre",
      desc: isFr
        ? "Sélectionne le genre qui t'inspire parmi nos styles."
        : "Pick the genre that inspires you.",
    },
    {
      icon: Wand2,
      title: isFr ? "Décris ton idée" : "Describe your idea",
      desc: isFr
        ? "Écris quelques mots — l'ambiance, le tempo, ce que tu veux."
        : "Write a few words — the vibe, tempo, whatever you want.",
    },
    {
      icon: Sparkles,
      title: isFr ? "Génère en un clic" : "Generate in one click",
      desc: isFr
        ? "Appuie sur Générer et laisse l'IA créer ta première track."
        : "Hit Generate and let the AI create your first track.",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-pk-border/60 bg-gradient-to-br from-[#7c3aed]/10 via-transparent to-[#7c3aed]/5 p-6 shadow-[0_0_0_1px_rgba(124,58,237,0.08),0_0_32px_rgba(124,58,237,0.12)]">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#7c3aed]/10 blur-3xl" />

      <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
        <Sparkles className="h-4 w-4 text-[#7c3aed]" />
        {isFr ? "Bienvenue sur ProducerHit" : "Welcome to ProducerHit"}
      </h2>

      <p className="mt-1.5 text-sm leading-relaxed text-pk-muted">
        {isFr
          ? "Prêt à créer ta première track ? Voici comment faire :"
          : "Ready to create your first track? Here's how:"}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-pk-border/40 bg-white/[0.03] p-3.5"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7c3aed]/15 text-[#7c3aed]">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-pk-muted">
                  {step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Button variant="primary" onClick={onGoCreate} className="gap-1.5">
          {isFr ? "Créer ma première track" : "Create my first track"}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs font-medium text-pk-muted hover:text-pk-text transition-colors"
        >
          {isFr ? "Plus tard" : "Later"}
        </button>
      </div>
    </div>
  );
}
