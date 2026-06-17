import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src");
const IMPORT_LINE = 'import type { AppLocale } from "@/i18n/config";';

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules") walk(full);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    let content = fs.readFileSync(full, "utf8");
    if (!content.includes('"en" | "fr"')) continue;
    content = content.replaceAll('"en" | "fr"', "AppLocale");
    if (!content.includes(IMPORT_LINE) && content.includes("AppLocale")) {
      const lines = content.split("\n");
      let insertAt = 0;
      while (
        insertAt < lines.length &&
        (lines[insertAt].startsWith("import ") ||
          lines[insertAt].startsWith("//") ||
          lines[insertAt].trim() === "")
      ) {
        insertAt++;
      }
      lines.splice(insertAt, 0, IMPORT_LINE);
      content = lines.join("\n");
    }
    fs.writeFileSync(full, content);
    console.log(full);
  }
}

walk(ROOT);
