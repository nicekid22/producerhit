import { useEffect } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useGenerationSessionStore } from "@/stores/generationSessionStore";
import { useLocaleStore } from "@/stores/localeStore";
import { cn } from "@/lib/utils";

export function GenerationActivityPill() {
  const { pathname } = useLocation();
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const generating = useGenerationSessionStore((s) => s.generating);
  const phase = useGenerationSessionStore((s) => s.phase);
  const slots = useGenerationSessionStore((s) => s.slots);
  const summaryTitle = useGenerationSessionStore((s) => s.summaryTitle);
  const clearActivity = useGenerationSessionStore((s) => s.clearActivity);

  const onDashboard = pathname === "/dashboard";
  const progress = Math.min(
    100,
    Math.max(
      0,
      ...(slots ?? [])
        .filter((s) => s.visible && s.status === "generating")
        .map((s) => s.progressPct ?? 0),
    ),
  );

  const visible = !onDashboard && (generating || phase === "done");
  const done = phase === "done" && !generating;

  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => clearActivity(), 14_000);
    return () => window.clearTimeout(timer);
  }, [clearActivity, done]);

  if (!visible) return null;

  const title =
    summaryTitle ||
    slots?.find((s) => s.visible)?.title ||
    (isFr ? "Génération" : "Generation");

  return (
    <aside
      className={cn(
        "pk-gen-activity-pill fixed z-[85] max-w-[min(20rem,calc(100vw-1.5rem))]",
        "bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-3 sm:right-4",
      )}
      aria-live="polite"
      aria-label={isFr ? "Activité de génération" : "Generation activity"}
    >
      <Link to="/dashboard" className="pk-gen-activity-pill__card group block">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "pk-gen-activity-pill__icon mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
              done && "pk-gen-activity-pill__icon--done",
            )}
          >
            {done ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="pk-gen-activity-pill__label text-[10px] font-bold uppercase tracking-[0.14em]">
              {done ? (isFr ? "Prêt" : "Ready") : isFr ? "Génération…" : "Generating…"}
            </p>
            <p className="pk-gen-activity-pill__title mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">
              {title}
            </p>
            {!done ? (
              <>
                <div className="pk-gen-activity-pill__progress-track mt-2 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="pk-gen-activity-pill__progress-fill h-full rounded-full transition-[width] duration-300"
                    style={{ width: `${Math.max(progress, 8)}%` }}
                  />
                </div>
                <p className="pk-gen-activity-pill__hint mt-1.5 text-[11px] font-medium">
                  {isFr ? "Tu peux continuer à naviguer" : "Keep browsing — we'll notify you"}
                </p>
              </>
            ) : (
              <p className="pk-gen-activity-pill__ready mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold">
                <Sparkles className="h-3 w-3" />
                {isFr ? "Ouvrir le studio →" : "Open studio →"}
              </p>
            )}
          </div>
        </div>
      </Link>
    </aside>
  );
}
