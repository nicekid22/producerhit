import { Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CommunityLoop } from "@/lib/publicLoopsApi";
import { LoopCover } from "@/components/LoopCover";
import { loopKindLabel, shareLoopUrl } from "@/lib/loopDisplay";
import { PhButton } from "@/components/PhButton";
import { useI18n } from "@/stores/localeStore";
import { colors, radius, spacing, typography } from "@/theme/tokens";

type Props = {
  loop: CommunityLoop | null;
  visible: boolean;
  onClose: () => void;
};

export function PublicLoopSheet({ loop, visible, onClose }: Props) {
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  if (!loop) return null;

  const share = async () => {
    const url = shareLoopUrl(loop.id);
    await Share.share({ message: `${loop.name} — ${url}`, url });
  };

  const openWeb = () => {
    void Linking.openURL(shareLoopUrl(loop.id));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <LoopCover loop={loop} size={120} rounded={radius.xl} />
            <View style={styles.heroMeta}>
              <Text style={styles.kind}>
                {loopKindLabel(loop, locale)} · {t("communityTag")}
              </Text>
              <Text style={styles.title}>{loop.name}</Text>
              <Text style={styles.meta}>
                {loop.genre} · {loop.bpm} BPM
              </Text>
              {loop.authorUsername ? (
                <Text style={styles.author}>@{loop.authorUsername}</Text>
              ) : null}
            </View>
          </View>

          {loop.prompt ? (
            <>
              <Text style={styles.label}>{t("promptLabel")}</Text>
              <Text style={styles.prompt}>{loop.prompt}</Text>
            </>
          ) : null}

          <PhButton label={t("shareLink")} onPress={() => void share()} />
          <PhButton label={t("openOnWeb")} variant="ghost" onPress={openWeb} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    maxHeight: "80%",
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
  content: { padding: spacing.lg, gap: spacing.md },
  hero: { flexDirection: "row", gap: spacing.lg, alignItems: "center", marginBottom: spacing.md },
  heroMeta: { flex: 1 },
  kind: { ...typography.caption, color: colors.accent },
  title: { ...typography.subtitle, color: colors.text, marginTop: 4 },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  author: { ...typography.caption, color: colors.accent, marginTop: 4 },
  label: { ...typography.caption, color: colors.textMuted },
  prompt: { ...typography.body, color: colors.textMuted, lineHeight: 22 },
});
