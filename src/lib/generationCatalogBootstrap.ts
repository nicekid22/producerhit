import { registerGenerationCatalogExtensions } from "@producerhit/shared";
import { buildBeatAmbianceMoodMap } from "@/lib/beatAmbiance";
import { buildBeatInfluenceMap } from "@/lib/beatInfluence";
import {
  extendedGenreAceTagMap,
  extendedGenreBpmMap,
} from "@/lib/genres/extendedCatalog";

let registered = false;

/** Enregistre le catalogue étendu au premier accès générateur (pas au boot). */
export function ensureGenerationCatalogExtensions(): void {
  if (registered) return;
  registered = true;
  registerGenerationCatalogExtensions({
    aceTags: extendedGenreAceTagMap(),
    bpm: extendedGenreBpmMap(),
    moodMap: buildBeatAmbianceMoodMap(),
    influenceMap: buildBeatInfluenceMap(),
  });
}
