/** Détecte les hooks « scène / prompt » plutôt que des débuts de paroles chantables. */

const META_PREFIX_RE =
  /^(une chanson sur|un morceau sur|chanson sur|song about|a song about|canción sobre|música sobre|lied über|canzone su|关于)/i;

const NARRATIVE_SCENE_RE =
  /\b(trouvé(?:e|s)? dans|apporte(?:nt)?|t'offre|te dit de|retour en rayon|vient d'être|te laisse partir|repassé par|livré un jour|contrôle passeport|soldes sur|insertion fluide|caisse fluide|fiche de paie|colis livré|group chat|video call|visio surprise|parking spot|free upgrade|neighbor brought|boss said|team let you|boss te dit|voisin apporte|surclassement gratuit|place de parking|album photo retrouvé|première recette et c'est)\b/i;

/** Hooks trop longs ou trop descriptifs pour une première ligne chantée. */
export function isSingableLyricHook(hook: string): boolean {
  const h = hook.trim();
  if (h.length < 6 || h.length > 64) return false;
  if (META_PREFIX_RE.test(h)) return false;
  if (NARRATIVE_SCENE_RE.test(h)) return false;
  if ((h.match(/,/g) ?? []).length > 1) return false;
  const words = h.split(/\s+/).filter(Boolean);
  if (words.length > 11) return false;
  return true;
}
