import type { GenerateParams } from "@/lib/promptBuilder";
import { generateLoop as generateViaEdge } from "@/lib/audioApi";
import { generateLoopHeartMuLaLocal } from "@/lib/heartmulaLocalApi";

export type AudioEngine = "sonauto-edge" | "heartmula-local";

export async function generateAudio(params: GenerateParams): Promise<string> {
  const engine = (import.meta.env.VITE_AUDIO_ENGINE as AudioEngine | undefined) ?? "sonauto-edge";
  if (engine === "heartmula-local") return generateLoopHeartMuLaLocal(params);
  return generateViaEdge(params);
}
