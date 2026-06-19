import { Link } from "react-router-dom";
import { Flame, Headphones, Sparkles } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import { trackClientEvent } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  className?: string;
};

export function LandingTrafficStrip({ locale, className }: Props) {
  const isFr = locale === "fr";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-cyan-400/25 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
          <Headphones className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
            {isFr ? "Beats IA publics — écoute & remix gratuit" : "Public AI beats — listen & remix free"}
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-200">
              <Flame className="h-3 w-3" aria-hidden />
              Live
            </span>
          </p>
          <p className="mt-0.5 text-xs text-white/55">
            {isFr
              ? "500+ tracks communauté · pas de compte pour écouter · crée le tien en 30 s"
              : "500+ community tracks · no account to listen · make yours in 30s"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/trending"
          onClick={() => trackClientEvent("traffic_strip_click", { target: "trending" })}
          className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500"
        >
          <Flame className="h-3.5 w-3.5" aria-hidden />
          {isFr ? "Trending" : "Trending"}
        </Link>
        <Link
          to="/community"
          onClick={() => trackClientEvent("traffic_strip_click", { target: "community" })}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-white/85 hover:bg-white/5"
        >
          {isFr ? "Communauté" : "Community"}
        </Link>
        <Link
          to="/auth"
          onClick={() => trackClientEvent("traffic_strip_click", { target: "signup" })}
          className="inline-flex items-center gap-1.5 rounded-xl border border-violet-400/35 bg-violet-500/15 px-4 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-500/25"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {isFr ? "Créer un beat" : "Make a beat"}
        </Link>
      </div>
    </div>
  );
}
