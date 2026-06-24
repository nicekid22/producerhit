import fs from "node:fs";

const path = "src/pages/Dashboard.tsx";
let s = fs.readFileSync(path, "utf8");

const reps = [
  [
    `toast(
                locale === "fr"
                  ? "Ajoute ton prénom et nom dans Réglages pour tes licences par titre."
                  : "Add your legal name in Settings for per-track licenses.",
                { icon: "📄", duration: 6000 },
              )`,
    `toast(d.addLegalName, { icon: "📄", duration: 6000 })`,
  ],
  [
    `toast.error(
        locale === "fr"
          ? "Quota serveur désynchronisé — actualisation en cours, réessaie dans un instant."
          : "Quota out of sync with server — refreshing, try again in a moment.",
      )`,
    `toast.error(d.quotaOutOfSync)`,
  ],
  [
    `toast.error(
            locale === "fr"
              ? \`Généré, mais l'enregistrement a échoué : \${message}\`
              : \`Generated, but saving to your library failed: \${message}\`,
          )`,
    `toast.error(\`\${d.generatedSaveFailedPrefix}\${message}\`)`,
  ],
  [
    `? locale === "fr"
              ? "Limite mensuelle atteinte"
              : "Monthly limit reached"`,
    `? d.monthlyLimitReached`,
  ],
  [
    `: locale === "fr"
              ? "Échec de génération — réessaie"
              : "Generation failed — please try again"`,
    `: d.generationFailed`,
  ],
  [`voiceCloneToastMessage(value.meta, locale === "fr")`, `voiceCloneToastMessage(value.meta, locale)`],
  [
    `toast.error(locale === "fr" ? ACE_REMIX_UNAVAILABLE_COPY.fr : ACE_REMIX_UNAVAILABLE_COPY.en, {`,
    `toast.error(locale === "fr" ? ACE_REMIX_UNAVAILABLE_COPY.fr : ACE_REMIX_UNAVAILABLE_COPY.en, {`,
  ],
  [
    `placeholder={
                            locale === "fr"
                              ? "[Couplet]\\nÉcris tes paroles ici...\\n\\n[Refrain]\\nÉcris ton hook ici..."
                              : "[Verse]\\nWrite your lyrics here...\\n\\n[Chorus]\\nWrite your hook here..."
                          }`,
    `placeholder={d.lyricsPlaceholder}`,
  ],
  [
    `{locale === "fr"
                          ? "✨ L'IA écrira des paroles originales selon ton genre et ton idée."
                          : "✨ AI will write original lyrics based on your genre and idea — you'll hear them in the generated song."}`,
    `{d.aiWritesLyricsHint}`,
  ],
  [
    `hint={
                      locale === "fr"
                        ? "Profil vocal ACE — géré dans Voice Studio"
                        : "ACE voice profile — managed in Voice Studio"
                    }`,
    `hint={d.voiceProfileHint}`,
  ],
  [
    `locale === "fr" ? (
                          "Chargement du quota…"
                        ) : (
                          "Loading quota…"
                        )`,
    `d.loadingQuota`,
  ],
  [
    '{locale === "fr" ? `Voir Pro — ${planPriceLabel("pro", "fr", { suffix: true })}` : `See Pro — ${planPriceLabel("pro", "en", { suffix: true })}`}',
    '{`${d.seeProPrefix}${planPriceLabel("pro", locale, { suffix: true })}`}',
  ],
  [`locale === "fr" ? "Chargement de tes créations…" : "Loading your creations..."`, `d.loadingCreations`],
  [`locale === "fr" ? "Récupération depuis ton compte" : "Fetching from your account"`, `d.fetchingAccount`],
  [`locale === "fr" ? "Impossible de charger tes créations" : "Failed to load your creations"`, `d.failedLoadCreations`],
  [
    `{locale === "fr"
                      ? "Ton compte est bien connecté, mais la récupération depuis la base de données a échoué. Clique sur Réessayer."
                      : "You're logged in, but fetching from the database failed. Click Retry."}`,
    `{d.loadCreationsErrorBody}`,
  ],
  [`locale === "fr" ? "Réessayer" : "Retry"`, `d.retry`],
  [`locale === "fr" ? "Recharger" : "Reload"`, `d.reload`],
  [
    `locale === "fr" ? "Tes créations apparaîtront ici" : "Your creations will appear here"`,
    `d.creationsAppearHere`,
  ],
  [
    `locale === "fr"
                            ? "Version 1 prête — lancement de la version 2…"
                            : "Version 1 ready — starting version 2…"`,
    `d.version2Starting`,
  ],
  [`locale === "fr" ? "Finalisation…" : "Finishing up…"`, `d.finishingUp`],
  [`locale === "fr" ? "Création en cours…" : "Generating…"`, `d.generatingProgress`],
  [
    `locale === "fr"
                            ? "Progression estimée pendant la génération"
                            : "Estimated progress during generation"`,
    `d.progressLabel`,
  ],
  [
    `slot.errorText || (locale === "fr" ? "Échec de génération" : "Generation failed")`,
    `slot.errorText || d.generationFailedShort`,
  ],
  [`locale === "fr" ? "Fermer" : "Dismiss"`, `d.dismiss`],
  [`closeLabel={locale === "fr" ? "Fermer" : "Close"}`, `closeLabel={d.close}`],
  [
    `toast.success(locale === "fr" ? "Track publique — lien /loop actif" : "Track public — /loop link live")`,
    `toast.success(d.trackPublicLive)`,
  ],
];

let n = 0;
for (const [from, to] of reps) {
  const before = s;
  s = s.split(from).join(to);
  if (s !== before) n++;
}

fs.writeFileSync(path, s);
console.log(`Pass 2: ${n} patterns. Remaining:`, (s.match(/locale === "fr"/g) || []).length);
