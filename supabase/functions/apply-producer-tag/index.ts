import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { LOOP_AUDIO_BUCKET } from "../_shared/generationJobUtils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Placement =
  | "intro"
  | "outro"
  | "pre_drop"
  | "bar_8"
  | "bar_16"
  | "random_bars"
  | "smart_intro";

type FxPreset = "clean" | "radio" | "reverb" | "phone" | "pitch_up" | "pitch_down";

function producerTagMax(plan: string): number {
  if (plan === "plus") return 10;
  if (plan === "studio") return 5;
  if (plan === "pro") return 2;
  return 0;
}

function canUseProducerTag(plan: string): boolean {
  return producerTagMax(plan) > 0;
}

function canUseExtendedPlacement(plan: string): boolean {
  return plan === "studio" || plan === "plus";
}

function usageKey(userId: string, loopId: string): string {
  return `producer-tag:${userId}:${loopId}`;
}

function computeOffsetSec(input: {
  bpm: number;
  durationSec: number;
  tagDurationSec: number;
  placement: Placement;
  loopId: string;
}): number {
  const bpm = input.bpm > 0 ? input.bpm : 120;
  const barSec = (60 / bpm) * 4;
  const clamp = (o: number) => Math.min(Math.max(0, o), Math.max(0, input.durationSec - input.tagDurationSec - 0.05));

  switch (input.placement) {
    case "outro":
      return clamp(input.durationSec - input.tagDurationSec - 0.25);
    case "pre_drop":
      return clamp(barSec * 16 - input.tagDurationSec - 0.15);
    case "bar_8":
      return clamp(barSec * 8);
    case "bar_16":
      return clamp(barSec * 16);
    case "random_bars": {
      const candidates = [8, 16, 24, 32];
      let h = 0;
      for (let i = 0; i < input.loopId.length; i++) h = (h * 31 + input.loopId.charCodeAt(i)) >>> 0;
      const bars = candidates[h % candidates.length] ?? 8;
      return clamp(barSec * bars);
    }
    default:
      return 0;
  }
}

async function fetchBytes(url: string): Promise<Uint8Array | null> {
  const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  if (!res.ok) return null;
  return new Uint8Array(await res.arrayBuffer());
}

async function callMixApi(form: FormData): Promise<Uint8Array | null> {
  const mixUrl = (Deno.env.get("PRODUCER_TAG_MIX_URL") ?? Deno.env.get("VERCEL_URL") ?? "").trim();
  const secret = (Deno.env.get("PRODUCER_TAG_MIX_SECRET") ?? "").trim();
  if (!mixUrl || !secret) throw new Error("mix_not_configured");
  const base = mixUrl.startsWith("http") ? mixUrl : `https://${mixUrl}`;
  const url = `${base.replace(/\/$/, "")}/api/producer-tag-mix`;
  form.append("mode", "mix");
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-producer-tag-secret": secret },
    body: form,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`mix_failed:${res.status}:${errText.slice(0, 200)}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

function parseStems(stemsUrl: unknown): Record<string, unknown> | null {
  if (!stemsUrl || typeof stemsUrl !== "object") return null;
  return stemsUrl as Record<string, unknown>;
}

function mergeProducerTagMeta(
  stemsUrl: unknown,
  meta: Record<string, unknown>,
): Record<string, unknown> {
  const parsed = parseStems(stemsUrl) ?? {};
  const aceRaw = parsed.ace;
  const ace = aceRaw && typeof aceRaw === "object" ? { ...(aceRaw as Record<string, unknown>) } : {};
  ace.producerTag = meta;
  parsed.ace = ace;
  return parsed;
}

function clearProducerTagMeta(stemsUrl: unknown): Record<string, unknown> | null {
  const parsed = parseStems(stemsUrl);
  if (!parsed) return null;
  const aceRaw = parsed.ace;
  if (!aceRaw || typeof aceRaw !== "object") return parsed;
  const ace = { ...(aceRaw as Record<string, unknown>) };
  delete ace.producerTag;
  parsed.ace = ace;
  return parsed;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user?.id) return json({ error: "unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      loopId?: string;
      tagId?: string;
      variantId?: string;
      placement?: string;
      volumeDb?: number;
      fxPreset?: string;
      fadeMs?: number;
    };

    const action = String(body.action ?? "apply");
    const loopId = String(body.loopId ?? "").trim();

    const { data: planRow } = await userClient.from("profiles").select("plan").eq("id", user.id).maybeSingle();
    const plan = typeof planRow?.plan === "string" ? planRow.plan : "free";

    if (!canUseProducerTag(plan)) return json({ error: "plan_required", plan }, 402);

    if (action === "remove") {
      if (!loopId) return json({ error: "loop_id_required" }, 400);
      const { data: loopRow, error: loopErr } = await userClient
        .from("loops")
        .select("id, audio_url, stems_url")
        .eq("id", loopId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (loopErr || !loopRow) return json({ error: "loop_not_found" }, 404);

      const stems = parseStems(loopRow.stems_url);
      const ace = stems?.ace && typeof stems.ace === "object" ? (stems.ace as Record<string, unknown>) : null;
      const tagMeta = ace?.producerTag && typeof ace.producerTag === "object" ? (ace.producerTag as Record<string, unknown>) : null;
      const originalPath = typeof tagMeta?.originalAudioPath === "string" ? tagMeta.originalAudioPath : "";

      let restoredUrl = typeof loopRow.audio_url === "string" ? loopRow.audio_url : "";
      if (originalPath) {
        const { data: pub } = admin.storage.from(LOOP_AUDIO_BUCKET).getPublicUrl(originalPath);
        if (pub?.publicUrl) restoredUrl = pub.publicUrl;
      }

      const nextStems = clearProducerTagMeta(loopRow.stems_url);
      const { error: updErr } = await admin
        .from("loops")
        .update({ audio_url: restoredUrl, stems_url: nextStems })
        .eq("id", loopId)
        .eq("user_id", user.id);
      if (updErr) return json({ error: updErr.message }, 500);

      return json({ ok: true, audioUrl: restoredUrl, removed: true });
    }

    if (action !== "apply") return json({ error: "unknown_action" }, 400);
    if (!loopId) return json({ error: "loop_id_required" }, 400);

    const tagId = String(body.tagId ?? "").trim();
    if (!tagId) return json({ error: "tag_id_required" }, 400);

    let placement = String(body.placement ?? "intro").trim() as Placement;
    if (!canUseExtendedPlacement(plan) && !["intro", "outro"].includes(placement)) {
      placement = "intro";
    }

    let fxPreset = String(body.fxPreset ?? "clean").trim() as FxPreset;
    if (!canUseExtendedPlacement(plan) && fxPreset !== "clean") fxPreset = "clean";

    const volumeDb = typeof body.volumeDb === "number" && Number.isFinite(body.volumeDb) ? body.volumeDb : -3;
    const fadeMs = typeof body.fadeMs === "number" && Number.isFinite(body.fadeMs) ? body.fadeMs : 50;
    const variantId = String(body.variantId ?? "").trim();

    const key = usageKey(user.id, loopId);
    const { data: checkRows, error: checkErr } = await userClient.rpc("check_loops_usage_idempotent", { p_key: key });
    if (checkErr) throw new Error(checkErr.message);
    const check = Array.isArray(checkRows) ? checkRows[0] : checkRows;
    const alreadyCounted = Boolean(check?.already_counted);
    if (!check?.ok) {
      return json({ error: "no_credits", used: check?.used, limit: check?.limit }, 402);
    }

    const { data: loopRow, error: loopErr } = await userClient
      .from("loops")
      .select("id, audio_url, stems_url, bpm, duration_sec, name")
      .eq("id", loopId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (loopErr || !loopRow) return json({ error: "loop_not_found" }, 404);

    const audioUrl = typeof loopRow.audio_url === "string" ? loopRow.audio_url.trim() : "";
    if (!audioUrl.startsWith("http")) return json({ error: "audio_not_ready" }, 400);

    const { data: tagRow, error: tagErr } = await userClient
      .from("producer_tags")
      .select("id, name, storage_path, duration_sec, settings_json")
      .eq("id", tagId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (tagErr || !tagRow) return json({ error: "tag_not_found" }, 404);

    const settings =
      tagRow.settings_json && typeof tagRow.settings_json === "object"
        ? (tagRow.settings_json as Record<string, unknown>)
        : {};

    let tagStoragePath = tagRow.storage_path;
    if (variantId && Array.isArray(settings.variants)) {
      const found = settings.variants.find(
        (v) => v && typeof v === "object" && (v as Record<string, unknown>).id === variantId,
      ) as Record<string, unknown> | undefined;
      if (typeof found?.storagePath === "string") tagStoragePath = found.storagePath;
    }

    const stems = parseStems(loopRow.stems_url);
    const ace = stems?.ace && typeof stems.ace === "object" ? (stems.ace as Record<string, unknown>) : null;
    const existingMeta =
      ace?.producerTag && typeof ace.producerTag === "object" ? (ace.producerTag as Record<string, unknown>) : null;
    const existingOriginal =
      typeof existingMeta?.originalAudioPath === "string" ? existingMeta.originalAudioPath : "";

    const beatBytes = await fetchBytes(audioUrl);
    if (!beatBytes?.byteLength) return json({ error: "beat_download_failed" }, 502);

    const { data: tagFile, error: tagDlErr } = await admin.storage.from("producer-tags").download(tagStoragePath);
    if (tagDlErr || !tagFile) return json({ error: "tag_download_failed" }, 502);
    const tagBytes = new Uint8Array(await tagFile.arrayBuffer());

    const bpm = typeof loopRow.bpm === "number" ? loopRow.bpm : 120;
    const durationSec =
      typeof loopRow.duration_sec === "number" && loopRow.duration_sec > 0 ? loopRow.duration_sec : 180;
    const tagDurationSec =
      typeof tagRow.duration_sec === "number" && tagRow.duration_sec > 0 ? Number(tagRow.duration_sec) : 2.5;

    const offsetSec = computeOffsetSec({
      bpm,
      durationSec,
      tagDurationSec,
      placement,
      loopId,
    });

    const form = new FormData();
    form.append("beat", new Blob([beatBytes], { type: "audio/mpeg" }), "beat.mp3");
    form.append("tag", new Blob([tagBytes], { type: "audio/mpeg" }), "tag.mp3");
    form.append("offsetSec", String(offsetSec));
    form.append("volumeDb", String(volumeDb));
    form.append("fadeMs", String(fadeMs));
    form.append("fxPreset", fxPreset);

    const mixedBytes = await callMixApi(form);
    if (!mixedBytes?.byteLength) return json({ error: "mix_empty" }, 502);

    let originalPath = existingOriginal;
    if (!originalPath) {
      originalPath = `${user.id}/originals/${loopId}.mp3`;
      await admin.storage.from(LOOP_AUDIO_BUCKET).upload(originalPath, beatBytes, {
        contentType: "audio/mpeg",
        upsert: true,
        cacheControl: "public, max-age=31536000",
      });
    }

    const taggedPath = `${user.id}/tagged/${loopId}-${Date.now()}.mp3`;
    const { error: upErr } = await admin.storage.from(LOOP_AUDIO_BUCKET).upload(taggedPath, mixedBytes, {
      contentType: "audio/mpeg",
      upsert: true,
      cacheControl: "public, max-age=604800",
    });
    if (upErr) return json({ error: "upload_failed" }, 500);

    const { data: pub } = admin.storage.from(LOOP_AUDIO_BUCKET).getPublicUrl(taggedPath);
    const newAudioUrl = pub?.publicUrl?.trim() ?? "";
    if (!newAudioUrl) return json({ error: "public_url_failed" }, 500);

    const producerTagMeta = {
      tagId: tagRow.id,
      tagName: tagRow.name,
      placement,
      appliedAt: new Date().toISOString(),
      originalAudioPath: originalPath,
      volumeDb,
      fxPreset,
      variantId: variantId || undefined,
      creditConsumed: !alreadyCounted,
    };

    const nextStems = mergeProducerTagMeta(loopRow.stems_url, producerTagMeta);
    const { error: updErr } = await admin
      .from("loops")
      .update({ audio_url: newAudioUrl, stems_url: nextStems })
      .eq("id", loopId)
      .eq("user_id", user.id);
    if (updErr) return json({ error: updErr.message }, 500);

    if (!alreadyCounted) {
      const { error: bumpErr } = await userClient.rpc("bump_loops_usage_idempotent", { p_key: key });
      if (bumpErr) console.warn("apply-producer-tag bump failed", bumpErr.message);
    }

    return json({
      ok: true,
      audioUrl: newAudioUrl,
      offsetSec,
      placement,
      alreadyCounted,
      creditConsumed: !alreadyCounted,
      producerTag: producerTagMeta,
    });
  } catch (e) {
    console.error("apply-producer-tag", e);
    return json({ error: e instanceof Error ? e.message : "server_error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
