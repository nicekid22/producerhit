import fs from "fs";

function parseCatalog(path) {
  const t = fs.readFileSync(path, "utf8");
  const re = /g\(\s*\n\s*"([^"]+)",\s*\n\s*"([^"]+)",\s*\n\s*"([^"]+)",\s*\n\s*"([^"]+)"/g;
  const out = [];
  let m;
  while ((m = re.exec(t))) {
    out.push({ value: m[1], group: m[2], prompt: m[3], aceTags: m[4] });
  }
  return out;
}

for (const f of [
  "src/lib/genres/latinWorldCatalog.ts",
  "src/lib/genres/worldWave2Catalog.ts",
  "src/lib/genres/hipHopSoulCatalog.ts",
  "src/lib/genres/extendedCatalog.ts",
]) {
  const items = parseCatalog(f);
  const bad = items.filter((x) =>
    /modern underground|clean mix|radio-ready|authentic|polished mix/i.test(x.prompt),
  );
  const groups = {};
  for (const x of items) groups[x.group] = (groups[x.group] || 0) + 1;
  console.log("\n===", f, "===");
  console.log("count", items.length, "bad", bad.length);
  console.log(groups);
}
