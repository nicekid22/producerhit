#!/usr/bin/env node
/**
 * Writes public/.well-known/apple-app-site-association for iOS Universal Links.
 *
 * Usage:
 *   APPLE_TEAM_ID=ABCDE12345 node scripts/generate-aasa.mjs
 *
 * Get Team ID: developer.apple.com → Membership
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public", ".well-known");
const outFile = path.join(outDir, "apple-app-site-association");

const teamId = (process.env.APPLE_TEAM_ID || process.env.EXPO_APPLE_TEAM_ID || "").trim();
const bundleId = (process.env.IOS_BUNDLE_ID || "com.producerhit.app").trim();

if (!teamId) {
  console.warn(
    "[generate-aasa] APPLE_TEAM_ID not set — writing template with REPLACE_TEAM_ID (universal links inactive until replaced).",
  );
}

const appId = `${teamId || "REPLACE_TEAM_ID"}.${bundleId}`;

const aasa = {
  applinks: {
    apps: [],
    details: [
      {
        appIDs: [appId],
        paths: ["/loop/*", "/play/*"],
      },
    ],
  },
  webcredentials: {
    apps: [appId],
  },
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(aasa, null, 2)}\n`, "utf8");
console.log(`[generate-aasa] Wrote ${outFile} for appID ${appId}`);
