import { useMemo, useState } from "react";
import { Quote } from "lucide-react";
import { landingCopy, landingTestimonials } from "@/lib/landingContent";
import { shuffleArray } from "@/lib/utils";
import { useLazyInView } from "@/hooks/useLazyInView";
import { TestimonialStars } from "@/components/marketing/TestimonialStars";

import type { AppLocale } from "@/i18n/config";
type Props = {
  locale: AppLocale;
  /** Grille statique (landing conversion) vs bandeau défilant. */
  compact?: boolean;
};

export function TestimonialsStrip({ locale, compact = false }: Props) {
  const { ref, visible } = useLazyInView("240px");
  const copy = landingCopy(locale);

  const [shuffledItems] = useState(() => shuffleArray(landingTestimonials(locale)));
  const scrollDurationSec = useMemo(() => 72 + Math.floor(Math.random() * 36), []);

  if (compact) {
    const items = shuffledItems.slice(0, 3);
    return (
      <div ref={ref} className="pk-landing-testimonials pk-landing-testimonials--compact">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">{copy.testimonialsTitle}</p>
          <h2 className="mt-3 text-balance text-[clamp(1.25rem,3vw,1.85rem)] font-bold tracking-tight text-white">
            {copy.testimonialsHeadline}
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((t) => (
            <blockquote key={t.id} className="pk-landing-testimonials__card pk-prism-card flex h-full flex-col p-5">
              <TestimonialStars />
              <Quote className="mt-2 h-5 w-5 shrink-0 text-[var(--prism-violet)]" aria-hidden />
              <p className="mt-3 flex-1 text-sm leading-relaxed text-white/75">&ldquo;{t.q}&rdquo;</p>
              <footer className="mt-3 text-xs font-semibold text-white/45">{t.who}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    );
  }

  const trackItems = visible ? [...shuffledItems, ...shuffledItems] : shuffledItems.slice(0, 4);

  return (
    <div ref={ref} className="pk-landing-testimonials">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">{copy.testimonialsTitle}</p>
        <p className="mt-3 text-balance text-[clamp(1.35rem,3.5vw,2.25rem)] font-bold tracking-tight text-white">
          {copy.testimonialsHeadline}
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-balance text-sm text-white/55">{copy.testimonialsLead}</p>
      </div>

      <div className={`pk-landing-testimonials__viewport mt-6 sm:mt-8 ${visible ? "is-active" : ""}`}>
        <div
          className={`pk-landing-testimonials__track ${visible ? "" : "is-static"}`}
          style={visible ? { animationDuration: `${scrollDurationSec}s` } : undefined}
        >
          {trackItems.map((t, i) => (
            <blockquote key={`${t.id}-${i}`} className="pk-landing-testimonials__card pk-prism-card flex h-full flex-col p-4 sm:p-5">
              <TestimonialStars />
              <Quote className="mt-2 h-5 w-5 shrink-0 text-[var(--prism-violet)]" aria-hidden />
              <p className="mt-3 flex-1 text-sm leading-relaxed text-white/75">&ldquo;{t.q}&rdquo;</p>
              <footer className="mt-3 text-xs font-semibold text-white/45">{t.who}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </div>
  );
}
