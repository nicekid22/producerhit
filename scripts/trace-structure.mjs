import fs from "fs";
const file = fs.readFileSync("supabase/functions/_shared/generateLoopAceMain.ts", "utf-8");
const lines = file.split("\n");

// Track brace stack precisely
const stack = [];
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
      else if (c === '{') stack.push(i + 1);
      else if (c === '}') {
        if (stack.length > 0) stack.pop();
        else console.log(`ORPHAN } at line ${i + 1}: ${line.trim().substring(0, 80)}`);
      }
    }
  }
}

console.log(`\nFinal stack size: ${stack.length}`);
if (stack.length > 0) {
  console.log("Unclosed { at lines:", stack.join(", "));
  for (const l of stack.slice(-5)) {
    console.log(`  Line ${l}: ${lines[l-1].trim().substring(0, 100)}`);
  }
}

// Now trace the critical section: function handleGenerateLoopAceRequest
// Find the function start and trace its braces
console.log("\n=== Tracing function handleGenerateLoopAceRequest ===");
const funcStart = 1411; // line number (0-indexed: 1410)
const funcStack = [];
for (let i = funcStart; i < lines.length; i++) {
  const line = lines[i];
  let inStr = false, strCh = null;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (inStr) {
      if (c === '\\') { j++; continue; }
      if (c === strCh) inStr = false;
    } else {
      if (c === '"' || c === "'") { inStr = true; strCh = c; }
      else if (c === '{') funcStack.push(i + 1);
      else if (c === '}') {
        if (funcStack.length > 0) {
          funcStack.pop();
        } else {
          console.log(`ORPHAN in function at line ${i + 1}: ${line.trim().substring(0, 80)}`);
        }
      }
    }
  }
}
console.log(`Function stack size after processing: ${funcStack.length}`);
if (funcStack.length > 0) {
  console.log("Unclosed { in function at lines:", funcStack.join(", "));
  for (const l of funcStack) {
    console.log(`  Line ${l}: ${lines[l-1].trim().substring(0, 100)}`);
  }
}

// Check the critical area: find every } between lines 1860-1870
console.log("\n=== Lines 1858-1870 detail ===");
const testStack = [];
for (let i = 0; i < 1870; i++) {
  const line = lines[i];
  let inStr = false, strCh = null;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (inStr) {
      if (c === '\\') { j++; continue; }
      if (c === strCh) inStr = false;
    } else {
      if (c === '"' || c === "'") { inStr = true; strCh = c; }
      else if (c === '{') testStack.push(i + 1);
      else if (c === '}') {
        if (testStack.length > 0) testStack.pop();
      }
    }
  }
  if (i >= 1857 && i < 1870) {
    console.log(`  Line ${i+1}: stack_depth=${testStack.length} | ${lines[i].trim().substring(0, 80)}`);
  }
}
console.log(`Stack depth at line 1870: ${testStack.length}`);
