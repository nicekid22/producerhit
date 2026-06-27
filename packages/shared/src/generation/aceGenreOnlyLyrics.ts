/** Chanson sans paroles utilisateur — le LM compose via chat/completions (pas de squelette). */
export function isAiComposeSongRequest(args: { instrumental: boolean; lyrics: string }): boolean {
  return !args.instrumental && !args.lyrics.trim();
}
