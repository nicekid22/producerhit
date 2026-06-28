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
  const { handleGenerateLoopAceRequest } = await loadHandler();
  return handleGenerateLoopAceRequest(req);
});
