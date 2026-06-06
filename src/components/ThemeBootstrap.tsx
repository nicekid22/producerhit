import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useWarmGlassHtmlClass } from "@/hooks/useWarmGlassHtmlClass";
import { useVisualThemeStore, isWarmGlassTheme } from "@/stores/visualThemeStore";

function isAppRoute(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/library") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin")
  );
}

/** Toutes les routes publiques (hors studio) — fond marketing + warm glass. */
function isMarketingPath(pathname: string) {
  return !isAppRoute(pathname);
}

export function ThemeBootstrap({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const marketing = isMarketingPath(location.pathname);
  const warmGlass = isWarmGlassTheme(useVisualThemeStore((s) => s.theme));

  useWarmGlassHtmlClass(warmGlass);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    body.dataset.pkTheme = marketing ? "marketing" : "app";
    if (warmGlass) body.dataset.pkWarmGlass = "1";
    else delete body.dataset.pkWarmGlass;

    if (marketing) {
      if (warmGlass) {
        const base = "#7a3018";
        const bg = [
          "radial-gradient(920px 640px at 12% 58%, rgba(200,120,40,0.22), rgba(200,120,40,0) 58%)",
          "radial-gradient(760px 560px at 88% 52%, rgba(180,60,80,0.18), rgba(180,60,80,0) 55%)",
          "radial-gradient(900px 620px at 50% 96%, rgba(220,90,45,0.14), rgba(220,90,45,0) 58%)",
          base,
        ].join(", ");
        html.style.background = base;
        body.style.background = bg;
      } else {
        const base = "#0a0a0f";
        const bg = [
          "radial-gradient(920px 640px at 12% 58%, rgba(124,58,237,0.2), rgba(124,58,237,0) 58%)",
          "radial-gradient(760px 560px at 88% 52%, rgba(56,189,248,0.14), rgba(56,189,248,0) 55%)",
          "radial-gradient(900px 620px at 50% 96%, rgba(236,72,153,0.12), rgba(236,72,153,0) 58%)",
          base,
        ].join(", ");
        html.style.background = base;
        body.style.background = bg;
      }
      body.style.backgroundAttachment = "fixed";
      body.style.color = "#fff9f4";
    } else if (warmGlass) {
      const base = "#5c2818";
      const bg = [
        "radial-gradient(ellipse 86% 70% at 8% 34%, rgba(200,152,56,0.42), transparent 58%)",
        "radial-gradient(ellipse 74% 68% at 50% 70%, rgba(168,56,88,0.34), transparent 60%)",
        "radial-gradient(ellipse 68% 60% at 92% 26%, rgba(200,80,40,0.38), transparent 54%)",
        "linear-gradient(148deg, #8a6020 0%, #963848 32%, #a84828 62%, #7a3018 100%)",
      ].join(", ");
      html.style.background = base;
      body.style.background = bg;
      body.style.backgroundAttachment = "fixed";
      body.style.color = "#fff9f4";
    } else {
      html.style.background = "#0a0a0f";
      body.style.background = "#0a0a0f";
      body.style.color = "#f1f0f5";
    }

    return () => {
      body.dataset.pkTheme = "";
      delete body.dataset.pkWarmGlass;
      html.style.background = "";
      body.style.background = "";
      body.style.backgroundAttachment = "";
      body.style.color = "";
    };
  }, [marketing, warmGlass]);

  return <>{children}</>;
}

