import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  columns?: number;
  count?: number;
};

export function LibrarySkeletonGrid({ columns = 2, count = 4 }: Props) {
  const { colors, radius } = useTheme();
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={[styles.grid, { gap: spacing.md }]}>
      {items.map((i) => (
        <View
          key={i}
          style={[
            styles.cell,
            {
              flexBasis: columns > 1 ? `${100 / columns - 2}%` : "100%",
              backgroundColor: colors.bgElevated,
              borderColor: colors.surfaceBorder,
              borderRadius: radius.lg,
            },
          ]}
        >
          <View style={[styles.cover, { backgroundColor: colors.surfaceBorder, borderRadius: radius.lg }]} />
          <View style={[styles.line, { backgroundColor: colors.surfaceBorder }]} />
          <View style={[styles.lineShort, { backgroundColor: colors.surfaceBorder }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  cell: { borderWidth: StyleSheet.hairlineWidth, padding: spacing.sm, gap: 8, marginBottom: spacing.md },
  cover: { aspectRatio: 1, width: "100%", opacity: 0.35 },
  line: { height: 12, borderRadius: 4, width: "85%", opacity: 0.3 },
  lineShort: { height: 10, borderRadius: 4, width: "55%", opacity: 0.25 },
});
