import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PhCard } from "@/components/PhCard";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  features: string[];
  price: string;
  perMonthLabel: string;
};

export function PaywallPlanCard({ features, price, perMonthLabel }: Props) {
  const { colors, typography, radius, material } = useTheme();
  const doubleBezel = material === "paper";

  return (
    <PhCard
      style={[
        styles.card,
        doubleBezel && {
          borderWidth: 2,
          borderColor: colors.surfaceBorder,
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          doubleBezel && {
            borderWidth: 1,
            borderColor: colors.accentPrimary,
            borderRadius: radius.lg,
            padding: spacing.md,
          },
        ]}
      >
        {features.map((line) => (
          <View key={line} style={styles.featureRow}>
            <View style={[styles.check, { backgroundColor: colors.pillActiveBg }]}>
              <Ionicons name="checkmark" size={14} color={colors.success} />
            </View>
            <Text style={[typography.body, { color: colors.text, flex: 1, lineHeight: 22 }]}>{line}</Text>
          </View>
        ))}

        <View style={[styles.priceBlock, { backgroundColor: colors.bgElevated, borderRadius: radius.lg, borderColor: colors.accentPrimary }]}>          <Text style={[typography.title, { color: colors.text, fontSize: 34, fontVariant: ["tabular-nums"] }]}>{price}</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{perMonthLabel}</Text>
        </View>
      </View>
    </PhCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  inner: { gap: spacing.sm },
  featureRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  priceBlock: {
    marginTop: spacing.md,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
  },
});
