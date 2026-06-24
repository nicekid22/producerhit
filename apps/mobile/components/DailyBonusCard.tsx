import { memo, useEffect, useState } from "react";
import { InteractionManager, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { PhButton } from "@/components/PhButton";
import { PhCard } from "@/components/PhCard";
import { claimDailyGenerationBonus } from "@/lib/bonusApi";
import { useI18n } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

const CLAIM_DATE_KEY = "producerhit_daily_bonus_date";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export const DailyBonusCard = memo(function DailyBonusCard() {
  const { t } = useI18n();
  const { colors, typography, radius } = useTheme();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [loading, setLoading] = useState(false);
  const [claimedToday, setClaimedToday] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      void AsyncStorage.getItem(CLAIM_DATE_KEY).then((stored) => {
        if (stored === todayKey()) setClaimedToday(true);
      });
    });
    return () => task.cancel();
  }, []);

  const claim = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await claimDailyGenerationBonus();
      if (result.alreadyClaimed || (result.ok && result.creditsGranted === 0)) {
        setClaimedToday(true);
        await AsyncStorage.setItem(CLAIM_DATE_KEY, todayKey());
        setMessage(t("dailyBonusDone"));
      } else if (result.ok && result.creditsGranted > 0) {
        setClaimedToday(true);
        await AsyncStorage.setItem(CLAIM_DATE_KEY, todayKey());
        setMessage(t("dailyBonusSuccess"));
        await refreshProfile();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PhCard variant={claimedToday ? "default" : "active"}>
      <View style={styles.row}>
        <View style={[styles.iconRing, { borderRadius: radius.md, backgroundColor: colors.pillActiveBg }]}>
          <View style={[styles.iconGradient, { borderRadius: radius.md, backgroundColor: colors.accentSolid }]}>
            <Ionicons name={claimedToday ? "checkmark" : "gift"} size={20} color={colors.text} />
          </View>
        </View>
        <View style={styles.copy}>
          <Text style={[typography.subtitle, { color: colors.text }]}>{t("dailyBonusTitle")}</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
            {claimedToday ? t("dailyBonusDone") : message ?? t("dailyBonusBody")}
          </Text>
        </View>
      </View>
      {!claimedToday ? (
        <PhButton label={t("dailyBonusClaim")} onPress={() => void claim()} loading={loading} />
      ) : null}
    </PhCard>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  iconRing: { padding: 1 },
  iconGradient: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1 },
});
