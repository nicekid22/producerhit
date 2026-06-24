import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { AuthScreenShell } from "@/components/AuthScreenShell";
import { PhButton } from "@/components/PhButton";
import { parseAuthCallbackUrl } from "@/lib/auth";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors, typography } = useTheme();
  const params = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const initial = await Linking.getInitialURL();
      const code = typeof params.code === "string" ? params.code : null;
      const url =
        initial ?? (code ? `producerhit://auth/callback?code=${encodeURIComponent(code)}` : null);
      if (!url) throw new Error(t("authCallbackMissing"));
      await parseAuthCallbackUrl(url);
      router.replace("/(tabs)/create");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("authCallbackFailed"));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void run();
  }, [params.code, router]);

  return (
    <AuthScreenShell title={t("loginTitle")} subtitle={t("loginSub")}>
      {busy && !error ? <ActivityIndicator color={colors.accentPrimary} size="large" style={styles.spinner} /> : null}
      {error ? <Text style={[typography.body, { color: colors.danger, textAlign: "center", lineHeight: 22 }]}>{error}</Text> : null}
      {error ? <PhButton label={t("backSignIn")} onPress={() => router.replace("/(auth)/login")} /> : null}
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  spinner: { marginVertical: 24 },
});
