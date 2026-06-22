import { ReactNode } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  /** Force glass blur (Prism modals/sheets only) */
  glass?: boolean;
};

export function PhSurface({ children, style, elevated = false, glass = false }: Props) {
  const { colors, radius, elevation, glass: glassTokens, material } = useTheme();
  const useGlass = glass && glassTokens != null && material === "studio";

  return (
    <View
      style={[
        styles.wrap,
        {
          borderRadius: radius.lg,
          borderColor: colors.surfaceBorder,
          backgroundColor: useGlass ? "transparent" : colors.surface,
        },
        elevated ? elevation.card : null,
        style,
      ]}
    >
      {useGlass && Platform.OS === "ios" ? (
        <BlurView intensity={glassTokens!.blur} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
      {useGlass && glassTokens ? (
        <View style={[styles.highlight, { backgroundColor: glassTokens.highlight }]} pointerEvents="none" />
      ) : null}
      {children}
    </View>
  );
}

/** @deprecated Use PhSurface */
export const GlassSurface = PhSurface;

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});
