/**
 * Test unique — long landscape avec fond vidéo Pinterest (carte centrée).
 *
 * Usage:
 *   npm run community:youtube-long-pinterest-video-test
 *   npm run community:youtube-long-pinterest-video-test -- --account vibez --sec 45
 */
import { existsSync, readFileSync, promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { buildCommunityPreviewPlanFromDb } from "../lib/communityYoutubePick.mjs";
import { resolveLoopCoverPath } from "../lib/youtubeCoverResolve.mjs";
import {
  buildCommunityLandscapeRenderArgs,
  renderCommunityLandscapeCardPng,
  runFfmpeg,
} from "../lib/youtubeCommunityLandscape.mjs";
import {
  buildLandscapePinterestVideoQuery,
  fetchPinterestBackgroundVideo,
} from "../lib/pinterestVideoFetch.mjs";
import { resolveShortAudioWindowFromFile } from "../lib/youtubeShortAudioWindow.mjs";
import { extractAceLyrics } from "../lib/communityYoutubeTitle.mjs";

function loadDotEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadDotEnv();

function parseArgs(argv) {
  const out = { account: "vibez", sec: Number(process.env.COMMUNITY_PREVIEW_LONG_SEC ?? process.env.YOUTUBE_PREVIEW_SEC ?? "45") };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--account" && argv[i + 1]) out.account = argv[++i].trim().toLowerCase();
    if (argv[i] === "--sec" && argv[i + 1]) out.sec = Math.max(15, Math.min(120, Number(argv[++i])));
  }
  return out;
}

async function main() {
  const { account, sec } = parseArgs(process.argv.slice(2));
  const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
  const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("supabase_env_missing");

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const plan = await buildCommunityPreviewPlanFromDb(db, { accounts: [account], perAccount: 1 });
  const row = plan.find((p) => p.account === account);
  if (!row?.loop) throw new Error(`no_loop_for_${account}`);

  const { loop, theme, displayTitle, cta, kind } = row;
  const work = await fs.mkdtemp(join(tmpdir(), "pinterest-long-test-"));
  const outDir = join(process.cwd(), "previews", "community-youtube-pack");
  await fs.mkdir(outDir, { recursive: true });

  console.log(`\n🎬 Test long Pinterest video — ${account} · ${theme} · ${sec}s`);
  console.log(`   Titre: ${displayTitle}`);

  try {
    const audioPath = join(work, "audio.m4a");
    const audioRes = await fetch(loop.audio_url);
    if (!audioRes.ok) throw new Error("audio_download_failed");
    await fs.writeFile(audioPath, Buffer.from(await audioRes.arrayBuffer()));

    const coverPath = await resolveLoopCoverPath(loop, work);
    if (!coverPath) throw new Error("cover_missing");

    const pinQuery = buildLandscapePinterestVideoQuery(loop, theme);
    console.log(`   Pinterest query: "${pinQuery}"`);
    const pinVideo = await fetchPinterestBackgroundVideo({
      query: pinQuery,
      seed: loop.id,
      workDir: work,
    });
    console.log(`   ✅ Fond vidéo: ${pinVideo.sourceUrl.slice(0, 88)}…`);

    const cardPath = join(work, "landscape-card.png");
    await renderCommunityLandscapeCardPng({
      coverPath,
      themeId: theme,
      title: displayTitle,
      subtitle: cta,
      genre: loop.genre ?? "AI",
      trackKind: kind,
      outPath: cardPath,
    });

    const lyrics = extractAceLyrics(loop.stems_url);
    const win = await resolveShortAudioWindowFromFile({ audioPath, lyrics, slot: 1 });
    const audioStartSec = win.startSec;

    const outPath = join(work, "out.mp4");
    await runFfmpeg(
      buildCommunityLandscapeRenderArgs({
        coverPath,
        backgroundVideoPath: pinVideo.path,
        cardPath,
        audioPath,
        outPath,
        maxSec: sec,
        themeId: theme,
        cta,
        audioStartSec,
      }),
    );

    const fileName = `${account}-long-${theme}-pinterest-video-TEST.mp4`;
    const dest = join(outDir, fileName);
    await fs.copyFile(outPath, dest);

    const meta = {
      account,
      theme,
      displayTitle,
      loopId: loop.id,
      sec,
      audioStartSec,
      pinterestQuery: pinQuery,
      pinterestVideoUrl: pinVideo.sourceUrl,
      fileName,
    };
    const metaPath = join(outDir, "pinterest-video-test.json");
    await fs.writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, "utf8");

    console.log(`\n✅ Preview: ${dest}`);
    console.log(`   Metadata: ${metaPath}\n`);
  } finally {
    await fs.rm(work, { recursive: true, force: true }).catch(() => undefined);
  }
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
