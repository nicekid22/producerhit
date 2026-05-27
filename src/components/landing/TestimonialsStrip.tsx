import { Quote } from "lucide-react";
import { landingCopy } from "@/lib/landingContent";

type Props = {
  locale: "en" | "fr";
};

export function TestimonialsStrip({ locale }: Props) {
  const copy = landingCopy(locale);
  const isFr = locale === "fr";

  const items = isFr
    ? [
        { q: "J’ai trouvé mon bounce en 3 générations. Le seed change tout pour les variations.", who: "Producteur trap · Paris" },
        { q: "Song Mode m’a sorti un hook utilisable — j’ai fini le track le soir même.", who: "Artiste indie · Montréal" },
        { q: "Type Beat + variations = un catalogue solide en une session.", who: "Beatmaker · Lyon" },
      ]
    : [
        { q: "Found my bounce in 3 generations. Seeds make variations actually usable.", who: "Trap producer · NYC" },
        { q: "Song Mode gave me a hook I kept — finished the track the same night.", who: "Indie artist · LA" },
        { q: "Type Beat + variations = a solid catalog in one session.", who: "Beatmaker · London" },
      ];

  return (
    <div>
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">{copy.testimonialsTitle}</p>
        <h2 className="mt-3 text-balance text-[clamp(1.35rem,3.5vw,2.25rem)] font-bold tracking-tight text-white">
          {isFr ? "Des workflows concrets" : "Real creator workflows"}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-balance text-sm text-white/55">{copy.testimonialsLead}</p>
      </div>
      <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3">
        {items.map((t) => (
          <blockquote key={t.who} className="pk-prism-card flex h-full flex-col p-4 sm:p-6">
            <Quote className="h-5 w-5 text-[var(--prism-violet)]" aria-hidden />
            <p className="mt-3 flex-1 text-sm leading-relaxed text-white/75 sm:mt-4">&ldquo;{t.q}&rdquo;</p>
            <footer className="mt-3 text-xs font-semibold text-white/45 sm:mt-4">{t.who}</footer>
          </blockquote>
        ))}
      </div>
    </div>
  );
}
