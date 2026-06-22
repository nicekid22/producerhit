import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BrandLogo } from "@/components/BrandLogo";
import { WaveformStrip } from "@/components/WaveformStrip";
import { ThemeBackdrop } from "@/components/ThemeBackdrop";
import { useTheme } from "@/theme/ThemeProvider";
import { PhButton } from "@/components/PhButton";
import { PhDisplay } from "@/components/PhDisplay";
import { onboardingSlides } from "@/lib/i18n/catalog";
import { completeActivationStep } from "@/lib/onboardingProgress";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/stores/localeStore";
import { spacing } from "@/theme/tokens";

const ONBOARDING_KEY = "producerhit_mobile_onboarding_v1";

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { locale, t } = useI18n();
  const setOnboardingDone = useAuthStore((s) => s.setOnboardingDone);
  const slides = onboardingSlides(locale);
  const slide = slides[step];
  const { colors, typography } = useTheme();

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    await completeActivationStep("tour_done");
    setOnboardingDone(true);
    router.replace("/(auth)/login");
  };

  const next = () => {
    if (step >= slides.length - 1) void finish();
    else setStep((s) => s + 1);
  };

  return (
    <ThemeBackdrop>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandLogo />
        <View style={styles.visual}>
          <WaveformStrip height={48} bars={28} opacity={0.65} />
        </View>
        <PhDisplay variant="display">{slide.title}</PhDisplay>
        <Text style={[typography.body, { color: colors.textMuted, lineHeight: 24 }]}>{slide.body}</Text>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: colors.surfaceBorder },
                i === step && [styles.dotActive, { backgroundColor: colors.accent }],
              ]}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PhButton
          label={step === slides.length - 1 ? t("getStarted") : t("continue")}
          onPress={next}
        />
        {step < slides.length - 1 ? (
          <PhButton label={t("skip")} variant="ghost" onPress={() => void finish()} haptic={false} />
        ) : null}
      </View>
    </ThemeBackdrop>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: 100,
    gap: spacing.md,
  },
  visual: { marginVertical: spacing.lg },
  dots: { flexDirection: "row", gap: 8, marginTop: spacing.xxl },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 28 },
  footer: { padding: spacing.screen, gap: spacing.md, paddingBottom: 48 },
});
