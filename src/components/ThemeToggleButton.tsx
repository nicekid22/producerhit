import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocaleStore } from "@/stores/localeStore";
import { useVisualThemeStore, type VisualTheme } from "@/stores/visualThemeStore";

type Props = {
  /** Sidebar : icône seule. Settings : segmented Prism / Warm */
  variant?: "icon" | "segmented";
  className?: string;
};

function ThemeModeIcon({ theme, className }: { theme: VisualTheme; className?: string }) {
  if (theme === "warm-glass") {
    return <Sun className={cn("h-5 w-5 text-[var(--prism-cyan)]", className)} strokeWidth={2} aria-hidden />;
  }
  return <Moon className={cn("h-5 w-5 text-[var(--prism-cyan)]", className)} strokeWidth={2} aria-hidden />;
}

export function ThemeToggleButton({ variant = "icon", className }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const theme = useVisualThemeStore((s) => s.theme);
  const setTheme = useVisualThemeStore((s) => s.setTheme);
  const toggleTheme = useVisualThemeStore((s) => s.toggleTheme);
  const warm = theme === "warm-glass";

  if (variant === "segmented") {
    return (
      <div className={cn("inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1", className)}>
        <ThemeSegment
          active={theme === "prism"}
          label="Prism"
          hint={isFr ? "Froid · lune cyan violet" : "Cool · moon cyan violet"}
          onClick={() => setTheme("prism")}
          icon={<Moon className="h-3.5 w-3.5 text-[var(--prism-cyan)]" strokeWidth={2} aria-hidden />}
        />
        <ThemeSegment
          active={theme === "warm-glass"}
          label="Warm Glass"
          hint={isFr ? "Chaud · soleil orange rose" : "Warm · sun orange pink"}
          onClick={() => setTheme("warm-glass")}
          icon={<Sun className="h-3.5 w-3.5 text-[var(--prism-cyan)]" strokeWidth={2} aria-hidden />}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-pk transition-colors",
        warm
          ? "bg-white/10 text-white hover:bg-white/14"
          : "text-white/55 hover:bg-white/[0.06] hover:text-white/85",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/15",
        className,
      )}
      aria-label={
        warm
          ? isFr
            ? "Thème Warm Glass (soleil) — passer au thème Prism"
            : "Warm Glass theme (sun) — switch to Prism"
          : isFr
            ? "Thème Prism (lune) — passer au thème Warm Glass"
            : "Prism theme (moon) — switch to Warm Glass"
      }
      title={
        warm
          ? isFr
            ? "Warm Glass · clic → Prism (lune)"
            : "Warm Glass · click → Prism (moon)"
          : isFr
            ? "Prism · clic → Warm Glass (soleil)"
            : "Prism · click → Warm Glass (sun)"
      }
    >
      <ThemeModeIcon theme={theme} className="h-5 w-5" />
    </button>
  );
}

function ThemeSegment({
  active,
  label,
  hint,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  hint: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-w-[7.5rem] flex-col items-center gap-0.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
        active ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" : "text-white/45 hover:text-white/70",
      )}
      aria-pressed={active}
      title={hint}
    >
      <span className="inline-flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </button>
  );
}

export function visualThemeLabel(theme: VisualTheme, isFr: boolean): string {
  if (theme === "warm-glass") return isFr ? "Warm Glass" : "Warm Glass";
  return "Prism";
}
