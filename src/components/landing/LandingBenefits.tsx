import { Download, Mic2, Sparkles } from "lucide-react";
import { landingBenefitPillars } from "@/lib/landingContent";
import type { LucideIcon } from "lucide-react";

const ICONS: LucideIcon[] = [Mic2, Download, Sparkles];

type Props = {
  locale: "en" | "fr";
};

export function LandingBenefits({ locale }: Props) {
  const pillars = landingBenefitPillars(locale);
  const isFr = locale === "fr";

  return (
    <section id="benefits" className="pk-landing-benefits" aria-labelledby="pk-landing-benefits-title">
      <div className="pk-landing-section-head text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
          {isFr ? "Pourquoi ProducerHit" : "Why ProducerHit"}
        </p>
        <h2 id="pk-landing-benefits-title" className="pk-landing-section-head__title mt-3">
          {isFr ? "Simple. Rapide. Prêt à sortir." : "Simple. Fast. Release-ready."}
        </h2>
        <p className="pk-landing-section-head__lead mx-auto mt-3 max-w-xl">
          {isFr
            ? "Un studio en ligne — pas d’install, pas de workflow éclaté. Tu crées, tu écoutes, tu exportes."
            : "One online studio — no install, no fragmented workflow. Create, preview, export."}
        </p>
      </div>

      <div className="pk-landing-benefits__grid mt-8 grid gap-4 sm:mt-10 md:grid-cols-3">
        {pillars.map((pillar, i) => {
          const Icon = ICONS[i] ?? Sparkles;
          return (
            <article key={pillar.id} className="pk-landing-benefits__card pk-prism-card flex h-full flex-col p-6">
              <div className="pk-landing-benefits__icon inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Icon className="h-5 w-5 text-[var(--prism-cyan)]" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-bold tracking-tight text-white">{pillar.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/58">{pillar.body}</p>
              <ul className="mt-4 space-y-2 border-t border-white/[0.07] pt-4">
                {pillar.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-[13px] text-white/72">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--prism-cyan)]" aria-hidden />
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
