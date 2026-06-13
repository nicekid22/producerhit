/**
 * Previews community YouTube Shorts — 5 comptes × 2 (Prism / Warm Glass).
 * Usage:
 *   npm run community:youtube-preview
 *   npm run community:youtube-preview -- --limit 3
 *   npm run community:youtube-preview -- --account vibez
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import ffmpegPath from "ffmpeg-static";
import { buildCommunityPreviewPlanFromDb } from "../lib/communityYoutubePick.mjs";
import { COMMUNITY_YOUTUBE_ACCOUNT_IDS, COMMUNITY_SHORTS_PER_ACCOUNT_PER_DAY } from "../lib/communityYoutubeAccounts.mjs";
import { buildYoutubeRenderArgs } from "../lib/youtubeVideoRender.mjs";
import { resolveShortAudioWindowFromFile } from "../lib/youtubeShortAudioWindow.mjs";
import { communityShortSec } from "../lib/youtubeDailyCadence.mjs";
import { extractAceLyrics } from "../lib/communityYoutubeTitle.mjs";
import { resolveLoopCoverPath } from "../lib/youtubeCoverResolve.mjs";
import {
  communityTemplateMode,
  renderPlayerCardPng,
  ensureFilmDustTexture,
  renderBrandWordmarkPng,
} from "../lib/youtubePlayerTemplate.mjs";
import { getPlayerTheme } from "../lib/youtubePlayerThemes.mjs";
import { playerCardFramePos } from "../lib/youtubePlayerCard.mjs";
import { buildCommunityYouTubeMetadata } from "../lib/communityYoutubeMetadata.mjs";

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
  const out = { limit: 0, account: "" };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--limit" && argv[i + 1]) {
      out.limit = Number(argv[++i]) || 0;
    } else if (argv[i] === "--account" && argv[i + 1]) {
      out.account = String(argv[++i]).trim().toLowerCase();
    }
  }
  return out;
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (c) => {
      stderr += String(c);
    });
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr.slice(-800)))));
  });
}

function slug(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

async function renderPlanRow(row, outDir) {
  const { loop, account, theme, kind, displayTitle, cta, slot } = row;
  const work = await fs.mkdtemp(join(tmpdir(), "comm-yt-"));
  const audioPath = join(work, "audio.m4a");
  const outPath = join(work, "out.mp4");

  const audioRes = await fetch(loop.audio_url);
  if (!audioRes.ok) throw new Error(`audio_download_failed:${loop.id}`);
  await fs.writeFile(audioPath, Buffer.from(await audioRes.arrayBuffer()));

  const coverPath = await resolveLoopCoverPath(loop, work);
  if (!coverPath) throw new Error(`cover_missing:${loop.id}`);

  const lyrics = extractAceLyrics(loop.stems_url);
  const win = await resolveShortAudioWindowFromFile({ audioPath, lyrics, slot: slot ?? 0 });
  const sec = win.durationSec;

  let cardPath = null;
  let wordmarkPath = null;
  let dustPath = null;

  if (communityTemplateMode() === "player") {
    cardPath = join(work, "player-card.png");
    await renderPlayerCardPng({
      coverPath,
      title: displayTitle,
      subtitle: cta,
      trackKind: kind,
      theme,
      outPath: cardPath,
    });
    wordmarkPath = join(work, "wordmark.png");
    await renderBrandWordmarkPng(theme, playerCardFramePos().cardY, wordmarkPath);
    if (getPlayerTheme(theme).useDust) {
      dustPath = await ensureFilmDustTexture();
    }
  }

  await runFfmpeg(
    buildYoutubeRenderArgs({
      coverPath,
      cardPath,
      wordmarkPath,
      dustPath,
      audioPath,
      outPath,
      maxSec: sec,
      loopId: loop.id,
      trackKind: kind,
      stemsUrl: loop.stems_url,
      playerTheme: theme,
      cta,
      audioStartSec: win.startSec,
    }),
  );

  const fileName = `${account}-${theme}-${kind}-${slug(displayTitle)}-${loop.id.slice(0, 8)}.mp4`;
  const dest = join(outDir, fileName);
  await fs.copyFile(outPath, dest);
  await fs.rm(work, { recursive: true, force: true }).catch(() => undefined);

  const meta = buildCommunityYouTubeMetadata({
    loopId: loop.id,
    account,
    displayTitle,
    genre: loop.genre ?? "AI",
    bpm: loop.bpm,
    key: loop.key ?? "",
    kind,
    format: "short",
    lyrics,
    slot: slot ?? 0,
  });

  return {
    file: dest,
    fileName,
    account,
    theme,
    kind,
    loopId: loop.id,
    displayTitle,
    cta,
    youtube: meta,
    genre: loop.genre,
    sec,
    audioStartSec: win.startSec,
  };
}

async function main() {
  const { limit, account } = parseArgs(process.argv.slice(2));
  const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
  const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("supabase_env_missing");

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const accounts = account ? [account] : COMMUNITY_YOUTUBE_ACCOUNT_IDS;
  if (account && !COMMUNITY_YOUTUBE_ACCOUNT_IDS.includes(account)) {
    throw new Error(`unknown_account:${account}`);
  }

  let plan = await buildCommunityPreviewPlanFromDb(db, {
    accounts,
    perAccount: account ? COMMUNITY_SHORTS_PER_ACCOUNT_PER_DAY : COMMUNITY_SHORTS_PER_ACCOUNT_PER_DAY,
  });
  if (limit > 0) plan = plan.slice(0, limit);

  if (!plan.length) throw new Error("no_eligible_community_loops");

  const outDir = join(process.cwd(), "previews", "community-youtube");
  await fs.mkdir(outDir, { recursive: true });

  console.log(`\nCommunity YouTube previews — ${plan.length} vidéo(s)\n`);

  const manifest = [];
  for (const row of plan) {
    console.log(
      `▶ ${row.account} · ${row.theme} · ${row.kind}\n  titre: "${row.displayTitle}"\n  CTA: ${row.cta}\n  loop: ${row.loop.id}`,
    );
    try {
      const result = await renderPlanRow(row, outDir);
      manifest.push(result);
      console.log(`  ✅ ${result.fileName} (${result.sec}s)\n`);
    } catch (e) {
      console.error(`  ❌ ${row.loop.id}: ${e.message}\n`);
    }
  }

  const manifestPath = join(outDir, "manifest.json");
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log("——— Résumé ———");
  for (const m of manifest) {
    console.log(`${m.account.padEnd(14)} ${m.theme.padEnd(11)} ${m.kind.padEnd(10)} → previews/community-youtube/${m.fileName}`);
  }
  console.log(`\nManifest: ${manifestPath}`);
  console.log("\nValide les previews avant d’activer l’auto-publish community.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
