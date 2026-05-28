import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { landingCopy } from "@/lib/landingContent";
import { Button } from "@/components/ui/Button";

type Props = {
  locale: "en" | "fr";
  user: boolean;
};

export function LandingPitchSections({ locale, user }: Props) {
  const copy = landingCopy(locale);
  const isFr = locale === "fr";

  return (
    <>
      <section id="suite" className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-pink-300/75">{copy.trustEyebrow}</p>
          <h2 className="mt-3 text-balance text-[clamp(1.5rem,3.5vw,2.35rem)] font-bold tracking-tight text-white">{copy.suiteTitle}</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60">{copy.suiteLead}</p>
          <ul className="mt-6 grid gap-2.5">
            {copy.suitePoints.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm text-white/75">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--prism-cyan)]" strokeWidth={2.5} />
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button variant="primary">{copy.heroCtaPrimary}</Button>
            </Link>
          </div>
        </div>
        <div className="pk-prism-card relative overflow-hidden p-6 sm:p-8">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(157,124,255,0.14),transparent_55%)]" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/45">
              <Sparkles className="h-4 w-4 text-[var(--prism-violet)]" />
              {isFr ? "Suite créateur 2026" : "2026 creator suite"}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-sm font-semibold text-white">{isFr ? "Song Mode · Type Beat · Remix · Cover " : "Song Mode · Type Beat · Remix"}</div>
              <div className="mt-2 text-xs leading-relaxed text-white/55">
                {isFr
                  ? "Génération IA, cover audio, export vidéo, mastering — workflow unifié royalty-free."
                  : "AI generation, audio covers, video export, mastering — unified royalty-free workflow."}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                isFr ? "MP3 / WAV" : "MP3 / WAV",
                isFr ? "Usage commercial" : "Commercial use",
                isFr ? "Spotify Ready" : "Spotify Ready",
                isFr ? "Remix communauté" : "Community remix",
              ].map((label) => (
                <div key={label} className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-center text-[11px] font-semibold text-white/70">
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="dream" className="pk-prism-card p-6 text-center sm:p-10">
        <h2 className="text-balance text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold tracking-tight text-white">
          <span className="pk-prism-holo-text">{copy.dreamTitle}</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/60">{copy.dreamLead}</p>
      </section>

      <section id="quality" className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="pk-prism-card p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
            {isFr ? "Qualité audio" : "Audio quality"}
          </p>
          <h2 className="mt-3 text-balance text-[clamp(1.35rem,3vw,2rem)] font-bold tracking-tight text-white">{copy.qualityTitle}</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/60">{copy.qualityLead}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {(isFr
            ? [
                { t: "Mix propre", d: "Sortie structurée, pas un loop aléatoire." },
                { t: "Royalty-free", d: "Usage commercial sur tes exports." },
                { t: "Itérations seed", d: "Variations reproductibles en un clic." },
              ]
            : [
                { t: "Clean mix", d: "Structured output, not a random loop." },
                { t: "Royalty-free", d: "Commercial use on your exports." },
                { t: "Seed iterations", d: "Reproducible variations in one click." },
              ]
          ).map((item) => (
            <div key={item.t} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-sm font-semibold text-white">{item.t}</div>
              <div className="mt-1 text-xs text-white/55">{item.d}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
