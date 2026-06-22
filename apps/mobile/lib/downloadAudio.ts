import { Alert, Share } from "react-native";
import type { Loop } from "@producerhit/shared";
import { t } from "@/lib/i18n/catalog";
import { canExportWav } from "@/lib/planEntitlements";
import { useLocaleStore } from "@/stores/localeStore";

function cleanFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase() || "producerhit-track";
}

async function shareAudioFile(uri: string, filename: string): Promise<void> {
  try {
    const Sharing = await import("expo-sharing");
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: "audio/mpeg", dialogTitle: filename });
      return;
    }
  } catch {
    // fall through
  }
  await Share.share({ url: uri, message: filename });
}

export async function downloadLoopAudio(loop: Loop, plan: string | null | undefined): Promise<void> {
  const locale = useLocaleStore.getState().locale;
  if (!canExportWav(plan)) {
    throw new Error(t(locale, "proRequiredTitle"));
  }

  const source = loop.audioUrl?.trim();
  if (!source || !source.startsWith("http")) {
    throw new Error(t(locale, "downloadFailed"));
  }

  const filename = `${cleanFilename(loop.name)}.mp3`;

  try {
    const FileSystem = await import("expo-file-system");
    const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!baseDir) throw new Error(t(locale, "downloadFailed"));

    const target = `${baseDir}${filename}`;
    const result = await FileSystem.downloadAsync(source, target);
    if (result.status !== 200) throw new Error(t(locale, "downloadFailed"));
    await shareAudioFile(result.uri, filename);
  } catch {
    await Share.share({
      message: `${loop.name}\n${source}`,
      url: source,
    });
  }
}

export function promptUpgradeForDownload(onUpgrade: () => void): void {
  const locale = useLocaleStore.getState().locale;
  Alert.alert(t(locale, "proRequiredTitle"), t(locale, "proRequiredBody"), [
    { text: t(locale, "notNow"), style: "cancel" },
    { text: t(locale, "upgrade"), onPress: onUpgrade },
  ]);
}
