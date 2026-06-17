/** Mobile Dashboard v2 — actif par défaut. Désactiver avec VITE_MOBILE_DASHBOARD_V2=0 */
export const MOBILE_DASHBOARD_V2 = import.meta.env.VITE_MOBILE_DASHBOARD_V2 !== "0";

/** Landing mobile épurée (générateur centré, moins de texte). Rollback : VITE_LANDING_MOBILE_V2=0 */
export const LANDING_MOBILE_V2 = import.meta.env.VITE_LANDING_MOBILE_V2 !== "0";

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

/**
 * Covers Pinterest → Supabase Storage (1 Edge / carte, dédup 7j).
 * Actif par défaut. Rollback : VITE_PINTEREST_PERSIST_COVERS=0
 */
export const PINTEREST_PERSIST_COVERS = import.meta.env.VITE_PINTEREST_PERSIST_COVERS !== "0";

/** Affichage photo unifié : toujours l’URL persistée en DB (même image partout pour une carte). */
export const UNIFIED_STORED_COVERS = PINTEREST_PERSIST_COVERS;

/**
 * Backfill Pinterest au chargement du workspace (anciens morceaux sans cover).
 * Désactivé par défaut — évite re-fetch et doublons. Activer : VITE_PINTEREST_BACKFILL=1
 */
export const PINTEREST_BACKFILL_ENABLED = import.meta.env.VITE_PINTEREST_BACKFILL === "1";

/**
 * Fallback pinimg en DB si persist-pinterest-cover échoue (pas Storage).
 * Désactivé par défaut — préférer Storage uniquement. Activer : VITE_PINTEREST_PINIMG_FALLBACK=1
 */
/** pinimg en DB si persist-pinterest-cover échoue. Désactiver : VITE_PINTEREST_PINIMG_FALLBACK=0 */
export const PINTEREST_PINIMG_FALLBACK = import.meta.env.VITE_PINTEREST_PINIMG_FALLBACK !== "0";

/**
 * App shell — thème chaud opt-in par défaut au premier visit si =1.
 * Le switch runtime est dans la sidebar / paramètres (localStorage).
 * Rollback : VITE_WARM_GLASS_THEME=0 — voir WARM_GLASS_THEME_ROLLBACK.md
 */
export const WARM_GLASS_THEME_DEFAULT = import.meta.env.VITE_WARM_GLASS_THEME === "1";

/**
 * Thème Cloud — actif en dev par défaut ; prod : VITE_CLOUD_THEME=1.
 * Désactiver partout : VITE_CLOUD_THEME=0 — voir CLOUD_THEME_ROLLBACK.md
 */
export const CLOUD_THEME_ENABLED =
  import.meta.env.VITE_CLOUD_THEME === "0"
    ? false
    : import.meta.env.DEV || import.meta.env.VITE_CLOUD_THEME === "1";

/**
 * Dashboard — import voix + picker « Voix chantée » (WIP).
 * Réactiver : VITE_DASHBOARD_VOICE_SECTIONS=1
 */
export const DASHBOARD_VOICE_SECTIONS_ENABLED = import.meta.env.VITE_DASHBOARD_VOICE_SECTIONS === "1";

/**
 * Voile PNG feutre — site entier (Prism + Warm Glass, mobile + desktop).
 * Rollback : VITE_SITE_TEXTURE_VEIL=0 — voir SITE_TEXTURE_VEIL.md
 */
export const SITE_TEXTURE_VEIL = import.meta.env.VITE_SITE_TEXTURE_VEIL !== "0";
