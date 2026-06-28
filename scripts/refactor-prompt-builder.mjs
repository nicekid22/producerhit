import fs from "fs";

const file = "src/lib/promptBuilder.ts";
let src = fs.readFileSync(file, "utf8");

// Replace GenerateParams export with re-export from shared
src = src.replace(
  /export type GenerateParams = \{[\s\S]*?\};/,
  "export type { GenerateParams } from \"@producerhit/shared\";",
);

const start = src.indexOf("function clean(s: string)");
const end = src.indexOf("export function buildRichPrompt");
if (start >= 0 && end > start) {
  const replacement =
    "export { buildAceCaption } from \"@producerhit/shared\";\n\n";
  src = src.slice(0, start) + replacement + src.slice(end);
}

fs.writeFileSync(file, src, "utf8");
console.log("updated promptBuilder.ts");
