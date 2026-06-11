import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { AVATAR_PRESETS } from "@/lib/creatorProfile";
import {
  LOOP_COMMENT_MAX_LEN,
  deleteLoopComment,
  fetchLoopComments,
  formatCommentAge,
  hideLoopComment,
  postLoopComment,
  type LoopCommentView,
} from "@/lib/loopComments";
import { cn } from "@/lib/utils";

type Props = {
  loopId: string;
  loopOwnerId: string;
  isFr: boolean;
  userId: string | null;
  compactPreview?: boolean;
  commentCount?: number;
  onCommentCountChange?: (count: number) => void;
};

function avatarGlyph(avatarId: number): string {
  return AVATAR_PRESETS.find((a) => a.id === avatarId)?.glyph ?? "🎹";
}

function CommentAvatar({ comment }: { comment: LoopCommentView }) {
  const preset = AVATAR_PRESETS.find((a) => a.id === (comment.author?.avatar_id ?? comment.author_avatar_id));
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm",
        preset ? `bg-gradient-to-br ${preset.gradient}` : "bg-white/10",
      )}
      aria-hidden
    >
      {preset?.glyph ?? avatarGlyph(comment.author_avatar_id)}
    </span>
  );
}

export function LoopCommentsSection({
  loopId,
  loopOwnerId,
  isFr,
  userId,
  compactPreview = false,
  commentCount,
  onCommentCountChange,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<LoopCommentView[]>([]);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const total = commentCount ?? comments.length;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const rows = await fetchLoopComments(loopId);
        if (!cancelled) setComments(rows);
      } catch {
        if (!cancelled) setComments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loopId]);

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    if (!userId) {
      toast(isFr ? "Connecte-toi pour commenter" : "Login to comment");
      window.location.href = "/auth";
      return;
    }
    if (posting) return;
    setPosting(true);
    void (async () => {
      try {
        await postLoopComment(loopId, userId, body);
        const rows = await fetchLoopComments(loopId);
        setComments(rows);
        setDraft("");
        onCommentCountChange?.(rows.length);
        toast.success(isFr ? "Commentaire publié" : "Comment posted");
      } catch {
        toast.error(isFr ? "Impossible de publier" : "Could not post");
      } finally {
        setPosting(false);
      }
    })();
  };

  const remove = (comment: LoopCommentView) => {
    if (busyId) return;
    setBusyId(comment.id);
    void (async () => {
      try {
        if (comment.user_id && comment.user_id === userId) {
          await deleteLoopComment(comment.id);
        } else if (userId === loopOwnerId) {
          await hideLoopComment(comment.id);
        }
        setComments((prev) => {
          const next = prev.filter((c) => c.id !== comment.id);
          onCommentCountChange?.(next.length);
          return next;
        });
      } catch {
        toast.error(isFr ? "Action impossible" : "Action failed");
      } finally {
        setBusyId(null);
      }
    })();
  };

  if (compactPreview) {
    return (
      <Link
        to={`/loop/${loopId}#comments`}
        className="pk-accent-link inline-flex items-center gap-1.5 text-[11px] font-semibold"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {total > 0
          ? isFr
            ? `${total} commentaire${total > 1 ? "s" : ""}`
            : `${total} comment${total === 1 ? "" : "s"}`
          : isFr
            ? "Commenter"
            : "Comment"}
      </Link>
    );
  }

  return (
    <section
      id="comments"
      className="mt-10 rounded-2xl border border-pk-border bg-pk-panel/40 p-6 sm:p-8"
      aria-labelledby="loop-comments-title"
    >
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-pk-accent" />
        <h2 id="loop-comments-title" className="text-xl font-bold">
          {isFr ? "Commentaires" : "Comments"}
          {total > 0 ? <span className="ml-2 text-base font-semibold text-pk-muted">({total})</span> : null}
        </h2>
      </div>

      <div className="mt-5 space-y-3">
        <label className="sr-only" htmlFor="loop-comment-input">
          {isFr ? "Ton commentaire" : "Your comment"}
        </label>
        <textarea
          id="loop-comment-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, LOOP_COMMENT_MAX_LEN))}
          rows={3}
          placeholder={
            isFr
              ? "Dis ce que tu ressens sur ce beat… (280 car. max)"
              : "Share feedback on this beat… (280 chars max)"
          }
          className="w-full resize-none rounded-xl border border-pk-border bg-black/20 px-4 py-3 text-sm text-pk-text placeholder:text-pk-muted focus:border-pk-accent/50 focus:outline-none focus:ring-1 focus:ring-pk-accent/30"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-pk-muted">
            {draft.length}/{LOOP_COMMENT_MAX_LEN}
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={posting || !draft.trim()}
            className="pk-prism-btn inline-flex min-h-[40px] items-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-50"
          >
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isFr ? "Publier" : "Post"}
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-pk-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isFr ? "Chargement…" : "Loading…"}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-pk-muted">
            {isFr ? "Sois le premier à laisser un avis sur ce beat." : "Be the first to leave feedback on this beat."}
          </p>
        ) : (
          comments.map((comment) => {
            const canDelete = Boolean(userId && comment.user_id === userId);
            const canHide = Boolean(userId === loopOwnerId && !canDelete);
            return (
              <article key={comment.id} className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4">
                <CommentAvatar comment={comment} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-pk-text">{comment.displayName}</span>
                    <time className="text-xs text-pk-muted" dateTime={comment.created_at}>
                      {formatCommentAge(comment.created_at, isFr)}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-pk-text/90">{comment.body}</p>
                </div>
                {canDelete || canHide ? (
                  <button
                    type="button"
                    onClick={() => remove(comment)}
                    disabled={busyId === comment.id}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-pk-muted transition-colors hover:bg-white/5 hover:text-red-300"
                    aria-label={canDelete ? (isFr ? "Supprimer" : "Delete") : isFr ? "Masquer" : "Hide"}
                  >
                    {busyId === comment.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
