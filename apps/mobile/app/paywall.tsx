import { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PhButton } from "@/components/PhButton";
import { PhCard } from "@/components/PhCard";
import { PhDisplay } from "@/components/PhDisplay";
import { ThemeBackdrop } from "@/components/ThemeBackdrop";
import { PRO_PRODUCT_ID, SubscriptionService } from "@/lib/subscriptionService";
import { useSubscription } from "@/lib/useSubscription";
import { paywallFeatures } from "@/lib/i18n/catalog";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

export default function PaywallScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { colors, typography, radius } = useTheme();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const { packages, price } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pkg = packages[0];
  const features = paywallFeatures(locale);

  const purchase = async () => {
    setLoading(true);
    setError(null);
    try {
      await SubscriptionService.purchase(PRO_PRODUCT_ID);
      await refreshProfile();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("purchaseFailed"));
    } finally {
      setLoading(false);
    }
  };

  const restore = async () => {
    setLoading(true);
    setError(null);
    try {
      await SubscriptionService.restore();
      await refreshProfile();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("restoreFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeBackdrop>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <PhDisplay variant="display">{t("paywallTitle")}</PhDisplay>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: 8 }]}>{t("paywallSub")}</Text>

        <PhCard style={styles.card}>
          {features.map((line) => (
            <View key={line} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginTop: 2 }} />
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{line}</Text>
            </View>
          ))}
          <View style={[styles.priceBadge, { backgroundColor: colors.pillActiveBg, borderRadius: radius.lg }]}>
            <Text style={[typography.title, { color: colors.text, fontSize: 28, fontVariant: ["tabular-nums"] }]}>
              {pkg?.price ?? price ?? t("appStorePrice")}
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{t("perMonth")}</Text>
          </View>
        </PhCard>

        {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}

        <PhButton label={t("subscribeApple")} onPress={() => void purchase()} loading={loading} />
        <PhButton label={t("restorePurchases")} variant="ghost" onPress={() => void restore()} disabled={loading} />
        <PhButton label={t("notNow")} variant="ghost" onPress={() => router.back()} />
        <PhButton
          label={t("privacyPolicy")}
          variant="ghost"
          onPress={() => void Linking.openURL("https://www.producerhit.com/privacy")}
        />

        <Text style={[typography.caption, { color: colors.textSubtle, lineHeight: 18 }]}>{t("paywallLegal")}</Text>
      </ScrollView>
    </ThemeBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.screen, gap: spacing.lg, paddingBottom: 40, paddingTop: 24 },
  card: { gap: spacing.sm },
  featureRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  priceBadge: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    alignItems: "center",
  },
});
