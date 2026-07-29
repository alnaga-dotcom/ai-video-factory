import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
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
const sourceUri = process.argv[2]?.trim();
if (!sourceUri) throw new Error('Usage: npm run video:preserve -- "<Gemini video URL>"');
if (!sourceUri.startsWith("https://generativelanguage.googleapis.com/")) throw new Error("Refusing non-Gemini source URL");

const apiKey = required("GEMINI_API_KEY");
const storageHost = process.env.BUNNY_STORAGE_HOST?.trim();
const storage = new BunnyStorageProvider({
  storageZone: required("BUNNY_STORAGE_ZONE"),
  accessKey: required("BUNNY_STORAGE_ACCESS_KEY"),
  cdnBaseUrl: required("BUNNY_CDN_BASE_URL"),
  ...(storageHost ? { storageHost } : {}),
});

console.log("DOWNLOADING EXISTING GEMINI VIDEO — NO GENERATION REQUEST WILL BE SENT");
const response = await fetch(sourceUri, { headers: { "x-goog-api-key": apiKey } });
if (!response.ok) throw new Error(`Gemini video download failed (${response.status} ${response.statusText})`);
const bytes = new Uint8Array(await response.arrayBuffer());
if (bytes.byteLength === 0) throw new Error("Gemini returned an empty video file");
const contentType = response.headers.get("content-type")?.split(";")[0] || "video/mp4";
const sha256 = createHash("sha256").update(bytes).digest("hex");
const preservedAt = new Date();
const stamp = preservedAt.toISOString().replace(/[:.]/g, "-");
const key = `worlds/sabra-world/characters/sabra/generated/sabra-pilot-01/shot-1/${stamp}-${sha256.slice(0, 12)}.mp4`;
const stored = await storage.upload({ key, body: bytes, contentType });

const verify = await fetch(stored.uri, { cache: "no-store" });
if (!verify.ok) throw new Error(`Bunny CDN verification failed (${verify.status} ${verify.statusText})`);
const verified = new Uint8Array(await verify.arrayBuffer());
const verifiedHash = createHash("sha256").update(verified).digest("hex");
if (verified.byteLength !== bytes.byteLength || verifiedHash !== sha256) throw new Error("Bunny CDN verification failed: stored video differs from Gemini output");

const id = `sabra-sabra-pilot-01-shot-1-${sha256.slice(0, 12)}`;
const record = {
  id,
  worldId: "sabra-world",
  characterId: "sabra",
  kind: "video",
  status: "CANDIDATE",
  version: "1",
  uri: stored.uri,
  sha256,
  tags: ["generated", "veo", "pilot", "sabra-pilot-01", "shot-1", "first-success"],
  notes: "First successful Sabra Veo 3.1 generation; preserved from the original temporary Gemini file URL without regeneration.",
  generation: {
    provider: "veo",
    model: "veo-3.1-generate-preview",
    durationSeconds: 8,
    preservedAt: preservedAt.toISOString(),
    sceneId: "sabra-pilot-01",
    shotId: "shot-1"
  }
};
await mkdir("data/worlds/sabra-world/generated", { recursive: true });
const recordPath = `data/worlds/sabra-world/generated/${id}.json`;
await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

console.log("PRESERVE PASS");
console.log(`VIDEO ${stored.uri}`);
console.log(`SIZE ${stored.sizeBytes} bytes`);
console.log(`SHA256 ${sha256}`);
console.log(`ASSET RECORD ${recordPath}`);
console.log("STATUS CANDIDATE");
