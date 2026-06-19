import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Radio } from "lucide-react";
import { AVATAR_PRESETS } from "@/lib/creatorProfile";
import { formatCommentAge, type FluxCommentPreview } from "@/lib/loopComments";
import type { PublicLoopRow } from "@/lib/publicLoops";
import type { AppLocale } from "@/i18n/config";
import { buildCommunityHubUiCopy } from "@/i18n/communityHubUiCatalog";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  comments: FluxCommentPreview[];
  loading: boolean;
  rowsById: Record<string, PublicLoopRow>;
  onOpenTrack: (row: PublicLoopRow, focusComments?: boolean) => void;
};

function commentGlyph(avatarId: number): string {
  return AVATAR_PRESETS.find((a) => a.id === avatarId)?.glyph ?? "🎹";
}

export function CommunityLiveChatStrip({ locale, comments, loading, rowsById, onOpenTrack }: Props) {
  const copy = useMemo(() => buildCommunityHubUiCopy(locale), [locale]);
  const [activeIdx, setActiveIdx] = useState(0);
  const visible = useMemo(() => comments.filter((c) => rowsById[c.loop_id]), [comments, rowsById]);

  useEffect(() => {
    if (visible.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIdx((i) => (i + 1) % visible.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [visible.length]);

  if (loading && !visible.length) {
    return (
      <section className="pk-flux-live" aria-label={copy.feedLiveChat}>
        <div className="pk-flux-live__inner pk-flux-live__inner--loading">
          <Radio className="h-4 w-4 animate-pulse text-[var(--pk-community-accent,#67e8f9)]" aria-hidden />
          <span className="text-sm text-white/50">{copy.warmingUpChat}</span>
        </div>
      </section>
    );
  }

  if (!visible.length) return null;

  const active = visible[activeIdx % visible.length] ?? visible[0];
  const row = rowsById[active.loop_id];

  return (
    <section id="flux-live-chat" className="pk-flux-live" aria-label={copy.feedLiveChat}>
      <div className="pk-flux-live__inner">
        <div className="pk-flux-live__head">
          <span className="pk-flux-live__badge">
            <span className="pk-flux-live__dot" aria-hidden />
            {copy.liveChat}
          </span>
          <p className="pk-flux-live__hint">{copy.liveChatHint}</p>
        </div>

        <div className="pk-flux-live__ticker">
          {visible.slice(0, 6).map((comment) => {
            const track = rowsById[comment.loop_id];
            if (!track) return null;
            const isActive = comment.id === active.id;
            return (
              <button
                key={comment.id}
                type="button"
                onClick={() => onOpenTrack(track, true)}
                className={cn("pk-flux-live__bubble", isActive && "pk-flux-live__bubble--active")}
                aria-current={isActive ? "true" : undefined}
              >
                <span className="pk-flux-live__avatar" aria-hidden>
                  {commentGlyph(comment.author?.avatar_id ?? comment.author_avatar_id)}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="pk-flux-live__meta">
                    <strong>@{comment.displayName}</strong>
                    <span aria-hidden>·</span>
                    <span>{formatCommentAge(comment.created_at, locale)}</span>
                  </span>
                  <span className="pk-flux-live__body">{comment.body}</span>
                  <span className="pk-flux-live__track">
                    <MessageCircle className="h-3 w-3 shrink-0" aria-hidden />
                    {comment.loopName ?? track.name ?? copy.untitled}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {row ? (
          <button type="button" onClick={() => onOpenTrack(row, true)} className="pk-flux-live__cta">
            {copy.joinConvo}
          </button>
        ) : null}
      </div>
    </section>
  );
}
