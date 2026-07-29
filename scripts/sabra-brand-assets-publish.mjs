import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
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
function required(name) { const value = process.env[name]?.trim(); if (!value) throw new Error(`Missing ${name} in .env`); return value; }

await loadEnv();
const root = resolve("staging/sabra-world/brand");
const specs = [
  { file: "logo.png", id: "sabra-world-logo-v1", kind: "image", role: "BRAND_LOGO", contentType: "image/png" },
  { file: "intro-music.m4a", id: "sabra-world-intro-music-v1", kind: "audio", role: "INTRO_MUSIC", contentType: "audio/mp4" },
  { file: "sabra-laugh.m4a", id: "sabra-laugh-v1", kind: "audio", role: "CHARACTER_LAUGH", contentType: "audio/mp4" },
];
const storageHost = process.env.BUNNY_STORAGE_HOST?.trim();
const storage = new BunnyStorageProvider({ storageZone: required("BUNNY_STORAGE_ZONE"), accessKey: required("BUNNY_STORAGE_ACCESS_KEY"), cdnBaseUrl: required("BUNNY_CDN_BASE_URL"), ...(storageHost ? { storageHost } : {}) });
const assets = [];
for (const spec of specs) {
  const body = new Uint8Array(await readFile(resolve(root, spec.file)));
  const sha256 = createHash("sha256").update(body).digest("hex");
  const key = `worlds/sabra-world/brand/source/${sha256.slice(0,12)}-${spec.file}`;
  const stored = await storage.upload({ key, body, contentType: spec.contentType });
  assets.push({ id: spec.id, worldId: "sabra-world", kind: spec.kind, role: spec.role, status: "CANDIDATE", version: "1.0.0", uri: stored.uri, sha256, tags: ["brand", "mastering", spec.role.toLowerCase()], notes: `Approved source supplied for Sabra World mastering; publish as CANDIDATE until mastered intro approval.` });
  console.log(`UPLOAD ${spec.file} -> ${stored.uri}`);
}
await mkdir("data/worlds/sabra-world", { recursive: true });
const path = "data/worlds/sabra-world/brand-assets.generated.json";
await writeFile(path, `${JSON.stringify({ version: "1.0", worldId: "sabra-world", publishedAt: new Date().toISOString(), assets }, null, 2)}\n`, "utf8");
console.log(`MANIFEST ${path}`);
console.log("BRAND ASSET PUBLISH PASS — 3 CANDIDATE assets | generation spend $0");
