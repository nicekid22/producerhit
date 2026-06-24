import fs from "node:fs";

const path = "src/pages/Dashboard.tsx";
let s = fs.readFileSync(path, "utf8");

const reps = [
  ['locale === "fr" ? "Génère une track d\'abord" : "Generate a track first"', "d.generateTrackFirst"],
  ['locale === "fr" ? "Lien indisponible — réessaie" : "Link unavailable — try again"', "d.linkUnavailable"],
  ['locale === "fr" ? "Studio chargé — fais du bruit 🎧" : "Studio loaded — make some noise 🎧"', "d.studioLoaded"],
  ['locale === "fr" ? "🎉 Paiement reçu. Activation de ton plan…" : "🎉 Payment received. Activating your plan…"', "d.paymentReceived"],
  ['locale === "fr" ? `Plan activé : ${nextPlan}` : `Plan activated: ${nextPlan}`', "`${d.planActivatedPrefix}${nextPlan}`"],
  ['locale === "fr" ? "Plan en cours d\'activation — rafraîchis dans quelques secondes." : "Plan activating — refresh in a few seconds."', "d.planActivating"],
  ['locale === "fr" ? "Depuis l\'idée" : "From idea"', "d.fromIdea"],
  ['locale === "fr" ? "Aléatoire" : "Random"', "d.random"],
  ['locale === "fr" ? "Nouvelle piste" : "New track"', "d.newTrack"],
  ['locale === "fr" ? "Audio manquant" : "Missing audio"', "d.missingAudio"],
  ['locale === "fr" ? "Relance en file (plus stable)…" : "Retrying in queue mode (more stable)…"', "d.retryingQueue"],
  ['locale === "fr" ? "Échec de génération — réessaie" : "Generation failed — please try again"', "d.generationFailed"],
  ['locale === "fr" ? "1 version sur 2 — l\'autre a flop, réessaie" : "1 of 2 versions — the other flopped, retry"', "d.oneOfTwoFailed"],
  ['locale === "fr" ? "Remix" : "Remix"', "d.remix"],
  ['locale === "fr" ? "Remix prêt — écoute le résultat 🎧" : "Remix ready — listen to the result 🎧"', "d.remixReady"],
  ['locale === "fr" ? "Limite mensuelle atteinte" : "Monthly limit reached"', "d.monthlyLimitReached"],
  ['locale === "fr" ? "Remix échoué" : "Remix failed"', "d.remixFailed"],
  ['locale === "fr" ? "Cover prêt — écoute le résultat 🎧" : "Cover ready — listen to the result 🎧"', "d.coverReady"],
  ['locale === "fr" ? "Cover échoué" : "Cover failed"', "d.coverFailed"],
  ['locale === "fr" ? "Titre mis à jour" : "Title updated"', "d.titleUpdated"],
  ['locale === "fr" ? "Erreur" : "Error"', "d.error"],
  ['locale === "fr" ? "Style & Vibe" : "Style & Vibe"', "d.styleVibe"],
  ['locale === "fr" ? "Ambiance" : "Mood"', "d.mood"],
  ['locale === "fr" ? "Énergie" : "Energy"', "d.energy"],
  ['locale === "fr" ? "Influence" : "Influence"', "d.influence"],
  ['locale === "fr" ? "Influence producteur" : "Producer influence"', "d.producerInfluence"],
  ['locale === "fr" ? "Titre du son" : "Sound Title"', "d.soundTitle"],
  ['locale === "fr" ? "ex: Pluie sur la ville" : "e.g. Rainy city nights"', "d.titlePlaceholder"],
  ['locale === "fr" ? "Copié" : "Copied"', "d.copied"],
  ['locale === "fr" ? "Copie impossible" : "Copy failed"', "d.copyFailed"],
  ['locale === "fr" ? "Tempo & Tonalité" : "Tempo & Key"', "d.tempoKey"],
  ['locale === "fr" ? "BPM manuel" : "Manual BPM"', "d.manualBpm"],
  ['locale === "fr" ? "L’IA choisit le meilleur BPM pour ton style." : "The AI will decide the best BPM for your style."', "d.aiPicksBpm"],
  ['locale === "fr" ? "Tonalité" : "Musical Key"', "d.musicalKey"],
  ['locale === "fr" ? "L’IA choisit la meilleure tonalité/gamme." : "The AI will pick the best key/scale."', "d.aiPicksKey"],
  ['locale === "fr" ? "Avancé" : "Advanced"', "d.advanced"],
  ['locale === "fr" ? "Longueur" : "Length"', "d.length"],
  ['locale === "fr" ? "Format audio" : "Audio Format"', "d.audioFormat"],
  ['locale === "fr" ? "WAV se débloque avec Pro — tap pour voir." : "WAV unlocks with Pro — tap to peek."', "d.wavUnlockPro"],
  ['locale === "fr" ? "Pro+ : toggle MP3 ou WAV à chaque gen." : "Pro+: toggle MP3 or WAV each gen."', "d.proToggleWav"],
  ['locale === "fr" ? "Préréglages" : "Quick Presets"', "d.quickPresets"],
  ['locale === "fr" ? "Le Style" : "The Style"', "d.theStyle"],
  ['locale === "fr" ? "La Langue" : "Language"', "d.language"],
  ['locale === "fr" ? "Langue" : "Language"', "d.languageMenu"],
  ['locale === "fr" ? "Paroles" : "The Lyrics"', "d.lyrics"],
  ['locale === "fr" ? "✏️ J’écris" : "✏️ I write"', "d.iWrite"],
  ['locale === "fr" ? "✨ IA écrit" : "✨ AI writes"', "d.aiWrites"],
  ['locale === "fr" ? "Voix chantée" : "Singing voice"', "d.singingVoice"],
  ['locale === "fr" ? "Titre de la chanson" : "Song Title"', "d.songTitle"],
  ['locale === "fr" ? "Réglages avancés" : "Advanced Settings"', "d.advancedSettings"],
  ['locale === "fr" ? "L’IA choisit le meilleur tempo." : "The AI picks the best tempo."', "d.aiPicksTempo"],
  ['locale === "fr" ? "Durée" : "Duration"', "d.duration"],
  ['locale === "fr" ? "Secondes" : "Seconds"', "d.seconds"],
  ['locale === "fr" ? "L’IA choisit la durée." : "The AI picks the duration."', "d.aiPicksDuration"],
  ['locale === "fr" ? "Contexte & inspiration (chips)" : "Context & Inspiration (Chips)"', "d.contextChips"],
  ['locale === "fr" ? "L’IA choisit la tonalité & la gamme." : "The AI picks key & scale."', "d.aiPicksKeyScale"],
  ['locale === "fr" ? "Signature rythmique" : "Time Signature"', "d.timeSignature"],
  ['locale === "fr" ? "L’IA choisit la signature." : "The AI picks the signature."', "d.aiPicksSignature"],
  ['locale === "fr" ? "Générer une chanson" : "Generate Song"', "d.generateSong"],
  ['locale === "fr" ? "Générer un beat" : "Generate Beat"', "d.generateBeat"],
  ['locale === "fr" ? "Génération" : "Generating"', "d.generating"],
  ['locale === "fr" ? "Chargement du quota…" : "Loading quota…"', "d.loadingQuota"],
  ['locale === "fr" ? "restantes ce mois-ci" : "left this month"', "d.leftThisMonth"],
  ['locale === "fr" ? "Plan…" : "Plan…"', "d.planEllipsis"],
  ['locale === "fr" ? "Comparer les tarifs" : "Compare plans"', "d.comparePlans"],
  ['locale === "fr" ? "Voir les options" : "See options"', "d.seeOptions"],
  ['locale === "fr" ? "Plus de crédits — upgrade ton plan" : "No credits remaining — upgrade your plan"', "d.noCreditsUpgrade"],
  ['locale === "fr" ? "Rechercher…" : "Search your creations..."', "d.searchCreations"],
  ['locale === "fr" ? "Tout" : "All"', "d.all"],
  ['locale === "fr" ? "Sauvegardés" : "Saved"', "d.saved"],
  ['locale === "fr" ? "Mon espace" : "My Workspace"', "d.myWorkspace"],
  ['locale === "fr" ? "Tracks" : "Tracks"', "d.tracks"],
  ['locale === "fr" ? "Mastering Studio" : "Mastering Studio"', "d.masteringStudio"],
  ['locale === "fr" ? "En attente de la version 1…" : "Waiting for version 1…"', "d.waitingVersion1"],
  ['locale === "fr" ? "Surprise lancée — on tire un style pour toi." : "Surprise started — we\'re picking a style for you."', "d.surpriseStarted"],
  ['locale === "fr" ? "Génération lancée — ton idée prend forme." : "Generating from your idea."', "d.generatingFromIdea"],
  ['locale === "fr" ? "Batch ACE incomplet — réessaie en mode séquentiel" : "Incomplete ACE batch — retry in sequential mode"', "d.batchIncomplete"],
  [
    `locale === "fr"
                      ? "Depuis l'idée, Aléatoire ou un genre du catalogue."
                      : "From your idea, Random, or a catalog genre."`,
    "d.genreMenuHint",
  ],
  [
    `locale === "fr"
                      ? "Auto détecte la langue depuis ton idée ou tes paroles manuelles."
                      : "Auto detects language from your idea or manual lyrics."`,
    "d.languageHint",
  ],
];

let n = 0;
for (const [from, to] of reps) {
  const before = s;
  s = s.split(from).join(to);
  if (s !== before) n++;
}

fs.writeFileSync(path, s);
const remaining = (s.match(/locale === "fr"/g) || []).length;
console.log(`Applied ${n} patterns. Remaining locale===fr: ${remaining}`);
