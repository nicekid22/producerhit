import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { PhButton } from "@/components/PhButton";
import { PhSurface } from "@/components/PhSurface";
import { claimDailyGenerationBonus } from "@/lib/bonusApi";
import { useI18n } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

export function DailyBonusCard() {
  const { t } = useI18n();
  const { colors, typography } = useTheme();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [loading, setLoading] = useState(false);
  const [claimedToday, setClaimedToday] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const claim = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await claimDailyGenerationBonus();
      if (result.alreadyClaimed || (result.ok && result.creditsGranted === 0)) {
        setClaimedToday(true);
        setMessage(t("dailyBonusDone"));
      } else if (result.ok && result.creditsGranted > 0) {
        setClaimedToday(true);
        setMessage(t("dailyBonusSuccess"));
        await refreshProfile();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PhSurface style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: colors.pillActiveBg }]}>
          <Ionicons name="gift-outline" size={22} color={colors.accent} />
        </View>
        <View style={styles.copy}>
          <Text style={[typography.subtitle, { color: colors.text }]}>{t("dailyBonusTitle")}</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
            {message ?? t("dailyBonusBody")}
          </Text>
        </View>
      </View>
      {!claimedToday ? (
        <PhButton label={t("dailyBonusClaim")} onPress={() => void claim()} loading={loading} />
      ) : null}
    </PhSurface>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1 },
});
