function parseStemsUrl(stemsUrl: unknown): Record<string, unknown> | null {
  if (!stemsUrl || typeof stemsUrl !== "object") return null;
  return stemsUrl as Record<string, unknown>;
}

export function extractAceTaskId(stemsUrl: unknown): string {
  const obj = parseStemsUrl(stemsUrl);
  if (!obj) return "";

  const rootTaskId = obj.taskId ?? obj.task_id ?? obj.ace_task_id;
  if (typeof rootTaskId === "string" && rootTaskId.trim()) return rootTaskId.trim();

  const ace = obj.ace;
  if (!ace || typeof ace !== "object") return "";
  const taskId = (ace as Record<string, unknown>).taskId ?? (ace as Record<string, unknown>).task_id;
  return typeof taskId === "string" ? taskId.trim() : "";
}

export function isHttpAudioUrl(url: unknown): url is string {
  const s = typeof url === "string" ? url.trim() : "";
  return !!s && (s.startsWith("https://") || s.startsWith("http://"));
}

export function buildStemsUrlForDb(
  inputStemsUrl: unknown,
  details: {
    caption?: string;
    lyrics?: string;
    bpm?: number | null;
    duration?: number | null;
    keyScale?: string;
    timeSignature?: string;
    audioFormat?: string | null;
    coverPrompt?: string;
    coverUrl?: string;
    httpAudioUrl?: string;
  } | null,
): Record<string, unknown> | null {
  const taskIdFromInput = extractAceTaskId(inputStemsUrl);
  const base = inputStemsUrl && typeof inputStemsUrl === "object" ? (inputStemsUrl as Record<string, unknown>) : {};
  const existingAce =
    base.ace && typeof base.ace === "object" && base.ace !== null ? (base.ace as Record<string, unknown>) : {};

  if (!details && !taskIdFromInput && !Object.keys(existingAce).length) {
    return Object.keys(base).length ? base : null;
  }

  const ace: Record<string, unknown> = { ...existingAce, ...(details ?? {}) };
  const httpFromDetails = typeof details?.httpAudioUrl === "string" ? details.httpAudioUrl.trim() : "";
  if (isHttpAudioUrl(httpFromDetails)) ace.httpAudioUrl = httpFromDetails;
  delete ace.providerDataUrl;
  const taskId =
    (typeof existingAce.taskId === "string" && existingAce.taskId.trim()) ||
    (typeof existingAce.task_id === "string" && existingAce.task_id.trim()) ||
    taskIdFromInput;
  if (taskId) {
    ace.taskId = taskId;
    delete ace.task_id;
  }

  return { ...base, ace };
}

export function buildAceStemsFromMeta(
  meta: { taskId?: string; task_id?: string; httpAudioUrl?: string; stemsZipUrl?: string } | null | undefined,
  audioUrl: string,
): Record<string, unknown> | null {
  const taskId =
    (typeof meta?.taskId === "string" && meta.taskId.trim()) ||
    (typeof meta?.task_id === "string" && meta.task_id.trim()) ||
    "";
  const httpAudioUrl =
    (typeof meta?.httpAudioUrl === "string" && meta.httpAudioUrl.trim()) ||
    (audioUrl.startsWith("http") ? audioUrl.trim() : "");
  if (!taskId && !httpAudioUrl) return null;
  return {
    ace: {
      ...(taskId ? { taskId } : {}),
      ...(httpAudioUrl.startsWith("http") ? { httpAudioUrl } : {}),
      ...(typeof meta?.stemsZipUrl === "string" && meta.stemsZipUrl.trim() ? { stemsZipUrl: meta.stemsZipUrl.trim() } : {}),
    },
  };
}
