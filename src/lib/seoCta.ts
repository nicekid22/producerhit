import type { SeoPageConfig } from "@/lib/seoPages";
import { buildAuthUrl } from "@/lib/authRoutes";
import { buildGrowthUrl } from "@/lib/growthLinks";

/** CTA landing SEO → dashboard (genre pré-sélectionné) ou auth avec `next`. */
export function buildSeoLandingCtaHref(
  seo: SeoPageConfig | null | undefined,
  opts: { user: boolean; pathname: string },
): string {
  const dashParams = new URLSearchParams();
  if (seo?.prefillGenre?.trim()) {
    dashParams.set("genre", seo.prefillGenre.trim());
    dashParams.set("mode", seo.prefillMode ?? "song");
  }
  const dashPath = dashParams.toString() ? `/dashboard?${dashParams}` : "/dashboard";

  if (opts.user) return dashPath;

  const authPath = buildAuthUrl({ next: dashPath });
  const growth = buildGrowthUrl(authPath, "organic", {
    campaign: seo?.slugKey ?? "seo-landing",
    content: opts.pathname.replace(/^\//, ""),
  });
  try {
    const url = new URL(growth);
    return `${url.pathname}${url.search}`;
  } catch {
    return authPath;
  }
}
