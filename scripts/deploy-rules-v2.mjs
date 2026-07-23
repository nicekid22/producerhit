import { readFileSync } from "fs";
import admin from "firebase-admin";

const sa = JSON.parse(readFileSync("C:/Users/dylar/Documents/ProducerKit AI - Cursor 2/firebase-service-account.json", "utf8"));
const rulesContent = readFileSync("C:/Users/dylar/Documents/ProducerKit AI - Cursor 2/firestore.rules", "utf8");

admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });

async function main() {
  const rules = admin.securityRules();
  const release = await rules.releaseFirestoreRulesetFromSource(rulesContent);
  console.log("Released:", release.name);
}
main().catch(console.error);
