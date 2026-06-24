import fs from "node:fs";

const path = "src/components/LoopCardItem.tsx";
let s = fs.readFileSync(path, "utf8");

if (!s.includes("buildLoopCardSection")) {
  s = s.replace(
    'import { useLocaleStore } from "@/stores/localeStore";',
    `import { useLocaleStore } from "@/stores/localeStore";
import { buildDashboardSection } from "@/i18n/dashboardCatalog";
import { buildLoopCardSection, loopCardVoiceCloneLabel } from "@/i18n/loopCardCatalog";`,
  );
  s = s.replace(
    'import { resolveLoopVoiceCloneInfo, voiceCloneStatusLabel } from "@/lib/voiceCloneMeta";',
    'import { resolveLoopVoiceCloneInfo } from "@/lib/voiceCloneMeta";',
  );
  s = s.replace(
    "  const locale = useLocaleStore((s) => s.locale);",
    `  const locale = useLocaleStore((s) => s.locale);
  const d = buildDashboardSection(locale);
  const lc = buildLoopCardSection(locale);`,
  );
}

const reps = [
  [
    /locale === "fr"\s*\?\s*"Aucune autre image disponible[^"]+"\s*:\s*"No other image available[^"]+"/g,
    "lc.coverNoOtherImage",
  ],
  [
    /locale === "fr"\s*\?\s*changed\s*\?\s*"Nouvelle image appliquée"\s*:\s*"Image mise à jour"\s*:\s*changed\s*\?\s*"New cover applied"\s*:\s*"Cover refreshed"/g,
    "changed ? lc.coverNewApplied : lc.coverRefreshed",
  ],
  [/locale === "fr" \? "Impossible de charger une nouvelle image" : "Could not load a new image"/g, "lc.coverLoadFailed"],
  [
    /locale === "fr"\s*\?\s*"Plus d'images uniques[^"]+"\s*:\s*"No unique images left[^"]+"/g,
    "lc.coverPinterestExhausted",
  ],
  [/locale === "fr" \? "Échec du changement d'image" : "Cover change failed"/g, "lc.coverChangeFailed"],
  [/locale === "fr" \? "Titre mis à jour" : "Title updated"/g, "d.titleUpdated"],
  [/err instanceof Error \? err.message : locale === "fr" \? "Erreur" : "Error"/g, "err instanceof Error ? err.message : d.error"],
  [/locale === "fr" \? "Création en cours…" : "Generating..."/g, "lc.generating"],
  [
    /kind === "remix" \? \(locale === "fr" \? "Remix généré !" : "Remix generated!"\) : locale === "fr" \? "Variation générée !" : "Variation generated!"/g,
    'kind === "remix" ? lc.remixGenerated : lc.variationGenerated',
  ],
  [
    /locale === "fr" \? `Généré, mais l'enregistrement a échoué : \$\{message\}` : `Generated, but saving failed: \$\{message\}`/g,
    "lc.generatedSaveFailedPrefix + message",
  ],
  [
    /locale === "fr" \? "Audio indisponible — réessaie dans un instant" : "Audio unavailable — try again in a moment"/g,
    "lc.audioUnavailable",
  ],
  [/voiceCloneStatusLabel\(voiceCloneInfo, locale === "fr"\)/g, "loopCardVoiceCloneLabel(voiceCloneInfo, locale)"],
  [/locale === "fr" \? "Télécharger" : "Download"/g, "lc.download"],
  [/locale === "fr" \? "Autre image" : "New inspo"/g, "lc.newInspo"],
  [/locale === "fr" \? "Supprimer" : "Delete"/g, "lc.delete"],
  [/loop\.isSaved \? \(locale === "fr" \? "Retirer" : "Unsave"\) : "Save"/g, "loop.isSaved ? lc.unsave : lc.saveAction"],
  [
    /loop\.isPublic \? \(locale === "fr" \? "Passer privé" : "Make private"\) : locale === "fr" \? "Rendre public" : "Make public"/g,
    "loop.isPublic ? lc.makePrivate : lc.makePublic",
  ],
  [/locale === "fr" \? "Partager" : "Share"/g, "lc.share"],
  [/locale === "fr" \? "Plus d'actions" : "More actions"/g, "lc.moreActions"],
  [/locale === "fr" \? "Track publique — lien actif" : "Track public — link live"/g, "lc.trackPublicLinkLive"],
  [/locale === "fr" \? "Infos" : "Details"/g, "lc.infoDetails"],
  [/locale === "fr" \? "Titre…" : "Title…"/g, "d.titleInputPlaceholder"],
  [/locale === "fr" \? "Valider" : "Save"/g, "lc.validate"],
  [/locale === "fr" \? "Annuler" : "Cancel"/g, "lc.cancel"],
  [/locale === "fr" \? "Modifier le titre" : "Edit title"/g, "lc.editTitle"],
  [/locale === "fr" \? "Mastering Studio" : "Mastering Studio"/g, "lc.masteringStudio"],
  [/locale === "fr" \? "Ouvrir Mastering Studio" : "Open Mastering Studio"/g, "lc.openMasteringStudio"],
  [/locale === "fr" \? "Stems séparés ZIP : plan Plus" : "Separate stems ZIP: Plus plan"/g, "lc.stemsPlusPlan"],
  [/locale === "fr" \? "Télécharger les stems" : "Download stems"/g, "lc.downloadStems"],
  [/locale === "fr" \? "Stems" : "Stems"/g, "lc.stemsLabel"],
  [
    /isVarying \? \(locale === "fr" \? "Génération…" : "Generating..."\) : "Variation"/g,
    "isVarying ? lc.generating : lc.variationBtn",
  ],
  [/isVarying \? \(locale === "fr" \? "Génération…" : "Generating..."\) : "Remix"/g, "isVarying ? lc.generating : lc.remixBtn"],
  [
    /locale === "fr" \? "Track publique — lien d'écoute actif" : "Track public — listen link live"/g,
    "lc.trackPublicListenLive",
  ],
  [
    /loop\.isPublic \? \(locale === "fr" \? "Passer privé" : "Make private"\) : locale === "fr" \? "Public" : "Public"/g,
    "loop.isPublic ? lc.makePrivate : lc.publicLabel",
  ],
  [
    /loop\.isPublic \? \(locale === "fr" \? "Privé" : "Private"\) : locale === "fr" \? "Public" : "Public"/g,
    "loop.isPublic ? lc.privateLabel : lc.publicLabel",
  ],
  [/toast\.error\("Réseau chargé — réessaie dans quelques secondes\. Upgrade pour avoir la priorité\."\)/g, "toast.error(lc.networkBusyRetry)"],
  [/kind === "remix" \? "Remix failed — try again" : "Variation failed — try again"/g, 'kind === "remix" ? lc.remixFailed : lc.variationFailed'],
];

for (const [re, rep] of reps) {
  s = s.replace(re, rep);
}

fs.writeFileSync(path, s);
const remaining = (s.match(/locale === "fr"/g) || []).length;
console.log("remaining locale===fr:", remaining);
