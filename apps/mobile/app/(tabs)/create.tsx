import { useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  DEFAULT_GENERATOR,
  DEFAULT_SONG,
  MOBILE_BEAT_MOODS,
  MOBILE_GENRES,
  MOBILE_LOOP_LENGTHS,
  MOBILE_MUSICAL_KEYS,
  MOBILE_SCALES,
  MOBILE_SONG_GENRES,
  MOBILE_VOCAL_STYLES,
  VOCAL_LANGUAGES,
  getInspirationChipsForGenre,
  type GenerationJobStatus,
  type LoopLength,
  type MobileVocalStyle,
} from "@producerhit/shared";
import { ActivationChecklist, markActivationStep } from "@/components/ActivationChecklist";
import { ThemeBackdrop } from "@/components/ThemeBackdrop";
import { PhDisplay } from "@/components/PhDisplay";
import { WaveformStrip } from "@/components/WaveformStrip";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";
import { InspirationChipRow } from "@/components/InspirationChipRow";
import { PromptDiceButton } from "@/components/PromptDiceButton";
import { useRotatingPlaceholder } from "@/lib/useRotatingPlaceholder";
import { PhButton } from "@/components/PhButton";
import { PhCard } from "@/components/PhCard";
import { DailyBonusCard } from "@/components/DailyBonusCard";
import { GenerationProgress } from "@/components/GenerationProgress";
import { GenreChips } from "@/components/GenreChips";
import { PhPill } from "@/components/PhPill";
import { SegmentPills } from "@/components/SegmentPills";
import { StudioModeToggle, type StudioMode } from "@/components/StudioModeToggle";
import { jobStatusLabelI18n } from "@/lib/i18n/catalog";
import { useGenerationProgress } from "@/lib/useGenerationProgress";
import { defaultBeatName, defaultSongName, generateSong, generateTypeBeat, usageSummary } from "@/lib/loopsApi";
import { formatGenerationError } from "@/lib/generationErrors";
import { useGenerationPrefsStore } from "@/stores/generationPrefsStore";
import { resolveMobilePromptLocale } from "@/lib/resolvePromptLocale";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/stores/localeStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useTheme } from "@/theme/ThemeProvider";
import { radius, spacing } from "@/theme/tokens";

export default function CreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const setCurrent = usePlayerStore((s) => s.setCurrent);
  const { t, tf, locale } = useI18n();
  const vocalLanguageMode = useGenerationPrefsStore((s) => s.vocalLanguageMode);
  const manualVocalLanguage = useGenerationPrefsStore((s) => s.manualVocalLanguage);
  const setVocalLanguage = useGenerationPrefsStore((s) => s.setVocalLanguage);
  const { colors, typography, radius: themeRadius } = useTheme();
  const { contentMaxWidth, isTablet } = useResponsiveLayout();

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
  const [jobStatus, setJobStatus] = useState<GenerationJobStatus | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [songFieldFocused, setSongFieldFocused] = useState(false);
  const [beatFieldFocused, setBeatFieldFocused] = useState(false);

  const songAceOverrideRef = useRef<string | null>(null);
  const beatAceOverrideRef = useRef<string | null>(null);

  const usage = useMemo(() => usageSummary(profile), [profile]);
  const isSong = mode === "song";
  const genres = isSong ? MOBILE_SONG_GENRES : MOBILE_GENRES;
  const activeGenre = isSong ? genre : beatGenre;
  const setActiveGenre = isSong ? setGenre : setBeatGenre;
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
  const vocalLangOptions = useMemo(() => {
    const isFr = locale === "fr";
    return [
      { value: "auto", label: t("genLangAuto") },
      ...VOCAL_LANGUAGES.map((l) => ({
        value: l.value,
        label: isFr ? l.fr : l.en,
      })),
    ];
  }, [locale, t]);
  const inspirationChips = useMemo(() => getInspirationChipsForGenre(activeGenre), [activeGenre]);
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

  const progress = useGenerationProgress({
    active: generating,
    mode: isSong ? "song" : "beat",
    jobStatus,
    done,
    lyricsText: isSong ? (lyricsMode === "manual" ? lyrics : songDescription) : undefined,
    manualLyrics: isSong && lyricsMode === "manual",
  });
  const progressLabel = jobStatus
    ? jobStatusLabelI18n(locale, jobStatus, isSong)
    : isSong
      ? t("composingSong")
      : t("generatingBeat");

  const onModeChange = (next: StudioMode) => {
    setMode(next);
    setError(null);
    setDone(false);
  };

  const modeSubtitle = isSong ? t("songModeSub") : t("beatModeSub");

  const songReady =
    songDescription.trim().length > 0 || (lyricsMode === "manual" && lyrics.trim().length > 0);

  const generate = async () => {
    if (isSong && !songReady) {
      setError(t("songIdeaRequired"));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (usage.remaining <= 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push("/paywall");
      return;
    }

    setGenerating(true);
    setDone(false);
    setError(null);
    setJobStatus("pending");

    try {
      const jobOpts = { onJobStatus: (status: GenerationJobStatus) => setJobStatus(status) };
      const songCaptionOverride = songAceOverrideRef.current?.trim() || undefined;
      const beatCaptionOverride = beatAceOverrideRef.current?.trim() || undefined;

      const loop = isSong
        ? await generateSong(
            {
              genre: activeGenre,
              description: songDescription,
              lyrics,
              lyricsMode,
              vocalStyle,
              captionOverride: songCaptionOverride,
              vocalLanguageMode,
              manualVocalLanguage,
            },
            jobOpts,
          )
        : await (async () => {
            const bpmNum = Math.max(60, Math.min(200, Number(bpm) || DEFAULT_GENERATOR.bpm));
            return generateTypeBeat(
              {
                genre: activeGenre,
                bpm: bpmNum,
                prompt: beatPrompt,
                mood: beatMood,
                loopLength,
              },
              {
                name: defaultBeatName(activeGenre, bpmNum),
                mood: beatMood,
                influence: DEFAULT_GENERATOR.influence,
                key: beatKey,
                scale: beatScale,
                loopLength,
              },
              { ...jobOpts, captionOverride: beatCaptionOverride },
            );
          })();

      setJobStatus("completed");
      setDone(true);
      setCurrent(loop);
      await refreshProfile();
      void markActivationStep("first_beat");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const err = e as Error & { limitReached?: boolean };
      setJobStatus("failed");
      if (err.limitReached) router.push("/paywall");
      setError(formatGenerationError(err.message ?? "Generation failed", locale));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGenerating(false);
    }
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: themeRadius.md,
    padding: 14,
    color: colors.text,
    backgroundColor: colors.bgElevated,
    ...typography.body,
  };

  const ctaLabel = generating
    ? isSong
      ? t("composing")
      : t("generating")
    : isSong
      ? t("generateSong")
      : t("generateBeat");

  return (
    <ThemeBackdrop>
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: "transparent" }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            maxWidth: contentMaxWidth,
            alignSelf: isTablet ? "center" : undefined,
            width: isTablet ? "100%" : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerBlock}>
          <PhDisplay variant="display">{t("studio")}</PhDisplay>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 6 }]}>
            {tf("quotaMonth", { used: usage.used, limit: usage.limit, plan: profile?.plan ?? "free" })}
          </Text>
          <View style={styles.waveform}>
            <WaveformStrip height={36} bars={32} opacity={0.55} />
          </View>
        </View>

        <DailyBonusCard />
        <ActivationChecklist />

        <StudioModeToggle value={mode} onChange={onModeChange} />
        <Text style={[typography.caption, { color: colors.textSubtle, lineHeight: 18, marginTop: -spacing.sm }]}>
          {modeSubtitle}
        </Text>

        <PhCard style={styles.card}>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>{t("genre")}</Text>
          <GenreChips genres={genres} value={activeGenre} onChange={setActiveGenre} />

          {isSong ? (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }, styles.fieldGap]}>
                {t("language")}
              </Text>
              <Text style={[typography.micro, { color: colors.textSubtle, marginTop: -4, marginBottom: spacing.sm, lineHeight: 16 }]}>
                {t("languageHint")}
              </Text>
              <PhPill
                value={vocalLanguageMode === "auto" ? "auto" : manualVocalLanguage}
                onChange={(v) => {
                  if (v === "auto") void setVocalLanguage("auto");
                  else void setVocalLanguage("manual", v);
                }}
                options={vocalLangOptions}
              />

              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }, styles.fieldGap]}>
                {t("songIdea")} <Text style={{ color: colors.accent }}>*</Text>
              </Text>
              <Text style={[typography.micro, { color: colors.textSubtle, marginTop: -4, marginBottom: spacing.sm, lineHeight: 16 }]}>
                {t("songIdeaHint")}
              </Text>
              <View style={styles.promptRow}>
                <TextInput
                  value={songDescription}
                  onChangeText={(text) => {
                    songAceOverrideRef.current = null;
                    setSongDescription(text);
                    if (error) setError(null);
                  }}
                  onFocus={() => setSongFieldFocused(true)}
                  onBlur={() => setSongFieldFocused(false)}
                  style={[
                    inputStyle,
                    styles.prompt,
                    styles.promptFlex,
                    isSong && !songReady && { borderColor: colors.accent },
                  ]}
                  placeholder={songRotatingPlaceholder || t("songPlaceholder")}
                  placeholderTextColor={colors.textSubtle}
                  multiline
                  textAlignVertical="top"
                />
                <PromptDiceButton
                  locale={promptLocale}
                  mode="song"
                  genre={activeGenre}
                  genres={genres}
                  accessibilityLabel={t("diceAria")}
                  onPick={(display) => {
                    setSongDescription(display);
                    if (error) setError(null);
                  }}
                  onPickAce={(ace) => {
                    songAceOverrideRef.current = ace;
                  }}
                  onPickGenre={setActiveGenre}
                />
              </View>
              <InspirationChipRow
                chips={inspirationChips}
                value={songDescription}
                onChange={(next) => {
                  songAceOverrideRef.current = null;
                  setSongDescription(next);
                  if (error) setError(null);
                }}
                title={t("contextChips")}
              />

              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }, styles.fieldGap]}>{t("vocalStyle")}</Text>
              <SegmentPills
                value={vocalStyle}
                onChange={(v) => setVocalStyle(v as MobileVocalStyle)}
                options={MOBILE_VOCAL_STYLES.map((s) => ({ value: s.value, label: s.label }))}
              />

              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }, styles.fieldGap]}>{t("lyrics")}</Text>
              <SegmentPills
                value={lyricsMode}
                onChange={setLyricsMode}
                options={[
                  { value: "ai", label: t("lyricsAi") },
                  { value: "manual", label: t("lyricsManual") },
                ]}
              />
              {lyricsMode === "manual" ? (
                <TextInput
                  value={lyrics}
                  onChangeText={setLyrics}
                  style={[inputStyle, styles.lyrics, { marginTop: spacing.md }]}
                  placeholder={t("lyricsPlaceholder")}
                  placeholderTextColor={colors.textSubtle}
                  multiline
                  textAlignVertical="top"
                />
              ) : (
                <Text style={[typography.caption, { color: colors.textSubtle, marginTop: spacing.md, lineHeight: 18 }]}>
                  {t("lyricsHelper")}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }, styles.fieldGap]}>{t("bpm")}</Text>
              <TextInput
                value={bpm}
                onChangeText={setBpm}
                keyboardType="number-pad"
                style={inputStyle}
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }, styles.fieldGap]}>{t("mood")}</Text>
              <SegmentPills
                value={beatMood}
                onChange={setBeatMood}
                options={MOBILE_BEAT_MOODS.map((m) => ({ value: m, label: m }))}
              />

              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }, styles.fieldGap]}>{t("length")}</Text>
              <SegmentPills
                value={loopLength}
                onChange={(v) => setLoopLength(v as LoopLength)}
                options={MOBILE_LOOP_LENGTHS.map((l) => ({ value: l, label: l.replace(" bars", "") }))}
              />

              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }, styles.fieldGap]}>{t("musicalKey")}</Text>
              <GenreChips
                genres={MOBILE_MUSICAL_KEYS.map((k) => ({ group: "Key", value: k, label: k }))}
                value={beatKey}
                onChange={setBeatKey}
              />

              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }, styles.fieldGap]}>{t("scale")}</Text>
              <SegmentPills
                value={beatScale}
                onChange={setBeatScale}
                options={MOBILE_SCALES.map((s) => ({ value: s, label: s }))}
              />

              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }, styles.fieldGap]}>{t("promptOptional")}</Text>
              <View style={styles.promptRow}>
                <TextInput
                  value={beatPrompt}
                  onChangeText={(text) => {
                    beatAceOverrideRef.current = null;
                    setBeatPrompt(text);
                  }}
                  onFocus={() => setBeatFieldFocused(true)}
                  onBlur={() => setBeatFieldFocused(false)}
                  style={[inputStyle, styles.prompt, styles.promptFlex]}
                  placeholder={beatRotatingPlaceholder || t("beatPromptPlaceholder")}
                  placeholderTextColor={colors.textSubtle}
                  multiline
                  textAlignVertical="top"
                />
                <PromptDiceButton
                  locale={promptLocale}
                  mode="beat"
                  genre={activeGenre}
                  genres={genres}
                  accessibilityLabel={t("diceAria")}
                  onPick={setBeatPrompt}
                  onPickAce={(ace) => {
                    beatAceOverrideRef.current = ace;
                  }}
                  onPickGenre={setActiveGenre}
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

          {generating || done ? (
            <GenerationProgress
              progress={progress}
              label={progressLabel}
              done={done}
              status={jobStatus ?? undefined}
            />
          ) : null}

          {error ? (
            <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.md }]}>{error}</Text>
          ) : null}

          <PhButton
            label={ctaLabel}
            onPress={() => void generate()}
            disabled={generating}
            loading={generating}
            gradient
            style={{ marginTop: spacing.lg }}
          />

          {isSong && !songReady && !generating ? (
            <Text style={[typography.caption, { color: colors.warning, textAlign: "center", marginTop: spacing.sm, lineHeight: 18 }]}>
              {t("songIdeaRequired")}
            </Text>
          ) : null}

          <Text style={[typography.micro, { color: colors.textSubtle, textAlign: "center", marginTop: spacing.md }]}>
            {isSong
              ? tf("previewBeat", { name: defaultSongName(activeGenre) })
              : tf("previewBeat", {
                  name: defaultBeatName(activeGenre, Number(bpm) || DEFAULT_GENERATOR.bpm),
                })}
          </Text>
        </PhCard>
      </ScrollView>
    </KeyboardAvoidingView>
    </ThemeBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 200, gap: spacing.lg },
  headerBlock: { gap: 4 },
  waveform: { marginTop: spacing.md, marginBottom: spacing.xs },
  card: { marginTop: spacing.sm },
  fieldGap: { marginTop: spacing.lg },
  prompt: { minHeight: 96, textAlignVertical: "top" },
  promptRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  promptFlex: { flex: 1 },
  lyrics: { minHeight: 140 },
});
