import { Download, Mic2, Sparkles } from "lucide-react";
import { LandingSectionHead } from "@/components/landing/LandingSectionHead";
import { landingBenefitPillars } from "@/lib/landingContent";
import type { LucideIcon } from "lucide-react";

import type { AppLocale } from "@/i18n/config";
const ICONS: LucideIcon[] = [Mic2, Download, Sparkles];

type Props = {
  locale: AppLocale;
};

export function LandingBenefits({ locale }: Props) {
  const pillars = landingBenefitPillars(locale);
  const isFr = locale === "fr";

  return (
    <section id="benefits" className="pk-landing-benefits" aria-labelledby="pk-landing-benefits-title">
      <LandingSectionHead
        id="pk-landing-benefits-title"
        eyebrow={isFr ? "Pourquoi ProducerHit" : "Why ProducerHit"}
        title={isFr ? "Simple. Rapide. Prêt à sortir." : "Simple. Fast. Release-ready."}
        lead={
          isFr
            ? "Un studio en ligne — pas d’install, pas de workflow éclaté. Tu crées, tu écoutes, tu exportes."
            : "One online studio — no install, no fragmented workflow. Create, preview, export."
        }
      />

      <div className="pk-landing-benefits__grid mt-8 grid gap-4 sm:mt-10 md:grid-cols-3">
        {pillars.map((pillar, i) => {
          const Icon = ICONS[i] ?? Sparkles;
          return (
            <article key={pillar.id} className="pk-landing-benefits__card pk-landing-apple-surface flex h-full flex-col p-6">
              <div className="pk-landing-benefits__icon inline-flex h-11 w-11 items-center justify-center rounded-2xl">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-bold tracking-tight">{pillar.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed">{pillar.body}</p>
              <ul className="mt-4 space-y-2 border-t border-white/[0.07] pt-4">
                {pillar.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-[13px]">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
