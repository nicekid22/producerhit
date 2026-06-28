/**
 * Scout Reddit — subs varies (prod, songwriting, AI) + scoring threads.
 */

export const SCOUT_SUBS = [
  // AI & tools
  {
    name: "aiMusic",
    category: "ai",
    noBeatLinks: true,
    queries: ["make money", "suno", "song mode", "workflow", "honest"],
  },
  {
    name: "SunoAI",
    category: "ai",
    noBeatLinks: true,
    queries: ["alternative", "song", "vocals", "workflow"],
  },
  // Hip-hop / beats
  {
    name: "makinghiphop",
    category: "beats",
    noBeatLinks: true,
    queries: ["suno", "ai beat", "beatstars", "fl studio"],
  },
  {
    name: "trapproduction",
    category: "beats",
    noBeatLinks: true,
    queries: ["type beat", "ai", "workflow"],
  },
  {
    name: "futurebeatmakers",
    category: "beats",
    noBeatLinks: true,
    queries: ["ai", "workflow", "beginner"],
  },
  // Songwriting & songs
  {
    name: "Songwriting",
    category: "song",
    noBeatLinks: true,
    queries: ["writer's block", "ai", "melody", "lyrics", "hook"],
  },
  {
    name: "singing",
    category: "song",
    noBeatLinks: true,
    queries: ["ai vocal", "demo", "writing", "cover"],
  },
  {
    name: "composer",
    category: "song",
    noBeatLinks: true,
    queries: ["ai", "melody", "writer's block", "workflow"],
  },
  {
    name: "musicians",
    category: "song",
    noBeatLinks: true,
    queries: ["ai music", "songwriting", "home studio"],
  },
  // General production
  {
    name: "WeAreTheMusicMakers",
    category: "production",
    noBeatLinks: true,
    queries: ["ai", "workflow", "songwriting", "writer's block"],
  },
  {
    name: "musicproduction",
    category: "production",
    noBeatLinks: true,
    queries: ["ai", "vocals", "song", "type beat"],
  },
  {
    name: "audioengineering",
    category: "production",
    noBeatLinks: true,
    queries: ["ai vocal", "mix", "home studio"],
  },
  {
    name: "MusicInTheMaking",
    category: "production",
    noBeatLinks: true,
    queries: ["wip", "feedback", "ai", "song"],
  },
  {
    name: "edmproduction",
    category: "production",
    noBeatLinks: true,
    queries: ["workflow", "ai", "melody"],
  },
  // DAW-specific (commentaires surtout)
  {
    name: "FL_Studio",
    category: "daw",
    noBeatLinks: true,
    queries: ["ai", "workflow", "vocals", "song"],
  },
  {
    name: "Ableton",
    category: "daw",
    noBeatLinks: true,
    queries: ["workflow", "ai", "songwriting"],
  },
  {
    name: "Logic_Studio",
    category: "daw",
    noBeatLinks: true,
    queries: ["ai", "vocals", "songwriting"],
  },
];

export const INTENT_SCORES = [
  {
    re: /make money|monetiz|actually make|income from ai|selling ai|spotify.*ai|ai.*spotify|get paid/i,
    intent: "monetization",
    weight: 6,
  },
  {
    re: /does anyone|anyone actually|honest question|real talk|genuine question|curious if/i,
    intent: "discussion",
    weight: 5,
  },
  {
    re: /lyric|songwrit|melody|hook|verse|chorus|topline|vocal|full song|song mode|singer/i,
    intent: "songwriting",
    weight: 5,
  },
  { re: /type beat|beatstars|free beat|need beats/i, intent: "type_beat", weight: 3 },
  { re: /suno|udio|ai music|ai beat|ai song|generator/i, intent: "ai_compare", weight: 3 },
  { re: /fl studio|ableton|logic|workflow|producer|daw/i, intent: "workflow", weight: 3 },
  { re: /stuck|writer.?s block|help|recommend/i, intent: "help", weight: 3 },
  { re: /ethic|replace artist|ai slop|real music/i, intent: "ethics", weight: 4 },
];

export function isoWeekIndex(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.floor((d - yearStart) / 604800000);
}

/** 4 subs par run cron — rotation pour couvrir toute la liste sans spam API. */
export function getScoutSubsForRun(batchIndex = 0, batchSize = 4) {
  const n = SCOUT_SUBS.length;
  const start = ((batchIndex % n) + n) % n;
  const batch = [];
  for (let i = 0; i < Math.min(batchSize, n); i++) {
    batch.push(SCOUT_SUBS[(start + i) % n]);
  }
  return batch;
}

export function scoreRedditThread(post) {
  const hay = `${post.title ?? ""} ${post.selftext ?? ""}`.toLowerCase();
  let score = 0;
  let intent = "generic";
  let bestWeight = 0;

  for (const { re, intent: i, weight } of INTENT_SCORES) {
    if (re.test(hay) && weight >= bestWeight) {
      bestWeight = weight;
      intent = i;
      score += weight;
    }
  }

  if (/\?/.test(post.title ?? "")) score += 3;
  if (/does anyone|anyone actually|honest/i.test(hay)) score += 2;

  if (post.numComments != null && post.numComments < 60) score += 1;
  if (post.score != null && post.score >= 0 && post.score < 200) score += 1;

  if (/promo|buy my|check out my store|dm me for/i.test(hay)) score -= 4;

  return { score, intent };
}

export function subredditCategory(subreddit) {
  const sr = (subreddit ?? "").toLowerCase();
  return SCOUT_SUBS.find((s) => s.name.toLowerCase() === sr)?.category ?? "production";
}
