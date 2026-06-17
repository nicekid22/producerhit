import { ThemeAndAccentPicker } from "@/components/ThemeAndAccentPicker";
import { LOCALE_SHORT, type AppLocale } from "@/i18n/config";
import { useLocaleStore } from "@/stores/localeStore";
import { cn } from "@/lib/utils";

const MENU_LOCALES = ["fr", "en"] as const satisfies readonly AppLocale[];

type Props = {
  onLocaleChange?: () => void;
};

/** Dernière ligne menu mobile landing — thème + langue (FR/EN), aligné design system. */
export function LandingMobileMenuFooter({ onLocaleChange }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <div className="pk-landing-mobile-nav__footer">
      <ThemeAndAccentPicker variant="nav-icon" surface="header" className="pk-landing-mobile-nav__theme" />
      <div className="pk-landing-mobile-nav__locale" role="group" aria-label="Language">
        {MENU_LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            className={cn("pk-landing-mobile-nav__locale-btn", locale === code && "is-active")}
            aria-pressed={locale === code}
            onClick={() => {
              setLocale(code);
              onLocaleChange?.();
            }}
          >
            {LOCALE_SHORT[code]}
          </button>
        ))}
      </div>
    </div>
  );
}
