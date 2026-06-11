import { supabase } from "@/lib/supabaseClient";
import { fetchPublicProfileCards, type PublicProfileCard } from "@/lib/creatorProfile";

export const LOOP_COMMENT_MAX_LEN = 280;

export type LoopCommentRow = {
  id: string;
  loop_id: string;
  user_id: string | null;
  body: string;
  author_name: string | null;
  author_avatar_id: number;
  is_seed: boolean;
  created_at: string;
};

export type LoopCommentView = LoopCommentRow & {
  author: PublicProfileCard | null;
  displayName: string;
};

export async function fetchLoopCommentCounts(loopIds: string[]): Promise<Record<string, number>> {
  const ids = loopIds.filter(Boolean);
  if (!ids.length) return {};
  const { data, error } = await supabase.rpc("get_loop_comment_counts", { p_loop_ids: ids });
  if (error) return {};
  const out: Record<string, number> = {};
  for (const row of (data ?? []) as Array<{ loop_id: string; comment_count: number }>) {
    if (row.loop_id) out[row.loop_id] = Number(row.comment_count) || 0;
  }
  return out;
}

export async function fetchLoopComments(loopId: string): Promise<LoopCommentView[]> {
  const { data, error } = await supabase
    .from("loop_comments")
    .select("id, loop_id, user_id, body, author_name, author_avatar_id, is_seed, created_at")
    .eq("loop_id", loopId)
    .is("hidden_at", null)
    .order("created_at", { ascending: true })
    .limit(80);
  if (error) throw error;

  const rows = (data ?? []) as LoopCommentRow[];
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
  const cards = userIds.length ? await fetchPublicProfileCards(userIds) : new Map<string, PublicProfileCard>();

  return rows.map((row) => {
    const author = row.user_id ? cards.get(row.user_id) ?? null : null;
    const displayName =
      author?.username?.trim() ||
      row.author_name?.trim() ||
      "Producer";
    return { ...row, author, displayName };
  });
}

export async function postLoopComment(loopId: string, userId: string, body: string): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed || trimmed.length > LOOP_COMMENT_MAX_LEN) {
    throw new Error("invalid_body");
  }
  const { error } = await supabase.from("loop_comments").insert({
    loop_id: loopId,
    user_id: userId,
    body: trimmed,
    is_seed: false,
  });
  if (error) throw error;
}

export async function deleteLoopComment(commentId: string): Promise<void> {
  const { error } = await supabase.from("loop_comments").delete().eq("id", commentId);
  if (error) throw error;
}

export async function hideLoopComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from("loop_comments")
    .update({ hidden_at: new Date().toISOString() })
    .eq("id", commentId);
  if (error) throw error;
}

export function formatCommentAge(iso: string, isFr: boolean): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 2) return isFr ? "à l'instant" : "just now";
  if (mins < 60) return isFr ? `il y a ${mins} min` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return isFr ? `il y a ${hours} h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return isFr ? `il y a ${days} j` : `${days}d ago`;
  return new Date(iso).toLocaleDateString(isFr ? "fr-FR" : "en-US", { month: "short", day: "numeric" });
}
