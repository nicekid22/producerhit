import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  GraduationCap,
  Lock,
  Package,
  Rocket,
  Sparkles,
} from "lucide-react";
import {
  DISTRIBUTION_ACADEMY_MODULES,
  DISTRIBUTION_ACADEMY_VALUE_USD,
  type DistributionAcademyActionItem,
  type DistributionAcademyModule,
} from "@/content/academy/distribution/modules";
import {
  isDistributionModuleComplete,
  markDistributionModuleComplete,
  readDistributionAcademyProgress,
} from "@/lib/academyProgress";
import { canAccessDistributionAcademy } from "@producerhit/shared";
import { buildAuthUrl } from "@/lib/authRoutes";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

type Props = {
  locale: "fr" | "en";
  variant?: "in-app" | "public";
};

function moduleTitle(mod: DistributionAcademyModule, isFr: boolean) {
  return isFr ? mod.titleFr : mod.titleEn;
}

function resolveActionHref(
  item: DistributionAcademyActionItem,
  user: { id: string } | null,
): string | null {
  if (!item.href) return null;
  if (item.requiresAuth && !user) {
    return buildAuthUrl({ next: item.href, mode: "login" });
  }
  return item.href;
}

function AcademyActionRow({
  item,
  isFr,
  user,
  checked,
  onToggle,
}: {
  item: DistributionAcademyActionItem;
  isFr: boolean;
  user: { id: string } | null;
  checked: boolean;
  onToggle: () => void;
}) {
  const label = isFr ? item.labelFr : item.labelEn;
  const hint = isFr ? item.hintFr : item.hintEn;
  const href = resolveActionHref(item, user);

  return (
    <div className="pk-academy-action-row">
      <input
        type="checkbox"
        className="pk-academy-action-row__check"
        checked={checked}
        onChange={onToggle}
        aria-label={label}
      />
      <div className="pk-academy-action-row__body">
        {href ? (
          <Link to={href} className="pk-academy-action-row__link">
            {label}
          </Link>
        ) : (
          <span className="pk-academy-action-row__text">{label}</span>
        )}
        {hint ? <p className="pk-academy-action-row__hint">{hint}</p> : null}
      </div>
    </div>
  );
}

export function DistributionAcademyExperience({ locale, variant = "in-app" }: Props) {
  const isFr = locale === "fr";
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const gated = canAccessDistributionAcademy(profile?.plan);
  const [activeId, setActiveId] = useState(DISTRIBUTION_ACADEMY_MODULES[0]!.id);
  const [progress, setProgress] = useState(() => readDistributionAcademyProgress());
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});

  const activeIndex = DISTRIBUTION_ACADEMY_MODULES.findIndex((m) => m.id === activeId);
  const active = DISTRIBUTION_ACADEMY_MODULES[activeIndex] ?? DISTRIBUTION_ACADEMY_MODULES[0]!;
  const canView = active.public || gated;
  const completed = isDistributionModuleComplete(active.id, progress);

  const completedCount = useMemo(
    () => DISTRIBUTION_ACADEMY_MODULES.filter((m) => isDistributionModuleComplete(m.id, progress)).length,
    [progress],
  );
  const progressPct = Math.round((completedCount / DISTRIBUTION_ACADEMY_MODULES.length) * 100);
  const totalMin = DISTRIBUTION_ACADEMY_MODULES.reduce((s, m) => s + m.durationMin, 0);

  const onComplete = () => {
    setProgress(markDistributionModuleComplete(active.id));
  };

  const goModule = (delta: number) => {
    const next = DISTRIBUTION_ACADEMY_MODULES[activeIndex + delta];
    if (next) setActiveId(next.id);
  };

  const toggleAction = (key: string) => {
    setCheckedActions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="pk-academy-page mx-auto w-full max-w-6xl px-4 pb-10 pt-4 md:px-6 md:pt-6">
      <header className="pk-academy-hero">
        <div className="pk-academy-hero__mesh" aria-hidden />
        <div className="pk-academy-hero__grid" aria-hidden />
        <div className="pk-academy-hero__inner">
          <div>
            <p className="pk-academy-hero__eyebrow">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden />
              {isFr ? "Formation incluse" : "Included course"} · ${DISTRIBUTION_ACADEMY_VALUE_USD}
            </p>
            <h1 className="pk-academy-hero__title">
              {isFr ? (
                <>
                  Distribution <span>Academy</span>
                </>
              ) : (
                <>
                  Distribution <span>Academy</span>
                </>
              )}
            </h1>
            <p className="pk-academy-hero__lead">
              {isFr
                ? "De la cover IA au ZIP DistroKid — tout pour publier ta musique sur les plateformes de streaming en 7 jours. Modules courts, actions concrètes."
                : "From AI cover art to DistroKid ZIP — everything to publish on streaming platforms in 7 days. Short modules, concrete action items."}
            </p>
            {variant === "in-app" ? (
              <div className="pk-academy-hero__links">
                <Link to="/learn/distribute-ai-music" className="pk-academy-hero__link">
                  <BookOpen className="h-3.5 w-3.5" aria-hidden />
                  {isFr ? "Page publique" : "Public page"}
                </Link>
                <Link to="/library" className="pk-academy-hero__link">
                  <Package className="h-3.5 w-3.5" aria-hidden />
                  {isFr ? "Pack distribution" : "Distribution pack"}
                </Link>
              </div>
            ) : null}
            <div className="pk-academy-bento">
              <div className="pk-academy-bento__cell">
                <div className="pk-academy-bento__value">8</div>
                <div className="pk-academy-bento__label">{isFr ? "Modules" : "Modules"}</div>
              </div>
              <div className="pk-academy-bento__cell">
                <div className="pk-academy-bento__value">~{totalMin}m</div>
                <div className="pk-academy-bento__label">{isFr ? "Lecture totale" : "Total read"}</div>
              </div>
              <div className="pk-academy-bento__cell">
                <div className="pk-academy-bento__value">7j</div>
                <div className="pk-academy-bento__label">{isFr ? "Premier single" : "First single"}</div>
              </div>
              <div className="pk-academy-bento__cell">
                <div className="pk-academy-bento__value">${DISTRIBUTION_ACADEMY_VALUE_USD}</div>
                <div className="pk-academy-bento__label">{isFr ? "Valeur incluse" : "Included value"}</div>
              </div>
            </div>
          </div>
          {variant === "in-app" ? (
            <div
              className="pk-academy-progress-ring"
              style={{ "--pk-academy-pct": `${progressPct}%` } as CSSProperties}
              aria-label={isFr ? `${progressPct}% terminé` : `${progressPct}% complete`}
            >
              <div className="pk-academy-progress-ring__inner">
                <span className="pk-academy-progress-ring__value">{progressPct}%</span>
                <span className="pk-academy-progress-ring__label">{isFr ? "Prog." : "Done"}</span>
              </div>
            </div>
          ) : (
            <div className="pk-academy-public-badge flex items-center justify-center md:justify-end">
              <div>
                <Rocket className="mx-auto h-6 w-6" aria-hidden />
                <p className="pk-academy-public-badge__label">
                  {isFr ? "Module 1 gratuit" : "Module 1 free"}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="pk-academy-layout">
        <nav className="pk-academy-curriculum" aria-label={isFr ? "Programme" : "Curriculum"}>
          <p className="pk-academy-curriculum__head">{isFr ? "Programme" : "Curriculum"}</p>
          {DISTRIBUTION_ACADEMY_MODULES.map((mod, i) => {
            const locked = !mod.public && !gated;
            const done = isDistributionModuleComplete(mod.id, progress);
            const isActive = activeId === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveId(mod.id)}
                className={cn(
                  "pk-academy-module",
                  isActive && "pk-academy-module--active",
                  done && "pk-academy-module--done",
                  locked && "pk-academy-module--locked",
                )}
              >
                <div className="pk-academy-module__rail">
                  <span className="pk-academy-module__dot">
                    {done ? <Check className="h-3 w-3" aria-hidden /> : i + 1}
                  </span>
                  {i < DISTRIBUTION_ACADEMY_MODULES.length - 1 ? (
                    <span className="pk-academy-module__line" aria-hidden />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="pk-academy-module__title">{moduleTitle(mod, isFr)}</p>
                  <p className="pk-academy-module__meta">
                    {mod.durationMin} min
                    {mod.public ? (isFr ? " · Gratuit" : " · Free") : locked ? (isFr ? " · Studio+" : " · Studio+") : null}
                  </p>
                </div>
                {locked ? <Lock className="pk-academy-module__lock" aria-hidden /> : null}
              </button>
            );
          })}
        </nav>

        <article className="pk-academy-lesson">
          <div className="pk-academy-lesson__glow" aria-hidden />
          <div className="pk-academy-lesson__body">
            {!canView ? (
              <div className="pk-academy-locked">
                <div className="pk-academy-locked__icon">
                  <Lock className="h-6 w-6" aria-hidden />
                </div>
                <p className="pk-academy-locked__title">
                  {isFr ? "Module réservé Studio & Plus" : "Studio & Plus module"}
                </p>
                <p className="pk-academy-locked__text">
                  {isFr
                    ? "Débloque les modules 2 à 8 pour le walkthrough complet : cover IA, ZIP, distributeurs, post-sortie."
                    : "Unlock modules 2–8 for the full walkthrough: AI cover, ZIP, distributors, post-release."}
                </p>
                <Link to="/pricing?plan=studio" className="pk-academy-cta-primary mt-6 inline-flex">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  {isFr ? "Passer à Studio" : "Upgrade to Studio"}
                </Link>
              </div>
            ) : (
              <>
                <div className="pk-academy-lesson__top">
                  <span className="pk-academy-pill pk-academy-pill--accent">
                    {isFr ? `Module ${activeIndex + 1}` : `Module ${activeIndex + 1}`}
                  </span>
                  <span className="pk-academy-pill">
                    <Clock className="h-3 w-3" aria-hidden />~{active.durationMin} min
                  </span>
                  {active.public ? (
                    <span className="pk-academy-pill">{isFr ? "Accès libre" : "Open access"}</span>
                  ) : null}
                  {completed ? (
                    <span className="pk-academy-pill pk-academy-pill--done">
                      <Check className="h-3 w-3" aria-hidden />
                      {isFr ? "Terminé" : "Done"}
                    </span>
                  ) : null}
                </div>
                <h2 className="pk-academy-lesson__title">{moduleTitle(active, isFr)}</h2>
                <p className="pk-academy-lesson__summary">
                  {isFr ? active.summaryFr : active.summaryEn}
                </p>

                <div className="pk-academy-takeaways">
                  {(isFr ? active.sectionsFr : active.sectionsEn).map((line, idx) => (
                    <div key={line} className="pk-academy-takeaway">
                      <p className="pk-academy-takeaway__num">{String(idx + 1).padStart(2, "0")}</p>
                      <p className="pk-academy-takeaway__text">{line}</p>
                    </div>
                  ))}
                </div>

                <div className="pk-academy-actions">
                  <p className="pk-academy-actions__head">{isFr ? "À faire maintenant" : "Do this now"}</p>
                  {active.actionItems.map((item) => {
                    const key = `${active.id}:${item.id}`;
                    return (
                      <AcademyActionRow
                        key={key}
                        item={item}
                        isFr={isFr}
                        user={user}
                        checked={Boolean(checkedActions[key])}
                        onToggle={() => toggleAction(key)}
                      />
                    );
                  })}
                </div>

                <div className="pk-academy-lesson__footer">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="pk-academy-nav-btn"
                      disabled={activeIndex <= 0}
                      onClick={() => goModule(-1)}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                      {isFr ? "Précédent" : "Previous"}
                    </button>
                    <button
                      type="button"
                      className="pk-academy-nav-btn"
                      disabled={activeIndex >= DISTRIBUTION_ACADEMY_MODULES.length - 1}
                      onClick={() => goModule(1)}
                    >
                      {isFr ? "Suivant" : "Next"}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(active.id === "official-ai-cover" || active.id === "producerhit-pack") && variant === "in-app" ? (
                      <Link to="/library" className="pk-academy-nav-btn">
                        <Package className="h-3.5 w-3.5" aria-hidden />
                        {isFr ? "Bibliothèque" : "Library"}
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className="pk-academy-cta-primary"
                      onClick={onComplete}
                      disabled={completed}
                    >
                      <Check className="h-4 w-4" aria-hidden />
                      {completed
                        ? isFr
                          ? "Module terminé"
                          : "Module complete"
                        : isFr
                          ? "Marquer terminé"
                          : "Mark complete"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </article>
      </div>

      {variant === "public" ? (
        <div className="pk-academy-landing-cta">
          {user && gated ? (
            <Link to="/academy/distribution" className="pk-academy-cta-primary">
              {isFr ? "Continuer la formation" : "Continue the course"}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : user ? (
            <Link to="/pricing?plan=studio" className="pk-academy-cta-primary">
              {isFr ? "Débloquer avec Studio" : "Unlock with Studio"}
            </Link>
          ) : (
            <Link to="/auth" className="pk-academy-cta-primary">
              {isFr ? "Créer un compte gratuit" : "Create free account"}
            </Link>
          )}
          <Link to="/library" className="pk-academy-nav-btn">
            {isFr ? "Pack distribution" : "Distribution pack"}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
