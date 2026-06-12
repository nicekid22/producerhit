/** Three repeatable Shorts series — recognizable formats, not one-off videos. */

export const VIRAL_SERIES = {
  comment_to_song: {
    id: "comment_to_song",
    slot: "morning",
    label: "Comment → Song",
    defaultHookOpen: "Someone asked for this.",
    revealPrefix: "Prompt:",
    weight: 70,
  },
  absurd_to_song: {
    id: "absurd_to_song",
    slot: "afternoon",
    label: "Shouldn't Be a Song",
    defaultHookOpen: "This shouldn't be a song.",
    revealPrefix: "Original text:",
    weight: 20,
  },
  guess_prompt: {
    id: "guess_prompt",
    slot: "evening",
    label: "Guess the Prompt",
    defaultHookOpen: "Guess the prompt.",
    revealPrefix: "The prompt was:",
    weight: 10,
  },
};

export const VIRAL_SLOTS = ["morning", "afternoon", "evening"];

export function seriesForSlot(slot) {
  return Object.values(VIRAL_SERIES).find((s) => s.slot === slot)?.id ?? "comment_to_song";
}

export function slotForSeries(seriesId) {
  return VIRAL_SERIES[seriesId]?.slot ?? "morning";
}
