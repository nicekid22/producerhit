import { supabase } from "./supabase";

type InvokeResult<T> = {
  data: T | null;
  errorText: string | null;
  limitReached?: boolean;
};

async function extractInvokeError(error: unknown): Promise<{ message: string; limitReached?: boolean }> {
  const anyError = error as { message?: string; context?: unknown };
  const errContext = anyError.context;

  const fromParsed = (parsed: unknown) => {
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as { error?: unknown; limitReached?: unknown; message?: unknown };
    const message =
      (typeof obj.error === "string" ? obj.error : null) ||
      (typeof obj.message === "string" ? obj.message : null);
    const limitReached = obj.limitReached === true ? true : undefined;
    return message ? { message, limitReached } : null;
  };

  if (errContext && typeof errContext === "object" && typeof (errContext as Response).text === "function") {
    try {
      const res = errContext as Response;
      const text = await res.text();
      if (text) {
        try {
          const extracted = fromParsed(JSON.parse(text) as unknown);
          if (extracted) return extracted;
        } catch {
          return { message: text.slice(0, 500) };
        }
      }
      if (res.status === 403) {
        return { message: "Monthly limit reached. Upgrade to generate more.", limitReached: true };
      }
      if (res.status === 429) {
        return { message: "Too many requests. Wait a few seconds and try again." };
      }
      if (res.status === 504 || res.status === 546) {
        return { message: `Generation timed out (${res.status}). Try again.` };
      }
      if (res.status >= 500) {
        return { message: `Server error (${res.status}). Try again in a moment.` };
      }
    } catch {
      // ignore
    }
  }

  const errBody = (anyError.context as { body?: unknown } | undefined)?.body;
  if (typeof errBody === "string") {
    try {
      const extracted = fromParsed(JSON.parse(errBody) as unknown);
      if (extracted) return extracted;
    } catch {
      if (errBody.trim()) return { message: errBody.slice(0, 500) };
    }
  }

  const extracted = fromParsed(errBody);
  if (extracted) return extracted;

  const fallback = anyError.message ?? "Edge Function error";
  if (fallback.includes("non-2xx")) {
    return { message: "Generation failed. Check your connection and try again." };
  }
  return { message: fallback };
}

export async function invokeSupabaseFunction<T>(args: {
  name: string;
  body: unknown;
  accessToken?: string;
}): Promise<InvokeResult<T>> {
  const { data, error } = await supabase.functions.invoke(args.name, {
    body: args.body as Record<string, unknown>,
    headers: args.accessToken ? { Authorization: `Bearer ${args.accessToken}` } : {},
  });

  if (error) {
    const extracted = await extractInvokeError(error);
    return { data: null, errorText: extracted.message, limitReached: extracted.limitReached };
  }

  const payload = data as { error?: string; limitReached?: boolean } | null;
  if (payload?.error) {
    return {
      data: null,
      errorText: payload.error,
      limitReached: payload.limitReached === true,
    };
  }

  return { data: (data as T) ?? null, errorText: null };
}
