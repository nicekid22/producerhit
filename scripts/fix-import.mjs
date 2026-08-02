import fs from "fs";
const path = "supabase/functions/_shared/generateLoopAceMain.ts";
let src = fs.readFileSync(path, "utf-8");

// The import line currently imports "fbCheckCodeAttempotent" (hex: ...436f6465...)
// But firestoreServer exports "fbCheckCodeAttempotent" (hex: ...5573616765...)
// Fix: change the import to use the correct name and alias it

const importLine = "  fbCheckCodeAttempotent,";
const fixedImportLine = "  fbCheckCodeAttempotent as fbCheckCodeAttempotent,";

// The line bytes we're looking for (hex of "  fbCheckCodeAttempotent,")
const wrongImportHex = "20206662436865636b436f6465417474656d706f74656e742c"; // with comma
const correctImportHex = "20206662436865636b55736167654964656d706f74656e74206173206662436865636b436f6465417474656d706f74656e742c";

const wrongBuf = Buffer.from(wrongImportHex, "hex");
const correctBuf = Buffer.from(correctImportHex, "hex");

const srcBuf = Buffer.from(src, "utf-8");
const importIdx = srcBuf.indexOf(wrongBuf);
if (importIdx === -1) {
  console.log("Import line not found with exact bytes. Searching...");

  // Search for the import line manually
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("tempotent")) {
      const buf = Buffer.from(lines[i]);
      console.log(`Line ${i + 1} hex: ${buf.toString("hex")}`);
      console.log(`Line ${i + 1}: ${lines[i]}`);
    }
  }
  process.exit(1);
}

// Replace just the import line
const newSrcBuf = Buffer.concat([
  srcBuf.slice(0, importIdx),
  correctBuf,
  srcBuf.slice(importIdx + wrongBuf.length),
]);

fs.writeFileSync(path, newSrcBuf.toString("utf-8"), "utf-8");
console.log("Fixed import line in generateLoopAceMain.ts");

// Verify
const verify = fs.readFileSync(path, "utf-8");
const lines = verify.split("\n");
console.log("Import line:", lines[15]);
console.log("Call sites:");
[514, 1817, 1897, 2317].forEach((i) => {
  if (lines[i]) console.log(`  Line ${i + 1}: ${lines[i].trim()}`);
});
