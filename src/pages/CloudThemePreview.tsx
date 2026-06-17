import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LayoutDashboard, Home, Library, Settings } from "lucide-react";
import { CloudBackdrop } from "@/components/CloudBackdrop";
import { CloudAccentPicker } from "@/components/CloudThemePicker";
import { BrandLogo } from "@/components/landing/BrandLogo";
import { useCloudHtmlClass } from "@/hooks/useCloudHtmlClass";
import { ensureCloudThemeStyles } from "@/lib/themeStyles";
import { useCloudAccentStore } from "@/stores/cloudAccentStore";
import { useLocaleStore } from "@/stores/localeStore";
import { useVisualThemeStore } from "@/stores/visualThemeStore";

type AppRoute = "/dashboard" | "/" | "/library" | "/settings";

const GO_ROUTES: Record<string, AppRoute> = {
  dashboard: "/dashboard",
  landing: "/",
  home: "/",
  library: "/library",
  settings: "/settings",
};

/** Active Cloud + choix d’accent, puis ouvre l’app réelle (pas de texte moodboard). */
export default function CloudThemePreviewPage() {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const accent = useCloudAccentStore((s) => s.accent);
  const setTheme = useVisualThemeStore((s) => s.setTheme);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useCloudHtmlClass(true, accent);

  useEffect(() => {
    void ensureCloudThemeStyles();
    setTheme("cloud");
  }, [setTheme]);

  useEffect(() => {
    const go = searchParams.get("go");
    if (!go) return;
    const target = GO_ROUTES[go.toLowerCase()];
    if (target) navigate(target, { replace: true });
  }, [navigate, searchParams]);

  const openApp = (path: AppRoute) => {
    setTheme("cloud");
    navigate(path);
  };

  return (
    <div
      className="pk-cloud-preview pk-cloud-stage pk-prism-stage relative min-h-[100dvh] overflow-x-hidden"
      data-pk-cloud-accent={accent}
    >
      <div className="pk-warm-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <CloudBackdrop />
      </div>

      <div className="relative z-[1] mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-6 py-16">
        <div className="mb-8 flex justify-center">
          <BrandLogo />
        </div>

        <div className="pk-cloud-card text-center">
          <h1 className="pk-cloud-card__title text-2xl">
            {isFr ? "Thème Cloud" : "Cloud theme"}
          </h1>
          <p className="pk-cloud-card__meta mt-2 text-sm leading-relaxed">
            {isFr
              ? "Couleurs et verre du moodboard — contenu et flows ProducerHit inchangés. Choisis un accent puis ouvre l’app."
              : "Moodboard colors and glass — ProducerHit content unchanged. Pick an accent, then open the app."}
          </p>

          <div className="mt-6 flex justify-center">
            <CloudAccentPicker />
          </div>

          <div className="mt-8 grid gap-3">
            <button type="button" className="pk-cloud-btn pk-cloud-btn--accent w-full" onClick={() => openApp("/dashboard")}>
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              {isFr ? "Ouvrir le studio (Dashboard)" : "Open studio (Dashboard)"}
            </button>
            <button type="button" className="pk-cloud-btn w-full" onClick={() => openApp("/")}>
              <Home className="h-4 w-4" aria-hidden />
              {isFr ? "Landing" : "Landing"}
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="pk-cloud-btn pk-cloud-btn--ghost" onClick={() => openApp("/library")}>
                <Library className="h-4 w-4" aria-hidden />
                {isFr ? "Bibliothèque" : "Library"}
              </button>
              <button type="button" className="pk-cloud-btn pk-cloud-btn--ghost" onClick={() => openApp("/settings")}>
                <Settings className="h-4 w-4" aria-hidden />
                {isFr ? "Paramètres" : "Settings"}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-pk-muted">
          {isFr ? "Raccourci direct studio :" : "Direct studio shortcut:"}{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5">/theme-preview/cloud?go=dashboard</code>
        </p>
      </div>
    </div>
  );
}
