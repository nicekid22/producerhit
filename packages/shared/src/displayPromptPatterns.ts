/** Aligné avec web `promptEnhancer.ts` — idées curated / dé (pas saisie naturelle). */
const LEGACY_DICE_DISPLAY_RE =
  /^(Una canzone |Una canción |Uma música |Ein [\w\s.'-]+-Song |Ein [\w\s.'-]+-Beat |Een [\w\s.'-]+-song |Een [\w\s.'-]+-beat )/i;

function looksLikeFrenchConversationalSongRequest(text: string): boolean {
  const t = text.trim();
  if (!/^une chanson\s+/i.test(t)) return false;
  if (/\b(hip hop|hip-hop|fais|crée|génère|vacances|bord de la mer|plage)\b/i.test(t)) return true;
  return t.split(/\s+/).length >= 10;
}

export function looksLikeStructuredDisplayIdea(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/^A [a-z0-9][\w\s\-'&]* song /i.test(t) || /^A [a-z0-9][\w\s\-'&]* beat /i.test(t)) return true;
  if (LEGACY_DICE_DISPLAY_RE.test(t)) return true;
  if (/^Une chanson /i.test(t) && !looksLikeFrenchConversationalSongRequest(t)) return true;
  if (/^Un beat /i.test(t) && !/^un beat sur\b/i.test(t)) return true;
  if (/^(Chanson |Hymne |Ballade |Son pour |Type beat )/i.test(t)) return true;
  return /^(A |An |The |Funny |Feel-good |Glossy |Epic |Slow |Playful |Euphoric |Cinematic |Ironic |Respectful |Acoustic |Modern |Piano |Phonk |Gospel|Track for |Type beat |Song about |Road-trip |Hymn for |Beat where |Loop for |Melodic |World Cup |Back-to-work |Long-distance |Chanson |Beat |Instrumental |Dusty |Dark |Peak-time |Organic |Experimental |Romantic |Orchestral )/i.test(
    t,
  );
}
