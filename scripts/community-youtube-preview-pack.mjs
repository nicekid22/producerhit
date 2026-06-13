/**
 * Pack validation — Short + Long par compte + metadata SEO (previews avant publish).
 *
 * Usage:
 *   npm run community:youtube-preview-pack
 *   npm run community:youtube-preview-pack -- --accounts vibez,market
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import ffmpegPath from "ffmpeg-static";
import { buildCommunityPreviewPlanFromDb } from "../lib/communityYoutubePick.mjs";
import { COMMUNITY_YOUTUBE_ACCOUNT_IDS } from "../lib/communityYoutubeAccounts.mjs";
import { buildCommunityYouTubeMetadata } from "../lib/communityYoutubeMetadata.mjs";
import { extractAceLyrics } from "../lib/communityYoutubeTitle.mjs";
import { resolveShortAudioWindowFromFile } from "../lib/youtubeShortAudioWindow.mjs";
import { resolveLoopCoverPath } from "../lib/youtubeCoverResolve.mjs";
import { buildYoutubeRenderArgs } from "../lib/youtubeVideoRender.mjs";
import {
  communityTemplateMode,
  renderPlayerCardPng,
  ensureFilmDustTexture,
  renderBrandWordmarkPng,
} from "../lib/youtubePlayerTemplate.mjs";
import { getPlayerTheme } from "../lib/youtubePlayerThemes.mjs";
import { playerCardFramePos } from "../lib/youtubePlayerCard.mjs";
import {
  buildCommunityLandscapeRenderArgs,
  communityLongMaxSec,
  renderCommunityLandscapeCardPng,
  runFfmpeg,
} from "../lib/youtubeCommunityLandscape.mjs";
import { resolveTrendRemixVideoDuration } from "../lib/trendRemixVideoDuration.mjs";
import { resolveCommunityLandscapePinterestVideo } from "../lib/pinterestVideoFetch.mjs";

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

const DEFAULT_ACCOUNTS = ["vibez", "market", "producerhitai"];

function parseArgs(argv) {
  const out = { accounts: DEFAULT_ACCOUNTS };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--accounts" && argv[i + 1]) {
      out.accounts = argv[++i].split(",").map((a) => a.trim().toLowerCase()).filter(Boolean);
    }
  }
  return out;
}

function slug(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);
}

function runFfmpegLocal(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (c) => {
      stderr += String(c);
    });
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr.slice(-800)))));
  });
}

async function renderShort(row, work) {
  const { loop, account, theme, kind, displayTitle, cta, slot } = row;
  const audioPath = join(work, "audio.m4a");
  const outPath = join(work, "short.mp4");

  const audioRes = await fetch(loop.audio_url);
  if (!audioRes.ok) throw new Error("audio_download_failed");
  await fs.writeFile(audioPath, Buffer.from(await audioRes.arrayBuffer()));

  const coverPath = await resolveLoopCoverPath(loop, work);
  if (!coverPath) throw new Error("cover_missing");

  const lyrics = extractAceLyrics(loop.stems_url);
  const win = await resolveShortAudioWindowFromFile({ audioPath, lyrics, slot: slot ?? 0 });

  let cardPath = null;
  let wordmarkPath = null;
  let dustPath = null;
  if (communityTemplateMode() === "player") {
    cardPath = join(work, "card.png");
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
    if (getPlayerTheme(theme).useDust) dustPath = await ensureFilmDustTexture();
  }

  await runFfmpegLocal(
    buildYoutubeRenderArgs({
      coverPath,
      cardPath,
      wordmarkPath,
      dustPath,
      audioPath,
      outPath,
      maxSec: win.durationSec,
      loopId: loop.id,
      trackKind: kind,
      stemsUrl: loop.stems_url,
      playerTheme: theme,
      cta,
      audioStartSec: win.startSec,
    }),
  );

  return { outPath, sec: win.durationSec, audioStartSec: win.startSec };
}

async function renderLong(row, work) {
  const { loop, theme, displayTitle, cta, kind } = row;
  const audioPath = join(work, "audio.m4a");
  const outPath = join(work, "long.mp4");

  const audioRes = await fetch(loop.audio_url);
  if (!audioRes.ok) throw new Error("audio_download_failed");
  await fs.writeFile(audioPath, Buffer.from(await audioRes.arrayBuffer()));

  const coverPath = await resolveLoopCoverPath(loop, work);
  if (!coverPath) throw new Error("cover_missing");

  const maxSec = await resolveTrendRemixVideoDuration(loop, audioPath, communityLongMaxSec());
  const backgroundVideoPath = await resolveCommunityLandscapePinterestVideo({
    loop,
    themeId: theme,
    workDir: work,
    log: console.log,
  });
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

  await runFfmpeg(
    buildCommunityLandscapeRenderArgs({
      coverPath,
      backgroundVideoPath,
      cardPath,
      audioPath,
      outPath,
      maxSec,
      themeId: theme,
      cta,
    }),
  );

  return { outPath, sec: maxSec };
}

function metadataFor(row, format, slot = 0) {
  const lyrics = extractAceLyrics(row.loop.stems_url);
  return buildCommunityYouTubeMetadata({
    loopId: row.loop.id,
    account: row.account,
    displayTitle: row.displayTitle,
    genre: row.loop.genre ?? "AI",
    bpm: row.loop.bpm,
    key: row.loop.key ?? "",
    kind: row.kind,
    format,
    lyrics,
    slot,
  });
}

function markdownReport(entries) {
  const lines = ["# Community YouTube — Preview Pack + SEO\n"];
  for (const e of entries) {
    lines.push(`## ${e.account} · ${e.format.toUpperCase()} · ${e.theme}\n`);
    lines.push(`**Fichier:** \`${e.fileName}\` · ${e.sec}s\n`);
    lines.push(`**Titre YouTube:**\n\`\`\`\n${e.metadata.title}\n\`\`\`\n`);
    lines.push(`**Description:**\n\`\`\`\n${e.metadata.description.slice(0, 1200)}${e.metadata.description.length > 1200 ? "\n…" : ""}\n\`\`\`\n`);
    lines.push(`**Tags:** ${e.metadata.tags.join(", ")}\n`);
    lines.push(`**Hashtags:** ${e.metadata.hashtags}\n`);
    lines.push("---\n");
  }
  return lines.join("\n");
}

async function main() {
  const { accounts } = parseArgs(process.argv.slice(2));
  for (const a of accounts) {
    if (!COMMUNITY_YOUTUBE_ACCOUNT_IDS.includes(a)) throw new Error(`unknown_account:${a}`);
  }

  const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
  const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("supabase_env_missing");

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const fullPlan = await buildCommunityPreviewPlanFromDb(db, { accounts, perAccount: 2 });

  const outDir = join(process.cwd(), "previews", "community-youtube-pack");
  await fs.mkdir(outDir, { recursive: true });

  const entries = [];
  console.log(`\n📦 Preview pack — ${accounts.length} compte(s) × (Short + Long)\n`);

  for (const account of accounts) {
    const shortRow = fullPlan.find((p) => p.account === account && p.slot === 0);
    const longRow = fullPlan.find((p) => p.account === account && p.slot === 1) ?? shortRow;
    if (!shortRow) {
      console.warn(`⚠ Pas de loop pour ${account}`);
      continue;
    }

    for (const [format, row, slot] of [
      ["short", shortRow, 0],
      ["long", longRow, 1],
    ]) {
      const work = await fs.mkdtemp(join(tmpdir(), "pack-"));
      console.log(`▶ ${account} · ${format} · "${row.displayTitle}"`);
      try {
        const rendered = format === "short" ? await renderShort(row, work) : await renderLong(row, work);
        const meta = metadataFor(row, format, slot);
        const fileName = `${account}-${format}-${row.theme}-${slug(row.displayTitle)}.mp4`;
        await fs.copyFile(rendered.outPath, join(outDir, fileName));

        entries.push({
          account,
          format,
          theme: row.theme,
          kind: row.kind,
          loopId: row.loop.id,
          displayTitle: row.displayTitle,
          fileName,
          sec: rendered.sec,
          metadata: meta,
        });
        console.log(`  ✅ ${fileName} (${rendered.sec}s)`);
        console.log(`  📌 Titre: ${meta.title}\n`);
      } catch (e) {
        console.error(`  ❌ ${e.message}\n`);
      } finally {
        await fs.rm(work, { recursive: true, force: true }).catch(() => undefined);
      }
    }
  }

  const jsonPath = join(outDir, "metadata-preview.json");
  const mdPath = join(outDir, "metadata-preview.md");
  await fs.writeFile(jsonPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  await fs.writeFile(mdPath, markdownReport(entries), "utf8");

  console.log("——— Fichiers ———");
  console.log(`Vidéos: ${outDir}`);
  console.log(`Metadata JSON: ${jsonPath}`);
  console.log(`Metadata MD:   ${mdPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
