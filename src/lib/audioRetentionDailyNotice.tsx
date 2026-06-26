import type { AppLocale } from "@/i18n/config";
import { buildDashboardSection } from "@/i18n/dashboardCatalog";
import { toast, toastNotice } from "@/lib/appToast";
import type { Toast } from "react-hot-toast";

const STORAGE_PREFIX = "pk.audioRetentionDaily.";

function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function shouldShowAudioRetentionDailyNotice(userId: string, dateKey = localDateKey()): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(storageKey(userId)) !== dateKey;
  } catch {
    return false;
  }
}

export function markAudioRetentionDailyNoticeShown(userId: string, dateKey = localDateKey()): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userId), dateKey);
  } catch {
    void 0;
  }
}

function formatTitle(template: string, count: number): string {
  return template.replace(/\{\{count\}\}/g, String(count));
}

type ShowOpts = {
  locale: AppLocale;
  expiredCount: number;
  onSecure: () => void;
};

export function showAudioRetentionDailyNotice({ locale, expiredCount, onSecure }: ShowOpts): void {
  const copy = buildDashboardSection(locale);
  const title = formatTitle(copy.audioRetentionDailyTitle, expiredCount);
  const cta = copy.audioRetentionDailyCta;

  toastNotice(
    title,
    (t: Toast) => (
      <div
        className={`pk-toast pk-toast--notice flex max-w-[min(360px,calc(100vw-2rem))] flex-col gap-2 rounded-[14px] border border-amber-400/30 bg-[rgba(8,8,14,0.94)] p-3 shadow-lg backdrop-blur-xl ${
          t.visible ? "animate-enter" : "animate-leave"
        }`}
        role="status"
      >
        <div className="flex items-start gap-2">
          <span className="text-base leading-none" aria-hidden>
            ⚠️
          </span>
          <p className="text-sm font-semibold leading-snug text-white/92">{title}</p>
        </div>
        <button
          type="button"
          className="self-start rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500"
          onClick={() => {
            onSecure();
            toast.dismiss(t.id);
          }}
        >
          {cta}
        </button>
      </div>
    ),
    { id: "audio-retention-daily" },
  );
}
