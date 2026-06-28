import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = join(root, "apps", "mobile", "assets");

async function exportPng(svg, file, size) {
  const { default: sharp } = await import("sharp");
  const out = join(assetsDir, file);
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log(`Wrote apps/mobile/assets/${file} (${size}x${size})`);
}

async function main() {
  mkdirSync(assetsDir, { recursive: true });
  const cloudSvg = join(root, "public", "favicon-cloud-transparent.svg");
  await exportPng(cloudSvg, "icon.png", 1024);
  await exportPng(cloudSvg, "splash-icon.png", 512);
  await exportPng(cloudSvg, "adaptive-icon.png", 1024);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
