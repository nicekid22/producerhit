import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extDir = path.join(__dirname, "ext");
const out = path.join(__dirname, "prompts-extended-all.json");

const merged = {};
for (const f of fs.readdirSync(extDir).filter((x) => x.endsWith(".json"))) {
  Object.assign(merged, JSON.parse(fs.readFileSync(path.join(extDir, f), "utf8")));
}
fs.writeFileSync(out, JSON.stringify(merged, null, 2));
console.log("Merged", Object.keys(merged).length, "from", extDir);
