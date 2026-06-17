import { ArrowUp, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLOUD_THEME_ENABLED } from "@/lib/featureFlags";
import { CloudAccentElementPicker } from "@/components/CloudAccentElementPicker";
import {
  CLOUD_ACCENT_OPTIONS,
  useCloudAccentStore,
  type CloudAccent,
} from "@/stores/cloudAccentStore";
import { useLocaleStore } from "@/stores/localeStore";
import { useVisualThemeStore } from "@/stores/visualThemeStore";

type Props = {
  /** Preview : force le thème cloud. Settings : respecte le thème actuel. */
  forceCloud?: boolean;
  showThemeToggle?: boolean;
  className?: string;
};

/** @deprecated Utiliser CloudAccentElementPicker — conservé pour compat preview */
export function CloudAccentPicker({ className }: { className?: string }) {
  return <CloudAccentElementPicker variant="settings" className={className} />;
}

export function CloudThemePicker({ forceCloud = false, showThemeToggle = true, className }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const theme = useVisualThemeStore((s) => s.theme);
  const setTheme = useVisualThemeStore((s) => s.setTheme);
  const cloudActive = forceCloud || theme === "cloud";

  if (!CLOUD_THEME_ENABLED && !forceCloud) return null;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {showThemeToggle ? (
        <button
          type="button"
          onClick={() => setTheme(cloudActive ? "prism" : "cloud")}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
            cloudActive
              ? "border-white/20 bg-white/10 text-white"
              : "border-white/10 bg-white/[0.04] text-white/55 hover:text-white/80",
          )}
        >
          <Cloud className="h-3.5 w-3.5" aria-hidden />
          {cloudActive
            ? isFr
              ? "Cloud actif — revenir à Prism"
              : "Cloud active — back to Prism"
            : isFr
              ? "Activer Cloud"
              : "Enable Cloud"}
        </button>
      ) : null}
      <CloudAccentPicker />
    </div>
  );
}

export function CloudInputBar({
  placeholder,
  className,
  onSubmit,
}: {
  placeholder: string;
  className?: string;
  onSubmit?: () => void;
}) {
  return (
    <div className={cn("pk-cloud-input-bar", className)}>
      <input type="text" className="pk-cloud-input-bar__field" placeholder={placeholder} readOnly />
      <button type="button" className="pk-cloud-input-bar__action" aria-label="Submit" onClick={onSubmit}>
        <ArrowUp className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  );
}

export function cloudAccentLabel(accent: CloudAccent, isFr: boolean): string {
  const opt = CLOUD_ACCENT_OPTIONS.find((o) => o.id === accent);
  if (!opt) return accent;
  return isFr ? opt.labelFr : opt.labelEn;
}
