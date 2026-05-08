import type { GenerateParams } from "@/lib/promptBuilder";
import { buildRichPrompt } from "@/lib/promptBuilder";

export async function generateLoopHeartMuLaLocal(params: GenerateParams): Promise<string> {
  const prompt = buildRichPrompt(params);
  const durationSeconds = Math.round((params.loopLengthBars * 4 * 60) / params.bpm);
  const duration = Math.min(Math.max(durationSeconds, 5), 60);

  const baseUrl = (import.meta.env.VITE_HEARTMULA_LOCAL_URL as string | undefined) ?? "http://localhost:8008";

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      duration,
      tags: `${params.genre},${params.mood},${params.influence},instrumental,beat`,
      lyrics: "[Verse]\n(instrumental)\n",
    }),
  });

  const data = (await res.json().catch(() => null)) as { audioUrl?: string; error?: string; detail?: unknown } | null;
  if (!res.ok) {
    const msg =
      (typeof data?.detail === "string" && data.detail) ||
      (typeof data?.error === "string" && data.error) ||
      (data?.detail ? JSON.stringify(data.detail) : null) ||
      `HeartMuLa local server error (${res.status})`;
    throw new Error(msg);
  }
  if (!data?.audioUrl) throw new Error("No audioUrl returned from HeartMuLa local server");
  return data.audioUrl;
}
