import type { AppLocale } from "@/i18n/config";
import { validateLegalNameI18n } from "@/i18n/settingsCatalog";
import { supabase } from "@/lib/supabaseClient";

export function validateLegalName(value: string, locale: AppLocale): string | null {
  return validateLegalNameI18n(value, locale);
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
