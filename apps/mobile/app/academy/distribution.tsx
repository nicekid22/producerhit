import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  canAccessDistributionAcademy,
  DISTRIBUTION_ACADEMY_MODULES,
  DISTRIBUTION_ACADEMY_VALUE_USD,
  type DistributionAcademyActionItem,
  type DistributionAcademyModule,
} from "@producerhit/shared";
import { PhButton } from "@/components/PhButton";
import {
  isDistributionModuleComplete,
  markDistributionModuleComplete,
  readDistributionAcademyProgress,
  type AcademyProgress,
} from "@/lib/academyProgress";
import { canDistribute } from "@/lib/planEntitlements";
import { paywallHref } from "@/lib/iapCatalog";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

const ACADEMY_LANDING_URL = "https://www.producerhit.com/learn/distribute-ai-music";

export default function DistributionAcademyScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const locale = useLocaleStore((s) => s.locale);
  const { colors, typography } = useTheme();
  const isFr = locale === "fr";
  const gated = canAccessDistributionAcademy(profile?.plan);
  const [activeId, setActiveId] = useState(DISTRIBUTION_ACADEMY_MODULES[0]!.id);
  const [progress, setProgress] = useState<AcademyProgress>({});

  useEffect(() => {
    void readDistributionAcademyProgress().then(setProgress);
  }, []);

  const active =
    DISTRIBUTION_ACADEMY_MODULES.find((m) => m.id === activeId) ?? DISTRIBUTION_ACADEMY_MODULES[0]!;
  const canView = active.public || gated;
  const completed = isDistributionModuleComplete(active.id, progress);

  const onComplete = useCallback(async () => {
    const next = await markDistributionModuleComplete(active.id);
    setProgress(next);
  }, [active.id]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Text style={[typography.title, { color: colors.text }]}>Distribution Academy</Text>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>
        {isFr
          ? `Valeur ${DISTRIBUTION_ACADEMY_VALUE_USD} $ — inclus Studio & Plus`
          : `$${DISTRIBUTION_ACADEMY_VALUE_USD} value — included Studio & Plus`}
      </Text>

      <View style={styles.moduleNav}>
        {DISTRIBUTION_ACADEMY_MODULES.map((mod, i) => (
          <ModuleTab
            key={mod.id}
            index={i + 1}
            mod={mod}
            isFr={isFr}
            locked={!mod.public && !gated}
            done={isDistributionModuleComplete(mod.id, progress)}
            active={activeId === mod.id}
            onPress={() => setActiveId(mod.id)}
            colors={colors}
          />
        ))}
      </View>

      <View style={[styles.card, { borderColor: colors.border }]}>
        {!canView ? (
          <>
            <Text style={{ color: colors.textMuted, textAlign: "center", marginBottom: spacing.md }}>
              {isFr ? "Modules 2–8 réservés Studio & Plus." : "Modules 2–8 require Studio or Plus."}
            </Text>
            <PhButton
              label={isFr ? "Débloquer avec Studio" : "Unlock with Studio"}
              onPress={() => router.push(paywallHref("studio"))}
            />
          </>
        ) : (
          <ModuleBody
            mod={active}
            isFr={isFr}
            completed={completed}
            onComplete={() => void onComplete()}
            colors={colors}
            typography={typography}
            userId={user?.id ?? null}
            onNavigate={(path) => router.push(path as never)}
          />
        )}
      </View>

      <PhButton
        label={isFr ? "Ouvrir la bibliothèque" : "Open library"}
        variant="ghost"
        onPress={() => router.push("/(tabs)/library" as never)}
        disabled={!canDistribute(profile?.plan)}
      />
      <PhButton
        label={isFr ? "Landing formation (web)" : "Course landing (web)"}
        variant="ghost"
        onPress={() => void Linking.openURL(ACADEMY_LANDING_URL)}
      />
    </ScrollView>
  );
}

function ModuleTab({
  index,
  mod,
  isFr,
  locked,
  done,
  active,
  onPress,
  colors,
}: {
  index: number;
  mod: DistributionAcademyModule;
  isFr: boolean;
  locked: boolean;
  done: boolean;
  active: boolean;
  onPress: () => void;
  colors: { text: string; textMuted: string; accentPrimary: string; border: string };
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tab,
        {
          borderColor: active ? colors.accentPrimary : colors.border,
          backgroundColor: active ? `${colors.accentPrimary}22` : "transparent",
          opacity: locked ? 0.55 : 1,
        },
      ]}
    >
      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{index}</Text>
      <Text style={{ color: colors.text, fontSize: 13, flex: 1 }} numberOfLines={2}>
        {isFr ? mod.titleFr : mod.titleEn}
        {done ? " ✓" : locked ? " 🔒" : ""}
      </Text>
    </Pressable>
  );
}

function openAcademyAction(
  item: DistributionAcademyActionItem,
  userId: string | null,
  onNavigate: (path: string) => void,
) {
  if (item.externalUrl) {
    void Linking.openURL(item.externalUrl);
    return;
  }
  if (item.mobileHref) {
    if (item.requiresAuth && !userId) {
      onNavigate("/(auth)/login");
      return;
    }
    onNavigate(item.mobileHref);
    return;
  }
  if (item.href?.startsWith("http")) {
    void Linking.openURL(item.href);
  }
}

function ModuleBody({
  mod,
  isFr,
  completed,
  onComplete,
  colors,
  typography,
  userId,
  onNavigate,
}: {
  mod: DistributionAcademyModule;
  isFr: boolean;
  completed: boolean;
  onComplete: () => void;
  colors: { text: string; textMuted: string; accentPrimary?: string };
  typography: { subtitle: { fontSize?: number; fontWeight?: string }; caption: { fontSize?: number } };
  userId: string | null;
  onNavigate: (path: string) => void;
}) {
  return (
    <>
      <Text style={[typography.subtitle, { color: colors.text }]}>{isFr ? mod.titleFr : mod.titleEn}</Text>
      <Text style={{ color: colors.textMuted, marginTop: spacing.sm, lineHeight: 20 }}>
        {isFr ? mod.summaryFr : mod.summaryEn} · ~{mod.durationMin} min
      </Text>
      {(isFr ? mod.sectionsFr : mod.sectionsEn).map((line) => (
        <Text key={line} style={{ color: colors.textMuted, marginTop: spacing.sm, fontSize: 14, lineHeight: 20 }}>
          · {line}
        </Text>
      ))}
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.md, fontWeight: "600" }]}>
        {isFr ? "À faire" : "Action items"}
      </Text>
      {mod.actionItems.map((item) => {
        const label = isFr ? item.labelFr : item.labelEn;
        const hint = isFr ? item.hintFr : item.hintEn;
        const tappable = Boolean(item.mobileHref || item.externalUrl || item.href?.startsWith("http"));
        return (
          <View key={item.id} style={{ marginTop: spacing.sm }}>
            {tappable ? (
              <Pressable onPress={() => openAcademyAction(item, userId, onNavigate)} accessibilityRole="link">
                <Text
                  style={{
                    color: colors.accentPrimary ?? colors.text,
                    fontSize: 14,
                    fontWeight: "600",
                    textDecorationLine: "underline",
                  }}
                >
                  — {label}
                </Text>
              </Pressable>
            ) : (
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>— {label}</Text>
            )}
            {hint ? (
              <Text style={{ color: colors.textMuted, marginTop: 2, fontSize: 12, lineHeight: 17 }}>{hint}</Text>
            ) : null}
          </View>
        );
      })}
      <View style={{ marginTop: spacing.md }}>
        <PhButton
          label={
            completed
              ? isFr
                ? "Module terminé"
                : "Module complete"
              : isFr
                ? "Marquer comme terminé"
                : "Mark complete"
          }
          variant={completed ? "ghost" : "default"}
          onPress={onComplete}
          disabled={completed}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  moduleNav: { gap: spacing.xs, marginTop: spacing.md },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
});
