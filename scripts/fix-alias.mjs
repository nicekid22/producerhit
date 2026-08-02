import fs from "fs";

// Step 1: Add alias export in firestoreServer.ts
const fsPath = "supabase/functions/_shared/firestoreServer.ts";
let fsSrc = fs.readFileSync(fsPath, "utf-8");

// The function is exported as "fbCheckCodeAttempotent" (Usage+Idempotent)
// generateLoopAceMain.ts calls "fbCheckCodeAttempotent" (Code+Atempotent)
// Add a simple re-export alias after the function

const aliasCode = `
/** Alias — generateLoopAceMain.ts references this name */
export { fbCheckCodeAttempotent as fbCheckCodeAttempotent };
`;

// Find the closing of fbCheckCodeAttempotent function and insert alias after it
// The function ends with "return { ok, plan, used, limit };\n}"
const marker = "return { ok, plan, used, limit };\n}";
const idx = fsSrc.indexOf(marker);
if (idx === -1) {
  console.log("Could not find function end marker in firestoreServer.ts");
  // Try alternate approach: find the export line and add alias at end of file
  if (!fsSrc.includes("fbCheckCodeAttempotent")) {
    console.log("fbCheckCodeAttempotent not found at all!");
    process.exit(1);
  }
} else {
  fsSrc = fsSrc.slice(0, idx + marker.length) + "\n" + aliasCode + "\n" + fsSrc.slice(idx + marker.length);
  fs.writeFileSync(fsPath, fsSrc, "utf-8");
  console.log("Added alias export in firestoreServer.ts");
}

// Verify
const verify = fs.readFileSync(fsPath, "utf-8");
if (verify.includes("as fbCheckCodeAttempotent")) {
  console.log("Alias export verified!");
} else {
  console.log("WARNING: Alias export not found after write");
}
