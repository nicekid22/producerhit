import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import { BrandLogo } from "@/components/BrandLogo";
import { PhButton } from "@/components/PhButton";
import { PhDisplay } from "@/components/PhDisplay";
import { PhTextField } from "@/components/PhTextField";
import { ThemeBackdrop } from "@/components/ThemeBackdrop";
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
    <ThemeBackdrop>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BrandLogo />
          <PhDisplay variant="display" style={{ marginTop: spacing.lg }}>{t("loginTitle")}</PhDisplay>
          <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.md }]}>{t("loginSub")}</Text>
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
          {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}
          <PhButton label={t("signIn")} onPress={() => void submit()} loading={loading} />
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
          <PhButton label={t("googleSignIn")} variant="ghost" onPress={() => void google()} disabled={loading} />
          <View style={styles.links}>
            <Link href="/(auth)/signup" style={[typography.caption, { color: colors.accent }]}>
              {t("createAccount")}
            </Link>
            <Link href="/(auth)/forgot-password" style={[typography.caption, { color: colors.accent }]}>
              {t("forgotPassword")}
            </Link>
          </View>
          <Text style={[typography.micro, styles.ace, { color: colors.textSubtle }]}>{t("acePowered")}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemeBackdrop>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.screen, paddingTop: 80, gap: spacing.lg, paddingBottom: 40 },
  error: {},
  links: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  appleBtn: { width: "100%", height: 48 },
  ace: { textAlign: "center", marginTop: spacing.lg },
});
