/**
 * Preview A/B metadata variants per channel (no API call).
 * Usage: npm run youtube:preview-metadata -- [loopId] [--account vibez]
 */
import { previewAllAbVariants } from "../lib/youtubeMetadata.mjs";

const loopId = process.argv.find((a, i) => i >= 2 && !a.startsWith("--") && process.argv[i - 1] !== "--account") ?? "demo-loop-id";
const accIdx = process.argv.indexOf("--account");
const account = accIdx >= 0 ? process.argv[accIdx + 1] : "";

const all = previewAllAbVariants(loopId, account || null);
for (const [id, meta] of Object.entries(all)) {
  console.log(`\n=== ${id.toUpperCase()} (title ${meta.ab.titleVariant} / desc ${meta.ab.descVariant}) ===`);
  console.log("TITLE:", meta.title);
  console.log("TAGS:", meta.tags.join(", "));
  console.log("DESC:", meta.description.slice(0, 320) + "…");
}
