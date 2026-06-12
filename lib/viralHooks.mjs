/** Scroll-stopping hooks + CTAs — sell curiosity, not the AI tool. */

export const SCROLL_HOOKS = [
  "This song didn't exist 20 seconds ago.",
  "I typed one sentence and got this.",
  "I thought this prompt would be trash…",
  "I wasn't ready for the chorus.",
  "Wait for the drop.",
  "This shouldn't sound this good.",
  "Nobody was ready for this.",
  "This didn't exist when you woke up.",
];

export const VIRAL_CTAS = [
  "What would YOUR first song be?",
  "Stop watching ideas. Test yours.",
  "Comment the text you'd turn into a song.",
  "Which comment should I do tomorrow?",
  "Give me the most absurd subject possible.",
  "You already have a prompt in your head.",
  "What would you turn into music?",
  "Comment your idea — best one wins tomorrow.",
  "Which friend would you roast with a song?",
  "Tag someone who needs this as their ringtone.",
  "What text would break your group chat?",
  "Your ex / your boss / your dog — pick one.",
];

export function pickScrollHook(seed) {
  return SCROLL_HOOKS[hash(seed) % SCROLL_HOOKS.length];
}

export function pickViralCta(seed) {
  return VIRAL_CTAS[(hash(seed) + 7) % VIRAL_CTAS.length];
}

function hash(s) {
  let h = 2166136261;
  const str = String(s ?? "x");
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
