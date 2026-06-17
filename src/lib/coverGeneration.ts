import type { AppLocale } from "@/i18n/config";
import { estimateSongDurationFromLyrics } from "@/lib/aceDuration";
import type { GenerateParams } from "@/lib/promptBuilder";
import { resolveSongVocalLanguage } from "@/lib/vocalLanguages";

export function buildCoverPrompt(args: {
  genre: string;
  styleHint?: string;
  locale: AppLocale;
}): string {
  const genre = args.genre.trim() || "Pop";
  const hint = args.styleHint?.trim();
  const isFr = args.locale === "fr";
  const parts = [
    isFr ? "version cover remix" : "cover remix version",
    `${genre} arrangement and production`,
    isFr ? "conserver exactement les paroles fournies sans les réécrire" : "keep the exact lyrics provided without rewriting them",
    isFr
      ? "nouvelle instru et nouvelle interprétation vocale générée par IA"
      : "new instrumental and new AI vocal performance",
    isFr ? "ne pas imiter la voix de l'artiste original" : "do not imitate the original artist's voice",
    hint,
  ];
  return parts.filter(Boolean).join(", ");
}

export function prepareCoverGeneration(args: {
  lyrics: string;
  genre: string;
  styleHint?: string;
  locale: AppLocale;
}) {
  const trimmedLyrics = args.lyrics.trim();
  const genre = args.genre.trim() || "Pop";
  const prompt = buildCoverPrompt({ genre, styleHint: args.styleHint, locale: args.locale });
  const vocalLanguage = resolveSongVocalLanguage({
    mode: "auto",
    manualCode: "",
    lyricsMode: "manual",
    lyrics: trimmedLyrics,
    songDescription: "",
  });
  const duration = estimateSongDurationFromLyrics(trimmedLyrics);
  const seed = Math.floor(Math.random() * 100000) + 1;

  const inputParams: GenerateParams = {
    genre,
    influence: "",
    key: "",
    scale: "",
    bpm: 0,
    loopLengthBars: 8,
    swing: 0,
    mood: "Auto",
    energyLevel: "Medium",
    reverb: "Medium",
    prompt,
  };

  return {
    inputParams,
    generateOptions: {
      instrumental: false as const,
      lyrics: trimmedLyrics,
      vocalLanguage,
      isSong: true as const,
      autoMeta: true,
      duration,
      audioFormat: "mp3" as const,
      seed,
    },
    prompt,
    seed,
    engine: "ace-step" as const,
  };
}

export function coverResultTitle(genre: string, locale: AppLocale): string {
  const label = genre.trim() && genre !== "Auto" ? genre.trim() : locale === "fr" ? "Cover" : "Cover";
  return `Cover · ${label}`;
}
