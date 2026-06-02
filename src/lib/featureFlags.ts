/** Mobile Dashboard v2 — actif par défaut. Désactiver avec VITE_MOBILE_DASHBOARD_V2=0 */
export const MOBILE_DASHBOARD_V2 = import.meta.env.VITE_MOBILE_DASHBOARD_V2 !== "0";

/** Pinterest discovery — log console des termes classés. Rollback : 0 ou retirer. Voir PINTEREST_DISCOVERY_ROLLBACK.md */
export const PINTEREST_DISCOVERY_PREVIEW =
  import.meta.env.VITE_PINTEREST_DISCOVERY_PREVIEW === "1";

/**
 * Landing — 2 cartes latérales : images Pinterest (pas Pollinations).
 * Rollback : VITE_LANDING_PINTEREST_COVERS=0
 */
export const LANDING_PINTEREST_COVERS =
  import.meta.env.VITE_LANDING_PINTEREST_COVERS === "1";

/** Mots-clés recherche Pinterest (ex. streetwear,girl). */
export const LANDING_PINTEREST_SEARCH_TAGS = (
  import.meta.env.VITE_LANDING_PINTEREST_SEARCH_TAGS ?? "streetwear,girl"
)
  .split(",")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

/**
 * Flux /community — cover Pinterest en premier plan (test visuel).
 * Rollback : VITE_COMMUNITY_PINTEREST_FOREGROUND=0
 */
export const COMMUNITY_PINTEREST_FOREGROUND =
  import.meta.env.VITE_COMMUNITY_PINTEREST_FOREGROUND === "1";
