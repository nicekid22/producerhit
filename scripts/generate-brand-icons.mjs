import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function exportPng(svg, file, size) {
  const { default: sharp } = await import("sharp");
  const out = join(root, file);
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log(`Wrote ${file} (${size}x${size})`);
}

async function main() {
  const prismSvg = readFileSync(join(root, "public", "favicon.svg"));
  await exportPng(prismSvg, "public/apple-touch-icon.png", 180);
  await exportPng(prismSvg, "public/icon-192.png", 192);
  await exportPng(prismSvg, "public/icon-512.png", 512);
  await exportPng(prismSvg, "public/favicon-32.png", 32);

  const warmSvg = readFileSync(join(root, "public", "favicon-warm.svg"));
  await exportPng(warmSvg, "public/apple-touch-icon-warm.png", 180);
  await exportPng(warmSvg, "public/favicon-warm-32.png", 32);

  for (const accent of ["transparent", "green", "red", "blue"]) {
    const cloudSvg = readFileSync(join(root, "public", `favicon-cloud-${accent}.svg`));
    await exportPng(cloudSvg, `public/apple-touch-icon-cloud-${accent}.png`, 180);
    await exportPng(cloudSvg, `public/favicon-cloud-${accent}-32.png`, 32);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
