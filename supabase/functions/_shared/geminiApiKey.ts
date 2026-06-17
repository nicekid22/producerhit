/** Resolve Gemini / Google AI key — prefer Supabase secret GOOGLE_API_KEY_NEW. */
export function getGeminiApiKey(): string {
  return (
    Deno.env.get("GOOGLE_API_KEY_NEW")?.trim() ||
    Deno.env.get("GEMINI_API_KEY")?.trim() ||
    Deno.env.get("GOOGLE_API_KEY")?.trim() ||
    ""
  );
}
