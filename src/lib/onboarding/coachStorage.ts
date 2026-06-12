const STORAGE_PREFIX = "producerhit_coach_v1";

export type CoachProgress = {
  tourDone: boolean;
  postGenDone: boolean;
  firstGenCelebrated: boolean;
  dismissedAt?: string;
};

const DEFAULT: CoachProgress = {
  tourDone: false,
  postGenDone: false,
  firstGenCelebrated: false,
};

function key(userId: string): string {
  return `${STORAGE_PREFIX}_${userId}`;
}

export function loadCoachProgress(userId: string): CoachProgress {
  try {
    const raw = window.localStorage.getItem(key(userId));
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<CoachProgress>;
    return {
      tourDone: Boolean(parsed.tourDone),
      postGenDone: Boolean(parsed.postGenDone),
      firstGenCelebrated: Boolean(parsed.firstGenCelebrated),
      dismissedAt: parsed.dismissedAt,
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveCoachProgress(userId: string, patch: Partial<CoachProgress>): CoachProgress {
  const next = { ...loadCoachProgress(userId), ...patch };
  try {
    window.localStorage.setItem(key(userId), JSON.stringify(next));
  } catch {
    void 0;
  }
  return next;
}

export function shouldShowCoachTour(userId: string, loopsUsedThisMonth: number): boolean {
  const p = loadCoachProgress(userId);
  if (p.tourDone || p.dismissedAt) return false;
  return loopsUsedThisMonth <= 0;
}

export function shouldShowPostGenCoach(userId: string): boolean {
  const p = loadCoachProgress(userId);
  return p.tourDone && !p.postGenDone && !p.firstGenCelebrated;
}
