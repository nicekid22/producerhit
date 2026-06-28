import toast from "react-hot-toast";
import type { AppLocale } from "@/i18n/config";
import { buildDashboardSection } from "@/i18n/dashboardCatalog";
import { useMemo, useState } from "react";
import { Clock, Copy, Gauge, KeyRound, Loader2, Mic2, Music2, Sigma, Tag, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DistributionDistributeButton } from "@/components/distribution/DistributionWizard";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/Badge";
import { CoverMedia } from "@/components/CoverMedia";
import { isCoverVideo } from "@/lib/coverMedia";
import { coverImageKeyFromLoop, resolveLoopDisplayCoverUrl } from "@/lib/coverArt";
import { countLyricsLines, parseAceLyricsForDisplay } from "@/lib/formatAceLyrics";
import { resolveLoopDisplayLyrics } from "@/lib/loopDisplayLyrics";
import { cn, COVER_SURFACE_CLASS } from "@/lib/utils";
import type { Loop } from "@/types/loop";
import { canUseProducerTag } from "@/lib/planEntitlements";
import { readLoopProducerTagMeta } from "@/lib/producerTag";
import { mergeProducerTagIntoStems, clearProducerTagFromStems } from "@producerhit/shared";
import { ProducerTagApplyModal } from "@/components/producerTag/ProducerTagApplyModal";
import { useResolvedPlan } from "@/hooks/useResolvedPlan";
import { useLoopsStore } from "@/stores/loopsStore";
import { useGrowthUpsellStore } from "@/stores/growthUpsellStore";

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

type DetailTab = "info" | "lyrics";

function DetailStatPill({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pk-loop-stat-pill flex min-w-[4.75rem] shrink-0 flex-col gap-0.5 rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2",
        className,
      )}
    >
      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-pk-muted">
        <Icon className="h-3 w-3 opacity-80" aria-hidden />
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums text-pk-text">{value}</span>
    </div>
  );
}

function DetailTabs({
  active,
  onChange,
  infoLabel,
  lyricsLabel,
  lyricsCount,
}: {
  active: DetailTab;
  onChange: (tab: DetailTab) => void;
  infoLabel: string;
  lyricsLabel: string;
  lyricsCount: number;
}) {
  return (
    <div className="pk-loop-detail-tabs flex gap-1 p-0.5" role="tablist">
      {(
        [
          { id: "info" as const, label: infoLabel },
          { id: "lyrics" as const, label: lyricsLabel, badge: lyricsCount > 0 ? lyricsCount : undefined },
        ] as const
      ).map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
            active === tab.id
              ? "border-white/20 bg-white/[0.08] text-pk-text"
              : "border-white/10 bg-white/[0.03] text-pk-muted hover:border-white/15 hover:bg-white/[0.05] hover:text-pk-text",
          )}
        >
          {tab.label}
          {"badge" in tab && tab.badge ? (
            <span className="rounded-full bg-violet-500/25 px-1.5 py-0.5 text-[10px] font-bold text-violet-200">
              {tab.badge}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function LyricsBody({ lyrics, emptyLabel }: { lyrics: string; emptyLabel: string }) {
  const blocks = useMemo(() => parseAceLyricsForDisplay(lyrics), [lyrics]);

  if (!lyrics.trim()) {
    return (
      <div className="pk-loop-lyrics-empty flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-4 py-10 text-center">
        <Mic2 className="mb-3 h-8 w-8 text-pk-muted/50" aria-hidden />
        <p className="max-w-[16rem] text-sm leading-relaxed text-pk-muted">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="pk-loop-lyrics-body space-y-4 pr-0.5">
      {blocks.map((block, i) =>
        block.kind === "section" ? (
          <div key={`s-${i}-${block.label}`}>
            <span className="inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-200">
              {block.label}
            </span>
          </div>
        ) : (
          <p key={`l-${i}`} className="pl-0.5 text-sm leading-relaxed text-pk-text">
            {block.text}
          </p>
        ),
      )}
    </div>
  );
}

function DescriptionBlock({
  text,
  title,
  showMore,
  showLess,
}: {
  text: string;
  title: string;
  showMore: string;
  showLess: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 220;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-pk-text">
        <Music2 className="h-3.5 w-3.5 text-pk-muted" aria-hidden />
        {title}
      </div>
      <p
        className={cn(
          "text-sm leading-relaxed text-pk-muted break-words whitespace-pre-wrap",
          !expanded && long && "line-clamp-4",
        )}
      >
        {text}
      </p>
      {long ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-semibold text-violet-300 transition-colors hover:text-violet-200"
        >
          {expanded ? showLess : showMore}
        </button>
      ) : null}
    </div>
  );
}

export function LoopDetailsPanel({
  loop,
  locale,
  detailsTitle,
  onDetailsTitleChange,
  savingDetailsTitle,
  onSaveTitle,
  durationSec,
  className,
  isPlayingCover = false,
  compact = false,
  onOpenDistribution,
  creditsRemaining,
  onNeedCredits,
  onProducerTagCreditUsed,
}: {
  loop: Loop;
  locale: AppLocale;
  detailsTitle: string;
  onDetailsTitleChange: (value: string) => void;
  savingDetailsTitle: boolean;
  onSaveTitle: () => void;
  durationSec?: number | null;
  className?: string;
  isPlayingCover?: boolean;
  compact?: boolean;
  onOpenDistribution?: (loop: Loop) => void;
  creditsRemaining?: number;
  onNeedCredits?: () => void;
  onProducerTagCreditUsed?: () => void;
}) {
  const d = buildDashboardSection(locale);
  const profile = useAuthStore((s) => s.profile);
  const { plan } = useResolvedPlan();
  const openUpsell = useGrowthUpsellStore((s) => s.openUpsell);
  const applyLoopProducerTagResult = useLoopsStore((s) => s.applyLoopProducerTagResult);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tab, setTab] = useState<DetailTab>("info");
  const tagMeta = useMemo(() => readLoopProducerTagMeta(loop.stemsUrl), [loop.stemsUrl]);
  const canTag = canUseProducerTag(plan) && Boolean(loop.audioUrl?.startsWith("http"));

  const dur = (loop.details?.duration ?? durationSec) as number | null | undefined;
  const durationLabel =
    typeof dur === "number" && isFinite(dur) && dur > 0 ? formatTime(dur) : "—";
  const coverUrl = useMemo(() => resolveLoopDisplayCoverUrl(loop, 768), [loop]);
  const coverKey = useMemo(() => coverImageKeyFromLoop(loop), [loop]);
  const isVideoCover = isCoverVideo(loop, coverUrl);
  const usePhotoCover = !isVideoCover && coverUrl.startsWith("http");
  const bpmLabel =
    typeof loop.details?.bpm === "number" && loop.details.bpm > 0 ? String(loop.details.bpm) : "—";
  const detailsText = loop.details?.caption || loop.prompt || "—";
  const lyricsText = useMemo(() => resolveLoopDisplayLyrics(loop), [loop]);
  const lyricsLineCount = useMemo(() => countLyricsLines(lyricsText), [lyricsText]);
  const hasLyrics = lyricsLineCount > 0;

  const copyLyrics = () => {
    if (!lyricsText) return;
    void (async () => {
      try {
        await navigator.clipboard.writeText(lyricsText);
        toast.success(d.lyricsCopied);
      } catch {
        toast.error(d.copyFailed);
      }
    })();
  };

  const coverAspect = compact ? "h-36" : "aspect-[5/4] max-h-52";

  return (
    <div
      className={cn(
        "pk-loop-details-panel space-y-4",
        compact && "pk-loop-details-panel--compact",
        className,
      )}
    >
      {/* Cover — une seule surface, sans cadre gris derrière */}
      <div
        className={cn(
          "pk-loop-details-cover relative w-full overflow-hidden rounded-xl",
          !usePhotoCover && COVER_SURFACE_CLASS,
          coverAspect,
        )}
      >
        {usePhotoCover ? (
          <CoverMedia loop={loop} coverUrl={coverUrl} coverKey={coverKey} imageClassName="object-cover" />
        ) : (
          <CoverMedia loop={loop} coverUrl={coverUrl} coverKey={coverKey} imageClassName="object-contain" />
        )}
        {compact ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-3 pt-10">
            <h2 className="line-clamp-2 text-base font-semibold leading-snug text-white">{loop.name}</h2>
            {isPlayingCover ? (
              <span className="mt-1.5 inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">
                ▶
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {loop.genre ? (
        <div>
          <Badge variant="accent">{loop.genre}</Badge>
        </div>
      ) : null}

      <div className="flex gap-2 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <DetailStatPill icon={Gauge} label="BPM" value={bpmLabel} />
        <DetailStatPill icon={Clock} label={d.duration} value={durationLabel} />
        <DetailStatPill icon={KeyRound} label={d.musicalKey} value={loop.details?.keyScale || "—"} />
        <DetailStatPill icon={Sigma} label={d.timeSigShort} value={loop.details?.timeSignature || "—"} />
      </div>

      <DistributionDistributeButton
        loop={loop}
        profile={profile}
        className="w-full"
        prominent
        onOpenWizard={onOpenDistribution}
      />

      {canTag ? (
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => setTagModalOpen(true)}
        >
          <Tag className="mr-2 h-4 w-4" />
          {tagMeta ? d.producerTagReapply : d.producerTagApply}
        </Button>
      ) : null}

      <ProducerTagApplyModal
        open={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        loop={loop}
        locale={locale}
        plan={plan}
        creditsRemaining={creditsRemaining}
        onNeedCredits={onNeedCredits ?? (() => openUpsell("credits_exhausted"))}
        onApplied={({ audioUrl, creditConsumed, producerTag }) => {
          applyLoopProducerTagResult(loop.id, {
            audioUrl,
            stemsUrl: mergeProducerTagIntoStems(loop.stemsUrl, producerTag),
          });
          if (creditConsumed) onProducerTagCreditUsed?.();
        }}
        onRemoved={(audioUrl) => {
          applyLoopProducerTagResult(loop.id, {
            audioUrl,
            stemsUrl: clearProducerTagFromStems(loop.stemsUrl),
          });
        }}
      />

      <DetailTabs
        active={tab}
        onChange={setTab}
        infoLabel={d.detailTabInfo}
        lyricsLabel={d.detailTabLyrics}
        lyricsCount={lyricsLineCount}
      />

      {tab === "info" ? (
        <div className="space-y-5" role="tabpanel">
          <DescriptionBlock
            text={detailsText}
            title={d.trackDetails}
            showMore={d.detailShowMore}
            showLess={d.detailShowLess}
          />

          <div>
            <div className="mb-2 text-xs font-semibold text-pk-text">{d.titleShort}</div>
            <div className="flex items-center gap-2">
              <input
                value={detailsTitle}
                onChange={(e) => onDetailsTitleChange(e.target.value)}
                className="w-full rounded-xl border border-pk-border bg-pk-input px-3 py-2.5 text-sm font-medium text-pk-text outline-none placeholder:text-pk-muted focus:border-pk-accent"
                placeholder={d.titleInputPlaceholder}
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={
                  savingDetailsTitle ||
                  detailsTitle.trim().length === 0 ||
                  detailsTitle.trim() === loop.name
                }
                onClick={onSaveTitle}
                className="shrink-0"
              >
                {savingDetailsTitle ? <Loader2 className="h-4 w-4 animate-spin" /> : d.saveShort}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3" role="tabpanel">
          {hasLyrics ? (
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={copyLyrics} aria-label={d.copyLyricsAria}>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                {d.detailCopyLyrics}
              </Button>
            </div>
          ) : null}
          <LyricsBody lyrics={lyricsText} emptyLabel={d.detailNoLyrics} />
        </div>
      )}
    </div>
  );
}
