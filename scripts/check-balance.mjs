import fs from "fs";
const file = fs.readFileSync("supabase/functions/_shared/generateLoopAceMain.ts", "utf-8");
const lines = file.split("\n");
let b = 0, p = 0;
let negB = null, negP = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Simple string-aware counting (handles double-quoted and single-quoted strings)
  let inStr = false, strCh = null;
  let inTemplate = false;
  let j = 0;
  while (j < line.length) {
    const c = line[j];
    if (inStr) {
      if (c === '\\') { j += 2; continue; }
      if (c === strCh) inStr = false;
    } else {
      if (c === '"' || c === "'") { inStr = true; strCh = c; }
      else if (c === '{') b++;
      else if (c === '}') b--;
      else if (c === '(') p++;
      else if (c === ')') p--;
    }
    j++;
  }
  if (b < 0 && negB === null) negB = i + 1;
  if (p < 0 && negP === null) negP = i + 1;
}
console.log(`Final: b=${b} p=${p}`);
console.log(`First negative brace at line: ${negB}`);
console.log(`First negative paren at line: ${negP}`);

// Now find every line where the balance goes negative for the first time
// Reset and scan again
b = 0; p = 0;
const negLines = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const prevB = b, prevP = p;
  let inStr = false, strCh = null;
  let j = 0;
  while (j < line.length) {
    const c = line[j];
    if (inStr) {
      if (c === '\\') { j += 2; continue; }
      if (c === strCh) inStr = false;
    } else {
      if (c === '"' || c === "'") { inStr = true; strCh = c; }
      else if (c === '{') b++;
      else if (c === '}') b--;
      else if (c === '(') p++;
      else if (c === ')') p--;
    }
    j++;
  }
  if (b < 0 || p < 0) {
    negLines.push({ line: i + 1, b, p, prevB, prevP, text: line.trim().substring(0, 100) });
  }
  if (negLines.length > 20) break;
}

console.log("\nLines where balance goes negative:");
for (const nl of negLines) {
  console.log(`  Line ${nl.line}: b=${nl.b} p=${nl.p} (was ${nl.prevB}/${nl.prevP}) | ${nl.text}`);
}
