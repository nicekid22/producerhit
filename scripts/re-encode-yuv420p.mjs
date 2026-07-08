#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "..", "test-output-8scenes");
const CLIPS = join(DIR, "clips");

function escFont(fp) {
  return fp.replace(/\\/g, "/").replace(/:/g, "\\:");
}

const FONTS = {
  bebas: escFont(join(__dirname, "..", "fonts", "BebasNeue-Regular.ttf")),
  montserrat: escFont(join(__dirname, "..", "fonts", "Montserrat-ExtraBold.ttf")),
  orbitron: escFont(join(__dirname, "..", "fonts", "Orbitron-Bold.ttf")),
};

const VHS = "noise=c0s=8:allf=t+u,colorbalance=rs=0.08:gs=-0.02:bs=-0.08,vignette=PI/5";
const SCALE = "scale=1080:1920:flags=lanczos";

async function main() {
  await mkdir(CLIPS, { recursive: true });

  const clips = [];

  // Scene 1: I2V raw + overlays (none)
  console.log("Scene 1 — I2V (clean)");
  execSync(`ffmpeg -y -i "${DIR}/scene1-raw.mp4" -vf "${VHS},${SCALE}" -t 2 -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p -an "${CLIPS}/scene1-trim.mp4"`, { stdio: "inherit" });
  clips.push({ p: `${CLIPS}/scene1-trim.mp4`, d: 2 });

  // Scene 2: Pexels + "HIT"
  console.log("Scene 2 — Pexels boombox");
  const ov2 = `drawtext=text='HIT':fontfile='${FONTS.bebas}':fontsize=160:fontcolor=#FFD700:x=(w-text_w)/2:y=h*0.35`;
  execSync(`ffmpeg -y -i "${DIR}/scene2.mp4" -vf "${VHS},${SCALE},${ov2}" -t 2 -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p -an "${CLIPS}/scene2-trim.mp4"`, { stdio: "inherit" });
  clips.push({ p: `${CLIPS}/scene2-trim.mp4`, d: 2 });

  // Scene 3: I2V raw + "OR ITS"
  console.log("Scene 3 — I2V");
  const ov3 = `drawtext=text='OR ITS':fontfile='${FONTS.orbitron}':fontsize=70:fontcolor=#00BFFF:x=(w-text_w)/2:y=h*0.15`;
  execSync(`ffmpeg -y -i "${DIR}/scene3-raw.mp4" -vf "${VHS},${SCALE},${ov3}" -t 2 -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p -an "${CLIPS}/scene3-trim.mp4"`, { stdio: "inherit" });
  clips.push({ p: `${CLIPS}/scene3-trim.mp4`, d: 2 });

  // Scene 4: Pexels + "COLD"
  console.log("Scene 4 — Pexels street");
  const ov4 = `drawtext=text='COLD':fontfile='${FONTS.bebas}':fontsize=180:fontcolor=#FF4444:x=(w-text_w)/2:y=h*0.75`;
  execSync(`ffmpeg -y -i "${DIR}/scene4.mp4" -vf "${VHS},${SCALE},${ov4}" -t 2 -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p -an "${CLIPS}/scene4-trim.mp4"`, { stdio: "inherit" });
  clips.push({ p: `${CLIPS}/scene4-trim.mp4`, d: 2 });

  // Scene 5: I2V raw + "YOU FEEL IT"
  console.log("Scene 5 — I2V");
  const ov5 = `drawtext=text='YOU FEEL IT':fontfile='${FONTS.bebas}':fontsize=100:fontcolor=#FFFFFF:x=(w-text_w)/2:y=h*0.75`;
  execSync(`ffmpeg -y -i "${DIR}/scene5-raw.mp4" -vf "${VHS},${SCALE},${ov5}" -t 2 -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p -an "${CLIPS}/scene5-trim.mp4"`, { stdio: "inherit" });
  clips.push({ p: `${CLIPS}/scene5-trim.mp4`, d: 2 });

  // Scene 6: Pexels + "OR YOU DONT"
  console.log("Scene 6 — Pexels concert");
  const ov6 = `drawtext=text='OR YOU DONT':fontfile='${FONTS.montserrat}':fontsize=60:fontcolor=#FFFFFF:x=(w-text_w)/2:y=h*0.15`;
  execSync(`ffmpeg -y -i "${DIR}/scene6.mp4" -vf "${VHS},${SCALE},${ov6}" -t 2 -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p -an "${CLIPS}/scene6-trim.mp4"`, { stdio: "inherit" });
  clips.push({ p: `${CLIPS}/scene6-trim.mp4`, d: 2 });

  // Scene 7: I2V raw + "MAKE IT" + "HIT"
  console.log("Scene 7 — I2V");
  const ov7a = `drawtext=text='MAKE IT':fontfile='${FONTS.bebas}':fontsize=100:fontcolor=#FFD700:x=(w-text_w)/2:y=h*0.55`;
  const ov7b = `drawtext=text='HIT':fontfile='${FONTS.bebas}':fontsize=180:fontcolor=#FF6B00:x=(w-text_w)/2:y=h*0.72`;
  execSync(`ffmpeg -y -i "${DIR}/scene7-raw.mp4" -vf "${VHS},${SCALE},${ov7a},${ov7b}" -t 2 -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p -an "${CLIPS}/scene7-trim.mp4"`, { stdio: "inherit" });
  clips.push({ p: `${CLIPS}/scene7-trim.mp4`, d: 2 });

  // Scene 8: Logo black + overlays
  console.log("Scene 8 — Logo");
  const ov8a = `drawtext=text='THIS IS':fontfile='${FONTS.bebas}':fontsize=100:fontcolor=#FFD700:x=(w-text_w)/2:y=h*0.72`;
  const ov8b = `drawtext=text='HIT':fontfile='${FONTS.bebas}':fontsize=180:fontcolor=#FFD700:x=(w-text_w)/2:y=h*0.05`;
  const ov8c = `drawtext=text='PRODUCERHIT.COM':fontfile='${FONTS.montserrat}':fontsize=48:fontcolor=#FFFFFF:x=(w-text_w)/2:y=h*0.85`;
  execSync(`ffmpeg -y -f lavfi -i "color=c=black:s=1080x1920:d=1.5:r=30" -vf "${ov8a},${ov8b},${ov8c}" -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p "${CLIPS}/scene8-logo.mp4"`, { stdio: "inherit" });
  clips.push({ p: `${CLIPS}/scene8-logo.mp4`, d: 1.5 });

  // Concat list
  const concat = clips.map((c) => `file '${c.p.replace(/'/g, "'\\''")}'`).join("\n");
  await writeFile(join(DIR, "concat2.txt"), concat);

  // Assemble
  console.log("Assemblage...");
  execSync(`ffmpeg -y -f concat -safe 0 -i "${DIR}/concat2.txt" -c copy "${DIR}/assembled-yuv.mp4"`, { stdio: "inherit" });

  // Add music
  console.log("Mix final avec musique...");
  execSync(`ffmpeg -y -i "${DIR}/assembled-yuv.mp4" -i "${DIR}/music.mp3" -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p -af "afade=t=out:d=1.5" -c:a aac -b:a 192k -map 0:v:0 -map 1:a:0 -shortest -movflags +faststart "${DIR}/final-this-is-hit.mp4"`, { stdio: "inherit" });

  const { stat } = await import("node:fs/promises");
  const s = await stat(join(DIR, "final-this-is-hit.mp4"));
  console.log(`\n✅ final-this-is-hit.mp4 (${(s.size / 1024 / 1024).toFixed(1)} MB) — yuv420p`);
}

main().catch(console.error);
