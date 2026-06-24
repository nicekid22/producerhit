import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PhDisplay } from "@/components/PhDisplay";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  title: string;
  modeLabel: string;
  generating?: boolean;
};

export const StudioHero = memo(function StudioHero({
  title,
  modeLabel,
  generating,
}: Props) {
  const { colors, typography, radius } = useTheme();

  return (
    <View style={styles.root}>
      <View style={styles.titles}>
        <PhDisplay variant="display">{title}</PhDisplay>
      </View>
      <View
        style={[
          styles.modePill,
          {
            backgroundColor: generating ? colors.pillActiveBg : colors.bgGlass,
            borderColor: generating ? colors.pillActiveText : colors.surfaceBorder,
            borderRadius: radius.pill,
          },
        ]}
      >
        <Text style={[typography.micro, { color: generating ? colors.pillActiveText : colors.textMuted, fontWeight: "600" }]}>
          {modeLabel}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  titles: { flex: 1 },
  modePill: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
