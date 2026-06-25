export type LoopLength = "2 bars" | "4 bars" | "8 bars" | "16 bars";

export type Loop = {
  id: string;
  userId?: string;
  engine?: string;
  name: string;
  genre: string;
  influence: string;
  key: string;
  scale: string;
  bpm: number;
  loopLength: LoopLength;
  swing: number;
  mood: string;
  energyLevel: string;
  reverb: string;
  prompt: string;
  audioUrl: string | null;
  seed?: number | null;
  coverUrl?: string | null;
  stemsUrl?: Record<string, unknown> | null;
  isSaved: boolean;
  isPublic: boolean;
  createdAt: string;
};

export type PlanId = "free" | "pro" | "studio" | "plus";

export const PLAN_LIMITS: Record<PlanId, number> = {
  free: 10,
  pro: 75,
  studio: 250,
  plus: 1000,
};

export function normalizePlanId(plan: string | null | undefined): PlanId {
  if (plan === "pro" || plan === "studio" || plan === "plus") return plan;
  return "free";
}

export function planMonthlyLimit(plan: string | null | undefined): number {
  return PLAN_LIMITS[normalizePlanId(plan)];
}

/** Gens carried into the upgrade month (previous tier monthly limit, matches DB trigger). */
export function planUpgradeCarryoverBonus(previousPlan: string | null | undefined): number {
  return PLAN_LIMITS[normalizePlanId(previousPlan)];
}

/** Total monthly cap right after upgrading from previousPlan to nextPlan (excl. referral/level/purchased). */
export function planLimitAfterUpgrade(
  nextPlan: PlanId,
  previousPlan: string | null | undefined,
): number {
  return PLAN_LIMITS[nextPlan] + planUpgradeCarryoverBonus(previousPlan);
}

export type UserProfile = {
  id: string;
  plan: PlanId;
  loopsUsedThisMonth: number;
  email?: string | null;
  referralBonus?: number;
  levelBonus?: number;
  dailyBonusMonth?: number;
  purchasedBonus?: number;
  referralCode?: string | null;
  username?: string | null;
};

export type GenerateBeatInput = {
  genre: string;
  bpm: number;
  prompt: string;
  mood?: string;
  influence?: string;
  key?: string;
  scale?: string;
  loopLength?: LoopLength;
};

export const MOBILE_GENRES: { group: string; value: string; label: string }[] = [
  { group: "Trap / Hip-Hop", value: "Dark Trap", label: "Dark Trap" },
  { group: "Trap / Hip-Hop", value: "Melodic Trap", label: "Melodic Trap" },
  { group: "Trap / Hip-Hop", value: "Drill", label: "Drill" },
  { group: "Trap / Hip-Hop", value: "Lo-Fi Hip-Hop", label: "Lo‑Fi Hip Hop" },
  { group: "R&B / Soul", value: "Trapsoul", label: "Trap Soul" },
  { group: "R&B / Soul", value: "Contemporary R&B", label: "Contemporary R&B" },
  { group: "Afro / Latin", value: "Afrobeats", label: "Afrobeats" },
  { group: "Afro / Latin", value: "Reggaeton", label: "Reggaeton" },
  { group: "Electronic", value: "House", label: "House" },
  { group: "Electronic", value: "Pop", label: "Pop" },
  { group: "Electronic", value: "Brazilian Phonk", label: "Brazilian Phonk" },
];

export const MOBILE_SONG_GENRES: { group: string; value: string; label: string }[] = [
  { group: "Pop / R&B", value: "Pop", label: "Pop" },
  { group: "Pop / R&B", value: "Trapsoul", label: "Trap Soul" },
  { group: "Pop / R&B", value: "Contemporary R&B", label: "R&B" },
  { group: "Pop / R&B", value: "Melodic Trap", label: "Melodic Trap" },
  { group: "Pop / R&B", value: "French Pop", label: "French Pop" },
  { group: "Latin", value: "Reggaeton", label: "Reggaeton" },
  { group: "Latin", value: "Afrobeats", label: "Afrobeats" },
  { group: "Latin", value: "Latin Pop", label: "Latin Pop" },
  { group: "Electronic", value: "Hyperpop", label: "Hyperpop" },
  { group: "Electronic", value: "House", label: "House" },
  { group: "Hip-Hop", value: "Dark Trap", label: "Dark Trap" },
  { group: "Hip-Hop", value: "Drill", label: "Drill" },
];

export const MOBILE_BEAT_MOODS = ["Dark", "Happy", "Sad", "Chill", "Aggressive", "Dreamy"] as const;

export const MOBILE_LOOP_LENGTHS: LoopLength[] = ["4 bars", "8 bars", "16 bars"];

export const MOBILE_MUSICAL_KEYS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

export const MOBILE_SCALES = ["Minor", "Major"] as const;

export const MOBILE_VOCAL_STYLES = [
  { value: "Singer", label: "Singer" },
  { value: "Rapper", label: "Rapper" },
  { value: "Singer-Rapper", label: "Hybrid" },
  { value: "Choir", label: "Vocal group" },
] as const;

export type MobileVocalStyle = (typeof MOBILE_VOCAL_STYLES)[number]["value"];

export const DEFAULT_SONG = {
  genre: "Auto",
  loopLength: "16 bars" as LoopLength,
  description: "",
  lyrics: "",
};

export const DEFAULT_GENERATOR = {
  genre: "__random__",
  bpm: 140,
  mood: "Dark",
  influence: "No Influence",
  key: "A",
  scale: "Minor",
  loopLength: "8 bars" as LoopLength,
  swing: 0,
  energyLevel: "Medium",
  reverb: "Medium",
  prompt: "",
};

export {
  ALL_GENRE_OPTIONS,
  buildPrecisionGenreOptions,
  catalogGenreValues,
  findGenreOption,
  GENRE_CATALOG_COUNT,
  pickRandomCatalogGenreValue,
  PRIMARY_GENRE_VALUES,
} from "./genres/genreMenu";
export type { GenreDropdownOption } from "./genres/genrePickMode";
export {
  FROM_IDEA_GENRE_VALUE,
  genreSelectionHint,
  isCatalogGenreSelection,
  isFromIdeaGenreSelection,
  isRandomGenreSelection,
  pickRandomGenreValue,
  RANDOM_GENRE_VALUE,
  resolveGenreForGeneration,
  shouldPickRandomGenreAtGenerate,
} from "./genres/genrePickMode";
export * from "./generation/index";
export { resolveStemsDownloadUrl } from "./stemsDownload";
export * from "./prompt/inspirationAndDice";
export * from "./prompt/aceProse";
export {
  buildAceChatCompletionsParts,
  MELODY_COMPOSITION_ACE_RULES,
  ACE_SONG_LM_RULES,
  ACE_BEAT_LM_RULES,
  type BuildAceChatCompletionsInput,
} from "./prompt/aceChatCompletions";
export { resolveGenerationCaptionContext, type GenerationCaptionContext } from "./prompt/captionContext";
export {
  isPromptBankEnabled,
  isPromptBankLocale,
  shouldUsePromptBank,
  pickPromptBankRoll,
  getPromptBankDisplayPool,
  findPromptBankByDisplay,
  promptBankStats,
  type PromptBankRoll,
} from "./prompt/promptBank";
export {
  buildSingableLyricsFromBankEntry,
  hasPlaceholderBankLyrics,
  resolveBankLyrics,
} from "./prompt/promptBank/buildBankLyrics";
export { enhanceNaturalIdeaToAce, looksLikeNaturalUserIdea } from "./prompt/naturalIdeaToAce";
export {
  getCuratedDisplayPromptPool,
  mergeUniqueDisplayPrompts,
} from "./prompt/curated/index";
export {
  resolveCuratedPromptLocale,
  ACE_CURATED_PROMPT_LOCALES,
  type AceCuratedPromptLocale,
} from "./prompt/curatedPromptLocale";
export {
  findGenreDiceItemByDisplay,
  getGenreDiceAllDisplayPrompts,
  getGenreDiceDisplayPromptPool,
  getGenreDisplayLabel,
  pickRandomChipGenre,
  pickRandomGenreDice,
} from "./prompt/genreDicePool";
export {
  buildUnifiedDisplayPool,
  pickVariedDiceRoll,
  resolveDisplayToDiceRoll,
  type ResolvedDiceRoll,
} from "./prompt/variedDiceRoll";
export { getLocalizedStudioChipGenres, STUDIO_CHIP_GENRES, STUDIO_DICE_GENRES, type StudioGenreOption } from "./genres/studioGenres";
export {
  UI_LOCALES,
  LOCALE_LABELS,
  LOCALE_SHORT,
  DEFAULT_LOCALE,
  normalizeLocale,
  getDeviceAppLocale,
  vocalCodeToPromptLocale,
  type AppLocale,
} from "./i18n/locales";
export { VOCAL_LANGUAGES, vocalLanguageLabel, uiLocaleToAceVocalLanguage } from "./vocalLanguage";
export { looksLikeStructuredDisplayIdea } from "./displayPromptPatterns";
export type {
  DistributionReleaseType,
  DistributionReleaseStatus,
  DistributionOutletStatus,
  DistributionReleaseInput,
  DistributionReleaseRow,
  DistributionOutletRow,
  DistributionUsageSummary,
} from "./distribution/types";
export { DISTRIBUTION_OUTLET_LABELS } from "./distribution/types";
export {
  DISTRIBUTION_MONTHLY_QUOTA,
  canDistribute,
  canViewDistributionRoyalties,
  distributionMonthlyQuota,
  distributionPlanRank,
} from "./distribution/entitlements";
export { suggestLabelGridGenreName, PRODUCERHIT_TO_LABELGRID_GENRE } from "./distribution/genreMap";
export {
  DISTRIBUTION_COVER_SIZE,
  buildDistributionReadme,
  suggestDistributionGenre,
  type DistributionPackMetadata,
} from "./distribution/pack";
export {
  buildCoverGenerationSeed,
  withCoverCacheBust,
} from "./distribution/coverGenerationSeed";
export {
  COVER_LIGHTING_PRESETS,
  COVER_PROMPT_MAX_LENGTH,
  COVER_STYLE_PRESETS,
  buildCoverPromptSuggestionsFromLoop,
  buildStructuredCoverPrompt,
  canAccessDistributionAcademy,
  parseStructuredCoverPromptFromText,
  type StructuredCoverPromptInput,
} from "./distribution/coverPrompt";
export {
  COVER_SURPRISE_LIGHTING,
  COVER_SURPRISE_STYLES,
  getCoverSurpriseIdeasCount,
  getCoverSurpriseLibrary,
  pickCoverSurpriseSuggestion,
} from "./distribution/coverSurpriseLibrary";
export { buildLoopCardCoverPrompt } from "./distribution/loopCardCoverPrompt";
export {
  DISTRIBUTION_ACADEMY_MODULES,
  DISTRIBUTION_ACADEMY_VALUE_USD,
  type DistributionAcademyActionItem,
  type DistributionAcademyModule,
} from "./distribution/academyModules";
export {
  buildTrackLicenseDocument,
  buildTrackLicenseId,
  formatTrackLicenseAsText,
  planDisplayName,
  type BuildTrackLicenseInput,
  type LicenseLocale,
  type LicenseProfile,
  type TrackLicenseDocument,
} from "./commercialLicense";
