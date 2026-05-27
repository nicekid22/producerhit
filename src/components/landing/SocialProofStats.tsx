import { Music2, Sparkles, Timer, Users } from "lucide-react";

type Props = {
  locale: "en" | "fr";
};

export function SocialProofStats({ locale }: Props) {
  const isFr = locale === "fr";

  const stats = isFr
    ? [
        { icon: Music2, value: "2 modes", label: "Chanson + Type Beat" },
        { icon: Timer, value: "~20 s", label: "Génération moyenne" },
        { icon: Sparkles, value: "50+", label: "Genres & moods" },
        { icon: Users, value: "Live", label: "Feed communauté" },
      ]
    : [
        { icon: Music2, value: "2 modes", label: "Song + Type Beat" },
        { icon: Timer, value: "~20s", label: "Avg. generation" },
        { icon: Sparkles, value: "50+", label: "Genres & moods" },
        { icon: Users, value: "Live", label: "Community feed" },
      ];

  return (
    <div className="mt-8 grid grid-cols-2 gap-2.5 sm:mt-10 sm:grid-cols-4 sm:gap-4">
      {stats.map((s) => (
        <div key={s.label} className="pk-landing-stat rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3.5 text-center backdrop-blur-sm sm:px-4 sm:py-4">
          <s.icon className="mx-auto h-4 w-4 text-[var(--prism-cyan)]" strokeWidth={1.75} aria-hidden />
          <div className="mt-2 text-base font-bold tracking-tight text-white sm:text-xl">{s.value}</div>
          <div className="mt-1 text-[10px] font-semibold leading-snug text-white/50 sm:text-[11px]">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
