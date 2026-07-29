import { readFile } from "node:fs/promises";
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} in .env`);
  return value;
}

await loadEnv();

const storageHost = process.env.BUNNY_STORAGE_HOST?.trim();
const provider = new BunnyStorageProvider({
  storageZone: required("BUNNY_STORAGE_ZONE"),
  accessKey: required("BUNNY_STORAGE_ACCESS_KEY"),
  cdnBaseUrl: required("BUNNY_CDN_BASE_URL"),
  ...(storageHost ? { storageHost } : {}),
});

const key = `_factory-health/storage-test-${Date.now()}.txt`;
const body = new TextEncoder().encode(`AI Video Factory Bunny storage test ${new Date().toISOString()}\n`);
let uploaded = false;

try {
  const stored = await provider.upload({ key, body, contentType: "text/plain; charset=utf-8" });
  uploaded = true;
  console.log(`UPLOAD PASS: ${stored.uri}`);

  const response = await fetch(stored.uri, { cache: "no-store" });
  if (!response.ok) throw new Error(`CDN verification failed (${response.status} ${response.statusText})`);
  const downloaded = new Uint8Array(await response.arrayBuffer());
  if (downloaded.length !== body.length || !downloaded.every((value, index) => value === body[index])) {
    throw new Error("CDN verification failed: downloaded content does not match upload");
  }
  console.log("CDN VERIFY PASS");
} finally {
  if (uploaded) {
    await provider.delete(key);
    console.log("DELETE PASS");
  }
}

console.log("BUNNY STORAGE SMOKE TEST PASS");
