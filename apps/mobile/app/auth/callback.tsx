import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { parseAuthCallbackUrl } from "@/lib/auth";
import { colors, typography } from "@/theme/tokens";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const initial = await Linking.getInitialURL();
        const code = typeof params.code === "string" ? params.code : null;
        const url =
          initial ??
          (code ? `producerhit://auth/callback?code=${encodeURIComponent(code)}` : null);
        if (!url) throw new Error("Missing auth callback");
        await parseAuthCallbackUrl(url);
        router.replace("/(tabs)/create");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Auth callback failed");
      }
    })();
  }, [params.code, router]);

  return (
    <View style={styles.wrap}>
      {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator color={colors.accent} size="large" />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { ...typography.body, color: colors.danger, textAlign: "center" },
});
