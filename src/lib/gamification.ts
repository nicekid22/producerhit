export type AchievementId =
  | "first_beat"
  | "four_beats"
  | "first_master"
  | "streak_3"
  | "streak_7"
  | "level_5"
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

const STORAGE_KEY = "producerhit_gamification_v1";

export const LEVEL_XP = [0, 80, 180, 320, 500, 720, 980, 1280, 1620, 2000];

/** Max bonus generations earned from all level-ups (levels 2→10). */
export const MAX_LEVEL_REWARD_CREDITS = 20;

/** Bonus generations granted when reaching this level (level 1 = none). */
export function getLevelRewardCredits(level: number): number {
  if (level <= 1) return 0;
  if (level === 10) return 4;
  if (level >= 2 && level <= 9) return 2;
  return 0;
}

export function getTotalLevelRewardCreditsUpTo(level: number): number {
  let total = 0;
  for (let l = 2; l <= level; l++) total += getLevelRewardCredits(l);
  return total;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_beat", titleFr: "Premier son", titleEn: "First beat", descFr: "Ta première créa est live", descEn: "Your first creation is live", emoji: "🎵" },
  { id: "four_beats", titleFr: "En route", titleEn: "On a roll", descFr: "4 tracks générées", descEn: "4 tracks generated", emoji: "🔥" },
  { id: "first_master", titleFr: "Oreille d'or", titleEn: "Golden ear", descFr: "Premier aperçu mastering", descEn: "First mastering preview", emoji: "✨" },
  { id: "streak_3", titleFr: "Régulier", titleEn: "Consistent", descFr: "3 jours d'affilée", descEn: "3-day streak", emoji: "⚡" },
  { id: "streak_7", titleFr: "Machine", titleEn: "Machine", descFr: "7 jours d'affilée", descEn: "7-day streak", emoji: "🏆" },
  { id: "level_5", titleFr: "Producteur confirmé", titleEn: "Verified producer", descFr: "Niveau 5 atteint", descEn: "Reached level 5", emoji: "💎" },
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
  for (let i = 1; i < LEVEL_XP.length; i++) {
    if (xp >= (LEVEL_XP[i] ?? 0)) level = i + 1;
    else break;
  }
  return level;
}

export function getLevelProgress(xp: number): { level: number; current: number; next: number; pct: number } {
  const level = getLevel(xp);
  const floor = LEVEL_XP[level - 1] ?? 0;
  const ceiling = LEVEL_XP[level] ?? floor + 400;
  const current = xp - floor;
  const span = Math.max(1, ceiling - floor);
  return { level, current, next: ceiling - floor, pct: Math.min(100, Math.round((current / span) * 100)) };
}

function unlockAchievements(state: GamificationState): AchievementId[] {
  const have = new Set(state.achievements);
  const unlocked: AchievementId[] = [];
  const tryUnlock = (id: AchievementId, ok: boolean) => {
    if (!ok || have.has(id)) return;
    have.add(id);
    unlocked.push(id);
  };

  tryUnlock("first_beat", state.totalGenerations >= 1);
  tryUnlock("four_beats", state.totalGenerations >= 4);
  tryUnlock("first_master", state.masteringPreviews >= 1);
  tryUnlock("streak_3", state.streak >= 3);
  tryUnlock("streak_7", state.streak >= 7);
  tryUnlock("level_5", getLevel(state.xp) >= 5);

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
