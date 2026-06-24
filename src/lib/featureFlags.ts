/** Mobile Dashboard v2 — actif par défaut. Désactiver avec VITE_MOBILE_DASHBOARD_V2=0 */
export const MOBILE_DASHBOARD_V2 = import.meta.env.VITE_MOBILE_DASHBOARD_V2 !== "0";

/** Landing mobile épurée (générateur centré, moins de texte). Rollback : VITE_LANDING_MOBILE_V2=0 */
export const LANDING_MOBILE_V2 = import.meta.env.VITE_LANDING_MOBILE_V2 !== "0";

/**
 * Covers cartes — Pollinations → Supabase Storage (défaut, seule source active).
 * Rollback historique Pinterest retiré côté client.
 */
export const USE_POLLINATIONS_CARD_COVERS = true;

/** Affichage photo unifié : toujours l’URL persistée en DB (même image partout pour une carte). */
export const UNIFIED_STORED_COVERS = true;

/**
 * Backfill covers manquantes au chargement workspace (anciens morceaux).
 * Désactivé par défaut — activer : VITE_LOOP_COVER_BACKFILL=1
 */
export const LOOP_COVER_BACKFILL_ENABLED = import.meta.env.VITE_LOOP_COVER_BACKFILL === "1";

/**
 * App shell — thème chaud opt-in par défaut au premier visit si =1.
 * Le switch runtime est dans la sidebar / paramètres (localStorage).
 * Rollback : VITE_WARM_GLASS_THEME=0 — voir WARM_GLASS_THEME_ROLLBACK.md
 */
export const WARM_GLASS_THEME_DEFAULT = import.meta.env.VITE_WARM_GLASS_THEME === "1";

/**
 * Thème Cloud — actif par défaut (prod + dev). Rollback : VITE_CLOUD_THEME=0
 * Ancien gate prod-only : VITE_CLOUD_THEME=1 — voir CLOUD_THEME_ROLLBACK.md
 */
export const CLOUD_THEME_ENABLED = import.meta.env.VITE_CLOUD_THEME !== "0";

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
