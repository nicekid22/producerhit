/** Curiosity / reaction hooks burned into Shorts (English, Gen Z 2026). */



const HOOKS = {

  song: [

    "this song didn't exist 5 minutes ago",

    "wait... AI can SING now??",

    "pov: you found a song that shouldn't exist",

    "bro who made this?? (not a human)",

    "this vocal was generated. still stuck in my head.",

    "comment if you'd put this on your playlist",

    "this wasn't on Spotify this morning",

    "the algorithm needed to hear this",

    "AI just dropped a banger. nobody's ready.",

    "comment 'how' if you're confused (same)",

  ],

  type_beat: [

    "this beat didn't exist 5 minutes ago",

    "producers are not gonna like this one",

    "made in minutes. sounds like hours.",

    "would you rap on this? be honest",

    "your DAW could never (maybe it could)",

    "free beat energy but AI made it",

    "producers hate this one trick (it's AI)",

    "this beat wasn't in your folder yesterday",

    "tag a rapper who needs this beat",

    "comment the artist you'd send this to",

  ],

  instrumental: [

    "this loop wasn't here yesterday",

    "main character background music",

    "loop this until someone asks what it is",

    "instrumental that shouldn't slap this hard",

    "save this before it blows up",

    "comment what movie scene this fits",

    "loop until your roommate complains",

    "this didn't exist when you woke up",

  ],

  universal: [

    "this track didn't exist 5 minutes ago",

    "comment what genre this feels like",

    "not a single human produced this",

    "save it or regret it later",

    "wrong timeline? still a hit.",

    "comment 🔥 if you'd use this",

    "tell me where you'd play this",

  ],

  community_vibez: [

    "someone on producerhit made this. not you. yet.",

    "this song wasn't on anyone's playlist yesterday",

    "pov: you could've made this in 30 seconds",

    "why does this AI song hit harder than my last 10 drafts",

    "comment if you'd drop something like this tonight",

  ],

  community_market: [

    "free beat energy — made by a random producer on AI",

    "would you rap on this or keep scrolling",

    "this beat wasn't in your folder this morning",

    "tag someone who needs a beat like this",

    "30 seconds on producerhit. sounds like a session.",

  ],

};



function hashId(id) {

  let h = 2166136261;

  const s = String(id ?? "x");

  for (let i = 0; i < s.length; i += 1) {

    h ^= s.charCodeAt(i);

    h = Math.imul(h, 16777619);

  }

  return h >>> 0;

}



export function pickYouTubeHook({ loopId, kind = "song", account = "" }) {

  const k = kind === "type_beat" || kind === "instrumental" || kind === "song" ? kind : "song";

  const id = String(account ?? "").trim().toLowerCase();

  const community =

    id === "market" && (k === "type_beat" || k === "instrumental")

      ? HOOKS.community_market

      : id === "vibez" && k === "song"

        ? HOOKS.community_vibez

        : [];

  const pool = [...HOOKS[k], ...community, ...HOOKS.universal];

  return pool[hashId(`${loopId}:${id}`) % pool.length];

}



export function listYouTubeHooks(kind = "song") {

  const k = kind in HOOKS ? kind : "song";

  return [...HOOKS[k], ...HOOKS.universal];

}

