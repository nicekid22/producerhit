import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { AuthScreenShell } from "@/components/AuthScreenShell";
import { GlassErrorBanner } from "@/components/GlassErrorBanner";
import { PhButton } from "@/components/PhButton";
import { PhTextField } from "@/components/PhTextField";
import { signInWithApple } from "@/lib/appleAuth";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors, typography } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      router.replace("/(tabs)/create");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      router.replace("/(tabs)/create");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("googleSignInFailed"));
    } finally {
      setLoading(false);
    }
  };

  const apple = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithApple();
      router.replace("/(tabs)/create");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("appleSignInFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell
      title={t("loginTitle")}
      subtitle={t("loginSub")}
      footer={
        <Text style={[typography.micro, styles.footerNote, { color: colors.textSubtle }]}>{t("brandTagline")}</Text>
      }
    >
      {Platform.OS === "ios" ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={
            colors.statusBar === "light"
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={999}
          style={styles.appleBtn}
          onPress={() => void apple()}
        />
      ) : null}

      <PhButton label={t("googleSignIn")} variant="secondary" onPress={() => void google()} disabled={loading} />

      <View style={[styles.dividerRow, { borderColor: colors.surfaceBorder }]}>
        <View style={[styles.dividerLine, { backgroundColor: colors.surfaceBorder }]} />
        <Text style={[typography.micro, { color: colors.textSubtle, paddingHorizontal: spacing.sm }]}>{t("email")}</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.surfaceBorder }]} />
      </View>

      <PhTextField
        label={t("email")}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
      />
      <PhTextField
        label={t("password")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />
      {error ? <GlassErrorBanner message={error} /> : null}

      <PhButton label={t("signIn")} onPress={() => void submit()} loading={loading} />

      <View style={styles.links}>
        <Link href="/(auth)/signup" style={[typography.caption, { color: colors.accentPrimary }]}>
          {t("createAccount")}
        </Link>
        <Link href="/(auth)/forgot-password" style={[typography.caption, { color: colors.accentPrimary }]}>
          {t("forgotPassword")}
        </Link>
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  appleBtn: { width: "100%", height: 48 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: spacing.xs },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  links: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  footerNote: { textAlign: "center", marginTop: spacing.md },
});
