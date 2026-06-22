import { StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  used: number;
  limit: number;
  label?: string;
};

export function UsageBar({ used, limit, label }: Props) {
  const { t, tf } = useI18n();
  const { colors, radius, typography } = useTheme();
  const displayLabel = label ?? t("usageMonth");
  const ratio = limit > 0 ? Math.min(1, used / limit) : 0;
  const remaining = Math.max(0, limit - used);
  const warn = ratio >= 0.85;
  const fillColor = warn ? colors.warning : colors.accentSolid;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{displayLabel}</Text>
        <Text style={[typography.subtitle, { color: warn ? colors.warning : colors.text, fontSize: 15 }]}>
          {used}/{limit}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.seekTrack, borderRadius: radius.pill }]}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: fillColor, borderRadius: radius.pill }]} />
      </View>
      <Text style={[typography.micro, { color: colors.textSubtle }]}>{tf("remaining", { n: remaining })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  track: { height: 8, overflow: "hidden" },
  fill: { height: "100%" },
});
