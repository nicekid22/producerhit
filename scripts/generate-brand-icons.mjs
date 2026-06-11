import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = join(root, "public", "favicon.svg");
const svg = readFileSync(svgPath);

async function main() {
  const { default: sharp } = await import("sharp");
  const sizes = [
    ["public/apple-touch-icon.png", 180],
    ["public/icon-192.png", 192],
    ["public/icon-512.png", 512],
    ["public/favicon-32.png", 32],
  ];

  for (const [file, size] of sizes) {
    const out = join(root, file);
    await sharp(svg).resize(size, size).png().toFile(out);
    console.log(`Wrote ${file} (${size}x${size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
