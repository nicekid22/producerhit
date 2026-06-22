import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  size?: number;
};

export function BrandMark({ size = 44 }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size * 0.22,
          backgroundColor: colors.accentSolid,
          borderColor: colors.surfaceBorder,
        },
      ]}
    >
      <Text style={[styles.mark, { fontSize: size * 0.38, color: "#fff" }]}>ph</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  mark: { fontWeight: "800", letterSpacing: -1 },
});
