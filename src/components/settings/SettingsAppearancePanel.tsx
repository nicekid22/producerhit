import { Cloud, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLOUD_THEME_ENABLED } from "@/lib/featureFlags";
import { CloudAccentElementPicker } from "@/components/CloudAccentElementPicker";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { useLocaleStore } from "@/stores/localeStore";
import { useVisualThemeStore, type VisualTheme } from "@/stores/visualThemeStore";

/**
 * Simplified appearance selector — replaces CloudThemeSettingsBlock in the Profile tab.
 * 3 theme chips (Prism / Warm / Cloud). Accent picker only when Cloud is active.
 */
export function SettingsAppearancePanel() {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const theme = useVisualThemeStore((s) => s.theme);
  const setTheme = useVisualThemeStore((s) => s.setTheme);

  if (!CLOUD_THEME_ENABLED) {
    return (
      <div className="mt-4 flex justify-end sm:justify-end">
        <ThemeToggleButton variant="segmented" />
      </div>
    );
  }

  const chips: { id: VisualTheme; label: string; icon: React.ReactNode }[] = [
    {
      id: "prism",
      label: "Prism",
      icon: <Moon className="h-3.5 w-3.5 text-[var(--prism-cyan)]" aria-hidden />,
    },
    {
      id: "warm-glass",
      label: "WarmGlass",
      icon: <Sun className="h-3.5 w-3.5 text-[var(--prism-cyan)]" aria-hidden />,
    },
    {
      id: "cloud",
      label: "Cloud",
      icon: <Cloud className="h-3.5 w-3.5 text-[var(--prism-cyan)]" aria-hidden />,
    },
  ];

  return (
    <div className="mt-3 flex flex-col gap-3">
      <p className="text-xs text-pk-muted">
        {isFr ? "Choisis ton thème visuel" : "Pick your visual theme"}
      </p>
      <div className="inline-flex flex-wrap gap-1 rounded-full border border-pk-border bg-pk-panel/40 p-1">
        {chips.map((chip) => {
          const active = theme === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setTheme(chip.id)}
              className={cn(
                "inline-flex min-w-[5.5rem] items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                active
                  ? "bg-pk-accent/15 text-pk-text shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                  : "text-pk-muted hover:text-pk-text",
              )}
              aria-pressed={active}
            >
              {chip.icon}
              {chip.label}
            </button>
          );
        })}
      </div>
      {theme === "cloud" ? <CloudAccentElementPicker variant="settings" /> : null}
    </div>
  );
}
