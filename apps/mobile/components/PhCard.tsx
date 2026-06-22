import { ReactNode } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { PhSurface } from "@/components/PhSurface";
import { spacing } from "@/theme/tokens";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
};

export function PhCard({ children, style, elevated = true }: Props) {
  const { elevation } = useTheme();
  return (
    <PhSurface style={[styles.card, elevated ? (elevation.card as ViewStyle) : null, style]} elevated={elevated}>
      {children}
    </PhSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
});
