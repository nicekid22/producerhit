// apple-iap-sync/index.ts
//
// Handles Apple In-App Purchase receipts.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fbGetProfile, fbUpdateProfile } from "../_shared/firestoreServer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function planFromProductId(productId: string | undefined): "pro" | "studio" | "plus" {
  const id = (productId ?? "").toLowerCase();
  if (id.includes(".plus.monthly")) return "plus";
  if (id.includes(".studio.monthly")) return "studio";
  return "pro";
}

async function verifyFirebaseIdToken(token: string, apiKey: string) {
  if (!token.startsWith("eyJ")) return null;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token }) },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { users?: Array<{ localId?: string }> };
    return json.users?.[0]?.localId ?? null;
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const firebaseApiKey = Deno.env.get("FIREBASE_API_KEY") ?? "";

    // Verify Firebase ID token
    let userId: string | null = null;
    if (firebaseApiKey && token.startsWith("eyJ")) {
      userId = await verifyFirebaseIdToken(token, firebaseApiKey);
    }

    if (!userId) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      productId?: string;
      plan?: string;
      transactionId?: string;
      originalTransactionId?: string;
    };

    const allowDevSync = (Deno.env.get("APPLE_IAP_ALLOW_CLIENT_SYNC") ?? "").trim() === "1";
    if (!allowDevSync && body.action === "purchase") {
      return new Response(JSON.stringify({ error: "Server-side Apple receipt validation required", plan: null }), {
        status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productId = body.productId ?? "com.producerhit.app.pro.monthly";
    const plan: "free" | "pro" | "studio" | "plus" =
      body.plan === "plus" || body.plan === "studio" || body.plan === "pro"
        ? body.plan
        : planFromProductId(productId);

    if (body.action === "restore") {
      const profile = await fbGetProfile(userId!);
      return new Response(JSON.stringify({
        ok: true,
        plan: profile?.plan ?? "free",
        billing_source: profile?.billing_source ?? "none",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // apply_apple_plan_entitlement — now direct Firestore write
    await fbUpdateProfile(userId!, {
      plan,
      billing_source: "apple",
      apple_original_transaction_id: body.originalTransactionId ?? body.transactionId ?? null,
    });

    const profile = await fbGetProfile(userId!);

    return new Response(JSON.stringify({
      ok: true,
      plan: profile?.plan ?? plan,
      billing_source: "apple",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});