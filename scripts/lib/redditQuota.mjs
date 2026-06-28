/**
 * Quotas Reddit — le cron tourne toutes les 20 min mais n'agit que si le budget le permet.
 */

export function readQuotaConfig(env = process.env) {
  const n = (key, fallback) => {
    const raw = Number(env[key]);
    return Number.isFinite(raw) && raw >= 0 ? raw : fallback;
  };
  return {
    maxCommentsPerDay: n("REDDIT_MAX_COMMENTS_PER_DAY", 3),
    maxPostsPerDay: n("REDDIT_MAX_POSTS_PER_DAY", 1),
    maxPostsPerWeek: n("REDDIT_MAX_POSTS_PER_WEEK", 3),
    minMinutesBetweenComments: n("REDDIT_MIN_MINUTES_BETWEEN_COMMENTS", 120),
    minMinutesBetweenPosts: n("REDDIT_MIN_MINUTES_BETWEEN_POSTS", 360),
    cronIntervalMinutes: n("REDDIT_CRON_INTERVAL_MINUTES", 20),
    maxCommentsPerRun: n("REDDIT_MAX_COMMENTS_PER_RUN", 1),
  };
}

export function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

export function weekStartUtc() {
  const now = new Date();
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = monday.getUTCDay();
  const diff = dow === 0 ? 6 : dow - 1;
  monday.setUTCDate(monday.getUTCDate() - diff);
  return monday.toISOString().slice(0, 10);
}

export function countCommentsToday(state) {
  const today = todayUtc();
  return (state.commentDays ?? []).filter((d) => d === today).length;
}

export function countPostsToday(state) {
  const today = todayUtc();
  return (state.postDays ?? []).filter((p) => p.date === today).length;
}

export function countPostsThisWeek(state) {
  const start = weekStartUtc();
  return (state.postDays ?? []).filter((p) => p.date >= start).length;
}

export function minutesSince(iso) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return Number.POSITIVE_INFINITY;
  return (Date.now() - ms) / 60_000;
}

export function getQuotaStatus(state, env = process.env) {
  const config = readQuotaConfig(env);
  const commentsToday = countCommentsToday(state);
  const postsToday = countPostsToday(state);
  const postsWeek = countPostsThisWeek(state);
  const minSinceComment = minutesSince(state.lastCommentAt);
  const minSincePost = minutesSince(state.lastPostAt);

  const commentBlocked = [];
  if (commentsToday >= config.maxCommentsPerDay) commentBlocked.push("daily_comment_cap");
  if (minSinceComment < config.minMinutesBetweenComments) {
    commentBlocked.push(`comment_cooldown_${Math.ceil(config.minMinutesBetweenComments - minSinceComment)}m`);
  }

  const postBlocked = [];
  if (postsToday >= config.maxPostsPerDay) postBlocked.push("daily_post_cap");
  if (postsWeek >= config.maxPostsPerWeek) postBlocked.push("weekly_post_cap");
  if (minSincePost < config.minMinutesBetweenPosts) {
    postBlocked.push(`post_cooldown_${Math.ceil(config.minMinutesBetweenPosts - minSincePost)}m`);
  }

  return {
    config,
    commentsToday,
    postsToday,
    postsWeek,
    minSinceComment: Number.isFinite(minSinceComment) ? Math.floor(minSinceComment) : null,
    minSincePost: Number.isFinite(minSincePost) ? Math.floor(minSincePost) : null,
    canComment: commentBlocked.length === 0,
    canPost: postBlocked.length === 0,
    commentBlocked,
    postBlocked,
    commentBudgetRemaining: Math.max(0, config.maxCommentsPerDay - commentsToday),
    postBudgetRemaining: Math.max(0, config.maxPostsPerDay - postsToday),
    weeklyPostBudgetRemaining: Math.max(0, config.maxPostsPerWeek - postsWeek),
  };
}

export function recordComment(state) {
  const today = todayUtc();
  state.commentDays = [...(state.commentDays ?? []), today];
  state.lastCommentAt = new Date().toISOString();
}

export function recordPost(state, kind) {
  const today = todayUtc();
  state.postDays = [...(state.postDays ?? []), { date: today, kind }];
  state.lastPostAt = new Date().toISOString();
  state.lastPostDay = { ...(state.lastPostDay ?? {}), [kind]: today };
}

export function formatQuotaReport(status) {
  const { config } = status;
  return [
    `Cron interval: ${config.cronIntervalMinutes} min (scout chaque tick, action si quota OK)`,
    `Comments: ${status.commentsToday}/${config.maxCommentsPerDay} today · ${status.commentBudgetRemaining} left · cooldown ${config.minMinutesBetweenComments}m`,
    `Posts: ${status.postsToday}/${config.maxPostsPerDay} today · ${status.postsWeek}/${config.maxPostsPerWeek} this week`,
    `Can comment: ${status.canComment ? "yes" : "no"}${status.commentBlocked.length ? ` (${status.commentBlocked.join(", ")})` : ""}`,
    `Can post: ${status.canPost ? "yes" : "no"}${status.postBlocked.length ? ` (${status.postBlocked.join(", ")})` : ""}`,
  ].join("\n");
}
