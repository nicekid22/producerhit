import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { PhButton } from "@/components/PhButton";
import { PhCard } from "@/components/PhCard";
import { canUseProducerTag, producerTagMaxCount } from "@/lib/planEntitlements";
import { listProducerTags, type ProducerTag } from "@/lib/producerTag";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import { paywallHref } from "@/lib/iapCatalog";

export default function TagStudioScreen() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const { colors, typography } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const [tags, setTags] = useState<ProducerTag[]>([]);
  const [loading, setLoading] = useState(true);
  const planOk = canUseProducerTag(profile?.plan);
  const maxTags = producerTagMaxCount(profile?.plan);
  const isFr = locale === "fr";

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listProducerTags();
      setTags(res.tags);
    } catch {
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <>
      <Stack.Screen options={{ title: "Tag Studio" }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={[typography.title, { color: colors.text }]}>
          {isFr ? "Mon tag producteur" : "My producer tag"}
        </Text>
        <Text style={[typography.body, { color: colors.textMuted }]}>
          {isFr
            ? "Upload gratuit (Pro+). Applique sur un morceau depuis la fiche loop."
            : "Free upload (Pro+). Apply on a track from the loop sheet."}
        </Text>

        {!planOk ? (
          <PhCard>
            <Text style={{ color: colors.textMuted, marginBottom: spacing.sm }}>
              {isFr ? "Disponible avec Pro, Studio ou Plus." : "Available on Pro, Studio, or Plus."}
            </Text>
            <PhButton label={isFr ? "Voir les offres" : "View plans"} onPress={() => router.push(paywallHref("pro"))} />
          </PhCard>
        ) : (
          <>
            <PhCard>
              <Text style={{ color: colors.textMuted }}>
                {isFr
                  ? `Enregistre ou importe un jingle (3–8 s) sur producerhit.com/tag-studio. Limite : ${maxTags} tags.`
                  : `Record or upload a 3–8 s jingle at producerhit.com/tag-studio. Limit: ${maxTags} tags.`}
              </Text>
            </PhCard>
            <PhCard>
              <Text style={[typography.subtitle, { color: colors.text, marginBottom: spacing.sm }]}>
                {isFr ? "Mes tags" : "My tags"}
              </Text>
              {loading ? (
                <Text style={{ color: colors.textMuted }}>{t("loading")}</Text>
              ) : tags.length === 0 ? (
                <Text style={{ color: colors.textMuted }}>{isFr ? "Aucun tag." : "No tags yet."}</Text>
              ) : (
                tags.map((tag) => (
                  <View key={tag.id} style={styles.row}>
                    <Text style={{ color: colors.text, flex: 1 }}>{tag.name}</Text>
                  </View>
                ))
              )}
              <PhButton label={isFr ? "Actualiser" : "Refresh"} variant="ghost" onPress={() => void refresh()} style={{ marginTop: spacing.sm }} />
            </PhCard>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
});
