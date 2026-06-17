import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useCloudHtmlClass } from "@/hooks/useCloudHtmlClass";
import { useWarmGlassHtmlClass } from "@/hooks/useWarmGlassHtmlClass";
import { ensureCloudThemeStyles, ensureWarmGlassThemeStyles } from "@/lib/themeStyles";
import { applyCloudContrastDebugClass } from "@/lib/cloudContrastDebug";
import { applyBrandChrome, resetBrandChrome } from "@/lib/brandChrome";
import { CloudElementTransition } from "@/components/cloud/CloudElementTransition";
import { LandingMoodWowHost } from "@/components/landing/LandingMoodWow";
import { ThemeRoastPopup } from "@/components/theme/ThemeRoastPopup";
import { useCloudAccentStore } from "@/stores/cloudAccentStore";
import { useVisualThemeStore, isCloudTheme, isWarmGlassTheme } from "@/stores/visualThemeStore";

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
  const visualTheme = useVisualThemeStore((s) => s.theme);
  const cloudAccent = useCloudAccentStore((s) => s.accent);
  const warmGlass = isWarmGlassTheme(visualTheme);
  const cloud = isCloudTheme(visualTheme);

  useWarmGlassHtmlClass(warmGlass);
  useCloudHtmlClass(cloud, cloudAccent);

  useEffect(() => {
    if (warmGlass) void ensureWarmGlassThemeStyles();
  }, [warmGlass]);

  useEffect(() => {
    if (cloud) void ensureCloudThemeStyles();
  }, [cloud]);

  useEffect(() => {
    applyCloudContrastDebugClass();
  }, [location.search]);

  useEffect(() => {
    if (!cloud) {
      document.documentElement.classList.remove("pk-cloud-contrast-debug");
      return;
    }
    applyCloudContrastDebugClass();
  }, [cloud]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    body.dataset.pkTheme = marketing ? "marketing" : "app";
    if (warmGlass) body.dataset.pkWarmGlass = "1";
    else delete body.dataset.pkWarmGlass;
    if (cloud) body.dataset.pkCloud = "1";
    else delete body.dataset.pkCloud;

    if (marketing) {
      if (cloud) {
        html.style.background = "transparent";
        body.style.background = "transparent";
        body.style.color = "var(--cloud-text, rgba(248, 252, 255, 0.92))";
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
      body.style.color = cloud ? "var(--cloud-text, rgba(248, 252, 255, 0.92))" : "#fff9f4";
    } else if (cloud) {
      html.style.background = "transparent";
      body.style.background = "transparent";
      body.style.backgroundAttachment = "fixed";
      body.style.color = "var(--cloud-text, rgba(248, 252, 255, 0.92))";
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

    applyBrandChrome({ cloud, warmGlass, cloudAccent, marketing });

    return () => {
      body.dataset.pkTheme = "";
      delete body.dataset.pkWarmGlass;
      delete body.dataset.pkCloud;
      html.style.background = "";
      body.style.background = "";
      body.style.backgroundAttachment = "";
      body.style.color = "";
      resetBrandChrome();
    };
  }, [marketing, warmGlass, cloud, cloudAccent]);

  return (
    <>
      <CloudElementTransition />
      <ThemeRoastPopup />
      <LandingMoodWowHost />
      {children}
    </>
  );
}

