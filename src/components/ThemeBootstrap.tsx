import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useWarmGlassHtmlClass } from "@/hooks/useWarmGlassHtmlClass";
import { ensureWarmGlassThemeStyles } from "@/lib/themeStyles";
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
    if (warmGlass) void ensureWarmGlassThemeStyles();
  }, [warmGlass]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    body.dataset.pkTheme = marketing ? "marketing" : "app";
    if (warmGlass) body.dataset.pkWarmGlass = "1";
    else delete body.dataset.pkWarmGlass;

    if (marketing) {
      if (warmGlass) {
        const base = "#963848";
        const bg = [
          "radial-gradient(920px 640px at 12% 58%, rgba(200,152,56,0.28), rgba(200,152,56,0) 58%)",
          "radial-gradient(760px 560px at 88% 52%, rgba(200,80,40,0.22), rgba(200,80,40,0) 55%)",
          "radial-gradient(900px 620px at 50% 96%, rgba(168,56,88,0.18), rgba(168,56,88,0) 58%)",
          "linear-gradient(148deg, #8a6020 0%, #963848 32%, #a84828 62%, #963848 100%)",
        ].join(", ");
        html.style.background = base;
        body.style.background = bg;
      } else {
        const base = "#0c0820";
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
      const base = "#963848";
      const bg = [
        "radial-gradient(920px 640px at 12% 58%, rgba(200,152,56,0.28), rgba(200,152,56,0) 58%)",
        "radial-gradient(760px 560px at 88% 52%, rgba(200,80,40,0.22), rgba(200,80,40,0) 55%)",
        "radial-gradient(900px 620px at 50% 96%, rgba(168,56,88,0.18), rgba(168,56,88,0) 58%)",
        "linear-gradient(148deg, #8a6020 0%, #963848 32%, #a84828 62%, #963848 100%)",
      ].join(", ");
      html.style.background = base;
      body.style.background = bg;
      body.style.backgroundAttachment = "fixed";
      body.style.color = "#fff9f4";
    } else {
      html.style.background = "#0c0820";
      body.style.background = "#0c0820";
      body.style.color = "#f1f0f5";
    }

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      if (warmGlass) {
        themeColorMeta.setAttribute("content", marketing ? "#c89838" : "#963848");
      } else {
        themeColorMeta.setAttribute("content", "#0c0820");
      }
    }

    const faviconSvg = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
    if (faviconSvg) {
      faviconSvg.setAttribute("href", warmGlass ? "/favicon-warm.svg" : "/favicon.svg");
    }

    return () => {
      body.dataset.pkTheme = "";
      delete body.dataset.pkWarmGlass;
      html.style.background = "";
      body.style.background = "";
      body.style.backgroundAttachment = "";
      body.style.color = "";
      if (faviconSvg) faviconSvg.setAttribute("href", "/favicon.svg");
    };
  }, [marketing, warmGlass]);

  return <>{children}</>;
}

