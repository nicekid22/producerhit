import { StyleSheet, Text, View } from "react-native";
import { PhCard } from "@/components/PhCard";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

export function LibraryNoResultsState() {
  const { t } = useI18n();
  const { colors, typography } = useTheme();

  return (
    <PhCard style={styles.card}>
      <Text style={[typography.subtitle, { color: colors.text }]}>{t("libraryNoResults")}</Text>
      <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm, lineHeight: 22 }]}>
        {t("libraryNoResultsHint")}
      </Text>
    </PhCard>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.md },
});
