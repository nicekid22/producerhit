import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, toastImportant, toastLoading, toastSuccess, TOAST_DURATIONS } from "@/lib/appToast";
import { AppShell } from "@/components/AppShell";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";
import { GenrePickControl } from "@/components/dashboard/GenrePickControl";
import {
  FROM_IDEA_GENRE_VALUE,
  GENRE_PICK_MODE_STORAGE_KEY,
  isCatalogGenreSelection,
  isFromIdeaGenreSelection,
  isRandomGenreSelection,
  landingGenreForHandoff,
  pickRandomGenreValue,
  resolveGenreForGeneration,
  RANDOM_GENRE_VALUE,
  shouldPickRandomGenreAtGenerate,
} from "@/lib/genres/genrePickMode";
import { vocalLanguageAutoOption, vocalLanguageDropdownOptions, resolveSongVocalLanguage } from "@/lib/vocalLanguages";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/EmptyState";
import { useGeneratorStore } from "@/stores/generatorStore";
import { browserAceKeyCount } from "@/lib/aceBrowserKeys";
import {
  aceKeyPreferIndexForSlot,
  dualAdaptiveFallbackEnabled,
  dualGenerationEffectiveMode,
  dualGenerationStaggerMs,
  dualParallelStaggerMs,
  generationStrategySnapshot,
  dualBatchProdMonitoringEnabled,
  type DualGenerationMode,
} from "@/lib/generationStrategy";
import { estimateGenerationDurationMs, simulatedGenerationPercent } from "@/lib/generationProgress";
import { estimateSongDurationFromLyrics } from "@/lib/aceDuration";
import { resolveAceLyricsForMeta, defaultVocalLanguagePreference } from "@producerhit/shared";
import {
  formatGenerationErrorMessage,
  generationRetryDelayMs,
  isGenerationCapacityError,
  isRetryableGenerationError,
  markPriorityUpsellPrompted,
  shouldTriggerDualSequentialFallback,
  normalizeGenerationRawError,
  shouldPromptPriorityUpsellAfterCapacityError,
} from "@/lib/generationErrors";
import { resolvePlaybackUrlForLoop, useLoopsStore } from "@/stores/loopsStore";
import { unlockAudioPlaybackFromGesture } from "@/lib/audioPlaybackUnlock";
import {
  armGenerationAutoplay,
  autoplaySingleGenerationResult,
  createGenerationAutoplaySession,
} from "@/lib/generationAutoplay";
import {
  isSyncGenerationSessionActive,
  syncGenerationFinish,
  syncGenerationSlotPatch,
  syncGenerationSlots,
  syncGenerationStart,
  syncRemixGenerationFinish,
  syncRemixGenerationStart,
} from "@/lib/generationSessionSync";
import { useGenerationSessionStore } from "@/stores/generationSessionStore";
import { LOOP_COVER_REROLL_CREDIT_COST } from "@/lib/loopCoverReroll";
import { buildWorkspacePlaybackQueue } from "@/lib/workspacePlaybackQueue";
import type { Loop, LoopLength } from "@/types/loop";
import { usePlayerStore } from "@/stores/playerStore";
import { LoopCardItem } from "@/components/LoopCardItem";
import { LoopCardSkeleton } from "@/components/LoopCardSkeleton";
import { SpeechDictationField } from "@/components/SpeechDictationField";
import { VoiceLyricsImport } from "@/components/voice/VoiceLyricsImport";
import { VoicePickerCompact } from "@/components/voice/VoicePickerCompact";
import { readVoiceStudioPrefs, writeVoiceStudioPrefs } from "@/lib/voiceStudioPrefs";
import { buildAceVoiceCloneStemsFields, voiceCloneToastMessage } from "@/lib/voiceCloneMeta";
import { AlertTriangle, Copy, Search, SlidersHorizontal, X } from "lucide-react";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import { trackDashboardReady } from "@/lib/growthFunnelEvents";
import { DashboardGrowthModals } from "@/components/dashboard/DashboardGrowthModals";
import { MasteringModal } from "@/components/mastering/MasteringModal";
import { TagStudioModal } from "@/components/tagStudio/TagStudioModal";
import { notifyGamificationGeneration } from "@/components/growth/GamificationStrip";
import { DailyBonusBannerButton } from "@/components/growth/DailyBonusBannerButton";
import { DashboardPromoBillboard } from "@/components/growth/DashboardPromoBillboard";
import { CheckoutRecoveryBanner } from "@/components/billing/CheckoutRecoveryBanner";
import { FreeUpgradeStrip } from "@/components/billing/FreeUpgradeStrip";
import { pickLoopForSharePrompt, shouldShowSharePromptAfterGeneration } from "@/lib/sharePrompt";
import { trackFreeGenerationMilestones } from "@/lib/conversionMetrics";
import { markReferralInvitePromptShown, shouldShowReferralInvitePrompt } from "@/lib/referralPrompt";
import { ensureReferralCode } from "@/lib/referral";
import { loadPendingRemix, clearPendingRemix, type PendingRemix } from "@/lib/pendingRemix";
import {
  clearLandingPendingGeneration,
  landingGenreStrategyFromPrompt,
  readLandingPendingGeneration,
  type LandingPendingGeneration,
} from "@/lib/landingPendingGeneration";
import { isRemixVibeRecreateEnabled, getRemixVibeCopy } from "@/lib/remixVibeFallback";
import { prepareLoopVariantGeneration, variantResultTitle } from "@/lib/loopVariantGeneration";
import { loopToRemixSource } from "@/lib/remixSourceLoop";
import { ensureGenerationCatalogExtensions } from "@/lib/generationCatalogBootstrap";
import { completeOnboardingStepOnServer } from "@/lib/onboardingProgress";
import { useWavFormatCoachStore } from "@/stores/wavFormatCoachStore";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { useT } from "@/i18n";
import { pickFrEn } from "@/i18n/localized";
import { getRemainingBeats, PLAN_LIMITS, FREE_MASTERING_UPSELL_AT, getTotalGenerationLimit } from "@/lib/planLimits";
import { planPriceLabel } from "@/lib/planPricing";
import { runCheckoutWithAuth, runCreditPackCheckout } from "@/lib/billing";
import { getCreditPackCtaLabel } from "@/lib/creditPacks";
import { canDualGeneration, canExportWav } from "@/lib/planEntitlements";
import { hasLegalHolderName } from "@/lib/commercialLicenseDocument";
import {
  creditsBlockedReason,
  markExhaustedCreditsPromptShown,
  markLowCreditsPromptShown,
  shouldShowExhaustedCreditsPrompt,
  shouldShowLowCreditsPrompt,
  shouldShowPlanUpsell,
  shouldShowPostGenerationPrompt,
  recommendedUpgradePlan,
  type UpsellReason,
} from "@/lib/growthUpsell";
import { useGrowthUpsellStore } from "@/stores/growthUpsellStore";
import { RemixStudioPanel } from "@/components/dashboard/RemixStudioPanel";
import { CoverStudioPanel } from "@/components/dashboard/CoverStudioPanel";
import { coverResultTitle, prepareCoverGeneration } from "@/lib/coverGeneration";
import { generateBeat, generateBeatDualBatch, remixLoopAce } from "@/lib/audioApi";
import { startCoverPrefetch, consumeCoverPrefetch } from "@/lib/earlyCoverPrefetch";
import { persistPollinationsCardCoverForLoop } from "@/lib/pollinationsCardCoverPersist";
import { ACE_REMIX_UNAVAILABLE_COPY, AceRemixUnavailableError } from "@/lib/aceRemix";
import { buildAceCaption, type GenerateParams } from "@/lib/promptBuilder";
import { resolveGenerationCaptionContext } from "@/lib/promptEnhancer";
import { buildCoverPromptSnapshot, cn } from "@/lib/utils";
import { DashboardStudioBrand } from "@/components/dashboard/DashboardStudioBrand";
import { DASHBOARD_VOICE_SECTIONS_ENABLED, MOBILE_DASHBOARD_V2 } from "@/lib/featureFlags";
import { useIsCompactMobileViewport, useIsDesktop } from "@/hooks/useMediaQuery";
import { useMobileDashboardTab } from "@/hooks/useMobileDashboardTab";
import { useResolvedPlan } from "@/hooks/useResolvedPlan";
import { useAudioRetentionDailyNotice } from "@/hooks/useAudioRetentionDailyNotice";
import { DashboardMobileTabs } from "@/components/dashboard/DashboardMobileTabs";
import { MobileResultsToolbar } from "@/components/dashboard/MobileResultsToolbar";
import { GeneratorSection, generatorSectionPad } from "@/components/dashboard/GeneratorSection";
import { LoopDetailsPanel } from "@/components/dashboard/LoopDetailsPanel";
import { LoopDetailsSheet, LoopDetailsSheetHeader } from "@/components/dashboard/LoopDetailsSheet";
import { MasteringPanel } from "@/components/mastering/MasteringPanel";
import { DashboardGenerateButton } from "@/components/dashboard/DashboardGenerateButton";
import type { PanelGenerateBridge } from "@/components/dashboard/panelGenerateBridge";
import {
  GeneratorAdvancedOutputControls,
  VOCAL_STYLE_OPTIONS,
  type VocalStyleValue,
} from "@/components/dashboard/GeneratorAdvancedOutputControls";
import { IdeaPromptSection, DASHBOARD_PROMPT_ROWS } from "@/components/dashboard/IdeaPromptSection";
import { resolveRandomPromptLocale } from "@/lib/resolveRandomPromptLocale";
import { InspirationChipRow } from "@/components/dashboard/InspirationChipRow";
import { GenerationCreditAmount, GenerationCreditIcon } from "@/components/GenerationCreditIcon";
import { triggerBeatReady } from "@/lib/delight/moments";
import { loadGamification } from "@/lib/gamification";
import { profileLoadErrorMessage, readProfileCache, shouldShowProfileLoadToast, syncProfileCache, type UserProfileRow } from "@/lib/profileBootstrap";
import { beatAmbianceDropdownOptions } from "@/lib/beatAmbiance";
import { beatEnergyDropdownOptions } from "@/lib/beatEnergy";
import { beatInfluenceDropdownOptions } from "@/lib/beatInfluence";

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

const keyOptions = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const scaleOptions: DropdownOption[] = [
  { value: "Major", label: "Major" },
  { value: "Minor", label: "Minor" },
  { value: "Diminished", label: "Diminished" },
  { value: "Pentatonic", label: "Pentatonic" },
];
const reverbOptions: DropdownOption[] = [
  { value: "Dry", label: "Dry" },
  { value: "Subtle", label: "Subtle" },
  { value: "Medium", label: "Medium" },
  { value: "Heavy", label: "Heavy" },
];

const lengths: LoopLength[] = ["2 bars", "4 bars", "8 bars", "16 bars"];

const bpmPresets = [
  { label: "Chill", value: 110 },
  { label: "Mid", value: 140 },
  { label: "Fast", value: 170 },
] as const;
const songDurationPresets = [15, 30, 45] as const;
const timeSignatureOptions = ["2/4", "3/4", "4/4", "6/8"] as const;
const genreInspirationChips: Record<string, readonly string[]> = {
  "Contemporary Rap": ["Hard Drums", "808/Sub", "Minimal Melody", "Bouncy Hats", "Ear Candy", "Modern"],
  "Lo-Fi Hip-Hop": ["Vintage", "Sad", "Vinyl", "Rain", "Night City", "Study"],
  "90s R&B": ["Live Keys", "Rhodes", "Soulful Chords", "Swinging Drums", "Warm Tape", "Smooth Groove"],
  Trapsoul: ["Smooth 808", "Half-time", "Dark Pads", "Tight Hats", "Woozy Melody", "Emotional"],
  "Melodic Trap": ["Hip-Hop Trap", "Atlanta", "Emotional Guitar", "Airy Pads", "808 Glides", "Space For Vocals"],
  "Jersey Drill": ["Kick Clusters", "Stop/Start", "808 Slides", "Dark Motif", "Bouncy Pocket", "Hype"],
  "Contemporary R&B": ["Polished", "Lush Chords", "Clean Drums", "Modern", "Sub Bass", "Hooky"],
  "R&B Alternative": ["Moody", "Minimal", "Texture", "Off-Kilter Drums", "Airy Pads", "Deep"],
  "Lo-fi R&B": ["Warm Tape", "Dusty", "Chill", "Soft Drums", "Late Night", "Vinyl"],
  "Neo Soul": ["Jazzy Chords", "Organic Feel", "Laid-back", "Live Bass", "Soulful", "Warm"],
  "Old School Hip-Hop": ["Boom Bap", "Chopped Samples", "Vinyl Dust", "MPC Swing", "Scratches", "Jazz/Soul"],
  "UK Drill": ["Dark Melody", "Sliding 808", "Off-beat Hats", "Aggressive", "Minor Key", "Street"],
  Afrobeats: ["Percussion Heavy", "Bright Guitar", "Danceable", "West African", "Rhythmic", "Uplifting"],
  Amapiano: ["Log Drum", "Deep Bass", "Piano Keys", "Shuffle", "South African", "Smooth", "Shakers"],
  House: ["4-on-the-floor", "Groovy Bass", "Chord Stabs", "Hi-hats", "Uplifting", "Club"],
  Pop: ["Catchy", "Bright", "Commercial", "Modern", "Upbeat", "Radio-ready"],
  "UK Garage": ["2-Step", "Syncopated", "Bouncy Bass", "Swing", "Vocal Chops", "London Vibe"],
  "Jersey Club": ["Fast Kicks", "Club Bounce", "Chopped Vocals", "Bed Squeak", "High Energy"],
  Electro: ["Punchy Bass", "Sidechain", "Bright Synths", "Club", "Clean Mix", "Energy"],
  "Video Game": ["Arps", "Chiptune", "Loopable", "Bright Motif", "SFX", "Bouncy"],
  "Pop Rock": ["Guitar Hook", "Big Chorus", "Live Drums", "Bright", "Uplifting", "Radio"],
  Rock: ["Distorted Guitars", "Driving Drums", "Energy", "Anthem", "Riffs", "Punchy"],
  Hyperpop: ["Kawaii", "Gaming", "Glitchy", "Distorted", "Fast", "Maximal"],
  "Baile Funk": ["Funk Mandelão", "Distorted Kick", "Sharp Snare", "Saw Lead", "DJ Drops", "Favela Energy"],
  Afrotrap: ["Hybrid Drums", "Aggressive Afro", "Heavy 808", "Rhythmic", "High Energy"],
  Dancehall: ["Island Vibe", "Club Energy", "Heavy Bass", "Rhythmic", "Tropical", "Summer"],
  Country: ["Acoustic Guitar", "Live Drums", "Warm Bass", "Lead Guitar", "Anthemic", "Emotional"],
  PluggnB: ["Plucky Synths", "Bouncy 808", "Soft Drums", "Airy", "Melodic", "Internet"],
  Rage: ["Distorted Lead", "Hype", "Aggressive", "Fast Hats", "Big Drops", "Energy"],
  "Cloud Rap": ["Dreamy", "Washed Reverb", "Airy Pads", "Soft 808", "Float", "Wide"],
  "Emo Rap": ["Sad Guitar", "Emotional", "Melodic", "Trap Drums", "Vulnerable", "Minor"],
  "Sad Rap": ["Melancholic", "Minor Chords", "Soft Drums", "Deep Sub", "Late Night", "Vibes"],
  "Atmospheric Rap": ["Airy Pads", "Minimal Drums", "Wide Space", "Moody", "Hypnotic", "Modern"],
  "Emotional Trap": ["Cinematic Chords", "Melodic", "Deep 808", "Emotional", "Modern Drums", "Space"],
  "Ambient Trap": ["Spacious Pads", "Minimal", "Deep Sub", "Hypnotic", "Texture", "Airy"],
  "Cinematic Trap": ["Cinematic", "Big Drums", "Dark", "Trailer", "Impacts", "Transitions"],
  "Experimental Trap": ["Glitchy", "Weird Textures", "Warped 808", "Unusual", "Futuristic", "Surprise"],
  "Sample Drill": ["Chopped Sample", "Gritty", "808 Slides", "Dark", "Drill Drums", "Underground"],
  "Melodic Drill": ["Emotional Melody", "808 Slides", "Dark", "Hooky", "Crisp Drums", "Street"],
  "Dark R&B": ["Moody", "Sparse", "Deep Sub", "Minor Chords", "Nocturnal", "Tension"],
  "Future R&B": ["Futuristic", "Glossy", "Airy", "Clean Drums", "Deep Sub", "Space"],
  "Afro R&B": ["Smooth", "Afro Perc", "Warm Guitar", "Sensual", "Modern", "Groove"],
  "Toxic R&B": ["Dark", "Sensual", "Cold Pads", "Tension", "Deep Sub", "Modern"],
  "Afro House": ["Afro Perc", "House Groove", "Hypnotic", "Club", "Warm Chords", "Deep Bass"],
  Latin: ["Latin Perc", "Danceable", "Catchy", "Warm Bass", "Club", "Bright"],
  Reggae: ["Skank Guitar", "Deep Bass", "One Drop", "Warm", "Sunny", "Laid-back"],
  "K-Pop": ["Glossy", "Catchy", "Bright", "Punchy Drums", "Modern", "Hook"],
  "Indie Pop": ["Warm", "Dreamy", "Guitars", "Soft Drums", "Understated", "Hooky"],
  "Dream Pop": ["Hazy", "Reverb", "Soft Drums", "Airy", "Lush", "Float"],
  "Dance Pop": ["Upbeat", "Bright Hook", "Punchy Drums", "Club", "Clean", "Radio"],
  "Viral TikTok": ["Hook First", "Catchy", "Short", "Memorable", "Clean Mix", "Earworm"],
  "Viral TikTok Pop": ["Catchy Hook", "Bright", "Punchy", "Glossy", "Earworm", "Pop"],
  EDM: ["Build-up", "Drop", "Big Synths", "Festival", "Energy", "Wide"],
  Chillstep: ["Chill", "Uplifting", "Atmospheric", "Sidechain", "Smooth", "Melodic"],
  Dubstep: ["Heavy Bass", "Half-time", "Aggressive", "Dark", "Drops", "Sound Design"],
  Vaporwave: ["Nostalgic", "Hazy", "Tape", "Retro", "Dreamy", "Soft"],
  Synthwave: ["Retro Synths", "Neon", "Arps", "Driving", "Cinematic", "Nostalgia"],
  "Witch House": ["Dark", "Hazy", "Occult", "Slow", "Distorted", "Atmospheric"],
  Glitchcore: ["Glitch", "Stutter", "Chaotic", "Digital", "Fast", "Edits"],
  Digicore: ["Internet", "Bright Synths", "Glitchy", "808s", "Energetic", "Hooks"],
  "Brazilian Phonk": ["Cowbell", "Aggressive", "Club", "Distorted Bass", "Fast", "Raw"],
  VinaHouse: ["Fast", "Bouncy", "Festival", "Bright Lead", "Hard Drums", "Energy"],
  "Study Beats": ["Lo-fi", "Warm Chords", "Soft Drums", "Calm", "Focus", "Vinyl"],
  Jazz: ["Live Feel", "Rich Chords", "Swing", "Warm", "Bass", "Expressive"],
  "New Jazz": ["Jazzy Chords", "Modern", "Tight Pocket", "Clean", "Warm Bass", "Texture"],
  Classical: ["Orchestral", "Strings", "Piano", "Dynamics", "Cinematic", "Hall"],
  Opera: ["Dramatic", "Orchestral", "Grand", "Hall Reverb", "Power", "Theme"],
  Oriental: ["Scales", "Oud", "Darbuka", "Ornaments", "Cinematic", "Hypnotic"],
  "Guitar Acoustic Live": ["Live", "Acoustic", "Natural Room", "Fingerpicking", "Intimate", "Warm"],
  "Piano Acoustic Live": ["Live", "Piano", "Natural Room", "Dynamics", "Intimate", "Warm"],
  "Rage + Ambient": ["Rage Lead", "Ambient Pads", "Ethereal", "Big Drops", "Wide", "Hype"],
  "Holographic R&B": ["Shimmer", "Glossy Chords", "Neon", "Smooth Drums", "Future", "Sensual"],
  "Futuristic Trap Soul": ["Trap Soul", "Futuristic", "Emotional", "808", "Clean Drums", "Airy"],
  "Ambient Drill": ["Drill Drums", "Ambient Pads", "Cold", "Wide", "Minimal", "808 Slides"],
  "Cinematic Afro Trap": ["Afro Perc", "Trap Drums", "Cinematic", "Big Transitions", "Energy", "Hybrid"],
  "AI-assisted Pop": ["Modern Pop", "Futuristic", "Catchy Hook", "Clean", "Polished", "Earworm"],
  "Experimental Afro House": ["Afro House", "Experimental", "Futuristic", "Hypnotic", "Textures", "Club"],
  "Hyper Melodic Rap": ["Hooky", "Melodic", "Emotional", "Modern Drums", "Bright", "Vocal Space"],
  "Dark Atmospheric Pop": ["Moody", "Cinematic", "Pop Drums", "Dark", "Hooky", "Wide"],
  "Y2K Futuristic Pop": ["Y2K", "Glossy", "2000s", "Future", "Catchy", "Ear Candy"],
  "Hybrid Electronic Rap": ["Rap Drums", "Electronic", "Club", "Sound Design", "Tight", "Energy"],
  "Sci-Fi R&B": ["Alien Textures", "Moody", "Wide", "Deep Sub", "Minimal", "Future"],
  "Ethereal Trap": ["Airy", "Shimmer", "Dreamy", "Minimal Drums", "Deep 808", "Float"],
  "Nostalgic Future Beats": ["Nostalgic", "Future", "Warm Chords", "Shimmer", "Modern Drums", "Retro"],
};

const defaultInspirationChips = ["Dark", "Melodic", "Emotional", "Hard", "Smooth", "Atmospheric"] as const;

function getInspirationChipsForGenre(genre: string) {
  return (genreInspirationChips[genre] ?? defaultInspirationChips) as readonly string[];
}

function parseKeyScale(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { key: "", scale: "" };
  if (parts.length === 1) return { key: parts[0], scale: "" };
  return { key: parts[0], scale: parts.slice(1).join(" ") };
}

const presets = [
  {
    name: "Trapsoul — OG Parker",
    genre: "Trapsoul",
    influence: "OG Parker",
    bpm: 140,
    mood: "Melancholic",
    energyLevel: "Medium",
    loopLength: "8 bars" as LoopLength,
    prompt: "dark melodic trap, smooth 808s, emotional",
    key: "F#",
    scale: "Minor",
  },
  {
    name: "Drill — Aggressive",
    genre: "Drill",
    influence: "Southside",
    bpm: 150,
    mood: "Aggressive",
    energyLevel: "High",
    loopLength: "8 bars" as LoopLength,
    prompt: "hard hitting drums, sliding 808s, dark synth stabs",
    key: "G",
    scale: "Minor",
  },
  {
    name: "Melodic Trap — Dreamy",
    genre: "Melodic Trap",
    influence: "Metro Boomin",
    bpm: 140,
    mood: "Dreamy",
    energyLevel: "Medium",
    loopLength: "16 bars" as LoopLength,
    prompt: "hip-hop trap (Atlanta), emotional guitar/piano motif, airy pads, crisp hats, 808 glides, space for melodic rap",
    key: "A",
    scale: "Minor",
  },
  {
    name: "Old School — Boom Bap",
    genre: "Old School Hip-Hop",
    influence: "Pete Rock",
    bpm: 92,
    mood: "Nostalgic",
    energyLevel: "Chill",
    loopLength: "8 bars" as LoopLength,
    prompt: "chopped soul/jazz sample, dusty drums, MPC swing, subtle scratches",
    key: "F",
    scale: "Minor",
  },
  ] as const;

function barsFromLoopLength(loopLength: LoopLength) {
  const n = Number(loopLength.split(" ")[0]);
  return Number.isFinite(n) && n > 0 ? n : 4;
}

export default function Dashboard() {
  type GenerationSlot = {
    idx: 1 | 2;
    status: "queued" | "waiting" | "generating" | "error";
    errorText?: string;
    seed?: number;
    title: string;
    visible: boolean;
    previewReady?: boolean;
    previewLoopId?: string;
    /** Loop persistée — évite de perdre la carte si la preview a déjà été remplacée. */
    savedLoopId?: string;
    generationKey?: string;
    /** Estimation locale — pas un % renvoyé par ACE. */
    progressPct?: number;
  };

  const navigate = useNavigate();

  useEffect(() => {
    ensureGenerationCatalogExtensions();
  }, []);

  const form = useGeneratorStore((s) => s.form);
  const setField = useGeneratorStore((s) => s.setField);
  const setBpm = useGeneratorStore((s) => s.setBpm);
  const setLoopLength = useGeneratorStore((s) => s.setLoopLength);
  const loops = useLoopsStore((s) => s.loops);
  const loopsTotalCount = useLoopsStore((s) => s.loopsTotalCount);
  const loopsLoading = useLoopsStore((s) => s.loading);
  const loopsHydrated = useLoopsStore((s) => s.loopsHydrated);
  const loopsSyncError = useLoopsStore((s) => s.lastSyncError);
  const loadMyLoops = useLoopsStore((s) => s.loadMyLoops);
  const durationsSecById = useLoopsStore((s) => s.durationsSecById);
  const createLoop = useLoopsStore((s) => s.createLoop);
  const upsertLoop = useLoopsStore((s) => s.upsertLoop);
  const enqueuePendingSave = useLoopsStore((s) => s.enqueuePendingSave);
  const removeLoop = useLoopsStore((s) => s.removeLoop);
  const primeAudioCache = useLoopsStore((s) => s.primeAudioCache);
  const migrateAudioCache = useLoopsStore((s) => s.migrateAudioCache);
  const renameLoopRemote = useLoopsStore((s) => s.renameLoopRemote);
  const togglePublicRemote = useLoopsStore((s) => s.togglePublicRemote);
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const authProfile = useAuthStore((s) => s.profile);
  const profileReady = useAuthStore((s) => s.profileReady);
  const { plan: billingPlan, ready: billingPlanReady, bannersReady: billingBannersReady } = useResolvedPlan();
  const refreshAuthProfile = useAuthStore((s) => s.refreshProfile);
  const authProfileError = useAuthStore((s) => s.lastError);
  const locale = useLocaleStore((s) => s.locale);
  const { m: t } = useT();
  const d = t.dashboard;
  const ambianceDropdownOptions = useMemo(() => beatAmbianceDropdownOptions(locale), [locale]);
  const energyDropdownOptions = useMemo(() => beatEnergyDropdownOptions(locale), [locale]);
  const influenceDropdownOptions = useMemo(() => beatInfluenceDropdownOptions(locale), [locale]);
  const isDesktop = useIsDesktop();
  const compactMobile = useIsCompactMobileViewport();
  const mobileV2 = MOBILE_DASHBOARD_V2 && !isDesktop;
  const mobileSectionDefaultOpen = !compactMobile;
  const { tab: mobileTab, setTab: setMobileTab, goResults, goMaster, goCreate } = useMobileDashboardTab("create");
  const hasPlayer = usePlayerStore((s) => !!s.current);
  const [generating, setGenerating] = useState(false);
  const [generationSlots, setGenerationSlots] = useState<GenerationSlot[] | null>(null);
  const [workspaceJobs, setWorkspaceJobs] = useState<Array<{ id: string; title: string; sub: string }>>([]);
  const [versions, setVersions] = useState<1 | 2>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("producerhit_versions") : null;
    if (saved === "1") return 1;
    if (saved === "2") return 2;
    return 1;
  });
  const [plan, setPlan] = useState("free");
  const planRef = useRef("free");
  const [usedThisMonth, setUsedThisMonth] = useState(0);
  const [voiceToSongUsed, setVoiceToSongUsed] = useState(0);
  const [voiceCloneUsed, setVoiceCloneUsed] = useState(0);
  const [activeVoiceProfileId, setActiveVoiceProfileId] = useState<string | null>(null);
  const [voiceCloneStrength, setVoiceCloneStrength] = useState(0.72);
  const voiceCloneConfigRef = useRef<{ profileId: string | null; strength: number }>({ profileId: null, strength: 0.72 });
  const [referralBonus, setReferralBonus] = useState(0);
  const [purchasedBonus, setPurchasedBonus] = useState(0);
  const [levelBonus, setLevelBonus] = useState(0);
  const [dailyBonusMonth, setDailyBonusMonth] = useState(0);
  const [profileLoading, setProfileLoading] = useState(false);
  const openUpsell = useGrowthUpsellStore((s) => s.openUpsell);
  const [shareMomentLoop, setShareMomentLoop] = useState<Loop | null>(null);
  const [referralPromptOpen, setReferralPromptOpen] = useState(false);
  const [referralCodeForPrompt, setReferralCodeForPrompt] = useState<string | null>(null);
  const pendingReferralAfterShareRef = useRef(false);
  const generateSessionRef = useRef(0);
  const referralPromptTimerRef = useRef<number | null>(null);
  const dashboardMountedAtRef = useRef(Date.now());
  const generationAbandonTrackedRef = useRef(false);
  const generationStartedAtRef = useRef<number | null>(null);

  const hydrateGenerationFromStore = useCallback(() => {
    const snap = useGenerationSessionStore.getState();
    const hasVisibleSlots = Boolean(snap.slots?.some((s) => s.visible));
    if (!snap.generating && snap.phase !== "done" && !hasVisibleSlots) return;
    if (snap.sessionId > 0) generateSessionRef.current = snap.sessionId;
    setGenerating(snap.generating);
    if (snap.slots) setGenerationSlots(snap.slots as GenerationSlot[]);
    if ((snap.generating || snap.phase === "done") && mobileV2) goResults();
  }, [goResults, mobileV2]);

  useEffect(() => {
    hydrateGenerationFromStore();
  }, [hydrateGenerationFromStore]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") hydrateGenerationFromStore();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [hydrateGenerationFromStore]);
  const [externalRemix, setExternalRemix] = useState<PendingRemix | null>(null);
  const [masteringUpsellLoop, setMasteringUpsellLoop] = useState<Loop | null>(null);
  const [gamificationRefreshKey, setGamificationRefreshKey] = useState(0);
  const usedCountRef = useRef(usedThisMonth);
  const [workspaceView, setWorkspaceView] = useState<"tracks" | "master">("tracks");
  const [masterLoopId, setMasterLoopId] = useState<string | null>(null);
  const [entrySource, setEntrySource] = useState<string>("unknown");
  const [audioFormat, setAudioFormat] = useState<"mp3" | "wav">("mp3");
  const audioFormatTouchedRef = useRef(false);
  const setAudioFormatPref = (fmt: "mp3" | "wav") => {
    audioFormatTouchedRef.current = true;
    setAudioFormat(fmt);
  };
  const [query, setQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [requestedTitle, setRequestedTitle] = useState(() => {
    try {
      return window.localStorage.getItem("producerhit_requested_title") || "";
    } catch {
      return "";
    }
  });
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [distributionLoop, setDistributionLoop] = useState<Loop | null>(null);
  const [activeTagLoopId, setActiveTagLoopId] = useState<string | null>(null);
  const [masteringModalLoop, setMasteringModalLoop] = useState<Loop | null>(null);

  const openDistribution = useCallback((loop: Loop) => {
    setDetailsId(loop.id);
    setDistributionLoop(loop);
  }, []);
  const openTagStudio = useCallback((loop: Loop) => {
    setDetailsId(loop.id);
    setActiveTagLoopId(loop.id);
  }, []);
  const openMasteringModal = useCallback((loop: Loop) => {
    setDetailsId(loop.id);
    setMasteringModalLoop(loop);
  }, []);
  const [mode, setMode] = useState<"beat" | "song" | "remix" | "cover">(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("producerhit_mode") : null;
    if (saved === "remix") return "remix";
    if (saved === "cover") return "cover";
    return saved === "beat" ? "beat" : "song";
  });
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("producerhit_advanced") : null;
    return saved === "true";
  });
  const engine = "ace-step" as const;
  const [lyricsMode, setLyricsMode] = useState<"ai" | "manual">("manual");
  const [songUiMode, setSongUiMode] = useState<"simple" | "custom">("simple");
  const [lastRandomGenre, setLastRandomGenre] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [songDescription, setSongDescription] = useState("");
  const [songVocalStyle, setSongVocalStyle] = useState<VocalStyleValue>("Singer");
  const [songTempoMode, setSongTempoMode] = useState<"auto" | "manual">("auto");
  const [songKeyMode, setSongKeyMode] = useState<"auto" | "manual">("auto");
  const [beatTempoMode, setBeatTempoMode] = useState<"auto" | "manual">("auto");
  const [beatKeyMode, setBeatKeyMode] = useState<"auto" | "manual">("auto");
  const [songDurationMode, setSongDurationMode] = useState<"auto" | "manual">("auto");
  const [songTimeSignatureMode, setSongTimeSignatureMode] = useState<"auto" | "manual">("auto");
  const [songVocalLanguageMode, setSongVocalLanguageMode] = useState<"auto" | "manual">("auto");
  const [manualVocalLanguage, setManualVocalLanguage] = useState("en");

  const beatPromptLocale = useMemo(
    () => resolveRandomPromptLocale({ surface: "dashboard-beat", uiLocale: locale }),
    [locale],
  );
  const songPromptLocale = useMemo(
    () =>
      resolveRandomPromptLocale({
        surface: "dashboard-song",
        uiLocale: locale,
        vocalLanguageMode: songVocalLanguageMode,
        manualVocalLanguage,
      }),
    [locale, songVocalLanguageMode, manualVocalLanguage],
  );
  const beatAceOverrideRef = useRef<string | null>(null);
  const songAceOverrideRef = useRef<string | null>(null);
  const songBankDiceRef = useRef(false);

  useEffect(() => {
    beatAceOverrideRef.current = null;
    songAceOverrideRef.current = null;
    songBankDiceRef.current = false;

    const vocalPref = defaultVocalLanguagePreference(locale);
    setSongVocalLanguageMode(vocalPref.mode);
    setManualVocalLanguage(vocalPref.manualCode);
  }, [locale]);
  const songRotatingPlaceholderRef = useRef("");
  const beatRotatingPlaceholderRef = useRef("");
  const [songDurationSec, setSongDurationSec] = useState(30);
  const [songTimeSignature, setSongTimeSignature] = useState<(typeof timeSignatureOptions)[number]>("4/4");
  const [beatInstrumental] = useState(true);
  const [autoGeneratePending, setAutoGeneratePending] = useState(false);
  const [pendingLandingRequest, setPendingLandingRequest] = useState<LandingPendingGeneration | null>(null);
  const [externalSeed, setExternalSeed] = useState<number | null>(null);
  const landingFormAppliedRef = useRef(false);
  const autoLandingGenerateRef = useRef(false);
  const [landingAutoGenQueued, setLandingAutoGenQueued] = useState(false);
  type LandingGenerateSnapshot = {
    prompt: string;
    acePrompt?: string;
    mode: "beat" | "song";
    genre: string;
    genreStrategy: "from_idea" | "random";
  };
  const landingGenerateSnapshotRef = useRef<LandingGenerateSnapshot | null>(null);
  const debugEnabled = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("debug") === "1";
    } catch {
      return false;
    }
  }, []);

  const applyProfile = useCallback((data: UserProfileRow) => {
    planRef.current = data.plan;
    setPlan(data.plan);
    setUsedThisMonth(data.loops_used_this_month);
    setVoiceToSongUsed(data.voice_to_song_used_this_month ?? 0);
    setVoiceCloneUsed(data.voice_clone_used_this_month ?? 0);
    setReferralBonus(data.referral_bonus);
    setPurchasedBonus(data.purchased_bonus ?? 0);
    setLevelBonus(data.level_bonus);
    setDailyBonusMonth(data.daily_bonus_month);
    if (user?.id) {
      syncProfileCache(data.plan, data.loops_used_this_month, user.id, {
        referral_bonus: data.referral_bonus,
        purchased_bonus: data.purchased_bonus ?? 0,
        level_bonus: data.level_bonus,
        daily_bonus_month: data.daily_bonus_month,
      });
    } else syncProfileCache(data.plan, data.loops_used_this_month);
    toast.dismiss("dashboard-profile-load");
  }, [user?.id]);

  const refreshProfile = useCallback(async (opts?: { silent?: boolean }) => {
    if (!user) return planRef.current;
    const userId = user.id;
    if (!opts?.silent) setProfileLoading(true);
    try {
      const data = await refreshAuthProfile();
      if (useAuthStore.getState().user?.id !== userId) return planRef.current;
      if (data) {
        applyProfile(data);
        return data.plan;
      }
      return planRef.current;
    } catch (err) {
      if (useAuthStore.getState().user?.id !== userId) return planRef.current;
      if (shouldShowProfileLoadToast(err)) {
        toast.error(profileLoadErrorMessage(err, locale), { id: "dashboard-profile-load" });
      }
      return planRef.current;
    } finally {
      if (!opts?.silent) setProfileLoading(false);
    }
  }, [applyProfile, locale, refreshAuthProfile, user]);

  const openReferralPromptIfEligible = useCallback(async () => {
    if (planRef.current !== "free") return;
    if (!shouldShowReferralInvitePrompt()) return;

    let code = authProfile?.referral_code ?? null;
    if (!code) {
      code = await ensureReferralCode();
      if (code) void refreshAuthProfile();
    }
    if (!code) return;

    markReferralInvitePromptShown();
    setReferralCodeForPrompt(code);
    setReferralPromptOpen(true);
    trackClientEvent("referral_prompt_shown", { source: "post_first_gen" });
  }, [authProfile?.referral_code, refreshAuthProfile]);

  const scheduleReferralPrompt = useCallback(
    (delayMs: number) => {
      if (referralPromptTimerRef.current) window.clearTimeout(referralPromptTimerRef.current);
      referralPromptTimerRef.current = window.setTimeout(() => {
        referralPromptTimerRef.current = null;
        void openReferralPromptIfEligible();
      }, delayMs);
    },
    [openReferralPromptIfEligible],
  );

  const openBillboardShare = useCallback(() => {
    const loopList = useLoopsStore.getState().loops;
    const shareLoop = pickLoopForSharePrompt(loopList, [], loopList[0]?.id ?? "") ?? loopList[0] ?? null;
    if (!shareLoop) {
      toast.error(d.generateTrackFirst);
      return;
    }
    trackClientEvent("growth_billboard_share", { loop_id: shareLoop.id, source: "dashboard_billboard" });
    setShareMomentLoop(shareLoop);
  }, [locale]);

  const openBillboardReferral = useCallback(async () => {
    let code = authProfile?.referral_code ?? referralCodeForPrompt ?? null;
    if (!code) {
      code = await ensureReferralCode();
      if (code) void refreshAuthProfile();
    }
    if (!code) {
      toast.error(d.linkUnavailable);
      return;
    }
    setReferralCodeForPrompt(code);
    setReferralPromptOpen(true);
    trackClientEvent("referral_prompt_shown", { source: "dashboard_billboard" });
  }, [authProfile?.referral_code, locale, referralCodeForPrompt, refreshAuthProfile]);

  const openBillboardCommunity = useCallback(() => {
    navigate("/community");
  }, [navigate]);

  const openBillboardMastering = useCallback(() => {
    setWorkspaceView("master");
    if (mobileV2) goMaster();
    trackClientEvent("dashboard_billboard_mastering", { source: "spotlight" });
  }, [goMaster, mobileV2]);

  const openBillboardProgress = useCallback(() => {
    navigate("/settings#progression");
    trackClientEvent("dashboard_billboard_progress", { source: "spotlight" });
  }, [navigate]);

  const openBillboardPricing = useCallback(() => {
    trackClientEvent("dashboard_billboard_pricing", { source: "spotlight" });
    if (planRef.current === "free") {
      void runCheckoutWithAuth({ plan: "pro", location: "dashboard_billboard", locale });
      return;
    }
    navigate("/pricing");
  }, [locale, navigate]);

  const openBillboardProfile = useCallback(() => {
    navigate("/settings");
    trackClientEvent("dashboard_billboard_profile", { source: "spotlight" });
  }, [navigate]);

  const openBillboardCreate = useCallback(() => {
    if (mobileV2) goCreate();
    else window.scrollTo({ top: 0, behavior: "smooth" });
    trackClientEvent("dashboard_billboard_create", { source: "spotlight" });
  }, [goCreate, mobileV2]);

  useEffect(() => {
    return () => {
      if (referralPromptTimerRef.current) window.clearTimeout(referralPromptTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (authProfile) applyProfile(authProfile);
  }, [applyProfile, authProfile]);

  /** Plan free / Pro : ×1 par défaut. Studio+ : ×2 sauf choix explicite en localStorage. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("producerhit_versions");
    if (saved === "1") return;
    if (saved === "2") {
      if (!canDualGeneration(plan)) setVersions(1);
      return;
    }
    if (canDualGeneration(plan)) setVersions(2);
    else setVersions(1);
  }, [plan]);

  useEffect(() => {
    if (!user?.id) return;
    const cached = readProfileCache(user.id);
    if (!cached) return;
    planRef.current = cached.plan;
    setPlan(cached.plan);
    setUsedThisMonth(cached.usedThisMonth);
    setReferralBonus(cached.referralBonus);
    setPurchasedBonus(cached.purchasedBonus);
    setLevelBonus(cached.levelBonus);
    setDailyBonusMonth(cached.dailyBonusMonth);
  }, [user?.id]);

  useEffect(() => {
    if (authProfile) {
      toast.dismiss("dashboard-profile-load");
      return;
    }
    if (!profileReady || !authProfileError) return;
    if (!shouldShowProfileLoadToast(authProfileError)) return;
    toast.error(profileLoadErrorMessage(authProfileError, locale), { id: "dashboard-profile-load" });
  }, [authProfile, authProfileError, locale, profileReady]);

  const profileSyncing = authStatus === "ready" && !!user && !profileReady;
  const profileBusy = profileLoading || profileSyncing;
  const profileCacheSnapshot = useMemo(
    () => (user?.id ? readProfileCache(user.id) : null),
    [user?.id, authProfile, plan, usedThisMonth, referralBonus, levelBonus, dailyBonusMonth],
  );
  const hasQuotaSnapshot = Boolean(authProfile || profileCacheSnapshot);
  const showQuotaLoading = profileBusy && !hasQuotaSnapshot;
  const quotaReady = !profileSyncing || hasQuotaSnapshot;

  useAudioRetentionDailyNotice({
    locale,
    loops,
    loopsReady: profileReady && loopsHydrated && !loopsLoading,
    plan: authProfile?.plan ?? plan,
    planReady: billingBannersReady && profileReady,
    hostedAudioExpiresAt: authProfile?.hosted_audio_expires_at ?? null,
  });

  const detailsLoop = useMemo(() => {
    if (!detailsId) return null;
    return loops.find((l) => l.id === detailsId) ?? null;
  }, [detailsId, loops]);

  const [detailsTitle, setDetailsTitle] = useState("");
  const [savingDetailsTitle, setSavingDetailsTitle] = useState(false);
  useEffect(() => {
    setDetailsTitle(detailsLoop?.name ?? "");
  }, [detailsLoop?.id, detailsLoop?.name]);

  useEffect(() => {
    const hasActiveGeneration =
      generating || (generationSlots?.some((s) => s.visible && s.status === "generating") ?? false);
    if (!hasActiveGeneration) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [generating, generationSlots]);

  useEffect(() => {
    if (plan === "free" && audioFormat !== "mp3") setAudioFormat("mp3");
  }, [audioFormat, plan]);

  useEffect(() => {
    if (!user?.id || !profileReady || !authProfile) return;
    try {
      const key = `producerhit_dashboard_welcome_${user.id}`;
      if (window.localStorage.getItem(key)) return;
      if (authProfile.loops_used_this_month > 0) {
        window.localStorage.setItem(key, "1");
        return;
      }
      window.localStorage.setItem(key, "1");
      toast(d.studioLoaded, { icon: "✨" });
    } catch {
      void 0;
    }
  }, [authProfile, d.studioLoaded, profileReady, user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      trackClientEvent("subscription_activated", { source: "stripe_return" });
      toast.success(d.paymentReceived);
      window.history.replaceState({}, "", "/dashboard");
      void (async () => {
        for (let i = 0; i < 8; i++) {
          const fromStore = await refreshAuthProfile().catch(() => null);
          const nextPlan = fromStore?.plan ?? (await refreshProfile());
          if (nextPlan && nextPlan !== "free") {
            toast.success(`${d.planActivatedPrefix}${nextPlan}`);
            if (user?.id) useWavFormatCoachStore.getState().scheduleProTip(user.id, 6_000);
            if (!hasLegalHolderName(fromStore)) {
      toastImportant(d.addLegalName, { icon: "📄" });
            }
            return;
          }
          await new Promise((r) => setTimeout(r, 1200));
        }
        toast(d.planActivating);
      })();
    }
  }, [locale, refreshAuthProfile, refreshProfile, user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("credits_purchased") !== "1") return;
    trackClientEvent("credit_pack_purchased", { source: "stripe_return" });
    toast.success(
      locale === "fr"
        ? "Paiement reçu — tes crédits arrivent dans quelques secondes."
        : "Payment received — your credits will appear in a few seconds.",
    );
    window.history.replaceState({}, "", "/dashboard");
    void refreshProfile({ silent: true });
  }, [locale, refreshProfile]);

  useEffect(() => {
    if (!user?.id) return;
    const prefs = readVoiceStudioPrefs(user.id);
    setActiveVoiceProfileId(prefs.profileId);
    setVoiceCloneStrength(prefs.strength);
    voiceCloneConfigRef.current = { profileId: prefs.profileId, strength: prefs.strength };
  }, [user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const voiceId = params.get("voice")?.trim();
    if (!voiceId || !user?.id) return;
    setMode("song");
    setActiveVoiceProfileId(voiceId);
    voiceCloneConfigRef.current = { ...voiceCloneConfigRef.current, profileId: voiceId };
    writeVoiceStudioPrefs(user.id, { profileId: voiceId });
    params.delete("voice");
    const rest = params.toString();
    window.history.replaceState({}, "", rest ? `/dashboard?${rest}` : "/dashboard");
  }, [user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPrompt = params.get("prompt");
    const urlSeedRaw = params.get("seed");
    const urlSeed = urlSeedRaw && /^\d+$/.test(urlSeedRaw) ? Number(urlSeedRaw) : null;
    const storedLanding = readLandingPendingGeneration();
    const pendingRemix = loadPendingRemix();
    const remixParam = params.get("remix") === "1";

    if (pendingRemix || remixParam) {
      setMode("remix");
      if (pendingRemix) {
        setExternalRemix(pendingRemix);
        clearPendingRemix();
        setEntrySource(pendingRemix.source === "public_loop" ? "public_loop_remix" : "community_remix");
        if (pendingRemix.genre?.trim()) {
          setField("genre", pendingRemix.genre.trim());
        }
        if (pendingRemix.mood?.trim()) setField("mood", pendingRemix.mood.trim());
        if (typeof pendingRemix.bpm === "number" && pendingRemix.bpm > 0) setField("bpm", pendingRemix.bpm);
      }
      if (remixParam) window.history.replaceState({}, "", "/dashboard");
    }

    let landingRequest: LandingPendingGeneration | null = null;
    const urlModeParam = params.get("mode");
    const resolvedUrlMode = urlModeParam === "beat" ? "beat" : "song";

    if (urlPrompt !== null) {
      let decodedPrompt = urlPrompt;
      try {
        decodedPrompt = decodeURIComponent(urlPrompt);
      } catch {
        decodedPrompt = urlPrompt;
      }
      const trimmed = decodedPrompt.trim();
      landingRequest = {
        prompt: trimmed,
        mode: resolvedUrlMode,
        genreStrategy: landingGenreStrategyFromPrompt(trimmed),
      };
    } else if (storedLanding) {
      landingRequest = storedLanding;
    }

    if (
      landingRequest &&
      (landingRequest.prompt.trim().length > 0 || landingRequest.genreStrategy === "random")
    ) {
      setPendingLandingRequest(landingRequest);
      setEntrySource("landing");
    } else if (!pendingRemix && !remixParam) {
      const rawMode = params.get("mode");
      if (rawMode === "beat" || rawMode === "song") setMode(rawMode);
      if (params.has("mode") && !storedLanding) clearLandingPendingGeneration();
      try {
        const src = window.localStorage.getItem("producerhit_pending_source");
        if (src) {
          setEntrySource(src);
          window.localStorage.removeItem("producerhit_pending_source");
        }
      } catch {
        void 0;
      }
    }

    if (urlSeed !== null && Number.isFinite(urlSeed)) setExternalSeed(urlSeed);

    const urlGenre = params.get("genre")?.trim();
    if (urlGenre && !pendingRemix && !remixParam) {
      setField("genre", urlGenre);
      const rawMode = params.get("mode");
      if (rawMode === "beat" || rawMode === "song" || rawMode === "remix" || rawMode === "cover") setMode(rawMode);
    }

    if (urlPrompt) window.history.replaceState({}, "", "/dashboard");
    else if (urlGenre || params.has("mode")) window.history.replaceState({}, "", "/dashboard");
  }, []);


  useEffect(() => {
    trackClientEvent("dashboard_view", { source: entrySource });
  }, [entrySource]);

  useEffect(() => {
    if (!user?.id) return;
    if (!loopsHydrated || loopsLoading) return;
    trackDashboardReady({
      load_ms: Date.now() - dashboardMountedAtRef.current,
      loops_count: loops.length,
      source: entrySource,
      mobile_v2: mobileV2,
    });
  }, [user?.id, loopsHydrated, loopsLoading, loops.length, entrySource, mobileV2]);

  useEffect(() => {
    window.localStorage.setItem("producerhit_mode", mode);
  }, [mode]);

  useEffect(() => {
    try {
      window.localStorage.setItem("producerhit_requested_title", requestedTitle);
    } catch {
      // ignore
    }
  }, [requestedTitle]);

  useEffect(() => {
    window.localStorage.setItem("producerhit_advanced", advancedOpen ? "true" : "false");
  }, [advancedOpen]);

  useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem(GENRE_PICK_MODE_STORAGE_KEY);
      if (savedMode === "auto") {
        setField("genre", FROM_IDEA_GENRE_VALUE);
        window.localStorage.removeItem(GENRE_PICK_MODE_STORAGE_KEY);
      }
    } catch {
      void 0;
    }
  }, [setField]);

  useEffect(() => {
    usedCountRef.current = usedThisMonth;
  }, [usedThisMonth]);

  const chipGenre = useMemo(() => {
    if (isFromIdeaGenreSelection(form.genre)) {
      return d.fromIdea;
    }
    if (isRandomGenreSelection(form.genre)) {
      return lastRandomGenre || (d.random);
    }
    return form.genre;
  }, [form.genre, lastRandomGenre, locale]);

  const genreReady = true;

  const remaining = getRemainingBeats(plan, usedThisMonth, referralBonus, levelBonus, dailyBonusMonth, purchasedBonus);
  const totalLimit = getTotalGenerationLimit(plan, { referralBonus, levelBonus, dailyBonusMonth, purchasedBonus });
  const bonusCreditsTotal = referralBonus + levelBonus + dailyBonusMonth + purchasedBonus;
  const reserveBonusMetaRow =
    bonusCreditsTotal > 0 ||
    Boolean(
      profileCacheSnapshot &&
        profileCacheSnapshot.referralBonus + profileCacheSnapshot.levelBonus + profileCacheSnapshot.dailyBonusMonth > 0,
    );
  const dualGenerationAllowed = canDualGeneration(plan);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("producerhit_versions", String(versions));
  }, [versions]);

  useEffect(() => {
    if (versions === 2 && (!dualGenerationAllowed || remaining < 2)) setVersions(1);
  }, [dualGenerationAllowed, remaining, versions]);

  const promptPlanUpsell = useCallback(
    (reason: UpsellReason) => {
      const ctx = {
        source: entrySource,
        plan: planRef.current,
        remaining,
        totalLimit,
        usedThisMonth,
      };
      const canShow = shouldShowPlanUpsell(planRef.current, reason, ctx);
      const forceExhausted = reason === "credits_exhausted" && remaining < 1;
      if (!canShow && !forceExhausted) return;
      openUpsell(reason, ctx);
      if (forceExhausted) markExhaustedCreditsPromptShown();
    },
    [entrySource, openUpsell, remaining, totalLimit, usedThisMonth],
  );

  const trackFreeGenMilestonesWithUpsell = useCallback(
    (args: { usedAfterGen: number; loopId: string; mode: string; source: string }) => {
      trackFreeGenerationMilestones(
        { plan, ...args },
        {
          onMilestone: (m) => {
            if (m === 4 || m === 8) promptPlanUpsell("credits_low");
            if (m === 10) promptPlanUpsell("limit_reached");
          },
          onQuotaExhausted: () => promptPlanUpsell("limit_reached"),
        },
      );
    },
    [plan, promptPlanUpsell],
  );

  const promptCreditsBlocked = useCallback(
    (cost = versions) => {
      promptPlanUpsell(creditsBlockedReason(remaining, cost));
    },
    [promptPlanUpsell, remaining, versions],
  );

  const handleDualLocked = useCallback(() => {
    promptPlanUpsell("feature_dual_generation");
  }, [promptPlanUpsell]);

  const handleNeedCredits = useCallback(() => {
    if (remaining >= LOOP_COVER_REROLL_CREDIT_COST) {
      trackClientEvent("quota_desync", { remaining, plan, source: "dashboard" });
      toast.error(d.quotaOutOfSync);
      void refreshProfile();
      return;
    }
    promptPlanUpsell("credits_exhausted");
  }, [locale, plan, promptPlanUpsell, refreshProfile, remaining]);

  useEffect(() => {
    if (profileBusy || !user) return;
    if (remaining > 0) return;
    if (!shouldShowExhaustedCreditsPrompt()) return;
    markExhaustedCreditsPromptShown();
    promptPlanUpsell("credits_exhausted");
  }, [profileBusy, promptPlanUpsell, remaining, user]);

  useEffect(() => {
    if (profileBusy || !user) return;
    if (!shouldShowLowCreditsPrompt(plan, remaining)) return;
    markLowCreditsPromptShown();
    promptPlanUpsell("credits_low");
  }, [plan, profileBusy, promptPlanUpsell, remaining, user]);

  const consumeCredit = useCallback(() => {
    setUsedThisMonth((v) => {
      const next = v + 1;
      usedCountRef.current = next;
      try {
        window.localStorage.setItem("producerhit_used_this_month", String(next));
      } catch {
        void 0;
      }
      return next;
    });
    notifyGamificationGeneration(locale, {
      syncRewards: !!user,
      onBonusCreditsChange: (credits) => {
        setLevelBonus(credits.levelBonus);
        setDailyBonusMonth(credits.dailyBonusMonth);
      },
    });
    setGamificationRefreshKey((k) => k + 1);
  }, [locale, user]);

  const openMasteringUpgrade = useCallback(() => {
    trackClientEvent("mastering_upgrade_click", { plan, source: "dashboard" });
    promptPlanUpsell("wav_export");
  }, [plan, promptPlanUpsell]);

  const prepareWavCoachTarget = useCallback(() => {
    if (mode === "song" && songUiMode !== "custom") setSongUiMode("custom");
    else if (mode === "beat" && !advancedOpen) setAdvancedOpen(true);
  }, [advancedOpen, mode, songUiMode]);

  const handleWavFormatClick = useCallback(() => {
    if (canExportWav(plan)) {
      setAudioFormatPref("wav");
      return;
    }
    const uid = user?.id;
    if (!uid) {
      promptPlanUpsell("feature_wav_format");
      return;
    }
    const showedCoach = useWavFormatCoachStore.getState().triggerFreeClick(uid);
    if (!showedCoach) promptPlanUpsell("feature_wav_format");
  }, [plan, promptPlanUpsell, user?.id]);

  useEffect(() => {
    if (profileBusy || !user?.id) return;
    const store = useWavFormatCoachStore.getState();
    store.cancelPending();
    if (canExportWav(plan)) {
      store.scheduleProTip(user.id, 14_000);
    } else {
      store.scheduleFreeTease(user.id, 22_000);
    }
    return () => store.cancelPending();
  }, [plan, profileBusy, user?.id]);

  const displayedLoops = useMemo(
    () => buildWorkspacePlaybackQueue(loops, { query, savedOnly }),
    [loops, query, savedOnly],
  );

  // PERF: `displayedLoops` gets a brand-new array reference any time a single
  // loop in the store mutates (progress polling, cover arriving, duration
  // load...), even when the actual list of ids/order shown to the user hasn't
  // changed. Since this array is passed as `queueLoops` to every
  // <LoopCardItem memo>, a new reference there breaks React.memo's shallow
  // prop comparison and forces a re-render of EVERY card in the workspace on
  // every unrelated store update — this is the main source of perceived lag
  // during active generation. We only swap the reference when the visible
  // id sequence actually changes; otherwise we keep handing out the same
  // array object so memo'd children skip re-rendering.
  const displayedLoopsSignature = useMemo(
    () => displayedLoops.map((l) => l.id).join("|"),
    [displayedLoops],
  );

  // Card reveal animation: add pk-card-revealed class when cards enter viewport
  // Also reveal cards already visible on initial render (fixes cards staying invisible in grid view)
  const cardRevealRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = cardRevealRef.current;
    if (!container) return;

    const cards = container.querySelectorAll<HTMLElement>(".pk-card-reveal");
    if (!cards.length) return;

    // Reveal cards already visible in the viewport on initial render
    cards.forEach((card) => {
      if (card.getBoundingClientRect().top < window.innerHeight) {
        card.classList.add("pk-card-revealed");
      }
    });

    // Then observe any remaining cards that scroll into view
    const unseen = Array.from(cards).filter((c) => !c.classList.contains("pk-card-revealed"));
    if (!unseen.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("pk-card-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "100px", threshold: 0.01 },
    );

    unseen.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [displayedLoopsSignature, detailsLoop]);

  const stableDisplayedLoopsRef = useRef(displayedLoops);
  const stableDisplayedLoops = useMemo(() => {
    stableDisplayedLoopsRef.current = displayedLoops;
    return stableDisplayedLoopsRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedLoopsSignature]);
  const totalMatches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return loops.filter((l) => {
      if (savedOnly && !l.isSaved) return false;
      if (!normalized) return true;
      const hay = `${l.name} ${l.genre} ${l.mood} ${l.key} ${l.scale}`.toLowerCase();
      return hay.includes(normalized);
    }).length;
  }, [loops, query, savedOnly]);

  const libraryTotalCount = loopsTotalCount ?? loops.length;
  const workspaceFilteredTotal = totalMatches;
  const workspaceVisibleCount = displayedLoops.length;
  const hasWorkspaceFilters = savedOnly || query.trim().length > 0;

  const visibleGenerationSlots = useMemo(
    () =>
      generationSlots?.filter((s) => {
        if (!s.visible) return false;
        if (s.savedLoopId && loops.some((l) => l.id === s.savedLoopId)) return false;
        return true;
      }) ?? [],
    [generationSlots, loops],
  );

  const mobileResultsBadge = useMemo(() => {
    const jobs = workspaceJobs.length;
    return jobs + visibleGenerationSlots.length;
  }, [visibleGenerationSlots, workspaceJobs]);

  const generationProgressPct = useMemo(() => {
    const active = visibleGenerationSlots.filter((s) => s.status === "generating");
    if (!active.length) return undefined;
    return Math.max(0, ...active.map((s) => s.progressPct ?? 0));
  }, [visibleGenerationSlots]);

  useEffect(() => {
    if (generating) {
      if (generationStartedAtRef.current === null) {
        generationStartedAtRef.current = Date.now();
        generationAbandonTrackedRef.current = false;
      }
      return;
    }
    generationStartedAtRef.current = null;
    generationAbandonTrackedRef.current = false;
  }, [generating]);

  useEffect(() => {
    if (!generating) return;

    const fireAbandon = (reason: string) => {
      if (generationAbandonTrackedRef.current) return;
      generationAbandonTrackedRef.current = true;
      const started = generationStartedAtRef.current ?? Date.now();
      trackClientEvent("generation_abandon", {
        reason,
        elapsed_ms: Date.now() - started,
        progress_pct: generationProgressPct,
        mode,
        plan,
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") fireAbandon("visibility_hidden");
    };
    const onPageHide = () => fireAbandon("pagehide");

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [generating, generationProgressPct, mode, plan]);

  const sortedVisibleGenerationSlots = useMemo(
    () => [...visibleGenerationSlots].sort((a, b) => b.idx - a.idx),
    [visibleGenerationSlots],
  );

  const mobileGenActive = generating || mobileResultsBadge > 0;
  const mobileGenerationsAnchorRef = useRef<HTMLDivElement>(null);
  const hasMobilePlayer = usePlayerStore((s) => !!s.current);

  const startWorkspaceJob = useCallback(
    (title: string, sub: string) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `job-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setWorkspaceJobs((prev) => [{ id, title, sub }, ...prev]);
      return () => setWorkspaceJobs((prev) => prev.filter((j) => j.id !== id));
    },
    [setWorkspaceJobs],
  );

  const bars = barsFromLoopLength(form.loopLength);
  const isSong = mode === "song";
  const isRemix = mode === "remix";
  const isCover = mode === "cover";

  const dashboardIdeaText = isSong ? songDescription.trim() : (form.prompt?.trim() ?? "");

  useEffect(() => {
    if (dashboardIdeaText) {
      if (isFromIdeaGenreSelection(form.genre) || isRandomGenreSelection(form.genre)) {
        if (form.genre !== FROM_IDEA_GENRE_VALUE) setField("genre", FROM_IDEA_GENRE_VALUE);
      }
      return;
    }
    if (form.genre === FROM_IDEA_GENRE_VALUE) {
      setField("genre", RANDOM_GENRE_VALUE);
    }
  }, [dashboardIdeaText, form.genre, setField]);

  const effectiveEngine = isSong ? "ace-step" : engine;
  const songIsCustom = isSong && songUiMode === "custom";
  /** MP3 par défaut (stockage DB inline ~3–8 Mo vs WAV ~20 Mo). WAV seulement si choisi explicitement. */
  const effectiveAudioFormat =
    audioFormatTouchedRef.current && plan !== "free" && audioFormat === "wav" ? "wav" : "mp3";

  const effectiveBpm = isSong 
    ? (songIsCustom && songTempoMode === "manual" ? form.bpm : 0)
    : (advancedOpen && beatTempoMode === "manual" ? form.bpm : 0);
    
  const effectiveKey = isSong
    ? (songIsCustom && songKeyMode === "manual" ? form.key : "")
    : (advancedOpen && beatKeyMode === "manual" ? form.key : "");

  const effectiveScale = isSong
    ? (songIsCustom && songKeyMode === "manual" ? form.scale : "")
    : (advancedOpen && beatKeyMode === "manual" ? form.scale : "");

  const autoMetaEnabled = isSong 
    ? !songIsCustom || (songTempoMode === "auto" && songKeyMode === "auto")
    : !advancedOpen || (beatTempoMode === "auto" && beatKeyMode === "auto");

  const detectedLang = isSong
    ? resolveSongVocalLanguage({
        mode: songVocalLanguageMode,
        manualCode: manualVocalLanguage,
        lyricsMode,
        lyrics,
        songDescription,
        uiLocale: locale,
      })
    : "en";
  const songLyrics = isSong ? (lyricsMode === "manual" ? lyrics.trim() : "") : "";
  const songDurationMax = 240;
  const manualSongDurationRaw = songIsCustom && songDurationMode === "manual" ? songDurationSec : undefined;
  const manualSongDuration = typeof manualSongDurationRaw === "number" ? Math.min(manualSongDurationRaw, songDurationMax) : undefined;
  const manualSongTimeSignature = songIsCustom && songTimeSignatureMode === "manual" ? songTimeSignature : "";
  const uiPrompt = isSong
    ? [
        isCatalogGenreSelection(form.genre) ? form.genre : "",
        songDescription.trim(),
        songVocalStyle ? `vocal style: ${songVocalStyle}` : "",
      ]
        .filter(Boolean)
        .join(", ")
    : (form.prompt?.trim() ?? "");

  const aceDebugParams = useMemo<GenerateParams>(() => {
    return {
      genre: form.genre,
      influence: form.influence,
      key: effectiveKey,
      scale: effectiveScale,
      bpm: effectiveBpm,
      loopLengthBars: bars,
      swing: form.swing,
      mood: isSong ? "" : form.mood,
      energyLevel: isSong ? "" : form.energyLevel,
      reverb: form.reverb,
      prompt: uiPrompt,
    };
  }, [
    bars,
    effectiveBpm,
    effectiveKey,
    effectiveScale,
    form.energyLevel,
    form.genre,
    form.influence,
    form.mood,
    form.reverb,
    form.swing,
    isSong,
    uiPrompt,
  ]);

  const handleGenerate = useCallback(async () => {
    const effectiveVersions: 1 | 2 = dualGenerationAllowed && versions === 2 ? 2 : 1;
    if (remaining < effectiveVersions) {
      promptCreditsBlocked(effectiveVersions);
      return;
    }
    if (generating) return;

    const landingSnap = landingGenerateSnapshotRef.current;
    if (landingSnap) landingGenerateSnapshotRef.current = null;
    const runAsSong = landingSnap ? landingSnap.mode === "song" : isSong;
    const runFormGenre = landingSnap?.genre ?? form.genre;
    let runSongDescription = landingSnap && runAsSong ? landingSnap.prompt : songDescription;
    let runFormPrompt = landingSnap && !runAsSong ? landingSnap.prompt : form.prompt;

    const ideaTextForGenre = runAsSong ? runSongDescription.trim() : (runFormPrompt?.trim() ?? "");

    const runUiPrompt =
      landingSnap != null
        ? runAsSong
          ? isCatalogGenreSelection(runFormGenre)
            ? [runFormGenre, landingSnap.prompt.trim()].filter(Boolean).join(", ")
            : landingSnap.prompt.trim()
          : landingSnap.prompt.trim()
        : uiPrompt;

    let effectiveLyricsMode = lyricsMode;
    let effectiveSongLyrics = songLyrics;
    if (runAsSong && lyricsMode === "manual" && !songLyrics) {
      effectiveLyricsMode = "ai";
      effectiveSongLyrics = "";
      setLyricsMode("ai");
    }
    const runVocalLanguage = runAsSong
      ? resolveSongVocalLanguage({
          mode: songVocalLanguageMode,
          manualCode: manualVocalLanguage,
          lyricsMode: effectiveLyricsMode,
          lyrics: effectiveSongLyrics,
          songDescription: runSongDescription,
          uiLocale: locale,
        })
      : "en";
    const sessionId = ++generateSessionRef.current;
    unlockAudioPlaybackFromGesture();
    armGenerationAutoplay();
    setGenerating(true);
    const titleCase = (s: string) =>
      s
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

    const compactWords = (text: string) => {
      const cleaned = text
        .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
        .replace(/[^a-zA-Z0-9À-ÿ' -]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!cleaned) return [];
      const stop = new Set([
        "a",
        "an",
        "the",
        "and",
        "or",
        "to",
        "of",
        "in",
        "on",
        "for",
        "with",
        "without",
        "my",
        "your",
        "our",
        "me",
        "you",
        "we",
        "i",
        "je",
        "tu",
        "il",
        "elle",
        "nous",
        "vous",
        "ils",
        "elles",
        "le",
        "la",
        "les",
        "un",
        "une",
        "des",
        "de",
        "du",
        "dans",
        "sur",
        "avec",
        "pour",
        "sans",
      ]);
      return cleaned
        .split(" ")
        .map((w) => w.trim())
        .filter((w) => w.length >= 3 && !stop.has(w.toLowerCase()))
        .slice(0, 6);
    };

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const normalizeTitle = (s: string) =>
      s
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[<>]/g, "")
        .slice(0, 72);

    const randomGenre = shouldPickRandomGenreAtGenerate(runFormGenre, ideaTextForGenre)
      ? pickRandomGenreValue()
      : undefined;
    if (randomGenre) setLastRandomGenre(randomGenre);
    const { promptGenre, displayGenre } = resolveGenreForGeneration(runFormGenre, ideaTextForGenre, randomGenre);

    const normalizedGenreForPrompt = promptGenre;
    const rawTitleSource = (
      runAsSong ? runSongDescription : runFormPrompt || runUiPrompt || normalizedGenreForPrompt
    ).trim();
    const inferredWords = compactWords(rawTitleSource);
    const excerptTitle = normalizeTitle((rawTitleSource.split(/[,;|\n]+/)[0] ?? rawTitleSource).trim());
    const defaultBase = inferredWords.length
      ? titleCase(inferredWords.join(" "))
      : excerptTitle.length > 0
        ? excerptTitle
        : titleCase(displayGenre === FROM_IDEA_GENRE_VALUE ? (d.newTrack) : displayGenre);
    const baseTitle = normalizeTitle(requestedTitle) || defaultBase;

    const titleIndexStart = (() => {
      const re = new RegExp(`^${escapeRegExp(baseTitle)}\\s+#(\\d+)\\b`);
      let max = 0;
      for (const l of loops) {
        const m = l.name.match(re);
        if (!m) continue;
        const n = Number(m[1]);
        if (Number.isFinite(n) && n > max) max = n;
      }
      return max + 1;
    })();
    /** Titre affiché sur la carte pendant la génération — sans numéro (#01/#02). */
    const slotDisplayTitle = baseTitle;

    let titleAllocCount = 0;
    const allocatePersistedTitle = () => {
      const title = `${baseTitle} #${String(titleIndexStart + titleAllocCount).padStart(2, "0")}`;
      titleAllocCount += 1;
      return title;
    };

    const persistedSlotIdx = new Set<1 | 2>();
    const finishedInOrder: Loop[] = [];

    const randInt = (maxExclusive: number) => {
      if (maxExclusive <= 1) return 0;
      try {
        const a = new Uint32Array(1);
        crypto.getRandomValues(a);
        return a[0] % maxExclusive;
      } catch {
        return Math.floor(Math.random() * maxExclusive);
      }
    };

    const seed1 = externalSeed ?? randInt(999999);
    const seed2 = seed1 + 12345;
    const dualMode = effectiveVersions === 2 ? dualGenerationEffectiveMode() : null;
    const slots: GenerationSlot[] =
      effectiveVersions === 2
        ? [
            { idx: 1, status: "generating", title: slotDisplayTitle, seed: seed1, visible: true, previewReady: false, progressPct: 0 },
            {
              idx: 2,
              status: dualMode === "sequential" ? "queued" : "generating",
              title: slotDisplayTitle,
              seed: seed2,
              visible: true,
              previewReady: false,
              progressPct: dualMode === "sequential" ? undefined : 0,
            },
          ]
        : [{ idx: 1, status: "generating", title: slotDisplayTitle, seed: seed1, visible: true, previewReady: false, progressPct: 0 }];
    setGenerationSlots(slots);
    syncGenerationStart(sessionId, slots);

    let didGenerate = false;
    let generationUiReleased = false;
    const releaseGenerationUi = () => {
      if (generationUiReleased || !isSyncGenerationSessionActive(sessionId)) return;
      generationUiReleased = true;
      if (didGenerate) {
        beatAceOverrideRef.current = null;
        songAceOverrideRef.current = null;
        songBankDiceRef.current = false;
      }
      setGenerating(false);
      let nextSlots: GenerationSlot[] | null = null;
      setGenerationSlots((prev) => {
        if (!prev) return null;
        const errors = prev.filter((s) => s.visible && s.status === "error");
        nextSlots = errors.length > 0 ? errors : null;
        return nextSlots;
      });
      syncGenerationFinish(sessionId, {
        slots: nextSlots,
        didGenerate,
        title: slotDisplayTitle,
      });
    };
    const slotErrors: Partial<Record<1 | 2, string>> = {};
    try {
      trackClientEvent("generate_start", {
        mode,
        versions: effectiveVersions,
        plan,
        source: entrySource,
        ...generationStrategySnapshot(effectiveVersions),
      });
      if (import.meta.env.DEV) {
        console.info("[generate] strategy", generationStrategySnapshot(effectiveVersions));
      }
      if (import.meta.env.DEV && effectiveVersions === 2 && browserAceKeyCount() < 2) {
        console.warn(
          "[generate] 1 seule clé VITE ACE — ajoute VITE_ACE_STEP_API_KEYS (comme ACE_STEP_API_KEYS) pour v1/v2 en parallèle sans 429.",
        );
      }
      const displayIdeaForCaption = runAsSong
        ? runSongDescription.trim()
        : (runFormPrompt?.trim() ?? "");

      const captionCtx = resolveGenerationCaptionContext({
        diceAceOverride: runAsSong ? songAceOverrideRef.current : beatAceOverrideRef.current,
        landingAceOverride: landingSnap?.acePrompt ?? null,
        displayIdea: displayIdeaForCaption,
        formGenre: normalizedGenreForPrompt,
        mode: runAsSong ? "song" : "beat",
        uiLocale: locale,
        skipPromptBankPipeline: runAsSong ? songBankDiceRef.current : false,
      });

      const genreForAce = captionCtx.bankGenre ?? normalizedGenreForPrompt;

      if (runAsSong && captionCtx.lyricsStructure?.trim()) {
        effectiveSongLyrics = captionCtx.lyricsStructure.trim();
        effectiveLyricsMode = "manual";
      }

      const effectiveRunUiPrompt = runAsSong
        ? [
            isCatalogGenreSelection(normalizedGenreForPrompt) ? normalizedGenreForPrompt : "",
            runSongDescription.trim(),
            songVocalStyle ? `vocal style: ${songVocalStyle}` : "",
          ]
            .filter(Boolean)
            .join(", ")
        : (runFormPrompt?.trim() ?? "");

      const userIdea = effectiveRunUiPrompt || runUiPrompt || "";
      const isRandomPrompt = runAsSong ? !!songAceOverrideRef.current : !!beatAceOverrideRef.current;

      const aceInputPrompt =
        runAsSong && !runSongDescription.trim() ? "" : userIdea;

      const inputParams = {
        genre: genreForAce,
        influence: form.influence,
        key: effectiveKey,
        scale: effectiveScale,
        bpm: effectiveBpm,
        loopLengthBars: bars,
        swing: form.swing,
        mood: runAsSong ? "" : form.mood,
        energyLevel: runAsSong ? "" : form.energyLevel,
        reverb: form.reverb,
        prompt: runAsSong
          ? runSongDescription.trim() || normalizedGenreForPrompt
          : aceInputPrompt,
      };

      const buildOptions = (seed?: number, slotIdx?: 1 | 2) => {
        const aceKeyPreferIndex = aceKeyPreferIndexForSlot(slotIdx, effectiveVersions);
        const hasManualLyrics = effectiveLyricsMode === "manual" && effectiveSongLyrics.length > 0;
        const aceComposeLyrics = hasManualLyrics ? effectiveSongLyrics : "";
        const songAceDuration =
          manualSongDuration ??
          (aceComposeLyrics ? estimateSongDurationFromLyrics(aceComposeLyrics) : undefined);
        const base = runAsSong
          ? {
              instrumental: false,
              lyrics: aceComposeLyrics,
              vocalLanguage: runVocalLanguage,
              autoMeta: autoMetaEnabled,
              thinking: true,
              duration: songAceDuration,
              timeSignature: manualSongTimeSignature || undefined,
              isSong: true,
              audioFormat: effectiveAudioFormat,
              seed,
            }
          : {
              instrumental: beatInstrumental,
              lyrics: "",
              vocalLanguage: "en",
              isSong: false,
              autoMeta: autoMetaEnabled,
              audioFormat: effectiveAudioFormat,
              seed,
            };
        const captionOpts = (() => {
          const base = (captionCtx.captionOverride?.trim() ? { captionOverride: captionCtx.captionOverride, melodyComposition: captionCtx.melodyComposition } : {}) as { captionOverride?: string; melodyComposition?: boolean };
          return base;
        })();
        return aceKeyPreferIndex !== undefined
          ? {
              ...base,
              aceKeyPreferIndex,
              ...captionOpts,
              ...(runAsSong && songVocalStyle.trim() ? { vocalStyle: songVocalStyle.trim() } : {}),
              ...(runAsSong && !isRandomPrompt && userIdea.trim() ? { sampleMode: true, sampleQuery: userIdea } : {}),
            }
          : {
              ...base,
              ...captionOpts,
              ...(runAsSong && songVocalStyle.trim() ? { vocalStyle: songVocalStyle.trim() } : {}),
              ...(runAsSong && !isRandomPrompt && userIdea.trim() ? { sampleMode: true, sampleQuery: userIdea } : {}),
            };
      };

      const cloneCfg = voiceCloneConfigRef.current;
      const withVoiceClone = (opts: ReturnType<typeof buildOptions>) => {
        if (!runAsSong || !cloneCfg.profileId) return opts;
        return { ...opts, voiceProfileId: cloneCfg.profileId, voiceCloneStrength: cloneCfg.strength };
      };

      if (debugEnabled) {
        if (import.meta.env.DEV) {
          try {
            const previewCaption = buildAceCaption(
              autoMetaEnabled ? { ...inputParams, bpm: 0, key: "", scale: "" } : inputParams,
              {
                isSong: runAsSong,
                instrumental: runAsSong ? false : beatInstrumental,
                autoMeta: autoMetaEnabled,
                vocalLanguage: detectedLang,
              },
            );
            console.debug("[GEN UI]", {
              mode,
              songUiMode,
              lyricsMode,
              detectedLang,
              params: inputParams,
              aceCaption: previewCaption,
              options: withVoiceClone(buildOptions(seed1)),
            });
          } catch {
            // ignore
          }
        }
      }

      const storedPrompt = effectiveRunUiPrompt || runUiPrompt || "";

      const buildDraft = (result: Awaited<ReturnType<typeof generateBeat>>, audioUrl: string) => {
        const generatedKeyScale = parseKeyScale(result.meta?.keyScale ?? "");
        const realBpm = result.meta?.bpm && result.meta.bpm > 0 ? result.meta.bpm : 0;
        const realKey = generatedKeyScale.key || "";
        const realScale = generatedKeyScale.scale || "";

        const usedBpm = autoMetaEnabled ? realBpm : effectiveBpm || form.bpm;
        const usedKey = autoMetaEnabled ? realKey : effectiveKey || form.key;
        const usedScale = autoMetaEnabled ? realScale : effectiveScale || form.scale;

        const captionForMeta = result.meta?.prompt ?? storedPrompt;
        const parsedLyricsFromAce = result.meta?.lyrics ?? "";
        const userLyricsForMeta =
          runAsSong && effectiveLyricsMode === "manual" ? effectiveSongLyrics.trim() : "";
        const resolvedLyrics =
          runAsSong && effectiveLyricsMode === "manual" && userLyricsForMeta
            ? userLyricsForMeta
            : resolveAceLyricsForMeta({
                parsedLyrics: parsedLyricsFromAce,
                userLyrics: userLyricsForMeta,
                caption: captionForMeta,
                parsedPrompt: storedPrompt,
              });

        const draft: Omit<Loop, "id" | "createdAt" | "userId"> = {
          engine: result.engine,
          name: "",
          genre: displayGenre,
          influence: form.influence,
          key: usedKey,
          scale: usedScale,
          bpm: usedBpm,
          loopLength: form.loopLength,
          swing: form.swing,
          mood: runAsSong ? "" : form.mood,
          energyLevel: runAsSong ? "" : form.energyLevel,
          reverb: form.reverb,
          prompt: storedPrompt,
          audioUrl: audioUrl ?? null,
          seed: typeof result.meta?.seed === "number" && Number.isFinite(result.meta.seed) ? result.meta.seed : null,
          details: result.meta
            ? {
                caption: captionForMeta,
                lyrics: resolvedLyrics,
                bpm: result.meta.bpm ?? null,
                duration: result.meta.duration ?? null,
                keyScale: result.meta.keyScale ?? "",
                timeSignature: result.meta.timeSignature ?? "",
                audioFormat: result.meta.audioFormat ?? effectiveAudioFormat,
                coverPrompt: buildCoverPromptSnapshot({
                  prompt: storedPrompt,
                  genre: displayGenre,
                  mood: runAsSong ? "" : form.mood,
                  influence: form.influence,
                }),
              }
            : null,
          stemsUrl: (() => {
            const taskId =
              (typeof result.meta?.taskId === "string" && result.meta.taskId.trim()) ||
              (typeof result.meta?.task_id === "string" && result.meta.task_id.trim()) ||
              "";
            const httpAudioUrl =
              (typeof result.meta?.httpAudioUrl === "string" && result.meta.httpAudioUrl.trim()) ||
              (audioUrl.startsWith("http") ? audioUrl.trim() : "");
            if (!taskId && !result.meta && !httpAudioUrl) return null;
            const voiceFields = buildAceVoiceCloneStemsFields(result.meta, {
              requestedProfileId: voiceCloneConfigRef.current.profileId,
              requestedStrength: voiceCloneConfigRef.current.strength,
            });
            return {
              ace: {
                ...(taskId ? { taskId } : {}),
                ...(httpAudioUrl.startsWith("http") ? { httpAudioUrl } : {}),
                ...(typeof result.meta?.stemsZipUrl === "string" && result.meta.stemsZipUrl.trim().length > 0
                  ? { stemsZipUrl: result.meta.stemsZipUrl.trim() }
                  : {}),
                isSong: runAsSong,
                ...(runAsSong ? { vocalLanguage: detectedLang } : {}),
                ...(parsedLyricsFromAce ? { parsedLyrics: parsedLyricsFromAce } : {}),
                ...(userLyricsForMeta ? { userLyrics: userLyricsForMeta } : {}),
                ...(voiceFields ?? {}),
              },
            } as Record<string, unknown>;
          })(),
          isSaved: false,
          isPublic: true,
        };
        return { draft, usedBpm, usedKey, usedScale };
      };

      const persistDraft = async (
        draft: Omit<Loop, "id" | "createdAt" | "userId">,
        audioUrl: string,
        engineLabel: string,
        replaceLoopId?: string,
      ): Promise<Loop> => {
        try {
          const loop = await createLoop(draft, replaceLoopId ? { replaceLoopId } : undefined);
          return loop;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Saving failed";
          const id =
            typeof crypto !== "undefined" && "randomUUID" in crypto ? `local-${crypto.randomUUID()}` : `local-${Date.now()}`;
          const createdAt = new Date().toISOString();
          const temp: Loop = {
            id,
            engine: engineLabel,
            name: draft.name,
            genre: draft.genre,
            influence: draft.influence,
            key: draft.key,
            scale: draft.scale,
            bpm: draft.bpm,
            loopLength: draft.loopLength,
            swing: draft.swing,
            mood: draft.mood,
            energyLevel: draft.energyLevel,
            reverb: draft.reverb,
            prompt: draft.prompt,
            audioUrl,
            seed: draft.seed ?? null,
            details: draft.details ?? null,
            stemsUrl: draft.stemsUrl,
            isSaved: false,
            isPublic: true,
            createdAt,
          };
          upsertLoop(temp);
          enqueuePendingSave(draft, id, createdAt);
          toast.error(`${d.generatedSaveFailedPrefix}${message}`);
          return temp;
        }
      };

      const created: Loop[] = [];

      const isActiveSession = () => isSyncGenerationSessionActive(sessionId);

      const generationAutoplay = createGenerationAutoplaySession({
        versions,
        workspaceFilter: { query, savedOnly },
        mobileV2,
        goResults,
        isActiveSession,
      });

      const setSlot = (idx: 1 | 2, next: Partial<GenerationSlot>) => {
        if (!isActiveSession()) return;
        setGenerationSlots((prev) => {
          if (!prev) return prev;
          return prev.map((it) => (it.idx === idx ? { ...it, ...next } : it));
        });
        syncGenerationSlotPatch(idx, next);
      };

      const hideGenerationSlot = (idx: 1 | 2, extra?: Partial<GenerationSlot>) => {
        setSlot(idx, { visible: false, progressPct: undefined, ...extra });
      };

      const applyBeatFromValue = async (
        idx: 1 | 2,
        seed: number,
        _slotTitle: string,
        value: Awaited<ReturnType<typeof generateBeat>>,
        generationKey: string,
      ) => {
        const audioUrl = value.audioUrl;
        if (!audioUrl) throw new Error(d.missingAudio);
        didGenerate = true;
        const title = allocatePersistedTitle();
        setSlot(idx, { title });
        const { draft } = buildDraft(value, audioUrl);
        draft.name = title;
        if (typeof value.meta?.seed === "number" && Number.isFinite(value.meta.seed)) {
          draft.seed = value.meta.seed;
        } else if (Number.isFinite(seed)) {
          draft.seed = seed;
        }

        const previewId = `preview-${generationKey}`;
        const buildPreviewLoop = (playbackUrl: string): Loop => ({
          id: previewId,
          userId: user?.id,
          createdAt: new Date().toISOString(),
          engine: draft.engine,
          name: title,
          genre: draft.genre,
          influence: draft.influence,
          key: draft.key,
          scale: draft.scale,
          bpm: draft.bpm,
          loopLength: draft.loopLength,
          swing: draft.swing,
          mood: draft.mood,
          energyLevel: draft.energyLevel,
          reverb: draft.reverb,
          prompt: draft.prompt,
          audioUrl: playbackUrl,
          seed: draft.seed ?? null,
          details: draft.details ?? null,
          stemsUrl: draft.stemsUrl ?? null,
          isSaved: false,
          isPublic: draft.isPublic,
        });

        let persistCompleted = false;
        const quickUrl = audioUrl.trim();
        if (quickUrl) {
          if (audioUrl.startsWith("http")) void primeAudioCache(previewId, audioUrl);
          void (async () => {
            const playbackUrl = ((await resolvePlaybackUrlForLoop(previewId, audioUrl)) || quickUrl).trim();
            if (!playbackUrl || !isActiveSession() || persistCompleted) return;
            const previewLoop = buildPreviewLoop(playbackUrl);
            upsertLoop(previewLoop);
            hideGenerationSlot(idx, { previewLoopId: previewId, previewReady: true });
            await generationAutoplay.playWhenReady(idx, previewLoop, { preview: true });
          })();
        }

        const loop = await persistDraft(draft, audioUrl, value.engine, previewId);
        persistCompleted = true;

        // Applique la cover pré-générée si elle est prête (sinon on relance une fois directement)
        void consumeCoverPrefetch(generationKey)
          .then(async (coverUrl) => {
            const finalUrl = coverUrl?.startsWith("http")
              ? coverUrl
              : (await persistPollinationsCardCoverForLoop(loop.id, loop).catch(() => null))?.coverUrl;

            if (finalUrl?.startsWith("http")) {
              useLoopsStore.getState().applyLoopCoverUrl(loop.id, finalUrl, "image");
            }
          })
          .catch(() => undefined);
        if (mode === "song" && voiceCloneConfigRef.current.profileId) {
          const voiceToast = voiceCloneToastMessage(value.meta, locale);
          if (voiceToast?.type === "success") toast.success(voiceToast.message, { id: `voice-clone-${loop.id}` });
          else if (voiceToast?.type === "warning") toast(voiceToast.message, { icon: "⚠️", id: `voice-clone-${loop.id}` });
        }
        await migrateAudioCache(previewId, loop.id);
        const player = usePlayerStore.getState();
        if (player.current?.id === previewId || player.queue.some((l) => l.id === previewId)) {
          player.promoteLoop(previewId, loop);
        }
        removeLoop(previewId);
        hideGenerationSlot(idx, { savedLoopId: loop.id, previewLoopId: undefined, previewReady: true });
        created.push(loop);
        persistedSlotIdx.add(idx);
        finishedInOrder.push(loop);
        await generationAutoplay.playWhenReady(idx, loop, { persisted: true });
        trackClientEvent("generate_success", {
          loop_id: loop.id,
          mode,
          versions,
          plan,
          source: entrySource,
          dual_batch: value.engine.includes("dual-batch"),
        });
        consumeCredit();
        const usedAfterGen = usedCountRef.current;
        trackFreeGenMilestonesWithUpsell({
          usedAfterGen: usedAfterGen,
          loopId: loop.id,
          mode,
          source: entrySource,
        });
      };

      const startOne = async (idx: 1 | 2, seed: number, title: string) => {
        const generationKey =
          typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `gen-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        let previewId: string | null = null;
        const expectedMs = estimateGenerationDurationMs(
          mode === "song" ? "song" : "beat",
          mode === "song" ? manualSongDuration ?? null : null,
          mode === "song" ? effectiveSongLyrics : null,
        );
        const slotStartedAt = Date.now();
        let lastProgressPct = -1;
        let progressTick: number | undefined;
        const stopProgressTick = () => {
          if (progressTick !== undefined) window.clearInterval(progressTick);
          progressTick = undefined;
        };

        setSlot(idx, {
          status: "generating",
          seed,
          title,
          visible: true,
          previewReady: false,
          generationKey,
          progressPct: 0,
        });

        // Pré-génère la cover Pollinations en parallèle de l'audio (image prête à la fin)
        startCoverPrefetch(generationKey, {
          genre: displayGenre,
          mood: runAsSong ? "" : form.mood,
          influence: form.influence,
          prompt: storedPrompt,
          name: title,
          seed,
        });

        progressTick = window.setInterval(() => {
          if (!isActiveSession()) {
            stopProgressTick();
            return;
          }
          const pct = simulatedGenerationPercent(Date.now() - slotStartedAt, expectedMs);
          if (pct === lastProgressPct) return;
          lastProgressPct = pct;
          setSlot(idx, { progressPct: pct });
        }, 900);

        try {
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const value = await generateBeat(inputParams, effectiveEngine, {
                ...withVoiceClone(buildOptions(seed, idx)),
                generationKey,
              });
              stopProgressTick();
              setSlot(idx, { progressPct: 100 });
              await applyBeatFromValue(idx, seed, title, value, generationKey);
              previewId = null;
              break;
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              if (!isRetryableGenerationError(msg) || attempt === 1) throw e;
              setSlot(idx, { progressPct: 8 });
              await new Promise((r) => setTimeout(r, generationRetryDelayMs(msg, attempt)));
            }
          }
        } catch (err) {
          stopProgressTick();
          const anyErr = err as { limitReached?: boolean };
          const rawMessage = normalizeGenerationRawError(err instanceof Error ? err.message : String(err));
          if (import.meta.env.DEV) console.warn("[generate] slot failed", { idx, rawMessage, err });
          const errorText = anyErr?.limitReached
            ? d.monthlyLimitReached
            : formatGenerationErrorMessage(rawMessage, locale, { plan });
          if (plan === "free" && isGenerationCapacityError(rawMessage) && shouldPromptPriorityUpsellAfterCapacityError(plan)) {
            markPriorityUpsellPrompted(plan);
            promptPlanUpsell("feature_priority");
          }
          if (previewId) {
            removeLoop(previewId);
            previewId = null;
          }
          slotErrors[idx] = errorText;
          setSlot(idx, { status: "error", errorText, visible: true, previewLoopId: undefined, savedLoopId: undefined });
        }
      };

      const slotHasPersistedLoop = (idx: 1 | 2) => persistedSlotIdx.has(idx);

      const slotsNeedingSequentialFallback = (): Array<1 | 2> => {
        const need: Array<1 | 2> = [];
        for (const idx of [1, 2] as const) {
          if (slotHasPersistedLoop(idx)) continue;
          const err = slotErrors[idx];
          const lower = (err ?? "").toLowerCase();
          if (lower.includes("limite mensuelle") || lower.includes("monthly limit") || lower.includes("limit reached")) {
            continue;
          }
          if (err && !shouldTriggerDualSequentialFallback(err)) continue;
          need.push(idx);
        }
        return need;
      };

      const runDualMode = async (mode: DualGenerationMode) => {
        if (mode === "batch") await runDualBatch();
        else if (mode === "parallel") await runDualParallel();
        else await runDualSequential();
      };

      const runDualFallbackSequential = async (indices: Array<1 | 2>, fromMode: string) => {
        trackClientEvent("generate_dual_fallback", { from: fromMode, to: "sequential", slots: indices.join(",") });
        if (import.meta.env.DEV) console.info("[generate] dual fallback → sequential", { from: fromMode, indices });
        toastLoading(d.retryingQueue, { id: "dual-fallback", duration: TOAST_DURATIONS.important });

        for (const idx of indices) {
          delete slotErrors[idx];
          setSlot(idx, {
            status: "generating",
            visible: true,
            errorText: undefined,
            progressPct: 0,
            previewReady: false,
            previewLoopId: undefined,
            savedLoopId: undefined,
          });
        }

        if (indices.includes(1)) {
          await startOne(1, seed1, slotDisplayTitle);
          if (!isActiveSession()) {
            toast.dismiss("dual-fallback");
            return;
          }
        }
        if (indices.includes(2)) {
          const staggerMs = dualGenerationStaggerMs();
          if (staggerMs > 0 && (indices.includes(1) || slotHasPersistedLoop(1))) {
            setSlot(2, { status: "waiting", visible: true, progressPct: undefined });
            await new Promise((r) => setTimeout(r, staggerMs));
          }
          if (isActiveSession()) await startOne(2, seed2, slotDisplayTitle);
        }
        toast.dismiss("dual-fallback");
      };

      const runDualSequential = async () => {
        await startOne(1, seed1, slotDisplayTitle);
        if (!isActiveSession()) return;
        const staggerMs = dualGenerationStaggerMs();
        if (staggerMs > 0) {
          setSlot(2, { status: "waiting", visible: true });
          await new Promise((r) => setTimeout(r, staggerMs));
        }
        if (isActiveSession()) await startOne(2, seed2, slotDisplayTitle);
      };

      const runDualParallel = async () => {
        const parallelStaggerMs = dualParallelStaggerMs();
        await Promise.all([
          startOne(1, seed1, slotDisplayTitle),
          (async () => {
            if (parallelStaggerMs > 0) await new Promise((r) => setTimeout(r, parallelStaggerMs));
            if (isActiveSession()) await startOne(2, seed2, slotDisplayTitle);
          })(),
        ]);
      };

      const runDualBatch = async () => {
        if (dualBatchProdMonitoringEnabled()) {
          trackClientEvent("generate_batch_start", {
            plan,
            mode,
            versions: 2,
            strategy: generationStrategySnapshot(2).dual_mode,
          });
        }
        const generationKey1 =
          typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `gen-${Date.now()}-1`;
        const generationKey2 =
          typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `gen-${Date.now()}-2`;
        const title1 = slotDisplayTitle;
        const title2 = slotDisplayTitle;
        setSlot(1, { status: "generating", seed: seed1, title: title1, visible: true, previewReady: false, generationKey: generationKey1, progressPct: 0 });
        setSlot(2, { status: "generating", seed: seed2, title: title2, visible: true, previewReady: false, generationKey: generationKey2, progressPct: 0 });

        const expectedMs = estimateGenerationDurationMs(
          mode === "song" ? "song" : "beat",
          mode === "song" ? manualSongDuration ?? null : null,
          mode === "song" ? effectiveSongLyrics : null,
        );
        const batchStartedAt = Date.now();
        let lastProgressPct = -1;
        let progressTick: number | undefined;
        const stopProgressTick = () => {
          if (progressTick !== undefined) window.clearInterval(progressTick);
          progressTick = undefined;
        };
        progressTick = window.setInterval(() => {
          if (!isActiveSession()) {
            stopProgressTick();
            return;
          }
          const pct = simulatedGenerationPercent(Date.now() - batchStartedAt, expectedMs * 1.35);
          if (pct === lastProgressPct) return;
          lastProgressPct = pct;
          setSlot(1, { progressPct: pct });
          setSlot(2, { progressPct: pct });
        }, 900);

        try {
          const rows = await generateBeatDualBatch(inputParams, effectiveEngine, {
            ...withVoiceClone(buildOptions(seed1, 1)),
            dualSeeds: [seed1, seed2],
            generationKeys: [generationKey1, generationKey2],
          });
          stopProgressTick();
          const slotMeta: Array<{ idx: 1 | 2; seed: number; title: string; generationKey: string }> = [
            { idx: 1, seed: seed1, title: title1, generationKey: generationKey1 },
            { idx: 2, seed: seed2, title: title2, generationKey: generationKey2 },
          ];
          for (let i = 0; i < rows.length; i++) {
            const meta = slotMeta[i];
            if (!meta) break;
            setSlot(meta.idx, { progressPct: 100 });
            await applyBeatFromValue(meta.idx, rows[i]?.seed ?? meta.seed, meta.title, rows[i]!, meta.generationKey);
          }
          if (rows.length < 2 && isActiveSession()) {
            const failedIdx = rows.length === 0 ? 1 : 2;
            const failedTitle = failedIdx === 1 ? title1 : title2;
            const batchPartialErr = d.batchIncomplete;
            slotErrors[failedIdx] = batchPartialErr;
            setSlot(failedIdx, {
              status: "error",
              title: failedTitle,
              visible: true,
              errorText: batchPartialErr,
            });
          }
        } catch (err) {
          stopProgressTick();
          const rawMessage = normalizeGenerationRawError(err instanceof Error ? err.message : String(err));
          const errorText = formatGenerationErrorMessage(rawMessage, locale, { plan });
          if (plan === "free" && isGenerationCapacityError(rawMessage) && shouldPromptPriorityUpsellAfterCapacityError(plan)) {
            markPriorityUpsellPrompted(plan);
            promptPlanUpsell("feature_priority");
          }
          for (const idx of [1, 2] as const) {
            if (!persistedSlotIdx.has(idx)) {
              slotErrors[idx] = errorText;
              setSlot(idx, { status: "error", errorText, visible: true, previewLoopId: undefined, savedLoopId: undefined });
            }
          }
        }
      };

      if (effectiveVersions !== 2) {
        await startOne(1, seed1, slotDisplayTitle);
      } else {
        const fastMode = dualGenerationEffectiveMode();
        await runDualMode(fastMode);
        if (dualAdaptiveFallbackEnabled() && created.length < 2) {
          const need = slotsNeedingSequentialFallback();
          if (need.length > 0) await runDualFallbackSequential(need, fastMode);
        }
      }

      if (!created.length) {
        const allFailed = new Error(
          d.generationFailed,
        ) as Error & { allSlotsFailed?: boolean };
        allFailed.allSlotsFailed = true;
        throw allFailed;
      }

      releaseGenerationUi();

      const slotOrder = new Map<string, 1 | 2>();
      finishedInOrder.forEach((loop, i) => slotOrder.set(loop.name, (i + 1) as 1 | 2));
      const playableCreated = created
        .filter((l) => typeof l.audioUrl === "string" && l.audioUrl.trim().length > 0)
        .sort((a, b) => (slotOrder.get(a.name) ?? 99) - (slotOrder.get(b.name) ?? 99));
      if (playableCreated.length) {
        await generationAutoplay.finalize(created, slotOrder);
      }

      if (playableCreated.length) {

        const queueIdx = playableCreated.findIndex((l) => l.id === usePlayerStore.getState().current?.id);
        const first = playableCreated[queueIdx >= 0 ? queueIdx : 0] ?? playableCreated[0];
        if (first) {
          const usedBefore = usedCountRef.current - created.length;
          if (shouldShowSharePromptAfterGeneration(usedCountRef.current)) {
            const shareLoop =
              pickLoopForSharePrompt(useLoopsStore.getState().loops, playableCreated.map((l) => l.id), first.id) ??
              first;
            trackClientEvent("growth_share_prompt", {
              loop_id: shareLoop.id,
              source: "post_generate",
              suggested: shareLoop.id !== first.id,
            });
            setShareMomentLoop(shareLoop);
            if (usedBefore === 0) pendingReferralAfterShareRef.current = true;
          } else if (usedBefore === 0 && plan === "free") {
            scheduleReferralPrompt(3800);
          }
          if (
            plan === "free" &&
            usedBefore < FREE_MASTERING_UPSELL_AT &&
            usedCountRef.current >= FREE_MASTERING_UPSELL_AT
          ) {
            try {
              const monthKey = new Date().toISOString().slice(0, 7);
              const upsellKey = `producerhit_master_upsell_${monthKey}`;
              if (!window.localStorage.getItem(upsellKey)) {
                window.localStorage.setItem(upsellKey, "1");
                trackClientEvent("mastering_upsell_prompt", { loop_id: first.id, generation_count: usedCountRef.current });
                setMasteringUpsellLoop(first);
              }
            } catch {
              setMasteringUpsellLoop(first);
            }
          }
        }
      }

      setExternalSeed(null);
      const successCount = created.length;
      const totalGens = loadGamification().totalGenerations;
      const isFirstEver = totalGens === successCount && successCount > 0;
      const seed = playableCreated[0]?.id ?? String(Date.now());
      triggerBeatReady(locale, seed, { isFirst: isFirstEver, versionCount: successCount >= 2 ? successCount : 1 });
      if (isFirstEver) void completeOnboardingStepOnServer("first_beat");
      if (effectiveVersions === 2 && successCount === 1) {
        toast.error(
          d.oneOfTwoFailed,
        );
      }
    } catch (err) {
      const anyErr = err as unknown as { limitReached?: boolean; allSlotsFailed?: boolean };
      if (anyErr?.limitReached) {
        promptPlanUpsell("limit_reached");
        return;
      }
      if (anyErr?.allSlotsFailed) {
        const failMsg =
          err instanceof Error
            ? err.message
            : d.generationFailed;
        toast.error(formatGenerationErrorMessage(failMsg, locale, { plan }));
        return;
      }
      const rawMessage = err instanceof Error ? err.message : "";
      toast.error(formatGenerationErrorMessage(rawMessage, locale, { plan }));
    } finally {
      if (!generationUiReleased && isSyncGenerationSessionActive(sessionId)) {
        releaseGenerationUi();
      }
      if (didGenerate && user) void refreshProfile({ silent: true });
      if (didGenerate && plan === "free" && shouldShowPostGenerationPrompt()) {
        promptPlanUpsell("post_generation");
      }
    }
  }, [
    autoMetaEnabled,
    bars,
    beatInstrumental,
    createLoop,
    removeLoop,
    primeAudioCache,
    migrateAudioCache,
    upsertLoop,
    detectedLang,
    effectiveBpm,
    effectiveAudioFormat,
    effectiveEngine,
    effectiveKey,
    effectiveScale,
    externalSeed,
    form.bpm,
    form.energyLevel,
    form.genre,
    form.influence,
    form.key,
    form.loopLength,
    form.mood,
    form.prompt,
    form.reverb,
    form.scale,
    form.swing,
    generating,
    debugEnabled,
    isSong,
    locale,
    consumeCredit,
    lyricsMode,
    loops,
    requestedTitle,
    manualSongDuration,
    manualSongTimeSignature,
    mode,
    songUiMode,
    navigate,
    plan,
    dualGenerationAllowed,
    promptCreditsBlocked,
    promptPlanUpsell,
    remaining,
    versions,
    query,
    savedOnly,
    songDescription,
    songLyrics,
    songVocalStyle,
    uiPrompt,
    refreshProfile,
    user,
    goResults,
    mobileV2,
    beatPromptLocale,
    songPromptLocale,
    setField,
    setSongDescription,
  ]);

  const handleRemixGenerate = useCallback(
    async (input: {
      audioFile: File;
      prompt: string;
      lyrics: string;
      taskType: "cover" | "repaint";
      coverStrength: number;
      durationSec: number | null;
      bpm: number | null;
      instrumental: boolean;
      sourceLoopName?: string;
    }) => {
      if (remaining < 1 || generating) return;
      unlockAudioPlaybackFromGesture();
      armGenerationAutoplay();
      const remixSessionId = ++generateSessionRef.current;
      setGenerating(true);
      const generationKey = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `remix-${Date.now()}`;
      const baseTitle = (input.sourceLoopName || (d.remix)).replace(/\.[^.]+$/, "").slice(0, 48);
      const title = `${baseTitle} Remix`;
      const remixSlots: GenerationSlot[] = [{ idx: 1, status: "generating", title, seed: 0, visible: true, previewReady: false, progressPct: 0 }];
      setGenerationSlots(remixSlots);
      syncRemixGenerationStart(remixSessionId, remixSlots);
      let remixOk = false;
      try {
        trackClientEvent("remix_start", { task_type: input.taskType, plan, source: entrySource });
        const result = await remixLoopAce({
          audioFile: input.audioFile,
          prompt: input.prompt,
          lyrics: input.lyrics,
          taskType: input.taskType,
          coverStrength: input.coverStrength,
          durationSec: input.durationSec,
          bpm: input.bpm,
          instrumental: input.instrumental,
          audioFormat: effectiveAudioFormat,
          generationKey,
        });
        const parsedKey = parseKeyScale(result.meta?.keyScale ?? "");
        const draft: Omit<Loop, "id" | "createdAt" | "userId"> = {
          engine: "ace-step-remix",
          name: title,
          genre: form.genre === "Auto" ? "Remix" : form.genre,
          influence: form.influence,
          key: parsedKey.key,
          scale: parsedKey.scale,
          bpm: result.meta?.bpm && result.meta.bpm > 0 ? result.meta.bpm : form.bpm,
          loopLength: form.loopLength,
          swing: form.swing,
          mood: form.mood,
          energyLevel: form.energyLevel,
          reverb: form.reverb,
          prompt: input.prompt,
          audioUrl: result.audioUrl,
          seed: typeof result.meta?.seed === "number" ? result.meta.seed : null,
          details: {
            caption: input.prompt,
            lyrics: input.instrumental ? "" : input.lyrics,
            bpm: result.meta?.bpm ?? null,
            duration: result.meta?.duration ?? input.durationSec,
            keyScale: result.meta?.keyScale ?? "",
            timeSignature: result.meta?.timeSignature ?? "",
            audioFormat: result.meta?.audioFormat ?? effectiveAudioFormat,
            coverPrompt: buildCoverPromptSnapshot({
              prompt: input.prompt,
              genre: form.genre === "Auto" ? "Remix" : form.genre,
              mood: form.mood,
              influence: form.influence,
            }),
          },
          stemsUrl: result.meta?.taskId ? { ace: { taskId: result.meta.taskId } } : null,
          isSaved: false,
          isPublic: true,
        };
        const loop = await createLoop({ ...draft, name: title });
        remixOk = true;
        setGenerationSlots(null);
        syncGenerationSlots(null);
        autoplaySingleGenerationResult(loop, {
          versions: 1,
          workspaceFilter: { query, savedOnly },
          mobileV2,
          goResults,
          isActiveSession: () => true,
        });
        trackClientEvent("generate_success", { loop_id: loop.id, mode: "remix", versions: 1, plan, source: entrySource });
        consumeCredit();
        const usedAfterRemix = usedCountRef.current;
        trackFreeGenMilestonesWithUpsell({
          usedAfterGen: usedAfterRemix,
          loopId: loop.id,
          mode: "remix",
          source: entrySource,
        });
        triggerBeatReady(locale, loop.id, { isFirst: false, versionCount: 1 });
        toast.success(d.remixReady);
        if (shouldShowSharePromptAfterGeneration(usedAfterRemix)) {
            const shareLoop =
              pickLoopForSharePrompt(useLoopsStore.getState().loops, [loop.id], loop.id) ?? loop;
            trackClientEvent("growth_share_prompt", {
              loop_id: shareLoop.id,
              source: "post_remix",
              suggested: shareLoop.id !== loop.id,
            });
            setShareMomentLoop(shareLoop);
          }
        if (mobileV2) goResults();
        if (user) void refreshProfile({ silent: true });
      } catch (err) {
        const anyErr = err as { limitReached?: boolean };
        if (anyErr?.limitReached) {
          toast.error(d.monthlyLimitReached);
          promptPlanUpsell("limit_reached");
        } else if (err instanceof AceRemixUnavailableError) {
          toast.error(pickFrEn(locale, ACE_REMIX_UNAVAILABLE_COPY.fr, ACE_REMIX_UNAVAILABLE_COPY.en), {
            duration: TOAST_DURATIONS.persistent,
          });
        } else {
          toast.error(err instanceof Error ? err.message : d.remixFailed);
        }
        setGenerationSlots(null);
        syncGenerationSlots(null);
      } finally {
        setGenerating(false);
        syncRemixGenerationFinish(remixSessionId, { ok: remixOk, title });
      }
    },
    [
      consumeCredit,
      createLoop,
      effectiveAudioFormat,
      entrySource,
      form.bpm,
      form.energyLevel,
      form.genre,
      form.influence,
      form.loopLength,
      form.mood,
      form.reverb,
      form.swing,
      generating,
      goResults,
      locale,
      mobileV2,
      plan,
      promptPlanUpsell,
      refreshProfile,
      remaining,
      query,
      savedOnly,
      user,
    ],
  );

  const handleRecreateVibe = useCallback(
    async (input: { sourceLoop: Loop; styleTouch: string; instrumental: boolean }) => {
      if (remaining < 1 || generating) return;
      unlockAudioPlaybackFromGesture();
      armGenerationAutoplay();
      const vibeSessionId = ++generateSessionRef.current;
      setGenerating(true);
      const generationKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `vibe-${Date.now()}`;
      const title = variantResultTitle(input.sourceLoop, "remix");
      const vibeSlots: GenerationSlot[] = [{ idx: 1, status: "generating", title, seed: 0, visible: true, previewReady: false, progressPct: 0 }];
      setGenerationSlots(vibeSlots);
      syncRemixGenerationStart(vibeSessionId, vibeSlots);
      let vibeOk = false;

      const { inputParams, generateOptions, variantPrompt, nextSeed, engine, isSongLike } = prepareLoopVariantGeneration(
        input.sourceLoop,
        "remix",
        { styleTouch: input.styleTouch, forceInstrumental: input.instrumental },
      );

      try {
        trackClientEvent("remix_vibe_start", {
          instrumental: !isSongLike,
          plan,
          source: entrySource,
          source_loop_id: input.sourceLoop.id,
        });
        const result = await generateBeat(inputParams, engine, {
          ...generateOptions,
          audioFormat: input.sourceLoop.details?.audioFormat || effectiveAudioFormat,
          generationKey,
        });
        const rawAudioUrl = result.audioUrl;
        if (!rawAudioUrl) throw new Error(d.missingAudio);
        const previewId = `preview-${generationKey}`;
        const playbackUrl = await resolvePlaybackUrlForLoop(previewId, rawAudioUrl);
        const previewLoop: Loop = {
          id: previewId,
          userId: user?.id,
          createdAt: new Date().toISOString(),
          engine: result.engine,
          name: title,
          genre: input.sourceLoop.genre,
          influence: input.sourceLoop.influence,
          key: input.sourceLoop.key,
          scale: input.sourceLoop.scale,
          bpm: result.meta?.bpm && result.meta.bpm > 0 ? result.meta.bpm : input.sourceLoop.bpm,
          loopLength: input.sourceLoop.loopLength,
          swing: input.sourceLoop.swing,
          mood: input.sourceLoop.mood,
          energyLevel: input.sourceLoop.energyLevel,
          reverb: input.sourceLoop.reverb,
          prompt: variantPrompt,
          audioUrl: playbackUrl,
          seed: typeof result.meta?.seed === "number" && Number.isFinite(result.meta.seed) ? result.meta.seed : nextSeed,
          details: result.meta
            ? {
                caption: result.meta.prompt ?? variantPrompt,
                lyrics:
                  resolveAceLyricsForMeta({
                    parsedLyrics: result.meta.lyrics,
                    userLyrics: input.sourceLoop.details?.lyrics ?? "",
                    caption: result.meta.prompt ?? variantPrompt,
                    parsedPrompt: variantPrompt,
                  }) ||
                  resolveAceLyricsForMeta({
                    parsedLyrics: input.sourceLoop.details?.lyrics,
                    userLyrics: input.sourceLoop.details?.lyrics ?? "",
                    caption: variantPrompt,
                  }),
                bpm: result.meta.bpm ?? null,
                duration: result.meta.duration ?? input.sourceLoop.details?.duration ?? null,
                keyScale: result.meta.keyScale ?? "",
                timeSignature: result.meta.timeSignature ?? input.sourceLoop.details?.timeSignature ?? "",
                audioFormat: result.meta.audioFormat ?? input.sourceLoop.details?.audioFormat ?? effectiveAudioFormat,
                coverPrompt: buildCoverPromptSnapshot({
                  prompt: variantPrompt,
                  genre: input.sourceLoop.genre,
                  mood: input.sourceLoop.mood,
                  influence: input.sourceLoop.influence,
                }),
              }
            : input.sourceLoop.details
              ? { ...input.sourceLoop.details }
              : null,
          stemsUrl: null,
          isSaved: false,
          isPublic: true,
        };
        upsertLoop(previewLoop);
        if (rawAudioUrl.startsWith("http")) primeAudioCache(previewId, rawAudioUrl);
        autoplaySingleGenerationResult(previewLoop, {
          versions: 1,
          workspaceFilter: { query, savedOnly },
          mobileV2,
          goResults,
          isActiveSession: () => true,
        });

        const draft: Omit<Loop, "id" | "createdAt" | "userId"> = {
          engine: result.engine,
          name: title,
          genre: input.sourceLoop.genre,
          influence: input.sourceLoop.influence,
          key: input.sourceLoop.key,
          scale: input.sourceLoop.scale,
          bpm: result.meta?.bpm && result.meta.bpm > 0 ? result.meta.bpm : input.sourceLoop.bpm,
          loopLength: input.sourceLoop.loopLength,
          swing: input.sourceLoop.swing,
          mood: input.sourceLoop.mood,
          energyLevel: input.sourceLoop.energyLevel,
          reverb: input.sourceLoop.reverb,
          prompt: variantPrompt,
          audioUrl: rawAudioUrl,
          seed: typeof result.meta?.seed === "number" && Number.isFinite(result.meta.seed) ? result.meta.seed : nextSeed,
          details: result.meta
            ? {
                caption: result.meta.prompt ?? variantPrompt,
                lyrics:
                  resolveAceLyricsForMeta({
                    parsedLyrics: result.meta.lyrics,
                    userLyrics: input.sourceLoop.details?.lyrics ?? "",
                    caption: result.meta.prompt ?? variantPrompt,
                    parsedPrompt: variantPrompt,
                  }) ||
                  resolveAceLyricsForMeta({
                    parsedLyrics: input.sourceLoop.details?.lyrics,
                    userLyrics: input.sourceLoop.details?.lyrics ?? "",
                    caption: variantPrompt,
                  }),
                bpm: result.meta.bpm ?? null,
                duration: result.meta.duration ?? input.sourceLoop.details?.duration ?? null,
                keyScale: result.meta.keyScale ?? "",
                timeSignature: result.meta.timeSignature ?? input.sourceLoop.details?.timeSignature ?? "",
                audioFormat: result.meta.audioFormat ?? input.sourceLoop.details?.audioFormat ?? effectiveAudioFormat,
                coverPrompt: buildCoverPromptSnapshot({
                  prompt: variantPrompt,
                  genre: input.sourceLoop.genre,
                  mood: input.sourceLoop.mood,
                  influence: input.sourceLoop.influence,
                }),
              }
            : input.sourceLoop.details
              ? { ...input.sourceLoop.details }
              : null,
          stemsUrl: (() => {
            const taskId =
              (typeof result.meta?.taskId === "string" && result.meta.taskId.trim()) ||
              (typeof result.meta?.task_id === "string" && result.meta.task_id.trim()) ||
              "";
            const httpAudioUrl =
              (typeof result.meta?.httpAudioUrl === "string" && result.meta.httpAudioUrl.trim()) ||
              (result.audioUrl.startsWith("http") ? result.audioUrl.trim() : "");
            if (!taskId && !httpAudioUrl) return null;
            return {
              ace: {
                ...(taskId ? { taskId } : {}),
                ...(httpAudioUrl.startsWith("http") ? { httpAudioUrl } : {}),
                isSong: isSongLike,
                vibeRecreate: true,
                inspiredByLoopId: input.sourceLoop.id,
                inspiredFrom: loopToRemixSource(input.sourceLoop).id,
              },
            };
          })(),
          isSaved: false,
          isPublic: true,
        };
        const loop = await createLoop({ ...draft, name: title });
        await migrateAudioCache(previewId, loop.id);
        removeLoop(previewId);
        vibeOk = true;
        setGenerationSlots(null);
        syncGenerationSlots(null);
        autoplaySingleGenerationResult(loop, {
          versions: 1,
          workspaceFilter: { query, savedOnly },
          mobileV2,
          goResults,
          isActiveSession: () => true,
        });
        trackClientEvent("generate_success", {
          loop_id: loop.id,
          mode: isSongLike ? "song" : "beat",
          versions: 1,
          plan,
          source: entrySource,
          vibe_recreate: true,
        });
        consumeCredit();
        const usedAfterVibe = usedCountRef.current;
        trackFreeGenMilestonesWithUpsell({
          usedAfterGen: usedAfterVibe,
          loopId: loop.id,
          mode: isSongLike ? "song" : "beat",
          source: entrySource,
        });
        triggerBeatReady(locale, loop.id, { isFirst: false, versionCount: 1 });
        toast.success(getRemixVibeCopy(locale).successToast);
        if (shouldShowSharePromptAfterGeneration(usedAfterVibe)) {
          const shareLoop =
            pickLoopForSharePrompt(useLoopsStore.getState().loops, [loop.id], loop.id) ?? loop;
          trackClientEvent("growth_share_prompt", {
            loop_id: shareLoop.id,
            source: "post_vibe_recreate",
            suggested: shareLoop.id !== loop.id,
          });
          setShareMomentLoop(shareLoop);
        }
        if (mobileV2) goResults();
        if (user) void refreshProfile({ silent: true });
      } catch (err) {
        const anyErr = err as { limitReached?: boolean };
        if (anyErr?.limitReached) {
          toast.error(d.monthlyLimitReached);
          promptPlanUpsell("limit_reached");
        } else {
          toast.error(err instanceof Error ? err.message : d.remixFailed);
        }
        setGenerationSlots(null);
        syncGenerationSlots(null);
      } finally {
        setGenerating(false);
        syncRemixGenerationFinish(vibeSessionId, { ok: vibeOk, title });
      }
    },
    [
      consumeCredit,
      createLoop,
      effectiveAudioFormat,
      entrySource,
      generating,
      goResults,
      locale,
      migrateAudioCache,
      mobileV2,
      plan,
      primeAudioCache,
      promptPlanUpsell,
      refreshProfile,
      remaining,
      removeLoop,
      query,
      savedOnly,
      upsertLoop,
      user,
    ],
  );

  const handleCoverGenerate = useCallback(
    async (input: { lyrics: string; styleHint: string }) => {
      if (remaining < 1 || generating) return;
      unlockAudioPlaybackFromGesture();
      armGenerationAutoplay();
      const coverSessionId = ++generateSessionRef.current;
      setGenerating(true);
      const generationKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `cover-${Date.now()}`;
      const randomGenre = shouldPickRandomGenreAtGenerate(form.genre, input.styleHint.trim())
        ? pickRandomGenreValue()
        : undefined;
      if (randomGenre) setLastRandomGenre(randomGenre);
      const { promptGenre, displayGenre } = resolveGenreForGeneration(form.genre, input.styleHint.trim(), randomGenre);
      const title = coverResultTitle(displayGenre, locale);
      const coverSlots: GenerationSlot[] = [
        { idx: 1, status: "generating", title, seed: 0, visible: true, previewReady: false, progressPct: 0 },
      ];
      setGenerationSlots(coverSlots);
      syncRemixGenerationStart(coverSessionId, coverSlots);
      let coverOk = false;

      const { inputParams, generateOptions, prompt, seed, engine } = prepareCoverGeneration({
        lyrics: input.lyrics,
        genre: promptGenre,
        styleHint: input.styleHint,
        locale,
      });

      try {
        trackClientEvent("cover_start", { plan, source: entrySource, genre: displayGenre });
        const result = await generateBeat(inputParams, engine, {
          ...generateOptions,
          audioFormat: effectiveAudioFormat,
          generationKey,
        });
        const rawAudioUrl = result.audioUrl;
        if (!rawAudioUrl) throw new Error(d.missingAudio);
        const previewId = `preview-${generationKey}`;
        const playbackUrl = await resolvePlaybackUrlForLoop(previewId, rawAudioUrl);
        const previewLoop: Loop = {
          id: previewId,
          userId: user?.id,
          createdAt: new Date().toISOString(),
          engine: result.engine,
          name: title,
          genre: displayGenre,
          influence: "",
          key: result.meta?.keyScale?.split(" ")[0] ?? "",
          scale: result.meta?.keyScale?.split(" ")[1] ?? "",
          bpm: result.meta?.bpm && result.meta.bpm > 0 ? result.meta.bpm : 0,
          loopLength: "8 bars",
          swing: 0,
          mood: form.mood || "Auto",
          energyLevel: form.energyLevel || "Medium",
          reverb: form.reverb || "Medium",
          prompt,
          audioUrl: playbackUrl,
          seed: typeof result.meta?.seed === "number" && Number.isFinite(result.meta.seed) ? result.meta.seed : seed,
          details: {
            caption: result.meta?.prompt ?? prompt,
            lyrics: result.meta?.lyrics ?? input.lyrics,
            bpm: result.meta?.bpm ?? null,
            duration: result.meta?.duration ?? generateOptions.duration ?? null,
            keyScale: result.meta?.keyScale ?? "",
            timeSignature: result.meta?.timeSignature ?? "",
            audioFormat: result.meta?.audioFormat ?? effectiveAudioFormat,
            coverPrompt: buildCoverPromptSnapshot({
              prompt,
              genre: displayGenre,
              mood: form.mood,
              influence: "",
            }),
          },
          stemsUrl: null,
          isSaved: false,
          isPublic: true,
        };
        upsertLoop(previewLoop);
        if (rawAudioUrl.startsWith("http")) primeAudioCache(previewId, rawAudioUrl);
        autoplaySingleGenerationResult(previewLoop, {
          versions: 1,
          workspaceFilter: { query, savedOnly },
          mobileV2,
          goResults,
          isActiveSession: () => true,
        });

        const loop = await createLoop({
          engine: result.engine,
          name: title,
          genre: displayGenre,
          influence: "",
          key: previewLoop.key,
          scale: previewLoop.scale,
          bpm: previewLoop.bpm,
          loopLength: "8 bars",
          swing: 0,
          mood: previewLoop.mood,
          energyLevel: previewLoop.energyLevel,
          reverb: previewLoop.reverb,
          prompt,
          audioUrl: rawAudioUrl,
          seed: previewLoop.seed,
          details: previewLoop.details,
          stemsUrl: null,
          isSaved: false,
          isPublic: true,
        });
        await migrateAudioCache(previewId, loop.id);
        removeLoop(previewId);
        coverOk = true;
        setGenerationSlots(null);
        syncGenerationSlots(null);
        autoplaySingleGenerationResult(loop, {
          versions: 1,
          workspaceFilter: { query, savedOnly },
          mobileV2,
          goResults,
          isActiveSession: () => true,
        });
        trackClientEvent("generate_success", { loop_id: loop.id, mode: "cover", versions: 1, plan, source: entrySource });
        consumeCredit();
        const usedAfterCover = usedCountRef.current;
        trackFreeGenMilestonesWithUpsell({
          usedAfterGen: usedAfterCover,
          loopId: loop.id,
          mode: "cover",
          source: entrySource,
        });
        triggerBeatReady(locale, loop.id, { isFirst: false, versionCount: 1 });
        toast.success(d.coverReady);
        if (shouldShowSharePromptAfterGeneration(usedAfterCover)) {
          const shareLoop =
            pickLoopForSharePrompt(useLoopsStore.getState().loops, [loop.id], loop.id) ?? loop;
          trackClientEvent("growth_share_prompt", {
            loop_id: shareLoop.id,
            source: "post_cover",
            suggested: shareLoop.id !== loop.id,
          });
          setShareMomentLoop(shareLoop);
        }
        if (mobileV2) goResults();
        if (user) void refreshProfile({ silent: true });
      } catch (err) {
        const anyErr = err as { limitReached?: boolean };
        if (anyErr?.limitReached) {
          toast.error(d.monthlyLimitReached);
          promptPlanUpsell("limit_reached");
        } else {
          toast.error(err instanceof Error ? err.message : d.coverFailed);
        }
        setGenerationSlots(null);
        syncGenerationSlots(null);
      } finally {
        setGenerating(false);
        syncRemixGenerationFinish(coverSessionId, { ok: coverOk, title });
      }
    },
    [
      consumeCredit,
      createLoop,
      effectiveAudioFormat,
      entrySource,
      form.energyLevel,
      form.genre,
      form.mood,
      form.reverb,
      generating,
      goResults,
      locale,
      migrateAudioCache,
      mobileV2,
      plan,
      primeAudioCache,
      promptPlanUpsell,
      refreshProfile,
      remaining,
      removeLoop,
      query,
      savedOnly,
      setLastRandomGenre,
      upsertLoop,
      user,
    ],
  );

  useEffect(() => {
    if (!pendingLandingRequest || landingFormAppliedRef.current) return;

    landingFormAppliedRef.current = true;
    const { prompt, mode: landingMode, genreStrategy, acePrompt } = pendingLandingRequest;
    const handoffGenre = landingGenreForHandoff(prompt, genreStrategy);

    landingGenerateSnapshotRef.current = {
      prompt,
      acePrompt: acePrompt?.trim() || undefined,
      mode: landingMode,
      genre: handoffGenre,
      genreStrategy: genreStrategy ?? landingGenreStrategyFromPrompt(prompt),
    };
    setLandingAutoGenQueued(true);

    setMode(landingMode);
    setField("genre", handoffGenre);

    // Force les métadonnées manuelles (BPM/key/scale/mood/energyLevel) issues du form
    // au lieu du mode "auto" par défaut → même comportement que le générateur principal.
    if (landingMode === "song") {
      setSongUiMode("custom");
      setSongTempoMode("manual");
      setSongKeyMode("manual");
    } else {
      setAdvancedOpen(true);
      setBeatTempoMode("manual");
      setBeatKeyMode("manual");
    }

    if (landingMode === "song") {
      setSongUiMode("custom");
      setLyricsMode("ai");
      setSongDescription(prompt);
      setField("prompt", prompt);
      songAceOverrideRef.current = acePrompt?.trim() || null;
    } else {
      setField("prompt", prompt);
      beatAceOverrideRef.current = acePrompt?.trim() || null;
      if (!prompt.trim()) setSongDescription("");
    }

    clearLandingPendingGeneration();
    setPendingLandingRequest(null);
  }, [pendingLandingRequest, setAdvancedOpen, setBeatKeyMode, setBeatTempoMode, setField, setLyricsMode, setMode, setSongDescription, setSongKeyMode, setSongTempoMode, setSongUiMode]);

  useEffect(() => {
    if (!landingAutoGenQueued) return;
    if (autoLandingGenerateRef.current) return;
    if (!user || !quotaReady || generating) return;
    if (!landingGenerateSnapshotRef.current) return;

    if (remaining === 0) {
      setLandingAutoGenQueued(false);
      landingGenerateSnapshotRef.current = null;
      trackClientEvent("landing_auto_generate_blocked", { reason: "credits_exhausted", entry_source: entrySource });
      promptPlanUpsell("credits_exhausted");
      return;
    }

    const snap = landingGenerateSnapshotRef.current;
    const autogenKey = `${snap.mode}:${snap.genreStrategy}:${snap.prompt.slice(0, 120)}:${snap.genre}`;
    try {
      const done = window.sessionStorage.getItem("producerhit_landing_autogen_key");
      if (done === autogenKey) {
        setLandingAutoGenQueued(false);
        landingGenerateSnapshotRef.current = null;
        return;
      }
      window.sessionStorage.setItem("producerhit_landing_autogen_key", autogenKey);
    } catch {
      void 0;
    }

    autoLandingGenerateRef.current = true;
    setLandingAutoGenQueued(false);
    trackClientEvent("landing_auto_generate_start", { entry_source: entrySource, mobile: mobileV2 });
    toastSuccess(
      snap.genreStrategy === "random" || !snap.prompt.trim()
        ? d.surpriseStarted
        : d.generatingFromIdea,
      { duration: TOAST_DURATIONS.default },
    );
    if (mobileV2) goResults();
    void handleGenerate();
  }, [
    generating,
    entrySource,
    goResults,
    handleGenerate,
    landingAutoGenQueued,
    locale,
    mobileV2,
    quotaReady,
    promptPlanUpsell,
    remaining,
    user,
  ]);

  useEffect(() => {
    if (!user) return;
    const raw = window.localStorage.getItem("producerhit_pending_generation");
    if (!raw) return;
    window.localStorage.removeItem("producerhit_pending_generation");
    try {
      const pending = JSON.parse(raw) as {
        mode?: "beat" | "song";
        engine?: "sonauto" | "ace-step";
        form?: Partial<{
          genre: string;
          influence: string;
          key: string;
          scale: string;
          bpm: number;
          loopLength: string;
          swing: number;
          mood: string;
          energyLevel: string;
          reverb: string;
          prompt: string;
        }>;
        lyricsMode?: "ai" | "manual";
        lyrics?: string;
        songUiMode?: "simple" | "custom";
        songDescription?: string;
        songVocalStyle?: string;
      };
      if (pending.mode) setMode(pending.mode);
      const nextForm = pending.form ?? {};
      if (typeof nextForm.genre === "string") setField("genre", nextForm.genre);
      if (typeof nextForm.influence === "string") setField("influence", nextForm.influence);
      if (typeof nextForm.prompt === "string") setField("prompt", nextForm.prompt);
      if (typeof nextForm.key === "string") setField("key", nextForm.key);
      if (typeof nextForm.scale === "string") setField("scale", nextForm.scale);
      if (typeof nextForm.bpm === "number") setBpm(nextForm.bpm);
      if (typeof nextForm.loopLength === "string") setLoopLength(nextForm.loopLength as LoopLength);
      if (typeof nextForm.swing === "number") setField("swing", nextForm.swing);
      if (typeof nextForm.mood === "string") setField("mood", nextForm.mood);
      if (typeof nextForm.energyLevel === "string") setField("energyLevel", nextForm.energyLevel);
      if (typeof nextForm.reverb === "string") setField("reverb", nextForm.reverb);

      if (pending.lyricsMode) setLyricsMode(pending.lyricsMode);
      if (typeof pending.lyrics === "string") setLyrics(pending.lyrics);
      if (pending.songUiMode) setSongUiMode(pending.songUiMode);
      if (typeof pending.songDescription === "string") setSongDescription(pending.songDescription);
      if (typeof pending.songVocalStyle === "string") {
        const allowed = VOCAL_STYLE_OPTIONS.some((v) => v.value === pending.songVocalStyle);
        setSongVocalStyle(allowed ? (pending.songVocalStyle as VocalStyleValue) : "Singer");
      }
      setAutoGeneratePending(true);
    } catch {
      setAutoGeneratePending(false);
    }
  }, [setBpm, setField, setLoopLength, setLyrics, setLyricsMode, setMode, setSongDescription, setSongUiMode, setSongVocalStyle, user]);

  useEffect(() => {
    if (!autoGeneratePending) return;
    if (!user) return;
    if (generating || !quotaReady) return;
    if (!genreReady) return;
    setAutoGeneratePending(false);
    void handleGenerate();
  }, [autoGeneratePending, genreReady, generating, handleGenerate, quotaReady, user]);

  useEffect(() => {
    if (!mobileV2) return;
    if (generating) goResults();
  }, [generating, goResults, mobileV2]);

  useEffect(() => {
    if (!mobileV2 || mobileTab !== "results" || !mobileGenActive) return;
    const timer = window.setTimeout(() => {
      mobileGenerationsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [mobileGenActive, mobileTab, mobileV2]);

  const saveDetailsTitle = useCallback(() => {
    if (!detailsLoop) return;
    const next = detailsTitle.trim();
    if (!next || next === detailsLoop.name) return;
    void (async () => {
      setSavingDetailsTitle(true);
      try {
        await renameLoopRemote(detailsLoop.id, next);
        toast.success(d.titleUpdated);
      } catch (err) {
        const message = err instanceof Error ? err.message : d.error;
        toast.error(message);
      } finally {
        setSavingDetailsTitle(false);
      }
    })();
  }, [detailsLoop, detailsTitle, locale, renameLoopRemote]);

  const chipRowClass = "mt-2 flex min-w-0 max-w-full flex-wrap gap-2";

  const openMaster = useCallback(
    (loop: Loop) => {
      setMasterLoopId(loop.id);
      setWorkspaceView("master");
      if (mobileV2) goMaster();
      trackClientEvent("mastering_open", { loop_id: loop.id, source: "loop_card" });
    },
    [goMaster, mobileV2],
  );

  const handleLoopOpenDetails = useCallback((loop: Loop) => {
    setDetailsId((prev) => (prev === loop.id ? null : loop.id));
  }, []);

  // PERF (patch 3/4): these used to be inline arrow functions created fresh
  // on every Dashboard render and handed straight to modal JSX. Now that
  // those modals live in the memoized <DashboardGrowthModals>, stabilizing
  // these callbacks is what actually lets that subtree skip re-rendering —
  // an inline arrow prop here would defeat the memo just as the old
  // `queueLoops` reference did for LoopCardItem (patch 1).
  const closeDistributionWizard = useCallback(() => setDistributionLoop(null), []);

  const closeShareMomentModal = useCallback(() => {
    setShareMomentLoop(null);
    if (pendingReferralAfterShareRef.current) {
      pendingReferralAfterShareRef.current = false;
      scheduleReferralPrompt(1400);
    }
  }, [scheduleReferralPrompt]);

  const makeShareMomentLoopPublic = useCallback(() => {
    void (async () => {
      const target = shareMomentLoop;
      if (!target) return;
      try {
        await togglePublicRemote(target.id);
        const updated = useLoopsStore.getState().loops.find((l) => l.id === target.id);
        if (updated) setShareMomentLoop(updated);
        toast.success(d.trackPublicLive);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : d.error);
      }
    })();
  }, [d.error, d.trackPublicLive, shareMomentLoop, togglePublicRemote]);

  const closeReferralPrompt = useCallback(() => setReferralPromptOpen(false), []);

  const tryWavFormat = useCallback(() => setAudioFormatPref("wav"), []);

  const upgradeProFromWavCoach = useCallback(() => promptPlanUpsell("feature_wav_format"), [promptPlanUpsell]);

  const closeMasteringUpsell = useCallback(() => setMasteringUpsellLoop(null), []);

  const tryMasteringFromUpsell = useCallback(() => {
    const loop = masteringUpsellLoop;
    setMasteringUpsellLoop(null);
    if (loop) openMaster(loop);
  }, [masteringUpsellLoop, openMaster]);

  const upgradeFromMasteringUpsell = useCallback(() => {
    setMasteringUpsellLoop(null);
    openMasteringUpgrade();
  }, [openMasteringUpgrade]);

  // PERF (patch 4 — résultats): stabiliser les callbacks passés à MasteringPanel
  // et LoopDetailsSheet/LoopCardItem. Chacun était recréé en closure inline à
  // chaque render de Dashboard — même si MasteringPanel ou LoopCardItem sont
  // mémoïsés, une nouvelle prop function invalide le memo à chaque fois.
  const closeLoopDetails = useCallback(() => setDetailsId(null), []);

  const onMasteringApplied = useCallback(() => {
    setWorkspaceView("tracks");
    if (mobileV2) setMobileTab("results");
  }, [mobileV2]);

  const onMasteringExit = useCallback(() => {
    setWorkspaceView("tracks");
    if (mobileV2) setMobileTab("results");
  }, [mobileV2]);

  const onMasteringGamificationRefresh = useCallback(
    () => setGamificationRefreshKey((k) => k + 1),
    [],
  );

  const openMasteringUpgradeFromPanel = useCallback(
    () => openMasteringUpgrade(),
    [openMasteringUpgrade],
  );

  const showMasterWorkspace = mobileV2 ? mobileTab === "master" : workspaceView === "master";

  const [remixGenerateBridge, setRemixGenerateBridge] = useState<PanelGenerateBridge | null>(null);
  const [coverGenerateBridge, setCoverGenerateBridge] = useState<PanelGenerateBridge | null>(null);
  const altGenerateBridge = isRemix ? remixGenerateBridge : isCover ? coverGenerateBridge : null;

  const mobileResultsScrollClass = mobileV2
    ? cn(
        "pk-dashboard-results-scroll",
        hasMobilePlayer ? "pk-shell-dock-pb--player" : "pk-shell-dock-pb",
      )
    : "";

  const dashboardPromoAndGaming = (
    <DashboardPromoBillboard
      locale={locale}
      plan={plan}
      onShare={openBillboardShare}
      onReferral={() => void openBillboardReferral()}
      onCommunity={openBillboardCommunity}
      onMastering={openBillboardMastering}
      onProgress={openBillboardProgress}
      onPricing={openBillboardPricing}
      onProfile={openBillboardProfile}
      onCreate={openBillboardCreate}
      bonusAction={
        <DailyBonusBannerButton
          locale={locale}
          syncRewards={!!user}
          onCreditsChange={(credits) => {
            setLevelBonus(credits.levelBonus);
            setDailyBonusMonth(credits.dailyBonusMonth);
            setGamificationRefreshKey((k) => k + 1);
          }}
          onOpenProgress={openBillboardProgress}
        />
      }
    />
  );

  return (
    <AppShell
      theme="prism"
      mobileLayoutV2={mobileV2}
      mobilePanel={mobileTab}
      consoleHeader={
        <DashboardStudioBrand
          mode={mode}
          locale={locale}
          remixRecreate={isRemixVibeRecreateEnabled()}
        />
      }
      mobileTabs={
        mobileV2 ? (
          <DashboardMobileTabs
            tab={mobileTab}
            onChange={(next) => {
              setMobileTab(next);
              setDetailsId(null);
              if (next === "master") setWorkspaceView("master");
              else if (next === "results") setWorkspaceView("tracks");
            }}
            createLabel={t.app.tabCreate}
            resultsLabel={t.app.tabResults}
            masterLabel={t.app.tabMaster}
            resultsBadge={mobileResultsBadge}
          />
        ) : undefined
      }
      left={
        <div
          className={cn(
            "pk-studio-left-stack pk-dashboard-generator flex min-h-0 min-w-0 max-w-full flex-1 flex-col md:h-full md:overflow-hidden",
            mobileV2 && mobileTab === "create" && "pk-mobile-create-shell",
          )}
        >
          <div
            className={cn(
              "pk-mobile-create-chrome flex-shrink-0",
              mobileV2 ? "px-3 pb-1 pt-1" : "border-b border-pk-border p-4 md:border-white/10",
            )}
          >
            <CheckoutRecoveryBanner
              locale={locale}
              location="dashboard"
              currentPlan={billingBannersReady ? billingPlan : undefined}
              planReady={billingBannersReady}
              className={mobileV2 ? "mb-2" : "mb-3"}
            />
            {billingBannersReady && billingPlan === "free" && remaining > 2 ? (
              <FreeUpgradeStrip
                locale={locale}
                location="dashboard_strip"
                plan={billingPlan}
                ready={billingBannersReady}
                className={mobileV2 ? "mb-2" : "mb-3"}
              />
            ) : null}
            <div className={cn("flex items-center gap-2", mobileV2 ? "w-full" : "justify-between")}>
              <div
                data-coach="mode-rail"
                className={cn(
                  "flex min-w-0 items-center gap-1",
                  "pk-studio-mode-rail",
                  mobileV2 && "flex-1 rounded-2xl bg-black/20 p-1 ring-1 ring-white/[0.06]",
                )}
              >
                <button
                  type="button"
                  onClick={() => setMode("song")}
                  className={cn(
                    "rounded-xl px-2.5 py-2 text-[10px] font-medium transition-all active:scale-[0.98] sm:px-3 sm:text-xs",
                    mobileV2 && "min-h-11 min-w-0 flex-1 text-center",
                    mode === "song"
                      ? "pk-prism-pill-active"
                      : mobileV2
                        ? "text-white/65 hover:text-white"
                        : "text-white/50 hover:text-white",
                  )}
                >
                  {t.landing.modeSong}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("beat")}
                  className={cn(
                    "rounded-xl px-2.5 py-2 text-[10px] font-medium transition-all active:scale-[0.98] sm:px-3 sm:text-xs",
                    mobileV2 && "min-h-11 min-w-0 flex-1 text-center",
                    mode === "beat"
                      ? "pk-prism-pill-active"
                      : mobileV2
                        ? "text-white/65 hover:text-white"
                        : "text-white/50 hover:text-white",
                  )}
                >
                  {t.landing.modeBeat}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("cover")}
                  className={cn(
                    "rounded-xl px-2.5 py-2 text-[10px] font-medium transition-all active:scale-[0.98] sm:px-3 sm:text-xs",
                    mobileV2 && "min-h-11 min-w-0 flex-1 text-center",
                    mode === "cover"
                      ? "pk-prism-pill-active"
                      : mobileV2
                        ? "text-white/65 hover:text-white"
                        : "text-white/50 hover:text-white",
                  )}
                >
                  {t.app.modeCover}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("remix")}
                  className={cn(
                    "rounded-xl px-2.5 py-2 text-[10px] font-medium transition-all active:scale-[0.98] sm:px-3 sm:text-xs",
                    mobileV2 && "min-h-11 min-w-0 flex-1 text-center",
                    mode === "remix"
                      ? "pk-prism-pill-active"
                      : mobileV2
                        ? "text-white/65 hover:text-white"
                        : "text-white/50 hover:text-white",
                  )}
                >
                  {t.app.modeRemix}
                </button>
                {mobileV2 && (mode === "song" || mode === "beat") ? (
                  <button
                    type="button"
                    aria-label={t.app.advancedSettings}
                    aria-pressed={mode === "song" ? songUiMode === "custom" : advancedOpen}
                    onClick={() => {
                      if (mode === "song") setSongUiMode((v) => (v === "custom" ? "simple" : "custom"));
                      else setAdvancedOpen((v) => !v);
                    }}
                    className={cn(
                      "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all active:scale-[0.95]",
                      (mode === "song" ? songUiMode === "custom" : advancedOpen)
                        ? "pk-prism-pill-active"
                        : "text-white/65 hover:text-white",
                    )}
                  >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
              </div>
              {!mobileV2 && (mode === "song" || mode === "beat") ? (
                <button
                  type="button"
                  onClick={() => {
                    if (mode === "song") setSongUiMode((v) => (v === "custom" ? "simple" : "custom"));
                    else setAdvancedOpen((v) => !v);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[10px] font-medium transition-colors",
                    (mode === "song" ? songUiMode === "custom" : advancedOpen)
                      ? "pk-prism-pill-active"
                      : "bg-white/5 text-white/55 hover:text-white",
                  )}
                >
                  {t.landing.modeAdvanced}
                </button>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              "pk-studio-left-scroll min-h-0 min-w-0 max-w-full md:overflow-y-auto",
              mobileV2 ? "pk-mobile-create-scroll overflow-y-auto" : "flex-1 overflow-y-auto",
            )}
          >
            {mode === "remix" ? (
              <RemixStudioPanel
                locale={locale}
                loops={loops}
                generating={generating}
                remaining={remaining}
                vibeRecreateMode={isRemixVibeRecreateEnabled()}
                externalRemix={externalRemix}
                onExternalRemixConsumed={() => setExternalRemix(null)}
                compactSections={mobileV2}
                onGenerateBridgeChange={setRemixGenerateBridge}
                onGenerate={(input) => void handleRemixGenerate(input)}
                onRecreateVibe={(input) => void handleRecreateVibe(input)}
              />
            ) : mode === "cover" ? (
              <CoverStudioPanel
                locale={locale}
                genre={form.genre}
                lastRandomGenre={lastRandomGenre}
                onGenreChange={(v) => setField("genre", v)}
                generating={generating}
                remaining={remaining}
                compactSections={mobileV2}
                onGenerateBridgeChange={setCoverGenerateBridge}
                onGenerate={(input) => void handleCoverGenerate(input)}
              />
            ) : mode === "beat" ? (
              <>
                <GeneratorSection
                  title={d.styleVibe}
                  hint={d.genreMenuHint}
                  collapsible={mobileV2}
                  defaultOpen={mobileV2 ? mobileSectionDefaultOpen : true}
                >
                  <div className="grid min-w-0 max-w-full gap-4">
                    <GenrePickControl
                      compact
                      locale={locale}
                      genre={form.genre}
                      ideaFilled={dashboardIdeaText.length > 0}
                      onGenreChange={(v) => setField("genre", v)}
                      lastRandomGenre={lastRandomGenre}
                    />
                    <Dropdown
                      label={d.mood}
                      menuTitle={d.mood}
                      value={form.mood}
                      onChange={(v) => setField("mood", v)}
                      options={ambianceDropdownOptions}
                    />

                    <Dropdown
                      label={d.energy}
                      menuTitle={d.energy}
                      value={form.energyLevel}
                      onChange={(v) => setField("energyLevel", v)}
                      options={energyDropdownOptions}
                    />
                  </div>
                </GeneratorSection>

                <IdeaPromptSection
                  locale={locale}
                  promptLocale={beatPromptLocale}
                  mode="beat"
                  formGenre={form.genre}
                  value={form.prompt}
                  onChange={(v) => {
                    beatAceOverrideRef.current = null;
                    setField("prompt", v);
                  }}
                  onPickAce={(ace) => {
                    beatAceOverrideRef.current = ace?.trim() || null;
                  }}
                  onRotatingPlaceholder={(text) => {
                    beatRotatingPlaceholderRef.current = text;
                  }}
                  onPickGenre={(v) => setField("genre", v)}
                  collapsible={mobileV2}
                  defaultOpen={mobileV2 ? mobileSectionDefaultOpen : true}
                />

                <GeneratorSection
                  title={d.soundTitle}
                  collapsible={mobileV2}
                  defaultOpen={false}
                >

                  <input
                    value={requestedTitle}
                    onChange={(e) => setRequestedTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-purple-400/45 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1),0_0_12px_rgba(139,92,246,0.06)] backdrop-blur-sm transition-all duration-200"
                    placeholder={d.titlePlaceholder}
                  />
                </GeneratorSection>

                {advancedOpen && debugEnabled ? (
                  <div className={cn("border-b border-pk-border bg-pk-bg/30", generatorSectionPad)}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold">ACE Debug</div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="px-2 py-1 text-[11px]"
                        onClick={() => {
                          const instrumental = true;
                          const promptParams = autoMetaEnabled ? { ...aceDebugParams, bpm: 0, key: "", scale: "" } : aceDebugParams;
                          const caption = buildAceCaption(promptParams, { isSong: false, instrumental, autoMeta: autoMetaEnabled, vocalLanguage: "en" });
                          const payload = {
                            caption,
                            instrumental,
                            vocalLanguage: "en",
                            sampleMode: false,
                            useFormat: true,
                            loopLengthBars: bars,
                            duration: undefined,
                            bpm: autoMetaEnabled ? undefined : aceDebugParams.bpm || undefined,
                            keyScale: autoMetaEnabled ? undefined : aceDebugParams.key && aceDebugParams.scale ? `${aceDebugParams.key} ${aceDebugParams.scale}` : undefined,
                          };
                          void (async () => {
                            try {
                              await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
                              toast.success(d.copied);
                            } catch {
                              toast.error(d.copyFailed);
                            }
                          })();
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 rounded-pk border border-pk-border bg-white/5 p-3 text-[11px] text-pk-text whitespace-pre-wrap break-words">
                      {(() => {
                        const instrumental = true;
                        const promptParams = autoMetaEnabled ? { ...aceDebugParams, bpm: 0, key: "", scale: "" } : aceDebugParams;
                        const caption = buildAceCaption(promptParams, { isSong: false, instrumental, autoMeta: autoMetaEnabled, vocalLanguage: "en" });
                        const payload = {
                          caption,
                          instrumental,
                          vocalLanguage: "en",
                          sampleMode: false,
                          useFormat: true,
                          loopLengthBars: bars,
                          bpm: autoMetaEnabled ? undefined : aceDebugParams.bpm || undefined,
                          keyScale: autoMetaEnabled ? undefined : aceDebugParams.key && aceDebugParams.scale ? `${aceDebugParams.key} ${aceDebugParams.scale}` : undefined,
                        };
                        return JSON.stringify(payload, null, 2);
                      })()}
                    </div>
                  </div>
                ) : null}

                {advancedOpen && (
                  <div className={cn("min-w-0 max-w-full overflow-x-clip border-b border-pk-border", generatorSectionPad)}>
                    <div className="text-sm font-semibold">{d.tempoKey}</div>

                    <div className="mt-4 grid min-w-0 max-w-full gap-4">
                      <div>
                        <div className="pk-gen-inline-toggle-row flex min-w-0 items-center justify-between gap-2 mb-2">
                          <div className="min-w-0 shrink text-xs text-pk-muted">BPM</div>
                          <div className="flex shrink-0 items-center rounded-full border border-pk-border bg-pk-bg p-0.5">
                            <button
                              type="button"
                              onClick={() => setBeatTempoMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                beatTempoMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setBeatTempoMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                beatTempoMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>
                        {beatTempoMode === "manual" ? (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="text-[11px] text-pk-muted">{d.manualBpm}</div>
                              <input
                                type="number"
                                min={60}
                                max={200}
                                value={form.bpm}
                                onChange={(e) => setBpm(Math.max(60, Math.min(200, Number(e.target.value))))}
                                className="w-16 bg-transparent text-right text-sm font-semibold text-pk-text outline-none"
                              />
                            </div>
                            <div className="mt-3 flex gap-2">
                              {bpmPresets.map((p) => (
                                <button
                                  key={p.label}
                                  type="button"
                                  onClick={() => setBpm(p.value)}
                                  className={`flex-1 rounded-pk border py-1.5 text-[11px] transition-colors ${
                                    form.bpm === p.value
                                      ? "border-pk-accent/40 bg-pk-accent/15 text-pk-accent"
                                      : "border-pk-border bg-pk-bg text-pk-muted hover:text-pk-text"
                                  }`}
                                >
                                  {p.value}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">
                            {d.aiPicksBpm}
                          </div>
                        )}
                      </div>

                      <div className="grid gap-3">
                        <div className="pk-gen-inline-toggle-row flex min-w-0 items-center justify-between gap-2">
                          <div className="min-w-0 shrink text-xs text-pk-muted">{d.musicalKey}</div>
                          <div className="flex shrink-0 items-center rounded-full border border-pk-border bg-pk-bg p-0.5">
                            <button
                              type="button"
                              onClick={() => setBeatKeyMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                beatKeyMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setBeatKeyMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                beatKeyMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>

                        {beatKeyMode === "manual" ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Dropdown
                                label=""
                                value={form.key}
                                onChange={(v) => setField("key", v)}
                                options={keyOptions.map((k) => ({ value: k, label: k }))}
                              />
                            </div>
                            <div>
                              <Dropdown
                                label=""
                                value={form.scale}
                                onChange={(v) => setField("scale", v)}
                                options={scaleOptions}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">
                            {d.aiPicksKey}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {advancedOpen && (
                  <div className={cn("pk-studio-section min-w-0 max-w-full overflow-x-clip border-b border-pk-border bg-pk-bg/30", generatorSectionPad)}>
                    <div className="text-sm font-semibold">{d.advanced}</div>
                    <div className="mt-4 grid min-w-0 max-w-full gap-4">
                      <Dropdown
                        label={d.influence}
                        menuTitle={d.producerInfluence}
                        value={form.influence}
                        onChange={(v) => setField("influence", v)}
                        options={influenceDropdownOptions}
                      />
                      <GeneratorAdvancedOutputControls
                        locale={locale}
                        versions={versions}
                        onVersionsChange={setVersions}
                        remaining={remaining}
                        chipRowClass={chipRowClass}
                        canDualGeneration={dualGenerationAllowed}
                        onDualLocked={handleDualLocked}
                      />
                      <div>
                        <div className="text-xs text-pk-muted mb-2">{d.length}</div>
                        <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
                          {lengths.map((l) => {
                            const active = form.loopLength === l;
                            return (
                              <button
                                key={l}
                                type="button"
                                onClick={() => setLoopLength(l)}
                                className={
                                  active
                                    ? "rounded-pk border border-pk-accent/40 bg-pk-accent/15 py-2 text-[11px] font-semibold text-pk-accent"
                                    : "rounded-pk border border-pk-border bg-pk-bg py-2 text-[11px] text-pk-muted hover:bg-white/5 hover:text-pk-text"
                                }
                              >
                                {l.replace(" bars", "")}b
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <Slider
                        label="Swing"
                        value={form.swing}
                        min={0}
                        max={100}
                        onChange={(v) => setField("swing", v)}
                        rightLabel={`${form.swing}%`}
                      />

                      <Dropdown
                        label="Reverb"
                        value={form.reverb}
                        onChange={(v) => setField("reverb", v)}
                        options={reverbOptions}
                      />

                      <div data-coach="audio-format">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">{d.audioFormat}</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setAudioFormatPref("mp3")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                effectiveAudioFormat === "mp3" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              MP3
                            </button>
                            <button
                              type="button"
                              onClick={handleWavFormatClick}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                effectiveAudioFormat === "wav" ? "bg-pk-accent text-white" : "text-pk-muted"
                              } ${plan === "free" ? "opacity-50" : ""}`}
                            >
                              WAV
                            </button>
                          </div>
                        </div>
                        {plan === "free" ? (
                          <div className="text-[10px] text-pk-muted italic">
                            {d.wavUnlockPro}
                          </div>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">
                            {d.proToggleWav}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                <div className="p-4">
                  <details className="group">
                    <summary className="cursor-pointer select-none text-xs font-semibold text-pk-muted hover:text-pk-text flex items-center gap-1">
                      <Search className="h-3 w-3" />
                      <span>{d.quickPresets}</span>
                    </summary>
                    <div className="mt-3 grid gap-2">
                      {presets.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => {
                            setField("genre", p.genre);
                            setField("influence", p.influence);
                            setBpm(p.bpm);
                            setField("mood", p.mood);
                            setField("energyLevel", p.energyLevel);
                            setLoopLength(p.loopLength);
                            setField("prompt", p.prompt);
                            setField("key", p.key);
                            setField("scale", p.scale);
                          }}
                          className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-left text-[11px] text-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.08] hover:border-white/[0.14] hover:text-white hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                        >
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-pk-muted">{p.bpm} BPM</span>
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              </>
            ) : null}

            {mode === "song" ? (
              <>
                <GeneratorSection
                  title={d.theStyle}
                  hint={d.genreMenuHint}
                  collapsible={mobileV2}
                  defaultOpen={mobileV2 ? mobileSectionDefaultOpen : true}
                >
                  <GenrePickControl
                    compact
                    locale={locale}
                    genre={form.genre}
                    ideaFilled={dashboardIdeaText.length > 0}
                    onGenreChange={(v) => setField("genre", v)}
                    lastRandomGenre={lastRandomGenre}
                  />
                </GeneratorSection>

                <GeneratorSection
                  title={d.language}
                  hint={d.languageHint}
                  collapsible={mobileV2}
                  defaultOpen={mobileV2 ? mobileSectionDefaultOpen : true}
                >
                  <Dropdown
                    menuTitle={d.languageMenu}
                    value={songVocalLanguageMode === "auto" ? "auto" : manualVocalLanguage}
                    onChange={(v) => {
                      if (v === "auto") {
                        setSongVocalLanguageMode("auto");
                      } else {
                        setSongVocalLanguageMode("manual");
                        setManualVocalLanguage(v);
                      }
                    }}
                    options={[vocalLanguageAutoOption(locale), ...vocalLanguageDropdownOptions(locale)]}
                  />
                </GeneratorSection>

                <IdeaPromptSection
                  locale={locale}
                  promptLocale={songPromptLocale}
                  mode="song"
                  formGenre={form.genre}
                  value={songDescription}
                  onChange={(v) => {
                    songAceOverrideRef.current = null;
                    songBankDiceRef.current = false;
                    setSongDescription(v);
                  }}
                  onPickAce={(ace) => {
                    songAceOverrideRef.current = ace?.trim() || null;
                  }}
                  onPickFromBank={(fromBank) => {
                    songBankDiceRef.current = fromBank;
                  }}
                  onRotatingPlaceholder={(text) => {
                    songRotatingPlaceholderRef.current = text;
                  }}
                  onPickGenre={(v) => setField("genre", v)}
                  collapsible={mobileV2}
                  defaultOpen={mobileV2 ? mobileSectionDefaultOpen : true}
                />

                <GeneratorSection
                  title={d.lyrics}
                  collapsible={mobileV2}
                  defaultOpen={mobileV2 ? mobileSectionDefaultOpen : true}
                >
                  <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLyricsMode("manual")}
                      className={`rounded-full px-3.5 py-1.5 text-[10px] font-semibold transition-all duration-200 ${
                        lyricsMode === "manual" ? "pk-prism-pill-active" : "bg-white/[0.05] text-white/50 hover:text-white/80 hover:bg-white/[0.08]"
                      }`}
                    >
                      {d.iWrite}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLyricsMode("ai")}
                      className={`rounded-full px-3.5 py-1.5 text-[10px] font-semibold transition-all duration-200 ${
                        lyricsMode === "ai" ? "pk-prism-pill-active" : "bg-white/[0.05] text-white/50 hover:text-white/80 hover:bg-white/[0.08]"
                      }`}
                    >
                      {d.aiWrites}
                    </button>
                  </div>
                  {lyricsMode === "manual" ? (
                    <>
                      {DASHBOARD_VOICE_SECTIONS_ENABLED && user?.id ? (
                        <VoiceLyricsImport
                          locale={locale}
                          userId={user.id}
                          plan={plan}
                          used={voiceToSongUsed}
                          onTranscript={(text) => {
                            setLyrics(text);
                            setLyricsMode("manual");
                          }}
                          onUsageUpdate={setVoiceToSongUsed}
                          onUpsell={() => promptPlanUpsell("feature_voice_to_song")}
                        />
                      ) : null}
                      <div className="pk-dashboard-text-field mt-3">
                        <SpeechDictationField
                          multiline
                          locale={locale}
                          value={lyrics}
                          onChange={setLyrics}
                          rows={DASHBOARD_PROMPT_ROWS}
                          micPlacement="inside"
                          wrapperClassName="pk-dashboard-text-field-wrap"
                          className="pk-dashboard-text-field__control bg-white/[0.05] border border-white/[0.1] text-sm text-white/90 placeholder:text-white/35 focus:border-purple-400/45 backdrop-blur-sm"
                          placeholder={d.lyricsPlaceholder}
                          showStatus={false}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 text-center backdrop-blur-sm">
                      <p className="text-[11px] italic text-pk-muted leading-relaxed">
                        {d.aiWritesLyricsHint}
                      </p>
                    </div>
                  )}
                </GeneratorSection>

                {DASHBOARD_VOICE_SECTIONS_ENABLED && user?.id ? (
                  <GeneratorSection
                    title={d.singingVoice}
                    hint={d.voiceProfileHint}
                    collapsible={mobileV2}
                    defaultOpen={mobileV2 ? mobileSectionDefaultOpen : true}
                  >
                    <VoicePickerCompact
                      locale={locale}
                      plan={plan}
                      cloneUsed={voiceCloneUsed}
                      activeProfileId={activeVoiceProfileId}
                      strength={voiceCloneStrength}
                      onActiveProfileChange={(id) => {
                        setActiveVoiceProfileId(id);
                        voiceCloneConfigRef.current = { ...voiceCloneConfigRef.current, profileId: id };
                        if (user?.id) writeVoiceStudioPrefs(user.id, { profileId: id });
                      }}
                      onStrengthChange={(strength) => {
                        setVoiceCloneStrength(strength);
                        voiceCloneConfigRef.current = { ...voiceCloneConfigRef.current, strength };
                        if (user?.id) writeVoiceStudioPrefs(user.id, { strength });
                      }}
                      onUpsell={() => promptPlanUpsell("feature_voice_clone")}
                    />
                  </GeneratorSection>
                ) : null}

                <GeneratorSection
                  title={d.songTitle}
                  collapsible={mobileV2}
                  defaultOpen={false}
                >
                  <input
                    value={requestedTitle}
                    onChange={(e) => setRequestedTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-purple-400/45 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1),0_0_12px_rgba(139,92,246,0.06)] backdrop-blur-sm transition-all duration-200"
                    placeholder={d.titlePlaceholder}
                  />
                </GeneratorSection>

                {songIsCustom && (
                  <div className={cn("pk-studio-section min-w-0 max-w-full overflow-x-clip border-b border-pk-border bg-pk-bg/30", generatorSectionPad)}>
                    <div className="text-sm font-semibold">{d.advancedSettings}</div>
                    <div className="mt-4 grid min-w-0 max-w-full gap-4">
                      <GeneratorAdvancedOutputControls
                        locale={locale}
                        versions={versions}
                        onVersionsChange={setVersions}
                        remaining={remaining}
                        chipRowClass={chipRowClass}
                        canDualGeneration={dualGenerationAllowed}
                        onDualLocked={handleDualLocked}
                        showVocalStyle
                        vocalStyle={songVocalStyle}
                        onVocalStyleChange={setSongVocalStyle}
                      />
                      <Dropdown
                        label={d.influence}
                        value={form.influence}
                        onChange={(v) => setField("influence", v)}
                        options={influenceDropdownOptions}
                      />
                      
                      <div className="min-w-0">
                        <div className="pk-gen-inline-toggle-row mb-2 flex min-w-0 items-center justify-between gap-2">
                          <div className="min-w-0 shrink text-xs text-pk-muted">Tempo</div>
                          <div className="flex shrink-0 items-center rounded-full border border-pk-border bg-pk-bg p-0.5">
                            <button
                              type="button"
                              onClick={() => setSongTempoMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songTempoMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setSongTempoMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songTempoMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>
                        {songTempoMode === "manual" ? (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="text-[11px] text-pk-muted">BPM</div>
                              <input
                                type="number"
                                min={60}
                                max={200}
                                value={form.bpm}
                                onChange={(e) => setBpm(Math.max(60, Math.min(200, Number(e.target.value))))}
                                className="w-12 bg-transparent text-right text-[11px] font-semibold text-pk-text outline-none"
                              />
                            </div>
                            <div className="mt-2 flex gap-1.5">
                              {[90, 120, 140].map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setBpm(v)}
                                  className={`flex-1 rounded-pk border py-1 text-[10px] transition-colors ${
                                    form.bpm === v 
                                      ? "border-pk-accent/40 bg-pk-accent/15 text-pk-accent" 
                                      : "border-pk-border bg-pk-bg text-pk-muted hover:text-pk-text"
                                  }`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">
                            {d.aiPicksTempo}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="pk-gen-inline-toggle-row mb-2 flex min-w-0 items-center justify-between gap-2">
                          <div className="min-w-0 shrink text-xs text-pk-muted">{d.duration}</div>
                          <div className="flex shrink-0 items-center rounded-full border border-pk-border bg-pk-bg p-0.5">
                            <button
                              type="button"
                              onClick={() => setSongDurationMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songDurationMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setSongDurationMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songDurationMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>
                        {songDurationMode === "manual" ? (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="text-[11px] text-pk-muted">{d.seconds}</div>
                              <input
                                type="number"
                                min={10}
                                max={songDurationMax}
                                value={songDurationSec}
                                onChange={(e) => setSongDurationSec(Math.max(10, Math.min(songDurationMax, Number(e.target.value) || 30)))}
                                className="w-12 bg-transparent text-right text-[11px] font-semibold text-pk-text outline-none"
                              />
                            </div>
                            <div className="mt-2 flex gap-1.5">
                              {songDurationPresets.filter((p) => p <= songDurationMax).map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => setSongDurationSec(p)}
                                  className={`flex-1 rounded-pk border py-1 text-[10px] transition-colors ${
                                    songDurationSec === p 
                                      ? "border-pk-accent/40 bg-pk-accent/15 text-pk-accent" 
                                      : "border-pk-border bg-pk-bg text-pk-muted hover:text-pk-text"
                                  }`}
                                >
                                  {p}s
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">
                            {d.aiPicksDuration}
                          </div>
                        )}
                      </div>

                      <div data-coach="audio-format">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">{d.audioFormat}</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setAudioFormatPref("mp3")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                effectiveAudioFormat === "mp3" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              MP3
                            </button>
                            <button
                              type="button"
                              onClick={handleWavFormatClick}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                effectiveAudioFormat === "wav" ? "bg-pk-accent text-white" : "text-pk-muted"
                              } ${plan === "free" ? "opacity-50" : ""}`}
                            >
                              WAV
                            </button>
                          </div>
                        </div>
                        {plan === "free" ? (
                          <div className="text-[10px] text-pk-muted italic">
                            {d.wavUnlockPro}
                          </div>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">
                            {d.proToggleWav}
                          </div>
                        )}
                      </div>

                      <div className="bg-pk-bg/50 rounded-pk p-3 border border-pk-border/30">
                        <div className="text-xs text-pk-muted mb-2">
                          {d.contextChips}
                        </div>
                        <InspirationChipRow
                          className="mt-0"
                          chips={getInspirationChipsForGenre(chipGenre)}
                          isActive={(chip) => songDescription.includes(chip)}
                          onChipClick={(chip) => {
                            const current = songDescription.trim();
                            const on = current.includes(chip);
                            if (on) {
                              setSongDescription(
                                current
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter((s) => s !== chip)
                                  .join(", "),
                              );
                            } else {
                              setSongDescription(current ? `${current}, ${chip}` : chip);
                            }
                          }}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">{d.musicalKey}</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setSongKeyMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songKeyMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setSongKeyMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songKeyMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>
                        {songKeyMode === "manual" ? (
                          <div className="grid gap-2">
                            <div className="grid grid-cols-4 gap-1 sm:grid-cols-6">
                              {keyOptions.map((k) => {
                                const active = form.key === k;
                                return (
                                  <button
                                    key={k}
                                    type="button"
                                    onClick={() => setField("key", k)}
                                    className={
                                      active
                                        ? "min-h-9 rounded-pk border border-pk-accent/40 bg-pk-accent/15 py-1.5 text-[10px] font-semibold text-pk-accent sm:py-1"
                                        : "min-h-9 rounded-pk border border-pk-border bg-pk-bg py-1.5 text-[10px] text-pk-muted hover:bg-white/5 hover:text-pk-text sm:py-1"
                                    }
                                  >
                                    {k}
                                  </button>
                                );
                              })}
                            </div>
                            <Dropdown
                              label=""
                              value={form.scale}
                              onChange={(v) => setField("scale", v)}
                              options={scaleOptions}
                            />
                          </div>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">
                            {d.aiPicksKeyScale}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">{d.timeSignature}</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setSongTimeSignatureMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songTimeSignatureMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setSongTimeSignatureMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songTimeSignatureMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>
                        {songTimeSignatureMode === "manual" ? (
                          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                            {timeSignatureOptions.map((sig) => (
                              <button
                                key={sig}
                                type="button"
                                onClick={() => setSongTimeSignature(sig)}
                                className={`min-h-9 rounded-pk border py-1.5 text-[10px] transition-colors sm:py-1 ${
                                  songTimeSignature === sig 
                                    ? "border-pk-accent/40 bg-pk-accent/15 text-pk-accent" 
                                    : "border-pk-border bg-pk-bg text-pk-muted hover:text-pk-text"
                                }`}
                              >
                                {sig}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">
                            {d.aiPicksSignature}
                          </div>
                        )}
                      </div>

                      <Slider
                        label="Reverb"
                        value={form.reverb === "Dry" ? 0 : form.reverb === "Subtle" ? 25 : form.reverb === "Medium" ? 50 : 80}
                        min={0}
                        max={100}
                        onChange={(v) => {
                          const label = v < 15 ? "Dry" : v < 40 ? "Subtle" : v < 70 ? "Medium" : "Heavy";
                          setField("reverb", label);
                        }}
                        rightLabel={form.reverb}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          <div
            data-coach="generate-btn"
            className={cn(
              "flex-shrink-0 border-t border-pk-border/80 p-4",
              mobileV2 ? "pk-dashboard-mobile-footer border-t-white/10 px-3 pt-2.5 pb-2" : "pk-studio-generate-dock",
            )}
          >
            {isRemix || isCover ? (
              altGenerateBridge ? (
                <DashboardGenerateButton
                  generating={altGenerateBridge.generating}
                  disabled={remaining >= 1 && !altGenerateBridge.canSubmit}
                  creditBlocked={remaining < 1}
                  idleLabel={altGenerateBridge.idleLabel}
                  generatingLabel={altGenerateBridge.generatingLabel}
                  onClick={async () => {
                    if (remaining < 1) {
                      promptCreditsBlocked(1);
                      return;
                    }
                    if (!user) {
                      navigate("/auth", { state: { from: "/dashboard" } });
                      return;
                    }
                    if (altGenerateBridge.generating) return;
                    altGenerateBridge.submit();
                  }}
                />
              ) : null
            ) : (
              <DashboardGenerateButton
                generating={generating}
                progressPct={generationProgressPct}
                disabled={!genreReady || generating || !quotaReady}
                creditBlocked={remaining < versions}
                idleLabel={mode === "song" ? d.generateSong : d.generateBeat}
                generatingLabel={d.generating}
                onClick={async () => {
                  if (remaining < versions) {
                    promptCreditsBlocked();
                    return;
                  }
                  if (generating) return;
                  if (!user) {
                    window.localStorage.setItem(
                      "producerhit_pending_generation",
                      JSON.stringify({
                        mode,
                        engine,
                        form,
                        lyricsMode,
                        lyrics,
                        songUiMode,
                        songDescription,
                        songVocalStyle,
                      }),
                    );
                    navigate("/auth", { state: { from: "/dashboard" } });
                    return;
                  }
                  await handleGenerate();
                }}
              />
            )}
            <div className={cn(mobileV2 ? "pk-dashboard-mobile-footer__meta mt-1.5" : "mt-3")}>
              {mobileV2 ? (
                <div className="pk-dashboard-mobile-footer__quota-row pk-dashboard-mobile-footer__quota-row--compact">
                  {showQuotaLoading ? (
                    <span className="text-white/50">
                      {d.loadingQuota}
                    </span>
                  ) : (
                    <span
                      className="pk-dashboard-mobile-footer__quota-compact inline-flex min-w-0 max-w-full items-center gap-1 overflow-hidden text-white/50"
                      title={`${remaining}/${totalLimit} ${d.leftThisMonth} · ${d.planPrefixFr}${plan}${bonusCreditsTotal > 0 ? ` · +${bonusCreditsTotal} ${d.activeBonus}` : ""}`}
                    >
                      <span className="shrink-0 tabular-nums font-medium text-white/72">
                        {remaining}/{totalLimit}
                      </span>
                      <GenerationCreditIcon className="h-3 w-3 shrink-0" />
                      <span className="shrink-0 opacity-35" aria-hidden>
                        ·
                      </span>
                      <span className="pk-dashboard-mobile-footer__plan shrink-0 capitalize">{plan}</span>
                      {bonusCreditsTotal > 0 ? (
                        <>
                          <span className="shrink-0 opacity-35" aria-hidden>
                            ·
                          </span>
                          <GenerationCreditAmount
                            amount={bonusCreditsTotal}
                            showPlus
                            iconClassName="h-2.5 w-2.5"
                            className="shrink-0 text-white/55"
                          />
                        </>
                      ) : null}
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex min-w-0 flex-wrap items-center gap-1 text-gray-500">
                      {showQuotaLoading ? (
                        d.loadingQuota
                      ) : (
                        <>
                          <span className="tabular-nums font-medium">
                            {remaining}/{totalLimit}
                          </span>
                          <GenerationCreditIcon className="h-3 w-3 shrink-0" />
                          <span>{d.leftThisMonth}</span>
                        </>
                      )}
                    </span>
                    <span className="shrink-0 text-gray-600">
                      {showQuotaLoading
                        ? d.planEllipsis
                        : `${d.planPrefixFr}${plan}`}
                    </span>
                  </div>
                  <div
                    className={cn(
                      reserveBonusMetaRow ? "min-h-[1.125rem]" : "",
                      bonusCreditsTotal > 0 ? undefined : "invisible",
                    )}
                    aria-hidden={bonusCreditsTotal <= 0}
                  >
                    {bonusCreditsTotal > 0 ? (
                      <div className="pk-dashboard-bonus-meta mt-1 inline-flex flex-wrap items-center gap-1 text-[10px]">
                        <GenerationCreditAmount
                          amount={bonusCreditsTotal}
                          showPlus
                          iconClassName="h-2.5 w-2.5 pk-dashboard-bonus-meta__gem"
                          className="pk-dashboard-bonus-meta__amount"
                        />
                        <span>
                          {d.activeBonus}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
            {plan === "free" && remaining > 0 && remaining <= 2 ? (
              <div className="pk-dashboard-mobile-footer__upsell mt-2 flex flex-col gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
                <span>
                  {remaining === 1
                    ? d.upsellRemainingSingular
                    : `${d.upsellRemainingPluralPrefix}${remaining}${d.upsellRemainingPluralMid}`}
                </span>
                <button
                  type="button"
                  className="text-left font-semibold text-amber-200 hover:text-white"
                  onClick={() => void runCheckoutWithAuth({ plan: "pro", location: "dashboard_mobile_upsell", locale })}
                >
                  {`${d.seeProPrefix}${planPriceLabel("pro", locale, { suffix: true })}`}
                </button>
              </div>
            ) : null}
            {remaining === 0 ? (
              <div className="pk-dashboard-mobile-footer__upsell mt-2 flex flex-col gap-2 text-xs text-gray-500">
                {plan === "free"
                  ? `${d.quotaExhaustedFree} (${usedThisMonth}/${totalLimit})${d.quotaExhaustedFreeSuffix}`
                  : d.noCreditsUpgrade}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="pk-prism-holo-text font-semibold hover:opacity-90"
                    onClick={() => promptPlanUpsell("credits_exhausted")}
                  >
                    {recommendedUpgradePlan(plan)
                      ? `${d.upgradeTo}${recommendedUpgradePlan(plan) === "plus" ? "Plus" : recommendedUpgradePlan(plan) === "studio" ? "Studio" : "Pro"}`
                      : d.seeOptions}
                  </button>
                  <button
                    type="button"
                    className="font-semibold text-cyan-300/90 hover:text-cyan-200"
                    onClick={() => void runCreditPackCheckout({ product: "credit_pack_50", location: "dashboard_mobile_exhausted", locale })}
                  >
                    {getCreditPackCtaLabel(locale)}
                  </button>
                  <Link to="/pricing" className="text-white/45 hover:text-white/70">
                    {d.comparePlans}
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      }
    >
      <div
        className={cn(
          "mx-auto w-full max-w-[1120px] px-4 md:px-6 lg:px-8",
          mobileV2 && mobileTab === "results" ? "pt-2" : "pt-5 md:pt-6",
          mobileResultsScrollClass,
        )}
      >
        {!mobileV2 ? dashboardPromoAndGaming : null}
        {showMasterWorkspace ? (
          <MasteringPanel
            locale={locale}
            loops={loops}
            selectedLoopId={masterLoopId}
            onSelectLoop={setMasterLoopId}
            plan={plan}
            onUpgrade={openMasteringUpgradeFromPanel}
            gamificationRefresh={onMasteringGamificationRefresh}
            onApplied={onMasteringApplied}
            onExit={onMasteringExit}
          />
        ) : (
          <>
        {mobileV2 && mobileTab === "results" ? (
          <MobileResultsToolbar
            locale={locale}
            generating={generating}
            activeCount={mobileResultsBadge}
            onCreate={goCreate}
          />
        ) : null}
        {mobileV2 && mobileTab === "results" ? (
          <div className="pk-mobile-gen-notice pk-mobile-results-filters mb-3 flex flex-col gap-3 rounded-2xl border px-3 py-3 backdrop-blur-xl">
            <p className="pk-workspace-track-count text-xs tabular-nums text-white/50">
              {hasWorkspaceFilters
                ? `${workspaceVisibleCount} / ${workspaceFilteredTotal} · ${libraryTotalCount}`
                : `${workspaceVisibleCount} / ${libraryTotalCount}`}
            </p>
            <div className="relative min-w-0 w-full max-w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pk-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={d.searchCreations}
                className="pk-workspace-search-field w-full rounded-xl border border-white/[0.1] bg-white/[0.05] py-2.5 pl-9 pr-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-purple-400/45 focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1)] backdrop-blur-sm transition-all duration-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSavedOnly(false)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  !savedOnly ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                {d.all}
              </button>
              <button
                type="button"
                onClick={() => setSavedOnly(true)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  savedOnly ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                {d.saved}
              </button>
            </div>
          </div>
        ) : (
        <div className="pk-studio-workspace-header flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="pk-studio-workspace-header__intro min-w-0">
            <div className="pk-studio-workspace-header__title text-lg font-medium">{d.myWorkspace}</div>
            <div className="mt-1 text-sm text-pk-muted">
              {`${d.showingOfPrefix}${workspaceVisibleCount}${d.showingOfMid}${hasWorkspaceFilters ? workspaceFilteredTotal : libraryTotalCount}`}
            </div>
          </div>
          <div className="pk-studio-workspace-header__controls">
            <div className="pk-studio-workspace-header__tabs">
              <button
                type="button"
                onClick={() => setWorkspaceView("tracks")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  workspaceView === "tracks" ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                {d.tracks}
              </button>
              <button
                type="button"
                onClick={() => {
                  setWorkspaceView("master");
                  goMaster();
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  workspaceView === "master" ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                {d.masteringStudio}
              </button>
            </div>
            <div className="pk-studio-workspace-header__search">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-pk-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={d.searchCreations}
                className="pk-workspace-search-field w-full rounded-pk border border-pk-border px-9 py-2 text-sm outline-none placeholder:text-pk-muted focus:border-pk-accent"
              />
            </div>
            <div className="pk-studio-workspace-header__filters">
              <button
                type="button"
                onClick={() => setSavedOnly(false)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  !savedOnly ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                {d.all}
              </button>
              <button
                type="button"
                onClick={() => setSavedOnly(true)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  savedOnly ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                {d.saved}
              </button>
            </div>
          </div>
        </div>
        )}

        <div ref={mobileGenerationsAnchorRef} className="mt-3 space-y-2 scroll-mt-3">
          {workspaceJobs.length ? (
            <div className="space-y-2">
              {workspaceJobs.map((j) => (
                <LoopCardSkeleton key={j.id} title={j.title} sub={j.sub} />
              ))}
            </div>
          ) : null}
          {visibleGenerationSlots.length ? (
            <div className="space-y-2">
              {sortedVisibleGenerationSlots.map((slot) => {
                  if (slot.visible && slot.status === "queued") {
                    return (
                      <LoopCardSkeleton
                        key={slot.idx}
                        title={slot.title}
                        sub={d.waitingVersion1}
                      />
                    );
                  }
                  if (slot.visible && slot.status === "waiting") {
                    return (
                      <LoopCardSkeleton
                        key={slot.idx}
                        title={slot.title}
                        sub={d.version2Starting}
                      />
                    );
                  }
                  if (slot.visible && slot.status === "generating") {
                    const pct = slot.progressPct ?? 0;
                    const sub = pct >= 90 ? d.finishingUp : d.generatingProgress;
                    const vocalHint = isSong && pct >= 85 ? d.songVocalRegenerateHint : undefined;
                    return (
                      <LoopCardSkeleton
                        key={slot.idx}
                        title={slot.title}
                        sub={sub}
                        hint={vocalHint}
                        progressPct={pct}
                        progressLabel={d.progressLabel}
                      />
                    );
                  }
                  if (slot.visible && slot.status === "error") {
                    return (
                      <div
                        key={slot.idx}
                        className="flex items-center gap-2.5 rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-3 py-2.5 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_6px_rgba(0,0,0,0.15),0_10px_24px_rgba(0,0,0,0.2)]"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/20">
                          <AlertTriangle className="h-4 w-4 text-rose-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-pk-text">{slot.title}</div>
                          <div className="mt-0.5 text-xs text-pk-muted">{slot.errorText || d.generationFailedShort}</div>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 rounded-xl px-2.5 py-1 text-xs font-semibold text-white/50 transition-all duration-200 hover:bg-white/[0.08] hover:text-white/80"
                          onClick={() => {
                            setGenerationSlots((prev) => {
                              if (!prev) return null;
                              const next = prev.filter((s) => s.idx !== slot.idx);
                              syncGenerationSlots(next.length ? next : null);
                              return next.length ? next : null;
                            });
                          }}
                        >
                          {d.dismiss}
                        </button>
                      </div>
                    );
                  }
                  return null;
                })}
            </div>
          ) : null}
          {displayedLoops.length === 0 &&
          loopsLoading &&
          !loopsHydrated &&
          !generating &&
          visibleGenerationSlots.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <LoopCardSkeleton
                  key={i}
                  title={d.loadingCreations}
                  sub={d.fetchingAccount}
                />
              ))}
            </div>
          ) : displayedLoops.length === 0 ? (
            loopsSyncError ? (
              <div className="rounded-pk bg-gradient-to-br from-[rgba(157,124,255,0.22)] via-transparent to-[rgba(103,195,255,0.08)] p-[1px] shadow-[0_0_0_1px_rgba(157,124,255,0.08),0_0_24px_rgba(157,124,255,0.10)]">
                  <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_25px_rgba(0,0,0,0.2),0_20px_48px_rgba(0,0,0,0.25)]">
                  <div className="mt-2 text-sm font-semibold text-pk-text">
                    {d.failedLoadCreations}
                  </div>
                  <div className="mt-1 text-sm text-pk-muted">
                    {d.loadCreationsErrorBody}
                  </div>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <Button
                      variant="primary"
                      onClick={() => {
                        void loadMyLoops();
                      }}
                    >
                      {d.retry}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        window.location.reload();
                      }}
                    >
                      {d.reload}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <EmptyState
                  title={d.creationsAppearHere}
                  description={
                    mobileV2
                      ? d.emptyCreateMobile
                      : `${d.emptyCreateConfigurePrefix}${mode === "song" ? d.generateSong : d.generateBeat}${d.emptyCreateConfigureSuffix}`
                  }
                  accent
                />
                {mobileV2 ? (
                  <div className="flex justify-center">
                    <Button variant="primary" onClick={goCreate}>
                      {d.goToCreate}
                    </Button>
                  </div>
                ) : null}
              </div>
            )
          ) : detailsLoop && !mobileV2 ? (
            <div className="md:grid md:grid-cols-[minmax(0,1fr)_420px] md:gap-5">
              <div className="space-y-5">
                {displayedLoops.map((l, loopIdx) => (
                  <div key={l.id}>
                    <LoopCardItem
                      loop={l}
                      slotIndex={loopIdx}
                      compact={mobileV2}
                      queueLoops={stableDisplayedLoops}
                      onOpenDetails={handleLoopOpenDetails}
                      onGenerationUsed={consumeCredit}
                      onCoverRerollUsed={consumeCredit}
                      onProducerTagCreditUsed={consumeCredit}
                      creditsRemaining={remaining}
                      onNeedCredits={handleNeedCredits}
                      onStartWorkspaceJob={startWorkspaceJob}
                      onOpenMaster={openMaster}
                    />
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <div className="sticky top-6 max-h-[calc(100vh-32px)] overflow-y-auto">
                  <div className="pk-studio-detail-panel relative overflow-hidden rounded-[1.5rem] p-5 backdrop-blur-xl border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_25px_rgba(0,0,0,0.2),0_20px_48px_rgba(0,0,0,0.25)]">
                    <div className="pk-prism-panel-glow" />
                    <LoopDetailsSheetHeader
                      title={detailsLoop.name}
                      onClose={closeLoopDetails}
                      closeLabel={d.close}
                    />
                    <LoopDetailsPanel
                      loop={detailsLoop}
                      locale={locale}
                      detailsTitle={detailsTitle}
                      onDetailsTitleChange={setDetailsTitle}
                      savingDetailsTitle={savingDetailsTitle}
                      onSaveTitle={saveDetailsTitle}
                      durationSec={durationsSecById[detailsLoop.id]}
                      className="px-0"
                      onOpenDistribution={openDistribution}
                      onOpenTagStudio={openTagStudio}
                      onOpenMastering={openMasteringModal}
                      creditsRemaining={remaining}
                      onNeedCredits={handleNeedCredits}
                      onProducerTagCreditUsed={consumeCredit}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div ref={cardRevealRef} className="pk-stagger space-y-5">
              {displayedLoops.map((l, loopIdx) => (
                <div key={l.id} className="pk-card-reveal" style={{ transitionDelay: `${Math.min(loopIdx * 60, 360)}ms` }}>
                  <LoopCardItem
                    loop={l}
                    slotIndex={loopIdx}
                    compact={mobileV2}
                    queueLoops={stableDisplayedLoops}
                    onOpenDetails={handleLoopOpenDetails}
                    onGenerationUsed={consumeCredit}
                    onCoverRerollUsed={consumeCredit}
                    onProducerTagCreditUsed={consumeCredit}
                    creditsRemaining={remaining}
                    onNeedCredits={handleNeedCredits}
                    onStartWorkspaceJob={startWorkspaceJob}
                    onOpenMaster={openMaster}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}
      </div>
      {mobileV2 && detailsLoop ? (
        <LoopDetailsSheet
          open
          onClose={closeLoopDetails}
          title={detailsLoop.name}
          closeLabel={d.close}
        >
          <LoopDetailsPanel
            loop={detailsLoop}
            locale={locale}
            detailsTitle={detailsTitle}
            onDetailsTitleChange={setDetailsTitle}
            savingDetailsTitle={savingDetailsTitle}
            onSaveTitle={saveDetailsTitle}
            durationSec={durationsSecById[detailsLoop.id]}
            className="px-0"
            compact
            onOpenDistribution={openDistribution}
            onOpenTagStudio={openTagStudio}
            onOpenMastering={openMasteringModal}
            creditsRemaining={remaining}
            onNeedCredits={handleNeedCredits}
            onProducerTagCreditUsed={consumeCredit}
          />
        </LoopDetailsSheet>
      ) : null}
      <DashboardGrowthModals
        locale={locale}
        plan={plan}
        distributionLoop={distributionLoop}
        authProfile={authProfile}
        onCloseDistribution={closeDistributionWizard}
        shareMomentLoop={shareMomentLoop}
        onCloseShareMoment={closeShareMomentModal}
        onShareMomentMakePublic={makeShareMomentLoopPublic}
        referralPromptOpen={referralPromptOpen}
        referralCode={referralCodeForPrompt}
        onCloseReferralPrompt={closeReferralPrompt}
        onPrepareWavCoachTarget={prepareWavCoachTarget}
        onTryWav={tryWavFormat}
        onUpgradeProFromWavCoach={upgradeProFromWavCoach}
        masteringUpsellLoop={masteringUpsellLoop}
        onCloseMasteringUpsell={closeMasteringUpsell}
        onTryMastering={tryMasteringFromUpsell}
        onUpgradeFromMasteringUpsell={upgradeFromMasteringUpsell}
      />
      <TagStudioModal
        open={Boolean(activeTagLoopId)}
        loopName={activeTagLoopId ? loops.find((l) => l.id === activeTagLoopId)?.name : undefined}
        onClose={() => setActiveTagLoopId(null)}
      />
      <MasteringModal
        open={Boolean(masteringModalLoop)}
        loop={masteringModalLoop}
        onClose={() => setMasteringModalLoop(null)}
        onApplied={(updated) => {
          setWorkspaceView("tracks");
          if (mobileV2) setMobileTab("results");
        }}
        onUpgrade={openMasteringUpgradeFromPanel}
        locale={locale}
      />
    </AppShell>
  );
}
