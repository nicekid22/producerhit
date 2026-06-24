import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  deferUntilIdle,
  loadCommunityCss,
  loadDashboardCss,
  loadDistributionCss,
  loadLibraryCss,
  loadMarketingCss,
  loadSharedUiCss,
} from "@/lib/perf/defer";

type RouteCssKind =
  | "marketing"
  | "dashboard"
  | "library"
  | "community"
  | "distribution"
  | "shared"
  | null;

function routeCssKind(pathname: string): RouteCssKind {
  if (
    pathname === "/" ||
    pathname.startsWith("/blog") ||
    pathname === "/pricing" ||
    pathname === "/legal" ||
    pathname.startsWith("/learn/") ||
    pathname.startsWith("/fr/apprendre/") ||
    pathname.startsWith("/ai-") ||
    pathname.startsWith("/fr/generateur-")
  ) {
    return "marketing";
  }
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/voice-studio") ||
    pathname.startsWith("/sample-lab")
  ) {
    return "dashboard";
  }
  if (pathname.startsWith("/library")) return "library";
  if (
    pathname.startsWith("/community") ||
    pathname.startsWith("/explore") ||
    pathname.startsWith("/trending") ||
    pathname.startsWith("/loop/")
  ) {
    return "community";
  }
  if (pathname.startsWith("/distribution") || pathname.startsWith("/academy/distribution")) {
    return "distribution";
  }
  if (pathname.startsWith("/auth") || pathname.startsWith("/settings")) return "shared";
  return null;
}

/** Charge les feuilles CSS non critiques après le first paint (LCP). */
export function RouteStylesBootstrap() {
  const { pathname } = useLocation();

  useEffect(() => {
    const kind = routeCssKind(pathname);
    deferUntilIdle(() => {
      void loadSharedUiCss();
      if (kind === "marketing") void loadMarketingCss();
      if (kind === "dashboard") void loadDashboardCss();
      if (kind === "library") void loadLibraryCss();
      if (kind === "community") void loadCommunityCss();
      if (kind === "distribution") void loadDistributionCss();
    });
  }, [pathname]);

  return null;
}
