import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { AuthScreenShell } from "@/components/AuthScreenShell";
import { PhButton } from "@/components/PhButton";
import { PhTextField } from "@/components/PhTextField";
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
      setError(e instanceof Error ? e.message : t("signupFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell title={t("signupTitle")} subtitle={t("loginSub")}>
      <PhTextField label={t("email")} value={email} onChangeText={setEmail} keyboardType="email-address" error={error} />
      <PhTextField
        label={t("passwordHint")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
      />
      {message ? <Text style={[typography.caption, { color: colors.success }]}>{message}</Text> : null}
      <PhButton label={t("signUp")} onPress={() => void submit()} loading={loading} />
      <Link href="/(auth)/login" style={[typography.caption, { color: colors.accentPrimary, marginTop: spacing.sm }]}>
        {t("hasAccount")}
      </Link>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({});
