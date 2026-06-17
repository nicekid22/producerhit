import { ElementIcon } from "@/components/icons/ElementIcons";
import { CLOUD_THEME_ENABLED } from "@/lib/featureFlags";
import { cn } from "@/lib/utils";
import {
  CLOUD_ACCENT_OPTIONS,
  useCloudAccentStore,
  type CloudAccent,
} from "@/stores/cloudAccentStore";
import { useLocaleStore } from "@/stores/localeStore";
import { useVisualThemeStore } from "@/stores/visualThemeStore";
import { SIDEBAR_ICON_PROPS } from "@/lib/sidebarIcons";

type Props = {
  /** settings = grille + labels · menu = icônes seules (panneau thème) · sidebar · mobile */
  variant?: "settings" | "menu" | "sidebar" | "mobile";
  className?: string;
  onAccentPick?: () => void;
};

function pickAccent(accent: CloudAccent, setAccent: (a: CloudAccent) => void, ensureCloud: () => void) {
  ensureCloud();
  setAccent(accent);
}

/** 4 moods Cloud — Air · Terre · Feu · Eau (remplace soleil/lune en sidebar) */
export function CloudAccentElementPicker({ variant = "settings", className, onAccentPick }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const accent = useCloudAccentStore((s) => s.accent);
  const setAccent = useCloudAccentStore((s) => s.setAccent);
  const theme = useVisualThemeStore((s) => s.theme);
  const setTheme = useVisualThemeStore((s) => s.setTheme);

  if (!CLOUD_THEME_ENABLED) return null;

  const ensureCloud = () => {
    if (theme !== "cloud") setTheme("cloud");
  };

  const onPick = (id: CloudAccent) => {
    pickAccent(id, setAccent, ensureCloud);
    onAccentPick?.();
  };

  if (variant === "sidebar") {
    return (
      <div
        className={cn("pk-cloud-accent-elements pk-cloud-accent-elements--sidebar flex flex-col gap-1", className)}
        role="group"
        aria-label={isFr ? "Mood Cloud — 4 éléments" : "Cloud mood — 4 elements"}
      >
        {CLOUD_ACCENT_OPTIONS.map((opt) => (
          <AccentElementButton
            key={opt.id}
            opt={opt}
            isFr={isFr}
            active={accent === opt.id}
            size="nav"
            onClick={() => onPick(opt.id)}
          />
        ))}
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div
        className={cn("pk-cloud-accent-elements pk-cloud-accent-elements--mobile flex gap-0.5", className)}
        role="group"
        aria-label={isFr ? "Mood Cloud" : "Cloud mood"}
      >
        {CLOUD_ACCENT_OPTIONS.map((opt) => (
          <AccentElementButton
            key={opt.id}
            opt={opt}
            isFr={isFr}
            active={accent === opt.id}
            size="compact"
            onClick={() => onPick(opt.id)}
          />
        ))}
      </div>
    );
  }

  if (variant === "menu") {
    return (
      <div
        className={cn("pk-cloud-accent-elements pk-cloud-accent-elements--menu", className)}
        role="group"
        aria-label={isFr ? "Mood · 4 éléments" : "Mood · 4 elements"}
      >
        <div className="pk-cloud-accent-elements__grid">
          {CLOUD_ACCENT_OPTIONS.map((opt) => (
            <AccentElementButton
              key={opt.id}
              opt={opt}
              isFr={isFr}
              active={accent === opt.id}
              size="menu"
              onClick={() => onPick(opt.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("pk-cloud-accent-elements pk-cloud-accent-elements--settings flex flex-col gap-2", className)}>
      <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-pk-muted">
        {isFr ? "Mood Cloud · 4 éléments" : "Cloud mood · 4 elements"}
      </span>
      <div className="pk-cloud-accent-elements__grid">
        {CLOUD_ACCENT_OPTIONS.map((opt) => (
          <AccentElementButton
            key={opt.id}
            opt={opt}
            isFr={isFr}
            active={accent === opt.id}
            size="settings"
            onClick={() => onPick(opt.id)}
          />
        ))}
      </div>
    </div>
  );
}

function AccentElementButton({
  opt,
  isFr,
  active,
  size,
  onClick,
}: {
  opt: (typeof CLOUD_ACCENT_OPTIONS)[number];
  isFr: boolean;
  active: boolean;
  size: "nav" | "compact" | "settings" | "menu";
  onClick: () => void;
}) {
  const title = isFr ? `${opt.labelFr} — ${opt.moodFr}` : `${opt.labelEn} — ${opt.moodEn}`;

  return (
    <button
      type="button"
      className={cn(
        "pk-cloud-accent-element",
        `pk-cloud-accent-element--${opt.id}`,
        `pk-cloud-accent-element--${size}`,
        active && "pk-cloud-accent-element--active",
      )}
      aria-pressed={active}
      aria-label={title}
      title={title}
      onClick={onClick}
    >
      <ElementIcon kind={opt.element} className="pk-cloud-accent-element__icon" {...SIDEBAR_ICON_PROPS} />
      {size === "settings" ? (
        <span className="pk-cloud-accent-element__label">{isFr ? opt.labelFr : opt.labelEn}</span>
      ) : null}
    </button>
  );
}
