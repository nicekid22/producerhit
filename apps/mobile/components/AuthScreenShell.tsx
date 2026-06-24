import { ReactNode } from "react";
import { Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandLogo } from "@/components/BrandLogo";
import { PhCard } from "@/components/PhCard";
import { PhDisplay } from "@/components/PhDisplay";
import { ThemeBackdrop } from "@/components/ThemeBackdrop";
import { useStaggerEntrance } from "@/lib/useStaggerEntrance";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthScreenShell({ title, subtitle, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, typography } = useTheme();
  const headerEntrance = useStaggerEntrance(0);
  const bodyEntrance = useStaggerEntrance(80);
  const footerEntrance = useStaggerEntrance(160);

  return (
    <ThemeBackdrop>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={headerEntrance.style}>
            <BrandLogo />
            <PhDisplay variant="display" style={{ marginTop: spacing.lg }}>
              {title}
            </PhDisplay>
            {subtitle ? (
              <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing.sm, lineHeight: 22 }]}>
                {subtitle}
              </Text>
            ) : null}
          </Animated.View>

          <Animated.View style={bodyEntrance.style}>
            <PhCard style={styles.formCard}>{children}</PhCard>
          </Animated.View>

          {footer ? <Animated.View style={footerEntrance.style}>{footer}</Animated.View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemeBackdrop>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.screen, gap: spacing.lg },
  wave: { marginTop: spacing.lg },
  formCard: { padding: spacing.lg },
  body: { gap: spacing.md },
});
