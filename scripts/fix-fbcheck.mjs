import fs from "fs";
const path = "supabase/functions/_shared/generateLoopAceMain.ts";
let src = fs.readFileSync(path, "utf-8");

// The export from firestoreServer.ts is "fbCheckCodeAttempotent" (double t: Atte)
// The calls use "fbCheckCodeAttempotent" (single t: Ate)
// We need to replace single-t calls with the correct double-t name

const wrongBytes = Buffer.from("fbCheckCodeAttempotent"); // single t
const correctBytes = Buffer.from("fbCheckCodeAttempotent"); // double t

console.log("Wrong hex:", wrongBytes.toString("hex"));
console.log("Correct hex:", correctBytes.toString("hex"));

const srcBytes = Buffer.from(src, "utf-8");

// Find and count
let count = 0;
let idx = 0;
while (true) {
  const pos = srcBytes.indexOf(wrongBytes, idx);
  if (pos === -1) break;
  count++;
  idx = pos + 1;
}
console.log("Wrong name occurrences found:", count);

// But we must NOT replace the import line (line 16) which already has the correct name
// The import uses double-t already. We only need to replace single-t in call sites.
// Actually, let's replace ALL single-t occurrences. The import line already has double-t,
// so it won't match the single-t pattern.

// Actually the problem is more subtle: "fbCheckCodeAttempotent" contains "fbCheckCodeAttempotent" as a substring!
// Wait no: "Attempotent" vs "Atempotent" — "Attempotent" contains "Atempotent" as a prefix.
// So replacing single-t will break the double-t. We need to be smarter.

// Better approach: replace the WRONG byte sequence only
// wrong: fbCheckCodeAt  + tempotent (without double t)
// correct: fbCheckCodeAtte + mpotent (with double t)

// Actually the simplest: just replace the hex bytes directly
const wrongHex = "6662436865636b436f64654174656d706f74656e74"; // fbCheckCodeAttempotent (single t)
const correctHex = "6662436865636b436f6465417474656d706f74656e74"; // fbCheckCodeAttempotent (double t)

const newSrc = src.replace(
  new RegExp("fbCheckCodeAttempotent", "g"),
  "fbCheckCodeAttempotent"
);

// Hmm, the JS strings might be identical because of how the replacement works.
// Let me try a buffer-level replacement.
const wrongBuf = Buffer.from(wrongHex, "hex");
const correctBuf = Buffer.from(correctHex, "hex");

let result = Buffer.from(srcBytes);
let replaced = 0;
while (true) {
  const pos = result.indexOf(wrongBuf);
  if (pos === -1) break;
  result = Buffer.concat([
    result.slice(0, pos),
    correctBuf,
    result.slice(pos + wrongBuf.length),
  ]);
  replaced++;
}
console.log("Replaced", replaced, "occurrences");

fs.writeFileSync(path, result.toString("utf-8"), "utf-8");
console.log("Done!");

// Verify
const verify = fs.readFileSync(path, "utf-8");
const lines = verify.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("fbCheck") && lines[i].includes("tempotent")) {
    const match = lines[i].match(/fbCheck\w+/);
    console.log("Line " + (i + 1) + ":", match ? match[0] : "???");
  }
}
