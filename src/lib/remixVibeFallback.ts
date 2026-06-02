/**
 * Remix sans upload ACE (api.acemusic.ai — release_task / music/generate en 404).
 * Par défaut : recréer une vibe via Song / Beat avec le même prompt.
 *
 * Rollback upload ACE : VITE_REMIX_UPLOAD_ENABLED=1 (Vercel + rebuild).
 */

export function isRemixUploadEnabled(): boolean {
  return import.meta.env.VITE_REMIX_UPLOAD_ENABLED === "1";
}

export function isRemixVibeRecreateEnabled(): boolean {
  return !isRemixUploadEnabled();
}

export const REMIX_VIBE_FALLBACK_COPY = {
  fr: {
    panelTitle: "Remix ton Hit",
    panelBadge: "Song / Beat",
    panelHint:
      "Même BPM, tonalité, paroles et prompt du track — Ajoute ta touche perso (optionnel).",
    loadedToast: "Track chargée — ajoute ta touche perso ✨",
    styleTouchLabel: "Ta touche finale (optionnel)",
    styleTouchPlaceholder: "Ex : 808 plus lourds, fini radio, ambiance night…",
    basePromptLabel: "Prompt de base (conservé)",
    ctaIdle: "Lancer le remix",
    ctaGenerating: "Génération…",
    needPrompt: "Décris le style (4+ caractères).",
    creditHint: "1 crédit · nouvelle piste dans ta bibliothèque",
    successToast: "Remix ready — écoute le résultat 🎧",
    inspiredBy: (name: string) => `Inspiré de « ${name} »`,
  },
  en: {
    panelTitle: "Remix the vibe",
    panelBadge: "Song / Beat",
    panelHint:
      "Same BPM, key, lyrics, and prompt from the track. Add your personaltouch (optional).",
    loadedToast: "Track loaded — add an optional style touch ✨",
    styleTouchLabel: "Your final touch (optional)",
    styleTouchPlaceholder: "E.g. heavier 808s, radio-ready finish, night vibe…",
    basePromptLabel: "Base prompt (kept)",
    ctaIdle: "Run remix",
    ctaGenerating: "Generating…",
    needPrompt: "Describe the style (4+ chars).",
    creditHint: "1 credit · new track in your library",
    successToast: "New vibe ready — listen to the result 🎧",
    inspiredBy: (name: string) => `Inspired by “${name}”`,
  },
} as const;
