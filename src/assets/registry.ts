export type AssetStatus = "CANON" | "CANDIDATE" | "RETIRED";
export type AssetKind = "image" | "video" | "audio" | "logo" | "voice" | "document" | "other";

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
}

export interface AssetQuery {
  worldId?: string;
  kind?: AssetKind;
  status?: AssetStatus;
  characterId?: string;
  tags?: string[];
}

export class AssetRegistry {
  private readonly assets = new Map<string, AssetRecord>();

  register(asset: AssetRecord): void {
    if (!asset.id.trim()) throw new Error("Asset id is required");
    if (!asset.worldId.trim()) throw new Error(`Asset ${asset.id} requires a worldId`);
    if (!asset.version.trim()) throw new Error(`Asset ${asset.id} requires a version`);
    if (!asset.uri.trim()) throw new Error(`Asset ${asset.id} requires a uri`);
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
}
