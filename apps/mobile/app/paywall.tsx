import { useCallback, useEffect, useMemo, useState } from "react";
import { Animated, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/lib/reanimated/usePressScale";
import { AIOrb } from "@/components/AIOrb/AIOrb";
import { GlassErrorBanner } from "@/components/GlassErrorBanner";
import { PaywallTierPicker } from "@/components/PaywallTierPicker";
import { PhButton } from "@/components/PhButton";
import { PhDisplay } from "@/components/PhDisplay";
import { ThemeBackdrop } from "@/components/ThemeBackdrop";
import {
  IAP_PRODUCTS,
  parsePaywallPlanParam,
  type IapPaidPlan,
} from "@/lib/iapCatalog";
import { paywallTierLabel, tf } from "@/lib/i18n/catalog";
import { IapNotAvailableError, SubscriptionService } from "@/lib/subscriptionService";
import { useDismissPaywall } from "@/lib/useDismissPaywall";
import { useSubscription } from "@/lib/useSubscription";
import { useStaggerEntrance } from "@/lib/useStaggerEntrance";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

function mapPurchaseError(message: string, t: (key: import("@/lib/i18n/catalog").I18nKey) => string): string | null {
  if (message === "IAP_USER_CANCELLED") return null;
  if (message === "IAP_NOT_AVAILABLE" || message.includes("IAP_NOT_AVAILABLE")) {
    return t("iapRequiresDevBuild");
  }
  if (message === "IAP_PURCHASE_IN_PROGRESS") return t("iapPurchaseInProgress");
  return message || t("purchaseFailed");
}

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const dismiss = useDismissPaywall();
  const { t, locale } = useI18n();
  const { colors, typography } = useTheme();
  const params = useLocalSearchParams<{ plan?: string }>();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const { packages, iapReady, loading: subLoading, refresh } = useSubscription();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const initialPlan = useMemo(() => parsePaywallPlanParam(params.plan), [params.plan]);
  const [selectedPlan, setSelectedPlan] = useState<IapPaidPlan>(initialPlan);

  useEffect(() => {
    setSelectedPlan(initialPlan);
  }, [initialPlan]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSku = IAP_PRODUCTS[selectedPlan].sku;
  const heroEntrance = useStaggerEntrance(0);
  const planEntrance = useStaggerEntrance(80);
  const ctaEntrance = useStaggerEntrance(160);

  const subscribeLabel = tf(locale, "paywallSubscribePlan", {
    plan: paywallTierLabel(locale, selectedPlan),
  });

  const purchase = async () => {
    setLoading(true);
    setError(null);
    try {
      await SubscriptionService.purchase(selectedSku);
      await refreshProfile({ force: true, silent: true });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      dismiss();
    } catch (e) {
      const raw = e instanceof IapNotAvailableError ? "IAP_NOT_AVAILABLE" : e instanceof Error ? e.message : "";
      const mapped = mapPurchaseError(raw, t);
      if (mapped) setError(mapped);
    } finally {
      setLoading(false);
    }
  };

  const restore = async () => {
    setLoading(true);
    setError(null);
    try {
      await SubscriptionService.restore();
      await refreshProfile({ force: true, silent: true });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      dismiss();
    } catch (e) {
      const raw = e instanceof IapNotAvailableError ? "IAP_NOT_AVAILABLE" : e instanceof Error ? e.message : "";
      const mapped = mapPurchaseError(raw, t) ?? t("restoreFailed");
      setError(mapped);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeBackdrop>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <PressableScale onPress={dismiss} hitSlop={16} style={styles.closeBtn} accessibilityLabel={t("cancel")}>
          <Ionicons name="close" size={26} color={colors.textMuted} />
        </PressableScale>
      </View>

      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={heroEntrance.style}>
          <View style={styles.heroOrb}>
            <AIOrb size={96} state="active" />
          </View>
          <Text style={[typography.caption, styles.kicker, { color: colors.accentPrimary }]}>{t("paywallKicker")}</Text>
          <PhDisplay variant="display">{t("paywallTitle")}</PhDisplay>
          <Text style={[typography.body, { color: colors.textMuted, marginTop: 8, lineHeight: 22 }]}>{t("paywallSub")}</Text>
          <Text style={[typography.micro, { color: colors.textSubtle, marginTop: spacing.sm }]}>{t("paywallSocialProof")}</Text>
        </Animated.View>

        <Animated.View style={planEntrance.style}>
          <PaywallTierPicker selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} packages={packages} />
          {!iapReady && !subLoading ? (
            <Text style={[typography.micro, styles.iapHint, { color: colors.textSubtle }]}>{t("iapRequiresDevBuild")}</Text>
          ) : null}
        </Animated.View>

        <Animated.View style={ctaEntrance.style}>
          {error ? <GlassErrorBanner message={error} /> : null}
          <PhButton label={subscribeLabel} onPress={() => void purchase()} loading={loading} />
          <PhButton label={t("restorePurchases")} variant="ghost" onPress={() => void restore()} disabled={loading} />
          <PhButton label={t("notNow")} variant="ghost" onPress={dismiss} />

          <View style={styles.legalRow}>
            <Pressable onPress={() => void Linking.openURL("https://www.producerhit.com/privacy")}>
              <Text style={[typography.micro, { color: colors.accentPrimary }]}>{t("privacyPolicy")}</Text>
            </Pressable>
            <Text style={[typography.micro, { color: colors.textSubtle }]}>·</Text>
            <Pressable onPress={() => void Linking.openURL("https://www.producerhit.com/terms")}>
              <Text style={[typography.micro, { color: colors.accentPrimary }]}>{t("termsOfService")}</Text>
            </Pressable>
          </View>
          <Text style={[typography.caption, { color: colors.textSubtle, lineHeight: 18 }]}>{t("paywallLegal")}</Text>
        </Animated.View>
      </ScrollView>
    </ThemeBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { paddingHorizontal: spacing.screen, zIndex: 10 },
  closeBtn: { alignSelf: "flex-end", width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.screen, gap: spacing.lg, paddingBottom: 40, paddingTop: 0 },
  heroOrb: { alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  kicker: { fontWeight: "700", letterSpacing: 1.1, textTransform: "uppercase" },
  iapHint: { marginTop: spacing.sm, lineHeight: 16, textAlign: "center" },
  legalRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
});
