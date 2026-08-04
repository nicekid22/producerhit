// ensureProfile.ts — Firebase Cloud Function (Node.js)
// Port of supabase/functions/ensure-profile/index.ts

import * as functions from "firebase-functions";
import { fbGetProfile, fbUpdateProfile } from "./firestore";

function referralCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function ensureProfileHandler(request: { auth?: { uid: string; token?: Record<string, unknown> }; data: Record<string, unknown> }) {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required");
  }

  const uid = request.auth.uid;
  const email = (request.auth.token?.email as string) ?? null;

  const existing = await fbGetProfile(uid);
  if (existing) {
    return { ok: true, status: "exists", id: uid };
  }

  await fbUpdateProfile(uid, {
    plan: "free",
    loops_used_this_month: 0,
    referral_code: referralCode(),
    referral_bonus: 0,
    level_bonus: 0,
    daily_bonus_month: 0,
    purchased_bonus: 0,
    email: email || undefined,
  } as any);

  return { ok: true, status: "created", id: uid };
}
