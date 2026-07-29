import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { basename, extname, relative, resolve, sep } from "node:path";
import { BunnyStorageProvider } from "../dist/storage/bunny-storage-provider.js";

const MEDIA_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp3", ".wav", ".m4a", ".mp4", ".mov", ".webm"]);

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

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && MEDIA_EXTENSIONS.has(extname(entry.name).toLowerCase())) files.push(path);
  }
  return files;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "asset";
}

function kindFor(ext) {
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) return "image";
  if ([".mp3", ".wav", ".m4a"].includes(ext)) return "audio";
  if ([".mp4", ".mov", ".webm"].includes(ext)) return "video";
  return "other";
}

function contentType(ext) {
  return ({
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
    ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm",
  })[ext] ?? "application/octet-stream";
}

await loadEnv();

const [cliSourceArg, worldId = "sabra-world", characterId = "sabra"] = process.argv.slice(2);
const sourceArg = process.env.SABRA_ASSET_PATH?.trim() || cliSourceArg;
if (!sourceArg) {
  throw new Error("Missing asset source path. Set SABRA_ASSET_PATH or pass a folder path as the first argument.");
}

const sourceRoot = resolve(sourceArg);
const storageHost = process.env.BUNNY_STORAGE_HOST?.trim();
const provider = new BunnyStorageProvider({
  storageZone: required("BUNNY_STORAGE_ZONE"), accessKey: required("BUNNY_STORAGE_ACCESS_KEY"), cdnBaseUrl: required("BUNNY_CDN_BASE_URL"),
  ...(storageHost ? { storageHost } : {}),
});

const files = (await walk(sourceRoot)).sort();
if (!files.length) throw new Error(`No supported media files found under ${sourceRoot}`);
console.log(`Source: ${sourceRoot}`);
console.log(`Found ${files.length} media file(s). Publishing as CANDIDATE...`);

const assets = [];
for (const file of files) {
  const body = new Uint8Array(await readFile(file));
  const hash = createHash("sha256").update(body).digest("hex");
  const rel = relative(sourceRoot, file).split(sep).join("/");
  const ext = extname(file).toLowerCase();
  const stem = basename(file, ext);
  const id = `${characterId}-${slug(rel.slice(0, -ext.length))}-${hash.slice(0, 8)}`;
  const key = `worlds/${worldId}/characters/${characterId}/source/${hash.slice(0, 12)}-${slug(stem)}${ext}`;
  const stored = await provider.upload({ key, body, contentType: contentType(ext) });
  assets.push({ id, worldId, kind: kindFor(ext), status: "CANDIDATE", version: "1.0.0", uri: stored.uri, sha256: hash, characterId, tags: ["source-library", "bulk-import"], notes: `Imported from ${rel}. Promote to CANON only after explicit approval.` });
  console.log(`UPLOAD ${rel} -> ${stored.uri}`);
}

const output = { version: "1.0", worldId, characterId, sourceRoot, publishedAt: new Date().toISOString(), assets };
const outputPath = resolve(`data/worlds/${worldId}/${characterId}-bulk-assets.generated.json`);
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`MANIFEST ${outputPath}`);
console.log(`PUBLISHED ${assets.length} asset(s) as CANDIDATE`);
