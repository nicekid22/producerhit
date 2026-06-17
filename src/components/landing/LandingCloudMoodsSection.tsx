import { HeroCtaButton } from "@/components/landing/HeroCtaButton";
import { LandingSectionHead } from "@/components/landing/LandingSectionHead";
import type { AppLocale } from "@/i18n/config";
import { landingCloudMoodsCopy } from "@/lib/landingContent";
import { pickLandingCloudMood } from "@/lib/landingCloudMoodPick";
import { cn } from "@/lib/utils";
import { useCloudAccentStore } from "@/stores/cloudAccentStore";
import { useVisualThemeStore } from "@/stores/visualThemeStore";

type Props = {
  locale: AppLocale;
  user: boolean;
  cloudActive: boolean;
};

export function LandingCloudMoodsSection({ locale, user, cloudActive }: Props) {
  const copy = landingCloudMoodsCopy(locale);
  const accent = useCloudAccentStore((s) => s.accent);
  const setAccent = useCloudAccentStore((s) => s.setAccent);
  const setTheme = useVisualThemeStore((s) => s.setTheme);

  const pickMood = (mood: (typeof copy.moods)[number]) => {
    pickLandingCloudMood({ mood, setTheme, setAccent, isFr: locale === "fr" });
  };

  return (
    <section id="cloud-moods" className="pk-landing-cloud-moods" aria-labelledby="pk-landing-cloud-moods-title">
      <LandingSectionHead
        id="pk-landing-cloud-moods-title"
        title={copy.title}
        lead={copy.lead}
        className="mx-auto max-w-xl"
      />

      <div
        className="pk-landing-cloud-moods__grid mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-4 lg:gap-3"
        role="group"
        aria-label={copy.heroStripLabel}
      >
        {copy.moods.map((mood) => {
          const active = cloudActive && accent === mood.id;
          return (
            <button
              key={mood.id}
              type="button"
              data-pk-cloud-accent={mood.id}
              data-pk-element={mood.element}
              aria-pressed={active}
              onClick={() => pickMood(mood)}
              className={cn(
                "pk-landing-cloud-moods__pill rounded-2xl border px-3 py-3 text-left transition-[border-color,background-color,box-shadow] duration-200 sm:px-3.5 sm:py-3.5",
                active && "pk-landing-cloud-moods__pill--active",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="pk-mood-dot shrink-0" data-pk-element={mood.element} aria-hidden />
                <span className="text-sm font-semibold tracking-tight">{mood.label}</span>
              </span>
              <span className="pk-landing-cloud-moods__hint mt-1.5 block text-[11px] leading-snug sm:text-xs">{mood.tag}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <HeroCtaButton to={user ? "/dashboard" : "/theme-preview/cloud?go=dashboard"} variant="orbit">
          {copy.cta}
        </HeroCtaButton>
      </div>
    </section>
  );
}
