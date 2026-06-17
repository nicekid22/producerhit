import { supabase } from "@/lib/supabaseClient";

const LEGAL_NAME_PATTERN = /[0-9@#$%^&*()+={}\[\]|\\;:"<>?/`~]/;

export function validateLegalName(value: string, isFr: boolean): string | null {
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return isFr ? "Minimum 2 caractères" : "At least 2 characters";
  }
  if (trimmed.length > 60) {
    return isFr ? "Maximum 60 caractères" : "Maximum 60 characters";
  }
  if (LEGAL_NAME_PATTERN.test(trimmed)) {
    return isFr ? "Caractères invalides" : "Invalid characters";
  }
  return null;
}

export async function saveLegalName(
  firstName: string,
  lastName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "not_authenticated" };

  const payload = {
    legal_first_name: firstName.trim(),
    legal_last_name: lastName.trim(),
  };

  const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
  if (error) {
    if (/column/i.test(error.message)) return { ok: false, error: "migration_pending" };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
