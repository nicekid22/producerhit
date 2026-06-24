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



  return (

    <View style={styles.wrap}>

      <View style={styles.row}>

        <Text style={[typography.caption, { color: colors.textMuted }]}>{displayLabel}</Text>

        <Text style={[typography.subtitle, { color: warn ? colors.warning : colors.text, fontSize: 15, fontVariant: ["tabular-nums"] }]}>

          {used}/{limit}

        </Text>

      </View>

      <View style={[styles.track, { backgroundColor: colors.seekTrack, borderRadius: radius.pill }]}>

        <View

          style={[

            styles.fill,

            {

              width: `${Math.max(ratio * 100, ratio > 0 ? 4 : 0)}%`,

              borderRadius: radius.pill,

              backgroundColor: warn ? colors.warning : colors.accentPrimary,

            },

          ]}

        />

      </View>

      <Text style={[typography.micro, { color: colors.textSubtle }]}>{tf("remaining", { n: remaining })}</Text>

    </View>

  );

}



const styles = StyleSheet.create({

  wrap: { gap: 8 },

  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  track: { height: 6, overflow: "hidden" },

  fill: { height: "100%", minWidth: 4 },

});

