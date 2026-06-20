/** ACE-Step 1.5 XL — genre dice: ~8–14 comma tags (genre + instruments + mood + mix). */
export const ACE_DICE_CAPTION_MAX = 280;

export function formatAceDiceCaption(raw: string): string {
  const t = raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/,\s*,+/g, ", ")
    .replace(/,\s*$/g, "")
    .trim();
  if (t.length <= ACE_DICE_CAPTION_MAX) return t;
  return t.slice(0, ACE_DICE_CAPTION_MAX).replace(/[,\s]+$/g, "").trim();
}
