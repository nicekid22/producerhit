import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { PhCard } from "@/components/PhCard";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  message?: string | null;
  onRetry: () => void;
};

export const NetworkErrorBanner = memo(function NetworkErrorBanner({ message, onRetry }: Props) {
  const { t } = useI18n();
  const { colors, typography } = useTheme();

  if (!message) return null;

  return (
    <PhCard elevated={false} style={styles.wrap}>
      <View style={[styles.strip, { borderLeftColor: colors.danger }]}>
        <View style={styles.row}>
          <Ionicons name="cloud-offline-outline" size={20} color={colors.danger} />
          <View style={styles.copy}>
            <Text style={[typography.caption, { color: colors.text, fontWeight: "600" }]}>{t("networkErrorTitle")}</Text>
            <Text style={[typography.micro, { color: colors.textMuted, marginTop: 2, lineHeight: 16 }]} numberOfLines={2}>
              {message}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRetry();
            }}
            style={[styles.retry, { backgroundColor: colors.pillActiveBg }]}
          >
            <Text style={[typography.micro, { color: colors.accentPrimary, fontWeight: "700" }]}>{t("retry")}</Text>
          </Pressable>
        </View>
      </View>
    </PhCard>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm, padding: 0 },
  strip: { borderLeftWidth: 3, paddingLeft: spacing.md, paddingVertical: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  copy: { flex: 1, minWidth: 0 },
  retry: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
});
