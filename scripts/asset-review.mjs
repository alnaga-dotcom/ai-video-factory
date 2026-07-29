import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const manifestArg = process.argv[2] ?? "data/worlds/sabra-world/sabra-bulk-assets.generated.json";
const manifestPath = resolve(manifestArg);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

if (!Array.isArray(manifest.assets)) throw new Error(`Invalid asset manifest: ${manifestPath}`);

console.log(`MANIFEST ${manifestPath}`);
console.log(`WORLD ${manifest.worldId ?? "unknown"} | CHARACTER ${manifest.characterId ?? "unknown"} | ASSETS ${manifest.assets.length}`);
console.log("");

for (const [index, asset] of manifest.assets.entries()) {
  const source = String(asset.notes ?? "").match(/^Imported from (.+?)\. Promote to CANON/)?.[1] ?? "unknown source";
  console.log(`${String(index + 1).padStart(2, "0")}. ${source}`);
  console.log(`    ID:     ${asset.id}`);
  console.log(`    KIND:   ${asset.kind} | STATUS: ${asset.status}`);
  console.log(`    SHA256: ${asset.sha256}`);
  console.log(`    URI:    ${asset.uri}`);
}
