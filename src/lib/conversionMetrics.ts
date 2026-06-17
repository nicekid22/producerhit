import { trackClientEvent } from "@/lib/supabaseClient";

const MILESTONE_KEY = "producerhit_free_gen_milestones_v1";

function readMilestones(): Set<number> {
  try {
    const raw = window.localStorage.getItem(MILESTONE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((n): n is number => typeof n === "number"));
  } catch {
    return new Set();
  }
}

function writeMilestones(set: Set<number>): void {
  try {
    window.localStorage.setItem(MILESTONE_KEY, JSON.stringify([...set].slice(-20)));
  } catch {
    // ignore
  }
}

/** Milestones free plan pour mesurer activation → friction paywall. */
export function trackFreeGenerationMilestones(
  args: {
    plan: string;
    usedAfterGen: number;
    loopId: string;
    mode: string;
    source: string;
  },
  hooks?: {
    onMilestone?: (milestone: number) => void;
    onQuotaExhausted?: () => void;
  },
): void {
  if (args.plan !== "free") return;

  const fired = readMilestones();
  const milestones = [1, 4, 8, 10];
  for (const m of milestones) {
    if (args.usedAfterGen >= m && !fired.has(m)) {
      fired.add(m);
      trackClientEvent(`free_gen_${m}`, {
        loop_id: args.loopId,
        mode: args.mode,
        source: args.source,
        used: args.usedAfterGen,
      });
      hooks?.onMilestone?.(m);
    }
  }
  writeMilestones(fired);

  if (args.usedAfterGen >= 10) {
    trackClientEvent("free_quota_exhausted", {
      loop_id: args.loopId,
      mode: args.mode,
      source: args.source,
    });
    hooks?.onQuotaExhausted?.();
  }
}
