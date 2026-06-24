import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { distributionMonthlyQuota } from "@producerhit/shared";
import { PhButton } from "@/components/PhButton";
import { PhCard } from "@/components/PhCard";
import { fetchDistributionReleases, fetchDistributionUsage } from "@/lib/distributionApi";
import { canDistribute } from "@/lib/planEntitlements";
import { paywallHref } from "@/lib/iapCatalog";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  preparing: "Préparation",
  submitted: "Soumis",
  in_review: "En review",
  live: "En ligne",
  rejected: "Rejeté",
  failed: "Échec",
  exported: "Pack exporté",
};

export default function DistributionScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { colors, typography } = useTheme();
  const [releases, setReleases] = useState<Awaited<ReturnType<typeof fetchDistributionReleases>>>([]);
  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const eligible = canDistribute(profile?.plan);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, u] = await Promise.all([fetchDistributionReleases(), fetchDistributionUsage()]);
      setReleases(list);
      setUsage(u ? { used: u.used, quota: u.quota } : { used: 0, quota: distributionMonthlyQuota(profile?.plan) });
    } finally {
      setLoading(false);
    }
  }, [profile?.plan]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Text style={[typography.title, { color: colors.text, marginBottom: spacing.sm }]}>Pack distribution</Text>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.lg }]}>
        ZIP prêt pour DistroKid, TuneCore, CD Baby — cover 1400×1400 + licence
      </Text>

      {eligible ? (
        <PhCard style={styles.quotaCard}>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            Exports : {usage?.used ?? 0} / {usage?.quota ?? distributionMonthlyQuota(profile?.plan)} ce mois
          </Text>
        </PhCard>
      ) : (
        <PhCard style={styles.quotaCard}>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm }}>
            Inclus dans Studio (2/mois) et Plus (5/mois).
          </Text>
          <PhButton label="Voir les plans" onPress={() => router.push(paywallHref())} />
        </PhCard>
      )}

      <Text style={[typography.caption, { color: colors.textSubtle, marginVertical: spacing.md }]}>
        Bibliothèque → ouvre un morceau → Pack distribution
      </Text>
      <PhButton
        label="Distribution Academy"
        variant="ghost"
        onPress={() => router.push("/academy/distribution" as never)}
      />

      {loading && releases.length === 0 ? (
        <ActivityIndicator color={colors.accentPrimary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={releases}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.accentPrimary} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          ListEmptyComponent={
            <Text style={{ color: colors.textSubtle, textAlign: "center", marginTop: spacing.xl }}>
              Aucun pack exporté pour l&apos;instant.
            </Text>
          }
          renderItem={({ item }) => (
            <PhCard style={{ marginBottom: spacing.md }}>
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16 }}>{item.title}</Text>
              <Text style={{ color: colors.textMuted, marginTop: 4 }}>{item.artistName}</Text>
              <Text style={{ color: colors.accentPrimary, marginTop: 8, fontSize: 12 }}>
                {STATUS_LABELS[item.status] ?? item.status}
              </Text>
              {item.status === "exported" ? (
                <Text style={{ color: colors.textSubtle, marginTop: 6, fontSize: 11 }}>
                  Upload manuel sur ton distributeur
                </Text>
              ) : null}
            </PhCard>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.lg, paddingTop: spacing.xl },
  quotaCard: { marginBottom: spacing.sm },
});
