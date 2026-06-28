import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-region",
};

type HandlerModule = typeof import("../_shared/generateLoopAceMain.ts");
let handlerModulePromise: Promise<HandlerModule> | null = null;

function loadHandler(): Promise<HandlerModule> {
  if (!handlerModulePromise) {
    handlerModulePromise = import("../_shared/generateLoopAceMain.ts");
  }
  return handlerModulePromise;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { handleGenerateLoopAceRequest } = await loadHandler();
    return await handleGenerateLoopAceRequest(req);
  } catch (err) {
    console.error("[generate-loop-ace] boot error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});