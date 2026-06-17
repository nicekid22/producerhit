import { Globe2, Music2, ShieldCheck, Waves } from "lucide-react";
import { landingCopy } from "@/lib/landingContent";

import type { AppLocale } from "@/i18n/config";
type Props = {
  locale: AppLocale;
  compact?: boolean;
};

export function SocialProofStats({ locale, compact = false }: Props) {
  const copy = landingCopy(locale);

  const stats =
    locale === "fr"
      ? [
          { icon: Music2, value: "Studio 3-en-1", label: "Song · Beat · Remix" },
          { icon: ShieldCheck, value: "Royalty-free", label: "Usage commercial" },
          { icon: Waves, value: "MP3 / WAV", label: "Export Spotify Ready" },
          { icon: Globe2, value: "Communauté", label: "Remix feed + export TikTok" },
        ]
      : [
          { icon: Music2, value: "3-in-1 studio", label: "Song · Beat · Remix" },
          { icon: ShieldCheck, value: "Royalty-free", label: "Commercial use" },
          { icon: Waves, value: "MP3 / WAV", label: "Spotify Ready export" },
          { icon: Globe2, value: "Community", label: "Remix feed + TikTok export" },
        ];

  return (
    <div className={compact ? "pk-social-proof pk-social-proof--compact" : "mt-2"}>
      {compact ? null : (
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">{copy.trustEyebrow}</p>
        <h2 className="mt-3 text-balance text-lg font-bold tracking-tight text-white sm:text-xl">{copy.trustTitle}</h2>
        <p className="mt-2 text-balance text-xs leading-relaxed text-white/55 sm:text-sm">{copy.trustLead}</p>
      </div>
      )}

      <div className={`grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4${compact ? "" : " mt-8 sm:mt-10"}`}>
        {stats.map((s) => (
          <div
            key={s.label}
            className="pk-landing-stat rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3.5 text-center backdrop-blur-sm sm:px-4 sm:py-4"
          >
            <s.icon className="mx-auto h-4 w-4 text-[var(--prism-cyan)]" strokeWidth={1.75} aria-hidden />
            <div className="mt-2 text-base font-bold tracking-tight text-white sm:text-xl">{s.value}</div>
            <div className="mt-1 text-[10px] font-semibold leading-snug text-white/50 sm:text-[11px]">{s.label}</div>
          </div>
        ))}
      </div>

      {compact ? null : (
      <p className="mx-auto mt-6 max-w-2xl text-center text-[11px] font-semibold text-white/40">
        {locale === "fr" ? "Génération rapide · Itérations seed · Export direct" : "Fast generation · Seed iterations · Direct export"}
      </p>
      )}
    </div>
  );
}
