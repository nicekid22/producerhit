import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PhCard } from "@/components/PhCard";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  title: string;
  body: string;
  onDismiss: () => void;
};

export const StudioCoachBubble = memo(function StudioCoachBubble({ title, body, onDismiss }: Props) {
  const { colors, typography, radius } = useTheme();

  return (
    <PhCard elevated={false} style={[styles.card, { borderRadius: radius.lg, borderColor: colors.pillActiveText }]}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: colors.pillActiveBg }]}>
          <Ionicons name="sparkles-outline" size={16} color={colors.pillActiveText} />
        </View>
        <View style={styles.copy}>
          <Text style={[typography.caption, { color: colors.text, fontWeight: "700" }]}>{title}</Text>
          <Text style={[typography.micro, { color: colors.textMuted, marginTop: 4, lineHeight: 18 }]}>{body}</Text>
        </View>
        <Pressable onPress={onDismiss} hitSlop={10} accessibilityLabel="Dismiss">
          <Ionicons name="close" size={18} color={colors.textSubtle} />
        </Pressable>
      </View>
    </PhCard>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1 },
});
