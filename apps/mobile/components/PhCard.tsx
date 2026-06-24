import { ReactNode } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { GlassCard, type GlassCardVariant } from "@/components/GlassCard";
import { spacing } from "@/theme/tokens";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  variant?: GlassCardVariant;
};

export function PhCard({ children, style, elevated = true, variant }: Props) {
  const resolved = variant ?? (elevated ? "elevated" : "default");
  return (
    <GlassCard variant={resolved} style={[styles.card, style]}>
      {children}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
});
