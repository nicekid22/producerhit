import type { Loop } from "@/types/loop";

export function isPreviewLoopId(id: string) {
  return id.startsWith("preview-");
}

/** Retire les previews dont une loop persistée (même titre) existe déjà — évite les doublons visuels. */
export function dropStalePreviewDuplicates(loops: Loop[]) {
  const persistedNames = new Set(
    loops.filter((l) => !isPreviewLoopId(l.id)).map((l) => l.name.trim().toLowerCase()),
  );
  return loops.filter((l) => {
    if (!isPreviewLoopId(l.id)) return true;
    return !persistedNames.has(l.name.trim().toLowerCase());
  });
}
