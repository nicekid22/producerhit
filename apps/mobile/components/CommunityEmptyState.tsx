import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AIOrb } from "@/components/AIOrb/AIOrb";
import { PhCard } from "@/components/PhCard";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

export function CommunityEmptyState() {
  const { t } = useI18n();
  const { colors, typography } = useTheme();
  const router = useRouter();

  return (
    <PhCard style={styles.card}>
      <View style={styles.orbRow}>
        <AIOrb size={72} state="idle" />
      </View>
      <Text style={[typography.title, { color: colors.text, marginTop: spacing.lg, textAlign: "center" }]}>
        {t("communityEmptyTitle")}
      </Text>
      <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm, lineHeight: 22, textAlign: "center" }]}>
        {t("communityEmptyBody")}
      </Text>
      <Pressable onPress={() => router.push("/(tabs)/create")} style={styles.cta}>
        <Text style={[typography.caption, { color: colors.accentPrimary, fontWeight: "600" }]}>
          {t("libraryEmptyCta")}
        </Text>
      </Pressable>
    </PhCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "stretch" },
  orbRow: { alignItems: "center", marginTop: spacing.sm },
  cta: { alignSelf: "center", marginTop: spacing.lg, paddingVertical: spacing.sm },
});
