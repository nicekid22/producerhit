import fs from "fs";

const BANNED =
  /modern underground|clean mix|polished mix|radio-ready|authentic production|modern production|festival polish|heartfelt chord|smooth heartfelt|generic|upbeat energy$/i;

const t = fs.readFileSync("src/lib/genres/extendedCatalog.ts", "utf8");
const re =
  /g\(\s*\n\s*"([^"]+)",\s*\n\s*"([^"]+)",\s*\n\s*"((?:[^"\\]|\\.)*)",\s*\n\s*"((?:[^"\\]|\\.)*)",\s*\n\s*(\d+),\s*\n\s*(\[[^\]]*\]),?\s*\n\s*\)/gs;
const items = [];
let m;
while ((m = re.exec(t))) {
  const prompt = m[3];
  const words = prompt.split(/\s+/).length;
  const weak = BANNED.test(prompt) || words < 18;
  items.push({ value: m[1], group: m[2], prompt, words, weak });
}
const weakOnes = items.filter((x) => x.weak);
console.log("total", items.length, "weak", weakOnes.length);
const by = {};
for (const x of weakOnes) (by[x.group] ??= []).push(x.value);
for (const [g, arr] of Object.entries(by)) {
  console.log("\n" + g + " (" + arr.length + ")");
  console.log(arr.join(", "));
}
