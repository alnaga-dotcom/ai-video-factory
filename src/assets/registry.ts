export type AssetStatus = "CANON" | "CANDIDATE" | "RETIRED";
export type AssetKind = "image" | "video" | "audio" | "logo" | "voice" | "document" | "other";
export type AssetCanonTier = "PRIMARY" | "SUPPORTING";
export type AssetRole =
  | "FACE_IDENTITY"
  | "BODY_IDENTITY"
  | "COSTUME"
  | "PROPORTIONS"
  | "EXPRESSION"
  | "POSE"
  | "ACTION"
  | "DETAIL"
  | "BRAND"
  | "VOICE_IDENTITY"
  | "OTHER";

export interface AssetRecord {
  id: string;
  worldId: string;
  kind: AssetKind;
  status: AssetStatus;
  version: string;
  uri: string;
  sha256?: string;
  characterId?: string;
  tags?: string[];
  notes?: string;
  role?: AssetRole;
  canonTier?: AssetCanonTier;
}

export interface AssetQuery {
  worldId?: string;
  kind?: AssetKind;
  status?: AssetStatus;
  characterId?: string;
  tags?: string[];
  role?: AssetRole;
  canonTier?: AssetCanonTier;
}

export interface ReferenceRequest {
  worldId: string;
  characterId?: string;
  roles: readonly AssetRole[];
  includeSupporting?: boolean;
  maxPerRole?: number;
}

export class AssetRegistry {
  private readonly assets = new Map<string, AssetRecord>();

  register(asset: AssetRecord): void {
    if (!asset.id.trim()) throw new Error("Asset id is required");
    if (!asset.worldId.trim()) throw new Error(`Asset ${asset.id} requires a worldId`);
    if (!asset.version.trim()) throw new Error(`Asset ${asset.id} requires a version`);
    if (!asset.uri.trim()) throw new Error(`Asset ${asset.id} requires a uri`);
    if (asset.canonTier && asset.status !== "CANON") throw new Error(`Asset ${asset.id} has a canon tier but is not CANON`);
    if (this.assets.has(asset.id)) throw new Error(`Asset already registered: ${asset.id}`);

    const stored: AssetRecord = { ...asset };
    if (asset.tags !== undefined) stored.tags = [...asset.tags];
    this.assets.set(asset.id, stored);
  }

  require(id: string): AssetRecord {
    const asset = this.assets.get(id);
    if (!asset) throw new Error(`Unknown asset: ${id}`);
    return asset;
  }

  query(query: AssetQuery = {}): AssetRecord[] {
    return [...this.assets.values()].filter((asset) => {
      if (query.worldId && asset.worldId !== query.worldId) return false;
      if (query.kind && asset.kind !== query.kind) return false;
      if (query.status && asset.status !== query.status) return false;
      if (query.characterId && asset.characterId !== query.characterId) return false;
      if (query.role && asset.role !== query.role) return false;
      if (query.canonTier && asset.canonTier !== query.canonTier) return false;
      if (query.tags?.length && !query.tags.every((tag) => asset.tags?.includes(tag))) return false;
      return true;
    });
  }

  requireCanon(id: string): AssetRecord {
    const asset = this.require(id);
    if (asset.status !== "CANON") throw new Error(`Asset ${id} is ${asset.status}, not CANON`);
    return asset;
  }

  resolveCanon(ids: readonly string[]): AssetRecord[] {
    return ids.map((id) => this.requireCanon(id));
  }

  resolveReferences(request: ReferenceRequest): AssetRecord[] {
    const includeSupporting = request.includeSupporting ?? true;
    const maxPerRole = request.maxPerRole ?? 2;
    if (maxPerRole < 1) throw new Error("maxPerRole must be at least 1");

    const resolved: AssetRecord[] = [];
    const seenHashes = new Set<string>();
    const seenIds = new Set<string>();

    for (const role of request.roles) {
      const matches = this.query({
        worldId: request.worldId,
        status: "CANON",
        ...(request.characterId ? { characterId: request.characterId } : {}),
        role,
      })
        .filter((asset) => includeSupporting || asset.canonTier !== "SUPPORTING")
        .sort((a, b) => tierRank(a.canonTier) - tierRank(b.canonTier) || a.id.localeCompare(b.id));

      let selectedForRole = 0;
      for (const asset of matches) {
        if (selectedForRole >= maxPerRole) break;
        if (seenIds.has(asset.id)) continue;
        if (asset.sha256 && seenHashes.has(asset.sha256)) continue;
        resolved.push(asset);
        seenIds.add(asset.id);
        if (asset.sha256) seenHashes.add(asset.sha256);
        selectedForRole += 1;
      }
    }

    return resolved;
  }
}

function tierRank(tier: AssetCanonTier | undefined): number {
  if (tier === "PRIMARY") return 0;
  if (tier === "SUPPORTING") return 1;
  return 2;
}
