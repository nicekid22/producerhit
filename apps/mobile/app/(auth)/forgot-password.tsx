import { useState } from "react";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AuthScreenShell } from "@/components/AuthScreenShell";
import { GlassErrorBanner } from "@/components/GlassErrorBanner";
import { PhButton } from "@/components/PhButton";
import { PhTextField } from "@/components/PhTextField";
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
    setMessage(null);
    try {
      await resetPassword(email);
      setMessage(t("resetSent"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("resetEmailFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell title={t("resetTitle")} subtitle={t("loginSub")}>
      <PhTextField
        label={t("email")}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
      />
      {error ? <GlassErrorBanner message={error} /> : null}
      {message ? <GlassErrorBanner message={message} tone="success" /> : null}
      <PhButton label={t("sendReset")} onPress={() => void submit()} loading={loading} />
      <View style={styles.links}>
        <Link href="/(auth)/login" style={[typography.caption, { color: colors.accentPrimary }]}>
          {t("backSignIn")}
        </Link>
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  links: { marginTop: spacing.sm },
});
