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

const registry = await loadAssetRegistryFromFile("data/worlds/sabra-world/sabra-assets.canon.json");
const roles = ["FACE_IDENTITY", "BODY_IDENTITY", "COSTUME", "EXPRESSION", "PROPORTIONS"];
const assets = registry.resolveReferences({ worldId: "sabra-world", characterId: "sabra", roles, includeSupporting: true, maxPerRole: 2 });

const shot = {
  id: "shot-1",
  sceneId: "sabra-pilot-01",
  kind: "character",
  durationSeconds: 8,
  characters: ["sabra"],
  action: "Sabra stands naturally in her outdoor environment, notices the camera, and gives a subtle confident smile.",
  emotionalIntent: "warm, natural, confident",
  eyeContactTarget: "camera",
  status: "planned",
};

const provider = new VeoVideoProvider({ apiKey, model: process.env.VEO_MODEL || "veo-3.1-generate-preview" });
const prepared = await provider.prepare({
  shot,
  prompt: `${shot.action} Emotional intent: ${shot.emotionalIntent}. Maintain Sabra's exact facial identity, body proportions, costume, and natural appearance from the supplied CANON references. No redesign, no age change, no facial drift, no costume substitution.`,
  modelTier: "premium",
  referenceAssetIds: assets.map((asset) => asset.id),
  referenceAssets: assets,
});

console.log("SABRA VEO PAYLOAD DRY RUN PASS");
console.log(`MODEL ${prepared.model}`);
console.log(`SHOT ${shot.durationSeconds}s | 16:9 | 720p`);
console.log(`CANON INPUTS ${assets.length}`);
console.log(`VEO REFERENCES ${prepared.selectedReferences.length}`);
for (const asset of prepared.selectedReferences) console.log(`- ${asset.role} | ${asset.canonTier ?? "UNTIERED"} | ${asset.id}`);
const bodyText = JSON.stringify(prepared.body);
console.log(`ENCODED PAYLOAD ${(Buffer.byteLength(bodyText) / 1024 / 1024).toFixed(2)} MiB`);
console.log("NO VEO GENERATION REQUEST SENT — generation spend: $0");
