import type { AssetRecord, AssetRegistry } from "../assets/registry.js";
import type { EpisodeSpec } from "../domain/contracts.js";

export interface ShotAssetPlan {
  shotId: string;
  characterId: string;
  references: AssetRecord[];
}

export interface EpisodeAssetPlan {
  episodeId: string;
  shots: ShotAssetPlan[];
  uniqueAssetIds: string[];
}

export function resolveEpisodeAssets(registry: AssetRegistry, episode: EpisodeSpec, worldId: string): EpisodeAssetPlan {
  const shots: ShotAssetPlan[] = [];
  const unique = new Set<string>();
  for (const scene of episode.scenes) {
    for (const shot of scene.shots) {
      for (const characterId of shot.characters) {
        const references = registry.resolveReferences({
          worldId,
          characterId,
          roles: ["FACE_IDENTITY", "BODY_IDENTITY", "COSTUME"],
          includeSupporting: false,
          maxPerRole: 1,
        });
        for (const asset of references) unique.add(asset.id);
        shots.push({ shotId: shot.id, characterId, references });
      }
    }
  }
  return { episodeId: episode.id, shots, uniqueAssetIds: [...unique] };
}
