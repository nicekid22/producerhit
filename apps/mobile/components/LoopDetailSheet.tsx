import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import type { Loop } from "@producerhit/shared";
import { PhBottomSheet } from "@/components/PhBottomSheet";
import { PhButton } from "@/components/PhButton";
import { PhCard } from "@/components/PhCard";
import { PhTextField } from "@/components/PhTextField";
import { SheetHeroArt } from "@/components/SheetHeroArt";
import { deleteLoop, generateLoopVariant, setLoopPublic, updateLoop } from "@/lib/loopsApi";
import { DistributionSubmitSheet } from "@/components/DistributionSubmitSheet";
import { canDistribute } from "@/lib/planEntitlements";
import { downloadLoopAudio, promptUpgradeForDownload } from "@/lib/downloadAudio";
import { paywallHref } from "@/lib/iapCatalog";
import { canExportWav } from "@/lib/planEntitlements";
import { loopKindLabel, resolveLoopCoverUrl, shareLoopUrl } from "@/lib/loopDisplay";
import { useI18n } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { togglePlayback, usePlayerStore } from "@/stores/playerStore";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";

type Props = {
  loop: Loop | null;
  visible: boolean;
  onClose: () => void;
  onUpdated?: (loop: Loop) => void;
  onDeleted?: (loopId: string) => void;
  onCreated?: (loop: Loop) => void;
};

export function LoopDetailSheet({ loop, visible, onClose, onUpdated, onDeleted, onCreated }: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { colors, typography } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const resetPlayer = usePlayerStore((s) => s.reset);
  const setCurrent = usePlayerStore((s) => s.setCurrent);
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [distributeOpen, setDistributeOpen] = useState(false);

  useEffect(() => {
    if (loop && visible) {
      setName(loop.name);
      setIsPublic(loop.isPublic);
    }
  }, [loop, visible]);

  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  if (!loop) return null;

  const active = current?.id === loop.id;
  const playing = active && isPlaying;
  const coverUri = resolveLoopCoverUrl(loop);

  const play = () => {
    if (!active) setCurrent(loop);
    else void togglePlayback();
  };

  const share = async () => {
    await Share.share({ message: `${loop.name} — ${shareLoopUrl(loop.id)}`, url: shareLoopUrl(loop.id) });
  };

  const saveName = async () => {
    if (!name.trim() || name.trim() === loop.name) return;
    setBusy(true);
    try {
      const updated = await updateLoop(loop.id, { name: name.trim() });
      onUpdated?.(updated);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert(t("error"), e instanceof Error ? e.message : t("renameFailed"));
    } finally {
      setBusy(false);
    }
  };

  const togglePublic = async (value: boolean) => {
    setIsPublic(value);
    setBusy(true);
    try {
      const updated = await setLoopPublic(loop.id, value);
      onUpdated?.(updated);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      setIsPublic(!value);
      Alert.alert(t("error"), e instanceof Error ? e.message : t("visibilityFailed"));
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!canExportWav(profile?.plan)) {
      promptUpgradeForDownload(() => router.push(paywallHref("pro")));
      return;
    }
    setBusy(true);
    try {
      await downloadLoopAudio(loop, profile?.plan);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert(t("downloadBeat"), e instanceof Error ? e.message : t("downloadFailed"));
    } finally {
      setBusy(false);
    }
  };

  const runVariant = (kind: "variation" | "remix") => {
    void (async () => {
      setBusy(true);
      try {
        const created = await generateLoopVariant(loop, kind);
        onCreated?.(created);
        setCurrent(created);
        onClose();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        const err = e as Error & { limitReached?: boolean };
        if (err.limitReached) router.push(paywallHref("studio"));
        Alert.alert(t("generating"), err.message ?? t("variantFailed"));
      } finally {
        setBusy(false);
      }
    })();
  };

  const confirmDelete = () => {
    Alert.alert(t("deleteConfirmTitle"), t("deleteConfirmBody"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              await deleteLoop(loop.id);
              if (current?.id === loop.id) resetPlayer();
              onDeleted?.(loop.id);
              onClose();
            } catch (e) {
              Alert.alert(t("error"), e instanceof Error ? e.message : t("deleteFailed"));
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <PhBottomSheet visible={visible} onClose={onClose}>
      <SheetHeroArt
        loop={loop}
        coverUri={coverUri}
        kindLabel={loopKindLabel(loop, locale)}
        playing={playing}
        onPlay={play}
      />

      <PhCard>
        <PhTextField label={t("titleLabel")} value={name} onChangeText={setName} />
        {name.trim() !== loop.name ? (
          <PhButton label={t("saveTitle")} onPress={() => void saveName()} loading={busy} style={{ marginTop: spacing.sm }} />
        ) : null}
        <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>{t("promptLabel")}</Text>
        <Text style={styles.prompt}>{loop.prompt || "—"}</Text>
        <View style={styles.publicRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.publicTitle}>{t("publicTitle")}</Text>
            <Text style={styles.publicSub}>{t("publicSub")}</Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={(v) => void togglePublic(v)}
            disabled={busy}
            trackColor={{ false: colors.surface, true: colors.accentPrimary }}
            thumbColor="#fff"
          />
        </View>
      </PhCard>

      <PhCard>
        <View style={styles.variantRow}>
          <PhButton
            label={t("variation")}
            onPress={() => runVariant("variation")}
            disabled={busy}
            loading={busy}
            style={styles.variantBtn}
          />
          <PhButton
            label={t("remix")}
            variant="ghost"
            onPress={() => runVariant("remix")}
            disabled={busy}
            style={styles.variantBtn}
          />
        </View>
      </PhCard>

      <PhCard>
        <PhButton
          label={canExportWav(profile?.plan) ? t("downloadBeat") : `${t("downloadBeat")} (Pro)`}
          variant="ghost"
          onPress={() => void download()}
          disabled={busy}
        />
        <PhButton label={t("shareLink")} variant="ghost" onPress={() => void share()} />
        {canDistribute(profile?.plan) ? (
          <PhButton label="Pack distribution" variant="ghost" onPress={() => setDistributeOpen(true)} disabled={busy} />
        ) : null}
      </PhCard>

      <DistributionSubmitSheet
        loop={loop}
        visible={distributeOpen}
        onClose={() => setDistributeOpen(false)}
      />

      <PhButton label={t("deleteTrack")} variant="ghost" onPress={confirmDelete} disabled={busy} />
    </PhBottomSheet>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
) {
  return StyleSheet.create({
    sectionLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
    prompt: { ...typography.body, color: colors.textMuted, lineHeight: 22 },
    publicRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginTop: spacing.lg,
      padding: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.pillActiveBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surfaceBorder,
    },
    publicTitle: { ...typography.subtitle, color: colors.text, fontSize: 15 },
    publicSub: { ...typography.caption, color: colors.textSubtle, marginTop: 2 },
    variantRow: { flexDirection: "row", gap: spacing.sm },
    variantBtn: { flex: 1 },
  });
}
