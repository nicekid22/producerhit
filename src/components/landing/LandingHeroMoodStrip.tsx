import { landingCloudMoodsCopy } from "@/lib/landingContent";
import type { AppLocale } from "@/i18n/config";
import { pickLandingCloudMood } from "@/lib/landingCloudMoodPick";
import { cn } from "@/lib/utils";
import { useCloudAccentStore } from "@/stores/cloudAccentStore";
import { useVisualThemeStore } from "@/stores/visualThemeStore";

type Props = {
  locale: AppLocale;
  cloudActive: boolean;
  compact?: boolean;
  /** Hero épuré — pastilles compactes sans icônes illustrées */
  minimal?: boolean;
};

export function LandingHeroMoodStrip({ locale, cloudActive, compact, minimal }: Props) {
  const copy = landingCloudMoodsCopy(locale);
  const accent = useCloudAccentStore((s) => s.accent);
  const setAccent = useCloudAccentStore((s) => s.setAccent);
  const setTheme = useVisualThemeStore((s) => s.setTheme);

  const pickMood = (mood: (typeof copy.moods)[number]) => {
    pickLandingCloudMood({ mood, setTheme, setAccent, isFr: locale === "fr" });
  };

  return (
    <div
      className={cn(
        "pk-landing-hero-moods mx-auto w-full max-w-xs sm:max-w-sm",
        compact ? "pk-landing-hero-moods--compact mt-2" : minimal ? "mt-3" : "mt-4",
        minimal && "pk-landing-hero-moods--minimal",
      )}
      aria-label={copy.heroStripLabel}
    >
      <div
        className={cn(
          "pk-landing-hero-moods__row grid grid-cols-4 gap-1.5 sm:gap-2",
          !minimal && "mt-2",
        )}
        role="group"
      >
        {copy.moods.map((mood) => {
          const active = accent === mood.id;
          return (
            <button
              key={mood.id}
              type="button"
              data-pk-cloud-accent={mood.id}
              data-pk-element={mood.element}
              aria-pressed={active}
              aria-label={mood.label}
              title={mood.label}
              onClick={() => pickMood(mood)}
              className={cn(
                "pk-landing-hero-moods__btn flex flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 transition-[border-color,background-color] duration-200 sm:px-1.5",
                active && "pk-landing-hero-moods__btn--active",
              )}
            >
              <span className="pk-mood-dot" data-pk-element={mood.element} aria-hidden />
              <span className="pk-landing-hero-moods__name text-[10px] font-medium tracking-wide sm:text-[11px]">
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
