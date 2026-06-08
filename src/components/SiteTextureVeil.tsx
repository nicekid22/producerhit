import { SITE_TEXTURE_VEIL } from "@/lib/featureFlags";

/**
 * Voile grain fin — site entier (marketing + dashboard), très léger, z-0 sous le contenu (z-1).
 * Le cozy large reste dans BackdropTextureVeil (mesh uniquement).
 */
export function SiteTextureVeil() {
  if (!SITE_TEXTURE_VEIL) return null;
  return <div className="pk-site-texture-veil pk-site-texture-veil--ambient-global" aria-hidden />;
}
