import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const manifestPath = resolve(process.argv[2] ?? "data/worlds/sabra-world/sabra-bulk-assets.generated.json");
const policyPath = resolve(process.argv[3] ?? "data/worlds/sabra-world/sabra-canon-policy.json");
const outputPath = resolve(process.argv[4] ?? "data/worlds/sabra-world/sabra-assets.canon.json");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const policy = JSON.parse(await readFile(policyPath, "utf8"));
if (!Array.isArray(manifest.assets) || !Array.isArray(policy.rules)) throw new Error("Invalid manifest or canon policy");

function sourceName(asset) {
  return String(asset.notes ?? "").match(/^Imported from (.+?)\. Promote to CANON/)?.[1] ?? null;
}

const bySource = new Map(manifest.assets.map((asset) => [sourceName(asset), asset]));
const missing = policy.rules.filter((rule) => !bySource.has(rule.match)).map((rule) => rule.match);
if (missing.length) throw new Error(`Canon policy references missing assets: ${missing.join(", ")}`);

const duplicateCanonHashes = new Map();
const promoted = manifest.assets.map((asset) => {
  const source = sourceName(asset);
  const rule = policy.rules.find((item) => item.match === source);
  if (!rule) return { ...asset, status: "CANDIDATE" };

  const next = { ...asset, status: rule.status, role: rule.role };
  if (rule.canonTier) next.canonTier = rule.canonTier;
  else delete next.canonTier;
  if (rule.reason) next.notes = `${asset.notes ?? ""} ${rule.reason}`.trim();

  if (next.status === "CANON" && next.sha256) {
    const prior = duplicateCanonHashes.get(next.sha256);
    if (prior) throw new Error(`Duplicate CANON content: ${prior} and ${source}`);
    duplicateCanonHashes.set(next.sha256, source);
  }
  return next;
});

const output = {
  version: policy.version,
  worldId: policy.worldId,
  characterId: policy.characterId,
  generatedAt: new Date().toISOString(),
  sourceManifest: manifestPath,
  policy: policyPath,
  assets: promoted,
};

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
const counts = promoted.reduce((acc, asset) => ({ ...acc, [asset.status]: (acc[asset.status] ?? 0) + 1 }), {});
console.log(`CANON MANIFEST ${outputPath}`);
console.log(`CANON ${counts.CANON ?? 0} | CANDIDATE ${counts.CANDIDATE ?? 0} | RETIRED ${counts.RETIRED ?? 0}`);
