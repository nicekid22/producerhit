export type AchievementId =
  | "first_beat"
  | "four_beats"
  | "first_master"
  | "streak_3"
  | "streak_7"
  | "level_5"
  | "level_10"
  | "level_15"
  | "level_20"
  | "level_25"
  | "daily_claim";

export type GamificationState = {
  xp: number;
  streak: number;
  lastVisitYmd: string;
  lastDailyClaimYmd: string;
  achievements: AchievementId[];
  totalGenerations: number;
  masteringPreviews: number;
};

export type AchievementDef = {
  id: AchievementId;
  titleFr: string;
  titleEn: string;
  descFr: string;
  descEn: string;
  emoji: string;
};

export type ProducerRank = {
  key: string;
  labelFr: string;
  labelEn: string;
};

const STORAGE_KEY = "producerhit_gamification_v1";

/** XP floors for levels 1–10 (index = level - 1). */
export const LEVEL_XP = [0, 80, 180, 320, 500, 720, 980, 1280, 1620, 2000];

export const CORE_LEVEL_COUNT = 10;
/** Last level that grants generation bonus loot. */
export const MAX_LEVEL = 25;

/** Bonus generations granted when reaching this level (level 1 = none). */
export function getLevelRewardCredits(level: number): number {
  if (level <= 1) return 0;
  if (level >= 2 && level <= 9) return 2;
  if (level === 10) return 4;
  if (level >= 11 && level <= 24) return level % 5 === 0 ? 2 : 1;
  if (level === MAX_LEVEL) return 3;
  return 0;
}

export function getTotalLevelRewardCreditsUpTo(level: number): number {
  let total = 0;
  for (let l = 2; l <= Math.min(level, MAX_LEVEL); l++) total += getLevelRewardCredits(l);
  return total;
}

/** Max bonus generations earned from all level-ups (levels 2→25). */
export const MAX_LEVEL_REWARD_CREDITS = getTotalLevelRewardCreditsUpTo(MAX_LEVEL);

export function getLevelXpSpan(level: number): number {
  if (level <= 1) return 0;
  if (level <= CORE_LEVEL_COUNT) {
    const prev = level === 1 ? 0 : (LEVEL_XP[level - 2] ?? 0);
    return (LEVEL_XP[level - 1] ?? 0) - prev;
  }
  return 380 + (level - CORE_LEVEL_COUNT) * 35;
}

export function getLevelXpFloor(level: number): number {
  if (level <= 1) return 0;
  if (level <= CORE_LEVEL_COUNT) return LEVEL_XP[level - 1] ?? 0;
  let floor = LEVEL_XP[CORE_LEVEL_COUNT - 1] ?? 2000;
  for (let l = CORE_LEVEL_COUNT + 1; l <= level; l++) {
    floor += getLevelXpSpan(l);
  }
  return floor;
}

export function getProducerRank(level: number): ProducerRank {
  if (level >= 20) return { key: "legend", labelFr: "Légende", labelEn: "Legend" };
  if (level >= 15) return { key: "virtuoso", labelFr: "Virtuose", labelEn: "Virtuoso" };
  if (level >= 10) return { key: "expert", labelFr: "Expert", labelEn: "Expert" };
  if (level >= 5) return { key: "rising", labelFr: "Confirmé", labelEn: "Rising" };
  return { key: "beginner", labelFr: "Débutant", labelEn: "Beginner" };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_beat", titleFr: "Premier son", titleEn: "First beat", descFr: "Ta première créa est live", descEn: "Your first creation is live", emoji: "🎵" },
  { id: "four_beats", titleFr: "En route", titleEn: "On a roll", descFr: "4 tracks générées", descEn: "4 tracks generated", emoji: "🔥" },
  { id: "first_master", titleFr: "Oreille d'or", titleEn: "Golden ear", descFr: "Premier aperçu mastering", descEn: "First mastering preview", emoji: "✨" },
  { id: "streak_3", titleFr: "Régulier", titleEn: "Consistent", descFr: "3 jours d'affilée", descEn: "3-day streak", emoji: "⚡" },
  { id: "streak_7", titleFr: "Machine", titleEn: "Machine", descFr: "7 jours d'affilée", descEn: "7-day streak", emoji: "🏆" },
  { id: "level_5", titleFr: "Producteur confirmé", titleEn: "Verified producer", descFr: "Niveau 5 atteint", descEn: "Reached level 5", emoji: "💎" },
  { id: "level_10", titleFr: "Noyau dur", titleEn: "Core unlocked", descFr: "Niveau 10 — ascension débloquée", descEn: "Level 10 — ascension unlocked", emoji: "🌑" },
  { id: "level_15", titleFr: "Virtuose", titleEn: "Virtuoso", descFr: "Niveau 15 atteint", descEn: "Reached level 15", emoji: "✦" },
  { id: "level_20", titleFr: "Architecte sonore", titleEn: "Sound architect", descFr: "Niveau 20 atteint", descEn: "Reached level 20", emoji: "🏛️" },
  { id: "level_25", titleFr: "Légende du studio", titleEn: "Studio legend", descFr: "Niveau max — maître du game", descEn: "Max level — studio legend", emoji: "👑" },
  { id: "daily_claim", titleFr: "Daily loot", titleEn: "Daily loot", descFr: "Bonus quotidien récupéré", descEn: "Daily bonus claimed", emoji: "🎁" },
];

function todayYmd(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function yesterdayYmd() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayYmd(d);
}

function defaultState(): GamificationState {
  return {
    xp: 0,
    streak: 0,
    lastVisitYmd: "",
    lastDailyClaimYmd: "",
    achievements: [],
    totalGenerations: 0,
    masteringPreviews: 0,
  };
}

export function loadGamification(): GamificationState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<GamificationState>;
    return { ...defaultState(), ...parsed, achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [] };
  } catch {
    return defaultState();
  }
}

function saveGamification(state: GamificationState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    void 0;
  }
}

export function getLevel(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= getLevelXpFloor(level + 1)) {
    level += 1;
  }
  return level;
}

export function getLevelProgress(xp: number): {
  level: number;
  current: number;
  next: number;
  pct: number;
  isMax: boolean;
  xpTotal: number;
  xpToNextLevel: number;
  rank: ProducerRank;
} {
  const level = getLevel(xp);
  const isMax = level >= MAX_LEVEL;
  const floor = getLevelXpFloor(level);
  const ceiling = isMax ? floor + 1 : getLevelXpFloor(level + 1);
  const span = Math.max(1, ceiling - floor);
  const current = xp - floor;

  return {
    level,
    current,
    next: span,
    pct: isMax ? 100 : Math.min(100, Math.round((current / span) * 100)),
    isMax,
    xpTotal: xp,
    xpToNextLevel: isMax ? 0 : Math.max(0, span - current),
    rank: getProducerRank(level),
  };
}

function unlockAchievements(state: GamificationState): AchievementId[] {
  const have = new Set(state.achievements);
  const unlocked: AchievementId[] = [];
  const tryUnlock = (id: AchievementId, ok: boolean) => {
    if (!ok || have.has(id)) return;
    have.add(id);
    unlocked.push(id);
  };

  const level = getLevel(state.xp);
  tryUnlock("first_beat", state.totalGenerations >= 1);
  tryUnlock("four_beats", state.totalGenerations >= 4);
  tryUnlock("first_master", state.masteringPreviews >= 1);
  tryUnlock("streak_3", state.streak >= 3);
  tryUnlock("streak_7", state.streak >= 7);
  tryUnlock("level_5", level >= 5);
  tryUnlock("level_10", level >= 10);
  tryUnlock("level_15", level >= 15);
  tryUnlock("level_20", level >= 20);
  tryUnlock("level_25", level >= MAX_LEVEL);

  state.achievements = [...have];
  return unlocked;
}

export function recordVisit(): { state: GamificationState; unlocked: AchievementId[]; streakBonus: number } {
  const state = loadGamification();
  const today = todayYmd();
  if (state.lastVisitYmd === today) {
    return { state, unlocked: [], streakBonus: 0 };
  }

  if (state.lastVisitYmd === yesterdayYmd()) state.streak += 1;
  else if (state.lastVisitYmd !== today) state.streak = 1;

  state.lastVisitYmd = today;
  const streakBonus = state.streak > 1 ? Math.min(30, state.streak * 5) : 10;
  state.xp += streakBonus;
  const unlocked = unlockAchievements(state);
  saveGamification(state);
  return { state, unlocked, streakBonus };
}

export function recordGeneration(): { state: GamificationState; unlocked: AchievementId[]; xpGained: number } {
  const state = loadGamification();
  state.totalGenerations += 1;
  const xpGained = state.totalGenerations === 1 ? 25 : 12;
  state.xp += xpGained;
  const unlocked = unlockAchievements(state);
  saveGamification(state);
  return { state, unlocked, xpGained };
}

export function recordMasteringPreview(): { state: GamificationState; unlocked: AchievementId[]; xpGained: number } {
  const state = loadGamification();
  state.masteringPreviews += 1;
  const xpGained = 20;
  state.xp += xpGained;
  const unlocked = unlockAchievements(state);
  saveGamification(state);
  return { state, unlocked, xpGained };
}

const DAILY_MESSAGES_FR = [
  "Bonus du jour — continue comme ça !",
  "Loot récupéré — ta prochaine track t'attend.",
  "XP boost activé — vas-y, fais du bruit.",
  "Cadeau du studio — créativité +100.",
];

const DAILY_MESSAGES_EN = [
  "Daily bonus — keep going!",
  "Loot claimed — your next track awaits.",
  "XP boost active — make some noise.",
  "Studio gift — creativity +100.",
];

export function claimDailyBonus(): {
  state: GamificationState;
  unlocked: AchievementId[];
  xpGained: number;
  messageFr: string;
  messageEn: string;
  alreadyClaimed: boolean;
} {
  const state = loadGamification();
  const today = todayYmd();
  if (state.lastDailyClaimYmd === today) {
    return { state, unlocked: [], xpGained: 0, messageFr: "", messageEn: "", alreadyClaimed: true };
  }
  state.lastDailyClaimYmd = today;
  const xpGained = 35 + Math.floor(Math.random() * 25);
  state.xp += xpGained;
  if (!state.achievements.includes("daily_claim")) state.achievements.push("daily_claim");
  const unlocked = unlockAchievements(state);
  saveGamification(state);
  const idx = Math.floor(Math.random() * DAILY_MESSAGES_FR.length);
  return {
    state,
    unlocked,
    xpGained,
    messageFr: DAILY_MESSAGES_FR[idx] ?? DAILY_MESSAGES_FR[0]!,
    messageEn: DAILY_MESSAGES_EN[idx] ?? DAILY_MESSAGES_EN[0]!,
    alreadyClaimed: false,
  };
}

export function getAchievementDef(id: AchievementId): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function canClaimDailyBonus(state = loadGamification()): boolean {
  return state.lastDailyClaimYmd !== todayYmd();
}
