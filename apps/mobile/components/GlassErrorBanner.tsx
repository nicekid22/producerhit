import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PhCard } from "@/components/PhCard";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  message: string;
  tone?: "error" | "success";
};

/** Bannière d'erreur/succès — surface solide Dusty (pas de blur). */
export const GlassErrorBanner = memo(function GlassErrorBanner({ message, tone = "error" }: Props) {
  const { colors, typography } = useTheme();
  const accent = tone === "success" ? colors.success : colors.danger;

  if (!message) return null;

  return (
    <PhCard elevated={false} style={styles.wrap}>
      <View style={[styles.strip, { borderLeftColor: accent }]}>
        <Text style={[typography.caption, { color: accent, flex: 1 }]}>{message}</Text>
      </View>
    </PhCard>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md, padding: 0 },
  strip: {
    borderLeftWidth: 3,
    paddingLeft: spacing.md,
    paddingVertical: spacing.sm,
  },
});
