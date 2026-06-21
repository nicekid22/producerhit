import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Music2 } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import { StoredLoopCover } from "@/components/cover/StoredLoopCover";
import { resolvePublicRowCoverUrl } from "@/lib/coverArt";
import { buildAuthUrl } from "@/lib/authRoutes";
import { dailySpotlightKey, pickDailyBeat, pickDailyPrompt } from "@/lib/marketing/dailySpotlight";
import { fetchPublicLoops, type PublicLoopRow } from "@/lib/publicLoops";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  className?: string;
};

function buildPromptCtaHref(prompt: string, user: boolean): string {
  const next = `/dashboard?prompt=${encodeURIComponent(prompt)}&mode=beat`;
  return user ? next : buildAuthUrl({ mode: "signup", next });
}

export function DailySpotlightSection({ locale, className }: Props) {
  const isFr = locale === "fr";
  const user = useAuthStore((s) => s.user);
  const dayKey = dailySpotlightKey();
  const [loops, setLoops] = useState<PublicLoopRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicLoops({ limit: 48 })
      .then((rows) => {
        if (!cancelled) setLoops(rows);
      })
      .catch(() => {
        if (!cancelled) setLoops([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const promptOfDay = useMemo(() => pickDailyPrompt(locale, "beat", dayKey), [dayKey, locale]);
  const beatOfDay = useMemo(() => pickDailyBeat(loops, dayKey), [dayKey, loops]);
  const beatCoverUrl = beatOfDay ? resolvePublicRowCoverUrl(beatOfDay, 256) : "";

  return (
    <section className={cn("pk-daily-spotlight", className)} aria-labelledby="daily-spotlight-title">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-300" aria-hidden />
        <h2 id="daily-spotlight-title" className="text-lg font-bold text-white sm:text-xl">
          {isFr ? "Du jour" : "Today’s picks"}
        </h2>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/40">
          {dayKey}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-200/80">
            <Music2 className="h-3.5 w-3.5" />
            {isFr ? "Beat du jour" : "Beat of the day"}
          </div>
          {beatOfDay && beatCoverUrl ? (
            <div className="mt-3 flex gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <StoredLoopCover coverUrl={beatCoverUrl} className="h-full w-full" imageClassName="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{beatOfDay.name ?? "Untitled"}</p>
                <p className="mt-0.5 truncate text-xs text-white/45">
                  {[beatOfDay.genre, beatOfDay.mood, beatOfDay.bpm ? `${beatOfDay.bpm} BPM` : null].filter(Boolean).join(" · ")}
                </p>
                <Link to={`/loop/${beatOfDay.id}`} className="mt-2 inline-block text-sm font-semibold text-violet-300 hover:text-violet-200">
                  {isFr ? "Écouter →" : "Listen →"}
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/50">
              {isFr ? "Communauté en chargement…" : "Loading community picks…"}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-200/80">
            <Sparkles className="h-3.5 w-3.5" />
            {isFr ? "Prompt du jour" : "Prompt of the day"}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/85">&ldquo;{promptOfDay}&rdquo;</p>
          <Link
            to={buildPromptCtaHref(promptOfDay, Boolean(user))}
            className="mt-3 inline-block text-sm font-semibold text-violet-300 hover:text-violet-200"
          >
            {isFr ? "Générer ce beat →" : "Generate this beat →"}
          </Link>
        </div>
      </div>
    </section>
  );
}
