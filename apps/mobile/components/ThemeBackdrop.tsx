import { memo, type ReactNode } from "react";
import { StyleSheet, type StyleProp, type ViewStyle, View } from "react-native";

import { AppBackground } from "@/components/AppBackground";

type Props = {
  children?: ReactNode;
  layer?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Shared Dusty Cloud background — mount once in tabs layout when possible. */
export const AtmosphereLayer = memo(function AtmosphereLayer({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <AppBackground />
    </View>
  );
});

export const ThemeBackdrop = memo(function ThemeBackdrop({ children, layer, style }: Props) {
  if (layer) {
    return (
      <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
        <AppBackground />
      </View>
    );
  }

  return (
    <View style={[styles.root, style]}>
      <AppBackground />
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
});
