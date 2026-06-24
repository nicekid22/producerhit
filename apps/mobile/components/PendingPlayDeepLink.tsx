import { useEffect } from "react";
import { fetchUserLoopById } from "@/lib/loopsApi";
import { fetchCommunityLoopById, prepareCommunityLoopForPlayback } from "@/lib/publicLoopsApi";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useDeepLinkStore } from "@/stores/deepLinkStore";
import { usePlayerStore } from "@/stores/playerStore";

/** Resolves producerhit://play/{id} and starts playback. */
export function PendingPlayDeepLink() {
  const pendingPlayLoopId = useDeepLinkStore((s) => s.pendingPlayLoopId);
  const consumePendingPlayLoopId = useDeepLinkStore((s) => s.consumePendingPlayLoopId);
  const session = useAuthStore((s) => s.session);
  const setCurrent = usePlayerStore((s) => s.setCurrent);
  const setExpanded = usePlayerStore((s) => s.setExpanded);

  useEffect(() => {
    if (!pendingPlayLoopId) return;
    const loopId = consumePendingPlayLoopId();
    if (!loopId) return;

    void (async () => {
      const userId = session?.user?.id;
      let loop = userId ? await fetchUserLoopById(userId, loopId) : null;

      if (!loop) {
        const community = await fetchCommunityLoopById(loopId);
        if (!community) return;
        const {
          data: { session: authSession },
        } = await supabase.auth.getSession();
        const token = authSession?.access_token ?? "";
        loop = await prepareCommunityLoopForPlayback(community, token);
      }

      if (!loop) return;
      setCurrent(loop);
      setExpanded(true);
    })();
  }, [pendingPlayLoopId, consumePendingPlayLoopId, session?.user?.id, setCurrent, setExpanded]);

  return null;
}
