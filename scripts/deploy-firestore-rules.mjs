// Deploy Firestore security rules
import { readFileSync } from "fs";
import { GoogleAuth } from "google-auth-library";

const rulesContent = readFileSync("C:/Users/dylar/Documents/ProducerKit AI - Cursor 2/firestore.rules", "utf8");
const sa = JSON.parse(readFileSync("C:/Users/dylar/Documents/ProducerKit AI - Cursor 2/firebase-service-account.json", "utf8"));

async function fetchAPI(method, url, body) {
  const auth = new GoogleAuth({ credentials: sa, scopes: ["https://www.googleapis.com/auth/firebase", "https://www.googleapis.com/auth/cloud-platform"] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const opts = { method, headers: { Authorization: "Bearer " + token.token, "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  return { ok: res.ok, data };
}

async function main() {
  const base = "https://firebaserules.googleapis.com/v1/projects/" + sa.project_id;

  // Step 1: Create ruleset
  const r1 = await fetchAPI("POST", base + "/rulesets", {
    source: { files: [{ name: "firestore.rules", content: rulesContent }] },
  });
  if (!r1.ok) { console.error("Ruleset FAILED", JSON.stringify(r1.data)); process.exit(1); }
  console.log("Ruleset OK:", r1.data.name);

  // Step 2: Release (try POST first, fallback PATCH)
  let releaseOK = false;
  const fullName = "projects/" + sa.project_id + "/releases/cloud.firestore";
  // POST
  const r2 = await fetchAPI("POST", base + "/releases", {
    name: fullName,
    rulesetName: r1.data.name,
  });
  if (r2.ok) { releaseOK = true; console.log("Release CREATED:", r2.data.name); }
  else {
    // Try PATCH (release already exists)
    const r3 = await fetchAPI("PATCH", base + "/releases/cloud.firestore", {
      rulesetName: r1.data.name,
    });
    if (r3.ok) { releaseOK = true; console.log("Release UPDATED:", r3.data.name); }
    else { console.error("Release FAILED", JSON.stringify(r3.data)); process.exit(1); }
  }

  console.log("Firestore security rules deployed!");
}

main().catch(console.error);
