import type { AppLocale } from "@/i18n/config";
export type DelightKind =
  | "first_beat"
  | "beat_ready"
  | "double_drop"
  | "mastering_unlock"
  | "level_up"
  | "daily_loot"
  | "mastering_done"
  | "streak"
  | "achievement"
  | "share_moment"
  | "welcome"
  | "signup"
  | "site_de_ouf";

export type DelightCopy = {
  title: string;
  subtitle?: string;
  emoji: string;
  toast?: string;
  confetti?: number;
  emojis?: string[];
  flash?: "violet" | "cyan" | "gold";
};

const BEAT_READY_FR = [
  "WTF c'est toi le producteur là ?? 🔥",
  "Ok là c'est validé chef 👨‍🍳",
  "Wallah le beat est sale 💀",
  "Ton pote va te voler ce son frérot",
  "C'est du cinema ce son 🎬",
  "L'IA a mis des claques là",
  "No cap c'est hard 🧢",
  "Tu viens de cook un truc de malade",
];

const BEAT_READY_EN = [
  "WTF are YOU the producer?? 🔥",
  "Ok chef that's valid 👨‍🍳",
  "This beat is actually insane 💀",
  "Your friend is gonna steal this one",
  "This is cinema 🎬",
  "The AI went crazy on this one",
  "No cap it's hard 🧢",
  "You just cooked something sick",
];

const GEN_LOADING_FR = [
  "L'IA met ses casques studio 🎧",
  "On cook le beat dans le four 🔥",
  "Wallah ça va être sale…",
  "Le 808 arrive en courrier express 📦",
  "Mix en cours — respire frérot",
  "Les plugins chargent… patience",
  "Ton futur hit se prépare ✨",
  "Mode chef étoilé activé 👨‍🍳",
  "On branche la prise magique ⚡",
  "C'est parti mon kiki (génération)",
];

const GEN_LOADING_EN = [
  "AI putting on studio headphones 🎧",
  "Cooking the beat in the oven 🔥",
  "This is about to be nasty…",
  "808 arriving express delivery 📦",
  "Mixing in progress — breathe",
  "Loading plugins… hang tight",
  "Your future hit is loading ✨",
  "Michelin-star chef mode 👨‍🍳",
  "Plugging in the magic cable ⚡",
  "Let's gooo (generating)",
];

export function pickRandom<T>(pool: T[], seed?: string): T {
  if (!pool.length) throw new Error("empty pool");
  if (!seed) return pool[Math.floor(Math.random() * pool.length)]!;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length]!;
}

export function pickGenLoadingQuip(locale: AppLocale, tick: number): string {
  const pool = locale === "fr" ? GEN_LOADING_FR : GEN_LOADING_EN;
  return pool[tick % pool.length]!;
}

export function pickBeatReadyToast(locale: AppLocale, seed?: string): string {
  return pickRandom(locale === "fr" ? BEAT_READY_FR : BEAT_READY_EN, seed);
}

export function getDelightCopy(kind: DelightKind, locale: AppLocale, extra?: { level?: number; streak?: number; emoji?: string }): DelightCopy {
  const isFr = locale === "fr";

  const map: Record<DelightKind, DelightCopy> = {
    first_beat: {
      title: isFr ? "PREMIER SON" : "FIRST TRACK",
      subtitle: isFr ? "T'es officiellement producteur maintenant" : "You're officially a producer now",
      emoji: "🎵",
      toast: isFr ? "Premier son débloqué — let's gooo" : "First track unlocked — let's gooo",
      confetti: 120,
      flash: "gold",
      emojis: ["🎵", "🔥", "✨", "💿"],
    },
    beat_ready: {
      title: isFr ? "C'EST LIVE" : "IT'S LIVE",
      subtitle: isFr ? "Écoute avant que quelqu'un te le pique" : "Listen before someone steals it",
      emoji: "🔥",
      confetti: 55,
      emojis: ["🔥", "🎧", "💿"],
    },
    double_drop: {
      title: isFr ? "DOUBLE DROP" : "DOUBLE DROP",
      subtitle: isFr ? "2 versions — choisis ton chef-d'œuvre" : "2 versions — pick your masterpiece",
      emoji: "🎛️",
      toast: isFr ? "2 sons en 1 clic — choisis le goat 🐐" : "2 tracks in 1 click — pick the goat 🐐",
      confetti: 70,
      emojis: ["🎛️", "🔥", "✨"],
    },
    mastering_unlock: {
      title: isFr ? "NIVEAU STUDIO" : "STUDIO LEVEL",
      subtitle: isFr ? "4 tracks — ton son mérite le master" : "4 tracks — your sound deserves mastering",
      emoji: "✨",
      toast: isFr ? "Mastering Studio débloqué en aperçu 🎚️" : "Mastering Studio preview unlocked 🎚️",
      confetti: 100,
      flash: "violet",
      emojis: ["✨", "🎚️", "💎", "🔊"],
    },
    level_up: {
      title: isFr ? `NIVEAU ${extra?.level ?? "?"}` : `LEVEL ${extra?.level ?? "?"}`,
      subtitle: isFr ? "Tu montes en puissance" : "You're leveling up",
      emoji: "🚀",
      toast: isFr ? `Niveau ${extra?.level ?? ""} — t'es une machine 🚀` : `Level ${extra?.level ?? ""} — you're a machine 🚀`,
      confetti: 80,
      flash: "cyan",
      emojis: ["🚀", "⚡", "💎"],
    },
    daily_loot: {
      title: isFr ? "LOOT DU JOUR" : "DAILY LOOT",
      subtitle: isFr ? "Reviens demain pour plus" : "Come back tomorrow for more",
      emoji: "🎁",
      confetti: 45,
      emojis: ["🎁", "✨", "💰"],
    },
    mastering_done: {
      title: isFr ? "CLEAN AF" : "CLEAN AF",
      subtitle: isFr ? "Le master est prêt — compare A/B" : "Master ready — A/B compare",
      emoji: "🎚️",
      toast: isFr ? "Ton son est CLEAN maintenant ✨" : "Your track is CLEAN now ✨",
      confetti: 50,
      emojis: ["🎚️", "✨", "🔊"],
    },
    streak: {
      title: isFr ? `${extra?.streak ?? 0} JOURS 🔥` : `${extra?.streak ?? 0} DAYS 🔥`,
      subtitle: isFr ? "T'es régulier — respect" : "You're consistent — respect",
      emoji: "🔥",
      confetti: 40,
      emojis: ["🔥", "⚡", "🏆"],
    },
    achievement: {
      title: isFr ? "BADGE DÉBLOQUÉ" : "BADGE UNLOCKED",
      subtitle: isFr ? "Collectionne-les tous" : "Collect them all",
      emoji: extra?.emoji ?? "🏅",
      confetti: 35,
      emojis: [extra?.emoji ?? "🏅", "✨"],
    },
    share_moment: {
      title: isFr ? "FAIS LE BUZZ" : "MAKE NOISE",
      subtitle: isFr ? "Envoie ce son à ta commu" : "Send this track to your people",
      emoji: "📣",
      toast: isFr ? "Partage = XP social (dans ta tête) 📣" : "Sharing = social XP (in your head) 📣",
      emojis: ["📣", "🔥", "💬"],
    },
    welcome: {
      title: isFr ? "BIENVENUE" : "WELCOME",
      subtitle: isFr ? "Le studio t'attend — fais du bruit" : "The studio awaits — make noise",
      emoji: "👋",
      toast: isFr ? "Bienvenue dans le studio de ouf 👋" : "Welcome to the insane studio 👋",
      confetti: 65,
      flash: "violet",
    },
    signup: {
      title: isFr ? "T'ES IN" : "YOU'RE IN",
      subtitle: isFr ? "Compte créé — let's cook" : "Account created — let's cook",
      emoji: "🎉",
      toast: isFr ? "Compte créé — c'est parti 🎉" : "Account created — let's go 🎉",
      confetti: 90,
      flash: "gold",
    },
    site_de_ouf: {
      title: isFr ? "SITE DE OUF" : "INSANE SITE",
      subtitle: isFr ? "Mode activé — va le dire à tes potes" : "Mode activated — tell your friends",
      emoji: "🤯",
      toast: isFr ? "Eh mec j'ai vu un site de ouf ! 🤯" : "Bro I found the craziest site! 🤯",
      confetti: 150,
      flash: "gold",
      emojis: ["🤯", "🔥", "✨", "💿", "🎧"],
    },
  };

  return map[kind];
}
