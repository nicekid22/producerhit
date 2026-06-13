/**
 * CTA variés — carte player (subtitle) + burn-in Shorts.
 */

function hashId(seed) {
  let h = 2166136261;
  const s = String(seed ?? "x");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const SITE_CTAS = {
  song: [
    "Try it free on ProducerHit",
    "Generate AI songs with vocals — free",
    "Make your own AI song in 30 sec",
    "Create beats & full songs — producerhit.com",
    "Your turn — AI music studio free",
    "Full track + lyrics on ProducerHit",
  ],
  type_beat: [
    "Free type beats on ProducerHit",
    "Make this beat yours in 30 seconds",
    "AI type beats — try free",
    "Would you rap on this? Make yours →",
    "Generate beats free — producerhit.com",
    "ProducerHit — beats & songs, no DAW",
  ],
  instrumental: [
    "Loop this on ProducerHit — free",
    "AI instrumentals — try free",
    "Make your own loop in 30 sec",
    "Create on producerhit.com — free",
  ],
  universal: [
    "producerhit.com — try it free",
    "AI music studio — free to start",
    "Generate AI beats & full songs",
    "Listen full track on ProducerHit",
  ],
};

const ACCOUNT_CTAS = {
  vibez: [
    "Vibe check passed — make yours free",
    "Community drop · create yours on PH",
    "Mood music AI — producerhit.com",
  ],
  market: [
    "Free beat energy — ProducerHit",
    "Type beat made in minutes · try free",
    "Tag a rapper · make beats on PH",
  ],
  lowdey: [
    "Guess the vibe · make music on PH",
    "Community heat — try ProducerHit",
  ],
  producerhitai: [
    "AI songs daily — try ProducerHit",
    "Full vocals in seconds · free start",
  ],
  beatmakerunion: [
    "Beatmakers — AI studio free",
    "Union drop · producerhit.com",
    "Make beats without the session",
  ],
};

export function pickCommunityCta({ loopId, account = "", kind = "song", slot = 0 } = {}) {
  const k = kind === "type_beat" || kind === "instrumental" ? kind : "song";
  const id = String(account ?? "").trim().toLowerCase();
  const accountPool = ACCOUNT_CTAS[id] ?? [];
  const pool = [...SITE_CTAS[k], ...accountPool, ...SITE_CTAS.universal];
  const idx = hashId(`${loopId}:${id}:${slot}:${k}`) % pool.length;
  return pool[idx];
}

export function listCommunityCtas(kind = "song") {
  const k = kind in SITE_CTAS ? kind : "song";
  return [...SITE_CTAS[k], ...SITE_CTAS.universal];
}
