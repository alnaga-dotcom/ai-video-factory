import { readFile } from "node:fs/promises";
import { AssetRegistry, type AssetRecord } from "./registry.js";

interface AssetManifest {
  worldId?: string;
  assets?: unknown;
}

export async function loadAssetRegistryFromFile(path: string): Promise<AssetRegistry> {
  const raw = await readFile(path, "utf8");
  const manifest = JSON.parse(raw) as AssetManifest;
  if (!Array.isArray(manifest.assets)) throw new Error(`Invalid asset manifest: ${path}`);

  const registry = new AssetRegistry();
  for (const value of manifest.assets) {
    registry.register(parseAssetRecord(value, path));
  }
  return registry;
}

function parseAssetRecord(value: unknown, source: string): AssetRecord {
  if (!value || typeof value !== "object") throw new Error(`Invalid asset record in ${source}`);
  const asset = value as Record<string, unknown>;
  for (const field of ["id", "worldId", "kind", "status", "version", "uri"] as const) {
    if (typeof asset[field] !== "string" || !asset[field]) throw new Error(`Asset missing ${field} in ${source}`);
  }

  return asset as unknown as AssetRecord;
}
