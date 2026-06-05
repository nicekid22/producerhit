/** Débloque la lecture automatique — utilise un audio dédié pour ne jamais interrompre #pk-audio. */

/** WAV silencieux minimal (~0.01s) — suffit pour enregistrer le geste navigateur. */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

let unlockAudioEl: HTMLAudioElement | null = null;

function ensureUnlockAudio(): HTMLAudioElement | null {
  if (typeof document === "undefined") return null;
  if (unlockAudioEl) return unlockAudioEl;
  const el = document.createElement("audio");
  el.id = "pk-audio-unlock";
  el.preload = "auto";
  el.muted = true;
  el.volume = 0;
  el.src = SILENT_WAV;
  el.className = "hidden";
  el.setAttribute("aria-hidden", "true");
  document.body.appendChild(el);
  unlockAudioEl = el;
  return el;
}

function resumeMainAudioContext() {
  const ctx = (window as unknown as { __pkAudioCtx?: AudioContext }).__pkAudioCtx;
  if (ctx?.state === "suspended") void ctx.resume().catch(() => undefined);
}

/** À appeler sur chaque clic Générer / Play — ré-enregistre le geste utilisateur pour l’autoplay différé. */
export function unlockAudioPlaybackFromGesture(): void {
  resumeMainAudioContext();

  const unlock = ensureUnlockAudio();
  if (!unlock) return;

  unlock.muted = true;
  unlock.volume = 0;
  if (!unlock.src) unlock.src = SILENT_WAV;

  void unlock
    .play()
    .then(() => {
      unlock.pause();
      unlock.currentTime = 0;
      resumeMainAudioContext();
    })
    .catch(() => {
      resumeMainAudioContext();
    });
}

export function resetAudioPlaybackUnlock(): void {
  /* conservé pour compat — le unlock se refait à chaque geste */
}
