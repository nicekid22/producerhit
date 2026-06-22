import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { Link, useRouter } from "expo-router";
import { PhButton } from "@/components/PhButton";
import { PhTextField } from "@/components/PhTextField";
import { ThemeBackdrop } from "@/components/ThemeBackdrop";
import { signUpWithEmail } from "@/lib/auth";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

export default function SignupScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors, typography } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { session } = await signUpWithEmail(email, password);
      if (session) router.replace("/(tabs)/create");
      else setMessage(t("signupConfirm"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeBackdrop>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[typography.display, { color: colors.text }]}>{t("signupTitle")}</Text>
          <PhTextField label={t("email")} value={email} onChangeText={setEmail} keyboardType="email-address" />
          <PhTextField label={t("passwordHint")} value={password} onChangeText={setPassword} secureTextEntry />
          {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}
          {message ? <Text style={[typography.caption, { color: colors.success }]}>{message}</Text> : null}
          <PhButton label={t("signUp")} onPress={() => void submit()} loading={loading} />
          <Link href="/(auth)/login" style={[typography.caption, { color: colors.accent, marginTop: spacing.md }]}>
            {t("hasAccount")}
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
