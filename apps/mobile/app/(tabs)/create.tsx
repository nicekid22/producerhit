import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Animated, InteractionManager, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  DEFAULT_GENERATOR,
  DEFAULT_SONG,
  FROM_IDEA_GENRE_VALUE,
  MOBILE_BEAT_MOODS,
  MOBILE_LOOP_LENGTHS,
  MOBILE_MUSICAL_KEYS,
  MOBILE_SCALES,
  MOBILE_VOCAL_STYLES,
  RANDOM_GENRE_VALUE,
  genreSelectionHint,
  isCatalogGenreSelection,
  isFromIdeaGenreSelection,
  isRandomGenreSelection,
  pickRandomGenreValue,
  resolveGenreForGeneration,
  shouldPickRandomGenreAtGenerate,
  getInspirationChipsForGenre,
  resolveGenerationCaptionContext,
  resolveSongVocalLanguage,
  defaultVocalLanguagePreference,
  type GenerationJobStatus,
  type LoopLength,
  type MobileVocalStyle,
} from "@producerhit/shared";
import { ActivationChecklist, markActivationStep } from "@/components/ActivationChecklist";
import { SoftUpgradeSheet, type SoftUpgradeKind } from "@/components/SoftUpgradeSheet";
import { PromptConsole } from "@/components/PromptConsole";
import { StudioCoachBubble } from "@/components/StudioCoachBubble";
import { StudioHero } from "@/components/StudioHero";
import { GenerationQuotaBadge } from "@/components/GenerationQuotaBadge";
import { useCoachMarks } from "@/lib/useCoachMarks";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";
import { useTabScreenBottomPadding } from "@/lib/useTabScreenBottomPadding";
import { InspirationChipRow } from "@/components/InspirationChipRow";
import { PromptDiceButton } from "@/components/PromptDiceButton";
import { MobileAceCaptionPreview } from "@/components/MobileAceCaptionPreview";
import { useRotatingPlaceholder } from "@/lib/useRotatingPlaceholder";
import { useStaggerEntrance } from "@/lib/useStaggerEntrance";
import { PhButton } from "@/components/PhButton";
import { PhCard } from "@/components/PhCard";
import { PhTextField } from "@/components/PhTextField";
import { GenerationProgress } from "@/components/GenerationProgress";
import { GlassErrorBanner } from "@/components/GlassErrorBanner";
import { GenrePicker } from "@/components/GenrePicker";
import { GenreChips } from "@/components/GenreChips";
import { VocalLanguagePicker } from "@/components/VocalLanguagePicker";
import { SegmentPills } from "@/components/SegmentPills";
import { StudioAdvancedSection } from "@/components/StudioAdvancedSection";
import { StudioModeToggle, type StudioMode } from "@/components/StudioModeToggle";
import { jobStatusLabelI18n } from "@/lib/i18n/catalog";
import { useGenerationProgress } from "@/lib/useGenerationProgress";
import { boostGenerationPolling } from "@/lib/generationPolling";
import { defaultBeatName, generateSong, generateTypeBeat, usageSummary } from "@/lib/loopsApi";
import { paywallHref, type IapPaidPlan } from "@/lib/iapCatalog";
import { loadActivationSteps } from "@/lib/onboardingProgress";
import { consumeFirstBeatPaywallPrompt, shouldShowSoftQuotaPaywall } from "@/lib/paywallFunnel";
import { SubscriptionService } from "@/lib/subscriptionService";
import { isPaidPlan } from "@/lib/planEntitlements";
import { resolveGenerationPlaybackQueue } from "@/lib/playbackQueue";
import { formatGenerationError } from "@/lib/generationErrors";
import { useGenerationPrefsStore } from "@/stores/generationPrefsStore";
import { resolveMobilePromptLocale } from "@/lib/resolvePromptLocale";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/stores/localeStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

export default function CreateScreen() {
  const router = useRouter();
  const screenFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const refreshProfileAfterGeneration = useAuthStore((s) => s.refreshProfileAfterGeneration);
  const setCurrent = usePlayerStore((s) => s.setCurrent);
  const setExpanded = usePlayerStore((s) => s.setExpanded);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const playbackError = usePlayerStore((s) => s.playbackError);
  const setPlaybackError = usePlayerStore((s) => s.setPlaybackError);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const durationMs = usePlayerStore((s) => s.durationMs);
  const { t, tf, locale } = useI18n();
  const vocalLanguageMode = useGenerationPrefsStore((s) => s.vocalLanguageMode);
  const manualVocalLanguage = useGenerationPrefsStore((s) => s.manualVocalLanguage);
  const setVocalLanguage = useGenerationPrefsStore((s) => s.setVocalLanguage);
  const studioAdvancedOpen = useGenerationPrefsStore((s) => s.studioAdvancedOpen);
  const setStudioAdvancedOpen = useGenerationPrefsStore((s) => s.setStudioAdvancedOpen);
  const prefsHydrated = useGenerationPrefsStore((s) => s.hydrated);
  const onboardingCreationMode = useGenerationPrefsStore((s) => s.onboardingCreationMode);
  const onboardingGenre = useGenerationPrefsStore((s) => s.onboardingGenre);
  const { colors, typography } = useTheme();
  const { contentMaxWidth, isTablet } = useResponsiveLayout();
  const scrollBottomPadding = useTabScreenBottomPadding(spacing.lg);
  const coach = useCoachMarks();

  const [mode, setMode] = useState<StudioMode>("song");
  const [genre, setGenre] = useState(DEFAULT_SONG.genre);
  const [beatGenre, setBeatGenre] = useState(DEFAULT_GENERATOR.genre);
  const [bpm, setBpm] = useState(String(DEFAULT_GENERATOR.bpm));
  const [songDescription, setSongDescription] = useState("");
  const [beatPrompt, setBeatPrompt] = useState("");
  const [beatMood, setBeatMood] = useState(DEFAULT_GENERATOR.mood);
  const [beatKey, setBeatKey] = useState(DEFAULT_GENERATOR.key);
  const [beatScale, setBeatScale] = useState(DEFAULT_GENERATOR.scale);
  const [vocalStyle, setVocalStyle] = useState<MobileVocalStyle>("Singer");
  const [loopLength, setLoopLength] = useState<LoopLength>(DEFAULT_GENERATOR.loopLength);
  const [lyricsMode, setLyricsMode] = useState<"ai" | "manual">("ai");
  const [lyrics, setLyrics] = useState("");
  const [generating, setGenerating] = useState(false);
  const [awaitingPlayback, setAwaitingPlayback] = useState(false);
  const [jobStatus, setJobStatus] = useState<GenerationJobStatus | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [songFieldFocused, setSongFieldFocused] = useState(false);
  const [beatFieldFocused, setBeatFieldFocused] = useState(false);
  const [songDiceAcePreview, setSongDiceAcePreview] = useState<string | null>(null);
  const [beatDiceAcePreview, setBeatDiceAcePreview] = useState<string | null>(null);
  const [diceTipVisible, setDiceTipVisible] = useState(false);
  const [lastRandomGenre, setLastRandomGenre] = useState<string | undefined>();
  const [softUpgradeVisible, setSoftUpgradeVisible] = useState(false);
  const [softUpgradeKind, setSoftUpgradeKind] = useState<SoftUpgradeKind>("low_quota");
  const [softUpgradePlan, setSoftUpgradePlan] = useState<IapPaidPlan>("pro");
  const [progressSession, setProgressSession] = useState(0);
  const generateInFlightRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const lastScrollSessionRef = useRef(-1);

  const songAceOverrideRef = useRef<string | null>(null);
  const songLyricsOverrideRef = useRef<string | null>(null);
  const songBankDiceRef = useRef(false);
  const beatAceOverrideRef = useRef<string | null>(null);

  useEffect(() => {
    songAceOverrideRef.current = null;
    songLyricsOverrideRef.current = null;
    songBankDiceRef.current = false;
    beatAceOverrideRef.current = null;

    if (!prefsHydrated) return;
    const vocalPref = defaultVocalLanguagePreference(locale);
    void setVocalLanguage(vocalPref.mode, vocalPref.manualCode);
  }, [locale, prefsHydrated, setVocalLanguage]);
  const onboardingPrefsAppliedRef = useRef(false);
  const pendingPlaybackLoopIdRef = useRef<string | null>(null);

  const usage = useMemo(() => usageSummary(profile), [profile]);

  useEffect(() => {
    if (!screenFocused || isPaidPlan(profile?.plan)) return;
    if (usage.remaining <= 0 || usage.remaining > 2) return;
    void shouldShowSoftQuotaPaywall().then((show) => {
      if (!show) return;
      setSoftUpgradeKind("low_quota");
      setSoftUpgradePlan("pro");
      setSoftUpgradeVisible(true);
    });
  }, [screenFocused, profile?.plan, usage.remaining]);

  /** Preload StoreKit prices before user hits quota / paywall (avoids "Prix App Store" flash). */
  useEffect(() => {
    if (isPaidPlan(profile?.plan)) return;
    if (usage.remaining > 2) return;
    void SubscriptionService.init().then(() => SubscriptionService.refreshProducts());
  }, [profile?.plan, usage.remaining]);

  useFocusEffect(
    useCallback(() => {
      if (generating || awaitingPlayback) boostGenerationPolling(120_000);
    }, [generating, awaitingPlayback]),
  );
  const isSong = mode === "song";
  const activeFormGenre = isSong ? genre : beatGenre;
  const setActiveFormGenre = isSong ? setGenre : setBeatGenre;
  const ideaText = isSong ? songDescription.trim() : beatPrompt.trim();
  const promptLocale = useMemo(
    () =>
      resolveMobilePromptLocale({
        uiLocale: locale,
        mode: isSong ? "song" : "beat",
        vocalLanguageMode,
        manualVocalLanguage,
      }),
    [locale, isSong, vocalLanguageMode, manualVocalLanguage],
  );
  const songRotatingPlaceholder = useRotatingPlaceholder({
    uiLocale: locale,
    mode: "song",
    paused: songFieldFocused || songDescription.trim().length > 0,
    vocalLanguageMode,
    manualVocalLanguage,
  });
  const beatRotatingPlaceholder = useRotatingPlaceholder({
    uiLocale: locale,
    mode: "beat",
    paused: beatFieldFocused || beatPrompt.trim().length > 0,
  });

  const chipsGenre = useMemo(() => {
    if (isCatalogGenreSelection(activeFormGenre)) return activeFormGenre;
    if (lastRandomGenre) return lastRandomGenre;
    return "Melodic Trap";
  }, [activeFormGenre, lastRandomGenre]);

  const genreHint = useMemo(
    () => genreSelectionHint(activeFormGenre, locale, ideaText.length > 0, lastRandomGenre),
    [activeFormGenre, locale, ideaText, lastRandomGenre],
  );

  const inspirationChips = useMemo(() => getInspirationChipsForGenre(chipsGenre), [chipsGenre]);

  const showDiceTipOnce = useCallback(async () => {
    try {
      const seen = await AsyncStorage.getItem("pk.diceHintShown");
      if (seen === "1") return;
      await AsyncStorage.setItem("pk.diceHintShown", "1");
    } catch {
      /* ignore */
    }
    setDiceTipVisible(true);
    setTimeout(() => setDiceTipVisible(false), 4500);
  }, []);

  useEffect(() => {
    if (!prefsHydrated || onboardingPrefsAppliedRef.current) return;
    if (!onboardingCreationMode && !onboardingGenre) return;
    onboardingPrefsAppliedRef.current = true;
    if (onboardingCreationMode) setMode(onboardingCreationMode);
    if (onboardingGenre) {
      if (onboardingCreationMode === "beat") setBeatGenre(onboardingGenre);
      else setGenre(onboardingGenre);
    }
  }, [prefsHydrated, onboardingCreationMode, onboardingGenre]);

  useEffect(() => {
    if (ideaText) {
      if (isFromIdeaGenreSelection(activeFormGenre) || isRandomGenreSelection(activeFormGenre)) {
        if (activeFormGenre !== FROM_IDEA_GENRE_VALUE) setActiveFormGenre(FROM_IDEA_GENRE_VALUE);
      }
      return;
    }
    if (activeFormGenre === FROM_IDEA_GENRE_VALUE) {
      setActiveFormGenre(RANDOM_GENRE_VALUE);
    }
  }, [ideaText, activeFormGenre, setActiveFormGenre]);

  useEffect(() => {
    if (!coach.ready) return;
    if (ideaText.length > 2 && coach.isVisible("create_prompt")) {
      void coach.dismiss("create_prompt");
    }
  }, [coach, ideaText]);

  useEffect(() => {
    if (generating && coach.isVisible("create_generate")) {
      void coach.dismiss("create_generate");
    }
  }, [coach, generating]);

  const activeCoachId = !coach.ready
    ? null
    : coach.isVisible("create_prompt")
      ? "create_prompt"
      : coach.isVisible("create_genre")
        ? "create_genre"
        : coach.isVisible("create_generate")
          ? "create_generate"
          : null;

  const coachCopy =
    activeCoachId === "create_prompt"
      ? { title: t("coachPromptTitle"), body: t("coachPromptBody") }
      : activeCoachId === "create_genre"
        ? { title: t("coachGenreTitle"), body: t("coachGenreBody") }
        : activeCoachId === "create_generate"
          ? { title: t("coachGenerateTitle"), body: t("coachGenerateBody") }
          : null;

  const handleFormGenreChange = (next: string) => {
    setActiveFormGenre(next);
    if (coach.isVisible("create_genre")) void coach.dismiss("create_genre");
  };

  const songReady =
    songDescription.trim().length > 0 ||
    (lyricsMode === "manual" && lyrics.trim().length > 0) ||
    isCatalogGenreSelection(genre) ||
    isRandomGenreSelection(genre) ||
    isFromIdeaGenreSelection(genre);

  const progress = useGenerationProgress({
    active: generating || awaitingPlayback,
    sessionId: progressSession,
    mode: isSong ? "song" : "beat",
    jobStatus,
    done,
    lyricsText: isSong
      ? lyricsMode === "manual"
        ? lyrics.trim() || undefined
        : songDescription.trim() || undefined
      : undefined,
    manualLyrics: isSong && lyricsMode === "manual",
  });
  const progressLabel = jobStatus
    ? jobStatusLabelI18n(locale, jobStatus, isSong)
    : isSong
      ? t("composingSong")
      : t("generatingBeat");

  const onModeChange = (next: StudioMode) => {
    if (generating || awaitingPlayback || generateInFlightRef.current) return;
    setMode(next);
    setError(null);
    setDone(false);
    setAwaitingPlayback(false);
    setGenerating(false);
  };

  const advancedSummary = useMemo(() => {
    if (isSong) {
      const style = MOBILE_VOCAL_STYLES.find((s) => s.value === vocalStyle)?.label ?? vocalStyle;
      return ideaText.trim() ? `${style} · ${t("contextChips")}` : style;
    }
    const bpmNum = Math.max(60, Math.min(200, Number(bpm) || DEFAULT_GENERATOR.bpm));
    return [`${bpmNum} BPM`, beatMood, loopLength.replace(" bars", ""), `${beatKey} ${beatScale}`].join(" · ");
  }, [isSong, ideaText, vocalStyle, bpm, beatMood, loopLength, beatKey, beatScale, t]);

  const heroEntrance = useStaggerEntrance(0, { screenKey: "create" });
  const modeEntrance = useStaggerEntrance(80, { screenKey: "create" });
  const cardEntrance = useStaggerEntrance(140, { screenKey: "create" });

  useEffect(() => {
    if (!awaitingPlayback) return;

    if (playbackError) {
      setError(playbackError);
      setAwaitingPlayback(false);
      setGenerating(false);
      setDone(false);
      setPlaybackError(null);
      return;
    }

    const finish = () => {
      setAwaitingPlayback(false);
      setGenerating(false);
      pendingPlaybackLoopIdRef.current = null;
      setTimeout(() => setDone(false), 500);
    };

    const maxWait = setTimeout(finish, 8_000);

    const audioReady = !isLoading && (isPlaying || durationMs > 0);

    if (audioReady) {
      const openPlayer = setTimeout(() => {
        setExpanded(true);
        finish();
      }, 200);
      return () => {
        clearTimeout(maxWait);
        clearTimeout(openPlayer);
      };
    }

    const softOpen = setTimeout(() => {
      if (!isLoading && pendingPlaybackLoopIdRef.current) {
        setExpanded(true);
        finish();
      }
    }, 3_500);

    return () => {
      clearTimeout(maxWait);
      clearTimeout(softOpen);
    };
  }, [awaitingPlayback, isLoading, isPlaying, durationMs, playbackError, setExpanded, setPlaybackError]);

  const generate = async () => {
    if (isSong && !songReady) {
      setError(t("songIdeaRequired"));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (usage.remaining <= 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push(paywallHref("studio"));
      return;
    }

    if (generateInFlightRef.current) return;

    generateInFlightRef.current = true;
    setProgressSession((s) => s + 1);
    boostGenerationPolling(120_000);
    setGenerating(true);
    setAwaitingPlayback(false);
    setDone(false);
    setError(null);
    setPlaybackError(null);
    setJobStatus("pending");

    try {
      const jobOpts = {
        onJobStatus: (status: GenerationJobStatus) => setJobStatus(status),
      };
      const runFormGenre = isSong ? genre : beatGenre;
      const runIdeaText = isSong ? songDescription.trim() : beatPrompt.trim();
      const randomGenre = shouldPickRandomGenreAtGenerate(runFormGenre, runIdeaText)
        ? pickRandomGenreValue()
        : undefined;
      if (randomGenre) setLastRandomGenre(randomGenre);
      const { promptGenre } = resolveGenreForGeneration(runFormGenre, runIdeaText, randomGenre);

      const songCaptionCtx = resolveGenerationCaptionContext({
        diceAceOverride: songAceOverrideRef.current,
        displayIdea: runIdeaText,
        formGenre: promptGenre || runFormGenre,
        mode: "song",
        uiLocale: promptLocale,
        skipPromptBankPipeline: songBankDiceRef.current,
      });
      const activeGenreResolved = songCaptionCtx.bankGenre ?? promptGenre;
      const beatNameGenre = activeGenreResolved || randomGenre || chipsGenre;
      const bankLyrics =
        songCaptionCtx.lyricsStructure?.trim() || songLyricsOverrideRef.current?.trim() || "";
      const runLyricsMode = bankLyrics ? ("manual" as const) : lyricsMode;
      const runLyrics = bankLyrics || (lyricsMode === "manual" ? lyrics : "");
      const prelimLyrics = runLyrics;
      const prelimLyricsMode: "ai" | "manual" = runLyricsMode;
      const runVocalLanguage = resolveSongVocalLanguage({
        mode: vocalLanguageMode,
        manualCode: manualVocalLanguage,
        lyricsMode: prelimLyricsMode,
        lyrics: prelimLyrics,
        songDescription: runIdeaText,
        uiLocale: locale,
      });

      const beatCaptionCtx = resolveGenerationCaptionContext({
        diceAceOverride: beatAceOverrideRef.current,
        displayIdea: runIdeaText,
        formGenre: runFormGenre,
        mode: "beat",
        uiLocale: promptLocale,
      });

      const loop = isSong
        ? await generateSong(
            {
              genre: activeGenreResolved,
              description: runIdeaText,
              lyrics: runLyrics,
              lyricsMode: runLyricsMode,
              vocalStyle,
              captionOverride: songCaptionCtx.captionOverride?.trim()
                ? songCaptionCtx.captionOverride
                : undefined,
              melodyComposition: songCaptionCtx.melodyComposition,
              vocalLanguageMode,
              manualVocalLanguage,
              uiLocale: locale,
            },
            jobOpts,
          )
        : await (async () => {
            const bpmNum = Math.max(60, Math.min(200, Number(bpm) || DEFAULT_GENERATOR.bpm));
            return generateTypeBeat(
              {
                genre: activeGenreResolved,
                bpm: bpmNum,
                prompt: runIdeaText,
                mood: beatMood,
                loopLength,
              },
              {
                name: defaultBeatName(beatNameGenre, bpmNum),
                mood: beatMood,
                influence: DEFAULT_GENERATOR.influence,
                key: beatKey,
                scale: beatScale,
                loopLength,
              },
              { ...jobOpts, captionOverride: beatCaptionCtx.captionOverride, melodyComposition: beatCaptionCtx.melodyComposition },
            );
          })();

      setJobStatus("completed");
      setDone(true);
      setGenerating(false);
      songBankDiceRef.current = false;

      pendingPlaybackLoopIdRef.current = loop.id;
      setCurrent(loop, [loop]);
      setAwaitingPlayback(true);

      const userId = session?.user?.id;
      if (userId) {
        const loopId = loop.id;
        void resolveGenerationPlaybackQueue(userId, loop).then((playback) => {
          const state = usePlayerStore.getState();
          if (state.current?.id === loopId) {
            setCurrent(playback.start, playback.queue);
          }
        });
      }

      void refreshProfileAfterGeneration();
      const stepsBefore = await loadActivationSteps();
      const isFirstBeat = !stepsBefore.has("first_beat");
      void markActivationStep("first_beat");
      if (isFirstBeat && !isPaidPlan(profile?.plan)) {
        const showFirstBeat = await consumeFirstBeatPaywallPrompt();
        if (showFirstBeat) {
          setSoftUpgradeKind("first_beat");
          setSoftUpgradePlan("studio");
          setSoftUpgradeVisible(true);
        }
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const err = e as Error & { limitReached?: boolean };
      setJobStatus("failed");
      setAwaitingPlayback(false);
      setGenerating(false);
      if (err.limitReached) router.push(paywallHref("studio"));
      setError(formatGenerationError(err.message ?? "Generation failed", locale));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      generateInFlightRef.current = false;
    }
  };

  const showProgress = generating || done || awaitingPlayback;
  const progressFinishing = done && awaitingPlayback;

  const scrollToGenerationProgress = useCallback(() => {
    Keyboard.dismiss();
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    });
  }, []);

  useEffect(() => {
    if (!generating || lastScrollSessionRef.current === progressSession) return;
    lastScrollSessionRef.current = progressSession;
    scrollToGenerationProgress();
    const t1 = setTimeout(scrollToGenerationProgress, 180);
    const t2 = setTimeout(scrollToGenerationProgress, 450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [generating, progressSession, scrollToGenerationProgress]);

  const ctaLabel = generating
    ? isSong
      ? t("composing")
      : t("generating")
    : isSong
      ? t("generateSong")
      : t("generateBeat");

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: "transparent" }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: scrollBottomPadding,
            maxWidth: contentMaxWidth,
            alignSelf: isTablet ? "center" : undefined,
            width: isTablet ? "100%" : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={heroEntrance.style}>
          <StudioHero
            title={t("studio")}
            modeLabel={isSong ? t("song") : t("typeBeat")}
            generating={generating}
          />
        </Animated.View>

        <ActivationChecklist />

        <Animated.View style={modeEntrance.style}>
          <StudioModeToggle value={mode} onChange={onModeChange} disabled={generating || awaitingPlayback} />
        </Animated.View>

        <Animated.View style={cardEntrance.style}>
        <PhCard style={styles.card}>
          {activeCoachId === "create_genre" && coachCopy ? (
            <StudioCoachBubble
              title={coachCopy.title}
              body={coachCopy.body}
              onDismiss={() => void coach.dismiss("create_genre")}
            />
          ) : null}
          <GenrePicker value={activeFormGenre} onChange={handleFormGenreChange} hint={genreHint} />

          {isSong ? (
            <VocalLanguagePicker
              style={styles.songLangPicker}
              value={vocalLanguageMode === "auto" ? "auto" : manualVocalLanguage}
              onChange={(v) => {
                if (v === "auto") void setVocalLanguage("auto");
                else void setVocalLanguage("manual", v);
              }}
            />
          ) : null}

          {isSong ? (
            <View style={styles.fieldGap}>
              {activeCoachId === "create_prompt" && coachCopy ? (
                <StudioCoachBubble
                  title={coachCopy.title}
                  body={coachCopy.body}
                  onDismiss={() => void coach.dismiss("create_prompt")}
                />
              ) : null}
              <PromptConsole
                label={t("songIdea")}
                hint={t("songIdeaHint")}
                required
                focused={songFieldFocused}
                onFocus={() => setSongFieldFocused(true)}
                onBlur={() => setSongFieldFocused(false)}
                toolbar={
                  <PromptDiceButton
                    locale={promptLocale}
                    mode="song"
                    accessibilityLabel={t("diceAria")}
                    onPick={(display) => {
                      setSongDescription(display);
                      if (error) setError(null);
                    }}
                    onPickAce={(ace) => {
                      songAceOverrideRef.current = ace || null;
                      setSongDiceAcePreview(ace?.trim() || null);
                    }}
                    onDiceRolled={() => void showDiceTipOnce()}
                    onPickLyrics={(structure) => {
                      songLyricsOverrideRef.current = structure || null;
                    }}
                    onPickGenre={setActiveFormGenre}
                    onPickFromBank={(fromBank) => {
                      songBankDiceRef.current = fromBank;
                    }}
                  />
                }
                inputProps={{
                  value: songDescription,
                  onChangeText: (text) => {
                    songAceOverrideRef.current = null;
                    songLyricsOverrideRef.current = null;
                    songBankDiceRef.current = false;
                    setSongDiceAcePreview(null);
                    setSongDescription(text);
                    if (error) setError(null);
                  },
                  placeholder: songRotatingPlaceholder || t("songPlaceholder"),
                }}
              />
              {(songFieldFocused || songDescription.trim().length > 0) ? (
                <Text style={[typography.micro, { color: colors.textSubtle, lineHeight: 16 }]}>
                  {t("ideaPromptHint")}
                </Text>
              ) : null}
              {diceTipVisible ? (
                <Text style={[typography.micro, { color: colors.accentPrimary, lineHeight: 16 }]}>
                  {t("ideaPromptDiceHint")}
                </Text>
              ) : null}
              <MobileAceCaptionPreview
                locale={locale}
                displayIdea={songDescription}
                formGenre={activeFormGenre}
                mode="song"
                diceAceOverride={songDiceAcePreview}
              />

              <View style={styles.songLyrics}>
                {lyricsMode === "ai" ? (
                  <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>
                    {t("lyrics")}
                  </Text>
                ) : null}
                <SegmentPills
                  value={lyricsMode}
                  onChange={setLyricsMode}
                  options={[
                    { value: "ai", label: t("lyricsAi") },
                    { value: "manual", label: t("lyricsManual") },
                  ]}
                />
                {lyricsMode === "manual" ? (
                  <PhTextField
                    label={t("lyrics")}
                    value={lyrics}
                    onChangeText={setLyrics}
                    multiline
                    placeholder={t("lyricsPlaceholder")}
                    style={{ minHeight: 88, textAlignVertical: "top", marginTop: spacing.xs }}
                  />
                ) : null}
              </View>
            </View>
          ) : (
            <View style={styles.fieldGap}>
              {activeCoachId === "create_prompt" && coachCopy ? (
                <StudioCoachBubble
                  title={coachCopy.title}
                  body={coachCopy.body}
                  onDismiss={() => void coach.dismiss("create_prompt")}
                />
              ) : null}
              <PromptConsole
                label={t("beatVibe")}
                hint={t("beatVibeHint")}
                focused={beatFieldFocused}
                onFocus={() => setBeatFieldFocused(true)}
                onBlur={() => setBeatFieldFocused(false)}
                toolbar={
                  <PromptDiceButton
                    locale={promptLocale}
                    mode="beat"
                    accessibilityLabel={t("diceAria")}
                    onPick={setBeatPrompt}
                    onPickAce={(ace) => {
                      beatAceOverrideRef.current = ace || null;
                      setBeatDiceAcePreview(ace?.trim() || null);
                    }}
                    onDiceRolled={() => void showDiceTipOnce()}
                    onPickGenre={setActiveFormGenre}
                  />
                }
                inputProps={{
                  value: beatPrompt,
                  onChangeText: (text) => {
                    beatAceOverrideRef.current = null;
                    setBeatDiceAcePreview(null);
                    setBeatPrompt(text);
                  },
                  placeholder: beatRotatingPlaceholder || t("beatPromptPlaceholder"),
                }}
              />
              {(beatFieldFocused || beatPrompt.trim().length > 0) ? (
                <Text style={[typography.micro, { color: colors.textSubtle, lineHeight: 16 }]}>
                  {t("ideaPromptHint")}
                </Text>
              ) : null}
              {diceTipVisible ? (
                <Text style={[typography.micro, { color: colors.accentPrimary, lineHeight: 16 }]}>
                  {t("ideaPromptDiceHint")}
                </Text>
              ) : null}
              <MobileAceCaptionPreview
                locale={locale}
                displayIdea={beatPrompt}
                formGenre={activeFormGenre}
                mode="beat"
                diceAceOverride={beatDiceAcePreview}
              />
            </View>
          )}

          <StudioAdvancedSection
            open={studioAdvancedOpen}
            onToggle={() => void setStudioAdvancedOpen(!studioAdvancedOpen)}
            summary={advancedSummary}
          >
            {isSong ? (
              <>
                <View>
                  <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
                    {t("vocalStyle")}
                  </Text>
                  <SegmentPills
                    value={vocalStyle}
                    onChange={(v) => setVocalStyle(v as MobileVocalStyle)}
                    options={MOBILE_VOCAL_STYLES.map((s) => ({ value: s.value, label: s.label }))}
                  />
                </View>
                <InspirationChipRow
                  chips={inspirationChips}
                  value={songDescription}
                  onChange={(next) => {
                    songAceOverrideRef.current = null;
                    songBankDiceRef.current = false;
                    setSongDescription(next);
                    if (error) setError(null);
                  }}
                  title={t("contextChips")}
                />
              </>
            ) : (
              <>
                <PhTextField
                  label={t("bpm")}
                  value={bpm}
                  onChangeText={setBpm}
                  keyboardType="number-pad"
                />

                <View>
                  <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>{t("mood")}</Text>
                  <SegmentPills
                    value={beatMood}
                    onChange={setBeatMood}
                    options={MOBILE_BEAT_MOODS.map((m) => ({ value: m, label: m }))}
                  />
                </View>

                <View>
                  <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>{t("length")}</Text>
                  <SegmentPills
                    value={loopLength}
                    onChange={(v) => setLoopLength(v as LoopLength)}
                    options={MOBILE_LOOP_LENGTHS.map((l) => ({ value: l, label: l.replace(" bars", "") }))}
                  />
                </View>

                <View>
                  <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>{t("musicalKey")}</Text>
                  <GenreChips
                    genres={MOBILE_MUSICAL_KEYS.map((k) => ({ group: "Key", value: k, label: k }))}
                    value={beatKey}
                    onChange={setBeatKey}
                  />
                </View>

                <View>
                  <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>{t("scale")}</Text>
                  <SegmentPills
                    value={beatScale}
                    onChange={setBeatScale}
                    options={MOBILE_SCALES.map((s) => ({ value: s, label: s }))}
                  />
                </View>

                <InspirationChipRow
                  chips={inspirationChips}
                  value={beatPrompt}
                  onChange={(next) => {
                    beatAceOverrideRef.current = null;
                    setBeatPrompt(next);
                  }}
                  title={t("contextChips")}
                />
              </>
            )}
          </StudioAdvancedSection>

          <View collapsable={false} style={styles.progressSlot}>
            {showProgress ? (
              <GenerationProgress
                progress={progress}
                label={progressFinishing ? t("genPlayback") : progressLabel}
                done={done && !awaitingPlayback}
                finishing={progressFinishing}
                status={jobStatus ?? undefined}
                showVocalHint={isSong}
                screenFocused={screenFocused}
              />
            ) : null}
          </View>

          {error ? <GlassErrorBanner message={error} /> : null}

          {activeCoachId === "create_generate" && coachCopy ? (
            <StudioCoachBubble
              title={coachCopy.title}
              body={coachCopy.body}
              onDismiss={() => void coach.dismiss("create_generate")}
            />
          ) : null}
          <PhButton
            label={ctaLabel}
            onPress={() => void generate()}
            disabled={generating || (isSong && !songReady)}
            loading={generating}
            style={{ marginTop: spacing.md }}
          />
          <GenerationQuotaBadge
            line={tf("quotaMonth", { used: usage.used, limit: usage.limit, plan: profile?.plan ?? "free" })}
            remaining={usage.remaining}
          />
        </PhCard>
        </Animated.View>
      </ScrollView>
      <SoftUpgradeSheet
        visible={softUpgradeVisible}
        kind={softUpgradeKind}
        plan={softUpgradePlan}
        remaining={usage.remaining}
        onClose={() => setSoftUpgradeVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { marginTop: spacing.xs },
  fieldGap: { marginTop: spacing.md },
  songLangPicker: { marginTop: spacing.sm },
  songLyrics: { marginTop: spacing.sm },
  progressSlot: {
    width: "100%",
    alignItems: "center",
    marginTop: spacing.md,
  },
});
