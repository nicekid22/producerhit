import { StyleSheet, Text, View } from "react-native";
import { AIOrb } from "@/components/AIOrb/AIOrb";
import { PhCard } from "@/components/PhCard";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

export function CommunityNoResultsState() {
  const { t } = useI18n();
  const { colors, typography } = useTheme();

  return (
    <PhCard style={styles.card}>
      <View style={styles.orbRow}>
        <AIOrb size={56} state="idle" />
      </View>
      <Text style={[typography.subtitle, { color: colors.text, marginTop: spacing.md, textAlign: "center" }]}>
        {t("communityNoResults")}
      </Text>
      <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm, lineHeight: 22, textAlign: "center" }]}>
        {t("communityNoResultsHint")}
      </Text>
    </PhCard>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.md, alignItems: "stretch" },
  orbRow: { alignItems: "center" },
});
