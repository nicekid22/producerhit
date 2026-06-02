import { usePlayerStore } from "@/stores/playerStore";

/** Nettoie les stores client après déconnexion (sans import loopsStore → évite cycle avec authStore). */
export async function resetClientSessionStores(): Promise<void> {
  usePlayerStore.setState({
    current: null,
    isPlaying: false,
    progress: 0,
    currentTimeSec: 0,
    durationSec: 0,
    loopEndSec: null,
    queue: [],
    queueIndex: 0,
    queueSource: null,
    seekToPct: null,
  });

  const { useLoopsStore } = await import("@/stores/loopsStore");
  useLoopsStore.getState().clear();
}
