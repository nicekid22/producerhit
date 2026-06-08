import { Check } from "lucide-react";
import { landingCopy } from "@/lib/landingContent";
import { HeroCtaButton } from "@/components/landing/HeroCtaButton";
import { buildAuthUrl } from "@/lib/authRoutes";
import { LandingLiveGenerations } from "@/components/landing/LandingLiveGenerations";

type Props = {
  locale: "en" | "fr";
  user: boolean;
};

export function LandingPitchSections({ locale, user }: Props) {
  const copy = landingCopy(locale);
  const isFr = locale === "fr";

  const qualityItems = isFr
    ? [
        { t: "Mix propre", d: "Sortie structurée, pas un loop aléatoire." },
        { t: "Royalty-free", d: "Usage commercial sur tes exports." },
        { t: "Itérations seed", d: "Variations reproductibles en un clic." },
      ]
    : [
        { t: "Clean mix", d: "Structured output, not a random loop." },
        { t: "Royalty-free", d: "Commercial use on your exports." },
        { t: "Seed iterations", d: "Reproducible variations in one click." },
      ];

  return (
    <>
      <section id="suite" className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="pk-landing-pitch-copy">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink-300/75">{copy.trustEyebrow}</p>
          <h2 className="mt-3 text-balance text-[clamp(1.5rem,3.5vw,2.35rem)] font-bold tracking-tight text-white">{copy.suiteTitle}</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60">{copy.suiteLead}</p>
          <ul className="mt-6 grid gap-2.5">
            {copy.suitePoints.map((point, i) => (
              <li
                key={point}
                className="pk-landing-pitch-point flex items-start gap-2.5 text-sm text-white/75"
                style={{ animationDelay: `${120 + i * 90}ms` }}
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--prism-cyan)]" strokeWidth={2.5} />
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <HeroCtaButton to={user ? "/dashboard" : buildAuthUrl()} variant="orbit">
              {copy.heroCtaPrimary}
            </HeroCtaButton>
          </div>
        </div>
        <LandingLiveGenerations locale={locale} />
      </section>

      <section id="dream" className="pk-landing-pitch-dream pk-prism-card relative overflow-hidden p-6 text-center sm:p-10">
        <div aria-hidden className="pk-landing-pitch-dream__orb pointer-events-none absolute inset-0" />
        <div className="relative">
          <h2 className="text-balance text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold tracking-tight text-white">
            <span className="pk-prism-holo-text">{copy.dreamTitle}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/60">{copy.dreamLead}</p>
        </div>
      </section>

      <section id="quality" className="pk-landing-pitch-quality grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="pk-landing-pitch-quality__main pk-prism-card p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
            {isFr ? "Qualité audio" : "Audio quality"}
          </p>
          <h2 className="mt-3 text-balance text-[clamp(1.35rem,3vw,2rem)] font-bold tracking-tight text-white">{copy.qualityTitle}</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/60">{copy.qualityLead}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {qualityItems.map((item, i) => (
            <div
              key={item.t}
              className="pk-landing-pitch-quality__card rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
              style={{ animationDelay: `${160 + i * 120}ms` }}
            >
              <div className="text-sm font-semibold text-white">{item.t}</div>
              <div className="mt-1 text-xs text-white/55">{item.d}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
