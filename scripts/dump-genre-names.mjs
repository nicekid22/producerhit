import fs from "fs";

const t = fs.readFileSync("src/lib/genres/hipHopSoulCatalog.ts", "utf8");
const re = /g\(\s*\n\s*"([^"]+)",\s*\n\s*"([^"]+)"/g;
const by = {};
let m;
while ((m = re.exec(t))) {
  (by[m[2]] ??= []).push(m[1]);
}
for (const [g, arr] of Object.entries(by)) {
  console.log("---" + g + "---");
  console.log(arr.join("\n"));
}
