import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { loadAssetRegistryFromFile } from "../dist/assets/loader.js";
import { VeoVideoProvider } from "../dist/providers/veo-provider.js";
import { BunnyStorageProvider } from "../dist/storage/bunny-storage-provider.js";

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
function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} in .env`);
  return value;
}

await loadEnv();
const apiKey = required("GEMINI_API_KEY");
const storageHost = process.env.BUNNY_STORAGE_HOST?.trim();
const storage = new BunnyStorageProvider({
  storageZone: required("BUNNY_STORAGE_ZONE"), accessKey: required("BUNNY_STORAGE_ACCESS_KEY"),
  cdnBaseUrl: required("BUNNY_CDN_BASE_URL"), ...(storageHost ? { storageHost } : {}),
});
const registry = await loadAssetRegistryFromFile("data/worlds/sabra-world/sabra-assets.canon.json");
const assets = registry.resolveReferences({ worldId: "sabra-world", characterId: "sabra", roles: ["FACE_IDENTITY", "BODY_IDENTITY", "COSTUME", "EXPRESSION", "PROPORTIONS"], includeSupporting: true, maxPerRole: 2 });
const shot = {
  id: "intro-v1", sceneId: "sabra-world-brand-intro", kind: "character", durationSeconds: 8,
  characters: ["sabra"],
  action: "Create one cinematic 8-second Sabra World brand intro with three balanced beats: first, a warm Egyptian Nile sunrise and palms establishing Sabra's world; second, transition naturally to Sabra in her rustic outdoor kitchen wearing a light beige apron, adding fresh herbs to a steaming clay dish, then looking toward camera with a warm confident smile; third, finish on an elegant dark brown and metallic-gold space with subtle floating spice particles, leaving a clean centered area for the official Sabra World logo to be composited in post-production.",
  emotionalIntent: "warm, exciting, authentic, premium, welcoming",
  eyeContactTarget: "camera", status: "generating",
};
const model = process.env.VEO_MODEL || "veo-3.1-generate-preview";
const provider = new VeoVideoProvider({ apiKey, model });
const prompt = `${shot.action} Timing: beat one approximately 0-2s, beat two 2-5.5s, beat three 5.5-8s. Maintain Sabra's exact facial identity, apparent age, body proportions and natural Egyptian appearance from CANON references. Her apron is light beige for strong contrast with her black embroidered dress and scarf. Cinematic golden-hour lighting, restrained premium camera movement, realistic anatomy and hands, stable clothing and face, seamless transitions. Do not generate any logo, letters, Arabic text, English text, captions, watermark or fake branding; the official logo and Sabra music will be composited later from exact assets.`;
console.log("SABRA WORLD INTRO v1 — REAL VEO GENERATION");
console.log("8s | PREMIUM | CANDIDATE | generation may incur Gemini API charges");
const result = await provider.generate({ shot, prompt, modelTier: "premium", referenceAssetIds: assets.map((a) => a.id), referenceAssets: assets });
const sourceResponse = await fetch(result.assetId, { headers: { "x-goog-api-key": apiKey } });
if (!sourceResponse.ok) throw new Error(`Gemini video download failed (${sourceResponse.status} ${sourceResponse.statusText})`);
const videoBytes = new Uint8Array(await sourceResponse.arrayBuffer());
if (!videoBytes.byteLength) throw new Error("Gemini returned an empty intro video");
const sha256 = createHash("sha256").update(videoBytes).digest("hex");
const generatedAt = new Date();
const stamp = generatedAt.toISOString().replace(/[:.]/g, "-");
const key = `worlds/sabra-world/brand/intro/candidates/${stamp}-${sha256.slice(0,12)}.mp4`;
const stored = await storage.upload({ key, body: videoBytes, contentType: sourceResponse.headers.get("content-type")?.split(";")[0] || "video/mp4" });
const assetRecord = {
  id: `sabra-world-intro-v1-${sha256.slice(0,12)}`, worldId: "sabra-world", kind: "video", status: "CANDIDATE", version: "1", uri: stored.uri, sha256,
  tags: ["brand", "intro", "generated", "veo", "candidate", "8s"],
  notes: "Sabra World Intro v1 visual candidate. Official logo and Sabra music intentionally reserved for deterministic post-production after visual approval.",
  generation: { provider: result.provider, model: result.model, durationSeconds: result.durationSeconds, generatedAt: generatedAt.toISOString(), sceneId: shot.sceneId, shotId: shot.id, prompt, referenceAssetIds: assets.map((a) => a.id) },
};
await mkdir("data/worlds/sabra-world/generated", { recursive: true });
const recordPath = `data/worlds/sabra-world/generated/${assetRecord.id}.json`;
await writeFile(recordPath, `${JSON.stringify(assetRecord, null, 2)}\n`, "utf8");
console.log("INTRO GENERATION + PRESERVE PASS");
console.log(`VIDEO ${stored.uri}`);
console.log(`ASSET RECORD ${recordPath}`);
console.log("STATUS CANDIDATE — visual approval required before logo/music mastering and CANON promotion");
