import fs from "fs";
const path = "supabase/functions/_shared/generateLoopAceMain.ts";
const buf = fs.readFileSync(path);

// Export name in firestoreServer.ts: fbCheckCodeAttempotent
//   hex: 6662436865636b55736167654964656d706f74656e74
//   (f,b,C,h,e,c,k,U,s,a,g,e,I,d,e,m,p,o,t,e,n,t)

// Current call name in generateLoopAceMain.ts: fbCheckCodeAttempotent
//   hex: 6662436865636b436f6465417474656d706f74656e74
//   (f,b,C,h,e,c,k,C,o,d,e,A,t,t,e,m,p,o,t,e,n,t)

const wrongHex = "6662436865636b436f6465417474656d706f74656e74"; // CodeAttempotent (22 bytes)
const correctHex = "6662436865636b55736167654964656d706f74656e74"; // UsageIdempotent (22 bytes)

const wrongBuf = Buffer.from(wrongHex, "hex");
const correctBuf = Buffer.from(correctHex, "hex");

console.log("Wrong:", wrongBuf.toString(), "(hex:", wrongBuf.toString("hex") + ")");
console.log("Correct:", correctBuf.toString(), "(hex:", correctBuf.toString("hex") + ")");

// Find all occurrences
let count = 0;
let idx = 0;
const positions = [];
while (true) {
  const pos = buf.indexOf(wrongBuf, idx);
  if (pos === -1) break;
  positions.push(pos);
  count++;
  idx = pos + 1;
}
console.log("Found", count, "occurrences of wrong name");

// Replace them
let result = buf;
for (const pos of positions.reverse()) {
  result = Buffer.concat([
    result.slice(0, pos),
    correctBuf,
    result.slice(pos + wrongBuf.length),
  ]);
}

fs.writeFileSync(path, result, "utf-8");
console.log("Replaced", count, "occurrences");

// Verify
const verify = fs.readFileSync(path, "utf-8");
const lines = verify.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("tempotent")) {
    const match = lines[i].match(/fbCheck\w+/);
    if (match) {
      console.log(`Line ${i + 1}: ${match[0]}`);
    }
  }
}
