import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { PhBottomSheet } from "@/components/PhBottomSheet";
import { PhButton } from "@/components/PhButton";
import type { IapPaidPlan } from "@/lib/iapCatalog";
import { paywallHref } from "@/lib/iapCatalog";
import { dismissSoftQuotaPaywall } from "@/lib/paywallFunnel";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

export type SoftUpgradeKind = "low_quota" | "first_beat";

type Props = {
  visible: boolean;
  kind: SoftUpgradeKind;
  plan: IapPaidPlan;
  remaining?: number;
  onClose: () => void;
};

export function SoftUpgradeSheet({ visible, kind, plan, remaining, onClose }: Props) {
  const router = useRouter();
  const { t, tf } = useI18n();
  const { colors, typography } = useTheme();

  const title =
    kind === "first_beat" ? t("paywallSoftFirstBeatTitle") : t("paywallSoftLowQuotaTitle");
  const body =
    kind === "first_beat"
      ? t("paywallSoftFirstBeatBody")
      : tf("paywallSoftLowQuotaBody", { n: remaining ?? 0 });

  const styles = useMemo(() => createStyles(), []);

  const dismiss = () => {
    if (kind === "low_quota") void dismissSoftQuotaPaywall();
    onClose();
  };

  const openPaywall = () => {
    if (kind === "low_quota") void dismissSoftQuotaPaywall();
    onClose();
    router.push(paywallHref(plan));
  };

  return (
    <PhBottomSheet visible={visible} onClose={dismiss} maxHeight="52%" scrollable={false}>
      <View style={styles.wrap}>
        <Text style={[typography.title, { color: colors.text }]}>{title}</Text>
        <Text style={[typography.body, styles.body, { color: colors.textMuted }]}>{body}</Text>
        <PhButton label={t("paywallViewPlans")} onPress={openPaywall} />
        <PhButton label={t("notNow")} variant="ghost" onPress={dismiss} />
      </View>
    </PhBottomSheet>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      padding: spacing.lg,
      gap: spacing.md,
      paddingBottom: spacing.xl,
    },
    body: {
      lineHeight: 22,
    },
  });
}
