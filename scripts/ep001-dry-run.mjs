import { readFile } from "node:fs/promises";
import { loadAssetRegistryFromFile } from "../dist/assets/loader.js";
import { VeoVideoProvider } from "../dist/providers/veo-provider.js";

async function loadEnv(path = ".env") {
  const text = await readFile(path, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

await loadEnv();
const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) throw new Error("GEMINI_API_KEY is missing from .env");

const episode = JSON.parse(await readFile("data/worlds/sabra-world/episodes/EP001.json", "utf8"));
const registry = await loadAssetRegistryFromFile("data/worlds/sabra-world/sabra-assets.canon.json");
const roles = ["FACE_IDENTITY", "BODY_IDENTITY", "COSTUME", "EXPRESSION", "ACTION", "PROPORTIONS"];
const assets = registry.resolveReferences({ worldId: "sabra-world", characterId: "sabra", roles, includeSupporting: true, maxPerRole: 2 });
const provider = new VeoVideoProvider({ apiKey, model: episode.baseline.model });

let shotCount = 0;
let totalSeconds = 0;
console.log(`EP001 DRY RUN — ${episode.title}`);
console.log(`MODEL ${episode.baseline.model}`);
console.log("NO GENERATION REQUESTS WILL BE SENT");

for (const scene of episode.scenes) {
  console.log(`SCENE ${scene.id} | ${scene.location} | ${scene.timeOfDay ?? "unspecified"}`);
  for (const shot of scene.shots) {
    const prompt = `${shot.action} Emotional intent: ${shot.emotionalIntent ?? "natural"}. Location: ${scene.location}. Time: ${scene.timeOfDay ?? "natural"}. Maintain Sabra's exact facial identity, body proportions, costume, and natural appearance from the supplied CANON references. Realistic natural movement, stable anatomy, stable clothing details. No redesign, no age change, no facial drift, no costume substitution.`;
    const prepared = await provider.prepare({
      shot,
      prompt,
      modelTier: "premium",
      referenceAssetIds: assets.map((asset) => asset.id),
      referenceAssets: assets,
    });
    shotCount += 1;
    totalSeconds += shot.durationSeconds;
    console.log(`SHOT ${shot.id} | ${shot.kind} | ${shot.durationSeconds}s | refs=${prepared.selectedReferences.length}`);
    for (const asset of prepared.selectedReferences) console.log(`  - ${asset.role} | ${asset.canonTier ?? "UNTIERED"} | ${asset.id}`);
  }
}

console.log(`EP001 DRY RUN PASS — ${shotCount} shots | ${totalSeconds}s planned`);
console.log("GENERATION SPEND $0");
