import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "src/components/LoopCardItem.tsx");
let s = fs.readFileSync(file, "utf8");

const pinterestBlock =
  /if \(code === "pinterest_all_used"\) \{\s*toast\.error\([\s\S]*?\);\s*return;\s*\}\s*toast\.error\(locale === "fr"[\s\S]*?"Cover change failed"\);/;

if (pinterestBlock.test(s)) {
  s = s.replace(
    pinterestBlock,
    `if (code === "pinterest_all_used") {
          toast.error(lc.coverPinterestExhausted);
          return;
        }
        toast.error(lc.coverChangeFailed);`,
  );
} else {
  console.warn("pinterest block not found");
}

s = s.replace(
  /toast\.error\(locale === "fr" \? `Généré, mais l.enregistrement a échoué : \$\{message\}` : `Generated, but saving failed: \$\{message\}`\);/u,
  "toast.error(`${lc.generatedSaveFailedPrefix}${message}`);",
);

s = s.replace(
  /aria-label=\{locale === "fr" \? "Plus d.actions" : "More actions"\}/u,
  "aria-label={lc.moreActions}",
);

fs.writeFileSync(file, s);
console.log("LoopCardItem apostrophe fixes applied");
