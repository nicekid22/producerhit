import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AIOrb } from "@/components/AIOrb/AIOrb";
import { PhButton } from "@/components/PhButton";
import { PhCard } from "@/components/PhCard";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

export function LibraryEmptyState() {
  const { t } = useI18n();
  const { colors, typography } = useTheme();
  const router = useRouter();

  return (
    <PhCard style={styles.card}>
      <View style={styles.orbRow}>
        <AIOrb size={72} state="idle" />
      </View>
      <Text style={[typography.title, { color: colors.text, marginTop: spacing.lg, textAlign: "center" }]}>
        {t("libraryEmptyTitle")}
      </Text>
      <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm, lineHeight: 22, textAlign: "center" }]}>
        {t("libraryEmptyBody")}
      </Text>
      <PhButton
        label={t("libraryEmptyCta")}
        onPress={() => router.push("/(tabs)/create")}
        style={{ marginTop: spacing.lg }}
      />
    </PhCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "stretch" },
  orbRow: { alignItems: "center", marginTop: spacing.sm },
});
