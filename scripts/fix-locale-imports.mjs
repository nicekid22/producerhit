import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src");
const BAD = /import \{\r?\nimport type \{ AppLocale \} from "@\/i18n\/config";\r?\n/g;
const IMPORT = 'import type { AppLocale } from "@/i18n/config";\n';

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules") walk(full);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    let content = fs.readFileSync(full, "utf8");
    if (!BAD.test(content)) continue;
    content = content.replace(BAD, "import {\n");
    if (!content.includes(IMPORT.trim())) {
      const firstImport = content.indexOf("import ");
      const end = content.indexOf("\n", firstImport);
      content = content.slice(0, end + 1) + IMPORT + content.slice(end + 1);
    }
    // dedupe duplicate AppLocale imports
    const lines = content.split("\n");
    const seen = new Set();
    const out = [];
    for (const line of lines) {
      if (line.includes('import type { AppLocale }')) {
        if (seen.has("applocale")) continue;
        seen.add("applocale");
      }
      out.push(line);
    }
    fs.writeFileSync(full, out.join("\n"));
    console.log("fixed", full);
  }
}

walk(ROOT);
