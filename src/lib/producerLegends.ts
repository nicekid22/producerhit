import type { AppLocale } from "@/i18n/config";

export type ProducerWhisperKind = "money" | "workflow" | "release";

export type ProducerWhisper = {
  id: string;
  quote: string;
  who: string;
  kind: ProducerWhisperKind;
  /** Tag discret — surtout pour les 3 retours « argent ». */
  tag?: string;
};

const WHISPERS_FR: ProducerWhisper[] = [
  {
    id: "fr-lofi-yt",
    quote: "Plus de 100 beats pour mes playlists lo-fi — je lance la chaîne YouTube bientôt.",
    who: "Dylan · Lo-fi · France",
    kind: "workflow",
  },
  {
    id: "fr-seed",
    quote: "Le seed change tout. Je garde une prise sur quatre, c'est déjà énorme pour itérer.",
    who: "Producteur trap · Paris",
    kind: "workflow",
  },
  {
    id: "fr-hook",
    quote: "Song Mode m'a sorti un hook utilisable en trois générations — track finie le soir même.",
    who: "Artiste indie · Montréal",
    kind: "release",
  },
  {
    id: "fr-beatstars",
    quote: "Pack uploadé le lendemain sur BeatStars — trois ventes avant midi, sans forcer.",
    who: "Beatmaker · Lyon",
    kind: "money",
    tag: "BeatStars",
  },
  {
    id: "fr-bpm",
    quote: "BPM verrouillé en Type Beat : mes packs sonnent enfin cohérents.",
    who: "Beatmaker drill · Lille",
    kind: "workflow",
  },
  {
    id: "fr-remix",
    quote: "Un remix communauté m'a ouvert une direction que je n'aurais pas testée seul.",
    who: "Producteur R&B · Bruxelles",
    kind: "workflow",
  },
  {
    id: "fr-sync",
    quote: "Droits Pro clairs — la synchro client est passée sans aller-retour juridique.",
    who: "Créatrice contenu · Toulouse",
    kind: "money",
    tag: "synchro",
  },
  {
    id: "fr-wav",
    quote: "Export WAV direct, import FL en deux clics. Workflow nickel.",
    who: "Ingé son · Marseille",
    kind: "workflow",
  },
  {
    id: "fr-cover",
    quote: "La cover auto suffit pour poster avant la sortie — je ne bloque plus sur le visuel.",
    who: "Artiste pop · Genève",
    kind: "release",
  },
  {
    id: "fr-spotify",
    quote: "Single maison sur Spotify — premier mois correct, surtout pour une sortie solo.",
    who: "Artiste indie · Lyon",
    kind: "money",
    tag: "streaming",
  },
  {
    id: "fr-library",
    quote: "Ma bibliothèque cloud remplace les dossiers perdus sur le disque dur.",
    who: "Beatmaker · Bordeaux",
    kind: "workflow",
  },
  {
    id: "fr-free-pro",
    quote: "Free pour tester des idées, Pro quand je sors vraiment — ça colle à ma façon de bosser.",
    who: "Prod débutant · Nantes",
    kind: "release",
  },
];

const WHISPERS_EN: ProducerWhisper[] = [
  {
    id: "en-lofi-yt",
    quote: "100+ beats for my lo-fi playlists — YouTube channel launch coming soon.",
    who: "Dylan · Lo-fi · France",
    kind: "workflow",
  },
  {
    id: "en-seed",
    quote: "Seeds change everything. I keep one take out of four — that's plenty to iterate.",
    who: "Trap producer · Paris",
    kind: "workflow",
  },
  {
    id: "en-hook",
    quote: "Song Mode gave me a usable hook in three gens — finished the track that night.",
    who: "Indie artist · Montreal",
    kind: "release",
  },
  {
    id: "en-beatstars",
    quote: "Uploaded a pack to BeatStars next morning — three sales before noon, no hustle.",
    who: "Beatmaker · Lyon",
    kind: "money",
    tag: "BeatStars",
  },
  {
    id: "en-bpm",
    quote: "Locked BPM in Type Beat Mode — my packs finally sound cohesive.",
    who: "Drill producer · Lille",
    kind: "workflow",
  },
  {
    id: "en-remix",
    quote: "A community remix opened a direction I wouldn't have tried solo.",
    who: "R&B producer · Brussels",
    kind: "workflow",
  },
  {
    id: "en-sync",
    quote: "Clear Pro rights — client sync went through without legal back-and-forth.",
    who: "Content creator · Toulouse",
    kind: "money",
    tag: "sync",
  },
  {
    id: "en-wav",
    quote: "WAV export straight into my DAW — two-click workflow.",
    who: "Mix engineer · Marseille",
    kind: "workflow",
  },
  {
    id: "en-cover",
    quote: "Auto cover is enough to post before release — I'm not stuck on visuals anymore.",
    who: "Pop artist · Geneva",
    kind: "release",
  },
  {
    id: "en-spotify",
    quote: "DIY single on Spotify — decent first month for a self-release.",
    who: "Indie artist · Lyon",
    kind: "money",
    tag: "streaming",
  },
  {
    id: "en-library",
    quote: "Cloud library replaced the folders I kept losing on my drive.",
    who: "Beatmaker · Bordeaux",
    kind: "workflow",
  },
  {
    id: "en-free-pro",
    quote: "Free to test ideas, Pro when I actually ship — matches how I work.",
    who: "New producer · Nantes",
    kind: "release",
  },
];

export function producerWhispers(locale: AppLocale): ProducerWhisper[] {
  return locale === "fr" ? WHISPERS_FR : WHISPERS_EN;
}

/** @deprecated Alias — paywall / imports legacy */
export function producerLegends(locale: AppLocale): ProducerWhisper[] {
  return producerWhispers(locale);
}

export function producerWhispersSectionCopy(locale: AppLocale) {
  const isFr = locale === "fr";
  return {
    eyebrow: isFr ? "Retours studio" : "Studio notes",
  };
}
