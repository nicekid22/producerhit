import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-region",
};

const LIMITS = { free: 10, pro: 75, studio: 250 } as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function asNumber(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function clampNumber(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function computeRequestedDurationSec(input: {
  instrumental: boolean;
  durationRaw: number | null;
  bpm: number | null;
  bars: number | null;
}) {
  if (!input.instrumental) {
    const base = input.durationRaw ?? 90;
    return clampNumber(base, 10, 120);
  }
  if (input.durationRaw != null) return clampNumber(input.durationRaw, 10, 120);
  return 90;
}

const ACE_AUDIO_ORIGIN = "https://api.acemusic.ai";
const ACE_TASK_API_BASE = "https://acem-api.acemusic.ai/api/acem";

function normalizeStoredAceAudioUrl(url: string) {
  try {
    const u = new URL(url);
    const idx = u.pathname.indexOf("/v1/audio");
    if (idx >= 0) return `${ACE_AUDIO_ORIGIN}${u.pathname.slice(idx)}${u.search}`;
  } catch {
    // ignore
  }
  return url;
}

function buildAceAudioUrl(maybePath: string) {
  const t = maybePath.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return normalizeStoredAceAudioUrl(t);
  if (t.startsWith("/v1/audio?path=")) return `${ACE_AUDIO_ORIGIN}${t}`;
  if (t.startsWith("v1/audio?path=")) return `${ACE_AUDIO_ORIGIN}/${t}`;
  if (t.startsWith("/")) return `${ACE_AUDIO_ORIGIN}/v1/audio?path=${encodeURIComponent(t.replace(/^\//, ""))}`;
  return `${ACE_AUDIO_ORIGIN}/v1/audio?path=${encodeURIComponent(t)}`;
}

function toAbsoluteUrl(baseUrl: string, maybePath: string) {
  const t = maybePath.trim();
  if (!t) return "";
  if (t.includes("/v1/audio") || t.startsWith("v1/audio")) return buildAceAudioUrl(t);
  if (t.startsWith("http://") || t.startsWith("https://")) return normalizeStoredAceAudioUrl(t);
  if (t.startsWith("/")) return `${baseUrl}${t}`;
  return `${baseUrl}/${t}`;
}

function isHttpUrl(v: unknown): v is string {
  const s = typeof v === "string" ? v.trim() : "";
  return !!s && (s.startsWith("https://") || s.startsWith("http://"));
}

function pickStemsZipUrl(baseUrl: string, firstObj: Record<string, unknown> | null, metasObj: Record<string, unknown> | null) {
  const candidates: unknown[] = [];
  if (firstObj) {
    candidates.push(
      firstObj.stemsZipUrl,
      firstObj.stems_zip_url,
      firstObj.stems_zip,
      firstObj.stems_url,
      firstObj.stemsUrl,
      firstObj.zipUrl,
      firstObj.zip_url,
      firstObj.zip,
      firstObj.archiveUrl,
      firstObj.archive_url,
      firstObj.archive,
    );
  }
  if (metasObj) {
    candidates.push(
      metasObj.stemsZipUrl,
      metasObj.stems_zip_url,
      metasObj.stems_zip,
      metasObj.stems_url,
      metasObj.stemsUrl,
      metasObj.zipUrl,
      metasObj.zip_url,
      metasObj.zip,
      metasObj.archiveUrl,
      metasObj.archive_url,
      metasObj.archive,
    );
  }

  for (const c of candidates) {
    if (typeof c !== "string") continue;
    const abs = toAbsoluteUrl(baseUrl, c);
    if (!abs) continue;
    const lower = abs.toLowerCase();
    if (lower.includes(".zip") || lower.includes("stem") || lower.includes("stems")) return abs;
  }
  for (const c of candidates) {
    if (typeof c !== "string") continue;
    const abs = toAbsoluteUrl(baseUrl, c);
    if (isHttpUrl(abs)) return abs;
  }
  return "";
}

async function readTextSafe(res: Response) {
  return await res.text().catch(() => "");
}

function redactAiToken(body: Record<string, unknown>) {
  if (!("ai_token" in body)) return body;
  return { ...body, ai_token: "[redacted]" };
}

function normalizeAceBaseUrl(baseUrlRaw: string) {
  const trimmed = baseUrlRaw.trim().replace(/\/$/, "");
  if (!trimmed) return ACE_TASK_API_BASE;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    if (host === "acem-api.acemusic.ai") {
      return trimmed.includes("/api/acem") ? trimmed.replace(/\/$/, "") : ACE_TASK_API_BASE;
    }
    if (host === "acemusic.ai" || host === "api.acemusic.ai") return ACE_TASK_API_BASE;
  } catch {
    // ignore
  }
  return trimmed;
}

function splitEnvList(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function loadAceApiKeys(): string[] {
  const list = splitEnvList(Deno.env.get("ACE_STEP_API_KEYS") ?? "");
  if (list.length) return list;
  const out: string[] = [];
  const k1 = (Deno.env.get("ACE_STEP_API_KEY") ?? "").trim();
  if (k1) out.push(k1);
  for (let i = 2; i <= 6; i++) {
    const ki = (Deno.env.get(`ACE_STEP_API_KEY_${i}`) ?? "").trim();
    if (ki) out.push(ki);
  }
  return out;
}

function loadAceBaseUrls(): string[] {
  const list = splitEnvList(Deno.env.get("ACE_STEP_BASE_URLS") ?? "").map(normalizeAceBaseUrl);
  if (list.length) return list;
  const out: string[] = [];
  const b1 = normalizeAceBaseUrl((Deno.env.get("ACE_STEP_BASE_URL") ?? "https://api.acemusic.ai").trim());
  if (b1) out.push(b1);
  for (let i = 2; i <= 6; i++) {
    const biRaw = (Deno.env.get(`ACE_STEP_BASE_URL_${i}`) ?? "").trim();
    if (!biRaw) continue;
    const bi = normalizeAceBaseUrl(biRaw);
    if (bi) out.push(bi);
  }
  return out.length ? out : [ACE_TASK_API_BASE];
}

function hashToIndex(input: string, mod: number) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return mod > 0 ? h % mod : 0;
}

function getAceTargets(seedKey: string): Array<{ apiKey: string; baseUrl: string }> {
  const keys = loadAceApiKeys();
  if (!keys.length) return [];
  const bases = loadAceBaseUrls();
  const slots = Math.max(keys.length, bases.length);
  const targets: Array<{ apiKey: string; baseUrl: string }> = [];
  for (let i = 0; i < slots; i++) {
    const apiKey = keys[i % keys.length]!;
    const baseUrl = bases[i % bases.length]!;
    targets.push({ apiKey, baseUrl });
  }
  const start = hashToIndex(seedKey, targets.length);
  return [...targets.slice(start), ...targets.slice(0, start)];
}

async function attemptChatCompletions(args: {
  apiKey: string;
  prompt: string;
  lyrics: string;
  instrumental: boolean;
  bpm: number | null;
  keyScale: string;
  timeSignature: string;
  duration: number;
  audioFormat: string;
  signal: AbortSignal;
}): Promise<{ audioUrl: string; meta: Record<string, unknown> }> {
  const parts = [args.prompt.trim()];
  if (args.instrumental) {
    parts.push("Instrumental beat. No lead singing and no rapped verses. Avoid intelligible lyrics or spoken words.");
  } else if (args.lyrics.trim()) {
    parts.push(`Lyrics:\n${args.lyrics.trim()}`);
  }
  if (args.bpm && args.bpm > 0) parts.push(`BPM: ${args.bpm}.`);
  if (args.keyScale.trim()) parts.push(`Key: ${args.keyScale.trim()}.`);
  if (args.timeSignature.trim()) parts.push(`Time signature: ${args.timeSignature.trim()}.`);

  const res = await fetch(`${ACE_AUDIO_ORIGIN}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: "acemusic/acestep-v1.5-turbo",
      messages: [{ role: "user", content: parts.filter(Boolean).join("\n\n") }],
      lyrics: args.instrumental ? "[instrumental]" : args.lyrics.trim() || "[instrumental]",
      task_type: "text2music",
      audio_config: {
        instrumental: args.instrumental,
        duration: args.duration,
        bpm: args.bpm && args.bpm > 0 ? args.bpm : null,
        key_scale: args.keyScale.trim() || null,
        time_signature: args.timeSignature.trim() || null,
        format: args.audioFormat,
        audio_format: args.audioFormat,
      },
      stream: false,
    }),
    signal: args.signal,
  });
  const text = await readTextSafe(res);
  if (!res.ok) throw new Error(`ACE API chat/completions failed (${res.status}): ${text}`);

  const json = JSON.parse(text) as unknown;
  const choices = (json as { choices?: unknown } | null)?.choices;
  const firstChoice = Array.isArray(choices) ? choices[0] : null;
  const messageObj =
    firstChoice && typeof firstChoice === "object" && firstChoice !== null
      ? (firstChoice as { message?: unknown }).message
      : null;
  const audioArr =
    messageObj && typeof messageObj === "object" && messageObj !== null && Array.isArray((messageObj as { audio?: unknown }).audio)
      ? ((messageObj as { audio: unknown[] }).audio as unknown[])
      : [];
  const firstAudio = audioArr[0] && typeof audioArr[0] === "object" && audioArr[0] !== null ? (audioArr[0] as Record<string, unknown>) : null;
  const audioUrlRaw =
    firstAudio && typeof firstAudio.audio_url === "object" && firstAudio.audio_url !== null
      ? ((firstAudio.audio_url as { url?: unknown }).url as unknown)
      : null;
  const audioUrlStr = typeof audioUrlRaw === "string" ? audioUrlRaw : "";
  const audioUrl = audioUrlStr.startsWith("data:") ? audioUrlStr : buildAceAudioUrl(audioUrlStr);
  if (!audioUrl) throw new Error("ACE API returned no audio");

  return {
    audioUrl,
    meta: {
      prompt: args.prompt,
      lyrics: args.instrumental ? "" : args.lyrics,
      bpm: args.bpm,
      duration: args.duration,
      keyScale: args.keyScale || null,
      timeSignature: args.timeSignature || null,
      audioFormat: args.audioFormat,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    let useIdempotentUsage = false;
    let authedSupabase: ReturnType<typeof createClient> | null = null;
    let authedUserId: string | null = null;
    let authedPlan: "free" | "pro" | "studio" = "free";
    const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").trim();
    const supabaseAnonKey = (Deno.env.get("SUPABASE_ANON_KEY") ?? "").trim();
    const supabaseServiceRoleKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
    const lookupSupabase =
      supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey)
        ? createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, { auth: { persistSession: false } })
        : null;

    const body = (await req.json().catch(() => ({}))) as {
      action?: unknown;
      generationKey?: unknown;
      generation_key?: unknown;
      taskId?: unknown;
      task_id?: unknown;
      caption?: unknown;
      sampleQuery?: unknown;
      sample_query?: unknown;
      description?: unknown;
      desc?: unknown;
      bpm?: unknown;
      keyScale?: unknown;
      duration?: unknown;
      loopLengthBars?: unknown;
      seed?: unknown;
      lyrics?: unknown;
      instrumental?: unknown;
      vocalLanguage?: unknown;
      timeSignature?: unknown;
      useFormat?: unknown;
      thinking?: unknown;
      sampleMode?: unknown;
      audioFormat?: unknown;
      audio_format?: unknown;
    };

    const action = String(body?.action ?? "generate");
    const generationKey = asString(body?.generationKey) || asString(body?.generation_key);
    const taskIdInput = asString(body?.taskId) || asString(body?.task_id);

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const url = supabaseUrl;
      const key = supabaseAnonKey;
      if (!url || !key) {
        console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
      } else {
        const supabase = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
        authedSupabase = supabase;
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser(token);

        if (authError) {
          console.error("Auth error:", authError.message);
        } else if (user && action !== "format") {
          authedUserId = user.id;
          if (action !== "bump_usage") {
            if (generationKey) {
              const { data: reserveData, error: reserveError } = await supabase.rpc("check_loops_usage_idempotent", {
                p_key: generationKey,
              });
              if (reserveError) {
                console.error("check_loops_usage_idempotent error:", reserveError.message);
              }
              if (!reserveError) {
                type UsageReserveRow = { ok?: unknown; plan?: unknown; used?: unknown; limit?: unknown };
                const row: UsageReserveRow | null = Array.isArray(reserveData)
                  ? ((reserveData[0] as UsageReserveRow | undefined) ?? null)
                  : ((reserveData as UsageReserveRow | null) ?? null);
                const ok = Boolean(row?.ok);
                const plan = (typeof row?.plan === "string" ? row.plan : "free") as string;
                const used = typeof row?.used === "number" ? row.used : 0;
                const limit = typeof row?.limit === "number" ? row.limit : LIMITS.free;
                authedPlan = plan === "studio" ? "studio" : plan === "pro" ? "pro" : "free";
                if (!ok) {
                  return new Response(
                    JSON.stringify({
                      error: `Monthly limit reached (${limit} beats for ${plan} plan). Upgrade to generate more.`,
                      limitReached: true,
                      plan,
                      limit,
                      used,
                    }),
                    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
                  );
                }
                useIdempotentUsage = true;
              }
            }

            if (!generationKey || !useIdempotentUsage) {
              const { error: resetErr } = await supabase.rpc("reset_loops_usage_if_needed");
              if (resetErr) console.error("reset_loops_usage_if_needed error:", resetErr.message);
              const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("plan, loops_used_this_month")
                .eq("id", user.id)
                .single();

              if (profileError) {
                console.error("Profile error:", profileError.message);
              } else {
                const plan = (typeof profile?.plan === "string" ? profile.plan : "free") as string;
                authedPlan = plan === "studio" ? "studio" : plan === "pro" ? "pro" : "free";
                const used = typeof profile?.loops_used_this_month === "number" ? profile.loops_used_this_month : 0;
                const limit = LIMITS[plan as keyof typeof LIMITS] ?? LIMITS.free;
                if (used >= limit) {
                  return new Response(
                    JSON.stringify({
                      error: `Monthly limit reached (${limit} beats for ${plan} plan). Upgrade to generate more.`,
                      limitReached: true,
                      plan,
                      limit,
                    }),
                    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
                  );
                }
              }
            }
          }
        }
      }
    }

    if (action !== "format" && !authedSupabase) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (action !== "format" && !authedUserId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "bump_usage") {
      const { error: bumpErr } = generationKey
        ? await authedSupabase.rpc("bump_loops_usage_idempotent", { p_key: generationKey })
        : await authedSupabase.rpc("bump_loops_usage");
      if (bumpErr) throw new Error(`bump_loops_usage failed: ${bumpErr.message}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const caption = asString(body?.caption);
    const sampleQuery =
      asString(body?.sampleQuery) || asString(body?.sample_query) || asString(body?.description) || asString(body?.desc);
    const lyricsRaw = asString(body?.lyrics);
    const bpm = asNumber(body?.bpm);
    const keyScale = asString(body?.keyScale);
    const duration = asNumber(body?.duration);
    const loopLengthBars = asNumber(body?.loopLengthBars);
    const timeSignature = asString(body?.timeSignature);
    const thinking = typeof body?.thinking === "boolean" ? Boolean(body.thinking) : null;
    const sampleMode = action === "format" ? false : (typeof body?.sampleMode === "boolean" ? Boolean(body.sampleMode) : false);
    const instrumental = body?.instrumental !== false;
    const seed = asNumber(body?.seed);
    const audioFormatRaw = (asString(body?.audioFormat) || asString(body?.audio_format)).trim().toLowerCase();
    const requestedAudioFormat =
      audioFormatRaw === "wav" || audioFormatRaw === "wav32" || audioFormatRaw === "flac" || audioFormatRaw === "mp3" || audioFormatRaw === "aac" || audioFormatRaw === "opus"
        ? audioFormatRaw
        : "mp3";
    const audioFormat = authedPlan === "free" ? "mp3" : requestedAudioFormat;

    console.log("ACE-Step request:", {
      requestId,
      action,
      caption: caption.slice(0, 80),
      sampleQuery: sampleQuery.slice(0, 80),
      bpm,
      keyScale,
      instrumental,
      sampleMode,
      thinking,
      audioFormat,
      seed,
    });

    const seedKey = generationKey || requestId;
    const aceTargets = getAceTargets(seedKey);
    if (!aceTargets.length) throw new Error("ACE_STEP_API_KEY not set");

    if (action === "format") {
      return new Response(
        JSON.stringify({
          caption: caption,
          lyrics: lyricsRaw || "",
          bpm: bpm || null,
          keyScale: keyScale || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "resolve_audio") {
      const tid = taskIdInput.trim();
      if (!tid) throw new Error("Missing taskId");

      if (!authedUserId || !authedSupabase) {
        if (!lookupSupabase) {
          return new Response(JSON.stringify({ error: "Server not configured" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: publicRow, error: publicErr } = await lookupSupabase
          .from("loops")
          .select("id")
          .eq("is_public", true)
          .contains("stems_url", { ace: { taskId: tid } })
          .limit(1)
          .maybeSingle();
        if (publicErr || !publicRow) {
          return new Response(JSON.stringify({ error: "Not allowed" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const seedKey = generationKey || requestId;
      const aceTargets = getAceTargets(seedKey);
      if (!aceTargets.length) throw new Error("ACE_STEP_API_KEY not set");

      const controller = new AbortController();
      const requestTimeoutMs = 25_000;
      const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

      try {
        let audioUrl = "";
        let lastErr: unknown = null;
        for (const t of aceTargets) {
          try {
            const pollUrl = `${t.baseUrl}/query_result`;
            const pollParams = new URLSearchParams();
            pollParams.append("ai_token", t.apiKey);
            pollParams.append("task_id_list", JSON.stringify([tid]));
            pollParams.append("app", "studio-web");
            const pollRes = await fetch(pollUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
              },
              body: pollParams,
              signal: controller.signal,
            });
            const pollText = await readTextSafe(pollRes);
            if (!pollRes.ok) throw new Error(`ACE query_result failed (${pollRes.status}): ${pollText}`);
            const pollJson = JSON.parse(pollText) as unknown;
            const item = Array.isArray((pollJson as { data?: unknown } | null)?.data) ? (pollJson as { data: unknown[] }).data[0] : null;
            const statusNum = item && typeof (item as { status?: unknown }).status === "number" ? ((item as { status: number }).status as number) : 0;
            if (statusNum !== 1) continue;
            const resultStr = asString((item as { result?: unknown } | null)?.result);
            if (!resultStr) continue;
            const results = JSON.parse(resultStr) as unknown;
            const first = Array.isArray(results) ? results[0] : null;
            const file = first && typeof (first as { file?: unknown }).file === "string" ? ((first as { file: string }).file as string) : "";
            audioUrl = toAbsoluteUrl(t.baseUrl, file);
            if (audioUrl) break;
          } catch (e) {
            lastErr = e;
            continue;
          }
        }
        if (!audioUrl) {
          const msg = lastErr instanceof Error ? lastErr.message : "Audio not found";
          throw new Error(msg);
        }
        if (lookupSupabase) {
          await lookupSupabase
            .from("loops")
            .update({ audio_url: audioUrl })
            .eq("is_public", true)
            .contains("stems_url", { ace: { taskId: tid } });
        }
        return new Response(JSON.stringify({ audioUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } finally {
        clearTimeout(timer);
      }
    }

    const effectiveLyrics = instrumental ? (lyricsRaw.trim() || "[Instrumental]") : lyricsRaw.trim();
    const effectivePrompt = (sampleMode ? (sampleQuery.trim() || caption) : caption).trim();
    if (!effectivePrompt) throw new Error("Missing caption");
    const requestedDuration = computeRequestedDurationSec({
      instrumental,
      durationRaw: duration && duration > 0 ? duration : null,
      bpm,
      bars: loopLengthBars,
    });

    const controller = new AbortController();
    const requestTimeoutMs = 150_000;
    const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

    let audioUrl = "";
    let meta: Record<string, unknown> | null = null;

    try {
      const startedAt = Date.now();
      const keyValue = keyScale.trim().length > 0 ? keyScale.trim() : "";
      const attemptOnce = async (apiKey: string, baseUrl: string) => {
        const paramObj: Record<string, unknown> = { duration: requestedDuration };
        if (bpm && bpm > 0) paramObj.bpm = bpm;
        if (timeSignature.trim().length > 0) paramObj.time_signature = timeSignature.trim();
        if (keyValue) paramObj.key = keyValue;
        if (audioFormat) paramObj.audio_format = audioFormat;
        if (seed && seed > 0) paramObj.seed = seed;

        const createUrl = `${baseUrl}/release_task`;
        const releaseForm = new FormData();
        releaseForm.append("env", "production");
        releaseForm.append("ai_token", apiKey);
        releaseForm.append("prompt", effectivePrompt);
        releaseForm.append("lyrics", effectiveLyrics);
        releaseForm.append("model_name", "acestep-v15-xl-turbo");
        releaseForm.append("app", "studio-web");
        releaseForm.append("param_obj", JSON.stringify(paramObj));
        console.log("ACE release_task request", {
          requestId,
          method: "POST",
          url: createUrl,
          headers: { Accept: "application/json" },
          body: redactAiToken({
            env: "production",
            ai_token: apiKey,
            prompt: effectivePrompt,
            lyrics: effectiveLyrics,
            model_name: "acestep-v15-xl-turbo",
            app: "studio-web",
            param_obj: paramObj,
          }),
        });

        const createRes = await fetch(createUrl, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: releaseForm,
          signal: controller.signal,
        });
        const createText = await readTextSafe(createRes);
        console.log("ACE release_task response", { requestId, status: createRes.status, ok: createRes.ok, body: createText });
        if (!createRes.ok) {
          const err = new Error(`ACE API release_task failed (${createRes.status}): ${createText}`) as Error & { status?: number };
          err.status = createRes.status;
          throw err;
        }
        const createJson = JSON.parse(createText) as unknown;
        const taskId = asString(
          (createJson as { data?: unknown } | null)?.data && typeof (createJson as { data?: unknown }).data === "object"
            ? ((createJson as { data: { task_id?: unknown } }).data.task_id as unknown)
            : "",
        );
        if (!taskId) throw new Error("ACE API did not return a task_id");
        console.log("ACE task created", { requestId, taskId, plan: authedPlan, duration: requestedDuration });

        while (Date.now() - startedAt < requestTimeoutMs - 5_000) {
          const pollUrl = `${baseUrl}/query_result`;
          const pollParams = new URLSearchParams();
          pollParams.append("ai_token", apiKey);
          pollParams.append("task_id_list", JSON.stringify([taskId]));
          pollParams.append("app", "studio-web");
          console.log("ACE query_result request", {
            requestId,
            method: "POST",
            url: pollUrl,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
            body: redactAiToken({ ai_token: apiKey, task_id_list: [taskId], app: "studio-web" }),
          });

          const pollRes = await fetch(pollUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
            body: pollParams,
            signal: controller.signal,
          });
          const pollText = await readTextSafe(pollRes);
          console.log("ACE query_result response", { requestId, status: pollRes.status, ok: pollRes.ok, body: pollText });
          if (!pollRes.ok) {
            const err = new Error(`ACE API query_result failed (${pollRes.status}): ${pollText}`) as Error & { status?: number };
            err.status = pollRes.status;
            throw err;
          }
          const pollJson = JSON.parse(pollText) as unknown;
          const item = Array.isArray((pollJson as { data?: unknown } | null)?.data) ? (pollJson as { data: unknown[] }).data[0] : null;
          const statusNum = item && typeof (item as { status?: unknown }).status === "number" ? ((item as { status: number }).status as number) : 0;
          if (statusNum === 1) {
            const resultStr = asString((item as { result?: unknown } | null)?.result);
            if (!resultStr) throw new Error("ACE task succeeded but result is empty");
            const results = JSON.parse(resultStr) as unknown;
            const first = Array.isArray(results) ? results[0] : null;
            const firstObj = first && typeof first === "object" && first !== null ? (first as Record<string, unknown>) : null;
            const file = first && typeof (first as { file?: unknown }).file === "string" ? ((first as { file: string }).file as string) : "";
            audioUrl = toAbsoluteUrl(baseUrl, file);
            if (!audioUrl) throw new Error("ACE task returned no audio file");
            const metasObj =
              firstObj && typeof firstObj.metas === "object" && firstObj.metas !== null ? (firstObj.metas as Record<string, unknown>) : null;
            const stemsZipUrl = pickStemsZipUrl(baseUrl, firstObj, metasObj);
            const lyricsFromResult =
              (firstObj && typeof firstObj.lyrics === "string" ? (firstObj.lyrics as string) : "") ||
              (firstObj && typeof firstObj.text === "string" ? (firstObj.text as string) : "") ||
              (metasObj && typeof metasObj.lyrics === "string" ? (metasObj.lyrics as string) : "");
            const usedSeed =
              metasObj && typeof metasObj.seed === "number"
                ? (metasObj.seed as number)
                : metasObj && typeof metasObj.random_seed === "number"
                  ? (metasObj.random_seed as number)
                  : null;
            const durationFromMetas = metasObj && typeof metasObj.duration === "number" ? (metasObj.duration as number) : null;
            const bpmFromMetas = metasObj && typeof metasObj.bpm === "number" ? (metasObj.bpm as number) : null;
            const keyScaleFromMetas =
              metasObj && typeof metasObj.keyscale === "string"
                ? (metasObj.keyscale as string)
                : metasObj && typeof metasObj.key_scale === "string"
                  ? (metasObj.key_scale as string)
                  : null;
            const timeSignatureFromMetas =
              metasObj && typeof metasObj.timesignature === "string"
                ? (metasObj.timesignature as string)
                : metasObj && typeof metasObj.time_signature === "string"
                  ? (metasObj.time_signature as string)
                  : null;
            meta = {
              taskId,
              task_id: taskId,
              prompt: effectivePrompt,
              lyrics: lyricsFromResult ? lyricsFromResult.trim() : effectiveLyrics,
              bpm: bpmFromMetas ?? bpm ?? null,
              duration: durationFromMetas ?? requestedDuration ?? null,
              keyScale: keyScaleFromMetas ?? (keyValue || null),
              timeSignature: timeSignatureFromMetas ?? (timeSignature.trim().length > 0 ? timeSignature.trim() : null),
              audioFormat,
              seed: usedSeed,
              stemsZipUrl: stemsZipUrl || null,
            };
            console.log("ACE task succeeded", { requestId, taskId, elapsedMs: Date.now() - startedAt });
            return;
          }
          if (statusNum === 2) throw new Error("ACE task failed");
          await sleep(2000);
        }
        throw new Error("ACE generation timed out");
      };

      let lastErr: unknown = null;
      for (const t of aceTargets) {
        try {
          await attemptOnce(t.apiKey, t.baseUrl);
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          const status = typeof (e as { status?: unknown } | null)?.status === "number" ? ((e as { status: number }).status as number) : 0;
          if (status && !isRetryableAceHttpStatus(status) && status !== 404) break;
          if (audioUrl) break;
        }
      }
      if (!audioUrl) {
        const apiKey = aceTargets[0]?.apiKey;
        if (apiKey) {
          try {
            console.log("ACE release_task failed — trying chat/completions fallback", { requestId });
            const chatOut = await attemptChatCompletions({
              apiKey,
              prompt: effectivePrompt,
              lyrics: effectiveLyrics || (instrumental ? "[Instrumental]" : ""),
              instrumental,
              bpm,
              keyScale,
              timeSignature,
              duration: requestedDuration,
              audioFormat,
              signal: controller.signal,
            });
            audioUrl = chatOut.audioUrl;
            meta = chatOut.meta;
            lastErr = null;
          } catch (chatErr) {
            lastErr = chatErr;
          }
        }
      }
      if (!audioUrl) {
        const msg = lastErr instanceof Error ? lastErr.message : "ACE generation failed";
        throw new Error(msg);
      }
    } finally {
      clearTimeout(timer);
    }

    if (authedSupabase && authedUserId && action !== "format") {
      const { error: bumpErr } =
        useIdempotentUsage && generationKey
          ? await authedSupabase.rpc("bump_loops_usage_idempotent", { p_key: generationKey })
          : await authedSupabase.rpc("bump_loops_usage");
      if (bumpErr) console.error("bump_loops_usage error:", bumpErr.message);
    }

    return new Response(JSON.stringify({ audioUrl, meta }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("ACE-Step Edge Function error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
