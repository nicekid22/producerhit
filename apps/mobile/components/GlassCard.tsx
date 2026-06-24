import { memo, ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { GlassSurface } from "@/components/GlassSurface";
import { useTheme } from "@/theme/ThemeProvider";

export type GlassCardVariant = "default" | "elevated" | "active";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: GlassCardVariant;
  /** Blur glass — tab bar, mini player, banners only */
  forceGlass?: boolean;
};

export const GlassCard = memo(function GlassCard({ children, style, variant = "default", forceGlass = false }: Props) {
  const { colors, radius, elevation, glass } = useTheme();

  const surfaceBg = variant === "elevated" ? colors.bgElevated : colors.bgGlass;
  const borderColor = variant === "active" ? colors.pillActiveText : colors.surfaceBorder;
  const activeTint = variant === "active" ? { backgroundColor: colors.pillActiveBg } : null;

  return (
    <View
      style={[
        styles.wrap,
        {
          borderRadius: radius.lg,
          borderColor,
          backgroundColor: forceGlass ? "transparent" : surfaceBg,
        },
        elevation.low,
        style,
      ]}
    >
      {forceGlass && glass ? (
        <GlassSurface
          intensity={glass.blur}
          tint={colors.statusBar === "light" ? "dark" : "light"}
          fallbackColor={surfaceBg}
          highlight={glass.highlight}
        />
      ) : null}
      {activeTint ? <View style={[StyleSheet.absoluteFill, activeTint]} pointerEvents="none" /> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  content: {
    position: "relative",
  },
});
