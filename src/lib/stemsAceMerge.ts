import { parseStemsUrl } from "@/lib/publicLoops";
import type { CoverKind } from "@/lib/coverMedia";

function aceFromStems(stems: Record<string, unknown> | null): Record<string, unknown> {
  if (!stems?.ace || typeof stems.ace !== "object") return {};
  return { ...(stems.ace as Record<string, unknown>) };
}

function validAceCoverUrl(ace: Record<string, unknown>): string | null {
  const u = typeof ace.coverUrl === "string" ? ace.coverUrl.trim() : "";
  return u.startsWith("http://") || u.startsWith("https://") ? u : null;
}

/**
 * Fusionne deux stems_url sans perdre coverUrl / coverPrompt déjà en DB ou en store.
 * `preserved` gagne pour la cover ; `incoming` pour le reste (audio ACE…).
 */
export function mergeStemsPreservingAceCover(
  incoming: Record<string, unknown> | null,
  preserved: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!incoming && !preserved) return null;
  const inc = incoming ?? {};
  const pre = preserved ?? {};
  const aceInc = aceFromStems(inc);
  const acePre = aceFromStems(pre);
  const coverUrl = validAceCoverUrl(acePre) ?? validAceCoverUrl(aceInc);
  const ace: Record<string, unknown> = { ...acePre, ...aceInc };
  if (coverUrl) {
    ace.coverUrl = coverUrl;
    const kind = acePre.coverKind ?? aceInc.coverKind;
    if (kind === "video" || kind === "image") ace.coverKind = kind as CoverKind;
  }
  const coverPrompt =
    (typeof acePre.coverPrompt === "string" ? acePre.coverPrompt.trim() : "") ||
    (typeof aceInc.coverPrompt === "string" ? aceInc.coverPrompt.trim() : "");
  if (coverPrompt) ace.coverPrompt = coverPrompt;
  return { ...pre, ...inc, ace };
}

export function readAceCoverFromStems(stemsUrl: unknown): { coverUrl?: string; coverKind?: CoverKind; coverPrompt?: string } {
  const stems = parseStemsUrl(stemsUrl);
  const ace = aceFromStems(stems);
  const coverUrl = validAceCoverUrl(ace) ?? undefined;
  const coverKindRaw = ace.coverKind;
  const coverKind = coverKindRaw === "video" || coverKindRaw === "image" ? coverKindRaw : undefined;
  const coverPrompt = typeof ace.coverPrompt === "string" ? ace.coverPrompt.trim() : undefined;
  return { coverUrl, coverKind, coverPrompt: coverPrompt || undefined };
}
