export type LyricsDisplayBlock =
  | { kind: "section"; label: string }
  | { kind: "line"; text: string };

/** Affichage UI — repère [Verse], [Chorus], etc. */
export function parseAceLyricsForDisplay(lyrics: string): LyricsDisplayBlock[] {
  const blocks: LyricsDisplayBlock[] = [];
  for (const raw of lyrics.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const section = trimmed.match(/^\[([^\]]+)\]$/);
    if (section) {
      blocks.push({ kind: "section", label: section[1]!.trim() });
      continue;
    }
    blocks.push({ kind: "line", text: trimmed });
  }
  return blocks;
}

export function countLyricsLines(lyrics: string): number {
  return lyrics
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^\[[^\]]+\]$/.test(l)).length;
}
