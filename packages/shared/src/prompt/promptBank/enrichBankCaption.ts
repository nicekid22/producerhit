import type { AppLocale } from "../../i18n/locales";
import { normalizeAceCaption } from "../acePromptContract";
import { buildRichAceCaption } from "../richDisplayAce";
import { extractPromptBankSubject } from "../themeFromDiceDisplay";

type PromptMode = "beat" | "song";

const META_TAG_RE =
  /^(clean studio vocal|controlled delivery|polished studio mix|instrumental|no vocals|no lyrics|steady pitch)$/i;
const BPM_TAG_RE = /^\d{2,3}\s*bpm$/i;

function parseTags(caption: string): string[] {
  return caption
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Banque 2000 — caption trop court / sans mood → enrichir avant envoi ACE. */
export function isThinAceCaption(caption: string): boolean {
  const tags = parseTags(caption);
  const substantive = tags.filter((t) => !META_TAG_RE.test(t) && !BPM_TAG_RE.test(t));
  if (substantive.length < 6) return true;

  const hasMood = tags.some((t) =>
    /\b(mood|atmosphere|vibe|intimate|dark|warm|nostalgic|energy|emotional|cinematic|nocturnal|feel|hush|dance|kitchen|reunion|heartbreak)\b/i.test(
      t,
    ),
  );
  return !hasMood && substantive.length < 9;
}

export function enrichBankAceCaption(args: {
  display: string;
  aceCaption: string;
  locale: AppLocale;
  mode: PromptMode;
  genre: string;
}): string {
  const raw = args.aceCaption.trim();
  if (!raw) {
    return buildRichAceCaption({
      display: args.display,
      locale: args.locale,
      mode: args.mode,
      formGenre: args.genre,
    });
  }

  const bankSubject = extractPromptBankSubject(args.display);
  const needsThemeLayers = Boolean(bankSubject);
  if (!needsThemeLayers && !isThinAceCaption(raw)) {
    return normalizeAceCaption(raw, {
      mode: args.mode === "song" ? "song" : "beat",
      instrumental: args.mode === "beat",
    }).caption;
  }

  return buildRichAceCaption({
    display: args.display,
    locale: args.locale,
    mode: args.mode,
    formGenre: args.genre,
    preferPrebuiltAce: raw,
  });
}
