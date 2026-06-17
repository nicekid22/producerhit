import type { ReactNode } from "react";
import { Cloud, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLOUD_THEME_ENABLED } from "@/lib/featureFlags";
import { CloudAccentElementPicker } from "@/components/CloudAccentElementPicker";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { useLocaleStore } from "@/stores/localeStore";
import {
  nextVisualTheme,
  useVisualThemeStore,
  type VisualTheme,
} from "@/stores/visualThemeStore";
import { LanguagePicker } from "@/components/LanguagePicker";
import { SIDEBAR_ICON_CLASS, SIDEBAR_ICON_PROPS } from "@/lib/sidebarIcons";

type Props = {
  /** nav-icon = cycle direct · sidebar-stack = cycle + accents · mobile = cycle · segmented = panneau settings */
  variant?: "nav-icon" | "sidebar-stack" | "mobile" | "segmented";
  className?: string;
};

function ThemeModeIcon({ theme, className }: { theme: VisualTheme; className?: string }) {
  const iconClass = cn(SIDEBAR_ICON_CLASS, className);
  if (theme === "warm-glass") {
    return <Sun className={cn(iconClass, "pk-theme-cycle-btn__icon--sun")} {...SIDEBAR_ICON_PROPS} aria-hidden />;
  }
  if (theme === "cloud") {
    return <Cloud className={iconClass} {...SIDEBAR_ICON_PROPS} aria-hidden />;
  }
  return <Moon className={cn(iconClass, "pk-theme-cycle-btn__icon--moon")} {...SIDEBAR_ICON_PROPS} aria-hidden />;
}

/** Sur Cloud, le bouton cycle affiche la Lune (→ Prism), pas un 2ᵉ nuage (Air). */
function themeCycleDisplayIcon(current: VisualTheme): VisualTheme {
  if (current === "cloud") return "prism";
  return current;
}

function themeShortLabel(theme: VisualTheme, isFr: boolean): string {
  if (theme === "warm-glass") return isFr ? "Warm (jour)" : "Warm (day)";
  if (theme === "cloud") return "Cloud";
  return isFr ? "Prism (nuit)" : "Prism (night)";
}

/** Prism → Warm → Cloud — clic direct, sans menu */
export function ThemeAndAccentPicker({ variant = "nav-icon", className }: Props) {
  if (!CLOUD_THEME_ENABLED) {
    if (variant === "segmented") {
      return <ThemeToggleButton variant="segmented" className={className} />;
    }
    return <ThemeToggleButton variant="icon" className={className} />;
  }

  if (variant === "sidebar-stack") {
    return <SidebarThemeStack className={className} />;
  }

  if (variant === "segmented") {
    return <SettingsThemeBlock className={className} />;
  }

  return (
    <ThemeCycleButton
      className={className}
      size={variant === "mobile" ? "mobile" : "nav"}
    />
  );
}

function ThemeCycleButton({
  className,
  size = "nav",
}: {
  className?: string;
  size?: "nav" | "mobile";
}) {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const theme = useVisualThemeStore((s) => s.theme);
  const cycleTheme = useVisualThemeStore((s) => s.cycleTheme);
  const next = nextVisualTheme(theme);

  return (
    <button
      type="button"
      className={cn(
        "pk-theme-cycle-btn flex shrink-0 items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/15",
        size === "mobile" && "pk-theme-cycle-btn--mobile h-11 w-11 rounded-xl",
        theme === "warm-glass" && "pk-theme-cycle-btn--warm",
        theme === "cloud" && "pk-theme-cycle-btn--cloud",
        theme === "prism" && "pk-theme-cycle-btn--prism text-white/55 hover:text-white/85",
        className,
      )}
      aria-label={
        isFr
          ? `Thème ${themeShortLabel(theme, true)} — passer à ${themeShortLabel(next, true)}`
          : `Theme ${themeShortLabel(theme, false)} — switch to ${themeShortLabel(next, false)}`
      }
      title={
        isFr
          ? `${themeShortLabel(theme, true)} · clic → ${themeShortLabel(next, true)}`
          : `${themeShortLabel(theme, false)} · click → ${themeShortLabel(next, false)}`
      }
      onClick={() => cycleTheme()}
    >
      <ThemeModeIcon theme={themeCycleDisplayIcon(theme)} />
    </button>
  );
}

function useThemeMenuCopy() {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  return {
    isFr,
    skinLabel: isFr ? "Skin visuel" : "Visual skin",
    moodLabel: isFr ? "Mood · 4 éléments" : "Mood · 4 elements",
  };
}

function ThemeSkinRow() {
  const { isFr, skinLabel } = useThemeMenuCopy();
  const theme = useVisualThemeStore((s) => s.theme);
  const setTheme = useVisualThemeStore((s) => s.setTheme);

  const chips: { id: VisualTheme; label: string; icon: ReactNode }[] = [
    { id: "prism", label: "Prism", icon: <Moon className="h-3.5 w-3.5 text-[var(--prism-cyan)]" strokeWidth={2} aria-hidden /> },
    { id: "warm-glass", label: "Warm", icon: <Sun className="h-3.5 w-3.5 text-[var(--prism-cyan)]" strokeWidth={2} aria-hidden /> },
    { id: "cloud", label: "Cloud", icon: <Cloud className="h-3.5 w-3.5 text-[var(--prism-cyan)]" strokeWidth={2} aria-hidden /> },
  ];

  return (
    <div className="pk-theme-accent-menu__skins">
      <span className="pk-theme-accent-menu__label">{skinLabel}</span>
      <div className="pk-theme-accent-menu__skin-row" role="group" aria-label={skinLabel}>
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={cn("pk-theme-accent-menu__skin", theme === chip.id && "pk-theme-accent-menu__skin--active")}
            aria-pressed={theme === chip.id}
            title={chip.label}
            onClick={() => setTheme(chip.id)}
          >
            {chip.icon}
            <span>{chip.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MoodRow() {
  const { moodLabel } = useThemeMenuCopy();
  return (
    <div className="pk-theme-accent-menu__moods">
      <span className="pk-theme-accent-menu__label">{moodLabel}</span>
      <CloudAccentElementPicker variant="menu" className="pk-theme-accent-menu__picker" />
    </div>
  );
}

function SidebarThemeStack({ className }: { className?: string }) {
  return (
    <div className={cn("pk-sidebar-controls flex flex-col items-center gap-1", className)}>
      <ThemeCycleButton />
      <CloudAccentElementPicker variant="sidebar" />
      <LanguagePicker variant="sidebar" />
    </div>
  );
}

function SettingsThemeBlock({ className }: { className?: string }) {
  return (
    <div className={cn("pk-theme-accent-menu pk-theme-accent-menu--settings flex flex-col gap-4", className)}>
      <ThemeSkinRow />
      <MoodRow />
    </div>
  );
}
