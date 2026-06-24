import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PhCard } from "@/components/PhCard";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  visible: boolean;
};

export const OfflineDataBanner = memo(function OfflineDataBanner({ visible }: Props) {
  const { t } = useI18n();
  const { colors, typography } = useTheme();

  if (!visible) return null;

  return (
    <PhCard elevated={false} style={styles.wrap}>
      <View style={[styles.strip, { borderLeftColor: colors.accentPrimary }]}>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={18} color={colors.accentPrimary} />
          <Text style={[typography.micro, { color: colors.textMuted, flex: 1, lineHeight: 16 }]}>
            {t("offlineDataHint")}
          </Text>
        </View>
      </View>
    </PhCard>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm, padding: 0 },
  strip: { borderLeftWidth: 3, paddingLeft: spacing.md, paddingVertical: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
