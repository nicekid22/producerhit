import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDeepLinkStore } from "@/stores/deepLinkStore";

/** Route handler: producerhit://loop/{id} or /loop/{id} */
export default function LoopDeepLinkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    const loopId = typeof id === "string" ? id.trim() : "";
    if (!loopId) return;
    useDeepLinkStore.getState().setPendingLoopId(loopId);
    router.replace("/(tabs)/community");
  }, [id, router]);

  return null;
}
