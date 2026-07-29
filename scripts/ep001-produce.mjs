import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { loadAssetRegistryFromFile } from "../dist/assets/loader.js";
import { VeoVideoProvider } from "../dist/providers/veo-provider.js";
import { BunnyStorageProvider } from "../dist/storage/bunny-storage-provider.js";

async function loadEnv(path = ".env") {
  const text = await readFile(path, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim(); if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("="); if (i < 1) continue;
    const key = line.slice(0, i).trim(); let value = line.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}
function required(name) { const v = process.env[name]?.trim(); if (!v) throw new Error(`Missing ${name} in .env`); return v; }

await loadEnv();
const apiKey = required("GEMINI_API_KEY");
const storageHost = process.env.BUNNY_STORAGE_HOST?.trim();
const storage = new BunnyStorageProvider({ storageZone: required("BUNNY_STORAGE_ZONE"), accessKey: required("BUNNY_STORAGE_ACCESS_KEY"), cdnBaseUrl: required("BUNNY_CDN_BASE_URL"), ...(storageHost ? { storageHost } : {}) });
const provider = new VeoVideoProvider({ apiKey, model: process.env.VEO_MODEL || "veo-3.1-generate-preview" });
const registry = await loadAssetRegistryFromFile("data/worlds/sabra-world/sabra-assets.canon.json");
const sabraAssets = registry.resolveReferences({ worldId: "sabra-world", characterId: "sabra", roles: ["FACE_IDENTITY", "BODY_IDENTITY", "COSTUME", "EXPRESSION", "PROPORTIONS"], includeSupporting: true, maxPerRole: 2 });
const plan = JSON.parse(await readFile("staging/sabra-world/episodes/EP001/visual/EP001-visual-plan.json", "utf8"));
const generatedDir = "data/worlds/sabra-world/generated";
await mkdir(generatedDir, { recursive: true });
await mkdir("staging/sabra-world/episodes/EP001/visual", { recursive: true });

const base = "Cinematic realistic Egyptian visual storytelling, authentic rural environments, natural skin and anatomy, stable hands and clothing, restrained premium camera movement, warm photographic lighting. No text, captions, logos, watermark, fake branding, or generated dialogue. The approved narration will be added in post-production.";
const scenePrompts = {
  S01: "Present-day Sabra at her village home. She naturally turns toward camera with a warm confident expression as if beginning a personal story. Intimate medium cinematic coverage; lively but grounded energy; never presenter-like.",
  S02: "Evocative Upper Egypt memory montage: Nile sunrise, fertile fields, palms, village lanes, modest family-home details, childhood atmosphere and community warmth. No identifiable featured protagonist; this is memory imagery and environmental storytelling.",
  S03: "A respectful young Egyptian rural married couple beginning their life together, symbolic transition from Upper Egypt toward villages south of Giza: simple household beginnings, travel details, fields and Nile geography. They are fictional people, not depictions of real persons or celebrities.",
  S04: "Montage of years of Egyptian family life: Nile water, agricultural land, home cooking, children growing, work, celebrations, ordinary hardship, laughter and a warm multigenerational home. Focus on hands, places, food and family moments; natural passage-of-time feeling.",
  S05: "Present-day Sabra in her home environment, expressive and naturally witty, warmly engaging camera as she promises authentic stories and delicious Egyptian food. Medium and close cinematic coverage, restrained gestures, strong stable identity.",
  S06: "Present-day Sabra closes directly to camera with a warm playful expression suggesting the story is only beginning. End with a clean composed visual beat and negative space suitable for deterministic Sabra World branding in post-production."
};

const only = process.argv.find(a => a.startsWith("--scene="))?.split("=",2)[1]?.toUpperCase();
const scenes = only ? plan.scenes.filter(s => s.id === only) : plan.scenes;
if (!scenes.length) throw new Error(`No scene matched ${only}`);

async function produce(scene) {
  const usesCanon = ["CANON_REFERENCE_REQUIRED", "CONTROLLED_CHARACTER_REFERENCES"].includes(scene.route) || (scene.route === "MIXED" && scene.id === "S04" ? false : false);
  const refs = usesCanon ? sabraAssets : [];
  const shot = { id: `ep001-${scene.id.toLowerCase()}-v1`, sceneId: `EP001-${scene.id}`, kind: usesCanon ? "character" : "broll", durationSeconds: 8, characters: usesCanon ? ["sabra"] : [], action: scenePrompts[scene.id], emotionalIntent: "warm, authentic, cinematic, engaging", eyeContactTarget: usesCanon ? "camera" : "none", status: "generating" };
  const identity = usesCanon ? " Maintain Sabra's exact facial identity, apparent age, body proportions, natural Egyptian appearance and established costume from CANON references." : "";
  const prompt = `${scenePrompts[scene.id]} ${base}${identity}`;
  console.log(`GENERATING ${scene.id} | ${scene.route} | refs ${refs.length}`);
  try {
    const result = await provider.generate({ shot, prompt, modelTier: "premium", referenceAssetIds: refs.map(a => a.id), referenceAssets: refs });
    const response = await fetch(result.assetId, { headers: { "x-goog-api-key": apiKey } });
    if (!response.ok) throw new Error(`Gemini video download failed (${response.status} ${response.statusText})`);
    const bytes = new Uint8Array(await response.arrayBuffer()); if (!bytes.byteLength) throw new Error("Gemini returned empty video");
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const generatedAt = new Date(); const stamp = generatedAt.toISOString().replace(/[:.]/g, "-");
    const key = `worlds/sabra-world/episodes/EP001/candidates/${scene.id}/${stamp}-${sha256.slice(0,12)}.mp4`;
    const stored = await storage.upload({ key, body: bytes, contentType: response.headers.get("content-type")?.split(";")[0] || "video/mp4" });
    const record = { id: `sabra-world-EP001-${scene.id}-${sha256.slice(0,12)}`, worldId: "sabra-world", episodeId: "EP001", sceneId: scene.id, kind: "video", status: "CANDIDATE", version: "1", uri: stored.uri, sha256, tags: ["episode", "EP001", scene.id, "generated", "veo", "candidate"], generation: { provider: result.provider, model: result.model, durationSeconds: result.durationSeconds, generatedAt: generatedAt.toISOString(), prompt, route: scene.route, referenceAssetIds: refs.map(a => a.id) } };
    const recordPath = `${generatedDir}/${record.id}.json`; await writeFile(recordPath, JSON.stringify(record, null, 2) + "\n", "utf8");
    console.log(`PASS ${scene.id} ${stored.uri}`); return { sceneId: scene.id, status: "PASS", uri: stored.uri, recordPath };
  } catch (error) {
    const message = error?.stack || error?.message || String(error); console.error(`FAIL ${scene.id} ${error?.message || error}`);
    return { sceneId: scene.id, status: "FAIL", error: message };
  }
}

console.log("SABRA WORLD EP001 — VEO BATCH PRODUCTION");
console.log(`${scenes.length} scene(s) | PREMIUM | CANDIDATES | PAID GENERATION`);
const concurrency = Math.max(1, Math.min(Number(process.env.EP001_VEO_CONCURRENCY || 2), scenes.length));
const results = [];
for (let i = 0; i < scenes.length; i += concurrency) results.push(...await Promise.all(scenes.slice(i, i + concurrency).map(produce)));
const report = { episode: "EP001", generatedAt: new Date().toISOString(), concurrency, results };
const reportPath = "staging/sabra-world/episodes/EP001/visual/EP001-generation-report.json";
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
const passed = results.filter(r => r.status === "PASS").length; const failed = results.length - passed;
console.log(`EP001 BATCH COMPLETE — PASS ${passed}/${results.length} | FAIL ${failed}/${results.length}`);
console.log(`REPORT ${reportPath}`);
if (failed) { console.log("Successful candidates were preserved. Retry only failed scenes with: npm run ep001:produce -- --scene=SXX"); process.exitCode = 2; }
else console.log("STATUS CANDIDATES — QC required before mastering");
