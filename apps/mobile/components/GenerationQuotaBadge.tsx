import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  line: string;
  remaining?: number;
};

export const GenerationQuotaBadge = memo(function GenerationQuotaBadge({ line, remaining }: Props) {
  const { colors, typography } = useTheme();
  const low = remaining != null && remaining <= 2;

  return (
    <View style={styles.row}>
      <Ionicons
        name="diamond"
        size={13}
        color={low ? colors.warning ?? colors.accentPrimary : colors.accentPrimary}
      />
      <Text style={[typography.micro, styles.text, { color: colors.textMuted }]}>{line}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  text: {
    fontWeight: "500",
    letterSpacing: 0.15,
  },
});
