import type { AssetRecord, AssetRole } from "../assets/registry.js";

const ROLE_PRIORITY: readonly AssetRole[] = [
  "FACE_IDENTITY",
  "BODY_IDENTITY",
  "COSTUME",
  "PROPORTIONS",
  "EXPRESSION",
  "POSE",
  "ACTION",
  "DETAIL",
];

/** Select at most three identity-safe CANON images for Veo reference-image input. */
export function selectVeoReferences(assets: readonly AssetRecord[], limit = 3): AssetRecord[] {
  if (limit < 1 || limit > 3) throw new Error("Veo reference limit must be between 1 and 3");

  const candidates = assets
    .filter((asset) => asset.status === "CANON" && asset.kind === "image" && asset.role !== "BRAND")
    .sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));

  const selected: AssetRecord[] = [];
  const seenRoles = new Set<AssetRole>();
  const seenHashes = new Set<string>();

  // First pass: maximize semantic coverage across the highest-priority roles.
  for (const role of ROLE_PRIORITY) {
    const asset = candidates.find((item) => item.role === role && !isDuplicate(item, seenHashes));
    if (!asset) continue;
    selected.push(asset);
    seenRoles.add(role);
    if (asset.sha256) seenHashes.add(asset.sha256);
    if (selected.length === limit) return selected;
  }

  // Second pass: fill any remaining slots by score.
  for (const asset of candidates) {
    if (selected.includes(asset) || isDuplicate(asset, seenHashes)) continue;
    selected.push(asset);
    if (asset.role) seenRoles.add(asset.role);
    if (asset.sha256) seenHashes.add(asset.sha256);
    if (selected.length === limit) break;
  }

  return selected;
}

function isDuplicate(asset: AssetRecord, hashes: Set<string>): boolean {
  return Boolean(asset.sha256 && hashes.has(asset.sha256));
}

function score(asset: AssetRecord): number {
  const tier = asset.canonTier === "PRIMARY" ? 100 : asset.canonTier === "SUPPORTING" ? 50 : 0;
  const roleIndex = asset.role ? ROLE_PRIORITY.indexOf(asset.role) : -1;
  const role = roleIndex >= 0 ? 40 - roleIndex : 0;
  return tier + role;
}
