import { readFile } from "node:fs/promises";
import { loadAssetRegistryFromFile } from "../dist/assets/loader.js";

async function loadEnv(path = ".env") {
  try {
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
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

await loadEnv();
const registry = await loadAssetRegistryFromFile("data/worlds/sabra-world/sabra-assets.canon.json");
const sabraAssets = registry.resolveReferences({ worldId: "sabra-world", characterId: "sabra", roles: ["FACE_IDENTITY", "BODY_IDENTITY", "COSTUME", "EXPRESSION", "PROPORTIONS"], includeSupporting: true, maxPerRole: 2 });
const model = process.env.VEO_MODEL || "veo-3.1-generate-preview";

const plan = {
  id: "sabra-world-intro-v1",
  durationSeconds: 8,
  status: "DRY_RUN",
  beats: [
    {
      id: "beat-1-atmosphere",
      timing: "0.0-2.0s",
      source: "GENERATED_VIDEO",
      generation: { provider: "veo", model, references: [], humanLikeness: false },
      prompt: "Cinematic Egyptian Nile sunrise, palms and warm golden atmosphere establishing a welcoming rural world. No people, no text, no logos, premium restrained camera movement."
    },
    {
      id: "beat-2-sabra",
      timing: "2.0-5.5s",
      source: "CHARACTER_SHOT_PENDING_COMPATIBLE_ROUTE",
      generation: { provider: null, model: null, references: sabraAssets.map((asset) => asset.id), humanLikeness: true, blockedFromCurrentVeoRoute: true },
      direction: "Realistic Sabra in rustic outdoor kitchen, light beige apron, one elegant cooking action, then warm confident look to camera.",
      guardrail: "Do not submit the current realistic Sabra reference payload to Veo again after RAI likeness rejection. Route through a compatible character workflow before paid generation."
    },
    {
      id: "beat-3-brand",
      timing: "5.5-8.0s",
      source: "DETERMINISTIC_MASTERING",
      generation: { provider: null, model: null, references: [], humanLikeness: false },
      direction: "Dark brown/gold premium finish with subtle spice particles; composite exact official Sabra World logo and Sabra music from registered assets. Never regenerate logo typography."
    }
  ]
};

console.log("SABRA WORLD INTRO v1 — THREE-BEAT DRY RUN");
console.log("NO GENERATION REQUESTS WILL BE SENT — SPEND $0");
console.log(`MODEL ${model}`);
for (const beat of plan.beats) {
  console.log(`${beat.id} | ${beat.timing} | ${beat.source}`);
  if (beat.generation.references.length) console.log(`  CANON REFERENCES ${beat.generation.references.length}`);
  if (beat.generation.blockedFromCurrentVeoRoute) console.log("  VEO REAL-LIKENESS ROUTE BLOCKED BY DESIGN");
}
console.log("MASTERING | exact logo + Sabra music | deterministic | $0 generation spend");
console.log("INTRO DRY RUN PASS — paid generation remains disabled until Beat 2 has a compatible route");
