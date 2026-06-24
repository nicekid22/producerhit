import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { StudioMode } from "@/components/StudioModeToggle";
import { OnboardingProgressBar } from "@/components/OnboardingProgressBar";
import { OnboardingSlideVisual, type OnboardingSlideId } from "@/components/OnboardingSlideVisual";
import { ThemeBackdrop } from "@/components/ThemeBackdrop";
import { useTheme } from "@/theme/ThemeProvider";
import { PhButton } from "@/components/PhButton";
import { PhDisplay } from "@/components/PhDisplay";
import { onboardingSlides } from "@/lib/i18n/catalog";
import { completeActivationStep } from "@/lib/onboardingProgress";
import { useAuthStore } from "@/stores/authStore";
import { useGenerationPrefsStore } from "@/stores/generationPrefsStore";
import { useI18n } from "@/stores/localeStore";
import { spacing } from "@/theme/tokens";

const ONBOARDING_KEY = "producerhit_mobile_onboarding_v1";
const DEFAULT_PERSONALIZE_GENRE = "Melodic Trap";

type SlideItem = {
  id: OnboardingSlideId;
  title: string;
  body: string;
};

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [personalizeMode, setPersonalizeMode] = useState<StudioMode>("song");
  const [personalizeGenre, setPersonalizeGenre] = useState(DEFAULT_PERSONALIZE_GENRE);
  const pagerRef = useRef<FlatList<SlideItem>>(null);
  const { width: pageWidth } = useWindowDimensions();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale, t, tf } = useI18n();
  const setOnboardingDone = useAuthStore((s) => s.setOnboardingDone);
  const setOnboardingPrefs = useGenerationPrefsStore((s) => s.setOnboardingPrefs);
  const slides = onboardingSlides(locale);
  const { colors, typography } = useTheme();
  const isLast = step >= slides.length - 1;

  const scrollTo = useCallback(
    (index: number) => {
      pagerRef.current?.scrollToIndex({ index, animated: true });
      setStep(index);
    },
    [],
  );

  const finish = async () => {
    await setOnboardingPrefs({
      creationMode: personalizeMode,
      genre: personalizeGenre,
    });
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    await completeActivationStep("tour_done");
    setOnboardingDone(true);
    router.replace("/(auth)/login");
  };

  const next = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) void finish();
    else scrollTo(step + 1);
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (index !== step && index >= 0 && index < slides.length) {
      setStep(index);
    }
  };

  const renderSlide = ({ item, index }: { item: SlideItem; index: number }) => (
    <View style={[styles.page, { width: pageWidth }]}>
      <OnboardingSlideVisual
        slideId={item.id}
        personalizeMode={personalizeMode}
        personalizeGenre={personalizeGenre}
        onPersonalizeMode={setPersonalizeMode}
        onPersonalizeGenre={setPersonalizeGenre}
        previewActive={step === 0}
      />
      <View style={styles.copy}>
        <PhDisplay variant="display">{item.title}</PhDisplay>
        <Text style={[typography.body, styles.body, { color: colors.textMuted }]}>{item.body}</Text>
      </View>
      {index === step ? (
        <Text style={[typography.micro, { color: colors.textSubtle, marginTop: spacing.sm }]}>
          {tf("onbStepCounter", { current: index + 1, total: slides.length })}
        </Text>
      ) : null}
    </View>
  );

  return (
    <ThemeBackdrop>
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.header}>
          <OnboardingProgressBar total={slides.length} active={step} />
          <Pressable
            onPress={() => void finish()}
            hitSlop={12}
            style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={[typography.caption, { color: colors.textMuted, fontWeight: "600" }]}>{t("skip")}</Text>
          </Pressable>
        </View>

        <FlatList
          ref={pagerRef}
          data={slides}
          keyExtractor={(item) => item.id}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
          style={styles.pager}
          extraData={{ step, personalizeMode, personalizeGenre }}
        />

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <PhButton
            label={isLast ? t("onbFinish") : t("continue")}
            onPress={next}
          />
        </View>
      </View>
    </ThemeBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: spacing.screen,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  skipBtn: { alignSelf: "flex-end" },
  pager: { flex: 1 },
  page: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  copy: { gap: spacing.sm },
  body: { lineHeight: 24 },
  footer: { paddingHorizontal: spacing.screen, paddingTop: spacing.md },
});
