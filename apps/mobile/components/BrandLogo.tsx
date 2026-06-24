import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  compact?: boolean;
  iconOnly?: boolean;
};

export function BrandLogo({ compact = false, iconOnly = false }: Props) {
  const { colors, typography } = useTheme();

  if (iconOnly) {
    return (
      <View style={[styles.mono, compact && styles.monoCompact]}>
        <Text style={[styles.monoText, { color: colors.logoAccent }]}>ph</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Text style={[styles.base, compact && styles.baseCompact, typography.title, { color: colors.logoBase, fontWeight: "600", letterSpacing: -0.5, textTransform: "lowercase" }]}>
        producer
      </Text>
      <Text style={[styles.accent, compact && styles.accentCompact, typography.title, { color: colors.logoAccent, fontWeight: "700", letterSpacing: -0.5, textTransform: "lowercase" }]}>
        hit
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "baseline" },
  base: { fontSize: undefined },
  baseCompact: { fontSize: 18 },
  accent: { fontSize: undefined },
  accentCompact: { fontSize: 18 },
  mono: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  monoCompact: { width: 28, height: 28 },
  monoText: { fontSize: 14, fontWeight: "800", letterSpacing: -0.5 },
});
