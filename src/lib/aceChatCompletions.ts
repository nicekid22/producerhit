/** Parse ACE /v1/chat/completions — préfère URL HTTP + taskId pour persistance cross-device (sans Storage). */

export function buildAceAudioUrlFromPath(baseUrl: string, filePath: string): string {
  const t = filePath.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const base = baseUrl.replace(/\/$/, "");
  if (t.startsWith("/v1/audio?path=")) return `${base}${t}`;
  if (t.startsWith("v1/audio?path=")) return `${base}/${t}`;
  if (t.startsWith("/")) return `${base}/v1/audio?path=${encodeURIComponent(t)}`;
  return `${base}/v1/audio?path=${encodeURIComponent(t)}`;
}

function asTrimmedString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function isSafeAceTaskId(tid: string): boolean {
  return !!tid && tid === tid.replace(/[^a-zA-Z0-9_-]/g, "");
}

function pickTaskId(...sources: unknown[]): string {
  for (const s of sources) {
    const t = asTrimmedString(s);
    if (isSafeAceTaskId(t)) return t;
  }
  return "";
}

function pickFilePath(obj: Record<string, unknown> | null): string {
  if (!obj) return "";
  for (const key of ["file", "path", "audio_path", "file_path", "audioPath"]) {
    const v = asTrimmedString(obj[key]);
    if (v && !v.startsWith("data:")) return v;
  }
  const audioUrl = obj.audio_url;
  if (audioUrl && typeof audioUrl === "object" && audioUrl !== null) {
    const au = audioUrl as Record<string, unknown>;
    const url = asTrimmedString(au.url);
    if (url && !url.startsWith("data:")) {
      if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/") || url.includes("/")) {
        return url;
      }
    }
    for (const key of ["path", "file"]) {
      const v = asTrimmedString(au[key]);
      if (v && !v.startsWith("data:")) return v;
    }
  }
  return "";
}

export type AceChatParseResult = {
  audioUrl: string;
  httpAudioUrl: string | null;
  taskId: string | null;
  sessionOnly: boolean;
};

function parseAceChatAudioEntry(
  audioEntry: Record<string, unknown> | null,
  msg: Record<string, unknown> | null,
  baseUrl: string,
  taskIdSources: unknown[],
): AceChatParseResult {
  const taskId = pickTaskId(...taskIdSources, audioEntry?.task_id, audioEntry?.taskId) || null;
  const pathCandidate = pickFilePath(audioEntry) || pickFilePath(msg);
  const directAudioUrl =
    asTrimmedString(audioEntry?.url) ||
    (typeof audioEntry?.audio_url === "string" ? asTrimmedString(audioEntry.audio_url) : "");
  const audioUrlRaw =
    directAudioUrl.startsWith("http") || directAudioUrl.startsWith("data:")
      ? directAudioUrl
      : audioEntry && typeof audioEntry.audio_url === "object" && audioEntry.audio_url !== null
        ? asTrimmedString((audioEntry.audio_url as { url?: unknown }).url)
        : "";

  let httpAudioUrl: string | null = null;
  if (audioUrlRaw.startsWith("http://") || audioUrlRaw.startsWith("https://")) {
    httpAudioUrl = audioUrlRaw;
  } else if (pathCandidate) {
    const built = buildAceAudioUrlFromPath(baseUrl, pathCandidate);
    if (built.startsWith("http")) httpAudioUrl = built;
  } else if (audioUrlRaw && !audioUrlRaw.startsWith("data:")) {
    const built = buildAceAudioUrlFromPath(baseUrl, audioUrlRaw);
    if (built.startsWith("http")) httpAudioUrl = built;
  }

  const dataUrl = audioUrlRaw.startsWith("data:") ? audioUrlRaw : "";
  const playbackUrl =
    httpAudioUrl ||
    dataUrl ||
    (pathCandidate ? buildAceAudioUrlFromPath(baseUrl, pathCandidate) : "") ||
    "";

  return { audioUrl: playbackUrl, httpAudioUrl, taskId, sessionOnly: !httpAudioUrl && !taskId };
}

/** Tous les audios renvoyés (batch_size > 1 sur chat/completions ou release_task). */
export function parseAllAceChatCompletionsAudios(json: unknown, baseUrl: string): AceChatParseResult[] {
  const root = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const dataObj = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null;
  const choices = root.choices;
  const firstChoice = Array.isArray(choices) ? choices[0] : null;
  const choiceObj =
    firstChoice && typeof firstChoice === "object" && firstChoice !== null ? (firstChoice as Record<string, unknown>) : null;
  const msg =
    choiceObj?.message && typeof choiceObj.message === "object" && choiceObj.message !== null
      ? (choiceObj.message as Record<string, unknown>)
      : null;
  const audioArr = msg && Array.isArray(msg.audio) ? (msg.audio as unknown[]) : [];
  const taskIdSources = [
    root.task_id,
    root.taskId,
    root.id,
    dataObj?.task_id,
    dataObj?.taskId,
    choiceObj?.task_id,
    choiceObj?.taskId,
    msg?.task_id,
    msg?.taskId,
  ];

  const out: AceChatParseResult[] = [];
  for (const item of audioArr) {
    if (!item || typeof item !== "object") continue;
    const parsed = parseAceChatAudioEntry(item as Record<string, unknown>, msg, baseUrl, taskIdSources);
    if (parsed.audioUrl.trim()) out.push(parsed);
  }
  if (out.length) return out;
  const single = parseAceChatCompletionsResponse(json, baseUrl);
  return single.audioUrl.trim() ? [single] : [];
}

export function parseAceChatCompletionsResponse(json: unknown, baseUrl: string): AceChatParseResult {
  const root = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const dataObj = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null;

  const choices = root.choices;
  const firstChoice = Array.isArray(choices) ? choices[0] : null;
  const choiceObj =
    firstChoice && typeof firstChoice === "object" && firstChoice !== null ? (firstChoice as Record<string, unknown>) : null;
  const messageObj = choiceObj?.message;
  const msg = messageObj && typeof messageObj === "object" && messageObj !== null ? (messageObj as Record<string, unknown>) : null;

  const audioArr = msg && Array.isArray(msg.audio) ? (msg.audio as unknown[]) : [];
  const firstAudio =
    audioArr[0] && typeof audioArr[0] === "object" && audioArr[0] !== null ? (audioArr[0] as Record<string, unknown>) : null;

  const taskId =
    pickTaskId(
      root.task_id,
      root.taskId,
      root.id,
      dataObj?.task_id,
      dataObj?.taskId,
      choiceObj?.task_id,
      choiceObj?.taskId,
      msg?.task_id,
      msg?.taskId,
      firstAudio?.task_id,
      firstAudio?.taskId,
    ) || null;

  const pathCandidate = pickFilePath(firstAudio) || pickFilePath(msg);
  const directAudioUrl =
    asTrimmedString(firstAudio?.url) ||
    (typeof firstAudio?.audio_url === "string" ? asTrimmedString(firstAudio.audio_url) : "");
  const audioUrlRaw =
    directAudioUrl.startsWith("http") || directAudioUrl.startsWith("data:")
      ? directAudioUrl
      : firstAudio && typeof firstAudio.audio_url === "object" && firstAudio.audio_url !== null
        ? asTrimmedString((firstAudio.audio_url as { url?: unknown }).url)
        : "";

  let httpAudioUrl: string | null = null;
  if (audioUrlRaw.startsWith("http://") || audioUrlRaw.startsWith("https://")) {
    httpAudioUrl = audioUrlRaw;
  } else if (pathCandidate) {
    const built = buildAceAudioUrlFromPath(baseUrl, pathCandidate);
    if (built.startsWith("http")) httpAudioUrl = built;
  } else if (audioUrlRaw && !audioUrlRaw.startsWith("data:")) {
    const built = buildAceAudioUrlFromPath(baseUrl, audioUrlRaw);
    if (built.startsWith("http")) httpAudioUrl = built;
  }

  const dataUrl = audioUrlRaw.startsWith("data:") ? audioUrlRaw : "";
  const playbackUrl =
    httpAudioUrl ||
    dataUrl ||
    (pathCandidate ? buildAceAudioUrlFromPath(baseUrl, pathCandidate) : "") ||
    "";

  const sessionOnly = !httpAudioUrl && !taskId;

  return { audioUrl: playbackUrl, httpAudioUrl, taskId, sessionOnly };
}
