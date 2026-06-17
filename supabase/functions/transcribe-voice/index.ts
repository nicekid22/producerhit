import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_BYTES = 12 * 1024 * 1024;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function transcribeOpenAI(audioBytes: Uint8Array, fileName: string, mimeType: string): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
  if (!apiKey) throw new Error("no_openai_key");

  const form = new FormData();
  const blob = new Blob([audioBytes], { type: mimeType || "audio/webm" });
  form.append("file", blob, fileName || "voice.webm");
  form.append("model", "whisper-1");
  form.append(
    "prompt",
    "Song lyrics transcription. Use [Verse] and [Chorus] section markers when appropriate.",
  );

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const json = await res.json();
  if (!res.ok) {
    console.error("whisper error", json);
    throw new Error(typeof json?.error?.message === "string" ? json.error.message : "whisper_failed");
  }
  return typeof json.text === "string" ? json.text.trim() : "";
}

async function transcribeGemini(audioBytes: Uint8Array, mimeType: string): Promise<string> {
  const { getGeminiApiKey } = await import("../_shared/geminiApiKey.ts");
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("no_gemini_key");

  const model = Deno.env.get("GEMINI_TRANSCRIBE_MODEL")?.trim() || "gemini-2.5-flash";
  const b64 = bytesToBase64(audioBytes);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType || "audio/webm",
                data: b64,
              },
            },
            {
              text:
                "Transcribe the spoken or sung lyrics in this audio. Format as song lyrics with [Verse] and [Chorus] markers when appropriate. Return ONLY the lyrics text in the original language, no commentary.",
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error("gemini transcribe error", json);
    throw new Error("gemini_failed");
  }

  const parts = json?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((p: { text?: string }) => (typeof p.text === "string" ? p.text : ""))
    .join("")
    .trim();
}

function guessMime(path: string, fallback?: string): string {
  if (fallback?.startsWith("audio/")) return fallback;
  const lower = path.toLowerCase();
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".webm")) return "audio/webm";
  if (lower.endsWith(".ogg")) return "audio/ogg";
  if (lower.endsWith(".m4a") || lower.endsWith(".aac")) return "audio/mp4";
  if (lower.endsWith(".flac")) return "audio/flac";
  return "audio/webm";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user?.id) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as { storagePath?: string };
    const storagePath = typeof body.storagePath === "string" ? body.storagePath.trim() : "";
    if (!storagePath || !storagePath.startsWith(`${user.id}/`)) {
      return new Response(JSON.stringify({ error: "invalid_path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: quotaRaw, error: quotaErr } = await userClient.rpc("check_and_consume_voice_to_song");
    if (quotaErr) {
      console.error("voice quota rpc", quotaErr);
      return new Response(JSON.stringify({ error: "quota_check_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const quota = quotaRaw as {
      ok?: boolean;
      error?: string;
      used?: number;
      limit?: number;
      remaining?: number;
      plan?: string;
    };

    if (!quota?.ok) {
      return new Response(
        JSON.stringify({
          error: quota?.error ?? "limit_reached",
          used: quota?.used ?? 0,
          limit: quota?.limit ?? 0,
          remaining: 0,
          plan: quota?.plan ?? "free",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: fileData, error: dlErr } = await admin.storage.from("voice-uploads").download(storagePath);
    if (dlErr || !fileData) {
      console.error("voice download", dlErr);
      return new Response(JSON.stringify({ error: "file_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioBytes = new Uint8Array(await fileData.arrayBuffer());
    if (audioBytes.byteLength < 800) {
      return new Response(JSON.stringify({ error: "audio_too_short" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (audioBytes.byteLength > MAX_BYTES) {
      return new Response(JSON.stringify({ error: "file_too_large" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mimeType = guessMime(storagePath, fileData.type);
    const fileName = storagePath.split("/").pop() ?? "voice.webm";

    let text = "";
    const openAiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
    if (openAiKey) {
      try {
        text = await transcribeOpenAI(audioBytes, fileName, mimeType);
      } catch (e) {
        console.warn("openai whisper failed, fallback gemini", e);
      }
    }
    if (!text) {
      try {
        text = await transcribeGemini(audioBytes, mimeType);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "gemini_failed";
        if (msg === "no_gemini_key") {
          return new Response(JSON.stringify({ error: "no_transcribe_backend" }), {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "gemini_failed" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!text) {
      return new Response(JSON.stringify({ error: "empty_transcript" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    void admin.storage.from("voice-uploads").remove([storagePath]);

    return new Response(
      JSON.stringify({
        text,
        used: quota.used ?? 0,
        limit: quota.limit ?? 0,
        remaining: quota.remaining ?? 0,
        plan: quota.plan ?? "free",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("transcribe-voice", e);
    const msg = e instanceof Error ? e.message : "server_error";
    const status = msg === "gemini_failed" || msg === "no_gemini_key" ? 502 : 500;
    const code = msg === "no_gemini_key" ? "no_transcribe_backend" : msg === "gemini_failed" ? "gemini_failed" : "server_error";
    return new Response(JSON.stringify({ error: code }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
