import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDeepLinkStore } from "@/stores/deepLinkStore";

/** Route: producerhit://play/{id} */
export default function PlayDeepLinkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    const loopId = typeof id === "string" ? id.trim() : "";
    if (!loopId) return;
    useDeepLinkStore.getState().setPendingPlayLoopId(loopId);
    router.replace("/(tabs)/create");
  }, [id, router]);

  return null;
}
