/**
 * Test manuel upload YouTube (render local ffmpeg + videos.insert).
 * Usage: node --use-system-ca scripts/youtube-test-post.mjs [loopId]
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import ffmpegPath from "ffmpeg-static";
import {
  inferTrackKind,
  extractViralMeta,
} from "../lib/youtubeSocial.mjs";
import { buildYouTubeUploadMetadata } from "../lib/youtubeMetadata.mjs";
import { buildYoutubeRenderArgs, pickYouTubeHook, youtubePreviewSec } from "../lib/youtubeVideoRender.mjs";
import { loadYouTubeAccount, resolveOAuthCredentials } from "../lib/youtubeAccounts.mjs";

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

function parseAccountArg() {
  const idx = process.argv.indexOf("--account");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1].trim().toLowerCase();
  return "vibez";
}

const ACCOUNT_ID = parseAccountArg();
const loopArg = process.argv.find((a, i) => i >= 2 && !a.startsWith("--") && process.argv[i - 1] !== "--account");
const LOOP_ID = (loopArg ?? "68a91ff1-42b4-42f0-b719-5e6481aafba1").trim();
const { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, refreshEnvKey } = resolveOAuthCredentials(ACCOUNT_ID);
const REFRESH_TOKEN = (process.env[refreshEnvKey] ?? process.env.YOUTUBE_REFRESH_TOKEN ?? "").trim();
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const PRIVACY = (process.env.YOUTUBE_PRIVACY_STATUS ?? "public").trim();
const MAX_SEC = youtubePreviewSec();

function runFfmpeg(args) {
  const bin = ffmpegPath;
  if (!bin) throw new Error("ffmpeg_binary_missing");
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (c) => {
      stderr += String(c);
    });
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr.slice(-400)))));
  });
}

async function getAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) throw new Error(`token_failed:${JSON.stringify(json)}`);
  return json.access_token;
}

async function uploadVideo(accessToken, bytes, title, description, tags) {
  const total = bytes.byteLength;
  const lastByte = total - 1;
  const metadata = JSON.stringify({
    snippet: { title, description, tags, categoryId: "10" },
    status: { privacyStatus: PRIVACY, selfDeclaredMadeForKids: false, embeddable: true, license: "youtube" },
  });

  const init = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "Content-Length": String(new TextEncoder().encode(metadata).length),
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": String(total),
      },
      body: metadata,
    },
  );
  if (!init.ok) throw new Error(`init_${init.status}:${await init.text()}`);
  const uploadUrl = init.headers.get("location");
  if (!uploadUrl) throw new Error("no_upload_url");

  const up = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "video/mp4",
      "Content-Length": String(total),
      "Content-Range": `bytes 0-${lastByte}/${total}`,
    },
    body: bytes,
  });
  const text = await up.text();
  if (up.status !== 201 && !up.ok) throw new Error(`upload_${up.status}:${text.slice(0, 300)}`);
  const json = JSON.parse(text);
  return json.id;
}

async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.error(`Credentials manquants pour "${ACCOUNT_ID}" (${refreshEnvKey})`);
    console.error("npm run youtube:oauth -- --account market");
    process.exit(1);
  }
  const account = loadYouTubeAccount(ACCOUNT_ID);
  if (!account) {
    console.error(`Compte "${ACCOUNT_ID}" incomplet.`);
    process.exit(1);
  }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_URL manquants");
    process.exit(1);
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: loop, error } = await db
    .from("loops")
    .select("id,name,genre,bpm,key,scale,cover_url,audio_url,is_public,stems_url")
    .eq("id", LOOP_ID)
    .maybeSingle();
  if (error || !loop?.audio_url || !loop.is_public) {
    console.error("Loop introuvable ou non publique:", LOOP_ID);
    process.exit(1);
  }

  const coverUrl = loop.cover_url || `https://www.producerhit.com/api/og-loop?id=${encodeURIComponent(LOOP_ID)}`;
  const work = await fs.mkdtemp(join(tmpdir(), "yt-test-"));
  const coverPath = join(work, "cover.jpg");
  const audioPath = join(work, "audio.bin");
  const outPath = join(work, "out.mp4");

  console.log(`Render ${loop.name} (${LOOP_ID}) → @${ACCOUNT_ID}…`);
  const [coverRes, audioRes] = await Promise.all([fetch(coverUrl), fetch(loop.audio_url)]);
  if (!coverRes.ok || !audioRes.ok) throw new Error("download_failed");
  await fs.writeFile(coverPath, Buffer.from(await coverRes.arrayBuffer()));
  await fs.writeFile(audioPath, Buffer.from(await audioRes.arrayBuffer()));

  const trackKind = inferTrackKind(loop.stems_url, loop.name ?? "");
  const hook = pickYouTubeHook({ loopId: LOOP_ID, kind: trackKind });

  await runFfmpeg(
    buildYoutubeRenderArgs({
      coverPath,
      audioPath,
      outPath,
      maxSec: MAX_SEC,
      loopId: LOOP_ID,
      trackKind,
      hook,
    }),
  );

  const bytes = await fs.readFile(outPath);
  console.log(`Vidéo ${(bytes.byteLength / 1024 / 1024).toFixed(2)} MB — upload YouTube (${PRIVACY})…`);

  const token = await getAccessToken();
  const keyLine = [loop.key, loop.scale].filter(Boolean).join(" ").trim();
  const kind = inferTrackKind(loop.stems_url, loop.name ?? "");
  const shareUrl = `https://www.producerhit.com/loop/${LOOP_ID}?utm_source=youtube&utm_medium=social&utm_campaign=shorts`;
  const viralMeta = extractViralMeta(loop.stems_url);
  const uploadMeta = buildYouTubeUploadMetadata({
    loopId: LOOP_ID,
    name: loop.name ?? "Untitled",
    genre: loop.genre ?? "AI",
    bpm: loop.bpm,
    key: keyLine,
    kind,
    shareUrl,
    accountId: ACCOUNT_ID,
    viralMeta,
  });

  console.log(`Kind: ${kind} | A/B title ${uploadMeta.ab.titleVariant} desc ${uploadMeta.ab.descVariant}`);
  console.log(`Title: ${uploadMeta.title}`);

  const videoId = await uploadVideo(token, bytes, uploadMeta.title, uploadMeta.description, uploadMeta.tags);
  console.log(`\n✅ Publié: https://www.youtube.com/watch?v=${videoId}`);
  await fs.rm(work, { recursive: true, force: true }).catch(() => undefined);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
