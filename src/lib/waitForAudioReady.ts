/** Attend que l’URL audio soit suffisamment bufferisée avant lecture (évite le « flash » puis silence). */
export function waitForAudioReady(
  url: string,
  options?: { timeoutMs?: number },
): Promise<boolean> {
  const trimmed = url.trim();
  if (!trimmed) return Promise.resolve(false);

  const timeoutMs = options?.timeoutMs ?? 20_000;

  return new Promise((resolve) => {
    const audio = new Audio();
    let settled = false;

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      audio.removeEventListener("canplaythrough", onReady);
      audio.removeEventListener("error", onError);
      audio.src = "";
      audio.load();
      resolve(ok);
    };

    const onReady = () => finish(true);
    const onError = () => finish(false);
    const timer = window.setTimeout(() => finish(false), timeoutMs);

    audio.preload = "auto";
    audio.addEventListener("canplaythrough", onReady, { once: true });
    audio.addEventListener("error", onError, { once: true });
    if (trimmed.startsWith("http")) {
      audio.crossOrigin = "anonymous";
    }
    audio.src = trimmed;
    audio.load();
  });
}
