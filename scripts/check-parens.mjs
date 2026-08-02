import fs from "fs";
const file = fs.readFileSync("supabase/functions/_shared/generateLoopAceMain.ts", "utf-8");
const lines = file.split("\n");

// Check paren balance ignoring comments and strings
let p = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let inStr = false, strCh = null;
  let inComment = false;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (inStr) {
      if (c === '\\') { j++; continue; }
      if (c === strCh) inStr = false;
    } else if (inComment) {
      // skip
    } else {
      if (c === '"' || c === "'") { inStr = true; strCh = c; }
      else if (c === '/' && j+1 < line.length && line[j+1] === '/') { inComment = true; }
      else if (c === '(') p++;
      else if (c === ')') p--;
    }
  }
}
console.log("Paren balance (ignoring comments/strings):", p);

// Also check: which lines have extra ) in comments?
p = 0;
const commentIssues = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Count parens in the whole line
  let allP = 0;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (c === '(') allP++;
    else if (c === ')') allP--;
  }
  // Count parens excluding comments
  let codeP = 0;
  let inStr2 = false, strCh2 = null;
  let inComment2 = false;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (inStr2) {
      if (c === '\\') { j++; continue; }
      if (c === strCh2) inStr2 = false;
    } else if (inComment2) {
      // skip
    } else {
      if (c === '"' || c === "'") { inStr2 = true; strCh2 = c; }
      else if (c === '/' && j+1 < line.length && line[j+1] === '/') { inComment2 = true; }
      else if (c === '(') codeP++;
      else if (c === ')') codeP--;
    }
  }
  if (allP !== codeP) {
    commentIssues.push({ line: i + 1, codeP, allP, diff: allP - codeP, text: line.trim().substring(0, 100) });
  }
}
console.log("\nLines with unbalanced parens in comments:");
for (const ci of commentIssues) {
  console.log(`  Line ${ci.line}: code_p=${ci.codeP} all_p=${ci.allP} (diff ${ci.diff}) | ${ci.text}`);
}
