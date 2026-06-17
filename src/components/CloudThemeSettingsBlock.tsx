import { useState } from "react";
import { Link } from "react-router-dom";
import { Cloud, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLOUD_THEME_ENABLED } from "@/lib/featureFlags";
import { isCloudContrastDebugEnabled, setCloudContrastDebug } from "@/lib/cloudContrastDebug";
import { CloudAccentElementPicker } from "@/components/CloudAccentElementPicker";
import { useLocaleStore } from "@/stores/localeStore";
import { useVisualThemeStore, type VisualTheme } from "@/stores/visualThemeStore";

export function CloudThemeSettingsBlock() {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const theme = useVisualThemeStore((s) => s.theme);
  const setTheme = useVisualThemeStore((s) => s.setTheme);

  if (!CLOUD_THEME_ENABLED) return null;

  return (
    <div className="pk-cloud-settings-block mt-4 flex flex-col gap-4 border-t border-pk-border/60 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-pk-muted">
          {theme === "cloud"
            ? isFr
              ? "Cloud actif — fond photo, verre dépoli, 4 accents."
              : "Cloud active — photo backdrop, frosted glass, 4 accents."
            : isFr
              ? "Skin visuel Cloud — même app, nouvelles couleurs."
              : "Cloud visual skin — same app, new colors."}
        </p>
        <Link
          to="/theme-preview/cloud?go=dashboard"
          className="pk-accent-link text-xs font-semibold"
        >
          {isFr ? "Tester Cloud dans le studio →" : "Try Cloud in studio →"}
        </Link>
      </div>

      <div className="inline-flex flex-wrap gap-1 rounded-full border border-pk-border bg-pk-panel/40 p-1">
        <ThemeChip
          active={theme === "prism"}
          label="Prism"
          icon={<Moon className="h-3.5 w-3.5 text-[var(--prism-cyan)]" aria-hidden />}
          onClick={() => setTheme("prism")}
        />
        <ThemeChip
          active={theme === "warm-glass"}
          label="Warm Glass"
          icon={<Sun className="h-3.5 w-3.5 text-[var(--prism-cyan)]" aria-hidden />}
          onClick={() => setTheme("warm-glass")}
        />
        <ThemeChip
          active={theme === "cloud"}
          label="Cloud"
          icon={<Cloud className="h-3.5 w-3.5 text-[var(--prism-cyan)]" aria-hidden />}
          onClick={() => setTheme("cloud")}
        />
      </div>

      {theme === "cloud" ? <CloudContrastAuditToggle isFr={isFr} /> : null}
      <CloudAccentElementPicker variant="settings" />
    </div>
  );
}

function CloudContrastAuditToggle({ isFr }: { isFr: boolean }) {
  const [contrastDebug, setContrastDebugState] = useState(() => isCloudContrastDebugEnabled());

  const toggle = () => {
    const next = !contrastDebug;
    setContrastDebugState(next);
    setCloudContrastDebug(next);
  };

  return (
    <div className="pk-cloud-contrast-audit flex flex-col gap-2 rounded-xl border border-pk-border bg-pk-panel/40 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold text-pk-text">{isFr ? "Audit contraste" : "Contrast audit"}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-pk-muted">
          {isFr
            ? "Surligne en rouge le texte trop clair sur verre. Aussi : ?cloudContrast=1"
            : "Highlights text that's too light on glass. Also: ?cloudContrast=1"}
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "pk-cloud-contrast-audit__toggle shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
          contrastDebug
            ? "bg-red-500/20 text-red-700 ring-1 ring-red-400/40"
            : "bg-pk-panel text-pk-muted hover:bg-pk-panel/80 hover:text-pk-text",
        )}
        aria-pressed={contrastDebug}
      >
        {contrastDebug ? (isFr ? "Audit ON" : "Audit ON") : isFr ? "Activer" : "Enable"}
      </button>
    </div>
  );
}

function ThemeChip({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "pk-cloud-theme-chip inline-flex min-w-[6.5rem] items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
        active ? "bg-pk-accent/15 text-pk-text shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" : "text-pk-muted hover:text-pk-text",
      )}
      aria-pressed={active}
    >
      {icon}
      {label}
    </button>
  );
}

export function visualThemeDescription(theme: VisualTheme, isFr: boolean): string {
  if (theme === "warm-glass") {
    return isFr ? "Warm Glass — or, rose, liquid glass." : "Warm Glass — gold, pink, liquid glass.";
  }
  if (theme === "cloud") {
    return isFr ? "Cloud — verre Apple, 4 accents." : "Cloud — Apple glass, 4 accents.";
  }
  return isFr ? "Prism — cyan, violet, chrome." : "Prism — cyan, violet, chrome.";
}
