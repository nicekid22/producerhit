import fs from "fs";
const file = fs.readFileSync("supabase/functions/_shared/generateLoopAceMain.ts", "utf-8");
const lines = file.split("\n");

// Track running brace balance
let b = 0;
const events = []; // Track every line where b changes

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let inStr = false, strCh = null;
  let delta = 0;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (inStr) {
      if (c === '\\') { j++; continue; }
      if (c === strCh) inStr = false;
    } else {
      if (c === '"' || c === "'") { inStr = true; strCh = c; }
      else if (c === '{') { b++; delta++; }
      else if (c === '}') { b--; delta--; }
    }
  }
  if (delta !== 0) {
    events.push({ line: i + 1, delta, balance: b, text: line.trim().substring(0, 100) });
  }
}

// Find orphaned } by looking at closing braces that bring balance to a new local minimum
console.log("=== All lines where } drops balance below 0 ===");
let minBalance = 0;
for (const e of events) {
  if (e.delta < 0 && e.balance < 0) {
    console.log(`  Line ${e.line}: b=${e.balance} (delta ${e.delta}) | ${e.text}`);
  }
}

// Now trace the full structure: find every { } pair and check for mismatches
console.log("\n=== Tracing open/close pairs ===");
// Reset and track
b = 0;
const stack = []; // Stack of opening braces
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
      else if (c === '{') {
        stack.push(i + 1);
      } else if (c === '}') {
        if (stack.length > 0) {
          stack.pop();
        } else {
          console.log(`  ORPHAN } at line ${i + 1}: ${line.trim().substring(0, 100)}`);
        }
      }
    }
  }
}
console.log(`\nRemaining unclosed { on stack: ${stack.length}`);
for (const l of stack) {
  console.log(`  Unclosed { at line ${l}: ${lines[l-1].trim().substring(0, 100)}`);
}
