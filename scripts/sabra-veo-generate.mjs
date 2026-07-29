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
  status: "generating",
};

const provider = new VeoVideoProvider({ apiKey, model: process.env.VEO_MODEL || "veo-3.1-generate-preview" });
const prompt = `${shot.action} Emotional intent: ${shot.emotionalIntent}. Maintain Sabra's exact facial identity, body proportions, costume, and natural appearance from the supplied CANON references. Realistic natural movement, restrained expression, stable anatomy, stable clothing details. No redesign, no age change, no facial drift, no costume substitution.`;

console.log("REAL VEO GENERATION — THIS REQUEST MAY INCUR GEMINI API CHARGES");
console.log(`MODEL ${process.env.VEO_MODEL || "veo-3.1-generate-preview"}`);
console.log("SHOT 8s | 16:9 | 720p | 1 sample");

const result = await provider.generate({
  shot,
  prompt,
  modelTier: "premium",
  referenceAssetIds: assets.map((asset) => asset.id),
  referenceAssets: assets,
});

console.log("SABRA VEO GENERATION PASS");
console.log(`PROVIDER ${result.provider}`);
console.log(`MODEL ${result.model}`);
console.log(`DURATION ${result.durationSeconds}s`);
console.log(`VIDEO ${result.assetId}`);
console.log("NOTE: Gemini-generated video URLs can be temporary; preserve the result in factory storage before production use.");
