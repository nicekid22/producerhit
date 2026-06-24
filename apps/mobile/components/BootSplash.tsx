import { StyleSheet, View } from "react-native";

import { AIOrb } from "@/components/AIOrb/AIOrb";
import { BrandLogo } from "@/components/BrandLogo";

import { useTheme } from "@/theme/ThemeProvider";

import { spacing } from "@/theme/tokens";

export function BootSplash() {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
      <AIOrb size={88} state="active" />
      <BrandLogo />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg },
});
