/** Débloque la lecture automatique tant que le geste utilisateur (clic Générer / Play) est encore valide. */
let gestureUnlockDone = false;

export function unlockAudioPlaybackFromGesture(): void {
  if (gestureUnlockDone) return;
  const audio = document.getElementById("pk-audio") as HTMLAudioElement | null;
  if (!audio) return;
  audio.muted = true;
  void audio
    .play()
    .then(() => {
      audio.pause();
      audio.muted = false;
      gestureUnlockDone = true;
      const ctx = (window as unknown as { __pkAudioCtx?: AudioContext }).__pkAudioCtx;
      if (ctx?.state === "suspended") void ctx.resume().catch(() => undefined);
    })
    .catch(() => {
      audio.muted = false;
    });
}

export function resetAudioPlaybackUnlock(): void {
  gestureUnlockDone = false;
}
