import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { Link } from "expo-router";
import { PhButton } from "@/components/PhButton";
import { PhTextField } from "@/components/PhTextField";
import { ThemeBackdrop } from "@/components/ThemeBackdrop";
import { resetPassword } from "@/lib/auth";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

export default function ForgotPasswordScreen() {
  const { t } = useI18n();
  const { colors, typography } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email);
      setMessage(t("resetSent"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeBackdrop>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.display, { color: colors.text }]}>{t("resetTitle")}</Text>
        <PhTextField label={t("email")} value={email} onChangeText={setEmail} keyboardType="email-address" />
        {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}
        {message ? <Text style={[typography.caption, { color: colors.success }]}>{message}</Text> : null}
        <PhButton label={t("sendReset")} onPress={() => void submit()} loading={loading} />
        <Link href="/(auth)/login" style={[typography.caption, { color: colors.accent }]}>
          {t("backSignIn")}
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
    </ThemeBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "transparent" },
  content: { padding: spacing.screen, paddingTop: 80, gap: spacing.lg },
});
