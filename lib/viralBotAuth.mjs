import { createClient } from "@supabase/supabase-js";

const DEFAULT_EMAIL = "viral-content-bot@producerhit.internal";

export async function getViralBotAccessToken(supabaseUrl, anonKey, serviceKey, email = process.env.VIRAL_BOT_EMAIL ?? DEFAULT_EMAIL) {
  if (!serviceKey) throw new Error("missing_service_role_key");

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

  const createRes = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (createRes.error && !String(createRes.error.message).toLowerCase().includes("already")) {
    throw new Error(createRes.error.message);
  }

  const linkRes = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const hashedToken = linkRes.data?.properties?.hashed_token;
  if (linkRes.error || !hashedToken) throw new Error(linkRes.error?.message ?? "magiclink_failed");

  const verifyRes = await client.auth.verifyOtp({ token_hash: hashedToken, type: "magiclink" });
  if (verifyRes.error) throw new Error(verifyRes.error.message);

  const userId = verifyRes.data?.user?.id;
  const token = verifyRes.data?.session?.access_token;
  if (!userId || !token) throw new Error("bot_auth_failed");

  await admin.from("profiles").update({ plan: "studio" }).eq("id", userId);

  return { userId, token, email };
}
