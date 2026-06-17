/** Headlines landing — conversion émotionnelle (rêveur, « tout est possible »). */
import type { AppLocale } from "@/i18n/config";

export const LANDING_HERO_DREAM_FR = [
  "Ta prochaine chanson existe déjà quelque part en toi.",
  "Un beat. Une voix. Un monde. Le tien.",
  "Pas de studio. Pas de limites. Juste l'envie.",
  "De l'idée au morceau — avant que la magie s'éteigne.",
  "Imagine. Décris. Écoute-toi exister.",
] as const;

export const LANDING_HERO_DREAM_EN = [
  "Your next song already exists — somewhere in you.",
  "One beat. One voice. One world. Yours.",
  "No studio. No limits. Just the spark.",
  "From idea to track — before the magic fades.",
  "Imagine it. Name it. Hear yourself come alive.",
] as const;

export function landingHeroDreamCopy(locale: AppLocale) {
  const isFr = locale === "fr";
  return {
    headlines: isFr ? LANDING_HERO_DREAM_FR : LANDING_HERO_DREAM_EN,
    subline: isFr
      ? "Choisis ton mood — le morceau suit."
      : "Pick your mood — the track follows.",
    seoTitle: isFr
      ? "Créateur de chansons IA — type beats, Song Mode, export royalty-free"
      : "AI song creator — type beats, Song Mode, royalty-free export",
  };
}

export function pickNextDreamHeadlineIndex(pool: readonly string[], current: number): number {
  if (pool.length <= 1) return 0;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * pool.length);
  }
  return next;
}
