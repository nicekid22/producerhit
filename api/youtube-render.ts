import { spawn } from "node:child_process";

import { promises as fs } from "node:fs";

import { tmpdir } from "node:os";

import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

import ffmpegPath from "ffmpeg-static";

import { extractViralMeta, inferTrackKind } from "../lib/youtubeSocial.mjs";
import { buildYoutubeRenderArgs, youtubePreviewSec, youtubeViralPreviewSec } from "../lib/youtubeVideoRender.mjs";
import { resolveLoopCoverPath } from "../lib/youtubeCoverResolve.mjs";
import { resolveViralVisualAssets } from "../lib/youtubeViralVisual.mjs";
import { resolveYouTubePreferredAccount } from "../lib/youtubeChannelStrategy.mjs";
import { communityTemplateMode, playerThemeForAccount, renderPlayerCardPng, ensureFilmDustTexture, renderBrandWordmarkPng } from "../lib/youtubePlayerTemplate.mjs";
import { getPlayerTheme } from "../lib/youtubePlayerThemes.mjs";
import { playerCardFramePos } from "../lib/youtubePlayerCard.mjs";



export const config = {

  maxDuration: 120,

};



type LoopRow = {
  id: string;
  name: string | null;
  audio_url: string | null;
  cover_url: string | null;
  is_public: boolean | null;
  stems_url: unknown;
};



function runFfmpeg(args: string[]): Promise<void> {

  const bin = ffmpegPath;

  if (!bin) return Promise.reject(new Error("ffmpeg_binary_missing"));



  return new Promise((resolve, reject) => {

    const proc = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });

    let stderr = "";

    proc.stderr.on("data", (chunk) => {

      stderr += String(chunk);

    });

    proc.on("error", reject);

    proc.on("close", (code) => {

      if (code === 0) resolve();

      else reject(new Error(`ffmpeg_exit_${code}:${stderr.slice(-1200)}`));

    });

  });

}



async function downloadToFile(url: string, dest: string): Promise<void> {

  const res = await fetch(url);

  if (!res.ok) throw new Error(`download_${res.status}`);

  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));

}



export default async function handler(

  req: { query?: Record<string, string | string[] | undefined>; method?: string; headers?: Record<string, string | undefined> },

  res: {

    setHeader: (key: string, value: string) => void;

    status: (code: number) => { send: (body: string | Buffer) => void; json: (body: unknown) => void };

  },

) {

  if (req.method && req.method !== "GET") {

    res.setHeader("Allow", "GET");

    return res.status(405).send("Method not allowed");

  }



  const secret = (process.env.SOCIAL_PUBLISH_CRON_SECRET ?? "").trim();

  const provided = (req.headers?.["x-social-cron-secret"] ?? "").trim();

  if (!secret || provided !== secret) {

    return res.status(401).json({ error: "unauthorized" });

  }



  const loopId = String(req.query?.loopId ?? "").trim();

  if (!loopId) {

    return res.status(400).json({ error: "missing_loopId" });

  }



  const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").trim();

  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  if (!supabaseUrl || !serviceKey) {

    return res.status(500).json({ error: "server_misconfigured" });

  }



  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data } = await db

    .from("loops")

    .select("id,name,audio_url,cover_url,is_public,stems_url")

    .eq("id", loopId)

    .maybeSingle();



  const loop = data as LoopRow | null;

  if (!loop?.audio_url || !loop.is_public) {

    return res.status(404).json({ error: "loop_not_found_or_private" });

  }



  const viralMeta = extractViralMeta(loop.stems_url);
  const isViral = Boolean(viralMeta?.series);
  const maxSec = isViral ? youtubeViralPreviewSec() : youtubePreviewSec();

  const work = await fs.mkdtemp(join(tmpdir(), "yt-render-"));

  const audioPath = join(work, "audio.bin");

  const outPath = join(work, "out.mp4");

  const trackKind = inferTrackKind(loop.stems_url, loop.name ?? "");
  const account = resolveYouTubePreferredAccount({ viralMeta, trackKind });
  const theme = playerThemeForAccount(account);



  try {

    await downloadToFile(loop.audio_url, audioPath);

    let coverPath: string | null = null;
    let stockVideoPath: string | null = null;
    let cardPath: string | null = null;
    let wordmarkPath: string | null = null;
    let dustPath: string | null = null;

    if (isViral) {
      const viralVisual = await resolveViralVisualAssets({
        loop,
        workDir: work,
        series: viralMeta!.series,
        loopId: loop.id,
      });
      coverPath = viralVisual.coverPath;
      stockVideoPath = viralVisual.stockVideoPath;
      if (viralVisual.mode === "cover" && !coverPath) {
        return res.status(500).json({ error: "viral_cover_unavailable" });
      }
    } else {
      coverPath = await resolveLoopCoverPath(loop, work);
      if (!coverPath) {
        return res.status(500).json({ error: "community_cover_unavailable" });
      }
      if (communityTemplateMode() === "player") {
        cardPath = join(work, "player-card.png");
        const themeId = theme;
        await renderPlayerCardPng({
          coverPath,
          title: loop.name ?? "Untitled",
          trackKind,
          theme: themeId,
          outPath: cardPath,
        });
        wordmarkPath = join(work, "wordmark.png");
        await renderBrandWordmarkPng(themeId, playerCardFramePos().cardY, wordmarkPath);
        if (getPlayerTheme(themeId).useDust) {
          dustPath = await ensureFilmDustTexture();
        }
      }
    }



    await runFfmpeg(

      buildYoutubeRenderArgs({

        coverPath,

        stockVideoPath,

        cardPath,

        wordmarkPath,

        dustPath,

        audioPath,

        outPath,

        maxSec,

        loopId,

        trackKind,

        stemsUrl: loop.stems_url,

        viralMeta,

        playerTheme: theme,

      }),

    );



    const bytes = await fs.readFile(outPath);

    if (bytes.byteLength < 8_000) {

      return res.status(500).json({ error: "render_too_small" });

    }



    res.setHeader("Content-Type", "video/mp4");

    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(bytes);

  } catch (e) {

    const msg = e instanceof Error ? e.message : "render_failed";

    return res.status(500).json({ error: msg.slice(0, 300) });

  } finally {

    await fs.rm(work, { recursive: true, force: true }).catch(() => undefined);

  }

}


