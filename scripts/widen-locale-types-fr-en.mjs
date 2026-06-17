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
    const original = content;
    content = content.replaceAll('"fr" | "en"', "AppLocale");
    content = content.replaceAll('"en" | "fr"', "AppLocale");
    if (content === original) continue;
    if (content.includes("AppLocale") && !content.includes(IMPORT_LINE)) {
      const firstImport = content.indexOf("import ");
      const end = content.indexOf("\n", firstImport);
      content = content.slice(0, end + 1) + IMPORT_LINE + "\n" + content.slice(end + 1);
    }
    fs.writeFileSync(full, content);
    console.log(full);
  }
}

walk(ROOT);
