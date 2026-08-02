import fs from "fs";
const file = fs.readFileSync("supabase/functions/_shared/generateLoopAceMain.ts", "utf-8");
const lines = file.split("\n");

// Simple brace/paren counter (ignoring strings for simplicity - good enough to find orphans)
let b = 0, p = 0;
const balanceLog = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let inStr = false, strCh = null;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (inStr) {
      if (c === '\\') { j++; continue; }
      if (c === strCh) inStr = false;
    } else {
      if (c === '"' || c === "'") { inStr = true; strCh = c; }
      else if (c === '{') b++;
      else if (c === '}') b--;
      else if (c === '(') p++;
      else if (c === ')') p--;
    }
  }
  balanceLog.push({ line: i + 1, b, p, text: line });
}

console.log(`Final balance: b=${b} p=${p}`);
console.log(`Need to remove ${-b} extra '}' and ${-p} extra ')'`);

// Find lines where closing brace drops balance below what the surrounding context expects
// Strategy: find every } that brings the balance to a value it shouldn't reach
// We'll do a second pass tracking what "should" be the balance based on structural context

// Alternative approach: look at each } and check if removing it would fix the balance
console.log("\n=== Lines with closing braces where b goes below expected levels ===");

// Let's try removing each } one at a time and see which ones, when removed, fix the balance
// But smarter: find lines where b drops to 0 or below when it shouldn't

// Look for consecutive } at the end of blocks
let orphanCandidates = [];
for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  if (trimmed === "}" || trimmed.match(/^\}\s*\}\s*$/)) {
    // This line has one or more closing braces
    const opens = (lines[i].match(/\{/g) || []).length;
    const closes = (lines[i].match(/\}/g) || []).length;
    if (closes > opens) {
      orphanCandidates.push({
        line: i + 1,
        b_after: balanceLog[i].b,
        p_after: balanceLog[i].p,
        closes: closes - opens,
        text: lines[i].trim(),
      });
    }
  }
}

console.log("\nClosing-brace-heavy lines (potential orphans):");
for (const c of orphanCandidates) {
  console.log(`  Line ${c.line}: b=${c.b_after} p=${c.p_after} (${c.closes} excess }) | ${c.text.substring(0, 80)}`);
}

// Now find extra parens
console.log("\n=== Lines with extra closing parens ===");
let parenCandidates = [];
for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  const opens = (lines[i].match(/\(/g) || []).length;
  const closes = (lines[i].match(/\)/g) || []).length;
  if (closes > opens + 1) {
    // More than 1 extra )
    parenCandidates.push({
      line: i + 1,
      b_after: balanceLog[i].b,
      p_after: balanceLog[i].p,
      extra: closes - opens,
      text: lines[i].trim(),
    });
  }
}
console.log("Lines with extra closing parens:");
for (const c of parenCandidates) {
  console.log(`  Line ${c.line}: b=${c.b_after} p=${c.p_after} (${c.extra} excess )) | ${c.text.substring(0, 100)}`);
}

// Also: find where each orphan pushes balance negative
console.log("\n=== Where balance first goes to -1, -2, -3 for braces ===");
b = 0;
let foundLevels = new Set();
for (let i = 0; i < lines.length; i++) {
  let inStr = false, strCh = null;
  for (let j = 0; j < lines[i].length; j++) {
    const c = lines[i][j];
    if (inStr) {
      if (c === '\\') { j++; continue; }
      if (c === strCh) inStr = false;
    } else {
      if (c === '"' || c === "'") { inStr = true; strCh = c; }
      else if (c === '{') b++;
      else if (c === '}') b--;
    }
  }
  if (b < 0 && !foundLevels.has(b)) {
    foundLevels.add(b);
    console.log(`  First b=${b} at line ${i + 1}: ${lines[i].trim().substring(0, 100)}`);
  }
}

// And for parens
p = 0;
foundLevels = new Set();
for (let i = 0; i < lines.length; i++) {
  let inStr = false, strCh = null;
  for (let j = 0; j < lines[i].length; j++) {
    const c = lines[i][j];
    if (inStr) {
      if (c === '\\') { j++; continue; }
      if (c === strCh) inStr = false;
    } else {
      if (c === '"' || c === "'") { inStr = true; strCh = c; }
      else if (c === '(') p++;
      else if (c === ')') p--;
    }
  }
  if (p < 0 && !foundLevels.has(p)) {
    foundLevels.add(p);
    console.log(`  First p=${p} at line ${i + 1}: ${lines[i].trim().substring(0, 100)}`);
  }
}
