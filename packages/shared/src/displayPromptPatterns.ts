/** Aligné avec web `promptEnhancer.ts` — idées curated / dé (pas saisie naturelle). */
const LEGACY_DICE_DISPLAY_RE =
  /^(Una canzone |Una canción |Uma música |Ein [\w\s.'-]+-Song |Ein [\w\s.'-]+-Beat |Een [\w\s.'-]+-song |Een [\w\s.'-]+-beat )/i;

function looksLikeFrenchConversationalSongRequest(text: string): boolean {
  const t = text.trim();
  if (!/^une chanson\s+/i.test(t)) return false;
  // Shell dé catalogue — sauf demandes libres avec marqueurs conversationnels.
  if (/^une chanson\s+.+?\s+sur\s+\S/i.test(t) && t.split(/\s+/).length <= 14) {
    if (/\b(hip hop|hip-hop|vacances|bord de la mer|plage|fais|crée|génère)\b/i.test(t)) return true;
    return false;
  }
  if (/\b(hip hop|hip-hop|fais|crée|génère|vacances|bord de la mer|plage)\b/i.test(t)) return true;
  return t.split(/\s+/).length >= 12;
}

export function looksLikeStructuredDisplayIdea(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/^A [a-z0-9][\w\s\-'&]* song /i.test(t) || /^A [a-z0-9][\w\s\-'&]* beat /i.test(t)) return true;
  if (LEGACY_DICE_DISPLAY_RE.test(t)) return true;
  if (/^Une chanson /i.test(t) && !looksLikeFrenchConversationalSongRequest(t)) return true;
  if (/^Un beat /i.test(t) && !/^un beat sur\b/i.test(t)) return true;
  if (/^(Chanson |Hymne |Ballade |Son pour |Type beat )/i.test(t)) return true;
  if (/^(Canción |Himno |Balada |Tema para |Canción graciosa )/i.test(t)) return true;
  if (/^(Canzone |Inno |Ballata )/i.test(t)) return true;
  if (/^(Ein |Eine |Lustiger |Melodischer )/i.test(t) && /\b(Song|Beat|Lied)\b/i.test(t)) return true;
  if (/^(Uma |Um |Canção |Música )/i.test(t)) return true;
  if (/^[\d]{2}s\s/i.test(t)) return true;
  if (/^(Synthwave|Cyberpunk|Chiptune|Hyperpop|Metalcore|Bluegrass|Bossa|Flamenco|Neo-soul|Afro-jazz|Afro-house|Orchestral drill|Gospel trap|Country trap|Latin jazz|K-pop|J-pop|City pop|Y2K|Grunge|Disco-funk|Vintage soul|Epic gaming|Lo-fi RPG|Ambient meditation|Piano rap|Drill symphonique|Film-noir|Anime opening|Western cinematic|Rom-com|Action blockbuster|Indie A24|Documentary score|Superhero trailer|Wedding first-dance|Graduation anthem|Breakup recovery|Road-trip anthem|Funeral tribute|New baby|Studio session|Viral hook|Sync licensing|Beat battle|Sample flip|Autumn melancholy|Summer festival|Winter cabin|Spring renewal|Midnight city pop)\b/i.test(t)) return true;
  if (/^(Canción |Himno |Balada |Tema |Chanson |Son |Canzone |Inno |Ballata |Lied |Song |Track |Beat |Type beat |Instrumental |Loop |Thème |Beat underscore|Fusion phonk)\b/i.test(t)) return true;
  return /^(A |An |The |Funny |Feel-good |Glossy |Epic |Slow |Playful |Euphoric |Cinematic |Ironic |Respectful |Acoustic |Modern |Piano |Phonk |Gospel|Track for |Type beat |Song about |Road-trip |Hymn for |Beat where |Loop for |Melodic |World Cup |Back-to-work |Long-distance |Chanson |Beat |Instrumental |Dusty |Dark |Peak-time |Organic |Experimental |Romantic |Orchestral )/i.test(
    t,
  );
}
