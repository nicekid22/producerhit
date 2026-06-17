import { supabase } from "@/lib/supabaseClient";
import {
  loadGamification,
  saveGamificationFromServer,
  type GamificationState,
} from "@/lib/gamification";

type SyncResult = {
  ok: boolean;
  state?: GamificationState;
};

function parseSyncResult(data: unknown): SyncResult {
  const row = data as {
    ok?: boolean;
    xp?: number;
    streak?: number;
    last_visit_ymd?: string | null;
  } | null;
  if (!row?.ok) return { ok: false };

  const local = loadGamification();
  const merged = saveGamificationFromServer({
    xp: typeof row.xp === "number" ? row.xp : local.xp,
    streak: typeof row.streak === "number" ? row.streak : local.streak,
    lastVisitYmd: typeof row.last_visit_ymd === "string" ? row.last_visit_ymd : local.lastVisitYmd,
  });

  return { ok: true, state: merged };
}

/** Fusionne l'état local avec le serveur (max XP / streak). */
export async function pushGamificationToServer(state = loadGamification()): Promise<SyncResult> {
  try {
    const { data, error } = await supabase.rpc("sync_gamification_state", {
      p_xp: state.xp,
      p_streak: state.streak,
      p_last_visit_ymd: state.lastVisitYmd || null,
    });
    if (error) return { ok: false };
    return parseSyncResult(data);
  } catch {
    return { ok: false };
  }
}

/** Au login : récupère XP serveur et fusionne avec local. */
export async function hydrateGamificationFromServer(): Promise<GamificationState> {
  const local = loadGamification();
  const pushed = await pushGamificationToServer(local);
  return pushed.state ?? local;
}
