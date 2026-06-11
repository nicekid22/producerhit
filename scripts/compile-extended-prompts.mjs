import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

import { spawnSync } from "child_process";
const r = spawnSync(process.execPath, [path.join(__dirname, "merge-ext-json.mjs")], {
  stdio: "inherit",
});
process.exit(r.status ?? 1);
