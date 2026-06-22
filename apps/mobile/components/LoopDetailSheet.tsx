import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { Loop } from "@producerhit/shared";
import { LoopCover } from "@/components/LoopCover";
import { PhButton } from "@/components/PhButton";
import { deleteLoop, setLoopPublic, updateLoop } from "@/lib/loopsApi";
import { downloadLoopAudio, promptUpgradeForDownload } from "@/lib/downloadAudio";
import { canDownloadStems, canExportWav } from "@/lib/planEntitlements";
import { generateLoopVariant } from "@/lib/loopsApi";
import { loopKindLabel, shareLoopUrl } from "@/lib/loopDisplay";
import { useI18n } from "@/stores/localeStore";
import { resolveStemsDownloadUrl } from "@producerhit/shared";
import { useAuthStore } from "@/stores/authStore";
import { usePlayerStore } from "@/stores/playerStore";
import { colors, radius, spacing, typography } from "@/theme/tokens";

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
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const resetPlayer = usePlayerStore((s) => s.reset);
  const setCurrent = usePlayerStore((s) => s.setCurrent);
  const current = usePlayerStore((s) => s.current);
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loop && visible) {
      setName(loop.name);
      setIsPublic(loop.isPublic);
    }
  }, [loop, visible]);

  if (!loop) return null;

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
      promptUpgradeForDownload(() => router.push("/paywall"));
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

  const downloadStems = async () => {
    if (!canDownloadStems(profile?.plan)) {
      Alert.alert(t("plusPlanTitle"), t("plusPlanBody"), [
        { text: t("ok") },
        { text: t("viewPlans"), onPress: () => void Linking.openURL("https://www.producerhit.com/pricing") },
      ]);
      return;
    }
    const url = resolveStemsDownloadUrl(loop.stemsUrl);
    if (!url) {
      Alert.alert(t("downloadStems"), t("stemsNoZip"));
      return;
    }
    setBusy(true);
    try {
      const Sharing = await import("expo-sharing");
      const FileSystem = await import("expo-file-system");
      const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!baseDir) throw new Error("No cache");
      const target = `${baseDir}${loop.id}-stems.zip`;
      const result = await FileSystem.downloadAsync(url, target);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri);
    } catch (e) {
      Alert.alert(t("downloadStems"), e instanceof Error ? e.message : t("downloadFailed"));
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
        if (err.limitReached) router.push("/paywall");
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <LoopCover loop={loop} size={120} rounded={radius.xl} />
            <View style={styles.heroMeta}>
              <Text style={styles.kind}>{loopKindLabel(loop, locale)}</Text>
              <Text style={styles.genre}>
                {loop.genre} · {loop.bpm} BPM
              </Text>
            </View>
          </View>

          <Text style={styles.label}>{t("titleLabel")}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor={colors.textSubtle}
          />
          {name.trim() !== loop.name ? (
            <PhButton label={t("saveTitle")} onPress={() => void saveName()} loading={busy} style={{ marginTop: spacing.sm }} />
          ) : null}

          <Text style={[styles.label, { marginTop: spacing.lg }]}>{t("promptLabel")}</Text>
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
              trackColor={{ false: colors.surface, true: colors.accent }}
            />
          </View>

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

          <PhButton
            label={canExportWav(profile?.plan) ? t("downloadBeat") : `${t("downloadBeat")} (Pro)`}
            variant="ghost"
            onPress={() => void download()}
            disabled={busy}
          />
          <PhButton
            label={canDownloadStems(profile?.plan) ? t("downloadStems") : t("stemsProOnly")}
            variant="ghost"
            onPress={() => void downloadStems()}
            disabled={busy}
          />
          <PhButton label={t("shareLink")} variant="ghost" onPress={() => void share()} />
          <PhButton label={t("deleteTrack")} variant="ghost" onPress={confirmDelete} disabled={busy} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    maxHeight: "88%",
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textSubtle,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  hero: { flexDirection: "row", gap: spacing.lg, alignItems: "center", marginBottom: spacing.md },
  heroMeta: { flex: 1 },
  kind: { ...typography.caption, color: colors.accent },
  genre: { ...typography.subtitle, color: colors.text, marginTop: 4 },
  label: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.md,
    padding: 14,
    color: colors.text,
    backgroundColor: colors.surface,
    ...typography.body,
  },
  prompt: { ...typography.body, color: colors.textMuted, lineHeight: 22 },
  publicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  publicTitle: { ...typography.subtitle, color: colors.text, fontSize: 15 },
  publicSub: { ...typography.caption, color: colors.textSubtle, marginTop: 2 },
  variantRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  variantBtn: { flex: 1 },
});
