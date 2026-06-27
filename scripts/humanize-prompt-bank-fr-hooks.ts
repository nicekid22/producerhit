/**
 * Corrige les accroches FR good_vibes (v3 + v4) — français naturel, sans anglicismes.
 * Regénère display + paroles chantables.
 *
 * Usage: npx tsx scripts/humanize-prompt-bank-fr-hooks.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSingableLyricsFromBankEntry } from "../packages/shared/src/prompt/promptBank/buildBankLyrics";
import type { PromptBankEntry } from "../packages/shared/src/prompt/promptBank/types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** id → nouvelle accroche (partie avant « — genre, bpm ») */
const FR_HOOK_BY_ID: Record<number, string> = {
  // v3 (2051–2100)
  2054: "Fête surprise alors qu'ils pensaient être oubliés",
  2057: "Trajet en bagnole, vitres ouvertes, playlist au hasard",
  2058: "Promotion obtenue — on appelle toute l'équipe",
  2060: "Journée plage — sable, crème solaire, zéro boulot en tête",
  2061: "Badge bleu enfin sur l'appli où tu bosses depuis des années",
  2062: "Dîner en famille — examen réussi, fierté dans l'assiette",
  2063: "Rendez-vous à la patinoire — néons, boule disco, téléphones rangés",
  2064: "Coucher de soleil au festival — foule qui saute, bras tendus",
  2065: "Apéro de quartier — grillades, enceintes sur le perron",
  2076: "Playlist de route — fausses paroles hurlées à fond",
  2078: "Scène ouverte — mieux que prévu, salle debout",
  2080: "Premier jour au boulot de rêve — photo du badge, grand sourire",
  2081: "Fête à la piscine — bombes, crème solaire, fous rires",
  2084: "Projet bouclé — champagne dans le groupe WhatsApp",
  2085: "Skatepark avec la bande — nouvelle figure validée du premier coup",
  2087: "Week-end hôtel sans quitter la ville — peignoir, room service, zéro culpabilité",
  // v4 (2207–2312)
  2216: "Le groupe WhatsApp t'anime sans prévenir",
  2218: "Ton mème repartagé par quelqu'un que tu admires",
  2219: "Le café t'offre un gâteau parce que t'es client régulier",
  2220: "La playlist tombe deux fois sur la chanson parfaite",
  2221: "Tes enfants t'ont dessiné en super-héros sur le frigo",
  2230: "Record perso en salle alors que tu voulais faire la grasse mat'",
  2239: "Visio surprise avec des proches à l'autre bout du monde",
  2247: "Celle qui te plaît a réagi à ta story en deux minutes",
  2264: "Flash mob dans la rue — tu te joins à la danse",
  2271: "Partie de beach-volley avec des inconnus devenus potes",
  2275: "Scène ouverte — le présentateur te rappelle pour une bis",
  2277: "Paddle au coucher du soleil, dauphins pas loin",
  2283: "Premier rendez-vous — il ou elle rit de ton pire jeu de mots",
  2292: "Contrôle passeport sans stress — mode vacances activé",
  2294: "Le coach te dit que tu progresses",
  2298: "Le podcasteur répond gentiment à ton message privé",
  2303: "Nouveau collègue — même énergie que toi",
  2308: "Fleurs surprise sur ton bureau",
  2312: "L'équipe se qualifie pour les phases finales",
  2317: "Cent jours de méditation d'affilée",
  2325: "Trouvaille en brocante revendue trois fois le prix payé",
  2339: "Soirée quiz remportée d'un seul point",
  2349: "Photos à l'heure dorée sans filtre",
  2354: "Ta recommandation devient l'obsession de quelqu'un",
  2364: "Ton idée retenue en réunion créative",
  2372: "Premier bonhomme de neige adulte — pourquoi pas",
};

function parseDisplay(display: string): { hook: string; genre: string; bpm: number } | null {
  const m = display.match(/^(.+?) — (.+?), (\d+) bpm$/);
  if (!m) return null;
  return { hook: m[1]!.trim(), genre: m[2]!.trim(), bpm: Number(m[3]) };
}

function rebuildDisplay(hook: string, genre: string, bpm: number): string {
  return `${hook} — ${genre}, ${bpm} bpm`;
}

function patchFile(relPath: string): number {
  const filePath = path.join(root, relPath);
  const entries = JSON.parse(fs.readFileSync(filePath, "utf8")) as PromptBankEntry[];
  let patched = 0;
  for (const entry of entries) {
    if (entry.lang !== "fr") continue;
    const newHook = FR_HOOK_BY_ID[entry.id];
    if (!newHook) continue;
    const parsed = parseDisplay(entry.display);
    if (!parsed) continue;
    entry.display = rebuildDisplay(newHook, parsed.genre, parsed.bpm);
    entry.acestep.lyrics_structure = buildSingableLyricsFromBankEntry({
      display: entry.display,
      lyrics_structure: "",
      lang: "fr",
      theme: entry.theme,
      id: entry.id,
    });
    patched += 1;
  }
  fs.writeFileSync(filePath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  console.log(`Patched ${patched} FR hooks in ${relPath}`);
  return patched;
}

const total = patchFile("packages/shared/data/prompt-bank/v3.json") + patchFile("packages/shared/data/prompt-bank/v4.json");
console.log(`Done — ${total} entries updated.`);
