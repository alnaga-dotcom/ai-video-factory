import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const input = process.argv[2]?.trim();
if (!input) throw new Error("Usage: npm run generated:approve -- <generated-asset-record.json>");
const path = resolve(input);
const record = JSON.parse(await readFile(path, "utf8"));

if (record.kind !== "video") throw new Error("Only generated video records can be approved by this command");
if (record.status !== "CANDIDATE") throw new Error(`Expected CANDIDATE status, got ${record.status}`);
if (!record.uri || !record.sha256) throw new Error("Generated asset record is missing uri or sha256");

record.status = "APPROVED";
record.approval = {
  approvedAt: new Date().toISOString(),
  decision: "human-approved",
  criteria: ["identity", "body-proportions", "costume", "motion", "realism", "environment", "camera"],
};
record.notes = `${record.notes ?? ""} Human review approved this output as the Sabra production baseline.`.trim();

await writeFile(path, `${JSON.stringify(record, null, 2)}\n`, "utf8");
console.log("GENERATED ASSET APPROVED");
console.log(`ID ${record.id}`);
console.log(`VIDEO ${record.uri}`);
console.log(`SHA256 ${record.sha256}`);
console.log(`RECORD ${path}`);
