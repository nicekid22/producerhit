import { buildCoverGenerationSeed, buildLoopCardCoverPrompt } from "@producerhit/shared";
import { preloadCoverImage } from "@/lib/coverArt";
import { coverImageSeed, hashString } from "@/lib/utils";

type PrefetchData = {
  genre: string;
  mood: string;
  influence: string;
  prompt: string;
  name: string;
  seed?: number;
};

const prefetchCache = new Map<string, Promise<string | null>>();

function buildPromptAndSeed(data: PrefetchData, generationKey: string): { prompt: string; seed: number } {
  const fakeLoop = {
    id: generationKey,
    genre: data.genre,
    mood: data.mood,
    influence: data.influence,
    name: data.name,
    prompt: data.prompt,
    seed: data.seed ?? 0,
  };
  const prompt = buildLoopCardCoverPrompt(fakeLoop as never);
  const seed = buildCoverGenerationSeed(
    prompt,
    generationKey,
    coverImageSeed(fakeLoop as never),
    hashString(generationKey),
  );
  return { prompt, seed };
}

function buildPollinationsUrl(prompt: string, seed: number, width = 768, height = 768): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${encodeURIComponent(
    String(seed),
  )}&nologo=true&model=flux&enhance=true`;
}

async function fetchPreviewCover(
  generationKey: string,
  prompt: string,
  seed: number,
): Promise<string | null> {
  try {
    const coverUrl = buildPollinationsUrl(prompt, seed, 768, 768);
    if (!coverUrl.startsWith("http")) return null;
    preloadCoverImage(coverUrl);
    return coverUrl;
  } catch {
    return null;
  }
}

/**
 * Lance le téléchargement + upload Storage de la cover en parallèle de l'audio.
 * Utilise un generationKey comme loopId temporaire — l'image sera écrasée par le vrai
 * loopId lors de createLoop (même prompt/seed = même image).
 */
export function startCoverPrefetch(generationKey: string, data: PrefetchData): void {
  if (prefetchCache.has(generationKey)) return;
  const { prompt, seed } = buildPromptAndSeed(data, generationKey);
  const promise = fetchPreviewCover(generationKey, prompt, seed);
  prefetchCache.set(generationKey, promise);
  // Auto-cleanup after 3 minutes to prevent memory leak
  void promise
    .then(() => {})
    .finally(() => {
      if (prefetchCache.get(generationKey) === promise) prefetchCache.delete(generationKey);
    });
}

/**
 * Récupère le résultat du prefetch. Retourne l'URL Storage si prête, null sinon.
 * Supprime l'entrée du cache.
 */
export async function consumeCoverPrefetch(generationKey: string): Promise<string | null> {
  const promise = prefetchCache.get(generationKey);
  if (!promise) return null;
  prefetchCache.delete(generationKey);
  try {
    const url = await promise;
    return url;
  } catch {
    return null;
  }
}
